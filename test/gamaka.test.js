import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { E, ALL, checker } from './helpers.js';
import { validateProfiles, validateGamaka, resolveTarget } from '../scripts/check-raga-profiles.js';

const DOC = JSON.parse(readFileSync(new URL('../data/raga-profiles.json', import.meta.url), 'utf8'));
const byId = id => ALL.find(r => r.id === id);
const clone = x => JSON.parse(JSON.stringify(x));

test('gamakaRender: the transcriptions validate, compile, and bad inputs are rejected (plan test 16)', t => {
  const { ok, done } = checker(t);
  const withRules = Object.keys(DOC.ragas).filter(id => DOC.ragas[id].gamakaRender);
  const withText = Object.keys(DOC.ragas).filter(id => Object.keys(DOC.ragas[id].gamaka).some(k => k !== 'sources'));
  ok(withRules.length === 23 && withText.length === 23 && withText.every(id => withRules.includes(id)), 'the 23 ragas with gamaka text have gamakaRender');
  withRules.forEach(id => {
    const gr = DOC.ragas[id].gamakaRender, n = Object.values(gr.rules).reduce((s, l) => s + l.length, 0);
    ok(n >= 1, id + ': at least one rule');
    Object.values(gr.rules).flat().forEach(r => ok(DOC.ragas[id].gamaka.sources.includes(r.src) || ['S193', 'S194', 'S195', 'S196', 'S197', 'S198', 'S199'].includes(r.src), id + ': rule cites one of the raga\'s gamaka sources'));
    ok(validateGamaka(byId(id), gr, DOC).length === 0, id + ': validates');
  });
  ok(validateProfiles(clone(DOC)).length === 0, 'the whole file validates');

  // resolution: letters to semitone offsets with the raga's own swarasthanas
  const todi = byId('mela8'), kal = byId('mela65');
  ok(resolveTarget(todi, 3, 'R') === -2 && resolveTarget(todi, 3, 'M') === 2, 'Todi G2: R1 is 2 below, M1 2 above');
  ok(resolveTarget(todi, 10, "S'") === 2 && resolveTarget(todi, 10, 'D') === -2, "Todi N2: S' 2 above, D1 2 below");
  ok(resolveTarget(kal, 4, '+1') === 2 && resolveTarget(kal, 4, '-1') === -2 && resolveTarget(kal, 11, '+1') === 1, 'Kalyani: +1 and -1 are the next raga swaras');
  ok(resolveTarget(kal, 0, '-30c') === -0.3 && resolveTarget(kal, 0, 'self') === 0, 'cents and self');

  // the engine sees every raga's gamaka, with defaults where there is no data
  let defaults = 0;
  ALL.forEach(r => {
    const g = E.getProfile(r).gamaka;
    ok(g && typeof g.style === 'string' && g.maxChain >= 1, r.id + ': compiled gamaka');
    if (g.basis === 'default') { defaults++; ok(g.style === 'light' && !Object.keys(g.rules).length, r.id + ': light default without rules'); }
    Object.values(g.rules).flat().forEach(x => ['lo', 'hi', 'from'].forEach(k => { if (x[k] != null) ok(typeof x[k] === 'number' && Math.abs(x[k]) <= 7, r.id + ': offsets resolved'); }));
    g.sources.forEach(s => ok(!!E.getSource(s), r.id + ': gamaka source ' + s + ' is exported'));
  });
  ok(defaults === 63, '63 ragas fall back to the default, got ' + defaults);

  // crafted bad inputs
  const bad = (id, mutate, expect) => {
    const d = clone(DOC); mutate(d.ragas[id].gamakaRender, d);
    const errs = validateGamaka(byId(id), d.ragas[id].gamakaRender, d);
    ok(errs.some(e => expect.test(e)), id + ': expected an error matching ' + expect + ', got ' + JSON.stringify(errs));
  };
  bad('mela8', g => { delete g.rules.S[0].src; }, /missing src/);
  bad('mela8', g => { g.rules.S[0].src = 'S999'; }, /unknown or missing src S999/);
  bad('mela8', g => { g.rules.G[0].body = 'wobble'; }, /body wobble/);
  bad('mela8', g => { g.rules.G[0].cycles = [3, 1]; }, /cycles/);
  bad('mela8', g => { g.rules.S[0] = { body: 'kampita', lo: 'self', hi: "N'", src: 'S37' }; }, /semitones away/);
  bad('mela8', g => { g.rules.G[1].lo = 'M'; g.rules.G[1].hi = 'R'; }, /lo must be below hi/);
  bad('mohanam', g => { g.rules.M = [{ body: 'plain', src: 'S174' }]; }, /not a swara of Mohanam/);
  bad('mela8', g => { g.rules.G[0].when.tempo = 2; }, /unknown condition tempo/);
  bad('mela8', g => { g.rules.M[0].when.dir = 'sideways'; }, /dir sideways/);
  bad('mela8', g => { g.style = 'spicy'; }, /style spicy/);
  bad('mela65', g => { g.rules.N[1].when.prev = 'X'; }, /bad swara/);
  bad('mela8', g => { g.global[0].src = 'nope'; }, /global\[0\]/);
  const styles = {}; withRules.forEach(id => { const st = DOC.ragas[id].gamakaRender.style; styles[st] = (styles[st] || 0) + 1; });
  t.diagnostic(withRules.length + ' ragas with gamaka rules (' + Object.entries(styles).map(([k, v]) => v + ' ' + k).join(', ') + '), ' + defaults + ' on the light default');
  done();
});

