import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function stripePost(path: string, key: string, params: Record<string, string>) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? `Stripe error ${res.status}`);
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: roleData, error: roleError } = await supabaseUser.from('user_roles').select('role').single();
    if (roleError || roleData?.role !== 'coach') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
    }

    const { client_id, price_id, product_name, mode } = await req.json();
    if (!client_id || !price_id) {
      return new Response(JSON.stringify({ error: 'client_id and price_id required' }), { status: 400, headers: corsHeaders });
    }

    const { data: stripeKey, error: vaultError } = await supabaseAdmin.rpc('get_vault_secret', { secret_name: 'stripe_secret_key' });
    if (vaultError || !stripeKey) {
      return new Response(JSON.stringify({ error: `Vault error: ${vaultError?.message ?? 'empty key'}` }), { status: 500, headers: corsHeaders });
    }

    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, first_name, last_name, email')
      .eq('id', client_id)
      .single();

    if (clientError || !client) {
      return new Response(JSON.stringify({ error: `Client not found: ${clientError?.message ?? client_id}` }), { status: 404, headers: corsHeaders });
    }

    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('stripe_customer_id')
      .eq('client_id', client_id)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .maybeSingle();

    let customerId = existingPayment?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripePost('customers', stripeKey, {
        name:                           `${client.first_name} ${client.last_name}`,
        email:                          client.email ?? '',
        'metadata[supabase_client_id]': client_id,
      });
      customerId = customer.id;
    }

    const session = await stripePost('checkout/sessions', stripeKey, {
      customer:                  customerId,
      'line_items[0][price]':    price_id,
      'line_items[0][quantity]': '1',
      mode:                      mode ?? 'subscription',
      success_url:               'https://app.freckafitness.com/dashboard',
      cancel_url:                'https://app.freckafitness.com/dashboard',
      'metadata[client_id]':     client_id,
      'metadata[product_name]':  product_name ?? '',
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
