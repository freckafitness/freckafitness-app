<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase.js';
  import Header from '$lib/Header.svelte';

  let clients = [];
  let prospects = [];
  let loading = true;

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { goto('/login'); return; }

    const { data: role } = await supabase.from('user_roles').select('role').single();
    if (role?.role !== 'coach') { goto('/my'); return; }

    await loadData();
  });

  async function loadData() {
    loading = true;

    const [{ data: clientData }, { data: prospectData }] = await Promise.all([
      supabase
        .from('clients')
        .select('id, first_name, last_name, email, status, created_at')
        .order('last_name'),
      supabase
        .from('intakes')
        .select('id, first_name, last_name, email, created_at')
        .is('client_id', null)
        .order('created_at', { ascending: false })
    ]);

    clients = clientData ?? [];
    prospects = prospectData ?? [];
    loading = false;
  }
</script>

<svelte:head><title>Dashboard — Frecka Fitness</title></svelte:head>

<div class="page">
  <Header />

  <main>
    {#if loading}
      <p class="loading">Loading…</p>
    {:else}

      <!-- Prospects -->
      {#if prospects.length > 0}
        <section>
          <div class="section-header">
            <p class="section-label">Prospects <span class="count">{prospects.length}</span></p>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Submitted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {#each prospects as p}
                  <tr>
                    <td class="name">{p.first_name} {p.last_name}</td>
                    <td class="muted">{p.email}</td>
                    <td class="muted">{new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td class="action-cell">
                      <a href="/dashboard/intake/{p.id}" class="btn-outline">View Intake</a>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </section>
      {/if}

      <!-- Active Clients -->
      <section>
        <div class="section-header">
          <p class="section-label">Clients <span class="count">{clients.length}</span></p>
        </div>

        {#if clients.length === 0}
          <p class="empty">No clients yet. Convert a prospect or add a client manually.</p>
        {:else}
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Since</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {#each clients as c}
                  <tr class="clickable" on:click={() => goto(`/dashboard/client/${c.id}`)}>
                    <td class="name">{c.first_name} {c.last_name}</td>
                    <td class="muted">{c.email}</td>
                    <td><span class="badge {c.status}">{c.status}</span></td>
                    <td class="muted">{new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td class="action-cell">→</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </section>

    {/if}
  </main>
</div>

<style>
  .page { min-height: 100vh; }

  main {
    max-width: 1000px;
    margin: 0 auto;
    padding: 48px 32px;
    display: flex;
    flex-direction: column;
    gap: 48px;
  }

  .loading { color: var(--mid-grey); }

  section { display: flex; flex-direction: column; gap: 16px; }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--light-grey);
    padding-bottom: 10px;
  }

  .section-label {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--black);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .count {
    background: var(--black);
    color: var(--off-white);
    font-size: 11px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 20px;
    letter-spacing: 0.05em;
  }

  .table-wrap {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th {
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--mid-grey);
    padding: 10px 14px;
    border-bottom: 1px solid var(--light-grey);
  }

  td {
    padding: 14px;
    font-size: 14px;
    color: var(--black);
    border-bottom: 1px solid var(--warm-white);
  }

  .name { font-weight: 600; }
  .muted { color: var(--mid-grey); }

  .action-cell {
    text-align: right;
    color: var(--mid-grey);
    font-size: 16px;
  }

  tr.clickable {
    cursor: pointer;
    transition: background 0.12s;
  }

  tr.clickable:hover td {
    background: var(--warm-white);
  }

  .badge {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 3px 10px;
    border-radius: 20px;
  }

  .badge.active {
    background: #d4edda;
    color: var(--success);
  }

  .badge.inactive {
    background: var(--warm-white);
    color: var(--mid-grey);
  }

  .btn-outline {
    font-family: 'Halyard Display', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--black);
    border: 1px solid var(--light-grey);
    border-radius: 4px;
    padding: 6px 12px;
    text-decoration: none;
    transition: border-color 0.15s;
    white-space: nowrap;
  }

  .btn-outline:hover { border-color: var(--black); }

  .empty {
    color: var(--mid-grey);
    font-size: 14px;
    padding: 24px 0;
  }
</style>
