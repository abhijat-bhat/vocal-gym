/* v0.11 Voice Check: the measurements, on signals whose answer is known */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROBE, PROBE_SECONDS, SARALI_1, FORM, voiceFrames, measureStep, summariseProbe, baseline } from '../src/engine/voice-check.js';

const SR = 48000, SA = 220;
/* a voice-like tone: harmonics falling away, with optional wobble, noise and a level curve */
function tone(seconds, f, o = {}) {
  const n = Math.floor(seconds * SR), x = new Float32Array(n);
  let phase = 0, seed = 12345;
  const noise = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2147483648 - 1; };
  for (let i = 0; i < n; i++) {
    const t = i / SR, fi = (typeof f === 'function' ? f(t) : f) * 2 ** ((o.wobbleCents || 0) * Math.sin(2 * Math.PI * 5 * t) / 1200);
    phase += 2 * Math.PI * fi / SR;
    let s = 0; for (let h = 1; h <= 8; h++) s += Math.sin(h * phase) / (h * (o.steep || 1));
    const level = o.level ? o.level(t) : 1, on = t < (o.delay || 0) ? 0 : 1;
    x[i] = 0.2 * level * on * s + (o.noise || 0) * noise();
  }
  return x;
}

test('the probe is the research plan\'s: 90 seconds or less, with the five sung parts', () => {
  assert.ok(PROBE_SECONDS <= 90, PROBE_SECONDS + ' seconds');
  ['aa1', 'aa2', 'oo1', 'oo2', 'oo3', 'siren', 'messa', 'sarali'].forEach(id => assert.ok(PROBE.some(p => p.id === id), id));
  assert.equal(SARALI_1.length, 16);
  assert.equal(FORM.length, 3);
});

test('pitch is found within a few cents, across the singing range', () => {
  [110, 146.83, 220, 329.63, 523.25, 880].forEach(f => {
    const fr = voiceFrames(tone(1, f), SR).filter(x => x.f0 > 0);
    assert.ok(fr.length > 30, f + ' Hz found');
    const m = fr.map(x => x.f0).sort((a, b) => a - b)[fr.length >> 1];
    assert.ok(Math.abs(1200 * Math.log2(m / f)) < 12, f + ' Hz read as ' + m);
  });
});

test('a steady note measures steadier than a wobbling one, and a clean one clearer than a noisy one', () => {
  const steady = measureStep('aa1', tone(4, SA), SR, SA), wob = measureStep('aa1', tone(4, SA, { wobbleCents: 40 }), SR, SA), noisy = measureStep('aa1', tone(4, SA, { noise: 0.12 }), SR, SA);
  assert.ok(steady.heard && wob.heard && noisy.heard);
  assert.ok(steady.stabilityCents < 3, 'steady ' + steady.stabilityCents);
  assert.ok(wob.stabilityCents > 15, 'wobble ' + wob.stabilityCents);
  assert.ok(steady.hnr > noisy.hnr, 'hnr ' + steady.hnr + ' against ' + noisy.hnr);
  assert.ok(steady.cpp > noisy.cpp, 'cpp ' + steady.cpp + ' against ' + noisy.cpp);
  assert.ok(Math.abs(steady.offCents) < 12, 'on Sa: ' + steady.offCents);
});

test('off pitch is measured from Sa, in the octave nearest to what was sung', () => {
  const sharp = measureStep('aa1', tone(4, SA * 2 ** (30 / 1200)), SR, SA), low = measureStep('aa1', tone(4, SA / 2), SR, SA);
  assert.ok(Math.abs(sharp.offCents - 30) < 12, 'sharp ' + sharp.offCents);
  assert.ok(Math.abs(low.offCents) < 12, 'an octave down is still Sa: ' + low.offCents);
});

test('a brighter voice has a flatter spectral tilt', () => {
  const bright = measureStep('aa1', tone(4, SA), SR, SA), dark = measureStep('aa1', tone(4, SA, { steep: 4 }), SR, SA);
  assert.ok(bright.tilt != null && dark.tilt != null);
  // both fall away; the tilt is a slope in dB per octave and the steep voice's harmonics are only scaled, so compare with a real rolloff
  const n = 4 * SR, rolled = new Float32Array(n); let p = 0; for (let i = 0; i < n; i++) { p += 2 * Math.PI * SA / SR; let s = 0; for (let h = 1; h <= 12; h++) s += Math.sin(h * p) / (h * h * h); rolled[i] = 0.3 * s; }
  const low = measureStep('aa1', rolled, SR, SA).tilt;
  assert.ok(low < bright.tilt - 4, 'rolled-off ' + low + ' below bright ' + bright.tilt);
  assert.ok(bright.tilt < -2 && bright.tilt > -12, 'a voice falls away with height: ' + bright.tilt);
});

