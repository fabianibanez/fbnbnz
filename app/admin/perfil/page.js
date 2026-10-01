import { createServerSupabase } from '../../lib/supabase-server';
import { createSupabase, PROFILE_SLUG } from '../../lib/supabase';
import PerfilClient from './PerfilClient';

export const dynamic = 'force-dynamic';

export default async function PerfilPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const pub = createSupabase();
  const { data: profile } = await pub.from('profiles').select('*').eq('slug', PROFILE_SLUG).single();
  if (!profile) return null;
  const { data: buttons } = await pub.from('contact_buttons').select('*').eq('profile_id', profile.id).order('position');
  return <PerfilClient profile={profile} initialButtons={buttons || []} />;
}
