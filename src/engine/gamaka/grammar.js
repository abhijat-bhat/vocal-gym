import { mod12 } from '../projection.js';

/* Vocal Gym engine · the swara grammar of gamaka (docs/research/gamaka-grammar.md)
   How each of the ten moving swaras is rendered in its phrase when the raga's own data does not say
   otherwise. It reads the raga's scale around the swara and the phrase around the note:
     G1  S and P are achala: held plain (S198).
     G2  R1 and D1, a half step above S and P, are deflected into S and P: an oscillation between
         S (P) and the swara (Schachter 2015; S37 Todi D "from around P"; S40 Mayamalavagowla R from S),
         anchored on S (P): the voice stays there and rises to the swara in spurts, ending on it
         (S205: Mayamalavagowla ri "remains at a lower note for a considerable period and moves up in
         spurts"; S207: Bhairavi dha forms that start at pa, consist largely of pa, end with a touch of dha).
     G3  a swara a semitone below its upper neighbour is held straight: R2 before G2 (Sri,
         Kharaharapriya), D2 before N2 (Harikambhoji), G3 before M1 and N3 before S (Sankarabharanam),
         M2 before P (Vedavalli 2002: "some notes have to be stressed and others held flat depending on
         the following note"). G3a: but with an augmented second below it, it oscillates up into that
         neighbour and lives mostly there (Schachter: Mayamalavagowla G3 into M1, N3 into S). G3c: N3 and
         M2 sung next to S and P are a kampita very close to S and P (Krishna & Ishwar 2012, S209: "Kakali
         Nishada and Prati Madhyama are rendered with Kampita gamaka very close to the Shadja or Panchama
         respectively. This would not be seen ... in phrases that lack Sa or Pa"). G3b: on a middling
         note, coming down from S or P, they are touched from there on the way and held.
     G4w a swara a half step above its lower neighbour with a doubly augmented gap above oscillates up
         by a half step (Schachter: Varali G1 into the G2 position).
     G4  a swara with a whole tone or more above it takes a kampita that borrows the shade of the next
         swara: toward the upper neighbour when the phrase moves up, toward the lower when it stays or
         falls (Vedavalli: Sankarabharanam's madhyamam oscillates close to G in s r g m m and close to P
         when the phrase ascends). The swara stays the anchor: most of the time is spent on it.
         G4m: M1 a half step above G3 with P a tone above, passed through on the way up (G3 M1 P), is
         sung between its neighbours, G3 P G3, from G3 (S209: "uttering the syllable Ma while at the same
         time singing Ga3 Pa Ga3"; S205: Sankarabharanam ma in "ga maa paa" "played from the ga fret
         deflecting it all the way almost reaching the pitch of pa"; S203: Kambhoji ma).
     G5  duration decides the form: long notes a kampita of up to three cycles, middling notes one swing,
         short notes a single touch from the target swara (Krishnaswamy 2004: at speed the inflexions
         shrink and merge).
   and, across the phrase (adjacency, below):
     G6  if one svara is oscillated, the svara adjacent to it is held flat (Vedavalli: Kalyani's
         gandharam oscillated, its rishabham flat; vice versa in Sankarabharanam). It applies when the
         two swings run into each other; gamakas that split outwards across an augmented second (R1 into
         S, G3 into M) both stay (Schachter ¶32). Of two that clash, a sourced raga rule keeps its gamaka,
         then a defining deflection (G2, G3a) over a borrowed shade (G4); otherwise, a whole tone apart
         the lower swara keeps it (R2 then G3: R2 oscillates, G3 straight) and a semitone apart the upper
         does (R2 then G2: G2 oscillates, R2 straight). Krishna & Ishwar state the same alternation for
         phrases in general: "the articulated svaras are generally followed by a svara which is less
         articulated or not articulated at all" (S209).
   Rules are returned in the resolver's format with basis 'grammar', the rule id and a reason. */

const NAME = { 1: 'R1', 2: 'R2', 3: 'G2', 4: 'G3', 5: 'M1', 6: 'M2', 8: 'D1', 9: 'D2', 10: 'N2', 11: 'N3' };
export const swaraName = (raga, p) => {
  const lab = raga && raga.labels && raga.labels[mod12(p)];
  return lab || NAME[mod12(p)] || '?';
};
const LONG = 0.4, MID = 0.22;
const plain = (id, why) => ({ onset: 'none', body: 'plain', exit: 'none', src: id === 'G1' ? 'S198' : 'S202', basis: 'grammar', grammar: id, why });

