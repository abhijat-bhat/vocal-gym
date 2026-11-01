import { tala as makeTala } from '../talas.js';
import { talaSpec } from '../jathi/script.js';
import { patternsFor } from './patterns.js';
export { tala, FAM, DEFJ, JATI, CHAPU } from '../talas.js';

/* Vocal Gym engine · korvai and tihai arithmetic (v0.8; docs/research/korvai-tihai.md)
   The math a learner needs to make a mora, a tihai or a korvai land, for any of the 35 suladi talas
   (and the chapu talas), any gati and kalai, and any start and landing point.
     - Everything is counted in pulses (maatras): one avartanam is aksharas × kalai × gati pulses.
     - A mora (Hindustani tihai) is statement, gap, statement, gap, statement: 3P + 2G pulses
       (Nelson, after Field 2018; Raberg 2017; digitabla.com, "Common tihai forms").
     - Balaji 2024 tabulates the series a(k)a(k)a, aa(k)aa(k)aa and aaa(k)aaa(k)aaa (3a, 6a or 9a + 2k)
       with the offset from sam each must start at, and builds a korvai as a purvanga and an uttaranga
       (the mora) in a ratio between 30:70 and 70:30; a purvanga is phrase (gap) × 3 when its length
       divides by three, and a yati or his 1-2-4 rule when it does not.
     - The closing syllable: Balaji counts up to the landing, and a closing "tha" sounds on it uncounted;
       tabla players count the last stroke on sam (16 + 1 = 17). Both are offered (counting 'end' and 'on').
   Hard: every layout fills its span exactly and lands where it was asked to; layoutParts checks it
   cell by cell. Soft: the order of the solutions (a ranking, never a filter, except the ratio rule,
   which the source states). Deterministic and dependency-free. */

// 10 to 18: a doubled gati, for drawing half-pulse gaps at twice the resolution
export const GATIS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18];
export const KALAIS = [1, 2, 4];
export const MAX_CYCLES = 8;
export const GATI_NAME = { 1: 'One a beat', 2: 'Two a beat', 3: 'Tisra', 4: 'Chatusra', 5: 'Khanda', 6: 'Tisra, doubled', 7: 'Misra', 8: 'Chatusra, doubled', 9: 'Sankeerna', 10: 'Khanda, doubled', 12: 'Tisra, quadrupled', 14: 'Misra, doubled', 16: 'Chatusra, quadrupled', 18: 'Sankeerna, doubled' };
export const YATI_NAME = {
  sama: 'sama (equal)', gopuccha: 'gopuccha (a cow’s tail: shrinking)', srotovaha: 'srotovaha (a river widening: growing)',
  mridanga: 'mridanga (the drum: wide in the middle)', damaru: 'damaru (the hourglass drum: narrow in the middle)'
};

/* the jati for each number, as Balaji 2024 (p. 57) vocalises it; ',' is a karvai inside the phrase */
export const JATI_SYLLABLES = {
  1: ['tha'], 2: ['tha', 'ka'], 3: ['tha', 'ki', 'ta'], 4: ['tha', 'ka', 'dhi', 'mi'], 5: ['tha', 'dhi', 'gi', 'na', 'thom'],
  6: ['tha', 'ka', 'tha', 'ka', 'dhi', 'mi'], 7: ['tha', 'ki', 'ta', 'tha', 'ka', 'dhi', 'mi'], 8: ['tha', 'ka', 'dhi', 'mi', 'tha', 'ka', 'jho', 'nu'],
  9: ['tha', 'ka', 'dhi', 'mi', 'tha', 'dhi', 'gi', 'na', 'thom'], 10: ['tha', 'ki', 'ta', 'thom', ',', 'tha', 'dhi', 'gi', 'na', 'thom']
};
const TDGNT = JATI_SYLLABLES[5];

const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
const mod = (a, b) => ((a % b) + b) % b;
const val = (v, d) => (v === undefined || v === null || v === '' ? d : Number(v));

/* ---------- syllables ---------- */
/* a jati of n syllables: Balaji's table up to 10, then fours ahead of the rest */
export function jatiOf(n) {
  if (!(n >= 1)) return [];
  if (n <= 10) return JATI_SYLLABLES[n].slice();
  const out = []; let r = n;
  while (r > 10) { out.push(...JATI_SYLLABLES[4]); r -= 4; }
  return out.concat(JATI_SYLLABLES[r]);
}
/* a mora statement of n pulses: it always closes on "thom" (tha ka thom, tha ki ta thom), and on
   "tha dhi gi na thom" once it is five or longer */
const STATEMENT = {
  6: ['tha', 'dhin', ',', 'gi', 'na', 'thom'], 7: ['tha', ',', 'dhin', ',', 'gi', 'na', 'thom'],
  8: ['tha', ',', 'tha', 'dhin', ',', 'gi', 'na', 'thom'], 10: ['tha', ',', 'dhi', ',', 'tha', 'dhin', ',', 'gi', 'na', 'thom']
};
// 6, 7, 8 and 10 are the slides' Thadhin,ginathom, Tha,dhin,ginathom, Tha,Thadhin,ginathom and
// Tha,Dhi,Thadhin,ginathom (MA375TGR Unit 3 notes §7.2): each the last with units added at the front
export function statementOf(n) {
  if (n <= 4) return yatiLineOf(n);
  if (STATEMENT[n]) return STATEMENT[n].slice();
  return jatiOf(n - 5).concat(TDGNT);
}
/* a family of phrases for a yati or a pattern: each is the end of one long phrase, so the lengths
   change at the front and the ending ("… gi na thom") is never disturbed. Gopuccha trims a phrase
   from the front (tha dhi gi na thom, dhi gi na thom, gi na thom …); srotovaha grows it back. */
