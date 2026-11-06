/* Vocal Gym · import the compositions of carnaticnotations.blogspot.com into data/repertoire/ (v0.9)
   The site (Balaji J., balajij@gmail.com) says: "The content on this site is free for anyone to download and
   use." Every composition keeps its page's address, and the app links to it.

   The posts are read from the blog's public feed (the Blogger JSON feed, 25 posts a request), parsed from their
   notation tables (scripts/repertoire-html.js) and written as
     data/repertoire/index.json      every composition's title, raga, tala, type, composer, language, deity,
                                     address and parse summary, for the list and its filters
     data/repertoire/c/<id>.json     one composition: its sections, lyrics and lines (below)
   A section is a heading row of the table ("pallavi - …", "chittaswaram", "charaNam - …") with its lyrics,
   its raga (the scale row above it; a ragamalika changes it) and its lines. A line is one row of swaras:
     { cells: ['S , R [M G] , , ,', …], label?, at?, syl?: [[unit, 'syllable'], …], fixed?: [{ cell, was, why }] }
   cells keep the table's cells (usually one per anga or one per cycle) in the compact text of
   src/engine/repertoire.js: an underlined group on the site (sung at double speed) becomes [ … ], ’ after a
   swara becomes ' and ‘ before it becomes . after it. fixed: the cells where a typing slip in the marks was
   corrected (swaraCell), with the text the site prints. at: a lead-in line (its first cells empty) starts that
   many units into the cycle and ends on sam. syl: the sahitya row under the line, each syllable at the unit it
   is written above (the site aligns them in a monospace font). Sangatis are the stacked lines of a block; each
   gets the block's sahitya.
   The run is deterministic for the same feed: posts in feed order, keys in a fixed order.

   Usage: node scripts/import-repertoire.js [--cache feed.json] [--save-feed feed.json] [--only <id>] [--report]
     --cache       read the posts from a saved feed (an array of Blogger entries) instead of the site
     --save-feed   also save the posts fetched, for a later --cache run
     --report      print each composition whose lines do not all fill whole cycles, and each slip corrected */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { blocks } from './repertoire-html.js';
import { parseCell, cellUnits, talaOf, bestUnits, rowFits, notesOutside, allowedNotes } from '../src/engine/repertoire.js';
import { melaLabels, MELA_NAMES, JANYA } from '../src/engine/ragas.js';
import { mergeLessons, SOURCES } from './lessons.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const OUT = join(ROOT, 'data', 'repertoire');
const FEED = 'https://carnaticnotations.blogspot.com/feeds/posts/default?alt=json&max-results=25&start-index=';
export const SITE = { name: 'Carnatic Music Notations', url: 'https://carnaticnotations.blogspot.com/', author: 'Balaji J.', terms: 'The content on this site is free for anyone to download and use.' };

