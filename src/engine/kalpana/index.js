import { rng, soft, dial } from '../random.js';
import { makeProjector, mod12 } from '../projection.js';
import { getProfile } from '../profiles.js';
import { CELL_DEFS, CELLS, phraseDevices } from './devices.js';
import { KALPANA_RANGE, eduppuNeighbours, approachScore } from './landing.js';
import { moraOptions as gradedMora, korvaiOptions } from './mora.js';
import { leapContext, isLeap, licence, blocked, internalTerms, boundaryTerms, leapStats } from './leaps.js';
import { planPhrases, focusPlan, expectedPos, focalCandidates } from './phrases.js';

/* Vocal Gym engine · kalpana swaras: device-based generation with a guaranteed landing
   kalpanaRound(raga, opts) returns a round or { error, code }; kalpana(raga, opts) returns the
   round or null, as in v0.2.
   opts.eduppuPitch      the swara the composition resumes on (not part of the round). The round ends
                         on lo(e) or hi(e), so the step into the eduppu is legal. Wins over targetPitch.
   opts.targetPitch      deprecated: the last swara of the round itself (v0.2 meaning).
   opts.allowExceptions  also offer the profile's documented direction-rule exceptions, whole. 'documented' (v0.11) offers only
                         the well-sourced ones (weight 0.4 and up): this is how an anya swara enters, inside its own phrase.
   opts.moraStyle        'auto' (default: shift, gopuccha, srotovaha, expand or contract by score), or one of them, or 'identical'.
   opts.ending           'auto', 'mora', 'free', or 'korvai' (v0.4: three descending units, each a run with
                         shrinking rests and a mora; falls back to a mora, then a free ending, when it does not fit).
   opts.angas            anga lengths in aksharas (Adi [4, 2, 2]), for the phrase plan; opts.phrases false
                         turns the plan off (v0.3 rounds). opts.focus: a focal pitch for the first phrase group.
   opts.pidi             0–1: favour the raga's attested phrases more (slow rounds of a session).
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
const MORA_STYLES = ['auto', 'shift', 'gopuccha', 'srotovaha', 'expand', 'contract', 'identical'];

/* does seq (pitches) contain pat as a contiguous run that ends at or after index from? */
function containsRun(seq, pat, from) {
  for (let s = Math.max(0, (from || 0) - pat.length + 1); s + pat.length <= seq.length; s++) {
    let k = 0; while (k < pat.length && seq[s + k] === pat[k]) k++;
    if (k === pat.length) return true;
  }
  return false;
}

/* does look ++ ps contain pat as a contiguous run that ends inside ps? (no allocation) */
function runAcross(look, ps, pat) {
  const L = look.length, n = L + ps.length, at = k => k < L ? look[k] : ps[k - L];
  for (let s = Math.max(0, L - pat.length + 1); s + pat.length <= n; s++) {
    let k = 0; while (k < pat.length && at(s + k) === pat[k]) k++;
    if (k === pat.length) return true;
  }
  return false;
}

/* The device tables for a raga depend only on its profile and the mode (hard leap filters,
   inversions, exceptions), so they are built once and kept per raga object (plan 2.1). Mora
   statement shapes do not depend on the mode and are shared by all of them. */
const DEVICE_CACHE = new WeakMap();
function cachedTables(raga, profile, key, make) {
  let ent = DEVICE_CACHE.get(raga);
  if (!ent || ent.profile !== profile) { ent = { profile, map: new Map(), mora: new Map() }; DEVICE_CACHE.set(raga, ent); }
  if (!ent.map.has(key)) ent.map.set(key, Object.assign(make(), { moraCache: ent.mora }));
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
  const o = opts || {}, D = dial(o.T == null ? 1 : o.T), top = D.T < 1.5 ? 2 : 1;
  let res;
  // when a leap filter makes the span infeasible, relax it a level at a time rather than fail where v0.2 succeeded;
  // at each level the phrase plan (v0.4) is tried first, then the round without one
  const planned = o.phrases !== false;
  outer: for (let level = top; level >= 0; level--) {
    for (const plan of planned ? [true, false] : [false]) {
      res = build(raga, o, level, plan);
      if (!res.error || res.code !== 'unreachable') break outer;
    }
  }
  if (!res.error && res.level < top) res.stats.relaxed = 'leaps';
  if (!res.error) delete res.level;
  return res;
}

