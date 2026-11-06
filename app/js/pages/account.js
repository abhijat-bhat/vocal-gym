/* Account. v0.10: sign in with Google, or with an email address and a confirmation code (server/signin.js);
   a username and password still work for the accounts that have one. Once in: the name and daily goal, the ways into the
   account, the password, logging out, and deleting the account with everything stored with it. */
import { api } from '../api.js';
import { esc, $, toast, pageHead } from '../ui.js';
import { getUser, setUser, refreshUser, userKnown, onUser } from '../session.js';

const field = (id, label, type, attrs) => '<div class="field"><label class="lab" for="' + id + '">' + label + '</label><input id="' + id + '" type="' + type + '" ' + (attrs || '') + '></div>';
const err = id => '<p class="pr-err" id="' + id + '" role="alert"></p>';
const GOOGLE_MARK = '<svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true"><path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.700-1.600 2.700-3.900 2.700-6.500z"/><path fill="#34A853" d="M9 18c2.400 0 4.500-.8 6-2.200l-2.900-2.200c-.8.5-1.800.9-3.100.9-2.400 0-4.400-1.600-5.100-3.800H.9v2.300A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.900 10.700a5.400 5.400 0 0 1 0-3.400V5H.9a9 9 0 0 0 0 8z"/><path fill="#EA4335" d="M9 3.600c1.300 0 2.500.5 3.400 1.300l2.600-2.600A9 9 0 0 0 .9 5l3 2.300C4.600 5.100 6.600 3.600 9 3.600z"/></svg>';
const GOOGLE_SAYS = {
  cancelled: 'You cancelled the Google sign-in. Nothing was changed.',
  expired: 'That Google sign-in took too long. Try again.',
  refused: 'Google could not confirm this sign-in. Try again, or use a code.',
  unreachable: 'Google could not be reached. Check your connection and try again.',
  unavailable: 'Sign-in is not available on this server right now.',
  'other-account': 'That Google account already belongs to another Vocal Gym account.'
};

/* the code form: the address, then six digits. onDone(answer) gets the server's reply. */
function codeForm(el, methods, onDone, opts) {
  const o = opts || {}, kind = 'email';
  if (!methods.email) { el.innerHTML = ''; return; }
  let value = '', timer = 0;
  const askStep = msg => {
    clearInterval(timer);
    el.innerHTML = '<form id="ac-ask" novalidate>' + field('ac-to', o.adding ? 'Email to add' : 'Your email', 'email', 'autocomplete="email" autocapitalize="none" spellcheck="false" inputmode="email" placeholder="you@example.com" value="' + esc(value) + '"') +
      err('ac-aske') + '<div class="pr-row"><button class="btn primary" type="submit" id="ac-send">Send me a code</button></div></form>';
    if (msg) $('#ac-aske', el).textContent = msg;
    $('#ac-ask', el).onsubmit = async e => {
      e.preventDefault();
      const b = $('#ac-send', el), out = $('#ac-aske', el); b.disabled = true; out.textContent = '';
      try { const r = await api.signin.ask(kind, $('#ac-to', el).value); value = r.value; checkStep(r); }
      catch (x) { out.textContent = x.message; b.disabled = false; }
    };
  };
  const checkStep = r => {
    el.innerHTML = '<form id="ac-check" novalidate><p class="ac-sent" role="status">We sent a 6-digit code to <b>' + esc(r.to) + '</b>. It lasts 10 minutes.</p>' +
      (r.onConsole ? '<p class="hint">This server has no mail service set up, so the code is printed on the server’s console.</p>' : '') +
      '<div class="field"><label class="lab" for="ac-code">The code</label><input id="ac-code" class="ac-code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="7" pattern="[0-9 ]*"></div>' +
      (r.devCode ? '<input type="hidden" id="ac-devcode" value="' + esc(r.devCode) + '">' : '') +
      err('ac-checke') + '<div class="pr-row"><button class="btn primary" type="submit" id="ac-confirm">Confirm</button><button class="btn" type="button" id="ac-again" disabled></button><button class="btn ghost" type="button" id="ac-change">Change email</button></div></form>';
    const again = $('#ac-again', el);
    let left = r.retryAfter;
    const count = () => { if (left > 0) { again.textContent = 'Send again in ' + left + ' s'; again.disabled = true; left--; } else { again.textContent = 'Send again'; again.disabled = false; clearInterval(timer); } };
    count(); timer = setInterval(() => { if (!document.body.contains(again)) clearInterval(timer); else count(); }, 1000);
    again.onclick = async () => { again.disabled = true; try { const a = await api.signin.ask(kind, value); checkStep(a); toast('A new code is on its way.'); } catch (x) { $('#ac-checke', el).textContent = x.message; again.disabled = false; } };
    $('#ac-change', el).onclick = () => askStep();
    $('#ac-check', el).onsubmit = async e => {
      e.preventDefault();
      const b = $('#ac-confirm', el), out = $('#ac-checke', el); b.disabled = true; out.textContent = '';
      try { clearInterval(timer); onDone(await api.signin.check({ kind, value, code: $('#ac-code', el).value })); }
      catch (x) { out.textContent = x.message; b.disabled = false; }
    };
    $('#ac-code', el).focus();
  };
  askStep();
}

