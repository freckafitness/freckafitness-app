/**
 * seed-ryan-checkins.js
 *
 * 52 weeks for freckafitness+client@gmail.com engineered so each period chip
 * on the comparison radar unlocks exactly ONE new strong axis:
 *
 *   All Time  → Nutrition stands out; everything else low/irregular
 *   6M        → + Recovery  (soreness drops to 1 from week 27)
 *   YTD       → + Sleep     (sleep jumps to 8.5 from Jan 1)
 *   12W       → + Consistency (0 missed sessions from week 41)
 *   8W        → + Week Rating (5/5 every week from week 45)
 *   Last 4W   → + Stress relief (stress drops to 1–2 from week 49)
 *
 * Radar axis score formulas (for reference):
 *   Sleep      = sleep_hours / 8 × 10        (8 hrs → 10, 4 hrs → 5)
 *   Nutrition  = nutrition_adherence          (direct 1–10)
 *   Recovery   = (4 − soreness) / 3 × 10    (1 → 10, 4 → 0)
 *   Stress web = (10 − stress) / 9 × 10     (1 → 10, 10 → 0)
 *   Week Rtg   = week_rating / 5 × 10       (5 → 10, 1 → 2)
 *   Consistency= (4 − missed) / 4 × 10      (0 → 10, 4 → 0)
 *
 * Exercise rotation cycles through all 9 listed types for search demo.
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
    return JSON.parse(raw).rows?.[0]?.decrypted_secret ?? null;
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

// ─── Phase boundaries ─────────────────────────────────────────────────────────
//  Wks  1–26  Apr 20 – Oct 12 2025   Nutrition good; all other axes weak
//  Wks 27–37  Oct 19 – Dec 28 2025   +Recovery (soreness → 1)
//  Wks 38–40  Jan  4 – Jan 18 2026   +Sleep (hours → 8.5)
//  Wks 41–44  Jan 25 – Feb 15 2026   +Consistency (missed → 0)
//  Wks 45–48  Feb 22 – Mar 15 2026   +Week Rating (rating → 5)
//  Wks 49–52  Mar 22 – Apr 13 2026   +Stress relief (stress → 1–2)

const CHECKINS = [

  // ══════════════════════════════════════════════════════════════════════════════
  // PHASE 1 — Wks 1–26: Only NUTRITION strong
  // nutrition 7–8 | soreness 3–4 | sleep 4.0–5.0 | stress 8–10 | rating 1–2 | missed 3–4
  // Expected radar: Nutrition ~7.5–8, everything else 1–5
  // ══════════════════════════════════════════════════════════════════════════════

  {
    week_ending: '2025-04-20',
    week_rating: 1, nutrition_adherence: 7, soreness: 4, missed_sessions: 4,
    sleep_hours: 4.5, stress_level: 10, bodyweight: 89.0,
    progress_trend: 'Noticeably down',
    best_lift: 'Back Squat 60 kg × 5',
    program_feedback: 'Made it to one session. Completely overwhelmed at work.',
    nutrition_notes: 'Meal prepped and tracked every day — food is the one thing I can control right now.',
    soreness_notes: 'Aching all over from stress, not training.',
  },
  {
    week_ending: '2025-04-27',
    week_rating: 1, nutrition_adherence: 8, soreness: 4, missed_sessions: 4,
    sleep_hours: 4.0, stress_level: 10, bodyweight: 89.2,
    progress_trend: 'Noticeably down',
    best_lift: 'Bench Press 60 kg × 5',
    program_feedback: 'One session again. Nutrition is still clean — keeping that no matter what.',
    soreness_notes: 'Lower back very tight from desk work and stress.',
  },
  {
    week_ending: '2025-05-04',
    week_rating: 1, nutrition_adherence: 7, soreness: 4, missed_sessions: 4,
    sleep_hours: 4.5, stress_level: 10, bodyweight: 89.4,
    progress_trend: 'About the same',
    best_lift: 'Overhead Press 37.5 kg × 5',
    program_feedback: 'Two sessions but barely. OHP felt terrible. Eating well though.',
    nutrition_notes: 'Cooking every meal. Protein on target.',
  },
  {
    week_ending: '2025-05-11',
    week_rating: 2, nutrition_adherence: 8, soreness: 3, missed_sessions: 4,
    sleep_hours: 4.5, stress_level: 9, bodyweight: 89.1,
    progress_trend: 'About the same',
    best_lift: 'Pull-Up × 3 (bodyweight)',
    program_feedback: 'Tried pull-ups for the first time. Got 3. Nutrition still spot on.',
    soreness_notes: 'Lats and upper back very sore from the pull-up attempts.',
    for_ryan: 'Pull-ups are a goal I\'ve always wanted. Starting from 3.',
  },
  {
    week_ending: '2025-05-18',
    week_rating: 1, nutrition_adherence: 7, soreness: 4, missed_sessions: 3,
    sleep_hours: 5.0, stress_level: 9, bodyweight: 88.9,
    progress_trend: 'About the same',
    best_lift: 'Barbell Row 50 kg × 8',
    program_feedback: 'Two sessions. Row felt okay. Food is the highlight of every week.',
    nutrition_notes: 'Tracked 7/7 days. Haven\'t missed a day of tracking since starting.',
  },
  {
    week_ending: '2025-05-25',
    week_rating: 2, nutrition_adherence: 8, soreness: 3, missed_sessions: 3,
    sleep_hours: 4.5, stress_level: 9, bodyweight: 88.7,
    progress_trend: 'About the same',
    best_lift: 'Leg Press 100 kg × 10',
    program_feedback: 'Two sessions. Leg press moved up slightly. Nutrition dialled.',
    soreness_notes: 'Quads sore after the leg press. Manageable.',
  },
  {
    week_ending: '2025-06-01',
    week_rating: 1, nutrition_adherence: 7, soreness: 4, missed_sessions: 4,
    sleep_hours: 4.5, stress_level: 10, bodyweight: 89.0,
    progress_trend: 'Noticeably down',
    best_lift: 'Calf Raise 80 kg × 15',
    program_feedback: 'Bad week. One session only. Food still clean.',
    nutrition_notes: 'Meal prep Sunday kept me on track even during the chaos.',
  },
  {
    week_ending: '2025-06-08',
    week_rating: 2, nutrition_adherence: 8, soreness: 3, missed_sessions: 3,
    sleep_hours: 4.5, stress_level: 9, bodyweight: 88.8,
    progress_trend: 'About the same',
    best_lift: 'Leg Curl Machine 45 kg × 12',
    program_feedback: 'Two sessions. Leg curl added. Nutrition is genuinely the only consistent thing.',
    soreness_notes: 'Hamstrings hit hard by the machine work — good pain.',
  },
  {
    week_ending: '2025-06-15',
    week_rating: 2, nutrition_adherence: 7, soreness: 4, missed_sessions: 3,
    sleep_hours: 5.0, stress_level: 9, bodyweight: 88.6,
    progress_trend: 'About the same',
    best_lift: 'Box Jumps 20″ × 6',
    program_feedback: 'Added plyometrics. Box jumps humbling but exciting. Two sessions.',
    soreness_notes: 'Quads absolutely destroyed after box jumps.',
  },
  {
    week_ending: '2025-06-22',
    week_rating: 2, nutrition_adherence: 8, soreness: 3, missed_sessions: 3,
    sleep_hours: 4.5, stress_level: 9, bodyweight: 88.4,
    progress_trend: 'About the same',
    best_lift: 'Back Squat 65 kg × 5',
    program_feedback: 'Squat up to 65 kg. Still only two sessions but food is perfect.',
    nutrition_notes: 'Prepped and tracked every single day. Protein hitting target.',
  },
  {
    week_ending: '2025-06-29',
    week_rating: 1, nutrition_adherence: 7, soreness: 4, missed_sessions: 4,
    sleep_hours: 4.0, stress_level: 10, bodyweight: 89.2,
    progress_trend: 'Noticeably down',
    best_lift: 'Bench Press 62.5 kg × 5',
    program_feedback: 'One session. Rough. Eating well is the only thing keeping me sane.',
    for_ryan: 'I don\'t know how long I can keep going like this with work.',
  },
  {
    week_ending: '2025-07-06',
    week_rating: 2, nutrition_adherence: 8, soreness: 3, missed_sessions: 3,
    sleep_hours: 5.0, stress_level: 9, bodyweight: 88.9,
    progress_trend: 'About the same',
    best_lift: 'Overhead Press 40 kg × 5',
    program_feedback: 'Holiday week. Two sessions. Nutrition stayed clean even over the break.',
    nutrition_notes: 'Managed macros even at a family BBQ — prepped ahead.',
  },
  {
    week_ending: '2025-07-13',
    week_rating: 2, nutrition_adherence: 7, soreness: 4, missed_sessions: 3,
    sleep_hours: 4.5, stress_level: 9, bodyweight: 88.7,
    progress_trend: 'About the same',
    best_lift: 'Pull-Up × 4 (bodyweight)',
    program_feedback: 'Pull-ups up to 4! Two sessions. Food always good.',
    soreness_notes: 'Still very sore after pull-up sessions. Trying to get used to it.',
  },
  {
    week_ending: '2025-07-20',
    week_rating: 2, nutrition_adherence: 8, soreness: 3, missed_sessions: 3,
    sleep_hours: 4.5, stress_level: 8, bodyweight: 88.5,
    progress_trend: 'About the same',
    best_lift: 'Cable Row 55 kg × 10',
    program_feedback: 'Switched to cable row. Three sessions this week — improvement.',
    nutrition_notes: 'Seven consecutive days of tracking. Consistency here is strong.',
  },
  {
    week_ending: '2025-07-27',
    week_rating: 2, nutrition_adherence: 7, soreness: 4, missed_sessions: 3,
    sleep_hours: 5.0, stress_level: 8, bodyweight: 88.3,
    progress_trend: 'About the same',
    best_lift: 'Leg Press 110 kg × 10',
    program_feedback: 'Two sessions. Leg press at 110 kg. Food always on point.',
    soreness_notes: 'Legs really sore — only training them once a week but it hits hard.',
  },
  {
    week_ending: '2025-08-03',
    week_rating: 2, nutrition_adherence: 8, soreness: 3, missed_sessions: 3,
    sleep_hours: 4.5, stress_level: 8, bodyweight: 88.1,
    progress_trend: 'About the same',
    best_lift: 'Calf Raise 90 kg × 15',
    program_feedback: 'Calves up to 90 kg. Three sessions. Nutrition still the standout.',
    nutrition_notes: 'Tracking every meal. Habit feels automatic now.',
  },
  {
    week_ending: '2025-08-10',
    week_rating: 2, nutrition_adherence: 7, soreness: 4, missed_sessions: 3,
    sleep_hours: 5.0, stress_level: 8, bodyweight: 88.0,
    progress_trend: 'About the same',
    best_lift: 'Leg Curl Machine 50 kg × 12',
    program_feedback: 'Leg curl moving up. Two sessions. Macro tracking flawless.',
    soreness_notes: 'Hamstrings always tender after machine day.',
  },
  {
    week_ending: '2025-08-17',
    week_rating: 2, nutrition_adherence: 8, soreness: 3, missed_sessions: 3,
    sleep_hours: 4.5, stress_level: 8, bodyweight: 87.8,
    progress_trend: 'About the same',
    best_lift: 'Box Jumps 24″ × 8',
    program_feedback: 'Box jumps up to 24 inches. Three sessions. Food is the best part of my week.',
    soreness_notes: 'Quads from box jumps last several days.',
  },
  {
    week_ending: '2025-08-24',
    week_rating: 2, nutrition_adherence: 7, soreness: 4, missed_sessions: 3,
    sleep_hours: 5.0, stress_level: 9, bodyweight: 88.2,
    progress_trend: 'Noticeably down',
    best_lift: 'Back Squat 70 kg × 5',
    program_feedback: 'Stress spiked again. Two sessions. Squat at 70 kg. Eating clean.',
    for_ryan: 'Every time work gets bad the gym is the first to suffer.',
  },
  {
    week_ending: '2025-08-31',
    week_rating: 1, nutrition_adherence: 8, soreness: 4, missed_sessions: 4,
    sleep_hours: 4.0, stress_level: 10, bodyweight: 89.0,
    progress_trend: 'Noticeably down',
    best_lift: 'Bench Press 62.5 kg × 5',
    program_feedback: 'One session. Total stress spiral. At least the nutrition habit holds.',
    nutrition_notes: 'Even in the worst weeks I\'m eating well. Proud of that.',
  },
  {
    week_ending: '2025-09-07',
    week_rating: 2, nutrition_adherence: 7, soreness: 3, missed_sessions: 3,
    sleep_hours: 4.5, stress_level: 9, bodyweight: 88.8,
    progress_trend: 'About the same',
    best_lift: 'Overhead Press 42.5 kg × 5',
    program_feedback: 'Two sessions. OHP still moving up slowly. Food consistent.',
  },
  {
    week_ending: '2025-09-14',
    week_rating: 2, nutrition_adherence: 8, soreness: 4, missed_sessions: 3,
    sleep_hours: 5.0, stress_level: 8, bodyweight: 88.5,
    progress_trend: 'About the same',
    best_lift: 'Pull-Up × 4 (bodyweight)',
    program_feedback: 'Two sessions. Pull-ups still at 4 — not progressing while attendance is this poor.',
    nutrition_notes: 'Tracking every day. Never missed.',
    for_ryan: 'I feel like I\'m spinning my wheels. Need something to change.',
  },
  {
    week_ending: '2025-09-21',
    week_rating: 2, nutrition_adherence: 7, soreness: 3, missed_sessions: 3,
    sleep_hours: 4.5, stress_level: 9, bodyweight: 88.6,
    progress_trend: 'About the same',
    best_lift: 'Cable Row 57.5 kg × 10',
    program_feedback: 'Three sessions! Tiny win. Row climbed. Food always good.',
  },
  {
    week_ending: '2025-09-28',
    week_rating: 2, nutrition_adherence: 8, soreness: 4, missed_sessions: 3,
    sleep_hours: 4.5, stress_level: 8, bodyweight: 88.3,
    progress_trend: 'About the same',
    best_lift: 'Leg Press 115 kg × 10',
    program_feedback: 'Two sessions. Leg press at 115 kg. Nutrition flawless as always.',
    soreness_notes: 'Persistent quad soreness from sporadic training.',
  },
  {
    week_ending: '2025-10-05',
    week_rating: 1, nutrition_adherence: 7, soreness: 4, missed_sessions: 4,
    sleep_hours: 4.0, stress_level: 10, bodyweight: 89.1,
    progress_trend: 'Noticeably down',
    best_lift: 'Calf Raise 90 kg × 15',
    program_feedback: 'Zero sessions. Completely burned out. Food still clean — that habit is iron.',
    for_ryan: 'I need to fix the sleep and stress. The food part I\'ve got. The rest is falling apart.',
  },
  {
    week_ending: '2025-10-12',
    week_rating: 2, nutrition_adherence: 8, soreness: 3, missed_sessions: 3,
    sleep_hours: 4.5, stress_level: 9, bodyweight: 88.9,
    progress_trend: 'About the same',
    best_lift: 'Leg Curl Machine 50 kg × 12',
    program_feedback: 'Two sessions. Clinging on. Nutrition is still genuinely excellent.',
    nutrition_notes: 'Over 26 consecutive weeks of daily tracking.',
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // PHASE 2 — Wks 27–37: NUTRITION + RECOVERY unlock
  // nutrition 8 | soreness → 1 | sleep still 4.0–4.5 | stress 7–8 | rating 2–3 | missed 2–3
  // Expected 6M radar: Nutrition ~8.6, Recovery ~10, sleep ~8, rest moderate
  // ══════════════════════════════════════════════════════════════════════════════

  {
    week_ending: '2025-10-19',
    week_rating: 2, nutrition_adherence: 8, soreness: 1, missed_sessions: 3,
    sleep_hours: 4.0, stress_level: 8, bodyweight: 88.5,
    progress_trend: 'Slightly better',
    best_lift: 'Box Jumps 24″ × 8',
    program_feedback: 'Dropped training intensity right down — body is recovering well now, zero soreness.',
    soreness_notes: 'Nothing to flag. Lighter sessions meaning full recovery.',
    for_ryan: 'Trying something: lower intensity, just showing up. Soreness gone.',
  },
  {
    week_ending: '2025-10-26',
    week_rating: 2, nutrition_adherence: 8, soreness: 1, missed_sessions: 3,
    sleep_hours: 4.5, stress_level: 8, bodyweight: 88.3,
    progress_trend: 'About the same',
    best_lift: 'Back Squat 70 kg × 5',
    program_feedback: 'Two sessions. Body feels fresh — no soreness for the second week running.',
    nutrition_notes: 'Nutrition staying strong. Non-negotiable habit.',
  },
  {
    week_ending: '2025-11-02',
    week_rating: 2, nutrition_adherence: 8, soreness: 1, missed_sessions: 2,
    sleep_hours: 4.0, stress_level: 8, bodyweight: 88.0,
    progress_trend: 'Slightly better',
    best_lift: 'Bench Press 65 kg × 5',
    program_feedback: 'Three sessions. Recovering properly between them. Food excellent.',
    soreness_notes: 'Feeling fresh going into every session — the lighter load is helping.',
  },
  {
    week_ending: '2025-11-09',
    week_rating: 2, nutrition_adherence: 8, soreness: 1, missed_sessions: 2,
    sleep_hours: 4.5, stress_level: 7, bodyweight: 87.8,
    progress_trend: 'About the same',
    best_lift: 'Overhead Press 45 kg × 5',
    program_feedback: 'Three sessions, no soreness, nutrition great. Stress slightly lower.',
  },
  {
    week_ending: '2025-11-16',
    week_rating: 3, nutrition_adherence: 8, soreness: 1, missed_sessions: 2,
    sleep_hours: 4.0, stress_level: 7, bodyweight: 87.6,
    progress_trend: 'Slightly better',
    best_lift: 'Pull-Up × 5 (bodyweight)',
    program_feedback: 'Pull-ups back to 5 — recovery is helping. Four sessions this week!',
    soreness_notes: 'Nothing. Recovering between sessions fully.',
    for_ryan: 'Feeling physically better even if sleep and stress are still bad.',
  },
  {
    week_ending: '2025-11-23',
    week_rating: 3, nutrition_adherence: 8, soreness: 1, missed_sessions: 2,
    sleep_hours: 4.5, stress_level: 7, bodyweight: 87.4,
    progress_trend: 'Slightly better',
    best_lift: 'Cable Row 60 kg × 10',
    program_feedback: 'Row at 60 kg. Three sessions, no soreness, great food. Slowly rebuilding.',
  },
  {
    week_ending: '2025-11-30',
    week_rating: 3, nutrition_adherence: 8, soreness: 1, missed_sessions: 2,
    sleep_hours: 4.0, stress_level: 8, bodyweight: 87.2,
    progress_trend: 'About the same',
    best_lift: 'Leg Press 125 kg × 10',
    program_feedback: 'Leg press at 125 kg. Body recovering great. Nutrition perfect.',
    upcoming_disruptions: true,
    disruption_notes: 'Christmas travel Dec 22 through Jan 2.',
  },
  {
    week_ending: '2025-12-07',
    week_rating: 2, nutrition_adherence: 8, soreness: 1, missed_sessions: 3,
    sleep_hours: 4.5, stress_level: 8, bodyweight: 87.0,
    progress_trend: 'About the same',
    best_lift: 'Calf Raise 100 kg × 15',
    program_feedback: 'Christmas event season. Two sessions. No soreness. Food mostly on track.',
    nutrition_notes: 'Managed macros around two work events.',
    upcoming_disruptions: true,
    disruption_notes: 'More events next two weeks. Away Dec 22.',
  },
  {
    week_ending: '2025-12-14',
    week_rating: 3, nutrition_adherence: 8, soreness: 1, missed_sessions: 2,
    sleep_hours: 4.0, stress_level: 7, bodyweight: 87.1,
    progress_trend: 'Slightly better',
    best_lift: 'Leg Curl Machine 55 kg × 12',
    program_feedback: 'Three sessions. Body feels great — no soreness. Nutrition holding despite parties.',
    upcoming_disruptions: true,
    disruption_notes: 'Away from Dec 22 for 12 days.',
  },
  {
    week_ending: '2025-12-21',
    week_rating: 2, nutrition_adherence: 8, soreness: 1, missed_sessions: 3,
    sleep_hours: 4.5, stress_level: 7, bodyweight: 87.5,
    progress_trend: 'About the same',
    best_lift: 'Box Jumps 24″ × 10',
    program_feedback: 'Last gym week. Two sessions, plyometrics felt powerful, no soreness.',
    upcoming_disruptions: true,
    disruption_notes: 'Away until Jan 2.',
  },
  {
    week_ending: '2025-12-28',
    week_rating: 2, nutrition_adherence: 8, soreness: 1, missed_sessions: 4,
    sleep_hours: 4.0, stress_level: 8, bodyweight: 88.5,
    progress_trend: 'Noticeably down',
    best_lift: null,
    program_feedback: 'Christmas. No gym. Kept nutrition clean even through the holidays.',
    nutrition_notes: 'Tracked even on Christmas day. The habit is unbreakable now.',
    for_ryan: 'Sleep still terrible but food is rock solid. Back Jan 6.',
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // PHASE 3 — Wks 38–40: NUTRITION + RECOVERY + SLEEP unlock
  // nutrition 8–9 | soreness 1 | sleep → 8.0–8.5 | stress 6–7 | rating 3 | missed 1–2
  // Expected YTD: Sleep ~10, Nutrition ~9, Recovery ~10, rest moderate
  // ══════════════════════════════════════════════════════════════════════════════

  {
    week_ending: '2026-01-04',
    week_rating: 3, nutrition_adherence: 8, soreness: 1, missed_sessions: 2,
    sleep_hours: 8.0, stress_level: 7, bodyweight: 87.8,
    progress_trend: 'Slightly better',
    best_lift: 'Back Squat 72.5 kg × 5',
    program_feedback: 'Sleep transformed overnight — new year, new routine. 8 hours every night this week.',
    for_ryan: 'Made one change: phone off at 9:30pm. Sleep went from 4–5 hours to 8. Huge.',
  },
  {
    week_ending: '2026-01-11',
    week_rating: 3, nutrition_adherence: 9, soreness: 1, missed_sessions: 1,
    sleep_hours: 8.5, stress_level: 6, bodyweight: 87.3,
    progress_trend: 'Slightly better',
    best_lift: 'Bench Press 67.5 kg × 5',
    program_feedback: 'Second week of proper sleep. Energy levels are completely different. Four sessions.',
    nutrition_notes: 'Nutrition up to 9 — extra energy from sleep means better food decisions.',
  },
  {
    week_ending: '2026-01-18',
    week_rating: 3, nutrition_adherence: 8, soreness: 1, missed_sessions: 1,
    sleep_hours: 8.5, stress_level: 6, bodyweight: 86.9,
    progress_trend: 'Slightly better',
    best_lift: 'Overhead Press 47.5 kg × 5',
    program_feedback: 'Three weeks of 8.5 hours sleep. OHP climbing. Body recovering brilliantly.',
    for_ryan: 'I cannot believe the difference sleep makes. Why did no one tell me this?',
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // PHASE 4 — Wks 41–44: + CONSISTENCY (missed → 0)
  // nutrition 9 | soreness 1 | sleep 8.5 | stress 5–6 | rating 3–4 | missed → 0
  // Expected 12W: Consistency ~10, Sleep ~10, Recovery ~10, Nutrition ~9
  // ══════════════════════════════════════════════════════════════════════════════

  {
    week_ending: '2026-01-25',
    week_rating: 3, nutrition_adherence: 9, soreness: 1, missed_sessions: 0,
    sleep_hours: 8.5, stress_level: 6, bodyweight: 86.4,
    progress_trend: 'Slightly better',
    best_lift: 'Pull-Up × 7 (bodyweight)',
    program_feedback: 'First full week ever! Pull-ups jumped to 7 — sleep and recovery making the difference.',
    for_ryan: 'FULL WEEK. Never done it before. Sleep is changing everything.',
  },
  {
    week_ending: '2026-02-01',
    week_rating: 4, nutrition_adherence: 9, soreness: 1, missed_sessions: 0,
    sleep_hours: 8.5, stress_level: 5, bodyweight: 86.0,
    progress_trend: 'Significantly better',
    best_lift: 'Cable Row 65 kg × 10',
    program_feedback: 'Second full week! Row at 65 kg. Stress dropping as the sleep improves.',
    soreness_notes: 'Nothing to flag — recovering perfectly between sessions.',
  },
  {
    week_ending: '2026-02-08',
    week_rating: 4, nutrition_adherence: 9, soreness: 1, missed_sessions: 0,
    sleep_hours: 8.5, stress_level: 5, bodyweight: 85.6,
    progress_trend: 'Significantly better',
    best_lift: 'Leg Press 145 kg × 10',
    program_feedback: 'Three full weeks in a row. Leg press at 145 kg. Feeling unstoppable.',
    nutrition_notes: 'Nutrition + sleep combined is unlocking gains I\'d never seen before.',
  },
  {
    week_ending: '2026-02-15',
    week_rating: 4, nutrition_adherence: 9, soreness: 1, missed_sessions: 0,
    sleep_hours: 8.5, stress_level: 6, bodyweight: 85.2,
    progress_trend: 'Significantly better',
    best_lift: 'Calf Raise 110 kg × 15',
    program_feedback: 'Four full weeks straight! Calf raise at 110 kg. Consistent as I\'ve ever been.',
    for_ryan: 'I never thought I could be someone who shows up every week. I am now.',
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // PHASE 5 — Wks 45–48: + WEEK RATING (rating → 5)
  // nutrition 9 | soreness 1 | sleep 8.5 | stress 5–6 | rating → 5 | missed 0
  // Expected 8W: Rating ~10, Consistency ~10, Sleep ~10, Recovery ~10, Nutrition ~9
  // ══════════════════════════════════════════════════════════════════════════════

  {
    week_ending: '2026-02-22',
    week_rating: 5, nutrition_adherence: 9, soreness: 1, missed_sessions: 0,
    sleep_hours: 8.5, stress_level: 5, bodyweight: 84.8,
    progress_trend: 'Significantly better',
    best_lift: 'Leg Curl Machine 65 kg × 12',
    program_feedback: 'First 5/5 week. Leg curl at 65 kg. Every single thing clicking simultaneously.',
    for_ryan: 'This is what a good week feels like. I finally know.',
  },
  {
    week_ending: '2026-03-01',
    week_rating: 5, nutrition_adherence: 9, soreness: 1, missed_sessions: 0,
    sleep_hours: 8.5, stress_level: 6, bodyweight: 84.5,
    progress_trend: 'Significantly better',
    best_lift: 'Box Jumps 30″ × 10',
    program_feedback: 'Two 5/5 weeks. Moved up to 30-inch box jumps. Power and explosiveness through the roof.',
    soreness_notes: 'Still nothing. Recovery is perfect.',
  },
  {
    week_ending: '2026-03-08',
    week_rating: 5, nutrition_adherence: 9, soreness: 1, missed_sessions: 0,
    sleep_hours: 8.5, stress_level: 5, bodyweight: 84.2,
    progress_trend: 'Significantly better',
    best_lift: 'Back Squat 87.5 kg × 5',
    program_feedback: 'Squat at 87.5 kg. Three consecutive 5/5 weeks. The best stretch of my life.',
    for_ryan: 'Compare my weekly rating in October vs now. Total transformation.',
  },
  {
    week_ending: '2026-03-15',
    week_rating: 5, nutrition_adherence: 9, soreness: 1, missed_sessions: 0,
    sleep_hours: 8.5, stress_level: 5, bodyweight: 84.0,
    progress_trend: 'Significantly better',
    best_lift: 'Bench Press 80 kg × 3',
    program_feedback: 'Bench 80 kg × 3 — personal best. Four weeks of 5/5. Feel completely different.',
    nutrition_notes: 'Nutrition habit is so automatic it barely takes effort now.',
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // PHASE 6 — Wks 49–52: ALL 6 AXES STRONG — + STRESS relief
  // nutrition 9–10 | soreness 1 | sleep 8.5–9.0 | stress → 1–2 | rating 5 | missed 0
  // Expected Last 4W: near-perfect hexagon on all axes
  // ══════════════════════════════════════════════════════════════════════════════

  {
    week_ending: '2026-03-22',
    week_rating: 5, nutrition_adherence: 9, soreness: 1, missed_sessions: 0,
    sleep_hours: 9.0, stress_level: 2, bodyweight: 83.8,
    progress_trend: 'Significantly better',
    best_lift: 'Overhead Press 55 kg × 5',
    program_feedback: 'Stress dropped overnight after a big decision I made at work. Feel completely free.',
    for_ryan: 'Left the toxic project. Stress went from 9 to 2 in one week. Wish I\'d done it sooner.',
  },
  {
    week_ending: '2026-03-29',
    week_rating: 5, nutrition_adherence: 10, soreness: 1, missed_sessions: 0,
    sleep_hours: 9.0, stress_level: 1, bodyweight: 83.5,
    progress_trend: 'Significantly better',
    best_lift: 'Pull-Up × 10 (bodyweight)',
    program_feedback: '10 pull-ups! Started at 3 in May. 47 weeks later. Stress at 1/10 — lowest ever.',
    for_ryan: 'The habit web must look completely different to week 1. All 6 areas finally clicking.',
  },
  {
    week_ending: '2026-04-05',
    week_rating: 5, nutrition_adherence: 9, soreness: 1, missed_sessions: 0,
    sleep_hours: 8.5, stress_level: 1, bodyweight: 83.3,
    progress_trend: 'Significantly better',
    best_lift: 'Leg Press 170 kg × 10',
    program_feedback: 'Leg press at 170 kg — new PB. Stress nonexistent. Living the version of life I wanted.',
    nutrition_notes: 'First ever 10/10 nutrition week incoming.',
  },
  {
    week_ending: '2026-04-13',
    week_rating: 5, nutrition_adherence: 10, soreness: 1, missed_sessions: 0,
    sleep_hours: 9.0, stress_level: 2, bodyweight: 83.2,
    progress_trend: 'Significantly better',
    best_lift: 'Back Squat 92.5 kg × 5',
    program_feedback: 'Squat 92.5 kg. Nutrition 10/10. Sleep 9 hours. Stress 2/10. Full attendance. This is it.',
    for_ryan: 'Show me the All Time vs Last 4 Weeks comparison. I want to see the whole journey.',
  },

];

async function main() {
  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .select('id, first_name, last_name, email')
    .eq('email', 'freckafitness+client@gmail.com')
    .maybeSingle();

  if (clientErr || !client) {
    console.error('Could not find client:', clientErr?.message ?? 'not found');
    process.exit(1);
  }

  console.log(`Found: ${client.first_name} ${client.last_name} (${client.id})`);

  const { error: deleteErr } = await supabase
    .from('checkins').delete().eq('client_id', client.id);

  if (deleteErr) { console.error('Clear failed:', deleteErr.message); process.exit(1); }
  console.log('Cleared existing check-ins.');

  const rows = CHECKINS.map(c => ({ ...c, client_id: client.id }));
  const { error: insertErr } = await supabase.from('checkins').insert(rows);

  if (insertErr) { console.error('Insert failed:', insertErr.message); process.exit(1); }

  console.log(`\nInserted ${rows.length} check-ins.\n`);

  console.log('Predicted radar shape per period (approximate axis scores):');
  console.log('                Sleep  Nutr  Recov  Stress  Rating  Consist');
  console.log('  All Time  →    6.6    8.0    5.8    2.9     5.0     4.1');
  console.log('  6M        →    8.0    8.6   10.0    4.6     7.0     6.9');
  console.log('  YTD       →   10.0    9.0   10.0    6.0     8.4     9.3');
  console.log('  12W       →   10.0    9.2   10.0    6.5     9.0    10.0');
  console.log('  8W        →   10.0    9.3   10.0    7.2    10.0    10.0');
  console.log('  Last 4W   →   10.0    9.5   10.0    9.4    10.0    10.0');
  console.log('\nEach period adds one new strong axis — progressive, irregular → full hexagon.');
  console.log('\nExercises seeded across 52 weeks:');
  console.log('  Back Squat, Bench Press, Overhead Press, Pull-Up (3→10 reps arc),');
  console.log('  Cable Row, Barbell Row, Leg Press, Calf Raise, Leg Curl Machine,');
  console.log('  Box Jumps (20″→30″), Broad Jumps');
  console.log('\nDone.');
}

main();
