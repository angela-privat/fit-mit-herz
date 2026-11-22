// Fit mit Herz – Fortschritt, Serien, Meilensteine, Motivation
import { todayISO } from './store.js';
import { mondayOf, weekIndex } from './plans.js';

const DAY = 864e5;
const iso = (d) => todayISO(d);
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const parse = (s) => new Date(s + 'T12:00:00');

/** Zählt nur echte Trainings (Tagestraining ≥ 10 Min oder Programm/Pause beendet). */
export function countsForStreak(s) {
  return s.completed || (s.doneSec || 0) >= 600;
}

export function trainedDays(sessions) {
  return new Set(sessions.filter(countsForStreak).map((s) => s.day));
}

export function currentStreak(sessions, today = new Date()) {
  const days = trainedDays(sessions);
  let d = new Date(today);
  if (!days.has(iso(d))) d = addDays(d, -1); // heute noch offen → Serie zählt ab gestern
  let n = 0;
  while (days.has(iso(d))) { n++; d = addDays(d, -1); }
  return n;
}

export function longestStreak(sessions) {
  const days = [...trainedDays(sessions)].sort();
  let best = 0, cur = 0, prev = null;
  for (const s of days) {
    const d = parse(s);
    cur = prev && Math.round((d - prev) / DAY) === 1 ? cur + 1 : 1;
    best = Math.max(best, cur);
    prev = d;
  }
  return best;
}

export function weekStats(sessions, ref = new Date()) {
  const mon = mondayOf(ref);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = iso(addDays(mon, i));
    const list = sessions.filter((s) => s.day === d);
    days.push({
      date: d, wd: i + 1,
      minutes: Math.round(list.reduce((a, s) => a + (s.doneSec || 0), 0) / 60),
      done: list.some(countsForStreak),
      dayDone: list.some((s) => s.kind === 'day' && countsForStreak(s)),
    });
  }
  const list = sessions.filter((s) => s.day >= days[0].date && s.day <= days[6].date);
  return {
    days,
    minutes: days.reduce((a, d) => a + d.minutes, 0),
    sessions: list.filter(countsForStreak).length,
    activeDays: days.filter((d) => d.done).length,
    kcal: list.reduce((a, s) => a + (s.kcal || 0), 0),
  };
}

export function totals(sessions) {
  const real = sessions.filter(countsForStreak);
  return {
    sessions: real.length,
    dayTrainings: real.filter((s) => s.kind === 'day').length,
    minutes: Math.round(sessions.reduce((a, s) => a + (s.doneSec || 0), 0) / 60),
    kcal: sessions.reduce((a, s) => a + (s.kcal || 0), 0),
  };
}

// ---------- Gewicht ----------
export function bmi(kg, cm) { return kg / ((cm / 100) ** 2); }

export function bmiText(b) {
  if (b < 18.5) return 'Untergewicht';
  if (b < 25) return 'Normalgewicht';
  if (b < 30) return 'Übergewicht';
  return 'Adipositas Grad ' + (b < 35 ? 'I' : b < 40 ? 'II' : 'III');
}

export function weightSummary(state) {
  const p = state.profile;
  const ws = state.weights.filter((w) => w.kg);
  const start = p.startWeight;
  const current = ws.length ? ws[ws.length - 1].kg : start;
  const goal = p.goalWeight;
  const lost = Math.round((start - current) * 10) / 10;
  const total = Math.max(0.1, start - goal);
  const remaining = Math.max(0, Math.round((current - goal) * 10) / 10);
  const pct = Math.max(0, Math.min(100, Math.round(((start - current) / total) * 100)));
  // realistische Zieldaten bei 0,25–0,5 kg pro Woche
  const weeksFast = remaining / 0.5, weeksSlow = remaining / 0.25;
  const now = new Date();
  return {
    start, current, goal, lost, remaining, pct,
    bmi: bmi(current, p.height), bmiGoal: bmi(goal, p.height),
    etaFast: addDays(now, Math.round(weeksFast * 7)), etaSlow: addDays(now, Math.round(weeksSlow * 7)),
    entries: ws.length,
  };
}

/** Wochenmittelwerte (Mo–So) mit Bewertung */
export function weeklyWeights(weights) {
  const map = new Map();
  for (const w of weights.filter((x) => x.kg)) {
    const key = iso(mondayOf(parse(w.date)));
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(w);
  }
  const weeks = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([monday, list]) => {
    const avg = list.reduce((a, w) => a + w.kg, 0) / list.length;
    const waists = list.filter((w) => w.waist);
    return { monday, avg: Math.round(avg * 10) / 10, count: list.length, waist: waists.length ? waists[waists.length - 1].waist : null };
  });
  weeks.forEach((w, i) => {
    if (i === 0) { w.diff = null; w.rating = 'Startwoche'; w.tone = 'neutral'; return; }
    const prev = weeks[i - 1];
    const gap = Math.max(1, Math.round((parse(w.monday) - parse(prev.monday)) / (7 * DAY)));
    const diff = Math.round((w.avg - prev.avg) * 10) / 10;
    const perWeek = diff / gap;
    w.diff = diff;
    if (perWeek <= -1.0) { w.rating = 'Sehr schnell – bitte achtsam essen und nicht hungern'; w.tone = 'warn'; }
    else if (perWeek <= -0.2) { w.rating = 'Gesundes Tempo – super!'; w.tone = 'good'; }
    else if (perWeek < 0.2) { w.rating = 'Stabil – Schwankungen sind normal'; w.tone = 'neutral'; }
    else { w.rating = 'Leicht mehr – kein Grund zur Sorge, dranbleiben'; w.tone = 'neutral'; }
  });
  return weeks;
}

