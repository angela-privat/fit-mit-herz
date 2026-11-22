// Fit mit Herz – App: Navigation und Seiten
import * as store from './store.js';
import { EXERCISES, EXERCISE_LIST, CATEGORIES, doseText, levelName } from './exercises.js';
import { DAYS, buildDay, buildProgram, buildSingle, PROGRAMS, STAGES, VARIANTS, SECTION_NAMES, weekdayOf, weekIndex, mondayOf } from './plans.js';
import { createFigure } from './figures.js';
import { startWorkout, isPlaying } from './trainer.js';
import { germanVoices, say, PHRASES, RECORDED } from './voice.js';
import {
  currentStreak, longestStreak, weekStats, totals, weightSummary, weeklyWeights, stageAdvice,
  ACHIEVEMENTS, checkAchievements, quoteOfDay, greeting, bmiText,
} from './progress.js';
import { lineChart, weekBars } from './charts.js';
import { ICON, esc, n1, fmtDate, fmtClock, dialog, confirmDialog, toast, download } from './ui.js';

const $ = (s, r = document) => r.querySelector(s);
const view = () => $('#view');
const S = () => store.get();
const WD = ['', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const WD2 = ['', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const num = (v) => { const x = parseFloat(String(v).replace(',', '.')); return Number.isFinite(x) ? x : null; };

let deferredInstall = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; });

// ---------------- Hilfen ----------------
function currentPlan(date = new Date()) {
  const st = S();
  const wi = weekIndex(st.plan.start, date);
  return { weekday: weekdayOf(date), stage: st.plan.stage, variant: wi % 4, week: wi + 1 };
}

function todayWorkout() {
  const c = currentPlan();
  return buildDay(c.weekday, { stage: c.stage, variant: c.variant });
}

function hydrateFigures(root = view()) {
  root.querySelectorAll('[data-fig]').forEach((el) => {
    const ex = EXERCISES[el.dataset.fig];
    if (!ex || el.firstChild) return;
    const fig = createFigure(ex.k, { animate: el.hasAttribute('data-anim'), tempo: ex.tp, label: ex.n, loop: ex.loop, zoom: ex.zoom, highlight: ex.highlight });
    el.appendChild(fig.svg);
  });
  root.querySelectorAll('[data-figp]').forEach((el) => {
    const ex = EXERCISES[el.dataset.figp];
    if (!ex || el.firstChild) return;
    const pose = /^\d+$/.test(el.dataset.pose) ? +el.dataset.pose : el.dataset.pose;
    el.appendChild(createFigure(ex.k, { pose, zoom: ex.zoom, highlight: ex.highlight, label: `${ex.n} – ${pose === 'start' ? 'Start' : pose === 'end' ? 'Ziel' : 'Bild ' + (pose + 1)}` }).svg);
  });
}

const dayDoneToday = () => S().sessions.some((s) => s.day === store.todayISO() && s.kind === 'day' && (s.completed || s.doneSec >= 1200));

function setTitle(t) { $('#page-title').textContent = t; document.title = `${t} · Fit mit Herz`; }

function setNav(key) {
  document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.nav === key));
}

// ---------------- Router ----------------
const routes = {
  start: renderStart,
  training: renderTraining,
  tag: renderDay,
  uebung: renderExercise,
  mobil: renderMobil,
  programm: renderProgram,
  bibliothek: renderLibrary,
  fortschritt: renderProgress,
  motivation: renderMotivation,
  einstellungen: renderSettings,
  sicherheit: renderSafety,
};

function route() {
  if (isPlaying()) return;
  const st = S();
  const [, name = 'start', arg] = location.hash.split('/');
  if (!st.onboarded) { renderOnboarding(); return; }
  document.body.classList.remove('onboarding');
  const fn = routes[name] || renderStart;
  fn(arg ? decodeURIComponent(arg) : undefined);
  hydrateFigures();
  window.scrollTo(0, 0);
}

export const go = (hash) => { if (location.hash === hash) route(); else location.hash = hash; };

// ---------------- Onboarding ----------------
const HEALTH_Q = [
  ['pain', 'Hast du zurzeit Schmerzen im Rücken, Nacken oder in den Gelenken?'],
  ['disc', 'Hattest du einen Bandscheibenvorfall, eine Operation oder eine Verletzung in den letzten 12 Monaten?'],
  ['heart', 'Hast du eine Herz-Kreislauf-Erkrankung, Bluthochdruck oder Diabetes?'],
  ['dizzy', 'Hast du bei Anstrengung Schwindel, Atemnot, Brustschmerzen oder Ohnmachtsanfälle?'],
  ['meds', 'Nimmst du Medikamente, die Herz, Kreislauf oder Blutdruck beeinflussen?'],
  ['advice', 'Hat dir eine Ärztin oder ein Arzt von Sport abgeraten oder gibt es sonst einen Grund zur Vorsicht?'],
];

