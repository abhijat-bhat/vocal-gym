import { test } from 'node:test';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';
import { E, checker } from './helpers.js';
import { SYLLABLES, RATE, MAX_SEC, BANK_FILE, writeWav, readWav, mono, segments, groups, typical, resample, ulawEncode, encode, bankText, build } from '../scripts/solkattu-bank.js';

const VOICE = readFileSync(new URL('../web/shared/solkattu.js', import.meta.url), 'utf8');
/* load the shared voice (and a bank) the way a page does, in a fresh global */
function page(bankSource) {
  const g = { atob: globalThis.atob, WeakMap };
  g.globalThis = g;
  vm.createContext(g);
  if (bankSource) vm.runInContext(bankSource, g);
  vm.runInContext(VOICE, g);
  return g;
}
/* a Web Audio stand-in that records what a voice schedules */
function fakeAudio() {
  const log = [];
  const param = () => ({ setValueAtTime: (v, t) => log.push(['set', v, t]), linearRampToValueAtTime: (v, t) => log.push(['ramp', v, t]) });
  const node = extra => Object.assign({ connect: n => n }, extra);
  return {
    log,
    createBuffer: (ch, len, rate) => { const d = new Float32Array(len); return { duration: len / rate, length: len, sampleRate: rate, getChannelData: () => d }; },
    createBufferSource: () => node({ buffer: null, start(t) { log.push(['start', this.buffer, t]); }, stop(t) { log.push(['stop', t]); } }),
    createGain: () => node({ gain: param() })
  };
}

/* a synthetic "syllable": a short noise burst (the consonant) and a decaying voiced vowel */
function syllable(rate, seed, vowelSec) {
  let s = seed;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff * 2 - 1; };
  const n = Math.round((0.012 + vowelSec) * rate), y = new Float32Array(n), burst = Math.round(0.012 * rate);
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    y[i] = i < burst ? 0.5 * rnd() : 0.6 * Math.exp(-(t - 0.012) / (vowelSec / 3)) * (Math.sin(2 * Math.PI * 180 * t) + 0.5 * Math.sin(2 * Math.PI * 360 * t) + 0.3 * Math.sin(2 * Math.PI * 720 * t)) / 1.8;
  }
  return y;
}
/* a session: `takes` utterances per syllable about 0.8 s apart, 3 s of silence between syllables, quiet room noise */
function session(rate, count, takes) {
  const parts = [], onsets = [];
  let t = 0.5, seed = 7;
  for (let k = 0; k < count; k++) {
    for (let j = 0; j < takes; j++) { const y = syllable(rate, seed++, 0.12 + 0.02 * ((k + j) % 3)); parts.push([t, y]); onsets.push(t); t += 0.8; }
    t += 2.2;
  }
  const x = new Float32Array(Math.round((t + 0.5) * rate));
  parts.forEach(([at, y]) => x.set(y, Math.round(at * rate)));
  let s = 99; for (let i = 0; i < x.length; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; x[i] += 0.0005 * (s / 0x7fffffff * 2 - 1); }
  return { x, onsets };
}

