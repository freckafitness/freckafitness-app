import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14?target=deno';

Deno.serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) return new Response('Missing stripe-signature', { status: 400 });

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: stripeKey } = await supabaseAdmin.rpc('get_vault_secret', { secret_name: 'stripe_secret_key' });
  const { data: webhookSecret } = await supabaseAdmin.rpc('get_vault_secret', { secret_name: 'stripe_webhook_secret' });
  const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const clientId = session.metadata?.client_id;
      if (!clientId) break;

      if (session.mode === 'subscription' && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        const item = sub.items.data[0];
        await supabaseAdmin.from('payments').upsert({
          client_id: clientId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: sub.id,
          type: 'subscription',
          status: sub.status,
          product_name: session.metadata?.product_name ?? item.price.nickname ?? '',
          amount: item.price.unit_amount,
          currency: item.price.currency,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'stripe_subscription_id' });
      } else if (session.mode === 'payment' && session.payment_intent) {
        await supabaseAdmin.from('payments').insert({
          client_id: clientId,
          stripe_customer_id: session.customer as string,
          stripe_payment_intent_id: session.payment_intent as string,
          type: 'one_time',
          status: 'succeeded',
          product_name: session.metadata?.product_name ?? '',
          amount: session.amount_total,
          currency: session.currency,
          updated_at: new Date().toISOString(),
        });
      }
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await supabaseAdmin
        .from('payments')
        .update({
          status: sub.status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', sub.id);
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
