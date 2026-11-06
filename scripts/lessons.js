/* Vocal Gym · the Gurukulam geetham notes in the repertoire (v0.9.3)
   The book, read by scripts/lessons-extract.py into data/lessons/gurukulam.raw.json, becomes compositions in the shape
   the importer writes (scripts/import-repertoire.js), and is merged with the site's. A geetham can be in both: overlaps
   are found by comparing swaras, not titles (the spellings differ too much), and the notation that holds up best is used:
     fit       the share of lines that fill the tala's cycles, with their cells on anga lines (a short last line is an ending)
     raga      the share of swaras the raga has, by the scale the source prints, checked against its parent mela
     octave    the share of steps that do not leap further than an octave's worth: an upper or lower mark left off shows here
     whole     how much of the longest version it has
     agree     how much of it the other versions confirm: runs of eight swaras, with their octaves
     sahitya   the share of lines with their syllables, where the piece has words
   Every decision is kept with the composition (compared), and --report prints them all.

   Usage: node scripts/lessons.js [--report]   (import-repertoire.js calls mergeLessons when it writes the data) */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseCell, cellUnits, lineUnits, talaOf, rowFits } from '../src/engine/repertoire.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW = n => JSON.parse(readFileSync(join(ROOT, 'data', 'lessons', n + '.raw.json'), 'utf8'));
export const SOURCES = {
  gurukulam: { name: 'Geetham notes', author: 'Gurukulam & SF', url: '', note: 'GURUKULAM_NOTES' }
};
const slug = s => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const asc = (...t) => t.join(' ').split(/\s+/);
const FULL = ['Adi', 'Roopakam'];
const fix0 = { full: 0, lead: 0, joined: 0, tail: 0, link: 0, partial: 0, fast4: 0, badChars: 0 };

/* the shape the app reads; lines are placed on the cycle as the importer places them */
function compose({ key, source, name, title, type, raga, ragas, tala, composer, language, sections, pages, ragamalika }) {
  const tl = talaOf(tala), stats = Object.assign({ rows: 0, lines: 0, sahitya: 0 }, fix0);
  const rows = sections.flatMap(s => s.lines);
  // units per beat: given by a section, or the largest that makes the most rows fit
  sections.forEach(s => {
    const upb = s.unitsPerBeat || 1, cyc = tl.tala.total * upb;
    s.lines.forEach((l, i) => {
      stats.rows++; stats.lines++; if (l.syl && l.syl.length) stats.sahitya++;
      const u = lineUnits(l.cells), whole = Math.abs(u / cyc - Math.round(u / cyc)) < 1e-9;
      if (whole && u > 0) stats.full++;
      else if (u < cyc && i === s.lines.length - 1) { l.link = true; stats.link++; }
      else stats.partial++;
    });
    if (s.unitsPerBeat === 1) delete s.unitsPerBeat;
  });
  return {
    id: 'lesson-' + source + '-' + key, title: title || name, name, url: SOURCES[source].url || '', source: Object.assign({ id: source, pages }, SOURCES[source]),
    published: '', updated: '', type, raga, ragamalika: !!ragamalika,
    tala: { name: tl.name, fam: tl.fam, L: tl.L, nadai: tl.nadai, unitsPerBeat: 1, written: tala },
    composer: composer || '', language: language || '', deity: [], ragas, sections: sections.map(s => Object.assign({ title: s.title || '', lyrics: s.lyrics || [], raga: s.raga == null ? 0 : s.raga, lines: s.lines }, s.unitsPerBeat ? { unitsPerBeat: s.unitsPerBeat } : {})), stats, unknown: ''
  };
}
/* ---------------------------------------- Gurukulam: rows on a fixed grid ---------------------------------------- */
/* each geetham's header, read from its page. This book numbers G and N by the twelve notes (G1 and G2, N1 and N2), most
   pages: G2 is the antara gandhara and N1 the kaisiki nishada; its Kalyani page uses the usual sixteen, and its Nata
   pages write R3 as G1, as they say. The scales below are in the usual names (those of the engine), each checked against
   the parent mela the page names; printed gives what the page prints, where that differs. */
