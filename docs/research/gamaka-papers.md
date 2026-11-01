# What the research folder adds to the gamaka renderer (v0.6)

**Status:** implemented in v0.6. This document covers the eight papers in `research/`. For each one it records what it says, what the renderer now does because of it, and where that lives in the code. It also lists what was left out and why.

**Read with:** `docs/research/gamaka-naturalness.md` (the v0.5 natural contour and the intensity dial), `docs/research/gamaka-grammar.md` (the v0.5 swara grammar G1–G6) and `docs/research/expressive-voice.md` (the sung voice that plays the result).

The PDFs are copyrighted and are not committed (`.gitignore`: `research/*.pdf`). Each one is registered as a source in `data/raga-profiles.json` and cited by its id (S204–S211) in code and data.

---

## 1. The papers

| Id | File in `research/` | Paper | Evidence | What it gave the renderer |
| --- | --- | --- | --- | --- |
| S204 | `AutoGamakam.pdf` | M. Subramanian, "Carnatic Music – Automatic Computer Synthesis of Gamakams", *Sangeet Natak* XLIII (2009) | Gaayaka, a notation player built and refined over years | Phrases must be separated "creating the feeling of hearing the lyric"; the synthetic voice lacks volume and quality variation (§6) |
| S205 | `2CMW_AutoGamakam.pdf` | M. Subramanian, "Generating Computer Music from Skeletal Notation for Carnatic Music Compositions", 2nd CompMusic Workshop (2012) | Pitch tracks of vocal and veena renderings | Cycle period 250–500 ms; fewer cycles at speed, not faster ones; ri anchored below, ga anchored above; M1 in "ga maa paa" sung from ga almost up to pa (§3, §4.2) |
| S206 | `15430.pdf` | L. Pearson, "Coarticulation and Gesture: An Analysis of Melodic Movement in South Indian Raga Performance", *Music Analysis* 35.3 (2016) | Violin alapana in Todi, with motion capture of the bowing and fingering | Todi ga and ni lower turns at the R2 and D2 positions; wide and narrow ga schemas; a gamaka starts where the previous svara ends (§4.1, §5) |
| S207 | `nuttall_DLFM_svar.pdf` | T. Nuttall, X. Serra & L. Pearson, "Svara-forms and coarticulation in Carnatic music: an investigation using deep clustering", DLfM 2024 | 2,077 annotated svaras in Bhairavi, clustered | dha forms that start on pa and consist largely of pa, supporting G2's anchor (§4.2) |
| S208 | `Nuttal_WIMAGA_Svar.pdf` | T. Nuttall, X. Serra & L. Pearson, "Svara-Forms in Carnatic Music: Contextual Influences on the Performance of Svara", ICASSP 2025 workshops | 71 expert-curated svara-form groups in Bhairavi | The preceding and following svaras together and the duration decide a svara's form; svaras begin where the previous one ended (§4.1) |
| S209 | `Proceedings-2nd-CompMusic-Workshop-2012_0.pdf`, pp. 12–18 | T. M. Krishna & V. Ishwar, "Karnatik Music: Svara, Gamaka, Phraseology and Raga Identity" (2012) | A performer's account, with pitch plots | Kampita meanders between its neighbours (M1 as G3 P G3); in ascent the next svara is touched before the kampita ends; N3 and M2 close to S and P; an articulated svara is followed by a less articulated one (§4) |
| S210 | `srikumar-phd-thesis-cnm-modeling-gamakas-6aug2013.pdf` | S. K. Subramanian, *Modeling Gamakas of Carnatic Music as a Synthesizer for Sparse Prescriptive Notation*, PhD thesis, NUS (2013) | Veena reference performance of a Sahana varnam at two speeds, plus an expert evaluation | A speed limit of 50 ms a semitone; oscillatory continuity; peak overshoot of 25 c a semitone of depth; dropping transient focal pitches at speed; experts on stress, phrase boundaries and dynamics (§3, §4, §6) |
| S211 | in the proceedings | S. K. Subramanian, L. Wyse & K. McGee, "A two-component representation for modeling gamakas of Carnatic music" (2012) | As S210 | The "stage" (melodic centre) plus "dance" (movement) view that explains the anchors (§3.3) |

