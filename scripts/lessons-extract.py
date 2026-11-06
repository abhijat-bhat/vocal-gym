#!/usr/bin/env python3
"""Vocal Gym · read the Gurukulam geetham notes into data/lessons/ (v0.9.3). The app never needs the PDF.

  python scripts/lessons-extract.py <folder with the PDF> [--lib <folder with pymupdf and numpy>]

Needs pymupdf and numpy; the rest of the project needs neither.
  geetham_notes.pdf                    no text at all: every letter is a vector shape. The pages are a fixed grid, so
                                       rows are found by geometry, the glyphs of swara rows and sahitya rows are grouped
                                       by how they look, and each group has been labelled once by eye (SWARA, SAHITYA
                                       below). Bars, dots and small commas are told apart by their size → gurukulam.raw.json
The clustering is deterministic for the same file, so the labels stay valid. The output is committed, and
scripts/lessons.js reads it."""
import sys, os, json, re, pickle, collections, warnings
warnings.filterwarnings('ignore')
args = sys.argv[1:]
if '--lib' in args:
    i = args.index('--lib'); sys.path.insert(0, args[i + 1]); del args[i:i + 2]
import fitz, numpy as np

SRC = args[0]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'lessons')
os.makedirs(OUT, exist_ok=True)
def save(name, data):
    with open(os.path.join(OUT, name), 'w', encoding='utf8', newline='\n') as f: json.dump(data, f, ensure_ascii=False, separators=(',', ':')); f.write('\n')
    print('wrote', name)


