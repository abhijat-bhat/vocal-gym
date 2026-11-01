# Plan: gamaka rendering for kalpana swara audio (v0.4)

**Status:** implemented in v0.4. v0.5 replaced the contour's motion (rounded turns, natural timing, overshoot, preparation, fluctuation) and `depth` with an intensity dial, following `docs/research/gamaka-naturalness.md`. §2's constants and §3.5 describe the v0.4 contour, which `natural: false` still produces. v0.6 adds the papers' timing, coarticulation and grammar refinements (`docs/research/gamaka-papers.md`), the expression layer, and a sung voice for playback (`docs/research/expressive-voice.md`); the oscillator voice of §5 remains as "Simple tone".
**Read first:** `CLAUDE.md`, `docs/plans/kalpana-v0.3.md` §1 (profile compilation), `data/raga-profiles.json` (the `gamaka` and `swaraRoles` blocks), `web/demo/demo.js` (`tone`, `playPitched`), `src/engine/kalpana.js` (the `units` output).

## Goal

When a kalpana round is played, each swara should sound with the raga's gamaka, not as a flat keyboard tone. Todi's G should swing up towards M. Sankarabharanam's G should stay flat. Kalyani's descending notes should be flicked from the note above. Mayamalavagowla's G should oscillate against a held M.

## Non-goals

- Changing what the generator writes. Gamaka is a **rendering layer**: it reads a finished note list and never feeds back into feasibility, scores or the swara sequence.
- Learning a neural model. That is a possible later step (§9). v0.4 is rule-based, deterministic, and explainable in the UI.
- Exact imitation of any singer. The target is "recognisably idiomatic to a Carnatic listener", checked by a listening test (§8).

---

## 0. What the research says, and the design choices it drives

| Finding | Source | Design consequence |
|---|---|---|
| A sung pitch curve breaks into **constant-pitch notes** (CPNs: within ±30 cents for ≥ 80 ms) and **transients** between them. **Stationary points** (STAs) are the turning points inside transients, typically about 100 ms long. | Viraraghavan et al., ISMIR 2017; ISMIR 2018 | Every swara is rendered as a short list of **targets** (CPNs and STAs) joined by smooth transitions. Nothing else is needed to represent a gamaka. |
| Transients never occur alone: every sung swara has at least one CPN anchor. Chains of transients rarely last longer than about 1.5 times the mean CPN. | ISMIR 2017 | **Anchor rule:** each rendered swara keeps at least one CPN (on itself or on its stated anchor note). A chain-length limit forces a plain note after long gamaka runs. |
| Listeners showed no clear preference between **cosine and linear interpolation** between targets. STA pitch tolerance is about 60 cents; CPN tolerance is about 20 cents. | ISMIR 2018; IITM SBT talk (2022) | Use half-cosine interpolation between targets. Exact STA heights don't matter much; the **choice of target notes** matters most. |
| When tempo changes, **CPNs stretch about 3–4 times more than transients**. Transients keep roughly the same duration in seconds. | Viraraghavan, *Non-uniform time-scaling of Carnatic music transients* (arXiv 1711.02318) | Gamaka transitions are specified **in seconds**, not as fractions of a note. Faster tempos shorten the CPNs first, then drop oscillation cycles (§3.4). |
| Gamaka complexity falls as tempo rises. | Sankaranarayanan & Weinberg, ISMIR 2022 LBD (GamakaNet) | The same mechanism: a degradation ladder driven by duration in seconds. |
| Todi: 72% of alapana time is moving pitch. S and P are steady. G ranges from about 41–200 cents (minimum) to 384–616 cents (maximum), so it reaches M and beyond. N is almost always oscillated. D oscillates from around P. M takes one quick upward oscillation in ascent. | M. Subramanian, Sangeet Natak 2007 (profile source S37) | Oscillation targets are **raga notes named in the sources** ("G between R and M"), not abstract widths. That data is already in `gamaka` as text. |
| Without gamaka, Todi drifts to Sindhubhairavi. Without plain G, Sankarabharanam stops being Sankarabharanam. | S37, S76 | Gamaka carries raga identity. Ragas with no data must get a **conservative** default (§4), not invented colour. |
| Experts identified Todi, Varali and Kalyani from **transients alone** at 86–95% accuracy, but Sankarabharanam at only 22%. | ISMIR 2017 listening test | Evaluate per raga. A "plain" raga is a correct outcome, not a failure (§8). |
| The dasavidha and related gamaka types: kampita (oscillation), jaru (ētra/irakka slides), nokku (stress from above), odukkal (stress from below), orikkai (a flick up at the end of a note), sphurita (the repeated note struck from below), pratyahata (a descending pair struck from below), andolita (a slow swing). | Wikipedia, *Gamaka (music)* | These are the names of the **shape templates** in §2. They map one-to-one onto the vocabulary used in the profile texts. |
| Flute-synthesis work predicted gamaka presence and type from the neighbouring notes (±1 to ±3) with a random forest: 77% accuracy for presence, 70% for type. | NITK thesis, *Modelling of Gamakas for Karnatic Flute Music Synthesis* | The **resolver** (§3) decides from context: the previous and next notes, direction, duration, janta, and the phrase. One neighbour on each side is enough for most choices. |

