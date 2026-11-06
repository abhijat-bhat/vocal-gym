/* Voice Check (v0.11): a 90-second sung probe, measured in this browser. The recording stays on the device; only numbers and the
   short form go to the singer's account. It collects and does not judge: the personal model that will read this history comes in a
   later phase (web/research-plan), and nothing here is a diagnosis. */
import { api } from '../api.js';
import { PROBE, PROBE_SECONDS, SARALI_1, FORM, FORM_SCALE, measureStep, summariseProbe, baseline } from '/engine/voice-check.js';
import { droneFor, cueNote, clickSoon, saHz, audioNow, stop as stopAudio } from '../audio.js';
import { pageHead, esc, $, toast } from '../ui.js';
import { getUser, localDate, refreshUser, userKnown } from '../session.js';

const CONSENT = 1;
const SPEED = () => { try { return Math.max(0.02, Number(localStorage.getItem('vg-vc-fast')) || 1); } catch (e) { return 1; } };
const wait = ms => new Promise(r => setTimeout(r, ms * SPEED()));

/* ---- the recordings, kept only here, only if asked ---- */
const DB = 'vg-voice';
const openStore = () => new Promise((res, rej) => { const q = indexedDB.open(DB, 1); q.onupgradeneeded = () => q.result.createObjectStore('takes', { keyPath: 'key' }); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
async function keepTake(date, step, blob) { const d = await openStore(); await new Promise((res, rej) => { const t = d.transaction('takes', 'readwrite'); t.objectStore('takes').put({ key: date + '/' + step, date, step, blob, type: blob.type }); t.oncomplete = res; t.onerror = () => rej(t.error); }); d.close(); }
async function takesCount() { try { const d = await openStore(), n = await new Promise(res => { const q = d.transaction('takes').objectStore('takes').count(); q.onsuccess = () => res(q.result); q.onerror = () => res(0); }); d.close(); return n; } catch (e) { return 0; } }
async function dropTakes() { const d = await openStore(); await new Promise(res => { const t = d.transaction('takes', 'readwrite'); t.objectStore('takes').clear(); t.oncomplete = res; t.onerror = res; }); d.close(); }

const SAFETY = 'Voice Check is for keeping track, not a medical test, and it cannot tell you what is wrong. If hoarseness lasts beyond about four weeks, or you have pain or lose your voice, please see an ENT doctor or a speech-language pathologist.';
const METRICS = [
  ['stabilityCents', 'Steadiness on Sa', 'cents', 'How far the pitch moved while holding “aa”. Lower is steadier.'],
  ['offCents', 'Distance from Sa', 'cents', 'How far the held “aa” sat from the drone’s Sa.'],
  ['hnr', 'Harmonics to noise', 'dB', 'How much of the sound is tone rather than breath. Higher is clearer.'],
  ['cpp', 'Cepstral peak', 'dB', 'Another measure of how periodic the voice is. Higher is clearer.'],
  ['tilt', 'Spectral tilt', 'dB per octave', 'How quickly the upper partials fall away.'],
  ['softOnsetSec', 'Soft start on upper Pa', 's', 'How long a soft note took to settle.'],
  ['rangeSemis', 'Range in the siren', 'semitones', 'From your lowest to your highest note today.'],
  ['swellDb', 'Swell in the messa di voce', 'dB', 'From your softest to your loudest on one breath.'],
  ['driftCents', 'Pitch drift while swelling', 'cents', 'How far Sa moved as the voice grew and faded.'],
  ['saraliOffCents', 'Sarali, away from the swaras', 'cents', 'The average distance from each swara of the first sarali.']
];
const show = v => (v == null ? '–' : String(v));

export async function mount(root) {
  if (!userKnown()) await refreshUser();
  let alive = true, stream = null, stopDrone = () => {}, meterRaf = 0, abort = false;
  const release = () => { abort = true; cancelAnimationFrame(meterRaf); stopDrone(); stopDrone = () => {}; if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; stopAudio(); };
  const wrap = inner => { root.innerHTML = '<div class="wrap vc">' + pageHead({ title: 'Voice Check', lead: 'A daily 90-second check of your voice, sung to the drone. It records how you sound today so that you can compare yourself with yourself.' }) + inner + '</div>'; };

  /* ---- first: what this is, what it keeps, and a clear yes ---- */
  async function intro() {
    let history = [];
    if (getUser()) { try { history = (await api.voice.list()).checks; } catch (e) { /* the page still works */ } }
    if (!alive) return;
    const today = history.find(h => h.localDate === localDate());
    wrap('<section class="slab-card vc-consent"><h2>' + (today ? 'You have checked your voice today' : 'Before you start') + '</h2>' +
      '<ul class="vc-keeps"><li><b>On this device:</b> the microphone is used only during the check, and the sound is measured here in your browser. The recording is never uploaded.</li>' +
      '<li><b>' + (getUser() ? 'In your account' : 'If you sign in') + ':</b> the numbers, your answers and the date, so you can see them over time. You can delete them whenever you like.</li>' +
      '<li><b>What it does not do:</b> Vocal Gym keeps this history but does not judge your voice yet, and it does not listen while you practise.</li>' +
      '<li><b>If you are under 18:</b> please ask a parent or guardian before you agree.</li></ul>' +
      '<p class="muted">' + esc(SAFETY) + '</p>' +
      '<label class="acct-check"><input type="checkbox" id="vc-agree"> I understand, and I agree to Voice Check using my microphone and keeping these numbers.</label>' +
      '<label class="acct-check"><input type="checkbox" id="vc-keep"> Also keep the recordings on this device, for later use. They stay here until I delete them.</label>' +
      '<p class="hint">Use earphones if you can, so the drone stays out of the recording. Find a quiet place. It takes about ' + Math.round(PROBE_SECONDS * 1.6 / 10) * 10 + ' seconds with the pauses.</p>' +
      '<p class="pr-err" id="vc-err" role="alert"></p><div class="pr-row"><button class="btn primary big" id="vc-start">' + (today ? 'Check again' : 'Start the check') + '</button></div></section>' +
      historyHtml(history));
    bindHistory(history);
    $('#vc-start', root).onclick = async () => {
      const err = $('#vc-err', root); err.textContent = '';
      if (!$('#vc-agree', root).checked) { err.textContent = 'Tick the box to agree first. Nothing has been recorded.'; return; }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) { err.textContent = 'This browser cannot record from the microphone. Try a current Chrome, Edge, Firefox or Safari, over https or on localhost.'; return; }
      const keep = $('#vc-keep', root).checked;
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); }
      catch (e) { err.textContent = e.name === 'NotAllowedError' ? 'The browser was not allowed to use the microphone. Allow it in the address bar and try again.' : 'No microphone could be opened: ' + e.message; return; }
      if (alive) run(keep); else release();
    };
  }

  /* ---- the probe: step by step, with the drone ---- */
  async function run(keep) {
    abort = false;
    const results = [], date = localDate(), sa = saHz();
    wrap('<section class="vc-stage" aria-live="polite"><p class="vc-count" id="vc-step"></p><h2 id="vc-title"></h2><p class="vc-tell" id="vc-tell"></p><div class="vc-clock" id="vc-clock" aria-hidden="true"></div><div class="vc-meter" aria-hidden="true"><i id="vc-level"></i></div><p class="hint" id="vc-note"></p><div class="pr-row" id="vc-acts"><button class="btn" id="vc-cancel">Stop the check</button></div></section>');
    $('#vc-cancel', root).onclick = () => { release(); if (alive) intro(); };
    // the level, so a singer can see the microphone hears them
    const { ctx: ac } = audioNow(), src = ac.createMediaStreamSource(stream), an = ac.createAnalyser(); an.fftSize = 1024; src.connect(an);
    const buf = new Float32Array(an.fftSize), bar = $('#vc-level', root);
    const meter = () => { if (abort || !alive) return; an.getFloatTimeDomainData(buf); let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i]; const level = Math.min(1, Math.sqrt(s / buf.length) * 5); if (bar) bar.style.transform = 'scaleX(' + level.toFixed(3) + ')'; meterRaf = requestAnimationFrame(meter); };
    meter();
    stopDrone = droneFor(PROBE_SECONDS * 2.5 * SPEED());
    for (let i = 0; i < PROBE.length && !abort; i++) {
      const step = PROBE[i];
      let got = await take(step, i, sa, date, keep);
      if (abort) return;
      results.push(got);
    }
    stopDrone(); stopDrone = () => {};
    cancelAnimationFrame(meterRaf);
    stream.getTracks().forEach(t => t.stop()); stream = null;
    if (alive) form(results);
  }
  async function take(step, i, sa, date, keep) {
    $('#vc-step', root).textContent = 'Step ' + (i + 1) + ' of ' + PROBE.length;
    $('#vc-title', root).textContent = step.title;
    $('#vc-tell', root).textContent = step.tells;
    const clock = $('#vc-clock', root), note = $('#vc-note', root); note.textContent = '';
    clock.textContent = step.sing === false ? 'Quiet…' : 'Get ready…';
    if (step.cue != null) cueNote(step.cue, 1.2 * SPEED());
    await wait(step.sing === false ? 1500 : 3000);
    if (abort) return null;
    const chunks = [], rec = new MediaRecorder(stream);
    rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    const stopped = new Promise(r => { rec.onstop = r; });
    rec.start();
    if (step.beats) { const beat = step.seconds / step.beats * SPEED(); for (let b = 0; b < step.beats; b++) clickSoon(b * beat, b % 8 === 0); }
    const total = step.seconds * SPEED(), began = performance.now();
    await new Promise(res => { const tick = () => { if (abort) return res(); const left = total - (performance.now() - began) / 1000; if (left <= 0) return res(); const el = $('#vc-clock', root); if (el) el.textContent = step.beats ? 'Swara ' + Math.min(step.beats, Math.floor((step.seconds - left / SPEED()) / (step.seconds / step.beats)) + 1) + ' of ' + step.beats : Math.ceil(left / SPEED()) + ' s'; setTimeout(tick, 100); }; tick(); });
    rec.stop();
    await stopped;
    if (abort) return null;
    clock.textContent = 'Measuring…';
    const blob = new Blob(chunks, { type: rec.mimeType });
    if (keep) { try { await keepTake(date, step.id, blob); } catch (e) { note.textContent = 'The recording could not be kept on this device.'; } }
    try {
      const { ctx: ac } = audioNow(), audio = await ac.decodeAudioData(await blob.arrayBuffer());
      return measureStep(step.id, audio.getChannelData(0), audio.sampleRate, sa);
    } catch (e) { return { id: step.id, heard: false, voicedSec: 0, failed: true }; }
  }

  /* ---- the short form: how it felt ---- */
  function form(results) {
    const features = summariseProbe(results), missed = results.filter(r => !r.heard).map(r => PROBE.find(p => p.id === r.id).title);
    wrap('<form class="slab-card vc-form" id="vc-form" novalidate><h2>A few questions</h2>' +
      (features.stepsHeard ? (missed.length ? '<p class="notice">Not heard clearly: ' + esc(missed.join(', ')) + '. The rest is kept, and those are left empty.</p>' : '') : '<p class="notice">No singing was heard, so there is nothing to measure. Check that the right microphone is chosen, and try again.</p>') +
      '<p class="hint">Thinking of the last day. These three are drawn from the Voice Fatigue Index and shortened for daily use; the short form has not been validated yet.</p>' +
      FORM.map(q => '<fieldset class="vc-q"><legend>' + esc(q.text) + '</legend><div class="seg" role="group">' + FORM_SCALE.map((w, i) => '<button type="button" data-q="' + q.id + '" data-v="' + i + '" aria-pressed="false">' + esc(w) + '</button>').join('') + '</div></fieldset>').join('') +
      '<div class="field"><label class="lab" for="vc-effort">How much effort did this check take? <span id="vc-effort-v">–</span> of 10</label><input type="range" id="vc-effort" min="0" max="10" step="1" value="3"></div>' +
      '<div class="vc-two"><div class="field"><label class="lab" for="vc-awake">Hours awake</label><input type="number" id="vc-awake" min="0" max="48" step="0.5"></div><div class="field"><label class="lab" for="vc-slept">Hours slept</label><input type="number" id="vc-slept" min="0" max="24" step="0.5"></div></div>' +
      '<label class="acct-check"><input type="checkbox" id="vc-unwell"> I have a cold or am unwell today</label>' +
      '<label class="acct-check"><input type="checkbox" id="vc-pain"> It hurts to sing or speak</label>' +
      '<label class="acct-check"><input type="checkbox" id="vc-lost"> I have lost my voice, or it keeps cutting out</label>' +
      '<label class="acct-check"><input type="checkbox" id="vc-hoarse"> I have been hoarse for about four weeks or more</label>' +
      '<p class="pr-err" id="vc-ferr" role="alert"></p><div class="pr-row"><button class="btn primary" type="submit" id="vc-save"' + (features.stepsHeard ? '' : ' disabled') + '>' + (getUser() ? 'Save today’s check' : 'See today’s check') + '</button><button class="btn ghost" type="button" id="vc-again">Do it again</button></div></form>');
    const answers = {};
    root.querySelectorAll('[data-q]').forEach(b => { b.onclick = () => { answers[b.dataset.q] = +b.dataset.v; root.querySelectorAll('[data-q="' + b.dataset.q + '"]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); }; });
    const ev = $('#vc-effort', root), evv = $('#vc-effort-v', root); evv.textContent = ev.value; ev.oninput = () => { evv.textContent = ev.value; };
    $('#vc-again', root).onclick = () => intro();
    $('#vc-form', root).onsubmit = async e => {
      e.preventDefault();
      const n = id => { const v = $(id, root).value; return v === '' ? null : +v; };
      const body = { localDate: localDate(), consent: CONSENT, features,
        form: { tired: answers.tired, effort: answers.effort, recover: answers.recover, effortRating: +ev.value, pain: $('#vc-pain', root).checked, lostVoice: $('#vc-lost', root).checked, hoarseWeeks: $('#vc-hoarse', root).checked },
        context: { hoursAwake: n('#vc-awake'), hoursSlept: n('#vc-slept'), unwell: $('#vc-unwell', root).checked, device: /Mobi/i.test(navigator.userAgent) ? 'phone' : 'computer' } };
      let history = [{ localDate: body.localDate, features, form: body.form, context: body.context, unsaved: !getUser() }];
      if (getUser()) { try { history = (await api.voice.save(body)).checks; toast('Saved.'); } catch (x) { $('#vc-ferr', root).textContent = x.message; return; } }
      results_(history, body.form, !getUser());
    };
  }

  /* ---- what was measured, beside the singer's own usual ---- */
  function results_(history, f, unsaved) {
    const refer = f && (f.pain || f.lostVoice || f.hoarseWeeks), today = history[0];
    const past = history.filter(h => h.localDate !== today.localDate);
    wrap((refer ? '<div class="notice vc-refer" role="alert"><b>Please have this looked at.</b> Pain, a lost voice or hoarseness lasting about four weeks is worth showing to an ENT doctor or a speech-language pathologist. Rest your voice until then if it hurts.</div>' : '') +
      '<section class="vc-today"><h2>Today</h2><p class="muted">Compare these only with your own days, on the same microphone. ' + (past.length + 1 >= 7 ? 'Your usual is the middle of your past days.' : 'Your usual appears after seven days of checks.') + '</p>' +
      '<table class="vc-table"><thead><tr><th>Measure</th><th>Today</th><th>Your usual</th><th>What it is</th></tr></thead><tbody>' +
      METRICS.map(([k, name, unit, what]) => '<tr><td>' + esc(name) + '</td><td>' + show(today.features[k]) + ' <span class="muted">' + (today.features[k] == null ? '' : esc(unit)) + '</span></td><td>' + show(baseline(past, k)) + '</td><td class="muted">' + esc(what) + '</td></tr>').join('') +
      '</tbody></table>' + (unsaved ? '<p class="notice">This was not saved. <a href="#/account">Sign in</a> to keep a history; then take the check again.</p>' : '') + '<p class="muted">' + esc(SAFETY) + '</p><div class="pr-row"><a class="btn" href="#/practice">On to practice</a></div></section>' + (unsaved ? '' : historyHtml(history)));
    bindHistory(history);
  }

  function historyHtml(history) {
    if (!history.length) return '';
    const J = esc(JSON.stringify(history));
    return '<section class="vc-history"><h2>Your days</h2><table class="vc-table"><thead><tr><th>Date</th><th>Steadiness</th><th>Harmonics to noise</th><th>Range</th><th>Effort</th><th><span class="sr-only">Delete</span></th></tr></thead><tbody>' +
      history.slice(0, 30).map(h => '<tr><td>' + esc(h.localDate) + '</td><td>' + show(h.features.stabilityCents) + '</td><td>' + show(h.features.hnr) + '</td><td>' + show(h.features.rangeSemis) + '</td><td>' + show(h.form && h.form.effortRating) + '</td><td>' + (h.id ? '<button type="button" class="btn small ghost" data-del="' + h.id + '">Delete</button>' : '') + '</td></tr>').join('') +
      '</tbody></table><div class="pr-row"><a class="btn small" id="vc-export" download="voice-check.json" href="data:application/json;charset=utf-8,' + encodeURIComponent(J.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'")) + '">Download my numbers</a><button type="button" class="btn small ghost" id="vc-wipe">Delete all my Voice Check data</button></div><p class="hint" id="vc-takes"></p></section>';
  }
  function bindHistory(history) {
    root.querySelectorAll('[data-del]').forEach(b => { b.onclick = async () => { try { await api.voice.remove(+b.dataset.del); toast('Deleted.'); intro(); } catch (x) { toast(x.message); } }; });
    const wipe = $('#vc-wipe', root);
    if (wipe) wipe.onclick = async () => {
      if (wipe.dataset.sure !== '1') { wipe.dataset.sure = '1'; wipe.textContent = 'Press again to delete everything'; return; }
      try { await api.voice.removeAll(); await dropTakes(); toast('Your Voice Check data is deleted.'); intro(); } catch (x) { toast(x.message); }
    };
    const t = $('#vc-takes', root);
    if (t) takesCount().then(n => { if (t.isConnected && n) t.textContent = n + ' recorded step' + (n === 1 ? ' is' : 's are') + ' kept on this device.'; });
    if (!history.length) takesCount().then(async n => { if (!n || !alive) return; const box = root.querySelector('.vc-consent'); if (box) { const p = document.createElement('p'); p.className = 'hint'; p.innerHTML = n + ' recorded steps are kept on this device. <button type="button" class="btn small ghost" id="vc-droptakes">Delete them</button>'; box.appendChild(p); $('#vc-droptakes', root).onclick = async () => { await dropTakes(); p.remove(); toast('Deleted from this device.'); }; } });
  }

  intro();
  return () => { alive = false; release(); };
}
void SARALI_1;
