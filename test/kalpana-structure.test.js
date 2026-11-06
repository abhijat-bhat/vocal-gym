/* v0.4 kalpana structure (docs/research/kalpana-structure.md, docs/plans/kalpana-v0.4.md): no jumps at the
   joins, a phrase plan with held phrase ends and focal notes, repetition, yatis, timed moras, the korvai
   and the whole-session mode. */
import { test } from 'node:test';
import { E, ALL, checker } from './helpers.js';

const byId = id => ALL.find(r => r.id === id);
const pcsOf = r => new Set(r.aro.concat(r.avaro).map(E.mod12));
const scaleOf = r => { const pcs = Array.from(pcsOf(r)).sort((a, b) => a - b), out = []; for (let o = -1; o <= 1; o++) pcs.forEach(pc => { const p = pc + 12 * o; if (p >= -5 && p <= 19) out.push(p); }); return out.sort((a, b) => a - b); };
const round = (r, o) => E.kalpanaRound(r, Object.assign({ aksharas: 16, perAkshara: 2, startPitch: 0, eduppuPitch: pcsOf(r).has(7) ? 7 : 12, T: 0, seed: 1, angas: [4, 2, 2] }, o));

test('joins: no jump between devices unless the raga attests it, or a phrase restarts after its held swara', t => {
  const { ok, done } = checker(t);
  let joins = 0, jumps = 0, restarts = 0, echoes = 0;
  ALL.forEach((r, ri) => {
    const sc = scaleOf(r), pos = p => sc.indexOf(p), attested = new Set();
    E.getProfile(r).phrases.forEach(ph => { for (let k = 1; k < ph.pitches.length; k++) attested.add(E.mod12(ph.pitches[k - 1]) * 64 + ph.pitches[k] - ph.pitches[k - 1]); });
    [0, 1].forEach(T => [1, 2, 3].forEach(s => {
      const res = round(r, { T, seed: s + ri * 7 });
      if (res.error || res.stats.relaxed) return;   // the relaxed level lifts the rule for very short spans
      let prev = null, prevDur = 0;
      res.units.forEach(u => u.notes.forEach((n, k) => {
        if (k === 0 && prev != null && u.kind !== 'mora' && u.kind !== 'korvai') {
          joins++;
          const d = Math.abs(pos(n.p) - pos(prev)), st = Math.abs(n.p - prev);
          if (d >= 3 || (d >= 2 && st > 4)) {
            jumps++;
            const isAtt = attested.has(E.mod12(prev) * 64 + n.p - prev), afterHold = prevDur >= 2;
            if (st === 12) { echoes++; ok(afterHold && u.base === 'echo', r.name + ': an octave join only as the focal echo, after a held swara'); }
            else ok(isAtt || (afterHold && st <= 7), r.name + ': join ' + prev + ' → ' + n.p + ' (' + u.name + ') is attested, or a restart within a fifth after a held swara');
            if (!isAtt && afterHold) restarts++;
          }
        }
        prev = n.p; prevDur = n.dur;
      }));
    }));
  });
  t.diagnostic(joins + ' joins, ' + jumps + ' larger than a third (' + restarts + ' phrase restarts after a held swara, ' + echoes + ' focal echoes, the rest attested)');
  done();
});

