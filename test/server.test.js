/* The web server: every API route, input validation, and static file serving. */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/app.js';
import * as E from '../src/engine/index.js';

let server, base;
before(async () => {
  server = createApp();
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = 'http://127.0.0.1:' + server.address().port;
});
after(() => new Promise(r => server.close(r)));

const get = path => fetch(base + path);
const post = (path, body) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) });
const json = async res => ({ status: res.status, body: await res.json() });

test('meta lists ragas, talas, the sheet and the examples', async () => {
  const { status, body } = await json(await get('/api/meta'));
  assert.equal(status, 200);
  assert.equal(body.ragas.length, 86);
  assert.equal(body.talas.length, 38);
  assert.equal(body.sheet.flat().length, 35);
  assert.deepEqual(body.examples.map(e => e.id), ['adi', 'short', 'chapu', 'speed']);
  const adi = body.talas.find(t => t.key === 'triputa-4');
  assert.equal(adi.total, 8);
  assert.deepEqual(adi.kriya, ['clap', 'count', 'count', 'count', 'clap', 'wave', 'clap', 'wave']);
});

test('alankara: sheet pattern, new patterns that avoid history, and re-rendering a saved pattern', async () => {
  const sheet = (await json(await post('/api/alankara', { raga: 'mohanam', fam: 'ata', L: 5 }))).body;
  assert.equal(sheet.source, 'sheet');
  assert.ok(sheet.checks.every(c => c.ok));
  sheet.lines.forEach(l => assert.equal(l.notes.reduce((s, n) => s + n.dur, 0), sheet.tala.total));

  const avoid = [];
  for (let seed = 1; seed <= 3; seed++) {
    const r = (await json(await post('/api/alankara', { raga: 'mela65', fam: 'triputa', L: 4, generate: { T: 1.2, seed, avoid } }))).body;
    assert.equal(r.source, 'new');
    assert.ok(!avoid.some(m => JSON.stringify(m) === JSON.stringify(r.motif)), 'a new pattern repeats an earlier one');
    avoid.push(r.motif);
  }
  const again = (await json(await post('/api/alankara', { raga: 'mela65', fam: 'triputa', L: 4, motif: avoid[0], source: 'new', generated: { T: 1.2, span: 4, diff: 3 } }))).body;
  assert.equal(again.source, 'new');
  assert.deepEqual(again.motif, avoid[0]);
  assert.match(again.summary, /creativity 1\.2/);
});

test('alankara runs out of patterns with a message, not an error', async () => {
  const avoid = [];
  let r;
  for (let seed = 1; seed < 40; seed++) {
    r = (await json(await post('/api/alankara', { raga: 'mela15', fam: 'eka', L: 3, generate: { T: 1, seed, span: 3, avoid } }))).body;
    if (r.exhausted) break;
    avoid.push(r.motif);
  }
  assert.ok(r.exhausted);
  assert.match(r.message, /every distinct pattern/);
});

test('kalpana: exact length, chosen landing, and a clear message when impossible', async () => {
  const r = (await json(await post('/api/kalpana', { raga: 'mohanam', fam: 'triputa', L: 4, aksharas: 16, per: 2, start: 7, land: 12, T: 0.4, ending: 'mora' }))).body;
  const notes = r.units.flatMap(u => u.notes);
  assert.equal(notes.reduce((s, n) => s + n.dur, 0), 32);
  assert.equal(notes[0].p, 7);
  assert.equal(notes[notes.length - 1].p, 12);
  assert.equal(r.ending.type, 'mora');
  const counts = Object.values(r.counts).reduce((a, b) => a + b, 0);
  assert.equal(counts, 32);

  const imp = (await json(await post('/api/kalpana', { raga: 'mela15', fam: 'eka', L: 3, aksharas: 2, per: 1, start: 0, land: 12 }))).body;
  assert.equal(imp.impossible, true);
  assert.match(imp.message, /not enough room/);
});

