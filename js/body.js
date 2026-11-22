// Fit mit Herz – die Trainerin-Figur (gezeichnet aus Gelenkpunkten)
// Körperteile sind gefüllte, abgerundete Formen statt Striche: Hüfte, Taille, Brust, schlanke Glieder,
// Hochsteckfrisur mit Dutt, Gesicht, ärmelloses Top, Leggings, Turnschuhe, Fitnessarmband.

const NS = 'http://www.w3.org/2000/svg';
const f1 = (n) => Math.round(n * 10) / 10;
const P = (p) => `${f1(p[0])} ${f1(p[1])}`;
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const norm = (v) => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };

function el(name, attrs, parent) {
  const e = document.createElementNS(NS, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  parent.appendChild(e);
  return e;
}

/** Abgerundete, sich verjüngende Form von a nach b (Radius ra → rb). */
function capsule(a, b, ra, rb) {
  const d = norm([b[0] - a[0], b[1] - a[1]]);
  const n = [-d[1], d[0]];
  const a1 = add(a, n, ra), b1 = add(b, n, rb), b2 = add(b, n, -rb), a2 = add(a, n, -ra);
  return `M${P(a1)}L${P(b1)}A${f1(rb)} ${f1(rb)} 0 0 0 ${P(b2)}L${P(a2)}A${f1(ra)} ${f1(ra)} 0 0 0 ${P(a1)}Z`;
}

/** Weiche geschlossene Kurve durch Punkte (Catmull-Rom). */
function smoothClosed(pts) {
  const n = pts.length;
  let d = `M${P(pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${P(c1)} ${P(c2)} ${P(p2)}`;
  }
  return d + 'Z';
}

// Rumpf-Mittellinie: Bézierkurve Hüfte → Kontrollpunkt → Schulter (mit Verlängerung unter die Hüfte)
function spine(s, u) {
  const H = s.hip, C = s.mid, S = s.sh;
  const tan = (t) => norm([2 * (1 - t) * (C[0] - H[0]) + 2 * t * (S[0] - C[0]), 2 * (1 - t) * (C[1] - H[1]) + 2 * t * (S[1] - C[1])]);
  if (u < 0) { const t0 = tan(0), L = Math.hypot(S[0] - H[0], S[1] - H[1]); return { p: add(H, t0, u * L), t: t0 }; }
  const a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u;
  return { p: [a * H[0] + b * C[0] + c * S[0], a * H[1] + b * C[1] + c * S[1]], t: tan(u) };
}

// Körperprofil (Seitenansicht): Abstand nach vorn / nach hinten entlang des Rumpfes
const SIDE = [
  // u,    vorn, hinten
  [-0.16, 7.5, 9.5], [-0.05, 10.5, 15], [0.08, 11.5, 15.2], [0.2, 12, 12.6], [0.34, 10.4, 9.8], [0.48, 9.8, 9.4],
  [0.6, 11.6, 10.2], [0.7, 14, 11], [0.8, 12.2, 11.2], [0.92, 9, 10], [1.0, 6.5, 7.5],
];
// Körperbreite (Vorderansicht): halbe Breite
const FRONT = [[-0.16, 13], [-0.05, 18], [0.08, 18.5], [0.2, 16.5], [0.36, 13], [0.5, 13.2], [0.66, 15.2], [0.8, 16], [0.92, 15.8], [1.0, 13.5]];

function torsoOutline(s, from, to) {
  const front = s.front;
  const rows = (front ? FRONT.map(([u, w]) => [u, w, w]) : SIDE).filter(([u]) => u >= from - 1e-6 && u <= to + 1e-6);
  if (rows[0][0] > from) rows.unshift(interp(front ? FRONT.map(([u, w]) => [u, w, w]) : SIDE, from));
  if (rows[rows.length - 1][0] < to) rows.push(interp(front ? FRONT.map(([u, w]) => [u, w, w]) : SIDE, to));
  const A = [], B = [];
  for (const [u, vf, vb] of rows) {
    const { p, t } = spine(s, u);
    const nrm = [-t[1], t[0]]; // Seitenansicht: nach vorn; Vorderansicht: nach rechts
    A.push(add(p, nrm, vf));
    B.push(add(p, nrm, -vb));
  }
  return smoothClosed([...A, ...B.reverse()]);
}
function interp(table, u) {
  for (let i = 0; i < table.length - 1; i++) {
    const [u0, a0, b0] = table[i], [u1, a1, b1] = table[i + 1];
    if (u >= u0 && u <= u1) { const k = (u - u0) / (u1 - u0); return [u, a0 + (a1 - a0) * k, b0 + (b1 - b0) * k]; }
  }
  return table[u < table[0][0] ? 0 : table.length - 1];
}

/** Legt alle Teile an. Reihenfolge = hinten nach vorn. Jeder Körperteil ist eine eigene Gruppe
 *  (für das Hervorheben ohne Nähte an den Gelenken). */