export function nestedPhrases(lens) {
  const mx = Math.max(0, ...lens), fill = [], chunks = [JATI_SYLLABLES[4], JATI_SYLLABLES[3], JATI_SYLLABLES[2], JATI_SYLLABLES[1]];
  for (let r = mx - 5; r > 0;) { const c = chunks.find(x => x.length <= r); fill.push(...c); r -= c.length; }
  const base = fill.concat(TDGNT);
  return lens.map(L => (L <= 0 ? [] : base.slice(base.length - L)));
}
/* a sounded kaarvai of n pulses, as the slides write them: Dhin, (2), Dhinku (3), Dhin,; (4),
   Dhin, Tha, Dhin, (6), Dhin, Tha, Dhin,; (8); otherwise Dhin held */
export function kaarvaiOf(n) {
  const K = { 1: [','], 2: ['dhin', ','], 3: ['dhin', 'ku', ','], 4: ['dhin', ',', ',', ','], 6: ['dhin', ',', 'tha', ',', 'dhin', ','], 8: ['dhin', ',', 'tha', ',', 'dhin', ',', ',', ','] };
  if (n <= 0) return [];
  if (K[n]) return K[n].slice();
  // (Dhinku) × 3 for 9, as the slides write the 96 korvai's kaarvai blocks
  if (n % 3 === 0) return [].concat(...Array.from({ length: n / 3 }, () => K[3]));
  return ['dhin'].concat(rests(n - 1));
}
/* a purvanga phrase: Balaji's "tha , dhi , tha ka dhi mi" for eight (p. 63), otherwise a jati */
export function phraseOf(n) {
  if (n === 8) return ['tha', ',', 'dhi', ',', 'tha', 'ka', 'dhi', 'mi'];
  return jatiOf(n);
}
/* a line of a yati: a phrase that ends on "thom", as in Balaji's gopuccha of 20 (p. 60) */
export function yatiLineOf(n) { return n <= 0 ? [] : n === 1 ? ['thom'] : jatiOf(n - 1).concat('thom'); }
const PREFIX = { 1: ['tha'], 2: ['tha', 'ka'], 4: ['tha', ',', 'dhi', ','], 8: JATI_SYLLABLES[8], 16: JATI_SYLLABLES[8].concat(JATI_SYLLABLES[8]) };
const rests = n => new Array(Math.max(0, n)).fill(',');

/* ---------- the cycle ---------- */
/* one avartanam of a tala at a gati and kalai: beats, pulses, and the kriya of each beat */
export function talaCycle(tl, gati = 4, kalai = 1) {
  const beats = tl.total * kalai, pulses = beats * gati, kriya = [], angaStarts = [];
  let b = 0;
  tl.angas.forEach(a => {
    angaStarts.push(b);
    for (let k = 0; k < a.len; k++) for (let q = 0; q < kalai; q++, b++) kriya.push(q > 0 ? 'kalai' : k === 0 ? 'clap' : a.type === 'O' ? 'wave' : 'count');
  });
  return { tala: tl, name: tl.name, gati, kalai, beats, pulses, kriya, angaStarts, angaText: tl.angas.map(a => a.len).join(' + ') };
}
/* "3 beats and 2 pulses" for x pulses at gati g */
export function beatsText(x, g) {
  const a = Math.abs(x), b = Math.floor(a / g), p = a % g;
  if (!a) return '0 pulses';
  return (b ? plural(b, 'beat') : '') + (b && p ? ' and ' : '') + (p ? plural(p, 'pulse') : '');
}
/* where an offset from sam falls, in words */
export function offsetText(x, g) {
  return x === 0 ? 'sam' : beatsText(x, g) + (x > 0 ? ' after sam' : ' before sam');
}
/* an absolute pulse (from the sam of the first row) as cycle, beat and pulse, all counted from 1 */
export function where(cy, p) {
  const c = Math.floor(p / cy.pulses), r = p - c * cy.pulses, beat = Math.floor(r / cy.gati), pulse = r % cy.gati;
  return { cycle: c + 1, beat: beat + 1, pulse: pulse + 1, text: 'cycle ' + (c + 1) + ', beat ' + (beat + 1) + (pulse ? ', pulse ' + (pulse + 1) : '') };
}

/* ---------- the frame ---------- */
/* opts: { fam, L } or { tala }, gati (pulses a beat), kalai, cycles, start and land (pulses from sam;
   land is the composition's eduppu: + anagata, − atita), counting ('end' or 'on').
   Returns { error } for anything out of range. */