Two different researchers share the surname. S204 and S205 are by M. Subramanian, the author of Gaayaka. S210 and S211 are by Srikumar K. Subramanian.

---

## 2. Findings, and what they changed

| # | Finding (source) | Before v0.6 | v0.6 |
| --- | --- | --- | --- |
| 1 | Movements are no faster than about 100 ms a tone. "The minimum time over which a movement spanning a semi-tone may be executed was set to 50 ms." Deeper movements take longer (S210 §6.3.1, Table 6.4) | A swing of 2–3 semitones took 88–96 ms | A swing between two turns takes at least 50 ms a semitone, up to 160 ms (§3.1) |
| 2 | "The mean time per oscillation varies from 250 ms to 500 ms" (S205) | A cycle could be about 200 ms (5 Hz) | A cycle takes at least 250 ms. When time is short there are fewer cycles, never faster ones (§3.2) |
| 3 | "When the music is faster the number of oscillation[s] … or the duration of the lower steady note is reduced rather than speeding up the whole phrase"; "the voice may remain at a lower note for considerable period and move up in spurts … or it may be anchored on an upper note" (S205) | A long note's spare time went only to its holds | The dwell side of an oscillation is an anchor: a long note first slows there, up to 500 ms a cycle (§3.3) |
| 4 | A short peak in a deep oscillation sounds flat without an overshoot. Overshoot = 25 c × (min(3, rise, fall) − 1) (S210 §6.3.5) | Only CPN arrivals overshot (Saitou, S200) | Short peaks overshoot in the sung contour, while the targets keep their raga pitch (§3.4) |
| 5 | A gamaka "start[s] from the end point of the one that precedes it", or continues the oscillation before it (S206; S208; S210 §6.3.4) | Every oscillation started from the swara's own pitch | An oscillation flows in from the extreme the voice arrives at (§4.1) |
| 6 | "During many ascending melodic phrases with the Kampita gamaka, the next svara is touched upon before the gamaka of this svara ends on a svarasthana" (S209) | — | Rising to a swara its upper turn reaches, the oscillation touches it once more before resting (§4.1) |
| 7 | Mayamalavagowla ri stays below and rises in spurts (S205 Figs. 1–2); Bhairavi dha forms start on pa and "consist largely of pa" (S207) | Grammar G2 (R1, D1) dwelt on the swara | G2 rests on S or P and rises to the swara (§4.2) |
| 8 | "Kakali Nishada and Prati Madhyama are rendered with Kampita gamaka very close to the Shadja or Panchama respectively. This would not be seen … in phrases that lack Sa or Pa" (S209) | N3 and M2 below S and P were straight (G3) | New rule G3c (§4.3) |
| 9 | Ma1 is sung by "uttering the syllable Ma while at the same time singing Ga3 Pa Ga3" (S209). Sankarabharanam ma in "ga maa paa" is "played from the ga fret deflecting it all the way almost reaching the pitch of pa" (S205) | Grammar G4 swung M1 from itself up toward P | New rule G4m (§4.4) |
| 10 | Todi: the R2 and D2 positions, foreign to the scale, are "the correct lower pitch in the rendition of oscillations used to express ga and ni respectively", standardised across teachers. A wide ga schema links ri to ma; a narrow one sits between ga and that pitch (S206) | Todi ga swung from R1 | Todi's rules use the measured −100 c turns (§5) |
| 11 | Experts asked for svaras stressed "to establish phrase boundaries", gentler phrase endings and dynamics generally (S210 §8.5); the music must be split into phrases (S204); "articulated svaras are generally followed by a svara which is less articulated" (S209) | Constant loudness, no phrasing | The expression layer: phrases, breaths, stress and dynamics (§6) |

---

## 3. Timing

