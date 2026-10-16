import { CPN_MIN, STA_DWELL, NOKKU_SEC, ORIKKAI_SEC, ANDOLITA_SLOW } from './constants.js';

/* Vocal Gym engine · gamaka shape templates (pure geometry, docs/plans/gamaka-audio.md §2)
   A shape describes one swara: { onset, from, body, lo, hi, end, cycles, dwell, depth, exit, exitTo,
   hold }. lo, hi, from and exitTo are semitone offsets from the swara's own pitch n.
   targets() turns a shape into targets [{ p, dur, kind: 'cpn' | 'sta', flex, min, role }]:
   STAs have a fixed dwell; CPNs are flexible and take the spare time, never less than `min`.
   The level argument is the degradation ladder (§3.4):
     0 full shape   1 fewer cycles (the `cycles` argument)   2 onset and a CPN   3 plain */
export const PLAIN = Object.freeze({ onset: 'none', body: 'plain', exit: 'none' });

const sta = (p, dur, role) => ({ p, dur, kind: 'sta', flex: false, min: dur, role });
const cpn = (p, min, role) => ({ p, dur: min, kind: 'cpn', flex: true, min, role });

function onsetTargets(s, n, scale) {
  switch (s.onset) {
    case 'nokku': case 'odukkal': case 'sphurita': case 'pratyahata':
      return [sta(n + scale(s.from != null ? s.from : (s.onset === 'nokku' ? 1 : -1)), NOKKU_SEC, 'onset')];
    default: return [];
  }
}

/* targets for shape s at pitch n, with `depth` scaling every target's distance from n */
export function targets(s, n, depth, level, cycles, landing) {
  const scale = off => depth * (off || 0);
  const out = [];
  if (level >= 3 || !s) return [cpn(n, Math.max(CPN_MIN, landing || 0), 'body')];
  out.push(...onsetTargets(s, n, scale));
  const body = level >= 2 ? 'plain' : s.body;
  if (body === 'plain') out.push(cpn(n, Math.max(CPN_MIN, landing || 0), 'body'));
  else {
    const slow = body === 'andolita' ? ANDOLITA_SLOW : 1;
    const dw = s.dwell === 'hi' ? [1.5, 0.5] : s.dwell === 'lo' ? [0.5, 1.5] : [1, 1];
    const lo = n + scale(s.lo), hi = n + scale(s.hi);
    out.push(cpn(n, 0, 'head'));
    for (let c = 0; c < cycles; c++) {
      out.push(sta(hi, STA_DWELL * dw[0] * slow, 'hi'));
      out.push(sta(lo, STA_DWELL * dw[1] * slow, 'lo'));
    }
    const endP = s.end === 'hi' ? hi : s.end === 'lo' ? lo : n;
    // a held-off oscillation that ends where its last STA already is needs no extra stop
    if (out[out.length - 1].p === endP) out.pop();
    out.push(cpn(endP, CPN_MIN, 'end'));
  }
  if (level < 2 && s.exit === 'orikkai') out.push(sta(n + scale(s.exitTo != null ? s.exitTo : 1), ORIKKAI_SEC, 'exit'));
  // merge neighbouring targets at the same pitch (a flick onto the swara itself, depth 0, …)
  const merged = [];
  for (const x of out) {
    const last = merged[merged.length - 1];
    if (last && Math.abs(last.p - x.p) < 1e-9) { last.dur += x.dur; last.min += x.min; last.flex = last.flex || x.flex; last.kind = last.flex ? 'cpn' : last.kind; }
    else merged.push(Object.assign({}, x));
  }
  return merged;
}

/* the most cycles a body offers, and the fewest the ladder may keep before dropping to level 2 */
export function cycleRange(s) {
  if (!s || s.body === 'plain' || !s.body) return [0, 0];
  const c = s.cycles || [1, 1], max = s.body === 'andolita' ? Math.min(2, c[1]) : c[1];
  return [Math.min(c[0], max), max];
}

/* is a fitted shape anything but a plain note? */
export function isGamaka(ts) { return ts.length > 1 || ts.some(t => t.kind === 'sta'); }
