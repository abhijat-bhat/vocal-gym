/* App shell: hash routing, navigation, theme, and page mounting. v0.8.7: the account button, the practice
   session bar (session.js) and the service worker that makes the app installable (sw.js). */
import { api } from './api.js';
import { stop } from './audio.js';
import { initGlossary, errorCard, $ } from './ui.js';
import * as home from './pages/home.js';
import * as alankara from './pages/alankara.js';
import * as kalpana from './pages/kalpana.js';
import * as korvai from './pages/korvai.js';
import * as melakarta from './pages/melakarta.js';
import * as practice from './pages/practice.js';
import * as account from './pages/account.js';
import { initSession, refreshUser, onUser } from './session.js';
import { initFx, enter } from './fx.js';
import * as judge from './pages/judge.js';
import * as learn from './pages/learn.js';

const PAGES = { '': home, alankara, kalpana, korvai, melakarta, judge, learn, practice, account };
// v0.8: the jathi studio became the korvai lab
const MOVED = { jathi: 'korvai' };
const TITLES = { '': 'Vocal Gym', alankara: 'Alankaras · Vocal Gym', kalpana: 'Kalpana swaras · Vocal Gym', korvai: 'Korvai & tihai lab · Vocal Gym', melakarta: 'Melakartas · Vocal Gym', practice: 'Practice · Vocal Gym', account: 'Account · Vocal Gym', judge: 'Jathi judge · Vocal Gym', learn: 'Learn · Vocal Gym' };
const main = $('#main');
let unmount = null, meta = null;

async function route() {
  const parts = (location.hash.replace(/^#\/?/, '') || '').split('/');
  if (MOVED[parts[0]]) { location.replace('#/' + MOVED[parts[0]]); return; }
  const name = PAGES[parts[0]] ? parts[0] : '';
  stop();
  if (unmount) { try { unmount(); } catch (e) { /* ignore */ } unmount = null; }
  document.querySelectorAll('#nav a, #acctbtn').forEach(a => { if (a.dataset.route === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  // the Tools button is current when one of its tools is, and its menu closes on every move
  $('#navdrop').classList.toggle('current', !!document.querySelector('#toolsmenu a[aria-current]'));
  closeMenu();
  $('#nav').classList.remove('open'); $('#navtoggle').setAttribute('aria-expanded', 'false');
  document.title = TITLES[name];
  try {
    if (!meta) meta = await api.meta();
    $('#ver').textContent = 'v' + meta.version;
    main.innerHTML = '';
    unmount = await PAGES[name].mount(main, meta, parts.slice(1)) || null;
    enter(main);
    settingsJump(main);
  } catch (e) {
    main.innerHTML = '<div class="wrap" style="padding-top:60px">' + errorCard(e.message) + '</div>';
  }
  if (!parts[1] || name !== 'learn') window.scrollTo(0, 0);
}

$('#navtoggle').addEventListener('click', () => { const n = $('#nav'); n.classList.toggle('open'); $('#navtoggle').setAttribute('aria-expanded', String(n.classList.contains('open'))); });
$('#themebtn').addEventListener('click', () => {
  const dark = getComputedStyle(document.documentElement).colorScheme.includes('dark');
  const next = dark ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('vg-theme', next); } catch (e) { /* not persisted */ }
});
/* v0.8.8: the Tools menu (click, or hover with a mouse; Escape and a click outside close it) */
function closeMenu() { const g = $('#navgroup'); if (g) { g.classList.remove('open'); $('#navdrop').setAttribute('aria-expanded', 'false'); } }
$('#navdrop').addEventListener('click', e => { e.stopPropagation(); const g = $('#navgroup'), open = !g.classList.contains('open'); g.classList.toggle('open', open); $('#navdrop').setAttribute('aria-expanded', String(open)); if (open) { const a = $('#toolsmenu a'); if (a && e.detail === 0) a.focus(); } });
document.addEventListener('click', e => {
  if (!e.target.closest('#navgroup')) closeMenu();
  // a page's help popover closes when the click lands elsewhere
  document.querySelectorAll('details.phelp[open]').forEach(d => { if (!d.contains(e.target)) d.open = false; });
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if ($('#navgroup').classList.contains('open')) { closeMenu(); $('#navdrop').focus(); } document.querySelectorAll('details.phelp[open]').forEach(d => { d.open = false; }); } });
/* on a narrow screen a tool shows its result first; this button jumps to the settings below it */
function settingsJump(main) {
  const panel = main.querySelector('.tool:not(.judge-layout) > .panel'), res = panel && panel.parentElement.querySelector(':scope > :not(.panel)');
  if (!res || res.querySelector('.to-settings')) return;
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'btn small to-settings'; b.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="5" cy="4" r="1.8" fill="currentColor"/><circle cx="11" cy="8" r="1.8" fill="currentColor"/><circle cx="7" cy="12" r="1.8" fill="currentColor"/></svg>Settings';
  b.onclick = () => panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  res.prepend(b);
}
initGlossary();
initFx();
// v0.8.7: who is logged in (the header's account button), the session in progress, and offline use
initSession();
onUser(u => { const b = $('#acctbtn'); if (b) { b.textContent = u ? u.displayName : 'Log in'; b.title = u ? 'Your account (' + u.username + ')' : 'Log in or create an account'; } });
refreshUser();
if ('serviceWorker' in navigator && window.isSecureContext) window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => { /* the app works without it */ }); });
window.addEventListener('hashchange', route);
route();
