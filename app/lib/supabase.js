import { createClient } from '@supabase/supabase-js';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export function createSupabase() {
  return createClient(url, anonKey, { auth: { persistSession: false } });
}
export const PROFILE_SLUG = 'fabian';
