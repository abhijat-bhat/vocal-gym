/* v0.10 the kolam: one closed line around one dot per beat, for every tala the app has */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kolam, dotRows, lineAt } from '../src/engine/kolam.js';

/* the points of the path's curves, from its text */
const points = d => {
  const out = [];
  for (const m of d.matchAll(/[MQ]([^MQ]+)/g)) { const v = m[1].trim().split(/\s+/).map(Number); out.push([v[v.length - 2], v[v.length - 1]]); }
  return out;
};

test('every count of dots makes a symmetric figure with the right number of dots', () => {
  for (let n = 1; n <= 64; n++) {
    const rows = dotRows(n);
    assert.equal(rows.reduce((a, b) => a + b, 0), n, n + ': ' + rows);
    assert.deepEqual(rows, rows.slice().reverse(), n + ': symmetric');
    assert.ok(rows.every(w => (w - rows[0]) % 2 === 0), n + ': one parity, so the rows stay on one grid');
  }
  assert.throws(() => dotRows(0), /1 to 64/);
  assert.throws(() => dotRows(65), /1 to 64/);
});

test('one closed line, around every dot, for every count', () => {
  for (let n = 1; n <= 64; n++) {
    for (const seed of [1, 7]) {
      const k = kolam(n, { seed }), pts = points(k.d);
      assert.equal(k.dots.length, n);
      assert.deepEqual(k.dots.map(p => p.beat), Array.from({ length: n }, (_, i) => i), n + ': each beat has its dot');
      // one subpath, which ends where it began
      assert.equal((k.d.match(/M/g) || []).length, 1);
      assert.deepEqual(pts[0], pts[pts.length - 1], n + ': closed');
      // the beats rise along the line, from the start
      assert.equal(k.beats[0], 0, n + ': sam is where the line begins');
      for (let i = 1; i < n; i++) assert.ok(k.beats[i] > k.beats[i - 1], n + ': beat ' + i + ' comes after the one before');
      assert.ok(k.beats[n - 1] < 1);
      // the line passes close by each dot
      for (const dot of k.dots) assert.ok(pts.some(p => Math.hypot(p[0] - dot.x, p[1] - dot.y) <= 1.01), n + ': dot ' + dot.beat);
    }
  }
});

test('the same inputs give the same figure; another seed may give another', () => {
  assert.deepEqual(kolam(14, { seed: 3 }), kolam(14, { seed: 3 }));
  const seen = new Set([1, 2, 3, 4, 5, 6, 7, 8].map(seed => kolam(16, { seed }).d));
  assert.ok(seen.size > 1, 'the seed varies the figure');
});

test('lineAt: the line reaches each dot on its beat, and closes on sam', () => {
  const k = kolam(8, { seed: 1 });
  k.beats.forEach((f, i) => assert.equal(lineAt(k, i), f));
  assert.ok(lineAt(k, 7.999) > .99);
  assert.equal(lineAt(k, 8), 0, 'the next cycle starts over');
  assert.equal(lineAt(k, 9.5), lineAt(k, 1.5));
  assert.ok(lineAt(k, 2.5) > k.beats[2] && lineAt(k, 2.5) < k.beats[3]);
});

test('the talas: all 35 and the chapus have a kolam', () => {
  for (const n of [3, 5, 7, 4, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 21, 22, 23, 29]) assert.equal(kolam(n).dots.length, n);
});
