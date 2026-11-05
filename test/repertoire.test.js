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
  // v0.9.1: the marks stay with their swaras across an underline's edge, in both directions
  assert.equal(swaraCell([{ text: 'NS', u: true }, { text: '’ N', u: false }]).text, "[N S'] N");
  assert.equal(swaraCell([{ text: 'S ‘', u: false }, { text: 'N,SS', u: true }]).text, 'S [N. , S S]');
  assert.deepEqual(swaraCell([{ text: 'NS', u: true }, { text: '’ N', u: false }]).slips, []);
  // the site's typing slips: ‘N’D is two lower notes, however long the run
  const slip = t => { const c = swaraCell([{ text: t, u: false }]); return [c.text, c.slips]; };
  assert.deepEqual(slip('S ‘N’D R'), ['S N. D. R', ['lower-run']]);
  assert.deepEqual(slip('M G R S ‘N’D’M’D'), ['M G R S N. D. M. D.', ['lower-run', 'lower-run', 'lower-run']]);
  assert.deepEqual(slip('‘N’ S'), ['N. S', ['lower-run']]);
  // ’N with no swara before it is a lower N, after a space, a karvai or at the start
  assert.deepEqual(slip('S ’N S'), ['S N. S', ['lower-mark']]);
  assert.deepEqual(slip(', ,’P ,'), [', , P. ,', ['lower-mark']]);
  assert.deepEqual(slip('’N S'), ['N. S', ['lower-mark']]);
  // ” typed for ’
  assert.deepEqual(slip('G’ R” S’'), ["G' R' S'", ['upper-mark']]);
  // and what is not a slip stays as it was
  assert.deepEqual(slip("S’N S’D R’"), ["S' N S' D R'", []]);
  assert.deepEqual(slip('‘  S’ N P'), ["S' N P", []]);   // a ‘ standing apart says nothing about the S’ after it
  assert.deepEqual(slip('‘N‘D S’ ,’'), ["N. D. S' ,", []]);
  assert.equal(swaraCell([{ text: '‘N’D  R ,', u: false }]).was, '‘N’D R ,');
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
  assert.equal(s.lines[0].fixed, undefined); assert.equal(p.stats.slips, undefined);
  // a slip is corrected, and the line keeps what the site prints
  const slipped = JSON.parse(JSON.stringify(POST));
  slipped.content.$t = slipped.content.$t.replace('S , ‘D ,  S R G ,', 'S , ’D ,  S R G ,');
  const q = parsePost(slipped).sections[0].lines[0];
  assert.equal(q.cells[1], 'S , D. , S R G ,');
  assert.deepEqual(q.fixed, [{ cell: 1, was: 'S , ’D , S R G ,', why: ['lower-mark'] }]);
});

test('a line off the cycle: how far, where it first goes off, and the lines that are short on purpose', () => {
  const rup = E.talaOf('roopakam').tala, adi = E.tala('triputa', 4);
  const row = (...us) => us.map(n => Array.from({ length: n }, () => 'S').join(' '));
  assert.equal(E.cycleGap(row(12, 12, 12, 12), rup, 2), null);
  // abhayAmbikAyai's last line: an extra swara in the second cell
  assert.deepEqual(E.cycleGap(row(12, 13, 12, 12), rup, 2), { units: 49, cycle: 12, over: 1, short: 0, cell: 1 });
  assert.deepEqual(E.cycleGap(row(12, 11, 12, 12), rup, 2), { units: 47, cycle: 12, over: 0, short: 1, cell: 1 });
  // half a unit, from a double-speed group one swara out
  assert.equal(E.cycleGap(['S R G [P D N]', 'S , , ,', 'S , , , S , , ,'], adi, 1).over, 0.5);
  // a short line is short of its cycle, however short; every cell on an anga line, but the cycle unfinished
  assert.deepEqual(E.cycleGap(row(5), rup, 2), { units: 5, cycle: 12, over: 0, short: 7, cell: 0 });
  assert.deepEqual(E.cycleGap(row(16, 8), adi, 2), { units: 24, cycle: 16, over: 8, short: 0, cell: null });
  // whole cycles with uneven cells are neither over nor short; nor is anything without a tala or notes
  assert.equal(E.cycleGap(row(9, 7), adi, 2), null);
  assert.equal(E.cycleGap(row(13), null, 2), null);
  assert.equal(E.cycleGap([], adi, 2), null);
  // links, lead-ins, overlap cells and both rows of a split line are short or long on purpose
  const off = { cells: row(13) }, lines = [off, { cells: row(13), link: true }, { cells: row(13), at: 3 }, { cells: row(13), tail: 1 }, { cells: row(13) }, { cells: row(3), join: true }, off];
  assert.deepEqual(lines.map((_, i) => E.offCycle(lines, i, rup, 2) ? i : null).filter(x => x !== null), [0, 6]);
  assert.equal(E.offCycle(lines, 99, rup, 2), null);
});

