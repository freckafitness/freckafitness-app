/**
 * seed-test-clients.js
 *
 * Creates 5 test clients — one per primary goal type — with varied intake data,
 * check-in history, and distinct favorite colors for habit-web contrast testing.
 *
 * Usage:
 *   node scripts/seed-test-clients.js
 *
 * Reads SUPABASE_SERVICE_ROLE_KEY and TEST_PASSWORD from Supabase Vault automatically.
 *
 * All 5 accounts share TEST_PASSWORD so you can log in as any of them from the app.
 * Gmail aliases (freckafitness+test-*@gmail.com) all land in your inbox.
 *
 * Safe to re-run — skips any client whose email already exists.
 */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function getFromVault(name) {
  try {
    const raw = execSync(
      `supabase db query --linked --output json "SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = '${name}';"`,
      { encoding: 'utf8', cwd: resolve(__dirname, '..') }
    );
    const parsed = JSON.parse(raw);
    return parsed.rows?.[0]?.decrypted_secret ?? null;
  } catch (e) {
    console.error(`Vault read failed for ${name}:`, e.message);
    return null;
  }
}

const SUPABASE_URL             = 'https://uftthvphkmccerergxup.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = getFromVault('SUPABASE_SERVICE_ROLE_KEY');
const TEST_PASSWORD             = getFromVault('TEST_PASSWORD');

