import { rng, soft, dial } from '../random.js';
import { tala, angaStarts } from '../talas.js';
import { PDF_ALANKARA, pdfMotif } from './sheet.js';

/* Vocal Gym engine · alankara motifs: familiarity model, exact sampling, new patterns

   Familiarity model learned from the 35 sheet motifs.
   Each move is described by three features: the step (or a restart to Sa at an anga line),
   where a karvai falls, and whether the contour turns. Smoothed log-frequencies over the
   sheet give F; surprisal under the same model gives N. */
function moveKeys(atAnga, delta, nd, dur, t, bounds, prevDelta) {
  const dk = atAnga && nd === 0 && delta < 0 ? 'R' : String(Math.max(-3, Math.min(3, delta)));
  const keys = ['m' + (atAnga ? 'A' : 'I') + dk, dur === 2 ? (bounds.has(t + 2) ? 'kb' : 'km') : 'k1'];
  if (prevDelta !== null) keys.push('c' + Math.sign(prevDelta) + Math.sign(delta));
  return keys;
}
function motifKeys(motif, tl) {
  const starts = angaStarts(tl), out = [];
  out.push([motif[0].dur === 2 ? (starts.has(2) ? 'kb' : 'km') : 'k1']);
  let t = motif[0].dur, prev = null;
  for (let i = 1; i < motif.length; i++) {
    const delta = motif[i].d - motif[i - 1].d;
    out.push(moveKeys(starts.has(t) && t > 0, delta, motif[i].d, motif[i].dur, t, starts, prev));
    prev = delta; t += motif[i].dur;
  }
  return out;
}
const FAMILIAR = (function () {
  const cnt = {}, tot = {}, V = { mA: 8, mI: 8, k: 3, c: 9 };
  const grp = k => k[0] === 'm' ? k.slice(0, 2) : k[0];
  Object.keys(PDF_ALANKARA).forEach(f => Object.keys(PDF_ALANKARA[f]).forEach(L => {
    motifKeys(pdfMotif(f, +L), tala(f, +L)).forEach(ks => ks.forEach(k => { cnt[k] = (cnt[k] || 0) + 1; tot[grp(k)] = (tot[grp(k)] || 0) + 1; }));
  }));
  const lp = k => Math.log(((cnt[k] || 0) + 0.5) / ((tot[grp(k)] || 0) + 0.5 * V[grp(k)]));
  return { cnt, tot, lp };
})();
function motifFamiliarity(motif, tl) {
  const ks = motifKeys(motif, tl);
  return ks.reduce((s, k) => s + k.reduce((a, x) => a + FAMILIAR.lp(x), 0), 0) / ks.length;
}
let PDF_FAM_SCORES = null;
function pdfFamScores() {
  if (!PDF_FAM_SCORES) {
    PDF_FAM_SCORES = [];
    Object.keys(PDF_ALANKARA).forEach(f => Object.keys(PDF_ALANKARA[f]).forEach(L => PDF_FAM_SCORES.push(motifFamiliarity(pdfMotif(f, +L), tala(f, +L)))));
  }
  return PDF_FAM_SCORES;
}
/* devices used by a motif, in words a teacher would use, and how conventional it is relative to the sheet */
function motifReport(motif, tl) {
  const starts = angaStarts(tl), dev = { restarts: 0, runs: 0, turns: 0, leaps: 0, karvais: 0, repeats: 0 };
  let t = motif[0].dur, prev = null, run = 1;
  if (motif[0].dur > 1) dev.karvais++;
  for (let i = 1; i < motif.length; i++) {
    const d = motif[i].d - motif[i - 1].d, atA = starts.has(t) && t > 0;
    if (atA && motif[i].d === 0 && d < 0) dev.restarts++;
    else if (Math.abs(d) >= 2) dev.leaps++;
    if (d === 0) dev.repeats++;
    if (prev !== null && d !== 0 && prev !== 0 && Math.sign(d) !== Math.sign(prev) && !(atA && motif[i].d === 0)) dev.turns++;
    if (Math.abs(d) === 1 && d === prev) run++; else { if (run >= 3) dev.runs++; run = Math.abs(d) === 1 ? 2 : 1; }
    if (motif[i].dur > 1) dev.karvais++;
    prev = d; t += motif[i].dur;
  }
  if (run >= 3) dev.runs++;
  const f = motifFamiliarity(motif, tl), ref = pdfFamScores();
  return { familiarity: f, conventionality: ref.filter(x => x <= f).length / ref.length, devices: dev };
}