export function buildBody(root, front) {
  const parts = {};
  let g = root;
  const S = (cls) => el('path', { class: cls }, g);
  const C = (cls, r) => el('circle', { class: cls, r }, g);
  const E = (cls, rx, ry) => el('ellipse', { class: cls, rx, ry }, g);
  const group = (cls) => { g = el('g', { class: cls }, root); return g; };
  parts.shadow = E('b-shadow', 26, 3.2);
  const leg = (i, far) => {
    const f = far ? ' far' : '';
    group('leg' + i);
    parts['th' + i] = S('b-legs' + f);
    parts['sh' + i] = S('b-legs' + f);
    parts['shoe' + i] = S('b-shoe' + f);
    parts['sole' + i] = S('b-sole' + f);
  };
  const arm = (i, far) => {
    const f = far ? ' far' : '';
    group('arm' + i);
    parts['ua' + i] = S('b-skin' + f);
    parts['fa' + i] = S('b-skin' + f);
    parts['hand' + i] = S('b-skin' + f);
    if (!far && !front && i === 1) parts['band' + i] = S('b-band');
  };
  // Haare hinten (Dutt) hinter dem Körper
  group('headp hairback');
  parts.hairBack = C('b-hair', 14.8);
  parts.bun = C('b-hair', 9.3);
  parts.bun2 = C('b-hair2', 6);
  if (!front) { arm(2, true); leg(2, true); } else { leg(1); leg(2); }
  group('torsop');
  parts.pants = S('b-legs');
  parts.top = S('b-top');
  if (front) parts.neckline = S('b-skin');
  group('headp');
  parts.neck = S('b-skin');
  parts.head = C('b-skin', 13.2);
  parts.ear = C('b-skin2', 3.1);
  parts.hairCap = S('b-hair');
  parts.blush1 = C('b-blush', 2.6);
  parts.blush2 = C('b-blush', 2.6);
  parts.eye1 = E('b-eye', 2.1, 2.8); parts.hl1 = C('b-eyehl', 0.85);
  parts.brow1 = S('b-brow');
  if (front) { parts.eye2 = E('b-eye', 2.1, 2.8); parts.hl2 = C('b-eyehl', 0.85); parts.brow2 = S('b-brow'); }
  parts.nose = front ? S('b-nosel') : C('b-skin', 2.1);
  parts.mouth = S('b-mouth');
  if (!front) { leg(1); arm(1); } else { arm(1); arm(2); }
  parts.front = front;
  return parts;
}

const setD = (e, d) => e.setAttribute('d', d);
const setC = (e, p) => { e.setAttribute('cx', f1(p[0])); e.setAttribute('cy', f1(p[1])); };

