<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase.js';

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { goto('/login'); return; }

    const { data } = await supabase.from('user_roles').select('role').single();
    if (data?.role === 'coach') goto('/dashboard');
    else goto('/my');
  });
</script>
