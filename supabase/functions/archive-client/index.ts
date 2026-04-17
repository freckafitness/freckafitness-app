import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verify the caller is a coach
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: roleData, error: roleError } = await supabaseUser
      .from('user_roles')
      .select('role')
      .single()

    if (roleError || roleData?.role !== 'coach') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })
    }

    const { client_id } = await req.json()
    if (!client_id) {
      return new Response(JSON.stringify({ error: 'client_id required' }), { status: 400, headers: corsHeaders })
    }

    // Fetch client to get auth_user_id
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, status, auth_user_id')
      .eq('id', client_id)
      .single()

    if (clientError || !client) {
      return new Response(JSON.stringify({ error: 'Client not found' }), { status: 404, headers: corsHeaders })
    }

    if (client.status === 'inactive') {
      return new Response(JSON.stringify({ error: 'Client is already archived' }), { status: 400, headers: corsHeaders })
    }

    // Set status inactive
    await supabaseAdmin
      .from('clients')
      .update({ status: 'inactive' })
      .eq('id', client_id)

    // Ban the auth user so they can't log in — 876600h ≈ 100 years (reversible)
    if (client.auth_user_id) {
      await supabaseAdmin.auth.admin.updateUserById(client.auth_user_id, {
        ban_duration: '876600h',
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unexpected error' }),
      { status: 500, headers: corsHeaders }
    )
  }
})