/* ---------- Phase 1: geometry, with hand-written shapes ---------- */
import { buildContour } from '../src/engine/gamaka/contour.js';
import { CPN_MIN, MAX_RATE_HZ, SAMPLE_SEC } from '../src/engine/gamaka/constants.js';

const SHAPES = [
  null,
  { onset: 'none', body: 'kampita', lo: -2, hi: 2, cycles: [1, 3], end: 'self' },
  { onset: 'none', body: 'kampita', lo: 0, hi: 1, cycles: [1, 2], end: 'hi', dwell: 'hi' },
  { onset: 'nokku', from: 2, body: 'plain' },
  { onset: 'odukkal', from: -1, body: 'kampita', lo: -1, hi: 0, cycles: [1, 1] },
  { onset: 'jaru', body: 'plain' },
  { onset: 'none', body: 'andolita', lo: -2, hi: 0, cycles: [1, 3] },
  { onset: 'sphurita', from: -1, body: 'plain', exit: 'orikkai', exitTo: 2 },
  { onset: 'none', body: 'plain', exit: 'jaru' }
];
/* seeded sequences of notes: pitches in range, steps and leaps up to an octave, 1 to 4 slots */
function sequences(count) {
  const out = [];
  for (let s = 1; s <= count; s++) {
    const r = E.rng(s * 97), items = [];
    let p = 0;
    const n = 6 + Math.floor(r() * 10);
    for (let k = 0; k < n; k++) {
      const leap = r() < 0.15 ? (r() < 0.5 ? 12 : -12) : Math.floor(r() * 9) - 4;
      p = Math.max(-5, Math.min(19, p + leap));
      items.push({ p, dur: 1 + Math.floor(r() * 4), shape: SHAPES[Math.floor(r() * SHAPES.length)] });
    }
    items[items.length - 1].landing = true;
    out.push(items);
  }
  return out;
}

