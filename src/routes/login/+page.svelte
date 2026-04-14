<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase.js';

  let email = '';
  let password = '';
  let error = '';
  let loading = false;

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) redirectByRole();
  });

  async function redirectByRole() {
    const { data } = await supabase.from('user_roles').select('role').single();
    if (data?.role === 'coach') goto('/dashboard');
    else goto('/my');
  }

  async function handleLogin(e) {
    e.preventDefault();
    error = '';
    loading = true;

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      error = 'Invalid email or password.';
      loading = false;
      return;
    }

    await redirectByRole();
  }
</script>

<svelte:head>
  <title>Frecka Fitness</title>
</svelte:head>

<div class="page">
  <div class="card">
    <div class="brand">
      <span class="wordmark">FRECKA</span>
      <span class="sub">FITNESS</span>
    </div>

    <form on:submit={handleLogin}>
      <div class="field">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          bind:value={email}
          placeholder="you@example.com"
          autocomplete="email"
          required
        />
      </div>

      <div class="field">
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          placeholder="••••••••"
          autocomplete="current-password"
          required
        />
      </div>

      {#if error}
        <p class="error">{error}</p>
      {/if}

      <button type="submit" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  </div>
</div>

<style>
  :global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(body) { background: #0d0d0d; font-family: 'Inter', system-ui, sans-serif; }

  .page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }

  .card {
    width: 100%;
    max-width: 380px;
    background: #161616;
    border: 1px solid #2a2a2a;
    border-radius: 12px;
    padding: 2.5rem 2rem;
  }

  .brand {
    text-align: center;
    margin-bottom: 2rem;
  }

  .wordmark {
    display: block;
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: 0.15em;
    color: #ffffff;
  }

  .sub {
    display: block;
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.3em;
    color: #666;
    margin-top: 0.1rem;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  label {
    font-size: 0.8rem;
    font-weight: 500;
    color: #888;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  input {
    background: #0d0d0d;
    border: 1px solid #2a2a2a;
    border-radius: 8px;
    color: #fff;
    font-size: 0.95rem;
    padding: 0.7rem 0.9rem;
    outline: none;
    transition: border-color 0.15s;
  }

  input:focus {
    border-color: #555;
  }

  input::placeholder {
    color: #444;
  }

  .error {
    font-size: 0.85rem;
    color: #e05555;
    text-align: center;
  }

  button {
    background: #ffffff;
    color: #0d0d0d;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    padding: 0.75rem;
    cursor: pointer;
    transition: opacity 0.15s;
    margin-top: 0.25rem;
  }

  button:hover:not(:disabled) {
    opacity: 0.88;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
