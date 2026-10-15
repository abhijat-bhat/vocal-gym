# Plan: kalpana swara generator v0.3

**Status:** approved for implementation. **Target version:** 0.3.0.
**Read first:** `CLAUDE.md`, `README.md` sections 5, 6 and 12, `src/engine/kalpana.js`, `docs/raga-profiles.md`, `data/raga-profiles.json` (`generatorGuidance` block).

This plan changes the kalpana swara generator in four ways the project owner asked for:

1. **Raga profiles drive generation.** Characteristic phrases from `data/raga-profiles.json` should make up most of each round, with occasional out-of-the-box phrases.
2. **Jumps are reasoned, not random.** Skips between non-adjacent swaras must have a musical reason. Low temperatures should produce very few of them.
3. **The round lands next to the eduppu swara.** The user gives the swara the composition resumes on (the eduppu swara). The round must end on a legal neighbour of it, either just above or just below in the raga's scale.
4. **A mora is three similar statements, not three identical ones.** For example, with eduppu S: `P M G R , , M G R S , , G R S N.`, not `P M G S , , P M G S , , P M G S`.

Everything else about the engine stays the same:

- **Rules first, taste second.** Hard rules live in feasibility tables. Scores only rank legal choices.
- **Temperature is creativity:** `score = (1 − c)·F + c·N`, with `c = T / 2`.
- **Determinism:** the same seed gives the same round.
- **Exact length:** the round fills its slots exactly.

---

## 0. Ground rules for the implementer

- Work phase by phase (section 9). After each phase, run `npm test`, then `npm run build && npm run smoke`, and commit.
- Never weaken a hard guarantee to make a soft goal easier. Every round must still:
  - have exactly `aksharas × perAkshara` slots;
  - obey the raga's direction rule on every step;
  - stay between mandra P and tara P;
  - end where section 4 says.
- Do not invent musical data. Everything raga-specific comes from `data/raga-profiles.json`. If a raga has no phrases (50 of 86 have phrase confidence `none`), fall back to the generic devices, plus the profile's landing and avoid data where it exists.
- Keep the engine dependency-free and browser-safe. No `fs` in `src/engine`.
- Keep the public API backward compatible:
  - `kalpana(raga, { targetPitch })` must keep working;
  - new options are additive;
  - deprecate `targetPitch` in the docs, but do not remove it.

---

## 1. Data: compile the profiles into an engine module

The JSON is about 500 KB and is the source of truth. The engine should not parse it at runtime in the browser.

**1.1 `scripts/compile-profiles.js` (new).** Reads `data/raga-profiles.json` and writes `src/engine/data/profiles.generated.js`, an ES module with a header saying "generated, do not edit". For each raga id the module exports only what the generator needs:

```js
export default {
  mohanam: {
    landing: [/* pitch classes */], avoidLanding: [],
    nyasa: [], jiva: [], alpa: [], notNyasa: [],
    janta: 'suits', dattu: 'suits',
    confidence: 'high',
    phrases: [ { id: 'mohanam#3', pitches: [7, 9, 12, 9, 7, 4, 2, 0], durs: [1,1,2,1,1,1,1,1],
                 type: 'signature', weight: 0.9, octaveCertain: true, source: 'S12' } ],
    avoid: [ { pitches: [...], strength: 'hard' } ],
  },
  ...
};
```

- Use `parsePhrase` from `scripts/check-raga-profiles.js` for parsing. A karvai lengthens the duration of the previous swara.
- Keep only phrases with `directionRuleOk && inEngineRange && weight >= 0.15`.
- Record whether `anyaSwaras` is non-empty. Those phrases are excluded unless `opts.allowExceptions` is set (section 2.6).

**1.2 Wiring.**

- `src/engine/profiles.js` (new) exports two functions:
  - `getProfile(ragaId)`, which returns the compiled entry or `null`;
  - `setProfiles(obj)`, an override for tests and future teacher-edited profiles.
- `index.js` re-exports both.
- `npm run build` runs `compile-profiles` before esbuild.
- `npm test` fails if the generated module is stale. Add a test that recompiles in memory and compares.

**1.3 `package.json` scripts:**

```
"profiles": "node scripts/compile-profiles.js"
"check": "npm run profiles && npm test && npm run build && npm run smoke"
```

Acceptance: compiling is deterministic; the generated file is committed; the bundle size is reported by the build script.

---

## 2. Phrase-driven generation (request 1)

### 2.1 Phrase devices