test('gamaka geometry: depth 0 is plain, timing is exact, no jumps, anchors and rate cap (plan tests 2-4, 6, 7)', t => {
  const { ok, done } = checker(t);
  let notes = 0, contours = 0, maxStep = 0, minCycle = Infinity;
  sequences(60).forEach(items => [0.125, 0.1875, 0.25, 0.375].forEach(slotSec => {
    const total = items.reduce((s, it) => s + it.dur, 0) * slotSec;
    // test 2: depth 0 reproduces plain playback, boundaries on the grid
    const z = buildContour(items, { slotSec, depth: 0 });
    z.points.forEach(pt => {
      const n = z.notes.find(x => pt.t >= x.t0 - 1e-9 && (pt.t < x.t1 - 1e-9 || x.i === items.length - 1));
      ok(n && n.p === pt.p, 'depth 0: every point is its note\'s pitch');
    });
    const c = buildContour(items, { slotSec, depth: 1 });
    contours++;
    // test 3: exact timing
    ok(Math.abs(c.points[0].t) < 1e-12 && Math.abs(c.points[c.points.length - 1].t - total) < 1e-9, 'contour runs from 0 to the total length');
    let acc = 0;
    c.notes.forEach((n, k) => { ok(Math.abs(n.t0 - acc * slotSec) < 1e-9, 'note ' + k + ' starts on its grid time'); acc += items[k].dur; });
    ok(JSON.stringify(c.notes.map(n => n.p)) === JSON.stringify(items.map(it => it.p)), 'the renderer never changes the notes');
    // test 4: no unintended jumps inside a legato group
    c.groups.forEach(g => { for (let k = 1; k < g.points.length; k++) { const d = Math.abs(g.points[k].p - g.points[k - 1].p); if (g.points[k].t - g.points[k - 1].t <= SAMPLE_SEC + 1e-9) { maxStep = Math.max(maxStep, d); ok(d <= 1.5, '|Δp| ≤ 1.5 semitones per 5 ms sample, got ' + d.toFixed(2)); } } });
    c.notes.forEach(n => {
      notes++;
      const sec = n.t1 - n.t0;
      // test 6: anchor rule
      if (sec >= 0.2) ok(n.targets.some(x => x.kind === 'cpn' && x.dur >= CPN_MIN - 1e-9), 'a note of ' + sec.toFixed(3) + ' s keeps a CPN of at least 80 ms');
      // test 7: rate cap, from one hi stationary point to the next
      const his = n.targets.filter(x => x.role === 'hi');
      for (let k = 1; k < his.length; k++) { const dt = his[k].t - his[k - 1].t; minCycle = Math.min(minCycle, dt); ok(dt >= 1 / MAX_RATE_HZ - 1e-9, 'oscillation no faster than ' + MAX_RATE_HZ + ' Hz'); }
      // targets stay inside the note's window
      n.targets.forEach(x => ok(x.t >= n.t0 - 1e-9 && x.t + x.dur <= n.t1 + 1e-9 && x.dur >= -1e-12, 'targets inside the note'));
    });
  }));
  t.diagnostic(contours + ' contours, ' + notes + ' notes; largest step per 5 ms sample ' + maxStep.toFixed(2) + ' semitones; fastest oscillation ' + (1 / minCycle).toFixed(2) + ' Hz');
  done();
});

test('gamaka geometry: the degradation ladder lightens faster tempos (plan test 8)', t => {
  const { ok, done } = checker(t);
  const rows = [];
  sequences(40).forEach((items, s) => {
    let lastSta = Infinity, lastDeg = -1;
    const deg = [];
    [60, 90, 120, 180].forEach(bpm => {
      const c = buildContour(items, { slotSec: 60 / bpm / 2, depth: 1 });
      ok(c.stats.staCount <= lastSta, 'sequence ' + s + ': STAs do not increase at ' + bpm + ' BPM');
      ok(c.stats.degradedShare >= lastDeg - 1e-12, 'sequence ' + s + ': degradation does not fall at ' + bpm + ' BPM');
      lastSta = c.stats.staCount; lastDeg = c.stats.degradedShare; deg.push(c.stats.degradedShare);
    });
    rows.push(deg);
  });
  const mean = k => rows.reduce((s, r) => s + r[k], 0) / rows.length;
  ok(mean(3) > mean(0), 'degradation rises from 60 to 180 BPM');
  t.diagnostic('mean degradedShare at 60, 90, 120, 180 BPM (second speed): ' + [0, 1, 2, 3].map(k => mean(k).toFixed(3)).join(', '));
  done();
});

/* ---------- Phase 2: the resolver and renderGamaka ---------- */
import { LAND_HOLD, TRANS_SEC } from '../src/engine/gamaka/constants.js';
const notesOf = ps => ps.map(p => Array.isArray(p) ? { p: p[0], dur: p[1] } : { p, dur: 1 });
const unionPcs = r => new Set(r.aro.concat(r.avaro).map(E.mod12));

