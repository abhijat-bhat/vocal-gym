/* Shared UI pieces: escaping, glossary pop-ups, pickers, the creativity dial, the notation grid,
   the playback bar and result checklists. Components render into a container and call onChange. */
import { TERMS } from './glossary.js';
import { settings, setSetting, onSettings, SA, initPlayButton, solluInfo } from './audio.js';
import { liveKolam, kolamSvg } from './kolam-view.js';
import { getUser, getRun, startRun, KIND } from './session.js';

export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
export const plural = (n, one, many) => n + ' ' + (n === 1 ? one : (many || one + 's'));

/* ---------- glossary ---------- */
export const term = (id, text) => '<button type="button" class="term" data-term="' + id + '">' + esc(text || TERMS[id].name.toLowerCase()) + '</button>';
export const q = id => '<button type="button" class="qmark" data-term="' + id + '" aria-label="What is ' + esc(TERMS[id].name) + '?">?</button>';
let popFor = null;
export function initGlossary() {
  const pop = $('#pop');
  const close = () => { pop.hidden = true; popFor = null; };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-term]');
    if (b) {
      e.preventDefault();
      if (popFor === b) { close(); return; }
      const t = TERMS[b.dataset.term]; if (!t) return;
      pop.innerHTML = '<h4>' + esc(t.name) + '</h4><p>' + esc(t.text) + '</p><a class="more" href="#/learn/' + b.dataset.term + '">More in Learn</a>';
      pop.hidden = false; popFor = b;
      const r = b.getBoundingClientRect(), pw = Math.min(340, window.innerWidth - 24);
      pop.style.maxWidth = pw + 'px';
      let left = Math.min(Math.max(12, r.left + r.width / 2 - pw / 2), window.innerWidth - pw - 12);
      pop.style.left = left + 'px';
      const ph = pop.offsetHeight;
      pop.style.top = (r.bottom + 8 + ph > window.innerHeight ? Math.max(8, r.top - ph - 8) : r.bottom + 8) + 'px';
      return;
    }
    if (!e.target.closest('#pop')) close();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  window.addEventListener('scroll', close, { passive: true });
  window.addEventListener('hashchange', close);
}