export async function mount(root, meta, parts) {
  let alive = true;
  if (!userKnown()) await refreshUser();
  let notice = parts[0] === 'google-failed' ? GOOGLE_SAYS[parts[1]] || GOOGLE_SAYS.refused : parts[0] === 'google-off' ? 'Google sign-in is not set up on this server.' : '';
  const added = parts[0] === 'google-added';
  const draw = () => { if (alive) (getUser() ? signedIn : signedOut)(root, notice, added); notice = ''; };
  const off = onUser(draw);
  draw();
  return () => { alive = false; off(); };
}

async function signedOut(root, notice) {
  root.innerHTML = '<div class="wrap">' + pageHead({ title: 'Sign in', lead: 'An account keeps your routines, your session log, your daily goal and your streak.' }) +
    (notice ? '<div class="notice ac-notice" role="alert">' + esc(notice) + '</div>' : '') +
    '<div class="acct-floor"><div class="acct-door"><section class="slab-card ac-signin"><p class="muted">The first time you confirm an address, your account is made. There is no password to remember.</p>' +
      '<div id="ac-google"></div><div id="ac-code-form"></div></section>' +
    '<details class="ac-old" id="ac-old"><summary>Use a username and password</summary><div class="split acct">' +
      '<form class="card" id="ac-login" novalidate><h3>Log in</h3>' + field('ac-lu', 'Username', 'text', 'autocomplete="username" autocapitalize="none" spellcheck="false" required') + field('ac-lp', 'Password', 'password', 'autocomplete="current-password" required') + err('ac-le') + '<div class="pr-row"><button class="btn primary" type="submit">Log in</button></div></form>' +
      '<form class="card" id="ac-new" novalidate><h3>Create an account</h3>' + field('ac-nu', 'Username', 'text', 'autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="32" required') + '<p class="hint">3 to 32 letters, digits, dots, dashes or underscores.</p>' +
      field('ac-nn', 'Your name (shown in the app)', 'text', 'autocomplete="name" maxlength="60"') + field('ac-np', 'Password', 'password', 'autocomplete="new-password" minlength="8" required') + '<p class="hint">At least 8 characters. A short sentence is easy to remember and hard to guess.</p>' +
      field('ac-np2', 'Password again', 'password', 'autocomplete="new-password" required') + err('ac-ne') + '<div class="pr-row"><button class="btn" type="submit">Create account</button></div></form></div></details></div></div></div>';
  const done = (u, msg) => { setUser(u); toast(msg); location.hash = '#/practice'; };
  $('#ac-login', root).onsubmit = async e => {
    e.preventDefault(); const b = e.target.querySelector('button'); b.disabled = true; $('#ac-le', root).textContent = '';
    try { done((await api.auth.login({ username: $('#ac-lu', root).value.trim(), password: $('#ac-lp', root).value })).user, 'Welcome back.'); }
    catch (x) { $('#ac-le', root).textContent = x.message; b.disabled = false; }
  };
  $('#ac-new', root).onsubmit = async e => {
    e.preventDefault(); const b = e.target.querySelector('button'), out = $('#ac-ne', root); out.textContent = '';
    if ($('#ac-np', root).value !== $('#ac-np2', root).value) { out.textContent = 'The two passwords differ.'; return; }
    b.disabled = true;
    try { done((await api.auth.register({ username: $('#ac-nu', root).value.trim(), displayName: $('#ac-nn', root).value.trim(), password: $('#ac-np', root).value })).user, 'Account created. Pick a routine to start.'); }
    catch (x) { out.textContent = x.message; b.disabled = false; }
  };
  let methods;
  try { methods = await api.signin.methods(); }
  catch (e) { const g = $('#ac-code-form', root); if (g) g.innerHTML = '<p class="muted">Sign-in could not be reached: ' + esc(e.message) + '</p>'; return; }
  const g = $('#ac-google', root), f = $('#ac-code-form', root);
  if (!g || !f) return;
  if (methods.google) g.innerHTML = '<a class="btn big ac-google" href="/api/auth/google/start">' + GOOGLE_MARK + 'Continue with Google</a>' + (methods.email ? '<p class="ac-or"><span>or use a code</span></p>' : '');
  if (!methods.google && !methods.email) { $('#ac-old', root).open = true; f.innerHTML = '<p class="muted">Only a username and password are set up on this server.</p>'; return; }
  codeForm(f, methods, r => done(r.user, r.created ? 'Your account is ready. Pick a routine to start.' : 'Welcome back.'));
}

