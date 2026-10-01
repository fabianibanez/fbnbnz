import './admin.css';
import { createServerSupabase } from '../lib/supabase-server';
import { redirect } from 'next/navigation';
import AdminShell from './AdminShell';
import { PROFILE_SLUG } from '../lib/supabase-browser';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  // Si no hay sesión, el middleware ya redirige; esto es un respaldo.
  if (!user) return children;

  const { data: profile } = await supabase.from('profiles').select('name, slug').eq('slug', PROFILE_SLUG).single();

  return <AdminShell email={user.email} name={profile?.name || 'Mi página'}>{children}</AdminShell>;
}
