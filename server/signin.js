/* Vocal Gym server · signing in with Google, or with an email address and a code (v0.10)
   The username and password login (server/auth.js) stays for the accounts that have one.

   A code: six random digits, kept only as a salted hash, lasting 10 minutes, good for one use and at most five tries.
   Asking for a code says the same thing whether or not the address has an account, so the answer cannot be used to find
   out who practises here. Asking is limited per address and per network address.

   Google: the authorization-code flow with PKCE, a state value and a nonce, the three held in an HttpOnly cookie for the
   round trip. The ID token comes straight from Google's token endpoint over TLS, so its signature need not be checked
   again (OpenID Connect Core 3.1.3.7); its issuer, audience, expiry and nonce are.

   An identity is one way in (a verified email, a Google account), and an account may have several. */
import { randomBytes, randomInt, createHmac, createHash, timingSafeEqual } from 'node:crypto';
import { getDb, now } from './db.js';
import { Invalid, TooMany, Unauthorized, startSession, publicUser, parseCookies } from './auth.js';
import { delivery, sendCode } from './notify.js';

const bad = msg => { throw new Invalid(msg); };
const CODE_LIFE = 10 * 60 * 1000, MAX_TRIES = 5, COOLDOWN = 30 * 1000, HOUR = 3600 * 1000;
const PER_ADDRESS = 5, PER_IP = 20;

