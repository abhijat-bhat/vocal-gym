import { CHAKRA, MELA_NAMES, melaLabels, melakarta, JANYA } from './ragas.js';
// the explorer page reads these from this module (the app loads it alone)
export { CHAKRA, MELA_NAMES };

/* Vocal Gym engine · the melakarta and katapayadi explorer (v0.8.7, docs/research/melakarta-katapayadi.md)
   Sources, read 2026-11-02:
     [K] Wikipedia, "Katapayadi system", https://en.wikipedia.org/wiki/Katapayadi_system
     [M] Wikipedia, "Melakarta", https://en.wikipedia.org/wiki/Melakarta
   katapayadi(text)      a word decoded syllable by syllable: each syllable's counted consonant and digit, the
                         first two digits reversed into a number, and, for plain-letter input, the other readings
                         its ambiguous letters allow (t may be ṭ, n may be ṇ, sh may be ś or ṣ)
   melaName(n)           how mela n's name gives its number: the stated rule, a convention the name needs, or an
                         exception the sources note
   melakartaInfo(n)      the mela: its swaras worked out from the number, its chakra (and the number the chakra's
                         name stands for), its katapayadi reading, its chakra siblings, its twin across the
                         madhyamas and the engine's janyas of it
   melaFromSwaras(sel)   the mela number of a choice of R, G, M, D and N, or why the choice is not a melakarta
   katapayadiLetters(n)  the consonants a name for mela n may begin with
   Pure and deterministic; no raga facts beyond [K], [M] and ragas.js. */

// [K]: the consonants and their digits (ḷa has no digit there, and kṣa is not mentioned)
export const KATAPAYADI = {
  k: 1, kh: 2, g: 3, gh: 4, 'ṅ': 5, c: 6, ch: 7, j: 8, jh: 9, 'ñ': 0,
  'ṭ': 1, 'ṭh': 2, 'ḍ': 3, 'ḍh': 4, 'ṇ': 5, t: 6, th: 7, d: 8, dh: 9, n: 0,
  p: 1, ph: 2, b: 3, bh: 4, m: 5,
  y: 1, r: 2, l: 3, v: 4, 'ś': 5, 'ṣ': 6, s: 7, h: 8
};
// [M]: what each chakra's name stands for, and so its number
export const CHAKRA_MEANING = [
  'the moon, of which there is one', 'the eyes, of which there are two', 'the three sacred fires', 'the four Vedas',
  'the five arrows of Manmatha', 'the six seasons', 'the seven sages', 'the eight Vasus', 'Brahma, of which there are nine',
  'the ten directions', 'the eleven Rudras', 'the twelve Adityas'
];
/* the 72 names in IAST, in the engine's order (ragas.js), after [M]'s table; where [M] writes a sibilant that
   cannot give the name's number (Śanmukhapriyā, Riśabhapriyā) or an aspirate for a plain stop
   (Dhāthuvardhani), the Sanskrit spelling is used: Ṣaṇmukhapriyā (ṣaṇ, six), Riṣabhapriyā, Dhātuvardhanī */
