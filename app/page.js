import { createSupabase, PROFILE_SLUG } from './lib/supabase';
import PublicPage from './PublicPage';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = createSupabase();

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('slug', PROFILE_SLUG).single();

  if (!profile) {
    return (
      <main className="page">
        <p style={{ padding: 40, color: '#9AA3AF' }}>
          Aún no hay una página publicada.
        </p>
      </main>
    );
  }

  const pid = profile.id;
  const [buttons, links, services, sections, articles] = await Promise.all([
    supabase.from('contact_buttons').select('*').eq('profile_id', pid).order('position'),
    supabase.from('links').select('*').eq('profile_id', pid).eq('visible', true).order('position'),
    supabase.from('services').select('*').eq('profile_id', pid).order('position'),
    supabase.from('sections').select('*').eq('profile_id', pid),
    supabase.from('articles').select('id, slug, title, excerpt, category, cover_url, body, published_at')
      .eq('profile_id', pid).eq('status', 'publicado').order('published_at', { ascending: false }),
  ]);

  const sectionsMap = {};
  (sections.data || []).forEach((s) => { sectionsMap[s.key] = s; });

  return (
    <PublicPage
      profile={profile}
      buttons={buttons.data || []}
      links={links.data || []}
      services={services.data || []}
      sections={sectionsMap}
      articles={articles.data || []}
    />
  );
}
