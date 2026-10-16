# Changelog

## 0.4.0

- **Gamaka rendering for kalpana playback** (`docs/plans/gamaka-audio.md`).
  - Data: `gamakaRender` rules transcribed from the gamaka text of 23 ragas (5 heavy, 6 medium, 12 light), each with a source and, where it needed judgement, an interpretation note for review. Seven gamaka research sources (S193–S199). Validated by `scripts/check-raga-profiles.js` and compiled to semitone offsets per raga; the other 63 ragas get a conservative light default.
  - Engine: `src/engine/gamaka/` and `renderGamaka(notes, opts)`. Swaras become CPN and STA targets on raga notes, joined by half-cosine transitions that keep their length in seconds. A degradation ladder lightens fast kalams. Rule choice by context, with overrides for the landing swara, wide leaps, long gamaka chains and mora consistency. Deterministic. It never changes the notes, and depth 0 is plain playback.
  - Demo: a Gamaka select (off, light, full), one continuous voice per legato group, a pitch view with per-swara rules and sources, a raga badge and Download WAV.
  - CLI: `--gamaka` marks, `--contour json`, `--bpm`; `scripts/render-wav.js` renders a WAV in Node.
- **Evaluation kit.** `npm run listening-kit` writes blind, seeded WAV clips, a response form and an answer key for an A/B idiom rating and a raga-identification test. `docs/research/gamaka-eval.md` has the protocol, the rule-review step, the analysis plan and the reasoning behind every constant.
- **Tests.** `test/gamaka.test.js` covers plan tests 1–16 and the kit, and the smoke test covers 17: 36 tests, 1,199,784 checks, about 15 seconds.
- **Not done yet.** The listening sessions, the musician review of the rules and the calibration against pitch-track data need people and data; until then no constant has been tuned by ear and the demo defaults to light gamaka.

## 0.3.1

- **Kalpana swaras: no more erratic jumps.** Rounds could open S → N (11 semitones) straight into a phrase fragment, or drop a seventh, because a leap onto any resting swara counted as licensed and the jump into a phrase was never measured.
  - A resting swara now licenses a leap only up to a fifth.
  - Leaps outside attested phrases are capped by a three-level filter: a fifth below T = 1.5 (the octave excepted), a major sixth above, relaxed a level at a time only when a short span cannot be filled.
  - A first-order idiom model learned from each raga's attested phrases and scale: moves the raga never makes cost familiarity, and so does leap size beyond a major third and the distance of a jump into a phrase. These idiom terms keep at least half their weight at every temperature.
  - The same scoring applies to mora statements.
  - Measured in the 32 ragas with phrases: 97% of moves follow the raga's idiom at T = 0 (85% before), 90% at T = 1 (78%); no leap wider than a fifth outside attested phrases below T = 1.5 in any raga; at T = 0 the 32 ragas have 30 leaps wider than a fifth, all inside attested phrases, against 125 before.
- **Tests.** A regression test for erratic jumps, including the reported Kalyani openings. 29 tests, 594,406 checks, about 15 seconds.

## 0.3.0

- **Raga profiles.**
  - `data/raga-profiles.json`: sourced swara roles, phrases, avoid lists and allied ragas for all 86 ragas, with its documentation, research notes, checker and tests.
  - `npm run profiles` validates it and compiles what the generator needs into `src/engine/data/profiles.generated.js`; the build recompiles it and a test fails when the committed module is stale.
  - `getProfile`, `setProfiles` and `getSource` in the engine.
- **Kalpana swaras: phrase-driven generation.**
  - Attested phrases, their 3–5 swara fragments and octave shifts become devices, weighted by source reliability, phrase type and confidence.
  - Out-of-the-box variants (phrases shifted along the scale; inverted fragments at T ≥ 1) count as novelty.
  - A phrase-share controller (target 0.70 − 0.20 T) keeps rounds predominantly characteristic. Generic devices, janta and dattu are scaled by the profile, holds are scored from its landing, nyasa and alpa swaras, and hard avoid lists are enforced.
  - Ragas without phrases fall back to the generic devices; `stats.profileCoverage` says which applies.
  - `allowExceptions` offers the documented direction-rule exceptions, whole.
