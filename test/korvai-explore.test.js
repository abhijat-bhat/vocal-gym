/* v0.8.2 the explorer: every variation of a form under the learner's constraints, ordered by the
   creativity dial, spread so neighbours differ, filtered by facets, surprised from a seed; every one laid
   out and landing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { E, FAMS, JATIS, checker } from './helpers.js';

const K = E.korvai;
const FORMS = [['mora', { n: 'any', shape: 'any' }], ['korvai', { shape: 'any' }], ['statements', {}], ['progressive', {}], ['chakradar', { cmode: 'any' }]];
const mean = xs => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);

test('the spaces: complete, faceted, deterministic, and every variation lands', t => {
  const { ok, done } = checker(t);
  [K.korvaiFrame({ cycles: 2 }), K.korvaiFrame({ fam: 'ata', L: 5, cycles: 2, land: 2 }), K.korvaiFrame({ fam: 'chapu', L: 7, gati: 4, cycles: 2, counting: 'on' })].forEach((F, fi) => FORMS.forEach(([form, o]) => {
    const sp = K.exploreSpace(F, form, o), tag = 'frame ' + fi + ' ' + form;
    ok(sp.count > 1, tag + ': ' + sp.count + ' variations');
    ok(JSON.stringify(K.exploreSpace(F, form, o).items.map(x => x.label)) === JSON.stringify(sp.items.map(x => x.label)), tag + ' deterministic');
    Object.keys(sp.facets).forEach(f => ok(sp.facets[f].reduce((a, x) => a + x.count, 0) === sp.count, tag + ' facet ' + f + ' counts add up'));
    ok(sp.items.every(x => x.Fn >= 0 && x.Fn <= 1 && x.Nn >= 0 && x.Nn <= 1), tag + ' scores normalised');
    const order = K.exploreOrder(sp, { T: 0.6 });
    ok(order.length === sp.count && new Set(order).size === sp.count, tag + ' the order is a permutation');
    // every variation of the smaller spaces, and a spread of the large ones, lands
    const step = Math.max(1, Math.floor(sp.count / 150));
    for (let p = 0; p < order.length; p += step) {
      const R = K.exploreRealize(F, sp.items[order[p]]);
      ok(R && !R.error && R.ok && R.layout.checks.every(c => c.ok), tag + ' #' + p + ' ' + sp.items[order[p]].label + ': ' + (R && (R.error || JSON.stringify(R.layout && R.layout.checks))));
    }
  }));
  done();
});

test('the creativity dial, the diversity pass, filters and surprise', t => {
  const { ok, done } = checker(t);
  const F = K.korvaiFrame({ cycles: 2 }), sp = K.exploreSpace(F, 'korvai', { shape: 'any' });
  const head = (T, k) => K.exploreOrder(sp, { T }).slice(0, 30).map(i => sp.items[i][k]);
  ok(mean(head(0, 'Fn')) > mean(sp.items.map(x => x.Fn)), 'T 0 leads with the familiar');
  ok(mean(head(2, 'Nn')) > mean(sp.items.map(x => x.Nn)) && mean(head(2, 'Nn')) > mean(head(0, 'Nn')), 'T 2 leads with the unusual');
  // neighbours differ: in the leading variations each differs from the one before in some facet
  const o = K.exploreOrder(sp, { T: 0.6 }), keys = Object.keys(sp.items[0].facets);
  for (let p = 1; p < 60; p++) ok(keys.some(k => sp.items[o[p]].facets[k] !== sp.items[o[p - 1]].facets[k]), 'neighbours ' + p + ' differ');
  ok(new Set(o.slice(0, 12).map(i => sp.items[i].facets.purvanga)).size >= 3, 'the first dozen span several purvanga kinds');
  // the sorts
  const fam = K.exploreOrder(sp, { sort: 'familiar' }), nov = K.exploreOrder(sp, { sort: 'novel' });
  ok(fam.every((k, i) => i === 0 || sp.items[fam[i - 1]].Fn >= sp.items[k].Fn), 'most familiar first');
  ok(nov.every((k, i) => i === 0 || sp.items[nov[i - 1]].Nn >= sp.items[k].Nn), 'most unusual first');
  const sh = K.exploreOrder(sp, { sort: 'short' });
  ok(sh.every((k, i) => i === 0 || sp.items[sh[i - 1]].spec.V <= sp.items[k].spec.V), 'shortest purvanga first');
  // filters
  ['purvanga', 'mora', 'texture', 'balance'].forEach(f => sp.facets[f].forEach(v => {
    const fo = K.exploreOrder(sp, { filters: { [f]: v.value } });
    ok(fo.length === v.count && fo.every(i => sp.items[i].facets[f] === v.value), 'filter ' + f + ' = ' + v.value);
  }));
  ['geometric progression', 'kuraippu', 'Fibonacci-like', 'squares', 'gopuccha yati (a falling AP)', 'damaru yati', 'mridanga yati'].forEach(k => ok(sp.facets.purvanga.some(x => x.value === k), 'the purvangas include ' + k));
  // surprise: deterministic for a seed, different across seeds, and it avoids what was seen
  const s1 = K.exploreSurprise(sp, o, { T: 1, seed: 5 }), s2 = K.exploreSurprise(sp, o, { T: 1, seed: 5 });
  ok(s1 === s2 && s1 >= 0, 'surprise is deterministic');
  ok(new Set([1, 2, 3, 4, 5, 6, 7, 8].map(seed => K.exploreSurprise(sp, o, { T: 1.4, seed }))).size >= 5, 'different seeds, different surprises');
  const avoid = o.slice(0, 50); ok(!avoid.includes(o[K.exploreSurprise(sp, o, { T: 0, seed: 2, avoid })]), 'surprise avoids the seen');
  // the second texture changes the syllables, never the arithmetic, and still passes the judge
  const std = sp.items.find(x => x.spec.texture === 'standard' && x.spec.shape === 'sama' && x.spec.purvanga.kind === 'triple');
  const alt = sp.items.find(x => x.spec.texture === 'takadhom' && x.spec.V === std.spec.V && x.spec.purvanga === std.spec.purvanga && x.spec.uttaranga === std.spec.uttaranga && x.spec.shape === 'sama');
  const A = K.exploreRealize(F, std), B = K.exploreRealize(F, alt);
  ok(A.ok && B.ok && A.layout.cells.length === B.layout.cells.length && A.layout.sylls.join() !== B.layout.sylls.join(), 'takadhom re-syllabifies the same korvai');
  ok(A.layout.cells.every((c, i) => c.role === B.layout.cells[i].role), 'every part keeps its place: the gaps and phrases stay where they were');
  const J = E.judgeJathi(K.toJathiScript(F, B).script); ok(J.ok && J.gatePass, 'the takadhom korvai passes the judge');
  done();
});

test('every form explores in every frame of the 35 talas, and what it offers lands', t => {
  const { ok, done } = checker(t);
  let n = 0;
  FAMS.forEach(fam => JATIS.forEach(L => [1, 2].forEach(cycles => {
    const F = K.korvaiFrame({ fam, L, gati: 4, cycles });
    FORMS.forEach(([form, o]) => {
      const sp = K.exploreSpace(F, form, o);
      if (!sp.count) return;
      const order = K.exploreOrder(sp, { T: 0.8 }), picks = order.slice(0, 4);
      [3, 9].forEach(seed => picks.push(order[K.exploreSurprise(sp, order, { T: 1.2, seed })]));
      picks.forEach(k => { const R = K.exploreRealize(F, sp.items[k]); n++; ok(R && !R.error && R.ok, fam + L + ' c' + cycles + ' ' + form + ' ' + sp.items[k].label + ': ' + (R && R.error)); });
    });
  })));
  t.diagnostic(n + ' explored variations laid out');
  done();
});

test('facet counts follow the other filters, as shop filters do', t => {
  const { ok, done } = checker(t);
  const F = K.korvaiFrame({ cycles: 2 }), sp = K.exploreSpace(F, 'korvai', { shape: 'any' });
  const keys = Object.keys(sp.facets);
  // with no filters they are the plain counts
  const c0 = K.exploreFacetCounts(sp, {});
  keys.forEach(f => ok(c0[f].every(x => x.count === sp.facets[f].find(y => y.value === x.value).count), f + ' unfiltered'));
  // with filters: each value's count is the size of the list if it were chosen too
  const filters = { purvanga: 'phrase (gap) × 3', mora: 'equal mora' }, cf = K.exploreFacetCounts(sp, filters);
  keys.forEach(f => cf[f].forEach(x => {
    const want = K.exploreOrder(sp, { filters: Object.assign({}, filters, { [f]: x.value }) }).length;
    ok(x.count === want, f + ' = ' + x.value + ': ' + x.count + ' vs ' + want);
  }));
  // a facet's own values sum to what the other filters leave
  const others = K.exploreOrder(sp, { filters: { mora: 'equal mora' } }).length;
  ok(cf.purvanga.reduce((s, x) => s + x.count, 0) === others, 'the purvanga values add up to what the mora filter leaves');
  done();
});
