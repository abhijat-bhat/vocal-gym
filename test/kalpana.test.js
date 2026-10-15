import { test } from 'node:test';
import { E, ALL, checker } from './helpers.js';

test('kalpana rounds land exactly, obey the raga, and grow more unconventional with temperature', t => {
  const { ok, done } = checker(t);
  let rounds = 0, moras = 0; const nov = {};
  ALL.forEach((r, ri) => [2, 4, 8, 16].forEach(K => [1, 2].forEach(pa => [0, 1, 2].forEach(T => ['auto', 'mora', 'free'].forEach(ending => {
    const pcs = Array.from(new Set(r.aro.concat(r.avaro).map(E.mod12)));
    const target = pcs.includes(7) ? 7 : 12;
    const res = E.kalpana(r, { aksharas: K, perAkshara: pa, startPitch: 0, targetPitch: target, T, seed: ri * 13 + K * 7 + pa, ending });
    if (!res) { ok(K * pa < 3, 'no round found for ' + r.name + ' ' + K + 'x' + pa); return; }
    rounds++;
    ok(res.notes.reduce((s, n) => s + n.dur, 0) === K * pa, 'exact length');
    ok(res.notes[0].p === 0, 'starts on the requested swara');
    ok(res.notes[res.notes.length - 1].p === target, 'ends on the landing swara, right before the eduppu');
    ok(res.notes.every(n => n.p >= -5 && n.p <= 19), 'stays between mandra Pa and tara Pa');
    const P = E.makeProjector(r);
    for (let i = 1; i < res.notes.length; i++) ok(P.valid(res.notes[i - 1].p, res.notes[i].p), 'direction rule in ' + r.name);
    if (ending === 'free') ok(res.ending.type === 'free', 'free ending honoured');
    if (res.ending.type === 'mora') {
      moras++;
      const mu = res.units.filter(u => u.kind === 'mora');
      const key = u => u.notes.map(n => n.p).join(',');
      ok(mu.length === 3 && key(mu[0]) === key(mu[1]) && key(mu[1]) === key(mu[2]), 'three identical mora statements');
      ok(mu[0].notes.length >= 3, 'mora phrase of three or more swaras');
      const gap = u => u.notes[u.notes.length - 1].dur - 1;
      ok(gap(mu[0]) === gap(mu[1]) && gap(mu[2]) === 0, 'equal mora gaps; the last statement lands');
    }
    if (K * pa >= 8) (nov[T] = nov[T] || []).push(res.stats.novelShare);
  })))));
  const mean = T => nov[T].reduce((a, b) => a + b, 0) / nov[T].length;
  t.diagnostic(rounds + ' rounds, ' + moras + ' with a mora; unconventional share T0 ' + mean(0).toFixed(3) + ', T1 ' + mean(1).toFixed(3) + ', T2 ' + mean(2).toFixed(3));
  ok(mean(0) < mean(1) && mean(1) < mean(2), 'novelty rises with temperature');
  ok(mean(0) < 0.05, 'T = 0 is almost entirely conventional devices');
  done();
});

const byId = id => ALL.find(r => r.id === id);
const swaraPcs = r => Array.from(new Set(r.aro.concat(r.avaro).map(E.mod12))).sort((a, b) => a - b);

test('eduppu neighbours: the arohana swara below and the avarohana swara above (plan 4.2)', t => {
  const { ok, done } = checker(t);
  const table = [
    ['mela65', 0, -1, 2], ['mela65', 7, 6, 9],     // Kalyani S: N. and R; P: M2 and D
    ['mohanam', 7, 4, 9], ['mohanam', 0, -3, 2],   // Mohanam P: G and D; S: D. and R
    ['saveri', 5, 1, 7], ['saveri', 4, null, 5],   // Saveri M: R and P; G: only M (descent)
    ['hamsadhwani', 0, -1, 2]                      // Hamsadhwani S: N. and R
  ];
  table.forEach(([id, e, lo, hi]) => {
    const nb = E.eduppuNeighbours(byId(id), e);
    ok(nb.lo === lo && nb.hi === hi, id + ' eduppu ' + e + ': expected ' + lo + '/' + hi + ', got ' + nb.lo + '/' + nb.hi);
  });
  ok(E.eduppuNeighbours(byId('mela65'), 1).code === 'eduppu-not-in-raga', 'R1 is not a swara of Kalyani');
  done();
});

