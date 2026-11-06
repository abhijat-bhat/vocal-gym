/* Vocal Gym server · accounts and logins (v0.8.7)
   Passwords are stored as scrypt hashes with a random salt (node:crypto; never the password itself). A login
   is a random 256-bit token in an HttpOnly, SameSite=Lax cookie (Secure over HTTPS); the database keeps only
   its SHA-256, so a copy of the database cannot be used to log in. Logins last 30 days. Five failed logins
   for a username, or twenty from one address, within 15 minutes block further tries for 15 minutes.
   Routes that use the login accept only JSON bodies, which a form on another site cannot send, and the
   SameSite cookie is not sent with cross-site posts: together they stop cross-site request forgery. */
import { scrypt, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { getDb, now } from './db.js';

export class Unauthorized extends Error {}
export class TooMany extends Error {}
export class Invalid extends Error {}
const bad = msg => { throw new Invalid(msg); };

export const COOKIE = 'vg_session';
const DAYS = 30, MAX_AGE = DAYS * 24 * 3600;
const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

const scryptP = (pw, salt, len, o) => new Promise((res, rej) => scrypt(pw, salt, len, o, (e, k) => (e ? rej(e) : res(k))));
export async function hashPassword(pw) {
  const salt = randomBytes(16), key = await scryptP(pw.normalize('NFKC'), salt, 32, SCRYPT);
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64'), key.toString('base64')].join('$');
}
export async function verifyPassword(pw, stored) {
  const [kind, N, r, p, salt, key] = String(stored).split('$');
  if (kind !== 'scrypt') return false;
  const want = Buffer.from(key, 'base64');
  const got = await scryptP(pw.normalize('NFKC'), Buffer.from(salt, 'base64'), want.length, { N: +N, r: +r, p: +p, maxmem: SCRYPT.maxmem });
  return got.length === want.length && timingSafeEqual(got, want);
}
const tokenHash = t => createHash('sha256').update(t).digest('hex');

export function parseCookies(header) {
  const out = {};
  String(header || '').split(';').forEach(p => { const i = p.indexOf('='); if (i > 0) { const k = p.slice(0, i).trim(); try { out[k] = decodeURIComponent(p.slice(i + 1).trim()); } catch (e) { /* skip */ } } });
  return out;
}
const cookie = (value, maxAge, secure) => COOKIE + '=' + value + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + maxAge + (secure ? '; Secure' : '');

/* the logged-in user of a request, or null */
export async function userOf(req) {
  const t = parseCookies(req.headers.cookie)[COOKIE];
  if (!t || t.length > 100) return null;
  const db = await getDb();
  const row = db.prepare('SELECT u.id, u.username, u.display_name, u.daily_goal_min, u.created_at, u.pass, s.expires_at, s.token_hash FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?').get(tokenHash(t));
  if (!row) return null;
  if (row.expires_at < now()) { db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(row.token_hash); return null; }
  return { id: row.id, username: row.username, displayName: row.display_name, dailyGoalMin: row.daily_goal_min, createdAt: row.created_at, tokenHash: row.token_hash, hasPassword: row.pass !== '' };
}
export const publicUser = u => u && { hasPassword: u.hasPassword != null ? u.hasPassword : u.pass != null ? u.pass !== '' : true, username: u.username, displayName: u.displayName != null ? u.displayName : u.display_name, dailyGoalMin: u.dailyGoalMin != null ? u.dailyGoalMin : u.daily_goal_min, createdAt: u.createdAt || u.created_at };

export async function startSession(db, userId, ctx) {
  const t = randomBytes(32).toString('base64url'), exp = new Date(Date.now() + MAX_AGE * 1000).toISOString();
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now());
  db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(tokenHash(t), userId, now(), exp);
  ctx.cookies.push(cookie(t, MAX_AGE, ctx.secure));
}

/* ---- throttling failed logins ---- */
const WINDOW = 15 * 60 * 1000, fails = new Map();
const hit = (k, max) => { const v = fails.get(k); return !!(v && v.until > Date.now() && v.n >= max); };
const miss = k => { const v = fails.get(k), t = Date.now(); if (!v || v.until < t) fails.set(k, { n: 1, until: t + WINDOW }); else v.n++; if (fails.size > 10000) fails.clear(); };
export const resetThrottle = () => fails.clear();