const KINDS = { email: 'Email', google: 'Google' };
async function drawWays(root) {
  const box = $('#ac-ways', root); if (!box) return;
  let r, methods;
  try { [r, methods] = await Promise.all([api.signin.identities(), api.signin.methods()]); }
  catch (x) { box.innerHTML = '<p class="muted">' + esc(x.message) + '</p>'; return; }
  const count = r.identities.length + (r.hasPassword ? 1 : 0);
  box.innerHTML = '<ul class="ac-ways">' + r.identities.map((w, i) => '<li><span class="k">' + esc(KINDS[w.kind] || w.kind) + '</span><span>' + esc(w.value) + '</span>' + (count > 1 ? '<button type="button" class="btn small ghost" data-rm="' + i + '">Remove</button>' : '') + '</li>').join('') +
    (r.hasPassword ? '<li><span class="k">Password</span><span>Username and password</span></li>' : '') + (count ? '' : '<li class="muted">None yet.</li>') + '</ul>' +
    (methods.google && !r.identities.some(w => w.kind === 'google') ? '<a class="btn small ac-google" href="/api/auth/google/start">' + GOOGLE_MARK + 'Add Google</a>' : '') +
    (methods.email ? '<details class="ac-add"><summary>Add another email</summary><div id="ac-add-form"></div></details>' : '');
  box.querySelectorAll('[data-rm]').forEach(b => { b.onclick = async () => { const w = r.identities[+b.dataset.rm]; try { await api.signin.remove(w.kind, w.id); toast('Removed.'); drawWays(root); } catch (x) { toast(x.message); } }; });
  const add = $('#ac-add-form', box);
  if (add) codeForm(add, methods, () => { toast('Added. You can sign in with it now.'); drawWays(root); }, { adding: true });
}

