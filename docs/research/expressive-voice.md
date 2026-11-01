# The singing voice for kalpana and alankara playback (v0.6)

**Status:** implemented in v0.6, in `web/shared/voice.js`. One file is used by three hosts:

- the playground pages (inlined by the build);
- the app (served at `/shared/voice.js`, with its contour from `POST /api/render`);
- Node (`scripts/render-wav.js` and `test/voice.test.js` import it).

The phrasing and loudness it sings come from the engine's expression layer (`src/engine/gamaka/expression.js`, described in `docs/research/gamaka-papers.md` §6).

---

## 1. Why the old tone sounded like a computer

There were two players before v0.6.

- **The plain tone** (`tone()`, alankaras, and kalpana at gamaka 0): a triangle oscillator through a 2.4 kHz low-pass, one note per swara, with a fixed attack and decay.
- **The gamaka voice** (`scheduleGamaka()`): 16 harmonics at 1/h^1.3 through three fixed band-pass "formants", with a loudness curve that followed the pitch.

Both lacked what makes a voice sound human:

| A voice has | The old tones had |
| --- | --- |
| Continuous pitch between swaras, with overshoot and preparation, even when the notes are "straight" (S200) | Steps from note to note (plain tone) |
| A spectrum that changes with loudness: louder is brighter | One waveform at every level |
| Formants that stay put while the pitch moves, so the harmonics walk through them as the voice sings a gamaka | A fixed waveform shape |
| Breath noise, and tiny random wander of pitch (jitter) and level (shimmer) | Exact periodicity |
| Consonants: a sung swara is "sa", "ri", "ga", not a bare vowel | No onsets beyond a gain dip |
| Phrases, breaths, stressed beats, softer endings (S210 §8.5, S204) | Every note at the same level |

---

## 2. Design: the line and the voice

The work is split in two:

1. **The line** (the engine, deterministic, `src/engine`). `renderGamaka(notes, opts)` gives the pitch contour (with the raga's gamaka at the dial's intensity) and `expression` (phrases, per-swara stress and syllables, a loudness curve per legato group).
   - At intensity 0 with `voice: true`, the contour is the **legato voice**: straight notes joined by short moves (0.6 of a gamaka move), with overshoot, preparation, drift and flutter. The holds stay within ±0.3 semitone of each swara, so the notes are as straight as before; only the joins are sung.
2. **The voice** (`web/shared/voice.js`, a rendering of the line). `VGVoice.lineOf(contour)` turns the engine's output, or the CLI's `--contour json`, into a line. `VGVoice.render(line, opts)` sings it into a `Float32Array`, and `VGVoice.play(ac, out, t0, line, opts)` renders it at the audio context's rate and schedules it as one buffer.

The voice renders the whole line ahead of time, about 14 ms of computation per second of audio in V8, then plays one buffer. This keeps the synthesis sample-accurate and identical in the browser, the offline WAV and Node. It also avoids the Web Audio limitation of one `setValueCurveAtTime` per parameter at a time.

---

## 3. The synthesis

### 3.1 Source and filter, per harmonic

The voice is a source–filter model computed in the frequency domain and synthesized additively. Additive synthesis is alias-free, and the filter is exact at every harmonic.

The pitch, loudness and every harmonic's amplitude are updated every 32 samples (0.7 ms); between updates the fundamental frequency and the overall amplitude are interpolated sample by sample. Harmonic `h` (frequency `f = h·f0`, up to 5.4 kHz) has amplitude

```
A_h = h^(−s) · Π_k  F_k² / sqrt((F_k² − f²)² + (B_k·f)²)   · top fade (4.3–5.4 kHz)
```

That is a source slope `s` times a cascade of four second-order resonators, the formants. The amplitudes are normalised to unit power and scaled by the loudness. The samples are `Σ_h A_h · sin(2π·h·φ)`, where `φ` is the fundamental's running phase, read from a 4096-point sine table.

**Register (v0.8.7).** The voice sings an octave below the drone's Sa: with Sa = C4 its madhya Sa is C3 (130.8 Hz). At Sa itself it sat in a thin, high register that listeners found tiring; `octave: 0` restores it. The drone, the tones and the percussion keep their pitch.

**Formants** are the means for /ɑ/ and /i/ in Peterson & Barney (1952), with a fourth formant added: the men's means (/ɑ/ 730, 1090, 2440 Hz; /i/ 270, 2290, 3010 Hz) for the default lower register, the women's means for `octave: 0`, so the timbre matches the register rather than being a high voice transposed down.

| Vowel | F1 (B1) | F2 (B2) | F3 (B3) | F4 (B4) |
| --- | --- | --- | --- | --- |
| a | 850 (90) | 1220 (100) | 2810 (150) | 3800 (220) |
| i | 310 (70) | 2790 (120) | 3310 (160) | 4100 (240) |

**Formant tuning.** F1 is kept at least 1.08 × f0, as high voices do (Sundberg 1987). Otherwise the fundamental of a high swara would sit above the first formant and lose its strength.

