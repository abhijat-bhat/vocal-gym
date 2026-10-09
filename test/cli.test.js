import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const BIN = fileURLToPath(new URL('../bin/vocal-gym.js', import.meta.url));
const run = (...a) => spawnSync(process.execPath, [BIN, ...a], { encoding: 'utf8' });

test('command line', () => {
  let r = run('alankara', '--raga', 'mohanam', '--tala', 'misra jhampa');
  assert.equal(r.status, 0); assert.match(r.stdout, /sheet 4\.3/); assert.match(r.stdout, /S R G S R S R \| G \| P , \|\|/);
  r = run('alankara', '--raga', '65', '--tala', 'adi', '--new', '2', '--temp', '1');
  assert.equal(r.status, 0); assert.match(r.stdout, /Variation 2 · new pattern/);
  r = run('kalpana', '--raga', 'kalyani', '--tala', 'adi', '--aksharas', '8', '--land', 'P', '--temp', '0');
  assert.equal(r.status, 0); assert.match(r.stdout, /→ eduppu/); assert.match(r.stdout, /lands on P/);
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
