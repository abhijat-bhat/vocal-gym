# Working on Vocal Gym

Vocal Gym is a Carnatic practice system. This repository holds its rule-based core: a raga–tala constraint engine (`src/engine/`), a command line tool (`bin/`, `src/cli/`) and web pages built from `web/` into `site/`. Read `README.md` before changing anything.

## Commands
- `npm test`: node:test suite (must stay green).
- `npm run build`: bundles the engine with esbuild and writes the `site/` pages.
- `npm run smoke`: loads the built pages in jsdom and drives every control.
- `npm run check`: all of the above, plus `npm run profiles` once the plan adds it.
- `node scripts/check-raga-profiles.js`: validates `data/raga-profiles.json`. Add `--fix` to recompute its checked fields.
- `node scripts/solkattu-bank.js`: builds `web/shared/solkattu-bank.js`, the recorded syllables for jathi playback, from WAV recordings (`docs/solkattu-recording.md`). `--clear` empties it.
- `node scripts/mridangam-wav.js --strokes --out dir/` (or `--sollus "tha ka dhi mi" --out x.wav`): renders the synthesized mridangam of `web/shared/mridangam.js`. Its stroke table comes from `research/calibration/mridangam/` (`docs/research/mridangam-synthesis.md`); regenerate it there rather than editing the numbers.

## Rules
- **Hard rules belong in the feasibility tables. Taste belongs in scores.** Never relax a hard guarantee (exact length, raga direction rule, range, landing) to reach a soft goal.
- **Temperature is creativity:** `score = (1 − c)·F + c·N`, with `c = T / 2`, and τ never reaches zero.
- **Determinism:** the same inputs and seed give the same output. Use `rng(seed)` from `src/engine/random.js`; never use `Math.random` in the engine.
- **`src/engine` stays dependency-free and browser-safe.** No Node built-ins.
- **Raga knowledge comes only from `data/raga-profiles.json`, with sources.** Do not invent phrases. The research behind it is in `docs/research/raga-profiles-report.md`.
- **Edit `web/` and `src/`, never `site/`.** Rebuild with `npm run build`, and commit the rebuilt `site/`.
- **Keep the public API backward compatible.** Deprecate, don't remove.
- **Update the docs with the code:** README sections, CHANGELOG, tests, and Module C of `web/research-plan/index.html` when the generator changes.

## Current work
`docs/plans/kalpana-v0.3.md` is the approved plan for the kalpana swara generator. Implement it phase by phase, running `npm run check` and committing after each phase.

Next, `docs/plans/gamaka-audio.md` adds gamaka rendering to kalpana playback. Start it once kalpana-v0.3 Phase 1 (profile compilation) is committed. Gamaka is a rendering layer only: it must never change the generated notes. Raga-specific gamaka rules go in `gamakaRender` in `data/raga-profiles.json`, and every rule needs a source.