// Fit mit Herz – Trainings-Modus mit Timer
import { EXERCISES, doseText } from './exercises.js';
import { SECTION_NAMES, estimateKcal } from './plans.js';
import { createFigure } from './figures.js';
import * as store from './store.js';
import { checkAchievements } from './progress.js';
import { ICON, esc, fmtClock, dialog, confirmDialog, n1 } from './ui.js';

let audioCtx = null;
function beep(freq = 880, dur = 0.12, vol = 0.18) {
  if (!store.get().settings.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur + 0.02);
  } catch { /* kein Ton möglich */ }
}

import { say as speak, PHRASES, isCalm, coachCue, isSpeaking, stopVoice } from './voice.js';
const speechBusy = isSpeaking;
// Neue Ansage unterbricht die vorherige, damit nichts hinterherhinkt
const say = (text) => speak(text, { interrupt: true });
const sayMore = (text) => speak(text);

const vibrate = (p) => { if (store.get().settings.vibrate && navigator.vibrate) try { navigator.vibrate(p); } catch { /* */ } };

let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
    else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch { /* nicht unterstützt */ }
}

let active = null;
export const isPlaying = () => !!active;

/**
 * Startet ein Training.
 * workout: { kind, title, steps:[{id, section, work, rest}], totalSec, ... }
 * meta: { group } für Programme
 */
