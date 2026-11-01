import { korvaiFrame, layoutParts, statementOf, phraseOf, nestedPhrases, offsetText, beatsText, where, moraSolutions, korvaiPlan, chakradarPlan, KALAIS } from './index.js';
import { patternsFor } from './patterns.js';

/* Vocal Gym engine · composing korvais and tihais (v0.8.1; docs/research/korvai-tihai.md §9–§11)
   The constructions of the MA375TGR Unit 3 notes (Rhythm, Tala and Combinatorial Structures, RV College
   of Engineering), alongside the purvanga + mora korvais of index.js (the slides' model):
     - the notes' model: one statement P + U played three times, 3(P + U) = kN, with the length condition
       S ≡ 0 (mod N / gcd(N, 3)); unequal statements (21, 21, 22) or an eduppu when 3 does not divide the span
       (§7.3, §7.4, §7.7); Algorithms 1 and 3 (target ratio, backward construction; §9.4)
     - progressive korvais: Sᵢ = P + (i − 1)d + U, each played r times, r(mP + d·m(m − 1)/2 + mU) = kN (§7.5)
     - the Samam algorithm: T(U) = (n − T(P) mod n) + kn (§9.1); the Edapu algorithm: the smallest m with
       3 | mn + k, each third (mn + k)/3 (§9.2)
     - new korvais with the same total: Method A (the uttaranga only) and Method B (both parts) (§7.6)
     - tihais with half-pulse gaps, and the chakkardar 9P₁ + 6G₁ + 2G₂ = T (§8)
     - a repeating phrase against the cycle: lcm, gcd and the offsets it visits (graha-bheda, nadai-bheda; §6.3, §6.4)
   Hard: every layout is checked cell by cell (layoutParts). Soft: the order of the options. */

const sum = xs => xs.reduce((s, x) => s + x, 0);
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const lcm = (a, b) => a / gcd(a, b) * b;
const pct = x => Math.round(100 * x);
const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');

/* ---------- the notes' model: (P U) (P U) (P U) ---------- */
/* the length condition for three identical statements from sam to sam: S ≡ 0 (mod N / gcd(N, 3)) */
export function lengthCondition(C) {
  const g = gcd(C, 3), q = C / g;
  return { g, mod: q, text: g === 3 ? 'C = ' + C + ' divides by 3, so any number of cycles splits into three equal statements of k × ' + q + '.'
    : 'C = ' + C + ' does not divide by 3, so three identical statements from sam to sam need 3, 6, 9 … cycles; for other spans, use unequal statements or an eduppu.' };
}
// the uttaranga of one statement: one phrase, or three (u, u, u + r) when it is long, as the notes split 21 = 7 + 7 + 7
function uttarangaParts(U, group) {
  if (U < 12) return [{ role: 'uttaranga', syl: statementOf(U), part: 0, group, teer: true, label: 'uttaranga ' + U }];
  const u = Math.floor(U / 3), r = U - 3 * u, lens = [u, u + (r > 1 ? 1 : 0), u + (r > 0 ? 1 : 0)];
  return lens.map((l, j) => ({ role: 'uttaranga', syl: statementOf(l), part: j, group, teer: true, label: 'uttaranga ' + l }));
}
/* a korvai of three statements, each a purvanga (phrases of the lengths in `terms`, a nested family)
   and an uttaranga U = S − P. When the span does not divide by 3 the statements are unequal (S, S, S + 1
   or S, S + 1, S + 1, the extra on the uttaranga). */