export function renderBody(parts, s, ground = 197) {
  const front = parts.front;
  // Bodenschatten
  const feet = [s.A1, s.A2, s.T1, s.T2, s.K1, s.K2, s.hip, s.sh, s.head];
  const low = feet.filter((p) => p[1] > ground - 14);
  if (low.length) {
    const xs = low.map((p) => p[0]);
    setC(parts.shadow, [(Math.min(...xs) + Math.max(...xs)) / 2, ground + 1]);
    parts.shadow.setAttribute('rx', f1(Math.max(16, (Math.max(...xs) - Math.min(...xs)) / 2 + 10)));
    parts.shadow.style.display = '';
  } else parts.shadow.style.display = 'none';

  // Beine
  for (const i of [1, 2]) {
    const H = s['H' + i], K = s['K' + i], A = s['A' + i], T = s['T' + i];
    setD(parts['th' + i], capsule(H, K, front ? 9 : 9.5, 6.4));
    setD(parts['sh' + i], capsule(K, lerp(K, A, 1.02), 6.2, 3.9));
    // Schuh: Ferse leicht hinter dem Knöchel, Spitze vorn
    const dir = norm([T[0] - A[0], T[1] - A[1]]);
    const heel = add(A, dir, front ? -1 : -2.5), toe = add(A, dir, front ? 6.5 : 12);
    setD(parts['shoe' + i], capsule(heel, toe, 4.8, 4));
    const n = [-dir[1], dir[0]];
    const side = front ? 1 : (n[1] > 0 ? 1 : -1); // Sohle zum Boden hin
    setD(parts['sole' + i], `M${P(add(heel, n, side * 4))}L${P(add(toe, n, side * 3.4))}`);
  }
  // Arme
  for (const i of [1, 2]) {
    const Sx = s['S' + i], El = s['E' + i], W = s['W' + i];
    setD(parts['ua' + i], capsule(Sx, El, 5.4, 4.2));
    setD(parts['fa' + i], capsule(El, W, 4.1, 3.1));
    const d = norm([W[0] - El[0], W[1] - El[1]]);
    setD(parts['hand' + i], capsule(add(W, d, 1), add(W, d, 6.5), 3.4, 2.4));
    if (parts['band' + i]) setD(parts['band' + i], capsule(add(W, d, -3.2), add(W, d, -2.2), 3.25, 3.2));
  }
  // Rumpf: Leggings unten, Top oben
  setD(parts.pants, torsoOutline(s, -0.16, 0.3));
  setD(parts.top, torsoOutline(s, 0.26, 1.0));
  if (parts.neckline) {
    // runder Ausschnitt des Tops (Vorderansicht)
    const { p, t } = spine(s, 1.0), r = [-t[1], t[0]];
    const l = add(p, r, -6.5), rr = add(p, r, 6.5), bottom = add(spine(s, 0.86).p, [0, 0], 0);
    setD(parts.neckline, `M${P(add(l, t, 1))}Q${P(bottom)} ${P(add(rr, t, 1))}L${P(add(rr, t, 2))}L${P(add(l, t, 2))}Z`);
  }
  setD(parts.neck, capsule(add(s.sh, norm([s.nk[0] - s.sh[0], s.nk[1] - s.sh[1]]), -2), add(s.nk, norm([s.nk[0] - s.sh[0], s.nk[1] - s.sh[1]]), 3), 3.8, 3.6));

  // Kopf: lokales Koordinatensystem (x = Blickrichtung bzw. rechts, y = nach oben)
  const up = s.axis, c = [s.head[0] + up[0] * 1.4, s.head[1] + up[1] * 1.4];
  const fwd = front ? s.right : s.faceDir;
  const K = 1.14; // Kopf etwas größer (freundlicher Cartoon-Stil)
  const at = (x, y) => [c[0] + (fwd[0] * x + up[0] * y) * K, c[1] + (fwd[1] * x + up[1] * y) * K];
  setC(parts.head, c);
  if (front) {
    const n = s.p.n || 0, o = n * 4.5;
    setC(parts.hairBack, at(0, 1.6));
    setC(parts.bun, at(0, 13)); setC(parts.bun2, at(-4, 15.5));
    // Pony/Haaransatz: Kappe über der Stirn
    const cap = [];
    for (let k = 0; k <= 12; k++) { const a = (Math.PI * (0.05 + 0.9 * k / 12)); cap.push(at(12.4 * Math.cos(a) + o * 0.3, 12.4 * Math.sin(a))); }
    const capIn = [at(9 + o * 0.3, 4), at(4 + o, 6.2), at(-1 + o, 5.6), at(-6 + o * 0.6, 6.4), at(-9 + o * 0.3, 4)];
    setD(parts.hairCap, `M${P(cap[0])}` + cap.slice(1).map((q) => `L${P(q)}`).join('') + capIn.reverse().map((q) => `L${P(q)}`).join('') + 'Z');
    setC(parts.ear, at(n > 0 ? -11.2 : 11.2, -0.5));
    parts.ear.style.display = Math.abs(n) > 0.3 ? '' : 'none';
    setC(parts.eye1, at(-4.3 + o, 0.3)); setC(parts.hl1, at(-3.6 + o, 1.2));
    setC(parts.eye2, at(4.3 + o, 0.3)); setC(parts.hl2, at(5 + o, 1.2));
    setD(parts.brow1, `M${P(at(-6.2 + o, 3.7))}Q${P(at(-4.3 + o, 5))} ${P(at(-2.4 + o, 4))}`);
    setD(parts.brow2, `M${P(at(2.4 + o, 4))}Q${P(at(4.3 + o, 5))} ${P(at(6.2 + o, 3.7))}`);
    setD(parts.nose, `M${P(at(o + 0.4, -1.2))}Q${P(at(o + 1.2, -3.3))} ${P(at(o - 0.2, -3.6))}`);
    setD(parts.mouth, `M${P(at(-3 + o, -5.6))}Q${P(at(o, -8))} ${P(at(3 + o, -5.6))}`);
    setC(parts.blush1, at(-6.5 + o, -3.2)); setC(parts.blush2, at(6.5 + o, -3.2));
  } else {
    setC(parts.hairBack, at(-2.2, 1.4));
    setC(parts.bun, at(-6.5, 11.5)); setC(parts.bun2, at(-11, 8));
    // Haare bedecken Oberkopf und Hinterkopf
    const cap = [];
    for (let k = 0; k <= 14; k++) { const a = (Math.PI / 180) * (68 + (232 - 68) * k / 14); cap.push(at(12.3 * Math.cos(a), 12.3 * Math.sin(a))); }
    const capIn = [at(-4, -7), at(-3, -1), at(-1, 5), at(3.5, 8.6)];
    setD(parts.hairCap, `M${P(cap[0])}` + cap.slice(1).map((q) => `L${P(q)}`).join('') + capIn.map((q) => `L${P(q)}`).join('') + 'Z');
    setC(parts.ear, at(-2.2, -0.8)); parts.ear.style.display = '';
    setC(parts.eye1, at(6.2, 1)); setC(parts.hl1, at(6.8, 1.9));
    setD(parts.brow1, `M${P(at(4.2, 4.6))}Q${P(at(6.4, 5.8))} ${P(at(8.6, 4.4))}`);
    setC(parts.nose, at(10.6, -1.2));
    setD(parts.mouth, `M${P(at(7.6, -5.4))}Q${P(at(9.4, -6.8))} ${P(at(10.6, -5.2))}`);
    setC(parts.blush1, at(5.2, -3)); parts.blush2.style.display = 'none';
  }
}
