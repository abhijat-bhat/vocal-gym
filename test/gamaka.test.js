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
      // Varali-type G1 swings up into the foreign G2 position by design (grammar G4w, Schachter 2015)
      if (n.ruleDepth < 1 || n.grammar === 'G4w' || n.offScale) return;   // and measured turns off the scale (Todi ga, S206)
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
  // 10: Todi, a 0.6 s G in R G M swings between the R2 position (its standard lower pitch, S206) and M;
  // a held S is plain
  const todi = E.renderGamaka(notesOf([1, [3, 2], 5, [0, 4]]), { ragaId: 'mela8', slotSec: 0.3, landing: false });
  const g = at(todi, 1).targets.filter(x => x.kind === 'sta').map(x => x.p);
  ok(g.some(p => Math.abs(p - 2) < 1e-9) && g.some(p => p >= 5) && g.every(p => p > 1), 'Todi G reaches the R2 position and M, not R1: ' + g.join(' '));
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

test('renderGamaka: mora repetitions share their template, and data-less ragas follow the swara grammar (plan tests 14, 15)', t => {
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
    // test 15 (v0.5: the swara grammar replaces the generic default): a data-less raga keeps S and P plain,
    // never oscillates a swara a semitone below its neighbour with a close swara under it, and never oscillates
    // two neighbouring swaras in a row on the grammar's account
    if (E.getProfile(r).gamaka.basis !== 'default') return;
    defaults++;
    const res = E.kalpana(r, { aksharas: 8, perAkshara: 2, startPitch: 0, eduppuPitch: pcs.has(7) ? 7 : 12, T: 1, seed: ri + 1 });
    const pcl = Array.from(pcs).sort((a, b) => a - b), up = p => { let q = p + 1; while (!pcs.has(E.mod12(q))) q++; return q - p; }, dn = p => { let q = p - 1; while (!pcs.has(E.mod12(q))) q--; return p - q; };
    [0.15, 0.3].forEach(slotSec => {
      const gr = E.renderGamaka(res.notes, { raga: r, slotSec });
      gr.notes.forEach((n, k) => {
        defNotes++;
        if (E.mod12(n.p) === 0 || E.mod12(n.p) === 7) ok(n.targets.length === 1 && n.targets[0].kind === 'cpn', r.name + ': S and P plain');
        const osc = /kampita|andolita/.test(n.shape);
        if (up(n.p) === 1 && dn(n.p) < 3 && !(n.grammar === 'G2' || n.grammar === 'G3c')) ok(!osc, r.name + ': a swara a semitone below its neighbour is held straight (' + n.why + ')');
        // the exception (S209): N3 and M2 next to S and P, a kampita that lives close to them
        if (n.grammar === 'G3c') ok([11, 6].includes(E.mod12(n.p)) && [0, 7].includes(E.mod12(n.p + 1)) && n.form.hi === n.p + 1 && n.form.lo === n.p, r.name + ': G3c only on N3 and M2, swinging up to S and P (' + n.rule + ')');
        const m = gr.notes[k - 1];
        const neighbours = (x, y) => { const lo = Math.min(x, y), hi = Math.max(x, y); if (lo === hi) return false; for (let q = lo + 1; q < hi; q++) if (pcs.has(E.mod12(q))) return false; return true; };   // no raga swara between
        const [lw, up2] = m && m.p < n.p ? [m, n] : [n, m], toward = m && m.form && n.form && m.p != null && n.p != null && ((lw.form.hi != null && lw.form.hi > lw.p) || (up2.form.lo != null && up2.form.lo < up2.p));   // swings into each other (outward splits are fine)
        if (m && m.p != null && n.p != null && osc && /kampita|andolita/.test(m.shape) && neighbours(m.p, n.p) && toward && (m.grammar || n.grammar))
          ok(false, r.name + ': two neighbouring swaras oscillate in a row (' + m.why + ' / ' + n.why + ')');
      });
    });
  });
  t.diagnostic(moras + ' moras rendered with consistent templates; ' + defaults + ' data-less ragas, ' + defNotes + ' notes on the swara grammar');
  done();
});

