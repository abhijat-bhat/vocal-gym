/* Vocal Gym engine · swaras, the 72 melakartas and the encoded janya ragas
   Pitches are semitones above Sa (S = 0, tara Sa = 12). A raga is an arohana list and an
   avarohana list; melakartas are computed from the mela number. */

const SEMI = { S: 0, R1: 1, R2: 2, R3: 3, G1: 2, G2: 3, G3: 4, M1: 5, M2: 6, P: 7, D1: 8, D2: 9, D3: 10, N1: 9, N2: 10, N3: 11 };
const RG = [[1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]];
const DN = [[8, 9], [8, 10], [8, 11], [9, 10], [9, 11], [10, 11]];
const RL = { 1: 'R1', 2: 'R2', 3: 'R3' }, GL = { 2: 'G1', 3: 'G2', 4: 'G3' }, DL = { 8: 'D1', 9: 'D2', 10: 'D3' }, NL = { 9: 'N1', 10: 'N2', 11: 'N3' };
const CHAKRA = ['Indu', 'Netra', 'Agni', 'Veda', 'Bana', 'Rutu', 'Rishi', 'Vasu', 'Brahma', 'Disi', 'Rudra', 'Aditya'];
const MELA_NAMES = ['Kanakangi', 'Ratnangi', 'Ganamurti', 'Vanaspati', 'Manavati', 'Tanarupi', 'Senavati', 'Hanumatodi', 'Dhenuka', 'Natakapriya', 'Kokilapriya', 'Rupavati', 'Gayakapriya', 'Vakulabharanam', 'Mayamalavagowla', 'Chakravakam', 'Suryakantam', 'Hatakambari', 'Jhankaradhwani', 'Natabhairavi', 'Keeravani', 'Kharaharapriya', 'Gourimanohari', 'Varunapriya', 'Mararanjani', 'Charukesi', 'Sarasangi', 'Harikambhoji', 'Dheerasankarabharanam', 'Naganandini', 'Yagapriya', 'Ragavardhini', 'Gangeyabhushani', 'Vagadheeswari', 'Shulini', 'Chalanata', 'Salagam', 'Jalarnavam', 'Jhalavarali', 'Navaneetam', 'Pavani', 'Raghupriya', 'Gavambhodi', 'Bhavapriya', 'Shubhapantuvarali', 'Shadvidamargini', 'Suvarnangi', 'Divyamani', 'Dhavalambari', 'Namanarayani', 'Kamavardhini', 'Ramapriya', 'Gamanashrama', 'Vishwambari', 'Shamalangi', 'Shanmukhapriya', 'Simhendramadhyamam', 'Hemavati', 'Dharmavati', 'Neetimati', 'Kantamani', 'Rishabhapriya', 'Latangi', 'Vachaspati', 'Mechakalyani', 'Chitrambari', 'Sucharitra', 'Jyotiswarupini', 'Dhatuvardhani', 'Nasikabhushani', 'Kosalam', 'Rasikapriya'];

function melaLabels(n) {
  const i = (n - 1) % 36, ma = n <= 36 ? 5 : 6;
  const rg = RG[Math.floor(i / 6)], dn = DN[i % 6];
  return ['S', RL[rg[0]], GL[rg[1]], ma === 5 ? 'M1' : 'M2', 'P', DL[dn[0]], NL[dn[1]]];
}
function defineRaga(id, name, aroLabels, avLabels, meta) {
  const toPitch = lab => lab === "S'" ? 12 : SEMI[lab];
  const aro = aroLabels.map(toPitch), avaro = avLabels.map(toPitch);
  const labels = {};
  aroLabels.concat(avLabels).forEach(l => { if (l !== "S'") labels[SEMI[l]] = l; });
  labels[0] = 'S';
  const nA = new Set(aro.map(p => p % 12)).size, nD = new Set(avaro.map(p => p % 12)).size;
  const cls = n => n === 5 ? 'audava' : n === 6 ? 'shadava' : n === 7 ? 'sampurna' : (n + '-note');
  return Object.assign({ id, name, aro, avaro, labels, cls: cls(nA) + '–' + cls(nD) }, meta || {});
}
function melakarta(n) {
  const L = melaLabels(n);
  return defineRaga('mela' + n, MELA_NAMES[n - 1], L.concat(["S'"]), ["S'"].concat(L.slice().reverse()),
    { mela: n, chakra: CHAKRA[Math.floor((n - 1) / 6)], kind: 'melakarta' });
}
const sp = s => s.trim().split(/\s+/);
const JANYA = [
  ['mohanam', 'Mohanam', 28, "S R2 G3 P D2 S'", "S' D2 P G3 R2 S"],
  ['hamsadhwani', 'Hamsadhwani', 29, "S R2 G3 P N3 S'", "S' N3 P G3 R2 S"],
  ['hindolam', 'Hindolam', 20, "S G2 M1 D1 N2 S'", "S' N2 D1 M1 G2 S"],
  ['madhyamavati', 'Madhyamavati', 22, "S R2 M1 P N2 S'", "S' N2 P M1 R2 S"],
  ['abhogi', 'Abhogi', 22, "S R2 G2 M1 D2 S'", "S' D2 M1 G2 R2 S"],
  ['shuddhasaveri', 'Shuddha Saveri', 29, "S R2 M1 P D2 S'", "S' D2 P M1 R2 S"],
  ['malahari', 'Malahari', 15, "S R1 M1 P D1 S'", "S' D1 P M1 G3 R1 S"],
  ['saveri', 'Saveri', 15, "S R1 M1 P D1 S'", "S' N3 D1 P M1 G3 R1 S"],
  ['bilahari', 'Bilahari', 29, "S R2 G3 P D2 S'", "S' N3 D2 P M1 G3 R2 S"],
  ['arabhi', 'Arabhi', 29, "S R2 M1 P D2 S'", "S' N3 D2 P M1 G3 R2 S"],
  ['kedaragowla', 'Kedaragowla', 28, "S R2 M1 P N2 S'", "S' N2 D2 P M1 G3 R2 S"],
  ['abheri', 'Abheri', 22, "S G2 M1 P N2 S'", "S' N2 D2 P M1 G2 R2 S"],
  ['sriranjani', 'Sriranjani', 22, "S R2 G2 M1 D2 N2 S'", "S' N2 D2 M1 G2 R2 S"],
  ['kambhoji', 'Kambhoji', 28, "S R2 G3 M1 P D2 S'", "S' N2 D2 P M1 G3 R2 S"]
].map(j => defineRaga(j[0], j[1], sp(j[3]), sp(j[4]), { parent: j[2], kind: 'janya' }));

function allRagas() {
  const m = []; for (let n = 1; n <= 72; n++) m.push(melakarta(n));
  return { melakartas: m, janyas: JANYA };
}

export { SEMI, CHAKRA, MELA_NAMES, melaLabels, defineRaga, melakarta, JANYA, allRagas };