All of this applies to the natural contour (`renderGamaka` with `natural` on, the default). The v0.4 contour (`natural: false`) is unchanged. The constants are in `src/engine/gamaka/constants.js`.

| Constant | Value | Meaning | Source |
| --- | --- | --- | --- |
| `SEMITONE_SEC` | 0.05 s | Minimum time a swing takes, per semitone | S210 Table 6.4 |
| `LEAP_MAX` | 0.16 s | No move is slowed past this | — (keeps leaps sung) |
| `CYCLE_MIN` | 0.25 s | Shortest oscillation cycle | S205 |
| `CYCLE_MAX` | 0.5 s | Longest cycle an anchor may stretch to | S205 |
| `ANCHOR_SHARE` | 0.7 | Share of a long note's spare time its anchors take first | — (tuned; S205 qualitative) |
| `PEAK_CENTS` | 25 | Overshoot per semitone of depth beyond one | S210 §6.3.5 |
| `PEAK_SHORT` | 0.07 s | Only peaks no longer than this overshoot | S210 ("sustains of 1/16 of a count") |

### 3.1 The speed limit

`contour.js` has two move timings:

```
stepSec(d) = min(MOVE_MAX, MOVE_SEC + MOVE_PER_ST · max(0, |d| − 1))      the v0.5 timing (80–130 ms)
moveSec(d) = max(stepSec(d), min(LEAP_MAX, SEMITONE_SEC · |d|))            with the speed limit
```

Only a **swing between two turns** of an oscillation (two STAs with roles `hi`/`lo`) uses `moveSec`. Flicks (nokku, odukkal, sphurita), moves to and from a hold, and boundaries between swaras keep `stepSec`.

Why only swings: S210's limit was measured on gamaka movements, string pulls and slides within a note. Applying it to onset flicks made some at full intensity no longer fit where they fitted at a lower one, so presence would fall as the dial rose. A whole-tone swing now takes 100 ms instead of 88 ms, and a minor-third swing 150 ms instead of 96 ms.

### 3.2 Cycles: fewer, not faster

`paceCycles(ts, moves)` walks each `hi`/`lo` pair in a fitted shape. A cycle lasts `dur(a) + dur(b) + 2·move`; if that is shorter than `CYCLE_MIN`, the missing time goes to the pair's turns, on the anchor side first. This happens before the degradation ladder checks the fit. So a shape that cannot keep 250 ms cycles drops a cycle (ladder rung 1) instead of hurrying, as S205 observes.

The v0.4 cap of 5 Hz (`MAX_RATE_HZ`) still holds and is now always met with room to spare. The tests measure the fastest natural oscillation at 4.1 Hz.

### 3.3 Anchors

`shapes.targets()` marks the STAs on a shape's dwell side as anchors (`anchor: 1`). With an even dwell, both sides get `anchor: 0.5`. `paceCycles` gives each anchor its `room`: how much it may stretch before its cycle reaches `CYCLE_MAX`.

When `fitNote` has time left over, the anchors take up to `ANCHOR_SHARE` of it first, in proportion to their room. The head and end holds share the rest as before.

The result is the "remains at a lower note … and moves up in spurts" shape of S205. A long Mayamalavagowla ri sits on S and rises to ri in short spurts. A long ga anchored above sits near M and dips to ga. This is the "stage" (where the voice sits) and "dance" (the movement) of S211.

### 3.4 Peak overshoot

`naturalKit().peaks` looks at every `hi`/`lo` turn that is not a full anchor and lasts no more than `PEAK_SHORT`. If the turn is a peak between two lower targets, its depth is `max(0, min(3, rise, fall) − 1)` in whole semitones. It gets `peak = depth × 25 c × motion`.

The peak is **sung, not aimed at**: the contour segments use `p + peak`, while the target list (`notes[i].targets`, the pitch view, the tests of raga accuracy) keeps the raga pitch. A whole-tone swing gains 25 c at its top and a minor-third swing 50 c. Semitone swings get none, as S210's rule gives.

### 3.5 A bug fixed on the way

