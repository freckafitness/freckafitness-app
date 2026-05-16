<script>
  import { supabase } from '$lib/supabase.js';
  import { goto } from '$app/navigation';

  export let showPortal = false;

  let portalLoading = false;
  let portalError   = '';

  async function signOut() {
    await supabase.auth.signOut();
    goto('/login');
  }

  async function openPortal() {
    portalLoading = true;
    portalError   = '';
    const { data, error } = await supabase.functions.invoke('create-portal-session');
    portalLoading = false;
    if (data?.url) {
      window.location.href = data.url;
    } else {
      portalError = data?.error ?? error?.message ?? 'Could not open portal';
    }
  }
</script>

<header>
  <img src="/Logo/Frecka-02.svg" alt="Frecka Fitness" class="logo" />
  <div class="nav-actions">
    {#if showPortal}
      <div class="portal-wrap">
        <button class="btn-portal" on:click={openPortal} disabled={portalLoading}>
          {portalLoading ? 'Opening…' : 'Billing Portal'}
        </button>
        {#if portalError}<span class="portal-error">{portalError}</span>{/if}
      </div>
    {/if}
    <button class="btn-signout" on:click={signOut}>Sign Out</button>
  </div>
</header>

<style>
  header {
    background: var(--black);
    padding: 16px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo {
    height: 28px;
    width: auto;
    display: block;
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .btn-signout {
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

  .btn-signout:hover {
    border-color: var(--off-white);
  }

  .btn-portal {
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

  .btn-portal:hover:not(:disabled) {
    border-color: var(--off-white);
  }

  .btn-portal:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .portal-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .portal-error {
    font-size: 11px;
    color: #E87878;
    white-space: nowrap;
  }
</style>
