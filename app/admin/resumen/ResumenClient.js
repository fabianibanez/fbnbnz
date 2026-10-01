'use client';
import { useState } from 'react';

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }).replace('.', '');
}
function pct(x) { return (isFinite(x) ? x : 0).toFixed(1).replace('.', ',') + '%'; }
function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function Delta({ a, b, period, pts }) {
  if (!b) return <span className="delta flat">Sin datos del período anterior</span>;
  if (pts) {
    const d = +(a - b).toFixed(1);
    const cls = d > 0 ? 'up' : d < 0 ? 'down' : 'flat';
    const ar = d > 0 ? 'M12 19V5M6 11l6-6 6 6' : d < 0 ? 'M12 5v14M6 13l6 6 6-6' : 'M5 12h14';
    return <span className={`delta ${cls}`}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d={ar}/></svg>{d > 0 ? '+' : ''}{String(d).replace('.', ',')} pts vs {period} días anteriores</span>;
  }
  const p = Math.round((a - b) / b * 100);
  const cls = p > 0 ? 'up' : p < 0 ? 'down' : 'flat';
  const ar = p > 0 ? 'M12 19V5M6 11l6-6 6 6' : p < 0 ? 'M12 5v14M6 13l6 6 6-6' : 'M5 12h14';
  return <span className={`delta ${cls}`}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d={ar}/></svg>{p > 0 ? '+' : ''}{p}% vs {period} días anteriores</span>;
}

function BarList({ items, accent }) {
  if (!items.length) return <p className="note">Aún no hay datos en este período.</p>;
  const mx = Math.max(...items.map(x => x[1]), 1);
  return (
    <div className="bars">
      {items.map((x, i) => (
        <div className="bar-row" key={i}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x[0]}</span>
          <span className="v">{x[1]}{x[2] ? ` · ${x[2]}` : ''}</span>
          <span className="track"><i className={accent ? 'ac' : ''} style={{ width: `${(x[1] / mx * 100).toFixed(1)}%` }} /></span>
        </div>
      ))}
    </div>
  );
}