test('renderGamaka: deterministic, never changes the notes, targets on raga notes, landing held plain (plan tests 1, 5, 9)', t => {
  const { ok, done } = checker(t);
  let rounds = 0, targets = 0;
  ALL.forEach((r, ri) => [0, 1, 2].forEach(T => {
    const pcs = unionPcs(r);
    const res = E.kalpana(r, { aksharas: 8, perAkshara: 2, startPitch: 0, eduppuPitch: pcs.has(7) ? 7 : 12, T, seed: 3 + ri });
    const before = JSON.stringify(res.notes);
    const opts = { raga: r, slotSec: 0.25, seed: 5, units: res.units };
    const a = E.renderGamaka(res.notes, opts), b = E.renderGamaka(res.notes, opts);
    rounds++;
    ok(JSON.stringify(a.points) === JSON.stringify(b.points) && JSON.stringify(a.notes) === JSON.stringify(b.notes), 'test 1: same notes, options and seed, same contour');
    const v1 = E.renderGamaka(res.notes, Object.assign({ variety: 1 }, opts)), v2 = E.renderGamaka(res.notes, Object.assign({ variety: 1 }, opts));
    ok(JSON.stringify(v1.points) === JSON.stringify(v2.points), 'test 1: variety is seeded too');
    ok(JSON.stringify(res.notes) === before, 'the input notes are untouched');
    // test 5: at depth 1, every target of a full-depth rule is a raga note (or its octave copy)
    a.notes.forEach(n => {
      if (n.ruleDepth < 1) return;
      n.targets.forEach(x => { targets++; ok(Number.isInteger(Math.round(x.p * 1e6) / 1e6) && pcs.has(E.mod12(Math.round(x.p))), r.name + ': target ' + x.p + ' is a raga note (' + n.rule + ')'); });
    });
    // test 9: the landing swara ends on a plain CPN of at least LAND_HOLD (or what the note has left)
    const last = a.notes[a.notes.length - 1], tl = last.targets[last.targets.length - 1], sec = last.t1 - last.t0;
    ok(tl.kind === 'cpn' && Math.abs(tl.p - last.p) < 1e-9 && Math.abs(tl.t + tl.dur - last.t1) < 1e-9, r.name + ': the round ends on a plain CPN of its last swara');
    ok(tl.dur >= Math.min(LAND_HOLD, sec - TRANS_SEC / 2 - 0.06) - 1e-9, r.name + ': landing CPN ' + tl.dur.toFixed(3) + ' s');
    ok(last.shape.indexOf('kampita') < 0 && last.shape.indexOf('orikkai') < 0, r.name + ': no oscillation or exit on the landing swara');
  }));
  t.diagnostic(rounds + ' kalpana rounds rendered, ' + targets + ' full-depth targets checked against the raga');
  done();
});

test('renderGamaka golden cases: Todi, Sankarabharanam, Kalyani, Mayamalavagowla (plan tests 10-13)', t => {
  const { ok, done } = checker(t);
  const at = (g, i) => g.notes[i];
  // 10: Todi, a 0.6 s G in R G M swings to R (or lower) and M; a held S is plain
  const todi = E.renderGamaka(notesOf([1, [3, 2], 5, [0, 4]]), { ragaId: 'mela8', slotSec: 0.3, landing: false });
  const g = at(todi, 1).targets.filter(x => x.kind === 'sta').map(x => x.p);
  ok(g.some(p => p <= 1) && g.some(p => p >= 5), 'Todi G reaches R and M: ' + g.join(' '));
  ok(at(todi, 3).targets.length === 1 && at(todi, 3).targets[0].kind === 'cpn', 'Todi held S is plain');
  // 11: Sankarabharanam G is plain at every duration and in every context
  [1, 2, 4, 8].forEach(d => [[2, 4, 5], [5, 4, 2], [4, 4, 5], [0, 4, 0]].forEach(ctx => {
    const s = E.renderGamaka(notesOf([[ctx[0], 1], [ctx[1], d], [ctx[2], 1]]), { ragaId: 'mela29', slotSec: 0.25, landing: false });
    s.notes.filter(n => n.p === 4).forEach(n => ok(n.targets.length === 1 && n.targets[0].kind === 'cpn', 'Sankarabharanam G plain at ' + (d * 0.25) + ' s in ' + ctx.join(' ')));
  }));
  // 12: Kalyani S' N D P M G R: every note after the first is touched from the note above
  // (the landing R is held for two slots: its plain hold of LAND_HOLD and the nokku need about 0.35 s)
  const kal = E.renderGamaka(notesOf([12, 11, 9, 7, 6, 4, [2, 2]]), { ragaId: 'mela65', slotSec: 0.3 });
  kal.notes.slice(1).forEach((n, k) => ok(n.targets[0].kind === 'sta' && Math.abs(n.targets[0].p - kal.notes[k].p) < 1e-9, 'Kalyani ' + n.p + ': nokku from ' + kal.notes[k].p + ' (' + n.rule + ')'));
  // 13: Mayamalavagowla, a held G spends more than half its time at or near M
  const mmg = E.renderGamaka(notesOf([1, [4, 4], 1]), { ragaId: 'mela15', slotSec: 0.3, landing: false }), n = mmg.notes[1];
  const inG = mmg.points.filter(pt => pt.t >= n.t0 && pt.t < n.t1), nearM = inG.filter(pt => Math.abs(pt.p - 5) <= 0.5).length / inG.length;
  ok(nearM > 0.5, 'Mayamalavagowla G near M ' + (100 * nearM).toFixed(0) + '% of its time');
  t.diagnostic('Todi G STAs ' + g.join(' ') + '; Mayamalavagowla G near M ' + (100 * nearM).toFixed(0) + '% of the time; Kalyani: ' + kal.notes.map(x => x.shape).join(' · '));
  done();
});

