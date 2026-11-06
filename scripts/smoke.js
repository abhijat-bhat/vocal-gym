/* Smoke test: load each built page in jsdom, drive every demo control, and fail on any script
   error or missing output. Run after npm run build. */
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let failures = 0;
const check = (cond, msg) => { if (!cond) { failures++; console.log('  FAIL ' + msg); } };

/* A Web Audio stand-in that records what playback schedules (jsdom has no audio). */
function stubAudio(w) {
  const log = w.__audio = { curves: [], oscillators: 0, sets: 0, sources: 0, buffers: [] };
  const param = v => ({ value: v, setValueAtTime() { log.sets++; }, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {},
    setValueCurveAtTime(curve, t, d) { log.curves.push({ curve, t, d }); } });
  const node = extra => Object.assign({ connect(n) { return n; }, disconnect() {} }, extra || {});
  class Ctx {
    constructor() { this.currentTime = 0; this.sampleRate = 44100; this.state = 'running'; this.destination = node(); }
    resume() {}
    createOscillator() { log.oscillators++; return node({ type: 'sine', frequency: param(440), setPeriodicWave() {}, start() {}, stop() {} }); }
    createGain() { return node({ gain: param(1) }); }
    createBiquadFilter() { return node({ type: 'lowpass', frequency: param(350), Q: param(1) }); }
    createPeriodicWave(re, im) { return { re, im }; }
    createBuffer(c, n, r) { const d = new Float32Array(n); log.buffers.push(d); return { duration: n / (r || 44100), length: n, getChannelData: () => d }; }
    createBufferSource() { log.sources++; return node({ buffer: null, start() {}, stop() {} }); }
  }
  w.AudioContext = Ctx;
}

function load(file) {
  const html = fs.readFileSync(path.join(root, 'site', file), 'utf8');
  const errors = [];
  const dom = new JSDOM('<!doctype html><html><head><meta charset="utf-8"></head><body>' + html + '</body></html>', {
    runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(w) {
      w.addEventListener('error', e => errors.push(e.message));
      w.console.error = (...a) => errors.push(a.join(' '));
      w.HTMLElement.prototype.scrollIntoView = function () {};
      stubAudio(w);
    }
  });
  return { dom, w: dom.window, d: dom.window.document, errors };
}

