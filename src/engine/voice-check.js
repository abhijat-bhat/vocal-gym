/* Vocal Gym engine · Voice Check: the daily probe and its measurements (v0.11)
   A 90-second sung probe, from the research plan's Module B: sustained "aa" on Sa, soft "oo" onsets on upper Pa, an "ng" siren,
   a messa di voce on Sa and Sarali Varisai 1 in akaram. This module measures what was sung. It does not judge it: Phase 1 only
   collects, so that a personal model has history when it ships (research plan, Phase 3). The numbers compare a singer with
   themselves on the same microphone, and nothing here is a diagnosis.

     PROBE                        the steps, in order
     FORM                         the daily short form (three items derived from the Voice Fatigue Index, not yet validated)
     voiceFrames(x, sr)           [{ t, f0, clarity, rms }], one frame every 20 ms
     measureStep(id, x, sr, sa)   the measurements of one step, and whether it heard enough to use
     summariseProbe(steps)        one row of the singer's history
     baseline(history, key)       the median of past days, once there are seven

   Plain numbers and typed arrays only: no browser or Node APIs, no randomness. */

export const PROBE = [
  { id: 'room', title: 'The room', seconds: 3, tells: 'Stay quiet for a moment, so the room can be measured.', sing: false },
  { id: 'aa1', title: 'Sustained “aa” on Sa', seconds: 4, tells: 'Sing “aa” on Sa, steady and comfortable, until the count ends.', cue: 0 },
  { id: 'aa2', title: 'Sustained “aa” on Sa, again', seconds: 4, tells: 'Once more: “aa” on Sa, steady.', cue: 0 },
  { id: 'oo1', title: 'Soft “oo” on upper Pa', seconds: 3, tells: 'Start as softly as you can: a gentle “oo” on upper Pa.', cue: 19 },
  { id: 'oo2', title: 'Soft “oo” on upper Pa', seconds: 3, tells: 'Again, a soft start on upper Pa.', cue: 19 },
  { id: 'oo3', title: 'Soft “oo” on upper Pa', seconds: 3, tells: 'And a third soft start.', cue: 19 },
  { id: 'siren', title: 'An “ng” siren', seconds: 8, tells: 'Hum “ng” and glide from your lowest comfortable note to your highest, and back.' },
  { id: 'messa', title: 'Messa di voce on Sa', seconds: 8, tells: 'One breath on Sa: start soft, swell, and fade back to soft, keeping the pitch still.', cue: 0 },
  { id: 'sarali', title: 'Sarali Varisai 1 in akaram', seconds: 16, tells: 'Sing the first sarali on “aa”, up and down in Mayamalavagowla, one swara to each click.', beats: 16 }
];
/* the first sarali, in semitones above Sa */
export const SARALI_1 = [0, 1, 4, 5, 7, 8, 11, 12, 12, 11, 8, 7, 5, 4, 1, 0];
export const PROBE_SECONDS = PROBE.reduce((s, p) => s + p.seconds, 0);

export const FORM = [
  { id: 'tired', text: 'My voice got tired as I used it yesterday.' },
  { id: 'effort', text: 'It took effort to sing or speak.' },
  { id: 'recover', text: 'My voice felt better after resting it.' }
];
export const FORM_SCALE = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];

const log10 = x => Math.log(x) / Math.LN10;
const median = a => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const pct = (a, q) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.max(0, Math.round(q * (s.length - 1))))]; };
const sd = a => { if (a.length < 2) return 0; const m = a.reduce((s, x) => s + x, 0) / a.length; return Math.sqrt(a.reduce((s, x) => s + (x - m) * (x - m), 0) / a.length); };
const round = (x, k) => (x == null || !Number.isFinite(x) ? null : Math.round(x * 10 ** k) / 10 ** k);
const db = x => 20 * log10(Math.max(x, 1e-6));
const cents = (f, ref) => 1200 * Math.log2(f / ref);

/* to about 16 kHz, averaging, which is enough for the voice's fundamental and the tilt below 5 kHz */
function decimate(x, sr) {
  const k = Math.max(1, Math.floor(sr / 16000));
  if (k === 1) return { x, sr };
  const n = Math.floor(x.length / k), y = new Float32Array(n);
  for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < k; j++) s += x[i * k + j]; y[i] = s / k; }
  return { x: y, sr: sr / k };
}