/* ---------- Phase 5: the listening-test kit ---------- */
import { buildManifest, RATING_RAGAS, ID_RAGAS } from '../scripts/listening-kit.js';

test('listening kit: balanced, blind and reproducible', t => {
  const { ok, done } = checker(t);
  const m = buildManifest(1), again = buildManifest(1), other = buildManifest(2);
  ok(JSON.stringify(m) === JSON.stringify(again), 'the same seed gives the same kit');
  ok(m.map(c => c.raga + c.round + c.gamaka).join() !== other.map(c => c.raga + c.round + c.gamaka).join(), 'another seed gives another order');
  const A = m.filter(c => c.part === 'A'), B = m.filter(c => c.part === 'B');
  ok(A.length === 24 && B.length === 8, '24 rating clips and 8 identification clips');
  RATING_RAGAS.forEach(([id]) => ['off', 'full'].forEach(g => ok(A.filter(c => c.raga === id && c.gamaka === g).length === 2, id + ': two rounds at gamaka ' + g)));
  ID_RAGAS.forEach(([id]) => ['off', 'full'].forEach(g => ok(B.filter(c => c.raga === id && c.gamaka === g).length === 1, id + ': one identification clip at gamaka ' + g)));
  ok(new Set(m.map(c => c.file)).size === m.length && m.every(c => /^[AB]\d\d\.wav$/.test(c.file)), 'clip names are unique and say nothing about the clip');
  // a plain and a gamaka clip of the same round use the same notes
  A.filter(c => c.gamaka === 'off').forEach(c => { const twin = A.find(x => x.raga === c.raga && x.round === c.round && x.gamaka === 'full'); ok(twin && twin.args.slice(0, -4).join() === c.args.slice(0, -4).join(), c.raga + ': the plain and gamaka clips share their round'); });
  done();
});

/* ---------- v0.5: the natural contour and the intensity dial (docs/research/gamaka-naturalness.md) ---------- */
test('natural contour: exact timing, no jumps, anchors and rate cap at every intensity', t => {
  const { ok, done } = checker(t);
  let contours = 0, maxStep = 0, minCycle = Infinity;
  sequences(40).forEach((items, s) => [0.125, 0.25, 0.375].forEach(slotSec => [0.2, 0.55, 1].forEach(intensity => {
    const total = items.reduce((x, it) => x + it.dur, 0) * slotSec;
    const c = buildContour(items, { slotSec, depth: 1, natural: { intensity, seed: s + 1 } });
    contours++;
    ok(Math.abs(c.points[0].t) < 1e-12 && Math.abs(c.points[c.points.length - 1].t - total) < 1e-9, 'contour runs from 0 to the total length');
    let acc = 0;
    c.notes.forEach((n, k) => { ok(Math.abs(n.t0 - acc * slotSec) < 1e-9, 'note ' + k + ' starts on its grid time'); acc += items[k].dur; });
    c.groups.forEach(g => { for (let k = 1; k < g.points.length; k++) { const d = Math.abs(g.points[k].p - g.points[k - 1].p); if (g.points[k].t - g.points[k - 1].t <= SAMPLE_SEC + 1e-9) { maxStep = Math.max(maxStep, d); ok(d <= 1.5, '|Δp| ≤ 1.5 semitones per sample, got ' + d.toFixed(2)); } } });
    c.points.forEach(pt => ok(Number.isFinite(pt.p), 'finite pitch'));
    c.notes.forEach(n => {
      const sec = n.t1 - n.t0;
      if (sec >= 0.2) ok(n.targets.some(x => x.kind === 'cpn' && x.dur >= CPN_MIN - 1e-9), 'a note of ' + sec.toFixed(3) + ' s keeps a CPN of at least 80 ms');
      const his = n.targets.filter(x => x.role === 'hi');
      for (let k = 1; k < his.length; k++) { const dt = his[k].t - his[k - 1].t; minCycle = Math.min(minCycle, dt); ok(dt >= 1 / MAX_RATE_HZ - 1e-9, 'oscillation no faster than ' + MAX_RATE_HZ + ' Hz'); }
      n.targets.forEach(x => ok(x.t >= n.t0 - 1e-9 && x.t + x.dur <= n.t1 + 1e-9 && x.dur >= -1e-12, 'targets inside the note'));
    });
  })));
  t.diagnostic(contours + ' natural contours; largest step per sample ' + maxStep.toFixed(2) + ' semitones; fastest oscillation ' + (1 / minCycle).toFixed(2) + ' Hz');
  done();
});

