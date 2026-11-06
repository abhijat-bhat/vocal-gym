/* Vocal Gym · the numbers of the repertoire (v0.9.4)
   Writes the part of docs/repertoire-status.md between its two markers, from data/repertoire/. The rest of that file is
   written by hand. import-repertoire.js calls this when it writes the data, and test/lessons.test.js checks they agree.

   The error marks are counted exactly as the page draws them: offCycle() for the "over / short" tags, line.fixed for the
   "fixed" tags. The score is a measure of tala fit and marks, not of musical correctness (the file says so too).

   Usage: node scripts/repertoire-stats.js [--check]   (--check: only say whether the file is up to date) */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { talaOf, offCycle } from '../src/engine/repertoire.js';
import { measure } from './lessons.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'data', 'repertoire', 'c');
export const STATUS = join(ROOT, 'docs', 'repertoire-status.md');
export const BEGIN = '<!-- stats:begin (scripts/repertoire-stats.js writes this part; do not edit it by hand) -->', END = '<!-- stats:end -->';

const pct = (a, b) => (b ? (100 * a / b).toFixed(1) : '0.0') + '%';
const count = (list, key) => { const m = new Map(); list.forEach(x => { const k = key(x); m.set(k, (m.get(k) || 0) + 1); }); return [...m].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))); };
const table = (head, rows) => ['| ' + head.join(' | ') + ' |', '|' + head.map(() => ' --- |').join(''), ...rows.map(r => '| ' + r.join(' | ') + ' |')].join('\n');
const cellText = s => String(s == null ? '' : s).replace(/\|/g, '\\|');
const KINDS = { rows: 'table rows read, swaras and sahitya together', lines: 'swara lines', full: 'fill whole cycles', lead: 'lead-ins that end on sam', joined: 'in split lines that fill cycles together', link: 'short "link" lines (a section\'s closing phrase; not checked as a cycle)', tail: 'with an overlap cell', partial: 'off the cycle by the importer\'s count', sahitya: 'with sahitya under the swaras', slips: 'octave-mark slips corrected', fast4: 'in compositions read with four-times groups (count of compositions)', badChars: 'lines with a character the importer could not read' };

export function loadAll() { return readdirSync(DIR).map(f => JSON.parse(readFileSync(join(DIR, f), 'utf8'))).sort((a, b) => a.id.localeCompare(b.id)); }

/* per composition, what the page marks */
function marks(c) {
  const tl = c.tala ? talaOf(c.tala.name) : null, tala = tl ? tl.tala : null;
  let lines = 0, off = 0, fixed = 0;
  c.sections.forEach(s => {
    const upb = s.unitsPerBeat || (c.tala ? c.tala.unitsPerBeat : 1);
    s.lines.forEach((l, i) => { lines++; if (l.fixed) fixed++; if (tala && offCycle(s.lines, i, tala, upb)) off++; });
  });
  return { c, lines, off, fixed, checked: !!tala };
}

export function summarize(comps) {
  const M = comps.map(marks), withLines = M.filter(m => m.lines), offC = withLines.filter(m => m.off), fixC = withLines.filter(m => m.fixed), unchecked = withLines.filter(m => !m.checked);
  const lines = M.reduce((n, m) => n + m.lines, 0), off = M.reduce((n, m) => n + m.off, 0), fixed = M.reduce((n, m) => n + m.fixed, 0);
  const clean = withLines.filter(m => !m.off && m.checked).length;
  return { M, withLines, offC, fixC, unchecked, lines, off, fixed, clean, score: Math.round(1000 * clean / withLines.length) / 10, lineScore: Math.round(1000 * (lines - off) / lines) / 10 };
}

