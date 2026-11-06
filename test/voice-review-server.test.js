/* v0.11 Voice Check's numbers and the phrase review, over HTTP against a fresh database file */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'vg-voice-'));
process.env.VG_DB = join(dir, 'test.db');
const { createApp } = await import('../server/app.js');
const { getDb } = await import('../server/db.js');

let server, base;
before(async () => { server = createApp(); await new Promise(r => server.listen(0, '127.0.0.1', r)); base = 'http://127.0.0.1:' + server.address().port; });
after(() => { server.close(); try { rmSync(dir, { recursive: true, force: true }); } catch (e) { /* Windows may hold the file */ } });

function client() {
  const jar = {};
  const post = async (path, body) => {
    const cookie = Object.entries(jar).map(([k, v]) => k + '=' + v).join('; ');
    const r = await fetch(base + path, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, cookie ? { Cookie: cookie } : {}), body: JSON.stringify(body || {}) });
    r.headers.getSetCookie().forEach(c => { const m = /^([^=]+)=([^;]*)/.exec(c); if (m) { if (m[2]) jar[m[1]] = m[2]; else delete jar[m[1]]; } });
    return { status: r.status, body: await r.json() };
  };
  return { post };
}
let n = 0;
const user = async () => { const c = client(), r = await c.post('/api/auth/register', { username: 'singer' + (++n), displayName: 'Singer', password: 'sa ri ga ma pa 1' }); assert.equal(r.status, 200); return c; };
const features = { stepsHeard: 8, roomDb: -60, stabilityCents: 9.2, offCents: -4, hnr: 18.5, cpp: 12, tilt: -9, softOnsetSec: 0.2, softBreaks: 0, softHeard: 3, rangeSemis: 24, lowHz: 110, highHz: 440, swellDb: 14, driftCents: 6, saraliOffCents: 22, secret: 'dropped' };
const check = over => Object.assign({ localDate: '2026-11-06', consent: 1, features, form: { tired: 1, effort: 2, recover: 3, effortRating: 4, pain: false }, context: { hoursAwake: 3, hoursSlept: 7, unwell: false, device: 'computer' } }, over);

test('Voice Check needs an account and a consent, keeps numbers only, and one row a day', async () => {
  assert.equal((await client().post('/api/voice/save', check())).status, 401);
  const c = await user();
  const no = await c.post('/api/voice/save', check({ consent: 0 }));
  assert.equal(no.status, 400); assert.match(no.body.error, /Agree/);
  assert.equal((await c.post('/api/voice/save', check({ localDate: 'today' }))).status, 400);
  assert.equal((await c.post('/api/voice/save', check({ features: { stepsHeard: 0 } }))).status, 400, 'nothing sung, nothing kept');
  const a = await c.post('/api/voice/save', check());
  assert.equal(a.status, 200); assert.equal(a.body.checks.length, 1);
  assert.equal(a.body.checks[0].features.secret, undefined, 'only the known measures are stored');
  assert.equal(a.body.checks[0].features.hnr, 18.5);
  const row = (await getDb()).prepare('SELECT * FROM voice_checks').all().pop();
  assert.equal(row.consent_version, 1, 'the consent it was given under');
  // taking it again replaces the day
  const b = await c.post('/api/voice/save', check({ features: Object.assign({}, features, { hnr: 20 }) }));
  assert.equal(b.body.checks.length, 1); assert.equal(b.body.checks[0].features.hnr, 20);
  await c.post('/api/voice/save', check({ localDate: '2026-11-07' }));
  assert.deepEqual((await c.post('/api/voice/list')).body.checks.map(x => x.localDate), ['2026-11-07', '2026-11-06']);
  // another singer sees none of it, and cannot delete it
  const other = await user();
  assert.equal((await other.post('/api/voice/list')).body.checks.length, 0);
  const id = (await c.post('/api/voice/list')).body.checks[0].id;
  await other.post('/api/voice/remove', { id });
  assert.equal((await c.post('/api/voice/list')).body.checks.length, 2);
  // deleting: one, then all
  assert.equal((await c.post('/api/voice/remove', { id })).body.checks.length, 1);
  assert.equal((await c.post('/api/voice/remove-all')).body.checks.length, 0);
});

test('deleting the account deletes the voice data and the reviews', async () => {
  const c = await user(), db = await getDb();
  await c.post('/api/voice/save', check());
  await c.post('/api/review/suggest', { raga: 'mela1', swaras: 'S R G M' });
  const me = (await c.post('/api/auth/me')).body.user;
  const before = db.prepare('SELECT COUNT(*) AS n FROM voice_checks').get().n;
  assert.equal((await c.post('/api/account/delete', { password: 'sa ri ga ma pa 1' })).status, 200);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM voice_checks').get().n, before - 1);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM phrase_suggestions WHERE swaras = ?').get('S R G M').n, 0);
  void me;
});

