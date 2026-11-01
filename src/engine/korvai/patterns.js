/* Vocal Gym engine · purvanga patterns and yatis (v0.8.1; docs/research/korvai-tihai.md §9)
   The mathematical patterns a purvanga's phrase lengths may follow, and the six yatis, after the
   MA375TGR Unit 3 notes (Rhythm, Tala and Combinatorial Structures, RV College of Engineering; §9.3,
   §10.1, §10.2):
     AP         a, a + d, …, a + (n − 1)d                 S = na + d·n(n − 1)/2
     GP         a, ar, …, arⁿ⁻¹                           S = a(rⁿ − 1)/(r − 1)
     Fibonacci  x₁, x₂, xᵢ = xᵢ₋₁ + xᵢ₋₂ (any two seeds)
     squares    k², (k + 1)², …                           1² + … + n² = n(n + 1)(2n + 1)/6
     polite     consecutive integers                      every S that is not a power of 2
     kuraippu   L, L/2, L/4, …                            S = L(2ⁿ − 1)/2ⁿ⁻¹ (always < 2L)
   Yatis (the shape of phrase lengths): sama (equal), srotovaha (increasing AP), gopuccha (decreasing
   AP), mridanga (a, …, a + md, …, a: S = (2m + 1)a + dm²), damaru or pippilika (b, …, b − md, …, b:
   S = (2m + 1)b − dm²) and vishama (irregular). Pure arithmetic: no syllables here. */

const sum = xs => xs.reduce((s, x) => s + x, 0);
const isInt = x => Number.isInteger(x);

/* ---------- sequences ---------- */
export function apTerms(a, d, n) { return Array.from({ length: n }, (_, i) => a + i * d); }
export function gpTerms(a, r, n) { return Array.from({ length: n }, (_, i) => a * Math.pow(r, i)); }
export function fibTerms(x1, x2, n) { const t = [x1, x2]; while (t.length < n) t.push(t[t.length - 1] + t[t.length - 2]); return t.slice(0, n); }
export function squareTerms(k, n) { return Array.from({ length: n }, (_, i) => (k + i) * (k + i)); }
export function kuraippuTerms(L, n) { return Array.from({ length: n }, (_, i) => L / Math.pow(2, i)); }

/* the sum with its formula, for a pattern { kind, a, d, r, n, x1, x2, k, L } */
export function patternInfo(p) {
  const { kind } = p;
  let terms, formula, name;
  if (kind === 'ap') {
    terms = apTerms(p.a, p.d, p.n); name = 'arithmetic progression';
    formula = 'n·a + d·n(n − 1)/2 = ' + p.n + '·' + p.a + ' + ' + p.d + '·' + p.n + '·' + (p.n - 1) + '/2 = ' + sum(terms);
  } else if (kind === 'gp') {
    terms = gpTerms(p.a, p.r, p.n); name = 'geometric progression';
    formula = 'a(rⁿ − 1)/(r − 1) = ' + p.a + '(' + p.r + '^' + p.n + ' − 1)/' + (p.r - 1) + ' = ' + sum(terms);
  } else if (kind === 'fib') {
    terms = fibTerms(p.x1, p.x2, p.n); name = isFibonacci(terms) ? 'Fibonacci' : 'Fibonacci-like';
    formula = terms.slice(2).map((t, i) => t + ' = ' + terms[i] + ' + ' + terms[i + 1]).join(', ') + '; sum ' + sum(terms);
  } else if (kind === 'squares') {
    terms = squareTerms(p.k, p.n); name = 'squares';
    const hi = p.k + p.n - 1, S = x => x * (x + 1) * (2 * x + 1) / 6;
    formula = p.k === 1 ? 'n(n + 1)(2n + 1)/6 = ' + p.n + '·' + (p.n + 1) + '·' + (2 * p.n + 1) + '/6 = ' + sum(terms) : S(hi) + ' − ' + S(p.k - 1) + ' = ' + sum(terms) + ' (squares to ' + hi + '² less those to ' + (p.k - 1) + '²)';
  } else if (kind === 'polite') {
    terms = apTerms(p.a, 1, p.n); name = 'consecutive integers (a polite number)';
    formula = 'n(2a + n − 1)/2 = ' + p.n + '(' + 2 * p.a + ' + ' + (p.n - 1) + ')/2 = ' + sum(terms);
  } else if (kind === 'kuraippu') {
    terms = kuraippuTerms(p.L, p.n); name = 'kuraippu (halving)';
    formula = 'L(2ⁿ − 1)/2ⁿ⁻¹ = ' + p.L + '·' + (Math.pow(2, p.n) - 1) + '/' + Math.pow(2, p.n - 1) + ' = ' + sum(terms) + ' (never reaches 2L = ' + 2 * p.L + ')';
  } else return null;
  return { kind, name, params: p, terms, sum: sum(terms), formula };
}
// consecutive terms of the true Fibonacci sequence 1, 1, 2, 3, 5, 8, …
function isFibonacci(t) {
  const F = [1, 1]; while (F[F.length - 1] < 1e6) F.push(F[F.length - 1] + F[F.length - 2]);
  for (let i = 0; i + t.length <= F.length; i++) if (t.every((x, j) => F[i + j] === x)) return true;
  return false;
}

