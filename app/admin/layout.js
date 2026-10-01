import './admin.css';
import { createServerSupabase } from '../lib/supabase-server';
import AdminShell from './AdminShell';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return children;
  return <AdminShell email={user.email}>{children}</AdminShell>;
}
