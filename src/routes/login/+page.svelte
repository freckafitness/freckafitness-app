<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase.js';

  let email = '';
  let password = '';
  let error = '';
  let loading = false;
  let rememberMe = true;

  let showReset = false;
  let resetEmail = '';
  let resetSent = false;
  let resetError = '';
  let resetLoading = false;

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) redirectByRole();
  });

  async function redirectByRole() {
    const { data } = await supabase.from('user_roles').select('role').single();
    if (data?.role === 'coach') goto('/dashboard');
    else goto('/my');
  }

  async function handleReset(e) {
    e.preventDefault();
    resetError = '';
    resetLoading = true;
    const { error: err } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: 'https://app.freckafitness.com/set-password?reset=true',
    });
    resetLoading = false;
    if (err) { resetError = 'Could not send reset email. Please try again.'; return; }
    resetSent = true;
  }

  async function handleLogin(e) {
    e.preventDefault();
    error = '';
    loading = true;

    // Set preference before sign-in so the storage adapter knows where to persist the session
    localStorage.setItem('ff_remember_me', rememberMe ? 'true' : 'false');

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
      <img src="/Logo/frecka-01.svg" alt="Frecka Fitness" class="logo" />
      <p class="eyebrow">Client Portal</p>
    </div>

    {#if showReset}
      {#if resetSent}
        <p class="intro">Check your email for a password reset link.</p>
        <button type="button" class="back-link" on:click={() => { showReset = false; resetSent = false; resetEmail = ''; }}>← Back to sign in</button>
      {:else}
        <p class="intro">Enter your email and we'll send a reset link.</p>
        <form on:submit={handleReset}>
          <div class="field">
            <label for="resetEmail">Email <span class="req">*</span></label>
            <input id="resetEmail" type="email" bind:value={resetEmail} placeholder="you@example.com" autocomplete="email" required />
          </div>
          {#if resetError}<p class="error">{resetError}</p>{/if}
          <div class="submit-wrap">
            <button type="submit" disabled={resetLoading}>{resetLoading ? 'Sending…' : 'Send Reset Link'}</button>
          </div>
        </form>
        <button type="button" class="back-link" on:click={() => { showReset = false; resetError = ''; }}>← Back to sign in</button>
      {/if}
    {:else}
      <form on:submit={handleLogin}>
        <div class="field">
          <label for="email">Email <span class="req">*</span></label>
          <input id="email" type="email" bind:value={email} placeholder="you@example.com" autocomplete="email" required />
        </div>

        <div class="field">
          <label for="password">Password <span class="req">*</span></label>
          <input id="password" type="password" bind:value={password} placeholder="••••••••" autocomplete="current-password" required />
        </div>

        {#if error}<p class="error">{error}</p>{/if}

        <label class="remember">
          <input type="checkbox" bind:checked={rememberMe} />
          Remember me on this device
        </label>

        <div class="submit-wrap">
          <button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</button>
        </div>
      </form>
      <button type="button" class="back-link" on:click={() => { showReset = true; error = ''; }}>Forgot password?</button>
    {/if}
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
    color: var(--black);
    margin-top: 12px;
    margin-bottom: 0;
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

  .intro {
    font-size: 14px;
    color: var(--mid-grey);
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .back-link {
    display: block;
    background: none;
    border: none;
    color: var(--mid-grey);
    font-family: 'Halyard Display', sans-serif;
    font-size: 13px;
    font-weight: 500;
    text-align: center;
    cursor: pointer;
    margin-top: 1.25rem;
    width: 100%;
    padding: 0;
    transition: color 0.15s;
  }

  .back-link:hover { color: var(--black); }

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

  .remember {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 13px;
    font-weight: 500;
    color: var(--black);
    opacity: 0.55;
    cursor: pointer;
    user-select: none;
  }

  .remember input[type="checkbox"] {
    width: 16px;
    height: 16px;
    min-width: 16px;
    border: 1.5px solid var(--light-grey);
    border-radius: 3px;
    background: var(--warm-white);
    padding: 0;
    accent-color: var(--black);
    cursor: pointer;
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
