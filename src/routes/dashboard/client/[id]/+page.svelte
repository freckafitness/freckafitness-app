<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { supabase } from '$lib/supabase.js';
  import Header from '$lib/Header.svelte';
  import { Chart, registerables } from 'chart.js';
  Chart.register(...registerables);

  let client   = null;
  let checkins = [];
  let intake   = null;
  let loading  = true;

  let notesState     = {};
  let expanded       = {};
  let checkinSearch  = '';
  let displayUnit    = 'kg';
  let archiveConfirm = false;
  let archiving      = false;
  let archiveError   = '';

  // Billing
  let payments          = [];
  let linkFormOpen      = false;
  let linkProductName   = '';
  let linkMode          = 'subscription';
  let linkLoading       = false;
  let linkUrl           = '';
  let linkError         = '';
  let stripeProducts    = [];
  let productsLoading   = false;
  let selectedProductId = '';
  let selectedPriceId   = '';
  let portalLoading     = false;
  let testMode          = false;

  // Chart canvas refs
  let ratingCanvas, nutritionCanvas, sorenessCanvas, missedCanvas, sleepCanvas, stressCanvas, bodyweightCanvas, radarCanvas, comparisonCanvas;
  let charts = [];
  let comparisonChart = null;
  let chartsReady     = false;

  // Comparison period state
  let comparisonPeriod = '12W';
  let customFrom       = '';
  let customTo         = '';
  let comparisonCount  = 0;
  let minDate          = '';
  let maxDate          = '';

  const PERIODS = [
    { label: '8W',       value: '8W'     },
    { label: '12W',      value: '12W'    },
    { label: '6M',       value: '6M'     },
    { label: 'YTD',      value: 'YTD'    },
    { label: 'All Time', value: 'ALL'    },
    { label: 'Custom',   value: 'custom' },
  ];

  function radarDataFrom(subset) {
    if (!subset.length) return [0, 0, 0, 0, 0, 0];
    // Null-safe average — excludes missing values rather than treating them as 0
    const avgOf = key => {
      const vals = subset.map(c => c[key]).filter(v => v != null);
      return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    };
    // Axis order matches startAngle:30 flat-top hexagon:
    // Sleep(1o'c) · Nutrition(3) · Recovery(5) · Stress(7) · Week Rating(9) · Consistency(11)
    return [
      parseFloat((Math.min(avgOf('sleep_hours') / 8, 1) * 10).toFixed(1)),           // Sleep
      parseFloat(avgOf('nutrition_adherence').toFixed(1)),                            // Nutrition
      parseFloat((Math.min((4 - avgOf('soreness')) / 3 * 10, 10)).toFixed(1)),       // Recovery
      parseFloat((Math.min((10 - avgOf('stress_level')) / 9 * 10, 10)).toFixed(1)),  // Stress (inverted)
      parseFloat(((avgOf('week_rating') / 5) * 10).toFixed(1)),                      // Week Rating
      parseFloat(((4 - avgOf('missed_sessions')) / 4 * 10).toFixed(1)),              // Consistency
    ];
  }

  function getCheckinsByPeriod(period, from, to) {
    const sorted = [...checkins].sort((a, b) => a.week_ending.localeCompare(b.week_ending));
    if (period === 'ALL') return sorted;
    if (period === 'custom') {
      if (!from || !to) return [];
      return sorted.filter(c => c.week_ending >= from && c.week_ending <= to);
    }
    const now = new Date();
    let cutoff;
    switch (period) {
      case '8W':  cutoff = new Date(now - 8  * 7 * 864e5); break;
      case '12W': cutoff = new Date(now - 12 * 7 * 864e5); break;
      case '6M':  cutoff = new Date(now); cutoff.setMonth(cutoff.getMonth() - 6); break;
      case 'YTD': cutoff = new Date(now.getFullYear(), 0, 1); break;
      default:    return sorted;
    }
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return sorted.filter(c => c.week_ending >= cutoffStr);
  }

  function radarChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => `${ctx.raw} / 10` } }
      },
      scales: {
        r: {
          min: 0, max: 10, startAngle: 30,
          ticks: { stepSize: 2, display: false },
          grid: { color: 'rgba(0,0,0,0.07)' },
          angleLines: { color: 'rgba(0,0,0,0.07)' },
          pointLabels: {
            font: { size: 11, weight: '700', family: "'Halyard Display', sans-serif" },
            color: '#6a7080',
          }
        }
      }
    };
  }

  function drawComparisonRadar() {
    if (comparisonChart) { comparisonChart.destroy(); comparisonChart = null; }
    if (!comparisonCanvas) return;
    const subset = getCheckinsByPeriod(comparisonPeriod, customFrom, customTo);
    comparisonCount = subset.length;
    if (!subset.length) return;
    const fillHex   = client?.favorite_color || '#6888E8';
    const borderHex = contrastColor(fillHex);
    comparisonChart = new Chart(comparisonCanvas.getContext('2d'), {
      type: 'radar',
      data: {
        labels: ['Sleep', 'Nutrition', 'Recovery', 'Stress', 'Week\nRating', 'Consistency'],
        datasets: [{ label: 'Period Average', data: radarDataFrom(subset),
          borderColor: borderHex, backgroundColor: fillHex + '28',
          pointBackgroundColor: borderHex, pointRadius: 4, borderWidth: 2 }]
      },
      options: radarChartOptions()
    });
  }

  $: if (chartsReady) {
    comparisonPeriod; customFrom; customTo;
    drawComparisonRadar();
  }

  let searchMatchIdx = 0;

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function highlight(text, q) {
    if (!q || !text) return escapeHtml(text ?? '');
    const escaped = escapeHtml(text);
    const terms = q.split(/\bOR\b/i).flatMap(g => g.trim().split(/\s+/))
      .filter(t => t && !t.startsWith('-'));
    let result = escaped;
    terms.forEach(term => {
      const pat = term.replace(/\*/g, '\\S*').replace(/[.+?^${}()|[\]\\]/g, c => c === '*' ? c : '\\' + c);
      result = result.replace(new RegExp(`(${pat.replace(/\\\\\S\*/g, '\\S*')})`, 'gi'), '<mark>$1</mark>');
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
    const wildcard = term.replace(/\*/g, '.*').replace(/[.+?^${}()|[\]\\]/g, c => c === '*' ? c : '\\' + c);
    return new RegExp(wildcard.replace(/\\\.\*/g, '.*'), 'i').test(text);
  }

  function matchesSearch(c, q) {
    if (!q.trim()) return true;
    const text = checkinText(c);
    // Split on OR first
    const orGroups = q.split(/\bOR\b/i);
    return orGroups.some(group => {
      const terms = group.trim().split(/\s+/).filter(Boolean);
      return terms.every(term => {
        if (term.startsWith('-') && term.length > 1) {
          return !termMatches(text, term.slice(1));
        }
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
    const { data: role } = await supabase.from('user_roles').select('role').single();
    if (role?.role !== 'coach') { goto('/my'); return; }

    const id = $page.params.id;

    const [{ data: c }, { data: ch }, { data: i }, { data: p }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('checkins').select('*').eq('client_id', id).order('week_ending', { ascending: false }),
      supabase.from('intakes').select('id').eq('client_id', id).maybeSingle(),
      supabase.from('payments').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    ]);

    client   = c;
    checkins = ch ?? [];
    intake   = i;
    payments = p ?? [];

    if (checkins.length) {
      const sorted = [...checkins].sort((a, b) => a.week_ending.localeCompare(b.week_ending));
      minDate = sorted[0].week_ending;
      maxDate = sorted[sorted.length - 1].week_ending;
    }

    checkins.forEach(c => {
      notesState[c.id] = { text: c.coach_notes ?? '', saving: false, saved: false };
    });

    if (checkins.length > 0) expanded = { [checkins[0].id]: true };
    displayUnit = c?.weight_unit ?? 'kg';

    testMode = localStorage.getItem('stripe_test_mode') === 'true';
    loading = false;

    // Charts need the DOM — wait a tick
    if (checkins.length > 1) {
      await new Promise(r => setTimeout(r, 0));
      initCharts([...checkins].reverse());
      chartsReady = true;
    }
  });

  function initCharts(sorted) {
    charts.forEach(c => c.destroy());
    charts = [];

    const labels = sorted.map(c =>
      new Date(c.week_ending + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );

    const defaults = {
      tension: 0.35,
      pointBackgroundColor: '#253551',
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2,
    };

    const gridColor = 'rgba(0,0,0,0.06)';
    const tickColor = '#6a7080';

    function makeChart(canvas, label, data, color, yMin, yMax, yLabels) {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{ label, data, borderColor: color, ...defaults,
            pointBackgroundColor: color,
            fill: true,
            backgroundColor: color + '18',
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: {
            callbacks: {
              label: ctx => yLabels ? (yLabels[ctx.raw] ?? ctx.raw) : ctx.raw
            }
          }},
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 11 } } },
            y: {
              min: yMin, max: yMax,
              grid: { color: gridColor },
              ticks: {
                color: tickColor, font: { size: 11 }, stepSize: 1,
                callback: v => yLabels ? (yLabels[v] ?? v) : v
              }
            }
          }
        }
      });
      charts.push(chart);
    }

    const ratingLabels   = { 1: 'Rough', 2: 'Below Avg', 3: 'Average', 4: 'Above Avg', 5: 'Great' };
    const sorenessLabels = { 1: 'None', 2: 'Minor', 3: 'Persistent', 4: 'Pain' };

    makeChart(ratingCanvas,      'Week Rating',      sorted.map(c => c.week_rating),         '#6888E8', 1, 5,    ratingLabels);
    makeChart(nutritionCanvas,   'Nutrition',        sorted.map(c => c.nutrition_adherence), '#c8a96e', 1, 10,   null);
    makeChart(sorenessCanvas,    'Soreness',         sorted.map(c => c.soreness),            '#E87878', 1, 4,    sorenessLabels);
    makeChart(missedCanvas,      'Missed Sessions',  sorted.map(c => c.missed_sessions ?? 0),'#5CC4B8', 0, 4,    { 0:'0', 1:'1', 2:'2', 3:'3', 4:'>3' });
    makeChart(sleepCanvas,      'Sleep (hrs)',             sorted.map(c => c.sleep_hours),   '#72C872', 1, 10,  null);
    makeChart(stressCanvas,     'Stress Level',            sorted.map(c => c.stress_level),  '#9b72c8', 1, 10,  null);
    const bwData = sorted.map(c => c.bodyweight == null ? null
      : displayUnit === 'lbs' ? parseFloat((c.bodyweight * 2.2046).toFixed(1)) : c.bodyweight);
    makeChart(bodyweightCanvas, `Body Weight (${displayUnit})`, bwData, '#c8a96e', undefined, undefined, null);

    // Habit web — 4-week rolling average
    if (radarCanvas && sorted.length >= 1) {
      const fillHex   = client?.favorite_color || '#6888E8';
      const borderHex = contrastColor(fillHex);
      const radarChart = new Chart(radarCanvas.getContext('2d'), {
        type: 'radar',
        data: {
          labels: ['Sleep', 'Nutrition', 'Recovery', 'Stress', 'Week\nRating', 'Consistency'],
          datasets: [{ label: '4-Week Average', data: radarDataFrom(sorted.slice(-4)),
            borderColor: borderHex, backgroundColor: fillHex + '28',
            pointBackgroundColor: borderHex, pointRadius: 4, borderWidth: 2 }]
        },
        options: radarChartOptions()
      });
      charts.push(radarChart);
    }
  }

  async function switchDisplayUnit(u) {
    if (displayUnit === u) return;
    displayUnit = u;
    if (checkins.length > 1) {
      charts.forEach(c => c.destroy());
      charts = [];
      await new Promise(r => setTimeout(r, 0));
      initCharts([...checkins].reverse());
    }
  }

  function fmtWeight(kg) {
    if (kg == null) return null;
    return displayUnit === 'lbs'
      ? (kg * 2.2046).toFixed(1) + ' lbs'
      : kg + ' kg';
  }

  async function toggleBodyweight() {
    const next = !client.show_bodyweight;
    client = { ...client, show_bodyweight: next };
    await supabase.from('clients').update({ show_bodyweight: next }).eq('id', client.id);
    if (checkins.length > 1) {
      charts.forEach(c => c.destroy());
      charts = [];
      await new Promise(r => setTimeout(r, 0));
      initCharts([...checkins].reverse());
    }
  }

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

  function toggle(id) {
    expanded = { ...expanded, [id]: !expanded[id] };
  }

  function fmtDate(d) {
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function fmtSince(d) {
    return new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  async function invokeWithError(fn: string, opts?: object) {
    const { data, error } = await supabase.functions.invoke(fn, opts);
    if (error || data?.error) {
      console.error(`[${fn}] raw error:`, error, 'raw data:', data);
      let msg = error?.message ?? 'Unknown error';
      const ctx = (error as any)?.context;
      if (ctx) {
        try {
          const body = typeof ctx.json === 'function' ? await ctx.json() : ctx;
          console.error(`[${fn}] context body:`, body);
          if (body?.error) msg = body.error;
        } catch { /* couldn't extract body */ }
      }
      if (data?.error) msg = data.error;
      return { data: null, errMsg: `[${fn}] ${msg}` };
    }
    return { data, errMsg: null };
  }

  function toggleTestMode() {
    testMode = !testMode;
    localStorage.setItem('stripe_test_mode', String(testMode));
    stripeProducts    = [];
    selectedProductId = '';
    selectedPriceId   = '';
    linkUrl           = '';
    linkError         = '';
  }

  async function openLinkForm() {
    linkFormOpen      = !linkFormOpen;
    linkUrl           = '';
    linkError         = '';
    selectedProductId = '';
    selectedPriceId   = '';
    if (linkFormOpen && stripeProducts.length === 0) {
      productsLoading = true;
      const { data, errMsg } = await invokeWithError('list-stripe-products', { body: { test_mode: testMode } });
      if (errMsg) {
        linkError = errMsg;
      } else {
        stripeProducts = data?.products ?? [];
        if (stripeProducts.length === 0) linkError = 'No active products found in Stripe.';
      }
      productsLoading = false;
    }
  }

  $: selectedProduct = stripeProducts.find(p => p.id === selectedProductId) ?? null;

  $: if (selectedProduct) {
    const price       = selectedProduct.prices[0];
    selectedPriceId   = price?.id ?? '';
    linkMode          = price?.mode ?? 'subscription';
    linkProductName   = selectedProduct.name;
  }

  async function generateLink() {
    linkLoading = true;
    linkUrl     = '';
    linkError   = '';
    const { data, errMsg } = await invokeWithError('create-checkout-session', {
      body: { client_id: client.id, price_id: selectedPriceId, product_name: linkProductName, mode: linkMode, test_mode: testMode },
    });
    linkLoading = false;
    if (errMsg || !data?.url) {
      linkError = errMsg ?? 'Failed to generate link';
    } else {
      linkUrl = data.url;
    }
  }

  async function openPortal() {
    portalLoading = true;
    linkError     = '';
    const { data, errMsg } = await invokeWithError('create-portal-session', {
      body: { client_id: client.id, test_mode: testMode },
    });
    portalLoading = false;
    if (data?.url) {
      window.open(data.url, '_blank');
    } else {
      linkError = errMsg ?? 'Could not open portal';
    }
  }

  async function archiveClient() {
    archiveError = '';
    archiving = true;

    const { error } = await supabase.functions.invoke('archive-client', {
      body: { client_id: client.id },
    });

    if (error) {
      archiveError = error.message ?? 'Something went wrong.';
      archiving = false;
      archiveConfirm = false;
      return;
    }

    goto('/dashboard');
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
        <div class="top-bar-actions">
          {#if client.status === 'active'}
            <button class="bw-toggle" class:on={client.show_bodyweight} on:click={toggleBodyweight}>
              <span class="bw-toggle-track" class:on={client.show_bodyweight}><span class="bw-toggle-thumb"></span></span>
              Track body weight
            </button>
          {/if}
          {#if intake}
            <a href="/dashboard/intake/{intake.id}" class="btn-outline">View Intake</a>
          {/if}
          {#if client.status === 'active'}
            {#if archiveConfirm}
              <div class="archive-confirm">
                <span class="archive-confirm-label">Archive this client?</span>
                <button class="btn-archive-confirm" on:click={archiveClient} disabled={archiving}>
                  {archiving ? 'Archiving…' : 'Yes, archive'}
                </button>
                <button class="btn-cancel" on:click={() => archiveConfirm = false} disabled={archiving}>Cancel</button>
              </div>
            {:else}
              <button class="btn-archive" on:click={() => archiveConfirm = true}>Archive</button>
            {/if}
          {/if}
        </div>
      </div>
      {#if archiveError}<p class="archive-error">{archiveError}</p>{/if}

      <div class="hero-block">
        <p class="eyebrow">{client.status === 'inactive' ? 'Archived Client' : 'Client'}</p>
        <h1>{client.first_name} {client.last_name}</h1>
        <p class="meta">
          {client.email}
          {#if client.phone} · {client.phone}{/if}
        </p>
        <div class="hero-meta-row">
          <span class="badge {client.status}">{client.status}</span>
          <span class="since">Member since {fmtSince(client.created_at)}</span>
          {#if client.previous_client_id}
            <a href="/dashboard/client/{client.previous_client_id}" class="prev-stint-link">← Previous stint</a>
          {/if}
        </div>
      </div>

      <!-- Billing -->
      <section class="billing-section">
        <div class="section-header">
          <div class="billing-title-row">
            <h2>Billing</h2>
            {#if testMode}<span class="test-mode-badge">Test Mode</span>{/if}
          </div>
          <div class="billing-actions">
            <button class="btn-test-mode" class:active={testMode} on:click={toggleTestMode}>
              {testMode ? 'Exit Test Mode' : 'Test Mode'}
            </button>
            {#if payments.some(p => p.stripe_customer_id && !p.test_mode)}
              <button class="btn-outline" on:click={openPortal} disabled={portalLoading}>
                {portalLoading ? 'Opening…' : 'Customer Portal'}
              </button>
            {/if}
            <button class="btn-outline" on:click={openLinkForm}>
              {linkFormOpen ? 'Cancel' : '+ Payment Link'}
            </button>
          </div>
        </div>

        {#if linkError}
          <div class="billing-error">
            <span class="billing-error-msg">{linkError}</span>
            <button class="billing-error-dismiss" on:click={() => linkError = ''}>✕</button>
          </div>
        {/if}

        {#if linkFormOpen}
          <div class="link-form">
            {#if productsLoading}
              <p class="products-loading">Loading products…</p>
            {:else if stripeProducts.length === 0 && !linkError}
              <p class="products-loading">No active products found in Stripe.</p>
            {:else}
              <div class="link-form-row">
                <div class="link-form-field">
                  <span class="field-label">Product</span>
                  <select bind:value={selectedProductId}>
                    <option value="">Select a product…</option>
                    {#each stripeProducts as product}
                      <option value={product.id}>{product.name}</option>
                    {/each}
                  </select>
                </div>
                {#if selectedProduct && selectedProduct.prices.length > 1}
                  <div class="link-form-field link-form-field--narrow">
                    <span class="field-label">Price</span>
                    <select bind:value={selectedPriceId} on:change={e => {
                      const price = selectedProduct.prices.find(p => p.id === e.target.value);
                      if (price) linkMode = price.mode;
                    }}>
                      {#each selectedProduct.prices as price}
                        <option value={price.id}>
                          ${(price.amount / 100).toFixed(2)}{price.interval ? ' / ' + price.interval : ''}
                        </option>
                      {/each}
                    </select>
                  </div>
                {/if}
              </div>
              <div class="link-form-actions">
                <button class="btn-primary" on:click={generateLink} disabled={!selectedPriceId || linkLoading}>
                  {linkLoading ? 'Generating…' : 'Generate Link'}
                </button>
              </div>
            {/if}
            {#if linkUrl}
              <div class="link-result">
                <span class="link-url">{linkUrl}</span>
                <button class="btn-copy" on:click={() => navigator.clipboard.writeText(linkUrl)}>Copy</button>
              </div>
            {/if}
          </div>
        {/if}

        {#if payments.length === 0}
          <p class="empty">No payment records yet.</p>
        {:else}
          <div class="payment-list">
            {#each payments as pm}
              <div class="payment-row">
                <div class="payment-main">
                  <span class="payment-name">{pm.product_name || '—'}</span>
                  <span class="payment-type">{pm.type === 'subscription' ? 'Subscription' : 'One-Time'}</span>
                  {#if pm.test_mode}<span class="payment-test-badge">Test</span>{/if}
                </div>
                <div class="payment-meta">
                  {#if pm.amount != null}
                    <span class="payment-amount">${(pm.amount / 100).toFixed(2)}</span>
                  {/if}
                  {#if pm.current_period_end && pm.status === 'active'}
                    <span class="payment-renews">renews {new Date(pm.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  {/if}
                  <span class="payment-status {pm.status}">{pm.status}</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </section>

      <!-- Trends -->
      {#if checkins.length > 1}
      <section class="trends-section">
        <div class="section-header">
          <h2>Trends</h2>
        </div>
        <div class="radars-row">

          <!-- Left: fixed 4-week -->
          <div class="radar-card">
            <p class="radar-card-label">Last 4 Weeks</p>
            <canvas bind:this={radarCanvas}></canvas>
          </div>

          <!-- Right: configurable comparison period -->
          <div class="radar-card">
            <div class="radar-card-header">
              <p class="radar-card-label">Compare Period</p>
              {#if comparisonCount > 0}
                <span class="checkin-count">{comparisonCount} check-in{comparisonCount === 1 ? '' : 's'}</span>
              {:else}
                <span class="checkin-count no-data">No data in range</span>
              {/if}
            </div>
            <div class="period-chips">
              {#each PERIODS as p}
                <button type="button" class="period-chip"
                  class:active={comparisonPeriod === p.value}
                  on:click={() => comparisonPeriod = p.value}>
                  {p.label}
                </button>
              {/each}
            </div>
            {#if comparisonPeriod === 'custom'}
              <div class="date-range">
                <input type="date" bind:value={customFrom} min={minDate} max={maxDate} />
                <span>→</span>
                <input type="date" bind:value={customTo}   min={minDate} max={maxDate} />
              </div>
            {/if}
            <canvas bind:this={comparisonCanvas}></canvas>
          </div>

        </div>

        <div class="charts-grid">
          <div class="chart-wrap">
            <p class="chart-label">Week Rating</p>
            <canvas bind:this={ratingCanvas}></canvas>
          </div>
          <div class="chart-wrap">
            <p class="chart-label">Nutrition Adherence</p>
            <canvas bind:this={nutritionCanvas}></canvas>
          </div>
          <div class="chart-wrap">
            <p class="chart-label">Soreness</p>
            <canvas bind:this={sorenessCanvas}></canvas>
          </div>
          <div class="chart-wrap">
            <p class="chart-label">Missed Sessions</p>
            <canvas bind:this={missedCanvas}></canvas>
          </div>
          <div class="chart-wrap">
            <p class="chart-label">Sleep (hrs)</p>
            <canvas bind:this={sleepCanvas}></canvas>
          </div>
          <div class="chart-wrap">
            <p class="chart-label">Stress Level</p>
            <canvas bind:this={stressCanvas}></canvas>
          </div>
          {#if client?.show_bodyweight}
          <div class="chart-wrap">
            <div class="chart-label-row">
              <p class="chart-label">Body Weight</p>
              <div class="unit-toggle">
                {#each ['kg', 'lbs'] as u}
                  <button type="button" class="unit-btn" class:active={displayUnit === u}
                    on:click={() => switchDisplayUnit(u)}>{u}</button>
                {/each}
              </div>
            </div>
            <canvas bind:this={bodyweightCanvas}></canvas>
          </div>
          {/if}
        </div>
      </section>
      {/if}

      <!-- Check-ins -->
      <section>
        <div class="section-header checkin-section-header">
          <h2>Check-Ins
            <span class="count">{checkinSearch ? filteredCheckins.length + ' / ' : ''}{checkins.length}</span>
          </h2>
          {#if checkins.length > 0}
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
          {/if}
        </div>

        {#if checkins.length === 0}
          <p class="empty">No check-ins yet.</p>
        {:else}
          <div class="checkin-list">
            {#each filteredCheckins as c, i}
              <div class="checkin-card" class:search-active={checkinSearch && i === searchMatchIdx}>

                <!-- Card header -->
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
                      <span class="metric-value">{fmtWeight(c.bodyweight)}</span>
                    </div>
                  {/if}
                </div>

                <!-- Text fields -->
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
                    <div class="card-field card-field--full for-ryan">
                      <p class="field-label">For Me</p>
                      <p class="field-value">{@html highlight(c.for_ryan, checkinSearch)}</p>
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

  .top-bar-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

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

  .bw-toggle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    cursor: pointer;
    font-family: 'Halyard Display', sans-serif;
    font-size: 12px;
    font-weight: 600;
    color: var(--mid-grey);
    padding: 0;
    letter-spacing: 0.04em;
    transition: color 0.15s;
  }

  .bw-toggle.on { color: var(--black); }
  .bw-toggle:hover { color: var(--black); }

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
    top: 2px;
    left: 2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    transition: transform 0.2s;
  }

  .bw-toggle-track.on .bw-toggle-thumb { transform: translateX(14px); }

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

  /* Trends */
  .trends-section { margin-bottom: 40px; }

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

  .chart-label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .chart-label-row .chart-label { margin-bottom: 0; }

  .unit-toggle { display: flex; gap: 3px; }

  .unit-btn {
    background: none;
    border: 1.5px solid var(--light-grey);
    border-radius: 4px;
    font-family: 'Halyard Display', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--mid-grey);
    padding: 2px 7px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .unit-btn.active {
    background: var(--black);
    border-color: var(--black);
    color: var(--off-white);
  }

  .chart-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--mid-grey);
    margin-bottom: 12px;
  }

  .chart-wrap canvas {
    height: 160px !important;
  }

  /* Habit web comparison */
  .radars-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 28px;
  }

  @media (max-width: 700px) {
    .radars-row { grid-template-columns: 1fr; }
  }

  .radar-card {
    background: white;
    border: 1px solid var(--light-grey);
    border-radius: 8px;
    padding: 16px 18px;
  }

  .radar-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .radar-card-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--mid-grey);
    margin-bottom: 12px;
  }

  .radar-card-header .radar-card-label { margin-bottom: 0; }

  .checkin-count {
    font-size: 11px;
    font-weight: 600;
    color: var(--mid-grey);
  }

  .checkin-count.no-data { color: #E87878; }

  .period-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-bottom: 12px;
  }

  .period-chip {
    font-family: 'Halyard Display', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: none;
    border: 1.5px solid var(--light-grey);
    border-radius: 4px;
    color: var(--mid-grey);
    padding: 3px 9px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .period-chip:hover { border-color: var(--black); color: var(--black); }
  .period-chip.active { background: var(--black); border-color: var(--black); color: var(--off-white); }

  .date-range {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;
  }

  .date-range span { font-size: 12px; color: var(--mid-grey); }

  .date-range input[type="date"] {
    flex: 1;
    font-family: 'Halyard Display', sans-serif;
    font-size: 12px;
    padding: 5px 8px;
    border: 1.5px solid var(--light-grey);
    border-radius: 4px;
    background: var(--warm-white);
    color: var(--black);
    outline: none;
    transition: border-color 0.15s;
  }

  .date-range input[type="date"]:focus { border-color: var(--accent); }

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
    width: 100%;
    border: none;
    cursor: pointer;
    font-family: 'Halyard Display', sans-serif;
    text-align: left;
  }

  .card-header:hover { background: #1f2f45; }

  .card-header-left  { display: flex; align-items: center; gap: 10px; }
  .card-header-right { display: flex; align-items: center; gap: 10px; }

  .chevron {
    font-size: 22px;
    color: var(--accent);
    transition: transform 0.2s;
    display: inline-block;
    line-height: 1;
  }
  .chevron.open { transform: rotate(90deg); }

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
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 20px;
    border: 1.5px solid;
    white-space: nowrap;
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

  .disruption-flag {
    background: #fff8ec;
    border: 1px solid rgba(200,169,110,0.35);
    border-radius: 4px;
    padding: 8px 10px;
    margin-top: 4px;
    grid-column: 1 / -1;
  }

  .disruption-flag .field-label { color: var(--accent); }

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

  /* Archive */
  .btn-archive {
    font-family: 'Halyard Display', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--mid-grey);
    border: 1px solid var(--light-grey);
    border-radius: 4px;
    padding: 6px 14px;
    background: none;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-archive:hover { color: var(--error); border-color: var(--error); }

  .archive-confirm {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .archive-confirm-label {
    font-size: 13px;
    color: var(--mid-grey);
    white-space: nowrap;
  }

  .btn-archive-confirm {
    font-family: 'Halyard Display', sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--off-white);
    background: var(--error);
    border: none;
    border-radius: 4px;
    padding: 6px 14px;
    cursor: pointer;
    white-space: nowrap;
  }
  .btn-archive-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-cancel {
    font-family: 'Halyard Display', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--mid-grey);
    background: none;
    border: 1px solid var(--light-grey);
    border-radius: 4px;
    padding: 6px 14px;
    cursor: pointer;
    transition: border-color 0.15s;
  }
  .btn-cancel:hover { border-color: var(--black); color: var(--black); }
  .btn-cancel:disabled { opacity: 0.4; cursor: not-allowed; }

  .archive-error {
    font-size: 13px;
    color: var(--error);
    text-align: right;
    margin-top: -24px;
  }

  .prev-stint-link {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: var(--mid-grey);
    text-decoration: none;
    border-bottom: 1px dashed var(--light-grey);
    transition: color 0.15s;
  }
  .prev-stint-link:hover { color: var(--black); }

  .checkin-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

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

  /* Billing */
  .billing-section { margin-bottom: 40px; }

  .billing-title-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .test-mode-badge {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    background: #dc3545;
    color: white;
    padding: 2px 8px;
    border-radius: 20px;
  }

  .btn-test-mode {
    font-family: 'Halyard Display', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    background: none;
    border: 1.5px solid var(--light-grey);
    border-radius: 4px;
    padding: 5px 12px;
    color: var(--mid-grey);
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-test-mode:hover { border-color: #dc3545; color: #dc3545; }
  .btn-test-mode.active { background: #dc3545; border-color: #dc3545; color: white; }

  .billing-error {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    background: #fff2f2;
    border: 1px solid rgba(220, 53, 69, 0.3);
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 16px;
  }

  .billing-error-msg {
    font-size: 13px;
    color: var(--error);
    font-family: 'Courier New', monospace;
    line-height: 1.5;
    word-break: break-all;
  }

  .billing-error-dismiss {
    background: none;
    border: none;
    font-size: 14px;
    color: var(--mid-grey);
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    line-height: 1;
  }
  .billing-error-dismiss:hover { color: var(--error); }

  .billing-section .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .billing-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .link-form {
    background: var(--warm-white);
    border: 1px solid var(--light-grey);
    border-radius: 8px;
    padding: 18px;
    margin-bottom: 16px;
  }

  .link-form-row {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  .link-form-field {
    display: flex;
    flex-direction: column;
    gap: 5px;
    flex: 1;
    min-width: 160px;
  }

  .link-form-field--narrow { flex: 0 0 120px; }

  .link-form-field select {
    font-family: 'Halyard Display', sans-serif;
    font-size: 13px;
    padding: 7px 10px;
    border: 1.5px solid var(--light-grey);
    border-radius: 5px;
    background: white;
    color: var(--black);
    outline: none;
    transition: border-color 0.15s;
  }

  .link-form-field select:focus { border-color: var(--accent); }

  .products-loading {
    font-size: 13px;
    color: var(--mid-grey);
    padding: 4px 0;
  }

  .label-hint {
    font-size: 10px;
    font-weight: 400;
    letter-spacing: 0;
    text-transform: none;
    color: var(--mid-grey);
    margin-left: 4px;
  }

  .link-form-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .btn-primary {
    font-family: 'Halyard Display', sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    background: var(--black);
    color: var(--off-white);
    border: none;
    border-radius: 4px;
    padding: 7px 18px;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

  .link-error { font-size: 12px; color: var(--error); }

  .link-result {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 12px;
    background: white;
    border: 1px solid var(--light-grey);
    border-radius: 5px;
    padding: 8px 12px;
  }

  .link-url {
    font-size: 12px;
    color: var(--mid-grey);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .btn-copy {
    font-family: 'Halyard Display', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    background: none;
    border: 1px solid var(--light-grey);
    border-radius: 4px;
    padding: 4px 10px;
    cursor: pointer;
    color: var(--black);
    white-space: nowrap;
    transition: border-color 0.15s;
  }
  .btn-copy:hover { border-color: var(--black); }

  .payment-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .payment-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: white;
    border: 1px solid var(--light-grey);
    border-radius: 6px;
    gap: 12px;
  }

  .payment-main {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .payment-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--black);
  }

  .payment-type {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--mid-grey);
  }

  .payment-meta {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .payment-amount {
    font-size: 14px;
    font-weight: 700;
    color: var(--black);
  }

  .payment-renews {
    font-size: 12px;
    color: var(--mid-grey);
  }

  .payment-status {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 3px 9px;
    border-radius: 20px;
  }

  .payment-status.active   { background: #d4edda; color: var(--success); }
  .payment-status.trialing { background: #d4edda; color: var(--success); }
  .payment-status.past_due { background: #fff3cd; color: #856404; }
  .payment-status.canceled { background: var(--warm-white); color: var(--mid-grey); }
  .payment-status.succeeded { background: #d4edda; color: var(--success); }

  .payment-test-badge {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    background: #dc3545;
    color: white;
    padding: 2px 7px;
    border-radius: 20px;
  }
</style>