The truncated inflexion (`cycles = 0.5`, v0.5's last oscillating rung) actually produced one and a half cycles. The loop ran once for `c = 0 < 0.5` and then added the half-cycle turn as well. So the rung was longer than a whole cycle and could never fit where a cycle did not. It now gives the intended single turn (head, hi, end).

---

## 4. Phrase rules

### 4.1 Coarticulation (`resolve.js`, `coarticulate`)

This runs after every rule, the mora templates and the overrides have been settled, and only when the intensity dial is on. For each oscillating swara without an onset:

- **flowIn.** Let `from` be where the previous swara left the voice. That is its pitch, its end turn when the rule rests on one, or its orikkai.
  - If the voice arrives from below at or under the lower turn (`from ≤ lo + 0.5`), the oscillation starts on `lo`.
  - If it arrives from above at or over the upper turn (`from ≥ hi − 0.5`), it starts on `hi`.
  - Either way there is no head at the swara's own pitch. This removes the detour the v0.5 shape made (arrive at the swara, swing up, swing down).
- **antic.** If the next swara is higher, the rule rests on the swara itself, and the upper turn lies within half a semitone of the next swara, the oscillation touches `hi` once more before its end hold. This is S209's anticipation.

`shapes.targets()` honours both in the natural contour only. An oscillation that flows in always makes at least one whole cycle, so it reaches its other turn (§9). `firstP` in `contour.js` costs the boundary into a flowing oscillation by the distance to its first turn. Each note's `why` says so: "it starts where the previous swara left the voice", "it touches the next swara before it settles".

Example (Todi *s r g m p*, intensity 0.85). Ri ends on R1. Ga's lower turn is the R2 position, just above, so ga flows in on it: R2-position, M, R2-position, M, then rests on ga. This is Pearson's B-D-B-D-B schema with the touch of ma before it settles.

### 4.2 G2 rests on S and P

R1 and D1 (a half step above S and P) keep their kampita between S (P) and themselves, but the dwell moves from the swara to S (P) (`dwell: 'lo'`, `grammar.js`). With §3.3 this gives the S205 and S207 forms: mostly on S or P, rising to the swara in spurts, ending on it. Mayamalavagowla's own R rule (S40) gets the same dwell from S205 in the data.

### 4.3 G3c: N3 and M2 close to S and P

New grammar rule `G3c` (source S209). It applies to N3 (below S) or M2 (below P) when S or P is the previous or next swara, and the note is long (≥ 0.4 s) or middling (≥ 0.22 s) on its way up to S or P. The result is a kampita between the swara and S (P), dwelling at the top (`lo 0, hi +1, dwell 'hi'`). A middling note coming down from S or P is still G3b, a touch from above, and anything else stays G3 (straight).

G3c is **not** in the adjacency rank that lets a defining deflection beat a borrowed shade. In D2 N3 S, D2 (a whole tone below N3) keeps its gamaka and N3 is held straight. This is the user's R2 G3 rule a fifth up, which `test/gamaka.test.js` checks over every data-less raga with D2 and N3.

### 4.4 G4m: M1 between G3 and P

New grammar rule `G4m` (sources S209, S205, S203). It applies to M1 with G3 a half step below and P a tone above, passed through upward (previous G3, next P). The rule is a kampita from G3 up to P, dwelling on G3 (`lo −1, hi +2, dwell 'lo'`), and at speed a single touch from G3. It replaces G4's "swing up toward P" in that context. Vedavalli's "close to P when the phrase ascends" (S202) still holds: the swing reaches P.

When G3 itself rises into M1 across an augmented second (R1 below G3: G3a, the higher rank), M1 is held flat beside it by adjacency, as before.

Example (Sankarabharanam, whose M rule is text-vague): *g m p* prints `M~(G–P)`.

---

## 5. Raga data

All edits are in `data/raga-profiles.json`, validated by `scripts/check-raga-profiles.js`.

**Sources S204–S211** were added with titles, links and notes. The renderer's model cites them in `RENDER_SOURCES` (`scripts/compile-profiles.js`), so they ship in the compiled profiles.

**Todi (mela8).** The G and N rules now use S206.

- **G, rising:** a kampita between `-100c` (the R2 position, a measured, off-scale turn) and M, resting on ga, 1–3 cycles. This is Pearson's wide schema.
- **G, held (≥ 0.35 s) in any direction:** the same wide kampita.
- **G, otherwise:** the narrow schema, between ga and `-100c`.
- **N:** a kampita between `-100c` (the D2 position) and S'. S37's neighbour S' is kept as the upper turn, which S206 does not contradict.

The gamaka text gains these points, and the raga's gamaka sources gain S206. The interpretation notes say where S37 named R1 and why the performance analysis wins; S201's "Todi G2 rendered as R2+" agrees with it.

**Mayamalavagowla (mela15).** The R kampita (S40) gains `dwell: 'lo'` (S205 Figs. 1–2), and the G rule's interpretation notes that S205 Fig. 3 shows ga "anchored on an upper note".

**Off-scale turns in the output.** A turn outside the raga's scale is named by its svarasthana with a star. The CLI prints Todi `G~(R₂*–M)` and `N~(D₂*–Ṡ)`; `describe()` writes `R2*`. Each rendered note's `offScale` flag marks rules that turn off the scale by design: measured data, and Varali's G1 (G4w). The accuracy tests exempt only those.

**Not added.** Bhairavi (S207, S208) and Sahana (S210, S211) have no profile in this repository, and raga knowledge may only enter through a profile with sources. Their findings informed the general grammar (§4.2) but no raga-specific rule. Nuttall's dha forms and Srikumar's Sahana catalogue would be the starting point if either raga is added.

---

## 6. The expression layer (`src/engine/gamaka/expression.js`)

`renderGamaka` now returns `expression: { phrases, notes, gain }` alongside the contour. Like the gamaka, it never changes the notes or their timing. `expression(notes, contour, opts)` can also be called on its own (exported as `gamakaExpression`).

**Phrases.** A phrase starts:

- at the first swara;
- after a rest;
- after a swara of at least 0.6 s and twice the median length (a karvai);
- at a kalpana unit boundary (`phrase…` or `mora` units) when a run would otherwise exceed `PHRASE_MAX` (5 s), choosing the boundary nearest the middle.

**Breaths.** Between two phrases with no rest, the last swara of the first phrase is released over its last `BREATH_SEC` (90 ms, at most a quarter of the note), down to 6% loudness. The next phrase starts with a fresh attack (`onset: 'phrase'`).

**Stress (`accent`, 0–1).** The accent of each swara:

| Swara | Accent |
| --- | --- |
| On the samam | 1 |
| On an anga start | 0.75 |
| On another akshara | 0.5 |
| Off the beat | 0.3 |
| First of a phrase | at least 0.8 |
| 0.45 s or longer | +0.25 |
| Plain, after a swara with gamaka | × 0.6 (S209) |

The tala comes from `per`, `cycleBeats` and `angaStarts`. The accent adds up to 12% to the attack, decaying with a 120 ms time constant.

**Dynamics (`gain`, every 10 ms).** These factors multiply together:

- a gentle arch over the phrase (0.9 to 1);
- the register: +1.2% a semitone above the phrase's mean pitch, capped at +6% and −8% (S210's "more subtle" upper register);
- a swell and decay on swaras of 0.45 s or more;
- a softer end to each phrase (down to −22%);
- a long release on the round's last swara (down to −40%);
- the breaths above;
- a seeded ±3% per swara.

