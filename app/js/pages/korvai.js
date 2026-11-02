/* Korvai & tihai lab: the shared lab (web/shared/korvai-lab.js) on the engine itself, served at /engine/,
   so every step answers at once. Playback goes through the app's sound settings; Check hands a korvai
   to the jathi judge page. */
import '/shared/korvai-lab.js';      // globalThis.VGKorvaiLab
import * as K from '/engine/korvai/index.js';
import { toggle, rhythmJob, stop, settings, setSetting, saHz, click, solluGaps } from '../audio.js';
import { pageHead, term } from '../ui.js';

/* the lab's structure (web/shared/mridangam.js, arrange): accented phrase starts, the cadence on tham,
   and a phrase tone tuned to Sa that rises with each phrase's length; syllables too if they are chosen */
function structureJob(job) {
  return {
    root: job.root, per: job.per, total: job.total,
    schedule(ac, out, t0) {
      const beat = 60 / settings.bpm, slot = beat / job.per, M = globalThis.VGMridangam, V = globalThis.VGSolkattu, mode = settings.solluVoice;
      const hits = []; job.sylls.forEach((s, i) => { if (s && s !== ',') hits.push({ t: t0 + i * slot, s }); });
      const say = mode !== 'mrd' && V && V.available() ? V.voice(ac, out, 0.9) : null, gaps = solluGaps(hits.map(h => h.t));
      if (say) hits.forEach((h, i) => say(h.t, h.s, gaps[i]));
      M.playArranged(ac, out, t0, slot, job.cells, { sa: saHz(), tones: job.tones !== false, drum: !(say && mode === 'rec'), gain: say ? 0.5 : 1 });
      const beats = Math.ceil(job.sylls.length / job.per);
      for (let k = 0; k < beats; k++) click(ac, out, t0 + k * beat, job.angaStarts.has(k % job.total));
      return { end: t0 + job.sylls.length * slot + 0.4, slot };
    }
  };
}

export async function mount(root) {
  root.innerHTML = '<div class="wrap">' + pageHead({
    eyebrow: 'For singers, drummers and teachers',
    title: 'Korvai & tihai lab',
    lead: 'A ' + term('mora') + ', a tihai and a ' + term('korvai') + ' are arithmetic: they are counted so that they land exactly on sam, or on the song’s ' + term('eduppu') + '. Choose your ' + term('tala') + ' (any of the 35) once, then learn the counting step by step, or build your own and see every way it can be done.'
  }) + '<div id="kl-app"></div></div>';
  const lab = globalThis.VGKorvaiLab.mount(root.querySelector('#kl-app'), {
    K, store: 'vg-korvai-lab',
    audio: { play: (btn, job) => toggle(btn, job.cells && globalThis.VGMridangam && globalThis.VGMridangam.playArranged ? structureJob(job) : rhythmJob(job.root, job.sylls, job.per, job.total, job.angaStarts)), stop,
      sound: () => ({ sa: settings.sa, bpm: settings.bpm }), setSound: (k, v) => setSetting(k, v) },
    // v0.8.3: the rhythm goes to the kalpana page, which sings it (POST /api/kalpana with rhythm)
    kalpana: {
      async open(F, layout, meta) {
        const { rhythmTemplate } = await import('/engine/kalpana/rhythm.js');
        try { sessionStorage.setItem('vg-kalpana-rhythm', JSON.stringify(rhythmTemplate(F, layout, meta))); } catch (e) { return; }
        location.hash = '#/kalpana';
      }
    },
    check: {
      open(script) { try { sessionStorage.setItem('vg-judge-script', script); } catch (e) { /* the judge opens its example */ } location.hash = '#/judge'; },
      go() { location.hash = '#/judge'; }
    }
  });
  return () => { stop(); lab.unmount(); };
}
