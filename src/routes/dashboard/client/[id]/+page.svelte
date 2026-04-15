<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { supabase } from '$lib/supabase.js';
  import Header from '$lib/Header.svelte';

  let client   = null;
  let checkins = [];
  let intake   = null;
  let loading  = true;

  // Coach notes state per check-in
  let notesState = {};   // { [checkin_id]: { text, saving, saved } }

  const SORENESS_LABELS = { 1: 'Nothing to Flag', 2: 'Minor Soreness', 3: 'Persistent Soreness', 4: 'Pain — Needs Attention' };
  const RATING_COLORS   = { 1: '#E87878', 2: '#E8BF60', 3: '#72C872', 4: '#5CC4B8', 5: '#6888E8' };
  const RATING_LABELS   = { 1: 'Rough', 2: 'Below Average', 3: 'Average', 4: 'Above Average', 5: 'Great' };

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { goto('/login'); return; }
    const { data: role } = await supabase.from('user_roles').select('role').single();
    if (role?.role !== 'coach') { goto('/my'); return; }

    const id = $page.params.id;

    const [{ data: c }, { data: ch }, { data: i }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('checkins').select('*').eq('client_id', id).order('week_ending', { ascending: false }),
      supabase.from('intakes').select('id').eq('client_id', id).maybeSingle(),
    ]);

    client   = c;
    checkins = ch ?? [];
    intake   = i;

    checkins.forEach(c => {
      notesState[c.id] = { text: c.coach_notes ?? '', saving: false, saved: false };
    });

    loading = false;
  });

  async function saveNotes(checkinId) {
    notesState[checkinId].saving = true;
    notesState[checkinId].saved  = false;
    await supabase.from('checkins')
      .update({ coach_notes: notesState[checkinId].text, coach_notes_updated_at: new Date().toISOString() })
      .eq('id', checkinId);
    notesState[checkinId].saving = false;
    notesState[checkinId].saved  = true;
    notesState = { ...notesState };
    setTimeout(() => {
      notesState[checkinId].saved = false;
      notesState = { ...notesState };
    }, 2500);
  }

  function fmtDate(d) {
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function fmtSince(d) {
    return new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
</script>

<svelte:head>
  <title>{client ? `${client.first_name} ${client.last_name}` : 'Client'} — Frecka Fitness</title>
</svelte:head>

<div class="page">
  <Header />

  <main>
    {#if loading}
      <p class="loading">Loading…</p>
    {:else if client}

      <div class="top-bar">
        <a href="/dashboard" class="back">← Back to roster</a>
        {#if intake}
          <a href="/dashboard/intake/{intake.id}" class="btn-outline">View Intake</a>
        {/if}
      </div>

      <div class="hero-block">
        <p class="eyebrow">Client</p>
        <h1>{client.first_name} {client.last_name}</h1>
        <p class="meta">
          {client.email}
          {#if client.phone} · {client.phone}{/if}
        </p>
        <div class="hero-meta-row">
          <span class="badge {client.status}">{client.status}</span>
          <span class="since">Member since {fmtSince(client.created_at)}</span>
        </div>
      </div>

      <!-- Check-ins -->
      <section>
        <div class="section-header">
          <h2>Check-Ins <span class="count">{checkins.length}</span></h2>
        </div>

        {#if checkins.length === 0}
          <p class="empty">No check-ins yet.</p>
        {:else}
          <div class="checkin-list">
            {#each checkins as c}
              <div class="checkin-card">

                <!-- Card header -->
                <div class="card-header">
                  <div class="card-header-left">
                    <span class="week-label">Week ending {fmtDate(c.week_ending)}</span>
                    {#if c.missed_sessions}
                      <span class="missed-badge">{c.missed_sessions === 4 ? '>3' : c.missed_sessions} missed</span>
                    {/if}
                  </div>
                  {#if c.week_rating}
                    <div class="rating-chip" style="background: {RATING_COLORS[c.week_rating]}22; border-color: {RATING_COLORS[c.week_rating]};">
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

                <!-- Text fields -->
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
                    <div class="card-field card-field--full for-ryan">
                      <p class="field-label">For Me</p>
                      <p class="field-value">{c.for_ryan}</p>
                    </div>
                  {/if}
                </div>

                <!-- Coach notes -->
                {#if notesState[c.id]}
                  <div class="coach-notes">
                    <p class="field-label">Coach Notes <span class="notes-hint">(visible to client)</span></p>
                    <textarea
                      bind:value={notesState[c.id].text}
                      placeholder="Feedback, adjustments, encouragement for next week…"
                      on:blur={() => saveNotes(c.id)}
                    ></textarea>
                    <div class="notes-footer">
                      {#if notesState[c.id].saving}
                        <span class="notes-status">Saving…</span>
                      {:else if notesState[c.id].saved}
                        <span class="notes-status saved">Saved</span>
                      {:else}
                        <span class="notes-status idle">Auto-saves on blur</span>
                      {/if}
                      <button type="button" class="btn-save" on:click={() => saveNotes(c.id)} disabled={notesState[c.id].saving}>Save</button>
                    </div>
                  </div>
                {/if}

              </div>
            {/each}
          </div>
        {/if}
      </section>

    {:else}
      <p class="error">Client not found.</p>
    {/if}
  </main>
</div>

<style>
  .page { min-height: 100vh; }

  main {
    max-width: 860px;
    margin: 0 auto;
    padding: 40px 32px 80px;
  }

  .loading, .error { color: var(--mid-grey); font-size: 14px; }

  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
  }

  .back {
    font-size: 13px;
    font-weight: 600;
    color: var(--mid-grey);
    text-decoration: none;
    letter-spacing: 0.05em;
  }
  .back:hover { color: var(--black); }

  .btn-outline {
    font-family: 'Halyard Display', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--black);
    border: 1px solid var(--light-grey);
    border-radius: 4px;
    padding: 6px 14px;
    text-decoration: none;
    transition: border-color 0.15s;
  }
  .btn-outline:hover { border-color: var(--black); }

  .hero-block {
    border-bottom: 1px solid var(--light-grey);
    padding-bottom: 28px;
    margin-bottom: 40px;
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 8px;
  }

  h1 {
    font-size: clamp(24px, 4vw, 36px);
    font-weight: 700;
    color: var(--black);
    margin-bottom: 6px;
  }

  .meta {
    font-size: 14px;
    color: var(--mid-grey);
    margin-bottom: 12px;
  }

  .hero-meta-row {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .badge {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 3px 10px;
    border-radius: 20px;
  }
  .badge.active   { background: #d4edda; color: var(--success); }
  .badge.inactive { background: var(--warm-white); color: var(--mid-grey); }

  .since {
    font-size: 13px;
    color: var(--mid-grey);
  }

  /* Section */
  .section-header {
    border-bottom: 1px solid var(--light-grey);
    padding-bottom: 10px;
    margin-bottom: 24px;
  }

  h2 {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--black);
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

  .empty { color: var(--mid-grey); font-size: 14px; }

  /* Check-in cards */
  .checkin-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

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

  .card-header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .week-label {
    font-size: 13px;
    font-weight: 700;
    color: var(--off-white);
    letter-spacing: 0.04em;
  }

  .missed-badge {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: rgba(232,120,120,0.2);
    color: #E87878;
    border: 1px solid rgba(232,120,120,0.4);
    border-radius: 20px;
    padding: 2px 8px;
  }

  .rating-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 20px;
    border: 1px solid;
    white-space: nowrap;
    color: var(--black);
    background: white;
  }

  .rating-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .metrics-row {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--light-grey);
  }

  .metric {
    flex: 1;
    padding: 10px 18px;
    border-right: 1px solid var(--light-grey);
  }
  .metric:last-child { border-right: none; }

  .metric-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--mid-grey);
    margin-bottom: 2px;
  }

  .metric-value {
    font-size: 13px;
    font-weight: 600;
    color: var(--black);
  }

  .card-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    padding: 16px 18px;
    border-bottom: 1px solid var(--light-grey);
  }

  .card-field {
    padding: 6px 0;
  }

  .card-field--full {
    grid-column: 1 / -1;
  }

  .for-ryan {
    background: var(--warm-white);
    border-radius: 4px;
    padding: 8px 10px;
    margin-top: 4px;
    grid-column: 1 / -1;
  }

  .field-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--mid-grey);
    margin-bottom: 3px;
  }

  .field-value {
    font-size: 14px;
    color: var(--black);
    line-height: 1.5;
    white-space: pre-wrap;
  }

  /* Coach notes */
  .coach-notes {
    padding: 16px 18px;
    background: var(--warm-white);
  }

  .notes-hint {
    font-size: 10px;
    font-weight: 400;
    letter-spacing: 0;
    text-transform: none;
    color: var(--mid-grey);
    margin-left: 6px;
  }

  .coach-notes textarea {
    width: 100%;
    min-height: 80px;
    background: white;
    border: 1.5px solid var(--light-grey);
    border-radius: 6px;
    color: var(--black);
    font-family: 'Halyard Display', sans-serif;
    font-size: 14px;
    padding: 10px 14px;
    outline: none;
    resize: vertical;
    line-height: 1.55;
    transition: border-color 0.15s;
    box-sizing: border-box;
    margin-top: 8px;
  }

  .coach-notes textarea:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(200,169,110,0.12);
  }

  .notes-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
  }

  .notes-status { font-size: 12px; color: var(--mid-grey); }
  .notes-status.saved { color: var(--success); }

  .btn-save {
    background: none;
    border: 1px solid var(--light-grey);
    border-radius: 4px;
    font-family: 'Halyard Display', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--black);
    padding: 5px 12px;
    cursor: pointer;
    transition: border-color 0.15s;
  }
  .btn-save:hover:not(:disabled) { border-color: var(--black); }
  .btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
