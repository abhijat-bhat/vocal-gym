/* Vocal Gym · build the recorded-syllable bank for jathi playback (docs/solkattu-recording.md)
   Reads WAV recordings of spoken solkattu syllables, finds every utterance, keeps the most typical
   takes of each syllable, trims and level-matches them, resamples them to 16 kHz and writes them as
   8-bit µ-law in web/shared/solkattu-bank.js, which web/shared/solkattu.js plays. No dependencies.

   Usage
     node scripts/solkattu-bank.js --in recordings/ --speaker "Name" --license "CC BY 4.0"
         a folder of WAV files named after their syllable (tha.wav, ka.wav, …), each saying it 3 to 6 times
     node scripts/solkattu-bank.js --in session.wav --speaker "Name" --license "CC BY 4.0"
         one WAV that says each syllable 3 to 6 times, in the guide's order, with a long pause between syllables
   Options
     --order "tha ka …"   the syllables of a single-file session, if not the full guide order
     --takes 2            takes kept per syllable         --group-gap 1.5  seconds of silence between syllables
     --source "…"         where and when it was recorded    --preview file.wav  every kept take, for checking by ear
     --dry                report only, write nothing        --clear          write an empty bank (synthesized sollus)
   The WAVs may be 16-, 24- or 32-bit PCM or 32-bit float, mono or stereo, at any rate of 16 kHz or more. */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, basename, extname, dirname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const BANK_FILE = join(root, 'web', 'shared', 'solkattu-bank.js');
export const RATE = 16000;    // keeps the consonant bursts (to 8 kHz) at a third of the size of CD rate
export const MAX_SEC = 0.4;    // the longest a kept syllable may ring
export const TAIL_DB = 30;     // a take ends where it has decayed this far below its own peak
/* the recording order of docs/solkattu-recording.md: konnakol syllables, then dance syllables, then rarer ones */
export const SYLLABLES = ['tha', 'ka', 'ki', 'ta', 'dhi', 'mi', 'gi', 'na', 'thom', 'jho', 'nu',
  'tat', 'tai', 'tam', 'ya', 'hat', 'hi', 'dhit', 'dhim', 'jham', 'nam',
  'ri', 'ku', 'lan', 'gu', 'ga', 'num', 'ha'];

/* ---------- WAV in and out ---------- */
export function readWav(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') throw new Error('not a WAV file (RIFF/WAVE header missing); export the recording as WAV');
  let p = 12, fmt = null, data = null;
  while (p + 8 <= buf.length) {
    const id = buf.toString('ascii', p, p + 4), size = buf.readUInt32LE(p + 4), body = p + 8;
    if (id === 'fmt ') fmt = { format: buf.readUInt16LE(body), channels: buf.readUInt16LE(body + 2), rate: buf.readUInt32LE(body + 4), bits: buf.readUInt16LE(body + 14), sub: size >= 26 ? buf.readUInt16LE(body + 24) : null };
    else if (id === 'data') data = { start: body, size: Math.min(size, buf.length - body) };
    p = body + size + (size & 1);
  }
  if (!fmt || !data) throw new Error('WAV file without a fmt or data chunk');
  const format = fmt.format === 0xfffe ? fmt.sub : fmt.format, bytes = fmt.bits / 8, frames = Math.floor(data.size / (bytes * fmt.channels));
  if (!(format === 1 && [16, 24, 32].includes(fmt.bits)) && !(format === 3 && fmt.bits === 32)) throw new Error('unsupported WAV encoding (format ' + format + ', ' + fmt.bits + ' bits); use 16- or 24-bit PCM or 32-bit float');
  const channels = Array.from({ length: fmt.channels }, () => new Float32Array(frames));
  for (let i = 0; i < frames; i++) for (let c = 0; c < fmt.channels; c++) {
    const o = data.start + (i * fmt.channels + c) * bytes;
    channels[c][i] = format === 3 ? buf.readFloatLE(o) : fmt.bits === 16 ? buf.readInt16LE(o) / 32768 : fmt.bits === 24 ? buf.readIntLE(o, 3) / 8388608 : buf.readInt32LE(o) / 2147483648;
  }
  return { rate: fmt.rate, channels };
}
export function writeWav(samples, rate) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + samples.length * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(rate, 24); buf.writeUInt32LE(rate * 2, 28);
  buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + i * 2);
  return buf;
}
/* mono, without DC or rumble below about 60 Hz */
export function mono({ rate, channels }) {
  const n = channels[0].length, x = new Float32Array(n), a = Math.exp(-2 * Math.PI * 60 / rate);
  let prevIn = 0, prevOut = 0;
  for (let i = 0; i < n; i++) {
    let s = 0; for (const ch of channels) s += ch[i];
    s /= channels.length;
    prevOut = a * (prevOut + s - prevIn); prevIn = s; x[i] = prevOut;
  }
  return x;
}

