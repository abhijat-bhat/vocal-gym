/* Vocal Gym · the singing voice for kalpana and alankara playback (docs/research/expressive-voice.md)
   A classic script shared by the playground pages (inlined by scripts/build.js), the app (served at
   /shared/) and Node (scripts/render-wav.js and the tests load it in a vm). It sets globalThis.VGVoice:
     lineOf(contour)                renderGamaka's output, or the CLI's --contour json, as a line to sing
     render(line, opts)             the line sung as a Float32Array at opts.sr; deterministic
     play(ac, out, t0, line, opts)  renders at the context's sample rate (or takes samples rendered at it)
                                    and plays them from t0; returns the end
   line   { groups: [{ t0, t1, points: [{ t, p }] or [[t, p]], gain?: [{ t, g }] or [[t, g]] }],
            notes: [{ t0, t1, p, onset, consonant, vowel, accent }] }   p in semitones from Sa
   opts   { sa = 261.63, sr = 44100, timbre = 'aa' | 'swaram', level = 0.3, seed = 1, octave = -1 }
          octave: where the voice sings relative to sa, the drone's Sa. By default an octave below it (v0.8.7:
          at sa itself, C4 and up, the voice sat in a thin, high register that was tiring to hear); 0 sings at
          sa as before. Below sa the vowel formants are a lower voice's.
          'aa' sings the line on the vowel a (akaram), re-articulating each swara softly; 'swaram' sings
          the swara names (sa ri ga ma pa dha ni) with their consonants and vowels.
   The voice is a source-filter model computed per harmonic (alias-free additive synthesis):
     source    harmonics falling as h^−s, the slope s following the loudness (a louder voice is brighter)
     filter    four vowel formants as a cascade of resonators, formant 1 raised to stay above the pitch
               (formant tuning, as sopranos and high voices do), so the timbre changes with the pitch the
               way a voice's does and not the way a stretched waveform's would
     noise     breath (aspiration) pulsed with the glottal cycle, a little stronger at phrase onsets; kept below
               the voice's own spectrum (centred near 1.5 kHz, low-passed at 3.2 kHz) and about 50 dB under it,
               so it reads as breathiness and not as hiss (v0.8.6: it was a broadband band at 2.7 kHz only
               20 dB under the voice above 4 kHz, where the voice has little energy and above 5.4 kHz none)
     micro     jitter (a few cents of slow random pitch wander) and shimmer (2% amplitude wander)
     onsets    in 'swaram', each swara's consonant: s a fricative, p a voiceless stop with a burst and
               aspiration, g d dh voiced stops (dh aspirated), m n nasal murmurs, r a tap; placed before the
               beat so the vowel lands on it. A jaru glides in without one.
   The pitch contour (with its gamaka) and the loudness curve come from the engine; the voice adds only
   timbre. No Math.random: the noise is a seeded generator, so the same line gives the same samples. */