let obStep = 0;
function renderOnboarding() {
  document.body.classList.add('onboarding');
  const st = S();
  const p = st.profile;
  setTitle('Willkommen');
  const steps = [
    () => `<div class="ob-hero"><div class="ob-logo">${ICON.heart}</div><h1>Fit mit Herz</h1>
      <p class="lead">Deine persönliche App für täglich 30 Minuten Bewegung – für einen starken Rücken, einen lockeren Nacken, mehr Beweglichkeit und gesundes Abnehmen.</p></div>
      <label class="field"><span>Wie dürfen wir dich nennen?</span><input id="ob-name" type="text" autocomplete="given-name" value="${esc(p.name)}" placeholder="Dein Vorname"></label>`,
    () => `<h2>Dein Profil</h2><p class="muted">Diese Werte bleiben nur auf deinem Gerät. Du kannst sie später in den Einstellungen ändern.</p>
      <div class="grid2">
        <label class="field"><span>Alter</span><input id="ob-age" inputmode="numeric" value="${p.age ?? ''}" placeholder="z. B. 45"></label>
        <label class="field"><span>Größe (cm)</span><input id="ob-height" inputmode="numeric" value="${p.height ?? ''}" placeholder="z. B. 170"></label>
        <label class="field"><span>Aktuelles Gewicht (kg)</span><input id="ob-start" inputmode="decimal" value="${p.startWeight ? n1(p.startWeight) : ''}" placeholder="z. B. 90"></label>
        <label class="field"><span>Zielgewicht (kg)</span><input id="ob-goal" inputmode="decimal" value="${p.goalWeight ? n1(p.goalWeight) : ''}" placeholder="z. B. 80"></label>
        <label class="field span2"><span>Bauchumfang in cm (optional – auf Höhe des Bauchnabels messen)</span><input id="ob-waist" inputmode="decimal" value="${p.startWaist ? n1(p.startWaist) : ''}" placeholder="z. B. 102"></label>
      </div>`,
    () => `<h2>Kurzer Gesundheits-Check</h2><p class="muted">Bitte ehrlich beantworten – es geht um deine Sicherheit.</p>
      <div class="hq">${HEALTH_Q.map(([k, q]) => `<div class="hq-row"><p>${q}</p><div class="seg" data-q="${k}">
        <button class="${st.health.answers[k] === false ? 'on' : ''}" data-v="no">Nein</button><button class="${st.health.answers[k] === true ? 'on' : ''}" data-v="yes">Ja</button></div></div>`).join('')}</div>`,
    () => {
      const need = Object.values(st.health.answers).some(Boolean);
      return `<h2>Wichtige Hinweise</h2>
      ${need ? `<div class="note warn"><strong>Bitte vor dem Start ärztlich abklären lassen.</strong> Du hast mindestens eine Frage mit „Ja“ beantwortet. Sprich mit deiner Hausärztin oder deinem Hausarzt (oder einer Physiotherapeutin), welche Übungen für dich geeignet sind.</div>` : ''}
      <ul class="rules">
        <li>Trainiere immer im <strong>schmerzfreien Bereich</strong>. Ein leichtes Ziehen beim Dehnen ist okay – Schmerz nicht.</li>
        <li>Bewege dich <strong>langsam und ohne Schwung</strong>. Den Kopf nie in den Nacken werfen.</li>
        <li>Jede Übung hat eine <strong>leichtere Variante</strong>. Nutze sie jederzeit.</li>
        <li>Bei <strong>Schmerzen, Schwindel oder Taubheitsgefühlen sofort aufhören</strong>. Dafür gibt es im Training einen roten Stopp-Knopf.</li>
        <li>Gesund abnehmen heißt <strong>0,25–0,5 kg pro Woche</strong>. Keine Crash-Diäten.</li>
        <li>Die App ersetzt <strong>keine ärztliche oder physiotherapeutische Behandlung</strong>.</li>
      </ul>
      <label class="check"><input type="checkbox" id="ob-ack"> <span>Ich habe die Hinweise gelesen${need ? ' und kläre meine Beschwerden ärztlich ab' : ''}.</span></label>`;
    },
  ];
  view().innerHTML = `<section class="onb card">
    <div class="ob-dots">${steps.map((_, i) => `<span class="${i <= obStep ? 'on' : ''}"></span>`).join('')}</div>
    ${steps[obStep]()}
    <div class="ob-actions">${obStep ? '<button class="btn btn-ghost" id="ob-back">Zurück</button>' : '<span></span>'}
      <button class="btn btn-primary btn-big" id="ob-next">${obStep === steps.length - 1 ? 'Los geht’s!' : 'Weiter'}</button></div></section>`;

  view().querySelectorAll('.seg').forEach((seg) => seg.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    st.health.answers[seg.dataset.q] = b.dataset.v === 'yes';
    seg.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
  }));
  $('#ob-back')?.addEventListener('click', () => { obStep--; renderOnboarding(); });
  $('#ob-next').addEventListener('click', () => {
    if (obStep === 0) p.name = $('#ob-name').value.trim();
    if (obStep === 1) {
      const vals = { age: num($('#ob-age').value), height: num($('#ob-height').value), startWeight: num($('#ob-start').value), goalWeight: num($('#ob-goal').value) };
      if (Object.values(vals).some((v) => !v)) return toast('Bitte alle Pflichtfelder ausfüllen.');
      if (vals.goalWeight >= vals.startWeight) return toast('Das Zielgewicht sollte unter dem aktuellen Gewicht liegen.');
      Object.assign(p, vals);
      p.startWaist = num($('#ob-waist').value);
    }
    if (obStep === 2) {
      if (HEALTH_Q.some(([k]) => st.health.answers[k] === undefined)) return toast('Bitte beantworte alle Fragen.');
    }
    if (obStep === 3) {
      if (!$('#ob-ack').checked) return toast('Bitte bestätige, dass du die Hinweise gelesen hast.');
      const today = store.todayISO();
      st.health.needsDoctor = Object.values(st.health.answers).some(Boolean);
      st.health.acknowledged = true;
      st.health.date = today;
      st.plan.start = store.todayISO(mondayOf(new Date()));
      st.plan.stageSince = st.plan.start;
      p.createdAt = today;
      if (!st.weights.length) store.addWeight({ date: today, kg: p.startWeight, waist: p.startWaist });
      st.onboarded = true;
      store.save();
      store.flush();
      obStep = 0;
      go('#/start');
      return;
    }
    obStep++;
    store.save();
    renderOnboarding();
  });
}

