import { createServerSupabase } from '../../lib/supabase-server';
import { createSupabase, PROFILE_SLUG } from '../../lib/supabase';
import ResumenClient from './ResumenClient';

export const dynamic = 'force-dynamic';

export default async function ResumenPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  const pub = createSupabase();
  const { data: profile } = await pub.from('profiles').select('id, ga_id, ga_enabled').eq('slug', PROFILE_SLUG).single();
  if (!profile) return null;

  const pid = profile.id;
  const now = Date.now();
  const since90 = new Date(now - 90 * 864e5).toISOString();

  const [eventsRes, linksRes, actionsRes, servicesRes, subsRes, artsRes] = await Promise.all([
    pub.from('events').select('type, object_id, source, device, created_at').eq('profile_id', pid).gte('created_at', since90).order('created_at', { ascending: true }),
    pub.from('links').select('id, title, effect, visible').eq('profile_id', pid).order('position'),
    pub.from('contact_buttons').select('id, label, type, highlighted').eq('profile_id', pid).order('position'),
    pub.from('services').select('id, title').eq('profile_id', pid).order('position'),
    pub.from('subscribers').select('id, status, created_at').eq('profile_id', pid),
    pub.from('articles').select('id, title, status').eq('profile_id', pid).eq('status', 'publicado'),
  ]);

  return (
    <ResumenClient
      events={eventsRes.data || []}
      links={linksRes.data || []}
      actions={actionsRes.data || []}
      services={servicesRes.data || []}
      subs={subsRes.data || []}
      arts={artsRes.data || []}
      gaId={profile.ga_id}
      gaOn={profile.ga_enabled}
    />
  );
}
