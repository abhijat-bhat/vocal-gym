"""Stochastic part of each stroke: per 1/3-octave band, the mean-square envelope of the real strokes minus
that of the sinusoidal model (strokes-C.json, rendered exactly as web/shared/mridangam.js does), fitted as
an exponential decay. Output: strokes-C.json with 'bands': [[centre ratio to Sa, RMS at t = 0, T60], ...].
Usage: python -I 4_bands.py <dataset root> <strokes.json> <out.json> [tonic]"""
import sys, os, glob, json
import numpy as np
import soundfile as sf

root, inp, out = sys.argv[1], sys.argv[2], sys.argv[3]
TONIC = sys.argv[4] if len(sys.argv) > 4 else 'C'
SA = {'B': 246.94, 'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13}[TONIC]
SR, DUR, FR = 44100, 1.2, 0.005
CENTRES = 63 * 2 ** (np.arange(0, 24) / 3)     # 63 Hz .. 10 kHz, 1/3 octave
GLIDE = {'thom', 'dheem', 'tham'}

def load(f):
    x, sr = sf.read(f, always_2d=True); x = x.mean(axis=1)
    a = np.abs(x); i = max(0, int(np.argmax(a > 0.1 * a.max())) - int(0.002 * SR)); x = x[i:i + int(DUR * SR)]
    return np.pad(x / (np.abs(x).max() + 1e-12), (0, int(DUR * SR) - len(x[:int(DUR * SR)])))

def sines(parts):
    t = np.arange(int(DUR * SR)) / SR; y = np.zeros_like(t)
    for ratio, amp, t60, frm in parts:
        f = ratio * SA; glide = 1 + (frm - 1) * np.exp(-t / 0.04) if frm != 1 else 1
        ph = np.cumsum(2 * np.pi * f * glide / SR); y += amp * np.exp(-6.9078 / t60 * t) * np.sin(ph)
    return y

def band_env(x):
    """mean-square envelope per band (frames of 10 ms, hop 5 ms), by FFT masking"""
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); env = []
    n, h = int(0.01 * SR), int(FR * SR)
    for c in CENTRES:
        lo, hi = c / 2 ** (1 / 6), c * 2 ** (1 / 6); Y = np.where((f >= lo) & (f < hi), X, 0); y = np.fft.irfft(Y, len(x))
        env.append([np.mean(y[i:i + n] ** 2) for i in range(0, len(y) - n, h)])
    return np.array(env)

d = json.load(open(inp))
for s, v in d.items():
    files = sorted(glob.glob(os.path.join(root, TONIC, '*__' + s + '-*.wav')))[:25]
    real = np.median([band_env(load(f)) for f in files], axis=0)
    syn = band_env(sines(v['partials']))
    res = np.maximum(real - syn, 0)
    bands = []
    t = np.arange(res.shape[1]) * FR
    for c, e in zip(CENTRES, res):
        if e.max() <= 1e-10: continue
        p = int(np.argmax(e[:12])); top = e[p]
        sel = [i for i in range(p, len(e)) if e[i] > top * 1e-3]
        sel = sel[:next((j for j in range(1, len(sel)) if sel[j] != sel[j - 1] + 1), len(sel))]
        if len(sel) < 3: t60 = 0.03
        else:
            sl = np.polyfit(t[sel], 10 * np.log10(e[sel] + 1e-20), 1)[0]; t60 = float(np.clip(-60 / sl, 0.02, 3.0)) if sl < 0 else 3.0
        rms0 = float(np.sqrt(top) * 10 ** (6.9078 / t60 * t[p] / 20 * 0.0))   # level at the envelope's peak
        if 20 * np.log10(np.sqrt(top) + 1e-12) < -60: continue
        bands.append([round(float(c / SA), 4), round(rms0, 5), round(t60, 3)])
    v['bands'] = bands
    print(s.ljust(6), len(bands), 'bands; loudest', sorted(bands, key=lambda b: -b[1])[:3], flush=True)
json.dump(d, open(out, 'w'))
