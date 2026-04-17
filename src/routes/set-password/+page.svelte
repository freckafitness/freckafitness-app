<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase.js';

  let password = '';
  let confirm = '';
  let error = '';
  let saving = false;
  let loading = true;

  onMount(async () => {
    // Give the Supabase client a tick to process the hash tokens from the invite link
    await new Promise(r => setTimeout(r, 100));
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      goto('/login');
      return;
    }
    loading = false;
  });

  async function handleSubmit(e) {
    e.preventDefault();
    error = '';

    if (password.length < 8) {
      error = 'Password must be at least 8 characters.';
      return;
    }
    if (password !== confirm) {
      error = 'Passwords do not match.';
      return;
    }

    saving = true;
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      error = updateError.message;
      saving = false;
      return;
    }

    goto('/my');
  }
</script>

<svelte:head>
  <title>Set Your Password — Frecka Fitness</title>
</svelte:head>

<div class="page">
  <div class="card">
    <div class="brand">
      <img src="/Logo/frecka-01.svg" alt="Frecka Fitness" class="logo" />
      <p class="eyebrow">Set Password</p>
    </div>

    {#if loading}
      <p class="status">Setting up your account…</p>
    {:else}
      <p class="intro">Choose a password for your Frecka Fitness account.</p>

      <form on:submit={handleSubmit}>
        <div class="field">
          <label for="password">Password <span class="req">*</span></label>
          <input
            id="password"
            type="password"
            bind:value={password}
            placeholder="At least 8 characters"
            autocomplete="new-password"
            required
          />
        </div>

        <div class="field">
          <label for="confirm">Confirm Password <span class="req">*</span></label>
          <input
            id="confirm"
            type="password"
            bind:value={confirm}
            placeholder="••••••••"
            autocomplete="new-password"
            required
          />
        </div>

        {#if error}
          <p class="error">{error}</p>
        {/if}

        <div class="submit-wrap">
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Set Password'}
          </button>
        </div>
      </form>
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

  .intro {
    font-size: 14px;
    color: var(--mid-grey);
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .status {
    font-size: 14px;
    color: var(--mid-grey);
    text-align: center;
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
