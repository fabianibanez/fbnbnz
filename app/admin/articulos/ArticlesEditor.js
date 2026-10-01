'use client';
import { useRef, useState, useEffect } from 'react';
import { createBrowserSupabase } from '../../lib/supabase-browser';
import { useFlash } from '../useAutosave';

function slugify(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'articulo';
}
function readMin(html) {
  const el = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (el) el.innerHTML = html || '';
  const words = ((el ? el.textContent : '') || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }).replace('.', '');
}

// ── Lista de artículos ──────────────────────────────────────────────────────
export function ArticlesList({ profileId, initial, onEdit, onCreate }) {
  const supabase = createBrowserSupabase();
  const [articles, setArticles] = useState(initial);
  const [filter, setFilter] = useState('todos');
  const [q, setQ] = useState('');
  const [flash, doFlash] = useFlash();

  async function remove(id) {
    if (!confirm('¿Eliminar este artículo?')) return;
    setArticles((a) => a.filter((x) => x.id !== id));
    await supabase.from('articles').delete().eq('id', id);
    doFlash('Artículo eliminado');
  }
  async function toggleStatus(art) {
    const makePublic = art.status !== 'publicado';
    const patch = { status: makePublic ? 'publicado' : 'borrador', published_at: makePublic ? new Date().toISOString() : art.published_at };
    setArticles((a) => a.map((x) => x.id === art.id ? { ...x, ...patch } : x));
    await supabase.from('articles').update(patch).eq('id', art.id);
    doFlash(makePublic ? 'Publicado' : 'Pasó a borrador');
  }

  const filtered = articles.filter((a) => {
    if (filter === 'publicados' && a.status !== 'publicado') return false;
    if (filter === 'borradores' && a.status !== 'borrador') return false;
    if (q && !a.title.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const pub = articles.filter((a) => a.status === 'publicado').length;
  const bor = articles.filter((a) => a.status === 'borrador').length;

  return (
    <>
      <div className="head">
        <div className="t"><h1>Artículos</h1><p className="sub">Los 3 más recientes publicados aparecen en tu página. El primero, con su portada.</p></div>
        <button className="btn primary" onClick={() => onCreate(setArticles)} style={{ gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Nuevo artículo
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--su)', border: '1px solid var(--bd)', borderRadius: 12, padding: 4 }}>
          {[['todos', `Todos (${articles.length})`], ['publicados', `Publicados (${pub})`], ['borradores', `Borradores (${bor})`]].map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)} style={{ height: 36, padding: '0 16px', borderRadius: 9, border: 0, fontWeight: 700, fontSize: 14, background: filter === k ? 'var(--tx)' : 'transparent', color: filter === k ? 'var(--bg)' : 'var(--mu)' }}>{label}</button>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--mu)" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar artículos" style={{ width: '100%', paddingLeft: 40 }} />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--bd)' }}>
              {['Artículo', 'Categoría', 'Estado', 'Fecha', 'Lecturas', 'Suscriptores', ''].map((h, i) => (
                <th key={i} style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, fontSize: 13, color: 'var(--mu)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--mu)' }}>
                {q ? 'No hay artículos que coincidan.' : 'Sin artículos todavía.'}
              </td></tr>
            )}
            {filtered.map((a, i) => (
              <tr key={a.id} style={{ borderTop: i > 0 ? '1px solid var(--bd)' : 'none' }}>
                <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ width: 52, height: 40, borderRadius: 8, background: a.cover_url ? `url(${a.cover_url}) center/cover` : 'var(--ph)', flexShrink: 0, display: 'block' }} />
                  <span>
                    <b style={{ display: 'block', fontSize: 14 }}>{a.title || 'Borrador sin título'}</b>
                    {a.status === 'publicado' && i === 0 && filtered[0]?.status === 'publicado' && <small style={{ color: 'var(--ac)', fontSize: 12 }}>Destacado en tu página</small>}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--mu)' }}>{a.category || '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 12px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: a.status === 'publicado' ? 'rgba(63,47,238,.15)' : 'var(--ph)', color: a.status === 'publicado' ? 'var(--ac)' : 'var(--mu)', border: `1px solid ${a.status === 'publicado' ? 'rgba(63,47,238,.3)' : 'var(--bd)'}` }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: a.status === 'publicado' ? 'var(--ac)' : 'var(--mu)' }} />
                    {a.status === 'publicado' ? 'Publicado' : 'Borrador'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--mu)', whiteSpace: 'nowrap' }}>{a.status === 'publicado' ? fmtDate(a.published_at) : fmtDate(a.created_at)}</td>
                <td style={{ padding: '12px 16px', color: 'var(--mu)' }}>{a.status === 'publicado' ? (a.reads || 0) : '—'}</td>
                <td style={{ padding: '12px 16px', color: 'var(--mu)' }}>{a.status === 'publicado' ? (a.subs || 0) : '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ position: 'relative' }}>
                    <button className="iconbtn" title="Opciones" onClick={(e) => { e.stopPropagation(); onEdit(a, setArticles); }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length > 0 && <p style={{ padding: '12px 16px', margin: 0, fontSize: 13, color: 'var(--mu)', borderTop: '1px solid var(--bd)' }}>«Suscriptores» cuenta las personas que se suscribieron al newsletter después de leer cada artículo.</p>}
      </div>
      <div className={`flash${flash ? ' show' : ''}`}>{flash}</div>
    </>
  );
}

