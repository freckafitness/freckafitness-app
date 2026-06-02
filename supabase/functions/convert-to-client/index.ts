import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// TODO: Replace with the TrainHeroic primer URL before deploying
const TRAINHEROIC_PRIMER_URL = 'https://trainheroic.com'

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const CHUNK = 8192
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
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

    const { intake_id, weight_unit, show_bodyweight, welcome_note } = await req.json()
    if (!intake_id) {
      return new Response(JSON.stringify({ error: 'intake_id required' }), { status: 400, headers: corsHeaders })
    }

    // Fetch intake
    const { data: intake, error: intakeError } = await supabaseAdmin
      .from('intakes')
      .select('id, first_name, last_name, email, phone, favorite_color, birthday, gender, client_id')
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
        birthday:           intake.birthday,
        gender:             intake.gender,
        weight_unit:        weight_unit ?? 'lbs',
        show_bodyweight:    show_bodyweight ?? false,
        welcome_note:       welcome_note ?? null,
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

    // Send welcome email with CSEP forms attached — non-fatal
    let welcomeEmailSent = false
    try {
      const { data: resendKey } = await supabaseAdmin.rpc('get_vault_secret', { secret_name: 'resend_api_key' })

      // Fetch blank form templates from the public form-templates storage bucket
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const [gaqRes, consentRes] = await Promise.all([
        fetch(`${supabaseUrl}/storage/v1/object/public/form-templates/ga-q.pdf`),
        fetch(`${supabaseUrl}/storage/v1/object/public/form-templates/informed-consent.pdf`),
      ])

      const attachments: { filename: string; content: string }[] = []
      if (gaqRes.ok) {
        attachments.push({
          filename: '1-CSEP-Get-Active-Questionnaire.pdf',
          content:  arrayBufferToBase64(await gaqRes.arrayBuffer()),
        })
      } else {
        console.error('Could not fetch GA-Q template:', gaqRes.status)
      }
      if (consentRes.ok) {
        attachments.push({
          filename: '2-CSEP-Informed-Consent.pdf',
          content:  arrayBufferToBase64(await consentRes.arrayBuffer()),
        })
      } else {
        console.error('Could not fetch Informed Consent template:', consentRes.status)
      }

      const emailHtml = `<!DOCTYPE html>
<html>
<head></head>
<body style="font-family: Georgia, 'Times New Roman', serif; font-size: 15px; line-height: 1.65; color: #253551; background: #ffffff; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f4f1;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; width: 100%;">
          <tr>
            <td style="background: #253551; padding: 22px 36px; border-radius: 6px 6px 0 0;">
              <p style="margin: 0; font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #c8a96e; font-family: Arial, sans-serif;">Frecka Fitness</p>
            </td>
          </tr>
          <tr>
            <td style="background: #ffffff; padding: 36px 36px 32px; border: 1px solid #e8e4dc; border-top: none; border-radius: 0 0 6px 6px;">
              <p style="margin: 0 0 20px;">Hi ${intake.first_name},</p>
              <p style="margin: 0 0 20px;">I appreciate you taking the time to meet with me and sharing so many aspects of your life. I learned a lot and am excited to support your journey.</p>
              <p style="margin: 0 0 20px;">There are some forms attached (we all love forms, right?).</p>

              <p style="margin: 0 0 14px; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #6a7080; font-family: Arial, sans-serif;">Summary of Attached Items</p>

              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 10px;">
                <tr><td style="background: #f9f8f6; border: 1px solid #e8e4dc; border-radius: 5px; padding: 14px 18px;">
                  <p style="margin: 0 0 5px; font-weight: 700; font-size: 14px; color: #253551;">1 — CSEP Get Active Questionnaire</p>
                  <p style="margin: 0; font-size: 14px; color: #6a7080;">There's some redundancy here, since we've already covered some of these questions in the intake. I've included a brief, straightforward medical screening (required by my insurance).</p>
                </td></tr>
              </table>
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                <tr><td style="background: #f9f8f6; border: 1px solid #e8e4dc; border-radius: 5px; padding: 14px 18px;">
                  <p style="margin: 0 0 5px; font-weight: 700; font-size: 14px; color: #253551;">2 — CSEP Informed Consent</p>
                  <p style="margin: 0; font-size: 14px; color: #6a7080;">Consent form for engaging in increasing your level of physical activity, general risks, and expectations.</p>
                </td></tr>
              </table>

              <p style="margin: 0 0 20px;">There is also a witness for informed consent, which is technically no longer required by CSEP, but I prefer to have it completed when possible, if not too inconvenient. I'll sign as the 'Exercise Professional' after and return the fully completed form if you would like to hold a copy for your records.</p>
              <p style="margin: 0 0 20px;">All information is held in confidence and securely stored.</p>
              <p style="margin: 0 0 20px;">It's worth watching the <a href="${TRAINHEROIC_PRIMER_URL}" style="color: #c8a96e;">TrainHeroic primer for logging a session</a> to familiarize yourself. TrainHeroic will likely continue to prompt you to purchase Athlete Pro in the app, but you do not need to purchase it to log sessions or receive custom programming.</p>
              <p style="margin: 0 0 20px;">If you have any questions or concerns, please don't hesitate to contact me. You can reach me directly at this email or on WhatsApp (<a href="https://wa.me/14033590090" style="color: #c8a96e;">+1 403 359 0090</a>), where we will conduct our day-to-day coaching communications.</p>
              <p style="margin: 0 0 28px;">Looking forward to getting started!</p>
              <p style="margin: 0;">Ryan<br>
                <span style="font-size: 12px; color: #6a7080; font-family: Arial, sans-serif; letter-spacing: 0.06em; text-transform: uppercase;">CSEP-CPT</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization:  `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from:     'Ryan Frecka <ryan@freckafitness.com>',
          reply_to: 'freckafitness@gmail.com',
          to:       [intake.email],
          subject:  `Welcome to Frecka Fitness, ${intake.first_name}!`,
          html:     emailHtml,
          ...(attachments.length > 0 ? { attachments } : {}),
        }),
      })

      if (emailRes.ok) {
        welcomeEmailSent = true
      } else {
        const body = await emailRes.json()
        console.error('Welcome email failed:', body)
      }
    } catch (emailErr) {
      console.error('Welcome email error:', emailErr)
    }

    return new Response(JSON.stringify({
      client_id:          client.id,
      invite_sent:        true,
      welcome_email_sent: welcomeEmailSent,
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
