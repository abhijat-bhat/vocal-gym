#!/usr/bin/env node
/* Vocal Gym · how far to trust the octave checks (v0.11)
   Writes docs/octave-accuracy.md. Three measures, each saying what it can and cannot tell:

     planted slips     Take lines the checks leave alone, move one swara an octave, and see whether the checks catch it and suggest
                       the original back. This measures recall on slips of this kind. It says nothing about false alarms.
     two sources       Where the site and the lesson book notate the same line, their agreement is independent evidence. Lines
                       they agree on should not be flagged (a false alarm if they are); where they differ, a flag that suggests
                       the other source's reading is a likely real slip. Only a few lessons exist in both.
     a sample to mark  A fixed random sample of the real flags, by group, for a singer or teacher to mark right or wrong. Only this
                       can say how many of the 933 are real. Results go in SAMPLE_MARKS below, or the file says it is unmarked.

   Usage: node scripts/octave-accuracy.js [--check]   (--check: only say whether the file is up to date) */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { octaveChecks, parseCell, sustainText } from '../src/engine/repertoire.js';
import { rng } from '../src/engine/random.js';
import { gurukulamPieces } from './lessons.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'data', 'repertoire', 'c'), OUT = join(ROOT, 'docs', 'octave-accuracy.md');
const TRIALS = 4000, SAMPLE_PER_GROUP = 30, SEED = 20261106;
/* a marked sample: 'flag id' → true (the suggestion is right) or false. Empty until someone has marked it. */
const SAMPLE_MARKS = {};

const comps = readdirSync(DIR).map(f => JSON.parse(readFileSync(join(DIR, f), 'utf8'))).sort((a, b) => a.id.localeCompare(b.id));
const copyOf = sections => sections.map(s => Object.assign({}, s, { lines: s.lines.map(l => Object.assign({}, l, { cells: l.cells.slice() })) }));

/* the tok-th swara of a cell, moved an octave: the mark goes after its letter and any variant digit */
function moved(cell, tok, dir) {
  let k = 0, n = -1;
  const s = String(cell);
  while (k < s.length) {
    const c = s[k];
    if (/[SRGMPDNsrgmpdn]/.test(c)) {
      n++;
      let e = k + 1;
      if (/[1-3]/.test(s[e] || '')) e++;
      let mark = e; while (s[mark] === "'" || s[mark] === '.') mark++;
      if (n === tok) return mark > e ? null : s.slice(0, e) + (dir > 0 ? "'" : '.') + s.slice(e);
      k = mark; continue;
    }
    k++;
  }
  return null;
}
const swaraCount = cell => parseCell(cell).filter(t => t.s !== ',').length;

/* ---- planted slips ---- */
function planted() {
  const rand = rng(SEED), tally = { trials: 0, caught: 0, exact: 0, spike: 0, piece: 0, up: { t: 0, c: 0 }, down: { t: 0, c: 0 }, shortPiece: { t: 0, c: 0 }, longPiece: { t: 0, c: 0 } };
  const usable = comps.filter(c => c.sections.some(s => s.lines.length));
  let guard = 0;
  while (tally.trials < TRIALS && guard++ < TRIALS * 40) {
    const c = usable[Math.floor(rand() * usable.length)], si = Math.floor(rand() * c.sections.length), sec = c.sections[si];
    if (!sec.lines.length) continue;
    const li = Math.floor(rand() * sec.lines.length), line = sec.lines[li], clean = octaveChecks(c.sections)[si][li];
    if (clean.length) continue;
    const places = []; line.cells.forEach((cell, ci) => { for (let t = 0, n = swaraCount(cell); t < n; t++) places.push([ci, t]); });
    if (places.length < 5) continue;
    // not the first or last swara of a line: a leap there is a phrase beginning or ending, and no check should take it
    const [ci, tok] = places[1 + Math.floor(rand() * (places.length - 2))], dir = rand() < .5 ? 1 : -1, cell = moved(line.cells[ci], tok, dir);
    if (cell == null) continue;
    const sections = copyOf(c.sections); sections[si].lines[li].cells[ci] = cell;
    const found = octaveChecks(sections)[si][li], hit = found.find(f => f.changes.some(x => x.cell === ci && x.tok === tok));
    const lines = c.sections.reduce((n, s) => n + s.lines.length, 0), band = lines >= 12 ? tally.longPiece : tally.shortPiece, side = dir > 0 ? tally.up : tally.down;
    tally.trials++; band.t++; side.t++;
    if (hit) { tally.caught++; band.c++; side.c++; if (hit.cells.join(' ') === line.cells.join(' ')) tally.exact++; if (hit.checks.includes('spike')) tally.spike++; if (hit.checks.includes('piece')) tally.piece++; }
  }
  return tally;
}

