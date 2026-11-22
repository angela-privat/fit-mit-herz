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
    // Klammerzusätze wie „(Step-Touch)“ nicht vorlesen
    const u = new SpeechSynthesisUtterance(text.replace(/\s*\([^)]*\)/g, ''));
    u.lang = 'de-DE';
    u.rate = st.voiceRate || 1.1;
    u.pitch = st.voicePitch || 0.95;
    const v = currentVoice();
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch { /* keine Sprachausgabe möglich */ }
}

export const stopVoice = () => { try { speechSynthesis.cancel(); } catch { /* */ } };

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Ruhige Übungen (Dehnen, Atmen, Yoga-Haltungen) bekommen ruhige, aber klare Ansagen –
// Kraft- und Cardio-Übungen bekommen Trainer-Power.
export const isCalm = (ex) => !!ex && (ex.cat.includes('breath') || ex.cat.includes('stretch') || (ex.cat.includes('yoga') && ex.dose.hold));

export const PHRASES = {
  ready: (name) => pick([
    `Okay, los geht's! Wir starten mit ${name}. Stell dich bereit!`,
    `Hallo! Heute ziehen wir das gemeinsam durch. Erste Übung: ${name}.`,
    `Bereit? Dreißig Minuten gehören dir. Wir beginnen mit ${name}.`,
  ]),
  start: (name, calm) => calm
    ? pick([`${name}. Ruhig rein in die Position.`, `Jetzt ${name}. Langsam und kontrolliert.`, `${name}. Atme ruhig und gleichmäßig.`])
    : pick([`Und los! ${name}!`, `Los geht's! ${name}!`, `Auf geht's! ${name}!`, `Jetzt ${name}! Saubere Ausführung!`]),
  half: (calm) => calm
    ? pick(['Halbzeit. Lass weiter locker.', 'Die Hälfte. Atme tief in die Dehnung.'])
    : pick(['Halbzeit! Stark, weiter so!', 'Die Hälfte ist geschafft! Nicht nachlassen!', 'Halbzeit! Du bist voll dabei!']),
  ten: (calm) => calm
    ? pick(['Noch zehn Sekunden. Ganz ruhig.', 'Noch zehn Sekunden halten.'])
    : pick(['Noch zehn Sekunden! Durchziehen!', 'Zehn Sekunden noch! Gib alles!', 'Letzte zehn Sekunden! Du schaffst das!']),
  side: () => pick(['Seitenwechsel! Andere Seite!', 'Und jetzt die andere Seite! Los!', 'Wechsel! Zweite Seite!']),
  rest: (name) => pick([
    `Pause! Gut gemacht. Locker ausschütteln. Als Nächstes: ${name}.`,
    `Stark! Kurz durchatmen. Gleich kommt ${name}. Mach dich bereit!`,
    `Sehr gut! Kurze Pause. Nächste Übung: ${name}.`,
  ]),
  countdown: () => 'Drei, zwei, eins!',
  section: (sec) => ({
    main: pick([`Aufwärmen erledigt! Jetzt wird's ernst: Haupttraining! Bleib dran!`, 'Du bist warm! Jetzt kommt das Haupttraining. Volle Konzentration!']),
    cool: pick(['Haupttraining geschafft! Klasse Leistung! Jetzt dehnen wir und fahren runter.', 'Stark durchgezogen! Zum Schluss: dehnen und entspannen.']),
  }[sec] || ''),
  pause: () => pick(['Pause. Tipp auf Weiter, wenn du bereit bist.', `Kurze Pause. Dann geht's weiter!`]),
  done: () => pick([
    'Geschafft! Hervorragende Arbeit! Darauf kannst du stolz sein!',
    'Training beendet! Starke Leistung heute! Trink ein Glas Wasser.',
    'Fertig! Das war richtig gut! Morgen machen wir weiter!',
  ]),
  stop: () => 'Stopp! Hör sofort auf und ruh dich aus.',
  test: () => 'Hallo, ich bin deine Trainerin! Los geht\'s! Bauch fest, Schultern runter und weiter atmen! Du schaffst das!',
};

// Kurze Zurufe während der Übung
const COACH_POWER = ['Bauch fest!', 'Schultern runter!', 'Weiter atmen!', 'Sauber bleiben!', 'Kontrolliert! Kein Schwung!', 'Gut so! Weiter!', 'Stark! Bleib dran!', 'Rücken gerade!', 'Langsam und sauber!', 'Super Tempo! Weiter!'];
const COACH_CALM = ['Tief einatmen. Lang ausatmen.', 'Lass die Schultern sinken.', 'Nur bis zum angenehmen Ziehen.', 'Locker lassen.', 'Atme in die Dehnung hinein.'];
export const coachCue = (calm) => pick(calm ? COACH_CALM : COACH_POWER);