/* ---- the routes: (body, ctx) → answer; ctx = { user, ip, secure, cookies } ---- */
const USERNAME = /^[a-z0-9][a-z0-9_.-]{2,31}$/i;
const str = (v, max, what) => { if (v == null) return ''; if (typeof v !== 'string') bad(what + ' must be text.'); const s = v.trim(); if (s.length > max) bad(what + ' must be at most ' + max + ' characters.'); return s; };
function checkPassword(pw) {
  if (typeof pw !== 'string' || pw.length < 8) bad('Choose a password of at least 8 characters.');
  if (pw.length > 200) bad('That password is too long (at most 200 characters).');
}

export async function register(body, ctx) {
  const username = str(body.username, 32, 'The username'), displayName = str(body.displayName, 60, 'The name') || username;
  if (!USERNAME.test(username)) bad('A username is 3 to 32 letters, digits, dots, dashes or underscores, starting with a letter or digit.');
  checkPassword(body.password);
  const db = await getDb();
  if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(username)) bad('That username is taken.');
  const r = db.prepare('INSERT INTO users (username, display_name, pass, created_at) VALUES (?, ?, ?, ?)').run(username, displayName, await hashPassword(body.password), now());
  await startSession(db, Number(r.lastInsertRowid), ctx);
  return { user: publicUser({ username, displayName, dailyGoalMin: 20, createdAt: now() }) };
}
export async function login(body, ctx) {
  const username = str(body.username, 64, 'The username').toLowerCase(), ipKey = 'ip:' + ctx.ip, uKey = 'u:' + username;
  if (hit(uKey, 5) || hit(ipKey, 20)) throw new TooMany('Too many failed logins. Wait 15 minutes and try again.');
  const db = await getDb(), row = typeof body.password === 'string' ? db.prepare('SELECT * FROM users WHERE username = ?').get(username) : null;
  if (!row || !(await verifyPassword(body.password, row.pass))) { miss(uKey); miss(ipKey); throw new Unauthorized('Wrong username or password.'); }
  fails.delete(uKey);
  await startSession(db, row.id, ctx);
  return { user: publicUser(row) };
}
export async function logout(body, ctx) {
  if (ctx.user) (await getDb()).prepare('DELETE FROM sessions WHERE token_hash = ?').run(ctx.user.tokenHash);
  ctx.cookies.push(cookie('', 0, ctx.secure));
  return { ok: true };
}
export async function me(body, ctx) { return { user: ctx.user ? publicUser(ctx.user) : null }; }

export async function update(body, ctx) {
  const db = await getDb(), u = ctx.user;
  const displayName = body.displayName != null ? str(body.displayName, 60, 'The name') || u.username : u.displayName;
  let goal = u.dailyGoalMin;
  if (body.dailyGoalMin != null) { goal = Number(body.dailyGoalMin); if (!(Number.isInteger(goal) && goal >= 5 && goal <= 600)) bad('The daily goal is 5 to 600 minutes.'); }
  db.prepare('UPDATE users SET display_name = ?, daily_goal_min = ? WHERE id = ?').run(displayName, goal, u.id);
  return { user: publicUser({ username: u.username, displayName, dailyGoalMin: goal, createdAt: u.createdAt }) };
}
export async function changePassword(body, ctx) {
  const db = await getDb(), row = db.prepare('SELECT pass FROM users WHERE id = ?').get(ctx.user.id);
  // v0.10: an account that signs in by code or with Google has no password until it sets one
  if (row.pass !== '' && (typeof body.current !== 'string' || !(await verifyPassword(body.current, row.pass)))) throw new Unauthorized('The current password is wrong.');
  checkPassword(body.password);
  db.prepare('UPDATE users SET pass = ? WHERE id = ?').run(await hashPassword(body.password), ctx.user.id);
  // other devices are logged out; this one stays in
  db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?').run(ctx.user.id, ctx.user.tokenHash);
  return { ok: true };
}
export async function deleteAccount(body, ctx) {
  const db = await getDb(), row = db.prepare('SELECT pass FROM users WHERE id = ?').get(ctx.user.id);
  // v0.10: with no password to ask for, typing the username confirms it
  if (row.pass === '') { if (body.confirm !== ctx.user.username) throw new Unauthorized('Type your username to confirm.'); }
  else if (typeof body.password !== 'string' || !(await verifyPassword(body.password, row.pass))) throw new Unauthorized('The password is wrong.');
  db.prepare('DELETE FROM users WHERE id = ?').run(ctx.user.id);   // sessions, routines and logs go with it
  ctx.cookies.push(cookie('', 0, ctx.secure));
  return { ok: true, deleted: true };
}