// ---------------- Start / Dashboard ----------------
function renderStart() {
  setTitle('Start'); setNav('start');
  const st = S();
  const w = todayWorkout();
  const c = currentPlan();
  const ws = weightSummary(st);
  const streak = currentStreak(st.sessions);
  const wk = weekStats(st.sessions);
  const done = dayDoneToday();
  const advice = stageAdvice(st);
  const dateStr = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
  const lastWeigh = st.weights.length ? st.weights[st.weights.length - 1].date : null;
  const weighDue = !lastWeigh || (Date.now() - new Date(lastWeigh + 'T12:00:00')) / 864e5 >= 7;

  view().innerHTML = `
    <section class="hello">
      <p class="muted">${dateStr}</p>
      <h1>${esc(greeting(st.profile.name))}</h1>
      <p class="quote">„${esc(quoteOfDay())}“</p>
    </section>
    ${st.health.needsDoctor ? `<div class="note warn small">${ICON.info}<span>Denk an die ärztliche Abklärung deiner Beschwerden. <a href="#/sicherheit">Sicherheitshinweise</a></span></div>` : ''}
    ${advice ? `<div class="note ${advice.type === 'up' ? 'good' : 'warn'}">${esc(advice.text)} <div class="note-actions">
      ${advice.type === 'up' ? '<button class="btn btn-primary small" data-stage="up">Ja, nächste Stufe</button><button class="btn btn-ghost small" data-stage="later">Später</button>' : ''}
      ${advice.type === 'down' ? '<button class="btn btn-primary small" data-stage="down">Eine Stufe zurück</button><button class="btn btn-ghost small" data-stage="later">Nein, passt</button>' : ''}
      ${advice.type === 'easy' ? '<button class="btn btn-primary small" data-stage="easy">Leichte Varianten anzeigen</button>' : ''}</div></div>` : ''}

    <section class="card today tone-${w.color}">
      <div class="today-top">
        <div><p class="eyebrow">Heute · ${WD[c.weekday]}</p><h2>${esc(w.title)}</h2>
        <p class="meta">${ICON.clock} 30 Min · Woche ${VARIANTS[c.variant]} · ${STAGES[c.stage].short}</p></div>
        <div class="today-fig" data-fig="${w.steps.find((s) => s.section === 'main').id}"></div>
      </div>
      <div class="sections"><span><strong>5 Min</strong>Aufwärmen</span><span><strong>20 Min</strong>Training</span><span><strong>5 Min</strong>Dehnen</span></div>
      ${done ? `<div class="done-banner">${ICON.check} Heute geschafft – toll!</div>
        <div class="row2"><a class="btn btn-ghost" href="#/tag/${c.weekday}">Übungen ansehen</a><button class="btn btn-ghost" id="start-today">Nochmal trainieren</button></div>`
      : `<button class="btn btn-primary btn-big" id="start-today">${ICON.play} Training starten</button>
         <a class="link-more" href="#/tag/${c.weekday}">Alle Übungen ansehen</a>`}
    </section>

    <section class="stats">
      <a class="stat" href="#/fortschritt"><span class="stat-ic">${ICON.scale}</span><strong>${n1(ws.current)} kg</strong><small>aktuelles Gewicht</small></a>
      <a class="stat" href="#/fortschritt"><span class="stat-ic">${ICON.heart}</span><strong>${ws.remaining > 0 ? n1(ws.remaining) + ' kg' : 'Ziel!'}</strong><small>${ws.remaining > 0 ? 'bis zum Ziel' : 'erreicht 🎉'}</small></a>
      <a class="stat" href="#/motivation"><span class="stat-ic">${ICON.flame}</span><strong>${streak} ${streak === 1 ? 'Tag' : 'Tage'}</strong><small>Serie</small></a>
    </section>

    <section class="card">
      <div class="card-h"><h3>Dein Weg zum Ziel</h3><span class="pill">${ws.pct} %</span></div>
      <div class="progress"><div style="width:${ws.pct}%"></div></div>
      <div class="prog-lbl"><span>Start ${n1(ws.start)} kg</span><span>${ws.lost > 0 ? '−' + n1(ws.lost) + ' kg' : ''}</span><span>Ziel ${n1(ws.goal)} kg</span></div>
      ${weighDue ? `<button class="btn btn-ghost full" data-go="#/fortschritt">${ICON.plus} Gewicht eintragen</button>` : ''}
    </section>

    <section class="card">
      <div class="card-h"><h3>Diese Woche</h3><span class="muted">${wk.activeDays}/7 Tage · ${wk.minutes} Min</span></div>
      <div class="weekdots">${wk.days.map((d) => `<div class="wd ${d.done ? 'done' : ''} ${d.wd === c.weekday ? 'today' : ''}"><span>${WD2[d.wd]}</span><i>${d.done ? '✓' : ''}</i></div>`).join('')}</div>
    </section>

    <section class="quick">
      <button class="qbtn tone-sun" data-prog="pause_komplett">${ICON.clock}<strong>5-Minuten-Pause</strong><small>für den Schreibtisch</small></button>
      <button class="qbtn tone-coral" data-prog="pause_nacken">${ICON.leaf}<strong>Nacken lösen</strong><small>3 Minuten</small></button>
    </section>`;

  $('#start-today')?.addEventListener('click', () => startDay(c.weekday));
  view().querySelectorAll('[data-prog]').forEach((b) => b.addEventListener('click', () => startProgram(b.dataset.prog)));
  view().querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));
  view().querySelectorAll('[data-stage]').forEach((b) => b.addEventListener('click', () => {
    const a = b.dataset.stage;
    if (a === 'up') setStage(st.plan.stage + 1);
    if (a === 'down') setStage(st.plan.stage - 1);
    if (a === 'easy') { st.settings.easyDefault = true; store.save(); toast('Leichtere Varianten werden jetzt immer angezeigt.'); }
    if (a === 'later') { st.plan.stageSince = store.todayISO(); store.save(); }
    route();
  }));
}

function setStage(n) {
  const st = S();
  st.plan.stage = Math.max(1, Math.min(3, n));
  st.plan.stageSince = store.todayISO();
  checkAchievements(st);
  store.save();
  toast(`Du trainierst jetzt auf ${STAGES[st.plan.stage].name}.`);
}

function onWorkoutDone() { go('#/start'); }

function startDay(weekday, startIndex = 0) {
  const c = currentPlan();
  const w = buildDay(weekday, { stage: c.stage, variant: c.variant });
  startWorkout(w, { onDone: onWorkoutDone, startIndex });
}

function startProgram(id) {
  const p = PROGRAMS.find((x) => x.id === id);
  startWorkout(buildProgram(id), { onDone: () => route(), meta: { group: p.group } });
}

// ---------------- Training: Wochenübersicht ----------------
function renderTraining() {
  setTitle('Training'); setNav('training');
  const st = S();
  const c = currentPlan();
  const wk = weekStats(st.sessions);
  view().innerHTML = `
    <section class="card stage-card">
      <div class="card-h"><h3>${STAGES[c.stage].name}</h3><span class="pill">Woche ${VARIANTS[c.variant]}</span></div>
      <p class="muted">${STAGES[c.stage].text} Die Übungen wechseln jede Woche (A, B, C, D), damit es abwechslungsreich bleibt.</p>
      <p class="muted small">Trainingswoche ${c.week} seit deinem Start.</p>
    </section>
    <h2 class="sec-h">Wochenplan</h2>
    <div class="days">
      ${[1, 2, 3, 4, 5, 6, 7].map((d) => {
        const day = DAYS[d];
        const done = wk.days[d - 1].dayDone || wk.days[d - 1].done;
        const w = buildDay(d, { stage: c.stage, variant: c.variant });
        return `<a class="daycard tone-${day.color} ${d === c.weekday ? 'today' : ''} ${done ? 'done' : ''}" href="#/tag/${d}">
          <div class="dc-fig" data-fig="${w.steps.find((s) => s.section === 'main').id}"></div>
          <div class="dc-txt"><span class="eyebrow">${WD[d]}${d === c.weekday ? ' · heute' : ''}</span><strong>${esc(day.title)}</strong><small>30 Min</small></div>
          <span class="dc-state">${done ? ICON.check : ICON.back.replace('m15 5-7 7 7 7', 'm9 5 7 7-7 7')}</span></a>`;
      }).join('')}
    </div>
    <p class="muted small center">Tipp: Du kannst jeden Tag auch ein anderes Training wählen – zum Beispiel Yoga, wenn du dich müde fühlst.</p>`;
}

