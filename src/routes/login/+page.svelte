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
      <img src="/Logo/frecka-01.svg" alt="Frecka Fitness" class="logo" />
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

      <div class="submit-wrap">
        <button type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  .page {
    background: var(--black);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .card {
    background: var(--off-white);
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
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 10px;
  }

  .logo {
    width: 100%;
    max-width: 260px;
    height: auto;
    display: block;
    margin: 0 auto;
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
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--black);
  }

  .req { color: var(--accent); }

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
    color: var(--mid-grey);
  }

  .error {
    font-size: 13px;
    color: var(--error);
  }

  .submit-wrap {
    margin-top: 8px;
    display: flex;
    justify-content: center;
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
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    width: 100%;
    position: relative;
    overflow: hidden;
    transition: background 0.18s, transform 0.12s;
  }

  button[type="submit"]:hover:not(:disabled) {
    background: #1f2e44;
  }

  button[type="submit"]:active:not(:disabled) {
    transform: scale(0.98);
  }

  button[type="submit"]::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--accent);
  }

  button[type="submit"]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
