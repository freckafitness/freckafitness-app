import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const { data: roleData } = await supabaseUser.from('user_roles').select('role, client_id').single();
    if (roleData?.role !== 'client' || !roleData?.client_id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
    }

    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('first_name, last_name, email')
      .eq('id', roleData.client_id)
      .single();

    if (!client) {
      return new Response(JSON.stringify({ error: 'Client not found' }), { status: 404, headers: corsHeaders });
    }

    const { data: resendKey } = await supabaseAdmin.rpc('get_vault_secret', {
      secret_name: 'resend_api_key',
    });

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    'Frecka Fitness <intake@freckafitness.com>',
        to:      ['freckafitness@gmail.com'],
        subject: `${client.first_name} ${client.last_name} has activated their account`,
        html: `
          <p>Hi Ryan,</p>
          <p><strong>${client.first_name} ${client.last_name}</strong> (${client.email}) has successfully set their password and activated their Frecka Fitness account.</p>
          <p>They can now log in at <a href="https://app.freckafitness.com">app.freckafitness.com</a>.</p>
        `,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      throw new Error(body?.message ?? `Resend error ${res.status}`);
    }

    return new Response(JSON.stringify({ sent: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
