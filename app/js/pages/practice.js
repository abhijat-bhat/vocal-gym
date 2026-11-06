/* Practice (v0.8.7): the singer's streak, today against the daily goal and the last seven days; routines to
   start (three starters and the singer's own, which can be written and edited here); the history of
   sessions; and, at #/practice/finish, the end of a session: what was done, a rating and notes, saved to the
   server (or kept until the connection returns). A session in progress runs in the bar at the foot of every
   page (app/js/session.js), so the singer can move between the tools while its timer runs. */
import { api } from '../api.js';
import { esc, $, toast, errorCard, pageHead } from '../ui.js';
import { getUser, refreshUser, userKnown, onUser, getRun, startRun, discard, saveFinished, elapsed, clock, localDate, KIND, pending, routeOf, keepGoing, setSpent } from '../session.js';
import { dayKolam } from '../kolam-view.js';

/* a rating as dots; and a tool's name, unless the title says it already */
const dots = (n, of) => '<i class="on"></i>'.repeat(n) + '<i></i>'.repeat((of || n) - n);
const kindOf = it => { const l = (KIND[it.kind] || KIND.free).label; return it.title && it.title.toLowerCase().startsWith(l.toLowerCase()) ? '' : '<span class="pr-kind">' + esc(l) + '</span> '; };
const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const minutes = r => r.items.reduce((s, it) => s + it.minutes, 0);
const dayLabel = d => DAY[new Date(d + 'T12:00:00').getDay()];
// a duration in words: 45 s, 12 min, 1 h 05 min
const dur = sec => sec < 60 ? Math.round(sec) + ' s' : sec < 3600 ? Math.round(sec / 60) + ' min' : Math.floor(sec / 3600) + ' h ' + String(Math.round(sec / 60) % 60).padStart(2, '0') + ' min';
const nice = d => new Date(d + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

export async function mount(root, meta, parts) {
  let alive = true;
  if (!userKnown()) await refreshUser();
  const draw = () => { if (alive) { if (parts[0] === 'take') drawTake(root, parts[1]); else (parts[0] === 'finish' ? drawFinish : drawMain)(root); } };
  const off = onUser(() => draw());
  draw();
  return () => { alive = false; off(); };
}

function loggedOut(root) {
  root.innerHTML = '<div class="wrap">' + pageHead({ title: 'Practice with a plan', lead: 'Sign in to keep routines, time each part of a session as you move between the tools, and keep a log with your daily goal and your streak.' }) +
    '<div class="card pr-cta"><p>Practice sessions belong to an account, so your log and streak are there next time.</p><div class="pr-row"><a class="btn primary" href="#/account">Sign in or create an account</a></div></div></div>';
}

/* v0.11: a routine a teacher has sent */
async function drawTake(root, code) {
  const head = t => '<div class="wrap"><div class="phead pr-head"><h1>' + esc(t) + '</h1></div>';
  let r;
  try { r = await api.practice.shared(code); }
  catch (x) { root.innerHTML = head('This routine cannot be opened') + '<div class="card pr-cta"><p>' + esc(x.message) + '</p><div class="pr-row"><a class="btn" href="#/practice">Your routines</a></div></div></div>'; return; }
  const total = r.items.reduce((s, it) => s + it.minutes, 0), user = getUser();
  root.innerHTML = head(r.name) + '<section class="slab-card pr-take"><p>From <b>' + esc(r.from) + '</b> · ' + total + ' min</p><ol>' + r.items.map(it => '<li>' + kindOf(it) + esc(it.title) + ' <span class="muted">' + it.minutes + ' min</span></li>').join('') + '</ol>' +
    '<p class="pr-err" id="pr-takee" role="alert"></p><div class="pr-row">' + (user ? '<button class="btn primary" id="pr-take">Add to my routines</button>' : '<a class="btn primary" href="#/account">Sign in to add it</a><span class="muted">Then open this link again.</span>') + '</div>' + '<p class="hint">Your copy is yours to change. ' + esc(r.from) + ' sees how many have added it, and nothing of your practice.</p></section></div>';
  const b = $('#pr-take', root);
  if (b) b.onclick = async () => { b.disabled = true; try { const a = await api.practice.take(code); toast(a.added ? 'Added to your routines.' : 'You already have it.'); location.hash = '#/practice'; } catch (x) { $('#pr-takee', root).textContent = x.message; b.disabled = false; } };
}

async function drawMain(root) {
  const user = getUser();
  if (!user) return loggedOut(root);
  root.innerHTML = '<div class="wrap"><div class="phead pr-head"><h1>Your floor, ' + esc(user.displayName) + '</h1></div>' +
    '<div id="pr-run"></div><div class="slab-card pr-next" id="pr-next"><p class="muted">Loading…</p></div><div class="pr-stats" id="pr-stats"></div>' +
    '<section class="pr-sec"><div class="pr-h"><h2>Routines</h2><button type="button" class="btn small" id="pr-new">New routine</button></div><div id="pr-edit"></div><div class="pr-routines" id="pr-routines"></div></section>' +
    '<section class="pr-sec"><div class="pr-h"><h2>History</h2><span class="muted" id="pr-pend"></span></div><div id="pr-logs"></div></section></div>';
  drawRun(root);
  const n = pending(); $('#pr-pend', root).textContent = n ? n + (n === 1 ? ' session waits' : ' sessions wait') + ' to be saved when the connection returns' : '';
  try {
    const [S, R, L] = await Promise.all([api.practice.summary(localDate()), api.practice.routines(), api.practice.logs({ limit: 15 })]);
    if (!$('#pr-stats', root)) return;
    drawNext(root, S, R, L.logs); drawStats(root, S); drawRoutines(root, R); drawLogs(root, L.logs, true);
  } catch (e) { if (e.status === 401) return refreshUser(); const s = $('#pr-next', root); if (s) s.innerHTML = errorCard(e.message); }
  $('#pr-new', root).onclick = () => editor(root, null);
}

function drawRun(root) {
  const r = getRun(), el = $('#pr-run', root); if (!el) return;
  if (!r) { el.innerHTML = ''; return; }
  const to = routeOf(r.items[r.index]);
  el.innerHTML = '<div class="card pr-live"><div><b>' + (r.finished ? 'Finished, not yet saved: ' : 'In progress: ') + esc(r.routineName) + '</b><span class="muted"> · item ' + (r.index + 1) + ' of ' + r.items.length + ', ' + esc(r.items[r.index].title) + '</span></div>' +
    '<div class="pr-row">' + (r.finished ? '<a class="btn small primary" href="#/practice/finish">Save it</a>' : to ? '<a class="btn small primary" href="' + to + '">Back to ' + esc((KIND[r.items[r.index].kind] || KIND.free).label) + '</a>' : '') + '<button type="button" class="btn small ghost" id="pr-discard">Discard</button></div></div>';
  $('#pr-discard', root).onclick = () => { if (confirm('Discard this session? Its time will not be logged.')) { discard(); drawRun(root); } };
}

/* the next practice: the routine used last, what was said about it, and one Start */
function drawNext(root, S, R, logs) {
  const el = $('#pr-next', root); if (!el) return;
  const all = R.routines.concat(R.starters), last = logs[0], next = (last && all.find(r => r.id === last.routineId || r.name === last.routineName)) || all[0];
  const running = !!getRun();
  el.innerHTML = '<div class="pr-next-in">' + dayKolam(localDate(), S.todayMinutes, S.goal) + '<div class="pr-next-say"><h2>' + esc(next.name) + '</h2>' +
    '<p class="muted">' + minutes(next) + ' min · ' + next.items.map(it => esc(it.title)).join(' · ') + '</p>' +
    (last && last.notes ? '<p class="pr-lastnote">Your note from ' + esc(nice(last.localDate)) + ': ' + esc(last.notes) + '</p>' : logs.length ? '' : '<p class="muted">Press Start: the first tool opens and the timer runs in the bar at the foot of the page. Next moves on, and Finish logs the session.</p>') +
    '</div><button type="button" class="btn big ' + (running ? '' : 'primary') + '" data-start="' + esc(next.id) + '">Start</button></div>';
  const b = el.querySelector('[data-start]');
  b.onclick = () => { const cur = getRun(); if (cur && !confirm(cur.finished ? 'A finished session is not saved yet. Start a new one and discard it?' : 'A session is in progress. Discard it and start this one?')) return; startRun(next); };
}
function drawStats(root, S) {
  const st = S.streak;
  $('#pr-stats', root).innerHTML = '<div class="pr-line"><span class="pr-stat"><b class="pr-big">' + st.current + '</b> ' + (st.current === 1 ? 'day' : 'days') + (st.today ? ', today included' : st.alive ? '; practise today to keep it' : '') + '<span class="muted"> · best ' + st.best + '</span></span>' +
    '<span class="pr-stat"><b class="pr-big">' + S.todayMinutes + '</b> of ' + S.goal + ' min today <span class="muted">· ' + (S.goalMet ? 'daily goal met' : (S.goal - S.todayMinutes) + ' to your goal') + ' · <a href="#/account">change the goal</a></span></span></div>' +
    '<ol class="pr-week" aria-label="The last seven days">' + S.week.map(d => '<li class="' + (d.minutes ? '' : 'none') + '">' + dayKolam(d.date, d.minutes, S.goal) + '<b>' + dayLabel(d.date) + '</b><span>' + (d.minutes ? d.minutes + ' min' : 'none') + '</span></li>').join('') + '</ol>' +
    '<p class="muted pr-totals">' + S.totals.sessions + (S.totals.sessions === 1 ? ' session' : ' sessions') + ', ' + S.totals.minutes + ' minutes, on ' + S.totals.days + (S.totals.days === 1 ? ' day' : ' days') + ' in all. Any logged practice keeps a streak going.</p>';
}

let lastRoutines = null;
function drawRoutines(root, R) {
  lastRoutines = R;
  const card = (r, own) => '<article class="pr-rt"><div class="pr-h"><h3>' + esc(r.name) + '</h3><span class="muted">' + minutes(r) + ' min' + (own ? '' : ' · starter') + '</span></div>' +
    '<ol>' + r.items.map(it => '<li>' + kindOf(it) + (it.ref ? '<a href="#/repertoire/' + esc(it.ref) + '">' + esc(it.title) + '</a>' : esc(it.title)) + ' <span class="muted">' + it.minutes + ' min</span></li>').join('') + '</ol>' +
    '<div class="pr-row"><button type="button" class="btn small" data-start="' + esc(r.id) + '">Start</button>' +
    (own ? '<button type="button" class="btn small ghost" data-assign="' + r.id + '">Assign to students</button><button type="button" class="btn small ghost" data-edit="' + r.id + '">Edit</button><button type="button" class="btn small ghost" data-del="' + r.id + '">Delete</button>' : '<button type="button" class="btn small ghost" data-copy="' + esc(r.id) + '">Copy and edit</button>') + '</div></article>';
  $('#pr-routines', root).innerHTML = R.routines.map(r => card(r, true)).join('') + R.starters.map(r => card(r, false)).join('');
  const find = id => R.routines.concat(R.starters).find(r => String(r.id) === String(id));
  root.querySelectorAll('[data-start]').forEach(b => { b.onclick = () => {
    const cur = getRun();
    if (cur && !confirm(cur.finished ? 'A finished session is not saved yet. Start a new one and discard it?' : 'A session is in progress. Discard it and start this one?')) return;
    startRun(find(b.dataset.start));
  }; });
  root.querySelectorAll('[data-edit]').forEach(b => { b.onclick = () => editor(root, find(b.dataset.edit)); });
  root.querySelectorAll('[data-assign]').forEach(b => { b.onclick = async () => {
    const card = b.closest('.pr-rt'); let box = card.querySelector('.pr-assign');
    if (box) { box.remove(); return; }
    try {
      const s = await api.practice.share(+b.dataset.assign), url = location.origin + location.pathname + '#/practice/take/' + s.code;
      box = document.createElement('div'); box.className = 'pr-assign';
      box.innerHTML = '<label class="lab" for="pr-link-' + b.dataset.assign + '">Send this link to your students</label><div class="pr-row"><input type="text" readonly id="pr-link-' + b.dataset.assign + '" value="' + esc(url) + '"><button type="button" class="btn small">Copy</button></div><p class="hint">' + (s.taken ? s.taken + (s.taken === 1 ? ' student has' : ' students have') + ' added it. ' : '') + 'They get a copy to change. You see how many have added it, and nothing of their practice.</p>';
      card.appendChild(box);
      $('button', box).onclick = async () => { const i = $('input', box); try { await navigator.clipboard.writeText(i.value); toast('Link copied.'); } catch (x) { i.select(); toast('Press Ctrl+C to copy it.'); } };
    } catch (x) { toast(x.message); }
  }; });
  root.querySelectorAll('[data-copy]').forEach(b => { b.onclick = () => { const r = find(b.dataset.copy); editor(root, { name: r.name + ' (mine)', items: r.items.map(it => Object.assign({}, it)) }); }; });
  root.querySelectorAll('[data-del]').forEach(b => { b.onclick = async () => {
    if (!confirm('Delete this routine? Its logged sessions stay in your history.')) return;
    try { await api.practice.deleteRoutine(+b.dataset.del); drawRoutines(root, await api.practice.routines()); } catch (e) { toast(e.message); }
  }; });
}

/* the routine editor: a name and up to 30 items, each a tool, a title and minutes */
function editor(root, r) {
  const el = $('#pr-edit', root), kinds = Object.keys(KIND);
  let items = r ? r.items.map(it => Object.assign({}, it)) : [{ kind: 'alankara', title: '', minutes: 5 }];
  const row = (it, k) => '<div class="pr-item" data-k="' + k + '"><select data-f="kind" aria-label="Tool">' + kinds.map(x => '<option value="' + x + '"' + (x === it.kind ? ' selected' : '') + '>' + KIND[x].label + '</option>').join('') + '</select>' +
    '<input type="text" data-f="title" maxlength="80" placeholder="What to practise" value="' + esc(it.title) + '" aria-label="What to practise">' +
    '<label class="pr-min"><input type="number" data-f="minutes" min="1" max="120" value="' + it.minutes + '" aria-label="Minutes"> min</label>' +
    '<button type="button" class="iconbtn" data-mv="-1" aria-label="Move up"' + (k ? '' : ' disabled') + '>↑</button><button type="button" class="iconbtn" data-mv="1" aria-label="Move down"' + (k < items.length - 1 ? '' : ' disabled') + '>↓</button>' +
    '<button type="button" class="iconbtn" data-rm aria-label="Remove"' + (items.length > 1 ? '' : ' disabled') + '><svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button></div>';
  const read = () => { el.querySelectorAll('.pr-item').forEach(x => { const it = items[+x.dataset.k]; it.kind = x.querySelector('[data-f="kind"]').value; it.title = x.querySelector('[data-f="title"]').value; it.minutes = Math.round(+x.querySelector('[data-f="minutes"]').value) || 1; }); };
  const draw = () => {
    el.innerHTML = '<div class="card pr-editor"><h3>' + (r && r.id ? 'Edit routine' : 'New routine') + '</h3><div class="field"><label class="lab" for="pr-name">Name</label><input type="text" id="pr-name" maxlength="60" value="' + esc(r ? r.name : '') + '" placeholder="Before class"></div>' +
      '<div class="field"><span class="lab">Items</span>' + items.map(row).join('') + '</div><p class="muted" id="pr-total"></p><p class="pr-err" id="pr-err" role="alert"></p>' +
      '<div class="pr-row"><button type="button" class="btn small" id="pr-add"' + (items.length >= 30 ? ' disabled' : '') + '>Add an item</button><span class="pr-grow"></span><button type="button" class="btn small ghost" id="pr-cancel">Cancel</button><button type="button" class="btn small primary" id="pr-save">Save routine</button></div></div>';
    $('#pr-total', el).textContent = 'Total: ' + items.reduce((s, it) => s + (+it.minutes || 0), 0) + ' minutes';
    el.querySelectorAll('[data-mv]').forEach(b => { b.onclick = () => { read(); const k = +b.closest('.pr-item').dataset.k, j = k + +b.dataset.mv; [items[k], items[j]] = [items[j], items[k]]; draw(); }; });
    el.querySelectorAll('[data-rm]').forEach(b => { b.onclick = () => { read(); items.splice(+b.closest('.pr-item').dataset.k, 1); draw(); }; });
    el.querySelectorAll('[data-f="minutes"]').forEach(x => { x.oninput = () => { read(); $('#pr-total', el).textContent = 'Total: ' + items.reduce((s, it) => s + it.minutes, 0) + ' minutes'; }; });
    $('#pr-add', el).onclick = () => { read(); items.push({ kind: 'free', title: '', minutes: 5 }); draw(); };
    $('#pr-cancel', el).onclick = () => { el.innerHTML = ''; };
    $('#pr-save', el).onclick = async () => {
      read();
      const body = { name: $('#pr-name', el).value, items: items.map(it => Object.assign({ kind: it.kind, title: it.title.trim() || KIND[it.kind].label, minutes: it.minutes }, it.kind === 'repertoire' && it.ref ? { ref: it.ref } : {})) };
      if (r && r.id) body.id = r.id;
      try { await api.practice.saveRoutine(body); el.innerHTML = ''; drawRoutines(root, await api.practice.routines()); toast('Routine saved.'); }
      catch (e) { $('#pr-err', el).textContent = e.message; }
    };
    const nm = $('#pr-name', el); if (nm && !nm.value) nm.focus();
  };
  draw();
  el.scrollIntoView({ block: 'nearest' });
}

function drawLogs(root, logs, first) {
  const el = $('#pr-logs', root); if (!el) return;
  const html = logs.map(l => '<article class="pr-log" data-id="' + l.id + '"><div class="pr-log-h"><b>' + esc(nice(l.localDate)) + '</b><span>' + esc(l.routineName) + '</span><span class="muted">' + dur(l.seconds) + '</span>' +
    (l.rating ? '<span class="pr-stars" aria-label="' + l.rating + ' of 5">' + dots(l.rating, 5) + '</span>' : '') + '<button type="button" class="iconbtn" data-dl="' + l.id + '" aria-label="Delete this session"><svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button></div>' +
    '<div class="pr-log-items">' + l.items.map(it => '<span class="' + (it.done ? 'done' : '') + '">' + esc(it.title || (KIND[it.kind] || KIND.free).label) + ' · ' + dur(it.spentSec) + '</span>').join('') + '</div>' +
    (l.notes ? '<p class="pr-notes">' + esc(l.notes) + '</p>' : '') + '</article>').join('');
  if (first) el.innerHTML = logs.length ? html : '<p class="muted">No sessions yet. Start a routine above; when you finish, it is logged here.</p>';
  else { const more = $('#pr-more', el); if (more) more.remove(); el.insertAdjacentHTML('beforeend', html); }
  if (logs.length >= 15) { el.insertAdjacentHTML('beforeend', '<button type="button" class="btn small ghost" id="pr-more">Show older sessions</button>'); $('#pr-more', el).onclick = async () => { try { drawLogs(root, (await api.practice.logs({ limit: 15, before: logs[logs.length - 1].id })).logs, false); } catch (e) { toast(e.message); } }; }
  el.querySelectorAll('[data-dl]').forEach(b => { b.onclick = async () => {
    if (!confirm('Delete this session from your log? Your streak and totals are counted again without it.')) return;
    try { await api.practice.deleteLog(+b.dataset.dl); b.closest('.pr-log').remove(); drawStats(root, await api.practice.summary(localDate())); } catch (e) { toast(e.message); }
  }; });
}

/* ---- the end of a session ---- */
function drawFinish(root) {
  const r = getRun(), user = getUser();
  if (!user) return loggedOut(root);
  if (!r) { location.replace('#/practice'); return; }
  if (!r.finished) { root.innerHTML = '<div class="wrap" style="padding-top:40px"><div class="card"><p>This session is still running. Use Finish in the bar at the bottom when you are done.</p><a class="btn" href="#/practice">Back to practice</a></div></div>'; return; }
  const total = r.spent.reduce((a, b) => a + b, 0);
  let rating = 0;
  root.innerHTML = '<div class="wrap">' + pageHead({ title: esc(r.routineName), lead: 'You practised for ' + clock(total) + '. Put the time right if it is off, add a note for tomorrow, and it goes on your floor.' }) +
    '<div class="card pr-finish"><table class="pr-table"><thead><tr><th>Item</th><th>Planned</th><th>Spent</th><th>Done</th></tr></thead><tbody>' +
    r.items.map((it, k) => '<tr><td>' + kindOf(it) + esc(it.title) + '</td><td>' + it.minutes + ' min</td><td><label class="pr-min"><input type="number" data-spent="' + k + '" min="0" max="360" step="1" value="' + Math.round(elapsed(r, k) / 60) + '" aria-label="Minutes spent"> min</label></td><td><input type="checkbox" data-done="' + k + '"' + (r.done[k] ? ' checked' : '') + ' aria-label="Done"></td></tr>').join('') +
    '</tbody></table><div class="field"><span class="lab">How did it go?</span><div class="seg pr-rate" role="group" aria-label="Rating">' + [1, 2, 3, 4, 5].map(n => '<button type="button" data-r="' + n + '" aria-pressed="false" aria-label="' + n + ' of 5"><span class="pr-stars">' + dots(n) + '</span></button>').join('') + '</div></div>' +
    '<div class="field"><label class="lab" for="pr-notes">Notes for next time</label><textarea id="pr-notes" rows="3" maxlength="1000" placeholder="What went well, what to work on"></textarea></div>' +
    '<p class="pr-err" id="pr-err" role="alert"></p><div class="pr-row"><button type="button" class="btn ghost" id="pr-drop">Discard</button><button type="button" class="btn ghost" id="pr-on">Keep going</button><span class="pr-grow"></span><button type="button" class="btn primary" id="pr-keep">Save to my log</button></div></div></div>';
  root.querySelectorAll('[data-r]').forEach(b => { b.onclick = () => { rating = +b.dataset.r; root.querySelectorAll('[data-r]').forEach(x => x.setAttribute('aria-pressed', String(+x.dataset.r === rating))); }; });
  root.querySelectorAll('[data-done]').forEach(c => { c.onchange = () => { const x = getRun(); if (x) { x.done[+c.dataset.done] = c.checked; localStorage.setItem('vg-run', JSON.stringify(x)); } }; });
  root.querySelectorAll('[data-spent]').forEach(c => { const was = +c.value; c.onchange = () => { const m = Math.max(0, Math.min(360, Math.round(+c.value) || 0)); c.value = m; if (m !== was) setSpent(+c.dataset.spent, m * 60); }; });
  $('#pr-on', root).onclick = () => keepGoing();
  $('#pr-drop', root).onclick = () => { if (confirm('Discard this session? It will not be logged.')) { discard(); location.hash = '#/practice'; } };
  $('#pr-keep', root).onclick = async () => {
    const b = $('#pr-keep', root); b.disabled = true;
    try {
      const res = await saveFinished(rating, $('#pr-notes', root).value);
      toast(res.queued ? 'You are offline: the session is kept and will be saved when the connection returns.' : 'On your floor. See you tomorrow.');
      location.hash = '#/practice';
    } catch (e) { b.disabled = false; $('#pr-err', root).textContent = e.message; }
  };
}
