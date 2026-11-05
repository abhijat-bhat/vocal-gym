/* End-to-end test of the web app in headless Chrome, driven over the DevTools protocol.
   Starts the server, opens every page, uses every preset and the main controls, plays audio,
   and fails on any script error or missing result. Needs Chrome or Edge; set CHROME to its path
   if it is not found. Run: npm run e2e */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, readFileSync } from 'node:fs';
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
// v0.8.7: accounts go to a database of the test's own (opened on first use), never the real one
process.env.VG_DB = join(profile, 'e2e.db');
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', '--autoplay-policy=no-user-gesture-required', '--user-data-dir=' + profile, '--window-size=1300,1000', 'about:blank']);
const wsUrl = await new Promise((resolve, reject) => {
  let buf = '';
  chrome.stderr.on('data', d => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) resolve(m[1]); });
  // some installs print nothing; the browser also writes its port and path to DevToolsActivePort in the profile
  const poll = setInterval(() => {
    try { const [port, path] = readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').trim().split(/\r?\n/); if (port && path) { clearInterval(poll); resolve('ws://127.0.0.1:' + port + path); } } catch (e) { /* not yet */ }
  }, 250);
  setTimeout(() => { clearInterval(poll); reject(new Error('Chrome did not start')); }, 30000);
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

  await step('the Tools menu opens and leads to each of the five tools', async () => {
    for (const r of ['alankara', 'kalpana', 'korvai', 'melakarta', 'judge']) {
      await click('#navdrop'); await until('document.getElementById("navgroup").classList.contains("open")', 'the menu open');
      await click('#toolsmenu a[data-route="' + r + '"]'); await until('location.hash === "#/' + r + '" && document.getElementById("navdrop").classList.contains("current") && !document.getElementById("navgroup").classList.contains("open")', r + ' through the menu');
    }
    await go('#/');
  });

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

  console.log('melakartas');
  await step('the 72, a mela worked out, a deep link, the decoder and the builder', async () => {
    await go('#/melakarta/65');
    await until('document.querySelectorAll("#mx-app .mx-m").length === 72 && /65 · Mechakalyani/.test(document.querySelector("#mx-app .mx-detail").textContent)', 'mela 65 from the link');
    await click('#mx-app .mx-m[data-n="57"]'); await until('/an exception/.test(document.querySelector("#mx-app .mx-detail").textContent) && /Sihmendramadhyamam/.test(document.querySelector("#mx-app .mx-detail").textContent)', 'Simhendramadhyamam explained');
    await js('const q = document.getElementById("mx-q"); q.value = "Dhīraśaṅkarābharaṇam"; q.dispatchEvent(new Event("input"));');
    await until('document.querySelector("#mx-app .mx-findout .mx-go[data-n=\\"29\\"]")', 'the decoder finds 29');
    await click('#mx-app .mx-findout .mx-go[data-n="29"]'); await until('/29 · Dheerasankarabharanam/.test(document.querySelector("#mx-app .mx-detail").textContent)', 'mela 29');
    await click('#mx-app .mx-play'); await until('document.querySelector("#mx-app .mx-play[data-playing]")', 'the scale plays', 6000); await click('#mx-app .mx-play');
  });

  console.log('jathi judge');
  await step('every example is judged; the short one shows fixes', async () => {
    await go('#/judge'); await until('document.querySelector("[data-ex=\\"adi\\"]")', 'the judge page');
    for (const ex of ['adi', 'short', 'chapu', 'speed']) {
      await click('[data-ex="' + ex + '"]'); await sleep(250); await until('document.querySelector("#g-res .ring")', 'example ' + ex);
      if (ex === 'short') await until('document.querySelector("#g-res .fixes li")', 'the fixes');
    }
  });
  await step('typing an error marks the line', async () => {
    await js('const t = document.getElementById("g-src"); t.value = "tala: adi\\n{tha-dhi"; t.dispatchEvent(new Event("input"));');
    await until('document.querySelector("#g-res .errlist li") && document.querySelector("#g-gut .err")', 'the error list');
  });

  console.log('practice and accounts');
  await step('create an account, run a routine across two tools, log it, see the streak', async () => {
    await go('#/account'); await until('document.getElementById("ac-new")', 'the account page');
    await js('const f = (id, v) => { document.getElementById(id).value = v; }; f("ac-nu", "e2e_singer"); f("ac-nn", "E2E Singer"); f("ac-np", "pa da ni sa 123"); f("ac-np2", "pa da ni sa 123"); document.getElementById("ac-new").requestSubmit();');
    await until('location.hash === "#/practice" && document.querySelector("[data-start=\\"starter-quick\\"]")', 'the practice page with the starter routines');
    await until('document.getElementById("acctbtn").textContent === "E2E Singer"', 'the account button names the singer');
    await click('[data-start="starter-quick"]');
    await until('location.hash === "#/alankara" && !document.getElementById("sessionbar").hidden && /1 of 2/.test(document.getElementById("sessionbar").textContent)', 'the first tool, with the session bar');
    await sleep(1200);
    await until('/0:0[1-9]/.test(document.querySelector("#sessionbar .sb-time b").textContent)', 'the timer runs');
    await click('#sessionbar [data-sb="next"]'); await until('location.hash === "#/kalpana" && /2 of 2/.test(document.getElementById("sessionbar").textContent)', 'the second tool');
    await click('#sessionbar [data-sb="finish"]'); await until('location.hash === "#/practice/finish" && document.getElementById("pr-keep") && document.getElementById("sessionbar").hidden', 'the finish page');
    await click('[data-r="4"]'); await js('document.getElementById("pr-notes").value = "steady gamakas";'); await click('#pr-keep');
    await until('location.hash === "#/practice" && /steady gamakas/.test((document.getElementById("pr-logs") || {}).textContent || "")', 'the session in the log');
    await until('document.querySelector(".pr-stat .pr-big") && document.querySelector(".pr-stat .pr-big").textContent.trim() === "1"', 'a one-day streak');
  });
  await step('log out, log back in, and the log is still there', async () => {
    await go('#/account'); await until('document.getElementById("ac-out")', 'the account page, logged in');
    await click('#ac-out'); await until('document.getElementById("acctbtn").textContent === "Log in"', 'logged out');
    await go('#/account'); await until('document.getElementById("ac-login")', 'the login form');
    await js('document.getElementById("ac-lu").value = "e2e_singer"; document.getElementById("ac-lp").value = "pa da ni sa 123"; document.getElementById("ac-login").requestSubmit();');
    await until('location.hash === "#/practice" && /steady gamakas/.test((document.getElementById("pr-logs") || {}).textContent || "")', 'the log after logging back in');
  });
  await step('the app is installable: a manifest with icons and a service worker', async () => {
    let ok = false;
    for (let k = 0; k < 40 && !ok; k++) { ok = await js('const r = await navigator.serviceWorker.getRegistration(); const m = await (await fetch("/manifest.webmanifest")).json(); const i = await fetch(m.icons[0].src); return !!(r && r.active) && m.display === "standalone" && m.icons.length >= 3 && i.ok;'); if (!ok) await sleep(150); }
    if (!ok) throw new Error('no active service worker, manifest or icon');
  });

  console.log('repertoire');
  await step('the list: all compositions, a type filter and a search', async () => {
    await click('#nav a[data-route="repertoire"]');
    await until('location.hash === "#/repertoire" && document.querySelectorAll(".rp-item").length >= 60', 'the repertoire list', 15000);
    await until('/^All 1[,.]?5\\d\\d compositions$/.test(document.getElementById("rp-count").textContent)', 'every composition counted');
    await click('#rp-types [data-type="Geetham"]');
    await until('/^3\\d compositions$/.test(document.getElementById("rp-count").textContent)', 'the geethams');
    await js('const q = document.getElementById("rp-q"); q.value = "vandhe madhavam"; q.dispatchEvent(new Event("input"));');
    await until('document.querySelectorAll(".rp-item").length === 1', 'one search result');
  });
  await step('a composition: the grid with sahitya, a section sung, a line looped', async () => {
    await click('.rp-item');
    await until('document.querySelector(".rp-line .rp-sw i") && document.querySelector(".rp-syl")', 'the notation with its sahitya', 10000);
    await click('#rp-tr .play'); await until('document.querySelector(".rp-sw i.now")', 'a lit swara', 20000); await click('#rp-tr .play');
    await until('!document.querySelector("#rp-tr .play[data-playing]")', 'playback to stop');
    await click('[data-loop$=":1"]'); await until('document.querySelector(".rp-line.sel .rp-sw i.now")', 'a lit swara in the looped line', 20000);
    await click('#rp-tr .play'); await until('!document.querySelector("#rp-tr .play[data-playing]")', 'the loop to stop');
  });
  await step('add it to a routine, and the routine opens it', async () => {
    await click('#rp-addr'); await until('document.getElementById("rp-rsel")', 'the routine picker');
    await js('document.getElementById("rp-rsel").value = "new";'); await click('#rp-radd');
    await until('!document.getElementById("rp-rsel")', 'the item added');
    await go('#/practice'); await until('document.querySelector(".pr-rt a[href^=\\"#/repertoire/\\"]")', 'the routine with its composition', 10000);
    await js('const a = Array.from(document.querySelectorAll(".pr-rt")).find(c => c.querySelector("a[href^=\\"#/repertoire/\\"]")); a.querySelector("[data-start]").click();');
    await until('location.hash.startsWith("#/repertoire/") && document.querySelector(".rp-line") && !document.getElementById("sessionbar").hidden', 'the composition, with the session bar', 10000);
    await click('#sessionbar [data-sb="finish"]'); await until('location.hash === "#/practice/finish"', 'the finish page');
    await click('#pr-keep'); await until('location.hash === "#/practice" && /Repertoire/.test((document.getElementById("pr-logs") || {}).textContent || "")', 'the repertoire session in the log', 10000);
  });

  await step('correct a line: the editor, the log, stepping through it and undoing', async () => {
    await go('#/repertoire'); await until('document.querySelectorAll(".rp-item").length >= 1', 'the list', 15000);
    await js('const q = document.getElementById("rp-q"); q.value = "vandhe madhavam"; q.dispatchEvent(new Event("input"));');
    await until('document.querySelectorAll(".rp-item").length === 1', 'one composition'); await click('.rp-item');
    await until('document.querySelector(".rp-line .rp-sw i")', 'the notation', 10000);
    await click('#rp-edit'); await until('document.querySelector(".rp-pen")', 'a pen beside each line');
    const flagBefore = await js('return document.querySelectorAll(".rp-mine").length;');
    if (flagBefore !== 0) throw new Error('a line is marked as edited before any edit');
    // the editor opens with the line, says what is wrong as you type, and shows the grid
    await click('.rp-pen'); await until('document.querySelector(".rp-edit .rp-edin") && document.querySelector(".rp-sylin")', 'the editor with a box for each syllable');
    const was = await js('return document.querySelector(".rp-edin").value;');
    await js('const i = document.querySelector(".rp-edin"); i.value = "S X"; i.dispatchEvent(new Event("input", { bubbles: true }));');
    await until('document.querySelector(".rp-edstat.bad") && document.querySelector(".rp-edin.bad")', 'the mistake pointed out');
    await js('document.querySelector(".rp-edsave").click();');
    await until('/not part of the notation/.test(document.querySelector(".rp-edstat").textContent) && !document.querySelector(".rp-mine")', 'nothing saved');
    // the site's marks are understood; the line is saved, marked and in the log
    await js('const i = document.querySelector(".rp-edin"); i.value = "‘N S’ , ,"; i.dispatchEvent(new Event("input", { bubbles: true })); document.getElementById("rp-ednote").value = "From the recording"; document.querySelector(".rp-edsave").click();');
    await until('document.querySelector(".rp-line .rp-mine") && !document.querySelector(".rp-edit")', 'the edited line', 10000);
    await until('document.querySelector(".rp-log") && /1 change by you/.test(document.querySelector(".rp-log summary").textContent)', 'the log of this composition');
    const lit = await js('return document.querySelector(".rp-line").textContent;');
    if (!/Ṇ/.test(lit) || !/Ṡ/.test(lit)) throw new Error('the new swaras are not on the page: ' + lit.slice(0, 60));
    // it is sung as edited
    await click('[data-loop$=":0"]'); await until('document.querySelector(".rp-line.sel .rp-sw i.now")', 'the edited line sung', 20000);
    await click('#rp-tr .play'); await until('!document.querySelector("#rp-tr .play[data-playing]")', 'the loop to stop');
    // a second change, then step back through the log
    await js('document.querySelectorAll(".rp-pen")[1].click();'); await until('document.querySelector(".rp-edit")', 'the second editor');
    await js('const i = document.querySelector(".rp-edin"); i.value = "S R G M"; i.dispatchEvent(new Event("input", { bubbles: true })); document.querySelector(".rp-edsave").click();');
    await until('/2 changes by you/.test(document.querySelector(".rp-log summary").textContent)', 'the second change', 10000);
    await js('document.querySelector(".rp-log").open = true;');
    await until('document.querySelector(".rp-stepnow") && /Change 2 of 2/.test(document.querySelector(".rp-stepnow").textContent)', 'the stepper at the newest');
    await click('#rp-older');
    await until('/Change 1 of 2/.test(document.querySelector(".rp-stepnow").textContent) && document.querySelector(".rp-line.rp-flash")', 'the earlier change, with its line lit');
    // the imported version is one switch away
    await js('Array.from(document.querySelectorAll("#rp-view button")).find(b => /imported/i.test(b.textContent)).click();');
    await until('!document.querySelector(".rp-mine") && document.querySelector(".rp-line .rp-sw i")', 'the imported version');
    await js('Array.from(document.querySelectorAll("#rp-view button")).find(b => /mine|my/i.test(b.textContent)).click();');
    await until('document.querySelectorAll(".rp-mine").length === 2', 'my version again');
    // the page of all changes, its filter and its way back to the line
    await go('#/repertoire/changes');
    await until('document.querySelectorAll("#rc-list .rp-chg").length === 2 && /From the recording/.test(document.getElementById("rc-list").textContent)', 'every change, with its note', 10000);
    await until('/^2 changes$/.test(document.getElementById("rc-count").textContent)', 'the count');
    await js('document.querySelector("#rc-what [data-what=\\"add\\"]").click();'); await until('/No changes match/.test(document.getElementById("rc-count").textContent)', 'the filter');
    await js('document.querySelector("#rc-what [data-what=\\"\\"]").click();'); await until('document.querySelectorAll("#rc-list .rp-chg").length === 2', 'the filter cleared');
    await js('document.querySelectorAll("#rc-list .rp-chg a.btn")[1].click();');
    await until('location.hash.includes("/change/") && document.querySelector(".rp-log[open]") && document.querySelector(".rp-chg.cur") && document.querySelector(".rp-line.rp-flash")', 'the composition at that change', 10000);
    // undo, in the log: a new entry, and the line is as imported again
    await js('document.querySelector(".rp-chg.cur [data-undo]").click();');
    await until('/3 changes by you/.test(document.querySelector(".rp-log summary").textContent) && document.querySelectorAll(".rp-mine").length === 1', 'the undo', 10000);
    const now = await js('return document.querySelector(".rp-line .rp-mine") ? "" : "gone";');
    if (now) throw new Error('the undone line lost its place: ' + was);
  });

  await step('a line off the cycle says so, explains itself, and clears when corrected', async () => {
    await go('#/repertoire/2025-06-abhayambikayai-ashvaroodayai-yadhukula');
    await until('document.querySelector(".rp-off")', 'the tag on the line with an extra swara', 10000);
    const tags = await js('return Array.from(document.querySelectorAll(".rp-off")).map(b => b.textContent);');
    if (tags.join() !== '1 over') throw new Error('expected one tag, "1 over": ' + tags.join());
    await click('.rp-off');
    await until('document.querySelector(".rp-offnote") && /49 units/.test(document.querySelector(".rp-offnote").textContent) && /cell 2/.test(document.querySelector(".rp-offnote").textContent)', 'the note: how long, and where');
    await click('.rp-off'); await until('!document.querySelector(".rp-offnote")', 'the note to close');
    await click('.rp-off'); await until('document.querySelector(".rp-offnote")', 'the note again');
    await click('.rp-offnote button'); await until('document.querySelector(".rp-edit .rp-edin")', 'the editor on that line');
    await until('/1 over whole cycles of 12, first off at cell 2/.test(document.querySelector(".rp-edstat").textContent)', 'the editor saying the same');
    await js('const i = document.querySelectorAll(".rp-edin")[1]; i.value = "P M P D , S\' D P , P D D"; i.dispatchEvent(new Event("input", { bubbles: true }));');
    await until('/48 units: 4 whole cycles/.test(document.querySelector(".rp-edstat").textContent)', 'the editor seeing it fit');
    await js('document.querySelector(".rp-edsave").click();');
    await until('!document.querySelector(".rp-edit") && !document.querySelector(".rp-off") && document.querySelector(".rp-line .rp-mine")', 'the tag gone once corrected', 10000);
    // the imported version still shows it
    await js('Array.from(document.querySelectorAll("#rp-view button")).find(b => /imported/i.test(b.textContent)).click();');
    await until('document.querySelector(".rp-off")', 'the tag in the imported version');
  });

  console.log('learn');
  await step('deep link to a term', async () => { await go('#/learn/teermanam'); await until('document.getElementById("t-teermanam")', 'the teermanam entry'); });

  if (errors.length) throw new Error('Script errors in the page:\n  ' + errors.join('\n  '));
  console.log('End-to-end test passed (' + steps + ' steps)');
} catch (e) {
  console.error('End-to-end test FAILED: ' + e.message);
  try { console.error('On ' + await js('return location.hash + ": " + document.getElementById("main").innerText.slice(0, 600)')); } catch (x) { /* the page is gone */ }
  if (errors.length) console.error('Page errors:\n  ' + errors.join('\n  '));
  process.exitCode = 1;
} finally {
  try { browser.close(); } catch (e) { /* closed */ }
  chrome.kill();
  server.close();
  await sleep(300);
  try { rmSync(profile, { recursive: true, force: true }); } catch (e) { /* Chrome may still hold files */ }
}
