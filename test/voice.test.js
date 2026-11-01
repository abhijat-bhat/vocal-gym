/* The singing voice (web/shared/voice.js, docs/research/expressive-voice.md): deterministic, finite,
   in tune, and shaped by the expression layer. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { E, ALL } from './helpers.js';
import '../web/shared/voice.js';

const V = globalThis.VGVoice, SR = 22050;
const byId = id => ALL.find(r => r.id === id);
const notesOf = ps => ps.map(p => Array.isArray(p) ? { p: p[0], dur: p[1] } : { p, dur: 1 });
/* the pitch of a stretch of samples, by autocorrelation refined with a parabola through the peak */
function pitch(y, a, b, sr) {
  const ac = L => { let s = 0; for (let i = a; i < b - L; i++) s += y[i] * y[i + L]; return s; };
  let best = -Infinity, lag = 0;
  for (let L = Math.floor(sr / 1000); L < Math.floor(sr / 80); L++) { const s = ac(L); if (s > best) { best = s; lag = L; } }
  const l = ac(lag - 1), c = ac(lag), r = ac(lag + 1), d = (l - r) / (2 * (l - 2 * c + r));
  return sr / (lag + (Number.isFinite(d) ? d : 0));
}
const stats = y => { let pk = 0, ss = 0, fin = true; for (const v of y) { if (!Number.isFinite(v)) fin = false; pk = Math.max(pk, Math.abs(v)); ss += v * v; } return { pk, rms: Math.sqrt(ss / y.length), fin }; };
const energy = (y, t0, t1) => { let s = 0, n = 0; for (let i = Math.round((t0 + V.PRE) * SR); i < Math.round((t1 + V.PRE) * SR); i++) { s += y[i] * y[i]; n++; } return s / Math.max(1, n); };

test('voice: deterministic, finite, below full scale, and in tune', () => {
  const r = byId('mela29');
  const c = E.renderGamaka(notesOf([[0, 4], [7, 4], [12, 4]]), { raga: r, slotSec: 0.3, intensity: 0, voice: true, seed: 2 });
  const line = V.lineOf(c), y1 = V.render(line, { sr: SR, sa: 261.63 }), y2 = V.render(line, { sr: SR, sa: 261.63 });
  assert.equal(y1.length, y2.length);
  assert.ok(y1.every((v, i) => v === y2[i]), 'the same line gives the same samples');
  const s = stats(y1);
  assert.ok(s.fin && s.pk < 1 && s.pk > 0.1 && s.rms > 0.02, 'finite, audible, not clipped: ' + JSON.stringify(s));
  // the middle of each held swara is in tune (within 15 cents: the voice wanders a few cents, as voices do)
  [[0, 261.63], [7, 392.0], [12, 523.25]].forEach(([p, hz], k) => {
    const mid = 1.2 * k + 0.6, a = Math.round((mid - 0.1 + V.PRE) * SR), b = Math.round((mid + 0.1 + V.PRE) * SR);
    const f = pitch(y1, a, b, SR), cents = 1200 * Math.log2(f / hz);
    assert.ok(Math.abs(cents) < 15, 'swara ' + p + ' sung at ' + f.toFixed(1) + ' Hz (' + cents.toFixed(1) + ' c)');
  });
  // Sa decides the pitch
  const yd = V.render(line, { sr: SR, sa: 293.66 }), a = Math.round((0.5 + V.PRE) * SR), b = Math.round((0.7 + V.PRE) * SR);
  assert.ok(Math.abs(1200 * Math.log2(pitch(yd, a, b, SR) / 293.66)) < 15, 'Sa = D sings Sa at 293.66 Hz');
});

test('voice: the swara names differ from aa, consonants come before the beat, the loudness curve is followed', () => {
  const r = byId('mela65');
  const res = E.kalpana(r, { aksharas: 8, perAkshara: 2, startPitch: 0, eduppuPitch: 7, T: 1, seed: 4 });
  const c = E.renderGamaka(res.notes, { raga: r, slotSec: 0.3, intensity: 0.55, voice: true, units: res.units, seed: 4, per: 2, cycleBeats: 8, angaStarts: [0, 4, 6] });
  const line = V.lineOf(c);
  assert.equal(line.notes.length, res.notes.filter(n => n.p != null).length);
  assert.ok(line.notes.every(n => n.syllable && n.vowel), 'every swara carries its syllable');
  const aa = V.render(line, { sr: SR, timbre: 'aa' }), sw = V.render(line, { sr: SR, timbre: 'swaram' });
  assert.equal(aa.length, sw.length);
  let diff = 0; for (let i = 0; i < aa.length; i++) diff += Math.abs(aa[i] - sw[i]);
  assert.ok(diff / aa.length > 1e-3, 'the swara names change the sound');
  [aa, sw].forEach(y => { const s = stats(y); assert.ok(s.fin && s.pk < 1 && s.rms > 0.02, JSON.stringify(s)); });
  // pa is a voiceless stop: just before its beat the voice is closed, quieter than the same moment on aa
  const pa = line.notes.find((n, k) => k > 0 && n.consonant === 'p' && n.onset === 'note');
  if (pa) assert.ok(energy(sw, pa.t0 - 0.04, pa.t0 - 0.005) < 0.5 * energy(aa, pa.t0 - 0.04, pa.t0 - 0.005), 'the closure of pa before its beat');
  // the loudness follows the expression: the last swara fades
  const last = line.notes[line.notes.length - 1];
  assert.ok(energy(aa, last.t1 - 0.12, last.t1 - 0.02) < energy(aa, last.t0 + 0.02, last.t0 + 0.12), 'the last swara fades');
  // nothing to sing: a moment of silence
  assert.ok(V.render({ groups: [] }, { sr: SR }).every(v => v === 0));
});

test('voice: the CLI contour JSON sings the same as the engine output', () => {
  const r = byId('mela8');
  const res = E.kalpana(r, { aksharas: 8, perAkshara: 2, startPitch: 0, eduppuPitch: 7, T: 0, seed: 3 });
  const c = E.renderGamaka(res.notes, { raga: r, slotSec: 0.4, intensity: 0.55, units: res.units, seed: 3 });
  // the JSON form: points as [t, p] pairs, gain as [t, g] pairs
  const json = JSON.parse(JSON.stringify({ groups: c.groups.map(g => ({ t0: g.t0, t1: g.t1, points: g.points.map(pt => [pt.t, pt.p]) })), notes: c.notes, expression: { phrases: c.expression.phrases, notes: c.expression.notes, gain: c.expression.gain.map(g => g.map(x => [x.t, x.g])) } }));
  const a = V.render(V.lineOf(c), { sr: SR }), b = V.render(V.lineOf(json), { sr: SR });
  assert.equal(a.length, b.length);
  let d = 0; for (let i = 0; i < a.length; i++) d = Math.max(d, Math.abs(a[i] - b[i]));
  assert.ok(d < 1e-6, 'identical samples (max difference ' + d + ')');
});
