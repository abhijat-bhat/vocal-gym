# Raga profiles for the kalpana swara generator

`data/raga-profiles.json` gives every raga the engine knows (72 melakartas, `mela1` … `mela72`, and 28 janyas) a profile the kalpana generator can use: swara roles, gamaka notes, sourced phrases, avoid rules, allied ragas and landing hints. It was built only from the project's research notes. Where the notes had nothing, arrays are empty and the gap is written down, so an empty field means "not found", never "not allowed".

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
| Ragas | 100 (all engine ids, no extras) |
| Phrases | 993, of which 920 have weight ≥ 0.4 |
| Phrases derived from composition notation | 366 |
| Phrases whose octave was inferred (`octaveCertain: false`) | 203 |
| Phrases that break the engine's direction rule (`directionRuleOk: false`) | 75, sung only whole, and only with `allowExceptions` |
| Avoid entries | 40 (5 hard) |
| Sources | 265 (S193–S199 for gamaka rendering) |
| Ragas with gamaka render rules (`gamakaRender`) | 23 |
| Ragas with no phrases | 26 |

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
| `sources` | `S1` … `S199`: `title`, `url`, `reliability` (`high`, `medium`, `low`), `note`, and `key` (the stable build key). |
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
| `gamaka` | Per-letter descriptions, an optional `general`, and `sources`. Descriptive; the evidence for `gamakaRender`. |
| `gamakaRender` | Optional: the gamaka text transcribed into render rules (below). |
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

`confidence.phrases` is computed: `none` without phrases; `low` with fewer than 6 phrases of weight ≥ 0.4; `high` with at least 12 such phrases of which at least 8 have a certain octave; `medium` otherwise. A raga whose only phrases of weight ≥ 0.4 are from `scripts/mine-repertoire-phrases.js` stays `low` however many it has. `confidence.roles` was set by hand from the strength of the role and gamaka sources (`none` when there are none).

### `gamakaRender`: gamaka as render rules

`gamakaRender` sits next to `gamaka` in the 23 ragas whose `gamaka` has text. The text stays as the evidence; `gamakaRender` transcribes it into rules for the gamaka renderer (`docs/plans/gamaka-audio.md`), and every rule cites the source its text came from. It changes only how a round **sounds**, never which notes the generator writes. Ragas without it get the conservative default (`style: light`, `basis: default`) from the compiler.

| Field | Meaning |
| --- | --- |
| `style` | `heavy` (per-swara rules carry the raga), `medium` (gamaka is pervasive but the text gives little detail), `light` (sparse or conflicting evidence), `plain` (opt-in) or `default`. Swaras without a rule fall back to the style. |
| `basis` | `text`; also `text-vague` on a rule whose text names no target ("permits strong gamaka"), `measured` for calibrated data, `default` for the compiler's fallback. |
| `rules.<letter>` | An ordered list for that swara. The most specific rule whose `when` holds wins; ties go to list order. |
| `when` | `dir` (`up`, `down`, `turn`, `any`), `minSec`, `maxSec`, `prev`, `next` (swara letters, with `'` or `.` for a neighbour above or below), `janta: true`, `inPhrase` (a phrase string), `octave`. |
| `onset` | `none`, `jaru` (slide in), `nokku` (stress from above), `odukkal` (from below), `sphurita` (second note of a janta, struck from below), `pratyahata`. |
| `body` | `plain`, `kampita` (oscillation between `lo` and `hi`), `andolita` (a slower swing). |
| `exit` | `none`, `orikkai` (a flick up at the end), `jaru`. |
| `lo`, `hi`, `from` | Targets as raga notes: `self`, a letter (`M`, `S'`, `N.`), `+1` / `-1` (the next raga swara up or down), or `±Nc` (cents, measured data only). At most 7 semitones from the swara; `lo` below `hi`. |
| `end`, `dwell` | Where the oscillation rests (`self`, `lo`, `hi`) and which end gets the longer stay (`even`, `hi`, `lo`). |
| `cycles`, `depth` | `[min, max]` oscillation cycles before time-fitting; a 0–1 scale on the width ("slight", "gentle"). |
| `src`, `interpretation` | Required source id; a note wherever the transcription needed judgement, for a musician to review. |
| `global` | Raga-wide settings with sources: `maxChain` (the longest run of non-plain notes before a plain one, from ISMIR 2017, S193). |

