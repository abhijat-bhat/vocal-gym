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
