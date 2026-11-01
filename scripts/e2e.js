/* End-to-end test of the web app in headless Chrome, driven over the DevTools protocol.
   Starts the server, opens every page, uses every preset and the main controls, plays audio,
   and fails on any script error or missing result. Needs Chrome or Edge; set CHROME to its path
   if it is not found. Run: npm run e2e */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server/app.js';

const CANDIDATES = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'
].filter(Boolean);
const CHROME = CANDIDATES.find(p => existsSync(p));
if (!CHROME) { console.log('No Chrome or Edge found; set CHROME to run the end-to-end test. Skipping.'); process.exit(0); }

// never call Claude for real from a test: the inspire route answers 'not configured'
delete process.env.ANTHROPIC_API_KEY; delete process.env.ANTHROPIC_AUTH_TOKEN;
const server = createApp();
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = 'http://127.0.0.1:' + server.address().port;
const profile = mkdtempSync(join(tmpdir(), 'vg-e2e-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', '--autoplay-policy=no-user-gesture-required', '--user-data-dir=' + profile, '--window-size=1300,1000', 'about:blank']);
const wsUrl = await new Promise((resolve, reject) => {
  let buf = '';
  chrome.stderr.on('data', d => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) resolve(m[1]); });
  setTimeout(() => reject(new Error('Chrome did not start')), 20000);
});

/* ---- a minimal DevTools client ---- */
const browser = new WebSocket(wsUrl);
await new Promise(r => browser.addEventListener('open', r));
let id = 0; const pending = new Map(); const errors = [];
browser.addEventListener('message', ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result); }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception ? m.params.exceptionDetails.exception.description : m.params.exceptionDetails.text);
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push('console.error: ' + m.params.args.map(a => a.value || a.description).join(' '));
});
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => { const i = ++id; pending.set(i, { resolve, reject }); browser.send(JSON.stringify({ id: i, method, params, sessionId })); });
const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const cmd = (m, p) => send(m, p, sessionId);
await cmd('Runtime.enable'); await cmd('Page.enable');

