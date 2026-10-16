/* Vocal Gym · listening-test kit for gamaka rendering (docs/plans/gamaka-audio.md §8, docs/research/gamaka-eval.md)
   Writes blind, randomised WAV clips, a response form and a separate answer key:
     Part A  idiom rating: 6 ragas × 2 rounds, each at depth 0 (plain) and depth 1 (full gamaka) = 24 clips,
             rated 1-5 for how idiomatic they sound
     Part B  raga identification: 4 ragas, one 20-second round each at depth 0 and depth 1 = 8 clips
   Clip names carry no information; key.json maps them back. The same --seed gives the same kit.

   Usage: node scripts/listening-kit.js --out listening-kit [--seed 1] [--manifest-only] */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { rng } from '../src/engine/random.js';
import { contourFromArgs, synthesize, wav } from './render-wav.js';

export const RATING_RAGAS = [['mela8', 'todi'], ['mela65', 'kalyani'], ['mela15', 'mayamalavagowla'], ['mela29', 'sankarabharanam'], ['mela23', 'gourimanohari'], ['mela22', 'kharaharapriya']];
export const ID_RAGAS = RATING_RAGAS.slice(0, 4);
const shuffle = (xs, rand) => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* the clips, their order and their blind names */
export function buildManifest(seed = 1) {
  const rand = rng(seed * 104729 + 7), clips = [];
  RATING_RAGAS.forEach(([id, name], k) => [1, 2].forEach(n => ['off', 'full'].forEach(gamaka => clips.push({
    part: 'A', raga: id, name, round: n, gamaka, args: ['--raga', name, '--aksharas', '8', '--eduppu-swara', 'S', '--temp', '0.4', '--seed', String(11 + 7 * k + n), '--gamaka', gamaka, '--bpm', '60']
  }))));
  ID_RAGAS.forEach(([id, name], k) => ['off', 'full'].forEach(gamaka => clips.push({
    part: 'B', raga: id, name, round: 1, gamaka, args: ['--raga', name, '--aksharas', '24', '--eduppu-swara', 'S', '--temp', '0.6', '--seed', String(41 + k), '--gamaka', gamaka, '--bpm', '72']
  })));
  const a = shuffle(clips.filter(c => c.part === 'A'), rand), b = shuffle(clips.filter(c => c.part === 'B'), rand);
  a.forEach((c, i) => { c.file = 'A' + String(i + 1).padStart(2, '0') + '.wav'; });
  b.forEach((c, i) => { c.file = 'B' + String(i + 1).padStart(2, '0') + '.wav'; });
  return a.concat(b);
}

function form(manifest) {
  const rows = ['clip,part,question,answer'];
  manifest.forEach(c => rows.push(c.file + ',' + c.part + ',' + (c.part === 'A' ? '"How idiomatic is this as Carnatic singing? 1 (not at all) to 5 (fully)"' : '"Which raga is this? (name it, or write: not sure)"') + ','));
  return rows.join('\n') + '\n';
}

function main(argv) {
  const get = n => { const i = argv.indexOf('--' + n); return i < 0 ? undefined : argv[i + 1]; };
  const out = get('out'), seed = +(get('seed') || 1), only = argv.includes('--manifest-only');
  if (!out) { console.error('listening-kit: give --out <dir>'); return 2; }
  mkdirSync(out, { recursive: true });
  const manifest = buildManifest(seed);
  if (!only) manifest.forEach(c => { const ct = contourFromArgs(c.args); writeFileSync(join(out, c.file), wav(synthesize(ct, { drone: true }))); });
  writeFileSync(join(out, 'form.csv'), form(manifest));
  writeFileSync(join(out, 'key.json'), JSON.stringify({ seed, clips: manifest.map(({ file, part, raga, name, round, gamaka, args }) => ({ file, part, raga, name, round, gamaka, command: 'vocal-gym kalpana ' + args.join(' ') })) }, null, 2) + '\n');
  writeFileSync(join(out, 'README.txt'), 'Vocal Gym gamaka listening test (seed ' + seed + ').\nGive listeners the WAV files and form.csv only. key.json reveals which clips have gamaka; keep it with the experimenter.\nProtocol: docs/research/gamaka-eval.md\n');
  console.log(out + ': ' + manifest.length + ' clips' + (only ? ' (manifest only)' : '') + ', form.csv, key.json');
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main(process.argv.slice(2));
