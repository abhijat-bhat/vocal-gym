import { rng, soft, dial } from '../random.js';
import { makeProjector, mod12 } from '../projection.js';
import { getProfile } from '../profiles.js';
import { CELL_DEFS, CELLS, phraseDevices } from './devices.js';
import { KALPANA_RANGE, eduppuNeighbours, approachScore } from './landing.js';
import { leapContext, isLeap, licence, forbiddenLeap, internalTerms, boundaryTerms, leapStats } from './leaps.js';

/* Vocal Gym engine · kalpana swaras: device-based generation with a guaranteed landing
   kalpanaRound(raga, opts) returns a round or { error, code }; kalpana(raga, opts) returns the
   round or null, as in v0.2.
   opts.eduppuPitch      the swara the composition resumes on (not part of the round). The round ends
                         on lo(e) or hi(e), so the step into the eduppu is legal. Wins over targetPitch.
   opts.targetPitch      deprecated: the last swara of the round itself (v0.2 meaning).
   opts.allowExceptions  also offer the profile's documented direction-rule exceptions, whole.
   Hard rules (length, direction, range, landing, hard avoid lists, and below T = 1.5 the leap
   prohibitions) live in the device tables and the reachability tables; everything else is a score.
   Devices are the generic cells (relative steps) plus anchored phrase devices from the raga profile. */
const fail = (code, error) => ({ error, code });
const swaraName = (raga, p) => (raga.labels[mod12(p)] || '?') + (p >= 12 ? "'" : p < 0 ? '.' : '');
const PHRASE_KINDS = new Set(['phrase', 'phrase-fragment']);
const GENERIC_FACTOR = { high: 0.5, medium: 0.7, low: 1.0, none: 1.0 };
const JANTA = new Set(['janta', 'janta3']), DATTU = new Set(['dattu']);
const JD_FACTOR = { avoid: 0.2, suits: 1.2 };
const targetShare = T => 0.70 - 0.20 * T;

/* does seq (pitches) contain pat as a contiguous run that ends at or after index from? */
function containsRun(seq, pat, from) {
  for (let s = Math.max(0, (from || 0) - pat.length + 1); s + pat.length <= seq.length; s++) {
    let k = 0; while (k < pat.length && seq[s + k] === pat[k]) k++;
    if (k === pat.length) return true;
  }
  return false;
}

/* The device tables for a raga depend only on its profile and the mode (hard leap filters,
   inversions, exceptions), so they are built once and kept per raga object (plan 2.1). */
const DEVICE_CACHE = new WeakMap();
function cachedTables(raga, profile, key, make) {
  let ent = DEVICE_CACHE.get(raga);
  if (!ent || ent.profile !== profile) { ent = { profile, map: new Map() }; DEVICE_CACHE.set(raga, ent); }
  if (!ent.map.has(key)) ent.map.set(key, make());
  return ent.map.get(key);
}

function profileCoverage(profile, phraseCount) {
  if (!profile) return 'none';
  if (phraseCount) return 'phrases';
  const roles = ['nyasa', 'jiva', 'alpa', 'notNyasa', 'avoidLanding', 'avoid'].some(k => (profile[k] || []).length);
  const landing = (profile.landing || []).join(',') !== '0,7';
  return roles || landing ? 'roles-only' : 'none';
}

function kalpanaRound(raga, opts) {
  const o = opts || {}, D = dial(o.T == null ? 1 : o.T);
  const strict = build(raga, o, D.T < 1.5);
  if (!strict.error || strict.code !== 'unreachable' || !(D.T < 1.5)) return strict;
  // a leap filter made the span infeasible: relax it one level rather than fail where v0.2 succeeded
  const loose = build(raga, o, false);
  if (!loose.error) loose.stats.relaxed = 'leaps';
  return loose;
}

