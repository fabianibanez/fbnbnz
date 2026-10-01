'use client';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { createBrowserSupabase } from '../lib/supabase-browser';

const NAV = [
  ['/admin/resumen', 'Resumen', 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z'],
  ['/admin', 'Perfil y acciones', 'M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z'],
  ['/admin/enlaces', 'Enlaces', 'M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1'],
  ['/admin/servicios', 'Servicios', 'M3 5h4v4H3zM10 5h4v4h-4zM17 5h4v4h-4zM3 12h4v4H3zM10 12h4v4h-4zM17 12h4v4h-4z'],
  ['/admin/articulos', 'Artículos', 'M6 3h12l3 6-9 12L3 9z'],
];

export default function AdminShell({ email, children }) {
  const path = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function logout() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  function copyLink() {
    const url = 'https://fabianibanez.cl';
    navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  }

  const current = NAV.find((n) => n[0] === path) || NAV.find((n) => n[0] !== '/admin' && path.startsWith(n[0])) || NAV[0];

  return (
    <div className="bo" onClick={() => menu && setMenu(null)}>
      <header className="bo-top" onClick={(e) => e.stopPropagation()}>
        {/* Casa */}
        <button className="tb" onClick={() => router.push('/admin/resumen')} aria-label="Inicio" title="Inicio">
          <svg className="home" width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>
        </button>
        {/* Breadcrumb con menú */}
        <div style={{ position: 'relative' }}>
          <button className="crumb" aria-haspopup="menu" aria-expanded={menu === 'nav'} onClick={() => setMenu(menu === 'nav' ? null : 'nav')}>
            <span className="dom">fabianibanez.cl /</span>
            <span className="sec">{current[1]}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9AA3AF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          {menu === 'nav' && (
            <div className="pop" role="menu" style={{ left: 0 }}>
              <div className="ph">Ir a</div>
              {NAV.map(([href, label, icon]) => (
                <button key={href} className={`mi${path === href ? ' on' : ''}`} role="menuitem" onClick={() => { setMenu(null); router.push(href); }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={path === href ? 'var(--ac)' : 'var(--mu)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={icon}/></svg>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="grow" />
        {/* Campana */}
        <button className="tb" aria-label="Novedades" title="Novedades">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0"/></svg>
        </button>
        {/* Copiar enlace */}
        <button className="tb" onClick={copyLink} aria-label={copied ? 'Copiado' : 'Copiar enlace'} title={copied ? 'Copiado' : 'Copiar enlace de tu página'}>
          {copied
            ? <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            : <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/></svg>}
        </button>
        {/* Ver mi página */}
        <Link className="vbtn" href="/" target="_blank" rel="noopener">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3F2FEE" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/></svg>
          <span>Ver mi página</span>
        </Link>
        {/* Contraer menú */}
        <button className="tb" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'} title={collapsed ? 'Expandir menú' : 'Contraer menú'}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></svg>
        </button>
        {/* Avatar */}
        <div style={{ position: 'relative' }}>
          <button className="avatar" aria-haspopup="menu" aria-expanded={menu === 'user'} onClick={() => setMenu(menu === 'user' ? null : 'user')} aria-label="Tu cuenta">FI</button>
          {menu === 'user' && (
            <div className="pop" role="menu" style={{ right: 0 }}>
              <div className="who"><b>Fabián Ibáñez</b><small>{email}</small></div>
              <div className="sep" />
              <button className="mi" role="menuitem" onClick={() => { setMenu(null); router.push('/admin'); }}>Perfil y acciones</button>
              <button className="mi" role="menuitem" onClick={() => { setMenu(null); window.open('/', '_blank'); }}>Ver mi página</button>
              <div className="sep" />
              <button className="mi danger" role="menuitem" onClick={logout}>Cerrar sesión</button>
            </div>
          )}
        </div>
      </header>

      <div className="bo-wrap">
        <nav className={`bo-nav${collapsed ? ' collapsed' : ''}`} onClick={(e) => e.stopPropagation()}>
          {NAV.map(([href, label, icon]) => (
            <Link key={href} href={href} className={path === href ? 'on' : ''} title={collapsed ? label : ''}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={path === href ? 'var(--ac)' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={icon}/></svg>
              {!collapsed && label}
            </Link>
          ))}
        </nav>
        <main className="bo-main">{children}</main>
      </div>
    </div>
  );
}
