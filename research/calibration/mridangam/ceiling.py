"""The ceiling of the nearest-stroke test: single real strokes (not in the median) classified against the
medians of the other real strokes, same features as confusion.py.
Usage: python -I ceiling.py <dataset root>"""
import sys, os, glob
import numpy as np
sys.argv = sys.argv[:2] + ['', '']; exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'confusion.py')).read().split('hits, total, ranks')[0])
hits = total = 0
for tonic in ['B', 'C', 'C#', 'D', 'D#']:
    F = {s: [feat(load(f)) for f in sorted(glob.glob(os.path.join(root, tonic, '*__' + s + '-*.wav')))[:35]] for s in STK}
    real = {s: np.median(F[s][5:], axis=0) for s in STK}
    for s in STK:
        for x in F[s][:5]:   # held out from the medians
            dist = {r: float(np.sqrt(np.mean((x - real[r]) ** 2))) for r in STK}
            hits += min(dist, key=dist.get) == s; total += 1
print('single real strokes: nearest median is their own stroke for %d of %d (%.0f%%)' % (hits, total, 100 * hits / total))