export function statementKorvai(F, o = {}) {
  if (!F || !F.ok) return { error: (F && F.error) || 'No frame.' };
  const terms = (o.terms || []).map(Number);
  if (!terms.length || terms.some(t => !Number.isInteger(t) || t < 1)) return { error: 'The purvanga needs at least one phrase, each a whole number of pulses from 1.' };
  const T = F.total, S = Math.floor(T / 3), extra = T - 3 * S, P = sum(terms);
  const lens = [S, S + (extra > 1 ? 1 : 0), S + (extra > 0 ? 1 : 0)], Us = lens.map(x => x - P);
  if (Us[0] < 1) return { error: 'The purvanga (' + P + ') leaves no room for an uttaranga in a statement of ' + S + '.' };
  const fam = nestedPhrases(terms), parts = [];
  lens.forEach((len, i) => {
    terms.forEach((t, j) => parts.push({ role: 'purvanga', syl: fam[j].slice(), part: j, group: i, teer: true, label: 'statement ' + (i + 1) + ', phrase ' + (j + 1) }));
    uttarangaParts(Us[i], i).forEach(p => parts.push(p));
  });
  const L = layoutParts(F, parts), ratio = P / S, lc = lengthCondition(F.C);
  const pat = o.pattern || null;
  const steps = F.steps.concat([
    { id: 'statement', title: 'Three statements', math: extra ? T + ' = 3 × ' + S + ' + ' + extra + ' → ' + lens.join(' + ') : '3 × (P + U) = ' + T + ' → P + U = ' + S,
      text: extra ? T + ' does not divide by 3, so the statements are ' + lens.join(', ') + ': the last ' + (extra > 1 ? 'two get' : 'one gets') + ' a pulse more (Unit 3, Ex. 7.9).' : 'Each statement is ' + S + ' pulses; the three together fill the span.' },
    { id: 'length', title: 'The length condition', math: 'S ≡ 0 (mod ' + F.C + ' / gcd(' + F.C + ', 3)) = 0 (mod ' + lc.mod + ')', text: lc.text },
    { id: 'purvanga', title: 'The purvanga' + (pat ? ': ' + pat.name : ''), math: (pat ? pat.formula : terms.join(' + ') + ' = ' + P), text: 'Phrases of ' + terms.join(', ') + ' in every statement: ' + P + ' pulses.' },
    { id: 'uttaranga', title: 'The uttaranga', math: 'U = S − P = ' + lens.map((x, i) => x + ' − ' + P + ' = ' + Us[i]).join('; '), text: 'U/P = ' + (Us[0] / P).toFixed(2) + '; P : (P + U) = ' + pct(ratio) + ' : ' + (100 - pct(ratio)) + (ratio >= 0.3 && ratio <= 0.7 ? ', inside 30 : 70 to 70 : 30 (P/U between 3/7 and 7/3).' : ratio > 0.7 ? ': purvanga-heavy (above 70%).' : ': uttaranga-heavy (below 30%).') },
    { id: 'land', title: 'The landing', math: L.checks[1].text, text: L.ok ? 'It lands exactly.' : 'It does not land.' }
  ]);
  let eduppu = null;
  if (extra) {
    const s2 = F.start + extra;
    if (Math.abs(s2) < F.C) eduppu = { start: s2, text: 'Or start ' + plural(extra, 'pulse') + ' later and play three identical statements of ' + S + ': start + 3S ≡ landing (mod ' + F.C + ') (Unit 3, Ex. 7.15, solution 2).' };
  }
  return { ok: L.ok, kind: 'statements', P, S, lens, Us, terms, ratio, equal: !extra, parts, layout: L, steps, eduppu, type: pat && pat.kind !== 'sama' ? 'yati korvai' : 'simple korvai' };
}
/* purvanga patterns that fit a statement korvai of the frame, balanced first */
export function statementOptions(F, o = {}) {
  if (!F || !F.ok) return [];
  const S = Math.floor(F.total / 3), lo = Math.ceil((o.lo == null ? 0.3 : o.lo) * S), hi = Math.floor((o.hi == null ? 0.7 : o.hi) * S), out = [];
  for (let P = Math.max(3, lo); P <= Math.min(hi, S - 2); P++) patternsFor(P, { kinds: o.kinds, minN: o.minN || 3, maxN: o.maxN || 7, maxTerm: o.maxTerm || 16 }).forEach(p => {
    const r = P / S;
    out.push(Object.assign({}, p, { P, U: S - P, ratio: +r.toFixed(3), score: +(p.score - Math.abs(r - 0.55) * 2).toFixed(2) }));
  });
  return out.sort((a, b) => b.score - a.score || a.P - b.P).slice(0, o.limit || 40);
}
/* Algorithm 1 (target-based construction, Unit 3 §9.4): P = ⌊r·S⌋, U = S − P */
export function targetSplit(total, r) {
  const S = Math.floor(total / 3), P = Math.floor(r * S);
  return { S, P, U: S - P, exact: 3 * S === total, extra: total - 3 * S };
}

/* ---------- progressive korvais ---------- */
/* m statements whose purvanga grows by d (P, P + d, …), each with the same uttaranga U and each played r
   times: r(mP + d·m(m − 1)/2 + mU) = total. Solves for P. */