async function js(expr) {
  const r = await cmd('Runtime.evaluate', { expression: '(async () => { ' + expr + ' })()', awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error('In page: ' + (r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text));
  return r.result.value;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function until(expr, what, ms = 8000) {
  const t = Date.now();
  while (Date.now() - t < ms) { if (await js('return !!(' + expr + ')')) return; await sleep(100); }
  throw new Error('Timed out waiting for ' + what);
}
async function go(hash) { await js('location.hash = ' + JSON.stringify(hash)); await sleep(150); }
const click = sel => js('const el = document.querySelector(' + JSON.stringify(sel) + '); if (!el) throw new Error("no element ' + sel.replace(/"/g, '\\"') + '"); el.click();');
let steps = 0;
const step = async (name, fn) => { await fn(); steps++; console.log('  ✓ ' + name); };

try {
  await cmd('Page.navigate', { url: base + '/' });
  await until('document.querySelector("#hd-n .cell")', 'the home sample');

  console.log('home');
  await step('sample plays and the cursor moves', async () => {
    await click('#hd-play'); await until('document.querySelector("#hd-n .cell.now")', 'a lit cell', 4000); await click('#hd-play');
    await until('!document.querySelector("#hd-play[data-playing]")', 'playback to stop');
  });
  await step('glossary pop-up opens from a term', async () => { await click('.term[data-term="raga"]'); await until('!document.getElementById("pop").hidden', 'the pop-up'); await js('document.body.click()'); });

  console.log('alankara');
  await go('#/alankara'); await until('document.querySelector("#a-n .cell")', 'the alankara grid');
  await step('two new patterns, then step back to the sheet', async () => {
    await click('#a-new'); await until('document.getElementById("a-count").textContent === "New pattern 1 of 1"', 'pattern 1');
    await click('#a-new'); await until('document.getElementById("a-count").textContent === "New pattern 2 of 2"', 'pattern 2');
    await click('#a-prev'); await until('document.getElementById("a-count").textContent === "New pattern 1 of 2"', 'previous');
    await click('#a-sheet'); await until('document.getElementById("a-count").textContent.startsWith("Sheet pattern")', 'the sheet');
  });
  await step('every preset loads', async () => {
    const n = await js('return document.querySelectorAll("[data-preset]").length');
    for (let i = 0; i < n; i++) { await click('[data-preset="' + i + '"]'); await sleep(400); await until('document.querySelector("#a-n .cell") && !document.querySelector("#a-explain .notice")', 'preset ' + i); }
  });
  await step('speed, raga search and tala family', async () => {
    await click('#a-speed button[data-v="4"]'); await until('document.querySelector("#a-n .notation.dense")', 'third speed');
    await click('#a-raga .rpick-cur');
    await js('const i = document.querySelector("#a-raga input"); i.value = "hamsa"; i.dispatchEvent(new Event("input"));');
    await click('#a-raga .rpick-opt'); await until('document.getElementById("a-title").textContent.startsWith("Hamsadhwani")', 'Hamsadhwani');
    await js('const s = document.querySelector("#a-tala select"); s.value = "ata"; s.dispatchEvent(new Event("change"));');
    await until('document.getElementById("a-title").textContent.includes("Ata")', 'Ata tala');
  });
  await step('playback lights the grid', async () => {
    await click('#a-tr .play'); await until('document.querySelector("#a-n .cell.now")', 'a lit cell', 4000); await click('#a-tr .play');
  });

  console.log('kalpana');
  await go('#/kalpana'); await until('document.querySelector("#k-n .cell")', 'the kalpana grid');
  await step('every preset loads and lands where asked', async () => {
    const n = await js('return document.querySelectorAll("[data-preset]").length');
    for (let i = 0; i < n; i++) { await click('[data-preset="' + i + '"]'); await sleep(400); await until('document.querySelector("#k-n .cell.land")', 'preset ' + i); }
  });
  await step('new round, landing swara and ending', async () => {
    const before = await js('return document.getElementById("k-n").textContent');
    await click('#k-new'); await until('document.getElementById("k-n").textContent !== ' + JSON.stringify(before), 'a different round');
    await click('#k-land button[data-v="12"]'); await sleep(300);
    await click('#k-ending button[data-v="free"]'); await until('document.querySelector("#k-n .cell.land") || document.querySelector("#k-explain .notice")', 'a result or a reason');
  });
  await step('an impossible request explains itself', async () => {
    await click('#k-len button[data-v="0.5"]'); await click('#k-per button[data-v="1"]');
    await click('#k-start button[data-v="0"]'); await click('#k-land button[data-v="12"]');
    await sleep(300);
    await until('document.querySelector("#k-n .cell.land") || document.querySelector("#k-explain .notice")', 'a result or a reason');
  });

  console.log('korvai lab');
  await go('#/jathi'); await until('location.hash === "#/korvai" && document.querySelector("#kl-app .kl-lesson")', 'the old jathi route opens the lab');
  await step('every lesson draws a grid that lands, in three talas', async () => {
    for (const [fam, L] of [['triputa', '4'], ['ata', '5'], ['chapu', '7']]) {
      await js('const f = document.querySelector("#kl-app [data-fk=fam]"); f.value = "' + fam + '"; f.dispatchEvent(new Event("change"));');
      await js('const j = document.querySelector("#kl-app [data-fk=jati]"); j.value = "' + L + '"; j.dispatchEvent(new Event("change"));');
      const nl = await js('return document.querySelectorAll("#kl-app .kl-rail button").length');
      for (let i = 0; i < nl; i++) {
        await js('document.querySelectorAll("#kl-app .kl-rail button")[' + i + '].click()');
        await until('document.querySelector("#kl-app .kl-c") && !document.querySelector("#kl-app .kl-note.bad, #kl-app .kl-checks li.bad")', fam + L + ' lesson ' + (i + 1));
      }
    }
  });
  await step('build: every form lands; playback lights the grid', async () => {
    await click('#kl-app [data-mode="build"]');
    for (const f of ['mora', 'korvai', 'statements', 'progressive', 'chakradar', 'trikaala']) { await click('#kl-app [data-ck="form"] [data-v="' + f + '"]'); await until('document.querySelectorAll("#kl-app .kl-checks li.ok").length >= 2', 'form ' + f); }
    await click('#kl-app [data-ck="form"] [data-v="mora"]');
    await click('#kl-app .kl-play'); await until('document.querySelector("#kl-app .kl-c.now")', 'a lit cell', 4000); await click('#kl-app .kl-play');
  });
  await step('the lab’s rhythm opens on the kalpana page, sung', async () => {
    await click('#kl-app [data-ck="form"] [data-v="korvai"]'); await click('#kl-app .kl-kalpana');
    await until('location.hash === "#/kalpana" && !document.getElementById("k-rhythm").hidden && document.querySelector("#k-n .cell")', 'the kalpana page following the lab');
    await until('document.getElementById("k-explain").textContent.includes("korvai lab")', 'the summary names the lab');
    // v0.8.5: asking Claude without credentials explains itself and offers copy and paste
    await click('#k-rh-ask'); await until('/not configured/.test(document.getElementById("k-rh-status").textContent) && document.getElementById("k-rh-paste").open', 'the not-configured message');
    await click('#k-rh-prompt'); await until('document.getElementById("k-rh-ptext").value.includes("Arohana")', 'the prompt');
    await js('const n = (document.getElementById("k-rh-ptext").value.match(/^Phrase \\d+ \\(/gm) || []).length; document.getElementById("k-rh-ans").value = JSON.stringify({ idea: "falling runs", phrases: Array.from({ length: n }, (_, k) => ({ phrase: k + 1, swaras: k % 2 ? "P , M G , R S ," : "S R G , M , P D" })) });');
    await click('#k-rh-use'); await until('document.getElementById("k-explain").textContent.includes("suggested lines")', 'the pasted lines sung');
    await click('#k-rh-stop'); await until('document.getElementById("k-rhythm").hidden', 'stop following');
    await go('#/korvai'); await until('document.querySelector("#kl-app .kl-ex")', 'back in the lab');
  });
  await step('a korvai opens in the judge and passes', async () => {
    await click('#kl-app [data-ck="form"] [data-v="korvai"]'); await click('#kl-app .kl-check');
    await until('document.querySelector("#g-res .ring") && document.getElementById("g-src").value.includes("Korvai lab")', 'the judge verdict');
  });

  console.log('jathi judge');
  await step('every example is judged; the short one shows fixes', async () => {
    for (const ex of ['adi', 'short', 'chapu', 'speed']) {
      await click('[data-ex="' + ex + '"]'); await sleep(250); await until('document.querySelector("#g-res .ring")', 'example ' + ex);
      if (ex === 'short') await until('document.querySelector("#g-res .fixes li")', 'the fixes');
    }
  });
  await step('typing an error marks the line', async () => {
    await js('const t = document.getElementById("g-src"); t.value = "tala: adi\\n{tha-dhi"; t.dispatchEvent(new Event("input"));');
    await until('document.querySelector("#g-res .errlist li") && document.querySelector("#g-gut .err")', 'the error list');
  });

  console.log('learn');
  await step('deep link to a term', async () => { await go('#/learn/teermanam'); await until('document.getElementById("t-teermanam")', 'the teermanam entry'); });

  if (errors.length) throw new Error('Script errors in the page:\n  ' + errors.join('\n  '));
  console.log('End-to-end test passed (' + steps + ' steps)');
} catch (e) {
  console.error('End-to-end test FAILED: ' + e.message);
  if (errors.length) console.error('Page errors:\n  ' + errors.join('\n  '));
  process.exitCode = 1;
} finally {
  try { browser.close(); } catch (e) { /* closed */ }
  chrome.kill();
  server.close();
  await sleep(300);
  try { rmSync(profile, { recursive: true, force: true }); } catch (e) { /* Chrome may still hold files */ }
}
