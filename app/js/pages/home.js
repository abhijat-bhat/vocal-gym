/* Home: what Vocal Gym is, a live sample, the three tools, and what is and is not built yet. */
import { api } from '../api.js';
import { toggle, pitchedJob, stop, initPlayButton } from '../audio.js';
import { esc, term, notation, $ } from '../ui.js';

const bars = hs => hs.map(h => '<i style="height:' + h + '%"></i>').join('');

export async function mount(root) {
  root.innerHTML = '<div class="wrap">' +
    '<section class="hero">' +
      '<div>' +
        '<span class="eyebrow"><span class="dot"></span>Carnatic practice, for singers and dancers</span>' +
        '<h1 style="margin-top:10px">Practise with exercises that <em>never break the rules</em>.</h1>' +
        '<p class="lead">Vocal Gym writes fresh practice material in any ' + term('raga') + ' and any ' + term('tala') + ': warm-up patterns, improvised ' + term('kalpana', 'kalpana swara') + ' rounds, and the arithmetic of ' + term('korvai', 'korvais') + ' and tihais. Every note is checked against the raga’s rules and every phrase adds up to the beat. Listen, sing along, and ask for a new one whenever you like.</p>' +
        '<div class="hero-ctas"><a class="btn primary big" href="#/alankara">Start with an alankara</a><a class="btn big ghost" href="#/learn">New to Carnatic music?</a></div>' +
      '</div>' +
      '<div class="hero-demo" id="hd"><div class="hd-top"><div><b>Try it: press Play</b><div class="card-sub">The first alankara in Adi tala, Mayamalavagowla</div></div><button class="btn primary play" id="hd-play"></button></div><div class="notation-wrap" id="hd-n"><p class="muted">Loading a sample…</p></div><p class="card-sub" style="margin-top:10px">Each box is one section of the tala; the saffron outline is beat 1. The lit cell follows the music.</p></div>' +
    '</section>' +

    '<section class="section"><h2>Three things you can do today</h2><p class="lead">Each tool is a page with a few clear choices, a result you can hear, and a plain explanation of what you are looking at.</p><div class="features">' +
      '<article class="feature f-ala"><div class="art">' + bars([20, 35, 50, 65, 50, 35, 50, 65, 80, 65, 50, 65, 80, 95]) + '</div><span class="who">For singers · warm-up</span><h3>Alankaras</h3><p>The classic exercise patterns, in all 35 talas and 86 ragas. Start from the traditional pattern, then ask for new ones you have never sung.</p><ul><li>Pick a raga and a tala</li><li>Hear it with a drone and beat clicks</li><li>Get endless new patterns, from traditional to adventurous</li></ul><a class="btn primary" href="#/alankara">Open alankaras</a></article>' +
      '<article class="feature f-kal"><div class="art">' + bars([40, 55, 70, 55, 85, 30, 60, 75, 45, 90, 65, 50, 50, 50]) + '</div><span class="who">For singers · improvisation</span><h3>Kalpana swaras</h3><p>Model improvisations that fit the beat exactly and land where you choose. Turn the creativity dial to hear how a round changes.</p><ul><li>Choose where to start and where to land</li><li>See which melodic devices were used</li><li>End with a mora, or freely</li></ul><a class="btn primary" href="#/kalpana">Open kalpana swaras</a></article>' +
      '<article class="feature f-jat"><div class="art">' + bars([50, 50, 50, 50, 70, 60, 50, 95, 20, 95, 20, 95]) + '</div><span class="who">For singers, dancers and drummers</span><h3>Korvai &amp; tihai lab</h3><p>Learn how moras, tihais and korvais are counted to land on sam, in any of the 35 talas, then build your own and see every way it can be done.</p><ul><li>Learn: nine short lessons, live for your tala</li><li>Build: any form, span, start and eduppu</li><li>Check: the judge reads it and scores the craft</li></ul><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:auto"><a class="btn primary" href="#/korvai">Open the lab</a><a class="btn" href="#/judge">Judge</a></div></article>' +
    '</div></section>' +

    '<section class="section"><h2>How a practice session goes</h2><div class="flow" style="margin-top:18px">' +
      '<div><b>Pick a raga and tala</b><span>Use a quick-start preset, or choose your own from 86 ragas and 38 talas.</span></div>' +
      '<div><b>Set the creativity</b><span>Low is traditional and recognisable. High is unusual but still correct.</span></div>' +
      '<div><b>Listen and read</b><span>Press Play. A drone holds Sa, clicks keep the tala, and the notation lights up as it plays.</span></div>' +
      '<div><b>Sing, then ask for more</b><span>Loop it until it sits, then generate a new one. Nothing repeats.</span></div>' +
    '</div></section>' +

    '<section class="section split">' +
      '<div class="card"><h3>Working now</h3><ul class="list-ok"><li>Alankaras in all 35 talas, with new patterns that never repeat</li><li>Kalpana swara rounds that land exactly, with a creativity dial</li><li>A korvai and tihai lab: lessons and a builder for all 35 talas, any gati and eduppu</li><li>A jathi judge with exact fixes and a craft score</li><li>Playback with drone, tala clicks and a moving cursor</li></ul></div>' +
      '<div class="card"><h3>Coming next</h3><ul class="list-soon"><li>Listening to your voice through the microphone</li><li>Pitch tracking, and spotting where you leave the raga</li><li>A daily voice check and a personal warm-up plan</li><li>A kalpana tutor that responds to what you sing</li><li>Practice logs, timers and streaks</li></ul><p class="muted" style="font-size:.88rem;margin-top:12px">These are designed in the research plan but not built yet. Today, Vocal Gym plays to you; it does not listen.</p></div>' +
    '</section>' +
  '</div>';

  try {
    const r = await api.alankara({ raga: 'mela15', fam: 'triputa', L: 4 });
    const lines = r.lines.slice(0, 3);
    const slots = [], notes = [];
    lines.forEach(l => l.notes.forEach(n => { slots.push({ t: n.t, title: n.name }); for (let i = 1; i < n.dur; i++) slots.push({ t: ',', cls: 'hold' }); notes.push({ p: n.p, slots: n.dur }); }));
    $('#hd-n').innerHTML = notation(slots, r.tala, 1, { rowLabel: i => ({ text: '↑ ' + (i + 1), cls: 'up' }) });
    const btn = $('#hd-play'); initPlayButton(btn);
    const starts = new Set(r.tala.angas.map(a => a.start));
    const job = pitchedJob($('#hd-n'), notes, 1, r.tala.total, starts, { raga: r.raga.id });
    btn.onclick = () => toggle(btn, job);
  } catch (e) {
    $('#hd-n').innerHTML = '<p class="muted">' + esc(e.message) + '</p>';
  }
  return () => stop();
}