export function korvaiFrame(o = {}) {
  let tl;
  try { tl = o.tala && o.tala.angas ? o.tala : makeTala(o.fam == null ? 'triputa' : String(o.fam), val(o.L, 4)); } catch (e) { return { error: e.message }; }
  const gati = val(o.gati, 4), kalai = val(o.kalai, 1), cycles = val(o.cycles, 1), start = val(o.start, 0), land = val(o.land, 0);
  const counting = o.counting == null ? 'end' : o.counting;
  if (!GATIS.includes(gati)) return { error: 'The gati (pulses in a beat) must be one of ' + GATIS.join(', ') + '; got ' + o.gati + '.' };
  if (!KALAIS.includes(kalai)) return { error: 'The kalai must be 1, 2 or 4; got ' + o.kalai + '.' };
  if (!Number.isInteger(cycles) || cycles < 1 || cycles > MAX_CYCLES) return { error: 'The number of avartanams must be a whole number from 1 to ' + MAX_CYCLES + '; got ' + o.cycles + '.' };
  if (counting !== 'end' && counting !== 'on') return { error: 'Counting is "end" (count up to the landing, then a closing syllable) or "on" (the last syllable is on the landing).' };
  const cy = talaCycle(tl, gati, kalai), C = cy.pulses;
  for (const [k, v] of [['start', start], ['landing', land]]) if (!Number.isInteger(v) || Math.abs(v) >= C) return { error: 'The ' + k + ' must be a whole number of pulses less than one avartanam (' + C + ') from sam; got ' + v + '.' };
  const span = cycles * C + land - start;
  if (span < 1) return { error: 'From the start to the landing there is nothing to fill. Add an avartanam or move the start earlier.' };
  const total = counting === 'on' ? span + 1 : span;
  const steps = [
    { id: 'cycle', title: 'One avartanam in pulses', math: cy.angaText + ' = ' + tl.total + ' aksharas' + (kalai > 1 ? ' × ' + kalai + ' kalai = ' + cy.beats + ' beats' : '') + ' × ' + gati + ' pulses = ' + C + ' pulses',
      text: tl.name + (tl.angas.length > 1 ? ' has angas of ' + cy.angaText + ' aksharas' : ' has one anga of ' + tl.total + ' aksharas') + '. In ' + GATI_NAME[gati].toLowerCase() + ' gati each beat holds ' + plural(gati, 'pulse') + ', so one cycle is ' + C + ' pulses.' },
    { id: 'span', title: 'The space to fill', math: cycles + ' × ' + C + (land ? (land > 0 ? ' + ' : ' − ') + Math.abs(land) : '') + (start ? (start > 0 ? ' − ' : ' + ') + Math.abs(start) : '') + ' = ' + span + ' pulses',
      text: 'It starts ' + (start === 0 ? 'on sam' : offsetText(start, gati)) + ' and lands ' + (land === 0 ? 'on sam' : offsetText(land, gati)) + ' ' + plural(cycles, 'avartanam') + ' later: ' + span + ' pulses.' },
    counting === 'end'
      ? { id: 'count', title: 'Counting to the landing', math: 'fill ' + span + ', then “tha” on the landing', text: 'Count every pulse up to the landing point; a closing “tha” (or “thom”) sounds on it and is not counted (Balaji 2024).' }
      : { id: 'count', title: 'The last syllable on the landing', math: span + ' + 1 = ' + total, text: 'The final syllable itself sounds on the landing, so it is counted: the passage is one pulse longer than the space (the way tabla players count a tihai, 16 + 1 = 17).' }
  ];
  return { ok: true, tala: tl, cycle: cy, gati, kalai, cycles, start, land, counting, C, span, total, steps };
}

/* where a passage of `total` pulses must start so that it lands on `land` (Balaji's "offset" column):
   counting back from the landing. Returns { start (0 ≤ start < C), cycles }. */
export function offsetFor(total, C, o = {}) {
  const land = o.land || 0, span = o.counting === 'on' ? total - 1 : total;
  const start = mod(land - span, C), cycles = (start + span - land) / C;
  return { start, cycles: Math.max(cycles, 0), span };
}

/* ---------- moras and series ---------- */
const FORM = { 3: 'a (k) a (k) a', 6: 'aa (k) aa (k) aa', 9: 'aaa (k) aaa (k) aaa', buildup: 'a (k) aa (k) aaa' };
// statements in each of the three groups; 'buildup' is the slides' uttaranga of 1, 2 and 3 Thadiginathoms (Unit 3 §7.2)
export const SERIES_GROUPS = { 3: [1, 1, 1], 6: [2, 2, 2], 9: [3, 3, 3], buildup: [1, 2, 3] };
const coefOf = n => SERIES_GROUPS[n].reduce((a, b) => a + b, 0);
/* every whole-number solution of n·P + 2G = total (P ≥ 1, G ≥ 0), best first.
   n: 3 (a mora), 6 or 9 (Balaji's series of six and nine: three groups of two or three statements), or
   'buildup' (the slides' 1, 2, 3 statements: 6P + 2G). */
export function moraSolutions(total, o = {}) {
  const n = o.n || 3, gati = o.gati || 4, minP = o.minP || 1;
  if (!FORM[n]) throw new Error('A series repeats its phrase 3, 6 or 9 times, or builds up 1, 2, 3.');
  if (!Number.isInteger(total) || total < 1) return [];
  const c = coefOf(n), out = [];
  for (let G = 0; c * minP + 2 * G <= total && (o.maxG == null || G <= o.maxG); G++) {
    const r = total - 2 * G;
    if (r % c) continue;
    const P = r / c, group = SERIES_GROUPS[n][0] * P, step = n === 'buildup' ? (P % gati === 0 && G % gati === 0 ? gati : 1) : group + G;
    let F = 0;
    if (P >= 3) F += 1;
    if (P <= 4 * gati) F += 1; else F -= 0.5 * Math.floor(P / (4 * gati));
    if (G <= P) F += 1;
    if (G >= 1 && G <= 2 * gati) F += 0.6;
    if (step % gati === 0) F += 1;              // every group starts at the same place in the beat
    if (P % gati === 0) F += 0.4;
    if (P >= 5 && P <= 10) F += 0.4;            // the numbers Balaji's charts teach with
    out.push({ n, P, G, total, group, step, gapless: G === 0, kind: G ? 'with karvai' : 'no karvai (bedam)', beatAligned: step % gati === 0,
      eq: c + ' × ' + P + ' + 2 × ' + G + ' = ' + total, form: FORM[n].replace(/a/g, 'P').replace(/k/g, 'G'), score: +F.toFixed(2) });
  }
  return out.sort((x, y) => y.score - x.score || Math.abs(x.P - 2 * gati) - Math.abs(y.P - 2 * gati) || x.G - y.G);
}
/* whether n·P + 2G fills `total`, and if not, the nearest fixes */
export function checkMora(total, P, G, n = 3) {
  P = Number(P); G = Number(G);
  const c = SERIES_GROUPS[n] ? coefOf(n) : n;
  if (!Number.isInteger(P) || P < 1 || !Number.isInteger(G) || G < 0) return { ok: false, error: 'P must be a whole number from 1, and G a whole number from 0.' };
  const got = c * P + 2 * G, diff = total - got, fixes = [];
  if (diff) {
    if (diff % 2 === 0 && G + diff / 2 >= 0) fixes.push((diff > 0 ? 'Widen' : 'Narrow') + ' each gap by ' + Math.abs(diff / 2) + ': G = ' + (G + diff / 2) + '.');
    if (diff % c === 0 && P + diff / c >= 1) fixes.push((diff > 0 ? 'Lengthen' : 'Shorten') + ' each statement by ' + Math.abs(diff / c) + ': P = ' + (P + diff / c) + '.');
    if (diff > 0) fixes.push('Or start ' + plural(diff, 'pulse') + ' later.'); else fixes.push('Or start ' + plural(-diff, 'pulse') + ' earlier.');
  }
  return { ok: diff === 0, got, diff, eq: c + ' × ' + P + ' + 2 × ' + G + ' = ' + got, fixes,
    text: diff === 0 ? c + ' × ' + P + ' + 2 × ' + G + ' = ' + got + ': it fills the space exactly.' : c + ' × ' + P + ' + 2 × ' + G + ' = ' + got + ', but the space is ' + total + ': ' + plural(Math.abs(diff), 'pulse') + (diff > 0 ? ' short.' : ' too long.') };
}
/* the statement lengths of a shaped mora, total unchanged (the "averages" of Balaji 2024 p. 61;
   (5)(6)(7) and (7)(6)(5), Nelson in Field 2018): sama, srotovaha (growing), gopuccha (shrinking) */
