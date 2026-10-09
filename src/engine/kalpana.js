import { rng, soft, dial } from './random.js';
import { makeProjector, mod12 } from './projection.js';

/* Vocal Gym engine · kalpana swaras: device-based generation with a guaranteed landing
   Devices are short melodic cells, written as steps through the raga's own swaras.
   Conventional devices are the ones listeners recognise (runs, janta, dattu, sequences,
   a run into a held nyasa swara, the mora ending). Unconventional devices are still legal
   in the raga but less expected (leaps, arpeggios, zig-zags, syncopated holds). */
const CELL_DEFS = [
  // id, name, kind, F0 (familiarity prior), N0 (novelty prior), steps [[degree step, duration], ...]
  ['step', 'step', 'step', 0.2, -0.2, [[1, 1]]],
  ['skip', 'skip', 'step', 0.0, 0.2, [[2, 1]]],
  ['hold', 'held step', 'step', 0.1, -0.1, [[1, 2]]],
  ['run3', 'run', 'conv', 1.0, -0.4, [[1, 1], [1, 1], [1, 1]]],
  ['run4', 'run', 'conv', 1.1, -0.5, [[1, 1], [1, 1], [1, 1], [1, 1]]],
  ['run5', 'run', 'conv', 0.9, -0.5, [[1, 1], [1, 1], [1, 1], [1, 1], [1, 1]]],
  ['janta', 'janta', 'conv', 0.9, -0.2, [[1, 1], [0, 1], [1, 1], [0, 1]]],
  ['janta3', 'janta', 'conv', 0.8, -0.3, [[1, 1], [0, 1], [1, 1], [0, 1], [1, 1], [0, 1]]],
  ['dattu', 'dattu', 'conv', 0.7, 0.1, [[2, 1], [-1, 1], [2, 1], [-1, 1]]],
  ['turn', 'turn', 'conv', 0.6, 0.0, [[1, 1], [1, 1], [-1, 1]]],
  ['seq3', 'sequence of threes', 'conv', 1.1, -0.3, [[1, 1], [1, 1], [1, 1], [-1, 1], [1, 1], [1, 1]]],
  ['seq3x3', 'sequence of threes', 'conv', 1.0, -0.4, [[1, 1], [1, 1], [1, 1], [-1, 1], [1, 1], [1, 1], [-1, 1], [1, 1], [1, 1]]],
  ['seq4', 'sequence of fours', 'conv', 1.0, -0.4, [[1, 1], [1, 1], [1, 1], [1, 1], [-2, 1], [1, 1], [1, 1], [1, 1]]],
  ['cad', 'run into a held swara', 'conv', 0.9, -0.3, [[1, 1], [1, 1], [1, 2]]],
  ['leap3', 'leap', 'nov', -0.6, 0.8, [[3, 1]]],
  ['leap4', 'wide leap', 'nov', -1.0, 1.0, [[4, 1]]],
  ['arp', 'arpeggio', 'nov', -0.4, 1.0, [[2, 1], [2, 1], [2, 1]]],
  ['leapfill', 'leap and fall back', 'nov', -0.3, 0.9, [[3, 1], [-1, 1], [-1, 1]]],
  ['zigzag', 'zig-zag', 'nov', -0.8, 1.1, [[2, 1], [-3, 1], [2, 1]]],
  ['synco', 'syncopated hold', 'nov', -0.3, 0.7, [[1, 2], [1, 1]]],
  ['skipjanta', 'displaced janta', 'nov', -0.2, 0.8, [[2, 1], [0, 1], [-1, 1], [0, 1]]]
];
const CELLS = (function () {
  const out = [];
  CELL_DEFS.forEach(b => [1, -1].forEach(dir => {
    const shape = b[5].map(([d, u]) => [d * dir, u]);
    out.push({ id: b[0] + (dir > 0 ? '+' : '-'), base: b[0], name: b[1], kind: b[2], F0: b[3], N0: b[4], shape, dir, len: shape.reduce((s, x) => s + x[1], 0) });
  }));
  return out;
})();

function kalpana(raga, opts) {
  const o = opts || {};
  const aksharas = o.aksharas, per = o.perAkshara, D = dial(o.T == null ? 1 : o.T), rand = rng(o.seed || 1);
  const slots = aksharas * per, startPitch = o.startPitch, targetPitch = o.targetPitch, ending = o.ending || 'auto';
  const Pj = makeProjector(raga);
  const pcs = Array.from(new Set(raga.aro.concat(raga.avaro).map(mod12))).sort((a, b) => a - b);
  const notes = []; for (let oct = -1; oct <= 1; oct++) pcs.forEach(pc => { const p = pc + 12 * oct; if (p >= -5 && p <= 19) notes.push(p); });
  notes.sort((a, b) => a - b);
  const NN = notes.length, ix = p => notes.indexOf(p);
  const s0 = ix(startPitch), tg = ix(targetPitch);
  if (s0 < 0 || tg < 0 || !(slots >= 1)) return null;
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
  const freeOK = !!fwd[slots][tg];
  const moraOpts = [];
  if (ending !== 'free' && (ending === 'mora' || aksharas >= 7) && slots >= 8) {
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
  }
  let endType;
  if (ending === 'mora' && moraOpts.length) endType = 'mora';
  else if (ending === 'free' && freeOK) endType = 'free';
  else if (moraOpts.length && freeOK) endType = soft([(1 - D.c) * 0 + D.c * 0.6, (1 - D.c) * 1.0], D.tau, rand) === 1 ? 'mora' : 'free';
  else if (moraOpts.length) endType = 'mora';
  else if (freeOK) endType = 'free';
  else return null;
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
  if (!d0s.length) return null;
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
  return {
    notes: notesOut, slots, units,
    ending: mora ? { type: 'mora', phrase: mora.ph.map(j => notes[j]), q: mora.q, start: mora.B } : (ending === 'mora' ? { type: 'free', fallbackFrom: 'mora' } : { type: 'free' }),
    stats: { novelShare: nov / slots, convShare: conv / slots, devices },
    dial: D
  };
}

export { CELL_DEFS, CELLS, kalpana };
