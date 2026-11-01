# Natural gamaka: research notes and design (v0.5)

**Status:** implemented in `src/engine/gamaka/` (the natural contour and the intensity dial). v0.6 refines its timing from the papers in `research/` (a speed limit for swings, 250–500 ms cycles, anchors, peak overshoot, coarticulation): see `docs/research/gamaka-papers.md`. Read with `docs/plans/gamaka-audio.md`, which built the v0.4 renderer, and `docs/research/gamaka-eval.md`, the listening-test protocol. No listening sessions have been run on either version, so the numbers below that were *chosen* (not measured) are marked as design choices and need checking by ear.

**Why this document exists.** Feedback on v0.4 was that the gamakas "sound too artificial and not natural; the variations sound too artificial." This document records what the literature says natural Carnatic pitch movement looks like, diagnoses where the v0.4 renderer departs from it, and specifies the changes and the 0–100 gamaka intensity slider.

---

## 1. What the sources say

### 1.1 Carnatic pitch curves (measured)

| # | Finding | Source |
|---|---|---|
| F1 | A sung curve is **constant-pitch notes** (CPNs: within ±0.3 semitone for ≥ 80 ms) and **transients** between them. Of all transients, **49 % run from one stationary point (STA) straight to another**; only 14.5 % join two CPNs. | Viraraghavan, Aravind & Murthy, ISMIR 2017 (S193), §3.1, Table 2 |
| F2 | The **mean transient lasts about 100 ms** in every raga studied; over 90 % are shorter than 400 ms. About 40 % are very short and are note *attacks*, not perceived gamakas. | S193 §3.4 |
| F3 | **Transients never occur alone**: each svara keeps at least one CPN anchor, and a chain of transients rarely lasts more than 1.5× the mean CPN. | S193 EOb2, Fig. 5 |
| F4 | In Todi the **CPN histogram has no peak at G2 or N2**, but one at **R2, outside the scale**: Todi's G2 lives as movement, anchored around R2+ / M1. | S193 Fig. 4; S194 Fig. 2(b); Krishnaswamy 2004 ("in Thodi, R2+ appears as a particular form of G2") |
| F5 | **STA precision is loose**: the SD of STA pitch errors is 45–85 cents (nominal **60 cents**) and does not depend on duration. CPN precision tightens with duration, to about **20 cents at 200 ms and 10 cents for long CPNs**: σ(t) = √(σr² + σs² e^(−2t/T)), with σr ≈ 8–19 c, σs ≈ 40–85 c, T ≈ 75–225 ms over 19 singers. | Viraraghavan, Murthy & Aravind, ISMIR 2018 (S194), Table 3, §5 |
| F6 | In resynthesis, **experts could not tell** STAs quantised to the raga's grammar from STAs rounded to the nearest semitone, nor **linear from cosine** interpolation. The grammar is flexible; what matters is CPN anchors plus movement through roughly the right regions. | S194 §4, Table 5 |
| F7 | STAs in **ascending** movements (local maxima) and **descending** ones (local minima) were measured separately because **overshoots and undershoots** are reported. | S194 §2.3.2 (citing Subramanian, Wyse & McGee 2012) |
| F8 | **When tempo changes, CPNs stretch 6–12× while transients stretch only 1.9–3.5×** (second speed vs first; a uniform change would be 2×). Transients are like consonants: their duration is kept. | Viraraghavan et al., arXiv 1711.02318 (S195), Table 3 |

### 1.2 Shapes of real gamakas (pitch tracks)

Krishnaswamy, *Melodic atoms for transcribing Carnatic music*, ISMIR 2004 (S201), shows real pitch tracks:

- **One swara, many renderings.** "R1" covers distinct entities: a held R1; `S+` (S held, with quick upward spikes towards R1); `S*R1` (a continuous oscillation between S and R1); `R1−` (R1 held, with quick dips to S); `R1+`; a slide; and `^` (a fast upward spike to a *flexible* upper end).
- **Asymmetric, anchored oscillation.** In `S+`, `R1−` and `M1−` (Fig. 2, 6) the voice **sits on an anchor and makes brief excursions**. The excursion peaks are sharp and rounded, and they are **not** flat plateaus at the other note.
- **Flexible turning points.** In Fig. 4 the six spikes of "R1 hit from S" peak at about 90, 230, 400, 310, 120 and 270 cents. The *reach* varies widely while the svara stays the same.
- **Truncated and partial inflexions.** Fig. 9 shows half an inflexion, a single period or two periods, all cut from one underlying oscillation. Entities "morph or merge into each other" at fast tempos.

