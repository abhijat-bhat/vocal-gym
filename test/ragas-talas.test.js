import { test } from 'node:test';
import { E, R, FAMS, JATIS, checker } from './helpers.js';

test('melakartas are computed correctly from the mela number', t => {
  const { ok, done } = checker(t);
  const expect = { 1: 'S R1 G1 M1 P D1 N1', 2: 'S R1 G1 M1 P D1 N2', 15: 'S R1 G3 M1 P D1 N3', 16: 'S R1 G3 M1 P D2 N2', 17: 'S R1 G3 M1 P D2 N3', 24: 'S R2 G2 M1 P D3 N3', 29: 'S R2 G3 M1 P D2 N3', 46: 'S R1 G2 M2 P D2 N2', 47: 'S R1 G2 M2 P D2 N3', 65: 'S R2 G3 M2 P D2 N3', 67: 'S R3 G3 M2 P D1 N1', 72: 'S R3 G3 M2 P D3 N3' };
  for (const n in expect) ok(E.melaLabels(+n).join(' ') === expect[n], 'mela ' + n + ': ' + E.melaLabels(+n).join(' '));
  R.melakartas.forEach(m => { for (let i = 1; i < m.aro.length; i++) ok(m.aro[i] > m.aro[i - 1], 'arohana order ' + m.name); });
  ok(new Set(R.melakartas.map(m => m.aro.join(','))).size === 72, '72 distinct scales');
  ok(E.MELA_NAMES[58] === 'Dharmavati' && E.MELA_NAMES[64] === 'Mechakalyani', 'names 59 and 65');
  ok(R.melakartas.every(m => m.cls === 'sampurna–sampurna'), 'every melakarta is sampurna both ways');
  ok(R.janyas.length === 28, '28 janyas encoded');
  const CLS = { mohanam: 'audava–audava', hamsadhwani: 'audava–audava', hindolam: 'audava–audava', madhyamavati: 'audava–audava', abhogi: 'audava–audava', shuddhasaveri: 'audava–audava',
    malahari: 'audava–shadava', bilahari: 'audava–sampurna', arabhi: 'audava–sampurna', saveri: 'audava–sampurna', kedaragowla: 'audava–sampurna', abheri: 'audava–sampurna',
    sriranjani: 'shadava–shadava', kambhoji: 'shadava–sampurna',
    begada: 'shadava–sampurna', sahana: 'sampurna–sampurna', sri: 'audava–sampurna', darbar: 'shadava–sampurna', nayaki: 'audava–sampurna', kanada: 'shadava–shadava', anandabhairavi: 'shadava–sampurna', bhairavi: 'sampurna–sampurna', mukhari: 'shadava–sampurna', kapi: 'audava–sampurna', huseni: 'sampurna–sampurna', devagandhari: 'audava–sampurna', dhanyasi: 'audava–sampurna', sama: 'audava–shadava' };
  R.janyas.forEach(j => ok(CLS[j.id] === j.cls, 'class of ' + j.name + ': ' + j.cls));
  const PARENT = { mohanam: 28, hamsadhwani: 29, hindolam: 20, madhyamavati: 22, abhogi: 22, shuddhasaveri: 29, malahari: 15, saveri: 15, bilahari: 29, arabhi: 29, kedaragowla: 28, abheri: 22, sriranjani: 22, kambhoji: 28, begada: 28, sahana: 28, sri: 22, darbar: 22, nayaki: 22, kanada: 22, anandabhairavi: 20, bhairavi: 20, mukhari: 20, kapi: 22, huseni: 22, devagandhari: 29, dhanyasi: 8, sama: 28 };
  R.janyas.forEach(j => ok(PARENT[j.id] === j.parent, 'parent of ' + j.name));
  // a bhashanga raga takes a swara from outside its parent, by definition
  const BHASHANGA = new Set(['anandabhairavi', 'bhairavi', 'mukhari', 'kapi', 'huseni']);
  R.janyas.forEach(j => { const parent = E.melakarta(j.parent), pcs = new Set(parent.aro.map(E.mod12)), upanga = j.aro.concat(j.avaro).every(p => pcs.has(E.mod12(p))); ok(upanga !== BHASHANGA.has(j.id), j.name + (BHASHANGA.has(j.id) ? ' has a swara from outside its parent' : ' uses only its parent\'s swaras')); });
  done();
});

test('the 35 suladi talas, chapu talas and tala specs', t => {
  const { ok, done } = checker(t);
  const totals = { dhruva: L => 3 * L + 2, matya: L => 2 * L + 2, rupaka: L => L + 2, jhampa: L => L + 3, triputa: L => L + 4, ata: L => 2 * L + 4, eka: L => L };
  let n = 0;
  FAMS.forEach(f => JATIS.forEach(L => { n++; ok(E.tala(f, L).total === totals[f](L), 'total ' + f + L); }));
  ok(n === 35, '35 talas');
  ok(E.tala('dhruva', 9).total === 29 && E.tala('eka', 3).total === 3, 'range 3 to 29 aksharas');
  ok(E.tala('triputa', 4).name.includes('Adi'), 'Adi');
  ok(E.tala('chapu', 7).angas.map(a => a.len).join('+') === '3+2+2' && E.tala('chapu', 5).total === 5 && E.tala('chapu', 3).total === 3, 'chapu talas');
  [['adi', 8], ['rupaka', 6], ['khanda jati ata', 14], ['tisra triputa', 7], ['misra chapu', 7], ['custom 3+2+2', 7], ['sankeerna dhruva', 29], ['jhampa', 10]]
    .forEach(([s, tot]) => { const r = E.parseTalaSpec(s); ok(r.tl && r.tl.total === tot, 'parseTalaSpec ' + s); });
  ok(!!E.parseTalaSpec('dhruvva').error, 'unknown family is an error');
  const throws = f => { try { f(); return false; } catch (e) { return true; } };
  ok(throws(() => E.tala('chapu', 9)) && throws(() => E.tala('dhruva', 6)) && throws(() => E.tala('nosuch', 4)), 'tala() rejects invalid arguments');
  ok(!!E.parseTalaSpec('sankeerna chapu').error, 'unsupported chapu is an error');
  FAMS.forEach(f => JATIS.forEach(L => { const tl = E.tala(f, L); ok(E.parseTalaSpec(E.talaSpec(tl)).tl.total === tl.total, 'talaSpec round trip ' + f + L); }));
  done();
});