function build(raga, o, hard) {
  const aksharas = o.aksharas, per = o.perAkshara, D = dial(o.T == null ? 1 : o.T), rand = rng(o.seed || 1);
  const slots = aksharas * per, startPitch = o.startPitch, ending = o.ending || 'auto';
  const Pj = makeProjector(raga);
  const pcs = Array.from(new Set(raga.aro.concat(raga.avaro).map(mod12))).sort((a, b) => a - b);
  const notes = []; for (let oct = -1; oct <= 1; oct++) pcs.forEach(pc => { const p = pc + 12 * oct; if (p >= KALPANA_RANGE[0] && p <= KALPANA_RANGE[1]) notes.push(p); });
  notes.sort((a, b) => a - b);
  const NN = notes.length, ix = p => notes.indexOf(p);
  // a scale position for any pitch: anya swaras (exceptions only) sit between their neighbours
  const pos = p => { const k = ix(p); if (k >= 0) return k; let n = 0; while (n < NN && notes[n] < p) n++; return n - 0.5; };
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

  const profile = getProfile(raga), LX = leapContext(profile, D.T, hard);
  const landing = new Set(profile ? profile.landing : [0, 7]);
  const restBad = new Set(profile ? profile.avoidLanding.concat(profile.notNyasa) : []);
  const alpa = new Set(profile ? profile.alpa : []), jiva = new Set(profile ? profile.jiva : []);
  const hardAvoid = profile ? profile.avoid.filter(a => a.strength === 'hard').map(a => a.pitches) : [];
  const softAvoid = profile ? profile.avoid.filter(a => a.strength !== 'hard').map(a => a.pitches) : [];
  const avoidsHard = (seq, from) => hardAvoid.some(p => containsRun(seq, p, from));
  // a move the hard leap filter forbids (state-independent: interval size, tritone, alpa target)
  const badLeap = (ia, ib) => hard && isLeap(ia, ib) && !!forbiddenLeap(LX, notes[ia], notes[ib]);
  const sameDirLeaps = (ia, ib, ic) => isLeap(ia, ib) && isLeap(ib, ic) && Math.sign(ib - ia) === Math.sign(ic - ib);
  /* The reachability tables track the swara and the class of the move that arrived on it
     (0 a step or none, 1 a leap up, 2 a leap down), so that below T = 1.5 no two leaps in a row
     go the same way, across device junctions too. State index: i * 3 + m. */
  const cls = (ia, ib) => isLeap(ia, ib) ? (ib > ia ? 1 : 2) : 0;
  const clash = (m, m2) => hard && m !== 0 && m === m2;
  const NS = NN * 3;

  const tables = cachedTables(raga, profile, (hard ? 'h' : '') + (D.T >= 1 ? 'i' : '') + (o.allowExceptions ? 'x' : ''), makeTables);
  const { app, phr, G } = tables;
  const entryOK = (gp, i, m) => (gp.allow[m] >> i) & 1;
  // the device tables depend only on the raga, its profile and the mode, so they are built once
  function makeTables() {
  // generic cells: one row per starting swara
  const app = CELLS.map(c => {
    const row = new Array(NN);
    for (let i = 0; i < NN; i++) {
      let cur = i, back = -1, ok = true; const seq = [];
      for (const [dl, du] of c.shape) {
        const j = cur + dl;
        if (j < 0 || j >= NN || !Pj.valid(notes[cur], notes[j]) || badLeap(cur, j) || (hard && back >= 0 && sameDirLeaps(back, cur, j))) { ok = false; break; }
        seq.push({ j, dur: du }); back = cur; cur = j;
      }
      if (ok && hardAvoid.length && avoidsHard([notes[i]].concat(seq.map(x => notes[x.j])), 0)) ok = false;
      if (!ok) { row[i] = null; continue; }
      const tpl = seq.map(x => ({ p: notes[x.j], i: x.j, dur: x.dur, g: -9, arp: c.base === 'arp', phrase: false }));
      row[i] = { end: cur, seq, tpl, ps: tpl.map(x => x.p), int: internalTerms(LX, tpl), mf: cls(i, seq[0].j), me: cls(back, cur) };
    }
    return row;
  });

  // anchored phrase devices: fixed notes, so only the entry depends on the current swara
  const phr = phraseDevices(profile || { phrases: [] }, notes, Pj.valid, { inversions: D.T >= 1, exceptions: !!o.allowExceptions });
  const anch = [];
  phr.forEach(dv => {
    const js = dv.pitches.map(pos), n = js.length;
    if (!dv.attested) for (let k = 1; k < n; k++) if (badLeap(js[k - 1], js[k]) || (hard && k >= 2 && sameDirLeaps(js[k - 2], js[k - 1], js[k]))) return;
    if (hardAvoid.length && avoidsHard(dv.pitches, 0)) return;
    const first = js[0], janta = n > 1 && dv.pitches[0] === dv.pitches[1];
    let mask = 0;
    for (let i = 0; i < NN; i++) {
      if (!Pj.valid(notes[i], dv.pitches[0]) || (i === first && !janta) || badLeap(i, first)) continue;
      if (hard && !dv.attested && n > 1 && sameDirLeaps(i, first, js[1])) continue;
      if (hardAvoid.length && avoidsHard([notes[i]].concat(dv.pitches), 1)) continue;
      mask |= 1 << i;
    }
    if (!mask) return;
    // the device's notes as line entries (unit id and slot position are filled in when sampled)
    const tpl = js.map((j, k) => ({ p: dv.pitches[k], i: j, dur: dv.durs[k], g: -9, phrase: dv.kind !== 'phrase-variant', arp: false }));
    anch.push({ dv, tpl, ps: dv.pitches, int: internalTerms(LX, tpl), first, end: js[n - 1], me: n > 1 ? cls(js[n - 2], js[n - 1]) : 0, len: dv.len, mask });
  });
  // devices that share an entry condition share one test: allow[m] is the bitmask of swaras i
  // from which a state (i, m) may enter
  const groups = new Map();
  anch.forEach(a => {
    const k = a.mask + ':' + a.first;
    if (!groups.has(k)) {
      const allow = [0, 1, 2].map(m => { let b = 0; for (let i = 0; i < NN; i++) if ((a.mask >> i) & 1 && !clash(m, cls(i, a.first))) b |= 1 << i; return b; });
      groups.set(k, { allow, first: a.first, devs: [] });
    }
    groups.get(k).devs.push(a);
  });
  const G = Array.from(groups.values());
  // the distinct (length, end state) pairs of a group, which is all the reachability tables need
  G.forEach(gp => { const seen = new Set(); gp.moves = []; gp.devs.forEach(a => { const k = a.len * 1000 + a.end * 3 + a.me; if (!seen.has(k)) { seen.add(k); gp.moves.push([a.len, a.end * 3 + a.me]); } }); });
  return { app, phr, G };
  }
  // bitmasks of the swaras reachable in each arrival class at one slot
  const masks = row => { const b = [0, 0, 0]; for (let s = 0; s < NS; s++) if (row[s]) b[s % 3] |= 1 << ((s / 3) | 0); return b; };

  // forward reachability from the opening swara
  const fwd = Array.from({ length: slots + 1 }, () => new Uint8Array(NS));
  [1, 2].forEach(d0 => { if (d0 <= slots) fwd[d0][s0 * 3] = 1; });
  for (let t = 1; t < slots; t++) {
    const F = fwd[t];
    let anyState = false;
    for (let s = 0; s < NS; s++) if (F[s]) {
      anyState = true;
      const i = (s / 3) | 0, m = s % 3;
      for (let ci = 0; ci < CELLS.length; ci++) { const a = app[ci][i]; if (a && t + CELLS[ci].len <= slots && !clash(m, a.mf)) fwd[t + CELLS[ci].len][a.end * 3 + a.me] = 1; }
    }
    if (!anyState) continue;
    const R = masks(F);
    for (const gp of G) {
      if (!((R[0] & gp.allow[0]) | (R[1] & gp.allow[1]) | (R[2] & gp.allow[2]))) continue;
      for (const [L, es] of gp.moves) if (t + L <= slots) fwd[t + L][es] = 1;
    }
  }
  const reach = (t, i) => fwd[t][i * 3] || fwd[t][i * 3 + 1] || fwd[t][i * 3 + 2];

  // endings: free, or a mora (phrase x3 with equal karvai, last swara = landing swara)
  const moraAllowed = ending !== 'free' && (ending === 'mora' || aksharas >= 7) && slots >= 8;
  // the body's last swara i may step into the mora's first swara f (and on to its second, f1)
  const intoMora = (i, m, f, f1) => i !== f && Pj.valid(notes[i], notes[f]) && !badLeap(i, f) && !(hard && sameDirLeaps(i, f, f1)) && !clash(m, cls(i, f));
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
      // the statements' moves, cyclically: inside a statement, then the junction into the next
      const cyc = ph.concat([f, ph[1]]);
      let leapsOK = true, unl = 0;
      for (let k = 1; k < cyc.length; k++) {
        if (k <= u && isLeap(cyc[k - 1], cyc[k]) && !licence(LX, notes[cyc[k - 1]], notes[cyc[k]])) unl++;
        if (badLeap(cyc[k - 1], cyc[k]) || (hard && k >= 2 && sameDirLeaps(cyc[k - 2], cyc[k - 1], cyc[k]))) leapsOK = false;
      }
      if (!leapsOK) return;
      if (hardAvoid.length && avoidsHard(ph.concat(ph).map(j => notes[j]), 0)) return;
      // leaps inside a statement or at the junction that do not step back within two swaras
      const two = ph.concat(ph), unresolvedAt = q => {
        let n = 0;
        for (let k = 1; k <= u; k++) {
          const d = two[k] - two[k - 1];
          if (Math.abs(d) < 2 || (q > 0 && k === u - 1)) continue;
          let ok = false;
          for (let m = k + 1; m <= k + 2 && m < two.length; m++) { const e2 = two[m] - two[m - 1]; if ((m === k + 1 && e2 === 0) || (Math.abs(e2) === 1 && Math.sign(e2) === -Math.sign(d))) ok = true; }
          if (!ok) n++;
        }
        return n;
      };
      for (let q = 0; q <= 2 * per; q++) {
        const total = 3 * u + 2 * q, B = slots - total;
        if (B < Math.max(2, per) || total > 0.6 * slots) continue;
        let feas = false; for (let s = 0; s < NS && !feas; s++) if (fwd[B][s] && intoMora((s / 3) | 0, s % 3, f, ph[1])) feas = true;
        if (!feas) continue;
        const steps = []; for (let k = 1; k < u; k++) steps.push(ph[k] - ph[k - 1]);
        const allStep = steps.every(s => Math.abs(s) === 1), onBeat = B % per === 0 && (u + q) % per === 0;
        const F = (allStep ? 0.8 : 0) + (onBeat ? 0.9 : 0) + (q <= per ? 0.3 : 0) + (u === 3 ? 0.3 : 0) + (notes[ph[u - 2]] < notes[tg] ? 0.2 : 0) - 0.5 * unl - 0.6 * unresolvedAt(q);
        const N = (allStep ? 0 : 0.7) + (onBeat ? 0 : 0.7) + (notes[ph[u - 2]] > notes[tg] ? 0.3 : 0);
        moraOpts.push({ ph, q, B, F, N });
      }
    });
    return moraOpts;
  }

  // which landings can finish under the requested ending
  let cands = targets.map(x => { const tg = ix(x.p); return Object.assign({ tg, freeOK: !!reach(slots, tg), moraOpts: moraOptions(tg) }, x); });
  cands = cands.filter(x => ending === 'free' ? x.freeOK : x.freeOK || x.moraOpts.length);
  if (ending === 'mora' && cands.some(x => x.moraOpts.length)) cands = cands.filter(x => x.moraOpts.length);
  if (!cands.length) {
    const names = targets.map(x => swaraName(raga, x.p)).join(' or ');
    return fail('unreachable', useEduppu
      ? 'No legal round of ' + slots + ' slots moves from ' + swaraName(raga, startPitch) + ' to ' + names + ', the neighbours of the eduppu swara ' + swaraName(raga, e) + '. Lengthen the round or pick closer swaras.'
      : 'No legal round of ' + slots + ' slots moves from ' + swaraName(raga, startPitch) + ' to ' + names + '. Lengthen the round or pick closer swaras.');
  }
  // choose between the two neighbours (only sampled when there is a real choice)
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
    B = mora.B; const f = mora.ph[0], f1 = mora.ph[1];
    inSet = (i, m) => intoMora(i, m, f, f1);
  } else inSet = i => i === tg;
  // backward feasibility for the body
  const bwd = Array.from({ length: B + 1 }, () => new Uint8Array(NS));
  for (let s = 0; s < NS; s++) bwd[B][s] = inSet((s / 3) | 0, s % 3) ? 1 : 0;
  for (let t = B - 1; t >= 1; t--) {
    const W = bwd[t];
    for (let s = 0; s < NS; s++) {
      const i = (s / 3) | 0, m = s % 3;
      for (let ci = 0; ci < CELLS.length; ci++) { const a = app[ci][i]; if (a && t + CELLS[ci].len <= B && !clash(m, a.mf) && bwd[t + CELLS[ci].len][a.end * 3 + a.me]) { W[s] = 1; break; } }
    }
    const add = [0, 0, 0];
    for (const gp of G) {
      if (!gp.moves.some(([L, es]) => t + L <= B && bwd[t + L][es])) continue;
      add[0] |= gp.allow[0]; add[1] |= gp.allow[1]; add[2] |= gp.allow[2];
    }
    for (let m = 0; m < 3; m++) if (add[m]) for (let i = 0; i < NN; i++) if ((add[m] >> i) & 1) W[i * 3 + m] = 1;
  }
  const d0s = [1, 2].filter(d => d <= B && bwd[d][s0 * 3]);
  if (!d0s.length) return fail('unreachable', 'No legal round of ' + slots + ' slots moves from ' + swaraName(raga, startPitch) + ' to ' + swaraName(raga, targetPitch) + '. Lengthen the round or pick closer swaras.');
  const d0 = d0s[soft(d0s.map(d => d === 1 ? (1 - D.c) * 0.5 : (1 - D.c) * 0.1 + D.c * 0.3), D.tau, rand)];
  const units = [{ kind: 'start', base: 'start', name: 'opening swara', dir: 0, t: 0, notes: [{ p: startPitch, dur: d0 }] }];
  // the line so far, for the path-dependent leap, register and avoid terms
  const line = [{ p: startPitch, i: s0, dur: d0, pos: 0, g: 0 }];
  // what follows the body: the mora's first statement, or the eduppu (only for judging resolution)
  const after = mora ? mora.ph.map(j => ({ p: notes[j], i: j, dur: 1, g: -1 }))
    : useEduppu ? [{ p: e, i: ix(e), dur: 1, g: -2 }] : [];
  const centre = Math.max(2, Math.min(10, (startPitch + targetPitch) / 2 + 2));
  // semitones by which the aksharas a candidate touches exceed the register cap
  function registerExcess(cn, t0) {
    let ak = Math.floor(t0 / per), lo = Infinity, hi = -Infinity, ex = 0, p0 = t0;
    for (let k = line.length - 1; k >= 0 && Math.floor(line[k].pos / per) === ak; k--) { lo = Math.min(lo, line[k].p); hi = Math.max(hi, line[k].p); }
    for (const n of cn) {
      const a = Math.floor(p0 / per);
      if (a !== ak) { if (hi - lo > LX.regCap) ex += hi - lo - LX.regCap; ak = a; lo = hi = n.p; }
      else { lo = Math.min(lo, n.p); hi = Math.max(hi, n.p); }
      p0 += n.dur;
    }
    if (hi - lo > LX.regCap) ex += hi - lo - LX.regCap;
    return ex;
  }
  const phraseCount = phr.filter(d => d.kind === 'phrase').length;
  const gFactor = phraseCount ? GENERIC_FACTOR[profile.confidence] || 1 : 1;
  const jdF = (k, base) => JANTA.has(base) ? (JD_FACTOR[profile && profile.janta] || 1) : DATTU.has(base) ? (JD_FACTOR[profile && profile.dattu] || 1) : 1;
  const maxAvoid = Math.max(1, ...hardAvoid.concat(softAvoid).map(p => p.length));
  const used = new Set();
  let t = d0, i = s0, m = 0, prev = null, unlSoFar = 0, phraseSlots = 0;
  while (t < B) {
    let cand = [];
    for (let ci = 0; ci < CELLS.length; ci++) {
      const c = CELLS[ci], a = app[ci][i];
      if (a && t + c.len <= B && !clash(m, a.mf) && bwd[t + c.len][a.end * 3 + a.me]) cand.push({ c, cn: a.tpl, ps: a.ps, int: a.int, end: a.end, me: a.me });
    }
    for (const gp of G) if (entryOK(gp, i, m)) for (const a of gp.devs)
      if (t + a.len <= B && bwd[t + a.len][a.end * 3 + a.me]) cand.push({ c: a.dv, cn: a.tpl, ps: a.ps, int: a.int, end: a.end, me: a.me });
    const g = units.length, tail = line.slice(-3), look = line.slice(-(maxAvoid - 1)).map(n => n.p);
    cand.forEach(x => {
      const cn = x.cn, ph = PHRASE_KINDS.has(x.c.kind);
      const last = t + x.c.len === B;
      // leap terms: the device's own moves (precomputed) plus its junctions; the junction into the mora counts
      const bt = boundaryTerms(LX, tail, cn, last ? after : [], !!mora);
      x.L = { unl: x.int.unl + bt.unl, dbl: x.int.dbl + bt.dbl, unres: x.int.unres + bt.unres };
      // register: the span of each akshara the device touches (attested phrases carry their own)
      x.reg = per > 1 && !ph ? registerExcess(cn, t) : 0;
      if (hardAvoid.length || softAvoid.length) {
        const run = look.concat(x.ps);
        x.hardAvoid = hardAvoid.length && avoidsHard(run, look.length);
        x.softAvoid = softAvoid.filter(p => containsRun(run, p, look.length)).length;
      } else { x.hardAvoid = false; x.softAvoid = 0; }
    });
    // hard avoid lists are exact for one swara of look-behind; longer junctions are avoided whenever possible
    if (hardAvoid.length && cand.some(x => !x.hardAvoid)) cand = cand.filter(x => !x.hardAvoid);
    const share = phraseSlots / t, target = targetShare(D.T), push = 0.8 * (target - share) * 4;
    const scores = cand.map(({ c, ps, cn, L, reg, softAvoid: sa }) => {
      const isPh = PHRASE_KINDS.has(c.kind), isVar = c.kind === 'phrase-variant', anchored = !!c.phraseId;
      let F = c.F0, N = c.N0;
      if (c.kind === 'conv') F *= gFactor;
      F *= jdF(c.kind, c.base);
      if (c.base === 'leap3' || c.base === 'leap4') N -= 0.3;
      if (t % per === 0) F += 0.6; else { F -= 0.4; N += 0.5; }
      if (c.len % per === 0) F += 0.4; else if (per > 1) N += 0.4;
      if (!anchored && prev && prev.base === c.base && prev.dir === c.dir) { F += 0.5; N -= 0.4; }
      if (prev && prev.id === c.id && prev.startP === ps[0]) { F += 0.2; N -= 1.0; }
      if (anchored && used.has(c.phraseId)) F -= 0.8;
      // resting: held swaras on the profile's landing swaras, not on swaras it says not to rest on
      let pt = t;
      cn.forEach(n => {
        if (n.dur >= 2) {
          const pc = mod12(n.p);
          if (landing.has(pc) && (pt + n.dur) % per === 0) F += 0.6; else N += 0.3;
          if (restBad.has(pc)) F -= 0.4;
          if (alpa.has(pc)) F -= 0.3;
        }
        pt += n.dur;
      });
      F += Math.min(0.4, 0.2 * ps.filter(p => jiva.has(mod12(p))).length);
      F -= 1.0 * sa;
      const avg = ps.reduce((s, p) => s + p, 0) / ps.length;
      F -= 0.06 * Math.abs(avg - centre);
      if (!isPh && ps.some(p => p > 12 || p < 0)) { N += 0.5; F -= 0.3; }
      if (prev && prev.dir && c.dir && c.dir !== prev.dir) N += 0.3;
      // reasoned jumps (plan 3.2), all on F so they fade as c rises
      const allowed = Math.floor(LX.budget * (t + c.len) / 8 + 1e-9);
      const over = Math.max(0, Math.min(L.unl, unlSoFar + L.unl - allowed));
      F -= 1.5 * L.unl + 0.6 * L.unres + 2.0 * L.dbl + 1.0 * over + 0.8 * reg;
      let score = (1 - D.c) * F + D.c * N;
      // the phrase-share controller: predominantly characteristic phrases, occasionally out-of-the-box ones
      // (the novelty side scales with c, so a round at T = 0 fills the rest with conventional devices)
      if (isPh) score += push;
      else if (push < 0 && (isVar || c.kind === 'nov')) score -= push * D.c;
      return score;
    });
    const ch = cand[soft(scores, D.tau, rand)], c = ch.c;
    const unit = { kind: c.kind, base: c.base, id: c.id, name: c.name, dir: c.dir, t, notes: ch.cn.map(n => ({ p: n.p, dur: n.dur })) };
    if (c.phraseId) Object.assign(unit, { phraseId: c.phraseId, source: c.source, type: c.type, variant: c.variant }, c.exception ? { exception: true } : {});
    units.push(unit);
    { let p0 = t; ch.cn.forEach(n => { line.push(Object.assign({}, n, { g, pos: p0 })); p0 += n.dur; }); }
    unlSoFar += ch.L.unl;
    if (PHRASE_KINDS.has(c.kind)) phraseSlots += c.len;
    if (c.phraseId) used.add(c.phraseId);
    prev = { base: c.base, id: c.id, dir: c.dir, startP: ch.cn[0].p };
    t += c.len; i = ch.end; m = ch.me;
  }
  if (mora) {
    for (let r = 0; r < 3; r++) {
      const ns = mora.ph.map((j, k) => ({ p: notes[j], dur: k === mora.ph.length - 1 && r < 2 ? 1 + mora.q : 1 }));
      const g = units.length;
      units.push({ kind: 'mora', base: 'mora', name: 'mora ' + (r + 1) + ' of 3', dir: 0, t, notes: ns });
      ns.forEach((n, k) => { line.push({ p: n.p, i: mora.ph[k], dur: n.dur, pos: t, g }); t += n.dur; });
    }
  }
  const notesOut = []; units.forEach(u => u.notes.forEach(n => notesOut.push(n)));
  const slotsOf = u => u.notes.reduce((s, n) => s + n.dur, 0);
  let nov = 0, conv = 0, phraseS = 0, variantS = 0; const devices = {}, phrasesUsed = [];
  units.forEach(u => {
    const L = slotsOf(u);
    if (u.kind === 'nov') nov += L; else if (u.kind === 'phrase-variant') variantS += L;
    else if (PHRASE_KINDS.has(u.kind)) phraseS += L; else if (u.kind === 'conv' || u.kind === 'mora') conv += L;
    if (u.kind !== 'start' && u.kind !== 'step' && u.kind !== 'mora') { const k = u.name + (u.dir > 0 ? ' ↑' : u.dir < 0 ? ' ↓' : ''); devices[k] = (devices[k] || 0) + 1; }
    if (u.phraseId) phrasesUsed.push({ phraseId: u.phraseId, source: u.source, kind: u.kind, variant: u.variant, type: u.type, notes: u.notes.map(n => n.p) });
  });
  const endInfo = mora ? { type: 'mora', phrase: mora.ph.map(j => notes[j]), q: mora.q, start: mora.B } : (ending === 'mora' ? { type: 'free', fallbackFrom: 'mora' } : { type: 'free' });
  if (useEduppu) Object.assign(endInfo, { eduppu: e, final: targetPitch, approach: pick.approach });
  const leaps = leapStats(LX, line, useEduppu ? [{ p: e, i: ix(e), dur: 1, g: -2 }] : [], slots);
  return {
    notes: notesOut, slots, units,
    ending: endInfo,
    stats: {
      novelShare: (nov + variantS) / slots, convShare: (conv + phraseS) / slots,
      phraseShare: phraseS / slots, variantShare: variantS / slots,
      profileCoverage: profileCoverage(profile, phraseCount), phrases: phrasesUsed, devices, leaps
    },
    dial: D
  };
}

function kalpana(raga, opts) {
  const res = kalpanaRound(raga, opts);
  return res.error ? null : res;
}

export { CELL_DEFS, CELLS, KALPANA_RANGE, eduppuNeighbours, kalpana, kalpanaRound };
