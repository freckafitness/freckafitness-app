/**
 * seed-taylor-checkins.js
 *
 * Inserts a full year (~52 weeks) of realistic, varied check-in data for the
 * Taylor Brooks test client (freckafitness+client@gmail.com).
 *
 * Designed to exercise the full gamut of radar axes and period comparisons:
 *   Phase 1 — Apr-May 2025:  Spring restart. Motivated but still finding rhythm.
 *   Phase 2 — Jun-Jul 2025:  Building consistency, gains start showing.
 *   Phase 3 — Aug-Sep 2025:  Summer peak. Best metrics of the year.
 *   Phase 4 — Oct-Nov 2025:  Work crunch. Stress spikes, performance dips.
 *   Phase 5 — Dec 2025:      Holiday chaos. Disruptions, nutrition slides.
 *   Phase 6 — Jan-Feb 2026:  New year bounce. Fresh energy, strong rebound.
 *   Phase 7 — Mar-Apr 2026:  Solid spring plateau, building toward new goals.
 *
 * Usage:
 *   node scripts/seed-taylor-checkins.js
 *
 * Safe to re-run — deletes Taylor's existing check-ins first, then reseeds.
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

const SUPABASE_URL              = 'https://uftthvphkmccerergxup.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = getFromVault('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Could not read SUPABASE_SERVICE_ROLE_KEY from Vault.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ─── Check-in data ────────────────────────────────────────────────────────────
// Ordered oldest → newest. Each entry maps directly to the checkins table.
// week_rating:        1–5
// nutrition:          1–10
// soreness:           1–4  (1=nothing to flag, 4=pain)
// missed_sessions:    0–4  (4 = ">3")
// sleep_hours:        numeric
// stress_level:       1–10 (1=calm, 10=high load)
// bodyweight:         kg
// progress_trend:     'Improving' | 'Steady' | 'Declining' | 'Maintaining'
//
// Radar axis scores (for reference when setting values):
//   Sleep      = sleep_hours / 8 × 10            (8 hrs → 10)
//   Nutrition  = nutrition_adherence              (direct)
//   Recovery   = (4 − soreness) / 3 × 10         (soreness 1 → 10, soreness 4 → 0)
//   Stress web = (10 − stress_level) / 9 × 10    (stress 1 → 10, stress 10 → 0)
//   Week Rtg   = week_rating / 5 × 10            (5 → 10, 1 → 2)
//   Consistency= (4 − missed) / 4 × 10           (0 missed → 10, 4 missed → 0)
//
// Story arc:
//   Phase 1 (Apr–Jun 2025):  Narrow web — high Nutrition + Recovery only.
//                             Taylor eats well and isn't sore yet (low intensity start)
//                             but life is overwhelmingly stressful, sleep is poor,
//                             attendance is terrible, ratings are low.
//   Phase 2 (Jul 2025):      Transition — stress easing, showing up more.
//   Phase 3 (Aug–Sep 2025):  Building web — most axes climbing, summer groove.
//   Phase 4 (Oct–Nov 2025):  Autumn crunch — stress spikes, web narrows again.
//   Phase 5 (Dec 2025):      Holiday — disruptions, nutrition slides.
//   Phase 6 (Jan–Feb 2026):  Strong rebound — web expanding fast.
//   Phase 7 (Mar–Apr 2026):  Well-rounded peak — large web on all 6 axes.

const CHECKINS = [
  // ── Phase 1: Narrow web — Nutrition + Recovery only (Apr–Jun 2025) ──────────
  // Radar target: Sleep ~6, Nutrition ~9, Recovery ~10, Stress web ~1, Rating ~2, Consistency ~0–2
  {
    week_ending: '2025-04-20',
    week_rating: 1, nutrition_adherence: 9, soreness: 1, missed_sessions: 4,
    sleep_hours: 5.0, stress_level: 9, bodyweight: 76.2,
    progress_trend: 'Steady',
    best_lift: null,
    program_feedback: 'Made it to one session this week. Life is completely overwhelming right now. But I\'m tracking food religiously — that\'s the one thing I can control.',
    nutrition_notes: 'Meal prepped Sunday. Hitting macros even on the bad days.',
    for_ryan: 'Work is chaos. I want to do this but I\'m barely keeping my head above water.',
  },
  {
    week_ending: '2025-04-27',
    week_rating: 1, nutrition_adherence: 9, soreness: 1, missed_sessions: 3,
    sleep_hours: 5.0, stress_level: 9, bodyweight: 76.0,
    progress_trend: 'Steady',
    best_lift: null,
    program_feedback: 'Made two sessions. Body feels fine physically — the sessions aren\'t intense enough to cause soreness. Just struggling to actually get there.',
    nutrition_notes: 'Nutrition is the one bright spot. Cooking every meal.',
    soreness_notes: 'No soreness — workload is light and attendance is low.',
  },
  {
    week_ending: '2025-05-04',
    week_rating: 2, nutrition_adherence: 9, soreness: 1, missed_sessions: 3,
    sleep_hours: 5.2, stress_level: 8, bodyweight: 75.8,
    progress_trend: 'Steady',
    best_lift: 'Squat 60 kg × 5',
    program_feedback: 'Better than last week mentally. Still only two sessions but felt present for them. Food is going really well.',
    nutrition_notes: 'Logged every meal. Protein hitting target every day.',
  },
  {
    week_ending: '2025-05-11',
    week_rating: 2, nutrition_adherence: 8, soreness: 1, missed_sessions: 3,
    sleep_hours: 5.5, stress_level: 9, bodyweight: 75.7,
    progress_trend: 'Steady',
    best_lift: 'Bench 50 kg × 5',
    program_feedback: 'Stress is relentless. Managing nutrition but that\'s about it. Body feels okay — not sore because I\'m barely training.',
    for_ryan: 'I know my attendance is embarrassing. I\'m not quitting, just surviving right now.',
  },
  {
    week_ending: '2025-05-18',
    week_rating: 2, nutrition_adherence: 9, soreness: 1, missed_sessions: 3,
    sleep_hours: 5.3, stress_level: 8, bodyweight: 75.5,
    progress_trend: 'Steady',
    best_lift: 'Deadlift 80 kg × 3',
    program_feedback: 'Two sessions. Deadlift felt surprisingly good — fresh legs from resting all week. Eating really cleanly.',
    nutrition_notes: 'Prepped 6 of 7 days. Ate out once (healthy choice).',
  },
  {
    week_ending: '2025-05-25',
    week_rating: 2, nutrition_adherence: 8, soreness: 1, missed_sessions: 3,
    sleep_hours: 5.5, stress_level: 8, bodyweight: 75.3,
    progress_trend: 'Steady',
    best_lift: 'Squat 65 kg × 5',
    program_feedback: 'Long weekend helped a tiny bit. Still two sessions only. Recovery is fine — not pushing hard enough to be sore.',
    for_ryan: 'I know something has to give. Thinking about what I can drop to free up time for gym.',
  },
  {
    week_ending: '2025-06-01',
    week_rating: 2, nutrition_adherence: 8, soreness: 1, missed_sessions: 3,
    sleep_hours: 5.8, stress_level: 8, bodyweight: 75.1,
    progress_trend: 'Steady',
    best_lift: 'Bench 52.5 kg × 5',
    program_feedback: 'Another 2-session week. Starting to feel the grind but food is locked. Body feels fine — no soreness.',
  },

  // ── Phase 2: Transition — stress easing, showing up more (Jul 2025) ──────────
  // Radar target: Sleep ~7, Nutrition ~8, Recovery ~8–10, Stress web ~3–5, Rating ~3, Consistency ~5
  {
    week_ending: '2025-06-08',
    week_rating: 3, nutrition_adherence: 8, soreness: 1, missed_sessions: 2,
    sleep_hours: 6.2, stress_level: 7, bodyweight: 74.9,
    progress_trend: 'Improving',
    best_lift: 'Squat 70 kg × 5',
    program_feedback: 'Something shifted this week. Made 3 sessions and felt better for it. Stress is still high but manageable.',
    for_ryan: 'Finally dropped a project that was eating my life. Should have more time now.',
  },
  {
    week_ending: '2025-06-15',
    week_rating: 3, nutrition_adherence: 8, soreness: 2, missed_sessions: 2,
    sleep_hours: 6.5, stress_level: 6, bodyweight: 74.7,
    progress_trend: 'Improving',
    best_lift: 'Deadlift 90 kg × 3',
    program_feedback: 'Three sessions again. Added some intensity — feeling it in the legs now which is actually a good sign.',
    soreness_notes: 'First real DOMS in weeks. Quads from the squats.',
  },
  {
    week_ending: '2025-06-22',
    week_rating: 3, nutrition_adherence: 8, soreness: 2, missed_sessions: 1,
    sleep_hours: 6.8, stress_level: 6, bodyweight: 74.5,
    progress_trend: 'Improving',
    best_lift: 'Bench 55 kg × 5',
    program_feedback: 'Four sessions! Best week since starting. Sleep getting better as stress drops.',
  },
  {
    week_ending: '2025-06-29',
    week_rating: 3, nutrition_adherence: 7, soreness: 2, missed_sessions: 1,
    sleep_hours: 7.0, stress_level: 5, bodyweight: 74.3,
    progress_trend: 'Improving',
    best_lift: 'Squat 75 kg × 5',
    program_feedback: 'Four sessions again. Stress is visibly dropping — I actually laughed this week.',
    nutrition_notes: 'Nutrition slipped slightly on the weekend — social BBQ. Back on it Monday.',
  },

  // ── Phase 3: Building web — summer groove (Jul–Sep 2025) ─────────────────────
  // Radar target: Sleep ~8–9, Nutrition ~8, Recovery ~7–10, Stress web ~5–8, Rating ~4–5, Consistency ~8–10
  {
    week_ending: '2025-07-06',
    week_rating: 4, nutrition_adherence: 8, soreness: 2, missed_sessions: 0,
    sleep_hours: 7.3, stress_level: 4, bodyweight: 74.1,
    progress_trend: 'Improving',
    best_lift: 'Deadlift 100 kg × 3',
    program_feedback: 'First full week ever! Could not believe it when Saturday rolled around. Deadlift hit 100 kg.',
    for_ryan: 'FULL WEEK. Wanted to flag that. Huge for me.',
  },
  {
    week_ending: '2025-07-13',
    week_rating: 4, nutrition_adherence: 8, soreness: 2, missed_sessions: 0,
    sleep_hours: 7.5, stress_level: 4, bodyweight: 74.0,
    progress_trend: 'Improving',
    best_lift: 'Bench 57.5 kg × 5',
    program_feedback: 'Two full weeks! Sleep is the best it\'s been since April. Everything trending up.',
  },
  {
    week_ending: '2025-07-20',
    week_rating: 4, nutrition_adherence: 7, soreness: 2, missed_sessions: 0,
    sleep_hours: 7.5, stress_level: 4, bodyweight: 73.9,
    progress_trend: 'Maintaining',
    best_lift: 'Squat 82.5 kg × 5',
    program_feedback: 'Heat wave mid-week made training brutal but I showed up. Proud of that.',
    soreness_notes: 'Shoulders a bit achy — sleeping in the heat without aircon.',
  },
  {
    week_ending: '2025-07-27',
    week_rating: 4, nutrition_adherence: 8, soreness: 1, missed_sessions: 0,
    sleep_hours: 7.8, stress_level: 3, bodyweight: 73.7,
    progress_trend: 'Improving',
    best_lift: 'Deadlift 105 kg × 3',
    program_feedback: 'Four full weeks in a row. Feel like a different person from April.',
  },
  {
    week_ending: '2025-08-03',
    week_rating: 5, nutrition_adherence: 9, soreness: 1, missed_sessions: 0,
    sleep_hours: 8.0, stress_level: 3, bodyweight: 73.5,
    progress_trend: 'Improving',
    best_lift: 'Bench 60 kg × 4',
    program_feedback: 'Best week yet. 5/5. Everything clicking — sleep, food, training, mood.',
    for_ryan: 'This is what I imagined it could feel like when I signed up.',
  },
  {
    week_ending: '2025-08-10',
    week_rating: 5, nutrition_adherence: 9, soreness: 1, missed_sessions: 0,
    sleep_hours: 8.2, stress_level: 2, bodyweight: 73.3,
    progress_trend: 'Improving',
    best_lift: 'Squat 87.5 kg × 5',
    program_feedback: 'Second week of 5/5. Hit 87.5 kg squat. Legs feel like they\'re made of something different.',
  },
  {
    week_ending: '2025-08-17',
    week_rating: 5, nutrition_adherence: 8, soreness: 1, missed_sessions: 0,
    sleep_hours: 8.3, stress_level: 2, bodyweight: 73.2,
    progress_trend: 'Maintaining',
    best_lift: 'Deadlift 110 kg × 2',
    program_feedback: '110 kg deadlift. Summer is treating me well.',
  },
  {
    week_ending: '2025-08-24',
    week_rating: 5, nutrition_adherence: 9, soreness: 1, missed_sessions: 0,
    sleep_hours: 8.5, stress_level: 2, bodyweight: 73.0,
    progress_trend: 'Improving',
    best_lift: 'Bench 62.5 kg × 3',
    program_feedback: 'Peak week. Slept 8.5 hours on average. Nutrition perfect. New bench mark.',
  },
  {
    week_ending: '2025-08-31',
    week_rating: 4, nutrition_adherence: 8, soreness: 2, missed_sessions: 0,
    sleep_hours: 7.8, stress_level: 3, bodyweight: 73.1,
    progress_trend: 'Maintaining',
    best_lift: 'Squat 90 kg × 4',
    program_feedback: 'Slight dip in energy as summer winds down but still very strong week.',
  },
  {
    week_ending: '2025-09-07',
    week_rating: 4, nutrition_adherence: 8, soreness: 2, missed_sessions: 0,
    sleep_hours: 7.5, stress_level: 3, bodyweight: 73.2,
    progress_trend: 'Maintaining',
    best_lift: 'Deadlift 112.5 kg × 2',
    program_feedback: 'Back to full schedule. Managing work and gym well so far.',
  },
  {
    week_ending: '2025-09-14',
    week_rating: 4, nutrition_adherence: 7, soreness: 2, missed_sessions: 1,
    sleep_hours: 7.2, stress_level: 4, bodyweight: 73.4,
    progress_trend: 'Maintaining',
    best_lift: 'Bench 65 kg × 2',
    program_feedback: 'Missed Saturday — social. Otherwise good. Bench hit 65 kg for the first time.',
    for_ryan: 'Bench 65 kg! That felt impossible in April.',
  },

  // ── Phase 4: Autumn crunch — web narrows again (Oct–Nov 2025) ────────────────
  // Radar target: Sleep ~6–7, Nutrition ~5–7, Recovery ~3–7, Stress web ~1–3, Rating ~2–3, Consistency ~2–5
  {
    week_ending: '2025-09-21',
    week_rating: 3, nutrition_adherence: 6, soreness: 2, missed_sessions: 2,
    sleep_hours: 6.5, stress_level: 7, bodyweight: 73.8,
    progress_trend: 'Declining',
    best_lift: 'Squat 87.5 kg × 4',
    program_feedback: 'New quarter at work hit hard. Two missed sessions. Stress creeping back.',
    for_ryan: 'Big deadline cycle at work is starting again. Recognising the pattern from before.',
  },
  {
    week_ending: '2025-09-28',
    week_rating: 3, nutrition_adherence: 6, soreness: 3, missed_sessions: 2,
    sleep_hours: 6.2, stress_level: 7, bodyweight: 74.1,
    progress_trend: 'Declining',
    best_lift: 'Deadlift 105 kg × 3',
    program_feedback: 'Soreness lingering longer than usual — poor sleep not helping recovery.',
    soreness_notes: 'Quad soreness from Monday lasting all week. Not normal for me anymore.',
    nutrition_notes: 'Slipping — takeaway twice this week.',
  },
  {
    week_ending: '2025-10-05',
    week_rating: 2, nutrition_adherence: 5, soreness: 3, missed_sessions: 3,
    sleep_hours: 5.8, stress_level: 8, bodyweight: 74.5,
    progress_trend: 'Declining',
    best_lift: 'Bench 57.5 kg × 5',
    program_feedback: 'Three missed. Exhausted. Food is slipping. It\'s the April pattern all over again.',
    nutrition_notes: 'Skipped meal prep. Cafeteria food and takeaway all week.',
    for_ryan: 'Work project is overwhelming. Similar to what happened in April. At least I see it now.',
  },
  {
    week_ending: '2025-10-12',
    week_rating: 2, nutrition_adherence: 4, soreness: 3, missed_sessions: 3,
    sleep_hours: 5.5, stress_level: 9, bodyweight: 74.9,
    progress_trend: 'Declining',
    best_lift: null,
    program_feedback: 'Worst week since April. Three missed sessions, eating poorly, sleeping 5 hours.',
    soreness_notes: 'Lower back ache — all the desk time.',
    nutrition_notes: 'Basically not tracking. Just eating whatever is fastest.',
  },
  {
    week_ending: '2025-10-19',
    week_rating: 2, nutrition_adherence: 5, soreness: 3, missed_sessions: 2,
    sleep_hours: 6.0, stress_level: 8, bodyweight: 75.1,
    progress_trend: 'Declining',
    best_lift: 'Squat 77.5 kg × 3',
    program_feedback: 'Deload this week — only two sessions but lighter work. Stress still brutal.',
    for_ryan: 'Can we do a deload properly? Need to recover not just physically but mentally.',
  },
  {
    week_ending: '2025-10-26',
    week_rating: 3, nutrition_adherence: 6, soreness: 2, missed_sessions: 2,
    sleep_hours: 6.3, stress_level: 7, bodyweight: 75.0,
    progress_trend: 'Steady',
    best_lift: 'Deadlift 97.5 kg × 3',
    program_feedback: 'Project deadline passed. Breathing a little. Two sessions but they were quality.',
  },
  {
    week_ending: '2025-11-02',
    week_rating: 3, nutrition_adherence: 6, soreness: 2, missed_sessions: 1,
    sleep_hours: 6.8, stress_level: 6, bodyweight: 74.8,
    progress_trend: 'Steady',
    best_lift: 'Bench 60 kg × 4',
    program_feedback: 'Four sessions. On the mend. Stress halved now the deadline is gone.',
    nutrition_notes: 'Cooking at home more. Not perfectly tracked but decent choices.',
  },
  {
    week_ending: '2025-11-09',
    week_rating: 3, nutrition_adherence: 7, soreness: 2, missed_sessions: 1,
    sleep_hours: 7.0, stress_level: 5, bodyweight: 74.6,
    progress_trend: 'Improving',
    best_lift: 'Squat 82.5 kg × 5',
    program_feedback: 'Getting back there. Four sessions, food mostly on track, sleeping better.',
  },

  // ── Phase 5: Recovery + holiday chaos (Nov–Dec 2025) ─────────────────────────
  {
    week_ending: '2025-11-16',
    week_rating: 4, nutrition_adherence: 7, soreness: 2, missed_sessions: 0,
    sleep_hours: 7.3, stress_level: 5, bodyweight: 74.4,
    progress_trend: 'Improving',
    best_lift: 'Deadlift 107.5 kg × 2',
    program_feedback: 'Full week! Third time ever. Things are clicking again.',
    upcoming_disruptions: true,
    disruption_notes: 'Christmas travel from Dec 21 through Jan 2. No gym access.',
  },
  {
    week_ending: '2025-11-23',
    week_rating: 4, nutrition_adherence: 8, soreness: 1, missed_sessions: 0,
    sleep_hours: 7.5, stress_level: 4, bodyweight: 74.2,
    progress_trend: 'Improving',
    best_lift: 'Bench 62.5 kg × 3',
    program_feedback: 'Feeling great. Trying to bank as much quality as I can before Christmas disrupts things.',
  },
  {
    week_ending: '2025-11-30',
    week_rating: 4, nutrition_adherence: 7, soreness: 2, missed_sessions: 0,
    sleep_hours: 7.5, stress_level: 4, bodyweight: 74.2,
    progress_trend: 'Maintaining',
    best_lift: 'Squat 87.5 kg × 5',
    program_feedback: 'Full week, consistent food, good energy. Christmas chaos starting to build though.',
    upcoming_disruptions: true,
    disruption_notes: 'Work Christmas events next two weeks will hit nutrition. Travel Dec 21.',
  },
  {
    week_ending: '2025-12-07',
    week_rating: 3, nutrition_adherence: 5, soreness: 2, missed_sessions: 1,
    sleep_hours: 7.0, stress_level: 5, bodyweight: 74.6,
    progress_trend: 'Steady',
    best_lift: 'Deadlift 105 kg × 3',
    program_feedback: 'Christmas parties mid-week wrecked nutrition. Missed one session.',
    nutrition_notes: 'Work do Wednesday, drinks Friday. Not complaining but tracking gone.',
    upcoming_disruptions: true,
    disruption_notes: 'Heading home Dec 21 for 12 days. Bringing bands.',
  },
  {
    week_ending: '2025-12-14',
    week_rating: 3, nutrition_adherence: 5, soreness: 2, missed_sessions: 1,
    sleep_hours: 7.2, stress_level: 5, bodyweight: 75.0,
    progress_trend: 'Steady',
    best_lift: 'Bench 60 kg × 4',
    program_feedback: 'Managing. Two more social events but kept gym to 4 sessions. Proud of that.',
    upcoming_disruptions: true,
    disruption_notes: 'Last gym week before Christmas.',
  },
  {
    week_ending: '2025-12-21',
    week_rating: 2, nutrition_adherence: 4, soreness: 1, missed_sessions: 3,
    sleep_hours: 7.5, stress_level: 4, bodyweight: 75.6,
    progress_trend: 'Declining',
    best_lift: null,
    program_feedback: 'Christmas prep mayhem. Only managed two sessions. At least I\'m sleeping.',
    upcoming_disruptions: true,
    disruption_notes: 'Away until Jan 2. No gym. Resistance band circuit planned.',
  },
  {
    week_ending: '2025-12-28',
    week_rating: 2, nutrition_adherence: 3, soreness: 1, missed_sessions: 4,
    sleep_hours: 8.5, stress_level: 4, bodyweight: 76.5,
    progress_trend: 'Declining',
    best_lift: null,
    program_feedback: 'Christmas. No gym. Ate everything. Slept enormously. Zero guilt.',
    nutrition_notes: 'Holiday mode. Will resume tracking Jan 5.',
    for_ryan: 'Coming back Jan 5, committed. Please don\'t judge the bodyweight.',
  },

  // ── Phase 6: Strong rebound (Jan–Feb 2026) ────────────────────────────────────
  // Radar target: Sleep ~8–9, Nutrition ~8–9, Recovery ~8–10, Stress web ~6–8, Rating ~4–5, Consistency ~8–10
  {
    week_ending: '2026-01-04',
    week_rating: 3, nutrition_adherence: 7, soreness: 2, missed_sessions: 2,
    sleep_hours: 7.5, stress_level: 5, bodyweight: 76.8,
    progress_trend: 'Steady',
    best_lift: 'Squat 70 kg × 5',
    program_feedback: 'Back Jan 3. Rusty but motivated. Weight is up but not worried — I know the pattern now.',
  },
  {
    week_ending: '2026-01-11',
    week_rating: 4, nutrition_adherence: 8, soreness: 2, missed_sessions: 0,
    sleep_hours: 7.8, stress_level: 4, bodyweight: 76.1,
    progress_trend: 'Improving',
    best_lift: 'Deadlift 100 kg × 3',
    program_feedback: 'Full week back. Bodyweight dropping fast. Strength coming back faster than expected.',
    for_ryan: 'Goal: back to pre-holiday numbers by end of January.',
  },
  {
    week_ending: '2026-01-18',
    week_rating: 4, nutrition_adherence: 9, soreness: 1, missed_sessions: 0,
    sleep_hours: 8.0, stress_level: 3, bodyweight: 75.4,
    progress_trend: 'Improving',
    best_lift: 'Bench 62.5 kg × 4',
    program_feedback: 'Nutrition is exceptional — back on the meal prep routine. Body responding well.',
  },
  {
    week_ending: '2026-01-25',
    week_rating: 5, nutrition_adherence: 9, soreness: 1, missed_sessions: 0,
    sleep_hours: 8.2, stress_level: 3, bodyweight: 74.9,
    progress_trend: 'Improving',
    best_lift: 'Squat 90 kg × 4',
    program_feedback: 'Back to pre-holiday squat numbers in 3 weeks. Blows my mind.',
  },
  {
    week_ending: '2026-02-01',
    week_rating: 5, nutrition_adherence: 9, soreness: 1, missed_sessions: 0,
    sleep_hours: 8.3, stress_level: 2, bodyweight: 74.5,
    progress_trend: 'Improving',
    best_lift: 'Deadlift 110 kg × 2',
    program_feedback: 'Best February I\'ve ever had. Everything aligned — sleep 8+, food perfect, full attendance.',
    for_ryan: 'I finally feel like a consistent person. Never thought I\'d say that.',
  },
  {
    week_ending: '2026-02-08',
    week_rating: 5, nutrition_adherence: 8, soreness: 1, missed_sessions: 0,
    sleep_hours: 8.2, stress_level: 2, bodyweight: 74.2,
    progress_trend: 'Improving',
    best_lift: 'Bench 65 kg × 3',
    program_feedback: 'Matched August bench numbers. The web is filling in — I can actually see it.',
  },
  {
    week_ending: '2026-02-15',
    week_rating: 5, nutrition_adherence: 8, soreness: 1, missed_sessions: 0,
    sleep_hours: 8.0, stress_level: 2, bodyweight: 74.0,
    progress_trend: 'Maintaining',
    best_lift: 'Squat 92.5 kg × 5',
    program_feedback: 'Matched summer squat peak. The consistency axis on my radar must look very different from April.',
  },

  // ── Phase 7: Well-rounded current peak (Feb–Apr 2026) ────────────────────────
  // Radar target: Sleep ~9–10, Nutrition ~8, Recovery ~7–10, Stress web ~7–9, Rating ~8–10, Consistency ~10
  {
    week_ending: '2026-02-22',
    week_rating: 5, nutrition_adherence: 8, soreness: 1, missed_sessions: 0,
    sleep_hours: 8.2, stress_level: 2, bodyweight: 73.9,
    progress_trend: 'Improving',
    best_lift: 'Deadlift 115 kg × 1',
    program_feedback: 'Matched August deadlift 1RM. Going for 117.5 soon.',
  },
  {
    week_ending: '2026-03-01',
    week_rating: 4, nutrition_adherence: 8, soreness: 2, missed_sessions: 0,
    sleep_hours: 7.8, stress_level: 3, bodyweight: 73.8,
    progress_trend: 'Maintaining',
    best_lift: 'Squat 95 kg × 3',
    program_feedback: 'Squat past summer peak. Approaching 100 — that has been a dream goal.',
    for_ryan: '100 kg squat is within reach. Never thought I\'d be saying that in March.',
  },
  {
    week_ending: '2026-03-08',
    week_rating: 4, nutrition_adherence: 8, soreness: 2, missed_sessions: 0,
    sleep_hours: 7.8, stress_level: 3, bodyweight: 73.8,
    progress_trend: 'Maintaining',
    best_lift: 'Bench 67.5 kg × 2',
    program_feedback: 'Solid week. Bench at August high again. New volume block has me a bit sore.',
    soreness_notes: 'Expected DOMS in quads from new squat volume. All fine.',
  },
  {
    week_ending: '2026-03-15',
    week_rating: 4, nutrition_adherence: 7, soreness: 2, missed_sessions: 0,
    sleep_hours: 7.5, stress_level: 4, bodyweight: 73.9,
    progress_trend: 'Maintaining',
    best_lift: 'Deadlift 115 kg × 1',
    program_feedback: 'Slight motivation dip mid-week but pushed through. Full attendance.',
    nutrition_notes: 'Skipped tracking Thursday/Friday but made good choices.',
  },
  {
    week_ending: '2026-03-22',
    week_rating: 5, nutrition_adherence: 8, soreness: 1, missed_sessions: 0,
    sleep_hours: 8.0, stress_level: 3, bodyweight: 73.7,
    progress_trend: 'Improving',
    best_lift: 'Squat 97.5 kg × 3',
    program_feedback: 'Bounced right back. 97.5 kg squat. One more jump and we\'re at 100.',
    for_ryan: 'If 100 kg happens next week I might actually cry.',
  },
  {
    week_ending: '2026-03-29',
    week_rating: 5, nutrition_adherence: 9, soreness: 1, missed_sessions: 0,
    sleep_hours: 8.2, stress_level: 2, bodyweight: 73.5,
    progress_trend: 'Improving',
    best_lift: 'Squat 100 kg × 2',
    program_feedback: '100 KG SQUAT. Two clean reps. I did actually tear up. This was 11 months in the making.',
    for_ryan: 'The biggest milestone I\'ve ever hit. Thank you for not giving up on me during April and October.',
  },
  {
    week_ending: '2026-04-05',
    week_rating: 5, nutrition_adherence: 8, soreness: 1, missed_sessions: 0,
    sleep_hours: 8.0, stress_level: 2, bodyweight: 73.5,
    progress_trend: 'Improving',
    best_lift: 'Deadlift 117.5 kg × 1',
    program_feedback: 'New deadlift PR the week after the squat milestone. April me could never.',
  },
  {
    week_ending: '2026-04-13',
    week_rating: 5, nutrition_adherence: 8, soreness: 1, missed_sessions: 0,
    sleep_hours: 8.0, stress_level: 2, bodyweight: 73.4,
    progress_trend: 'Improving',
    best_lift: 'Bench 70 kg × 1',
    program_feedback: '70 kg bench. Squat 100, deadlift 117.5, bench 70 — all in the same month.',
    for_ryan: 'My April radar web and my current radar web must look completely different. Can we compare them?',
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // Find Taylor's client record
  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .select('id, first_name, last_name, email')
    .eq('email', 'freckafitness+test-taylor@gmail.com')
    .maybeSingle();

  if (clientErr || !client) {
    console.error('Could not find Taylor Brooks client:', clientErr?.message ?? 'not found');
    process.exit(1);
  }

  console.log(`Found client: ${client.first_name} ${client.last_name} (${client.id})`);

  // Clear existing check-ins for this client
  const { error: deleteErr } = await supabase
    .from('checkins')
    .delete()
    .eq('client_id', client.id);

  if (deleteErr) {
    console.error('Failed to clear existing check-ins:', deleteErr.message);
    process.exit(1);
  }

  console.log('Cleared existing check-ins.');

  // Insert all 52 weeks
  const rows = CHECKINS.map(c => ({ ...c, client_id: client.id }));

  const { error: insertErr } = await supabase.from('checkins').insert(rows);

  if (insertErr) {
    console.error('Insert failed:', insertErr.message);
    process.exit(1);
  }

  console.log(`\nInserted ${rows.length} check-ins for ${client.first_name} ${client.last_name}.`);
  console.log('\nPhase summary:');
  console.log('  Apr–May 2025  (6 wks): Spring restart — motivated but inconsistent');
  console.log('  Jun–Jul 2025  (8 wks): Building momentum — first major PRs');
  console.log('  Aug–Sep 2025  (8 wks): Summer peak — best metrics of the year');
  console.log('  Oct–Nov 2025  (9 wks): Autumn crunch — stress spike, recovery');
  console.log('  Dec 2025      (5 wks): Holiday chaos — disruptions, weight up');
  console.log('  Jan–Feb 2026  (8 wks): New year bounce — fast return to peak');
  console.log('  Mar–Apr 2026  (8 wks): Spring plateau → new PRs across the board');
  console.log('\nAll done.');
}

main();
