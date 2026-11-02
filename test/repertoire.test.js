/* v0.9 the repertoire: the compact notation, ragas from printed scales, talas by the site's names, the play
   plan (lead-ins, split lines, overlap cells, double speed), the importer on a post written for the test, every
   imported composition, and the routes and practice items that use them. */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { E, checker } from './helpers.js';
import { swaraCell, scaleRow, parsePost } from '../scripts/import-repertoire.js';

const dir = mkdtempSync(join(tmpdir(), 'vg-rep-'));
process.env.VG_DB = join(dir, 'test.db');
const { createApp } = await import('../server/app.js');
const DATA = fileURLToPath(new URL('../data/repertoire/', import.meta.url));

test('the compact notation: units, double and four-times speed, octaves and variants', () => {
  assert.deepEqual(E.parseCell("S , R2 G' N."), [{ s: 'S', v: 0, o: 0, d: 1 }, { s: ',', v: 0, o: 0, d: 1 }, { s: 'R', v: 2, o: 0, d: 1 }, { s: 'G', v: 0, o: 1, d: 1 }, { s: 'N', v: 0, o: -1, d: 1 }]);
  assert.equal(E.cellUnits('G M [P N N D] [D P , M] N D'), 8);
  assert.equal(E.cellUnits('[[S R G M]] P'), 2);
  assert.equal(E.lineUnits(['S , , R R S N. S R G M P , N P M', 'G , , P M R R ,', ', N P M R M R S']), 32);
});

test('ragas from printed scales: engine twins, and the variant by direction', () => {
  const kalyani = E.ragaOf({ name: 'kalyANi', aro: ['S', 'R2', 'G3', 'M2', 'P', 'D2', 'N3', "S'"], avaro: ["S'", 'N3', 'D2', 'P', 'M2', 'G3', 'R2', 'S'] });
  assert.equal(kalyani.twin, 'mela65');
  assert.equal(kalyani.id, 'mela65');   // so the raga's sourced gamaka applies
  // Bhairavi: D2 going up, D1 coming down
  const bhairavi = E.ragaOf({ name: 'Bhairavi', aro: ['S', 'R2', 'G2', 'M1', 'P', 'D2', 'N2', "S'"], avaro: ["S'", 'N2', 'D1', 'P', 'M1', 'G2', 'R2', 'S'] });
  assert.equal(bhairavi.twin, null);
  assert.deepEqual(E.linePitches(bhairavi, ["P D N S'"]).map(n => n.p), [7, 9, 10, 12]);
  assert.deepEqual(E.linePitches(bhairavi, ["S' N D P"]).map(n => n.p), [12, 10, 8, 7]);
  // a karvai lengthens the swara before it; at the start of a line it is a rest
  assert.deepEqual(E.linePitches(bhairavi, [', , S , R']), [{ p: null, d: 2 }, { p: 0, d: 2 }, { p: 2, d: 1 }]);
  // a digit wins over the scale; a letter the scale lacks takes its common variant and is counted
  const mohanam = E.ragaOf({ name: 'Mohanam', aro: ['S', 'R2', 'G3', 'P', 'D2', "S'"], avaro: ["S'", 'D2', 'P', 'G3', 'R2', 'S'] });
  const st = { outside: 0 };
  assert.deepEqual(E.linePitches(mohanam, ['G M1 P N'], st).map(n => n.p), [4, 5, 7, 11]);
  assert.equal(st.outside, 1);
});

