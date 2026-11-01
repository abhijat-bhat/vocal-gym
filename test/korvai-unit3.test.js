/* v0.8.1 the korvai lab against the MA375TGR Unit 3 notes (Rhythm, Tala and Combinatorial Structures):
   every worked example and practice answer the lab can compute (purvanga patterns, yatis, the notes'
   korvai model, progressive korvais, the Samam and Edapu algorithms, the constant-total methods, tihais
   with half gaps, the chakkardar, drift), and properties over every pattern and the 35 talas. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { E, FAMS, JATIS, checker } from './helpers.js';

const K = E.korvai;
const adi = c => K.korvaiFrame({ fam: 'triputa', L: 4, gati: 4, cycles: c });
const sum = xs => xs.reduce((a, b) => a + b, 0);

test('purvanga patterns: AP, GP, squares, polite numbers, Fibonacci-like and kuraippu (§9.3, §10.2)', () => {
  assert.equal(K.patternInfo({ kind: 'ap', a: 2, d: 1, n: 6 }).sum, 27, 'Ex. 9.5: 2 + 3 + … + 7');
  assert.equal(K.patternInfo({ kind: 'gp', a: 2, r: 2, n: 5 }).sum, 62, 'Ex. 9.6: 2 + 4 + 8 + 16 + 32');
  assert.equal(K.patternInfo({ kind: 'squares', k: 1, n: 5 }).sum, 55, 'Ex. 9.7: 1 + 4 + 9 + 16 + 25');
  assert.equal(K.patternInfo({ kind: 'kuraippu', L: 16, n: 5 }).sum, 31, 'Ex. 10.2: 16 + 8 + 4 + 2 + 1');
  assert.equal(K.patternInfo({ kind: 'kuraippu', L: 32, n: 4 }).sum, 60, 'P13');
  assert.deepEqual(K.patternInfo({ kind: 'fib', x1: 3, x2: 4, n: 5 }).terms, [3, 4, 7, 11, 18], 'the notes’ Fibonacci-like 3, 4, 7, 11, 18');
  assert.equal(K.patternInfo({ kind: 'fib', x1: 3, x2: 4, n: 5 }).sum, 43);
  assert.equal(K.patternInfo({ kind: 'fib', x1: 3, x2: 5, n: 3 }).name, 'Fibonacci', '3, 5, 8 are true Fibonacci numbers (Q17)');
  assert.equal(K.patternInfo({ kind: 'fib', x1: 3, x2: 4, n: 3 }).name, 'Fibonacci-like');
  // polite numbers
  assert.deepEqual(K.politeRuns(35).runs.find(r => r.n === 5).terms, [5, 6, 7, 8, 9], 'Ex. 9.8');
  assert.deepEqual(K.politeRuns(15).runs.map(r => r.terms.join('+')).sort(), ['1+2+3+4+5', '4+5+6', '7+8'].sort(), '15 three ways');
  assert.deepEqual(K.politeRuns(30).runs.map(r => r.terms.join('+')).sort(), ['4+5+6+7+8', '6+7+8+9', '9+10+11'].sort(), 'Ex. 9.9 (a)');
  assert.deepEqual(K.politeRuns(96).runs.map(r => r.terms.join('+')), ['31+32+33'], 'Ex. 9.9 (b)');
  ['14+15+16', '7+8+9+10+11', '1+2+3+4+5+6+7+8+9'].forEach(r => assert.ok(K.politeRuns(45).runs.some(x => x.terms.join('+') === r), 'P11 ' + r));
  for (let S = 1; S <= 600; S++) {
    const P = K.politeRuns(S), odd = P.oddDivisors.length;
    assert.equal(P.runs.length, odd - 1, S + ': (odd divisors − 1) runs');
    assert.equal(P.runs.length === 0, (S & (S - 1)) === 0, S + ': impolite exactly when a power of 2');
    P.runs.forEach(r => { assert.equal(sum(r.terms), S); assert.ok(r.terms.length >= 2 && r.terms[0] >= 1); });
  }
});

test('the six yatis and their closed forms (§10.1)', () => {
  assert.equal(K.yatiSum('srotovaha', { a: 4, d: 2, n: 5 }).sum, 40, '4-6-8-10-12');
  assert.deepEqual(K.yatiSum('gopuccha', { a: 12, d: 2, n: 5 }).terms, [12, 10, 8, 6, 4], 'a cow’s tail tapering');
  assert.equal(K.yatiSum('gopuccha', { a: 12, d: 2, n: 5 }).sum, 40);
  assert.deepEqual(K.yatiSum('mridanga', { a: 4, d: 2, m: 3 }).terms, [4, 6, 8, 10, 8, 6, 4]);
  assert.equal(K.yatiSum('mridanga', { a: 4, d: 2, m: 3 }).sum, 46, '(2m + 1)a + dm² = 46');
  assert.equal(K.yatiSum('damaru', { b: 8, d: 2, m: 2 }).sum, 32, '8-6-4-6-8 is one Adi cycle');
  assert.equal(K.yatiSum('damaru', { b: 12, d: 3, m: 2 }).sum, 48, 'P18: two Rupaka cycles');
  assert.deepEqual(K.yatiSum('sama', { a: 8, n: 4 }).terms, [8, 8, 8, 8]);
  assert.deepEqual(K.fitYati('srotovaha', 32, { n: 4, d: 2 }).terms, [5, 7, 9, 11], 'Ex. 10.1');
  assert.deepEqual(K.fitYati('gopuccha', 32, { n: 4, d: 2 }).terms, [11, 9, 7, 5], 'and its gopuccha');
  assert.equal(K.fitYati('srotovaha', 24, { n: 4, d: 2 }).terms[0], 3, 'P12: 3, 5, 7, 9 fills Rupaka');
  assert.ok(K.fitYati('srotovaha', 33, { n: 4, d: 2 }).error, 'no whole first phrase');
  assert.ok(K.fitYati('gopuccha', 10, { n: 4, d: 3 }).error, 'a phrase would go below 1');
  const cls = t => K.classifyYati(t).kind;
  assert.equal(cls([8, 8, 8, 8]), 'sama'); assert.equal(cls([4, 6, 8, 10]), 'srotovaha'); assert.equal(cls([10, 8, 6, 4]), 'gopuccha');
  assert.equal(cls([4, 6, 8, 6, 4]), 'mridanga'); assert.equal(cls([8, 6, 4, 6, 8]), 'damaru'); assert.equal(cls([5, 3, 7, 4]), 'vishama');
});

test('every pattern found for a target sums to it and has its shape', t => {
  const { ok, done } = checker(t);
  const F = [1, 1]; while (F.length < 40) F.push(F[F.length - 1] + F[F.length - 2]);
  for (let V = 3; V <= 240; V++) K.patternsFor(V).forEach(p => {
    const x = p.terms, D = x.slice(1).map((v, i) => v - x[i]), tag = V + ' ' + p.kind + ' ' + x.join(',');
    ok(sum(x) === V && x.every(v => Number.isInteger(v) && v >= 1), tag + ' sums');
    if (p.kind === 'ap' || p.kind === 'srotovaha') ok(D.every(d => d === D[0] && d > 0), tag);
    if (p.kind === 'gopuccha') ok(D.every(d => d === D[0] && d < 0), tag);
    if (p.kind === 'sama') ok(D.every(d => d === 0), tag);
    if (p.kind === 'polite') ok(D.every(d => d === 1), tag);
    if (p.kind === 'gp') ok(x.slice(1).every((v, i) => v === x[i] * p.params.r), tag);
    if (p.kind === 'kuraippu') ok(x.slice(1).every((v, i) => 2 * v === x[i]), tag);
    if (p.kind === 'squares') ok(x.every((v, i) => v === (p.params.k + i) ** 2), tag);
    if (p.kind === 'fib') ok(x.slice(2).every((v, i) => v === x[i] + x[i + 1]) && (x.length >= 4 || F.join(',').includes(x.join(','))), tag);
    if (p.kind === 'mridanga' || p.kind === 'damaru') ok(K.classifyYati(x).kind === p.kind, tag);
  });
  done();
});

test('the notes’ korvai: three statements, unequal statements, an eduppu, the length condition (§7.3–§7.7)', () => {
  // Ex. 7.14 / 9.1: (3, 4, 5, 6, 7) + 7, three times = 96
  let k = K.statementKorvai(adi(3), { terms: [3, 4, 5, 6, 7] });
  assert.ok(k.ok); assert.deepEqual(k.Us, [7, 7, 7]); assert.ok(k.equal); assert.equal(Math.round(k.ratio * 100), 78, 'purvanga-heavy 78%');
  // Ex. 7.12 / Q14: (2, 3, 4, 5) in two cycles: 21, 21, 22
  k = K.statementKorvai(adi(2), { terms: [2, 3, 4, 5] });
  assert.ok(k.ok); assert.deepEqual(k.lens, [21, 21, 22]); assert.deepEqual(k.Us, [7, 7, 8]);
  // Ex. 7.15 / Q17: Khanda Ata, a Fibonacci purvanga 3, 5, 8, two cycles: 37, 37, 38 with 21, 21, 22
  const ata = K.korvaiFrame({ fam: 'ata', L: 5, gati: 4, cycles: 2 });
  assert.equal(ata.C, 56);
  k = K.statementKorvai(ata, { terms: [3, 5, 8] });
  assert.ok(k.ok); assert.deepEqual(k.lens, [37, 37, 38]); assert.deepEqual(k.Us, [21, 21, 22]);
  assert.deepEqual(k.parts.filter(p => p.role === 'uttaranga' && p.group === 0).map(p => p.syl.length), [7, 7, 7], 'U = 7 + 7 + 7');
  // solution 2: an eduppu of 1 pulse and three identical statements of 37
  assert.equal(k.eduppu.start, 1);
  const k2 = K.statementKorvai(K.korvaiFrame({ fam: 'ata', L: 5, gati: 4, cycles: 2, start: 1 }), { terms: [3, 5, 8] });
  assert.ok(k2.ok && k2.equal); assert.deepEqual(k2.lens, [37, 37, 37]);
  // the length condition: S ≡ 0 (mod N / gcd(N, 3))
  assert.equal(K.lengthCondition(32).mod, 32); assert.equal(K.lengthCondition(24).mod, 8); assert.equal(K.lengthCondition(56).mod, 56);
  // Algorithm 1: T = 96, r = 0.75 → (24, 8)
  assert.deepEqual([K.targetSplit(96, 0.75).P, K.targetSplit(96, 0.75).U], [24, 8]);
  // the judge reads a korvai of equal statements as its teermanam
  k = K.statementKorvai(adi(3), { terms: [3, 4, 5, 6, 7] });
  const J = E.judgeJathi(K.toJathiScript(adi(3), k).script);
  assert.ok(J.ok && J.gatePass, J.gate && J.gate.filter(g => !g.ok).map(g => g.detail).join(' '));
  // errors
  assert.ok(K.statementKorvai(adi(1), { terms: [10, 12] }).error, 'a purvanga longer than the statement');
  assert.ok(K.statementKorvai(adi(1), { terms: [] }).error);
});

test('progressive korvais (Def. 7.4)', () => {
  let p = K.progressiveKorvai(adi(3), { m: 4, d: 2, U: 3, r: 3 });
  assert.ok(p.ok); assert.deepEqual(p.Ps, [2, 4, 6, 8], 'Ex. 7.2');
  p = K.progressiveKorvai(adi(3), { m: 3, d: 2, U: 10, r: 1 });
  assert.ok(p.ok); assert.deepEqual(p.Ps, [20, 22, 24], 'Ex. 7.3');
  assert.match(K.progressiveKorvai(adi(2), { m: 3, d: 2, U: 10, r: 1 }).error, /not divisible by m = 3/, 'no whole P in 64');
  K.progressiveOptions(adi(3)).forEach(o => { const r = K.progressiveKorvai(adi(3), o); assert.ok(r.ok, o.text); });
});

test('the Samam and Edapu algorithms (§9.1, §9.2)', () => {
  // the slides' korvais: (8 + 8) × 3 → T(U) = 48 at k = 1; (8 + 6) × 3 → 22 at k = 0
  let A = K.samamAlgorithm(32, 48); assert.equal(A.M, 16); assert.equal(A.rows[1].TU, 48);
  A = K.samamAlgorithm(32, 42); assert.equal(A.M, 10); assert.equal(A.rows[0].TU, 22);
  A = K.samamAlgorithm(24, 30); assert.equal(A.M, 6); assert.equal(A.rows[0].TU, 18, 'Ex. 9.2 Rupaka');
  A = K.samamAlgorithm(32, 39); assert.equal(A.rows[0].TU, 25, 'P6');
  A = K.samamAlgorithm(32, 64); assert.equal(A.rows[0].TU, 32, 'M = 0: a whole cycle of uttaranga');
  // laid out: the 96 (a build-up of Thadiginathoms with Dhinku × 3) and the 64 (Thadhin,ginathom with Dhin,)
  let R = K.samamKorvai({ fam: 'triputa', L: 4, gati: 4, phrase: 8, kaarvai: 8, k: 1, form: 'buildup' });
  assert.ok(R.ok); assert.ok(R.uttarangaOptions.some(u => u.P === 5 && u.G === 9), '5 (9) 5 5 (9) 5 5 5');
  R = K.samamKorvai({ fam: 'triputa', L: 4, gati: 4, phrase: 8, kaarvai: 6, k: 0, form: 3 });
  assert.ok(R.ok); assert.ok(R.uttarangaOptions.some(u => u.P === 6 && u.G === 2));
  R = K.samamKorvai({ fam: 'rupaka', L: 4, gati: 4, phrase: 8, kaarvai: 2, k: 0, form: 3 });
  assert.ok(R.ok && R.uttarangaOptions.some(u => u.P === 6 && u.G === 0), 'Ex. 9.2: bedam 6 6 6');
  R = K.samamKorvai({ fam: 'triputa', L: 4, gati: 4, phrase: 8, kaarvai: 5, k: 0, form: 3 });
  assert.ok(R.ok && R.uttarangaOptions.some(u => u.P === 5 && u.G === 5), 'P6');
  // Edapu
  const ed = (n, k) => K.edapuAlgorithm(n, k);
  assert.deepEqual([ed(32, 2).m, ed(32, 2).third], [2, 22], 'Ex. 9.3 (a)');
  assert.deepEqual([ed(32, 4).m, ed(32, 4).third], [1, 12], 'Ex. 9.3 (b)');
  assert.deepEqual([ed(14, 2).m, ed(14, 2).third], [2, 10], 'P8');
  assert.deepEqual([ed(32, 3).m, ed(32, 3).span], [3, 99], 'P16');
  assert.equal(ed(24, 1).ok, false, 'P9: 24 is a multiple of 3');
  assert.equal(ed(24, 3).ok, true, 'unless k is too');
  assert.equal(ed(32, -2).span % 3, 0, 'atita: mn − k');
  // Ex. 9.4: a half-beat eduppu in Adi: 66 = 3 × 22, (15 + 7) × 3
  const F = K.korvaiFrame({ fam: 'triputa', L: 4, gati: 4, cycles: 2, land: 2 });
  assert.equal(F.total, 66);
  assert.ok(K.statementKorvai(F, { terms: [4, 5, 6] }).ok);
  // every n and k: the span divides by 3 whenever the algorithm says so
  for (let n = 3; n <= 120; n++) for (let k = -(n - 1); k < n; k++) { const r = ed(n, k); if (r.ok) assert.equal(r.span % 3, 0, n + ' ' + k); else assert.ok(n % 3 === 0 && ((k % 3) + 3) % 3 !== 0, n + ' ' + k); }
});

test('the same total, a new korvai: Methods A and B (§7.6)', () => {
  const a = K.constantTotal({ f: 8, p: 8, form: 'buildup', u: 5, g: 9 });
  assert.equal(a.total, 96);
  assert.deepEqual(a.A.map(v => [v.u, v.g]), [[6, 6], [7, 3], [8, 0]], 'Thadhin,ginathom, Tha,dhin,ginathom, then no kaarvai (P7)');
  const b = K.constantTotal({ f: 8, p: 6, form: 3, u: 6, g: 2 });
  assert.equal(b.total, 64);
  assert.deepEqual(b.B.slice(0, 2).map(v => [v.p, v.u, v.TP, v.TU]), [[4, 8, 36, 28], [2, 10, 30, 34]], 'Ex. 7.7 and 7.8');
  [a.A, b.B, a.B, b.A].forEach(list => list.forEach(v => {
    const R = K.constantTotalPlan({ fam: 'triputa', L: 4, gati: 4, form: list === a.A || list === a.B ? 'buildup' : 3, sounded: true }, v);
    assert.ok(R.ok, JSON.stringify(v) + ' ' + (R.error || ''));
  }));
  // the sounded kaarvais of the slides
  assert.deepEqual(K.kaarvaiOf(2), ['dhin', ',']); assert.deepEqual(K.kaarvaiOf(9), ['dhin', 'ku', ',', 'dhin', 'ku', ',', 'dhin', 'ku', ','], '(Dhinku) × 3'); assert.equal(K.kaarvaiOf(3).length, 3); assert.equal(K.kaarvaiOf(8).length, 8);
  // the slides' uttaranga variants keep "gi na thom"
  [5, 6, 7, 8, 10].forEach(n => { const s = K.statementOf(n); assert.equal(s.length, n); assert.deepEqual(s.slice(-3), ['gi', 'na', 'thom']); });
});

test('tihais: every whole solution, half gaps, bedam and the chakkardar (§8)', () => {
  const whole = T => K.moraSolutions(T).map(s => s.P + ',' + s.G).sort();
  assert.deepEqual(whole(32), ['10,1', '2,13', '4,10', '6,7', '8,4'], 'Ex. 8.1');
  assert.deepEqual(whole(40), ['10,5', '12,2', '2,17', '4,14', '6,11', '8,8'], 'P14 Misra Jhampa');
  assert.ok(K.moraSolutions(24).some(s => s.P === 8 && s.G === 0), 'Ex. 8.2 bedam');
  assert.ok(K.moraSolutions(35).some(s => s.P === 7 && s.G === 7), 'Ex. 8.3');
  assert.ok(K.moraSolutions(48).some(s => s.P === 8 && s.G === 12), 'Ex. 8.6');
  assert.ok(K.halfTihais(32).some(s => s.P === 5 && s.G === 8.5), 'Ex. 8.4');
  assert.ok(K.halfTihais(48).some(s => s.P === 9 && s.G === 10.5), 'Ex. 8.5');
  for (let T = 1; T <= 200; T++) { const n = K.moraSolutions(T).length + K.halfTihais(T).length; assert.equal(n, Math.floor(T / 3), T + ': one solution for each P up to T/3'); }
  // a half gap drawn at twice the resolution lands
  const D = K.doubledFrame(adi(1));
  assert.equal(D.C, 64);
  assert.ok(K.moraPlan(D, { P: 10, G: 17 }).ok, '5 (8½) 5 (8½) 5 in one Adi cycle');
  // chakkardar
  const c4 = K.chakkardarSolutions(64).find(s => s.P1 === 4 && s.G1 === 1);
  assert.equal(c4.G2, 11, 'P4'); assert.ok(K.chakkardarPlan(adi(2), c4).ok);
  const tis = K.korvaiFrame({ fam: 'triputa', L: 4, gati: 3, cycles: 2 });
  const c3 = K.chakkardarSolutions(48, { halves: true }).find(s => s.P1 === 3 && s.G1 === 2);
  assert.equal(c3.G2, 4.5, 'Ex. 8.7'); assert.ok(K.chakkardarPlan(tis, c3).ok, 'drawn at double resolution');
  K.chakkardarSolutions(96, { halves: true }).forEach(s => { assert.equal(9 * s.P1 + 6 * s.G1 + 2 * s.G2, 96); assert.ok(K.chakkardarPlan(adi(3), s).ok, s.eq); });
});

test('drift: a repeating phrase, graha-bheda and nadai-bheda (§6.3, §6.4)', () => {
  assert.deepEqual([K.drift(5, 32).reps, K.drift(5, 32).cycles], [32, 5], 'Ex. 6.2');
  assert.deepEqual([K.drift(7, 32).reps, K.drift(7, 32).cycles], [32, 7], 'Ex. 6.3');
  assert.deepEqual(K.drift(12, 32).visits.map(v => v.end), [12, 24, 4, 16, 28, 8, 20, 0], 'Ex. 6.4');
  assert.deepEqual(K.drift(12, 32).visits.map(v => v.beat), [4, 7, 2, 5, 8, 3, 6, 1], 'beats 4, 7, 2, 5, 8, 3, 6, then sam');
  assert.deepEqual([K.drift(6, 32).reps, K.drift(6, 32).cycles], [16, 3], 'P10');
  assert.deepEqual([K.drift(14, 32).reps, K.drift(14, 32).cycles, K.drift(14, 32).gcd], [16, 7, 2], 'P15');
  assert.equal(K.drift(56, 24).lcm, 168, 'Ex. 1.2');
  assert.equal(K.drift(3, 32, 4).beatMeet, 12, 'Ex. 6.5: 4 against 3');
  assert.equal(K.drift(5, 32, 4).beatMeet, 20, 'Ex. 6.6');
  for (let L = 1; L <= 40; L++) { const d = K.drift(L, 32); assert.equal(new Set(d.visits.map(v => v.end)).size, d.reps); assert.ok(d.visits.every(v => v.end % d.gcd === 0)); }
});

test('the notes’ constructions land in every frame of the 35 talas', t => {
  const { ok, done } = checker(t);
  let n = 0;
  FAMS.forEach(fam => JATIS.forEach(L => [3, 4, 5].forEach(gati => [1, 2, 3].forEach(cycles => [0, gati].forEach(land => {
    const F = K.korvaiFrame({ fam, L, gati, cycles, land });
    const tag = fam + L + ' g' + gati + ' c' + cycles + ' l' + land;
    K.statementOptions(F, { limit: 3 }).forEach(o => { const r = K.statementKorvai(F, { terms: o.terms, pattern: o }); n++; ok(r.ok && r.ratio >= 0.3 - 1e-9 && r.ratio <= 0.7 + 1e-9, tag + ' statements ' + o.terms.join(',')); });
    K.progressiveOptions(F, { limit: 2 }).forEach(o => { const r = K.progressiveKorvai(F, o); n++; ok(r.ok, tag + ' progressive ' + o.text); });
    K.chakkardarSolutions(F.total, { limit: 2 }).forEach(s => { n++; ok(K.chakkardarPlan(F, s).ok, tag + ' chakkardar ' + s.eq); });
    const e = K.edapuAlgorithm(F.C, land);
    if (e.ok && e.m <= 8) { const G = K.korvaiFrame({ fam, L, gati, cycles: e.m, land }); const o = K.statementOptions(G, { limit: 1 })[0]; if (o) { n++; ok(K.statementKorvai(G, { terms: o.terms }).equal, tag + ' edapu gives equal statements'); } }
  })))));
  t.diagnostic(n + ' constructions laid out');
  done();
});