const GK = [
  [8, 'Sri Gananatha (Lambodara)', 'Malahari', 'Roopakam', 'Purandaradasa', 'Geetham', "S R1 M1 P D1 S'", "S' D1 P M1 G3 R1 S", "S’ D1 P M1 G2 R1 S"],
  [10, 'Kunda Gaura', 'Malahari', 'Roopakam', 'Purandaradasa', 'Geetham', "S R1 M1 P D1 S'", "S' D1 P M1 G3 R1 S", "S’ D1 P M1 G2 R1 S"],
  [12, 'Kereya Neeranu', 'Malahari', 'Tisra Triputa', 'Purandaradasa', 'Geetham', "S R1 M1 P D1 S'", "S' D1 P M1 G3 R1 S", "S’ D1 P M1 G2 R1 S"],
  [14, 'Padumanabha', 'Malahari', 'Tisra Triputa', 'Purandaradasa', 'Geetham', "S R1 M1 P D1 S'", "S' D1 P M1 G3 R1 S", "S’ D1 P M1 G2 R1 S"],
  [17, 'Bhaya Samaya', 'Deshakshi', 'Tisra Triputa', 'Purandaradasa', 'Geetham', "S R2 G3 P D2 S'", "S' N3 D2 P M1 G3 R2 S", "S R2 G2 P D2 S’ - S’ N2 D2 P M1 G2 R2 S"],
  [19, 'Analekara', 'Shuddha Saveri', 'Tisra Triputa', 'Purandaradasa', 'Geetham', "S R2 M1 P D2 S'", "S' D2 P M1 R2 S"],
  [22, 'Janaka Suta', 'Saveri', 'Roopakam', 'Purandaradasa', 'Geetham', "S R1 M1 P D1 S'", "S' N3 D1 P M1 G3 R1 S", "S’ N2 D1 P M1 G2 R1 S"],
  [24, 'Sri Rama Chandra', 'Bhairavi', 'Dhruva', '', 'Geetham', "S G2 R2 G2 M1 P D2 N2 S'", "S' N2 D1 P M1 G2 R2 S", "S G1 R2 G1 M2 P D2 N1 S’ - S’ N2 D1 P M1 G1 R2 S"],
  [26, 'Kamala Sulochana', 'Anandabhairavi', 'Adi', 'Purandaradasa', 'Geetham', "S G2 R2 G2 M1 P D2 P S'", "S' N2 D2 P M1 G2 R2 S", "S G1 R2 G1 M1 P D2 P S’ - S’ N1 D2 P M1 G1 R2 S"],
  [29, 'Vara Veena', 'Mohanam', 'Roopakam', 'Purandaradasa', 'Geetham', "S R2 G3 P D2 S'", "S' D2 P G3 R2 S", "S R2 G2 P D2 S’ - S’ D2 P G2 R2 S"],
  [31, 'Mandaradhare', 'Kambhoji', 'Adi', 'Paidala Gurumurti Sastri', 'Geetham', "S R2 G3 M1 P D2 S'", "S' N2 D2 P M1 G3 R2 S", "S R2 G2 M1 P D2 S’ - S’ N1 D2 P M1 G2 R2 S"],
  [33, 'Govindachyuta', 'Shankarabharanam', 'Matya', '', 'Geetham', "S R2 G3 M1 P D2 N3 S'", "S' N3 D2 P M1 G3 R2 S", "S R2 G2 M1 P D2 N2 S’ - S’ N2 D2 P M1 G2 R2 S"],
  [35, 'Saraswati', 'Begada', 'Tisra Triputa', 'Purandaradasa', 'Geetham', "S G3 R2 G3 M1 P D2 P S'", "S' N2 D2 P M1 G3 R2 S", "S G2 R2 G2 M1 P D2 P S’ - S’ N1 D2 P M1 G2 R2 S"],
  [37, 'Kamalajadala', 'Kalyani', 'Tisra Triputa', 'Purandaradasa', 'Geetham', "S R2 G3 M2 P D2 N3 S'", "S' N3 D2 P M2 G3 R2 S"],
  [40, 'Amari Kabari', 'Nata', 'Eka', 'Appayya Dikshitar', 'Geetham', "S R3 G3 M1 P N3 S'", "S' N3 P M1 R3 S", "S G1 G2 M1 P N1 N2 S’ - S’ N2 P M1 G1 S"],
  [42, 'Sri Rama Chandra', 'Gaula', 'Roopakam', 'Paidala Gurumurti Sastri', 'Geetham', "S R1 M1 P N3 S'", "S' N3 P M1 R1 G3 M1 R1 S", "S R1 M1 P N2 S’ - S’ N2 P M1 R1 G2 M1 R1 S"],
  [44, 'Re Re Sri Rama', 'Arabhi', 'Tisra Triputa', 'Paidala Gurumurti Sastri', 'Geetham', "S R2 M1 P D2 S'", "S' N3 D2 P M1 G3 R2 S", "S’ N2 D2 P M1 G2 R2 S"],
  [46, 'Meenakshi Jaya Kamakshi', 'Sree', 'Dhruva', 'Paidala Gurumurti Sastri', 'Geetham', "S R2 M1 P N2 S'", "S' N2 P M1 R2 G2 R2 S", "S R2 M1 P N1 S’ - S’ N1 P M1 R2 G1 R2 S"],
  [49, 'Vande Madhavam', 'Varali', 'Matya', 'Paidala Gurumurti Sastri', 'Geetham', "S G1 R1 G1 M2 P D1 N3 S'", "S' N3 D1 P M2 G1 R1 S", "S R2 R1 G1 M2 P D1 N2 S’ - S’ N2 D1 P M2 R2 R1 S"],
  [53, 'Jaya Karunasindho', 'Dhanyasi', 'Dhruva', 'Paidala Gurumurti Sastri', 'Lakshana geetham', "S G2 M1 P N2 S'", "S' N2 D1 P M1 G2 R1 S", "S G1 M1 P N1 S’ - S’ N1 D1 P M1 G1 R1 S"],
  [56, 'Kamsasura Khandana', 'Sahana', 'Matya', 'Paidala Gurumurti Sastri', 'Lakshana geetham', "S R2 G3 M1 P M1 D2 N2 S'", "S' N2 D2 P M1 G3 M1 R2 G3 R2 S", "S R2 G2 M1 P M1 D2 N1 S’ - S’ N1 D2 P M1 G2 M1 R2 G2 R2 S"],
  [61, 'Arabhi Raga Lakshanam', 'Arabhi', 'Misra Jhampa', 'Paidala Gurumurti Sastri', 'Lakshana geetham', "S R2 M1 P D2 S'", "S' N3 D2 P M1 G3 R2 S", "S’ N2 D2 P M1 G2 R2 S"],
  [65, 'Ganavidya Durandhara', 'Nata', 'Dhruva', 'Paidala Gurumurti Sastri', 'Lakshana geetham', "S R3 G3 M1 P D3 N3 S'", "S' N3 P M1 R3 S", "S G1 G2 M1 P N1 N2 S’ - S’ N2 P M1 G1 S"],
  [69, 'Sri Himachala Suthe', 'Nata', 'Dhruva', 'Kandragula Gopalaraya', 'Lakshana geetham', "S R3 G3 M1 P D3 N3 S'", "S' N3 P M1 R3 S", "S G1 G2 M1 P N1 N2 S’ - S’ N2 P M1 G1 S"],
  [73, 'Pahi Sri Ramachandra', 'Anandabhairavi', 'Khanda Ata', 'Paidala Gurumurti Sastri', 'Geetham', "S G2 R2 G2 M1 P D2 P S'", "S' N2 D2 P M1 G2 R2 S", "S G1 R2 G1 M1 P D2 P S’ - S’ N1 D2 P M1 G1 R2 S"],
  [75, 'Palaya Nagesvara', 'Bilahari', 'Matya', 'Paidala Gurumurti Sastri', 'Geetham', "S R2 G3 P D2 S'", "S' N3 D2 P M1 G3 R2 S", "S R2 G2 P D2 S’ - S’ N2 D2 P M1 G2 R2 S"],
  [79, 'Bhuvanatraya Mohana', 'Kambhoji', 'Dhruva', 'Paidala Gurumurti Sastri', 'Geetham', "S R2 G3 M1 P D2 S'", "S' N2 D2 P M1 G3 R2 S", "S R2 G2 M1 P D2 P S’ - S’ N1 D2 P M1 G2 R2 S"],
  [82, 'Janakiramana Te Namo', 'Neelambari', 'Tisra Triputa', 'Paidala Gurumurti Sastri', 'Geetham', "S R2 G3 M1 P N3 S'", "S' N3 P M1 G3 R2 G3 S", "S R2 G2 M1 P N2 S’ - S’ N2 P M1 G2 R2 G2 S"],
  [84, 'Sri Lola Sritapala', 'Malayamarutam', 'Roopakam', '', 'Geetham', "S R1 G3 P D2 N2 S'", "S' N2 D2 P G3 R1 S", "S R1 G2 P D2 N1 S’ - S’ N1 D2 P G2 R1 S"],
  [86, 'Vani Veena Pustaka Pani', 'Hindolam', 'Adi', '', 'Geetham', "S G2 M1 D1 N2 S'", "S' N2 D1 M1 G2 S", "S G1 M1 D1 N1 S’ - S’ N1 D1 M1 G1 S"],
  [88, 'Harihara Vinuta', 'Nata', 'Eka', '', 'Geetham', "S R3 G3 M1 P D3 N3 S'", "S' N3 P M1 R3 S", "S G1 G2 M1 P N1 N2 S’ - S’ N2 P M1 G1 S"]
];
export function gurukulamPieces(raw = RAW('gurukulam')) {
  const out = [];
  GK.forEach((g, i) => {
    const [page, name, raga, tala, composer, type, aro, avaro, printed] = g, end = (GK[i + 1] || [999])[0] - 1, lines = [];
    raw.forEach((r, k) => {
      if (r.k !== 'S' || r.p < page || r.p > end) return;
      // one cell for each stretch between bars; a double bar is two lines close together
      const edges = []; r.bars.forEach(b => { if (!edges.length || b - edges[edges.length - 1] >= 4) edges.push(b); });
      const seen = [], cells = [[]]; let at = 0;
      const slips = [];
      r.toks.forEach(t => {
        while (at < edges.length && t.x > edges[at]) { cells.push([]); at++; }
        if (t.c === 'a') { slips.push('stray'); return; }     // "Pa" typed for P
        const L = t.c === ',' ? ',' : t.c.toUpperCase();
        if (t.c !== ',' && t.c !== L) slips.push('case');
        const text = L + (t.o > 0 ? "'" : t.o < 0 ? '.' : '');
        cells[cells.length - 1].push(text); seen.push({ x: t.x, text });
      });
      const used = cells.filter(c => c.length);
      const line = { cells: used.map(c => c.join(' ')) };
      if (slips.length) line.fixed = [{ cell: 0, was: r.toks.map(t => t.c + (t.o > 0 ? '’' : t.o < 0 ? '.' : '')).join(' '), why: ['letter'] }];
      // each word under the swara whose column it starts in
      const next = raw[k + 1];
      if (next && next.k === 'T') {
        const syl = [];
        next.words.forEach(w => {
          let best = 0, gap = 1e9;
          seen.forEach((t, j) => { const d = Math.abs(t.x - w.x); if (d < gap) { gap = d; best = j; } });
          if (seen.length) syl.push([best, w.t]);
        });
        const clean = syl.filter(x => /[a-zA-Z]/.test(x[1]));
        if (clean.length) line.syl = clean;
      }
      lines.push(line);
    });
    const scale = { name: raga, aro: asc(aro), avaro: asc(avaro), note: '' };
    if (printed) scale.was = raga + ' - ' + printed;
    out.push(compose({ key: slug(name + '-' + raga), source: 'gurukulam', name, title: name + ' - ' + raga + ' - ' + tala + (composer ? ' - ' + composer : ''), type, raga, ragas: [scale], tala, composer, sections: [{ title: '', lyrics: [], lines }], pages: [page, end] }));
  });
  return out;
}

