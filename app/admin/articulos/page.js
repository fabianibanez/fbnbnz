import { createServerSupabase } from '../../lib/supabase-server';
import { PROFILE_SLUG } from '../../lib/supabase-browser';
import ArticlesEditor from './ArticlesEditor';

export const dynamic = 'force-dynamic';

export default async function ArticlesPage() {
  const supabase = await createServerSupabase();
  const { data: profile } = await supabase.from('profiles').select('id').eq('slug', PROFILE_SLUG).single();
  const { data: articles } = await supabase.from('articles').select('*').eq('profile_id', profile.id).order('created_at', { ascending: false });
  return <ArticlesEditor profileId={profile.id} initial={articles || []} />;
}