test('a typed cell: the compact text, the site’s marks, and what is refused', () => {
  const c = t => E.cleanCell(t);
  assert.deepEqual(c("S , R [M G] N. S'"), { text: "S , R [M G] N. S'", units: 6, errors: [] });
  assert.equal(c('s ‘N PNND ; [G M] R’').text, "S N. P N N D , , [G M] R'");
  assert.equal(c('[[S R G M]] P').units, 2);
  assert.equal(c('  ').text, '');
  assert.match(c('S x R').errors[0], /x/);
  assert.match(c('S [ R').errors[0], /\]/);
  assert.match(c('S ] R').errors[0], /\[/);
  assert.match(c('[ ] S').errors[0], /empty/);
  assert.match(c('[[[S]]]').errors[0], /deeper/);
  assert.match(c('‘S’').errors[0], /both/);
  assert.match(c('S ‘').errors[0], /swara after/);
  assert.match(c('S ‘,').errors[0], /karvai/);
  const l = E.cleanLine({ cells: ['S R', '', 'G M'], syl: [[2, 'ma'], [0, 'sa'], [0, ' '], [9, 'far']], label: ' 2 ' });
  assert.deepEqual(l.line.cells, ['S R', 'G M']); assert.equal(l.line.label, '2');
  assert.deepEqual(l.line.syl, [[0, 'sa'], [2, 'ma']]); assert.match(l.errors[0], /far/);
  assert.match(E.cleanLine({ cells: ['', ' '] }).errors[0], /at least one/);
  assert.match(E.cleanLine({}).errors[0], /swaras/);
  assert.match(E.cleanLine({ cells: [7] }).errors[0], /text/);
});

