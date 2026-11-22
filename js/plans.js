// Fit mit Herz – Trainingspläne
// Jeder Tag: 5 Min Aufwärmen · 20 Min Haupttraining · 5 Min Dehnen & Entspannen = 30 Min.
// 4 Wochenvarianten (A–D) wechseln sich ab, 3 Stufen steigern Belastung und Übungsauswahl.

import { EXERCISES } from './exercises.js';

export const SECTION_NAMES = { warm: 'Aufwärmen', main: 'Haupttraining', cool: 'Dehnen & Entspannen' };
export const VARIANTS = ['A', 'B', 'C', 'D'];
export const STAGES = [
  null,
  { name: 'Stufe 1 · Ankommen', short: 'Ankommen', text: 'Sanfter Einstieg mit längeren Pausen und den einfachsten Übungen.' },
  { name: 'Stufe 2 · Aufbauen', short: 'Aufbauen', text: 'Etwas längere Übungszeiten, kürzere Pausen und neue Übungen.' },
  { name: 'Stufe 3 · Festigen', short: 'Festigen', text: 'Längere Haltezeiten und anspruchsvollere Varianten.' },
];

// Arbeit/Pause in Sekunden je Stufe
const MODES = {
  circuit: { slot: 60, work: [40, 45, 50] },
  flow: { slot: 75, work: [60, 65, 70] },
  cardio: { slot: 60, work: [40, 45, 50] },
};

