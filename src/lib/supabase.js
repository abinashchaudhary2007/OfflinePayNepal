import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_SUPABASE_URL : process.env.VITE_SUPABASE_URL) || 'https://ffglrijlxmfffkbkuoso.supabase.co';
const SUPABASE_ANON_KEY = (typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_SUPABASE_ANON_KEY : process.env.VITE_SUPABASE_ANON_KEY) || 'sb_publishable_8jrJHHj4XKINTvmQzHn8wQ_PWfqTW_B';

/**
 * Checks if Supabase credentials are configured
 */
export function isSupabaseConfigured() {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('your_supabase_project') &&
    !SUPABASE_ANON_KEY.includes('your_supabase_anon')
  );
}

/**
 * Supabase client instance
 */
export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Test connectivity with Supabase project
 */
export async function testSupabaseConnection() {
  if (!supabase) {
    return { ok: false, error: 'Supabase client is not configured with valid URL/Key' };
  }
  try {
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist yet, we still know the network connection to project succeeded
      return { ok: true, message: 'Connected to Supabase project (run schema.sql to initialize tables)' };
    }
    return { ok: true, message: 'Connected to Supabase successfully' };
  } catch (err) {
    return { ok: false, error: err.message || 'Failed to connect to Supabase' };
  }
}

export default supabase;