test('renderGamaka: mora repetitions share their template, and data-less ragas stay conservative (plan tests 14, 15)', t => {
  const { ok, done } = checker(t);
  let moras = 0, defaults = 0, defNotes = 0;
  ALL.forEach((r, ri) => {
    const pcs = unionPcs(r);
    [0, 1].forEach(T => {
      const res = E.kalpana(r, { aksharas: 16, perAkshara: 2, startPitch: 0, eduppuPitch: pcs.has(7) ? 7 : 12, T, seed: 7 + ri, ending: 'mora' });
      if (res.ending.type !== 'mora') return;
      const gr = E.renderGamaka(res.notes, { raga: r, slotSec: 0.25, units: res.units });
      const idx = []; let k = 0; res.units.forEach(u => { const ids = u.notes.map(() => k++); if (u.kind === 'mora') idx.push(ids); });
      const last = res.notes.length - 1;
      const kinds = ids => ids.filter(i => i !== last).map(i => gr.notes[i].shape.replace(/\+?(nokku|odukkal|sphurita|pratyahata)\+?/, ''));
      // aligned from the end, as gopuccha and srotovaha change the front of the statements
      const m = Math.min(idx[0].length, idx[1].length, idx[2].length) - 1;
      const tail = ids => ids.slice(ids.length - 1 - m, ids.length - 1);
      moras++;
      // positions where any statement lands on a swara the raga holds plain keep that swara plain; the rest share the template
      const keep = tail(idx[0]).map((_, j) => idx.every(ids => !gr.notes[tail(ids)[j]].plainByRule));
      idx.forEach(ids => tail(ids).forEach(i => { if (gr.notes[i].plainByRule) ok(gr.notes[i].shape.indexOf('kampita') < 0, r.name + ': a plain-by-rule swara stays plain in a mora'); }));
      const cmp = ids => kinds(tail(ids)).filter((_, j) => keep[j]);
      ok(cmp(idx[0]).join() === cmp(idx[1]).join() && cmp(idx[1]).join() === cmp(idx[2]).join(), r.name + ': mora statements use the same template: ' + [0, 1, 2].map(j => cmp(idx[j]).join(' ')).join(' | '));
    });
    // test 15: a data-less raga keeps S and P plain and gives no note shorter than 0.4 s an oscillation
    if (E.getProfile(r).gamaka.basis !== 'default') return;
    defaults++;
    const res = E.kalpana(r, { aksharas: 8, perAkshara: 2, startPitch: 0, eduppuPitch: pcs.has(7) ? 7 : 12, T: 1, seed: ri + 1 });
    [0.15, 0.3].forEach(slotSec => {
      const gr = E.renderGamaka(res.notes, { raga: r, slotSec });
      gr.notes.forEach(n => {
        defNotes++;
        if (E.mod12(n.p) === 0 || E.mod12(n.p) === 7) ok(n.targets.length === 1 && n.targets[0].kind === 'cpn', r.name + ': S and P plain');
        if (n.t1 - n.t0 < 0.4 - 1e-9) ok(n.shape.indexOf('kampita') < 0, r.name + ': no kampita under 0.4 s');
      });
    });
  });
  t.diagnostic(moras + ' moras rendered with consistent templates; ' + defaults + ' data-less ragas, ' + defNotes + ' notes on the conservative default');
  done();
});