test('jathi generate: slots add up, the judge agrees, and impossible settings explain themselves', async () => {
  const r = (await json(await post('/api/jathi/generate', { fam: 'chapu', L: 7, nadai: 4, avartanams: 2, eduppu: -2, yati: 'gopuccha', T: 0.8 }))).body;
  assert.equal(r.lead, 26);
  assert.equal(r.slots.length, r.parts.reduce((s, p) => s + p.len, 0));
  assert.ok(r.judge.gatePass);
  assert.ok(r.checks.every(c => c.ok));

  let refused = null;
  for (const yati of ['damaru', 'mridanga', 'srotovaha']) {
    const x = (await json(await post('/api/jathi/generate', { fam: 'eka', L: 3, nadai: 3, avartanams: 1, yati }))).body;
    if (x.error) { refused = x; break; }
  }
  assert.ok(refused, 'expected a short span with a long yati to be refused');
  assert.equal(typeof refused.error, 'string');
});

test('judge: a correct example, a fixable mistake, and a syntax error', async () => {
  const meta = (await json(await get('/api/meta'))).body;
  const ok = (await json(await post('/api/jathi/judge', { script: meta.examples[0].script }))).body;
  assert.equal(ok.total, 100);
  assert.ok(ok.gatePass);
  assert.equal(ok.grid.slots.filter(s => s.land).length, 1);

  const short = (await json(await post('/api/jathi/judge', { script: meta.examples[1].script }))).body;
  assert.equal(short.gatePass, false);
  assert.match(short.fixes[0], /line 11/);

  const bad = (await json(await post('/api/jathi/judge', { script: 'tala: adi\n{tha-dhi' }))).body;
  assert.equal(bad.ok, false);
  assert.ok(bad.errors[0].line >= 1);
});

test('render: a kalpana round as the voice sings it, with gamaka, phrasing and loudness', async () => {
  const k = await json(await post('/api/kalpana', { raga: 'mela8', fam: 'triputa', L: 4, aksharas: 8, per: 2, T: 0, seed: 3 }));
  assert.equal(k.status, 200);
  const notes = k.body.units.flatMap(u => u.notes.map(n => ({ p: n.p, dur: n.dur })));
  const body = { raga: 'mela8', notes, bpm: 72, per: 2, intensity: 0.55, seed: 3, cycleBeats: 8, angaStarts: [0, 4, 6], units: k.body.units };
  const a = await json(await post('/api/render', body)), b = await json(await post('/api/render', body));
  assert.equal(a.status, 200);
  assert.deepEqual(a.body, b.body, 'deterministic');
  const total = notes.reduce((s, n) => s + n.dur, 0) * 60 / 72 / 2, last = a.body.groups[a.body.groups.length - 1];
  assert.ok(Math.abs(last.t1 - total) < 1e-3, 'the contour lasts the round');
  assert.ok(a.body.groups.every(g => g.points.every(([t, p]) => Number.isFinite(t) && Number.isFinite(p))), 'finite points');
  assert.ok(a.body.stats.gamakaShare > 0, 'Todi at 55 has gamaka');
  assert.equal(a.body.expression.gain.length, a.body.groups.length, 'a loudness curve per legato group');
  assert.ok(a.body.expression.gain.flat().every(([, g]) => g >= 0 && g < 1.4), 'loudness stays in range');
  assert.deepEqual(a.body.notes.map(n => n.p), notes.map(n => n.p), 'the notes are not changed');
  assert.equal(a.body.expression.notes[0].syllable, 'sa');
  // 0: straight notes, sung legato: no gamaka, every hold on its swara
  const z = await json(await post('/api/render', Object.assign({}, body, { intensity: 0 })));
  assert.equal(z.body.stats.gamakaShare, 0);
  for (const [path, bad] of [['/api/render', { raga: 'mela8', notes: [] }], ['/api/render', { raga: 'mela8', notes: [{ p: 0.5, dur: 1 }] }], ['/api/render', { raga: 'nope', notes: [{ p: 0, dur: 1 }] }]]) {
    const r = await json(await post(path, bad));
    assert.equal(r.status, 400); assert.equal(typeof r.body.error, 'string');
  }
});

