/* v0.8 the korvai and tihai lab (docs/research/korvai-tihai.md): the arithmetic against the published
   tables and worked examples, and every frame of the 35 talas × gatis × kalais × spans × start and
   landing points laid out cell by cell. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { E, FAMS, JATIS, checker } from './helpers.js';

const K = E.korvai;

/* Balaji 2024, pp. 58–60 and 63: for a = 5…10 (rows) and k = 0…10, the total and the offset ("off"),
   transcribed from the article's charts. Adi tala is 32 pulses; Khanda jati Triputa is 36. */
const CHARTS = [
  { n: 3, C: 32, rows: `
15 17 17 15 19 13 21 11 23 9 25 7 27 5 29 3 31 1 33 31 35 29
18 14 20 12 22 10 24 8 26 6 28 4 30 2 32 0 34 30 36 28 38 26
21 11 23 9 25 7 27 5 29 3 31 1 33 31 35 29 37 27 39 25 41 23
24 8 26 6 28 4 30 2 32 0 34 30 36 28 38 26 40 24 42 22 44 20
27 5 29 3 31 1 33 31 35 29 37 27 39 25 41 23 43 21 45 19 47 17
30 2 32 0 34 30 36 28 38 26 40 24 42 22 44 20 46 18 48 16 50 14` },
  { n: 6, C: 32, rows: `
30 2 32 0 34 30 36 28 38 26 40 24 42 22 44 20 46 18 48 16 50 14
36 28 38 26 40 24 42 22 44 20 46 18 48 16 50 14 52 12 54 10 56 8
42 22 44 20 46 18 48 16 50 14 52 12 54 10 56 8 58 6 60 4 62 2
48 16 50 14 52 12 54 10 56 8 58 6 60 4 62 2 64 0 66 30 68 28
54 10 56 8 58 6 60 4 62 2 64 0 66 30 68 28 70 26 72 24 74 22
60 4 62 2 64 0 66 30 68 28 70 26 72 24 74 22 76 20 78 18 80 16` },
  { n: 9, C: 32, rows: `
45 19 47 17 49 15 51 13 53 11 55 9 57 7 59 5 61 3 63 1 65 31
54 10 56 8 58 6 60 4 62 2 64 0 66 30 68 28 70 26 72 24 74 22
63 1 65 31 67 29 69 27 71 25 73 23 75 21 77 19 79 17 81 15 83 13
72 24 74 22 76 20 78 18 80 16 82 14 84 12 86 10 88 8 90 6 92 4
81 15 83 13 85 11 87 9 89 7 91 5 93 3 95 1 97 31 99 29 101 27
90 6 92 4 94 2 96 0 98 30 100 28 102 26 104 24 106 22 108 20 110 18` },
  { n: 3, C: 36, rows: `
15 21 17 19 19 17 21 15 23 13 25 11 27 9 29 7 31 5 33 3 35 1
18 18 20 16 22 14 24 12 26 10 28 8 30 6 32 4 34 2 36 0 38 34
21 15 23 13 25 11 27 9 29 7 31 5 33 3 35 1 37 35 39 33 41 31
24 12 26 10 28 8 30 6 32 4 34 2 36 0 38 34 40 32 42 30 44 28
27 9 29 7 31 5 33 3 35 1 37 35 39 33 41 31 43 29 45 27 47 25
30 6 32 4 34 2 36 0 38 34 40 32 42 30 44 28 46 26 48 24 50 22` }
];

