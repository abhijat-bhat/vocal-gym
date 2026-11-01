/* Vocal Gym server · practice: routines, session logs, goals and streaks (v0.8.7)
   A routine is a named list of timed items, each a tool of the app (alankaras, kalpana swaras, the korvai lab,
   melakartas, the judge) or free practice. Three starter routines are offered to everyone; a user's own are
   stored. A log is one finished session: when, for how long, each item's planned and spent time, a rating and
   notes. The day of a log is the singer's own calendar day (sent by the page), so streaks follow the singer's
   time zone. A log carries a client id, so a session saved twice (an offline retry) is stored once. */
import { getDb, now } from './db.js';
import { Invalid } from './auth.js';

const bad = msg => { throw new Invalid(msg); };
export const KINDS = ['alankara', 'kalpana', 'korvai', 'melakarta', 'judge', 'free'];
export const STARTERS = [
  { id: 'starter-warmup', name: 'Daily warm-up', builtin: true, items: [
    { kind: 'alankara', title: 'Sheet alankaras, slow then second speed', minutes: 8 },
    { kind: 'kalpana', title: 'Kalpana swaras: three rounds, low creativity', minutes: 7 },
    { kind: 'korvai', title: 'Korvai lab: one lesson', minutes: 5 }] },
  { id: 'starter-quick', name: 'Quick ten minutes', builtin: true, items: [
    { kind: 'alankara', title: 'One alankara in a new raga', minutes: 5 },
    { kind: 'kalpana', title: 'Kalpana swaras landing on Pa', minutes: 5 }] },
  { id: 'starter-rhythm', name: 'Rhythm day', builtin: true, items: [
    { kind: 'korvai', title: 'Build a korvai in your tala', minutes: 10 },
    { kind: 'judge', title: 'Check it in the judge', minutes: 5 },
    { kind: 'kalpana', title: 'Sing it as kalpana swaras', minutes: 5 }] }
];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const str = (v, max, what) => { if (v == null) return ''; if (typeof v !== 'string') bad(what + ' must be text.'); const s = v.trim(); if (s.length > max) bad(what + ' must be at most ' + max + ' characters.'); return s; };
const validDate = s => DATE.test(s) && !isNaN(Date.parse(s + 'T00:00:00Z')) && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;
const addDays = (s, k) => new Date(Date.parse(s + 'T00:00:00Z') + k * 86400000).toISOString().slice(0, 10);

function cleanItems(items) {
  if (!Array.isArray(items) || !items.length) bad('A routine needs at least one item.');
  if (items.length > 30) bad('A routine has at most 30 items.');
  return items.map((it, k) => {
    if (!it || typeof it !== 'object') bad('Item ' + (k + 1) + ' is not valid.');
    const kind = KINDS.includes(it.kind) ? it.kind : bad('Item ' + (k + 1) + ': choose what it practises (' + KINDS.join(', ') + ').');
    const minutes = Number(it.minutes);
    if (!(Number.isInteger(minutes) && minutes >= 1 && minutes <= 120)) bad('Item ' + (k + 1) + ': 1 to 120 minutes.');
    return { kind, title: str(it.title, 80, 'An item’s title') || kind, minutes };
  });
}
const rowRoutine = r => ({ id: r.id, name: r.name, items: JSON.parse(r.items), builtin: false, updatedAt: r.updated_at });

