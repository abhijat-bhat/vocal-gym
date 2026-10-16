import { mod12 } from '../projection.js';
import { rng } from '../random.js';

/* Vocal Gym engine · gamaka resolver (docs/plans/gamaka-audio.md §3.1, 3.2, 4)
   For each note: work out its context, pick the raga's most specific matching rule (or the style
   default), apply the overrides, and return a shape for the contour builder. Shapes carry targets as
   semitone offsets from the note, already scaled by the rule's own depth. Nothing here changes notes. */

/* the raga's union scale as pitch classes, and offsets to the next swara up or down from a pitch */
export function scaleOf(raga) {
  const pcs = Array.from(new Set(raga.aro.concat(raga.avaro).map(mod12))).sort((a, b) => a - b);
  const step = (p, k) => {   // the pitch k raga swaras away from pitch p (p need not be a raga swara)
    let q = p, n = Math.abs(k), dir = Math.sign(k);
    while (n > 0) { q += dir; if (pcs.includes(mod12(q))) n--; }
    return q;
  };
  return { pcs, step, isNote: p => Number.isInteger(p) && pcs.includes(mod12(p)) };
}

/* context of note i among the sounding notes (rests break neighbours) */
export function contextOf(notes, i, slotSec, sc) {
  const n = notes[i], p = n.p;
  const prev = i > 0 && notes[i - 1].p != null ? notes[i - 1].p : null;
  const next = i < notes.length - 1 && notes[i + 1].p != null ? notes[i + 1].p : null;
  let dir;
  if (prev != null && next != null) {
    if (prev < p && p <= next) dir = 'up';
    else if (prev > p && p >= next) dir = 'down';
    else if ((p > prev && p > next) || (p < prev && p < next)) dir = 'turn';
    else dir = 'flat';
  } else if (prev != null) dir = p > prev ? 'up' : p < prev ? 'down' : 'flat';
  else if (next != null) dir = next > p ? 'up' : next < p ? 'down' : 'flat';
  else dir = 'flat';
  const leap = prev != null && Math.abs(countSteps(sc, prev, p)) >= 2;
  return { i, p, prev, next, dir, sec: n.dur * slotSec, janta: prev === p, leap, octave: Math.floor(p / 12) };
}
function countSteps(sc, a, b) {
  let k = 0, q = a; const d = Math.sign(b - a);
  while (q !== b && Math.abs(k) < 40) { q += d; if (sc.pcs.includes(mod12(q))) k += d; }
  return k;
}

function matches(w, ctx, notes) {
  if (w.dir && w.dir !== ctx.dir) return false;
  if (w.minSec != null && ctx.sec < w.minSec - 1e-9) return false;
  if (w.maxSec != null && ctx.sec > w.maxSec + 1e-9) return false;
  if (w.janta && !ctx.janta) return false;
  if (w.octave != null && w.octave !== ctx.octave) return false;
  const nb = (spec, q) => q != null && mod12(q) === spec.pc && (!spec.rel || (spec.rel === 'up' ? q > ctx.p : q < ctx.p));
  if (w.prev && !nb(w.prev, ctx.prev)) return false;
  if (w.next && !nb(w.next, ctx.next)) return false;
  if (w.inPhrase) {
    const pat = w.inPhrase, L = pat.length;
    let hit = false;
    for (let s = Math.max(0, ctx.i - L + 1); s <= ctx.i && !hit; s++) {
      if (s + L > notes.length) break;
      let k = 0; while (k < L && notes[s + k].p != null && mod12(notes[s + k].p) === pat[k]) k++;
      if (k === L) hit = true;
    }
    if (!hit) return false;
  }
  return true;
}

/* the style defaults (§4): S and P plain; long notes a light swing from the swara below; descending
   notes of 0.2 s or more touched from the swara above; the second note of a janta struck from below */
function styleDefault(style, ctx, sc) {
  const pc = mod12(ctx.p);
  if (style === 'plain') return null;
  if (pc === 0 || pc === 7) return { onset: 'none', body: 'plain', exit: 'none', src: 'S198', basis: 'default', why: 'S and P are held steady' };
  const depth = style === 'medium' ? 0.8 : 0.5, cyc = style === 'medium' ? [1, 2] : [1, 1];
  const below = sc.step(ctx.p, -1) - ctx.p, above = sc.step(ctx.p, 1) - ctx.p;
  const out = { onset: 'none', body: 'plain', exit: 'none', src: 'S198', basis: 'default', why: style + ' default' };
  if (ctx.sec >= 0.4 - 1e-9) Object.assign(out, { body: 'kampita', lo: below, hi: 0, cycles: cyc, end: 'self', depth });
  if (ctx.dir === 'down' && ctx.sec >= 0.2 - 1e-9) Object.assign(out, { onset: 'nokku', from: above });
  else if (ctx.janta) Object.assign(out, { onset: 'sphurita', from: below });
  return out;
}