// ---------------- Tagestraining ----------------
function ticksFor(weekday) {
  const st = S();
  st.ticks = st.ticks || {};
  const key = `${store.todayISO()}_${weekday}`;
  st.ticks[key] = st.ticks[key] || [];
  return { list: st.ticks[key], key };
}

function syncManualSession(weekday, w) {
  const st = S();
  const { list } = ticksFor(weekday);
  const id = `manual-${store.todayISO()}-${weekday}`;
  const doneSec = list.reduce((a, i) => a + (w.steps[i]?.work || 0), 0);
  const kg = store.currentWeight();
  const kcal = Math.round(list.reduce((a, i) => a + (EXERCISES[w.steps[i]?.id]?.met || 2.5) * kg * ((w.steps[i]?.work || 0) / 3600), 0));
  const existing = st.sessions.find((s) => s.id === id);
  const data = { kind: 'manual', title: `${w.title} (einzeln abgehakt)`, weekday, plannedSec: w.totalSec, doneSec, completed: list.length === w.steps.length, done: list.map((i) => w.steps[i].id), kcal, stage: st.plan.stage };
  if (existing) Object.assign(existing, data);
  else st.sessions.push({ id, date: new Date().toISOString(), day: store.todayISO(), ...data });
  if (!list.length) st.sessions = st.sessions.filter((s) => s.id !== id);
  checkAchievements(st);
  store.save();
}

function renderDay(arg) {
  const weekday = Math.max(1, Math.min(7, parseInt(arg, 10) || weekdayOf()));
  const c = currentPlan();
  const w = buildDay(weekday, { stage: c.stage, variant: c.variant });
  const isToday = weekday === c.weekday;
  setTitle(WD[weekday]); setNav('training');
  const ticks = isToday ? ticksFor(weekday).list : [];
  const sections = ['warm', 'main', 'cool'];
  view().innerHTML = `
    <a class="backlink" href="#/training">${ICON.back} Wochenplan</a>
    <section class="card today tone-${w.color}">
      <p class="eyebrow">${WD[weekday]} · Woche ${VARIANTS[c.variant]} · ${STAGES[c.stage].short}</p>
      <h2>${esc(w.title)}</h2>
      <p class="meta">${ICON.clock} ${Math.round(w.totalSec / 60)} Min · ${w.steps.length} Übungen</p>
      <button class="btn btn-primary btn-big" id="start-day">${ICON.play} Training starten</button>
      ${isToday ? '<p class="muted small">Oder: Übungen unten einzeln starten und abhaken.</p>' : '<p class="muted small">Du kannst dieses Training auch heute machen.</p>'}
    </section>
    ${sections.map((sec) => {
      const items = w.steps.map((s, i) => ({ s, i })).filter((x) => x.s.section === sec);
      const mins = Math.round(items.reduce((a, x) => a + x.s.work + x.s.rest, 0) / 60);
      return `<h3 class="sec-h">${SECTION_NAMES[sec]} <span class="muted">· ${mins} Min</span></h3>
      <ul class="exlist">${items.map(({ s, i }) => {
        const e = EXERCISES[s.id];
        const round = s.rounds > 1 ? `<span class="pill tiny">Runde ${s.round}</span>` : '';
        return `<li class="exrow ${ticks.includes(i) ? 'ticked' : ''}">
          <a class="ex-link" href="#/uebung/${e.id}"><div class="thumb" data-fig="${e.id}"></div>
          <div class="ex-txt"><strong>${esc(e.n)}</strong><small>${fmtClock(s.work)} · ${esc(doseText(e, c.stage))} ${round}</small></div></a>
          <button class="icon-btn play-one" data-from="${i}" aria-label="${esc(e.n)} ab hier starten">${ICON.play}</button>
          ${isToday ? `<button class="tick ${ticks.includes(i) ? 'on' : ''}" data-tick="${i}" aria-label="${esc(e.n)} abhaken">${ICON.check}</button>` : ''}
        </li>`;
      }).join('')}</ul>`;
    }).join('')}`;

  $('#start-day').addEventListener('click', () => startDay(weekday));
  view().querySelectorAll('.play-one').forEach((b) => b.addEventListener('click', async () => {
    const i = +b.dataset.from;
    const choice = await dialog({
      title: EXERCISES[w.steps[i].id].n,
      html: '<p>Möchtest du nur diese Übung machen oder das Training ab hier fortsetzen?</p>',
      buttons: [{ label: 'Abbrechen', value: null }, { label: 'Ab hier weiter', value: 'from' }, { label: 'Nur diese Übung', cls: 'btn-primary', value: 'one' }],
    });
    if (choice === 'from') startDay(weekday, i);
    if (choice === 'one') startWorkout(buildSingle(w.steps[i].id, c.stage), { onDone: () => route() });
  }));
  view().querySelectorAll('[data-tick]').forEach((b) => b.addEventListener('click', () => {
    const i = +b.dataset.tick;
    const { list } = ticksFor(weekday);
    const at = list.indexOf(i);
    if (at >= 0) list.splice(at, 1); else list.push(i);
    syncManualSession(weekday, w);
    b.classList.toggle('on', at < 0);
    b.closest('.exrow').classList.toggle('ticked', at < 0);
    if (list.length === w.steps.length) toast('Alle Übungen abgehakt – großartig! 🎉');
  }));
}

// ---------------- Übungsdetail ----------------
function renderExercise(id) {
  const e = EXERCISES[id];
  if (!e) return go('#/bibliothek');
  const st = S();
  setTitle('Übung'); setNav('');
  view().innerHTML = `
    <a class="backlink" href="javascript:history.back()">${ICON.back} Zurück</a>
    <section class="card ex-detail">
      <div class="ex-fig" data-fig="${e.id}" data-anim></div>
      ${e.loop ? `<div class="steps4">${e.k.slice(0, -1).map((_, i) => `<figure><figcaption>${i + 1}</figcaption><div data-figp="${e.id}" data-pose="${i}"></div></figure>`).join('')}</div>
        <p class="muted small center">Die Bilder 1 → 2 → 3 → 4 laufen im Kreis immer wieder durch.</p>`
      : `<div class="startziel">
        <figure><figcaption>1 · Start</figcaption><div data-figp="${e.id}" data-pose="start"></div></figure>
        <span class="sz-arrow" aria-hidden="true">➜</span>
        <figure><figcaption>2 · Ziel</figcaption><div data-figp="${e.id}" data-pose="end"></div></figure>
      </div>`}
      ${e.tip ? `<p class="funtip">${esc(e.tip)}</p>` : ''}
      <h1>${esc(e.n)}</h1>
      <div class="chips">${e.cat.map((c) => `<span class="chip static">${CATEGORIES[c]}</span>`).join('')}<span class="chip static lvl lvl${e.lvl}">Schwierigkeit: ${levelName(e.lvl)}</span></div>
      <p class="dose">${ICON.clock} ${esc(doseText(e, st.plan.stage))}${e.sided ? ' (Seite wechseln)' : ''}</p>
      <button class="btn btn-primary btn-big" id="ex-start">${ICON.play} Einzeln starten</button>
    </section>
    <section class="card"><h3>So geht’s</h3><ol class="steps">${e.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></section>
    <section class="card"><h3>Richtige Haltung</h3><p>${esc(e.pos)}</p></section>
    <section class="card warnbox"><h3>Häufige Fehler</h3><ul>${e.err.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></section>
    <section class="card easybox"><h3>${ICON.easy} Leichtere Variante</h3><p>${esc(e.easy)}</p></section>
    <section class="card"><h3>Trainierte Muskeln</h3><p>${esc(e.mus)}</p></section>
    <p class="note small">${ICON.alert}<span>Nur im schmerzfreien Bereich üben. Bei Schmerzen, Schwindel oder Taubheit sofort aufhören.</span></p>`;
  $('#ex-start').addEventListener('click', () => startWorkout(buildSingle(id, st.plan.stage), { onDone: () => route() }));
}