export function progressiveKorvai(F, o = {}) {
  if (!F || !F.ok) return { error: (F && F.error) || 'No frame.' };
  const m = Number(o.m || 3), d = Number(o.d == null ? 2 : o.d), U = Number(o.U || 5), r = Number(o.r || 1), T = F.total;
  if (![m, d, U, r].every(Number.isInteger) || m < 2 || r < 1 || U < 1) return { error: 'm (from 2), d, U (from 1) and r (from 1) must be whole numbers.' };
  if (T % r) return { error: T + ' does not divide by r = ' + r + ', so the statements cannot each be played ' + r + ' times.' };
  const rest = T / r - d * m * (m - 1) / 2 - m * U;
  if (rest % m) return { error: 'm·P = ' + T / r + ' − ' + d * m * (m - 1) / 2 + ' − ' + m * U + ' = ' + rest + ' is not divisible by m = ' + m + ', so no whole P works.' };
  const P = rest / m, Ps = Array.from({ length: m }, (_, i) => P + i * d);
  if (Ps.some(x => x < 1)) return { error: 'The purvangas would be ' + Ps.join(', ') + ': each must be at least 1.' };
  const fam = nestedPhrases(Ps), parts = [];
  Ps.forEach((p, i) => { for (let k = 0; k < r; k++) { parts.push({ role: 'purvanga', syl: fam[i].slice(), part: i, label: 'statement ' + (i + 1) + (r > 1 ? ' (' + (k + 1) + ' of ' + r + ')' : '') + ', purvanga ' + p }); parts.push({ role: 'uttaranga', syl: statementOf(U), part: i, label: 'uttaranga ' + U }); } });
  const L = layoutParts(F, parts);
  const steps = F.steps.concat([
    { id: 'eq', title: 'A progressive korvai', math: r + '(' + m + 'P + ' + d + '·' + m + '·' + (m - 1) + '/2 + ' + m + '·' + U + ') = ' + T + ' → P = ' + P,
      text: 'Statement i is (P + (i − 1)d) + U, played ' + (r > 1 ? r + ' times' : 'once') + '; only the total must fill the span, not each statement (Unit 3, Def. 7.4).' },
    { id: 'statements', title: 'The statements', math: Ps.map(p => '(' + p + ' + ' + U + ')' + (r > 1 ? ' × ' + r : '')).join(' · '), text: 'Purvangas ' + Ps.join(', ') + (d > 0 ? ': growing' : ': shrinking') + ' by ' + Math.abs(d) + '.' },
    { id: 'land', title: 'The landing', math: L.checks[1].text, text: L.ok ? 'It lands exactly.' : 'It does not land.' }
  ]);
  return { ok: L.ok, kind: 'progressive', P, Ps, m, d, U, r, parts, layout: L, steps };
}
/* progressive korvais that fit the frame, best first */
export function progressiveOptions(F, o = {}) {
  if (!F || !F.ok) return [];
  const out = [], T = F.total;
  for (const r of [1, 3]) for (let m = 2; m <= 5; m++) for (const d of [1, 2, 3, -1, -2, -3]) for (let U = 3; U <= 12; U++) {
    if (T % r) continue;
    const rest = T / r - d * m * (m - 1) / 2 - m * U;
    if (rest % m) continue;
    const P = rest / m, Ps = Array.from({ length: m }, (_, i) => P + i * d);
    if (Math.min(...Ps) < 2 || Math.max(...Ps) > 24) continue;
    const mid = (P + Ps[m - 1]) / 2, ratio = mid / (mid + U);
    const S = 1 - Math.abs(ratio - 0.6) * 2 - Math.abs(m - 3) * 0.15 - (Math.abs(d) > 2 ? 0.2 : 0) + (r === 3 ? 0.1 : 0) + (d > 0 ? 0.1 : 0);
    out.push({ m, d, U, r, P, Ps, ratio: +ratio.toFixed(3), score: +S.toFixed(2), text: Ps.map(p => '(' + p + ' + ' + U + ')' + (r > 1 ? '×' + r : '')).join(' ') });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, o.limit || 24);
}