test('the siren gives the range; the messa di voce gives the swell and the drift', () => {
  const siren = measureStep('siren', tone(8, t => 110 * 2 ** (24 * (t < 4 ? t / 4 : (8 - t) / 4) / 12)), SR, SA);
  assert.ok(siren.heard && Math.abs(siren.rangeSemis - 24) < 2, 'two octaves: ' + siren.rangeSemis);
  const messa = measureStep('messa', tone(8, SA, { level: t => 0.1 + 0.9 * Math.sin(Math.PI * t / 8) }), SR, SA);
  assert.ok(messa.swellDb > 10, 'swell ' + messa.swellDb);
  assert.ok(messa.driftCents < 5, 'drift ' + messa.driftCents);
  const drifted = measureStep('messa', tone(8, t => SA * 2 ** (60 * t / 8 / 1200)), SR, SA);
  assert.ok(drifted.driftCents > 10, 'drift found: ' + drifted.driftCents);
});

test('a slow onset takes longer to settle', () => {
  const quick = measureStep('oo1', tone(3, SA * 3), SR, SA), slow = measureStep('oo1', tone(3, t => SA * 3 * 2 ** ((t < 0.5 ? -300 * (1 - t / 0.5) : 0) / 1200)), SR, SA);
  assert.ok(quick.onsetSec < 0.1, 'quick ' + quick.onsetSec);
  assert.ok(slow.onsetSec > 0.25, 'slow ' + slow.onsetSec);
});

test('the sarali is measured swara by swara', () => {
  const beat = 1, sung = tone(16, t => SA * 2 ** (SARALI_1[Math.min(15, Math.floor(t / beat))] / 12));
  const m = measureStep('sarali', sung, SR, SA);
  assert.equal(m.notesHeard, 16);
  assert.ok(m.meanOffCents < 12, 'on the swaras: ' + m.meanOffCents);
  const flat = measureStep('sarali', tone(16, t => SA * 2 ** ((SARALI_1[Math.min(15, Math.floor(t / beat))] - 0.4) / 12)), SR, SA);
  assert.ok(flat.meanOffCents > 30, 'flat is found: ' + flat.meanOffCents);
});

test('silence is not a voice, and says so', () => {
  const quiet = measureStep('aa1', new Float32Array(4 * SR), SR, SA);
  assert.equal(quiet.heard, false);
  const room = measureStep('room', tone(3, SA, { level: () => 0, noise: 0.001 }), SR, SA);
  assert.ok(room.heard && room.roomDb < -40, 'room ' + room.roomDb);
  assert.throws(() => measureStep('nope', new Float32Array(10), SR, SA), /No step/);
});

test('the same audio gives the same numbers', () => {
  const x = tone(4, SA, { wobbleCents: 10, noise: 0.01 });
  assert.deepEqual(measureStep('aa1', x, SR, SA), measureStep('aa1', x, SR, SA));
});

test('a day\'s row summarises the steps, and a baseline waits for seven days', () => {
  const steps = [measureStep('room', new Float32Array(3 * SR), SR, SA), measureStep('aa1', tone(4, SA), SR, SA), measureStep('aa2', tone(4, SA), SR, SA), measureStep('oo1', tone(3, SA * 3), SR, SA), measureStep('siren', tone(8, t => 110 * 2 ** (t / 4)), SR, SA)];
  const s = summariseProbe(steps);
  assert.equal(s.stepsHeard, 4);
  assert.ok(s.stabilityCents != null && s.hnr != null && s.rangeSemis != null && s.softHeard === 1);
  assert.equal(s.swellDb, null, 'a step not sung is left empty');
  const day = (i, v) => ({ localDate: '2026-11-0' + i, features: { hnr: v } });
  assert.equal(baseline([1, 2, 3, 4, 5, 6].map(i => day(i, 10 + i)), 'hnr'), null);
  assert.equal(baseline([1, 2, 3, 4, 5, 6, 7].map(i => day(i, 10 + i)), 'hnr'), 14);
});
