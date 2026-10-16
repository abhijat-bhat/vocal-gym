import { mod12 } from '../projection.js';
import { rng } from '../random.js';
import { allRagas } from '../ragas.js';
import { getProfile, getSource } from '../profiles.js';
import { buildContour } from './contour.js';
import { resolveNotes } from './resolve.js';

/* Vocal Gym engine · gamaka rendering (docs/plans/gamaka-audio.md)
   renderGamaka(notes, opts) turns a finished note list into a pitch contour with the raga's gamaka.
   It is a rendering layer only: it never changes the notes, and depth 0 is plain playback.
     notes  [{ p, dur }]  dur in slots; p === null is a rest (the kalpana output)
     opts   { raga | ragaId, slotSec, depth = 1, style = 'auto', seed = 1, variety = 0, humanize = 0,
              landing = true, units? }   units: kalpana's units, for mora consistency
   Returns { points: [{ t, p }], groups, notes: [{ i, t0, t1, p, rule, shape, form, src, basis, degraded }],
             stats: { gamakaShare, degradedShare, chainBreaks, staCount }, style, basis }. */
let RAGAS = null;
const ragaById = id => { if (!RAGAS) { const R = allRagas(); RAGAS = new Map(R.melakartas.concat(R.janyas).map(r => [r.id, r])); } return RAGAS.get(id) || null; };
const DEFAULT = { style: 'light', basis: 'default', maxChain: 4, rules: {}, sources: ['S193', 'S198'] };

function label(raga, p) {
  const r = Math.round(p);
  if (Math.abs(p - r) > 1e-6) return (p >= 0 ? '+' : '') + Math.round(p * 100) + 'c';
  const lab = raga.labels[mod12(r)] || '?';
  return lab + (r >= 12 ? "'" : r < 0 ? '.' : '');
}
/* the rule in words, naming its raga-note targets before the rule's depth scaled them */
function describe(raga, p, sh) {
  if (!sh) return 'plain';
  const d = sh.ruleDepth || 1, at = off => label(raga, p + off / d), parts = [];
  if (sh.onset && sh.onset !== 'none') parts.push(sh.onset + (sh.from != null ? ' from ' + at(sh.from) : ''));
  if (sh.body && sh.body !== 'plain') parts.push(sh.body + ' ' + at(sh.lo) + '–' + at(sh.hi) + (sh.end && sh.end !== 'self' ? ', resting on ' + (sh.end === 'hi' ? at(sh.hi) : at(sh.lo)) : '') + (d < 1 ? ' at depth ' + d : ''));
  else parts.push('plain');
  if (sh.exit && sh.exit !== 'none') parts.push(sh.exit);
  return parts.join(', ');
}
const shapeName = sh => !sh ? 'plain' : [sh.onset !== 'none' ? sh.onset : null, sh.body, sh.exit !== 'none' ? sh.exit : null].filter(Boolean).join('+');

/* the deterministic precision scatter of §3.6: sigma(t) = sqrt(sr² + ss² e^(−t/T)), in cents */
function humanizeOffsets(c, amount, seed) {
  if (!(amount > 0)) return;
  const rand = rng((seed || 1) * 7919 + 13), gauss = () => { let u = 0, v = 0; while (u === 0) u = rand(); v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const z = c.notes.map(() => gauss());
  let k = 0;
  c.points.forEach(pt => {
    while (k < c.notes.length - 1 && pt.t >= c.notes[k].t1) k++;
    const n = c.notes[k];
    if (n.p == null) return;
    const dt = pt.t - n.t0, sigma = Math.sqrt(8 * 8 + 40 * 40 * Math.exp(-dt / 0.15));
    pt.p += amount * z[k] * sigma / 100;
  });
}

export function renderGamaka(notes, opts) {
  const o = opts || {};
  const raga = o.raga && typeof o.raga === 'object' ? o.raga : ragaById(o.ragaId || o.raga);
  if (!raga) throw new Error('renderGamaka needs a raga (opts.raga or opts.ragaId)');
  if (!(o.slotSec > 0)) throw new Error('renderGamaka needs slotSec > 0');
  const prof = getProfile(raga), gamaka = (prof && prof.gamaka) || DEFAULT;
  const input = notes.map(n => ({ p: n.p, dur: n.dur }));   // the renderer works on a copy
  const { resolved, chainBreaks, style } = resolveNotes(input, o, gamaka, raga);
  const items = input.map((n, i) => ({ p: n.p, dur: n.dur, shape: resolved[i] ? resolved[i].shape : null, landing: !!(resolved[i] && resolved[i].landing) }));
  const c = buildContour(items, { slotSec: o.slotSec, depth: o.depth == null ? 1 : o.depth });
  humanizeOffsets(c, o.humanize, o.seed);
  c.notes.forEach(n => {
    const x = resolved[n.i];
    if (!x) return;
    n.rule = describe(raga, n.p, x.shape);
    n.shape = shapeName(x.shape);
    n.src = x.chainBreak ? 'S193' : x.rule.src || null;
    n.basis = x.chainBreak ? 'chain limit' : x.rule.basis || null;
    n.why = x.chainBreak ? 'plain after a long run of gamaka (chain limit)' : x.landing ? 'landing swara: held plain' : x.rule.why;
    n.source = n.src ? getSource(n.src) : null;
    n.ruleDepth = x.shape.ruleDepth;
    n.plainByRule = !!x.plainByRule;   // the raga (or the S and P default) holds this swara plain
    // the shape with its targets as raga-note pitches (before depth), for notation and teaching
    const sh = x.shape, d = sh.ruleDepth || 1, abs = off => off == null ? null : n.p + off / d;
    n.form = { onset: sh.onset, from: abs(sh.from), body: sh.body, lo: abs(sh.lo), hi: abs(sh.hi), exit: sh.exit };
  });
  return { points: c.points, groups: c.groups, notes: c.notes, stats: Object.assign(c.stats, { chainBreaks }), style, basis: gamaka.basis, sources: gamaka.sources };
}

export { buildContour } from './contour.js';
export * as GAMAKA_CONSTANTS from './constants.js';