test('talas by the site’s names', () => {
  const t = n => { const x = E.talaOf(n); return x && [x.tala.total, x.nadai]; };
  assert.deepEqual(t('Adi'), [8, 4]); assert.deepEqual(t('aadhi'), [8, 4]); assert.deepEqual(t('Adi (tisra)'), [8, 3]);
  assert.deepEqual(t('roopakam'), [6, 4]); assert.deepEqual(t('Tisra Roopakam'), [5, 4]);
  assert.deepEqual(t('mishra chApu'), [7, 4]); assert.deepEqual(t('KhandaChapu'), [5, 4]); assert.deepEqual(t('sankeerNa chApu'), [9, 4]);
  assert.deepEqual(t('Ata'), [14, 4]); assert.deepEqual(t('khanda jampE'), [8, 4]); assert.deepEqual(t('chathushra jhampE'), [7, 4]);
  assert.deepEqual(t('thishra thriputa'), [7, 4]); assert.deepEqual(t('Matya Taala'), [10, 4]); assert.deepEqual(t('thisra eka'), [3, 4]);
  ['Kalyani', 'Atana', 'Natakurunji', 'Adi shankaracharya', '2', ''].forEach(n => assert.equal(E.talaOf(n), null, n));
});

test('the play plan: lead-ins, split lines, overlap cells and double speed on one grid', () => {
  const raga = E.ragaOf({ name: 'Mohanam', aro: ['S', 'R2', 'G3', 'P', 'D2', "S'"], avaro: ["S'", 'D2', 'P', 'G3', 'R2', 'S'] });
  const adi = E.tala('triputa', 4);
  const slots = p => p.notes.reduce((a, n) => a + n.slots, 0);
  // two full cycles at 2 a beat
  let p = E.playPlan([{ cells: ['S R G P D P G R', 'S , R G', 'P , , ,'] }, { cells: ['G , G , P , P ,', 'D , D ,', "S' , , ,"] }], { raga, tala: adi, unitsPerBeat: 2 });
  assert.equal(slots(p), 32); assert.equal(p.sub, 1); assert.equal(p.per, 2); assert.equal(p.offset, 0);
  // a double-speed group puts the grid at 2 cells a unit
  p = E.playPlan([{ cells: ['S R G P D P G R', 'S , [R G P G]', 'P , , ,'] }], { raga, tala: adi, unitsPerBeat: 2 });
  assert.equal(p.sub, 2); assert.equal(slots(p), 32); assert.equal(p.per, 4);
  // a lead-in of 4 units ends on sam: it starts 12 units into the cycle
  p = E.playPlan([{ cells: ['P D S\' ,'], at: 12 }, { cells: ["S' , , , , , , ,", 'D P G R', 'S , , ,'] }], { raga, tala: adi, unitsPerBeat: 2 });
  assert.equal(p.offset, 12); assert.equal(slots(p), 20);
  // a short line before a joined line runs straight on; an unjoined one waits for sam
  const split = [{ cells: ['S R G ,'] }, { cells: ['P D P G', 'R , , ,', 'S , , ,'], join: true }];
  assert.equal(slots(E.playPlan(split, { raga, tala: adi, unitsPerBeat: 2 })), 16);
  assert.equal(slots(E.playPlan([split[0], { cells: split[1].cells }], { raga, tala: adi, unitsPerBeat: 2 })), 28);
  // an overlap cell sounds over the next line's opening rests
  const tail = [{ cells: [', , S R G , , ,', 'P , , ,', 'D , , ,', 'S R'], tail: 2 }, { cells: [', , G R S , , ,', 'R , , ,', 'S , , ,'] }];
  p = E.playPlan(tail, { raga, tala: adi, unitsPerBeat: 2 });
  assert.equal(slots(p), 32);   // two cycles: the tail's S R sounds in the second line's two opening rests
  assert.deepEqual(p.notes.slice(5, 9).map(n => n.p), [9, 0, 2, 4]);   // … D, then the tail S R, then the second line's G
  const second = p.tokens.filter(t => t.line === 1 && t.from === 16);
  assert.equal(second.length, 0, 'the second line’s opening rests are replaced');
  assert.ok(p.tokens.some(t => t.line === 0 && t.cell === 3 && t.from === 16), 'the tail starts the second cycle');
});

/* a post written for the test, in the site's markup: a scale row, a section heading, a label column with
   rowspan, a sangati block with an underlined (double-speed) group, its sahitya, and a link line */
