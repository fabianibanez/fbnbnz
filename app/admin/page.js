import { createServerSupabase } from '../lib/supabase-server';
import { PROFILE_SLUG } from '../lib/supabase-browser';
import ProfileEditor from './ProfileEditor';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const supabase = await createServerSupabase();
  const { data: profile } = await supabase.from('profiles').select('*').eq('slug', PROFILE_SLUG).single();
  const { data: buttons } = await supabase.from('contact_buttons').select('*').eq('profile_id', profile.id).order('position');
  return <ProfileEditor profile={profile} initialButtons={buttons || []} />;
}