**Syllables.** Each swara carries its name (`syllable` sa ri ga ma pa dha ni, `consonant`, `vowel`) for the sung voice.

The voice (`web/shared/voice.js`) multiplies its loudness by `gain` and uses `onset`, `accent`, `consonant` and `vowel`. The simple tone ignores the layer.

**The legato voice for straight notes.** `renderGamaka(notes, { intensity: 0, voice: true })` sings straight notes as a voice would:

- the shapes are all plain;
- the natural contour runs with full motion (overshoot, preparation, drift and flutter);
- moves between swaras are `VOICE_GLIDE` (0.6) of a gamaka move;
- the holds stay within the ±0.3-semitone constant-pitch band.

Without `voice`, intensity 0 is still the exact stepped contour, so existing callers are unaffected.

---

## 7. Left out, and why

| Finding | Why it is not implemented |
| --- | --- |
| Onset alignment to sub-pulses (S210 §6.3.2): a gamaka fragment starts on a 1/8 pulse and lands on the next 1/16 | The contour already keeps every swara's attack on its beat, and kalpana's slots are the sub-pulses. Aligning turns inside a note to a finer grid would need the tala's pulse at 1/16 resolution and was not worth the rigidity. Recorded as a refinement. |
| The trigram catalogue and optimal path over a phrase (S210 §6.5) | It needs a transcribed reference performance per raga. The grammar and the raga rules play this role with sourced prose. |
| Dropping transient focal pitches at double speed (S210 §6.3.3) | The degradation ladder does the equivalent (fewer cycles, a truncated inflexion, then onset and hold), now with the cycle floor of §3.2. |
| "Only overshoots, no undershoots" | S210 says this is a veena constraint and that voices may undershoot. The voice's CPN preparation (S200) already dips before a rise. |
| Plucks as stress, and "fewer gamakas if more plucks" | Veena-specific. The voice's stress is the expression layer's accent. |
| Sahana and Bhairavi specifics (G closer to m in GmR; PDP extending to n; dha before ma) | These ragas have no profile (§5). |
| Symmetric phrase halves treated alike (S210 §8.5.4) | This needs phrase-structure analysis the round does not expose yet. A kalpana mora already shares statement 1's template. |