/* ---------------------------------------- which notation holds up ---------------------------------------- */
const RANK = { S: 0, R: 1, G: 2, M: 3, P: 4, D: 5, N: 6 };
const letters = c => c.sections.flatMap(s => s.lines.flatMap(l => l.cells.flatMap(x => parseCell(x).filter(t => t.s !== ',').map(t => t.s))));
const GRAM = 8;
const markedGrams = c => { const a = c.sections.flatMap(s => s.lines.flatMap(l => l.cells.flatMap(x => parseCell(x).filter(t => t.s !== ',').map(t => t.s + (t.o > 0 ? "'" : t.o < 0 ? '.' : ''))))), g = new Set(); for (let i = 0; i + GRAM <= a.length; i++) g.add(a.slice(i, i + GRAM).join('')); return g; };
const gramsOf = c => { const a = letters(c), g = new Set(); for (let i = 0; i + GRAM <= a.length; i++) g.add(a.slice(i, i + GRAM).join('')); return g; };
export function measure(c) {
  const tl = c.tala ? talaOf(c.tala.name) : null;
  let lines = 0, fits = 0, swaras = 0, inScale = 0, steps = 0, leaps = 0, withSyl = 0, shorthand = 0;
  c.sections.forEach(s => {
    const upb = s.unitsPerBeat || (c.tala && c.tala.unitsPerBeat) || 1, sc = c.ragas[s.raga != null ? s.raga : 0];
    const has = new Set(sc ? sc.aro.concat(sc.avaro).map(x => x[0]) : []);
    s.lines.forEach((l, i) => {
      let prev = null;
      lines++;
      if (l.shorthand) shorthand++;
      if (l.syl && l.syl.length) withSyl++;
      const us = l.cells.map(cellUnits), sum = us.reduce((a, b) => a + b, 0), cyc = tl ? tl.tala.total * upb : 0;
      // a line that fills its cycles, a short phrase or lead-in the source writes on purpose, or a short last line
      if (!tl || rowFits(tl.tala, upb, us) || l.at || l.tail || l.join || (s.lines[i + 1] && s.lines[i + 1].join) || (l.link && sum < cyc)) fits++;
      l.cells.forEach(x => parseCell(x).forEach(t => {
        if (t.s === ',') return;
        swaras++;
        if (!has.size || has.has(t.s)) inScale++;
        const r = RANK[t.s] + 7 * t.o;
        if (prev != null) { steps++; if (Math.abs(r - prev) > 7) leaps++; }
        prev = r;
      }));
    });
  });
  return { lines, swaras, fit: lines ? fits / lines : 0, raga: swaras ? inScale / swaras : 0, octave: steps ? 1 - leaps / steps : 1, sahitya: lines ? withSyl / lines : 0, shorthand };
}
const round = x => Math.round(x * 1000) / 1000;
/* the versions of one lesson, scored side by side: math first */
export function rank(versions) {
  const all = new Set(); const grams = versions.map(c => { const g = gramsOf(c); g.forEach(x => all.add(x)); return g; });
  const marked = versions.map(markedGrams);
  const anyWords = versions.some(c => c.sections.some(s => s.lines.some(l => l.syl && l.syl.length)));
  return versions.map((c, i) => {
    const m = measure(c), whole = all.size ? grams[i].size / all.size : 1;
    // how much of this version the others confirm, swara for swara with the octaves: only another source shows a mark left off
    let same = 0; const own = marked[i];
    own.forEach(k => { if (marked.some((o, j) => j !== i && o.has(k))) same++; });
    const agree = versions.length > 1 && own.size ? same / own.size : 1;
    const score = .4 * m.fit + .15 * m.raga + .1 * m.octave + .15 * whole + .15 * agree + (anyWords ? .05 * m.sahitya : .05);
    return { c, hard: round(.5 * m.fit + .25 * m.raga + .25 * m.octave), score: round(score), fit: round(m.fit), raga: round(m.raga), octave: round(m.octave), whole: round(whole), agree: round(agree), sahitya: round(m.sahitya), lines: m.lines, shorthand: m.shorthand };
  }).sort((a, b) => b.score - a.score);
}
/* which compositions hold the same music: how much of the smaller is in the larger, by runs of eight swaras */
export function overlaps(pieces, comps, min = .5) {
  const cg = comps.map(c => ({ c, g: gramsOf(c) }));
  return pieces.map(p => {
    const g = gramsOf(p), hits = [];
    cg.forEach(({ c, g: h }) => {
      if (c === p || !g.size || !h.size) return;
      let n = 0; g.forEach(x => { if (h.has(x)) n++; });
      const of = n / Math.min(g.size, h.size);
      if (of >= min) hits.push({ id: c.id, of: round(of), inP: round(n / g.size), inC: round(n / h.size) });
    });
    return { p, hits: hits.sort((a, b) => b.of - a.of) };
  });
}
/* one lesson, its versions. The groups were read from overlaps() and checked by hand: a Lakshana geetham's text is
   not enough to tell. b: a composition of the site, found by the end of its id; g: Gurukulam. */
