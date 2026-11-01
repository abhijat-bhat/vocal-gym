# The melakartas and the katapayadi rule (v0.8.7)

The explorer (`src/engine/melakarta.js`, `web/shared/mela-explorer.js`) shows the 72 melakartas as a system. It shows how each mela's number gives its swaras, and how the first two syllables of its name give the number.

## Sources

Both were read on 2026-11-02.

- **[K]** Wikipedia, "Katapayadi system": https://en.wikipedia.org/wiki/Katapayadi_system
- **[M]** Wikipedia, "Melakarta": https://en.wikipedia.org/wiki/Melakarta

The page's digit grid did not survive text extraction. The table below was read from the page's ordered consonant list against the columns 1–9, 0. It was then checked against the page's own examples ("ba is always 3"; Dhīra 9 2; Meca 5 6).

## The number gives the swaras [K], [M]

- **The madhyama.** Melas 1–36 have M1 (shuddha); melas 37–72 have M2 (prati).
- **The division.** Take n − 1, less 36 in the second half, and divide by 6.
- **R and G (the quotient).** 0 R1 G1 · 1 R1 G2 · 2 R1 G3 · 3 R2 G2 · 4 R2 G3 · 5 R3 G3. The six melas of a chakra share these. "They differ only in the dhaivatam and nishadam notes" [M].
- **D and N (the remainder).** 0 D1 N1 · 1 D1 N2 · 2 D1 N3 · 3 D2 N2 · 4 D2 N3 · 5 D3 N3. This is the mela's place in its chakra.
- **Why 72.** S and P are fixed, which gives 2 × 6 × 6 = 72.
- **The builder.** Of the 162 ways to choose R, G, M, D and N, 72 are melakartas. The other 90 put two swaras on one pitch (R2 with G1, D3 with N2) or out of order (R3 with G1). The builder refuses them and says which case applies.
- **The chakras** [M]. Each chakra's name stands for its number:

| No. | Chakra | Meaning |
|---|---|---|
| 1 | Indu | the moon, of which there is one |
| 2 | Netra | the eyes, of which there are two |
| 3 | Agni | the three sacred fires |
| 4 | Veda | the four Vedas |
| 5 | Bāṇa | the five arrows of Manmatha |
| 6 | Rutu | the six seasons |
| 7 | Rishi | the seven sages |
| 8 | Vasu | the eight Vasus |
| 9 | Brahma | Brahma, of which there are nine |
| 10 | Disi | the ten directions |
| 11 | Rudra | the eleven Rudras |
| 12 | Aditya | the twelve Adityas |

## The name gives the number [K]

**The digits:**

| Group | Consonants and digits |
|---|---|
| ka group | ka 1, kha 2, ga 3, gha 4, ṅa 5 |
| ca group | ca 6, cha 7, ja 8, jha 9, ña 0 |
| ṭa group | ṭa 1, ṭha 2, ḍa 3, ḍha 4, ṇa 5 |
| ta group | ta 6, tha 7, da 8, dha 9, na 0 |
| pa group | pa 1, pha 2, ba 3, bha 4, ma 5 |
| ya group | ya 1, ra 2, la 3, va 4, śa 5, ṣa 6, sa 7, ha 8 |

[K] uses ḷa in katapayadi works but gives it no digit, and does not mention kṣa.

**The rules:**
- A vowel standing alone is 0.
- "In a conjunct consonant, the last of the consonants alone will count."
- "A consonant without a vowel is to be ignored."
- The digits are read in reverse.
- For a melakarta, "the digits corresponding to the first two syllables of the name of a raga, when reversed, give the index of the raga" [M]. For example: Dhīra 9, 2 → 29; Meca 5, 6 → 65; Hari 8, 2 → 28.

### The 72 names, read

The names are spelled in IAST after [M]'s table. Three spellings follow Sanskrit instead of [M], because [M]'s sibilant or aspirate cannot give the name's number:
- **Ṣaṇmukhapriyā (56).** [M] writes Śanmukhapriyā. ṣaṇ means six, and ś would give 55.
- **Riṣabhapriyā (62).** [M] writes Riśabhapriyā, and ś would give 52.
- **Dhātuvardhanī (69).** [M] writes Dhāthuvardhani. The aspirated th would give 79.

In plain English spellings the ambiguity is real: "Natakapriya" reads 60 unless its t is the retroflex ṭ, which gives 10. The decoder reports the readings that plain letters allow.

**By the stated rule, 65 names give their own number.**

**By a convention, 5 more do.** These names give their number only if a ya, ra or va written beneath a consonant is passed over and the main consonant counts:

| No. | Name | Syllable | The stated rule gives | The convention gives |
|---|---|---|---|---|
| 16 | Cakravākam | kra | 26 (r, 2) | 16 (k, 1) |
| 48 | Divyamaṇi | vya | 18 (y, 1) | 48 (v, 4) |
| 54 | Viśvambharī | śva | 44 (v, 4) | 54 (ś, 5) |
| 66 | Citrāmbarī | tra | 26 (r, 2) | 66 (t, 6) |
| 68 | Jyotisvarūpiṇī | jyo | 61 (y, 1) | 68 (j, 8) |

Neither source states this convention. The explorer labels it "by a convention", not as the rule.

**Two names are exceptions:**
- **Siṃhendramadhyamam (57).** It reads 87. [K] notes this, and says "it is believed that the name should be written as Sihmendramadhyamam (as in the case of Brahmana in Sanskrit)": si 7, hma counts m 5, so 57.
- **Naṭabhairavī (20).** Na 0 and ṭa 1 give 10, Nāṭakapriyā's number; no reading of its first two syllables gives 0 then 2. Neither source explains this. The explorer says so rather than inventing an explanation.

[M] also notes that its chart image swaps Sarasāṅgī (27) and Harikāmbhojī (28), and Nāsikābhūṣaṇī (70) and Kosalam (71). The text table, which the engine follows, has them right, and the rule agrees: sa 7, ra 2 → 27; ha 8, ri 2 → 28; nā 0, si 7 → 70; ko 1, sa 7 → 71.

## In Vocal Gym

| Where | What |
|---|---|
| Engine | `katapayadi(text)`, `melaName(n)`, `melakartaInfo(n)`, `melaFromSwaras({R,G,M,D,N})`, `katapayadiLetters(n)`, plus the tables `KATAPAYADI`, `CHAKRA_MEANING` and `MELA_IAST` |
| Command line | `vocal-gym mela <n or raga>` and `vocal-gym katapayadi <word>` |
| API | `POST /api/mela` `{ n }` or `{ raga }`; `POST /api/katapayadi` `{ text }` or `{ swaras }` |
| Pages | The app's Melakartas page (`#/melakarta/29` opens a mela) and the playground's Melakartas tab, sharing `web/shared/mela-explorer.js` |
| Tests | `test/melakarta.test.js`, with the server, CLI, smoke and end-to-end tests |
