import '../../globals.css';
import { createSupabase, PROFILE_SLUG } from '../../lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Article({ params }) {
  const { slug } = await params;
  const supabase = createSupabase();
  const { data: profile } = await supabase.from('profiles').select('id, name').eq('slug', PROFILE_SLUG).single();
  if (!profile) notFound();
  const { data: a } = await supabase.from('articles').select('*').eq('profile_id', profile.id).eq('slug', slug).eq('status', 'publicado').single();
  if (!a) notFound();
  return (
    <main className="page">
      <div style={{ padding: '16px 12px' }}>
        <Link href="/" style={{ color: '#3F2FEE', fontWeight: 700, textDecoration: 'none' }}>← {profile.name}</Link>
      </div>
      <article style={{ padding: '0 20px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {a.cover_url ? <img src={a.cover_url} alt="" style={{ borderRadius: 20, aspectRatio: '16/9', objectFit: 'cover' }} /> : null}
        <span style={{ fontSize: 12, color: '#9AA3AF' }}>{a.category || 'Artículo'}</span>
        <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.1, letterSpacing: '-.03em' }}>{a.title}</h1>
        {a.excerpt ? <p style={{ margin: 0, fontSize: 18, color: '#9AA3AF', lineHeight: 1.45 }}>{a.excerpt}</p> : null}
        <div style={{ fontSize: 17, lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: a.body || '' }} />
      </article>
    </main>
  );
}