/* ---------- the Samam and Edapu algorithms ---------- */
/* Samam (Unit 3 §9.1): a purvanga of T(P) in a cycle of n; M = T(P) mod n; T(U) = (n − M) + kn */
export function samamAlgorithm(n, TP, kMax = 2) {
  const M = TP % n, rows = [];
  for (let k = 0; k <= kMax; k++) { const TU = (n - M) + k * n; rows.push({ k, TU, total: TP + TU, cycles: (TP + TU) / n }); }
  return { n, TP, M, rows, steps: [
    { title: 'The remainder', math: 'M(P) = ' + TP + ' mod ' + n + ' = ' + M, text: 'The purvanga passes ' + Math.floor(TP / n) + ' whole cycles and ' + M + ' pulses more.' },
    { title: 'The uttaranga', math: 'T(U) = (' + n + ' − ' + M + ') + ' + n + 'k = ' + (n - M) + ' + ' + n + 'k', text: (n - M) + ' pulses fill the current cycle; each k adds a cycle.' + (M === 0 ? ' The purvanga already ends on sam, so k = 0 adds a whole cycle of uttaranga.' : '') }
  ] };
}
/* a Samam korvai: (phrase f + kaarvai p) × 3, then an uttaranga of T(U) = (n − M) + kn as a mora or a build-up */
export function samamKorvai(o = {}) {
  const f = Number(o.phrase || 8), p = Number(o.kaarvai || 0), k = Number(o.k || 0), form = o.form || 3;
  const F0 = korvaiFrame({ fam: o.fam, L: o.L, tala: o.tala, gati: o.gati, kalai: o.kalai });
  if (F0.error) return { error: F0.error };
  if (![f, p, k].every(Number.isInteger) || f < 1 || p < 0 || k < 0) return { error: 'The phrase (from 1), its kaarvai (from 0) and k (from 0) must be whole numbers.' };
  const n = F0.C, TP = 3 * (f + p), A = samamAlgorithm(n, TP, Math.max(k, 2)), row = A.rows[k];
  if (row.cycles > 8) return { error: 'This korvai would need ' + row.cycles + ' avartanams; the lab draws up to 8.' };
  const F = korvaiFrame({ fam: o.fam, L: o.L, tala: o.tala, gati: o.gati, kalai: o.kalai, cycles: row.cycles });
  const sols = moraSolutions(row.TU, { n: form, gati: F.gati }).filter(x => x.P >= 3 || row.TU < 9);
  if (!sols.length) return { error: 'No ' + (form === 'buildup' ? '6t + 2g' : '3t + 2g') + ' makes T(U) = ' + row.TU + '; try another k.', samam: A };
  const u = sols[Math.min(o.pick || 0, sols.length - 1)];
  const R = korvaiPlan(F, { purvanga: { kind: 'triple', name: 'phrase (kaarvai) × 3', formula: '3 × (' + f + ' + ' + p + ')', lines: [0, 1, 2].map(() => ({ pre: 0, len: f, gap: p })) }, uttaranga: u });
  if (R.error) return R;
  R.samam = A; R.k = k; R.uttarangaOptions = sols.slice(0, 8);
  R.steps = F.steps.slice(0, 1).concat([{ id: 'tp', title: 'The purvanga', math: 'T(P) = 3 × (' + f + ' + ' + p + ') = ' + TP, text: 'A phrase of ' + f + ' and a kaarvai of ' + p + ', three times.' }], A.steps,
    [{ id: 'k', title: 'k = ' + k, math: 'T(U) = ' + row.TU + ', total ' + row.total + ' = ' + row.cycles + ' × ' + n, text: 'The uttaranga as ' + (form === 'buildup' ? 'a build-up, 6t + 2g' : 'a tihai, 3t + 2g') + ': ' + u.eq + '.' }], R.steps.filter(s => s.id === 'land'));
  return R;
}
/* Edapu (Unit 3 §9.2): the korvai starts on sam and ends k pulses after a later sam (k < 0: before it);
   the span mn + k must split into three equal parts. Finds the smallest m ≥ minM. */
export function edapuAlgorithm(n, k, o = {}) {
  const minM = o.minM == null ? 1 : o.minM, table = [];
  for (let m = 0; m <= minM + 5; m++) table.push({ m, value: m * n + k, rem: ((m * n + k) % 3 + 3) % 3 });
  if (n % 3 === 0) {
    const ok = ((k % 3) + 3) % 3 === 0;
    return { ok, n, k, m: ok ? minM : null, span: ok ? minM * n + k : null, third: ok ? (minM * n + k) / 3 : null, table,
      text: n + ' is a multiple of 3, so ' + n + 'm + k ≡ k (mod 3) for every m: adding cycles never helps. ' + (ok ? 'Here k = ' + k + ' is a multiple of 3, so every m works.' : 'k = ' + k + ' is not a multiple of 3, so no m works.') };
  }
  const hit = table.find(r => r.m >= minM && r.rem === 0 && r.value > 0);
  return { ok: !!hit, n, k, m: hit.m, span: hit.value, third: hit.value / 3, table,
    text: n + ' mod 3 = ' + (n % 3) + ', so each cycle shifts the remainder and one of three consecutive m works: m = ' + hit.m + ', span ' + hit.m + ' × ' + n + (k >= 0 ? ' + ' : ' − ') + Math.abs(k) + ' = ' + hit.value + ', each third ' + hit.value / 3 + '.' };
}

