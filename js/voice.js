// Fit mit Herz – Sprachansagen
// Nutzt die Stimmen des Geräts. Bevorzugt die natürlicher klingenden Online-/Neural-Stimmen
// und spricht abwechslungsreiche, freundliche Sätze statt immer derselben Ansage.
import * as store from './store.js';

let voices = [];
function loadVoices() {
  try { voices = speechSynthesis.getVoices().filter((v) => v.lang && v.lang.toLowerCase().startsWith('de')); } catch { voices = []; }
  return voices;
}
if ('speechSynthesis' in self) {
  loadVoices();
  try { speechSynthesis.addEventListener('voiceschanged', loadVoices); } catch { /* alte Browser */ }
}

// Natürlich klingende Stimmen zuerst (Google/Microsoft „Online“, „Natural“, „Neural“, „Network“)
const score = (v) => (/natural|neural|online|network|premium|enhanced/i.test(v.name) ? 3 : 0)
  + (/google/i.test(v.name) ? 2 : 0) + (/female|frau|katja|amala|seraphina|vicki|anna|marlene/i.test(v.name) ? 1 : 0)
  + (v.localService === false ? 1 : 0);

export function germanVoices() {
  return [...loadVoices()].sort((a, b) => score(b) - score(a));
}

function currentVoice() {
  const name = store.get().settings.voiceName;
  const list = germanVoices();
  return list.find((v) => v.name === name) || list[0] || null;
}

export function say(text, { interrupt = false, force = false } = {}) {
  const st = store.get().settings;
  if ((!st.voice && !force) || !('speechSynthesis' in self) || !text) return;
  try {
    if (interrupt) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE';
    u.rate = st.voiceRate || 1.0;
    u.pitch = st.voicePitch || 1.1;
    const v = currentVoice();
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch { /* keine Sprachausgabe möglich */ }
}

export const stopVoice = () => { try { speechSynthesis.cancel(); } catch { /* */ } };

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const PHRASES = {
  ready: (name) => pick([`Schön, dass du da bist! Wir starten mit ${name}.`, `Auf geht's! Als Erstes: ${name}.`, `Los geht's, du schaffst das! Zuerst: ${name}.`]),
  start: (name) => pick([`Jetzt: ${name}.`, `Weiter geht's mit ${name}.`, `Und jetzt: ${name}.`, `${name}. Ganz ruhig und gleichmäßig.`]),
  cue: (text) => text,
  half: () => pick(['Halbzeit – super machst du das!', 'Die Hälfte ist geschafft. Weiter so!', 'Prima, schon die Hälfte!', 'Halbzeit. Atme ruhig weiter.']),
  ten: () => pick(['Noch zehn Sekunden!', 'Nur noch zehn Sekunden, durchhalten!', 'Gleich geschafft, noch zehn Sekunden.']),
  side: () => pick(['Und jetzt die andere Seite.', 'Seitenwechsel bitte.', 'Jetzt kommt die zweite Seite.']),
  rest: (name) => pick([`Kurze Pause. Gleich kommt: ${name}.`, `Gut gemacht! Durchatmen. Als Nächstes: ${name}.`, `Prima! Kleine Pause, dann ${name}.`]),
  section: (sec) => ({
    main: pick(['Aufwärmen geschafft! Jetzt beginnt das Haupttraining.', 'Super, du bist warm. Jetzt kommt das Haupttraining.']),
    cool: pick(['Toll durchgehalten! Jetzt dehnen und entspannen wir.', 'Das Haupttraining ist geschafft! Zum Schluss wird gedehnt.']),
  }[sec] || ''),
  pause: () => pick(['Pause. Tipp einfach auf Weiter, wenn du bereit bist.', 'Kurze Pause. Lass dir Zeit.']),
  done: () => pick(['Geschafft! Du kannst richtig stolz auf dich sein.', 'Fantastisch, Training beendet! Gönn dir ein Glas Wasser.', 'Wunderbar gemacht! Bis morgen.']),
  stop: () => 'Bitte hör jetzt auf und ruh dich aus.',
  test: () => 'Hallo! So klinge ich im Training. Weiter so, du machst das großartig!',
};