export const MELA_IAST = ['Kanakāṅgī', 'Ratnāṅgī', 'Gānamūrti', 'Vanaspati', 'Mānavatī', 'Tānarūpī', 'Senāvatī', 'Hanumatoḍī', 'Dhenukā', 'Nāṭakapriyā',
  'Kokilapriyā', 'Rūpavatī', 'Gāyakapriyā', 'Vakuḷābharaṇam', 'Māyāmāḷavagauḷa', 'Cakravākam', 'Sūryakāntam', 'Hāṭakāmbarī', 'Jhaṅkāradhvani', 'Naṭabhairavī',
  'Kīravāṇī', 'Kharaharapriyā', 'Gaurīmanoharī', 'Varuṇapriyā', 'Mārarañjanī', 'Cārukeśī', 'Sarasāṅgī', 'Harikāmbhojī', 'Dhīraśaṅkarābharaṇam', 'Nāganandinī',
  'Yāgapriyā', 'Rāgavardhanī', 'Gāṅgeyabhūṣaṇī', 'Vāgadhīśvarī', 'Śūlinī', 'Calanāṭa', 'Sālagam', 'Jalārṇavam', 'Jhālavarāḷī', 'Navanītam',
  'Pāvanī', 'Raghupriyā', 'Gavāmbhodhī', 'Bhavapriyā', 'Śubhapantuvarāḷī', 'Ṣaḍvidhamārgiṇī', 'Suvarṇāṅgī', 'Divyamaṇi', 'Dhavaḷāmbarī', 'Nāmanārāyaṇī',
  'Kāmavardhanī', 'Rāmapriyā', 'Gamanāśramā', 'Viśvambharī', 'Śāmalāṅgī', 'Ṣaṇmukhapriyā', 'Siṃhendramadhyamam', 'Hemavatī', 'Dharmavatī', 'Nītimatī',
  'Kāntāmaṇi', 'Riṣabhapriyā', 'Latāṅgī', 'Vācaspati', 'Mecakalyāṇī', 'Citrāmbarī', 'Sucaritrā', 'Jyotisvarūpiṇī', 'Dhātuvardhanī', 'Nāsikābhūṣaṇī',
  'Kosalam', 'Rasikapriyā'];
// [K] notes this one: "the name should be written as Sihmendramadhyamam (as in the case of Brahmana in Sanskrit)"
const NOTED = { 57: { spelling: 'Sihmendramadhyamam', text: 'The Katapayadi source notes that the name as written gives 87, and that it is believed the name should be written Sihmendramadhyamam (as Brahmana is in Sanskrit): si 7, hma counts m 5, so 57.' } };

/* ---------- reading letters ---------- */
const VOWELS = ['ai', 'au', 'ā', 'ī', 'ū', 'ṛ', 'ṝ', 'a', 'i', 'u', 'e', 'o'];
const CONS_IAST = ['kh', 'gh', 'ch', 'jh', 'ṭh', 'ḍh', 'th', 'dh', 'ph', 'bh', 'k', 'g', 'ṅ', 'c', 'j', 'ñ', 'ṭ', 'ḍ', 'ṇ', 't', 'd', 'n', 'p', 'b', 'm', 'y', 'r', 'l', 'ḷ', 'v', 'w', 'ś', 'ṣ', 's', 'h'];
const MARKS = ['ṃ', 'ṁ', 'ḥ'];
// plain letters (no diacritics): the common English spellings of raga names
const ASCII_MAP = [['chh', 'ch'], ['ch', 'c'], ['sh', 'ś'], ['ee', 'ī'], ['oo', 'ū'], ['aa', 'ā'], ['ou', 'au'], ['ow', 'au'], ['w', 'v']];
// in plain letters these could be another consonant: [as read, the other reading]
const ASCII_ALT = { t: 'ṭ', th: 'ṭh', d: 'ḍ', dh: 'ḍh', n: 'ṇ', 'ś': 'ṣ', l: 'ḷ' };
const isPlain = s => /^[\x00-\x7f]*$/.test(s);

function tokens(text, plain) {
  let s = String(text).normalize('NFC').toLowerCase();
  if (plain) {
    // map the English spellings to IAST letters, longest first, outside the letters already mapped
    let out = '';
    for (let i = 0; i < s.length;) {
      const m = ASCII_MAP.find(([a]) => s.startsWith(a, i));
      if (m) { out += m[1]; i += m[0].length; } else { out += s[i]; i++; }
    }
    s = out;
  }
  const t = [];
  for (let i = 0; i < s.length;) {
    const v = VOWELS.find(x => s.startsWith(x, i));
    if (v) { t.push({ k: 'V', s: v }); i += v.length; continue; }
    const c = CONS_IAST.find(x => s.startsWith(x, i));
    if (c) { t.push({ k: 'C', s: c === 'w' ? 'v' : c }); i += c.length; continue; }
    if (MARKS.includes(s[i])) { t.push({ k: 'M', s: s[i] }); i++; continue; }
    if (/[a-zA-ZÀ-ỿ]/.test(s[i])) t.push({ k: 'X', s: s[i] });   // a letter with no place in the scheme
    else t.push({ k: 'B' });   // a space, hyphen or other break
    i++;
  }
  return t;
}
/* the syllables: each vowel with the consonants before it (since the last vowel); a consonant with no vowel
   after it is ignored [K] */
