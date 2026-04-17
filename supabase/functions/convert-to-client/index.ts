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

    // Verify the caller is a coach via their JWT
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

    const { intake_id } = await req.json()
    if (!intake_id) {
      return new Response(JSON.stringify({ error: 'intake_id required' }), { status: 400, headers: corsHeaders })
    }

    // Fetch intake
    const { data: intake, error: intakeError } = await supabaseAdmin
      .from('intakes')
      .select('id, first_name, last_name, email, phone, favorite_color, client_id')
      .eq('id', intake_id)
      .single()

    if (intakeError || !intake) {
      return new Response(JSON.stringify({ error: 'Intake not found' }), { status: 404, headers: corsHeaders })
    }

    if (intake.client_id) {
      return new Response(JSON.stringify({ error: 'Already converted' }), { status: 400, headers: corsHeaders })
    }

    // Duplicate / returning client check
    const { data: existing } = await supabaseAdmin
      .from('clients')
      .select('id, status')
      .eq('email', intake.email)
      .maybeSingle()

    if (existing?.status === 'active') {
      return new Response(
        JSON.stringify({ error: 'A client with this email already exists.' }),
        { status: 409, headers: corsHeaders }
      )
    }

    // existing?.status === 'inactive' → returning client; link back to their archived record
    const previousClientId = existing?.id ?? null

    // Create client record
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .insert({
        first_name:         intake.first_name,
        last_name:          intake.last_name,
        email:              intake.email,
        phone:              intake.phone,
        status:             'active',
        favorite_color:     intake.favorite_color,
        previous_client_id: previousClientId,
      })
      .select('id')
      .single()

    if (clientError || !client) {
      return new Response(JSON.stringify({ error: 'Failed to create client.' }), { status: 500, headers: corsHeaders })
    }

    // Link intake to client
    await supabaseAdmin
      .from('intakes')
      .update({ client_id: client.id })
      .eq('id', intake_id)

    // Send invite email — non-fatal if it fails (client record already created)
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      intake.email,
      { redirectTo: 'https://app.freckafitness.com/set-password' }
    )

    if (inviteError || !inviteData?.user) {
      console.error('inviteUserByEmail failed:', JSON.stringify(inviteError))
      return new Response(JSON.stringify({
        client_id:    client.id,
        invite_sent:  false,
        invite_error: inviteError?.message ?? 'Unknown error',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const authUserId = inviteData.user.id

    // Set auth_user_id on client + insert user_roles
    await Promise.all([
      supabaseAdmin
        .from('clients')
        .update({ auth_user_id: authUserId })
        .eq('id', client.id),
      supabaseAdmin
        .from('user_roles')
        .insert({ user_id: authUserId, role: 'client', client_id: client.id }),
    ])

    return new Response(JSON.stringify({
      client_id:          client.id,
      invite_sent:        true,
      returning_client:   previousClientId !== null,
      previous_client_id: previousClientId,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unexpected error' }),
      { status: 500, headers: corsHeaders }
    )
  }
})