---

## 1. Data: from text notes to structured render rules

### 1.1 What is in the profiles now

Twenty-three ragas have a `gamaka` object of per-swara **text**, with sources. Examples:

- `mela8` Hanumatodi (S37): G "wide oscillations reaching up to about M"; D "oscillation from around P".
- Mechakalyani (S144): orikkai in descent, "(s')n (n)d (p)m (m)g (g)r".
- Dheerasankarabharanam (S76): G "highly flat and plain"; R, M and D "strong gamaka".
- Mayamalavagowla (S40): G "in oscillation against a held M"; S, M and P plain.
- Gourimanohari (S53): G2 almost always oscillated; M plain next to G2.

The remaining 63 ragas have no gamaka data.

### 1.2 New field: `gamakaRender` (additive; schemaVersion stays 1)

Add it to each raga entry next to `gamaka`. The `gamaka` text stays as it is, because it is the evidence. `gamakaRender` is a **transcription** of that evidence into rules, and each rule points at the text it came from.

```jsonc
"gamakaRender": {
  "style": "heavy",                 // heavy | medium | light | plain | default  (§4)
  "basis": "text",                  // text | measured | default
  "rules": {
    "S": [ { "body": "plain", "src": "S37" } ],
    "P": [ { "body": "plain", "src": "S37" } ],
    "G": [
      { "when": { "minSec": 0.35 }, "body": "kampita", "lo": "R", "hi": "M", "end": "self", "cycles": [1, 3], "src": "S37" },
      { "body": "kampita", "lo": "self", "hi": "M", "cycles": [1, 1], "src": "S37" }
    ],
    "M": [
      { "when": { "dir": "up" },   "body": "kampita", "lo": "self", "hi": "P", "cycles": [1, 1], "src": "S37" },
      { "when": { "dir": "down" }, "body": "plain", "src": "S37" }
    ],
    "D": [ { "body": "kampita", "lo": "P", "hi": "self", "end": "self", "cycles": [1, 2], "src": "S37" } ],
    "N": [ { "body": "kampita", "lo": "D", "hi": "S'", "end": "self", "cycles": [1, 3], "src": "S37" } ],
    "R": [ { "onset": "odukkal", "from": "S", "body": "plain", "src": "S37" } ]
  },
  "global": [
    { "maxChain": 4, "src": "ISMIR2017" }
  ]
}
```

Field meanings:

