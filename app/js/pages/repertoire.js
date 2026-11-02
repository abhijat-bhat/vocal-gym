/* Repertoire (v0.9): every composition of carnaticnotations.blogspot.com, to read and to sing.
   #/repertoire is the list, filtered by type, raga, tala, composer and language and searched by name;
   #/repertoire/<id> is one composition: its sections on the tala grid with the sahitya under the swaras, a
   section played (or a line looped) in the sung voice with the raga's gamaka, at a practice speed, and the
   piece added to a practice session or routine. The data is data/repertoire/ (scripts/import-repertoire.js),
   served at /repertoire/; the notation is read by the engine's repertoire module, in the page. */
import { api } from '../api.js';
import { toggle, pitchedJob, stop, isPlaying } from '../audio.js';
import { esc, $, $$, pageHead, transport, seg, toast, errorCard, explain, plural } from '../ui.js';
import { getUser, refreshUser, userKnown, getRun, startRun } from '../session.js';
import { parseCell, ragaOf, talaOf, playPlan } from '/engine/repertoire.js';

let INDEX = null;
const CACHE = new Map();
const S = { q: '', type: '', raga: '', tala: '', composer: '', language: '', sort: 'name', shown: 60, speed: 1, sahitya: true };
const RECENT = 'vg-rep-recent';
const readRecent = () => { try { return JSON.parse(localStorage.getItem(RECENT) || '[]'); } catch (e) { return []; } };
const remember = id => { try { localStorage.setItem(RECENT, JSON.stringify([id].concat(readRecent().filter(x => x !== id)).slice(0, 8))); } catch (e) { /* not kept */ } };
const fold = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]+/g, ' ').replace(/h/g, '').replace(/(.)\1+/g, '$1').replace(/\s+/g, ' ').trim();
const nice = s => String(s || '').replace(/^./, c => c.toUpperCase());

async function loadIndex() {
  if (INDEX) return INDEX;
  const res = await fetch('/repertoire/index.json');
  if (!res.ok) throw new Error('The repertoire is not available (' + res.status + '). Run node scripts/import-repertoire.js.');
  INDEX = await res.json();
  INDEX.compositions.forEach(c => { c._q = fold([c.name, c.title, c.raga, c.composer, c.tala, c.type].join(' ')); });
  return INDEX;
}
async function loadComposition(id) {
  if (CACHE.has(id)) return CACHE.get(id);
  const res = await fetch('/repertoire/c/' + encodeURIComponent(id) + '.json');
  if (!res.ok) throw new Error(res.status === 404 ? 'No composition “' + id + '” in the repertoire.' : 'Could not load the composition (' + res.status + ').');
  const c = await res.json();
  CACHE.set(id, c);
  return c;
}

export async function mount(root, meta, parts) {
  if (parts[0]) return showComposition(root, decodeURIComponent(parts[0]));
  return showList(root);
}

