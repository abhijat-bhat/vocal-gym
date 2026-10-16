import { mod12 } from '../projection.js';

/* Vocal Gym engine · reasoned jumps
   A step moves one place in the raga's union scale (the notes array kalpana builds); a leap moves
   two or more. Every move counts, including the move from one device into the next.
   A leap is licensed when
     1. it lies inside an attested phrase or fragment (the source is the licence),
     2. it lands on a structural swara (S, P, or a profile nyasa, jiva or landing swara) and is no
        wider than a fifth: a resting swara does not excuse a seventh,
     3. it is a fourth, fifth or octave,
     4. it lies inside an arpeggio device at T >= 1.
   A leap is resolved when, within the next two swaras, the line steps back the other way, or holds
   the swara it leapt to. Outside attested phrases the leap filter has three levels:
     2 (strict, T < 1.5)  no tritone, no leap onto an alpa swara, no two leaps in a row in one
                          direction, and nothing wider than a fifth except the octave
     1 (T >= 1.5)         nothing wider than a major sixth, except the octave
     0                    no filter; used only when a short span cannot be filled otherwise */
const CONSONANT = new Set([5, 7, 12]);
const BUDGET = [[0, 0], [0.5, 0.5], [1, 1], [1.5, 2], [2, 3]];   // unlicensed leaps per 8 slots

function leapBudget(T) {
  for (let k = 1; k < BUDGET.length; k++) {
    const [t0, b0] = BUDGET[k - 1], [t1, b1] = BUDGET[k];
    if (T <= t1) return b0 + (b1 - b0) * (T - t0) / (t1 - t0);
  }
  return BUDGET[BUDGET.length - 1][1];
}

/* level: the leap filter level (2 strict, 1 octave only, 0 none); maxLeap the widest leap level 2 allows */
const maxLeapFor = T => 7;
function leapContext(profile, T, level) {
  const structural = new Set([0, 7]);
  if (profile) [profile.nyasa, profile.jiva, profile.landing].forEach(a => (a || []).forEach(pc => structural.add(pc)));
  return { T, level, hard: level >= 2, maxLeap: level >= 2 ? maxLeapFor(T) : 12, structural, alpa: new Set(profile ? profile.alpa || [] : []), budget: leapBudget(T), regCap: T < 1 ? 9 : 12 };
}

const isLeap = (ia, ib) => Math.abs(ib - ia) >= 2;

/* Why a leap from pitch a to pitch b is allowed, or null. tag: { phrase, arp } for the device it lies in. */
function licence(LX, a, b, tag) {
  if (tag && tag.phrase) return 'phrase';
  if (LX.structural.has(mod12(b)) && Math.abs(b - a) <= 7) return 'structural';
  if (CONSONANT.has(Math.abs(b - a))) return 'consonant';
  if (tag && tag.arp && LX.T >= 1) return 'arpeggio';
  return null;
}

/* The state-independent prohibition a leap breaks, or null (by size and target, whatever the level). */
function forbiddenLeap(LX, a, b) {
  const s = Math.abs(b - a);
  if (s === 6) return 'tritone';
  if (s > 12) return 'wide';
  if (s > maxLeapFor(LX.T) && s !== 12) return 'large';
  if (LX.alpa.has(mod12(b))) return 'alpa';
  return null;
}
/* ... and whether the context's filter level forbids it */
function blocked(LX, a, b) {
  if (LX.level <= 0) return false;
  const s = Math.abs(b - a);
  if (s > 12 || (s > 9 && s !== 12)) return true;
  if (LX.level < 2) return false;
  return s === 6 || (s > LX.maxLeap && s !== 12) || LX.alpa.has(mod12(b));
}

/* seq: notes { p, i, dur, g (unit id), phrase, arp }. A move into position k lies inside a device when
   seq[k] and seq[k - 1] share g. */
const inside = (seq, k) => seq[k].g != null && seq[k].g === seq[k - 1].g;
const tagOf = (seq, k) => inside(seq, k) ? { phrase: !!seq[k].phrase, arp: !!seq[k].arp } : null;
function resolved(seq, k) {
  const d = seq[k].i - seq[k - 1].i;
  if (seq[k].dur >= 2) return true;
  for (let m = k + 1; m <= k + 2 && m < seq.length; m++) {
    const e = seq[m].i - seq[m - 1].i;
    if (m === k + 1 && e === 0) return true;                       // held by repetition
    if (Math.abs(e) === 1 && Math.sign(e) === -Math.sign(d)) return true;
  }
  return false;
}

/* Sampling terms for a candidate. Moves arriving at positions from .. countTo - 1 are counted
   (unlicensed leaps, same-direction double leaps); every leap whose two-swara resolution window
   closes at or after `from` is judged. Windows that run past the end of seq are judged later, or
   not at all at the end of the round. */
