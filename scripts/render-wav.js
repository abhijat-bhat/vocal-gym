/* Vocal Gym · render a kalpana round with gamaka to a WAV file (docs/plans/gamaka-audio.md §6)
   By default the round is sung by the voice the pages use (web/shared/voice.js,
   docs/research/expressive-voice.md): renderGamaka's contour and its expression layer (phrases, stress,
   breaths, loudness), on "aa" or, with --timbre swaram, on the swara names. --timbre tone is the earlier
   additive tone: 16 harmonics rolling off as 1/n^1.3, no vibrato, loudness that follows the pitch movement
   (docs/research/gamaka-naturalness.md §3.3) and a soft dip at each swara boundary except inside a jaru;
   it is what the listening kit uses, so its clips stay as the protocol describes. 16-bit mono, 44.1 kHz.
   It is for listening tests and for checking by ear without a browser; it is not part of src/engine.

   Usage
     node scripts/render-wav.js --raga kalyani --aksharas 8 --eduppu-swara P --temp 0 --gamaka full --out round.wav
     node scripts/render-wav.js --in contour.json --out round.wav      (a file from vocal-gym kalpana --contour json)
   Options: any vocal-gym kalpana option (--voice sings straight notes legato at --gamaka off), plus
   --sa <Hz> (261.63), --drone, --timbre aa|swaram|tone (aa), --out <file> (required).
   The WAV lasts the round plus 0.25 s; with --timbre swaram it starts 0.1 s early, for the first consonant. */
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { main } from '../src/cli/main.js';
import '../web/shared/voice.js';   // globalThis.VGVoice

const SR = 44100, HARMONICS = 16;

export function contourFromArgs(argv) {
  let text = '';
  const code = main(['kalpana', ...argv, '--contour', 'json'], s => { text += s; });
  if (code !== 0) throw new Error('vocal-gym kalpana failed');
  return JSON.parse(text);
}

/* the contour as samples, sung by the voice (timbre 'aa' or 'swaram') or as the earlier additive tone ('tone',
   also used for contours without legato groups, from before v0.6) */
export function synthesize(c, { sa = 261.63, drone = false, timbre = 'aa', seed = 1 } = {}) {
  const pts = c.points, total = pts[pts.length - 1][0];
  if (timbre === 'tone' || !c.groups || !globalThis.VGVoice) return tone(c, { sa, drone });
  const V = globalThis.VGVoice, y = V.render(V.lineOf(c), { sr: SR, sa, timbre, seed });
  const lead = timbre === 'swaram' ? 0 : Math.round(V.PRE * SR), n = Math.ceil((total + 0.25) * SR) + (timbre === 'swaram' ? Math.round(V.PRE * SR) : 0);
  const out = new Float32Array(n);
  out.set(y.subarray(lead, Math.min(y.length, lead + n)));
  if (drone) addDrone(out, sa, total + 0.25, timbre === 'swaram' ? V.PRE : 0);
  return out;
}
function addDrone(out, sa, total, offset) {
  for (let s = 0; s < out.length; s++) {
    const t = s / SR - offset, e = Math.max(0, Math.min(1, (t + offset) / 0.8, (total - t) / 0.4));
    out[s] += e * (0.05 * Math.sin(2 * Math.PI * sa / 2 * t) + 0.035 * Math.sin(2 * Math.PI * sa * t) + 0.03 * Math.sin(2 * Math.PI * sa * 1.5 * t));
  }
}
function tone(c, { sa = 261.63, drone = false } = {}) {
  const pts = c.points, total = pts[pts.length - 1][0], n = Math.ceil((total + 0.25) * SR), out = new Float32Array(n);
  const amps = []; let norm = 0;
  for (let h = 1; h <= HARMONICS; h++) { amps.push(1 / Math.pow(h, 1.3)); norm += amps[h - 1]; }
  const swaras = (c.rendered || []).filter(x => x.p != null);
  const bounds = (c.rendered || []).filter((x, k) => k > 0 && !(x.shape && x.shape.indexOf('jaru') >= 0)).map(x => x.t0);
  let k = 0, phase = 0, b = 0, q = 0, lastP = null;
  for (let s = 0; s < n; s++) {
    const t = s / SR;
    if (t > total) break;
    while (k < pts.length - 2 && pts[k + 1][0] <= t) k++;
    const [ta, pa] = pts[k], [tb, pb] = pts[Math.min(k + 1, pts.length - 1)];
    const p = tb > ta ? pa + (pb - pa) * Math.min(1, Math.max(0, (t - ta) / (tb - ta))) : pa;
    phase += 2 * Math.PI * sa * Math.pow(2, p / 12) / SR;
    // loudness follows the pitch: a little louder above the swara, a little softer in fast moves (S200)
    while (q < swaras.length - 1 && swaras[q].t1 <= t) q++;
    const speed = lastP == null ? 0 : Math.abs(p - lastP) * SR;
    lastP = p;
    const am = swaras.length ? 1 + Math.max(-0.15, Math.min(0.15, 0.04 * (p - swaras[q].p))) - 0.08 * Math.min(1, speed / 40) : 1;
    let v = 0;
    for (let h = 1; h <= HARMONICS; h++) v += amps[h - 1] * Math.sin(h * phase);
    // envelope and articulation
    let g = Math.min(1, t / 0.03, (total - t) / 0.04);
    while (b < bounds.length - 1 && bounds[b] + 0.015 < t) b++;
    if (bounds.length && Math.abs(t - bounds[b]) < 0.015) g *= 1 - 0.12 * (1 - Math.abs(t - bounds[b]) / 0.015);
    out[s] = 0.32 * g * am * v / norm;
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
  const outFile = pick('out', true), inFile = pick('in', true), sa = +(pick('sa', true) || 261.63), drone = !!pick('drone', false), timbre = pick('timbre', true) || 'aa';
  if (!['aa', 'swaram', 'tone'].includes(timbre)) { console.error('render-wav: --timbre is aa, swaram or tone'); return 2; }
  if (!outFile) { console.error('render-wav: give --out <file.wav>'); return 2; }
  const c = inFile ? JSON.parse(readFileSync(inFile, 'utf8')) : contourFromArgs(argv);
  const samples = synthesize(c, { sa, drone, timbre });
  writeFileSync(outFile, wav(samples));
  console.log(outFile + ': ' + (samples.length / SR).toFixed(2) + ' s, ' + c.raga + ', ' + c.notes.length + ' swaras, ' + Math.round(c.stats.gamakaShare * 100) + '% with gamaka, ' + (timbre === 'tone' ? 'tone' : 'sung on ' + (timbre === 'swaram' ? 'the swara names' : 'aa')));
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = cli(process.argv.slice(2));