test('Balaji’s charts: the totals and offsets of the series of 3, 6 and 9, for Adi and Khanda Triputa', t => {
  const { ok, done } = checker(t);
  ok(K.talaCycle(E.tala('triputa', 4), 4).pulses === 32 && K.talaCycle(E.tala('triputa', 5), 4).pulses === 36, 'Adi is 32 pulses and Khanda Triputa 36');
  CHARTS.forEach(ch => {
    const want = ch.rows.trim().split('\n').map(r => r.trim().split(/\s+/).map(Number));
    const got = K.seriesChart(ch.C, ch.n);
    got.rows.forEach((row, i) => row.cells.forEach((c, k) => {
      ok(c.total === want[i][2 * k] && c.off === want[i][2 * k + 1], 'series ' + ch.n + ', C ' + ch.C + ', a ' + row.a + ', k ' + c.k + ': ' + c.total + '/' + c.off + ' vs ' + want[i][2 * k] + '/' + want[i][2 * k + 1]);
      // and offsetFor agrees, and starting there lands on sam
      const o = K.offsetFor(c.total, ch.C);
      ok(o.start === c.off && (o.start + c.total) % ch.C === 0, 'offsetFor ' + c.total);
    }));
  });
  // the worked examples of the text: a = 7, k = 5 → 31, off 1; a = 5, k = 3 in series 6 → 36, off 28; a = 9, k = 8 in series 9 → 97, off 31
  ok(K.offsetFor(31, 32).start === 1 && K.offsetFor(36, 32).start === 28 && K.offsetFor(97, 32).start === 31, 'the worked offsets');
  done();
});

test('Balaji’s korvais: Adi, Misra Chapu and the yati and 1-2-4 purvangas', () => {
  const adi2 = K.korvaiFrame({ fam: 'triputa', L: 4, gati: 4, cycles: 2 });
  assert.equal(adi2.total, 64);
  // purvanga 33 (T . d . t k d m (t n g) × 3) and uttaranga 31 (5 (8) 5 (8) 5), p. 63
  let k = K.korvaiPlan(adi2, { purvanga: { kind: 'triple', name: 'phrase (gap) × 3', formula: '3 × (8 + 3)', lines: [0, 1, 2].map(() => ({ pre: 0, len: 8, gap: 3 })) }, uttaranga: { n: 3, P: 5, G: 8 } });
  assert.ok(k.ok, JSON.stringify(k.layout && k.layout.checks));
  assert.deepEqual(k.layout.sylls.slice(0, 11), ['tha', ',', 'dhi', ',', 'tha', 'ka', 'dhi', 'mi', ',', ',', ',']);
  // the engine's own first choice for Adi, two cycles, is that purvanga
  assert.equal(K.korvaiPlans(adi2)[0].V, 33);
  // purvanga 41 (21 + 13 + 7) and uttaranga 23 (5 (4) 5 (4) 5), p. 64
  k = K.korvaiPlan(adi2, { purvanga: { kind: 'gopuccha', name: 'yati', formula: '21, 13, 7', lines: [{ pre: 0, len: 18, gap: 3 }, { pre: 0, len: 10, gap: 3 }, { pre: 0, len: 4, gap: 3 }] }, uttaranga: { n: 3, P: 5, G: 4 } });
  assert.ok(k.ok);
  // the same purvanga in Misra Chapu (14 pulses: two a beat): 41 + 43 (9 (8) 9 (8) 9) = 84, six cycles
  const chapu = K.korvaiFrame({ fam: 'chapu', L: 7, gati: 2, cycles: 6 });
  assert.equal(chapu.C, 14);
  k = K.korvaiPlan(chapu, { purvanga: k.purvanga, uttaranga: { n: 3, P: 9, G: 8 } });
  assert.ok(k.ok);
  // three cycles of Adi: a gopuccha purvanga of 20 (6, 5, 4, 3, 2) and 8 8 8 (2) 8 8 8 (2) 8 8 8 = 76, p. 60
  const adi3 = K.korvaiFrame({ fam: 'triputa', L: 4, gati: 4, cycles: 3 });
  const g20 = K.purvangaShapes(20).find(s => s.kind === 'gopuccha' && s.lines.every(l => l.gap === 1) && s.lines.map(l => l.len + l.gap).join() === '6,5,4,3,2');
  assert.ok(g20, 'the gopuccha of 20 is found');
  assert.ok(K.purvangaShapes(20).find(s => s.kind === 'srotovaha' && s.lines.map(l => l.len + l.gap).join() === '2,3,4,5,6'), 'and its srotovaha');
  k = K.korvaiPlan(adi3, { purvanga: g20, uttaranga: { n: 9, P: 8, G: 2 } });
  assert.ok(k.ok);
  // v0.8.1: the yati's lines are one phrase trimmed from the front, so the ending stays: tha dhi gi na thom, dhi gi na thom …
  assert.deepEqual(k.layout.sylls.slice(0, 11), ['tha', 'dhi', 'gi', 'na', 'thom', ',', 'dhi', 'gi', 'na', 'thom', ',']);
  // the averaged uttaranga 7 7 7 (2) 8 8 8 (2) 9 9 9 has the same length, p. 61
  k = K.korvaiPlan(adi3, { purvanga: g20, uttaranga: { n: 9, P: 8, G: 2 } }, { shape: 'srotovaha', d: 1 });
  assert.ok(k.ok);
  // the 1-2-4 rule: 31 − 7 = 24 = 3 × 8, so 1 (8) 2 (8) 4 (8), with an uttaranga of 7 nine times, k = 1 (65), p. 62
  const r124 = K.purvangaShapes(31).find(s => s.kind === '124');
  assert.equal(r124.formula, '1(8) 2(8) 4(8)');
  k = K.korvaiPlan(adi3, { purvanga: r124, uttaranga: { n: 9, P: 7, G: 1 } });
  assert.ok(k.ok);
  assert.deepEqual(K.purvangaShapes(32).find(s => s.kind === '124').lines.map(l => l.pre), [2, 4, 8], '32 − 14 = 18: prefixes 2, 4, 8');
  // a damaru yati of 47 (7, 6, 5, 4, 3, 4, 5, 6, 7): the lines are phrases of 4 … 0 … 4, each with a karvai of 3, p. 62
  const dam = { kind: 'damaru', name: 'damaru', formula: '47', lines: [4, 3, 2, 1, 0, 1, 2, 3, 4].map(len => ({ pre: 0, len, gap: 3 })) };
  k = K.korvaiPlan(K.korvaiFrame({ fam: 'triputa', L: 4, gati: 4, cycles: 3 }), { purvanga: dam, uttaranga: { n: 3, P: 13, G: 5 } });
  assert.ok(k.ok, '47 + 49 = 96');
  // the gati change: a three-cycle Adi korvai (96 pulses) recites in tisra, a five-cycle one (160) in khanda, p. 64
  assert.deepEqual(K.gatiFits(96, 8).filter(x => x.ok).map(x => x.gati), [3, 4]);
  assert.deepEqual(K.gatiFits(160, 8).filter(x => x.ok).map(x => x.gati), [4, 5]);
});