test('corrections laid over a composition: changed, added and removed lines, a moved line and a lost one', () => {
  const comp = { tala: { name: 'Adi', unitsPerBeat: 2 }, sections: [
    { title: 'pallavi', lyrics: [], lines: [{ cells: ['S R G M P D N S', 'S , , ,', 'S , , ,'] }, { cells: ['R , , ,'], link: true }, { cells: ['G G G G G G G G', 'G , , ,', 'G , , ,'], label: '2', fixed: [{ cell: 0, was: 'x', why: [] }] }] },
    { title: 'charanam', lyrics: [], lines: [{ cells: ['P P P P P P P P', 'P , , ,', 'P , , ,'], at: 2 }] }] };
  const text = (c, s) => c.sections[s].lines.map(l => l.cells.join('|'));
  const ed = (id, key, after, x) => Object.assign({ id, key, after, section: +key.split(':')[1] || 0, anchor: null, base: null }, x);
  const base0 = comp.sections[0].lines[0].cells.join(' | '), base1 = comp.sections[0].lines[1].cells.join(' | '), base2 = comp.sections[0].lines[2].cells.join(' | '), base3 = comp.sections[1].lines[0].cells.join(' | ');

  let r = E.applyEdits(comp, []);
  assert.deepEqual(r.lost, []); assert.equal(r.comp.sections[0].lines[1].key, 'b:0:1'); assert.equal(r.comp.sections[0].lines[1].edited, undefined);
  assert.equal(comp.sections[0].lines[0].key, undefined, 'the composition itself is untouched');

  // a change: the latest row of a line wins, and it is marked; the slip's note goes with the old text
  const line = (cells, syl) => ({ cells, syl: syl || [], label: '' });
  r = E.applyEdits(comp, [ed(1, 'b:0:2', line(['M']), { base: base2 }), ed(2, 'b:0:2', line(['M M M M M M M M', 'M , , ,', 'M , , ,'], [[0, 'ma']]), { base: base2 })]);
  let l = r.comp.sections[0].lines[2];
  assert.equal(l.edited, 2); assert.equal(l.cells[0], 'M M M M M M M M'); assert.deepEqual(l.syl, [[0, 'ma']]); assert.equal(l.label, undefined); assert.equal(l.fixed, undefined);

  // the same length keeps the line's place in time; another length lays it out as a line of its own
  r = E.applyEdits(comp, [ed(1, 'b:1:0', line(['M M M M M M M M', 'M , , ,', 'M , , ,']), { section: 1, base: base3 })]);
  assert.equal(r.comp.sections[1].lines[0].at, 2);
  r = E.applyEdits(comp, [ed(1, 'b:1:0', line(['M , , ,']), { section: 1, base: base3 })]);
  assert.equal(r.comp.sections[1].lines[0].at, undefined); assert.equal(r.comp.sections[1].lines[0].link, true);

  // a line put back as imported is no longer marked, and keeps its slip's note
  r = E.applyEdits(comp, [ed(1, 'b:0:2', line(['M']), { base: base2 }), ed(2, 'b:0:2', { cells: comp.sections[0].lines[2].cells, syl: [], label: '2' }, { base: base2 })]);
  assert.equal(r.comp.sections[0].lines[2].edited, undefined); assert.ok(r.comp.sections[0].lines[2].fixed);

  // removed lines go; added lines follow their anchor, in order, even an anchor that has gone
  r = E.applyEdits(comp, [
    ed(1, 'b:0:1', null, { base: base1 }),
    ed(2, 'n:a', line(['D']), { section: 0, anchor: 'b:0:1', base: base1 }),
    ed(3, 'n:b', line(['N']), { section: 0, anchor: 'n:a' }),
    ed(4, 'n:c', line(['S']), { section: 0, anchor: 's' }),
    ed(5, 'n:d', line(['R']), { section: 0, anchor: 'b:0:1', base: base1 }),
    ed(6, 'n:d', null, { section: 0, anchor: 'b:0:1', base: base1 })]);
  assert.deepEqual(text(r.comp, 0), ['S', comp.sections[0].lines[0].cells.join('|'), 'D', 'N', comp.sections[0].lines[2].cells.join('|')]);
  assert.equal(r.comp.sections[0].lines[2].edited, 2); assert.equal(r.comp.sections[0].lines[2].key, 'n:a');

  // a re-import moved the line: the edit finds it by its text; a line that has gone is reported, not guessed at
  const moved = Object.assign({}, comp, { sections: [{ title: 'new', lyrics: [], lines: [{ cells: ['G , , ,'] }] }].concat(comp.sections) });
  r = E.applyEdits(moved, [ed(1, 'b:0:0', line(['M']), { base: base0 }), ed(2, 'b:7:7', line(['M']), { section: 7, base: 'not there any more' })]);
  assert.equal(r.comp.sections[1].lines[0].edited, 1); assert.equal(r.comp.sections[0].lines[0].edited, undefined);
  assert.deepEqual(r.lost.map(e => e.id), [2]);
  // an added line whose anchor has gone stays in its section, at the end
  r = E.applyEdits(comp, [ed(1, 'n:a', line(['D']), { section: 0, anchor: 'b:0:1', base: 'not there any more' })]);
  assert.equal(r.comp.sections[0].lines[3].key, 'n:a');
});

