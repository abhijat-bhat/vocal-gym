import { rng } from '../random.js';
import { swaraName } from './grammar.js';

/* Vocal Gym engine · expression: phrasing, stress and dynamics for a rendered line
   (docs/research/gamaka-papers.md §5). A rendering layer like the gamaka: it never changes the notes or
   their timing, it only says how loud each moment is sung and how each swara is begun.
     expression(notes, contour, opts) → { phrases, notes, gain }
       notes    the input [{ p, dur }] (dur in slots, p null for a rest)
       contour  buildContour's output (its notes and legato groups)
       opts     { slotSec, raga, per?, cycleBeats?, angaStarts?, units?, seed?, gamaka? }
                per: slots per akshara; cycleBeats: aksharas per tala cycle; angaStarts: aksharas (in the
                cycle) where an anga begins; units: kalpana's units (phrase boundaries)
   phrases  [{ i0, i1, t0, t1 }]: runs of notes sung in one breath
   notes    per input note: { i, phrase, first, last, accent 0–1, syllable, consonant, vowel, onset }
            onset 'phrase' (a fresh attack after a breath), 'note' (the swara's syllable), 'glide' (a
            jaru: the voice slides in without a new syllable)
   gain     per legato group, [{ t, g }] every 10 ms: a multiplier around 1 for the voice's loudness
   The model, from the research folder:
     phrases and breaths  phrase boundaries at rests, kalpana's phrase units and long notes; between
                          phrases sung without a rest, the last note is released early (a breath) and
                          the next phrase starts with a fresh attack (S210 §8.5: experts asked for svaras
                          stressed "to establish phrase boundaries"; S204: the music must be separated
                          into phrases "creating the feeling of hearing the lyric")
     stress               the first swara of a phrase, the samam and anga starts, and long swaras are
                          stressed with a plain attack (S210 §8.5.3: stress "by playing them with a
                          combination of a plain note and a string pluck"); a swara after a gamaka is
                          sung lighter (S209: "articulated svaras are generally followed by a svara which
                          is less articulated or not articulated at all")
     dynamics             a gentle arch over each phrase, a swell and decay on long swaras, softer phrase
                          endings and a long release on the last swara (S206: the bow fades at phrase
                          ends; S210 §8.5.3: endings "more delicate", the upper register "more subtle"),
                          and a seeded variation of a few per cent per swara.
   Deterministic: the same inputs and seed give the same output. */

const STEP = 0.01;
const SYLLABLE = { S: 'sa', R: 'ri', G: 'ga', M: 'ma', P: 'pa', D: 'dha', N: 'ni' };
// how each syllable begins: a fricative, a tap, a stop (voiced or not, aspirated or not) or a nasal
const CONSONANT = { sa: 's', ri: 'r', ga: 'g', ma: 'm', pa: 'p', dha: 'dh', ni: 'n' };
export const PHRASE_MAX = 5;      // seconds: a longer run is split at a unit boundary (one breath)
export const LONG_NOTE = 0.6;     // a swara this long (and over twice the median) ends a phrase
export const BREATH_SEC = 0.09;   // the release before a breath, at most a quarter of the note

export function syllableOf(raga, p) {
  const name = swaraName(raga, p), s = SYLLABLE[name && name[0]] || 'a';
  return { syllable: s, consonant: CONSONANT[s] || '', vowel: s === 'ri' || s === 'ni' ? 'i' : 'a' };
}

/* where each phrase starts: indices into notes */
function phraseStarts(notes, slotSec, units) {
  const N = notes.length, starts = new Set(), sec = i => notes[i].dur * slotSec;
  const durs = notes.filter(n => n.p != null).map(n => n.dur * slotSec).sort((a, b) => a - b), median = durs.length ? durs[durs.length >> 1] : 0;
  const soft = new Set();
  if (units) { let k = 0; units.forEach(u => { if (k > 0 && /^(phrase|mora)/.test(u.kind)) soft.add(k); k += u.notes.length; }); }
  for (let i = 0; i < N; i++) {
    if (notes[i].p == null) continue;
    if (i === 0 || notes[i - 1].p == null) { starts.add(i); continue; }
    if (sec(i - 1) >= LONG_NOTE - 1e-9 && sec(i - 1) >= 2 * median - 1e-9) starts.add(i);
  }
  // a run longer than PHRASE_MAX takes a breath at the unit boundary nearest its middle
  const sorted = () => Array.from(starts).sort((a, b) => a - b);
  let changed = true;
  while (changed) {
    changed = false;
    const ss = sorted();
    for (let k = 0; k < ss.length; k++) {
      const i0 = ss[k];
      let i1 = (k + 1 < ss.length ? ss[k + 1] : N) - 1;
      while (i1 > i0 && notes[i1].p == null) i1--;
      let t = 0; for (let i = i0; i <= i1; i++) t += sec(i);
      if (t <= PHRASE_MAX) continue;
      let best = -1, bestD = Infinity, acc = 0;
      for (let i = i0 + 1; i <= i1; i++) { acc += sec(i - 1); if (soft.has(i) && notes[i].p != null) { const d = Math.abs(acc - t / 2); if (d < bestD) { bestD = d; best = i; } } }
      if (best > 0) { starts.add(best); changed = true; break; }
    }
  }
  return sorted();
}

