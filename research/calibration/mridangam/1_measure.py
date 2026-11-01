"""Measure the CompMusic Mridangam Stroke Dataset (v1.5) to calibrate a modal synthesizer.
For each stroke and tonic: median spectrum peaks (as ratios to the tonic), per-peak decay (T60),
onset noise, overall envelope, and the low-frequency pitch trajectory (thoppi glides).
Usage: python -I 1_measure.py <dataset root> <out.json> [max files per class]"""
import sys, os, json, glob
import numpy as np
import soundfile as sf
from scipy.signal import find_peaks

root, out_path = sys.argv[1], sys.argv[2]
MAXN = int(sys.argv[3]) if len(sys.argv) > 3 else 40
NOTE = {'B': -1, 'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4}
STROKES = ['thi', 'tha', 'ta', 'thom', 'num', 'dhin', 'dheem', 'tham', 'cha', 'bheem']
SR = 44100

def load(f):
    x, sr = sf.read(f, always_2d=True)
    x = x.mean(axis=1)
    assert sr == SR, sr
    # onset: first sample above 10% of the peak, minus 2 ms
    a = np.abs(x); th = 0.1 * a.max()
    i = max(0, int(np.argmax(a > th)) - int(0.002 * SR))
    return x[i:]

def spectrum(x, t0, t1, n=16384):
    seg = x[int(t0 * SR):int(t1 * SR)]
    seg = np.pad(seg, (0, max(0, n - len(seg))))[:n] * np.hanning(n)
    return np.abs(np.fft.rfft(seg))

def stft_track(x, freqs, hop=0.005, win=0.04, dur=1.2):
    """amplitude (dB) of each frequency over time, by Goertzel-like projection on a window"""
    n = int(win * SR); w = np.hanning(n); T = []
    t = 0.0
    while t + win < min(dur, len(x) / SR):
        seg = x[int(t * SR):int(t * SR) + n] * w
        k = np.arange(n) / SR
        T.append([20 * np.log10(abs(np.sum(seg * np.exp(-2j * np.pi * f * k))) + 1e-9) for f in freqs])
        t += hop
    return np.array(T)

def t60(track, hop=0.005):
    """decay time to -60 dB from a line fit on the part of the track 3..35 dB below its peak"""
    out = []
    for j in range(track.shape[1]):
        y = track[:, j]; p = int(np.argmax(y)); top = y[p]
        sel = [i for i in range(p, len(y)) if top - 35 <= y[i] <= top - 3]
        if len(sel) < 4: out.append(None); continue
        # stop at the first point below -35
        sl = np.polyfit(np.array(sel) * hop, y[sel], 1)[0]
        out.append(round(float(-60 / sl), 3) if sl < 0 else None)
    return out

res = {}
for tonic in NOTE:
    for s in STROKES:
        files = sorted(glob.glob(os.path.join(root, tonic, '*__' + s + '-*.wav')))[:MAXN]
        if not files: continue
        xs = [load(f) for f in files]
        S_early = np.median([spectrum(x, 0.0, 0.25) for x in xs], axis=0)
        S_late = np.median([spectrum(x, 0.15, 0.6) for x in xs], axis=0)
        fr = np.fft.rfftfreq(16384, 1 / SR)
        def peaks(S, k=10):
            db = 20 * np.log10(S + 1e-9); db -= db.max()
            m = (fr > 40) & (fr < 6000)
            idx, _ = find_peaks(np.where(m, db, -200), prominence=6, distance=int(25 / (fr[1])))
            idx = sorted(idx, key=lambda i: -db[i])[:k]
            return sorted([(round(float(fr[i]), 1), round(float(db[i]), 1)) for i in idx])
        pe = peaks(S_early); pl = peaks(S_late)
        freqs = [f for f, _ in pe]
        tracks = [stft_track(x, freqs) for x in xs if len(x) > 0.3 * SR] or [stft_track(xs[0], freqs)]
        L0 = min(len(tk) for tk in tracks)
        tr = np.median([tk[:L0] for tk in tracks], axis=0) if freqs and L0 > 4 else None
        dec = t60(tr) if tr is not None else []
        # onset noise: share of energy above 2 kHz in the first 10 ms vs 10-60 ms
        def band(x, a, b, lo):
            seg = x[int(a * SR):int(b * SR)]; F = np.abs(np.fft.rfft(seg)) ** 2; f = np.fft.rfftfreq(len(seg), 1 / SR)
            return float(F[f > lo].sum() / (F.sum() + 1e-12))
        hf0 = float(np.median([band(x, 0, 0.01, 2000) for x in xs])); hf1 = float(np.median([band(x, 0.01, 0.06, 2000) for x in xs]))
        # overall envelope: time from peak to -20/-40 dB (10 ms RMS)
        def env_times(x):
            n = int(0.01 * SR); r = np.array([np.sqrt(np.mean(x[i:i + n] ** 2)) for i in range(0, len(x) - n, n // 2)]); d = 20 * np.log10(r + 1e-9); p = int(np.argmax(d))
            t20 = next((i for i in range(p, len(d)) if d[i] < d[p] - 20), len(d)) - p; t40 = next((i for i in range(p, len(d)) if d[i] < d[p] - 40), len(d)) - p
            return t20 * 0.005, t40 * 0.005
        et = np.median([env_times(x) for x in xs], axis=0)
        # lowest strong peak trajectory (glide): peak frequency below 250 Hz in successive 60 ms windows
        def glide(x):
            out = []
            for t in [0.0, 0.05, 0.1, 0.2, 0.3, 0.45]:
                seg = x[int(t * SR):int((t + 0.08) * SR)]
                if len(seg) < 0.08 * SR: break
                n = 32768; F = np.abs(np.fft.rfft(seg * np.hanning(len(seg)), n)); f = np.fft.rfftfreq(n, 1 / SR); m = (f > 50) & (f < 250)
                out.append(round(float(f[m][np.argmax(F[m])]), 1))
            return out
        gl = [glide(x) for x in xs]; L = min(len(g) for g in gl); gm = np.median([g[:L] for g in gl], axis=0).tolist() if L else []
        res.setdefault(s, {})[tonic] = {'n': len(xs), 'early': pe, 'late': pl, 't60': dict(zip([str(f) for f in freqs], dec)), 'hf_first10ms': round(hf0, 3), 'hf_10_60ms': round(hf1, 3), 'env_t20_t40': [round(float(v), 3) for v in et], 'low_peak_track_hz': gm, 'dur_median': round(float(np.median([len(x) / SR for x in xs])), 3)}
        print(tonic, s, len(xs), 'early', pe[:6], 'env', res[s][tonic]['env_t20_t40'], flush=True)
json.dump(res, open(out_path, 'w'), indent=1)