/* ---------- toast and copy ---------- */
let toastT = 0;
export function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1800); }
export async function copy(text, msg) {
  try { await navigator.clipboard.writeText(text); }
  catch (e) { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (x) { /* nothing */ } ta.remove(); }
  toast(msg || 'Copied');
}
export function download(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/* drawn arrows, in the line of the rest of the icons */
export const ARROW = '<svg class="ar" viewBox="0 0 14 14" width="12" height="12" aria-hidden="true"><path d="M2.5 7h9M7.5 3l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export const BACK = '<svg class="ar" viewBox="0 0 14 14" width="12" height="12" aria-hidden="true"><path d="M11.5 7h-9M6.5 3l-4 4 4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* ---------- page header ---------- */
export function pageHead({ title, lead, steps, presets }) {
  let h = '<div class="phead"><h1>' + esc(title) + '</h1>' + (lead ? '<p class="lead">' + lead + '</p>' : '');
  // v0.8.8: the quick starts in one strip and the how-to as a help popover beside them, so the tool starts higher
  if (steps || presets) h += '<div class="phead-tools">';
  if (presets) h += '<div class="presets"><div class="presets-lab">Quick start</div><div class="chips">' + presets.map((p, i) => '<button type="button" class="chip" data-preset="' + i + '"><b>' + esc(p.title) + '</b> <span class="tag">' + esc(p.tag) + '</span></button>').join('') + '</div></div>';
  if (steps) h += '<details class="howto phelp"><summary>How to use this page</summary><div class="howto-body">' + steps.map((s, i) => '<div class="howto-step"><span class="n">' + (i + 1) + '</span><div><b>' + esc(s[0]) + '</b><span>' + s[1] + '</span></div></div>').join('') + '</div></details>';
  if (steps || presets) h += '</div>';
  return h + '</div>';
}
export const stepHead = (n, title, termId) => '<div class="step-h"><span class="n">' + n + '</span><h3>' + esc(title) + '</h3>' + (termId ? q(termId) : '') + '</div>';

/* ---------- segmented buttons ---------- */
export function seg(el, options, value, onChange, cls) {
  el.className = 'seg' + (cls ? ' ' + cls : '');
  el.setAttribute('role', 'group');
  el.innerHTML = options.map(o => '<button type="button" data-v="' + esc(o.v) + '" aria-pressed="' + (String(o.v) === String(value)) + '"' + (o.title ? ' title="' + esc(o.title) + '"' : '') + '>' + esc(o.label) + (o.sub ? '<small>' + esc(o.sub) + '</small>' : '') + '</button>').join('');
  el.onclick = e => {
    const b = e.target.closest('button[data-v]'); if (!b) return;
    $$('button', el).forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    const o = options.find(x => String(x.v) === b.dataset.v);
    onChange(o.v);
  };
}

/* ---------- creativity dial ---------- */
const WORDS = [[0.45, 'Traditional', 'familiar, textbook moves'], [0.95, 'Balanced', 'mostly familiar, some surprises'], [1.45, 'Inventive', 'unusual moves are common'], [2.01, 'Adventurous', 'the rarest legal moves']];
export function dial(el, value, onChange) {
  el.className = 'dial';
  el.innerHTML = '<div class="dial-top"><span class="dial-val"></span></div><div class="dial-word"></div><input type="range" min="0" max="2" step="0.1" aria-label="Creativity"><div class="dial-ends"><span>Traditional</span><span>Adventurous</span></div>';
  const r = $('input', el);
  const show = v => { const w = WORDS.find(x => v < x[0]); $('.dial-val', el).textContent = w[1] + ' · ' + v.toFixed(1); $('.dial-word', el).textContent = w[2]; };
  r.value = value; show(+value);
  r.addEventListener('input', () => show(+r.value));
  r.addEventListener('change', () => onChange(+r.value));
}

/* ---------- raga picker ---------- */
const sub = r => r.kind === 'melakarta' ? 'Melakarta ' + r.mela + ' · ' + r.count + ' swaras' : 'Janya of ' + r.parent.name + ' · ' + r.count + ' swaras';
export function keysStrip(r) {
  const on = new Map(r.swaras.map(s => [s.pc, s.t]));
  let h = '<div class="keys" aria-label="The swaras of ' + esc(r.name) + ' among the 12 semitones">';
  for (let pc = 0; pc < 12; pc++) h += '<span class="' + (pc === 0 ? 'on sa' : on.has(pc) ? 'on' : '') + '">' + (on.has(pc) ? esc(on.get(pc)) : '') + '</span>';
  return h + '</div>';
}
export function ragaPicker(el, ragas, value, onChange) {
  let open = false, cur = ragas.find(r => r.id === value) || ragas[0];
  const render = () => {
    el.className = 'rpick';
    el.innerHTML = '<button type="button" class="rpick-cur" aria-expanded="' + open + '"><span><b>' + esc(cur.name) + '</b><small>' + esc(sub(cur)) + '</small></span><span class="chev">' + (open ? 'Close<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M3 7.5l3-3 3 3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' : 'Change<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>') + '</span></button>' +
      (open ? '<div class="rpick-pop"><input type="search" placeholder="Search 100 ragas by name or mela number" aria-label="Search ragas"><div class="rpick-list" role="listbox"></div></div>' : '') +
      keysStrip(cur) +
      '<div class="facts"><div><span class="k">' + term('arohana', 'Arohana') + '</span><span class="scale">' + (cur.krama ? cur.krama.aro.map(esc) : cur.aro.map(s => esc(s.t))).join(' ') + '</span></div><div><span class="k">' + term('avarohana', 'Avarohana') + '</span><span class="scale">' + (cur.krama ? cur.krama.avaro.map(esc) : cur.avaro.map(s => esc(s.t))).join(' ') + '</span></div></div>';
    $('.rpick-cur', el).onclick = () => { open = !open; render(); if (open) $('input', el).focus(); };
    if (open) { const inp = $('input', el); inp.oninput = () => list(inp.value); inp.onkeydown = e => { if (e.key === 'Escape') { open = false; render(); } if (e.key === 'Enter') { const f = $('.rpick-opt', el); if (f) f.click(); } }; list(''); }
  };
  const opt = r => '<button type="button" class="rpick-opt" role="option" data-id="' + r.id + '" aria-selected="' + (r.id === cur.id) + '"><span>' + esc(r.name) + '</span><small>' + (r.kind === 'melakarta' ? 'mela ' + r.mela : esc(r.cls)) + '</small></button>';
  const list = qs => {
    const s = qs.trim().toLowerCase();
    const match = r => !s || r.name.toLowerCase().includes(s) || String(r.mela) === s || (r.parent && r.parent.name.toLowerCase().includes(s));
    const groups = s ? [['Matches', ragas.filter(match)]] : [['Popular', ragas.filter(r => r.popular)], ['Janya ragas', ragas.filter(r => r.kind === 'janya')], ['All 72 melakartas', ragas.filter(r => r.kind === 'melakarta')]];
    const box = $('.rpick-list', el);
    box.innerHTML = groups.map(([g, rs]) => rs.length ? '<div class="rpick-group">' + g + '</div>' + rs.map(opt).join('') : '').join('') || '<div class="rpick-empty">No raga matches “' + esc(qs) + '”.</div>';
    box.onclick = e => { const b = e.target.closest('[data-id]'); if (!b) return; cur = ragas.find(r => r.id === b.dataset.id); open = false; render(); onChange(cur.id); };
  };
  render();
  return { set(id) { cur = ragas.find(r => r.id === id) || cur; open = false; render(); } };
}

/* ---------- tala picker ---------- */
const DOT = { clap: 'c', wave: 'w', count: '' };
export function talaPicture(t) {
  return '<div class="tpic" aria-hidden="true">' + t.angas.map(a => '<div class="a"><b>' + (a.type === 'C' ? a.len : a.name) + '</b><span class="dots">' + t.kriya.slice(a.start, a.start + a.len).map(k => '<i class="' + DOT[k] + '"></i>').join('') + '</span></div>').join('') + '</div>' +
    '<div class="tpic-total">' + t.angas.map(a => a.len).join(' + ') + ' = <b>' + t.total + ' beats</b> per cycle</div>';
}
const FAM_DESC = { dhruva: 'laghu, dhrutam, laghu, laghu', matya: 'laghu, dhrutam, laghu', rupaka: 'dhrutam, laghu', jhampa: 'laghu, anudhrutam, dhrutam', triputa: 'laghu, dhrutam, dhrutam', ata: 'laghu, laghu, dhrutam, dhrutam', eka: 'a single laghu', chapu: 'short dance talas' };
export function talaPicker(el, meta, value, onChange, { allowChapu } = {}) {
  let fam = value.fam, L = value.L;
  const fams = meta.families.filter(f => allowChapu || f.fam !== 'chapu');
  const render = () => {
    const t = meta.talas.find(x => x.fam === fam && (fam === 'chapu' ? x.total : x.L) === L);
    el.innerHTML = '<div class="field"><span class="lab">Family</span><select aria-label="Tala family">' + fams.map(f => '<option value="' + f.fam + '"' + (f.fam === fam ? ' selected' : '') + '>' + f.name + ' (' + FAM_DESC[f.fam] + ')</option>').join('') + '</select></div>' +
      '<div class="field"><span class="lab">' + (fam === 'chapu' ? 'Type' : 'Laghu length (jati)') + ' ' + q(fam === 'chapu' ? 'chapu' : 'jati') + '</span><div class="jseg"></div></div>' +
      '<div class="field">' + talaPicture(t) + '</div>';
    $('select', el).onchange = e => { fam = e.target.value; const f = meta.families.find(x => x.fam === fam); L = f.defaultJati; render(); onChange({ fam, L }); };
    const opts = fam === 'chapu'
      ? [{ v: 3, label: 'Tisra', sub: '1 + 2' }, { v: 5, label: 'Khanda', sub: '2 + 3' }, { v: 7, label: 'Misra', sub: '3 + 2 + 2' }]
      : meta.jatis.map(j => ({ v: j.L, label: j.name, sub: j.L + ' beats' }));
    seg($('.jseg', el), opts, L, v => { L = v; render(); onChange({ fam, L }); }, fam === 'chapu' ? 'cols-3' : 'cols-3');
  };
  render();
  return { set(v) { fam = v.fam; L = v.L; render(); } };
}
export const talaShort = t => t.name.replace(' jati ', ' ');

/* ---------- swara chips ---------- */
export function swaraChips(el, items, value, onChange) {
  el.className = 'swaras';
  el.innerHTML = items.map(s => '<button type="button" data-v="' + s.v + '" aria-pressed="' + (s.v === value) + '" title="' + esc(s.title) + '">' + esc(s.t) + '</button>').join('');
  el.onclick = e => { const b = e.target.closest('button'); if (!b) return; $$('button', el).forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); onChange(+b.dataset.v); };
}