function syllablesOf(text, plain) {
  const out = [];
  let cl = [], unknown = [];
  tokens(text, plain).forEach(tk => {
    if (tk.k === 'C') cl.push(tk.s);
    else if (tk.k === 'V') { out.push({ cluster: cl, vowel: tk.s, text: cl.join('') + tk.s }); cl = []; }
    else if (tk.k === 'X') unknown.push(tk.s);
    else if (tk.k === 'B') cl = [];
  });
  return { syl: out, unknown };
}
/* the counted consonant of a syllable. 'strict': the last of the consonants [K]. 'phala': a ya, ra or va
   written beneath a consonant (kra, tra, jyo, vya, śva) and a repha (rma, rya) are passed over, and the main
   consonant counts: a reading some melakarta names need (see melaName) that [K] does not state */
function counted(cluster, reading) {
  let c = cluster.slice();
  if (reading === 'phala') {
    if (c.length > 1 && c[0] === 'r') c = c.slice(1);
    while (c.length > 1 && ['y', 'r', 'v'].includes(c[c.length - 1])) c = c.slice(0, -1);
  }
  return c.length ? c[c.length - 1] : null;
}
const digitOf = c => c == null ? 0 : KATAPAYADI[c] == null ? null : KATAPAYADI[c];
const numberOf = ds => ds.length < 2 || ds[0] == null || ds[1] == null ? null : ds[1] * 10 + ds[0];

/* text → { input, plain, syllables: [{ text, letter, digit, alt? }], digits, number (first two, reversed),
   phala: { number, syllables } when that reading differs, alternatives: other numbers plain letters allow } */
export function katapayadi(text, opts = {}) {
  const input = String(text == null ? '' : text).trim().slice(0, 200);
  if (!input) return { error: 'Give a word to decode.' };
  const plain = opts.plain != null ? !!opts.plain : isPlain(input);
  const { syl, unknown } = syllablesOf(input, plain);
  if (!syl.length) return { error: 'No syllables found in "' + input + '".' };
  const read = reading => syl.map(s => {
    const letter = counted(s.cluster, reading), digit = digitOf(letter);
    const o = { text: s.text, letter: letter || '(vowel)', digit };
    if (plain && letter && ASCII_ALT[letter] !== undefined) { const a = ASCII_ALT[letter]; o.alt = { letter: a, digit: KATAPAYADI[a] == null ? null : KATAPAYADI[a] }; }
    return o;
  });
  const syllables = read('strict'), digits = syllables.map(s => s.digit), number = numberOf(digits);
  const ph = read('phala'), phNumber = numberOf(ph.map(s => s.digit));
  const res = { input, plain, syllables, digits, number, reversed: digits.slice(0, 2).reverse(), unknown };
  if (phNumber !== number) res.phala = { number: phNumber, syllables: ph.slice(0, 2) };
  // the other numbers the plain spelling allows, from the first two syllables' ambiguous letters
  if (plain) {
    const opts2 = syllables.slice(0, 2).map(s => [s.digit].concat(s.alt && s.alt.digit != null ? [s.alt.digit] : []));
    const alts = new Set();
    if (opts2.length === 2) opts2[0].forEach(a => opts2[1].forEach(b => { if (a != null && b != null) alts.add(b * 10 + a); }));
    alts.delete(number);
    res.alternatives = Array.from(alts).sort((a, b) => a - b);
  }
  if (syllables.slice(0, 2).some(s => s.digit == null)) res.note = 'A letter in the first two syllables has no digit in the scheme (ḷa is used in katapayadi works, but the source gives it no digit).';
  return res;
}