test('intensity dial: 0 is straight notes, gamaka grows with the dial, full is accurate, the middle varies', t => {
  const { ok, done } = checker(t);
  const LEVELS = [0, 0.1, 0.3, 0.55, 0.85, 1];
  const share = [], staMid = [];
  let rounds = 0;
  ['mela8', 'mela65', 'mela15', 'mela29', 'mela1', 'mela22'].forEach((id, ri) => {
    const r = byId(id), pcs = unionPcs(r);
    [0, 1, 2].forEach(T => {
      const res = E.kalpana(r, { aksharas: 8, perAkshara: 2, startPitch: 0, eduppuPitch: pcs.has(7) ? 7 : 12, T, seed: 11 + ri });
      const before = JSON.stringify(res.notes), base = { raga: r, slotSec: 0.3, seed: 4, units: res.units };
      const outs = LEVELS.map(intensity => E.renderGamaka(res.notes, Object.assign({ intensity }, base)));
      rounds++;
      ok(JSON.stringify(res.notes) === before, 'the notes are never changed');
      // 0: exactly the plain stepped contour
      outs[0].points.forEach(pt => { const n = outs[0].notes.find(x => pt.t >= x.t0 - 1e-9 && (pt.t < x.t1 - 1e-9 || x.i === res.notes.length - 1)); ok(n && n.p === pt.p, 'intensity 0: every point is its note\'s pitch'); });
      ok(outs[0].stats.gamakaShare === 0, 'intensity 0: no gamaka');
      // presence only grows with the dial
      for (let k = 1; k < LEVELS.length; k++) ok(outs[k].stats.gamakaShare >= outs[k - 1].stats.gamakaShare - 1e-9, r.name + ': gamaka share does not fall from ' + LEVELS[k - 1] + ' to ' + LEVELS[k] + ' (' + outs[k - 1].stats.gamakaShare.toFixed(2) + ' → ' + outs[k].stats.gamakaShare.toFixed(2) + ')');
      share.push(outs.map(o => o.stats.gamakaShare));
      // full: every turn of a full-depth rule sits exactly on a raga note
      outs[5].notes.forEach(n => { if (n.p != null && n.ruleDepth >= 1 && !n.offScale) n.targets.forEach(x => ok(Math.abs(x.p - Math.round(x.p)) < 1e-9 && pcs.has(E.mod12(Math.round(x.p))), r.name + ': full intensity turn ' + x.p + ' is a raga note')); });
      // the middle: turns vary but stay within a semitone of the full swing's raga notes
      outs[3].notes.forEach(n => { if (n.p == null) return; n.targets.filter(x => x.kind === 'sta').forEach(x => { staMid.push(x.p); ok(Math.abs(x.p - n.p) <= 7.5, 'mid-dial turn stays near its swara'); }); });
      // swaras that stay plain hold the CPN band (±0.3 semitone) despite overshoot, preparation and drift
      outs[3].notes.forEach(n => {
        if (n.p == null || n.gamaka) return;
        n.targets.filter(x => x.kind === 'cpn').forEach(x => outs[3].points.filter(pt => pt.t >= x.t && pt.t <= x.t + x.dur).forEach(pt => ok(Math.abs(pt.p - n.p) <= 0.3 + 1e-9, r.name + ': plain swara within the CPN band, off by ' + (pt.p - n.p).toFixed(3))));
      });
    });
  });
  ok(staMid.some(p => Math.abs(p - Math.round(p)) > 0.02), 'mid-dial turns are not all on exact semitones');
  // seeded: the same seed repeats, another seed varies
  const res = E.kalpana(byId('mela8'), { aksharas: 8, perAkshara: 2, startPitch: 0, eduppuPitch: 7, T: 1, seed: 5 });
  const at = seed => E.renderGamaka(res.notes, { raga: byId('mela8'), slotSec: 0.3, intensity: 0.55, seed, units: res.units });
  ok(JSON.stringify(at(3).points) === JSON.stringify(at(3).points), 'the same seed gives the same contour');
  ok(JSON.stringify(at(3).points) !== JSON.stringify(at(4).points), 'another seed varies the performance');
  // depth alone is read as the intensity; natural: false is the v0.4 contour
  ok(JSON.stringify(E.renderGamaka(res.notes, { raga: byId('mela8'), slotSec: 0.3, depth: 0.55, seed: 3, units: res.units }).points) === JSON.stringify(at(3).points), 'a lone depth is read as the intensity');
  const legacy = E.renderGamaka(notesOf([1, [3, 2], 5, [0, 4]]), { ragaId: 'mela8', slotSec: 0.3, landing: false, natural: false, depth: 0.5 });
  ok(legacy.intensity === null && legacy.notes[1].targets.filter(x => x.kind === 'sta').every(x => Math.abs(x.p - 3) <= 1 + 1e-9), 'natural: false keeps v0.4 depth scaling');
  // Todi G is among the first gamakas to appear; the generic default only from the middle of the dial
  const todiLow = E.renderGamaka(notesOf([1, [3, 2], 5, [0, 4]]), { ragaId: 'mela8', slotSec: 0.3, landing: false, intensity: 0.15 });
  ok(todiLow.notes[1].shape.indexOf('kampita') >= 0, 'Todi G swings already at 15%: ' + todiLow.notes[1].shape);
  // the swara grammar's gamakas come in early on the dial (salience 0.82), but not at the very start
  const gram = x => E.renderGamaka(notesOf([0, [2, 4], 4, 0]), { ragaId: 'mela1', slotSec: 0.3, landing: false, intensity: x });
  ok(gram(0.1).notes[1].shape === 'plain' && gram(0.3).notes[1].shape.indexOf('kampita') >= 0, 'a data-less raga: plain at 10%, the grammar kampita at 30%: ' + gram(0.3).notes[1].shape);
  const mean = k => share.reduce((s, r) => s + r[k], 0) / share.length;
  t.diagnostic(rounds + ' rounds; mean gamaka share at ' + LEVELS.map((l, k) => Math.round(l * 100) + '%: ' + mean(k).toFixed(2)).join(', '));
  done();
});

