import { TRANS_SEC, JARU_SEC, SAMPLE_SEC, MAX_SLOPE, LAND_HOLD, MOVE_SEC, MOVE_PER_ST, MOVE_MAX, TURN_SEC, TURN_FULL, REACH_JITTER, TIME_JITTER,
  OVERSHOOT, OVERSHOOT_MAX, OVERSHOOT_PEAK, PREP, PREP_MAX, PREP_PEAK, DRIFT_CENTS, FLUTTER_CENTS,
  SEMITONE_SEC, LEAP_MAX, CYCLE_MIN, CYCLE_MAX, ANCHOR_SHARE, PEAK_CENTS, PEAK_SHORT } from './constants.js';
import { targets, cycleRange, isGamaka } from './shapes.js';
import { human, motion, clamp01 } from './intensity.js';
import { rng } from '../random.js';

/* Vocal Gym engine · gamaka contour builder (docs/plans/gamaka-audio.md §3.3–3.5)
   buildContour(items, { slotSec, depth, natural }) turns notes with shapes into a pitch contour.
     items: [{ p, dur, shape?, landing? }]   p in semitones (null for a rest), dur in slots
   Every note keeps its grid window [t0, t1]. A transition between two notes straddles the boundary
   (half in each, longer for jaru), so each swara's attack stays on its beat. Inside a note its
   targets are fitted by the degradation ladder: full shape, fewer cycles, onset and a CPN, plain.
   Transitions are half-cosine: p(u) = a + (b − a)(1 − cos πu) / 2 (S194).
   depth scales every target's distance from the note; depth 0 is exactly plain, stepped playback.
   natural: { intensity, seed } switches on the natural motion of docs/research/gamaka-naturalness.md
   §3.1: moves that take longer for wider intervals, stationary points as rounded turns, seeded
   variation of reach and timing, overshoot and preparation around CPNs, and fine fluctuation; and the
   timing of docs/research/gamaka-papers.md §3: a speed limit of 50 ms a semitone, oscillation cycles
   of 250–500 ms (fewer cycles at speed, not faster ones), anchors that take a long note's spare time
   first, and the overshoot of short peaks in deep oscillations.
   natural.motion (0–1) overrides the motion the intensity implies, and natural.glide scales the moves
   between swaras: the plain voice (renderGamaka's `voice`) uses both to sing straight notes legato.
   Without `natural` the contour is the v0.4 one, unchanged. */
const cosine = (a, b, u) => a + (b - a) * (1 - Math.cos(Math.PI * u)) / 2;
const minWidth = d => Math.abs(d) * (Math.PI / 2) * SAMPLE_SEC / MAX_SLOPE;   // keeps |Δp| per sample under MAX_SLOPE
// a move inside a swara's gamaka: about 80 ms for a semitone, and never faster than the speed limit
// of 50 ms a semitone (S210), up to LEAP_MAX. A step between swaras is sung, not pulled: it keeps the
// v0.5 timing, capped at MOVE_MAX (S193)
const stepSec = d => Math.min(MOVE_MAX, MOVE_SEC + MOVE_PER_ST * Math.max(0, Math.abs(d) - 1));
const moveSec = d => Math.max(stepSec(d), Math.min(LEAP_MAX, SEMITONE_SEC * Math.abs(d)));
const bump = x => x <= 0 ? 0 : x * x * Math.exp(2 * (1 - x));   // 0 with zero slope at 0, peak 1 at x = 1

/* the legacy geometry: v0.4 dwells and a fixed transition */
const LEGACY = { geo: null, move: () => TRANS_SEC, vary: () => {} };

