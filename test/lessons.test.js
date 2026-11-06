/* v0.9.3 the Gurukulam geetham notes in the repertoire: the book as read (scripts/lessons-extract.py, data/lessons/), the measures
   that choose between versions of a lesson, the decisions they reach, and what the repertoire ends up with. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { E } from './helpers.js';
import { gurukulamPieces, measure, rank, overlaps, choose, compose } from '../scripts/lessons.js';
import { STATUS, withStats, summarize } from '../scripts/repertoire-stats.js';

const DATA = fileURLToPath(new URL('../data/repertoire/', import.meta.url));
const G = gurukulamPieces();
const byId = (list, id) => list.find(c => c.id.endsWith(id));
const stored = readdirSync(join(DATA, 'c')).map(f => JSON.parse(readFileSync(join(DATA, 'c', f), 'utf8')));
const repo = id => stored.find(c => c.id.endsWith(id));

test('Gurukulam: all 31 geethams read from vector shapes, and every row fills its tala', () => {
  assert.equal(G.length, 31);
  G.forEach(c => {
    const m = measure(c), t = E.talaOf(c.tala.name);
    assert.ok(m.lines >= 6, c.id + ': ' + m.lines + ' lines');
    assert.equal(m.fit, 1, c.id);
    assert.ok(m.raga >= .97, c.id + ': swaras in the raga ' + m.raga);
    assert.ok(m.sahitya >= .8, c.id + ': the sahitya under its swaras ' + m.sahitya);
    c.ragas.forEach(r => assert.ok(E.ragaOf(r), c.id));
  });
  const l = byId(G, 'lambodara-malahari').sections[0].lines[0];
  assert.deepEqual(l.cells, ['M P', "D S' S' R'", "R' S'", 'D P M P']);
  assert.deepEqual(l.syl.slice(0, 4).map(x => x[1]), ['Sree', 'ga', 'Na', 'nA']);
  // this book numbers G and N by the twelve notes; the scales are in the usual names, and keep what it prints
  const s = byId(G, 'kunda-gaura-malahari').ragas[0];
  assert.deepEqual(s.avaro, ["S'", 'D1', 'P', 'M1', 'G3', 'R1', 'S']); assert.match(s.was, /G2/);
  assert.equal(byId(G, 'kamalajadala-kalyani').ragas[0].was, undefined);
  assert.deepEqual(byId(G, 'ganavidya-durandhara-nata').ragas[0].avaro, ["S'", 'N3', 'P', 'M1', 'R3', 'S']);
  // the book's slips: Pa typed for P, a lower-case p, a dash for a karvai
  const him = byId(G, 'sri-himachala-suthe-nata').sections[0].lines;
  assert.ok(him.some(x => x.fixed && x.fixed[0].why.includes('letter')));
  assert.ok(him.flatMap(x => x.cells).every(c => /^[SRGMPDN'., ]+$/.test(c)));
});

test('the measures: tala, raga, octave, how much, and what the others confirm', () => {
  const scale = { name: 'x', aro: ['S', 'R2', 'G3', 'M1', 'P', 'D2', 'N3', "S'"], avaro: ["S'", 'N3', 'D2', 'P', 'M1', 'G3', 'R2', 'S'] };
  const make = (lines, r = scale) => compose({ key: 't', source: 'gurukulam', name: 't', type: 'Geetham', raga: 'x', ragas: [r], tala: 'Adi', sections: [{ lines: lines.map(cells => ({ cells })) }], pages: [1, 1] });
  const good = ['S R G M', 'P D', "N S'"], up = ["S' N D P", 'M G', 'R S'];
  assert.equal(measure(make([good, up])).fit, 1);
  assert.equal(measure(make([['S R G M', 'P D', 'N S N']])).fit, 0);    // nine units in a cycle of eight
  // a swara the raga does not have
  assert.ok(measure(make([good], { name: 'x', aro: ['S', 'R2', 'G3', 'P', 'D2', "S'"], avaro: ["S'", 'D2', 'P', 'G3', 'R2', 'S'] })).raga < 1);
  // a leap an octave mark should explain; between lines an exercise may start anywhere
  assert.ok(measure(make([['S R G M', "P' D", 'N S']])).octave < 1);
  assert.equal(measure(make([good, ["S' N D P", 'M G', 'R S']])).octave, 1);
  // only another source shows a mark left off: both fill the tala, the odd one out agrees less
  const A = make([good, up, good, up]), B = make([good, up, good, up]), C = make([['S R G M', 'P D', 'N S'], up, ['S R G M', 'P D', 'N S'], up]);
  const r = rank([C, A, B]);
  assert.ok(r[r.length - 1].c === C, 'the version with the wrong octave ranks last');
  assert.ok(r.find(x => x.c === C).agree < r.find(x => x.c === A).agree);
});

test('overlaps are found by the swaras, whatever the titles say', () => {
  const O = overlaps(G, stored.filter(c => !c.source));
  const hit = id => O.find(x => x.p.id.endsWith(id)).hits.map(h => h.id);
  assert.ok(stored.length > 1500);
  // the lessons are merged already, so look only at those the site still has under its own notation
  assert.ok(hit('vande-madhavam-varali').some(i => i.endsWith('vandhe-madhavam-varali-geetham')));
  assert.ok(hit('sri-lola-sritapala-malayamarutam').some(i => i.endsWith('malayamarutham-shri-lola-geetham')));
  assert.deepEqual(hit('vani-veena-pustaka-pani-hindolam'), []);
});

test('the decisions: math first, a garbled reading never wins, and ties stay with the repertoire', () => {
  const v = (c, o) => Object.assign({ c, fit: 1, raga: 1, octave: 1, whole: 1, hard: 1, score: .9, lines: 10 }, o);
  const pick = (site, ...list) => choose(list.sort((a, b) => b.score - a.score), site).c;
  // a garbled reading can look longer and score well; it does not fill the tala
  assert.equal(pick('site', v('site', { whole: .55, score: .8 }), v('book', { fit: .2, hard: .6, whole: .97, score: .85 })), 'site');
  // of those that fill the tala, the cleaner wins, even over the repertoire and a higher score
  assert.equal(pick('site', v('site', { octave: .97, hard: .9925, score: .95 }), v('book', { score: .9 })), 'book');
  // equal by the math: the repertoire stays, unless another is clearly better overall
  assert.equal(pick('site', v('site', { score: .9 }), v('book', { score: .91 })), 'site');
  assert.equal(pick('site', v('site', { score: .8 }), v('book', { score: .9 })), 'book');
  // a fragment does not win on being clean
  assert.equal(pick('site', v('site', { whole: .3, score: .9 }), v('book', { score: .85 })), 'book');
  // a line or two is no version to judge by, though it fits perfectly and the other does not
  assert.equal(pick('site', v('site', { lines: 1, whole: .26, score: .8 }), v('book', { fit: .7, hard: .85, whole: .78, score: .7 })), 'book');
  // a short notation that has the whole piece is a version, however few its rows
  assert.equal(pick('site', v('site', { lines: 2, whole: 1, score: .9 }), v('book', { lines: 6, whole: 1, score: .9 })), 'site');
  // with no version in the repertoire, simply the best
  assert.equal(pick(null, v('a', { score: .9 }), v('b', { score: .8 })), 'a');
});

test('the geetham meanings: every geetham of the notes has one, on the composition kept, whichever notation won', () => {
  const M = JSON.parse(readFileSync(new URL('../data/lessons/gurukulam-meanings.json', import.meta.url), 'utf8'));
  assert.deepEqual(Object.keys(M).sort(), G.map(p => p.id.replace('lesson-gurukulam-', '')).sort());
  const withMeaning = stored.filter(c => c.meaning);
  assert.equal(withMeaning.length, Object.keys(M).length);
  withMeaning.forEach(c => {
    assert.ok(c.meaning.parts.length && c.meaning.parts.every(p => p.text.every(Boolean)), c.id);
    assert.ok(c.meaning.words.length && c.meaning.words.every(w => w.lyric.length), c.id);
    assert.ok(c.meaning.source.pages.length && /Gurukulam/.test(c.meaning.source.author), c.id);
    assert.ok(/geet|lakshana/i.test(c.type + ' ' + c.name + ' ' + c.title), c.id + ': ' + c.type);
  });
  // the English is corrected, the lyric lines are not
  const prose = withMeaning.flatMap(c => c.meaning.parts.concat(c.meaning.words).flatMap(p => p.text)).join(' ');
  assert.doesNotMatch(prose, /\b(benicdict|desciples|serpant|fullfils|hipnotized|infactuator|paises|sasti|[Ll]ordess|ascendent|descendent|Sahnaa)\b/);
  assert.match(repo('sahana-kamsasura-lakshana-geetham').meaning.words[0].lyric.join(' '), /SahnA rAgaM/);
  // the site's notation kept, and the book's meaning with it
  const janaka = repo('geetham-janakasutha-saveri-roopakam');
  assert.equal(janaka.source, undefined);
  assert.match(janaka.meaning.parts[0].text[0], /^Oh Rama, you are decorated by the kumkum/);
  // the book's notation used, under the site's id
  assert.match(repo('bhairavi-shreeramachandra-dhruva-geetham').meaning.words[0].lyric[0], /^SrI rAmachandrAsrita/);
  // a new geetham from the book, its sections kept apart
  const lambodara = repo('lesson-gurukulam-sri-gananatha-lambodara-malahari');
  assert.deepEqual(lambodara.meaning.parts.map(p => p.title), ['Pallavi', 'Charanam 1', 'Charanam 2']);
  assert.deepEqual(lambodara.meaning.source.pages, [8, 9]);
  // no other composition has one, and the notation is untouched by it
  assert.ok(!repo('2017-12-nannu-kanna-thalli-thyagaraja').meaning);
});

test('docs/repertoire-status.md: its numbers are the data, and the score is the page\'s own marks', () => {
  const raw = readFileSync(STATUS, 'utf8').replace(/\r\n/g, '\n');
  assert.equal(raw, withStats(raw), 'run node scripts/repertoire-stats.js');
  const S = summarize(stored);
  assert.equal(S.clean + S.offC.length + S.unchecked.length, S.withLines.length);
  assert.ok(raw.includes('**Score: ' + S.score + '%**'));
  assert.ok(S.offC.every(m => raw.includes('`' + m.c.id + '`')), 'every marked composition is listed');
});

test('the repertoire: the lessons are in, each decision is kept, and each lesson appears once', () => {
  const ix = JSON.parse(readFileSync(join(DATA, 'index.json'), 'utf8'));
  assert.equal(ix.count, ix.compositions.length);
  assert.deepEqual(Object.keys(ix.sources), ['gurukulam']);
  // new lessons
  for (const id of ['lesson-gurukulam-ganavidya-durandhara-nata', 'lesson-gurukulam-sri-himachala-suthe-nata', 'lesson-gurukulam-pahi-sri-ramachandra-anandabhairavi', 'lesson-gurukulam-palaya-nagesvara-bilahari', 'lesson-gurukulam-bhuvanatraya-mohana-kambhoji', 'lesson-gurukulam-janakiramana-te-namo-neelambari', 'lesson-gurukulam-vani-veena-pustaka-pani-hindolam', 'lesson-gurukulam-kunda-gaura-malahari', 'lesson-gurukulam-kereya-neeranu-malahari', 'lesson-gurukulam-padumanabha-malahari'])
    assert.ok(ix.compositions.some(c => c.id === id), id);
  // taken out of the repertoire, from every source; a krithi with the letters in a word stays
  const gone = ix.compositions.filter(c => /alankar|sarali|brahma.?kadigina/i.test(c.id + ' ' + c.name));
  assert.deepEqual(gone.map(c => c.id), ['2025-11-shri-ramya-chithalankara-jayamanohari']);
  assert.ok(!ix.compositions.some(c => c.type === 'Basics'), 'no Basics');
  // a version that lost is not in the list
  assert.ok(!ix.compositions.some(c => c.id === 'lesson-gurukulam-vande-madhavam-varali'));
  // the site's composition keeps its id when another notation replaces it, and its words
  const bh = repo('bhairavi-shreeramachandra-dhruva-geetham');
  assert.equal(bh.source.id, 'gurukulam'); assert.match(bh.siteUrl, /carnaticnotations/);
  assert.ok(bh.compared.some(v => v.used && /Geetham/.test(v.source)));
  assert.ok(bh.sections.flatMap(s => s.lines).length >= 7);
  // a composition where the repertoire held up keeps its notation, and the comparison says so
  const jl = repo('geetham-janakasutha-saveri-roopakam');
  assert.equal(jl.source, undefined); assert.ok(jl.compared.find(v => v.used).source.startsWith('Carnatic Music Notations'));
  // the post that gathered four pillari geethams gives way to them
  const to = ix.redirects['2020-12-pillari-geethams-malahari-purandaradaasa'];
  assert.ok(ix.compositions.some(c => c.id === to)); assert.ok(!ix.compositions.some(c => c.id === '2020-12-pillari-geethams-malahari-purandaradaasa'));
  // everything in the list has a file, and each decision names one version used
  const files = new Set(readdirSync(join(DATA, 'c')).map(f => f.replace(/\.json$/, '')));
  ix.compositions.forEach(c => assert.ok(files.has(c.id), c.id));
  stored.filter(c => c.compared).forEach(c => assert.equal(c.compared.filter(v => v.used).length, 1, c.id));
});