test('a teacher assigns a routine by link: a copy, and a count, and nothing of anyone\'s practice', async () => {
  const teacher = await user(), student = await user();
  const made = (await teacher.post('/api/practice/routines/save', { name: 'Week one', items: [{ kind: 'alankara', title: 'Sheet', minutes: 10 }] })).body.routine;
  assert.equal((await student.post('/api/practice/share', { id: made.id })).status, 400, 'only one\'s own routine');
  const s = (await teacher.post('/api/practice/share', { id: made.id })).body;
  assert.match(s.code, /^[a-z0-9]{10}$/); assert.equal(s.taken, 0);
  // anyone with the link can read it; it says only the routine and the teacher's name
  const seen = await client().post('/api/practice/shared', { code: s.code });
  assert.equal(seen.status, 200); assert.equal(seen.body.name, 'Week one'); assert.equal(seen.body.items[0].minutes, 10);
  assert.deepEqual(Object.keys(seen.body).sort(), ['code', 'from', 'items', 'name']);
  assert.equal((await client().post('/api/practice/shared', { code: 'nope' })).status, 400);
  assert.equal((await client().post('/api/practice/shared', { code: 'abcdefghij' })).status, 400);
  // adding needs an account, gives a copy, and is counted once
  assert.equal((await client().post('/api/practice/shared/take', { code: s.code })).status, 401);
  assert.equal((await teacher.post('/api/practice/shared/take', { code: s.code })).status, 400, 'not one\'s own');
  const took = await student.post('/api/practice/shared/take', { code: s.code });
  assert.equal(took.body.added, true);
  assert.equal((await student.post('/api/practice/shared/take', { code: s.code })).body.added, false);
  const mine = (await student.post('/api/practice/routines')).body.routines;
  assert.equal(mine[0].name, 'Week one, from Singer'); assert.notEqual(mine[0].id, made.id);
  assert.equal((await teacher.post('/api/practice/shares')).body.shares[0].taken, 1);
  // the teacher's later change does not reach the copy already taken; the same link now sends the new version
  await teacher.post('/api/practice/routines/save', { id: made.id, name: 'Week one', items: [{ kind: 'kalpana', title: 'Rounds', minutes: 5 }] });
  const again = (await teacher.post('/api/practice/share', { id: made.id })).body;
  assert.equal(again.code, s.code); assert.equal(again.taken, 1);
  assert.equal((await client().post('/api/practice/shared', { code: s.code })).body.items[0].kind, 'kalpana');
  assert.equal((await student.post('/api/practice/routines')).body.routines[0].items[0].kind, 'alankara');
});

test('phrase review: every raga is listed, verdicts are kept and counted, suggestions are read as the file reads them', async () => {
  assert.equal((await client().post('/api/review/overview')).status, 401);
  const a = await user(), b = await user();
  const all = (await a.post('/api/review/overview')).body.ragas;
  assert.equal(all.length, 100);
  assert.ok(all.some(r => r.phrases === 0), 'ragas with no phrases are listed, so a teacher can give them some');
  const r = (await a.post('/api/review/raga', { raga: 'begada' })).body;
  assert.ok(r.phrases.length > 5 && r.phrases[0].source.url.includes('darbar.org'));
  const anya = r.phrases.find(p => p.exception);
  assert.ok(anya, 'phrases outside the usual rules are shown, and marked');
  const ph = r.phrases[0];
  assert.equal((await a.post('/api/review/verdict', { raga: 'begada', phrase: 'nope', verdict: 'right' })).status, 400);
  assert.equal((await a.post('/api/review/verdict', { raga: 'begada', phrase: ph.id, verdict: 'lovely' })).status, 400);
  assert.equal((await a.post('/api/review/verdict', { raga: 'begada', phrase: ph.id, verdict: 'right' })).status, 200);
  assert.equal((await b.post('/api/review/verdict', { raga: 'begada', phrase: ph.id, verdict: 'wrong-octave', note: 'Lower, in my school' })).status, 200);
  const seen = (await a.post('/api/review/raga', { raga: 'begada' })).body.phrases.find(p => p.id === ph.id);
  assert.equal(seen.mine.verdict, 'right'); assert.deepEqual(seen.counts, { right: 1, 'wrong-octave': 1 });
  // changing and withdrawing
  await a.post('/api/review/verdict', { raga: 'begada', phrase: ph.id, verdict: 'unsure' });
  assert.equal((await a.post('/api/review/raga', { raga: 'begada' })).body.phrases.find(p => p.id === ph.id).mine.verdict, 'unsure');
  await a.post('/api/review/verdict', { raga: 'begada', phrase: ph.id, verdict: null });
  assert.equal((await a.post('/api/review/raga', { raga: 'begada' })).body.phrases.find(p => p.id === ph.id).mine, null);
  assert.equal((await a.post('/api/review/overview')).body.ragas.find(x => x.id === 'begada').reviewed, 0);
  // suggestions
  assert.match((await a.post('/api/review/suggest', { raga: 'mela1', swaras: 'S X G' })).body.error, /is not a swara/);
  assert.match((await a.post('/api/review/suggest', { raga: 'bhairavi', swaras: 'P D N' })).body.error, /two variants/);
  const ok = await a.post('/api/review/suggest', { raga: 'bhairavi', swaras: "P D2 N S'", note: 'My teacher' });
  assert.equal(ok.status, 200); assert.equal(ok.body.keepsRules, true);
  const mine = (await a.post('/api/review/raga', { raga: 'bhairavi' })).body.suggested;
  assert.equal(mine[0].swaras, "P D2 N S'");
  assert.equal((await b.post('/api/review/raga', { raga: 'bhairavi' })).body.suggested.length, 0);
  await b.post('/api/review/unsuggest', { id: mine[0].id });
  assert.equal((await a.post('/api/review/raga', { raga: 'bhairavi' })).body.suggested.length, 1, 'only one\'s own can be removed');
  await a.post('/api/review/unsuggest', { id: mine[0].id });
  assert.equal((await a.post('/api/review/raga', { raga: 'bhairavi' })).body.suggested.length, 0);
});
