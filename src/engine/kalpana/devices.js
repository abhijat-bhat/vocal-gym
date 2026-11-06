/* Vocal Gym engine · kalpana devices
   Devices are short melodic cells, written as steps through the raga's own swaras.
   Conventional devices are the ones listeners recognise (runs, janta, dattu, sequences,
   a run into a held nyasa swara, the mora ending). Unconventional devices are still legal
   in the raga but less expected (leaps, arpeggios, zig-zags, syncopated holds). */

const CELL_DEFS = [
  // id, name, kind, F0 (familiarity prior), N0 (novelty prior), steps [[degree step, duration], ...]
  ['step', 'step', 'step', 0.2, -0.2, [[1, 1]]],
  ['skip', 'skip', 'step', -0.3, 0.2, [[2, 1]]],   // a lone third: a filler, so less familiar than a figure that resolves it
  ['hold', 'held step', 'step', 0.1, -0.1, [[1, 2]]],
  ['run3', 'run', 'conv', 1.0, -0.4, [[1, 1], [1, 1], [1, 1]]],
  ['run4', 'run', 'conv', 1.1, -0.5, [[1, 1], [1, 1], [1, 1], [1, 1]]],
  ['run5', 'run', 'conv', 0.9, -0.5, [[1, 1], [1, 1], [1, 1], [1, 1], [1, 1]]],
  ['janta', 'janta', 'conv', 0.9, -0.2, [[1, 1], [0, 1], [1, 1], [0, 1]]],
  ['janta3', 'janta', 'conv', 0.8, -0.3, [[1, 1], [0, 1], [1, 1], [0, 1], [1, 1], [0, 1]]],
  ['dattu', 'dattu', 'conv', 0.7, 0.1, [[2, 1], [-1, 1], [2, 1], [-1, 1]]],
  ['turn', 'turn', 'conv', 0.6, 0.0, [[1, 1], [1, 1], [-1, 1]]],
  ['seq3', 'sequence of threes', 'conv', 1.1, -0.3, [[1, 1], [1, 1], [1, 1], [-1, 1], [1, 1], [1, 1]]],
  ['seq3x3', 'sequence of threes', 'conv', 1.0, -0.4, [[1, 1], [1, 1], [1, 1], [-1, 1], [1, 1], [1, 1], [-1, 1], [1, 1], [1, 1]]],
  ['seq4', 'sequence of fours', 'conv', 1.0, -0.4, [[1, 1], [1, 1], [1, 1], [1, 1], [-2, 1], [1, 1], [1, 1], [1, 1]]],
  ['cad', 'run into a held swara', 'conv', 0.9, -0.3, [[1, 1], [1, 1], [1, 2]]],
  ['leap3', 'leap', 'nov', -0.6, 0.8, [[3, 1]]],
  ['leap4', 'wide leap', 'nov', -1.0, 1.0, [[4, 1]]],
  ['arp', 'arpeggio', 'nov', -0.4, 1.0, [[2, 1], [2, 1], [2, 1]]],
  ['leapfill', 'leap and fall back', 'nov', -0.3, 0.9, [[3, 1], [-1, 1], [-1, 1]]],
  ['zigzag', 'zig-zag', 'nov', -0.8, 1.1, [[2, 1], [-3, 1], [2, 1]]],
  ['synco', 'syncopated hold', 'nov', -0.3, 0.7, [[1, 2], [1, 1]]],
  ['skipjanta', 'displaced janta', 'nov', -0.2, 0.8, [[2, 1], [0, 1], [-1, 1], [0, 1]]],
  // phrase openings (v0.4, docs/research/kalpana-structure.md §3.2): after the held swara that ends a
  // phrase, the next one restarts higher and runs down toward its focus (Field 2018, Ex. 2.1, 3, 8.2,
  // 18: (RGM)[P,P,P,,](RGM); every korvai unit descends). Only a phrase may begin with one: the leap is
  // the restart, and inside a phrase it would be a jump at a join. The mirror images rise from below.
  ['restart3', 'restart and fall', 'conv', 0.9, -0.3, [[3, 1], [-1, 1], [-1, 1]], 'start'],
  ['restart4', 'restart and fall', 'conv', 0.9, -0.3, [[4, 1], [-1, 1], [-1, 1], [-1, 1]], 'start'],
  ['restart2', 'restart and fall', 'conv', 0.7, -0.2, [[2, 1], [-1, 1], [-1, 1], [-1, 1]], 'start']
];
const CELLS = (function () {
  const out = [];
  CELL_DEFS.forEach(b => [1, -1].forEach(dir => {
    const shape = b[5].map(([d, u]) => [d * dir, u]);
    out.push({ id: b[0] + (dir > 0 ? '+' : '-'), base: b[0], name: b[1], kind: b[2], F0: b[3], N0: b[4], shape, dir, len: shape.reduce((s, x) => s + x[1], 0), start: b[6] === 'start' });
  }));
  return out;
})();

/* Anchored phrase devices: absolute pitches taken from the raga profile (plan 2.1).
     whole      the phrase as written                                  phrase           F0 = 2 · weight · type · confidence
     octave     ±12, only when the octave was inferred                 phrase           0.8 × whole
     fragment   every 3–5 swara window of a phrase of 5 or more        phrase-fragment  0.6 × whole
     sequence   whole or fragment shifted one place along the scale    phrase-variant   0.3 × whole, N0 +0.6
     inversion  a fragment's contour mirrored around its first swara   phrase-variant   0, N0 +0.9 (T >= 1 only)
   Variants are the out-of-the-box phrases: rooted in the raga's idiom but not attested.
   notes: the raga's union scale (pitches, ascending); valid: the raga's direction rule. */
