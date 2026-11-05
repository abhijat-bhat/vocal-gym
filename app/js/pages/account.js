/* Account (v0.8.7): log in or create an account; once in, change the name and the daily goal, change the
   password (other devices are logged out), log out, or delete the account and everything stored with it. */
import { api } from '../api.js';
import { esc, $, toast, pageHead } from '../ui.js';
import { getUser, setUser, refreshUser, userKnown, onUser } from '../session.js';

const field = (id, label, type, attrs) => '<div class="field"><label class="lab" for="' + id + '">' + label + '</label><input id="' + id + '" type="' + type + '" ' + (attrs || '') + '></div>';
const err = id => '<p class="pr-err" id="' + id + '" role="alert"></p>';

export async function mount(root) {
  let alive = true;
  if (!userKnown()) await refreshUser();
  const draw = () => { if (alive) (getUser() ? signedIn : signedOut)(root); };
  const off = onUser(draw);
  draw();
  return () => { alive = false; off(); };
}

function signedOut(root) {
  root.innerHTML = '<div class="wrap">' + pageHead({ eyebrow: 'Your account', title: 'Log in', lead: 'An account keeps your practice routines, your session log, your daily goal and your streak. They are stored in this computer’s Vocal Gym database, and nowhere else.' }) +
    '<div class="split acct">' +
    '<form class="card" id="ac-login" novalidate><h3>Log in</h3>' + field('ac-lu', 'Username', 'text', 'autocomplete="username" autocapitalize="none" spellcheck="false" required') + field('ac-lp', 'Password', 'password', 'autocomplete="current-password" required') + err('ac-le') + '<div class="pr-row"><button class="btn primary" type="submit">Log in</button></div></form>' +
    '<form class="card" id="ac-new" novalidate><h3>Create an account</h3>' + field('ac-nu', 'Username', 'text', 'autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="32" required') + '<p class="hint">3 to 32 letters, digits, dots, dashes or underscores.</p>' +
    field('ac-nn', 'Your name (shown in the app)', 'text', 'autocomplete="name" maxlength="60"') + field('ac-np', 'Password', 'password', 'autocomplete="new-password" minlength="8" required') + '<p class="hint">At least 8 characters. A short sentence is easy to remember and hard to guess.</p>' +
    field('ac-np2', 'Password again', 'password', 'autocomplete="new-password" required') + err('ac-ne') + '<div class="pr-row"><button class="btn primary" type="submit">Create account</button></div></form></div></div>';
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
}

function signedIn(root) {
  const u = getUser();
  root.innerHTML = '<div class="wrap">' + pageHead({ eyebrow: 'Your account', title: esc(u.displayName), lead: 'Logged in as ' + esc(u.username) + ', since ' + esc(new Date(u.createdAt).toLocaleDateString()) + '. Your routines and practice log are stored in this computer’s Vocal Gym database.' }) +
    '<div class="split acct">' +
    '<form class="card" id="ac-prof" novalidate><h3>Profile and goal</h3>' + field('ac-dn', 'Your name', 'text', 'maxlength="60" value="' + esc(u.displayName) + '"') +
    field('ac-goal', 'Daily goal, in minutes', 'number', 'min="5" max="600" step="5" value="' + u.dailyGoalMin + '"') + '<p class="hint">A day counts toward your streak when you log any practice; the goal is what you aim for.</p>' + err('ac-pe') + '<div class="pr-row"><button class="btn primary" type="submit">Save</button></div></form>' +
    '<form class="card" id="ac-pw" novalidate><h3>Password</h3>' + field('ac-pc', 'Current password', 'password', 'autocomplete="current-password"') + field('ac-p1', 'New password', 'password', 'autocomplete="new-password" minlength="8"') + field('ac-p2', 'New password again', 'password', 'autocomplete="new-password"') +
    '<p class="hint">Other devices are logged out; this one stays in.</p>' + err('ac-we') + '<div class="pr-row"><button class="btn" type="submit">Change password</button></div></form></div>' +
    '<div class="split acct" style="margin-top:18px"><div class="card"><h3>Log out</h3><p class="muted">Your routines and log stay in the database for next time.</p><div class="pr-row"><button type="button" class="btn" id="ac-out">Log out</button></div></div>' +
    '<form class="card acct-danger" id="ac-del" novalidate><h3>Delete the account</h3><p class="muted">This deletes your account, your routines, every logged session and your corrections to the repertoire from this computer. It cannot be undone.</p>' + field('ac-dp', 'Password', 'password', 'autocomplete="current-password"') +
    '<label class="acct-check"><input type="checkbox" id="ac-dc"> I understand that everything is deleted.</label>' + err('ac-de') + '<div class="pr-row"><button class="btn" type="submit" id="ac-delb">Delete my account</button></div></form></div></div>';
  $('#ac-prof', root).onsubmit = async e => {
    e.preventDefault(); $('#ac-pe', root).textContent = '';
    try { setUser((await api.account.update({ displayName: $('#ac-dn', root).value, dailyGoalMin: Math.round(+$('#ac-goal', root).value) })).user); toast('Saved.'); }
    catch (x) { $('#ac-pe', root).textContent = x.message; }
  };
  $('#ac-pw', root).onsubmit = async e => {
    e.preventDefault(); const out = $('#ac-we', root); out.textContent = '';
    if ($('#ac-p1', root).value !== $('#ac-p2', root).value) { out.textContent = 'The two new passwords differ.'; return; }
    try { await api.account.password({ current: $('#ac-pc', root).value, password: $('#ac-p1', root).value }); e.target.reset(); toast('Password changed.'); }
    catch (x) { out.textContent = x.message; }
  };
  $('#ac-out', root).onclick = async () => { try { await api.auth.logout(); } catch (x) { /* logged out here anyway */ } setUser(null); toast('Logged out.'); location.hash = '#/'; };
  $('#ac-del', root).onsubmit = async e => {
    e.preventDefault(); const out = $('#ac-de', root); out.textContent = '';
    if (!$('#ac-dc', root).checked) { out.textContent = 'Tick the box to confirm.'; return; }
    try { await api.account.remove({ password: $('#ac-dp', root).value }); setUser(null); toast('Your account and its data are deleted.'); location.hash = '#/'; }
    catch (x) { out.textContent = x.message; }
  };
}