/* ---- addresses ---- */
const EMAIL = /^[^\s@<>"',;:()]{1,64}@[^\s@<>"',;:()]+\.[a-z]{2,}$/i;
export function normalEmail(v) {
  const s = typeof v === 'string' ? v.trim().toLowerCase() : '';
  if (!EMAIL.test(s) || s.length > 254) bad('That does not look like an email address.');
  return s;
}
const kindOf = k => { if (k !== 'email') bad('Sign in with Google or an email address.'); return k; };
const masked = value => { const [a, d] = value.split('@'); return a.slice(0, 2) + '•••@' + d; };

/* ---- what this server offers ---- */
const google = () => ({ id: process.env.GOOGLE_CLIENT_ID, secret: process.env.GOOGLE_CLIENT_SECRET });
export function methods() {
  const g = google(), e = delivery('email');
  return { google: !!(g.id && g.secret), email: !!e, consoleCodes: { email: e === 'console' } };
}

/* ---- users ---- */
const SLUG = s => String(s).toLowerCase().replace(/[^a-z0-9_.-]+/g, '').replace(/^[^a-z0-9]+/, '').slice(0, 24);
function freeUsername(db, wish) {
  const base = SLUG(wish).length >= 3 ? SLUG(wish) : 'singer';
  const taken = u => !!db.prepare('SELECT 1 FROM users WHERE username = ?').get(u);
  if (!taken(base)) return base;
  for (;;) { const u = base + '-' + randomInt(100, 100000); if (!taken(u)) return u; }
}
const rowOfUser = (db, id) => db.prepare('SELECT * FROM users WHERE id = ?').get(id);
const identityOf = (db, kind, value) => db.prepare('SELECT * FROM identities WHERE kind = ? AND value = ?').get(kind, value);
const addIdentity = (db, userId, kind, value) => db.prepare('INSERT OR IGNORE INTO identities (user_id, kind, value, created_at) VALUES (?, ?, ?, ?)').run(userId, kind, value, now());
function newUser(db, wishUsername, displayName) {
  const username = freeUsername(db, wishUsername), name = String(displayName || '').trim().slice(0, 60) || 'Singer';
  const r = db.prepare('INSERT INTO users (username, display_name, pass, created_at) VALUES (?, ?, ?, ?)').run(username, name, '', now());
  return Number(r.lastInsertRowid);
}

/* ---- codes ---- */
const hashCode = (salt, code) => createHmac('sha256', salt).update(code).digest('hex');
const ipAsks = new Map();
export const resetSignin = () => ipAsks.clear();
function ipAllowed(ip) {
  const t = Date.now(), v = ipAsks.get(ip);
  if (!v || v.until < t) { if (ipAsks.size > 10000) ipAsks.clear(); ipAsks.set(ip, { n: 1, until: t + HOUR }); return true; }
  v.n++;
  return v.n <= PER_IP;
}
/* body { kind: 'email', value } */
export async function askCode(body, ctx) {
  const kind = kindOf(body.kind), value = normalEmail(body.value);
  if (!delivery(kind)) bad('Email sign-in is not set up on this server.');
  const db = await getDb(), t = Date.now(), since = new Date(t - HOUR).toISOString();
  const recent = db.prepare('SELECT created_at FROM login_codes WHERE kind = ? AND value = ? AND created_at > ? ORDER BY created_at DESC').all(kind, value, since);
  if (recent.length && t - Date.parse(recent[0].created_at) < COOLDOWN) throw new TooMany('A code has just been sent. Wait half a minute before asking for another.');
  if (recent.length >= PER_ADDRESS) throw new TooMany('Too many codes for this address. Try again in an hour.');
  if (!ipAllowed(ctx.ip)) throw new TooMany('Too many codes asked for from this network. Try again in an hour.');
  const code = String(randomInt(0, 1000000)).padStart(6, '0'), salt = randomBytes(16).toString('hex');
  try { await sendCode(kind, value, code); }
  catch (e) { console.error('[sign-in] ' + kind + ':', e.message); throw new Unavailable('The email could not be sent. Check the address, or try again in a minute.'); }
  // an older code stops working once a new one is out; the rows stay until they expire, to count against the limits
  db.prepare('UPDATE login_codes SET consumed = 1 WHERE kind = ? AND value = ?').run(kind, value);
  db.prepare('INSERT INTO login_codes (kind, value, salt, code_hash, tries, consumed, expires_at, created_at) VALUES (?, ?, ?, ?, 0, 0, ?, ?)').run(kind, value, salt, hashCode(salt, code), new Date(t + CODE_LIFE).toISOString(), now());
  db.prepare('DELETE FROM login_codes WHERE created_at < ?').run(new Date(t - 2 * 24 * HOUR).toISOString());
  const answer = { sent: true, to: masked(value), value, expiresIn: CODE_LIFE / 1000, retryAfter: COOLDOWN / 1000, onConsole: delivery(kind) === 'console' };
  // the test suite reads the code here; it can never be set in production
  if (process.env.VG_AUTH_DEV === '1' && process.env.NODE_ENV !== 'production') answer.devCode = code;
  return answer;
}
export class Unavailable extends Error {}
const WRONG = 'That code is wrong or has expired. Check it, or ask for a new one.';
/* body { kind, value, code, displayName? }: logs in, creating the account the first time; or, for someone already logged in,
   adds this address to their account */
export async function checkCode(body, ctx) {
  const kind = kindOf(body.kind), value = normalEmail(body.value), code = typeof body.code === 'string' ? body.code.replace(/\s/g, '') : '';
  if (!/^\d{6}$/.test(code)) bad('The code is six digits.');
  const db = await getDb();
  const row = db.prepare('SELECT * FROM login_codes WHERE kind = ? AND value = ? AND consumed = 0 ORDER BY created_at DESC LIMIT 1').get(kind, value);
  if (!row || row.expires_at < now() || row.tries >= MAX_TRIES) throw new Unauthorized(WRONG);
  const a = Buffer.from(hashCode(row.salt, code)), b = Buffer.from(row.code_hash);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    db.prepare('UPDATE login_codes SET tries = tries + 1, consumed = CASE WHEN tries + 1 >= ? THEN 1 ELSE consumed END WHERE id = ?').run(MAX_TRIES, row.id);
    throw new Unauthorized(WRONG);
  }
  db.prepare('UPDATE login_codes SET consumed = 1 WHERE id = ?').run(row.id);
  const had = identityOf(db, kind, value);
  if (ctx.user) {
    if (had && had.user_id !== ctx.user.id) bad('That address already belongs to another account.');
    addIdentity(db, ctx.user.id, kind, value);
    return { linked: true, identities: identitiesOf(db, ctx.user.id) };
  }
  let userId = had && had.user_id, created = false;
  if (!userId) {
    const wish = value.split('@')[0], name = typeof body.displayName === 'string' ? body.displayName : '';
    userId = newUser(db, wish, name || wish);
    addIdentity(db, userId, kind, value);
    created = true;
  }
  await startSession(db, userId, ctx);
  return { user: publicUser(rowOfUser(db, userId)), created };
}

/* ---- an account's ways in ---- */
function identitiesOf(db, userId) {
  return db.prepare('SELECT kind, value, label, created_at FROM identities WHERE user_id = ? ORDER BY created_at').all(userId).map(r => ({ kind: r.kind, value: r.kind === 'google' ? (r.label || 'Your Google account') : r.value, id: r.value, createdAt: r.created_at }));
}
export async function identities(body, ctx) { const db = await getDb(); return { identities: identitiesOf(db, ctx.user.id), hasPassword: rowOfUser(db, ctx.user.id).pass !== '' }; }
/* body { kind, id }: never the last way in */
export async function removeIdentity(body, ctx) {
  const db = await getDb(), u = rowOfUser(db, ctx.user.id), all = db.prepare('SELECT kind, value FROM identities WHERE user_id = ?').all(u.id);
  if (!all.some(r => r.kind === body.kind && r.value === body.id)) bad('That is not a way into this account.');
  if (all.length === 1 && u.pass === '') bad('This is your only way in. Add another first.');
  db.prepare('DELETE FROM identities WHERE user_id = ? AND kind = ? AND value = ?').run(u.id, body.kind, body.id);
  return { identities: identitiesOf(db, u.id), hasPassword: u.pass !== '' };
}

