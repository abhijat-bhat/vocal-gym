/* Repertoire (v0.9): every composition of carnaticnotations.blogspot.com, to read and to sing.
   #/repertoire is the list, filtered by type, raga, tala, composer and language and searched by name;
   #/repertoire/<id> is one composition: its sections on the tala grid with the sahitya under the swaras, a
   section played (or a line looped) in the sung voice with the raga's gamaka, at a practice speed, and the
   piece added to a practice session or routine. The data is data/repertoire/ (scripts/import-repertoire.js),
   served at /repertoire/; the notation is read by the engine's repertoire module, in the page.
   v0.9.1: a singer can correct a line for their own account (the editor below, server/edits.js). The app then
   sings their version; each change goes in a log, on the composition's page and at #/repertoire/changes, that
   can be stepped through and undone. #/repertoire/<id>/change/<n> opens a composition at one change. */
import { api } from '../api.js';
import { toggle, pitchedJob, stop, isPlaying } from '../audio.js';
import { esc, $, $$, pageHead, transport, seg, toast, errorCard, explain, plural } from '../ui.js';
import { getUser, refreshUser, userKnown, getRun, startRun } from '../session.js';
import { parseCell, ragaOf, talaOf, playPlan, cleanCell, cleanLine, applyEdits, cycleGap, offCycle, sustainText, sustainLayout } from '/engine/repertoire.js';

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
  // a post that gathered several lessons has given way to them
  if (res.status === 404) { const ix = await loadIndex(), to = ix.redirects && ix.redirects[id]; if (to) return loadComposition(to); }
  if (!res.ok) throw new Error(res.status === 404 ? 'No composition “' + id + '” in the repertoire.' : 'Could not load the composition (' + res.status + ').');
  const c = await res.json();
  CACHE.set(id, c);
  return c;
}