/* ---------- finding the syllables ---------- */
const HOP = 0.005, WIN = 0.01;
export function envelope(x, rate) {
  const hop = Math.round(HOP * rate), win = Math.round(WIN * rate), n = Math.max(0, Math.floor((x.length - win) / hop) + 1), db = new Float32Array(n);
  for (let f = 0; f < n; f++) { let s = 0; for (let i = f * hop; i < f * hop + win; i++) s += x[i] * x[i]; db[f] = 10 * Math.log10(s / win + 1e-12); }
  return db;
}
const pct = (arr, q) => { const s = Array.from(arr).sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : -120; };
/* every utterance: [{ start, end, dur, level }] in seconds; start sits a few ms before the consonant */
export function segments(x, rate) {
  const db = envelope(x, rate), floor = pct(db, 0.1), peak = pct(db, 0.995);
  if (peak - floor < 20) throw new Error('the recording is too quiet or too noisy: speech is only ' + (peak - floor).toFixed(0) + ' dB above the background (20 dB needed)');
  // frame times use the hop actually used (221 samples at 44.1 kHz is 5.011 ms), so long recordings do not drift
  const h = Math.round(HOP * rate) / rate, w = Math.round(WIN * rate) / rate;
  const on = Math.max(floor + 12, peak - 30), off = floor + 8, F = s => Math.round(s / h);
  const cores = [];
  let s0 = -1;
  for (let f = 0; f <= db.length; f++) {
    const up = f < db.length && db[f] >= on;
    if (up && s0 < 0) s0 = f;
    if (!up && s0 >= 0) { cores.push([s0, f]); s0 = -1; }
  }
  const merged = [];
  cores.forEach(c => { const last = merged[merged.length - 1]; if (last && c[0] - last[1] < F(0.08)) last[1] = c[1]; else merged.push(c.slice()); });
  return merged.filter(c => c[1] - c[0] >= F(0.03)).map(([a, b]) => {
    let s = a, e = b, level = -120;
    for (let f = a; f < b; f++) level = Math.max(level, db[f]);
    const tail = Math.max(off, level - TAIL_DB);
    while (s > 0 && a - s < F(0.06) && db[s - 1] > off) s--;
    while (e < db.length && e - b < F(0.3) && db[e] > tail) e++;
    const start = Math.max(0, s * h - 0.005), end = Math.min(x.length / rate, Math.min(e * h + w + 0.015, start + MAX_SEC));
    return { start, end, dur: end - start, level };
  });
}
/* utterances split into syllables wherever the silence is at least `gap` seconds */
export function groups(segs, gap) {
  const out = [];
  segs.forEach((s, i) => { if (!i || s.start - segs[i - 1].end >= gap) out.push([]); out[out.length - 1].push(s); });
  return out;
}
/* the `n` most typical takes, by duration and loudness, in their spoken order */
export function typical(takes, n) {
  const med = a => pct(a, 0.5), md = med(takes.map(t => t.dur)), ml = med(takes.map(t => t.level));
  return takes.map((t, i) => ({ t, i, d: Math.abs(t.dur - md) / Math.max(0.05, md) + Math.abs(t.level - ml) / 6 }))
    .sort((a, b) => a.d - b.d).slice(0, n).sort((a, b) => a.i - b.i).map(x => x.t);
}

