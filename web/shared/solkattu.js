/* Vocal Gym · solkattu voice: recorded syllables for jathi playback (docs/solkattu-recording.md)
   A classic script shared by the playground page (inlined by scripts/build.js) and the app (served at
   /shared/ and imported for its side effect). It reads the sample bank that scripts/solkattu-bank.js
   writes to web/shared/solkattu-bank.js (globalThis.VG_SOLKATTU_BANK) and sets globalThis.VGSolkattu:
     available()             true when a bank with at least one syllable is loaded
     info()                  { speaker, license, source, recorded, syllables, rate } or null
     key(syl)                the bank's syllable for a spelling ('Dhom' → 'thom'), or null
     voice(ac, out, gain?)   a player for one playback: play(t, syl, maxDur) schedules a take at time t,
                             cut with a short fade at maxDur seconds (the next syllable); it returns
                             false when the syllable has no recording, so the caller can fall back.
   Each player cycles through a syllable's takes from the first, so a passage sounds the same every
   time it is played but repeated syllables are not identical. Samples are 8-bit µ-law (G.711). */
(function (g) {
  // the spelling aliases of src/engine/sollu.js; a recorded spelling always wins over its alias
  const ALIAS = { ta: 'tha', di: 'dhi', tom: 'thom', dhom: 'thom', thai: 'tai', tei: 'tai', jo: 'jho', dheem: 'dhim', dhin: 'dhim', din: 'dhim', ding: 'dhim', gin: 'gi', tham: 'tam', tak: 'tha' };
  const bank = () => { const b = g.VG_SOLKATTU_BANK; return b && b.syllables && Object.keys(b.syllables).length ? b : null; };

  function key(syl) {
    const b = bank();
    if (!b || syl == null) return null;
    const s = String(syl).trim().toLowerCase().replace(/[^a-z]/g, '');
    if (b.syllables[s]) return s;
    const a = ALIAS[s];
    return a && b.syllables[a] ? a : null;
  }
  /* G.711 µ-law byte to a sample in [-1, 1] */
  function ulaw(u) {
    u = ~u & 0xff;
    const exp = (u >> 4) & 7, s = (((u & 0x0f) << 3) + 0x84 << exp) - 0x84;
    return (u & 0x80 ? -s : s) / 32768;
  }
  function decode(b64) {
    const bin = g.atob(b64), out = new Float32Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = ulaw(bin.charCodeAt(i));
    return out;
  }
  // decoded buffers per audio context and syllable
  const CACHE = typeof WeakMap === 'function' ? new WeakMap() : null;
  function buffers(ac, k) {
    const b = bank();
    let per = CACHE && CACHE.get(ac);
    if (!per || per.bank !== b) { per = { bank: b, map: {} }; if (CACHE) CACHE.set(ac, per); }
    if (!per.map[k]) per.map[k] = b.syllables[k].map(b64 => {
      const x = decode(b64), buf = ac.createBuffer(1, Math.max(1, x.length), b.rate);
      buf.getChannelData(0).set(x);
      return buf;
    });
    return per.map[k];
  }
  function voice(ac, out, gain) {
    const turn = {}, level = gain == null ? 1 : gain;
    return function play(t, syl, maxDur) {
      const k = key(syl);
      if (!k) return false;
      const takes = buffers(ac, k), n = turn[k] || 0, buf = takes[n % takes.length];
      turn[k] = n + 1;
      const len = buf.duration, d = maxDur > 0 ? Math.min(len, Math.max(0.04, maxDur)) : len;
      const src = ac.createBufferSource(), env = ac.createGain();
      src.buffer = buf;
      env.gain.setValueAtTime(level, t);
      if (d < len - 1e-3) { env.gain.setValueAtTime(level, t + Math.max(0.005, d - 0.02)); env.gain.linearRampToValueAtTime(0.0001, t + d); }
      src.connect(env).connect(out);
      src.start(t); src.stop(t + d + 0.01);
      return true;
    };
  }
  function info() {
    const b = bank();
    return b ? { speaker: b.speaker || '', license: b.license || '', source: b.source || '', recorded: b.recorded || '', syllables: Object.keys(b.syllables), rate: b.rate } : null;
  }
  g.VGSolkattu = { available: () => !!bank(), info, key, voice, ulaw, ALIAS };
})(typeof globalThis !== 'undefined' ? globalThis : this);
