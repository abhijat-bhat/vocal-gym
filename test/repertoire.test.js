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
  assert.equal(bhairavi.twin, 'bhairavi');
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

/* v0.9.2: posts written for the test, in the site's markup, for what the first import misread */
const row = (...cells) => '<tr>' + cells.map(c => typeof c === 'string' ? td(span(c)) : td(span(c.t), c.a)).join('') + '</tr>';
const wide = (t, n = 4) => ({ t, a: 'colspan="' + n + '"' });
const post = (name, labels, html) => Object.assign({}, POST, { title: { $t: name }, category: labels.map(term => ({ term })), content: { $t: html } });
const table = (...rows) => '<table><tbody>' + rows.join('') + '</tbody></table>';
const LINE = 'S R G M P D N S', HALF = 'S R G M', FULL = [LINE, HALF, HALF];

test('scale rows in every way the site writes them, and a swara row is not one', () => {
  const lists = t => { const r = scaleRow(t); return r && [r.name, r.aro.join(' '), r.avaro.join(' ')]; };
  // a dash with a space on one side only, or two dashes: the arohana was lost
  assert.deepEqual(lists('AbhEri- S G2 M1 P N2 S’ - S’ N2 D2 P M1 G2 R2 S'), ['AbhEri', "S G2 M1 P N2 S'", "S' N2 D2 P M1 G2 R2 S"]);
  assert.deepEqual(lists('bahudhAri - - S G3 M1 P D2 N2 S’ - S’ N2 P M1 G3 S'), ['bahudhAri', "S G3 M1 P D2 N2 S'", "S' N2 P M1 G3 S"]);
  assert.deepEqual(lists('mukhAri - S R2 M1 P N2 D2 S’- S’ N2 D1 P M1 G2 R2 S'), ['mukhAri', "S R2 M1 P N2 D2 S'", "S' N2 D1 P M1 G2 R2 S"]);
  assert.deepEqual(lists('gowlam - S R1 M1 P N3 S’ - S’N3 P M1 R1 G3 M1 R1 S')[2], "S' N3 P M1 R1 G3 M1 R1 S");
  // the name, and what is said about it
  let r = scaleRow('sarasAngi - 27th mELakartha - S R2 G3 M1 P D1 N3 S’ - S’ N3 D1 P M1 G3 R2 S');
  assert.equal(r.name, 'sarasAngi'); assert.equal(r.note, '27th mELakartha');
  r = scaleRow('CharaNam 1 - bAlakhAndam - nAtakurunji - S R2 G3 M1 N2 D2 N2 P D2 N2 S’ - S’ N2 D2 M1 G3 R2 S');
  assert.equal(r.name, 'nAtakurunji'); assert.equal(r.section, 'CharaNam 1'); assert.equal(r.note, 'bAlakhAndam');
  r = scaleRow('Kharaharapriya Janya (22nd Melakartha) S R2 M1 P N2 S’ - S’ N2 P M1 R2 S');
  assert.equal(r.aro.join(' '), "S R2 M1 P N2 S'"); assert.equal(r.avaro.join(' '), "S' N2 P M1 R2 S");
  assert.equal(scaleRow('3. gaurI - S R1 M1 P N3 S’ - S’ N3 P M1 G3 R1 S').name, 'gaurI');
  // typing slips, each kept with the scale
  const slip = (t, aro, avaro) => { const x = scaleRow(t); assert.equal(x.aro.join(' '), aro, t); assert.equal(x.avaro.join(' '), avaro, t); assert.equal(x.was, t); };
  slip('v - S R1 G3 M1 D1 N2 S’ - S’ N2 D1 M1 P M1 F3 R1 S', "S R1 G3 M1 D1 N2 S'", "S' N2 D1 M1 P M1 G3 R1 S");
  slip('v - S R3 G3 M1 P D3 N3 S’ - S’ N# P M1 G3 M1 R3 S', "S R3 G3 M1 P D3 N3 S'", "S' N3 P M1 G3 M1 R3 S");
  slip('v - S R1 G3 M2 P Nn3 S’ - S’ N3 P M2 G3 R1 S', "S R1 G3 M2 P N3 S'", "S' N3 P M2 G3 R1 S");
  slip('v - S R2 M1 P N2 S’ - S’ N2 P1 M1 R2 G2 R2 S', "S R2 M1 P N2 S'", "S' N2 P M1 R2 G2 R2 S");
  slip('v - S 12 M1 P D2 N2 S’ - S’ D2 P M1 R1 S', "S R1 M1 P D2 N2 S'", "S' D2 P M1 R1 S");
  slip('v - S R1 G2 P D1 S - Av: S D1 P G2 R1 S', "S R1 G2 P D1 S'", "S' D1 P G2 R1 S");
  slip('v - S R2 G2 M1 P D2 N2 S’ - S’ N2 D1 P G2 R2 ‘S', "S R2 G2 M1 P D2 N2 S'", "S' N2 D1 P G2 R2 S");
  slip('v - S G2 M1 D2 N3 S’ - S’ N3 D2 P M1 G2 S’', "S G2 M1 D2 N3 S'", "S' N3 D2 P M1 G2 S");
  // a descending scale printed without digits takes them from the arohana (N2, not the common N3)
  slip('v - S R1 G3 M1 P D1 N2 S’ - S’ N D P M G R S (14th Melakartha)', "S R1 G3 M1 P D1 N2 S'", "S' N2 D1 P M1 G3 R1 S");
  // a scale with no slip says nothing more
  assert.deepEqual(Object.keys(scaleRow('kalyANi - S R2 G3 M2 P D2 N3 S’ - S’ N3 D2 P M2 G3 R2 S')), ['name', 'aro', 'avaro', 'note']);
  // swara rows with digits are not scales
  ['M2 P M2 P D N2 , D', 'P , D1 , D1 P P M', 'S’ , N M1 G P’ M1’ R’ , , S’ , N D , P', 'R1, G1', 'R2 M P R2 M ,', 'pallavi - vanajAkshi ninnE kori'].forEach(t => assert.equal(scaleRow(t), null, t));
});