function leapTerms(LX, seq, from, countTo) {
  let unl = 0, dbl = 0, unres = 0;
  for (let k = 1; k < seq.length; k++) {
    const d = seq[k].i - seq[k - 1].i;
    if (Math.abs(d) < 2) continue;
    const tag = tagOf(seq, k), ph = !!(tag && tag.phrase);
    if (k >= from && k < countTo) {
      if (!licence(LX, seq[k - 1].p, seq[k].p, tag)) unl++;
      if (!ph && k >= 2) {
        const d0 = seq[k - 1].i - seq[k - 2].i, t0 = tagOf(seq, k - 1);
        if (Math.abs(d0) >= 2 && Math.sign(d0) === Math.sign(d) && !(t0 && t0.phrase)) dbl++;
      }
    }
    if (ph) continue;
    const close = k + 2;
    if (close < seq.length && close >= from && !resolved(seq, k)) unres++;
  }
  return { unl, dbl, unres };
}

/* The same terms split for speed: internalTerms(cn) covers the device's own moves and is computed
   once per device; boundaryTerms covers the moves that touch the line before it (tail) or what
   follows the body (after: the mora, counted, or the eduppu, judged only). Together they equal
   leapTerms(tail ++ cn ++ after, tail.length, ...). */
function internalTerms(LX, cn) { return leapTerms(LX, cn, 1, cn.length); }
function boundaryTerms(LX, tail, cn, after, countAfter) {
  const T0 = tail.length, E = T0 + cn.length, len = E + after.length;
  const at = k => k < T0 ? tail[k] : k < E ? cn[k - T0] : after[k - E];
  const mv = k => at(k).i - at(k - 1).i;
  const inPhrase = k => { const a = at(k), b = at(k - 1); return a.g === b.g && a.g != null && !!a.phrase; };
  let unl = 0, dbl = 0, unres = 0;
  const counted = countAfter && after.length ? [T0, E] : [T0];
  for (const k of counted) {
    if (k < 1 || k >= len || Math.abs(mv(k)) < 2) continue;
    const a = at(k - 1), b = at(k), tag = a.g === b.g ? { phrase: !!b.phrase, arp: !!b.arp } : null;
    if (!licence(LX, a.p, b.p, tag)) unl++;
  }
  for (const k of countAfter && after.length ? [T0, T0 + 1, E] : [T0, T0 + 1]) {
    if (k < 2 || k >= len || (k === T0 + 1 && k >= E)) continue;
    const d = mv(k), d0 = mv(k - 1);
    if (Math.abs(d) >= 2 && Math.abs(d0) >= 2 && Math.sign(d) === Math.sign(d0) && !inPhrase(k) && !inPhrase(k - 1)) dbl++;
  }
  for (let k = Math.max(1, T0 - 2); k < len; k++) {
    const d = mv(k), close = k + 2;
    if (Math.abs(d) < 2 || close >= len || close < T0 || inPhrase(k)) continue;
    if (k >= T0 + 1 && close <= E - 1) continue;                  // internal: counted once per device
    if (at(k).dur >= 2) continue;
    let ok = false;
    for (let m = k + 1; m <= close; m++) { const e = mv(m); if ((m === k + 1 && e === 0) || (Math.abs(e) === 1 && Math.sign(e) === -Math.sign(d))) { ok = true; break; } }
    if (!ok) unres++;
  }
  return { unl, dbl, unres };
}

/* Statistics for a finished line. after: notes that follow the round (the eduppu), used only to
   judge resolution. */
function leapStats(LX, line, after, slots) {
  const seq = line.concat(after || []), list = [];
  let licensed = 0, unlicensed = 0, unresolved = 0, tritone = 0, wide = 0, large = 0, alpa = 0, double = 0, overFifth = 0;
  for (let k = 1; k < line.length; k++) {
    const d = seq[k].i - seq[k - 1].i;
    if (Math.abs(d) < 2) continue;
    const tag = tagOf(seq, k), ph = !!(tag && tag.phrase);
    const lic = licence(LX, seq[k - 1].p, seq[k].p, tag);
    const res = ph || k + 2 >= seq.length ? true : resolved(seq, k);
    if (lic) licensed++; else unlicensed++;
    if (!res) unresolved++;
    if (!ph) {
      const f = forbiddenLeap(LX, seq[k - 1].p, seq[k].p);
      if (f === 'tritone') tritone++; else if (f === 'wide') wide++; else if (f === 'large') large++; else if (f === 'alpa') alpa++;
      const sz = Math.abs(seq[k].p - seq[k - 1].p); if (sz > 7 && sz !== 12) overFifth++;
      if (k >= 2) { const d0 = seq[k - 1].i - seq[k - 2].i, t0 = tagOf(seq, k - 1); if (Math.abs(d0) >= 2 && Math.sign(d0) === Math.sign(d) && !(t0 && t0.phrase)) double++; }
    }
    list.push({ from: seq[k - 1].p, to: seq[k].p, at: k, licence: lic, resolved: res });
  }
  const total = list.length;
  return { total, licensed, unlicensed, unresolved, perEight: slots ? unlicensed * 8 / slots : 0, outsidePhrases: { tritone, wide, large, alpa, double, overFifth }, list };
}

export { CONSONANT, leapBudget, leapContext, maxLeapFor, isLeap, licence, forbiddenLeap, blocked, leapTerms, internalTerms, boundaryTerms, leapStats };