// ---------- Stufen-Vorschlag ----------
export function stageAdvice(state) {
  const plan = state.plan;
  const since = plan.stageSince || plan.start;
  const recent = state.sessions.filter((s) => s.kind === 'day' && s.feedback).slice(-5);
  const hard = recent.slice(-3).filter((s) => s.feedback === 'hard').length;
  if (hard >= 2 && plan.stage > 1) return { type: 'down', text: 'Die letzten Trainings waren zu schwer. Möchtest du eine Stufe zurückgehen? Das ist völlig in Ordnung.' };
  if (hard >= 2) return { type: 'easy', text: 'Die letzten Trainings waren anstrengend. Nutze ruhig die leichteren Varianten (Schalter in den Einstellungen).' };
  if (plan.stage >= 3 || !since) return null;
  const weeks = weekIndex(since);
  const inStage = state.sessions.filter((s) => s.kind === 'day' && countsForStreak(s) && s.day >= since).length;
  if (weeks >= 4 && inStage >= 12 && !recent.some((s) => s.feedback === 'hard')) {
    return { type: 'up', text: `Du trainierst seit ${weeks} Wochen auf dieser Stufe und es fühlt sich gut an. Bereit für die nächste Stufe?` };
  }
  return null;
}

// ---------- Meilensteine ----------
export const ACHIEVEMENTS = [
  { id: 'first', icon: '🌱', title: 'Der erste Schritt', text: 'Erstes Training abgeschlossen', check: (c) => c.t.sessions >= 1 },
  { id: 'first_break', icon: '☕', title: 'Aktive Pause', text: 'Erste Büropause gemacht', check: (c) => c.breaks >= 1 },
  { id: 'breaks10', icon: '🪑', title: 'Pausen-Profi', text: '10 Büropausen', check: (c) => c.breaks >= 10 },
  { id: 'streak3', icon: '🔥', title: '3 Tage am Stück', text: '3 Tage Serie', check: (c) => c.best >= 3 },
  { id: 'streak7', icon: '⭐', title: 'Eine ganze Woche', text: '7 Tage Serie', check: (c) => c.best >= 7 },
  { id: 'streak14', icon: '🌟', title: 'Zwei Wochen dran', text: '14 Tage Serie', check: (c) => c.best >= 14 },
  { id: 'streak30', icon: '🏅', title: 'Ein Monat Gewohnheit', text: '30 Tage Serie', check: (c) => c.best >= 30 },
  { id: 'streak60', icon: '🏆', title: 'Durchhalte-Heldin', text: '60 Tage Serie', check: (c) => c.best >= 60 },
  { id: 'n10', icon: '💪', title: '10 Trainings', text: '10 Trainings geschafft', check: (c) => c.t.sessions >= 10 },
  { id: 'n25', icon: '💪', title: '25 Trainings', text: '25 Trainings geschafft', check: (c) => c.t.sessions >= 25 },
  { id: 'n50', icon: '🎖️', title: '50 Trainings', text: '50 Trainings geschafft', check: (c) => c.t.sessions >= 50 },
  { id: 'n100', icon: '👑', title: '100 Trainings', text: '100 Trainings geschafft', check: (c) => c.t.sessions >= 100 },
  { id: 'h10', icon: '⏱️', title: '10 Stunden Bewegung', text: '600 Minuten trainiert', check: (c) => c.t.minutes >= 600 },
  { id: 'fullweek', icon: '📅', title: 'Perfekte Woche', text: 'An allen 7 Tagen einer Woche trainiert', check: (c) => c.fullWeek },
  { id: 'kg1', icon: '🎈', title: 'Das erste Kilo', text: '1 kg abgenommen', check: (c) => c.w.lost >= 1 },
  { id: 'kg25', icon: '🎉', title: '2,5 kg leichter', text: '2,5 kg abgenommen', check: (c) => c.w.lost >= 2.5 },
  { id: 'kg5', icon: '🥳', title: 'Halbzeit!', text: '5 kg abgenommen', check: (c) => c.w.lost >= 5 },
  { id: 'kg75', icon: '🚀', title: '7,5 kg leichter', text: '7,5 kg abgenommen', check: (c) => c.w.lost >= 7.5 },
  { id: 'kg10', icon: '💖', title: 'Ziel erreicht!', text: '10 kg abgenommen', check: (c) => c.w.lost >= 10 },
  { id: 'weigh4', icon: '📈', title: 'Dranbleiberin', text: '4 Wochen lang Gewicht eingetragen', check: (c) => c.weeksLogged >= 4 },
  { id: 'stage2', icon: '⬆️', title: 'Stufe 2 erreicht', text: 'Aufbauen', check: (c) => c.stage >= 2 },
  { id: 'stage3', icon: '⛰️', title: 'Stufe 3 erreicht', text: 'Festigen', check: (c) => c.stage >= 3 },
];