// ---------------- Beweglichkeit ----------------
function renderMobil() {
  setTitle('Beweglichkeit'); setNav('mobil');
  const card = (p) => `<button class="prog tone-${p.color}" data-p="${p.id}">
      <div class="prog-fig" data-fig="${p.items[Math.min(3, p.items.length - 1)][0]}"></div>
      <div><strong>${esc(p.title)}</strong><small>${p.minutes} Min · ${esc(p.desc)}</small></div></button>`;
  view().innerHTML = `
    <section class="hello"><h1>Beweglich bleiben</h1><p class="muted">Yoga, Rücken & Nacken und kurze Pausen für den Schreibtisch.</p></section>
    <h2 class="sec-h">Programme</h2>
    <div class="progs">${PROGRAMS.filter((p) => p.group === 'mobil').map(card).join('')}</div>
    <h2 class="sec-h">Büropausen <span class="muted">· 3–5 Min</span></h2>
    <p class="muted small">Ideal alle 1–2 Stunden am PC. Die meisten Übungen gehen im Sitzen.</p>
    <div class="progs small">${PROGRAMS.filter((p) => p.group === 'pause').map(card).join('')}</div>
    <a class="btn btn-ghost full" href="#/bibliothek">${ICON.list} Alle ${EXERCISE_LIST.length} Übungen ansehen</a>`;
  view().querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => go('#/programm/' + b.dataset.p)));
}

function renderProgram(id) {
  const p = PROGRAMS.find((x) => x.id === id);
  if (!p) return go('#/mobil');
  setTitle(p.group === 'pause' ? 'Büropause' : 'Programm'); setNav('mobil');
  const w = buildProgram(id);
  view().innerHTML = `
    <a class="backlink" href="#/mobil">${ICON.back} Beweglichkeit</a>
    <section class="card today tone-${p.color}">
      <h2>${esc(p.title)}</h2><p>${esc(p.desc)}</p>
      <p class="meta">${ICON.clock} ${Math.round(w.totalSec / 60)} Min · ${w.steps.length} Übungen</p>
      <button class="btn btn-primary btn-big" id="p-start">${ICON.play} Starten</button>
    </section>
    <ul class="exlist">${w.steps.map((s) => {
      const e = EXERCISES[s.id];
      return `<li class="exrow"><a class="ex-link" href="#/uebung/${e.id}"><div class="thumb" data-fig="${e.id}"></div>
        <div class="ex-txt"><strong>${esc(e.n)}</strong><small>${fmtClock(s.work)}${e.sided ? ' · beide Seiten' : ''}</small></div></a></li>`;
    }).join('')}</ul>`;
  $('#p-start').addEventListener('click', () => startProgram(id));
}

// ---------------- Übungsbibliothek ----------------
let libFilter = 'all';
function renderLibrary() {
  setTitle('Übungen'); setNav('mobil');
  const cats = ['all', ...Object.keys(CATEGORIES)];
  const items = EXERCISE_LIST.filter((e) => libFilter === 'all' || e.cat.includes(libFilter));
  view().innerHTML = `
    <a class="backlink" href="#/mobil">${ICON.back} Beweglichkeit</a>
    <h1 class="page-h">Alle Übungen <span class="muted">(${items.length})</span></h1>
    <div class="chips scroll">${cats.map((c) => `<button class="chip ${libFilter === c ? 'on' : ''}" data-c="${c}">${c === 'all' ? 'Alle' : CATEGORIES[c]}</button>`).join('')}</div>
    <div class="libgrid">${items.map((e) => `<a class="libcard" href="#/uebung/${e.id}"><div class="thumb big" data-fig="${e.id}"></div>
      <strong>${esc(e.n)}</strong><small class="lvl${e.lvl}">${levelName(e.lvl)}</small></a>`).join('')}</div>`;
  view().querySelectorAll('[data-c]').forEach((b) => b.addEventListener('click', () => { libFilter = b.dataset.c; renderLibrary(); hydrateFigures(); }));
}

