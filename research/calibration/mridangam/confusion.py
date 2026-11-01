"""Which real stroke is each synthesized stroke nearest to? Features: 1/6-octave spectrum of the first
250 ms (dB re max, floored at -40) plus the time to -20 and -40 dB (scaled). Tonics B..D#.
Usage: python -I confusion.py <dataset root> <synth dir> [label]"""
import sys, os, glob
import numpy as np
exec(open(os.path.join(os.path.dirname(__file__), 'validate.py')).read().split("print('stroke tonic")[0].replace('root, syn = sys.argv[1], sys.argv[2]', 'root, syn = sys.argv[1], sys.argv[2]'))
STK = ['thi', 'tha', 'ta', 'thom', 'num', 'dhin', 'dheem', 'tham', 'cha']

def t40(x):
    n = int(0.01 * SR); r = np.array([np.sqrt(np.mean(x[i:i + n] ** 2)) for i in range(0, len(x) - n, n // 2)]); d = 20 * np.log10(r + 1e-9); p = int(np.argmax(d))
    return (next((i for i in range(p, len(d)) if d[i] < d[p] - 40), len(d)) - p) * 0.005

def feat(x): return np.concatenate([np.maximum(bands(x), -40), [t20(x) * 60, t40(x) * 30]])
hits, total, ranks = 0, 0, []
for tonic in ['B', 'C', 'C#', 'D', 'D#']:
    real = {s: np.median([feat(load(f)) for f in sorted(glob.glob(os.path.join(root, tonic, '*__' + s + '-*.wav')))[:30]], axis=0) for s in STK}
    row = []
    for s in STK:
        p = os.path.join(syn, tonic, s + '.wav')
        if not os.path.exists(p): continue
        fs_ = feat(load(p)); dist = {r: float(np.sqrt(np.mean((fs_ - real[r]) ** 2))) for r in STK}
        order = sorted(dist, key=dist.get); rank = order.index(s) + 1; ranks.append(rank); hits += rank == 1; total += 1
        row.append('%s>%s%s' % (s, order[0], '' if order[0] == s else '(%d)' % rank))
    print(tonic.ljust(3), ' '.join(row))
print('%s: nearest real stroke is the right one for %d of %d; mean rank %.2f of %d' % (sys.argv[3] if len(sys.argv) > 3 else 'synth', hits, total, np.mean(ranks), len(STK)))
