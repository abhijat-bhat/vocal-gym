/* Vocal Gym engine · talas
   The 35 suladi talas (7 families x 5 jatis), the chapu talas used in dance, and custom talas.
   A tala is a list of angas with lengths in aksharas. */

const FAM = { dhruva: 'LOLL', matya: 'LOL', rupaka: 'OL', jhampa: 'LUO', triputa: 'LOO', ata: 'LLOO', eka: 'L' };
const DEFJ = { dhruva: 4, matya: 4, rupaka: 4, jhampa: 7, triputa: 3, ata: 5, eka: 4 };
const JATI = { 3: 'Tisra', 4: 'Chatusra', 5: 'Khanda', 7: 'Misra', 9: 'Sankeerna' };
const CHAPU = { 3: [1, 2], 5: [2, 3], 7: [3, 2, 2] };
function tala(fam, L) {
  if (fam === 'chapu') {
    if (!CHAPU[L]) throw new Error('Chapu talas are Tisra (3), Khanda (5) and Misra (7); got ' + L + '.');
    const parts = CHAPU[L], total = parts.reduce((a, b) => a + b, 0);
    return { fam, L: total, angas: parts.map(len => ({ type: 'C', len })), total, name: JATI[total] + ' Chapu' };
  }
  if (!FAM[fam]) throw new Error('Unknown tala family "' + fam + '". Use one of ' + Object.keys(FAM).join(', ') + ' or chapu.');
  if (!JATI[L]) throw new Error('The jati (laghu length) must be 3, 4, 5, 7 or 9; got ' + L + '.');
  const angas = FAM[fam].split('').map(a => ({ type: a, len: a === 'L' ? L : a === 'O' ? 2 : 1 }));
  const total = angas.reduce((s, a) => s + a.len, 0);
  let name = JATI[L] + ' jati ' + fam[0].toUpperCase() + fam.slice(1);
  if (fam === 'triputa' && L === 4) name += ' (Adi)';
  return { fam, L, angas, total, name };
}
function customTala(parts) {
  const total = parts.reduce((a, b) => a + b, 0);
  return { fam: 'custom', L: total, angas: parts.map(len => ({ type: 'C', len })), total, name: 'Custom ' + parts.join('+') };
}
function angaStarts(tl) { const s = new Set([0]); let c = 0; tl.angas.forEach(a => { c += a.len; s.add(c); }); return s; }

export { FAM, DEFJ, JATI, CHAPU, tala, customTala, angaStarts };
