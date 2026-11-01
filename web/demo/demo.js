/* Vocal Gym demos: alankara generator, jathi creator and judge, kalpana swara generator.
   Shared by the playground and the research plan. Needs window.VGEngine (the engine bundle). */
(function(){
'use strict';
const E = window.VGEngine;
const R = E.allRagas();
const ALL = R.melakartas.concat(R.janyas);
const byId = id => ALL.find(r => r.id === id);
const $ = id => document.getElementById(id);
const FAMS = Object.keys(E.FAM);
const JATIS = [3,4,5,7,9];
const UP = {S:'Ṡ',R:'Ṙ',G:'Ġ',M:'Ṁ',P:'Ṗ',D:'Ḋ',N:'Ṅ'};
const DOWN = {S:'Ṣ',R:'Ṛ',M:'Ṃ',D:'Ḍ',N:'Ṇ'};
const SUB = {'1':'₁','2':'₂','3':'₃'};
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function swara(raga, p, showVar){
  const pc = E.mod12(p), oct = Math.floor(p/12), lab = raga.labels[pc] || '?';
  const L = lab[0];
  let ch = L;
  if (oct > 0) ch = UP[L] || (L + '̇');
  if (oct < 0) ch = DOWN[L] || (L + '̣');
  if (showVar && lab.length > 1) ch += SUB[lab[1]] || lab[1];
  return ch;
}
function ragaLine(r){
  const pr = r.kind === 'melakarta' ? ('mela ' + r.mela + ' · ' + r.chakra + ' chakra') : ('janya of ' + r.parent + ' ' + E.MELA_NAMES[r.parent-1]);
  const fmt = arr => arr.map(p => swara(r, p, true)).join(' ');
  return '<b>' + esc(r.name) + '</b> · ' + pr + ' · ' + r.cls + ' · arohana ' + fmt(r.aro) + ' · avarohana ' + fmt(r.avaro);
}
function fillRagaSelect(sel){
  const g1 = document.createElement('optgroup'); g1.label = 'Melakarta (sampurna)';
  R.melakartas.forEach(r => { const o = new Option(r.mela + ' ' + r.name, r.id); g1.appendChild(o); });
  const g2 = document.createElement('optgroup'); g2.label = 'Janya';
  R.janyas.forEach(r => { const o = new Option(r.name + ' (' + r.cls + ')', r.id); g2.appendChild(o); });
  sel.appendChild(g2); sel.appendChild(g1);
}
function fillFam(sel, val){ FAMS.forEach(f => sel.appendChild(new Option(f[0].toUpperCase()+f.slice(1), f))); sel.value = val; }
function fillJati(sel, fam, val){ sel.innerHTML=''; JATIS.forEach(L => { const o = new Option(E.JATI[L] + ' (' + L + ')' + (E.DEFJ[fam]===L?' · default':''), L); sel.appendChild(o); }); sel.value = String(val || E.DEFJ[fam]); }

/* ---- grid renderer: a stream of slot cells laid out by tala cycle, anga and akshara ---- */
function grid(slots, tl, per, opts){
  opts = opts || {};
  const cyc = tl.total * per; const rows = Math.ceil(slots.length / cyc);
  let html = '';
  for (let r = 0; r < rows; r++){
    const last = opts.partialLast && r === rows - 1;
    html += '<div class="row"><span class="cyc">' + (opts.rowLabel ? opts.rowLabel(r) : (r+1)) + '</span>';
    let pos = r * cyc;
    for (let a = 0; a < tl.angas.length; a++){
      const ang = tl.angas[a]; let ah = '';
      for (let k = 0; k < ang.len; k++){
        if (pos >= slots.length) break;
        const sam = a === 0 && k === 0;
        let cells = '';
        for (let s = 0; s < per; s++){
          const c = slots[pos++];
          if (!c) continue;
          cells += '<span class="s ' + (c.cls||'') + '"' + (c.title ? ' title="' + esc(c.title) + '"' : '') + '>' + esc(c.t) + '</span>';
        }
        ah += '<span class="ak' + (sam ? ' sam' : '') + '">' + cells + '</span>';
      }
      if (ah) html += '<span class="anga">' + ah + '</span>';
      if (last && pos >= slots.length) break;
    }
    html += '</div>';
  }
  return html;
}
function gridText(slots, tl, per){
  const cyc = tl.total * per; let out = [];
  for (let p = 0; p < slots.length; p += cyc){
    let pos = p, line = [];
    tl.angas.forEach(ang => { let seg = []; for (let k = 0; k < ang.len && pos < slots.length; k++){ let ak=''; for (let s=0;s<per && pos<slots.length;s++){ ak += (s?' ':'') + slots[pos++].t; } seg.push(ak); } if (seg.length) line.push(seg.join('  ')); });
    out.push(line.join(' | ') + ' ||');
  }
  return out.join('\n');
}
function copyText(text, btn){
  const done = () => { const t = btn.textContent; btn.textContent = 'Copied'; setTimeout(() => btn.textContent = t, 1400); };
  try { navigator.clipboard.writeText(text).then(done, () => fallback()); } catch(e){ fallback(); }
  function fallback(){ const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch(e){} ta.remove(); }
}

/* ---- audio ---- */
let AC = null, master = null, stopTimer = null;
const SA = [['C',261.63],['C♯',277.18],['D',293.66],['D♯',311.13],['E',329.63],['F',349.23],['F♯',369.99],['G',392.00],['G♯',415.30],['A',440.00],['A♯',466.16],['B',493.88]];
function audio(){ if (!AC){ const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; AC = new C(); } if (AC.state === 'suspended') AC.resume(); return AC; }
function stopAll(){ if (master){ try { master.gain.setTargetAtTime(0, AC.currentTime, 0.05); const m = master; setTimeout(() => { try{ m.disconnect(); }catch(e){} }, 400); } catch(e){} master = null; } if (stopTimer){ clearTimeout(stopTimer); stopTimer = null; } document.querySelectorAll('[data-playing]').forEach(b => { b.textContent = 'Play'; b.removeAttribute('data-playing'); }); }
function startPlayback(btn, schedule){
  if (btn.hasAttribute('data-playing')){ stopAll(); return; }
  stopAll();
  const ac = audio(); if (!ac){ btn.textContent = 'Audio unavailable'; return; }
  master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
  const t0 = ac.currentTime + 0.12;
  const end = schedule(ac, master, t0);
  btn.textContent = 'Stop'; btn.setAttribute('data-playing', '1');
  stopTimer = setTimeout(stopAll, (end - ac.currentTime) * 1000 + 300);
}
function saHz(){ return SA[+$('snd-sa').value][1]; }
function tone(ac, out, f, t, d){
  const o = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
  o.type = 'triangle'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 2400;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32, t + 0.02); g.gain.setTargetAtTime(0.18, t + 0.06, 0.08); g.gain.setTargetAtTime(0.0001, t + Math.max(0.05, d - 0.06), 0.03);
  o.connect(lp).connect(g).connect(out); o.start(t); o.stop(t + d + 0.2);
}
function click(ac, out, t, strong){
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sine'; o.frequency.value = strong ? 1650 : 1100;
  g.gain.setValueAtTime(strong ? 0.22 : 0.09, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  o.connect(g).connect(out); o.start(t); o.stop(t + 0.07);
}
function drone(ac, out, t, d){
  if ($('snd-drone').value !== '1') return;
  const sa = saHz();
  [[sa/2,0.05],[sa,0.04],[sa*1.5,0.03]].forEach(([f,v]) => {
    const o = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 900;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.8); g.gain.setValueAtTime(v, t + d); g.gain.linearRampToValueAtTime(0.0001, t + d + 0.6);
    o.connect(lp).connect(g).connect(out); o.start(t); o.stop(t + d + 0.7);
  });
}
function perc(ac, out, t, syl){
  const low = /^(dhi|tha|thom|jham|nam|tho|dhit)$/.test(syl);
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(low ? 190 : 620, t); o.frequency.exponentialRampToValueAtTime(low ? 110 : 420, t + 0.08);
  g.gain.setValueAtTime(low ? 0.5 : 0.28, t); g.gain.exponentialRampToValueAtTime(0.0001, t + (low ? 0.22 : 0.09));
  o.connect(g).connect(out); o.start(t); o.stop(t + 0.25);
  const len = Math.floor(ac.sampleRate * 0.03), buf = ac.createBuffer(1, len, ac.sampleRate), ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = (Math.random()*2-1) * (1 - i/len);
  const n = ac.createBufferSource(), bp = ac.createBiquadFilter(), ng = ac.createGain();
  n.buffer = buf; bp.type = 'bandpass'; bp.frequency.value = low ? 900 : 3200; ng.gain.value = low ? 0.12 : 0.18;
  n.connect(bp).connect(ng).connect(out); n.start(t);
}
/* the sollus of a jathi, voiced by the "Sollu voice" setting:
     mrd   the synthesized mridangam (web/shared/mridangam.js, docs/research/mridangam-synthesis.md), the sollus
           realized as strokes group by group (ta dhi gi na thom → ki ta ki nam thom)
     rec   the recorded syllables (web/shared/solkattu-bank.js, docs/solkattu-recording.md); any syllable not
           recorded falls back to the mridangam
     both  the spoken syllable over a softer mridangam, as a performer recites while playing
   hits: [{ t, s }] in time order. A syllable is cut where the next one starts; a karvai lets it ring on. */
const SOLLU_KEY = 'vg.solluVoice';
function solluMode(){ const v = $('snd-sollu') && $('snd-sollu').value; return v === 'rec' || v === 'both' ? v : 'mrd'; }
function solluGaps(times){ return times.map((t, i) => i + 1 < times.length ? times[i + 1] - t : 0.4); }
function solluPlay(ac, out, hits){
  const mode = solluMode(), M = window.VGMridangam, V = window.VGSolkattu, gaps = solluGaps(hits.map(h => h.t));
  const strokes = M ? M.realize(hits.map(h => h.s)) : [];
  const drum = M ? M.voice(ac, out, saHz(), mode === 'both' ? 0.5 : 1) : null;
  const say = mode !== 'mrd' && V && V.available() ? V.voice(ac, out, 0.9) : null;
  hits.forEach((h, i) => {
    const spoke = !!(say && say(h.t, h.s, gaps[i]));
    if (spoke && mode === 'rec') return;
    if (!(drum && drum(h.t, strokes[i], gaps[i])) && !spoke) perc(ac, out, h.t, h.s);
  });
}
function playPitched(btn, notes, tl, per){
  // notes: [{p (semitones from Sa) | null, slots}] in order; per = slots per akshara
  startPlayback(btn, (ac, out, t0) => {
    const beat = 60 / +$('snd-bpm').value, slot = beat / per;
    let t = t0, totalSlots = 0;
    notes.forEach(n => { if (n.p !== null) tone(ac, out, saHz() * Math.pow(2, n.p/12), t, n.slots * slot * 0.95); t += n.slots * slot; totalSlots += n.slots; });
    const aks = Math.ceil(totalSlots / per); let starts = new Set(); let c = 0; tl.angas.forEach(a => { starts.add(c); c += a.len; });
    for (let k = 0; k < aks; k++){ const inCyc = k % tl.total; click(ac, out, t0 + k * beat, inCyc === 0 || starts.has(inCyc)); }
    drone(ac, out, t0, t - t0);
    return t;
  });
}

/* ---- gamaka playback (docs/plans/gamaka-audio.md §5): one continuous voice per legato group ----
   The contour from E.renderGamaka drives the oscillator with one setValueCurveAtTime per group
   (overlapping automation is not allowed for value curves); articulation dips live on a separate
   gain node. The timbre is a few harmonics through two "aa" formants, with no vibrato: plain
   Carnatic notes are steady, and vibrato would blur the plain/oscillated contrast. */
const GAMAKA_KEY = 'vg.gamakaLevel', GAMAKA_OLD = 'vg.gamaka';   // the old key held off/light/full as 0, 0.5, 1
/* the gamaka slider, 0–100, as the renderer's intensity (docs/research/gamaka-naturalness.md §3.2) */
function gamakaDepth(){ const v = +$('snd-gamaka').value; return v > 0 ? Math.min(1, v / 100) : 0; }
function gamakaLabel(v){ return v <= 0 ? 'straight notes' : v < 35 ? 'light' : v < 75 ? 'performative' : v < 85 ? 'rich' : 'heavy, accurate'; }
function voiceWave(ac){
  const n = 17, re = new Float32Array(n), im = new Float32Array(n);
  for (let h = 1; h < n; h++) im[h] = 1 / Math.pow(h, 1.3);
  return ac.createPeriodicWave(re, im);
}
/* loudness that follows the pitch (S200): a little louder above the swara, a little softer in fast moves */
function amCurve(contour, g, step){
  const n = Math.max(2, Math.round((g.t1 - g.t0) / step) + 1), out = new Float32Array(n), pts = g.points;
  const sw = contour.notes.filter(x => x.p != null);
  let k = 0, q = 0;
  for (let j = 0; j < n; j++){
    const t = g.t0 + (g.t1 - g.t0) * j / (n - 1);
    while (k < pts.length - 2 && pts[k + 1].t < t) k++;
    while (q < sw.length - 1 && sw[q].t1 <= t) q++;
    const a = pts[k], b = pts[Math.min(k + 1, pts.length - 1)], dt = b.t - a.t;
    const p = dt > 0 ? a.p + (b.p - a.p) * Math.min(1, Math.max(0, (t - a.t) / dt)) : a.p, speed = dt > 0 ? Math.abs(b.p - a.p) / dt : 0;
    out[j] = 1 + Math.max(-0.15, Math.min(0.15, 0.04 * (p - sw[q].p))) - 0.08 * Math.min(1, speed / 40);
  }
  return out;
}
/* resample a group's points onto an even grid, as setValueCurveAtTime spreads values evenly */
function evenCurve(points, t0, t1, step, toHz){
  const n = Math.max(2, Math.round((t1 - t0) / step) + 1), out = new Float32Array(n);
  let k = 0;
  for (let j = 0; j < n; j++){
    const t = t0 + (t1 - t0) * j / (n - 1);
    while (k < points.length - 2 && points[k + 1].t < t) k++;
    const a = points[k], b = points[Math.min(k + 1, points.length - 1)];
    const u = b.t > a.t ? Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t))) : 0;
    out[j] = toHz(a.p + (b.p - a.p) * u);
  }
  return out;
}
function scheduleGamaka(ac, out, t0, contour, sa){
  const wave = voiceWave(ac), toHz = p => sa * Math.pow(2, p / 12);
  contour.groups.forEach(g => {
    const start = t0 + g.t0, dur = g.t1 - g.t0;
    const osc = ac.createOscillator(), env = ac.createGain(), art = ac.createGain(), am = ac.createGain(), dry = ac.createGain(), mix = ac.createGain();
    osc.setPeriodicWave(wave);
    osc.frequency.setValueCurveAtTime(evenCurve(g.points, g.t0, g.t1, 0.005, toHz), start, dur);
    // envelope: a soft attack, a steady level, a short release
    env.gain.setValueAtTime(0.0001, start); env.gain.exponentialRampToValueAtTime(0.26, start + 0.03); env.gain.setValueAtTime(0.26, start + Math.max(0.04, dur - 0.06)); env.gain.exponentialRampToValueAtTime(0.0001, start + dur + 0.04);
    am.gain.setValueCurveAtTime(amCurve(contour, g, 0.01), start, dur);
    // articulation: each swara is spoken softly, except where a jaru glides into it
    art.gain.setValueAtTime(1, start);
    g.notes.forEach((i, k) => {
      if (k === 0) return;
      const n = contour.notes[i];
      if (n.shape && n.shape.indexOf('jaru') >= 0) return;
      const tb = t0 + n.t0;
      art.gain.setValueAtTime(1, tb - 0.015); art.gain.linearRampToValueAtTime(0.88, tb); art.gain.linearRampToValueAtTime(1, tb + 0.015);
    });
    const f1 = ac.createBiquadFilter(), f2 = ac.createBiquadFilter(), f3 = ac.createBiquadFilter();
    f1.type = 'bandpass'; f1.frequency.value = 700; f1.Q.value = 4;
    f2.type = 'bandpass'; f2.frequency.value = 1150; f2.Q.value = 5;
    f3.type = 'bandpass'; f3.frequency.value = 2700; f3.Q.value = 6;
    dry.gain.value = 0.45; mix.gain.value = 1.1;
    osc.connect(env).connect(art).connect(am);
    am.connect(dry).connect(out); am.connect(f1).connect(mix); am.connect(f2).connect(mix); am.connect(f3).connect(mix); mix.connect(out);
    osc.start(start); osc.stop(start + dur + 0.08);
  });
  return t0 + (contour.groups.length ? contour.groups[contour.groups.length - 1].t1 : 0);
}
/* ---- the sung voice (web/shared/voice.js, docs/research/expressive-voice.md) ----
   Kalpana and alankara are sung: the engine renders the contour (the raga's gamaka at the slider's level,
   or straight notes sung legato at 0) with its phrasing and loudness, and the voice sings it on "aa" or on
   the swara names. "Simple tone" keeps the earlier oscillator playback. */