/* ---- two sources: a line the site and the book both write ---- */
const shape = cells => cells.flatMap(c => parseCell(c).filter(t => t.s !== ',')).map(t => t.s).join('');
const octs = cells => cells.flatMap(c => parseCell(c).filter(t => t.s !== ',')).map(t => t.o);
function twoSources() {
  const pieces = gurukulamPieces(), out = { lessons: 0, sharedLines: 0, agree: 0, agreeFlagged: 0, differ: 0, differFlagged: 0, flagMatchesBook: 0, examples: [] };
  const book = new Map(pieces.map(p => [p.id, p]));
  comps.filter(c => (c.compared || []).some(v => v.used && !v.pages) && c.compared.some(v => v.pages)).forEach(c => {
    const ver = c.compared.find(v => v.pages);
    // the book's piece covering the same pages: matched by the pages the site's comparison names
    const piece = pieces.find(p => p.source && JSON.stringify(p.source.pages) === JSON.stringify(ver.pages)) || null;
    if (!piece) return;
    out.lessons++;
    const inBook = new Map();
    piece.sections.forEach(s => s.lines.forEach(l => { const k = shape(l.cells); if (k.length >= 4 && !inBook.has(k)) inBook.set(k, octs(l.cells)); }));
    const flags = octaveChecks(c.sections);
    c.sections.forEach((s, si) => s.lines.forEach((l, li) => {
      const k = shape(l.cells), other = inBook.get(k); if (!other) return;
      const mine = octs(l.cells), f = flags[si][li];
      out.sharedLines++;
      if (mine.join() === other.join()) { out.agree++; if (f.length) out.agreeFlagged++; return; }
      out.differ++;
      if (f.length) { out.differFlagged++; if (f.some(x => octs(x.cells).join() === other.join())) out.flagMatchesBook++; }
    }));
  });
  void book;
  return out;
}

/* ---- a sample to mark ---- */
function sampleOf() {
  const groups = { both: [], spike: [], piece: [] };
  comps.forEach(c => octaveChecks(c.sections).forEach((ls, si) => ls.forEach((found, li) => found.forEach((x, n) => {
    const g = x.checks.length === 2 ? 'both' : x.checks[0];
    groups[g].push({ id: c.id + ':' + si + ':' + li + ':' + n, c, si, li, x });
  }))));
  const rand = rng(SEED + 1), picked = {};
  Object.keys(groups).forEach(g => { const a = groups[g].slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } picked[g] = { total: groups[g].length, items: a.slice(0, SAMPLE_PER_GROUP) }; });
  return picked;
}

