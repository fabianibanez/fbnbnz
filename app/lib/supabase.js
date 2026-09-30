// Conexión a Supabase para leer los datos públicos de la página.
// Usa la clave pública (anon); es segura porque las reglas de la base
// solo dejan leer lo que debe verse en la página.
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createSupabase() {
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

// El slug del perfil que se muestra en la página. Con un solo usuario
// (Fabián) es 'fabian'. Cuando el proyecto sea multiusuario, esto vendría
// del dominio o de la URL.
export const PROFILE_SLUG = 'fabian';