/* choose a rule for each note and turn it into a shape */
export function resolveNotes(notes, opts, gamaka, raga) {
  const o = opts || {}, sc = scaleOf(raga), slotSec = o.slotSec;
  const style = o.style && o.style !== 'auto' ? o.style : gamaka.style;
  const rules = gamaka.rules || {};
  const out = new Array(notes.length);
  const sounding = notes.map(n => n.p != null);
  let lastSounding = -1; notes.forEach((n, k) => { if (n.p != null) lastSounding = k; });
  notes.forEach((n, i) => {
    if (n.p == null) { out[i] = null; return; }
    const ctx = contextOf(notes, i, slotSec, sc);
    let rule = null;
    if (style !== 'plain') {
      const list = (rules[mod12(n.p)] || []).map((r, k) => ({ r, k })).filter(x => matches(x.r.when || {}, ctx, notes));
      if (list.length) {
        const top = Math.max.apply(null, list.map(x => x.r.spec || 0));
        const tied = list.filter(x => (x.r.spec || 0) === top);
        let pick = tied[0];
        if (tied.length > 1 && o.variety > 0) {
          const rand = rng(((o.seed || 1) ^ (i * 2654435761)) >>> 0), ws = tied.map(x => x.r.weight || 1);
          let u = rand() * ws.reduce((a, b) => a + b, 0), k = 0; while (u > ws[k] && k < ws.length - 1) { u -= ws[k]; k++; }
          pick = tied[k];
        }
        rule = Object.assign({}, pick.r, { why: 'raga rule' });
      }
    }
    // heavy ragas leave unmentioned swaras to the light default
    if (!rule) rule = styleDefault(style === 'heavy' ? 'light' : style === 'default' ? 'light' : style, ctx, sc);
    out[i] = { ctx, rule: rule || { onset: 'none', body: 'plain', exit: 'none', src: null, basis: 'plain', why: 'plain style' } };
  });

  // shapes: offsets scaled by the rule's depth; janta-only and pair-only onsets checked against context
  const shapeOf = (rule, ctx) => {
    const d = rule.depth != null ? rule.depth : 1, sh = { onset: rule.onset || 'none', body: rule.body || 'plain', exit: rule.exit || 'none' };
    if (sh.onset === 'sphurita' && !ctx.janta) sh.onset = 'none';
    if (sh.onset === 'pratyahata' && !(ctx.next != null && ctx.next < ctx.p)) sh.onset = 'none';
    if (sh.onset !== 'none' && sh.onset !== 'jaru') sh.from = d * (rule.from != null ? rule.from : sh.onset === 'nokku' ? sc.step(ctx.p, 1) - ctx.p : sc.step(ctx.p, -1) - ctx.p);
    if (sh.body !== 'plain') Object.assign(sh, { lo: d * (rule.lo || 0), hi: d * (rule.hi || 0), end: rule.end || 'self', cycles: rule.cycles || [1, 1], dwell: rule.dwell });
    if (sh.exit === 'orikkai') sh.exitTo = d * (sc.step(ctx.p, 1) - ctx.p);
    sh.ruleDepth = d;
    return sh;
  };
  out.forEach((x, i) => { if (x) x.shape = shapeOf(x.rule, x.ctx); });

  // mora consistency: statements 2 and 3 reuse statement 1's template, moved along the scale
  const units = o.units, moraNotes = [];
  if (units) {
    let k = 0;
    units.forEach(u => { const idx = []; u.notes.forEach(() => idx.push(k++)); if (u.kind === 'mora') moraNotes.push(idx); });
  }
  if (moraNotes.length === 3) {
    const [m1] = moraNotes;
    for (let r = 1; r < 3; r++) {
      const mr = moraNotes[r];
      for (let k = 1; k <= Math.min(m1.length, mr.length); k++) {   // aligned from the end (gopuccha and srotovaha trim the front)
        const a = m1[m1.length - k], b = mr[mr.length - k];
        if (!out[a] || !out[b]) continue;
        const src = out[a], pa = notes[a].p, pb = notes[b].p, move = off => {
          if (off == null) return off;
          const target = pa + off;
          if (!sc.isNote(target)) return off;                     // cents or depth-scaled: keep the width
          const steps = countSteps(sc, pa, target), q = sc.step(pb, steps) - pb;
          return Math.abs(q) <= 7 ? q : off;
        };
        const sh = Object.assign({}, src.shape);
        ['from', 'lo', 'hi', 'exitTo'].forEach(f => { if (sh[f] != null) sh[f] = move(sh[f]); });
        if (sh.body !== 'plain' && !(sh.lo < sh.hi || (sh.lo === 0 && sh.hi === 0))) continue;   // illegal once moved: keep its own
        if (sh.onset === 'sphurita' && !out[b].ctx.janta) sh.onset = 'none';
        out[b] = Object.assign({}, out[b], { shape: sh, rule: Object.assign({}, src.rule, { why: 'mora: as statement 1' }) });
      }
    }
  }

  // overrides: leap, chain limit, landing. The chain counts oscillating bodies: a note touched by a
  // nokku or odukkal still keeps its constant-pitch anchor, so a descent flicked note by note is not a chain
  let chain = 0, chainBreaks = 0;
  const maxChain = gamaka.maxChain || 4, inMora = new Set(moraNotes.flat());   // mora statements keep statement 1's template
  out.forEach((x, i) => {
    if (!x) { chain = 0; return; }
    const sh = x.shape;
    if (sh.onset === 'jaru' && x.ctx.prev != null && Math.abs(x.ctx.p - x.ctx.prev) > 4 && x.rule.basis === 'default') sh.onset = 'none';
    const plain = sh.body === 'plain';
    if (!plain && chain >= maxChain && x.ctx.sec >= 0.15 - 1e-9 && !inMora.has(i)) {
      x.shape = { onset: 'none', body: 'plain', exit: 'none', ruleDepth: 1 };
      x.chainBreak = true; chainBreaks++; chain = 0;
    } else chain = plain ? 0 : chain + 1;
    if (o.landing !== false && i === lastSounding) {
      x.shape = Object.assign({}, x.shape, { body: 'plain', exit: 'none' });
      delete x.shape.lo; delete x.shape.hi;
      x.landing = true;
    }
  });
  return { resolved: out, chainBreaks, style, sounding };
}
