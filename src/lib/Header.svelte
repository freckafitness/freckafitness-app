<script>
  import { supabase } from '$lib/supabase.js';
  import { goto } from '$app/navigation';

  async function signOut() {
    await supabase.auth.signOut();
    goto('/login');
  }
</script>

<header>
  <img src="/Logo/Frecka-02.svg" alt="Frecka Fitness" class="logo" />
  <button on:click={signOut}>Sign Out</button>
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

  button:hover {
    border-color: var(--off-white);
  }
</style>
