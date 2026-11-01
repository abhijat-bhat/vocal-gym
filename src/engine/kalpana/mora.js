/* Vocal Gym engine · graded mora (plan 5)
   Three similar statements S1, S2, S3 with two equal karvai gaps q. Each statement is a transform of
   one contour (relative steps in the raga's union scale):
     shift      S1, S2, S3 the same contour, each one scale step nearer the eduppu   lengths u, u, u
     gopuccha   shifted, and one swara dropped from the front each time              u, u - 1, u - 2
     srotovaha  shifted, and one swara added at the front each time                  u, u + 1, u + 2
     identical  the v0.2 mora: one statement three times (only when asked for)       u, u, u
   S3 is realised backward from the landing swara f, so it always ends on lo(e) or hi(e). Templates,
   in order of familiarity: contours of attested phrases and fragments, the ends of ending phrases,
   then generic runs, turns and dattu. */
const STYLES = ['shift', 'gopuccha', 'srotovaha', 'expand', 'contract'];
/* expand and contract (v0.4): the shift mora's statements with the same swaras, redistributed in time so
   they last u, u + 1, u + 2 slots (or u + 2, u + 1, u): a held swara is added inside each statement in
   turn (Field 2018, p. 6–7: "(6)(6)(6) … (5)(6)(7) … then (7)(6)(5)", after Nelson 1991). */
const TIMED = { expand: [0, 1, 2], contract: [2, 1, 0] };
const timedDurs = (u, extra) => { const d = Array(u).fill(1); if (extra >= 1) d[1]++; if (extra >= 2) d[0]++; return d; };

function genericTemplates(L) {
  const n = L - 1, down = Array(n).fill(-1), up = Array(n).fill(1);
  const out = [down, up, [1].concat(Array(n - 1).fill(-1)), [-1].concat(Array(n - 1).fill(1))];
  if (L === 4) out.push([-2, 1, -1], [2, -1, 1]);
  return out.filter(s => s.length === n);
}

/* contour templates of length L (L swaras, L - 1 steps) */
function templates(L, phrases, ix) {
  const out = [], seen = new Set();
  const add = (steps, source, phraseId) => { const k = steps.join(','); if (seen.has(k)) return; seen.add(k); out.push({ steps, source, phraseId }); };
  phrases.forEach(ph => {
    const js = ph.pitches.map(p => ix(p));
    if (js.some(j => j < 0)) return;
    // the ends of ending phrases first, then every window of an attested phrase
    const windows = [];
    if (ph.type === 'ending' && js.length >= L) windows.push(js.length - L);
    for (let s = 0; s + L <= js.length; s++) windows.push(s);
    windows.forEach(s => {
      const w = js.slice(s, s + L), steps = [];
      for (let k = 1; k < L; k++) steps.push(w[k] - w[k - 1]);
      // the template must end with a step into the landing, and move every time
      if (Math.abs(steps[L - 2]) !== 1 || steps.some(d => d === 0 || Math.abs(d) > 3)) return;
      add(steps, ph.type === 'ending' && s === js.length - L ? 'ending' : 'phrase', ph.id);
    });
  });
  genericTemplates(L).forEach(s => add(s, 'generic', null));
  return out;
}

/* The statement shapes that land on swara index tg in one style. They depend only on the raga and
   its profile, so the caller keeps them (ctx.cache) across rounds. */
