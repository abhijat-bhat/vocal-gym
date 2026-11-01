import { test } from 'node:test';
import { E, ALL, checker } from './helpers.js';

const byId = id => ALL.find(r => r.id === id);
const WELL_DOCUMENTED = ['mela65', 'mela8', 'mohanam', 'hamsadhwani', 'mela58'];   // Kalyani, Todi, Mohanam, Hamsadhwani, Hemavati
const run = (ps, from, w) => ps.slice(from, from + w).join(',');

test('well-documented ragas sing their attested phrases at T 0 (plan 7)', t => {
  const { ok, done } = checker(t);
  const rows = [];
  WELL_DOCUMENTED.forEach(id => {
    const r = byId(id), prof = E.getProfile(r), byPid = Object.fromEntries(prof.phrases.map(p => [p.id, p]));
    let attested = 0, signature = 0;
    for (let s = 1; s <= 20; s++) {
      const res = E.kalpana(r, { aksharas: 8, perAkshara: 2, startPitch: 0, eduppuPitch: 7, T: 0, seed: s });
      ok(res && res.stats.profileCoverage === 'phrases', id + ': coverage phrases');
      const ph = res.units.filter(u => u.kind === 'phrase' || u.kind === 'phrase-fragment');
      if (ph.length) attested++;
      if (ph.some(u => u.type === 'signature')) signature++;
      res.units.filter(u => u.phraseId).forEach(u => {
        const src = byPid[u.phraseId], ps = u.notes.map(n => n.p);
        ok(!!src && u.source === src.source && !!E.getSource(u.source), id + ': unit names its phrase and source');
        if (!src) return;
        if (u.kind === 'phrase') {
          const exact = ps.join(',') === src.pitches.join(','), oct = !src.octaveCertain && [12, -12].some(d => ps.join(',') === src.pitches.map(p => p + d).join(','));
          ok(exact || oct, u.phraseId + ': a phrase unit matches its profile pitches (or an octave shift when the octave was inferred): ' + ps.join(' '));
          // (v0.4: a phrase that ends a planned phrase also carries the phrase's karvai on its last swara, u.karvai)
          if (exact) ok(u.notes.map((n, k) => k === u.notes.length - 1 ? n.dur - (u.karvai || 0) : n.dur).join(',') === src.durs.join(','), u.phraseId + ': and its karvais');
        } else if (u.kind === 'phrase-fragment') {
          let found = false; for (let k = 0; k + ps.length <= src.pitches.length; k++) if (run(src.pitches, k, ps.length) === ps.join(',')) found = true;
          ok(found && ps.length >= 3 && ps.length <= 5, u.phraseId + ': a fragment is a 3 to 5 swara window of its phrase');
        }
      });
    }
    rows.push(r.name + ' ' + attested + '/20 (signature-type ' + signature + '/20)');
    ok(attested >= 16, r.name + ': an attested phrase in ' + attested + ' of 20 rounds');
  });
  t.diagnostic('rounds at T 0 with at least one attested phrase or fragment: ' + rows.join(', '));
  done();
});

test('phrases make up most of a round at low temperature, variants take over at high (plan 2.5)', t => {
  const { ok, done } = checker(t);
  const HM = ALL.filter(r => ['high', 'medium'].includes(E.getProfile(r).confidence));
  ok(HM.length === 27, '27 ragas with phrase confidence high or medium');
  const acc = {};
  ['free', 'auto'].forEach(ending => [0, 1, 2].forEach(T => {
    const a = acc[ending + T] = { n: 0, phrase: 0, variant: 0, novel: 0, avoid: 0 };
    HM.forEach((r, ri) => {
      const e = r.aro.map(E.mod12).includes(7) ? 7 : 12, P = E.makeProjector(r), hardAvoid = E.getProfile(r).avoid.filter(x => x.strength === 'hard');
      for (let s = 1; s <= 10; s++) {
        const res = E.kalpanaRound(r, { aksharas: 8, perAkshara: 2, startPitch: 0, eduppuPitch: e, T, seed: s * 7 + ri, ending });
        if (res.error) { ok(false, r.name + ': ' + res.error); continue; }
        a.n++; a.phrase += res.stats.phraseShare; a.variant += res.stats.variantShare; a.novel += res.stats.novelShare;
        const ps = res.notes.map(n => n.p).join(',') + ',';
        hardAvoid.forEach(h => { if (ps.includes(h.pitches.join(',') + ',')) a.avoid++; });
        ok(res.notes.reduce((x, n) => x + n.dur, 0) === 16, 'exact length');
        ok(res.notes.every(n => n.p >= -5 && n.p <= 19), 'in range');
        for (let i = 1; i < res.notes.length; i++) ok(P.valid(res.notes[i - 1].p, res.notes[i].p), r.name + ': direction rule');
        ok(Math.abs(res.stats.novelShare + res.stats.convShare + res.units.filter(u => u.kind === 'step' || u.kind === 'start').reduce((x, u) => x + u.notes.reduce((y, n) => y + n.dur, 0), 0) / 16 - 1) < 1e-9, 'shares add up');
      }
    });
    ['phrase', 'variant', 'novel'].forEach(k => { a[k] /= a.n; });
  }));
  const row = k => { const a = acc[k]; return 'phraseShare ' + a.phrase.toFixed(3) + ', variantShare ' + a.variant.toFixed(3) + ', novelShare (variants + unconventional) ' + a.novel.toFixed(3) + ', hard-avoid runs ' + a.avoid; };
  [0, 1, 2].forEach(T => t.diagnostic('acceptance 2.5, free ending, T ' + T + ': ' + row('free' + T)));
  [0, 1, 2].forEach(T => t.diagnostic('for reference, auto ending (mostly moras, which are not phrase slots), T ' + T + ': ' + row('auto' + T)));
  ok(acc.free0.phrase >= 0.55, 'T 0 ' + row('free0'));
  ok(acc.free1.phrase >= 0.40, 'T 1 ' + row('free1'));
  ok(acc.free2.phrase >= 0.20 && acc.free2.phrase <= 0.45, 'T 2 ' + row('free2'));
  ok(acc.free2.novel >= 0.25, 'T 2 novelty ' + row('free2'));
  ['free', 'auto'].forEach(en => [0, 1, 2].forEach(T => ok(acc[en + T].avoid === 0, 'no hard-avoid runs ' + en + ' T ' + T)));
  done();
});

