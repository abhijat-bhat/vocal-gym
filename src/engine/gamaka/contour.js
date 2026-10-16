import { TRANS_SEC, JARU_SEC, SAMPLE_SEC, MAX_SLOPE, LAND_HOLD } from './constants.js';
import { targets, cycleRange, isGamaka } from './shapes.js';

/* Vocal Gym engine · gamaka contour builder (docs/plans/gamaka-audio.md §3.3–3.5)
   buildContour(items, { slotSec, depth }) turns notes with shapes into a pitch contour.
     items: [{ p, dur, shape?, landing? }]   p in semitones (null for a rest), dur in slots
   Every note keeps its grid window [t0, t1]. A transition between two notes straddles the boundary
   (half in each, longer for jaru), so each swara's attack stays on its beat. Inside a note its
   targets are fitted by the degradation ladder: full shape, fewer cycles, onset and a CPN, plain.
   Transitions are half-cosine: p(u) = a + (b − a)(1 − cos πu) / 2 (S194).
   depth scales every target's distance from the note; depth 0 is exactly plain, stepped playback. */
const cosine = (a, b, u) => a + (b - a) * (1 - Math.cos(Math.PI * u)) / 2;
const minWidth = d => Math.abs(d) * (Math.PI / 2) * SAMPLE_SEC / MAX_SLOPE;   // keeps |Δp| per sample under MAX_SLOPE

/* Fit one note's targets into `avail` seconds. Returns { ts, level } with every target's dur set. */
function fitNote(shape, n, depth, avail, landing) {
  const [cmin, cmax] = cycleRange(shape);
  const tries = [];
  tries.push([0, cmax]);
  for (let c = cmax - 1; c >= 1; c--) tries.push([1, c]);
  if (cmin > 1 && !tries.some(x => x[1] === cmin)) tries.push([1, cmin]);
  tries.push([2, 0], [3, 0]);
  for (const [level, cycles] of tries) {
    const ts = targets(shape, n, depth, level, cycles, landing);
    const fixed = ts.reduce((s, t) => s + (t.flex ? t.min : t.dur), 0) + (ts.length - 1) * TRANS_SEC;
    if (fixed <= avail + 1e-9 || level === 3) {
      let spare = avail - fixed;
      if (spare < 0) {   // not even a plain note fits: the swara is a pure transition into the next one
        ts.forEach(t => { t.dur = 0; });
        return { ts: [Object.assign(ts[0], { dur: Math.max(0, avail) })], level, squeezed: true };
      }
      const flex = ts.filter(t => t.flex), w = t => t.role === 'head' ? 0.4 : t.role === 'end' ? 0.6 : 1;
      const wsum = flex.reduce((s, t) => s + w(t), 0);
      ts.forEach(t => { if (t.flex) t.dur = t.min + (wsum ? spare * w(t) / wsum : 0); });
      if (!flex.length) ts[ts.length - 1].dur += spare;
      return { ts, level: level === 0 && cycles < cmax ? 1 : level, cycles };
    }
  }
}

