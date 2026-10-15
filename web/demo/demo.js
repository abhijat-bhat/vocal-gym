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
  A.cache = { slots, tl, per, notes };
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
  $('a-play').addEventListener('click', e => { const c = A.cache; if (c) playPitched(e.currentTarget, c.notes, c.tl, c.per); });
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

/* ================= Jathi tab ================= */
const J = { seed: 5, timer: null };
function fillFamJ(sel, val){ FAMS.concat(['chapu']).forEach(f => sel.appendChild(new Option(f[0].toUpperCase() + f.slice(1), f))); sel.value = val; }
function fillJatiJ(sel, fam, val){
  if (fam !== 'chapu'){ fillJati(sel, fam, val); return; }
  sel.innerHTML = ''; [[3, 'Tisra (1 + 2)'], [5, 'Khanda (2 + 3)'], [7, 'Misra (3 + 2 + 2)']].forEach(([L, t]) => sel.appendChild(new Option(t, L)));
  sel.value = String([3, 5, 7].includes(+val) ? val : 7);
}
const lcm = (a, b) => { const g = (x, y) => y ? g(y, x % y) : x; return a / g(a, b) * b; };
function scaledTala(tl, kalai){ return kalai === 1 ? tl : Object.assign({}, tl, { angas: tl.angas.map(a => Object.assign({}, a, { len: a.len * kalai })), total: tl.total * kalai }); }
function jathiRender(){
  const fam = $('j-fam').value, L = +$('j-jati').value, g = +$('j-nadai').value, N = +$('j-n').value;
  const tl = E.tala(fam, L), cycle = tl.total * g;
  $('j-off').min = String(-(cycle - 1)); $('j-off').max = String(cycle - 1);
  let off = Math.trunc(+$('j-off').value || 0); off = Math.max(-(cycle - 1), Math.min(cycle - 1, off)); $('j-off').value = off;
  const T = +$('j-temp').value; $('j-tv').textContent = T.toFixed(1);
  const land = $('j-land').value;
  const res = E.jathi({ tl, nadai: g, avartanams: N, offset: off, yatiPref: $('j-yati').value, T, seed: J.seed, land });
  $('j-info').innerHTML = '<b>' + esc(tl.name) + '</b> · ' + angaText(tl) + ' · ' + tl.total + ' aksharas × nadai ' + g + ' = ' + cycle + ' matras per avartanam · eduppu ' + (off === 0 ? 'on sam' : off > 0 ? off + ' after sam (anagata)' : (-off) + ' before sam (atita)') + ' · seed ' + J.seed;
  if (res.error){ $('j-out').innerHTML = ''; $('j-audit').innerHTML = '<li class="bad">' + esc(res.error) + '</li>'; J.cache = null; return; }
  const lead = off >= 0 ? off : cycle + off;
  const slots = []; for (let i = 0; i < lead; i++) slots.push({ t: '·', cls: 'pre' });
  const sylls = [];
  res.segs.forEach(sg => sg.syl.forEach((s, i) => {
    const cls = sg.role === 'teermanam' ? 'teer' : sg.role === 'yati' ? 'yati' : sg.role === 'gap' ? 'gap' : '';
    slots.push({ t: s, cls: (s === ',' ? 'k ' : '') + cls + (i === 0 && sg.role !== 'gap' ? ' cs' : '') }); sylls.push(s);
  }));
  const last = slots[slots.length - 1]; last.cls += ' land'; last.title = land === 'end' ? 'Last syllable; the jathi ends at sam' : 'Lands on sam';
  J.cache = { slots, tl, g, sylls, lead, script: res.script };
  const atita = off < 0;
  $('j-out').innerHTML = grid(slots, tl, g, { rowLabel: i => atita ? (i === 0 ? 'pre' : i <= N ? 'c' + i : 'sam') : (i < N ? 'c' + (i + 1) : 'sam'), partialLast: true });
  const a = res.audit, Jg = E.judgeJathi(res.script);
  const items = [
    [a.span, true],
    ['Body ' + a.body + ' + yati ' + a.yatiLen + (a.yati !== 'none' ? ' [' + a.yati + ']' : '') + ' + teermanam ' + a.teermanam + ' = ' + res.used + ' syllable slots' + (land === 'end' ? ' = ' + res.M + ' matras' : ' = ' + res.M + ' matras + the landing syllable'), a.ok],
    ['Teermanam phrase repeats three times with equal karvais', true],
    [land === 'end' ? 'Ends exactly at sam after ' + N + ' avartanam' + (N > 1 ? 's' : '') : 'Final syllable lands on sam after ' + N + ' avartanam' + (N > 1 ? 's' : ''), true],
    ['Judged as JathiScript: ' + (Jg.ok ? Jg.total + '/100, ' + Jg.grade + (Jg.gatePass ? ', correctness gate passed' : '') : 'did not parse'), Jg.ok && Jg.gatePass]
  ];
  $('j-audit').innerHTML = items.map(([t, ok]) => '<li' + (ok ? '' : ' class="bad"') + '>' + esc(t) + '</li>').join('');
}
function jMode(m){
  ['gen', 'comp'].forEach(x => { $('j-mode-' + x).setAttribute('aria-pressed', x === m ? 'true' : 'false'); $('j-' + x).hidden = x !== m; });
  stopAll();
  try { localStorage.setItem('vg-jmode', m); } catch(e){}
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
  fillFamJ($('j-fam'), 'triputa'); fillJatiJ($('j-jati'), 'triputa', 4);
  $('j-fam').addEventListener('change', () => { fillJatiJ($('j-jati'), $('j-fam').value); jathiRender(); });
  ['j-jati','j-nadai','j-n','j-off','j-yati','j-land'].forEach(id => $(id).addEventListener('input', jathiRender));
  $('j-temp').addEventListener('input', () => { $('j-tv').textContent = (+$('j-temp').value).toFixed(1); });
  $('j-temp').addEventListener('change', jathiRender);
  $('j-new').addEventListener('click', () => { J.seed++; jathiRender(); });
  $('j-play').addEventListener('click', e => {
    const c = J.cache; if (!c) return;
    startPlayback(e.currentTarget, (ac, out, t0) => {
      const beat = 60 / +$('snd-bpm').value, m = beat / c.g;
      let t = t0 + c.lead * m;
      c.sylls.forEach(s => { if (s !== ',') perc(ac, out, t, s); t += m; });
      const aks = Math.ceil((c.lead + c.sylls.length) / c.g), starts = E.angaStarts(c.tl);
      for (let k = 0; k < aks; k++){ const inCyc = k % c.tl.total; click(ac, out, t0 + k * beat, starts.has(inCyc)); }
      return t;
    });
  });
  $('j-copy').addEventListener('click', e => { const c = J.cache; if (c) copyText(gridText(c.slots, c.tl, c.g), e.currentTarget); });
  $('j-edit').addEventListener('click', () => { const c = J.cache; if (!c) return; $('j-src').value = c.script; $('j-ex').value = 'blank'; jMode('comp'); jJudge(); });
  document.querySelectorAll('[data-j]').forEach(b => b.addEventListener('click', () => {
    const [fam, L, g, N, off, y, T] = b.dataset.j.split('|');
    $('j-fam').value = fam; fillJatiJ($('j-jati'), fam, +L); $('j-nadai').value = g; $('j-n').value = N; $('j-off').value = off; $('j-yati').value = y; $('j-temp').value = T; $('j-land').value = 'sam'; J.seed = 5;
    jathiRender();
  }));
  $('j-mode-gen').addEventListener('click', () => jMode('gen'));
  $('j-mode-comp').addEventListener('click', () => { jMode('comp'); if (!$('j-src').value) jLoadExample($('j-ex').value); });
  $('j-ex').addEventListener('change', () => jLoadExample($('j-ex').value));
  $('j-judge').addEventListener('click', jJudge);
  $('j-src').addEventListener('input', () => { clearTimeout(J.timer); J.timer = setTimeout(jJudge, 500); });
  $('j-ccopy').addEventListener('click', e => copyText($('j-src').value, e.currentTarget));
  $('j-cplay').addEventListener('click', e => {
    const c = J.cplay; if (!c || !J.cres || !J.cres.ok) return;
    const P = c.P;
    startPlayback(e.currentTarget, (ac, out, t0) => {
      const beat = 60 / +$('snd-bpm').value, base = Math.min(0, P.E0), tt = x => t0 + (x - base) / E.TICKS * beat;
      P.events.forEach(ev => { if (ev.k === 'syl') perc(ac, out, tt(P.E0 + ev.start), ev.v); });
      const endAbs = P.E0 + P.total, cyc = P.tl.total * P.kalai, starts = E.angaStarts(scaledTala(P.tl, P.kalai));
      for (let k = Math.floor(base / E.TICKS); k * E.TICKS <= endAbs; k++){ const inCyc = ((k % cyc) + cyc) % cyc; click(ac, out, tt(k * E.TICKS), starts.has(inCyc)); }
      return tt(endAbs) + 0.3;
    });
  });
  let m = 'gen'; try { m = localStorage.getItem('vg-jmode') || 'gen'; } catch(e){}
  $('j-src').value = E.JATHI_EXAMPLES.adi;
  jathiRender(); jJudge(); jMode(m === 'comp' ? 'comp' : 'gen');
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
  const res = E.kalpanaRound(r, { aksharas: K0, perAkshara: per, startPitch: sp, eduppuPitch: tp, T, seed: K.seed, ending, moraStyle });
  $('k-info').innerHTML = ragaLine(r) + '<br><b>' + esc(tl.name) + '</b> · ' + K0 + ' aksharas × ' + per + ' = ' + K0 * per + ' slots, then the composition resumes on ' + esc(swara(r, tp, true)) + ' at the eduppu · seed ' + K.seed;
  if (res.error){
    const nb = E.eduppuNeighbours(r, tp), near = [nb.lo, nb.hi].filter(p => p != null).map(p => swara(r, p, true)).join(' or ');
    $('k-out').innerHTML = ''; $('k-audit').innerHTML = '<li class="bad">' + esc(res.code === 'unreachable' ? 'This span is too short to move from ' + swara(r, sp, true) + ' to ' + near + ' (next to ' + swara(r, tp, true) + ') with legal devices. Lengthen it or pick closer swaras.' : res.error) + '</li>'; K.cache = null; return;
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
  K.cache = { slots, tl, per, notes };
  $('k-out').innerHTML = grid(slots, tl, per, { rowLabel: i => 'c' + (i+1) }) + '<div class="row"><span class="cyc"></span><span class="s edp">→ eduppu: the composition resumes on ' + esc(swara(r, tp, false)) + '</span></div>';
  const st = res.stats, dev = Object.keys(st.devices).map(k => k + (st.devices[k] > 1 ? ' ×' + st.devices[k] : '')).join(', ');
  const D = res.dial, fin = swara(r, res.ending.final, true), edp = swara(r, tp, true);
  const nearTxt = fin + ', the ' + (res.ending.approach === 'below' ? 'arohana swara just below ' + edp + ', so the line rises into the eduppu' : 'avarohana swara just above ' + edp + ', so the line descends into the eduppu');
  const MS = { shift: 'shift mora: one contour, a scale step nearer the eduppu each time', gopuccha: 'gopuccha mora: one swara shorter each time', srotovaha: 'srotovaha mora: one swara longer each time', identical: 'identical mora: one statement three times' };
  const en = res.ending, endTxt = en.type === 'mora' ? 'Mora ending, ' + MS[en.style] + ' (' + (en.template === 'generic' ? 'a generic contour' : 'the contour of ' + en.templatePhrase) + (en.adjusted ? '; one statement adjusted to keep the raga' : '') + '): ' + en.statements.map(st => st.map(p => swara(r, p, false)).join(' ')).join(' · ') + ', with ' + (en.q ? en.q + '-slot karvais' : 'no gaps') + ', landing on ' + nearTxt : 'Free ending on ' + nearTxt + (res.ending.fallbackFrom ? ' (no mora fits this span, so the ending is free)' : '');
  $('k-audit').innerHTML = [
    ['Creativity at temperature ' + D.T.toFixed(1) + ' (c = ' + D.c.toFixed(2) + '): ' + Math.round(st.novelShare * 100) + '% of swaras from unconventional devices and phrase variants, ' + Math.round(st.convShare * 100) + '% from attested phrases and conventional devices', true],
    ['Devices: ' + (dev || 'single steps only'), true],
    [kalPhraseText(r, st), true],
    [kalLeapText(st.leaps) + (st.relaxed ? ' The leap filter was relaxed one level to fit this short span.' : ''), true],
    [endTxt, true],
    ['Exactly ' + K0 * per + ' slots (' + K0 + ' aksharas at ' + per + ' per akshara), starting on ' + swara(r, sp, true), true],
    ['Every upward step lands on an arohana swara and every downward step on an avarohana swara', true]
  ].map(([t, ok]) => '<li' + (ok ? '' : ' class="bad"') + '>' + esc(t) + '</li>').join('');
}
function kalInit(){
  fillRagaSelect($('k-raga')); $('k-raga').value = 'mela65';
  fillFam($('k-fam'), 'triputa'); fillJati($('k-jati'), 'triputa', 4); kalFillLen(); kalFillNotes(false);
  $('k-raga').addEventListener('input', () => { kalFillNotes(true); kalRender(); });
  $('k-fam').addEventListener('change', () => { fillJati($('k-jati'), $('k-fam').value); kalFillLen(); kalRender(); });
  $('k-jati').addEventListener('input', () => { kalFillLen(); kalRender(); });
  ['k-len','k-pa','k-start','k-end','k-ending','k-mora'].forEach(id => $(id).addEventListener('input', kalRender));
  $('k-temp').addEventListener('input', () => { $('k-tv').textContent = (+$('k-temp').value).toFixed(1); });
  $('k-temp').addEventListener('change', kalRender);
  $('k-new').addEventListener('click', () => { K.seed++; kalRender(); });
  $('k-play').addEventListener('click', e => { const c = K.cache; if (c) playPitched(e.currentTarget, c.notes, c.tl, c.per); });
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
  const btns = Array.from(document.querySelectorAll('[role="tab"]'));
  const show = b => { btns.forEach(x => { const on = x === b; x.setAttribute('aria-selected', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1; $(x.getAttribute('aria-controls')).hidden = !on; }); stopAll(); try { localStorage.setItem('vg-tab', b.id); } catch(e){} };
  showTab = id => { if ($(id)) show($(id)); };
  btns.forEach((b, i) => {
    b.addEventListener('click', () => show(b));
    b.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft'){ const n = btns[(i + (e.key === 'ArrowRight' ? 1 : btns.length - 1)) % btns.length]; n.focus(); show(n); } });
  });
  let saved = null; try { saved = localStorage.getItem('vg-tab'); } catch(e){}
  const hash = (location.hash || '').slice(1);
  const want = hash === 'jathi-demo' ? 'tab-jathi' : hash === 'kalpana-demo' ? 'tab-kal' : saved;
  if (want && $(want)) show($(want));
}
SA.forEach(([n], i) => $('snd-sa').appendChild(new Option('Sa = ' + n, i)));
$('snd-sa').value = '0';
$('snd-bpm').addEventListener('input', () => { $('snd-bv').textContent = $('snd-bpm').value; });
alaInit(); jathiInit(); kalInit(); tabs();
if ($('pdf-table')) pdfTable();
if ($('ex-adi')) $('ex-adi').textContent = E.JATHI_EXAMPLES.adi;
})();