test('phrase plan: tala-shaped phrases, each ending on a held swara the raga rests on, devices inside phrases', t => {
  const { ok, done } = checker(t);
  let planned = 0, rounds = 0, held = 0, onFocal = 0, nearFocal = 0; const t0 = { held: 0, on: 0, near: 0 };
  ALL.forEach((r, ri) => {
    const sc = scaleOf(r), prof = E.getProfile(r), bad = new Set(prof.alpa.concat(prof.avoidLanding, prof.notNyasa));
    [0, 1, 2].forEach(T => [[16, 2], [8, 2], [16, 4], [8, 1]].forEach(([K, per]) => {
      const res = round(r, { T, aksharas: K, perAkshara: per, seed: ri + K + T });
      if (res.error) return;
      rounds++;
      if (res.stats.plan !== 'phrases') return;
      planned++;
      const total = res.notes.reduce((s, n) => s + n.dur, 0);
      ok(total === K * per, 'exact length with a plan');
      // every unit lies inside its phrase (or is the mora or korvai that ends the round)
      res.units.forEach(u => {
        if (u.kind === 'mora' || u.kind === 'korvai' || u.kind === 'start') return;
        const ph = res.phrases[u.phrase], end = u.t + u.notes.reduce((s, n) => s + n.dur, 0);
        ok(ph && u.t >= ph.start && end <= ph.end + ph.karvai, r.name + ': a device stays inside its phrase');
      });
      res.phrases.forEach(ph => {
        if (ph.held == null) return;   // cut short by the ending
        held++;
        ok(ph.karvai >= 1 && !bad.has(E.mod12(ph.held)), r.name + ': a phrase ends on a held swara the raga rests on');
        const on = ph.held === ph.focal, near = Math.abs(sc.indexOf(ph.held) - sc.indexOf(ph.focal)) <= 1;
        if (on) onFocal++; if (near) nearFocal++;
        if (T === 0) { t0.held++; if (on) t0.on++; if (near) t0.near++; }
      });
    }));
  });
  t.diagnostic(planned + ' of ' + rounds + ' rounds planned in phrases; ' + held + ' held phrase ends, ' + onFocal + ' on their focal note, ' + nearFocal + ' within a step of it; at T 0 ' + t0.on + ' and ' + t0.near + ' of ' + t0.held);
  ok(planned / rounds > 0.8, 'most rounds have a phrase plan');
  // at T 0 the plan is followed closely; creativity loosens it (at T 2 the plan keeps half its weight)
  ok(t0.on / t0.held > 0.55 && t0.near / t0.held > 0.75, 'at T 0 phrases end on (or next to) their focal note');
  ok(onFocal / held > 0.4 && nearFocal / held > 0.6, 'at every temperature most phrases end on or next to their focal note');
  ok(round(byId('mela65'), { phrases: false }).stats.plan === 'none', 'phrases: false gives the v0.3 round');
  done();
});

test('repetition and yatis: echoes of the last phrase, sequences a step lower, yatis onto the focus', t => {
  const { ok, done } = checker(t);
  let rounds = 0, withRep = 0, yatis = 0, rhymes = 0, seqs = 0;
  const by = { phrases: { rounds: 0, rep: 0 }, none: { rounds: 0, rep: 0 } };
  ALL.forEach((r, ri) => {
    const sc = scaleOf(r), pos = p => sc.indexOf(p);
    [1, 2, 3, 4].forEach(s => {
      const res = round(r, { aksharas: 16, T: 0, seed: s + ri * 3 });
      if (res.error || res.stats.plan !== 'phrases') return;
      rounds++;
      const cls = by[E.getProfile(r).phrases.length ? 'phrases' : 'none'];
      cls.rounds++;
      let any = false;
      res.units.forEach(u => {
        if (u.base === 'yati') {
          any = true; yatis++;
          // statements: runs onto one swara, shrinking (gopuccha) or growing (srotovaha) by one
          const ps = u.notes.map(n => n.p), f = ps[ps.length - 1], lens = []; let n = 0;
          ps.forEach(p => { n++; if (p === f) { lens.push(n); n = 0; } });
          ok(lens.length >= 2 && lens.every((L, k) => k === 0 || L - lens[k - 1] === (u.design === 'gopuccha' ? -1 : 1)), r.name + ': ' + u.design + ' yati statements ' + lens.join(','));
          ok(res.phrases[u.phrase].focal === f, r.name + ': a yati lands on its phrase focus');
        }
        if (/rhyme|sequence/.test(u.base)) {
          any = true;
          const pv = res.units.filter(x => x.phrase === u.phrase - 1 || (u.phrase === 1 && x.kind === 'start')).flatMap(x => x.notes.map(nn => nn.p));   // phrase 0 opens with the opening swara
          const ps = u.notes.map(nn => nn.p);
          if (u.base === 'rhyme-start') { rhymes++; ok(ps.join() === pv.slice(0, ps.length).join(), r.name + ': an initial rhyme repeats the last phrase\'s opening'); }
          if (u.base === 'sequence') { seqs++; ok(ps.every((p, k) => pos(pv[k]) - pos(p) === 1), r.name + ': a sequence is the last phrase a step lower'); }
          if (u.base === 'rhyme-end') { rhymes++; const tail = pv.slice(-ps.length), sh = pos(ps[0]) - pos(tail[0]); ok(ps.every((p, k) => pos(p) - pos(tail[k]) === sh), r.name + ': an end rhyme repeats the last phrase\'s tail (moved to the new focus)'); }
        }
      });
      if (any) { withRep++; cls.rep++; }
    });
  });
  t.diagnostic(rounds + ' rounds at T 0: ' + withRep + ' with repetition or a yati (' + rhymes + ' rhymes, ' + seqs + ' sequences, ' + yatis + ' yatis); with phrases ' + by.phrases.rep + '/' + by.phrases.rounds + ', without ' + by.none.rep + '/' + by.none.rounds);
  // rounds without phrases lean on these designs; in a raga with phrases, the phrases take their place
  ok(by.none.rep / by.none.rounds > 0.5, 'most rounds without phrases repeat or design something');
  ok(by.phrases.rep / by.phrases.rounds >= 0.25, 'a good share of rounds with phrases do too');
  done();
});