const VOICE_KEY = 'vg.voice';
function voiceMode(){ const v = $('snd-voice') && $('snd-voice').value; return v === 'swaram' || v === 'tone' ? v : 'aa'; }
const angaStarts = tl => { const s = []; let c = 0; tl.angas.forEach(a => { s.push(c); c += a.len; }); return s; };
/* notes [{ p, dur }] in slots, rendered for playback at the current tempo */
function lineContour(notes, raga, tl, per, depth, units, seed){
  const beat = 60 / +$('snd-bpm').value;
  return E.renderGamaka(notes, { raga, slotSec: beat / per, intensity: depth, voice: true, units, seed: seed || 1, per, cycleBeats: tl.total, angaStarts: angaStarts(tl) });
}
function beatClicks(ac, out, t0, notes, tl, per){
  const beat = 60 / +$('snd-bpm').value, total = notes.reduce((s, n) => s + n.slots, 0), aks = Math.ceil(total / per), starts = new Set(angaStarts(tl));
  for (let k = 0; k < aks; k++){ const inCyc = k % tl.total; click(ac, out, t0 + k * beat, inCyc === 0 || starts.has(inCyc)); }
}
function singLine(btn, contour, notes, tl, per, seed){
  // sing first, then schedule: the voice renders the whole line before the first beat is placed
  const ac = !btn.hasAttribute('data-playing') && audio(), V = window.VGVoice;
  const sung = ac ? V.render(V.lineOf(contour), { sr: ac.sampleRate, sa: saHz(), timbre: voiceMode(), seed: seed || 1 }) : null;
  startPlayback(btn, (ac, out, t0) => {
    const end = V.play(ac, out, t0, sung || V.lineOf(contour), { sa: saHz(), timbre: voiceMode(), seed: seed || 1 });
    beatClicks(ac, out, t0, notes, tl, per);
    drone(ac, out, t0, end - t0);
    return end;
  });
}
function kalContour(c, depth){
  const beat = 60 / +$('snd-bpm').value;
  if (voiceMode() !== 'tone') return lineContour(c.res.notes, c.raga, c.tl, c.per, depth, c.res.units, K.seed);
  return E.renderGamaka(c.res.notes, { raga: c.raga, slotSec: beat / c.per, intensity: depth, units: c.res.units, seed: K.seed });
}
function playKalpana(btn){
  const c = K.cache; if (!c) return;
  const depth = gamakaDepth();
  if (voiceMode() !== 'tone' && window.VGVoice) { singLine(btn, kalContour(c, depth), c.notes, c.tl, c.per, K.seed); return; }
  if (!depth) { playPitched(btn, c.notes, c.tl, c.per); return; }   // 0: straight notes, the plain tones unchanged
  const contour = kalContour(c, depth);
  startPlayback(btn, (ac, out, t0) => {
    const end = scheduleGamaka(ac, out, t0, contour, saHz());
    beatClicks(ac, out, t0, c.notes, c.tl, c.per);
    drone(ac, out, t0, end - t0);
    return end;
  });
}
function playAlankara(btn){
  const c = A.cache; if (!c) return;
  if (voiceMode() === 'tone' || !window.VGVoice) { playPitched(btn, c.notes, c.tl, c.per); return; }
  singLine(btn, lineContour(c.notes.map(n => ({ p: n.p, dur: n.slots })), c.raga, c.tl, c.per, gamakaDepth(), null, A.seed), c.notes, c.tl, c.per, A.seed);
}
/* a 16-bit mono WAV of the round with its gamaka, rendered offline through the same graph */
function wavBytes(buf){
  const ch = buf.getChannelData(0), n = ch.length, dv = new DataView(new ArrayBuffer(44 + n * 2));
  const str = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt '); dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true); dv.setUint16(22, 1, true); dv.setUint32(24, buf.sampleRate, true); dv.setUint32(28, buf.sampleRate * 2, true);
  dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); str(36, 'data'); dv.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) dv.setInt16(44 + i * 2, Math.max(-1, Math.min(1, ch[i])) * 32767, true);
  return dv.buffer;
}
function downloadWav(btn){
  const c = K.cache; if (!c) return;
  const Off = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!Off) { btn.textContent = 'WAV unavailable'; return; }
  const contour = kalContour(c, gamakaDepth()), sr = 44100, len = Math.ceil(sr * (contour.points[contour.points.length - 1].t + 1));
  const ac = new Off(1, len, sr), out = ac.createGain(); out.gain.value = 0.9; out.connect(ac.destination);
  const sung = voiceMode() !== 'tone' && window.VGVoice;
  const end = sung ? window.VGVoice.play(ac, out, 0.15, window.VGVoice.lineOf(contour), { sa: saHz(), timbre: voiceMode(), seed: K.seed }) : scheduleGamaka(ac, out, 0.05, contour, saHz());
  drone(ac, out, 0.05, end - 0.05);
  btn.textContent = 'Rendering…';
  ac.startRendering().then(buf => {
    const url = URL.createObjectURL(new Blob([wavBytes(buf)], { type: 'audio/wav' })), a = document.createElement('a');
    a.href = url; a.download = 'kalpana-' + c.raga.id + '-seed' + K.seed + '.wav'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000); btn.textContent = 'Download WAV';
  }, () => { btn.textContent = 'WAV failed'; });
}
/* the pitch view: the contour against the raga's swara lines, a tooltip per swara with its rule */
function kalPitchView(r, contour){
  const pts = contour.points; if (!pts.length) return '';
  const T = pts[pts.length - 1].t, ps = pts.map(p => p.p), lo = Math.floor(Math.min.apply(null, ps)) - 1, hi = Math.ceil(Math.max.apply(null, ps)) + 1;
  const W = 900, H = 200, L = 34, x = t => L + (W - L - 6) * t / T, y = p => 8 + (H - 16) * (hi - p) / (hi - lo);
  const pcs = new Set(r.aro.concat(r.avaro).map(E.mod12));
  let svg = '<svg class="pitchview" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Pitch contour with gamaka">';
  for (let p = lo; p <= hi; p++) if (pcs.has(E.mod12(p))) svg += '<line x1="' + L + '" x2="' + (W - 6) + '" y1="' + y(p).toFixed(1) + '" y2="' + y(p).toFixed(1) + '" class="pv-line' + (E.mod12(p) === 0 ? ' pv-sa' : '') + '"/><text x="' + (L - 6) + '" y="' + (y(p) + 4).toFixed(1) + '" class="pv-lab">' + esc(swara(r, p, false)) + '</text>';
  contour.notes.forEach(n => { if (n.p == null) return; svg += '<rect x="' + x(n.t0).toFixed(1) + '" y="0" width="' + Math.max(1, x(n.t1) - x(n.t0)).toFixed(1) + '" height="' + H + '" class="pv-note"><title>' + esc(swara(r, n.p, true) + ': ' + n.rule + (n.src ? ' · ' + n.src + (n.source ? ' ' + n.source.title : '') : '') + (n.why ? ' · ' + n.why : '')) + '</title></rect>'; });
  let d = ''; contour.groups.forEach(g => g.points.forEach((p, k) => { d += (k ? 'L' : 'M') + x(p.t).toFixed(1) + ' ' + y(p.p).toFixed(1); }));
  return svg + '<path d="' + d + '" class="pv-path"/></svg>';
}
function kalGamakaBadge(r){
  const g = E.getProfile(r).gamaka, src = (g.sources || []).join(', ');
  if (g.basis === 'default') return 'Generic gamaka: no raga-specific data yet (light default: S and P plain, gentle swings on long notes). <a href="../docs/research/raga-profiles-report.md">Research gaps</a>';
  const vague = Object.values(g.rules).some(list => list.some(x => x.basis === 'text-vague'));
  return (vague ? 'Gamaka from text, partly interpreted' : 'Raga-specific gamaka') + ' (sources: ' + esc(src) + '; style ' + esc(g.style) + '). Hover the pitch view for each swara\'s rule.';
}
function kalGamakaView(){
  const c = K.cache; if (!c) return;
  const depth = gamakaDepth(), contour = kalContour(c, depth || 0.55);
  $('k-gamaka').innerHTML = kalGamakaBadge(c.raga) + (depth ? '' : ' Playback is set to straight notes; the view shows performative gamaka (55).');
  $('k-pitch').innerHTML = kalPitchView(c.raga, contour);
}