/* ---------- v0.5: the swara grammar (docs/research/gamaka-grammar.md) ---------- */
test('swara grammar: which swara of a pair carries the gamaka, and where it swings', t => {
  const { ok, done } = checker(t);
  const DATALESS = ALL.filter(r => E.getProfile(r).gamaka.basis === 'default');
  const has = (r, ...pcs) => pcs.every(pc => unionPcs(r).has(pc));
  const without = (r, ...pcs) => pcs.every(pc => !unionPcs(r).has(pc));
  const render = (r, ps, slot) => E.renderGamaka(notesOf(ps), { raga: r, slotSec: slot || 0.3, landing: false, intensity: 0.7 });
  const osc = n => /kampita|andolita/.test(n.shape), straight = n => n.shape === 'plain';
  // R2 then G2: R2 straight, the gamaka on G2; R2 then G3 (with M1 above it): R2 oscillates, G3 straight
  const rg2 = DATALESS.filter(r => has(r, 2, 3, 5)), rg3 = DATALESS.filter(r => has(r, 2, 4, 5) && without(r, 3));
  ok(rg2.length > 0 && rg3.length > 0, 'data-less ragas with R2 G2 and with R2 G3');
  rg2.forEach(r => { const g = render(r, [0, [2, 2], [3, 2], 5]); ok(straight(g.notes[1]) && osc(g.notes[2]), r.name + ': R2 G2 → R2 straight (' + g.notes[1].shape + '), G2 with gamaka (' + g.notes[2].shape + ')'); });
  rg3.forEach(r => { const g = render(r, [0, [2, 2], [4, 2], 5]); ok(osc(g.notes[1]) && straight(g.notes[2]), r.name + ': R2 G3 → R2 with gamaka (' + g.notes[1].shape + '), G3 straight (' + g.notes[2].shape + ')'); });
  // the same rule in ragas whose data says only "gamaka" (Kharaharapriya R, G; Sankarabharanam R)
  const khp = render(byId('mela22'), [0, [2, 2], [3, 2], 5]), sk = render(byId('mela29'), [0, [2, 2], [4, 2], 5]);
  ok(straight(khp.notes[1]) && osc(khp.notes[2]), 'Kharaharapriya r g: R straight, G oscillates');
  ok(osc(sk.notes[1]) && straight(sk.notes[2]), 'Sankarabharanam r g: R oscillates, G flat');
  // the same pair a fifth up (Vedavalli): D2 then N2: D2 straight; D2 then N3: D2 oscillates, N3 straight
  const dn2 = DATALESS.filter(r => has(r, 9, 10)), dn3 = DATALESS.filter(r => has(r, 9, 11) && without(r, 10));
  dn2.forEach(r => { const g = render(r, [7, [9, 2], [10, 2], 12]); ok(straight(g.notes[1]) && osc(g.notes[2]), r.name + ': D2 N2 → D2 straight, N2 with gamaka'); });
  dn3.forEach(r => { const g = render(r, [7, [9, 2], [11, 2], 12]); ok(osc(g.notes[1]) && straight(g.notes[2]), r.name + ': D2 N3 → D2 with gamaka, N3 straight'); });
  // Kalyani: the gandharam oscillates (its data), so the rishabham beside it is held flat (Vedavalli)
  const kal = render(byId('mela65'), [0, [2, 2], [4, 2], 6]);
  ok(osc(kal.notes[2]) && straight(kal.notes[1]) && kal.notes[1].grammar === 'G6', 'Kalyani r g: G oscillates, R held flat beside it: ' + kal.notes[1].why);
  // the madhyamam follows the phrase (Vedavalli): toward P as s r g m p rises, toward G in s r g m m; rising
  // from G3 to P it is sung between them, G3 P G3 (G4m: Krishna & Ishwar, M. Subramanian)
  const up = render(byId('mela29'), [0, 2, 4, [5, 2], 7]).notes[3], stay = render(byId('mela29'), [0, 2, 4, [5, 2], [5, 2]]).notes[3];
  ok(up.form.hi === 7 && up.form.lo === 4 && up.grammar === 'G4m', 'Sankarabharanam s r g m p: M swings up to P, from G3 (' + up.rule + ')');
  ok(stay.form.lo < stay.p && stay.form.hi === stay.p, 'Sankarabharanam s r g m m: M swings down toward G (' + stay.rule + ')');
  // swaras a half step above S and P lean into them; with an augmented second below, G3 and N3 rise into M and S
  // (Mayamalavagowla's tetrachords, S R1 G3 M1 and P D1 N3 S, taken in data-less ragas that have them)
  const low = DATALESS.filter(r => has(r, 1, 4, 5) && without(r, 2, 3)), high = DATALESS.filter(r => has(r, 7, 8, 11) && without(r, 9, 10));
  ok(low.length > 0 && high.length > 0, 'data-less ragas with S R1 G3 M1 and with P D1 N3 S');
  low.forEach(r => {
    const n = render(r, [0, [1, 2], [4, 2], 5]).notes;
    ok(osc(n[1]) && n[1].form.lo === 0 && n[1].form.hi === 1, r.name + ': R1 oscillates into S (' + n[1].rule + ')');
    ok(n[2].grammar === 'G3a' && n[2].form.hi === 5, r.name + ': G3 above an augmented second rises into M (' + n[2].rule + ')');
  });
  high.forEach(r => {
    const n = render(r, [7, [8, 2], [11, 2], 12]).notes;
    ok(osc(n[1]) && n[1].form.lo === 7, r.name + ': D1 oscillates into P (' + n[1].rule + ')');
    ok(n[2].grammar === 'G3a' && n[2].form.hi === 12, r.name + ': N3 above an augmented second rises into S (' + n[2].rule + ')');
  });
  const r1 = low.concat(high);
  // speed: a short swara gets a single touch from where its kampita would swing, not a kampita
  const fast = render(rg3[0], [0, 2, 4, 5], 0.15);
  ok(!osc(fast.notes[1]) && /nokku|odukkal/.test(fast.notes[1].shape), 'at speed R2 is a single touch: ' + fast.notes[1].shape);
  // every grammar decision names its source and reason
  DATALESS.slice(0, 20).forEach(r => {
    const res = E.kalpana(r, { aksharas: 8, perAkshara: 2, startPitch: 0, eduppuPitch: unionPcs(r).has(7) ? 7 : 12, T: 1, seed: 9 });
    E.renderGamaka(res.notes, { raga: r, slotSec: 0.3, intensity: 0.7 }).notes.forEach(n => { if (n.grammar) ok(!!n.src && !!E.getSource(n.src) && n.why.length > 10, r.name + ': grammar decision with a source and a reason'); });
  });
  t.diagnostic(rg2.length + ' data-less ragas with R2 G2, ' + rg3.length + ' with R2 G3, ' + dn2.length + ' with D2 N2, ' + dn3.length + ' with D2 N3, ' + low.length + ' with S R1 G3 M1, ' + high.length + ' with P D1 N3 S');
  done();
});