Coverage: 5 ragas `heavy` (Todi, Mayamalavagowla, Gourimanohari, Sankarabharanam, Kalyani), 6 `medium`, 12 `light`; the other 63 use the default. The gamaka research sources are S193–S199. `scripts/check-raga-profiles.js` checks every rule (letters in the raga, enums, sources, cycles, target distance and order), and `scripts/compile-profiles.js` resolves the letters to semitone offsets with each raga's own swarasthanas, so the engine never parses letters while rendering.

### Vakra and bhashanga ragas (v0.11)

A raga may carry `scale.krama`: `{ arohana, avarohana, source }`, its walk as a lakshana writes it, equal to `krama` in `src/engine/ragas.js`. `scale.arohana` and `scale.avarohana` stay in order of pitch. The engine also holds `deny` (a step of the scale the krama walks around, unless a phrase of weight 0.4 or more makes it) and `oneWay` (a variant in only one list leads on only in that direction). A letter with two variants in a raga, such as Bhairavi's D, must be written with its number in phrases. The move lists were derived from the krama and the sourced phrases, not from a further source, and no teacher has checked them yet.

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
| 1 | Kanakangi | 10 | 10 | 0 | none | low | S P (default) |
| 2 | Ratnangi | 5 | 5 | 0 | none | low | S P (default) |
| 3 | Ganamurti | 17 | 15 | 0 | none | high | S P (default) |
| 4 | Vanaspati | 10 | 10 | 0 | none | low | S P (default) |
| 5 | Manavati | 10 | 10 | 0 | none | low | S P (default) |
| 6 | Tanarupi | 0 | 0 | 0 | none | none | S P (default) |
| 7 | Senavati | 0 | 0 | 0 | none | none | S P (default) |
| 8 | Hanumatodi | 32 | 32 | 0 | high | high | S P R M D (sourced) |
| 9 | Dhenuka | 14 | 14 | 0 | low | high | S P (default) |
| 10 | Natakapriya | 8 | 8 | 0 | low | medium | S P (default) |
| 11 | Kokilapriya | 0 | 0 | 0 | none | none | S P (default) |
| 12 | Rupavati | 15 | 10 | 0 | low | low | S P (default) |
| 13 | Gayakapriya | 0 | 0 | 0 | none | none | S P (default) |
| 14 | Vakulabharanam | 16 | 16 | 0 | none | high | S P (default) |
| 15 | Mayamalavagowla | 16 | 16 | 0 | medium | medium | S P M (inferred) |
| 16 | Chakravakam | 15 | 15 | 0 | low | medium | P R S M (inferred) |
| 17 | Suryakantam | 0 | 0 | 0 | none | none | S P (default) |
| 18 | Hatakambari | 0 | 0 | 0 | none | none | S P (default) |
| 19 | Jhankaradhwani | 10 | 10 | 0 | none | low | S P (default) |
| 20 | Natabhairavi | 22 | 16 | 0 | low | high | S P (default) |
| 21 | Keeravani | 15 | 15 | 0 | medium | high | R M N S P (sourced) |
| 22 | Kharaharapriya | 4 | 4 | 0 | medium | low | R G D N S P (sourced) |
| 23 | Gourimanohari | 20 | 20 | 0 | medium | medium | R S P (inferred) |
| 24 | Varunapriya | 10 | 10 | 0 | none | low | S P (default) |
| 25 | Mararanjani | 0 | 0 | 0 | none | none | S P (default) |
| 26 | Charukesi | 20 | 20 | 0 | medium | high | S P G D (sourced) |
| 27 | Sarasangi | 10 | 10 | 0 | none | low | S P (default) |
| 28 | Harikambhoji | 20 | 20 | 0 | medium | high | G D N S (sourced) |
| 29 | Dheerasankarabharanam | 12 | 12 | 0 | medium | medium | S G M P (sourced) |
| 30 | Naganandini | 10 | 10 | 0 | none | low | S P (default) |
| 31 | Yagapriya | 9 | 0 | 0 | low | low | S P (default) |
| 32 | Ragavardhini | 0 | 0 | 0 | none | none | S P (default) |
| 33 | Gangeyabhushani | 0 | 0 | 0 | none | none | S P (default) |
| 34 | Vagadheeswari | 18 | 10 | 0 | none | low | S P (default) |
| 35 | Shulini | 0 | 0 | 0 | none | none | S P (default) |
| 36 | Chalanata | 10 | 10 | 0 | none | low | S P (default) |
| 37 | Salagam | 0 | 0 | 0 | none | none | S P (default) |
| 38 | Jalarnavam | 0 | 0 | 0 | none | none | S P (default) |
| 39 | Jhalavarali | 0 | 0 | 0 | none | none | S P (default) |
| 40 | Navaneetam | 0 | 0 | 0 | none | none | S P (default) |
| 41 | Pavani | 0 | 0 | 0 | none | none | S P (default) |
| 42 | Raghupriya | 0 | 0 | 0 | none | none | S P (default) |
| 43 | Gavambhodi | 0 | 0 | 0 | none | none | S P (default) |
| 44 | Bhavapriya | 8 | 8 | 0 | none | medium | S P (default) |
| 45 | Shubhapantuvarali | 8 | 8 | 0 | none | medium | S P (default) |
| 46 | Shadvidamargini | 7 | 7 | 0 | low | medium | S' S M P D N (inferred) |
| 47 | Suvarnangi | 10 | 10 | 0 | none | low | S P (default) |
| 48 | Divyamani | 0 | 0 | 0 | none | none | S P (default) |
| 49 | Dhavalambari | 0 | 0 | 0 | none | none | S P (default) |
| 50 | Namanarayani | 10 | 10 | 0 | none | low | S P (default) |
| 51 | Kamavardhini | 17 | 17 | 0 | medium | medium | S R P D (mixed) |
| 52 | Ramapriya | 10 | 10 | 0 | none | medium | S P (default) |
| 53 | Gamanashrama | 10 | 10 | 0 | none | low | S P (default) |
| 54 | Vishwambari | 0 | 0 | 0 | none | none | S P (default) |
| 55 | Shamalangi | 0 | 0 | 0 | none | none | S P (default) |
| 56 | Shanmukhapriya | 26 | 9 | 0 | low | medium | P S (inferred) |
| 57 | Simhendramadhyamam | 21 | 17 | 0 | none | high | S P (default) |
| 58 | Hemavati | 15 | 15 | 0 | medium | high | R D S P (sourced) |
| 59 | Dharmavati | 12 | 12 | 0 | medium | high | S P R M N (mixed) |
| 60 | Neetimati | 0 | 0 | 0 | none | none | S P (default) |
| 61 | Kantamani | 10 | 10 | 0 | none | low | S P (default) |
| 62 | Rishabhapriya | 7 | 7 | 0 | none | low | S P (default) |
| 63 | Latangi | 16 | 16 | 0 | medium | high | G P N S (sourced) |
| 64 | Vachaspati | 17 | 17 | 0 | medium | high | S P R G D (sourced) |
| 65 | Mechakalyani | 24 | 24 | 0 | high | high | S R G N P (sourced) |
| 66 | Chitrambari | 0 | 0 | 0 | none | none | S P (default) |
| 67 | Sucharitra | 0 | 0 | 0 | none | none | S P (default) |
| 68 | Jyotiswarupini | 10 | 10 | 0 | none | low | S P (default) |
| 69 | Dhatuvardhani | 0 | 0 | 0 | none | none | S P (default) |
| 70 | Nasikabhushani | 7 | 7 | 0 | none | medium | S P (default) |
| 71 | Kosalam | 0 | 0 | 0 | none | none | S P (default) |
| 72 | Rasikapriya | 8 | 8 | 0 | none | medium | S P (default) |
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
| janya (28) | Begada | 15 | 15 | 5 | none | high | S P (default) |
| janya (28) | Sahana | 19 | 19 | 0 | none | high | S P (default) |
| janya (22) | Sri | 11 | 11 | 0 | none | medium | S P (default) |
| janya (22) | Darbar | 17 | 17 | 0 | none | high | S P (default) |
| janya (22) | Nayaki | 13 | 13 | 4 | none | high | S P (default) |
| janya (22) | Kanada | 19 | 19 | 9 | none | high | S P (default) |
| janya (20) | Anandabhairavi | 4 | 4 | 1 | none | low | S P (default) |
| janya (20) | Bhairavi | 13 | 13 | 0 | none | medium | S P (default) |
| janya (20) | Mukhari | 17 | 17 | 5 | none | high | S P (default) |
| janya (22) | Kapi | 18 | 18 | 13 | none | high | S P (default) |
| janya (22) | Huseni | 13 | 13 | 9 | none | high | S P (default) |
| janya (29) | Devagandhari | 13 | 13 | 7 | none | high | S P (default) |
| janya (8) | Dhanyasi | 13 | 13 | 5 | none | high | S P (default) |
| janya (28) | Sama | 19 | 19 | 4 | none | high | S P (default) |

