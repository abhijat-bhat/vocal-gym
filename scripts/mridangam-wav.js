/* Vocal Gym · render the synthesized mridangam to WAV (docs/research/mridangam-synthesis.md)
   Uses web/shared/mridangam.js, the same code the pages play.
   Usage
     node scripts/mridangam-wav.js --strokes --out dir/ [--sa 261.63]
         every stroke as its own WAV (thi.wav, tha.wav, …), for checking against recordings
     node scripts/mridangam-wav.js --sollus "tha ka dhi mi tha ki ta , thom" --bpm 72 --nadai 4 --out jathi.wav [--sa 261.63]
         a line of sollus realized as strokes, one per slot (',' is a karvai) */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';
import { writeWav } from './solkattu-bank.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export function loadMridangam() {
  const g = { setTimeout, clearTimeout }; g.globalThis = g; vm.createContext(g);
  vm.runInContext(readFileSync(join(root, 'web', 'shared', 'mridangam.js'), 'utf8'), g);
  return g.VGMridangam;
}
/* sollus at `slot` seconds each, mixed into one buffer */
export function renderSollus(M, sylls, slot, sa, sr) {
  const strokes = M.realize(sylls), parts = [];
  strokes.forEach((s, i) => { if (s) parts.push([i * slot, M.render(s, sa, sr)]); });
  const n = Math.ceil((sylls.length * slot + 1.5) * sr), y = new Float32Array(n);
  parts.forEach(([t, x]) => { const o = Math.round(t * sr); for (let i = 0; i < x.length && o + i < n; i++) y[o + i] += x[i]; });
  let pk = 0; for (const v of y) pk = Math.max(pk, Math.abs(v));
  if (pk > 0.98) for (let i = 0; i < n; i++) y[i] *= 0.98 / pk;
  return { y, strokes };
}

function cli(argv) {
  const get = (k, d) => { const i = argv.indexOf('--' + k); return i < 0 ? d : argv[i + 1]; };
  const M = loadMridangam(), sa = +get('sa', 261.63), sr = 44100, out = get('out');
  if (!out) { console.error('mridangam-wav: give --out'); return 2; }
  if (argv.includes('--strokes')) {
    mkdirSync(out, { recursive: true });
    Object.keys(M.STROKES).concat(Object.keys(M.DERIVED)).forEach(s => writeFileSync(join(out, s + '.wav'), writeWav(M.render(s, sa, sr), sr)));
    console.log('Wrote ' + (Object.keys(M.STROKES).length + Object.keys(M.DERIVED).length) + ' strokes to ' + out + ' (Sa ' + sa + ' Hz)');
    return 0;
  }
  const sollus = get('sollus');
  if (!sollus) { console.error('mridangam-wav: give --strokes or --sollus "…"'); return 2; }
  const sylls = sollus.trim().split(/\s+/), slot = 60 / +get('bpm', 72) / +get('nadai', 4), { y, strokes } = renderSollus(M, sylls, slot, sa, sr);
  writeFileSync(out, writeWav(y, sr));
  console.log(out + ': ' + sylls.map((s, i) => s + (strokes[i] ? '=' + strokes[i] : '')).join(' '));
  return 0;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = cli(process.argv.slice(2));