/* ================= Alankara tab ================= */
const A = { hist: {}, idx: {}, seed: 1 };
function alaKey(){ return $('a-raga').value + '|' + $('a-fam').value + $('a-jati').value; }
function alaHist(){
  const k = alaKey();
  if (!A.hist[k]){ A.hist[k] = [{ motif: E.pdfMotif($('a-fam').value, +$('a-jati').value), source: 'sheet' }]; A.idx[k] = 0; }
  return { k, h: A.hist[k], i: A.idx[k] };
}
function alaSpanDefault(){ $('a-span').value = String(E.motifSpan(E.pdfMotif($('a-fam').value, +$('a-jati').value))); }
function angaText(tl){ return tl.angas.map(a => a.type === 'L' ? '|' + a.len : a.type === 'O' ? 'O' : a.type === 'U' ? 'U' : String(a.len)).join(' '); }
function devicesText(d){
  const parts = [];
  const add = (n, one, many) => { if (n) parts.push(n + ' ' + (n === 1 ? one : many)); };
  add(d.runs, 'run', 'runs'); add(d.turns, 'turn', 'turns'); add(d.restarts, 'restart on Sa at an anga line', 'restarts on Sa at anga lines');
  add(d.leaps, 'leap', 'leaps'); add(d.karvais, 'karvai', 'karvais'); add(d.repeats, 'repeated swara', 'repeated swaras');
  return parts.join(', ');
}
function alaRender(msg){
  const r = byId($('a-raga').value), fam = $('a-fam').value, L = +$('a-jati').value, per = +$('a-kalam').value;
  const T = +$('a-temp').value, sv = $('a-var').value === '1';
  $('a-tv').textContent = T.toFixed(1);
  const tl = E.tala(fam, L), H = alaHist(), v = H.h[H.i], motif = v.motif, pe = E.pdfEntry(fam, L);
  $('a-prev').disabled = H.i === 0; $('a-next').disabled = H.i >= H.h.length - 1; $('a-sheet').disabled = H.i === 0;
  const res = E.alankara(r, tl, motif);
  const slots = [], notes = [];
  res.lines.forEach(l => l.notes.forEach(n => {
    slots.push({ t: swara(r, n.p, sv), cls: n.adjusted ? 'adj' : '', title: n.adjusted ? 'Changed to respect the raga’s direction rules' : '' });
    for (let i = 1; i < n.dur; i++) slots.push({ t: ',', cls: 'k' });
    notes.push({ p: n.p, slots: n.dur });
  }));
  A.cache = { slots, tl, per, notes, raga: r };
  const up = res.lines.filter(l => l.dir === 'asc').length, dn = res.lines.length - up;
  let src;
  if (v.source === 'sheet') src = r.kind === 'melakarta' ? 'Variation 0 · the sheet pattern, ' + pe.title : 'Variation 0 · the sheet pattern (' + pe.title + ') adapted to ' + r.name;
  else {
    const rep = E.motifReport(motif, tl), beat = Math.round(rep.conventionality * 35);
    src = 'Variation ' + H.i + ' of ' + (H.h.length - 1) + ' · new pattern at temperature ' + v.T.toFixed(1) + ' · differs from the sheet and from every earlier variation in at least ' + v.diff + ' of ' + tl.total + ' slots · ' +
      (beat ? 'more conventional than ' + beat + ' of the 35 sheet lines' : 'less conventional than every sheet line') + ' · ' + devicesText(rep.devices);
  }
  $('a-info').innerHTML = ragaLine(r) + '<br><b>' + esc(tl.name) + '</b> · ' + angaText(tl) + ' = ' + tl.total + ' aksharas · ' + up + ' lines up, ' + dn + ' down<br>' + esc(src);
  $('a-out').innerHTML = grid(slots, tl, per, { rowLabel: i => 'c' + (i + 1) });
  const P = E.makeProjector(r); let bad = 0;
  res.lines.forEach(l => { for (let i = 1; i < l.notes.length; i++) if (!P.valid(l.notes[i - 1].p, l.notes[i].p)) bad++; });
  const items = [];
  if (msg) items.push([msg, false]);
  if (v.source === 'sheet') items.push(['Sheet ' + pe.ref + ', first line: ' + pe.asc + (r.mela === 15 ? ' (the sheet is written for Mayamalavagowla)' : ' (written for Mayamalavagowla; ' + (r.kind === 'melakarta' ? 'the same scale degrees in ' : 'projected into ') + r.name + ')'), true]);
  items.push(['Every line fills exactly ' + res.slotsPerLine + ' slots, one ' + tl.name + ' avartanam in first speed', true]);
  items.push(['Karvais stay inside their anga', true]);
  items.push(['Every upward step lands on an arohana swara and every downward step on an avarohana swara', bad === 0]);
  items.push([res.adjustedCount ? res.adjustedCount + ' swaras adjusted to keep those rules (underlined)' : 'No swaras needed adjustment in this raga', true]);
  $('a-audit').innerHTML = items.map(([t, ok]) => '<li' + (ok ? '' : ' class="bad"') + '>' + esc(t) + '</li>').join('');
}
function alaNew(){
  const fam = $('a-fam').value, L = +$('a-jati').value, tl = E.tala(fam, L), H = alaHist(), span = +$('a-span').value, T = +$('a-temp').value;
  const r = E.newMotif(tl, { T, seed: A.seed++, span, avoid: H.h.map(x => x.motif) });
  if (!r){ alaRender('No further distinct pattern with a span of ' + span + ' swaras fits ' + tl.name + '. Choose another span.'); return; }
  H.h.push(Object.assign({ source: 'generated', T, span }, r)); A.idx[H.k] = H.h.length - 1; alaRender();
}
function alaInit(){
  fillRagaSelect($('a-raga')); $('a-raga').value = 'mela15';
  fillFam($('a-fam'), 'jhampa'); fillJati($('a-jati'), 'jhampa', 7); alaSpanDefault();
  $('a-fam').addEventListener('change', () => { fillJati($('a-jati'), $('a-fam').value); alaSpanDefault(); alaRender(); });
  $('a-jati').addEventListener('input', () => { alaSpanDefault(); alaRender(); });
  ['a-raga','a-kalam','a-var'].forEach(id => $(id).addEventListener('input', () => alaRender()));
  $('a-temp').addEventListener('input', () => { $('a-tv').textContent = (+$('a-temp').value).toFixed(1); });
  $('a-new').addEventListener('click', alaNew);
  $('a-prev').addEventListener('click', () => { const H = alaHist(); A.idx[H.k] = Math.max(0, H.i - 1); alaRender(); });
  $('a-next').addEventListener('click', () => { const H = alaHist(); A.idx[H.k] = Math.min(H.h.length - 1, H.i + 1); alaRender(); });
  $('a-sheet').addEventListener('click', () => { const H = alaHist(); A.idx[H.k] = 0; alaRender(); });
  $('a-play').addEventListener('click', e => playAlankara(e.currentTarget));
  $('a-copy').addEventListener('click', e => { const c = A.cache; if (c) copyText(gridText(c.slots, c.tl, c.per), e.currentTarget); });
  document.querySelectorAll('[data-ala]').forEach(b => b.addEventListener('click', () => {
    const [rid, fam, L, mode] = b.dataset.ala.split('|');
    $('a-raga').value = rid; $('a-fam').value = fam; fillJati($('a-jati'), fam, +L); alaSpanDefault();
    const H = alaHist();
    if (mode === 'sheet'){ A.idx[H.k] = 0; alaRender(); }
    else { $('a-temp').value = mode; alaNew(); }
  }));
  alaRender();
}
function pdfTable(){
  const order = [4, 3, 7, 5, 9];
  let h = '<table class="pdft"><thead><tr><th>Family</th>' + order.map(L => '<th>' + E.JATI[L] + ' (' + L + ')</th>').join('') + '</tr></thead><tbody>';
  FAMS.forEach(f => {
    h += '<tr><td>' + f[0].toUpperCase() + f.slice(1) + '</td>' + order.map(L => {
      const e = E.pdfEntry(f, L);
      return '<td><button type="button" class="pdfcell" data-f="' + f + '" data-l="' + L + '" aria-label="Load ' + esc(e.title) + ' into the demo"><span class="ref">' + e.ref + '</span><br><span class="mono">' + esc(e.asc) + '</span></button></td>';
    }).join('') + '</tr>';
  });
  $('pdf-table').innerHTML = h + '</tbody></table>';
  $('pdf-table').querySelectorAll('.pdfcell').forEach(b => b.addEventListener('click', () => {
    $('a-raga').value = 'mela15'; $('a-fam').value = b.dataset.f; fillJati($('a-jati'), b.dataset.f, +b.dataset.l); alaSpanDefault();
    const H = alaHist(); A.idx[H.k] = 0; alaRender();
    showTab('tab-ala'); $('demo').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
}

/* ================= Korvai & tihai lab, and the jathi judge ================= */
// v0.8: the jathi creator gave way to the lab (web/shared/korvai-lab.js, docs/research/korvai-tihai.md);
// the judge is the lab's Check tab
const J = { timer: null };
const lcm = (a, b) => { const g = (x, y) => y ? g(y, x % y) : x; return a / g(a, b) * b; };
function scaledTala(tl, kalai){ return kalai === 1 ? tl : Object.assign({}, tl, { angas: tl.angas.map(a => Object.assign({}, a, { len: a.len * kalai })), total: tl.total * kalai }); }
const raf = f => (window.requestAnimationFrame || (g => setTimeout(g, 30)))(f);
/* the lab's player: sollus on the grid's cells, tala clicks, and the cell being played lit */
function playCells(btn, job){
  startPlayback(btn, (ac, out, t0) => {
    const beat = 60 / +$('snd-bpm').value, slot = beat / job.per;
    const hits = []; job.sylls.forEach((s, i) => { if (s && s !== ',') hits.push({ t: t0 + i * slot, s }); });
    const M = window.VGMridangam, mode = solluMode(), V = window.VGSolkattu;
    if (job.cells && M && M.playArranged) {
      // the lab's structure: accented phrase starts, the cadence on tham, and a phrase tone tuned to Sa
      // that rises with each phrase's length (VGMridangam.arrange)
      const say = mode !== 'mrd' && V && V.available() ? V.voice(ac, out, 0.9) : null, gaps = solluGaps(hits.map(h => h.t));
      if (say) hits.forEach((h, i) => say(h.t, h.s, gaps[i]));
      M.playArranged(ac, out, t0, slot, job.cells, { sa: saHz(), tones: job.tones !== false, drum: !(say && mode === 'rec'), gain: say ? 0.5 : 1 });
    } else solluPlay(ac, out, hits);
    const beats = Math.ceil(job.sylls.length / job.per);
    for (let k = 0; k < beats; k++) click(ac, out, t0 + k * beat, job.angaStarts.has(k % job.total));
    const cells = new Map(Array.from(job.root.querySelectorAll('[data-i]')).map(el => [+el.dataset.i, el]));
    let last = null;
    const frame = () => {
      const on = btn.hasAttribute('data-playing') && btn.isConnected;
      const el = on ? cells.get(Math.floor((ac.currentTime - t0) / slot)) : null;
      if (el !== last) { if (last) last.classList.remove('now'); if (el) el.classList.add('now'); last = el; }
      if (on) raf(frame);
    };
    raf(frame);
    return t0 + job.sylls.length * slot + 0.2;
  });
}
const TEMPLATE = '# Your jathi. One word is one matra; hyphens join a phrase.\ntala: adi\nnadai: 4\navartanams: 1\neduppu: sam\nland: sam\n\n# body here, with | at anga lines and || at the end of an avartanam\n\n{tha-dhi-gi-na-thom}/0\n';
function jLoadExample(k){ $('j-src').value = k === 'blank' ? TEMPLATE : E.JATHI_EXAMPLES[k]; jJudge(); }
function fmtScore(x){ return Number.isInteger(x) ? String(x) : x.toFixed(1); }
function jJudge(){
  const Jr = E.judgeJathi($('j-src').value); J.cres = Jr;
  const out = $('j-result');
  if (!Jr.ok){
    out.innerHTML = '<h4 class="mini">The script could not be read</h4><ul class="audit">' + Jr.errors.slice(0, 12).map(e => '<li class="bad">' + (e.line ? 'Line ' + e.line + (e.col ? ', column ' + e.col : '') + ': ' : '') + esc(e.msg) + '</li>').join('') + '</ul>';
    return;
  }
  const P = Jr.parsed, kal = P.kalai, dtl = scaledTala(P.tl, kal);
  let html = '';
  let per = [P.nadai].concat(P.speeds.map(s => s.n)).reduce(lcm);
  if (per <= 24){
    const tick = E.TICKS / per, cycTicks = P.cycleTicks;
    const lead = P.E0 >= 0 ? P.E0 / tick : (cycTicks + P.E0) / tick;
    const slots = []; for (let i = 0; i < lead; i++) slots.push({ t: '·', cls: 'pre' });
    const starts = new Set(P.units.map(u => u.start));
    const sylIdx = P.events.map((e, i) => e.k === 'syl' ? i : -1).filter(i => i >= 0), lastSyl = sylIdx[sylIdx.length - 1];
    P.events.forEach((ev, i) => {
      const n = Math.round(ev.dur / tick);
      const role = ev.role === 'teer' ? 'teer' : ev.role === 'gap' ? 'gap' : '';
      slots.push({ t: ev.k === 'kv' ? ',' : ev.v, cls: (ev.k === 'kv' ? 'k ' : '') + role + (starts.has(ev.start) && ev.k === 'syl' ? ' cs' : '') + (i === lastSyl ? ' land' : '') });
      for (let j = 1; j < n; j++) slots.push({ t: '', cls: 'sub' });
    });
    const atita = P.E0 < 0;
    const rows = Math.ceil(slots.length / (dtl.total * per)), samRow = Jr.gatePass && P.land.type === 'sam';
    html += '<div class="notation syl">' + grid(slots, dtl, per, { rowLabel: i => (samRow && i === rows - 1) ? 'sam' : atita ? (i === 0 ? 'pre' : 'c' + i) : 'c' + (i + 1), partialLast: true }) + '</div>';
    J.cplay = { P, per };
  } else { J.cplay = { P, per: null }; html += '<p class="tempnote">These speeds need more than 24 cells per akshara, so the grid is not drawn; the judge still checks everything.</p>'; }
  html += '<p class="info"><b>' + esc(P.tl.name) + '</b>' + (kal > 1 ? ' · kalai ' + kal : '') + ' · nadai ' + P.nadai + ' · ' + (Jr.avartanams ? Jr.avartanams + ' avartanam' + (Jr.avartanams > 1 ? 's' : '') + (P.avartanams ? '' : ' (inferred)') : 'span unresolved') + ' · eduppu ' + (P.eduppu === 0 ? 'sam' : (P.eduppu > 0 ? '+' : '') + P.eduppu) + ' · land ' + (P.land.type === 'after' ? '+' + P.land.k : P.land.type) + (Jr.teer ? ' · teermanam ' + (Jr.teer.explicit ? '' : '(detected) ') : '') + (Jr.yati ? ' · ' + Jr.yati.type + ' yati' : '') + '</p>';
  html += '<div class="scorehead"><span class="big">' + Jr.total + '</span><span>/ 100 · <b>' + esc(Jr.grade) + '</b>' + (Jr.gatePass ? '' : ' · capped at 49 until every gate check passes') + '</span></div>';
  html += '<h4 class="mini">Correctness gate</h4><ul class="audit">' + Jr.gate.map(g => '<li' + (g.ok ? '' : ' class="bad"') + '><b>' + esc(g.label) + '.</b> ' + esc(g.detail) + '</li>').join('') + '</ul>';
  if (Jr.fixes.length) html += '<h4 class="mini">What to change</h4><ol class="fixes">' + Jr.fixes.map(f => '<li>' + esc(f) + '</li>').join('') + '</ol>';
  html += '<h4 class="mini">Craft</h4>' + Jr.aspects.map(a => '<div class="score wide"><span>' + esc(a.name) + '</span><span class="bar"><i style="width:' + Math.round(100 * a.score / a.max) + '%"></i></span><b>' + fmtScore(a.score) + ' / ' + a.max + '</b></div>' + (a.notes.length ? '<ul class="anotes">' + a.notes.map(n => '<li>' + esc(n) + '</li>').join('') + '</ul>' : '')).join('');
  if (Jr.warnings.length) html += '<h4 class="mini">Warnings</h4><ul class="anotes">' + Jr.warnings.map(w => '<li>' + (w.line ? 'Line ' + w.line + ': ' : '') + esc(w.msg) + '</li>').join('') + '</ul>';
  out.innerHTML = html;
}
function jathiInit(){
  $('j-ex').addEventListener('change', () => jLoadExample($('j-ex').value));
  $('j-judge').addEventListener('click', jJudge);
  $('j-src').addEventListener('input', () => { clearTimeout(J.timer); J.timer = setTimeout(jJudge, 500); });
  $('j-ccopy').addEventListener('click', e => copyText($('j-src').value, e.currentTarget));
  $('j-cplay').addEventListener('click', e => {
    const c = J.cplay; if (!c || !J.cres || !J.cres.ok) return;
    const P = c.P;
    startPlayback(e.currentTarget, (ac, out, t0) => {
      const beat = 60 / +$('snd-bpm').value, base = Math.min(0, P.E0), tt = x => t0 + (x - base) / E.TICKS * beat;
      solluPlay(ac, out, P.events.filter(ev => ev.k === 'syl').map(ev => ({ t: tt(P.E0 + ev.start), s: ev.v })).sort((a, b) => a.t - b.t));
      const endAbs = P.E0 + P.total, cyc = P.tl.total * P.kalai, starts = E.angaStarts(scaledTala(P.tl, P.kalai));
      for (let k = Math.floor(base / E.TICKS); k * E.TICKS <= endAbs; k++){ const inCyc = ((k % cyc) + cyc) % cyc; click(ac, out, tt(k * E.TICKS), starts.has(inCyc)); }
      return tt(endAbs) + 0.3;
    });
  });
  $('j-src').value = E.JATHI_EXAMPLES.adi; jJudge();
  const home = $('j-comp-home'), comp = $('j-comp');
  if (!window.VGKorvaiLab || !$('kl-root')) return;
  J.lab = window.VGKorvaiLab.mount($('kl-root'), {
    K: E.korvai, store: 'vg-korvai-lab',
    // the lab's own Sa and tempo controls drive the playground's sound bar
    audio: { play: playCells, stop: stopAll, sound: () => ({ sa: +$('snd-sa').value, bpm: +$('snd-bpm').value }),
      setSound: (k, v) => { const el = $(k === 'sa' ? 'snd-sa' : 'snd-bpm'); el.value = String(v); el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('change')); } },
    // v0.8.3: the lab's rhythm, sung by the kalpana generator (E.kalpanaRhythm)
    kalpana: { open(F, layout, meta){ K.rhythm = E.rhythmTemplate(F, layout, meta); K.seed = 3; showTab('tab-kal'); kalRender(); const p = $('p-kal'); if (p.scrollIntoView) p.scrollIntoView({ block: 'start' }); } },
    check: {
      open(script){ $('j-src').value = script; $('j-ex').value = 'blank'; J.lab.setMode('check'); jJudge(); },
      show(el){ el.appendChild(comp); },
      hide(){ if (comp.parentNode !== home) home.appendChild(comp); }
    }
  });
}

/* ================= Kalpana tab ================= */
const K = { seed: 3 };
function kalNotes(r){ return Array.from(new Set(r.aro.concat(r.avaro).map(E.mod12))).sort((a,b) => a-b); }
function kalFillNotes(keep){
  const r = byId($('k-raga').value), pcs = kalNotes(r);
  const s = $('k-start'), e = $('k-end'), sv = keep ? s.value : '0', ev = keep ? e.value : String(pcs.includes(7) ? 7 : pcs[pcs.length-1]);
  s.innerHTML = ''; e.innerHTML = '';
  pcs.forEach(pc => { s.appendChild(new Option(swara(r, pc, true), pc)); e.appendChild(new Option(swara(r, pc, true), pc)); });
  e.appendChild(new Option(swara(r, 12, false) + ' (tara Sa)', 12));
  s.value = pcs.includes(+sv) ? sv : '0'; e.value = Array.from(e.options).some(o => o.value === ev) ? ev : String(pcs[pcs.length-1]);
}
function kalFillLen(){
  const tl = E.tala($('k-fam').value, +$('k-jati').value), sel = $('k-len'), prev = sel.value; sel.innerHTML = '';
  const half = Math.max(2, Math.floor(tl.total / 2));
  [[half, 'Half avartanam (' + half + ' aksharas)'], [tl.total, '1 avartanam (' + tl.total + ')'], [tl.total * 2, '2 avartanams (' + tl.total * 2 + ')']].forEach(([v, t]) => sel.appendChild(new Option(t, v)));
  sel.value = Array.from(sel.options).some(o => o.value === prev) ? prev : String(tl.total);
}
const LICENCE = { phrase: 'inside an attested phrase', structural: 'landing on S, P or a resting swara of the raga', consonant: 'a fourth, fifth or octave', arpeggio: 'inside an arpeggio', none: 'unlicensed' };
function kalLeapText(L){
  if (!L.total) return 'Leaps: none; every move is a step.';
  const by = {}; L.list.forEach(x => { const k = x.licence || 'none'; by[k] = (by[k] || 0) + 1; });
  const parts = Object.keys(LICENCE).filter(k => by[k]).map(k => (L.total > 1 && by[k] === L.total ? (L.total === 2 ? 'both ' : 'all ') : by[k] + ' ') + LICENCE[k]);
  return 'Leaps: ' + L.total + ', ' + parts.join(', ') + (L.unresolved ? '; ' + L.unresolved + ' not stepped back from' : L.total > 1 ? '; all resolved' : '; resolved') + '.';
}
function kalPhraseText(r, st){
  const pct = x => Math.round(x * 100) + '%';
  if (st.profileCoverage !== 'phrases') return 'Phrase data: none for this raga' + (st.profileCoverage === 'roles-only' ? ' (its resting, jiva and avoid data still shape the round)' : '') + ', so the round uses generic devices only.';
  if (!st.phrases.length) return 'Phrases: none in this round (' + pct(st.phraseShare) + ' of the slots).';
  const kind = { phrase: 'phrase', 'phrase-fragment': 'fragment', 'phrase-variant': 'variant' };
  const list = st.phrases.map(p => p.notes.map(x => swara(r, x, false)).join(' ') + ' (' + kind[p.kind] + ' of ' + p.phraseId + ', ' + p.source + (E.getSource(p.source) ? ' ' + E.getSource(p.source).title : '') + ')');
  return 'Phrases: ' + pct(st.phraseShare) + ' of the slots from attested phrases and fragments, ' + pct(st.variantShare) + ' from variants. ' + list.join('; ') + '.';
}
function kalRender(){
  const r = byId($('k-raga').value), tl = E.tala($('k-fam').value, +$('k-jati').value);
  const K0 = +$('k-len').value, per = +$('k-pa').value, sp = +$('k-start').value, tp = +$('k-end').value, T = +$('k-temp').value, ending = $('k-ending').value, moraStyle = $('k-mora').value;
  $('k-tv').textContent = T.toFixed(1);
  kalRhythmControls();
  if (K.rhythm) { kalRenderRhythm(r, tp, T); return; }
  if ($('k-scope') && $('k-scope').value === 'session') { kalRenderSession(r, tl, per, sp, tp, T, moraStyle); return; }
  // v0.4: the phrase plan follows the tala's angas (docs/research/kalpana-structure.md)
  const res = E.kalpanaRound(r, { aksharas: K0, perAkshara: per, startPitch: sp, eduppuPitch: tp, T, seed: K.seed, ending, moraStyle, angas: tl.angas.map(a => a.len) });
  $('k-info').innerHTML = ragaLine(r) + '<br><b>' + esc(tl.name) + '</b> · ' + K0 + ' aksharas × ' + per + ' = ' + K0 * per + ' slots, then the composition resumes on ' + esc(swara(r, tp, true)) + ' at the eduppu · seed ' + K.seed;
  if (res.error){
    const nb = E.eduppuNeighbours(r, tp), near = [nb.lo, nb.hi].filter(p => p != null).map(p => swara(r, p, true)).join(' or ');
    $('k-out').innerHTML = ''; $('k-audit').innerHTML = '<li class="bad">' + esc(res.code === 'unreachable' ? 'This span is too short to move from ' + swara(r, sp, true) + ' to ' + near + ' (next to ' + swara(r, tp, true) + ') with legal devices. Lengthen it or pick closer swaras.' : res.error) + '</li>'; K.cache = null; $('k-pitch').innerHTML = ''; $('k-gamaka').innerHTML = ''; return;
  }
  const slots = [], notes = [];
  res.units.forEach(u => {
    const cls = { nov: 'nov', mora: 'mora', phrase: 'ph', 'phrase-fragment': 'frag', 'phrase-variant': 'var' }[u.kind] || '';
    const src = u.source ? E.getSource(u.source) : null, srcTxt = u.source ? ' · ' + u.phraseId + ', source ' + u.source + (src ? ': ' + src.title : '') : '';
    u.notes.forEach((n, j) => {
      slots.push({ t: swara(r, n.p, false), cls: cls + (j === 0 ? ' cs' : ''), title: u.name + (u.dir > 0 ? ' (up)' : u.dir < 0 ? ' (down)' : '') + srcTxt });
      for (let k = 1; k < n.dur; k++) slots.push({ t: ',', cls: 'k ' + cls });
      notes.push({ p: n.p, slots: n.dur });
    });
  });
  let lastNote = slots.length - 1; while (lastNote > 0 && slots[lastNote].t === ',') lastNote--; slots[lastNote].cls += ' land'; slots[lastNote].title += ' · last swara, next to the eduppu';
  K.cache = { slots, tl, per, notes, res, raga: r };
  $('k-out').classList.remove('session');
  $('k-out').innerHTML = grid(slots, tl, per, { rowLabel: i => 'c' + (i+1) }) + '<div class="row"><span class="cyc"></span><span class="s edp">→ eduppu: the composition resumes on ' + esc(swara(r, tp, false)) + '</span></div>';
  const st = res.stats, dev = Object.keys(st.devices).map(k => k + (st.devices[k] > 1 ? ' ×' + st.devices[k] : '')).join(', ');
  const D = res.dial, fin = swara(r, res.ending.final, true), edp = swara(r, tp, true);
  const nearTxt = fin + ', the ' + (res.ending.approach === 'below' ? 'arohana swara just below ' + edp + ', so the line rises into the eduppu' : 'avarohana swara just above ' + edp + ', so the line descends into the eduppu');
  const MS = { shift: 'shift mora: one contour, a scale step nearer the eduppu each time', gopuccha: 'gopuccha mora: one swara shorter each time', srotovaha: 'srotovaha mora: one swara longer each time', expand: 'expanding mora: the same swaras, each statement one slot longer', contract: 'contracting mora: the same swaras, each statement one slot shorter', identical: 'identical mora: one statement three times' };
  const en = res.ending, endTxt = en.type === 'korvai' ? 'Korvai ending: three descending units, each a run with shrinking rests and a mora, landing on ' + nearTxt : en.type === 'mora' ? 'Mora ending, ' + MS[en.style] + ' (' + (en.template === 'generic' ? 'a generic contour' : 'the contour of ' + en.templatePhrase) + (en.adjusted ? '; one statement adjusted to keep the raga' : '') + '): ' + en.statements.map(st => st.map(p => swara(r, p, false)).join(' ')).join(' · ') + ', with ' + (en.q ? en.q + '-slot karvais' : 'no gaps') + ', landing on ' + nearTxt : 'Free ending on ' + nearTxt + (res.ending.fallbackFrom ? ' (no mora fits this span, so the ending is free)' : '');
  $('k-audit').innerHTML = [
    ['Creativity at temperature ' + D.T.toFixed(1) + ' (c = ' + D.c.toFixed(2) + '): ' + Math.round(st.novelShare * 100) + '% of swaras from unconventional devices and phrase variants, ' + Math.round(st.convShare * 100) + '% from attested phrases and conventional devices', true],
    ['Devices: ' + (dev || 'single steps only'), true],
    [kalPhraseText(r, st), true],
    [kalPlanText(r, res), true],
    [kalLeapText(st.leaps) + (st.relaxed ? ' The leap filter was relaxed one level to fit this short span.' : ''), true],
    [endTxt, true],
    ['Exactly ' + K0 * per + ' slots (' + K0 + ' aksharas at ' + per + ' per akshara), starting on ' + swara(r, sp, true), true],
    ['Every upward step lands on an arohana swara and every downward step on an avarohana swara', true]
  ].map(([t, ok]) => '<li' + (ok ? '' : ' class="bad"') + '>' + esc(t) + '</li>').join('');
  kalGamakaView();
}
/* v0.8.3: a rhythm from the korvai lab, sung in the raga (E.kalpanaRhythm): the lab's phrases, gaps and
   cadence, pulse for pulse; nested families (yatis, AP, GP, kuraippu …) share one line and keep its ending */
const RHYTHM_LOCKED = ['k-fam', 'k-jati', 'k-len', 'k-pa', 'k-start', 'k-ending', 'k-mora', 'k-scope'];
function kalRhythmControls(){
  const on = !!K.rhythm;
  // the lab sets these: hidden while following, so they cannot disagree with the rhythm
  RHYTHM_LOCKED.forEach(id => { const el = $(id); if (!el) return; el.disabled = on; const lab = el.closest('label'); if (lab) lab.hidden = on; });
  const b = $('k-rhythm'); if (!b) return;
  b.hidden = !on;
  if (!on) { b.innerHTML = ''; b._for = null; K.inspiration = ''; return; }
  // drawn once for each rhythm, so a pasted answer survives re-rendering
  if (b._for === K.rhythm) return;
  b._for = K.rhythm; K.inspiration = '';
  const t = K.rhythm, tn = t.tala.fam === 'custom' ? 'a custom tala' : E.tala(t.tala.fam, t.tala.L).name;
  b.innerHTML = '<div><b>Singing the korvai lab’s rhythm</b><span>' + esc((t.label || t.form || 'a korvai') + ' · ' + tn + ' · gati ' + t.gati) + '. The tala, length, speed and ending come from the lab; choose the raga, the eduppu swara and the creativity.</span></div>' +
    '<label class="rh-dens">Swaras <select id="k-rh-dens"><option value="auto">breathe: weak pulses held</option><option value="full">one on every syllable</option></select></label>' +
    '<button type="button" class="btn" id="k-rh-lab">← Back to the lab</button><button type="button" class="btn ghost" id="k-rh-stop">Stop following</button>' +
    // v0.8.5: inspiration from an AI assistant, by copy and paste (the playground has no server and no key)
    '<details class="rhythm-insp" id="k-rh-insp"><summary>Inspiration from an AI assistant</summary>' +
    '<p>Copy a prompt that describes this rhythm and the raga in full, give it to Claude or another assistant, and paste its JSON answer below. Its lines are inspiration: each is fitted to the rhythm and the raga and sung only where every rule of the raga still holds.</p>' +
    '<div class="rh-row"><button type="button" class="btn" id="k-rh-prompt">Copy the prompt</button><span id="k-rh-copied" class="muted"></span></div>' +
    '<textarea id="k-rh-ptext" rows="5" readonly hidden aria-label="The prompt"></textarea>' +
    '<textarea id="k-rh-ans" rows="4" placeholder="Paste the answer here: {&quot;idea&quot;: …, &quot;phrases&quot;: [{&quot;phrase&quot;: 1, &quot;swaras&quot;: &quot;S , R G&quot;}, …]}" aria-label="The assistant’s answer"></textarea>' +
    '<div class="rh-row"><button type="button" class="btn" id="k-rh-use">Sing with these lines</button><button type="button" class="btn ghost" id="k-rh-clear">Clear</button></div></details>';
  $('k-rh-lab').onclick = () => showTab('tab-jathi');
  $('k-rh-stop').onclick = () => { K.rhythm = null; kalRender(); };
  $('k-rh-dens').onchange = () => kalRender();
  $('k-rh-prompt').onclick = () => {
    const pr = E.rhythmPrompt(byId($('k-raga').value), K.rhythm, { eduppuPitch: +$('k-end').value, T: +$('k-temp').value });
    if (pr.error) { $('k-rh-copied').textContent = pr.error; return; }
    const text = pr.system + '\n\n' + pr.prompt, box = $('k-rh-ptext');
    box.value = text; box.hidden = false;
    const done = ok => { $('k-rh-copied').textContent = ok ? 'Copied. The prompt is also shown below.' : 'Select the prompt below and copy it.'; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => done(true), () => done(false)); else done(false);
  };
  $('k-rh-use').onclick = () => { K.inspiration = $('k-rh-ans').value.trim(); kalRender(); };
  $('k-rh-clear').onclick = () => { $('k-rh-ans').value = ''; K.inspiration = ''; kalRender(); };
}
function kalRenderRhythm(r, tp, T){
  const dens = $('k-rh-dens') ? $('k-rh-dens').value : 'auto';
  const res = E.kalpanaRhythm(r, K.rhythm, { eduppuPitch: tp, T, seed: K.seed, density: dens, inspiration: K.inspiration || null });
  $('k-out').classList.remove('session');
  if (res.error){ $('k-out').innerHTML = ''; $('k-audit').innerHTML = '<li class="bad">' + esc(res.error) + '</li>'; K.cache = null; $('k-pitch').innerHTML = ''; $('k-gamaka').innerHTML = ''; return; }
  const tl = res.kalai > 1 ? scaledTala(res.tala, res.kalai) : res.tala, per = res.per;
  const CLS = { mora: 'mora', nov: 'nov', conv: '', gap: '' };
  const slots = [], notes = [], all = [], units = [];
  if (res.lead){ for (let i = 0; i < res.lead; i++) slots.push({ t: '·', cls: 'pre', title: 'before the passage starts' }); notes.push({ p: null, slots: res.lead }); all.push({ p: null, dur: res.lead }); units.push({ kind: 'rest', notes: [{ p: null, dur: res.lead }] }); }
  res.units.forEach(u => {
    u.notes.forEach((n, j) => {
      if (n.p == null){ for (let k = 0; k < n.dur; k++) slots.push({ t: ',', cls: 'k', title: 'karvai' }); }
      else { slots.push({ t: swara(r, n.p, false), cls: (CLS[u.kind] || '') + (u.inspired ? ' insp' : '') + (j === 0 ? ' cs' : ''), title: u.name }); for (let k = 1; k < n.dur; k++) slots.push({ t: ',', cls: 'k ' + (CLS[u.kind] || '') + (u.inspired ? ' insp' : ''), title: u.name + ' · karvai' }); }
      notes.push({ p: n.p, slots: n.dur }); all.push({ p: n.p, dur: n.dur });
    });
    units.push({ kind: u.kind, notes: u.notes });
  });
  let ln = slots.length - 1; while (ln > 0 && (slots[ln].t === ',' || slots[ln].cls === 'pre')) ln--; slots[ln].cls += ' land';
  K.cache = { slots, tl, per, notes, res: { notes: all, units }, raga: r };
  $('k-info').innerHTML = ragaLine(r) + '<br><b>' + esc(res.tala.name) + '</b>' + (res.kalai > 1 ? ' · kalai ' + res.kalai : '') + ' · ' + per + ' swaras a beat · ' + res.slots + ' pulses from the lab' + (res.lead ? ', starting ' + res.lead + ' pulses into the cycle' : '') + ', then the composition resumes on ' + esc(swara(r, tp, true)) + ' · seed ' + K.seed;
  $('k-out').innerHTML = grid(slots, tl, per, { rowLabel: i => 'c' + (i + 1), partialLast: true }) + '<div class="row"><span class="cyc"></span><span class="s edp">→ eduppu: the composition resumes on ' + esc(swara(r, tp, false)) + '</span></div>';
  const sw = ps => ps.map(p => swara(r, p, false)).join(' ');
  const famTxt = res.families.map(f => 'Family ' + (f.id + 1) + ' (' + (f.role === 'statement' || f.role === 'uttaranga' ? 'the cadence' : f.role) + ', ' +
    (f.kind === 'nested' ? 'a yati of ' + f.lens.slice(0, f.lens.length / (f.rounds || 1)).join(' → ') + (f.rounds > 1 ? ', ' + f.rounds + ' times' : '') : f.kind === 'repeat' ? f.lens.length + ' repetitions' : 'one phrase') + '): ' + f.how + '. ' + (f.rounds > 1 || f.kind === 'repeat' ? 'First as ' : '') + sw(f.line));
  $('k-audit').innerHTML = res.checks.map(c => '<li' + (c.ok ? '' : ' class="bad"') + '>' + esc(c.text) + '</li>').join('') + famTxt.map(t => '<li>' + esc(t) + '</li>').join('') +
    '<li>' + esc('Breath: ' + res.breath.swaras + ' swaras on ' + res.breath.syllables + ' syllables. ' + (res.breath.density === 'full' ? 'One swara on every syllable.' : 'A run of syllables is the rhythm, not one swara a pulse: each phrase starts on a swara, the beat’s strong pulses carry one, and weak pulses are often held from the swara before (a karvai), more often in a fast gati.')) + '</li>' +
    (res.inspiration && res.inspiration.note ? '<li>' + esc('The assistant’s idea: ' + res.inspiration.note) + '</li>' : '') +
    '<li>' + esc('Creativity ' + res.dial.T.toFixed(1) + ': a repeated rhythm is never simply a repeated melody. Low creativity keeps a phrase’s shape and starts it from another swara, as an alankara climbs the scale; higher creativity re-sings openings, turns contours over and writes fresh lines to the same rhythm.') + '</li>';
  kalGamakaView();
}
/* the phrase plan as sung (v0.4): each phrase's focus, the swara it held, and its echoes */
function kalPlanText(r, res){
  const ph = res.phrases || [];
  if (!ph.length) return 'Phrase plan: none (the round is too short to plan in phrases).';
  const held = ph.filter(p => p.held != null), onF = held.filter(p => p.held === p.focal).length;
  const echoes = res.units.filter(u => /rhyme|sequence|yati|echo/.test(u.base)).map(u => u.name);
  return 'Phrase plan: ' + ph.length + ' phrases shaped by the tala, each ending on a held swara (' + ph.map(p => (p.focal != null ? 'focus ' + swara(r, p.focal, false) : '') + (p.held != null ? ', held ' + swara(r, p.held, false) : '')).join(' · ') + '); ' + onF + ' of ' + held.length + ' end on their focal note' + (echoes.length ? '. Repetition and designs: ' + echoes.join(', ') : '') + '.';
}
/* a whole svara kalpana (v0.4): E.kalpanaSession. Each round is drawn as its own block, on its own grid at
   its own speed (v0.8: the doubled grid with rows of theme rests read as long held swaras), with the theme
   between rounds shown as a divider. Playback strings the rounds together on one grid: each round placed
   to end on a cycle boundary (it lands at the eduppu), a cycle of the theme (rests) after it. */
function kalRenderSession(r, tl, per, sp, tp, T, moraStyle){
  const S = E.kalpanaSession(r, { eduppuPitch: tp, startPitch: sp, angas: tl.angas.map(a => a.len), perAkshara: Math.min(per, 2), T, seed: K.seed, moraStyle });
  const P = Math.max.apply(null, S.rounds.map(x => x.per).concat([per])), cyc = tl.total * P;
  const slots = [], notes = [], all = [], units = [];
  let at = 0;
  const pad = n => {
    for (let k = 0; k < n; k++) slots.push({ t: '·', cls: 'k', title: 'the theme (the composition) is sung here' });
    if (n) { notes.push({ p: null, slots: n }); all.push({ p: null, dur: n }); units.push({ kind: 'theme', notes: [{ p: null, dur: n }] }); }
    at += n;
  };
  S.rounds.forEach((x, k) => {
    const sc = P / x.per, len = x.aksharas * x.per * sc;
    pad((cyc - ((at + len) % cyc)) % cyc);                 // so the round ends on a cycle boundary
    x.round.units.forEach(u => {
      const cls = { nov: 'nov', mora: 'mora', korvai: 'mora', phrase: 'ph', 'phrase-fragment': 'frag', 'phrase-variant': 'var' }[u.kind] || '';
      const un = { kind: u.kind, notes: [] };
      u.notes.forEach((n, j) => {
        const d = n.dur * sc;
        slots.push({ t: swara(r, n.p, false), cls: cls + (j === 0 ? ' cs' : ''), title: (k + 1) + '. ' + x.part + ' · ' + u.name });
        for (let q = 1; q < d; q++) slots.push({ t: ',', cls: 'k ' + cls });
        notes.push({ p: n.p, slots: d }); all.push({ p: n.p, dur: d }); un.notes.push({ p: n.p, dur: d });
      });
      units.push(un); at += u.notes.reduce((s2, n) => s2 + n.dur * sc, 0);
    });
    if (k < S.rounds.length - 1) pad(cyc);                 // the theme line before the next round
  });
  K.cache = { slots, tl, per: P, notes, res: { notes: all, units }, raga: r, session: S };
  $('k-info').innerHTML = ragaLine(r) + '<br><b>' + esc(tl.name) + '</b> · a whole svara kalpana: ' + S.rounds.length + ' rounds, each landing next to ' + esc(swara(r, tp, true)) + ' at the eduppu, the composition’s line sung between them (Play includes a cycle of it as rests) · seed ' + K.seed;
  const AV = { 0.25: '¼', 0.5: '½' };
  const KIND = { nov: 'nov', mora: 'mora', korvai: 'mora', phrase: 'ph', 'phrase-fragment': 'frag', 'phrase-variant': 'var' };
  $('k-out').innerHTML = S.rounds.map((x, k) => {
    const rs = [];
    x.round.units.forEach(u => u.notes.forEach((n, j) => { rs.push({ t: swara(r, n.p, false), cls: (KIND[u.kind] || '') + (j === 0 ? ' cs' : ''), title: u.name }); for (let q = 1; q < n.dur; q++) rs.push({ t: ',', cls: 'k ' + (KIND[u.kind] || '') }); }));
    let ln = rs.length - 1; while (ln > 0 && rs[ln].t === ',') ln--; rs[ln].cls += ' land';
    const en = x.round.ending, endTxt = en.type === 'korvai' ? 'korvai' : en.type === 'mora' ? en.style + ' mora' : 'free ending';
    const head = '<div class="srh"><span class="srn">' + (k + 1) + '</span><b>' + esc(x.part) + '</b><span>' + esc((AV[x.avartanas] || x.avartanas) + ' avartanam' + (x.avartanas > 1 ? 's' : '') + ' · ' + x.per + ' swara' + (x.per > 1 ? 's' : '') + ' a beat' + (x.focus != null ? ' · focus ' + swara(r, x.focus, false) : '') + ' · ' + endTxt) + '</span></div>';
    const theme = k < S.rounds.length - 1 ? '<div class="theme">↳ the composition’s line from the eduppu (' + esc(swara(r, tp, false)) + '), then the next round</div>' : '<div class="theme">↳ the composition resumes on ' + esc(swara(r, tp, false)) + '</div>';
    return '<div class="sround">' + head + '<div class="notation">' + grid(rs, tl, x.per, { rowLabel: i => 'c' + (i + 1), partialLast: true }) + '</div>' + theme + '</div>';
  }).join('');
  $('k-out').classList.add('session');
  $('k-audit').innerHTML = S.rounds.map((x, k) => '<li>' + esc((k + 1) + '. ' + x.part + ', ' + (AV[x.avartanas] || x.avartanas) + ' avartanam' + (x.avartanas > 1 ? 's' : '') + ' at ' + x.per + ' swaras a beat' + (x.focus != null ? ', focus ' + swara(r, x.focus, false) : '') + ': ' + (x.round.ending.type === 'korvai' ? 'korvai' : x.round.ending.type === 'mora' ? x.round.ending.style + ' mora' : 'free ending') + (x.round.phrases && x.round.phrases.length ? ', ' + x.round.phrases.length + ' phrases' : '')) + '</li>').join('') +
    S.failed.map(x => '<li class="bad">' + esc(x.part + ', ' + x.avartanas + ' avartanam: ' + x.error) + '</li>').join('');
  kalGamakaView();
}
function kalInit(){
  fillRagaSelect($('k-raga')); $('k-raga').value = 'mela65';
  fillFam($('k-fam'), 'triputa'); fillJati($('k-jati'), 'triputa', 4); kalFillLen(); kalFillNotes(false);
  $('k-raga').addEventListener('input', () => { kalFillNotes(true); kalRender(); });
  $('k-fam').addEventListener('change', () => { fillJati($('k-jati'), $('k-fam').value); kalFillLen(); kalRender(); });
  $('k-jati').addEventListener('input', () => { kalFillLen(); kalRender(); });
  ['k-len','k-pa','k-start','k-end','k-ending','k-mora','k-scope'].forEach(id => { if ($(id)) $(id).addEventListener('input', kalRender); });
  $('k-temp').addEventListener('input', () => { $('k-tv').textContent = (+$('k-temp').value).toFixed(1); });
  $('k-temp').addEventListener('change', kalRender);
  $('k-new').addEventListener('click', () => { K.seed++; kalRender(); });
  $('k-play').addEventListener('click', e => playKalpana(e.currentTarget));
  $('k-wav').addEventListener('click', e => downloadWav(e.currentTarget));
  $('k-copy').addEventListener('click', e => { const c = K.cache; if (c) copyText(gridText(c.slots, c.tl, c.per), e.currentTarget); });
  document.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => {
    const [rid, fam, L, len, pa, sp, tp, T, ending] = b.dataset.k.split('|');
    $('k-raga').value = rid; $('k-fam').value = fam; fillJati($('k-jati'), fam, +L); kalFillLen(); $('k-len').value = len; $('k-pa').value = pa; kalFillNotes(false); $('k-start').value = sp; $('k-end').value = tp; $('k-temp').value = T; $('k-ending').value = ending || 'auto'; K.seed = 3;
    kalRender();
  }));
  kalRender();
}