A raga with phrases only at low weight (now only Yagapriya: Dikshitar-school raganga phrasing) should be treated as having no phrases for default generation.

### Added in v0.11

The table above was written for the first 86 ragas and has not been redrawn. `node scripts/check-raga-profiles.js` is the authority. New: fourteen janyas from Darbar (Bhairavi from Wikipedia for its scale, and from shivkumar.org notation for its phrases); Darbar phrases for Ganamurti, Dhenuka, Ramapriya, Vakulabharanam, Natabhairavi and Simhendramadhyamam; repeated runs from shivkumar.org notation for Dheerasankarabharanam, Natakapriya, Bhavapriya, Shubhapantuvarali, Nasikabhushani and Rasikapriya, with octaves inferred. No usable phrase was found for: Tanarupi, Senavati, Kokilapriya, Gayakapriya, Suryakantam, Hatakambari, Mararanjani, Yagapriya, Ragavardhini, Gangeyabhushani, Shulini, Salagam, Jalarnavam, Jhalavarali, Navaneetam, Pavani, Raghupriya, Gavambhodi, Divyamani, Dhavalambari, Vishwambari, Shamalangi, Neetimati, Chitrambari, Sucharitra, Dhatuvardhani, Kosalam.

Phrases marked `mined: "repertoire-mined"` come from `scripts/mine-repertoire-phrases.js`: runs of 4 to 8 swaras, not a plain climb or fall, that a composition sings at least twice, from lines the octave checks do not question, in a composition whose printed scale is the mela's own. They weigh 0.45, name their composition, and leave the raga's phrase confidence at `low`, so the generator leans on them less than on a lakshana's. They cover Kanakangi, Ratnangi, Vanaspati, Manavati, Rupavati, Jhankaradhwani, Varunapriya, Sarasangi, Naganandini, Vagadheeswari, Chalanata, Suvarnangi, Namanarayani, Gamanashrama, Kantamani, Rishabhapriya, Jyotiswarupini. This is thin evidence: one or two compositions a raga, repeated figures rather than a lakshana. The script touches only ragas with no phrase of weight 0.4 or more from anywhere else.

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
