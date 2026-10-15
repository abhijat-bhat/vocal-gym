/* Smoke test: load each built page in jsdom, drive every demo control, and fail on any script
   error or missing output. Run after npm run build. */
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let failures = 0;
const check = (cond, msg) => { if (!cond) { failures++; console.log('  FAIL ' + msg); } };

function load(file) {
  const html = fs.readFileSync(path.join(root, 'site', file), 'utf8');
  const errors = [];
  const dom = new JSDOM('<!doctype html><html><head><meta charset="utf-8"></head><body>' + html + '</body></html>', {
    runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(w) {
      w.addEventListener('error', e => errors.push(e.message));
      w.console.error = (...a) => errors.push(a.join(' '));
      w.HTMLElement.prototype.scrollIntoView = function () {};
    }
  });
  return { dom, w: dom.window, d: dom.window.document, errors };
}

function driveDemos(file) {
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
  // jathi: generate
  d.querySelectorAll('[data-j]').forEach(b => { click(b); check(/correctness gate passed/.test(text('j-audit')), 'jathi preset passes the judge: ' + b.textContent.trim()); });
  $('j-fam').value = 'chapu'; fire($('j-fam'), 'change'); $('j-off').value = '-6'; fire($('j-off'), 'input');
  check(/before sam \(atita\)/.test(text('j-info')) && $('j-out').querySelectorAll('.row').length >= 3, 'chapu with atita eduppu');
  $('j-land').value = 'end'; fire($('j-land'), 'input'); check(/Ends exactly at sam/.test(text('j-audit')), 'land at end');
  click($('j-edit')); check(!$('j-comp').hidden && $('j-result').querySelector('.big'), 'open in editor judges the script');
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
  click($('j-mode-gen')); check(!$('j-gen').hidden, 'back to generate mode');
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
  $('k-raga').value = 'mela1'; fire($('k-raga'), 'input');
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
  // tabs
  click($('tab-jathi')); check(!$('p-jathi').hidden && $('p-ala').hidden, 'tabs switch');
  check(errors.length === 0, 'no script errors: ' + errors.join(' | '));
}

function loads(file) {
  const { errors } = load(file);
  console.log(file);
  check(errors.length === 0, 'no script errors: ' + errors.join(' | '));
}

driveDemos('playground.html');
driveDemos('research-plan.html');
loads('pitch.html');
loads('index.html');
if (failures) { console.log(failures + ' smoke check(s) failed'); process.exit(1); }
console.log('Smoke test passed');