/* Sampled motif: exact length, start on degree 0, end on the top degree, karvais (holds of 2)
   never across an anga line, steps of at most 3 degrees except a restart to Sa at an anga line.
   Sampling is exact (forward filtering, backward sampling): a backward pass sums exp(score / tau)
   over every legal completion, so the whole pattern, not just the next note, follows
   p(x) ∝ exp(Σ score / tau) restricted to legal patterns. */
/* F: how familiar the move is on the sheet (smoothed log-frequency, floored at -4).
   N: explicit unconventional devices: leaps, turns, crossing an anga line without
   restarting on Sa, syncopated karvais, falling steps. Repeated swaras are neither. */
function moveNovelty(atA, delta, nd, dur, t, starts, prev) {
  let N = 0;
  const restart = atA && nd === 0 && delta < 0;
  if (!restart) { if (Math.abs(delta) === 2) N += 1.0; else if (Math.abs(delta) === 3) N += 1.4; else if (delta === -1) N += 0.4; }
  if (prev !== null && prev !== 0 && delta !== 0 && Math.sign(delta) !== Math.sign(prev) && !restart) N += 0.8;
  if (atA && !restart) N += 0.8;
  if (dur === 2 && !starts.has(t + 2)) N += 0.6;
  if (delta === 0) N -= 1.0;
  return N;
}
function moveScore(c, atA, delta, nd, dur, t, starts, prev) {
  const ks = moveKeys(atA, delta, nd, dur, t, starts, prev);
  const F = 0.6 * ks.reduce((a, k) => a + Math.max(-4, FAMILIAR.lp(k)), 0);
  const N = moveNovelty(atA, delta, nd, dur, t, starts, prev);
  let sc = (1 - c) * F + c * N;
  if (delta === 0 && prev === 0) sc -= 3;
  return sc;
}
function sampleMotif(tl, span, c, tau, seed) {
  const rand = rng(seed), total = tl.total, top = span - 1;
  if (span < 2 || total < 2) return null;
  const starts = angaStarts(tl);
  const crosses = (t, dur) => dur === 2 && starts.has(t + 1) && t + 1 < total;
  const moves = (t, d) => {
    const out = [];
    for (let nd = 0; nd <= top; nd++) {
      const delta = nd - d, restart = starts.has(t) && t > 0 && nd === 0;
      if (Math.abs(delta) > 3 && !restart) continue;
      for (const dur of [1, 2]) { if (t + dur > total || crosses(t, dur)) continue; out.push({ nd, dur, delta }); }
    }
    return out;
  };
  const NEG = -Infinity, pi = p => p === null ? 0 : p + 2; // prev-step sign: none, -1, 0, +1
  const V = Array.from({ length: total + 1 }, () => Array.from({ length: span }, () => new Float64Array(4).fill(NEG)));
  for (let k = 0; k < 4; k++) V[total][top][k] = 0;
  const lse = arr => { let m = NEG; for (const x of arr) if (x > m) m = x; if (m === NEG) return NEG; let s = 0; for (const x of arr) s += Math.exp(x - m); return m + Math.log(s); };
  const opts = (t, d, prev) => moves(t, d).map(m => ({ m, w: moveScore(c, starts.has(t) && t > 0, m.delta, m.nd, m.dur, t, starts, prev) / tau + V[t + m.dur][m.nd][pi(Math.sign(m.delta))] })).filter(o => o.w > NEG);
  for (let t = total - 1; t >= 1; t--) for (let d = 0; d <= top; d++) for (let k = 0; k < 4; k++) {
    const prev = k === 0 ? null : k - 2;
    V[t][d][k] = lse(opts(t, d, prev).map(o => o.w));
  }
  const firsts = [1, 2].filter(dur => dur <= total && !crosses(0, dur)).map(dur => {
    const F = FAMILIAR.lp(dur === 2 ? (starts.has(2) ? 'kb' : 'km') : 'k1');
    return { dur, w: ((1 - c) * 0.6 * Math.max(-4, F) + c * (dur === 2 ? 0.3 : 0)) / tau + V[dur][0][0] };
  }).filter(o => o.w > NEG);
  if (!firsts.length) return null;
  const draw = list => { const m = Math.max.apply(null, list.map(o => o.w)); return list[soft(list.map(o => o.w - m), 1, rand)]; };
  const first = draw(firsts).dur;
  const notes = [{ d: 0, dur: first }];
  let t = first, d = 0, prev = null;
  while (t < total) {
    const m = draw(opts(t, d, prev)).m;
    notes.push({ d: m.nd, dur: m.dur }); prev = Math.sign(m.delta); t += m.dur; d = m.nd;
  }
  return notes;
}
function generateMotif(tl, span, T, seed) { const D = dial(T); return sampleMotif(tl, span, D.c, D.tau, seed); }
const motifSlots = m => { const s = []; m.forEach(n => { s.push(n.d); for (let i = 1; i < n.dur; i++) s.push('k'); }); return s; };
const hamming = (a, b) => { const n = Math.max(a.length, b.length); let d = 0; for (let i = 0; i < n; i++) if (a[i] !== b[i]) d++; return d; };
const motifKey = m => m.map(n => n.d + (n.dur > 1 ? ':' + n.dur : '')).join(' ');
function motifSpan(m) { return Math.max.apply(null, m.map(n => n.d)) + 1; }

