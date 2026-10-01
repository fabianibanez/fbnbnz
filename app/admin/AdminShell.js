'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { createBrowserSupabase } from '../lib/supabase-browser';

const NAV = [
  ['/admin', 'Perfil y acciones'],
  ['/admin/enlaces', 'Enlaces'],
  ['/admin/servicios', 'Servicios'],
  ['/admin/articulos', 'Artículos'],
];

export default function AdminShell({ email, children }) {
  const path = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(null); // 'nav' | 'user' | null

  async function logout() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  const current = NAV.find((n) => n[0] === path)
    || NAV.find((n) => n[0] !== '/admin' && path.startsWith(n[0]))
    || NAV[0];

  return (
    <div className="bo" onClick={() => menu && setMenu(null)}>
      <header className="bo-top" onClick={(e) => e.stopPropagation()}>
        <button className="tb" onClick={() => router.push('/admin')} aria-label="Inicio" title="Perfil y acciones">
          <svg className="home" width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></svg>
        </button>
        <div style={{ position: 'relative' }}>
          <button className="crumb" aria-haspopup="menu" aria-expanded={menu === 'nav'} onClick={() => setMenu(menu === 'nav' ? null : 'nav')}>
            <span className="dom">fabianibanez.cl /</span><span className="sec">{current[1]}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9AA3AF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
          </button>
          {menu === 'nav' && (
            <div className="pop" role="menu" style={{ left: 0 }}>
              <div className="ph">Ir a</div>
              {NAV.map(([href, label]) => (
                <button key={href} className={`mi${path === href ? ' on' : ''}`} onClick={() => { setMenu(null); router.push(href); }}>{label}</button>
              ))}
            </div>
          )}
        </div>
        <div className="grow" />
        <Link className="btn" href="/" target="_blank">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3F2FEE" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" /></svg>
          <span>Ver mi página</span>
        </Link>
        <div style={{ position: 'relative' }}>
          <button className="avatar" aria-haspopup="menu" aria-expanded={menu === 'user'} onClick={() => setMenu(menu === 'user' ? null : 'user')} aria-label="Tu cuenta">FI</button>
          {menu === 'user' && (
            <div className="pop" role="menu" style={{ right: 0 }}>
              <div className="who"><b>Fabián Ibáñez</b><small>{email}</small></div>
              <div className="sep" />
              <button className="mi" onClick={() => { setMenu(null); router.push('/admin'); }}>Perfil y acciones</button>
              <button className="mi" onClick={() => { setMenu(null); window.open('/', '_blank'); }}>Ver mi página</button>
              <div className="sep" />
              <button className="mi danger" onClick={logout}>Cerrar sesión</button>
            </div>
          )}
        </div>
      </header>
      <div className="bo-wrap">
        <nav className="bo-nav" onClick={(e) => e.stopPropagation()}>
          {NAV.map(([href, label]) => <Link key={href} href={href} className={path === href ? 'on' : ''}>{label}</Link>)}
        </nav>
        <main className="bo-main">{children}</main>
      </div>
    </div>
  );
}
