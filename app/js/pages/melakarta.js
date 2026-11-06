/* Melakartas (v0.8.7): the shared explorer (web/shared/mela-explorer.js) on the engine itself, served at
   /engine/, so every choice answers at once. The scale plays through the app's sound settings (sung with
   the raga's gamaka when the voice is on). #/melakarta/29 opens mela 29. v0.10: the 72 can be chosen on a carved wheel
   (app/js/mela-wheel.js) as well as in the table, and the two stay in step. */
import '/shared/mela-explorer.js';      // globalThis.VGMelaExplorer
import * as M from '/engine/melakarta.js';
import { toggle, pitchedJob, stop } from '../audio.js';
import { pageHead, term, esc } from '../ui.js';

export async function mount(root, meta, parts) {
  root.innerHTML = '<div class="wrap">' + pageHead({
    title: 'Melakartas and katapayadi',
    lead: 'The 72 ' + term('melakarta') + ' ragas are a system: the number of each one gives its swaras, and by the ' + term('katapayadi') + ' rule the first two syllables of its name give the number. Pick any of the 72 to see both worked out, decode any name, or build a scale and find which mela it is.'
  }) + '<div id="mx-app"></div></div>';
  let wheel = null;
  // what the wheel's index points at, beside it, since the description is now below it
  const now = document.createElement('p');
  now.className = 'mw-now'; now.setAttribute('aria-hidden', 'true');
  const name = n => { const I = M.melakartaInfo(n); now.innerHTML = '<b>' + n + '</b><span>' + esc(I.name) + '</span><small>' + I.labels.map(l => esc(l).replace(/([RGMDN])([123])/g, '$1<sub>$2</sub>')).join(' ') + '</small>'; };
  const ex = globalThis.VGMelaExplorer.mount(root.querySelector('#mx-app'), {
    M, store: 'vg-mela', onSelect: n => { name(n); if (wheel) wheel.set(n); },
    audio: {
      // the arohana and avarohana, one swara a beat, with a click on each beat
      play: (btn, notes, info) => toggle(btn, pitchedJob(null, notes.map(p => ({ p, slots: 1 })), 1, notes.length, new Set([0]), { raga: info.id, seed: 1 })),
      stop
    }
  });
  const n = parts && +parts[0];
  if (n >= 1 && n <= 72) ex.select(n);
  // the wheel, if this device can draw it; the table stays either way
  const grid = root.querySelector('.mx-grid');
  const current = () => { const m = /^(\d+) ·/.exec(root.querySelector('.mx-detail h3').textContent); return m ? +m[1] : 29; };
  const bar = document.createElement('div'), stage = document.createElement('div'), note = document.createElement('p');
  bar.className = 'seg cols-2 mw-bar'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'How to choose a melakarta');
  bar.innerHTML = '<button type="button" data-v="wheel" aria-pressed="true">Wheel</button><button type="button" data-v="table" aria-pressed="false">Table</button>';
  stage.className = 'mw';
  note.className = 'mw-note';
  note.textContent = 'Turn the wheel, or click a raga or the hub to hear it. The plain tiles are shuddha madhyama and the oxide ones prati madhyama: straight across from any raga is the same scale with the other madhyama.';
  const show = v => {
    grid.classList.toggle('wheel', v === 'wheel');
    bar.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
    try { localStorage.setItem('vg-mela-view', v); } catch (e) { /* not stored */ }
  };
  bar.onclick = e => { const b = e.target.closest('button'); if (b) show(b.dataset.v); };
  const giveUp = () => { wheel = null; bar.remove(); stage.remove(); note.remove(); now.remove(); grid.classList.remove('wheel'); };
  let alive = true;
  import('../mela-wheel.js').then(m => {
    if (!alive) return;
    name(current());
    grid.prepend(bar, stage, now, note);
    let view = 'wheel';
    try { view = localStorage.getItem('vg-mela-view') || 'wheel'; } catch (e) { /* the wheel */ }
    show(view === 'table' ? 'table' : 'wheel');
    wheel = m.mountWheel({
      host: stage, M, value: current(), onFail: giveUp,
      onTurn: v => ex.select(v),
      // a raga chosen by a click is sung; turning the wheel is silent
      onPick: v => { if (current() !== v) ex.select(v); const pb = root.querySelector('.mx-play'); if (pb) pb.click(); }
    });
    if (!wheel) giveUp();
  }).catch(giveUp);
  return () => { alive = false; stop(); if (wheel) wheel.dispose(); ex.unmount(); };
}
