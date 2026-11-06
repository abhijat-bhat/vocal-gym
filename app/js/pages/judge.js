/* Jathi judge: write a jathi in JathiScript and get the correctness gate, exact fixes, a craft score
   and the notation, re-judged as you type. */
import { api } from '../api.js';
import { toggle, rhythmJob, solluPlay, click, settings, stop } from '../audio.js';
import { esc, $, term, q, pageHead, transport, notation, legend, checks, ring, copy, download, errorCard } from '../ui.js';

const S = { script: null, example: 'adi' };
const CHEAT = [
  ['tala: adi', 'The tala. Also rupaka, misra chapu, khanda jati ata, custom 3+2+2 …'],
  ['nadai: 4', 'Syllables per beat'],
  ['avartanams: 2', 'How many cycles the jathi must fill'],
  ['eduppu: -2', 'Start point: sam, +n after sam, -n before sam'],
  ['land: sam', 'sam: last syllable on sam · end: finish exactly at sam'],
  ['tha', 'One syllable = one matra'],
  ['tha-ka-dhi-mi', 'Hyphens join syllables into one phrase'],
  [',  ;', 'Rest (karvai) of one / two matras'],
  ['(tha-ka)x2', 'Repeat a group'],
  ['let A = tha-ka-dhi-mi', 'Name a phrase, then use it as $A'],
  ['{tha-dhi-gi-na-thom}/2', 'Teermanam: the phrase three times, gaps of 2'],
  ['|   ||', 'Bars at section lines / cycle ends (checked)'],
  ['@8', 'Change speed: 8 syllables per beat from here'],
  ['# note', 'A comment']
];

