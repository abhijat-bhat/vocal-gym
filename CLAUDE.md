# Working on Vocal Gym

Vocal Gym is a Carnatic practice system. This repository holds its rule-based core: a raga–tala constraint engine (`src/engine/`), a command line tool (`bin/`, `src/cli/`) and web pages built from `web/` into `site/`. Read `README.md` before changing anything.

## Commands
- `npm test`: node:test suite (must stay green).
- `npm run build`: bundles the engine with esbuild and writes the `site/` pages.
- `npm run smoke`: loads the built pages in jsdom and drives every control.
- `npm run check`: `npm run profiles`, the tests, the build and the smoke test.
- `npm start`: the web app at http://localhost:3000 (accounts in `var/vocal-gym.db`; Node 22.13+). `npm run e2e`: drives the app in headless Chrome or Edge.
- `node scripts/make-icons.js`: redraws the app's install icons from the logo.
- `node scripts/import-repertoire.js`: re-imports the repertoire from carnaticnotations.blogspot.com into `data/repertoire/` (`--save-feed f.json`, then `--cache f.json` to re-run offline; `--report` lists the lines off the cycle). Edit the importer, never the generated JSON.
- `node scripts/check-raga-profiles.js`: validates `data/raga-profiles.json`. Add `--fix` to recompute its checked fields.
- `node scripts/solkattu-bank.js`: builds `web/shared/solkattu-bank.js`, the recorded syllables for jathi playback, from WAV recordings (`docs/solkattu-recording.md`). `--clear` empties it.
- `node scripts/mridangam-wav.js --strokes --out dir/` (or `--sollus "tha ka dhi mi" --out x.wav`): renders the synthesized mridangam of `web/shared/mridangam.js`. Its stroke table comes from `research/calibration/mridangam/` (`docs/research/mridangam-synthesis.md`); regenerate it there rather than editing the numbers.

## Rules
- **Hard rules belong in the feasibility tables. Taste belongs in scores.** Never relax a hard guarantee (exact length, raga direction rule, range, landing) to reach a soft goal.
- **Temperature is creativity:** `score = (1 − c)·F + c·N`, with `c = T / 2`, and τ never reaches zero.
- **Determinism:** the same inputs and seed give the same output. Use `rng(seed)` from `src/engine/random.js`; never use `Math.random` in the engine.
- **`src/engine` stays dependency-free and browser-safe.** No Node built-ins.
- **Raga knowledge comes only from `data/raga-profiles.json`, with sources.** Do not invent phrases. The research behind it is in `docs/research/raga-profiles-report.md`. The repertoire (`data/repertoire/`) is notation to read and sing, credited to its site; it does not feed the generators.
- **Edit `web/` and `src/`, never `site/`.** Rebuild with `npm run build`, and commit the rebuilt `site/`.
- **Keep the public API backward compatible.** Deprecate, don't remove.
- **Update the docs with the code:** README sections, CHANGELOG, tests, and Module C of `web/research-plan/index.html` when the generator changes.

## Current work
The plans in `docs/plans/` (kalpana v0.3 and v0.4, gamaka audio) are implemented; see `CHANGELOG.md` (0.9.0 now: the repertoire). Gamaka stays a rendering layer only: it must never change the generated notes, and raga-specific gamaka rules go in `gamakaRender` in `data/raga-profiles.json`, each with a source.

The app (`app/`, `server/`) follows `docs/design.md`: keep its navigation, spacing scale, one primary action per region and the reduced-motion fallbacks when adding pages. Phase 1 of the research plan still lacks Voice Check (`web/research-plan/index.html`, Project plan).