test('a post in page order: scales and lyrics outside the tables, and each line sung in the raga above it', () => {
  // printed above the table, with a note on its mela and the words; links are left out
  let p = parsePost(post('g - Abheri - Adi - X', ['Geetham', 'Abheri'], '<p>' + span('Abheri - S G2 M1 P N2 S’ - S’ N2 D2 P M1 G2 R2 S') + '</p><p>20th Mela Natabhairavi Janya</p>' +
    '<p>garuda gamana sathya bhAshaNa vibheeshaNa pOshaku rEy rEy</p><p>chathushruthi rishabha sAdhAraNa gAndhAra kaishiki swara ithara shuddha</p><p>Listen at https://www.youtube.com/watch?v=x</p><p>Please share lyrics if you have them.</p>' + table(row(...FULL))));
  assert.equal(p.ragas.length, 1); assert.equal(p.ragas[0].aro.join(' '), "S G2 M1 P N2 S'"); assert.match(p.ragas[0].note, /Natabhairavi/);
  assert.equal(p.sections[0].title, 'Lyrics'); assert.equal(p.sections[0].lyrics.length, 2); assert.equal(p.sections[0].lines.length, 0);
  assert.equal(p.sections[1].lines.length, 1); assert.equal(p.sections[1].raga, 0);
  assert.ok(!JSON.stringify(p.sections).includes('youtube')); assert.ok(!JSON.stringify(p.sections).includes('share'));
  // a section's name printed outside the table goes with the table after it; a short remark is a note
  p = parsePost(post('j - Neelambari - Adi - X', ['Neelambari'], '<p>Pallavi</p>' + table(row(...FULL)) + '<p>Charanam</p>' + table(row(...FULL)) + '<p>Tuned by a singer</p>'));
  assert.deepEqual(p.sections.map(s => [s.title, s.lines.length]), [['Pallavi', 1], ['Charanam', 1], ['Notes', 0]]);

  // a ragamalika: a scale row after lines starts a new section in that raga
  const A = 'mAyA - S R1 G3 M1 P D1 N3 S’ - S’ N3 D1 P M1 G3 R1 S', B = 'mOhanam - S R2 G3 P D2 S’ - S’ D2 P G3 R2 S', C = 'hindhoLam - S G2 M1 D1 N2 S’ - S’ N2 D1 M1 G2 S';
  p = parsePost(post('n - rAgamAlika - Adi', ['Ragamalika'], table(row(wide(A, 3)), row(...FULL), row(wide(B, 3)), row(...FULL), row(...FULL), row(wide(C, 3)), row(...FULL))));
  assert.deepEqual(p.sections.map(s => [s.title, s.raga, s.lines.length]), [['', 0, 1], ['mOhanam', 1, 2], ['hindhoLam', 2, 1]]);
  assert.equal(p.ragamalika, true); assert.equal(p.raga, 'mAyA');
  // a scale row in a narrow cell, under swaras and over a label column, is still a scale and not syllables
  p = parsePost(post('n - rAgamAlika - Adi', ['Ragamalika'], table(row(wide(A, 4)), row('1', ...FULL), row('2', wide(B, 3)), row('3', ...FULL))));
  assert.deepEqual(p.sections.flatMap(s => s.lines.map(l => [s.raga, l.syl])), [[0, undefined], [1, undefined]]);
  // scales listed together, then named: a line of a heading, a title, brackets, or first in the words
  p = parsePost(post('n - rAgamAlika - Adi', ['Ragamalika'], table(
    row(wide(A + '</span></p><p>' + span(B) + '</p><p>' + span(C))),
    row(wide('pallavi - words one')), row(...FULL),
    row(wide('anupallavi (mOhanam) - words two')), row(...FULL),
    row(wide('hindhoLam')), row(...FULL),
    row(wide('charaNam 4 - mOhanam - words three')), row(...FULL))));
  assert.deepEqual(p.sections.filter(s => s.lines.length).map(s => s.raga), [0, 1, 2, 1]);
  // a raga named beside swara rows, in a post with no scale: a section of its own, with a borrowed scale later
  p = parsePost(post('a - rAgamAlika - Adi', ['Ragamalika'], table(row(wide('pallavi - words')), row('Arabhi', ...FULL), row('Mohanam', ...FULL), row(...FULL))));
  assert.deepEqual(p.sections.filter(s => s.lines.length).map(s => [s.title, s.lines.length]), [['pallavi', 1], ['Mohanam', 2]]);
  assert.deepEqual(p.ragas.map(r => r.name), ['Arabhi', 'Mohanam']);
  // a tala word is not a raga
  p = parsePost(post('a - Kalyani - Adi', ['Kalyani'], table(row('sankeerNa', ...FULL))));
  assert.deepEqual(p.ragas, []);
});