test('every imported composition reads, resolves its pitches and plays on its grid', t => {
  const { ok, done } = checker(t);
  const ix = JSON.parse(readFileSync(join(DATA, 'index.json'), 'utf8'));
  const files = readdirSync(join(DATA, 'c'));
  ok(ix.count === ix.compositions.length && ix.count === files.length, 'index and files: ' + ix.count + ' / ' + files.length);
  ok(ix.count >= 1500, 'the whole site: ' + ix.count);
  ok(/free for anyone/.test(ix.source.terms), 'the site’s terms are kept');
  const ids = new Set(files.map(f => f.replace(/\.json$/, '')));
  let lines = 0, onCycle = 0, playable = 0, tagged = 0;
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
        // v0.9.1: every stored line can be opened in the editor and saved unchanged
        const gap = tl ? E.offCycle(s.lines, li, tl.tala, s.unitsPerBeat || c.tala.unitsPerBeat) : null;
        if (gap) { tagged++; ok((gap.over > 0) !== (gap.short > 0) && gap.over + gap.short < gap.cycle, c.id + ' ' + si + ':' + li + ': over or short, by less than a cycle'); }
        const typed = E.cleanLine({ cells: l.cells, syl: l.syl || [], label: l.label || '' });
        ok(!typed.errors.length && E.sameLine(typed.line, l), c.id + ' ' + si + ':' + li + ': reads back as written: ' + typed.errors[0]);
        (l.fixed || []).forEach(x => ok(typeof l.cells[x.cell] === 'string' && x.was && x.why.length, c.id + ' ' + si + ':' + li + ': a correction says what the site prints'));
      });
      const plan = E.playPlan(s.lines.map(l => Object.assign({ raga }, l)), { tala: tl ? tl.tala : null, unitsPerBeat: s.unitsPerBeat || (c.tala ? c.tala.unitsPerBeat : 1) });
      ok(plan.notes.length > 0 && plan.notes.length <= 4000, c.id + ' ' + si + ': ' + plan.notes.length + ' notes (the render route takes 4000)');
      ok(plan.notes.every(n => Number.isInteger(n.slots) && n.slots >= 1 && n.slots <= 64 * 8), c.id + ' ' + si + ': whole grid cells');
    });
  });
  // the importer reports the rest: slips in the source, sung as written
  ok(onCycle / lines >= 0.9, 'lines on the tala grid: ' + onCycle + ' of ' + lines);
  ok(playable >= 4000, 'playable sections: ' + playable);
  ok(tagged > 0 && tagged / lines < 0.05, 'lines tagged off the cycle: ' + tagged + ' of ' + lines);
  t.diagnostic(lines + ' lines, ' + onCycle + ' on the grid, ' + tagged + ' tagged off the cycle, ' + playable + ' playable sections');
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

