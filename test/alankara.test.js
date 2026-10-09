import { test } from 'node:test';
import { E, R, ALL, FAMS, JATIS, checker, render, stripBars } from './helpers.js';

const mmg = R.melakartas[14];
// rows per direction as printed on the sheet
const ROWS = {
  dhruva: { 4: 5, 3: 5, 7: 2, 5: 4, 9: 2 }, matya: { 4: 5, 3: 6, 7: 2, 5: 4, 9: 3 }, rupaka: { 4: 5, 3: 6, 7: 5, 5: 4, 9: 4 },
  jhampa: { 4: 5, 3: 6, 7: 5, 5: 5, 9: 4 }, triputa: { 4: 5, 3: 5, 7: 4, 5: 4, 9: 4 }, ata: { 4: 4, 3: 5, 7: 3, 5: 5, 9: 2 }, eka: { 4: 5, 3: 6, 7: 2, 5: 4, 9: 2 }
};

test('all 35 sheet alankaras are reproduced note for note in Mayamalavagowla', t => {
  const { ok, done } = checker(t);
  let count = 0;
  FAMS.forEach(f => JATIS.forEach(L => {
    const tl = E.tala(f, L), e = E.pdfEntry(f, L), parsed = E.parseSwaraLine(e.asc), m = parsed.notes;
    count++;
    ok(parsed.total === tl.total, 'length ' + e.ref);
    let c = 0; const inner = []; tl.angas.forEach((a, i) => { c += a.len; if (i < tl.angas.length - 1) inner.push(c); });
    ok(inner.every(b => parsed.bars.includes(b)), 'bars on anga lines ' + e.ref);
    let tt = 0; m.forEach(x => { ok(!inner.some(b => tt < b && b < tt + x.dur), 'karvai crosses an anga ' + e.ref); tt += x.dur; });
    ok(m[0].d === 0, 'starts on Sa ' + e.ref);
    const a = E.alankara(mmg, tl, m);
    const up = a.lines.filter(l => l.dir === 'asc'), dn = a.lines.filter(l => l.dir === 'desc');
    ok(render(mmg, up[0]) === stripBars(e.asc), 'ascending ' + e.ref + ': ' + render(mmg, up[0]));
    ok(render(mmg, dn[0]) === stripBars(e.desc), 'descending ' + e.ref + ': ' + render(mmg, dn[0]));
    ok(up.length === ROWS[f][L] && dn.length === ROWS[f][L], 'row count ' + e.ref);
    ok(render(mmg, up[up.length - 1]).split(' ').includes("S'"), 'last ascending line reaches tara Sa ' + e.ref);
    ok(E.motifKey(E.alankaraSeries(f, L, 0)[0].motif) === E.motifKey(m), 'variation 0 is the sheet line ' + e.ref);
  }));
  ok(count === 35, '35 entries');
  const DH = ['S R G M G R S R G R S R G M', 'R G M P M G R G M G R G M P', 'G M P D P M G M P M G M P D', 'M P D N D P M P D P M P D N', "P D N S' N D P D N D P D N S'",
    "S' N D P D N S' N D N S' N D P", 'N D P M P D N D P D N D P M', 'D P M G M P D P M P D P M G', 'P M G R G M P M G M P M G R', 'M G R S R G M G R G M G R S'];
  const dh = E.alankara(mmg, E.tala('dhruva', 4), E.pdfMotif('dhruva', 4));
  ok(dh.lines.length === 10, 'Dhruva 1.1 has 10 lines');
  dh.lines.forEach((l, i) => ok(render(mmg, l) === DH[i], 'Dhruva 1.1 line ' + (i + 1)));
  done();
});

