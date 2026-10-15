/* Vocal Gym engine · kalpana devices
   Devices are short melodic cells, written as steps through the raga's own swaras.
   Conventional devices are the ones listeners recognise (runs, janta, dattu, sequences,
   a run into a held nyasa swara, the mora ending). Unconventional devices are still legal
   in the raga but less expected (leaps, arpeggios, zig-zags, syncopated holds). */

const CELL_DEFS = [
  // id, name, kind, F0 (familiarity prior), N0 (novelty prior), steps [[degree step, duration], ...]
  ['step', 'step', 'step', 0.2, -0.2, [[1, 1]]],
  ['skip', 'skip', 'step', 0.0, 0.2, [[2, 1]]],
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
  ['skipjanta', 'displaced janta', 'nov', -0.2, 0.8, [[2, 1], [0, 1], [-1, 1], [0, 1]]]
];
const CELLS = (function () {
  const out = [];
  CELL_DEFS.forEach(b => [1, -1].forEach(dir => {
    const shape = b[5].map(([d, u]) => [d * dir, u]);
    out.push({ id: b[0] + (dir > 0 ? '+' : '-'), base: b[0], name: b[1], kind: b[2], F0: b[3], N0: b[4], shape, dir, len: shape.reduce((s, x) => s + x[1], 0) });
  }));
  return out;
})();

export { CELL_DEFS, CELLS };
