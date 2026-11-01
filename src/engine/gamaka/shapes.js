import { CPN_MIN, STA_DWELL, NOKKU_SEC, ORIKKAI_SEC, ANDOLITA_SLOW } from './constants.js';

/* Vocal Gym engine · gamaka shape templates (pure geometry, docs/plans/gamaka-audio.md §2)
   A shape describes one swara: { onset, from, body, lo, hi, end, cycles, dwell, depth, exit, exitTo,
   hold }. lo, hi, from and exitTo are semitone offsets from the swara's own pitch n.
   s.reach (optional) scales each component's swing: { onset, body, exit }, 1 when absent (the
   intensity dial, gamaka/intensity.js).
   targets() turns a shape into targets [{ p, dur, kind: 'cpn' | 'sta', flex, min, role }]:
   STAs have a fixed dwell; CPNs are flexible and take the spare time, never less than `min`.
   The level argument is the degradation ladder (§3.4):
     0 full shape   1 fewer cycles (the `cycles` argument)   2 onset and a CPN   3 plain
   cycles = 0.5 is a truncated inflexion: one turn to hi and back (S201 Fig. 9), the natural contour's
   last oscillating rung before 2.
   The natural contour (geo.natural) also reads two phrase fields the resolver sets
   (docs/research/gamaka-papers.md §4):
     flowIn 'lo' | 'hi'  the oscillation starts on that extreme, with no head at the swara: the gamaka
                         begins where the voice arrives from the previous swara (coarticulation, S206, S208)
     antic  'lo' | 'hi'  before the oscillation comes to rest, it touches that extreme once more: in an
                         ascent the next svara is touched before the gamaka ends (S209)
   and marks the STAs on the dwell side as anchors: the voice stays there and moves to the other extreme
   in spurts, so a longer note slows its anchor before its holds lengthen (S205). */
export const PLAIN = Object.freeze({ onset: 'none', body: 'plain', exit: 'none' });

const sta = (p, dur, role) => ({ p, dur, kind: 'sta', flex: false, min: dur, role });
const cpn = (p, min, role) => ({ p, dur: min, kind: 'cpn', flex: true, min, role });

function onsetTargets(s, n, scale, flick) {
  switch (s.onset) {
    case 'nokku': case 'odukkal': case 'sphurita': case 'pratyahata':
      return [sta(n + scale(s.from != null ? s.from : (s.onset === 'nokku' ? 1 : -1), 'onset'), flick, 'onset')];
    default: return [];
  }
}

/* targets for shape s at pitch n, with `depth` scaling every target's distance from n.
   geo (optional) sets the stationary-point dwells: { sta, flick, orikkai }; the v0.4 values by default */
export function targets(s, n, depth, level, cycles, landing, geo) {
  const rc = comp => s && s.reach && s.reach[comp] != null ? s.reach[comp] : 1;
  const scale = (off, comp) => depth * rc(comp) * (off || 0);
  const g = geo || {}, staSec = g.sta != null ? g.sta : STA_DWELL, flick = g.flick != null ? g.flick : NOKKU_SEC, flickUp = g.orikkai != null ? g.orikkai : ORIKKAI_SEC;
  const out = [];
  if (level >= 3 || !s) return [cpn(n, Math.max(CPN_MIN, landing || 0), 'body')];
  out.push(...onsetTargets(s, n, scale, flick));
  const body = level >= 2 ? 'plain' : s.body;
  if (body === 'plain') out.push(cpn(n, Math.max(CPN_MIN, landing || 0), 'body'));
  else {
    const slow = body === 'andolita' ? ANDOLITA_SLOW : 1;
    const dw = s.dwell === 'hi' ? [1.5, 0.5] : s.dwell === 'lo' ? [0.5, 1.5] : [1, 1];
    const lo = n + scale(s.lo, 'body'), hi = n + scale(s.hi, 'body');
    const nat = !!g.natural, at = { hi, lo }, dwOf = { hi: dw[0], lo: dw[1] };
    // natural: the dwell side anchors the oscillation (both sides share it when the dwell is even)
    const turn = role => {
      const t = sta(at[role], staSec * dwOf[role] * slow, role);
      if (nat && (!s.dwell || s.dwell === 'even' || s.dwell === role)) t.anchor = !s.dwell || s.dwell === 'even' ? 0.5 : 1;
      return t;
    };
    const first = nat && s.flowIn === 'lo' ? 'lo' : 'hi', second = first === 'hi' ? 'lo' : 'hi';
    const flow = nat && !!s.flowIn;
    if (!flow) out.push(cpn(n, 0, 'head'));
    // whole cycles, then half of one (cycles 0.5 is a single turn). An oscillation that flows in has no
    // head at the swara, so it always makes a whole cycle: it must reach its other turn
    const whole = flow ? Math.max(1, Math.ceil(cycles - 1e-9)) : Math.floor(cycles + 1e-9);
    for (let c = 0; c < whole; c++) { out.push(turn(first)); out.push(turn(second)); }
    if (!flow && cycles % 1) out.push(turn(first));
    if (nat && s.antic && cycles >= 1 && at[s.antic] !== out[out.length - 1].p) out.push(turn(s.antic));
    const endP = s.end === 'hi' ? hi : s.end === 'lo' ? lo : n;
    // a held-off oscillation that ends where its last STA already is needs no extra stop
    if (out[out.length - 1].p === endP) out.pop();
    out.push(cpn(endP, CPN_MIN, 'end'));
  }
  if (level < 2 && s.exit === 'orikkai') out.push(sta(n + scale(s.exitTo != null ? s.exitTo : 1, 'exit'), flickUp, 'exit'));
  // merge neighbouring targets at the same pitch (a flick onto the swara itself, depth 0, …)
  const merged = [];
  for (const x of out) {
    const last = merged[merged.length - 1];
    if (last && Math.abs(last.p - x.p) < 1e-9) { last.dur += x.dur; last.min += x.min; last.flex = last.flex || x.flex; last.kind = last.flex ? 'cpn' : last.kind; if (last.flex) delete last.anchor; }
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