### 1.3 Natural singing F0, any tradition

Saitou, Goto, Unoki & Akagi, *Speech-to-singing synthesis*, WASPAA 2007 (S200), built on their F0 control model (Speech Communication 46, 2005):

- A natural singing F0 contour is a **step melody plus four fluctuations**: **overshoot** (a deflection past the target after a note change), **vibrato**, **preparation** (a deflection *opposite* to the coming change, just before it), and **fine fluctuation** (irregular, above 10 Hz).
- Overshoot and preparation are second-order damped responses H(s) = k/(s² + 2ζωs + ω²): overshoot ω = 0.0348 rad/ms, ζ = 0.5422; preparation ω = 0.0292 rad/ms, ζ = 0.6681. Fitted to real singers, so the overshoot peaks about 35 ms after the change, at roughly 13 % of the step, and dies out within about 150 ms.
- Fine fluctuation: high-pass-filtered white noise, cut-off 10 Hz, normalised to a maximum of 5 Hz.
- The amplitude envelope and formant amplitude are **modulated in sync with F0 modulation** (5.5 Hz, extent 0.2, during vibrato).
- **Listening test: F0 fluctuations contributed more to naturalness than spectral (timbre) control.** A melody of pure steps rated −0.23; with the F0 model, +0.41; with everything, +0.59; real singing scored +0.64.

Vibrato is deliberately **not** used: plain Carnatic notes are steady (S76: Sankarabharanam's G "highly flat"; F5's 10-cent CPN precision), and the plan already excluded it.

---

## 2. Diagnosis: why v0.4 sounds artificial

| v0.4 behaviour | What the sources show | Effect |
|---|---|---|
| Every STA is a **60 ms flat plateau** at an exact semitone (`STA_DWELL`), joined by 50 ms half-cosines. A kampita is a trapezoid wave. | Turning points are momentary; the curve keeps moving (F1, Krishnaswamy Fig. 2–6). | A "square", keyboard-like wobble. |
| Every STA lands on **exactly** the target semitone, and every cycle is identical. | STA reach varies by ±60 c (F5) and widely between excursions (Krishnaswamy Fig. 4), with no loss of correctness (F6). | Mechanical regularity. |
| Transitions take **50 ms whatever the interval**. | The mean transient is about 100 ms (F2). Larger moves take longer. | Too-fast, snappy swings. |
| CPNs are **mathematically flat**; note changes are clean half-cosines. | Real F0 has overshoot, preparation and fine fluctuation, the strongest single cue to naturalness (S200). | A synthetic "pitch-corrected" sound. |
| "Light" = `depth 0.5`: **every** target's distance halved. | Targets carry the raga (F4); a half-width swing lands between swaras. | Light mode wobbles on quarter-tones instead of using fewer or smaller idiomatic gamakas. |
| Each boundary inside a group has a **25 % gain dip**; loudness is otherwise constant. | Amplitude co-varies with F0 movement (S200 §2.3). | Pulsing, organ-like articulation. |

---

## 3. Design

### 3.1 The natural contour (`buildContour(items, { natural })`)

