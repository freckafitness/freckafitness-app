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

    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const { data: roleData } = await supabaseUser.from('user_roles').select('role, client_id').single();

    let clientId: string;
    let returnUrl: string;

    if (roleData?.role === 'coach') {
      const body = await req.json().catch(() => ({}));
      clientId = body.client_id;
      if (!clientId) {
        return new Response(JSON.stringify({ error: 'client_id required' }), { status: 400, headers: corsHeaders });
      }
      returnUrl = `https://app.freckafitness.com/dashboard/client/${clientId}`;
    } else {
      clientId = roleData?.client_id;
      if (!clientId) {
        return new Response(JSON.stringify({ error: 'No client record found' }), { status: 403, headers: corsHeaders });
      }
      returnUrl = 'https://app.freckafitness.com/my';
    }

    const { data: paymentData } = await supabaseAdmin
      .from('payments')
      .select('stripe_customer_id')
      .eq('client_id', clientId)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .maybeSingle();

    if (!paymentData?.stripe_customer_id) {
      return new Response(JSON.stringify({ error: 'No Stripe customer found for this client' }), { status: 404, headers: corsHeaders });
    }

    const { data: stripeKey } = await supabaseAdmin.rpc('get_vault_secret', { secret_name: 'stripe_secret_key' });

    const session = await stripePost('billing_portal/sessions', stripeKey, {
      customer:   paymentData.stripe_customer_id,
      return_url: returnUrl,
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
