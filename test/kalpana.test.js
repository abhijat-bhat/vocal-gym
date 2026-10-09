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