The target list (CPNs and STAs from the raga's rules) is unchanged in meaning. Only the way the voice moves between targets changes. Each element is tied to a finding.

| Element | Value | Basis |
|---|---|---|
| **Move time** between targets | 0.08 s + 0.008 s per semitone above 1, capped at 0.13 s (so a cycle of two turns and two moves takes at least 0.2 s, the 5 Hz cap). A boundary costs the distance actually travelled: a touch from the swara just sung needs almost no move | F2: transients ≈ 100 ms including the turn. The interval dependence is a design choice. |
| **STA dwell** (a rounded turn, not a plateau; a nokku or orikkai flick is one or two turns) | 0.02 s, rising to 0.035 s at full intensity | F1, Krishnaswamy: turning points are momentary. A full STA (dwell + two half-moves) is ≈ 100 ms, as S194 defines it. Rate stays ≤ 5 Hz. |
| **Reach jitter** per STA | SD 0.12 × the swing, scaled by the "human" curve h(a), clipped at ±2 SD; exact at a = 1 | F5–F6: STA tolerance ≈ 60 c; Krishnaswamy Fig. 4. Kept to a fraction of a semitone so the swara stays recognisable. |
| **Timing jitter** per move | Each move is longer by 0 to 18 % × h(a), never shorter, so the rate cap holds | Design choice, so cycles are not identical |
| **Overshoot** on arriving at a CPN | 8 % of the step, at most 0.25 semitone; peaks 35 ms after arrival, smooth onset, gone within about 150 ms | S200 overshoot (ω = 0.0348 rad/ms → first peak ≈ 35 ms). Smaller than the fitted 13 %, because a CPN must stay within the ±0.3 st CPN definition (F1). |
| **Preparation** before leaving a CPN | 4 % of the coming step in the opposite direction, at most 0.12 semitone, peaking 40 ms before the move | S200 preparation |
| **Fine fluctuation** | A slow drift (3 incommensurate components, 0.4–1.8 Hz, about 3 c RMS) plus a fast flutter (3 components, 6–11 Hz, about 1.2 c RMS), seeded | S200 fine fluctuation; S194 long-CPN precision ≈ 10 c, so the drift stays well inside it |

Two fitting rules keep the dial monotonic: you never hear fewer gamakas by turning it up.

- **Variation yields.** Each ladder rung is first tried with its timing variation and firm turns. If it does not fit, it is tried again evenly timed with standard 20 ms turns, before the ladder drops to the next rung. Variation and firmness never cost a gamaka.
- **Truncated inflexion.** Before an oscillation is dropped for lack of time, it is sung as a single turn to its far swara and back (S201 Fig. 9: "half an inflexion"). It still lands on raga notes.

All of these are deterministic from `seed` (`rng`, never `Math.random`). None of them changes the notes or the target list's swaras.

### 3.2 The intensity dial a ∈ [0, 1] (the slider, 0–100)

The slider is not a width knob. It decides **which gamakas are sung, how many cycles, how far they reach and how freely**. The design rule: identity-carrying gamakas appear first, decoration last, and nothing ever sits between swaras just because the slider is mid-way.

**Salience.** Each gamaka component of a note (onset, body, exit) has a salience s:

| Component | s |
|---|---|
| A raga rule's oscillating body (`kampita`, `andolita`), from text or measurement | 0.92 |
| A raga rule's onset (`nokku`, `odukkal`, `sphurita`, `pratyahata`, `jaru`) | 0.75 |
| A raga rule's exit (`orikkai`, `jaru`) | 0.70 |
| A raga rule marked `text-vague` (vaguely described) | 0.60 |
| The generic default's body (a gentle swing on a long note) | 0.45 |
| The generic default's onset (a touch from above in descent, or sphurita) | 0.38 |

A component is sung when **a ≥ need = 0.9 (1 − s)**. So Todi's G kampita appears at a ≥ 0.07, Kalyani's descending nokku at 0.23, and the generic swings only from 0.5 upwards.

**Reach.** A component sung at a reaches r = 0.6 + 0.4 × (a − need)/(1 − need) of its swing. It fades in from 60 % of its full swing, never from nothing, and reaches the full raga notes exactly at a = 1.

**Cycles.** With c(a) = clamp((a − 0.2)/0.6, 0, 1), cycles = min + round((max − min) × c(a)). Full intensity gives the rule's maximum.

**Human variation.** h(a) = a/0.55 for a ≤ 0.55, and (1 − a)/0.45 above that. Variation is largest at the performative middle and **zero at full**, which is "accurate".

**Full (a ≥ 0.85) is heavy.** Swaras without a raga rule get the `medium` default instead of `light`, the chain limit is raised by 2, and STA dwell lengthens, so the turns sit clearly on their target swaras ("threshold" gamakas).

**Natural motion.** Overshoot, preparation and fine fluctuation come in over the first 20 % of the dial and then stay constant. They are how a voice moves, not decoration.

| Slider | What you hear |
|---|---|
| 0 | Straight notes: exactly the old plain playback (the same code path) |
| 1–20 | Natural voice motion between notes; only the most raga-defining gamakas, small and few (Todi G, N) |
| 35–65 | **Performative**: raga gamakas at 70–90 % reach with natural variation; generic swings appear on long notes from about 50 |
| 85–100 | **Heavy and accurate**: every rule at full cycles and full reach on the raga notes, generic medium colour on unmentioned swaras, no reach or timing jitter |

The demo defaults to **55**.

### 3.3 Audio

- **Amplitude follows pitch** (S200 §2.3): loudness rises slightly with pitch inside each swara (±4 % per semitone around the swara, clipped at ±15 %) and dips by up to 8 % during fast moves. It is applied as one gain curve per legato group, separate from the pitch curve.
- The **articulation dip** at each swara boundary drops from 25 % to 12 %, and from 25 ms to 30 ms long, so it sounds like a soft syllable rather than a pulse.
- **Timbre**: 16 harmonics at about 1/n^1.3 and a third formant near 2.7 kHz. This is secondary (S200: F0 matters more than spectrum) and is kept modest.

### 3.4 What stays the same

- The notes are never changed (the rendering-layer rule), and slider 0 is plain playback.
- Every rule still comes from `gamakaRender` with a source. The intensity mapping adds no raga knowledge; it only orders the existing rules by how central they are.
- Legacy behaviour: `buildContour` without `natural` and `renderGamaka(…, { natural: false })` reproduce v0.4 exactly. `depth` is deprecated in favour of `intensity`; when only `depth` is given, it is read as the intensity.

---

## 4. Open questions for the listening test

1. Are the overshoot (8 %) and the preparation (4 %) audible as "voice" or as "out of tune" on plain notes such as Sankarabharanam's G? If the latter, lower the overshoot on swaras that are plain by rule.
2. Is h(a) peaking at 0.55 the right "performative" point? Part A of `gamaka-eval.md` can rate slider 0, 55 and 100.
3. Todi's G as R2+ (F4): should the lower anchor of Todi's G kampita sit on R2 rather than R1? That is a data change to `gamakaRender` and needs a cited rule, so it is not made here.
4. Just intonation of CPNs (S194 Fig. 2: Sankarabharanam G3 at 3.8, M1 at 4.8, D2 at 8.8 semitones) is not modelled; playback stays equal-tempered.

## Sources

- **S193:** V. S. Viraraghavan, R. Aravind, H. A. Murthy, "A statistical analysis of gamakas in Carnatic music", ISMIR 2017. https://archives.ismir.net/ismir2017/paper/000082.pdf
- **S194:** V. S. Viraraghavan, H. A. Murthy, R. Aravind, "Precision of sung notes in Carnatic music", ISMIR 2018. https://ismir2018.ismir.net/doc/pdfs/120_Paper.pdf
- **S195:** V. S. Viraraghavan et al., "Non-uniform time-scaling of Carnatic music transients", arXiv 1711.02318. https://arxiv.org/abs/1711.02318
- **S200:** T. Saitou, M. Goto, M. Unoki, M. Akagi, "Speech-to-singing synthesis: converting speaking voices to singing voices by controlling acoustic features unique to singing voices", IEEE WASPAA 2007. https://staff.aist.go.jp/m.goto/PAPER/WASPAA2007saitou.pdf
- **S201:** A. Krishnaswamy, "Melodic atoms for transcribing Carnatic music", ISMIR 2004. https://archives.ismir.net/ismir2004/paper/000219.pdf
- Also cited by S193 and S194 but not read here: Srikumar K. Subramanian, L. Wyse, K. McGee, "A two-component representation for modeling gamakas of Carnatic music", 2nd CompMusic Workshop, 2012 (stage and dance), and M. Subramanian, "Carnatic music: automatic computer synthesis of gamakams", Sangeet Natak 43(3), 2009 (Gaayaka). Neither could be retrieved, so nothing here rests on them.
