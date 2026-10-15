import { mod12 } from '../projection.js';

/* Vocal Gym engine · reasoned jumps
   A step moves one place in the raga's union scale (the notes array kalpana builds); a leap moves
   two or more. Every move counts, including the move from one device into the next.
   A leap is licensed when
     1. it lies inside an attested phrase or fragment (the source is the licence),
     2. it lands on a structural swara: S, P, or a profile nyasa, jiva or landing swara,
     3. it is a fourth, fifth or octave (thirds count only onto structural swaras, which rule 2 covers),
     4. it lies inside an arpeggio device at T >= 1.
   A leap is resolved when, within the next two swaras, the line steps back the other way, or holds
   the swara it leapt to. Below T = 1.5, outside attested phrases, the tritone, leaps wider than an
   octave, leaps onto an alpa swara and two leaps in a row in one direction are not allowed. */
const CONSONANT = new Set([5, 7, 12]);
const BUDGET = [[0, 0], [0.5, 0.5], [1, 1], [1.5, 2], [2, 3]];   // unlicensed leaps per 8 slots

function leapBudget(T) {
  for (let k = 1; k < BUDGET.length; k++) {
    const [t0, b0] = BUDGET[k - 1], [t1, b1] = BUDGET[k];
    if (T <= t1) return b0 + (b1 - b0) * (T - t0) / (t1 - t0);
  }
  return BUDGET[BUDGET.length - 1][1];
}

/* hard: apply the state-independent prohibitions (T < 1.5 unless relaxed) */
function leapContext(profile, T, hard) {
  const structural = new Set([0, 7]);
  if (profile) [profile.nyasa, profile.jiva, profile.landing].forEach(a => (a || []).forEach(pc => structural.add(pc)));
  return { T, hard, structural, alpa: new Set(profile ? profile.alpa || [] : []), budget: leapBudget(T), regCap: T < 1 ? 9 : 12 };
}

const isLeap = (ia, ib) => Math.abs(ib - ia) >= 2;

/* Why a leap from pitch a to pitch b is allowed, or null. tag: { phrase, arp } for the device it lies in. */
function licence(LX, a, b, tag) {
  if (tag && tag.phrase) return 'phrase';
  if (LX.structural.has(mod12(b))) return 'structural';
  if (CONSONANT.has(Math.abs(b - a))) return 'consonant';
  if (tag && tag.arp && LX.T >= 1) return 'arpeggio';
  return null;
}

/* The state-independent prohibition a leap breaks, or null. */
function forbiddenLeap(LX, a, b) {
  const s = Math.abs(b - a);
  if (s === 6) return 'tritone';
  if (s > 12) return 'wide';
  if (LX.alpa.has(mod12(b))) return 'alpa';
  return null;
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

/* Statistics for a finished line. after: notes that follow the round (the eduppu), used only to
   judge resolution. */
function leapStats(LX, line, after, slots) {
  const seq = line.concat(after || []), list = [];
  let licensed = 0, unlicensed = 0, unresolved = 0, tritone = 0, wide = 0, alpa = 0, double = 0;
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
      if (f === 'tritone') tritone++; else if (f === 'wide') wide++; else if (f === 'alpa') alpa++;
      if (k >= 2) { const d0 = seq[k - 1].i - seq[k - 2].i, t0 = tagOf(seq, k - 1); if (Math.abs(d0) >= 2 && Math.sign(d0) === Math.sign(d) && !(t0 && t0.phrase)) double++; }
    }
    list.push({ from: seq[k - 1].p, to: seq[k].p, at: k, licence: lic, resolved: res });
  }
  const total = list.length;
  return { total, licensed, unlicensed, unresolved, perEight: slots ? unlicensed * 8 / slots : 0, outsidePhrases: { tritone, wide, alpa, double }, list };
}

export { CONSONANT, leapBudget, leapContext, isLeap, licence, forbiddenLeap, leapTerms, leapStats };
