// Fit mit Herz – kleine UI-Helfer: Symbole, Dialoge, Hinweise

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const n1 = (v) => Number(v).toLocaleString('de-DE', { maximumFractionDigits: 1, minimumFractionDigits: 0 });
export const fmtMin = (sec) => `${Math.round(sec / 60)} Min`;
export const fmtClock = (sec) => {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
export const fmtDate = (iso, opts = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('de-DE', opts);

const svg = (p, extra = '') => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${p}</svg>`;
export const ICON = {
  home: svg('<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>'),
  train: svg('<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>'),
  leaf: svg('<path d="M12 21c0-6 0-9 0-9"/><path d="M12 12c-4.5 0-7-3-7-8 5 0 7 3 7 8Z"/><path d="M12 15c4 0 7-2.5 7-7-4.5 0-7 2.5-7 7Z"/>'),
  chart: svg('<path d="M4 20V4"/><path d="M4 20h16"/><path d="m7 15 4-4 3 3 5-6"/>'),
  star: svg('<path d="m12 3.5 2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9 6.7 19.6l1-5.8-4.2-4.1 5.9-.9Z"/>'),
  gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>'),
  play: svg('<path d="M7 4.5v15l12-7.5Z" fill="currentColor"/>'),
  pause: svg('<path d="M8 5v14M16 5v14" stroke-width="3.2"/>'),
  check: svg('<path d="m4.5 12.5 5 5 10-11"/>'),
  next: svg('<path d="m6 5 8 7-8 7"/><path d="M18 5v14"/>'),
  prev: svg('<path d="m18 5-8 7 8 7"/><path d="M6 5v14"/>'),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/>'),
  alert: svg('<path d="M12 3 2 20h20Z"/><path d="M12 10v4M12 17v.5"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  down: svg('<path d="M12 4v12M6 11l6 6 6-6M4 20h16"/>'),
  up: svg('<path d="M12 20V8M6 13l6-6 6 6M4 4h16"/>'),
  heart: svg('<path d="M12 20s-7.5-4.6-9-9.3C2 7.4 4.2 4.5 7.3 4.5c2 0 3.5 1.1 4.7 2.8 1.2-1.7 2.7-2.8 4.7-2.8 3.1 0 5.3 2.9 4.3 6.2-1.5 4.7-9 9.3-9 9.3Z"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  flame: svg('<path d="M12 21c-4 0-6.5-2.6-6.5-6 0-4 3.5-5.5 4-10 3 2 4 4.5 4 6.5 1-.6 1.6-1.6 1.8-3 1.7 1.6 3.2 3.9 3.2 6.5 0 3.4-2.5 6-6.5 6Z"/>'),
  scale: svg('<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8.5 9.5a5 5 0 0 1 7 0l-2.2 2.2"/>'),
  back: svg('<path d="m15 5-7 7 7 7"/>'),
  easy: svg('<path d="M4 18c3-6 6-9 16-12"/><path d="M4 18h16"/>'),
  list: svg('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>'),
  trash: svg('<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>'),
  sound: svg('<path d="M4 9.5h4l5-4v13l-5-4H4Z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11"/>'),
};

/** Modaler Dialog. buttons: [{label, cls, value}] → Promise<value> */
export function dialog({ title, html, buttons = [{ label: 'OK', cls: 'btn-primary', value: true }], tone = '' }) {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `<div class="modal ${tone}" role="dialog" aria-modal="true" aria-labelledby="mdl-t">
      <h2 id="mdl-t">${title}</h2><div class="modal-body">${html || ''}</div>
      <div class="modal-actions">${buttons.map((b, i) => `<button class="btn ${b.cls || 'btn-ghost'}" data-i="${i}">${b.label}</button>`).join('')}</div></div>`;
    document.body.appendChild(wrap);
    const close = (v) => { wrap.remove(); resolve(v); };
    wrap.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-i]');
      if (b) close(buttons[+b.dataset.i].value);
    });
    setTimeout(() => wrap.querySelector('.btn-primary, .btn-danger, button')?.focus(), 30);
  });
}

export const confirmDialog = (title, html, yes = 'Ja', no = 'Abbrechen', danger = false) =>
  dialog({ title, html, buttons: [{ label: no, value: false }, { label: yes, cls: danger ? 'btn-danger' : 'btn-primary', value: true }] });

let toastTimer = 0;
export function toast(text, ms = 2600) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

export function download(filename, text, type = 'application/json') {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