function moraShapes(ctx, tg, st) {
  const { notes, NN, valid, repair, LX, licence, isLeap, avoidsHard, phrases } = ctx;
  const ix = p => notes.indexOf(p), out = [];
  const legal = js => { for (let k = 1; k < js.length; k++) if (!valid(notes[js[k - 1]], notes[js[k]])) return false; return true; };
  const inRange = js => js.every(j => j >= 0 && j < NN && Number.isInteger(j));
  const cache = ctx.cache.templates || (ctx.cache.templates = new Map());
  {
    const lens = st === 'gopuccha' ? [4, 5] : st === 'srotovaha' ? [5, 6, 7] : [3, 4, 5];   // S3 lengths before trimming
    lens.forEach(L => {
      if (!cache.has(L)) cache.set(L, templates(L, phrases, ix));
      cache.get(L).forEach(tp => {
        // S3 in full, realised backward from the landing
        const full3 = [tg];
        for (let k = tp.steps.length - 1; k >= 0; k--) full3.unshift(full3[0] - tp.steps[k]);
        if (!inRange(full3) || !legal(full3)) return;
        const deltas = st === 'identical' ? [0] : [1, -1];
        deltas.forEach(delta => {
          // statement k (0, 1, 2) is S3 shifted by (2 - k) delta, trimmed for gopuccha and srotovaha
          const trim = k => st === 'gopuccha' ? k : st === 'srotovaha' ? 2 - k : 0;
          let adjusted = false;
          const stmts = [];
          for (let k = 0; k < 3; k++) {
            const base = 2 - k, tries = delta ? [base * delta, base * delta + Math.sign(delta)] : [0];
            let got = null;
            for (const d of base ? tries : [0]) {
              const js = full3.map(j => j + d).slice(trim(k));
              if (inRange(js) && legal(js)) { got = { js, adj: 0 }; break; }
            }
            if (!got && base) {
              // asymmetric ragas: project the shifted statement onto legal swaras, at most one changed
              const naive = full3.map(j => j + base * delta).slice(trim(k));
              if (inRange(naive)) {
                const r = repair(naive.map(j => notes[j]));
                const js = r.pitches.map(ix), n = r.adjusted.filter(Boolean).length;
                if (r.feasible && n <= 1 && inRange(js) && legal(js)) got = { js, adj: n };
              }
            }
            if (!got) return;
            if (got.adj) adjusted = true;
            stmts.push(got.js);
          }
          if (stmts[2][stmts[2].length - 1] !== tg) return;
          const keys = stmts.map(s => s.join(','));
          if (st !== 'identical' && (keys[0] === keys[1] || keys[1] === keys[2] || keys[0] === keys[2])) return;
          // junctions: last of one statement into the first of the next, a legal move and not a repeat; a
          // statement restarts after its gap, so it may leap back up to a fifth, never an octave
          // (Field 2018, Ex. 2.1: (RGM)[P,P,P,,](RGM))
          for (let k = 0; k < 2; k++) {
            const a = stmts[k][stmts[k].length - 1], b = stmts[k + 1][0];
            if (a === b || !valid(notes[a], notes[b]) || Math.abs(notes[b] - notes[a]) > 7) return;
          }
          const flat = stmts[0].concat(stmts[1], stmts[2]);
          if (avoidsHard(flat.map(j => notes[j]))) return;
          let unl = 0;
          for (let k = 1; k < flat.length; k++) if (isLeap(flat[k - 1], flat[k]) && !licence(LX, notes[flat[k - 1]], notes[flat[k]])) unl++;
          // moves the raga's phrases never make, statement junctions included
          let idiomF = 0;
          if (ctx.moveIdiom) for (let k = 1; k < flat.length; k++) idiomF += ctx.moveIdiom(notes[flat[k - 1]], notes[flat[k]]);
          out.push({ style: st, stmts, flat, delta, adjusted, unl, idiomF, template: tp.source, phraseId: tp.phraseId, steps: tp.steps, stepwise: tp.steps.every(d => Math.abs(d) === 1) });
        });
      });
    });
  }
  return out;
}

/* All mora options that land on swara index tg. ctx carries the engine's tables and filters. */
function moraOptions(ctx, tg) {
  const { notes, hard, badLeap, sameDirLeaps, slots, per, D, e, style, feasibleInto } = ctx;
  const styles = style === 'auto' || !style ? STYLES : [style], out = [];
  styles.forEach(st => {
    const timed = TIMED[st], base = timed ? 'shift' : st, key = tg + ':' + base;
    if (!ctx.cache.has(key)) ctx.cache.set(key, moraShapes(ctx, tg, base));
    ctx.cache.get(key).forEach(sh => {
      const { stmts, flat, delta, adjusted, unl } = sh;
      if (timed && stmts[0].length < 3) return;
      const durs = timed ? stmts.map((s, k) => timedDurs(s.length, timed[k])) : null;
      if (hard) for (let k = 1; k < flat.length; k++) if (badLeap(flat[k - 1], flat[k]) || (k >= 2 && sameDirLeaps(flat[k - 2], flat[k - 1], flat[k]))) return;
      // shift direction: statements move toward the eduppu's register
      const ref = e != null ? e : notes[tg];
      // (a mora that starts on the eduppu itself is placed by the mean of its first statement)
      const s1 = stmts[0].map(j => notes[j]), lead = s1[0] !== ref ? s1[0] - ref : s1.reduce((a, b) => a + b, 0) / s1.length - ref;
      const toward = st === 'identical' || lead === 0 || (lead > 0 ? delta > 0 : delta < 0);
      if (!toward && D.T < 1) return;
      const lens3 = durs ? durs.map(d => d.reduce((a, b) => a + b, 0)) : stmts.map(s => s.length), stepwise = sh.stepwise, tp = { source: sh.template };
      // gaps of at most a beat (v0.7.1: two-beat gaps made the round a series of held swaras)
      for (let q = 0; q <= per; q++) {
            const total = lens3[0] + lens3[1] + lens3[2] + 2 * q, B = slots - total;
            if (B < Math.max(2, per) || total > 0.6 * slots) continue;
            if (!feasibleInto(B, stmts[0][0], stmts[0][1])) continue;
            const onBeat = B % per === 0 && (lens3[0] + q) % per === 0 && (lens3[1] + q) % per === 0;
            let unres = 0;
            for (let k = 1; k + 2 < flat.length; k++) {
              const d = flat[k] - flat[k - 1];
              if (Math.abs(d) < 2) continue;
              const held = q > 0 && (k === stmts[0].length - 1 || k === stmts[0].length + stmts[1].length - 1);
              let ok = held;
              for (let m = k + 1; m <= k + 2 && !ok; m++) { const d2 = flat[m] - flat[m - 1]; if ((m === k + 1 && d2 === 0) || (Math.abs(d2) === 1 && Math.sign(d2) === -Math.sign(d))) ok = true; }
              if (!ok) unres++;
            }
            const F = (tp.source !== 'generic' ? 1.0 : 0) + (stepwise ? 0.6 : 0) + (onBeat ? 0.9 : 0) + (st === 'shift' ? 0.3 : 0) + (q <= Math.max(1, per / 2) ? 0.3 : 0) - 0.5 * unl - 0.6 * unres - (adjusted ? 0.4 : 0) + sh.idiomF - (timed ? 0.3 : 0);
            const N = (tp.source === 'generic' ? 0.5 : 0) + (toward ? 0 : 0.5) + (st === 'gopuccha' || st === 'srotovaha' || timed ? 0.6 : 0) + (onBeat ? 0 : 0.7);
        out.push(Object.assign({ style: st, stmts, q, B, F, N, delta, toward, adjusted, template: sh.template, phraseId: sh.phraseId, steps: sh.steps }, durs ? { durs } : {}));
      }
    });
  });
  return out;
}

