// Fit mit Herz – alle Sätze der Trainerin
// Diese Texte werden mit tools/tts als Sprachaufnahmen erzeugt (Ordner audio/).
// Übungsnamen und Haltungstipps kommen aus exercises.js.
// WICHTIG: Nach jeder Textänderung die Aufnahmen neu erzeugen (siehe ANLEITUNG.md, Abschnitt 9).

export const CLIPS = {
  // Einstieg – danach folgt der Übungsname
  ready: [
    'Schön, dass du da bist. Wir legen gleich los. Als Erstes kommt',
    'Hallo, heute ziehen wir das gemeinsam durch. Wir starten mit',
    'Die nächsten dreißig Minuten gehören dir. Wir beginnen mit',
  ],
  // Übungsstart – danach folgt der Übungsname
  startPower: ['Weiter geht\'s mit', 'Jetzt kommt', 'Auf geht\'s mit', 'Und los geht\'s mit'],
  startCalm: ['Jetzt kommt', 'Weiter mit', 'Als Nächstes kommt'],
  // nach dem Namen, wenn kein Haltungstipp vorgelesen wird
  sufPower: ['Schön sauber ausführen.', 'Und los.'],
  sufCalm: ['Geh ganz ruhig in die Position.', 'Langsam und kontrolliert.'],
  halfPower: ['Die Hälfte hast du schon geschafft, bleib dran.', 'Halbzeit, das machst du richtig gut, weiter so.', 'Super, schon die Hälfte, jetzt nicht nachlassen.'],
  halfCalm: ['Die Hälfte ist geschafft, bleib ganz locker.', 'Halbzeit, atme tief in die Dehnung hinein.'],
  tenPower: ['Noch zehn Sekunden, zieh das jetzt durch.', 'Nur noch zehn Sekunden, gib noch mal alles.', 'Die letzten zehn Sekunden, du schaffst das.'],
  tenCalm: ['Noch zehn Sekunden, ganz ruhig weiteratmen.', 'Nur noch zehn Sekunden halten.'],
  side: ['Und jetzt wechselst du auf die andere Seite.', 'Seitenwechsel, jetzt kommt die zweite Seite.', 'Sehr gut, und jetzt die andere Seite.'],
  // Pause – danach folgt der Name der nächsten Übung
  rest: [
    'Gut gemacht, kurze Pause. Schüttel dich locker aus. Gleich kommt',
    'Stark, jetzt kurz durchatmen. Als Nächstes machen wir',
    'Sehr schön, kleine Pause. Mach dich bereit für',
  ],
  countdown: ['Drei, zwei, eins, und los.'],
  sectionMain: ['Das Aufwärmen ist geschafft, jetzt beginnt das Haupttraining.', 'Du bist schön warm, jetzt starten wir mit dem Haupttraining.'],
  sectionCool: ['Das Haupttraining ist geschafft, klasse Leistung. Jetzt dehnen wir und fahren langsam runter.', 'Stark durchgezogen. Zum Schluss wird gedehnt und entspannt.'],
  pause: ['Kurze Pause. Tipp auf Weiter, sobald du bereit bist.', 'Wir machen eine kurze Pause, danach geht\'s weiter.'],
  done: [
    'Geschafft, das war hervorragende Arbeit. Darauf kannst du richtig stolz sein.',
    'Das Training ist beendet, starke Leistung heute. Trink jetzt ein großes Glas Wasser.',
    'Fertig, das war richtig gut. Morgen machen wir genauso weiter.',
  ],
  stop: ['Bitte hör sofort auf und ruh dich aus.'],
  test: ['Hallo, ich bin deine Trainerin. Halte den Bauch schön fest, lass die Schultern unten und atme ruhig weiter. Das machst du richtig gut.'],
  coachPower: [
    'Halte den Bauch schön fest.', 'Lass die Schultern unten und atme weiter.', 'Schön sauber bleiben, ganz ohne Schwung.',
    'Sehr gut, bleib genau so dran.', 'Halte den Rücken lang und gerade.', 'Gleichmäßig weiteratmen, das sieht gut aus.',
    'Langsam und kontrolliert, genau so.', 'Stark, du bist voll dabei.',
  ],
  coachCalm: [
    'Atme tief ein und ganz lang wieder aus.', 'Lass die Schultern sinken und werde locker.',
    'Geh nur bis zu einem angenehmen Ziehen.', 'Atme ruhig in die Dehnung hinein.',
  ],
};

/** Übungsname ohne Klammerzusatz, als kurzer Satz zum Vorlesen */
export const spokenName = (ex) => ex.n.replace(/\s*\([^)]*\)/g, '') + '.';

/** Liste aller Aufnahmen: [{ id, text }] */
export function allClips(exerciseList) {
  const out = [];
  for (const [key, list] of Object.entries(CLIPS)) list.forEach((text, i) => out.push({ id: `k_${key}_${i}`, text }));
  for (const ex of exerciseList) {
    out.push({ id: `n_${ex.id}`, text: spokenName(ex) });
    out.push({ id: `p_${ex.id}`, text: ex.pos });
  }
  return out;
}
