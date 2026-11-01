# Synthesizing the mridangam for jathi playback

**Status:** implemented in `web/shared/mridangam.js` and used by default for jathi playback on the demo pages and in the app. It is calibrated against recordings (§3) and measured against them (§5). It has not been tested by ear with mridangam players.

Jathi playback used to give each sollu a generic drum hit: a sine sweep with a burst of noise. This replaces it with a synthesized mridangam. Each sollu becomes the stroke a mridangist would play for it, and each stroke is modelled on recordings of the real stroke. The recorded-syllable voice (`docs/solkattu-recording.md`) remains, and the two can play together.

## 1. What the sources say

### The instrument

| # | Finding | Source |
|---|---|---|
| M1 | The right head (valanthalai) has a loaded black patch. It is the classic "harmonic drum": its first nine modes give five nearly harmonic tones. Measured ratios: ψ01 1.03, ψ11 2.00, ψ21 3.00, ψ02 3.00, ψ31 4.00, ψ12 4.00, ψ03 5.04, ψ41 5.03, ψ22 5.08. | Raman (1934); Sathej & Adhikari, *The eigenspectra of Indian musical drums* (arXiv 0809.1320), Table 1 |
| M2 | The drum is **tuned on its second harmonic**: chapu, which "primarily excites the second harmonic", is tuned to the singer's Sa. Dheem sits near the shifted fundamental (dheem : chapu = 0.535, so 1.07 f0). Nam excites the third harmonic (nam : chapu = 1.5). Chapu rings "for even up to a few seconds"; dheem decays at a rate of 2.02 s⁻¹. | Kumar, *Musical Excellence of Mridangam: an introductory review* (arXiv 2307.09425), reviewing Sivaraman, Ramasami & Naresh |
| M3 | The left head (thoppi) is loaded with a paste of rava for each session. Thom is "an open bass note", its base tone "the Pa note of the lower octave". Gumki modulates the thoppi's pitch. | Same review |
| M4 | Strokes: right hand Ki, Ta, Mi ("light Ki, played with middle finger"), Nam, Din, Arai- and Muruchapu, Dheem, Kin, Tan; left hand Tha (palm) and Thom (open, or gumiki up); and the combined Both (Thom with a right-hand stroke). | Laforge, Karya solkattu library (`Solkattu.Instrument.Mridangam`) |

### From sollus to strokes

Karya realizes standard groups as whole patterns:

| Group | Strokes |
|---|---|
| ta din gin na thom | k t k n o (Ki Ta Ki Nam Thom) |
| ta ka din na | k o o k |
| ta ka | k p (Ki, then left-palm Tha) |
| ta ka ti ku | k p n p |
| ta ri ki ta | o k n p |
| thom, dhom | o |
| tang, lang, cham | u (araichapu) |

Its author notes that the mapping "depends on context", and that one syllable such as ta can stand for many strokes (Karya source; ancient-future.com). **The mapping is a convention, not a fact of the sollu, and banis differ.**

### The recordings