// ---------------- Fortschritt ----------------
function renderProgress() {
  setTitle('Fortschritt'); setNav('fortschritt');
  const st = S();
  const ws = weightSummary(st);
  const weeks = weeklyWeights(st.weights).slice(-8).reverse();
  const today = store.todayISO();
  const entries = [...st.weights].reverse();
  const waistPts = st.weights.filter((w) => w.waist).map((w) => ({ date: w.date, v: w.waist }));
  const eta = (d) => d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  const t = totals(st.sessions);
  view().innerHTML = `
    <section class="card">
      <h2>Gewicht eintragen</h2>
      <div class="grid3">
        <label class="field"><span>Datum</span><input id="w-date" type="date" value="${today}" max="${today}"></label>
        <label class="field"><span>Gewicht (kg)</span><input id="w-kg" inputmode="decimal" placeholder="${n1(ws.current)}"></label>
        <label class="field"><span>Bauch (cm)</span><input id="w-waist" inputmode="decimal" placeholder="optional"></label>
      </div>
      <button class="btn btn-primary full" id="w-save">${ICON.plus} Speichern</button>
      <p class="muted small">Tipp: Wiege dich 1× pro Woche morgens nach dem Aufstehen, immer unter gleichen Bedingungen. Bauchumfang auf Höhe des Bauchnabels, entspannt ausatmen.</p>
    </section>

    <section class="stats">
      <div class="stat"><strong>${n1(ws.start)}</strong><small>Start (kg)</small></div>
      <div class="stat hi"><strong>${n1(ws.current)}</strong><small>Aktuell (kg)</small></div>
      <div class="stat"><strong>${n1(ws.goal)}</strong><small>Ziel (kg)</small></div>
    </section>
    <section class="card">
      <div class="card-h"><h3>${ws.lost > 0 ? `Schon ${n1(ws.lost)} kg geschafft!` : 'Dein Weg beginnt'}</h3><span class="pill">${ws.pct} %</span></div>
      <div class="progress"><div style="width:${ws.pct}%"></div></div>
      <p class="muted small">${ws.remaining > 0 ? `Noch ${n1(ws.remaining)} kg. Bei gesunden 0,25–0,5 kg pro Woche erreichst du dein Ziel etwa zwischen <strong>${eta(ws.etaFast)}</strong> und <strong>${eta(ws.etaSlow)}</strong>.` : 'Du hast dein Ziel erreicht – herzlichen Glückwunsch! Du kannst in den Einstellungen ein neues Ziel festlegen.'}</p>
      <p class="muted small">BMI aktuell ${n1(ws.bmi)} (${bmiText(ws.bmi)}) · beim Ziel ${n1(ws.bmiGoal)}. Der BMI ist nur ein grober Richtwert.</p>
    </section>

    <section class="card"><h3>Gewichtsverlauf</h3>
      ${lineChart(st.weights.filter((w) => w.kg).map((w) => ({ date: w.date, v: w.kg })), { goal: ws.goal, start: ws.start, unit: 'kg', label: 'Gewichtsverlauf', corridor: st.weights.length ? { from: st.weights[0].date, start: st.weights[0].kg } : null })}
      <p class="legend"><i class="lg-line"></i> Gewicht <i class="lg-band"></i> gesunder Bereich (0,25–0,5 kg/Woche) <i class="lg-goal"></i> Ziel</p>
    </section>
    <section class="card"><h3>Bauchumfang</h3>
      ${lineChart(waistPts, { unit: 'cm', label: 'Bauchumfang' })}
      <p class="muted small">Ein schrumpfender Bauchumfang zeigt Fortschritt oft früher als die Waage – Muskeln wiegen mehr als Fett.</p>
    </section>

    <section class="card"><h3>Wochenauswertung</h3>
      ${weeks.length ? `<table class="tbl"><thead><tr><th>Woche ab</th><th>Ø kg</th><th>±</th><th>Bewertung</th></tr></thead><tbody>
      ${weeks.map((w) => `<tr><td>${fmtDate(w.monday, { day: 'numeric', month: 'short' })}</td><td>${n1(w.avg)}</td><td class="${w.diff < 0 ? 'down' : w.diff > 0 ? 'up' : ''}">${w.diff == null ? '–' : (w.diff > 0 ? '+' : '') + n1(w.diff)}</td><td class="tone-${w.tone}">${esc(w.rating)}</td></tr>`).join('')}
      </tbody></table>` : '<p class="muted">Noch keine Daten.</p>'}
    </section>

    <section class="card"><h3>Kalorienverbrauch durch Training</h3>
      <p><strong>≈ ${t.kcal.toLocaleString('de-DE')} kcal</strong> in ${t.minutes} Minuten Training insgesamt.</p>
      <p class="muted small">Grobe Schätzung nach der MET-Methode (Belastung × Körpergewicht × Zeit). Abnehmen gelingt vor allem über eine ausgewogene Ernährung – das Training unterstützt dich, stärkt Muskeln und tut Rücken und Laune gut. Faustregel: ein leichtes Kaloriendefizit von etwa 300–500 kcal pro Tag, keine Crash-Diäten.</p>
    </section>

    <section class="card"><h3>Alle Einträge</h3>
      ${entries.length ? `<ul class="entries">${entries.map((w) => `<li><span>${fmtDate(w.date)}</span><strong>${w.kg ? n1(w.kg) + ' kg' : ''}</strong><span class="muted">${w.waist ? n1(w.waist) + ' cm' : ''}</span>
        <button class="icon-btn small" data-del="${w.date}" aria-label="Eintrag vom ${fmtDate(w.date)} löschen">${ICON.trash}</button></li>`).join('')}</ul>` : '<p class="muted">Noch keine Einträge.</p>'}
    </section>`;

  $('#w-save').addEventListener('click', () => {
    const date = $('#w-date').value || today;
    const kg = num($('#w-kg').value), waist = num($('#w-waist').value);
    if (!kg && !waist) return toast('Bitte Gewicht oder Bauchumfang eingeben.');
    if (kg && (kg < 35 || kg > 250)) return toast('Bitte ein realistisches Gewicht in kg eingeben.');
    if (waist && (waist < 40 || waist > 200)) return toast('Bitte den Bauchumfang in cm eingeben.');
    const prev = st.weights.find((w) => w.date === date);
    store.addWeight({ date, kg: kg || prev?.kg, waist: waist || prev?.waist });
    const fresh = checkAchievements(st);
    store.save();
    toast(prev ? 'Eintrag aktualisiert ✓' : 'Gespeichert ✓');
    if (fresh.length) setTimeout(() => toast(`${fresh[0].icon} Neuer Meilenstein: ${fresh[0].title}`, 4000), 1200);
    route();
  });
  view().querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
    if (await confirmDialog('Eintrag löschen?', `<p>Eintrag vom ${fmtDate(b.dataset.del)} wirklich löschen?</p>`, 'Löschen', 'Abbrechen', true)) {
      store.deleteWeight(b.dataset.del); route();
    }
  }));
}

