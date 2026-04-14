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
  <header>
    <span class="wordmark">FRECKA FITNESS</span>
  </header>

  <div class="hero">
    <p class="eyebrow">Client Portal</p>
    <h1>Sign In</h1>
  </div>

  <div class="form-wrap">
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
    flex-direction: column;
  }

  header {
    background: var(--black);
    padding: 28px 40px;
  }

  .wordmark {
    font-family: 'Halyard Display', sans-serif;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.2em;
    color: var(--off-white);
    text-transform: uppercase;
  }

  .hero {
    background: var(--black);
    color: var(--off-white);
    text-align: center;
    padding: 56px 24px 48px;
  }

  .eyebrow {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 12px;
  }

  .hero h1 {
    font-size: clamp(32px, 6vw, 52px);
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  .form-wrap {
    max-width: 480px;
    width: 100%;
    margin: 48px auto;
    padding: 0 24px;
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
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--mid-grey);
  }

  .req {
    color: var(--accent);
  }

  input {
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

  input:focus {
    border-color: var(--black);
  }

  input::placeholder {
    color: var(--light-grey);
  }

  .error {
    font-size: 13px;
    color: var(--error);
  }

  button {
    background: var(--black);
    color: var(--off-white);
    border: none;
    border-radius: 6px;
    font-family: 'Halyard Display', sans-serif;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.1em;
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
