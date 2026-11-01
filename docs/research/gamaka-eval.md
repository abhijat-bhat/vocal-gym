# Gamaka rendering: evaluation by ear

**Status:** the kit and protocol are ready. **No listening sessions have been run, so there are no results yet.** Nothing in this document is a measured finding about how the rendering sounds. Plan: `docs/plans/gamaka-audio.md` §8 and Phase 5.

## 1. What is being tested

`renderGamaka` (README section 12.9) turns a kalpana round into a pitch contour with the raga's gamaka. Its rules are transcriptions of prose descriptions (`gamakaRender` in `data/raga-profiles.json`), not measurements. The evaluation has to answer three questions:

1. Does gamaka make the rounds sound **more idiomatic** than plain tones, or does the synthetic voice just sound "bendy"?
2. Does it carry **raga identity**? Expert listeners have identified Todi, Varali and Kalyani from transients alone at 86–95% accuracy, and Sankarabharanam at only 22% (S193). So the success measure is higher identification for Todi, Kalyani and Mayamalavagowla, and **no loss** for Sankarabharanam, whose plain G is correct.
3. Are the transcriptions right? Each rule that needed judgement carries an `interpretation` note, and a musician should review those notes before the sessions.

`full` gamaka becomes the demo default only if the rating results in §4 support it. Until then the demo defaults to `light`.

## 2. Before the sessions: musician review of the rules

1. Print the `interpretation` notes. They are shown on the console by this command:
   `node -e "const d=require('./data/raga-profiles.json');for(const[id,r]of Object.entries(d.ragas))if(r.gamakaRender)for(const[L,l]of Object.entries(r.gamakaRender.rules))l.forEach(x=>console.log(id,L,x.body,x.onset||'',x.lo||'',x.hi||'',x.src,'|',x.interpretation||''))"`
2. For each rule, a musician marks it **agree**, **adjust** (with the change) or **remove**.
3. Edit the rules, then run `npm run check`. The validator and the gamaka tests guard the format.
4. Record the review in §5 below (who reviewed it, and how many rules were kept, adjusted or removed).

## 3. The kit

```
npm run listening-kit                  # writes listening-kit/ (about 31 MB, not committed)
node scripts/listening-kit.js --out <dir> --seed 2   # a second, differently ordered kit
```

| Part | Clips | What listeners do |
| --- | --- | --- |
| A, idiom | 6 ragas (Todi, Kalyani, Mayamalavagowla, Sankarabharanam, Gourimanohari, Kharaharapriya) × 2 rounds × {plain, full gamaka} = 24 clips. Each is one avartanam of Adi in second speed at 60 aksharas a minute, resuming on Sa, at T 0.4 | Rate each clip 1–5: "How idiomatic is this as Carnatic singing?" |
| B, raga identification | 4 ragas (Todi, Kalyani, Mayamalavagowla, Sankarabharanam) × {plain, full} = 8 clips of about 20 s each | Name the raga, or answer "not sure" |

- **Files:** listeners get `A01.wav` … `B08.wav` and `form.csv`. `key.json` maps each clip to its raga, gamaka setting and the exact `vocal-gym kalpana` command, and stays with the experimenter.
- **Ordering:** clip order is random but fixed by `--seed`, so one seed reproduces one kit exactly. Use two seeds across listeners to balance order effects.
- **Audio:** clips are additive synthesis (8 harmonics, no vibrato) with a soft tanpura drone on Sa = 261.63 Hz. The Node renderer has no formant filters, so it sounds plainer than the browser voice. The rendering is deterministic.

**Listeners.** About 10 Carnatic musicians with at least five years of training, and at least three teachers or performers among them. Use headphones, and play each clip at most twice. Take part A before part B, so that hearing gamaka in A does not bias identification in B more than it has to.

## 4. Analysis (to fill in)

