/* Vocal Gym engine · repertoire: compositions from notation, ready to read and to sing (v0.9)
   The compositions come from carnaticnotations.blogspot.com, imported by scripts/import-repertoire.js into
   data/repertoire/ (one JSON file per composition). This module reads them; it has no knowledge of the site's
   HTML.

   A composition's swara lines are written in a compact text form, one string per table cell:
     swara    a letter S R G M P D N, an optional variant digit (R1, G3 …), then ' for each octave up or . for
              each octave down:  S'  N.  M2  D1.
     ,        a karvai: one unit of time held (or silent at the start of a line)
     [ … ]    a group sung at double speed: every symbol inside takes half a unit; [[ … ]] is four times
   Tokens are separated by spaces; brackets need none. One unit is one written swara at the line's own speed
   (the site writes a cycle of Adi, for instance, as 16, 32 or 64 units).

   The raga of a section is its scale as the site prints it (arohana and avarohana with variant digits). A
   swara written without a digit takes the variant its raga uses in that direction: ascending notes take the
   arohana's, descending notes the avarohana's (Bhairavi's D2 going up and D1 coming down), so the notation
   needs no digits. A letter the scale does not have (an anya swara, or a slip in the notation) takes its
   common variant, and is counted in the line's stats.

     parseCell(text)           → [{ s, v, o, d }]  letter (or ',' for a karvai), variant digit or 0, octave, units
     cellUnits(text)           → units in one cell
     ragaOf({ name, aro, avaro })  → a raga object the gamaka renderer and the voice accept
     talaOf(name)              → { fam, L, tala, nadai, name } from the site's tala names, or null
     linePitches(raga, cells)  → [{ p, d }] the line's notes with pitches resolved (null p for a leading rest)
     playPlan(comp, lines, opts)  → notes on a fine grid with the tala, for the player
   Everything is deterministic and browser-safe. */
import { SEMI, allRagas, defineRaga } from './ragas.js';
import { tala as makeTala, customTala } from './talas.js';

const LETTERS = 'SRGMPDN';
const COMMON = { S: 'S', R: 'R2', G: 'G3', M: 'M1', P: 'P', D: 'D2', N: 'N3' };

/* ---------- the compact swara text ---------- */
export function parseCell(text) {
  const out = [];
  let speed = 1, k = 0;
  const s = String(text || '');
  while (k < s.length) {
    const c = s[k];
    if (c === '[') { speed *= 2; k++; continue; }
    if (c === ']') { speed = Math.max(1, speed / 2); k++; continue; }
    if (c === ',') { out.push({ s: ',', v: 0, o: 0, d: 1 / speed }); k++; continue; }
    const L = c.toUpperCase();
    if (LETTERS.includes(L) && c !== ' ') {
      let v = 0, o = 0;
      k++;
      if (/[1-3]/.test(s[k] || '')) { v = +s[k]; k++; }
      while (s[k] === "'") { o++; k++; }
      while (s[k] === '.') { o--; k++; }
      out.push({ s: L, v, o, d: 1 / speed });
      continue;
    }
    k++;   // spaces, and anything the importer let through
  }
  return out;
}
export const cellUnits = text => parseCell(text).reduce((a, t) => a + t.d, 0);
export const lineUnits = cells => (cells || []).reduce((a, c) => a + cellUnits(c), 0);

/* ---------- sustains as a singer writes them (v0.9.2) ----------
   The stored text has one comma a unit. On the page, , holds for one unit and ; for two: P , , , is written P, ; .
   In a stretch of karvais an odd one comes first, and the first mark stands against its swara. */
const sustainMarks = n => (n % 2 ? [','] : []).concat(Array.from({ length: Math.floor(n / 2) }, () => ';'));
/* a cell's compact text with its sustains so: "P , , , [S , , R]" → "P, ; [S; R]". cleanCell reads it back. */
export function sustainText(cell) {
  const toks = String(cell || '').match(/\[|\]|,|[^\s[\],]+/g) || [];
  let out = '', i = 0;
  const put = (t, tight) => { out += !out || out.endsWith('[') || tight || t === ']' ? t : ' ' + t; };
  while (i < toks.length) {
    if (toks[i] !== ',') { put(toks[i]); i++; continue; }
    let n = 0;
    while (toks[i + n] === ',') n++;
    const before = toks[i - 1];
    sustainMarks(n).forEach((m, k) => put(m, k === 0 && before && before !== '[' && before !== ']'));
    i += n;
  }
  return out;
}
/* the columns of a cell on the grid: toks from parseCell, start its unit, breakAt(unit) true where a new column must
   begin (a beat line, or a syllable). → [{ from, units, fast, parts: [{ toks: [indices], text? }] }]. A part is what
   lights as one: a swara (text is left to the page, which draws it), or a sustain mark, whose toks are the commas it
   stands for. A ; never crosses a break, so it never hides a beat line or a syllable. */