export function statsBlock(comps = loadAll()) {
  const S = summarize(comps), { M, withLines, offC, fixC, unchecked, lines, off, fixed, clean } = S, o = [];
  const name = c => cellText(c.name), latest = comps.map(c => c.published || '').sort().pop().slice(0, 10);
  const totals = {}; comps.forEach(c => Object.entries(c.stats || {}).forEach(([k, v]) => { if (typeof v === 'number') totals[k] = (totals[k] || 0) + v; }));

  o.push('## The numbers', '', '### Quality', '',
    '**Score: ' + S.score + '%**, the share of compositions with notation that have no error mark: ' + clean + ' of ' + withLines.length + '. By lines it is ' + S.lineScore + '%.', '',
    table(['Mark', 'Compositions', 'Lines'], [
      ['Off the cycle (likely errors, left as written)', offC.length + ' (' + pct(offC.length, withLines.length) + ')', off + ' of ' + lines + ' (' + pct(off, lines) + ')'],
      ['"fixed" (typing slips corrected at import)', fixC.length + ' (' + pct(fixC.length, withLines.length) + ')', String(fixed)],
      ['Either', String(withLines.filter(m => m.off || m.fixed).length), ''],
      ['Could not be checked (no tala)', String(unchecked.length), String(unchecked.reduce((n, m) => n + m.lines, 0))]]), '');
  const share = offC.map(m => m.off / m.lines);
  o.push('Off-cycle share within a marked composition: ' + [['up to 5%', x => x <= .05], ['5 to 20%', x => x > .05 && x <= .2], ['20 to 50%', x => x > .2 && x <= .5], ['over 50%', x => x > .5]].map(([t, f]) => t + ': ' + share.filter(f).length).join(' · ') + '.', '');
  const ms = withLines.filter(m => m.checked).map(m => ({ w: m.lines, r: measure(m.c) })), W = ms.reduce((n, x) => n + x.w, 0), avg = k => (ms.reduce((n, x) => n + x.r[k] * x.w, 0) / W).toFixed(3);
  o.push('The measures of `scripts/lessons.js`, weighted by lines: tala fit ' + avg('fit') + ', swaras in the raga ' + avg('raga') + ', no unexplained octave leap ' + avg('octave') + '.', '');

  o.push('### Size', '',
    table(['', 'Count'], [
      ['Compositions', String(comps.length)], ['With swara lines', String(withLines.length)], ['Words only, no swara lines', comps.filter(c => !c.sections.some(s => s.lines.length)).map(c => c.id).join(', ') + ' (' + (comps.length - withLines.length) + ')'],
      ['Lines', String(lines)], ['Ragamalikas', String(comps.filter(c => c.ragamalika).length)], ['With a meaning', String(comps.filter(c => c.meaning).length)],
      ['With versions compared', String(comps.filter(c => c.compared).length)], ['Newest post in the data', latest || 'unknown']]), '');

  o.push('### What the lines are', '', table(['Kind', 'Lines'], Object.keys(KINDS).filter(k => k in totals).map(k => [KINDS[k] || k, String(totals[k])])), '',
    'The importer\'s off-the-cycle count is a little higher than the tags, because the page shows no tag on lead-ins, overlaps and split lines.', '');

  o.push('### By type', '', table(['Type', 'Compositions', 'With off-cycle tags', 'Lines', 'Off-cycle lines', 'Fixed lines', 'With a meaning'], count(comps, c => c.type).map(([t]) => {
    const g = M.filter(m => m.c.type === t), sum = k => g.reduce((n, m) => n + m[k], 0);
    return [cellText(t), String(g.length), String(g.filter(m => m.off).length), String(sum('lines')), String(sum('off')), String(sum('fixed')), String(g.filter(m => m.c.meaning).length)];
  })), '');

  o.push('### By where the notation comes from', '', table(['Source', 'Compositions'], count(comps, c => c.source ? c.source.name + ' (' + c.source.author + ')' : 'Carnatic Music Notations').map(([k, n]) => [cellText(k), String(n)])), '');
  o.push('### By tala', '', table(['Tala', 'Compositions'], count(comps, c => c.tala ? c.tala.name : '(none)').map(([k, n]) => [cellText(k), String(n)])), '');
  const ragas = count(comps, c => c.raga || '(none)');
  o.push('### Ragas', '', ragas.length + ' distinct names, as the sources spell them. The 30 most used: ' + ragas.slice(0, 30).map(([k, n]) => k + ' ' + n).join(', ') + '.', '');
  const who = count(comps, c => c.composer || '(not named)');
  o.push('### Composers and languages', '', who.length + ' composer names. The 20 most used: ' + who.slice(0, 20).map(([k, n]) => k + ' ' + n).join(', ') + '.', '',
    'Languages: ' + count(comps, c => c.language || '(not named)').map(([k, n]) => k + ' ' + n).join(', ') + '.', '');

  const inferred = comps.filter(c => c.tala && c.tala.inferred), refit = comps.filter(c => c.tala && c.tala.refit), none = comps.filter(c => !c.tala);
  o.push('### Tala oddities', '', '- No tala (' + none.length + '): ' + (none.map(c => '`' + c.id + '`').join(', ') || 'none') + '.', '- Tala inferred from the lines (' + inferred.length + '): ' + (inferred.map(c => '`' + c.id + '`').join(', ') || 'none') + '.', '- Named tala differs from the written cycles (' + refit.length + '): ' + (refit.map(c => '`' + c.id + '` (' + cellText(c.tala.refit) + ' → ' + cellText(c.tala.name) + ')').join(', ') || 'none') + '.', '');

  const why = {}; comps.forEach(c => c.sections.forEach(s => s.lines.forEach(l => (l.fixed || []).forEach(x => (x.why || []).forEach(w => { why[w] = (why[w] || 0) + 1; })))));
  o.push('### Corrections at import, by reason', '', table(['Reason', 'Cells'], Object.entries(why).sort((a, b) => b[1] - a[1]).map(([k, n]) => [cellText(k), String(n)])), '');

  const pc = x => Math.round(x * 100) + '%';
  o.push('### Versions compared', '', 'Used by the rules in `scripts/lessons.js`; each row is a composition with two versions. Columns are the winner\'s fit, raga and octave against the other version\'s.', '',
    table(['Composition', 'Used', 'Fit', 'Raga', 'Octave', 'Complete'], comps.filter(c => c.compared).map(c => { const u = c.compared.find(v => v.used), x = c.compared.find(v => !v.used) || u, pair = k => pc(u[k]) + ' / ' + pc(x[k]); return [name(c) + ' `' + c.id + '`', cellText(u.source), pair('fit'), pair('raga'), pair('octave'), pair('whole')]; })), '');

  const noMeaning = comps.filter(c => /geetham/i.test(c.type) && !c.meaning);
  o.push('### Geethams with no meaning (' + noMeaning.length + ')', '', 'The notes do not have these: ' + noMeaning.map(c => name(c)).join(', ') + '.', '');
  o.push('### Every composition with an off-cycle tag (' + offC.length + ')', '', 'Worst share first.', '', table(['Composition', 'Type', 'Off / lines', 'Id'], offC.slice().sort((a, b) => b.off / b.lines - a.off / a.lines || b.off - a.off || a.c.id.localeCompare(b.c.id)).map(m => [name(m.c), cellText(m.c.type), m.off + ' / ' + m.lines, '`' + m.c.id + '`'])), '');
  o.push('### Every composition with a "fixed" tag (' + fixC.length + ')', '', fixC.slice().sort((a, b) => b.fixed - a.fixed || a.c.id.localeCompare(b.c.id)).map(m => '`' + m.c.id + '` ' + m.fixed).join(' · '));
  return o.join('\n');
}

/* the file, with its numbers replaced; \r\n is how Windows checks it out */
export function withStats(text, block = statsBlock()) {
  const s = text.replace(/\r\n/g, '\n'), a = s.indexOf(BEGIN), b = s.indexOf(END);
  if (a < 0 || b < a) throw new Error('docs/repertoire-status.md has lost its markers');
  return s.slice(0, a + BEGIN.length) + '\n\n' + block + '\n\n' + s.slice(b);
}
export function writeStats() { const raw = readFileSync(STATUS, 'utf8'); writeFileSync(STATUS, withStats(raw)); }

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--check')) {
    const raw = readFileSync(STATUS, 'utf8').replace(/\r\n/g, '\n');
    if (withStats(raw) !== raw) { console.error('docs/repertoire-status.md is out of date: run node scripts/repertoire-stats.js'); process.exit(1); }
    console.log('docs/repertoire-status.md is up to date');
  } else { writeStats(); const S = summarize(loadAll()); console.log('Wrote docs/repertoire-status.md: score ' + S.score + '%, ' + S.offC.length + ' compositions with off-cycle tags, ' + S.off + ' lines'); }
}