Because the formants are fixed in frequency while f0 moves, a gamaka changes the timbre the way it does in a real voice: harmonics brighten and darken as they cross a formant. A stretched waveform cannot do this.

### 3.2 Loudness and brightness

The loudness at each moment is

```
level × gain(t) × attack/release × onset dip × (1 + shimmer)
```

where `gain(t)` is the expression layer's curve. The source slope follows the same gain:

```
s = clamp(1.05 − 0.9 × (gain − 0.95), 0.85, 1.35)
```

A stressed attack is brighter as well as louder, and a fading phrase end grows darker, the way vocal effort works (Klatt & Klatt 1990 describe the spectral tilt of soft and breathy voices).

A legato group starts with a 55 ms attack and ends with a 45 ms exponential release after its last swara.

### 3.3 Breath, jitter and shimmer

- **Breath.** Seeded white noise, band-passed at 1.5 kHz (Q 0.7), low-passed twice at 3.2 kHz and pulsed with the glottal cycle (`0.1 + 0.9·max(0, cos 2πφ)²`, so it sounds in the opening phase and fuses with the voice). Its level is 0.6% of the voice, scaled with the voice's loudness, plus up to 2% at each phrase's first swara (a breathy onset).
- **Why so little (v0.8.7).** Until v0.8.6 the breath was broadband noise centred at 2.7 kHz at 2.2% (more in soft passages), and the "s" of sa a band at 6.2 kHz at 16%. Measured against the voice, the noise was only about 20 dB down above 4 kHz, where the voice has little energy, and above 5.4 kHz the voice has no harmonics at all, so it was heard as white noise. Now the band above the harmonics (9 kHz) is 77 dB under the voice on "aa" (it was 52) and 53 dB on the swara names (it was 40), and `test/voice.test.js` holds it there.
- **Jitter.** A slow random wander of the fundamental, about ±0.35% (±6 cents), smoothed over about 50 ms. The engine's contour has its own drift and flutter (S200), so the total stays within a natural singer's precision (S194).
- **Shimmer.** A slow wander of about ±2.5% in level.

All noise comes from a seeded generator, never `Math.random`, so the same line, options and seed give the same samples.

### 3.4 Onsets: sung on "aa", or the swara names

`opts.timbre` picks how each swara begins.

**`'aa'` (default)** is akaram. Every swara after a phrase's first gets a soft re-articulation: the voice dips to 72% over about 40 ms around the beat. A jaru glides in with no dip.

**`'swaram'`** sings the swara names. The vowel is a for sa, ga, ma, pa and dha, and i for ri and ni, crossfaded over 60 ms across each boundary. The consonant is placed **before the beat**, so the vowel lands on it, as singers time consonants. Times are relative to the beat:

| Consonant | Gesture | Voice | Noise |
| --- | --- | --- | --- |
| s (sa) | fricative, −85 to +10 ms | down to 3% | band at 5.2 kHz (Q 2), up to 7% (16% at 6.2 kHz before v0.8.7) |
| p (pa) | voiceless stop: closure −65 to 0 ms | silent | burst at the release (8 ms), aspiration to +38 ms |
| g (ga) | voiced stop: closure −60 to −4 ms | 28%, low-passed at 450 Hz (the voice bar) | burst at 1.9 kHz |
| d, dh (dha) | voiced dental stop; dh aspirated | as g | burst at 3.8 kHz; dh adds aspiration to +55 ms |
| m (ma), n (ni) | nasal murmur, −65 to +12 ms | 50%, low-passed at 750 Hz with a 260 Hz nasal resonance | none |
| r (ri) | tap, −32 to 0 ms | a brief dip to 38%, partly closed | none |

The first swara of a phrase uses the same gestures; its fricative is a little stronger.

---

## 4. Where it plays