/* normalised autocorrelation in 40 ms windows every 20 ms. clarity is the height of the peak (0–1): how periodic the frame is. */
export function voiceFrames(input, inputRate, opts) {
  const o = opts || {}, { x, sr } = decimate(input, inputRate);
  const win = Math.round(sr * 0.04), hop = Math.round(sr * 0.02);
  const minLag = Math.max(2, Math.floor(sr / (o.fmax || 1100))), maxLag = Math.min(win - 1, Math.ceil(sr / (o.fmin || 65)));
  const out = [], nc = new Float32Array(maxLag + 2);
  for (let start = 0; start + win + maxLag < x.length; start += hop) {
    let e0 = 0, mean = 0;
    for (let i = 0; i < win; i++) mean += x[start + i];
    mean /= win;
    for (let i = 0; i < win; i++) { const a = x[start + i] - mean; e0 += a * a; }
    const rms = Math.sqrt(e0 / win);
    let best = 0, bestLag = 0;
    if (rms > 1e-4) {
      for (let lag = minLag; lag <= maxLag; lag++) {
        let c = 0, e1 = 0;
        for (let i = 0; i < win; i++) { const a = x[start + i] - mean, b = x[start + i + lag] - mean; c += a * b; e1 += b * b; }
        const r = c / Math.sqrt(e0 * e1 + 1e-12);
        nc[lag] = r;
        if (r > best) best = r;
      }
      // the shortest lag nearly as strong as the best, so a period is not mistaken for two of itself
      for (let lag = minLag + 1; lag < maxLag; lag++) if (nc[lag] >= 0.92 * best && nc[lag] >= nc[lag - 1] && nc[lag] >= nc[lag + 1]) { bestLag = lag; break; }
    }
    let f0 = 0;
    if (bestLag) {
      const a = nc[bestLag - 1], b = nc[bestLag], c = nc[bestLag + 1], den = a - 2 * b + c, shift = den ? 0.5 * (a - c) / den : 0;
      f0 = sr / (bestLag + shift);
    }
    out.push({ t: start / sr, f0, clarity: Math.max(0, Math.min(1, best)), rms });
  }
  return out;
}

const isVoiced = (fr, floor) => fr.f0 > 0 && fr.clarity >= 0.72 && fr.rms >= floor;
const voicedOf = frames => { const peak = Math.max(0, ...frames.map(f => f.rms)), floor = Math.max(peak * 0.06, 1e-3); return frames.filter(f => isVoiced(f, floor)); };

/* real FFT, radix 2; re and im in place */
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let j = 0; j < len / 2; j++) {
        const ur = re[i + j], ui = im[i + j], vr = re[i + j + len / 2] * cr - im[i + j + len / 2] * ci, vi = re[i + j + len / 2] * ci + im[i + j + len / 2] * cr;
        re[i + j] = ur + vr; im[i + j] = ui + vi; re[i + j + len / 2] = ur - vr; im[i + j + len / 2] = ui - vi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}

