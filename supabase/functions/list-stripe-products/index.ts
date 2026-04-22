import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function stripeGet(path: string, key: string) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? `Stripe error ${res.status}`);
  }
  return res.json();
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
    const { data: roleData } = await supabaseUser.from('user_roles').select('role').single();
    if (roleData?.role !== 'coach') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
    }

    const { data: stripeKey } = await supabaseAdmin.rpc('get_vault_secret', { secret_name: 'stripe_secret_key' });

    const [productsRes, pricesRes] = await Promise.all([
      stripeGet('products?active=true&limit=100', stripeKey),
      stripeGet('prices?active=true&limit=100', stripeKey),
    ]);

    const result = productsRes.data
      .map((product: any) => ({
        id:     product.id,
        name:   product.name,
        prices: pricesRes.data
          .filter((p: any) => p.product === product.id)
          .map((p: any) => ({
            id:       p.id,
            amount:   p.unit_amount,
            currency: p.currency,
            interval: p.recurring?.interval ?? null,
            mode:     p.recurring ? 'subscription' : 'payment',
          })),
      }))
      .filter((p: any) => p.prices.length > 0);

    return new Response(JSON.stringify({ products: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
