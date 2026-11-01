"""Compare synthesized strokes with the real recordings at each tonic.
Metrics: log-spectral distance (dB RMS over 1/6-octave bands, 60 Hz-8 kHz, first 250 ms), compared with
the distance between two halves of the real strokes (the natural variation); and time to -20 dB.
Usage: python -I validate.py <dataset root> <synth dir with <tonic>/<stroke>.wav>"""
import sys, os, glob
import numpy as np
import soundfile as sf

root, syn = sys.argv[1], sys.argv[2]
SR = 44100
EDGES = 60 * 2 ** (np.arange(0, 7.1 * 6 + 1) / 6)

def load(f, norm=True):
    x, sr = sf.read(f, always_2d=True); x = x.mean(axis=1)
    a = np.abs(x); i = max(0, int(np.argmax(a > 0.1 * a.max())) - int(0.002 * SR)); x = x[i:]
    return x / (np.abs(x).max() + 1e-12)

def bands(x):
    n = 16384; seg = np.pad(x[:int(0.25 * SR)], (0, n))[:n]; F = np.abs(np.fft.rfft(seg * np.hanning(n))) ** 2; f = np.fft.rfftfreq(n, 1 / SR)
    b = np.array([F[(f >= EDGES[i]) & (f < EDGES[i + 1])].sum() for i in range(len(EDGES) - 1)])
    db = 10 * np.log10(b + 1e-12); return db - db.max()

def lsd(a, b):
    m = (a > -40) | (b > -40); return float(np.sqrt(np.mean((np.maximum(a, -40) - np.maximum(b, -40))[m] ** 2)))

def t20(x):
    n = int(0.01 * SR); r = np.array([np.sqrt(np.mean(x[i:i + n] ** 2)) for i in range(0, len(x) - n, n // 2)]); d = 20 * np.log10(r + 1e-9); p = int(np.argmax(d))
    return (next((i for i in range(p, len(d)) if d[i] < d[p] - 20), len(d)) - p) * 0.005

print('stroke tonic  synth-vs-real  real-vs-real   t20 synth/real')
tot = []
for tonic in ['B', 'C', 'C#', 'D', 'D#']:
    for s in ['thi', 'tha', 'ta', 'thom', 'num', 'dhin', 'dheem', 'tham', 'cha', 'bheem']:
        files = sorted(glob.glob(os.path.join(root, tonic, '*__' + s + '-*.wav')))[:40]
        sf_ = os.path.join(syn, tonic, s + '.wav')
        if len(files) < 4 or not os.path.exists(sf_): continue
        xs = [load(f) for f in files]; R = [bands(x) for x in xs]
        half = len(R) // 2; ra, rb = np.median(R[:half], axis=0), np.median(R[half:], axis=0); real = np.median(R, axis=0)
        y = load(sf_); sy = bands(y)
        d1, d0 = lsd(sy, real), lsd(ra, rb)
        tot.append((s, tonic, d1, d0))
        print(s.ljust(6), tonic.ljust(3), ('%5.1f dB' % d1).rjust(12), ('%5.1f dB' % d0).rjust(12), '   %.2f / %.2f s' % (t20(y), float(np.median([t20(x) for x in xs]))))
for s in sorted(set(t[0] for t in tot)):
    v = [t for t in tot if t[0] == s]; print('mean', s.ljust(6), 'synth %.1f dB, real halves %.1f dB' % (np.mean([t[2] for t in v]), np.mean([t[3] for t in v])))
