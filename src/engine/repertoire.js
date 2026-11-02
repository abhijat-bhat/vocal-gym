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

export const REPERTOIRE_NOTE = 'Notations from carnaticnotations.blogspot.com (Balaji J.), free to download and use; each composition links to its page there.';