export function moraShape(P, shape = 'sama', d = 1) {
  if (shape === 'sama' || !d) return [P, P, P];
  if (P - d < 1) return null;
  return shape === 'srotovaha' ? [P - d, P, P + d] : shape === 'gopuccha' ? [P + d, P, P - d] : null;
}
/* Balaji's chart for a tala: for a in aRange and k in kRange, the total of the series and its offset */
export function seriesChart(C, n = 3, aRange = [5, 10], kRange = [0, 10]) {
  const rows = [];
  for (let a = aRange[0]; a <= aRange[1]; a++) {
    const cells = [];
    for (let k = kRange[0]; k <= kRange[1]; k++) { const total = coefOf(n) * a + 2 * k; cells.push({ k, total, off: mod(-total, C) }); }
    rows.push({ a, cells });
  }
  return { n, C, form: FORM[n], rows };
}

/* ---------- the purvanga ---------- */
/* ways to build a purvanga of V pulses, best first. Each is { kind, lines: [{ pre, len, gap }], formula }:
   a line is an optional prefix phrase, a phrase of len, then gap pulses of karvai. */
// purvanga shapes are pure functions of V and the gati, and korvaiPlans asks for the same V many times
const SHAPES = new Map();
export function purvangaShapes(V, gati = 4) {
  const key = V + '/' + gati;
  if (!SHAPES.has(key)) { if (SHAPES.size > 4000) SHAPES.clear(); SHAPES.set(key, purvangaShapes0(V, gati)); }
  return SHAPES.get(key).slice();
}
function purvangaShapes0(V, gati) {
  const out = [];
  if (!Number.isInteger(V) || V < 2) return out;
  const seen = new Map();
  const add = (kind, lines, F, formula, pat) => {
    const key = lines.map(l => l.pre + ':' + l.len + ':' + l.gap).join(','), name = kind === 'triple' ? 'phrase (gap) × 3' : kind === '124' ? 'the 1-2-4 rule' : YATI_NAME[kind] ? YATI_NAME[kind] + ' yati' : pat.name;
    if (seen.has(key)) {
      const o = seen.get(key);
      // the yati's own name wins: an increasing AP is a srotovaha yati
      if (YATI_NAME[kind] && !YATI_NAME[o.kind]) { o.also.push(o.name); o.kind = kind; o.name = name; o.pattern = pat || o.pattern; }
      else if (!o.also.includes(name) && o.name !== name) o.also.push(name);
      return;
    }
    const sh = { kind, name, also: [], lines, len: V, formula, score: +F.toFixed(2), pattern: pat || null };
    seen.set(key, sh); out.push(sh);
  };
  // phrase (gap) phrase (gap) phrase (gap)
  if (V % 3 === 0) {
    const x = V / 3;
    for (let g = 0; g <= Math.min(x - 2, 2 * gati); g++) {
      const p = x - g;
      let F = 2;
      if (p >= 4 && p <= 10) F += 1;
      if (g >= 1 && g <= 3) F += 1; else if (g === 0) F += 0.2;
      if (p === 8) F += 0.4;
      add('triple', [0, 1, 2].map(() => ({ pre: 0, len: p, gap: g })), F, '3 × (' + p + (g ? ' + ' + g : '') + ')');
    }
  }
  // the patterns of the Unit 3 notes (§9.3, §10.1, §10.2): AP, GP, Fibonacci-like, squares, consecutive
  // integers, kuraippu and the yatis; each line a phrase of the pattern and an optional karvai of e
  for (let e = 0; e <= 2; e++) for (let n = 3; n <= 8; n++) {
    const W = V - n * e;
    if (W < n) continue;
    patternsFor(W, { minN: n, maxN: n, maxTerm: 16 }).forEach(p => {
      const F = 1.0 + p.score + (e === 1 ? 0.25 : 0) + (YATI_NAME[p.kind] ? 0.1 : 0) - (p.kind === 'kuraippu' ? 0.3 : 0);
      add(p.kind, p.terms.map(len => ({ pre: 0, len, gap: e })), F, p.terms.map(x => x + (e ? '+' + e : '')).join(', '), p);
    });
  }
  // Balaji's own rule (p. 62): subtract 7 (1 + 2 + 4), 14 (2 + 4 + 8) or 28 (4 + 8 + 16) until it divides by 3
  [[7, [1, 2, 4]], [14, [2, 4, 8]], [28, [4, 8, 16]]].forEach(([sub, pres]) => {
    const r = V - sub;
    if (r >= 9 && r % 3 === 0 && V % 3 !== 0) {
      const x = r / 3;
      add('124', pres.map(p => ({ pre: p, len: x, gap: 0 })), 1.2 + (x >= 4 && x <= 10 ? 0.4 : 0) - (sub === 28 ? 0.3 : 0), pres.map(p => p + '(' + x + ')').join(' '));
    }
  });
  return out.sort((a, b) => b.score - a.score || a.lines.length - b.lines.length);
}
const linesLen = ls => ls.reduce((s, l) => s + l.pre + l.len + l.gap, 0);

