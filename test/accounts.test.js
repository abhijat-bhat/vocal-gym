/* v0.8.7 accounts, practice routines, logs and streaks (server/auth.js, server/practice.js, server/db.js),
   over HTTP against a fresh database file. */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'vg-db-'));
process.env.VG_DB = join(dir, 'test.db');
const { createApp } = await import('../server/app.js');
const { streaks } = await import('../server/practice.js');

let server, base;
before(async () => { server = createApp(); await new Promise(r => server.listen(0, '127.0.0.1', r)); base = 'http://127.0.0.1:' + server.address().port; });
after(() => { server.close(); try { rmSync(dir, { recursive: true, force: true }); } catch (e) { /* Windows may hold the file */ } });

/* a client with its own cookie jar */
function client() {
  let cookie = '';
  return async (path, body, type = 'application/json') => {
    const r = await fetch(base + path, { method: 'POST', headers: Object.assign({ 'Content-Type': type }, cookie ? { Cookie: cookie } : {}), body: typeof body === 'string' ? body : JSON.stringify(body || {}) });
    const set = r.headers.get('set-cookie');
    if (set) { const m = /vg_session=([^;]*)/.exec(set); cookie = m && m[1] ? 'vg_session=' + m[1] : ''; }
    return { status: r.status, body: await r.json(), setCookie: set };
  };
}

test('accounts: create, log in and out, and refuse what should be refused', async () => {
  const a = client();
  let r = await a('/api/auth/me');
  assert.equal(r.status, 200); assert.equal(r.body.user, null);
  r = await a('/api/auth/register', { username: 'meera', password: 'short' });
  assert.equal(r.status, 400); assert.match(r.body.error, /8 characters/);
  r = await a('/api/auth/register', { username: 'x', password: 'long enough pw' });
  assert.equal(r.status, 400);
  r = await a('/api/auth/register', { username: 'Meera', displayName: 'Meera R', password: 'sa ri ga ma 123' });
  assert.equal(r.status, 200); assert.equal(r.body.user.displayName, 'Meera R');
  assert.match(r.setCookie, /HttpOnly/); assert.match(r.setCookie, /SameSite=Lax/);
  r = await a('/api/auth/me'); assert.equal(r.body.user.username, 'Meera');
  // the same name in any case is taken
  assert.match((await client()('/api/auth/register', { username: 'meera', password: 'another pw 123' })).body.error, /taken/);
  // a form post (not JSON) is refused: cross-site forgery cannot use the login
  assert.equal((await a('/api/practice/summary', 'today=2026-11-02', 'application/x-www-form-urlencoded')).status, 400);
  r = await a('/api/auth/logout'); assert.equal(r.status, 200);
  assert.equal((await a('/api/auth/me')).body.user, null);
  assert.equal((await a('/api/practice/routines')).status, 401, 'practice needs a login');
  // wrong passwords, then the throttle
  const b = client();
  assert.equal((await b('/api/auth/login', { username: 'meera', password: 'wrong one 1' })).status, 401);
  r = await b('/api/auth/login', { username: 'MEERA', password: 'sa ri ga ma 123' });
  assert.equal(r.status, 200, 'the username is not case-sensitive');
  for (let k = 0; k < 5; k++) await client()('/api/auth/login', { username: 'meera', password: 'nope nope ' + k });
  assert.equal((await client()('/api/auth/login', { username: 'meera', password: 'sa ri ga ma 123' })).status, 429, 'five failures block the name for a while');
  // the logged-in client is unaffected; its password can change, and the old one stops working
  assert.equal((await b('/api/account/password', { current: 'wrong', password: 'new password 1' })).status, 401);
  assert.equal((await b('/api/account/password', { current: 'sa ri ga ma 123', password: 'new password 1' })).status, 200);
  r = await b('/api/account/update', { displayName: 'Meera Raman', dailyGoalMin: 30 });
  assert.equal(r.body.user.dailyGoalMin, 30);
  assert.equal((await b('/api/account/update', { dailyGoalMin: 2 })).status, 400);
});