/* Every legal motif of a span for a tala, by depth-first search with the same rules as the
   sampler (capped at `limit`). Used when sampling cannot find an unseen pattern, which happens
   only in tiny talas such as Tisra Eka. */
function enumerateMotifs(tl, span, limit) {
  const total = tl.total, top = span - 1, starts = angaStarts(tl), out = [];
  if (span < 2 || total < 2) return { motifs: out, complete: true };
  const crosses = (t, dur) => dur === 2 && starts.has(t + 1) && t + 1 < total;
  const moves = (t, d) => {
    const res = [];
    for (let nd = 0; nd <= top; nd++) {
      const delta = nd - d, restart = starts.has(t) && t > 0 && nd === 0;
      if (Math.abs(delta) > 3 && !restart) continue;
      for (const dur of [1, 2]) { if (t + dur > total || crosses(t, dur)) continue; res.push({ nd, dur }); }
    }
    return res;
  };
  const reach = Array.from({ length: total + 1 }, () => new Uint8Array(span));
  reach[total][top] = 1;
  for (let t = total - 1; t >= 1; t--) for (let d = 0; d <= top; d++) reach[t][d] = moves(t, d).some(m => reach[t + m.dur][m.nd]) ? 1 : 0;
  let complete = true;
  const cur = [];
  (function dfs(t, d) {
    if (out.length >= limit) { complete = false; return; }
    if (t === total) { out.push(cur.map(n => Object.assign({}, n))); return; }
    for (const m of moves(t, d)) if ((t > 0 || m.nd === 0) && reach[t + m.dur][m.nd]) { cur.push({ d: m.nd, dur: m.dur }); dfs(t + m.dur, m.nd); cur.pop(); if (!complete) return; }
  })(0, 0); // the first note is always degree 0
  return { motifs: out, complete };
}
/* total score of a motif, as the sampler sees it */
function motifScore(motif, tl, c) {
  const starts = angaStarts(tl);
  const F0 = FAMILIAR.lp(motif[0].dur === 2 ? (starts.has(2) ? 'kb' : 'km') : 'k1');
  let sc = (1 - c) * 0.6 * Math.max(-4, F0) + c * (motif[0].dur === 2 ? 0.3 : 0), t = motif[0].dur, prev = null;
  for (let i = 1; i < motif.length; i++) {
    const delta = motif[i].d - motif[i - 1].d;
    sc += moveScore(c, starts.has(t) && t > 0, delta, motif[i].d, motif[i].dur, t, starts, prev);
    prev = Math.sign(delta); t += motif[i].dur;
  }
  return sc;
}