/* ---------- yatis ---------- */
export const YATIS = ['sama', 'srotovaha', 'gopuccha', 'mridanga', 'damaru', 'vishama'];
export const YATI_INFO = {
  sama: { name: 'Sama', shape: 'equal', picture: 'a brick', sum: 'S = n·a' },
  srotovaha: { name: 'Srotovaha', shape: 'increasing', picture: 'a river widening as it flows to the sea', sum: 'S = n·a + d·n(n − 1)/2' },
  gopuccha: { name: 'Gopuccha', shape: 'decreasing', picture: 'a cow’s tail (go = cow, puccha = tail), tapering', sum: 'S = n·a − d·n(n − 1)/2 (a the first, longest)' },
  mridanga: { name: 'Mridanga', shape: 'small–big–small', picture: 'the mridangam: fat in the middle', sum: 'S = (2m + 1)·a + d·m²' },
  damaru: { name: 'Damaru (pippilika)', shape: 'big–small–big', picture: 'an hourglass drum, or an ant (pippilika) with a thin waist', sum: 'S = (2m + 1)·b − d·m²' },
  vishama: { name: 'Vishama', shape: 'irregular', picture: 'no regular pattern', sum: 'S = the plain sum' }
};
/* the phrase lengths of a yati. sama { a, n }; srotovaha { a, d, n } (a the first, shortest);
   gopuccha { a, d, n } (a the first, longest); mridanga { a, d, m } (2m + 1 terms, a at the ends);
   damaru { b, d, m } (b at the ends); vishama { terms } */
export function yatiTerms(kind, p) {
  if (kind === 'sama') return new Array(p.n).fill(p.a);
  if (kind === 'srotovaha') return apTerms(p.a, p.d, p.n);
  if (kind === 'gopuccha') return apTerms(p.a, -p.d, p.n);
  if (kind === 'mridanga') return Array.from({ length: 2 * p.m + 1 }, (_, i) => p.a + p.d * (p.m - Math.abs(i - p.m)));
  if (kind === 'damaru') return Array.from({ length: 2 * p.m + 1 }, (_, i) => p.b - p.d * (p.m - Math.abs(i - p.m)));
  if (kind === 'vishama') return (p.terms || []).slice();
  throw new Error('Unknown yati "' + kind + '".');
}
/* the closed-form sum, worked */
export function yatiSum(kind, p) {
  const t = yatiTerms(kind, p), S = sum(t);
  const f = kind === 'sama' ? p.n + ' × ' + p.a + ' = ' + S
    : kind === 'srotovaha' ? p.n + '·' + p.a + ' + ' + p.d + '·' + p.n + '·' + (p.n - 1) + '/2 = ' + S
    : kind === 'gopuccha' ? p.n + '·' + p.a + ' − ' + p.d + '·' + p.n + '·' + (p.n - 1) + '/2 = ' + S
    : kind === 'mridanga' ? '(2·' + p.m + ' + 1)·' + p.a + ' + ' + p.d + '·' + p.m + '² = ' + S
    : kind === 'damaru' ? '(2·' + p.m + ' + 1)·' + p.b + ' − ' + p.d + '·' + p.m + '² = ' + S
    : t.join(' + ') + ' = ' + S;
  return { kind, terms: t, sum: S, formula: f, ok: t.length > 0 && t.every(x => isInt(x) && x >= 1) };
}
/* solve a yati for its free term so that it sums to S: given n and d (or m and d), find a (or b).
   Returns the yati or { error } with the reason. */
