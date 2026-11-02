/* The logged-in user, the practice session in progress and its bar, and logs waiting to be saved (v0.8.7).
   A session in progress lives in localStorage ('vg-run'), so it survives moving between pages, a reload or a
   closed tab: the bar at the foot of every page shows the item, its timer, and Open, Pause, Next and Finish.
   A log that cannot reach the server (offline) waits in localStorage ('vg-pending-logs') and is sent when the
   connection returns; the server stores a log once even if it arrives twice (its client id). */
import { api } from './api.js';
import { esc, toast } from './ui.js';

export const KIND = {
  alankara: { label: 'Alankaras', route: '#/alankara' }, kalpana: { label: 'Kalpana swaras', route: '#/kalpana' },
  korvai: { label: 'Korvai lab', route: '#/korvai' }, melakarta: { label: 'Melakartas', route: '#/melakarta' },
  judge: { label: 'Jathi judge', route: '#/judge' }, repertoire: { label: 'Repertoire', route: '#/repertoire' }, free: { label: 'Free practice', route: null }
};
const RUN = 'vg-run', QUEUE = 'vg-pending-logs';
const pad = n => String(n).padStart(2, '0');
export const localDate = (d = new Date()) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const clock = sec => { sec = Math.max(0, Math.floor(sec)); const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s = sec % 60; return (h ? h + ':' + pad(m) : String(m)) + ':' + pad(s); };
const uid = () => (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : Date.now().toString(36) + Math.random().toString(36).slice(2, 12));
const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
const write = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage full or off */ } };

/* ---- the user ---- */
let user, known = false;
const listeners = new Set();
const emit = () => listeners.forEach(fn => { try { fn(user); } catch (e) { /* a listener failed */ } });
export const onUser = fn => { listeners.add(fn); return () => listeners.delete(fn); };
export const getUser = () => user;
export const userKnown = () => known;
export function setUser(u) { user = u || null; known = true; emit(); if (user) flushQueue(); }
export async function refreshUser() {
  try { setUser((await api.auth.me()).user); } catch (e) { if (!e.offline) setUser(null); else { known = true; emit(); } }
  return user;
}

/* ---- the session in progress ---- */
export const getRun = () => read(RUN, null);
const save = r => { write(RUN, r); renderBar(); };
export function elapsed(r, i) { return (r.spent[i] || 0) + (i === r.index && !r.paused && !r.finished ? (Date.now() - r.since) / 1000 : 0); }
const settle = r => { if (!r.paused && !r.finished) { r.spent[r.index] = elapsed(r, r.index); r.since = Date.now(); } return r; };
export function startRun(routine) {
  const items = routine.items.map(it => Object.assign({ kind: it.kind, title: it.title, minutes: it.minutes }, it.ref ? { ref: it.ref } : {}));
  const r = { id: uid(), routineId: typeof routine.id === 'number' ? routine.id : null, routineName: routine.name, items, index: 0,
    startedAt: new Date().toISOString(), localDate: localDate(), spent: items.map(() => 0), done: items.map(() => false), chimed: items.map(() => false), since: Date.now(), paused: false, finished: false };
  save(r); open(r);
}
// the item's page: its tool, or (v0.9) the composition a repertoire item names
export const routeOf = it => { const k = KIND[it.kind]; return k && k.route ? k.route + (it.ref ? '/' + it.ref : '') : null; };
function open(r) { const to = routeOf(r.items[r.index]); if (to) location.hash = to; }
export function togglePause() { const r = getRun(); if (!r || r.finished) return; if (r.paused) { r.paused = false; r.since = Date.now(); } else { settle(r); r.paused = true; } save(r); }
export function next() {
  const r = getRun(); if (!r || r.finished) return;
  settle(r); r.done[r.index] = true;
  if (r.index >= r.items.length - 1) return finish();
  r.index++; r.since = Date.now(); r.paused = false; save(r); open(r);
}
export function finish() {
  const r = getRun(); if (!r) return;
  settle(r); r.done[r.index] = r.done[r.index] || elapsed(r, r.index) >= 30; r.finished = true; r.endedAt = new Date().toISOString(); save(r);
  location.hash = '#/practice/finish';
}
export function discard() { write(RUN, null); renderBar(); }
export function logOf(r, rating, notes) {
  const seconds = Math.max(1, Math.round(r.spent.reduce((a, b) => a + b, 0)));
  return { clientId: r.id, routineId: r.routineId, routineName: r.routineName, localDate: r.localDate, startedAt: r.startedAt, endedAt: r.endedAt || new Date().toISOString(), seconds,
    items: r.items.map((it, k) => Object.assign({ kind: it.kind, title: it.title, plannedSec: it.minutes * 60, spentSec: Math.round(r.spent[k]), done: !!r.done[k] }, it.ref ? { ref: it.ref } : {})), rating: rating || null, notes: notes || '' };
}
/* saves the finished session; offline, it waits and is sent later. → { saved } or { queued } */
export async function saveFinished(rating, notes) {
  const r = getRun(); if (!r) return { saved: false };
  const body = logOf(r, rating, notes);
  try { await api.practice.log(body); discard(); return { saved: true }; } catch (e) {
    if (e.offline) { write(QUEUE, read(QUEUE, []).filter(x => x.clientId !== body.clientId).concat([body])); discard(); return { queued: true }; }
    throw e;
  }
}
export const pending = () => read(QUEUE, []).length;
export async function flushQueue() {
  const q = read(QUEUE, []); if (!q.length || !user) return 0;
  const left = []; let sent = 0;
  for (const body of q) { try { await api.practice.log(body); sent++; } catch (e) { if (e.offline || e.status === 401) left.push(body); } }
  write(QUEUE, left);
  if (sent) toast(sent === 1 ? 'A practice session saved offline has been stored.' : sent + ' practice sessions saved offline have been stored.');
  return sent;
}

