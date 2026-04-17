<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { supabase } from '$lib/supabase.js';
  import Header from '$lib/Header.svelte';

  let intake = null;
  let loading = true;
  let coachNotes = '';
  let savingNotes = false;
  let notesSaved = false;
  let converting = false;
  let convertError = '';
  let alreadyClient = false;

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { goto('/login'); return; }
    const { data: role } = await supabase.from('user_roles').select('role').single();
    if (role?.role !== 'coach') { goto('/my'); return; }

    const { data } = await supabase
      .from('intakes')
      .select('*')
      .eq('id', $page.params.id)
      .single();

    intake = data;
    coachNotes = data?.coach_notes ?? '';
    alreadyClient = !!data?.client_id;
    loading = false;
  });

  async function saveNotes() {
    savingNotes = true;
    notesSaved = false;
    await supabase.from('intakes').update({ coach_notes: coachNotes }).eq('id', intake.id);
    savingNotes = false;
    notesSaved = true;
    setTimeout(() => notesSaved = false, 2500);
  }

  async function convertToClient() {
    convertError = '';
    converting = true;

    try {
      const { data: result, error } = await supabase.functions.invoke('convert-to-client', {
        body: { intake_id: intake.id },
      });

      if (error) {
        convertError = error.message || 'Something went wrong. Please try again.';
        converting = false;
        return;
      }

      if (!result.invite_sent) {
        convertError = `Client created but invite failed: ${result.invite_error}. Send the invite manually from Supabase.`;
        converting = false;
        alreadyClient = true;
        return;
      }

      goto(`/dashboard/client/${result.client_id}`);
    } catch (err) {
      convertError = err.message || 'Something went wrong. Please try again.';
      converting = false;
    }
  }

  function val(v) { return v || '—'; }

  function calcAge(birthday) {
    if (!birthday) return null;
    const today = new Date();
    const dob = new Date(birthday);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  }

  function fmtBirthday(birthday) {
    if (!birthday) return null;
    return new Date(birthday + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
</script>

<svelte:head><title>{intake ? `${intake.first_name} ${intake.last_name} — Intake` : 'Intake'} — Frecka Fitness</title></svelte:head>

<div class="page">
  <Header />

  <main>
    {#if loading}
      <p class="loading">Loading…</p>
    {:else if intake}

      <div class="top-bar">
        <a href="/dashboard" class="back">← Back to roster</a>
        {#if !alreadyClient}
          <div class="convert-wrap">
            {#if convertError}<span class="convert-error">{convertError}</span>{/if}
            <button class="btn-convert" on:click={convertToClient} disabled={converting}>
              {converting ? 'Converting…' : 'Convert to Client'}
            </button>
          </div>
        {:else}
          <span class="badge converted">Client</span>
        {/if}
      </div>

      <div class="hero-block">
        <p class="eyebrow">Intake</p>
        <h1>{intake.first_name} {intake.last_name}</h1>
        <p class="meta">{intake.email}{intake.phone ? ` · ${intake.phone}` : ''}{intake.location ? ` · ${intake.location}` : ''}</p>
        <p class="submitted">Submitted {new Date(intake.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>

      <div class="sections">

        <!-- Goals -->
        <section>
          <h2>Goals</h2>
          <div class="grid">
            <div class="item">
              <p class="item-label">Primary Goal</p>
              <p class="item-value">{val(intake.primary_goal)}</p>
            </div>
            <div class="item">
              <p class="item-label">Timeline</p>
              <p class="item-value">{val(intake.timeline)}</p>
            </div>
            {#if intake.goal_detail}
            <div class="item item--full">
              <p class="item-label">Goal Detail</p>
              <p class="item-value">{intake.goal_detail}</p>
            </div>
            {/if}
          </div>
        </section>

        <!-- Training Setup -->
        <section>
          <h2>Training Setup</h2>
          <div class="grid">
            <div class="item">
              <p class="item-label">Experience</p>
              <p class="item-value">{val(intake.experience)}</p>
            </div>
            <div class="item">
              <p class="item-label">Training Days / Week</p>
              <p class="item-value">{val(intake.training_days)}</p>
            </div>
            <div class="item">
              <p class="item-label">Session Length</p>
              <p class="item-value">{val(intake.session_length)}</p>
            </div>
            <div class="item">
              <p class="item-label">Environment</p>
              <p class="item-value">{val(intake.environment)}</p>
            </div>
            {#if intake.current_training}
            <div class="item item--full">
              <p class="item-label">Current Training</p>
              <p class="item-value">{intake.current_training}</p>
            </div>
            {/if}
          </div>
        </section>

        <!-- Health & Lifestyle -->
        <section>
          <h2>Health &amp; Lifestyle</h2>
          <div class="grid">
            <div class="item">
              <p class="item-label">Birthday</p>
              <p class="item-value">
                {#if intake.birthday}
                  {fmtBirthday(intake.birthday)} <span class="age-pill">{calcAge(intake.birthday)}</span>
                {:else}
                  —
                {/if}
              </p>
            </div>
            <div class="item">
              <p class="item-label">Pronouns</p>
              <p class="item-value">{val(intake.gender)}</p>
            </div>
            <div class="item">
              <p class="item-label">Occupation</p>
              <p class="item-value">{val(intake.occupation)}</p>
            </div>
            <div class="item">
              <p class="item-label">Sleep Quality</p>
              <p class="item-value">{val(intake.sleep_quality)}</p>
            </div>
            <div class="item">
              <p class="item-label">Stress Level</p>
              <p class="item-value">{val(intake.stress_level)}</p>
            </div>
            <div class="item">
              <p class="item-label">Feedback Preference</p>
              <p class="item-value">{val(intake.feedback_pref)}</p>
            </div>
            {#if intake.nutrition}
            <div class="item item--full">
              <p class="item-label">Nutrition</p>
              <p class="item-value">{intake.nutrition}</p>
            </div>
            {/if}
            {#if intake.injuries}
            <div class="item item--full">
              <p class="item-label">Injuries / History</p>
              <p class="item-value">{intake.injuries}</p>
            </div>
            {/if}
            {#if intake.medical_notes}
            <div class="item item--full">
              <p class="item-label">Medical Notes</p>
              <p class="item-value">{intake.medical_notes}</p>
            </div>
            {/if}
            {#if intake.anything_else}
            <div class="item item--full">
              <p class="item-label">Anything Else</p>
              <p class="item-value">{intake.anything_else}</p>
            </div>
            {/if}
          </div>
        </section>

        <!-- Referral -->
        {#if intake.referral_source}
        <section>
          <h2>Referral</h2>
          <div class="grid">
            <div class="item">
              <p class="item-label">How They Found You</p>
              <p class="item-value">{intake.referral_source}</p>
            </div>
          </div>
        </section>
        {/if}

        <!-- Coach Notes -->
        <section class="notes-section">
          <h2>Coach Notes</h2>
          <p class="notes-hint">Your working notes — visible only to you. Use during or after the consult call.</p>
          <textarea
            bind:value={coachNotes}
            placeholder="First impressions, follow-up questions, what to address on the call…"
            on:blur={saveNotes}
          ></textarea>
          <div class="notes-footer">
            {#if savingNotes}
              <span class="notes-status">Saving…</span>
            {:else if notesSaved}
              <span class="notes-status saved">Saved</span>
            {:else}
              <span class="notes-status idle">Auto-saves on blur</span>
            {/if}
            <button type="button" class="btn-save-notes" on:click={saveNotes} disabled={savingNotes}>Save</button>
          </div>
        </section>

      </div>
    {:else}
      <p class="error">Intake not found.</p>
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

  .loading { color: var(--mid-grey); }

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

  .convert-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .convert-error {
    font-size: 13px;
    color: var(--error);
  }

  .btn-convert {
    background: var(--black);
    color: var(--off-white);
    border: none;
    border-radius: 6px;
    padding: 10px 22px;
    font-family: 'Halyard Display', sans-serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: background 0.15s;
  }

  .btn-convert::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 3px;
    background: var(--accent);
  }

  .btn-convert:hover:not(:disabled) { background: #1f2f45; }
  .btn-convert:disabled { opacity: 0.5; cursor: not-allowed; }

  .badge.converted {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 4px 12px;
    border-radius: 20px;
    background: #d4edda;
    color: var(--success);
  }

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
    margin-bottom: 8px;
  }

  .meta {
    font-size: 14px;
    color: var(--mid-grey);
    margin-bottom: 4px;
  }

  .submitted {
    font-size: 12px;
    color: var(--mid-grey);
  }

  .sections {
    display: flex;
    flex-direction: column;
    gap: 40px;
  }

  section h2 {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--black);
    border-bottom: 1px solid var(--light-grey);
    padding-bottom: 8px;
    margin-bottom: 20px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px 24px;
  }

  .item--full {
    grid-column: 1 / -1;
  }

  .item-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--mid-grey);
    margin-bottom: 4px;
  }

  .item-value {
    font-size: 14px;
    color: var(--black);
    line-height: 1.5;
  }

  .age-pill {
    display: inline-block;
    background: var(--warm-white);
    border: 1px solid var(--light-grey);
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    padding: 1px 8px;
    color: var(--mid-grey);
    vertical-align: middle;
    margin-left: 6px;
  }

  /* Coach Notes */
  .notes-hint {
    font-size: 13px;
    color: var(--mid-grey);
    margin-bottom: 12px;
    margin-top: -10px;
  }

  .notes-section textarea {
    width: 100%;
    min-height: 140px;
    background: var(--warm-white);
    border: 1.5px solid var(--light-grey);
    border-radius: 6px;
    color: var(--black);
    font-family: 'Halyard Display', sans-serif;
    font-size: 15px;
    padding: 13px 16px;
    outline: none;
    resize: vertical;
    line-height: 1.55;
    transition: border-color 0.15s;
    box-sizing: border-box;
  }

  .notes-section textarea:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(200,169,110,0.12);
  }

  .notes-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
  }

  .notes-status {
    font-size: 12px;
    color: var(--mid-grey);
  }

  .notes-status.saved { color: var(--success); }

  .btn-save-notes {
    background: none;
    border: 1px solid var(--light-grey);
    border-radius: 4px;
    font-family: 'Halyard Display', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--black);
    padding: 6px 14px;
    cursor: pointer;
    transition: border-color 0.15s;
  }

  .btn-save-notes:hover:not(:disabled) { border-color: var(--black); }
  .btn-save-notes:disabled { opacity: 0.4; cursor: not-allowed; }

  .error { color: var(--error); font-size: 14px; }
</style>