export async function mount(root, meta) {
  let handed = null;
  try { handed = sessionStorage.getItem('vg-judge-script'); sessionStorage.removeItem('vg-judge-script'); } catch (e) { /* none */ }
  if (handed) { S.script = handed; S.example = null; }
  if (S.script == null) S.script = meta.examples[0].script;

  root.innerHTML = '<div class="wrap">' + pageHead({
    title: 'Jathi judge',
    lead: 'Write a jathi in ' + term('jathiscript', 'JathiScript') + ', a simple text notation, and the judge checks the arithmetic exactly: does it fill the cycles, start at the ' + term('eduppu') + ', and land on sam? If not, it tells you which line to fix and by how much. Then it scores the craft out of 100.',
    steps: [
      ['Start from an example', 'Load the correct example, or the one with a deliberate mistake, and watch the judge explain it.'],
      ['Edit the text', 'The judge re-reads it as you type. Errors point to the line and column.'],
      ['Read the verdict', 'First the correctness gate, then the exact fixes, then the craft scores. Press Play to hear it.']
    ]
  }) +
  '<div class="tool judge-layout"><aside class="panel" aria-label="Editor" style="padding:16px 18px">' +
    '<div class="field"><span class="lab">Examples</span><div class="chips" id="g-ex"></div></div>' +
    '<div class="field"><span class="lab">Your jathi</span><div class="editor"><div class="gutter" id="g-gut" aria-hidden="true"></div><textarea id="g-src" spellcheck="false" aria-label="JathiScript source"></textarea></div></div>' +
    '<div class="notation-actions"><button class="btn small" id="g-copy">Copy text</button><button class="btn small" id="g-dl">Download .jathi</button><label class="btn small ghost" style="cursor:pointer">Open a file<input type="file" id="g-file" accept=".jathi,.txt" hidden></label></div>' +
    '<details class="howto cheat" style="margin-top:16px"><summary>JathiScript cheat sheet</summary><div style="padding:0 18px 16px"><table><tbody>' + CHEAT.map(([a, b]) => '<tr><td>' + esc(a) + '</td><td>' + esc(b) + '</td></tr>').join('') + '</tbody></table></div></details>' +
  '</aside><section class="result" aria-live="polite" id="g-res"><div class="card"><p class="muted">Judging…</p></div></section></div></div>';

  const src = $('#g-src'), gut = $('#g-gut');
  src.value = S.script;
  $('#g-ex').innerHTML = meta.examples.map(e => '<button type="button" class="chip" data-ex="' + e.id + '" title="' + esc(e.blurb) + '"><b>' + esc(e.title) + '</b><br><span class="tag">' + esc(e.blurb) + '</span></button>').join('');
  $('#g-ex').onclick = e => { const b = e.target.closest('[data-ex]'); if (!b) return; S.example = b.dataset.ex; src.value = meta.examples.find(x => x.id === S.example).script; S.script = src.value; judge(); };

  let marks = { err: new Set(), warn: new Set() };
  const drawGutter = () => {
    const n = src.value.split('\n').length;
    let h = ''; for (let i = 1; i <= n; i++) h += '<div class="' + (marks.err.has(i) ? 'err' : marks.warn.has(i) ? 'warn' : '') + '">' + i + '</div>';
    gut.innerHTML = h; gut.scrollTop = src.scrollTop;
  };
  src.addEventListener('scroll', () => { gut.scrollTop = src.scrollTop; });
  src.addEventListener('keydown', e => { if (e.key === 'Tab') { e.preventDefault(); const s = src.selectionStart; src.setRangeText('  ', s, src.selectionEnd, 'end'); src.dispatchEvent(new Event('input')); } });
  let timer = 0;
  src.addEventListener('input', () => { S.script = src.value; drawGutter(); clearTimeout(timer); timer = setTimeout(judge, 450); });
  $('#g-copy').onclick = () => copy(src.value, 'JathiScript copied');
  $('#g-dl').onclick = () => download('my-jathi.jathi', src.value);
  $('#g-file').onchange = async e => { const f = e.target.files[0]; if (!f) return; src.value = await f.text(); S.script = src.value; judge(); e.target.value = ''; };

  let token = 0, trp = null;
  async function judge() {
    stop(); drawGutter();
    const my = ++token;
    let r;
    try { r = await api.judge(src.value); } catch (e) { if (my === token) $('#g-res').innerHTML = errorCard(e.message); return; }
    if (my !== token) return;
    stop();
    marks = { err: new Set((r.errors || []).map(x => x.line).filter(Boolean)), warn: new Set((r.warnings || []).map(x => x.line).filter(Boolean)) };
    drawGutter();
    if (trp) { trp.dispose(); trp = null; }
    const out = $('#g-res');
    if (!r.ok) {
      out.innerHTML = '<div class="card"><div class="scorebox"><div class="verdict"><span class="badge bad">Cannot read the script</span><h2 style="margin-top:8px">Fix the notation first</h2><p>The judge could not read ' + (r.errors.length === 1 ? 'one line' : r.errors.length + ' places') + '. Once the text is valid, it will check the timing.</p></div></div>' +
        '<ul class="errlist">' + r.errors.map(e => '<li>' + (e.line ? '<b>Line ' + e.line + (e.col ? ', column ' + e.col : '') + ':</b> ' : '') + esc(e.msg) + '</li>').join('') + '</ul></div>';
      return;
    }
    const failed = r.gate.filter(g => !g.ok).length, I = r.info;
    const facts = [['Tala', I.tala + (I.kalai > 1 ? ' · kalai ' + I.kalai : '')], ['Nadai', I.nadai + ' per beat'], ['Cycles', I.avartanams ? I.avartanams + (I.avartanamsInferred ? ' (inferred)' : '') : '—'], ['Start', I.eduppu === 0 ? 'on sam' : (I.eduppu > 0 ? '+' : '') + I.eduppu + ' matras'], ['Landing', I.land === 'sam' ? 'on sam' : I.land === 'end' ? 'ends at sam' : I.land], ['Teermanam', I.teermanam || 'none found'], ['Yati', I.yati || 'none']];
    let h = '<div class="card"><div class="scorebox">' + ring(r.total) + '<div class="verdict"><h2>' + esc(r.grade) + '</h2>' + (r.gatePass ? '' : '<span class="badge bad">' + failed + ' correctness check' + (failed > 1 ? 's' : '') + ' failed</span>') + '<p>' +
      (r.gatePass ? 'The counting is exact. The score below rates the craft.' : 'The score is capped at ' + r.cap + ' until the counting is right. Start with the fixes below.') + '</p></div></div>' +
      '<div class="facts">' + facts.map(([k, v]) => '<div><span class="k">' + k + '</span><span>' + esc(v) + '</span></div>').join('') + '</div></div>';
    if (r.fixes.length) h += '<div class="card"><h3 class="sec-h">What to change</h3><p class="card-sub">Computed from the exact arithmetic. Any one of these resolves the problem it addresses.</p><ol class="fixes">' + r.fixes.map(f => '<li>' + esc(f) + '</li>').join('') + '</ol></div>';
    h += '<div class="card"><h3 class="sec-h">Correctness gate ' + q('gate') + '</h3>' + checks(r.gate) + '</div>';
    h += '<div class="card" id="g-play-card"><h3 class="sec-h">Notation</h3><div id="g-tr" style="margin-top:12px"></div>' + (r.grid ? '<div class="notation-wrap" id="g-n"></div>' + legend([['teer', '', 'teermanam'], ['', ',', 'karvai (rest)'], ['land', '', 'final syllable'], ['sam', '', 'beat 1 (sam)'], ['now', '', 'playing now']]) : '<p class="card-sub" style="margin-top:12px">These speeds need more than 24 cells per beat, so the grid is not drawn. Playback and judging still work.</p>') + '</div>';
    h += '<div class="card"><h3 class="sec-h">Craft</h3><p class="card-sub">Six aspects, out of 100 in total. These weights have not yet been calibrated with teachers, so treat them as a guide.</p><div class="bars">' +
      r.aspects.map(a => '<div class="bar-row"><span>' + esc(a.name) + '</span><span class="track"><i style="width:' + Math.round(100 * a.score / a.max) + '%"></i></span><b>' + (Number.isInteger(a.score) ? a.score : a.score.toFixed(1)) + ' / ' + a.max + '</b>' + (a.notes.length ? '<ul class="bar-notes">' + a.notes.map(n => '<li>' + esc(n) + '</li>').join('') + '</ul>' : '') + '</div>').join('') + '</div></div>';
    if (r.warnings.length) h += '<div class="card"><h3 class="sec-h">Notes on the text</h3><ul class="warnlist">' + r.warnings.map(w => '<li>' + (w.line ? '<b>Line ' + w.line + ':</b> ' : '') + esc(w.msg) + '</li>').join('') + '</ul></div>';
    out.innerHTML = h;

    trp = transport($('#g-tr'), undefined, { sollu: true });
    if (r.grid) {
      const G = r.grid, rows = Math.ceil(G.slots.length / (G.tala.total * G.per)), atita = r.play.gridStart < 0;
      const slots = G.slots.map(s => ({ t: s.t, cls: (s.role === 'pre' ? 'pre' : s.role === 'sub' ? 'sub' : (s.hold ? 'hold ' : '') + (s.role === 'teer' ? 'teer' : s.role === 'gap' ? 'gap' : '')) + (s.first ? ' first' : '') + (s.land ? ' land' : '') }));
      $('#g-n').innerHTML = notation(slots, G.tala, G.per, { syl: true, rowLabel: i => (r.gatePass && I.land === 'sam' && i === rows - 1) ? { text: 'sam', cls: 'up' } : atita ? { text: i === 0 ? 'lead-in' : 'cycle ' + i } : { text: 'cycle ' + (i + 1) } });
      const starts = new Set(G.tala.angas.map(a => a.start));
      trp.btn.onclick = () => toggle(trp.btn, rhythmJob($('#g-n'), slots.map(s => s.cls.includes('sub') ? '' : s.t), G.per, G.tala.total, starts));
    } else {
      const P = r.play;
      trp.btn.onclick = () => toggle(trp.btn, {
        root: null,
        schedule(ac, outN, t0) {
          const beat = 60 / settings.bpm, tt = x => t0 + (x - P.gridStart) / P.ticksPerBeat * beat;
          solluPlay(ac, outN, P.events.map(ev => ({ t: tt(ev.at), s: ev.v })).sort((a, b) => a.t - b.t));
          const starts = new Set(P.angaStarts);
          for (let k = Math.floor(P.gridStart / P.ticksPerBeat); k * P.ticksPerBeat <= P.end; k++) { const c = ((k % P.cycleBeats) + P.cycleBeats) % P.cycleBeats; click(ac, outN, tt(k * P.ticksPerBeat), starts.has(c)); }
          return { end: tt(P.end) + 0.3, slot: beat };
        }
      });
    }
  }
  drawGutter();
  await judge();
  return () => { stop(); clearTimeout(timer); if (trp) trp.dispose(); };
}