export function startWorkout(workout, { onDone, meta = {}, startIndex = 0 } = {}) {
  if (active) return;
  const st = store.get();
  const kg = store.currentWeight();
  const P = {
    w: workout, i: startIndex, phase: 'ready', remaining: 5, endAt: 0, running: true,
    done: {}, checked: new Set(), skipped: new Set(), easy: !!st.settings.easyDefault, showInfo: false,
    started: Date.now(), sideSwitched: false, lastBeep: null, fig: null, figId: null,
  };
  active = P;

  const root = document.createElement('div');
  root.id = 'player';
  root.className = `player tone-${workout.color || 'coral'}`;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Training');
  document.body.appendChild(root);
  document.body.classList.add('playing');
  history.pushState({ player: true }, '', location.hash);
  keepAwake(true);
  beep(660, 0.08, 0.001); // Audio freischalten

  const step = () => P.w.steps[P.i];
  const ex = () => EXERCISES[step().id];
  const nextStep = () => P.w.steps[P.i + 1];

  function layout() {
    root.innerHTML = `
      <header class="pl-head">
        <button class="icon-btn" data-a="end" aria-label="Training beenden">${ICON.close}</button>
        <div class="pl-title"><span class="pl-sec"></span><span class="pl-count"></span></div>
        <button class="icon-btn" data-a="list" aria-label="Übungsliste">${ICON.list}</button>
      </header>
      <div class="pl-progress"><div class="pl-bar"></div></div>
      <main class="pl-main">
        <div class="pl-phase"></div>
        <div class="pl-fig"></div>
        <h2 class="pl-name"></h2>
        <div class="pl-dose"></div>
        <div class="pl-side" hidden></div>
        <div class="pl-easy" hidden></div>
        <div class="pl-timer" aria-live="off"></div>
        <div class="pl-info" hidden></div>
      </main>
      <div class="pl-controls">
        <button class="ctl" data-a="prev" aria-label="Vorherige Übung">${ICON.prev}<span>Zurück</span></button>
        <button class="ctl ctl-main" data-a="toggle" aria-label="Pause"></button>
        <button class="ctl" data-a="check" aria-label="Übung abhaken">${ICON.check}<span>Erledigt</span></button>
        <button class="ctl" data-a="skip" aria-label="Übung überspringen">${ICON.next}<span>Weiter</span></button>
      </div>
      <div class="pl-extra">
        <button class="chip" data-a="easy">${ICON.easy}<span>Leichtere Variante</span></button>
        <button class="chip" data-a="info">${ICON.info}<span>Anleitung</span></button>
      </div>
      <button class="pl-stop" data-a="stop">${ICON.alert} Schmerzen, Schwindel oder Taubheit? – Hier stoppen</button>`;
    root.addEventListener('click', onClick);
  }

  function renderStep() {
    const s = step(), e = ex();
    const sectionName = P.w.kind === 'day' ? SECTION_NAMES[s.section] : P.w.title;
    root.querySelector('.pl-sec').textContent = sectionName + (s.rounds > 1 ? ` · Runde ${s.round}/${s.rounds}` : '');
    root.querySelector('.pl-count').textContent = `Übung ${P.i + 1} von ${P.w.steps.length}`;
    const showEx = P.phase === 'rest' ? nextStep() : s;
    const se = EXERCISES[showEx.id];
    if (P.figId !== se.id) {
      const box = root.querySelector('.pl-fig');
      box.innerHTML = '';
      P.fig = createFigure(se.k, { animate: true, tempo: se.tp, label: se.n });
      box.appendChild(P.fig.svg);
      P.figId = se.id;
    }
    P.fig.setPaused(!P.running);
    root.querySelector('.pl-name').textContent = se.n;
    root.querySelector('.pl-dose').textContent = P.phase === 'rest' ? doseText(se, st.plan.stage) : doseText(e, st.plan.stage);
    const phaseEl = root.querySelector('.pl-phase');
    phaseEl.className = 'pl-phase ' + P.phase;
    phaseEl.textContent = P.phase === 'ready' ? 'Gleich geht’s los' : P.phase === 'rest' ? 'Kurze Pause – als Nächstes' : P.checked.has(P.i) ? 'Abgehakt ✓' : 'Jetzt';
    const easyEl = root.querySelector('.pl-easy');
    easyEl.hidden = !P.easy;
    easyEl.innerHTML = `<strong>Leichtere Variante:</strong> ${esc(se.easy)}`;
    root.querySelector('[data-a="easy"]').classList.toggle('on', P.easy);
    const info = root.querySelector('.pl-info');
    info.hidden = !P.showInfo;
    root.querySelector('[data-a="info"]').classList.toggle('on', P.showInfo);
    info.innerHTML = `<ol>${se.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
      <p><strong>Haltung:</strong> ${esc(se.pos)}</p>
      <p><strong>Häufige Fehler:</strong> ${se.err.map(esc).join(' · ')}</p>
      <p><strong>Muskeln:</strong> ${esc(se.mus)}</p>`;
    root.querySelector('[data-a="prev"]').disabled = P.i === 0;
    renderTime();
  }

  function renderTime() {
    const t = root.querySelector('.pl-timer');
    if (!t) return;
    t.textContent = fmtClock(P.remaining);
    t.classList.toggle('low', P.remaining <= 3.2 && P.phase !== 'work' ? true : P.remaining <= 3.2);
    const tg = root.querySelector('[data-a="toggle"]');
    tg.innerHTML = P.running ? `${ICON.pause}<span>Pause</span>` : `${ICON.play}<span>Weiter</span>`;
    tg.setAttribute('aria-label', P.running ? 'Pause' : 'Weiter');
    root.classList.toggle('paused', !P.running);
    // Gesamtfortschritt
    const total = P.w.steps.reduce((a, s) => a + s.work + s.rest, 0);
    let doneT = P.w.steps.slice(0, P.i).reduce((a, s) => a + s.work + s.rest, 0);
    const s = step();
    if (P.phase === 'work') doneT += s.work - P.remaining;
    if (P.phase === 'rest') doneT += s.work + (s.rest - P.remaining);
    root.querySelector('.pl-bar').style.width = `${Math.min(100, (doneT / total) * 100)}%`;
    // Seitenwechsel
    const sideEl = root.querySelector('.pl-side');
    const e = ex();
    if (P.phase === 'work' && e.sided) {
      const half = P.remaining <= s.work / 2;
      sideEl.hidden = false;
      sideEl.textContent = half ? 'Zweite Seite' : 'Erste Seite';
      sideEl.classList.toggle('switch', half);
    } else sideEl.hidden = true;
  }

  function setPhase(phase) {
    P.phase = phase;
    const s = step();
    P.remaining = phase === 'work' ? s.work : phase === 'rest' ? s.rest : 5;
    P.endAt = performance.now() + P.remaining * 1000;
    P.sideSwitched = false;
    P.saidHalf = false;
    P.saidTen = false;
    const afterCountdown = P.saidCount;
    P.saidCount = false;
    P.nextCoach = 18;
    P.lastBeep = null;
    const ex0 = EXERCISES[s.id];
    if (phase === 'ready') {
      say(PHRASES.ready(ex0));
    } else if (phase === 'work') {
      beep(990, 0.18); vibrate(120);
      const prev = P.w.steps[P.i - 1];
      const calm = isCalm(ex0);
      // Alles in EINER Ansage – das klingt flüssiger als mehrere Teile hintereinander
      const parts = [];
      if (P.w.kind === 'day' && prev && prev.section !== s.section) parts.push(...PHRASES.section(s.section));
      parts.push(...PHRASES.start(ex0, calm, store.get().settings.voiceCues !== false));
      // nach dem Countdown nicht abschneiden, sondern anschließen
      if (afterCountdown) sayMore(parts); else say(parts);
    } else if (phase === 'rest' && nextStep()) {
      beep(520, 0.15);
      say(PHRASES.rest(EXERCISES[nextStep().id]));
    }
    renderStep();
  }

  function goTo(i, phase = 'work') {
    if (i < 0) i = 0;
    if (i >= P.w.steps.length) return finish(true);
    P.i = i;
    setPhase(phase);
  }

  function advance() {
    const s = step();
    if (P.phase === 'ready') return setPhase('work');
    if (P.phase === 'work') {
      P.done[P.i] = Math.max(P.done[P.i] || 0, s.work);
      P.checked.add(P.i);
      if (s.rest > 0 && nextStep()) return setPhase('rest');
      return goTo(P.i + 1);
    }
    return goTo(P.i + 1);
  }

  function tick() {
    if (!active || active !== P) return;
    if (P.running) {
      const prev = P.remaining;
      P.remaining = Math.max(0, (P.endAt - performance.now()) / 1000);
      if (P.phase === 'work') P.done[P.i] = Math.max(P.done[P.i] || 0, step().work - P.remaining);
      const sec = Math.ceil(P.remaining);
      if (sec <= 3 && sec >= 1 && P.lastBeep !== sec && Math.ceil(prev) !== sec) { P.lastBeep = sec; beep(740, 0.09); }
      const s = step();
      if (P.phase === 'work' && EXERCISES[s.id].sided && !P.sideSwitched && P.remaining <= s.work / 2) {
        P.sideSwitched = true; beep(880, 0.12); vibrate([80, 60, 80]); say(PHRASES.side());
      }
      if (P.phase === 'work' && s.work >= 30) {
        const ex1 = EXERCISES[s.id], calm = isCalm(ex1), elapsed = s.work - P.remaining;
        if (!ex1.sided && !P.saidHalf && P.remaining <= s.work / 2 && P.remaining > 12) { P.saidHalf = true; sayMore(PHRASES.half(calm)); }
        else if (!P.saidTen && P.remaining <= 10.5 && P.remaining > 9) { P.saidTen = true; sayMore(PHRASES.ten(calm)); }
        // Trainer-Zurufe zwischendurch, aber nicht kurz vor Halbzeit, Seitenwechsel oder Ende
        else if (elapsed >= P.nextCoach && P.remaining > 14 && Math.abs(P.remaining - s.work / 2) > 5 && !speechBusy()) {
          P.nextCoach = elapsed + 14; sayMore(coachCue(calm));
        }
      }
      if (P.phase === 'rest' && s.rest >= 8 && !P.saidCount && P.remaining <= 3.4) { P.saidCount = true; say(PHRASES.countdown()); }
      if (P.remaining <= 0) advance();
      else renderTime();
    }
    P.timer = setTimeout(tick, 200);
  }

  function setRunning(v) {
    if (v === P.running) return;
    if (v) P.endAt = performance.now() + P.remaining * 1000;
    P.running = v;
    if (P.fig) P.fig.setPaused(!v);
    if (!v) say(PHRASES.pause());
    renderTime();
  }

  async function onClick(e) {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const a = b.dataset.a;
    if (a === 'toggle') setRunning(!P.running);
    if (a === 'check') { P.checked.add(P.i); P.done[P.i] = Math.max(P.done[P.i] || 0, step().work * 0.6); if (P.phase === 'ready') setPhase('work'); else advance(); }
    if (a === 'skip') { if (P.phase === 'work') P.skipped.add(P.i); if (P.phase === 'ready') setPhase('work'); else goTo(P.i + 1); }
    if (a === 'prev') goTo(P.phase === 'rest' ? P.i : P.i - 1);
    if (a === 'easy') { P.easy = !P.easy; renderStep(); }
    if (a === 'info') { P.showInfo = !P.showInfo; renderStep(); }
    if (a === 'list') showList();
    if (a === 'end') askEnd();
    if (a === 'stop') safetyStop();
  }

  async function showList() {
    const was = P.running; setRunning(false);
    const html = `<ol class="pl-list">${P.w.steps.map((s, i) => `<li class="${i === P.i ? 'cur' : ''} ${P.checked.has(i) ? 'ok' : ''} ${P.skipped.has(i) ? 'skip' : ''}">
      <button class="linkbtn" data-jump="${i}">${P.checked.has(i) ? '✓ ' : ''}${esc(EXERCISES[s.id].n)}</button><small>${fmtClock(s.work)}</small></li>`).join('')}</ol>`;
    const res = dialog({ title: 'Übungen dieses Trainings', html, buttons: [{ label: 'Schließen', cls: 'btn-primary', value: null }] });
    setTimeout(() => {
      document.querySelectorAll('[data-jump]').forEach((btn) => btn.addEventListener('click', () => {
        const i = +btn.dataset.jump;
        btn.closest('.modal-wrap').remove();
        goTo(i); setRunning(true);
      }));
      document.querySelector('.pl-list .cur')?.scrollIntoView({ block: 'center' });
    }, 50);
    await res;
    if (active === P && was && !P.running && document.querySelectorAll('.modal-wrap').length === 0) setRunning(true);
  }

  async function askEnd() {
    const was = P.running; setRunning(false);
    const ok = await confirmDialog('Training beenden?', '<p>Dein bisheriger Fortschritt wird gespeichert. Jede Minute zählt!</p>', 'Ja, beenden', 'Weitertrainieren');
    if (ok) finish(false);
    else if (was) setRunning(true);
  }

  async function safetyStop() {
    setRunning(false);
    say(PHRASES.stop());
    const r = await dialog({
      title: 'Bitte hör jetzt auf',
      tone: 'danger',
      html: `<p><strong>Brich das Training bei Schmerzen, Schwindel, Taubheitsgefühl, Kribbeln, Übelkeit oder Atemnot sofort ab.</strong></p>
        <ul><li>Setz oder leg dich ruhig hin und atme langsam.</li>
        <li>Trink etwas Wasser.</li>
        <li>Wenn die Beschwerden nicht schnell vergehen oder wiederkommen, lass sie bitte ärztlich abklären, bevor du weiter trainierst.</li></ul>
        <p class="sos"><strong>Notfall</strong> – bei Brustschmerz, Druck in der Brust, starker Atemnot, Lähmung oder Sprachstörung: sofort <a href="tel:112">112</a> anrufen.</p>`,
      buttons: [
        { label: 'Training beenden', cls: 'btn-danger', value: 'end' },
        { label: 'Es war nur kurz und ist ganz vorbei – vorsichtig mit leichter Variante weiter', cls: 'btn-ghost small', value: 'easy' },
      ],
    });
    if (r === 'end') finish(false, 'beschwerden');
    else { P.easy = true; renderStep(); }
  }

  function cleanup() {
    clearTimeout(P.timer);
    window.removeEventListener('popstate', onPop);
    document.removeEventListener('visibilitychange', onVis);
    keepAwake(false);
    stopVoice();
    document.body.classList.remove('playing');
    active = null;
  }

  async function finish(completed, stop = null) {
    if (P.finished) return;
    P.finished = true;
    clearTimeout(P.timer);
    const doneSec = Math.round(Object.values(P.done).reduce((a, x) => a + x, 0)
      + P.w.steps.slice(0, P.i).reduce((a, s) => a + s.rest, 0));
    const kcal = estimateKcal(P.w.steps, kg, P.done) + Math.round(1.5 * kg * (P.w.steps.slice(0, P.i).reduce((a, s) => a + s.rest, 0) / 3600));
    const doneIds = [...P.checked].map((i) => P.w.steps[i].id);
    const session = store.addSession({
      kind: P.w.kind, title: P.w.title, weekday: P.w.weekday, variant: P.w.variant, group: meta.group,
      programId: P.w.programId, plannedSec: P.w.totalSec, doneSec, completed: !!completed, done: [...new Set(doneIds)],
      kcal, stage: store.get().plan.stage, stop,
    });
    const fresh = checkAchievements(store.get());
    store.save();
    await store.flush();
    if (completed) { beep(660, 0.15); setTimeout(() => beep(880, 0.15), 180); setTimeout(() => beep(1100, 0.3), 360); say(PHRASES.done()); vibrate([100, 80, 100, 80, 200]); }
    keepAwake(false);
    showSummary(session, fresh, stop);
  }

  function showSummary(session, fresh, stop) {
    const min = Math.round(session.doneSec / 60);
    const fb = P.w.kind === 'day' && !stop;
    root.innerHTML = `<div class="pl-summary">
      <div class="sum-icon">${stop ? '💛' : session.completed ? '🎉' : '👍'}</div>
      <h2>${stop ? 'Gut, dass du auf deinen Körper hörst.' : session.completed ? 'Geschafft – super gemacht!' : 'Gut gemacht!'}</h2>
      <p class="muted">${esc(P.w.title)}</p>
      <div class="sum-stats">
        <div><strong>${min}</strong><span>Minuten</span></div>
        <div><strong>${session.done.length}</strong><span>Übungen</span></div>
        <div><strong>≈ ${session.kcal}</strong><span>kcal (grob)</span></div>
      </div>
      ${stop ? '<p class="note warn">Bitte trainiere erst wieder, wenn du dich gut fühlst. Bei anhaltenden Beschwerden: ärztlich abklären lassen.</p>' : ''}
      ${fresh.length ? `<div class="sum-badges"><h3>Neuer Meilenstein!</h3>${fresh.map((a) => `<div class="badge got"><span class="b-ic">${a.icon}</span><div><strong>${esc(a.title)}</strong><small>${esc(a.text)}</small></div></div>`).join('')}</div>` : ''}
      ${fb ? `<h3>Wie war das Training für dich?</h3>
      <div class="fb-row">
        <button class="btn btn-ghost fb" data-fb="easy">😌<span>Zu leicht</span></button>
        <button class="btn btn-ghost fb" data-fb="ok">😊<span>Genau richtig</span></button>
        <button class="btn btn-ghost fb" data-fb="hard">😓<span>Zu schwer</span></button>
      </div>` : ''}
      <button class="btn btn-primary btn-big" data-a="close">Fertig</button>
    </div>`;
    root.removeEventListener('click', onClick);
    root.addEventListener('click', (e) => {
      const f = e.target.closest('[data-fb]');
      if (f) {
        store.updateSession(session.id, { feedback: f.dataset.fb });
        root.querySelectorAll('[data-fb]').forEach((x) => x.classList.toggle('on', x === f));
      }
      if (e.target.closest('[data-a="close"]')) close(session);
    });
  }

  function close(session) {
    cleanup();
    root.remove();
    if (history.state && history.state.player) history.replaceState(null, '', location.hash);
    onDone && onDone(session);
  }

  function onPop() {
    if (P.finished) return;
    history.pushState({ player: true }, '', location.hash);
    askEnd();
  }
  function onVis() {
    if (document.visibilityState === 'visible' && active === P && !P.finished) keepAwake(true);
  }
  window.addEventListener('popstate', onPop);
  document.addEventListener('visibilitychange', onVis);

  layout();
  setPhase('ready');
  tick();
  return P;
}

export function kgText(kg) { return `${n1(kg)} kg`; }
