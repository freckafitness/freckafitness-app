<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase.js';
  import Header from '$lib/Header.svelte';

  let clientId = null;
  let weekEnding = '';
  let loading = false;
  let error = '';
  let alreadySubmitted = false;
  let isPreview = false;

  // Form fields
  let missedSessions = 0;
  let missedReason = '';
  let bestLift = '';
  let progressTrend = '';
  let programFeedback = '';
  let soreness = '';
  let sorenessNotes = '';
  let sleepHours = 7;
  let showBodyweight = false;
  let bodyweight = '';
  let weightUnit = 'kg';
  let nutritionAdherence = 6;
  let nutritionNotes = '';
  let upcomingDisruptions = false;
  let disruptionNotes = '';
  let forRyan = '';
  let weekRating = 3;

  const SORENESS_MAP = {
    'Nothing to Flag': 1,
    'Minor Soreness': 2,
    'Persistent Soreness': 3,
    'Pain — Needs Attention': 4,
  };

  const RATINGS = {
    1: { label: 'Rough',         color: '#E87878' },
    2: { label: 'Below Average', color: '#E8BF60' },
    3: { label: 'Average',       color: '#72C872' },
    4: { label: 'Above Average', color: '#5CC4B8' },
    5: { label: 'Great',         color: '#6888E8' },
  };

  const MISSED_LABELS = { 1: '1', 2: '2', 3: '3', 4: '>3' };

  $: ratingInfo   = RATINGS[weekRating] ?? RATINGS[3];
  $: missedPct    = missedSessions > 0 ? ((missedSessions - 1) / 3) * 100 : 0;
  $: nutritionPct = ((nutritionAdherence - 1) / 9) * 100;
  $: ratingPct    = ((weekRating - 1) / 4) * 100;
  $: sleepPct     = ((sleepHours - 1) / 9) * 100;

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { goto('/login'); return; }

    const { data: role } = await supabase.from('user_roles').select('role, client_id').single();
    isPreview = role?.role === 'coach' && $page.url.searchParams.get('preview') === 'true';
    if (role?.role === 'coach' && !isPreview) { goto('/dashboard'); return; }
    clientId = role?.client_id;

    // Calculate week ending first (needed for duplicate check)
    const today = new Date();
    const daysUntilSunday = today.getDay() === 0 ? 0 : 7 - today.getDay();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() + daysUntilSunday);
    weekEnding = sunday.toISOString().split('T')[0];

    if (!isPreview) {
      const [{ data: clientRow }, { data: existing }] = await Promise.all([
        supabase.from('clients').select('show_bodyweight, weight_unit').eq('id', role.client_id).single(),
        supabase.from('checkins').select('id').eq('client_id', clientId).eq('week_ending', weekEnding).limit(1),
      ]);
      showBodyweight   = clientRow?.show_bodyweight ?? false;
      weightUnit       = clientRow?.weight_unit ?? 'kg';
      alreadySubmitted = (existing?.length ?? 0) > 0;
    }
  });

  async function switchUnit(u) {
    if (weightUnit === u) return;
    if (bodyweight !== '') {
      const val = parseFloat(bodyweight);
      if (!isNaN(val)) {
        bodyweight = u === 'lbs'
          ? (val * 2.2046).toFixed(1)
          : (val / 2.2046).toFixed(1);
      }
    }
    weightUnit = u;
    await supabase.from('clients').update({ weight_unit: u }).eq('id', clientId);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!progressTrend) { error = 'Please select how performance felt this week.'; return; }
    if (!soreness)      { error = 'Please select a soreness level.'; return; }
    error = '';
    loading = true;

    const { error: insertError } = await supabase.from('checkins').insert({
      client_id:           clientId,
      week_ending:         weekEnding,
      missed_sessions:     missedSessions > 0 ? missedSessions : null,
      best_lift:           bestLift,
      progress_trend:      progressTrend,
      program_feedback:    [missedReason, programFeedback].filter(Boolean).join('\n\n'),
      soreness:             SORENESS_MAP[soreness],
      soreness_notes:       sorenessNotes,
      sleep_hours:          sleepHours,
      bodyweight:           showBodyweight && bodyweight !== ''
                              ? parseFloat(weightUnit === 'lbs' ? (parseFloat(bodyweight) / 2.2046).toFixed(1) : bodyweight)
                              : null,
      nutrition_adherence:  nutritionAdherence,
      nutrition_notes:      nutritionNotes,
      upcoming_disruptions: upcomingDisruptions,
      disruption_notes:     upcomingDisruptions ? (disruptionNotes || null) : null,
      for_ryan:             forRyan,
      week_rating:          weekRating,
    });

    if (insertError) {
      error = 'Something went wrong. Please try again.';
      loading = false;
      return;
    }

    goto('/my?checkin=done');
  }
