# Mridangam calibration

Fits the synthesized mridangam in `web/shared/mridangam.js` to the CompMusic Mridangam Stroke Dataset (v1.5, [Zenodo 4068196](https://zenodo.org/records/4068196), CC BY-NC 4.0). The dataset is not included: download it and unzip it, skipping `__MACOSX`. The method and results are in `docs/research/mridangam-synthesis.md`.

These scripts need Python with `numpy`, `scipy` and `soundfile`. `ROOT` below is the unzipped `mridangam_stroke_1.5` folder.

```
python -I 1_measure.py   ROOT measure.json 30          # spectra, decays, onset noise and thoppi glides, per stroke and tonic
python -I 2_fit.py       ROOT fit.json C               # up to 20 partials per stroke (tonic C)
python -I 3_export.py    ROOT fit.json C > strokes.json  # merge partials, ratios to Sa, loudness, thoppi glide
python -I 4_bands.py     ROOT strokes.json bands.json C  # noise beyond the partials, per 1/3 octave
python -I 5_calibrate.py ROOT bands.json calibrated.json 14   # partials and noise matched to the recordings
python -I 6_table.py     calibrated.json measure.json > table.js.txt   # decays bounded; the STROKES table
```

Paste `table.js.txt` over the `STROKES` table in `web/shared/mridangam.js`. Then check the result against the recordings:

```
node scripts/mridangam-wav.js --strokes --sa 261.63 --out synth/C     # likewise B 246.94, C# 277.18, D 293.66, D# 311.13
python -I validate.py  ROOT synth      # spectral distance and decay, per stroke and tonic
python -I confusion.py ROOT synth      # is each synthetic stroke nearest its own real stroke?
python -I ceiling.py   ROOT            # the same test for single real strokes
```