async function driveDemos(file) {
  const { w, d, errors } = load(file);
  const $ = id => d.getElementById(id);
  const click = el => el.dispatchEvent(new w.Event('click'));
  const fire = (el, type) => el.dispatchEvent(new w.Event(type));
  const text = id => $(id).textContent.replace(/\s+/g, ' ').trim();
  console.log(file);
  // alankara
  check(/Variation 0 · the sheet pattern/.test(text('a-info')), 'alankara starts on the sheet pattern');
  check($('a-out').querySelectorAll('.s').length === 100, 'Misra Jhampa shows 10 lines of 10 slots');
  $('a-fam').value = 'eka'; fire($('a-fam'), 'change'); $('a-jati').value = '3'; fire($('a-jati'), 'input');
  for (let i = 0; i < 6; i++) click($('a-new'));
  check(/No further distinct pattern/.test(text('a-audit')), 'Tisra Eka reports that it ran out of patterns');
  click($('a-prev')); check(/Variation 3 of 4/.test(text('a-info')), 'Previous steps back');
  click($('a-sheet')); check(/Variation 0/.test(text('a-info')), 'Sheet pattern returns to variation 0');
  d.querySelectorAll('[data-ala]').forEach(b => { click(b); check($('a-out').querySelectorAll('.s').length > 0, 'alankara preset ' + b.textContent.trim()); });
  if ($('pdf-table')) {
    check(d.querySelectorAll('.pdfcell').length === 35, 'sheet table has 35 cells');
    const cell = Array.from(d.querySelectorAll('.pdfcell')).find(b => b.dataset.f === 'dhruva' && b.dataset.l === '9');
    click(cell); check($('a-span').value === '7' && /1\.5 Sankeer/.test(text('a-info')), 'sheet cell loads into the demo');
  }
  // korvai & tihai lab (v0.8): every lesson draws a grid that lands, the tala bar drives them, every form builds
  const lab = $('kl-root'), q = s => lab.querySelector(s), qa = s => Array.from(lab.querySelectorAll(s));
  const NL = qa('.kl-rail button').length;
  check(q('.kl-lesson') && NL === 15, 'the lab opens on its fifteen lessons (' + NL + ')');
  const lessonOK = tag => {
    const bad = qa('.kl-note.bad, .kl-checks li.bad');
    // a grid, or a warning that says why these settings have none (never an error)
    check(!bad.length && (qa('.kl-c').length > 0 || qa('.kl-note.warn').length > 0), tag + (bad.length ? ': ' + bad.map(x => x.textContent).join(' | ') : ': no grid and no reason'));
  };
  [['triputa', '4', '4'], ['triputa', '5', '4'], ['chapu', '7', '2'], ['dhruva', '9', '5'], ['eka', '3', '3']].forEach(([fam, L, gati]) => {
    const fs = q('[data-fk="fam"]'); fs.value = fam; fire(fs, 'change');
    const js = q('[data-fk="jati"]'); js.value = L; fire(js, 'change');
    click(q('[data-chips="gati"] [data-v="' + gati + '"]'));
    const C = w.VGEngine.korvai.talaCycle(w.VGEngine.tala(fam, +L), +gati).pulses;
    check(new RegExp(C + ' pulses').test(q('.kl-cyclebox').textContent), fam + L + ' gati ' + gati + ': ' + C + ' pulses in the tala bar');
    if (q('[data-mode="learn"]').getAttribute('aria-selected') !== 'true') click(q('[data-mode="learn"]'));
    for (let i = 0; i < NL; i++) { click(qa('.kl-rail button')[i]); lessonOK(fam + L + ' g' + gati + ' lesson ' + (i + 1)); }
  });
  const fs0 = q('[data-fk="fam"]'); fs0.value = 'triputa'; fire(fs0, 'change'); const js0 = q('[data-fk="jati"]'); js0.value = '4'; fire(js0, 'change'); click(q('[data-chips="gati"] [data-v="4"]'));
  click(qa('.kl-rail button')[2]);
  const cell = q('[data-ak="7,5"]'); click(cell);
  check(/leave 1/.test(q('.kl-big').textContent) && q('.kl-c.land.r-close'), 'Balaji’s 7 (5) 7 (5) 7: leave 1, closing tha on sam');
  click(qa('.kl-rail button')[1]); click(q('[data-st="P"][data-d="1"]'));
  check(/3 × 6 \+ 2 × 2 = 22/.test(q('.kl-big').textContent), 'the mora stepper recomputes 3P + 2G');
  click(q('[data-mode="build"]'));
  check(q('.kl-build'), 'build mode');
  ['mora', 'korvai', 'statements', 'progressive', 'chakradar', 'trikaala'].forEach(form => {
    click(q('[data-ck="form"] [data-v="' + form + '"]'));
    lessonOK('build ' + form);
    check(qa('.kl-checks li.ok').length >= 2, 'build ' + form + ' lands');
  });
  // the explorer (v0.8.2): every variation of a form, stepped, filtered, searched and surprised, each one landing
  click(q('[data-ck="form"] [data-v="korvai"]'));
  const exCount = () => +(q('.kl-exhead b') ? q('.kl-exhead b').textContent.replace(/[^0-9]/g, '') : 0), cur = () => q('.kl-excur b') && q('.kl-excur b').textContent;
  check(exCount() > 1000, 'the korvai explorer lists every variation (' + exCount() + ')');
  const seenEx = new Set([cur()]);
  for (let i = 0; i < 8; i++) { click(q('[data-ex="next"]')); seenEx.add(cur()); check(qa('.kl-checks li.ok').length >= 2 && !qa('.kl-checks li.bad').length, 'variation ' + (i + 2) + ' lands: ' + cur()); }
  check(seenEx.size >= 8, 'next steps through different variations (' + seenEx.size + ')');
  click(q('[data-ex="prev"]')); check(/Variation/.test(q('.kl-expos').textContent) && +q('[data-ex="pos"]').value === 8, 'previous steps back');
  click(q('[data-ex="surprise"]')); check(qa('.kl-checks li.ok').length >= 2, 'surprise me draws a variation that lands: ' + cur());
  const fsel = q('[data-exf="purvanga"]'); const opt = Array.from(fsel.options).find(o => /gopuccha/.test(o.value));
  fsel.value = opt.value; fire(fsel, 'change');
  check(exCount() > 0 && /gopuccha/.test(q('.kl-extags').textContent) && /match the filters/.test(q('.kl-exhead').textContent), 'a facet filter narrows the list to gopuccha purvangas');
  const dsel = q('[data-ex="sort"]'); dsel.value = 'novel'; fire(dsel, 'change'); check(qa('.kl-checks li.ok').length >= 2, 'sorting by the most unusual still lands');
  click(q('[data-ex="clear"]')); check(!/match the filters/.test(q('.kl-exhead').textContent), 'clear filters');
  const qb = q('[data-ex="q"]'); qb.value = 'gopuccha 1'; fire(qb, 'input');
  await new Promise(r => setTimeout(r, 350));
  const lis = qa('.kl-exlist button'); check(lis.length > 0 && lis.every(b => /gopuccha/i.test(b.textContent)), 'search finds the gopuccha purvangas (' + lis.length + ')');
  if (lis.length) { click(lis[0]); check(/gopuccha/.test(cur()) && qa('.kl-checks li.ok').length >= 2, 'picking from the list draws it'); }
  q('[data-ex="q"]').value = ''; fire(q('[data-ex="q"]'), 'input'); await new Promise(r => setTimeout(r, 350));
  ['mora', 'statements', 'progressive', 'chakradar'].forEach(form => {
    click(q('[data-ck="form"] [data-v="' + form + '"]'));
    check(q('.kl-ex') && exCount() > 1, form + ': explorer with ' + exCount() + ' variations');
    for (let i = 0; i < 4; i++) { click(q('[data-ex="next"]')); check(qa('.kl-checks li.ok').length >= 2 && !qa('.kl-checks li.bad').length, form + ' variation lands: ' + cur()); }
  });
  click(q('[data-ck="form"] [data-v="mora"]'));
  const src0 = w.__audio.sources; click(q('.kl-play'));
  check(w.__audio.sources - src0 >= 6, 'the lab plays its grid on the mridangam (' + (w.__audio.sources - src0) + ' buffer sources)'); click(q('.kl-play'));
  // the phrase tones (pitched, tuned to Sa) sound with the drum, and the lab's Sa drives the sound bar
  { const o0 = w.__audio.oscillators; click(q('.kl-play')); const withTones = w.__audio.oscillators - o0; click(q('.kl-play'));
    click(q('.kl-tones')); const o1 = w.__audio.oscillators; click(q('.kl-play')); const without = w.__audio.oscillators - o1; click(q('.kl-play')); click(q('.kl-tones'));
    check(withTones > without, 'phrase tones add pitched voices (' + withTones + ' with, ' + without + ' without)');
    const sa = q('.kl-sa'); sa.value = '2'; fire(sa, 'change'); check($('snd-sa').value === '2', 'the lab sets Sa for the page'); sa.value = '0'; fire(sa, 'change'); }
  click(q('[data-ck="form"] [data-v="korvai"]'));
  { const so = q('[data-ex="sort"]'); so.value = 'familiar'; fire(so, 'change'); const p = q('[data-ex="pos"]'); p.value = '1'; fire(p, 'change'); }
  click(q('.kl-check'));
  check(lab.contains($('j-comp')) && /korvai/.test($('j-src').value) && /correctness gate/i.test(text('j-result')) && !/capped at 49/.test(text('j-result')), 'a korvai opens in the judge and passes its gate');
  // v0.8.3: the lab's rhythm, sung by the kalpana generator
  click(q('[data-mode="build"]')); click(q('[data-ck="form"] [data-v="korvai"]'));
  click(q('.kl-kalpana'));
  check(!$('p-kal').hidden && !$('k-rhythm').hidden && /korvai lab/.test(text('k-rhythm')), 'Sing it as kalpana swaras opens the kalpana tab, following the lab');
  check($('k-out').querySelectorAll('.s').length > 0 && /Exactly \d+ pulses/.test(text('k-audit')) && /Family 1/.test(text('k-audit')) && !$('k-audit').querySelector('.bad'), 'the lab rhythm is sung, every check passing');
  check($('k-fam').disabled && $('k-len').disabled, 'the tala and length come from the lab');
  { const o0 = w.__audio.oscillators + w.__audio.sources; click($('k-play')); check(w.__audio.oscillators + w.__audio.sources > o0, 'it plays'); click($('k-play')); }
  // v0.8.5: breath, and inspiration pasted from an AI assistant
  { const m = /(\d+) swaras on (\d+) syllables/.exec(text('k-audit')); check(m && +m[1] <= +m[2] && /held swara \(a karvai\) now and then/.test(text('k-audit')), 'the breath is reported (' + (m ? m[1] + ' of ' + m[2] : 'none') + ')');
    const d = $('k-rh-dens'); d.value = 'full'; fire(d, 'change'); const f = /(\d+) swaras on (\d+) syllables/.exec(text('k-audit')); check(f && f[1] === f[2], 'one swara on every syllable on request'); d.value = 'auto'; fire(d, 'change');
    click($('k-rh-prompt')); check(!$('k-rh-ptext').hidden && /Arohana/.test($('k-rh-ptext').value) && /Phrase 1 \(/.test($('k-rh-ptext').value), 'the prompt describes the raga and the rhythm');
    const n = ($('k-rh-ptext').value.match(/^Phrase \d+ \(/gm) || []).length;
    $('k-rh-ans').value = JSON.stringify({ idea: 'falling runs', phrases: Array.from({ length: n }, (_, k) => ({ phrase: k + 1, swaras: k % 2 ? 'P , M G , R S ,' : 'S R G , M , P D' })) });
    click($('k-rh-use')); check(/suggested phrases sung/.test(text('k-audit')) && /falling runs/.test(text('k-audit')) && !$('k-audit').querySelector('.bad'), 'the pasted lines are sung as inspiration, every check passing');
    check($('k-out').querySelectorAll('.s.insp').length > 0, 'inspired phrases are marked');
    click($('k-rh-clear')); check(!/suggested phrases sung/.test(text('k-audit')), 'clearing returns to the engine’s own lines'); }
  click($('k-rh-stop')); check($('k-rhythm').hidden && !$('k-fam').disabled, 'stop following gives the controls back');
  click($('tab-jathi'));
  click(q('[data-mode="learn"]'));
  check(!lab.contains($('j-comp')) && $('j-comp-home').contains($('j-comp')), 'the judge goes back when the lab leaves Check');
  // jathi: compose and judge
  const expect = { adi: '100', short: '49' };
  ['adi', 'short', 'chapu', 'speed'].forEach(k => {
    $('j-ex').value = k; fire($('j-ex'), 'change');
    const big = $('j-result').querySelector('.big');
    check(big && (!expect[k] || big.textContent === expect[k]), 'example ' + k + ' scores ' + (big && big.textContent));
  });
  $('j-ex').value = 'short'; fire($('j-ex'), 'change');
  check(/Start with line 11/.test($('j-result').textContent), 'short example points at line 11');
  $('j-src').value = 'tala: adi\n(tha ka'; click($('j-judge')); check(/Missing "\)"/.test(text('j-result')), 'syntax error shown');
  // kalpana
  check(/Composition resumes on/.test(d.querySelector('label[for="k-end"]').textContent), 'kalpana asks where the composition resumes');
  d.querySelectorAll('[data-k]').forEach(b => {
    click(b);
    const edp = $('k-end').options[$('k-end').selectedIndex].textContent.replace(/ .*/, '');
    check($('k-out').querySelectorAll('.s').length > 0 && /Creativity at temperature/.test(text('k-audit')), 'kalpana preset ' + b.textContent.trim());
    check(new RegExp('just (below|above) ' + edp).test(text('k-audit')) && /resumes on/.test(text('k-out')), 'kalpana preset lands next to the eduppu: ' + b.textContent.trim());
    check(/Leaps: (none|\d+, )/.test(text('k-audit')), 'kalpana audit reports the leaps: ' + b.textContent.trim());
  });
  // Kalyani resuming on S: the last swara is N (below) or R (above), never S
  $('k-raga').value = 'mela65'; fire($('k-raga'), 'input'); $('k-end').value = '0'; fire($('k-end'), 'input');
  for (let s = 0; s < 6; s++) { click($('k-new')); const land = $('k-out').querySelector('.s.land'); check(land && ['Ṇ', 'R'].includes(land.textContent.trim()), 'Kalyani resuming on S lands on Ṇ or R, got ' + (land && land.textContent)); }
  const t0 = d.querySelector('[data-k*="|0|auto"]'); click(t0); check($('k-out').querySelectorAll('.s.nov').length === 0, 'T 0 uses only conventional devices');
  // Kalyani at T 0 with a free ending: mostly attested phrases, each titled with its source
  $('k-ending').value = 'free'; fire($('k-ending'), 'input');
  const ph = $('k-out').querySelectorAll('.s.ph, .s.frag');
  check(ph.length > 0 && /source S\d+/.test(ph[0].getAttribute('title') || ''), 'attested phrases are coloured and name their source');
  check(/Phrases: \d+% of the slots from attested phrases/.test(text('k-audit')) && /\(S\d+ /.test(text('k-audit')) || /mela65#\d+, S\d+/.test(text('k-audit')), 'the audit lists the phrases used with their sources');
  $('k-raga').value = 'mela6'; fire($('k-raga'), 'input');
  check(/Phrase data: none for this raga/.test(text('k-audit')), 'ragas without phrase data say so');
  // mora style control: a shift mora in Kalyani, three different statements
  // (two avartanams: a srotovaha mora needs at least 12 of the slots and may take at most 60%)
  $('k-raga').value = 'mela65'; fire($('k-raga'), 'input'); $('k-len').value = '16'; fire($('k-len'), 'input'); $('k-ending').value = 'mora'; fire($('k-ending'), 'input');
  ['shift', 'gopuccha', 'srotovaha'].forEach(st => {
    $('k-mora').value = st; fire($('k-mora'), 'input');
    const mo = $('k-out').querySelectorAll('.s.mora');
    check(mo.length > 0 && new RegExp(st + ' mora').test(text('k-audit')), 'mora style ' + st + ' shown in the notation and the audit');
  });
  $('k-mora').value = 'auto'; fire($('k-mora'), 'input');
  // v0.4: the phrase plan in the audit, the korvai ending and the whole-session scope
  check(/Phrase plan: \d+ phrases shaped by the tala/.test(text('k-audit')), 'the audit describes the phrase plan');
  $('k-len').value = '16'; fire($('k-len'), 'input'); $('k-pa').value = '2'; fire($('k-pa'), 'input');
  $('k-ending').value = 'korvai'; fire($('k-ending'), 'input');
  check(/Korvai ending|no korvai|Free ending|Mora ending/.test(text('k-audit')), 'the korvai ending is offered and explained');
  $('k-ending').value = 'auto'; fire($('k-ending'), 'input');
  if ($('k-scope')) {
    $('k-scope').value = 'session'; fire($('k-scope'), 'input');
    check($('k-audit').querySelectorAll('li').length >= 12 && /first speed/.test(text('k-audit')) && /koraippu/.test(text('k-audit')) && /korvai/.test(text('k-audit')), 'the whole session lists its rounds: first speed, second speed, koraippu, korvai');
    check($('k-out').querySelectorAll('.s').length > 200, 'the session is laid out on the tala grid');
    $('k-scope').value = 'round'; fire($('k-scope'), 'input');
  } else check(false, 'the scope select exists');
  // gamaka playback (gamaka plan test 17): the select, the pitch view, and one pitch curve per legato group
  check(!!$('snd-gamaka') && $('snd-gamaka').type === 'range' && $('snd-gamaka').min === '0' && $('snd-gamaka').max === '100', 'gamaka slider from 0 to 100');
  check(/performative/.test(text('snd-gv')), 'the slider names its level');
  $('k-raga').value = 'mela65'; fire($('k-raga'), 'input'); $('k-len').value = '8'; fire($('k-len'), 'input'); $('k-ending').value = 'auto'; fire($('k-ending'), 'input');
  const pv = $('k-pitch').querySelector('svg');
  check(pv && pv.querySelector('path.pv-path') && pv.querySelectorAll('rect.pv-note title').length > 0, 'the pitch view draws the contour with per-swara rules');
  check(/Raga-specific gamaka|Gamaka from text/.test(text('k-gamaka')), 'Kalyani shows its gamaka sources');
  // the sung voice (docs/research/expressive-voice.md): one rendered buffer, finite and audible, no oscillators
  const sung = (label, play) => {
    w.__audio.curves.length = 0; w.__audio.buffers.length = 0;
    click(play);
    const bufs = w.__audio.buffers.filter(b => b.length > 44100 * 0.5), y = bufs[0];
    let pk = 0, fin = true; if (y) for (let i = 0; i < y.length; i++) { if (!Number.isFinite(y[i])) fin = false; pk = Math.max(pk, Math.abs(y[i])); }
    check(bufs.length === 1 && fin && pk > 0.05 && pk < 1, label + ': the voice sings one finite, audible buffer (peak ' + pk.toFixed(2) + ')');
    check(w.__audio.curves.length === 0, label + ': no oscillator pitch curves (the voice is the rendered buffer)');
    click(play);   // stop
  };
  check(!!$('snd-voice') && $('snd-voice').value === 'aa', 'the voice select starts on the voice sung on aa');
  ['0', '55', '100'].forEach(v => { $('snd-gamaka').value = v; fire($('snd-gamaka'), 'change'); sung('kalpana, gamaka ' + v, $('k-play')); });
  $('snd-voice').value = 'swaram'; fire($('snd-voice'), 'change');
  sung('kalpana sung on the swara names', $('k-play'));
  sung('alankara sung on the swara names', $('a-play'));
  $('snd-voice').value = 'aa'; fire($('snd-voice'), 'change');
  sung('alankara sung on aa', $('a-play'));
  // the simple tone (the earlier playback): one pitch curve per legato group with gamaka, plain tones at 0
  $('snd-voice').value = 'tone'; fire($('snd-voice'), 'change');
  ['20', '55', '100'].forEach(v => {
    $('snd-gamaka').value = v; fire($('snd-gamaka'), 'input'); fire($('snd-gamaka'), 'change');
    w.__audio.curves.length = 0;
    click($('k-play'));
    // per legato group: a pitch curve (in Hz) and a loudness curve (around 1)
    const peak = c => Math.max.apply(null, Array.from(c.curve)), curves = w.__audio.curves.filter(c => peak(c) > 20), loud = w.__audio.curves.filter(c => peak(c) <= 20);
    check(curves.length === 1 && curves.every(c => c.curve instanceof w.Float32Array || c.curve instanceof Float32Array) && curves.every(c => Array.from(c.curve).every(Number.isFinite) && c.d > 0),
      'simple tone, gamaka ' + v + ': one finite pitch curve per legato group, got ' + curves.length);
    check(loud.length === curves.length && loud.every(c => Array.from(c.curve).every(x => x > 0.7 && x < 1.2)), 'simple tone, gamaka ' + v + ': a loudness curve that follows the pitch');
    click($('k-play'));   // stop
  });
  $('snd-gamaka').value = '0'; fire($('snd-gamaka'), 'change');
  w.__audio.curves.length = 0; click($('k-play'));
  check(w.__audio.curves.length === 0, 'simple tone, gamaka off: the plain tones, with no pitch curves');
  click($('k-play'));
  $('snd-voice').value = 'aa'; fire($('snd-voice'), 'change');
  check(/view shows performative gamaka/.test(text('k-gamaka')), 'with gamaka at 0 the view says it shows performative gamaka');
  check(/straight notes/.test(text('snd-gv')), 'level 0 is named straight notes');
  $('k-raga').value = 'mela1'; fire($('k-raga'), 'input');
  check(/Generic gamaka: no raga-specific data yet/.test(text('k-gamaka')), 'data-less ragas say their gamaka is generic');
  $('snd-gamaka').value = '55'; fire($('snd-gamaka'), 'change');
  // micro-benchmark (plan 8): 100 rounds of one Adi avartanam in under a second
  // (warm, best of three runs, so a moment of load elsewhere on the machine does not decide it)
  const kal = w.VGEngine.allRagas().melakartas[64], opts = s => ({ aksharas: 8, perAkshara: 2, startPitch: 0, eduppuPitch: 7, T: s % 3, seed: s + 1 });
  [0, 1, 2].forEach(s => w.VGEngine.kalpana(kal, opts(s)));
  const runs = [0, 1, 2].map(() => { const tb = Date.now(); for (let s = 0; s < 100; s++) w.VGEngine.kalpana(kal, opts(s)); return Date.now() - tb; });
  const ms = Math.min.apply(null, runs);
  // the target is 1 s on a machine running at full speed; a throttled CPU (measured by a plain loop
  // that takes about 100 ms at full speed) raises the limit in proportion, never lowers it
  const tc = Date.now(); let acc = 0; for (let k = 0; k < 1e8; k++) acc += k & 7;
  const calib = Math.max(1, Date.now() - tc), limit = Math.round(1000 * Math.max(1, calib / 100));
  console.log('  100 Kalyani rounds: ' + runs.join(', ') + ' ms (best ' + ms + '); calibration loop ' + calib + ' ms (about 100 at full speed), limit ' + limit + ' ms' + (acc ? '' : ''));
  check(ms < limit, '100 rounds under 1 s at full speed: best of three took ' + ms + ' ms, limit ' + limit + ' ms');
  // a whole session: one block a round
  $('k-scope').value = 'session'; fire($('k-scope'), 'input');
  check($('k-out').querySelectorAll('.sround').length >= 4 && $('k-out').querySelectorAll('.theme').length >= 4, 'session rounds drawn as blocks (' + $('k-out').querySelectorAll('.sround').length + ')');
  $('k-scope').value = 'round'; fire($('k-scope'), 'input');
  // v0.8.7: the melakarta and katapayadi explorer
  click($('tab-mela')); check(!$('p-mela').hidden, 'the melakarta tab opens');
  { const R = $('mx-root'), mq = s => R.querySelector(s);
    check(R.querySelectorAll('.mx-m').length === 72 && R.querySelectorAll('.mx-half').length === 2, 'the 72 melakartas in two halves of six chakras');
    click(mq('.mx-m[data-n="65"]'));
    const det = () => mq('.mx-detail').textContent.replace(/\s+/g, ' ');
    check(/65 · Mechakalyani/.test(det()) && /Mecakalyāṇī/.test(det()) && /reversed65/.test(det().replace(/\s/g, '')) && /Rudra/.test(det()) && /29 − 1 = 28/.test(det()), 'a mela shows its katapayadi reading, its steps and its chakra');
    click(mq('.mx-m[data-n="20"]')); check(/an exception/.test(det()) && /do not explain/.test(det()), 'Natabhairavi is shown as an unexplained exception');
    click(mq('.mx-m[data-n="16"]')); check(/by a convention/.test(det()), 'Chakravakam needs the convention');
    const q = mq('#mx-q'); q.value = 'Natakapriya'; fire(q, 'input');
    check(/could also read/.test(mq('.mx-findout').textContent) && mq('.mx-findout .mx-go[data-n="10"]'), 'decoding plain letters shows the other readings');
    click(mq('.mx-findout .mx-go[data-n="10"]')); check(/10 · Natakapriya/.test(det()), 'a found mela opens');
    const sel = k => mq('.mx-sel select[data-k="' + k + '"]');
    sel('R').value = 'R2'; sel('G').value = 'G1'; fire(sel('G'), 'change'); check(/same pitch/.test(mq('.mx-buildout').textContent) && mq('.mx-open').disabled, 'an impossible scale is refused with its reason');
    sel('G').value = 'G3'; sel('M').value = 'M1'; sel('D').value = 'D2'; sel('N').value = 'N3'; fire(sel('N'), 'change');
    check(/mela 29, Dheerasankarabharanam/.test(mq('.mx-buildout').textContent), 'the builder names the mela');
    click(mq('.mx-open')); check(/29 · Dheerasankarabharanam/.test(det()), 'and opens it');
    const o0 = w.__audio.oscillators; click(mq('.mx-play')); check(w.__audio.oscillators > o0, 'the scale plays'); click(mq('.mx-play')); }
  // tabs
  click($('tab-jathi')); check(!$('p-jathi').hidden && $('p-ala').hidden, 'tabs switch');
  check(errors.length === 0, 'no script errors: ' + errors.join(' | '));
}

function loads(file) {
  const { errors } = load(file);
  console.log(file);
  check(errors.length === 0, 'no script errors: ' + errors.join(' | '));
}

await driveDemos('playground.html');
await driveDemos('research-plan.html');
loads('pitch.html');
loads('index.html');
if (failures) { console.log(failures + ' smoke check(s) failed'); process.exit(1); }
console.log('Smoke test passed');
