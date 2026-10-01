import { createServerSupabase } from '../../lib/supabase-server';
import { PROFILE_SLUG } from '../../lib/supabase-browser';
import ServicesEditor from './ServicesEditor';

export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  const supabase = await createServerSupabase();
  const { data: profile } = await supabase.from('profiles').select('id').eq('slug', PROFILE_SLUG).single();
  const [{ data: services }, { data: sections }] = await Promise.all([
    supabase.from('services').select('*').eq('profile_id', profile.id).order('position'),
    supabase.from('sections').select('*').eq('profile_id', profile.id).eq('key', 'services'),
  ]);
  return <ServicesEditor profileId={profile.id} initial={services || []} section={(sections || [])[0] || null} />;
}