/* ---- routines ---- */
export async function routines(body, ctx) {
  const db = await getDb();
  const own = db.prepare('SELECT * FROM routines WHERE user_id = ? ORDER BY updated_at DESC').all(ctx.user.id).map(rowRoutine);
  return { routines: own, starters: STARTERS, kinds: KINDS };
}
export async function saveRoutine(body, ctx) {
  const db = await getDb(), name = str(body.name, 60, 'The name') || bad('Give the routine a name.'), items = cleanItems(body.items), t = now();
  if (body.id != null) {
    const r = db.prepare('UPDATE routines SET name = ?, items = ?, updated_at = ? WHERE id = ? AND user_id = ?').run(name, JSON.stringify(items), t, Number(body.id), ctx.user.id);
    if (!r.changes) bad('No such routine.');
    return { routine: rowRoutine(db.prepare('SELECT * FROM routines WHERE id = ?').get(Number(body.id))) };
  }
  if (db.prepare('SELECT COUNT(*) AS n FROM routines WHERE user_id = ?').get(ctx.user.id).n >= 50) bad('You can keep up to 50 routines.');
  const r = db.prepare('INSERT INTO routines (user_id, name, items, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(ctx.user.id, name, JSON.stringify(items), t, t);
  return { routine: rowRoutine(db.prepare('SELECT * FROM routines WHERE id = ?').get(Number(r.lastInsertRowid))) };
}
export async function deleteRoutine(body, ctx) {
  const r = (await getDb()).prepare('DELETE FROM routines WHERE id = ? AND user_id = ?').run(Number(body.id), ctx.user.id);
  if (!r.changes) bad('No such routine.');
  return { ok: true };
}

/* ---- logs ---- */
const rowLog = r => ({ id: r.id, routineId: r.routine_id, routineName: r.routine_name, localDate: r.local_date, startedAt: r.started_at, endedAt: r.ended_at, seconds: r.seconds, items: JSON.parse(r.items), rating: r.rating, notes: r.notes });
export async function saveLog(body, ctx) {
  const clientId = str(body.clientId, 64, 'The client id') || bad('The log needs a client id.');
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(clientId)) bad('The client id is not valid.');
  const localDate = String(body.localDate || '');
  if (!validDate(localDate)) bad('The day must be a date, YYYY-MM-DD.');
  const startedAt = String(body.startedAt || ''), endedAt = String(body.endedAt || '');
  if (isNaN(Date.parse(startedAt)) || isNaN(Date.parse(endedAt))) bad('The start and end must be times.');
  const seconds = Number(body.seconds);
  if (!(Number.isInteger(seconds) && seconds >= 1 && seconds <= 6 * 3600)) bad('A session lasts 1 second to 6 hours.');
  if (!Array.isArray(body.items) || body.items.length > 30) bad('A log has at most 30 items.');
  const items = body.items.map(it => ({
    kind: KINDS.includes(it && it.kind) ? it.kind : 'free', title: str(it && it.title, 80, 'An item’s title'),
    plannedSec: Math.max(0, Math.min(7200, Math.round(Number(it && it.plannedSec) || 0))), spentSec: Math.max(0, Math.min(6 * 3600, Math.round(Number(it && it.spentSec) || 0))), done: !!(it && it.done)
  }));
  let rating = body.rating == null || body.rating === '' ? null : Number(body.rating);
  if (rating != null && !(Number.isInteger(rating) && rating >= 1 && rating <= 5)) bad('A rating is 1 to 5.');
  const notes = str(body.notes, 1000, 'The notes'), routineName = str(body.routineName, 60, 'The routine’s name') || 'Practice';
  const routineId = Number.isInteger(Number(body.routineId)) ? Number(body.routineId) : null;
  const db = await getDb();
  const r = db.prepare('INSERT OR IGNORE INTO logs (user_id, client_id, routine_id, routine_name, local_date, started_at, ended_at, seconds, items, rating, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(ctx.user.id, clientId, routineId, routineName, localDate, startedAt, endedAt, seconds, JSON.stringify(items), rating, notes, now());
  const row = db.prepare('SELECT * FROM logs WHERE user_id = ? AND client_id = ?').get(ctx.user.id, clientId);
  return { log: rowLog(row), duplicate: !r.changes };
}
export async function logs(body, ctx) {
  const limit = Math.max(1, Math.min(100, Number(body.limit) || 20)), before = Number(body.before) || null;
  const db = await getDb();
  const rows = before ? db.prepare('SELECT * FROM logs WHERE user_id = ? AND id < ? ORDER BY id DESC LIMIT ?').all(ctx.user.id, before, limit)
    : db.prepare('SELECT * FROM logs WHERE user_id = ? ORDER BY id DESC LIMIT ?').all(ctx.user.id, limit);
  return { logs: rows.map(rowLog) };
}
export async function deleteLog(body, ctx) {
  const r = (await getDb()).prepare('DELETE FROM logs WHERE id = ? AND user_id = ?').run(Number(body.id), ctx.user.id);
  if (!r.changes) bad('No such log.');
  return { ok: true };
}

/* ---- the summary: today against the goal, the last seven days, streaks and totals ----
   body { today: YYYY-MM-DD, the singer's own date }. A day counts for a streak if a session was logged on it.
   The current streak ends today, or yesterday if today has nothing yet (it is still alive until midnight). */
export function streaks(days, today) {
  const has = new Set(days);
  let end = has.has(today) ? today : addDays(today, -1), current = 0;
  while (has.has(end)) { current++; end = addDays(end, -1); }
  let best = 0, run = 0, prev = null;
  Array.from(has).sort().forEach(d => { run = prev && addDays(prev, 1) === d ? run + 1 : 1; best = Math.max(best, run); prev = d; });
  return { current, best, today: has.has(today), alive: current > 0 };
}
export async function summary(body, ctx) {
  const today = String(body.today || '');
  if (!validDate(today)) bad('Give today, the date where you are (YYYY-MM-DD).');
  const db = await getDb(), id = ctx.user.id;
  const perDay = db.prepare('SELECT local_date AS d, SUM(seconds) AS s, COUNT(*) AS n FROM logs WHERE user_id = ? GROUP BY local_date').all(id);
  const by = new Map(perDay.map(r => [r.d, r]));
  const week = Array.from({ length: 7 }, (_, k) => { const d = addDays(today, k - 6), r = by.get(d); return { date: d, minutes: r ? Math.round(r.s / 60) : 0, sessions: r ? r.n : 0 }; });
  const tot = db.prepare('SELECT COUNT(*) AS n, COALESCE(SUM(seconds), 0) AS s FROM logs WHERE user_id = ?').get(id);
  const todayMin = week[6].minutes, goal = ctx.user.dailyGoalMin;
  return {
    today, goal, todayMinutes: todayMin, goalMet: todayMin >= goal,
    streak: streaks(perDay.map(r => r.d), today),
    week, totals: { sessions: tot.n, minutes: Math.round(tot.s / 60), days: perDay.length }
  };
}
