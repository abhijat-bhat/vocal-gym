import { makeProjector, mod12 } from '../projection.js';

/* Vocal Gym engine · landing next to the eduppu swara
   The eduppu swara is where the composition resumes; the singer sings it, the round does not.
   The round ends on a legal neighbour of it, so that the step into the eduppu obeys the raga:
     lo(e)  the arohana swara just before e, so the singer ascends into e (only if e is in the arohana)
     hi(e)  the avarohana swara just before e in descent, so the singer descends into e
            (only if e is in the avarohana)
   Both lists are extended across octaves exactly as makeProjector does. */
const KALPANA_RANGE = [-5, 19];   // mandra Pa .. tara Pa

function eduppuNeighbours(raga, e) {
  const P = makeProjector(raga), pcs = new Set(raga.aro.concat(raga.avaro).map(mod12));
  if (typeof e !== 'number' || !Number.isInteger(e)) return { error: 'The eduppu swara must be a pitch in semitones above Sa.', code: 'bad-eduppu' };
  if (!pcs.has(mod12(e))) return { error: 'The eduppu swara is not a swara of ' + raga.name + '.', code: 'eduppu-not-in-raga' };
  const inRange = p => p >= KALPANA_RANGE[0] && p <= KALPANA_RANGE[1];
  const span = 3 + Math.ceil(Math.abs(e) / 12);
  const find = (ext, n) => { for (let i = -span * n; i <= span * n; i++) if (ext(i) === e) return ext(i - 1); return null; };
  let lo = find(P.aroExt, P.nA), hi = find(P.avExt, P.nD);
  if (lo != null && !(lo < e && P.valid(lo, e))) lo = null;
  if (hi != null && !(hi > e && P.valid(hi, e))) hi = null;
  return { eduppu: e, lo: lo != null && inRange(lo) ? lo : null, hi: hi != null && inRange(hi) ? hi : null, inRange: inRange(e) };
}

/* Familiarity of each approach. Deliberately mild: a landing or nyasa swara, approaching S or P
   from above, approaching a jiva swara from below. */
function approachScore(e, cand, profile) {
  const pc = mod12(cand.p), ep = mod12(e);
  let F = 0;
  if (profile && (profile.landing.includes(pc) || profile.nyasa.includes(pc))) F += 0.4;
  if (cand.approach === 'above' && (ep === 0 || ep === 7)) F += 0.3;
  if (cand.approach === 'below' && profile && profile.jiva.includes(ep)) F += 0.3;
  return F;
}

export { KALPANA_RANGE, eduppuNeighbours, approachScore };
