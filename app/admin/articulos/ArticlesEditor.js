'use client';

import { useState } from 'react';
import { createBrowserSupabase } from '../../lib/supabase-browser';

function slugify(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'articulo';
}

export default function ArticlesEditor({ profileId, initial }) {
  const supabase = createBrowserSupabase();
  const [articles, setArticles] = useState(initial);
  const [editing, setEditing] = useState(null);
  const [status, setStatus] = useState('');

  async function createNew() {
    const { data, error } = await supabase.from('articles')
      .insert({ profile_id: profileId, slug: 'borrador-' + Date.now(), title: '', excerpt: '', body: '', category: '', status: 'borrador', invite_newsletter: true })
      .select().single();
    if (!error && data) { setArticles((a) => [data, ...a]); setEditing(data); }
  }

  async function saveField(patch) {
    setEditing((e) => ({ ...e, ...patch }));
    setStatus('Guardando…');
  }

  async function persist(next) {
    const patch = {
      title: next.title, excerpt: next.excerpt, body: next.body, category: next.category,
      slug: slugify(next.title) + '-' + next.id.slice(0, 6),
    };
    const { error } = await supabase.from('articles').update(patch).eq('id', next.id);
    setArticles((a) => a.map((x) => (x.id === next.id ? { ...x, ...patch } : x)));
    setStatus(error ? 'Error al guardar' : 'Guardado');
  }

  async function publish(next, makePublic) {
    if (makePublic && !next.title.trim()) { setStatus('Ponle un título antes de publicar'); return; }
    const patch = { status: makePublic ? 'publicado' : 'borrador', published_at: makePublic ? new Date().toISOString() : next.published_at };
    const { error } = await supabase.from('articles').update(patch).eq('id', next.id);
    if (!error) {
      setArticles((a) => a.map((x) => (x.id === next.id ? { ...x, ...patch } : x)));
      setEditing((e) => ({ ...e, ...patch }));
      setStatus(makePublic ? 'Publicado' : 'Pasó a borrador');
    }
  }

  async function remove(id) {
    if (!confirm('¿Eliminar este artículo?')) return;
    setArticles((a) => a.filter((x) => x.id !== id));
    if (editing?.id === id) setEditing(null);
    await supabase.from('articles').delete().eq('id', id);
  }

  if (editing) {
    const e = editing;
    return (
      <>
        <div className="head">
          <div className="t"><h1>{e.status === 'publicado' ? 'Editar artículo' : 'Borrador'}</h1><p className="sub">{status || 'Se guarda al tocar «Guardar».'}</p></div>
          <button className="btn ghost" onClick={() => setEditing(null)}>← Volver</button>
          <button className="btn" onClick={() => persist(e)}>Guardar</button>
          {e.status === 'publicado'
            ? <button className="btn" onClick={() => publish(e, false)}>Pasar a borrador</button>
            : <button className="btn primary" onClick={async () => { await persist(e); await publish(e, true); }}>Publicar</button>}
        </div>
        <div className="card">
          <label>Título<input value={e.title || ''} onChange={(ev) => saveField({ title: ev.target.value })} placeholder="Título del artículo" /></label>
          <label>Bajada<textarea value={e.excerpt || ''} onChange={(ev) => saveField({ excerpt: ev.target.value })} placeholder="Una o dos líneas que inviten a leer" /></label>
          <label>Categoría<input value={e.category || ''} onChange={(ev) => saveField({ category: ev.target.value })} placeholder="Ej.: Diseño web" /></label>
          <label>Contenido
            <textarea style={{ minHeight: 320 }} value={e.body || ''} onChange={(ev) => saveField({ body: ev.target.value })}
              placeholder="Escribe aquí. Puedes usar etiquetas HTML simples: <h2>Subtítulo</h2>, <p>párrafo</p>, <b>negrita</b>, <a href=''>enlace</a>." />
            <span className="hint">Por ahora el contenido admite HTML simple. El editor visual llega en la próxima versión.</span>
          </label>
        </div>
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
            <div className="info">
              <b>{a.title || 'Borrador sin título'}</b>
              <small>{a.status === 'publicado' ? 'Publicado' : 'Borrador'}{a.category ? ' · ' + a.category : ''}</small>
            </div>
            <button className="btn" onClick={() => setEditing(a)}>Editar</button>
            <button className="iconbtn" onClick={() => remove(a.id)} aria-label="Eliminar">✕</button>
          </div>
        ))}
      </div>
    </>
  );
}