/* ---------- v0.6: what the research folder adds (docs/research/gamaka-papers.md) ---------- */
const { SEMITONE_SEC, LEAP_MAX, CYCLE_MIN } = E.GAMAKA_CONSTANTS;
test('papers: the speed limit, 250-500 ms cycles, anchors, coarticulation and the new grammar rules', t => {
  const { ok, done } = checker(t);
  let swings = 0, cycles = 0, maxCycle = 0;
  // the speed limit (S210) and the cycle period (S205), over many rounds and intensities
  ['mela8', 'mela15', 'mela65', 'mela29', 'mela22', 'mela1'].forEach((id, ri) => [0.25, 0.3, 0.45].forEach(slotSec => [0.55, 0.85, 1].forEach(intensity => {
    const r = byId(id), pcs = unionPcs(r);
    const res = E.kalpana(r, { aksharas: 8, perAkshara: 2, startPitch: 0, eduppuPitch: pcs.has(7) ? 7 : 12, T: 1, seed: 21 + ri });
    const c = E.renderGamaka(res.notes, { raga: r, slotSec, intensity, units: res.units, seed: 5 });
    c.notes.forEach(n => {
      if (n.p == null) return;
      const ts = n.targets, turn = x => x.kind === 'sta' && (x.role === 'hi' || x.role === 'lo');
      for (let k = 1; k < ts.length; k++) {
        const a = ts[k - 1], b = ts[k];
        if (!turn(a) || !turn(b)) continue;
        swings++;
        const gap = b.t - (a.t + a.dur);
        ok(gap >= Math.min(LEAP_MAX, SEMITONE_SEC * Math.abs(b.p - a.p)) - 1e-9, r.name + ': a swing of ' + Math.abs(b.p - a.p).toFixed(2) + ' st takes ' + gap.toFixed(3) + ' s, at least 50 ms a semitone');
      }
      // a whole cycle (a turn to the next turn on the same side) is not faster than CYCLE_MIN
      const turns = ts.filter(turn);
      for (let k = 2; k < turns.length; k++) if (turns[k].role === turns[k - 2].role && turns[k - 1].role !== turns[k].role) {
        const per = turns[k].t - turns[k - 2].t; cycles++; maxCycle = Math.max(maxCycle, per);
        ok(per >= 0.9 * CYCLE_MIN - 1e-9, r.name + ': a cycle of ' + per.toFixed(3) + ' s is not faster than ' + CYCLE_MIN + ' s');
      }
    });
  })));
  // G2 anchors on S (S205): R1's turns on S hold longer than its spurts up to R1
  const low = ALL.filter(r => E.getProfile(r).gamaka.basis === 'default' && [1, 4, 5].every(pc => unionPcs(r).has(pc)) && ![2, 3].some(pc => unionPcs(r).has(pc)));
  low.forEach(r => {
    const n = E.renderGamaka(notesOf([0, [1, 4], [4, 1], 5]), { raga: r, slotSec: 0.3, landing: false, intensity: 0.7 }).notes[1];
    const onS = n.targets.filter(x => x.kind === 'sta' && Math.abs(x.p) < 0.4), up = n.targets.filter(x => x.kind === 'sta' && Math.abs(x.p - 1) < 0.4);
    ok(n.grammar === 'G2' && onS.length > 0 && onS.reduce((s, x) => s + x.dur, 0) > up.reduce((s, x) => s + x.dur, 0), r.name + ': R1 rests on S and rises to itself in spurts (' + n.rule + ')');
  });
  // coarticulation (S206, S208, S209): in Todi s r g m p, ga starts where ri left the voice and touches ma before it settles
  const todi = E.renderGamaka(notesOf([0, 1, [3, 3], 5, [7, 2]]), { ragaId: 'mela8', slotSec: 0.3, landing: false, intensity: 0.85 });
  const ga = todi.notes[2], first = ga.targets[0], gturns = ga.targets.filter(x => x.kind === 'sta');
  ok(first.kind === 'sta' && Math.abs(first.p - 2) < 0.3, 'Todi ga flows in from below on its lower turn (the R2 position): ' + first.kind + ' ' + first.p.toFixed(2));
  ok(Math.abs(gturns[gturns.length - 1].p - 5) < 0.3 && /touches the next swara/.test(ga.why), 'Todi ga touches ma before it settles: ' + ga.why);
  ok(ga.targets[ga.targets.length - 1].kind === 'cpn' && Math.abs(ga.targets[ga.targets.length - 1].p - 3) < 1e-9, 'and still comes to rest on ga');
  // G3c (S209): a held N3 before S is a kampita close to S; G4m: M1 rising from G3 to P is sung G3 P G3
  const n3 = ALL.filter(r => E.getProfile(r).gamaka.basis === 'default' && [11, 8].every(pc => unionPcs(r).has(pc)) && ![9, 10].some(pc => unionPcs(r).has(pc)));
  n3.slice(0, 4).forEach(r => { const n = E.renderGamaka(notesOf([7, [11, 3], 12]), { raga: r, slotSec: 0.3, landing: false, intensity: 0.7 }).notes[1]; ok(/kampita/.test(n.shape) && n.form.hi === 12, r.name + ': N3 before S, held: ' + n.rule + ' (' + n.grammar + ')'); });
  // (with R2 below G3: after R1, G3 rises into M1 across the augmented second (G3a) and M1 is held flat beside it)
  const m1 = ALL.filter(r => E.getProfile(r).gamaka.basis === 'default' && [2, 4, 5, 7].every(pc => unionPcs(r).has(pc)));
  m1.slice(0, 6).forEach(r => { const n = E.renderGamaka(notesOf([4, [5, 3], 7]), { raga: r, slotSec: 0.3, landing: false, intensity: 0.7 }).notes[1]; ok(n.grammar === 'G4m' && n.form.lo === 4 && n.form.hi === 7, r.name + ': G3 M1 P sings M1 between G3 and P: ' + n.rule); });
  t.diagnostic(swings + ' swings within the speed limit; ' + cycles + ' cycles, the longest ' + maxCycle.toFixed(3) + ' s');
  done();
});