// Wochentag: 1 = Montag … 7 = Sonntag
export const DAYS = {
  1: {
    title: 'Rücken, Nacken & Bauch', short: 'Rücken · Nacken · Bauch', color: 'coral',
    warm: ['marsch', 'schulter_heben', 'ellbogenkreise', 'rumpfdrehung', 'hueftkreise', 'seitneigung_stand', 'armkreise', 'mini_kniebeuge'],
    main: [{ mode: 'circuit', rounds: 2, groups: [
      { take: 3, pool: ['kinn_rueckzug', 'ja_nicken', 'kopf_drehen', 'nacken_isometrie', 'kopf_neigen'] },
      { take: 3, pool: ['schulterblatt_zusammen', 'w_y_arme', 'rudern_stehend', 'katze_kuh', 'schwimmer', 'vierfuss_arm_bein', 'rudern_vorgebeugt'] },
      { take: 4, pool: ['beckenkippen', 'bruecke', 'crunch_sanft', 'plank_wand', 'dead_bug', 'plank_knie', 'knie_heben_sitz', 'plank'] },
    ] }],
    cool: ['kind', 'knie_brust', 'drehdehnung', 'nacken_dehnung', 'arme_hinter_ruecken'], coolEnd: 'bauchatmung',
  },
  2: {
    title: 'Yoga & Beweglichkeit', short: 'Yoga · Beweglichkeit', color: 'sage',
    warm: ['ellbogenkreise', 'hueftkreise', 'seitneigung_stand', 'rumpfdrehung', 'schulter_heben', 'marsch', 'armkreise'],
    main: [{ mode: 'flow', rounds: 2, groups: [
      { take: 3, pool: ['berg', 'tandem', 'krieger2', 'baum', 'einbeinstand', 'standwaage'] },
      { take: 5, pool: ['katze_kuh', 'kind', 'sphinx', 'hund_wand', 'huefbeuger', 'schmetterling', 'knie_pendel', 'bws_rotation'] },
    ] }],
    cool: ['drehdehnung', 'knie_brust', 'figur4'], coolEnd: 'atem_46', coolEnd2: 'koerperreise',
  },
  3: {
    title: 'Ganzkörpertraining', short: 'Ganzkörper', color: 'sun',
    warm: ['marsch', 'step_touch', 'armkreise', 'mini_kniebeuge', 'hueftkreise', 'rumpfdrehung', 'fersenheben'],
    main: [{ mode: 'circuit', rounds: 2, groups: [
      { take: 3, pool: ['aufstehen_stuhl', 'kniebeuge_stuhl', 'bein_seitlich', 'mini_kniebeuge', 'sumo', 'bein_hinten', 'ausfallschritt', 'fersenheben'] },
      { take: 3, pool: ['wand_liegestuetz', 'ueberkopf', 'seitheben', 'bizeps'] },
      { take: 2, pool: ['bruecke', 'plank_wand', 'crunch_sanft', 'plank_knie', 'dead_bug'] },
      { take: 2, pool: ['boxen', 'marsch', 'step_touch', 'hampelmann_low', 'knie_armzug'] },
    ] }],
    cool: ['wade', 'oberschenkel', 'brustdehnung_tuer', 'kind'], coolEnd: 'bauchatmung',
  },
  4: {
    title: 'Rücken, Schultern & Nacken', short: 'Rücken · Schultern · Nacken', color: 'coral',
    warm: ['schulter_heben', 'ellbogenkreise', 'armkreise', 'rumpfdrehung', 'seitneigung_stand', 'marsch'],
    main: [{ mode: 'circuit', rounds: 2, groups: [
      { take: 3, pool: ['seitheben', 'ueberkopf', 'w_y_arme', 'wand_liegestuetz'] },
      { take: 3, pool: ['rudern_stehend', 'schulterblatt_zusammen', 'rudern_vorgebeugt', 'katze_kuh', 'good_morning', 'schwimmer', 'bruecke', 'vierfuss_arm_bein', 'bws_rotation'] },
      { take: 4, pool: ['kinn_rueckzug', 'kopf_drehen', 'nacken_isometrie', 'aufrichten_sitz', 'drehsitz_stuhl', 'schulter_heben'] },
    ] }],
    cool: ['hund_wand', 'brustdehnung_tuer', 'nacken_dehnung', 'arme_hinter_ruecken'], coolEnd: 'atem_46',
  },
  5: {
    title: 'Beine, Po & Bauch', short: 'Beine · Po · Bauch', color: 'sun',
    warm: ['marsch', 'mini_kniebeuge', 'hueftkreise', 'fersenheben', 'step_touch', 'anfersen'],
    main: [{ mode: 'circuit', rounds: 2, groups: [
      { take: 6, pool: ['aufstehen_stuhl', 'bruecke', 'bein_seitlich', 'bein_hinten', 'kniebeuge_stuhl', 'sumo', 'esel_kick', 'mini_kniebeuge', 'ausfallschritt', 'fersenheben'] },
      { take: 4, pool: ['beckenkippen', 'crunch_sanft', 'plank_wand', 'knie_heben_sitz', 'dead_bug', 'plank_knie', 'plank'] },
    ] }],
    cool: ['oberschenkel', 'wade', 'figur4', 'knie_brust'], coolEnd: 'bauchatmung',
  },
  6: {
    title: 'Yoga & sanftes Cardio', short: 'Yoga · Cardio', color: 'sage',
    warm: ['marsch', 'armkreise', 'hueftkreise', 'rumpfdrehung', 'fersenheben', 'seitneigung_stand'],
    main: [
      { mode: 'cardio', rounds: 2, groups: [{ take: 5, pool: ['marsch', 'step_touch', 'boxen', 'anfersen', 'mini_kniebeuge', 'hampelmann_low', 'knie_armzug'] }] },
      { mode: 'flow', rounds: 1, groups: [{ take: 8, pool: ['berg', 'krieger2', 'baum', 'katze_kuh', 'sphinx', 'kind', 'hund_wand', 'schmetterling', 'huefbeuger', 'tandem', 'knie_pendel', 'einbeinstand'] }] },
    ],
    cool: ['drehdehnung', 'schmetterling'], coolEnd: 'atem_46', coolEnd2: 'koerperreise',
  },
  7: {
    title: 'Regeneration & Entspannung', short: 'Regeneration', color: 'lavender',
    warm: ['schulter_heben', 'ellbogenkreise', 'hueftkreise', 'rumpfdrehung', 'seitneigung_stand'],
    main: [{ mode: 'flow', rounds: 1, gentle: true, groups: [{ take: 16, pool: ['katze_kuh', 'kind', 'knie_pendel', 'knie_brust', 'beckenkippen', 'drehdehnung', 'schmetterling', 'sphinx', 'hund_wand', 'figur4', 'vorbeuge_stuhl', 'nacken_dehnung', 'aufrichten_sitz', 'seitbeuge_sitz', 'kinn_rueckzug', 'arme_hoch_sitz', 'berg'] }] }],
    cool: [], coolEnd: 'atem_46', coolEnd2: 'koerperreise',
  },
};

// ---------- Hilfsfunktionen ----------
function eligible(pool, stage) {
  const ok = pool.filter((id) => EXERCISES[id] && EXERCISES[id].lvl <= stage);
  // Neue Übungen der aktuellen Stufe nach vorn, damit sie wirklich vorkommen
  if (stage >= 2) ok.sort((a, b) => (EXERCISES[b].lvl === stage) - (EXERCISES[a].lvl === stage));
  return ok;
}

