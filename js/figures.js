// Fit mit Herz – Übungsfiguren
// Eigene SVG-Strichfiguren, berechnet aus Gelenkwinkeln (Vorwärtskinematik).
// Winkel in Grad: 0 = nach unten, 90 = nach rechts (Blickrichtung), 180 = nach oben, 270 = nach links.

const LEN = { torso: 48, neck: 7, head: 11, ua: 27, fa: 25, th: 40, sh: 40, ft: 11 };
export const GROUND = 197;
const NS = 'http://www.w3.org/2000/svg';
import { buildBody, renderBody } from './body.js';

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

let uid = 0;
const setL = (ln, a, b) => {
  ln.setAttribute('x1', r1(a[0])); ln.setAttribute('y1', r1(a[1]));
  ln.setAttribute('x2', r1(b[0])); ln.setAttribute('y2', r1(b[1]));
};
const setC = (c, pt) => { c.setAttribute('cx', r1(pt[0])); c.setAttribute('cy', r1(pt[1])); };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** Bewegungspfeil: zeigt, welcher Körperteil sich wohin bewegt. */
function drawArrow(svg, frames, id) {
  if (frames.length < 2) return;
  const a = solve(frames[0]), b = solve(frames[frames.length - 1]);
  const m = frames.length > 2 ? solve(frames[1]) : null;
  const keys = ['W1', 'W2', 'T1', 'T2', 'K1', 'K2', 'head', 'hip', 'E1', 'E2'];
  let best = null, bd = 0;
  for (const k of keys) {
    const dd = Math.hypot(b[k][0] - a[k][0], b[k][1] - a[k][1]);
    if (dd > bd + 2) { bd = dd; best = k; }
  }
  if (!best || bd < 16) return;
  const A = a[best], B = b[best];
  let ctrl;
  if (m) ctrl = [2 * m[best][0] - (A[0] + B[0]) / 2, 2 * m[best][1] - (A[1] + B[1]) / 2];
  else {
    // leicht gebogen, vom Körper weg
    const mid = mix(A, B, 0.5), dx = B[0] - A[0], dy = B[1] - A[1];
    let px = -dy / bd, py = dx / bd;
    const away = [mid[0] - b.sh[0], mid[1] - b.sh[1]];
    if (px * away[0] + py * away[1] < 0) { px = -px; py = -py; }
    ctrl = [mid[0] + px * bd * 0.22, mid[1] + py * bd * 0.22];
  }
  // Enden etwas kürzen, damit der Pfeil nicht auf der Hand/dem Fuß liegt
  const trim = (p, toward, by) => { const l = Math.hypot(toward[0] - p[0], toward[1] - p[1]) || 1; return [p[0] + (toward[0] - p[0]) / l * by, p[1] + (toward[1] - p[1]) / l * by]; };
  const A2 = trim(A, ctrl, 9), B2 = trim(B, ctrl, 11);
  el('path', { class: 'f-arrow', d: `M${r1(A2[0])} ${r1(A2[1])} Q${r1(ctrl[0])} ${r1(ctrl[1])} ${r1(B2[0])} ${r1(B2[1])}`, 'marker-end': `url(#${id})` }, svg);
}

// ---------- Hervorhebung des bewegten Körperteils ----------
const HL = { arm: ['arm1'], arms: ['arm1', 'arm2'], leg: ['leg1'], legs: ['leg1', 'leg2'], head: ['head'], torso: ['torso'], shoulders: ['shoulders'], arm1: ['arm1'], arm2: ['arm2'], leg1: ['leg1'], leg2: ['leg2'] };
function highlightClasses(h) {
  if (!h) return '';
  const list = (Array.isArray(h) ? h : [h]).flatMap((x) => HL[x] || []);
  return [...new Set(list)].map((x) => 'hl-' + x).join(' ');
}

/** Erkennt aus den Posen, welcher Körperteil sich am meisten bewegt (Winkel relativ zum Rumpf). */
export function autoHighlight(frames) {
  if (frames.length < 2) return '';
  const F = frames.map((f) => ({ ...DEF, ...f }));
  const a = F[0];
  const d = (fn) => Math.max(...F.map((f) => Math.abs(fn(f) - fn(a))));
  const g = {
    arm1: d((f) => f.a1 - f.t) + d((f) => f.f1 - f.a1),
    arm2: d((f) => f.a2 - f.t) + d((f) => f.f2 - f.a2),
    leg1: d((f) => f.l1) + d((f) => f.s1 - f.l1) + 0.4 * d((f) => f.p1),
    leg2: d((f) => f.l2) + d((f) => f.s2 - f.l2) + 0.4 * d((f) => f.p2),
    head: d((f) => f.h - f.t) + 40 * d((f) => f.n),
    torso: d((f) => f.t) + 3 * d((f) => f.c) + 0.6 * d((f) => f.y),
    shoulders: 4 * d((f) => f.su),
  };
  const max = Math.max(...Object.values(g));
  if (max < 10) return '';
  return Object.entries(g).filter(([, v]) => v >= max * 0.55 && v >= 10).map(([k]) => 'hl-' + k).join(' ');
}