/* natural geometry for note i: seeded per note, so a note's variation does not depend on the ladder rung */
function naturalKit(nat, i, n) {
  const r = rng(((nat.seed * 2654435761) ^ ((i + 1) * 40503)) >>> 0);
  const gauss = () => { let u = 0; while (u === 0) u = r(); return Math.max(-2, Math.min(2, Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()))); };
  const z = [], u = [];
  for (let k = 0; k < 24; k++) { z.push(gauss()); u.push(r()); }
  const turn = TURN_SEC + (TURN_FULL - TURN_SEC) * Math.min(1, Math.max(0, (nat.a - 0.6) / 0.4));
  return {
    geo: { sta: turn, flick: turn, orikkai: turn * 2, natural: true },
    tight: { sta: TURN_SEC, flick: TURN_SEC, orikkai: TURN_SEC * 2, natural: true },   // when time is short: standard turns
    // a swing between two turns of an oscillation obeys the speed limit; a flick or a move to a hold keeps the step timing
    move: (a, b, k, even, swing) => (swing ? moveSec(b - a) : stepSec(b - a)) * (even ? 1 : 1 + TIME_JITTER * nat.hum * u[k % u.length]),
    // a turn reaches a little more or less of its swing; the swara's own pitch never moves
    vary: ts => ts.forEach((t, k) => { if (t.kind === 'sta') t.p = n + (t.p - n) * (1 + REACH_JITTER * nat.hum * z[k % z.length]); }),
    // S210 §6.3.5: a short peak between two lower turns overshoots by 25 c per semitone of depth beyond
    // one (depth = min(3, rise, fall) − 1); an anchor is sustained and does not. The overshoot is sung,
    // not aimed at: the target keeps its raga pitch and only the contour goes past it
    peaks: ts => ts.forEach((t, k) => {
      if (t.kind !== 'sta' || t.anchor === 1 || t.dur > PEAK_SHORT + 1e-9 || !(t.role === 'hi' || t.role === 'lo')) return;
      const a = ts[k - 1], b = ts[k + 1];
      if (!a || !b) return;
      const depth = Math.max(0, Math.min(3, Math.round(t.p - a.p), Math.round(t.p - b.p)) - 1);
      if (depth > 0) t.peak = depth * PEAK_CENTS / 100 * nat.mot;
    })
  };
}

/* natural: no oscillation cycle is faster than CYCLE_MIN (its turns wait instead, so the ladder drops a
   cycle rather than hurrying it, S205), and each anchor learns how much it may slow, up to CYCLE_MAX */
function paceCycles(ts, moves) {
  for (let j = 0; j + 1 < ts.length; j++) {
    const a = ts[j], b = ts[j + 1];
    if (a.kind !== 'sta' || b.kind !== 'sta' || !(a.role === 'hi' || a.role === 'lo') || !(b.role === 'hi' || b.role === 'lo') || a.role === b.role || a.paced) continue;
    const wa = a.anchor || 0, wb = b.anchor || 0, ws = wa + wb || 2, sa = (wa || (ws === 2 ? 1 : 0)) / ws, sb = (wb || (ws === 2 ? 1 : 0)) / ws;
    const per = a.dur + b.dur + 2 * moves[j];
    if (per < CYCLE_MIN) { const d = CYCLE_MIN - per; a.dur += d * sa; a.min = a.dur; b.dur += d * sb; b.min = b.dur; }
    const room = Math.max(0, CYCLE_MAX - Math.max(per, CYCLE_MIN));
    a.room = room * (a.anchor ? sa : 0); b.room = room * (b.anchor ? sb : 0);
    a.paced = b.paced = true;
    j++;
  }
  // an anchor left without a partner (next to a hold at its own swara) may still slow a little
  ts.forEach(t => { if (t.kind === 'sta' && t.anchor && !t.paced) t.room = (CYCLE_MAX - CYCLE_MIN) * t.anchor; });
}

