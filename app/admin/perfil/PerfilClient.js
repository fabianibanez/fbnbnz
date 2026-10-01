'use client';
import { useRef, useState } from 'react';
import { createBrowserSupabase } from '../../lib/supabase-browser';

// ── Tipos de botón (fiel a la maqueta) ────────────────────────────
const TYPES = {
  whatsapp: { n:'WhatsApp', ic:'wa', mono:null, dest:'Número de WhatsApp', ph:'+56 9 1234 5678' },
  call:     { n:'Llamada',  ic:'phone', mono:null, dest:'Número de teléfono', ph:'+56 9 1234 5678' },
  agenda:   { n:'Agenda',   ic:'cal',   mono:null, dest:'Enlace de tu calendario', ph:'https://' },
  email:    { n:'Email',    ic:'mail',  mono:null, dest:'Tu email', ph:'nombre@correo.cl' },
  instagram:{ n:'Instagram',ic:null, mono:'IG', dest:'Enlace a tu perfil', ph:'https://instagram.com/' },
  facebook: { n:'Facebook', ic:null, mono:'FB', dest:'Enlace a tu página', ph:'https://facebook.com/' },
  tiktok:   { n:'TikTok',  ic:null, mono:'TT', dest:'Enlace a tu perfil', ph:'https://tiktok.com/@' },
  linkedin: { n:'LinkedIn', ic:null, mono:'in', dest:'Enlace a tu perfil', ph:'https://linkedin.com/in/' },
  youtube:  { n:'YouTube',  ic:null, mono:'YT', dest:'Enlace a tu canal', ph:'https://youtube.com/@' },
  x:        { n:'X',        ic:null, mono:'X',  dest:'Enlace a tu perfil', ph:'https://x.com/' },
  link:     { n:'Enlace libre', ic:'link', mono:null, dest:'URL', ph:'https://' },
};

const SVGS = {
  wa:    'M4 20l1.4-4A8 8 0 1 1 9 19.6z',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  cal:   null, // multi-path
  mail:  null,
  link:  'M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1',
  img:   null,
  up:    'M12 19V5M6 11l6-6 6 6',
  dn:    'M12 5v14M6 13l6 6 6-6',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
  plus:  'M12 5v14M5 12h14',
  img2:  'M3 5h18v14H3zM3 14l5-5 4 4 3-3 6 6',
};

function Ico({ ic, color='#F2F4F7', size=22, sw=1.9 }) {
  if (!ic) return null;
  if (ic === 'cal') return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4"/></svg>;
  if (ic === 'mail') return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>;
  if (ic === 'img2') return <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 16l5-5 4 4 3-3 6 6"/></svg>;
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={SVGS[ic]}/></svg>;
}

function BtnIcon({ type, hl }) {
  const t = TYPES[type] || TYPES.link;
  const color = hl ? '#fff' : '#F2F4F7';
  if (t.mono) return <span style={{ color, fontWeight:700, fontSize:15 }}>{t.mono}</span>;
  return <Ico ic={t.ic} color={color} size={22} />;
}