function pick(pool, n, variant) {
  if (!pool.length) return [];
  const step = Math.max(1, Math.floor(pool.length / 4));
  const out = [];
  for (let i = 0; out.length < Math.min(n, pool.length) && i < pool.length * 2; i++) {
    const id = pool[(variant * step + i) % pool.length];
    if (!out.includes(id)) out.push(id);
  }
  // Wenn der Pool kleiner als n ist, wiederholen
  let j = 0;
  while (out.length < n) out.push(pool[j++ % pool.length]);
  return out;
}

function interleave(groups) {
  const out = [];
  const max = Math.max(...groups.map((g) => g.length));
  for (let i = 0; i < max; i++) for (const g of groups) if (g[i]) out.push(g[i]);
  return out;
}

function step(id, section, work, rest, extra = {}) {
  return { id, section, work, rest, ...extra };
}

/** Baut das Tagestraining als Liste von Stationen. */
export function buildDay(weekday, { stage = 1, variant = 0 } = {}) {
  const day = DAYS[weekday];
  const lv = Math.max(1, Math.min(3, stage)) - 1;
  const steps = [];

  // Aufwärmen: 6 Übungen à 50 s (45 s Übung + 5 s Wechsel) = 300 s
  const warm = pick(eligible(day.warm, stage), 6, variant);
  for (const id of warm) steps.push(step(id, 'warm', 45, 5));

  // Haupttraining: 1200 s
  for (const block of day.main) {
    const mode = MODES[block.mode];
    const picked = block.groups.map((g) => pick(eligible(g.pool, stage), g.take, variant));
    const seq = interleave(picked);
    const work = block.gentle ? 65 : mode.work[lv];
    for (let r = 0; r < block.rounds; r++) {
      for (const id of seq) steps.push(step(id, 'main', work, mode.slot - work, { round: r + 1, rounds: block.rounds }));
    }
  }

  // Dehnen & Entspannen: 300 s
  const coolIds = pick(eligible(day.cool, stage), day.cool.length, variant);
  const ends = [day.coolEnd, day.coolEnd2].filter(Boolean);
  if (!coolIds.length) {
    // nur Atmung/Entspannung: gleichmäßig aufteilen
    const each = Math.floor(300 / ends.length);
    for (const id of ends) steps.push(step(id, 'cool', each - 5, 5));
  } else {
    const all = [...coolIds, ...ends];
    const each = Math.floor(300 / all.length);
    const restSec = 300 - each * all.length;
    all.forEach((id, i) => steps.push(step(id, 'cool', each - 5 + (i === all.length - 1 ? restSec : 0), 5)));
  }
  return {
    kind: 'day', weekday, stage, variant,
    title: day.title, short: day.short, color: day.color, steps,
    totalSec: steps.reduce((s, x) => s + x.work + x.rest, 0),
  };
}

// ---------- Zusatzprogramme (Bereich Beweglichkeit) ----------
const prog = (id, title, group, minutes, desc, items, color = 'sage') => ({ id, title, group, minutes, desc, items, color });