/** Kreisspur: zeigt bei Kreisbewegungen den Weg des sich am meisten bewegenden Körperteils. */
function drawLoopTrail(svg, frames, id) {
  const keys = ['E1', 'W1', 'K1', 'T1', 'head', 'hip'];
  const steps = [];
  for (let i = 0; i < frames.length - 1; i++) {
    for (let j = 0; j < 10; j++) steps.push(solve(lerpPose({ ...DEF, ...frames[i] }, { ...DEF, ...frames[i + 1] }, j / 10)));
  }
  let best = keys[0], bl = 0;
  for (const k of keys) {
    let l = 0;
    for (let i = 1; i < steps.length; i++) l += Math.hypot(steps[i][k][0] - steps[i - 1][k][0], steps[i][k][1] - steps[i - 1][k][1]);
    if (l > bl) { bl = l; best = k; }
  }
  // etwas Abstand nach außen, damit die Spur nicht auf dem Arm liegt; Ende offen lassen für den Pfeil
  const pts = steps.slice(0, Math.floor(steps.length * 0.88)).map((s) => {
    const c = s.S1, p = s[best], dx = p[0] - c[0], dy = p[1] - c[1], l = Math.hypot(dx, dy) || 1;
    return [p[0] + dx / l * 5, p[1] + dy / l * 5];
  });
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${r1(p[0])} ${r1(p[1])}`).join(' ');
  el('path', { class: 'f-arrow f-loop', d, 'marker-end': `url(#${id})` }, svg);
}

/**
 * Erstellt eine Figur. frames: Liste von Posen (Ping-Pong-Animation).
 * opts: { animate, tempo, label, pose: 'start'|'end' (für Standbilder), arrow: true, ghost: true }
 */
export function createFigure(frames, opts = {}) {
  const id = 'ah' + (++uid);
  const vb = opts.zoom ? opts.zoom.join(' ') : '0 0 240 210';
  const hl = opts.highlight === undefined ? autoHighlight(frames) : highlightClasses(opts.highlight);
  const svg = el('svg', { viewBox: vb, class: 'figure' + (opts.zoom ? ' zoomed' : '') + (hl ? ' ' + hl : ''), role: 'img', 'aria-label': opts.label || 'Übungsfigur' });
  const defs = el('defs', {}, svg);
  const mk = el('marker', { id, viewBox: '0 0 10 10', refX: 6, refY: 5, markerWidth: 3.4, markerHeight: 3.4, orient: 'auto-start-reverse' }, defs);
  el('path', { d: 'M0 0 L10 5 L0 10 Z', class: 'f-arrowhead' }, mk);
  drawProps(svg, frames[0]);
  const front = solve(frames[0]).front;
  const multi = frames.length > 1;
  const still = opts.pose !== undefined; // Standbild (Start, Ziel oder Bild Nr. x)
  const showGhost = multi && opts.ghost !== false && !still && !opts.loop;
  const last = frames[frames.length - 1];

  if (showGhost) {
    // blasses Zielbild bei Animation, blasses Startbild bei Standbild
    const gg = el('g', { class: 'fig-ghost' }, svg);
    renderBody(buildBody(gg, front), solve(opts.animate ? last : frames[0]));
  }
  const g = el('g', { class: 'fig-body' }, svg);
  const parts = buildBody(g, front);
  if (multi && opts.arrow !== false && !still) (opts.loop ? drawLoopTrail : drawArrow)(svg, frames, id);

  const render = (pose) => renderBody(parts, solve(pose));
  const fig = {
    svg, frames, loop: !!opts.loop, tempo: (opts.tempo || 4) * 1.25, paused: false, t0: performance.now(), pausedAt: 0,
    render,
    setPaused(v) {
      if (v === fig.paused) return;
      if (v) fig.pausedAt = performance.now();
      else fig.t0 += performance.now() - fig.pausedAt;
      fig.paused = v;
    },
  };
  render(typeof opts.pose === 'number' ? frames[Math.min(opts.pose, frames.length - 1)] : opts.pose === 'start' ? frames[0] : last);
  if (opts.animate && multi) register(fig);
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
  const cyc = ((now - fig.t0) / 1000 / fig.tempo) % 1;
  if (fig.loop) {
    // Kreisbewegung: läuft immer in dieselbe Richtung weiter (letztes Bild = erstes Bild)
    const pos = cyc * n, i = Math.min(n - 1, Math.floor(pos));
    return lerpPose({ ...DEF, ...fr[i] }, { ...DEF, ...fr[i + 1] }, pos - i);
  }
  // sonst hin und zurück
  let x = cyc < 0.5 ? cyc * 2 : 2 - cyc * 2; // 0..1..0
  // kurze Haltepausen an Start und Ziel
  x = Math.min(1, Math.max(0, (x - 0.12) / 0.76));
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