/* ---- Google ---- */
const OAUTH_COOKIE = 'vg_oauth';
const b64url = b => Buffer.from(b).toString('base64url');
const baseUrl = (req, ctx) => (process.env.PUBLIC_URL || (ctx.secure ? 'https://' : 'http://') + req.headers.host).replace(/\/$/, '');
const oauthCookie = (value, maxAge, secure) => OAUTH_COOKIE + '=' + value + '; Path=/api/auth/google; HttpOnly; SameSite=Lax; Max-Age=' + maxAge + (secure ? '; Secure' : '');
/* → where to send the browser, and the cookie that remembers this round trip */
export function googleStart(req, ctx) {
  const g = google();
  if (!g.id || !g.secret) return { redirect: '/#/account/google-off' };
  const state = b64url(randomBytes(24)), nonce = b64url(randomBytes(24)), verifier = b64url(randomBytes(48));
  const q = new URLSearchParams({ client_id: g.id, redirect_uri: baseUrl(req, ctx) + '/api/auth/google/callback', response_type: 'code', scope: 'openid email profile', state, nonce, code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256', prompt: 'select_account' });
  return { redirect: 'https://accounts.google.com/o/oauth2/v2/auth?' + q, cookies: [oauthCookie([state, nonce, verifier].join('.'), 600, ctx.secure)] };
}
const failed = why => ({ redirect: '/#/account/google-failed/' + why });
/* url: the callback's query. Logs in (or adds Google to the account already logged in) and goes on to Practice. */
export async function googleCallback(req, url, ctx) {
  const g = google(), clear = oauthCookie('', 0, ctx.secure);
  const out = r => Object.assign(r, { cookies: (r.cookies || []).concat(clear, ctx.cookies) });
  if (!g.id || !g.secret) return out({ redirect: '/#/account/google-off' });
  const [state, nonce, verifier] = String(parseCookies(req.headers.cookie)[OAUTH_COOKIE] || '').split('.');
  const q = url.searchParams;
  if (q.get('error')) return out(failed(q.get('error') === 'access_denied' ? 'cancelled' : 'refused'));
  const sent = Buffer.from(String(q.get('state'))), kept = Buffer.from(String(state));
  if (!state || sent.length !== kept.length || !timingSafeEqual(sent, kept) || !q.get('code')) return out(failed('expired'));
  let token;
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code: q.get('code'), client_id: g.id, client_secret: g.secret, redirect_uri: baseUrl(req, ctx) + '/api/auth/google/callback', grant_type: 'authorization_code', code_verifier: verifier }) });
    if (!res.ok) throw new Error('token endpoint answered ' + res.status);
    token = await res.json();
  } catch (e) { console.error('[sign-in] google:', e.message); return out(failed('unreachable')); }
  let c;
  try { c = JSON.parse(Buffer.from(String(token.id_token).split('.')[1], 'base64url').toString('utf8')); } catch (e) { return out(failed('refused')); }
  const iss = c.iss === 'https://accounts.google.com' || c.iss === 'accounts.google.com', aud = c.aud === g.id, fresh = Number(c.exp) * 1000 > Date.now();
  if (!iss || !aud || !fresh || c.nonce !== nonce || !c.sub) return out(failed('refused'));
  const db = await getDb(), had = identityOf(db, 'google', c.sub), email = c.email_verified === true && typeof c.email === 'string' ? c.email.toLowerCase() : null;
  if (ctx.user) {
    if (had && had.user_id !== ctx.user.id) return out(failed('other-account'));
    addIdentity(db, ctx.user.id, 'google', c.sub);
    if (email) db.prepare("UPDATE identities SET label = ? WHERE kind = 'google' AND value = ?").run(email, c.sub);
    return out({ redirect: '/#/account/google-added' });
  }
  let userId = had && had.user_id;
  if (!userId) {
    // the same person, if Google vouches for an address already confirmed here
    const byEmail = email && identityOf(db, 'email', email);
    userId = byEmail ? byEmail.user_id : newUser(db, email ? email.split('@')[0] : 'singer', c.name || c.given_name || (email ? email.split('@')[0] : 'Singer'));
    addIdentity(db, userId, 'google', c.sub);
    if (email) addIdentity(db, userId, 'email', email);
  }
  if (email) db.prepare("UPDATE identities SET label = ? WHERE kind = 'google' AND value = ?").run(email, c.sub);
  await startSession(db, userId, ctx);
  return out({ redirect: '/#/practice' });
}