| Field | Values | Meaning |
|---|---|---|
| `when` | `dir`: `up`, `down`, `turn` or `any`; `minSec` and `maxSec`; `prev` and `next` (swara letters); `janta: true`; `inPhrase` (a phrase string from `phrases`); `octave` | All the conditions that must hold. The first matching rule in the list wins (§3.2). |
| `onset` | `none`, `jaru`, `nokku`, `odukkal`, `sphurita`, `pratyahata` | How the swara is entered. |
| `body` | `plain`, `kampita`, `andolita` | What happens while the swara is held. |
| `exit` | `none`, `orikkai`, `jaru` | How the swara is left. |
| `lo`, `hi`, `from` | `self`, a swara letter with an optional octave mark (`M`, `S'`, `N.`), `+1` or `-1` (the next raga swara up or down), or `±Nc` (cents, for measured data only) | Targets are **raga notes**. This follows the sources, and it is what Viraraghavan's raga-specific quantisation showed to be right. |
| `end` | `self`, `lo` or `hi` | Where the oscillation comes to rest. The default is `self`. |
| `cycles` | `[min, max]` | The number of oscillation cycles before time-fitting (§3.4) reduces it. |
| `dwell` | `even`, `hi` or `lo` | Which end of the oscillation gets the longer stay. The default is `even`. |
| `depth` | 0–1 | A rule-level scale on the oscillation width, for text such as "slight". It multiplies the global depth (§3.5). |
| `weight` | number | Used only when several rules match equally (§3.2). |
| `src` | a source id | Required. The validator rejects rules without one. |

Rules for transcribing the text:

1. **Transcribe only what the text says.** "G oscillates up to about M" becomes `kampita lo: self/R, hi: M`. Text such as "permits strong gamaka" (Sankarabharanam R, M and D) names no target, so it becomes `kampita lo: -1, hi: self` with `"basis": "text-vague"` on the rule. The UI shows that it is a generic reading.
2. **"Plain", "flat" and "constant" become `body: "plain"`**, and such rules take precedence over the style default.
3. Add `"interpretation": "…"` whenever a rule needed judgement, so a musician can review it.
4. Leave out what the text does not support. Uncovered swaras fall back to the style default (§4).

### 1.3 Worked transcriptions, used as test fixtures