/* A new pattern for a tala: differs from every pattern in `avoid` (the sheet line and earlier
   variations) in at least minDiff slots: a quarter of the tala, at least 2, or 1 in talas of five
   aksharas or fewer. The span defaults to the sheet's span for the tala. Sampling widens after 40
   attempts; if 160 samples find nothing unseen, every legal pattern is enumerated (up to 20,000)
   and one is drawn from the unseen ones. Returns null only when no unseen pattern exists. */
function newMotif(tl, opts) {
  const o = opts || {}, D = dial(o.T), total = tl.total;
  const sheet = PDF_ALANKARA[tl.fam] && PDF_ALANKARA[tl.fam][tl.L] ? pdfMotif(tl.fam, tl.L) : null;
  const span = o.span || (sheet ? motifSpan(sheet) : 4);
  const avoid = (o.avoid || []).map(motifSlots);
  const minDiff = o.minDiff || (total <= 5 ? 1 : Math.max(2, Math.round(total * 0.25)));
  const distance = m => avoid.length ? Math.min.apply(null, avoid.map(v => hamming(motifSlots(m), v))) : total;
  let best = null;
  for (let a = 0; a < 160; a++) {
    const widen = a < 40 ? 1 : 1 + (a - 39) * 0.05;
    const m = sampleMotif(tl, span, D.c, D.tau * widen, ((o.seed || 1) * 7919 + a * 104729) >>> 0);
    if (!m) return null;
    const diff = distance(m);
    if (diff >= minDiff) return { motif: m, diff, minDiff, span, attempts: a + 1, widened: a >= 40, relaxed: false };
    if (diff > 0 && (!best || diff > best.diff)) best = { motif: m, diff, minDiff, span, attempts: a + 1, widened: true, relaxed: true };
  }
  const all = enumerateMotifs(tl, span, 20000).motifs.map(m => ({ m, diff: distance(m) })).filter(x => x.diff > 0);
  const strict = all.filter(x => x.diff >= minDiff), pool = strict.length ? strict : all;
  if (!pool.length) return best;
  const rand = rng(((o.seed || 1) * 31337) >>> 0);
  const ch = pool[soft(pool.map(x => motifScore(x.m, tl, D.c)), D.tau * 3, rand)];
  if (!strict.length && best && best.diff >= ch.diff) return best;
  return { motif: ch.m, diff: ch.diff, minDiff, span, attempts: 160, widened: true, relaxed: !strict.length, enumerated: true };
}
/* PDF line followed by `count` new patterns, each distinct from all before it (used by tests and demos) */
function alankaraSeries(fam, L, count, opts) {
  const o = opts || {}, tl = tala(fam, L), out = [{ motif: pdfMotif(fam, L), source: 'pdf' }];
  for (let k = 1; k <= count; k++) {
    const r = newMotif(tl, { T: o.T, seed: (o.seed || 1) + k * 31, span: o.span || motifSpan(out[0].motif), avoid: out.map(x => x.motif) });
    if (!r) break;
    out.push(Object.assign({ source: 'generated' }, r));
  }
  return out;
}

export { FAMILIAR, moveKeys, motifKeys, motifFamiliarity, pdfFamScores, motifReport, moveNovelty, moveScore, sampleMotif, generateMotif, enumerateMotifs, motifScore, motifSlots, hamming, motifKey, motifSpan, newMotif, alankaraSeries };
