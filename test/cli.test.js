import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BIN = fileURLToPath(new URL('../bin/vocal-gym.js', import.meta.url));
const run = (...a) => spawnSync(process.execPath, [BIN, ...a], { encoding: 'utf8' });

test('command line', () => {
  let r = run('alankara', '--raga', 'mohanam', '--tala', 'misra jhampa');
  assert.equal(r.status, 0); assert.match(r.stdout, /sheet 4\.3/); assert.match(r.stdout, /S R G S R S R \| G \| P , \|\|/);
  r = run('alankara', '--raga', '65', '--tala', 'adi', '--new', '2', '--temp', '1');
  assert.equal(r.status, 0); assert.match(r.stdout, /Variation 2 · new pattern/);
  r = run('kalpana', '--raga', 'kalyani', '--tala', 'adi', '--aksharas', '8', '--land', 'P', '--temp', '0');
  assert.equal(r.status, 0); assert.match(r.stdout, /→ eduppu/); assert.match(r.stdout, /lands on P/); assert.match(r.stdout, /--land is deprecated/);
  r = run('kalpana', '--raga', 'kalyani', '--tala', 'adi', '--aksharas', '8', '--eduppu-swara', 'S', '--temp', '0');
  assert.equal(r.status, 0); assert.match(r.stdout, /→ eduppu S/); assert.match(r.stdout, /^Leaps: (none|\d+, )/m); assert.match(r.stdout, /lands on (N₃, the swara just below|R₂, the swara just above) the eduppu S/);
  assert.match(r.stdout, /attested · .*\[mela65#\d+, S\d+: /); assert.match(r.stdout, /% of swaras from attested phrases/);
  r = run('kalpana', '--raga', 'bilahari', '--aksharas', '16', '--eduppu-swara', 'P', '--allow-exceptions', '--ending', 'free');
  assert.equal(r.status, 0); assert.match(r.stdout, /direction-rule exceptions allowed/);
  r = run('kalpana', '--raga', 'mela1', '--aksharas', '8', '--eduppu-swara', 'S');
  assert.equal(r.status, 0); assert.match(r.stdout, /Phrase data: none for Kanakangi/);
  r = run('kalpana', '--raga', 'mayamalavagowla', '--aksharas', '16', '--eduppu-swara', 'S', '--ending', 'mora', '--mora-style', 'gopuccha', '--temp', '0');
  assert.equal(r.status, 0); assert.match(r.stdout, /gopuccha mora \(/); assert.equal((r.stdout.match(/mora · mora \d of 3/g) || []).length, 3);
  r = run('kalpana', '--raga', 'kalyani', '--mora-style', 'zigzag');
  assert.equal(r.status, 2); assert.match(r.stderr, /Mora style must be one of/);
  // gamaka: marks in the notation, the contour as JSON, and a WAV rendered from it
  r = run('kalpana', '--raga', 'todi', '--aksharas', '8', '--temp', '0', '--gamaka', 'full', '--seed', '4');   // a round with ga's R2-position turn
  assert.equal(r.status, 0); assert.match(r.stdout, /^Gamaka \(full, 100%, 72 aksharas a minute\) · heavy, from S37/m); assert.match(r.stdout, /~\([RḌD]₂\*–/);   // Todi ga and ni turn at the R2 and D2 positions (S206)
  r = run('kalpana', '--raga', 'todi', '--aksharas', '8', '--temp', '0', '--gamaka', '55');
  assert.equal(r.status, 0); assert.match(r.stdout, /^Gamaka \(55%, 72 aksharas a minute\)/m);
  assert.equal(run('kalpana', '--raga', 'kalyani', '--gamaka', '140').status, 2);
  assert.doesNotMatch(run('kalpana', '--raga', 'todi', '--aksharas', '8', '--gamaka', '0').stdout, /^Gamaka/m, 'level 0 is straight notes');
  r = run('kalpana', '--raga', 'mela1', '--aksharas', '8', '--gamaka', 'light');
  assert.equal(r.status, 0); assert.match(r.stdout, /generic: no raga-specific data yet/);
  assert.equal(run('kalpana', '--raga', 'kalyani', '--gamaka', 'loud').status, 2);
  r = run('kalpana', '--raga', 'kalyani', '--aksharas', '8', '--eduppu-swara', 'P', '--contour', 'json', '--bpm', '60');
  assert.equal(r.status, 0);
  const cj = JSON.parse(r.stdout), total = cj.notes.reduce((s, n) => s + n.dur, 0) * cj.slotSec;
  assert.equal(cj.raga, 'mela65'); assert.equal(cj.rendered.length, cj.notes.length);
  assert.ok(Math.abs(cj.points[cj.points.length - 1][0] - total) < 1e-4 && cj.points[0][0] === 0, 'the contour spans the round');
  assert.ok(cj.points.every((pt, k) => k === 0 || pt[0] >= cj.points[k - 1][0]), 'contour times increase');
  const tmp = mkdtempSync(join(tmpdir(), 'vg-')), wavFile = join(tmp, 'round.wav'), jsonFile = join(tmp, 'round.json');
  writeFileSync(jsonFile, r.stdout);
  const w = spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/render-wav.js', import.meta.url)), '--in', jsonFile, '--out', wavFile], { encoding: 'utf8' });
  assert.equal(w.status, 0, w.stderr);
  const wb = readFileSync(wavFile);
  assert.equal(wb.toString('ascii', 0, 4), 'RIFF'); assert.equal(wb.toString('ascii', 8, 12), 'WAVE'); assert.equal(wb.readUInt32LE(24), 44100);
  assert.equal(wb.readUInt32LE(40), wb.length - 44); assert.ok(Math.abs(wb.readUInt32LE(40) / 2 / 44100 - (total + 0.25)) < 0.01, 'WAV length matches the round');
  rmSync(tmp, { recursive: true, force: true });
  r = run('kalpana', '--raga', 'saveri', '--aksharas', '4', '--eduppu-swara', 'G');
  assert.equal(r.status, 0); assert.match(r.stdout, /lands on M₁, the swara just above the eduppu G₃/);
  r = run('kalpana', '--raga', 'kalyani', '--aksharas', '1', '--per', '1', '--eduppu-swara', "P'");
  assert.equal(r.status, 2); assert.match(r.stderr, /neighbours of the eduppu swara P'/);
  r = run('jathi', '--tala', 'misra chapu', '--eduppu', '-2', '--script');
  assert.equal(r.status, 0); assert.match(r.stdout, /^# Generated jathi/); assert.match(r.stdout, /tala: misra chapu/);
  const gen = r.stdout;
  r = spawnSync(process.execPath, [BIN, 'judge', '-'], { input: gen, encoding: 'utf8' });
  assert.equal(r.status, 0, 'a generated jathi passes the judge'); assert.match(r.stdout, /Score \d+\/100/);
  r = run('judge', fileURLToPath(new URL('../examples/short.jathi', import.meta.url)));
  assert.equal(r.status, 1, 'the one-matra-short example fails'); assert.match(r.stdout, /Start with line 11/);
  r = run('judge', fileURLToPath(new URL('../examples/adi.jathi', import.meta.url)), '--json');
  assert.equal(r.status, 0); assert.equal(JSON.parse(r.stdout).total, 100);
  r = run('alankara', '--raga', 'nosuchraga', '--tala', 'adi');
  assert.equal(r.status, 2); assert.match(r.stderr, /Unknown raga/);
  assert.equal(run('help').status, 0);
  r = run('ragas'); assert.equal(r.status, 0); assert.match(r.stdout, /65\s+mela65\s+Mechakalyani/); assert.match(r.stdout, /kambhoji/);
  r = run('talas'); assert.equal(r.status, 0); assert.match(r.stdout, /Sankeerna jati Dhruva +\|9 O \|9 \|9 +29 aksharas/); assert.match(r.stdout, /Misra Chapu/);
  r = run('sheet', '--tala', 'misra jhampa'); assert.equal(r.status, 0); assert.match(r.stdout, /4\.3 Mishra Jāti Jhampa/);
  r = run('example', 'adi'); assert.equal(r.status, 0); assert.match(r.stdout, /\{tha-dhi-gi-na-thom\}\/3/);
});

test('cli: korvai works out moras, korvais, chakradars and trikaala, and its script passes the judge', () => {
  let r = run('korvai', '--tala', 'adi', '--form', 'korvai');
  assert.equal(r.status, 0); assert.match(r.stdout, /33 \+ 31 = 64/); assert.match(r.stdout, /ok {3}The closing “tha” sounds at cycle 3, beat 1: sam/);
  r = run('korvai', '--tala', 'khanda triputa', '--form', 'trikaala', '--n', '5');
  assert.equal(r.status, 0); assert.match(r.stdout, /2 × 9 − 15 = 3 beats to leave/);
  for (const form of ['mora', 'korvai', 'chakradar']) {
    r = run('korvai', '--tala', 'misra chapu', '--gati', '2', '--cycles', '6', '--form', form, '--script');
    assert.equal(r.status, 0, form); assert.match(r.stdout, /^# Korvai lab/);
    const j = spawnSync(process.execPath, [BIN, 'judge', '-'], { input: r.stdout, encoding: 'utf8' });
    assert.equal(j.status, 0, form + ' passes the judge:\n' + j.stdout);
  }
  r = run('korvai', '--tala', 'adi', '--gati', '11');
  assert.notEqual(r.status, 0); assert.match(r.stderr, /gati/);
});

test('cli: korvai forms from the Unit 3 notes: statements, progressive, chakkardar, build-up', () => {
  let r = run('korvai', '--tala', 'khanda ata', '--form', 'statements', '--kind', 'fib');
  assert.equal(r.status, 0); assert.match(r.stdout, /37 \+ 37 \+ 38/); assert.match(r.stdout, /Fibonacci/);
  r = run('korvai', '--tala', 'adi', '--form', 'statements', '--cycles', '3', '--terms', '3,4,5,6,7', '--script');
  assert.equal(r.status, 0);
  const j = spawnSync(process.execPath, [BIN, 'judge', '-'], { input: r.stdout, encoding: 'utf8' });
  assert.equal(j.status, 0, 'three statements pass the judge');
  r = run('korvai', '--tala', 'adi', '--form', 'progressive', '--cycles', '3');
  assert.equal(r.status, 0); assert.match(r.stdout, /A progressive korvai/);
  r = run('korvai', '--tala', 'adi', '--form', 'chakkardar', '--cycles', '2');
  assert.equal(r.status, 0); assert.match(r.stdout, /9 × \d+ \+ 6 × \d+ \+ 2 × \d+ = 64/);
  r = run('korvai', '--tala', 'adi', '--form', 'mora', '--series', 'buildup', '--cycles', '3');
  assert.equal(r.status, 0); assert.match(r.stdout, /One, two, three statements/);
});
