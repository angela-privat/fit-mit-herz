// Fit mit Herz – Sprachansagen
// Standard: echte Sprachaufnahmen der Trainerin „Jessica“ (ElevenLabs, Ordner audio/, offline verfügbar).
// Alternativ: eine Vorlesestimme des Geräts (Web Speech API).
// Eine Ansage besteht aus Bausteinen { id, text } – z. B. „Weiter geht's mit“ + „Marschieren auf der Stelle.“
import * as store from './store.js';
import { CLIPS, spokenName } from './phrases.js';

export const RECORDED = '__kerstin';

// ---------- Gerätestimmen ----------
let voices = [];
function loadVoices() {
  try { voices = speechSynthesis.getVoices().filter((v) => v.lang && v.lang.toLowerCase().startsWith('de')); } catch { voices = []; }
  return voices;
}
if ('speechSynthesis' in self) {
  loadVoices();
  try { speechSynthesis.addEventListener('voiceschanged', loadVoices); } catch { /* alte Browser */ }
}
const score = (v) => (/natural|neural|online|network|premium|enhanced/i.test(v.name) ? 3 : 0)
  + (/google/i.test(v.name) ? 2 : 0) + (v.localService === false ? 1 : 0);
export function germanVoices() { return [...loadVoices()].sort((a, b) => score(b) - score(a)); }

// ---------- Aufnahmen ----------
let available = null; // Set der vorhandenen Aufnahmen
fetch('audio/clips.json').then((r) => r.json()).then((m) => { available = new Set(m.files); }).catch(() => { available = new Set(); });

const useRecordings = () => {
  const name = store.get().settings.voiceName;
  return !name || name === RECORDED;
};

let queue = [];
let player = null;
let speaking = false;

function playNext() {
  const id = queue.shift();
  if (!id) { speaking = false; return; }
  speaking = true;
  player = player || new Audio();
  player.src = `audio/${id}.ogg`;
  player.playbackRate = store.get().settings.voiceRate || 1;
  player.onended = () => setTimeout(playNext, 60);
  player.onerror = () => playNext();
  const p = player.play();
  if (p && p.catch) p.catch(() => { speaking = false; queue = []; });
}

function stopAll() {
  queue = [];
  speaking = false;
  if (player) { try { player.pause(); } catch { /* */ } }
  try { speechSynthesis.cancel(); } catch { /* */ }
}
export const stopVoice = stopAll;

export function isSpeaking() {
  if (speaking) return true;
  try { return speechSynthesis.speaking || speechSynthesis.pending; } catch { return false; }
}

function speakTTS(text, interrupt) {
  if (!('speechSynthesis' in self)) return;
  try {
    if (interrupt) speechSynthesis.cancel();
    const st = store.get().settings;
    const u = new SpeechSynthesisUtterance(text.replace(/\s*\([^)]*\)/g, ''));
    u.lang = 'de-DE';
    u.rate = st.voiceRate || 1.0;
    u.pitch = st.voicePitch || 1.0;
    const v = germanVoices().find((x) => x.name === st.voiceName);
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch { /* keine Sprachausgabe möglich */ }
}

/**
 * Spricht eine Ansage. segs: Liste von Bausteinen { id, text } (oder ein einfacher Text).
 * interrupt: laufende Ansage abbrechen. force: auch wenn Sprachansage ausgeschaltet ist (Probe).
 */
export function say(segs, { interrupt = false, force = false } = {}) {
  const st = store.get().settings;
  if (!st.voice && !force) return;
  if (!segs) return;
  if (typeof segs === 'string') segs = [{ text: segs }];
  segs = segs.filter((s) => s && s.text);
  if (!segs.length) return;
  if (interrupt) stopAll();
  const canRecord = useRecordings() && available && segs.every((s) => s.id && available.has(s.id));
  if (canRecord) {
    queue.push(...segs.map((s) => s.id));
    if (!speaking) playNext();
  } else {
    speakTTS(segs.map((s) => s.text).join(' '), false);
  }
}

// ---------- Ansagen ----------
const pickIdx = (n) => Math.floor(Math.random() * n);
const K = (key) => { const i = pickIdx(CLIPS[key].length); return { id: `k_${key}_${i}`, text: CLIPS[key][i] }; };
const N = (ex) => ({ id: `n_${ex.id}`, text: spokenName(ex) });
const POS = (ex) => ({ id: `p_${ex.id}`, text: ex.pos });

// Ruhige Übungen (Dehnen, Atmen, Yoga-Haltungen) bekommen ruhige Ansagen, Kraft & Cardio Trainer-Power
export const isCalm = (ex) => !!ex && (ex.cat.includes('breath') || ex.cat.includes('stretch') || (ex.cat.includes('yoga') && ex.dose.hold));

export const PHRASES = {
  ready: (ex) => [K('ready'), N(ex)],
  start: (ex, calm, withPos) => [K(calm ? 'startCalm' : 'startPower'), N(ex), withPos ? POS(ex) : K(calm ? 'sufCalm' : 'sufPower')],
  half: (calm) => [K(calm ? 'halfCalm' : 'halfPower')],
  ten: (calm) => [K(calm ? 'tenCalm' : 'tenPower')],
  side: () => [K('side')],
  rest: (ex) => [K('rest'), N(ex)],
  countdown: () => [K('countdown')],
  section: (sec) => (sec === 'main' ? [K('sectionMain')] : sec === 'cool' ? [K('sectionCool')] : []),
  pause: () => [K('pause')],
  done: () => [K('done')],
  stop: () => [K('stop')],
  test: () => [K('test')],
};
export const coachCue = (calm) => [K(calm ? 'coachCalm' : 'coachPower')];
