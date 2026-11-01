/* Alankaras: the sheet pattern for a tala, carried through any raga, plus new patterns on demand. */
import { api } from '../api.js';
import { toggle, pitchedJob, stop } from '../audio.js';
import { esc, $, term, q, pageHead, stepHead, seg, dial, ragaPicker, talaPicker, talaShort, transport, notation, notationText, legend, checks, explain, errorCard, copy, toast } from '../ui.js';

const S = {
  raga: 'mela15', tala: { fam: 'triputa', L: 4 }, speed: 1, T: 0.8, span: null, numbers: false,
  hist: {}, idx: {}, seed: 1
};
const PRESETS = [
  { title: 'First lesson', tag: 'Mayamalavagowla · Chatusra Dhruva', raga: 'mela15', fam: 'dhruva', L: 4 },
  { title: 'Seven-beat cycle', tag: 'Mayamalavagowla · Misra Jhampa', raga: 'mela15', fam: 'jhampa', L: 7 },
  { title: 'A five-note raga', tag: 'Mohanam · Khanda Ata', raga: 'mohanam', fam: 'ata', L: 5 },
  { title: 'Long cycle', tag: 'Shankarabharanam · Sankeerna Dhruva', raga: 'mela29', fam: 'dhruva', L: 9 },
  { title: 'Something new', tag: 'Kalyani · Adi · adventurous', raga: 'mela65', fam: 'triputa', L: 4, T: 1.6, fresh: true }
];
const key = () => S.raga + '|' + S.tala.fam + S.tala.L;