The CompMusic **Mridangam Stroke Dataset** (Anantapadmanabhan, Bellur & Murthy, ICASSP 2013; v1.5 on [Zenodo](https://zenodo.org/records/4068196), CC BY-NC 4.0) has 6,977 isolated strokes: thi, tha, ta, thom, num, dhin, dheem, tham, cha and bheem, each at tonics B, C, C#, D, D# and E. It is used here only to **measure** the strokes. No recording is shipped.

## 2. Measurements (tonic C, 25–30 strokes each; `research/calibration/mridangam/1_measure.py`)

- **cha is on Sa:** its strongest early peak is at 263.8 Hz for tonic C and 247.6 Hz for B. At D#, cha and dhin form clean harmonic series: 311, 463, 626, 767, 934 Hz… = 2, 3, 4, 5, 6… × 155.5 Hz (M1, M2).
- **num:** a strong peak at 1.5 × Sa (393 Hz at C), the third harmonic (M2).
- **The thoppi is not retuned with the tonic.** Thom, dheem and tham share a bass peak near 92–95 Hz at every tonic. It glides down from about 113 Hz over the first 100 ms (a ratio of about 1.22), then holds. 92 Hz is about 3/8 of a C Sa, a lower Pa (M3).
- **Closed and open strokes:** the time to −40 dB is 0.13–0.15 s for thi, tha and ta, 0.19–0.21 s for num and cha, 0.30–0.36 s for thom, tham, dheem and dhin, and 0.65 s for bheem.
- **Damped strokes are not harmonic.** At tonics B and C, thi and ta share fixed peaks near 311, 347 and 372 Hz: the head pressed at its centre shifts its modes.

## 3. Method: deterministic plus stochastic synthesis

Each stroke is the sum of two parts.

1. **Partials.** Up to 20 exponentially decaying sinusoids: frequency, amplitude and T60, from the median spectrum of the first 200 ms of 25 strokes (`2_fit.py`). Partials closer than 2.5 % are merged. All frequencies are ratios to Sa, so the drum follows the playback sruti the way a mridangam is tuned to the singer (M2). The thoppi partials of thom, dheem and tham glide down from 1.22× with a 40 ms time constant, as measured (`3_export.py`).
2. **Noise.** One band per 1/3 octave from 63 Hz to 10 kHz. Each band is seeded white noise through two cascaded band-pass sections, with its own level and T60. The bands carry what the real strokes have beyond the partials: the membrane's weak modes and the hand's contact (`4_bands.py`).

**Calibration** (`5_calibrate.py`, 14 iterations).
- In the first 5 iterations, each partial's amplitude and decay are matched to the real energy within ±3 % of it, early (0–100 ms) and late (100–350 ms). Each stays within 0.5–2× its measured amplitude and 0.6–1.5× its measured decay.
- Then each noise band's level and decay are matched to the real 1/3-octave energy that the partials leave unexplained, early (0–60 ms) and late (60–250 ms).

**Bounds** (`6_table.py`). Noise decays are limited to 1.5× the stroke's measured time to −40 dB, partial decays to 3×, and no band may exceed 0.6. Without these limits the calibration, which only sees the first 250 ms, let some quiet bands ring for seconds.

**Loudness.** Each stroke keeps its measured peak level relative to thom (from the raw recordings). The level is taken as a square root, so the right-hand strokes stay audible on small speakers that cannot reproduce the thoppi's 90 Hz.

**Strokes not in the dataset.** Mi is a light Ki (thi at half level). Gumki is the open thoppi ring (bheem) bent upward from 1/1.22 of its pitch with a 120 ms time constant.

**Rendering** takes about 0.1 s per stroke. Strokes are rendered once per Sa at 44.1 kHz, prepared in the background when a page loads and when Sa changes, and cached. Web Audio resamples the buffers itself.

## 4. From sollus to strokes

`realize(sollus)` matches the longest standard group first, with spellings compared loosely (ta = tha, din = dhi, gin = gi). Rests do not break a group. Any syllable not in a group gets its default stroke.

| Group | Strokes | Basis |
|---|---|---|
| tha dhi gi na thom | Ki Ta Ki Nam Thom | Karya `tdgnt` |
| tha ka dhi na | Ki Thom Thom Ki | Karya `takadinna` |
| tha ka | Ki Tha | Karya `kp` |
| tha ka dhi mi | Ki Tha Nam Tha | Karya `kpnp` (ta ka ti ku), applied to ta ka di mi; an interpretation |
| tha ri ki ta | Thom Ki Nam Tha | Karya `oknp` |
| tha ka dhi mi tha ki ta, tha ka dhi mi tha ka, tha ri ki ta tha ka | the groups above, concatenated | |
| tha ki ta, ki ta, ki ta tha ka | Ki Ta Ki, Ki Ta, Ki Ta Ki Tha | ki and ta as Ki and Ta |
| tha ka jho nu, jho nu | Ki Tha Thom Nam, Thom Nam | interpretation |
| tat tai tam, tai ya | Tha Thom Tham, Thom Tha | interpretation (dance sollus) |

Single syllables:
- tha, ki, gi, ri, hat → Ki (thi)
- ta, hi → Ta
- ka, mi, tat, ya, ku, ga, ha → Tha
- dhi, na, nam, nu, num → Nam (num)
- thom, tai, jho, gu → Thom
- jham, tam → Tham
- dhit → Din
- dhim → Dheem
- lan, lang, tang, cham → chapu

**The rows marked as interpretations need a mridangist's review.**

## 5. How close it is

The test: each synthetic stroke is compared with the median real stroke of every type at the same tonic, and the closest one should be its own type. The features are a 1/6-octave spectrum of the first 250 ms plus the times to −20 and −40 dB (`confusion.py`). Tonics B, C#, D and D# were not used in the fit.

| | Nearest real stroke is the right one | Mean rank of the right one (of 9) |
|---|---|---|
| A single real stroke, held out (the ceiling of this test) | 193 of 225 (86 %) | n/a |
| **Synthesized mridangam** | **25 of 45 (56 %)**; 8 of 9 at tonic C | **2.0** |
| The previous drum hits | 6 of 45 (13 %) | 4.2 |

What remains:
- The 1/6-octave spectral distance to the real median is 6–11 dB, against 1–3 dB between two halves of the real strokes. Most of the difference is fine structure inside the 1/3-octave noise bands.
- Times to −40 dB match within about 0.03 s for thi, ta, tha and cha. Dhin (0.60 s against 0.36 s) and bheem (1.2 s against 0.65 s) ring longer than recorded.
- Common confusions are between related strokes: thom with tham (thom plus nam), ta with tha or thi (all closed), and **cha, which most often lands nearest thi**. It is the weakest stroke.
- Strokes not in the dataset (Kin, Tan, the two chapus apart, Mi, gumki) are approximations derived from those that are.

## 6. Not done

- A listening test with mridangam players, and a review of the interpretations in §4.
- Bani-specific realizations, and a choice of stroke from context beyond the groups in §4 (for example accents, or the ending of a phrase).
- Per-tonic tables. One table, fitted at C, is transposed to every Sa. The dataset's damped strokes are not consistent across tonics, which partly explains the misses at B and D#.

## Sources

- C. V. Raman, "The Indian musical drums", *Proc. Indian Acad. Sci.* A 1, 179–188 (1934).
- G. Sathej, R. Adhikari, "The eigenspectra of Indian musical drums", arXiv 0809.1320. https://arxiv.org/abs/0809.1320
- A. S. Kumar, "Musical Excellence of Mridangam: an introductory review", arXiv 2307.09425 (on U. K. Sivaraman, T. Ramasami, M. D. Naresh, *Musical Excellence of Mridangam*). https://arxiv.org/abs/2307.09425
- A. Anantapadmanabhan, A. Bellur, H. A. Murthy, "Modal analysis and transcription of strokes of the mridangam using non-negative matrix factorization", ICASSP 2013 (the dataset's paper; not read: the repository blocks automated access).
- Mridangam Stroke Dataset v1.5, CompMusic / A. Anantapadmanabhan, CC BY-NC 4.0. https://zenodo.org/records/4068196
- E. Laforge, Karya: `Solkattu.Instrument.Mridangam`, `Solkattu.Dsl.Solkattu` (GPL-3.0; the stroke vocabulary and default realizations are cited, no code is used). https://ofb.net/~elaforge/karya/


## Hearing a korvai's structure (v0.8.1)

The strokes in §3 are faithful to the recordings, but a korvai played one stroke a syllable, all at one level, is a stream of right-hand strokes (thi, ta, tha, num) that sound alike. Its phrases, and so its arithmetic, could not be heard. `arrange(cells)` voices the lab's layout instead. It is deterministic, and it changes only how the passage is played, never the syllables or their timing.

| What | How it is played | Why |
|---|---|---|
| A phrase | Realized on its own, so no stroke group straddles two phrases | Group strokes follow the phrase |
| Its first stroke | 1.15 × its level, doubled by a thom (the thoppi) at 0.55 | A drummer marks phrase starts with the left hand |
| A mora statement, uttaranga or mukhra | Opens on tham (both heads) | The cadence is heard to arrive |
| Strokes inside a phrase | 0.62 × their level; a final thom 0.95 | The starts stand out |
| The closing syllable | A full tham with a dheem | The landing |
| Gaps | Silent | The two gaps of a mora are heard as equal silences |
| Phrase tone | A soft sine pluck (partials 1, 2, 3) an octave above Sa at each phrase start. It rises 7·log₂(length / shortest) semitones, snapped to Sankarabharanam (at most 28). | Lengths become pitches: gopuccha falls, srotovaha rises, mridanga rises and falls, kuraippu halves in fifths, equal statements repeat one note |

The tones and the drum follow the playback Sa. `test/mridangam.test.js` checks:

* the contours: gopuccha, srotovaha, mridanga, damaru, kuraippu, and a GP against an AP;
* the accents, and that gaps stay silent;
* that changing Sa from C to D moves every tone by exactly that ratio.
