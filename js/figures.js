// Fit mit Herz – Übungsfiguren
// Eigene SVG-Strichfiguren, berechnet aus Gelenkwinkeln (Vorwärtskinematik).
// Winkel in Grad: 0 = nach unten, 90 = nach rechts (Blickrichtung), 180 = nach oben, 270 = nach links.

const LEN = { torso: 48, neck: 7, head: 11, ua: 27, fa: 25, th: 40, sh: 40, ft: 11 };
export const GROUND = 197;
const NS = 'http://www.w3.org/2000/svg';

const DEF = {
  v: 'side', x: 120, y: 112, t: 180, h: 180, c: 0, su: 0, n: 0,
  a1: 0, f1: 0, a2: 0, f2: 0, l1: 0, s1: 0, l2: 0, s2: 0, p1: 90, p2: 90,
  thS1: 1, thS2: 1,
};

const rad = (d) => (d * Math.PI) / 180;
const go = (p, a, len) => [p[0] + len * Math.sin(rad(a)), p[1] + len * Math.cos(rad(a))];
const r1 = (n) => Math.round(n * 10) / 10;

/** Berechnet alle Körperpunkte einer Pose. */
export function solve(pose) {
  const p = { ...DEF, ...pose };
  const front = p.v === 'front';
  const hip = [p.x, p.y];
  const sh = go(hip, p.t, LEN.torso);
  const d = [Math.sin(rad(p.t)), Math.cos(rad(p.t))];
  const perp = [-d[1], d[0]];
  const back = [d[1], -d[0]];
  const so = front ? 15 : 0;
  const ho = front ? 9 : 0;
  const S1 = [sh[0] - perp[0] * so, sh[1] - perp[1] * so - p.su];
  const S2 = [sh[0] + perp[0] * so, sh[1] + perp[1] * so - p.su];
  const H1 = [hip[0] - perp[0] * ho, hip[1] - perp[1] * ho];
  const H2 = [hip[0] + perp[0] * ho, hip[1] + perp[1] * ho];
  const nk = go([sh[0], sh[1] - p.su * 0.4], p.h, LEN.neck);
  const head = go(nk, p.h, LEN.head);
  const E1 = go(S1, p.a1, LEN.ua), W1 = go(E1, p.f1, LEN.fa);
  const E2 = go(S2, p.a2, LEN.ua), W2 = go(E2, p.f2, LEN.fa);
  const ftL = front ? 7 : LEN.ft;
  const K1 = go(H1, p.l1, LEN.th * p.thS1), A1 = go(K1, p.s1, LEN.sh), T1 = go(A1, p.p1, ftL);
  const K2 = go(H2, p.l2, LEN.th * p.thS2), A2 = go(K2, p.s2, LEN.sh), T2 = go(A2, p.p2, ftL);
  const mid = [(hip[0] + sh[0]) / 2 + back[0] * p.c, (hip[1] + sh[1]) / 2 + back[1] * p.c];
  const axis = [Math.sin(rad(p.h)), Math.cos(rad(p.h))];
  const faceDir = [-Math.cos(rad(p.h)), Math.sin(rad(p.h))]; // Blickrichtung (Seitenansicht)
  const right = [-axis[1], axis[0]];
  return { p, front, hip, sh, S1, S2, H1, H2, nk, head, E1, W1, E2, W2, K1, A1, T1, K2, A2, T2, mid, axis, faceDir, right };
}

