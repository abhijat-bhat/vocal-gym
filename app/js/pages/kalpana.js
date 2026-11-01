/* Kalpana swaras: one improvised round that fills an exact span and lands where you choose. */
import { api } from '../api.js';
import { toggle, pitchedJob, stop } from '../audio.js';
import { esc, $, term, pageHead, stepHead, seg, dial, ragaPicker, talaPicker, talaShort, swaraChips, transport, notation, notationText, legend, checks, explain, errorCard, copy, plural } from '../ui.js';

const S = { raga: 'mela65', tala: { fam: 'triputa', L: 4 }, cycles: 1, per: 2, start: 0, land: 7, ending: 'auto', T: 0.8, seed: 3, rhythm: null, density: 'auto', inspiration: '' };
const PRESETS = [
  { title: 'Traditional', tag: 'Kalyani · Adi · lands on Pa', raga: 'mela65', fam: 'triputa', L: 4, cycles: 1, per: 2, start: 0, land: 7, T: 0, ending: 'auto' },
  { title: 'Adventurous', tag: 'Kalyani · Adi · creativity 2', raga: 'mela65', fam: 'triputa', L: 4, cycles: 1, per: 2, start: 0, land: 7, T: 2, ending: 'free' },
  { title: 'Ending with a mora', tag: 'Mohanam · 2 cycles → upper Sa', raga: 'mohanam', fam: 'triputa', L: 4, cycles: 2, per: 2, start: 7, land: 12, T: 0.4, ending: 'mora' },
  { title: 'Short round', tag: 'Bilahari · Rupaka → Ga', raga: 'bilahari', fam: 'rupaka', L: 4, cycles: 1, per: 2, start: 0, land: 4, T: 1.2, ending: 'free' }
];
const KIND = { conv: 'Familiar device', nov: 'Unusual device', mora: 'Mora ending', step: 'Single step', start: 'Opening swara' };