export function fitYati(kind, S, p) {
  const d = p.d == null ? 1 : p.d;
  let q;
  if (kind === 'sama') { if (S % p.n) return { error: S + ' is not ' + p.n + ' equal phrases: ' + S + ' ÷ ' + p.n + ' is not whole.' }; q = { a: S / p.n, n: p.n }; }
  else if (kind === 'srotovaha' || kind === 'gopuccha') {
    const rest = kind === 'srotovaha' ? S - d * p.n * (p.n - 1) / 2 : S + d * p.n * (p.n - 1) / 2;
    if (rest % p.n) return { error: 'n·a = ' + rest + ' is not divisible by n = ' + p.n + ', so no whole first phrase works.' };
    q = { a: rest / p.n, d, n: p.n };
  } else if (kind === 'mridanga' || kind === 'damaru') {
    const k = 2 * p.m + 1, rest = kind === 'mridanga' ? S - d * p.m * p.m : S + d * p.m * p.m;
    if (rest % k) return { error: (kind === 'mridanga' ? 'S − dm²' : 'S + dm²') + ' = ' + rest + ' is not divisible by 2m + 1 = ' + k + '.' };
    q = kind === 'mridanga' ? { a: rest / k, d, m: p.m } : { b: rest / k, d, m: p.m };
  } else return { error: 'A vishama yati has no formula to solve; write its lengths out.' };
  const r = yatiSum(kind, q);
  if (!r.ok) return { error: 'The phrase lengths would be ' + r.terms.join(', ') + ': every phrase must be at least 1.' };
  return Object.assign(r, { params: q });
}
/* which yati a list of lengths is (sama, srotovaha, gopuccha, mridanga, damaru, else vishama) */
export function classifyYati(t) {
  const L = t.length, D = t.slice(1).map((x, i) => x - t[i]);
  if (L < 2) return { kind: 'vishama', why: 'one phrase has no shape' };
  if (D.every(x => x === 0)) return { kind: 'sama', params: { a: t[0], n: L } };
  if (D.every(x => x === D[0]) && D[0] > 0) return { kind: 'srotovaha', params: { a: t[0], d: D[0], n: L } };
  if (D.every(x => x === D[0]) && D[0] < 0) return { kind: 'gopuccha', params: { a: t[0], d: -D[0], n: L } };
  if (L % 2 === 1 && L >= 3) {
    const m = (L - 1) / 2, up = D.slice(0, m), dn = D.slice(m), d = up[0];
    if (up.every(x => x === d) && dn.every(x => x === -d) && d > 0) return { kind: 'mridanga', params: { a: t[0], d, m } };
    if (up.every(x => x === d) && dn.every(x => x === -d) && d < 0) return { kind: 'damaru', params: { b: t[0], d: -d, m } };
  }
  return { kind: 'vishama', why: 'no regular step' };
}

/* ---------- polite numbers ---------- */
/* every way to write S as two or more consecutive positive integers, by the odd-divisor recipe
   (Unit 3 §9.3): for each odd divisor d > 1, centre c = S/d; if c ≥ (d + 1)/2 the d terms around c,
   otherwise the 2c terms from (d + 1)/2 − c. There are (odd divisors − 1) of them; none for a power of 2. */
const POLITE = new Map();
export function politeRuns(S) {
  if (POLITE.has(S)) return POLITE.get(S);
  const res = politeRuns0(S);
  if (POLITE.size > 2000) POLITE.clear();
  POLITE.set(S, res);
  return res;
}
function politeRuns0(S) {
  const out = [], odd = [];
  if (!isInt(S) || S < 1) return { S, runs: out, oddDivisors: odd, powerOf2: false };
  for (let d = 1; d <= S; d += 2) if (S % d === 0) odd.push(d);
  odd.filter(d => d > 1).forEach(d => {
    const c = S / d;
    if (c >= (d + 1) / 2) out.push({ d, c, a: c - (d - 1) / 2, n: d, rule: 'the ' + d + ' terms centred at ' + c });
    else out.push({ d, c, a: (d + 1) / 2 - c, n: 2 * c, rule: c + ' is below (' + d + ' + 1)/2, so the ' + 2 * c + ' terms from ' + ((d + 1) / 2 - c) });
  });
  out.forEach(r => { r.terms = apTerms(r.a, 1, r.n); });
  out.sort((x, y) => x.n - y.n);
  return { S, runs: out, oddDivisors: odd, powerOf2: (S & (S - 1)) === 0 };
}

/* ---------- patterns that sum to a target ---------- */
/* every pattern of the six kinds (and the yatis) whose phrase lengths sum to V, each phrase 1 to maxTerm
   pulses, best first. o: { kinds, minN = 3, maxN = 8, maxTerm = 24, maxD = 4 } */
