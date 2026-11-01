/* Vocal Gym engine · the gamaka intensity dial (docs/research/gamaka-naturalness.md §3.2)
   intensity a ∈ [0, 1] is not a width knob: it decides which gamakas are sung, how many cycles,
   how far they reach and how freely. Raga-identity gamakas come in first and decoration last, and a
   gamaka fades in from 60% of its swing, never from nothing, so a mid setting never wobbles between
   swaras. 0 is plain playback; 1 is heavy and accurate (every rule, full reach, no jitter). */
export const HEAVY_AT = 0.85;   // from here on: medium defaults for unmentioned swaras, longer chains, firmer turns

/* how central a component is to the raga: raga rules first, vague text next, the generic default last */
const SALIENCE = {
  raga: { body: 0.92, onset: 0.75, exit: 0.70 },
  // the swara grammar (gamaka/grammar.js): sourced, phrase-aware rules for every raga
  grammar: { body: 0.82, onset: 0.66, exit: 0.60 },
  vague: { body: 0.60, onset: 0.60, exit: 0.60 },
  generic: { body: 0.45, onset: 0.38, exit: 0.38 }
};
export const originOf = rule => !rule || rule.basis === 'default' ? 'generic' : rule.basis === 'grammar' ? 'grammar' : rule.basis === 'text-vague' ? 'vague' : 'raga';
export const salience = (origin, comp) => SALIENCE[origin][comp];
/* the intensity a component needs before it is sung */
export const need = s => 0.9 * (1 - s);
/* the share of its swing a sung component reaches: 0.6 when it first appears, 1 at full intensity */
export function reach(a, s) {
  const n = need(s);
  if (a < n) return 0;
  return n >= 1 ? 1 : 0.6 + 0.4 * Math.min(1, (a - n) / (1 - n));
}
/* the oscillation cycles to offer, between the rule's minimum and maximum */
export function cyclesAt(a, cycles) {
  const c0 = cycles[0], c1 = cycles[1], f = Math.min(1, Math.max(0, (a - 0.2) / 0.6));
  return Math.max(c0, Math.min(c1, c0 + Math.round((c1 - c0) * f)));
}
/* human variation: largest at the performative middle, none at full (accurate) or at 0 */
export const human = a => a <= 0 ? 0 : a <= 0.55 ? a / 0.55 : Math.max(0, (1 - a) / 0.45);
/* natural voice motion (overshoot, preparation, fine fluctuation) comes in over the first 20% */
export const motion = a => Math.min(1, Math.max(0, a / 0.2));
export const clamp01 = a => Math.min(1, Math.max(0, +a || 0));
