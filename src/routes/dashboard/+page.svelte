<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase.js';
  import Header from '$lib/Header.svelte';

  let clients = [];
  let archivedClients = [];
  let prospects = [];
  let loading = true;
  let archivedOpen = false;

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { goto('/login'); return; }

    const { data: role } = await supabase.from('user_roles').select('role').single();
    if (role?.role !== 'coach') { goto('/my'); return; }

    await loadData();
  });

  async function loadData() {
    loading = true;

    const [{ data: clientData }, { data: archivedData }, { data: prospectData }] = await Promise.all([
      supabase
        .from('clients')
        .select('id, first_name, last_name, email, status, created_at, intakes(id)')
        .eq('status', 'active')
        .order('last_name'),
      supabase
        .from('clients')
        .select('id, first_name, last_name, email, status, created_at, intakes(id)')
        .eq('status', 'inactive')
        .order('last_name'),
      supabase
        .from('intakes')
        .select('id, first_name, last_name, email, created_at')
        .is('client_id', null)
        .order('created_at', { ascending: false })
    ]);

    clients = clientData ?? [];
    archivedClients = archivedData ?? [];
    prospects = prospectData ?? [];
    loading = false;
  }
</script>

<svelte:head><title>Dashboard — Frecka Fitness</title></svelte:head>

<div class="page">
  <Header />

  <main>
    <div class="toolbar">
      <a href="/my/checkin?preview=true" class="btn-preview">Preview Check-in Form</a>
    </div>

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
          <p class="empty">No clients yet. Convert a prospect to get started.</p>
        {:else}
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Since</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {#each clients as c}
                  <tr class="clickable" on:click={() => goto(`/dashboard/client/${c.id}`)}>
                    <td class="name">{c.first_name} {c.last_name}</td>
                    <td class="muted">{c.email}</td>
                    <td class="muted">{new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td class="action-cell">
                      {#if c.intakes?.[0]}
                        <a href="/dashboard/intake/{c.intakes[0].id}" class="btn-outline" on:click|stopPropagation>View Intake</a>
                      {:else}
                        →
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </section>

      <!-- Archived Clients -->
      {#if archivedClients.length > 0}
        <section>
          <button type="button" class="section-header archived-toggle" on:click={() => archivedOpen = !archivedOpen}>
            <p class="section-label">Archived <span class="count count--muted">{archivedClients.length}</span></p>
            <span class="chevron" class:open={archivedOpen}>›</span>
          </button>

          {#if archivedOpen}
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Since</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {#each archivedClients as c}
                    <tr class="clickable archived-row" on:click={() => goto(`/dashboard/client/${c.id}`)}>
                      <td class="name muted">{c.first_name} {c.last_name}</td>
                      <td class="muted">{c.email}</td>
                      <td class="muted">{new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td class="action-cell">
                        {#if c.intakes?.[0]}
                          <a href="/dashboard/intake/{c.intakes[0].id}" class="btn-outline" on:click|stopPropagation>View Intake</a>
                        {:else}
                          →
                        {/if}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </section>
      {/if}

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

  .toolbar {
    display: flex;
    justify-content: flex-end;
    padding-bottom: 8px;
  }

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

  .btn-preview {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--mid-grey);
    text-decoration: none;
    border: 1px solid var(--light-grey);
    border-radius: 4px;
    padding: 5px 12px;
    transition: all 0.15s;
  }

  .btn-preview:hover { color: var(--black); border-color: var(--black); }

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

  .archived-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    background: none;
    border: none;
    border-bottom: 1px solid var(--light-grey);
    padding-bottom: 10px;
    cursor: pointer;
    font-family: 'Halyard Display', sans-serif;
    text-align: left;
  }

  .count--muted {
    background: var(--light-grey);
    color: var(--mid-grey);
  }

  .chevron {
    font-size: 20px;
    color: var(--mid-grey);
    transition: transform 0.2s;
    display: inline-block;
    line-height: 1;
  }
  .chevron.open { transform: rotate(90deg); }

  .archived-row td { opacity: 0.6; }
  .archived-row:hover td { opacity: 1; }
</style>