const span = (t, u) => '<span style="font-family: &quot;Courier New&quot;; ' + (u ? 'text-decoration: underline;' : 'text-decoration: none;') + '">' + t + '</span>';
const td = (inner, attrs = '') => '<td ' + attrs + '><p dir="ltr">' + inner + '</p></td>';
const POST = {
  title: { $t: 'test kriti - mOhanam - Adi - Test Composer' },
  link: [{ rel: 'alternate', href: 'https://carnaticnotations.blogspot.com/2026/01/test-kriti-mohanam-adi.html' }],
  category: [{ term: 'Krithi' }, { term: 'Mohanam' }, { term: 'Test Composer' }, { term: 'Telugu' }, { term: 'Krishna' }],
  published: { $t: '2026-01-02T00:00:00Z' }, updated: { $t: '2026-01-03T00:00:00Z' },
  content: { $t: '<table><tbody>' +
    '<tr>' + td(span('mOhanam - S R2 G3 P D2 S’ - S’ D2 P G3 R2 S'), 'colspan="4"') + '</tr>' +
    '<tr>' + td(span('pallavi - sa ri ga ma'), 'colspan="4"') + '</tr>' +
    '<tr>' + td(span(''), 'rowspan="3"') + td(span('S , R , G , P ,  D , P , G , R ,')) + td(span('S , ‘D ,  S R G ,')) + td(span('P , , ,  D , S’ ,')) + '</tr>' +
    '<tr>' + td(span('S , R , G , P ,  D , P , ') + span('GPDP', true) + span(' R ,')) + td(span('S , ‘D ,  S R G ,')) + td(span('P , , ,  D , S’ ,')) + '</tr>' +
    '<tr>' + td(span('sa  ri  ga  ma    pa  da  ni')) + td(span('sa  ri')) + td(span('ga')) + '</tr>' +
    '<tr>' + td(span('2')) + td(span('G R S ,')) + td(span('')) + td(span('')) + '</tr>' +
    '</tbody></table>' }
};

test('the importer: cells, scale rows and a whole post', () => {
  const c = swaraCell([{ text: 'G M ', u: false }, { text: 'PNND', u: true }, { text: ' ‘D S’', u: false }]);
  assert.equal(c.text, "G M [P N N D] D. S'"); assert.equal(c.units, 6); assert.deepEqual(c.bad, []);
  assert.equal(swaraCell([{ text: 'S ; R', u: false }]).text, 'S , , R');
  assert.deepEqual(scaleRow('kalyANi - S R2 G3 M2 P D2 N3 S’ - S’ N3 D2 P M2 G3 R2 S (65th mELakartha)'),
    { name: 'kalyANi', aro: ['S', 'R2', 'G3', 'M2', 'P', 'D2', 'N3', "S'"], avaro: ["S'", 'N3', 'D2', 'P', 'M2', 'G3', 'R2', 'S'], note: '65th mELakartha' });
  assert.equal(scaleRow('pallavi - vanajAkshi ninnE kori'), null);

  const p = parsePost(POST);
  assert.equal(p.id, '2026-01-test-kriti-mohanam-adi');
  assert.equal(p.type, 'Krithi'); assert.equal(p.raga, 'Mohanam'); assert.equal(p.composer, 'Test Composer'); assert.equal(p.language, 'Telugu'); assert.deepEqual(p.deity, ['Krishna']);
  assert.equal(p.tala.name, 'Adi'); assert.equal(p.tala.unitsPerBeat, 4);
  assert.equal(p.sections.length, 1);
  const s = p.sections[0];
  assert.equal(s.title, 'pallavi'); assert.deepEqual(s.lyrics, ['sa ri ga ma']); assert.equal(s.raga, 0);
  assert.equal(s.lines.length, 3);
  assert.deepEqual(s.lines[1].cells, ['S , R , G , P , D , P , [G P D P] R ,', 'S , D. , S R G ,', "P , , , D , S' ,"]);
  assert.equal(E.lineUnits(s.lines[1].cells), 32);
  // both sangatis get the sahitya, each syllable at the unit above it
  assert.deepEqual(s.lines[0].syl.slice(0, 4), [[0, 'sa'], [2, 'ri'], [4, 'ga'], [6, 'ma']]);
  assert.deepEqual(s.lines[1].syl.find(x => x[1] === 'ri' && x[0] >= 16), [18, 'ri']);
  // the label column, and a short link line
  assert.equal(s.lines[2].label, '2'); assert.equal(s.lines[2].link, true);
  assert.deepEqual(p.stats.full, 2); assert.equal(p.stats.partial, 0);
});