test('trikaala: Balaji’s examples, and every variant lands on sam', t => {
  const { ok, done } = checker(t);
  // five in Khanda Triputa (9 beats): 15 beats, leave 3 and start on beat 4; seven in Misra Jhampa (10): 21, start on beat 10
  const a = K.trikaala({ fam: 'triputa', L: 5, n: 5 }), b = K.trikaala({ fam: 'jhampa', L: 7, n: 7 });
  ok(a.ok && a.startBeat === 3 && a.cycles === 2, 'Khanda Triputa, 5: start beat ' + a.startBeat);
  ok(b.ok && b.startBeat === 9 && b.cycles === 3, 'Misra Jhampa, 7: start beat ' + b.startBeat);
  FAMS.forEach(fam => JATIS.forEach(L => [1, 2].forEach(kalai => [3, 4, 5, 6, 7, 8, 9, 10].forEach(n => ['full', 'gap', 'lead'].forEach(variant => {
    const r = K.trikaala({ fam, L, kalai, n, variant });
    if (r.error) { ok(/more than/.test(r.error), fam + L + ' ' + r.error); return; }
    ok(r.ok, fam + L + ' kalai ' + kalai + ' n ' + n + ' ' + variant + ': ' + JSON.stringify(r.layout.checks));
    const sounding = r.layout.cells.filter(c => c.syl && c.syl !== ',' && c.role !== 'close').length;
    const per = n - (K.JATI_SYLLABLES[n] || []).filter(x => x === ',').length;
    ok(sounding === (variant === 'gap' ? 6 : 7) * per, fam + L + ' n ' + n + ' ' + variant + ': ' + sounding + ' syllables');
  })))));
  done();
});

