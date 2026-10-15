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
const STYLES = ['shift', 'gopuccha', 'srotovaha'];

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
          // junctions: last of one statement into the first of the next, a legal move and not a repeat
          for (let k = 0; k < 2; k++) {
            const a = stmts[k][stmts[k].length - 1], b = stmts[k + 1][0];
            if (a === b || !valid(notes[a], notes[b])) return;
          }
          const flat = stmts[0].concat(stmts[1], stmts[2]);
          if (avoidsHard(flat.map(j => notes[j]))) return;
          let unl = 0;
          for (let k = 1; k < flat.length; k++) if (isLeap(flat[k - 1], flat[k]) && !licence(LX, notes[flat[k - 1]], notes[flat[k]])) unl++;
          out.push({ style: st, stmts, flat, delta, adjusted, unl, template: tp.source, phraseId: tp.phraseId, steps: tp.steps, stepwise: tp.steps.every(d => Math.abs(d) === 1) });
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
    const key = tg + ':' + st;
    if (!ctx.cache.has(key)) ctx.cache.set(key, moraShapes(ctx, tg, st));
    ctx.cache.get(key).forEach(sh => {
      const { stmts, flat, delta, adjusted, unl } = sh;
      if (hard) for (let k = 1; k < flat.length; k++) if (badLeap(flat[k - 1], flat[k]) || (k >= 2 && sameDirLeaps(flat[k - 2], flat[k - 1], flat[k]))) return;
      // shift direction: statements move toward the eduppu's register
      const ref = e != null ? e : notes[tg];
      // (a mora that starts on the eduppu itself is placed by the mean of its first statement)
      const s1 = stmts[0].map(j => notes[j]), lead = s1[0] !== ref ? s1[0] - ref : s1.reduce((a, b) => a + b, 0) / s1.length - ref;
      const toward = st === 'identical' || lead === 0 || (lead > 0 ? delta > 0 : delta < 0);
      if (!toward && D.T < 1) return;
      const lens3 = stmts.map(s => s.length), stepwise = sh.stepwise, tp = { source: sh.template };
      for (let q = 0; q <= 2 * per; q++) {
            const total = lens3[0] + lens3[1] + lens3[2] + 2 * q, B = slots - total;
            if (B < Math.max(2, per) || total > 0.6 * slots) continue;
            if (!feasibleInto(B, stmts[0][0], stmts[0][1])) continue;
            const onBeat = B % per === 0 && (lens3[0] + q) % per === 0 && (lens3[1] + q) % per === 0;
            let unres = 0;
            for (let k = 1; k + 2 < flat.length; k++) {
              const d = flat[k] - flat[k - 1];
              if (Math.abs(d) < 2) continue;
              const held = q > 0 && (k === lens3[0] - 1 || k === lens3[0] + lens3[1] - 1);
              let ok = held;
              for (let m = k + 1; m <= k + 2 && !ok; m++) { const d2 = flat[m] - flat[m - 1]; if ((m === k + 1 && d2 === 0) || (Math.abs(d2) === 1 && Math.sign(d2) === -Math.sign(d))) ok = true; }
              if (!ok) unres++;
            }
            const F = (tp.source !== 'generic' ? 1.0 : 0) + (stepwise ? 0.6 : 0) + (onBeat ? 0.9 : 0) + (st === 'shift' ? 0.3 : 0) + (q <= per ? 0.3 : 0) - 0.5 * unl - 0.6 * unres - (adjusted ? 0.4 : 0);
            const N = (tp.source === 'generic' ? 0.5 : 0) + (toward ? 0 : 0.5) + (st === 'gopuccha' || st === 'srotovaha' ? 0.6 : 0) + (onBeat ? 0 : 0.7);
        out.push({ style: st, stmts, q, B, F, N, delta, toward, adjusted, template: sh.template, phraseId: sh.phraseId, steps: sh.steps });
      }
    });
  });
  return out;
}

export { STYLES, moraOptions, moraShapes, templates, genericTemplates };