function el(name, attrs = {}, parent) {
  const e = document.createElementNS(NS, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

function drawProps(svg, pose) {
  const g = el('g', { class: 'fig-prop' }, svg);
  el('line', { x1: 8, y1: GROUND + 4, x2: 232, y2: GROUND + 4, class: 'fig-ground' }, g);
  const prop = pose.prop;
  if (!prop) return;
  const list = Array.isArray(prop) ? prop : [prop];
  for (const pr of list) {
    if (pr === 'mat') el('rect', { x: 14, y: GROUND, width: 212, height: 5, rx: 2.5, class: 'fig-mat' }, g);
    if (pr === 'chair') {
      el('rect', { x: 86, y: 156, width: 56, height: 6, rx: 2, class: 'fig-chair' }, g);
      el('line', { x1: 90, y1: 160, x2: 90, y2: GROUND + 3, class: 'fig-chair-l' }, g);
      el('line', { x1: 138, y1: 160, x2: 138, y2: GROUND + 3, class: 'fig-chair-l' }, g);
      el('line', { x1: 89, y1: 158, x2: 84, y2: 104, class: 'fig-chair-l' }, g);
    }
    if (pr === 'chairF') {
      el('rect', { x: 97, y: 92, width: 46, height: 52, rx: 5, class: 'fig-chair-back' }, g);
      el('rect', { x: 94, y: 143, width: 52, height: 6, rx: 2, class: 'fig-chair' }, g);
      el('line', { x1: 98, y1: 148, x2: 98, y2: GROUND + 3, class: 'fig-chair-l' }, g);
      el('line', { x1: 142, y1: 148, x2: 142, y2: GROUND + 3, class: 'fig-chair-l' }, g);
    }
    if (pr === 'chairR') {
      el('line', { x1: 168, y1: 96, x2: 172, y2: 150, class: 'fig-chair-l' }, g);
      el('rect', { x: 168, y: 148, width: 46, height: 6, rx: 2, class: 'fig-chair' }, g);
      el('line', { x1: 172, y1: 152, x2: 172, y2: GROUND + 3, class: 'fig-chair-l' }, g);
      el('line', { x1: 210, y1: 152, x2: 210, y2: GROUND + 3, class: 'fig-chair-l' }, g);
    }
    if (pr === 'chairB') {
      el('rect', { x: 52, y: 152, width: 50, height: 6, rx: 2, class: 'fig-chair' }, g);
      el('line', { x1: 56, y1: 156, x2: 56, y2: GROUND + 3, class: 'fig-chair-l' }, g);
      el('line', { x1: 98, y1: 156, x2: 98, y2: GROUND + 3, class: 'fig-chair-l' }, g);
      el('line', { x1: 55, y1: 154, x2: 50, y2: 100, class: 'fig-chair-l' }, g);
    }
    if (pr === 'wall') {
      const x = pose.wall || 190;
      el('rect', { x, y: 14, width: 10, height: GROUND - 10, class: 'fig-wall' }, g);
    }
  }
}

/** Erstellt eine Figur. frames: Liste von Posen (Ping-Pong-Animation). */
export function createFigure(frames, opts = {}) {
  const svg = el('svg', { viewBox: '0 0 240 210', class: 'figure', role: 'img', 'aria-label': opts.label || 'Übungsfigur' });
  drawProps(svg, frames[0]);
  const first = solve(frames[0]);
  const front = first.front;
  const g = el('g', { class: 'fig-body' }, svg);
  const L = (cls) => el('line', { class: cls }, g);
  const parts = {};
  if (!front) {
    parts.ua2 = L('fg far'); parts.fa2 = L('fg far');
    parts.th2 = L('fg far'); parts.sh2 = L('fg far'); parts.ft2 = L('fg far ft');
  } else {
    parts.th2 = L('fg'); parts.sh2 = L('fg'); parts.ft2 = L('fg ft');
    parts.th1 = L('fg'); parts.sh1 = L('fg'); parts.ft1 = L('fg ft');
    parts.hipbar = L('fg torso-bar');
  }
  parts.torso = el('path', { class: 'fg torso' }, g);
  if (front) parts.shbar = L('fg torso-bar');
  parts.neck = L('fg neck');
  parts.tail = el('circle', { r: 5.5, class: 'fig-hair' }, g);
  parts.head = el('circle', { r: LEN.head, class: 'fig-head' }, g);
  if (front) {
    parts.hair = el('path', { class: 'fig-hair' }, g);
    parts.eye1 = el('circle', { r: 1.6, class: 'fig-eye' }, g);
    parts.eye2 = el('circle', { r: 1.6, class: 'fig-eye' }, g);
  } else {
    parts.nose = el('circle', { r: 2.6, class: 'fig-head' }, g);
  }
  if (!front) {
    parts.th1 = L('fg'); parts.sh1 = L('fg'); parts.ft1 = L('fg ft');
  }
  parts.ua1 = L('fg'); parts.fa1 = L('fg');
  if (front) { parts.ua2 = L('fg'); parts.fa2 = L('fg'); }

  const setL = (ln, a, b) => {
    ln.setAttribute('x1', r1(a[0])); ln.setAttribute('y1', r1(a[1]));
    ln.setAttribute('x2', r1(b[0])); ln.setAttribute('y2', r1(b[1]));
  };
  const setC = (c, pt) => { c.setAttribute('cx', r1(pt[0])); c.setAttribute('cy', r1(pt[1])); };

  function render(pose) {
    const s = solve(pose);
    setL(parts.ua1, s.S1, s.E1); setL(parts.fa1, s.E1, s.W1);
    setL(parts.ua2, s.S2, s.E2); setL(parts.fa2, s.E2, s.W2);
    setL(parts.th1, s.H1, s.K1); setL(parts.sh1, s.K1, s.A1); setL(parts.ft1, s.A1, s.T1);
    setL(parts.th2, s.H2, s.K2); setL(parts.sh2, s.K2, s.A2); setL(parts.ft2, s.A2, s.T2);
    parts.torso.setAttribute('d', `M${r1(s.hip[0])} ${r1(s.hip[1])} Q${r1(s.mid[0])} ${r1(s.mid[1])} ${r1(s.sh[0])} ${r1(s.sh[1])}`);
    if (parts.shbar) setL(parts.shbar, s.S1, s.S2);
    if (parts.hipbar) setL(parts.hipbar, s.H1, s.H2);
    setL(parts.neck, s.sh, s.nk);
    setC(parts.head, s.head);
    if (s.front) {
      // Haar-Kappe oben auf dem Kopf, Augen nach Blickrichtung n
      const hr = LEN.head + 1.5;
      const lft = [s.head[0] - s.right[0] * hr, s.head[1] - s.right[1] * hr];
      const rgt = [s.head[0] + s.right[0] * hr, s.head[1] + s.right[1] * hr];
      parts.hair.setAttribute('d', `M${r1(lft[0])} ${r1(lft[1])} A${hr} ${hr} 0 0 1 ${r1(rgt[0])} ${r1(rgt[1])} Z`);
      const n = s.p.n || 0;
      const e = (side) => [
        s.head[0] + s.right[0] * (n * 5 + side * 3.8) - s.axis[0] * -1,
        s.head[1] + s.right[1] * (n * 5 + side * 3.8) - s.axis[1] * -1,
      ];
      setC(parts.eye1, e(-1)); setC(parts.eye2, e(1));
      const top = [s.head[0] + s.axis[0] * 12, s.head[1] + s.axis[1] * 12];
      setC(parts.tail, top);
    } else {
      setC(parts.nose, [s.head[0] + s.faceDir[0] * 10.5, s.head[1] + s.faceDir[1] * 10.5 + s.axis[1] * -0]);
      setC(parts.tail, [s.head[0] - s.faceDir[0] * 11 + s.axis[0] * 3, s.head[1] - s.faceDir[1] * 11 + s.axis[1] * 3]);
    }
  }

  const fig = {
    svg, frames, tempo: opts.tempo || 4, paused: false, t0: performance.now(), pausedAt: 0,
    render,
    setPaused(v) {
      if (v === fig.paused) return;
      if (v) fig.pausedAt = performance.now();
      else fig.t0 += performance.now() - fig.pausedAt;
      fig.paused = v;
    },
  };
  render(frames[frames.length > 1 ? frames.length - 1 : 0]);
  if (opts.animate && frames.length > 1) register(fig);
  return fig;
}

// ---------- Animation ----------
const active = new Set();
let raf = 0;
const ease = (x) => x * x * (3 - 2 * x);

function lerpPose(a, b, u) {
  const o = { ...a };
  for (const k in b) {
    if (typeof b[k] === 'number') {
      const av = typeof a[k] === 'number' ? a[k] : (DEF[k] ?? b[k]);
      o[k] = av + (b[k] - av) * u;
    }
  }
  return o;
}

function poseAt(fig, now) {
  const fr = fig.frames;
  const n = fr.length - 1;
  const cyc = ((now - fig.t0) / 1000 / fig.tempo) % 1; // 0..1 hin und zurück
  let x = cyc < 0.5 ? cyc * 2 : 2 - cyc * 2; // 0..1..0
  // kleine Pausen an den Endpunkten
  x = Math.min(1, Math.max(0, (x - 0.08) / 0.84));
  const pos = x * n;
  const i = Math.min(n - 1, Math.floor(pos));
  const u = ease(pos - i);
  return lerpPose({ ...DEF, ...fr[i] }, { ...DEF, ...fr[i + 1] }, u);
}

function tick(now) {
  for (const fig of active) {
    if (!fig.svg.isConnected) { active.delete(fig); continue; }
    if (fig.paused) continue;
    fig.render(poseAt(fig, now));
  }
  raf = active.size ? requestAnimationFrame(tick) : 0;
}

function register(fig) {
  active.add(fig);
  if (!raf) raf = requestAnimationFrame(tick);
}
