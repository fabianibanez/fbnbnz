'use client';

import { useState } from 'react';
import { createBrowserSupabase } from '../../lib/supabase-browser';

const ICONS = ['web', 'shop', 'ai', 'talk', 'doc', 'chart', 'img', 'mail'];

export default function ServicesEditor({ profileId, initial, section }) {
  const supabase = createBrowserSupabase();
  const [services, setServices] = useState(initial);
  const [sec, setSec] = useState(section || { profile_id: profileId, key: 'services', title: '¿En qué te puedo ayudar?', subtitle: '', visible: true });
  const [status, setStatus] = useState('Cambios guardados');

  async function saveSection(patch) {
    const next = { ...sec, ...patch };
    setSec(next); setStatus('Guardando…');
    const { error } = await supabase.from('sections').upsert({ ...next }, { onConflict: 'profile_id,key' });
    setStatus(error ? 'Error al guardar' : 'Cambios guardados');
  }

  async function save(id, patch) {
    setServices((ss) => ss.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    setStatus('Guardando…');
    const { error } = await supabase.from('services').update(patch).eq('id', id);
    setStatus(error ? 'Error al guardar' : 'Cambios guardados');
  }

  async function add() {
    const { data, error } = await supabase.from('services')
      .insert({ profile_id: profileId, position: services.length, icon: 'web', title: '', description: '', message: 'Hola Fabian, ' })
      .select().single();
    if (!error && data) setServices((ss) => [...ss, data]);
  }

  async function remove(id) {
    if (!confirm('¿Eliminar este servicio?')) return;
    setServices((ss) => ss.filter((s) => s.id !== id));
    await supabase.from('services').delete().eq('id', id);
  }

  async function move(id, dir) {
    const i = services.findIndex((s) => s.id === id);
    const j = i + dir;
    if (j < 0 || j >= services.length) return;
    const copy = [...services];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    copy.forEach((s, idx) => { s.position = idx; });
    setServices(copy);
    await Promise.all(copy.map((s) => supabase.from('services').update({ position: s.position }).eq('id', s.id)));
  }

  return (
    <>
      <div className="head">
        <div className="t"><h1>Servicios</h1><p className="sub">Las tarjetas del carrusel. Cada una abre WhatsApp con su mensaje.</p></div>
        <span className="saved">{status}</span>
        <button className="btn primary" onClick={add}>+ Nuevo servicio</button>
      </div>

      <div className="card">
        <h2>Encabezado de la sección</h2>
        <div className="row2">
          <label>Título<input value={sec.title || ''} maxLength={60} onChange={(e) => saveSection({ title: e.target.value })} /></label>
          <label>Texto de apoyo<input value={sec.subtitle || ''} maxLength={120} onChange={(e) => saveSection({ subtitle: e.target.value })} /></label>
        </div>
        <div className="switch-row">
          <span><b>Mostrar sección</b><small>Apágala sin perder las tarjetas</small></span>
          <button className="toggle" role="switch" aria-checked={!!sec.visible} aria-label="Mostrar sección" onClick={() => saveSection({ visible: !sec.visible })}><span /></button>
        </div>
      </div>

      <div className="list">
        {services.length === 0 && <div className="empty">Sin servicios.</div>}
        {services.map((s, i) => (
          <div className="card" key={s.id} style={{ gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <b style={{ flex: 1 }}>#{i + 1} {s.title || 'Servicio'}</b>
              <div className="tools">
                <button className="iconbtn" onClick={() => move(s.id, -1)} disabled={i === 0} aria-label="Subir">↑</button>
                <button className="iconbtn" onClick={() => move(s.id, 1)} disabled={i === services.length - 1} aria-label="Bajar">↓</button>
                <button className="iconbtn" onClick={() => remove(s.id)} aria-label="Eliminar">✕</button>
              </div>
            </div>
            <div className="row2">
              <label>Ícono
                <select value={s.icon} onChange={(e) => save(s.id, { icon: e.target.value })}>
                  {ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                </select>
              </label>
              <label>Título<input value={s.title || ''} maxLength={40} onChange={(e) => save(s.id, { title: e.target.value })} /></label>
            </div>
            <label>Descripción<input value={s.description || ''} maxLength={80} onChange={(e) => save(s.id, { description: e.target.value })} /></label>
            <label>Mensaje de WhatsApp<input value={s.message || ''} onChange={(e) => save(s.id, { message: e.target.value })} /></label>
          </div>
        ))}
      </div>
    </>
  );
}
