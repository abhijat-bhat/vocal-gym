# Changelog

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
