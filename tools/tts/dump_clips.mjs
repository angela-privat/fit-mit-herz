// Gibt alle Sätze der Trainerin als JSON aus (für die Erzeugung der Sprachaufnahmen)
import { allClips } from '../../js/phrases.js';
import { EXERCISE_LIST } from '../../js/exercises.js';
process.stdout.write(JSON.stringify(allClips(EXERCISE_LIST)));
