/* Vocal Gym engine · sollukattu vocabulary
   Standard konnakol groups by length, dance sollus, spelling aliases, the strong and closing
   syllables the judge listens for, and a test for whether a phrase is idiomatic. */
const SOLLU = {
  1: [['tha'], ['dhi'], ['thom'], ['nam']],
  2: [['tha', 'ka'], ['ki', 'ta'], ['dhi', 'mi'], ['jho', 'nu']],
  3: [['tha', 'ki', 'ta'], ['tha', 'ka', 'jham'], ['tat', 'tai', 'tam']],
  4: [['tha', 'ka', 'dhi', 'mi'], ['tha', 'ka', 'jho', 'nu'], ['ki', 'ta', 'tha', 'ka'], ['tha', 'ri', 'ki', 'ta'], ['tai', 'ya', 'tai', 'ya'], ['tai', 'hat', 'tai', 'hi']],
  5: [['tha', 'dhi', 'gi', 'na', 'thom'], ['tha', 'ka', 'tha', 'ki', 'ta']],
  6: [['tha', 'ka', 'dhi', 'mi', 'tha', 'ka'], ['tha', 'ri', 'ki', 'ta', 'tha', 'ka']],
  7: [['tha', 'ka', 'dhi', 'mi', 'tha', 'ki', 'ta']],
  8: [['tha', 'ka', 'dhi', 'mi', 'tha', 'ka', 'jho', 'nu']],
  9: [['tha', 'ka', 'dhi', 'mi', 'tha', 'dhi', 'gi', 'na', 'thom']]
};
const ALIAS = { ta: 'tha', di: 'dhi', tom: 'thom', dhom: 'thom', thai: 'tai', tei: 'tai', jo: 'jho', dheem: 'dhim', dhin: 'dhim', din: 'dhim', ding: 'dhim', gin: 'gi', tham: 'tam', tak: 'tha' };
const norm = s => ALIAS[s] || s;
const KNOWN = new Set('tha ka ki dhi mi jho nu gi na thom nam jham tam tai ya hi ha hat tat dhit dhim ri ku lan gu ga num'.split(' '));
const HEAVY = new Set('tha dhi thom nam jham tam tai tat dhit dhim'.split(' '));
const CADENCE = new Set('thom nam jham tam tai dhit dhim dhi tat'.split(' '));
const LIB = (function () {
  const set = new Set(), suf = new Set();
  Object.keys(SOLLU).forEach(k => SOLLU[k].forEach(p => {
    const n = p.map(norm); set.add(n.join(' '));
    for (let i = 1; i < n.length - 1; i++) suf.add(n.slice(i).join(' '));
  }));
  return { set, suf };
})();
/* a unit is idiomatic if it is a library phrase, a yati-style suffix of one, or up to three library phrases joined */
function idiomatic(syls) {
  const s = syls.filter(x => x !== ',').map(norm);
  if (!s.length) return true;
  const key = s.join(' ');
  if (LIB.set.has(key) || LIB.suf.has(key)) return true;
  const memo = {};
  const seg = (i, k) => {
    if (i === s.length) return true;
    if (k === 0) return false;
    const id = i + ':' + k; if (id in memo) return memo[id];
    for (let L = 1; L <= 9 && i + L <= s.length; L++) if (LIB.set.has(s.slice(i, i + L).join(' ')) && seg(i + L, k - 1)) return (memo[id] = true);
    return (memo[id] = false);
  };
  return seg(0, 3);
}
function splitCompound(word) {
  const keys = Array.from(new Set(Array.from(KNOWN).concat(Object.keys(ALIAS)))).sort((a, b) => b.length - a.length);
  const dfs = i => {
    if (i === word.length) return [];
    for (const k of keys) if (word.startsWith(k, i)) { const r = dfs(i + k.length); if (r) return [k].concat(r); }
    return null;
  };
  const parts = dfs(0);
  return parts && parts.length > 1 ? parts : null;
}

export { SOLLU, ALIAS, norm, KNOWN, HEAVY, CADENCE, LIB, idiomatic, splitCompound };