test('rows the first import dropped or misread: first cells, notes beside swaras, headings under swaras, letters for swaras', () => {
  // swaras in a label column stay swaras, and their sahitya stays under them
  let p = parsePost(post('j - Hemavathi - Adi', ['Hemavathi'], table(row('S’ , , , S’ , N D P , , , M G , ,', ...FULL.slice(1)), row('1', ...FULL), row('2', ...FULL))));
  const lines = p.sections[0].lines;
  assert.equal(lines.length, 3); assert.equal(lines[0].cells[0], "S' , , , S' , N D P , , , M G , ,"); assert.equal(lines[0].label, undefined);
  assert.equal(lines[1].label, '1'); assert.equal(lines[2].cells.length, 3);
  // a note beside swaras keeps the row, and goes with it
  p = parsePost(post('n - nalinakAnthi - Nottuswaram', ['Nottuswaram'], table(row(...FULL, '2 times'), row(...FULL), row(...FULL, 'Repeat the anupallavi twice'))));
  assert.deepEqual(p.sections[0].lines.map(l => [l.cells.length, l.note]), [[3, '2 times'], [3, undefined], [3, 'Repeat the anupallavi twice']]);
  // a heading in a narrow cell under swaras is a heading, not syllables; words really under swaras stay sahitya
  p = parsePost(post('k - Adi', ['Krithi'], table(row(...FULL, ''), row({ t: 'Charanam - its words here', a: 'colspan="2"' }, '', ''), row(...FULL, ''), row('sa ri', '', '', ''))));
  assert.deepEqual(p.sections.map(s => [s.title, s.lines.length]), [['', 1], ['Charanam', 1]]);
  assert.equal(p.sections[0].lines[0].syl, undefined); assert.deepEqual(p.sections[1].lyrics, ['its words here']);
  assert.deepEqual(p.sections[1].lines[0].syl.map(x => x[1]), ['sa', 'ri']);
  // lyrics before any section are kept
  p = parsePost(post('k - Adi', ['Krithi'], table(row(wide('Nagumomu Galavaani', 2), wide('ನಗುಮೋಮು', 2)), row(...FULL))));
  assert.deepEqual(p.sections[0].lyrics, ['Nagumomu Galavaani', 'ನಗುಮೋಮು']);
  // a letter that is no swara, read as the key beside it, if the raga has that swara; the row says what the site prints
  const M = 'madhyamAvathi - S R2 M1 P N2 S’ - S’ N2 P M1 R2 S';
  p = parsePost(post('k - madhyamAvathi - Adi', ['madhyamAvathi'], table(row(wide(M, 3)), row(LINE, HALF, 'N , P , E , E ,'))));
  assert.equal(p.sections[0].lines[0].cells[2], 'N , P , R , R ,');
  assert.deepEqual(p.sections[0].lines[0].fixed, [{ cell: 2, was: 'N , P , E , E ,', why: ['letter'] }]);
  // not when the raga lacks it (F would be G, which Madhyamavathi does not have); the row is then left as it was
  p = parsePost(post('k - madhyamAvathi - Adi', ['madhyamAvathi'], table(row(wide(M, 3)), row(LINE, HALF, 'S , R , M , F ,'))));
  assert.equal(p.sections[0].lines.length, 0);
  // syllables with commas are still syllables
  const H = 'hamsadhwani - S R2 G3 P N3 S’ - S’ N3 P G3 R2 S';
  p = parsePost(post('k - hamsadhwani - Adi', ['hamsadhwani'], table(row(wide(H, 3)), row(...FULL), row(', , ha , ri , , ,', '', ''))));
  assert.deepEqual(p.sections[0].lines[0].syl.map(x => x[1]), [',', ',', 'ha', ',', 'ri', ',', ',', ',']);
  // a stray syllable before a swara
  assert.equal(parsePost(post('k - hamsadhwani - Adi', ['hamsadhwani'], table(row(wide(H, 3)), row('P , P thaP R , , S', HALF, HALF)))).sections[0].lines[0].cells[0], 'P , P P R , , S');
});