/* over voiced frames: cepstral peak prominence (dB) and the spectrum's tilt (dB per octave, 100 Hz to 5 kHz) */
function spectralMeasures(input, inputRate, voiced) {
  const { x, sr } = decimate(input, inputRate), N = 1024;
  if (!voiced.length || x.length < N) return { cpp: null, tilt: null };
  const hann = new Float32Array(N); for (let i = 0; i < N; i++) hann[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1));
  const mean = new Float32Array(N / 2), step = Math.max(1, Math.floor(voiced.length / 40)), cpps = [];
  let used = 0;
  for (let v = 0; v < voiced.length; v += step) {
    const s = Math.floor(voiced[v].t * sr); if (s + N >= x.length) continue;
    const re = new Float32Array(N), im = new Float32Array(N);
    for (let i = 0; i < N; i++) re[i] = x[s + i] * hann[i];
    fft(re, im);
    const lg = new Float32Array(N);
    for (let i = 0; i < N / 2; i++) { const p = re[i] * re[i] + im[i] * im[i], d = 10 * log10(p + 1e-12); lg[i] = d; if (i) lg[N - i] = d; mean[i] += d; }
    lg[N / 2] = lg[N / 2 - 1];
    used++;
    // the cepstrum: its peak at the voice's period stands above the trend in a clear voice
    const cr = lg.slice(), ci = new Float32Array(N);
    fft(cr, ci);
    const lo = Math.floor(sr / 1100), hi = Math.min(N / 2 - 1, Math.ceil(sr / 65));
    let pk = -Infinity, pkAt = lo, sx = 0, sy = 0, sxx = 0, sxy = 0, n = 0;
    for (let q = lo; q <= hi; q++) { const c = 20 * log10(Math.abs(cr[q]) / N + 1e-9); if (c > pk) { pk = c; pkAt = q; } sx += q; sy += c; sxx += q * q; sxy += q * c; n++; }
    const b = (n * sxy - sx * sy) / (n * sxx - sx * sx || 1), a = (sy - b * sx) / n;
    cpps.push(pk - (a + b * pkAt));
  }
  if (!used) return { cpp: null, tilt: null };
  // the slope through the voice's own partials, read at each harmonic of its pitch; the valleys between them are not the voice
  const f0 = median(voiced.map(f => f.f0)), parts = [];
  for (let h = 1; h * f0 < Math.min(5000, sr / 2 - 50); h++) {
    const at = h * f0 * N / sr, lo = Math.max(1, Math.floor(at - 1)), hi = Math.min(N / 2 - 1, Math.ceil(at + 1));
    let best = -Infinity; for (let i = lo; i <= hi; i++) best = Math.max(best, mean[i] / used);
    parts.push([Math.log2(h * f0), best]);
  }
  const top = parts.length ? Math.max(...parts.map(b => b[1])) : 0;
  let sx = 0, sy = 0, sxx = 0, sxy = 0, n = 0;
  parts.filter(b => b[1] > top - 45).forEach(([o, d]) => { sx += o; sy += d; sxx += o * o; sxy += o * d; n++; });
  return { cpp: median(cpps), tilt: n > 2 ? (n * sxy - sx * sy) / (n * sxx - sx * sx) : null };
}

/* frames in which the voice broke off and came back */
function breaksOf(frames) {
  const peak = Math.max(0, ...frames.map(f => f.rms)), floor = Math.max(peak * 0.06, 1e-3);
  let breaks = 0, seen = false, gap = 0;
  frames.forEach(f => { if (isVoiced(f, floor)) { if (seen && gap >= 4) breaks++; seen = true; gap = 0; } else if (seen) gap++; });
  return breaks;
}

/* the middle of a held note, where it has settled */
const settled = v => v.slice(Math.floor(v.length * 0.2), Math.ceil(v.length * 0.8));

