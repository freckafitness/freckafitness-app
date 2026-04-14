import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://uftthvphkmccerergxup.supabase.co';
const SUPABASE_ANON = 'sb_publishable_TkYdMrUsU_XEevuHix1nmg_F2oYVPl7';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
