/* Vocal Gym engine · the kolam (v0.10)
   A pulli kolam is one closed line drawn around a grid of dots. Here the dots are the beats of a tala's cycle, so a line
   that closes is a cycle that lands on sam.

   The geometry is the mirror curve. Each dot sits in a cell of a grid, and the line runs diagonally between the midpoints
   of the cell's sides. Where two cells share a side, the line passes straight through and crosses itself; at the edge of
   the figure it bounces back, which is the turn around a dot. That gives one or more closed loops. Where two different
   loops cross, turning the crossing into a bounce joins them, and doing that until one remains gives a single line,
   however many dots there are: this is the rule a kolam-maker follows by hand.

     dotRows(n)            → the widths of the rows of a symmetric figure of n dots, roundest first
     kolam(n, { seed })    → { n, width, height, dots, d, length, closed, beats }
       dots    [{ x, y, beat }], beat being the order in which the line reaches each dot, so beat 0 is sam
       d       the line as an SVG path, in the figure's own units
       beats   for each beat, how far along the line it falls, 0 to 1; the line is back at its start after the last
     lineAt(k, beat)       → how far along the line a position in the cycle falls (beat may be fractional)

   Deterministic: the same n and seed give the same figure. No browser or Node APIs. */
import { rng } from './random.js';

const MAX_DOTS = 64;

/* the widths of the rows, symmetric top to bottom and all of one parity so that centred rows stay on one grid */
const rowsMemo = new Map();
export function dotRows(n) {
  if (!Number.isInteger(n) || n < 1 || n > MAX_DOTS) throw new RangeError('A kolam has 1 to ' + MAX_DOTS + ' dots.');
  if (rowsMemo.has(n)) return rowsMemo.get(n);
  let best = null, bestScore = Infinity;
  const consider = half => {
    const middle = half.middle ? [half.middle] : [], rows = half.side.slice().reverse().concat(middle, half.side);
    const widest = Math.max(...rows), squareness = Math.abs(rows.length - widest);
    // a figure close to square, widening towards its middle like a drawn kolam, with no needless flat runs
    const flat = rows.slice(1).filter((w, i) => w === rows[i]).length;
    const jumps = rows.slice(1).reduce((s, w, i) => s + Math.max(0, Math.abs(w - rows[i]) - 2), 0);
    const score = squareness * 2 + flat * .5 + jumps + (rows.length > 1 && widest === rows[0] && flat ? .25 : 0);
    if (score < bestScore - 1e-9) { bestScore = score; best = rows; }
  };
  // side: the rows going outwards from the middle, each no wider than the last
  const walk = (left, limit, side, middle) => {
    if (left === 0) { consider({ middle, side }); return; }
    for (let w = Math.min(limit, left); w >= 1; w--) {
      if ((w - limit) % 2 !== 0) continue;
      walk(left - w, w, side.concat(w), middle);
    }
  };
  // an odd count must have a middle row; an even one may have one, or two equal rows meeting at the middle
  for (let m = n; m >= 1; m--) {
    if ((n - m) % 2 !== 0) continue;
    walk((n - m) / 2, m, [], m);
  }
  if (n % 2 === 0) for (let w = n / 2; w >= 1; w--) walk(n / 2 - w, w, [w], 0);
  rowsMemo.set(n, best);
  return best;
}

const sideKey = (x, y) => x + ',' + y;
const stateKey = (x, y, dx, dy) => x + ',' + y + ',' + dx + ',' + dy;

/* the figure's cells, and the walk of the line through them. A point is the midpoint of a side, in half-cell units: on a
   vertical side x is even and y odd, on a horizontal side the reverse. */
