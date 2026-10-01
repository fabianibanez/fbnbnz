'use client';

import { useState } from 'react';
import { createBrowserSupabase, OWNER_EMAIL } from '../../lib/supabase-browser';

export default function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function send() {
    const v = email.trim().toLowerCase();
    if (v !== OWNER_EMAIL) { setErr('Este correo no tiene acceso al panel.'); return; }
    setErr(''); setLoading(true);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email: v,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    setLoading(false);
    if (error) { setErr('No se pudo enviar el enlace. Intenta de nuevo.'); return; }
    setSent(true);
  }

  return (
    <main style={styles.wrap}>
      <div style={styles.card}>
        <span style={styles.dom}>fabianibanez.cl</span>
        {sent ? (
          <>
            <h1 style={styles.h1}>Revisa tu correo</h1>
            <div style={styles.sent}>Enviamos un enlace de acceso a <b>{email}</b>. Ábrelo en este dispositivo para entrar. Vence en 1 hora.</div>
          </>
        ) : (
          <>
            <h1 style={styles.h1}>Entra a tu panel</h1>
            <p style={styles.p}>Te enviamos un enlace de acceso a tu email. Sin contraseñas.</p>
            <label style={styles.label}>Email
              <input type="email" inputMode="email" autoComplete="email" placeholder="nombre@correo.cl"
                     value={email} onChange={(e) => { setEmail(e.target.value); setErr(''); }}
                     onKeyDown={(e) => e.key === 'Enter' && send()} style={styles.input} />
            </label>
            {err ? <span style={styles.err}>{err}</span> : null}
            <button onClick={send} disabled={loading} style={styles.btn}>{loading ? 'Enviando…' : 'Enviarme el enlace'}</button>
            <p style={styles.note}>Solo el dueño de la página puede entrar.</p>
          </>
        )}
      </div>
    </main>
  );
}

const styles = {
  wrap: { minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#07080A', color: '#F2F4F7', fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif", padding: 24 },
  card: { width: 400, maxWidth: '100%', background: '#171A1F', border: '1px solid #2C323B', borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 },
  dom: { fontSize: 13, fontWeight: 700, color: '#9AA3AF' },
  h1: { margin: 0, fontSize: 28, letterSpacing: '-.03em' },
  p: { margin: 0, color: '#9AA3AF', lineHeight: 1.5 },
  label: { display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, fontWeight: 700, color: '#9AA3AF' },
  input: { height: 52, padding: '0 16px', border: '1px solid #3A414C', borderRadius: 14, background: '#07080A', color: '#F2F4F7', fontSize: 16, fontWeight: 400 },
  err: { fontSize: 13, color: '#FF6B6B' },
  btn: { height: 52, border: 0, borderRadius: 14, background: '#3F2FEE', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' },
  note: { margin: 0, fontSize: 12, color: '#9AA3AF' },
  sent: { padding: 16, border: '1px solid #2C323B', borderRadius: 14, lineHeight: 1.5 },
};
