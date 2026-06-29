import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://uftthvphkmccerergxup.supabase.co';
const SUPABASE_ANON = 'sb_publishable_TkYdMrUsU_XEevuHix1nmg_F2oYVPl7';

// Reads from both storages (localStorage first) for backward compatibility.
// Writes to localStorage when remembered, sessionStorage when not.
// Defaults to remembered when flag is absent (preserves existing sessions).
const adaptiveStorage = {
  getItem(key) {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  },
  setItem(key, value) {
    const remember = localStorage.getItem('ff_remember_me') !== 'false';
    if (remember) {
      localStorage.setItem(key, value);
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, value);
      localStorage.removeItem(key);
    }
  },
  removeItem(key) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage: adaptiveStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