test('solkattu bank: µ-law, resampling and the bank file', t => {
  const { ok, done } = checker(t);
  const V = page(null).VGSolkattu;
  // G.711: silence is 0xFF, the extremes saturate, and a round trip keeps about 7 bits of relative precision
  ok(ulawEncode(0) === 0xff && V.ulaw(0xff) === 0, 'µ-law silence');
  ok(Math.abs(V.ulaw(ulawEncode(1)) - 32124 / 32768) < 1e-9 && Math.abs(V.ulaw(ulawEncode(-1)) + 32124 / 32768) < 1e-9, 'µ-law full scale (G.711 decodes its largest code to 32124)');
  for (let v = -0.9; v <= 0.9; v += 0.0137) { const r = V.ulaw(ulawEncode(v)); ok(Math.abs(r - v) <= Math.max(0.0005, Math.abs(v) * 0.035), 'µ-law round trip of ' + v.toFixed(3) + ' gave ' + r.toFixed(4)); }
  // resampling a 1 kHz sine from 44.1 kHz keeps its level and pitch
  const sr = 44100, sine = Float32Array.from({ length: sr / 2 }, (_, i) => 0.5 * Math.sin(2 * Math.PI * 1000 * i / sr)), r = resample(sine, sr, RATE);
  ok(Math.abs(r.length - RATE / 2) <= 1, 'resampled length');
  let pk = 0, cross = 0; for (let i = 2000; i < r.length - 2000; i++) { pk = Math.max(pk, Math.abs(r[i])); if (r[i - 1] < 0 && r[i] >= 0) cross++; }
  ok(Math.abs(pk - 0.5) < 0.01, 'resampled level ' + pk.toFixed(4));
  ok(Math.abs(cross / ((r.length - 4000) / RATE) - 1000) < 5, 'resampled pitch ' + (cross / ((r.length - 4000) / RATE)).toFixed(1) + ' Hz');
  // the bank file cannot end its comment or close the <script> the build inlines it into
  const evil = { version: 1, rate: RATE, encoding: 'mulaw', speaker: 'A */ </script><b>', license: 'CC BY 4.0', source: '', recorded: '', syllables: { tha: [encode(new Float32Array(160))] } };
  const text = bankText(evil, 'x.wav');
  const head = text.slice(0, text.indexOf('globalThis.'));
  ok(!/<\/script/i.test(text) && (head.match(/\*\//g) || []).length === 1 && head.trimEnd().endsWith('*/'), 'bank text is safe to inline');
  ok(JSON.stringify(page(text).VG_SOLKATTU_BANK) === JSON.stringify(evil), 'bank text evaluates to the bank');
  ok(page(bankText(null)).VG_SOLKATTU_BANK === null && !page(bankText(null)).VGSolkattu.available(), 'an empty bank means synthesized sollus');
  done();
});

test('solkattu bank: finding, grouping and keeping syllables from a recording', t => {
  const { ok, done } = checker(t);
  const rate = 44100, { x, onsets } = session(rate, 4, 4);
  const segs = segments(x, rate);
  ok(segs.length === onsets.length, 'one segment per utterance: ' + segs.length + ' of ' + onsets.length);
  segs.forEach((s, i) => {
    ok(s.start <= onsets[i] + 0.002 && onsets[i] - s.start <= 0.02, 'take ' + i + ' starts just before its consonant (' + ((onsets[i] - s.start) * 1000).toFixed(1) + ' ms early)');
    ok(s.dur > 0.05 && s.dur <= MAX_SEC + 1e-9, 'take ' + i + ' lasts ' + s.dur.toFixed(3) + ' s');
  });
  const gs = groups(segs, 1.5);
  ok(gs.length === 4 && gs.every(g => g.length === 4), 'four syllables of four takes');
  const kept = typical(gs[0], 2);
  ok(kept.length === 2 && segs.indexOf(kept[0]) < segs.indexOf(kept[1]), 'two typical takes kept, in spoken order');
  ok((() => { try { segments(new Float32Array(rate).fill(0.001), rate); return false; } catch (e) { return /too quiet or too noisy/.test(e.message); } })(), 'a recording without speech is refused');

  // a session file in a stated order, and a folder of per-syllable files
  const dir = mkdtempSync(join(tmpdir(), 'vg-sol-'));
  try {
    const file = join(dir, 'session.wav');
    writeFileSync(file, writeWav(x, rate));
    ok(readWav(readFileSync(file)).rate === rate && Math.abs(mono(readWav(readFileSync(file))).length - x.length) === 0, 'WAV read back');
    const res = build([{ file, syllable: null }], { order: ['tha', 'ka', 'dhi', 'mi'], speaker: 'Test', license: 'CC0' });
    ok(Object.keys(res.bank.syllables).join() === 'tha,ka,dhi,mi' && res.missing.length === SYLLABLES.length - 4, 'bank holds the stated syllables, the rest are missing');
    ok(Object.values(res.bank.syllables).every(takes => takes.length === 2), 'two takes per syllable by default');
    const V = page(bankText(res.bank)).VGSolkattu;
    ok(V.available() && V.info().speaker === 'Test' && V.info().rate === RATE, 'the bank loads in a page');
    Object.values(res.bank.syllables).flat().forEach(b64 => { const n = Buffer.from(b64, 'base64').length; ok(n > 0.05 * RATE && n <= MAX_SEC * RATE + 2, 'take of ' + (n / RATE).toFixed(3) + ' s'); });
    ok(res.preview.length > 0, 'a preview to check by ear');
    const wrong = (() => { try { build([{ file, syllable: null }], { order: ['tha', 'ka', 'dhi'], speaker: 'T', license: 'L' }); return ''; } catch (e) { return e.message; } })();
    ok(/found 4 syllables .* expected 3/.test(wrong), 'a session that does not match its order is refused: ' + wrong);
    const sub = join(dir, 'syl'); mkdirSync(sub);
    const one = session(rate, 1, 5).x;
    writeFileSync(join(sub, 'thom.wav'), writeWav(one, rate));
    const per = build([{ file: join(sub, 'thom.wav'), syllable: 'thom' }], { speaker: 'T', license: 'L' });
    ok(Object.keys(per.bank.syllables).join() === 'thom' && per.report[0].takes === 5, 'a per-syllable file');
    const bad = (() => { try { build([{ file: join(sub, 'thom.wav'), syllable: 'xyz' }], {}); return ''; } catch (e) { return e.message; } })();
    ok(/not a sollu/.test(bad), 'an unknown syllable name is refused');
  } finally { rmSync(dir, { recursive: true, force: true }); }
  done();
});

test('solkattu voice: spellings, takes, cuts and fallback', t => {
  const { ok, done } = checker(t);
  const take = sec => encode(new Float32Array(Math.round(sec * RATE)).fill(0.1));
  const bank = { version: 1, rate: RATE, encoding: 'mulaw', speaker: 'T', license: 'L', syllables: { tha: [take(0.2), take(0.25)], ta: [take(0.15)], thom: [take(0.3)] } };
  const V = page(bankText(bank)).VGSolkattu;
  ok(V.key('THA') === 'tha' && V.key('Dhom') === 'thom' && V.key('tom') === 'thom', 'case and spelling aliases');
  ok(V.key('ta') === 'ta' && V.key('tak') === 'tha', 'a recorded spelling wins over its alias');
  ok(V.key('mi') === null && V.key(',') === null, 'unrecorded syllables are left to the synthesizer');
  const ac = fakeAudio(), say = V.voice(ac, {});
  ok(say(1, 'tha', 1) && say(2, 'tha', 1) && say(3, 'tha', 1), 'tha played three times');
  const starts = ac.log.filter(e => e[0] === 'start');
  ok(starts[0][1] !== starts[1][1] && starts[0][1] === starts[2][1], 'takes alternate');
  ok(starts[0][1].duration > 0.19 && starts[1][1].duration > 0.24, 'takes decoded at the bank rate');
  ac.log.length = 0;
  say(5, 'thom', 0.1);
  const ramp = ac.log.find(e => e[0] === 'ramp'), stop = ac.log.find(e => e[0] === 'stop');
  ok(ramp && Math.abs(ramp[2] - 5.1) < 1e-9 && ramp[1] < 0.001 && stop[1] <= 5.12, 'a take is faded out at the next syllable');
  ok(!say(6, 'mi', 0.2), 'a missing syllable returns false');
  const again = V.voice(ac, {}); ac.log.length = 0; again(1, 'tha', 1);
  ok(ac.log.find(e => e[0] === 'start')[1] === starts[0][1], 'each playback starts from the first take');
  ok(JSON.stringify(V.ALIAS) === JSON.stringify(E.ALIAS), 'the voice uses the engine\'s spelling aliases');
  done();
});

test('solkattu bank: the recording list covers the jathi vocabulary, and the committed bank is valid', t => {
  const { ok, done } = checker(t);
  E.KNOWN.forEach(s => ok(SYLLABLES.includes(s), 'the recording guide lists ' + s));
  Object.values(E.SOLLU).flat(2).forEach(s => ok(SYLLABLES.includes(s) || SYLLABLES.includes(E.ALIAS[s]), 'sollu ' + s + ' can be voiced'));
  ok(new Set(SYLLABLES).size === SYLLABLES.length, 'no syllable listed twice');
  const guide = readFileSync(new URL('../docs/solkattu-recording.md', import.meta.url), 'utf8');
  ok(guide.includes(SYLLABLES.join(' ')), 'the guide gives the recording order exactly');
  const g = page(readFileSync(BANK_FILE, 'utf8')), b = g.VG_SOLKATTU_BANK;
  if (b === null) t.diagnostic('the committed bank is empty: sollus are synthesized until syllables are recorded');
  else {
    ok(b.version === 1 && b.rate === RATE && b.encoding === 'mulaw' && b.speaker && b.license, 'bank header with speaker and licence');
    Object.entries(b.syllables).forEach(([s, takes]) => {
      ok(SYLLABLES.includes(s) && takes.length >= 1, s + ': a listed syllable with takes');
      takes.forEach(x => { const n = Buffer.from(x, 'base64').length; ok(n > 0 && n <= MAX_SEC * RATE + 2, s + ': take length'); });
    });
    t.diagnostic(Object.keys(b.syllables).length + ' recorded syllables, spoken by ' + b.speaker);
  }
  done();
});
