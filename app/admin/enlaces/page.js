import { createServerSupabase } from '../../lib/supabase-server';
import { createSupabase, PROFILE_SLUG } from '../../lib/supabase';
import EnlacesClient from './EnlacesClient';

export const dynamic = 'force-dynamic';

export default async function EnlacesPage() {
  const pub = createSupabase();
  const { data: profile } = await pub.from('profiles').select('id').eq('slug', PROFILE_SLUG).single();
  if (!profile) return null;
  const { data: links } = await pub.from('links').select('*').eq('profile_id', profile.id).order('position');
  return <EnlacesClient profileId={profile.id} initial={links || []} />;
}