export function sustainLayout(toks, start, breakAt) {
  const cols = [], cut = breakAt || (() => false);
  let k = 0, u = start || 0;
  while (k < toks.length) {
    const t = toks[k];
    if (t.d < 1 - 1e-9) {
      // a group sharing its unit: its karvais pair up inside it
      const group = [];
      let d = 0;
      do { group.push(k); d += toks[k].d; k++; } while (k < toks.length && d < 1 - 1e-9);
      const parts = [];
      for (let g = 0; g < group.length;) {
        if (toks[group[g]].s !== ',') { parts.push({ toks: [group[g]] }); g++; continue; }
        let n = 0;
        while (g + n < group.length && toks[group[g + n]].s === ',') n++;
        let at = g;
        sustainMarks(n).forEach(m => { const w = m === ';' ? 2 : 1; parts.push({ toks: group.slice(at, at + w), text: m }); at += w; });
        g += n;
      }
      cols.push({ from: u, units: d, fast: group.length, parts });
      u += d;
      continue;
    }
    if (t.s !== ',') { cols.push({ from: u, units: t.d, fast: 1, parts: [{ toks: [k] }] }); u += t.d; k++; continue; }
    // a stretch of karvais, cut at each break
    let first = true;
    while (k < toks.length && toks[k].s === ',' && toks[k].d >= 1 - 1e-9) {
      let n = 1;
      while (k + n < toks.length && toks[k + n].s === ',' && toks[k + n].d >= 1 - 1e-9 && !cut(u + n * toks[k].d)) n++;
      const last = cols[cols.length - 1];
      let attach = first && !cut(u) && last && last.fast === 1 && last.parts.length === 1 && toks[last.parts[0].toks[0]].s !== ',';
      sustainMarks(n).forEach(m => {
        const w = m === ';' ? 2 : 1, part = { toks: Array.from({ length: w }, (_, x) => k + x), text: m }, units = w * toks[k].d;
        if (attach) { last.parts.push(part); last.units += units; attach = false; }
        else cols.push({ from: u, units, fast: 1, parts: [part] });
        u += units; k += w;
      });
      first = false;
    }
  }
  return cols;
}

