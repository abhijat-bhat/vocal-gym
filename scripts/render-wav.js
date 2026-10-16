/* Vocal Gym · render a kalpana round with gamaka to a WAV file (docs/plans/gamaka-audio.md §6)
   Additive synthesis of renderGamaka's contour: 8 harmonics rolling off as 1/n^1.2, no vibrato, a soft
   attack and release, and a short dip at each swara boundary except inside a jaru. 16-bit mono, 44.1 kHz.
   It is for listening tests and for checking by ear without a browser; it is not part of src/engine.

   Usage
     node scripts/render-wav.js --raga kalyani --aksharas 8 --eduppu-swara P --temp 0 --gamaka full --out round.wav
     node scripts/render-wav.js --in contour.json --out round.wav      (a file from vocal-gym kalpana --contour json)
   Options: any vocal-gym kalpana option, plus --sa <Hz> (261.63), --drone, --out <file> (required). */
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { main } from '../src/cli/main.js';

const SR = 44100, HARMONICS = 8;

export function contourFromArgs(argv) {
  let text = '';
  const code = main(['kalpana', ...argv, '--contour', 'json'], s => { text += s; });
  if (code !== 0) throw new Error('vocal-gym kalpana failed');
  return JSON.parse(text);
}

/* the contour as samples: piecewise-linear pitch between the contour's points, additive harmonics */
export function synthesize(c, { sa = 261.63, drone = false } = {}) {
  const pts = c.points, total = pts[pts.length - 1][0], n = Math.ceil((total + 0.25) * SR), out = new Float32Array(n);
  const amps = []; let norm = 0;
  for (let h = 1; h <= HARMONICS; h++) { amps.push(1 / Math.pow(h, 1.2)); norm += amps[h - 1]; }
  const bounds = (c.rendered || []).filter((x, k) => k > 0 && !(x.shape && x.shape.indexOf('jaru') >= 0)).map(x => x.t0);
  let k = 0, phase = 0, b = 0;
  for (let s = 0; s < n; s++) {
    const t = s / SR;
    if (t > total) break;
    while (k < pts.length - 2 && pts[k + 1][0] <= t) k++;
    const [ta, pa] = pts[k], [tb, pb] = pts[Math.min(k + 1, pts.length - 1)];
    const p = tb > ta ? pa + (pb - pa) * Math.min(1, Math.max(0, (t - ta) / (tb - ta))) : pa;
    phase += 2 * Math.PI * sa * Math.pow(2, p / 12) / SR;
    let v = 0;
    for (let h = 1; h <= HARMONICS; h++) v += amps[h - 1] * Math.sin(h * phase);
    // envelope and articulation
    let g = Math.min(1, t / 0.03, (total - t) / 0.04);
    while (b < bounds.length - 1 && bounds[b] + 0.0125 < t) b++;
    if (bounds.length && Math.abs(t - bounds[b]) < 0.0125) g *= 1 - 0.25 * (1 - Math.abs(t - bounds[b]) / 0.0125);
    out[s] = 0.32 * g * v / norm;
  }
  if (drone) for (let s = 0; s < n; s++) {
    const t = s / SR, e = Math.min(1, t / 0.8, Math.max(0, (total + 0.25 - t) / 0.4));
    out[s] += e * (0.05 * Math.sin(2 * Math.PI * sa / 2 * t) + 0.035 * Math.sin(2 * Math.PI * sa * t) + 0.03 * Math.sin(2 * Math.PI * sa * 1.5 * t));
  }
  return out;
}

export function wav(samples) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + samples.length * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + i * 2);
  return buf;
}

function cli(argv) {
  const pick = (name, hasValue) => { const i = argv.indexOf('--' + name); if (i < 0) return undefined; const v = hasValue ? argv[i + 1] : true; argv.splice(i, hasValue ? 2 : 1); return v; };
  const outFile = pick('out', true), inFile = pick('in', true), sa = +(pick('sa', true) || 261.63), drone = !!pick('drone', false);
  if (!outFile) { console.error('render-wav: give --out <file.wav>'); return 2; }
  const c = inFile ? JSON.parse(readFileSync(inFile, 'utf8')) : contourFromArgs(argv);
  const samples = synthesize(c, { sa, drone });
  writeFileSync(outFile, wav(samples));
  console.log(outFile + ': ' + (samples.length / SR).toFixed(2) + ' s, ' + c.raga + ', ' + c.notes.length + ' swaras, ' + Math.round(c.stats.gamakaShare * 100) + '% with gamaka');
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = cli(process.argv.slice(2));
