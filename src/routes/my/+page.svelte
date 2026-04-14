<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase.js';

  let client = null;

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
  });

  async function signOut() {
    await supabase.auth.signOut();
    goto('/login');
  }
</script>

<svelte:head><title>My Profile — Frecka Fitness</title></svelte:head>

<div class="page">
  <header>
    <span class="wordmark">FRECKA FITNESS</span>
    <button on:click={signOut}>Sign out</button>
  </header>
  <main>
    <h1>Welcome{client ? `, ${client.first_name}` : ''}</h1>
    <p>Your check-ins and progress coming soon.</p>
  </main>
</div>

<style>
  :global(body) { background: #0d0d0d; color: #fff; font-family: 'Inter', system-ui, sans-serif; margin: 0; }
  .page { min-height: 100vh; }
  header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 2rem; border-bottom: 1px solid #2a2a2a; }
  .wordmark { font-size: 0.85rem; font-weight: 800; letter-spacing: 0.2em; color: #fff; }
  button { background: none; border: 1px solid #333; color: #888; font-size: 0.8rem; padding: 0.4rem 0.9rem; border-radius: 6px; cursor: pointer; }
  button:hover { border-color: #555; color: #fff; }
  main { padding: 3rem 2rem; }
  h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
  p { color: #666; }
</style>