/* ---- tabs and shared sound controls ---- */
let showTab = () => {};
function tabs(){
  const btns = Array.from(document.querySelectorAll('#demo > .tabs [role="tab"]'));
  const show = b => { btns.forEach(x => { const on = x === b; x.setAttribute('aria-selected', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1; $(x.getAttribute('aria-controls')).hidden = !on; }); stopAll(); try { localStorage.setItem('vg-tab', b.id); } catch(e){} };
  showTab = id => { if ($(id)) show($(id)); };
  btns.forEach((b, i) => {
    b.addEventListener('click', () => show(b));
    b.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft'){ const n = btns[(i + (e.key === 'ArrowRight' ? 1 : btns.length - 1)) % btns.length]; n.focus(); show(n); } });
  });
  let saved = null; try { saved = localStorage.getItem('vg-tab'); } catch(e){}
  const hash = (location.hash || '').slice(1);
  const want = hash === 'jathi-demo' || hash === 'korvai-lab' ? 'tab-jathi' : hash === 'kalpana-demo' ? 'tab-kal' : saved;
  if (want && $(want)) show($(want));
}
SA.forEach(([n], i) => $('snd-sa').appendChild(new Option('Sa = ' + n, i)));
$('snd-sa').value = '0';
$('snd-bpm').addEventListener('input', () => { $('snd-bv').textContent = $('snd-bpm').value; });
try {
  let g = localStorage.getItem(GAMAKA_KEY);
  if (g == null) { const old = localStorage.getItem(GAMAKA_OLD); if (old != null && isFinite(+old)) g = String(Math.round(+old * 100)); }
  if (g != null && isFinite(+g) && +g >= 0 && +g <= 100) $('snd-gamaka').value = g;
} catch (e) {}
// the sollu voice: the mridangam by default; recorded syllables (alone or over the drum) once there are any
(function(){
  const sel = $('snd-sollu'), V = window.VGSolkattu, info = V && V.info();
  // render the drum's strokes for the current Sa in the background, and again when Sa changes
  const warm = () => { if (window.VGMridangam) window.VGMridangam.prepare(saHz()); };
  setTimeout(warm, 300); $('snd-sa').addEventListener('change', warm);
  if (!info) {
    ['rec', 'both'].forEach(v => { const o = sel.querySelector('option[value="' + v + '"]'); o.disabled = true; o.textContent += ' (none recorded yet)'; });
    sel.value = 'mrd'; sel.title = 'No syllables have been recorded yet: see docs/solkattu-recording.md';
    return;
  }
  sel.title = info.syllables.length + ' recorded syllables, spoken by ' + info.speaker + ' (' + info.license + ')';
  try { const v = localStorage.getItem(SOLLU_KEY); if (['mrd', 'rec', 'both'].includes(v)) sel.value = v; } catch (e) {}
  sel.addEventListener('change', () => { try { localStorage.setItem(SOLLU_KEY, sel.value); } catch (e) {} });
})();
// the voice: sung on "aa" by default, the swara names, or the simple tone; remembered
(function(){
  const sel = $('snd-voice'); if (!sel) return;
  try { const v = localStorage.getItem(VOICE_KEY); if (['aa', 'swaram', 'tone'].includes(v)) sel.value = v; } catch (e) {}
  sel.addEventListener('change', () => { try { localStorage.setItem(VOICE_KEY, sel.value); } catch (e) {} kalGamakaView(); });
})();
const gamakaShow = () => { $('snd-gv').textContent = $('snd-gamaka').value + ' · ' + gamakaLabel(+$('snd-gamaka').value); };
gamakaShow();
$('snd-gamaka').addEventListener('input', () => { gamakaShow(); kalGamakaView(); });
$('snd-gamaka').addEventListener('change', () => { try { localStorage.setItem(GAMAKA_KEY, $('snd-gamaka').value); } catch (e) {} gamakaShow(); kalGamakaView(); });
$('snd-bpm').addEventListener('change', kalGamakaView);
// the sound bar's one-line summary
const soundSum = () => { if (!$('snd-sum')) return; const vo = $('snd-voice'); $('snd-sum').textContent = SA[+$('snd-sa').value][0] + ' · ' + $('snd-bpm').value + ' bpm · drone ' + ($('snd-drone').value === '1' ? 'on' : 'off') + ' · ' + vo.options[vo.selectedIndex].text.toLowerCase() + ' · gamaka ' + $('snd-gamaka').value; };
['snd-sa', 'snd-bpm', 'snd-drone', 'snd-voice', 'snd-gamaka', 'snd-sollu'].forEach(id => $(id) && $(id).addEventListener('input', soundSum));
soundSum();
alaInit(); jathiInit(); kalInit(); tabs();
if ($('pdf-table')) pdfTable();
if ($('ex-adi')) $('ex-adi').textContent = E.JATHI_EXAMPLES.adi;
})();