# ------------------------------------------------------------------ Gurukulam: vector glyphs
SWARA = {0:'P',1:'R',2:'S',3:'D',4:'G',5:'M',6:'N',7:'M',8:'S',9:',',10:'N',11:',',12:',',13:',',14:',',15:'n',16:'a',17:'p'}
SAHITYA = dict(enumerate("aahariAarvkdyltmuAEnpnmnbsjagtSMNOiucudUskEsgosLTDMllencessRwecVP"))
def gurukulam():
    d = fitz.open(os.path.join(SRC, 'geetham_notes.pdf')); pages = []; SC = 8.0; GW, GH = 12, 16
    def bitmap(a, r):
        x0, y0, x1, y1 = int(r[0] * SC), int(r[1] * SC), max(int(r[2] * SC), int(r[0] * SC) + 1), max(int(r[3] * SC), int(r[1] * SC) + 1)
        c = 255 - a[y0:y1, x0:x1].astype(np.float32)
        ys = np.linspace(0, c.shape[0], GH + 1).astype(int); xs = np.linspace(0, c.shape[1], GW + 1).astype(int)
        v = np.zeros((GH, GW), dtype=np.float32)
        for b in range(GH):
            for k in range(GW):
                s = c[ys[b]:max(ys[b + 1], ys[b] + 1), xs[k]:max(xs[k + 1], xs[k] + 1)]
                v[b, k] = s.mean() if s.size else 0
        return v.ravel() / 255
    for n in range(len(d)):
        rows, small, bars = [], [], []
        gl = []
        for x in d[n].get_drawings():
            r = tuple(x['rect'])
            if x['type'] == 'fs' and x['rect'].width < 1 and x['rect'].height > 6: bars.append(r)
            if x['type'] != 'f': continue
            f = x.get('fill')
            if f is None or f[0] > .2 or not 60 < r[1] < 700: continue
            gl.append(r)
        gl.sort(key=lambda r: r[3])
        for r in gl:
            if r[3] - r[1] < 2.2: small.append(r); continue
            for row in rows:
                if abs(row['base'] - r[3]) < 3.2:
                    row['g'].append(r)
                    if r[3] - r[1] > 4: row['base'] = max(row['base'], r[3])
                    break
            else: rows.append(dict(base=r[3], g=[r]))
        rows.sort(key=lambda x: x['base'])
        pages.append(dict(rows=rows, small=small, bars=bars))
    def toks(row):
        t = []
        for r in sorted(row['g']):
            if t and r[0] - t[-1][-1][2] < 2.6: t[-1].append(r)
            else: t.append([r])
        return t
    items = []; prev_ended_swara = False
    for n, p in enumerate(pages):
        if n < 6: continue
        is_s = []
        for row in p['rows']:
            t = toks(row); single = sum(1 for x in t if len(x) == 1)
            tall = [x[0] for x in t if len(x) == 1 and 5.4 <= x[0][3] - x[0][1] <= 7.4 and x[0][2] - x[0][0] >= 3.2]
            is_s.append(len(t) >= 6 and single >= .85 * len(t) and len(tall) >= .55 * len(t))
        kind = []
        for k, row in enumerate(p['rows']):
            if is_s[k]: kind.append('S')
            elif k and is_s[k - 1] and row['base'] - p['rows'][k - 1]['base'] < 34: kind.append('T')
            else: kind.append('.')
        p['kind'] = kind
        if 'S' not in kind: continue
        pix = d[n].get_pixmap(matrix=fitz.Matrix(SC, SC), colorspace=fitz.csGRAY)
        a = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w)
        p['image'] = None
        for k, row in enumerate(p['rows']):
            if kind[k] != '.':
                for r in row['g']: items.append((kind[k], n, k, r, bitmap(a, r)))
    # group by look, within each kind
    TH = dict(S=.11, T=.10); labels = {}; leaders_of = {}
    for kd in 'ST':
        idx = [i for i, it in enumerate(items) if it[0] == kd]; leaders = []; lab = {}
        for i in idx:
            it = items[i]; r = it[3]; w, h = r[2] - r[0], r[3] - r[1]; best, bd = None, 1e9
            for l in leaders:
                rr = items[l][3]
                if abs(w - (rr[2] - rr[0])) > .9 or abs(h - (rr[3] - rr[1])) > .9: continue
                e = np.abs(it[4] - items[l][4]).mean()
                if e < bd: best, bd = l, e
            if bd < TH[kd]: lab[i] = best
            else: leaders.append(i); lab[i] = i
        order = {l: k for k, (l, _) in enumerate(collections.Counter(lab.values()).most_common())}
        table = SWARA if kd == 'S' else SAHITYA
        for i, l in lab.items(): labels[i] = table[order[l]]
        leaders_of[kd] = [(l, table[order[l]]) for l in leaders]
    byrow = collections.defaultdict(list)
    for i, it in enumerate(items): byrow[(it[1], it[2])].append((it[3], labels[i]))
    # a sahitya row at the top of a page, under the last swara row of the page before
    def nearest(a, r):
        v = bitmap(a, r); w, h = r[2] - r[0], r[3] - r[1]; best, bd = '?', 1e9
        for l, c in leaders_of['T']:
            rr = items[l][3]
            if abs(w - (rr[2] - rr[0])) > 1.2 or abs(h - (rr[3] - rr[1])) > 1.2: continue
            e = np.abs(v - items[l][4]).mean()
            if e < bd: best, bd = c, e
        return best
    out = []
    for n, p in enumerate(pages):
        if n < 6 or 'kind' not in p: continue
        dots = [e for e in p['small'] if 1.5 <= e[2] - e[0] <= 2.2 and e[3] - e[1] <= 1.95]
        commas = [e for e in p['small'] if e[2] - e[0] < 1.5 and e[3] - e[1] > 1.2]
        dashes = [e for e in p['small'] if e[2] - e[0] > 2.2 and e[3] - e[1] < 1.0]
        last = out[-1] if out else None
        carried = False
        for k, row in enumerate(p['rows']):
            base = row['base']; kd = p['kind'][k]
            if kd == '.' and not carried and last and last['k'] == 'S' and last['p'] == n and 1 <= k <= 2 and base < 190 and row['base'] - p['rows'][0]['base'] > 8 and (k + 1 >= len(p['kind']) or p['kind'][k + 1] == 'S'):
                pix = d[n].get_pixmap(matrix=fitz.Matrix(SC, SC), colorspace=fitz.csGRAY)
                a = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w)
                gl = [(r, nearest(a, r)) for r in sorted(row['g'])]; kd = 'T'; carried = True
            elif kd == '.': continue
            else: gl = sorted(byrow[(n, k)], key=lambda t: t[0][0])
            if kd == 'S':
                cells = list(gl)
                for e in commas:
                    if base - 3.6 <= e[3] <= base + 3.6: cells.append((e, ','))
                for e in dashes:
                    if base - 5.5 <= e[3] <= base + .5: cells.append((e, ','))
                cells.sort(key=lambda t: t[0][0]); ts = []
                for r, c in cells:
                    o = 0
                    if c != ',':
                        for e in dots:
                            if r[0] - .7 <= (e[0] + e[2]) / 2 <= r[2] + .7:
                                if r[1] - 3.4 <= e[3] <= r[1] + .9: o = 1
                                elif r[3] - .6 <= e[1] <= r[3] + 3.6: o = -1
                    ts.append(dict(x=round(r[0], 1), c=c, o=o))
                b = sorted(set(round(x[0], 1) for x in p['bars'] if x[1] - 3 <= base <= x[3] + 3))
                out.append(dict(p=n + 1, k='S', toks=ts, bars=b))
            else:
                words = []
                for r, c in gl:
                    if words and r[0] - words[-1]['x1'] < 2.6: words[-1]['t'] += c; words[-1]['x1'] = r[2]
                    else: words.append(dict(x=round(r[0], 1), x1=r[2], t=c))
                out.append(dict(p=n + 1, k='T', words=[dict(x=w['x'], t=w['t']) for w in words]))
    save('gurukulam.raw.json', out)


gurukulam()
