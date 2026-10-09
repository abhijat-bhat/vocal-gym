/* Text rendering for the command line: swaras with octave dots, and notation laid out by
   tala cycle, anga and akshara, the same layout the web demos use. */
import { mod12 } from '../engine/index.js';

const UP = { S: 'Ṡ', R: 'Ṙ', G: 'Ġ', M: 'Ṁ', P: 'Ṗ', D: 'Ḋ', N: 'Ṅ' };
const DOWN = { S: 'Ṣ', R: 'Ṛ', M: 'Ṃ', D: 'Ḍ', N: 'Ṇ' };
const SUB = { 1: '₁', 2: '₂', 3: '₃' };

/* p is semitones above Sa; tara swaras get a dot above, mandra swaras a dot below */
export function swara(raga, p, numbers) {
  const pc = mod12(p), oct = Math.floor(p / 12), lab = raga.labels[pc] || '?', L = lab[0];
  let ch = L;
  if (oct > 0) ch = UP[L] || L + '̇';
  if (oct < 0) ch = DOWN[L] || L + '̣';
  if (numbers && lab.length > 1) ch += SUB[lab[1]] || lab[1];
  return ch;
}

export function scale(raga, arr) { return arr.map(p => swara(raga, p, true)).join(' '); }

/* cells: one string per slot. per: slots per akshara. offset: empty slots before the first cell. */
export function layout(cells, tl, per, offset = 0) {
  const all = new Array(offset).fill('·').concat(cells);
  const cyc = tl.total * per, out = [];
  for (let start = 0; start < all.length; start += cyc) {
    let pos = start; const angas = [];
    for (const a of tl.angas) {
      const aks = [];
      for (let k = 0; k < a.len && pos < all.length; k++) {
        const slot = []; for (let s = 0; s < per && pos < all.length; s++) slot.push(all[pos++]);
        aks.push(slot.join(' '));
      }
      if (aks.length) angas.push(aks.join(per > 1 ? '  ' : ' '));
    }
    out.push(angas.join(' | ') + (pos - start === cyc ? ' ||' : ''));
  }
  return out.join('\n');
}

export function noteCells(raga, notes, numbers) {
  const cells = [];
  notes.forEach(n => { cells.push(swara(raga, n.p, numbers)); for (let i = 1; i < n.dur; i++) cells.push(','); });
  return cells;
}

export function angaText(tl) {
  return tl.angas.map(a => a.type === 'L' ? '|' + a.len : a.type === 'O' ? 'O' : a.type === 'U' ? 'U' : String(a.len)).join(' ');
}
