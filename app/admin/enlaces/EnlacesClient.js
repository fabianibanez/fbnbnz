'use client';
import { useRef, useState } from 'react';
import { createBrowserSupabase } from '../../lib/supabase-browser';

const FX = { none:'Sin efecto', pulse:'Pulso', shine:'Brillo', wiggle:'Vibración', border:'Borde' };

function DragIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01"/></svg>;
}
function PlusIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>;
}

export default function EnlacesClient({ profileId, initial }) {
  const supabase = createBrowserSupabase();
  const [links, setLinks] = useState(initial);
  const [selId, setSelId] = useState(null);
  const [toast, setToast] = useState('');
  const toastT = useRef(null);
  const dragId = useRef(null);
  const fileRef = useRef(null);
  const [imgCb, setImgCb] = useState(null);

  const sel = links.find(l => l.id === selId) || null;

  function notify(m) { setToast(m); clearTimeout(toastT.current); toastT.current = setTimeout(() => setToast(''), 2000); }

  async function addLink() {
    const { data, error } = await supabase.from('links')
      .insert({ profile_id: profileId, title: '', url: '', description: '', visible: true, effect: 'none', position: links.length })
      .select().single();
    if (!error && data) { setLinks(ls => [...ls, data]); setSelId(data.id); }
  }
  async function toggleVisible(id) {
    const l = links.find(x => x.id === id);
    const next = !l.visible;
    setLinks(ls => ls.map(x => x.id === id ? { ...x, visible: next } : x));
    await supabase.from('links').update({ visible: next }).eq('id', id);
    notify(next ? 'Enlace visible' : 'Enlace oculto');
  }
  async function saveLink(l, patch) {
    // Si se activa un efecto, apagar los demás
    if (patch.effect && patch.effect !== 'none') {
      await supabase.from('links').update({ effect: 'none' }).eq('profile_id', profileId).neq('id', l.id);
      setLinks(ls => ls.map(x => x.id === l.id ? { ...x, ...patch } : { ...x, effect: 'none' }));
    } else {
      setLinks(ls => ls.map(x => x.id === l.id ? { ...x, ...patch } : x));
    }
    await supabase.from('links').update(patch).eq('id', l.id);
  }
  async function deleteLink(id) {
    if (!confirm('¿Eliminar este enlace? No se puede deshacer.')) return;
    setLinks(ls => ls.filter(x => x.id !== id));
    setSelId(null);
    await supabase.from('links').delete().eq('id', id);
    notify('Enlace eliminado');
  }
  async function reorder(fromId, toId) {
    if (fromId === toId) return;
    const copy = [...links];
    const fi = copy.findIndex(x => x.id === fromId);
    const ti = copy.findIndex(x => x.id === toId);
    const [item] = copy.splice(fi, 1); copy.splice(ti, 0, item);
    copy.forEach((l, i) => { l.position = i; });
    setLinks(copy);
    await Promise.all(copy.map(l => supabase.from('links').update({ position: l.position }).eq('id', l.id)));
    notify('Orden actualizado');
  }

  function pickImage(cb) {
    setImgCb(() => cb);
    fileRef.current.click();
  }
  function onFileChange(e) {
    const f = e.target.files[0]; if (!f || !imgCb) return;
    const img = new window.Image(), r = new FileReader();
    r.onload = () => { img.onload = () => {
      const max = 800, s = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement('canvas'); cv.width = Math.round(img.width*s); cv.height = Math.round(img.height*s);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      imgCb(cv.toDataURL('image/jpeg', .8));
    }; img.src = r.result; };
    r.readAsDataURL(f);
    e.target.value = '';
  }

  // Contar visibles para el divisor
  let visCount = 0;

  return (
    <div style={{ display:'flex', flex:1, minWidth:0, overflow:'hidden' }}>
      {/* Lista */}
      <div className="content">
        <div className="head">
          <div className="t"><h1>Enlaces</h1><p>Los primeros 4 visibles se muestran siempre. Desde el quinto aparecen tras «Ver más».</p></div>
          <button className="btn primary" onClick={addLink} style={{ gap:8 }}><PlusIcon />Nuevo enlace</button>
        </div>
        <div className="list" id="linkList">
          {links.length === 0 && <div className="empty">Aún no tienes enlaces. Crea el primero.</div>}
          {links.map((l) => {
            if (l.visible) visCount++;
            const showDivider = l.visible && visCount === 5;
            return (
              <div key={l.id}>
                {showDivider && <div className="divider">Ocultos tras «Ver más»</div>}
                <div
                  className={`lrow${l.id === selId ? ' sel' : ''}${!l.visible ? ' off' : ''}`}
                  onClick={() => setSelId(l.id === selId ? null : l.id)}
                  draggable
                  onDragStart={() => { dragId.current = l.id; }}
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => { e.preventDefault(); reorder(dragId.current, l.id); dragId.current = null; }}
                  tabIndex={0}
                  aria-label={`Editar ${l.title || 'Sin título'}`}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelId(l.id); } }}
                >
                  <button className="drag" aria-label="Arrastrar para ordenar" onClick={(e) => e.stopPropagation()}><DragIcon /></button>
                  <span className="thumb" style={l.thumbnail_url ? { backgroundImage:`url(${l.thumbnail_url})` } : {}} />
                  <span className="lt">
                    <b>{l.title || 'Sin título'}{l.effect && l.effect !== 'none' ? <span className="fxchip">{FX[l.effect]}</span> : null}</b>
                    <small>{l.url || 'Sin URL'}{!l.visible ? ' · oculto' : ''}</small>
                  </span>
                  <span className="lclicks">{l.clicks || 0} clics</span>
                  <span className="ltog" onClick={(e) => e.stopPropagation()}>
                    <button className="toggle" role="switch" aria-checked={!!l.visible} aria-label="Visible en la página" onClick={() => toggleVisible(l.id)}><span /></button>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Panel derecho */}
      {sel
        ? <LinkPanel key={sel.id} link={sel} links={links} onSave={saveLink} onDelete={deleteLink} onCancel={() => { if (!sel.title && !sel.url) { setLinks(ls => ls.filter(x => x.id !== sel.id)); supabase.from('links').delete().eq('id', sel.id); } setSelId(null); }} pickImage={pickImage} notify={notify} />
        : <aside className="panel"><h2>Editar enlace</h2><p className="note">Selecciona un enlace para editarlo, o crea uno nuevo. Arrastra desde la manija para cambiar el orden.</p></aside>
      }

      <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={onFileChange} />
      {toast && <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:'var(--tx)', color:'var(--bg)', padding:'12px 20px', borderRadius:14, fontWeight:700, fontSize:14, zIndex:40, whiteSpace:'nowrap' }}>{toast}</div>}
    </div>
  );
}