test('bad input gets a 400 with a readable message', async () => {
  for (const [path, body] of [
    ['/api/alankara', { raga: 'nope', fam: 'triputa', L: 4 }],
    ['/api/alankara', { raga: 'mela15', fam: 'chapu', L: 7 }],
    ['/api/alankara', { raga: 'mela15', fam: 'triputa', L: 4, motif: [{ d: 0, dur: 5 }] }],
    ['/api/kalpana', { raga: 'mela15', fam: 'triputa', L: 4, ending: 'sideways' }],
    ['/api/jathi/generate', { fam: 'triputa', L: 4, nadai: 6 }],
    ['/api/alankara', 'not json'],
    ['/api/alankara', '[1,2]']
  ]) {
    const { status, body: b } = await json(await post(path, body));
    assert.equal(status, 400, path + ' ' + JSON.stringify(body));
    assert.equal(typeof b.error, 'string');
  }
  assert.equal((await post('/api/nothing', {})).status, 404);
  assert.equal((await get('/api/kalpana')).status, 405);
});

test('static files, the app shell fallback, and no path traversal', async () => {
  const index = await get('/');
  assert.equal(index.status, 200);
  assert.match(await index.text(), /<title>Vocal Gym<\/title>/);
  const css = await get('/css/app.css');
  assert.equal(css.headers.get('content-type'), 'text/css; charset=utf-8');
  assert.equal((await get('/js/main.js')).headers.get('content-type'), 'text/javascript; charset=utf-8');
  assert.equal((await get('/some/route')).status, 200);
  assert.equal((await get('/missing.js')).status, 404);
  assert.equal((await get('/..%2Fpackage.json')).status, 403);
  assert.notEqual((await get('/%2e%2e/server/api.js')).status, 200);
  // /shared/ serves web/shared (the solkattu voice and its bank), and nothing outside it
  const voice = await get('/shared/solkattu.js');
  assert.equal(voice.status, 200); assert.equal(voice.headers.get('content-type'), 'text/javascript; charset=utf-8');
  assert.match(await voice.text(), /VGSolkattu/);
  assert.equal((await get('/shared/solkattu-bank.js')).status, 200);
  assert.equal((await get('/shared/..%2F..%2Fpackage.json')).status, 403);
  assert.equal((await get('/shared/missing.js')).status, 404);
  // /engine/ serves src/engine as ES modules (the korvai lab computes in the page), and nothing outside it
  const kv = await get('/engine/korvai/index.js');
  assert.equal(kv.status, 200); assert.equal(kv.headers.get('content-type'), 'text/javascript; charset=utf-8');
  assert.match(await kv.text(), /export function korvaiFrame/);
  assert.equal((await get('/shared/korvai-lab.js')).status, 200);
  assert.equal((await get('/engine/..%2F..%2Fpackage.json')).status, 403);
  assert.equal((await get('/engine/missing.js')).status, 404);
});

test('kalpana on a rhythm from the korvai lab', async () => {
  const K = E.korvai, F = K.korvaiFrame({ cycles: 2, start: 4 }), sp = K.exploreSpace(F, 'korvai', { shape: 'any' });
  const R = K.exploreRealize(F, sp.items[K.exploreOrder(sp, { T: 0.4 })[0]]), rhythm = E.rhythmTemplate(F, R.layout, { label: 'test korvai' });
  const { status, body } = await json(await post('/api/kalpana', { raga: 'mela65', rhythm, land: 6, T: 0.6, seed: 3 }));
  assert.equal(status, 200);
  assert.equal(body.lead, 4, 'it starts where the lab starts');
  assert.equal(body.units.reduce((s, u) => s + u.notes.reduce((a, n) => a + n.dur, 0), 0), body.slots);
  assert.equal(body.slots + body.lead, R.layout.landIndex, 'the swaras fill the lab’s span exactly');
  assert.match(body.summary, /korvai lab/);
  assert.ok(body.checks.every(c => c.ok));
  const bad = await json(await post('/api/kalpana', { raga: 'mela65', rhythm: { v: 1, tala: { fam: 'triputa', L: 4 }, gati: 4, cells: [{ s: '<b>', r: 'statement', f: 1 }] }, land: 7 }));
  assert.equal(bad.status, 400); assert.match(bad.body.error, /not valid/);
});

