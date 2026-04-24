import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(sigHeader.split(',').map(p => p.split('=')));
  const timestamp = parts['t'];
  const signature = parts['v1'];
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return computed === signature;
}

Deno.serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) return new Response('Missing stripe-signature', { status: 400 });

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const { data: webhookSecret } = await supabaseAdmin.rpc('get_vault_secret', { secret_name: 'stripe_webhook_secret' });

    let valid = await verifyStripeSignature(body, sig, webhookSecret);
    if (!valid) {
      const { data: testSecret } = await supabaseAdmin.rpc('get_vault_secret', { secret_name: 'stripe_webhook_secret_test' });
      valid = await verifyStripeSignature(body, sig, testSecret);
    }
    if (!valid) return new Response('Invalid signature', { status: 400 });

    const event = JSON.parse(body);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const clientId = session.metadata?.client_id;
        if (!clientId) break;

        if (session.mode === 'subscription') {
          await supabaseAdmin.from('payments').insert({
            client_id:              clientId,
            stripe_customer_id:     session.customer,
            stripe_subscription_id: session.subscription,
            type:                   'subscription',
            status:                 'active',
            product_name:           session.metadata?.product_name ?? null,
            amount:                 session.amount_total,
            currency:               session.currency,
          });
        } else {
          await supabaseAdmin.from('payments').insert({
            client_id:                  clientId,
            stripe_customer_id:         session.customer,
            stripe_payment_intent_id:   session.payment_intent,
            type:                       'one_time',
            status:                     'succeeded',
            product_name:               session.metadata?.product_name ?? null,
            amount:                     session.amount_total,
            currency:                   session.currency,
          });
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await supabaseAdmin.from('payments').update({
          status:               sub.status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end:   new Date(sub.current_period_end   * 1000).toISOString(),
          updated_at:           new Date().toISOString(),
        }).eq('stripe_subscription_id', sub.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          await supabaseAdmin.from('payments').update({
            status:     'past_due',
            updated_at: new Date().toISOString(),
          }).eq('stripe_subscription_id', invoice.subscription);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unexpected error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