test('the Hindustani tihai and chakradar (digitabla): counted with the last stroke on sam', () => {
  const tin = E.customTala([4, 4, 4, 4]);
  const one = K.korvaiFrame({ tala: tin, gati: 1, cycles: 1, counting: 'on' });
  assert.equal(one.total, 17, '1 avartan plus sam');
  assert.ok(K.moraSolutions(17, { gati: 1 }).some(s => s.P === 5 && s.G === 1), 'damdar 5 × 3 + 2 = 17');
  // bedam 5.5 × 3 = 16.5: at two pulses a matra, 11 × 3 = 33 = 32 + 1
  assert.ok(K.moraSolutions(K.korvaiFrame({ tala: tin, gati: 2, counting: 'on' }).total, { gati: 2 }).some(s => s.P === 11 && s.G === 0));
  const two = K.korvaiFrame({ tala: tin, gati: 1, cycles: 2, counting: 'on' }), five = K.korvaiFrame({ tala: tin, gati: 1, cycles: 5, counting: 'on' }), seven = K.korvaiFrame({ tala: tin, gati: 1, cycles: 7, counting: 'on' });
  const has = (F, M, t, g, G) => K.chakradarSolutions(F.total, { gati: 1, limit: 1e6 }).find(s => s.M === M && s.t === t && s.g === g && s.G === G);
  const simple = has(two, 2, 3, 0, 0);
  assert.ok(simple && two.total === 33, 'simple chakradar 33 = 3 × (2 + 9)');
  assert.ok(has(five, 12, 5, 0, 0), 'farmaishi 81 = 3 × (12 + 15)');
  assert.ok(has(seven, 10, 9, 0, 1), 'kamali 113 = 3 × (10 + 27) + 2');
  const p = K.chakradarPlan(two, simple);
  assert.ok(p.ok);
  assert.equal(p.layout.cells[p.layout.landIndex].syl, 'thom', 'the last statement’s thom is on sam');
});

