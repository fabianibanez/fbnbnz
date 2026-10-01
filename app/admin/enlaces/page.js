import { createServerSupabase } from '../../lib/supabase-server';
import { PROFILE_SLUG } from '../../lib/supabase-browser';
import LinksEditor from './LinksEditor';

export const dynamic = 'force-dynamic';

export default async function LinksPage() {
  const supabase = await createServerSupabase();
  const { data: profile } = await supabase.from('profiles').select('id').eq('slug', PROFILE_SLUG).single();
  const { data: links } = await supabase.from('links').select('*').eq('profile_id', profile.id).order('position');
  return <LinksEditor profileId={profile.id} initial={links || []} />;
}