test('rounds land next to the eduppu swara, never on it (plan 4.3)', t => {
  const { ok, done } = checker(t);
  let rounds = 0, below = 0, above = 0, onE = 0, illegal = 0, missing = 0, moras = 0;
  ALL.forEach((r, ri) => {
    const P = E.makeProjector(r), eds = swaraPcs(r).concat([12]);
    eds.forEach(e => [0, 1, 2].forEach(k => {
      const seed = 1 + ri * 31 + e * 7 + k, T = k, ending = ['auto', 'mora', 'free'][k];
      const res = E.kalpanaRound(r, { aksharas: 8, perAkshara: 2, startPitch: 0, eduppuPitch: e, T, seed, ending });
      if (res.error) { missing++; ok(false, r.name + ' eduppu ' + e + ': ' + res.error); return; }
      rounds++;
      const nb = E.eduppuNeighbours(r, e), fin = res.notes[res.notes.length - 1].p;
      ok(fin === nb.lo || fin === nb.hi, r.name + ' eduppu ' + e + ': ends on ' + fin + ', not ' + nb.lo + '/' + nb.hi);
      ok(fin === res.ending.final && res.ending.eduppu === e, 'ending records the eduppu and the final swara');
      ok(res.ending.approach === (fin === nb.lo ? 'below' : 'above'), 'approach matches the side');
      if (!P.valid(fin, e)) illegal++;
      ok(P.valid(fin, e), r.name + ': the step into the eduppu is legal');
      if (fin === e) onE++;
      ok(fin !== e, 'never ends on the eduppu itself');
      ok(res.notes.reduce((s, n) => s + n.dur, 0) === 16, 'exact length');
      ok(res.notes.every(n => n.p >= -5 && n.p <= 19), 'in range');
      for (let i = 1; i < res.notes.length; i++) ok(P.valid(res.notes[i - 1].p, res.notes[i].p), 'direction rule in ' + r.name);
      if (res.ending.type === 'mora') moras++;
      if (fin === nb.lo) below++; else above++;
    }));
  });
  t.diagnostic('acceptance 4.3: ' + rounds + ' rounds over 86 ragas (every swara as eduppu, plus tara S, 3 seeds); ' + moras + ' with a mora; ' +
    'final swara a neighbour of the eduppu in ' + rounds + '/' + rounds + ' (' + below + ' from below, ' + above + ' from above); ' +
    'illegal step into the eduppu ' + illegal + '; ended on the eduppu ' + onE + '; no round found ' + missing);
  done();
});

test('eduppu API: structured errors, null for old callers, eduppuPitch wins over targetPitch', t => {
  const { ok, done } = checker(t);
  const r = byId('mela65'), base = { aksharas: 8, perAkshara: 2, startPitch: 0, T: 1, seed: 4 };
  const err = o => E.kalpanaRound(r, Object.assign({}, base, o));
  ok(err({ eduppuPitch: 1 }).code === 'eduppu-not-in-raga', 'not a swara of the raga');
  ok(err({ eduppuPitch: 24 }).code === 'eduppu-out-of-range', 'out of range');
  ok(err({ aksharas: 1, perAkshara: 1, eduppuPitch: 19 }).code === 'unreachable', 'no neighbour reachable in the span');
  ok(typeof err({ eduppuPitch: 1 }).error === 'string', 'errors carry a message');
  ok(E.kalpana(r, Object.assign({}, base, { eduppuPitch: 1 })) === null, 'kalpana() still returns null');
  const both = E.kalpana(r, Object.assign({}, base, { eduppuPitch: 7, targetPitch: 7 }));
  ok(both && [6, 9].includes(both.notes[both.notes.length - 1].p), 'eduppuPitch wins over targetPitch');
  const old = E.kalpana(r, Object.assign({}, base, { targetPitch: 7 }));
  ok(old && old.notes[old.notes.length - 1].p === 7 && old.ending.approach === undefined, 'targetPitch keeps its v0.2 meaning');
  const a = E.kalpana(r, Object.assign({}, base, { eduppuPitch: 0 })), b = E.kalpana(r, Object.assign({}, base, { eduppuPitch: 0 }));
  ok(JSON.stringify(a) === JSON.stringify(b), 'same seed, same round');
  done();
});

