/* Playback with Web Audio: a sung voice for swaras (with the raga's gamaka, rendered by the server's
   engine: docs/research/expressive-voice.md), a synthesized mridangam (or recorded syllables) for sollus,
   tala clicks and an optional tanpura-style drone. While a piece plays, the matching cell in the notation
   and the beat in the ruler light up. Sound settings are shared by every page. */
import '/shared/solkattu-bank.js';   // globalThis.VG_SOLKATTU_BANK (scripts/solkattu-bank.js)
import '/shared/solkattu.js';        // globalThis.VGSolkattu, the recorded-syllable voice
import '/shared/mridangam.js';       // globalThis.VGMridangam, the synthesized mridangam
import '/shared/voice.js';           // globalThis.VGVoice, the singing voice
import { api } from './api.js';

export const SA = [['C', 261.63], ['C♯', 277.18], ['D', 293.66], ['D♯', 311.13], ['E', 329.63], ['F', 349.23], ['F♯', 369.99], ['G', 392.00], ['G♯', 415.30], ['A', 440.00], ['A♯', 466.16], ['B', 493.88]];

// solluVoice: 'mrd' mridangam, 'rec' recorded syllables, 'both' syllables over the mridangam
// voice: 'aa' sung on aa, 'swaram' sung swara names, 'tone' the simple tone; gamaka: 0-100 (0 straight notes)
const DEFAULTS = { sa: 0, bpm: 72, drone: true, loop: false, clicks: true, solluVoice: 'mrd', voice: 'aa', gamaka: 55 };
export const settings = Object.assign({}, DEFAULTS);
try { Object.assign(settings, JSON.parse(localStorage.getItem('vg-sound') || '{}')); } catch (e) { /* defaults */ }
if (!['mrd', 'rec', 'both'].includes(settings.solluVoice)) settings.solluVoice = 'mrd';
if (!['aa', 'swaram', 'tone'].includes(settings.voice)) settings.voice = 'aa';
if (!(settings.gamaka >= 0 && settings.gamaka <= 100)) settings.gamaka = 55;
delete settings.sollu;   // the earlier on/off recorded-syllable switch
const listeners = new Set();
export function setSetting(k, v) {
  settings[k] = v;
  try { localStorage.setItem('vg-sound', JSON.stringify(settings)); } catch (e) { /* not persisted */ }
  listeners.forEach(fn => fn(k, v));
}
export function onSettings(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export const saHz = () => SA[settings.sa][1];

let AC = null;
function ctx() {
  if (!AC) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; AC = new C(); }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}

/* ---- voices ---- */
export function tone(ac, out, f, t, d) {
  const o = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
  o.type = 'triangle'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 2400;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32, t + 0.02); g.gain.setTargetAtTime(0.18, t + 0.06, 0.08); g.gain.setTargetAtTime(0.0001, t + Math.max(0.05, d - 0.06), 0.03);
  o.connect(lp).connect(g).connect(out); o.start(t); o.stop(t + d + 0.2);
}
export function click(ac, out, t, strong) {
  if (!settings.clicks) return;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sine'; o.frequency.value = strong ? 1650 : 1100;
  g.gain.setValueAtTime(strong ? 0.2 : 0.08, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  o.connect(g).connect(out); o.start(t); o.stop(t + 0.07);
}
function drone(ac, out, t, d) {
  if (!settings.drone) return;
  const sa = saHz();
  [[sa / 2, 0.05], [sa, 0.04], [sa * 1.5, 0.03]].forEach(([f, v]) => {
    const o = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 900;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.6); g.gain.setValueAtTime(v, t + d); g.gain.linearRampToValueAtTime(0.0001, t + d + 0.5);
    o.connect(lp).connect(g).connect(out); o.start(t); o.stop(t + d + 0.6);
  });
}
export function perc(ac, out, t, syl) {
  const low = /^(dhi|tha|thom|jham|nam|tho|dhit|THA|DHI|THOM)$/i.test(syl);
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(low ? 190 : 620, t); o.frequency.exponentialRampToValueAtTime(low ? 110 : 420, t + 0.08);
  g.gain.setValueAtTime(low ? 0.5 : 0.28, t); g.gain.exponentialRampToValueAtTime(0.0001, t + (low ? 0.22 : 0.09));
  o.connect(g).connect(out); o.start(t); o.stop(t + 0.25);
  const len = Math.floor(ac.sampleRate * 0.03), buf = ac.createBuffer(1, len, ac.sampleRate), ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const n = ac.createBufferSource(), bp = ac.createBiquadFilter(), ng = ac.createGain();
  n.buffer = buf; bp.type = 'bandpass'; bp.frequency.value = low ? 900 : 3200; ng.gain.value = low ? 0.12 : 0.18;
  n.connect(bp).connect(ng).connect(out); n.start(t);
}