/* ---------------- the list ---------------- */
async function showList(root) {
  root.innerHTML = '<div class="wrap"><div class="loading">Loading the repertoire…</div></div>';
  const ix = await loadIndex();
  const all = ix.compositions, src = ix.source;
  root.innerHTML = '<div class="wrap">' + pageHead({
    eyebrow: 'For singers · repertoire',
    title: 'Repertoire',
    lead: plural(all.length, 'composition') + ' with their swaras and sahitya, from geethams and varnams to krithis and thillanas. Open one to read it on the tala grid, hear any section sung with its raga’s gamaka, loop a line until it sits, and add it to your practice. The notations are from <a href="' + esc(src.url) + '" target="_blank" rel="noopener">' + esc(src.name) + '</a> by ' + esc(src.author) + ', who offers them free to download and use.',
    steps: [
      ['Find a composition', 'Search by name, raga or composer, or narrow the list by type, raga, tala, composer and language.'],
      ['Read and listen', 'Each section is laid out on the tala grid, with the sahitya under its swaras. Play a section, or loop one line or sangati.'],
      ['Practise it', 'Slow it down, sing along, then add it to a routine or start a session: the time goes into your practice log.']
    ]
  }) +
  '<div class="tool"><aside class="panel" aria-label="Filters">' +
    '<div class="step"><div class="field" style="margin-top:0"><label class="lab" for="rp-q">Search</label><input type="search" id="rp-q" placeholder="Name, raga or composer" autocomplete="off"></div></div>' +
    '<div class="step"><div class="field" style="margin-top:0"><span class="lab">Type</span><div class="chips rp-types" id="rp-types"></div></div></div>' +
    '<div class="step">' + ['raga', 'tala', 'composer', 'language'].map(f => '<div class="field"' + (f === 'raga' ? ' style="margin-top:0"' : '') + '><label class="lab" for="rp-' + f + '">' + nice(f) + '</label><select id="rp-' + f + '"></select></div>').join('') +
    '<div class="field"><button type="button" class="btn small ghost" id="rp-clear">Clear the filters</button></div></div>' +
  '</aside><section class="result" aria-live="polite">' +
    '<div id="rp-recent"></div>' +
    '<div class="card"><div class="card-h"><div><h2 id="rp-count">…</h2><div class="card-sub" id="rp-sub"></div></div><label class="rp-sort">Sort <select id="rp-sort" aria-label="Sort by"><option value="name">Name</option><option value="raga">Raga</option><option value="composer">Composer</option><option value="updated">Recently added</option></select></label></div>' +
    '<ul class="rp-list" id="rp-list"></ul><div class="rp-more" id="rp-more"></div></div>' +
  '</section></div></div>';

  const counts = (key, list) => { const m = new Map(); list.forEach(c => { const v = c[key]; if (v) m.set(v, (m.get(v) || 0) + 1); }); return m; };
  const TYPES = ['Geetham', 'Lakshana geetham', 'Swarajathi', 'Jathiswaram', 'Varnam', 'Pada varnam', 'Daru varnam', 'Krithi', 'Thillana', 'Nottuswaram', 'Dasara pada', 'Thiruppugazh', 'Thiruppavai', 'Vachana', 'Ashtapadi', 'Shlokam', 'Basics'];
  const matches = (c, skip) => (!S.q || S.q.split(' ').every(w => c._q.includes(w))) &&
    ['type', 'raga', 'tala', 'composer', 'language'].every(f => f === skip || !S[f] || c[f] === S[f]);
  const drawFilters = () => {
    const tc = counts('type', all.filter(c => matches(c, 'type')));
    const types = TYPES.filter(t => tc.has(t)).concat(Array.from(tc.keys()).filter(t => !TYPES.includes(t)));
    $('#rp-types').innerHTML = '<button type="button" class="chip" data-type="" aria-pressed="' + !S.type + '">All</button>' + types.map(t => '<button type="button" class="chip" data-type="' + esc(t) + '" aria-pressed="' + (S.type === t) + '">' + esc(t) + ' <span class="tag">' + tc.get(t) + '</span></button>').join('');
    ['raga', 'tala', 'composer', 'language'].forEach(f => {
      const m = counts(f, all.filter(c => matches(c, f))), opts = Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0], 'en', { sensitivity: 'base' }));
      if (S[f] && !m.has(S[f])) opts.unshift([S[f], 0]);
      $('#rp-' + f).innerHTML = '<option value="">Any ' + f + ' (' + m.size + ')</option>' + opts.map(([v, n]) => '<option value="' + esc(v) + '"' + (v === S[f] ? ' selected' : '') + '>' + esc(nice(v)) + ' · ' + n + '</option>').join('');
    });
  };
  const sorters = {
    name: (a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }),
    raga: (a, b) => a.raga.localeCompare(b.raga, 'en', { sensitivity: 'base' }) || sorters.name(a, b),
    composer: (a, b) => (a.composer || '~').localeCompare(b.composer || '~', 'en', { sensitivity: 'base' }) || sorters.name(a, b),
    updated: (a, b) => b.updated.localeCompare(a.updated) || sorters.name(a, b)
  };
  const row = c => '<li><a class="rp-item" href="#/repertoire/' + esc(c.id) + '"><b>' + esc(nice(c.name)) + '</b><span class="rp-meta">' +
    [c.raga && nice(c.raga) + (c.ragamalika && !/m[aā]lika/i.test(c.raga) ? ' · ragamalika' : ''), c.tala, c.type, c.composer].filter(Boolean).map(esc).join(' · ') + '</span>' +
    (c.lines ? '' : '<span class="rp-flag">lyrics only</span>') + '</a></li>';
  const drawList = () => {
    const list = all.filter(c => matches(c)).sort(sorters[S.sort]);
    $('#rp-count').textContent = list.length === all.length ? 'All ' + plural(all.length, 'composition') : plural(list.length, 'composition');
    $('#rp-sub').textContent = S.q || S.type || S.raga || S.tala || S.composer || S.language ? 'of ' + all.length + ' · ' + [S.type, S.raga && nice(S.raga), S.tala, S.composer, S.language, S.q && '“' + S.q + '”'].filter(Boolean).join(' · ') : 'Sorted by ' + $('#rp-sort').selectedOptions[0].textContent.toLowerCase();
    $('#rp-list').innerHTML = list.slice(0, S.shown).map(row).join('') || '<li class="muted rp-empty">Nothing matches. Try fewer filters, or another spelling: the search ignores h and doubled letters, so “thodi” finds “todi”.</li>';
    $('#rp-more').innerHTML = list.length > S.shown ? '<button type="button" class="btn small" id="rp-morebtn">Show ' + Math.min(120, list.length - S.shown) + ' more</button><span class="muted"> · ' + (list.length - S.shown) + ' not shown</span>' : '';
    const mb = $('#rp-morebtn'); if (mb) mb.onclick = () => { S.shown += 120; drawList(); };
  };
  const recent = readRecent().map(id => all.find(c => c.id === id)).filter(Boolean);
  $('#rp-recent').innerHTML = recent.length ? '<div class="rp-recent"><span class="presets-lab">Recently opened</span><div class="chips">' + recent.map(c => '<a class="chip" href="#/repertoire/' + esc(c.id) + '"><b>' + esc(nice(c.name)) + '</b> <span class="tag">' + esc(nice(c.raga)) + '</span></a>').join('') + '</div></div>' : '';
  const redraw = () => { S.shown = 60; drawFilters(); drawList(); };
  let t = 0;
  const q = $('#rp-q'); q.value = S.q;
  q.oninput = () => { clearTimeout(t); t = setTimeout(() => { S.q = fold(q.value); redraw(); }, 120); };
  $('#rp-types').onclick = e => { const b = e.target.closest('[data-type]'); if (!b) return; S.type = b.dataset.type; redraw(); };
  ['raga', 'tala', 'composer', 'language'].forEach(f => { $('#rp-' + f).onchange = e => { S[f] = e.target.value; redraw(); }; });
  $('#rp-sort').value = S.sort; $('#rp-sort').onchange = e => { S.sort = e.target.value; drawList(); };
  $('#rp-clear').onclick = () => { Object.assign(S, { q: '', type: '', raga: '', tala: '', composer: '', language: '' }); q.value = ''; redraw(); };
  redraw();
  return () => clearTimeout(t);
}

