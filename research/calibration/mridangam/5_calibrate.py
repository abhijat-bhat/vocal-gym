"""Iteratively calibrate each stroke's noise bands so the synthesized stroke's 1/3-octave band energies,
early (0-60 ms) and late (60-250 ms), match the median of the real strokes. The renderer here mirrors
web/shared/mridangam.js (sines with glide, 1/3-octave noise through two cascaded band-pass biquads).
Usage: python -I 5_calibrate.py <dataset root> <bands.json> <out.json> [iterations]"""
import sys, os, glob, json
import numpy as np
import soundfile as sf
from scipy.signal import lfilter

root, inp, out = sys.argv[1], sys.argv[2], sys.argv[3]
IT = int(sys.argv[4]) if len(sys.argv) > 4 else 10
SA, SR, DUR = 261.63, 44100, 0.6
CENTRES = 63 * 2 ** (np.arange(0, 24) / 3)
Q3 = 1 / (2 ** (1 / 6) - 2 ** (-1 / 6))
t = np.arange(int(DUR * SR)) / SR

def load(f):
    x, sr = sf.read(f, always_2d=True); x = x.mean(axis=1)
    a = np.abs(x); i = max(0, int(np.argmax(a > 0.1 * a.max())) - int(0.002 * SR)); x = x[i:i + len(t)]
    return np.pad(x / (np.abs(x).max() + 1e-12), (0, len(t) - len(x)))

def sines(parts):
    y = np.zeros_like(t)
    for ratio, amp, t60, frm in parts:
        glide = 1 + (frm - 1) * np.exp(-t / 0.04) if frm != 1 else 1
        y += amp * np.exp(-6.9078 / t60 * t) * np.sin(np.cumsum(2 * np.pi * ratio * SA * glide / SR))
    return y

rng = np.random.default_rng(7)
NOISE = {}
def band_noise(fc):
    if fc not in NOISE:
        w = 2 * np.pi * fc / SR; al = np.sin(w) / (2 * Q3); a0 = 1 + al
        b, a = [al / a0, 0, -al / a0], [1, -2 * np.cos(w) / a0, (1 - al) / a0]
        v = lfilter(b, a, lfilter(b, a, rng.uniform(-1, 1, len(t)))); NOISE[fc] = v / np.sqrt(np.mean(v ** 2))
    return NOISE[fc]

def render(st):
    y = sines(st['partials'])
    for ratio, rms, t60 in st['bands']:
        y = y + rms * band_noise(round(ratio * SA, 3)) * np.exp(-6.9078 / t60 * t)
    return y

def narrow(x, freqs):
    """energy within ±3% (at least ±8 Hz) of each partial, in 0-100 ms and 100-350 ms"""
    out = []
    for a, b in [(0, 0.1), (0.1, 0.35)]:
        seg = x[int(a * SR):int(b * SR)] * np.hanning(int((b - a) * SR)); n = 32768; F = np.abs(np.fft.rfft(seg, n)) ** 2; f = np.fft.rfftfreq(n, 1 / SR)
        out.append([F[np.abs(f - fq) <= max(8, 0.03 * fq)].sum() for fq in freqs])
    return np.array(out)

def band_energy(x):
    """band energies in 0-60 ms and 60-250 ms (by FFT of each window)"""
    out = []
    for a, b in [(0, 0.06), (0.06, 0.25)]:
        seg = x[int(a * SR):int(b * SR)]; n = 16384; F = np.abs(np.fft.rfft(seg, n)) ** 2; f = np.fft.rfftfreq(n, 1 / SR)
        out.append([F[(f >= c / 2 ** (1 / 6)) & (f < c * 2 ** (1 / 6))].sum() for c in CENTRES])
    return np.array(out)

d = json.load(open(inp))
for s, st in d.items():
    files = sorted(glob.glob(os.path.join(root, 'C', '*__' + s + '-*.wav')))[:25]
    real = np.median([band_energy(load(f)) for f in files], axis=0)
    # one noise band per centre (bands the fit dropped start silent at a decay of 0.1 s)
    have = {round(b[0] * SA): b for b in st['bands']}
    st['bands'] = [list(have.get(round(c), [round(c / SA, 4), 0.0, 0.1])) for c in CENTRES]
    xs = [load(f) for f in files]
    p0 = [list(p) for p in st['partials']]
    for it in range(IT):
        # partials first: each one's amplitude and decay against the real energy right around it
        fq = [p[0] * SA for p in st['partials']]
        if it >= 5: fq = []
        rn = np.median([narrow(x, fq) for x in xs], axis=0) if fq else None; sn = narrow(render(st), fq) if fq else None
        for j, p in enumerate(st['partials'] if fq else []):
            r0 = np.sqrt(rn[0][j] / max(sn[0][j], 1e-16)); p[1] = float(np.clip(p[1] * np.clip(r0, 0.8, 1.25), 0.5 * p0[j][1], 2 * p0[j][1]))
            w, g = rn[1][j] / max(rn[0][j], 1e-16), sn[1][j] / max(sn[0][j], 1e-16)
            if w > 0 and g > 0: p[2] = float(np.clip(p[2] * (w / g) ** 0.2, 0.6 * p0[j][2], 1.5 * p0[j][2]))
        syn = band_energy(render(st)); sine = band_energy(sines(st['partials']))
        for j, bnd in enumerate(st['bands']):
            # what the noise must add, early and late, beyond the sinusoids
            need = np.maximum(real[:, j] - sine[:, j], real[:, j] * 0.02)
            have_n = np.maximum(syn[:, j] - sine[:, j], 1e-14)
            if bnd[1] <= 0: bnd[1] = 1e-4
            ratio = np.sqrt(need / have_n)
            bnd[1] = float(np.clip(bnd[1] * np.clip(ratio[0], 0.3, 3), 0, 2))
            # decay: the late/early balance of the noise
            want, got = need[1] / need[0], have_n[1] / have_n[0]
            if got > 0 and want > 0: bnd[2] = float(np.clip(bnd[2] * (want / got) ** 0.25, 0.015, 2.5))
    syn = band_energy(render(st))
    err = 10 * np.log10((syn + 1e-14) / (real + 1e-14)); ok = real > real.max(axis=1, keepdims=True) * 1e-4
    st['bands'] = [[round(b[0], 4), round(b[1], 5), round(b[2], 3)] for b in st['bands'] if b[1] > 1e-4]
    st['partials'] = [[round(p[0], 4), round(p[1], 4), round(p[2], 3), p[3]] for p in st['partials']]
    print(s.ljust(6), 'band error (dB) early %.1f late %.1f' % (np.sqrt(np.mean(err[0][ok[0]] ** 2)), np.sqrt(np.mean(err[1][ok[1]] ** 2))), flush=True)
json.dump(d, open(out, 'w'))