// ---------------- Motivation ----------------
function renderMotivation() {
  setTitle('Motivation'); setNav('motivation');
  const st = S();
  checkAchievements(st);
  const streak = currentStreak(st.sessions), best = longestStreak(st.sessions);
  const wk = weekStats(st.sessions);
  const t = totals(st.sessions);
  const got = ACHIEVEMENTS.filter((a) => st.achievements[a.id]);
  view().innerHTML = `
    <section class="card quote-card"><p class="eyebrow">Gedanke des Tages</p><p class="quote big">„${esc(quoteOfDay())}“</p></section>
    <section class="stats">
      <div class="stat hi"><span class="stat-ic">${ICON.flame}</span><strong>${streak}</strong><small>Tage Serie</small></div>
      <div class="stat"><strong>${best}</strong><small>längste Serie</small></div>
      <div class="stat"><strong>${t.sessions}</strong><small>Trainings gesamt</small></div>
    </section>
    <section class="card"><div class="card-h"><h3>Wochenstatistik</h3><span class="muted">Minuten pro Tag</span></div>
      ${weekBars(wk.days, 30)}
      <div class="wk-sum"><span><strong>${wk.minutes}</strong> Min</span><span><strong>${wk.activeDays}</strong> aktive Tage</span><span><strong>≈ ${wk.kcal}</strong> kcal</span></div>
    </section>
    <section class="card"><h3>Persönliche Erfolge</h3>
      <ul class="succ">
        <li>${ICON.clock} <span><strong>${Math.floor(t.minutes / 60)} Std ${t.minutes % 60} Min</strong> Bewegung insgesamt</span></li>
        <li>${ICON.train} <span><strong>${t.dayTrainings}</strong> komplette Tagestrainings</span></li>
        <li>${ICON.leaf} <span><strong>${st.breaks || 0}</strong> Büropausen</span></li>
        <li>${ICON.scale} <span><strong>${n1(Math.max(0, weightSummary(st).lost))} kg</strong> abgenommen</span></li>
      </ul></section>
    <section class="card"><div class="card-h"><h3>Meilensteine</h3><span class="pill">${got.length}/${ACHIEVEMENTS.length}</span></div>
      <div class="badges">${ACHIEVEMENTS.map((a) => {
        const d = st.achievements[a.id];
        return `<div class="badge ${d ? 'got' : ''}"><span class="b-ic">${d ? a.icon : '🔒'}</span><div><strong>${esc(a.title)}</strong><small>${d ? 'erreicht am ' + fmtDate(d, { day: 'numeric', month: 'short', year: 'numeric' }) : esc(a.text)}</small></div></div>`;
      }).join('')}</div></section>`;
  store.save();
}

// ---------------- Einstellungen ----------------
function renderSettings() {
  setTitle('Einstellungen'); setNav('');
  const st = S(); const p = st.profile; const s = st.settings;
  const toggle = (k, label, sub = '') => `<label class="switch"><span><strong>${label}</strong>${sub ? `<small>${sub}</small>` : ''}</span><input type="checkbox" data-set="${k}" ${s[k] ? 'checked' : ''}><i></i></label>`;
  view().innerHTML = `
    <section class="card"><h2>Profil</h2>
      <div class="grid2">
        <label class="field span2"><span>Name</span><input id="p-name" value="${esc(p.name)}"></label>
        <label class="field"><span>Alter</span><input id="p-age" inputmode="numeric" value="${p.age}"></label>
        <label class="field"><span>Größe (cm)</span><input id="p-height" inputmode="numeric" value="${p.height}"></label>
        <label class="field"><span>Startgewicht (kg)</span><input id="p-start" inputmode="decimal" value="${n1(p.startWeight)}"></label>
        <label class="field"><span>Zielgewicht (kg)</span><input id="p-goal" inputmode="decimal" value="${n1(p.goalWeight)}"></label>
      </div>
      <button class="btn btn-primary full" id="p-save">Profil speichern</button>
    </section>
    <section class="card"><h2>Trainingsstufe</h2>
      <div class="seg wide" id="stage-seg">${[1, 2, 3].map((n) => `<button data-v="${n}" class="${st.plan.stage === n ? 'on' : ''}">${STAGES[n].short}</button>`).join('')}</div>
      <p class="muted small">${STAGES[st.plan.stage].text} Steigere erst, wenn sich die aktuelle Stufe mehrere Wochen leicht anfühlt.</p>
    </section>
    <section class="card"><h2>Training</h2>
      ${toggle('sound', 'Signaltöne', 'Piepen bei Start, Ende und den letzten 3 Sekunden')}
      ${toggle('voice', 'Sprachansage', 'Begleitet dich durchs Training und motiviert dich')}
      ${toggle('voiceCues', 'Haltungstipp vorlesen', 'Zu jeder Übung ein kurzer Hinweis zur richtigen Haltung')}
      <div class="voicebox">
        <label class="field"><span>Stimme</span><select id="v-name"></select></label>
        <label class="field"><span>Sprechtempo <output id="v-rate-o"></output></span><input type="range" id="v-rate" min="0.8" max="1.25" step="0.05" value="${s.voiceRate ?? 1}"></label>
        <label class="field" id="v-pitch-f"><span>Tonhöhe <output id="v-pitch-o"></output></span><input type="range" id="v-pitch" min="0.8" max="1.4" step="0.05" value="${s.voicePitch ?? 1}"></label>
        <button class="btn btn-ghost full" id="v-test">${ICON.sound} Stimme anhören</button>
        <p class="muted small" id="v-hint"></p>
      </div>
      ${toggle('vibrate', 'Vibration', 'nur auf dem Handy')}
      ${toggle('easyDefault', 'Leichtere Varianten immer anzeigen', 'Empfohlen für die ersten Wochen oder an schweren Tagen')}
    </section>
    <section class="card"><h2>Deine Daten</h2>
      <p class="muted small">Alle Daten sind nur auf diesem Gerät gespeichert. Mach ab und zu eine Sicherung – und nutze sie, um Daten zwischen Handy und PC zu übertragen.</p>
      <div class="btn-col">
        <button class="btn btn-ghost" id="d-json">${ICON.down} Sicherung speichern (.json)</button>
        <button class="btn btn-ghost" id="d-import">${ICON.up} Sicherung laden</button>
        <button class="btn btn-ghost" id="d-csvw">${ICON.down} Gewichte als Excel-Tabelle (.csv)</button>
        <button class="btn btn-ghost" id="d-csvs">${ICON.down} Trainings als Excel-Tabelle (.csv)</button>
      </div>
      <input type="file" id="d-file" accept=".json,application/json" hidden>
    </section>
    <section class="card"><h2>App</h2>
      <div class="btn-col">
        <button class="btn btn-ghost" id="a-install" ${deferredInstall ? '' : 'hidden'}>${ICON.down} App installieren</button>
        <a class="btn btn-ghost" href="#/sicherheit">${ICON.alert} Sicherheitshinweise</a>
        <button class="btn btn-ghost" id="a-health">${ICON.heart} Gesundheits-Check wiederholen</button>
        <button class="btn btn-danger-ghost" id="a-reset">${ICON.trash} Alle Daten löschen</button>
      </div>
      <p class="muted small center">Fit mit Herz · Version 1.4 · funktioniert auch offline<br>Stimme der Trainerin: „Kerstin“ aus dem Piper-Projekt (frei lizenziert, CC0)</p>
    </section>`;

  $('#p-save').addEventListener('click', () => {
    const vals = { age: num($('#p-age').value), height: num($('#p-height').value), startWeight: num($('#p-start').value), goalWeight: num($('#p-goal').value) };
    if (Object.values(vals).some((v) => !v)) return toast('Bitte alle Felder ausfüllen.');
    Object.assign(p, vals, { name: $('#p-name').value.trim() });
    store.save(); toast('Profil gespeichert ✓');
  });
  $('#stage-seg').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    setStage(+b.dataset.v); renderSettings();
  });
  view().querySelectorAll('[data-set]').forEach((inp) => inp.addEventListener('change', () => { s[inp.dataset.set] = inp.checked; store.save(); }));
  // Stimme
  const fillVoices = () => {
    const sel = $('#v-name'); if (!sel) return;
    const list = germanVoices();
    sel.innerHTML = `<option value="${RECORDED}">Trainerin Kerstin – natürliche Aufnahme (empfohlen)</option>`
      + list.map((v) => `<option value="${esc(v.name)}">Gerätestimme: ${esc(v.name)}${v.localService === false ? ' (online)' : ''}</option>`).join('');
    sel.value = s.voiceName && list.some((v) => v.name === s.voiceName) ? s.voiceName : RECORDED;
    const rec = sel.value === RECORDED;
    $('#v-pitch-f').hidden = rec;
    $('#v-hint').textContent = rec
      ? 'Die Aufnahmen sind in der App gespeichert und funktionieren auch ohne Internet.'
      : 'Gerätestimmen klingen je nach Handy unterschiedlich. Stimmen mit „Online“ oder „Natural“ im Namen sind meist am natürlichsten.';
  };
  fillVoices();
  try { speechSynthesis.addEventListener('voiceschanged', fillVoices, { once: true }); } catch { /* */ }
  const showVals = () => { $('#v-rate-o').textContent = n1($('#v-rate').value) + '×'; $('#v-pitch-o').textContent = n1($('#v-pitch').value); };
  showVals();
  $('#v-name').addEventListener('change', (e) => { s.voiceName = e.target.value; store.save(); fillVoices(); say(PHRASES.test(), { interrupt: true, force: true }); });
  $('#v-rate').addEventListener('input', (e) => { s.voiceRate = +e.target.value; showVals(); store.save(); });
  $('#v-pitch').addEventListener('input', (e) => { s.voicePitch = +e.target.value; showVals(); store.save(); });
  $('#v-rate').addEventListener('change', () => say(PHRASES.test(), { interrupt: true, force: true }));
  $('#v-pitch').addEventListener('change', () => say(PHRASES.test(), { interrupt: true, force: true }));
  $('#v-test').addEventListener('click', () => say(PHRASES.test(), { interrupt: true, force: true }));
  const stamp = store.todayISO();
  $('#d-json').addEventListener('click', () => { download(`fit-mit-herz-sicherung-${stamp}.json`, store.exportJSON()); toast('Sicherung gespeichert (Ordner „Downloads“).'); });
  $('#d-csvw').addEventListener('click', () => download(`fit-mit-herz-gewicht-${stamp}.csv`, store.exportWeightsCSV(), 'text/csv;charset=utf-8'));
  $('#d-csvs').addEventListener('click', () => download(`fit-mit-herz-trainings-${stamp}.csv`, store.exportSessionsCSV(), 'text/csv;charset=utf-8'));
  $('#d-import').addEventListener('click', () => $('#d-file').click());
  $('#d-file').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const text = await f.text();
    if (!(await confirmDialog('Sicherung laden?', '<p>Die aktuellen Daten auf diesem Gerät werden durch die Sicherung <strong>ersetzt</strong>.</p>', 'Laden', 'Abbrechen'))) return;
    try { store.importJSON(text); await store.flush(); toast('Sicherung geladen ✓'); go('#/start'); }
    catch (err) { dialog({ title: 'Das hat nicht geklappt', html: `<p>${esc(err.message)}</p>` }); }
  });
  $('#a-install').addEventListener('click', async () => { if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; } });
  $('#a-health').addEventListener('click', () => { st.onboarded = false; obStep = 2; store.save(); route(); });
  $('#a-reset').addEventListener('click', async () => {
    if (!(await confirmDialog('Wirklich alle Daten löschen?', '<p>Gewichte, Trainings und Erfolge werden <strong>unwiderruflich</strong> gelöscht. Tipp: Vorher eine Sicherung speichern.</p>', 'Alles löschen', 'Abbrechen', true))) return;
    store.resetAll(); await store.flush(); obStep = 0; go('#/start');
  });
}

