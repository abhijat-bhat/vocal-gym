/* Vocal Gym engine · seeded randomness and the creativity dial
   Every generator takes a seed, so the same inputs always give the same output.
   dial(T) turns the user-facing temperature into the tilt c and sampling width tau. */

function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick(items, scoreFn, T, rand) {
  if (!items.length) return null;
  const s = items.map(scoreFn);
  if (T <= 0.05) { let b = 0; for (let i = 1; i < s.length; i++) if (s[i] > s[b]) b = i; return items[b]; }
  const m = Math.max.apply(null, s);
  const w = s.map(x => Math.exp((x - m) / T));
  let r = rand() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}
/* index of a softmax sample */
function soft(scores, tau, rand) {
  if (!scores.length) return -1;
  let m = -Infinity; for (const x of scores) if (x > m) m = x;
  const w = scores.map(x => Math.exp((x - m) / Math.max(tau, 1e-3)));
  let r = rand() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; }
  return w.length - 1;
}
/* Temperature T in [0, 2] is the singer's creativity.
   c = T / 2 tilts every score from familiarity (c = 0) to novelty (c = 1);
   tau = 0.3 + 0.45 T is the sampling width, never zero, so new seeds give new outputs even at T = 0. */
function dial(T) {
  const t = Math.max(0, Math.min(2, Number(T) || 0));
  return { T: t, c: t / 2, tau: 0.3 + 0.45 * t };
}

export { rng, pick, soft, dial };
