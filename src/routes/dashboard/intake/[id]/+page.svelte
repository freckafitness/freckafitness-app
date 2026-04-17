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
  let modalOpen = false;
  let weightUnit = 'lbs';
  let showBodyweight = false;
  let welcomeNote = '';
  let converted = false;
  let convertedClientId = null;

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

  async function dismissIntake() {
    await supabase.from('intakes').update({ dismissed_at: new Date().toISOString() }).eq('id', intake.id);
    intake = { ...intake, dismissed_at: new Date().toISOString() };
  }

  async function undismissIntake() {
    await supabase.from('intakes').update({ dismissed_at: null }).eq('id', intake.id);
    intake = { ...intake, dismissed_at: null };
  }

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
    modalOpen = false;

    try {
      const { data: result, error } = await supabase.functions.invoke('convert-to-client', {
        body: {
          intake_id:       intake.id,
          weight_unit:     weightUnit,
          show_bodyweight: showBodyweight,
          welcome_note:    welcomeNote || null,
        },
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

      converted = true;
      convertedClientId = result.client_id;
      converting = false;
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
        {#if !alreadyClient && !converted}
          <div class="convert-wrap">
            {#if convertError}<span class="convert-error">{convertError}</span>{/if}
            {#if intake.dismissed_at}
              <button class="btn-undismiss" on:click={undismissIntake}>Restore Prospect</button>
            {:else}
              <button class="btn-dismiss" on:click={dismissIntake}>Dismiss</button>
              <button class="btn-convert" on:click={() => modalOpen = true} disabled={converting}>
                {converting ? 'Converting…' : 'Convert to Client'}
              </button>
            {/if}
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

      {#if converted}
        <div class="confirm-screen">
          <div class="confirm-check">✓</div>
          <h2 class="confirm-heading">Client Created</h2>
          <p class="confirm-sub">Invite email sent to <strong>{intake.email}</strong></p>
          <div class="confirm-portal">
            <span class="confirm-portal-label">Client Portal</span>
            <div class="confirm-portal-row">
              <code class="confirm-portal-url">https://app.freckafitness.com</code>
              <button class="btn-copy" on:click={() => navigator.clipboard.writeText('https://app.freckafitness.com')}>Copy</button>
            </div>
          </div>
          <a href="/dashboard/client/{convertedClientId}" class="btn-view-client">View Client Profile →</a>
        </div>
      {:else}

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
      {/if}

    {:else}
      <p class="error">Intake not found.</p>
    {/if}
  </main>
</div>

{#if modalOpen}
  <div class="modal-overlay" on:click|self={() => modalOpen = false} on:keydown={e => e.key === 'Escape' && (modalOpen = false)} role="dialog" aria-modal="true" tabindex="-1">
    <div class="modal-card">
      <h3 class="modal-title">Convert to Client</h3>
      <p class="modal-sub">Set preferences before sending the invite.</p>

      <div class="modal-field">
        <span class="modal-label">Weight Unit</span>
        <div class="unit-toggle">
          {#each ['lbs', 'kg'] as u}
            <button type="button" class="unit-btn" class:active={weightUnit === u}
              on:click={() => weightUnit = u}>{u}</button>
          {/each}
        </div>
      </div>

      <div class="modal-field">
        <span class="modal-label">Track Body Weight</span>
        <button type="button" class="bw-toggle" class:on={showBodyweight}
          on:click={() => showBodyweight = !showBodyweight}>
          <span class="bw-toggle-track" class:on={showBodyweight}>
            <span class="bw-toggle-thumb"></span>
          </span>
          <span>{showBodyweight ? 'Yes' : 'No'}</span>
        </button>
      </div>

      <div class="modal-field modal-field--full">
        <span class="modal-label">Welcome Note <span class="optional">(optional)</span></span>
        <textarea
          bind:value={welcomeNote}
          placeholder="A personal message shown to the client when they first log in…"
        ></textarea>
      </div>

      {#if convertError}
        <p class="modal-error">{convertError}</p>
      {/if}

      <div class="modal-actions">
        <button type="button" class="btn-modal-cancel" on:click={() => modalOpen = false}>Cancel</button>
        <button type="button" class="btn-modal-confirm" on:click={convertToClient} disabled={converting}>
          {converting ? 'Converting…' : 'Send Invite'}
        </button>
      </div>
    </div>
  </div>
{/if}

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

  .btn-dismiss {
    font-family: 'Halyard Display', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--mid-grey);
    background: none;
    border: 1px solid var(--light-grey);
    border-radius: 4px;
    padding: 8px 16px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-dismiss:hover { color: var(--error); border-color: var(--error); }

  .btn-undismiss {
    font-family: 'Halyard Display', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--mid-grey);
    background: none;
    border: 1px solid var(--light-grey);
    border-radius: 4px;
    padding: 8px 16px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-undismiss:hover { color: var(--black); border-color: var(--black); }

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

  /* Post-conversion confirmation */
  .confirm-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 64px 0 80px;
    gap: 16px;
  }

  .confirm-check {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #d4edda;
    color: var(--success);
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .confirm-heading {
    font-size: 28px;
    font-weight: 700;
    color: var(--black);
    margin: 0;
  }

  .confirm-sub {
    font-size: 15px;
    color: var(--mid-grey);
    margin: 0;
  }

  .confirm-portal {
    margin-top: 8px;
    background: var(--warm-white);
    border: 1px solid var(--light-grey);
    border-radius: 8px;
    padding: 16px 20px;
    width: 100%;
    max-width: 420px;
    text-align: left;
  }

  .confirm-portal-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--mid-grey);
    display: block;
    margin-bottom: 8px;
  }

  .confirm-portal-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .confirm-portal-url {
    font-family: monospace;
    font-size: 13px;
    color: var(--black);
    flex: 1;
  }

  .btn-copy {
    font-family: 'Halyard Display', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border: 1px solid var(--light-grey);
    border-radius: 4px;
    background: none;
    color: var(--black);
    padding: 5px 12px;
    cursor: pointer;
    white-space: nowrap;
    transition: border-color 0.15s;
  }
  .btn-copy:hover { border-color: var(--black); }

  .btn-view-client {
    margin-top: 8px;
    background: var(--black);
    color: var(--off-white);
    border: none;
    border-radius: 6px;
    padding: 14px 32px;
    font-family: 'Halyard Display', sans-serif;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-decoration: none;
    position: relative;
    overflow: hidden;
  }
  .btn-view-client::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 3px;
    background: var(--accent);
  }
  .btn-view-client:hover { background: #1f2f45; }

  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 24px;
  }

  .modal-card {
    background: var(--off-white);
    border-radius: 12px;
    padding: 32px;
    width: 100%;
    max-width: 440px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .modal-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--black);
    margin: 0;
  }

  .modal-sub {
    font-size: 13px;
    color: var(--mid-grey);
    margin: -12px 0 0;
  }

  .modal-field {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .modal-field--full {
    flex-direction: column;
    align-items: flex-start;
  }

  .modal-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--black);
  }

  .optional {
    font-weight: 400;
    color: var(--mid-grey);
  }

  .modal-field--full textarea {
    width: 100%;
    min-height: 90px;
    background: var(--warm-white);
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
    margin-top: 6px;
  }
  .modal-field--full textarea:focus { border-color: var(--accent); }

  .unit-toggle { display: flex; gap: 4px; }

  .unit-btn {
    background: none;
    border: 1.5px solid var(--light-grey);
    border-radius: 4px;
    font-family: 'Halyard Display', sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--mid-grey);
    padding: 5px 14px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .unit-btn.active {
    background: var(--black);
    border-color: var(--black);
    color: var(--off-white);
  }

  .bw-toggle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    cursor: pointer;
    font-family: 'Halyard Display', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--mid-grey);
    padding: 0;
    transition: color 0.15s;
  }
  .bw-toggle.on { color: var(--black); }

  .bw-toggle-track {
    width: 30px;
    height: 16px;
    border-radius: 8px;
    background: var(--light-grey);
    position: relative;
    flex-shrink: 0;
    transition: background 0.2s;
  }
  .bw-toggle-track.on { background: var(--accent); }

  .bw-toggle-thumb {
    position: absolute;
    top: 2px; left: 2px;
    width: 12px; height: 12px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    transition: transform 0.2s;
  }
  .bw-toggle-track.on .bw-toggle-thumb { transform: translateX(14px); }

  .modal-error {
    font-size: 13px;
    color: var(--error);
    margin: 0;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 4px;
  }

  .btn-modal-cancel {
    font-family: 'Halyard Display', sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--mid-grey);
    background: none;
    border: 1px solid var(--light-grey);
    border-radius: 6px;
    padding: 10px 20px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-modal-cancel:hover { border-color: var(--black); color: var(--black); }

  .btn-modal-confirm {
    background: var(--black);
    color: var(--off-white);
    border: none;
    border-radius: 6px;
    padding: 10px 24px;
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
  .btn-modal-confirm::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 3px;
    background: var(--accent);
  }
  .btn-modal-confirm:hover:not(:disabled) { background: #1f2f45; }
  .btn-modal-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