test('every frame of the 35 talas: solutions are exact, complete and land, cell by cell', t => {
  const { ok, done } = checker(t);
  let frames = 0, moras = 0, korvais = 0, chak = 0;
  FAMS.forEach(fam => JATIS.forEach(L => [3, 4, 5, 7, 9].forEach(gati => [1, 2].forEach(kalai => [1, 2, 3].forEach(cycles => {
    const C = E.tala(fam, L).total * kalai * gati;
    // starts and landings: sam, a pulse and a beat after, a beat before; both countings
    [[0, 0], [gati, 0], [0, gati], [-gati, 0], [0, -1], [1, 1]].forEach(([start, land]) => ['end', 'on'].forEach(counting => {
      const F = K.korvaiFrame({ fam, L, gati, kalai, cycles, start, land, counting });
      const tag = fam + L + ' g' + gati + ' k' + kalai + ' c' + cycles + ' s' + start + ' l' + land + ' ' + counting;
      if (F.error) { ok(cycles * C + land - start < 1, tag + ': ' + F.error); return; }
      frames++;
      ok(F.span === cycles * C + land - start && F.total === F.span + (counting === 'on' ? 1 : 0), tag + ' span');
      const sols = K.moraSolutions(F.total, { gati });
      // complete: exactly the solutions of 3P + 2G = total with P ≥ 1, G ≥ 0
      let brute = 0; for (let P = 1; 3 * P <= F.total; P++) if ((F.total - 3 * P) % 2 === 0) brute++;
      ok(sols.length === brute && sols.every(s => 3 * s.P + 2 * s.G === F.total && s.P >= 1 && s.G >= 0), tag + ' solutions ' + sols.length + ' vs ' + brute);
      ok(new Set(sols.map(s => s.P + ',' + s.G)).size === sols.length, tag + ' no duplicates');
      // the best few lay out exactly, in each shape
      sols.slice(0, 3).forEach(s => ['sama', 'srotovaha', 'gopuccha'].forEach(shape => {
        const m = K.moraPlan(F, { P: s.P, G: s.G, shape });
        if (m.error) { ok(shape !== 'sama' && s.P <= 1, tag + ' ' + shape + ': ' + m.error); return; }
        moras++;
        ok(m.ok && m.layout.cells.length === m.layout.landIndex + 1, tag + ' mora ' + s.eq + ' ' + shape + ': ' + JSON.stringify(m.layout.checks));
        const gaps = m.parts.filter(p => p.role === 'gap').map(p => p.syl.length);
        ok(gaps.length === (s.G ? 2 : 0) && gaps.every(x => x === s.G), tag + ' equal gaps');
      }));
      // korvais: balanced, exact, and they land
      if (gati === 4 || (gati === 3 && kalai === 1)) K.korvaiPlans(F, { limit: 4 }).forEach(p => {
        korvais++;
        ok(p.V + p.U === F.total && p.ratio >= 0.3 - 1e-9 && p.ratio <= 0.7 + 1e-9, tag + ' korvai ratio ' + p.ratioText);
        const k = K.korvaiPlan(F, p);
        ok(k.ok, tag + ' korvai ' + p.text + ': ' + (k.error || JSON.stringify(k.layout.checks)));
        p.purvangaOptions.slice(0, 3).forEach(pv => { const k2 = K.korvaiPlan(F, Object.assign({}, p, { purvanga: pv })); ok(k2.ok, tag + ' purvanga ' + pv.kind + ' ' + pv.formula); });
      });
      if (gati === 4 && kalai === 1 && start === 0) K.chakradarSolutions(F.total, { gati, limit: 3 }).forEach(s => { chak++; ok(K.chakradarPlan(F, s).ok, tag + ' chakradar ' + s.eq); });
    }));
  })))));
  t.diagnostic(frames + ' frames, ' + moras + ' moras, ' + korvais + ' korvais, ' + chak + ' chakradars laid out');
  done();
});

test('purvanga shapes: each adds up and has its shape', t => {
  const { ok, done } = checker(t);
  for (let V = 2; V <= 160; V++) {
    const shapes = K.purvangaShapes(V);
    if (V >= 9) ok(shapes.length > 0, V + ' has a purvanga');
    shapes.forEach(s => {
      const lens = s.lines.map(l => l.len), sum = s.lines.reduce((a, l) => a + l.pre + l.len + l.gap, 0);
      ok(sum === V, V + ' ' + s.kind + ' sums to ' + sum);
      const d = lens.slice(1).map((x, i) => x - lens[i]);
      if (s.kind === 'triple') ok(V % 3 === 0 && lens.every(x => x === lens[0]), V + ' triple');
      if (s.kind === 'gopuccha') ok(d.every(x => x < 0), V + ' gopuccha shrinks');
      if (s.kind === 'srotovaha') ok(d.every(x => x > 0), V + ' srotovaha grows');
      if (s.kind === 'mridanga') ok(lens[0] < Math.max(...lens) && lens[lens.length - 1] === lens[0], V + ' mridanga');
      if (s.kind === 'damaru') ok(lens[0] > Math.min(...lens) && lens[lens.length - 1] === lens[0], V + ' damaru');
      if (s.kind === '124') ok(V % 3 !== 0 && lens.every(x => x === lens[0]), V + ' 124');
    });
  }
  done();
});