const pc = (a, b) => (b ? (100 * a / b).toFixed(1) + '%' : 'n/a');
function document() {
  const p = planted(), t = twoSources(), s = sampleOf();
  const L = [];
  L.push('# How far to trust the octave checks', '', 'Generated by `node scripts/octave-accuracy.js`. The checks are in `octaveChecks` (`src/engine/repertoire.js`); the flags are listed in [octave-review.md](octave-review.md).', '');
  L.push('**In short:** the checks catch about ' + pc(p.caught, p.trials) + ' of octave slips planted at random, and when they catch one they nearly always suggest the right fix. How many of the real flags are correct is not known yet: that needs the marked sample below.', '');
  L.push('## 1. Planted slips (recall)', '', TRIALS + ' times, a line the checks leave alone had one swara moved an octave (never its first or last swara). The trials are fixed by a seed, so the numbers repeat.', '');
  L.push('| | Caught | Of |', '| --- | --- | --- |');
  L.push('| All | ' + pc(p.caught, p.trials) + ' | ' + p.trials + ' |');
  L.push('| Suggested exactly the original back, of those caught | ' + pc(p.exact, p.caught) + ' | ' + p.caught + ' |');
  L.push('| Moved up | ' + pc(p.up.c, p.up.t) + ' | ' + p.up.t + ' |', '| Moved down | ' + pc(p.down.c, p.down.t) + ' | ' + p.down.t + ' |');
  L.push('| In a piece of 12 lines or more | ' + pc(p.longPiece.c, p.longPiece.t) + ' | ' + p.longPiece.t + ' |', '| In a shorter piece | ' + pc(p.shortPiece.c, p.shortPiece.t) + ' | ' + p.shortPiece.t + ' |', '');
  L.push('Of those caught, the “one swara far from both neighbours” check caught ' + pc(p.spike, p.caught) + ' and “the same swaras elsewhere” ' + pc(p.piece, p.caught) + ' (some by both). The rest go unflagged, so a line with no tag is not proof that its octaves are right.', '');
  L.push('This says nothing about false alarms: a real leap that looks like a slip is flagged all the same.', '');
  L.push('## 2. Two sources (a small, independent check)', '', t.lessons + ' lesson' + (t.lessons === 1 ? '' : 's') + ' exist in both the site and the lesson book with the site’s version in use; ' + t.sharedLines + ' lines match swara for swara once octaves are ignored.', '');
  L.push('| | Lines | Flagged |', '| --- | --- | --- |');
  L.push('| The two sources agree on the octaves | ' + t.agree + ' | ' + t.agreeFlagged + ' (' + pc(t.agreeFlagged, t.agree) + ') |');
  L.push('| They differ | ' + t.differ + ' | ' + t.differFlagged + ' (' + pc(t.differFlagged, t.differ) + ') |', '');
  L.push('A flag on a line both sources agree on is a false alarm, or a slip they share. Where they differ, ' + t.flagMatchesBook + ' of ' + t.differFlagged + ' flags suggest exactly the book’s reading. These are short teaching pieces, so the numbers may not hold for the krithis, where most flags are.', '');
  L.push('## 3. The sample to mark (precision)', '', 'This is the number that matters, and it needs a singer or a teacher. Mark each suggestion below right or wrong, then put the answers in `SAMPLE_MARKS` in `scripts/octave-accuracy.js` and run it again.', '');
  const marks = Object.keys(SAMPLE_MARKS).length;
  L.push(marks ? marks + ' marked so far.' : '**Not marked yet, so precision is unknown.**', '');
  const NAME = { both: 'Both checks agree', spike: 'One swara far from both neighbours', piece: 'The same swaras read differently elsewhere' };
  Object.keys(s).forEach(g => {
    const it = s[g].items, done = it.filter(x => SAMPLE_MARKS[x.id] != null), right = done.filter(x => SAMPLE_MARKS[x.id]).length;
    L.push('### ' + NAME[g] + ' (' + it.length + ' of ' + s[g].total + ')' + (done.length ? ': ' + right + ' of ' + done.length + ' right' : ''), '');
    it.forEach(x => L.push('- [' + (SAMPLE_MARKS[x.id] == null ? ' ' : SAMPLE_MARKS[x.id] ? 'x' : '-') + '] `' + x.id + '` **' + x.c.name.replace(/[*_|]/g, ' ').trim() + '**: `' + x.c.sections[x.si].lines[x.li].cells.map(sustainText).join(' ').replace(/`/g, '') + '` → `' + x.x.cells.map(sustainText).join(' ').replace(/`/g, '') + '`' + (x.c.url ? ' ([post](' + x.c.url + '))' : '')));
    L.push('');
  });
  return L.join('\n');
}

const text = document();
if (process.argv.includes('--check')) {
  const same = existsSync(OUT) && readFileSync(OUT, 'utf8').replace(/\r\n/g, '\n') === text;
  console.log(same ? 'docs/octave-accuracy.md is up to date' : 'docs/octave-accuracy.md is out of date: run node scripts/octave-accuracy.js');
  process.exit(same ? 0 : 1);
}
writeFileSync(OUT, text);
console.log(text.split('\n').slice(0, 40).join('\n'));