</script>

<svelte:head><title>Weekly Check-In — Frecka Fitness</title></svelte:head>

<div class="page">
  <Header />

  <div class="hero">
    <div class="week-badge">
      Week ending {weekEnding ? new Date(weekEnding + 'T12:00:00').toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' }) : '…'}
    </div>
    <h1>How's the<br />Week Looking?</h1>
    <p>2–3 minutes. Covers what TrainHeroic doesn't —<br>so I can adjust before next week starts.</p>
  </div>

  <div class="form-wrap">

    {#if isPreview}
      <div class="preview-banner">
        <strong>Preview Mode</strong> — This is how the check-in form appears to clients. Submission is disabled.
        <a href="/dashboard" class="preview-back">← Back to Dashboard</a>
      </div>
    {/if}

    {#if alreadySubmitted}
      <div class="already-submitted">
        <p class="already-title">Already submitted</p>
        <p class="already-body">You've already sent a check-in for the week ending {weekEnding ? new Date(weekEnding + 'T12:00:00').toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' }) : 'this week'}. I'll review it and respond before next week.</p>
        <a href="/my" class="btn-back">← Back to Portal</a>
      </div>
    {:else}

    <form on:submit={handleSubmit}>

      <!-- 01 Training -->
      <div class="form-section">
        <div class="section-label"><span>01</span> Training</div>

        <div class="field">
          <label>Missed Sessions This Week</label>
          {#if missedSessions === 0}
            <div class="option-group">
              <label class="option-chip selected" on:click={() => missedSessions = 1}>
                <input type="radio" /> None
              </label>
            </div>
          {:else}
            <div class="scale-wrap">
              <input type="range" min="1" max="4" bind:value={missedSessions}
                style="background: linear-gradient(to right, var(--accent) 0%, var(--accent) {missedPct}%, var(--light-grey) {missedPct}%, var(--light-grey) 100%)" />
              <span class="scale-value">{MISSED_LABELS[missedSessions]}</span>
            </div>
            <button type="button" class="missed-reset" on:click={() => { missedSessions = 0; missedReason = ''; }}>← None</button>
          {/if}
        </div>

        {#if missedSessions > 0}
        <div class="field">
          <label for="missedReason">What got in the way?</label>
          <textarea id="missedReason" bind:value={missedReason}
            placeholder="Work, illness, travel, life happened..."
            style="min-height:72px;"></textarea>
        </div>
        {/if}

        <div class="field">
          <label for="bestLift">Best Lift or Performance This Week <span class="req">*</span></label>
          <input type="text" id="bestLift" bind:value={bestLift}
            placeholder="e.g. Deadlift 140kg × 3, ran 5k in 24:30, hit a new gymnastics skill..." required />
        </div>

        <div class="field">
          <label>Compared to Last Week, Performance Felt: <span class="req">*</span></label>
          <div class="option-group">
            {#each ['Noticeably down', 'About the same', 'Slightly better', 'Significantly better'] as opt}
              <label class="option-chip" class:selected={progressTrend === opt}>
                <input type="radio" bind:group={progressTrend} value={opt} />
                {opt}
              </label>
            {/each}
          </div>
        </div>

        <div class="field">
          <label for="programFeedback">Any exercises or sets to flag?</label>
          <textarea id="programFeedback" bind:value={programFeedback}
            placeholder="Movements that felt off, weights that need adjusting, anything you want swapped..."
            style="min-height:80px;"></textarea>
        </div>
      </div>

      <!-- 02 Recovery & Health -->
      <div class="form-section">
        <div class="section-label"><span>02</span> Recovery & Health</div>

        <div class="field">
          <label>Soreness, Pain or Tightness to Flag? <span class="req">*</span></label>
          <div class="option-group option-group--column">
            {#each Object.keys(SORENESS_MAP) as opt}
              <label class="option-chip" class:selected={soreness === opt}>
                <input type="radio" bind:group={soreness} value={opt} />
                {opt}
              </label>
            {/each}
          </div>
        </div>

        <div class="field">
          <label for="sorenessNotes">Details if relevant</label>
          <input type="text" id="sorenessNotes" bind:value={sorenessNotes}
            placeholder="Location, when it started, what incites it, any restrictions that have arisen..." />
        </div>

        <div class="field">
          <label>Avg. sleep per night this week</label>
          <div class="scale-wrap">
            <span class="scale-label">Short</span>
            <input type="range" min="1" max="10" step="1" bind:value={sleepHours}
              style="background: linear-gradient(to right, var(--accent) 0%, var(--accent) {sleepPct}%, var(--light-grey) {sleepPct}%, var(--light-grey) 100%)" />
            <span class="scale-value">{sleepHours} hrs</span>
            <span class="scale-label">Full</span>
          </div>
        </div>

        {#if showBodyweight}
        <div class="field">
          <div class="bw-field-header">
            <label for="bodyweight">Morning body weight</label>
            <div class="unit-toggle">
              {#each ['kg', 'lbs'] as u}
                <button type="button" class="unit-btn" class:active={weightUnit === u}
                  on:click={() => switchUnit(u)}>{u}</button>
              {/each}
            </div>
          </div>
          <input type="number" id="bodyweight" bind:value={bodyweight}
            placeholder={weightUnit === 'lbs' ? 'e.g. 182' : 'e.g. 82.5'} step="0.1" min="0" max="1500" />
        </div>
        {/if}

      </div>

      <!-- 03 Nutrition -->
      <div class="form-section">
        <div class="section-label"><span>03</span> Nutrition</div>

        <div class="field">
          <label>How well did you hit your targets this week? <span class="req">*</span></label>
          <div class="scale-wrap">
            <span class="scale-label">Off track</span>
            <input type="range" min="1" max="10" bind:value={nutritionAdherence}
              style="background: linear-gradient(to right, var(--accent) 0%, var(--accent) {nutritionPct}%, var(--light-grey) {nutritionPct}%, var(--light-grey) 100%)" />
            <span class="scale-value">{nutritionAdherence}</span>
            <span class="scale-label">Dialled in</span>
          </div>
        </div>

        <div class="field">
          <label for="nutritionNotes">Anything worth flagging?</label>
          <textarea id="nutritionNotes" bind:value={nutritionNotes}
            placeholder="Missed meals, social events, big deviation from plan, appetite changes..."
            style="min-height:72px;"></textarea>
        </div>
      </div>

      <!-- 04 For Ryan -->
      <div class="form-section">
        <div class="section-label"><span>04</span> For Ryan</div>

        <div class="field">
          <label>Anything disrupting next week?</label>
          <div class="option-group">
            {#each [{ val: false, text: 'All clear' }, { val: true, text: 'Flag a disruption' }] as opt}
              <label class="option-chip" class:selected={upcomingDisruptions === opt.val}
                on:click={() => { upcomingDisruptions = opt.val; if (!opt.val) disruptionNotes = ''; }}>
                <input type="radio" bind:group={upcomingDisruptions} value={opt.val} />
                {opt.text}
              </label>
            {/each}
          </div>
        </div>

        {#if upcomingDisruptions}
        <div class="field">
          <label for="disruptionNotes">What's coming up?</label>
          <textarea id="disruptionNotes" bind:value={disruptionNotes}
            placeholder="Travel, busy work week, limited gym access, event..."
            style="min-height:72px;"></textarea>
        </div>
        {/if}

        <div class="field">
          <label for="forRyan">Questions or anything to address before next week?</label>
          <textarea id="forRyan" bind:value={forRyan}
            placeholder="Program questions, technique concerns, scheduling changes — your opportunity to AMA."
            style="min-height:96px;"></textarea>
        </div>

        <div class="field">
          <label>Overall week rating <span class="req">*</span></label>
          <div class="scale-wrap">
            <span class="scale-label">Rough</span>
            <input type="range" min="1" max="5" bind:value={weekRating}
              style="background: linear-gradient(to right, {ratingInfo.color} 0%, {ratingInfo.color} {ratingPct}%, var(--light-grey) {ratingPct}%, var(--light-grey) 100%)" />
            <span class="scale-label" style="text-align:right;">Great</span>
          </div>
          <div class="rating-display">
            <span class="rating-dot" style="background: {ratingInfo.color}"></span>
            <span class="rating-label" style="color: var(--black)">{ratingInfo.label}</span>
          </div>
        </div>
      </div>

      {#if error}
        <p class="error">{error}</p>
      {/if}

      <div class="submit-wrap">
        <button type="submit" disabled={loading || isPreview}>
          {loading ? 'Submitting…' : 'Submit Check-In'}
        </button>
        <p class="submit-note">{isPreview ? 'Submission disabled in preview mode.' : 'Sent directly to me. I review check-ins every Monday.'}</p>
      </div>

    </form>
    {/if}

  </div>
</div>

<style>
  .page { min-height: 100vh; }

  .hero {
    background: var(--black);
    color: var(--off-white);
    text-align: center;
    padding: 48px 24px 40px;
  }

  .week-badge {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 14px;
  }

  .hero h1 {
    font-size: clamp(32px, 6vw, 52px);
    font-weight: 700;
    line-height: 1.1;
    margin-bottom: 14px;
  }

  .hero p {
    font-size: 15px;
    color: rgba(224,224,219,0.65);
    max-width: 440px;
    margin: 0 auto;
  }

  .form-wrap {
    max-width: 640px;
    margin: 0 auto;
    padding: 48px 24px 80px;
  }

  .preview-banner {
    background: #fff8ec;
    border: 1.5px solid rgba(200,169,110,0.5);
    border-radius: 8px;
    padding: 14px 18px;
    font-size: 13px;
    color: var(--black);
    line-height: 1.5;
    margin-bottom: 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  .preview-back {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--black);
    text-decoration: none;
    border: 1px solid var(--light-grey);
    border-radius: 4px;
    padding: 6px 14px;
    white-space: nowrap;
    transition: border-color 0.15s;
  }

  .preview-back:hover { border-color: var(--black); }

  .form-section { margin-bottom: 48px; }

  .section-label {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--black);
    border-bottom: 1px solid var(--black);
    padding-bottom: 10px;
    margin-bottom: 24px;
    display: flex;
    gap: 10px;
  }

  .section-label span { color: var(--black); }

  .field { margin-bottom: 22px; }

  label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--mid-grey);
    margin-bottom: 8px;
  }

  .req { color: var(--accent); }

  input[type="text"],
  input[type="number"],
  textarea {
    width: 100%;
    background: var(--warm-white);
    border: 1.5px solid var(--light-grey);
    border-radius: 6px;
    color: var(--black);
    font-family: 'Halyard Display', sans-serif;
    font-size: 15px;
    padding: 13px 16px;
    outline: none;
    transition: border-color 0.15s;
  }

  input[type="text"]:focus,
  input[type="number"]:focus,
  textarea:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(200,169,110,0.12);
  }

  input[type="text"]::placeholder,
  input[type="number"]::placeholder,
  textarea::placeholder { color: var(--mid-grey); }

  /* Bodyweight field header with unit toggle */
  .bw-field-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .bw-field-header label { margin-bottom: 0; }

  .unit-toggle { display: flex; gap: 3px; }

  .unit-btn {
    background: none;
    border: 1.5px solid var(--light-grey);
    border-radius: 4px;
    font-family: 'Halyard Display', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--mid-grey);
    padding: 3px 9px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .unit-btn.active {
    background: var(--black);
    border-color: var(--black);
    color: var(--off-white);
  }

  /* Remove number input spinners */
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  input[type="number"] { -moz-appearance: textfield; }

  textarea { resize: vertical; min-height: 88px; line-height: 1.55; }

  /* Option chips */
  .option-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .option-group--column {
    flex-direction: column;
    align-items: flex-start;
  }

  .option-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--warm-white);
    border: 1.5px solid var(--light-grey);
    border-radius: 100px;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 500;
    font-family: 'Halyard Display', sans-serif;
    color: var(--black);
    cursor: pointer;
    transition: all 0.15s;
    text-transform: none;
    letter-spacing: 0;
    margin-bottom: 0;
  }

  .option-chip input[type="radio"] { display: none; }

  .option-chip.selected {
    background: var(--black);
    border-color: var(--black);
    color: var(--off-white);
  }

  /* Sliders */
  .scale-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .scale-label {
    font-size: 13px;
    color: var(--black);
    white-space: nowrap;
    text-transform: none;
    letter-spacing: 0;
    font-weight: 500;
    margin-bottom: 0;
    opacity: 0.55;
  }

  .scale-value {
    font-size: 15px;
    font-weight: 700;
    color: var(--black);
    min-width: 20px;
    text-align: center;
  }

  input[type="range"] {
    flex: 1;
    height: 4px;
    border-radius: 2px;
    appearance: none;
    outline: none;
    border: none;
    padding: 0;
    box-shadow: none;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--black);
    cursor: pointer;
    border: 3px solid var(--off-white);
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  }

  .rating-display {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 12px;
  }

  .rating-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    flex-shrink: 0;
    transition: background 0.2s;
    display: inline-block;
  }

  .rating-label {
    font-size: 15px;
    font-weight: 600;
  }

  .missed-reset {
    background: none;
    border: none;
    color: var(--mid-grey);
    font-family: 'Halyard Display', sans-serif;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    padding: 6px 0 0;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .missed-reset:hover { color: var(--black); }

  .error {
    font-size: 13px;
    color: var(--error);
    margin-bottom: 16px;
  }

  .submit-wrap {
    margin-top: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  button[type="submit"] {
    background: var(--black);
    color: var(--off-white);
    border: none;
    border-radius: 6px;
    padding: 18px 48px;
    font-family: 'Halyard Display', sans-serif;
    font-size: 17px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    cursor: pointer;
    width: 100%;
    max-width: 360px;
    position: relative;
    overflow: hidden;
    transition: background 0.18s, transform 0.12s;
  }

  button[type="submit"]:hover:not(:disabled) { background: #1f2f45; }
  button[type="submit"]:active:not(:disabled) { transform: scale(0.98); }

  button[type="submit"]::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 3px;
    background: var(--accent);
  }

  button[type="submit"]:disabled { opacity: 0.5; cursor: not-allowed; }

  .submit-note {
    font-size: 12px;
    color: var(--mid-grey);
    text-align: center;
  }

  .already-submitted {
    text-align: center;
    padding: 48px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .already-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--black);
  }

  .already-body {
    font-size: 15px;
    color: var(--mid-grey);
    max-width: 400px;
    line-height: 1.6;
  }

  .btn-back {
    display: inline-block;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--black);
    text-decoration: none;
    border: 1px solid var(--light-grey);
    border-radius: 4px;
    padding: 8px 18px;
    transition: border-color 0.15s;
    margin-top: 8px;
  }

  .btn-back:hover { border-color: var(--black); }
</style>
