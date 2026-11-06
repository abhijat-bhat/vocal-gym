/* Vocal Gym web server: serves the site in app/ and the JSON API in server/api.js.
   node:http, node:fs and the engine; the Claude SDK (server/llm.js) is loaded only when a page asks for
   inspired kalpana lines (v0.8.5). v0.8.7: accounts, practice routines, logs and streaks (server/auth.js,
   server/practice.js) in a SQLite file (server/db.js); the app installs as a PWA (app/manifest.webmanifest,
   app/sw.js). */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, normalize, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as api from './api.js';
import * as auth from './auth.js';
import * as practice from './practice.js';
import * as edits from './edits.js';
import * as signin from './signin.js';
import { Unavailable as DbUnavailable } from './db.js';

const ROOT = fileURLToPath(new URL('../app/', import.meta.url));
// /shared/ is web/shared/: browser scripts the app shares with the playground (the solkattu voice and its bank)
const SHARED = fileURLToPath(new URL('../web/shared/', import.meta.url));
// /engine/ is src/engine/: the browser-safe engine as ES modules (the korvai lab computes in the page)
const ENGINE = fileURLToPath(new URL('../src/engine/', import.meta.url));
// /repertoire/ is data/repertoire/: the compositions imported from carnaticnotations.blogspot.com (v0.9)
const REPERTOIRE = fileURLToPath(new URL('../data/repertoire/', import.meta.url));
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.jathi': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};
const ROUTES = {
  'GET /api/meta': () => api.meta(),
  'GET /api/health': () => ({ ok: true }),
  'GET /api/auth/methods': () => signin.methods(),
  'POST /api/alankara': b => api.alankara(b),
  'POST /api/kalpana': b => api.kalpana(b),
  'POST /api/kalpana/prompt': b => api.kalpanaPrompt(b),
  'POST /api/kalpana/inspire': b => api.kalpanaInspire(b),
  'POST /api/mela': b => api.mela(b),
  'POST /api/katapayadi': b => api.katapayadi(b),
  'POST /api/jathi/generate': b => api.jathiGenerate(b),
  'POST /api/jathi/judge': b => api.jathiJudge(b),
  'POST /api/render': b => api.render(b)
};
/* v0.8.7: routes that use the login. 'user' routes need one (401 otherwise); 'any' routes read it if there is
   one. Both take only JSON bodies (with the SameSite cookie, this stops cross-site request forgery). */
const ACCOUNT = {
  'POST /api/auth/register': ['any', auth.register], 'POST /api/auth/login': ['any', auth.login],
  'POST /api/auth/logout': ['any', auth.logout], 'POST /api/auth/me': ['any', auth.me],
  'POST /api/auth/code': ['any', signin.askCode], 'POST /api/auth/code/check': ['any', signin.checkCode],
  'POST /api/account/identities': ['user', signin.identities], 'POST /api/account/identities/remove': ['user', signin.removeIdentity],
  'POST /api/account/update': ['user', auth.update], 'POST /api/account/password': ['user', auth.changePassword],
  'POST /api/account/delete': ['user', auth.deleteAccount],
  'POST /api/practice/routines': ['user', practice.routines], 'POST /api/practice/routines/save': ['user', practice.saveRoutine],
  'POST /api/practice/routines/delete': ['user', practice.deleteRoutine], 'POST /api/practice/log': ['user', practice.saveLog],
  'POST /api/practice/logs': ['user', practice.logs], 'POST /api/practice/logs/delete': ['user', practice.deleteLog],
  'POST /api/practice/summary': ['user', practice.summary],
  'POST /api/repertoire/edits': ['user', edits.edits], 'POST /api/repertoire/edits/save': ['user', edits.save],
  'POST /api/repertoire/edits/restore': ['user', edits.restore], 'POST /api/repertoire/changes': ['user', edits.changes],
  'POST /api/repertoire/octave-ok': ['user', edits.octaveOk], 'POST /api/repertoire/octave-ask': ['user', edits.octaveAsk]
};
const MAX_BODY = 256 * 1024;

function send(res, status, body, type, extra) {
  res.writeHead(status, Object.assign({ 'Content-Type': type, 'X-Content-Type-Options': 'nosniff' }, extra));
  res.end(body);
}
const json = (res, status, obj, cookies) => send(res, status, JSON.stringify(obj), TYPES['.json'], Object.assign({ 'Cache-Control': 'no-store' }, cookies && cookies.length ? { 'Set-Cookie': cookies } : {}));

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > MAX_BODY) { reject(new api.BadRequest('Request body too large.')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { reject(new api.BadRequest('The request body is not valid JSON.')); }
    });
    req.on('error', reject);
  });
}