/* Fit one note's targets into `avail` seconds. Returns { ts, level, moves } with every target's dur set. */
function fitNote(shape, n, depth, avail, landing, K) {
  const [cmin, cmax] = cycleRange(shape);
  const tries = [];
  tries.push([0, cmax]);
  for (let c = cmax - 1; c >= 1; c--) tries.push([1, c]);
  if (cmin > 1 && !tries.some(x => x[1] === cmin)) tries.push([1, cmin]);
  if (K.geo && cmax >= 1) tries.push([1, 0.5]);   // natural: a truncated inflexion before dropping the body
  tries.push([2, 0], [3, 0]);
  // each rung is tried with its timing variation and firm turns, then evenly timed with standard turns:
  // neither costs a gamaka
  const attempts = [];
  tries.forEach(([level, cycles]) => { attempts.push([level, cycles, false]); if (K.geo && level < 3) attempts.push([level, cycles, true]); });
  for (const [level, cycles, even] of attempts) {
    const ts = targets(shape, n, depth, level, cycles, landing, even ? K.tight : K.geo);
    K.vary(ts);
    if (K.geo) K.peaks(ts);
    const turnOf = x => x.kind === 'sta' && (x.role === 'hi' || x.role === 'lo');
    const moves = ts.slice(1).map((t, k) => K.move(ts[k].p, t.p, k, even, turnOf(ts[k]) && turnOf(t)));
    if (K.geo) paceCycles(ts, moves);
    const fixed = ts.reduce((s, t) => s + (t.flex ? t.min : t.dur), 0) + moves.reduce((s, m) => s + m, 0);
    if (fixed <= avail + 1e-9 || level === 3) {
      let spare = avail - fixed;
      if (spare < 0 && level === 3) {   // not even a plain note fits: the swara is a pure transition into the next one
        ts.forEach(t => { t.dur = 0; });
        return { ts: [Object.assign(ts[0], { dur: Math.max(0, avail) })], level, squeezed: true, moves: [] };
      }
      spare = Math.max(0, spare);   // a rung that fits within rounding keeps its shape
      // natural: a prolonged oscillation first slows on its anchors (the voice stays on the anchor and
      // moves in spurts, S205), up to CYCLE_MAX a cycle; the holds take the rest
      const anchors = ts.filter(t => t.room > 0), room = anchors.reduce((s, t) => s + t.room, 0);
      if (room > 0 && spare > 0) {
        const give = Math.min(room, spare * (ts.some(t => t.flex) ? ANCHOR_SHARE : 1));
        anchors.forEach(t => { t.dur += give * t.room / room; });
        spare -= give;
      }
      const flex = ts.filter(t => t.flex), w = t => t.role === 'head' ? 0.4 : t.role === 'end' ? 0.6 : 1;
      const wsum = flex.reduce((s, t) => s + w(t), 0);
      ts.forEach(t => { if (t.flex) t.dur = t.min + (wsum ? spare * w(t) / wsum : 0); });
      if (!flex.length) ts[ts.length - 1].dur += spare;
      return { ts, level: level === 0 && cycles < cmax ? 1 : level, cycles, moves };
    }
  }
}

/* seeded fine fluctuation: a slow drift and a fast flutter, each three incommensurate sines (S200, S194) */
function fluctuation(seed, scale) {
  const r = rng(((seed * 7919) ^ 0x5bd1e995) >>> 0), comps = [];
  const add = (lo, hi, rms) => { const amp = rms / 100 / Math.sqrt(1.5) * scale; for (let k = 0; k < 3; k++) comps.push([amp, 2 * Math.PI * (lo + (hi - lo) * r()), 2 * Math.PI * r()]); };
  add(0.4, 1.8, DRIFT_CENTS); add(6, 11, FLUTTER_CENTS);
  return t => comps.reduce((s, c) => s + c[0] * Math.sin(c[1] * t + c[2]), 0);
}