export const PROGRAMS = [
  prog('ruecken_nacken', 'Rücken- & Nackenprogramm', 'mobil', 15, 'Löst Verspannungen, mobilisiert die Brustwirbelsäule und stärkt die Haltung – ideal nach einem langen PC-Tag.', [
    ['schulter_heben', 40], ['ellbogenkreise', 45], ['kinn_rueckzug', 45], ['kopf_drehen', 45], ['ja_nicken', 40], ['kopf_neigen', 50],
    ['rumpfdrehung', 45], ['katze_kuh', 60], ['bws_rotation', 60], ['schulterblatt_zusammen', 45], ['w_y_arme', 45], ['rudern_stehend', 45],
    ['aufrichten_sitz', 45], ['brustdehnung_tuer', 60], ['nacken_dehnung', 60], ['kind', 60], ['atem_46', 60],
  ], 'coral'),
  prog('yoga_einsteiger', 'Yoga für Einsteigerinnen', 'mobil', 15, 'Sanfte Haltungen, Gleichgewicht und Atmung. Ruhig und ohne Leistungsdruck.', [
    ['berg', 60], ['seitneigung_stand', 50], ['tandem', 45], ['krieger2', 60], ['baum', 50], ['katze_kuh', 60], ['kind', 60],
    ['sphinx', 50], ['hund_wand', 50], ['einbeinstand', 45], ['knie_pendel', 50], ['schmetterling', 60], ['knie_brust', 60], ['drehdehnung', 60], ['atem_46', 45], ['koerperreise', 90],
  ]),
  prog('huefte', 'Hüfte & Beine mobil', 'mobil', 10, 'Für steife Hüften vom vielen Sitzen.', [
    ['hueftkreise', 45], ['marsch', 45], ['knie_pendel', 50], ['knie_brust', 60], ['huefbeuger', 60], ['figur4', 60],
    ['schmetterling', 60], ['vorbeuge_stuhl', 60], ['oberschenkel', 60],
  ]),
  prog('pause_nacken', 'Nacken lösen', 'pause', 3, 'Am Schreibtisch, ohne Aufstehen.', [
    ['schulter_heben', 30], ['kinn_rueckzug', 30], ['kopf_drehen', 35], ['kopf_neigen', 40], ['nacken_dehnung', 40],
  ], 'coral'),
  prog('pause_ruecken', 'Rücken aufrichten', 'pause', 4, 'Gegen den Rundrücken: aufrichten, drehen, öffnen.', [
    ['aufrichten_sitz', 40], ['arme_hoch_sitz', 40], ['drehsitz_stuhl', 50], ['seitbeuge_sitz', 40], ['schulterblatt_zusammen', 40], ['arme_hinter_ruecken', 30],
  ], 'coral'),
  prog('pause_beine', 'Beine & Kreislauf', 'pause', 3, 'Bringt den Kreislauf in Schwung.', [
    ['aufstehen_stuhl', 40], ['fersenheben', 35], ['marsch', 40], ['bein_strecken_sitz', 40], ['knie_heben_sitz', 30],
  ], 'sun'),
  prog('pause_atem', 'Durchatmen', 'pause', 3, 'Kurze Entspannung bei Stress.', [
    ['atem_46', 70], ['schulter_heben', 30], ['arme_hoch_sitz', 35], ['atem_46', 45],
  ], 'lavender'),
  prog('pause_komplett', 'Die 5-Minuten-Pause', 'pause', 5, 'Ein bisschen von allem: Nacken, Rücken, Beine.', [
    ['schulter_heben', 30], ['kinn_rueckzug', 30], ['kopf_drehen', 30], ['drehsitz_stuhl', 40], ['arme_hoch_sitz', 30],
    ['aufstehen_stuhl', 35], ['fersenheben', 30], ['figur4', 40], ['atem_46', 35],
  ], 'sun'),
];

export function buildProgram(id) {
  const p = PROGRAMS.find((x) => x.id === id);
  if (!p) return null;
  const steps = p.items.map(([exId, sec], i) => step(exId, 'main', sec, i === p.items.length - 1 ? 0 : 5));
  return { kind: 'program', programId: id, title: p.title, short: p.title, color: p.color, steps, totalSec: steps.reduce((s, x) => s + x.work + x.rest, 0) };
}

export function buildSingle(exId, stage = 1) {
  const ex = EXERCISES[exId];
  const sec = ex.dose.hold ? ex.dose.hold[stage - 1] * (ex.sided ? 2 : 1) + 10 : 60;
  return { kind: 'single', title: ex.n, short: ex.n, color: 'coral', steps: [step(exId, 'main', sec, 0)], totalSec: sec };
}

// ---------- Kalender-Hilfen ----------
export function weekdayOf(date = new Date()) {
  const d = date.getDay();
  return d === 0 ? 7 : d;
}

export function mondayOf(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - (weekdayOf(d) - 1));
  return d;
}

/** Trainingswoche seit Planstart (0-basiert) */
export function weekIndex(planStartISO, date = new Date()) {
  if (!planStartISO) return 0;
  const start = mondayOf(new Date(planStartISO + 'T12:00:00'));
  const now = mondayOf(date);
  return Math.max(0, Math.round((now - start) / (7 * 864e5)));
}

/** Grobe Kalorienschätzung (MET-Methode) */
export function estimateKcal(steps, kg, doneMap) {
  let kcal = 0;
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    const done = doneMap ? doneMap[i] || 0 : s.work;
    const met = EXERCISES[s.id]?.met || 2.5;
    kcal += met * kg * (done / 3600);
    if (!doneMap) kcal += 1.5 * kg * (s.rest / 3600);
  }
  return Math.round(kcal);
}
