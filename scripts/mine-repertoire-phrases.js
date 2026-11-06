#!/usr/bin/env node
/* Vocal Gym · phrases for the rare melas, from the repertoire's notation (v0.11)
   Most of the rare melas have no published list of phrases. This reads their compositions in data/repertoire/ and writes the runs
   they repeat into data/raga-profiles.json, each with its composition as its source, so the profiles stay the one place the
   generators read raga knowledge from. It touches only ragas with no phrase of weight 0.4 or more from anywhere else.

   What it takes, and what it leaves:
     a composition   only if it is not a ragamalika, and its printed scale is the mela's own. A Dikshitar-school or janya scale under
                     the same name is not this raga; the mela's scale under another spelling is
     a line          only if the octave checks do not question it, and every swara belongs to the mela
     a run           4 to 8 swaras between rests, not a plain climb or fall, which the piece sings at least twice
   The evidence is thin, one or two compositions a raga, so these carry a lower weight than a lakshana's phrases and the raga's
   phrase confidence stays low however many there are. They are read from notation, and no teacher has checked them.

   Deterministic: the same files give the same phrases. Run it again after an import; it replaces only what it wrote before.

   Usage: node scripts/mine-repertoire-phrases.js [--report]   (--report: print, and write nothing) */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { octaveChecks, parseCell } from '../src/engine/repertoire.js';
import { allRagas, SEMI } from '../src/engine/ragas.js';
import { mod12 } from '../src/engine/projection.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'data', 'repertoire', 'c'), FILE = join(ROOT, 'data', 'raga-profiles.json');
const MIN = 4, MAX = 8, KEEP = 10, WEIGHT = 0.45, MARK = 'repertoire-mined';
const GAP = "No published phrases. Those here are runs read from the repertoire's notation; no teacher has checked them.";
const fold = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z]/g, '').replace(/h/g, '').replace(/(.)\1+/g, '$1');
const plainName = s => String(s || '').replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();

/* the pitches of a printed scale, or null if it names a swara no one can read */
function scalePcs(list) {
  const out = new Set();
  for (const t of list || []) { const m = /^([SRGMPDN][123]?)/.exec(t); if (!m) return null; const pc = /^[SP]$/.test(m[1]) ? SEMI[m[1]] : SEMI[m[1]]; if (pc == null) return null; out.add(mod12(pc)); }
  return out;
}
const sameSet = (a, b) => a.size === b.size && [...a].every(x => b.has(x));

/* a line as runs between rests: [{ s, v, o, hold }]. A karvai holds the swara before it; a long hold or a line's end breaks the run. */
function runsOf(cells) {
  const runs = []; let run = [], rest = 0;
  const flush = () => { if (run.length) runs.push(run); run = []; };
  cells.forEach(cell => parseCell(cell).forEach(t => {
    if (t.s === ',') { if (run.length) { run[run.length - 1].hold += 1; rest++; if (rest >= 3) flush(); } return; }
    rest = 0; run.push({ s: t.s, v: t.v, o: t.o, hold: 0 });
  }));
  flush();
  return runs;
}
/* do these swaras only climb or only fall? (by the order of the letters, across octaves) */
const ORDER = 'SRGMPDN';
const straightRun = ns => { const at = ns.map(n => ORDER.indexOf(n.s) + 7 * n.o); let up = true, down = true; for (let i = 1; i < at.length; i++) { if (at[i] <= at[i - 1]) up = false; if (at[i] >= at[i - 1]) down = false; } return up || down; };
const letterToken = n => n.s + (n.o > 0 ? "'".repeat(n.o) : n.o < 0 ? '.'.repeat(-n.o) : '');
const textOf = ns => ns.map((n, i) => letterToken(n) + (i < ns.length - 1 ? ' ,'.repeat(Math.min(n.hold, 3)) : '')).join(' ');