export function buildContour(items, opts) {
  const o = opts || {}, slotSec = o.slotSec, depth = o.depth == null ? 1 : o.depth;
  if (!(slotSec > 0)) throw new Error('buildContour needs slotSec > 0');
  const nat = o.natural && depth > 0 ? (a => ({ a, seed: (o.natural.seed || 1) >>> 0, hum: human(a), mot: o.natural.motion != null ? clamp01(o.natural.motion) : motion(a),
    glide: o.natural.glide > 0 ? o.natural.glide : 1 }))(clamp01(o.natural.intensity == null ? 1 : o.natural.intensity)) : null;
  const wscale = depth <= 0 ? 0 : nat ? 1 : Math.min(1, depth * 4);   // transitions vanish only at depth 0
  const N = items.length, t0s = [], t1s = [];
  let acc = 0;
  items.forEach(it => { t0s.push(acc * slotSec); acc += it.dur; t1s.push(acc * slotSec); });
  const sounding = i => i >= 0 && i < N && items[i].p != null;
  const kits = items.map((it, i) => nat && it.p != null ? naturalKit(nat, i, it.p) : LEGACY);
  // where a note's shape starts and ends, before fitting: a boundary costs the distance the voice travels
  const rc = (sh, k) => sh.reach && sh.reach[k] != null ? sh.reach[k] : 1;
  const firstP = it => {
    const sh = it.shape;
    if (sh && sh.from != null && sh.onset && sh.onset !== 'none' && sh.onset !== 'jaru') return it.p + depth * rc(sh, 'onset') * sh.from;
    // an oscillation that flows in from the previous swara starts on its extreme (natural only)
    if (nat && sh && sh.flowIn && sh.body && sh.body !== 'plain') return it.p + depth * rc(sh, 'body') * (sh.flowIn === 'hi' ? sh.hi : sh.lo);
    return it.p;
  };
  const lastP = it => {
    const sh = it.shape;
    if (!sh) return it.p;
    if (sh.exit === 'orikkai') return it.p + depth * rc(sh, 'exit') * (sh.exitTo != null ? sh.exitTo : 1);
    if (sh.body && sh.body !== 'plain' && (sh.end === 'hi' || sh.end === 'lo')) return it.p + depth * rc(sh, 'body') * (sh.end === 'hi' ? sh.hi : sh.lo);
    return it.p;
  };
  // half of the transition across the boundary before note i (a touch from the swara just sung needs almost none)
  const half = i => {
    if (!nat) return TRANS_SEC / 2;
    const d = firstP(items[i]) - lastP(items[i - 1]);
    return Math.abs(d) < 0.05 ? 0.01 : stepSec(d) / 2 * nat.glide;
  };
  // boundary halves: R[i] after note i's start, L[i] before its end
  const R = new Array(N).fill(0), L = new Array(N).fill(0);
  for (let i = 0; i < N; i++) {
    if (!sounding(i)) continue;
    const sh = items[i].shape || {};
    // a jaru makes the whole boundary JARU_SEC long; in the natural contour only where the pitch moves
    const slide = (h, j) => nat ? (items[j].p !== items[j - 1].p ? Math.max(h, JARU_SEC - h) : h) : JARU_SEC - h;
    if (sounding(i - 1)) { const h = half(i); R[i] = (sh.onset === 'jaru' ? slide(h, i) : h) * wscale; }
    if (sounding(i + 1)) { const h = half(i + 1); L[i] = (sh.exit === 'jaru' ? slide(h, i + 1) : h) * wscale; }
  }
  const fit = new Array(N);
  const fitAt = i => {
    const it = items[i], sec = t1s[i] - t0s[i];
    let r = R[i], l = L[i];
    if (r + l > sec) { const k = sec / (r + l); r *= k; l *= k; R[i] = r; L[i] = l; }
    fit[i] = fitNote(it.shape, it.p, depth, sec - r - l, it.landing ? LAND_HOLD : 0, kits[i]);
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
    const ts = fit[i].ts, moves = fit[i].moves, abs = [];
    const sung = tg => tg.p + (tg.peak || 0);   // the pitch the voice reaches: a short deep peak overshoots
    let cur = t0s[i] + R[i];
    ts.forEach((tg, k) => {
      const end = k === ts.length - 1 ? t1s[i] - L[i] : cur + tg.dur;
      g.segs.push({ a: cur, b: end, p0: sung(tg), p1: sung(tg), kind: tg.kind });
      abs.push({ t: cur, dur: end - cur, p: tg.p, kind: tg.kind, role: tg.role });
      cur = end;
      if (k < ts.length - 1) { g.segs.push({ a: cur, b: cur + moves[k], p0: sung(tg), p1: sung(ts[k + 1]) }); cur += moves[k]; }
    });
    if (sounding(i + 1)) g.segs.push({ a: t1s[i] - L[i], b: t1s[i] + R[i + 1], p0: ts[ts.length - 1].p, p1: null, next: i + 1 });
    g.t1 = t1s[i];
    // a plain shape is never degraded; anything else records how far down the ladder it went
    const sh = items[i].shape, plainShape = !sh || ((sh.body || 'plain') === 'plain' && (sh.onset || 'none') === 'none' && (sh.exit || 'none') === 'none');
    notes.push({ i, t0: t0s[i], t1: t1s[i], p: items[i].p, targets: abs, degraded: plainShape ? 0 : fit[i].level, gamaka: isGamaka(ts), shape: items[i].shape || null });
    g.notes.push(i);
  }
  if (g) groups.push(g);
  // resolve each boundary transition's end pitch
  groups.forEach(gr => gr.segs.forEach(s => { if (s.p1 === null) s.p1 = fit[s.next].ts[0].p; }));
  // natural motion: overshoot after arriving on a CPN, preparation before leaving one (S200)
  if (nat && nat.mot > 0) groups.forEach(gr => gr.segs.forEach((s, j) => {
    if (s.p0 !== s.p1 || s.kind !== 'cpn' || !(s.b > s.a)) return;
    const prev = gr.segs[j - 1], next = gr.segs[j + 1];
    const into = prev && prev.p0 !== prev.p1 ? s.p0 - prev.p0 : 0, out = next && next.p0 !== next.p1 ? next.p1 - s.p0 : 0;
    s.over = Math.sign(into) * Math.min(OVERSHOOT_MAX, OVERSHOOT * Math.abs(into)) * nat.mot;
    s.prep = -Math.sign(out) * Math.min(PREP_MAX, PREP * Math.abs(out)) * nat.mot;
  }));
  const fluct = nat && nat.mot > 0 ? fluctuation(nat.seed, nat.mot) : null;
  const points = [];
  groups.forEach(gr => {
    gr.points = [];
    let k = 0;
    const at = t => {
      while (k < gr.segs.length - 1 && (t >= gr.segs[k].b || gr.segs[k].b <= gr.segs[k].a)) k++;
      const s = gr.segs[k];
      if (s.b <= s.a) return s.p1;
      const u = Math.min(1, Math.max(0, (t - s.a) / (s.b - s.a)));
      if (s.p0 !== s.p1) return cosine(s.p0, s.p1, u);
      let p = s.p0;
      if (s.over || s.prep) {
        const D = s.b - s.a, tin = t - s.a, tout = s.b - t;
        // each deflection is zero at both ends of the hold, so the curve stays continuous
        if (s.over) p += s.over * bump(tin / OVERSHOOT_PEAK) * Math.min(1, D / (2 * OVERSHOOT_PEAK)) * Math.min(1, tout / (0.3 * D));
        if (s.prep) p += s.prep * bump(tout / PREP_PEAK) * Math.min(1, D / (2 * PREP_PEAK)) * Math.min(1, tin / (0.3 * D));
      }
      return p;
    };
    const first = Math.ceil(gr.t0 / SAMPLE_SEC - 1e-9);
    const ts = [gr.t0];
    for (let j = first; j * SAMPLE_SEC < gr.t1 - 1e-9; j++) if (j * SAMPLE_SEC > gr.t0 + 1e-9) ts.push(j * SAMPLE_SEC);
    ts.push(gr.t1);
    ts.forEach(t => { const pt = { t, p: at(t) + (fluct ? fluct(t) : 0) }; gr.points.push(pt); points.push(pt); });
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