function figure(rows) {
  const widest = Math.max(...rows), cells = new Set(), centres = [];
  rows.forEach((w, r) => {
    const from = (widest - w) / 2;
    for (let c = 0; c < w; c++) { const x = 2 * (from + c) + 1, y = 2 * r + 1; cells.add(sideKey(x, y)); centres.push([x, y]); }
  });
  const sides = new Map();   // every side's midpoint → is it shared by two cells?
  centres.forEach(([x, y]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => {
    const px = x + a, py = y + b;
    const shared = cells.has(sideKey(x + 2 * a, y + 2 * b));
    sides.set(sideKey(px, py), shared);
  }));
  return { widest, cells, centres, sides, height: rows.length };
}
/* where the line goes on from a point, arriving with direction (dx, dy). walls: shared sides turned into bounces. */
function onward(f, walls, x, y, dx, dy) {
  const k = sideKey(x, y), through = f.sides.get(k) && !walls.has(k);
  if (through) return [dx, dy];
  return x % 2 === 0 ? [-dx, dy] : [dx, -dy];
}
const startsOf = (f, x, y) => {
  const out = [];
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dx, dy]) => {
    const cell = x % 2 === 0 ? sideKey(x + dx, y) : sideKey(x, y + dy);
    if (f.cells.has(cell)) out.push([dx, dy]);
  });
  return out;
};
/* the closed loops of the line, each as its points and directions; which loop passes through each point */
function trace(f, walls) {
  const seen = new Map(), loops = [];
  f.sides.forEach((_, k) => {
    const [x, y] = k.split(',').map(Number);
    startsOf(f, x, y).forEach(([dx, dy]) => {
      if (seen.has(stateKey(x, y, dx, dy))) return;
      const id = loops.length, loop = [];
      let px = x, py = y, ax = dx, ay = dy;
      do {
        seen.set(stateKey(px, py, ax, ay), id);
        loop.push({ x: px, y: py, dx: ax, dy: ay });
        const qx = px + ax, qy = py + ay;
        seen.set(stateKey(qx, qy, -ax, -ay), id);   // the same strand, walked the other way
        const [bx, by] = onward(f, walls, qx, qy, ax, ay);
        px = qx; py = qy; ax = bx; ay = by;
      } while (!(px === x && py === y && ax === dx && ay === dy));
      loops.push(loop);
    });
  });
  return { loops, seen };
}
/* join the loops into one */
function singleLine(f, seed) {
  const walls = new Set(), rand = rng(seed);
  const mirror = k => { const [x, y] = k.split(',').map(Number), W = f.widest * 2, H = f.height * 2; return [[W - x, y], [x, H - y], [W - x, H - y]].map(([a, b]) => sideKey(a, b)); };
  const shared = Array.from(f.sides.keys()).filter(k => f.sides.get(k));
  // towards the middle first, shuffled within that by the seed: joints near the centre leave the outer lobes whole
  const cx = f.widest, cy = f.height;
  const order = shared.map(k => { const [x, y] = k.split(',').map(Number); return { k, d: Math.abs(x - cx) + Math.abs(y - cy) + rand() * 1.5 }; }).sort((a, b) => a.d - b.d).map(o => o.k);
  let t = trace(f, walls);
  while (t.loops.length > 1) {
    let joined = false;
    for (const k of order) {
      if (walls.has(k)) continue;
      const [x, y] = k.split(',').map(Number);
      const ids = new Set(startsOf(f, x, y).map(([dx, dy]) => t.seen.get(stateKey(x, y, dx, dy))));
      if (ids.size < 2) continue;
      // with its mirror images if that still reduces the loops, so the figure keeps its symmetry
      const group = [k].concat(mirror(k).filter(m => f.sides.get(m) && !walls.has(m)));
      group.forEach(g => walls.add(g));
      let next = trace(f, walls);
      if (next.loops.length >= t.loops.length) {
        group.forEach(g => walls.delete(g));
        walls.add(k);
        next = trace(f, walls);
      }
      if (next.loops.length < t.loops.length) { t = next; joined = true; break; }
      walls.delete(k);
    }
    if (!joined) throw new Error('The loops of a kolam could not be joined.');
  }
  return t.loops[0];
}
const round = v => Math.round(v * 1000) / 1000;

const memo = new Map();
export function kolam(n, opts) {
  const seed = (opts && opts.seed) || 1, key = n + '|' + seed;
  if (memo.has(key)) return memo.get(key);
  const f = figure(dotRows(n));
  let loop = singleLine(f, seed);
  // the line starts on the top row, at the left of its first dot, so sam sits where a hand would begin
  const first = loop.reduce((best, p, i) => (p.y < loop[best].y || (p.y === loop[best].y && p.x < loop[best].x) ? i : best), 0);
  loop = loop.slice(first).concat(loop.slice(0, first));
  const pts = loop.map(p => [p.x, p.y]), N = pts.length;
  // each point is the control of a curve between the middles of its two segments; a crossing comes out straight
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = 'M' + mid(pts[N - 1], pts[0]).map(round).join(' '), total = 0;
  const along = [];
  for (let i = 0; i < N; i++) {
    const a = mid(pts[(i + N - 1) % N], pts[i]), c = pts[i], b = mid(pts[i], pts[(i + 1) % N]);
    d += 'Q' + c.join(' ') + ' ' + b.map(round).join(' ');
    along.push(total);
    let len = 0, last = a;
    for (let s = 1; s <= 8; s++) {
      const u = s / 8, v = 1 - u, p = [v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]];
      len += Math.hypot(p[0] - last[0], p[1] - last[1]);
      last = p;
    }
    total += len;
  }
  // the beats fall where the line first reaches each dot
  const order = [], reached = new Map();
  const cellOf = (p, q) => (p[0] % 2 === 0 ? sideKey(p[0] + (q[0] - p[0]), p[1]) : sideKey(p[0], p[1] + (q[1] - p[1])));
  for (let i = 0; i < N; i++) {
    const cell = cellOf(pts[i], pts[(i + 1) % N]);
    if (!reached.has(cell)) { reached.set(cell, along[i] / total); order.push(cell); }
  }
  const dots = f.centres.map(([x, y]) => ({ x, y, beat: order.indexOf(sideKey(x, y)) })).sort((a, b) => a.beat - b.beat);
  const out = { n, width: f.widest * 2, height: f.height * 2, dots, d, length: round(total), closed: true, beats: dots.map(p => reached.get(sideKey(p.x, p.y))) };
  memo.set(key, out);
  return out;
}
/* how far along the line a position in the cycle falls: at beat i the line is at beats[i], and it closes after the last */
export function lineAt(k, beat) {
  const n = k.n, b = ((beat % n) + n) % n, i = Math.floor(b), f = b - i, from = k.beats[i], to = i + 1 < n ? k.beats[i + 1] : 1;
  return from + (to - from) * f;
}