| Host | How | Settings |
| --- | --- | --- |
| Playground (`site/playground.html`, `site/research-plan.html`) | `demo.js`: `playKalpana` and `playAlankara` call `lineContour()` (`renderGamaka` with `voice: true` and the tala's accents), then `singLine()` → `VGVoice.play`; "Download WAV" renders the same voice offline | "Voice": Sung on "aa" (default), Sung swara names, Simple tone; "Gamaka" 0–100 now applies to alankaras too. Both are remembered (`vg.voice`, `vg.gamakaLevel`). |
| App (`npm start`) | `pitchedJob(…, { raga, units, seed })` fetches `POST /api/render` once per tempo, gamaka and voice combination, then plays with `VGVoice`. The kalpana, alankara and home sample all sing. | Transport "Voice" and "Gamaka" (`settings.voice`, `settings.gamaka`, default 55) |
| Node | `scripts/render-wav.js --timbre aa\|swaram\|tone` (default aa); `vocal-gym kalpana --contour json` now includes `groups` and `expression`, and `--voice` gives the legato straight voice at `--gamaka off` | — |

Fallbacks: with "Simple tone", or without a raga, or if the server cannot render, playback uses the earlier tones (`tone()`, `scheduleGamaka()`), unchanged. The listening kit (`scripts/listening-kit.js`) keeps the tone timbre, so its clips stay as `docs/research/gamaka-eval.md` describes.

### `POST /api/render`

```
{ raga, notes: [{ p, dur }], bpm, per, intensity (0–1), seed?, cycleBeats?, angaStarts?, units? }
→ { groups: [{ t0, t1, points: [[t, p]] }], notes: [{ i, t0, t1, p, shape, rule }],
    expression: { phrases, notes, gain: [[[t, g]]] }, stats, slotSec, … }
```

The request is validated: whole-semitone pitches from −24 to 36, 1–64 slots each, at most 4000 notes. The response is deterministic, and the notes are never changed. `units` must cover the notes exactly, or the route ignores them.

---

## 5. Determinism and performance

- **Determinism.** The voice has no `Math.random` and no time-dependent state. `test/voice.test.js` renders the same line twice and compares every sample. The engine side follows the repository's determinism rule (`rng(seed)`).
- **Speed.** A 13.6 s Todi round renders in about 0.19 s on aa and 0.26 s on the swara names (Node 25, one core).
  - The players render first and schedule after, so the first beat is placed only once the voice is ready. A long round therefore starts after a short pause (about 0.4 s for 30 s) but never loses its beginning.
  - The app also caches the rendered samples per tempo, gamaka, voice and Sa, so a loop or a replay starts at once.
  - Inside a Node `vm` context the same code is about nine times slower (slow global lookups), so the scripts and tests import the file instead.
- **Level.** The peak is about −6 dBFS. A soft knee above 0.8 keeps any peak under full scale without touching the normal range.

---

## 6. API

```js
VGVoice.lineOf(contour)               // renderGamaka output, the /api/render response, or CLI --contour json
VGVoice.render(line, { sa, sr, timbre, level, seed })   // → Float32Array; sample 0 is PRE (0.1 s) before t = 0
VGVoice.play(ac, out, t0, line, opts) // → end time; the buffer starts PRE before t0
VGVoice.VOWEL, VGVoice.CONS           // the formant and consonant tables, for tuning
renderGamaka(notes, { …, voice: true, per, cycleBeats, angaStarts })   // the legato straight voice at intensity 0; the tala stress
gamakaExpression(notes, contour, opts), syllableOf(raga, p)            // the expression layer on its own
```

---

## 7. Tests

`test/voice.test.js`:

- **The same line gives the same samples.**
- **Finite, audible, unclipped:** peak between 0.1 and 1, RMS above 0.02.
- **In tune.** Sa, Pa and tara Sa, held for 1.2 s each, are measured by autocorrelation within 15 cents of 261.63, 392 and 523.25 Hz, and Sa = D is sung at 293.66 Hz.
- **Swara names vs aa.**
  - The two timbres differ.
  - A "pa" is closed before its beat, with less than half the energy of the same moment on aa.
  - The last swara fades.
  - An empty line is silence.
- **The CLI's JSON form** sings sample-for-sample the same as the engine output.

Elsewhere:

- `test/server.test.js`: `/api/render` is deterministic, spans the round, has gamaka at 55, loudness in range, unchanged notes, no gamaka at 0, and readable 400s.
- `scripts/smoke.js`: in both pages, kalpana (gamaka 0, 55, 100) and alankara each sing one finite, audible buffer on aa and on the swara names, with no oscillator pitch curves. Simple tone still schedules one pitch curve per legato group.
- `scripts/e2e.js`: the app's home sample and alankara playback run through `/api/render` in headless Chrome.

---

## 8. Limits and next steps

- **One voice type.** The formants are women's means, so a lower Sa (a male voice) sounds like a woman singing low. A voice-type setting (men's formants, a darker source) is a small change to `VOWEL`.
- **Consonants are gestures, not recordings.** They sound like consonants in context but are not phonetically exact. The recorded-syllable pipeline (`docs/solkattu-recording.md`) could be extended to swara syllables.
- **No vibrato.** This is deliberate: Carnatic plain notes are steady, and vibrato would blur the plain/oscillated contrast the gamaka model depends on.
- **The listening test** (`docs/research/gamaka-eval.md`) has not been run with the new voice. It should be repeated with `--timbre aa` clips before claims about naturalness are made.

### References (acoustics, not raga knowledge)

- G. E. Peterson & H. L. Barney, "Control methods used in a study of the vowels", *JASA* 24 (1952).
- J. Sundberg, *The Science of the Singing Voice* (1987): formant tuning in high voices.
- D. H. Klatt & L. C. Klatt, "Analysis, synthesis, and perception of voice quality variations among female and male talkers", *JASA* 87 (1990): spectral tilt and aspiration.
- Saitou et al. 2007 (S200) for F0 overshoot, preparation and fine fluctuation; Viraraghavan et al. (S193, S194) for the precision of held notes.