/* ---- the bar ---- */
let tick = 0, beepCtx = null;
function chime() {
  try { beepCtx = beepCtx || new (window.AudioContext || window.webkitAudioContext)(); const t = beepCtx.currentTime;
    [0, 0.18].forEach((d, k) => { const o = beepCtx.createOscillator(), g = beepCtx.createGain(); o.frequency.value = k ? 784 : 659; g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.12, t + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.5); o.connect(g).connect(beepCtx.destination); o.start(t + d); o.stop(t + d + 0.55); });
  } catch (e) { /* no audio */ }
}
export function renderBar() {
  const bar = document.getElementById('sessionbar'); if (!bar) return;
  const r = getRun();
  if (!r || r.finished) { bar.hidden = true; bar.innerHTML = ''; document.body.classList.remove('has-sessionbar'); clearInterval(tick); tick = 0; return; }
  const it = r.items[r.index], k = KIND[it.kind] || KIND.free, to = routeOf(it), t = elapsed(r, r.index), goal = it.minutes * 60, over = t >= goal;
  if (over && !r.chimed[r.index] && !r.paused) { r.chimed[r.index] = true; write(RUN, r); chime(); }
  bar.hidden = false; document.body.classList.add('has-sessionbar');
  bar.classList.toggle('over', over); bar.classList.toggle('paused', !!r.paused);
  const last = r.index === r.items.length - 1;
  bar.innerHTML = '<div class="sb-in"><div class="sb-what"><span class="sb-r">' + esc(r.routineName) + ' · ' + (r.index + 1) + ' of ' + r.items.length + '</span><b>' + esc(it.title) + '</b></div>' +
    '<div class="sb-time" role="timer" aria-live="off"><b>' + clock(t) + '</b><span>of ' + it.minutes + ' min' + (over ? ' · time is up' : r.paused ? ' · paused' : '') + '</span></div>' +
    '<div class="sb-btns">' + (to && location.hash !== to && !(location.hash.split('/')[1] === to.slice(2) && !it.ref) ? '<a class="btn small" href="' + to + '">Open ' + esc(it.ref ? it.title : k.label) + '</a>' : '') +
    '<button type="button" class="btn small ghost" data-sb="pause">' + (r.paused ? 'Resume' : 'Pause') + '</button>' +
    '<button type="button" class="btn small ' + (last ? 'ghost' : 'primary') + '" data-sb="next">' + (last ? 'Done' : 'Next') + '</button>' +
    '<button type="button" class="btn small primary" data-sb="finish">Finish</button></div></div>';
  bar.querySelector('[data-sb="pause"]').onclick = togglePause;
  bar.querySelector('[data-sb="next"]').onclick = next;
  bar.querySelector('[data-sb="finish"]').onclick = finish;
  if (!tick) tick = setInterval(() => { const x = getRun(); if (!x || x.finished) { renderBar(); return; } const el = bar.querySelector('.sb-time b'); if (el) el.textContent = clock(elapsed(x, x.index)); if (!x.paused && elapsed(x, x.index) >= x.items[x.index].minutes * 60 && !bar.classList.contains('over')) renderBar(); }, 1000);
}
export function initSession() {
  renderBar();
  window.addEventListener('hashchange', renderBar);
  window.addEventListener('online', () => { flushQueue(); });
  window.addEventListener('storage', e => { if (e.key === RUN) renderBar(); });
}
