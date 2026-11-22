// Fit mit Herz – Datenspeicher
// Alle Daten bleiben auf dem Gerät: IndexedDB (dauerhaft) + Sicherheitskopie im localStorage.

const DB_NAME = 'fit-mit-herz';
const STORE = 'kv';
const KEY = 'state';
const LS_KEY = 'fit-mit-herz-backup';
export const DATA_VERSION = 1;

export function todayISO(d = new Date()) {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

export function defaultState() {
  return {
    version: DATA_VERSION,
    profile: {
      name: '', sex: 'w', age: null, height: null, startWeight: null, goalWeight: null, startWaist: null,
      createdAt: null,
    },
    onboarded: false,
    health: { answers: {}, needsDoctor: false, acknowledged: false, date: null },
    settings: { sound: true, voice: true, vibrate: true, easyDefault: false, theme: 'auto' },
    plan: { start: null, stage: 1, stageSince: null, lastSuggest: null },
    weights: [], // {date, kg, waist?, note?}
    sessions: [], // {id, date, day, kind, title, plannedSec, doneSec, completed, done:[ids], kcal, feedback, stage, stop}
    breaks: 0,
    ticks: {}, // "YYYY-MM-DD_wochentag" -> abgehakte Übungen (Index)
    achievements: {}, // id -> ISO-Datum
  };
}

let db = null;
let state = defaultState();
const listeners = new Set();

function openDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in self)) return reject(new Error('kein IndexedDB'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const r = tx.objectStore(STORE).get(KEY);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

function idbPut(value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function merge(base, data) {
  const s = defaultState();
  const d = data || {};
  return {
    ...s, ...d,
    profile: { ...s.profile, ...(d.profile || {}) },
    health: { ...s.health, ...(d.health || {}) },
    settings: { ...s.settings, ...(d.settings || {}) },
    plan: { ...s.plan, ...(d.plan || {}) },
    weights: Array.isArray(d.weights) ? d.weights : [],
    sessions: Array.isArray(d.sessions) ? d.sessions : [],
    achievements: d.achievements || {},
  };
}

export async function load() {
  let data = null;
  try {
    db = await openDB();
    data = await idbGet();
  } catch (e) {
    console.warn('IndexedDB nicht verfügbar, nutze localStorage', e);
    db = null;
  }
  if (!data) {
    try { data = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch { data = null; }
  }
  state = merge(defaultState(), data);
  // Browser bitten, die Daten nicht automatisch zu löschen
  try { if (navigator.storage?.persist) await navigator.storage.persist(); } catch { /* egal */ }
  return state;
}

let saveTimer = 0;
export function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 150);
  listeners.forEach((fn) => fn(state));
}

export async function flush() {
  clearTimeout(saveTimer);
  const copy = JSON.parse(JSON.stringify(state));
  try { if (db) await idbPut(copy); } catch (e) { console.error('Speichern fehlgeschlagen', e); }
  try { localStorage.setItem(LS_KEY, JSON.stringify(copy)); } catch { /* Speicher voll o. ä. */ }
}

export const get = () => state;
export const onChange = (fn) => listeners.add(fn);

// ---------- Gewicht ----------
export function addWeight({ date, kg, waist, note }) {
  const entry = { date, kg: round1(kg) };
  if (waist) entry.waist = round1(waist);
  if (note) entry.note = note;
  const i = state.weights.findIndex((w) => w.date === date);
  if (i >= 0) state.weights[i] = { ...state.weights[i], ...entry };
  else state.weights.push(entry);
  state.weights.sort((a, b) => a.date.localeCompare(b.date));
  save();
}

export function deleteWeight(date) {
  state.weights = state.weights.filter((w) => w.date !== date);
  save();
}

export function currentWeight() {
  const w = state.weights.filter((x) => x.kg);
  return w.length ? w[w.length - 1].kg : state.profile.startWeight;
}

export function currentWaist() {
  const w = state.weights.filter((x) => x.waist);
  return w.length ? w[w.length - 1].waist : state.profile.startWaist;
}

// ---------- Trainings ----------
export function addSession(s) {
  const entry = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), date: new Date().toISOString(), day: todayISO(), ...s };
  state.sessions.push(entry);
  if (entry.kind === 'program' && entry.group === 'pause') state.breaks = (state.breaks || 0) + 1;
  save();
  return entry;
}

export function updateSession(id, patch) {
  const s = state.sessions.find((x) => x.id === id);
  if (s) Object.assign(s, patch);
  save();
}

// ---------- Export / Import ----------
export function exportJSON() {
  return JSON.stringify({ app: 'fit-mit-herz', exported: new Date().toISOString(), ...state }, null, 2);
}

export function importJSON(text) {
  const data = JSON.parse(text);
  if (!data || data.app !== 'fit-mit-herz') throw new Error('Das ist keine „Fit mit Herz“-Sicherungsdatei.');
  delete data.app; delete data.exported;
  state = merge(defaultState(), data);
  save();
  return state;
}

const num = (n) => (n === null || n === undefined || n === '' ? '' : String(n).replace('.', ','));
const csvCell = (v) => {
  const s = String(v ?? '');
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV für Excel (deutsches Format: Semikolon, Dezimalkomma) */
export function exportWeightsCSV() {
  const rows = [['Datum', 'Gewicht (kg)', 'Bauchumfang (cm)', 'Notiz']];
  for (const w of state.weights) rows.push([w.date, num(w.kg), num(w.waist), w.note || '']);
  return '﻿' + rows.map((r) => r.map(csvCell).join(';')).join('\r\n');
}

export function exportSessionsCSV() {
  const rows = [['Datum', 'Training', 'Art', 'Geplant (Min)', 'Trainiert (Min)', 'Vollständig', 'kcal (Schätzung)', 'Gefühl', 'Stufe']];
  const fb = { easy: 'zu leicht', ok: 'genau richtig', hard: 'zu schwer' };
  for (const s of state.sessions) {
    rows.push([s.day, s.title, s.kind, num(Math.round((s.plannedSec || 0) / 6) / 10), num(Math.round((s.doneSec || 0) / 6) / 10),
      s.completed ? 'ja' : 'nein', s.kcal ?? '', fb[s.feedback] || '', s.stage ?? '']);
  }
  return '﻿' + rows.map((r) => r.map(csvCell).join(';')).join('\r\n');
}

export function resetAll() {
  state = defaultState();
  save();
}

function round1(n) { return Math.round(Number(n) * 10) / 10; }