/* ---------- the same total, a new korvai (Unit 3 §7.6) ---------- */
/* spec: { phrase f, kaarvai p, form: 3 (tihai uttaranga 3u + 2g) or 'buildup' (6u + 2g), u, g }.
   Method A (uttaranga only): a tihai raises u by 2 and lowers g by 3 (3·2 = 2·3); a build-up raises u by
   1 and lowers g by 3 (6·1 = 2·3). Method B (both parts): the purvanga kaarvai gives x to each uttaranga
   phrase (a tihai: p − x, u + x; a build-up: p − 2x, u + x). The total never changes. */
export function constantTotal(spec, o = {}) {
  const { f, p, u, g } = spec, form = spec.form || 3, c = form === 'buildup' ? 6 : 3;
  const total = 3 * (f + p) + c * u + 2 * g, A = [], B = [];
  const du = form === 'buildup' ? 1 : 2;
  for (let s = 1, uu = u + du, gg = g - 3; gg >= 0; s++, uu += du, gg -= 3) A.push({ step: s, f, p, u: uu, g: gg, TP: 3 * (f + p), TU: c * uu + 2 * gg, total });
  const x = o.x || 2, dp = form === 'buildup' ? 2 * x : x;
  for (let s = 1, pp = p - dp, uu = u + x; pp >= 0; s++, pp -= dp, uu += x) B.push({ step: s, f, p: pp, u: uu, g, TP: 3 * (f + pp), TU: c * uu + 2 * g, total });
  return { total, form, base: { f, p, u, g, TP: 3 * (f + p), TU: c * u + 2 * g },
    A, B, eqA: c + 'u + 2g = ' + (c * u + 2 * g), eqB: form === 'buildup' ? '3p + 6u = ' + (3 * p + 6 * u) : 'p + u = ' + (p + u) };
}
/* lay out one korvai of the constant-total family, in a frame of the right number of cycles */
export function constantTotalPlan(o, v) {
  const F0 = korvaiFrame({ fam: o.fam, L: o.L, tala: o.tala, gati: o.gati, kalai: o.kalai });
  if (F0.error) return { error: F0.error };
  if (v.total % F0.C) return { error: 'The total ' + v.total + ' is not a whole number of cycles of ' + F0.C + '.' };
  const F = korvaiFrame({ fam: o.fam, L: o.L, tala: o.tala, gati: o.gati, kalai: o.kalai, cycles: v.total / F0.C });
  if (F.error) return F;
  const form = o.form || 3, c = form === 'buildup' ? 6 : 3;
  const R = korvaiPlan(F, { purvanga: { kind: 'triple', name: 'phrase (kaarvai) × 3', formula: '3 × (' + v.f + ' + ' + v.p + ')', lines: [0, 1, 2].map(() => ({ pre: 0, len: v.f, gap: v.p })) }, uttaranga: { n: form, P: v.u, G: v.g, eq: c + ' × ' + v.u + ' + 2 × ' + v.g + ' = ' + (c * v.u + 2 * v.g) } });
  if (!R.error) { R.layout = layoutParts(F, R.parts, { sounded: o.sounded }); R.frame = F; }
  return R;
}

/* ---------- tihais with half-pulse gaps, and the chakkardar ---------- */
/* the tihais whose gap is a half pulse: P of the other parity from T, G = (T − 3P)/2 = x.5 (Unit 3 §8.2) */
export function halfTihais(T) {
  const out = [];
  for (let P = 1; 3 * P <= T; P++) if ((T - 3 * P) % 2 === 1) out.push({ P, G: (T - 3 * P) / 2, half: true, eq: '3 × ' + P + ' + 2 × ' + (T - 3 * P) / 2 + ' = ' + T });
  return out;
}
/* the frame at twice the resolution, for drawing half pulses */
export function doubledFrame(F) {
  if (!F || !F.ok) return { error: 'No frame.' };
  if (F.counting !== 'end') return { error: 'Half-pulse gaps are drawn only when counting to the landing.' };
  return korvaiFrame({ tala: F.tala, gati: 2 * F.gati, kalai: F.kalai, cycles: F.cycles, start: 2 * F.start, land: 2 * F.land, counting: 'end' });
}
/* every chakkardar tihai 9P₁ + 6G₁ + 2G₂ = T (a tihai of tihais with no mukhra; Unit 3 §8.1), best first;
   o.halves keeps solutions whose outer gap is a half pulse */
