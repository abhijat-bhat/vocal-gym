import { test } from 'node:test';
import { E, FAMS, JATIS, checker } from './helpers.js';

test('generated jathis satisfy the equation, the yati shape and the teermanam, and pass the judge', t => {
  const { ok, done } = checker(t);
  let generated = 0, refused = 0, judged = 0; const scores = [];
  const talas = []; FAMS.forEach(f => JATIS.forEach(L => talas.push(E.tala(f, L)))); [3, 5, 7].forEach(L => talas.push(E.tala('chapu', L)));
  talas.forEach((tl, ti) => [3, 4, 5].forEach(g => [1, 2].forEach(N => [-2, 0, 2].forEach(off => ['auto', 'none', 'gopuccha', 'srotovaha', 'mridanga', 'damaru', 'sama'].forEach((y, yi) => [0, 1, 2].forEach(T => {
    const r = E.jathi({ tl, nadai: g, avartanams: N, offset: off, yatiPref: y, T, seed: 11 + ti });
    if (r.error) { refused++; return; }
    generated++;
    ok(r.audit.ok && r.used === r.slots, 'syllables sum to the slots');
    ok(r.slots === N * tl.total * g - off + 1, 'slots = N x A x g - e + 1');
    const yat = r.segs.filter(s => s.role === 'yati').map(s => s.syl.length);
    if (y === 'gopuccha') ok(yat.length >= 3 && yat.every((v, i) => i === 0 || v < yat[i - 1]), 'gopuccha shape');
    if (y === 'srotovaha') ok(yat.length >= 3 && yat.every((v, i) => i === 0 || v > yat[i - 1]), 'srotovaha shape');
    if (y === 'sama') ok(yat.length >= 3 && yat.every(v => v === yat[0]), 'sama shape');
    if (y === 'mridanga') { const pk = yat.indexOf(Math.max.apply(null, yat)); ok(pk > 0 && pk < yat.length - 1 && yat[0] < yat[pk] && yat[yat.length - 1] < yat[pk], 'mridanga shape'); }
    if (y === 'damaru') { const vl = yat.indexOf(Math.min.apply(null, yat)); ok(vl > 0 && vl < yat.length - 1 && yat[0] > yat[vl] && yat[yat.length - 1] > yat[vl], 'damaru shape'); }
    const te = r.segs.filter(s => s.role === 'teermanam');
    ok(te.length === 3 && te.every(s => s.syl.join() === te[0].syl.join()), 'teermanam x3');
    if ((ti + yi + g + T) % 5 === 0) {
      const J = E.judgeJathi(r.script);
      judged++;
      ok(J.ok, 'exported script parses');
      if (J.ok) { scores.push(J.total); ok(J.gatePass, 'exported jathi passes the gate: ' + tl.name); }
    }
  }))))));
  scores.sort((a, b) => a - b);
  t.diagnostic(generated + ' jathis, ' + refused + ' spans refused as too short, ' + judged + ' judged; scores ' + scores[0] + ' to ' + scores[scores.length - 1] + ', median ' + scores[scores.length >> 1]);
  done();
});