/* sollus, voiced by settings.solluVoice: the synthesized mridangam (sollus realized as strokes group by
   group, docs/research/mridangam-synthesis.md), the recorded syllables (falling back to the mridangam for
   any not recorded, docs/solkattu-recording.md), or both. hits: [{ t, s }] in time order; a syllable is
   cut where the next one starts and a karvai lets it ring on. */
export const solluInfo = () => (globalThis.VGSolkattu && globalThis.VGSolkattu.info()) || null;
export const solluGaps = times => times.map((t, i) => i + 1 < times.length ? times[i + 1] - t : 0.4);
export function solluPlay(ac, out, hits) {
  const M = globalThis.VGMridangam, V = globalThis.VGSolkattu, mode = settings.solluVoice, gaps = solluGaps(hits.map(h => h.t));
  const strokes = M ? M.realize(hits.map(h => h.s)) : [];
  const drum = M ? M.voice(ac, out, saHz(), mode === 'both' ? 0.5 : 1) : null;
  const say = mode !== 'mrd' && V && V.available() ? V.voice(ac, out, 0.9) : null;
  hits.forEach((h, i) => {
    const spoke = !!(say && say(h.t, h.s, gaps[i]));
    if (spoke && mode === 'rec') return;
    if (!(drum && drum(h.t, strokes[i], gaps[i])) && !spoke) perc(ac, out, h.t, h.s);
  });
}
// render the drum's strokes for the current Sa in the background, and again when Sa changes
const warmDrum = () => { if (globalThis.VGMridangam) globalThis.VGMridangam.prepare(saHz()); };
setTimeout(warmDrum, 400);
onSettings(k => { if (k === 'sa') warmDrum(); });

/* ---- the player ----
   job = { schedule(ac, out, t0) → { end, slot }, root, per, total }
   schedule places every sound; slot is the length of one notation cell in seconds, counted
   from t0 (cell 0 sounds at t0). root holds the notation, whose cells carry data-i and whose
   ruler beats carry data-b. */
let cur = null;
export function stop() {
  if (!cur) return;
  const c = cur; cur = null;
  try { c.master.gain.setTargetAtTime(0, AC.currentTime, 0.04); setTimeout(() => { try { c.master.disconnect(); } catch (e) { /* gone */ } }, 400); } catch (e) { /* gone */ }
  cancelAnimationFrame(c.raf); clearTimeout(c.timer);
  if (c.root) c.root.querySelectorAll('.now,.on').forEach(el => el.classList.remove('now', 'on'));
  if (c.btn) { c.btn.removeAttribute('data-playing'); setBtn(c.btn, false); }
}
export const isPlaying = btn => !!(cur && cur.btn === btn);
function setBtn(btn, playing) {
  btn.innerHTML = playing
    ? '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="2" y="2" width="10" height="10" rx="1.5" fill="currentColor"/></svg>Stop'
    : '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.8v10.4L12 7z" fill="currentColor"/></svg>' + (btn.dataset.label || 'Play');
}
export function initPlayButton(btn, label) { btn.dataset.label = label || 'Play'; setBtn(btn, false); }

let pending = null;
export function toggle(btn, job) {
  if (isPlaying(btn)) { stop(); return; }
  stop();
  const ac = ctx();
  if (!ac) { btn.textContent = 'No audio in this browser'; return; }
  if (!job.prepare) { start(btn, job, ac); return; }
  // a sung job first fetches its contour; a second click (or another play) while it loads cancels it
  if (pending && pending.btn === btn) { pending = null; setBtn(btn, false); return; }
  const me = pending = { btn };
  btn.setAttribute('aria-busy', 'true');
  job.prepare(ac).catch(() => null).then(() => {
    btn.removeAttribute('aria-busy');
    if (pending !== me) return;
    pending = null;
    start(btn, job, ac);
  });
}
function start(btn, job, ac) {
  const master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
  const t0 = ac.currentTime + 0.15;
  const { end, slot } = job.schedule(ac, master, t0);
  drone(ac, master, t0, end - t0);
  cur = { btn, master, root: job.root, raf: 0, timer: 0 };
  btn.setAttribute('data-playing', ''); setBtn(btn, true);
  const me = cur;
  let lastIdx = -1, lastRow = null;
  const cells = job.root ? Array.from(job.root.querySelectorAll('[data-i]')) : [];
  const byIdx = new Map(cells.map(el => [+el.dataset.i, el]));
  const beats = job.root ? Array.from(job.root.querySelectorAll('[data-b]')) : [];
  const frame = () => {
    if (cur !== me) return;
    const at = Math.floor((ac.currentTime - t0) / slot), idx = job.cellOf ? job.cellOf(at) : at;
    if (idx !== lastIdx) {
      const prev = byIdx.get(lastIdx); if (prev) prev.classList.remove('now');
      const el = byIdx.get(idx);
      if (el) {
        el.classList.add('now');
        const row = el.closest('.nrow');
        if (row !== lastRow) { lastRow = row; if (job.follow && row) row.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); const wrap = el.closest('.notation-wrap'); if (wrap) { const r = el.getBoundingClientRect(), w = wrap.getBoundingClientRect(); if (r.right > w.right || r.left < w.left) wrap.scrollLeft += r.left - w.left - 60; } }
      }
      if (job.per && job.total && at >= 0) {
        const b = Math.floor(at / job.per) % job.total;
        beats.forEach(x => x.classList.toggle('on', +x.dataset.b === b));
      }
      lastIdx = idx;
    }
    me.raf = requestAnimationFrame(frame);
  };
  me.raf = requestAnimationFrame(frame);
  me.timer = setTimeout(() => {
    if (cur !== me) return;
    if (settings.loop || job.loop) { stop(); start(btn, job, ac); }
    else stop();
  }, (end - ac.currentTime) * 1000 + 250);
}

