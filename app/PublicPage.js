'use client';

import { useEffect, useRef, useState } from 'react';

// --- Íconos (SVG dibujados; no usamos librerías de marca) ---
const stroke = { fill: 'none', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' };
function Icon({ type, color = '#F2F4F7', size = 22 }) {
  const mono = { instagram: 'IG', facebook: 'FB', tiktok: 'TT', linkedin: 'in', youtube: 'YT', x: 'X' }[type];
  if (mono) return <span style={{ color, fontWeight: 700, fontSize: 15 }}>{mono}</span>;
  const paths = {
    whatsapp: <path d="M4 20l1.4-4A8 8 0 1 1 9 19.6z" />,
    call: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
    agenda: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4" /></>,
    email: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
    link: <path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...stroke}>{paths[type] || paths.link}</svg>;
}
const SERVICE_ICONS = {
  web: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M7 6.5h.01M10 6.5h.01" /></>,
  shop: <><path d="M5 8h14l-1 12H6z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  ai: <><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M10 10h4v4h-4zM9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" /></>,
  talk: <><path d="M4 5h16v11H9l-5 4z" /><path d="M8 10h8M8 13h5" /></>,
  doc: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 13h6M9 17h6" /></>,
  chart: <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />,
  img: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 16l5-5 4 4 3-3 6 6" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
};
const ShareIcon = ({ c }) => <svg width="18" height="18" viewBox="0 0 24 24" stroke={c} {...stroke}><path d="M12 3v12M7 8l5-5 5 5M5 13v6h14v-6" /></svg>;
const Arrow = () => <svg width="16" height="16" viewBox="0 0 24 24" stroke="#9AA3AF" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg>;

function buttonHref(b) {
  const d = (b.destination || '').trim();
  if (!d) return null;
  if (b.type === 'whatsapp') return `https://wa.me/${d.replace(/\D/g, '')}${b.message ? `?text=${encodeURIComponent(b.message)}` : ''}`;
  if (b.type === 'call') return `tel:${d.replace(/\s/g, '')}`;
  if (b.type === 'email') return `mailto:${d}`;
  return d;
}

// Registra un evento en el servidor sin bloquear la navegación.
function track(type, extra = {}) {
  try {
    const body = JSON.stringify({ type, ...extra });
    if (navigator.sendBeacon) navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
    else fetch('/api/track', { method: 'POST', body, keepalive: true });
  } catch (e) { /* la analítica nunca frena a la persona */ }
}

export default function PublicPage({ profile, buttons, links, services, sections, articles }) {
  const [expanded, setExpanded] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const [toast, setToast] = useState('');
  const nameRef = useRef(null);
  const toastTimer = useRef(null);

  const servicesSection = sections.services || { title: '¿En qué te puedo ayudar?', subtitle: '', visible: true };

  // Contar la visita una vez
  useEffect(() => {
    const src = new URLSearchParams(window.location.search).get('src') || (document.referrer ? 'referrer' : 'directo');
    track('page_view', { source: src, device: window.innerWidth < 700 ? 'movil' : 'escritorio' });
  }, []);

  // Barra compacta al pasar el nombre
  useEffect(() => {
    if (!nameRef.current || !('IntersectionObserver' in window)) return;
    const ob = new IntersectionObserver(([e]) => {
      setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0);
    });
    ob.observe(nameRef.current);
    return () => ob.disconnect();
  }, []);

  function notify(m) {
    setToast(m); clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  }

  function share() {
    const url = 'https://fabianibanez.cl';
    track('click_share');
    if (navigator.share) { navigator.share({ title: profile.name, url }).catch(() => {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => notify('Enlace copiado'), () => notify(url));
    else notify(url);
  }

  const shownLinks = expanded ? links : links.slice(0, 4);
  const rest = links.length - 4;

  return (
    <>
      <div className={`bar${showBar ? ' show' : ''}`} aria-hidden={!showBar}>
        <div className="in">
          <b>{profile.name}</b>
          <button className="share dark" onClick={share} aria-label="Compartir" tabIndex={showBar ? 0 : -1}><ShareIcon c="#F2F4F7" /></button>
        </div>
      </div>

      <main className="page">
        <header className="hero" style={profile.image_url ? { backgroundImage: `url(${profile.image_url})` } : undefined}>
          {!profile.image_url && <span className="ph">[Tu foto 3:4]</span>}
          <button className="share" onClick={share} aria-label="Compartir esta página"><ShareIcon c="#07080A" /></button>
          <div className="txt">
            {profile.show_role && profile.role ? <span className="role"><i />{profile.role}</span> : null}
            <h1 ref={nameRef}>{profile.name}</h1>
            {profile.bio ? <p>{profile.bio}</p> : null}
          </div>
        </header>

        <ContactRow buttons={buttons} notify={notify} />

        {links.length > 0 && (
          <section className="links" aria-label="Enlaces">
            {shownLinks.map((l) => {
              const href = (l.url || '').trim() || '#';
              return (
                <a key={l.id} className={`link${l.effect && l.effect !== 'none' ? ` fx-${l.effect}` : ''}`}
                   href={href} target="_blank" rel="noopener"
                   onClick={(e) => { track('click_link', { object_id: l.id }); if (href === '#') { e.preventDefault(); notify('Este enlace aún no tiene destino'); } }}>
                  <span className="th" style={l.thumbnail_url ? { backgroundImage: `url(${l.thumbnail_url})` } : undefined} />
                  <span className="lt"><b>{l.title}</b>{l.description ? <small>{l.description}</small> : null}</span>
                  <Arrow />
                </a>
              );
            })}
            {rest > 0 && (
              <button className="more" onClick={() => { if (!expanded) track('click_load_more'); setExpanded(!expanded); }}>
                {expanded ? 'Ver menos' : `Ver ${rest} ${rest === 1 ? 'enlace' : 'enlaces'} más`}
              </button>
            )}
          </section>
        )}

        {servicesSection.visible && services.length > 0 && (
          <ServicesCarousel section={servicesSection} services={services} notify={notify} />
        )}

        {articles.length > 0 && <Blog articles={articles} />}

        <Newsletter profile={profile} />

        <p className="foot">¿Te gustó este servicio? <a href="mailto:hola@miprimeraweb.cl">Escríbeme</a></p>
      </main>

      <div className={`toast${toast ? ' show' : ''}`} role="status" aria-live="polite">{toast}</div>
    </>
  );
}

// --- Fila de botones de contacto con deslizamiento si son más de 4 ---
function ContactRow({ buttons, notify }) {
  const ref = useRef(null);
  const dotsRef = useRef(null);
  const scroll = buttons.length > 4;

  useDragScroll(ref, scroll);
  const dotsCount = Math.max(0, buttons.length - 3);

  useEffect(() => {
    if (!scroll || !ref.current) return;
    const row = ref.current;
    const sync = () => {
      const items = row.children;
      if (!items.length) return;
      const step = items[0].offsetWidth + 14;
      const end = row.scrollLeft >= row.scrollWidth - row.clientWidth - 2;
      const i = end ? dotsCount - 1 : Math.min(Math.round(row.scrollLeft / step), dotsCount - 1);
      if (dotsRef.current) [...dotsRef.current.children].forEach((d, k) => d.classList.toggle('on', k === i));
    };
    row.addEventListener('scroll', sync, { passive: true });
    sync();
    return () => row.removeEventListener('scroll', sync);
  }, [scroll, dotsCount]);

  return (
    <>
      <nav className={`actions${scroll ? ' scroll' : ''}`} ref={ref} aria-label="Contacto">
        {buttons.map((b) => {
          const href = buttonHref(b);
          return (
            <a key={b.id} className={`act${b.highlighted ? ' hl' : ''}`}
               href={href || '#'} target={href ? '_blank' : undefined} rel="noopener"
               onClick={(e) => { track('click_action', { object_id: b.id }); if (!href) { e.preventDefault(); notify(`Falta el enlace de ${b.label}`); } }}>
              <span className="ic"><Icon type={b.type} color={b.highlighted ? '#fff' : '#F2F4F7'} size={b.highlighted ? 24 : 22} /></span>
              <span className="lb">{b.label}</span>
            </a>
          );
        })}
      </nav>
      {scroll && <div className="dots adots" ref={dotsRef} aria-hidden>{Array.from({ length: dotsCount }).map((_, i) => <span key={i} />)}</div>}
    </>
  );
}

function ServicesCarousel({ section, services, notify }) {
  const ref = useRef(null);
  const dotsRef = useRef(null);
  useDragScroll(ref, true);

  useEffect(() => {
    const row = ref.current;
    if (!row) return;
    const sync = () => {
      const items = row.children;
      if (!items.length) return;
      const step = items[0].offsetWidth + 12;
      const end = row.scrollLeft >= row.scrollWidth - row.clientWidth - 2;
      const i = end ? services.length - 1 : Math.min(Math.round(row.scrollLeft / step), services.length - 1);
      if (dotsRef.current) [...dotsRef.current.children].forEach((d, k) => d.classList.toggle('on', k === i));
    };
    row.addEventListener('scroll', sync, { passive: true });
    sync();
    return () => row.removeEventListener('scroll', sync);
  }, [services.length]);

  return (
    <section className="sec" aria-label={section.title}>
      <div className="sec-head">
        <h2>{section.title}</h2>
        {section.subtitle ? <p className="sub">{section.subtitle}</p> : null}
      </div>
      <div className="carousel" ref={ref}>
        {services.map((s) => {
          const href = `https://wa.me/56945152556?text=${encodeURIComponent(s.message || '')}`;
          return (
            <a key={s.id} className="card" href={href} target="_blank" rel="noopener"
               onClick={() => track('click_service', { object_id: s.id })}>
              <svg width="34" height="34" viewBox="0 0 24 24" stroke="#3F2FEE" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{SERVICE_ICONS[s.icon] || SERVICE_ICONS.web}</svg>
              <b>{s.title || 'Servicio'}</b>
              <small>{s.description}</small>
              <em><svg width="14" height="14" viewBox="0 0 24 24" stroke="#3F2FEE" fill="none" strokeWidth="2.2" strokeLinejoin="round"><path d="M4 20l1.4-4A8 8 0 1 1 9 19.6z" /></svg>Conversemos</em>
            </a>
          );
        })}
      </div>
      <div className="dots" ref={dotsRef} aria-hidden>{services.map((_, i) => <span key={i} />)}</div>
    </section>
  );
}

function Blog({ articles }) {
  const [all, setAll] = useState(false);
  const list = all ? articles : articles.slice(0, 3);
  const f = list[0];
  const min = (a) => {
    const el = typeof document !== 'undefined' ? document.createElement('div') : null;
    if (el) { el.innerHTML = a.body || ''; }
    const words = (el ? el.textContent : '').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  };
  return (
    <section className="sec" aria-label="Últimas publicaciones">
      <div className="sec-head"><h2>Últimas publicaciones</h2></div>
      <div className="links" style={{ paddingTop: 0 }}>
        <a className="post" href={`/blog/${f.slug}`} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span className="th" style={{ width: '100%', height: 'auto', aspectRatio: '16/9', borderRadius: 20, display: 'grid', placeItems: 'center', color: '#9AA3AF', fontSize: 13, ...(f.cover_url ? { backgroundImage: `url(${f.cover_url})` } : {}) }}>{f.cover_url ? '' : '[Portada 16:9]'}</span>
          <span style={{ fontSize: 12, color: '#9AA3AF' }}>{f.category || 'Artículo'} · {min(f)} min de lectura</span>
          <b style={{ fontSize: 20, lineHeight: 1.25, letterSpacing: '-.015em' }}>{f.title}</b>
          {f.excerpt ? <small style={{ fontSize: 14, lineHeight: 1.5, color: '#9AA3AF' }}>{f.excerpt}</small> : null}
        </a>
        {list.slice(1).map((p) => (
          <a key={p.id} className="mini" href={`/blog/${p.slug}`} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '16px 0', borderTop: '1px solid #2C323B' }}>
            <span style={{ fontSize: 12, color: '#9AA3AF' }}>{p.category || 'Artículo'} · {min(p)} min de lectura</span>
            <b style={{ fontSize: 16, lineHeight: 1.3 }}>{p.title}</b>
          </a>
        ))}
        {articles.length > 3 && <button className="more" onClick={() => setAll(!all)}>{all ? 'Ver menos' : 'Ver más publicaciones'}</button>}
      </div>
    </section>
  );
}

