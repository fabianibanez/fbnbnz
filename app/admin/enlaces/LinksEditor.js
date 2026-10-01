'use client';

import { useState } from 'react';
import { createBrowserSupabase } from '../../lib/supabase-browser';

const EFFECTS = { none: 'Sin efecto', pulse: 'Pulso', shine: 'Brillo', wiggle: 'Vibración', border: 'Borde' };

export default function LinksEditor({ profileId, initial }) {
  const supabase = createBrowserSupabase();
  const [links, setLinks] = useState(initial);
  const [status, setStatus] = useState('Cambios guardados');

  async function save(id, patch) {
    setLinks((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    setStatus('Guardando…');
    // Si se activa un efecto, apagar el de los demás (solo uno a la vez)
    if (patch.effect && patch.effect !== 'none') {
      setLinks((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : { ...l, effect: 'none' })));
      await supabase.from('links').update({ effect: 'none' }).eq('profile_id', profileId).neq('id', id);
    }
    const { error } = await supabase.from('links').update(patch).eq('id', id);
    setStatus(error ? 'Error al guardar' : 'Cambios guardados');
  }

  async function add() {
    const { data, error } = await supabase.from('links')
      .insert({ profile_id: profileId, position: links.length, title: 'Nuevo enlace', url: 'https://', description: '', visible: true, effect: 'none' })
      .select().single();
    if (!error && data) setLinks((ls) => [...ls, data]);
  }

  async function remove(id) {
    if (!confirm('¿Eliminar este enlace?')) return;
    setLinks((ls) => ls.filter((l) => l.id !== id));
    await supabase.from('links').delete().eq('id', id);
  }

  async function move(id, dir) {
    const i = links.findIndex((l) => l.id === id);
    const j = i + dir;
    if (j < 0 || j >= links.length) return;
    const copy = [...links];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    copy.forEach((l, idx) => { l.position = idx; });
    setLinks(copy);
    await Promise.all(copy.map((l) => supabase.from('links').update({ position: l.position }).eq('id', l.id)));
  }

  return (
    <>
      <div className="head">
        <div className="t"><h1>Enlaces</h1><p className="sub">Los primeros 4 se ven siempre; desde el 5.º aparecen tras «Ver más».</p></div>
        <span className="saved">{status}</span>
        <button className="btn primary" onClick={add}>+ Nuevo enlace</button>
      </div>
      <div className="list">
        {links.length === 0 && <div className="empty">Sin enlaces. Crea el primero.</div>}
        {links.map((l, i) => (
          <div className="card" key={l.id} style={{ gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <b style={{ flex: 1 }}>#{i + 1} {l.visible ? '' : '· oculto'}</b>
              <div className="tools">
                <button className="iconbtn" onClick={() => move(l.id, -1)} disabled={i === 0} aria-label="Subir">↑</button>
                <button className="iconbtn" onClick={() => move(l.id, 1)} disabled={i === links.length - 1} aria-label="Bajar">↓</button>
                <button className="iconbtn" onClick={() => remove(l.id)} aria-label="Eliminar">✕</button>
              </div>
            </div>
            <label>Título
              <input value={l.title || ''} maxLength={50} onChange={(e) => save(l.id, { title: e.target.value })} />
            </label>
            <label>URL de destino
              <input value={l.url || ''} onChange={(e) => save(l.id, { url: e.target.value })} placeholder="https://" />
            </label>
            <label>Descripción (opcional)
              <input value={l.description || ''} onChange={(e) => save(l.id, { description: e.target.value })} />
            </label>
            <div className="row2">
              <label>Efecto para destacar
                <select value={l.effect || 'none'} onChange={(e) => save(l.id, { effect: e.target.value })}>
                  {Object.entries(EFFECTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <div className="switch-row" style={{ border: 0, padding: '24px 0 0' }}>
                <span><b>Visible</b></span>
                <button className="toggle" role="switch" aria-checked={!!l.visible} aria-label="Visible" onClick={() => save(l.id, { visible: !l.visible })}><span /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