/* the grammar's rule for note ctx in a raga with scale sc */
export function swaraRule(ctx, sc, raga) {
  const p = ctx.p, pc = mod12(p), name = swaraName(raga, p);
  if (pc === 0 || pc === 7) return plain('G1', (pc ? 'P' : 'S') + ' is achala: held plain');
  const upN = sc.step(p, 1), dnN = sc.step(p, -1), up = upN - p, dn = p - dnN;
  const nameOf = q => swaraName(raga, q);
  // where the phrase goes from this note: up, down, or nowhere (it stays, or the phrase ends)
  const heading = ctx.next != null && ctx.next !== p ? Math.sign(ctx.next - p) : 0;
  const sec = ctx.sec;
  const shaped = (rule, target) => {
    // G5: the form by duration; the target is the swing's far end, as an offset from the note
    if (sec >= LONG - 1e-9) return Object.assign(rule, { cycles: [1, 3] });
    if (sec >= MID - 1e-9) return Object.assign(rule, { cycles: [1, 1] });
    return { onset: target > 0 ? 'nokku' : 'odukkal', from: target, body: 'plain', exit: 'none', src: rule.src, basis: 'grammar', grammar: rule.grammar, why: rule.why + '; at this speed a single touch' };
  };
  // G2: R1 and D1 lean on S and P
  if ((pc === 1 || pc === 8) && dn === 1) {
    const anchor = pc === 1 ? 'S' : 'P';
    return shaped({ onset: 'none', body: 'kampita', lo: -1, hi: 0, end: 'self', dwell: 'lo', src: 'S203', basis: 'grammar', grammar: 'G2',
      why: name + ', a half step above ' + anchor + ', is deflected into ' + anchor + ': it rests on ' + anchor + ' and rises to itself in spurts' }, -1);
  }
  // G3: a semitone below the next swara
  if (up === 1) {
    // G3a: with an augmented second (or more) below, it is pulled up into its upper neighbour, where
    // most of its time is spent (Schachter: Mayamalavagowla G3 into M1, N3 into S; Varali M2 into P)
    if (dn >= 3) return shaped({ onset: 'none', body: 'kampita', lo: 0, hi: 1, end: 'self', dwell: 'hi', src: 'S203', basis: 'grammar', grammar: 'G3a',
      why: name + ', with an augmented second below, oscillates up into ' + nameOf(upN) + ' and lives mostly there' }, 1);
    // G3c: N3 and M2 sung next to S and P: a kampita very close to S and P (S209); a long note, or a
    // middling one on its way up to S or P (coming down, G3b touches it instead)
    const nearSP = (pc === 11 || pc === 6) && (mod12(upN) === 0 || mod12(upN) === 7);
    if (nearSP && (ctx.prev === upN || ctx.next === upN) && (sec >= LONG - 1e-9 || (ctx.next === upN && sec >= MID - 1e-9)))
      return shaped({ onset: 'none', body: 'kampita', lo: 0, hi: 1, end: 'self', dwell: 'hi', src: 'S209', basis: 'grammar', grammar: 'G3c',
        why: name + ', sung next to ' + nameOf(upN) + ', is a kampita very close to ' + nameOf(upN) }, 1);
    // G3b: otherwise straight; coming down from S or P it is touched from there on the way (S144, S203)
    if ((pc === 11 || pc === 6) && ctx.prev === upN && sec >= MID - 1e-9)
      return { onset: 'nokku', from: 1, body: 'plain', exit: 'none', src: 'S203', basis: 'grammar', grammar: 'G3b', why: name + ', just below ' + nameOf(upN) + ', is touched from ' + nameOf(upN) + ' as the phrase comes down, then held straight' };
    const towardIt = ctx.next != null && ctx.next > p && mod12(upN) !== 0 && mod12(upN) !== 7;
    return plain('G3', name + ' is a semitone below ' + nameOf(upN) + ': held straight' + (towardIt ? ' as the phrase rises to ' + nameOf(upN) + ', which takes the gamaka' : ''));
  }
  // a doubly augmented gap above a swara that sits a half step over its lower neighbour: it is kept
  // apart from that neighbour by a half-step oscillation upward (Schachter: Varali's G1 into G2)
  if (up >= 4 && dn === 1) return shaped({ onset: 'none', body: 'kampita', lo: 0, hi: 1, end: 'self', dwell: 'lo', src: 'S203', basis: 'grammar', grammar: 'G4w',
    why: name + ', a half step above ' + nameOf(dnN) + ' with a wide gap above, oscillates up by a half step to stand apart from ' + nameOf(dnN) }, 1);
  // a repeated note: the second is struck from below (sphurita, S198)
  if (ctx.janta && sec < LONG) return { onset: 'sphurita', from: -Math.min(dn, 2), body: 'plain', exit: 'none', src: 'S198', basis: 'grammar', grammar: 'G4', why: 'the second of a repeated ' + name + ': struck from below (sphurita)' };
  // G4m: M1 between G3 and P, passed through upward, is sung G3 P G3 from G3 (S209, S205, S203)
  if (pc === 5 && dn === 1 && up === 2 && ctx.prev === dnN && ctx.next === upN)
    return shaped({ onset: 'none', body: 'kampita', lo: -1, hi: 2, end: 'self', dwell: 'lo', src: 'S209', basis: 'grammar', grammar: 'G4m',
      why: name + ' between ' + nameOf(dnN) + ' and ' + nameOf(upN) + ' on the way up is sung ' + nameOf(dnN) + ' ' + nameOf(upN) + ' ' + nameOf(dnN) + ', from ' + nameOf(dnN) }, -1);
  // G4: a kampita toward the neighbour the phrase heads for, anchored on the swara itself; a swing wider
  // than a minor third would sound another svara, so it stops there
  const wUp = Math.min(up, 3), wDn = Math.min(dn, 3);
  if (heading > 0) {
    return shaped({ onset: 'none', body: 'kampita', lo: 0, hi: wUp, end: 'self', dwell: 'lo', src: 'S202', basis: 'grammar', grammar: 'G4',
      why: name + ' has a whole tone or more above it: it oscillates up toward ' + nameOf(upN) + ' as the phrase rises, borrowing its shade' }, wUp);
  }
  // falling or staying: into the swara below (Powers, Schachter: flattened G2 and N2 deflect downward)
  return shaped({ onset: 'none', body: 'kampita', lo: -wDn, hi: 0, end: 'self', dwell: 'hi', src: 'S202', basis: 'grammar', grammar: 'G4',
    why: name + ' oscillates down toward ' + nameOf(dnN) + ' as the phrase ' + (heading < 0 ? 'falls' : 'stays') + ', borrowing its shade' }, -wDn);
}

