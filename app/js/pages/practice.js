/* Practice (v0.8.7): the singer's streak, today against the daily goal and the last seven days; routines to
   start (three starters and the singer's own, which can be written and edited here); the history of
   sessions; and, at #/practice/finish, the end of a session: what was done, a rating and notes, saved to the
   server (or kept until the connection returns). A session in progress runs in the bar at the foot of every
   page (app/js/session.js), so the singer can move between the tools while its timer runs. */
import { api } from '../api.js';
import { esc, $, toast, errorCard, pageHead } from '../ui.js';
import { getUser, refreshUser, userKnown, onUser, getRun, startRun, discard, saveFinished, elapsed, clock, localDate, KIND, pending } from '../session.js';

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const minutes = r => r.items.reduce((s, it) => s + it.minutes, 0);
const dayLabel = d => DAY[new Date(d + 'T12:00:00').getDay()];
// a duration in words: 45 s, 12 min, 1 h 05 min
const dur = sec => sec < 60 ? Math.round(sec) + ' s' : sec < 3600 ? Math.round(sec / 60) + ' min' : Math.floor(sec / 3600) + ' h ' + String(Math.round(sec / 60) % 60).padStart(2, '0') + ' min';
const nice = d => new Date(d + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

export async function mount(root, meta, parts) {
  let alive = true;
  if (!userKnown()) await refreshUser();
  const draw = () => { if (alive) (parts[0] === 'finish' ? drawFinish : drawMain)(root); };
  const off = onUser(() => draw());
  draw();
  return () => { alive = false; off(); };
}

function loggedOut(root) {
  root.innerHTML = '<div class="wrap">' + pageHead({ eyebrow: 'Your practice', title: 'Practice with a plan', lead: 'Make an account to keep routines, time each part of a session as you move between the tools, and keep a log with your daily goal and your streak. Everything is stored in this computer’s Vocal Gym database.' }) +
    '<div class="card pr-cta"><p>Practice sessions belong to an account, so your log and streak are there next time.</p><div class="pr-row"><a class="btn primary" href="#/account">Log in or create an account</a></div></div></div>';
}

async function drawMain(root) {
  const user = getUser();
  if (!user) return loggedOut(root);
  root.innerHTML = '<div class="wrap">' + pageHead({ eyebrow: 'Your practice', title: 'Practice', lead: 'Hello, ' + esc(user.displayName) + '. Pick a routine and press Start: its first tool opens and the timer runs in the bar at the bottom while you practise. Move on with Next, and finish to log the session.' }) +
    '<div id="pr-run"></div><div class="pr-stats" id="pr-stats"><div class="card"><p class="muted">Loading…</p></div></div>' +
    '<section class="pr-sec"><div class="pr-h"><h2>Routines</h2><button type="button" class="btn small" id="pr-new">New routine</button></div><div id="pr-edit"></div><div class="pr-routines" id="pr-routines"></div></section>' +
    '<section class="pr-sec"><div class="pr-h"><h2>History</h2><span class="muted" id="pr-pend"></span></div><div id="pr-logs"></div></section></div>';
  drawRun(root);
  const n = pending(); $('#pr-pend', root).textContent = n ? n + (n === 1 ? ' session waits' : ' sessions wait') + ' to be saved when the connection returns' : '';
  try {
    const [S, R, L] = await Promise.all([api.practice.summary(localDate()), api.practice.routines(), api.practice.logs({ limit: 15 })]);
    if (!$('#pr-stats', root)) return;
    drawStats(root, S); drawRoutines(root, R); drawLogs(root, L.logs, true);
  } catch (e) { if (e.status === 401) return refreshUser(); const s = $('#pr-stats', root); if (s) s.innerHTML = errorCard(e.message); }
  $('#pr-new', root).onclick = () => editor(root, null);
}

function drawRun(root) {
  const r = getRun(), el = $('#pr-run', root); if (!el) return;
  if (!r) { el.innerHTML = ''; return; }
  el.innerHTML = '<div class="card pr-live"><div><b>' + (r.finished ? 'Finished, not yet saved: ' : 'In progress: ') + esc(r.routineName) + '</b><span class="muted"> · item ' + (r.index + 1) + ' of ' + r.items.length + ', ' + esc(r.items[r.index].title) + '</span></div>' +
    '<div class="pr-row">' + (r.finished ? '<a class="btn small primary" href="#/practice/finish">Save it</a>' : '') + '<button type="button" class="btn small ghost" id="pr-discard">Discard</button></div></div>';
  $('#pr-discard', root).onclick = () => { if (confirm('Discard this session? Its time will not be logged.')) { discard(); drawRun(root); } };
}

function drawStats(root, S) {
  const pct = Math.min(100, Math.round(100 * S.todayMinutes / Math.max(1, S.goal))), mx = Math.max(S.goal, ...S.week.map(d => d.minutes));
  const st = S.streak;
  $('#pr-stats', root).innerHTML =
    '<div class="card pr-stat"><span class="pr-k">Streak</span><b class="pr-big">' + st.current + '</b><span>' + (st.current === 1 ? 'day' : 'days') + (st.today ? ', today included' : st.alive ? '; practise today to keep it' : '') + '</span><span class="muted">Best: ' + st.best + (st.best === 1 ? ' day' : ' days') + '</span></div>' +
    '<div class="card pr-stat"><span class="pr-k">Today</span><b class="pr-big">' + S.todayMinutes + '<small> / ' + S.goal + ' min</small></b><div class="pr-bar" role="progressbar" aria-valuenow="' + S.todayMinutes + '" aria-valuemin="0" aria-valuemax="' + S.goal + '"><i style="width:' + pct + '%"></i></div><span class="muted">' + (S.goalMet ? 'Daily goal met.' : (S.goal - S.todayMinutes) + ' minutes to your daily goal') + ' · <a href="#/account">change the goal</a></span></div>' +
    '<div class="card pr-stat"><span class="pr-k">The last seven days</span><div class="pr-week">' + S.week.map(d => '<div title="' + esc(nice(d.date) + ': ' + d.minutes + ' min, ' + d.sessions + (d.sessions === 1 ? ' session' : ' sessions')) + '"><i class="' + (d.minutes >= S.goal ? 'met' : '') + '" style="height:' + Math.max(d.minutes ? 6 : 2, Math.round(70 * d.minutes / Math.max(1, mx))) + 'px"></i><span>' + dayLabel(d.date) + '</span></div>').join('') + '</div>' +
    '<span class="muted">' + S.totals.sessions + (S.totals.sessions === 1 ? ' session' : ' sessions') + ', ' + S.totals.minutes + ' minutes, on ' + S.totals.days + (S.totals.days === 1 ? ' day' : ' days') + ' in all</span></div>';
}

let lastRoutines = null;
function drawRoutines(root, R) {
  lastRoutines = R;
  const card = (r, own) => '<article class="card pr-rt"><div class="pr-h"><h3>' + esc(r.name) + '</h3><span class="muted">' + minutes(r) + ' min' + (own ? '' : ' · starter') + '</span></div>' +
    '<ol>' + r.items.map(it => '<li><span class="pr-kind">' + esc((KIND[it.kind] || KIND.free).label) + '</span> ' + esc(it.title) + ' <span class="muted">' + it.minutes + ' min</span></li>').join('') + '</ol>' +
    '<div class="pr-row"><button type="button" class="btn small primary" data-start="' + esc(r.id) + '">Start</button>' +
    (own ? '<button type="button" class="btn small ghost" data-edit="' + r.id + '">Edit</button><button type="button" class="btn small ghost" data-del="' + r.id + '">Delete</button>' : '<button type="button" class="btn small ghost" data-copy="' + esc(r.id) + '">Copy and edit</button>') + '</div></article>';
  $('#pr-routines', root).innerHTML = R.routines.map(r => card(r, true)).join('') + R.starters.map(r => card(r, false)).join('');
  const find = id => R.routines.concat(R.starters).find(r => String(r.id) === String(id));
  root.querySelectorAll('[data-start]').forEach(b => { b.onclick = () => {
    const cur = getRun();
    if (cur && !confirm(cur.finished ? 'A finished session is not saved yet. Start a new one and discard it?' : 'A session is in progress. Discard it and start this one?')) return;
    startRun(find(b.dataset.start));
  }; });
  root.querySelectorAll('[data-edit]').forEach(b => { b.onclick = () => editor(root, find(b.dataset.edit)); });
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
    '<button type="button" class="iconbtn" data-rm aria-label="Remove"' + (items.length > 1 ? '' : ' disabled') + '>✕</button></div>';
  const read = () => { el.querySelectorAll('.pr-item').forEach(x => { const it = items[+x.dataset.k]; it.kind = x.querySelector('[data-f="kind"]').value; it.title = x.querySelector('[data-f="title"]').value; it.minutes = Math.round(+x.querySelector('[data-f="minutes"]').value) || 1; }); };
  const draw = () => {
    el.innerHTML = '<div class="card pr-editor"><h3>' + (r && r.id ? 'Edit routine' : 'New routine') + '</h3><div class="field"><label class="lab" for="pr-name">Name</label><input type="text" id="pr-name" maxlength="60" value="' + esc(r ? r.name : '') + '" placeholder="Morning riyaz"></div>' +
      '<div class="field"><span class="lab">Items</span>' + items.map(row).join('') + '</div><p class="muted" id="pr-total"></p><p class="pr-err" id="pr-err" role="alert"></p>' +
      '<div class="pr-row"><button type="button" class="btn small" id="pr-add"' + (items.length >= 30 ? ' disabled' : '') + '>Add an item</button><span style="flex:1"></span><button type="button" class="btn small ghost" id="pr-cancel">Cancel</button><button type="button" class="btn small primary" id="pr-save">Save routine</button></div></div>';
    $('#pr-total', el).textContent = 'Total: ' + items.reduce((s, it) => s + (+it.minutes || 0), 0) + ' minutes';
    el.querySelectorAll('[data-mv]').forEach(b => { b.onclick = () => { read(); const k = +b.closest('.pr-item').dataset.k, j = k + +b.dataset.mv; [items[k], items[j]] = [items[j], items[k]]; draw(); }; });
    el.querySelectorAll('[data-rm]').forEach(b => { b.onclick = () => { read(); items.splice(+b.closest('.pr-item').dataset.k, 1); draw(); }; });
    el.querySelectorAll('[data-f="minutes"]').forEach(x => { x.oninput = () => { read(); $('#pr-total', el).textContent = 'Total: ' + items.reduce((s, it) => s + it.minutes, 0) + ' minutes'; }; });
    $('#pr-add', el).onclick = () => { read(); items.push({ kind: 'free', title: '', minutes: 5 }); draw(); };
    $('#pr-cancel', el).onclick = () => { el.innerHTML = ''; };
    $('#pr-save', el).onclick = async () => {
      read();
      const body = { name: $('#pr-name', el).value, items: items.map(it => ({ kind: it.kind, title: it.title.trim() || KIND[it.kind].label, minutes: it.minutes })) };
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
    (l.rating ? '<span class="pr-stars" aria-label="' + l.rating + ' of 5">' + '★'.repeat(l.rating) + '<i>' + '★'.repeat(5 - l.rating) + '</i></span>' : '') + '<button type="button" class="iconbtn" data-dl="' + l.id + '" aria-label="Delete this session">✕</button></div>' +
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
  root.innerHTML = '<div class="wrap">' + pageHead({ eyebrow: 'Session finished', title: esc(r.routineName), lead: 'You practised for ' + clock(total) + '. Check what you did, add a note for next time, and save it to your log.' }) +
    '<div class="card pr-finish"><table class="pr-table"><thead><tr><th>Item</th><th>Planned</th><th>Spent</th><th>Done</th></tr></thead><tbody>' +
    r.items.map((it, k) => '<tr><td><span class="pr-kind">' + esc((KIND[it.kind] || KIND.free).label) + '</span> ' + esc(it.title) + '</td><td>' + it.minutes + ':00</td><td>' + clock(elapsed(r, k)) + '</td><td><input type="checkbox" data-done="' + k + '"' + (r.done[k] ? ' checked' : '') + ' aria-label="Done"></td></tr>').join('') +
    '</tbody></table><div class="field"><span class="lab">How did it go?</span><div class="seg pr-rate" role="group" aria-label="Rating">' + [1, 2, 3, 4, 5].map(n => '<button type="button" data-r="' + n + '" aria-pressed="false">' + '★'.repeat(n) + '</button>').join('') + '</div></div>' +
    '<div class="field"><label class="lab" for="pr-notes">Notes for next time</label><textarea id="pr-notes" rows="3" maxlength="1000" placeholder="What went well, what to work on"></textarea></div>' +
    '<p class="pr-err" id="pr-err" role="alert"></p><div class="pr-row"><button type="button" class="btn ghost" id="pr-drop">Discard</button><span style="flex:1"></span><button type="button" class="btn primary" id="pr-keep">Save to my log</button></div></div></div>';
  root.querySelectorAll('[data-r]').forEach(b => { b.onclick = () => { rating = +b.dataset.r; root.querySelectorAll('[data-r]').forEach(x => x.setAttribute('aria-pressed', String(+x.dataset.r === rating))); }; });
  root.querySelectorAll('[data-done]').forEach(c => { c.onchange = () => { const x = getRun(); if (x) { x.done[+c.dataset.done] = c.checked; localStorage.setItem('vg-run', JSON.stringify(x)); } }; });
  $('#pr-drop', root).onclick = () => { if (confirm('Discard this session? It will not be logged.')) { discard(); location.hash = '#/practice'; } };
  $('#pr-keep', root).onclick = async () => {
    const b = $('#pr-keep', root); b.disabled = true;
    try {
      const res = await saveFinished(rating, $('#pr-notes', root).value);
      toast(res.queued ? 'You are offline: the session is kept and will be saved when the connection returns.' : 'Saved to your log.');
      location.hash = '#/practice';
    } catch (e) { b.disabled = false; $('#pr-err', root).textContent = e.message; }
  };
}
