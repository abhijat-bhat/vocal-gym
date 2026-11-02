/* Vocal Gym · reading the notation tables of carnaticnotations.blogspot.com (scripts/import-repertoire.js)
   The site's posts are Google Docs tables pasted into Blogger: one <table> per composition (a few have two or
   three), rows of <td> cells holding <p> paragraphs of <span> runs. This module turns a post's HTML into a
   plain grid, with no dependencies (the markup is regular enough for a small tokenizer):
     tables(html) → [{ rows: [[cell]] }]
     cell         { text, paras: [[{ text, u }]], col, span, rowspan, origin }
   Each row is laid out on the table's column grid: a cell spanning columns or rows appears once, at its first
   column and row (origin: true), and as a copy (origin: false) in the other positions it covers, so every row has
   one entry per column. A run's u is true when it is underlined: in the site's notation an underlined group
   of swaras is sung at twice the speed of the plain ones around it. Text keeps the site's octave marks:
   ’ after a swara for the upper octave and ‘ before it for the lower. */

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'", rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', ndash: '–', mdash: '—' };
export function decode(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+\d*);/gi, (m, e) => {
    if (e[0] === '#') { const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return n === 160 ? ' ' : String.fromCodePoint(n); }
    return ENT[e.toLowerCase()] != null ? ENT[e.toLowerCase()] : m;
  }).replace(/\u00a0/g, ' ');
}
const attr = (tag, name) => { const m = new RegExp('\\b' + name + '\\s*=\\s*("([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i').exec(tag); return m ? (m[2] != null ? m[2] : m[3] != null ? m[3] : m[4]) : null; };
const underlined = style => /text-decoration(-line)?\s*:\s*[^;]*underline/i.test(style || '');

/* the runs of one cell's HTML, split into paragraphs at <p>, <div>, <br> and <li> */
function cellParas(html) {
  const paras = [[]], stack = [];   // stack: whether each open element underlines
  const re = /<\/?([a-z0-9]+)\b[^>]*>|[^<]+/gi;
  let m;
  const brk = () => { if (paras[paras.length - 1].length) paras.push([]); };
  while ((m = re.exec(html))) {
    const tok = m[0];
    if (tok[0] !== '<') {
      const text = decode(tok);
      if (text) paras[paras.length - 1].push({ text, u: stack.some(Boolean) });
      continue;
    }
    const name = m[1].toLowerCase(), close = tok[1] === '/';
    if (name === 'br') { brk(); continue; }
    if (['p', 'div', 'li', 'h1', 'h2', 'h3', 'h4'].includes(name)) brk();
    if (['span', 'u', 'a', 'b', 'i', 'em', 'strong', 'font', 's', 'sup', 'sub'].includes(name)) {
      if (close) stack.pop();
      else if (!tok.endsWith('/>')) stack.push(name === 'u' || underlined(attr(tok, 'style')));
    }
  }
  return paras.map(p => p.reduce((out, r) => {   // merge neighbouring runs with the same underline
    const last = out[out.length - 1];
    if (last && last.u === r.u) last.text += r.text; else out.push({ text: r.text, u: r.u });
    return out;
  }, [])).filter(p => p.some(r => r.text.trim()));
}

export function tables(html) {
  const out = [];
  const re = /<table\b[\s\S]*?<\/table>/gi;
  let m;
  while ((m = re.exec(html))) out.push(grid(m[0]));
  return out;
}

function grid(tableHtml) {
  const rows = [], pending = [];   // pending[col] = { cell, left } for cells spanning rows below
  const trs = tableHtml.match(/<tr\b[\s\S]*?<\/tr>/gi) || [];
  trs.forEach(tr => {
    const row = [];
    let col = 0;
    const place = () => { while (pending[col] && pending[col].left > 0) { const p = pending[col]; row[col] = Object.assign({}, p.cell, { origin: false }); p.left--; col++; } };
    const tds = tr.match(/<t[dh]\b[^>]*>[\s\S]*?<\/t[dh]>/gi) || [];
    tds.forEach(td => {
      place();
      const open = td.slice(0, td.indexOf('>') + 1), inner = td.slice(open.length, td.lastIndexOf('<'));
      const span = Math.max(1, parseInt(attr(open, 'colspan') || '1', 10) || 1), rowspan = Math.max(1, parseInt(attr(open, 'rowspan') || '1', 10) || 1);
      const paras = cellParas(inner);
      const cell = { text: paras.map(p => p.map(r => r.text).join('')).join('\n').replace(/[ \t]+/g, ' ').trim(), paras, col, span, rowspan, origin: true };
      for (let k = 0; k < span; k++) {
        row[col + k] = k ? Object.assign({}, cell, { origin: false }) : cell;
        if (rowspan > 1) pending[col + k] = { cell, left: rowspan - 1 };
      }
      col += span;
    });
    place();
    rows.push(row);
  });
  const width = Math.max(0, ...rows.map(r => r.length));
  rows.forEach(r => { for (let c = 0; c < width; c++) if (!r[c]) r[c] = { text: '', paras: [], col: c, span: 1, rowspan: 1, origin: true, filler: true }; });
  return { rows, width };
}