test('every imported composition reads, resolves its pitches and plays on its grid', t => {
  const { ok, done } = checker(t);
  const ix = JSON.parse(readFileSync(join(DATA, 'index.json'), 'utf8'));
  const files = readdirSync(join(DATA, 'c'));
  ok(ix.count === ix.compositions.length && ix.count === files.length, 'index and files: ' + ix.count + ' / ' + files.length);
  ok(ix.count >= 1500, 'the whole site: ' + ix.count);
  ok(/free for anyone/.test(ix.source.terms), 'the site’s terms are kept');
  const ids = new Set(files.map(f => f.replace(/\.json$/, '')));
  let lines = 0, onCycle = 0, playable = 0;
  ix.compositions.forEach(s => ok(ids.has(s.id), 'no file for ' + s.id));
  files.forEach(f => {
    const c = JSON.parse(readFileSync(join(DATA, 'c', f), 'utf8'));
    ok(/^https:\/\/carnaticnotations\.blogspot\.com\//.test(c.url), c.id + ': its page on the site');
    const tl = c.tala && E.talaOf(c.tala.name);
    ok(!c.tala || tl, c.id + ': tala ' + (c.tala && c.tala.name));
    const ragas = c.ragas.map(E.ragaOf);
    c.sections.forEach((s, si) => {
      if (!s.lines.length) return;
      const raga = ragas[s.raga != null ? s.raga : 0];
      if (!raga) return;
      playable++;
      s.lines.forEach((l, li) => {
        lines++;
        if (!l.link && !l.at) onCycle += tl && E.rowFits(tl.tala, s.unitsPerBeat || c.tala.unitsPerBeat, l.cells.map(E.cellUnits)) ? 1 : 0; else onCycle++;
        const ps = E.linePitches(raga, l.cells);
        ok(ps.every(n => n.p === null || (Number.isInteger(n.p) && n.p >= -24 && n.p <= 36)), c.id + ' ' + si + ':' + li + ': pitches in range');
        (l.syl || []).forEach(([u]) => ok(u >= 0 && u <= E.lineUnits(l.cells) + 1e-9, c.id + ' ' + si + ':' + li + ': a syllable inside its line'));
      });
      const plan = E.playPlan(s.lines.map(l => Object.assign({ raga }, l)), { tala: tl ? tl.tala : null, unitsPerBeat: s.unitsPerBeat || (c.tala ? c.tala.unitsPerBeat : 1) });
      ok(plan.notes.length > 0 && plan.notes.length <= 4000, c.id + ' ' + si + ': ' + plan.notes.length + ' notes (the render route takes 4000)');
      ok(plan.notes.every(n => Number.isInteger(n.slots) && n.slots >= 1 && n.slots <= 64 * 8), c.id + ' ' + si + ': whole grid cells');
    });
  });
  // the importer reports the rest: slips in the source, sung as written
  ok(onCycle / lines >= 0.9, 'lines on the tala grid: ' + onCycle + ' of ' + lines);
  ok(playable >= 4000, 'playable sections: ' + playable);
  t.diagnostic(lines + ' lines, ' + onCycle + ' on the grid, ' + playable + ' playable sections');
  done();
});

let server, base;
before(async () => { server = createApp(); await new Promise(r => server.listen(0, '127.0.0.1', r)); base = 'http://127.0.0.1:' + server.address().port; });
after(() => { server.close(); try { rmSync(dir, { recursive: true, force: true }); } catch (e) { /* Windows may hold the file */ } });

test('routes: the data, sung by its printed scale, and repertoire items in routines and logs', async () => {
  let r = await fetch(base + '/repertoire/index.json');
  assert.equal(r.status, 200);
  const ix = await r.json(), first = ix.compositions[0];
  r = await fetch(base + '/repertoire/c/' + first.id + '.json'); assert.equal(r.status, 200);
  assert.equal((await r.json()).id, first.id);
  assert.equal((await fetch(base + '/repertoire/..%2f..%2fpackage.json')).status, 403);
  assert.equal((await fetch(base + '/engine/repertoire.js')).status, 200);

  const post = (path, body, cookie) => fetch(base + path, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, cookie ? { Cookie: cookie } : {}), body: JSON.stringify(body) });
  const varali = { name: 'Varali', aro: ['S', 'G1', 'R1', 'G1', 'M2', 'P', 'D1', 'N3', "S'"], avaro: ["S'", 'N3', 'D1', 'P', 'M2', 'G1', 'R1', 'S'] };
  r = await post('/api/render', { scale: varali, notes: [{ p: 0, dur: 2 }, { p: 1, dur: 2 }, { p: 2, dur: 2 }, { p: 6, dur: 2 }], bpm: 72, per: 2 });
  assert.equal(r.status, 200);
  const c = await r.json();
  assert.equal(c.raga, 'rep-varali'); assert.equal(c.notes.length, 4); assert.ok(c.groups.length >= 1);
  r = await post('/api/render', { scale: { name: 'Kalyani', aro: ['S', 'R2', 'G3', 'M2', 'P', 'D2', 'N3', "S'"], avaro: ["S'", 'N3', 'D2', 'P', 'M2', 'G3', 'R2', 'S'] }, notes: [{ p: 0, dur: 1 }], bpm: 72, per: 2 });
  assert.equal((await r.json()).raga, 'mela65');
  assert.equal((await post('/api/render', { scale: { aro: ['S', 'X9'], avaro: ['S'] }, notes: [{ p: 0, dur: 1 }] })).status, 400);

  r = await post('/api/auth/register', { username: 'lakshmi', password: 'sa ri ga ma pa 1' });
  const cookie = 'vg_session=' + /vg_session=([^;]*)/.exec(r.headers.get('set-cookie'))[1];
  r = await post('/api/practice/routines', {}, cookie);
  const R = await r.json();
  assert.ok(R.kinds.includes('repertoire')); assert.ok(R.starters.some(s => s.id === 'starter-repertoire'));
  r = await post('/api/practice/routines/save', { name: 'Songs', items: [{ kind: 'repertoire', title: first.name, minutes: 10, ref: first.id }, { kind: 'alankara', minutes: 5, ref: first.id }] }, cookie);
  assert.equal(r.status, 200);
  const saved = (await r.json()).routine;
  assert.equal(saved.items[0].ref, first.id); assert.equal(saved.items[1].ref, undefined);
  assert.equal((await post('/api/practice/routines/save', { name: 'Bad', items: [{ kind: 'repertoire', minutes: 5, ref: '../etc' }] }, cookie)).status, 400);
  r = await post('/api/practice/log', { clientId: 'rep-log-0001', localDate: '2026-11-02', startedAt: '2026-11-02T06:00:00Z', endedAt: '2026-11-02T06:10:00Z', seconds: 600,
    items: [{ kind: 'repertoire', title: first.name, plannedSec: 600, spentSec: 600, done: true, ref: first.id }] }, cookie);
  assert.equal(r.status, 200);
  const log = (await r.json()).log;
  assert.equal(log.items[0].kind, 'repertoire'); assert.equal(log.items[0].ref, first.id);
});
