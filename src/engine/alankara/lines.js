import { makeProjector } from '../projection.js';
import { motifSpan } from './motif.js';

/* Vocal Gym engine · full alankara from a motif
   Ascending lines are anchored on successive arohana swaras up to tara Sa, then descending
   lines (the mirror) on successive avarohana swaras down to Sa. In janya ragas each line is
   passed through the contour-preserving projection so every step obeys the direction rules. */
function alankara(raga, tl, motif) {
  const P = makeProjector(raga);
  const span = motifSpan(motif);
  const lines = [];
  const kA = Math.max(0, P.nA - span + 1), kD = Math.max(0, P.nD - span + 1);
  for (let k = 0; k <= kA; k++) lines.push({ dir: 'asc', k, naive: motif.map(m => P.aroExt(k + m.d)) });
  for (let k = 0; k <= kD; k++) lines.push({ dir: 'desc', k, naive: motif.map(m => P.avExt(k + m.d)) });
  let adjustedCount = 0, infeasible = 0;
  lines.forEach(l => {
    const r = P.repair(l.naive);
    l.notes = motif.map((m, i) => ({ p: r.pitches[i], dur: m.dur, adjusted: r.adjusted[i] }));
    adjustedCount += r.adjusted.filter(Boolean).length; if (!r.feasible) infeasible++;
  });
  return { lines, span, adjustedCount, infeasible, slotsPerLine: motif.reduce((s, m) => s + m.dur, 0) };
}

export { alankara };