/* ---------- reading the site's swara text ---------- */
const SW = 'SRGMPDN';
const LOWER = /[‘`“]/, UPPER = /[’'”]/;
const isSwara = ch => !!ch && SW.includes(ch.c.toUpperCase()) && /[a-z]/i.test(ch.c);
/* runs [{ text, u }] of one cell → { text: compact, units, bad: chars not understood, cols: [{ c0, c1, at }], slips, was }
   cols: each token's character columns in the cell (for lining up the sahitya) and its unit offset.
   The marks are read across the runs, so one on the far side of an underline's edge stays with its swara.
   slips: the typing slips corrected here; was: the cell as the site prints it. A line keeps both (fixed), so the
   page can say what changed:
     lower-run    ‘N’D: a swara cannot be both lower and upper, so the ’ stands for ‘ on the next swara
     lower-mark   ’N: the ’ has no swara before it, so it is ‘ on the swara after it
     upper-mark   R”: ” typed for ’ */
export function swaraCell(runs) {
  const toks = [], bad = [], slips = [];
  const ch = runs.flatMap(r => r.text.split('').map(c => ({ c, u: r.u })));
  let at = 0, lower = 0;
  for (let k = 0; k < ch.length; k++) {
    const c = ch[k].c, u = ch[k].u, d = u ? 0.5 : 1;
    if (LOWER.test(c)) { lower++; continue; }
    if (isSwara(ch[k])) {
      const start = k - lower;
      let v = '', j = k + 1, up = 0;
      if (ch[j] && /[1-3]/.test(ch[j].c)) { v = ch[j].c; j++; }
      while (ch[j] && UPPER.test(ch[j].c)) { if (ch[j].c === '”') slips.push('upper-mark'); up++; j++; }
      let next = 0;
      // a ‘ standing apart ("‘ S’") says nothing about this swara: its own ’ holds
      if (up && lower) {
        if (k && (LOWER.test(ch[k - 1].c) || UPPER.test(ch[k - 1].c))) { slips.push('lower-run'); up = 0; if (isSwara(ch[j])) next = 1; }
        else lower = 0;
      }
      toks.push({ t: c.toUpperCase() + v + "'".repeat(up) + '.'.repeat(lower), u, c0: start, c1: j - 1, at, d });
      at += d; lower = next; k = j - 1; continue;
    }
    if (c === ',' || c === ';') {
      const n = c === ';' ? 2 : 1;
      for (let i = 0; i < n; i++) { toks.push({ t: ',', u, c0: k, c1: k, at, d }); at += d; }
      lower = 0; continue;
    }
    if (UPPER.test(c)) { if (isSwara(ch[k + 1])) { slips.push('lower-mark'); lower = Math.max(lower, 1); } continue; }
    if (!/[\s|_()\-.:–—​]/.test(c)) bad.push(c);
  }
  let text = '', inU = false;
  toks.forEach((t, i) => {
    if (t.u && !inU) { text += (text ? ' ' : '') + '['; inU = true; }
    else if (!t.u && inU) { text += ']'; inU = false; }
    text += (text && !text.endsWith('[') ? ' ' : '') + t.t;
    if (i === toks.length - 1 && inU) text += ']';
  });
  return { text, units: at, bad, cols: toks.map(t => ({ c0: t.c0, c1: t.c1, at: t.at })), slips, was: runs.map(r => r.text).join('').replace(/\s+/g, ' ').trim() };
}
const VOWEL = /[aeiouAEIOU]/;
const SECTION_WORD = /pallav|anupal|charan|caran|chitt|cittas|swara|svara|sahith|sahit|mukt|ettugad|madhyama|madyama|kalam|similar|like|sangath|sangat|avartha|line|part|ragam|thanam|pada|muktayi|jathi|jati|thirmanam|teermanam|korvai|notes|varise|sthayi|ugabhoga|shlok|slok|verse|stanza|^\d+$|^[ivx]+$/i;
/* a cell is swara text when it has swaras or karvais and no vowels (sahitya always has vowels) */
const swaraish = s => /[SRGMPDN,]/.test(s) && !VOWEL.test(s) && !/[bcfhjklqtvwxyz]/i.test(s) && !/[^\s\x21-\x7e‘’“”–—​]/.test(s);
const isLabel = s => !s.trim() || /^[\s(]*(\d{1,2}|[ivx]{1,4})[\s.):]*$/i.test(s) || s.trim().length <= 3 && !/[SRGMPDN,]/.test(s);
const SCALE_TOK = /‘?[SRGMPDN][1-3]?[’']?/g;
const HEADING = /^(pallavi|anu ?pallavi|charan[ao]?m?|caranam|chitt[ae]? ?swar[a-z]*|cittaswar[a-z]*|mukt[a-z]*swar[a-z]*|sahit+y[a-z]*|madhyamakal[a-z]*)(\s*\d+)?\s*($|[-–:]\s)/i;
const scaleToken = x => { const m = /^(‘?)([SRGMPDN][1-3]?)([’']?)$/.exec(x); return m[2] + (m[3] ? "'" : '') + (m[1] ? '.' : ''); };
/* typing slips in a printed scale, each clear from the keyboard or the notation: F3 for G3 (the key beside it), N# for
   N3 (the shift of 3), Nn3 for N3, P1 for P and S1 for an upper S, since neither has variants, and a number in R's
   place after S */
const scaleSlips = t => t.replace(/(?<=\bS )1[1-3](?= M)/, 'R').replace(/(?<![A-Za-z])F([1-3])(?![A-Za-z0-9])/g, 'G$1').replace(/(?<![A-Za-z])N#/g, 'N3').replace(/(?<![A-Za-z])Nn([1-3])/g, 'N$1')
  .replace(/(?<![A-Za-z])P[1-3](?![A-Za-z0-9])/g, 'P').replace(/(?<![A-Za-z])S1(?![A-Za-z0-9])/g, 'S’');
/* the two lists as printed → the lists as meant: the top S marked, the last S unmarked, a lower mark that slipped from
   N to S ("R1 ‘S N3"), and a variant digit left off one direction, taken from the other */
function tidyScale(aro, avaro) {
  const a = aro.slice(), d = avaro.slice();
  if (a.length > 1 && a[0] === 'S' && a[a.length - 1] === 'S') a[a.length - 1] = "S'";
  if (d.length > 1 && d[0] === 'S' && /^S/.test(d[d.length - 1])) d[0] = "S'";
  if (d.length > 1 && d[0] === "S'" && /^S['.]$/.test(d[d.length - 1])) d[d.length - 1] = 'S';
  d.forEach((t, i) => { if (t === 'S.' && d[i + 1]) { d[i] = 'S'; d[i + 1] = d[i + 1] + '.'; } });
  const variant = list => { const m = {}; list.forEach(t => { const x = /^([RGMDN])([1-3])/.exec(t); if (x && !m[x[1]]) m[x[1]] = x[2]; }); return m; };
  const up = variant(a), down = variant(d);
  const fill = (list, other) => list.map(t => { const x = /^([RGMDN])(['.]*)$/.exec(t); return x && other[x[1]] ? x[1] + other[x[1]] + x[2] : t; });
  return [fill(a, down), fill(d, up)];
}
/* "kalyANi - S R2 G3 M2 P D2 N3 S’ - S’ N3 D2 P M2 G3 R2 S (65th mELakartha)" → { name, aro, avaro, note }, plus
   was (the text, if a slip was corrected) and section (a section the row also names: "charaNam 1 - kAmbhOji - S …").
   The dash may have a space on one side only ("AbhEri- S …", "S’- S’"), the avarohana may be marked "Av:". A swara
   row with digits (M2 P M2 P D N2 , D) is not a scale: without a name it needs two runs, or one that rises and falls. */
export function scaleRow(text) {
  const t = text.replace(/\s+/g, ' ').trim(), typed = scaleSlips(t);
  if (!/\b[RGMDN][1-3]\b/.test(typed)) return null;
  // keep what is in brackets whole
  const held = typed.replace(/\([^)]*\)/g, m => m.replace(/[-–—:]/g, '\u0001'));
  const parts = held.split(/\s+[-–—]+\s*|[-–—]+\s+|(?<=[’'\d])[-–—](?=[‘S])|\s*:\s+/).map(p => p.replace(/\u0001/g, '-').trim()).filter(Boolean);
  const bare = p => p.replace(/\(.*?\)/g, '').trim();
  for (let i = 0; i < parts.length; i++) {
    const m = /^(.*?[a-z)])\s+((?:‘?[SRGMPDN][1-3]?[’']?\s+){3,}‘?[SRGMPDN][1-3]?[’']?)$/.exec(parts[i]);
    if (m && /[a-z)]/.test(m[1]) && /[RGMDN][1-3]/.test(m[2])) { parts.splice(i, 1, m[1], m[2]); break; }
  }
  const isScale = p => { const q = bare(p), toks = q.match(SCALE_TOK) || []; return toks.length >= 4 && q.replace(SCALE_TOK, '').replace(/[\s,]/g, '') === '' && /[RGMDN][1-3]/.test(q); };
  const toList = p => (bare(p).match(SCALE_TOK) || []).map(scaleToken);
  const idx = parts.map((p, i) => isScale(p) ? i : -1).filter(i => i >= 0);
  if (!idx.length) return null;
  const words = parts.slice(0, idx[0]).filter(p => /[A-Za-z]{2}/.test(p));
  const commas = idx.some(i => parts[i].includes(','));
  if (!words.length) {
    const first = toList(parts[idx[0]]);
    if (commas || !/^S|\.$/.test(first[0])) return null;
    if (idx.length < 2 && !(first.length >= 5 && first.includes("S'"))) return null;
  } else if (commas && (parts[idx[0]].match(/[RGMDN][1-3]/g) || []).length < 3) return null;
  // the avarohana sometimes has no digits ("S’ D P G R S"): right after the arohana, it is still the avarohana
  const isRun = p => { if (!p) return false; const q = bare(p), toks = q.match(SCALE_TOK) || []; return toks.length >= 3 && q.replace(SCALE_TOK, '').replace(/\s/g, '') === ''; };
  if (idx[1] == null && isRun(parts[idx[0] + 1])) idx[1] = idx[0] + 1;
  let aroT = toList(parts[idx[0]]), avaroT = idx[1] != null ? toList(parts[idx[1]]) : null;
  if (!avaroT) { const top = aroT.findIndex((x, i) => x === "S'" && aroT[i + 1] === "S'"); if (top >= 0) { avaroT = aroT.slice(top + 1); aroT = aroT.slice(0, top + 1); } }
  if (!avaroT) avaroT = aroT.slice().reverse();
  const [aro, avaro] = tidyScale(aroT, avaroT);
  // the name: a section's name comes first if there is one, and a note on the mela is not the raga's name
  const mela = p => /\d(st|nd|rd|th)\b|\bm[eE]la|\bjanya$/i.test(p) && !/^[^\d(]*\([^)]*\)\s*janya$/i.test(p);
  const section = words.length && HEADING.test(words[0] + ' ') ? words[0] : '';
  const named = (section ? words.slice(1) : words);
  const plain = named.filter(p => !mela(p));
  const name = ((plain.length ? (section ? plain[plain.length - 1] : plain[0]) : '') || '').replace(/^\d+\.\s*/, '');
  const others = named.filter(p => p !== name);
  const last = idx[1] != null ? idx[1] : idx[0];
  const note = others.concat(parts.slice(last + 1)).join(' - ').trim() + ((parts[last].match(/\((.*?)\)/) || [])[1] ? ' ' + parts[last].match(/\((.*?)\)/)[1] : '');
  const out = { name, aro, avaro, note: note.trim() };
  if (typed !== t || aro.join() !== aroT.join() || avaro.join() !== avaroT.join()) out.was = t;
  if (section) out.section = section;
  return out;
}

/* the sahitya under a cell: each word with the swara (its index in the cell) above its first letter; the
   units are counted once the line is final (a cell read at four times speed moves them) */
function sahityaOf(cols, runs, k) {
  const text = runs.map(r => r.text).join('');
  const out = [];
  const re = /\S+/g;
  let m;
  while ((m = re.exec(text))) {
    let at = -1;
    cols.forEach((x, i) => { if (x.c0 <= m.index) at = i; });
    if (cols.length) out.push([k, Math.max(0, at), m[0]]);
  }
  return out;
}
const sylUnits = (cells, syl) => {
  const starts = []; let u = 0;
  cells.forEach(c => { const offs = []; parseCell(c).forEach(t => { offs.push(u); u += t.d; }); starts.push(offs); });
  return syl.map(([k, i, text]) => [Math.round(((starts[k] && starts[k][i] != null) ? starts[k][i] : 0) * 1000) / 1000, text]);
};

/* a letter that is no swara, typed in a row of swaras: E for R, F for G and O for P (the key beside each), and a stray
   syllable before a swara (thaP). Read so only where the row is otherwise all swaras and the raga has the swara. The
   columns are kept, for the sahitya under them. Returns the runs corrected, or null. */
const NEAR = { E: 'R', F: 'G', O: 'P' };
function letterSlips(text, runs, raga) {
  const toks = text.trim().split(/\s+/);
  const odd = t => /^[EFO],?$/.test(t) || /^[a-z]{2,4}[SRGMPDN],?$/.test(t);
  const wrong = toks.filter(odd);
  if (!wrong.length || wrong.length > 2 || toks.length < 6) return null;
  if (!swaraish(toks.filter(t => !odd(t)).join(' '))) return null;
  if ((toks.filter(t => !odd(t)).join(' ').match(/[SRGMPDN]/g) || []).length < 2) return null;
  const has = L => !raga || raga.aro.concat(raga.avaro).some(x => x[0] === L);
  if (!wrong.every(t => has(NEAR[t[0]] || t.replace(/,$/, '').slice(-1)))) return null;
  return runs.map(r => ({ u: r.u, text: r.text.replace(/(^|[\s,])([EFO])(?=$|[\s,])/g, (m, a, L) => a + NEAR[L]).replace(/(^|[\s,])([a-z]{2,4})([SRGMPDN])(?=$|[\s,])/g, (m, a, x, L) => a + ' '.repeat(x.length) + L) }));
}
// beside a row of swaras: how often to sing it, or where it goes
const ROW_NOTE = /\b\d+\s*times?\b|\brepeat|\balternate\b|\bportion\b/i;
// what is printed outside the tables and is not the piece: links, and requests to the reader
const NOT_THE_PIECE = /https?:\/\/|www\.|^please share/i;
const MELA_NOTE = /\bm[eE]la(kart[h]?a)?\b|janya\b|anya ?swara|bh?ashanga/i;

/* ---------- one post ---------- */
/* v0.9.5: slips a singer has confirmed, which no rule can tell from a real leap: [composition, as the site has it, as meant].
   Each replacement shows behind the line's "fixed" tag with what the site printed. */
const CONFIRMED_SLIPS = [['2021-08-mahaganapathim-nattai-adi', "[S' , R' S]", "[S' , R' S']"]];
function applyConfirmedSlips(comps) {
  CONFIRMED_SLIPS.forEach(([id, from, to]) => {
    const c = comps.find(x => x.id === id);
    let n = 0;
    if (c) c.sections.forEach(s => s.lines.forEach(l => l.cells.forEach((cell, k) => {
      const times = cell.split(from).length - 1;
      if (!times) return;
      n += times;
      l.cells[k] = cell.split(from).join(to);
      const had = (l.fixed = l.fixed || []).find(x => x.cell === k);
      if (had) had.why.push('confirmed'); else l.fixed.push({ cell: k, was: cell, why: ['confirmed'] });
    })));
    if (c) c.stats.slips = (c.stats.slips || 0) + n;
    if (!n) console.warn('A confirmed slip is no longer there: ' + id + ' ' + from + ' (has the site corrected it?)');
  });
}
/* v0.9.5: the swaras a singer may write in a raga beyond its own printed scale (scale.also). The raga profiles have no anya
   swaras, so they come from the notation: a swara this composition writes, a swara at least two other posts print for this
   raga (Bhairavi's D2 and D1), or one written in this raga in at least three cells of at least two compositions (Khamas's
   N3). One stray cell elsewhere is taken for a slip, and a ragamalika is no evidence for other pieces, since which of its
   scales a section takes is less sure. */
const ALSO_PRINTED = 2, ALSO_CELLS = 3, ALSO_COMPS = 2;
function allowAnyaSwaras(comps) {
  const raga = r => key(String(r.name || '').replace(/\s*\(.*$/, ''));
  const notes = r => r.aro.concat(r.avaro).map(n => n.replace(/['.]/g, ''));
  const sectionScale = (c, s) => c.ragas[s.raga != null && c.ragas[s.raga] ? s.raga : 0];
  const printed = new Map(), written = new Map(), own = new Map();
  comps.forEach(c => {
    c.ragas.forEach(r => { const k = raga(r); if (!printed.has(k)) printed.set(k, new Map()); new Set(notes(r)).forEach(n => printed.get(k).set(n, (printed.get(k).get(n) || 0) + 1)); });
    c.sections.forEach(s => {
      const r = sectionScale(c, s);
      if (!r) return;
      const k = raga(r);
      s.lines.forEach(l => l.cells.forEach(cell => notesOutside([cell], { aro: r.aro, avaro: r.avaro }).forEach(n => {
        if (!own.has(r)) own.set(r, new Set());
        own.get(r).add(n);
        if (c.ragamalika) return;
        if (!written.has(k)) written.set(k, new Map());
        const w = written.get(k).get(n) || { cells: 0, comps: new Set() };
        w.cells++; w.comps.add(c.id); written.get(k).set(n, w);
      })));
    });
  });
  comps.forEach(c => c.ragas.forEach(r => {
    const k = raga(r), also = new Set(own.get(r) || []);
    (printed.get(k) || new Map()).forEach((n, name) => { if (n >= ALSO_PRINTED) also.add(name); });
    (written.get(k) || new Map()).forEach((w, name) => { if (w.cells >= ALSO_CELLS && w.comps.size >= ALSO_COMPS) also.add(name); });
    const list = Array.from(also).filter(n => notesOutside([n], { aro: r.aro, avaro: r.avaro }).length);
    if (list.length) r.also = allowedNotes({ also: list }).filter(n => list.includes(n)); else delete r.also;
  }));
}
const TYPE = { Basics: 'Basics', Geetham: 'Geetham', LakshanaGeetham: 'Lakshana geetham', PillariGeetham: 'Geetham', Nottuswaram: 'Nottuswaram', Jathiswara: 'Jathiswaram', Swarajathi: 'Swarajathi', Varnam: 'Varnam', PadhaVarnam: 'Pada varnam', DaruVarnam: 'Daru varnam', Daru: 'Daru', Krithi: 'Krithi', Dasarapadha: 'Dasara pada', Vachana: 'Vachana', Thillana: 'Thillana', Thiruppavai: 'Thiruppavai', Thiruppugazh: 'Thiruppugazh', Shlokam: 'Shlokam', ashtapadhi: 'Ashtapadi', ugAbhoga: 'Ugabhoga', mallari: 'Mallari', Talamalika: 'Talamalika' };
const TYPE_ORDER = ['Basics', 'Geetham', 'Lakshana geetham', 'Nottuswaram', 'Jathiswaram', 'Swarajathi', 'Varnam', 'Pada varnam', 'Daru varnam', 'Daru', 'Thillana', 'Krithi', 'Dasara pada', 'Ashtapadi', 'Thiruppavai', 'Thiruppugazh', 'Vachana', 'Ugabhoga', 'Shlokam', 'Mallari', 'Talamalika'];
const LANG = { Telugu: 'Telugu', Tamil: 'Tamil', Sanskrit: 'Sanskrit', Kannada: 'Kannada', Malayalam: 'Malayalam', Hindi: 'Hindi', 'MaNipravALa': 'Manipravalam' };
const DEITY = ['Ganesha', 'Vishnu', 'Shiva', 'Devi', 'Krishna', 'Rama', 'Subramanya', 'Hanuman', 'Lakshmi', 'Saraswathi', 'Guru', 'Ayyappa', 'Narasimha', 'Navagraha', 'Soorya', 'Patriotic'];
const key = s => String(s || '').toLowerCase().replace(/[^a-z]/g, '').replace(/h/g, '').replace(/(.)\1/g, '$1').replace(/m$/, '');
const TALA_WORDS = /\b(adi|aadi|adhi|aadhi|ata|eka|rupakam|roopakam|rupaka|chapu|chaapu|chApu|jhampa|jampe|jampa|triputa|thriputa|matya|dhruva|druva|desadi|madhyadi)\b/i;

function idOf(url) { return url.replace(/^https?:\/\/[^/]+\//, '').replace(/\.html$/, '').replace(/^(\d{4})\/(\d{2})\//, '$1-$2-').replace(/[^a-z0-9-]+/gi, '-').toLowerCase(); }

export function parsePost(entry) {
  const title = entry.title.$t.trim(), url = (entry.link.find(l => l.rel === 'alternate') || {}).href || '';
  const labels = (entry.category || []).map(c => c.term);
  const parts = title.split(/\s*[-–]\s+|\s+[-–]\s*|\s*-\s*(?=[A-Z])/).map(s => s.trim()).filter(Boolean);
  const html = entry.content.$t;
  const stats = { rows: 0, lines: 0, full: 0, lead: 0, joined: 0, tail: 0, link: 0, partial: 0, fast4: 0, badChars: 0, sahitya: 0 };
  const sections = [], ragas = [];
  let raga = null, sec = null, pending = '';
  const newSection = (title, lyrics) => { sec = { title: title || '', lyrics: lyrics || [], raga: raga ? ragas.indexOf(raga) : null, lines: [] }; sections.push(sec); pending = ''; return sec; };
  const openSection = () => { if (!sec) newSection(pending, []); return sec; };
  const bad = new Set();
  const paraText = p => p.map(r => r.text).join('').replace(/\s+/g, ' ').trim();
  const nameOf = n => n.replace(/\s*\(.*$/, '').trim();
  /* the raga from here on. A section with no lines yet takes it; one with lines ends there, so each line is sung in
     the raga printed above it */
  const setRaga = (r, title) => {
    const changed = raga && r !== raga;
    raga = r;
    if (sec && !sec.lines.length) sec.raga = ragas.indexOf(r);
    else if (sec && changed) { sec = null; pending = title || ''; }
    else if (!sec && changed) pending = title || '';
  };
  const addScale = sc => {
    const section = sc.section; delete sc.section;
    const sig = x => x.aro.join(' ') + '|' + x.avaro.join(' ') + '|' + key(x.name);
    let r = ragas.find(x => sig(x) === sig(sc));
    if (!r) { ragas.push(sc); r = sc; }
    setRaga(r, nameOf(r.name));
    if (section) { if (sec && !sec.lines.length && !sec.title) sec.title = section; else if (!sec || sec.lines.length) { sec = null; pending = section; } }
  };
  // a raga named beside a row, with no scale printed: its scale comes from the other posts (fillScales)
  const namedRaga = name => {
    let r = ragas.find(x => key(nameOf(x.name)) === key(name));
    if (!r) { r = { name, aro: [], avaro: [], note: '', named: true }; ragas.push(r); }
    setRaga(r, name);
  };
  // a raga of this post named on its own: a line of a heading, a section's title, or in brackets after it
  const cue = t => { const k = key(t); return k ? ragas.find(r => r.aro.length && key(nameOf(r.name)) === k) : null; };
  const heading = list => {
    let paras = list;
    while (paras.length > 1 && cue(paras[0])) { setRaga(cue(paras[0]), nameOf(paras[0])); paras = paras.slice(1); }
    const head = paras[0] || '';
    const m = /^([^-–:]{1,40}?)\s*(?:[-–:]\s+|$)(.*)$/.exec(head);
    // a section's name ("pallavi - its words", "chittaswaram"), not the first line of the words
    const named = m && SECTION_WORD.test(m[1]);
    const looksTitle = m && (named || (m[2] && m[1].split(/\s+/).length <= 3));
    newSection(looksTitle ? m[1].trim() : '', (looksTitle ? (m[2] ? [m[2]] : []) : [head]).concat(paras.slice(1)));
    const inBrackets = /\(([^)]+)\)/.exec(head);
    const cued = cue(sec.title) || cue(head) || (inBrackets && cue(inBrackets[1])) || cue(((m && m[2]) || '').split(/\s*[-–]\s*/)[0]);
    if (cued) { raga = cued; sec.raga = ragas.indexOf(cued); }
    const numbered = /^\d+\.\s*([A-Za-z ]{3,})$/.exec(sec.title);
    if (!cued && numbered && /ragamalika/i.test(title.replace(/[^a-z]/gi, ''))) namedRaga(numbered[1].trim());
  };

  /* what is printed outside the tables: a scale, a note on the raga's mela, a section's name, the words */
  const outside = paras => {
    let words = [];
    const flush = () => {
      if (!words.length) return;
      newSection(words.join(' ').split(/\s+/).length >= 14 ? 'Lyrics' : 'Notes', words);
      sec = null; words = [];
    };
    paras.forEach(p => {
      if (NOT_THE_PIECE.test(p) || !/\p{L}/u.test(p)) return;
      const sc = scaleRow(p);
      if (sc) { flush(); addScale(sc); return; }
      if (raga && MELA_NOTE.test(p) && p.split(/\s+/).length <= 8) { raga.note = (raga.note ? raga.note + ' ' : '') + p; return; }
      if (HEADING.test(p + ' ') && p.split(/\s+/).length <= 3 || /^note \d+\b/i.test(p)) { flush(); heading([p]); return; }
      words.push(p);
    });
    flush();
  };

  const eachTable = tb => {
    const W = tb.width;
    // is the first column a label column (empty, or numbers, beside the swaras)?
    const multi = tb.rows.filter(r => r.filter(c => c.origin && c.text).length >= 2 || r.some(c => c.origin && c.col > 0 && swaraish(c.text)));
    const labelCol = W >= 2 && multi.length > 0 && multi.filter(r => isLabel(r[0].text) || !r[0].origin).length >= multi.length * 0.6 && multi.some(r => r.slice(1).some(c => swaraish(c.text)));
    let block = [], carry = '';   // block: the swara lines waiting for their sahitya; carry: a section named beside the last row
    const fixedOf = c => swaraish(c.text) ? null : letterSlips(c.text, c.paras.flat(), raga);
    const isNotes = c => swaraish(c.text) || !!fixedOf(c);
    const letters = c => (c.text.match(/[SRGMPDN]/g) || []).length;
    /* one line from the cells of a row (blank ones keep their place) */
    const addLine = (cells, off, extra) => {
      const parsed = cells.map(c => {
        if (!c.origin) return null;
        if (!c.paras.length || !c.text || !isNotes(c)) return { text: '', units: 0, bad: [], cols: [], slips: [], was: '' };
        const fixed = fixedOf(c);
        if (!fixed) return swaraCell(c.paras.flat());
        const p = swaraCell(fixed); p.was = c.paras.flat().map(r => r.text).join('').replace(/\s+/g, ' ').trim(); p.slips.push('letter');
        return p;
      });
      const live = parsed.filter(Boolean);
      live.forEach(p => p.bad.forEach(ch => bad.add(ch)));
      stats.badChars += live.reduce((a, p) => a + p.bad.length, 0);
      // leading empty cells mark a lead-in; trailing ones are dropped
      let lead = 0; while (lead < live.length && !live[lead].text) lead++;
      let end = live.length; while (end > lead && !live[end - 1].text) end--;
      const used = live.slice(lead, end);
      const line = { cells: used.map(p => p.text) };
      if (extra.label) line.label = extra.label;
      if (extra.note) line.note = extra.note;
      const fixed = used.map((p, k) => p.slips.length ? { cell: k, was: p.was, why: Array.from(new Set(p.slips)) } : null).filter(Boolean);
      if (fixed.length) { line.fixed = fixed; stats.slips = (stats.slips || 0) + used.reduce((n, p) => n + p.slips.length, 0); }
      if (lead && !extra.noLead) line.leadCells = lead;
      line._cols = used.map(p => p.cols);
      line._colIdx = cells.map((c, i) => c.origin ? i + off : -1).filter(i => i >= 0).slice(lead, end);
      sec.lines.push(line); block.push(line);
      stats.lines++;
      return line;
    };
    /* the sahitya of a row, for the lines waiting above it; a cell over none of their columns is kept with the lyrics */
    const giveSahitya = (row, cols) => {
      const taken = new Set();
      block.forEach(line => {
        const syl = [];
        line._colIdx.forEach((ci, k) => {
          const c = row[ci];
          taken.add(ci);
          if (c && c.origin && c.paras.length && (!cols || cols.has(ci))) sahityaOf(line._cols[k], c.paras.flat(), k).forEach(s => syl.push(s));
        });
        if (syl.length) { line.syl = syl; stats.sahitya++; }
      });
      row.forEach((c, i) => { if (c.origin && c.text && !taken.has(i) && !isLabel(c.text) && (!cols || cols.has(i)) && sec) sec.lyrics.push(c.text.replace(/\s+/g, ' ')); });
      block = [];
    };
    tb.rows.forEach(row => {
      stats.rows++;
      const origins = row.filter(c => c.origin && !c.filler && c.text);
      const text = row.map(c => c.origin ? c.text : '').join(' ').trim();
      if (!text) return;
      // the first column is a label, unless this row has swaras in it
      const firstNotes = labelCol && row[0].origin && row[0].text && !isLabel(row[0].text) && swaraish(row[0].text) && letters(row[0]) >= 3;
      // a raga named in the first cell, beside swaras
      const first = origins[0];
      const ragaLabel = first && first.col === 0 && /^[A-Za-z]{4,}$/.test(first.text.trim()) && !isNotes(first) && !HEADING.test(first.text.trim() + ' ') && !/^(t[h]?[ir]s+ra|t[h]?ris|chat[hu]+|kh?anda|mis[h]?ra|sankeer)/i.test(first.text.trim()) && origins.slice(1).some(c => isNotes(c) && letters(c) >= 3) ? first.text.trim() : '';
      const off = ragaLabel ? first.span : labelCol && !firstNotes ? 1 : 0;
      const content = row.slice(off);
      const wide = origins.length === 1 && origins[0].span >= Math.max(1, W - (labelCol ? 1 : 0)) || (origins.length === 1 && W === 1);
      const texts = origins.filter(c => !(labelCol && c.col === 0 && isLabel(c.text)));
      const lone = texts.length === 1 ? texts[0] : null;
      // a heading row: the scale, or a section with its lyrics
      if (lone && !isNotes(lone) || lone && lone.paras.length > 1 || wide) {
        const cell = lone || origins[0];
        const paras = cell.paras.map(paraText).filter(Boolean);
        if (paras.some(p => scaleRow(p))) {
          let words = [], firstOfCell = null, count = 0;
          paras.forEach(p => { const sc = scaleRow(p); if (!sc) { words.push(p); return; } if (words.length) { heading(words); words = []; } addScale(sc); count++; firstOfCell = firstOfCell || raga; });
          if (words.length) heading(words);
          // scales listed together: the piece starts with the first, and its sections name the others
          if (count > 1 && firstOfCell && !sections.some(x => x.lines.length)) { raga = firstOfCell; if (sec) sec.raga = ragas.indexOf(raga); }
          block = [];
          return;
        }
      }
      // a scale, with a note on the tala in the next cell
      if (texts.length === 2 && texts.every(c => !isNotes(c))) {
        const at = texts.findIndex(c => c.paras.map(paraText).some(p => scaleRow(p)));
        if (at >= 0) {
          texts[at].paras.map(paraText).forEach(p => { const sc = scaleRow(p); if (sc) addScale(sc); });
          const other = texts[1 - at].text.replace(/\s+/g, ' ').trim();
          if (raga) raga.note = (raga.note ? raga.note + ' ' : '') + other;
          block = [];
          return;
        }
      }
      // (a lone narrow cell of words just under swara lines is their sahitya, unless it names a section)
      if (wide || (origins.length === 1 && !swaraish(origins[0].text) && !block.length) || (lone && !isNotes(lone) && HEADING.test(lone.text.replace(/\s+/g, ' ').trim() + ' '))) {
        const cell = lone || origins[0];
        if (!(swaraish(cell.text) && cell.text.replace(/[\s,]/g, '').length)) {
          if (isNotes(cell) && fixedOf(cell)) { /* a full-width swara row with a slip: fall through */ }
          else { heading(cell.paras.map(paraText).filter(Boolean)); block = []; return; }
        }
      }
      // a row of swaras; beside them may be labels, a note on singing it, or the name of the next section
      const others = content.filter(c => c.origin && c.text && !isNotes(c) && !isLabel(c.text));
      const noted = others.filter(c => ROW_NOTE.test(c.text)), named = others.filter(c => !ROW_NOTE.test(c.text) && HEADING.test(c.text.replace(/\s+/g, ' ').trim() + ' '));
      const swaraRow = content.some(c => c.origin && isNotes(c)) && noted.length + named.length === others.length && (!others.length || content.some(c => c.origin && isNotes(c) && letters(c) >= 3));
      if (swaraRow) {
        if (ragaLabel) namedRaga(ragaLabel);
        openSection();
        const label = labelCol && !firstNotes && !ragaLabel && row[0].origin && row[0].text.trim() ? row[0].text.trim() : undefined;
        addLine(content, off, { label, note: noted.map(c => c.text.replace(/\s+/g, ' ').trim()).join(' ') || undefined, noLead: others.length > 0 && !swaraish(content[0].text) && content[0].origin && !!content[0].text });
        carry = named.length ? named[0].text.replace(/\s+/g, ' ').trim() : carry;
        return;
      }
      /* two blocks side by side: the sahitya of the line above, and the swaras of the next section ("chittaswaram") */
      const right = origins.filter(c => isNotes(c) && letters(c) >= 3);
      if (block.length && right.length >= 2 && origins.some(c => !isNotes(c))) {
        const from = right[0].col;
        giveSahitya(row, new Set(row.map((c, i) => i).filter(i => i < from)));
        sec = null; pending = carry; carry = '';
        openSection();
        addLine(row.slice(from), from, {});
        return;
      }
      // sahitya: give each line of the block above its syllables
      if (block.length) giveSahitya(row);
      else if (sec) sec.lyrics.push(text.replace(/\s+/g, ' '));
      else { openSection(); origins.forEach(c => c.paras.map(paraText).filter(Boolean).forEach(p => sec.lyrics.push(p))); }
    });
    // lines with no sahitya row keep their working columns only until here
  };
  blocks(html).forEach(b => { if (b.table) eachTable(b.table); else outside(b.paras); });

  // tala: a title part that names one, then the labels
  const talaName = parts.slice(1).find(p => talaOf(p)) || labels.find(l => /taala|tala|chApu|chapu|roopakam|jamp|triputa|thriputa|dhruva|eka|ata\b/i.test(l) && talaOf(l)) || null;
  const named = talaName ? talaOf(talaName) : null;
  const lines = sections.flatMap(s => s.lines);
  const rowsOf = ls => ls.filter(l => !l.leadCells).map(l => l.cells.map(cellUnits)).filter(r => r.length);
  const allRows = rowsOf(lines);
  /* how well a tala fits: units per beat for the whole piece, and for each section the piece's (or the
     section's own, when a section changes nadai and fits better with it); fit = the share of rows that fill
     whole cycles with their cells on anga lines */
  const fitOf = t => {
    const whole = bestUnits(t.tala, allRows);
    let n = 0;
    const secUpb = sections.map(s => {
      const rows = rowsOf(s.lines);
      const own = bestUnits(t.tala, rows), withWhole = rows.filter(r => rowFits(t.tala, whole.upb, r)).length;
      if (own.n > withWhole) { n += own.n; return own.upb; }
      n += withWhole; return whole.upb;
    });
    return { t, upb: whole.upb, secUpb, fit: allRows.length ? n / allRows.length : 0 };
  };
  const COMMON_TALAS = ['Adi', 'Roopakam', 'Mishra chapu', 'Khanda chapu', 'Tisra triputa', 'Khanda ata', 'Mishra jhampa', 'Chathusra eka', 'Tisra eka', 'Khanda eka', 'Chathusra matya', 'Chathusra dhruva', 'Khanda triputa', 'Sankeerna chapu', 'Chathusra jhampa', 'Khanda jhampa', 'Tisra roopakam', 'Mishra triputa', 'Sankeerna triputa', 'Mishra eka'].map(talaOf);
  let fit = named ? fitOf(named) : null, inferred = false, refit = false;
  // a tala named but not followed by the notation (a "khanda chapu" written in cycles of 7, a "roopakam" in
  // cycles of Adi), or none named: the grid uses the common tala the lines fill best, and the page says so
  if (allRows.length && (!fit || fit.fit < 0.6)) {
    const best = COMMON_TALAS.map(fitOf).reduce((a, b) => b.fit > a.fit + 1e-9 ? b : a);
    if (best.fit >= 0.6 && (!fit || best.fit >= fit.fit + 0.2)) { if (fit) refit = true; else inferred = true; fit = best; }
  }
  const tl = fit ? fit.t : null, upb = fit ? fit.upb : 1;
  sections.forEach((s, si) => {
    const sUpb = fit ? fit.secUpb[si] : 1, cyc = tl ? tl.tala.total * sUpb : null;
    const whole = u => Math.abs(u / cyc - Math.round(u / cyc)) < 1e-9;
    if (tl && sUpb !== upb) s.unitsPerBeat = sUpb;
    // pos: where the lines so far end, in units into the cycle (the rows of one line are sometimes split:
    // a short link row, then the rest of the cycle)
    let pos = 0;
    const units = l => l.cells.reduce((a, c) => a + cellUnits(c), 0);
    const restAt = l => { let r = 0; for (const t of parseCell(l.cells.join(' '))) { if (t.s !== ',') break; r += t.d; } return r; };
    s.lines.forEach((l, i) => {
      if (cyc && !l.leadCells && !rowFits(tl.tala, sUpb, l.cells.map(cellUnits)) && l.cells.some(c => c.includes('['))) {
        // the site underlines both double- and four-times-speed groups: where a row fills its cycle only with a
        // cell's underlined groups read at four times, read them so
        const fast = c => c.replace(/\[([^\[\]]*)\]/g, '[[$1]]');
        const tries = l.cells.map((c, k) => c.includes('[') ? l.cells.map((x, j) => j === k ? fast(x) : x) : null).filter(Boolean).concat([l.cells.map(fast)]);
        const ok = tries.find(cs => rowFits(tl.tala, sUpb, cs.map(cellUnits)));
        if (ok) { l.cells = ok; stats.fast4++; }
      }
      const u = units(l), last = cellUnits(l.cells[l.cells.length - 1] || '');
      if (!cyc) stats.partial++;
      else if (l.leadCells && !whole(u)) { l.at = cyc - (u % cyc); stats.lead++; pos = 0; }
      else if (pos && whole(pos + u)) { l.join = true; stats.joined++; pos = 0; }
      else if (whole(u) && u > 0) { stats.full++; pos = 0; }
      else if (l.cells.length >= 2 && last < cyc && whole(u - last) && rowFits(tl.tala, sUpb, l.cells.slice(0, -1).map(cellUnits)) && Math.max(restAt(l), s.lines[i + 1] ? restAt(s.lines[i + 1]) : 0) >= last - 1e-9) {
        l.tail = last; stats.tail++; pos = 0;   // a last cell that fills the next line's opening rests
      }
      else {
        const next = s.lines[i + 1], nu = next ? next.cells.reduce((a, c) => a + cellUnits(c), 0) : 0;
        if (!pos && next && !next.leadCells && whole(u + nu)) { stats.joined++; pos = u % cyc; }   // the first part of a split line
        else if (u < cyc) { l.link = true; stats.link++; pos = 0; }   // a link: a short phrase that leads back into a line
        else { stats.partial++; pos = 0; }
      }
      if (l.syl) l.syl = sylUnits(l.cells, l.syl);
      delete l.leadCells; delete l._cols; delete l._colIdx;
    });
  });
  // the main raga: the first scale row, named as the labels name it. When that row gives no name, or names something
  // the post's title does not ("Kharaharapriya Janya" over Madhyamavathi), the title's raga is the name
  const main = ragas[0] || null;
  const nice = n => { const k = key(n); return (labels.find(l => key(l) === k) || labels.find(l => k && key(l).startsWith(k)) || n).replace(/(?<=[a-z])Raga$/, ''); };
  const known = new Set(Object.keys(TYPE).concat(Object.keys(LANG), DEITY, ['Ragamalika']));
  const lastPart = parts.length >= 3 ? parts[parts.length - 1] : '';
  const notRaga = p => !p || /^\d+$/.test(p) || talaOf(p) || TALA_WORDS.test(p) || /ragamalika|rAgamAlika|^notes?$|^varnam$|^krithi$|geetham|jathiswara|swarajathi|thillana|nottuswaram|thiruppavai|varise|^basic/i.test(p) || known.has(p);
  const aRaga = p => { const k = key(p); return MELA_ALIAS[k] || JANYA.some(r => key(r.name) === k); };
  const titleRaga = () => {
    const sure = parts.find(p => !notRaga(p) && aRaga(p));
    if (sure) return labels.find(x => !known.has(x) && key(x) === key(sure)) || sure;
    const can = parts.filter(p => !notRaga(p) && key(p) !== key(lastPart));
    for (const p of can) { const l = labels.find(x => !known.has(x) && key(x) === key(p)); if (l) return l; }
    return '';
  };
  const printed = main ? nameOf(main.name) : '';
  const inTitle = k => k && parts.concat(labels).some(p => { const a = key(p); return a === k || a.startsWith(k) || k.startsWith(a) && a.length >= 4; });
  const multiRaga = labels.includes('Ragamalika') || /ragamalika/i.test(title.replace(/[^a-z]/gi, ''));
  const byPosition = () => [parts[1], parts[2]].find(p => !notRaga(p) && key(p) !== key(lastPart)) || '';
  const ragaName = multiRaga ? (printed ? nice(printed) : 'Ragamalika')
    : printed && inTitle(key(printed)) ? nice(printed)
    : titleRaga() || (printed && !/\bjanya$/i.test(printed) ? nice(printed) : byPosition());
  if (main && !main.name) main.name = ragaName;
  const typeLabel = labels.map(l => TYPE[l]).filter(Boolean).sort((a, b) => TYPE_ORDER.indexOf(a) - TYPE_ORDER.indexOf(b));
  const type = typeLabel.find(t => t !== 'Talamalika') || (parts.find(p => /varnam/i.test(p)) ? 'Varnam' : labels.includes('Ragamalika') && !typeLabel.length ? 'Krithi' : typeLabel[0] || (lines.length ? 'Krithi' : 'Other'));
  const composerPart = parts.length >= 3 ? parts[parts.length - 1] : '';
  const composer = composerPart && !TALA_WORDS.test(composerPart) ? (labels.find(l => key(l) === key(composerPart)) || labels.find(l => !known.has(l) && key(l) && (key(l).includes(key(composerPart)) || key(composerPart).includes(key(l))) && key(l) !== key(ragaName)) || composerPart) : '';
  const id = idOf(url);
  return {
    id, title, name: parts[0] || title, url,
    published: entry.published.$t.slice(0, 10), updated: entry.updated.$t.slice(0, 10),
    type, raga: ragaName, ragamalika: labels.includes('Ragamalika') || new Set(ragas.map(r => key(r.name))).size > 1,
    tala: tl ? { name: tl.name, fam: tl.fam, L: tl.L, nadai: tl.nadai, unitsPerBeat: upb, inferred: inferred || undefined, refit: refit ? named.name : undefined, written: talaName || undefined } : null,
    composer, language: labels.map(l => LANG[l]).find(Boolean) || '', deity: labels.filter(l => DEITY.includes(l)),
    labels, ragas, sections: sections.filter(s => s.lines.length || s.lyrics.length || s.title),
    stats, unknown: Array.from(bad).join('')
  };
}

/* ---------- scales for posts that print none ----------
   A post without a scale row (the sarali varisai, some jathiswarams and krithis) takes its raga's scale from
   the other compositions on the site in that raga (the scale most of them print), or else from the engine's
   ragas by name; the basic exercises are in Mayamalavagowla, as they are taught. The scale says where it came
   from (from: 'site' or 'engine'). */
// common names of melakartas (beside the 72 names themselves), as key() spells them
const MELA_ALIAS = { [key('Shankarabharanam')]: 29, [key('Kalyani')]: 65, [key('Thodi')]: 8, [key('Todi')]: 8, [key('Mayamalavagowla')]: 15, [key('Keeravani')]: 21, [key('Simhendramadhyamam')]: 57, [key('Shanmukhapriya')]: 56, [key('Gowrimanohari')]: 23, [key('Vachaspathi')]: 64, [key('Hemavathi')]: 58, [key('Dharmavathi')]: 59, [key('Latangi')]: 63, [key('Charukesi')]: 26, [key('Natabhairavi')]: 20 };
MELA_NAMES.forEach((n, i) => { MELA_ALIAS[key(n)] = i + 1; });
function fillScales(comps, entries) {
  const votes = new Map();   // raga key → Map(scale text → { scale, n })
  comps.forEach(c => c.ragas.forEach(r => {
    const k = key(r.name.replace(/\s*\(.*$/, '')); if (!k || !r.aro.length) return;
    const sig = r.aro.join(' ') + ' | ' + r.avaro.join(' ');
    if (!votes.has(k)) votes.set(k, new Map());
    const m = votes.get(k); m.set(sig, { scale: r, n: ((m.get(sig) || {}).n || 0) + 1 });
  }));
  const fromSite = k => { const m = votes.get(k); if (!m) return null; const best = Array.from(m.values()).sort((a, b) => b.n - a.n)[0]; return { name: best.scale.name, aro: best.scale.aro, avaro: best.scale.avaro, note: '', from: 'site' }; };
  const fromEngine = k => {
    const n = MELA_ALIAS[k];
    if (n) { const L = melaLabels(n); return { name: MELA_NAMES[n - 1], aro: L.concat(["S'"]), avaro: ["S'"].concat(L.slice().reverse()), note: '', from: 'engine' }; }
    const j = JANYA.find(r => key(r.name) === k);
    if (!j) return null;
    const lab = p => p === 12 ? "S'" : j.labels[p];
    return { name: j.name, aro: j.aro.map(lab), avaro: j.avaro.map(lab), note: '', from: 'engine' };
  };
  const byId = new Map(entries.map(e => [idOf((e.link.find(l => l.rel === 'alternate') || {}).href || ''), e]));
  // a raga named beside a row of a ragamalika, with no scale printed
  comps.forEach(c => {
    if (!c.ragas.some(r => r.named)) return;
    const kept = [];
    c.ragas.forEach((r, i) => {
      if (r.named) { const sc = fromSite(key(r.name)) || fromEngine(key(r.name)); delete r.named; if (!sc) { r.gone = true; console.error('No scale for the raga ' + r.name + ' named in ' + c.id); } else { r.aro = sc.aro; r.avaro = sc.avaro; r.from = sc.from; } }
      if (!r.gone) kept.push(r);
    });
    const index = c.ragas.map(r => kept.indexOf(r));
    c.sections.forEach(s => { if (s.raga != null) s.raga = index[s.raga] >= 0 ? index[s.raga] : null; });
    c.ragas = kept;
  });
  comps.forEach(c => {
    if (!c.ragamalika || !c.sections.some(s => s.lines.length && s.raga == null)) return;
    let cur = null;
    c.sections.forEach(s => {
      if (s.raga != null) { cur = s.raga; return; }
      const name = (s.lyrics[0] || '').split(/\s*[-–]\s*/)[0];
      const k = key(name);
      if (k) {
        let i = c.ragas.findIndex(r => key(r.name.replace(/\s*\(.*$/, '')) === k);
        if (i < 0) { const sc = fromSite(k) || fromEngine(k); if (sc) { c.ragas.push(Object.assign({}, sc, { name })); i = c.ragas.length - 1; } }
        if (i >= 0) cur = i;
      }
      s.raga = cur;
    });
  });
  comps.forEach(c => {
    if (c.ragas.length || !c.stats.lines) return;
    const e = byId.get(c.id.replace(/-\d+$/, '')) || {};
    const names = [c.raga].concat(c.title.split(/\s*[-–]\s*/), (e.category || []).map(x => x.term)).filter(Boolean);
    let sc = null;
    for (const n of names) { sc = fromSite(key(n)) || fromEngine(key(n)); if (sc) break; }
    if (!sc && c.type === 'Basics') sc = fromEngine(key('Mayamalavagowla'));
    if (!sc && c.type === 'Nottuswaram') sc = fromEngine(key('Shankarabharanam'));   // Dikshitar's nottuswarams are in Shankarabharanam
    if (!sc) return;
    c.ragas.push(sc);
    c.sections.forEach(s => { if (s.raga == null) s.raga = 0; });
    if (!c.raga || !votes.has(key(c.raga))) c.raga = sc.from === 'engine' ? sc.name : c.raga || sc.name;
  });
}

/* ---------- the feed ---------- */
async function fetchFeed() {
  const all = [];
  for (let start = 1; ; ) {
    let data, tries = 0;
    for (;;) {
      try { const res = await fetch(FEED + start); if (!res.ok) throw new Error('HTTP ' + res.status); data = await res.json(); break; }
      catch (e) { if (++tries >= 4) throw e; await new Promise(r => setTimeout(r, 1500 * tries)); }
    }
    const es = data.feed.entry || [];
    if (!es.length) break;
    all.push(...es); start += es.length;
    process.stdout.write('\r' + all.length + ' of ' + data.feed.openSearch$totalResults.$t + ' posts');
  }
  process.stdout.write('\n');
  return all;
}

const summary = c => ({ id: c.id, title: c.title, name: c.name, source: c.source ? c.source.id : undefined, type: c.type, raga: c.raga, ragamalika: c.ragamalika || undefined, tala: c.tala ? c.tala.name : '', composer: c.composer, language: c.language, deity: c.deity.length ? c.deity : undefined, url: c.url, updated: c.updated, lines: c.stats.lines, sections: c.sections.length, ok: c.stats.lines ? Math.round(100 * (c.stats.lines - c.stats.partial) / c.stats.lines) : null });

async function main(argv) {
  const arg = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
  const entries = arg('--cache') ? JSON.parse(readFileSync(arg('--cache'), 'utf8')) : await fetchFeed();
  if (arg('--save-feed')) writeFileSync(arg('--save-feed'), JSON.stringify(entries));
  const only = arg('--only');
  let comps = [];
  const seen = new Map();
  entries.forEach(e => {
    let c;
    try { c = parsePost(e); } catch (err) { console.error('Could not parse "' + e.title.$t + '": ' + err.message); return; }
    if (seen.has(c.id)) { const n = seen.get(c.id) + 1; seen.set(c.id, n); c.id += '-' + n; } else seen.set(c.id, 1);
    comps.push(c);
  });
  fillScales(comps, entries);
  applyConfirmedSlips(comps);
  // v0.9.3: the lesson books (data/lessons/, scripts/lessons.js); where a lesson is in several sources, the best is used
  const merged = mergeLessons(comps);
  comps = merged.comps;
  allowAnyaSwaras(comps);
  comps.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) || a.id.localeCompare(b.id));
  if (only) { const c = comps.find(x => x.id === only || x.title === only); console.log(JSON.stringify(c, null, 1)); return; }
  const T = comps.reduce((t, c) => { Object.keys(c.stats).forEach(k => { t[k] = (t[k] || 0) + c.stats[k]; }); return t; }, {});
  const withLines = comps.filter(c => c.stats.lines), clean = withLines.filter(c => c.stats.partial === 0);
  console.log(comps.length + ' compositions; ' + withLines.length + ' with swara lines (' + T.lines + ' lines: ' + T.full + ' fill whole cycles, ' + T.lead + ' lead-ins, ' + T.joined + ' in split lines that fill cycles, ' + T.link + ' short links, ' + T.tail + ' with an overlap cell, ' + T.partial + ' off the cycle; ' + T.fast4 + ' read with four-times groups); ' + (T.slips || 0) + ' typing slips in the octave marks corrected, in ' + withLines.filter(c => c.stats.slips).length + ' compositions; ' + clean.length + ' with every line on the cycle; ' + comps.filter(c => !c.tala).length + ' without a tala; ' + comps.filter(c => c.tala && c.tala.inferred).length + ' with the tala inferred.');
  if (argv.includes('--report')) comps.filter(c => c.stats.partial).sort((a, b) => b.stats.partial / b.stats.lines - a.stats.partial / a.stats.lines).forEach(c => console.log(c.stats.partial + '/' + c.stats.lines + '\t' + (c.tala ? c.tala.name + ' ×' + c.tala.unitsPerBeat : '-') + '\t' + c.title + (c.unknown ? '\t?' + c.unknown : '')));
  if (argv.includes('--report')) comps.filter(c => c.stats.slips).forEach(c => c.sections.forEach(s => s.lines.forEach(l => (l.fixed || []).forEach(x => console.log('corrected\t' + c.id + '\t' + x.why.join(',') + '\t' + x.was + '\t=> ' + l.cells[x.cell])))));
  if (argv.includes('--dry')) return;
  if (existsSync(join(OUT, 'c'))) rmSync(join(OUT, 'c'), { recursive: true });
  mkdirSync(join(OUT, 'c'), { recursive: true });
  comps.forEach(c => { const o = Object.assign({}, c); delete o.labels; writeFileSync(join(OUT, 'c', c.id + '.json'), JSON.stringify(o) + '\n'); });
  writeFileSync(join(OUT, 'index.json'), JSON.stringify({ source: SITE, sources: SOURCES, redirects: merged.redirects, count: comps.length, compositions: comps.map(summary) }) + '\n');
  console.log('Wrote data/repertoire/index.json and ' + comps.length + ' compositions in data/repertoire/c/.');
  // v0.9.4: the numbers in docs/repertoire-status.md
  (await import('./repertoire-stats.js')).writeStats();
  // v0.9.5: the octave review list
  (await import('./octave-review.js')).writeReview();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main(process.argv.slice(2)).catch(e => { console.error(e); process.exit(1); });