/* The korvai (v0.4), after Field 2018 Ex. 3 (Shrinivas, Todi) and Nelson's paradigm form: three units,
   each a descending run first with rests that shrink (every swara held ρ + 1 slots, then ρ, …: a
   gopuccha of rests), then a mora of the run, the run a step lower and two steps lower, with one-slot
   gaps. Each unit is the last one moved down one raga step, and the third unit's last run ends on the
   landing swara tg. Options: { style: 'korvai', parts: [{ js, durs }] x 3 units, B, F, N, n, rho, Q }. */
function korvaiOptions(ctx, tg) {
  const { notes, NN, valid, slots, per, feasibleInto, hard, badLeap, sameDirLeaps, avoidsHard } = ctx;
  const out = [];
  const legal = js => {
    for (let k = 1; k < js.length; k++) {
      if (js[k] === js[k - 1]) return false;
      if (!valid(notes[js[k - 1]], notes[js[k]]) || Math.abs(notes[js[k]] - notes[js[k - 1]]) > 7) return false;
      if (hard && (badLeap(js[k - 1], js[k]) || (k >= 2 && sameDirLeaps(js[k - 2], js[k - 1], js[k])))) return false;
    }
    return true;
  };
  for (const n of [3, 4, 5]) for (const rho of [1, 2]) for (const Q of [0, 1, 2]) {
    const run = b => { const r = []; for (let k = n - 1; k >= 0; k--) r.push(b + k); return r; };
    const parts = [];
    let ok = true;
    for (let u = 0; u < 3 && ok; u++) {
      const b = tg + 2 + (2 - u), js = [], durs = [];
      for (let h = rho; h >= 1; h--) run(b).forEach(j => { js.push(j); durs.push(h + 1); });
      [0, 1, 2].forEach(d => run(b - d).forEach((j, k) => { js.push(j); durs.push(k === n - 1 && d < 2 ? 2 : 1); }));
      if (u < 2) durs[durs.length - 1] += Q;
      if (js.some(j => j < 0 || j >= NN)) ok = false;
      parts.push({ js, durs });
    }
    if (!ok) continue;
    const flat = parts[0].js.concat(parts[1].js, parts[2].js);
    if (!legal(flat) || flat[flat.length - 1] !== tg || avoidsHard(flat.map(j => notes[j]))) continue;
    const total = parts.reduce((s, p) => s + p.durs.reduce((a, b) => a + b, 0), 0), B = slots - total;
    if (B < Math.max(2, per) || !feasibleInto(B, flat[0], flat[1], true)) continue;
    const U = parts[0].durs.reduce((a, b) => a + b, 0);
    const F = 1.0 + (B % per === 0 ? 0.5 : 0) + (U % per === 0 ? 0.5 : 0) - 0.1 * Q;
    out.push({ style: 'korvai', parts, B, F, N: 0.4, n, rho, Q, stmts: [parts[0].js, parts[1].js, parts[2].js], q: Q, delta: 1 });
  }
  return out;
}

export { STYLES, moraOptions, moraShapes, templates, genericTemplates, korvaiOptions };