/* ---------- korvais ---------- */
/* korvai plans for a frame: a purvanga of V and an uttaranga (a mora or series) of U, V + U = total.
   o: { series: [3] (the uttaranga forms to try), all: false (keep plans outside 30:70–70:30), limit } */
export function korvaiPlans(F, o = {}) {
  if (!F || !F.ok) return [];
  const T = F.total, series = o.series || [3], limit = o.limit || 24, cands = [];
  series.forEach(n => {
    for (let U = 3; U <= T - 3; U++) {
      const V = T - U, ratio = V / T, balanced = ratio >= 0.3 - 1e-9 && ratio <= 0.7 + 1e-9;
      if (!balanced && !o.all) continue;
      const sols = moraSolutions(U, { n, gati: F.gati, maxG: 3 * F.gati }).filter(s => s.P >= 3);
      if (!sols.length) continue;
      // a quick estimate of the purvanga's score: phrase (gap) × 3 when it divides by 3, a pattern otherwise
      let S = sols[0].score + (V % 3 === 0 ? 4.4 : 2.6) - Math.abs(ratio - 0.62) * 4;
      if (sols[0].P >= 5 && sols[0].P <= 10) S += 0.5;
      if (V % F.gati === 0) S += 0.4;               // the uttaranga starts on a beat
      cands.push({ V, U, ratio, balanced, sols, S });
    }
  });
  cands.sort((a, b) => b.S - a.S || a.U - b.U);
  const plans = [];
  for (const c of cands.slice(0, 3 * limit)) {
    const shapes = purvangaShapes(c.V, F.gati);
    if (!shapes.length) continue;
    const u = c.sols[0], pv = shapes[0];
    let S = u.score + pv.score - Math.abs(c.ratio - 0.62) * 4;
    if (u.P >= 5 && u.P <= 10) S += 0.5;
    if (c.V % F.gati === 0) S += 0.4;
    plans.push({ V: c.V, U: c.U, ratio: +c.ratio.toFixed(3), balanced: c.balanced, uttaranga: u, purvanga: pv, uttarangaOptions: c.sols.slice(0, 6), purvangaOptions: shapes.slice(0, 10), score: +S.toFixed(2),
      text: 'purvanga ' + c.V + ' + uttaranga ' + c.U + ' (' + u.eq + ') = ' + T, ratioText: Math.round(c.ratio * 100) + ' : ' + (100 - Math.round(c.ratio * 100)) });
  }
  plans.sort((a, b) => b.score - a.score || a.U - b.U);
  return plans.slice(0, limit);
}

/* ---------- chakradar (a tihai of tihais) ---------- */
/* 3 × (mukhra M + tihai 3t + 2g) + 2G = total (digitabla.com, "Simple chakradar"); best first */
export function chakradarSolutions(total, o = {}) {
  const gati = o.gati || 4, out = [];
  if (!Number.isInteger(total) || total < 15) return out;
  for (let G = 0; G <= 2 * gati; G++) {
    const r = total - 2 * G;
    if (r % 3) continue;
    const R = r / 3;
    for (let t = 3; t <= 12; t++) for (let g = 0; g <= Math.min(t, 2 * gati); g++) {
      const T = 3 * t + 2 * g, M = R - T;
      if (M < 1) continue;
      let F = 0;
      if (G === 0) F += 0.8;
      if (g >= 1) F += 0.6;
      if (M >= 2 && M <= 2 * T) F += 0.8;
      if ((R + G) % gati === 0) F += 1;
      if ((M + t + g) % gati === 0) F += 0.4;
      if (t >= 5 && t <= 9) F += 0.4;
      out.push({ M, t, g, G, R, T, total, eq: '3 × (' + M + ' + 3 × ' + t + ' + 2 × ' + g + ')' + (G ? ' + 2 × ' + G : '') + ' = ' + total, score: +F.toFixed(2) });
    }
  }
  return out.sort((a, b) => b.score - a.score || a.G - b.G || a.M - b.M).slice(0, o.limit || 16);
}

/* ---------- layouts: the pulses, cell by cell ---------- */
/* parts: [{ role, syl: [...], part, label }] in order. The cells start at the sam of the first row
   (the start's own cycle, or the cycle before for a start before sam). Verifies that the parts fill
   the frame exactly and that a syllable sounds on the landing. */
export function layoutParts(F, parts, o = {}) {
  const C = F.C, lead = F.start >= 0 ? F.start : C + F.start, cells = [];
  for (let i = 0; i < lead; i++) cells.push({ i, syl: '', role: 'pre' });
  parts.forEach((p, k) => (o.sounded && (p.role === 'gap' || p.role === 'pgap') ? kaarvaiOf(p.syl.length) : p.syl).forEach((s, j) => cells.push({ i: cells.length, syl: s, role: p.role, part: p.part == null ? k : p.part, first: j === 0, label: j === 0 ? p.label : undefined })));
  const filled = cells.length - lead, landIndex = lead + F.span;
  if (F.counting === 'end') cells.push({ i: cells.length, syl: o.close || 'tha', role: 'close', first: true, label: 'closing syllable' });
  const last = cells[cells.length - 1];
  const checks = [
    { id: 'fill', ok: filled === F.total, text: filled === F.total ? 'The parts add up to ' + F.total + ' pulses, exactly the space.' : 'The parts add up to ' + filled + ' pulses, but the space is ' + F.total + '.' },
    { id: 'land', ok: cells.length - 1 === landIndex && mod(landIndex - F.land, C) === 0 && !!last.syl && last.syl !== ',',
      text: 'The ' + (F.counting === 'end' ? 'closing “' + last.syl + '”' : 'last syllable “' + last.syl + '”') + ' sounds at ' + where(F.cycle, landIndex).text + ': ' + (F.land === 0 ? 'sam' : offsetText(F.land, F.gati)) + '.' }
  ];
  return { cells, lead, landIndex, ok: checks.every(c => c.ok), checks, sylls: cells.map(c => c.syl) };
}