function signedIn(root, notice, added) {
  const u = getUser(), noPass = u.hasPassword === false;
  root.innerHTML = '<div class="wrap">' + pageHead({ title: esc(u.displayName), lead: 'Signed in as ' + esc(u.username) + ', since ' + esc(new Date(u.createdAt).toLocaleDateString()) + '.' }) +
    (notice ? '<div class="notice ac-notice" role="alert">' + esc(notice) + '</div>' : '') +
    '<div class="split acct">' +
    '<form class="card" id="ac-prof" novalidate><h3>Profile and goal</h3>' + field('ac-dn', 'Your name', 'text', 'maxlength="60" value="' + esc(u.displayName) + '"') +
    field('ac-goal', 'Daily goal, in minutes', 'number', 'min="5" max="600" step="5" value="' + u.dailyGoalMin + '"') + '<p class="hint">A day counts toward your streak when you log any practice; the goal is what you aim for.</p>' + err('ac-pe') + '<div class="pr-row"><button class="btn primary" type="submit">Save</button></div></form>' +
    '<section class="card"><h3>Ways in</h3><p class="hint">Any of these signs you in to this account.</p><div id="ac-ways"><p class="muted">Loading…</p></div></section></div>' +
    '<div class="split acct" style="margin-top:var(--s4)">' +
    '<form class="card" id="ac-pw" novalidate><h3>Password</h3>' + (noPass ? '<p class="hint">You sign in without one. Setting one is optional.</p>' : field('ac-pc', 'Current password', 'password', 'autocomplete="current-password"')) + field('ac-p1', 'New password', 'password', 'autocomplete="new-password" minlength="8"') + field('ac-p2', 'New password again', 'password', 'autocomplete="new-password"') +
    '<p class="hint">Other devices are logged out; this one stays in.</p>' + err('ac-we') + '<div class="pr-row"><button class="btn" type="submit">' + (noPass ? 'Set password' : 'Change password') + '</button></div></form>' +
    '<div class="card"><h3>Log out</h3><p class="muted">Your routines and log stay in your account for next time.</p><div class="pr-row"><button type="button" class="btn" id="ac-out">Log out</button></div></div></div>' +
    '<form class="card acct-danger" id="ac-del" novalidate><h3>Delete the account</h3><p class="muted">This deletes your account, your routines, every logged session and your corrections to the repertoire. It cannot be undone.</p>' +
    (noPass ? field('ac-dp', 'Type your username, ' + esc(u.username) + ', to confirm', 'text', 'autocomplete="off" autocapitalize="none" spellcheck="false"') : field('ac-dp', 'Password', 'password', 'autocomplete="current-password"')) +
    '<label class="acct-check"><input type="checkbox" id="ac-dc"> I understand that everything is deleted.</label>' + err('ac-de') + '<div class="pr-row"><button class="btn" type="submit" id="ac-delb">Delete my account</button></div></form></div>';
  drawWays(root);
  if (added) toast('Google added. You can sign in with it now.');
  $('#ac-prof', root).onsubmit = async e => {
    e.preventDefault(); $('#ac-pe', root).textContent = '';
    try { setUser((await api.account.update({ displayName: $('#ac-dn', root).value, dailyGoalMin: Math.round(+$('#ac-goal', root).value) })).user); toast('Saved.'); }
    catch (x) { $('#ac-pe', root).textContent = x.message; }
  };
  $('#ac-pw', root).onsubmit = async e => {
    e.preventDefault(); const out = $('#ac-we', root); out.textContent = '';
    if ($('#ac-p1', root).value !== $('#ac-p2', root).value) { out.textContent = 'The two new passwords differ.'; return; }
    try {
      await api.account.password({ current: noPass ? undefined : $('#ac-pc', root).value, password: $('#ac-p1', root).value });
      toast(noPass ? 'Password set.' : 'Password changed.');
      setUser(Object.assign({}, u, { hasPassword: true }));
    } catch (x) { out.textContent = x.message; }
  };
  $('#ac-out', root).onclick = async () => { try { await api.auth.logout(); } catch (x) { /* logged out here anyway */ } setUser(null); toast('Logged out.'); location.hash = '#/'; };
  $('#ac-del', root).onsubmit = async e => {
    e.preventDefault(); const out = $('#ac-de', root); out.textContent = '';
    if (!$('#ac-dc', root).checked) { out.textContent = 'Tick the box to confirm.'; return; }
    try { await api.account.remove(noPass ? { confirm: $('#ac-dp', root).value.trim() } : { password: $('#ac-dp', root).value }); setUser(null); toast('Your account and its data are deleted.'); location.hash = '#/'; }
    catch (x) { out.textContent = x.message; }
  };
}