test('the raga’s name comes from the title when the scale row does not give it', () => {
  const S = n => n + ' - S R2 M1 P N2 S’ - S’ N2 P M1 R2 S';
  const name = (title, labels, scale) => parsePost(post(title, labels, table(...(scale ? [row(wide(scale, 3))] : []), row(...FULL)))).raga;
  assert.equal(name('Thiruppavai - 01 - Margazhi ThingaL - Nattai - Adi - AnDaL', ['Thiruppavai', 'Nattai', 'AnDaL']), 'Nattai');
  assert.equal(name('Nagumomu - Madhyamavathi - Adi - Thyagaraja', ['Madhyamavathi', 'Thyagaraja'], S('Kharaharapriya Janya')), 'Madhyamavathi');
  assert.equal(name('alai pAyudhE - kAnada - Adi - X', ['Kaanada', 'X'], 'S R2 G2 M1 P D2 N2 S’ - S’ N2 P M1 G2 M1 R2 S'), 'Kaanada');
  assert.equal(name('neekEla - sarasAngi - khanda chApu - X', ['SarasAngi', 'X'], 'sarasAngi - 27th mELakartha - S R2 G3 M1 P D1 N3 S’ - S’ N3 D1 P M1 G3 R2 S'), 'SarasAngi');
  assert.equal(name('hoova - AbhEri - KhandaChapu - X', ['AbhEri', 'X'], 'AbhEri- S G2 M1 P N2 S’ - S’ N2 D2 P M1 G2 R2 S'), 'AbhEri');
  assert.equal(name('Kalyani - 2 - Jathiswara - Adi', ['Jathiswara', 'Kalyani']), 'Kalyani');
  // a nottuswaram's raga is the last part of its title, after the composer
  assert.equal(name('hE mAyE! - Nottuswaram - Muthuswami Dikshitar - Thisra Eka - ShankharAbharaNam', ['Nottuswaram', 'MuthuswamiDikshithar', 'ShankharAbharaNam']), 'ShankharAbharaNam');
  // not the composition's name, nor a number, a kind of piece or a tala
  assert.equal(name('Alankaras', ['Basics']), '');
  // a ragamalika with no scale printed says so
  assert.equal(name('lalitha - rAgamalika - Adi - X', ['Ragamalika', 'X']), 'Ragamalika');
});