Today `CELLS` are relative step shapes applied from any swara. Add a second kind: **anchored phrase devices**. These have absolute pitches taken from the profile.

For each compiled phrase, create these device variants:

| Variant | Pitches | kind | F0 | N0 |
| --- | --- | --- | --- | --- |
| `whole` | as written | `phrase` | `2.0 · weight · typeFactor · confFactor` | −0.5 |
| `octave±1` (only if `octaveCertain` is false, and only if every pitch stays in range) | ±12 | `phrase` | 0.8 × `whole` | −0.5 |
| `fragment` (every contiguous window of 3 to 5 swaras taken from phrases of 5 or more swaras) | sub-span | `phrase-fragment` | 0.6 × `whole` | −0.2 |
| `sequence` (the whole phrase or a fragment shifted ±1 step along the raga's scale, kept only if every internal step is legal and the result is not itself an attested phrase) | shifted | `phrase-variant` | 0.3 × `whole` | +0.6 |
| `inversion` (contour mirrored around the first swara, legal steps only, fragments only, temperature ≥ 1 only) | mirrored | `phrase-variant` | 0 | +0.9 |

The factors come from `generatorGuidance.phrases` in the JSON:

- `typeFactor`: signature 1.0, ending 0.9, janta 0.8, dattu 0.8, connective 0.6;
- `confFactor`: high 1.0, medium 0.8, low 0.5.

`phrase-variant` devices are the **out-of-the-box phrases**. They are rooted in the raga's idiom but are not attested. Count them as *unconventional* in `stats`.

**Application rule.** An anchored device can start from the current swara `i` only when both hold:

- the step from `notes[i]` into its first pitch is legal (`valid`), and is not a repeat unless the phrase starts with a janta;
- its last pitch exists in `notes`.

**Table changes.** Add these devices to the `app` table so they take part in the forward (`fwd`) and backward (`bwd`) reachability tables. Feasibility then stays exact. The table becomes `app[device][i]`. For anchored devices it is non-null only when the entry step is legal; precompute it once per call.

Cache the per-raga device list with a `WeakMap` keyed by the raga object plus the option flags, since it is rebuilt on every call otherwise.

### 2.2 Scoring and the phrase share

Replace the flat device priors with a **phrase-first** policy:

- **F (familiarity):**
  - `phrase` and `phrase-fragment` devices get their F0 above;
  - generic conventional devices (runs, janta, dattu, sequences, cad) keep their F0, multiplied by `genericFactor`:
    - **0.5** for ragas whose phrase confidence is `high`;
    - **0.7** for `medium`;
    - **1.0** for `low` or `none`.
- **Janta and dattu.** If the profile says `janta: 'avoid'`, multiply the janta devices' F by 0.2; if `'suits'`, by 1.2. Do the same for dattu.
- **Running phrase-share controller.** Track the share of slots emitted so far from `phrase` and `phrase-fragment` devices, against a target that depends on temperature:

  ```
  targetShare(T) = 0.70 − 0.20 · T      // T 0 → 0.70, T 1 → 0.50, T 2 → 0.30
  ```

  - If the current share is below the target, add `+0.8 · (target − share) · 4` to every phrase device's score.
  - If it is above the target, add the same amount, negated, to phrase devices, and give the novelty devices the corresponding bonus.

  This is the "predominantly characteristic phrases, with occasional out-of-the-box ones" rule. It works on the sampling scores only, so feasibility is untouched.
- **Novelty.** `phrase-variant` devices and the existing `nov` devices feed N. At high temperature, variants should be the main source of novelty, ahead of raw leaps. Give phrase variants N0 0.6–0.9 and reduce the raw `leap3`/`leap4` N0 by 0.3 (section 3 also gates leaps).
- **Avoid list.** Hard avoid subsequences remove a device in the `app` table whenever the device's notes, plus the previous swara, contain the subsequence. That keeps feasibility exact. Approximate the junction with one swara of look-behind: the device's entry pitch together with `notes[i]`. Soft avoid gives −1.0 F.
- **Landing and resting.** Replace the hard-coded "held S or P" bonus with the profile's `landing` and `nyasa` swaras:
  - +0.6 F for a held swara in `landing`;
  - −0.4 F for one in `avoidLanding` or `notNyasa`;
  - −0.3 F for any held `alpa` swara.
- **Jiva swaras.** Add a small bonus, +0.2 F, for devices that contain a jiva swara, and cap it at +0.4 per device.

### 2.3 Ragas without phrases

Fallback order:

1. Use the profile's landing, avoid, alpa and jiva data with the generic devices.
2. If there is no profile data at all, behave like v0.2.

Report `stats.profileCoverage`: `'phrases'`, `'roles-only'` or `'none'`.

### 2.4 Stats and annotations

Extend `units` and `stats`:

- `units[k].kind` takes the values `phrase | phrase-fragment | phrase-variant | conv | nov | step | mora | start`. Each unit also carries `phraseId` and `source` when it comes from the profile.
- `stats.phraseShare` is the share of slots from `phrase` and `phrase-fragment` devices.
- `stats.variantShare` is the share from `phrase-variant` devices.
- `stats.novelShare` now includes `phrase-variant` together with `nov`.
- `stats.leaps` comes from section 3.

**Demo (`web/demo/demo.js`).** Colour the device kinds like this:

| Kind | Colour |
| --- | --- |
| Attested phrases | Saffron |
| Fragments | Lighter saffron |
| Variants | Violet |
| Mora | Teal |

The title attribute shows the phrase's source id. The audit lists the phrases used, with their sources.

### 2.5 Acceptance (automated, in `test/kalpana.test.js`)

Run over the ragas with phrase confidence `high` or `medium` (27 ragas), rounds of at least 1 avartanam of Adi at 2 swaras per beat, 10 seeds each:

| Check | T = 0 | T = 1 | T = 2 |
| --- | --- | --- | --- |
| Mean `phraseShare` | ≥ 0.55 | ≥ 0.40 | 0.20–0.45 |
| Mean `variantShare + novelShare` | — | — | ≥ 0.25 |
| Hard-avoid subsequences | 0 | 0 | 0 |

At every temperature:

- every round has the exact length;
- every step obeys the direction rule;
- every round stays in range.

### 2.6 Exceptions (anya swara and vakra phrases)

Thirteen janya phrases break the direction rule; they are documented in the profiles. Support them behind `opts.allowExceptions` (default `false`):

- they are emitted atomically as whole phrases;
- legality is checked only at entry and exit;
- the pitches use the anya swara (for example Bilahari N2 = 10).

To do this, extend the `notes` array with the anya pitch for that raga only when the flag is on. Add a test that with the flag off, no anya pitch ever appears.

---

## 3. Reasoned jumps (request 2)

### 3.1 Definitions

A **step** moves 1 index in the raga's union scale, the array `notes` that `kalpana()` already builds. A **leap** moves 2 or more indexes. A move from one device into the next counts as well: the junction between devices is where random-sounding leaps come from today.

A leap is **licensed** if any of these holds:

1. It is inside an attested `phrase` or `phrase-fragment`. The source is the licence.
2. It lands on a structural swara: S, P, or a profile `nyasa`, `jiva` or `landing` swara.
3. It is a consonant interval: a fourth (5 semitones), a fifth (7) or an octave (12). Thirds (3–4 semitones) count when the target is structural.
4. It is the second note of an arpeggio device at temperature ≥ 1.

A leap is **resolved** when, within the next 2 swaras, the line moves by step in the opposite direction ("gap fill"), or holds the landing swara.

Never allowed below T = 1.5 outside attested phrases:

- an augmented fourth or diminished fifth (6 semitones);
- leaps larger than an octave;
- two leaps in a row in the same direction;
- a leap whose target is an `alpa` swara.

### 3.2 Enforcement

**State-independent prohibitions are hard.** These are interval size, the tritone and the `alpa` target. They go into the `app` table for each temperature band (`T < 1.5` and `T ≥ 1.5`), so feasibility stays exact.

- **Implementation note:** the `app` table is computed per call, so this is just a filter that uses `D.T`.
- **Fallback:** if a round becomes infeasible at T < 1.5 because of a filter (rare; tiny spans with distant targets), retry with the filter relaxed one level and set `stats.relaxed = 'leaps'`. Never return `null` when v0.2 would have found a round.

**Path-dependent rules are soft,** because they would blow up the DP state. They apply during forward sampling, with the penalty scaled by `(1 − c)`:

| Rule | F adjustment |
| --- | --- |
| Unlicensed leap | −1.5 |
| Licensed but unresolved leap, judged from the next device's first note | −0.6 |
| Same-direction double leap | −2.0 |
| Leap budget exceeded | −1.0 per extra leap |

The **leap budget** is the number of unlicensed leaps allowed per 8 slots:

| T | 0 | 0.5 | 1 | 1.5 | 2 |
| --- | --- | --- | --- | --- | --- |
| Unlicensed leaps per 8 slots | 0 | 0.5 | 1 | 2 | 3 |

**Junction scoring.** When scoring a candidate device at state `(t, i)`, include the leap from `notes[i]` to its first swara. Today this is ignored for multi-note cells, and that is the source of absurd jumps.

**Register control.** Cap the register span inside one akshara at 9 semitones for T < 1, and at 12 above that. Add a soft penalty of −0.8 per extra semitone.

### 3.3 Stats

```
stats.leaps = { total, licensed, unlicensed, unresolved, perEight }
```

The demo shows them as: "2 leaps, both landing on nyasa swaras".

### 3.4 Acceptance

Run over all 86 ragas, 10 seeds, rounds of at least 8 slots:

| Check | T = 0 | T = 1 | T = 2 |
| --- | --- | --- | --- |
| Mean unlicensed leaps per 8 slots | ≤ 0.25 | ≤ 1.0 | ≤ 3.0 |
| Unresolved leaps (as a share of all leaps) | ≤ 10% | — | — |
| Tritone leaps outside attested phrases | 0 | 0 | — |
| Leaps larger than an octave outside attested phrases | 0 | 0 | — |
| Same-direction double leaps outside attested phrases | 0 | 0 | — |

---

## 4. Landing next to the eduppu swara (request 3)

### 4.1 Input

Add a new option, `eduppuPitch`: the pitch the composition resumes on, including its octave, for example `0` for madhya S or `7` for P. The singer sings this swara at the eduppu. It is **not** part of the kalpana output.

`targetPitch` keeps its v0.2 meaning (the last swara itself) for backward compatibility. If both are given, `eduppuPitch` wins. The demo and CLI switch to `eduppuPitch`:

- UI label: "Composition resumes on";
- CLI flag: `--eduppu-swara P` (`--land` is kept as a deprecated alias for `targetPitch`).

### 4.2 Legal neighbours

With arohana list `A` and avarohana list `V` (extended across octaves exactly as `makeProjector` does), the legal neighbours of `e` are:

- **lower neighbour** `lo(e)`: the arohana swara immediately before `e` in `A`, so the singer *ascends* into `e`. This exists only if `e` is an arohana swara.
- **upper neighbour** `hi(e)`: the avarohana swara immediately before `e` in `V` (the next swara above `e` in descent), so the singer *descends* into `e`. This exists only if `e` is an avarohana swara.

The final swara of the round must be in `{ lo(e), hi(e) }`, inside the kalpana range. The final swara is the last sounding swara, which may be held. `e` itself is never the final swara.

| Raga | Eduppu | Lower neighbour | Upper neighbour |
| --- | --- | --- | --- |
| Kalyani | S | Ṇ | R |
| Kalyani | P | M₂ | D |
| Mohanam | P | G | D |
| Mohanam | S | Ḍ | R |
| Saveri | M | R (G is not in arohana) | P |
| Saveri | G | — (G is not in arohana) | M (descent only) |
| Hamsadhwani | S | Ṇ | R |

**Implementation.** Change `inSet` for the free ending to `i ∈ {lo, hi}`. For the mora, constrain the last statement's last swara (section 5).

**Choosing between the two neighbours.** Score both (F):

- +0.4 if the neighbour is in `landing` or `nyasa`;
- +0.3 for approaching from above when `e` is S or P;
- +0.3 for approaching from below when `e` is a jiva swara.

These preferences are deliberately mild. Record the choice in `res.ending.approach = 'above' | 'below'`.

**Error cases.** Return a structured reason instead of a bare `null`, as `{ error }`:

- `e` is not a swara of the raga;
- `e` is out of range;
- no neighbour is reachable in the span.

To stay backward compatible, `kalpana()` still returns `null` for old callers, and the new helper `kalpanaRound()` returns `{ error }`.

### 4.3 Acceptance

For all 86 ragas, every swara of the raga as the eduppu in madhya sthayi, plus tara S, and 3 seeds:

- the final swara is always `lo(e)` or `hi(e)`;
- the step from the final swara to `e` is always legal;
- with `eduppuPitch` given, the output never ends on `e`.

---

## 5. Graded mora (request 4)

### 5.1 Shape

A mora has three statements S1, S2, S3, separated by two equal karvai gaps `q`. The statements are **similar, not identical**: each is a transform of one base pattern.

| Style | Statements | Example (eduppu S) | Lengths |
| --- | --- | --- | --- |
| `shift` (default) | Same contour, shifted one scale step toward the eduppu each time | `P M G R , , M G R S , , G R S N.` | u, u, u |
| `gopuccha` | Shift, and drop one swara from the front of each statement | `P M G R S , , G R S , , R S N.` | u, u−1, u−2 |
| `srotovaha` | Shift, and add one swara each time | `G R , , M G R , , P M G N.` (illustrative) | u, u+1, u+2 |
| `identical` | v0.2 behaviour; off by default, available as `moraStyle: 'identical'` | `D N S' , , D N S' , , D N S'` | u, u, u |

- **The last swara of S3** is `lo(e)` or `hi(e)` (section 4).
- **Shift direction:** statements move toward the eduppu's register.
  - When the mora starts above `e`, the statements step **down**. This is the default and the commonest cadence. `PMGR → MGRS → GRSN.` steps down and ends on `lo(S)` = Ṇ, from which the singer rises into S.
  - When the mora starts below `e`, they step **up**.
  - Allow the opposite direction at temperature ≥ 1, with N +0.5.

### 5.2 Construction (backward, exact)

1. **Pick the landing.** Choose `f ∈ {lo(e), hi(e)}`.
2. **Pick a contour template** of length u (3–5). Candidates, in order of F:
   - (a) the contour, as relative scale-index steps, of an attested phrase or fragment from the profile that ends with a step into `f` or an equivalent step;
   - (b) the contours of `ending`-type phrases;
   - (c) generic contours: stepwise descending `[-1,-1,-1]`, the turn `[+1,-1,-1]`, dattu `[-2,+1,-1]`.
3. **Realise S3** backward from `f` along the template, in the raga's union scale. Every internal step must be legal.
4. **Realise S2 and S1** by shifting S3's template ±1 scale index per statement, or applying the gopuccha or srotovaha rule. Use the shift direction from 5.1. Every internal step must be legal.
   - In asymmetric ragas a shift can land on a swara that is illegal in that direction. Then try a shift of ±2, then fall back to projecting the statement with `makeProjector(raga).repair`. Mark projected statements `adjusted: true`, and reject the mora if more than 1 swara per statement is adjusted.
5. **Junctions.** The last swara of S1, held for 1 + q slots, followed by the first swara of S2, must be a legal step and must not be a repeat. Same for S2 → S3.
6. **Arithmetic.**
   - `shift`: total = 3u + 2q.
   - `gopuccha`: total = 3u − 3 + 2q.
   - `srotovaha`: total = 3u + 3 + 2q.

   q ranges over 0 … 2·perAkshara. The body length is B = slots − total, with B ≥ max(2, perAkshara), and the mora takes at most 60% of the slots, as now.
7. **Feasibility.** The mora is kept only if `fwd[B][i]` holds for some body swara `i` from which the step into S1's first swara is legal. Use the existing forward table.
8. **Scoring.**

   | Term | Bonus |
   | --- | --- |
   | F: contour from an attested phrase | +1.0 |
   | F: stepwise template | +0.6 |
   | F: all three statements start on beats | +0.9 |
   | F: `shift` style | +0.3 |
   | N: generic template | +0.5 |
   | N: opposite shift direction | +0.5 |
   | N: gopuccha or srotovaha | +0.6 |
   | N: off-beat statements | +0.7 |

   Sample with τ as now.

### 5.3 API and stats

- New option `moraStyle: 'auto' | 'shift' | 'gopuccha' | 'srotovaha' | 'identical'`, default `'auto'`. Auto picks among `shift`, `gopuccha` and `srotovaha` by score, and never picks `identical`.
- `res.ending` becomes:

  ```
  { type: 'mora', style, statements: [[pitches], [pitches], [pitches]], q, start, approach, adjusted }
  ```

- `units` keeps three `mora` units, named "mora 1 of 3" and so on.

### 5.4 Acceptance

Over all ragas with a mora ending:

- under `auto`, no two statements are identical;
- the statements share a contour (equal relative step patterns, or the gopuccha/srotovaha relation);
- the gaps are equal;
- the junctions are legal;
- S3 ends on `lo(e)` or `hi(e)`;
- the total arithmetic holds.

Add a golden test: Mayamalavagowla, eduppu S, `moraStyle: 'shift'`, length chosen so u = 4 and q = 2, a fixed seed. It must contain three statements whose relative steps are equal and which descend one step each time. Assert the shape, not the exact notes.

---

## 6. Interfaces to update

| Place | Change |
| --- | --- |
| `src/engine/kalpana.js` | Split into `src/engine/kalpana/` with these files:<br>`devices.js` (generic cells plus anchored phrase devices)<br>`leaps.js` (licensing, resolution, budget)<br>`landing.js` (neighbours)<br>`mora.js` (graded mora)<br>`index.js` (`kalpana` and `kalpanaRound`)<br>Keep `CELL_DEFS` and `CELLS` exported. |
| `src/engine/index.js` | Export `getProfile`, `setProfiles`, `kalpanaRound`, `eduppuNeighbours`. |
| `src/cli/main.js` | `kalpana --eduppu-swara P [--mora-style shift] [--allow-exceptions]`. Print the units with their phrase sources, the leap stats and the mora style. |
| `web/demo/demo.html`, `demo.js` | Replace "Land on" with "Composition resumes on". Add "Mora style". Add colours for phrase, fragment and variant. Show phrase sources and leap stats in the audit. |
| `web/research-plan/index.html` | Module C: update the device description, landing rule and mora description, and the measured numbers. |
| `README.md` | Section 12: rewrite for v0.3 (profiles, leaps, landing, graded mora). Section 13: API. Section 16: test counts. Add `data/` and `docs/` to the layout. |
| `CHANGELOG.md` | 0.3.0 entry. |

---

## 7. Tests to add or change

- **`test/kalpana.test.js`.** Keep the current invariants. Change "ends on target" to "ends on a legal neighbour of the eduppu" when `eduppuPitch` is given. Add the acceptance checks from sections 2.5, 3.4, 4.3 and 5.4.
- **`test/raga-profiles.test.js`.** Keep it as is. Add: the compiled module is up to date with the JSON.
- **`test/kalpana-phrases.test.js` (new).** For a few well-documented ragas (Kalyani, Todi, Mohanam, Hamsadhwani, Hemavati):
  - at T = 0, at least one `signature` phrase appears in 80% or more of 20 seeds;
  - every emitted phrase unit matches its profile pitches exactly, or the pitches shifted by an octave when `octaveCertain` is false.
- **`test/cli.test.js`.** `--eduppu-swara` and `--mora-style`.
- **Smoke test.** Kalpana presets use the new control; the audit shows phrase sources.

Keep the total runtime under 30 seconds. If needed, sample ragas instead of looping over all 86 × every option.

---

## 8. Risks and decisions

| Risk | Decision |
| --- | --- |
| Profiles are thin for 50 ragas | Fallback path (2.3); report coverage in the demo ("phrase data: none for this raga") so users are not misled. |
| Phrase strings came through a summarising fetch; octaves partly inferred | Respect `octaveCertain`; allow ±octave variants; keep weights from the JSON. A teacher review screen is a later phase. |
| Phrase devices make rounds repetitive | The phrase-share controller, a −0.8 F penalty for reusing the same `phraseId` within a round, and fragments for variety. |
| Hard leap filters make short spans infeasible | One-level relaxation, flagged in stats (3.2). |
| Graded mora shifts land on illegal swaras in asymmetric janyas | Try ±2, then repair with ≤ 1 adjusted swara per statement, else reject that template (5.2). |
| Performance (phrase devices × swaras × slots) | Precompute per raga; typical sizes are 200–600 devices × 22 swaras × ≤ 116 slots, which is fine. Add a micro-benchmark to the smoke test: 100 rounds under 1 s. |

---

## 9. Phases (commit after each)

1. **Profiles compile and load.** `compile-profiles`, `profiles.js`, the stale-check test. No behaviour change.
2. **Landing next to the eduppu** (section 4), with the API, CLI and demo controls. Its tests.
3. **Reasoned jumps** (section 3): junction scoring, licensing, filters, stats, tests.
4. **Phrase-driven generation** (section 2): devices, scoring, the share controller, avoid, landing data, stats, demo colours, tests.
5. **Graded mora** (section 5): construction, styles, tests, demo control.
6. **Docs and pages:** README, CHANGELOG, research plan Module C, rebuild `site/`, version 0.3.0.

**Definition of done:**

- `npm run check` passes;
- every acceptance table in this plan is met and printed as test diagnostics;
- the demo shows a Kalyani round at T = 0 made mostly of attested phrases, ending next to the chosen eduppu swara, with a graded mora.