function LinkPanel({ link, links, onSave, onDelete, onCancel, pickImage, notify }) {
  const [title, setTitle] = useState(link.title || '');
  const [url, setUrl] = useState(link.url || '');
  const [desc, setDesc] = useState(link.description || '');
  const [visible, setVisible] = useState(link.visible !== false);
  const [img, setImg] = useState(link.thumbnail_url || '');
  const [fx, setFx] = useState(link.effect || 'none');
  const [titleErr, setTitleErr] = useState('');
  const [urlErr, setUrlErr] = useState('');
  const pos = links.indexOf(link) + 1;

  async function save() {
    if (!title.trim()) { setTitleErr('Escribe un título'); return; }
    if (title.length > 50) { setTitleErr('Máximo 50 caracteres'); return; }
    if (!/^https?:\/\/\S+/.test(url)) { setUrlErr('La URL debe empezar con https://'); return; }
    const hadOtherFx = fx !== 'none' && links.some(l => l.id !== link.id && l.effect && l.effect !== 'none');
    await onSave(link, { title: title.trim(), url, description: desc.trim(), visible, thumbnail_url: img, effect: fx });
    if (hadOtherFx) setTimeout(() => notify('Se quitó el destacado del otro enlace'), 300);
    notify('Enlace guardado');
  }

  return (
    <aside className="panel">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h2>{link.title ? 'Editar enlace' : 'Nuevo enlace'}</h2>
        <span className="note">Posición {pos}</span>
      </div>

      <div className="field">Miniatura
        <div className="thumb-edit">
          <span className="thumb" style={img ? { backgroundImage:`url(${img})` } : {}} />
          <span style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <button className="btn" style={{ height:36 }} onClick={() => pickImage(d => setImg(d))}>Cambiar imagen</button>
            <span className="hint">Cuadrada, mín. 200 px</span>
          </span>
        </div>
      </div>

      <label className="field">Título
        <input maxLength={80} value={title} onChange={e => { setTitle(e.target.value); setTitleErr(''); }} placeholder="Ej.: Mi portafolio" />
        <span className={`hint${titleErr || title.length > 50 ? ' over' : ''}`}>{titleErr || `${title.length}/50 caracteres`}</span>
      </label>

      <label className="field">URL de destino
        <input type="url" value={url} onChange={e => { setUrl(e.target.value); setUrlErr(''); }} placeholder="https://" />
        {urlErr && <span className="hint over">{urlErr}</span>}
      </label>

      <label className="field">Descripción (opcional)
        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Una línea" />
        <span className="hint">Una línea; se corta si es más larga</span>
      </label>

      <div className="field">Destacar con movimiento
        <div className="fx-demo">
          {Object.entries(FX).map(([k, v]) => (
            <button key={k} className="fx-opt" aria-pressed={fx === k} onClick={() => setFx(k)} style={fx === k ? { borderColor:'var(--ac)', color:'var(--tx)', background:'var(--su)' } : {}}>{v}</button>
          ))}
        </div>
        <span className="hint">Solo un enlace puede destacarse a la vez. Mira el efecto en «Ver mi página».</span>
      </div>

      <div className="switch-row">
        <span><b>Visible en la página</b><small>Ocúltalo sin perder sus datos</small></span>
        <button className="toggle" role="switch" aria-checked={visible} aria-label="Visible en la página" onClick={() => setVisible(!visible)}><span /></button>
      </div>

      <div className="actions">
        <button className="btn ghost" onClick={() => onDelete(link.id)}>Eliminar</button>
        <span className="grow" />
        <button className="btn" onClick={onCancel}>Cancelar</button>
        <button className="btn primary" onClick={save}>Guardar</button>
      </div>
    </aside>
  );
}