function moraPartsOf(n, lens, G, label, role) {
  const per = SERIES_GROUPS[n], parts = [];
  let no = 0;
  lens.forEach((P, k) => {
    for (let r = 0; r < per[k]; r++) parts.push({ role: role || 'statement', syl: statementOf(P), part: k, group: k, label: (label || 'statement') + ' ' + (++no) });
    if (k < 2 && G) parts.push({ role: 'gap', syl: rests(G), part: k, label: 'gap' });
  });
  return parts;
}
/* a mora that fills the frame: { P, G, n, shape, d } (n·P + 2G must equal the frame's total) */
export function moraPlan(F, o = {}) {
  if (!F || !F.ok) return { error: (F && F.error) || 'No frame.' };
  const n = o.n || 3, P = Number(o.P), G = Number(o.G), shape = o.shape || 'sama', d = o.d == null ? 1 : Number(o.d);
  const ck = checkMora(F.total, P, G, n);
  if (ck.error) return { error: ck.error };
  if (!ck.ok) return { error: ck.text, fixes: ck.fixes };
  const lens = moraShape(P, shape, d);
  if (!lens) return { error: 'A ' + shape + ' mora needs statements longer than ' + d + '.' };
  const parts = moraPartsOf(n, lens, G);
  const L = layoutParts(F, parts);
  const per = SERIES_GROUPS[n], starts = []; let at = L.lead;
  lens.forEach((len, k) => { for (let r = 0; r < per[k]; r++) { starts.push(at); at += len; } if (k < 2) at += G; });
  const steps = F.steps.concat([
    { id: 'eq', title: n === 'buildup' ? 'One, two, three statements, two gaps' : 'Three statements, two gaps', math: shape === 'sama' ? ck.eq : lens.map((l, k) => per[k] > 1 ? per[k] + ' × ' + l : l).join(' + ') + ' + 2 × ' + G + ' = ' + F.total,
      text: n === 'buildup' ? 'The statement of ' + P + ' once, a gap of ' + G + ', twice, the gap, and three times: 6P + 2G, the uttaranga of the slides’ 96-matra korvai (Unit 3 §7.2).' : shape === 'sama' ? 'A statement of ' + P + ', a gap of ' + G + ', the statement again, the gap, and the statement a third time.' : 'The statements ' + (shape === 'srotovaha' ? 'grow' : 'shrink') + ' by ' + d + ' (' + lens.join(', ') + '): their average is still ' + P + ', so the total does not change.' },
    { id: 'where', title: 'Where each statement starts', math: starts.map(s => where(F.cycle, s).text.replace('cycle ', 'c')).join(' · '),
      text: starts.length === 3 && (lens[0] + G) % F.gati === 0 && shape === 'sama' ? 'Each statement starts at the same place in the beat, which makes it easy to feel.' : 'The statements fall at different places in the beat: a cross-rhythm against the tala.' },
    { id: 'land', title: 'The landing', math: L.checks[1].text, text: L.ok ? 'It lands exactly.' : 'It does not land.' }
  ]);
  return { ok: L.ok, kind: 'mora', n, P, G, shape, lens, parts, layout: L, steps, starts };
}

