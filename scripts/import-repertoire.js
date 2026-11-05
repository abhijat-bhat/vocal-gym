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
import { tables } from './repertoire-html.js';
import { parseCell, cellUnits, talaOf, bestUnits, rowFits } from '../src/engine/repertoire.js';
import { melaLabels, MELA_NAMES, JANYA } from '../src/engine/ragas.js';

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
/* "kalyANi - S R2 G3 M2 P D2 N3 S’ - S’ N3 D2 P M2 G3 R2 S (65th mELakartha)" → { name, aro, avaro, note } */
export function scaleRow(text) {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!/\b[RGMDN][1-3]\b/.test(t)) return null;
  const parts = t.split(/\s+[-–—]\s+|\s*:\s+/);
  const isScale = p => { const q = p.replace(/\(.*?\)/g, '').trim(); const toks = q.match(SCALE_TOK) || []; return toks.length >= 4 && q.replace(SCALE_TOK, '').replace(/[\s,]/g, '') === '' && /[RGMDN][1-3]/.test(q); };
  const idx = parts.map((p, i) => isScale(p) ? i : -1).filter(i => i >= 0);
  if (!idx.length) return null;
  const toList = p => (p.replace(/\(.*?\)/g, '').match(SCALE_TOK) || []).map(x => { const m = /^(‘?)([SRGMPDN][1-3]?)([’']?)$/.exec(x); return m[2] + (m[3] ? "'" : '') + (m[1] ? '.' : ''); });
  const aro = toList(parts[idx[0]]), avaro = idx[1] != null ? toList(parts[idx[1]]) : aro.slice().reverse();
  const name = parts.slice(0, idx[0]).join(' - ').trim();
  const note = parts.slice((idx[1] != null ? idx[1] : idx[0]) + 1).join(' - ').trim() + ((parts[idx[1] != null ? idx[1] : idx[0]].match(/\((.*?)\)/) || [])[1] ? ' ' + parts[idx[1] != null ? idx[1] : idx[0]].match(/\((.*?)\)/)[1] : '');
  return { name, aro, avaro, note: note.trim() };
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

/* ---------- one post ---------- */
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
  let raga = null, sec = null;
  const newSection = (title, lyrics) => { sec = { title: title || '', lyrics: lyrics || [], raga: raga ? ragas.indexOf(raga) : null, lines: [] }; sections.push(sec); return sec; };
  const bad = new Set();

  tables(html).forEach(tb => {
    const W = tb.width;
    // is the first column a label column (empty, or numbers, beside the swaras)?
    const multi = tb.rows.filter(r => r.filter(c => c.origin && c.text).length >= 2 || r.some(c => c.origin && c.col > 0 && swaraish(c.text)));
    const labelCol = W >= 2 && multi.length > 0 && multi.filter(r => isLabel(r[0].text) || !r[0].origin).length >= multi.length * 0.6 && multi.some(r => r.slice(1).some(c => swaraish(c.text)));
    let block = [];   // the swara lines waiting for their sahitya
    tb.rows.forEach(row => {
      stats.rows++;
      const origins = row.filter(c => c.origin && !c.filler && c.text);
      const wide = origins.length === 1 && origins[0].span >= Math.max(1, W - (labelCol ? 1 : 0)) || (origins.length === 1 && W === 1);
      const content = row.slice(labelCol ? 1 : 0);
      const text = row.map(c => c.origin ? c.text : '').join(' ').trim();
      if (!text) return;
      // a heading row: the scale, or a section with its lyrics
      // (a lone narrow cell of words just under swara lines is their sahitya, not a heading)
      if (wide || (origins.length === 1 && !swaraish(origins[0].text) && !block.length)) {
        const cell = origins[0];
        const sc = scaleRow(cell.paras.length ? cell.paras[0].map(r => r.text).join('') : cell.text);
        if (sc) {
          raga = sc; ragas.push(sc);
          const rest = cell.paras.slice(1).map(p => p.map(r => r.text).join('').trim()).filter(Boolean);
          if (sec && !sec.lines.length && sec.raga == null) sec.raga = ragas.length - 1;
          if (rest.length) newSection('', rest);
          block = [];
          return;
        }
        if (swaraish(cell.text) && cell.text.replace(/[\s,]/g, '').length) { /* a full-width swara row: fall through */ }
        else {
          const paras = cell.paras.map(p => p.map(r => r.text).join('').replace(/\s+/g, ' ').trim()).filter(Boolean);
          const head = paras[0] || '';
          const m = /^([^-–:]{1,40}?)\s*(?:[-–:]\s+|$)(.*)$/.exec(head);
          // a section's name ("pallavi - its words", "chittaswaram"), not the first line of the words
          const named = m && SECTION_WORD.test(m[1]);
          const looksTitle = m && (named || (m[2] && m[1].split(/\s+/).length <= 3));
          newSection(looksTitle ? m[1].trim() : '', (looksTitle ? (m[2] ? [m[2]] : []) : [head]).concat(paras.slice(1)));
          block = [];
          return;
        }
      }
      const cells = content.filter((c, i) => c.origin || i === 0);
      const swaraRow = content.some(c => c.origin && swaraish(c.text)) && content.every(c => !c.origin || !c.text || swaraish(c.text) || isLabel(c.text));
      if (swaraRow) {
        if (!sec) newSection('', []);
        const label = labelCol && row[0].origin && row[0].text.trim() ? row[0].text.trim() : undefined;
        const parsed = content.map(c => c.origin ? (c.paras.length ? swaraCell(c.paras.flat()) : { text: '', units: 0, bad: [], cols: [], slips: [], was: '' }) : null).filter(Boolean);
        parsed.forEach(p => p.bad.forEach(ch => bad.add(ch)));
        stats.badChars += parsed.reduce((a, p) => a + p.bad.length, 0);
        // leading empty cells mark a lead-in; trailing ones are dropped
        let lead = 0; while (lead < parsed.length && !parsed[lead].text) lead++;
        let end = parsed.length; while (end > lead && !parsed[end - 1].text) end--;
        const used = parsed.slice(lead, end);
        const line = { cells: used.map(p => p.text) };
        if (label) line.label = label;
        const fixed = used.map((p, k) => p.slips.length ? { cell: k, was: p.was, why: Array.from(new Set(p.slips)) } : null).filter(Boolean);
        if (fixed.length) { line.fixed = fixed; stats.slips = (stats.slips || 0) + used.reduce((n, p) => n + p.slips.length, 0); }
        if (lead) line.leadCells = lead;
        line._cols = used.map(p => p.cols); line._colIdx = content.map((c, i) => c.origin ? i : -1).filter(i => i >= 0).slice(lead, end);
        sec.lines.push(line); block.push(line);
        stats.lines++;
        return;
      }
      // sahitya: give each line of the block above its syllables
      if (block.length) {
        const sah = content;
        block.forEach(line => {
          const syl = [];
          line._colIdx.forEach((ci, k) => {
            const c = sah[ci];
            if (c && c.origin && c.paras.length) sahityaOf(line._cols[k], c.paras.flat(), k).forEach(s => syl.push(s));
          });
          if (syl.length) { line.syl = syl; stats.sahitya++; }
        });
        block = [];
      } else if (sec && text) {
        sec.lyrics.push(text.replace(/\s+/g, ' '));
      }
    });
  });

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
  // the main raga: the first scale row, named as the labels name it
  const main = ragas[0] || null;
  const nice = n => { const k = key(n); return labels.find(l => key(l) === k) || labels.find(l => k && key(l).startsWith(k)) || n; };
  const typeLabel = labels.map(l => TYPE[l]).filter(Boolean).sort((a, b) => TYPE_ORDER.indexOf(a) - TYPE_ORDER.indexOf(b));
  const type = typeLabel.find(t => t !== 'Talamalika') || (parts.find(p => /varnam/i.test(p)) ? 'Varnam' : labels.includes('Ragamalika') && !typeLabel.length ? 'Krithi' : typeLabel[0] || (lines.length ? 'Krithi' : 'Other'));
  const ragaName = main ? nice(main.name.replace(/\s*\(.*$/, '')) : (parts[1] || '');
  const composerPart = parts.length >= 3 ? parts[parts.length - 1] : '';
  const known = new Set(Object.keys(TYPE).concat(Object.keys(LANG), DEITY, ['Ragamalika']));
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
    const k = key(r.name.replace(/\s*\(.*$/, '')); if (!k) return;
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

const summary = c => ({ id: c.id, title: c.title, name: c.name, type: c.type, raga: c.raga, ragamalika: c.ragamalika || undefined, tala: c.tala ? c.tala.name : '', composer: c.composer, language: c.language, deity: c.deity.length ? c.deity : undefined, url: c.url, updated: c.updated, lines: c.stats.lines, sections: c.sections.length, ok: c.stats.lines ? Math.round(100 * (c.stats.lines - c.stats.partial) / c.stats.lines) : null });

async function main(argv) {
  const arg = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
  const entries = arg('--cache') ? JSON.parse(readFileSync(arg('--cache'), 'utf8')) : await fetchFeed();
  if (arg('--save-feed')) writeFileSync(arg('--save-feed'), JSON.stringify(entries));
  const only = arg('--only');
  const comps = [], seen = new Map();
  entries.forEach(e => {
    let c;
    try { c = parsePost(e); } catch (err) { console.error('Could not parse "' + e.title.$t + '": ' + err.message); return; }
    if (seen.has(c.id)) { const n = seen.get(c.id) + 1; seen.set(c.id, n); c.id += '-' + n; } else seen.set(c.id, 1);
    comps.push(c);
  });
  fillScales(comps, entries);
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
  writeFileSync(join(OUT, 'index.json'), JSON.stringify({ source: SITE, count: comps.length, compositions: comps.map(summary) }) + '\n');
  console.log('Wrote data/repertoire/index.json and ' + comps.length + ' compositions in data/repertoire/c/.');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main(process.argv.slice(2)).catch(e => { console.error(e); process.exit(1); });
