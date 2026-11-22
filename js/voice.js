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
    u.rate = st.voiceRate || 1.0;
    u.pitch = st.voicePitch || 1.0;
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

// Fließend formuliert: ganze Sätze mit Kommas statt vieler kurzer Ausrufe –
// so klingt die Gerätestimme deutlich natürlicher und weniger abgehackt.
export const PHRASES = {
  ready: (name) => pick([
    `Schön, dass du da bist. Wir legen gleich los und starten mit ${name}.`,
    `Hallo, heute ziehen wir das gemeinsam durch. Als Erstes machen wir ${name}.`,
    `Die nächsten dreißig Minuten gehören dir. Wir beginnen mit ${name}, mach dich bereit.`,
  ]),
  start: (name, calm) => calm
    ? pick([`Jetzt kommt ${name}, geh ganz ruhig in die Position.`, `Weiter mit ${name}, langsam und kontrolliert.`, `Als Nächstes ${name}, atme dabei ruhig und gleichmäßig.`])
    : pick([`Und los geht's mit ${name}.`, `Jetzt kommt ${name}, und los.`, `Weiter geht's mit ${name}, schön sauber ausführen.`, `Auf geht's, ${name}.`]),
  half: (calm) => calm
    ? pick(['Die Hälfte ist geschafft, bleib ganz locker.', 'Halbzeit, atme tief in die Dehnung hinein.'])
    : pick(['Die Hälfte hast du schon geschafft, bleib dran.', 'Halbzeit, das machst du richtig gut, weiter so.', 'Super, schon die Hälfte, jetzt nicht nachlassen.']),
  ten: (calm) => calm
    ? pick(['Noch zehn Sekunden, ganz ruhig weiteratmen.', 'Nur noch zehn Sekunden halten.'])
    : pick(['Noch zehn Sekunden, zieh das jetzt durch.', 'Nur noch zehn Sekunden, gib noch mal alles.', 'Die letzten zehn Sekunden, du schaffst das.']),
  side: () => pick(['Und jetzt wechselst du auf die andere Seite.', 'Seitenwechsel, jetzt kommt die zweite Seite.', 'Sehr gut, und jetzt die andere Seite.']),
  rest: (name) => pick([
    `Gut gemacht, kurze Pause. Schüttel dich locker aus, gleich kommt ${name}.`,
    `Stark, jetzt kurz durchatmen. Als Nächstes machen wir ${name}.`,
    `Sehr schön, kleine Pause. Mach dich bereit für ${name}.`,
  ]),
  countdown: () => 'Drei, zwei, eins, und los.',
  section: (sec) => ({
    main: pick([`Das Aufwärmen ist geschafft, jetzt beginnt das Haupttraining.`, `Du bist schön warm, jetzt starten wir mit dem Haupttraining.`]),
    cool: pick(['Das Haupttraining ist geschafft, klasse Leistung. Jetzt dehnen wir und fahren langsam runter.', 'Stark durchgezogen. Zum Schluss wird gedehnt und entspannt.']),
  }[sec] || ''),
  pause: () => pick(['Kurze Pause. Tipp auf Weiter, sobald du bereit bist.', `Wir machen eine kurze Pause, danach geht's weiter.`]),
  done: () => pick([
    'Geschafft, das war hervorragende Arbeit. Darauf kannst du richtig stolz sein.',
    'Das Training ist beendet, starke Leistung heute. Trink jetzt ein großes Glas Wasser.',
    'Fertig, das war richtig gut. Morgen machen wir genauso weiter.',
  ]),
  stop: () => 'Bitte hör sofort auf und ruh dich aus.',
  test: () => `Hallo, ich bin deine Trainerin. Halte den Bauch schön fest, lass die Schultern unten und atme ruhig weiter. Das machst du richtig gut.`,
};

// Zurufe während der Übung – als kurze, aber vollständige Sätze
const COACH_POWER = [
  'Halte den Bauch schön fest.', 'Lass die Schultern unten und atme weiter.', 'Schön sauber bleiben, ganz ohne Schwung.',
  'Sehr gut, bleib genau so dran.', 'Halte den Rücken lang und gerade.', 'Gleichmäßig weiteratmen, das sieht gut aus.',
  'Langsam und kontrolliert, genau so.', 'Stark, du bist voll dabei.',
];
const COACH_CALM = [
  'Atme tief ein und ganz lang wieder aus.', 'Lass die Schultern sinken und werde locker.',
  'Geh nur bis zu einem angenehmen Ziehen.', 'Atme ruhig in die Dehnung hinein.',
];
export const coachCue = (calm) => pick(calm ? COACH_CALM : COACH_POWER);