/* the cells of a purvanga shape */
function purvangaParts(shape) {
  const parts = [];
  const isYati = shape.kind !== 'triple' && shape.kind !== '124', fam = isYati ? nestedPhrases(shape.lines.map(l => l.len)) : null;
  shape.lines.forEach((l, k) => {
    const syl = (l.pre ? PREFIX[l.pre].slice() : []).concat(isYati ? fam[k] : phraseOf(l.len));
    parts.push({ role: 'purvanga', syl, part: k, label: (isYati ? 'line ' : 'phrase ') + (k + 1) });
    if (l.gap) parts.push({ role: 'pgap', syl: rests(l.gap), part: k, label: 'karvai' });
  });
  return parts;
}
/* a korvai: a plan from korvaiPlans, or { V, U, purvanga: shape, uttaranga: { n, P, G } } */
export function korvaiPlan(F, plan, o = {}) {
  if (!F || !F.ok) return { error: (F && F.error) || 'No frame.' };
  if (!plan || !plan.purvanga || !plan.uttaranga) return { error: 'No korvai plan.' };
  const pv = plan.purvanga, u = plan.uttaranga, V = linesLen(pv.lines), U = coefOf(u.n) * u.P + 2 * u.G;
  if (V + U !== F.total) return { error: 'The purvanga (' + V + ') and uttaranga (' + U + ') add up to ' + (V + U) + ', not ' + F.total + '.' };
  const lens = moraShape(u.P, o.shape || 'sama', o.d == null ? 1 : o.d) || [u.P, u.P, u.P];
  const parts = purvangaParts(pv).concat(moraPartsOf(u.n, lens, u.G, 'statement'));
  const L = layoutParts(F, parts);
  const ratio = V / F.total, uStart = where(F.cycle, L.lead + V);
  const steps = F.steps.concat([
    { id: 'split', title: 'Purvanga and uttaranga', math: V + ' + ' + U + ' = ' + F.total + ' (' + Math.round(ratio * 100) + ' : ' + (100 - Math.round(ratio * 100)) + ')',
      text: 'The purvanga develops an idea; the uttaranga is the mora that ends it. Balaji (2024) keeps their ratio between 30 : 70 and 70 : 30' + (ratio >= 0.3 && ratio <= 0.7 ? '; this one is inside it.' : '; this one is outside it, which is not normally done.') },
    { id: 'purvanga', title: 'The purvanga: ' + pv.name, math: pv.formula + ' = ' + V,
      text: pv.kind === 'triple' ? V + ' divides by 3, so the purvanga is one phrase and its karvai, three times.'
        : pv.kind === '124' ? V + ' does not divide by 3. Take away ' + pv.lines.reduce((s, l) => s + l.pre, 0) + ' (' + pv.lines.map(l => l.pre).join(' + ') + ') and ' + (V - pv.lines.reduce((s, l) => s + l.pre, 0)) + ' is left, 3 × ' + pv.lines[0].len + ': the phrase of ' + pv.lines[0].len + ' three times, with prefixes of ' + pv.lines.map(l => l.pre).join(', ') + ' (Balaji’s own rule).'
        : (pv.pattern ? 'Phrases of ' + pv.lines.map(l => l.len).join(', ') + ' (' + pv.pattern.formula + ')' : 'Lines of ' + pv.lines.map(l => l.len).join(', ')) + (pv.lines[0].gap ? ', each with a karvai of ' + pv.lines[0].gap : '') + (pv.also && pv.also.length ? '; also ' + pv.also.join(', ') : '') + '. ' + (V % 3 ? V + ' does not divide by 3, so a pattern shapes it instead of three equal phrases.' : '') },
    { id: 'uttaranga', title: 'The uttaranga: a mora', math: u.eq, text: 'It starts at ' + uStart.text + ' and lands as a mora does.' },
    { id: 'land', title: 'The landing', math: L.checks[1].text, text: L.ok ? 'It lands exactly.' : 'It does not land.' }
  ]);
  return { ok: L.ok, kind: 'korvai', V, U, ratio, purvanga: pv, uttaranga: u, parts, layout: L, steps, thrice: thrice(F) };
}
/* played three times in a row: does the third rendition land where the first did? */
export { thrice as korvaiThrice };
export function thrice(F) {
  const end = F.start + 3 * F.span, ok = mod(end - F.land, F.C) === 0;
  return { ok, text: ok ? 'Played three times in a row (as a korvai normally is), each rendition lands ' + (F.land === 0 ? 'on sam' : offsetText(F.land, F.gati)) + ' and the third ends exactly.'
    : 'Played three times in a row, the renditions drift by ' + beatsText(F.land - F.start, F.gati) + ' each, so the third would not land on ' + (F.land === 0 ? 'sam' : 'the eduppu') + '. Start it where it lands.' };
}
/* a chakradar from chakradarSolutions */
export function chakradarPlan(F, s) {
  if (!F || !F.ok) return { error: (F && F.error) || 'No frame.' };
  if (!s || 3 * (s.M + 3 * s.t + 2 * s.g) + 2 * s.G !== F.total) return { error: 'This chakradar does not fill ' + F.total + ' pulses.' };
  const parts = [];
  for (let r = 0; r < 3; r++) {
    parts.push({ role: 'mukhra', syl: phraseOf(s.M), part: r, label: 'mukhra ' + (r + 1) });
    for (let k = 0; k < 3; k++) { parts.push({ role: 'statement', syl: statementOf(s.t), part: r, group: r * 3 + k, label: 'tihai ' + (r + 1) + ', statement ' + (k + 1) }); if (k < 2 && s.g) parts.push({ role: 'gap', syl: rests(s.g), part: r, label: 'gap' }); }
    if (r < 2 && s.G) parts.push({ role: 'pgap', syl: rests(s.G), part: r, label: 'karvai' });
  }
  const L = layoutParts(F, parts);
  const steps = F.steps.concat([
    { id: 'eq', title: 'A tihai of tihais', math: s.eq, text: 'Each of the three repetitions is a mukhra of ' + s.M + ' and a tihai of 3 × ' + s.t + ' + 2 × ' + s.g + ' = ' + s.T + (s.G ? ', with a karvai of ' + s.G + ' between repetitions' : '') + '. Only the last tihai lands.' },
    { id: 'land', title: 'The landing', math: L.checks[1].text, text: L.ok ? 'It lands exactly.' : 'It does not land.' }
  ]);
  return { ok: L.ok, kind: 'chakradar', sol: s, parts, layout: L, steps };
}

/* ---------- trikaala ---------- */
/* a jati of n in three speeds (Balaji 2024 pp. 57–58): once at one a beat, twice at two, four times at four,
   3n beats in all, started (k·beats − 3n) beats into the cycle so it ends on sam. variant: 'full',
   'gap' (the concert form: the fourth third-speed rendition left as a gap at the start) or 'lead' (played first). */
