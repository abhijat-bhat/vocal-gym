/* Melakartas (v0.8.7): the shared explorer (web/shared/mela-explorer.js) on the engine itself, served at
   /engine/, so every choice answers at once. The scale plays through the app's sound settings (sung with
   the raga's gamaka when the voice is on). #/melakarta/29 opens mela 29. */
import '/shared/mela-explorer.js';      // globalThis.VGMelaExplorer
import * as M from '/engine/melakarta.js';
import { toggle, pitchedJob, stop } from '../audio.js';
import { pageHead, term } from '../ui.js';

export async function mount(root, meta, parts) {
  root.innerHTML = '<div class="wrap">' + pageHead({
    eyebrow: 'For singers, students and teachers',
    title: 'Melakartas and katapayadi',
    lead: 'The 72 ' + term('melakarta') + ' ragas are a system: the number of each one gives its swaras, and by the ' + term('katapayadi') + ' rule the first two syllables of its name give the number. Pick any of the 72 to see both worked out, decode any name, or build a scale and find which mela it is.'
  }) + '<div id="mx-app"></div></div>';
  const ex = globalThis.VGMelaExplorer.mount(root.querySelector('#mx-app'), {
    M, store: 'vg-mela',
    audio: {
      // the arohana and avarohana, one swara a beat, with a click on each beat
      play: (btn, notes, info) => toggle(btn, pitchedJob(null, notes.map(p => ({ p, slots: 1 })), 1, notes.length, new Set([0]), { raga: info.id, seed: 1 })),
      stop
    }
  });
  const n = parts && +parts[0];
  if (n >= 1 && n <= 72) ex.select(n);
  return () => { stop(); ex.unmount(); };
}
