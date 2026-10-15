# Raga profiles for the kalpana swara generator

`data/raga-profiles.json` gives every raga the engine knows (72 melakartas, `mela1` … `mela72`, and 14 janyas) a profile the kalpana generator can use: swara roles, gamaka notes, sourced phrases, avoid rules, allied ragas and landing hints. It was built only from the project's research notes. Where the notes had nothing, arrays are empty and the gap is written down, so an empty field means "not found", never "not allowed".

The file is checked by `test/raga-profiles.test.js` (run by `npm test`) and by `node scripts/check-raga-profiles.js`.

## Contents

1. [What is in the file](#1-what-is-in-the-file)
2. [Notation](#2-notation)
3. [Schema reference](#3-schema-reference)
4. [How the generator should use it](#4-how-the-generator-should-use-it)
5. [Coverage](#5-coverage)
6. [Caveats](#6-caveats)
7. [Extending the file](#7-extending-the-file)

## 1. What is in the file

| | Count |
| --- | --- |
| Ragas | 86 (all engine ids, no extras) |
| Phrases | 488, of which 415 have weight ≥ 0.4 |
| Phrases derived from composition notation | 140 |
| Phrases whose octave was inferred (`octaveCertain: false`) | 139 |
| Phrases that break the engine's direction rule (`directionRuleOk: false`) | 13, in Malahari, Saveri, Bilahari, Abheri and Kambhoji |
| Avoid entries | 40 (5 hard) |
| Sources | 192 |
| Ragas with no phrases | 50 (47 of them have no swara-role data either) |

## 2. Notation

Phrases are strings of space-separated tokens:

| Token | Meaning |
| --- | --- |
| `S R G M P D N` | The raga's own swarasthana for that letter. In Mohanam `G` is G3; in Hindolam `D` is D1; in Kambhoji `N` is N2. |
| `S'`, `R'` … | Tara (upper octave, +12 semitones). |
| `N.`, `D.` … | Mandra (lower octave, −12). |
| `,` | Karvai. Ignored for pitch and for the direction check. |
| `N2`, `N3.`, `D1` | An explicit variant. If the raga does not have it, it is an anya swara and is listed in `anyaSwaras`. |

Pitches are semitones above Sa, exactly as in the engine (`S = 0`, `S' = 12`, `N.` in Kalyani `= −1`). `scale.arohana` and `scale.avarohana` are written with variant numbers for every swara (`"S R2 G3 M2 P D2 N3 S'"`) and must equal the engine's scale.

## 3. Schema reference

Top level:

| Field | Meaning |
| --- | --- |
| `schemaVersion` | 1. Bump on breaking changes. |
| `generated` | Build date. |
| `notation` | The rules in section 2. |
| `generatorGuidance` | How each field should drive the generator (section 4). |
| `enums` | Allowed values of every enumerated field. |
| `melakartaNotes` | Vivadi pairs, Dikshitar-school counterparts, the Koteeswara Iyer series. |
| `sources` | `S1` … `S192`: `title`, `url`, `reliability` (`high`, `medium`, `low`), `note`, and `key` (the stable build key). |
| `ragas` | One profile per engine id. |

Per raga (`ragas.<id>`):

| Field | Meaning |
| --- | --- |
| `id`, `name`, `aliases` | Engine id and name; other spellings. |
| `kind` | `melakarta` or `janya`. Melakartas add `mela` and `chakra`; janyas add `parent` and `parentName`. |
| `dikshitarName` | Asampurna (Dikshitar school) counterpart, or `null` when no source gave one. |
| `scale` | `arohana`, `avarohana` (equal to the engine) and `class` (e.g. `audava–sampurna`). |
| `scaleNotes` | Variants and disputes: Kambhoji's vakra ascent and N3, Abheri's D1 vs D2, Dikshitar-school scales. |
| `vivadiPairs` | Melakartas only: `R1-G1`, `R3-G3`, `D1-N1`, `D3-N3` pairs present. |
| `swaraRoles` | Sourced roles, as swara letters: `jiva`, `nyasa`, `chaya` (ragachaya), `prominent` (called focal or most important without a technical term), `graha`, `dirgha`, `alpa`, `notNyasa`; plus `note` (vadi–samvadi, disagreements) and `sources`. |
| `gamaka` | Per-letter descriptions, an optional `general`, and `sources`. Descriptive only. |
| `phrases` | See below. |
| `avoid` | `{ swaras?, rule?, reason, strength, source }`. `swaras` is a parseable phrase; `rule` is prose for things like "do not hold P long". `strength` is `hard` or `soft`. |
| `allied` | `{ raga, distinguish, basis, source? }`. `basis: structural` marks the mela twin with the other madhyama, added for every melakarta; everything else is `basis: source`. |
| `janta`, `dattu` | `suits`, `neutral`, `avoid` or `unknown`; `jantaDattuNote` explains. |
| `kalpanaHints` | `landingSwaras`, `avoidLanding`, `basis` (`sourced`, `inferred`, `mixed`, `default`), optional `range` (Pantuvarali), `notes`. |
| `compositions` | Titles with composer and, where known, tala and school. |
| `notes` | Other sourced remarks (mood, performance practice, kalpana swara placement). |
| `references` | Sources for names, scales and compositions. |
| `confidence` | `scale`, `roles`, `phrases` (`none`, `low`, `medium`, `high`). |
| `gaps` | What the research looked for and did not find. |

Per phrase:

| Field | Meaning |
| --- | --- |
| `swaras` | The phrase in the notation above. |
| `type` | `signature`, `ending`, `janta`, `dattu` or `connective`. `signature` is set by hand where a source or the notes single the phrase out; the others follow the features in that order of priority. Types are a structural reading: no source classifies its phrases. |
| `features` | Computed: `ending` (last swara S, any octave, or madhya P), `janta` (two or more immediate repeats), `dattu` (a leap of 3+ raga positions or two skips of 2), `vakra`, `tara`, `mandra`, `anya`. |
| `weight` | 0 to 1; see section 4. |
| `context` | `carnatic` (default), `hindustani-reference`, `dikshitar-school`, `historical-lakshana`. |
| `source` | A source id. |
| `derivedFrom`, `composition` | `"composition"` and the piece, when the phrase was cut from a notation. |
| `octaveCertain` | `false` where the researcher inferred the octave because the source carried no octave marks. |
| `directionRuleOk` | Computed with `makeProjector(raga).valid` on every step; `false` also for any anya swara. |
| `anyaSwaras` | Computed list of explicit variants outside the raga. |
| `inEngineRange` | Computed: all pitches within mandra Pa to tara Pa (−5 … 19), the range `kalpana()` uses. |
| `note` | Source notation, caveats, overrides. |

`confidence.phrases` is computed: `none` without phrases; `low` with fewer than 6 phrases of weight ≥ 0.4; `high` with at least 12 such phrases of which at least 8 have a certain octave; `medium` otherwise. `confidence.roles` was set by hand from the strength of the role and gamaka sources (`none` when there are none).

## 4. How the generator should use it

The engine's guarantee stays the same: the feasibility tables decide what is legal and finishable, and the profile only re-weights moves that are already allowed (README §5). `generatorGuidance` in the file says the same in machine-readable prose. In short:

**Phrases as devices.** Each phrase with `directionRuleOk` and `inEngineRange` becomes an extra conventional device whose notes are its pitches, one slot per swara plus one per following karvai. Offer it only where the reach table allows the round to finish after it and the step into its first swara is legal. Add `weight × typeFactor × confidenceFactor` to F, with `typeFactor` signature 1.0, ending 0.9 (only at the end of the body or the round), janta 0.8, dattu 0.8, connective 0.6, and `confidenceFactor` high 1.0, medium 0.8, low 0.5. Phrases add nothing to N: they are the conventional pole of the creativity dial.

**Weights.** `weight = base × octaveFactor + signatureBonus`, capped by context:

| Term | Value |
| --- | --- |
| base | source reliability high 0.8, medium 0.6, low 0.25 |
| octaveFactor | 0.8 when `octaveCertain` is false, else 1 |
| signatureBonus | 0.1 for `signature` phrases |
| context cap | hindustani-reference 0.15, dikshitar-school 0.1, historical-lakshana 0.3 |

Explicit overrides are explained in the phrase `note`: Chakravakam's Gajananayutham phrases (0.5, disputed raga identity), Shanmukhapriya's varnam phrases (0.5, garbled extraction), Abheri's Bhajare phrases (0.4, garbled), one Hemavati phrase (0.4, possible artefact), Natabhairavi and Sriranjani teaching-site phrases (0.2), old-Abheri phrases (0.1).

**Octaves.** Use phrases at their written octave. Where `octaveCertain` is false, trying the phrase an octave up or down is reasonable if it stays in range.

**Direction-rule exceptions.** The 13 phrases with `directionRuleOk: false` are real idiom the direction rule cannot express: Malahari's "S R G R S", Saveri's "R S R G R R", "D D G'" and "P D N P D", Bilahari's "P D N2 P D P M G R", Kambhoji's "S N3. P. D. S", Abheri's "M G G R S R , S" and the old D1 phrases. Never let the sampler reach them note by note. If they are used, emit the whole phrase atomically, check only its entry and exit, and keep them behind a flag (off by default) until a teacher signs them off.

**Landing.** `kalpanaHints.landingSwaras` should replace the generic "held last swara on Sa or Pa" bonus of README §12.3: +0.6 F for a hold that lands on a listed swara, −0.4 F for a hold on an `avoidLanding` swara. `swaraRoles.nyasa` is the sourced subset; `basis` says how the list was obtained. The eduppu target itself is still the user's choice.

**Avoid.** Hard entries with `swaras` remove any candidate device that would create that subsequence (inside the device table, so feasibility stays exact). Soft entries cost −1.0 F. Rule-only entries are for future duration- and gamaka-aware scoring; the current engine can approximate "do not hold X" by putting X in `avoidLanding`.

**Janta and dattu.** Scale the F of the engine's janta, janta3, skipjanta and dattu devices: suits × 1.3, neutral and unknown × 1.0, avoid × 0.5.

**Fallback.** With no phrases (or none that pass the filters) the generator runs exactly as today, using `landingSwaras` (S and P by default). For melakartas with `vivadiPairs` the notes suggest, as an unsourced design heuristic, lower weight for janta or oscillation inside a vivadi pair and S, P and M as the safest landings.

**Contexts.** `hindustani-reference`, `dikshitar-school` and `historical-lakshana` phrases are capped low; they suit an optional "historical colour" setting, not the default.

## 5. Coverage

"Phrases" counts all phrases; "Weight ≥ 0.4" counts the ones that should drive generation by default; "Rule exceptions" counts `directionRuleOk: false`.

| Mela | Raga | Phrases | Weight ≥ 0.4 | Rule exceptions | Roles | Phrase confidence | Landing swaras (basis) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Kanakangi | 0 | 0 | 0 | none | none | S P (default) |
| 2 | Ratnangi | 0 | 0 | 0 | none | none | S P (default) |
| 3 | Ganamurti | 2 | 0 | 0 | none | low | S P (default) |
| 4 | Vanaspati | 0 | 0 | 0 | none | none | S P (default) |
| 5 | Manavati | 0 | 0 | 0 | none | none | S P (default) |
| 6 | Tanarupi | 0 | 0 | 0 | none | none | S P (default) |
| 7 | Senavati | 0 | 0 | 0 | none | none | S P (default) |
| 8 | Hanumatodi | 32 | 32 | 0 | high | high | S P R M D (sourced) |
| 9 | Dhenuka | 0 | 0 | 0 | low | none | S P (default) |
| 10 | Natakapriya | 0 | 0 | 0 | low | none | S P (default) |
| 11 | Kokilapriya | 0 | 0 | 0 | none | none | S P (default) |
| 12 | Rupavati | 5 | 0 | 0 | low | low | S P (default) |
| 13 | Gayakapriya | 0 | 0 | 0 | none | none | S P (default) |
| 14 | Vakulabharanam | 0 | 0 | 0 | none | none | S P (default) |
| 15 | Mayamalavagowla | 16 | 16 | 0 | medium | medium | S P M (inferred) |
| 16 | Chakravakam | 15 | 15 | 0 | low | medium | P R S M (inferred) |
| 17 | Suryakantam | 0 | 0 | 0 | none | none | S P (default) |
| 18 | Hatakambari | 0 | 0 | 0 | none | none | S P (default) |
| 19 | Jhankaradhwani | 0 | 0 | 0 | none | none | S P (default) |
| 20 | Natabhairavi | 6 | 0 | 0 | low | low | S P (default) |
| 21 | Keeravani | 15 | 15 | 0 | medium | high | R M N S P (sourced) |
| 22 | Kharaharapriya | 4 | 4 | 0 | medium | low | R G D N S P (sourced) |
| 23 | Gourimanohari | 20 | 20 | 0 | medium | medium | R S P (inferred) |
| 24 | Varunapriya | 0 | 0 | 0 | none | none | S P (default) |
| 25 | Mararanjani | 0 | 0 | 0 | none | none | S P (default) |
| 26 | Charukesi | 20 | 20 | 0 | medium | high | S P G D (sourced) |
| 27 | Sarasangi | 0 | 0 | 0 | none | none | S P (default) |
| 28 | Harikambhoji | 20 | 20 | 0 | medium | high | G D N S (sourced) |
| 29 | Dheerasankarabharanam | 0 | 0 | 0 | medium | none | S G M P (sourced) |
| 30 | Naganandini | 0 | 0 | 0 | none | none | S P (default) |
| 31 | Yagapriya | 9 | 0 | 0 | low | low | S P (default) |
| 32 | Ragavardhini | 0 | 0 | 0 | none | none | S P (default) |
| 33 | Gangeyabhushani | 0 | 0 | 0 | none | none | S P (default) |
| 34 | Vagadheeswari | 8 | 0 | 0 | none | low | S P (default) |
| 35 | Shulini | 0 | 0 | 0 | none | none | S P (default) |
| 36 | Chalanata | 0 | 0 | 0 | none | none | S P (default) |
| 37 | Salagam | 0 | 0 | 0 | none | none | S P (default) |
| 38 | Jalarnavam | 0 | 0 | 0 | none | none | S P (default) |
| 39 | Jhalavarali | 0 | 0 | 0 | none | none | S P (default) |
| 40 | Navaneetam | 0 | 0 | 0 | none | none | S P (default) |
| 41 | Pavani | 0 | 0 | 0 | none | none | S P (default) |
| 42 | Raghupriya | 0 | 0 | 0 | none | none | S P (default) |
| 43 | Gavambhodi | 0 | 0 | 0 | none | none | S P (default) |
| 44 | Bhavapriya | 0 | 0 | 0 | none | none | S P (default) |
| 45 | Shubhapantuvarali | 0 | 0 | 0 | none | none | S P (default) |
| 46 | Shadvidamargini | 7 | 7 | 0 | low | medium | S' S M P D N (inferred) |
| 47 | Suvarnangi | 0 | 0 | 0 | none | none | S P (default) |
| 48 | Divyamani | 0 | 0 | 0 | none | none | S P (default) |
| 49 | Dhavalambari | 0 | 0 | 0 | none | none | S P (default) |
| 50 | Namanarayani | 0 | 0 | 0 | none | none | S P (default) |
| 51 | Kamavardhini | 17 | 17 | 0 | medium | medium | S R P D (mixed) |
| 52 | Ramapriya | 0 | 0 | 0 | none | none | S P (default) |
| 53 | Gamanashrama | 0 | 0 | 0 | none | none | S P (default) |
| 54 | Vishwambari | 0 | 0 | 0 | none | none | S P (default) |
| 55 | Shamalangi | 0 | 0 | 0 | none | none | S P (default) |
| 56 | Shanmukhapriya | 26 | 9 | 0 | low | medium | P S (inferred) |
| 57 | Simhendramadhyamam | 4 | 0 | 0 | none | low | S P (default) |
| 58 | Hemavati | 15 | 15 | 0 | medium | high | R D S P (sourced) |
| 59 | Dharmavati | 12 | 12 | 0 | medium | high | S P R M N (mixed) |
| 60 | Neetimati | 0 | 0 | 0 | none | none | S P (default) |
| 61 | Kantamani | 0 | 0 | 0 | none | none | S P (default) |
| 62 | Rishabhapriya | 0 | 0 | 0 | none | none | S P (default) |
| 63 | Latangi | 16 | 16 | 0 | medium | high | G P N S (sourced) |
| 64 | Vachaspati | 17 | 17 | 0 | medium | high | S P R G D (sourced) |
| 65 | Mechakalyani | 24 | 24 | 0 | high | high | S R G N P (sourced) |
| 66 | Chitrambari | 0 | 0 | 0 | none | none | S P (default) |
| 67 | Sucharitra | 0 | 0 | 0 | none | none | S P (default) |
| 68 | Jyotiswarupini | 0 | 0 | 0 | none | none | S P (default) |
| 69 | Dhatuvardhani | 0 | 0 | 0 | none | none | S P (default) |
| 70 | Nasikabhushani | 0 | 0 | 0 | none | none | S P (default) |
| 71 | Kosalam | 0 | 0 | 0 | none | none | S P (default) |
| 72 | Rasikapriya | 0 | 0 | 0 | none | none | S P (default) |
| janya (28) | Mohanam | 16 | 16 | 0 | high | high | G P D S R (sourced) |
| janya (29) | Hamsadhwani | 23 | 23 | 0 | medium | high | S R G P N (sourced) |
| janya (20) | Hindolam | 16 | 16 | 0 | medium | high | S G M D N (sourced) |
| janya (22) | Madhyamavati | 19 | 19 | 0 | medium | high | R M S P (sourced) |
| janya (22) | Abhogi | 11 | 11 | 0 | low | medium | S G R (inferred) |
| janya (29) | Shuddha Saveri | 7 | 7 | 0 | medium | medium | R P D S (sourced) |
| janya (15) | Malahari | 18 | 9 | 3 | medium | medium | S P (inferred) |
| janya (15) | Saveri | 8 | 8 | 3 | low | medium | R M S P (inferred) |
| janya (29) | Bilahari | 4 | 4 | 1 | medium | low | R P D S (sourced) |
| janya (29) | Arabhi | 10 | 10 | 0 | high | medium | R P S (sourced) |
| janya (28) | Kedaragowla | 9 | 9 | 0 | medium | medium | R P S (sourced) |
| janya (22) | Abheri | 13 | 5 | 4 | low | low | S P (default) |
| janya (22) | Sriranjani | 11 | 6 | 0 | low | medium | S M (inferred) |
| janya (28) | Kambhoji | 13 | 13 | 2 | medium | high | G M P D S (sourced) |

Ragas with phrases only at low weight (Ganamurti, Rupavati, Yagapriya, Vagadheeswari: Dikshitar-school raganga phrasing; Natabhairavi: a generic teaching page; Simhendramadhyamam: Hindustani references) should be treated as having no phrases for default generation.

## 6. Caveats

- **Transcription route.** Most phrase strings were read through a summarising web-fetch tool, not copied from the page. Darbar's octave dots survived; shivkumar.org's did not, which is why 139 phrases carry `octaveCertain: false`. Spot-check strings against the live pages before treating them as gold data.
- **One source per raga.** Most ragas rest on a single phrase source (darbar.org, or one composition notation). Nothing here is a complete grammar.
- **Major ragas with no or few phrases.** Sankarabharanam (0 phrases; strong role and gamaka rules), Shubhapantuvarali (0), Natabhairavi (placeholders only), Simhendramadhyamam (Hindustani only), Kharaharapriya (4), Bilahari (4). 47 melakartas have nothing beyond the scale, names and composition titles.
- **Dikshitar-school data is not mela data.** For vivadi melas the Dikshitar-school ragangas (Rupavati's SSP form, Kalavati, Bhogachayanata, Gamakakriya, Vegavahini) deliberately avoid the straight runs the engine generates. Their phrases are capped at 0.1, or used only as avoid patterns (Chakravakam, Gamanashrama).
- **Disputed scales.** Kambhoji (vakra ascent and the N3 phrase), Abheri (D1 vs D2; the engine uses modern D2), Bilahari (where N2 occurs) and Saveri (sources disagree on characteristic swaras) are recorded in `scaleNotes`.
- **Excluded material.** Shankar Mahadevan Academy phrase lists that are templates duplicated across ragas (Pantuvarali, Simhendramadhyamam) or superseded by better data (Todi, Mayamalavagowla, Charukesi, Hamsadhwani, Hindolam, Bilahari); Wikipedia's Sankarabharanam and Harikambhoji "phrase" lists (janya scale patterns); darbar.org's "kamavardhini" page (it describes Lalita); the Jalajakshi varnam lines (octaves unassignable); CBSE fragments (OCR-garbled); an AI aggregator's Shubhapantuvarali gamaka claims; Hindustani pakads where Carnatic data exists (Vachaspati, Charukesi, Keeravani, Abhogi, Hemavati).
- **Allied twins.** The mela twin in `allied` (same swaras, other madhyama) is structural, not from a note.

## 7. Extending the file

1. **Find a source** with octave-marked swara notation: a lakshana text, a darbar.org-style sanchara list, or a composition's swara passages (chittaswaram, muktayi swaram, ettugada swaram). Add it to `sources` with the next free id, a `title`, `url`, `reliability` and a `note` on how it was read.
2. **Write the phrase** in the notation of section 2, using the raga's own letters, `'` and `.` for octaves, `,` for karvai, and an explicit variant only for an anya swara. Keep the source's own notation in `note` when it differs.
3. **Fill the hand-set fields**: `type` (use `signature` only when the source singles the phrase out), `weight` (apply the formula in section 4 and explain any override in `note`), `context`, `source`, `octaveCertain`, and `derivedFrom: "composition"` with `composition` for notation-derived phrases.
4. **Fill the computed fields** by running `node scripts/check-raga-profiles.js --fix`. It rewrites `features`, `directionRuleOk`, `inEngineRange` and `anyaSwaras` from the engine.
5. **Update the raga's** `confidence.phrases` by the rule in section 3, remove the `gaps` entry you have filled, and add new roles, avoid rules or allied entries with their `source`.
6. **Run** `npm test`. The test fails if a phrase does not parse, if a computed flag disagrees with the engine, if a source id is missing, if an enum value is unknown, or if the engine's ragas and the file's ragas differ.

When the engine gains a raga, add a profile with the same `id`; the test requires exactly the engine's set. When the engine changes a scale, the test fails until `scale` is updated and the phrases are re-checked.

The best next sources, in order of value: notations of the Koteeswara Iyer 72-mela kritis (Kanda Ganamudam; only "Antaranga bhakti" is online); swara passages of "Sami ninne" and "Swararaga sudha" (Sankarabharanam), "Ennalu urake" and "Sri Satyanarayanam" (Shubhapantuvarali), "Chakkani raja" and "Rama nee samana" with octave marks (Kharaharapriya), "Ninne nammiti" (Simhendramadhyamam), "Marivere" and "Siddhi Vinayakam" (Shanmukhapriya), "Nagumomu" (modern Abheri); Subbarama Dikshitar's Sangita Sampradaya Pradarsini; Sambamoorthy's raga lakshanas; the CompMusic/Dunya Saraga annotations; and the swarakalpana recordings indexed on shivkumar.org, transcribed.