/* id: a step of PROBE. samples: mono. sa: the Sa of the drone, in Hz. → { id, heard, voicedSec, ... } in plain numbers */
export function measureStep(id, samples, sr, sa) {
  const frames = voiceFrames(samples, sr), step = PROBE.find(p => p.id === id);
  if (!step) throw new RangeError('No step ' + id + ' in the probe.');
  if (id === 'room') { const r = frames.map(f => f.rms); return { id, heard: true, voicedSec: 0, roomDb: round(db(median(r) || 1e-6), 1) }; }
  const v = voicedOf(frames), voicedSec = v.length * 0.02;
  const out = { id, heard: voicedSec >= Math.min(1, step.seconds * 0.3), voicedSec: round(voicedSec, 2) };
  if (!out.heard) return out;
  const s = spectralMeasures(samples, sr, v);
  const hnrs = v.map(f => 10 * log10(Math.max(f.clarity, 1e-3) / Math.max(1 - f.clarity, 1e-3)));
  out.hnr = round(median(hnrs), 1); out.cpp = round(s.cpp, 1); out.tilt = round(s.tilt, 1); out.levelDb = round(db(median(v.map(f => f.rms))), 1);
  const f0s = v.map(f => f.f0);
  if (id === 'aa1' || id === 'aa2' || id === 'oo1' || id === 'oo2' || id === 'oo3' || id === 'messa') {
    const mid = settled(v), m = median(mid.map(f => f.f0));
    out.f0 = round(m, 1);
    out.stabilityCents = round(sd(mid.map(f => cents(f.f0, m))), 1);
    if (sa) { const c = cents(m, sa * 2 ** ((step.cue || 0) / 12)); out.offCents = round(c - 1200 * Math.round(c / 1200), 1); }
    const first = v.findIndex((f, i) => Math.abs(cents(f.f0, m)) <= 50 && v.slice(i, i + 5).every(g => Math.abs(cents(g.f0, m)) <= 50));
    out.onsetSec = first >= 0 ? round(v[first].t - v[0].t, 2) : null;
    out.breaks = breaksOf(frames);
  }
  if (id === 'siren') {
    const lo = pct(f0s, 0.02), hi = pct(f0s, 0.98);
    out.lowHz = round(lo, 1); out.highHz = round(hi, 1); out.rangeSemis = round(12 * Math.log2(hi / lo), 1); out.breaks = breaksOf(frames);
  }
  if (id === 'messa') {
    const lv = v.map(f => db(f.rms));
    out.swellDb = round(pct(lv, 0.95) - pct(lv, 0.05), 1);
    const third = Math.floor(v.length / 3), part = (a, b) => median(v.slice(a, b).map(f => f.f0));
    out.driftCents = third ? round(Math.max(Math.abs(cents(part(0, third), part(third, 2 * third))), Math.abs(cents(part(2 * third, v.length), part(third, 2 * third)))), 1) : null;
  }
  if (id === 'sarali' && sa) {
    // each click's swara against the raga's pitch, in the octave nearest to what was sung
    const beat = step.seconds / SARALI_1.length, errs = [];
    SARALI_1.forEach((semi, k) => {
      const here = v.filter(f => f.t >= k * beat + beat * 0.25 && f.t < (k + 1) * beat - beat * 0.1);
      if (here.length < 3) return;
      const c = cents(median(here.map(f => f.f0)), sa * 2 ** (semi / 12));
      errs.push(Math.abs(c - 1200 * Math.round(c / 1200)));
    });
    out.notesHeard = errs.length; out.meanOffCents = round(errs.reduce((a, b) => a + b, 0) / Math.max(1, errs.length), 1);
  }
  return out;
}

/* one row of history: the medians over the steps that were heard */
export function summariseProbe(steps) {
  const by = id => steps.find(s => s.id === id && s.heard);
  const held = ['aa1', 'aa2'].map(by).filter(Boolean), soft = ['oo1', 'oo2', 'oo3'].map(by).filter(Boolean), sung = steps.filter(s => s.heard && s.id !== 'room');
  const med = (list, k) => round(median(list.map(s => s[k]).filter(x => x != null)), 1);
  const room = by('room'), siren = by('siren'), messa = by('messa'), sarali = by('sarali');
  return {
    stepsHeard: sung.length,
    roomDb: room ? room.roomDb : null,
    stabilityCents: med(held, 'stabilityCents'), offCents: med(held, 'offCents'),
    hnr: med(held, 'hnr'), cpp: med(held, 'cpp'), tilt: med(held, 'tilt'),
    softOnsetSec: med(soft, 'onsetSec'), softBreaks: soft.reduce((n, s) => n + (s.breaks || 0), 0), softHeard: soft.length,
    rangeSemis: siren ? siren.rangeSemis : null, lowHz: siren ? siren.lowHz : null, highHz: siren ? siren.highHz : null,
    swellDb: messa ? messa.swellDb : null, driftCents: messa ? messa.driftCents : null,
    saraliOffCents: sarali ? sarali.meanOffCents : null
  };
}

/* the singer's own usual, once there is enough of it */
export const BASELINE_DAYS = 7;
export function baseline(history, key) {
  const days = new Map();
  (history || []).forEach(h => { const v = h.features && h.features[key]; if (v != null && !days.has(h.localDate)) days.set(h.localDate, v); });
  return days.size >= BASELINE_DAYS ? round(median(Array.from(days.values())), 1) : null;
}
