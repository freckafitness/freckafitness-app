<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { supabase } from '$lib/supabase.js';
  import Header from '$lib/Header.svelte';

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { goto('/login'); return; }
    const { data } = await supabase.from('user_roles').select('role').single();
    if (data?.role !== 'coach') goto('/my');
  });
</script>

<svelte:head><title>Client — Frecka Fitness</title></svelte:head>

<div class="page">
  <Header />
  <main>
    <a href="/dashboard" class="back">← Back to roster</a>
    <p class="coming-soon">Client detail view coming soon.</p>
  </main>
</div>

<style>
  .page { min-height: 100vh; }
  main { max-width: 1000px; margin: 0 auto; padding: 48px 32px; }
  .back { font-size: 13px; font-weight: 600; color: var(--mid-grey); text-decoration: none; letter-spacing: 0.05em; }
  .back:hover { color: var(--black); }
  .coming-soon { color: var(--mid-grey); margin-top: 32px; }
</style>
