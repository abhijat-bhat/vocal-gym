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
  d.querySelectorAll('[data-k]').forEach(b => { click(b); check($('k-out').querySelectorAll('.s').length > 0 && /Creativity at temperature/.test(text('k-audit')), 'kalpana preset ' + b.textContent.trim()); });
  const t0 = d.querySelector('[data-k*="|0|auto"]'); click(t0); check($('k-out').querySelectorAll('.s.nov').length === 0, 'T 0 uses only conventional devices');
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
