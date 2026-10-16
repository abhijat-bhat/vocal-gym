# Vocal Gym

Vocal Gym is a daily practice system for Carnatic vocalists, with a studio for Bharatanatyam dancers and teachers. The plan is for it to check how your voice is today, choose your warm-up, give you exercises in any raga and tala, listen for where you leave the raga, and coach the hardest skill to practise alone: kalpana swaras.

This repository holds the part that works today: the **raga–tala constraint engine**. It drives three generators that cannot break the rules of raga or tala, plus a notation and judge for jathis:

- **Alankaras in all 35 talas.** The first pattern for each tala comes from the *35 Tāla Alankāra-s* sheet. "New pattern" then gives patterns you have not seen, in any of 86 ragas.
- **Kalpana swaras.** Rounds are built mostly from the raga's own sourced phrases, with reasoned jumps, and end on the swara just above or below the one the composition resumes on, often with a graded mora. Temperature is the singer's creativity: low means recognisable, high means out-of-the-box variants of the raga's phrases.
- **Jathis for dance.** A generator, JathiScript (a text format students write jathis in), and a judge. The judge checks the arithmetic exactly, scores six aspects of craft and says which line to fix.

It also holds the web pages built on the engine: an interactive playground, the research and build plan, and the pitch deck. The learned parts of the product (pitch tracking, raga conformance, the personal voice model) are designed in the research plan and listed under [Roadmap](#18-roadmap). They are not implemented yet.

```
npm install          # esbuild and jsdom, for the page build and the smoke test
npm test             # 29 tests, 594,406 checked properties, about 15 seconds
npm run build        # bundles the engine and writes the pages to site/
npm run smoke        # loads every page in jsdom and drives every control
node bin/vocal-gym.js alankara --raga mohanam --tala "misra jhampa"
```

---

## Contents

1. [Status](#1-status)
2. [Quick start](#2-quick-start)
3. [Repository layout](#3-repository-layout)
4. [Carnatic primer for engineers](#4-carnatic-primer-for-engineers)
5. [The engine: rules as feasibility tables](#5-the-engine-rules-as-feasibility-tables)
6. [Temperature is creativity](#6-temperature-is-creativity)
7. [Module A: alankaras across the 35 talas](#7-module-a-alankaras-across-the-35-talas)
8. [Module B: jathi theory, rules and student guide](#8-module-b-jathi-theory-rules-and-student-guide)
9. [JathiScript language reference](#9-jathiscript-language-reference)
10. [The jathi judge](#10-the-jathi-judge)
11. [The jathi generator](#11-the-jathi-generator)
12. [Module C: kalpana swaras](#12-module-c-kalpana-swaras)
13. [Library API](#13-library-api)
14. [Command line](#14-command-line)
15. [Web pages and the build](#15-web-pages-and-the-build)
16. [Tests](#16-tests)
17. [Research programme](#17-research-programme)
18. [Roadmap](#18-roadmap)
19. [Design decisions and known limitations](#19-design-decisions-and-known-limitations)
20. [Corrections to earlier material](#20-corrections-to-earlier-material)
21. [Sources](#21-sources)
22. [Licence](#22-licence)

---

## 1. Status

| Component | State | Where |
| --- | --- | --- |
| Ragas: all 72 melakartas computed from the mela number, 14 janyas | Done, tested | `src/engine/ragas.js` |
| Talas: 35 suladi talas, Tisra, Khanda and Misra Chapu, custom talas | Done, tested | `src/engine/talas.js` |
| Raga direction rules and contour-preserving projection for janyas | Done, tested | `src/engine/projection.js` |
| Alankaras: the 35 sheet patterns, new patterns with no repeats, creativity dial | Done, tested | `src/engine/alankara/` |
| Raga profiles: sourced swara roles, phrases and avoid lists for all 86 ragas, compiled for the engine | Done, tested; phrases for 32 ragas | `data/`, `src/engine/profiles.js` |
| Kalpana swaras: phrase-driven rounds, reasoned jumps, landing next to the eduppu, graded mora, creativity dial | Done, tested | `src/engine/kalpana/` |
| Jathi generator (35 + 3 talas, any nadai, atita and anagata eduppu, seven yati settings) | Done, tested | `src/engine/jathi/generator.js` |
| JathiScript parser | Done, tested | `src/engine/jathi/script.js` |
| Jathi judge: correctness gate, six craft aspects, computed fixes | Done, tested; weights not yet calibrated with teachers | `src/engine/jathi/judge.js` |
| Command line tool | Done, tested | `bin/vocal-gym.js`, `src/cli/` |
| Playground, research plan and pitch pages | Done, smoke-tested | `web/` → `site/` |
| Practice session shell (timers, logs, streaks), tanpura and tala playback for practice | Planned (Phase 1) | — |
| Voice Check probe and personal strain model | Designed; planned (Phases 1–3) | research plan |
| Pitch tracking, swara transcription, raga conformance coach | Designed; planned (Phase 2) | research plan |
| Kalpana swara tutor that listens to the singer | Designed; planned (Phases 2–3) | research plan |

The engine has no runtime dependencies. It runs unchanged in Node 18 or later and in any current browser.

---

## 2. Quick start

**Requirements.** Node.js 18 or later (22 recommended). The build and smoke test also need `npm install`, which installs two dev dependencies: esbuild (bundles the engine for the browser) and jsdom (runs the pages headlessly). The engine and the command line need nothing.

```bash
git clone <this repo> vocal-gym && cd vocal-gym
npm install
npm run check        # tests, build, smoke test
```

**Open the pages.** The built pages are committed in `site/`, so you can open `site/index.html` in a browser without building anything. Each page is a single self-contained HTML file. It has no external scripts; only the Google Fonts stylesheet is fetched, and the pages fall back to system fonts offline.

**Use the engine from code.**

```js
import { allRagas, tala, pdfMotif, alankara, newMotif, kalpana, jathi, judgeJathi, JATHI_EXAMPLES } from './src/engine/index.js';

const { melakartas, janyas } = allRagas();
const mayamalavagowla = melakartas[14];
const misraJhampa = tala('jhampa', 7);

// variation 0: the sheet's pattern 4.3, through the whole raga
const lines = alankara(mayamalavagowla, misraJhampa, pdfMotif('jhampa', 7)).lines;

// a new pattern, different from the sheet line
const fresh = newMotif(misraJhampa, { T: 1, seed: 7, span: 4, avoid: [pdfMotif('jhampa', 7)] });

// one avartanam of Adi in Kalyani, second speed, the composition resuming on Pa, at creativity 0
const round = kalpana(melakartas[64], { aksharas: 8, perAkshara: 2, startPitch: 0, eduppuPitch: 7, T: 0, seed: 3 });
round.ending;         // { type: 'mora', style: 'shift', statements: [...], approach: 'above', ... }

// a jathi, then the same jathi judged as JathiScript
const j = jathi({ tl: tala('triputa', 4), nadai: 4, avartanams: 2, offset: 0, T: 1, seed: 5 });
const verdict = judgeJathi(j.script);       // { total, grade, gate, aspects, fixes, ... }
judgeJathi(JATHI_EXAMPLES.short).fixes[0];  // 'Start with line 11: the phrases before the bar there are 1 matra short. ...'
```

In a browser, include `site/vocal-gym-engine.js` (or `dist/vocal-gym-engine.js`) and use the global `VGEngine`.

---

## 3. Repository layout

```
vocal-gym/
├── README.md                    this file
├── CLAUDE.md                    working rules for code assistants
├── CHANGELOG.md                 what changed between versions
├── package.json                 scripts: profiles, test, build, smoke, check; bin: vocal-gym
├── package-lock.json            exact versions of the two dev dependencies
├── bin/vocal-gym.js             command line entry point
├── src/
│   ├── engine/                  the constraint engine (pure ES modules, no dependencies)
│   │   ├── index.js             public API (re-exports every module below) and VERSION
│   │   ├── random.js            seeded generator, softmax sampling, the creativity dial
│   │   ├── ragas.js             swarasthanas, 72 melakartas, janyas, defineRaga
│   │   ├── talas.js             35 suladi talas, chapu talas, custom talas
│   │   ├── projection.js        direction rules, contour-preserving projection
│   │   ├── alankara/
│   │   │   ├── sheet.js         the 35 first lines of the tala alankara sheet
│   │   │   ├── motif.js         familiarity model, exact sampling, new patterns, reports
│   │   │   └── lines.js         a motif shifted through a raga, up and down
│   │   ├── profiles.js          getProfile, setProfiles, getSource over the compiled profiles
│   │   ├── data/profiles.generated.js   compiled from data/raga-profiles.json (generated; committed)
│   │   ├── kalpana.js           re-exports kalpana/ (kept for old imports)
│   │   ├── kalpana/
│   │   │   ├── index.js         kalpana and kalpanaRound: tables, endings, sampling, stats
│   │   │   ├── devices.js       generic cells and anchored phrase devices
│   │   │   ├── leaps.js         licensing, resolution, budget, leap statistics
│   │   │   ├── landing.js       eduppu neighbours
│   │   │   └── mora.js          graded mora
│   │   ├── sollu.js             sollukattu vocabulary, aliases, idiom test
│   │   └── jathi/
│   │       ├── generator.js     jathi generator
│   │       ├── script.js        JathiScript parser and exporter
│   │       ├── judge.js         correctness gate, craft aspects, fixes
│   │       └── examples.js      the worked examples used everywhere
│   └── cli/                     command line commands and text layout
├── data/raga-profiles.json      raga profiles: roles, phrases, avoid lists, sources (source of truth)
├── docs/
│   ├── raga-profiles.md         the profile format and how the generator uses it
│   ├── research/raga-profiles-report.md   the research behind the profiles
│   └── plans/kalpana-v0.3.md    the plan for the v0.3 kalpana generator
├── examples/*.jathi             the worked JathiScript examples as files
├── test/                        node:test suite: helpers.js and 8 *.test.js files (29 tests)
├── web/                         page sources
│   ├── shared/theme.css         colour tokens (dark first, light variant) and base type
│   ├── shared/components.css    layout and component styles
│   ├── demo/demo.html, demo.js  the three interactive demos (shared by two pages)
│   ├── index.html               landing page
│   ├── playground/index.html    the demos on their own
│   ├── research-plan/index.html the research and build plan, with the demos inline
│   └── pitch/index.html         the pitch deck
├── scripts/build.js             compiles the profiles, bundles the engine, expands web/ templates into site/
├── scripts/compile-profiles.js  data/raga-profiles.json → src/engine/data/profiles.generated.js
├── scripts/check-raga-profiles.js   validates the profiles against the engine (--fix recomputes fields)
├── scripts/smoke.js             jsdom smoke test of every page in site/
├── site/                        built pages (generated; committed so they open without a build)
└── dist/                        the engine bundle (generated; ignored by git)
```

---

## 4. Carnatic primer for engineers

This section defines every musical term the code uses. Pitches are integers, in semitones above Sa.

**Swaras.** There are seven swaras: S R G M P D N. Sa and Pa are fixed. The others have variants (swarasthanas): R₁ R₂ R₃, G₁ G₂ G₃, M₁ M₂, D₁ D₂ D₃, N₁ N₂ N₃. Some variants share a pitch, so R₂ = G₁ = 2 semitones, R₃ = G₂ = 3, D₂ = N₁ = 9 and D₃ = N₂ = 10. Tara (upper octave) swaras are written with a dot above (Ṡ = 12) and mandra (lower octave) swaras with a dot below (Ṇ = −1). In code, `SEMI` maps labels to pitches.

**Ragas.** A raga has an arohana (ascent) and an avarohana (descent). The engine enforces the core direction rule: **a step up must land on an arohana swara, and a step down on an avarohana swara.** Repeating a swara is always allowed. The rule lives in `makeProjector(raga).valid(a, b)`.

**Melakartas.** These are the 72 parent scales, all sampurna (seven swaras each way) and straight. For mela n:

- i = (n − 1) mod 36;
- Ma is M₁ for n ≤ 36 and M₂ for n > 36;
- the Ri–Ga pair is the ⌊i / 6⌋-th of (R₁G₁, R₁G₂, R₁G₃, R₂G₂, R₂G₃, R₃G₃);
- the Dha–Ni pair is the (i mod 6)-th of (D₁N₁, D₁N₂, D₁N₃, D₂N₂, D₂N₃, D₃N₃).

`melakarta(n)` builds the raga, including its chakra (the group of six it belongs to).

**Janyas.** Ragas derived from a melakarta are called janyas. They are classed by how many swaras they use each way: audava (5), shadava (6) or sampurna (7). Encoded:

| Class | Ragas |
| --- | --- |
| Audava–audava | Mohanam, Hamsadhwani, Hindolam, Madhyamavati, Abhogi, Shuddha Saveri |
| Audava–shadava | Malahari |
| Audava–sampurna | Bilahari, Arabhi, Saveri, Kedaragowla, Abheri |
| Shadava–shadava | Sriranjani |
| Shadava–sampurna | Kambhoji (without its N₃ anya swara) |

Vakra (zig-zag) and bhashanga (foreign-swara) ragas need more than the direction rule; see [limitations](#19-design-decisions-and-known-limitations).

**Katapayadi.** A melakarta's name encodes its number: read the first two syllables and reverse the digits. The digit groups are:

| Consonants | Digits |
| --- | --- |
| ka … ña | 1 … 0 |
| ṭa … na | 1 … 0 |
| pa … ma | 1 … 5 |
| ya … ha | 1 … 8 |

Examples:

- Mechakalyani: ma 5, ca 6 → 56 → 65.
- Harikambhoji: ha 8, ri 2 → 28.
- In conjunct consonants the last consonant counts (Ratnangi → 2). Seven melas are exceptions where the first counts, Chakravakam (16) among them.

**Talas.** A tala cycle (avartanam) is a sequence of beats (aksharas), grouped into angas:

- laghu, |L, whose length L is set by the jati: tisra 3, chatusra 4, khanda 5, misra 7, sankeerna 9;
- dhrutam, O = 2;
- anudhrutam, U = 1.

The seven suladi families are:

| Family | Angas |
| --- | --- |
| Dhruva | L O L L |
| Matya | L O L |
| Rupaka | O L |
| Jhampa | L U O |
| Triputa | L O O |
| Ata | L L O O |
| Eka | L |

Seven families × five jatis give the 35 talas, from Tisra Eka (3 aksharas) to Sankeerna Dhruva (29). Adi tala is Chatusra Triputa (8). Each family has a default jati, the one used when only the family is named: Dhruva 4, Matya 4, Rupaka 4, Jhampa 7, Triputa 3, Ata 5, Eka 4.

Dance also uses the chapu talas, counted in groups: Tisra (1 + 2), Khanda (2 + 3) and Misra (3 + 2 + 2). The first beat of the cycle is **sam**.

**Nadai, kalai, speed.**

- Nadai (gati) is the number of matras (subdivisions) in an akshara: 3, 4, 5, 7 or 9.
- Kalai k counts each akshara k times.
- In the alankara sheet, "speed" means swaras per beat: 1st speed is one, 2nd is two, 3rd is four.

**Karvai.** A held or silent unit, written `,`. It counts exactly like a swara or syllable.

**Eduppu.** Where a passage starts relative to sam:

- sama: on sam;
- atita: before sam;
- anagata: after sam.

Kalpana swaras must end so that the composition line resumes exactly at its eduppu.

---

## 5. The engine: rules as feasibility tables

Every generator in Vocal Gym solves the same problem: produce a sequence that satisfies a set of hard constraints C. These are exact length, raga direction, anga-safe karvais, a fixed start, a fixed landing and, for jathis, exact arithmetic. Within those constraints the generator should be as conventional or as adventurous as the user asks.

**Feasibility first.** For a sequence built left to right, the engine computes a backward table:

```
reach(t, s) = OR over moves m legal from state s at time t of reach(t + dur(m), next(s, m))
reach(end, s) = [s is an allowed final state]
```

`s` is whatever the constraints depend on: the current scale degree (alankaras), the current swara index (kalpana), or nothing beyond the slot count (jathis, which are solved by enumerating structures). When sampling, a move is offered only if `reach` stays true afterwards. So **every partial sequence can always be completed, and no output can violate C, at any temperature, with no rejection sampling and no backtracking.**

**Scores only weight legal moves.** Among the legal moves the engine samples with weights `exp(score / τ)`. The score expresses taste; the table expresses rules. No score can buy a rule break, because illegal moves are never in the candidate set.

**Exact sampling for alankaras.** The alankara generator replaces OR with log-sum-exp over the same table. The backward pass then holds the total weight of all completions, and sampling forward draws the whole pattern from `p(x) ∝ exp(Σ score / τ)` over legal patterns (forward filtering, backward sampling). This matters musically: a greedy sampler can choose a familiar opening and then be forced into an awkward leap at the end; the exact sampler weighs the ending when it chooses the opening. Kalpana and jathi bodies use the simpler locally normalised sampling, where improvisation-like left-to-right choice is the point.

**Determinism.** Every generator takes a `seed` (a mulberry32 generator in `random.js`). The same inputs and seed always give the same output, which is what makes histories, tests and teacher review reproducible.

**Pitches and projection.** `makeProjector(raga)` returns:

| Field | What it does |
| --- | --- |
| `aroExt(i)` | The i-th arohana degree, extended across octaves |
| `avExt(i)` | The i-th avarohana degree, extended across octaves |
| `valid(a, b)` | The direction rule |
| `repair(naive)` | The contour-preserving projection: a dynamic programme over the raga's swaras near the line |

`repair` minimises the distance from the naive mapping (in swara ranks) plus a penalty of 1.5 for every step whose direction differs from the original. It never lets an ascending line dip below its anchor or a descending line rise above it. In melakartas the naive mapping is always legal, so nothing changes.

---

## 6. Temperature is creativity

Users see one dial, temperature T from 0 to 2, described as the performer's creativity. `dial(T)` turns it into two numbers:

```
c = T / 2                 tilt from familiarity (c = 0) to novelty (c = 1)
τ = 0.3 + 0.45 T          sampling width; never zero
score = (1 − c) · F + c · N
```

- **F (familiarity)** measures how much a choice resembles what a teacher or listener expects. For alankaras it is learned from the 35 sheet lines. For kalpana swaras it is first the raga's own sourced phrases, then named conventional devices and placements: runs, janta, sequences, beat-aligned groups, holds on the raga's resting swaras, the mora. For jathis it is the jathi devices.
- **N (novelty)** rewards named unconventional choices that are still legal: variants of the raga's phrases (shifted sequences and inversions), leaps, zig-zags, syncopation, off-beat groups, shaped yatis, excursions out of the middle octave.

N is deliberately **not** the negative of F. If it were, c = 0.5 would cancel everything into uniform noise. With separate novelty features, T = 1 means "mostly idiomatic with some surprises", and T = 2 means "prefer the unexpected, still inside the rules".

Because τ never reaches zero, asking again at T = 0 still gives a different but conventional result. Measured effect:

| Generator | Measure | T = 0 | T = 1 | T = 2 |
| --- | --- | --- | --- | --- |
| Alankara (1,248 new patterns) | Mean share of the 35 sheet lines that are less conventional than the new pattern | 0.38 | 0.02 | 0.00 |
| Kalpana (3,600 rounds of 8+ slots, sampled ragas, all endings) | Share of swaras from phrase variants and unconventional devices | 2.6% | 19% | 42% |
| Kalpana (27 phrase-rich ragas, 1 avartanam, free ending) | Share of swaras from attested phrases | 67% | 42% | 23% |

---

## 7. Module A: alankaras across the 35 talas

### 7.1 The source

The first pattern for every tala comes from **_35 Tāla Alankāra-s_**, a 15-page sheet for Mayamalavagowla (mela 15). Its document metadata gives the author as "Ravikiran" and the date as August 2012. The PDF itself is not in this repository; its content is transcribed in `src/engine/alankara/sheet.js`.

The sheet writes the first ascending and first descending line of each alankara and says:

- fill the following lines in sequence up to tara Sa at least, then reverse and descend to madhya Sa;
- the notation is first speed (one swara per unit of the tala); second speed is two swaras per beat, third is four, up to the sixth;
- the alankaras can be sung in any melakarta.

The seven alankaras found in most books are its default-jati members.

In the sheet's notation, `,` extends the previous swara by one unit and `|` marks an anga line. "Rows" is the number of lines in each direction, as printed on the sheet.

| Sheet | Tala | Aksharas | First ascending line | First descending line | Rows |
| --- | --- | --- | --- | --- | --- |
| 1.1 | Chatusra Dhruva | 14 | `S R G M \| G R \| S R G R \| S R G M` | `Ṡ N D P \| D N \| Ṡ N D N \| Ṡ N D P` | 5 |
| 1.2 | Tisra Dhruva | 11 | `S R G \| R S \| S R G \| R G M` | `Ṡ N D \| N Ṡ \| Ṡ N D \| N D P` | 5 |
| 1.3 | Misra Dhruva | 23 | `S R G M P D N \| D P \| S R G M P D P \| S R G M P D N` | `Ṡ N D P M G R \| G M \| Ṡ N D P M G M \| Ṡ N D P M G R` | 2 |
| 1.4 | Khanda Dhruva | 17 | `S R G M P \| M G \| S R G M G \| S R G M P` | `Ṡ N D P M \| P D \| Ṡ N D P D \| Ṡ N D P M` | 4 |
| 1.5 | Sankeerna Dhruva | 29 | `S , R , G M P D N \| D P \| S , R , G M P D P \| S , R , G M P D N` | `Ṡ , N , D P M G R \| G M \| Ṡ , N , D P M G M \| Ṡ , N , D P M G R` | 2 |
| 2.1 | Chatusra Matya | 10 | `S R G R \| S R \| S R G M` | `Ṡ N D N \| Ṡ N \| Ṡ N D P` | 5 |
| 2.2 | Tisra Matya | 8 | `S R G \| S R \| S R G` | `Ṡ N D \| Ṡ N \| Ṡ N D` | 6 |
| 2.3 | Misra Matya | 16 | `S R G M P D P \| M G \| S R G M P D N` | `Ṡ N D P M G M \| P D \| Ṡ N D P M G R` | 2 |
| 2.4 | Khanda Matya | 12 | `S R G M G \| S R \| S R G M P` | `Ṡ N D P D \| Ṡ N \| Ṡ N D P M` | 4 |
| 2.5 | Sankeerna Matya | 20 | `S , R , G , M P M \| G R \| S , R , G , M P D` | `Ṡ , N , D , P M P \| D N \| Ṡ , N , D , P M G` | 3 |
| 3.1 | Chatusra Rupaka | 6 | `S R \| S R G M` | `Ṡ N \| Ṡ N D P` | 5 |
| 3.2 | Tisra Rupaka | 5 | `S R \| S R G` | `Ṡ N \| Ṡ N D` | 6 |
| 3.3 | Misra Rupaka | 9 | `S R \| S R G \| S R G M` | `Ṡ N \| Ṡ N D \| Ṡ N D P` | 5 |
| 3.4 | Khanda Rupaka | 7 | `S R \| S R G M P` | `Ṡ N \| Ṡ N D P M` | 4 |
| 3.5 | Sankeerna Rupaka | 11 | `S R \| S R G M P R G M P` | `Ṡ N \| Ṡ N D P M N D P M` | 4 |
| 4.1 | Chatusra Jhampa | 7 | `S R G R \| G \| M ,` | `Ṡ N D N \| D \| P ,` | 5 |
| 4.2 | Tisra Jhampa | 6 | `S R G \| R \| G ,` | `Ṡ N D \| N \| D ,` | 6 |
| 4.3 | Misra Jhampa | 10 | `S R G S R S R \| G \| M ,` | `Ṡ N D Ṡ N Ṡ N \| D \| P ,` | 5 |
| 4.4 | Khanda Jhampa | 8 | `S R G S R \| G \| M ,` | `Ṡ N D Ṡ N \| D \| P ,` | 5 |
| 4.5 | Sankeerna Jhampa | 12 | `S , R , G M S R G \| M \| P ,` | `Ṡ , N , D P Ṡ N D \| P \| M ,` | 4 |
| 5.1 | Chatusra Triputa (Adi) | 8 | `S R G R \| S R \| G M` | `Ṡ N D N \| Ṡ N \| D P` | 5 |
| 5.2 | Tisra Triputa | 7 | `S R G \| S R \| G M` | `Ṡ N D \| Ṡ N \| D P` | 5 |
| 5.3 | Misra Triputa | 11 | `S R G M P M G \| R G \| M P` | `Ṡ N D P M P D \| N D \| P M` | 4 |
| 5.4 | Khanda Triputa | 9 | `S R G M P \| R G \| M P` | `Ṡ N D P M \| N D \| P M` | 4 |
| 5.5 | Sankeerna Triputa | 13 | `S R G M P M G R S \| R G \| M P` | `Ṡ N D P M P D N Ṡ \| N D \| P M` | 4 |
| 6.1 | Chatusra Ata | 12 | `S R G M \| S R G M \| P , \| P ,` | `Ṡ N D P \| Ṡ N D P \| M , \| M ,` | 4 |
| 6.2 | Tisra Ata | 10 | `S R G \| S R G \| M , \| M ,` | `Ṡ N D \| Ṡ N D \| P , \| P ,` | 5 |
| 6.3 | Misra Ata | 18 | `S R , G , M P \| S , R G , M P \| D , \| D ,` | `Ṡ N , D , P M \| Ṡ , N D , P M \| G , \| G ,` | 3 |
| 6.4 | Khanda Ata | 14 | `S R , G , \| S , R G , \| M , \| M ,` | `Ṡ N , D , \| Ṡ , N D , \| P , \| P ,` | 5 |
| 6.5 | Sankeerna Ata | 22 | `S R , G , M , P D \| S , R G , M , P D \| N , \| N ,` | `Ṡ N , D , P , M G \| Ṡ , N D , P , M G \| R , \| R ,` | 2 |
| 7.1 | Chatusra Eka | 4 | `S R G M` | `Ṡ N D P` | 5 |
| 7.2 | Tisra Eka | 3 | `S R G` | `Ṡ N D` | 6 |
| 7.3 | Misra Eka | 7 | `S R G M P D N` | `Ṡ N D P M G R` | 2 |
| 7.4 | Khanda Eka | 5 | `S R G M P` | `Ṡ N D P M` | 4 |
| 7.5 | Sankeerna Eka | 9 | `S R , G M , P D N` | `Ṡ N , D P , M G R` | 2 |

Sheet 3.3 draws an extra bar inside the laghu of Misra Rupaka. The engine keeps it as written and checks only that every anga line has a bar.

### 7.2 Algorithm

1. **Variation 0 is the sheet.** `parseSwaraLine` reads the sheet's line as scale degrees with durations and bar positions. Every melakarta is sampurna in both directions, so the same degrees give the sheet's pattern in all 72 melakartas.
2. **Shift through the raga.** Ascending lines start on successive arohana swaras until a line reaches tara Sa. Descending lines mirror the motif from tara Sa down to Sa on successive avarohana swaras. A motif spanning s swaras gives 9 − s lines each way in a seven-note raga. This matches the row count the sheet prints for every one of the 35 talas, from 2 rows (span 7) to 6 rows (span 3). Five-note ragas get proportionally fewer lines: Mohanam runs 3 up and 3 down in Misra Jhampa.
3. **Janya ragas get the sheet line, adapted.** Degrees map to arohana swaras going up and avarohana swaras coming down. Steps that would break the direction rule are repaired by the projection in section 5. Changed swaras are flagged `adjusted` and underlined in the demo. Across 86 ragas × 35 talas, 647 of 217,320 notes (0.30%) needed adjustment, all in the seven asymmetric janyas:

   | Raga | Notes adjusted |
   | --- | --- |
   | Malahari | 39 |
   | Saveri | 108 |
   | Bilahari | 133 |
   | Arabhi | 108 |
   | Kedaragowla | 112 |
   | Abheri | 82 |
   | Kambhoji | 65 |
4. **New pattern means a pattern not yet shown.** `newMotif(tl, { T, seed, span, avoid })` samples a motif with the same length as the tala, by default with the sheet's span. It accepts the motif only if it differs from every motif in `avoid` (the sheet line and all earlier variations for that raga and tala) in at least `minDiff` slots: a quarter of the tala rounded and at least 2, or 1 slot in talas of five aksharas or fewer.
   - It tries up to 160 samples, widening τ by 5% per attempt after the 40th.
   - If no sample is unseen, it enumerates every legal pattern (`enumerateMotifs`, up to 20,000) and draws one of the unseen ones by the same score. If none reaches `minDiff`, it returns the most different one with `relaxed: true`.
   - It returns `null` only when every legal pattern of that span has been shown. Tisra Eka with span 3 has exactly five legal patterns (the sheet's plus four), and the demo says so after the fourth instead of repeating one.
   - The demo and `alankaraSeries` keep the history per raga and tala.
5. **Hard constraints on a new motif:**
   - exact tala length;
   - starts on degree 0 and ends on the top degree (span − 1), so consecutive lines connect;
   - durations of 1 or 2;
   - a karvai never crosses an anga line;
   - steps of at most 3 degrees, except a restart to Sa at an anga line.

### 7.3 The familiarity model

Each move in a motif is described by three keys:

| Key | Values |
| --- | --- |
| Step | `mA*` at an anga start, `mI*` inside an anga. The suffix is the step from −3 to +3, or `R` for a restart to Sa at an anga line |
| Karvai | `k1` (no karvai), `kb` (karvai ending at an anga line), `km` (karvai ending inside an anga) |
| Contour | `c±±`: the signs of the previous and the current step |

`FAMILIAR.lp(key)` is the log-frequency of the key over the 35 sheet motifs, with add-½ smoothing. Each move is then scored like this:

```
F = 0.6 · Σ max(−4, lp(key))
N = +1.0 leap of two degrees, +1.4 leap of three, +0.4 step down (not counting restarts)
    +0.8 contour turn, +0.8 crossing an anga line without restarting on Sa,
    +0.6 karvai ending inside an anga, −1.0 repeated swara
score = (1 − c) F + c N, minus 3 for two repeated swaras in a row
```

`motifReport(motif, tl)` describes a motif in a teacher's words (runs, turns, restarts on Sa at anga lines, leaps, karvais, repeated swaras). It also returns `conventionality`: the share of the 35 sheet lines whose mean familiarity is at or below the motif's.

---

## 8. Module B: jathi theory, rules and student guide

### 8.1 Terms

| Term | Meaning |
| --- | --- |
| Adavu | The basic unit of Bharatanatyam movement. Adavus are combined to form dance sequences. |
| Sollukattu | A phrase of rhythmic syllables linked to a unit of movement and recited by the nattuvanar: *tai ya tai ya*, *tai hat tai hi*, *tat tai tam*. |
| Konnakol groups | Standard groups by length: tha ka (2), tha ki ta (3), tha ka dhi mi (4), tha dhi gi na thom (5), tha ka dhi mi tha ka (6), tha ka dhi mi tha ki ta (7), tha ka dhi mi tha ka jho nu (8), tha ka dhi mi tha dhi gi na thom (9). |
| Jathi | A passage of sollukattu set to the tala for pure dance, closed by a teermanam. |
| Korvai | A string of adavus set to sollukattu that ends with a teermanam. |
| Teermanam | "The final knot": a closing phrase performed three times. Here the three statements must be identical and separated by equal karvais. |
| Yati | An arrangement of phrases whose lengths draw a shape. Six types are named: sama, vishama, mridanga, damaru, gopuccha and srotovaha. |
| Eduppu | Sama (on sam), or a few counts, usually 2, 4 or 6, before sam (atita) or after it (anagata). |

### 8.2 The one equation

```
matras per avartanam      C = A · k · g          A aksharas, kalai k, nadai g
span from eduppu to sam   M = N · C − e          e > 0 starts after sam (anagata); e < 0 starts before (atita)
slots to fill             S = M + 1              the last syllable sounds on sam  (S = M if the jathi ends at sam)
teermanam                 3u + 2q                a phrase of u matras, two gaps of q
the equation              body + yati + 3u + 2q = S
```

Worked example: Adi tala, chatusra nadai, two avartanams from sam.

- C = 8 × 1 × 4 = 32, so M = 64 and S = 65.
- A teermanam of *tha dhi gi na thom* (u = 5) with gaps of 3 takes 15 + 6 = 21, which leaves 44 for body and yati.

### 8.3 Rules and constraints

Rules 1–5 are **hard**: the judge's gate fails until they hold. Rules 6–9 are **craft**: the judge scores them.

1. **Exact span.** Every syllable and karvai between the eduppu and the landing counts. The total must equal S.
2. **Landing.** By default the final syllable sounds on sam. A jathi may instead end exactly at sam (`land: end`), or land n matras after sam (`land: +n`), for example on the eduppu of the song that follows.
3. **Eduppu.** The first syllable sounds at the eduppu. Atita grows the span by |e|; anagata shrinks it by e.
4. **Teermanam.** Three identical statements with two equal gaps (gaps may be zero), ending on the landing.
5. **Bars tell the truth.** Phrases may cross anga lines (that is where cross-rhythm comes from), but every bar a student writes must sit on an anga line (`|`) or the end of an avartanam (`||`).
6. **Beat and speed.** Cross-rhythm should resolve within three or four aksharas. A change of speed should start on a beat and stay within double the nadai.
7. **Idiom.** Use standard sollu groups and their suffixes. Put strong syllables (tha, dhi, tat, tai, thom) or phrase starts on the beats. End the teermanam on a closing syllable (thom, dhit, tam, nam, jham, tai, dhim, dhi, tat).
8. **Yati.** Grow or cut each phrase from its neighbour so the shape is audible: *tha ka dhi mi tha ki ta / dhi mi tha ki ta / tha ki ta*.
9. **Danceability.** Leave karvais where the dancer can settle (60–95% of matras sounding), no unbroken run longer than two avartanams, and phrases of at most nine syllables so each maps to an adavu.

### 8.4 Yati shapes

| Yati | Lengths | Example | Image |
| --- | --- | --- | --- |
| Sama | equal | tha ka dhi mi · tha ka dhi mi · tha ka dhi mi | even steps |
| Gopuccha | decreasing | 7, 5, 3: tha ka dhi mi tha ki ta / dhi mi tha ki ta / tha ki ta | a cow's tail, broad at the root |
| Srotovaha | increasing | 3, 5, 7 | a river widening to its mouth |
| Mridanga | up, then down | 4, 5, 7, 7, 5, 4 | the mridangam's barrel |
| Damaru | down, then up | 7, 5, 4, 4, 5, 7 | the hourglass damaru |
| Vishama | irregular | 5, 4, 7, 9, 3, 4 | free arrangement |

### 8.5 Guide: write your own jathi in eight steps

1. **Frame it.** Choose tala, nadai, avartanams, eduppu and landing, then compute C, M and S. For Adi, chatusra nadai, 2 avartanams, sama eduppu, landing on sam: S = 65.
2. **Choose the teermanam.** With *tha dhi gi na thom* and q = 3, each statement plus its gap is 8 matras, exactly two aksharas, so all three statements start on beats: 3 × 5 + 2 × 3 = 21.
3. **Subtract.** 65 − 21 = 44 for the body and yati.
4. **Lead in with a yati.** A gopuccha cut from *tha ka tha ki ta*: *tha ka tha ki ta / ka tha ki ta / tha ki ta* = 12. The body is then 32 matras, exactly one avartanam.
5. **Fill the body anga by anga:**
   - laghu (16): tha ka dhi mi · tha ka jho nu · tha ka dhi mi · tha ka jho nu;
   - dhrutam (8): tha , dhi , tha ka dhi mi;
   - dhrutam (8): tha ka tha ki ta · tha ki ta.
6. **Write it in JathiScript** with bars where you expect anga lines, so the judge can check your counting.
7. **Judge it.** Fix the gate first: the judge names the line and the number of matras. Then raise the craft scores.
8. **Recite, then dance.** Play it with the tala clicks, recite it with the tala in your hands, then dance it slowly before bringing it up to speed.

The result, `examples/adi.jathi`, scores 100:

```
# Adi tala, chatusra nadai, two avartanams from sam.
# The final "thom" of the teermanam lands on sam.
tala: adi
nadai: 4
avartanams: 2
eduppu: sam
land: sam
let A = tha-ka-dhi-mi
let B = tha-ka-jho-nu

$A $B $A $B |                       # laghu: 4 aksharas = 16 matras
tha , dhi , $A |                    # dhrutam: 8 matras
tha-ka-tha-ki-ta tha-ki-ta ||       # dhrutam: 5 + 3 = 8 matras
tha-ka-tha-ki-ta ka-tha-ki-ta tha-ki-ta     # gopuccha yati 5 → 4 → 3
{tha-dhi-gi-na-thom}/3              # teermanam 3 × 5 + 2 × 3 = 21
```

---

## 9. JathiScript language reference

JathiScript is a deterministic text format for jathis. **One word is one matra at the current speed**, so the same text always gives the same timing, arithmetic and score. Times are kept in integer ticks, 2,520 per akshara. 2,520 is divisible by every speed from 1 to 10, so speed changes never round.

### 9.1 Header lines

Header lines have the form `key: value` and can appear anywhere. Every key is optional.

| Key (aliases) | Values | Default |
| --- | --- | --- |
| `tala` (`talam`) | Family and jati in either order: `chatusra triputa`, `khanda jati ata`. Also `adi`, `tisra chapu`, `khanda chapu`, `misra chapu`, or `custom 3+2+2`. A family alone takes its default jati. | `adi` (with a warning) |
| `nadai` (`gati`) | Matras per akshara: a number from 1 to 36 that divides 2,520, or a jati name | 4 |
| `kalai` | 1 to 4 | 1 |
| `avartanams` (`avartanam`, `avartas`, `avarta`, `cycles`) | 1 to 32: the required span | inferred, with a note |
| `eduppu` | `sam` (or `samam`, `0`), `+n`, `n`, `anagata n` or `after n` (n matras after sam), `-n`, `atita n` or `before n` (n matras before sam) | `sam` |
| `land` | `sam` (last syllable on sam), `end` or `before sam` (ends exactly at sam), `+n` (last syllable n matras after sam) | `sam` |
| `title`, `name`, `by` | Free text, ignored by the judge | — |

### 9.2 Body tokens

| Write | Meaning |
| --- | --- |
| `tha` | One syllable, one matra |
| `tha-ka-dhi-mi` | Hyphens join syllables into one phrase. Parts may be `,` or `;`: `tha-,-dhi-,-gi-na-thom` |
| `,` / `;` | Karvai of one / two matras |
| `( … )xN` | Group and repeat (`x`, `×` or `*`; N from 1 to 64). A repeat may also follow a word or a `$` phrase |
| `let NAME = …` then `$NAME` | Define a phrase once, use it anywhere. No bars or teermanams inside a definition; no self-reference |
| `{ … }/q` | Teermanam: the phrase three times, with q karvais between statements. `x3` is optional; any other count is an error |
| `\|` / `\|\|` | Bars, checked against anga lines / avartanam ends |
| `@n` | Speed: n syllables per akshara from here on (n ≤ 36 and divides 2,520) |
| `#` | Comment to the end of the line |

Grammar (EBNF):

```
script   = { line } ;
line     = header | definition | body ;
header   = key ":" value ;
definition = "let" NAME "=" sequence ;
sequence = { item } ;
item     = ( word | karvai | group | teermanam | phrase | bar | speed ) [ repeat ] ;
word     = letters { "-" ( letters | "," | ";" ) } ;
karvai   = "," | ";" ;
group    = "(" sequence ")" ;
teermanam = "{" sequence "}" [ "x3" ] [ "/" digits ] ;
phrase   = "$" NAME ;
bar      = "|" | "||" ;
speed    = "@" digits ;
repeat   = ( "x" | "×" | "*" ) digits ;
```

### 9.3 Semantics

- **Timing.** Each syllable or karvai lasts `2520 / speed` ticks. The speed starts at the nadai and changes at each `@n`. A cycle lasts `A · kalai · 2520` ticks.
- **Positions.** The eduppu offset is `eduppu · 2520 / nadai` ticks, so positions are absolute ticks relative to the first sam. Atita positions start negative.
- **Phrases (units).** The judge reasons about phrases, not loose syllables:
  - a hyphenated word, a `$` phrase, or a bracketed group containing only syllables and karvai is one phrase;
  - loose syllables form a phrase until a karvai, bar, speed mark or group breaks them;
  - nested groups contribute their innermost groups.

  Write phrases explicitly (hyphens or brackets) when you want the judge to see your grouping.
- **The teermanam.** The last `{…}` is the teermanam. If there is none, the judge looks for three equal phrases at the end, separated only by karvai. With equal gaps they are accepted as a written-out teermanam. With unequal gaps the gate fails.
- **Warnings, not errors.** A syllable outside the vocabulary still counts as one matra and produces a warning. A word that splits into known syllables (`takadhimi`) produces a warning suggesting the hyphenated form (`ta-ka-dhi-mi`), because without hyphens it counts as one matra.
- **Errors.** Errors in the body carry a line and column. Header errors carry the line, with column 1, and whole-script errors carry line 0. They are:
  - **Header:**
    - an unknown tala;
    - a nadai, kalai, avartanams, eduppu or land value that cannot be read;
    - an eduppu of a whole avartanam or more.
  - **Phrases:**
    - a phrase defined twice;
    - an undefined or self-referencing phrase;
    - a bar or teermanam inside a phrase definition.
  - **Body:**
    - unbalanced or stray brackets;
    - a teermanam inside brackets;
    - a teermanam repeated other than three times;
    - an unsupported speed;
    - a repeat count outside 1–64, or a repeat of a bar or speed mark;
    - a repeat or gap with nothing to apply to;
    - an unexpected character;
    - a script with no syllables.

---

## 10. The jathi judge

`judgeJathi(text)` parses the script, runs a **correctness gate**, then scores **six craft aspects** that total 100. If any gate check fails, the total is capped at 49 and the grade is "Not yet correct".

### 10.1 Correctness gate

| Check | Passes when |
| --- | --- |
| Span and landing | The landing falls where `land:` says, after the stated avartanams. Otherwise the judge reports the exact shortfall or surplus (in matras, or a fraction of an akshara). Without `avartanams:`, it infers the cycle if the landing is on a sam, or names the nearest sams. |
| Nothing after the landing | No karvai trails a jathi that lands on sam or +n. |
| Bars | Every `\|` is on an anga line and every `\|\|` on an avartanam line. Each misplaced bar is reported as so many matras early or late, at a line and column. |
| Opens at the eduppu | The first event is a syllable, not a karvai. Otherwise the first sound comes after the declared eduppu, and the fix suggests removing the opening karvai and moving the eduppu. |
| Teermanam | The jathi ends with a teermanam: a `{…}` block, or three equal phrases at the end with equal gaps. Unequal gaps, or no teermanam, fail. |

### 10.2 Craft aspects

| Aspect | Points | How they are earned |
| --- | --- | --- |
| Rhythmic integrity | 20 | **8** for how soon phrases return to the beat: the longest stretch between phrase starts on a beat is ≤ 3 aksharas (8), ≤ 4 (6), ≤ 6 (3), longer (0). **4** for karvai placement: −2 if the jathi opens on a karvai, −1 if a body karvai lasts more than an akshara. **4** for speed changes: −2 for each change off the beat, −1 for each speed above twice the nadai. **4** if each teermanam statement starts at the same point in the beat (2 if not, 1 with no teermanam). |
| Structure and form | 20 | Ends with a teermanam (8), nothing after it (3), teermanam takes 15–60% of the jathi (5, else 2), at least an akshara of body (2), `avartanams:` stated (2, else 1). |
| Teermanam quality | 15 | Three equal statements with equal gaps (8), a closing syllable at the end (3), gap no longer than the phrase (2), a phrase of 3+ matras opening on a strong syllable (2). |
| Sollu idiom | 15 | 5 × the share of known syllables; 5 × the share of phrases (2+ syllables) that are library groups, suffixes of them, or up to three joined; 5 × the share of on-beat syllables that are strong or start a phrase. |
| Variety and creativity | 15 | Distinct phrase lengths: 3+ (5), 2 (3), 1 (1). Yati: a shaped, derived yati (4), shaped but not derived (3), sama or vishama (2), none (0). Phrase repetition: distinct/total ≥ 0.4 (3), ≥ 0.25 (2), lower (1). Some cross-rhythm, karvai or speed change (3, else 1). |
| Danceability | 15 | Sounding share 60–95% (5), 45–100% (3), else (1). Longest unbroken run ≤ 2 avartanams (4), ≤ 3 (2), longer (0). No phrase over 9 syllables (3, else 1). Top speed ≤ 2 × nadai (3), ≤ 3 × (1), faster (0). |

**Grades:** 85 and above is Excellent; 70–84 Good; 55–69 Fair; below 55 Needs work.

**Yati detection.** The judge scans runs of consecutive body phrases of two or more syllables, in windows of three or more, and classifies each window's lengths:

- **sama:** all equal;
- **gopuccha:** strictly decreasing;
- **srotovaha:** strictly increasing;
- **mridanga** and **damaru:** at least five phrases, at least two steps on each side of the peak or valley, and a plateau of at most two.

A window is **derived** when each phrase is a prefix or suffix of its neighbour. The best window wins, by shape weight (mridanga and damaru 3, gopuccha and srotovaha 2, sama 1) plus 4 if derived.

### 10.3 Fix suggestions

Fix suggestions are computed from the arithmetic, not written in advance. If the jathi is d matras short, the judge suggests one or more of:

- add d karvai matras before the teermanam;
- if d is even, widen the teermanam gap by d / 2 (the gap occurs twice);
- if d is a multiple of 3, lengthen the teermanam phrase by d / 3 syllables (the phrase occurs three times);
- start d matras earlier.

The surplus case mirrors these. When a bar is misplaced, the first suggestion points to the first misplaced bar, because that is where the counting went wrong. It also says when fixing that bar fixes the span.

Example, `examples/short.jathi` (the guide example with one karvai removed):

```
$ node bin/vocal-gym.js judge examples/short.jathi
Chatusra jati Triputa (Adi) · nadai 4 · 2 avartanams

Score 49/100 · Not yet correct (capped at 49 until the gate passes)

Correctness gate
  FAIL Span and landing: The last syllable "thom" falls at cycle 2, akshara 8 + 3 matras. It should fall on sam after 2 avartanams: the jathi is 1 matra short.
  pass Opens at the eduppu: The first syllable sounds at the eduppu.
  pass Nothing after the landing syllable: The jathi stops on its landing syllable.
  FAIL Bars match the tala: Line 11, column 14: "|" falls at cycle 1, akshara 6 + 3 matras. It is 1 matra early: the phrases before it are 1 matra short. ...
  pass Teermanam: The final phrase repeats three times with equal gaps of 3 matras.

What to change
  1. Start with line 11: the phrases before the bar there are 1 matra short. Fixing that also fixes the span.
  2. Add 1 matra of karvai (,) just before the teermanam.
  3. Or start 1 matra earlier: eduppu -1.
```

The weights are a starting point. They should be calibrated against teachers' marks (see [Research programme](#17-research-programme)).

---

## 11. The jathi generator

`jathi({ tl, nadai, avartanams, offset = 0, yatiPref = 'auto', land = 'sam', T = 1, seed })`:

1. **Arithmetic.** It computes `M = avartanams · tl.total · nadai − offset` and S. It returns `{ error }` with a message in three cases:
   - an eduppu of a whole avartanam or more;
   - a span under 6 matras;
   - no teermanam that fits the span with the chosen yati. The shortest teermanam is 15 slots, so this is the refusal users actually meet, for example one avartanam of a short tala.
2. **Enumerate structures.** It lists every combination of teermanam phrase, gap q from 0 to 4, and yati block that fits S exactly with a non-negative body.
   - **Teermanam phrases:**

     | Phrase | F | N |
     | --- | --- | --- |
     | tha dhi gi na thom | 0.8 | 0 |
     | tha ka tha dhi gi na thom | 0.4 | 0.2 |
     | tha , dhi , gi na thom | 0 | 0.6 |
     | tha ka dhi mi tha dhi gi na thom | 0.1 | 0.3 |
   - **Yati blocks** are cut from library phrases of five or more syllables by dropping 1 or 2 syllables from the front, 3 or 4 times:
     - gopuccha: the phrases in decreasing length;
     - srotovaha: reversed;
     - mridanga: up, then down (3, 5, 7, 5, 3);
     - damaru: down, then up (7, 5, 3, 5, 7);
     - sama: 3 or 4 repeats of a 3- to 5-syllable phrase.
3. **Choose a structure** with score `(1 − c) F + c N`.
   - F rewards teermanam statements that start on beats, small gaps, a body of at least a beat that fills whole beats, no yati or a sama yati, and a teermanam near a third of the span.
   - N rewards shaped yatis (mridanga and damaru most), gapped teermanams, and statements or bodies that walk across the beat.
4. **Fill the body** with sollu groups summing exactly to what is left.
   - F favours beat-length groups that end on beats, and repetition.
   - N favours odd lengths, groups crossing the beat, and variety.
   - Both avoid single syllables and *thom* inside the body.
5. **Export** the result as JathiScript (`res.script`), with bars where an anga or avartanam line falls between phrases, so it can be judged or edited.

---

## 12. Module C: kalpana swaras

Version 0.3 changes the generator in four ways: raga profiles drive it, jumps need a reason, the round lands next to the swara the composition resumes on, and a mora is three similar statements rather than three identical ones. The plan is `docs/plans/kalpana-v0.3.md`; the code is in `src/engine/kalpana/`.

### 12.1 What the generator guarantees

`kalpanaRound(raga, { aksharas, perAkshara, startPitch, eduppuPitch, T = 1, seed, ending = 'auto', moraStyle = 'auto', allowExceptions = false })` returns a round of exactly `aksharas × perAkshara` slots, or `{ error, code }`. Every round:

- starts on `startPitch` and ends on a **legal neighbour of the eduppu swara** `eduppuPitch` (12.5), never on the eduppu itself;
- stays between mandra Pa (−5) and tara Pa (19);
- obeys the raga's direction rule on every step (documented exceptions only with `allowExceptions`, 12.2);
- contains no hard-avoid subsequence from the raga profile;
- outside attested phrases, contains no leap wider than a major sixth except the octave, and below T = 1.5 no leap wider than a fifth, no tritone, no leap onto an alpa swara and no two leaps in a row in one direction (12.4).

Error codes are `bad-length`, `start-not-in-raga`, `eduppu-not-in-raga`, `eduppu-out-of-range`, `no-neighbour`, `unreachable` and `bad-mora-style`. `kalpana(raga, opts)` is the same call returning `null` instead of an error, as in v0.2. `targetPitch` keeps its v0.2 meaning (the last swara itself) and is deprecated; when both are given, `eduppuPitch` wins. `ending: 'mora'` falls back to a free ending when no mora fits, and the result says so (`ending.fallbackFrom === 'mora'`).

### 12.2 Raga profiles and devices

**Profiles.** `data/raga-profiles.json` holds sourced swara roles, phrases and avoid lists for the 86 ragas; `docs/raga-profiles.md` documents it and `docs/research/raga-profiles-report.md` is the research behind it. `npm run profiles` validates it and compiles what the generator needs into `src/engine/data/profiles.generated.js`: landing, nyasa, jiva, alpa, not-nyasa and avoid-landing swaras, janta and dattu tags, phrase confidence, the phrases that obey the direction rule with weight ≥ 0.15, the documented exceptions, avoid subsequences and the cited sources. `getProfile(ragaId)` reads it; `setProfiles(table)` swaps it (tests, future teacher-edited profiles). 32 ragas have usable phrases; 2 have roles only; 52 have neither and fall back to the generic devices.

**Generic devices** are short cells written as steps through the raga's union scale, each in an upward and a downward form. F0 and N0 are the built-in familiarity and novelty weights; examples are in Kalyani from Sa:

| Id | Name | Kind | F0 | N0 | Steps `[step, duration]` | Example |
| --- | --- | --- | --- | --- | --- | --- |
| step | step | step | 0.2 | -0.2 | `[[1,1]]` | R |
| skip | skip | step | 0.0 | 0.2 | `[[2,1]]` | G |
| hold | held step | step | 0.1 | -0.1 | `[[1,2]]` | R , |
| run3, run4, run5 | run | conv | 1.0, 1.1, 0.9 | -0.4, -0.5, -0.5 | 3 to 5 steps up | R G M P |
| janta, janta3 | janta | conv | 0.9, 0.8 | -0.2, -0.3 | `[[1,1],[0,1],…]` | R R G G |
| dattu | dattu | conv | 0.7 | 0.1 | `[[2,1],[-1,1],[2,1],[-1,1]]` | G R M G |
| turn | turn | conv | 0.6 | 0.0 | `[[1,1],[1,1],[-1,1]]` | R G R |
| seq3, seq3x3, seq4 | sequence | conv | 1.1, 1.0, 1.0 | -0.3, -0.4, -0.4 | groups of three or four | R G M G M P |
| cad | run into a held swara | conv | 0.9 | -0.3 | `[[1,1],[1,1],[1,2]]` | R G M , |
| leap3, leap4 | leap | nov | -0.6, -1.0 | 0.8, 1.0 (−0.3 in use) | `[[3,1]]`, `[[4,1]]` | M, P |
| arp | arpeggio | nov | -0.4 | 1.0 | `[[2,1],[2,1],[2,1]]` | G P N |
| leapfill | leap and fall back | nov | -0.3 | 0.9 | `[[3,1],[-1,1],[-1,1]]` | M G R |
| zigzag | zig-zag | nov | -0.8 | 1.1 | `[[2,1],[-3,1],[2,1]]` | G Ṇ R |
| synco | syncopated hold | nov | -0.3 | 0.7 | `[[1,2],[1,1]]` | R , G |
| skipjanta | displaced janta | nov | -0.2 | 0.8 | `[[2,1],[0,1],[-1,1],[0,1]]` | G G R R |

**Phrase devices** have absolute pitches from the profile. Each compiled phrase gives:

| Variant | Pitches | Kind | F0 | N0 |
| --- | --- | --- | --- | --- |
| whole | as written; a karvai lengthens the swara before it | `phrase` | 2.0 × weight × type × confidence | −0.5 |
| octave ±1 | ±12, only when the octave was inferred and every swara stays in range | `phrase` | 0.8 × whole | −0.5 |
| fragment | every window of 3 to 5 swaras of a phrase of 5 or more | `phrase-fragment` | 0.6 × whole | −0.2 |
| sequence | the whole or a fragment shifted one place along the scale; legal and not itself attested | `phrase-variant` | 0.3 × whole | +0.6 |
| inversion | a fragment's contour mirrored around its first swara; T ≥ 1 only | `phrase-variant` | 0 | +0.9 |

Type factors: signature 1.0, ending 0.9, janta and dattu 0.8, connective 0.6. Confidence factors: high 1.0, medium 0.8, low 0.5. Variants are the **out-of-the-box phrases**: rooted in the raga's idiom but not attested, and counted as novelty. A phrase device can start from the current swara when the step into its first swara is legal (and not a repeat, unless the phrase opens with a janta); its own steps are its licence. With `allowExceptions`, the 10 documented direction-rule exceptions in range (anya swaras such as Bilahari's N₂, and vakra steps) are offered whole, checked only at entry and exit; without it no anya swara ever appears.

Phrase devices sit in the same reachability tables as the generic cells, grouped by their entry condition, so feasibility stays exact. The tables are built once per raga, profile and mode and cached.

### 12.3 Scoring

Every choice is scored `(1 − c) · F + c · N` (section 6). On top of the device's F0 and N0:

| Context | Effect on F | Effect on N |
| --- | --- | --- |
| Generic conventional device, phrase confidence high / medium / low or none | F0 × 0.5 / 0.7 / 1.0 | — |
| Janta or dattu device when the profile says the raga avoids / suits it | × 0.2 / × 1.2 | — |
| Starts on a beat / off the beat | +0.6 / −0.4 | — / +0.5 |
| Fills whole beats / odd length (2+ slots per beat) | +0.4 | — / +0.4 |
| Same generic device and direction as the previous one | +0.5 | −0.4 |
| Literal repeat of the previous device | +0.2 | −1.0 |
| A phrase already used in this round | −0.8 | — |
| Held swara on a profile landing swara, ending on a beat (S and P without a profile) | +0.6 | otherwise +0.3 |
| Held swara the profile says not to rest on / held alpa swara | −0.4 / −0.3 | — |
| Jiva swaras in the device | +0.2 each, at most +0.4 | — |
| Soft avoid subsequence created | −1.0 | — |
| Distance from `centre = clamp((start + final) / 2 + 2, 2, 10)` | −0.06 per semitone | — |
| Generic device leaving the octave between Sa and tara Sa | −0.3 | +0.5 |
| Reverses the previous device's direction | — | +0.3 |
| Leap terms (12.4) | see there | — |
| A move the raga's attested phrases never make (12.4) | −0.8 for a leap, −0.15 for a step | — |
| Each semitone a leap spans beyond a major third (not the octave) | −0.15 | — |
| Jumping into a phrase from two or more places away | −0.3 per extra place (−0.6 for a variant) | — |

The last three are **idiom terms**. They keep at least half their weight at every temperature (`score = (1 − c) · F + c · N + (1 − c / 2) · I`), so high creativity means out-of-the-box phrases of the raga, not jumps it never makes.

**The phrase-share controller** keeps rounds predominantly characteristic. It tracks the share of slots so far from `phrase` and `phrase-fragment` devices against `target(T) = 0.70 − 0.20 T`. Below target, phrase devices gain `0.8 · (target − share) · 4` on the score; above it they lose the same, and variants and unconventional devices gain it scaled by c, so a round at T = 0 fills the rest with conventional devices rather than novelty.

### 12.4 Reasoned jumps

A **step** moves one place in the raga's union scale; a **leap** moves two or more, including the move from one device into the next. A leap is **licensed** when it lies inside an attested phrase or fragment, lands on a structural swara (S, P, or a profile nyasa, jiva or landing swara) and is no wider than a fifth, is a fourth, fifth or octave, or lies inside an arpeggio at T ≥ 1. A resting swara does not excuse a seventh: before 0.3.1, Kalyani rounds could open S → N (11 semitones) straight into a phrase fragment because N is a Kalyani nyasa swara. A leap is **resolved** when, within the next two swaras, the line steps back the other way or holds the swara it leapt to.

- **Hard, outside attested phrases, in three levels.** Level 2 (T < 1.5): no leap wider than a fifth except the octave, no tritone, no leap onto an alpa swara, no two leaps in a row in one direction. Level 1 (T ≥ 1.5): no leap wider than a major sixth except the octave. Level 0: no filter. The size, tritone and alpa rules are filters in the device tables. For the double-leap rule, the reachability tables carry the class of the move that arrived on each swara (a step, a leap up, a leap down), so it holds across device and mora junctions too.
- **Relaxation:** if a filter makes a short span infeasible, the round is rebuilt one level lower and `stats.relaxed = 'leaps'`. No span fails that unfiltered generation could fill.
- **The raga's idiom.** Every move the raga's attested phrases make (pitch class to pitch class, up or down), plus the steps of its scale, forms the raga's idiom. Moves outside it cost familiarity, leaps most (12.3), and so does every semitone of a leap beyond a major third, in every raga.
- **Soft, on F:** unlicensed leap −1.5; unresolved leap −0.6; same-direction double leap −2.0; −1.0 for each unlicensed leap beyond the budget (0, 0.5, 1, 2, 3 per 8 slots at T = 0, 0.5, 1, 1.5, 2); −0.8 for each semitone by which an akshara spans more than 9 (T < 1) or 12 semitones.

`stats.leaps` is `{ total, licensed, unlicensed, unresolved, perEight, outsidePhrases: { tritone, wide, large, alpa, double, overFifth }, list }`, one list entry per leap with its licence.

### 12.5 Landing next to the eduppu

The eduppu swara `e` is where the composition resumes; the singer sings it, the round does not. With the arohana and avarohana extended across octaves:

- the **lower neighbour** `lo(e)` is the arohana swara just before `e`, so the singer rises into it (only if `e` is in the arohana);
- the **upper neighbour** `hi(e)` is the avarohana swara just before `e` in descent, so the singer falls into it (only if `e` is in the avarohana).

| Raga | Eduppu | Lower neighbour | Upper neighbour |
| --- | --- | --- | --- |
| Kalyani | S | Ṇ | R |
| Kalyani | P | M₂ | D |
| Mohanam | P | G | D |
| Mohanam | S | Ḍ | R |
| Saveri | M | R (G is not in the arohana) | P |
| Saveri | G | — | M (descent only) |
| Hamsadhwani | S | Ṇ | R |

`eduppuNeighbours(raga, e)` returns `{ lo, hi }`. The final swara must be one of them, inside the range. When both can finish, the choice is scored mildly: +0.4 for a landing or nyasa swara, +0.3 for approaching S or P from above, +0.3 for approaching a jiva swara from below. `ending.approach` records `'above'` or `'below'`.

### 12.6 Graded mora

A mora is three statements S1, S2, S3 separated by two equal karvai gaps q:

| Style | Statements | Lengths | Total |
| --- | --- | --- | --- |
| `shift` | the same contour, one scale step nearer the eduppu each time | u, u, u | 3u + 2q |
| `gopuccha` | shifted, and one swara dropped from the front each time | u, u − 1, u − 2 | 3u − 3 + 2q |
| `srotovaha` | shifted, and one swara added at the front each time | u, u + 1, u + 2 | 3u + 3 + 2q |
| `identical` | v0.2: one statement three times, only on request | u, u, u | 3u + 2q |

Construction, all exact:

1. **Landing.** S3 ends on the chosen neighbour `f` of the eduppu.
2. **Contour.** Templates come, in order of familiarity, from windows of attested phrases that end with a step, the ends of ending phrases, then generic runs, turns and dattu.
3. **S3** is realised backward from `f`; every step must be legal.
4. **S2 and S1** are S3 shifted one and two places toward the eduppu's register (down when the mora starts above it), then trimmed or grown for gopuccha and srotovaha. In asymmetric ragas a shift that breaks the direction rule tries one place further, then a projection (`makeProjector(raga).repair`) that may change at most one swara per statement; such moras are marked `adjusted`. The opposite direction is allowed at T ≥ 1.
5. **Junctions.** The last swara of one statement, held for 1 + q slots, must step legally into the first of the next, and not repeat it.
6. **Arithmetic and feasibility.** q runs from 0 to 2 × slots per beat; the mora takes at most 60% of the round and leaves a body of at least max(2, one beat), from which some reachable state steps legally into S1.
7. **Score.** F: +1.0 for a contour from an attested phrase, +0.6 stepwise, +0.9 if all three statements start on beats, +0.3 for `shift`, +0.3 for a gap within one beat, minus leap penalties. N: +0.5 generic contour, +0.5 opposite direction, +0.6 gopuccha or srotovaha, +0.7 off-beat statements.

`moraStyle: 'auto'` picks among shift, gopuccha and srotovaha by score and never picks identical. A mora is considered for `ending: 'mora'`, or under `auto` for rounds of at least 7 aksharas, and only with at least 8 slots; under `auto` the choice between mora and free is weighted `mora: (1 − c) · 1.0` against `free: c · 0.6`. `ending` is `{ type: 'mora', style, statements, q, start, approach, adjusted, template, templatePhrase, direction, phrase }`, where `phrase` (the last statement) is kept for v0.2 callers.

### 12.7 Building a round

1. **Landing.** Work out `lo(e)` and `hi(e)` (or take `targetPitch`).
2. **Forward reachability** from the opening swara (held 1 or 2 slots), over states (slot, swara, arriving move class).
3. **Ending.** Collect the moras for each neighbour, choose the neighbour, then mora or free.
4. **Backward feasibility** for the body.
5. **Sampling.** Left to right, among devices that keep the round finishable, with weights `exp(score / τ)`. Scores are computed in two passes, an upper bound and then the exact leap, register and avoid terms, until the remaining bounds are more than 15τ below the best.

The result lists `units` (each with `kind`: `start`, `step`, `conv`, `nov`, `phrase`, `phrase-fragment`, `phrase-variant` or `mora`; phrase units also carry `phraseId`, `source`, `type` and `variant`) and `stats`: `phraseShare`, `variantShare`, `novelShare` (unconventional devices plus variants), `convShare` (conventional devices, attested phrases and the mora), `profileCoverage` (`phrases`, `roles-only` or `none`), the phrases used with their sources, device counts, `leaps` and `relaxed`.

### 12.8 Measured

Acceptance numbers from the test suite (the tests print them):

| Check | T = 0 | T = 1 | T = 2 |
| --- | --- | --- | --- |
| Phrase share, 27 ragas with phrase confidence high or medium, 1 avartanam of Adi at 2 per beat, free ending | 0.63 | 0.41 | 0.24 |
| The same with `auto` endings, where the mora takes about half the round | 0.29 | 0.32 | 0.19 |
| Novelty (variants and unconventional devices), same rounds, free ending | 0.09 | 0.34 | 0.57 |
| Moves in the raga's idiom, 32 ragas with phrases | 97% | 90% | 75% |
| Leaps in the raga's idiom | 79% | 49% | 27% |
| Leaps wider than a fifth outside phrases, 86 ragas (wider than a sixth: 0 at every T) | 0 | 0 | 97 in 516 rounds |
| Unlicensed leaps per 8 slots, 86 ragas × 10 seeds | 0.06 | 0.22 | 1.00 |
| Unresolved leaps, share of all leaps | 6% | 15% | 42% |
| Tritones, same-direction double leaps, leaps onto alpa swaras | 0 | 0 | allowed |
| Hard-avoid subsequences | 0 | 0 | 0 |

Before 0.3.1 the same idiom measure gave 85%, 78% and 71% of moves and 44%, 27% and 23% of leaps, and 125 leaps wider than a fifth at T = 0 in those ragas, against 30 now, all inside attested phrases.

- **Landing:** 2,022 rounds over 86 ragas (every swara as the eduppu, plus tara S, 3 seeds) all end on `lo(e)` or `hi(e)`, step legally into it, and never end on it.
- **Mora:** 1,032 moras over 86 ragas: 642 shift, 277 gopuccha, 113 srotovaha; 345 from attested contours; no two statements identical; equal gaps, legal junctions and exact arithmetic in all of them; 6 with one projected swara.
- **Phrases:** at T = 0, an attested phrase or fragment appears in 20 of 20 rounds in each of Kalyani, Todi, Mohanam, Hamsadhwani and Hemavati. Every phrase unit matches its profile pitches (or an octave shift where the octave was inferred), and every fragment is a window of its phrase.

Kalyani, Adi, second speed, from Sa, resuming on Pa, seed 3 (from `vocal-gym kalpana`):

```
T 0   S R G M P , D Ṡ | Ṙ Ṡ N Ṡ | N D N D → eduppu P
      dattu fragment of mela65#10 (S143), held step, step, shift mora Ṡ Ṙ Ṡ · N Ṡ N · D N D landing on D (above P)
T 2   S , Ṇ , Ḍ Ṇ , Ḍ | Ṇ Ḍ G M | S R M D → eduppu P
      syncopated hold, a fragment of mela65#13 (S144), an inversion of mela65#15, two skips; 38% attested, 19% variants
```

Two avartanams at T = 0 resuming on Sa (seed 3) open with the whole dattu phrase mela65#13 (`R G R Ṇ , Ḍ Ṇ Ḍ G R S Ṇ Ḍ`, source S144) and end with the shift mora `D P M , , · P M G , , · M G R` landing on R. In such rounds the body before the mora is about three quarters attested phrases; the round as a whole is about 40%.

---

## 13. Library API

Everything is exported from `src/engine/index.js`. In the browser, the same API is on `window.VGEngine`.

### Randomness and the dial

| Export | Description |
| --- | --- |
| `rng(seed) → () => number` | mulberry32 generator in [0, 1) |
| `soft(scores, tau, rand) → index` | Softmax sample |
| `pick(items, scoreFn, T, rand)` | Legacy helper: argmax when T ≤ 0.05, else softmax |
| `dial(T) → { T, c, tau }` | Temperature (clamped to [0, 2]) to tilt and width |

### Ragas

| Export | Description |
| --- | --- |
| `allRagas() → { melakartas: Raga[72], janyas: Raga[14] }` | Every encoded raga |
| `melakarta(n) → Raga` | Melakarta n, with `mela`, `chakra`, `kind: 'melakarta'` |
| `melaLabels(n) → string[]` | Swarasthana labels, e.g. `['S','R1','G3','M1','P','D1','N3']` |
| `defineRaga(id, name, aroLabels, avLabels, meta) → Raga` | Build your own, e.g. `defineRaga('hamsanadam', 'Hamsanadam', ['S','R2','M2','P','N3',"S'"], ["S'",'N3','P','M2','R2','S'], { kind: 'janya', parent: 60 })` |
| `SEMI`, `MELA_NAMES`, `CHAKRA`, `JANYA` | Constants |

A `Raga` is `{ id, name, aro: number[], avaro: number[], labels: { pitchClass: label }, cls: 'audava–sampurna', kind, mela?, chakra?, parent? }`. Arohana pitches run from 0 to 12 and avarohana pitches from 12 down to 0.

### Talas

| Export | Description |
| --- | --- |
| `tala(family, L) → Tala` | `family` is one of `dhruva matya rupaka jhampa triputa ata eka` with L 3, 4, 5, 7 or 9, or `chapu` with L 3, 5 or 7. Throws on anything else |
| `customTala([3, 2, 2]) → Tala` | A tala from counts |
| `angaStarts(tl) → Set<number>` | Akshara positions of anga lines, including 0 and the total |
| `FAM`, `DEFJ`, `JATI`, `CHAPU` | Family patterns, default jatis, jati names, chapu counts |

A `Tala` is `{ fam, L, angas: [{ type: 'L'|'O'|'U'|'C', len }], total, name }`.

### Projection

| Export | Description |
| --- | --- |
| `makeProjector(raga) → { aroExt, avExt, nA, nD, valid, repair }` | See section 5 |
| `mod12(p)` | Pitch class |

### Alankaras

| Export | Description |
| --- | --- |
| `PDF_ALANKARA[family][L] = [ref, ascLine, descLine]`, `PDF_JATI`, `PDF_FAM` | The sheet, and the sheet's spellings of jati and family names |
| `pdfEntry(family, L) → { ref, asc, desc, title }` | One sheet entry |
| `pdfMotif(family, L) → Motif` | The sheet's first line as a motif (alias `canonicalMotif`) |
| `parseSwaraLine(text) → { notes: Motif, bars, total }` | Parse a line in the sheet's notation |
| `alankara(raga, tl, motif) → { lines: [{ dir, k, notes: [{ p, dur, adjusted }] }], span, adjustedCount, infeasible, slotsPerLine }` | A motif through the whole raga |
| `newMotif(tl, { T, seed, span, avoid, minDiff }) → { motif, diff, minDiff, span, attempts, widened, relaxed, enumerated? } \| null` | A new pattern (span defaults to the sheet's) |
| `alankaraSeries(family, L, count, { T, seed, span }) → [{ motif, source }]` | The sheet line followed by `count` distinct new patterns |
| `sampleMotif(tl, span, c, tau, seed)`, `generateMotif(tl, span, T, seed)` | Raw exact samplers |
| `enumerateMotifs(tl, span, limit) → { motifs, complete }` | Every legal motif, up to `limit` |
| `motifScore(motif, tl, c)` | A motif's total score under the sampler |
| `motifReport(motif, tl) → { familiarity, conventionality, devices }` | Description and conventionality |
| `motifKey`, `motifSpan`, `motifSlots`, `hamming`, `FAMILIAR`, `moveKeys`, `motifKeys`, `moveNovelty`, `moveScore`, `motifFamiliarity`, `pdfFamScores` | Internals, exported for research |

A `Motif` is `[{ d: scaleDegree, dur: 1 | 2 }]`.

### Kalpana

| Export | Description |
| --- | --- |
| `kalpanaRound(raga, { aksharas, perAkshara, startPitch, eduppuPitch, T, seed, ending: 'auto'\|'mora'\|'free', moraStyle: 'auto'\|'shift'\|'gopuccha'\|'srotovaha'\|'identical', allowExceptions })` | Returns `{ notes: [{ p, dur }], slots, units, ending, stats, dial }` (section 12), or `{ error, code }` |
| `kalpana(raga, opts)` | The same, returning `null` instead of an error. `targetPitch` (the last swara itself) is deprecated but still accepted; `eduppuPitch` wins when both are given |
| `eduppuNeighbours(raga, e) → { eduppu, lo, hi, inRange } \| { error, code }` | The legal neighbours of an eduppu swara (12.5) |
| `getProfile(ragaOrId) → Profile \| null`, `setProfiles(table \| null)`, `getSource(id) → { title, url, reliability } \| null` | The compiled raga profiles (12.2) |
| `CELL_DEFS`, `CELLS` | The generic device catalogue (upward and downward forms) |

### Jathis

| Export | Description |
| --- | --- |
| `jathi({ tl, nadai, avartanams, offset, yatiPref, land, T, seed })` | Returns `{ segs: [{ role: 'body'\|'yati'\|'teermanam'\|'gap', syl }], slots, M, cycle, g, offset, avartanams, used, land, plan, audit, script }`, or `{ error }`. `yatiPref` is `auto`, `none`, `sama`, `gopuccha`, `srotovaha`, `mridanga` or `damaru` |
| `parseJathiScript(text)` | Returns `{ ok, errors, warnings, tl, nadai, kalai, avartanams, eduppu, land, cycleTicks, matra, E0, events, units, bars, speeds, teers, total }` |
| `judgeJathi(textOrParsed)` | Returns `{ ok, gate, gatePass, aspects: [{ id, name, score, max, notes }], total, cap, grade, fixes, teer, yati, warnings, avartanams, parsed }`, or `{ ok: false, errors }` |
| `jathiToScript(res, tl, opts) → string` | Export a generated jathi |
| `talaSpec(tl)`, `parseTalaSpec(text) → { tl } \| { error }`, `JATI_WORDS`, `FAM_WORDS`, `JATI_NAME` | Tala names in JathiScript, and the words it accepts |
| `tokenizeLine(text, line)` | The JathiScript tokenizer, for editors and syntax highlighting |
| `SOLLU`, `ALIAS`, `KNOWN`, `HEAVY`, `CADENCE`, `LIB`, `norm`, `idiomatic`, `splitCompound` | Vocabulary |
| `TEER`, `yatiBlocks`, `TICKS`, `fmtTicks`, `JATHI_EXAMPLES` | Constants and helpers |

---

## 14. Command line

```
node bin/vocal-gym.js <command> [options]     # or: npm link, then vocal-gym <command>
```

| Command | Purpose |
| --- | --- |
| `ragas` | List the 86 encoded ragas |
| `talas` | List the 35 suladi talas and the chapu talas |
| `sheet [--tala "misra jhampa"]` | The sheet's first lines |
| `alankara --raga R --tala T [--new N] [--temp T] [--seed S] [--span s] [--speed 1\|2\|4] [--numbers]` | The sheet pattern through the raga, then N new patterns |
| `kalpana --raga R --tala T [--aksharas K] [--per 1\|2] [--start S] [--eduppu-swara P] [--ending auto\|mora\|free] [--mora-style auto\|shift\|gopuccha\|srotovaha\|identical] [--allow-exceptions] [--temp T] [--seed S]` | One round, with its devices and their phrase sources, the phrase share, the mora style and the leaps. `--land X` (deprecated) ends on X itself |
| `jathi --tala T [--nadai 4] [--avartanams 2] [--eduppu 0] [--yati auto] [--land sam\|end] [--temp T] [--seed S] [--script]` | Generate; `--script` prints JathiScript |
| `judge <file \| -> [--json]` | Judge a JathiScript file (exit code 1 if the gate fails) |
| `example <adi\|short\|chapu\|speed>` | Print a worked example |

**Arguments:**

- **Ragas** can be given by mela number (`15`), id (`mela15`, `mohanam`) or name (`kalyani`, `Mayamalavagowla`).
- **Talas** use JathiScript tala names.
- **Swaras** for `--start`, `--eduppu-swara` and `--land` are letters (`S`, `P`, `S'` for tara Sa, `N.` for mandra Ni). The default eduppu is Pa (tara Sa in ragas without Pa).

```
$ node bin/vocal-gym.js alankara --raga kambhoji --tala "chatusra dhruva"
Kambhoji · janya of 28 Harikambhoji · shadava–sampurna
  arohana S R₂ G₃ M₁ P D₂ Ṡ   avarohana Ṡ N₂ D₂ P M₁ G₃ R₂ S
Chatusra jati Dhruva · |4 O |4 |4 = 14 aksharas

Variation 0 · sheet 1.1 Chaturashra Jāti Dhruva Tāḷa (adapted to Kambhoji)
S R G M | G R | S R G R | S R G M ||
R G M P | M G | R G M G | R G M P ||
G M P D | P M | G M P M | G M P D ||
M P D Ṡ | D P | M P D P | M P D Ṡ ||
Ṡ N D P | D D | Ṡ N P D | Ṡ N D P ||
...
  8 swaras adjusted to keep the raga's direction rules

$ node bin/vocal-gym.js jathi --tala adi --temp 0
Chatusra jati Triputa (Adi) · nadai 4 · 2 avartanams · eduppu sam · T 0 · seed 5

tha ri ki ta  tha ka jho nu  ki ta tha ka  tha ka dhi mi | tha ka jho nu  ki ta tha ka | ki ta tha ka  tai ya tai ya ||
tha ri ki ta  tha ri ki ta  tha ri ki ta  THA DHI GI NA | THOM , , ,  THA DHI GI NA | THOM , , ,  THA DHI GI NA ||
THOM

2 × 8 aksharas × 4 matras (eduppu on sam) = 64 matras to sam
body 32 + yati 12 (sama (4 → 4 → 4)) + teermanam 3 × 5 + 2 × 3 = 21 = 65 slots
judge: 92/100 · Excellent   (teermanam in capitals; --script prints JathiScript)

$ node bin/vocal-gym.js jathi --tala "misra chapu" --eduppu -2 --script > mine.jathi
$ node bin/vocal-gym.js judge mine.jathi
```

---

## 15. Web pages and the build

| Page (`site/`) | Content |
| --- | --- |
| `index.html` | Landing page |
| `playground.html` | The three demos with a short guide and a JathiScript cheat sheet |
| `research-plan.html` | The full research and build plan, with the same demos inline |
| `pitch.html` | The pitch deck |
| `vocal-gym-engine.js` | The browser bundle of the engine |

The research plan covers: verdict, novelty assessment, the engine, Modules A to C in depth, two literature surveys (personal vocal-strain assessment; raga recognition to raga conformance), novel directions, research programme, architecture, project plan, startup assessment, corrections and 77 references.

**The demos** (`web/demo/demo.html` and `demo.js`):

- **Alankara:**
  - raga, tala, speed and the span of new patterns;
  - temperature;
  - New pattern, Previous, Next and Sheet pattern, with the history kept per raga and tala;
  - Play (Web Audio: equal-tempered tones, tala clicks, an optional tanpura drone);
  - Copy notation;
  - an audit of every rule.
- **Jathi, Generate mode:**
  - all 38 talas, nadai, avartanams, atita or anagata eduppu, landing, yati and temperature;
  - Play and Copy;
  - an audit, including the judge's score of the generated jathi;
  - Open in editor.
- **Jathi, Compose and judge mode:**
  - examples and a JathiScript editor that re-judges as you type;
  - a notation grid (teermanam in saffron, phrase boundaries marked);
  - the gate, computed fixes, aspect bars with notes, and warnings;
  - Play.
- **Kalpana:**
  - raga, tala, length, speed, opening swara, the swara the composition resumes on, ending, mora style and temperature;
  - attested phrases in saffron, fragments in lighter saffron, variants in violet italics, the mora in teal; each phrase's title names its source;
  - an audit with the creativity readout, the phrases used and their sources (or "phrase data: none for this raga"), the leaps and their licences, and the mora's style and contour.

**Design.** The palette is midnight indigo with saffron for the voice and teal for the machine. Pages are dark first, with a light variant from `prefers-color-scheme`. Type is Cormorant Garamond, DM Sans and IBM Plex Mono. Colours are tokens in `web/shared/theme.css`.

**The build** (`scripts/build.js`):

1. `data/raga-profiles.json` is validated and compiled into `src/engine/data/profiles.generated.js`, and its size is printed.
2. esbuild bundles `src/engine/index.js` into an IIFE that defines the global `VGEngine` (`dist/vocal-gym-engine.js`); the build prints how much of the bundle the profiles take.
3. Each template in `web/` is expanded:
   - `<!-- @include path -->` and `/* @include path */` insert a file, relative to the template;
   - `/* @engine */` inserts the bundle.
4. The result is written to `site/` as one self-contained HTML file per page.

The build refuses unresolved includes and a bundle containing `</script`. **Edit `web/` and `src/`, never `site/`**, then run `npm run build`.

**Publishing.** Any static host works (GitHub Pages pointed at `site/`, Netlify, an S3 bucket). The pages also work opened from disk.

---

## 16. Tests

`npm test` runs `node --test test/*.test.js`. Each test counts its checked properties, reports the count as a diagnostic, and fails with the first twenty messages.

| File | What it proves | Checks |
| --- | --- | --- |
| `ragas-talas.test.js` | Melakarta formula (12 spot values, ordering, 72 distinct scales, names); the class and parent of every janya, and that each uses only its parent's swaras; tala totals for all 35; chapu; invalid tala arguments; tala-spec parsing and round trips | 647 |
| `alankara.test.js` | **All 35 sheet first lines, ascending and descending, note for note** in Mayamalavagowla; bars on anga lines; row counts equal the sheet's for every tala; all ten lines of 1.1; variation 0 is the sheet. Direction rule on every step of 23,992 lines (217,320 notes) in 86 ragas × 35 talas. 1,248 new patterns: legal, never a repeat, direction-valid in every line, conventionality falling with temperature, the sheet's span by default, every Tisra Eka alternative found, `null` only when all are shown | 310,676 |
| `kalpana.test.js` | The v0.2 sweep (every other melakarta and every janya, 4 lengths, 2 speeds, 3 temperatures, 3 endings): exact length, start, landing, range, direction, three different mora statements with equal gaps, novelty rising with temperature. Eduppu neighbours (the table in 12.5) and 2,022 rounds landing next to every eduppu. Structured errors and backward compatibility. Leap acceptance over 86 ragas × 10 seeds × 3 temperatures; the relaxation over 2,696 short spans. Graded mora acceptance over 1,032 moras and the Mayamalavagowla golden mora | 185,467 |
| `kalpana-phrases.test.js` | Attested phrases at T = 0 in Kalyani, Todi, Mohanam, Hamsadhwani and Hemavati, with every phrase and fragment unit matching its profile; the phrase-share acceptance over the 27 phrase-rich ragas; profile coverage and the fallback with no profile; exceptions only with `allowExceptions`; no erratic jumps (leap-size caps over 86 ragas, the share of moves in each raga's idiom, and the reported Kalyani S → N openings) | 30,983 |
| `raga-profiles.test.js` | The profile file covers the 86 engine ragas with the engine's scales; every phrase parses and its computed flags match; sources and enums are valid; the compiled module is up to date and loads in the engine | 15,973 |
| `jathi.test.js` | 12,417 generated jathis over 38 talas, nadai 3–5, 1–2 avartanams, eduppu −2, 0 and +2, seven yati settings and three temperatures: exact sums, slot formula, yati shapes, threefold teermanam. 2,452 exported to JathiScript all pass the gate (scores 71–100, median 88). 1,947 combinations are refused with a message because no teermanam fits the span with the chosen yati | 50,570 |
| `jathiscript.test.js` | Worked examples (100 for the guide example; the short example fails with a fix at line 11); syntax errors with line and column; compound and vocabulary warnings; land `end` and `+n`; inferred avartanams; kalai; atita and anagata eduppu and their aliases; speed changes; bar errors; missing teermanam; opening karvai; written-out teermanams; trailing karvai; generator–parser round trips | 90 |
| `cli.test.js` | Every command, exit codes, JSON output, piping a generated jathi into the judge; `--eduppu-swara`, `--land`, `--mora-style`, `--allow-exceptions` | — |

Total: 594,406 checked properties, in about 15 seconds on a laptop CPU at full speed (test files run in parallel).

`npm run smoke` loads `site/playground.html` and `site/research-plan.html` in jsdom and drives every preset and control. It runs out of new patterns on Tisra Eka, steps back through history, loads a sheet cell, tries atita chapu, opens the editor, judges every example and a syntax error, checks that kalpana presets land next to their eduppu and that the audit names phrase sources, leaps and every mora style, and switches tabs. It also times 100 Kalyani rounds (best of three; the limit is 1 s at full CPU speed, scaled up by a calibration loop on a throttled machine). It fails on any script error or missing output. `site/pitch.html` and `site/index.html` must load cleanly.

---

## 17. Research programme

The research plan (`site/research-plan.html`) sets out a programme intended to be publishable, built on this engine. Summary:

| Paper | Claim | Venue targets |
| --- | --- | --- |
| P1 · Constraint-guaranteed generation of Carnatic exercises, jathis and kalpana swaras | 100% valid outputs, with temperature as creativity from conventional to unconventional | TISMIR, ISMIR, JNMR |
| P2 · Raga conformance for learners | Phrase-level, open-set scoring with counterfactual violation training localises errors better than recognition-based scores | IEEE/ACM TASLP, TISMIR, ICASSP |
| P3 · Personal vocal-strain estimation from daily phone probes | Personal baselines plus normalised self-supervised embeddings track self-reported strain within singers | Journal of Voice, JASA-EL, JBHI, Interspeech |
| P4 · Closed-loop warm-up prescription | A safe contextual bandit improves next-session readiness over a fixed routine (n-of-1 trials) | Journal of Voice, JSLHR |
| P5 · Kalpana swara tutoring | Graded landing and device drills, plus a creativity ladder, improve landing accuracy and raga adherence | TISMIR Education Track, CHI, NIME |
| D1 · Vocal Gym Practice Corpus | First longitudinal Carnatic practice corpus with strain labels and teacher annotations | NeurIPS Datasets and Benchmarks, TISMIR |

Evaluation hooks already in the engine:

- `motifReport().conventionality` and `kalpana().stats` measure creativity;
- `judgeJathi()` exposes per-aspect scores, ready to calibrate against teachers' marks;
- every output is reproducible from its seed.

---

## 18. Roadmap

| Phase | Months | Scope | Exit criteria |
| --- | --- | --- | --- |
| 1 · Practice core and engine | 0–4 | Session flow, timers, logs and streaks (PWA); drone and all talas with nadai; this engine's three generators and the jathi editor and judge in the app; melakarta and katapayadi explorer; Voice Check recordings (data only); ethics protocol; a teacher panel of 5–8 | 100 weekly users, 3 teachers assigning routines, P1 draft |
| 2 · Listening | 4–10 | On-device pitch tracking (PESTO or CREPE fine-tuned on Carnatic data); drone cancellation using the app's own tanpura as reference; swara transcription; live intonation feedback; raga conformance v1; kalpana tutor levels 1–3 with the swara-name versus pitch check; strain pilot (about 30 singers, 8 weeks) | Under 150 ms latency, teacher agreement above 0.7 |
| 3 · Personalisation | 10–18 | Strain model with conformal intervals; safe bandit warm-up prescriber; kalpana tutor levels 4–6 and korvai coach; teacher dashboard; jathi studio for dance schools; judge calibrated with teachers; papers and dataset release | 2,000 monthly active users, 10% paid, 20 teacher accounts |
| 4 · Expansion | 18–24 | Hindustani packs, a style-agnostic Voice Check, institutions | At least 40% of revenue from institutions and teachers |

**Engine work items:**

- explicit transition tables for vakra ragas;
- phrase-conditional rules for bhashanga ragas;
- more janyas;
- teacher overrides of sheet patterns by bani;
- adavu suggestions per jathi phrase;
- a style prior learned from a nattuvanar's corpus;
- konnakol audio;
- printable notation;
- gamaka-aware playback.

---

## 19. Design decisions and known limitations

- **Rules in tables, taste in scores.** Every hard rule is enforced by feasibility; the scores only rank legal choices. This is what makes "temperature can never produce a wrong answer" true by construction, and it keeps the musical taste (the F and N features) editable without risk.
- **The judge's weights are proposals.** They encode common teaching practice as clear, checkable rules, not a learned model. They should be calibrated against teachers' marks before being used for grading.
- **The direction rule is the raga model.** That is exact for melakartas and straight janyas. It is not enough for vakra ragas (Begada, Sahana and others), bhashanga ragas (Bhairavi, Kambhoji with N₃), or phrase-level grammar and gamaka. Those need transition tables and phrase rules, which are planned.
- **Projection changes a few swaras in asymmetric janyas.** 0.30% of notes, always flagged. Teachers may prefer a different adaptation, which is why changes are shown, not hidden.
- **The familiarity model is first-order.** It learns steps, karvai placement and contour from 35 lines. It does not capture longer devices such as "repeat the laghu's pattern". At T = 0, new patterns are sheet-like but not sheet-identical, by design.
- **"Conventional" and "unconventional" kalpana devices are a curated catalogue.** The classification follows common pedagogy (janta and dattu varisai, runs, sequences, the mora) and should be validated by the teacher panel.
- **Raga profiles are research notes, not a teacher's ear.** Phrases came through summarising fetches and some octaves were inferred (`octaveCertain: false`, so the generator also tries the other octave). 52 ragas have no usable phrases and fall back to generic devices, and the demo says so. A teacher review screen is planned.
- **Phrase share is measured on free endings.** A mora takes about half of a one-avartanam round and is not phrase material, so with `auto` endings the attested share is about 30% at T = 0 even though the body before the mora is about 70% attested.
- **The idiom model is first-order.** It knows which moves a raga's phrases make, not which phrases follow which; ragas without phrase data get only the size cost. Phrase-to-phrase grammar would need longer attested passages.
- **Path-dependent leap rules are soft, except one.** Unlicensed and unresolved leaps, the leap budget and the register cap are scores. The same-direction double-leap ban is exact below T = 1.5 because the tables carry the arriving move's class; the hard-avoid lists are exact for one swara of look-behind and avoided by the sampler for longer junctions.
- **Sollu vocabulary and spellings vary by bani.** Unknown syllables are warnings, not errors, and aliases map common spellings (ta/tha, di/dhi, tom/thom, tei/tai, …).
- **Chapu support covers Tisra, Khanda and Misra.** Sankeerna Chapu is not included because counting conventions for it differ.
- **Playback is a sketch.** Equal temperament, plain tones, no gamakas.

---

## 20. Corrections to earlier material

Earlier pitch and planning documents (before this repository) contained errors that are fixed here:

- **Katapayadi.** An earlier table mapped ca and pa to 1. The correct groups are in [section 4](#4-carnatic-primer-for-engineers).
- **"35 alankaras".** These are the seven sapta tala alankaras extended to all five jatis of each family, not 35 unrelated melodic types.
- **Janya data in the earlier agent brief.**
  - Abheri is a janya of Kharaharapriya (22).
  - Bhoopalam is not Mohanam.
  - Begada's arohana is vakra.
  - Mela 59 is Dharmavati.
- **Alankara templates.** Version 0.1 of the engine derived the five jatis of each family from formulas in the laghu length.
  - Checked against the sheet, the formulas matched in 17 of 35 talas, including all seven default-jati forms.
  - They did not match Adi: the sheet has S R G R | S R | G M, the formula gave S R G M | S R | G M.
  - The Sankeerna forms ran past the octave.
  - The sheet now defines all 35.
- **Invented figures.** An earlier pitch showed accuracy percentages and effect sizes that did not come from studies. They were removed; the research plan's surveys cite what each study reports.

---

## 21. Sources

Musical sources used by the engine:

- *35 Tāla Alankāra-s*, Mayamalavagowla, 15 pp., August 2012. Supplied PDF; document metadata gives the author as "Ravikiran". Transcribed in `src/engine/alankara/sheet.js`.
- NCERT, *Kriti*, Grade 8, ch. 7 (sapta tala alankaram notations); NIOS Carnatic Music, KCM-3 (35 alankaras, five per family).
- [Wikipedia, Melakarta](https://en.wikipedia.org/wiki/Melakarta); [Katapayadi system](https://en.wikipedia.org/wiki/Katapayadi_system); [Janya](https://en.wikipedia.org/wiki/Janya); [Kalpanaswaram](https://en.wikipedia.org/wiki/Kalpanaswaram).
- [Wikipedia, Konnakol](https://en.wikipedia.org/wiki/Konnakol): solkattu groups by length.
- [Mridangams.com, "Yathi"](https://mridangams.com/2007/09/yathi.html): the six yati types, with examples.
- [Narthaki, "Yathi"](https://narthaki.com/info/articles/art499.html): yati as syllables arranged to picture a shape.
- [eambalam, "Eduppu"](https://www.eambalam.com/newsite/glossary/eduppu/): sama eduppu, atita and anagata.
- [CompMusic, "Tāḷa in Carnatic Music: Examples"](https://compmusic.upf.edu/examples-taala-carnatic): eduppu as an offset from sam.
- ["Bharatanatyam Dance Transcription using Multimedia Ontology and Machine Learning" (arXiv:2004.11994)](https://arxiv.org/abs/2004.11994): adavu, sollukattu and tirmana definitions and syllables.
- [Online Bharatanatyam, "Korvai or a Dance sequence"](https://onlinebharatanatyam.com/2010/01/korvai-or-dance-sequence/): teermanam as "the final knot".

Method sources:

- F. Pachet and P. Roy, "Markov constraints: steerable generation of Markov sequences", *Constraints* 16(2), 2011.
- S. Geng et al., "Grammar-Constrained Decoding for Structured NLP Tasks without Finetuning", EMNLP 2023.

The full reference list (77 entries, including the vocal-strain and raga-recognition literature) is in the research plan, `site/research-plan.html#refs`.

---

## 22. Licence

No licence has been chosen yet (`"license": "UNLICENSED"` in `package.json`), so all rights are reserved by the author until one is added. The tala alankara sheet PDF is not included; only the 35 first lines needed by the engine are transcribed, with attribution.