- **Idiom (part A):**
  - Compute the mean rating per raga and setting, and the paired difference full − plain per listener and raga.
  - Run a Wilcoxon signed-rank test over listeners, per raga and pooled.
  - The gate for making `full` the demo default: a pooled improvement of at least 0.5 points, with no raga worse by more than 0.5.
- **Identification (part B):**
  - Compute the share of correct answers per raga and setting.
  - Expected: higher with gamaka for Todi, Kalyani and Mayamalavagowla; Sankarabharanam no worse.
  - With 10 listeners this is descriptive, not a significance test.
- **Comments:** collect free comments per clip, and list every clip someone called "out of tune", "bendy" or "Hindustani".

| Raga | Idiom, plain | Idiom, full | Δ | Identified, plain | Identified, full |
| --- | --- | --- | --- | --- | --- |
| Todi | — | — | — | — | — |
| Kalyani | — | — | — | — | — |
| Mayamalavagowla | — | — | — | — | — |
| Sankarabharanam | — | — | — | — | — |
| Gourimanohari | — | — | — | n/a | n/a |
| Kharaharapriya | — | — | — | n/a | n/a |

## 5. Rule review log (to fill in)

| Date | Reviewer | Rules kept | Adjusted | Removed | Notes |
| --- | --- | --- | --- | --- | --- |
| — | — | — | — | — | — |

## 6. Constants: current values and why

These are the v0.4 contour's constants. Since v0.5 the default contour is the natural one, and its timing, overshoot, preparation, fluctuation and intensity dial are set out with their reasons in `docs/research/gamaka-naturalness.md` §3. The kit renders `--gamaka off` and `full`. To test the performative middle too, add clips at `--gamaka 55`; §4 of that document lists what to listen for.

None of these values has been tuned by ear yet. Each is set from the literature as the plan describes, and changes only with listening or calibration evidence recorded here.

| Constant | Value | Why this value |
| --- | --- | --- |
| `CPN_MIN` | 0.08 s | The 80 ms definition of a constant-pitch note (S193). |
| `STA_DWELL` | 0.06 s | Stationary points are about 100 ms long; this is that length less the two half-transitions around it (S193). |
| `TRANS_SEC` | 0.05 s | A mean transient of about 100 ms, shared by the two notes it joins. |
| `JARU_SEC` | 0.14 s | A deliberate slide has to be perceptibly longer than an ordinary transition. |
| `NOKKU_SEC`, `ORIKKAI_SEC` | 0.05 s, 0.07 s | Short flicks; the orikkai is a little longer so the upward turn is audible. |
| `MAX_RATE_HZ` | 5 | One cycle of two stationary points and two transitions takes 0.22 s; the tests measure at most 4.55 Hz. |
| `LAND_HOLD` | 0.25 s | The swara before the eduppu must give the singer a clean pitch reference. |
| Transition shape | Half-cosine | Listeners preferred neither cosine nor linear interpolation (S194); cosine avoids corners. |
| Chain limit | 4 oscillating notes | Transient chains rarely last longer than about 1.5 mean CPNs (S193). Notes touched only by a nokku or odukkal keep their CPN anchor and do not count, so Kalyani's note-by-note orikkai in descent stays intact. |
| Light default depth | 0.5 | Conservative by design for ragas without data (plan §4); to be revisited after part A. |

## 7. Calibration against data (optional, not started)

For the ragas that overlap with public pitch tracks (Todi, Kalyani, Sankarabharanam, Kharaharapriya, Kambhoji), CPN and STA statistics per swara can be extracted from Saraga or Saraga-Carnatic-Melody-Synth (S197, CC BY 4.0; for example via the `compiam` package):

- the dwell of stationary points and the duration of transitions, to fit `STA_DWELL` and `TRANS_SEC`;
- the typical number of cycles per swara and duration;
- where stationary points sit relative to the scale notes.

The results would go back into `gamakaRender` as rules with `basis: "measured"`, `±Nc` targets where the measured points sit off the scale notes, and a source. That analysis is Python and belongs in `research/calibration/`, outside the engine. None of it has been done.