/* how mela n's name gives n: { n, name, iast, reading: 'rule' | 'phala' | 'exception', number (the stated
   rule's), phalaNumber, syllables (the first two, as read), note } */
export function melaName(n) {
  n = Number(n);
  if (!(Number.isInteger(n) && n >= 1 && n <= 72)) return { error: 'A melakarta number is 1 to 72.' };
  const iast = MELA_IAST[n - 1], k = katapayadi(iast, { plain: false });
  const out = { n, name: MELA_NAMES[n - 1], iast, number: k.number, digits: k.digits.slice(0, 2), syllables: k.syllables.slice(0, 2) };
  if (k.number === n) return Object.assign(out, { reading: 'rule', note: 'The first two syllables give ' + k.digits[0] + ' and ' + k.digits[1] + '; reversed, ' + n + '.' });
  if (k.phala && k.phala.number === n) {
    const s = k.phala.syllables, w = k.syllables.findIndex((x, i) => x.letter !== s[i].letter), x = k.syllables[w];
    return Object.assign(out, { reading: 'phala', phalaNumber: n, syllables: s, digits: s.map(y => y.digit),
      note: 'The stated rule counts the last consonant of "' + x.text + '" (' + x.letter + ', ' + x.digit + ') and gives ' + k.number + '. The name gives ' + n + ' only if the ' + x.letter + ' written beneath ' + s[w].letter + ' is passed over and the main consonant ' + s[w].letter + ' counts (' + s[w].digit + '): a convention this name needs that the Katapayadi source does not state.' });
  }
  const noted = NOTED[n];
  if (noted) { const alt = katapayadi(noted.spelling, { plain: false }); return Object.assign(out, { reading: 'exception', spelling: noted.spelling, spellingNumber: alt.number, note: noted.text }); }
  return Object.assign(out, { reading: 'exception', note: 'Its first two syllables give ' + k.digits[0] + ' and ' + k.digits[1] + ', so ' + k.number + ', not ' + n + ': ' + n + ' needs ' + (n % 10) + ' then ' + Math.floor(n / 10) + ', and no reading of "' + k.syllables[0].text + '" and "' + k.syllables[1].text + '" gives them. The sources read do not explain this name.' });
}

const RG_OF = [['R1', 'G1'], ['R1', 'G2'], ['R1', 'G3'], ['R2', 'G2'], ['R2', 'G3'], ['R3', 'G3']];
const DN_OF = [['D1', 'N1'], ['D1', 'N2'], ['D1', 'N3'], ['D2', 'N2'], ['D2', 'N3'], ['D3', 'N3']];
const SEMI = { R1: 1, R2: 2, R3: 3, G1: 2, G2: 3, G3: 4, D1: 8, D2: 9, D3: 10, N1: 9, N2: 10, N3: 11 };

/* mela n, worked out from its number [K]: the madhyama from the half, then (n − 1, less 36 in the second half)
   ÷ 6: the quotient gives R and G (the chakra), the remainder D and N (the place in the chakra) */