export function mine(doc, comps) {
  const R = allRagas(), E = new Map(R.melakartas.concat(R.janyas).map(r => [r.id, r]));
  const external = p => p.weight >= 0.4 && p.mined !== MARK;
  const lacking = Object.values(doc.ragas).filter(r => !r.phrases.some(external));
  const report = [];
  const found = {};
  lacking.forEach(p => {
    const raga = E.get(p.id), names = new Set([p.name].concat(p.aliases || []).map(fold)), want = new Set(raga.aro.concat(raga.avaro).map(mod12));
    const straight = (c, l) => { const sc = (c.ragas || [])[0], t = sc && sc[l]; return !!t && t.length === raga[l].length && t.every((x, i) => { const m = /^([SRGMPDN][123]?)/.exec(x); return m && SEMI[m[1]] != null && mod12(SEMI[m[1]]) === mod12(raga[l][i]); }); };
    const pieces = comps.filter(c => !c.ragamalika && (names.has(fold(c.raga)) || (raga.kind === 'melakarta' && straight(c, 'aro') && straight(c, 'avaro'))));
    const line = { id: p.id, name: p.name, pieces: pieces.length, used: [], left: [], phrases: [] };
    const count = new Map();
    pieces.forEach(c => {
      const sc = (c.ragas || [])[0], pcs = sc && scalePcs((sc.aro || []).concat(sc.avaro || []));
      if (!pcs || !sameSet(pcs, want)) { line.left.push(c.name + ' (its printed scale differs)'); return; }
      const flags = octaveChecks(c.sections);
      let lines = 0;
      c.sections.forEach((s, si) => s.lines.forEach((l, li) => {
        if (flags[si][li].length) return;
        const toks = l.cells.flatMap(x => parseCell(x)).filter(t => t.s !== ',');
        if (!toks.length || toks.some(t => { const k = t.s + (t.v || ''); const pc = /^[SP]$/.test(t.s) ? SEMI[t.s] : t.v ? SEMI[k] : null; return (t.v && !want.has(mod12(pc))) || !Object.values(raga.labels).some(x => x[0] === t.s); })) return;
        lines++;
        runsOf(l.cells).forEach(run => {
          for (let w = MIN; w <= MAX; w++) for (let i = 0; i + w <= run.length; i++) {
            const ns = run.slice(i, i + w), key = textOf(ns);
            if (new Set(ns.map(n => n.s + n.o)).size < 3) continue;   // a swara and its neighbour swung back and forth is not a phrase
            if (straightRun(ns)) continue;                            // a plain climb or fall could be any raga
            const e = count.get(key) || { n: 0, c, ns };
            e.n++; count.set(key, e);
          }
        });
      }));
      if (lines) line.used.push(c);
    });
    // keep the longest that repeat, and drop what sits inside a kept run as often as it does
    const rep = [...count.entries()].filter(([, e]) => e.n >= 2).sort((a, b) => b[1].ns.length * b[1].n - a[1].ns.length * a[1].n || a[0].localeCompare(b[0]));
    const kept = [];
    rep.forEach(([k, e]) => { if (kept.length < KEEP && !kept.some(q => (' ' + q.k + ' ').includes(' ' + k + ' '))) kept.push({ k, e }); });
    line.phrases = kept.map(x => ({ swaras: x.k, n: x.e.n, c: x.e.c }));
    found[p.id] = line;
    report.push(line);
  });
  return { found, report };
}

/* the phrases into the document: only what this script wrote before is replaced */
export function apply(doc, found) {
  let next = Math.max(...Object.keys(doc.sources).map(s => +s.slice(1))) + 1;
  const sourceOf = c => {
    const url = c.url, had = Object.entries(doc.sources).find(([, v]) => v.url === url);
    if (had) return had[0];
    const id = 'S' + next++;
    doc.sources[id] = { title: 'Carnatic Music Notations: ' + plainName(c.name), url, reliability: 'medium', note: 'Runs the composition repeats, read from the repertoire by scripts/mine-repertoire-phrases.js, with the octaves as written. One notation; no teacher has checked them.', key: 'cmn-' + c.id };
    return id;
  };
  Object.values(found).forEach(line => {
    const p = doc.ragas[line.id];
    p.phrases = p.phrases.filter(x => x.mined !== MARK);
    p.gaps = (p.gaps || []).filter(g => g !== GAP);
    line.phrases.forEach(x => {
      const source = sourceOf(x.c);
      p.phrases.push({ swaras: x.swaras, type: 'connective', features: [], weight: WEIGHT, context: 'carnatic', source, derivedFrom: 'composition', composition: plainName(x.c.name), octaveCertain: true, directionRuleOk: true, anyaSwaras: [], inEngineRange: true, mined: MARK, note: 'Sung ' + x.n + ' times in this composition.' });
      p.references = Array.from(new Set((p.references || []).concat(source)));
    });
    if (line.phrases.length) { p.confidence.phrases = 'low'; p.gaps.unshift(GAP); }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1].replace(/\//g, '\\') || process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const doc = JSON.parse(readFileSync(FILE, 'utf8'));
  const comps = readdirSync(DIR).map(f => JSON.parse(readFileSync(join(DIR, f), 'utf8'))).sort((a, b) => a.id.localeCompare(b.id));
  const { found, report } = mine(doc, comps);
  report.forEach(l => {
    console.log(l.name.padEnd(22) + String(l.pieces).padStart(2) + ' pieces, ' + l.used.length + ' used, ' + String(l.phrases.length).padStart(2) + ' phrases' + (l.phrases.length ? ': ' + l.phrases.slice(0, 3).map(x => x.swaras).join(' | ') : '') + (l.left.length ? '  [left: ' + l.left.join('; ').slice(0, 90) + ']' : ''));
  });
  console.log(report.filter(l => l.phrases.length).length + ' of ' + report.length + ' ragas found phrases, ' + report.reduce((n, l) => n + l.phrases.length, 0) + ' phrases');
  if (!process.argv.includes('--report')) { apply(doc, found); writeFileSync(FILE, JSON.stringify(doc, null, 2) + '\n'); console.log('Written. Now run: node scripts/check-raga-profiles.js --fix, then npm run profiles.'); }
}