export async function mount(root, meta, parts) {
  if (parts[0] === 'changes') return showChanges(root);
  if (parts[0]) return showComposition(root, decodeURIComponent(parts[0]), parts[1] === 'change' ? Number(parts[2]) : null);
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
    lead: plural(all.length, 'composition') + ' with their swaras and sahitya, from geethams and varnams to krithis and thillanas. Open one to read it on the tala grid, hear any section sung with its raga’s gamaka, loop a line until it sits, and add it to your practice. The notations are from <a href="' + esc(src.url) + '" target="_blank" rel="noopener">' + esc(src.name) + '</a> by ' + esc(src.author) + ', who offers them free to download and use, with the lessons of ' + Object.values(ix.sources || {}).map(x => esc(x.author)).join(', ') + '. Where a lesson is in several sources, the one that holds up best is used.',
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
    '<div class="step"><a class="btn small ghost" href="#/repertoire/changes">Your changes to the notation</a></div>' +
  '</aside><section class="result" aria-live="polite">' +
    '<div id="rp-recent"></div>' +
    '<div class="card"><div class="card-h"><div><h2 id="rp-count">…</h2><div class="card-sub" id="rp-sub"></div></div><label class="rp-sort">Sort <select id="rp-sort" aria-label="Sort by"><option value="name">Name</option><option value="raga">Raga</option><option value="composer">Composer</option><option value="updated">Recently added</option></select></label></div>' +
    '<ul class="rp-list" id="rp-list"></ul><div class="rp-more" id="rp-more"></div></div>' +
  '</section></div></div>';

  const counts = (key, list) => { const m = new Map(); list.forEach(c => { const v = c[key]; if (v) m.set(v, (m.get(v) || 0) + 1); }); return m; };
  const TYPES = ['Geetham', 'Lakshana geetham', 'Swarajathi', 'Jathiswaram', 'Varnam', 'Pada varnam', 'Daru varnam', 'Krithi', 'Thillana', 'Nottuswaram', 'Dasara pada', 'Thiruppugazh', 'Thiruppavai', 'Vachana', 'Ashtapadi', 'Shlokam'];
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

/* ---------------- changes: one entry of the log, and the page of them all ---------------- */
const tokensOf = line => line ? line.cells.map(sustainText).join(' | ').replace(/\[/g, '[ ').replace(/\]/g, ' ]').split(/\s+/).filter(Boolean) : [];
/* the tokens of two versions of a line, with those that differ marked */
function diffHtml(a, b) {
  const n = a.length, m = b.length, T = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) T[i][j] = a[i] === b[j] ? T[i + 1][j + 1] + 1 : Math.max(T[i + 1][j], T[i][j + 1]);
  const was = [], now = [];
  let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) { was.push(esc(a[i])); now.push(esc(b[j])); i++; j++; }
    else if (j >= m || (i < n && T[i + 1][j] >= T[i][j + 1])) { was.push('<del>' + esc(a[i]) + '</del>'); i++; }
    else { now.push('<ins>' + esc(b[j]) + '</ins>'); j++; }
  }
  return [was.join(' '), now.join(' ')];
}
const sylText = l => l && l.syl && l.syl.length ? l.syl.map(x => x[1]).join(' ') : '';
const VERB = { edit: 'Changed', add: 'Added', remove: 'Removed', restore: 'Put back' };
const whenOf = iso => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
function changeHtml(e, o) {
  const [was, now] = diffHtml(tokensOf(e.before), tokensOf(e.after));
  const rows = [];
  if (e.before) rows.push('<div class="rp-chgrow"><span class="k">Was</span><code>' + was + '</code></div>');
  if (e.after) rows.push('<div class="rp-chgrow"><span class="k">Now</span><code>' + now + '</code></div>');
  if (e.before && e.after && sylText(e.before) !== sylText(e.after)) rows.push('<div class="rp-chgrow"><span class="k">Sahitya</span><span>' + esc(sylText(e.before) || '(none)') + ' → ' + esc(sylText(e.after) || '(none)') + '</span></div>');
  if (e.before && e.after && (e.before.label || '') !== (e.after.label || '')) rows.push('<div class="rp-chgrow"><span class="k">Label</span><span>' + esc(e.before.label || '(none)') + ' → ' + esc(e.after.label || '(none)') + '</span></div>');
  const verb = e.action === 'restore' && !e.after ? 'Took back an added line' : VERB[e.action] || e.action;
  const acts = [];
  if (o.link) acts.push('<a class="btn small ghost" href="#/repertoire/' + esc(e.comp) + '/change/' + e.id + '">Open the line</a>');
  else acts.push('<button type="button" class="btn small ghost" data-go="' + e.id + '">Go to the line</button>');
  if (o.latest) acts.push('<button type="button" class="btn small ghost" data-undo="' + e.id + '" data-to="before">Undo</button>');
  else if (e.after) acts.push('<button type="button" class="btn small ghost" data-undo="' + e.id + '" data-to="after">Use this version</button>');
  return '<li class="rp-chg' + (o.current ? ' cur' : '') + '" data-chg="' + e.id + '"><div class="rp-chgh"><div><b>' + esc(verb) + '</b> · ' + esc(e.where) + (o.title ? ' of <a href="#/repertoire/' + esc(e.comp) + '">' + esc(nice(o.title)) + '</a>' : '') +
    '<div class="muted rp-chgw">' + esc(whenOf(e.at)) + '</div></div><span class="rp-acts">' + acts.join('') + '</span></div>' + rows.join('') +
    (e.note ? '<p class="rp-chgnote">' + esc(e.note) + '</p>' : '') + (o.lost ? '<p class="hint muted">This line is no longer in the imported notation, so this change is not applied.</p>' : '') + '</li>';
}
async function showChanges(root) {
  root.innerHTML = '<div class="wrap"><div class="loading">Loading your changes…</div></div>';
  const here = location.hash;
  if (!userKnown()) await refreshUser();
  if (location.hash !== here) return;
  document.title = 'Your changes · Repertoire · Vocal Gym';
  const back = '<a class="rp-back" href="#/repertoire">← All compositions</a>';
  if (!getUser()) { root.innerHTML = '<div class="wrap"><div class="phead rp-head">' + back + '<h1>Your changes to the notation</h1></div><div class="card pr-cta"><p>Your corrections belong to your account, so they are there next time.</p><div class="pr-row"><a class="btn primary" href="#/account">Log in or create an account</a></div></div></div>'; return; }
  const F = { comp: '', action: '' };
  let list = [], more = false, comps = [];
  const load = async older => {
    const r = await api.repertoire.changes({ comp: F.comp || undefined, action: F.action || undefined, before: older || undefined, limit: 30 });
    list = older ? list.concat(r.changes) : r.changes; more = r.more; comps = r.comps;
  };
  await load();
  if (location.hash !== here) return;
  root.innerHTML = '<div class="wrap"><div class="phead rp-head">' + back + '<span class="eyebrow"><span class="dot"></span>For singers · repertoire</span><h1>Your changes to the notation</h1><p class="lead">Every correction you have made, newest first. Open a change to go to its line, or undo it: an undo is a new entry, so nothing here is ever lost. The imported notation itself never changes.</p></div>' +
    '<div class="tool"><aside class="panel" aria-label="Filters"><div class="step"><div class="field" style="margin-top:0"><span class="lab">What</span><div class="chips rp-types" id="rc-what"></div></div></div>' +
    '<div class="step"><span class="lab rp-lablock">Composition</span><div class="rp-secnav" id="rc-comps"></div></div></aside>' +
    '<section class="result" aria-live="polite"><div class="card"><h2 id="rc-count"></h2><div id="rc-list"></div><div class="rp-more" id="rc-more"></div></div></section></div></div>';
  const WHAT = [['', 'All'], ['edit', 'Changed'], ['add', 'Added'], ['remove', 'Removed'], ['restore', 'Put back']];
  const draw = () => {
    $('#rc-what').innerHTML = WHAT.map(([v, t]) => '<button type="button" class="chip" data-what="' + v + '" aria-pressed="' + (F.action === v) + '">' + t + '</button>').join('');
    const total = comps.reduce((n, x) => n + x.n, 0);
    $('#rc-comps').innerHTML = comps.length ? '<button type="button" class="rp-secbtn" data-comp="" aria-current="' + !F.comp + '">Every composition<small>' + total + '</small></button>' + comps.map(x => '<button type="button" class="rp-secbtn" data-comp="' + esc(x.id) + '" aria-current="' + (F.comp === x.id) + '">' + esc(nice(x.title)) + '<small>' + x.n + '</small></button>').join('') : '<p class="muted">None yet.</p>';
    $('#rc-count').textContent = !list.length ? 'No changes' + (F.comp || F.action ? ' match' : ' yet') : F.comp || F.action ? plural(list.length, 'change') + (more ? ' so far' : '') : plural(total, 'change');
    let day = '';
    const groups = [];
    list.forEach(e => { const d = new Date(e.at).toLocaleDateString(undefined, { dateStyle: 'long' }); if (d !== day) { day = d; groups.push({ d, items: [] }); } groups[groups.length - 1].items.push(e); });
    $('#rc-list').innerHTML = groups.map(g => '<h3 class="rp-loghead">' + esc(g.d) + '</h3><ol class="rp-chgs">' + g.items.map(e => changeHtml(e, { latest: e.latest, link: true, title: F.comp ? null : e.title })).join('') + '</ol>').join('') ||
      '<p class="muted">Open a composition from the <a href="#/repertoire">repertoire</a>, press Edit the notation and change a line. It will appear here.</p>';
    $('#rc-more').innerHTML = more ? '<button type="button" class="btn small" id="rc-older">Show older changes</button>' : '';
    const m = $('#rc-older');
    if (m) m.onclick = async () => { try { await load(list[list.length - 1].id); draw(); } catch (e) { toast(e.message); } };
  };
  const reload = async () => { try { await load(); draw(); } catch (e) { toast(e.message); } };
  $('#rc-what').onclick = e => { const b = e.target.closest('[data-what]'); if (b) { F.action = b.dataset.what; reload(); } };
  $('#rc-comps').onclick = e => { const b = e.target.closest('[data-comp]'); if (b) { F.comp = b.dataset.comp; reload(); } };
  $('#rc-list').onclick = async e => {
    const b = e.target.closest('[data-undo]');
    if (!b) return;
    const it = list.find(x => x.id === +b.dataset.undo);
    b.disabled = true;
    try { await api.repertoire.restore({ comp: it.comp, id: it.id, to: b.dataset.to }); toast('Done. That is in the log too.'); await reload(); }
    catch (err) { b.disabled = false; toast(err.message); }
  };
  draw();
}