const SAME = [
  ['bhaya samaya', 'b:bhayasamaya-dhevuni-dhesakshi-geetham', 'g:bhaya-samaya-deshakshi'],
  ['analekara', 'b:geetham-aanalekara-shuddhasaveri-tisra', 'g:analekara-shuddha-saveri'],
  ['janaka suta', 'b:geetham-janakasutha-saveri-roopakam', 'g:janaka-suta-saveri'],
  ['sri rama chandra bhairavi', 'b:bhairavi-shreeramachandra-dhruva-geetham', 'g:sri-rama-chandra-bhairavi'],
  ['kamala sulochana', 'b:geetham-kamalasulochana-anandhabhairavi', 'g:kamala-sulochana-anandabhairavi'],
  ['vara veena', 'b:geetham-varaveena-mohanam-roopakam', 'g:vara-veena-mohanam'],
  ['mandaradhare', 'b:geetham-mandharoddhare-kambhoji-aadhi', 'g:mandaradhare-kambhoji'],
  ['govindachyuta', 'b:geetham-govindahare-shankarabharanam', 'g:govindachyuta-shankarabharanam'],
  ['saraswati', 'b:begade-saraswathi-nanna-naligeyalli', 'g:saraswati-begada'],
  ['kamalajadala', 'b:geetham-kamalajadhala-kalyani-tisra', 'g:kamalajadala-kalyani'],
  ['amari kabari', 'b:nattai-amari-kabari-geetham-eka', 'g:amari-kabari-nata'],
  ['sri rama chandra gaula', 'b:shri-ramachandhra-gowlam-geetham', 'g:sri-rama-chandra-gaula'],
  ['re re sri rama', 'b:aarabhi-rey-rey-shree-ramachandhra', 'g:re-re-sri-rama-arabhi'],
  ['meenakshi', 'b:geetham-meenakshi-shree-dhruva-paidala', 'g:meenakshi-jaya-kamakshi-sree'],
  ['vande madhavam', 'b:vandhe-madhavam-varali-geetham', 'g:vande-madhavam-varali'],
  ['jaya karunasindho', 'b:dhanyasi-jayakarunasindho-lakshana', 'g:jaya-karunasindho-dhanyasi'],
  ['kamsasura', 'b:sahana-kamsasura-lakshana-geetham', 'g:kamsasura-khandana-sahana'],
  ['arabhi lakshanam', 'b:lakshana-geetham-arabhi-mishra-jhampe', 'g:arabhi-raga-lakshanam-arabhi'],
  ['sri lola', 'b:malayamarutham-shri-lola-geetham', 'g:sri-lola-sritapala-malayamarutam']
];
/* a post of the site that gathers several lessons, each now its own piece */
const GATHERED = [['pillari-geethams-malahari-purandaradaasa', ['g:sri-gananatha-lambodara-malahari', 'g:kunda-gaura-malahari', 'g:kereya-neeranu-malahari', 'g:padumanabha-malahari']]];
/* v0.9.4: not in the repertoire: all the Basics (the varisais, the alankarams, the pages on swaras and melakartas). The
   app's Alankara page is another matter. */