/* ---------- ragas from the printed scale ---------- */
const tokenPitch = t => {   // "R2", "S'", "N3." → semitones from Sa
  const m = /^([SRGMPDN])([1-3]?)('*)(\.*)$/.exec(t);
  if (!m) return null;
  const lab = m[1] === 'S' || m[1] === 'P' ? m[1] : m[1] + (m[2] || COMMON[m[1]].slice(1));
  return SEMI[lab] + 12 * (m[3].length - m[4].length);
};
const labelOf = t => { const m = /^([SRGMPDN])([1-3]?)/.exec(t); return m ? (m[1] === 'S' || m[1] === 'P' ? m[1] : m[1] + (m[2] || COMMON[m[1]].slice(1))) : null; };
let KNOWN = null;
const sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
/* scale { name, aro: ['S','R2',…,"S'"], avaro } → a raga. When the pitches are exactly an engine raga's
   (Kalyani's are Mechakalyani's), its id is used, so the raga's sourced gamaka rules apply. */
export function ragaOf(scale) {
  const aroT = (scale && scale.aro) || [], avT = (scale && scale.avaro) || [];
  const aro = aroT.map(tokenPitch).filter(p => p != null), avaro = avT.map(tokenPitch).filter(p => p != null);
  if (!aro.length || !avaro.length) return null;
  if (!KNOWN) { const R = allRagas(); KNOWN = R.melakartas.concat(R.janyas); }
  const twin = KNOWN.find(r => sameList(r.aro, aro) && sameList(r.avaro, avaro));
  const labels = { 0: 'S' };
  aroT.concat(avT).forEach(t => { const l = labelOf(t); if (l && l !== 'S') labels[SEMI[l]] = l; });
  // by letter, the variant used going up and coming down
  const up = {}, down = {};
  aroT.forEach(t => { const l = labelOf(t); if (l && !up[l[0]]) up[l[0]] = l; });
  avT.forEach(t => { const l = labelOf(t); if (l && !down[l[0]]) down[l[0]] = l; });
  const base = twin ? Object.assign({}, twin) : defineRaga('rep-' + slug(scale.name || 'raga'), scale.name || 'Raga', ['S'], ['S'], { kind: 'repertoire' });
  return Object.assign(base, { name: scale.name || base.name, aro, avaro, labels, up, down, twin: twin ? twin.id : null });
}
const slug = s => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'x';

/* ---------- talas by the site's names ---------- */
const norm = s => String(s || '').toLowerCase().replace(/[^a-z]/g, '').replace(/h/g, '').replace(/aa/g, 'a').replace(/ee/g, 'i').replace(/oo/g, 'u').replace(/(.)\1/g, '$1');
const JATI_WORD = [['tis', 3], ['tris', 3], ['catu', 4], ['kand', 5], ['mis', 7], ['sank', 9]];
const FAM_WORD = [['triputa', 'triputa'], ['tripuda', 'triputa'], ['rupakam', 'rupaka'], ['rupaka', 'rupaka'], ['jampe', 'jhampa'], ['jampa', 'jhampa'], ['jumpa', 'jhampa'], ['ata', 'ata'], ['matya', 'matya'], ['mata', 'matya'], ['druva', 'dhruva'], ['eka', 'eka'], ['capu', 'chapu']];
const DEFAULT_JATI = { dhruva: 4, matya: 4, rupaka: 4, jhampa: 7, triputa: 3, ata: 5, eka: 4, chapu: 7 };
/* "Adi", "roopakam", "mishra chApu", "khanda jampE", "Adi (tisra)", "tisra triputa" … → a tala, or null */
export function talaOf(name) {
  const n = norm(name);
  if (!n) return null;
  let nadai = 4;
  const tisraNadai = /\(.*(tisra|tisr|tris|tisa)/i.test(String(name)) || /tisranadai/.test(n);
  if (tisraNadai) nadai = 3;
  if (/kandanadai/.test(n)) nadai = 5;
  const jatiOf = s => { for (const [w, L] of JATI_WORD) if (s.includes(w)) return L; return null; };
  if (/^(adi|desadi|madyadi)(tala|tal|tisra|tisr|tris|catusra|catusr|kanda|misra|nadai|kalam|kalai|[12])*$/.test(n)) {
    const t = makeTala('triputa', 4);
    return { fam: 'triputa', L: 4, tala: t, nadai, name: 'Adi' + (nadai === 3 ? ' (tisra nadai)' : '') };
  }
  for (const [w, fam] of FAM_WORD) {
    if (!n.includes(w)) continue;
    // "ata" and "eka" appear inside other words; take them only as a whole or after a jati word
    if ((w === 'ata' || w === 'eka' || w === 'mata') && !(n === w || n.endsWith(w) && jatiOf(n.slice(0, -w.length)) || n.startsWith(w + 'tal'))) continue;
    const jati = jatiOf(n.split(w)[0]);
    if (fam === 'chapu') {
      const L = jati || 7;
      if (L === 9) return { fam: 'chapu', L: 9, tala: Object.assign(customTala([4, 5]), { name: 'Sankeerna Chapu' }), nadai, name: 'Sankeerna Chapu' };
      if (![3, 5, 7].includes(L)) return null;
      const t = makeTala('chapu', L);
      return { fam: 'chapu', L, tala: t, nadai, name: t.name };
    }
    const L = jati || DEFAULT_JATI[fam];
    const t = makeTala(fam, L);
    const plain = { rupaka: 'Roopakam', jhampa: 'Jhampa', triputa: 'Triputa', ata: 'Ata', matya: 'Matya', dhruva: 'Dhruva', eka: 'Eka' }[fam];
    return { fam, L, tala: t, nadai, name: (jati ? t.name.replace(' jati ', ' ') : plain + (fam === 'rupaka' && L === 4 ? '' : ' (' + t.name.replace(' jati ', ' ') + ')')) + (nadai === 3 ? ' (tisra nadai)' : '') };
  }
  return null;
}

/* ---------- pitches ---------- */
/* the pitch of one written swara, given its neighbours' letters for the direction */
function pitchOf(raga, tok, dir, stats) {
  const L = tok.s;
  let lab;
  if (L === 'S' || L === 'P') lab = L;
  else if (tok.v) lab = L + tok.v;
  else {
    const u = raga.up && raga.up[L], d = raga.down && raga.down[L];
    lab = dir < 0 ? (d || u) : dir > 0 ? (u || d) : (u || d);
    if (!lab) { lab = COMMON[L]; if (stats) stats.outside++; }
  }
  return SEMI[lab] + 12 * tok.o;
}
const ORDER = { S: 0, R: 1, G: 2, M: 3, P: 4, D: 5, N: 6 };
const rank = t => ORDER[t.s] + 7 * t.o;
/* every written token of a line with its pitch (null for a karvai) and units: [{ s, p, d, cell, tok }] */
export function lineTokens(raga, cells, stats) {
  const toks = [];
  (cells || []).forEach((c, ci) => parseCell(c).forEach((t, ti) => toks.push(Object.assign({ cell: ci, tok: ti }, t))));
  const sw = toks.map((t, i) => t.s === ',' ? null : i).filter(i => i !== null);
  return toks.map((t, i) => {
    if (t.s === ',') return Object.assign(t, { p: null });
    const j = sw.indexOf(i), prev = j > 0 ? toks[sw[j - 1]] : null, next = j + 1 < sw.length ? toks[sw[j + 1]] : null;
    // direction: toward the next swara; for the last, from the one before
    const dir = next && rank(next) !== rank(t) ? Math.sign(rank(next) - rank(t)) : prev ? Math.sign(rank(t) - rank(prev)) : 1;
    return Object.assign(t, { p: pitchOf(raga, t, dir, stats) });
  });
}
/* a line's notes: karvais lengthen the swara before them; karvais at the very start are a rest (p null).
   d is in units. stats (optional) counts letters outside the scale. */
export function linePitches(raga, cells, stats) {
  const out = [];
  lineTokens(raga, cells, stats).forEach(t => {
    if (t.p === null) { if (out.length) out[out.length - 1].d += t.d; else out.push({ p: null, d: t.d }); }
    else out.push({ p: t.p, d: t.d });
  });
  return out;
}

/* ---------- the play plan ----------
   lines: [{ cells, at?, tail?, join? }] in order, each with its raga (line.raga, or opts.raga). Placing them:
   the first line starts where it is written (at: a lead-in starts that many units into the cycle and ends on
   sam); after it, a line starts at the next cycle boundary, a lead-in so that it ends on one, and a joined line
   (the second row of a split line) straight after the line before. A tail (the last cell of a line, filling
   the next line's opening rests) sounds at the start of the next line, over its rests, when the next line opens
   with that much rest; otherwise straight after its own line.
   Everything sits on a grid of sub cells per unit (2 if any group is at double speed, 4 at four times), so every
   duration is a whole number of cells. Returns
     { notes: [{ p, slots }], sub, per (grid cells per beat), unitsPerBeat, cycle (beats), angaStarts,
       tokens: [{ line, cell, tok, from, to }] (each written token's grid cells, from the first note),
       offset (grid cells from the sam before the first note to the first note) } */
export function playPlan(lines, opts) {
  const o = opts || {}, tl = o.tala, upb = o.unitsPerBeat || 1;
  const cyc = tl ? tl.total * upb : null;
  const up = x => cyc ? Math.ceil((x - 1e-9) / cyc) * cyc : x;
  let sub = 1;
  lines.forEach(l => (l.cells || []).forEach(c => parseCell(c).forEach(t => { while (Math.abs(t.d * sub - Math.round(t.d * sub)) > 1e-9 && sub < 8) sub *= 2; })));
  const placed = [];   // { at (units from the first line's sam), d, p, line, cell, tok }
  let pos = null, tail = null;
  const put = (toks, a) => { toks.forEach(t => { placed.push(Object.assign({}, t, { at: a })); a += t.d; }); return a; };
  lines.forEach((l, li) => {
    let off = 0;
    const toks = lineTokens(l.raga || o.raga, l.cells).map(t => { const x = Object.assign({ line: li, off }, t); off += t.d; return x; });
    if (!toks.length) return;
    let lead = 0; for (const t of toks) { if (t.p !== null) break; lead += t.d; }
    // a waiting tail without room in this line's opening rests sounds straight after its own line
    if (tail && lead + 1e-9 < tail.d) { pos = put(tail.toks, pos); tail = null; }
    let start;
    if (pos === null) start = l.at || 0;
    else if (l.join || !cyc) start = pos;
    else if (l.at) { start = up(pos) + l.at; if (start - cyc >= pos - 1e-9) start -= cyc; }
    else start = up(pos);
    let drop = 0;
    if (tail) { put(tail.toks, start); drop = tail.d; tail = null; }   // over this line's opening rests
    const cut = l.tail && l.tail < off ? off - l.tail : off, rest = [];
    toks.forEach(t => {
      if (t.off + 1e-9 >= cut) rest.push(t);
      else if (!(t.p === null && t.off < drop - 1e-9)) placed.push(Object.assign({}, t, { at: start + t.off }));
    });
    if (rest.length) tail = { toks: rest, d: l.tail };   // this line's tail waits for the next line
    pos = start + cut;
  });
  if (tail) put(tail.toks, pos);
  placed.sort((x, y) => x.at - y.at);
  // notes: a swara lasts until its karvais end; silence between is a rest
  const first = placed.length ? placed[0].at : 0, notes = [], tokens = [];
  let cur = null, end = first;
  const cell = x => Math.round((x - first) * sub);
  placed.forEach(t => {
    tokens.push({ line: t.line, cell: t.cell, tok: t.tok, from: cell(t.at), to: cell(t.at + t.d) });
    if (t.p === null) { if (cur && Math.abs(cur.to - t.at) < 1e-9) { cur.to += t.d; end = cur.to; } return; }
    if (t.at > end + 1e-9) notes.push({ p: null, from: end, to: t.at });
    cur = { p: t.p, from: t.at, to: t.at + t.d }; notes.push(cur); end = cur.to;
  });
  const angaStarts = new Set();
  if (tl) { let k = 0; tl.angas.forEach(g => { angaStarts.add(k); k += g.len; }); }
  return {
    notes: notes.map(n => ({ p: n.p, slots: Math.max(1, cell(n.to) - cell(n.from)) })),
    sub, per: upb * sub, unitsPerBeat: upb, cycle: tl ? tl.total : null, angaStarts, tokens,
    offset: cyc ? Math.round((((first % cyc) + cyc) % cyc) * sub) : 0
  };
}

/* Does a row of table cells (their units) fill whole cycles of the tala at upb units per beat, with every cell
   ending on an anga line? A cell may cover several angas or cycles, never part of one. */
export function rowFits(tl, upb, cellsUnits) {
  const lens = tl.angas.map(a => a.len);
  let a = 0, acc = 0;
  for (const w of cellsUnits) {
    if (!(w > 0)) return false;
    let need = w;
    while (need > 1e-9) { const g = lens[a % lens.length] * upb - acc; if (need + 1e-9 >= g) { need -= g; acc = 0; a++; } else { acc += need; need = 0; } }
    if (acc > 1e-9) return false;
  }
  return a % lens.length === 0;
}
/* How far a line is from filling whole cycles: null if it fills them (or there is no tala), else
   { units, cycle, over, short, cell }. One of over and short is set, whichever is nearer (a line under one cycle
   is always short). cell: the index of the first cell that ends off an anga line, the likely place of a slip, or
   null if every cell ends on one. A line of 12+13+12+12 in cycles of 12 is 1 over, at cell 1. */
export function cycleGap(cells, tl, upb) {
  if (!tl) return null;
  const us = (cells || []).map(cellUnits), units = us.reduce((a, b) => a + b, 0), cycle = tl.total * upb;
  const m = ((units % cycle) + cycle) % cycle;
  if (!units || Math.min(m, cycle - m) < 1e-9) return null;
  const lens = tl.angas.map(g => g.len);
  let a = 0, acc = 0, cell = null;
  us.forEach((w, i) => {
    let need = w;
    while (need > 1e-9) { const g = lens[a % lens.length] * upb - acc; if (need + 1e-9 >= g) { need -= g; acc = 0; a++; } else { acc += need; need = 0; } }
    if (cell === null && acc > 1e-9) cell = i;
  });
  const over = units >= cycle && m <= cycle / 2;
  return { units, cycle, over: over ? m : 0, short: over ? 0 : cycle - m, cell };
}
/* the same for line i of a section, null for the lines that are short or long on purpose: a link, a lead-in, a
   line with an overlap cell, and both rows of a line split in two */
export function offCycle(lines, i, tl, upb) {
  const l = lines[i], next = lines[i + 1];
  if (!l || l.link || l.at || l.tail || l.join || (next && next.join)) return null;
  return cycleGap(l.cells, tl, upb);
}
export const UNITS_PER_BEAT = [1, 2, 3, 4, 6, 8, 12, 16];
/* units per beat for a set of rows: the largest that makes the most rows fit (rowFits); the count with it */
export function unitsPerBeat(tl, rows) {
  if (!tl) return 1;
  return bestUnits(tl, rows).upb;
}
export function bestUnits(tl, rows) {
  let upb = 1, n = -1;
  UNITS_PER_BEAT.forEach(u => {
    const k = rows.filter(r => rowFits(tl, u, r)).length;
    if (k > n || (k === n && k > 0)) { upb = u; n = k; }
  });
  return { upb, n: Math.max(0, n) };
}

/* ---------- a singer's corrections (v0.9.1) ----------
   A singer can correct the notation for their own account. The imported files never change: the corrections are
   a log of changes (server/edits.js), and applyEdits lays them over a composition when it is read, so they
   outlast a re-import. A line is named by a key: b:<section>:<line> for a line of the import, n:<id> for one
   the singer added. */
const MARK_LOW = /[‘`“]/, MARK_UP = /[’'”]/;
const VARIANTS = { S: 0, R: 3, G: 3, M: 2, P: 0, D: 3, N: 3 }, MOST_MARKS = 4;
/* a cell as typed, in the compact text or the site's own marks (S’ ‘N ; and lower case) →
   { text: the compact text, units, errors: [what is wrong, in words] } */
export function cleanCell(typed) {
  const s = String(typed == null ? '' : typed), errors = [];
  let text = '', depth = 0, units = 0, k = 0, low = 0;
  const sep = () => (text && !text.endsWith('[') ? ' ' : '');
  const put = t => { text += sep() + t; };
  while (k < s.length) {
    const c = s[k];
    if (/\s/.test(c)) { k++; continue; }
    if (c === '[') { if (++depth > 2) errors.push('Groups go no deeper than [[ ]] (four times the speed).'); text += sep() + '['; k++; continue; }
    if (c === ']') {
      if (!depth) errors.push('A ] with no [ before it.');
      else { if (text.endsWith('[')) errors.push('An empty [ ] group.'); depth--; text += ']'; }
      k++; continue;
    }
    if (c === ',' || c === ';') {
      if (low) { errors.push('A lower-octave mark needs a swara after it, not a karvai.'); low = 0; }
      for (let n = c === ';' ? 2 : 1; n > 0; n--) { put(','); units += 1 / 2 ** Math.min(depth, 2); }
      k++; continue;
    }
    if (MARK_LOW.test(c)) { low++; k++; continue; }
    const L = c.toUpperCase();
    if (LETTERS.includes(L)) {
      let v = '', up = 0, down = low;
      k++;
      if (/\d/.test(s[k] || '')) {
        const d = +s[k++];
        if (d >= 1 && d <= VARIANTS[L]) v = String(d);
        else errors.push(VARIANTS[L] ? L + ' has the variants ' + Array.from({ length: VARIANTS[L] }, (_, n) => L + (n + 1)).join(', ') + ', so ' + L + d + ' is not a swara.' : L + ' has no variants, so write ' + L + ', not ' + L + d + '.');
      }
      while (MARK_UP.test(s[k] || '')) { up++; k++; }
      while (s[k] === '.') { down++; k++; }
      if (/\d/.test(s[k] || '') && (up || down)) { errors.push('The variant goes before the octave mark: ' + L + s[k] + (up ? "'" : '.') + ', not ' + L + (up ? "'" : '.') + s[k] + '.'); k++; }
      if (up && down) errors.push(L + ' cannot be in both the upper and the lower octave.');
      if (up > MOST_MARKS || down > MOST_MARKS) errors.push('An octave mark goes ' + MOST_MARKS + ' octaves at most, which is past any instrument: ' + L + "'".repeat(MOST_MARKS) + ' or ' + L + '.'.repeat(MOST_MARKS) + '.');
      put(L + v + "'".repeat(up) + '.'.repeat(up ? 0 : down));
      units += 1 / 2 ** Math.min(depth, 2);
      low = 0;
      continue;
    }
    if (c === '.') errors.push('A lower-octave mark goes after its swara: N. not .N');
    else if (MARK_UP.test(c)) errors.push("An upper-octave mark goes after its swara: S' not 'S");
    else errors.push('“' + c + '” is not part of the notation.');
    k++;
  }
  if (low) errors.push('A lower-octave mark needs a swara after it.');
  if (depth) errors.push('A [ with no ] after it.');
  return { text, units, errors: Array.from(new Set(errors)) };
}
export const lineText = cells => (cells || []).join(' | ');
/* a line as sent or typed → { line: { cells, syl, label }, units, errors }; empty cells are dropped.
   opts.scale (the section's scale) restricts its swaras to those of the raga; opts.keep (the line's cells as they stand)
   lets a swara the line already has stay, so a singer can correct the rest of it. */
export function cleanLine(raw, opts) {
  const r = raw && typeof raw === 'object' ? raw : {}, errors = [];
  if (!Array.isArray(r.cells)) return { line: null, units: 0, errors: ['A line needs its swaras.'] };
  if (r.cells.length > 32) errors.push('A line has at most 32 cells.');
  const cells = [];
  let units = 0;
  r.cells.forEach((typed, i) => {
    if (typed != null && typeof typed !== 'string') { errors.push('Cell ' + (i + 1) + ' must be text.'); return; }
    if (String(typed || '').length > 800) { errors.push('Cell ' + (i + 1) + ' is too long.'); return; }
    const c = cleanCell(typed);
    c.errors.forEach(e => errors.push('Cell ' + (i + 1) + ': ' + e));
    if (opts && opts.scale && c.text && !c.errors.length) {
      const out = notesOutside([c.text], opts.scale, opts.keep);
      if (out.length) errors.push('Cell ' + (i + 1) + ': ' + out.join(', ') + (out.length > 1 ? ' are' : ' is') + ' not in ' + (opts.scale.name || 'this raga') + ', which has ' + allowedNotes(opts.scale).join(' ') + '.');
    }
    if (c.text) { cells.push(c.text); units += c.units; }
  });
  if (!cells.length && !errors.length) errors.push('A line needs at least one swara or karvai.');
  const label = typeof r.label === 'string' ? r.label.trim() : '';
  if (label.length > 80) errors.push('The label is too long.');
  const syl = [];
  if (r.syl != null && !Array.isArray(r.syl)) errors.push('The sahitya is not valid.');
  (Array.isArray(r.syl) ? r.syl : []).slice(0, 2000).forEach(x => {
    const u = Array.isArray(x) ? x[0] : null, t = Array.isArray(x) && typeof x[1] === 'string' ? x[1].trim() : '';
    if (!t) return;
    if (!(typeof u === 'number' && u >= 0 && u <= units + 1e-9)) errors.push('The syllable “' + t.slice(0, 20) + '” falls outside the line.');
    else if (t.length > 60) errors.push('The syllable “' + t.slice(0, 20) + '…” is too long.');
    else syl.push([u, t]);
  });
  return { line: { cells, syl: syl.map((x, i) => [x, i]).sort((a, b) => a[0][0] - b[0][0] || a[1] - b[1]).map(x => x[0]), label }, units, errors: Array.from(new Set(errors)) };
}
export const sameLine = (a, b) => !!a && !!b && lineText(a.cells) === lineText(b.cells) && JSON.stringify(a.syl || []) === JSON.stringify(b.syl || []) && (a.label || '') === (b.label || '');
const unitsOfLine = l => (l.cells || []).reduce((n, c) => n + cellUnits(c), 0);

/* comp, edits (the log of one singer for this composition, oldest first: { id, key, section, anchor, base, after })
   → { comp: a copy with the edits applied, lost: [the latest entry of each edit whose line is gone] }.
   Each line gets its key; a changed or added line gets edited: <the log id>. A line of the import is looked for
   where it was, then by its text anywhere in the piece (a re-import can move it); an edit whose line has gone
   is reported, not guessed at. An edited line keeps its place in the time of the piece while its length stays
   the same; otherwise it is laid out as a line of its own. */
export function applyEdits(comp, edits) {
  const last = new Map();
  (edits || []).forEach(e => { last.set(e.key, e); });
  const secs = comp.sections.map((s, si) => Object.assign({}, s, { lines: s.lines.map((l, li) => Object.assign({ key: 'b:' + si + ':' + li }, l)) }));
  const tl = comp.tala ? talaOf(comp.tala.name) : null;
  const cycleOf = s => tl ? tl.tala.total * (s.unitsPerBeat || comp.tala.unitsPerBeat || 1) : 0;
  const lost = [], at = new Map();   // a line of the import → the entry that changes it
  const baseEntries = Array.from(last.values()).filter(e => e.key.startsWith('b:'));
  const placeOf = key => { const m = /^b:(\d+):(\d+)$/.exec(key); return m ? (secs[+m[1]] || { lines: [] }).lines[+m[2]] : null; };
  // where each edit was made, if that line still reads the same; then the nearest line with its text
  const later = baseEntries.filter(e => {
    const l = placeOf(e.key);
    if (l && lineText(l.cells) === e.base) { at.set(l, e); return false; }
    return true;
  });
  const near = (text, si, li, free) => {
    let best = null, gap = Infinity;
    secs.forEach((s, i) => s.lines.forEach((l, j) => {
      if (lineText(l.cells) !== text || !free(l)) return;
      const d = Math.abs(i - si) * 1000 + Math.abs(j - li);
      if (d < gap) { gap = d; best = l; }
    }));
    return best;
  };
  later.forEach(e => {
    const m = /^b:(\d+):(\d+)$/.exec(e.key), l = near(e.base, +m[1], +m[2], x => !at.has(x));
    if (l) at.set(l, e); else lost.push(e);
  });
  // added lines, under the line they follow ('s': the start of their section)
  const under = new Map();
  const put = (anchor, e) => { if (!under.has(anchor)) under.set(anchor, []); under.get(anchor).push(e); };
  Array.from(last.values()).filter(e => e.key.startsWith('n:')).forEach(e => {
    if (!secs[e.section]) { if (e.after) lost.push(e); return; }
    let anchor = e.anchor === 's' ? 's:' + e.section : e.anchor;
    if (anchor.startsWith('b:')) {
      const l = placeOf(anchor), m = /^b:(\d+):(\d+)$/.exec(anchor);
      if (!(l && lineText(l.cells) === e.base)) { const x = e.base ? near(e.base, +m[1], +m[2], () => true) : null; anchor = x ? x.key : 'end:' + e.section; }
    }
    put(anchor, e);
  });
  const retime = (line, base, s) => {
    const out = Object.assign({}, base || {}, line), cyc = cycleOf(s), u = unitsOfLine(out);
    delete out.fixed;
    if (base && Math.abs(unitsOfLine(base) - u) < 1e-9) return out;
    ['at', 'join', 'tail', 'link'].forEach(k => { delete out[k]; });
    if (cyc && u < cyc && Math.abs(u / cyc - Math.round(u / cyc)) > 1e-9) out.link = true;
    return out;
  };
  const content = a => ({ cells: a.cells, syl: a.syl && a.syl.length ? a.syl : undefined, label: a.label || undefined });
  const sections = secs.map((s, si) => {
    const out = [], seen = new Set();
    const walk = anchor => {
      if (seen.has(anchor)) return;
      seen.add(anchor);
      (under.get(anchor) || []).forEach(e => { if (e.after) out.push(Object.assign(retime(content(e.after), null, s), { key: e.key, edited: e.id })); walk(e.key); });
    };
    walk('s:' + si);
    s.lines.forEach(l => {
      const e = at.get(l);
      if (!e) out.push(l);
      else if (e.after) {
        const same = sameLine(e.after, l);
        out.push(same ? Object.assign({}, l, { key: e.key }) : Object.assign(retime(content(e.after), l, s), { key: e.key, edited: e.id }));
      }
      walk(l.key); if (e) walk(e.key);
    });
    walk('end:' + si);
    return Object.assign({}, s, { lines: out });
  });
  return { comp: Object.assign({}, comp, { sections }), lost };
}

/* ---------- octave checks (v0.9.5) ----------
   A mark left off a swara is the slip the tala cannot show: the line still fills its cycles. Two checks look for it, and
   neither changes anything: the page tags the line and offers the fix, and the singer decides, because a real leap would
   be damaged by correcting it unasked.
     spike  one swara far from both its neighbours, which an octave's move would bring close to both: R' S S' (S').
            S S' S is left alone: a swara and its own octave is a phrase, not a slip
     piece  the same swaras elsewhere in this composition, usually with another octave shape: a run with a mark left off,
            which a spike cannot show since its notes move together
   A fix stays inside the range the piece already uses, and one from the piece must not make the line leap further. */
const PLACE = { S: 0, R: 1, G: 2, M: 3, P: 4, D: 5, N: 6 };
const OCT = 7, SPIKE_LEAP = 5, SPIKE_NEAR = 2, RUN = 6, MOST_MOVED = 3;
const octaveMarks = o => (o > 0 ? "'".repeat(o) : '.'.repeat(-o));
const noteText = (n, o) => n.s + (n.v || '') + octaveMarks(o);
/* a cell with its token tok (an index into parseCell's tokens, karvais included) at octave o */
export function withOctave(cell, tok, o) {
  const s = String(cell || '');
  let k = 0, n = 0;
  while (k < s.length) {
    const c = s[k];
    if (c === ',') { n++; k++; continue; }
    if (LETTERS.includes(c.toUpperCase())) {
      k++;
      if (/[1-3]/.test(s[k] || '')) k++;
      const from = k;
      while (s[k] === "'" || s[k] === '.') k++;
      if (n === tok) return s.slice(0, from) + octaveMarks(o) + s.slice(k);
      n++;
      continue;
    }
    k++;
  }
  return s;
}
const notesOf = l => (l.cells || []).flatMap((cell, ci) => parseCell(cell).map((t, tok) => ({ cell: ci, tok, s: t.s, v: t.v, o: t.o, p: PLACE[t.s] + OCT * t.o })).filter(n => n.s !== ','));
const pathAround = (q, from, to, at) => { let n = 0; for (let i = Math.max(1, from); i <= Math.min(q.length - 1, to + 1); i++) n += Math.abs(at(i) - at(i - 1)); return n; };
/* sections → the same shape by line: for sections[i].lines[j], the suggestions
   [{ changes: [{ cell, tok, was, now }], checks: ['spike', 'piece'], usually?: 'the reading elsewhere', times?: n, cells: the line's cells with this fix }] */
export function octaveChecks(sections) {
  const lines = sections.map(s => s.lines.map(notesOf));
  const out = sections.map(s => s.lines.map(() => []));
  let lo = Infinity, hi = -Infinity;
  lines.forEach(ls => ls.forEach(q => q.forEach(n => { if (n.p < lo) lo = n.p; if (n.p > hi) hi = n.p; })));
  const inRange = (n, o) => { const p = PLACE[n.s] + OCT * o; return p >= lo && p <= hi; };
  // the same swaras over a run of six, by octave shape
  const shapes = new Map();
  lines.forEach((ls, si) => ls.forEach((q, li) => {
    for (let i = 0; i + RUN <= q.length; i++) {
      const w = q.slice(i, i + RUN), letters = w.map(n => n.s).join(''), rel = w.map(n => n.o - w[0].o);
      if (!shapes.has(letters)) shapes.set(letters, new Map());
      const m = shapes.get(letters), k = rel.join();
      if (!m.has(k)) m.set(k, { rel, text: w.map(n => noteText(n, n.o)).join(' '), hits: [] });
      m.get(k).hits.push({ si, li, i });
    }
  }));
  const votes = new Map();   // "si:li" → note index → octave → { n, usually }
  shapes.forEach(m => {
    if (m.size < 2) return;
    const r = Array.from(m.values()).sort((a, b) => b.hits.length - a.hits.length), top = r[0];
    if (top.hits.length < 2 || r.slice(1).some(x => x.hits.length > top.hits.length / 2)) return;
    r.slice(1).forEach(x => x.hits.forEach(h => {
      const q = lines[h.si][h.li];
      // the least that makes this run read like the others
      let best = null;
      [0, 1, -1].forEach(sh => {
        const want = top.rel.map(d => q[h.i].o + sh + d), moved = want.reduce((n, o, k) => n + (o !== q[h.i + k].o ? 1 : 0), 0);
        if (!best || moved < best.moved) best = { want, moved };
      });
      if (!best.moved || best.moved > MOST_MOVED) return;
      const key = h.si + ':' + h.li;
      if (!votes.has(key)) votes.set(key, new Map());
      best.want.forEach((o, k) => {
        const n = q[h.i + k];
        if (o === n.o || !inRange(n, o)) return;
        const v = votes.get(key);
        if (!v.has(h.i + k)) v.set(h.i + k, new Map());
        const at = v.get(h.i + k), was = at.get(o) || { n: 0, usually: top.text, times: top.hits.length };
        was.n += top.hits.length; at.set(o, was);
      });
    }));
  });
  const suggest = (si, li, ids, target, checks, extra) => {
    const q = lines[si][li], cells = sections[si].lines[li].cells.slice();
    const changes = ids.map(i => { cells[q[i].cell] = withOctave(cells[q[i].cell], q[i].tok, target(i)); return { cell: q[i].cell, tok: q[i].tok, was: noteText(q[i], q[i].o), now: noteText(q[i], target(i)) }; });
    return Object.assign({ first: ids[0], ids, changes, checks, cells }, extra);
  };
  lines.forEach((ls, si) => ls.forEach((q, li) => {
    const found = [], v = votes.get(si + ':' + li);
    if (v) {
      const ids = Array.from(v.keys()).sort((a, b) => a - b), choice = new Map();
      ids.forEach(i => { let bestO = null, bestN = -1; v.get(i).forEach((x, o) => { if (x.n > bestN || (x.n === bestN && Math.abs(o - q[i].o) < Math.abs(bestO - q[i].o))) { bestO = o; bestN = x.n; } }); choice.set(i, bestO); });
      let g = [];
      const close = () => {
        if (!g.length) return;
        const f = g[0], t = g[g.length - 1], moved = i => PLACE[q[i].s] + OCT * choice.get(i);
        const whole = pathAround(q, f, t, i => (i >= f && i <= t && choice.has(i) ? moved(i) : q[i].p));
        if (whole <= pathAround(q, f, t, i => q[i].p)) {
          // the smallest fix: one swara, if moving it alone leaps no further than moving them all
          let one = null, least = whole;
          g.forEach(j => { const n = pathAround(q, f, t, i => (i === j ? moved(i) : q[i].p)); if (n <= least) { one = j; least = n; } });
          const ids = g.length > 1 && one != null ? [one] : g, x = v.get(ids[0]).get(choice.get(ids[0]));
          // more than that is a passage in another octave, or another phrase: no slip to fix in one click
          if (ids.length <= MOST_MOVED) found.push(suggest(si, li, ids, i => choice.get(i), ['piece'], { usually: x.usually, times: x.times }));
        }
        g = [];
      };
      ids.forEach(i => { if (g.length && i !== g[g.length - 1] + 1) close(); g.push(i); });
      close();
    }
    for (let i = 1; i + 1 < q.length; i++) {
      const a = q[i - 1].p, b = q[i].p, e = q[i + 1].p;
      if (Math.abs(a - b) < SPIKE_LEAP || Math.abs(b - e) < SPIKE_LEAP) continue;
      if (q[i - 1].s === q[i].s && q[i + 1].s === q[i].s) continue;   // S S' S: a swara and its octave, on purpose
      [1, -1].forEach(d => {
        const n = b + d * OCT, o = q[i].o + d;
        if (Math.abs(a - n) > SPIKE_NEAR || Math.abs(n - e) > SPIKE_NEAR || !inRange(q[i], o)) return;
        const same = found.find(x => x.ids.includes(i) && x.changes[x.ids.indexOf(i)].now === noteText(q[i], o));
        if (same) same.checks = ['spike', 'piece'];
        else found.push(suggest(si, li, [i], () => o, ['spike']));
      });
    }
    out[si][li] = found.sort((x, y) => x.first - y.first).map(({ first, ids, ...x }) => x);
  }));
  return out;
}
/* the swaras a singer may write in a raga, without octave marks: its printed scale { aro, avaro }, and also: the anya
   swaras it is written with (added at import, from the notation itself). A letter with no digit stands for any variant.
   [] when no scale is known, and then nothing is restricted. */
export function allowedNotes(scale) {
  const names = [].concat(scale && scale.aro || [], scale && scale.avaro || [], scale && scale.also || []).map(n => /^([SRGMPDN])(\d?)/.exec(n)).filter(Boolean).map(m => m[1] + m[2]);
  if (!names.length) return [];
  return Array.from(new Set(['S'].concat(names))).sort((a, b) => PLACE[a[0]] - PLACE[b[0]] || a.localeCompare(b));
}
/* the swaras of a line outside allowedNotes(scale): a swara no one writes in this raga, or a slip. keep: cells whose
   swaras may stay. → ['G', 'R1'] */
export function notesOutside(cells, scale, keep) {
  const names = allowedNotes(scale);
  if (!names.length) return [];
  const kept = new Set((keep || []).flatMap(c => parseCell(c).map(t => t.s + (t.v || ''))));
  const out = new Set();
  (cells || []).forEach(c => parseCell(c).forEach(t => {
    if (t.s === ',') return;
    const n = t.s + (t.v || ''), same = names.filter(x => x[0] === t.s);
    if (kept.has(n)) return;
    if (!same.length || (t.v && !same.some(x => x.length === 1 || +x[1] === t.v))) out.add(n);
  }));
  return Array.from(out);
}

export const REPERTOIRE_NOTE ='Notations from carnaticnotations.blogspot.com (Balaji J.), free to download and use; each composition links to its page there.';
