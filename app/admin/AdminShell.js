'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabase } from '../lib/supabase-browser';

const NAV = [
  ['/admin', 'Perfil y acciones'],
  ['/admin/enlaces', 'Enlaces'],
  ['/admin/servicios', 'Servicios'],
  ['/admin/articulos', 'Artículos'],
];

export default function AdminShell({ email, name, children }) {
  const path = usePathname();
  const router = useRouter();

  async function logout() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  const current = NAV.find((n) => n[0] === path) || NAV.find((n) => path.startsWith(n[0]) && n[0] !== '/admin') || NAV[0];

  return (
    <div className="bo">
      <header className="bo-top">
        <button className="home" onClick={() => router.push('/admin')} aria-label="Inicio del panel" title="Perfil">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3F2FEE" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></svg>
        </button>
        <span className="crumb"><span className="mu">fabianibanez.cl / </span><b>{current[1]}</b></span>
        <Link className="tb" href="/" target="_blank">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3F2FEE" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" /></svg>
          Ver mi página
        </Link>
        <button className="tb" onClick={logout}>Cerrar sesión</button>
      </header>
      <div className="bo-wrap">
        <nav className="bo-nav">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className={path === href ? 'on' : ''}>{label}</Link>
          ))}
        </nav>
        <main className="bo-main">{children}</main>
      </div>
    </div>
  );
}