function build(raga, o, level, planned) {
  const hard = level >= 2;
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
  if (o.moraStyle != null && !MORA_STYLES.includes(o.moraStyle)) return fail('bad-mora-style', 'Mora style must be one of ' + MORA_STYLES.join(', ') + '.');
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

  const profile = getProfile(raga), LX = leapContext(profile, D.T, level);
  // the moves (swara and signed interval) the raga's attested phrases make: the only jumps a join may make
  const moveKey = (a, b) => mod12(a) * 64 + (b - a + 32);
  const attestedMoves = new Set();
  (profile ? profile.phrases : []).forEach(ph => { for (let k = 1; k < ph.pitches.length; k++) if (ph.pitches[k] !== ph.pitches[k - 1]) attestedMoves.add(moveKey(ph.pitches[k - 1], ph.pitches[k])); });
  const landing = new Set(profile ? profile.landing : [0, 7]);
  const restBad = new Set(profile ? profile.avoidLanding.concat(profile.notNyasa) : []);
  const alpa = new Set(profile ? profile.alpa : []), jiva = new Set(profile ? profile.jiva : []);
  const hardAvoid = profile ? profile.avoid.filter(a => a.strength === 'hard').map(a => a.pitches) : [];
  const softAvoid = profile ? profile.avoid.filter(a => a.strength !== 'hard').map(a => a.pitches) : [];
  const avoidsHard = (seq, from) => hardAvoid.some(p => containsRun(seq, p, from));
  // a move the hard leap filter forbids (state-independent: interval size, tritone, alpa target)
  const badLeap = (ia, ib) => isLeap(ia, ib) && blocked(LX, notes[ia], notes[ib]);
  const sameDirLeaps = (ia, ib, ic) => isLeap(ia, ib) && isLeap(ib, ic) && Math.sign(ib - ia) === Math.sign(ic - ib);
  /* The reachability tables track the swara and the class of the move that arrived on it
     (0 a step or none, 1 a leap up, 2 a leap down), so that below T = 1.5 no two leaps in a row
     go the same way, across device junctions too. State index: i * 3 + m. */
  const cls = (ia, ib) => isLeap(ia, ib) ? (ib > ia ? 1 : 2) : 0;
  const clash = (m, m2) => hard && m !== 0 && m === m2;
  const NS = NN * 3;
  /* Joins (docs/research/kalpana-structure.md §6.1). The move from one device into the next is where
     the v0.3 rounds jumped: 8.1% of joins leapt three or more raga steps and 1.7% an octave, against
     1.9% and none inside devices (and none in the raga's attested phrases). So a join may only step,
     skip a third, or make a move the raga's attested phrases make (the same swara, the same interval).
     loose: the first move of a new phrase, after its predecessor's held swara, may also leap up to a
     fifth (a phrase restarts in a new place, A Ex. 2, 8); never an octave, which only the focal echo
     makes. Level 0 (no leap filter, the last resort for very short spans) lifts the rule. */
  const joinRule = level >= 1;
  const joinOK = (ia, ib, loose, pa, pb) => {
    if (!joinRule) return true;
    const a = pa != null ? pa : notes[ia], b = pb != null ? pb : notes[ib], s = Math.abs(b - a), d = Math.abs(ib - ia);
    if (d < 2 || (d < 3 && s <= 4)) return true;              // a step, or a skip of a third
    if (attestedMoves.has(moveKey(a, b))) return true;
    return !!loose && s <= 7 && s !== 6;
  };

  const tables = cachedTables(raga, profile, level + (D.T >= 1 ? 'i' : '') + (o.allowExceptions === 'documented' ? 'd' : o.allowExceptions ? 'x' : ''), makeTables);
  const { app, appS, phr, G, gen, genS, moraCache, idiom, idiomKey } = tables;
  // familiarity of one move under the raga's idiom: unattested leaps cost the most
  // and, in every raga, a cost for size: 0.15 per semitone a leap spans beyond a major third (the octave excepted)
  const moveIdiom = (a, b) => {
    const s = Math.abs(b - a), size = s > 4 && s !== 12 && isLeap(pos(a), pos(b)) ? -0.15 * (s - 4) : 0;
    if (!idiom || a === b || idiom.has(idiomKey(a, b))) return size;
    return size + (s > 2 && isLeap(pos(a), pos(b)) ? -0.8 : -0.15);
  };
  // S: the device starts a phrase (after the held swara of the one before), so its entry is the looser join
  const entryOK = (gp, i, m, S) => ((S ? gp.allowS : gp.allow)[m] >> i) & 1;
  // the device tables depend only on the raga, its profile and the mode, so they are built once
  function makeTables() {
  // generic cells: one row per starting swara; loose: the rows for the first device of a phrase, whose
  // join may restart higher (and the restart cells, which only open a phrase)
  const cellRows = loose => CELLS.map(c => {
    const row = new Array(NN);
    if (c.start && !loose) return row;
    for (let i = 0; i < NN; i++) {
      let cur = i, back = -1, ok = true; const seq = [];
      for (const [dl, du] of c.shape) {
        const j = cur + dl;
        if (j < 0 || j >= NN || !Pj.valid(notes[cur], notes[j]) || badLeap(cur, j) || (hard && back >= 0 && sameDirLeaps(back, cur, j))) { ok = false; break; }
        if (cur === i && back < 0 && !joinOK(i, j, loose)) { ok = false; break; }   // a cell's first move is its join
        seq.push({ j, dur: du }); back = cur; cur = j;
      }
      if (ok && hardAvoid.length && avoidsHard([notes[i]].concat(seq.map(x => notes[x.j])), 0)) ok = false;
      if (!ok) { row[i] = null; continue; }
      const tpl = seq.map(x => ({ p: notes[x.j], i: x.j, dur: x.dur, g: -9, arp: c.base === 'arp', phrase: false }));
      row[i] = { end: cur, seq, tpl, ps: tpl.map(x => x.p), int: internalTerms(LX, tpl), mf: cls(i, seq[0].j), me: cls(back, cur) };
    }
    return row;
  });
  const app = cellRows(false), appS = cellRows(true);

  // anchored phrase devices: fixed notes, so only the entry depends on the current swara
  const phr = phraseDevices(profile || { phrases: [] }, notes, Pj.valid, { inversions: D.T >= 1, exceptions: o.allowExceptions === 'documented' ? 'documented' : !!o.allowExceptions });
  const anch = [];
  phr.forEach(dv => {
    const js = dv.pitches.map(pos), n = js.length;
    if (!dv.attested) for (let k = 1; k < n; k++) if (badLeap(js[k - 1], js[k]) || (hard && k >= 2 && sameDirLeaps(js[k - 2], js[k - 1], js[k]))) return;
    if (hardAvoid.length && avoidsHard(dv.pitches, 0)) return;
    const first = js[0], janta = n > 1 && dv.pitches[0] === dv.pitches[1];
    let mask = 0, maskS = 0;
    for (let i = 0; i < NN; i++) {
      if (!Pj.valid(notes[i], dv.pitches[0]) || (i === first && !janta) || badLeap(i, first)) continue;
      if (hard && !dv.attested && n > 1 && sameDirLeaps(i, first, js[1])) continue;
      if (hardAvoid.length && avoidsHard([notes[i]].concat(dv.pitches), 1)) continue;
      if (joinOK(i, first, true, notes[i], dv.pitches[0])) maskS |= 1 << i;
      if (joinOK(i, first, false, notes[i], dv.pitches[0])) mask |= 1 << i;
    }
    if (!maskS) return;
    // the device's notes as line entries (unit id and slot position are filled in when sampled)
    const tpl = js.map((j, k) => ({ p: dv.pitches[k], i: j, dur: dv.durs[k], g: -9, phrase: dv.kind !== 'phrase-variant', arp: false }));
    anch.push({ dv, tpl, ps: dv.pitches, int: internalTerms(LX, tpl), first, end: js[n - 1], me: n > 1 ? cls(js[n - 2], js[n - 1]) : 0, len: dv.len, mask, maskS });
  });
  // devices that share an entry condition share one test: allow[m] is the bitmask of swaras i
  // from which a state (i, m) may enter
  const groups = new Map();
  anch.forEach(a => {
    const k = a.mask + ':' + a.maskS + ':' + a.first;
    if (!groups.has(k)) {
      const allowOf = M => [0, 1, 2].map(m => { let b = 0; for (let i = 0; i < NN; i++) if ((M >> i) & 1 && !clash(m, cls(i, a.first))) b |= 1 << i; return b; });
      groups.set(k, { allow: allowOf(a.mask), allowS: allowOf(a.maskS), first: a.first, devs: [] });
    }
    groups.get(k).devs.push(a);
  });
  const G = Array.from(groups.values());
  // the distinct (length, end state) pairs of a group, which is all the reachability tables need
  G.forEach(gp => { const seen = new Set(); gp.moves = []; gp.devs.forEach(a => { const k = a.len * 1000 + a.end * 3 + a.me; if (!seen.has(k)) { seen.add(k); gp.moves.push([a.len, a.end * 3 + a.me]); } }); });
  // the generic moves open to each state: [length, end state], deduplicated
  const genOf = A => {
    const out = [];
    for (let s = 0; s < NS; s++) {
      const i = (s / 3) | 0, m = s % 3, seen = new Set(), mv = [];
      CELLS.forEach((c, ci) => { const a = A[ci][i]; if (!a || clash(m, a.mf)) return; const k = c.len * 1000 + a.end * 3 + a.me; if (!seen.has(k)) { seen.add(k); mv.push(c.len, a.end * 3 + a.me); } });
      out.push(Int32Array.from(mv));
    }
    return out;
  };
  const gen = genOf(app), genS = genOf(appS);
  // the raga's idiom: every move (pitch class to pitch class, up or down) that its attested phrases
  // make, plus the steps of its scale. Moves outside it cost familiarity (plan 2: use the profile).
  const idiom = new Set(), idiomKey = (a, b) => mod12(a) * 26 + mod12(b) * 2 + (b > a ? 1 : 0);
  (profile ? profile.phrases : []).forEach(ph => { for (let k = 1; k < ph.pitches.length; k++) if (ph.pitches[k] !== ph.pitches[k - 1]) idiom.add(idiomKey(ph.pitches[k - 1], ph.pitches[k])); });
  const hasIdiom = idiom.size > 0;
  // (ragas without phrases still get the size cost through moveIdiom)
  for (let k = 1; k < NN; k++) { if (Pj.valid(notes[k - 1], notes[k])) idiom.add(idiomKey(notes[k - 1], notes[k])); if (Pj.valid(notes[k], notes[k - 1])) idiom.add(idiomKey(notes[k], notes[k - 1])); }
  return { app, appS, phr, G, gen, genS, idiom: hasIdiom ? idiom : null, idiomKey };
  }
  // bitmasks of the swaras reachable in each arrival class at one slot
  const masks = row => { const b = [0, 0, 0]; for (let s = 0; s < NS; s++) if (row[s]) b[s % 3] |= 1 << ((s / 3) | 0); return b; };

  /* The phrase plan (v0.4, phrases.js): devices fill [a, e) of each phrase and may not cross e; the swara
     sung at e is held until the next phrase starts (hard: devices fit, the phrase ends on a held swara,
     and a held swara is never alpa or one the raga does not rest on). Without a plan the round is one
     phrase with no karvai, as in v0.3. holdAt[t]: the phrase whose held swara sounds at t; segAt[t]: the
     phrase whose devices may start at t; isStart[t]: a phrase (after the first) begins at t. */
  const plan = planned ? planPhrases(slots, per, o.angas, D.c, rng(((o.seed || 1) * 7919 + 17) >>> 0)) : null;
  if (planned && !plan) return fail('unreachable', 'too short for a phrase plan');
  const segAt = new Int16Array(slots + 1).fill(-1), holdAt = new Int16Array(slots + 1).fill(-1), isStart = new Uint8Array(slots + 1);
  // (a phrase that follows one without a karvai flows on from it: its first move is an ordinary join)
  if (plan) plan.forEach((sg, k) => { for (let u = sg.a; u < sg.e; u++) segAt[u] = k; for (let u = sg.e; u < sg.next; u++) holdAt[u] = k; if (k > 0 && plan[k - 1].r > 0) isStart[sg.a] = 1; });
  else for (let u = 0; u < slots; u++) segAt[u] = 0;
  const segEnd = u => plan ? plan[segAt[u]].e : slots;
  const holdable = i => !restBad.has(mod12(notes[i])) && !alpa.has(mod12(notes[i]));

  // forward reachability from the opening swara
  const fwd = Array.from({ length: slots + 1 }, () => new Uint8Array(NS));
  [1, 2].forEach(d0 => { if (d0 <= slots && (!plan || d0 <= plan[0].e)) fwd[d0][s0 * 3] = 1; });
  for (let t = 1; t < slots; t++) {
    const F = fwd[t], hk = holdAt[t];
    if (hk >= 0) {
      // the phrase's last swara is held through its karvai (keeping how it was reached: a phrase that
      // leapt onto its held swara does not restart with a leap the same way)
      if (t === plan[hk].e) for (let s = 0; s < NS; s++) if (F[s] && holdable((s / 3) | 0)) for (let u = t + 1; u <= plan[hk].next; u++) fwd[u][s] = 1;
      continue;
    }
    const lim = segEnd(t), St = isStart[t], GN = St ? genS : gen;
    let anyState = false;
    for (let s = 0; s < NS; s++) if (F[s]) {
      anyState = true;
      const mv = GN[s]; for (let k = 0; k < mv.length; k += 2) if (t + mv[k] <= lim) fwd[t + mv[k]][mv[k + 1]] = 1;
    }
    if (!anyState) continue;
    const R = masks(F);
    for (const gp of G) {
      const A = St ? gp.allowS : gp.allow;
      if (!((R[0] & A[0]) | (R[1] & A[1]) | (R[2] & A[2]))) continue;
      for (const [L, es] of gp.moves) if (t + L <= lim) fwd[t + L][es] = 1;
    }
  }
  const reach = (t, i) => fwd[t][i * 3] || fwd[t][i * 3 + 1] || fwd[t][i * 3 + 2];

  // endings: free, or a mora (phrase x3 with equal karvai, last swara = landing swara)
  const moraAllowed = ending !== 'free' && (ending === 'mora' || ending === 'korvai' || aksharas >= 7) && slots >= 8;
  // the body's last swara i may step into the mora's first swara f (and on to its second, f1)
  const intoMora = (i, m, f, f1, loose) => i !== f && Pj.valid(notes[i], notes[f]) && !badLeap(i, f) && !(hard && sameDirLeaps(i, f, f1)) && !clash(m, cls(i, f)) && joinOK(i, f, !!loose);
  // a body that ends on a held swara (inside or at the end of a karvai) leads into the mora like a new phrase
  const afterHold = B => B > 0 && holdAt[B - 1] >= 0;
  // can the body, B slots long, end on a swara that steps into the mora's first swara f (then f1)?
  // As bitmasks: enter[f][m] are the swaras i that may step into f after an arrival of class m.
  const enter = [], enterS = [], leapInto = [];
  for (let f = 0; f < NN; f++) {
    const em = loose => [0, 1, 2].map(m => { let b = 0; for (let i = 0; i < NN; i++) if (i !== f && Pj.valid(notes[i], notes[f]) && !badLeap(i, f) && !clash(m, cls(i, f)) && joinOK(i, f, loose)) b |= 1 << i; return b; });
    enter.push(em(false)); enterS.push(em(true));
    let up = 0, down = 0; for (let i = 0; i < NN; i++) { if (f - i >= 2) up |= 1 << i; if (i - f >= 2) down |= 1 << i; }
    leapInto.push([up, down]);
  }
  const fwdMasks = new Map();
  const feasibleInto = (B, f, f1, loose) => {
    if (!fwdMasks.has(B)) fwdMasks.set(B, masks(fwd[B]));
    const R = fwdMasks.get(B), E3 = (loose || afterHold(B) ? enterS : enter)[f];
    let excl = 0;   // below T 1.5, no leap into f in the same direction as the leap from f to f1
    if (hard && isLeap(f, f1)) excl = f1 > f ? leapInto[f][0] : leapInto[f][1];
    return !!(((R[0] & E3[0]) | (R[1] & E3[1]) | (R[2] & E3[2])) & ~excl);
  };
  const moraCtx = { notes, NN, valid: Pj.valid, repair: Pj.repair, hard, LX, licence, isLeap, badLeap, sameDirLeaps,
    avoidsHard: ps => hardAvoid.length > 0 && avoidsHard(ps, 0), slots, per, D, e: useEduppu ? e : null,
    phrases: profile ? profile.phrases : [], style: o.moraStyle || 'auto', feasibleInto, cache: moraCache, moveIdiom };
  function moraOptions(tg) { return moraAllowed ? gradedMora(moraCtx, tg) : []; }
  const korvaiOpts = tg => ending === 'korvai' && slots >= 24 ? korvaiOptions(moraCtx, tg) : [];

  // which landings can finish under the requested ending
  let cands = targets.map(x => { const tg = ix(x.p); return Object.assign({ tg, freeOK: !!reach(slots, tg), moraOpts: moraOptions(tg), korvaiOpts: korvaiOpts(tg) }, x); });
  if (ending === 'korvai' && cands.some(x => x.korvaiOpts.length)) cands = cands.filter(x => x.korvaiOpts.length);
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
  const { tg, freeOK, moraOpts, korvaiOpts: kOpts } = pick, targetPitch = pick.p;

  let endType;
  if (ending === 'korvai' && kOpts.length) endType = 'korvai';
  else if ((ending === 'mora' || ending === 'korvai') && moraOpts.length) endType = 'mora';
  else if (ending === 'free' && freeOK) endType = 'free';
  else if (moraOpts.length && freeOK) endType = soft([(1 - D.c) * 0 + D.c * 0.6, (1 - D.c) * 1.0], D.tau, rand) === 1 ? 'mora' : 'free';
  else if (moraOpts.length) endType = 'mora';
  else endType = 'free';
  let mora = null, B = slots, inSet;
  if (endType === 'mora' || endType === 'korvai') {
    const opts2 = endType === 'korvai' ? kOpts : moraOpts;
    mora = opts2[soft(opts2.map(m => (1 - D.c) * m.F + D.c * m.N), D.tau, rand)];
    B = mora.B; const f = mora.stmts[0][0], f1 = mora.stmts[0][1];
    const lz = endType === 'korvai' || afterHold(B);   // a korvai begins like a phrase
    inSet = (i, m) => intoMora(i, m, f, f1, lz);
  } else inSet = i => i === tg;
  // backward feasibility for the body
  const bwd = Array.from({ length: B + 1 }, () => new Uint8Array(NS));
  for (let s = 0; s < NS; s++) bwd[B][s] = inSet((s / 3) | 0, s % 3) ? 1 : 0;
  for (let t = B - 1; t >= 1; t--) {
    const W = bwd[t], hk = holdAt[t];
    if (hk >= 0) {
      // held through the karvai (to the next phrase, or to the end of the body)
      const nx = Math.min(plan[hk].next, B);
      for (let s = 0; s < NS; s++) W[s] = holdable((s / 3) | 0) && bwd[nx][s] ? 1 : 0;
      continue;
    }
    const lim = Math.min(segEnd(t), B), St = isStart[t], GN = St ? genS : gen;
    for (let s = 0; s < NS; s++) {
      const mv = GN[s]; for (let k = 0; k < mv.length; k += 2) if (t + mv[k] <= lim && bwd[t + mv[k]][mv[k + 1]]) { W[s] = 1; break; }
    }
    const add = [0, 0, 0];
    for (const gp of G) {
      if (!gp.moves.some(([L, es]) => t + L <= lim && bwd[t + L][es])) continue;
      const A = St ? gp.allowS : gp.allow;
      add[0] |= A[0]; add[1] |= A[1]; add[2] |= A[2];
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
  const after = mora ? mora.stmts[0].map(j => ({ p: notes[j], i: j, dur: 1, g: -1 }))
    : useEduppu ? [{ p: e, i: ix(e), dur: 1, g: -2 }] : [];
  const centre = Math.max(2, Math.min(10, (startPitch + targetPitch) / 2 + 2));
  // each phrase group's focal note and each phrase's contour (scores only), ending on the landing
  if (plan) focusPlan(plan, focalCandidates(notes, profile, pcs), pos, startPitch, mora ? notes[mora.stmts[0][0]] : targetPitch, o.focus, rng(((o.seed || 1) * 104729 + 3) >>> 0));
  const ECHO = { kind: 'conv', base: 'echo', id: 'echo', name: 'focal echo', dir: 0, F0: 0.4, N0: 0.3, len: 1 };
  /* The focal lookahead: for each phrase that ends before the body does, toFocus[k][u][s] says whether state s
     at time a + u can still reach the phrase's focus exactly at its end e with the round's devices. The
     sampler chooses left to right, so without it a phrase often arrives near its end with no way onto the
     focus; with it, the devices that keep the focus in reach score higher. */
  const toFocus = plan ? plan.map(sg => {
    if (sg.focal == null || sg.e > B || ix(sg.focal) < 0) return null;
    const L = sg.e - sg.a, fj = ix(sg.focal), tab = Array.from({ length: L + 1 }, () => new Uint8Array(NS));
    for (let m2 = 0; m2 < 3; m2++) tab[L][fj * 3 + m2] = bwd[sg.e] && bwd[sg.e][fj * 3 + m2] ? 1 : 0;
    for (let u = L - 1; u >= 0; u--) {
      const tt = sg.a + u, W = tab[u], GN = isStart[tt] ? genS : gen;
      for (let s2 = 0; s2 < NS; s2++) { const mv = GN[s2]; for (let q = 0; q < mv.length; q += 2) if (u + mv[q] <= L && tab[u + mv[q]][mv[q + 1]]) { W[s2] = 1; break; } }
      for (const gp of G) {
        if (!gp.moves.some(([Lm, es]) => u + Lm <= L && tab[u + Lm][es])) continue;
        const A = isStart[tt] ? gp.allowS : gp.allow;
        for (let m2 = 0; m2 < 3; m2++) for (let i2 = 0; i2 < NN; i2++) if ((A[m2] >> i2) & 1) W[i2 * 3 + m2] = 1;
      }
    }
    return tab;
  }) : null;
  const NO_LEAPS = { unl: 0, dbl: 0, unres: 0 };
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
  // the parts of a device's score that do not depend on where it is sung (kept on the device table)
  function staticTerms(c, cn, ps) {
    let F = 0, N = 0, end = 0; const held = [];
    cn.forEach(n => {
      end += n.dur;
      if (n.dur >= 2) { const pc = mod12(n.p); held.push([end, pc]); if (restBad.has(pc)) F -= 0.4; if (alpa.has(pc)) F -= 0.3; }
    });
    F += Math.min(0.4, 0.2 * ps.filter(p => jiva.has(mod12(p))).length);
    if (c.base === 'leap3' || c.base === 'leap4') N -= 0.3;
    return { F, N, held, avg: ps.reduce((s2, p) => s2 + p, 0) / ps.length, outer: ps.some(p => p > 12 || p < 0) };
  }
  // ... plus the terms fixed within this round once the device's place in the akshara is known
  const stamp = {};
  function fixedTerms(c, cn, ps, isPh) {
    const src = staticTerms(c, cn, ps);
    let F = c.F0, N = c.N0 + src.N;
    if (c.kind === 'conv') F *= gFactor;
    F *= jdF(c.kind, c.base);
    F += src.F;
    if (ph0Of(c) === 0) F += 0.6; else { F -= 0.4; N += 0.5; }
    if (c.len % per === 0) F += 0.4; else if (per > 1) N += 0.4;
    // resting: held swaras on the profile's landing swaras (on a beat), not on swaras it says not to rest on
    for (const [end, pc] of src.held) { if (landing.has(pc) && (curPh + end) % per === 0) F += 0.6; else N += 0.3; }
    F -= 0.06 * Math.abs(src.avg - centre);
    if (!isPh && src.outer) { N += 0.5; F -= 0.3; }
    // moves inside the device that the raga's phrases never make (attested phrases make them by definition)
    let I = 0;
    if (c.kind !== 'phrase' && c.kind !== 'phrase-fragment') for (let k = 1; k < ps.length; k++) I += moveIdiom(ps[k - 1], ps[k]);
    return { F, N, I };
  }
  let curPh = 0;
  const ph0Of = () => curPh;
  let t = d0, i = s0, m = 0, prev = null, unlSoFar = 0, phraseSlots = 0;
  const phraseLog = plan ? plan.map(sg => ({ start: sg.a, end: sg.e, karvai: 0, focal: sg.focal, contour: sg.contour, held: null })) : null;
  // each phrase's swaras as sung before its karvai (for the echoes of the next phrase), and whether it echoed
  const phraseNotes = plan ? plan.map(() => []) : [], rhymed = plan ? plan.map(() => false) : [];
  // a yati is one of the designs a round may use, not a habit: it is on offer in about two rounds in five
  let yatiUsed = !(rng(((o.seed || 1) * 31337 + 7) >>> 0)() < (o.yati != null ? +o.yati : 0.4));
  if (plan) phraseNotes[0].push({ p: startPitch, i: s0, dur: d0 });
  while (t < B) {
    const hk = holdAt[t];
    if (hk >= 0) {
      // the phrase ends: its last swara is held until the next phrase (or the mora) begins
      const nx = Math.min(plan[hk].next, B), r = nx - t, lu = units[units.length - 1];
      lu.notes[lu.notes.length - 1].dur += r; lu.karvai = (lu.karvai || 0) + r; line[line.length - 1].dur += r;
      phraseLog[hk].karvai = r; phraseLog[hk].held = line[line.length - 1].p;
      t = nx; prev = null;
      continue;
    }
    const lim = Math.min(segEnd(t), B), St = isStart[t], A = St ? appS : app, sg = plan ? plan[segAt[t]] : null;
    let cand = [];
    for (let ci = 0; ci < CELLS.length; ci++) {
      const c = CELLS[ci], a = A[ci][i];
      if (a && t + c.len <= lim && !clash(m, a.mf) && bwd[t + c.len][a.end * 3 + a.me]) cand.push({ c, src: a, cn: a.tpl, ps: a.ps, int: a.int, end: a.end, me: a.me });
    }
    for (const gp of G) if (entryOK(gp, i, m, St)) for (const a of gp.devs)
      if (t + a.len <= lim && bwd[t + a.len][a.end * 3 + a.me]) cand.push({ c: a.dv, src: a, cn: a.tpl, ps: a.ps, int: a.int, end: a.end, me: a.me });
    // the focal echo: a phrase that ended on its focus may restart on the same swara an octave away
    // (consonant reinforcement, Widdess 2011 via Field 2018 n. 3; Field Ex. 9 restates a statement on mandra P)
    if (St && segAt[t] > 0) {
      const pk = plan[segAt[t] - 1], cur = notes[i];
      if (pk.focal != null && cur === pk.focal) [12, -12].forEach(d => {
        const j = ix(cur + d);
        if (j < 0 || t + 1 > lim || !Pj.valid(cur, notes[j])) return;
        const me2 = cls(i, j);
        if (!clash(m, me2) && bwd[t + 1][j * 3 + me2]) cand.push({ c: ECHO, src: {}, cn: [{ p: notes[j], i: j, dur: 1, g: -9, phrase: false, arp: false }], ps: [notes[j]], int: NO_LEAPS, end: j, me: me2 });
      });
    }
    // repetition (v0.4, phase 3): the phrase just sung, echoed (Field 2024 ¶33–40 after Viswanathan;
    // Field 2018 Ex. 10, 11, 18: statements restated, and a step lower each time)
    // a figure built here (an echo of the last phrase, or a yati) as a candidate device, when it is legal
    // where it would start and the round can still finish after it
    const offer = (js, durs, rh) => {
        if (js.some(j => j < 0 || j >= NN) || js.length < 2) return;
        const len = durs.reduce((a, b) => a + b, 0);
        if (t + len > lim || (rh.ends && t + len !== sg.e)) return;
        if (!Pj.valid(notes[i], notes[js[0]]) || (js[0] === i && js[1] !== i) || badLeap(i, js[0]) || !joinOK(i, js[0], St) || clash(m, cls(i, js[0])) || (hard && sameDirLeaps(i, js[0], js[1]))) return;
        for (let q = 1; q < js.length; q++) if (!Pj.valid(notes[js[q - 1]], notes[js[q]]) || badLeap(js[q - 1], js[q]) || (hard && q >= 2 && sameDirLeaps(js[q - 2], js[q - 1], js[q]))) return;
        const ps = js.map(j => notes[j]);
        if (hardAvoid.length && avoidsHard([notes[i]].concat(ps), 1)) return;
        const end = js[js.length - 1], me2 = cls(js[js.length - 2], end);
        if (!bwd[t + len][end * 3 + me2]) return;
        const cn = js.map((j, q) => ({ p: notes[j], i: j, dur: durs[q], g: -9, phrase: false, arp: false }));
        cand.push({ c: Object.assign({ kind: 'conv', dir: 0, F0: 0.6, N0: -0.2, len }, rh), src: {}, cn, ps, int: internalTerms(LX, cn), end, me: me2, rhyme: rh.bonus });
    };
    if (sg && segAt[t] > 0 && !rhymed[segAt[t]]) {
      const k = segAt[t], pv = phraseNotes[k - 1] || [];
      if (pv.length >= 3) {
        const pj = pv.map(n => n.i), pd = pv.map(n => n.dur);
        if (St) {
          // initial rhyme: the new phrase opens as the last one did
          for (let h = Math.min(5, pv.length - 1); h >= 3; h--) offer(pj.slice(0, h), pd.slice(0, h), { base: 'rhyme-start', id: 'rhyme-start', name: 'initial rhyme', bonus: 2.0 });
          // sequence: the whole phrase again, one raga step lower
          offer(pj.map(j => j - 1), pd, { base: 'sequence', id: 'sequence', name: 'sequence a step lower', bonus: 2.2 });
        }
        // end rhyme: the phrase ends with the last one's tail, moved to end on this phrase's focus
        // (offered below together with the yatis, which also end a phrase on its focus)
        if (sg.focal != null) {
          const shift = ix(sg.focal) - pj[pj.length - 1];
          for (let h = Math.min(4, pv.length); h >= 3; h--) offer(pj.slice(-h).map(j => j + shift), pd.slice(-h).map((d, q) => q === h - 1 ? 1 : d), { base: 'rhyme-end', id: 'rhyme-end', name: shift ? 'end rhyme, moved to the new focus' : 'end rhyme', bonus: 2.0, ends: true });
        }
      }
    }
    /* yatis (v0.4, phase 4): runs onto the phrase's focus that shrink (gopuccha) or grow (srotovaha) by
       one swara, each but the last followed by a gap; the phrase ends on the focus each time (Field 2018,
       Ex. 1.1, 12.1; Cormack 1992 p. 243: srotovaha "the most common non-calculated pattern"). Once a
       round, and only where the phrase is not cut short by the ending. */
    if (sg && sg.focal != null && lim === sg.e && !yatiUsed && !rhymed[segAt[t]]) {
      const fp = ix(sg.focal), dn = sg.contour === 'asc' ? -1 : 1, gaps = per >= 3 ? [1, 2] : [0, 1];
      for (const L of [3, 4, 5]) for (const shape of ['gopuccha', 'srotovaha']) for (const gp of gaps) {
        const ns = []; for (let n = L; n >= 2; n--) ns.push(n);
        if (shape === 'srotovaha') ns.reverse();
        const total = ns.reduce((a, b) => a + b, 0) + gp * (ns.length - 1);
        if (t + total !== lim) continue;
        const js = [], durs = [];
        ns.forEach((n, q) => { for (let k = n - 1; k >= 0; k--) { js.push(fp + dn * k); durs.push(k === 0 && q < ns.length - 1 ? 1 + gp : 1); } });
        offer(js, durs, { base: 'yati', id: 'yati-' + shape, name: shape + ' yati', design: shape, bonus: 0.6, ends: true });
      }
    }
    const g = units.length, tail = line.slice(-3);
    const hasAvoid = hardAvoid.length > 0 || softAvoid.length > 0, look = hasAvoid ? line.slice(-(maxAvoid - 1)).map(n => n.p) : null;
    // pidi (a session's slow rounds): more of the raga's own phrases (Vidya Subramanian §4: slow swarams
    // give "ample scope for … pidi (typical phrases in a given raga) based exploration")
    const pidi = Math.max(0, Math.min(1, +o.pidi || 0));
    const share = phraseSlots / t, target = targetShare(D.T) + 0.15 * pidi, push = 0.8 * (target - share) * 4 + (pidi ? 0.4 * pidi : 0);
    /* Score in two passes. The first leaves out the junction-dependent penalties (leaps, register,
       avoid lists), so it is an upper bound on the exact score; exact scores are computed in order of
       that bound until the rest are more than 15 tau below the best, where their weight is negligible. */
    const ph0 = t % per; curPh = ph0;
    const ub = cand.map(x => {
      const { c, ps } = x, isPh = PHRASE_KINDS.has(c.kind), isVar = c.kind === 'phrase-variant', anchored = !!c.phraseId;
      // the terms fixed for this device in this round (and for this place in the akshara), cached per call
      let fx = x.src.fx;
      if (!fx || fx.stamp !== stamp) fx = x.src.fx = { stamp, by: [] };
      let b = fx.by[ph0];
      if (!b) b = fx.by[ph0] = fixedTerms(c, x.cn, ps, isPh);
      let F = b.F, N = b.N;
      if (!anchored && prev && prev.base === c.base && prev.dir === c.dir) { F += 0.5; N -= 0.4; }
      if (prev && prev.id === c.id && prev.startP === ps[0]) { F += 0.2; N -= 1.0; }
      if (anchored && used.has(c.phraseId)) F -= 0.8;
      // the move into the device: idiomatic or not, and for a phrase, how far it had to jump to begin
      const p0 = line[line.length - 1].p;
      let I = b.I + moveIdiom(p0, ps[0]);
      // (an attested phrase is idiom itself, so its entry costs half as much as a variant's)
      if (anchored) { const d = Math.abs(x.cn[0].i - i); if (d >= 2) I -= (isPh ? 0.3 : 0.6) * (d - 1); }
      if (prev && prev.dir && c.dir && c.dir !== prev.dir) N += 0.3;
      // the phrase plan (v0.4): follow the phrase's contour toward its focus, end the phrase on the focus,
      // and keep karvais for phrase ends. Like the idiom, it keeps half its weight at T 2: creativity varies
      // the phrases, it does not dissolve them
      let P = 0;
      if (sg && sg.focal != null) {
        const te = t + c.len, Ef = expectedPos(sg, (te - sg.a) / Math.max(1, sg.e - sg.a));
        P -= Math.min(1.2, 0.25 * Math.abs(x.end - Ef));
        // the focus still within reach at the phrase's end
        const tf = toFocus && toFocus[segAt[t]];
        if (tf && te < sg.e && tf[te - sg.a][x.end * 3 + x.me]) P += 0.9;
        if (te === sg.e) {
          const lp = ps[ps.length - 1];
          if (lp === sg.focal) P += 2.4; else if (Math.abs(x.end - sg.focalPos) <= 1) P += 0.7; else if (mod12(lp) === mod12(sg.focal)) P += 0.3;
        }
        if (!isPh && !x.rhyme) {
          if (x.cn.some((n, k) => k < x.cn.length - 1 && n.dur >= 2)) P -= 0.6;
          else if (te !== sg.e && x.cn[x.cn.length - 1].dur >= 2) P -= 0.3;
        }
      }
      // a phrase that echoes the one before is what makes the round cohere (once per phrase)
      if (x.rhyme) P += x.rhyme;
      // the raga's idiom keeps at least half its weight at every temperature: creativity means
      // out-of-the-box phrases of this raga, not jumps it never makes
      let score = (1 - D.c) * F + D.c * N + (1 - 0.5 * D.c) * (I + P);
      // the phrase-share controller: predominantly characteristic phrases, occasionally out-of-the-box ones
      // (the novelty side scales with c, so a round at T = 0 fills the rest with conventional devices)
      if (isPh) score += push;
      else if (push < 0 && (isVar || c.kind === 'nov')) score -= push * D.c;
      return score;
    });
    let lo = Infinity, hi = -Infinity; for (const v of ub) { if (v < lo) lo = v; if (v > hi) hi = v; }
    const order = cand.map((x, k) => k);
    if (hi - lo > 15 * D.tau) order.sort((a, b) => ub[b] - ub[a] || a - b);
    // away from the end, a device's junction terms depend only on its first three swaras
    const memo = new Map();
    const pickIx = [], scores = [];
    let best = -Infinity, avoided = [];
    for (const k of order) {
      if (ub[k] < best - 15 * D.tau) break;
      const x = cand[k], cn = x.cn, ph = PHRASE_KINDS.has(x.c.kind), last = t + x.c.len === B;
      // leap terms: the device's own moves (precomputed) plus its junctions; the junction into the mora counts
      let bt;
      if (last) bt = boundaryTerms(LX, tail, cn, after, !!mora);
      else {
        const i1 = cn.length > 1 ? cn[1].i + 1 : 0, i2 = cn.length > 2 ? cn[2].i + 1 : 0;
        const key = (((cn[0].i + 1) * 64 + i1) * 64 + i2) * 64 + Math.min(cn[0].dur, 15) * 4 + (cn[0].phrase ? 2 : 0) + (cn[0].arp ? 1 : 0);
        bt = memo.get(key);
        if (!bt) { bt = boundaryTerms(LX, tail, cn, [], false); memo.set(key, bt); }
      }
      x.L = { unl: x.int.unl + bt.unl, dbl: x.int.dbl + bt.dbl, unres: x.int.unres + bt.unres };
      // register: the span of each akshara the device touches (attested phrases carry their own)
      const reg = per > 1 && !ph ? registerExcess(cn, t) : 0;
      let sa = 0;
      if (hasAvoid) {
        // hard avoid lists are exact for one swara of look-behind; longer junctions are avoided whenever possible
        if (hardAvoid.length && hardAvoid.some(pat => runAcross(look, x.ps, pat))) { avoided.push(k); continue; }
        for (const pat of softAvoid) if (runAcross(look, x.ps, pat)) sa++;
      }
      const allowed = Math.floor(LX.budget * (t + x.c.len) / 8 + 1e-9);
      const over = Math.max(0, Math.min(x.L.unl, unlSoFar + x.L.unl - allowed));
      // reasoned jumps (plan 3.2), all on F so they fade as c rises
      // (an unresolved leap costs 1.0: with the join rule, a skip of a third is the usual leap left, and
      // the line should step back after it, plan 3.2)
      const pen = 1.5 * x.L.unl + 1.0 * x.L.unres + 2.0 * x.L.dbl + 1.0 * over + 0.8 * reg + 1.0 * sa;
      const sc = ub[k] - (1 - D.c) * pen;
      pickIx.push(k); scores.push(sc);
      if (sc > best) best = sc;
    }
    if (!pickIx.length) avoided.forEach(k => { pickIx.push(k); scores.push(ub[k]); });   // nothing else can finish
    const ch = cand[pickIx[soft(scores, D.tau, rand)]], c = ch.c;
    const unit = { kind: c.kind, base: c.base, id: c.id, name: c.name, dir: c.dir, t, notes: ch.cn.map(n => ({ p: n.p, dur: n.dur })) };
    if (c.phraseId) Object.assign(unit, { phraseId: c.phraseId, source: c.source, type: c.type, variant: c.variant }, c.exception ? { exception: true } : {});
    if (plan) {
      unit.phrase = segAt[t];
      ch.cn.forEach(n => phraseNotes[segAt[t]].push({ p: n.p, i: n.i, dur: n.dur }));
      if (ch.rhyme) rhymed[segAt[t]] = true;
      if (c.base === 'yati') { yatiUsed = true; unit.design = c.design; }
    }
    units.push(unit);
    { let p0 = t; ch.cn.forEach(n => { line.push(Object.assign({}, n, { g, pos: p0 })); p0 += n.dur; }); }
    unlSoFar += ch.L.unl;
    if (PHRASE_KINDS.has(c.kind)) phraseSlots += c.len;
    if (c.phraseId) used.add(c.phraseId);
    prev = { base: c.base, id: c.id, dir: c.dir, startP: ch.cn[0].p };
    t += c.len; i = ch.end; m = ch.me;
  }
  if (mora && mora.parts) {
    // the korvai: three units, each its own unit in the output
    mora.parts.forEach((pt, r) => {
      const ns = pt.js.map((j, k) => ({ p: notes[j], dur: pt.durs[k] })), g = units.length;
      units.push({ kind: 'korvai', base: 'korvai', name: 'korvai unit ' + (r + 1) + ' of 3', dir: -1, t, notes: ns });
      ns.forEach((n, k) => { line.push({ p: n.p, i: pt.js[k], dur: n.dur, pos: t, g }); t += n.dur; });
    });
  } else if (mora) {
    for (let r = 0; r < 3; r++) {
      const st = mora.stmts[r], dd = mora.durs ? mora.durs[r] : null;
      const ns = st.map((j, k) => ({ p: notes[j], dur: (dd ? dd[k] : 1) + (k === st.length - 1 && r < 2 ? mora.q : 0) }));
      const g = units.length;
      units.push({ kind: 'mora', base: 'mora', name: 'mora ' + (r + 1) + ' of 3', dir: 0, t, notes: ns });
      ns.forEach((n, k) => { line.push({ p: n.p, i: st[k], dur: n.dur, pos: t, g }); t += n.dur; });
    }
  }
  const notesOut = []; units.forEach(u => u.notes.forEach(n => notesOut.push(n)));
  const slotsOf = u => u.notes.reduce((s, n) => s + n.dur, 0);
  let nov = 0, conv = 0, phraseS = 0, variantS = 0; const devices = {}, phrasesUsed = [];
  units.forEach(u => {
    const L = slotsOf(u);
    if (u.kind === 'nov') nov += L; else if (u.kind === 'phrase-variant') variantS += L;
    else if (PHRASE_KINDS.has(u.kind)) phraseS += L; else if (u.kind === 'conv' || u.kind === 'mora' || u.kind === 'korvai') conv += L;
    if (u.kind !== 'start' && u.kind !== 'step' && u.kind !== 'mora' && u.kind !== 'korvai') { const k = u.name + (u.dir > 0 ? ' ↑' : u.dir < 0 ? ' ↓' : ''); devices[k] = (devices[k] || 0) + 1; }
    if (u.phraseId) phrasesUsed.push({ phraseId: u.phraseId, source: u.source, kind: u.kind, variant: u.variant, type: u.type, notes: u.notes.map(n => n.p) });
  });
  const endInfo = mora && mora.parts ? {
    type: 'korvai', style: 'korvai', units: mora.parts.map(pt => pt.js.map(j => notes[j])), run: mora.n, rests: mora.rho, gap: mora.Q, start: mora.B
  } : mora ? {
    type: 'mora', style: mora.style, statements: mora.stmts.map(st => st.map(j => notes[j])), q: mora.q, start: mora.B,
    adjusted: mora.adjusted, template: mora.template, templatePhrase: mora.phraseId || null, direction: mora.delta > 0 ? 'down' : mora.delta < 0 ? 'up' : 'none',
    timing: mora.durs ? mora.durs.map(d => d.reduce((a, b) => a + b, 0)) : null,
    phrase: mora.stmts[2].map(j => notes[j])   // deprecated: the last statement (v0.2 had one phrase three times)
  } : (ending === 'mora' || ending === 'korvai' ? { type: 'free', fallbackFrom: ending } : { type: 'free' });
  if (ending === 'korvai' && endInfo.type === 'mora') endInfo.fallbackFrom = 'korvai';
  if (useEduppu) Object.assign(endInfo, { eduppu: e, final: targetPitch, approach: pick.approach });
  const leaps = leapStats(LX, line, useEduppu ? [{ p: e, i: ix(e), dur: 1, g: -2 }] : [], slots);
  return {
    notes: notesOut, slots, units,
    ending: endInfo,
    stats: {
      novelShare: (nov + variantS) / slots, convShare: (conv + phraseS) / slots,
      phraseShare: phraseS / slots, variantShare: variantS / slots,
      profileCoverage: profileCoverage(profile, phraseCount), phrases: phrasesUsed, devices, leaps,
      plan: plan ? 'phrases' : 'none'
    },
    // v0.4: the phrase plan as sung (phrases the mora cut short have no karvai)
    phrases: phraseLog ? phraseLog.filter(p => p.start < B) : [],
    dial: D, level
  };
}

function kalpana(raga, opts) {
  const res = kalpanaRound(raga, opts);
  return res.error ? null : res;
}

export { CELL_DEFS, CELLS, KALPANA_RANGE, eduppuNeighbours, kalpana, kalpanaRound };
