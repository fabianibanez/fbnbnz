// Cliente de Supabase para el navegador (con sesión guardada).
import { createBrowserClient } from '@supabase/ssr';

export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export const OWNER_EMAIL = 'fabian.ibanez@gmail.com';
export const PROFILE_SLUG = 'fabian';