async function handleApi(req, res, path) {
  const key = req.method + ' ' + path, route = ROUTES[key], acct = ACCOUNT[key];
  if (!route && !acct) {
    const known = Object.keys(ROUTES).concat(Object.keys(ACCOUNT)).some(k => k.endsWith(' ' + path));
    return json(res, known ? 405 : 404, { error: known ? 'Method not allowed.' : 'No such endpoint.' });
  }
  const ctx = { user: null, ip: req.socket.remoteAddress || '', secure: !!req.socket.encrypted || req.headers['x-forwarded-proto'] === 'https', cookies: [] };
  try {
    if (acct && !/^application\/json\b/i.test(req.headers['content-type'] || '')) throw new api.BadRequest('Send the request as JSON (Content-Type: application/json).');
    const body = req.method === 'POST' ? await readBody(req) : {};
    if (body === null || typeof body !== 'object' || Array.isArray(body)) throw new api.BadRequest('The request body must be a JSON object.');
    if (acct) {
      ctx.user = await auth.userOf(req);
      if (acct[0] === 'user' && !ctx.user) throw new auth.Unauthorized('Log in first.');
      return json(res, 200, await acct[1](body, ctx), ctx.cookies);
    }
    json(res, 200, await route(body));
  } catch (e) {
    if (e instanceof api.BadRequest || e instanceof auth.Invalid) json(res, 400, { error: e.message }, ctx.cookies);
    else if (e instanceof auth.Unauthorized) json(res, 401, { error: e.message, login: true }, ctx.cookies);
    else if (e instanceof auth.TooMany) json(res, 429, { error: e.message });
    else if (e instanceof api.Unavailable || e instanceof DbUnavailable || e instanceof signin.Unavailable) json(res, 503, { error: e.message, unavailable: true });
    else { console.error(e); json(res, 500, { error: 'Something went wrong on the server.' }); }
  }
}

/* v0.10: the two Google routes are page visits, not JSON calls: they answer with a redirect */
async function handleGoogle(req, res, path) {
  const ctx = { user: null, ip: req.socket.remoteAddress || '', secure: !!req.socket.encrypted || req.headers['x-forwarded-proto'] === 'https', cookies: [] };
  const go = r => { res.writeHead(302, Object.assign({ Location: r.redirect, 'Cache-Control': 'no-store' }, r.cookies && r.cookies.length ? { 'Set-Cookie': r.cookies } : {})); res.end(); };
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed.' });
  try {
    if (path.endsWith('/start')) return go(signin.googleStart(req, ctx));
    ctx.user = await auth.userOf(req);
    return go(await signin.googleCallback(req, new URL(req.url, 'http://x'), ctx));
  } catch (e) {
    console.error(e);
    go({ redirect: '/#/account/google-failed/unavailable' });
  }
}

async function handleStatic(req, res, path) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed', 'text/plain');
  let rel;
  try { rel = decodeURIComponent(path); } catch { return send(res, 400, 'Bad path', 'text/plain'); }
  if (rel.endsWith('/')) rel += 'index.html';
  const mountAt = ['/shared', '/engine', '/repertoire'].find(m => rel.startsWith(m + '/')) || '';
  const base = { '/shared': SHARED, '/engine': ENGINE, '/repertoire': REPERTOIRE }[mountAt] || ROOT;
  const file = normalize(join(base, mountAt ? rel.slice(mountAt.length) : rel));
  if (!file.startsWith(base.endsWith(sep) ? base : base + sep)) return send(res, 403, 'Forbidden', 'text/plain');
  try {
    const s = await stat(file);
    if (!s.isFile()) throw new Error('not a file');
    const data = await readFile(file);
    send(res, 200, req.method === 'HEAD' ? '' : data, TYPES[extname(file)] || 'application/octet-stream', { 'Cache-Control': 'no-cache' });
  } catch {
    // unknown paths without an extension fall back to the app shell
    if (!extname(rel)) { const data = await readFile(join(ROOT, 'index.html')); return send(res, 200, data, TYPES['.html']); }
    send(res, 404, 'Not found', 'text/plain');
  }
}

export function createApp() {
  return createServer((req, res) => {
    const path = new URL(req.url, 'http://x').pathname;
    if (path === '/api/auth/google/start' || path === '/api/auth/google/callback') handleGoogle(req, res, path);
    else if (path.startsWith('/api/')) handleApi(req, res, path);
    else handleStatic(req, res, path);
  });
}