export function trikaala(o = {}) {
  const n = val(o.n, 5), variant = o.variant || 'full';
  if (!Number.isInteger(n) || n < 1 || n > 16) return { error: 'The jati must be a whole number from 1 to 16; got ' + o.n + '.' };
  if (!['full', 'gap', 'lead'].includes(variant)) return { error: 'The variant is full, gap or lead.' };
  let tl;
  try { tl = o.tala && o.tala.angas ? o.tala : makeTala(o.fam == null ? 'triputa' : String(o.fam), val(o.L, 4)); } catch (e) { return { error: e.message }; }
  const kalai = val(o.kalai, 1);
  if (!KALAIS.includes(kalai)) return { error: 'The kalai must be 1, 2 or 4.' };
  const B = tl.total * kalai, cycles = Math.ceil(3 * n / B), startBeat = cycles * B - 3 * n;
  if (cycles > MAX_CYCLES) return { error: 'This trikaala needs more than ' + MAX_CYCLES + ' avartanams.' };
  const F = korvaiFrame({ tala: tl, gati: 4, kalai, cycles, start: 4 * startBeat, land: 0, counting: 'end' });
  const syl = jatiOf(n), sp = (k, cellsPer) => { const out = []; syl.forEach(s => { out.push(s); for (let j = 1; j < cellsPer; j++) out.push(s === ',' ? ',' : ''); }); return out; };
  const A = { role: 'speed1', syl: sp(1, 4), label: 'first speed' };
  const Bs = [1, 2].map(r => ({ role: 'speed2', syl: sp(2, 2), part: r, label: 'second speed ' + r }));
  const Cs = [1, 2, 3, 4].map(r => ({ role: 'speed3', syl: syl.slice(), part: r, label: 'third speed ' + r }));
  const parts = variant === 'full' ? [A].concat(Bs, Cs) : variant === 'lead' ? [Cs[3], A].concat(Bs, Cs.slice(0, 3)) : [{ role: 'pgap', syl: rests(n), label: 'karvai' }, A].concat(Bs, Cs.slice(0, 3));
  const L = layoutParts(F, parts, { close: 'tha' });
  const steps = F.steps.slice(0, 1).concat([
    { id: 'beats', title: 'Three speeds, the same length each', math: n + ' × 1 + ' + n + ' × 2 ÷ 2 + ' + n + ' × 4 ÷ 4 = 3 × ' + n + ' = ' + 3 * n + ' beats',
      text: 'Once at one syllable a beat, twice at two, four times at four: each speed takes ' + n + ' beats.' + (variant === 'gap' ? ' In a concert the third speed is said three times, and the fourth is left as a gap at the start.' : variant === 'lead' ? ' Here the fourth third-speed rendition is moved to the very start.' : '') },
    { id: 'start', title: 'Counting back from sam', math: cycles + ' × ' + B + ' − ' + 3 * n + ' = ' + startBeat + ' beats to leave',
      text: 3 * n + ' beats ' + (3 * n <= B ? 'fit in one cycle' : 'need ' + plural(cycles, 'cycle')) + ': leave ' + plural(startBeat, 'beat') + ' and start on beat ' + (startBeat + 1) + ' to end on sam.' }
  ]);
  return { ok: L.ok, kind: 'trikaala', n, variant, frame: F, startBeat, cycles, parts, layout: L, steps };
}

/* ---------- gati ---------- */
/* the gatis in which the same total, recited at that many pulses a beat, still fills whole avartanams
   (Balaji 2024 p. 64: a three-cycle Adi korvai goes into tisra, a five-cycle one into khanda) */
export function gatiFits(total, beats, gatis = [3, 4, 5, 7, 9]) {
  return gatis.map(g => ({ gati: g, ok: total % (beats * g) === 0, cycles: total / (beats * g) }));
}

/* ---------- to the judge ---------- */
/* a laid-out mora, korvai or chakradar as JathiScript, so the jathi judge can check it independently:
   the final mora is written as an explicit teermanam, {statement}/gap. Returns { script } or { error }. */
export function toJathiScript(F, R) {
  if (!F || !F.ok || !R || !R.ok) return { error: 'There is nothing to check yet.' };
  if (R.kind === 'trikaala') return { error: 'A trikaala changes speed and has no teermanam; the checker reads moras, korvais and chakradars.' };
  if (R.kind === 'mora' && R.shape !== 'sama') return { error: 'The checker recognises a mora by three identical statements; write a shaped mora out by hand to check it.' };
  let N = F.cycles, at = F.land;
  const writeClose = !(F.counting === 'end' && F.land === 0);
  if (writeClose && at < 0) { N -= 1; at += F.C; }
  if (N < 1) return { error: 'The checker counts whole avartanams from the start; this one lands before the first sam.' };
  const word = syl => syl.join('-');
  const parts = R.parts, lines = [];
  // the teermanam: the last three statement groups and their two gaps
  let tStart = parts.length;
  const isT = p => p.role === 'statement' || p.teer;
  for (let seen = 0, i = parts.length - 1; i >= 0 && seen < 3; i--) { if (isT(parts[i])) { tStart = i; if (i === 0 || !isT(parts[i - 1]) || parts[i - 1].group !== parts[i].group) seen++; } else if (parts[i].role !== 'gap') break; }
  const tParts = parts.slice(tStart), groups = [];
  tParts.forEach(p => { if (isT(p)) { const g = groups[groups.length - 1]; if (g && g.group === p.group) g.syl = g.syl.concat(p.syl); else groups.push({ group: p.group, syl: p.syl.slice() }); } });
  const gap = (tParts.find(p => p.role === 'gap') || { syl: [] }).syl.length;
  if (groups.length !== 3 || groups.some(g => g.syl.join() !== groups[0].syl.join())) return { error: 'The ending is not three identical statements.' };
  parts.slice(0, tStart).forEach(p => lines.push(p.role === 'gap' || p.role === 'pgap' ? p.syl.join(' ') : word(p.syl)));
  const body = [];
  lines.forEach(l => { if (/^,/.test(l) && body.length) body[body.length - 1] += ' ' + l; else body.push(l); });
  const spec = talaSpec(F.tala);
  const out = ['# Korvai lab: ' + R.kind + ' for ' + F.tala.name + ', ' + plural(F.cycles, 'avartanam') + ', gati ' + F.gati,
    'tala: ' + spec, 'nadai: ' + F.gati].concat(F.kalai > 1 ? ['kalai: ' + F.kalai] : [], ['avartanams: ' + N,
    'eduppu: ' + (F.start === 0 ? 'sam' : (F.start > 0 ? '+' : '') + F.start), 'land: ' + (writeClose ? (at === 0 ? 'sam' : '+' + at) : 'end'), '']);
  body.forEach(l => out.push(l));
  out.push('{' + word(groups[0].syl) + '}/' + gap + (writeClose && F.counting === 'end' ? ' ' + (R.layout.cells[R.layout.cells.length - 1].syl || 'tha') : ''));
  return { script: out.join('\n') + '\n' };
}

// v0.8.1: the purvanga patterns and yatis, and the constructions of the Unit 3 notes
export * from './patterns.js';
export * from './compose.js';
export * from './explore.js';