export const PATTERN_KINDS = ['ap', 'gp', 'fib', 'squares', 'polite', 'kuraippu', 'sama', 'srotovaha', 'gopuccha', 'mridanga', 'damaru'];
export function patternsFor(V, o = {}) {
  const kinds = o.kinds || PATTERN_KINDS, minN = o.minN || 3, maxN = o.maxN || 8, maxTerm = o.maxTerm || 24, maxD = o.maxD || 4, out = [];
  if (!isInt(V) || V < 3) return out;
  const want = k => kinds.includes(k), okTerms = t => t.length >= minN && t.every(x => isInt(x) && x >= 1 && x <= maxTerm);
  const push = (kind, params, terms, formula, name) => {
    if (!okTerms(terms) || sum(terms) !== V) return;
    const key = kind + ':' + terms.join(',');
    if (out.some(x => x.key === key)) return;
    let F = 1 - Math.abs(terms.length - 4) * 0.12 - (Math.min(...terms) < 2 ? 0.3 : 0) - (Math.max(...terms) > 12 ? 0.3 : 0);
    out.push({ key, kind, params, terms, sum: V, formula, name, score: +F.toFixed(2) });
  };
  for (let n = minN; n <= maxN; n++) {
    if (want('ap') || want('srotovaha')) for (let d = 1; d <= maxD; d++) { const r = V - d * n * (n - 1) / 2; if (r > 0 && r % n === 0) { const a = r / n, i = patternInfo({ kind: 'ap', a, d, n }); if (want('ap')) push('ap', { a, d, n }, i.terms, i.formula, i.name); if (want('srotovaha')) { const y = yatiSum('srotovaha', { a, d, n }); push('srotovaha', { a, d, n }, y.terms, y.formula, 'srotovaha yati'); } } }
    if (want('gopuccha')) for (let d = 1; d <= maxD; d++) { const r = V + d * n * (n - 1) / 2; if (r % n === 0) { const a = r / n, y = yatiSum('gopuccha', { a, d, n }); push('gopuccha', { a, d, n }, y.terms, y.formula, 'gopuccha yati'); } }
    if (want('sama') && V % n === 0) { const y = yatiSum('sama', { a: V / n, n }); push('sama', { a: V / n, n }, y.terms, y.formula, 'sama yati'); }
    if (want('gp')) for (let r = 2; r <= 3; r++) { const den = (Math.pow(r, n) - 1) / (r - 1); if (V % den === 0) { const i = patternInfo({ kind: 'gp', a: V / den, r, n }); push('gp', { a: V / den, r, n }, i.terms, i.formula, i.name); } }
    if (want('kuraippu')) { const num = V * Math.pow(2, n - 1), den = Math.pow(2, n) - 1; if (num % den === 0) { const L = num / den, i = patternInfo({ kind: 'kuraippu', L, n }); push('kuraippu', { L, n }, i.terms, i.formula, i.name); } }
    if (want('squares')) for (let k = 1; k * k <= maxTerm; k++) { const i = patternInfo({ kind: 'squares', k, n }); if (i.sum === V) push('squares', { k, n }, i.terms, i.formula, i.name); }
    // three terms obey the recurrence for any seeds, so a three-term run counts only if it is true Fibonacci (3, 5, 8)
    if (want('fib')) {
      // the sum of n terms is SA·x1 + SB·x2, so solve for x2 instead of trying every pair
      const t1 = fibTerms(1, 0, n), t2 = fibTerms(0, 1, n), SA = sum(t1), SB = sum(t2);
      for (let x1 = 1; x1 <= 12; x1++) { const rem = V - SA * x1; if (rem < SB * x1 || rem % SB) continue; const x2 = rem / SB; if (x2 > 12) continue; const i = patternInfo({ kind: 'fib', x1, x2, n }); if (n >= 4 || i.name === 'Fibonacci') push('fib', { x1, x2, n }, i.terms, i.formula, i.name); }
    }
  }
  if (want('polite')) politeRuns(V).runs.forEach(r => { if (r.n >= minN && r.n <= maxN) { const i = patternInfo({ kind: 'polite', a: r.a, n: r.n }); push('polite', { a: r.a, n: r.n }, i.terms, i.formula, i.name); } });
  for (let m = 1; 2 * m + 1 <= maxN; m++) for (let d = 1; d <= maxD; d++) {
    const k = 2 * m + 1;
    if (2 * m + 1 < minN) continue;
    if (want('mridanga')) { const r = V - d * m * m; if (r > 0 && r % k === 0) { const y = yatiSum('mridanga', { a: r / k, d, m }); push('mridanga', { a: r / k, d, m }, y.terms, y.formula, 'mridanga yati'); } }
    if (want('damaru')) { const r = V + d * m * m; if (r % k === 0) { const y = yatiSum('damaru', { b: r / k, d, m }); push('damaru', { b: r / k, d, m }, y.terms, y.formula, 'damaru (pippilika) yati'); } }
  }
  return out.sort((a, b) => b.score - a.score || a.terms.length - b.terms.length);
}