export async function mount(root, meta) {
  root.innerHTML = '<div class="wrap">' + pageHead({
    eyebrow: 'For singers · warm-up',
    title: 'Alankaras',
    lead: 'An ' + term('alankara') + ' is a short pattern sung from each swara of the raga in turn, up to the upper Sa and back down. Start from the traditional pattern for your tala, then ask for new ones: each is different from everything you have already seen, and each obeys the raga.',
    steps: [
      ['Choose a raga and a tala', 'The pattern is fitted to both. If the raga skips notes or zig-zags, the engine adjusts the pattern so it stays correct.'],
      ['Press Play and read along', 'The lit cell follows the music. A drone holds Sa and clicks mark the beats; the loud click is the start of a section.'],
      ['Ask for a new pattern', 'Set the creativity dial, press New pattern, and step back and forth through everything you have generated.']
    ],
    presets: PRESETS
  }) +
  '<div class="tool"><aside class="panel" aria-label="Settings">' +
    '<div class="step">' + stepHead(1, 'Raga', 'raga') + '<div id="a-raga"></div></div>' +
    '<div class="step">' + stepHead(2, 'Tala', 'tala') + '<div id="a-tala"></div></div>' +
    '<div class="step">' + stepHead(3, 'Speed', 'speed') + '<div id="a-speed"></div><div class="field"><label class="toggle"><input type="checkbox" id="a-num"> Show which variant of each swara (R₁, G₃ …)</label></div></div>' +
    '<div class="step">' + stepHead(4, 'New patterns', 'creativity') + '<div class="field"><span class="lab">Creativity</span><div id="a-dial"></div></div><div class="field"><span class="lab">Span</span><span class="hint">How many different swaras one pattern climbs through.</span><div id="a-span"></div></div></div>' +
  '</aside><section class="result" aria-live="polite">' +
    '<div class="card"><div class="card-h"><div><h2 id="a-title">…</h2><div class="card-sub" id="a-sub"></div></div><span id="a-badge"></span></div>' +
      '<div id="a-explain"></div>' +
      '<div class="varnav"><button class="btn small" id="a-prev">← Previous</button><span class="count" id="a-count"></span><button class="btn small" id="a-next">Next →</button><span class="spacer"></span><button class="btn small ghost" id="a-sheet">Back to the sheet pattern</button><button class="btn primary" id="a-new">New pattern</button></div>' +
    '</div>' +
    '<div class="card"><div id="a-tr"></div><div class="notation-wrap" id="a-n"></div><div id="a-legend"></div><div class="notation-actions"><button class="btn small" id="a-copy">Copy notation</button></div></div>' +
    '<div class="card"><h3 class="sec-h">Why this is correct</h3><div id="a-checks"></div></div>' +
  '</section></div></div>';

  let data = null, token = 0;
  const tr = transport($('#a-tr'), undefined, { voice: true });
  const rp = ragaPicker($('#a-raga'), meta.ragas, S.raga, v => { S.raga = v; show(); });
  const tp = talaPicker($('#a-tala'), meta, S.tala, v => { S.tala = v; S.span = null; show(); });
  const drawSpeed = () => seg($('#a-speed'), [{ v: 1, label: '1st', sub: '1 per beat' }, { v: 2, label: '2nd', sub: '2 per beat' }, { v: 4, label: '3rd', sub: '4 per beat' }], S.speed, v => { S.speed = v; draw(); });
  drawSpeed();
  $('#a-num').checked = S.numbers;
  $('#a-num').onchange = e => { S.numbers = e.target.checked; draw(); };
  dial($('#a-dial'), S.T, v => { S.T = v; });
  const drawSpan = def => seg($('#a-span'), [3, 4, 5, 6, 7].map(n => ({ v: n, label: String(n), sub: n === def ? 'as sheet' : '' })), S.span || def, v => { S.span = v; });

  const hist = () => {
    const k = key();
    if (!S.hist[k]) { S.hist[k] = [{ source: 'sheet' }]; S.idx[k] = 0; }
    return { k, h: S.hist[k], i: S.idx[k] };
  };

  async function show() {
    stop();
    const H = hist(), item = H.h[H.i], my = ++token;
    try {
      const body = { raga: S.raga, fam: S.tala.fam, L: S.tala.L };
      if (item.motif) { body.motif = item.motif; body.source = item.source; body.generated = item.generated; }
      const r = await api.alankara(body);
      if (my !== token) return;
      data = r; draw();
    } catch (e) { if (my === token) $('#a-explain').innerHTML = errorCard(e.message); }
  }
  async function generate() {
    const H = hist(), my = ++token;
    $('#a-new').disabled = true;
    try {
      const r = await api.alankara({ raga: S.raga, fam: S.tala.fam, L: S.tala.L, generate: { T: S.T, span: S.span || undefined, seed: S.seed++, avoid: H.h.filter(x => x.motif).map(x => x.motif) } });
      if (my !== token) return;
      if (r.exhausted) { toast('No more new patterns with this span'); $('#a-explain').innerHTML = explain(esc(r.message)); return; }
      H.h.push({ source: 'new', motif: r.motif, generated: r.generated });
      S.idx[H.k] = H.h.length - 1;
      data = r; stop(); draw();
    } catch (e) { $('#a-explain').innerHTML = errorCard(e.message); }
    finally { $('#a-new').disabled = false; }
  }

  function draw() {
    if (!data) return;
    stop();
    const r = data, H = hist(), per = S.speed;
    $('#a-title').textContent = r.raga.name + ' · ' + talaShort(r.tala);
    $('#a-sub').innerHTML = esc(r.tala.total + ' beats per cycle · ') + r.lines.length + ' lines: ' + r.up + ' going up, ' + r.down + ' coming down';
    $('#a-badge').innerHTML = r.source === 'sheet' ? '<span class="badge sheet">Sheet pattern ' + esc(r.sheet.ref) + '</span>' : '<span class="badge new">New pattern ' + H.i + '</span>';
    $('#a-explain').innerHTML = explain(esc(r.summary));
    $('#a-count').textContent = H.i === 0 ? 'Sheet pattern' + (H.h.length > 1 ? ' · ' + (H.h.length - 1) + ' new' : '') : 'New pattern ' + H.i + ' of ' + (H.h.length - 1);
    $('#a-prev').disabled = H.i === 0; $('#a-next').disabled = H.i >= H.h.length - 1; $('#a-sheet').disabled = H.i === 0;
    drawSpan(r.defaultSpan);

    const slots = [], notes = [], rowFirstLine = [];
    r.lines.forEach((l, li) => {
      l.notes.forEach(n => {
        slots.push({ t: S.numbers ? n.tn : n.t, cls: n.adjusted ? 'adj' : '', title: n.name + (n.adjusted ? ' · adjusted to fit the raga' : '') });
        for (let i = 1; i < n.dur; i++) slots.push({ t: ',', cls: 'hold', title: 'hold ' + n.name });
        notes.push({ p: n.p, slots: n.dur });
      });
    });
    const label = i => {
      const a = i * per, b = Math.min(r.lines.length, a + per) - 1, l = r.lines[a];
      if (!l) return { text: '' };
      const num = j => (r.lines[j].dir === 'asc' ? j : j - r.up) + 1;
      return { text: (l.dir === 'asc' ? '↑ ' : '↓ ') + (a === b ? num(a) : num(a) + '–' + num(b)), cls: l.dir === 'asc' ? 'up' : 'down' };
    };
    $('#a-n').innerHTML = notation(slots, r.tala, per, { rowLabel: label });
    $('#a-legend').innerHTML = legend([['sam', '', 'beat 1 of the cycle (sam)'], ['', ',', 'hold the previous swara'], ['adj', 'G', 'adjusted to fit the raga'], ['now', '', 'playing now']]) +
      '<p class="card-sub" style="margin-top:10px">↑ rows climb, each starting one swara higher; ↓ rows descend. Hover a swara to see its full name. In the ruler: ● clap, ○ wave, • finger count. ' + q('kriya') + '</p>';
    const starts = new Set(r.tala.angas.map(a => a.start));
    const job = pitchedJob($('#a-n'), notes, per, r.tala.total, starts, { raga: r.raga.id });   // sung with the raga's gamaka
    tr.btn.onclick = () => toggle(tr.btn, job);
    $('#a-copy').onclick = () => copy(r.raga.name + ' · ' + r.tala.name + '\n' + notationText(slots, r.tala, per), 'Notation copied');
    $('#a-checks').innerHTML = checks(r.checks);
  }

  $('#a-prev').onclick = () => { const H = hist(); S.idx[H.k] = Math.max(0, H.i - 1); show(); };
  $('#a-next').onclick = () => { const H = hist(); S.idx[H.k] = Math.min(H.h.length - 1, H.i + 1); show(); };
  $('#a-sheet').onclick = () => { const H = hist(); S.idx[H.k] = 0; show(); };
  $('#a-new').onclick = generate;
  root.querySelectorAll('[data-preset]').forEach(b => b.onclick = () => {
    const p = PRESETS[+b.dataset.preset];
    S.raga = p.raga; S.tala = { fam: p.fam, L: p.L }; S.span = null;
    rp.set(p.raga); tp.set(S.tala);
    if (p.T !== undefined) { S.T = p.T; dial($('#a-dial'), S.T, v => { S.T = v; }); }
    if (p.fresh) generate(); else { const H = hist(); S.idx[H.k] = 0; show(); }
    $('.result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  await show();
  return () => { stop(); tr.dispose(); };
}
