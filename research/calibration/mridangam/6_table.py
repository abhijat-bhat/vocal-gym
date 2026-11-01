"""Bound each stroke's decays by its measured fade (noise bands 1.5x and partials 3x the time to -40 dB,
from 1_measure.py), cap any one noise band at 0.6, and print the STROKES table of web/shared/mridangam.js.
Usage: python -I 6_table.py <calibrated.json> <measure.json> > table.js.txt   (LF line endings)"""
import sys, json
import numpy as np

d, m = json.load(open(sys.argv[1])), json.load(open(sys.argv[2]))
fmt = lambda a: '[' + ','.join('%g' % x for x in a) + ']'
lines = []
for s, v in d.items():
    t40 = float(np.median([m[s][t]['env_t20_t40'][1] for t in ['B', 'C', 'C#', 'D', 'D#'] if t in m[s]]))
    bands = [[b[0], round(min(b[1], 0.6), 5), round(min(b[2], 1.5 * t40), 3)] for b in v['bands']]
    parts = [[p[0], p[1], round(min(p[2], 3 * t40), 3), p[3]] for p in v['partials']]
    lines.append('    %s: { gain: %g, partials: [%s],\n      bands: [%s] }' % (s, v['gain'], ','.join(fmt(p) for p in parts), ','.join(fmt(b) for b in bands)))
sys.stdout.reconfigure(newline='\n')
sys.stdout.write('  const STROKES = {\n' + ',\n'.join(lines) + '\n  };\n')
