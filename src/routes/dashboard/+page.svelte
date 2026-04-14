<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase.js';
  import Header from '$lib/Header.svelte';

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { goto('/login'); return; }

    const { data } = await supabase.from('user_roles').select('role').single();
    if (data?.role !== 'coach') goto('/my');
  });
</script>

<svelte:head><title>Dashboard — Frecka Fitness</title></svelte:head>

<div class="page">
  <Header />
  <main>
    <p class="eyebrow">Coach View</p>
    <h1>Dashboard</h1>
    <p class="sub">Client roster coming soon.</p>
  </main>
</div>

<style>
  .page { min-height: 100vh; }

  header {
    background: var(--black);
    padding: 20px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .wordmark {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.2em;
    color: var(--off-white);
  }

  button {
    background: none;
    border: 1px solid rgba(224,224,219,0.3);
    color: var(--off-white);
    font-family: 'Halyard Display', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    transition: border-color 0.15s;
  }

  button:hover { border-color: var(--off-white); }

  main { padding: 48px 40px; }

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
    margin-bottom: 8px;
  }

  .sub { color: var(--mid-grey); font-size: 15px; }
</style>