test('routes: a singer corrects a line, the log keeps every change, and nothing else moves', async () => {
  const client = () => {
    let cookie = '';
    return async (path, body) => {
      const r = await fetch(base + path, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, cookie ? { Cookie: cookie } : {}), body: JSON.stringify(body || {}) });
      const m = /vg_session=([^;]*)/.exec(r.headers.get('set-cookie') || ''); if (m) cookie = m[1] ? 'vg_session=' + m[1] : '';
      return { status: r.status, body: await r.json() };
    };
  };
  const a = client(), b = client();
  const ix = JSON.parse(readFileSync(join(DATA, 'index.json'), 'utf8'));
  const id = ix.compositions.find(x => x.lines >= 3).id, file = join(DATA, 'c', id + '.json'), bytes = readFileSync(file, 'utf8'), comp = JSON.parse(bytes);
  const si = comp.sections.findIndex(s => s.lines.length >= 2), orig = comp.sections[si].lines[0], key = 'b:' + si + ':0';

  // an account is needed
  assert.equal((await a('/api/repertoire/edits', { comp: id })).status, 401);
  assert.equal((await a('/api/repertoire/changes', {})).status, 401);
  await a('/api/auth/register', { username: 'editor1', password: 'sa ri ga ma pa 1' });
  await b('/api/auth/register', { username: 'editor2', password: 'sa ri ga ma pa 2' });

  // nothing yet; what is refused
  assert.deepEqual((await a('/api/repertoire/edits', { comp: id })).body.edits, []);
  for (const [bad, msg] of [
    [{ comp: '../../package', action: 'edit', key }, /not a composition/],
    [{ comp: 'no-such-piece', action: 'edit', key }, /No composition/],
    [{ comp: id, action: 'rewrite', key }, /edit, add or remove/],
    [{ comp: id, action: 'edit', key: 'b:99:0', line: { cells: ['S'] } }, /not in this composition/],
    [{ comp: id, action: 'edit', key: '../x', line: { cells: ['S'] } }, /not in this composition/],
    [{ comp: id, action: 'edit', key, line: { cells: ['S X'] } }, /not part of the notation/],
    [{ comp: id, action: 'edit', key, line: { cells: [] } }, /at least one/],
    [{ comp: id, action: 'edit', key, line: { cells: orig.cells, syl: orig.syl || [], label: orig.label || '' } }, /Nothing has changed/],
    [{ comp: id, action: 'edit', key, line: { cells: ['S'] }, note: 'x'.repeat(301) }, /300/],
    [{ comp: id, action: 'add', section: 99, line: { cells: ['S'] } }, /section/],
    [{ comp: id, action: 'add', section: si, anchor: 'b:99:0', line: { cells: ['S'] } }, /not in this composition/]
  ]) { const r = await a('/api/repertoire/edits/save', bad); assert.equal(r.status, 400, JSON.stringify(bad).slice(0, 60)); assert.match(r.body.error, msg); }

  // a change: the site's marks are understood, and the log has both versions and why
  let r = await a('/api/repertoire/edits/save', { comp: id, action: 'edit', key, line: { cells: ['S ‘N R’ ,', 'G , , ,'], syl: [[0, 'sa']] }, note: 'My teacher sings it so', expect: 0 });
  assert.equal(r.status, 200);
  const e1 = r.body.edits[0];
  assert.deepEqual(e1.after, { cells: ["S N. R' ,", 'G , , ,'], syl: [[0, 'sa']], label: '' });
  assert.deepEqual(e1.before.cells, orig.cells); assert.equal(e1.action, 'edit'); assert.equal(e1.note, 'My teacher sings it so'); assert.equal(e1.line, 0); assert.match(e1.where, /line 1$/);
  let seen = E.applyEdits(comp, r.body.edits).comp.sections[si].lines[0];
  assert.deepEqual(seen.cells, ["S N. R' ,", 'G , , ,']); assert.equal(seen.edited, e1.id);

  // a page that had not seen this change is stopped, rather than overwriting it
  r = await a('/api/repertoire/edits/save', { comp: id, action: 'edit', key, line: { cells: ['R'] }, expect: 0 });
  assert.equal(r.status, 400); assert.match(r.body.error, /changed somewhere else/);

  // another singer's copy is their own
  assert.deepEqual((await b('/api/repertoire/edits', { comp: id })).body.edits, []);
  assert.deepEqual((await b('/api/repertoire/changes', {})).body.changes, []);
  assert.equal((await b('/api/repertoire/edits/restore', { comp: id, id: e1.id, to: 'before' })).status, 400);

  // add and remove
  r = await a('/api/repertoire/edits/save', { comp: id, action: 'add', section: si, anchor: key, line: { cells: ['D , , ,'] } });
  const added = r.body.edits[1]; assert.match(added.key, /^n:[0-9a-f]+$/); assert.equal(added.before, null); assert.match(added.where, /added line/);
  seen = E.applyEdits(comp, r.body.edits).comp.sections[si].lines;
  assert.equal(seen[1].key, added.key); assert.equal(seen.length, comp.sections[si].lines.length + 1);
  const key2 = 'b:' + si + ':1';
  r = await a('/api/repertoire/edits/save', { comp: id, action: 'remove', key: key2, expect: 0 });
  const removed = r.body.edits[2];
  assert.equal(removed.after, null); assert.deepEqual(removed.before.cells, comp.sections[si].lines[1].cells);
  assert.equal(E.applyEdits(comp, r.body.edits).comp.sections[si].lines.length, comp.sections[si].lines.length);
  assert.match((await a('/api/repertoire/edits/save', { comp: id, action: 'edit', key: key2, line: { cells: ['S'] } })).body.error, /removed/);

  // undo is a new entry; nothing in the log is rewritten
  r = await a('/api/repertoire/edits/restore', { comp: id, id: removed.id, to: 'before', expect: removed.id });
  assert.equal(r.status, 200); assert.equal(r.body.edits.length, 4);
  const back = r.body.edits[3]; assert.equal(back.action, 'restore'); assert.equal(back.revertOf, removed.id); assert.equal(back.before, null);
  assert.deepEqual(r.body.edits[2], removed);
  assert.equal(E.applyEdits(comp, r.body.edits).comp.sections[si].lines[2].edited, undefined, 'back as imported');
  assert.match((await a('/api/repertoire/edits/restore', { comp: id, id: removed.id, to: 'before' })).body.error, /already/);

  // back to the import's line, then to an older version of it
  r = await a('/api/repertoire/edits/restore', { comp: id, id: e1.id, to: 'site', expect: e1.id });
  assert.deepEqual(r.body.edits[4].after.cells, orig.cells);
  r = await a('/api/repertoire/edits/restore', { comp: id, id: e1.id, to: 'after', note: 'After all' });
  assert.deepEqual(r.body.edits[5].after, e1.after); assert.equal(r.body.edits[5].note, 'After all');
  assert.equal((await a('/api/repertoire/edits/restore', { comp: id, id: 999999, to: 'before' })).status, 400);
  assert.equal((await a('/api/repertoire/edits/restore', { comp: id, id: e1.id, to: 'sideways' })).status, 400);
  // an added line taken back
  r = await a('/api/repertoire/edits/restore', { comp: id, id: added.id, to: 'before' });
  assert.equal(r.body.edits[6].after, null);
  assert.equal(E.applyEdits(comp, r.body.edits).comp.sections[si].lines.length, comp.sections[si].lines.length);

  // the log across compositions: newest first, pages, filters, and which row is the latest of its line
  const other = ix.compositions.find(x => x.lines >= 1 && x.id !== id).id;
  await a('/api/repertoire/edits/save', { comp: other, action: 'add', section: JSON.parse(readFileSync(join(DATA, 'c', other + '.json'), 'utf8')).sections.findIndex(s => s.lines.length), line: { cells: ['S'] } });
  r = await a('/api/repertoire/changes', { limit: 3 });
  assert.equal(r.body.changes.length, 3); assert.equal(r.body.more, true);
  assert.equal(r.body.changes[0].comp, other); assert.ok(r.body.changes[0].title); assert.equal(r.body.changes[0].latest, true);
  assert.deepEqual(r.body.comps.map(c => [c.id, c.n]), [[other, 1], [id, 7]]);
  const older = await a('/api/repertoire/changes', { limit: 100, before: r.body.changes[2].id });
  assert.equal(older.body.changes.length, 5); assert.equal(older.body.more, false);
  assert.ok(older.body.changes.every(c => c.id < r.body.changes[2].id));
  assert.equal(older.body.changes.find(c => c.id === e1.id).latest, false);
  assert.equal((await a('/api/repertoire/changes', { comp: other })).body.changes.length, 1);
  assert.deepEqual((await a('/api/repertoire/changes', { comp: id, action: 'restore' })).body.changes.map(c => c.action), ['restore', 'restore', 'restore', 'restore']);
  assert.equal((await a('/api/repertoire/changes', { action: 'nonsense' })).status, 400);

  // the imported notation is never written to
  assert.equal(readFileSync(file, 'utf8'), bytes);

  // deleting the account deletes its corrections
  assert.equal((await a('/api/account/delete', { password: 'sa ri ga ma pa 1' })).status, 200);
  await a('/api/auth/register', { username: 'editor1', password: 'sa ri ga ma pa 1' });
  assert.deepEqual((await a('/api/repertoire/changes', {})).body.comps, []);
});