test('practice: routines, logs that are stored once, and the summary with streaks', async () => {
  const a = client();
  await a('/api/auth/register', { username: 'ravi', password: 'pa da ni sa 99' });
  let r = await a('/api/practice/routines');
  assert.equal(r.body.routines.length, 0); assert.ok(r.body.starters.length >= 3 && r.body.kinds.includes('kalpana'));
  assert.equal((await a('/api/practice/routines/save', { name: 'Mine', items: [] })).status, 400);
  assert.equal((await a('/api/practice/routines/save', { name: 'Mine', items: [{ kind: 'singing', minutes: 5 }] })).status, 400);
  r = await a('/api/practice/routines/save', { name: 'Morning', items: [{ kind: 'alankara', title: 'Sheet 1–5', minutes: 6 }, { kind: 'kalpana', minutes: 4 }] });
  assert.equal(r.status, 200); const id = r.body.routine.id;
  r = await a('/api/practice/routines/save', { id, name: 'Morning riyaz', items: [{ kind: 'alankara', minutes: 10 }] });
  assert.equal(r.body.routine.name, 'Morning riyaz');
  assert.equal((await a('/api/practice/routines')).body.routines.length, 1);
  // another user cannot see or change it
  const b = client(); await b('/api/auth/register', { username: 'lata', password: 'ga ma pa da 77' });
  assert.equal((await b('/api/practice/routines')).body.routines.length, 0);
  assert.equal((await b('/api/practice/routines/delete', { id })).status, 400);
  // logs: three days in a row, then a gap; one saved twice
  const log = (d, cid, sec) => a('/api/practice/log', { clientId: cid, routineId: id, routineName: 'Morning riyaz', localDate: d, startedAt: d + 'T06:00:00.000Z', endedAt: d + 'T06:20:00.000Z', seconds: sec, items: [{ kind: 'alankara', title: 'Sheet', plannedSec: 600, spentSec: sec, done: true }], rating: 4, notes: 'steady' });
  for (const [d, c] of [['2026-10-25', 'c-aaaaaaa1'], ['2026-10-30', 'c-aaaaaaa2'], ['2026-10-31', 'c-aaaaaaa3'], ['2026-11-01', 'c-aaaaaaa4']]) assert.equal((await log(d, c, 1200)).status, 200);
  r = await log('2026-11-01', 'c-aaaaaaa4', 1200);
  assert.equal(r.body.duplicate, true, 'an offline retry is stored once');
  assert.equal((await log('2026-13-01', 'c-aaaaaaa9', 60)).status, 400);
  assert.equal((await a('/api/practice/log', { clientId: 'c-aaaaaaa5', localDate: '2026-11-01', startedAt: 'x', endedAt: 'y', seconds: 60, items: [] })).status, 400);
  r = await a('/api/practice/summary', { today: '2026-11-02' });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.streak, { current: 3, best: 3, today: false, alive: true }, 'yesterday’s streak is alive until today ends');
  assert.equal(r.body.totals.sessions, 4); assert.equal(r.body.totals.minutes, 80); assert.equal(r.body.week.length, 7);
  assert.equal(r.body.week[5].minutes, 20); assert.equal(r.body.goal, 20); assert.equal(r.body.goalMet, false);
  await log('2026-11-02', 'c-aaaaaaa6', 1500);
  r = await a('/api/practice/summary', { today: '2026-11-02' });
  assert.equal(r.body.streak.current, 4); assert.equal(r.body.goalMet, true); assert.equal(r.body.todayMinutes, 25);
  r = await a('/api/practice/summary', { today: '2026-11-04' });
  assert.equal(r.body.streak.current, 0, 'a missed day ends the streak'); assert.equal(r.body.streak.best, 4);
  r = await a('/api/practice/logs', { limit: 2 });
  assert.equal(r.body.logs.length, 2); assert.equal(r.body.logs[0].localDate, '2026-11-02');
  assert.equal((await a('/api/practice/logs/delete', { id: r.body.logs[0].id })).status, 200);
  assert.equal((await b('/api/practice/logs', {})).body.logs.length, 0, 'logs are private');
  // deleting the account deletes everything, and needs the password
  assert.equal((await a('/api/account/delete', { password: 'no' })).status, 401);
  assert.equal((await a('/api/account/delete', { password: 'pa da ni sa 99' })).status, 200);
  assert.equal((await a('/api/auth/me')).body.user, null);
  assert.equal((await client()('/api/auth/login', { username: 'ravi', password: 'pa da ni sa 99' })).status, 401);
});

test('streaks are counted on the singer’s own days', () => {
  assert.deepEqual(streaks([], '2026-01-01'), { current: 0, best: 0, today: false, alive: false });
  assert.equal(streaks(['2025-12-30', '2025-12-31', '2026-01-01'], '2026-01-01').current, 3, 'across a year');
  assert.equal(streaks(['2024-02-28', '2024-02-29', '2024-03-01'], '2024-03-01').current, 3, 'across a leap day');
  assert.equal(streaks(['2026-03-01', '2026-03-03'], '2026-03-03').best, 1);
});