/* ---------------- one composition ---------------- */
const UP = { S: 'Ṡ', R: 'Ṙ', G: 'Ġ', M: 'Ṁ', P: 'Ṗ', D: 'Ḋ', N: 'Ṅ' };
const DOWN = { S: 'Ṣ', R: 'Ṛ', G: 'G̣', M: 'Ṃ', P: 'P̣', D: 'Ḍ', N: 'Ṇ' };
const SUBS = { 1: '₁', 2: '₂', 3: '₃' };
const FULL = { S: 'Sa', R: 'Ri', G: 'Ga', M: 'Ma', P: 'Pa', D: 'Dha', N: 'Ni' };
const glyph = t => t.s === ',' ? ',' : (t.o > 0 ? UP[t.s] + (t.o > 1 ? '̇' : '') : t.o < 0 ? DOWN[t.s] + (t.o < -1 ? '̣' : '') : t.s) + (t.v ? SUBS[t.v] : '');
const scaleText = list => list.map(x => { const m = /^([SRGMPDN])([1-3]?)('*)(\.*)$/.exec(x); return m ? glyph({ s: m[1], v: +m[2] || 0, o: m[3].length - m[4].length }) : x; }).join(' ');
const COMMON_SCALE = name => ({ name: name || 'Raga', aro: ['S', 'R2', 'G3', 'M1', 'P', 'D2', 'N3', "S'"], avaro: ["S'", 'N3', 'D2', 'P', 'M1', 'G3', 'R2', 'S'], note: '', from: 'common' });

async function showComposition(root, id) {
  root.innerHTML = '<div class="wrap"><div class="loading">Loading the composition…</div></div>';
  const c = await loadComposition(id);
  remember(id);
  document.title = nice(c.name) + ' · Repertoire · Vocal Gym';
  const tl = c.tala ? talaOf(c.tala.name) : null, tala = tl ? tl.tala : null;
  const scales = c.ragas.length ? c.ragas : [COMMON_SCALE(c.raga)];
  const ragas = scales.map(sc => ragaOf(sc) || ragaOf(COMMON_SCALE(sc.name)));
  const ragaOfSection = s => ragas[s.raga != null && ragas[s.raga] ? s.raga : 0];
  const scaleOfSection = s => scales[s.raga != null && scales[s.raga] ? s.raga : 0];
  const upbOf = s => s.unitsPerBeat || (c.tala ? c.tala.unitsPerBeat : 1);
  const secs = c.sections.map((s, i) => Object.assign({ i }, s));
  const playable = secs.filter(s => s.lines.length);
  const talaNote = !c.tala ? 'The post names no tala and its lines fit none, so the swaras are played without beat clicks.'
    : c.tala.refit ? 'The post names ' + esc(c.tala.refit) + ', but its notation is written in cycles of ' + esc(c.tala.name) + ', so the grid and the clicks follow ' + esc(c.tala.name) + '.'
    : c.tala.inferred ? 'The post names no tala; its lines fill cycles of ' + esc(c.tala.name) + ', so the grid follows that.' : '';
  const scaleNote = !c.ragas.length ? 'The post prints no scale, and no other composition in this raga does, so the swaras are sung with their common variants (R₂ G₃ M₁ D₂ N₃).'
    : scales[0].from === 'site' ? 'The post prints no scale; this is the scale other compositions in ' + esc(nice(c.raga)) + ' on the site print.'
    : scales[0].from === 'engine' ? 'The post prints no scale; this is ' + esc(scales[0].name) + ' as the engine knows it.' : '';

  root.innerHTML = '<div class="wrap">' +
    '<div class="phead rp-head"><a class="rp-back" href="#/repertoire">← All compositions</a><span class="eyebrow"><span class="dot"></span>' + esc(c.type) + (c.ragamalika ? ' · ragamalika' : '') + '</span><h1>' + esc(nice(c.name)) + '</h1>' +
      '<p class="lead">' + [c.raga && '<b>' + esc(nice(c.raga)) + '</b>', c.tala && esc(c.tala.name), c.composer && esc(c.composer), c.language && esc(c.language)].filter(Boolean).join(' · ') +
      '<br><span class="muted">Notation from <a href="' + esc(c.url) + '" target="_blank" rel="noopener">' + esc(c.title) + '</a> on Carnatic Music Notations (Balaji J.).</span></p></div>' +
    '<div class="tool"><aside class="panel" aria-label="Settings">' +
      '<div class="step"><div class="step-h"><span class="n">1</span><h3>Sections</h3></div><div class="rp-secnav" id="rp-secnav"></div></div>' +
      '<div class="step"><div class="step-h"><span class="n">2</span><h3>Practice speed</h3></div><div id="rp-speed"></div><p class="hint muted">Of the tempo set in the player. The notation’s speed is kept: double-speed groups stay twice as fast as the swaras around them.</p>' +
        '<div class="field"><label class="toggle"><input type="checkbox" id="rp-sah"> Show the sahitya under the swaras</label></div></div>' +
      '<div class="step"><div class="step-h"><span class="n">3</span><h3>Practise it</h3></div><p class="hint muted" style="margin-top:0">Time it as a practice session, or keep it in a routine. Either way it goes into your practice log.</p>' +
        '<div class="rp-acts"><button type="button" class="btn small" id="rp-session">Start a session</button><button type="button" class="btn small ghost" id="rp-addr">Add to a routine</button></div><div id="rp-routine"></div></div>' +
      '<div class="step"><div class="step-h"><span class="n">4</span><h3>The raga</h3></div><div id="rp-ragas"></div></div>' +
    '</aside><section class="result" aria-live="polite">' +
      '<div class="card rp-player"><div id="rp-tr"></div><div class="rp-now" id="rp-now"></div>' + (talaNote ? explain(talaNote) : '') + '</div>' +
      '<div id="rp-body"></div>' +
    '</section></div></div>';

  // the raga card(s)
  $('#rp-ragas').innerHTML = scales.map((sc, k) => '<div class="rp-raga"><b>' + esc(nice(k === 0 && c.raga ? c.raga : sc.name)) + '</b>' + (ragas[k] && ragas[k].twin ? '<span class="tag"> · gamaka from its profile</span>' : '') +
    '<div class="facts"><div><span class="k">Arohana</span><span class="scale">' + esc(scaleText(sc.aro)) + '</span></div><div><span class="k">Avarohana</span><span class="scale">' + esc(scaleText(sc.avaro)) + '</span></div></div>' + (sc.note ? '<p class="hint muted">' + esc(sc.note) + '</p>' : '') + '</div>').join('') + (scaleNote ? '<p class="hint muted">' + scaleNote + '</p>' : '');

  // the notation: every token gets a data-i; key "section:line:cell:tok" → data-i
  const idOf = new Map();
  let nextId = 0;
  const lineHtml = (s, l, li) => {
    const upb = upbOf(s), cyc = tala ? tala.total * upb : 0;
    const angaAt = new Set(); if (tala) { let a = 0; tala.angas.forEach(g => { angaAt.add(a * upb); a += g.len; }); }
    const syl = new Map(); (l.syl || []).forEach(([u, t]) => { const k = Math.floor(u + 1e-6); syl.set(k, (syl.has(k) ? syl.get(k) + ' ' : '') + t); });
    let u = l.at || 0, h = '';
    // a lead-in starts partway through the cycle: empty units show where
    if (l.at) { h += '<span class="rp-cell rp-pad" aria-hidden="true">'; for (let k = 0; k < l.at; k++) h += '<span class="rp-u pad' + (k === 0 ? ' sam' : angaAt.has(k) ? ' a' : k % upb === 0 ? ' b' : '') + '"><span class="rp-sw"></span></span>'; h += '</span>'; }
    l.cells.forEach((cell, ci) => {
      const toks = parseCell(cell);
      h += '<span class="rp-cell">';
      let k = 0;
      while (k < toks.length) {
        // one written unit: a swara, or the group of faster swaras that shares its time
        const grp = []; let d = 0;
        do { grp.push(k); d += toks[k].d; k++; } while (k < toks.length && d < 1 - 1e-9);
        const pos = Math.round(u * 1000) / 1000, inCyc = cyc ? ((Math.floor(pos + 1e-6) % cyc) + cyc) % cyc : -1;
        const cls = 'rp-u' + (grp.length > 1 ? ' fast' + (grp.length > 2 ? ' x' + grp.length : '') : '') + (cyc && Math.abs(pos - Math.round(pos)) < 1e-6 ? (inCyc === 0 ? ' sam' : angaAt.has(inCyc) ? ' a' : inCyc % upb === 0 ? ' b' : '') : '');
        h += '<span class="' + cls + '"><span class="rp-sw">' + grp.map(j => { const t = toks[j], n = nextId++; idOf.set(s.i + ':' + li + ':' + ci + ':' + j, n); return '<i data-i="' + n + '"' + (t.s === ',' ? ' class="k"' : ' title="' + esc(FULL[t.s] + (t.v ? ' ' + t.v : '') + (t.o > 0 ? ', upper octave' : t.o < 0 ? ', lower octave' : '')) + '"') + '>' + esc(glyph(t)) + '</i>'; }).join('') + '</span>' +
          (S.sahitya ? '<span class="rp-syl">' + esc(syl.get(Math.floor(pos + 1e-6)) || '') + '</span>' : '') + '</span>';
        u += d;
      }
      h += '</span>';
    });
    const flag = l.link ? 'link' : l.at ? 'lead-in' : l.tail ? 'overlap' : '';
    return '<div class="rp-line nrow" data-s="' + s.i + '" data-l="' + li + '"><div class="rp-lh"><button type="button" class="iconbtn rp-loop" data-loop="' + s.i + ':' + li + '" aria-label="Loop this line" title="Loop this line">⟲</button>' +
      (l.label ? '<span class="rp-lab">' + esc(l.label) + '</span>' : '') + (flag ? '<span class="rp-flag" title="' + (flag === 'link' ? 'A short phrase that leads back into a line' : flag === 'lead-in' ? 'Starts before sam and ends on it' : 'Its last cell fills the next line’s opening rests') + '">' + flag + '</span>' : '') + '</div>' +
      '<div class="rp-cells">' + h + '</div></div>';
  };
  const drawBody = () => {
    idOf.clear(); nextId = 0;
    $('#rp-body').innerHTML = secs.map(s => {
      const sc = scaleOfSection(s), showRaga = c.ragas.length > 1 && s.raga != null;
      return '<div class="card rp-sec" id="rp-sec-' + s.i + '"><div class="card-h"><div><h2>' + esc(nice(s.title) || (s.i === 0 ? 'The composition' : 'Section ' + (s.i + 1))) + '</h2>' +
        '<div class="card-sub">' + [showRaga ? esc(nice(sc.name)) : '', s.lines.length ? plural(s.lines.length, 'line') : 'lyrics', s.unitsPerBeat && c.tala ? esc(s.unitsPerBeat + ' swaras a beat') : ''].filter(Boolean).join(' · ') + '</div></div>' +
        (s.lines.length ? '<button type="button" class="btn small" data-play="' + s.i + '">Play this section</button>' : '') + '</div>' +
        (s.lyrics.length ? '<p class="rp-lyrics">' + s.lyrics.map(esc).join('<br>') + '</p>' : '') +
        (s.lines.length ? '<div class="rp-lines">' + s.lines.map((l, li) => lineHtml(s, l, li)).join('') + '</div>' : '') + '</div>';
    }).join('') || '<div class="card"><p class="muted">This post has no notation the importer could read. <a href="' + esc(c.url) + '" target="_blank" rel="noopener">Open it on the site</a>.</p></div>';
    $$('[data-play]', root).forEach(b => { b.onclick = () => { select({ s: +b.dataset.play, l: null }); play(); }; });
    $$('[data-loop]', root).forEach(b => { b.onclick = () => { const [si, li] = b.dataset.loop.split(':').map(Number); select({ s: si, l: li }); play(); }; });
  };

  // what plays: a section (from its first line) or one line, looped
  let sel = playable.length ? { s: playable[0].i, l: null } : null, job = null;
  const tr = transport($('#rp-tr'), 'Play', { voice: true });
  const select = x => {
    stop(); sel = x;
    const s = secs[x.s];
    $('#rp-now').innerHTML = x.l == null ? '<b>' + esc(nice(s.title) || 'Section ' + (x.s + 1)) + '</b> · ' + plural(s.lines.length, 'line') + '<span class="muted"> · Play sings it once (or loops with Loop on). ⟲ beside a line loops that line.</span>'
      : '<b>Line ' + (x.l + 1) + (s.lines[x.l].label ? ' (' + esc(s.lines[x.l].label) + ')' : '') + '</b> of ' + esc(nice(s.title) || 'section ' + (x.s + 1)) + ', looped <button type="button" class="btn small ghost" id="rp-whole">Back to the whole section</button>';
    const w = $('#rp-whole'); if (w) w.onclick = () => select({ s: x.s, l: null });
    $$('.rp-line.sel', root).forEach(el => el.classList.remove('sel'));
    if (x.l != null) { const el = root.querySelector('.rp-line[data-s="' + x.s + '"][data-l="' + x.l + '"]'); if (el) el.classList.add('sel'); }
    $$('#rp-secnav button', root).forEach(b => b.setAttribute('aria-current', String(+b.dataset.sec === x.s)));
    job = buildJob(x);
    tr.btn.onclick = () => toggle(tr.btn, job);
  };
  const buildJob = x => {
    const s = secs[x.s], raga = ragaOfSection(s), sc = scaleOfSection(s), upb = upbOf(s);
    const lines = (x.l == null ? s.lines : [s.lines[x.l]]).map(l => x.l == null ? l : Object.assign({}, l, { join: false }));
    const plan = playPlan(lines.map(l => Object.assign({ raga }, l)), { tala, unitsPerBeat: upb });
    // which notation token lights for each grid cell
    const at = []; plan.tokens.forEach(t => { const li = x.l == null ? t.line : x.l, n = idOf.get(s.i + ':' + li + ':' + t.cell + ':' + t.tok); for (let k = t.from; k < t.to; k++) at[k] = n; });
    const cycle = tala ? tala.total : 1, starts = tala ? plan.angaStarts : new Set([0]);
    return pitchedJob($('#rp-body'), plan.notes, plan.per, cycle, starts, {
      raga: raga && raga.twin ? raga.twin : null, scale: raga && raga.twin ? null : { name: sc.name || c.raga || 'Raga', aro: sc.aro, avaro: sc.avaro },
      tempo: () => S.speed, offset: tala ? plan.offset : 0, cellOf: k => at[k], loop: x.l != null, follow: x.l == null, seed: 1 + x.s * 31 + (x.l || 0)
    });
  };
  const play = () => { if (!job) return; if (!isPlaying(tr.btn)) toggle(tr.btn, job); };

  $('#rp-secnav').innerHTML = secs.map(s => '<button type="button" class="rp-secbtn" data-sec="' + s.i + '"' + (s.lines.length ? '' : ' data-lyrics') + '>' + esc(nice(s.title) || (s.i === 0 ? 'The composition' : 'Section ' + (s.i + 1))) + '<small>' + (s.lines.length ? plural(s.lines.length, 'line') : 'lyrics') + '</small></button>').join('');
  $('#rp-secnav').onclick = e => { const b = e.target.closest('[data-sec]'); if (!b) return; const si = +b.dataset.sec; if (secs[si].lines.length) select({ s: si, l: null }); const el = $('#rp-sec-' + si); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  seg($('#rp-speed'), [{ v: 0.5, label: '½', sub: 'slow' }, { v: 0.75, label: '¾', sub: 'steady' }, { v: 1, label: '1×', sub: 'the tempo' }], S.speed, v => { S.speed = v; if (sel) select(sel); });
  $('#rp-sah').checked = S.sahitya;
  $('#rp-sah').onchange = e => { S.sahitya = e.target.checked; drawBody(); if (sel) select(sel); };
  drawBody();
  if (sel) select(sel); else { $('#rp-now').innerHTML = '<span class="muted">This composition has no swara lines to play.</span>'; tr.btn.disabled = true; }

  // practice: a session of this piece, or an item in a routine
  const item = minutes => ({ kind: 'repertoire', title: nice(c.name).slice(0, 80), minutes, ref: c.id });
  const needLogin = async () => { if (!userKnown()) await refreshUser(); if (getUser()) return false; toast('Log in first: sessions and routines belong to an account.'); location.hash = '#/account'; return true; };
  $('#rp-session').onclick = async () => {
    if (await needLogin()) return;
    const cur = getRun();
    if (cur && !confirm(cur.finished ? 'A finished session is not saved yet. Start a new one and discard it?' : 'A session is in progress. Discard it and start one for this composition?')) return;
    startRun({ id: null, name: nice(c.name).slice(0, 60), items: [item(10)] });
    toast('Session started: the timer runs in the bar below.');
  };
  $('#rp-addr').onclick = async () => {
    if (await needLogin()) return;
    const box = $('#rp-routine');
    let R;
    try { R = await api.practice.routines(); } catch (e) { box.innerHTML = errorCard(e.message); return; }
    box.innerHTML = '<div class="rp-addbox"><div class="field"><label class="lab" for="rp-rsel">Routine</label><select id="rp-rsel">' + R.routines.map(r => '<option value="' + r.id + '">' + esc(r.name) + ' · ' + r.items.length + ' items</option>').join('') + '<option value="new">A new routine: “Repertoire”</option></select></div>' +
      '<div class="field"><label class="lab" for="rp-min">Minutes</label><input type="number" id="rp-min" min="1" max="120" value="10"></div><div class="rp-acts"><button type="button" class="btn small primary" id="rp-radd">Add</button><button type="button" class="btn small ghost" id="rp-rno">Cancel</button></div></div>';
    $('#rp-rno').onclick = () => { box.innerHTML = ''; };
    $('#rp-radd').onclick = async () => {
      const v = $('#rp-rsel').value, minutes = Math.max(1, Math.min(120, Math.round(+$('#rp-min').value) || 10));
      const r = R.routines.find(x => String(x.id) === v);
      const body = r ? { id: r.id, name: r.name, items: r.items.concat([item(minutes)]) } : { name: 'Repertoire', items: [item(minutes)] };
      try { await api.practice.saveRoutine(body); box.innerHTML = ''; toast('Added to ' + (r ? '“' + r.name + '”' : 'a new routine, “Repertoire”') + '.'); }
      catch (e) { toast(e.message); }
    };
  };
  return () => { stop(); tr.dispose(); };
}
