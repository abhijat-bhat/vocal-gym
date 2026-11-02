# Vocal Gym

Vocal Gym is a daily practice system for Carnatic vocalists and their teachers. The plan is for it to check how your voice is today, choose your warm-up, give you exercises in any raga and tala, listen for where you leave the raga, and coach the hardest skill to practise alone: kalpana swaras.

This repository holds the part that works today: the **raga–tala constraint engine**. It drives three generators that cannot break the rules of raga or tala, plus a notation and judge for jathis:

- **Alankaras in all 35 talas.** The first pattern for each tala comes from the *35 Tāla Alankāra-s* sheet. "New pattern" then gives patterns you have not seen, in any of 86 ragas.
- **Kalpana swaras.** Rounds are built mostly from the raga's own sourced phrases, with reasoned jumps, and end on the swara just above or below the one the composition resumes on, often with a graded mora. Temperature is the singer's creativity: low means recognisable, high means out-of-the-box variants of the raga's phrases.
- **Jathis for dance.** A generator, JathiScript (a text format students write jathis in), and a judge. The judge checks the arithmetic exactly, scores six aspects of craft and says which line to fix.
- **A repertoire to practise (v0.9).** All 1,548 notations of [Carnatic Music Notations](https://carnaticnotations.blogspot.com/) (Balaji J., free to download and use), imported into `data/repertoire/`: geethams, varnams, krithis, thillanas and the rest, each on its tala grid with the sahitya under its swaras, every section playable in the sung voice with its raga's gamaka, sangatis and double-speed passages included ([§15](#the-repertoire-v09)).

It also holds the web pages built on the engine: an interactive playground, the research and build plan, and the pitch deck. The learned parts of the product (pitch tracking, raga conformance, the personal voice model) are designed in the research plan and listed under [Roadmap](#18-roadmap). They are not implemented yet.

```
npm install          # esbuild and jsdom, for the page build and the smoke test
npm test             # 36 tests, 1,199,784 checked properties, about 15 seconds
npm run build        # bundles the engine and writes the pages to site/
npm run smoke        # loads every page in jsdom and drives every control
node bin/vocal-gym.js alankara --raga mohanam --tala "misra jhampa"
npm start            # the web app at http://localhost:3000
node scripts/import-repertoire.js   # re-import the repertoire from the site (data/repertoire/)
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
| Kalpana swaras: phrase-driven rounds planned in tala-shaped phrases with focal notes, no jumps at device joins, repetition, yatis, graded and timed moras, the korvai, whole sessions, creativity dial | Done, tested | `src/engine/kalpana/` |
| Gamaka rendering for kalpana and alankara playback: sourced rules for 23 ragas, a swara grammar for every raga, timing and coarticulation from analysed performances, pitch view, WAV | Done, tested; rules await musician review and a listening test | `src/engine/gamaka/` |
| Sung voice: source–filter synthesis with phrasing, breaths, stress and dynamics, on "aa" or the swara names, in the playground, the app and WAV export | Done, tested; not yet in a listening test | `web/shared/voice.js`, `src/engine/gamaka/expression.js` |
| Korvai and tihai lab: the arithmetic of moras, tihais, series, korvais, chakradars and trikaala for the 35 talas, any gati, kalai and eduppu; nine lessons and a builder (§8.6) | Done, tested against Balaji 2024’s charts and the jathi judge | `src/engine/korvai/`, `web/shared/korvai-lab.js` |
| Jathi generator (35 + 3 talas, any nadai, atita and anagata eduppu, seven yati settings); kept in the API and CLI, no longer in the pages | Done, tested | `src/engine/jathi/generator.js` |
| JathiScript parser | Done, tested | `src/engine/jathi/script.js` |
| Jathi judge: correctness gate, six craft aspects, computed fixes | Done, tested; weights not yet calibrated with teachers | `src/engine/jathi/judge.js` |
| Melakarta and katapayadi explorer: the 72 in their chakras, swaras from the number, the number from the name (65 by the rule, 5 by a stated convention, 2 exceptions), a decoder and a scale builder (§15, v0.8.7) | Done, tested; sourced (docs/research/melakarta-katapayadi.md) | `src/engine/melakarta.js`, `web/shared/mela-explorer.js` |
| Repertoire: the 1,548 compositions of carnaticnotations.blogspot.com imported (sections, sangatis, double-speed groups, sahitya under the swaras, the scale and tala of each), read on the tala grid, sung a section or a looped line at a time, and kept in practice routines and the log (v0.9) | Done, tested; 98% of 21,578 lines fill whole tala cycles, the rest are slips in the source, sung as written | `scripts/import-repertoire.js`, `src/engine/repertoire.js`, `data/repertoire/`, `app/js/pages/repertoire.js` |
| Command line tool | Done, tested | `bin/vocal-gym.js`, `src/cli/` |
| Playground, research plan and pitch pages | Done, smoke-tested | `web/` → `site/` |
| Practice: accounts, routines, a session flow with timers across the tools, a log, a daily goal and streaks, in a SQLite database on this machine; installable as a PWA, working offline (v0.8.7). Tanpura and tala playback come with every tool | Done, tested | `server/auth.js`, `server/practice.js`, `server/db.js`, `app/js/session.js`, `app/js/pages/practice.js`, `app/sw.js` |
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
├── package-lock.json            exact versions of the dependencies (the server's Claude SDK, two dev tools)
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
│   │   ├── gamaka/
│   │   │   ├── index.js         renderGamaka: notes → pitch contour with the raga's gamaka
│   │   │   ├── resolve.js       note context, rule choice, style defaults, overrides
│   │   │   ├── contour.js       time fitting (the degradation ladder) and sampling
│   │   │   ├── shapes.js        kampita, andolita, nokku, odukkal, jaru, sphurita, orikkai …
│   │   │   └── constants.js     CPN, STA and transition times
│   │   ├── kalpana/
│   │   │   ├── index.js         kalpana and kalpanaRound: tables, endings, sampling, stats
│   │   │   ├── devices.js       generic cells and anchored phrase devices
│   │   │   ├── leaps.js         licensing, resolution, budget, leap statistics
│   │   │   ├── landing.js       eduppu neighbours
│   │   │   ├── phrases.js       the phrase plan: tala-shaped phrases, focal notes, contours (v0.4)
│   │   │   ├── session.js       a whole svara kalpana: first speed, second speed, koraippu, korvai (v0.4)
│   │   │   ├── rhythm.js        kalpana swaras on a lab rhythm: families, breath, inspiration fitting (v0.8.3–0.8.5)
│   │   │   ├── inspire.js       rhythmPrompt: the prompt and JSON schema for a language model (v0.8.5)
│   │   │   ├── sargam.js        reading suggested swara lines (v0.8.5)
│   │   │   └── mora.js          graded and timed moras, the korvai
│   │   ├── melakarta.js         the melakarta and katapayadi explorer: names, numbers, chakras, swaras (v0.8.7)
│   │   ├── korvai/index.js      the korvai and tihai arithmetic: frames, moras, series, korvais, chakradars, trikaala (v0.8)
│   │   ├── repertoire.js        the repertoire's notation, ragas from printed scales, the site's tala names, the play plan (v0.9)
│   │   ├── sollu.js             sollukattu vocabulary, aliases, idiom test
│   │   └── jathi/
│   │       ├── generator.js     jathi generator
│   │       ├── script.js        JathiScript parser and exporter
│   │       ├── judge.js         correctness gate, craft aspects, fixes
│   │       └── examples.js      the worked examples used everywhere
│   └── cli/                     command line commands and text layout
├── data/raga-profiles.json      raga profiles: roles, phrases, avoid lists, sources (source of truth)
├── data/repertoire/             the repertoire (v0.9): index.json and c/<id>.json, one per composition (generated by scripts/import-repertoire.js; committed)
├── docs/
│   ├── raga-profiles.md         the profile format and how the generator uses it
│   ├── research/raga-profiles-report.md   the research behind the profiles
│   ├── research/gamaka-eval.md  the gamaka listening test: protocol, kit, analysis (results pending)
│   ├── research/gamaka-papers.md   what the papers in research/ add to the renderer (v0.6)
│   ├── research/expressive-voice.md   the sung voice for kalpana and alankara (v0.6)
│   ├── research/kalpana-structure.md   what a kalpana round is, from the literature, and why v0.6 rounds lacked it
│   └── plans/kalpana-v0.3.md, kalpana-v0.4.md, gamaka-audio.md   the plans
├── examples/*.jathi             the worked JathiScript examples as files
├── test/                        node:test suite: helpers.js and 20 *.test.js files (109 tests)
├── web/                         page sources
│   ├── shared/theme.css         colour tokens (dark first, light variant) and base type
│   ├── shared/components.css    layout and component styles
│   ├── shared/voice.js          the singing voice (pages, app and Node share it)
│   ├── shared/korvai-lab.js, .css  the korvai & tihai lab (playground, research plan and app share it)
│   ├── demo/demo.html, demo.js  the three interactive demos (shared by two pages)
│   ├── index.html               landing page
│   ├── playground/index.html    the demos on their own
│   ├── research-plan/index.html the research and build plan, with the demos inline
│   └── pitch/index.html         the pitch deck
├── scripts/build.js             compiles the profiles, bundles the engine, expands web/ templates into site/
├── scripts/import-repertoire.js the site's posts → data/repertoire/ (v0.9); scripts/repertoire-html.js reads their tables
├── scripts/compile-profiles.js  data/raga-profiles.json → src/engine/data/profiles.generated.js
├── scripts/check-raga-profiles.js   validates the profiles against the engine (--fix recomputes fields)
├── scripts/render-wav.js        a kalpana round with gamaka to a 16-bit WAV (Node, the sung voice or the tone)
├── scripts/listening-kit.js     blind WAV clips, form and key for the gamaka listening test (npm run listening-kit)
├── scripts/smoke.js             jsdom smoke test of every page in site/
├── scripts/make-icons.js        draws the install icons (app/icons/) from the logo, with node:zlib
├── app/                         the web app (no build step): index.html, manifest.webmanifest, sw.js (offline), icons/
│   ├── css/app.css              tokens, components, the v0.8.8 design and layout layers (docs/design.md)
│   ├── js/main.js, api.js, ui.js, audio.js, session.js, fx.js   routing, the API client, UI helpers, playback, the practice session, motion
│   └── js/pages/                one module per page: home, practice, repertoire, account, alankara, kalpana, korvai, melakarta, judge, learn
├── server/db.js, auth.js, practice.js   the accounts database (SQLite), logins and practice (v0.8.7)
├── var/vocal-gym.db             the accounts database (created on first use; not in git)
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
9. **Breathing room** (called Danceability before v0.8.8; its id is still `dance`). Leave karvais where the phrases can settle (60–95% of matras sounding), no unbroken run longer than two avartanams, and phrases of at most nine syllables so each can be recited in one breath.

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

### 8.6 The korvai and tihai lab (v0.8)

The lab teaches the arithmetic that makes a mora, a tihai or a korvai land, and it works it out for any of the 35 suladi talas and the chapu talas, in any gati and kalai, from any start to any eduppu. It replaced the jathi creator in the playground and the app; the judge (§10) is its Check tab. The research is in `docs/research/korvai-tihai.md`. The method follows J. Balaji, "Korvais in Karnatak Music" (2024, open access), and is checked against his charts and worked korvais. The Hindustani tihai and chakradar follow digitabla, and the mora rules follow Nelson (via Field 2018) and Raberg (2017).

**The arithmetic** (`src/engine/korvai/`, also `E.korvai`):

```
one avartanam   C = aksharas × kalai × gati pulses          Adi, chatusra: 8 × 4 = 32
space to fill   N = cycles × C + eduppu − start             counted to the landing; + 1 if the last stroke on it counts
mora / tihai    3P + 2G = N          series   6a + 2k,  9a + 2k
offset          start = (eduppu − N) mod C                  Balaji's "off" column: count back from sam
korvai          purvanga V + uttaranga U = N,  30 % ≤ V / N ≤ 70 %
purvanga        V = 3 × (phrase + karvai), or a yati, or V − 7 (14, 28) = 3x → 1(x) 2(x) 4(x)
chakradar       3 × (M + 3t + 2g) + 2G = N
trikaala        n + n + n beats at 1, 2 and 4 a beat; start on beat k·beats − 3n + 1
```

**Learn** has fifteen lessons, each worked live for the learner's tala:

1. counting the cycle;
2. the mora (damdar and bedam);
3. counting back from sam with Balaji's chart;
4. every solution of a span, with half-pulse gaps;
5. a repeating phrase (graha-bheda and nadai-bheda);
6. shapes and series, with the build-up;
7. the six yatis;
8. purvanga patterns (AP, GP, Fibonacci-like, squares, polite numbers, kuraippu);
9. the korvai, purvanga + uttaranga;
10. three statements and progressive korvais;
11. the Samam and Edapu algorithms;
12. the same total in a new korvai;
13. the eduppu;
14. trikaala;
15. the tihai of tihais (chakkardar and chakradar).

**Build** has every form (mora or tihai, korvai as purvanga + mora, korvai as three statements, progressive korvai, tihai of tihais, trikaala), any span, start and eduppu, and both ways of counting the closing syllable. Every solution is listed, the grid plays on the mridangam with the cell lit, and the result can be checked: it is exported as JathiScript and judged.

**Guarantees.** Every layout fills its span exactly and a syllable sounds on the landing (`layoutParts` checks it cell by cell). The order of solutions is taste, never a filter; the 30–70 ratio is the one filter, because the source states it. `test/korvai.test.js`:

* reproduces all 264 entries of Balaji's four charts;
* rebuilds his worked korvais and trikaalas, and the digitabla chakradars;
* lays out 113,064 moras, 14,735 korvais and 1,640 chakradars over 12,600 frames of the 35 talas;
* has the jathi judge pass 4,653 exported scripts.

**Contours, breath and inspiration (0.8.5, 0.8.6).** A line is a chain of short segments with different shapes (runs down and up, arches, valleys, janta of doubled swaras, zigzags of skips, circling one swara), never swinging between two swaras (S R S R S), so phrases are no longer all a rise and a fall; only the cadence keeps its run down into the landing. A run of syllables is mostly sung continuously, with a held swara now and then: at irregular places, always at the end of a sollu word (tha ka dhi mi → S R G ,), so the korvai's words stay clear, and shared by repeated phrases (`density: 'full'` restores one swara a syllable). `rhythmPrompt` writes a complete prompt (the raga's grammar and attested phrases, the rhythm beat by beat, the landing) for a language model. Its answer is sung as inspiration: each line is fitted to the rhythm and the raga and kept only where every hard rule holds. The app asks Claude for it (`POST /api/kalpana/inspire`, with `ANTHROPIC_API_KEY` set); the playground copies the prompt and takes a pasted answer.

**Singing the rhythm (0.8.3).** "Sing it as kalpana swaras →" hands the chosen variation to the kalpana generator. `kalpanaRhythm` (`src/engine/kalpana/rhythm.js`) sings it pulse for pulse in the raga. Phrases the lab built as one family (a yati, an AP, GP or kuraippu purvanga, a shaped mora) share one descending line, each the end of it, so the pattern is heard in the melody as well as the rhythm. A repeated rhythm is not a repeated melody: at low creativity a repeated phrase keeps its shape from another swara, as an alankara climbs the scale; at higher creativity it is re-sung. The cadence lands next to the eduppu. The explorer's filter counts follow the other filters.

**Exploring every variation (0.8.2).** For the settings chosen, the lab enumerates every complete variation of the form: thousands for a korvai (split × uttaranga × purvanga of every kind × mora shape × sollu texture). The explorer steps through them, jumps or searches, filters by facet, sorts them and draws a surprise. Its creativity dial orders them by (1 − c)·F + c·N, spread so neighbours differ (`exploreSpace`, `exploreOrder`, `exploreSurprise`, `exploreRealize` in `src/engine/korvai/explore.js`).

**Hearing the structure.** The lab plays each phrase with an accented first stroke over a bass thom. The cadence (mora statements, uttarangas) opens on tham. A phrase tone, tuned to the chosen Sa, rises with each phrase's length, so the shape of an AP, GP, kuraippu or yati purvanga is heard as a melody. Sa, tempo and the tones are set from the lab's own player (`VGMridangam.arrange` and `playArranged` in `web/shared/mridangam.js`).

**v0.8.1: the Unit 3 notes.** The MA375TGR *Mathematics of Music* Unit 3 guide (`research/UNIT 3 Notes.pdf`) is covered in full for cadences; `docs/research/korvai-tihai.md` §8 maps each topic to the code. `src/engine/korvai/patterns.js` holds the purvanga patterns:

* AP, GP, Fibonacci-like, squares, polite numbers by the odd-divisor recipe, and kuraippu;
* the six yatis with their closed forms, solved to fill a span, and a classifier for any list of lengths.

`src/engine/korvai/compose.js` holds the constructions:

* the notes' korvai of three statements, 3(P + U) = kN, with the length condition, unequal statements or an eduppu;
* progressive korvais;
* the Samam and Edapu algorithms;
* Methods A and B for a new korvai with the same total;
* tihais with half-pulse gaps, drawn at twice the resolution;
* the chakkardar 9P₁ + 6G₁ + 2G₂;
* drift, by lcm and gcd.

The mora statements use the slides' Thadhin,ginathom family. The phrases of a yati are one phrase trimmed from the front, so the ending is kept. `test/korvai-unit3.test.js` reproduces every worked example and practice answer the lab computes.

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
| Breathing room (id `dance`) | 15 | Sounding share 60–95% (5), 45–100% (3), else (1). Longest unbroken run ≤ 2 avartanams (4), ≤ 3 (2), longer (0). No phrase over 9 syllables (3, else 1). Top speed ≤ 2 × nadai (3), ≤ 3 × (1), faster (0). |

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

0. **Phrase plan (v0.4, §12.10).** Divide the round into tala-shaped phrases, each ending on a held swara.
1. **Landing.** Work out `lo(e)` and `hi(e)` (or take `targetPitch`).
2. **Forward reachability** from the opening swara (held 1 or 2 slots), over states (slot, swara, arriving move class). With a plan, devices stay inside their phrase and the held swara carries the state to the next phrase.
3. **Ending.** Collect the moras for each neighbour, choose the neighbour, then mora or free.
4. **Backward feasibility** for the body.
5. **Sampling.** Left to right, among devices that keep the round finishable, with weights `exp(score / τ)`. Scores are computed in two passes, an upper bound and then the exact leap, register and avoid terms, until the remaining bounds are more than 15τ below the best.

The result lists `units` (each with `kind`: `start`, `step`, `conv`, `nov`, `phrase`, `phrase-fragment`, `phrase-variant`, `mora` or `korvai`; with a plan also `phrase`, its phrase index, and `karvai`, the slots held at a phrase end; phrase units also carry `phraseId`, `source`, `type` and `variant`) and `stats`: `phraseShare`, `variantShare`, `novelShare` (unconventional devices plus variants), `convShare` (conventional devices, attested phrases and the mora), `profileCoverage` (`phrases`, `roles-only` or `none`), the phrases used with their sources, device counts, `leaps` and `relaxed`.

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

### 12.9 Gamaka rendering (v0.4, natural motion v0.5)

When a round is played, each swara can sound with the raga's gamaka instead of a flat keyboard tone: Todi's G swings up towards M, Sankarabharanam's G stays flat, Kalyani's descending notes are flicked from the note above, Mayamalavagowla's G oscillates against a held M. Gamaka is a **rendering layer**: `renderGamaka(notes, opts)` reads a finished note list and never changes it, and depth 0 is exactly the old plain playback. The plan is `docs/plans/gamaka-audio.md`; the code is in `src/engine/gamaka/`.

**The model.** A sung pitch curve is a chain of constant-pitch notes (CPNs, steady for at least 80 ms) and stationary points (STAs, the turns inside a transient, about 100 ms), joined by smooth transitions (S193, S194). Every swara is rendered as a short list of such targets, and the targets are always **raga notes**: "G between R and M", not an abstract width. Transitions are half-cosine and keep their length in seconds when the tempo changes, while CPNs and oscillation cycles give way (S195), so faster kalams sound lighter without extra rules:

| Rung | When the shape does not fit the note |
| --- | --- |
| 0 | The full shape; spare time goes to the CPNs |
| 1 | Fewer oscillation cycles |
| 2 | Only the onset (nokku, odukkal, jaru) and a CPN |
| 3 | Plain; a very short note becomes a pure transition into the next |

Shapes: `plain`; `kampita` (STAs alternating between two raga notes, resting on the swara or on either end, with an even or uneven dwell); `andolita` (slower, at most 2 cycles); onsets `nokku` (from above), `odukkal` (from below), `jaru` (a slide in), `sphurita` (the second note of a janta, struck from below), `pratyahata`; exits `orikkai` (a flick up at the end) and `jaru`. Oscillation never runs faster than 5 Hz, and every note of 0.2 s or more keeps a CPN of at least 80 ms.

**The data.** `gamakaRender` in `data/raga-profiles.json` transcribes the gamaka text of the 23 ragas that have it into rules, one source per rule (`docs/raga-profiles.md`): 5 ragas `heavy` (Todi, Mayamalavagowla, Gourimanohari, Sankarabharanam, Kalyani), 6 `medium`, 12 `light`. Vague text ("permits strong gamaka") is marked `text-vague`, and every judgement has an `interpretation` note for a musician to review. The other 63 ragas get a conservative **light default**, never invented colour: S and P plain; a note of 0.4 s or more a gentle swing from the swara below; a descending note of 0.2 s or more touched from the swara above; the second note of a janta struck from below.

**Choosing a rule.** For each note the resolver works out its neighbours, direction (up, down, turn), duration in seconds, janta and leap, and takes the most specific matching rule of that swara (list order breaks ties; `variety` and `humanize`, both off by default, are seeded). Then four overrides: the **landing** swara is held plain for at least 0.25 s, so the singer gets a clean pitch reference before the eduppu; no default jaru across a wide leap; after 4 notes with an oscillating body, the next note of 0.15 s or more is plain (the chain limit, S193); and the three **mora** statements share statement 1's template, moved along the scale, except that a swara the raga holds plain stays plain.

**Natural motion and the intensity dial (v0.5).** The research behind this is in `docs/research/gamaka-naturalness.md`. Real Carnatic pitch curves do not sit on flat plateaus at exact semitones: turning points are momentary and their reach varies by tens of cents without loss of correctness (S193, S194, S201), and a natural singing voice overshoots, prepares and fluctuates (S200). So the renderer's natural contour has:

- rounded turns instead of 60 ms plateaus;
- moves of about 80–130 ms, depending on the interval;
- seeded variation of reach and timing, which yields when a note is short;
- a small overshoot on arriving at a held note and a small preparation before leaving it;
- a few cents of slow drift and fine flutter;
- a truncated inflexion (one turn) as a ladder rung before a gamaka is dropped.

Swaras held plain stay inside the ±0.3-semitone constant-pitch band. `renderGamaka(notes, { intensity })` (0–1) is the dial:

| Intensity | What is sung |
| --- | --- |
| 0 | Straight notes: exactly the plain playback |
| up to about 0.3 | Natural motion between notes, and only the raga-defining gamakas (rules from the data: oscillations from about 0.07, onsets from about 0.23), at reduced reach |
| about 0.55 | Performative: raga rules at 70–90% reach with the most variation; the generic default's swings on long notes from about 0.5 |
| 0.85–1 | Heavy and accurate: every rule at full cycles and full reach on the raga's notes, the medium default on unmentioned swaras, longer gamaka chains; no variation at 1 |

`depth` (v0.4, scales every swing) is deprecated: alone, it is read as the intensity, and `natural: false` keeps the v0.4 contour.

**The swara grammar (v0.5).** Gamakas are swara-specific and depend on the phrase (`src/engine/gamaka/grammar.js`, `docs/research/gamaka-grammar.md`). Swaras the raga's data does not cover, or covers only with "takes gamaka", follow sourced rules (Vedavalli 2002, S202; Schachter 2015 after Powers, S203):

- S and P are plain.
- R1 and D1 lean into S and P.
- A swara a semitone below the next is held straight: **R2 before G2 is straight and G2 takes the gamaka**. Across an augmented second it rises into that neighbour instead (Mayamalavagowla's G3 into M, N3 into S).
- A swara with a whole tone above oscillates toward the neighbour the phrase heads for: Sankarabharanam's M toward P in *s r g m p*, toward G in *s r g m m*.
- If one svara is oscillated, the adjacent one is held flat: **R2 before G3 oscillates and G3 is straight**, while Kalyani's G oscillates and its R is flat.
- Long notes get full kampitas, middling ones a swing, quick ones a single touch.

Each decision names its rule and source in the pitch view.

**Playback and views.** In the demo, a "Gamaka" slider from 0 to 100 (55 by default) sits with the sound controls; since v0.6 the sung voice above plays it. With "Simple tone", the v0.5 player remains: each legato group is one continuous voice: a single `setValueCurveAtTime` pitch curve, a loudness curve that follows the pitch (a little louder above the swara, softer in fast moves), 16 harmonics through three formants, no vibrato, and a soft dip at each swara boundary except inside a jaru. A pitch view under the notation draws the contour against the raga's swara lines, with each swara's rule and source on hover, and a badge says whether the gamaka is raga-specific, partly interpreted text, or the generic default. "Download WAV" renders the same graph offline. On the command line, `--gamaka` (0–100, or `off`, `light` 30, `performative` 55, `full` 100) prints the round with marks (`G~(R–M)` kampita, `(M)G` touched from M, `→G` jaru, `G/` orikkai), `--contour json` prints the rendered contour, and `scripts/render-wav.js` turns it into a WAV.

```
$ vocal-gym kalpana --raga todi --aksharas 8 --temp 0 --gamaka full
Gamaka (full, 100%, 72 aksharas a minute) · heavy, from S37, S193, S206 · 47% of swaras with gamaka
S (S)R  G~(R₂*–M) ,  M~(M–P) D~(P–D)  N~(D₂*–Ṡ) M~(M–P) | P M~(M–P)  P D | P D~(D–N)  N D ||
```

`R₂*` is a turn outside the raga's scale: Todi's ga and ni oscillate down to the R2 and D2 positions (S206).

**What the research folder added (v0.6).** The eight papers in `research/` are summarised, with what was and was not implemented, in `docs/research/gamaka-papers.md`. The changes:

- **Timing.**
  - A swing inside a gamaka takes at least 50 ms a semitone (Srikumar Subramanian's speed limit, S210).
  - An oscillation cycle takes 250–500 ms (M. Subramanian, S205). At speed there are fewer cycles, never faster ones.
  - The dwell side of a kampita is an anchor: a long note waits there and moves in spurts (S205).
  - Short peaks of deep oscillations overshoot by 25 c a semitone of depth, in the sung contour only (S210).
- **Coarticulation.** An oscillation starts where the previous swara left the voice (Pearson, S206; Nuttall et al., S208). Rising to a swara its upper turn reaches, it touches that swara before it settles (Krishna & Ishwar, S209).
- **Grammar.**
  - R1 and D1 rest on S and P and rise to themselves in spurts (G2).
  - N3 and M2 sung next to S and P are a kampita close to them (G3c, S209). In D2 N3 S, D2 keeps the gamaka and N3 is straight, as with R2 G3.
  - M1 rising from G3 to P is sung G3 P G3 (G4m, S209, S205).
- **Data.** Todi's ga and ni turn at the R2 and D2 positions, with Pearson's wide and narrow ga schemas. Mayamalavagowla's ri rests on S. Sources S204–S211 are new.
- **Expression** (`src/engine/gamaka/expression.js`). `renderGamaka` returns `expression: { phrases, notes, gain }`:
  - phrases, with breaths between phrases sung without a rest;
  - stress on the samam, anga starts, phrase starts and long swaras;
  - a lighter swara after a gamaka (S209);
  - a phrase arch, swells on long swaras, softer phrase endings and a long final release;
  - each swara's syllable.
- **The legato voice.** `renderGamaka(notes, { intensity: 0, voice: true })` sings straight notes legato, with natural motion but no gamaka.

**The sung voice (v0.6).** Kalpana and alankara are sung by `web/shared/voice.js` (`docs/research/expressive-voice.md`). It is a source–filter voice computed per harmonic:

- vowel formants (with F1 tuned above the pitch);
- a spectrum that brightens with loudness;
- breath noise, jitter and shimmer;
- the expression layer's phrasing and dynamics.

It sings on "aa", or on the swara names (sa ri ga ma pa dha ni) with their consonants placed before the beat. The demo's "Voice" select and the app's transport choose between "aa", the swara names and the earlier simple tone. The gamaka slider now applies to alankaras as well. The app gets its contour from `POST /api/render`. `scripts/render-wav.js --timbre aa|swaram|tone` uses the same voice; the listening kit keeps the tone, as its protocol specifies.

**Limits.** The rules are transcriptions of prose and of a few analysed performances, not a corpus. They need a musician's review (the `interpretation` notes) and the listening test in `docs/research/gamaka-eval.md` (kit: `npm run listening-kit`; no sessions run yet) before `full` becomes the default. The voice has one voice type (women's formants), synthesized consonants rather than recorded ones, and no vibrato by design. Jathi playback uses the mridangam or recorded syllables.


### 12.10 Phrase structure (kalpana v0.4, release 0.7)

v0.6 rounds were note-to-note idiomatic but had no shape. 8.1% of the joins between devices leapt three or more raga steps and 1.7% an octave, karvais fell anywhere, and nothing grouped the devices into phrases.

`docs/research/kalpana-structure.md` records what the literature says a round is:

- Sambamoorthy's *South Indian Music* Book IV;
- Field 2018 and 2024 (*AAWM*), including the transcriptions in the figures;
- Vidya Subramanian's essay;
- Morris 2011.

The plan is `docs/plans/kalpana-v0.4.md`. The changes:

- **Joins.** A move into the next device may step, skip a third, or make a move the raga's attested phrases make. A phrase that starts after its predecessor's held swara may restart up to a fifth away. An octave join only echoes the focal note.
- **Phrases** (`kalpana/phrases.js`).
  - The round is planned as phrases of about half an avartanam of Adi, on the tala's angas (`opts.angas`).
  - Each phrase ends on a held swara the raga rests on.
  - Each group of phrases has a **focal note** (from the profile's nyasa, landing and jiva swaras) that moves across the round and ends on the landing.
  - Each phrase has a **contour**: descending by default, rising or arched as it climbs to its focus.
  - A lookahead table keeps the focus reachable. At T 0 about 70% of phrases end on their focal note and 84% within a step.
- **Repetition.** A phrase may open with the last one's opening (initial rhyme), restate it one raga step lower (sequence), or end with its tail moved to the new focus (end rhyme).
- **Designs.**
  - **Yatis:** gopuccha and srotovaha runs onto the focus.
  - **Timed moras:** `expand` and `contract`, statements of u, u + 1, u + 2 slots.
  - **The korvai** (`ending: 'korvai'`): three descending units, each a run with shrinking rests and a mora, after Field's Todi korvai.
- **Sessions.** `kalpanaSession(raga, opts)` gives the whole svara kalpana:
  - first speed ½, 1 and 2 avartanams, favouring the raga's phrases (`pidi`);
  - second speed 1 and 2;
  - a koraippu of 1, 1, ½, ½, ¼, ¼ around one focal note;
  - a final korvai.

  The focus climbs across the rounds, and every round lands next to the eduppu.
- **Shorter holds (0.8).**
  - **Problem:** a phrase-end karvai of a whole beat made 25–28% of a round sustained swaras, twice the 13.3% of the raga’s attested phrases. Rounds sounded like a string of long notes.
  - **Fix:** the karvai is now one slot (two in a long phrase at four a beat), and about a third of the inner phrase ends flow on without one. This follows the streams of Field 2018 Ex. 9 and 10, which run on between their statements.
  - **Result:** the sustained share is 14.5% at second speed and T 0, and 17–20% elsewhere (86 ragas × 4 seeds).
  - **Display:** the playground draws a whole session one round at a time, each on its own grid at its own speed. It no longer uses a doubled grid with rows of theme rests.

Rounds keep every v0.3 guarantee. `opts.phrases: false` gives the v0.3 round (with the join rule); `res.phrases` lists each phrase's focus, contour and held swara; `stats.plan` says whether the round was planned. On the command line:

```
$ vocal-gym kalpana --raga todi --aksharas 16 --temp 0 --seed 7
S R  G M  D M  , , | D P  M , | P M  , , ||
D P  M ,  R ,  S , | R G  R , | G M  G M ||  → eduppu P
Phrases: 3 (focus M, held M · focus M, held M · focus R); 2 of 2 end on their focal note · gopuccha yati, initial rhyme
```

The session mode is `vocal-gym kalpana --session`, and the playground's Scope select.

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
| `melakartaInfo(n)`, `melaName(n)`, `katapayadi(text)`, `melaFromSwaras({ R, G, M, D, N })`, `katapayadiLetters(n)` | v0.8.7: mela n worked out from its number (steps, chakra and its meaning, twin, janyas); how its name gives the number (rule, convention or exception); any word decoded by katapayadi (with the readings plain letters allow); the mela of a choice of swaras, or why it is none |
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
| v0.4 options of `kalpanaRound` | `angas` (anga lengths in aksharas, for the phrase plan), `phrases: false` (no plan: the v0.3 round), `focus` (the first focal pitch), `pidi` (0–1, more attested phrases), `yati` (0–1, how often a yati is on offer), `ending: 'korvai'`, `moraStyle: 'expand'|'contract'`. The result adds `phrases` and `stats.plan` (12.10) |
| `kalpanaSession(raga, { eduppuPitch, startPitch, angas, perAkshara, T, seed, korvai, moraStyle }) → { rounds: [{ part, index, avartanas, aksharas, per, focus, round }], failed, cycle }` | A whole svara kalpana: first speed, second speed, koraippu and korvai (12.10) |
| `kalpana(raga, opts)` | The same, returning `null` instead of an error. `targetPitch` (the last swara itself) is deprecated but still accepted; `eduppuPitch` wins when both are given |
| `eduppuNeighbours(raga, e) → { eduppu, lo, hi, inRange } \| { error, code }` | The legal neighbours of an eduppu swara (12.5) |
| `getProfile(ragaOrId) → Profile \| null`, `setProfiles(table \| null)`, `getSource(id) → { title, url, reliability } \| null` | The compiled raga profiles (12.2) |
| `CELL_DEFS`, `CELLS` | The generic device catalogue (upward and downward forms) |
| `renderGamaka(notes, { raga \| ragaId, slotSec, depth = 1, style = 'auto', seed, variety = 0, humanize = 0, landing = true, units })` | `{ points: [{ t, p }], groups, notes: [{ i, t0, t1, p, rule, shape, form, src, basis, degraded, targets }], stats: { gamakaShare, degradedShare, chainBreaks, staCount }, style, basis, sources }` (12.9). Never changes `notes` |
| `buildContour(items, { slotSec, depth })`, `GAMAKA_CONSTANTS` | The geometry under it, for research: shapes in, contour out |

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

### Korvais and tihais (v0.8)

All of these are in `E.korvai` (the module `src/engine/korvai/index.js`); the first five are also exported directly.

| Export | Description |
| --- | --- |
| `korvaiFrame({ fam, L \| tala, gati = 4, kalai = 1, cycles = 1, start = 0, land = 0, counting = 'end' })` | The space to fill: `{ ok, tala, cycle, C, span, total, steps }`, or `{ error }`. `start` and `land` are pulses from sam (− before); `counting: 'on'` counts the last syllable on the landing |
| `moraSolutions(total, { n = 3 \| 6 \| 9, gati, maxG })` | Every (P, G) with n·P + 2G = total, best first, each with `eq`, `beatAligned`, `gapless` |
| `korvaiPlans(frame, { series, all, limit })` | Purvanga + uttaranga splits with their purvanga shapes and alternatives |
| `chakradarSolutions(total, { gati, limit })` | 3 × (M + 3t + 2g) + 2G = total |
| `trikaala({ fam, L \| tala, kalai, n, variant: 'full' \| 'gap' \| 'lead' })` | A jati in three speeds, placed to end on sam |
| `moraPlan(frame, { P, G, n, shape, d })`, `korvaiPlan(frame, plan, { shape })`, `chakradarPlan(frame, sol)` | Lay a solution out: `{ ok, parts, layout: { cells, sylls, landIndex, checks }, steps }` |
| `checkMora(total, P, G, n)`, `offsetFor(total, C, { land, counting })`, `seriesChart(C, n)`, `purvangaShapes(V, gati)`, `moraShape(P, shape, d)`, `gatiFits(total, beats)`, `korvaiThrice(frame)` | The pieces: a learner's guess and its fixes, Balaji's offset and chart, purvanga shapes, shaped moras, gati changes, playing it three times |
| `toJathiScript(frame, result)` | The layout as JathiScript for the judge |
| `rhythmTemplate(frame, layout, meta)`, `parseRhythmTemplate(t)`, `kalpanaRhythm(raga, template, { eduppuPitch \| targetPitch, T, seed, karvai, melody, density, inspiration })` | v0.8.3: a lab variation as a rhythm, and kalpana swaras sung on it (onsets on its syllables, families, direction rule, landing); v0.8.5: `density` (`auto`: a few held swaras at word ends; `full`) and `inspiration` (suggested lines, fitted and checked) |
| `rhythmPrompt(raga, template, { eduppuPitch \| targetPitch, T })`, `INSPIRATION_SCHEMA`, `parseInspiration(answer, raga)`, `parseSwaras(text, raga)`, `rhythmPhrases(template)` | v0.8.5: the prompt for a language model, the answer's JSON schema, and reading its swara lines |
| `exploreFacetCounts(space, filters)` | Each facet value's count given the other filters |
| `exploreSpace(frame, form, o)`, `exploreOrder(space, { T, sort, filters })`, `exploreSurprise(space, order, { T, seed, avoid })`, `exploreRealize(frame, item)`, `TEXTURES`, `altStatement`, `altPhrase` | v0.8.2: every variation of a form, its facets and scores, the creative order, a seeded surprise, and the laid-out plan |
| `layoutParts`, `talaCycle`, `jatiOf`, `statementOf`, `phraseOf`, `yatiLineOf`, `nestedPhrases`, `kaarvaiOf`, `beatsText`, `offsetText`, `JATI_SYLLABLES`, `SERIES_GROUPS`, `GATIS`, `KALAIS`, `GATI_NAME`, `YATI_NAME` | Helpers and constants; `moraSolutions(…, { n: 'buildup' })` is the slides' 1, 2, 3 uttaranga (6P + 2G) |
| `patternInfo({ kind, … })`, `patternsFor(V, { kinds, minN, maxN, maxTerm })`, `politeRuns(S)`, `apTerms`, `gpTerms`, `fibTerms`, `squareTerms`, `kuraippuTerms`, `PATTERN_KINDS` | v0.8.1: purvanga patterns (AP, GP, Fibonacci-like, squares, polite numbers, kuraippu) and every pattern that sums to V |
| `yatiTerms(kind, p)`, `yatiSum(kind, p)`, `fitYati(kind, S, p)`, `classifyYati(lengths)`, `YATIS`, `YATI_INFO` | The six yatis: lengths, closed-form sums, solving for the first phrase, naming a shape |
| `statementKorvai(frame, { terms, pattern })`, `statementOptions(frame, { kinds })`, `lengthCondition(C)`, `targetSplit(T, r)` | The notes' korvai: three statements, unequal or with an eduppu (`.eduppu`) |
| `progressiveKorvai(frame, { m, d, U, r })`, `progressiveOptions(frame)` | Progressive korvais |
| `samamAlgorithm(n, TP)`, `samamKorvai({ tala…, phrase, kaarvai, k, form })`, `edapuAlgorithm(n, k)` | The Samam and Edapu algorithms |
| `constantTotal({ f, p, form, u, g })`, `constantTotalPlan(opts, variant)` | Methods A and B: a new korvai with the same total |
| `halfTihais(T)`, `doubledFrame(frame)`, `chakkardarSolutions(T, { halves })`, `chakkardarPlan(frame, sol)`, `drift(L, C, g)`, `gcd`, `lcm` | Half-pulse gaps, the chakkardar and drift (graha-bheda, nadai-bheda) |


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
| `kalpana --raga R --tala T [--aksharas K] [--per 1\|2] [--start S] [--eduppu-swara P] [--ending auto\|mora\|free\|korvai] [--session] [--phrases off] [--mora-style auto\|shift\|gopuccha\|srotovaha\|identical] [--allow-exceptions] [--gamaka off\|light\|performative\|full\|0-100] [--bpm 72] [--contour json [--voice]] [--temp T] [--seed S]` | One round, with its devices and their phrase sources, the phrase share, the mora style and the leaps; `--gamaka` adds the round with gamaka marks (`R₂*`: a turn off the scale), `--contour json` prints the rendered contour instead, with its legato groups and expression layer; `--voice` sings straight notes legato at `--gamaka off`. `--land X` (deprecated) ends on X itself |
| `jathi --tala T [--nadai 4] [--avartanams 2] [--eduppu 0] [--yati auto] [--land sam\|end] [--temp T] [--seed S] [--script]` | Generate; `--script` prints JathiScript |
| `judge <file \| -> [--json]` | Judge a JathiScript file (exit code 1 if the gate fails) |
| `korvai --tala T [--form mora\|korvai\|statements\|progressive\|chakradar\|chakkardar\|trikaala] [--series 3\|6\|9\|buildup] [--kind ap\|gp\|fib\|squares\|polite\|kuraippu\|yati] [--terms 3,4,5] [--halves] [--gati 4] [--kalai 1] [--cycles 2] [--start 0] [--land 0] [--counting end\|on] [--series 3\|6\|9] [--shape sama\|srotovaha\|gopuccha] [--n 5] [--variant full\|gap\|lead] [--pick N] [--script]` | The lab’s arithmetic: the steps, the solutions and the grid; `--script` prints JathiScript for `judge` |
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
| `playground.html` | Alankaras, kalpana swaras and the korvai & tihai lab, with a short guide and a JathiScript cheat sheet |
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
- **Layout (v0.8).** Each tab shows its essential controls, with the rest under *More options*. The checks fold under *Why this is correct*. A one-line sound bar under the tabs (Sa, tempo, drone, voice, gamaka, sollus) opens to change them.
- **Korvai & tihai lab** (`web/shared/korvai-lab.js` and `.css`, shared with the app; §8.6):
  - one tala bar for the lab: family and jati (35 + chapu), gati, kalai and the cycle in pulses with its kriya;
  - Learn (nine lessons) and Build (mora or tihai, korvai, tihai of tihais, trikaala), each with the worked steps, the solutions, a tala grid that plays, and the checks;
  - Check: the judge below, with any built korvai written out in it.
- **Jathi judge (the lab's Check tab):**
  - examples and a JathiScript editor that re-judges as you type;
  - a notation grid (teermanam in saffron, phrase boundaries marked);
  - the gate, computed fixes, aspect bars with notes, and warnings;
  - Play.
- **Kalpana:**
  - raga, tala, length, scope and creativity; under More options, speed, opening swara, the swara the composition resumes on, ending and mora style;
  - a whole session drawn round by round, each round on its own grid at its own speed, with the composition’s line between rounds as a divider (v0.8);
  - attested phrases in saffron, fragments in lighter saffron, variants in violet italics, the mora in teal; each phrase's title names its source;
  - an audit with the creativity readout, the phrases used and their sources (or "phrase data: none for this raga"), the leaps and their licences, and the mora's style and contour;
  - a gamaka slider (0 straight notes to 100 heavy), a pitch view of the contour with each swara's rule and source, a badge for how raga-specific the gamaka is, and Download WAV.
- **Voice (kalpana and alankara):** sung on "aa" (default), sung swara names, or the simple tone. `web/shared/voice.js` sings the engine's contour and expression layer (`docs/research/expressive-voice.md`); the gamaka slider applies to both tabs.
- **Mridangam (jathi playback, the default):** `web/shared/mridangam.js` plays each sollu as a synthesized mridangam stroke.
  - The sollus are realized as strokes group by group, following the Karya library's standard realizations: *ta din gin na thom* → Ki Ta Ki Nam Thom, *ta ka* → Ki Tha, and so on.
  - Each of the ten strokes (thi, tha, ta, thom, num, dhin, dheem, tham, cha, bheem; plus Mi and gumki) is decaying partials plus 1/3-octave noise. They are fitted to the CompMusic Mridangam Stroke Dataset and tuned to the playback Sa, with chapu on Sa.
  - The method, the sollu-to-stroke table and how close it comes to the recordings are in `docs/research/mridangam-synthesis.md`; the calibration scripts are in `research/calibration/mridangam/`.
  - `node scripts/mridangam-wav.js` renders strokes or a line of sollus to WAV.
- **Sollu voice:** the mridangam; recorded spoken syllables; or the syllables over a softer mridangam. Anything not recorded falls back to the mridangam.
  - `web/shared/solkattu.js` plays them; `web/shared/solkattu-bank.js` holds them (empty until someone records). The playground, the research plan and the app (served at `/shared/`) all use the same files.
  - Each syllable is cut with a short fade where the next one starts, and a karvai lets it ring on. Takes alternate so repeated syllables are not identical.
  - No reusable per-syllable solkattu audio exists online, so `docs/solkattu-recording.md` explains how to record the 28 syllables. `node scripts/solkattu-bank.js` slices, trims, level-matches and packs the recording (16 kHz µ-law, about 10 KB per syllable) and writes a preview WAV to check by ear.

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

### The web app (`server/` and `app/`)

`npm start` runs a small Node server at http://localhost:3000. Accounts and practice logs (v0.8.7) are stored in `var/vocal-gym.db`, a SQLite file on this machine, through Node's built-in `node:sqlite` (Node 22.13 or later; set `VG_DB` to move the file). The app installs as a PWA from localhost or HTTPS (the browser's Install button), and its shell opens offline. The navigation is Practice · Repertoire · Tools (a menu of the five tools) · Learn. Each tool page has a compact head (one line of quick starts and a help popover) and shows its result first on a phone. Since v0.8.8 the app has a design layer of depth, glass and motion: a live 3D sound field behind the home hero, cards that tilt toward the pointer, and content that rises into place, all hand-written in `app/js/fx.js` and the end of `app/css/app.css`, and all switched off by the system setting "reduce motion". The principles, their sources and where each piece lives are in `docs/design.md`. Its one runtime dependency, the Claude SDK (`@anthropic-ai/sdk`), is loaded only when a page asks Claude for kalpana lines; set `ANTHROPIC_API_KEY` to enable that. `PORT` and `HOST` change where it listens. It serves a guided site with one page per feature:

| Page | What the user does |
| --- | --- |
| Home | Hears a sample alankara and picks a tool |
| Alankaras | Picks a raga and tala, plays the sheet pattern, and steps through new patterns |
| Kalpana swaras | Chooses length, start and landing swaras, ending and creativity, and sees which devices were used |
| Korvai lab | Chooses a tala (any of the 35) once, then learns the counting in nine lessons or builds any mora, korvai, tihai of tihais or trikaala, and sends it to the judge (`#/jathi` now opens it) |
| Melakartas | Picks any of the 72 (or follows #/melakarta/29) to see its swaras worked out from the number, its chakra and how its name gives the number by katapayadi; decodes any name; builds a scale and finds its mela |
| Jathi judge | Edits JathiScript and gets the gate, exact fixes, craft scores and a playable grid as they type |
| Repertoire | v0.9: finds a composition among 1,548 (search, and filters by type, raga, tala, composer and language), reads it on the tala grid with the sahitya under the swaras, plays a section or loops a line in the sung voice at ½, ¾ or full tempo, and starts a session of it or adds it to a routine |
| Practice | Creates an account (or logs in), picks or writes a routine, and practises with a timer in a bar that follows them across the tools; finishes with a rating and notes; sees the streak, today against the daily goal, the last seven days and the history |
| Account | Logs in or creates an account; changes the name, daily goal and password; logs out; deletes the account and its data |
| Learn | A primer and glossary; every dotted term in the app opens its definition |

The korvai lab and the repertoire compute in the page: the server also serves `src/engine/` as ES modules at `/engine/`, `web/shared/` at `/shared/`, and `data/repertoire/` at `/repertoire/`. The rest of the engine runs on the server, behind a JSON API that `server/api.js` validates and annotates with plain-English explanations:

| Route | Body |
| --- | --- |
| `GET /api/meta` | — (ragas, talas with hand actions, the sheet, the JathiScript examples) |
| `POST /api/alankara` | `{ raga, fam, L }`, plus `generate: { T, span, seed, avoid }` for a new pattern, or `motif` to redraw a saved one |
| `POST /api/kalpana` | `{ raga, fam, L, aksharas, per, start, land, ending, T, seed }`, or `{ raga, rhythm, land, T, seed, density, inspiration }` for a lab rhythm |
| `POST /api/kalpana/prompt` | `{ raga, rhythm, land, T }`: the prompt and JSON schema for inspired lines (v0.8.5) |
| `POST /api/kalpana/inspire` | `{ raga, rhythm, land, T, seed, density }`: asks Claude (`claude-opus-5-5`) for lines and sings them as inspiration; 503 when no API key is set |
| `POST /api/mela` | `{ n }` or `{ raga }` (a janya gives its parent): the mela worked out, with its katapayadi reading (v0.8.7) |
| `POST /api/katapayadi` | `{ text }` to decode, or `{ swaras: { R, G, M, D, N } }` to find the mela (v0.8.7) |
| `POST /api/jathi/generate` | `{ fam, L, nadai, avartanams, eduppu, yati, land, T, seed }` |
| `POST /api/jathi/judge` | `{ script }` |
| `POST /api/auth/register` · `login` · `logout` · `me` | v0.8.7: `{ username, password, displayName }` and `{ username, password }`; sets or clears the login cookie; `me` answers `{ user }` or `{ user: null }` |
| `POST /api/account/update` · `password` · `delete` | `{ displayName, dailyGoalMin }`, `{ current, password }`, `{ password }` (deletes the account and all its data) |
| `POST /api/practice/routines` · `routines/save` · `routines/delete` | the starters and the user's routines; `{ id?, name, items: [{ kind, title, minutes, ref? }] }` (v0.9: kind `repertoire`, and `ref`, a composition's id, so Start opens it); `{ id }` |
| `POST /api/practice/log` · `logs` · `logs/delete` · `summary` | a finished session `{ clientId, localDate, startedAt, endedAt, seconds, items, rating, notes }` (stored once per client id); `{ limit, before }`; `{ id }`; `{ today }` → the streak, today against the goal, seven days, totals |
| `POST /api/render` | `{ raga, notes: [{ p, dur }], bpm, per, intensity, seed, cycleBeats, angaStarts, units }`: the contour and expression layer the voice sings. v0.9: `scale: { name, aro, avaro }` in place of `raga` sings a printed scale; a scale that is an engine raga's uses that raga (and its gamaka rules) |

### The repertoire (v0.9)

[Carnatic Music Notations](https://carnaticnotations.blogspot.com/) is a site by Balaji J. (balajij@gmail.com) with notations for 1,548 compositions; its About page says: *"The content on this site is free for anyone to download and use."* Every composition keeps its page's address, and the app links to it from the composition's page.

**Importing.** `node scripts/import-repertoire.js` reads the posts from the blog's public JSON feed (25 a request) and writes `data/repertoire/index.json` (the list, with each composition's type, raga, tala, composer, language and deity) and `data/repertoire/c/<id>.json` (one file per composition, 11 MB in all). `--save-feed f.json` keeps the posts fetched and `--cache f.json` re-imports from them; `--report` lists every composition with lines off the cycle. The posts are Google Docs tables pasted into Blogger; `scripts/repertoire-html.js` lays each table out on its column grid (rowspan and colspan included) and keeps each run's underline. The importer then reads:

| In the post | In the data |
| --- | --- |
| The scale row, `kalyANi - S R2 G3 M2 P D2 N3 S’ - S’ N3 … S` | `ragas: [{ name, aro, avaro, note }]`; a ragamalika has one per section. A post without one takes the scale other compositions in that raga print (172 posts), or the engine's (7); nottuswarams default to Shankarabharanam and the basic exercises to Mayamalavagowla. 21 have none, and are sung with the common variants |
| A heading row, `pallavi - its words`, `chittaswaram` | a section: `{ title, lyrics, raga, lines }` |
| A row of swaras, a cell per anga or per cycle; a label column (`1`, `2` …) | a line: `{ cells, label? }`, each cell in the compact text of `src/engine/repertoire.js` |
| An underlined group (`PNND`), sung at double speed | `[P N N D]`: each symbol takes half a unit |
| `S’` (upper octave), `‘N` (lower), `,` and `;` | `S'`, `N.`, `,` and `, ,` |
| Stacked rows of one line (sangatis), then a row of sahitya | each line gets `syl: [[unit, syllable], …]`: the site lines the words up under the swaras in a monospace font, so each word goes to the unit of the swara above its first letter |
| The tala in the title (`Adi`, `roopakam`, `mishra chApu`, `KhandaChapu`, `Adi (tisra)` …) | `tala: { name, fam, L, nadai, unitsPerBeat }`. Units per beat is the largest that makes the rows fill whole cycles with every cell on an anga line, worked out per section when a section changes nadai. When the notation does not follow the named tala (a "khanda chapu" written in cycles of 7), the grid uses the common tala it does fill, and the page says so (`refit`); with no tala named, the one the lines fill (`inferred`) |

Some rows are not a plain cycle, and the importer marks them: a lead-in (first cells empty: `at`, how far into the cycle it starts, so it ends on sam), a line split over two rows (`join`), a last cell that fills the next line's opening rests (`tail`), and a short link back into a line (`link`). Where a row fits its cycle only if a cell's underlined groups are four times as fast (the site underlines both speeds the same way), they are read so (`[[ … ]]`, 26 rows). Of the 21,578 swara lines, 19,983 fill whole cycles and 1,235 are lead-ins, split lines, overlaps or links; the other 361 (in 187 compositions) are slips in the source, such as a cell one unit long, and are sung as written.

**Reading and singing.** The page (`app/js/pages/repertoire.js`) loads the JSON from `/repertoire/` and reads it with the engine's repertoire module in the browser. A swara without a digit takes the variant its raga uses in that direction (Bhairavi's D₂ going up, D₁ coming down). `playPlan` puts a section's lines on one grid (two cells a unit with double speed, four with four times) and keeps the lead-ins, joins and overlaps in time; the sung voice renders it through `/api/render`, with the raga's sourced gamaka when its scale is an engine raga's (434 compositions) and the swara grammar otherwise. The cell under the music lights as it sounds, and the page follows it.

The browser plays the results with Web Audio and lights each cell as it sounds. Swaras are sung (the transport's Voice and Gamaka controls): the page asks `/api/render` for the contour and `web/shared/voice.js` sings it. `app/` is plain ES modules with no build step. `test/server.test.js` covers the API, and `npm run e2e` drives every page in headless Chrome or Edge.

## 16. Tests

`npm test` runs `node --test test/*.test.js`. Each test counts its checked properties, reports the count as a diagnostic, and fails with the first twenty messages.

| File | What it proves | Checks |
| --- | --- | --- |
| `melakarta.test.js` | v0.8.7: the katapayadi table and rules and the sources’ examples; plain-letter ambiguity; all 72 names read (65 by the rule, the five that need the convention, the two exceptions, each explained); every number’s swaras, chakra and twin; the builder over all 162 choices (72 melas, 90 refused with a reason) | — |
| `ragas-talas.test.js` | Melakarta formula (12 spot values, ordering, 72 distinct scales, names); the class and parent of every janya, and that each uses only its parent's swaras; tala totals for all 35; chapu; invalid tala arguments; tala-spec parsing and round trips | 647 |
| `alankara.test.js` | **All 35 sheet first lines, ascending and descending, note for note** in Mayamalavagowla; bars on anga lines; row counts equal the sheet's for every tala; all ten lines of 1.1; variation 0 is the sheet. Direction rule on every step of 23,992 lines (217,320 notes) in 86 ragas × 35 talas. 1,248 new patterns: legal, never a repeat, direction-valid in every line, conventionality falling with temperature, the sheet's span by default, every Tisra Eka alternative found, `null` only when all are shown | 310,676 |
| `kalpana.test.js` | The v0.2 sweep (every other melakarta and every janya, 4 lengths, 2 speeds, 3 temperatures, 3 endings): exact length, start, landing, range, direction, three different mora statements with equal gaps, novelty rising with temperature. Eduppu neighbours (the table in 12.5) and 2,022 rounds landing next to every eduppu. Structured errors and backward compatibility. Leap acceptance over 86 ragas × 10 seeds × 3 temperatures; the relaxation over 2,696 short spans. Graded mora acceptance over 1,032 moras and the Mayamalavagowla golden mora | 185,467 |
| `kalpana-structure.test.js` | v0.4 structure over the 86 ragas: every join larger than a third is attested, a restart within a fifth after a held swara, or the focal echo; devices stay inside their phrases and held swaras are ones the raga rests on; at T 0 most phrases end on their focal note; rhymes and sequences repeat the last phrase (a step lower); yatis shrink or grow onto the focus; the korvai's three units descend a step each and land; sessions are deterministic, in order, landing, with the focus climbing | — |
| `kalpana-phrases.test.js` | Attested phrases at T = 0 in Kalyani, Todi, Mohanam, Hamsadhwani and Hemavati, with every phrase and fragment unit matching its profile; the phrase-share acceptance over the 27 phrase-rich ragas; profile coverage and the fallback with no profile; exceptions only with `allowExceptions`; no erratic jumps (leap-size caps over 86 ragas, the share of moves in each raga's idiom, and the reported Kalyani S → N openings) | 30,983 |
| `gamaka.test.js` | The gamakaRender transcriptions validate and compile, and crafted bad rules are rejected; the geometry (depth 0 is plain, exact timing, no jumps, anchors, the 5 Hz rate cap, the ladder lightening faster tempos); `renderGamaka` on 258 kalpana rounds (determinism, untouched notes, targets on raga notes, the landing held plain); golden Todi, Sankarabharanam, Kalyani and Mayamalavagowla cases; mora templates; the swara grammar over every data-less raga; the natural contour and the intensity dial; the listening kit is balanced, blind and reproducible. v0.6: the speed limit and the 250 ms cycle floor, G2's anchor on S, Todi's coarticulated ga, G3c and G4m; the expression layer (phrases, stress, breaths, loudness, syllables) and the legato straight voice | — |
| `raga-profiles.test.js` | The profile file covers the 86 engine ragas with the engine's scales; every phrase parses and its computed flags match; sources and enums are valid; the compiled module is up to date and loads in the engine | 15,994 |
| `korvai.test.js` | Balaji’s four charts (264 entries); his worked korvais (Adi, Misra Chapu, the gopuccha of 20, 1-2-4, damaru 47, the averaged uttaranga), the gati change and trikaala placement; the digitabla tihais and chakradars; 12,600 frames of the 35 talas × gati × kalai × spans × start and landing × counting: every solution of 3P + 2G, exact and complete, and 113,064 moras, 14,735 korvais and 1,640 chakradars laid out cell by cell; purvanga shapes; errors; 4,653 exported scripts passing the jathi judge’s gate | 350,000+ |
| `kalpana-rhythm.test.js` | Lab rhythms sung as kalpana swaras (and, from 0.8.6, varied contours with a falling cadence, and all 86 ragas for every eduppu, Saveri and Malahari included): about 1,670 passages over five forms, four frames and seven ragas, with onsets on syllables (phrase starts and cadence endings always, most beats), the breath, the direction rule, the landing, nested families as the ends of one line, repeats moved or varied, trikaala, determinism and template errors; the inspiration prompt, the swara notation and fitting suggested lines | 24,000+ |
| `korvai-explore.test.js` | The explorer: complete, faceted, deterministic spaces for every form; every variation of the smaller spaces and a spread of the large ones laid out; the creativity dial leading with the familiar at 0 and the unusual at 2; neighbours that differ; sorts, filters and seeded surprise; the takadhom texture through the judge; 2,062 explored variations over the 35 talas | 4,500+ |
| `korvai-unit3.test.js` | The Unit 3 notes: the pattern sums and closed forms, polite runs over 1–600 (odd divisors − 1, none for powers of 2), the six yatis and their classifier, every pattern found for 3–240, the notes' korvais (Ex. 7.9–7.15, Q14, Q17), progressive korvais, the Samam algorithm on the slides' korvais, Edapu over every n and k, Methods A and B, tihai solution sets with half gaps, chakkardars, drift; 4,831 constructions over the 35 talas | 13,000+ |
| `jathi.test.js` | 12,417 generated jathis over 38 talas, nadai 3–5, 1–2 avartanams, eduppu −2, 0 and +2, seven yati settings and three temperatures: exact sums, slot formula, yati shapes, threefold teermanam. 2,452 exported to JathiScript all pass the gate (scores 71–100, median 88). 1,947 combinations are refused with a message because no teermanam fits the span with the chosen yati | 50,570 |
| `jathiscript.test.js` | Worked examples (100 for the guide example; the short example fails with a fix at line 11); syntax errors with line and column; compound and vocabulary warnings; land `end` and `+n`; inferred avartanams; kalai; atita and anagata eduppu and their aliases; speed changes; bar errors; missing teermanam; opening karvai; written-out teermanams; trailing karvai; generator–parser round trips | 90 |
| `voice.test.js` | The sung voice (and, from 0.8.7, an octave below Sa by default, and no hiss: the band above its harmonics at least 65 dB under it): the same line gives the same samples; finite, audible and unclipped; Sa, Pa and tara Sa in tune within 15 cents (autocorrelation), and Sa follows the playback Sa; the swara names differ from aa, pa is closed before its beat, the last swara fades; the CLI's JSON sings the same samples | — |
| `accounts.test.js` | v0.8.7, on a fresh database: accounts (validation, case-insensitive names, the login throttle, password change, non-JSON posts refused), privacy between users, routines, logs stored once, the summary and streaks (across a year, a leap day and a missed day), deleting an account | — |
| `server.test.js` | Every API route including the inspiration routes (Claude mocked, and the 503 without credentials) and `/api/render` (deterministic, spans the round, gamaka at 55, none at 0, loudness in range, unchanged notes), validation errors, static files and no path traversal | — |
| `solkattu.test.js`, `mridangam.test.js` | The recorded-syllable bank (µ-law, slicing, playback fallbacks) and the synthesized mridangam (realization, determinism, Sa tracking, decays) | — |
| `repertoire.test.js` | v0.9: the compact notation; ragas from printed scales (engine twins, variants by direction, letters outside the scale); the site's tala names; the play plan (lead-ins, split lines, overlap cells, double speed); the importer on a post written in the site's markup (label column, rowspan, sangatis, an underlined group, sahitya alignment, a link); every imported composition (pitches in range, syllables inside their lines, at least 90% of lines on the grid, every section within the render route's 4,000 notes); the `/repertoire/` routes, singing a printed scale, and repertoire items with `ref` in routines and logs | 250,000+ |
| `cli.test.js` | Every command, exit codes, JSON output, piping a generated jathi into the judge; `--eduppu-swara`, `--land`, `--mora-style`, `--allow-exceptions`, `--gamaka`, `--contour json` (with Todi's off-scale `R₂*` turns) and a WAV from `scripts/render-wav.js` | — |

Total: about 3.3 million checked properties in 116 tests, in about 30 seconds on a laptop CPU (test files run in parallel).

`npm run smoke` loads `site/playground.html` and `site/research-plan.html` in jsdom and drives every preset and control. It runs out of new patterns on Tisra Eka, steps back through history, loads a sheet cell, tries atita chapu, opens the editor, judges every example and a syntax error, checks that kalpana presets land next to their eduppu and that the audit names phrase sources, leaps and every mora style, and switches tabs. It also checks the gamaka select, the pitch view, the gamaka badges and, with Web Audio stubbed, one finite pitch curve per legato group (and none when gamaka is off). It times 100 Kalyani rounds (best of three; the limit is 1 s at full CPU speed, scaled up by a calibration loop on a throttled machine). It fails on any script error or missing output. `site/pitch.html` and `site/index.html` must load cleanly.

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
- **Playback is a sketch.** Equal temperament and a synthetic voice. Kalpana playback has rule-based gamaka (12.9), transcribed from prose and not yet reviewed by a musician or tested by ear; alankara playback stays plain. Jathi playback uses a synthesized mridangam calibrated against recorded strokes (`docs/research/mridangam-synthesis.md`), not yet reviewed by a mridangist; its sollu-to-stroke realizations are one convention among several banis. Recorded syllables can be added (`docs/solkattu-recording.md`).

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
- [Carnatic Music Notations](https://carnaticnotations.blogspot.com/), Balaji J.: the 1,548 notations of the repertoire (v0.9), "free for anyone to download and use" (its About page). Each composition links to its page there.

Method sources:

- F. Pachet and P. Roy, "Markov constraints: steerable generation of Markov sequences", *Constraints* 16(2), 2011.
- S. Geng et al., "Grammar-Constrained Decoding for Structured NLP Tasks without Finetuning", EMNLP 2023.

The full reference list (77 entries, including the vocal-strain and raga-recognition literature) is in the research plan, `site/research-plan.html#refs`.

---

## 22. Licence

No licence has been chosen yet (`"license": "UNLICENSED"` in `package.json`), so all rights are reserved by the author until one is added. The tala alankara sheet PDF is not included; only the 35 first lines needed by the engine are transcribed, with attribution.