export function chakkardarSolutions(T, o = {}) {
  const out = [];
  if (!Number.isInteger(T) || T < 9) return out;
  for (let P1 = 1; 9 * P1 <= T; P1++) for (let G1 = 0; 9 * P1 + 6 * G1 <= T; G1++) {
    const r = T - 9 * P1 - 6 * G1, half = r % 2 === 1;
    if (half && !o.halves) continue;
    const G2 = r / 2, L1 = 3 * P1 + 2 * G1;
    const F = (P1 >= 3 ? 1 : 0) + (G1 >= 1 ? 0.6 : 0) + (G1 <= P1 ? 0.4 : 0) + (G2 >= G1 ? 0.3 : 0) + (G2 <= L1 ? 0.5 : -0.5) - (half ? 0.6 : 0);
    out.push({ P1, G1, G2, L1, half, T, eq: '9 × ' + P1 + ' + 6 × ' + G1 + ' + 2 × ' + G2 + ' = ' + T, inner: '3 × ' + P1 + ' + 2 × ' + G1 + ' = ' + L1, score: +F.toFixed(2),
      // the same, in chakradarSolutions' shape (no mukhra)
      M: 0, t: P1, g: G1, G: G2, R: L1 });
  }
  return out.sort((a, b) => b.score - a.score || a.G2 - b.G2).slice(0, o.limit || 40);
}
/* lay out a chakkardar (whole gaps in the frame, half gaps in the doubled frame) */
export function chakkardarPlan(F, s) {
  if (!s.half) { const R = chakradarPlan(F, s); if (!R.error) R.steps = R.steps.map(x => x.id === 'eq' ? { id: 'eq', title: 'A tihai of tihais', math: s.eq, text: 'The inner tihai ' + s.inner + ', three times with gaps of ' + s.G2 + ': the phrase of ' + s.P1 + ' is heard 9 times.' } : x); return R; }
  const D = doubledFrame(F);
  if (D.error) return D;
  const R = chakradarPlan(D, { M: 0, t: 2 * s.P1, g: 2 * s.G1, G: 2 * s.G2 });
  if (!R.error) { R.frame = D; R.steps = D.steps.slice(0, 1).concat([{ id: 'eq', title: 'A tihai of tihais with a half-pulse gap', math: s.eq, text: 'The outer gap is ' + s.G2 + ' pulses, so the grid is drawn at twice the resolution: two cells a pulse.' }], R.steps.filter(x => x.id === 'land')); }
  return R;
}

/* ---------- drift: a repeating phrase against the cycle ---------- */
/* L pulses repeated from sam in a cycle of C (gati g): it meets sam after lcm(L, C) pulses, that is
   C/gcd repetitions and L/gcd cycles, and visits only the multiples of gcd(L, C), each once (graha-bheda,
   Unit 3 §6.3); its groups meet a beat every lcm(L, g) pulses (nadai-bheda, §6.4). */
export function drift(L, C, g = 4) {
  if (!Number.isInteger(L) || L < 1 || !Number.isInteger(C) || C < 1) return { error: 'The phrase and the cycle must be whole numbers of pulses.' };
  const d = gcd(L, C), reps = C / d, cycles = L / d, visits = [];
  for (let r = 1; r <= Math.min(reps, 64); r++) { const end = (L * r) % C; visits.push({ r, end, beat: Math.floor(end / g) + 1, pulse: end % g + 1, onBeat: end % g === 0 }); }
  return { L, C, g, gcd: d, lcm: lcm(L, C), reps, cycles, beatMeet: lcm(L, g), visits, visited: Array.from({ length: C / d }, (_, i) => i * d),
    text: 'gcd(' + L + ', ' + C + ') = ' + d + ': the phrase is back on sam after ' + plural(reps, 'repetition') + ' (' + plural(cycles, 'cycle') + ', lcm = ' + lcm(L, C) + ' pulses), and it only ever ends at multiples of ' + d + '.' };
}
export { gcd, lcm };