/* G6 adjacency on resolved notes [{ ctx, rule }] (null for rests), in place. A rule counts as sourced
   when it comes from the raga's data and is not marked text-vague. Returns the indices made flat. */
export function adjacency(out, sc, raga) {
  const osc = x => x && x.rule && (x.rule.body === 'kampita' || x.rule.body === 'andolita');
  const sourced = x => x.rule.basis !== 'grammar' && x.rule.basis !== 'default' && x.rule.basis !== 'text-vague';
  const steps = (a, b) => { let k = 0, q = a; const d = Math.sign(b - a); while (q !== b && Math.abs(k) < 3) { q += d; if (sc.pcs.includes(mod12(q))) k++; } return k; };
  const flat = [];
  for (let i = 1; i < out.length; i++) {
    const a = out[i - 1], b = out[i];
    if (!osc(a) || !osc(b) || steps(a.ctx.p, b.ctx.p) !== 1) continue;
    if (sourced(a) && sourced(b)) continue;   // the raga's data oscillates both: keep it
    // two gamakas that split outwards (the lower swinging down, the upper up, as R1 into S and G3 into M
    // across an augmented second, Schachter ¶32) do not blur each other: only swings toward each other clash
    const lo = a.ctx.p < b.ctx.p ? a : b, hi = lo === a ? b : a;
    if (!((lo.rule.hi || 0) > 0 || (hi.rule.lo || 0) < 0)) continue;
    // the deflections that define a swara (R1, D1 into S and P; G3, N3 up across an augmented second)
    // outrank a kampita that only borrows a neighbour's shade. G3c (N3, M2 close to S, P) does not: in
    // D2 N3 S the whole-tone rule keeps D2's gamaka and holds N3 straight, as R2 G3
    const RANK = { G2: 2, G3a: 2 }, rank = x => RANK[x.rule.grammar] || 1;
    let lose;
    if (sourced(a)) lose = b;
    else if (sourced(b)) lose = a;
    else if (rank(a) !== rank(b)) lose = rank(a) < rank(b) ? a : b;
    else {
      const lower = a.ctx.p < b.ctx.p ? a : b, upper = lower === a ? b : a;
      lose = Math.abs(a.ctx.p - b.ctx.p) === 1 ? lower : upper;
    }
    const keep = lose === a ? b : a;
    lose.rule = { onset: 'none', body: 'plain', exit: 'none', src: 'S202', basis: 'grammar', grammar: 'G6',
      why: swaraName(raga, lose.ctx.p) + ' held flat beside the oscillating ' + swaraName(raga, keep.ctx.p) + ' (one of two adjacent svaras is held flat)' };
    flat.push(out.indexOf(lose));
  }
  return flat;
}