export function melakartaInfo(n) {
  n = Number(n);
  if (!(Number.isInteger(n) && n >= 1 && n <= 72)) return { error: 'A melakarta number is 1 to 72.' };
  const r = melakarta(n), prati = n > 36, k = (prati ? n - 36 : n) - 1, q = Math.floor(k / 6), rem = k % 6, ci = Math.floor((n - 1) / 6);
  const labels = melaLabels(n), M = prati ? 'M2' : 'M1';
  const steps = [
    'Mela ' + n + ' is in the ' + (prati ? 'second half (37–72), so its madhyama is the prati madhyama, M2' : 'first half (1–36), so its madhyama is the shuddha madhyama, M1') + '.',
    (prati ? n + ' − 36 = ' + (n - 36) + '; ' : '') + ((prati ? n - 36 : n)) + ' − 1 = ' + k + '; ' + k + ' ÷ 6 = ' + q + ', remainder ' + rem + '.',
    'The quotient ' + q + ' gives ' + RG_OF[q].join(' ') + ': every mela of chakra ' + (ci + 1) + ' (' + CHAKRA[ci] + ') has them.',
    'The remainder ' + rem + ' gives ' + DN_OF[rem].join(' ') + ': the ' + ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'][rem] + ' of the six D and N pairs, as the mela is the ' + ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'][rem] + ' of its chakra.',
    'So ' + r.name + ' is S ' + RG_OF[q].join(' ') + ' ' + M + ' P ' + DN_OF[rem].join(' ') + " S'."
  ];
  const twin = prati ? n - 36 : n + 36;
  return {
    n, id: r.id, name: r.name, iast: MELA_IAST[n - 1], labels, pitches: r.aro.slice(0, 7), aro: r.aro, avaro: r.avaro,
    madhyama: M, half: prati ? 'prati' : 'shuddha', quotient: q, remainder: rem, rg: RG_OF[q], dn: DN_OF[rem],
    chakra: { index: ci + 1, name: CHAKRA[ci], meaning: CHAKRA_MEANING[ci], stands: ci + 1, members: Array.from({ length: 6 }, (_, j) => ci * 6 + j + 1) },
    twin: { n: twin, name: MELA_NAMES[twin - 1] },
    katapayadi: melaName(n),
    janyas: JANYA.filter(j => j.parent === n).map(j => ({ id: j.id, name: j.name, aro: j.aro, avaro: j.avaro, labels: j.labels })),
    steps
  };
}

/* { R, G, M, D, N } (e.g. R2 G3 M1 D2 N3) → { n, name } or { error } */
export function melaFromSwaras(sel = {}) {
  const want = { R: ['R1', 'R2', 'R3'], G: ['G1', 'G2', 'G3'], M: ['M1', 'M2'], D: ['D1', 'D2', 'D3'], N: ['N1', 'N2', 'N3'] };
  for (const k of Object.keys(want)) if (!want[k].includes(sel[k])) return { error: 'Choose ' + k + ' as one of ' + want[k].join(', ') + '.' };
  const q = RG_OF.findIndex(x => x[0] === sel.R && x[1] === sel.G), rem = DN_OF.findIndex(x => x[0] === sel.D && x[1] === sel.N);
  const why = (a, b) => SEMI[a] === SEMI[b] ? a + ' and ' + b + ' are the same pitch (' + SEMI[a] + ' semitones above Sa), so the scale would have six swaras, not seven' : a + ' (' + SEMI[a] + ') is above ' + b + ' (' + SEMI[b] + '), and a melakarta keeps its swaras in order';
  if (q < 0) return { error: 'No melakarta has ' + sel.R + ' with ' + sel.G + ': ' + why(sel.R, sel.G) + '.' };
  if (rem < 0) return { error: 'No melakarta has ' + sel.D + ' with ' + sel.N + ': ' + why(sel.D, sel.N) + '.' };
  const n = (sel.M === 'M2' ? 36 : 0) + q * 6 + rem + 1;
  return { n, name: MELA_NAMES[n - 1] };
}

/* the consonants a name for mela n may begin with: its first syllable must give n's units digit and its
   second n's tens digit (the digits are read in reverse [K]) */
export function katapayadiLetters(n) {
  n = Number(n);
  if (!(Number.isInteger(n) && n >= 1 && n <= 72)) return { error: 'A melakarta number is 1 to 72.' };
  const of = d => Object.keys(KATAPAYADI).filter(c => KATAPAYADI[c] === d).concat(d === 0 ? ['(a vowel)'] : []);
  return { n, first: { digit: n % 10, letters: of(n % 10) }, second: { digit: Math.floor(n / 10), letters: of(Math.floor(n / 10)) } };
}