---

## 8. Tests

`test/gamaka.test.js`:

- **papers.** Over six ragas, three tempos and three intensities:
  - every swing takes at least 50 ms a semitone;
  - every cycle lasts at least 0.9 × 250 ms (the test reports the longest);
  - G2's turns on S outlast its spurts in every data-less raga with S R1 G3 M1;
  - Todi *s r g m p*'s ga flows in on the R2 position, touches ma and rests on ga;
  - G3c on held N3 before S;
  - G4m on G3 M1 P in ragas with R2.
- **expression and the legato voice.**
  - Determinism, and the notes are never changed.
  - Every swara is in a phrase; each phrase starts with a stressed fresh attack.
  - Phrases stay a breath long, and there is a breath before each phrase that follows without a rest.
  - Syllables match the swara names.
  - The straight voice has no gamaka, keeps its holds within ±0.3 st and moves between swaras.
  - Without `voice`, intensity 0 is still stepped.
- **Updated for the new knowledge.**
  - Todi ga reaches the R2 position and M, not R1 (golden case 10).
  - Sankarabharanam *s r g m p* is G4m.
  - G3c is exempted from "a semitone below its neighbour is held straight" but checked to swing only up to S or P.
  - Off-scale turns are exempted from the raga-note checks only through `offScale`.

`test/voice.test.js` and `test/server.test.js` cover the voice and the `/api/render` route (`docs/research/expressive-voice.md` §7).

To hear the changes, render a round:

```
node scripts/render-wav.js --raga todi --aksharas 8 --eduppu-swara P --temp 0 --gamaka performative --drone --out todi.wav
node scripts/render-wav.js --raga sankarabharanam --aksharas 8 --temp 0 --gamaka full --timbre swaram --out sank.wav
```

---

## 9. Two contour fixes

1. **The truncated inflexion** (§3.5): `cycles = 0.5` now gives one turn.
2. **Flowing in at the last rung.** Suppose an oscillation flowing in on its upper turn reached the half-cycle rung, with the rule resting on that turn. The swara then collapsed into a single hold at the turn and never sounded its own pitch: a Mayamalavagowla ga after M became a held near-M. An oscillation that flows in now always makes a whole cycle, and if that does not fit the ladder drops to the onset-and-hold rung.
