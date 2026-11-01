/* Vocal Gym web server: serves the site in app/ and the JSON API in server/api.js.
   node:http, node:fs and the engine; the Claude SDK (server/llm.js) is loaded only when a page asks for
   inspired kalpana lines (v0.8.5). */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, normalize, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as api from './api.js';

const ROOT = fileURLToPath(new URL('../app/', import.meta.url));
// /shared/ is web/shared/: browser scripts the app shares with the playground (the solkattu voice and its bank)
const SHARED = fileURLToPath(new URL('../web/shared/', import.meta.url));
// /engine/ is src/engine/: the browser-safe engine as ES modules (the korvai lab computes in the page)
const ENGINE = fileURLToPath(new URL('../src/engine/', import.meta.url));
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.jathi': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2'
};
const ROUTES = {
  'GET /api/meta': () => api.meta(),
  'GET /api/health': () => ({ ok: true }),
  'POST /api/alankara': b => api.alankara(b),
  'POST /api/kalpana': b => api.kalpana(b),
  'POST /api/kalpana/prompt': b => api.kalpanaPrompt(b),
  'POST /api/kalpana/inspire': b => api.kalpanaInspire(b),
  'POST /api/jathi/generate': b => api.jathiGenerate(b),
  'POST /api/jathi/judge': b => api.jathiJudge(b),
  'POST /api/render': b => api.render(b)
};
const MAX_BODY = 256 * 1024;

function send(res, status, body, type, extra) {
  res.writeHead(status, Object.assign({ 'Content-Type': type, 'X-Content-Type-Options': 'nosniff' }, extra));
  res.end(body);
}
const json = (res, status, obj) => send(res, status, JSON.stringify(obj), TYPES['.json'], { 'Cache-Control': 'no-store' });

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
  const route = ROUTES[req.method + ' ' + path];
  if (!route) {
    const known = Object.keys(ROUTES).some(k => k.endsWith(' ' + path));
    return json(res, known ? 405 : 404, { error: known ? 'Method not allowed.' : 'No such endpoint.' });
  }
  try {
    const body = req.method === 'POST' ? await readBody(req) : {};
    if (body === null || typeof body !== 'object' || Array.isArray(body)) throw new api.BadRequest('The request body must be a JSON object.');
    json(res, 200, await route(body));
  } catch (e) {
    if (e instanceof api.BadRequest) json(res, 400, { error: e.message });
    else if (e instanceof api.Unavailable) json(res, 503, { error: e.message, unavailable: true });
    else { console.error(e); json(res, 500, { error: 'Something went wrong on the server.' }); }
  }
}

async function handleStatic(req, res, path) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed', 'text/plain');
  let rel;
  try { rel = decodeURIComponent(path); } catch { return send(res, 400, 'Bad path', 'text/plain'); }
  if (rel.endsWith('/')) rel += 'index.html';
  const mountAt = rel.startsWith('/shared/') ? '/shared' : rel.startsWith('/engine/') ? '/engine' : '';
  const base = mountAt === '/shared' ? SHARED : mountAt === '/engine' ? ENGINE : ROOT;
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
    if (path.startsWith('/api/')) handleApi(req, res, path);
    else handleStatic(req, res, path);
  });
}
