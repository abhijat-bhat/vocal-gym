"""Turn fit-<tonic>.json into the synthesizer's stroke table: partials merged (within 2.5%), weak ones
dropped, every frequency a ratio to Sa, and each stroke's loudness relative to the loudest (from the raw,
un-normalised recordings). Prints a JS object literal.
Usage: python -I 3_export.py <dataset root> <fit.json> <tonic> > strokes.json"""
import sys, os, glob, json
import numpy as np
import soundfile as sf

root, fit, tonic = sys.argv[1], sys.argv[2], sys.argv[3]
d = json.load(open(fit)); SA = d['sa']
out = {}
for s, p in d['strokes'].items():
    ps = []
    for q in sorted(p['partials'], key=lambda q: q.get('hz', 0) if q['head'] == 'left' else q['ratio'] * SA):
        f = q['hz'] if q['head'] == 'left' else q['ratio'] * SA
        last = ps[-1] if ps else None
        if last and abs(f / last['f'] - 1) < 0.025 and last['head'] == q['head']:
            a = last['amp'] + q['amp']; last['f'] = (last['f'] * last['amp'] + f * q['amp']) / a
            last['t60'] = max(last['t60'], q['t60']); last['amp'] = a
            if 'from' in q: last['from'] = max(last.get('from', 1), q['from'])
        else:
            ps.append({'f': f, 'amp': q['amp'], 't60': q['t60'], 'head': q['head'], **({'from': q['from']} if 'from' in q else {})})
    top = max(x['amp'] for x in ps)
    ps = [x for x in ps if x["amp"] >= 0.03 * top]
    # loudness of the raw recordings (median peak), relative later
    files = sorted(glob.glob(os.path.join(root, tonic, '*__' + s + '-*.wav')))[:25]
    peak = float(np.median([np.abs(sf.read(f, always_2d=True)[0].mean(axis=1)).max() for f in files]))
    out[s] = {'peak': peak, 'partials': [[round(x['f'] / SA, 4), round(x['amp'], 4), round(x['t60'], 3), round(x.get('from', 1), 3) if x['head'] == 'left' else 1] for x in ps], 'attack': p['attack']}
mx = max(v['peak'] for v in out.values())
for s, v in out.items():
    v['gain'] = round(v.pop('peak') / mx, 3)
# the thoppi's bass partials (below 0.7 Sa) in thom, dheem and tham glide down from 1.22x in the first
# 40 ms: measured 113 -> 93 Hz over the first 100 ms in 1_measure.py's low-peak tracks
for s, v in out.items():
    v['partials'] = [p[:3] + [1.22 if s in ('thom', 'dheem', 'tham') and p[0] < 0.7 else 1] for p in v['partials']]
print(json.dumps(out))
