'use client';
import { useRef, useState } from 'react';
import { createBrowserSupabase } from '../../lib/supabase-browser';
import { useFlash } from '../useAutosave';

const EFFECTS = { none: 'Sin efecto', pulse: 'Pulso', shine: 'Brillo', wiggle: 'Vibración', border: 'Borde' };

export default function LinksEditor({ profileId, initial }) {
  const supabase = createBrowserSupabase();
  const [links, setLinks] = useState(initial);
  const [flash, doFlash] = useFlash();
  const timers = useRef({});

  function save(id, patch, key, immediate) {
    setLinks((ls) => {
      let next = ls.map((l) => (l.id === id ? { ...l, ...patch } : l));
      if (patch.effect && patch.effect !== 'none') next = next.map((l) => (l.id === id ? l : { ...l, effect: 'none' }));
      return next;
    });
    const run = async () => {
      if (patch.effect && patch.effect !== 'none') await supabase.from('links').update({ effect: 'none' }).eq('profile_id', profileId).neq('id', id);
      const { error } = await supabase.from('links').update(patch).eq('id', id);
      doFlash(error ? 'Error al guardar' : 'Guardado');
    };
    if (immediate) return run();
    clearTimeout(timers.current[id + key]);
    timers.current[id + key] = setTimeout(run, 500);
  }
  async function add() {
    const { data, error } = await supabase.from('links').insert({ profile_id: profileId, position: links.length, title: 'Nuevo enlace', url: 'https://', description: '', visible: true, effect: 'none' }).select().single();
    if (!error && data) setLinks((ls) => [...ls, data]);
  }
  async function remove(id) { if (!confirm('¿Eliminar este enlace?')) return; setLinks((ls) => ls.filter((l) => l.id !== id)); await supabase.from('links').delete().eq('id', id); doFlash('Eliminado'); }
  async function move(id, dir) {
    const i = links.findIndex((l) => l.id === id); const j = i + dir; if (j < 0 || j >= links.length) return;
    const copy = [...links]; [copy[i], copy[j]] = [copy[j], copy[i]]; copy.forEach((l, idx) => { l.position = idx; }); setLinks(copy);
    await Promise.all(copy.map((l) => supabase.from('links').update({ position: l.position }).eq('id', l.id)));
  }
  return (
    <>
      <div className="head">
        <div className="t"><h1>Enlaces</h1><p className="sub">Los primeros 4 se ven siempre; desde el 5.º tras «Ver más».</p></div>
        <button className="btn primary" onClick={add}>+ Nuevo enlace</button>
      </div>
      <div className="list">
        {links.length === 0 && <div className="empty">Sin enlaces. Crea el primero.</div>}
        {links.map((l, i) => (
          <div className="card" key={l.id} style={{ gap: 14 }}>
            <div className="rowhead">
              <b>#{i + 1}{l.visible ? '' : ' · oculto'}</b>
              <div className="tools">
                <button className="iconbtn" onClick={() => move(l.id, -1)} disabled={i === 0} aria-label="Subir">↑</button>
                <button className="iconbtn" onClick={() => move(l.id, 1)} disabled={i === links.length - 1} aria-label="Bajar">↓</button>
                <button className="iconbtn" onClick={() => remove(l.id)} aria-label="Eliminar">✕</button>
              </div>
            </div>
            <label>Título<input value={l.title || ''} maxLength={50} onChange={(e) => save(l.id, { title: e.target.value }, 'title')} /></label>
            <label>URL de destino<input value={l.url || ''} onChange={(e) => save(l.id, { url: e.target.value }, 'url')} placeholder="https://" /></label>
            <label>Descripción (opcional)<input value={l.description || ''} onChange={(e) => save(l.id, { description: e.target.value }, 'desc')} /></label>
            <div className="row2">
              <label>Efecto para destacar
                <select value={l.effect || 'none'} onChange={(e) => save(l.id, { effect: e.target.value }, 'fx', true)}>
                  {Object.entries(EFFECTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <div className="switch-row" style={{ border: 0, padding: '24px 0 0' }}>
                <span><b>Visible</b></span>
                <button className="toggle" role="switch" aria-checked={!!l.visible} aria-label="Visible" onClick={() => save(l.id, { visible: !l.visible }, 'vis', true)}><span /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className={`flash${flash ? ' show' : ''}`}>{flash}</div>
    </>
  );
}