/* ---------- transport (sound settings shared by all pages) ---------- */
/* opts.sollu adds the sollu-voice choice (jathi pages): mridangam, recorded syllables, or both; the
   recorded choices are disabled until syllables are recorded. opts.voice adds the voice (sung on aa,
   the swara names, or the simple tone) and the gamaka dial (swara pages) */
const gamakaWord = v => v <= 0 ? 'straight' : v < 35 ? 'light' : v < 75 ? 'performative' : v < 85 ? 'rich' : 'heavy';
export function transport(el, playLabel, opts) {
  el.className = 'transport';
  const info = opts && opts.sollu ? solluInfo() : null;
  el.innerHTML = '<div class="kclock" aria-hidden="true"></div><button type="button" class="btn primary play"></button>' +
    '<label>Tempo <input type="range" min="40" max="160" step="2" class="t-bpm" aria-label="Tempo in beats per minute"><span class="tempo-val"></span></label>' +
    '<label>Sa <select class="t-sa" aria-label="Pitch of Sa">' + SA.map((s, i) => '<option value="' + i + '">' + s[0] + '</option>').join('') + '</select></label>' +
    '<span class="grow"></span>' +
    '<label class="toggle"><input type="checkbox" class="t-drone">Drone</label>' +
    '<label class="toggle"><input type="checkbox" class="t-clicks">Beat clicks</label>' +
    '<label class="toggle"><input type="checkbox" class="t-loop">Loop</label>' +
    (opts && opts.sollu ? '<label title="' + esc(info ? info.syllables.length + ' recorded syllables, spoken by ' + info.speaker + ' (' + info.license + ')' : 'No syllables recorded yet: see docs/solkattu-recording.md') + '">Sollus <select class="t-sollu" aria-label="How sollus are voiced">' +
      '<option value="mrd">Mridangam</option><option value="rec"' + (info ? '' : ' disabled') + '>Recorded syllables</option><option value="both"' + (info ? '' : ' disabled') + '>Syllables + mridangam</option></select></label>' : '') +
    (opts && opts.voice ? '<label title="How swaras are sung: a synthesized voice on aa or on the swara names, or the simple tone">Voice <select class="t-voice" aria-label="How swaras are sung">' +
      '<option value="aa">Sung on aa</option><option value="swaram">Swara names</option><option value="tone">Simple tone</option></select></label>' +
      '<label title="0 sings straight notes; about 55 is performative; 100 is heavy and accurate">Gamaka <input type="range" min="0" max="100" step="5" class="t-gamaka" aria-label="Gamaka intensity"><span class="gamaka-val"></span></label>' : '');
  const sync = () => {
    $('.t-bpm', el).value = settings.bpm; $('.tempo-val', el).textContent = settings.bpm + ' bpm';
    $('.t-sa', el).value = settings.sa; $('.t-drone', el).checked = settings.drone; $('.t-loop', el).checked = settings.loop; $('.t-clicks', el).checked = settings.clicks;
    if ($('.t-sollu', el)) $('.t-sollu', el).value = info ? settings.solluVoice : 'mrd';
    if ($('.t-voice', el)) { $('.t-voice', el).value = settings.voice; $('.t-gamaka', el).value = settings.gamaka; $('.gamaka-val', el).textContent = gamakaWord(settings.gamaka); }
  };
  sync();
  $('.t-bpm', el).oninput = e => { $('.tempo-val', el).textContent = e.target.value + ' bpm'; };
  $('.t-bpm', el).onchange = e => setSetting('bpm', +e.target.value);
  $('.t-sa', el).onchange = e => setSetting('sa', +e.target.value);
  $('.t-drone', el).onchange = e => setSetting('drone', e.target.checked);
  $('.t-loop', el).onchange = e => setSetting('loop', e.target.checked);
  $('.t-clicks', el).onchange = e => setSetting('clicks', e.target.checked);
  if ($('.t-sollu', el)) $('.t-sollu', el).onchange = e => setSetting('solluVoice', e.target.value);
  if ($('.t-voice', el)) {
    $('.t-voice', el).onchange = e => setSetting('voice', e.target.value);
    $('.t-gamaka', el).oninput = e => { $('.gamaka-val', el).textContent = gamakaWord(+e.target.value); };
    $('.t-gamaka', el).onchange = e => setSetting('gamaka', +e.target.value);
  }
  const off = onSettings(sync);
  const btn = $('.play', el); initPlayButton(btn, playLabel);
  // v0.10: the kolam keeps the tala beside the player, and closes on sam
  // and, where a page gives it room, a larger one on the floor beside the notation
  const clocks = [$('.kclock', el)].concat(opts && opts.floor ? [opts.floor] : []);
  let beats = (opts && opts.beats) || 8, offKolams = clocks.map(c => liveKolam(c, beats, { seed: 2 }));
  const setBeats = n => { if (n === beats || n < 1 || n > 64) return; beats = n; offKolams.forEach(f => f()); offKolams = clocks.map(c => liveKolam(c, n, { seed: 2 })); };
  const ctl = document.createElement('div');
  ctl.className = 't-ctl';
  Array.from(el.children).slice(1).forEach(c => ctl.appendChild(c));
  el.appendChild(ctl);
  // v0.10: practice begun in a tool can be timed and logged too
  const route = location.hash.replace(/^#\/?/, '').split('/')[0], kind = KIND[route];
  if (kind && route !== 'repertoire' && getUser() && !getRun()) {
    const time = document.createElement('button');
    time.type = 'button'; time.className = 'btn small ghost t-time'; time.textContent = 'Time this'; time.title = 'Time this practice and keep it in your log';
    time.onclick = () => { startRun({ id: null, name: kind.label, items: [{ kind: route, title: kind.label, minutes: 10 }] }); time.remove(); };
    ctl.appendChild(time);
  }
  return { btn, setBeats, dispose: () => { off(); offKolams.forEach(f => f()); } };
}

/* ---------- notation grid ----------
   slots: [{ t, cls, title }] one per cell; tala: { angas, total, kriya }; per: cells per beat.
   rowLabel(i) → { text, cls }. Every cell carries data-i (its index) so playback can light it. */
const KRIYA_SVG = {
  clap: '<svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="4.5" fill="currentColor"/></svg>',
  wave: '<svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  count: '<svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="1.8" fill="currentColor"/></svg>'
};
export function notation(slots, tala, per, opts = {}) {
  const cyc = tala.total * per, rows = Math.max(1, Math.ceil(slots.length / cyc));
  const dense = per >= 4;
  const cellW = (opts.syl ? (dense ? 32 : 44) : (dense ? 24 : 34)) + 1;
  // a cycle wider than the card wraps section by section, each section labelled with its beats
  if (cyc * cellW + tala.angas.length * 12 + 60 > (opts.maxWidth || Math.min(720, window.innerWidth - 56))) return wrapped(slots, tala, per, opts, dense, rows);
  const ghost = '<span class="cell" style="height:auto;min-height:0"></span>';
  let h = '<div class="notation' + (opts.syl ? ' syl' : '') + (dense ? ' dense' : '') + '">';
  // ruler: anga names, beat numbers and the hand action for each beat
  h += '<div class="ruler" aria-hidden="true"><span class="nlab">beat</span>';
  tala.angas.forEach(a => {
    h += '<span class="anga"><span class="anga-name">' + esc(a.type === 'C' ? a.len + ' beats' : a.name) + '</span><span class="beats" style="display:flex;gap:3px">';
    for (let k = 0; k < a.len; k++) {
      const b = a.start + k;
      h += '<span class="ak beat" data-b="' + b + '" style="background:transparent;position:relative">' + new Array(per).fill(ghost).join('') +
        '<span style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px"><span class="k">' + KRIYA_SVG[tala.kriya ? tala.kriya[b] : 'count'] + '</span>' + (b + 1) + '</span></span>';
    }
    h += '</span></span>';
  });
  h += '</div>';
  let pos = 0;
  for (let r = 0; r < rows; r++) {
    const lab = opts.rowLabel ? opts.rowLabel(r) : { text: String(r + 1) };
    h += '<div class="nrow"><span class="nlab ' + (lab.cls || '') + '">' + esc(lab.text) + '</span>';
    for (const a of tala.angas) {
      if (pos >= slots.length) break;
      let ah = '';
      for (let k = 0; k < a.len && pos < slots.length; k++) {
        let cells = '';
        for (let s = 0; s < per && pos < slots.length; s++, pos++) {
          const c = slots[pos];
          cells += '<span class="cell ' + (c.cls || '') + '" data-i="' + pos + '"' + (c.title ? ' title="' + esc(c.title) + '"' : '') + '>' + esc(c.t) + '</span>';
        }
        ah += '<span class="ak' + (a.start + k === 0 ? ' sam' : '') + '">' + cells + '</span>';
      }
      h += '<span class="anga">' + ah + '</span>';
    }
    h += '</div>';
  }
  return h + '</div>';
}
function wrapped(slots, tala, per, opts, dense, rows) {
  let h = '<div class="notation wrapped' + (opts.syl ? ' syl' : '') + (dense ? ' dense' : '') + '">', pos = 0;
  for (let r = 0; r < rows; r++) {
    const lab = opts.rowLabel ? opts.rowLabel(r) : { text: String(r + 1) };
    h += '<div class="nrow"><span class="nlab ' + (lab.cls || '') + '">' + esc(lab.text) + '</span><div class="nbody">';
    for (const a of tala.angas) {
      if (pos >= slots.length) break;
      let ah = '';
      for (let k = 0; k < a.len && pos < slots.length; k++) {
        let cells = '';
        for (let s = 0; s < per && pos < slots.length; s++, pos++) {
          const c = slots[pos];
          cells += '<span class="cell ' + (c.cls || '') + '" data-i="' + pos + '"' + (c.title ? ' title="' + esc(c.title) + '"' : '') + '>' + esc(c.t) + '</span>';
        }
        ah += '<span class="ak' + (a.start + k === 0 ? ' sam' : '') + '" data-beat="' + (a.start + k + 1) + '">' + cells + '</span>';
      }
      const name = (a.type === 'C' ? 'Part' : a.name) + ' · ' + (a.len === 1 ? 'beat ' + (a.start + 1) : 'beats ' + (a.start + 1) + '–' + (a.start + a.len));
      h += '<span class="anga"><span class="anga-h">' + esc(name) + '</span><span class="anga-in">' + ah + '</span></span>';
    }
    h += '</div></div>';
  }
  return h + '</div>';
}
/* plain-text version for copying: | between angas, || at the end of a cycle */
export function notationText(slots, tala, per) {
  const cyc = tala.total * per, out = [];
  for (let p = 0; p < slots.length; p += cyc) {
    let pos = p; const line = [];
    tala.angas.forEach(a => {
      const seg = [];
      for (let k = 0; k < a.len && pos < slots.length; k++) { const ak = []; for (let s = 0; s < per && pos < slots.length; s++) ak.push(slots[pos++].t || '·'); seg.push(ak.join(' ')); }
      if (seg.length) line.push(seg.join('  '));
    });
    out.push(line.join(' | ') + ' ||');
  }
  return out.join('\n');
}
export const legend = items => '<div class="legend">' + items.map(([cls, t, label]) => '<span><i class="' + cls + '">' + esc(t || '') + '</i>' + label + '</span>').join('') + '</div>';

/* ---------- checklists ---------- */
const TICK = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.3l2.3 2.3 4.7-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CROSS = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
export const checks = list => '<ul class="checks">' + list.map(c => '<li class="' + (c.ok ? 'ok' : 'bad') + '"><span class="mark" aria-label="' + (c.ok ? 'Passed' : 'Failed') + '">' + (c.ok ? TICK : CROSS) + '</span><div><b>' + esc(c.title) + '</b><span class="d">' + esc(c.detail) + '</span></div></li>').join('') + '</ul>';
export const explain = text => '<div class="explain"><span class="ico" aria-hidden="true">i</span><p>' + text + '</p></div>';
/* v0.10: a score is a kolam whose line closes as far as the score goes: all of it at 100 */
export const ring = (v, cls) => '<div class="score-k ' + (cls || '') + '" style="--v:' + v + '">' + kolamSvg(16, { seed: 4, hundredths: true }) + '<span><b>' + v + '</b><small>of 100</small></span></div>';
export const errorCard = msg => '<div class="notice"><b>Something went wrong.</b> ' + esc(msg) + '</div>';