export function expression(notes, contour, opts) {
  const o = opts || {}, slotSec = o.slotSec, raga = o.raga, N = notes.length;
  const r = rng(((o.seed || 1) * 1103515245 + 12345) >>> 0);
  const cn = contour.notes, starts = phraseStarts(notes, slotSec, o.units);
  // phrases
  const phrases = starts.map((i0, k) => {
    let i1 = (k + 1 < starts.length ? starts[k + 1] : N) - 1;
    while (i1 > i0 && notes[i1].p == null) i1--;
    return { i0, i1, t0: cn[i0].t0, t1: cn[i1].t1 };
  });
  const phraseOf = new Array(N).fill(-1);
  phrases.forEach((ph, k) => { for (let i = ph.i0; i <= ph.i1; i++) phraseOf[i] = k; });
  // the slot each note starts on, for the tala accents
  const slot0 = []; let acc = 0; notes.forEach(n => { slot0.push(acc); acc += n.dur; });
  const per = o.per > 0 ? o.per : 0, cyc = o.cycleBeats > 0 ? o.cycleBeats : 0, angas = new Set(o.angaStarts || []);
  const out = notes.map((n, i) => {
    if (n.p == null) return { i, phrase: -1, rest: true };
    const ph = phrases[phraseOf[i]], first = i === ph.i0, last = i === ph.i1, c = cn[i], sec = c.t1 - c.t0;
    let accent = 0.3;
    if (per && slot0[i] % per === 0) {
      const beat = slot0[i] / per, inCyc = cyc ? beat % cyc : beat;
      accent = cyc && inCyc === 0 ? 1 : angas.has(inCyc) ? 0.75 : 0.5;
    }
    if (first) accent = Math.max(accent, 0.8);
    if (sec >= 0.45) accent = Math.min(1, accent + 0.25);
    const prevGamaka = i > 0 && cn[i - 1] && cn[i - 1].gamaka;
    if (prevGamaka && !c.gamaka && !first) accent *= 0.6;   // the svara after an articulated one is lighter (S209)
    const glide = !first && c.shape && c.shape.onset === 'jaru';
    const syl = raga ? syllableOf(raga, n.p) : { syllable: 'a', consonant: '', vowel: 'a' };
    return Object.assign({ i, phrase: phraseOf[i], first, last, accent: Math.round(accent * 1000) / 1000, onset: first ? 'phrase' : glide ? 'glide' : 'note', jitter: 1 + 0.03 * (2 * r() - 1) }, syl);
  });
  // the loudness curve, per legato group
  const lastSounding = (() => { for (let i = N - 1; i >= 0; i--) if (notes[i].p != null) return i; return -1; })();
  const gainAt = t => {
    // the note sounding at t (the last note before t starts)
    let i = -1;
    for (let k = 0; k < N; k++) { if (cn[k].t0 <= t + 1e-9) i = k; else break; }
    if (i < 0 || notes[i].p == null) return 0;
    const x = out[i], c = cn[i], ph = phrases[x.phrase], sec = c.t1 - c.t0, u = (t - ph.t0) / Math.max(1e-6, ph.t1 - ph.t0), v = (t - c.t0) / Math.max(1e-6, sec);
    let g = 0.9 + 0.1 * Math.sin(Math.PI * Math.min(1, Math.max(0, u)));            // the phrase arch
    // register: a little louder above the phrase's middle, a little softer high up (S210 §8.5.3)
    const mid = ph.mid != null ? ph.mid : (ph.mid = (() => { let s = 0, k = 0; for (let j = ph.i0; j <= ph.i1; j++) if (notes[j].p != null) { s += notes[j].p; k++; } return k ? s / k : 0; })());
    g *= 1 + Math.max(-0.08, Math.min(0.06, 0.012 * (notes[i].p - mid)));
    g *= 1 + 0.12 * x.accent * Math.exp(-(t - c.t0) / 0.12);                     // the stress of the attack
    if (sec >= 0.45 && !x.last) g *= 1 + 0.06 * Math.sin(Math.PI * Math.min(1, v / 0.7)) - 0.05 * Math.max(0, v - 0.7) / 0.3;   // swell and decay
    if (x.last && i !== lastSounding) g *= 1 - 0.22 * Math.max(0, (v - 0.4) / 0.6);   // a softer phrase ending
    if (i === lastSounding) g *= 1 - 0.4 * Math.max(0, (v - 0.3) / 0.7);              // the long release of the last swara
    // a breath before the next phrase when no rest makes room for one
    const nxt = i + 1 < N ? i + 1 : -1;
    if (x.last && nxt >= 0 && notes[nxt].p != null) {
      const b = Math.min(BREATH_SEC, 0.25 * sec), tb = c.t1 - b;
      if (t > tb) g *= 0.06 + 0.94 * (1 + Math.cos(Math.PI * Math.min(1, (t - tb) / b))) / 2;
    }
    return g * x.jitter;
  };
  const gain = contour.groups.map(gr => {
    const pts = [];
    for (let t = gr.t0; t < gr.t1 - 1e-9; t += STEP) pts.push({ t: Math.round(t * 1e6) / 1e6, g: Math.round(gainAt(t + 1e-7) * 1e4) / 1e4 });
    pts.push({ t: gr.t1, g: Math.round(gainAt(gr.t1 - 1e-6) * 1e4) / 1e4 });
    return pts;
  });
  phrases.forEach(ph => { delete ph.mid; });
  out.forEach(x => { delete x.jitter; });
  return { phrases, notes: out, gain };
}