/* ---------------- one composition ---------------- */
const UP = { S: 'Ṡ', R: 'Ṙ', G: 'Ġ', M: 'Ṁ', P: 'Ṗ', D: 'Ḋ', N: 'Ṅ' };
const DOWN = { S: 'Ṣ', R: 'Ṛ', G: 'G̣', M: 'Ṃ', P: 'P̣', D: 'Ḍ', N: 'Ṇ' };
const SUBS = { 1: '₁', 2: '₂', 3: '₃' };
const FULL = { S: 'Sa', R: 'Ri', G: 'Ga', M: 'Ma', P: 'Pa', D: 'Dha', N: 'Ni' };
const glyph = t => t.s === ',' ? ',' : (t.o > 0 ? UP[t.s] + (t.o > 1 ? '̇' : '') : t.o < 0 ? DOWN[t.s] + (t.o < -1 ? '̣' : '') : t.s) + (t.v ? SUBS[t.v] : '');
const scaleText = list => list.map(x => { const m = /^([SRGMPDN])([1-3]?)('*)(\.*)$/.exec(x); return m ? glyph({ s: m[1], v: +m[2] || 0, o: m[3].length - m[4].length }) : x; }).join(' ');
// 1.5 → 1½: a line can be off by half a unit, where a double-speed group is one swara out
const amount = n => { const w = Math.floor(n + 1e-9), f = { 0.25: '¼', 0.5: '½', 0.75: '¾' }[Math.round((n - w) * 100) / 100]; return f ? (w || '') + f : String(Math.round(n * 1000) / 1000); };
const gapTag = g => g.over ? amount(g.over) + ' over' : amount(g.short) + ' short';
const gapNote = (g, talaName) => 'This line has ' + plural(g.units, 'unit').replace(String(g.units), amount(g.units)) + ', and each cycle of ' + talaName + ' here takes ' + g.cycle + ', so it is ' + plural(g.over || g.short, 'unit').replace(String(g.over || g.short), amount(g.over || g.short)) + (g.over ? ' over' : ' short of') + ' whole cycles.' + (g.cell != null ? ' It first goes off at cell ' + (g.cell + 1) + ', and the sam lines after that shift.' : '') + ' This is usually a slip in the notation. The swaras are shown and sung as written, because the right correction is a singer’s call.';
const COMMON_SCALE = name => ({ name: name || 'Raga', aro: ['S', 'R2', 'G3', 'M1', 'P', 'D2', 'N3', "S'"], avaro: ["S'", 'N3', 'D2', 'P', 'M1', 'G3', 'R2', 'S'], note: '', from: 'common' });

/* where the notation comes from, and (v0.9.3) how it did against the other sources of the same lesson */
function creditOf(c) {
  if (!c.source) return 'Notation from <a href="' + esc(c.url) + '" target="_blank" rel="noopener">' + esc(c.title) + '</a> on Carnatic Music Notations (Balaji J.).';
  const s = c.source, pages = s.pages ? (s.pages[0] === s.pages[1] ? ', page ' + s.pages[0] : ', pages ' + s.pages[0] + '–' + s.pages[1]) : '';
  return 'Notation from ' + (s.url ? '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a>' : esc(s.name)) + ' (' + esc(s.author) + ')' + pages + '.' +
    (c.siteUrl ? ' <a href="' + esc(c.siteUrl) + '" target="_blank" rel="noopener">Another version is on Carnatic Music Notations</a>.' : '');
}
function comparedHtml(c) {
  if (!c.compared || c.compared.length < 2) return '';
  const pct = x => Math.round(x * 100) + '%';
  const others = c.compared.length - 1;
  return '<details class="rp-compared"><summary>Why this notation: compared with ' + plural(others, 'other version') + '</summary>' +
    '<p class="hint muted">Each version is checked by the math and the rules: its lines must fill the tala’s cycles, keep to the raga’s swaras and make no leap an octave mark should explain. Fuller versions, and ones the others confirm, count too.</p>' +
    '<div class="rp-comptable"><table><thead><tr><th>Source</th><th>Tala</th><th>Raga</th><th>Octaves</th><th>Complete</th><th>Agrees</th></tr></thead><tbody>' +
    c.compared.map(v => '<tr' + (v.used ? ' class="used"' : '') + '><td>' + esc(v.source) + (v.pages ? ' <span class="muted">p.' + v.pages[0] + '</span>' : '') + (v.used ? ' <b>used</b>' : '') + '</td><td>' + pct(v.fit) + '</td><td>' + pct(v.raga) + '</td><td>' + pct(v.octave) + '</td><td>' + pct(v.whole) + '</td><td>' + pct(v.agree) + '</td></tr>').join('') +
    '</tbody></table></div></details>';
}
/* v0.9.4 what a geetham says, from the book that explains it, whichever version's notation is shown */
function meaningHtml(c) {
  const m = c.meaning;
  if (!m) return '';
  const s = m.source, pages = s.pages.length > 1 ? 'pages ' + s.pages[0] + '–' + s.pages[s.pages.length - 1] : 'page ' + s.pages[0];
  const paras = list => list.map(p => '<p>' + esc(p) + '</p>').join('');
  const head = t => t ? '<h3>' + esc(t) + '</h3>' : '';
  return '<div class="card rp-meaning" id="rp-meaning"><div class="card-h"><div><h2>Meaning</h2><div class="card-sub">From ' + esc(s.name) + ' (' + esc(s.author) + '), ' + pages + ', its English corrected</div></div></div>' +
    m.parts.map(p => head(p.title) + paras(p.text)).join('') +
    '<details class="rp-words"><summary>Word to word meaning</summary>' +
    m.words.map(w => head(w.title) + '<p class="rp-lyrics">' + w.lyric.map(esc).join('<br>') + '</p>' + paras(w.text)).join('') + '</details></div>';
}

async function showComposition(root, id, jumpTo) {
  root.innerHTML = '<div class="wrap"><div class="loading">Loading the composition…</div></div>';
  const here = location.hash;
  const c = await loadComposition(id);
  id = c.id;
  if (!userKnown()) await refreshUser();
  // the singer's corrections, from the server; the page still opens without them (offline, or logged out)
  let edits = [], editsOk = true;
  if (getUser()) { try { edits = (await api.repertoire.edits(id)).edits; } catch (e) { editsOk = false; } }
  if (location.hash !== here) return;
  remember(id);
  document.title = nice(c.name) + ' · Repertoire · Vocal Gym';
  const tl = c.tala ? talaOf(c.tala.name) : null, tala = tl ? tl.tala : null;
  const scales = c.ragas.length ? c.ragas : [COMMON_SCALE(c.raga)];
  const ragas = scales.map(sc => ragaOf(sc) || ragaOf(COMMON_SCALE(sc.name)));
  const ragaOfSection = s => ragas[s.raga != null && ragas[s.raga] ? s.raga : 0];
  const scaleOfSection = s => scales[s.raga != null && scales[s.raga] ? s.raga : 0];
  const upbOf = s => s.unitsPerBeat || (c.tala ? c.tala.unitsPerBeat : 1);
  let view = 'mine', editing = false, secs = [], lost = [], logOpen = false, logAt = null, editor = null;
  const compute = () => {
    const a = applyEdits(c, view === 'site' ? [] : edits);
    lost = a.lost;
    secs = a.comp.sections.map((s, i) => Object.assign({ i }, s));
  };
  compute();
  const secName = s => nice(s.title) || (s.i === (secs.find(x => x.lines.length) || {}).i ? 'The composition' : 'Section ' + (s.i + 1));
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
      '<br><span class="muted">' + creditOf(c) + '</span></p>' + comparedHtml(c) + '</div>' +
    '<div class="tool"><aside class="panel" aria-label="Settings">' +
      '<div class="step"><div class="step-h"><span class="n">1</span><h3>Sections</h3></div><div class="rp-secnav" id="rp-secnav"></div></div>' +
      '<div class="step"><div class="step-h"><span class="n">2</span><h3>Practice speed</h3></div><div id="rp-speed"></div><p class="hint muted">Of the tempo set in the player. The notation’s speed is kept: double-speed groups stay twice as fast as the swaras around them.</p>' +
        '<div class="field"><label class="toggle"><input type="checkbox" id="rp-sah"> Show the sahitya under the swaras</label></div></div>' +
      '<div class="step"><div class="step-h"><span class="n">3</span><h3>Practise it</h3></div><p class="hint muted" style="margin-top:0">Time it as a practice session, or keep it in a routine. Either way it goes into your practice log.</p>' +
        '<div class="rp-acts"><button type="button" class="btn small" id="rp-session">Start a session</button><button type="button" class="btn small ghost" id="rp-addr">Add to a routine</button></div><div id="rp-routine"></div></div>' +
      '<div class="step"><div class="step-h"><span class="n">4</span><h3>The raga</h3></div><div id="rp-ragas"></div></div>' +
      '<div class="step"><div class="step-h"><span class="n">5</span><h3>Correct the notation</h3></div><p class="hint muted" style="margin-top:0">Found a slip? Change a line in your own copy. The app then sings your version, and every change goes in a log you can step through and undo.</p>' +
        '<div class="rp-acts"><button type="button" class="btn small" id="rp-edit" aria-pressed="false">Edit the notation</button><a class="btn small ghost" href="#/repertoire/changes">All my changes</a></div><div id="rp-view" hidden></div></div>' +
    '</aside><section class="result" aria-live="polite">' +
      '<div class="card rp-player"><div id="rp-tr"></div><div class="rp-now" id="rp-now"></div>' + (talaNote ? explain(talaNote) : '') + '</div>' +
      '<div id="rp-log"></div>' +
      '<div id="rp-body"></div>' + meaningHtml(c) +
    '</section></div></div>';

  // the raga card(s)
  $('#rp-ragas').innerHTML = scales.map((sc, k) => '<div class="rp-raga"><b>' + esc(nice(k === 0 && c.raga ? c.raga : sc.name)) + '</b>' + (ragas[k] && ragas[k].twin ? '<span class="tag"> · gamaka from its profile</span>' : '') +
    '<div class="facts"><div><span class="k">Arohana</span><span class="scale">' + esc(scaleText(sc.aro)) + '</span></div><div><span class="k">Avarohana</span><span class="scale">' + esc(scaleText(sc.avaro)) + '</span></div></div>' + (sc.note ? '<p class="hint muted">' + esc(sc.note) + '</p>' : '') + (sc.was ? '<p class="hint muted">Corrected here. The source prints: ' + esc(sc.was) + '</p>' : '') + '</div>').join('') + (scaleNote ? '<p class="hint muted">' + scaleNote + '</p>' : '');

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
      // a new column at each beat line and each syllable, so a ; never hides either
      const whole = x => Math.abs(x - Math.round(x)) < 1e-6;
      const breakAt = x => {
        if (!whole(x)) return false;
        if (S.sahitya && syl.has(Math.round(x))) return true;
        if (!cyc) return false;
        const at = ((Math.round(x) % cyc) + cyc) % cyc;
        return at === 0 || angaAt.has(at) || (upb > 1 && at % upb === 0);
      };
      sustainLayout(toks, u, breakAt).forEach(col => {
        const pos = Math.round(col.from * 1000) / 1000, inCyc = cyc ? ((Math.floor(pos + 1e-6) % cyc) + cyc) % cyc : -1;
        const cls = 'rp-u' + (col.fast > 1 ? ' fast' + (col.fast > 2 ? ' x' + col.fast : '') : '') + (cyc && whole(pos) ? (inCyc === 0 ? ' sam' : angaAt.has(inCyc) ? ' a' : inCyc % upb === 0 ? ' b' : '') : '');
        h += '<span class="' + cls + '"' + (col.fast === 1 && col.units > 1 ? ' style="--u:' + col.units + '"' : '') + '><span class="rp-sw">' + col.parts.map(p => {
          const t = toks[p.toks[0]], n = nextId++;
          p.toks.forEach(j => idOf.set(s.i + ':' + li + ':' + ci + ':' + j, n));
          return '<i data-i="' + n + '"' + (t.s === ',' ? ' class="k"' : ' title="' + esc(FULL[t.s] + (t.v ? ' ' + t.v : '') + (t.o > 0 ? ', upper octave' : t.o < 0 ? ', lower octave' : '')) + '"') + '>' + esc(p.text || glyph(t)) + '</i>';
        }).join('') + '</span>' +
          (S.sahitya ? '<span class="rp-syl">' + esc(syl.get(Math.floor(pos + 1e-6)) || '') + '</span>' : '') + '</span>';
        u = col.from + col.units;
      });
      h += '</span>';
    });
    const flag = l.link ? 'link' : l.at ? 'lead-in' : l.tail ? 'overlap' : '';
    const gap = offCycle(s.lines, li, tala, upb);
    return '<div class="rp-line nrow" data-s="' + s.i + '" data-l="' + li + '"' + (l.key ? ' data-key="' + esc(l.key) + '"' : '') + '><div class="rp-lh"><button type="button" class="iconbtn rp-loop" data-loop="' + s.i + ':' + li + '" aria-label="Loop this line" title="Loop this line">⟲</button>' +
      (editing && l.key ? '<button type="button" class="iconbtn rp-pen" data-edit="' + s.i + ':' + li + '" aria-label="Edit this line" title="Edit this line">✎</button>' : '') +
      (l.edited ? '<button type="button" class="rp-flag rp-mine" data-logid="' + l.edited + '" title="You changed this line. Open the log of changes.">edited</button>' : '') +
      (l.fixed ? '<button type="button" class="rp-flag rp-fixed" data-logfix="' + esc(l.key || s.i + ':' + li) + '" title="' + esc('A typing slip was corrected at import. The site prints: ' + l.fixed.map(x => x.was).join(' | ')) + '">fixed</button>' : '') +
      (l.label ? '<span class="rp-lab">' + esc(l.label) + '</span>' : '') + (flag ? '<span class="rp-flag" title="' + (flag === 'link' ? 'A short phrase that leads back into a line' : flag === 'lead-in' ? 'Starts before sam and ends on it' : 'Its last cell fills the next line’s opening rests') + '">' + flag + '</span>' : '') +
      (gap ? '<button type="button" class="rp-flag rp-off" data-off="' + s.i + ':' + li + '" aria-expanded="false" title="' + esc(gapNote(gap, c.tala.name)) + '">' + esc(gapTag(gap)) + '</button>' : '') + '</div>' +
      '<div class="rp-cells">' + h + (l.note ? '<span class="rp-linenote">' + esc(l.note) + '</span>' : '') + '</div></div>';
  };
  const drawBody = () => {
    idOf.clear(); nextId = 0;
    $('#rp-body').innerHTML = secs.map(s => {
      const sc = scaleOfSection(s), showRaga = c.ragas.length > 1 && s.raga != null && fold(s.title) !== fold(sc.name);
      return '<div class="card rp-sec" id="rp-sec-' + s.i + '"><div class="card-h"><div><h2>' + esc(secName(s)) + '</h2>' +
        '<div class="card-sub">' + [showRaga ? esc(nice(sc.name)) : '', s.lines.length ? plural(s.lines.length, 'line') : 'lyrics', s.unitsPerBeat && c.tala ? esc(s.unitsPerBeat + ' swaras a beat') : ''].filter(Boolean).join(' · ') + '</div></div>' +
        (s.lines.length ? '<button type="button" class="btn small" data-play="' + s.i + '">Play this section</button>' : '') + '</div>' +
        (s.lyrics.length ? '<p class="rp-lyrics">' + s.lyrics.map(esc).join('<br>') + '</p>' : '') +
        (s.lines.length ? '<div class="rp-lines">' + s.lines.map((l, li) => lineHtml(s, l, li)).join('') + '</div>' : '') +
        (editing ? '<div class="rp-secfoot" data-foot="' + s.i + '"><button type="button" class="btn small ghost" data-addend="' + s.i + '">Add a line to this section</button></div>' : '') + '</div>';
    }).join('') || '<div class="card"><p class="muted">This post has no notation the importer could read. <a href="' + esc(c.url) + '" target="_blank" rel="noopener">Open it on the site</a>.</p></div>';
    $$('[data-play]', root).forEach(b => { b.onclick = () => { select({ s: +b.dataset.play, l: null }); play(); }; });
    $$('[data-loop]', root).forEach(b => { b.onclick = () => { const [si, li] = b.dataset.loop.split(':').map(Number); select({ s: si, l: li }); play(); }; });
    $$('[data-edit]', root).forEach(b => { b.onclick = () => { const [si, li] = b.dataset.edit.split(':').map(Number); openEditor(si, li, 'edit'); }; });
    $$('[data-addend]', root).forEach(b => { b.onclick = () => { const si = +b.dataset.addend, n = secs[si].lines.length; openEditor(si, n - 1, 'add'); }; });
    $$('[data-off]', root).forEach(b => { b.onclick = () => toggleGap(b); });
    $$('[data-logid]', root).forEach(b => { b.onclick = () => showInLog(+b.dataset.logid); });
    $$('[data-logfix]', root).forEach(b => { b.onclick = () => { logOpen = true; drawLog(); const el = root.querySelector('[data-fixof="' + b.dataset.logfix + '"]'); if (el) el.scrollIntoView({ block: 'center', behavior: motion() }); }; });
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

  const drawNav = () => { $('#rp-secnav').innerHTML = secs.map(s => '<button type="button" class="rp-secbtn" data-sec="' + s.i + '"' + (s.lines.length ? '' : ' data-lyrics') + '>' + esc(secName(s)) + '<small>' + (s.lines.length ? plural(s.lines.length, 'line') : 'lyrics') + '</small></button>').join('') + (c.meaning ? '<button type="button" class="rp-secbtn" data-meaning data-lyrics>Meaning<small>in English</small></button>' : ''); };
  drawNav();
  $('#rp-secnav').onclick = e => { if (e.target.closest('[data-meaning]')) { $('#rp-meaning').scrollIntoView({ behavior: motion(), block: 'start' }); return; } const b = e.target.closest('[data-sec]'); if (!b) return; const si = +b.dataset.sec; if (secs[si].lines.length) select({ s: si, l: null }); const el = $('#rp-sec-' + si); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  seg($('#rp-speed'), [{ v: 0.5, label: '½', sub: 'slow' }, { v: 0.75, label: '¾', sub: 'steady' }, { v: 1, label: '1×', sub: 'the tempo' }], S.speed, v => { S.speed = v; if (sel) select(sel); });
  $('#rp-sah').checked = S.sahitya;
  $('#rp-sah').onchange = e => { S.sahitya = e.target.checked; drawBody(); if (sel) select(sel); };
  drawBody();
  if (sel) select(sel); else { $('#rp-now').innerHTML = '<span class="muted">This composition has no swara lines to play.</span>'; tr.btn.disabled = true; }

  /* ---------------- correcting the notation ---------------- */
  const motion = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  const lastIdOf = key => { let id = 0; edits.forEach(e => { if (e.key === key) id = e.id; }); return id; };
  const lineEl = key => root.querySelector('.rp-line[data-key="' + key + '"]');
  const flash = key => {
    const el = lineEl(key);
    if (!el) return false;
    el.scrollIntoView({ block: 'center', behavior: motion() });
    el.classList.add('rp-flash');
    setTimeout(() => el.classList.remove('rp-flash'), 2400);
    return true;
  };
  // everything drawn from the edits, after a change or a switch of version
  const redraw = () => {
    stop();
    compute();
    editor = null;
    drawBody(); drawNav(); drawLog(); drawView();
    if (!sel || !secs[sel.s] || !secs[sel.s].lines.length || (sel.l != null && !secs[sel.s].lines[sel.l])) {
      const p = secs.find(s => s.lines.length);
      sel = p ? { s: p.i, l: null } : null;
    }
    tr.btn.disabled = !sel;
    if (sel) select(sel); else $('#rp-now').innerHTML = '<span class="muted">This composition has no swara lines to play.</span>';
  };
  const drawView = () => {
    const box = $('#rp-view');
    box.hidden = !edits.length;
    if (edits.length) seg(box, [{ v: 'mine', label: 'My version' }, { v: 'site', label: 'As imported' }], view, v => { view = v; if (v === 'site') { editing = false; syncEditBtn(); } redraw(); });
  };
  const syncEditBtn = () => { const b = $('#rp-edit'); b.setAttribute('aria-pressed', String(editing)); b.textContent = editing ? 'Stop editing' : 'Edit the notation'; };
  $('#rp-edit').onclick = async () => {
    if (await needLogin()) return;
    if (!editsOk) {
      try { edits = (await api.repertoire.edits(id)).edits; editsOk = true; }
      catch (e) { toast('Your changes could not be loaded, so editing is off: ' + e.message); return; }
    }
    editing = !editing;
    if (editing && view !== 'mine') view = 'mine';
    syncEditBtn();
    redraw();
    if (editing) toast('Press ✎ beside a line to change it.');
  };

  // the tag on a line off the cycle opens a note under it, since a tooltip never appears on a phone
  const toggleGap = b => {
    const el = b.closest('.rp-line'), open = el.nextElementSibling;
    if (open && open.classList.contains('rp-offnote')) { open.remove(); b.setAttribute('aria-expanded', 'false'); return; }
    const [si, li] = b.dataset.off.split(':').map(Number), s = secs[si], g = offCycle(s.lines, li, tala, upbOf(s)), key = s.lines[li].key;
    const note = document.createElement('div');
    note.className = 'rp-offnote'; note.setAttribute('role', 'note');
    note.innerHTML = '<p>' + esc(gapNote(g, c.tala.name)) + '</p><button type="button" class="btn small ghost">Correct this line</button>';
    note.querySelector('button').onclick = () => correct(key);
    el.after(note);
    b.setAttribute('aria-expanded', 'true');
  };
  const correct = async key => {
    if (await needLogin()) return;
    if (!editsOk) {
      try { edits = (await api.repertoire.edits(id)).edits; editsOk = true; }
      catch (e) { toast('Your changes could not be loaded, so editing is off: ' + e.message); return; }
    }
    if (view !== 'mine') { view = 'mine'; redraw(); }
    if (!editing) { editing = true; syncEditBtn(); }
    const si = secs.findIndex(s => s.lines.some(l => l.key === key));
    if (si < 0) { toast('You have removed that line.'); return; }
    openEditor(si, secs[si].lines.findIndex(l => l.key === key), 'edit');
  };

  /* the editor opens under its line, which stays (hidden) in the page: the player finds swaras by their order.
     mode 'edit': the line si:li. mode 'add': a new line after li (-1: the start of the section). */
  const openEditor = (si, li, mode) => {
    stop();
    drawBody();
    const s = secs[si], l = li >= 0 ? s.lines[li] : null, adding = mode === 'add';
    const upb = upbOf(s), cyc = tala ? tala.total * upb : 0;
    const angaAt = new Set(); if (tala) { let a = 0; tala.angas.forEach(g => { angaAt.add(a * upb); a += g.len; }); }
    const orig = new Map();   // the syllables as stored, by the unit their box shows
    if (!adding) (l.syl || []).forEach(x => { const k = Math.floor(x[0] + 1e-6); if (!orig.has(k)) orig.set(k, []); orig.get(k).push(x); });
    const typed = new Map(Array.from(orig.entries()).map(([k, v]) => [k, v.map(x => x[1]).join(' ')]));
    const blank = adding ? Math.max(1, l ? l.cells.length : 1) : 0;
    const startCells = adding ? Array.from({ length: blank }, () => '') : l.cells.map(sustainText);
    const where = esc(nice(s.title) || 'Section ' + (si + 1));
    const form = document.createElement('form');
    form.className = 'rp-edit'; form.noValidate = true;
    form.setAttribute('aria-label', adding ? 'Add a line' : 'Edit line ' + (li + 1));
    form.innerHTML = '<div class="rp-edh"><b>' + (adding ? 'A new line' + (l ? ' after line ' + (li + 1) : '') : 'Line ' + (li + 1)) + '</b><span class="muted"> · ' + where + '</span></div>' +
      '<div class="rp-edcells"></div><button type="button" class="btn small ghost rp-edmore">Add a cell</button>' +
      '<p class="hint muted">S R G M P D N, with a digit for a variant (R2). <code>S\'</code> is the upper octave and <code>N.</code> the lower (the site’s S’ and ‘N work too). <code>,</code> holds for one unit and <code>;</code> for two, so <code>P, ;</code> lasts four. <code>[P N]</code> is double speed and <code>[[P N S R]]</code> four times. The grid below shows every unit, so a syllable can go under any of them.</p>' +
      '<div class="rp-edgrid" aria-label="The line on the tala grid, with a box for each syllable"></div>' +
      '<div class="rp-edstat" role="status"></div>' +
      '<div class="rp-edmeta"><div class="field"><label class="lab" for="rp-edlab">Label</label><input type="text" id="rp-edlab" maxlength="80" autocomplete="off" value="' + esc(l && !adding ? l.label || '' : '') + '"></div>' +
        '<div class="field"><label class="lab" for="rp-ednote">Why (for the log; optional)</label><input type="text" id="rp-ednote" maxlength="300" autocomplete="off" placeholder="My teacher sings R here"></div></div>' +
      '<div class="rp-acts"><button type="submit" class="btn small primary rp-edsave">Save</button><button type="button" class="btn small ghost rp-edno">Cancel</button>' +
        (!adding ? '<button type="button" class="btn small ghost rp-edadd">Add a line below</button><button type="button" class="btn small ghost rp-eddel">Remove this line</button>' : '') +
        (!adding && l.edited && l.key.startsWith('b:') ? '<button type="button" class="btn small ghost rp-edsite">Back to the imported line</button>' : '') + '</div>';
    if (l && !adding) { const el = lineEl(l.key); el.hidden = true; el.after(form); }
    else if (l) { const el = lineEl(l.key) || root.querySelector('.rp-line[data-s="' + si + '"][data-l="' + li + '"]'); el.after(form); }
    else { const foot = root.querySelector('[data-foot="' + si + '"]'); (foot || $('#rp-sec-' + si)).before(form); }
    const q = sel => form.querySelector(sel);
    const cellsBox = q('.rp-edcells');
    const addCellInput = v => {
      const n = cellsBox.children.length + 1, wrap = document.createElement('div');
      wrap.className = 'rp-edcell';
      wrap.innerHTML = '<label class="lab" for="rp-edc' + n + '">Cell ' + n + '</label><input type="text" id="rp-edc' + n + '" class="rp-edin" spellcheck="false" autocomplete="off" autocapitalize="characters" value="' + esc(v) + '">';
      cellsBox.appendChild(wrap);
    };
    startCells.forEach(addCellInput);
    const inputs = () => Array.from(cellsBox.querySelectorAll('input'));
    let shownUnits = new Set();
    const drawGrid = () => {
      let u = 0, h = '';
      const seen = new Set();
      inputs().forEach(inp => {
        const r = cleanCell(inp.value);
        inp.classList.toggle('bad', !!r.errors.length);
        if (!r.text || r.errors.length) { u += r.units; return; }
        const toks = parseCell(r.text);
        h += '<span class="rp-cell">';
        let k = 0;
        while (k < toks.length) {
          const grp = []; let d = 0;
          do { grp.push(toks[k]); d += toks[k].d; k++; } while (k < toks.length && d < 1 - 1e-9);
          const pos = Math.round(u * 1000) / 1000, at = Math.floor(pos + 1e-6), inCyc = cyc ? at % cyc : -1, first = !seen.has(at);
          seen.add(at);
          const cls = 'rp-u' + (grp.length > 1 ? ' fast' + (grp.length > 2 ? ' x' + grp.length : '') : '') + (cyc && Math.abs(pos - Math.round(pos)) < 1e-6 ? (inCyc === 0 ? ' sam' : angaAt.has(inCyc) ? ' a' : inCyc % upb === 0 ? ' b' : '') : '');
          h += '<span class="' + cls + '"><span class="rp-sw">' + grp.map(t => '<b' + (t.s === ',' ? ' class="k"' : '') + '>' + esc(glyph(t)) + '</b>').join('') + '</span>' +
            (first ? '<input type="text" class="rp-sylin" data-u="' + at + '" aria-label="Syllable under swara ' + (at + 1) + '" autocomplete="off" spellcheck="false" value="' + esc(typed.get(at) || '') + '">' : '') + '</span>';
          u += d;
        }
        h += '</span>';
      });
      shownUnits = seen;
      q('.rp-edgrid').innerHTML = h || '<span class="muted">The line appears here as you type.</span>';
      const res = cleanLine({ cells: inputs().map(i => i.value) });
      const status = q('.rp-edstat');
      const gap = tala && res.units ? cycleGap(res.line ? res.line.cells : [], tala, upb) : null;
      status.className = 'rp-edstat' + (res.errors.length ? ' bad' : '');
      status.textContent = res.errors.length && inputs().some(i => i.value.trim()) ? res.errors[0]
        : !res.units ? ''
        : amount(res.units) + (res.units === 1 ? ' unit' : ' units') + (!cyc ? '.' : gap ? ': ' + gapTag(gap) + ' whole cycles of ' + cyc + (gap.cell != null ? ', first off at cell ' + (gap.cell + 1) : '') + '. You can still save it; the next line waits for sam.' : ': ' + plural(res.units / cyc, 'whole cycle') + ' of ' + c.tala.name + '.');
    };
    const sylOf = () => {
      const out = [];
      shownUnits.forEach(at => {
        const t = (typed.get(at) || '').trim(), was = orig.get(at);
        if (!t) return;
        if (was && was.map(x => x[1]).join(' ') === t) out.push(...was);
        else t.split(/\s+/).forEach(w => out.push([at, w]));
      });
      // syllables on a unit the grid has no box for stay, while they are still inside the line
      orig.forEach((was, at) => { if (!shownUnits.has(at)) out.push(...was); });
      return out;
    };
    const finish = async (promise, done, key) => {
      form.querySelectorAll('button').forEach(b => { b.disabled = true; });
      try {
        const r = await promise;
        edits = r.edits; editsOk = true;
        redraw();
        toast(done);
        const k = key || edits[edits.length - 1].key;
        if (!flash(k)) { const b = $('#rp-edit'); if (b) b.focus(); }
        else { const pen = lineEl(k).querySelector('.rp-pen'); if (pen) pen.focus({ preventScroll: true }); }
      } catch (e) {
        form.querySelectorAll('button').forEach(b => { b.disabled = false; });
        const st = q('.rp-edstat'); st.className = 'rp-edstat bad'; st.textContent = e.status === 401 ? 'You have been logged out. Log in again, then save.' : e.message;
      }
    };
    const note = () => q('#rp-ednote').value;
    cellsBox.oninput = drawGrid;
    q('.rp-edgrid').oninput = e => { if (e.target.dataset.u != null) typed.set(+e.target.dataset.u, e.target.value); };
    q('.rp-edmore').onclick = () => { if (inputs().length >= 32) return toast('A line has at most 32 cells.'); addCellInput(''); inputs().slice(-1)[0].focus(); drawGrid(); };
    q('.rp-edno').onclick = () => { editor = null; drawBody(); if (sel) select(sel); };
    form.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); q('.rp-edno').click(); } });
    if (q('.rp-edadd')) q('.rp-edadd').onclick = () => openEditor(si, li, 'add');
    if (q('.rp-eddel')) q('.rp-eddel').onclick = () => finish(api.repertoire.save({ comp: id, action: 'remove', key: l.key, note: note(), expect: lastIdOf(l.key) }), 'Line removed. You can undo it in the log of changes.', null);
    if (q('.rp-edsite')) q('.rp-edsite').onclick = () => finish(api.repertoire.restore({ comp: id, id: lastIdOf(l.key), to: 'site', note: note(), expect: lastIdOf(l.key) }), 'Back to the imported line.', l.key);
    form.onsubmit = e => {
      e.preventDefault();
      const res = cleanLine({ cells: inputs().map(i => i.value), syl: sylOf(), label: q('#rp-edlab').value });
      if (res.errors.length) { const st = q('.rp-edstat'); st.className = 'rp-edstat bad'; st.textContent = res.errors[0]; const badIn = form.querySelector('.rp-edin.bad'); if (badIn) badIn.focus(); return; }
      if (adding) return finish(api.repertoire.save({ comp: id, action: 'add', section: si, anchor: l ? l.key : 's', line: res.line, note: note() }), 'Line added. It is in your log of changes.', null);
      finish(api.repertoire.save({ comp: id, action: 'edit', key: l.key, line: res.line, note: note(), expect: lastIdOf(l.key) }), 'Saved. It is in your log of changes.', l.key);
    };
    editor = form;
    drawGrid();
    const first = inputs()[0];
    if (first) { first.focus({ preventScroll: true }); form.scrollIntoView({ block: 'nearest', behavior: motion() }); }
  };

  /* the log of this composition: the singer's changes, oldest to newest with Earlier and Later, and the slips
     corrected at import */
  const undo = async (e, to) => {
    try {
      const r = await api.repertoire.restore({ comp: id, id: e.id, to, expect: lastIdOf(e.key) });
      edits = r.edits;
      if (logAt != null) logAt = edits.length - 1;
      redraw();
      toast('Done. That is in the log too.');
      if (edits[edits.length - 1].after) flash(e.key);
    } catch (err) { toast(err.message); }
  };
  const goTo = e => {
    if (view !== 'mine') { view = 'mine'; redraw(); }
    if (!flash(e.key)) toast(lost.some(x => x.key === e.key) ? 'That line is no longer in the imported notation.' : 'That line is removed now. Undo the change to bring it back.');
  };
  const showInLog = logId => {
    const k = edits.findIndex(e => e.id === logId);
    if (k < 0) return;
    logOpen = true; logAt = k; drawLog();
    const el = root.querySelector('[data-chg="' + logId + '"]');
    if (el) el.scrollIntoView({ block: 'center', behavior: motion() });
  };
  const drawLog = () => {
    const fixes = [];
    c.sections.forEach((s, si) => s.lines.forEach((l, li) => (l.fixed || []).forEach(x => fixes.push({ si, li, x, l }))));
    const box = $('#rp-log');
    if (!edits.length && !fixes.length) { box.innerHTML = ''; return; }
    const latest = new Map(); edits.forEach(e => latest.set(e.key, e.id));
    const n = edits.length, at = logAt == null ? n - 1 : Math.min(logAt, n - 1);
    box.innerHTML = '<details class="card rp-log"' + (logOpen ? ' open' : '') + '><summary><b>Changes to this composition</b><span class="muted"> · ' + [n ? plural(n, 'change') + ' by you' : '', fixes.length ? plural(fixes.length, 'slip') + ' corrected at import' : ''].filter(Boolean).join(' · ') + '</span></summary>' +
      (n ? '<div class="rp-stepper"><button type="button" class="btn small ghost" id="rp-older"' + (at <= 0 ? ' disabled' : '') + '>‹ Earlier</button><span class="rp-stepnow" role="status">Change ' + (at + 1) + ' of ' + n + '</span><button type="button" class="btn small ghost" id="rp-newer"' + (at >= n - 1 ? ' disabled' : '') + '>Later ›</button><a class="rp-all" href="#/repertoire/changes">All my changes</a></div>' +
        '<ol class="rp-chgs">' + edits.map((e, k) => ({ e, k })).reverse().map(({ e, k }) => changeHtml(e, { latest: latest.get(e.key) === e.id, current: k === at, lost: lost.some(x => x.key === e.key) })).join('') + '</ol>' : '') +
      (fixes.length ? '<h3 class="rp-loghead">Corrected at import</h3><p class="hint muted">Typing slips on the site, read as they were clearly meant. Your own changes come on top of these.</p><ul class="rp-chgs">' +
        fixes.map(f => '<li class="rp-chg" data-fixof="b:' + f.si + ':' + f.li + '"><div class="rp-chgh"><b>' + esc(nice(c.sections[f.si].title) || 'Section ' + (f.si + 1)) + ', line ' + (f.li + 1) + '</b><span class="rp-acts"><button type="button" class="btn small ghost" data-gofix="b:' + f.si + ':' + f.li + '">Go to the line</button></span></div>' +
          '<div class="rp-chgrow"><span class="k">Site</span><code>' + esc(f.x.was) + '</code></div><div class="rp-chgrow"><span class="k">Read as</span><code>' + esc(sustainText(f.l.cells[f.x.cell])) + '</code></div></li>').join('') + '</ul>' : '') + '</details>';
    const d = box.querySelector('details');
    d.ontoggle = () => { logOpen = d.open; };
    const step = k => { logAt = k; logOpen = true; drawLog(); goTo(edits[k]); };
    const older = $('#rp-older'), newer = $('#rp-newer');
    if (older) older.onclick = () => step(at - 1);
    if (newer) newer.onclick = () => step(at + 1);
    box.querySelectorAll('[data-go]').forEach(b => { b.onclick = () => { const k = edits.findIndex(e => e.id === +b.dataset.go); logAt = k; drawLog(); goTo(edits[k]); }; });
    box.querySelectorAll('[data-undo]').forEach(b => { b.onclick = () => undo(edits.find(e => e.id === +b.dataset.undo), b.dataset.to); });
    box.querySelectorAll('[data-gofix]').forEach(b => { b.onclick = () => { if (!flash(b.dataset.gofix)) toast('You have changed or removed that line.'); }; });
  };
  drawLog(); drawView();
  if (jumpTo != null) { const k = edits.findIndex(e => e.id === jumpTo); if (k >= 0) { logOpen = true; logAt = k; drawLog(); setTimeout(() => goTo(edits[k]), 60); } }

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