function destValid(b) {
  const d = (b.destination || '').trim();
  if (!d) return '';
  if (b.type === 'whatsapp' || b.type === 'call') { if (!/^\+?[\d\s\-()]{7,}$/.test(d)) return 'Formato: +56 9 1234 5678'; }
  if (b.type === 'email') { if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d)) return 'Formato: nombre@correo.cl'; }
  if (['agenda','instagram','facebook','tiktok','linkedin','youtube','x','link'].includes(b.type)) { if (!/^https?:\/\//.test(d)) return 'Debe empezar con https://'; }
  return '';
}

// Vista previa mini (fiel al diseño Nocturno de la página pública)
function MiniPreview({ profile, buttons }) {
  return (
    <div style={{ fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif", color:'#F2F4F7', fontSize:15, background:'#07080A' }}>
      {/* Hero */}
      <div style={{ position:'relative', aspectRatio:'3/4', background: profile.image_url ? `url(${profile.image_url}) center/cover` : '#262B33', overflow:'hidden' }}>
        {!profile.image_url && <span style={{ position:'absolute', inset:0, display:'grid', placeItems:'center', color:'#9AA3AF', fontSize:12 }}>[Tu foto 3:4]</span>}
        <div style={{ position:'absolute', left:0, right:0, bottom:0, height:'55%', background:'linear-gradient(to bottom,rgba(7,8,10,0),rgba(7,8,10,.75) 55%,#07080A)' }} />
        <div style={{ position:'absolute', bottom:18, left:18, right:18, display:'flex', flexDirection:'column', gap:8, zIndex:1 }}>
          {profile.show_role && profile.role && <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, fontWeight:700 }}><i style={{ width:7, height:7, borderRadius:'50%', background:'#9AA3AF', display:'inline-block' }} />{profile.role}</span>}
          <b style={{ fontSize:30, lineHeight:1, letterSpacing:'-.03em' }}>{profile.name || 'Tu nombre'}</b>
          {profile.bio && <p style={{ margin:0, fontSize:12, lineHeight:1.4, color:'rgba(242,244,247,.85)' }}>{profile.bio}</p>}
        </div>
      </div>
      {/* Botones */}
      <div style={{ display:'flex', justifyContent: buttons.length > 4 ? 'flex-start' : 'center', gap:10, padding:'18px 16px 14px', overflowX: buttons.length > 4 ? 'auto' : 'visible' }}>
        {buttons.map((b) => (
          <div key={b.id} style={{ width:60, display:'flex', flexDirection:'column', alignItems:'center', gap:6, fontSize:11, flexShrink:0 }}>
            <span style={{ width:48, height:48, borderRadius:'50%', border: b.highlighted ? '0' : '1px solid #3A414C', background: b.highlighted ? '#3F2FEE' : '#171A1F', display:'grid', placeItems:'center' }}>
              <BtnIcon type={b.type} hl={b.highlighted} />
            </span>
            <span style={{ maxWidth:60, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight: b.highlighted ? 700 : 400 }}>{b.label || TYPES[b.type]?.n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────
export default function PerfilClient({ profile: initialProfile, initialButtons }) {
  const supabase = createBrowserSupabase();
  const [p, setP] = useState(initialProfile);
  const [buttons, setButtons] = useState(initialButtons);
  const [savedMsg, setSavedMsg] = useState('Cambios guardados');
  const timers = useRef({});

  function markSaved(key, patch, table, id) {
    setSavedMsg('Guardando…');
    clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(async () => {
      const { error } = id
        ? await supabase.from(table).update(patch).eq('id', id)
        : await supabase.from(table).update(patch).eq('id', p.id);
      setSavedMsg(error ? 'Error al guardar' : 'Cambios guardados');
    }, 400);
  }

  function saveProfile(patch) {
    setP((cur) => ({ ...cur, ...patch }));
    markSaved('prof', patch, 'profiles', null);
  }
  function saveBtn(id, patch) {
    setButtons((bs) => bs.map((b) => b.id === id ? { ...b, ...patch } : b));
    markSaved('btn_' + id, patch, 'contact_buttons', id);
  }
  async function addBtn() {
    const { data, error } = await supabase.from('contact_buttons')
      .insert({ profile_id: p.id, position: buttons.length, type: 'link', label: '', destination: '', message: '', highlighted: false })
      .select().single();
    if (!error && data) {
      setButtons((bs) => [...bs, data]);
      setTimeout(() => { document.querySelectorAll('[data-bk="label"]').item(buttons.length)?.focus(); }, 100);
    }
  }
  async function removeBtn(id) {
    if (!confirm('¿Eliminar este botón?')) return;
    setButtons((bs) => bs.filter((b) => b.id !== id));
    await supabase.from('contact_buttons').delete().eq('id', id);
    setSavedMsg('Botón eliminado');
  }
  async function moveBtn(id, dir) {
    const i = buttons.findIndex((b) => b.id === id); const j = i + dir;
    if (j < 0 || j >= buttons.length) return;
    const copy = [...buttons]; [copy[i], copy[j]] = [copy[j], copy[i]];
    copy.forEach((b, idx) => { b.position = idx; });
    setButtons(copy);
    await Promise.all(copy.map((b) => supabase.from('contact_buttons').update({ position: b.position }).eq('id', b.id)));
  }
  async function changeType(id, type) {
    const old = TYPES[buttons.find((b) => b.id === id)?.type]?.n;
    const b = buttons.find((x) => x.id === id);
    const label = (!b.label || b.label === old) ? TYPES[type].n : b.label;
    const patch = { type, destination: '', label };
    setButtons((bs) => bs.map((x) => x.id === id ? { ...x, ...patch } : x));
    await supabase.from('contact_buttons').update(patch).eq('id', id);
  }

  return (
    <div style={{ display:'flex', flex:1, minWidth:0, overflow:'hidden' }}>
      {/* Columna principal */}
      <div className="content">
        <div className="head">
          <div className="t"><h1>Perfil y acciones</h1><p>Lo primero que ve la gente: tu imagen, nombre, bio y tus botones de contacto.</p></div>
          <span className="saved">{savedMsg}</span>
        </div>

        {/* Encabezado */}
        <div className="card">
          <h2>Encabezado</h2>
          <div className="hero-edit">
            {/* Foto 3:4 */}
            <button className={`hero-img${p.image_url ? ' has' : ''}`} style={p.image_url ? { backgroundImage:`url(${p.image_url})` } : {}} aria-label="Cambiar imagen destacada" onClick={() => alert('Subida de imagen disponible próximamente')}>
              {!p.image_url && <Ico ic="img2" color="var(--ac)" />}
            </button>
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:16, minWidth:0 }}>
              <div className="row2">
                <label className="field">Nombre<input maxLength={60} value={p.name || ''} onChange={(e) => saveProfile({ name: e.target.value })} /><span className={`hint${(p.name||'').length>40?' over':''}`}>{(p.name||'').length}/60 caracteres</span></label>
                <label className="field">Rol (línea superior)<input maxLength={60} value={p.role || ''} onChange={(e) => saveProfile({ role: e.target.value })} /><span className={`hint${(p.role||'').length>40?' over':''}`}>{(p.role||'').length}/60 caracteres</span></label>
              </div>
              <label className="field">Bio<textarea rows={3} maxLength={160} value={p.bio || ''} onChange={(e) => saveProfile({ bio: e.target.value })} style={{ height:'auto', minHeight:80 }} /><span className={`hint${(p.bio||'').length>160?' over':''}`}>{(p.bio||'').length}/160 caracteres</span></label>
              <div className="switch-row" style={{ borderBottom:0, paddingBottom:0 }}>
                <span><b>Mostrar rol</b><small>La línea con el punto sobre tu nombre</small></span>
                <button className="toggle" role="switch" aria-checked={!!p.show_role} aria-label="Mostrar rol" onClick={() => saveProfile({ show_role: !p.show_role })}><span /></button>
              </div>
            </div>
          </div>
          <p className="note">Imagen vertical 3:4, idealmente con fondo oscuro para que se funda con la página.</p>
        </div>

        {/* Botones de contacto */}
        <div className="card">
          <div className="card-head">
            <div><h2>Botones de contacto</h2><p>Uso libre: WhatsApp, Instagram, Facebook o lo que quieras. Se ven 4; desde el 5.º la fila se desliza.</p></div>
            <button className="btn" onClick={addBtn} style={{ gap:8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              Agregar botón
            </button>
          </div>
          <div className="list" style={{ marginTop:4 }}>
            {buttons.length === 0 && <div className="empty">Sin botones. Agrega el primero.</div>}
            {buttons.map((b, i) => {
              const t = TYPES[b.type] || TYPES.link;
              const err = destValid(b);
              return (
                <div key={b.id}>
                  {i === 4 && <div className="divider">Desde aquí, la fila se desliza en tu página</div>}
                  <div className="srow">
                    {/* Ícono preview */}
                    <span style={{ paddingTop:4 }}>
                      <span className={`p-act-ic${b.highlighted ? ' hl' : ''}`}>
                        <BtnIcon type={b.type} hl={b.highlighted} />
                      </span>
                    </span>
                    {/* Campos */}
                    <div className="fields">
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:14 }}>
                        <label className="field">Tipo
                          <select value={b.type} onChange={(e) => changeType(b.id, e.target.value)}>
                            {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.n}</option>)}
                          </select>
                        </label>
                        <label className="field">Etiqueta
                          <input data-bk="label" maxLength={14} value={b.label || ''} placeholder={t.n} onChange={(e) => saveBtn(b.id, { label: e.target.value })} />
                          <span className={`hint${(b.label||'').length>9?' over':''}`}>Máx. 9 caracteres</span>
                        </label>
                        <label className="field">{t.dest}
                          <input data-bk="dest" value={b.destination || ''} placeholder={t.ph} onChange={(e) => saveBtn(b.id, { destination: e.target.value })} />
                          {err && <span className="hint over">{err}</span>}
                        </label>
                      </div>
                      {b.type === 'whatsapp' && (
                        <label className="field">Mensaje prellenado<input data-bk="msg" value={b.message || ''} onChange={(e) => saveBtn(b.id, { message: e.target.value })} /></label>
                      )}
                      <div className="switch-row" style={{ padding:'10px 0 0', borderTop:0 }}>
                        <span><b>Destacar</b><small>Fondo azul</small></span>
                        <button className="toggle" role="switch" aria-checked={!!b.highlighted} aria-label="Destacar botón" onClick={() => saveBtn(b.id, { highlighted: !b.highlighted })}><span /></button>
                      </div>
                    </div>
                    {/* Herramientas */}
                    <div style={{ display:'flex', flexDirection:'column', gap:4, paddingTop:4 }}>
                      <button className="icon-btn" onClick={() => moveBtn(b.id, -1)} disabled={i === 0} aria-label="Subir"><Ico ic="up" size={18} sw={2} /></button>
                      <button className="icon-btn" onClick={() => moveBtn(b.id, 1)} disabled={i === buttons.length - 1} aria-label="Bajar"><Ico ic="dn" size={18} sw={2} /></button>
                      <button className="icon-btn" onClick={() => removeBtn(b.id)} aria-label="Eliminar botón"><Ico ic="trash" size={18} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Panel derecho: vista previa */}
      <aside className="panel" style={{ alignItems:'center' }}>
        <h2 style={{ alignSelf:'flex-start' }}>Vista previa</h2>
        <div className="preview-box">
          <div className="scaler">
            <MiniPreview profile={p} buttons={buttons} />
          </div>
        </div>
        <a href="/" target="_blank" className="btn" style={{ alignSelf:'stretch', justifyContent:'center', textDecoration:'none' }}>Ver página completa</a>
      </aside>
    </div>
  );
}