// ---------------- Sicherheit ----------------
function renderSafety() {
  setTitle('Sicherheit'); setNav('');
  view().innerHTML = `
    <a class="backlink" href="javascript:history.back()">${ICON.back} Zurück</a>
    <section class="card"><h1>Sicher trainieren</h1>
      <ul class="rules">
        <li><strong>Schmerzfrei bleiben:</strong> Ein leichtes Ziehen beim Dehnen ist in Ordnung, Schmerz nicht.</li>
        <li><strong>Sofort aufhören</strong> bei Schmerzen, Schwindel, Taubheitsgefühl, Kribbeln in Armen oder Beinen, Übelkeit oder Atemnot.</li>
        <li><strong>Notfall:</strong> Bei Brustschmerz, Druck in der Brust, starker Atemnot, Lähmung oder Sprachstörung sofort <a href="tel:112">112</a> anrufen.</li>
        <li><strong>Nacken:</strong> Nur sanfte, langsame Bewegungen nach vorn, zur Seite und zum Drehen. Den Kopf nie in den Nacken werfen, nie mit der Hand am Kopf ziehen.</li>
        <li><strong>Ohne Schwung:</strong> Alle Übungen langsam und kontrolliert, gleichmäßig weiteratmen.</li>
        <li><strong>Leichtere Variante:</strong> Gibt es bei jeder Übung. Sie zählt genauso.</li>
        <li><strong>Langsam steigern:</strong> Bleib mindestens 4 Wochen auf einer Stufe.</li>
        <li><strong>Bei bestehenden Beschwerden</strong> (Bandscheibe, Gelenke, Herz-Kreislauf, Bluthochdruck, nach Operationen): vor dem Training ärztlich abklären lassen.</li>
        <li><strong>Gesund abnehmen:</strong> 0,25–0,5 kg pro Woche, ausgewogen essen, genug trinken, keine Crash-Diäten.</li>
      </ul>
      <p class="note">Diese App ersetzt keine ärztliche oder physiotherapeutische Untersuchung oder Behandlung.</p>
    </section>`;
}

// ---------------- Start der App ----------------
async function init() {
  await store.load();
  if (S().onboarded) checkAchievements(S());
  window.addEventListener('hashchange', route);
  if (!location.hash) history.replaceState(null, '', '#/start');
  route();
  window.addEventListener('pagehide', () => store.flush());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') store.flush(); });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('Service Worker nicht registriert', e));
  }
}

init();