/* ---------- shaping, resampling and encoding a take ---------- */
export function clip(x, rate, seg) {
  const a = Math.floor(seg.start * rate), b = Math.min(x.length, Math.ceil(seg.end * rate)), y = Float32Array.from(x.subarray(a, b));
  // level-match: the loudest 10 ms at −14 dBFS, the peak below −0.5 dBFS
  const db = envelope(y, rate);
  let loud = -120; for (const v of db) loud = Math.max(loud, v);
  let g = Math.pow(10, (-14 - loud) / 20), pk = 0;
  for (const v of y) pk = Math.max(pk, Math.abs(v));
  g = Math.min(g, 0.944 / Math.max(1e-9, pk));
  const fin = Math.round(0.003 * rate), fout = Math.round(0.025 * rate);
  for (let i = 0; i < y.length; i++) y[i] *= g * Math.min(1, i / fin, (y.length - 1 - i) / fout);
  return y;
}
const sinc = u => u === 0 ? 1 : Math.sin(Math.PI * u) / (Math.PI * u);
/* windowed-sinc (Blackman, 16 zero crossings) resampling, low-passed below the new Nyquist */
export function resample(x, from, to) {
  if (from === to) return Float32Array.from(x);
  const ratio = to / from, n = Math.floor(x.length * ratio), out = new Float32Array(n), fc = Math.min(1, ratio) * 0.95, Z = 16, half = Z / fc;
  for (let i = 0; i < n; i++) {
    const c = i / ratio, k0 = Math.max(0, Math.ceil(c - half)), k1 = Math.min(x.length - 1, Math.floor(c + half));
    let s = 0;
    for (let k = k0; k <= k1; k++) { const d = (c - k) * fc, w = 0.42 + 0.5 * Math.cos(Math.PI * d / Z) + 0.08 * Math.cos(2 * Math.PI * d / Z); s += x[k] * fc * sinc(d) * w; }
    out[i] = s;
  }
  return out;
}
/* G.711 µ-law */
export function ulawEncode(v) {
  let s = Math.round(Math.max(-1, Math.min(1, v)) * 32767);
  const sign = s < 0 ? 0x80 : 0;
  s = Math.min(32635, Math.abs(s)) + 0x84;
  let exp = 7;
  for (let m = 0x4000; (s & m) === 0 && exp > 0; m >>= 1) exp--;
  return ~(sign | (exp << 4) | ((s >> (exp + 3)) & 0x0f)) & 0xff;
}
export const encode = y => Buffer.from(Array.from(y, ulawEncode)).toString('base64');

