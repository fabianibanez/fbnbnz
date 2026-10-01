'use client';
import { useRef, useState } from 'react';
import { createBrowserSupabase } from '../../lib/supabase-browser';
import { useFlash } from '../useAutosave';

function slugify(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'articulo'; }

export default function ArticlesEditor({ profileId, initial }) {
  const supabase = createBrowserSupabase();
  const [articles, setArticles] = useState(initial);
  const [editing, setEditing] = useState(null);
  const [flash, doFlash] = useFlash();
  const timers = useRef({});

  async function createNew() {
    const { data, error } = await supabase.from('articles').insert({ profile_id: profileId, slug: 'borrador-' + Date.now(), title: '', excerpt: '', body: '', category: '', status: 'borrador', invite_newsletter: true }).select().single();
    if (!error && data) { setArticles((a) => [data, ...a]); setEditing(data); }
  }
  function edit(patch, key) {
    setEditing((e) => { const next = { ...e, ...patch }; scheduleSave(next, key); return next; });
  }
  function scheduleSave(next, key) {
    clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(async () => {
      const patch = { title: next.title, excerpt: next.excerpt, body: next.body, category: next.category, slug: slugify(next.title) + '-' + next.id.slice(0, 6) };
      const { error } = await supabase.from('articles').update(patch).eq('id', next.id);
      setArticles((a) => a.map((x) => (x.id === next.id ? { ...x, ...patch } : x)));
      doFlash(error ? 'Error al guardar' : 'Guardado');
    }, 600);
  }
  async function publish(next, makePublic) {
    if (makePublic && !next.title.trim()) { doFlash('Ponle un título'); return; }
    const patch = { status: makePublic ? 'publicado' : 'borrador', published_at: makePublic ? new Date().toISOString() : next.published_at,
      title: next.title, excerpt: next.excerpt, body: next.body, category: next.category, slug: slugify(next.title) + '-' + next.id.slice(0, 6) };
    const { error } = await supabase.from('articles').update(patch).eq('id', next.id);
    if (!error) { setArticles((a) => a.map((x) => (x.id === next.id ? { ...x, ...patch } : x))); setEditing((e) => ({ ...e, ...patch })); doFlash(makePublic ? 'Publicado' : 'En borrador'); }
  }
  async function remove(id) { if (!confirm('¿Eliminar este artículo?')) return; setArticles((a) => a.filter((x) => x.id !== id)); if (editing?.id === id) setEditing(null); await supabase.from('articles').delete().eq('id', id); doFlash('Eliminado'); }

  if (editing) {
    const e = editing;
    return (
      <>
        <div className="head">
          <div className="t"><h1>{e.status === 'publicado' ? 'Editar artículo' : 'Borrador'}</h1><p className="sub">Se guarda solo mientras escribes.</p></div>
          <button className="btn ghost" onClick={() => setEditing(null)}>← Volver</button>
          {e.status === 'publicado'
            ? <button className="btn" onClick={() => publish(e, false)}>Pasar a borrador</button>
            : <button className="btn primary" onClick={() => publish(e, true)}>Publicar</button>}
        </div>
        <div className="ed-grid">
          <div className="card">
            <input className="ed-title" value={e.title || ''} onChange={(ev) => edit({ title: ev.target.value }, 'title')} placeholder="Título del artículo" />
            <textarea className="ed-ex" value={e.excerpt || ''} onChange={(ev) => edit({ excerpt: ev.target.value }, 'ex')} placeholder="Bajada: una o dos líneas que inviten a leer" />
            <label>Contenido
              <textarea className="rte" value={e.body || ''} onChange={(ev) => edit({ body: ev.target.value }, 'body')} placeholder="Escribe aquí. Admite HTML simple: <h2>Subtítulo</h2>, <p>párrafo</p>, <b>negrita</b>, <a href=''>enlace</a>." />
            </label>
          </div>
          <div className="card">
            <h2>Configuración</h2>
            <label>Categoría<input value={e.category || ''} onChange={(ev) => edit({ category: ev.target.value }, 'cat')} placeholder="Ej.: Diseño web" /></label>
            <p className="hint">La portada y el editor visual llegan en la próxima versión.</p>
          </div>
        </div>
        <div className={`flash${flash ? ' show' : ''}`}>{flash}</div>
      </>
    );
  }
  return (
    <>
      <div className="head">
        <div className="t"><h1>Artículos</h1><p className="sub">Los 3 más recientes publicados aparecen en tu página.</p></div>
        <button className="btn primary" onClick={createNew}>+ Nuevo artículo</button>
      </div>
      <div className="list">
        {articles.length === 0 && <div className="empty">Sin artículos todavía.</div>}
        {articles.map((a) => (
          <div className="item" key={a.id}>
            <div className="info"><b>{a.title || 'Borrador sin título'}</b><small>{a.status === 'publicado' ? 'Publicado' : 'Borrador'}{a.category ? ' · ' + a.category : ''}</small></div>
            <button className="btn" onClick={() => setEditing(a)}>Editar</button>
            <button className="iconbtn" onClick={() => remove(a.id)} aria-label="Eliminar">✕</button>
          </div>
        ))}
      </div>
      <div className={`flash${flash ? ' show' : ''}`}>{flash}</div>
    </>
  );
}
