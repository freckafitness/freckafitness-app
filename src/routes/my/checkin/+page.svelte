<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase.js';
  import Header from '$lib/Header.svelte';

  let clientId = null;
  let weekEnding = '';
  let loading = false;
  let error = '';

  // Form fields
  let missedSessions = 0;
  let bestLift = '';
  let progressTrend = '';
  let programFeedback = '';
  let soreness = null;
  let sorenessNotes = '';
  let nutritionAdherence = 6;
  let nutritionNotes = '';
  let forRyan = '';
  let weekRating = 6;

  const RATINGS = {
    1:  { label: 'Rough',       color: '#E05555' },
    2:  { label: 'Tough',       color: '#E07A45' },
    3:  { label: 'Difficult',   color: '#E09A35' },
    4:  { label: 'Below Par',   color: '#D4B840' },
    5:  { label: 'Okay',        color: '#C8C840' },
    6:  { label: 'Good',        color: '#A0C858' },
    7:  { label: 'Solid',       color: '#72BC60' },
    8:  { label: 'Strong',      color: '#48B068' },
    9:  { label: 'Great',       color: '#28A070' },
    10: { label: 'Excellent',   color: '#1A9060' },
  };

  $: ratingInfo = RATINGS[weekRating] ?? RATINGS[6];
  $: nutritionPct = ((nutritionAdherence - 1) / 9) * 100;
  $: ratingPct = ((weekRating - 1) / 9) * 100;

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { goto('/login'); return; }

    const { data: role } = await supabase.from('user_roles').select('role, client_id').single();
    if (role?.role === 'coach') { goto('/dashboard'); return; }
    clientId = role?.client_id;

    // Set week ending to the coming Sunday
    const today = new Date();
    const daysUntilSunday = (7 - today.getDay()) % 7 || 7;
    const sunday = new Date(today);
    sunday.setDate(today.getDate() + daysUntilSunday);
    weekEnding = sunday.toISOString().split('T')[0];
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!progressTrend) { error = 'Please select how performance felt this week.'; return; }
    if (!soreness) { error = 'Please select a soreness level.'; return; }
    error = '';
    loading = true;

    const { error: insertError } = await supabase.from('checkins').insert({
      client_id:           clientId,
      week_ending:         weekEnding,
      missed_sessions:     missedSessions,
      best_lift:           bestLift,
      progress_trend:      progressTrend,
      program_feedback:    programFeedback,
      soreness:            soreness,
      soreness_notes:      sorenessNotes,
      nutrition_adherence: nutritionAdherence,
      nutrition_notes:     nutritionNotes,
      for_ryan:            forRyan,
      week_rating:         weekRating,
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
    <p class="week-badge">Week ending {weekEnding ? new Date(weekEnding + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : '…'}</p>
    <h1>How's the<br />Week Looking?</h1>
    <p class="sub">2–3 minutes. Covers what TrainHeroic doesn't — so Ryan can adjust before next week starts.</p>
  </div>

  <div class="form-wrap">
    <form on:submit={handleSubmit}>

      <!-- 01 Training -->
      <div class="form-section">
        <div class="section-label"><span>01</span> Training</div>

        <div class="field">
          <label for="missedSessions">Sessions missed this week</label>
          <select id="missedSessions" bind:value={missedSessions}>
            {#each [0,1,2,3,4,5,6,7] as n}
              <option value={n}>{n === 0 ? '0 — Hit everything' : n}</option>
            {/each}
          </select>
        </div>

        <div class="field">
          <label for="bestLift">Best lift or performance this week <span class="req">*</span></label>
          <input type="text" id="bestLift" bind:value={bestLift}
            placeholder="e.g. Deadlift 140kg × 3, ran 5k in 24:30, hit a new skill…" required />
        </div>

        <div class="field">
          <label>Compared to last week, performance felt <span class="req">*</span></label>
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
          <label for="programFeedback">Missed sessions or exercises to flag?</label>
          <textarea id="programFeedback" bind:value={programFeedback}
            placeholder="What got in the way, movements that felt off, weights to adjust, anything to swap…"></textarea>
        </div>
      </div>

      <!-- 02 Recovery -->
      <div class="form-section">
        <div class="section-label"><span>02</span> Recovery & Health</div>

        <div class="field">
          <label>Soreness or pain this week <span class="req">*</span></label>
          <div class="option-group">
            {#each [
              { label: 'Nothing to flag', value: 1 },
              { label: 'Minor soreness', value: 2 },
              { label: 'Persistent soreness or tightness', value: 3 },
              { label: 'Pain — needs attention', value: 4 },
            ] as opt}
              <label class="option-chip" class:selected={soreness === opt.value}>
                <input type="radio" bind:group={soreness} value={opt.value} />
                {opt.label}
              </label>
            {/each}
          </div>
        </div>

        <div class="field">
          <label for="sorenessNotes">Details if relevant</label>
          <input type="text" id="sorenessNotes" bind:value={sorenessNotes}
            placeholder="Location, when it started, what incites it, any restrictions…" />
        </div>
      </div>

      <!-- 03 Nutrition -->
      <div class="form-section">
        <div class="section-label"><span>03</span> Nutrition</div>

        <div class="field">
          <label>Nutrition adherence this week</label>
          <div class="scale-wrap">
            <span class="scale-label">Off track</span>
            <input type="range" min="1" max="10" bind:value={nutritionAdherence}
              style="background: linear-gradient(to right, var(--black) 0%, var(--black) {nutritionPct}%, var(--light-grey) {nutritionPct}%, var(--light-grey) 100%)" />
            <span class="scale-value">{nutritionAdherence}</span>
            <span class="scale-label">Dialled in</span>
          </div>
        </div>

        <div class="field">
          <label for="nutritionNotes">Anything worth flagging?</label>
          <textarea id="nutritionNotes" bind:value={nutritionNotes}
            placeholder="Missed meals, social events, big deviation from plan, appetite changes…"></textarea>
        </div>
      </div>

      <!-- 04 For Ryan -->
      <div class="form-section">
        <div class="section-label"><span>04</span> For Ryan</div>

        <div class="field">
          <label for="forRyan">Questions or anything to address before next week?</label>
          <textarea id="forRyan" bind:value={forRyan}
            placeholder="Program questions, technique concerns, scheduling changes — your opportunity to AMA."></textarea>
        </div>

        <div class="field">
          <label>How would you rate this week overall?</label>
          <div class="scale-wrap">
            <span class="scale-label">Rough</span>
            <input type="range" min="1" max="10" bind:value={weekRating}
              style="background: linear-gradient(to right, {ratingInfo.color} 0%, {ratingInfo.color} {ratingPct}%, var(--light-grey) {ratingPct}%, var(--light-grey) 100%)" />
            <span class="scale-label" style="text-align:right;">Great</span>
          </div>
          <div class="rating-display">
            <span class="rating-dot" style="background: {ratingInfo.color}"></span>
            <span class="rating-label" style="color: {ratingInfo.color}">{ratingInfo.label}</span>
          </div>
        </div>
      </div>

      {#if error}
        <p class="error">{error}</p>
      {/if}

      <div class="submit-wrap">
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit Check-In'}
        </button>
      </div>

    </form>
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

  .sub {
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

  .section-label span { color: var(--accent); }

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
  select,
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
  select:focus,
  textarea:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(200,169,110,0.12);
  }

  input[type="text"]::placeholder,
  textarea::placeholder { color: var(--mid-grey); }

  textarea { resize: vertical; min-height: 88px; line-height: 1.55; }

  /* Option chips */
  .option-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
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
    font-size: 11px;
    color: var(--mid-grey);
    white-space: nowrap;
    text-transform: none;
    letter-spacing: 0;
    font-weight: 400;
    margin-bottom: 0;
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
    transition: color 0.2s;
  }

  .error {
    font-size: 13px;
    color: var(--error);
    margin-bottom: 16px;
  }

  .submit-wrap {
    display: flex;
    justify-content: center;
    margin-top: 40px;
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
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--accent);
  }

  button[type="submit"]:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