export function checkAchievements(state) {
  const sessions = state.sessions;
  const ctx = {
    t: totals(sessions), best: longestStreak(sessions), breaks: state.breaks || 0,
    w: weightSummary(state), stage: state.plan.stage,
    weeksLogged: weeklyWeights(state.weights).length,
    fullWeek: hasFullWeek(sessions),
  };
  const fresh = [];
  for (const a of ACHIEVEMENTS) {
    if (!state.achievements[a.id] && a.check(ctx)) {
      state.achievements[a.id] = todayISO();
      fresh.push(a);
    }
  }
  return fresh;
}

function hasFullWeek(sessions) {
  const days = trainedDays(sessions);
  const mondays = new Set([...days].map((d) => iso(mondayOf(parse(d)))));
  for (const m of mondays) {
    let all = true;
    for (let i = 0; i < 7; i++) if (!days.has(iso(addDays(parse(m), i)))) { all = false; break; }
    if (all) return true;
  }
  return false;
}

// ---------- Tägliche Motivation ----------
export const QUOTES = [
  'Jede Minute Bewegung ist ein Geschenk an deinen Körper.',
  'Du musst nicht perfekt sein – nur dranbleiben.',
  'Dein Rücken sagt Danke für jede Pause vom Sitzen.',
  '30 Minuten sind 2 % deines Tages. Sie gehören dir.',
  'Langsam ist auch ein Tempo. Und es kommt an.',
  'Stark ist, wer auf seinen Körper hört.',
  'Heute ein bisschen beweglicher als gestern.',
  'Nicht die Waage, sondern deine Gewohnheiten verändern alles.',
  'Atme tief ein. Du schaffst das.',
  'Kleine Schritte, jeden Tag – das ist das ganze Geheimnis.',
  'Du trainierst nicht gegen deinen Körper, sondern für ihn.',
  'Ein Training, das du machst, ist besser als das perfekte, das du auslässt.',
  'Freu dich über jeden Fortschritt – auch über den kleinen.',
  'Dein Körper trägt dich jeden Tag. Gönn ihm Gutes.',
  'Auch leichte Varianten zählen voll.',
  'Bewegung ist Medizin für einen Schreibtisch-Tag.',
  'Schultern runter, Kopf hoch, weiter geht’s.',
  'Die beste Zeit anzufangen war gestern. Die zweitbeste ist jetzt.',
  'Du bist heute für dich da. Das ist schön.',
  'Disziplin ist, sich selbst ernst zu nehmen.',
  'Sei geduldig mit dir – Veränderung braucht Zeit.',
  'Jede Wiederholung baut ein bisschen Kraft auf.',
  'Ein beweglicher Rücken ist ein glücklicher Rücken.',
  'Du hast schon so viel geschafft. Mach weiter so.',
  'Pausen gehören zum Training dazu.',
  'Heute zählt nur: anfangen.',
  'Fühlst du dich müde? Dann wähle die sanfte Variante – aber bewege dich.',
  'Dein Wohlbefinden ist wichtiger als jede Zahl.',
  'Mit jedem Training wird es ein bisschen leichter.',
  'Gute Haltung beginnt im Kopf – und im Rücken.',
  'Du bist auf dem richtigen Weg.',
  'Gesund abnehmen heißt: geduldig abnehmen.',
  'Trink ein Glas Wasser und leg los!',
  'Du darfst stolz auf dich sein.',
  'Schwankungen auf der Waage sind normal. Bleib gelassen.',
  'Ein bisschen Bewegung ist immer besser als gar keine.',
  'Was du heute tust, spürst du morgen.',
  'Atmen, lächeln, bewegen.',
  'Deine 30 Minuten – deine Auszeit.',
  'Kraft, Beweglichkeit, Gelassenheit: Schritt für Schritt.',
];

export function quoteOfDay(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const doy = Math.floor((date - start) / DAY);
  return QUOTES[doy % QUOTES.length];
}

export function greeting(name, date = new Date()) {
  const h = date.getHours();
  const g = h < 11 ? 'Guten Morgen' : h < 17 ? 'Hallo' : h < 22 ? 'Guten Abend' : 'Gute Nacht';
  return name ? `${g}, ${name}!` : `${g}!`;
}
