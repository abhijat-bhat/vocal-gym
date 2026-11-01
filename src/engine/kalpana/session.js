import { mod12 } from '../projection.js';
import { getProfile } from '../profiles.js';
import { kalpanaRound, KALPANA_RANGE } from './index.js';
import { focalCandidates } from './phrases.js';

/* Vocal Gym engine · a whole svara kalpana (v0.4, docs/research/kalpana-structure.md §3.1)
   kalpanaSession(raga, opts) builds the order a performer follows:
     first speed    rounds of ½, 1 and 2 avartanas, two swaras a beat; slow rounds favour the raga's own
                    phrases (pidi) (Sambamoorthy 1941 Book IV p. 24: "half, one, two, four and eight avarta
                    duration"; Vidya Subramanian 2008 §4)
     second speed   rounds of 1 and 2 avartanas at four swaras a beat (Field 2018 p. 3)
     koraippu       rounds that shrink, 1, 1, ½, ½, ¼, ¼ avartana, traded between soloist and accompanist,
                    each ending on the koraippu's focal note (Field 2018 p. 3, 15; Vidya Subramanian §9)
     korvai         a last round of two avartanas closing with a korvai (opts.korvai: false leaves it out)
   Across the first- and second-speed rounds the focus climbs through the raga's resting swaras, as a
   musician "slowly climbing up the raga" does (Field 2024 ¶35); each round still lands next to the
   eduppu. opts: { eduppuPitch, startPitch = 0, angas = [4, 2, 2], perAkshara = 2, T = 1, seed = 1, korvai,
   moraStyle }. Returns { rounds: [{ part, index, avartanas, aksharas, per, focus, round }], failed }. */
const PARTS = [
  { part: 'first speed', speed: 1, avartanas: [0.5, 1, 2], pidi: 1 },
  { part: 'second speed', speed: 2, avartanas: [1, 2], pidi: 0.3 },
  { part: 'koraippu', speed: 2, avartanas: [1, 1, 0.5, 0.5, 0.25, 0.25], pidi: 0 }
];

export function kalpanaSession(raga, opts) {
  const o = opts || {}, angas = o.angas && o.angas.length ? o.angas : [4, 2, 2];
  const cycle = angas.reduce((a, b) => a + b, 0), per1 = o.perAkshara || 2, T = o.T == null ? 1 : o.T, seed = o.seed || 1;
  const startPitch = o.startPitch == null ? 0 : o.startPitch, e = o.eduppuPitch;
  const pcs = Array.from(new Set(raga.aro.concat(raga.avaro).map(mod12))).sort((a, b) => a - b);
  const notes = [];
  for (let oct = -1; oct <= 1; oct++) pcs.forEach(pc => { const p = pc + 12 * oct; if (p >= KALPANA_RANGE[0] && p <= KALPANA_RANGE[1]) notes.push(p); });
  notes.sort((a, b) => a - b);
  const cands = focalCandidates(notes, getProfile(raga), pcs).filter(p => p >= startPitch && p <= 14);
  const parts = PARTS.slice();
  if (o.korvai !== false) parts.push({ part: 'korvai', speed: 2, avartanas: [2], pidi: 0, ending: 'korvai' });
  const climb = parts.filter(p => p.part === 'first speed' || p.part === 'second speed').reduce((n, p) => n + p.avartanas.length, 0);
  const rounds = [], failed = [];
  let index = 0, climbed = 0;
  const korFocus = cands.length ? cands.reduce((b, q) => Math.abs(q - ((e == null ? 7 : e) + 5)) < Math.abs(b - ((e == null ? 7 : e) + 5)) ? q : b, cands[0]) : null;
  parts.forEach(pt => pt.avartanas.forEach(av => {
    const aksharas = Math.max(1, Math.round(av * cycle)), per = per1 * pt.speed;
    let focus = null;
    if (pt.part === 'first speed' || pt.part === 'second speed') {
      focus = cands.length ? cands[Math.min(cands.length - 1, Math.round(climbed * (cands.length - 1) / Math.max(1, climb - 1)))] : null;
      climbed++;
    } else focus = korFocus;
    // a round starts where the singer left off: on its focus when it can, otherwise on the opening swara
    const starts = [focus, startPitch].filter((p, k, a) => p != null && a.indexOf(p) === k);
    let res = null;
    for (const sp of starts) {
      res = kalpanaRound(raga, { aksharas, perAkshara: per, startPitch: sp, eduppuPitch: e, T, seed: seed + 101 * index, angas, focus, pidi: pt.pidi,
        ending: pt.ending || (av < 1 ? 'free' : 'auto'), moraStyle: o.moraStyle });
      if (!res.error) break;
    }
    if (res.error) failed.push({ part: pt.part, index, avartanas: av, error: res.error });
    else rounds.push({ part: pt.part, index, avartanas: av, aksharas, per, focus, round: res });
    index++;
  }));
  return { rounds, failed, cycle };
}