if (!SUPABASE_SERVICE_ROLE_KEY || !TEST_PASSWORD) {
  console.error('Could not read secrets from Vault. Make sure SUPABASE_SERVICE_ROLE_KEY and TEST_PASSWORD are stored there.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Sundays going back from 2026-04-12 (most recent Sunday)
const WEEKS = [
  '2026-04-12',
  '2026-04-05',
  '2026-03-29',
  '2026-03-22',
  '2026-03-15',
  '2026-03-08',
  '2026-03-01',
  '2026-02-22',
];

const CLIENTS = [
  {
    // ── Improve Performance ──────────────────────────────────────────
    email: 'freckafitness+test-alex@gmail.com',
    first_name: 'Alex',
    last_name: 'Carter',
    phone: '(555) 201-4488',
    favorite_color: '#E8BF60', // warm gold — light, tests darkening contrast path
    weight_unit: 'lbs',
    show_bodyweight: false, // Improve Performance — no bodyweight tracking
    intake: {
      primary_goal: 'Improve Performance',
      goal_detail: 'Training for a local powerlifting meet in Q3. Want to hit a 405 squat, 275 bench, and 495 deadlift.',
      timeline: '6 months',
      experience: 'Advanced (5+ years)',
      training_days: 5,
      session_length: '75-90 min',
      environment: 'Commercial Gym',
      current_training: 'Following a conjugate-style program but plateauing on squat. Recently added a second squat day with moderate volume.',
      birthday: '1993-07-14',
      gender: 'Male',
      sleep_quality: 7,
      stress_level: 6,
      occupation: 'Software engineer (desk job)',
      nutrition: 'Eating in a slight surplus, tracking macros loosely. Protein around 180g/day.',
      injuries: 'Right shoulder impingement — manageable with warmup, avoid behind-the-neck movements.',
      medical_notes: null,
      feedback_pref: 'Direct and technical',
      referral_source: 'Instagram',
      anything_else: 'Competition prep is the priority — everything else is secondary right now.',
      location: 'Chicago, IL',
    },
    checkins: [
      { week: 0, week_rating: 5, nutrition_adherence: 9, soreness: 2, missed_sessions: 0, sleep_hours: 7, progress_trend: 'Improving', best_lift: '385 squat for 3 — best ever', program_feedback: 'Volume felt perfect this week.' },
      { week: 1, week_rating: 4, nutrition_adherence: 8, soreness: 2, missed_sessions: 0, sleep_hours: 6, progress_trend: 'Improving', best_lift: '265 bench for 5', program_feedback: 'Bench accessory was a bit much on top of the heavy day.' },
      { week: 2, week_rating: 4, nutrition_adherence: 7, soreness: 3, missed_sessions: 1, sleep_hours: 6, progress_trend: 'Steady', best_lift: null, program_feedback: 'Work trip midweek, skipped Wednesday session.', for_ryan: 'Can we shift the missed day to Saturday permanently?' },
      { week: 3, week_rating: 3, nutrition_adherence: 6, soreness: 3, missed_sessions: 0, sleep_hours: 5, progress_trend: 'Steady', best_lift: '470 deadlift for 2', program_feedback: 'Felt beat up by Friday. Sleep has been rough.' },
      { week: 4, week_rating: 5, nutrition_adherence: 9, soreness: 2, missed_sessions: 0, sleep_hours: 8, progress_trend: 'Improving', best_lift: '380 squat for 4', program_feedback: null },
      { week: 5, week_rating: 4, nutrition_adherence: 8, soreness: 2, missed_sessions: 0, sleep_hours: 7, progress_trend: 'Improving', best_lift: '260 bench for 6', program_feedback: 'Shoulder held up well. Warmup protocol is working.' },
      { week: 6, week_rating: 3, nutrition_adherence: 5, soreness: 3, missed_sessions: 1, sleep_hours: 6, progress_trend: 'Steady', best_lift: null, program_feedback: 'Got sick Thursday, cut the week short.', upcoming_disruptions: true, disruption_notes: 'Family event next weekend — may shift Sunday session.' },
      { week: 7, week_rating: 2, nutrition_adherence: 4, soreness: 4, missed_sessions: 2, sleep_hours: 5, progress_trend: 'Declining', best_lift: null, program_feedback: 'Still sick. Only made it in twice.', for_ryan: 'Should I deload next week?' },
    ],
  },

  {
    // ── General Fitness ──────────────────────────────────────────────
    email: 'freckafitness+test-jordan@gmail.com',
    first_name: 'Jordan',
    last_name: 'Mills',
    phone: null,
    favorite_color: '#253551', // dark navy — tests light text on dark fill
    weight_unit: 'kg',
    show_bodyweight: false, // General Fitness — no bodyweight tracking
    intake: {
      primary_goal: 'General Fitness',
      goal_detail: 'Just want to feel better and have more energy. Would love to actually stick to something for once.',
      timeline: '3 months',
      experience: 'Beginner (< 1 year)',
      training_days: 3,
      session_length: '45-60 min',
      environment: 'Home Gym',
      current_training: 'Some YouTube workouts here and there, nothing consistent.',
      birthday: '1989-03-22',
      gender: null,
      sleep_quality: 5,
      stress_level: 7,
      occupation: 'Nurse (shift work)',
      nutrition: 'Pretty poor honestly. Lots of takeout on shift days. Trying to meal prep but it falls apart midweek.',
      injuries: null,
      medical_notes: 'Anxiety — mentioned in case it\'s relevant to program design.',
      feedback_pref: 'Encouraging and patient',
      referral_source: 'Friend referral',
      anything_else: null,
      location: 'Portland, OR',
    },
    checkins: [
      { week: 0, week_rating: 3, nutrition_adherence: 5, soreness: 2, missed_sessions: 0, sleep_hours: 6, progress_trend: 'Steady', best_lift: null, program_feedback: 'Workouts felt doable. Happy I did all three.' },
      { week: 1, week_rating: 4, nutrition_adherence: 6, soreness: 2, missed_sessions: 0, sleep_hours: 7, progress_trend: 'Improving', best_lift: null, program_feedback: 'Meal prepped Sunday for the first time in months. Huge win.', for_ryan: 'Is it normal to be sore for two days after leg day?' },
      { week: 2, week_rating: 2, nutrition_adherence: 3, soreness: 1, missed_sessions: 2, sleep_hours: 5, progress_trend: 'Declining', best_lift: null, program_feedback: 'Three back-to-back night shifts killed the week. Not proud of it but being honest.', upcoming_disruptions: true, disruption_notes: 'Holiday weekend — might only get 2 sessions in.' },
    ],
  },

  {
    // ── Build Strength ───────────────────────────────────────────────
    email: 'freckafitness+test-morgan@gmail.com',
    first_name: 'Morgan',
    last_name: 'Shaw',
    phone: '(555) 348-9021',
    favorite_color: '#E87878', // coral red — warm, tests light/dark boundary
    weight_unit: 'lbs',
    show_bodyweight: false, // Build Strength — no bodyweight tracking
    intake: {
      primary_goal: 'Build Strength',
      goal_detail: 'Never done a structured strength program. Want to hit a 315 squat and 405 deadlift within a year.',
      timeline: '12 months',
      experience: 'Intermediate (1-3 years)',
      training_days: 4,
      session_length: '60-75 min',
      environment: 'Commercial Gym',
      current_training: 'Bodybuilding-style splits for the past 2 years. Good base but no idea what I\'m doing for strength.',
      birthday: '1997-11-08',
      gender: 'Female',
      sleep_quality: 7,
      stress_level: 4,
      occupation: 'Graphic designer',
      nutrition: 'Eating enough, moderate protein. Not tracking.',
      injuries: 'Old left knee issue from basketball — no pain currently but gets cranky with high volume squatting.',
      medical_notes: null,
      feedback_pref: 'Detailed feedback',
      referral_source: 'Google search',
      anything_else: 'I learn best when I understand the why behind the programming.',
      location: 'Austin, TX',
    },
    checkins: [
      { week: 0, week_rating: 5, nutrition_adherence: 8, soreness: 2, missed_sessions: 0, sleep_hours: 8, progress_trend: 'Improving', best_lift: '195 squat for 5 — new PR', program_feedback: 'Loving the linear progression. Makes sense to me.' },
      { week: 1, week_rating: 4, nutrition_adherence: 7, soreness: 3, missed_sessions: 0, sleep_hours: 7, progress_trend: 'Improving', best_lift: '235 deadlift for 5', program_feedback: 'Hamstrings are destroyed in a good way.' },
      { week: 2, week_rating: 4, nutrition_adherence: 6, soreness: 2, missed_sessions: 0, sleep_hours: 7, progress_trend: 'Steady', best_lift: '200 squat for 5', program_feedback: 'Knee felt a little off on warm-up sets. Fine by working sets.', for_ryan: 'Should I be concerned about the knee or just keep monitoring?' },
      { week: 3, week_rating: 3, nutrition_adherence: 5, soreness: 3, missed_sessions: 1, sleep_hours: 6, progress_trend: 'Steady', best_lift: null, program_feedback: 'Had a migraine Wednesday, skipped that session.' },
      { week: 4, week_rating: 5, nutrition_adherence: 9, soreness: 2, missed_sessions: 0, sleep_hours: 8, progress_trend: 'Improving', best_lift: '210 squat for 3 — easy', program_feedback: 'Best week yet. Energy was high all week.' },
      { week: 5, week_rating: 4, nutrition_adherence: 7, soreness: 2, missed_sessions: 0, sleep_hours: 7, progress_trend: 'Improving', best_lift: '250 deadlift for 5', program_feedback: null },
    ],
  },

  {
    // ── Build Muscle ─────────────────────────────────────────────────
    email: 'freckafitness+test-taylor@gmail.com',
    first_name: 'Taylor',
    last_name: 'Brooks',
    phone: '(555) 477-6603',
    favorite_color: '#72C872', // lime green — bright, likely passes contrast as-is
    weight_unit: 'lbs',
    show_bodyweight: true,
    intake: {
      primary_goal: 'Build Muscle',
      goal_detail: 'Been skinny my whole life. Want to put on real size — especially upper body.',
      timeline: '12 months',
      experience: 'Intermediate (1-3 years)',
      training_days: 5,
      session_length: '60-75 min',
      environment: 'Commercial Gym',
      current_training: 'PPL 3 days on / 1 off for about a year. Good gains early on but stalled.',
      birthday: '2000-06-30',
      gender: 'Male',
      sleep_quality: 6,
      stress_level: 5,
      occupation: 'College student',
      nutrition: 'Undereating historically. Now trying to eat more but stomach isn\'t used to it.',
      injuries: null,
      medical_notes: null,
      feedback_pref: 'Data-focused',
      referral_source: 'YouTube',
      anything_else: 'Budget is tight so no supplements beyond protein powder.',
      location: 'Columbus, OH',
    },
    checkins: [
      { week: 0, week_rating: 4, nutrition_adherence: 7, soreness: 3, missed_sessions: 0, sleep_hours: 7, progress_trend: 'Improving', best_lift: 'Incline press 155 for 8', program_feedback: 'Volume is higher than I\'m used to but I\'m adjusting.', bodyweight: 73.5 },
      { week: 1, week_rating: 3, nutrition_adherence: 5, soreness: 3, missed_sessions: 1, sleep_hours: 6, progress_trend: 'Steady', best_lift: null, program_feedback: 'Midterms. Nutrition fell apart completely.', bodyweight: 73.1, for_ryan: 'Does one bad week undo progress?' },
      { week: 2, week_rating: 4, nutrition_adherence: 7, soreness: 2, missed_sessions: 0, sleep_hours: 7, progress_trend: 'Steady', best_lift: 'Incline press 160 for 7', program_feedback: 'Back on track after midterms.', bodyweight: 73.6 },
      { week: 3, week_rating: 5, nutrition_adherence: 8, soreness: 2, missed_sessions: 0, sleep_hours: 8, progress_trend: 'Improving', best_lift: 'OHP 115 for 5 — lifetime PR', program_feedback: 'Best week so far. Eating more consistently is making a difference.', bodyweight: 74.0 },
      { week: 4, week_rating: 4, nutrition_adherence: 7, soreness: 3, missed_sessions: 0, sleep_hours: 7, progress_trend: 'Improving', best_lift: 'Incline 165 for 6', program_feedback: null, bodyweight: 74.2 },
    ],
  },

  {
    // ── Lose Body Fat ────────────────────────────────────────────────
    email: 'freckafitness+test-sam@gmail.com',
    first_name: 'Sam',
    last_name: 'Rivera',
    phone: '(555) 592-3317',
    favorite_color: '#C87DE8', // lavender purple — light, tests contrast darkening
    weight_unit: 'lbs',
    show_bodyweight: true,
    intake: {
      primary_goal: 'Lose Body Fat',
      goal_detail: 'Lost 30 lbs on my own two years ago and gained it all back. Want to do it differently this time — sustainably.',
      timeline: '6 months',
      experience: 'Beginner (< 1 year)',
      training_days: 3,
      session_length: '45-60 min',
      environment: 'Home Gym',
      current_training: 'Walking 30 min most days. Haven\'t lifted in over a year.',
      birthday: '1985-09-17',
      gender: 'Female',
      sleep_quality: 6,
      stress_level: 8,
      occupation: 'Accountant (tax season right now — very hectic)',
      nutrition: 'Emotionally tied to food. History of yo-yo dieting. Want a realistic approach, not a crash diet.',
      injuries: 'Lower back — flares up with heavy lifting. Trying to be careful.',
      medical_notes: 'Hypothyroid, managed with medication.',
      feedback_pref: 'Supportive and check-in focused',
      referral_source: 'Podcast',
      anything_else: 'Please don\'t assign a calorie number until we talk. Previous coaches have been really aggressive with deficits and it backfired.',
      location: 'Miami, FL',
    },
    checkins: [
      { week: 0, week_rating: 3, nutrition_adherence: 6, soreness: 2, missed_sessions: 0, sleep_hours: 6, progress_trend: 'Steady', best_lift: null, program_feedback: 'Sessions felt manageable. Back held up fine.', bodyweight: 83.9 },
      { week: 1, week_rating: 4, nutrition_adherence: 7, soreness: 1, missed_sessions: 0, sleep_hours: 6, progress_trend: 'Improving', best_lift: null, program_feedback: 'Surprised how much better I feel after just two weeks.', bodyweight: 83.4, for_ryan: 'Is it okay that I added a 4th day this week? Felt good.' },
    ],
  },
];

async function run() {
  console.log('Starting seed…\n');

  for (const def of CLIENTS) {
    process.stdout.write(`→ ${def.first_name} ${def.last_name} (${def.intake.primary_goal})… `);

    // ── 1. Check for existing client by email ─────────────────────
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('email', def.email)
      .maybeSingle();

    if (existingClient) {
      console.log('already exists, skipping.');
      continue;
    }

    // ── 2. Insert intake ──────────────────────────────────────────
    const { data: intake, error: intakeErr } = await supabase
      .from('intakes')
      .insert({
        first_name:      def.first_name,
        last_name:       def.last_name,
        email:           def.email,
        phone:           def.phone,
        location:        def.intake.location,
        primary_goal:    def.intake.primary_goal,
        goal_detail:     def.intake.goal_detail,
        timeline:        def.intake.timeline,
        experience:      def.intake.experience,
        training_days:   def.intake.training_days,
        session_length:  def.intake.session_length,
        environment:     def.intake.environment,
        current_training: def.intake.current_training,
        birthday:        def.intake.birthday,
        gender:          def.intake.gender,
        sleep_quality:   def.intake.sleep_quality,
        stress_level:    def.intake.stress_level,
        occupation:      def.intake.occupation,
        nutrition:       def.intake.nutrition,
        injuries:        def.intake.injuries,
        medical_notes:   def.intake.medical_notes,
        feedback_pref:   def.intake.feedback_pref,
        referral_source: def.intake.referral_source,
        anything_else:   def.intake.anything_else,
        favorite_color:  def.favorite_color,
      })
      .select('id')
      .single();

    if (intakeErr) { console.error(`intake insert failed: ${intakeErr.message}`); continue; }

    // ── 3. Insert client ──────────────────────────────────────────
    const { data: client, error: clientErr } = await supabase
      .from('clients')
      .insert({
        first_name:     def.first_name,
        last_name:      def.last_name,
        email:          def.email,
        phone:          def.phone,
        status:         'active',
        favorite_color: def.favorite_color,
        weight_unit:    def.weight_unit,
        show_bodyweight: def.show_bodyweight,
      })
      .select('id')
      .single();

    if (clientErr) { console.error(`client insert failed: ${clientErr.message}`); continue; }

    // ── 4. Link intake → client ───────────────────────────────────
    await supabase
      .from('intakes')
      .update({ client_id: client.id })
      .eq('id', intake.id);

    // ── 5. Create auth user ───────────────────────────────────────
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email:         def.email,
      password:      TEST_PASSWORD,
      email_confirm: true,
    });

    if (authErr) { console.error(`auth user creation failed: ${authErr.message}`); continue; }

    // ── 6. Insert user_role ────────────────────────────────────────
    const { error: roleErr } = await supabase
      .from('user_roles')
      .insert({
        user_id:   authData.user.id,
        role:      'client',
        client_id: client.id,
      });

    if (roleErr) { console.error(`user_role insert failed: ${roleErr.message}`); continue; }

    // ── 7. Link auth_user_id on client ────────────────────────────
    await supabase
      .from('clients')
      .update({ auth_user_id: authData.user.id })
      .eq('id', client.id);

    // ── 8. Insert check-ins ───────────────────────────────────────
    for (const c of def.checkins) {
      await supabase.from('checkins').insert({
        client_id:           client.id,
        week_ending:         WEEKS[c.week],
        week_rating:         c.week_rating,
        nutrition_adherence: c.nutrition_adherence,
        soreness:            c.soreness,
        missed_sessions:     c.missed_sessions,
        sleep_hours:         c.sleep_hours,
        progress_trend:      c.progress_trend ?? null,
        best_lift:           c.best_lift ?? null,
        program_feedback:    c.program_feedback ?? null,
        for_ryan:            c.for_ryan ?? null,
        upcoming_disruptions: c.upcoming_disruptions ?? false,
        disruption_notes:    c.disruption_notes ?? null,
        bodyweight:          c.bodyweight ?? null,
      });
    }

    console.log(`done. ${def.checkins.length} check-ins.`);
  }

  console.log('\nSeed complete.\n');
  console.log('Login credentials:');
  console.log('  Password (all accounts): [your TEST_PASSWORD env var]');
  console.log('');
  for (const def of CLIENTS) {
    console.log(`  ${def.email.padEnd(44)} ${def.intake.primary_goal}`);
  }
}

run().catch(err => { console.error(err); process.exit(1); });