// ── Editor de artículo ──────────────────────────────────────────────────────
export function ArticleEditor({ article: initial, onBack, setArticles }) {
  const supabase = createBrowserSupabase();
  const [a, setA] = useState(initial);
  const [flash, doFlash] = useFlash();
  const timers = useRef({});
  const editorRef = useRef(null);

  function field(patch, key) {
    setA((cur) => { const next = { ...cur, ...patch }; schedule(next, key); return next; });
  }
  function schedule(next, key) {
    clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(async () => {
      const slug = slugify(next.title) + '-' + next.id.slice(0, 6);
      const { error } = await supabase.from('articles').update({ title: next.title, excerpt: next.excerpt, body: next.body, category: next.category, invite_newsletter: next.invite_newsletter, slug }).eq('id', next.id);
      setArticles((arts) => arts.map((x) => x.id === next.id ? { ...x, ...next, slug } : x));
      doFlash(error ? 'Error al guardar' : 'Guardado automáticamente');
    }, 600);
  }
  async function publish(makePublic) {
    if (makePublic && !a.title.trim()) { doFlash('Ponle un título'); return; }
    const slug = slugify(a.title) + '-' + a.id.slice(0, 6);
    const patch = { status: makePublic ? 'publicado' : 'borrador', published_at: makePublic ? new Date().toISOString() : a.published_at, title: a.title, excerpt: a.excerpt, body: a.body, category: a.category, invite_newsletter: a.invite_newsletter, slug };
    const { error } = await supabase.from('articles').update(patch).eq('id', a.id);
    if (!error) { setA((cur) => ({ ...cur, ...patch })); setArticles((arts) => arts.map((x) => x.id === a.id ? { ...x, ...patch } : x)); doFlash(makePublic ? 'Publicado' : 'En borrador'); }
  }
  function execCmd(cmd, val) { document.execCommand(cmd, false, val); editorRef.current?.focus(); }

  const slug = slugify(a.title) + '-' + a.id.slice(0, 6);

  return (
    <>
      {/* Sub-barra del editor */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 0 4px', borderBottom: '1px solid var(--bd)', marginBottom: 28, flexWrap: 'wrap' }}>
        <button className="btn ghost" onClick={onBack} style={{ gap: 8, paddingLeft: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="2.4" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          Artículos
        </button>
        <span style={{ flex: 1, fontSize: 14, color: 'var(--mu)' }}>{a.status === 'publicado' ? 'Publicado' : 'Borrador'} · guardado automáticamente</span>
        {a.status === 'publicado'
          ? <button className="btn" onClick={() => publish(false)}>Pasar a borrador</button>
          : <button className="btn primary" onClick={() => publish(true)}>Publicar</button>}
      </div>

      <div className="ed-grid">
        {/* Columna principal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Zona portada */}
          <div style={{ aspectRatio: '16/9', borderRadius: 16, border: '2px dashed var(--bd)', background: a.cover_url ? `url(${a.cover_url}) center/cover` : 'var(--su)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: 'var(--mu)' }}>
            {!a.cover_url && <>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 16l5-5 4 4 3-3 6 6"/></svg>
              <b style={{ color: 'var(--tx)', fontSize: 15 }}>Subir portada</b>
              <span style={{ fontSize: 13 }}>16:9. Se muestra solo si es el artículo más reciente.</span>
            </>}
          </div>

          {/* Título */}
          <input className="ed-title" value={a.title || ''} onChange={(e) => field({ title: e.target.value }, 'title')} placeholder="Título del artículo" style={{ borderBottom: '1px solid var(--bd)', paddingBottom: 12 }} />

          {/* Bajada */}
          <textarea className="ed-ex" value={a.excerpt || ''} onChange={(e) => field({ excerpt: e.target.value }, 'ex')} placeholder="Bajada: una o dos líneas que inviten a leer" />

          {/* Toolbar de formato */}
          <div style={{ display: 'flex', gap: 4, padding: '8px 12px', background: 'var(--su)', border: '1px solid var(--bd)', borderRadius: '12px 12px 0 0', flexWrap: 'wrap' }}>
            {[
              { label: 'B', cmd: 'bold', style: { fontWeight: 700 } },
              { label: 'I', cmd: 'italic', style: { fontStyle: 'italic' } },
              { label: 'H2', cmd: 'formatBlock', val: 'h2', style: { fontSize: 13 } },
              { label: 'H3', cmd: 'formatBlock', val: 'h3', style: { fontSize: 13 } },
              { label: '•', cmd: 'insertUnorderedList' },
              { label: '"', cmd: 'formatBlock', val: 'blockquote' },
              { label: '🔗', cmd: 'createLink', prompt: true },
              { label: 'Aa', cmd: 'removeFormat' },
            ].map(({ label, cmd, val, prompt: needsPrompt, style: s }) => (
              <button key={label} onMouseDown={(e) => { e.preventDefault(); if (needsPrompt) { const u = window.prompt('URL:'); if (u) execCmd(cmd, u); } else execCmd(cmd, val); }}
                style={{ width: 36, height: 36, border: 0, borderRadius: 8, background: 'transparent', color: 'var(--tx)', cursor: 'pointer', ...s, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title={label}>
                {label === '🔗' ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> : label}
              </button>
            ))}
          </div>

          {/* Área de contenido editable */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => field({ body: e.currentTarget.innerHTML }, 'body')}
            dangerouslySetInnerHTML={{ __html: a.body || '' }}
            data-placeholder="Escribe tu artículo…"
            style={{ minHeight: 320, padding: '16px 0', fontSize: 17, lineHeight: 1.65, color: 'var(--tx)', outline: 'none', borderTop: '1px solid var(--bd)' }}
          />
        </div>

        {/* Panel derecho */}
        <div className="card" style={{ position: 'sticky', top: 80 }}>
          <h2 style={{ margin: 0 }}>Configuración</h2>
          <label>Categoría<input value={a.category || ''} onChange={(e) => field({ category: e.target.value }, 'cat')} placeholder="Ej.: Diseño web" /></label>
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: 'var(--mu)' }}>Dirección del artículo</p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--mu)', wordBreak: 'break-all' }}>fabianibanez.cl/blog/{slug}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: 'var(--mu)' }}>Tiempo de lectura</p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--mu)' }}>{readMin(a.body)} min · se calcula solo</p>
          </div>
          <div className="switch-row">
            <span><b>Invitar al newsletter</b><small>Muestra la suscripción al final del artículo</small></span>
            <button className="toggle" role="switch" aria-checked={!!a.invite_newsletter} aria-label="Invitar al newsletter" onClick={() => field({ invite_newsletter: !a.invite_newsletter }, 'nl')}><span /></button>
          </div>
        </div>
      </div>
      <div className={`flash${flash ? ' show' : ''}`}>{flash}</div>
    </>
  );
}

// ── Componente raíz que alterna entre lista y editor ─────────────────────────
export default function ArticlesEditor({ profileId, initial }) {
  const supabase = createBrowserSupabase();
  const [articles, setArticles] = useState(initial);
  const [editing, setEditing] = useState(null);

  async function createNew(setArts) {
    const { data, error } = await supabase.from('articles')
      .insert({ profile_id: profileId, slug: 'borrador-' + Date.now(), title: '', excerpt: '', body: '', category: '', status: 'borrador', invite_newsletter: true })
      .select().single();
    if (!error && data) {
      setArts((a) => [data, ...a]);
      setArticles((a) => [data, ...a]);
      setEditing(data);
    }
  }

  if (editing) {
    return <ArticleEditor article={editing} onBack={() => setEditing(null)} setArticles={setArticles} />;
  }
  return <ArticlesList profileId={profileId} initial={articles} onEdit={(a) => setEditing(a)} onCreate={createNew} />;
}
