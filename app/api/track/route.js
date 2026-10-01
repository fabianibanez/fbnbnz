// Recibe clics y suscripciones desde la página pública y los guarda en
// Supabase usando la clave secreta (solo en el servidor, nunca en el navegador).
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROFILE_SLUG = 'fabian';

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

const EVENTS = ['page_view', 'click_link', 'click_load_more', 'click_action', 'click_service', 'read_article', 'sign_up', 'click_share'];

export async function POST(request) {
  let body = {};
  try { body = await request.json(); } catch (e) { body = {}; }
  const type = body.type;
  if (!EVENTS.includes(type)) {
    return Response.json({ ok: false, error: 'evento no válido' }, { status: 400 });
  }

  const supabase = admin();

  const { data: profile } = await supabase
    .from('profiles').select('id').eq('slug', PROFILE_SLUG).single();
  if (!profile) return Response.json({ ok: false }, { status: 404 });
  const pid = profile.id;

  // País y ciudad los entrega Vercel en cabeceras; sin datos personales.
  const country = request.headers.get('x-vercel-ip-country') || null;
  const city = request.headers.get('x-vercel-ip-city') || null;

  // Suscripción al newsletter (doble confirmación: queda 'pendiente')
  if (type === 'sign_up') {
    const email = (body.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return Response.json({ ok: false, error: 'email inválido' }, { status: 400 });
    }
    await supabase.from('subscribers').upsert(
      { profile_id: pid, email, status: 'pendiente', source: body.source || 'Página principal', article_id: body.article_id || null },
      { onConflict: 'profile_id,email', ignoreDuplicates: true }
    );
    // TODO: cuando esté la API de beehiiv, crear aquí la suscripción con doble opt-in.
  }

  await supabase.from('events').insert({
    profile_id: pid,
    type,
    object_id: body.object_id || null,
    position: body.position ?? null,
    source: body.source || null,
    device: body.device || null,
    country,
    city,
  });

  return Response.json({ ok: true });
}
