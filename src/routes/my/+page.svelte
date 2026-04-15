<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { supabase } from '$lib/supabase.js';
  import Header from '$lib/Header.svelte';

  let client     = null;
  let checkins   = [];
  let checkinDone = false;

  const SORENESS_LABELS = { 1: 'Nothing to Flag', 2: 'Minor Soreness', 3: 'Persistent Soreness', 4: 'Pain — Needs Attention' };
  const RATING_COLORS   = { 1: '#E87878', 2: '#E8BF60', 3: '#72C872', 4: '#5CC4B8', 5: '#6888E8' };
  const RATING_LABELS   = { 1: 'Rough', 2: 'Below Average', 3: 'Average', 4: 'Above Average', 5: 'Great' };

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { goto('/login'); return; }

    const { data: role } = await supabase.from('user_roles').select('role, client_id').single();
    if (role?.role === 'coach') { goto('/dashboard'); return; }

    const [{ data: clientData }, { data: checkinData }] = await Promise.all([
      supabase.from('clients')
        .select('first_name, last_name')
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user.id)
        .single(),
      supabase.from('checkins')
        .select('id, week_ending, week_rating, missed_sessions, progress_trend, soreness, nutrition_adherence, best_lift, program_feedback, soreness_notes, nutrition_notes, for_ryan, coach_notes, coach_notes_updated_at')
        .eq('client_id', role.client_id)
        .order('week_ending', { ascending: false }),
    ]);

    client   = clientData;
    checkins = checkinData ?? [];

    checkinDone = $page.url.searchParams.get('checkin') === 'done';
  });

  function fmtDate(d) {
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
</script>

<svelte:head><title>My Portal — Frecka Fitness</title></svelte:head>

<div class="page">
  <Header />
  <main>
    <p class="eyebrow">Client Portal</p>
    <h1>Welcome{client ? `, ${client.first_name}` : ''}</h1>

    {#if checkinDone}
      <div class="success-banner">
        Check-in submitted — I'll review and respond before next week.
      </div>
    {/if}

    <div class="actions">
      <a href="/my/checkin" class="btn-primary">Submit Weekly Check-In</a>
    </div>

    <!-- Check-in history -->
    {#if checkins.length > 0}
      <section>
        <h2>Check-In History <span class="count">{checkins.length}</span></h2>

        <div class="checkin-list">
          {#each checkins as c}
            <div class="checkin-card">

              <!-- Header -->
              <div class="card-header">
                <div class="card-header-left">
                  <span class="week-label">Week ending {fmtDate(c.week_ending)}</span>
                  {#if c.missed_sessions}
                    <span class="missed-badge">{c.missed_sessions === 4 ? '>3' : c.missed_sessions} missed</span>
                  {/if}
                </div>
                {#if c.week_rating}
                  <div class="rating-chip" style="border-color: {RATING_COLORS[c.week_rating]}; color: {RATING_COLORS[c.week_rating]};">
                    <span class="rating-dot" style="background: {RATING_COLORS[c.week_rating]};"></span>
                    {RATING_LABELS[c.week_rating]}
                  </div>
                {/if}
              </div>

              <!-- Quick metrics -->
              <div class="metrics-row">
                {#if c.progress_trend}
                  <div class="metric">
                    <span class="metric-label">Performance</span>
                    <span class="metric-value">{c.progress_trend}</span>
                  </div>
                {/if}
                {#if c.soreness}
                  <div class="metric">
                    <span class="metric-label">Soreness</span>
                    <span class="metric-value">{SORENESS_LABELS[c.soreness]}</span>
                  </div>
                {/if}
                {#if c.nutrition_adherence}
                  <div class="metric">
                    <span class="metric-label">Nutrition</span>
                    <span class="metric-value">{c.nutrition_adherence} / 10</span>
                  </div>
                {/if}
              </div>

              <!-- Your submission -->
              <div class="card-fields">
                {#if c.best_lift}
                  <div class="card-field">
                    <p class="field-label">Best Lift</p>
                    <p class="field-value">{c.best_lift}</p>
                  </div>
                {/if}
                {#if c.program_feedback}
                  <div class="card-field card-field--full">
                    <p class="field-label">Program Feedback</p>
                    <p class="field-value">{c.program_feedback}</p>
                  </div>
                {/if}
                {#if c.soreness_notes}
                  <div class="card-field card-field--full">
                    <p class="field-label">Soreness Notes</p>
                    <p class="field-value">{c.soreness_notes}</p>
                  </div>
                {/if}
                {#if c.nutrition_notes}
                  <div class="card-field card-field--full">
                    <p class="field-label">Nutrition Notes</p>
                    <p class="field-value">{c.nutrition_notes}</p>
                  </div>
                {/if}
                {#if c.for_ryan}
                  <div class="card-field card-field--full for-me">
                    <p class="field-label">Your note to me</p>
                    <p class="field-value">{c.for_ryan}</p>
                  </div>
                {/if}
              </div>

              <!-- Coach notes -->
              {#if c.coach_notes}
                <div class="coach-note">
                  <p class="coach-note-label">Ryan's Notes</p>
                  <p class="coach-note-text">{c.coach_notes}</p>
                </div>
              {/if}

            </div>
          {/each}
        </div>
      </section>
    {/if}

  </main>
</div>

<style>
  .page { min-height: 100vh; }

  main { max-width: 720px; margin: 0 auto; padding: 48px 32px 80px; }

  .eyebrow {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 10px;
  }

  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: var(--black);
    margin-bottom: 28px;
  }

  .success-banner {
    background: #d4edda;
    color: var(--success);
    border-radius: 8px;
    padding: 14px 18px;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 24px;
  }

  .actions { margin-bottom: 48px; }

  .btn-primary {
    display: inline-block;
    background: var(--black);
    color: var(--off-white);
    text-decoration: none;
    font-family: 'Halyard Display', sans-serif;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 14px 32px;
    border-radius: 6px;
    position: relative;
    overflow: hidden;
    transition: background 0.15s;
  }

  .btn-primary::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 3px;
    background: var(--accent);
  }

  .btn-primary:hover { background: #1f2f45; }

  /* Section */
  section { margin-top: 8px; }

  h2 {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--black);
    border-bottom: 1px solid var(--light-grey);
    padding-bottom: 10px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .count {
    background: var(--black);
    color: var(--off-white);
    font-size: 11px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 20px;
    letter-spacing: 0.05em;
  }

  /* Cards */
  .checkin-list { display: flex; flex-direction: column; gap: 20px; }

  .checkin-card {
    border: 1px solid var(--light-grey);
    border-radius: 8px;
    overflow: hidden;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    background: var(--black);
    gap: 12px;
  }

  .card-header-left { display: flex; align-items: center; gap: 10px; }

  .week-label { font-size: 13px; font-weight: 700; color: var(--off-white); letter-spacing: 0.04em; }

  .missed-badge {
    font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
    background: rgba(232,120,120,0.2); color: #E87878; border: 1px solid rgba(232,120,120,0.4);
    border-radius: 20px; padding: 2px 8px;
  }

  .rating-chip {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 700; padding: 4px 12px;
    border-radius: 20px; border: 1.5px solid; white-space: nowrap; background: white;
  }

  .rating-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

  .metrics-row { display: flex; border-bottom: 1px solid var(--light-grey); }

  .metric { flex: 1; padding: 10px 18px; border-right: 1px solid var(--light-grey); }
  .metric:last-child { border-right: none; }

  .metric-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--mid-grey); margin-bottom: 2px; }
  .metric-value { font-size: 13px; font-weight: 600; color: var(--black); }

  .card-fields { display: grid; grid-template-columns: 1fr 1fr; padding: 16px 18px; border-bottom: 1px solid var(--light-grey); gap: 0; }

  .card-field { padding: 6px 0; }
  .card-field--full { grid-column: 1 / -1; }

  .for-me {
    background: var(--warm-white); border-radius: 4px;
    padding: 8px 10px; margin-top: 4px; grid-column: 1 / -1;
  }

  .field-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--mid-grey); margin-bottom: 3px; }
  .field-value { font-size: 14px; color: var(--black); line-height: 1.5; white-space: pre-wrap; }

  /* Coach note */
  .coach-note {
    padding: 16px 18px;
    background: #eef4ff;
    border-top: 2px solid #6888E8;
  }

  .coach-note-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #6888E8;
    margin-bottom: 6px;
  }

  .coach-note-text {
    font-size: 14px;
    color: var(--black);
    line-height: 1.6;
    white-space: pre-wrap;
  }
</style>
