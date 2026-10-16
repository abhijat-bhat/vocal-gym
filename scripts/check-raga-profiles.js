/* Vocal Gym · raga profile phrase parser and checker
   Parses the swara strings in data/raga-profiles.json into pitches (semitones above Sa) using
   each raga's own swarasthanas, and checks them against the engine's direction rule.

   Notation (see data/raga-profiles.json → notation):
     S R G M P D N   the raga's own swarasthana for that letter
     N2, D1, N3 ...  an explicit variant; if it is not one of the raga's swaras it is an anya swara
     S'  tara (+12)  N.  mandra (−12)
     ,   karvai; ignored for pitch and direction
     tokens are separated by spaces

   Usage:
     node scripts/check-raga-profiles.js          validate data/raga-profiles.json, exit 1 on errors
     node scripts/check-raga-profiles.js --fix    also rewrite the computed fields
                                                  (features, directionRuleOk, inEngineRange, anyaSwaras)
                                                  and checks gamakaRender (rules, targets, sources)
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { SEMI, allRagas } from '../src/engine/ragas.js';
import { makeProjector, mod12 } from '../src/engine/projection.js';

export const KALPANA_RANGE = [-5, 19];          // mandra Pa .. tara Pa, as kalpana() enforces
const TOKEN = /^([SRGMPDN])([123])?(['.])?$/;

/* Map from swara letter to pitch class for a raga, e.g. { S: 0, R: 2, G: 4, ... }. */
export function letterMap(raga) {
  const m = {};
  Object.entries(raga.labels).forEach(([pc, lab]) => {
    const L = lab[0];
    if (m[L] != null && m[L] !== +pc) throw new Error(raga.id + ': two variants of ' + L);
    m[L] = +pc;
  });
  return m;
}

/* The engine's scale as a string, e.g. "S R2 G3 M1 P D2 N3 S'". */
export function scaleString(raga, which) {
  const list = which === 'avarohana' ? raga.avaro : raga.aro;
  return list.map(p => (p === 12 ? "S'" : raga.labels[mod12(p)])).join(' ');
}