export function buildContour(items, opts) {
  const o = opts || {}, slotSec = o.slotSec, depth = o.depth == null ? 1 : o.depth;
  if (!(slotSec > 0)) throw new Error('buildContour needs slotSec > 0');
  const wscale = depth <= 0 ? 0 : Math.min(1, depth * 4);   // transitions vanish only at depth 0
  const N = items.length, t0s = [], t1s = [];
  let acc = 0;
  items.forEach(it => { t0s.push(acc * slotSec); acc += it.dur; t1s.push(acc * slotSec); });
  const sounding = i => i >= 0 && i < N && items[i].p != null;
  // boundary halves: R[i] after note i's start, L[i] before its end
  const R = new Array(N).fill(0), L = new Array(N).fill(0);
  for (let i = 0; i < N; i++) {
    if (!sounding(i)) continue;
    const sh = items[i].shape || {};
    if (sounding(i - 1)) R[i] = (sh.onset === 'jaru' ? JARU_SEC - TRANS_SEC / 2 : TRANS_SEC / 2) * wscale;
    if (sounding(i + 1)) L[i] = (sh.exit === 'jaru' ? JARU_SEC - TRANS_SEC / 2 : TRANS_SEC / 2) * wscale;
  }
  const fit = new Array(N);
  const fitAt = i => {
    const it = items[i], sec = t1s[i] - t0s[i];
    let r = R[i], l = L[i];
    if (r + l > sec) { const k = sec / (r + l); r *= k; l *= k; R[i] = r; L[i] = l; }
    fit[i] = fitNote(it.shape, it.p, depth, sec - r - l, it.landing ? LAND_HOLD : 0);
  };
  for (let i = 0; i < N; i++) if (sounding(i)) fitAt(i);
  // widen boundary transitions that would move faster than MAX_SLOPE per sample, and refit
  if (wscale > 0) for (let i = 1; i < N; i++) {
    if (!sounding(i) || !sounding(i - 1)) continue;
    const a = fit[i - 1].ts[fit[i - 1].ts.length - 1].p, b = fit[i].ts[0].p, need = minWidth(b - a);
    if (L[i - 1] + R[i] < need - 1e-12) {
      const k = need / Math.max(1e-9, L[i - 1] + R[i]);
      L[i - 1] = Math.max(L[i - 1] * k, need / 2); R[i] = Math.max(R[i] * k, need / 2);
      fitAt(i - 1); fitAt(i);
    }
  }
  // segments per legato group: holds and transitions in absolute time
  const groups = [], notes = [];
  let g = null;
  for (let i = 0; i < N; i++) {
    if (!sounding(i)) { if (g) { groups.push(g); g = null; } notes.push({ i, t0: t0s[i], t1: t1s[i], p: null, rest: true }); continue; }
    if (!g) g = { t0: t0s[i], t1: t1s[i], segs: [], notes: [] };
    const ts = fit[i].ts, abs = [];
    let cur = t0s[i] + R[i];
    ts.forEach((tg, k) => {
      const end = k === ts.length - 1 ? t1s[i] - L[i] : cur + tg.dur;
      g.segs.push({ a: cur, b: end, p0: tg.p, p1: tg.p });
      abs.push({ t: cur, dur: end - cur, p: tg.p, kind: tg.kind, role: tg.role });
      cur = end;
      if (k < ts.length - 1) { g.segs.push({ a: cur, b: cur + TRANS_SEC, p0: tg.p, p1: ts[k + 1].p }); cur += TRANS_SEC; }
    });
    if (sounding(i + 1)) g.segs.push({ a: t1s[i] - L[i], b: t1s[i] + R[i + 1], p0: ts[ts.length - 1].p, p1: null, next: i + 1 });
    g.t1 = t1s[i];
    // a plain shape is never degraded; anything else records how far down the ladder it went
    const sh = items[i].shape, plainShape = !sh || ((sh.body || 'plain') === 'plain' && (sh.onset || 'none') === 'none' && (sh.exit || 'none') === 'none');
    notes.push({ i, t0: t0s[i], t1: t1s[i], p: items[i].p, targets: abs, degraded: plainShape ? 0 : fit[i].level, gamaka: isGamaka(ts), shape: items[i].shape || null });
    g.notes.push(i);
  }
  if (g) groups.push(g);
  // resolve each boundary transition's end pitch, then sample
  groups.forEach(gr => gr.segs.forEach(s => { if (s.p1 === null) s.p1 = fit[s.next].ts[0].p; }));
  const points = [];
  groups.forEach(gr => {
    gr.points = [];
    let k = 0;
    const at = t => {
      while (k < gr.segs.length - 1 && (t >= gr.segs[k].b || gr.segs[k].b <= gr.segs[k].a)) k++;
      const s = gr.segs[k];
      if (s.b <= s.a) return s.p1;
      const u = Math.min(1, Math.max(0, (t - s.a) / (s.b - s.a)));
      return s.p0 === s.p1 ? s.p0 : cosine(s.p0, s.p1, u);
    };
    const first = Math.ceil(gr.t0 / SAMPLE_SEC - 1e-9);
    const ts = [gr.t0];
    for (let j = first; j * SAMPLE_SEC < gr.t1 - 1e-9; j++) if (j * SAMPLE_SEC > gr.t0 + 1e-9) ts.push(j * SAMPLE_SEC);
    ts.push(gr.t1);
    ts.forEach(t => { const pt = { t, p: at(t) }; gr.points.push(pt); points.push(pt); });
    delete gr.segs;
  });
  const sound = notes.filter(n => !n.rest);
  return {
    points, groups, notes,
    stats: {
      gamakaShare: sound.length ? sound.filter(n => n.gamaka).length / sound.length : 0,
      degradedShare: sound.length ? sound.filter(n => n.degraded > 0).length / sound.length : 0,
      staCount: sound.reduce((s, n) => s + n.targets.filter(x => x.kind === 'sta').length, 0)
    }
  };
}