test('every alankara step obeys the direction rules in 86 ragas x 35 talas', t => {
  const { ok, done } = checker(t);
  let adjusted = 0, lines = 0, notes = 0;
  ALL.forEach(r => FAMS.forEach(f => JATIS.forEach(L => {
    const a = E.alankara(r, E.tala(f, L), E.pdfMotif(f, L));
    ok(a.infeasible === 0, 'infeasible ' + r.name + ' ' + f + L);
    const P = E.makeProjector(r);
    a.lines.forEach(l => { lines++; notes += l.notes.length; for (let i = 1; i < l.notes.length; i++) ok(P.valid(l.notes[i - 1].p, l.notes[i].p), 'invalid step ' + r.name + ' ' + f + L); });
    adjusted += a.adjustedCount;
    if (r.kind === 'melakarta') ok(a.adjustedCount === 0, 'melakartas need no adjustment');
  })));
  t.diagnostic(lines + ' lines, ' + notes + ' notes, ' + adjusted + ' adjusted (' + (100 * adjusted / notes).toFixed(2) + '%)');
  done();
});

test('new patterns are legal and never repeat the sheet or an earlier variation', t => {
  const { ok, done } = checker(t);
  let generated = 0, exhausted = 0; const conv = {};
  FAMS.forEach(f => JATIS.forEach(L => [0, 1, 2].forEach(T => [1, 2].forEach(seed => {
    const tl = E.tala(f, L), ser = E.alankaraSeries(f, L, 6, { T, seed });
    if (ser.length < 7) exhausted++;
    const starts = E.angaStarts(tl), top = E.motifSpan(ser[0].motif) - 1;
    ser.slice(1).forEach((s, k) => {
      generated++; const m = s.motif;
      ok(m.reduce((a, x) => a + x.dur, 0) === tl.total, 'length');
      ok(m[0].d === 0 && m[m.length - 1].d === top, 'starts on Sa and ends on the top degree');
      ok(m.every(x => x.d >= 0 && x.d <= top && (x.dur === 1 || x.dur === 2)), 'degree range and durations');
      let tt = 0; m.forEach(x => { ok(!(x.dur === 2 && starts.has(tt + 1) && tt + 1 < tl.total), 'karvai crosses an anga'); tt += x.dur; });
      tt = m[0].dur; for (let i = 1; i < m.length; i++) { const d = m[i].d - m[i - 1].d; ok(Math.abs(d) <= 3 || (starts.has(tt) && m[i].d === 0), 'step too wide'); tt += m[i].dur; }
      ok(!ser.slice(0, k + 1).map(x => E.motifKey(x.motif)).includes(E.motifKey(m)), 'repeats an earlier pattern ' + f + L);
      ok(s.diff >= 1, 'differs from every earlier pattern');
      const a = E.alankara(mmg, tl, m), P = E.makeProjector(mmg);
      a.lines.forEach(l => { for (let i = 1; i < l.notes.length; i++) ok(P.valid(l.notes[i - 1].p, l.notes[i].p), 'direction rule in a new pattern'); });
      (conv[T] = conv[T] || []).push(E.motifReport(m, tl).conventionality);
    });
  }))));
  FAMS.forEach(f => JATIS.forEach(L => { const r = E.newMotif(E.tala(f, L), { T: 1, seed: 3 }); ok(E.motifSpan(r.motif) === E.motifSpan(E.pdfMotif(f, L)), 'newMotif defaults to the sheet span ' + f + L); }));
  const ekaAll = E.enumerateMotifs(E.tala('eka', 3), 3, 1000);
  ok(ekaAll.complete && ekaAll.motifs.length === 5, 'Tisra Eka has exactly five legal span-3 patterns');
  [0, 1, 2].forEach(T => { for (let seed = 1; seed <= 30; seed++) ok(E.alankaraSeries('eka', 3, 6, { T, seed }).length === 5, 'every Tisra Eka alternative is found (T ' + T + ', seed ' + seed + ')'); });
  ok(E.newMotif(E.tala('eka', 3), { span: 3, avoid: ekaAll.motifs }) === null, 'null only when every pattern has been shown');
  const mean = T => conv[T].reduce((a, b) => a + b, 0) / conv[T].length;
  t.diagnostic(generated + ' new patterns; ' + exhausted + ' series ran out of distinct patterns (Tisra Eka); mean conventionality T0 ' + mean(0).toFixed(3) + ', T1 ' + mean(1).toFixed(3) + ', T2 ' + mean(2).toFixed(3));
  ok(mean(0) > mean(1) && mean(1) >= mean(2), 'conventionality falls as temperature rises');
  done();
});