function Newsletter({ profile }) {
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    const v = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { setErr('Revisa el email: nombre@correo.cl'); return; }
    setErr(''); setSending(true);
    try {
      const r = await fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'sign_up', email: v, source: 'Página principal' }) });
      if (!r.ok) throw new Error();
      setDone(true);
    } catch (e) { setErr('No pudimos suscribirte. Intenta de nuevo.'); }
    setSending(false);
  }

  if (done) {
    return (
      <section className="news">
        <h2>Revisa tu correo</h2>
        <div className="ok">Te enviamos un enlace a <b>{email}</b>. Confírmalo para empezar a recibir el newsletter.</div>
      </section>
    );
  }
  return (
    <section className="news" aria-label="Newsletter">
      <h2>{profile.newsletter_title || 'Newsletter'}</h2>
      {profile.newsletter_description ? <p>{profile.newsletter_description}</p> : null}
      <label>Tu email
        <input type="email" inputMode="email" autoComplete="email" placeholder="nombre@correo.cl"
               value={email} aria-invalid={!!err} onChange={(e) => { setEmail(e.target.value); setErr(''); }} />
      </label>
      <span className="err">{err}</span>
      <button onClick={submit} disabled={sending}>{sending ? 'Enviando…' : 'Suscribirme'}</button>
      <span className="fine">Sin spam. Puedes darte de baja cuando quieras.</span>
    </section>
  );
}

// Deslizar con el mouse (en el teléfono el dedo ya funciona nativo)
function useDragScroll(ref, enabled) {
  useEffect(() => {
    if (!enabled || !ref.current) return;
    const el = ref.current;
    let drag = null, moved = false;
    const down = (e) => { if (e.pointerType !== 'mouse' || e.button !== 0) return; drag = { x: e.clientX, left: el.scrollLeft }; moved = false; };
    const move = (e) => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 4) { moved = true; el.classList.add('dragging'); } if (moved) el.scrollLeft = drag.left - dx; };
    const up = () => { if (!drag) return; drag = null; if (moved) el.classList.remove('dragging'); };
    const click = (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } };
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    el.addEventListener('click', click, true);
    return () => { el.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); el.removeEventListener('click', click, true); };
  }, [ref, enabled]);
}