/* ---- common jobs ---- */
/* notes: [{ p: semitones from Sa or null for a rest, slots }]; per: cells per beat; total: beats per cycle; angaStarts: Set of beat positions.
   opts.raga (an id) lets the voice sing the line with the raga's gamaka (settings.gamaka, or opts.gamaka to fix
   it for this job; 0 sings straight notes); opts.units (kalpana's units, [{ kind, notes }]) shape its phrasing. Without a raga, or with the
   simple tone, or if the server cannot render, the swaras play as plain tones.
   v0.9 (the repertoire): opts.scale ({ name, aro, avaro } as printed) sings a raga the engine does not list;
   opts.tempo() scales the tempo (practice speed); opts.offset is how many cells the first note comes after a sam
   (so the clicks fall on the beats); opts.cellOf(cell) maps a grid cell to the notation's data-i to light;
   opts.loop repeats this job whatever the Loop setting; opts.follow scrolls each new row of the notation into view. */
export function pitchedJob(root, notes, per, total, angaStarts, opts) {
  const o = opts || {};
  let sung = null, renderedAt = null;
  const sing = () => settings.voice !== 'tone' && (o.raga || o.scale) && globalThis.VGVoice;
  const gamaka = () => (o.gamaka != null ? o.gamaka : settings.gamaka);
  const bpm = () => settings.bpm * (o.tempo ? o.tempo() : 1);
  const key = () => [bpm(), gamaka(), settings.voice, settings.sa].join('|');
  const off = o.offset || 0;
  const job = {
    root, per, total: o.offset != null ? null : total, cellOf: o.cellOf, loop: !!o.loop, follow: !!o.follow,
    schedule(ac, out, t0) {
      const beat = 60 / bpm(), slot = beat / per;
      let t = t0, cells = 0;
      if (sung && sing() && renderedAt === key()) {
        globalThis.VGVoice.play(ac, out, t0, sung, { sa: saHz(), timbre: settings.voice, seed: o.seed || 1 });
        notes.forEach(n => { cells += n.slots; });
        t = t0 + cells * slot;
      } else notes.forEach(n => { if (n.p !== null) tone(ac, out, saHz() * Math.pow(2, n.p / 12), t, n.slots * slot * 0.95); t += n.slots * slot; cells += n.slots; });
      // the beats, counted from the sam before the first note
      for (let k = Math.ceil(off / per); k * per - off < cells; k++) { const inCyc = k % total; click(ac, out, t0 + (k * per - off) * slot, inCyc === 0 || angaStarts.has(inCyc)); }
      return { end: t + (sung && sing() ? 0.2 : 0), slot };
    }
  };
  // the contour comes from the server's engine and is sung here, before the first beat is placed; both are
  // redone only when tempo, gamaka, voice or Sa change
  job.prepare = ac => {
    if (!sing() || (sung && renderedAt === key())) return Promise.resolve();
    const k = key(), V = globalThis.VGVoice;
    return api.render({ raga: o.raga, scale: o.raga ? undefined : o.scale, notes: notes.map(n => ({ p: n.p, dur: n.slots })), bpm: bpm(), per, intensity: gamaka() / 100,
      seed: o.seed || 1, cycleBeats: total, angaStarts: Array.from(angaStarts), units: o.units })
      .then(c => { sung = V.render(V.lineOf(c), { sr: ac.sampleRate, sa: saHz(), timbre: settings.voice, seed: o.seed || 1 }); renderedAt = k; });
  };
  return job;
}
/* sylls: one entry per cell from the start of the grid ('' for empty lead cells, ',' for karvai) */
export function rhythmJob(root, sylls, per, total, angaStarts) {
  return {
    root, per, total,
    schedule(ac, out, t0) {
      const beat = 60 / settings.bpm, slot = beat / per;
      const hits = []; sylls.forEach((s, i) => { if (s && s !== ',') hits.push({ t: t0 + i * slot, s }); });
      solluPlay(ac, out, hits);
      const beats = Math.ceil(sylls.length / per);
      for (let k = 0; k < beats; k++) click(ac, out, t0 + k * beat, angaStarts.has(k % total));
      return { end: t0 + sylls.length * slot + 0.2, slot };
    }
  };
}