(function (g) {
  'use strict';
  const PRE = 0.1;      // seconds rendered before the line starts (consonants come before the beat)
  const REL = 0.16;     // the release after a group's last swara
  const BLOCK = 32;     // control-rate block, in samples
  const MAXF = 5400, FADE = 4300;   // harmonics fade out between FADE and MAXF Hz
  const TABLE = 4096, SIN = new Float32Array(TABLE + 1);
  for (let i = 0; i <= TABLE; i++) SIN[i] = Math.sin(2 * Math.PI * i / TABLE);
  const sinT = x => { const y = (x - Math.floor(x)) * TABLE, i = y | 0; return SIN[i] + (SIN[i + 1] - SIN[i]) * (y - i); };
  const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
  const ss = x => { const u = clamp(x, 0, 1); return u * u * (3 - 2 * u); };

  // vowel formants [F, B] in Hz (Peterson & Barney 1952 means for /ɑ/ and /i/, a fourth formant added): a
  // high voice's (women's means) for the Sa = C4 register, a low voice's (men's means) an octave below
  const VOWEL = {
    a: [[850, 90], [1220, 100], [2810, 150], [3800, 220]],
    i: [[310, 70], [2790, 120], [3310, 160], [4100, 240]]
  };
  const VOWEL_LOW = {
    a: [[730, 80], [1090, 90], [2440, 130], [3400, 200]],
    i: [[270, 60], [2290, 110], [3010, 150], [3700, 220]]
  };
  // consonant onsets, relative to the beat (s): the voice's dip [start, down, up, end] and depth, the
  // spectral closure (voiced stops, the tap) or nasal murmur, and noise: a fricative band, a burst, an
  // aspiration
  const CONS = {
    s: { dip: [-0.085, -0.06, -0.014, 0.01], depth: 0.03, fric: [-0.09, -0.07, -0.016, 0.006], fricAmp: 0.07, fricHz: 5200 },
    p: { dip: [-0.065, -0.05, 0.0, 0.014], depth: 0.0, burst: 0.0, burstAmp: 0.3, burstHz: 1200, asp: [0, 0.004, 0.012, 0.038], aspAmp: 0.09 },
    g: { dip: [-0.06, -0.045, -0.004, 0.01], depth: 0.28, close: 1, burst: -0.003, burstAmp: 0.14, burstHz: 1900 },
    d: { dip: [-0.06, -0.045, -0.004, 0.01], depth: 0.28, close: 1, burst: -0.003, burstAmp: 0.14, burstHz: 3900 },
    dh: { dip: [-0.06, -0.045, -0.004, 0.012], depth: 0.28, close: 1, burst: -0.003, burstAmp: 0.13, burstHz: 3600, asp: [0, 0.005, 0.02, 0.055], aspAmp: 0.07 },
    m: { dip: [-0.065, -0.05, -0.006, 0.012], depth: 0.5, nasal: 1 },
    n: { dip: [-0.065, -0.05, -0.006, 0.012], depth: 0.5, nasal: 1 },
    r: { dip: [-0.032, -0.02, -0.013, 0.0], depth: 0.38, close: 0.6 }
  };
  const REARTICULATE = { dip: [-0.032, -0.014, -0.008, 0.012], depth: 0.72 };   // 'aa': a soft new swara

  // a seeded generator (an LCG): white noise and slow wander without Math.random
  function lcg(seed) { let s = (seed >>> 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  // a band-pass biquad (RBJ), as a stateful function
  function bandpass(hz, q, sr) {
    const w = 2 * Math.PI * hz / sr, al = Math.sin(w) / (2 * q), a0 = 1 + al;
    const b0 = al / a0, b2 = -al / a0, a1 = -2 * Math.cos(w) / a0, a2 = (1 - al) / a0;
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    return x => { const yv = b0 * x + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = yv; return yv; };
  }
  // a one-pole low-pass, as a stateful function (two in series keep the breath under the voice's top)
  function lowpass(hz, sr) { const a = Math.exp(-2 * Math.PI * hz / sr); let yv = 0; return x => (yv = (1 - a) * x + a * yv); }
  // the window of a consonant gesture: 0 before a, rising to 1 by b, 1 until c, falling to 0 by d
  const win = (t, w) => t <= w[0] || t >= w[3] ? 0 : t < w[1] ? ss((t - w[0]) / (w[1] - w[0])) : t <= w[2] ? 1 : 1 - ss((t - w[2]) / (w[3] - w[2]));
  // the cascade formant filter's magnitude at f
  function envAt(f, F) {
    let m = 1;
    for (let k = 0; k < F.length; k++) { const Fk = F[k][0], Bk = F[k][1], d = Fk * Fk - f * f; m *= Fk * Fk / Math.sqrt(d * d + Bk * Bk * f * f); }
    return m;
  }
  const tp = x => Array.isArray(x) ? x : [x.t, x.p != null ? x.p : x.g];

  /* renderGamaka's output (or the CLI's contour JSON) as a line */
  function lineOf(c) {
    const ex = c.expression || null;
    const groups = (c.groups || []).map((gr, k) => ({ t0: gr.t0, t1: gr.t1, points: gr.points, gain: ex && ex.gain ? ex.gain[k] : null }));
    const src = c.notes && c.notes.length && c.notes[0].t0 != null ? c.notes : (c.rendered || []);
    const notes = src.filter(n => n.p != null).map(n => Object.assign({ t0: n.t0, t1: n.t1, p: n.p, glide: !!(n.shape && String(n.shape).indexOf('jaru') === 0) },
      ex && ex.notes && ex.notes[n.i] ? ex.notes[n.i] : {}));
    return { groups, notes };
  }

  function render(line, opts) {
    const o = opts || {}, sr = o.sr || 44100, octave = o.octave == null ? -1 : o.octave, sa = (o.sa || 261.63) * Math.pow(2, octave);
    const level = o.level == null ? 0.3 : o.level, sw = o.timbre === 'swaram', vowels = octave < 0 ? VOWEL_LOW : VOWEL;
    const groups = (line.groups || []).filter(gr => gr.points && gr.points.length > 0);
    if (!groups.length) return new Float32Array(Math.ceil(sr * 0.1));
    const end = Math.max.apply(null, groups.map(gr => gr.t1)) + REL + 0.05, n = Math.ceil((end + PRE) * sr), y = new Float32Array(n);
    const rand = lcg(o.seed || 1);
    const notes = (line.notes || []).slice().sort((a, b) => a.t0 - b.t0);
    groups.forEach(gr => sing(gr, notes.filter(x => x.t0 >= gr.t0 - 1e-6 && x.t0 < gr.t1 - 1e-6), y, { sr, sa, level, sw, rand, vowels }));
    // a soft knee keeps any peak under full scale without touching the normal range
    for (let i = 0; i < n; i++) { const v = y[i], a = Math.abs(v); if (a > 0.8) y[i] = Math.sign(v) * (0.8 + 0.2 * Math.tanh((a - 0.8) / 0.2)); }
    return y;
  }

  function sing(gr, notes, y, E) {
    const { sr, sa, level, sw, rand, vowels } = E;
    const P = gr.points.map(tp), G = gr.gain ? gr.gain.map(tp) : null;
    let kp = 0, kg = 0;
    const pitchAt = t => {
      if (t <= P[0][0]) return P[0][1];
      if (t >= P[P.length - 1][0]) return P[P.length - 1][1];
      while (kp < P.length - 2 && P[kp + 1][0] <= t) kp++;
      while (kp > 0 && P[kp][0] > t) kp--;
      const a = P[kp], b = P[kp + 1], u = b[0] > a[0] ? (t - a[0]) / (b[0] - a[0]) : 0;
      return a[1] + (b[1] - a[1]) * u;
    };
    const gainAt = t => {
      if (!G || !G.length) return 1;
      if (t <= G[0][0]) return G[0][1];
      if (t >= G[G.length - 1][0]) return G[G.length - 1][1];
      while (kg < G.length - 2 && G[kg + 1][0] <= t) kg++;
      const a = G[kg], b = G[kg + 1], u = b[0] > a[0] ? (t - a[0]) / (b[0] - a[0]) : 0;
      return a[1] + (b[1] - a[1]) * u;
    };
    // onset events: each swara begins with its consonant ('swaram') or a soft re-articulation ('aa')
    const events = notes.map((x, k) => {
      if (x.glide || x.onset === 'glide') return null;
      const c = sw ? CONS[x.consonant] : (k > 0 && x.onset !== 'phrase' ? REARTICULATE : null);
      return c ? { t: x.t0, c, phrase: x.onset === 'phrase' || k === 0 } : null;
    }).filter(Boolean);
    const vowelOf = x => vowels[sw && x && x.vowel === 'i' ? 'i' : 'a'];
    const t0 = gr.t0 - (sw ? 0.095 : 0.01), t1 = gr.t1 + REL;
    const s0 = Math.max(0, Math.floor((t0 + PRE) * sr)), s1 = Math.min(y.length, Math.ceil((t1 + PRE) * sr));
    const fric = bandpass(CONS.s.fricHz, 2, sr), breath = bandpass(1500, 0.7, sr), burstLo = bandpass(1900, 1.1, sr), burstHi = bandpass(3800, 1.1, sr);
    const soft1 = lowpass(3200, sr), soft2 = lowpass(3200, sr);
    let phase = 0, jit = 0, jitT = 0, shim = 0, shimT = 0, prevAmp = 0, ni = 0, ei = 0;
    const H = [];
    for (let s = s0; s < s1; s += BLOCK) {
      const t = s / sr - PRE, tEnd = Math.min(s1, s + BLOCK);
      // slow random wander of pitch (jitter, a few cents) and level (shimmer, about 2%)
      if (((s - s0) / BLOCK) % 64 === 0) { jitT = (rand() * 2 - 1) * 0.0035; shimT = (rand() * 2 - 1) * 0.025; }
      jit += (jitT - jit) * 0.02; shim += (shimT - shim) * 0.02;
      const tc = clamp(t, gr.t0, gr.t1), f0 = sa * Math.pow(2, pitchAt(tc) / 12) * (1 + jit);
      const f0b = sa * Math.pow(2, pitchAt(clamp(t + BLOCK / sr, gr.t0, gr.t1)) / 12) * (1 + jit);
      const gain = gainAt(tc);
      // the note sounding, its vowel and the one before it (the formants move across the boundary)
      while (ni < notes.length - 1 && notes[ni + 1].t0 - 0.03 <= t) ni++;
      const cur = notes[ni], prev = ni > 0 ? notes[ni - 1] : cur;
      const u = cur ? ss((t - (cur.t0 - 0.03)) / 0.06) : 1, Va = vowelOf(prev), Vb = vowelOf(cur);
      const F = Va.map((f, k) => [f[0] + (Vb[k][0] - f[0]) * u, f[1] + (Vb[k][1] - f[1]) * u]);
      if (F[0][0] < f0 * 1.08) F[0] = [f0 * 1.08, F[0][1]];   // formant tuning: F1 stays above the pitch
      // consonant gestures around this moment
      while (ei < events.length - 1 && events[ei + 1].t - 0.1 <= t) ei++;
      let dip = 1, close = 0, nasal = 0, fricA = 0, burstA = 0, aspA = 0, burstHz = 1900;
      for (let k = Math.max(0, ei - 1); k <= Math.min(events.length - 1, ei + 1); k++) {
        const ev = events[k], c = ev.c, x = t - ev.t;
        if (x < -0.12 || x > 0.08) continue;
        const w = win(x, c.dip);
        dip = Math.min(dip, 1 - w * (1 - c.depth));
        if (c.close) close = Math.max(close, w * c.close);
        if (c.nasal) nasal = Math.max(nasal, w * c.nasal);
        if (c.fric) fricA = Math.max(fricA, win(x, c.fric) * c.fricAmp * (ev.phrase ? 1.15 : 1));
        if (c.burst != null && x >= c.burst && x < c.burst + 0.008) { burstA = Math.max(burstA, c.burstAmp * (1 - (x - c.burst) / 0.008)); burstHz = c.burstHz; }
        if (c.asp) aspA = Math.max(aspA, win(x, c.asp) * c.aspAmp);
      }
      // the group's attack and release
      const att = ss((t - gr.t0 + 0.005) / 0.055), rel = t > gr.t1 ? Math.exp(-(t - gr.t1) / 0.045) : 1;
      // source slope: a louder voice is brighter (s 0.85 loud … 1.35 soft)
      const slope = clamp(1.05 - 0.9 * (gain - 0.95), 0.85, 1.35);
      const nh = Math.max(1, Math.floor(MAXF / f0));
      let sum = 0;
      for (let h = 1; h <= nh; h++) {
        const f = h * f0;
        let a = Math.pow(h, -slope) * envAt(f, F);
        if (f > FADE) a *= 1 - ss((f - FADE) / (MAXF - FADE));
        if (close > 0) a *= 1 - close + close / (1 + Math.pow(f / 450, 4));
        if (nasal > 0) a *= 1 - nasal + nasal * (1 / (1 + Math.pow(f / 750, 4))) * (1 + 0.6 * Math.exp(-Math.pow((f - 260) / 120, 2)));
        H[h] = a; sum += a * a;
      }
      const norm = sum > 0 ? 1 / Math.sqrt(sum) : 0;
      const amp = level * gain * att * rel * dip * (1 + shim) * norm;
      // breath: a trace always, following the voice's loudness, a little more at a phrase's first swara
      const onsetBreath = cur && (cur.onset === 'phrase' || ni === 0) && t >= cur.t0 - 0.01 ? 0.02 * Math.exp(-(t - cur.t0) / 0.05) : 0;
      const breathA = level * att * rel * Math.min(1, gain) * (0.006 + onsetBreath);
      const nAmp = level * 1.0;
      for (let i = s; i < tEnd; i++) {
        const k = (i - s) / BLOCK, fi = f0 + (f0b - f0) * k, a = prevAmp + (amp - prevAmp) * k;
        phase += fi / sr; if (phase > 1e6) phase -= 1e6;
        const ph = phase - Math.floor(phase);
        let v = 0;
        for (let h = 1; h <= nh; h++) v += H[h] * sinT(h * ph);
        // the breath pulses with the glottal cycle (its opening phase), so it fuses with the voice
        const wn = rand() * 2 - 1, cs = Math.max(0, Math.cos(2 * Math.PI * ph)), pulse = 0.1 + 0.9 * cs * cs;
        const bn = breath(wn);
        let out = a * v + soft2(soft1(breathA * pulse * bn * 2.2 + (aspA > 0 ? nAmp * aspA * bn * 2.2 : 0)));
        if (fricA > 0) out += nAmp * fricA * fric(wn) * 2.5;
        if (burstA > 0) out += nAmp * burstA * (burstHz > 2500 ? burstHi(wn) : burstLo(wn)) * 2;
        y[i] += out;
      }
      prevAmp = amp;
    }
  }

  /* line may also be samples already rendered at the context's rate (render first, then schedule, so a
     long line never starts late) */
  function play(ac, out, t0, line, opts) {
    const o = Object.assign({}, opts || {}, { sr: ac.sampleRate });
    const yv = line instanceof Float32Array ? line : render(line, o), buf = ac.createBuffer(1, yv.length, o.sr);
    buf.getChannelData(0).set(yv);
    const src = ac.createBufferSource();
    src.buffer = buf; src.connect(out);
    const at = t0 - PRE, now = ac.currentTime || 0;
    if (at >= now) src.start(at); else src.start(now, now - at);
    return t0 + yv.length / o.sr - PRE;
  }

  g.VGVoice = { PRE, VOWEL, VOWEL_LOW, CONS, lineOf, render, play };
})(typeof globalThis !== 'undefined' ? globalThis : this);