const TYPE_FACTOR = { signature: 1.0, ending: 0.9, janta: 0.8, dattu: 0.8, connective: 0.6 };
const CONF_FACTOR = { high: 1.0, medium: 0.8, low: 0.5, none: 0.5 };
const KIND_WORD = { phrase: 'phrase', 'phrase-fragment': 'fragment', 'phrase-variant': 'variant' };

function phraseDevices(profile, notes, valid, opts) {
  const o = opts || {}, out = [], seen = new Map(), ix = new Map(notes.map((p, k) => [p, k]));
  const attested = new Set();
  const key = (ps, ds) => ps.join(',') + '/' + ds.join(',');
  const legal = ps => { for (let k = 1; k < ps.length; k++) if (!valid(ps[k - 1], ps[k])) return false; return true; };
  function add(d) {
    const k = key(d.pitches, d.durs), old = seen.get(k);
    if (old) { if (d.F0 > old.F0) Object.assign(old, d); return; }
    d.len = d.durs.reduce((s, x) => s + x, 0);
    seen.set(k, d); out.push(d);
  }
  const base = (ph, kind, variant, pitches, durs, F0, N0, extra) => Object.assign({
    id: ph.id + ':' + variant + ':' + pitches.join(','), base: 'ph:' + ph.id, kind, variant, name: ph.type + ' ' + KIND_WORD[kind] + (variant === 'octave+' ? ', octave up' : variant === 'octave-' ? ', octave down' : variant === 'sequence' ? ' (sequence)' : variant === 'inversion' ? ' (inversion)' : ''),
    phraseId: ph.id, source: ph.source, type: ph.type, pitches, durs, F0, N0, dir: 0, attested: kind !== 'phrase-variant'
  }, extra || {});
  const conf = CONF_FACTOR[profile.confidence] || 0.5;
  const shift = (ps, d) => { const out2 = []; for (const p of ps) { const k = ix.get(p); if (k == null || k + d < 0 || k + d >= notes.length) return null; out2.push(notes[k + d]); } return out2; };
  const mirror = ps => { const k0 = ix.get(ps[0]), out2 = []; for (const p of ps) { const k = 2 * k0 - ix.get(p); if (k < 0 || k >= notes.length) return null; out2.push(notes[k]); } return out2; };
  const pending = [];
  (profile.phrases || []).forEach(ph => {
    if (!ph.pitches.every(p => ix.has(p))) return;
    const whole = 2.0 * ph.weight * (TYPE_FACTOR[ph.type] || 0.6) * conf;
    const n = ph.pitches.length;
    add(base(ph, 'phrase', 'whole', ph.pitches, ph.durs, whole, -0.5));
    attested.add(ph.pitches.join(','));
    if (!ph.octaveCertain) [12, -12].forEach(d => {
      const ps = ph.pitches.map(p => p + d);
      if (ps.every(p => ix.has(p))) { add(base(ph, 'phrase', d > 0 ? 'octave+' : 'octave-', ps, ph.durs, 0.8 * whole, -0.5)); attested.add(ps.join(',')); }
    });
    const frags = [];
    if (n >= 5) for (let w = 3; w <= 5; w++) for (let s = 0; s + w <= n; s++) {
      if (w === n) continue;
      const ps = ph.pitches.slice(s, s + w), ds = ph.durs.slice(s, s + w);
      ds[ds.length - 1] = 1;                       // a fragment ends on its swara, not on the phrase's karvai
      add(base(ph, 'phrase-fragment', 'fragment@' + s, ps, ds, 0.6 * whole, -0.2));
      attested.add(ps.join(','));
      frags.push([ps, ds]);
    }
    pending.push({ ph, whole, frags });
  });
  // variants: built after every attested shape is known, so none of them repeats one
  pending.forEach(({ ph, whole, frags }) => {
    [[ph.pitches, ph.durs]].concat(frags).forEach(([ps, ds]) => [1, -1].forEach(d => {
      const sp = shift(ps, d);
      if (sp && legal(sp) && !attested.has(sp.join(','))) add(base(ph, 'phrase-variant', 'sequence', sp, ds, 0.3 * whole, 0.6));
    }));
    if (o.inversions) frags.forEach(([ps, ds]) => {
      const mp = mirror(ps);
      if (mp && legal(mp) && !attested.has(mp.join(',')) && mp.join(',') !== ps.join(',')) add(base(ph, 'phrase-variant', 'inversion', mp, ds, 0, 0.9));
    });
  });
  // documented direction-rule exceptions: whole phrases only, checked at entry and exit only (plan 2.6)
  if (o.exceptions) (profile.exceptions || []).forEach(ph => {
    if (o.exceptions === 'documented' && ph.weight < 0.4) return;
    const first = ph.pitches[0], last = ph.pitches[ph.pitches.length - 1];
    if (!ix.has(first) || !ix.has(last) || !ph.pitches.every(p => p >= notes[0] && p <= notes[notes.length - 1])) return;
    const whole = 2.0 * ph.weight * (TYPE_FACTOR[ph.type] || 0.6) * conf;
    add(base(ph, 'phrase', 'whole', ph.pitches, ph.durs, whole, -0.5, { exception: true, anya: ph.anya }));
  });
  return out;
}

export { CELL_DEFS, CELLS, TYPE_FACTOR, CONF_FACTOR, phraseDevices };
