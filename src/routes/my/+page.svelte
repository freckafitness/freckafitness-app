<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { supabase } from '$lib/supabase.js';
  import Header from '$lib/Header.svelte';

  let client = null;
  let checkinDone = false;

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { goto('/login'); return; }

    const { data: role } = await supabase.from('user_roles').select('role').single();
    if (role?.role === 'coach') { goto('/dashboard'); return; }

    const { data } = await supabase
      .from('clients')
      .select('first_name, last_name')
      .eq('auth_user_id', (await supabase.auth.getUser()).data.user.id)
      .single();
    client = data;

    checkinDone = $page.url.searchParams.get('checkin') === 'done';
  });
</script>

<svelte:head><title>My Portal — Frecka Fitness</title></svelte:head>

<div class="page">
  <Header />
  <main>
    <p class="eyebrow">Client Portal</p>
    <h1>Welcome{client ? `, ${client.first_name}` : ''}</h1>

    {#if checkinDone}
      <div class="success-banner">
        Check-in submitted — Ryan will review and respond before next week.
      </div>
    {/if}

    <div class="actions">
      <a href="/my/checkin" class="btn-primary">Submit Weekly Check-In</a>
    </div>

    <p class="coming-soon">Your check-in history and progress charts coming soon.</p>
  </main>
</div>

<style>
  .page { min-height: 100vh; }

  main { max-width: 680px; margin: 0 auto; padding: 48px 32px; }

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

  .actions { margin-bottom: 32px; }

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

  .coming-soon { color: var(--mid-grey); font-size: 14px; }
</style>
