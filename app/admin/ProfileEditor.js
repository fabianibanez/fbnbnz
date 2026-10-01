'use client';

import { useRef, useState } from 'react';
import { createBrowserSupabase } from '../lib/supabase-browser';
import { useFlash } from './useAutosave';

const TYPES = {
  whatsapp: 'WhatsApp', call: 'Llamada', agenda: 'Agenda', email: 'Email',
  instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', linkedin: 'LinkedIn',
  youtube: 'YouTube', x: 'X', link: 'Enlace libre',
};

export default function ProfileEditor({ profile, initialButtons }) {
  const supabase = createBrowserSupabase();
  const [p, setP] = useState(profile);
  const [buttons, setButtons] = useState(initialButtons);
  const [flash, doFlash] = useFlash();
  const timers = useRef({});

  // Reacciona al instante en pantalla; guarda en segundo plano con retardo.
  function saveProfile(patch, key) {
    setP((cur) => ({ ...cur, ...patch }));
    clearTimeout(timers.current['p' + key]);
    timers.current['p' + key] = setTimeout(async () => {
      const { error } = await supabase.from('profiles').update(patch).eq('id', p.id);
      doFlash(error ? 'Error al guardar' : 'Guardado');
    }, 500);
  }

  function saveButton(id, patch, key) {
    setButtons((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    clearTimeout(timers.current[id + key]);
    timers.current[id + key] = setTimeout(async () => {
      const { error } = await supabase.from('contact_buttons').update(patch).eq('id', id);
      doFlash(error ? 'Error al guardar' : 'Guardado');
    }, 400);
  }

  async function addButton() {
    const { data, error } = await supabase.from('contact_buttons')
      .insert({ profile_id: p.id, position: buttons.length, type: 'link', label: '', destination: '', message: '', highlighted: false })
      .select().single();
    if (!error && data) setButtons((bs) => [...bs, data]);
  }
  async function removeButton(id) {
    if (!confirm('¿Eliminar este botón?')) return;
    setButtons((bs) => bs.filter((b) => b.id !== id));
    await supabase.from('contact_buttons').delete().eq('id', id);
    doFlash('Eliminado');
  }
  async function move(id, dir) {
    const i = buttons.findIndex((b) => b.id === id); const j = i + dir;
    if (j < 0 || j >= buttons.length) return;
    const copy = [...buttons]; [copy[i], copy[j]] = [copy[j], copy[i]];
    copy.forEach((b, idx) => { b.position = idx; });
    setButtons(copy);
    await Promise.all(copy.map((b) => supabase.from('contact_buttons').update({ position: b.position }).eq('id', b.id)));
  }

  return (
    <>
      <div className="head">
        <div className="t"><h1>Perfil y acciones</h1><p className="sub">Tu imagen, nombre, bio y botones de contacto.</p></div>
      </div>

      <div className="card">
        <h2>Encabezado</h2>
        <div className="row2">
          <label>Nombre<input value={p.name || ''} maxLength={60} onChange={(e) => saveProfile({ name: e.target.value }, 'name')} /></label>
          <label>Rol (línea superior)<input value={p.role || ''} maxLength={60} onChange={(e) => saveProfile({ role: e.target.value }, 'role')} /></label>
        </div>
        <label>Bio
          <textarea value={p.bio || ''} maxLength={160} onChange={(e) => saveProfile({ bio: e.target.value }, 'bio')} />
          <span className={`hint${(p.bio || '').length > 160 ? ' over' : ''}`}>{(p.bio || '').length}/160 caracteres</span>
        </label>
        <div className="switch-row" style={{ borderBottom: 0, paddingBottom: 0 }}>
          <span><b>Mostrar rol</b><small>La línea con el punto sobre tu nombre</small></span>
          <button className="toggle" role="switch" aria-checked={!!p.show_role} aria-label="Mostrar rol" onClick={() => saveProfile({ show_role: !p.show_role }, 'role2')}><span /></button>
        </div>
        <p className="hint">La foto 3:4 se sube en la próxima versión del panel. Si la necesitas ya, pídemela y la subo.</p>
      </div>

      <div className="card">
        <h2>Newsletter</h2>
        <div className="row2">
          <label>Título<input value={p.newsletter_title || ''} onChange={(e) => saveProfile({ newsletter_title: e.target.value }, 'nt')} /></label>
          <label>Descripción<input value={p.newsletter_description || ''} onChange={(e) => saveProfile({ newsletter_description: e.target.value }, 'nd')} /></label>
        </div>
      </div>

      <div className="card-head">
        <div><h2 style={{ fontSize: 22, margin: 0, letterSpacing: '-.02em' }}>Botones de contacto</h2><p>Se ven 4; desde el 5.º la fila se desliza en tu página.</p></div>
        <button className="btn" onClick={addButton}>+ Agregar botón</button>
      </div>

      <div className="list">
        {buttons.length === 0 && <div className="empty">Sin botones. Agrega el primero.</div>}
        {buttons.map((b, i) => (
          <div className="card" key={b.id} style={{ gap: 14 }}>
            <div className="rowhead">
              <span className="ic">{(TYPES[b.type] || 'Enlace').slice(0, 2)}</span>
              <b>Botón {i + 1}{b.highlighted ? ' · destacado' : ''}</b>
              <div className="tools">
                <button className="iconbtn" onClick={() => move(b.id, -1)} disabled={i === 0} aria-label="Subir">↑</button>
                <button className="iconbtn" onClick={() => move(b.id, 1)} disabled={i === buttons.length - 1} aria-label="Bajar">↓</button>
                <button className="iconbtn" onClick={() => removeButton(b.id)} aria-label="Eliminar">✕</button>
              </div>
            </div>
            <div className="row2">
              <label>Tipo
                <select value={b.type} onChange={(e) => saveButton(b.id, { type: e.target.value }, 'type')}>
                  {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <label>Etiqueta
                <input value={b.label || ''} maxLength={14} onChange={(e) => saveButton(b.id, { label: e.target.value }, 'label')} />
                <span className={`hint${(b.label || '').length > 9 ? ' over' : ''}`}>Máx. 9 caracteres</span>
              </label>
            </div>
            <label>Destino (número, enlace o email)<input value={b.destination || ''} onChange={(e) => saveButton(b.id, { destination: e.target.value }, 'dest')} placeholder="+56 9 ... o https://..." /></label>
            {b.type === 'whatsapp' && <label>Mensaje prellenado<input value={b.message || ''} onChange={(e) => saveButton(b.id, { message: e.target.value }, 'msg')} /></label>}
            <div className="switch-row">
              <span><b>Destacar</b><small>Fondo azul</small></span>
              <button className="toggle" role="switch" aria-checked={!!b.highlighted} aria-label="Destacar" onClick={() => saveButton(b.id, { highlighted: !b.highlighted }, 'hl')}><span /></button>
            </div>
          </div>
        ))}
      </div>
      <div className={`flash${flash ? ' show' : ''}`}>{flash}</div>
    </>
  );
}