test('profile coverage, and ragas without phrases fall back to generic devices', t => {
  const { ok, done } = checker(t);
  const seen = { phrases: 0, 'roles-only': 0, none: 0 };
  ALL.forEach((r, ri) => {
    const res = E.kalpana(r, { aksharas: 8, perAkshara: 2, startPitch: 0, eduppuPitch: 0, T: 1, seed: ri + 1 });
    seen[res.stats.profileCoverage]++;
    const p = E.getProfile(r);
    if (!p.phrases.length) ok(!res.units.some(u => u.phraseId), r.name + ': no phrase units without phrase data');
    if (p.phrases.length) ok(res.stats.profileCoverage === 'phrases', r.name + ': coverage');
  });
  E.setProfiles({});
  const bare = E.kalpana(byId('mela65'), { aksharas: 8, perAkshara: 2, startPitch: 0, eduppuPitch: 7, T: 0, seed: 2 });
  ok(bare && bare.stats.profileCoverage === 'none' && !bare.units.some(u => u.phraseId), 'with no profile at all, v0.2-style generic devices');
  E.setProfiles(null);
  t.diagnostic('coverage over 86 ragas: ' + Object.entries(seen).map(([k, v]) => k + ' ' + v).join(', '));
  done();
});

test('direction-rule exceptions only with allowExceptions, and then whole (plan 2.6)', t => {
  const { ok, done } = checker(t);
  let offAnya = 0, onRounds = 0, onExc = 0;
  ALL.forEach(r => {
    const p = E.getProfile(r);
    if (!p.exceptions.length) return;
    const pcs = new Set(r.aro.concat(r.avaro).map(E.mod12)), P = E.makeProjector(r);
    for (let s = 1; s <= 12; s++) {
      const o = { aksharas: 16, perAkshara: 2, startPitch: 0, eduppuPitch: 7, T: 0.5, seed: s, ending: 'free' };
      if (!pcs.has(7)) o.eduppuPitch = 12;
      const off = E.kalpana(r, o);
      if (off.notes.some(n => !pcs.has(E.mod12(n.p)))) offAnya++;
      for (let i = 1; i < off.notes.length; i++) ok(P.valid(off.notes[i - 1].p, off.notes[i].p), r.name + ': direction rule with exceptions off');
      const on = E.kalpana(r, Object.assign({ allowExceptions: true }, o));
      onRounds++;
      on.units.filter(u => u.exception).forEach(u => {
        onExc++;
        const src = p.exceptions.find(x => x.id === u.phraseId);
        ok(src && u.notes.map(n => n.p).join(',') === src.pitches.join(','), r.name + ': an exception is emitted whole');
      });
      // outside exception units every step still obeys the raga
      const flat = []; on.units.forEach(u => u.notes.forEach((n, k) => flat.push({ p: n.p, inside: !!u.exception && k > 0 })));
      for (let i = 1; i < flat.length; i++) if (!flat[i].inside) ok(P.valid(flat[i - 1].p, flat[i].p), r.name + ': legal at entry and exit of exceptions');
    }
  });
  ok(offAnya === 0, 'no anya swara without allowExceptions');
  ok(onExc > 0, 'some exception phrases appear when allowed');
  t.diagnostic('exceptions off: ' + offAnya + ' rounds with an anya swara; on: ' + onExc + ' exception phrases in ' + onRounds + ' rounds');
  done();
});