export default function ResumenClient({ events, links, actions, services, subs, arts, gaId, gaOn }) {
  const [period, setPeriod] = useState(30);
  const day = 864e5, now = Date.now();
  const cur0 = now - period * day, prev0 = now - 2 * period * day;

  // Convertir eventos de ISO a timestamp
  const evts = events.map(e => ({ ...e, t: new Date(e.created_at).getTime() }));
  const cur = evts.filter(e => e.t >= cur0);
  const prev = evts.filter(e => e.t >= prev0 && e.t < cur0);

  function n(arr, k, id) { return arr.filter(e => e.type === k && (id === undefined || e.object_id === id)).length; }

  const vC = n(cur, 'page_view'), vP = n(prev, 'page_view');
  const cC = n(cur, 'click_link'), cP = n(prev, 'click_link');
  const sC = cur.filter(e => e.type === 'sign_up').length;
  const sP = prev.filter(e => e.type === 'sign_up').length;
  const aC = n(cur, 'click_action'), aP = n(prev, 'click_action');
  const ctrC = vC ? cC / vC * 100 : 0, ctrP = vP ? cP / vP * 100 : 0;

  // Serie diaria para el gráfico
  const bw = period > 30 ? 3 : 1, nb = Math.ceil(period / bw);
  const buckets = Array.from({ length: nb }, (_, i) => ({ v: 0, c: 0, s: now - (period - i * bw) * day }));
  cur.forEach(e => {
    const bi = Math.min(nb - 1, Math.floor((e.t - cur0) / day / bw));
    if (e.type === 'page_view') buckets[bi].v++;
    else if (e.type === 'click_link') buckets[bi].c++;
  });
  const maxV = Math.max(...buckets.map(b => b.v), 1);
  const W = 800, H = 220, gap = 3, bwPx = W / nb;
  const bars = buckets.map((b, i) => { const h = b.v / maxV * (H - 20); return `<rect x="${(i * bwPx + gap / 2).toFixed(1)}" y="${(H - h).toFixed(1)}" width="${Math.max(1, bwPx - gap).toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="var(--bd2)"><title>${fmtDate(new Date(b.s).toISOString())}: ${b.v} visitas, ${b.c} clics</title></rect>`; }).join('');
  const line = buckets.map((b, i) => `${i ? 'L' : 'M'}${(i * bwPx + bwPx / 2).toFixed(1)} ${(H - b.c / maxV * (H - 20)).toFixed(1)}`).join(' ');

  // Fuentes
  const srcCount = {};
  cur.filter(e => e.type === 'page_view').forEach(e => { const k = e.source || 'directo'; srcCount[k] = (srcCount[k] || 0) + 1; });
  const SRC = { instagram: 'Instagram', whatsapp: 'WhatsApp', directo: 'Directo', linkedin: 'LinkedIn', qr: 'Código QR' };
  const srcItems = Object.entries(srcCount).map(([k, v]) => [SRC[k] || k, v, vC ? Math.round(v / vC * 100) + '%' : '']).sort((a, b) => b[1] - a[1]);

  // Enlaces
  const linkItems = links.filter(l => l.visible).map(l => { const c = n(cur, 'click_link', l.id); return [l.title || 'Sin título', c, vC ? pct(c / vC * 100) + ' CTR' : '']; }).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 6);

  // Acciones
  const actItems = actions.map(a => [a.label || a.type, n(cur, 'click_action', a.id)]).sort((a, b) => b[1] - a[1]);

  // Artículos
  const artItems = arts.map(a => [a.title || 'Sin título', n(cur, 'sign_up', a.id), n(cur, 'read_article', a.id) + ' lecturas']).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <>
      <div className="head">
        <div className="t">
          <h1>Resumen</h1>
          <p>Así va fabianibanez.cl en los últimos {period} días, comparado con los {period} anteriores.</p>
        </div>
        <div className="tabs" role="tablist">
          {[7, 30, 90].map(p => (
            <button key={p} className="tab" role="tab" aria-selected={period === p} onClick={() => setPeriod(p)}>{p} días</button>
          ))}
        </div>
      </div>

      {!events.length && (
        <div className="banner">
          <span>Aún no hay datos reales. Visita tu página y los eventos aparecerán aquí en unos minutos.</span>
        </div>
      )}

      {/* KPIs */}
      <div className="kpis">
        <div className="kpi"><span>Visitas</span><b>{vC}</b><Delta a={vC} b={vP} period={period} /></div>
        <div className="kpi"><span>Clics en enlaces</span><b>{cC}</b><Delta a={cC} b={cP} period={period} /></div>
        <div className="kpi"><span>CTR de enlaces</span><b>{pct(ctrC)}</b><Delta a={ctrC} b={ctrP} period={period} pts /></div>
        <div className="kpi"><span>Suscriptores nuevos</span><b>{sC}</b><Delta a={sC} b={sP} period={period} /></div>
      </div>

      {/* Gráfico + fuentes */}
      <div className="grid2">
        <div className="box">
          <h2>Visitas y clics <span className="legend"><span><i style={{ background: 'var(--bd2)' }} />Visitas</span><span><i style={{ background: 'var(--ac)' }} />Clics</span></span></h2>
          <div dangerouslySetInnerHTML={{ __html: `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:220px;display:block" role="img" aria-label="Visitas y clics por día">${bars}<path d="${line}" fill="none" stroke="var(--ac)" strokeWidth="2.5" vector-effect="non-scaling-stroke" strokeLinejoin="round"/></svg><div style="display:flex;justify-content:space-between;font-size:12px;color:var(--mu)"><span>${fmtDate(new Date(cur0).toISOString())}</span><span>Hoy</span></div>` }} />
        </div>
        <div className="box">
          <h2>De dónde llegan <small>visitas</small></h2>
          <BarList items={srcItems} />
        </div>
      </div>

      {/* Grid 3 */}
      <div className="grid3">
        <div className="box"><h2>Enlaces más tocados <small>clics</small></h2><BarList items={linkItems} /></div>
        <div className="box"><h2>Botones de contacto <small>{aC} toques · {aP ? `${Math.round((aC - aP) / aP * 100) > 0 ? '+' : ''}${Math.round((aC - aP) / aP * 100)}%` : '—'}</small></h2><BarList items={actItems} accent /></div>
        <div className="box"><h2>Artículos que traen suscriptores <small>suscripciones</small></h2><BarList items={artItems} /></div>
      </div>

      {/* GA */}
      <div className="ga">
        <span className="dot" style={{ background: gaOn && gaId ? 'var(--tx)' : 'var(--bd2)' }} />
        <div style={{ flex: 1 }}>
          <b>Google Analytics {gaOn && gaId ? <>activo · <span className="code">{gaId}</span></> : 'desactivado'}</b>
          <small style={{ display: 'block', color: 'var(--mu)', fontSize: 13, marginTop: 2 }}>Tu página envía los mismos eventos a GA4. En la versión real, una pestaña aquí mostrará los datos de tu cuenta.</small>
        </div>
        <a href="/admin/ajustes" className="btn">Ajustes</a>
      </div>
    </>
  );
}
