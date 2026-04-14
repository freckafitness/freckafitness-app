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
      <p class="eyebrow">Client Portal</p>
      <p class="wordmark">FRECKA FITNESS</p>
    </div>

    <form on:submit={handleLogin}>
      <div class="field">
        <label for="email">Email <span class="req">*</span></label>
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
        <label for="password">Password <span class="req">*</span></label>
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
  .page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .card {
    background: var(--black);
    border-radius: 16px;
    padding: 3rem 2.5rem;
    width: 100%;
    max-width: 420px;
  }

  .brand {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 10px;
  }

  .wordmark {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 0.2em;
    color: var(--off-white);
    text-transform: uppercase;
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
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--light-grey);
  }

  .req { color: var(--accent); }

  input {
    width: 100%;
    background: var(--warm-white);
    border: 1.5px solid transparent;
    border-radius: 6px;
    color: var(--black);
    font-family: 'Halyard Display', sans-serif;
    font-size: 15px;
    padding: 13px 16px;
    outline: none;
    transition: border-color 0.15s;
  }

  input:focus {
    border-color: var(--accent);
  }

  input::placeholder {
    color: var(--light-grey);
  }

  .error {
    font-size: 13px;
    color: #e07070;
  }

  button {
    background: var(--accent);
    color: var(--black);
    border: none;
    border-radius: 6px;
    font-family: 'Halyard Display', sans-serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 15px;
    cursor: pointer;
    transition: background 0.15s;
    margin-top: 0.5rem;
  }

  button:hover:not(:disabled) {
    background: var(--accent-dark);
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