/* moves the raga's own phrases make, plus its scale steps: pitch class to pitch class, up or down */
function idiomOf(r) {
  const key = (a, b) => E.mod12(a) * 26 + E.mod12(b) * 2 + (b > a ? 1 : 0), set = new Set();
  E.getProfile(r).phrases.forEach(ph => { for (let k = 1; k < ph.pitches.length; k++) if (ph.pitches[k] !== ph.pitches[k - 1]) set.add(key(ph.pitches[k - 1], ph.pitches[k])); });
  const pcs = Array.from(new Set(r.aro.concat(r.avaro).map(E.mod12))).sort((a, b) => a - b), notes = [];
  for (let o = -1; o <= 1; o++) pcs.forEach(pc => { const x = pc + 12 * o; if (x >= -5 && x <= 19) notes.push(x); });
  notes.sort((a, b) => a - b);
  const P = E.makeProjector(r);
  for (let k = 1; k < notes.length; k++) { if (P.valid(notes[k - 1], notes[k])) set.add(key(notes[k - 1], notes[k])); if (P.valid(notes[k], notes[k - 1])) set.add(key(notes[k], notes[k - 1])); }
  return { has: (a, b) => set.has(key(a, b)), notes };
}

test('no erratic jumps: leap sizes capped, and moves follow the raga\'s own phrases', t => {
  const { ok, done } = checker(t);
  const acc = {};
  [0, 0.5, 1, 1.4, 2].forEach(T => {
    const a = acc[T] = { moves: 0, idiom: 0, leaps: 0, leapIdiom: 0, overFifth: 0, overSixth: 0, abs: 0 };
    ALL.forEach((r, ri) => {
      const pcs = Array.from(new Set(r.aro.concat(r.avaro).map(E.mod12))), id = E.getProfile(r).phrases.length ? idiomOf(r) : null;
      for (let s = 1; s <= 6; s++) {
        const res = E.kalpana(r, { aksharas: 8, perAkshara: 2, startPitch: 0, eduppuPitch: pcs.includes(7) ? 7 : 12, T, seed: s + ri * 11, ending: 'free' });
        const L = res.stats.leaps;
        if (!res.stats.relaxed) {
          a.overFifth += L.outsidePhrases.overFifth;
          // leaps outside attested phrases wider than a major sixth (the octave excepted) are never allowed
          const flat = []; res.units.forEach(u => u.notes.forEach((n, k) => flat.push({ p: n.p, inside: (u.kind === 'phrase' || u.kind === 'phrase-fragment') && k > 0 })));
          for (let k = 1; k < flat.length; k++) { const d = Math.abs(flat[k].p - flat[k - 1].p); if (!flat[k].inside && d > 9 && d !== 12) a.overSixth++; }
        }
        const ps = res.notes.map(n => n.p);
        for (let k = 1; k < ps.length; k++) {
          a.abs += Math.abs(ps[k] - ps[k - 1]);
          if (!id || ps[k] === ps[k - 1]) continue;
          a.moves++; const yes = id.has(ps[k - 1], ps[k]); if (yes) a.idiom++;
          if (Math.abs(id.notes.indexOf(ps[k]) - id.notes.indexOf(ps[k - 1])) >= 2) { a.leaps++; if (yes) a.leapIdiom++; }
        }
      }
    });
  });
  const row = T => { const a = acc[T]; return 'T ' + T + ': moves in the raga\'s idiom ' + (100 * a.idiom / a.moves).toFixed(1) + '%, leaps in idiom ' + (100 * a.leapIdiom / a.leaps).toFixed(1) + '%, leaps wider than a fifth outside phrases ' + a.overFifth + ', wider than a sixth ' + a.overSixth; };
  [0, 0.5, 1, 1.4, 2].forEach(T => t.diagnostic(row(T)));
  [0, 0.5, 1, 1.4].forEach(T => ok(acc[T].overFifth === 0, 'below T 1.5 no leap outside a phrase is wider than a fifth: ' + row(T)));
  [0, 0.5, 1, 1.4, 2].forEach(T => ok(acc[T].overSixth === 0, 'no leap outside a phrase is wider than a major sixth, except the octave: ' + row(T)));
  ok(acc[0].idiom / acc[0].moves >= 0.93 && acc[0].leapIdiom / acc[0].leaps >= 0.7, 'T 0 follows the raga\'s idiom: ' + row(0));
  ok(acc[1].idiom / acc[1].moves >= 0.85, 'T 1 mostly follows the raga\'s idiom: ' + row(1));
  // the reported openings: Kalyani jumping from S straight up to N (or tara N), then into a fragment
  const k = byId('mela65');
  for (let s = 1; s <= 60; s++) [0, 0.5, 1, 1.2].forEach(T => ['auto', 'free', 'mora'].forEach(ending => {
    const res = E.kalpana(k, { aksharas: 8, perAkshara: 2, startPitch: 0, eduppuPitch: 7, T, seed: s, ending });
    ok(!(res.notes[0].p === 0 && [11, 23].includes(res.notes[1].p)), 'Kalyani no longer opens S → N (T ' + T + ', seed ' + s + ')');
  }));
  done();
});