const isRemoved = c => c.type === 'Basics';
/* v0.9.4: the meaning of each geetham in the Gurukulam notes (read from the pages by eye and checked against the book's
   glyph shapes, then its English spelling and grammar corrected; the lyric lines and the glosses stay as printed), keyed by the piece. It goes with the geetham whichever version's notation is used. */
const MEANINGS = JSON.parse(readFileSync(join(ROOT, 'data', 'lessons', 'gurukulam-meanings.json'), 'utf8'));
function meaningOf(key) {
  const m = MEANINGS[key], { name, author, url } = SOURCES.gurukulam;
  return m ? { source: { name, author, url, pages: m.pages }, parts: m.parts, words: m.words } : null;
}
const MARGIN = .015;   // a composition already in the repertoire stays unless another version is clearly better
/* the rules, in order. A line or two is no version to judge by, when another has the piece. Math first: a version must
   fill the tala about as well as the best (a garbled reading can look long). Of those, one with under half of the
   longest is a fragment. Of the rest, the cleanest by tala, raga and octave. Between equals the overall score decides,
   and what is already in the repertoire stays unless another is clearly better. ranked: from rank(), best first. */
export function choose(ranked, site) {
  const most = Math.max(...ranked.map(r => r.whole));
  const real = ranked.filter(r => r.lines >= 3 || r.whole >= most * .6);
  const topFit = Math.max(...real.map(r => r.fit));
  const fitting = real.filter(r => r.fit >= topFit - .1), long = Math.max(...fitting.map(r => r.whole));
  const fair = fitting.filter(r => r.whole >= long * .5), cleanest = Math.max(...fair.map(r => r.hard));
  const pool = fair.filter(r => r.hard >= cleanest - .001), best = pool[0];
  const siteR = site && pool.find(r => r.c === site);
  return siteR && best.score < siteR.score + MARGIN ? siteR : best;
}
const SRC = { g: 'gurukulam' };
export function mergeLessons(comps, pieces) {
  const P = (pieces || gurukulamPieces()).filter(p => !isRemoved(p));
  comps = comps.filter(c => !isRemoved(c));
  const lesson = t => { const [k, id] = t.split(':'); return k === 'b' ? comps.find(c => c.id.endsWith(id)) : P.find(p => p.id === 'lesson-' + SRC[k] + '-' + id); };
  const grouped = new Set(), out = comps.slice(), report = [], redirects = {}, replace = (old, c) => { out[out.indexOf(old)] = c; };
  SAME.forEach(([label, ...tags]) => {
    const versions = tags.map(lesson);
    versions.forEach((v, i) => { if (!v) throw new Error('No version ' + tags[i] + ' of ' + label); grouped.add(v); });
    const ranked = rank(versions), site = versions.find(v => !v.source);
    const winner = choose(ranked, site);
    const compared = ranked.map(r => ({ source: r.c.source ? r.c.source.name : 'Carnatic Music Notations', pages: r.c.source ? r.c.source.pages : undefined, url: r.c.url || undefined, score: r.score, fit: r.fit, raga: r.raga, octave: r.octave, whole: r.whole, agree: r.agree, lines: r.lines, used: r === winner || undefined }));
    let c = winner.c;
    if (site && c !== site) {
      const words = site.sections.filter(x => !x.lines.length && x.lyrics.length).map(x => Object.assign({}, x, { raga: 0 }));
      c = Object.assign({}, c, { id: site.id, updated: site.updated, published: site.published, siteUrl: site.url, deity: site.deity, language: site.language, composer: c.composer || site.composer, sections: words.concat(c.sections) });
    }
    const g = tags.find(t => t.startsWith('g:')), meaning = g && meaningOf(g.slice(2));
    c = Object.assign({}, c, { compared }, meaning ? { meaning } : {});
    if (site) replace(site, c); else out.push(c);
    report.push({ label, used: winner.c.source ? winner.c.source.id : 'site', id: c.id, compared });
  });
  P.filter(p => !grouped.has(p)).forEach(p => {
    const meaning = p.source.id === 'gurukulam' && meaningOf(p.id.replace('lesson-gurukulam-', ''));
    out.push(meaning ? Object.assign({}, p, { meaning }) : p); report.push({ label: p.name, used: p.source.id, id: p.id, compared: [] });
  });
  GATHERED.forEach(([id, tags]) => {
    const old = out.find(c => c.id.endsWith(id));
    if (!old) return;
    const parts = tags.map(lesson).map(v => out.find(c => c.id === v.id));
    const mo = rank([old].concat(parts.filter(Boolean))).find(r => r.c === old), mp = parts.map(measure);
    if (parts.every(Boolean) && mp.every(m => m.fit >= measure(old).fit)) { redirects[old.id] = parts[0].id; out.splice(out.indexOf(old), 1); report.push({ label: 'gathered post ' + id, used: 'gurukulam', id: parts.map(x => x.id).join(', '), compared: [] }); }
  });
  return { comps: out, report, redirects };
}
export { compose, RAW, slug, gramsOf };
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1] && process.argv.includes('--report')) {
  const dir = join(ROOT, 'data', 'repertoire', 'c');
  // the decisions as the last import stored them: where a book's notation won, the site's parse is no longer on disk to compare again
  const comps = (await import('node:fs')).readdirSync(dir).map(n => JSON.parse(readFileSync(join(dir, n), 'utf8'))).filter(c => c.source || c.compared);
  comps.forEach(r => { console.log(r.name.padEnd(30), '→', (r.source ? r.source.id : 'site').padEnd(10), r.compared ? r.compared.map(c => (c.used ? '*' : ' ') + c.source.split(' ')[0].slice(0, 8) + ' ' + c.score + ' (fit ' + c.fit + ' raga ' + c.raga + ' oct ' + c.octave + ' whole ' + c.whole + ' agree ' + c.agree + ' lines ' + c.lines + ')').join('  ') : '(new)'); });
  console.log(comps.length, 'lessons from the books or compared with them;', comps.filter(c => c.meaning).length, 'with a meaning');
}
