// Automatische Prüfung der Übungsdatenbank und Trainingspläne.
// Start: node tests/check.mjs
import { EXERCISES, EXERCISE_LIST, doseText } from '../js/exercises.js';
import { DAYS, buildDay, PROGRAMS, buildProgram, buildSingle, estimateKcal, weekIndex } from '../js/plans.js';
import { solve } from '../js/figures.js';

let errors = 0, warnings = 0;
const err = (m) => { errors++; console.log('  FEHLER: ' + m); };
const warn = (m) => { warnings++; console.log('  Hinweis: ' + m); };
const ok = (m) => console.log('  ok  ' + m);

console.log('\n1) Übungsdatenbank');
const ids = new Set();
for (const e of EXERCISE_LIST) {
  if (ids.has(e.id)) err(`doppelte ID ${e.id}`);
  ids.add(e.id);
  for (const f of ['n', 'cat', 'lvl', 'met', 'dose', 'steps', 'pos', 'err', 'mus', 'easy', 'k']) {
    if (e[f] === undefined || e[f] === '' || (Array.isArray(e[f]) && !e[f].length)) err(`${e.id}: Feld "${f}" fehlt`);
  }
  if (![1, 2, 3].includes(e.lvl)) err(`${e.id}: Schwierigkeit ungültig`);
  if (e.k.length < 2) err(`${e.id}: Animation braucht mindestens 2 Posen`);
  for (const pose of e.k) {
    const s = solve(pose);
    for (const key of ['head', 'W1', 'W2', 'T1', 'T2', 'K1', 'K2']) {
      const [x, y] = s[key];
      if (!Number.isFinite(x) || !Number.isFinite(y)) err(`${e.id}: Pose liefert ungültige Koordinaten (${key})`);
      if (x < -5 || x > 245 || y < -5 || y > 215) warn(`${e.id}: ${key} liegt außerhalb des Bildes (${x.toFixed(0)}, ${y.toFixed(0)})`);
    }
  }
  if (!doseText(e, 1)) err(`${e.id}: keine Dosierung`);
}
ok(`${EXERCISE_LIST.length} Übungen geprüft`);

console.log('\n2) Wochenpläne (7 Tage × 4 Varianten × 3 Stufen)');
for (const wd of Object.keys(DAYS).map(Number)) {
  for (let stage = 1; stage <= 3; stage++) {
    for (let v = 0; v < 4; v++) {
      const d = buildDay(wd, { stage, variant: v });
      const sec = (s) => d.steps.filter((x) => x.section === s).reduce((a, x) => a + x.work + x.rest, 0);
      const tag = `Tag ${wd} Stufe ${stage} Woche ${'ABCD'[v]}`;
      if (Math.abs(d.totalSec - 1800) > 30) err(`${tag}: Gesamtdauer ${d.totalSec}s statt 1800s`);
      if (Math.abs(sec('warm') - 300) > 15) err(`${tag}: Aufwärmen ${sec('warm')}s`);
      if (Math.abs(sec('main') - 1200) > 15) err(`${tag}: Haupttraining ${sec('main')}s`);
      if (Math.abs(sec('cool') - 300) > 15) err(`${tag}: Dehnen ${sec('cool')}s`);
      for (const s of d.steps) {
        if (!EXERCISES[s.id]) err(`${tag}: unbekannte Übung ${s.id}`);
        else if (EXERCISES[s.id].lvl > stage) err(`${tag}: ${s.id} ist zu schwer für Stufe ${stage}`);
        if (s.work <= 0 || s.rest < 0) err(`${tag}: ungültige Zeiten bei ${s.id}`);
      }
      const mainFirstRound = d.steps.filter((x) => x.section === 'main' && (x.round || 1) === 1).map((x) => x.id);
      const dup = mainFirstRound.filter((x, i) => mainFirstRound.indexOf(x) !== i);
      if (dup.length) warn(`${tag}: Übung doppelt in einer Runde: ${[...new Set(dup)].join(', ')}`);
    }
  }
}
ok('alle Tagespläne gebaut');

console.log('\n3) Abwechslung zwischen den Wochen');
for (const wd of Object.keys(DAYS).map(Number)) {
  const sets = [0, 1, 2, 3].map((v) => buildDay(wd, { stage: 2, variant: v }).steps.map((s) => s.id).join(','));
  const unique = new Set(sets).size;
  if (unique < 2) warn(`Tag ${wd}: alle Wochen identisch`);
  else ok(`Tag ${wd}: ${unique} verschiedene Wochenvarianten`);
}

console.log('\n4) Zusatzprogramme');
for (const p of PROGRAMS) {
  const b = buildProgram(p.id);
  for (const s of b.steps) if (!EXERCISES[s.id]) err(`${p.id}: unbekannte Übung ${s.id}`);
  const min = b.totalSec / 60;
  if (Math.abs(min - p.minutes) > p.minutes * 0.25 + 0.5) warn(`${p.id}: Dauer ${min.toFixed(1)} Min, angegeben ${p.minutes} Min`);
  else ok(`${p.title}: ${min.toFixed(1)} Min`);
}
for (const e of EXERCISE_LIST) if (buildSingle(e.id, 1).totalSec <= 0) err(`${e.id}: Einzelstart ohne Dauer`);

console.log('\n5) Kalorien & Kalender');
const kcal = estimateKcal(buildDay(3, { stage: 1 }).steps, 85);
if (kcal < 60 || kcal > 300) err(`Kalorienschätzung unplausibel: ${kcal}`); else ok(`Ganzkörper Stufe 1 bei 85 kg ≈ ${kcal} kcal`);
if (weekIndex('2026-11-23', new Date('2026-12-07T10:00:00')) !== 2) err('Wochenzählung falsch'); else ok('Wochenzählung');

console.log(`\nErgebnis: ${errors} Fehler, ${warnings} Hinweise\n`);
process.exit(errors ? 1 : 0);
