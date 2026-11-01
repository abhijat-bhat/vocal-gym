/* App shell: hash routing, navigation, theme, and page mounting. */
import { api } from './api.js';
import { stop } from './audio.js';
import { initGlossary, errorCard, $ } from './ui.js';
import * as home from './pages/home.js';
import * as alankara from './pages/alankara.js';
import * as kalpana from './pages/kalpana.js';
import * as korvai from './pages/korvai.js';
import * as judge from './pages/judge.js';
import * as learn from './pages/learn.js';

const PAGES = { '': home, alankara, kalpana, korvai, judge, learn };
// v0.8: the jathi studio became the korvai lab
const MOVED = { jathi: 'korvai' };
const TITLES = { '': 'Vocal Gym', alankara: 'Alankaras · Vocal Gym', kalpana: 'Kalpana swaras · Vocal Gym', korvai: 'Korvai & tihai lab · Vocal Gym', judge: 'Jathi judge · Vocal Gym', learn: 'Learn · Vocal Gym' };
const main = $('#main');
let unmount = null, meta = null;

async function route() {
  const parts = (location.hash.replace(/^#\/?/, '') || '').split('/');
  if (MOVED[parts[0]]) { location.replace('#/' + MOVED[parts[0]]); return; }
  const name = PAGES[parts[0]] ? parts[0] : '';
  stop();
  if (unmount) { try { unmount(); } catch (e) { /* ignore */ } unmount = null; }
  document.querySelectorAll('#nav a').forEach(a => { if (a.dataset.route === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  $('#nav').classList.remove('open'); $('#navtoggle').setAttribute('aria-expanded', 'false');
  document.title = TITLES[name];
  try {
    if (!meta) meta = await api.meta();
    $('#ver').textContent = 'v' + meta.version;
    main.innerHTML = '';
    unmount = await PAGES[name].mount(main, meta, parts.slice(1)) || null;
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
initGlossary();
window.addEventListener('hashchange', route);
route();
