/* v0.8.7 the melakarta and katapayadi explorer (src/engine/melakarta.js): the katapayadi table and rules as
   the sources give them, every one of the 72 names read (65 by the stated rule, five by a convention the
   name needs, two exceptions), the swaras worked out from every number, and the builder over every choice. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { E } from './helpers.js';

test('katapayadi: the table, the rules and the sources’ worked examples', () => {
  const K = E.KATAPAYADI;
  // each varga counts 1, 2, 3 … and the fifth or tenth letter closes it
  assert.deepEqual(['k', 'kh', 'g', 'gh', 'ṅ', 'c', 'ch', 'j', 'jh', 'ñ'].map(c => K[c]), [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
  assert.deepEqual(['ṭ', 'ṭh', 'ḍ', 'ḍh', 'ṇ', 't', 'th', 'd', 'dh', 'n'].map(c => K[c]), [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
  assert.deepEqual(['p', 'ph', 'b', 'bh', 'm'].map(c => K[c]), [1, 2, 3, 4, 5]);
  assert.deepEqual(['y', 'r', 'l', 'v', 'ś', 'ṣ', 's', 'h'].map(c => K[c]), [1, 2, 3, 4, 5, 6, 7, 8]);
  // the sources' examples: Dhīra 9 2 → 29; Meca 5 6 → 65; Hari 8 2 → 28; Kanaka 1 0 → 1
  [['Dhīraśaṅkarābharaṇam', 29], ['Mecakalyāṇī', 65], ['Harikāmbhojī', 28], ['Kanakāṅgī', 1]].forEach(([w, n]) => assert.equal(E.katapayadi(w).number, n, w));
  // a vowel alone is 0; in a conjunct the last consonant counts (kya is 1); a final consonant with no vowel is ignored
  assert.deepEqual(E.katapayadi('ari').digits, [0, 2]);
  assert.equal(E.katapayadi('kya').syllables[0].digit, 1);
  assert.deepEqual(E.katapayadi('kat').digits, [1]);
  // plain letters are read as the English spellings are, and their ambiguity is reported
  const nk = E.katapayadi('Natakapriya');
  assert.equal(nk.number, 60);
  assert.ok(nk.alternatives.includes(10), 'ṭ for t gives 10, its mela');
  assert.equal(E.katapayadi('Nāṭakapriyā').number, 10, 'with diacritics there is no doubt');
  assert.ok(E.katapayadi('').error && E.katapayadi('123').error);
});

test('every melakarta name: 65 by the rule, five by a convention, two exceptions, each explained', () => {
  const by = { rule: [], phala: [], exception: [] };
  for (let n = 1; n <= 72; n++) {
    const r = E.melaName(n);
    by[r.reading].push(n);
    assert.ok(r.note && r.note.length > 20, n + ' is explained');
    if (r.reading === 'rule') assert.equal(r.number, n);
    if (r.reading === 'phala') assert.equal(r.phalaNumber, n);
  }
  assert.equal(by.rule.length, 65);
  assert.deepEqual(by.phala, [16, 48, 54, 66, 68], 'Cakravākam, Divyamaṇi, Viśvambharī, Citrāmbarī, Jyotisvarūpiṇī');
  assert.deepEqual(by.exception, [20, 57], 'Naṭabhairavī and Siṃhendramadhyamam');
  // the Katapayadi source's own note: Simhendramadhyamam gives 87, and Sihmendramadhyamam 57
  const s = E.melaName(57);
  assert.equal(s.number, 87); assert.equal(s.spellingNumber, 57);
  assert.ok(E.melaName(0).error && E.melaName(73).error);
});

test('every number gives its swaras, its chakra and its twin; the builder inverts it', () => {
  for (let n = 1; n <= 72; n++) {
    const I = E.melakartaInfo(n), r = E.melakarta(n);
    assert.deepEqual(I.labels, E.melaLabels(n));
    assert.deepEqual(I.pitches, r.aro.slice(0, 7));
    assert.equal(I.madhyama, n <= 36 ? 'M1' : 'M2');
    assert.equal(I.chakra.index, Math.ceil(n / 6));
    assert.ok(I.chakra.members.includes(n) && I.chakra.members.length === 6);
    assert.equal(I.twin.n, n <= 36 ? n + 36 : n - 36);
    assert.deepEqual(E.melakartaInfo(I.twin.n).rg.concat(E.melakartaInfo(I.twin.n).dn), I.rg.concat(I.dn), 'the twin differs only in M');
    assert.equal(I.steps.length, 5);
    const L = I.labels, back = E.melaFromSwaras({ R: L[1], G: L[2], M: L[3], D: L[5], N: L[6] });
    assert.equal(back.n, n, 'the builder finds ' + n);
    const lt = E.katapayadiLetters(n);
    assert.ok(lt.first.digit === n % 10 && lt.second.digit === Math.floor(n / 10));
  }
  // every choice of R G M D N: 72 are melakartas, the other 90 are refused with a reason
  let ok = 0, refused = 0;
  for (const R of ['R1', 'R2', 'R3']) for (const G of ['G1', 'G2', 'G3']) for (const M of ['M1', 'M2']) for (const D of ['D1', 'D2', 'D3']) for (const N of ['N1', 'N2', 'N3']) {
    const x = E.melaFromSwaras({ R, G, M, D, N });
    if (x.error) { refused++; assert.match(x.error, /same pitch|above/); } else ok++;
  }
  assert.equal(ok, 72); assert.equal(refused, 90);
  // the chakra names stand for their numbers; the janyas are listed under their parents
  assert.match(E.melakartaInfo(1).chakra.meaning, /moon/);
  assert.equal(E.melakartaInfo(28).janyas.map(j => j.id).sort().join(), 'kambhoji,kedaragowla,mohanam');
  assert.ok(E.melakartaInfo(80).error);
});