test('v0.8.5: the inspiration prompt, and Claude’s lines sung as inspiration (Claude mocked)', async () => {
  const llm = await import('../server/llm.js');
  const K = E.korvai, F = K.korvaiFrame({ cycles: 2 }), sp = K.exploreSpace(F, 'korvai', { shape: 'any' });
  const R = K.exploreRealize(F, sp.items[K.exploreOrder(sp, { T: 0.4 })[0]]), rhythm = E.rhythmTemplate(F, R.layout, {});
  const pr = await json(await post('/api/kalpana/prompt', { raga: 'mela65', rhythm, land: 6, T: 0.6 }));
  assert.equal(pr.status, 200);
  assert.match(pr.body.prompt, /Arohana/); assert.ok(pr.body.schema && pr.body.phrases > 1 && pr.body.model);
  assert.equal((await post('/api/kalpana/prompt', { raga: 'mela65', land: 6 })).status, 400);
  // without credentials (or with them removed) the route explains itself
  const keep = [process.env.ANTHROPIC_API_KEY, process.env.ANTHROPIC_AUTH_TOKEN];
  delete process.env.ANTHROPIC_API_KEY; delete process.env.ANTHROPIC_AUTH_TOKEN;
  const off = await json(await post('/api/kalpana/inspire', { raga: 'mela65', rhythm, land: 6 }));
  assert.equal(off.status, 503); assert.match(off.body.error, /not configured/);
  if (keep[0] != null) process.env.ANTHROPIC_API_KEY = keep[0];
  if (keep[1] != null) process.env.ANTHROPIC_AUTH_TOKEN = keep[1];
  // a mocked Claude: the server passes the engine's prompt and schema, and sings the answer
  let seen = null;
  llm.setInspirer(async q => { seen = q; return JSON.stringify({ idea: 'runs down to the landing', phrases: Array.from({ length: pr.body.phrases }, (_, k) => ({ phrase: k + 1, swaras: k % 2 ? 'P , M G , R S ,' : 'S R G , M , P D' })) }); });
  try {
    const { status, body } = await json(await post('/api/kalpana/inspire', { raga: 'mela65', rhythm, land: 6, T: 0.6, seed: 3 }));
    assert.equal(status, 200);
    assert.equal(seen.prompt, pr.body.prompt); assert.deepEqual(seen.schema, E.INSPIRATION_SCHEMA);
    assert.ok(body.inspiration.used.length >= 1 && body.answer && body.checks.every(c => c.ok));
    assert.equal(body.units.reduce((s, u) => s + u.notes.reduce((a, n) => a + n.dur, 0), 0), body.slots);
    assert.ok(body.breath.swaras <= body.breath.syllables);
    llm.setInspirer(async () => { throw new llm.Unavailable('Claude declined this request.'); });
    const no = await json(await post('/api/kalpana/inspire', { raga: 'mela65', rhythm, land: 6 }));
    assert.equal(no.status, 503); assert.match(no.body.error, /declined/);
  } finally { llm.setInspirer(null); }
  // a pasted answer goes through /api/kalpana too; density full is one swara a syllable
  const full = await json(await post('/api/kalpana', { raga: 'mela65', rhythm, land: 6, density: 'full' }));
  assert.equal(full.body.breath.swaras, full.body.breath.syllables);
  assert.equal((await post('/api/kalpana', { raga: 'mela65', rhythm, land: 6, inspiration: [1, 2] })).status, 400);
});

test('v0.8.7: melakartas and katapayadi', async () => {
  let { status, body } = await json(await post('/api/mela', { n: 29 }));
  assert.equal(status, 200); assert.equal(body.name, 'Dheerasankarabharanam'); assert.equal(body.katapayadi.number, 29); assert.equal(body.chakra.name, 'Bana'); assert.ok(body.scale && body.letters.first.digit === 9);
  ({ status, body } = await json(await post('/api/mela', { raga: 'saveri' })));
  assert.equal(status, 200); assert.equal(body.n, 15);
  assert.equal((await post('/api/mela', { n: 99 })).status, 400);
  ({ status, body } = await json(await post('/api/katapayadi', { text: 'Mecakalyāṇī' })));
  assert.equal(status, 200); assert.equal(body.number, 65); assert.equal(body.mela.name, 'Mechakalyani');
  ({ status, body } = await json(await post('/api/katapayadi', { swaras: { R: 'R2', G: 'G3', M: 'M1', D: 'D2', N: 'N3' } })));
  assert.equal(body.n, 29);
  const bad = await json(await post('/api/katapayadi', { swaras: { R: 'R3', G: 'G1', M: 'M1', D: 'D1', N: 'N1' } }));
  assert.equal(bad.status, 400); assert.match(bad.body.error, /above/);
  assert.equal((await post('/api/katapayadi', {})).status, 400);
});
