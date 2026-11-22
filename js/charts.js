// Fit mit Herz – einfache SVG-Diagramme (ohne externe Bibliothek)

const W = 340, H = 210, PAD = { l: 38, r: 14, t: 14, b: 30 };
const DAY = 864e5;
const fmtDate = (d) => d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
const n1 = (v) => v.toLocaleString('de-DE', { maximumFractionDigits: 1 });

/**
 * Liniendiagramm.
 * points: [{date:'YYYY-MM-DD', v:Number}]
 * opts: { goal, start, unit, corridor:{ from:'YYYY-MM-DD', start:Number }, label }
 */
export function lineChart(points, opts = {}) {
  const pts = points.map((p) => ({ t: new Date(p.date + 'T12:00:00').getTime(), v: p.v })).sort((a, b) => a.t - b.t);
  if (!pts.length) return `<div class="chart-empty">Noch keine Einträge. Trag deinen ersten Wert ein – dann erscheint hier dein Verlauf.</div>`;
  let t0 = pts[0].t, t1 = pts[pts.length - 1].t;
  if (opts.corridor) t0 = Math.min(t0, new Date(opts.corridor.from + 'T12:00:00').getTime());
  if (t1 - t0 < 14 * DAY) t1 = t0 + 14 * DAY;
  const vals = pts.map((p) => p.v);
  if (opts.goal != null) vals.push(opts.goal);
  if (opts.start != null) vals.push(opts.start);
  let lo = Math.floor(Math.min(...vals) - 1), hi = Math.ceil(Math.max(...vals) + 1);
  if (hi - lo < 4) { hi += 2; lo -= 2; }
  const x = (t) => PAD.l + ((t - t0) / (t1 - t0)) * (W - PAD.l - PAD.r);
  const y = (v) => PAD.t + ((hi - v) / (hi - lo)) * (H - PAD.t - PAD.b);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${opts.label || 'Verlauf'}">`;

  // Gitter + Achsen
  const step = Math.max(1, Math.round((hi - lo) / 5));
  for (let v = lo; v <= hi; v += step) {
    s += `<line class="grid" x1="${PAD.l}" x2="${W - PAD.r}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${PAD.l - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  }
  const ticks = [t0, (t0 + t1) / 2, t1];
  ticks.forEach((t, i) => {
    s += `<text class="ax" x="${x(t)}" y="${H - 8}" text-anchor="${i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}">${fmtDate(new Date(t))}</text>`;
  });

  // Gesunder Korridor 0,25–0,5 kg pro Woche
  if (opts.corridor) {
    const c0 = new Date(opts.corridor.from + 'T12:00:00').getTime();
    const wk = (t1 - c0) / (7 * DAY);
    const a = opts.corridor.start;
    const floorV = opts.goal ?? -Infinity;
    const p1 = [x(c0), y(a)], p2 = [x(t1), y(Math.max(floorV, a - 0.25 * wk))], p3 = [x(t1), y(Math.max(floorV, a - 0.5 * wk))];
    s += `<polygon class="corridor" points="${p1} ${p2} ${p3}"/>`;
  }
  if (opts.goal != null) s += `<line class="goal" x1="${PAD.l}" x2="${W - PAD.r}" y1="${y(opts.goal)}" y2="${y(opts.goal)}"/><text class="goal-t" x="${W - PAD.r}" y="${y(opts.goal) - 5}" text-anchor="end">Ziel ${n1(opts.goal)}</text>`;
  if (opts.start != null) s += `<line class="startl" x1="${PAD.l}" x2="${W - PAD.r}" y1="${y(opts.start)}" y2="${y(opts.start)}"/><text class="start-t" x="${(PAD.l + W - PAD.r) / 2}" y="${y(opts.start) + 14}" text-anchor="middle">Start ${n1(opts.start)}</text>`;

  // Linie + Punkte
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ');
  s += `<path class="line" d="${path}"/>`;
  pts.forEach((p, i) => {
    const last = i === pts.length - 1;
    s += `<circle class="dot${last ? ' last' : ''}" cx="${x(p.t)}" cy="${y(p.v)}" r="${last ? 5 : 3.5}"><title>${fmtDate(new Date(p.t))}: ${n1(p.v)} ${opts.unit || ''}</title></circle>`;
  });
  const lp = pts[pts.length - 1];
  s += `<text class="val" x="${Math.min(x(lp.t), W - PAD.r - 4)}" y="${y(lp.v) - 10}" text-anchor="end">${n1(lp.v)} ${opts.unit || ''}</text>`;
  return s + '</svg>';
}

/** Balken für die Wochenstatistik (Minuten je Tag) */
export function weekBars(days, target = 30) {
  const names = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const max = Math.max(target, ...days.map((d) => d.minutes));
  return `<div class="bars">${days.map((d, i) => `
    <div class="bar-col">
      <div class="bar-val">${d.minutes || ''}</div>
      <div class="bar-track"><div class="bar ${d.done ? 'done' : ''}" style="height:${Math.round((d.minutes / max) * 100)}%"></div>
      <div class="bar-target" style="bottom:${Math.round((target / max) * 100)}%"></div></div>
      <div class="bar-lbl">${names[i]}</div>
    </div>`).join('')}</div>`;
}
