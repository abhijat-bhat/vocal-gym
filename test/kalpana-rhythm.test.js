/* v0.8.3 kalpana swaras on a rhythm from the korvai lab: the lab's pulses kept exactly (every swara where
   its syllable is, every gap a karvai), the raga's direction rule on every move, nested families (yatis,
   AP, GP, kuraippu purvangas, shaped moras) sung from one line and keeping its ending, repeats identical or
   a sequence, and the landing next to the eduppu. v0.8.5: not every syllable needs its own swara (weak
   a few swaras are held, at random word ends and never on a schedule; phrase starts and cadence endings sound), and suggested lines
   (a language model's answer to rhythmPrompt) are sung only where every hard rule holds. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { E, ALL, checker } from './helpers.js';

const K = E.korvai;
const byId = id => ALL.find(r => r.id === id);
const isSyl = s => !!s && s !== ',';
// a lab variation as the lab hands it over
const template = (F, item) => { const R = K.exploreRealize(F, item); return { R, t: E.rhythmTemplate(R.frame || F, R.layout, { label: item.label, form: R.kind }) }; };

test('the lab’s rhythm is sung pulse for pulse, in the raga, with its families and landing', t => {
  const { ok, done } = checker(t);
  const ragas = ['mela65', 'mohanam', 'mela8', 'bilahari', 'hamsadhwani', 'mela29', 'mela15'].map(byId).filter(Boolean);
  const frames = [K.korvaiFrame({ cycles: 2 }), K.korvaiFrame({ cycles: 3 }), K.korvaiFrame({ fam: 'rupaka', L: 4, cycles: 2, land: 2 }), K.korvaiFrame({ fam: 'chapu', L: 7, gati: 4, cycles: 2, start: 2 })];
  let n = 0, swaras = 0, syllables = 0, beatsOn = 0, beatsAll = 0, swings = 0;
  frames.forEach((F, fi) => [['korvai', { shape: 'any' }], ['mora', { n: 'any', shape: 'any' }], ['statements', {}], ['progressive', {}], ['chakradar', {}]].forEach(([form, o]) => {
    const sp = K.exploreSpace(F, form, o), order = K.exploreOrder(sp, { T: 1 });
    order.slice(0, 6).forEach(k => {
      const { t: tp } = template(F, sp.items[k]), body = tp.cells.filter(c => c.r !== 'pre' && c.r !== 'close');
      // the onsets the lab allows: every syllable outside a gap; the ones that must sound: each phrase's
      // first syllable and a cadence's last syllable (and every syllable of a trikaala); beats mostly sound
      const want = new Set(); body.forEach((c, i) => { if (isSyl(c.s) && c.r !== 'gap' && c.r !== 'pgap') want.add(i); });
      const lead = tp.cells.filter(c => c.r === 'pre').length, must = new Set(), beats = [];
      E.rhythmPhrases(tp).phrases.forEach(q => { must.add(q.sc[0]); if (q.role === 'statement' || q.role === 'uttaranga') must.add(q.sc[q.sc.length - 1]); if (F.gati <= 2 || /^speed/.test(q.role)) q.sc.forEach(i => must.add(i)); q.sc.forEach(i => { if ((lead + i) % F.gati === 0) beats.push(i); }); });
      ragas.forEach((r, ri) => [0, 1.6].forEach(T => {
        const P = E.makeProjector(r), pcs = new Set(r.aro.concat(r.avaro).map(E.mod12)), edu = pcs.has(7) ? 7 : 12;
        const tag = 'frame ' + fi + ' ' + form + ' ' + sp.items[k].label + ' · ' + r.id + ' T ' + T;
        const res = E.kalpanaRhythm(r, tp, { eduppuPitch: edu, T, seed: 1 + ri });
        if (res.error) { ok(res.code === 'unsingable', tag + ': ' + res.error); return; }
        n++;
        ok(res.ok, tag + ': ' + res.checks.filter(c => !c.ok).map(c => c.text).join(' '));
        ok(res.slots === body.length && res.lead === tp.cells.filter(c => c.r === 'pre').length, tag + ' length');
        const on = []; let at = 0; res.notes.forEach(x => { if (x.p != null) on.push(at); at += x.dur; });
        ok(on.every(i => want.has(i)), tag + ' every swara starts on a syllable');
        ok([...must].every(i => on.includes(i)), tag + ' phrase starts and cadence endings sound');
        beatsOn += beats.filter(i => on.includes(i)).length; beatsAll += beats.length;
        ok(res.breath.swaras === on.length && res.breath.syllables === want.size, tag + ' breath counted');
        // held swaras are rare and at word ends: every sollu word starts on a swara, a swara is held only at
        // a word's last syllable (or the second of a five), held places are at least six syllables apart,
        // and repeated phrases (a family's members of one length) share their held places
        const rp = E.rhythmPhrases(tp).phrases, same = {};
        rp.forEach((q, k) => {
          const mask = res.phrases[k].mask, held = [];
          mask.forEach((x, j) => { if (!x) held.push(j); });
          q.words.forEach(w => {
            ok(mask[w.a] === 1, tag + ' word "' + w.key + '" starts on a swara');
            for (let j = 1; j < w.n; j++) if (!mask[w.a + j]) ok(j === w.n - 1 || (j === 1 && w.n >= 5), tag + ' word "' + w.key + '" held only at its end');
          });
          ok(held.every((j, x) => x === 0 || j - held[x - 1] >= 6), tag + ' held swaras at least six syllables apart');
          const key = q.fam + ':' + q.sylls.length;
          if (same[key] == null) same[key] = mask.join(''); else ok(same[key] === mask.join(''), tag + ' repeated phrases share their held places');
        });
        ok(res.phrases.every(p => p.mask.length && p.mask[0] === 1 && p.pitches.length === p.mask.reduce((a, b) => a + b, 0)), tag + ' one swara for each kept syllable');
        swaras += on.length; syllables += want.size;
        const seq = res.notes.filter(x => x.p != null).map(x => x.p);
        ok(seq.every((p, i) => i === 0 || P.valid(seq[i - 1], p)), tag + ' direction rule');
        // no pair of swaras swung back and forth (S R S R S); a four-note swing (S R S R) is rare
        ok(!seq.some((p, i) => i >= 4 && p === seq[i - 2] && p === seq[i - 4] && seq[i - 1] === seq[i - 3] && p !== seq[i - 1]), tag + ' no swing between two swaras');
        seq.forEach((p, i) => { if (i >= 3 && p === seq[i - 2] && seq[i - 1] === seq[i - 3] && p !== seq[i - 1]) swings++; });
        ok(seq.every(p => pcs.has(E.mod12(p)) && p >= -5 && p <= 19), tag + ' swaras of the raga, in range');
        const nb = E.eduppuNeighbours(r, edu); ok([nb.lo, nb.hi].includes(res.ending.final) && seq[seq.length - 1] === res.ending.final, tag + ' lands next to the eduppu');
        res.families.forEach(f => {
          const fp = res.phrases.filter(p => p.family === f.id), members = fp.map(p => p.pitches);
          if (f.kind === 'nested') for (let r = 0; r < f.rounds; r++) {
            // each round of a yati keeps one ending; below creativity 1 its lines are the ends of the round's longest
            const rm = fp.filter(p => p.round === r).map(p => p.pitches), top = rm.reduce((a, b) => b.length > a.length ? b : a, rm[0]);
            ok(new Set(rm.map(m => m[m.length - 1])).size === 1, tag + ' nested family ' + f.id + ' round ' + r + ' keeps one ending');
            // (an opening bridged into the phrase before, in a raga whose arohana and avarohana differ, may differ in its first two swaras)
            const rp = fp.filter(p => p.round === r), tp0 = rp.reduce((a, b) => b.pitches.length > a.pitches.length ? b : a, rp[0]);
            const tail = p => Math.min(p.pitches.length - (p.bridged ? 2 : 0), tp0.pitches.length - (tp0.bridged ? 2 : 0));
            if (T < 1) ok(rp.every(p => tail(p) <= 0 || p.pitches.slice(-tail(p)).join() === tp0.pitches.slice(-tail(p)).join()), tag + ' nested family ' + f.id + ' round ' + r + ' is the ends of one line');
          }
          if (f.kind === 'repeat' && f.style === 'repeat') { const cut = fp.some(p => p.bridged) ? 2 : 0; ok(members.every(m => m.slice(cut).join() === members[0].slice(cut).join()), tag + ' repeats are identical (but for a bridged opening)'); }
          // a repeated rhythm is not a repeated melody: a sequence or a varied family re-sings its repetitions
          if (f.kind === 'repeat' && (f.style === 'sequence' || f.style === 'varied') && members.length > 1) ok(new Set(members.map(m => m.join())).size > 1, tag + ' repetitions differ (' + f.style + ')');
          if (f.kind === 'repeat' && f.id === res.phrases[res.phrases.length - 1].family) ok(members[members.length - 1][members[members.length - 1].length - 1] === res.ending.final, tag + ' the cadence’s last repetition lands');
          // lines move by step or a skip, never a leap of more than a fifth
          ok(members.every(m => m.every((p, i) => i === 0 || Math.abs(p - m[i - 1]) <= 7)), tag + ' no leap inside a phrase');
        });
      }));
    });
  }));
  t.diagnostic(n + ' passages sung, ' + Math.round(100 * swaras / syllables) + '% of syllables carry a new swara');
  ok(swaras / syllables > 0.86 && swaras / syllables < 0.97, 'held swaras are rare: most syllables start a swara (' + swaras + ' of ' + syllables + ')');
  ok(swings / swaras < 0.01, 'four-note swings are rare (' + swings + ' in ' + swaras + ' swaras)');
  ok(beatsOn / beatsAll >= 0.8, 'a swara starts on most beats (' + beatsOn + ' of ' + beatsAll + ')');
  t.diagnostic(Math.round(100 * beatsOn / beatsAll) + '% of beats start a swara');
  done();
});

test('the shapes are heard in the melody: a gopuccha keeps its ending, kuraippu halves, a mora repeats', () => {
  const F = K.korvaiFrame({ cycles: 3 }), sp = K.exploreSpace(F, 'korvai', { shape: 'any' }), kal = byId('mela65');
  ['gopuccha', 'kuraippu', 'gp', 'damaru', 'fib'].forEach(kind => {
    const item = sp.items.find(x => x.spec.purvanga.kind === kind && x.spec.shape === 'sama' && x.spec.texture === 'standard');
    if (!item) return;
    const res = E.kalpanaRhythm(kal, template(F, item).t, { eduppuPitch: 7, T: 0.6, seed: 4 });
    assert.ok(res.ok, kind);
    const pv = res.families.find(f => f.role === 'purvanga' && f.kind === 'nested');
    assert.ok(pv, kind + ': the purvanga is one nested family');
    const lens = res.phrases.filter(p => p.family === pv.id).map(p => p.mask.length);
    assert.deepEqual(lens, item.spec.purvanga.lines.map(l => l.len), kind + ': the phrase lengths are the purvanga’s (' + lens + ')');
    const ends = new Set(res.phrases.filter(p => p.family === pv.id).map(p => p.pitches[p.pitches.length - 1]));
    assert.equal(ends.size, 1, kind + ': every line ends on the same swara');
    const cad = res.families.find(f => f.role === 'statement');
    assert.equal(cad.kind, 'repeat', kind + ': the mora repeats');
  });
  // deterministic, and the seed varies it
  const it = sp.items[K.exploreOrder(sp, { T: 0.4 })[0]], tp = template(F, it).t;
  assert.deepEqual(E.kalpanaRhythm(kal, tp, { eduppuPitch: 7, seed: 2 }).notes, E.kalpanaRhythm(kal, tp, { eduppuPitch: 7, seed: 2 }).notes);
  assert.notDeepEqual(E.kalpanaRhythm(kal, tp, { eduppuPitch: 7, seed: 2 }).notes, E.kalpanaRhythm(kal, tp, { eduppuPitch: 7, seed: 9 }).notes);
  // karvai as rests on request
  const rr = E.kalpanaRhythm(kal, tp, { eduppuPitch: 7, karvai: 'rest', seed: 2 });
  assert.ok(rr.ok && rr.notes.some(x => x.p === null));
  // trikaala: one jati at three speeds, the same swaras each time
  const tk = K.trikaala({ fam: 'triputa', L: 4, n: 5 }), tt = E.rhythmTemplate(tk.frame, tk.layout, {});
  const tr = E.kalpanaRhythm(kal, tt, { eduppuPitch: 7, T: 0.2, seed: 1 });
  assert.ok(tr.ok); assert.equal(new Set(tr.phrases.map(p => p.pitches.join())).size, 1, 'trikaala sings one phrase at three speeds');
});

test('a repeated rhythm is not a repeated melody: shapes move across the scale, and creativity re-sings them', t => {
  const { ok, done } = checker(t);
  const kal = byId('mela65'), F = K.korvaiFrame({ gati: 5, cycles: 5 }), sp = K.exploreSpace(F, 'statements', {});
  const posOf = p => { const pcs = [0, 2, 4, 6, 7, 9, 11]; return Math.floor(p / 12) * 7 + pcs.indexOf(E.mod12(p)); };
  let movedRounds = 0, total = 0, kept = 0, seqs = 0, varied = 0, identicalAtHigh = 0, highFams = 0;
  K.exploreOrder(sp, { T: 0.6 }).slice(0, 10).forEach(k => {
    const tp = template(F, sp.items[k]).t;
    [1, 2, 3, 4, 5, 6].forEach(seed => [0, 0.8, 1.8].forEach(T => {
      const res = E.kalpanaRhythm(kal, tp, { eduppuPitch: 7, T, seed });
      if (res.error) return;
      res.families.forEach(f => {
        const fp = res.phrases.filter(p => p.family === f.id);
        if (f.kind === 'nested' && f.rounds > 1) {
          // the purvanga of each of the three statements: the yati moved to another swara, not copied
          total++;
          const sig = r => fp.filter(p => p.round === r).map(p => p.pitches.join()).join('|');
          if (new Set(Array.from({ length: f.rounds }, (_, r) => sig(r))).size === f.rounds) movedRounds++;
        }
        if (f.kind === 'repeat' && f.style === 'sequence') {
          // at low creativity a sequence keeps the melodic shape: the same steps of the scale, from another swara
          seqs++;
          const shape = m => m.slice(1).map((p, i) => posOf(p) - posOf(m[i])).join();
          if (new Set(fp.map(p => shape(p.pitches))).size === 1) kept++;
        }
        if (f.kind === 'repeat' && f.style === 'varied') varied++;
        if (T === 1.8 && f.kind === 'repeat' && fp.length > 1) { highFams++; if (new Set(fp.map(p => p.pitches.join())).size === 1) identicalAtHigh++; }
      });
    }));
  });
  ok(total > 0 && movedRounds / total >= 0.9, 'the rounds of a repeated yati are moved (' + movedRounds + ' of ' + total + ')');
  ok(seqs > 0 && kept / seqs >= 0.8, 'sequences keep the shape in a sampurna raga (' + kept + ' of ' + seqs + ')');
  ok(varied > 0, 'high creativity varies repetitions (' + varied + ' families)');
  ok(highFams > 0 && identicalAtHigh / highFams <= 0.15, 'at creativity 1.8 exact repetition is rare (' + identicalAtHigh + ' of ' + highFams + ')');
  done();
});

test('templates are checked, and the errors explain themselves', () => {
  const kal = byId('mela65'), F = K.korvaiFrame({ cycles: 2 }), sp = K.exploreSpace(F, 'mora', {}), tp = template(F, sp.items[0]).t;
  for (const bad of [null, {}, { v: 2 }, Object.assign({}, tp, { gati: 40 }), Object.assign({}, tp, { cells: [] }), Object.assign({}, tp, { cells: [{ s: '<x>', r: 'statement', f: 1 }] }), Object.assign({}, tp, { tala: { fam: 'nope', L: 4 } }), Object.assign({}, tp, { cells: tp.cells.map(c => ({ s: ',', r: 'gap', f: c.f })) })])
    assert.ok(E.kalpanaRhythm(kal, bad, { eduppuPitch: 7 }).error, JSON.stringify(bad && bad.gati));
  assert.ok(E.kalpanaRhythm(kal, tp, {}).error, 'a landing is required');
  assert.ok(E.kalpanaRhythm(kal, tp, { eduppuPitch: 1 }).error, 'an eduppu outside the raga');
  // the last syllable on the landing is the eduppu itself: the swaras end one pulse before it
  const Fo = K.korvaiFrame({ cycles: 2, counting: 'on' }), so = K.exploreSpace(Fo, 'mora', {}), to = template(Fo, so.items[0]).t;
  assert.equal(to.cells[to.cells.length - 1].r, 'close');
  assert.ok(E.kalpanaRhythm(kal, to, { eduppuPitch: 7 }).ok);
});

test('breath: a swara need not start on every syllable, and density "full" restores one a syllable', () => {
  const kal = byId('mela65'), F = K.korvaiFrame({ gati: 5, cycles: 3 }), sp = K.exploreSpace(F, 'korvai', { shape: 'any' });
  const tp = template(F, sp.items[K.exploreOrder(sp, { T: 0.6 })[0]]).t;
  const a = E.kalpanaRhythm(kal, tp, { eduppuPitch: 7, T: 0.8, seed: 3 }), f = E.kalpanaRhythm(kal, tp, { eduppuPitch: 7, T: 0.8, seed: 3, density: 'full' });
  assert.ok(a.ok && f.ok);
  assert.ok(a.breath.swaras < a.breath.syllables * 0.95, 'held syllables in khanda gati (' + a.breath.swaras + ' of ' + a.breath.syllables + ')');
  assert.equal(f.breath.swaras, f.breath.syllables);
  assert.equal(a.slots, f.slots);
  // a repeat breathes alike: the same mask for each repetition
  a.families.filter(x => x.kind === 'repeat').forEach(x => { const ms = a.phrases.filter(p => p.family === x.id).map(p => p.mask.join('')); assert.equal(new Set(ms).size, 1); });
});

test('inspiration: the prompt has every specific, and suggested lines are fitted and checked', () => {
  const kal = byId('mela65'), F = K.korvaiFrame({ gati: 4, cycles: 2 }), sp = K.exploreSpace(F, 'korvai', { shape: 'any' });
  const tp = template(F, sp.items[K.exploreOrder(sp, { T: 0.6 })[0]]).t, P = E.makeProjector(kal);
  const pr = E.rhythmPrompt(kal, tp, { eduppuPitch: 7, T: 0.8 });
  assert.ok(pr.prompt && pr.system && pr.schema && pr.phrases > 1);
  for (const want of ['Arohana: S R2 G3 M2 P D2 N3', 'Avarohana:', 'Direction rule', 'Phrase 1 (', 'Phrase ' + pr.phrases + ' (', 'must end on', 'Creativity 0.8', 'JSON', 'Darbar']) assert.ok(pr.prompt.includes(want), 'the prompt says ' + want);
  assert.ok(E.rhythmPrompt(kal, { v: 9 }, { eduppuPitch: 7 }).error);
  // notation
  const sw = E.parseSwaras("S , R2 g3 , P. N' - d", kal).tokens;
  assert.deepEqual(sw, [0, null, 2, 4, null, -5, 23, null, 9]);
  const pi = E.parseInspiration('Here you go:\n```json\n{"idea":"x","phrases":[{"phrase":1,"swaras":"S R"}]}\n```', kal);
  assert.ok(pi.parsed && pi.phrases[0].phrase === 0 && pi.note === 'x');
  assert.ok(E.parseInspiration('no json here', kal).error && E.parseInspiration('{"phrases":[]}', kal).error);
  // an answer of the right shape: every phrase sung from it where the rules allow, the rules kept everywhere
  const lines = ['P , M G , R S ,', "S R G , M P , D", 'N D P , M G R ,', "G M P D , N S' ,"];
  const ans = JSON.stringify({ idea: 'descending runs', phrases: Array.from({ length: pr.phrases }, (_, k) => ({ phrase: k + 1, swaras: lines[k % 4] })) });
  const r = E.kalpanaRhythm(kal, tp, { eduppuPitch: 7, T: 0.8, seed: 2, inspiration: ans }), r2 = E.kalpanaRhythm(kal, tp, { eduppuPitch: 7, T: 0.8, seed: 2, inspiration: ans });
  assert.ok(r.ok, r.checks.filter(c => !c.ok).map(c => c.text).join(' '));
  assert.ok(r.inspiration.used.length >= 1 && r.inspiration.used.length + r.inspiration.set.length === pr.phrases);
  assert.ok(r.phrases.some(p => p.inspired));
  assert.deepEqual(r.notes, r2.notes, 'deterministic');
  const seq = r.notes.filter(x => x.p != null).map(x => x.p);
  assert.ok(seq.every((p, i) => i === 0 || P.valid(seq[i - 1], p)), 'direction rule');
  const nb = E.eduppuNeighbours(kal, 7); assert.ok([nb.lo, nb.hi].includes(seq[seq.length - 1]), 'lands next to the eduppu');
  assert.equal(r.slots, r.notes.reduce((s, x) => s + x.dur, 0));
  // a swara outside the raga is moved onto it; a line that cannot fit is set aside with a reason
  const odd = E.kalpanaRhythm(kal, tp, { eduppuPitch: 7, seed: 2, inspiration: { phrases: [{ phrase: 1, swaras: 'M1 , M1 R1' }, { phrase: 99, swaras: 'S' }] } });
  assert.ok(odd.ok && odd.inspiration.set.some(x => x.phrase === 99));
  odd.phrases[0].pitches.forEach(p => assert.ok(new Set(kal.aro.concat(kal.avaro).map(E.mod12)).has(E.mod12(p))));
  assert.ok(E.kalpanaRhythm(kal, tp, { eduppuPitch: 7, inspiration: 'garbage' }).inspiration.error);
});

test('contours: lines are not all a rise and a fall; the cadence runs down into its landing', t => {
  const { ok, done } = checker(t);
  const kal = byId('mela65'), F = K.korvaiFrame({ gati: 5, cycles: 3 }), sp = K.exploreSpace(F, 'korvai', { shape: 'any' });
  const kinds = new Set(), runs = [];
  let cad = 0, cadDown = 0;
  K.exploreOrder(sp, { T: 0.6 }).slice(0, 12).forEach(k => {
    const tp = template(F, sp.items[k]).t;
    [0.2, 0.8, 1.6].forEach(T => [1, 2, 3].forEach(seed => {
      const res = E.kalpanaRhythm(kal, tp, { eduppuPitch: 7, T, seed });
      if (res.error) return;
      res.families.forEach(f => {
        f.shapes.forEach(x => kinds.add(x));
        const L = f.line;
        if (f.role === 'statement' || f.role === 'uttaranga') { cad++; if (L[L.length - 2] > L[L.length - 1]) cadDown++; return; }
        if (L.length < 8) return;
        // the lengths of the line's runs in one direction: the old triangle wave ran about seven moves each way
        const mv = L.slice(1).map((p, i) => Math.sign(p - L[i]));
        let r = 1; for (let i = 1; i <= mv.length; i++) { if (i < mv.length && mv[i] && mv[i] === mv[i - 1]) r++; else { runs.push(r); r = 1; } }
      });
    }));
  });
  ok(kinds.size >= 7, 'every contour is used: ' + [...kinds].join(', '));
  ok(cadDown / cad >= 0.8, 'the cadence runs down into its landing (' + cadDown + ' of ' + cad + ')');
  const mean = runs.reduce((a, b) => a + b, 0) / runs.length, longRuns = runs.filter(x => x >= 6).length / runs.length;
  ok(mean < 3 && longRuns < 0.08, 'lines turn: mean run ' + mean.toFixed(2) + ' moves, ' + Math.round(100 * longRuns) + '% of runs six moves or longer');
  t.diagnostic('contours: ' + [...kinds].join(', ') + '; mean run ' + mean.toFixed(2) + ' moves');
  done();
});

test('every raga sings a lab rhythm, for every eduppu: asymmetric ragas (Saveri, Malahari, Arabhi) included', t => {
  // v0.8.6: in ragas whose arohana and avarohana differ, joins between phrases broke the direction rule and
  // tara Ga (reached only from above) trapped lines at the top of the range, so most attempts failed
  const { ok, done } = checker(t);
  const tps = [[4, 'korvai'], [5, 'korvai'], [3, 'mora']].map(([g, form]) => {
    const F = K.korvaiFrame({ gati: g, cycles: g === 3 ? 2 : 3 }), sp = K.exploreSpace(F, form, form === 'korvai' ? { shape: 'any' } : {});
    return template(F, sp.items[K.exploreOrder(sp, { T: 0.6 })[0]]).t;
  });
  // a vakra raga's narrow walk may leave no line for a rhythm, and then it says so; it never breaks the raga to make one
  let n = 0, tight = 0, held = 0;
  ALL.forEach(r => {
    const vakra = !!(r.krama || r.oneWay);
    const P = E.makeProjector(r), pcs = [...new Set(r.aro.concat(r.avaro).map(E.mod12))].concat([12]);
    pcs.forEach(edu => tps.forEach((tp, ti) => {
      const res = E.kalpanaRhythm(r, tp, { eduppuPitch: edu, T: 0.8, seed: 7 });
      if (res.code === 'no-neighbour') return;
      n++;
      if (vakra && res.error) { tight++; ok(/try another eduppu swara or raga/.test(res.error), r.name + ' says what to do: ' + res.error); return; }
      ok(!res.error && res.ok, r.name + ' eduppu ' + edu + ' rhythm ' + ti + ': ' + (res.error || res.checks.filter(c => !c.ok).map(c => c.text).join(' ')));
      if (res.error) return;
      const seq = res.notes.filter(x => x.p != null).map(x => x.p);
      ok(seq.every((p, i) => i === 0 || P.valid(seq[i - 1], p)), r.name + ' direction rule');
      const stuck = seq.some((p, i) => i >= 2 && p === seq[i - 1] && p === seq[i - 2] && p === seq[i - 3]);
      if (vakra) { if (stuck) held++; } else ok(!stuck, r.name + ' no swara stuck four times running');
    }));
  });
  ok(tight <= 8 && held <= 25, 'vakra ragas: ' + tight + ' with no line, ' + held + ' with a swara held four times');
  t.diagnostic(n + ' passages over ' + ALL.length + ' ragas; in vakra ragas ' + tight + ' found no line and ' + held + ' held a swara four times');
  done();
});