test('reasoned jumps: few unlicensed leaps at low temperature, no forbidden ones below T 1.5 (plan 3.4)', t => {
  const { ok, done } = checker(t);
  const acc = {};
  [0, 1, 2].forEach(T => {
    const a = acc[T] = { rounds: 0, perEight: 0, leaps: 0, unresolved: 0, tritone: 0, wide: 0, double: 0, alpa: 0 };
    ALL.forEach((r, ri) => {
      const e = r.aro.map(E.mod12).includes(7) ? 7 : 12, P = E.makeProjector(r);
      for (let s = 1; s <= 10; s++) {
        const K = s % 2 ? 8 : 16;
        const res = E.kalpanaRound(r, { aksharas: K, perAkshara: 2, startPitch: 0, eduppuPitch: e, T, seed: s + ri * 101 });
        if (res.error) { ok(false, r.name + ': ' + res.error); continue; }
        const L = res.stats.leaps;
        a.rounds++; a.perEight += L.perEight; a.leaps += L.total; a.unresolved += L.unresolved;
        Object.keys(L.outsidePhrases).forEach(k => { a[k] += L.outsidePhrases[k]; });
        ok(L.total === L.licensed + L.unlicensed && L.list.length === L.total, 'leap counts add up');
        ok(res.notes.reduce((x, n) => x + n.dur, 0) === K * 2, 'exact length');
        for (let i = 1; i < res.notes.length; i++) ok(P.valid(res.notes[i - 1].p, res.notes[i].p), 'direction rule');
      }
    });
    a.perEight /= a.rounds;
  });
  const row = T => { const a = acc[T]; return 'T ' + T + ': unlicensed per 8 slots ' + a.perEight.toFixed(3) + ', unresolved ' + (100 * a.unresolved / Math.max(1, a.leaps)).toFixed(1) + '% of ' + a.leaps + ' leaps, tritone ' + a.tritone + ', wider than an octave ' + a.wide + ', same-direction double ' + a.double + ', onto alpa ' + a.alpa; };
  [0, 1, 2].forEach(T => t.diagnostic('acceptance 3.4 ' + row(T) + ' (' + acc[T].rounds + ' rounds)'));
  ok(acc[0].perEight <= 0.25, row(0)); ok(acc[1].perEight <= 1.0, row(1)); ok(acc[2].perEight <= 3.0, row(2));
  ok(acc[0].unresolved / acc[0].leaps <= 0.10, 'unresolved leaps at T 0: ' + row(0));
  [0, 1].forEach(T => ok(acc[T].tritone === 0 && acc[T].wide === 0 && acc[T].double === 0 && acc[T].alpa === 0, 'no forbidden leaps: ' + row(T)));
  ok(acc[0].leaps / acc[0].rounds < acc[2].leaps / acc[2].rounds, 'more leaps at higher temperature');
  done();
});

test('leap filters relax one level instead of failing where unfiltered generation succeeds', t => {
  const { ok, done } = checker(t);
  let spans = 0, relaxed = 0;
  ALL.forEach(r => {
    const pcs = swaraPcs(r).concat([12]);
    [1, 2, 3, 4].forEach(K => pcs.forEach(tp => {
      const o = { aksharas: K, perAkshara: 1, startPitch: 0, targetPitch: tp, seed: 1 };
      const strict = E.kalpanaRound(r, Object.assign({ T: 0 }, o)), free = E.kalpanaRound(r, Object.assign({ T: 2 }, o));
      spans++;
      ok(!!strict.error === !!free.error, r.name + ' ' + K + ' aksharas to ' + tp + ': T 0 fails only where T 2 fails');
      if (!strict.error && strict.stats.relaxed) { relaxed++; ok(strict.stats.relaxed === 'leaps', 'relaxation is flagged'); }
    }));
  });
  const r = byId('mela1'), res = E.kalpana(r, { aksharas: 3, perAkshara: 1, startPitch: 0, targetPitch: 9, T: 0, seed: 1 });
  ok(res && res.stats.relaxed === 'leaps', 'Kanakangi S to D in 3 slots needs the relaxation');
  t.diagnostic(spans + ' short spans; ' + relaxed + ' needed the leap filter relaxed; none failed that unfiltered generation could fill');
  done();
});