- **Kalpana swaras: reasoned jumps.**
  - Leaps, including junctions between devices, are licensed (attested phrase, structural swara, fourth, fifth or octave, arpeggio at T ≥ 1), resolved and budgeted.
  - Below T = 1.5 the tritone, leaps over an octave, leaps onto alpa swaras and same-direction double leaps are excluded by the feasibility tables; a short span that becomes infeasible is rebuilt with the filter relaxed (`stats.relaxed`).
  - `stats.leaps`.
- **Kalpana swaras: landing next to the eduppu.**
  - New option `eduppuPitch`, the swara the composition resumes on. The round ends on its lower neighbour (rising into it) or upper neighbour (falling into it), never on it; `ending.approach` records which.
  - `eduppuNeighbours()`, and `kalpanaRound()`, which returns `{ error, code }` where `kalpana()` returns `null`.
  - `targetPitch` keeps its meaning and is deprecated.
- **Kalpana swaras: graded mora.**
  - Three similar statements, not identical ones: `shift` (one contour, a step nearer the eduppu each time), `gopuccha` (shorter each time) and `srotovaha` (longer each time), from attested or generic contours. `moraStyle: 'identical'` keeps the v0.2 mora.
  - `ending` gains `style`, `statements`, `direction`, `template` and `adjusted`; `ending.phrase` stays for old callers.
- **Interfaces.**
  - The generator moved to `src/engine/kalpana/` (`devices`, `leaps`, `landing`, `mora`, `index`); `src/engine/kalpana.js` re-exports it.
  - CLI: `--eduppu-swara` (with `--land` as a deprecated alias), `--mora-style`, `--allow-exceptions`; phrase sources, phrase share, leaps and mora style in the output.
  - Demo: "Composition resumes on" and "Mora style" controls, phrase colours with sources, and the phrases, leaps and mora in the audit.
- **Tests.** 28 tests and 593,940 checks, including the plan's acceptance tables (printed as diagnostics), a golden mora and `test/kalpana-phrases.test.js`. The smoke test checks the new controls and times 100 rounds.

## 0.2.0

- **Alankaras.**
  - The first pattern for each of the 35 talas now comes from the *35 Tāla Alankāra-s* sheet, verified note for note (ascending and descending first lines, row counts, and every line of 1.1 Chaturashra Dhruva).
  - "New pattern" generates patterns that never repeat the sheet line or an earlier variation for the same raga and tala.
  - Patterns are drawn by exact sampling, with a familiarity model learned from the sheet. When sampling cannot find an unseen pattern in a tiny tala, every legal pattern is enumerated.
- **Temperature is creativity.** Every generator scores choices as `(1 − c) · familiarity + c · novelty`, with `c = T / 2` and a sampling width that never reaches zero.
- **Kalpana swaras.**
  - Rounds are built from named conventional and unconventional devices.
  - Optional mora endings: three identical statements with equal gaps.
  - Creativity statistics per round.
- **Jathis.**
  - JathiScript, a deterministic text format.
  - A judge with a correctness gate (span and landing, opening at the eduppu, nothing after the landing, bars, a teermanam with equal gaps), six craft aspects and computed fixes.
  - Chapu talas, atita eduppu, end-at-sam landing, and sama, mridanga and damaru yatis in the generator.
  - Generated jathis export to JathiScript.
- **Repository.**
  - The engine split into ES modules.
  - node:test suite (449,886 checks).
  - Command line tool.
  - Page build with esbuild into self-contained HTML.
  - jsdom smoke test.
  - Playground page.

## 0.1.0

- Single-file engine with the 72 melakartas, 14 janyas, 35 talas, alankaras from formulas in the laghu length, a single-swara kalpana sampler and a jathi generator.
- The formulas matched the later-supplied sheet in only 17 of 35 talas; see README section 20.
