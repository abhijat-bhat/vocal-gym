import { rng, soft, dial } from '../random.js';
import { makeProjector, mod12 } from '../projection.js';
import { getProfile } from '../profiles.js';
import { CELL_DEFS, CELLS } from './devices.js';
import { KALPANA_RANGE, eduppuNeighbours, approachScore } from './landing.js';

/* Vocal Gym engine · kalpana swaras: device-based generation with a guaranteed landing
   kalpanaRound(raga, opts) returns a round or { error, code }; kalpana(raga, opts) returns the
   round or null, as in v0.2.
   opts.eduppuPitch  the swara the composition resumes on (not part of the round). The round ends
                     on lo(e) or hi(e), so the step into the eduppu is legal. Wins over targetPitch.
   opts.targetPitch  deprecated: the last swara of the round itself (v0.2 meaning). */
const fail = (code, error) => ({ error, code });
const swaraName = (raga, p) => (raga.labels[mod12(p)] || '?') + (p >= 12 ? "'" : p < 0 ? '.' : '');

function kalpanaRound(raga, opts) {
  const o = opts || {};
  const aksharas = o.aksharas, per = o.perAkshara, D = dial(o.T == null ? 1 : o.T), rand = rng(o.seed || 1);
  const slots = aksharas * per, startPitch = o.startPitch, ending = o.ending || 'auto';
  const Pj = makeProjector(raga);
  const pcs = Array.from(new Set(raga.aro.concat(raga.avaro).map(mod12))).sort((a, b) => a - b);
  const notes = []; for (let oct = -1; oct <= 1; oct++) pcs.forEach(pc => { const p = pc + 12 * oct; if (p >= KALPANA_RANGE[0] && p <= KALPANA_RANGE[1]) notes.push(p); });
  notes.sort((a, b) => a - b);
  const NN = notes.length, ix = p => notes.indexOf(p);
  const s0 = ix(startPitch);
  if (!(slots >= 1)) return fail('bad-length', 'The round needs at least one slot.');
  if (s0 < 0) return fail('start-not-in-raga', 'The opening swara is not a swara of ' + raga.name + ' inside the kalpana range (mandra Pa to tara Pa).');

  // the landing: next to the eduppu swara, or (deprecated) the target swara itself
  const useEduppu = o.eduppuPitch != null, e = o.eduppuPitch;
  let targets;
  if (useEduppu) {
    const nb = eduppuNeighbours(raga, e);
    if (nb.error) return fail(nb.code, nb.error);
    if (!nb.inRange) return fail('eduppu-out-of-range', 'The eduppu swara ' + swaraName(raga, e) + ' is outside the kalpana range (mandra Pa to tara Pa).');
    targets = [{ p: nb.lo, approach: 'below' }, { p: nb.hi, approach: 'above' }].filter(x => x.p != null && ix(x.p) >= 0);
    if (!targets.length) return fail('no-neighbour', 'No swara of ' + raga.name + ' inside the kalpana range steps legally into the eduppu swara.');
  } else {
    if (o.targetPitch == null) return fail('no-landing', 'Give eduppuPitch, the swara the composition resumes on.');
    if (ix(o.targetPitch) < 0) return fail('target-not-in-raga', 'The landing swara is not a swara of ' + raga.name + ' inside the kalpana range.');
    targets = [{ p: o.targetPitch, approach: null }];
  }

  const app = CELLS.map(c => {
    const row = new Array(NN);
    for (let i = 0; i < NN; i++) {
      let cur = i, ok = true; const seq = [];
      for (const [dl, du] of c.shape) {
        const j = cur + dl;
        if (j < 0 || j >= NN || !Pj.valid(notes[cur], notes[j])) { ok = false; break; }
        seq.push({ j, dur: du }); cur = j;
      }
      row[i] = ok ? { end: cur, seq } : null;
    }
    return row;
  });
  // forward reachability from the opening swara
  const fwd = Array.from({ length: slots + 1 }, () => new Uint8Array(NN));
  [1, 2].forEach(d0 => { if (d0 <= slots) fwd[d0][s0] = 1; });
  for (let t = 1; t < slots; t++) for (let i = 0; i < NN; i++) if (fwd[t][i])
    for (let ci = 0; ci < CELLS.length; ci++) { const a = app[ci][i]; if (a && t + CELLS[ci].len <= slots) fwd[t + CELLS[ci].len][a.end] = 1; }

  // endings: free, or a mora (phrase x3 with equal karvai, last swara = landing swara)
  const moraAllowed = ending !== 'free' && (ending === 'mora' || aksharas >= 7) && slots >= 8;
  function moraOptions(tg) {
    const moraOpts = [];
    if (!moraAllowed) return moraOpts;
    const phrases = [];
    (function grow(seq) {
      if (seq.length >= 3) phrases.push(seq.slice());   // a mora phrase has three or four swaras
      if (seq.length === 4) return;
      for (let dl = -2; dl <= 2; dl++) {
        if (!dl) continue;
        const j = seq[0] - dl;
        if (j < 0 || j >= NN || !Pj.valid(notes[j], notes[seq[0]])) continue;
        seq.unshift(j); grow(seq); seq.shift();
      }
    })([tg]);
    phrases.forEach(ph => {
      const f = ph[0], u = ph.length;
      if (f === tg || !Pj.valid(notes[tg], notes[f])) return;
      for (let q = 0; q <= 2 * per; q++) {
        const total = 3 * u + 2 * q, B = slots - total;
        if (B < Math.max(2, per) || total > 0.6 * slots) continue;
        let feas = false; for (let i = 0; i < NN && !feas; i++) if (fwd[B][i] && i !== f && Pj.valid(notes[i], notes[f])) feas = true;
        if (!feas) continue;
        const steps = []; for (let k = 1; k < u; k++) steps.push(ph[k] - ph[k - 1]);
        const allStep = steps.every(s => Math.abs(s) === 1), onBeat = B % per === 0 && (u + q) % per === 0;
        const F = (allStep ? 0.8 : 0) + (onBeat ? 0.9 : 0) + (q <= per ? 0.3 : 0) + (u === 3 ? 0.3 : 0) + (notes[ph[u - 2]] < notes[tg] ? 0.2 : 0);
        const N = (allStep ? 0 : 0.7) + (onBeat ? 0 : 0.7) + (notes[ph[u - 2]] > notes[tg] ? 0.3 : 0);
        moraOpts.push({ ph, q, B, F, N });
      }
    });
    return moraOpts;
  }

  // which landings can finish under the requested ending
  let cands = targets.map(x => { const tg = ix(x.p); return Object.assign({ tg, freeOK: !!fwd[slots][tg], moraOpts: moraOptions(tg) }, x); });
  cands = cands.filter(x => ending === 'free' ? x.freeOK : x.freeOK || x.moraOpts.length);
  if (ending === 'mora' && cands.some(x => x.moraOpts.length)) cands = cands.filter(x => x.moraOpts.length);
  if (!cands.length) {
    const names = targets.map(x => swaraName(raga, x.p)).join(' or ');
    return fail('unreachable', useEduppu
      ? 'No legal round of ' + slots + ' slots moves from ' + swaraName(raga, startPitch) + ' to ' + names + ', the neighbours of the eduppu swara ' + swaraName(raga, e) + '. Lengthen the round or pick closer swaras.'
      : 'No legal round of ' + slots + ' slots moves from ' + swaraName(raga, startPitch) + ' to ' + names + '. Lengthen the round or pick closer swaras.');
  }
  // choose between the two neighbours (only sampled when there is a real choice, so v0.2 callers keep their rounds)
  const profile = getProfile(raga);
  const pick = cands.length === 1 ? cands[0] : cands[soft(cands.map(x => (1 - D.c) * approachScore(e, x, profile)), D.tau, rand)];
  const { tg, freeOK, moraOpts } = pick, targetPitch = pick.p;

  let endType;
  if (ending === 'mora' && moraOpts.length) endType = 'mora';
  else if (ending === 'free' && freeOK) endType = 'free';
  else if (moraOpts.length && freeOK) endType = soft([(1 - D.c) * 0 + D.c * 0.6, (1 - D.c) * 1.0], D.tau, rand) === 1 ? 'mora' : 'free';
  else if (moraOpts.length) endType = 'mora';
  else endType = 'free';
  let mora = null, B = slots, inSet;
  if (endType === 'mora') {
    mora = moraOpts[soft(moraOpts.map(m => (1 - D.c) * m.F + D.c * m.N), D.tau, rand)];
    B = mora.B; const f = mora.ph[0];
    inSet = i => i !== f && Pj.valid(notes[i], notes[f]);
  } else inSet = i => i === tg;
  // backward feasibility for the body
  const bwd = Array.from({ length: B + 1 }, () => new Uint8Array(NN));
  for (let i = 0; i < NN; i++) bwd[B][i] = inSet(i) ? 1 : 0;
  for (let t = B - 1; t >= 1; t--) for (let i = 0; i < NN; i++) {
    for (let ci = 0; ci < CELLS.length; ci++) { const a = app[ci][i]; if (a && t + CELLS[ci].len <= B && bwd[t + CELLS[ci].len][a.end]) { bwd[t][i] = 1; break; } }
  }
  const d0s = [1, 2].filter(d => d <= B && bwd[d][s0]);
  if (!d0s.length) return fail('unreachable', 'No legal round of ' + slots + ' slots moves from ' + swaraName(raga, startPitch) + ' to ' + swaraName(raga, targetPitch) + '. Lengthen the round or pick closer swaras.');
  const d0 = d0s[soft(d0s.map(d => d === 1 ? (1 - D.c) * 0.5 : (1 - D.c) * 0.1 + D.c * 0.3), D.tau, rand)];
  const units = [{ kind: 'start', base: 'start', name: 'opening swara', dir: 0, t: 0, notes: [{ p: startPitch, dur: d0 }] }];
  const centre = Math.max(2, Math.min(10, (startPitch + targetPitch) / 2 + 2));
  let t = d0, i = s0, prev = null;
  while (t < B) {
    const cand = [];
    for (let ci = 0; ci < CELLS.length; ci++) {
      const c = CELLS[ci], a = app[ci][i];
      if (a && t + c.len <= B && bwd[t + c.len][a.end]) cand.push({ c, a });
    }
    const scores = cand.map(({ c, a }) => {
      const ps = a.seq.map(x => notes[x.j]);
      let F = c.F0, N = c.N0;
      if (t % per === 0) F += 0.6; else { F -= 0.4; N += 0.5; }
      if (c.len % per === 0) F += 0.4; else if (per > 1) N += 0.4;
      if (prev && prev.base === c.base && prev.dir === c.dir) { F += 0.5; N -= 0.4; }
      if (prev && prev.id === c.id && prev.startP === ps[0]) { F += 0.2; N -= 1.0; }
      const last = a.seq[a.seq.length - 1];
      if (last.dur === 2) { if ((mod12(notes[last.j]) === 0 || mod12(notes[last.j]) === 7) && (t + c.len) % per === 0) F += 0.6; else N += 0.3; }
      const avg = ps.reduce((s, p) => s + p, 0) / ps.length;
      F -= 0.06 * Math.abs(avg - centre);
      if (ps.some(p => p > 12 || p < 0)) { N += 0.5; F -= 0.3; }
      if (prev && prev.dir && c.dir !== prev.dir) N += 0.3;
      return (1 - D.c) * F + D.c * N;
    });
    const ch = cand[soft(scores, D.tau, rand)];
    units.push({ kind: ch.c.kind, base: ch.c.base, id: ch.c.id, name: ch.c.name, dir: ch.c.dir, t, notes: ch.a.seq.map(x => ({ p: notes[x.j], dur: x.dur })) });
    prev = { base: ch.c.base, id: ch.c.id, dir: ch.c.dir, startP: notes[ch.a.seq[0].j] };
    t += ch.c.len; i = ch.a.end;
  }
  if (mora) {
    for (let r = 0; r < 3; r++) {
      const ns = mora.ph.map((j, k) => ({ p: notes[j], dur: k === mora.ph.length - 1 && r < 2 ? 1 + mora.q : 1 }));
      units.push({ kind: 'mora', base: 'mora', name: 'mora ' + (r + 1) + ' of 3', dir: 0, t, notes: ns });
      t += ns.reduce((s, n) => s + n.dur, 0);
    }
  }
  const notesOut = []; units.forEach(u => u.notes.forEach(n => notesOut.push(n)));
  const slotsOf = u => u.notes.reduce((s, n) => s + n.dur, 0);
  let nov = 0, conv = 0; const devices = {};
  units.forEach(u => {
    const L = slotsOf(u);
    if (u.kind === 'nov') nov += L; else if (u.kind === 'conv' || u.kind === 'mora') conv += L;
    if (u.kind === 'conv' || u.kind === 'nov') { const k = u.name + (u.dir > 0 ? ' ↑' : u.dir < 0 ? ' ↓' : ''); devices[k] = (devices[k] || 0) + 1; }
  });
  const endInfo = mora ? { type: 'mora', phrase: mora.ph.map(j => notes[j]), q: mora.q, start: mora.B } : (ending === 'mora' ? { type: 'free', fallbackFrom: 'mora' } : { type: 'free' });
  if (useEduppu) Object.assign(endInfo, { eduppu: e, final: targetPitch, approach: pick.approach });
  return {
    notes: notesOut, slots, units,
    ending: endInfo,
    stats: { novelShare: nov / slots, convShare: conv / slots, devices },
    dial: D
  };
}

function kalpana(raga, opts) {
  const res = kalpanaRound(raga, opts);
  return res.error ? null : res;
}

export { CELL_DEFS, CELLS, KALPANA_RANGE, eduppuNeighbours, kalpana, kalpanaRound };
