import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    const products = await stripe.products.list({ active: true, limit: 100 });
    const prices   = await stripe.prices.list({ active: true, limit: 100 });

    const result = products.data
      .map(product => ({
        id:       product.id,
        name:     product.name,
        prices:   prices.data
          .filter(p => p.product === product.id)
          .map(p => ({
            id:       p.id,
            amount:   p.unit_amount,
            currency: p.currency,
            interval: p.recurring?.interval ?? null,
            mode:     p.recurring ? 'subscription' : 'payment',
          })),
      }))
      .filter(p => p.prices.length > 0);

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
