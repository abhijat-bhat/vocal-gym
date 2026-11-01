import { mod12 } from '../projection.js';

/* Vocal Gym engine · the phrase layer of a kalpana round (v0.4, docs/research/kalpana-structure.md)
   A round is planned as phrases before any device is chosen. The literature this follows:
     - swara passages are grouped in half-avartanas (four beats of Adi), then avartanas (Morris 2011,
       p. 9), and every transcribed design is counted to fit the tala (Field 2018);
     - each phrase ends on a held swara (karvai) or a rest: the gap of a mora, the end of a line of a
       yati (Field 2018, Ex. 1.2, 2.1, 3);
     - a group of phrases has a focal note, and the focus moves (Vidya Subramanian 2008, §8: "patterns are
       built around that given note"; Field 2024 ¶26–32, after Viswanathan: a pitch focus per phrase
       group, moving through the raga);
     - figures descend: "the melodic contour in each unit usually descends" (Field 2018, p. 7); a phrase
       rises only as the raga's ascent allows (the direction rule, a hard rule elsewhere).
   planPhrases gives the time plan (hard: devices fit inside a phrase, its last swara is held);
   focusPlan the focal notes and contours (soft: scores in the sampler). */

/* phrase plan: [{ a, e, r, next }] covering [0, slots]: devices fill [a, e), the swara sung at e is held
   for r slots (the karvai), the next phrase starts at next = e + r. null when the round is too short.
   angas: anga lengths in aksharas, repeated (Adi [4, 2, 2]); per: slots per akshara. */
export function planPhrases(slots, per, angas, c, rand) {
  if (slots < 6) return null;
  const A = slots / per;
  const lens = angas && angas.length ? angas : (A % 8 === 0 ? [4, 2, 2] : [2]);
  // anga starts, in slots, across the round
  const bounds = [0];
  for (let k = 0, x = 0; x < A - 1e-9; k++) { x += lens[k % lens.length]; bounds.push(Math.min(slots, Math.round(x * per))); }
  if (bounds[bounds.length - 1] !== slots) bounds.push(slots);
  // a phrase of about a half-avartana of Adi at first speed (8 slots), a little longer at second speed
  const target = per <= 1 ? 4 : per === 2 ? 8 : per === 3 ? 9 : 12;
  const ends = [];
  let at = 0;
  while (at < slots) {
    const want = target * (0.8 + 0.45 * rand()), opts = bounds.filter(b => b > at);
    let best = opts[opts.length - 1], bd = Infinity;
    for (const b of opts) {
      const len = b - at, rest = slots - b;
      if (rest > 0 && rest < 0.5 * target) continue;          // no scrap of a phrase at the end
      const d = Math.abs(len - want);
      if (d < bd) { bd = d; best = b; }
    }
    // creativity: now and then a phrase ends an akshara off the anga (patterns that counter the beat
    // "give a certain punch", Vidya Subramanian §2)
    if (best < slots && rand() < 0.35 * c) {
      const shifted = best + (rand() < 0.5 ? -per : per);
      if (shifted - at >= 0.6 * target && slots - shifted >= 0.5 * target) best = shifted;
    }
    ends.push(best); at = best;
  }
  const plan = [];
  let a = 0;
  ends.forEach((b, k) => {
    const len = b - a;
    // the karvai: one slot, two in a long phrase at four a beat. v0.7.1: a beat-long hold at every phrase end
    // made a quarter of the round sustained swaras, twice the 13% of the raga's attested phrases; so the
    // hold is short, and about a third of the inner phrase ends flow on without one (sarvalaghu: the
    // streams of Field 2018 Ex. 9, 10 run on between their statements)
    let r = per >= 4 && len >= 14 ? 2 : 1;
    if (k < ends.length - 1 && k > 0 && rand() < 0.33) r = 0;
    r = Math.min(r, Math.floor(len / 3));
    plan.push({ a, e: b - r, r, next: b });
    a = b;
  });
  if (plan.length < 2 && plan[0].e - plan[0].a < 4) return null;
  return plan;
}

/* focal notes and contours for the plan (scores only). candidates: pitches (ascending) a phrase may
   centre on; startPitch, landing: the round's first and last swaras; focus: a requested focal pitch. */
export function focusPlan(plan, candidates, pos, startPitch, landing, focus, rand) {
  if (!plan || !candidates.length) return;
  const near = p => candidates.reduce((b, q) => Math.abs(q - p) < Math.abs(b - p) ? q : b, candidates[0]);
  const gsize = plan.length >= 4 ? 2 : 1, groups = Math.ceil(plan.length / gsize);
  const ci = p => candidates.indexOf(near(p));
  // the first focus: the requested one, or a structural swara a few semitones above the opening
  let k0 = focus != null ? ci(focus) : ci(startPitch + 3 + Math.floor(rand() * 5));
  let dir = 1;
  const foci = [];
  for (let g = 0; g < groups; g++) {
    // the last group's focus is the round's landing itself (or the mora's first swara): the round ends there
    if (g === groups - 1 && groups > 1) { foci.push(landing); break; }
    foci.push(candidates[k0]);
    // the focus moves on by one structural swara, turning at the top of the range
    if (k0 + dir < 0 || k0 + dir >= candidates.length || candidates[k0 + dir] > 16) dir = -dir;
    if (rand() < 0.75) k0 = Math.max(0, Math.min(candidates.length - 1, k0 + dir));
  }
  plan.forEach((sg, k) => {
    sg.group = Math.floor(k / gsize);
    sg.focal = foci[Math.min(sg.group, foci.length - 1)];
    const prevF = k === 0 ? startPitch : plan[k - 1].focal;
    // a phrase that has to climb to its focus rises (as the raga's ascent allows) or arches; otherwise it descends
    sg.contour = sg.focal > prevF + 2 ? (rand() < 0.5 ? 'asc' : 'arch') : 'desc';
    sg.focalPos = pos(sg.focal);
    sg.startPos = k === 0 ? pos(startPitch) : null;
  });
}

/* the scale position a phrase's contour expects at fraction u of its device span */
export function expectedPos(sg, u) {
  const f = sg.focalPos, h = 3;
  if (sg.startPos != null) return sg.startPos + (f - sg.startPos) * u;
  if (sg.contour === 'asc') return f - h * (1 - u);
  if (sg.contour === 'arch') return f + h * Math.sin(Math.PI * u) - (1 - u);
  return f + h * (1 - u);
}

/* the swaras a phrase may centre on: the profile's resting swaras, S and P, never alpa or a swara not to rest on */
export function focalCandidates(notes, profile, pcs) {
  const want = new Set([0, 7].filter(pc => pcs.includes(pc)));
  if (profile) ['nyasa', 'landing', 'jiva'].forEach(k => (profile[k] || []).forEach(pc => want.add(pc)));
  const bad = new Set(profile ? (profile.alpa || []).concat(profile.avoidLanding || [], profile.notNyasa || []) : []);
  return notes.filter(p => want.has(mod12(p)) && !bad.has(mod12(p)) && p >= -3 && p <= 17);
}