test('expression and the legato voice: phrases, stress, breaths, loudness; straight notes sung legato', t => {
  const { ok, done } = checker(t);
  const SYL = { S: 'sa', R: 'ri', G: 'ga', M: 'ma', P: 'pa', D: 'dha', N: 'ni' };
  ['mela8', 'mela65', 'mela29', 'mohanam'].forEach((id, ri) => {
    const r = byId(id), pcs = unionPcs(r), kopts = { aksharas: 16, perAkshara: 2, startPitch: 0, eduppuPitch: pcs.has(7) ? 7 : 12, T: 1, seed: 31 + ri };
    const res = E.kalpana(r, kopts), before = JSON.stringify(res.notes);
    const opts = { raga: r, slotSec: 0.3, intensity: 0.55, units: res.units, seed: 7, per: 2, cycleBeats: 8, angaStarts: [0, 4, 6] };
    const a = E.renderGamaka(res.notes, opts), b = E.renderGamaka(res.notes, opts), ex = a.expression;
    ok(JSON.stringify(ex) === JSON.stringify(b.expression), r.name + ': the expression is deterministic');
    ok(JSON.stringify(res.notes) === before, r.name + ': the notes are not changed');
    const sounding = res.notes.map((n, i) => n.p != null ? i : -1).filter(i => i >= 0);
    ok(sounding.every(i => ex.notes[i].phrase >= 0 && ex.phrases[ex.notes[i].phrase].i0 <= i && i <= ex.phrases[ex.notes[i].phrase].i1), r.name + ': every swara belongs to a phrase');
    ok(ex.phrases.every(ph => ex.notes[ph.i0].first && ex.notes[ph.i0].accent >= 0.8 && ex.notes[ph.i0].onset === 'phrase'), r.name + ': a phrase starts with a fresh, stressed attack');
    ok(ex.phrases.every(ph => ph.t1 - ph.t0 <= 7.5), r.name + ': phrases are a breath long');
    ok(ex.gain.length === a.groups.length && ex.gain.every(g => g.every(x => x.g >= 0 && x.g < 1.4)), r.name + ': a loudness curve per group, in range');
    // a phrase boundary without a rest takes a breath: the loudness dips just before it
    ex.phrases.slice(1).forEach(ph => {
      if (res.notes[ph.i0 - 1].p == null) return;
      const tb = a.notes[ph.i0].t0, g = ex.gain.flat().filter(x => x.t > tb - 0.06 && x.t < tb);
      ok(g.length > 0 && Math.min.apply(null, g.map(x => x.g)) < 0.4, r.name + ': a breath before the phrase at ' + tb.toFixed(2) + ' s');
    });
    ok(sounding.every(i => ex.notes[i].syllable === SYL[r.labels[E.mod12(res.notes[i].p)][0]]), r.name + ': each swara is sung on its name');
    // intensity 0 with the voice: no gamaka, the holds on their swaras, and the steps sung legato
    const v = E.renderGamaka(res.notes, Object.assign({}, opts, { intensity: 0, voice: true }));
    ok(v.voice === true && v.stats.gamakaShare === 0, r.name + ': the straight voice has no gamaka');
    v.notes.forEach(n => { if (n.p == null) return; n.targets.forEach(x => v.points.filter(pt => pt.t >= x.t && pt.t <= x.t + x.dur).forEach(pt => ok(Math.abs(pt.p - n.p) <= 0.3, r.name + ': a straight hold stays on its swara'))); });
    const between = v.points.filter(pt => { const n = v.notes.find(x => pt.t >= x.t0 && pt.t < x.t1); return n && n.p != null && Math.abs(pt.p - n.p) > 0.35; });
    ok(between.length > 0, r.name + ': the voice moves between swaras instead of stepping');
    const plain = E.renderGamaka(res.notes, Object.assign({}, opts, { intensity: 0 }));
    ok(plain.voice === false && plain.points.every(pt => Number.isInteger(pt.p)), r.name + ': without voice, intensity 0 is still the stepped contour');
  });
  done();
});