| Raga (source) | Rules |
|---|---|
| **Mechakalyani** (S144) | G: `kampita lo: R, hi: M` (from "g(r)/(m)g"). Every swara with `when.dir: down`: `onset: nokku, from: +1` (orikkai in descent, "(s')n (n)d (p)m (m)g (g)r"). N with `prev: D` or `prev: P`: `onset: odukkal, from: D` ("p (d) n": in Parrikar's notation, (x)y means y touched from x). N with `next: S'`: `onset: nokku, from: S'` ("approached from S' or R'"). |
| **Dheerasankarabharanam** (S76) | G: `plain`, with priority over everything. R, M, D: `kampita lo: -1, hi: self`, `basis: text-vague`. N: `plain` with `onset: jaru` from the neighbour ("very little gamaka; always with neighbouring notes"). |
| **Mayamalavagowla** (S40) | S, M, P: `plain`. G: `kampita lo: self, hi: M, end: hi, dwell: hi` ("M,G M,G": the time sits on M). R: `kampita lo: S, hi: self`. D: `kampita lo: P, hi: self`. N with `next: S'` and `dir: up`: `plain` ("occasionally held flat before S"). |
| **Gourimanohari** (S53) | G: `kampita lo: R, hi: M` (almost always). R: `plain`, but `when.janta`: `sphurita`. M with `next: G` or `prev: G`: `plain`. M with `inPhrase: "M P D N S'"`: `onset: nokku`, `body: kampita lo: G, hi: self`. |
| **Abhogi** (S152) | G with `dir: up`: `onset: nokku, from: M` (M is above G, so this is a touch from above), `body: kampita lo: self, hi: M, cycles: [1,1]`, rule-level `depth: 0.5` for "slight". |

Claude Code writes all 23 transcriptions in Phase 0. A musician should review the `interpretation` lines before the listening test.

### 1.4 New sources for `sources`

Add these as `S193` and up: Viraraghavan et al. ISMIR 2017 and 2018; the arXiv paper 1711.02318; Sankaranarayanan & Weinberg ISMIR 2022 LBD; Plaja-Roglans et al. TISMIR 2023 (SCMS); Wikipedia *Gamaka (music)*; and the NITK flute gamaka thesis. Then `global` and default rules can cite them.

### 1.5 Compiling and validating

- **`scripts/compile-profiles.js`** (from v0.3) also emits `gamakaRender` per raga into `profiles.generated.js`. It resolves swara letters to semitones with the raga's own swarasthanas, so the engine never parses letters at render time.
- **`scripts/check-raga-profiles.js`** gains these checks:
  - every rule swara and target letter is in the raga's scale (or is an explicitly listed anya swara);
  - enums are valid;
  - `src` exists in `sources`;
  - `cycles[0] ≤ cycles[1]`;
  - no rule targets a note more than 7 semitones away;
  - `lo < hi` once resolved.
- `docs/raga-profiles.md` documents the field.

---

## 2. Shape templates (pure geometry)

**Units.** Pitch is in semitones above Sa as a float, matching the engine's `p`. Time is in seconds from the start of the note. A shape returns **targets**: `[{p, dur, kind: 'cpn' | 'sta'}]`. A target's `dur` is its dwell time; transitions between targets are added by the contour builder (§3.3).

| Template | Targets (n = the swara's own pitch) |
|---|---|
| `plain` | `[cpn n]` |
| `kampita {lo, hi, cycles, end, dwell}` | An optional head `cpn n`, then STAs alternating `hi, lo, hi, …` for `cycles` cycles, then a CPN at `end`. With `dwell: hi`, the hi STAs are long and the lo ones short (Mayamalavagowla "M,G"). |
| `andolita` | Like kampita but slower: dwell × 1.8 and at most 2 cycles. |
| onset `nokku {from}` | A short STA at `from` (above) before the body. |
| onset `odukkal {from}` | A short STA at `from` (below) before the body. |
| onset `jaru` | No extra target. The transition from the previous note is lengthened (to `JARU_SEC`) and starts at the previous pitch. |
| onset `sphurita` | Only on the second note of a janta pair: a short STA at `-1`, then the body. |
| onset `pratyahata` | Only on the first note of a descending pair: an STA at `-1` before it. |
| exit `orikkai` | An STA at `+1` in the last `ORIKKAI_SEC` of the note. |
| exit `jaru` | The transition into the next note starts early and is long. |

**Constants**, in `src/engine/gamaka/constants.js`. These are defaults to tune in Phase 5.

| Name | Default | Basis |
|---|---|---|
| `CPN_MIN` | 0.08 s | The 80 ms CPN definition (ISMIR 2017). |
| `STA_DWELL` | 0.06 s | About 100 ms STA, minus the transitions. |
| `TRANS_SEC` | 0.05 s | Mean transient about 100 ms, shared by two halves. |
| `JARU_SEC` | 0.14 s | A deliberate slide, perceptibly longer than a transition. |
| `NOKKU_SEC` | 0.05 s | A short flick. |
| `ORIKKAI_SEC` | 0.07 s | |
| `MAX_RATE_HZ` | 5 | One cycle takes at least 2 × (STA_DWELL + TRANS_SEC) ≈ 0.22 s. |
| `LAND_HOLD` | 0.25 s | The final swara before the eduppu keeps a plain CPN at least this long, so the singer gets a clean pitch reference. |

**Interpolation.** Between targets a and b over time u ∈ [0, 1], p(u) = a + (b − a)(1 − cos πu)/2. ISMIR 2018 found this equivalent to linear, and it avoids corner clicks.

---

## 3. The renderer: notes → pitch contour

New directory **`src/engine/gamaka/`**. It is pure and dependency-free, and uses `rng` only for the optional variety in §3.6.

```js
// src/engine/gamaka/index.js
export function renderGamaka(notes, opts) → {
  points: [{ t, p }],          // the contour, t in seconds from 0, p in semitones (float)
  notes:  [{ i, t0, t1, p, rule, shape, src, basis, degraded }],  // one per input note, for the UI and tests
  stats:  { gamakaShare, degradedShare, chainBreaks }
}
// notes: [{ p, dur }]  (dur in slots; p === null is a rest), the existing kalpana output
// opts:  { ragaId, slotSec, depth = 1, style = 'auto', seed, variety = 0, landing = true, units? }
```

### 3.1 Context per note

For each note i the renderer computes:

- `prev` and `next` pitches;
- `dir`: `up` (prev < p ≤ next), `down`, `turn` (a peak or valley) or `flat`;
- `sec = dur × slotSec`;
- `janta` (`p === prev`);
- `leap` (the step is larger than the raga's adjacent interval);
- `pos`: first, last or the landing note.

It also takes the unit `kind` (device, mora, phrase id from v0.3) when `opts.units` is passed.

### 3.2 Choosing a rule

1. Collect this swara's rules (by pitch class; octave-specific rules first).
2. Keep those whose `when` conditions all hold.
3. Order by specificity (the number of conditions), then by list order. Take the first.
4. If several rules tie and `variety > 0`, choose by weight using `rng(seed ^ i)`. Otherwise use list order. **Variety is off by default**, which keeps the existing determinism contract trivially.
5. If no rule matches, use the style default (§4).
6. Overrides, in order:
   - **Landing:** the last note of the round becomes a `plain` body with a CPN of at least `LAND_HOLD` and no exit.
   - **Leap:** for a dattu step of more than 4 semitones, drop any jaru onset unless the rule asks for `jaru` explicitly.
   - **Chain limit:** after `maxChain` consecutive non-plain notes, the next note of 0.15 s or longer becomes plain.
   - **Mora consistency:** corresponding positions in the three mora repetitions use the same template, transposed to the actual pitches. Graded moras shift pitch, so the template is chosen once from the first repetition and re-resolved only if it would now be illegal.

### 3.3 Building the contour

For each note, the renderer builds the target list from its shapes in the order onset, body, exit. It then fits that list into the note's window `[t0, t1]` (§3.4), inserts a transition of `TRANS_SEC` (or `JARU_SEC`) between consecutive targets, including across note boundaries, and samples the result.

The swara's **perceived attack stays on the beat**: the onset STA starts at `t0`, and the transition from the previous note ends at `t0 + TRANS_SEC/2`.

Rests (`p === null`) break the contour into separate **legato groups**. The audio layer starts a new voice for each group.

### 3.4 Fitting time: the degradation ladder

Transients keep their durations in seconds; only CPNs and cycles give way. For a note with `sec` available:

1. If the full shape plus `CPN_MIN` fits, render it in full and give the spare time to the head or end CPN.
2. Otherwise reduce `cycles`, down to its minimum and then to 1.
3. Otherwise keep only the onset (nokku, jaru or odukkal) and a CPN.
4. Otherwise render it `plain`. A note shorter than about 0.1 s is a pure transition into the next note.
5. Set `degraded = n` on that note, and count it in `stats.degradedShare`.

This makes the 2nd and 3rd kalams sound idiomatically lighter without any extra rules.

### 3.5 Depth

`depth ∈ [0, 1]` scales every STA's distance from the note's own pitch: p_sta = n + depth × (target − n). `depth = 0` reproduces today's plain playback exactly. That gives a regression test and an A/B switch for listening tests.

### 3.6 Humanising (optional, off by default)

A deterministic pitch scatter from `rng(seed)` uses the precision model σ(t) = √(σr² + σs²·e^(−t/T)) with σr = 8 c, σs = 40 c and T = 0.15 s, scaled by `opts.humanize ∈ [0, 1]`. The defaults are near the lower end of Viraraghavan's fitted ranges, so it adds life without sounding out of tune. Ship it at 0, and decide after the listening test.

---

## 4. Ragas without data (63 of 86)

Never invent colour. Use a **style** default, computed in the profile compiler and recorded with `basis: "default"`:

| Style | Applies to | Behaviour |
|---|---|---|
| `plain` | Opt-in for any raga | Everything plain. |
| `light` (default for melas with no data) | All 47 data-poor melas, and vivadi melas especially | S and P plain. A note of 0.4 s or longer gets `kampita lo: -1, hi: self, cycles [1,1]` at depth 0.5. Notes in descending runs get `nokku from +1` only when they last 0.2 s or longer. Janta second notes get `sphurita`. |
| `medium` | Ragas whose text says gamaka is pervasive but gives no per-swara detail (Mohanam "sarva swara gamaka", low reliability) | `light` at depth 0.8, with cycles up to 2. |
| `heavy` | Only ragas with per-swara rules | Rules decide. The style default applies only to swaras the rules don't mention, and then as `light`. |

The **S and P plain** default rests on the general principle that the prakriti swaras S and P are held steady. It agrees with every raga in the data that mentions them (Todi, Mayamalavagowla). It is overridable per raga.

Three things the UI should show:

- A badge per raga: "Raga-specific gamaka (sources: S37)", "Gamaka from text, partly interpreted" or "Generic gamaka: no raga-specific data yet".
- The rule and source for each swara in a hover or tooltip.
- A link to `docs/research/raga-profiles-report.md` for the gaps.

---

## 5. Audio: from contour to sound (`web/demo/demo.js`)

Today, `tone()` starts one triangle oscillator per note at a fixed frequency. Replace that path with a **continuous voice per legato group**:

1. **Pitch automation.** Sample the contour every 5 ms. Convert it with `Hz = saHz() · 2^(p/12)` into a `Float32Array`, and apply it with `osc.frequency.setValueCurveAtTime(curve, t0, dur)`. One curve per group avoids overlapping automation events, which the Web Audio spec forbids for value curves. Converting per sample keeps glides log-linear.
2. **Timbre.** Use a `PeriodicWave` with about 8 harmonics and roughly a 1/n^1.2 roll-off. Viraraghavan's listening tests used a 5-harmonic synth, which was enough for experts to hear gamakas. Pass it through two parallel band-pass "formant" filters (about 700 Hz and 1150 Hz, for an "aa") mixed with the dry signal. Add **no Western vibrato**: plain Carnatic notes are steady, and vibrato would blur the plain/oscillated contrast that carries raga identity.
3. **Swara articulation.** At each note boundary inside a group, dip the gain by about 25% for about 25 ms, so each swara is "spoken" as in swara singing. There is no dip when the boundary sits inside a `jaru`.
4. **Toggle and controls.** Add a "Gamaka: off / light / full" select (depth 0, 0.5 or 1) next to the existing `snd-bpm`, `snd-sa` and `snd-drone` controls, and remember it with try/catch `localStorage`. Off uses the old `tone()` path, so nothing regresses.
5. **Pitch view.** Under the kalpana notation, draw an SVG of the contour against horizontal swara lines for the raga, with the per-note rule tooltips from `notes[i].rule`. It doubles as a teaching aid and as the main debugging tool.
6. **Offline render.** A "Download WAV" button renders the same graph through an `OfflineAudioContext`.

Apply this to kalpana first. Alankara and jathi playback keep plain tones; a later option can enable `light` for alankaras.

---

## 6. CLI and scripts

- `vocal-gym kalpana … --gamaka [off|light|full]` prints the notation with compact gamaka marks: `G~(R–M)` for kampita, `(m)g` for nokku from above (Parrikar's notation in S144), `g/` for orikkai, `→G` for jaru. `--contour json` dumps `renderGamaka()` output.
- **`scripts/render-wav.js`** (Node, no dependencies) does additive synthesis of the contour into a 16-bit WAV. Use it for the listening test and for checking by ear without a browser. It is not part of `src/engine`.
- `npm run check` gains `node scripts/check-raga-profiles.js` coverage of `gamakaRender`.

---

## 7. Tests (`test/gamaka.test.js`)

| # | Test |
|---|---|
| 1 | **Determinism:** the same notes, opts and seed give identical `points`. |
| 2 | **Depth 0 is plain:** every point equals its note's pitch, and boundaries fall at the grid times. |
| 3 | **Timing is exact:** the contour starts at 0 and ends at Σ dur × slotSec. Each `notes[i].t0` equals the grid time. |
| 4 | **No unintended jumps:** for 5 ms samples inside a legato group, \|Δp\| ≤ 1.5 semitones per sample. |
| 5 | **Targets are raga notes:** every STA and CPN pitch at depth 1 is a pitch of the raga, its octave copy, or a listed anya swara. Raga-specific quantisation, per ISMIR 2018. |
| 6 | **Anchor rule:** every note of 0.2 s or longer has at least one CPN of `CPN_MIN` or longer. |
| 7 | **Rate cap:** no oscillation runs faster than `MAX_RATE_HZ`. |
| 8 | **Ladder:** the same phrase at 60, 90, 120 and 180 BPM gives non-increasing total STA counts, and `degradedShare` rises with BPM. |
| 9 | **Landing:** the last note ends with a plain CPN of at least `min(LAND_HOLD, sec)`. |
| 10 | **Golden, Todi:** a 0.6 s G in "R G M" has STAs that reach both R (or lower) and M. A held S is plain. |
| 11 | **Golden, Sankarabharanam:** G is plain at every duration. |
| 12 | **Golden, Kalyani:** in "S' N D P M G R", every note after the first has a nokku onset from the note above. |
| 13 | **Golden, Mayamalavagowla:** a held G spends more than 50% of its time at or near M. |
| 14 | **Mora consistency:** the three mora repetitions use the same template sequence. |
| 15 | **Default style:** for a data-less mela, S and P are plain and no note shorter than 0.4 s carries kampita. |
| 16 | **Profile validation:** the checks in §1.5 pass on the real file and fail on crafted bad inputs. |
| 17 | **Smoke (jsdom):** the gamaka select and the pitch-view SVG render. Web Audio is stubbed, so the test only asserts that `setValueCurveAtTime` is called once per legato group with a finite `Float32Array`. |

---

## 8. Evaluation by ear (Phase 5)

1. **A/B listening test.** About 10 Carnatic musicians hear 12 kalpana rounds (6 ragas × 2) at depth 0 and depth 1, in randomised order, and rate how idiomatic each sounds on a 1–5 Likert scale. This is the protocol GamakaNet planned and Viraraghavan used.
2. **Raga identification.** Listeners name the raga from 20-second clips at depth 0 and depth 1. The success measure is higher identification at depth 1 for Todi, Kalyani and Mayamalavagowla, and **no loss** for Sankarabharanam (plain G is correct).
3. **Calibration against data (offline, optional).** For the overlapping ragas (Todi, Kalyani, Sankarabharanam, Kharaharapriya, Kambhoji), extract CPN and STA statistics per swara from Saraga or SCMS pitch tracks (SCMS is CC BY 4.0, via the `compiam` package). Fit `STA_DWELL`, `TRANS_SEC` and typical cycles per swara. Write results back as `gamakaRender` rules with `basis: "measured"`, `±Nc` targets where the measured STAs sit off the scale notes, and a source. The Python lives in `research/calibration/`, outside the engine.

---

## 9. Later: data-driven gamaka (not in v0.4)

GamakaNet (ISMIR 2022) maps a MIDI-derived contour to a contour with gamaka, using per-raga latent vectors. Its training data covered only Abhogi and Kalyani. Once the rule renderer exists, it becomes the **baseline**. A learned model could later replace `renderGamaka` behind the same interface (`notes → points`), provided it stays deterministic and passes tests 3–9. Keep it out of `src/engine` unless it can run dependency-free in the browser.

---

## 10. Phases (commit after each; `npm run check` must stay green)

| Phase | Work | Done when |
|---|---|---|
| **0. Data** | Add the `gamakaRender` schema, validator and docs. Transcribe the 23 ragas with sources and `interpretation` notes. Add the new sources. Extend the compiler. | Test 16 passes. Each of the 23 has at least one rule. `docs/raga-profiles.md` is updated. |
| **1. Geometry** | `src/engine/gamaka/{constants, shapes, contour}.js`: templates, interpolation, time fitting. | Tests 2–4, 6–8 pass using hand-written rules. |
| **2. Resolver** | `resolve.js`: context, rule matching, overrides, style defaults. `renderGamaka` exported from `index.js`. | Tests 1, 5, 9–15 pass. |
| **3. Audio and UI** | Voice per legato group, gamaka select, pitch-view SVG, raga badge, WAV download. Rebuild `site/`. | Test 17 passes. Manual check by ear in Chrome and Safari. |
| **4. CLI** | `--gamaka`, `--contour json`, `scripts/render-wav.js`. README section "Gamaka rendering". CHANGELOG 0.4.0. Module C of the research plan page. | CLI tests pass. The README explains the model, data and limits. |
| **5. Evaluation** | Listening test kit (rendered WAVs and a form), and optional calibration. | Results are recorded in `docs/research/gamaka-eval.md`, and constants are tuned with justification. |

## 11. Risks and decisions

- **Misreading the text.** Prose such as "permits strong gamaka" is vague. Mitigation: `basis: "text-vague"`, the `interpretation` field, and musician review before the listening test.
- **Sounding worse than plain.** A synthetic voice with gamaka can sound "bendy". Mitigation: the depth switch, `light` as the default for the demo, and the A/B test as the gate before making `full` the default.
- **Determinism.** The renderer is deterministic, and variety and humanise are off by default; both use `rng`, never `Math.random`.
- **Separation.** The renderer must never change `notes`. Test 3 and an identity check on the input array enforce this.
- **Browser limits.** `setValueCurveAtTime` cannot overlap other automation on the same parameter, which is why there is one curve per group and gain automation lives on a separate `GainNode`.

## References

- Viraraghavan, Aravind, Murthy, *A statistical analysis of gamakas in Carnatic music*, ISMIR 2017: https://archives.ismir.net/ismir2017/paper/000082.pdf
- Viraraghavan et al., *Data-driven measurement of precision of components of pitch curves in Carnatic music*, ISMIR 2018: https://ismir2018.ismir.net/doc/pdfs/120_Paper.pdf
- Viraraghavan et al., *Non-uniform time-scaling of Carnatic music transients*: https://arxiv.org/abs/1711.02318
- IIT Madras talk on state-based transcription (2022): https://www.iitm.ac.in/hi/node/12995
- Sankaranarayanan & Weinberg, *Gamaka Synthesis for Kalpitha Swaras in Carnatic music*, ISMIR 2022 LBD: https://archives.ismir.net/ismir2022/latebreaking/000019.pdf
- M. Subramanian, *Carnatic Ragam Thodi: Pitch Analysis of Notes and Gamakams*, Sangeet Natak XLI(1), 2007 (S37): https://icvtesting.nvli.in/system/files/indculturePDFs/JSNA-41%281%29%2003-20.pdf
- Plaja-Roglans et al., Saraga-Carnatic-Melody-Synth (CC BY 4.0): https://zenodo.org/records/5553925; ISMIR 2024: https://ismir2024program.ismir.net/poster_515.html
- *Modelling of Gamakas for Karnatic Flute Music Synthesis* (NITK): https://idr.nitk.ac.in/items/7390eb8f-02e5-4725-a6f4-829559996cac
- Wikipedia, *Gamaka (music)*: https://en.wikipedia.org/wiki/Gamaka_(music)