/* ---------- the bank ---------- */
export function bankText(bank, from) {
  // names and notes can neither end the comment nor close the <script> the build inlines this into
  const safe = s => String(s).replace(/\*\//g, '* /').replace(/</g, '‹');
  const head = '/* Generated by scripts/solkattu-bank.js' + (from ? ' from ' + safe(from) : '') + '; do not edit. Recorded syllables for jathi playback,\n   played by web/shared/solkattu.js (docs/solkattu-recording.md). ' +
    (bank ? 'Speaker: ' + safe(bank.speaker) + '. Licence: ' + safe(bank.license) + '. ' + Object.keys(bank.syllables).length + ' syllables.' : 'Empty: no recordings yet, so sollus are synthesized.') + ' */\n';
  return head + 'globalThis.VG_SOLKATTU_BANK = ' + (bank ? JSON.stringify(bank).replace(/</g, '\\u003c') : 'null') + ';\n';
}
/* recordings: [{ file, syllable | null }] → { bank, report, preview } */
export function build(recordings, opts) {
  const o = Object.assign({ takes: 2, groupGap: 1.5 }, opts), found = [], report = [];
  recordings.forEach(r => {
    const wav = readWav(readFileSync(r.file)), x = mono(wav);
    if (wav.rate < RATE) throw new Error(r.file + ': recorded at ' + wav.rate + ' Hz; ' + RATE + ' Hz or more is needed');
    const segs = segments(x, wav.rate);
    if (r.syllable) found.push({ syllable: r.syllable, file: r.file, x, rate: wav.rate, takes: segs });
    else {
      const order = o.order || SYLLABLES, gs = groups(segs, o.groupGap);
      if (gs.length !== order.length) throw new Error(basename(r.file) + ': found ' + gs.length + ' syllables (groups of ' + gs.map(g => g.length).join(', ') + ' takes, split at ' + o.groupGap + ' s of silence) but expected ' + order.length + ' (' + order.join(' ') + '). Pass --order with what was recorded, or --group-gap.');
      gs.forEach((g, k) => found.push({ syllable: order[k], file: r.file, x, rate: wav.rate, takes: g }));
    }
  });
  const syllables = {}, preview = [], gap = new Float32Array(Math.round(0.35 * RATE));
  let t = 0;
  found.forEach(f => {
    if (!SYLLABLES.includes(f.syllable)) throw new Error(f.file + ': ' + f.syllable + ' is not a sollu the jathi engine uses (' + SYLLABLES.join(' ') + ')');
    if (syllables[f.syllable]) throw new Error(f.syllable + ' is recorded twice');
    const kept = typical(f.takes, o.takes), clips = kept.map(s => resample(clip(f.x, f.rate, s), f.rate, RATE));
    syllables[f.syllable] = clips.map(encode);
    const warn = f.takes.length < 2 ? 'only one take' : f.takes.length > 8 ? f.takes.length + ' takes: are two syllables run together?' : '';
    report.push({ syllable: f.syllable, takes: f.takes.length, kept: kept.length, ms: clips.map(c => Math.round(c.length / RATE * 1000)), at: t, warn });
    clips.forEach(c => { preview.push(c, gap); t += (c.length + gap.length) / RATE; });
  });
  const order = SYLLABLES.filter(s => syllables[s]), bank = {
    version: 1, rate: RATE, encoding: 'mulaw', speaker: o.speaker || '', license: o.license || '', source: o.source || '', recorded: o.recorded || '',
    syllables: Object.fromEntries(order.map(s => [s, syllables[s]]))
  };
  const all = new Float32Array(preview.reduce((s, c) => s + c.length, 0));
  let p = 0; preview.forEach(c => { all.set(c, p); p += c.length; });
  return { bank, report: order.map(s => report.find(r => r.syllable === s)), preview: all, missing: SYLLABLES.filter(s => !syllables[s]) };
}

function cli(argv) {
  const opt = {}, flags = new Set(['dry', 'clear']);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { console.error('solkattu-bank: unexpected ' + a); return 2; }
    const k = a.slice(2);
    if (flags.has(k)) opt[k] = true; else opt[k] = argv[++i];
  }
  if (opt.clear) { writeFileSync(BANK_FILE, bankText(null)); console.log(relative(root, BANK_FILE) + ': empty bank written; sollus are synthesized'); return 0; }
  if (!opt.in) { console.error('solkattu-bank: give --in <folder of syllable WAVs | one session WAV> (see docs/solkattu-recording.md)'); return 2; }
  if (!opt.speaker || !opt.license) { console.error('solkattu-bank: give --speaker "Name" and --license "…" (the speaker\'s permission, for example CC BY 4.0)'); return 2; }
  let recordings;
  if (statSync(opt.in).isDirectory()) {
    recordings = readdirSync(opt.in).filter(f => extname(f).toLowerCase() === '.wav').map(f => ({ file: join(opt.in, f), syllable: basename(f, extname(f)).toLowerCase() }));
    if (!recordings.length) { console.error('solkattu-bank: no .wav files in ' + opt.in); return 2; }
  } else recordings = [{ file: opt.in, syllable: null }];
  const order = opt.order ? opt.order.trim().split(/\s+/).map(s => s.toLowerCase()) : null;
  const { bank, report, preview, missing } = build(recordings, { takes: +(opt.takes || 2), groupGap: +(opt['group-gap'] || 1.5), order, speaker: opt.speaker, license: opt.license, source: opt.source || '', recorded: new Date().toISOString().slice(0, 10) });
  report.forEach(r => console.log(r.syllable.padEnd(5) + ' ' + String(r.takes).padStart(2) + ' takes, kept ' + r.kept + ' (' + r.ms.join(', ') + ' ms)  preview at ' + r.at.toFixed(2) + ' s' + (r.warn ? '  ⚠ ' + r.warn : '')));
  if (missing.length) console.log('Not recorded (synthesized instead): ' + missing.join(' '));
  const text = bankText(bank, recordings.map(r => basename(r.file)).join(', '));
  console.log('Bank: ' + Object.keys(bank.syllables).length + ' syllables, ' + (text.length / 1024).toFixed(0) + ' KB');
  if (opt.preview) { writeFileSync(opt.preview, writeWav(preview, RATE)); console.log('Preview: ' + opt.preview + ' (listen and check each take against the times above)'); }
  if (opt.dry) return 0;
  writeFileSync(BANK_FILE, text);
  console.log('Wrote ' + relative(root, BANK_FILE) + '; run npm run build to put it in the pages.');
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.exitCode = cli(process.argv.slice(2)); } catch (e) { console.error('solkattu-bank: ' + e.message); process.exitCode = 1; }
}
