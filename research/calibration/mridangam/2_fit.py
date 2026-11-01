"""Fit a modal model to each stroke of the Mridangam Stroke Dataset (tonic C: Sa = 261.63 Hz).
Partials: frequency (right head as a ratio to Sa; left head, below 200 Hz, in Hz with its glide),
amplitude and T60. Attack: the onset's band levels and decay. Output: JSON for the synthesizer.
Usage: python -I 2_fit.py <dataset root> <out.json> [tonic]"""
import sys, os, glob, json
import numpy as np
import soundfile as sf
from scipy.signal import find_peaks

root, out = sys.argv[1], sys.argv[2]
TONIC = sys.argv[3] if len(sys.argv) > 3 else 'C'
SA = {'B': 246.94, 'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13, 'E': 329.63}[TONIC]
STROKES = ['thi', 'tha', 'ta', 'thom', 'num', 'dhin', 'dheem', 'tham', 'cha', 'bheem']
SR, HOP, WIN = 44100, 0.005, 0.03
BANDS = [(150, 400), (400, 800), (800, 1600), (1600, 3200), (3200, 6400), (6400, 12800)]

def load(f):
    x, sr = sf.read(f, always_2d=True); x = x.mean(axis=1)
    a = np.abs(x); i = max(0, int(np.argmax(a > 0.1 * a.max())) - int(0.002 * SR))
    return x[i:] / (a.max() + 1e-12)

def goertzel_track(x, f, dur=1.5):
    n = int(WIN * SR); w = np.hanning(n); ph = np.exp(-2j * np.pi * f * np.arange(n) / SR) * w; out = []
    for i in range(0, min(len(x), int(dur * SR)) - n, int(HOP * SR)):
        out.append(abs(np.dot(x[i:i + n], ph)) * 2 / w.sum())
    return np.array(out)

def fit_decay(a):
    """initial amplitude (at the onset, extrapolated) and T60 from the log-linear fall after the peak"""
    db = 20 * np.log10(a + 1e-9); p = int(np.argmax(db[:30])); top = db[p]
    sel = []
    for i in range(p, len(db)):
        if db[i] < top - 30: break
        sel.append(i)
    if len(sel) < 4: return 10 ** (top / 20), 0.03
    t = np.array(sel) * HOP; sl, ic = np.polyfit(t, db[sel], 1)
    t60 = min(4.0, -60 / sl) if sl < -1 else 4.0
    # amplitude at t = 0 of the exponential, but not above what was measured at the peak (+3 dB)
    return float(min(10 ** (ic / 20), 10 ** ((top + 3) / 20))), float(t60)

def peak_freq(x, lo, hi, t0, t1):
    seg = x[int(t0 * SR):int(t1 * SR)]
    if len(seg) < 0.02 * SR: return None
    n = 65536; F = np.abs(np.fft.rfft(seg * np.hanning(len(seg)), n)); f = np.fft.rfftfreq(n, 1 / SR); m = (f >= lo) & (f <= hi)
    return float(f[m][np.argmax(F[m])])

params = {}
for s in STROKES:
    files = sorted(glob.glob(os.path.join(root, TONIC, '*__' + s + '-*.wav')))[:25]
    if not files: continue
    xs = [load(f) for f in files]
    n = 32768
    S = np.median([np.abs(np.fft.rfft(np.pad(x[:int(0.2 * SR)], (0, n))[:n] * np.hanning(n))) for x in xs], axis=0)
    fr = np.fft.rfftfreq(n, 1 / SR); db = 20 * np.log10(S + 1e-12); db -= db.max()
    m = (fr > 55) & (fr < 5000)
    idx, _ = find_peaks(np.where(m, db, -300), prominence=5, distance=int(20 / fr[1]))
    idx = [i for i in sorted(idx, key=lambda i: -db[i])[:20] if db[i] > -48]
    partials = []
    for i in sorted(idx, key=lambda i: fr[i]):
        f = float(fr[i])
        # refine the frequency per instance, then track amplitude
        fi = [peak_freq(x, f * 0.97, f * 1.03, 0.0, 0.15) for x in xs]; f = float(np.median([v for v in fi if v]))
        tracks = [goertzel_track(x, f) for x in xs]; L = min(len(t) for t in tracks)
        amp, t60 = fit_decay(np.median([t[:L] for t in tracks], axis=0))
        p = {'amp': round(amp, 4), 't60': round(t60, 3)}
        if f < 200:   # left head (thoppi): absolute frequency, with its glide over the first 150 ms
            f_end = np.median([v for v in (peak_freq(x, f * 0.75, f * 1.05, 0.08, 0.2) for x in xs) if v] or [f])
            f_start = np.median([v for v in (peak_freq(x, f * 0.95, f * 1.35, 0.0, 0.05) for x in xs) if v] or [f])
            p.update({'hz': round(float(f_end), 1), 'from': round(float(f_start / f_end), 3), 'head': 'left'})
        else:
            p.update({'ratio': round(f / SA, 4), 'head': 'right'})
        partials.append(p)
    # attack: band energies of the first 12 ms, relative to the strongest band, and the onset's decay
    att = []
    for x in xs:
        seg = x[:int(0.012 * SR)]; F = np.abs(np.fft.rfft(seg, 4096)) ** 2; f = np.fft.rfftfreq(4096, 1 / SR)
        att.append([F[(f >= a) & (f < b)].sum() for a, b in BANDS])
    att = np.median(att, axis=0); att_db = 10 * np.log10(att / att.max() + 1e-12)
    # attack level: broadband (> 1.6 kHz) RMS in the first 8 ms, linear re the normalised peak
    hf = []
    for x in xs:
        seg = x[:int(0.03 * SR)]; F = np.fft.rfft(seg); f = np.fft.rfftfreq(len(seg), 1 / SR); F[f < 1600] = 0; y = np.fft.irfft(F, len(seg))
        hf.append([np.sqrt(np.mean(y[:int(0.008 * SR)] ** 2)), np.sqrt(np.mean(y[int(0.008 * SR):int(0.02 * SR)] ** 2))])
    hf = np.median(hf, axis=0)
    tau = float(0.012 / max(0.05, np.log(hf[0] / max(1e-6, hf[1])))) if hf[0] > hf[1] else 0.02
    params[s] = {'n': len(xs), 'partials': partials, 'attack': {'bands_db': [round(float(v), 1) for v in att_db], 'rms': round(float(hf[0]), 4), 'tau': round(min(0.04, max(0.003, tau)), 4)}}
    print(s.ljust(6), len(partials), 'partials:', ', '.join((('L%.0fHz' % p['hz']) if p['head'] == 'left' else ('%.2fSa' % p['ratio'])) + ' %.3f/%.2fs' % (p['amp'], p['t60']) for p in partials), '| attack', params[s]['attack'], flush=True)
json.dump({'tonic': TONIC, 'sa': SA, 'strokes': params}, open(out, 'w'), indent=1)