test('sustains as a singer writes them: , for one unit and ; for two', () => {
  const T = E.sustainText;
  assert.equal(T('P , , ,'), 'P, ;');      // the singer's own example
  assert.equal(T('P ,'), 'P,'); assert.equal(T('P , ,'), 'P;'); assert.equal(T('P , , , ,'), 'P; ;'); assert.equal(T('P , , , , ,'), 'P, ; ;');
  assert.equal(T(', , ,'), ', ;'); assert.equal(T(', ,'), ';'); assert.equal(T(','), ',');
  assert.equal(T("S' , , , N. , , R"), "S', ; N.; R");
  assert.equal(T('[S , , R] P , , ,'), '[S; R] P, ;');
  assert.equal(T('[P N] , ,'), '[P N] ;');
  assert.equal(T('S R G M'), 'S R G M'); assert.equal(T(''), '');
  // it reads back as the same notes
  ['P , , ,', '[S , , R] P , , ,', "S' , , , N. , ,", ', , , S', '[[S , R ,]] ,'].forEach(c => assert.equal(E.cleanCell(T(c)).text, c));
  // on the grid: a ; never crosses a beat line or a syllable, and every token is drawn once
  const lay = (c, b) => E.sustainLayout(E.parseCell(c), 0, b).map(x => [x.from, x.units, x.parts.map(p => p.text || E.parseCell(c)[p.toks[0]].s).join('')]);
  assert.deepEqual(lay('P , , , R , , ,', u => u % 4 === 0), [[0, 2, 'P,'], [2, 2, ';'], [4, 2, 'R,'], [6, 2, ';']]);
  assert.deepEqual(lay('R S , , , M', u => u % 4 === 0), [[0, 1, 'R'], [1, 3, 'S;'], [4, 1, ','], [5, 1, 'M']]);
  assert.deepEqual(lay('S , , ,', u => u === 2), [[0, 2, 'S,'], [2, 2, ';']]);
  assert.deepEqual(lay('S , , ,', u => u === 1), [[0, 1, 'S'], [1, 1, ','], [2, 2, ';']]);
  assert.deepEqual(lay(', , , , S', () => false), [[0, 2, ';'], [2, 2, ';'], [4, 1, 'S']]);
  // inside a double-speed group, within the unit it shares
  assert.deepEqual(lay('[S , , , R , , ,] P', () => false), [[0, 1, 'S,'], [1, 1, ';'], [2, 1, 'R,'], [3, 1, ';'], [4, 1, 'P']]);
  // two commas a part: one mark lights for both
  const parts = E.sustainLayout(E.parseCell('P , , ,'), 0).flatMap(x => x.parts.map(p => p.toks));
  assert.deepEqual(parts, [[0], [1], [2, 3]]);
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
    ok(c.source ? c.source.name && c.source.author : /^https:\/\/carnaticnotations\.blogspot\.com\//.test(c.url), c.id + ': where it comes from');
    const tl = c.tala && E.talaOf(c.tala.name);
    ok(!c.tala || tl, c.id + ': tala ' + (c.tala && c.tala.name));
    const ragas = c.ragas.map(E.ragaOf);
    // v0.9.2: a scale runs up, then down; a name is a name
    c.ragas.forEach(r => {
      ok(r.aro.length && r.avaro.length, c.id + ': a scale with both lists: ' + r.name);
      ok(!/^S'/.test(r.aro[0]), c.id + ': an arohana that starts at the top: ' + r.aro.join(' '));
      ok(!/[-–]\s|\s[-–]|[RGMDN][1-3]/.test(r.name), c.id + ': a raga’s name, not a row: ' + r.name);
    });
    ok(!/^\d+$/.test(c.raga) && !/[RGMDN][1-3]/.test(c.raga) && !/\bjanya$/i.test(c.raga), c.id + ': the raga’s name: ' + c.raga);
    ok(!c.ragas.length || c.sections.every(s => !s.lines.length || (s.raga != null && c.ragas[s.raga])), c.id + ': each section with lines has its raga');
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
        // v0.9.2: its sustains read back as the same notes, and the grid draws every token once
        l.cells.forEach(cell => {
          ok(E.cleanCell(E.sustainText(cell)).text === cell, c.id + ' ' + si + ':' + li + ': sustains read back: ' + cell);
          const toks = E.parseCell(cell), drawn = E.sustainLayout(toks, 0, u => u % 2 === 0).flatMap(x => x.parts.flatMap(p => p.toks));
          ok(drawn.length === toks.length && drawn.every((v, i) => v === i), c.id + ' ' + si + ':' + li + ': the grid draws every token: ' + cell);
        });
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

  // v0.9.5 the raga's swaras, on the server too: refused by the raga, kept if the line already has them
  const bhId = readdirSync(new URL('../data/repertoire/c/', import.meta.url)).map(n => JSON.parse(readFileSync(new URL('../data/repertoire/c/' + n, import.meta.url), 'utf8'))).find(c => /^bhairavi$/i.test(c.raga) && !c.ragamalika && c.ragas[0].aro.includes('D2') && c.sections.some(s => s.lines.length));
  const bhSi = bhId.sections.findIndex(s => s.lines.length), bhKey = 'b:' + bhSi + ':0';
  r = await a('/api/repertoire/edits/save', { comp: bhId.id, action: 'edit', key: bhKey, line: { cells: ['R1 S , ,'] } });
  assert.equal(r.status, 400); assert.match(r.body.error, /R1 is not in/);
  r = await a('/api/repertoire/edits/save', { comp: bhId.id, action: 'edit', key: bhKey, line: { cells: ["D2''' S.... N2 ,"] } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  // v0.9.5 correct as written: remembered by the line and the fix, asked again on request, nothing in the notation changes
  r = await a('/api/repertoire/edits', { comp: id });
  assert.deepEqual(r.body.octaveOk, []);
  const was = r.body.edits.length;
  r = await a('/api/repertoire/octave-ok', { comp: id, line: ["R' S S' ,"], fix: ["R' S' S' ,"] });
  assert.equal(r.status, 200); assert.deepEqual(r.body.octaveOk, [{ line: "R' S S' ,", fix: "R' S' S' ," }]);
  r = await a('/api/repertoire/octave-ok', { comp: id, line: ["R' S S' ,"], fix: ["R' S' S' ,"] });
  assert.equal(r.body.octaveOk.length, 1, 'marking it twice is one mark');
  r = await a('/api/repertoire/edits', { comp: id });
  assert.equal(r.body.edits.length, was, 'it is no change to the notation'); assert.equal(r.body.octaveOk.length, 1);
  assert.equal((await a('/api/repertoire/octave-ok', { comp: id, line: ['X'], fix: ['S'] })).status, 400);
  assert.equal((await a('/api/repertoire/octave-ok', { comp: 'no-such', line: ['S'], fix: ['S'] })).status, 400);
  r = await a('/api/repertoire/octave-ask', { comp: id, line: ["R' S S' ,"], fix: ["R' S' S' ,"] });
  assert.deepEqual(r.body.octaveOk, []);
  await a('/api/repertoire/octave-ok', { comp: id, line: ["R' S S' ,"], fix: ["R' S' S' ,"] });
  // deleting the account deletes its corrections
  assert.equal((await a('/api/account/delete', { password: 'sa ri ga ma pa 1' })).status, 200);
  await a('/api/auth/register', { username: 'editor1', password: 'sa ri ga ma pa 1' });
  assert.deepEqual((await a('/api/repertoire/changes', {})).body.comps, []);
  assert.deepEqual((await a('/api/repertoire/edits', { comp: id })).body.octaveOk, []);
});

/* v0.9.5 octave checks, the rules of a correction, and the slip a singer confirmed */
test('withOctave rewrites one token, counting karvais, and nothing else', () => {
  assert.equal(E.withOctave("[S' , R' S] S' ,", 3, 1), "[S' , R' S'] S' ,");
  assert.equal(E.withOctave('R2. G', 0, 1), "R2' G");
  assert.equal(E.withOctave("S' R", 0, 0), 'S R');
  assert.equal(E.withOctave('S R', 1, -2), 'S R..');
});
test('octave checks: a spike, a run read differently, and what they leave alone', () => {
  const one = (...rows) => E.octaveChecks([{ lines: rows.map(cells => ({ cells })) }])[0];
  // the singer's example: the fix, what it changes, and the same units
  const [x] = one(["[S' , R' S] S' ,"])[0];
  assert.deepEqual(x.changes, [{ cell: 0, tok: 3, was: 'S', now: "S'" }]);
  assert.deepEqual(x.checks, ['spike']); assert.deepEqual(x.cells, ["[S' , R' S'] S' ,"]);
  // taken, nothing is left to ask
  assert.deepEqual(one(x.cells)[0], []);
  // a swara and its own octave is on purpose; steps are no question; a fix stays in the piece's range
  assert.deepEqual(one(["S S' S R"])[0], []);
  assert.deepEqual(one(['S R G M P'])[0], []);
  assert.deepEqual(one(['S R S D S'])[0], [], 'no lower D anywhere in the piece, so no lower D offered');
  assert.equal(one(['S R S D S', 'D. S R G'])[0].length, 1, 'with one elsewhere, it is offered');
  // a run with a mark left off: its notes keep their steps, so only the rest of the piece shows it
  const run = "S' N D P M G", [a, b, c] = one([run], [run], ['S N D P M G']);
  assert.deepEqual([a, b], [[], []]);
  assert.deepEqual(c[0].changes, [{ cell: 0, tok: 0, was: 'S', now: "S'" }]);
  assert.deepEqual(c[0].checks, ['piece']); assert.equal(c[0].usually, run); assert.equal(c[0].times, 2);
  // both checks agreeing say so
  const both = one(["N S' R' S N D"], ["N S' R' S N D"], ["N S' R' S' N D"], ["N S' R' S' N D"], ["N S' R' S' N D"], ["N S' R' S' N D"], ["N S' R' S' N D"]);
  assert.deepEqual(both[0][0].checks.slice().sort(), ['piece', 'spike']);
});
test('every suggestion in the repertoire only moves octaves, inside what the line already was', () => {
  const clean = new Set();
  const dir = new URL('../data/repertoire/c/', import.meta.url);
  readdirSync(dir).map(n => JSON.parse(readFileSync(new URL(n, dir), 'utf8'))).forEach(c => E.octaveChecks(c.sections).forEach((ls, si) => ls.forEach((found, li) => found.forEach(x => {
    const was = c.sections[si].lines[li].cells, at = c.id + ' ' + si + ':' + li;
    assert.equal(E.lineUnits(x.cells), E.lineUnits(was), at + ': the same units');
    const bare = cs => cs.map(z => E.parseCell(z).map(t => t.s + t.v).join(' ')).join('|');
    assert.equal(bare(x.cells), bare(was), at + ': the same swaras');
    assert.ok(x.changes.length >= 1 && x.changes.length <= 3, at);
    assert.notEqual(x.cells.join('|'), was.join('|'), at + ': it changes something');
    assert.deepEqual(E.cleanLine({ cells: x.cells }).errors, [], at + ': a line the server takes');
    clean.add(c.id);
  }))));
  assert.ok(clean.size > 100);
});
test('the rules of a correction: what cannot be sung is refused, in words', () => {
  const err = t => E.cleanCell(t).errors.join(' ');
  assert.match(err('S2'), /S has no variants/);
  assert.match(err('P1'), /P has no variants/);
  assert.match(err('M3'), /M1, M2/);
  assert.match(err('R4'), /R1, R2, R3/);
  assert.match(err("R'2"), /before the octave mark/);
  assert.match(err('.N'), /after its swara/);
  // as many octaves as a singer needs, past any instrument only by mistake
  assert.deepEqual(E.cleanCell("S''' N... R2'''' G3....").errors, []);
  assert.equal(E.parseCell("S''' N...")[0].o, 3); assert.equal(E.parseCell("S''' N...")[1].o, -3);
  assert.match(err("S'''''"), /4 octaves at most/);
  assert.match(err('N.....'), /4 octaves at most/);
  assert.equal(E.cleanCell("R2' G3. M2 N1 S'' N..").errors.length, 0);
  assert.equal(E.cleanCell("R2' G3. M2 N1 S'' N..").text, "R2' G3. M2 N1 S'' N..");
  // every error is listed, not only the first
  assert.equal(E.cleanLine({ cells: ['S2', 'M3'] }).errors.length, 2);
});
test('notesOutside: swaras a raga does not have', () => {
  const mohanam = { aro: ['S', 'R2', 'G3', 'P', 'D2', "S'"], avaro: ["S'", 'D2', 'P', 'G3', 'R2', 'S'] };
  assert.deepEqual(E.notesOutside(['S R G P D'], mohanam), []);
  assert.deepEqual(E.notesOutside(['S M R1 N'], mohanam), ['M', 'R1', 'N']);
  assert.deepEqual(E.notesOutside(['S M'], null), []);
  // anya swaras, and a letter whose variant the scale does not say
  assert.deepEqual(E.notesOutside(['S M N3'], Object.assign({ also: ['M', 'N3'] }, mohanam)), []);
  assert.deepEqual(E.notesOutside(['M1 M2'], Object.assign({ also: ['M'] }, mohanam)), []);
  assert.deepEqual(E.notesOutside(['N2'], Object.assign({ also: ['N3'] }, mohanam)), ['N2']);
  // what the line already has may stay
  assert.deepEqual(E.notesOutside(['S M N'], mohanam, ['M S']), ['N']);
  assert.deepEqual(E.allowedNotes(Object.assign({ also: ['N3'] }, mohanam)), ['S', 'R2', 'G3', 'P', 'D2', 'N3']);
  assert.deepEqual(E.allowedNotes(null), []);
});
test('a raga allows its own swaras and its anya swaras, and refuses the rest', () => {
  const dir = new URL('../data/repertoire/c/', import.meta.url);
  const all = readdirSync(dir).map(n => JSON.parse(readFileSync(new URL(n, dir), 'utf8')));
  const scaleOf = (c, s) => c.ragas[s.raga != null && c.ragas[s.raga] ? s.raga : 0];
  const line = (scale, cell) => E.cleanLine({ cells: [cell] }, { scale }).errors.join(' ');
  // Bhairavi, a bhashanga raga: D2 as well as D1, every variant its scale has, and no other
  const bh = all.find(c => /^bhairavi$/i.test(c.raga) && c.ragas[0].aro.includes('D2') && c.ragas[0].avaro.includes('D1')).ragas[0];
  assert.equal(line(bh, 'D2 D1 R2 G2 M1 P N2 S'), '');
  assert.match(line(bh, 'R1'), /R1 is not in .*which has S R2/i);
  assert.match(line(bh, 'S M2 N3'), /M2, N3 are not in/);
  // an anya swara the raga is written with, though its own post does not print it
  const k = all.find(c => !c.ragamalika && c.ragas[0] && /^khamas$/i.test(c.ragas[0].name) && !c.ragas[0].aro.concat(c.ragas[0].avaro).includes('N3')).ragas[0];
  assert.ok(k.also.includes('N3'), JSON.stringify(k));
  assert.equal(line(k, 'N3 N2'), '');
  assert.match(line(k, 'N1'), /N1 is not in/);
  // without the raga, as before; a stored line is never refused, so any of them can be corrected
  assert.equal(E.cleanLine({ cells: ['R1 G1 N1'] }).errors.length, 0);
  let lines = 0;
  all.forEach(c => c.sections.forEach((s, si) => s.lines.forEach((l, li) => { lines++; assert.deepEqual(E.notesOutside(l.cells, scaleOf(c, s)), [], c.id + ' ' + si + ':' + li); })));
  assert.ok(lines > 20000);
});
test('Mahaganapathim: the slip a singer confirmed is corrected, and shows what the site printed', () => {
  const c = JSON.parse(readFileSync(new URL('../data/repertoire/c/2021-08-mahaganapathim-nattai-adi.json', import.meta.url), 'utf8'));
  const l = c.sections[1].lines[2];
  assert.deepEqual(l.cells.slice(1), ["[S' , R' S'] S' , [S' , R' S'] S' ,", "[S' , R' S'] S' , [S' , R' S'] S' ,"]);
  assert.deepEqual(l.fixed, [{ cell: 1, was: "[S' , R' S] S' , [S' , R' S] S' ,", why: ['confirmed'] }, { cell: 2, was: "[S' , R' S] S' , [S' , R' S] S' ,", why: ['confirmed'] }]);
  assert.ok(!c.sections.flatMap(s => s.lines).some(x => x.cells.some(y => y.includes("R' S]"))));
  assert.deepEqual(E.octaveChecks(c.sections)[1][2], []);
});
test('docs/octave-review.md is the list the checks give', async () => {
  const { REVIEW, reviewText, summary } = await import('../scripts/octave-review.js');
  assert.equal(readFileSync(REVIEW, 'utf8').replace(/\r\n/g, '\n'), reviewText(), 'run node scripts/octave-review.js');
  const S = summary();
  assert.equal(S.tiers.reduce((n, t) => n + t.n, 0), S.flags);
  assert.ok(S.tiers[0].n > 0);
});