test('korvai: three descending units of runs with shrinking rests and a mora, landing next to the eduppu', t => {
  const { ok, done } = checker(t);
  let korvais = 0, fallbacks = 0;
  ['mela65', 'mela8', 'mela29', 'mela15', 'mela22', 'mohanam', 'hamsadhwani', 'mela1'].forEach(id => {
    const r = byId(id), sc = scaleOf(r), pos = p => sc.indexOf(p), e = pcsOf(r).has(7) ? 7 : 12, nb = E.eduppuNeighbours(r, e), P = E.makeProjector(r);
    [[16, 4], [32, 2], [16, 2]].forEach(([K, per]) => [0, 1].forEach(T => {
      const res = round(r, { aksharas: K, perAkshara: per, T, ending: 'korvai', seed: K + T });
      if (res.error) return;
      ok(res.notes.reduce((s, n) => s + n.dur, 0) === K * per, 'exact length');
      for (let k = 1; k < res.notes.length; k++) ok(P.valid(res.notes[k - 1].p, res.notes[k].p), r.name + ': direction rule');
      if (res.ending.type !== 'korvai') { fallbacks++; ok(res.ending.fallbackFrom === 'korvai', 'a korvai that does not fit falls back, and says so'); return; }
      korvais++;
      const ku = res.units.filter(u => u.kind === 'korvai');
      ok(ku.length === 3, '3 korvai units');
      const firsts = ku.map(u => pos(u.notes[0].p));
      ok(firsts[0] - firsts[1] === 1 && firsts[1] - firsts[2] === 1, r.name + ': each unit a step lower than the last');
      const fin = res.notes[res.notes.length - 1].p;
      ok(fin === nb.lo || fin === nb.hi, r.name + ': the korvai lands next to the eduppu');
    }));
  });
  t.diagnostic(korvais + ' korvais, ' + fallbacks + ' fallbacks where none fits');
  ok(korvais >= 10, 'korvais are made where they fit');
  done();
});

test('session: first speed, second speed, koraippu and korvai, every round landing, the focus climbing', t => {
  const { ok, done } = checker(t);
  ['mela65', 'mela8', 'mohanam', 'mela29', 'mela15'].forEach(id => {
    const r = byId(id), e = pcsOf(r).has(7) ? 7 : 12, nb = E.eduppuNeighbours(r, e);
    const S = E.kalpanaSession(r, { eduppuPitch: e, T: 1, seed: 5 }), S2 = E.kalpanaSession(r, { eduppuPitch: e, T: 1, seed: 5 });
    ok(JSON.stringify(S) === JSON.stringify(S2), r.name + ': a session is deterministic');
    ok(S.failed.length === 0 && S.rounds.length === 12, r.name + ': twelve rounds');
    ok(S.rounds.map(x => x.part).join() === ['first speed', 'first speed', 'first speed', 'second speed', 'second speed', 'koraippu', 'koraippu', 'koraippu', 'koraippu', 'koraippu', 'koraippu', 'korvai'].join(), r.name + ': the parts in order');
    ok(S.rounds.map(x => x.avartanas).join() === [0.5, 1, 2, 1, 2, 1, 1, 0.5, 0.5, 0.25, 0.25, 2].join(), r.name + ': rounds grow, then the koraippu shrinks');
    S.rounds.forEach(x => {
      const fin = x.round.notes[x.round.notes.length - 1].p;
      ok(x.round.notes.reduce((s, n) => s + n.dur, 0) === x.aksharas * x.per && (fin === nb.lo || fin === nb.hi), r.name + ': round ' + x.index + ' is exact and lands next to the eduppu');
    });
    const climb = S.rounds.filter(x => x.part !== 'koraippu' && x.part !== 'korvai').map(x => x.focus);
    ok(climb.every((f, k) => k === 0 || f >= climb[k - 1]), r.name + ': the focus climbs across the first- and second-speed rounds ' + climb.join(','));
    const kor = S.rounds.filter(x => x.part === 'koraippu').map(x => x.focus);
    ok(new Set(kor).size === 1, r.name + ': the koraippu keeps one focal note');
    ok(S.rounds.filter(x => x.part === 'first speed').every(x => x.per === 2) && S.rounds.filter(x => x.part === 'second speed').every(x => x.per === 4), 'two then four swaras a beat');
  });
  done();
});