export async function mount(root, meta) {
  root.innerHTML = '<div class="wrap">' + pageHead({
    eyebrow: 'For singers · improvisation',
    title: 'Kalpana swaras',
    lead: term('kalpana', 'Kalpana swaras') + ' are improvised in a concert, between repetitions of a song line. A round must stay in the raga, fill an exact number of beats, and land so the song can resume on time. Here you can hear model rounds, see how they are built, and turn the creativity dial to explore.',
    steps: [
      ['Pick a raga, a tala and a length', 'Rounds of half a cycle, one cycle or two cycles. Second speed (2 swaras per beat) is the usual choice.'],
      ['Choose where to start and where to land', 'Landing on Pa or on the upper Sa is common. The round is planned backwards so it always arrives.'],
      ['Listen, then generate more', 'Colours show which melodic devices were used. Press New round for another at the same settings.']
    ],
    presets: PRESETS
  }) +
  '<div class="notice rhythm-banner" id="k-rhythm" hidden></div>' +
  '<div class="tool"><aside class="panel" aria-label="Settings">' +
    '<div class="step">' + stepHead(1, 'Raga', 'raga') + '<div id="k-raga"></div></div>' +
    '<div class="step">' + stepHead(2, 'Tala', 'tala') + '<div id="k-tala"></div></div>' +
    '<div class="step">' + stepHead(3, 'Length and speed', 'speed') + '<div class="field"><span class="lab">How long</span><div id="k-len"></div></div><div class="field"><span class="lab">Swaras per beat</span><div id="k-per"></div></div></div>' +
    '<div class="step">' + stepHead(4, 'Start and landing', 'swara') + '<div class="field"><span class="lab">Start on</span><div id="k-start"></div></div><div class="field"><span class="lab">Land on</span><div id="k-land"></div></div><div class="field"><span class="lab">Ending</span><div id="k-ending"></div></div></div>' +
    '<div class="step">' + stepHead(5, 'Creativity', 'creativity') + '<div id="k-dial"></div></div>' +
  '</aside><section class="result" aria-live="polite">' +
    '<div class="card"><div class="card-h"><div><h2 id="k-title">…</h2><div class="card-sub" id="k-sub"></div></div><button class="btn primary" id="k-new">New round</button></div><div id="k-explain"></div></div>' +
    '<div class="card" id="k-main"><div id="k-tr"></div><div class="notation-wrap" id="k-n"></div><div id="k-legend"></div><div class="notation-actions"><button class="btn small" id="k-copy">Copy notation</button></div></div>' +
    '<div class="card" id="k-inside"><h3 class="sec-h">What is inside this round</h3><div id="k-meter"></div></div>' +
    '<div class="card" id="k-ck"><h3 class="sec-h">Why this is correct</h3><div id="k-checks"></div></div>' +
  '</section></div></div>';

  // v0.8.3: a rhythm from the korvai lab (handed over in sessionStorage); kept until Stop following
  try { const h = sessionStorage.getItem('vg-kalpana-rhythm'); if (h) { S.rhythm = JSON.parse(h); S.seed = 3; sessionStorage.removeItem('vg-kalpana-rhythm'); } } catch (e) { /* none */ }
  const lockSteps = () => {
    const on = !!S.rhythm, b = $('#k-rhythm');
    ['#k-tala', '#k-len', '#k-per', '#k-start', '#k-ending'].forEach(id => { const st = $(id).closest('.step'), f = $(id).closest('.field'); (f && id !== '#k-len' && id !== '#k-tala' && id !== '#k-per' ? f : st).hidden = on; });
    b.hidden = !on;
    if (!on) return;
    b.innerHTML = '<b>Singing a rhythm from the korvai lab.</b> ' + esc(S.rhythm.label || S.rhythm.form || 'A korvai') + '. The tala, length, speed and ending come from the lab: choose the raga, the landing swara and the creativity. <span style="display:inline-flex;gap:8px;margin-left:8px"><a class="btn small" href="#/korvai">← Back to the lab</a><button type="button" class="btn small ghost" id="k-rh-stop">Stop following</button></span>' +
      // v0.8.5: how dense the swaras are, and lines from Claude as inspiration
      '<div class="rh-tools"><label>Swaras <select id="k-rh-dens"><option value="auto">breathe: weak pulses held</option><option value="full">one on every syllable</option></select></label>' +
      '<button type="button" class="btn small" id="k-rh-ask">Ask Claude for lines</button><button type="button" class="btn small ghost" id="k-rh-clear" hidden>Back to the engine’s own lines</button><span id="k-rh-status" class="card-sub"></span></div>' +
      '<details class="rh-paste" id="k-rh-paste"><summary>Or use any AI assistant: copy the prompt, paste its answer</summary>' +
      '<p class="card-sub">The prompt describes this rhythm and the raga in full. The answer’s lines are inspiration: each is fitted to the rhythm and the raga and sung only where every rule of the raga still holds.</p>' +
      '<button type="button" class="btn small" id="k-rh-prompt">Show and copy the prompt</button><textarea id="k-rh-ptext" rows="5" readonly hidden aria-label="The prompt"></textarea>' +
      '<textarea id="k-rh-ans" rows="4" placeholder="Paste the JSON answer here" aria-label="The assistant’s answer"></textarea><button type="button" class="btn small" id="k-rh-use">Sing with these lines</button></details>';
    $('#k-rh-stop').onclick = () => { S.rhythm = null; S.inspiration = ''; lockSteps(); run(); };
    $('#k-rh-dens').value = S.density;
    $('#k-rh-dens').onchange = e => { S.density = e.target.value; run(); };
    const status = t => { if ($('#k-rh-status')) $('#k-rh-status').textContent = t; };
    const body = () => ({ raga: S.raga, rhythm: S.rhythm, land: S.land, T: S.T, seed: S.seed, density: S.density });
    $('#k-rh-ask').onclick = async () => {
      const my = ++token, btn = $('#k-rh-ask');
      btn.disabled = true; status('Asking Claude…');
      try {
        const r = await api.kalpanaInspire(body());
        if (my !== token || !$('#k-rh-ask')) return;
        S.inspiration = r.answer || ''; data = r; draw();
        status(r.inspiration ? 'Claude’s lines: ' + r.inspiration.used.length + ' of ' + r.inspiration.suggested + ' phrases sung.' : '');
        $('#k-rh-clear').hidden = !S.inspiration;
      } catch (e) {
        if (!$('#k-rh-ask')) return;
        status(e.message); $('#k-rh-paste').open = true;
      } finally { if ($('#k-rh-ask')) btn.disabled = false; }
    };
    $('#k-rh-clear').onclick = () => { S.inspiration = ''; $('#k-rh-clear').hidden = true; status(''); run(); };
    $('#k-rh-prompt').onclick = async () => {
      try {
        const p = await api.kalpanaPrompt(body()), text = p.system + '\n\n' + p.prompt, box = $('#k-rh-ptext');
        box.value = text; box.hidden = false; box.select();
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => status('Prompt copied.'), () => status('Select the prompt and copy it.'));
      } catch (e) { status(e.message); }
    };
    $('#k-rh-use').onclick = () => { S.inspiration = $('#k-rh-ans').value.trim(); $('#k-rh-clear').hidden = !S.inspiration; status(S.inspiration ? 'Singing with the pasted lines.' : ''); run(); };
  };
  let data = null, token = 0;
  const tr = transport($('#k-tr'), undefined, { voice: true });
  const raga = () => meta.ragas.find(r => r.id === S.raga);
  const tala = () => meta.talas.find(t => t.fam === S.tala.fam && t.L === S.tala.L);
  const aksharas = () => S.cycles === 0.5 ? Math.max(2, Math.floor(tala().total / 2)) : tala().total * S.cycles;

  const drawLen = () => {
    const t = tala(), half = Math.max(2, Math.floor(t.total / 2));
    seg($('#k-len'), [{ v: 0.5, label: 'Half cycle', sub: half + ' beats' }, { v: 1, label: '1 cycle', sub: t.total + ' beats' }, { v: 2, label: '2 cycles', sub: t.total * 2 + ' beats' }], S.cycles, v => { S.cycles = v; run(); }, 'cols-3');
  };
  const drawPer = () => seg($('#k-per'), [{ v: 1, label: '1', sub: 'first speed' }, { v: 2, label: '2', sub: 'second speed' }], S.per, v => { S.per = v; run(); }, 'cols-2');
  const drawSwaras = () => {
    const r = raga(), pcs = r.swaras.map(s => s.pc);
    if (!pcs.includes(S.start)) S.start = 0;
    if (S.land !== 12 && !pcs.includes(S.land)) S.land = pcs.includes(7) ? 7 : 12;
    swaraChips($('#k-start'), r.swaras.map(s => ({ v: s.pc, t: s.short, title: s.name })), S.start, v => { S.start = v; run(); });
    swaraChips($('#k-land'), r.swaras.map(s => ({ v: s.pc, t: s.short, title: s.name })).concat([{ v: 12, t: 'Ṡ', title: 'Sa (upper octave)' }]), S.land, v => { S.land = v; run(); });
  };
  const drawEnding = () => seg($('#k-ending'), [{ v: 'auto', label: 'Auto', sub: 'mora if it fits' }, { v: 'mora', label: 'Mora', sub: 'phrase × 3' }, { v: 'free', label: 'Free', sub: 'no pattern' }], S.ending, v => { S.ending = v; run(); }, 'cols-3');
  // lines suggested for one raga are not carried to another
  const rp = ragaPicker($('#k-raga'), meta.ragas, S.raga, v => { S.raga = v; if (S.inspiration) { S.inspiration = ''; lockSteps(); } drawSwaras(); run(); });
  const tp = talaPicker($('#k-tala'), meta, S.tala, v => { S.tala = v; drawLen(); run(); });
  const drawDial = () => dial($('#k-dial'), S.T, v => { S.T = v; run(); });
  const drawAll = () => { drawLen(); drawPer(); drawSwaras(); drawEnding(); drawDial(); };
  drawAll();
  lockSteps();

  async function run() {
    stop();
    const my = ++token;
    try {
      const r = await api.kalpana(S.rhythm ? { raga: S.raga, rhythm: S.rhythm, land: S.land, T: S.T, seed: S.seed, density: S.density, inspiration: S.inspiration || undefined } : { raga: S.raga, fam: S.tala.fam, L: S.tala.L, aksharas: aksharas(), per: S.per, start: S.start, land: S.land, ending: S.ending, T: S.T, seed: S.seed });
      if (my !== token) return;
      data = r; draw();
    } catch (e) { if (my === token && $('#k-explain')) $('#k-explain').innerHTML = errorCard(e.message); }
  }

  function draw() {
    stop();
    const r = data;
    $('#k-title').textContent = r.raga.name + ' · ' + talaShort(r.tala);
    $('#k-sub').textContent = plural(r.aksharas, 'beat') + ' × ' + r.per + ' per beat · round ' + (r.seed - 2);
    const showResult = !r.impossible;
    ['#k-main', '#k-inside', '#k-ck'].forEach(s => $(s).hidden = !showResult);
    if (!showResult) { $('#k-explain').innerHTML = '<div class="notice" style="margin-top:16px"><b>This round cannot be built.</b> ' + esc(r.message) + '</div>'; return; }
    $('#k-explain').innerHTML = explain(esc(r.summary));

    const slots = [], notes = [], units = [];
    // a rhythm from the lab may start into the cycle: silent cells first
    if (r.lead) { for (let i = 0; i < r.lead; i++) slots.push({ t: '', cls: 'pre' }); notes.push({ p: null, slots: r.lead }); units.push({ kind: 'rest', notes: [{ p: null, dur: r.lead }] }); }
    r.units.forEach(u => {
      units.push(u);
      const cls = u.kind === 'start' ? '' : u.kind;
      const label = (KIND[u.kind] || '') + (u.kind === 'conv' || u.kind === 'nov' ? ': ' + u.name + (u.dir > 0 ? ' (up)' : u.dir < 0 ? ' (down)' : '') : '');
      u.notes.forEach((n, j) => {
        if (n.p == null) { for (let k = 0; k < n.dur; k++) slots.push({ t: ',', cls: 'hold', title: 'karvai' }); notes.push({ p: null, slots: n.dur }); return; }
        slots.push({ t: n.t, cls: cls + (j === 0 && u.kind !== 'start' ? ' first' : ''), title: n.name + ' · ' + label });
        for (let k = 1; k < n.dur; k++) slots.push({ t: ',', cls: 'hold ' + cls, title: 'hold · ' + label });
        notes.push({ p: n.p, slots: n.dur });
      });
    });
    let last = slots.length - 1; while (last > 0 && (slots[last].t === ',' || slots[last].cls === 'pre')) last--;
    slots[last].cls += ' land'; slots[last].title += ' · the landing swara';
    $('#k-n').innerHTML = notation(slots, r.tala, r.per, { rowLabel: i => ({ text: 'cycle ' + (i + 1) }) }) +
      '<p class="card-sub" style="margin:10px 0 0 60px">→ then the song line resumes at the eduppu</p>';
    $('#k-legend').innerHTML = legend([['conv', '', 'familiar device'], ['nov', '', 'unusual device'], ['mora', '', 'mora ending'], ['', '', 'single step'], ['land', '', 'landing swara'], ['now', '', 'playing now']]) +
      '<p class="card-sub" style="margin-top:10px">A thin bar marks where each device starts. Hover any swara to see which device it belongs to.</p>';
    const starts = new Set(r.tala.angas.map(a => a.start));
    const job = pitchedJob($('#k-n'), notes, r.per, r.tala.total, starts, { raga: r.raga.id, units, seed: r.seed });   // sung with the raga's gamaka
    tr.btn.onclick = () => toggle(tr.btn, job);
    $('#k-copy').onclick = () => copy(r.raga.name + ' · ' + r.tala.name + '\n' + notationText(slots, r.tala, r.per), 'Notation copied');

    const c = r.counts, tot = r.slots, pct = x => Math.round(100 * x / tot);
    $('#k-meter').innerHTML = '<p class="card-sub">Share of the ' + tot + ' swaras, by the kind of device that produced them. Higher creativity shifts the balance from teal towards violet.</p>' +
      '<div class="meter" role="img" aria-label="' + pct(c.conv) + '% familiar, ' + pct(c.nov) + '% unusual, ' + pct(c.mora) + '% mora, ' + pct(c.step) + '% single steps">' +
      ['conv', 'nov', 'mora', 'step'].map(k => c[k] ? '<i class="' + k + '" style="width:' + (100 * c[k] / tot) + '%"></i>' : '').join('') + '</div>' +
      '<div class="meter-legend">' + [['conv', 'var(--teal)', 'Familiar'], ['nov', 'var(--violet)', 'Unusual'], ['mora', 'var(--saffron)', 'Mora'], ['step', 'var(--raise-2)', 'Single steps']].map(([k, col, n]) => '<span><i style="background:' + col + '"></i>' + n + ' ' + pct(c[k] || 0) + '%</span>').join('') + '</div>' +
      (r.devices.length ? '<div class="devices">' + r.devices.map(d => '<span>' + esc(d.name) + (d.count > 1 ? ' × ' + d.count : '') + '</span>').join('') + '</div>' : '<p class="card-sub" style="margin-top:10px">No named devices: this round moves in single steps.</p>');
    $('#k-checks').innerHTML = checks(r.checks);
  }

  $('#k-new').onclick = () => { S.seed++; run(); };
  root.querySelectorAll('[data-preset]').forEach(b => b.onclick = () => {
    const p = PRESETS[+b.dataset.preset];
    Object.assign(S, { raga: p.raga, tala: { fam: p.fam, L: p.L }, cycles: p.cycles, per: p.per, start: p.start, land: p.land, T: p.T, ending: p.ending, seed: 3 });
    rp.set(S.raga); tp.set(S.tala); drawAll(); run();
    $('.result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  await run();
  // leaving the page: an answer still on its way is ignored
  return () => { token++; stop(); tr.dispose(); };
}