/* Parse a swara string. Returns { pitches, karvai, anya, error }. */
export function parsePhrase(raga, str) {
  if (typeof str !== 'string' || !str.trim()) return { error: 'empty phrase' };
  const lm = letterMap(raga);
  const union = new Set(raga.aro.concat(raga.avaro).map(mod12));
  const pitches = [], anya = [];
  let karvai = 0;
  for (const tok of str.trim().split(/\s+/)) {
    if (tok === ',') { karvai++; continue; }
    const m = TOKEN.exec(tok);
    if (!m) return { error: 'bad token "' + tok + '"' };
    const [, L, v, oct] = m;
    let pc;
    if (v) {
      if (L === 'S' || L === 'P') return { error: 'S and P take no variant: "' + tok + '"' };
      pc = SEMI[L + v];
      if (pc == null) return { error: 'unknown variant "' + tok + '"' };
    } else {
      pc = lm[L];
      if (pc == null) return { error: 'swara ' + L + ' is not in ' + raga.name + ' (write an explicit variant for an anya swara)' };
    }
    if (!union.has(pc)) anya.push(tok.replace(/['.]$/, ''));
    pitches.push(pc + (oct === "'" ? 12 : oct === '.' ? -12 : 0));
  }
  if (!pitches.length) return { error: 'no swaras' };
  return { pitches, karvai, anya: Array.from(new Set(anya)) };
}

/* Check a phrase against the engine. directionRuleOk is false when the phrase contains an anya
   swara or any consecutive step breaks makeProjector(raga).valid. */
export function checkPhrase(raga, str) {
  const r = parsePhrase(raga, str);
  if (r.error) return { error: r.error };
  const P = makeProjector(raga), badSteps = [];
  for (let i = 1; i < r.pitches.length; i++) if (!P.valid(r.pitches[i - 1], r.pitches[i])) badSteps.push(i);
  return {
    pitches: r.pitches,
    anyaSwaras: r.anya,
    badSteps,
    directionRuleOk: r.anya.length === 0 && badSteps.length === 0,
    inEngineRange: r.pitches.every(p => p >= KALPANA_RANGE[0] && p <= KALPANA_RANGE[1])
  };
}

/* Structural features of a parsed phrase (pitches as returned by parsePhrase/checkPhrase):
   ending  – last swara is S (any octave) or madhya P
   janta   – two or more immediate repetitions of a swara
   dattu   – a leap of 3+ positions in the raga's own swara order, or two skips of 2 positions
   vakra   – at least one change of direction
   tara / mandra – touches the upper / lower octave
   anya    – contains a swara outside the raga */
export function phraseFeatures(raga, pitches, anya = []) {
  const pcs = Array.from(new Set(raga.aro.concat(raga.avaro).map(mod12))).sort((a, b) => a - b), n = pcs.length;
  const pos = p => { const i = pcs.indexOf(mod12(p)); return i < 0 ? null : Math.floor(p / 12) * n + i; };
  let reps = 0, rev = 0, lastDir = 0; const jumps = [];
  for (let i = 1; i < pitches.length; i++) {
    const a = pitches[i - 1], b = pitches[i];
    if (a === b) { reps++; continue; }
    const d = Math.sign(b - a); if (lastDir && d !== lastDir) rev++; lastDir = d;
    const pa = pos(a), pb = pos(b); if (pa != null && pb != null) jumps.push(Math.abs(pb - pa));
  }
  const last = pitches[pitches.length - 1];
  const f = {
    ending: mod12(last) === 0 || last === 7,
    janta: reps >= 2,
    dattu: jumps.some(d => d >= 3) || jumps.filter(d => d === 2).length >= 2,
    vakra: rev >= 1,
    tara: pitches.some(p => p >= 12),
    mandra: pitches.some(p => p < 0),
    anya: anya.length > 0
  };
  return Object.keys(f).filter(k => f[k]);
}

export function engineRagas() {
  const R = allRagas(), byId = {};
  R.melakartas.concat(R.janyas).forEach(r => { byId[r.id] = r; });
  return byId;
}

/* ---------- gamakaRender: structured gamaka rules (docs/plans/gamaka-audio.md §1) ----------
   Rules are keyed by swara letter. Targets (lo, hi, from) are raga notes: 'self', a letter with an
   optional octave mark ("M", "S'", "N."), '+1' / '-1' (the next raga swara up or down), or '±Nc'
   (cents, for measured data). compileGamaka() resolves them to semitone offsets from the swara. */
export const GAMAKA_WHEN = ['dir', 'minSec', 'maxSec', 'prev', 'next', 'janta', 'inPhrase', 'octave'];
export const GAMAKA_MAX_OFFSET = 7;
const TARGET = /^([SRGMPDN])(['.])?$/;

/* Semitone offset of a target from the swara with pitch class selfPc, or { error }. */
export function resolveTarget(raga, selfPc, spec) {
  if (spec == null || spec === 'self') return 0;
  const s = String(spec);
  const union = Array.from(new Set(raga.aro.concat(raga.avaro).map(mod12))).sort((a, b) => a - b);
  if (s === '+1' || s === '-1') {
    const up = s === '+1';
    let best = null;
    for (const pc of union) for (const o of [-12, 0, 12]) {
      const off = pc + o - selfPc;
      if (up ? off > 0 : off < 0) if (best === null || Math.abs(off) < Math.abs(best)) best = off;
    }
    return best === null ? { error: 'no swara ' + (up ? 'above' : 'below') } : best;
  }
  const c = /^([+-]\d+)c$/.exec(s);
  if (c) return +c[1] / 100;
  const m = TARGET.exec(s);
  if (!m) return { error: 'bad target "' + s + '"' };
  const lm = letterMap(raga), pc = lm[m[1]];
  if (pc == null) return { error: m[1] + ' is not a swara of ' + raga.name };
  let off = pc - selfPc;
  if (m[2] === "'") { while (off <= 0) off += 12; }
  else if (m[2] === '.') { while (off >= 0) off -= 12; }
  else { if (off > 6) off -= 12; if (off < -6) off += 12; }
  return off;
}

/* A neighbour condition ("G", "S'", "N.") as { pc, rel }: rel 'up' / 'down' when an octave mark says
   the neighbour lies above or below the note. */
function resolveNeighbour(raga, spec) {
  const m = TARGET.exec(String(spec));
  if (!m) return { error: 'bad swara "' + spec + '"' };
  const pc = letterMap(raga)[m[1]];
  if (pc == null) return { error: m[1] + ' is not a swara of ' + raga.name };
  return { pc, rel: m[2] === "'" ? 'up' : m[2] === '.' ? 'down' : null };
}

/* Validate one raga's gamakaRender against the enums and sources. Returns error strings. */
export function validateGamaka(raga, gr, doc) {
  const errs = [], EN = doc.enums || {}, id = raga.id;
  const inEnum = (k, v) => !EN[k] || EN[k].includes(v);
  const srcOk = s => !!(doc.sources && doc.sources[s]);
  if (!gr || typeof gr !== 'object') return [id + ': gamakaRender must be an object'];
  if (!inEnum('gamakaStyle', gr.style)) errs.push(id + ': gamakaRender.style ' + gr.style);
  if (!inEnum('gamakaBasis', gr.basis)) errs.push(id + ': gamakaRender.basis ' + gr.basis);
  const lm = letterMap(raga);
  Object.entries(gr.rules || {}).forEach(([L, list]) => {
    if (lm[L] == null) { errs.push(id + ': gamaka rule for ' + L + ', which is not a swara of ' + raga.name); return; }
    if (!Array.isArray(list) || !list.length) { errs.push(id + ' ' + L + ': rules must be a non-empty list'); return; }
    list.forEach((r, k) => {
      const where = id + ' ' + L + '[' + k + ']';
      if (!r.src || !srcOk(r.src)) errs.push(where + ': unknown or missing src ' + r.src);
      if (r.basis != null && !inEnum('gamakaBasis', r.basis)) errs.push(where + ': basis ' + r.basis);
      if (!inEnum('gamakaBody', r.body || 'plain')) errs.push(where + ': body ' + r.body);
      if (!inEnum('gamakaOnset', r.onset || 'none')) errs.push(where + ': onset ' + r.onset);
      if (!inEnum('gamakaExit', r.exit || 'none')) errs.push(where + ': exit ' + r.exit);
      if (r.end != null && !inEnum('gamakaEnd', r.end)) errs.push(where + ': end ' + r.end);
      if (r.dwell != null && !inEnum('gamakaDwell', r.dwell)) errs.push(where + ': dwell ' + r.dwell);
      if (r.depth != null && !(r.depth >= 0 && r.depth <= 1)) errs.push(where + ': depth must be in [0, 1]');
      if (r.cycles != null && !(Array.isArray(r.cycles) && r.cycles.length === 2 && r.cycles.every(Number.isInteger) && r.cycles[0] >= 1 && r.cycles[0] <= r.cycles[1])) errs.push(where + ': cycles must be [min, max] with 1 <= min <= max');
      const w = r.when || {};
      Object.keys(w).forEach(kk => { if (!GAMAKA_WHEN.includes(kk)) errs.push(where + ': unknown condition ' + kk); });
      if (w.dir != null && !inEnum('gamakaDir', w.dir)) errs.push(where + ': dir ' + w.dir);
      ['prev', 'next'].forEach(kk => { if (w[kk] != null) { const n = resolveNeighbour(raga, w[kk]); if (n.error) errs.push(where + ' ' + kk + ': ' + n.error); } });
      if (w.inPhrase != null) { const ph = parsePhrase(raga, w.inPhrase); if (ph.error) errs.push(where + ' inPhrase: ' + ph.error); }
      const off = {};
      ['lo', 'hi', 'from'].forEach(kk => {
        if (r[kk] == null) return;
        const v = resolveTarget(raga, lm[L], r[kk]);
        if (typeof v !== 'number') { errs.push(where + ' ' + kk + ': ' + v.error); return; }
        if (Math.abs(v) > GAMAKA_MAX_OFFSET) errs.push(where + ' ' + kk + ': target ' + r[kk] + ' is ' + Math.abs(v) + ' semitones away (at most ' + GAMAKA_MAX_OFFSET + ')');
        off[kk] = v;
      });
      if (r.body === 'kampita' || r.body === 'andolita') {
        const lo = off.lo != null ? off.lo : 0, hi = off.hi != null ? off.hi : 0;
        if (!(lo < hi)) errs.push(where + ': lo must be below hi once resolved (' + r.lo + ', ' + r.hi + ')');
      }
    });
  });
  (gr.global || []).forEach((g, k) => {
    if (!srcOk(g.src)) errs.push(id + ' global[' + k + ']: unknown or missing src ' + g.src);
    if (g.maxChain != null && !(Number.isInteger(g.maxChain) && g.maxChain >= 1)) errs.push(id + ' global[' + k + ']: maxChain must be a positive integer');
  });
  return errs;
}

/* The engine form: rules keyed by pitch class, every target a semitone offset from the swara. Ragas
   without gamakaRender get the conservative default (§4): style light, basis default. */
export const GAMAKA_DEFAULT_SOURCES = ['S193', 'S198'];
export function compileGamaka(raga, gr) {
  if (!gr) return { style: 'light', basis: 'default', maxChain: 4, rules: {}, sources: GAMAKA_DEFAULT_SOURCES.slice() };
  const lm = letterMap(raga), rules = {}, sources = new Set();
  Object.entries(gr.rules || {}).forEach(([L, list]) => {
    const pc = lm[L];
    rules[pc] = list.map(r => {
      const w = r.when || {}, cw = {};
      if (w.dir != null && w.dir !== 'any') cw.dir = w.dir;
      if (w.minSec != null) cw.minSec = w.minSec;
      if (w.maxSec != null) cw.maxSec = w.maxSec;
      if (w.prev != null) cw.prev = resolveNeighbour(raga, w.prev);
      if (w.next != null) cw.next = resolveNeighbour(raga, w.next);
      if (w.janta) cw.janta = true;
      if (w.inPhrase != null) cw.inPhrase = parsePhrase(raga, w.inPhrase).pitches.map(mod12);
      if (w.octave != null) cw.octave = w.octave;
      const out = { when: cw, onset: r.onset || 'none', body: r.body || 'plain', exit: r.exit || 'none' };
      ['lo', 'hi', 'from'].forEach(k => { if (r[k] != null) out[k] = resolveTarget(raga, pc, r[k]); });
      if (out.body !== 'plain') { if (out.lo == null) out.lo = 0; if (out.hi == null) out.hi = 0; }
      if ((out.onset === 'nokku' || out.onset === 'odukkal') && out.from == null) out.from = resolveTarget(raga, pc, out.onset === 'nokku' ? '+1' : '-1');
      out.end = r.end || 'self';
      if (r.cycles) out.cycles = r.cycles.slice();
      if (r.dwell) out.dwell = r.dwell;
      out.depth = r.depth != null ? r.depth : 1;
      out.src = r.src; out.basis = r.basis || gr.basis || 'text';
      out.spec = Object.keys(cw).length;
      sources.add(r.src);
      return out;
    });
  });
  const mc = (gr.global || []).find(g => g.maxChain != null);
  (gr.global || []).forEach(g => sources.add(g.src));
  return { style: gr.style, basis: gr.basis, maxChain: mc ? mc.maxChain : 4, rules, sources: Array.from(sources).sort((a, b) => +a.slice(1) - +b.slice(1)) };
}

/* Validate a whole profile document. Returns a list of error strings (empty when valid). */
export function validateProfiles(doc, { fix = false } = {}) {
  const errs = [], E = engineRagas();
  const ids = Object.keys(E);
  const have = Object.keys(doc.ragas || {});
  ids.forEach(id => { if (!have.includes(id)) errs.push('missing raga ' + id); });
  have.forEach(id => { if (!E[id]) errs.push('unknown raga id ' + id); });
  const srcOk = s => !!(doc.sources && doc.sources[s]);
  have.filter(id => E[id]).forEach(id => {
    const raga = E[id], p = doc.ragas[id];
    if (p.scale.arohana !== scaleString(raga, 'arohana')) errs.push(id + ': arohana differs from the engine');
    if (p.scale.avarohana !== scaleString(raga, 'avarohana')) errs.push(id + ': avarohana differs from the engine');
    (p.phrases || []).forEach((ph, k) => {
      const c = checkPhrase(raga, ph.swaras);
      if (c.error) { errs.push(id + ' phrase ' + k + ' "' + ph.swaras + '": ' + c.error); return; }
      const feats = phraseFeatures(raga, c.pitches, c.anyaSwaras);
      if (fix) { ph.features = feats; ph.directionRuleOk = c.directionRuleOk; ph.inEngineRange = c.inEngineRange; ph.anyaSwaras = c.anyaSwaras; }
      if (JSON.stringify(ph.features) !== JSON.stringify(feats)) errs.push(id + ' phrase "' + ph.swaras + '": features should be ' + JSON.stringify(feats));
      if (ph.directionRuleOk !== c.directionRuleOk) errs.push(id + ' phrase "' + ph.swaras + '": directionRuleOk should be ' + c.directionRuleOk);
      if (ph.inEngineRange !== c.inEngineRange) errs.push(id + ' phrase "' + ph.swaras + '": inEngineRange should be ' + c.inEngineRange);
      if (JSON.stringify(ph.anyaSwaras || []) !== JSON.stringify(c.anyaSwaras)) errs.push(id + ' phrase "' + ph.swaras + '": anyaSwaras should be ' + JSON.stringify(c.anyaSwaras));
      if (!srcOk(ph.source)) errs.push(id + ' phrase "' + ph.swaras + '": unknown source ' + ph.source);
    });
    (p.avoid || []).forEach(a => {
      if (a.swaras != null) { const c = parsePhrase(raga, a.swaras); if (c.error) errs.push(id + ' avoid "' + a.swaras + '": ' + c.error); }
      if (!srcOk(a.source)) errs.push(id + ' avoid: unknown source ' + a.source);
    });
    if (p.gamakaRender != null) validateGamaka(raga, p.gamakaRender, doc).forEach(e => errs.push(e));
  });
  return errs;
}

function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const file = join(here, '..', 'data', 'raga-profiles.json');
  const fix = process.argv.includes('--fix');
  const doc = JSON.parse(readFileSync(file, 'utf8'));
  const errs = validateProfiles(doc, { fix });
  if (fix) {
    writeFileSync(file, JSON.stringify(doc, null, 2) + '\n');
    const left = validateProfiles(doc);
    if (left.length) { console.error(left.join('\n')); process.exit(1); }
    console.log('computed fields rewritten; ' + Object.keys(doc.ragas).length + ' ragas valid');
    return;
  }
  if (errs.length) { console.error(errs.length + ' problems:\n' + errs.join('\n')); process.exit(1); }
  const n = Object.values(doc.ragas).reduce((s, r) => s + r.phrases.length, 0);
  console.log(Object.keys(doc.ragas).length + ' ragas, ' + n + ' phrases: valid');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
