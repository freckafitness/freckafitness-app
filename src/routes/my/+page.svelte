<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { supabase } from '$lib/supabase.js';
  import Header from '$lib/Header.svelte';
  import { Chart, registerables } from 'chart.js';
  Chart.register(...registerables);

  let client        = null;
  let weightUnit    = 'kg';
  let checkins      = [];
  let checkinDone   = false;
  let expanded      = {};
  let checkinSearch = '';

  let ratingCanvas, missedCanvas, nutritionCanvas, sleepCanvas, radarCanvas;
  let charts = [];
  let chartsOpen    = false;
  let clientColor   = null;

  let portalLoading   = false;
  let portalError     = '';
  let hasStripeCustomer = false;
  let funFact = '';

  async function openPortal() {
    portalLoading = true;
    portalError   = '';
    const { data, error } = await supabase.functions.invoke('create-portal-session');
    portalLoading = false;
    if (data?.url) {
      window.location.href = data.url;
    } else {
      portalError = data?.error ?? error?.message ?? 'Could not open portal';
    }
  }

  // Ensures the color has enough contrast on white. If luminance > 0.5,
  // keeps the hue/saturation but darkens to 45% lightness.
  function contrastColor(hex) {
    if (!hex) return '#6888E8';
    const r = parseInt(hex.slice(1,3), 16) / 255;
    const g = parseInt(hex.slice(3,5), 16) / 255;
    const b = parseInt(hex.slice(5,7), 16) / 255;
    const lin = c => c <= 0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4);
    const L = 0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(b);
    if (L <= 0.5) return hex;
    const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min;
    let h = 0, s = 0;
    if (d > 0) {
      s = d / (max+min < 1 ? max+min : 2-max-min);
      if      (max === r) h = ((g-b)/d + (g<b?6:0)) / 6;
      else if (max === g) h = ((b-r)/d + 2) / 6;
      else                h = ((r-g)/d + 4) / 6;
    }
    const l2 = 0.45;
    const q = l2 < 0.5 ? l2*(1+s) : l2+s-l2*s;
    const p = 2*l2 - q;
    const hue2rgb = (p,q,t) => {
      t = t<0?t+1:t>1?t-1:t;
      if (t<1/6) return p+(q-p)*6*t;
      if (t<1/2) return q;
      if (t<2/3) return p+(q-p)*(2/3-t)*6;
      return p;
    };
    const h2 = x => Math.round(hue2rgb(p,q,x)*255).toString(16).padStart(2,'0');
    return '#' + h2(h+1/3) + h2(h) + h2(h-1/3);
  }

  const SORENESS_LABELS = { 1: 'Nothing to Flag', 2: 'Minor Soreness', 3: 'Persistent Soreness', 4: 'Pain — Needs Attention' };
  const RATING_COLORS   = { 1: '#E87878', 2: '#E8BF60', 3: '#72C872', 4: '#5CC4B8', 5: '#6888E8' };
  const RATING_LABELS   = { 1: 'Rough', 2: 'Below Average', 3: 'Average', 4: 'Above Average', 5: 'Great' };

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { goto('/login'); return; }

    const { data: role } = await supabase.from('user_roles').select('role, client_id').single();
    if (role?.role === 'coach') { goto('/dashboard'); return; }

    const [{ data: clientData }, { data: checkinData }, { data: paymentData }] = await Promise.all([
      supabase.from('clients')
        .select('first_name, last_name, weight_unit, favorite_color')
        .eq('id', role.client_id)
        .single(),
      supabase.from('checkins')
        .select('id, week_ending, week_rating, missed_sessions, progress_trend, soreness, nutrition_adherence, best_lift, program_feedback, soreness_notes, nutrition_notes, for_ryan, coach_notes, coach_notes_updated_at, bodyweight, sleep_hours, stress_level, upcoming_disruptions, disruption_notes')
        .eq('client_id', role.client_id)
        .order('week_ending', { ascending: false }),
      supabase.from('payments')
        .select('stripe_customer_id')
        .eq('client_id', role.client_id)
        .eq('test_mode', false)
        .not('stripe_customer_id', 'is', null)
        .limit(1)
        .maybeSingle(),
    ]);

    client            = clientData;
    weightUnit        = clientData?.weight_unit ?? 'kg';
    checkins          = checkinData ?? [];
    hasStripeCustomer = !!paymentData?.stripe_customer_id;
    clientColor = clientData?.favorite_color ?? null;
    // Most recent expanded by default
    if (checkins.length > 0) expanded = { [checkins[0].id]: true };

    checkinDone = $page.url.searchParams.get('checkin') === 'done';
    if (checkinDone) {
      try {
        funFact = sessionStorage.getItem('ff_portal_fact') || '';
        sessionStorage.removeItem('ff_portal_fact');
      } catch (e) {}
    }

    if (checkins.length >= 1) {
      await new Promise(r => setTimeout(r, 0));
      initCharts([...checkins].reverse(), clientColor);
    }
  });

  function initCharts(sorted, color = null) {
    charts.forEach(c => c.destroy());
    charts = [];

    const labels = sorted.map(c =>
      new Date(c.week_ending + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );

    const defaults = {
      tension: 0.35,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2,
      fill: true,
    };

    const gridColor = 'rgba(0,0,0,0.06)';
    const tickColor = '#6a7080';

    function makeChart(canvas, label, data, color, yMin, yMax, yLabels) {
      if (!canvas) return;
      const chart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
          labels,
          datasets: [{ label, data, borderColor: color, pointBackgroundColor: color,
            backgroundColor: color + '18', ...defaults }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: {
            callbacks: { label: ctx => yLabels ? (yLabels[ctx.raw] ?? ctx.raw) : ctx.raw }
          }},
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 11 } } },
            y: { min: yMin, max: yMax, grid: { color: gridColor },
              ticks: { color: tickColor, font: { size: 11 }, stepSize: 1,
                callback: v => yLabels ? (yLabels[v] ?? v) : v } }
          }
        }
      });
      charts.push(chart);
    }

    const ratingLabels = { 1: 'Rough', 2: 'Below Avg', 3: 'Average', 4: 'Above Avg', 5: 'Great' };

    makeChart(ratingCanvas,    'Week Rating',         sorted.map(c => c.week_rating),          '#6888E8', 1, 5,  ratingLabels);
    makeChart(missedCanvas,    'Missed Sessions',     sorted.map(c => c.missed_sessions ?? 0), '#5CC4B8', 0, 4,  { 0:'0', 1:'1', 2:'2', 3:'3', 4:'>3' });
    makeChart(nutritionCanvas, 'Nutrition Adherence', sorted.map(c => c.nutrition_adherence),  '#c8a96e', 1, 10, null);
    makeChart(sleepCanvas,     'Sleep (hrs)',         sorted.map(c => c.sleep_hours),          '#72C872', 1, 10, null);

    // Habit web — 4-week rolling average, all axes normalized 0–10
    // Axis order (flat-top hexagon, startAngle 30°):
    // Sleep(1o'c) · Nutrition(3) · Recovery(5) · Stress(7) · Week Rating(9) · Consistency(11)
    if (radarCanvas && sorted.length >= 1) {
      const recent = sorted.slice(-4);
      const avgOf = key => {
        const vals = recent.map(c => c[key]).filter(v => v != null);
        return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
      };

      const radarData = [
        parseFloat((Math.min(avgOf('sleep_hours') / 8, 1) * 10).toFixed(1)),              // Sleep
        parseFloat(avgOf('nutrition_adherence').toFixed(1)),                               // Nutrition
        parseFloat((Math.min((4 - avgOf('soreness')) / 3 * 10, 10)).toFixed(1)),          // Recovery
        parseFloat((Math.min((10 - avgOf('stress_level')) / 9 * 10, 10)).toFixed(1)),     // Stress (inverted)
        parseFloat(((avgOf('week_rating') / 5) * 10).toFixed(1)),                         // Week Rating
        parseFloat(((4 - avgOf('missed_sessions')) / 4 * 10).toFixed(1)),                 // Consistency
      ];

      const fillHex   = color || '#6888E8';
      const borderHex = contrastColor(fillHex);

      const radarChart = new Chart(radarCanvas.getContext('2d'), {
        type: 'radar',
        data: {
          labels: ['Sleep', 'Nutrition', 'Recovery', 'Stress', 'Week\nRating', 'Consistency'],
          datasets: [{
            label: '4-Week Average',
            data: radarData,
            borderColor: borderHex,
            backgroundColor: fillHex + '28',
            pointBackgroundColor: borderHex,
            pointRadius: 4,
            borderWidth: 2,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => `${ctx.raw} / 10` } }
          },
          scales: {
            r: {
              min: 0, max: 10,
              startAngle: 30,
              ticks: { stepSize: 2, display: false },
              grid: { color: 'rgba(0,0,0,0.07)' },
              angleLines: { color: 'rgba(0,0,0,0.07)' },
              pointLabels: {
                font: { size: 11, weight: '700', family: "'Halyard Display', sans-serif" },
                color: '#6a7080',
              }
            }
          }
        }
      });
      charts.push(radarChart);
    }
  }

  function fmtDate(d) {
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function toggle(id) {
    expanded = { ...expanded, [id]: !expanded[id] };
  }

  let searchMatchIdx = 0;

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function highlight(text, q) {
    if (!q || !text) return escapeHtml(text ?? '');
    const escaped = escapeHtml(text);
    // Highlight each non-operator term
    const terms = q.split(/\bOR\b/i).flatMap(g => g.trim().split(/\s+/))
      .filter(t => t && !t.startsWith('-'));
    let result = escaped;
    terms.forEach(term => {
      const re = new RegExp(`(${term.replace(/\*/g, '\\S*').replace(/[.+?^${}()|[\]\\]/g, c => c === '*' ? c : '\\' + c)})`, 'gi');
      result = result.replace(re, '<mark>$1</mark>');
    });
    return result;
  }

  function checkinText(c) {
    return [
      c.week_ending, c.progress_trend, c.best_lift,
      c.program_feedback, c.soreness_notes, c.nutrition_notes,
      c.disruption_notes, c.for_ryan, c.coach_notes,
    ].filter(Boolean).join(' ').toLowerCase();
  }

  function termMatches(text, term) {
    const pat = term.replace(/\*/g, '.*').replace(/[.+?^${}()|[\]\\]/g, c => c === '*' ? c : '\\' + c);
    return new RegExp(pat.replace(/\\\.\*/g, '.*'), 'i').test(text);
  }

  function matchesSearch(c, q) {
    if (!q.trim()) return true;
    const text = checkinText(c);
    const orGroups = q.split(/\bOR\b/i);
    return orGroups.some(group => {
      const terms = group.trim().split(/\s+/).filter(Boolean);
      return terms.every(term => {
        if (term.startsWith('-') && term.length > 1) return !termMatches(text, term.slice(1));
        return termMatches(text, term);
      });
    });
  }

  $: filteredCheckins = checkins.filter(c => matchesSearch(c, checkinSearch));
  $: if (checkinSearch) {
    expanded = Object.fromEntries(filteredCheckins.map(c => [c.id, true]));
    searchMatchIdx = 0;
  }

  function scrollToMatch(idx) {
    const cards = document.querySelectorAll('.checkin-card');
    if (cards[idx]) cards[idx].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function navSearch(dir) {
    searchMatchIdx = (searchMatchIdx + dir + filteredCheckins.length) % filteredCheckins.length;
    scrollToMatch(searchMatchIdx);
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
        <p class="success-fact">{funFact}</p>
      </div>
    {/if}

    <div class="actions">
      <a href="/my/checkin" class="btn-primary">Submit Weekly Check-In</a>
      {#if hasStripeCustomer}
        <button class="btn-portal" on:click={openPortal} disabled={portalLoading}>
          {portalLoading ? 'Opening…' : 'Manage Subscription'}
        </button>
        {#if portalError}<p class="portal-error">{portalError}</p>{/if}
      {/if}
    </div>

    <!-- Habit web + Trend charts -->
    {#if checkins.length >= 1}
      <section class="insights-section">
        <button type="button" class="section-toggle" on:click={() => chartsOpen = !chartsOpen}>
          <span>Your Progress</span>
          <span class="chevron" class:open={chartsOpen}>›</span>
        </button>

        <div class="insights-body" class:hidden={!chartsOpen}>
          <div class="habit-web-block">
            <p class="web-subtitle">4-week rolling average — the fuller the web, the more well-rounded your consistency.</p>
            <div class="radar-wrap">
              <canvas bind:this={radarCanvas}></canvas>
            </div>
          </div>

          {#if checkins.length > 1}
            <div class="charts-grid">
              <div class="chart-wrap">
                <p class="chart-label">Week Rating</p>
                <canvas bind:this={ratingCanvas}></canvas>
              </div>
              <div class="chart-wrap">
                <p class="chart-label">Missed Sessions</p>
                <canvas bind:this={missedCanvas}></canvas>
              </div>
              <div class="chart-wrap">
                <p class="chart-label">Nutrition Adherence</p>
                <canvas bind:this={nutritionCanvas}></canvas>
              </div>
              <div class="chart-wrap">
                <p class="chart-label">Sleep (hrs)</p>
                <canvas bind:this={sleepCanvas}></canvas>
              </div>
            </div>
          {/if}
        </div>
      </section>
    {/if}

    <!-- Check-in history -->
    {#if checkins.length > 0}
      <section>
        <div class="section-header-row">
          <h2>Check-In History
            <span class="count">{checkinSearch ? filteredCheckins.length + ' / ' : ''}{checkins.length}</span>
          </h2>
          <button class="btn-expand-all" on:click={() => {
            const allExpanded = filteredCheckins.every(c => expanded[c.id]);
            expanded = allExpanded
              ? Object.fromEntries(filteredCheckins.map(c => [c.id, false]))
              : Object.fromEntries(filteredCheckins.map(c => [c.id, true]));
          }}>
            {filteredCheckins.every(c => expanded[c.id]) ? 'Collapse All' : 'Expand All'}
          </button>
          <div class="search-row">
            <input class="search-input" type="search" bind:value={checkinSearch} placeholder="Search check-ins…"
              on:keydown={e => { if (e.key === 'Enter') navSearch(1); }} />
            {#if checkinSearch && filteredCheckins.length > 0}
              <button class="nav-btn" on:click={() => navSearch(-1)}>↑</button>
              <button class="nav-btn" on:click={() => navSearch(1)}>↓</button>
              <span class="match-count">{searchMatchIdx + 1} / {filteredCheckins.length}</span>
            {/if}
          </div>
        </div>

        <div class="checkin-list">
          {#each filteredCheckins as c, i}
            <div class="checkin-card" class:search-active={checkinSearch && i === searchMatchIdx}>

              <!-- Header (always visible, toggles expand) -->
              <button type="button" class="card-header" on:click={() => toggle(c.id)}>
                <div class="card-header-left">
                  <span class="week-label">Week ending {fmtDate(c.week_ending)}</span>
                  {#if c.missed_sessions}
                    <span class="missed-badge">{c.missed_sessions === 4 ? '>3' : c.missed_sessions} missed</span>
                  {/if}
                </div>
                <div class="card-header-right">
                  {#if c.week_rating}
                    <div class="rating-chip" style="border-color: {RATING_COLORS[c.week_rating]}; color: {RATING_COLORS[c.week_rating]};">
                      <span class="rating-dot" style="background: {RATING_COLORS[c.week_rating]};"></span>
                      {RATING_LABELS[c.week_rating]}
                    </div>
                  {/if}
                  <span class="chevron" class:open={expanded[c.id]}>›</span>
                </div>
              </button>

              {#if expanded[c.id]}
              <!-- Quick metrics -->
              <div class="metrics-row">
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
                {#if c.sleep_hours}
                  <div class="metric">
                    <span class="metric-label">Sleep</span>
                    <span class="metric-value">{c.sleep_hours} hrs</span>
                  </div>
                {/if}
                {#if c.stress_level}
                  <div class="metric">
                    <span class="metric-label">Stress</span>
                    <span class="metric-value">{c.stress_level} / 10</span>
                  </div>
                {/if}
                {#if c.bodyweight}
                  <div class="metric">
                    <span class="metric-label">Weight</span>
                    <span class="metric-value">
                      {weightUnit === 'lbs' ? (c.bodyweight * 2.2046).toFixed(1) + ' lbs' : c.bodyweight + ' kg'}
                    </span>
                  </div>
                {/if}
              </div>

              <!-- Your submission -->
              <div class="card-fields">
                {#if c.best_lift}
                  <div class="card-field">
                    <p class="field-label">Best Lift</p>
                    <p class="field-value">{@html highlight(c.best_lift, checkinSearch)}</p>
                  </div>
                {/if}
                {#if c.program_feedback}
                  <div class="card-field card-field--full">
                    <p class="field-label">Program Feedback</p>
                    <p class="field-value">{@html highlight(c.program_feedback, checkinSearch)}</p>
                  </div>
                {/if}
                {#if c.soreness_notes}
                  <div class="card-field card-field--full">
                    <p class="field-label">Soreness Notes</p>
                    <p class="field-value">{@html highlight(c.soreness_notes, checkinSearch)}</p>
                  </div>
                {/if}
                {#if c.nutrition_notes}
                  <div class="card-field card-field--full">
                    <p class="field-label">Nutrition Notes</p>
                    <p class="field-value">{@html highlight(c.nutrition_notes, checkinSearch)}</p>
                  </div>
                {/if}
                {#if c.upcoming_disruptions}
                  <div class="card-field card-field--full disruption-flag">
                    <p class="field-label">Upcoming Disruption</p>
                    <p class="field-value">{@html highlight(c.disruption_notes || 'Flagged — no details provided', checkinSearch)}</p>
                  </div>
                {/if}
                {#if c.for_ryan}
                  <div class="card-field card-field--full for-me">
                    <p class="field-label">Your note to me</p>
                    <p class="field-value">{@html highlight(c.for_ryan, checkinSearch)}</p>
                  </div>
                {/if}
              </div>

              <!-- Coach notes -->
              {#if c.coach_notes}
                <div class="coach-note">
                  <p class="coach-note-label">Ryan's Notes</p>
                  <p class="coach-note-text">{@html highlight(c.coach_notes, checkinSearch)}</p>
                </div>
              {/if}
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
  .success-fact {
    margin: 12px 0 0;
    font-size: 13px;
    font-weight: 400;
    line-height: 1.55;
    opacity: 0.9;
  }

  .actions {
    margin-bottom: 48px;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .btn-portal {
    font-family: 'Halyard Display', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--black);
    background: none;
    border: 1px solid var(--light-grey);
    border-radius: 4px;
    padding: 10px 20px;
    cursor: pointer;
    transition: border-color 0.15s;
  }
  .btn-portal:hover:not(:disabled) { border-color: var(--black); }
  .btn-portal:disabled { opacity: 0.5; cursor: not-allowed; }

  .portal-error {
    font-size: 12px;
    color: var(--error);
    width: 100%;
    margin: 0;
  }

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

  /* Insights (habit web + trends) */
  .insights-section { margin-bottom: 40px; }

  .section-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    background: none;
    border: none;
    border-bottom: 1px solid var(--light-grey);
    padding-bottom: 10px;
    margin-bottom: 24px;
    cursor: pointer;
    font-family: 'Halyard Display', sans-serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--black);
    text-align: left;
  }

  .section-toggle:hover { color: var(--accent); }

  .insights-body { display: flex; flex-direction: column; gap: 32px; }
  .insights-body.hidden { display: none; }

  .habit-web-block { display: flex; flex-direction: column; align-items: center; }

  .web-subtitle {
    font-size: 13px;
    color: var(--mid-grey);
    margin-bottom: 20px;
    line-height: 1.5;
    text-align: center;
  }

  .radar-wrap {
    background: white;
    border: 1px solid var(--light-grey);
    border-radius: 8px;
    padding: 24px;
    width: 100%;
    max-width: 380px;
  }

  .charts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  @media (max-width: 600px) {
    .charts-grid { grid-template-columns: 1fr; }
  }

  .chart-wrap {
    background: white;
    border: 1px solid var(--light-grey);
    border-radius: 8px;
    padding: 16px 18px 12px;
  }

  .chart-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--mid-grey);
    margin-bottom: 12px;
  }

  .chart-wrap canvas { height: 160px !important; }

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
  .section-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    gap: 16px;
  }

  .section-header-row h2 { margin-bottom: 0; }

  .btn-expand-all {
    font-family: 'Halyard Display', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    background: none;
    border: 1.5px solid var(--light-grey);
    border-radius: 4px;
    padding: 5px 12px;
    color: var(--mid-grey);
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s;
  }
  .btn-expand-all:hover { border-color: var(--black); color: var(--black); }

  .search-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .search-input {
    font-family: 'Halyard Display', sans-serif;
    font-size: 13px;
    padding: 7px 12px;
    border: 1.5px solid var(--light-grey);
    border-radius: 5px;
    background: white;
    color: var(--black);
    outline: none;
    width: 200px;
    transition: border-color 0.15s;
  }
  .search-input:focus { border-color: var(--accent); }

  .nav-btn {
    font-family: 'Halyard Display', sans-serif;
    font-size: 13px;
    font-weight: 700;
    background: none;
    border: 1.5px solid var(--light-grey);
    border-radius: 4px;
    padding: 4px 8px;
    cursor: pointer;
    color: var(--black);
    transition: border-color 0.15s;
    line-height: 1;
  }
  .nav-btn:hover { border-color: var(--black); }

  .match-count {
    font-size: 12px;
    color: var(--mid-grey);
    white-space: nowrap;
  }

  :global(mark) {
    background: #fff3b0;
    color: inherit;
    border-radius: 2px;
    padding: 0 1px;
  }

  .checkin-card.search-active {
    border-color: #e8b830;
    box-shadow: 0 0 0 2px rgba(232, 184, 48, 0.25);
  }

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
    width: 100%;
    border: none;
    cursor: pointer;
    font-family: 'Halyard Display', sans-serif;
    text-align: left;
  }

  .card-header:hover { background: #1f2f45; }

  .card-header-left  { display: flex; align-items: center; gap: 10px; }
  .card-header-right { display: flex; align-items: center; gap: 10px; }

  .week-label { font-size: 13px; font-weight: 700; color: var(--off-white); letter-spacing: 0.04em; }

  .chevron {
    font-size: 22px;
    color: var(--accent);
    transition: transform 0.2s;
    display: inline-block;
    line-height: 1;
  }
  .chevron.open { transform: rotate(90deg); }

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

  .disruption-flag {
    background: #fff8ec;
    border: 1px solid rgba(200,169,110,0.35);
    border-radius: 4px;
    padding: 8px 10px;
    margin-top: 4px;
    grid-column: 1 / -1;
  }

  .disruption-flag .field-label { color: var(--accent); }

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