test('which totals have a mora, checkMora’s fixes, and the input errors', () => {
  // 3P + 2G: every total from 5, and 3; never 1, 2 or 4
  for (let T = 1; T <= 40; T++) assert.equal(K.moraSolutions(T).length > 0, T === 3 || T >= 5, 'total ' + T);
  // the series of 6 needs an even total, from 6
  for (let T = 1; T <= 40; T++) assert.equal(K.moraSolutions(T, { n: 6 }).length > 0, T >= 6 && T % 2 === 0, 'six, total ' + T);
  const c = K.checkMora(64, 6, 2);
  assert.equal(c.ok, false); assert.equal(c.diff, 42);
  assert.ok(c.fixes.some(f => /G = 23/.test(f)) && c.fixes.some(f => /P = 20/.test(f)));
  assert.ok(K.checkMora(64, 16, 8).ok);
  for (const bad of [{ gati: 11 }, { kalai: 3 }, { cycles: 0 }, { cycles: 2.5 }, { start: 32 }, { land: -40 }, { fam: 'nope' }, { L: 6 }, { counting: 'x' }, { start: 'abc' }, { cycles: 1, start: 20, land: -20 }])
    assert.ok(K.korvaiFrame(Object.assign({ fam: 'triputa', L: 4, gati: 4 }, bad)).error, JSON.stringify(bad));
  const F = K.korvaiFrame({});
  assert.ok(F.ok && F.total === 32, 'the default is one cycle of Adi');
  assert.ok(K.moraPlan(F, { P: 5, G: 2 }).error, 'a mora that does not fill is refused');
  assert.ok(/short/.test(K.moraPlan(F, { P: 5, G: 2 }).error));
  assert.ok(K.trikaala({ n: 0 }).error && K.trikaala({ variant: 'x' }).error);
  assert.throws(() => K.moraSolutions(10, { n: 4 }));
  // deterministic
  assert.deepEqual(K.korvaiPlans(K.korvaiFrame({ fam: 'ata', L: 5, cycles: 2 })), K.korvaiPlans(K.korvaiFrame({ fam: 'ata', L: 5, cycles: 2 })));
  // thrice: from sam to sam it repeats; from sam to an eduppu it drifts
  assert.ok(K.korvaiPlan(F, K.korvaiPlans(F)[0]).thrice.ok);
  const Fe = K.korvaiFrame({ cycles: 2, land: 2 });
  assert.equal(K.korvaiPlan(Fe, K.korvaiPlans(Fe)[0]).thrice.ok, false);
});

test('the jathi judge agrees: moras, korvais and chakradars exported as JathiScript pass its correctness gate', t => {
  const { ok, done } = checker(t);
  let n = 0;
  FAMS.forEach(fam => [3, 4, 7].forEach(L => [3, 4, 5].forEach(gati => [1, 2].forEach(cycles => [[0, 0], [-gati, 0], [0, gati], [gati, -1]].forEach(([start, land]) => ['end', 'on'].forEach(counting => {
    const F = K.korvaiFrame({ fam, L, gati, cycles, start, land, counting });
    if (F.error) return;
    const tag = fam + L + ' g' + gati + ' c' + cycles + ' s' + start + ' l' + land + ' ' + counting;
    const results = [];
    K.moraSolutions(F.total, { gati }).slice(0, 2).forEach(s => results.push(K.moraPlan(F, s)));
    K.moraSolutions(F.total, { gati, n: 6 }).slice(0, 1).forEach(s => results.push(K.moraPlan(F, s)));
    K.korvaiPlans(F, { limit: 2 }).forEach(p => results.push(K.korvaiPlan(F, p)));
    K.chakradarSolutions(F.total, { gati, limit: 1 }).forEach(s => results.push(K.chakradarPlan(F, s)));
    results.forEach(R => {
      const x = K.toJathiScript(F, R);
      if (x.error) { ok(/before the first sam/.test(x.error), tag + ' ' + R.kind + ': ' + x.error); return; }
      n++;
      const J = E.judgeJathi(x.script);
      ok(J.ok && J.gatePass, tag + ' ' + R.kind + ': ' + (J.ok ? J.gate.filter(g => !g.ok).map(g => g.detail).join(' ') : J.errors.map(e => e.msg).join(' ')) + '\n' + x.script);
    });
  }))))));
  t.diagnostic(n + ' scripts judged');
  done();
});
