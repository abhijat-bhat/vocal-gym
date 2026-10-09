/* Vocal Gym engine · raga direction rules and contour-preserving projection
   valid(a, b): a step up must land on an arohana swara, a step down on an avarohana swara.
   repair(): the closest legal line to a naive mapping, found by dynamic programming. */

const mod12 = p => ((p % 12) + 12) % 12;
function makeProjector(raga) {
  const aro = raga.aro, av = raga.avaro, nA = aro.length - 1, nD = av.length - 1;
  const aroPC = new Set(aro.map(mod12)), avPC = new Set(av.map(mod12));
  const unionPC = Array.from(new Set(aro.concat(av).map(mod12))).sort((a, b) => a - b);
  const aroExt = i => aro[((i % nA) + nA) % nA] + 12 * Math.floor(i / nA);
  const avExt = i => av[((i % nD) + nD) % nD] - 12 * Math.floor(i / nD);
  const valid = (a, b) => b > a ? aroPC.has(mod12(b)) : b < a ? avPC.has(mod12(b)) : true;
  function candidates(lo, hi) {
    const out = [];
    for (let o = Math.floor(lo / 12) - 1; o <= Math.floor(hi / 12) + 1; o++)
      unionPC.forEach(pc => { const p = pc + 12 * o; if (p >= lo - 12 && p <= hi + 12) out.push(p); });
    return out.sort((a, b) => a - b);
  }
  function repair(naive) {
    let ok = true;
    for (let i = 1; i < naive.length; i++) if (!valid(naive[i - 1], naive[i])) { ok = false; break; }
    if (ok) return { pitches: naive.slice(), adjusted: naive.map(() => false), feasible: true };
    const C = candidates(Math.min.apply(null, naive), Math.max.apply(null, naive));
    const rank = p => C.indexOf(p);
    const sgn = x => x > 0 ? 1 : x < 0 ? -1 : 0;
    const n = naive.length, INF = 1e9;
    const cost = Array.from({ length: n }, () => new Array(C.length).fill(INF));
    const back = Array.from({ length: n }, () => new Array(C.length).fill(-1));
    cost[0][rank(naive[0])] = 0;
    const anchor = naive[0], up = naive.some(p => p > anchor), down = naive.some(p => p < anchor);
    for (let i = 1; i < n; i++) {
      const want = sgn(naive[i] - naive[i - 1]);
      for (let j = 0; j < C.length; j++) {
        if ((up && !down && C[j] < anchor) || (down && !up && C[j] > anchor)) continue;
        const local = Math.abs(j - rank(naive[i]));
        for (let k = 0; k < C.length; k++) {
          if (cost[i - 1][k] >= INF) continue;
          if (!valid(C[k], C[j])) continue;
          const v = cost[i - 1][k] + local + (sgn(C[j] - C[k]) !== want ? 1.5 : 0);
          if (v < cost[i][j]) { cost[i][j] = v; back[i][j] = k; }
        }
      }
    }
    let best = -1; cost[n - 1].forEach((v, j) => { if (v < INF && (best < 0 || v < cost[n - 1][best])) best = j; });
    if (best < 0) return { pitches: naive.slice(), adjusted: naive.map(() => false), feasible: false };
    const out = new Array(n); let j = best;
    for (let i = n - 1; i >= 0; i--) { out[i] = C[j]; j = back[i][j]; }
    return { pitches: out, adjusted: out.map((p, i) => p !== naive[i]), feasible: true };
  }
  return { aroExt, avExt, nA, nD, repair, valid };
}

export { mod12, makeProjector };
