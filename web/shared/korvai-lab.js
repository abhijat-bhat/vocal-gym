/* Vocal Gym · the Korvai & Tihai lab (docs/research/korvai-tihai.md)
   A classic script shared by the playground pages (inlined by scripts/build.js) and the app (served at
   /shared/). It sets globalThis.VGKorvaiLab = { mount(root, host) }, which returns { unmount, setMode }:
     host.K      the korvai engine: VGEngine.korvai in the playground, /engine/korvai/index.js in the app
     host.audio  { play(btn, job), stop(), sound(), setSound(key, value) }; job = { root, sylls, cells, tones,
                 per, total, angaStarts }: sylls has one entry per grid cell ('' silent, ',' karvai), cells the
                 layout's cells (for VGMridangam.playArranged, which voices the phrases), tones whether the
                 phrase tones sound, per cells a beat, total beats a cycle, angaStarts a Set of beats. play
                 toggles: a second press stops. sound() → { sa (0–11, C to B), bpm }; setSound('sa' | 'bpm', v).
     host.check  optional { open(script), go() } to hand a JathiScript to the judge on another page, or
                 { open(script), show(el), hide() } to show the host's judge inside the lab's Check tab
     host.kalpana optional { open(frame, layout, meta) }: sing this rhythm as kalpana swaras (the host builds
                 the template with rhythmTemplate and opens its kalpana generator)
     host.store  optional localStorage key for the learner's place (lesson, tala, gati, builder settings)
   Learn: fifteen short lessons, each worked live for the learner's tala. Build: the explorer, every form and
   setting, with every solution listed. All arithmetic is the engine's; the page only draws it. */
(function (g) {
  'use strict';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
  const pct = x => Math.round(100 * x);
  const FAMS = ['dhruva', 'matya', 'rupaka', 'jhampa', 'triputa', 'ata', 'eka', 'chapu'];
  const JATI_N = { 3: 'Tisra', 4: 'Chatusra', 5: 'Khanda', 7: 'Misra', 9: 'Sankeerna' };
  const GATI_UI = [3, 4, 5, 7, 9, 2];
  const SA_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const ROLE = { uttaranga: 'uttaranga', count: 'the pulses of a beat', pre: 'before the start', purvanga: 'purvanga', pgap: 'karvai', statement: 'mora statement', gap: 'mora gap', mukhra: 'mukhra', close: 'closing syllable', speed1: 'first speed', speed2: 'second speed', speed3: 'third speed' };
  const KRIYA = { clap: '●', wave: '○', count: '•', kalai: '·' };
  const DEFAULTS = {
    mode: 'learn', lesson: 0, fam: 'triputa', L: 4, gati: 4, kalai: 1, tones: 1,
    l2: { P: 5, G: 2 }, l3: { a: 7, k: 5, counting: 'end' }, l4: { cycles: 1, counting: 'end', pick: 0, half: -1 }, l5: { shape: 'srotovaha', n: 3 },
    l6: { cycles: 2, pick: 0, pv: 0, ex: {} }, l7: { land: 2, start: 0 }, l8: { n: 5, variant: 'full' }, l9: { cycles: 2, counting: 'on', pick: 0, mode: 'mukhra', halves: 0 },
    ld: { L: 5 }, ly: { kind: 'gopuccha', a: 10, d: 2, n: 4, m: 2, fit: 1, terms: '5 3 7 4' }, lp: { kind: 'ap', a: 2, d: 1, n: 6, r: 2, x1: 3, x2: 5, k: 1, L: 16, S: 35, pp: 0 },
    lq: { cycles: 2, kind: 'all', pick: 0, edu: 0, prog: 0, mode: 'equal', ex: {}, exp: {} }, la: { alg: 'samam', f: 8, p: 8, k: 1, form: 'buildup', pick: 0, ek: 2 }, lc: { base: 'k96', method: 'A', pick: 0, sounded: 1 },
    b: { form: 'mora', cycles: 2, start: 0, land: 0, counting: 'end', n: 3, shape: 'sama', pick: 0, pv: 0, tn: 5, tvar: 'full', kind: 'all', cmode: 'any', edu: 0, prog: 0, exs: {} }
  };
  const clone = o => JSON.parse(JSON.stringify(o));

  function mount(root, host) {
    const K = host.K, audio = host.audio || { play() {}, stop() {} };
    let S = clone(DEFAULTS);
    try { const s = host.store && JSON.parse(localStorage.getItem(host.store) || 'null'); if (s && typeof s === 'object') S = merge(S, s); } catch (e) { /* defaults */ }
    if (!validTala(S.fam, S.L)) { S.fam = 'triputa'; S.L = 4; }
    const save = () => { try { if (host.store) localStorage.setItem(host.store, JSON.stringify(S)); } catch (e) { /* not kept */ } };
    const tl = () => K.tala(S.fam, S.L);
    const cyc = () => K.talaCycle(tl(), S.gati, S.kalai);

    root.classList.add('kl');
    root.innerHTML =
      '<div class="kl-top" role="group" aria-label="Your tala">' +
        '<div class="kl-field"><span class="kl-lab">Tala</span><div class="kl-talapick"><select data-fk="fam" aria-label="Tala family"></select><select data-fk="jati" aria-label="Jati (laghu length)"></select></div></div>' +
        '<div class="kl-field"><span class="kl-lab">Gati <span class="kl-hint">pulses in a beat</span></span><div class="kl-chips" data-chips="gati"></div></div>' +
        '<div class="kl-field"><span class="kl-lab">Kalai <span class="kl-hint">beats in an akshara</span></span><div class="kl-chips" data-chips="kalai"></div></div>' +
        '<div class="kl-cyclebox" aria-live="polite"></div>' +
      '</div>' +
      '<div class="kl-modes" role="tablist" aria-label="Lab mode">' +
        '<button role="tab" data-mode="learn">Learn <span>step by step</span></button>' +
        '<button role="tab" data-mode="build">Build <span>any tala, any span</span></button>' +
        (host.check ? '<button role="tab" data-mode="check">Check <span>your own, in the judge</span></button>' : '') +
      '</div>' +
      '<div class="kl-view"></div>';
    const $ = s => root.querySelector(s);
    const view = $('.kl-view');

    /* ---------- the tala bar ---------- */
    function drawTop() {
      const fs = $('[data-fk="fam"]'), js = $('[data-fk="jati"]');
      fs.innerHTML = FAMS.map(f => '<option value="' + f + '"' + (f === S.fam ? ' selected' : '') + '>' + (f === 'chapu' ? 'Chapu' : f[0].toUpperCase() + f.slice(1)) + '</option>').join('');
      const Ls = S.fam === 'chapu' ? [3, 5, 7] : [3, 4, 5, 7, 9];
      js.innerHTML = Ls.map(L => '<option value="' + L + '"' + (L === S.L ? ' selected' : '') + '>' + JATI_N[L] + ' (' + (S.fam === 'chapu' ? K.tala('chapu', L).angas.map(a => a.len).join('+') : L) + ')</option>').join('');
      chipRow($('[data-chips="gati"]'), GATI_UI.map(n => ({ v: n, label: String(n), title: K.GATI_NAME[n] })), S.gati, v => { S.gati = v; changed(); });
      chipRow($('[data-chips="kalai"]'), [1, 2].map(n => ({ v: n, label: String(n) })), S.kalai, v => { S.kalai = v; changed(); });
      const c = cyc();
      $('.kl-cyclebox').innerHTML = '<b>' + esc(c.name) + '</b><span class="kl-eq">' + esc(c.angaText) + ' = ' + c.tala.total + (c.kalai > 1 ? ' × ' + c.kalai : '') + ' beats × ' + c.gati + ' = <b>' + c.pulses + ' pulses</b></span>' +
        '<span class="kl-kriya" aria-label="kriya">' + c.kriya.map((k, b) => '<i class="' + k + (c.angaStarts.includes(b) ? ' as' : '') + '" title="beat ' + (b + 1) + ': ' + k + '">' + KRIYA[k] + '</i>').join('') + '</span>';
      root.querySelectorAll('[data-mode]').forEach(b => { const on = b.dataset.mode === S.mode; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
    }
    const onTala = e => {
      const fk = e.target.dataset && e.target.dataset.fk;
      if (fk === 'fam') { S.fam = e.target.value; const Ls = S.fam === 'chapu' ? [3, 5, 7] : [3, 4, 5, 7, 9]; if (!Ls.includes(S.L)) S.L = S.fam === 'chapu' ? 7 : K.DEFJ[S.fam]; changed(); }
      else if (fk === 'jati') { S.L = +e.target.value; changed(); }
    };
    $('[data-fk="fam"]').addEventListener('change', onTala); $('[data-fk="jati"]').addEventListener('change', onTala);
    root.querySelectorAll('[data-mode]').forEach(b => {
      b.addEventListener('click', () => setMode(b.dataset.mode));
      b.addEventListener('keydown', e => { if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; const all = Array.from(root.querySelectorAll('[data-mode]')); const i = all.indexOf(b), n = all[(i + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length]; n.focus(); setMode(n.dataset.mode); });
    });
    function setMode(m) {
      if (m === 'check' && !(host.check && host.check.show)) { if (host.check && host.check.go) host.check.go(); return; }
      S.mode = m; if (m !== 'check') save(); drawTop(); draw();
    }
    function changed() { save(); drawTop(); draw(); }

    /* ---------- shared pieces ---------- */
    function chipRow(el, items, value, on) {
      el.innerHTML = items.map(it => '<button type="button" class="kl-chip" data-v="' + esc(it.v) + '" aria-pressed="' + (String(it.v) === String(value)) + '"' + (it.title ? ' title="' + esc(it.title) + '"' : '') + '>' + it.label + (it.sub ? '<small>' + it.sub + '</small>' : '') + '</button>').join('');
      el.setAttribute('role', 'group');
      el.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { const it = items.find(x => String(x.v) === b.dataset.v); on(it.v); }));
    }
    function stepper(key, label, value, min, max, hint) {
      return '<div class="kl-field"><span class="kl-lab">' + label + '</span><div class="kl-step"><button type="button" data-st="' + key + '" data-d="-1" aria-label="' + esc(label) + ' down">−</button>' +
        '<input type="number" inputmode="numeric" data-fk="' + key + '" data-in="' + key + '" value="' + value + '" min="' + min + '" max="' + max + '" aria-label="' + esc(label) + '">' +
        '<button type="button" data-st="' + key + '" data-d="1" aria-label="' + esc(label) + ' up">+</button></div>' + (hint ? '<span class="kl-hint">' + hint + '</span>' : '') + '</div>';
    }
    // wire the steppers of a block: get(key) → value, set(key, v) clamps and redraws
    function wireSteppers(el, spec) {
      el.querySelectorAll('[data-st]').forEach(b => b.addEventListener('click', () => { const k = b.dataset.st, s = spec[k]; s.set(Math.max(s.min, Math.min(s.max, s.get() + Number(b.dataset.d)))); }));
      el.querySelectorAll('[data-in]').forEach(inp => inp.addEventListener('change', () => { const k = inp.dataset.in, s = spec[k]; let v = Math.round(Number(inp.value)); if (!Number.isFinite(v)) v = s.get(); s.set(Math.max(s.min, Math.min(s.max, v))); }));
    }
    function chips(key, items, value) {
      return '<div class="kl-chips" role="group" data-ck="' + key + '">' + items.map(it => '<button type="button" class="kl-chip" data-fk="' + key + ':' + esc(it.v) + '" data-v="' + esc(it.v) + '" aria-pressed="' + (String(it.v) === String(value)) + '"' + (it.title ? ' title="' + esc(it.title) + '"' : '') + '>' + it.label + (it.sub ? '<small>' + esc(it.sub) + '</small>' : '') + '</button>').join('') + '</div>';
    }
    function wireChips(el, handlers) {
      el.querySelectorAll('[data-ck]').forEach(row => row.querySelectorAll('button').forEach(b => b.addEventListener('click', () => handlers[row.dataset.ck](b.dataset.v))));
    }
    function stepsHTML(steps) {
      return '<ol class="kl-steps">' + steps.map(s => '<li><b>' + esc(s.title) + '</b><code>' + esc(s.math) + '</code>' + (s.text ? '<span>' + esc(s.text) + '</span>' : '') + '</li>').join('') + '</ol>';
    }
    const notice = (html, kind) => '<div class="kl-note ' + (kind || '') + '">' + html + '</div>';
    const where = (c, p) => K.offsetText(p, c.gati);

    /* the tala grid: one row a cycle, angas, beats with their kriya, one cell a pulse */
    function gridHTML(c, L, o) {
      o = o || {};
      const cells = L.cells, C = c.pulses, rows = Math.max(1, Math.ceil(cells.length / C)), pre = o.atita;
      let h = '<div class="kl-grid' + (c.gati >= 7 ? ' dense' : '') + '" style="--g:' + c.gati + '">';
      for (let r = 0; r < rows; r++) {
        const lab = pre ? (r === 0 ? 'before' : 'cycle ' + r) : 'cycle ' + (r + 1);
        h += '<div class="kl-row"><span class="kl-rl">' + lab + '</span><div class="kl-cyc">';
        let b = 0;
        for (const a of c.tala.angas) {
          let ah = '';
          for (let k = 0; k < a.len * c.kalai; k++, b++) {
            const base = r * C + b * c.gati;
            if (base >= cells.length) break;
            let ch = '';
            for (let q = 0; q < c.gati; q++) {
              const x = cells[base + q];
              if (!x) { ch += '<span class="kl-c void"></span>'; continue; }
              const t = x.role === 'pre' ? '' : x.syl === '' ? '–' : x.syl;
              const cls = 'kl-c r-' + x.role + (x.part != null ? ' p' + (x.part % 2) : '') + (x.first && x.syl !== ',' ? ' first' : '') + (x.syl === ',' ? ' rest' : '') + (x.syl === '' && x.role !== 'pre' ? ' hold' : '') + (base + q === L.landIndex ? ' land' : '');
              ch += '<span class="' + cls + '" data-i="' + (base + q) + '" title="' + esc((x.label || ROLE[x.role] || '') + (base + q === L.landIndex ? ' · the landing' : '')) + '">' + esc(t) + '</span>';
            }
            ah += '<span class="kl-beat' + (b === 0 ? ' sam' : '') + (k === 0 ? ' astart' : '') + '"><span class="kl-bh"><i class="' + c.kriya[b] + '">' + KRIYA[c.kriya[b]] + '</i>' + (b + 1) + '</span><span class="kl-cells">' + ch + '</span></span>';
          }
          if (ah) h += '<span class="kl-anga">' + ah + '</span>';
        }
        h += '</div></div>';
      }
      return h + '</div>';
    }
    function legendHTML(L) {
      const roles = Array.from(new Set(L.cells.map(x => x.role))).filter(r => r !== 'pre');
      return '<div class="kl-legend">' + roles.map(r => '<span><i class="kl-c r-' + r + '"></i>' + ROLE[r] + '</span>').join('') + '<span><i class="kl-c land"></i>the landing</span><span><b>●</b> clap <b>○</b> wave <b>•</b> count</span></div>';
    }
    function gridText(c, L) {
      const C = c.pulses, out = [];
      for (let p = 0; p < L.cells.length; p += C) {
        let b = 0; const angas = [];
        c.tala.angas.forEach(a => { const beats = []; for (let k = 0; k < a.len * c.kalai; k++, b++) { const base = p + b * c.gati; if (base >= L.cells.length) break; const s = []; for (let q = 0; q < c.gati && base + q < L.cells.length; q++) { const x = L.cells[base + q]; s.push(x.role === 'pre' ? '·' : x.syl === '' ? '-' : x.syl); } beats.push(s.join(' ')); } if (beats.length) angas.push(beats.join('  ')); });
        out.push(angas.join(' | ') + ' ||');
      }
      return out.join('\n');
    }
    function copy(text, btn) {
      const done = () => { const t = btn.textContent; btn.textContent = 'Copied'; setTimeout(() => { btn.textContent = t; }, 1300); };
      const fallback = () => { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { /* nothing */ } ta.remove(); };
      try { navigator.clipboard.writeText(text).then(done, fallback); } catch (e) { fallback(); }
    }
    /* a grid block: toolbar (play, copy, check), the grid and its legend */
    function gridBlock(el, c, R, F, o) {
      o = o || {};
      const L = R.layout;
      const snd = audio.sound ? audio.sound() : null;
      el.innerHTML = '<div class="kl-gridbar"><button type="button" class="kl-btn primary kl-play" data-label="Play">▶ Play</button>' +
        '<button type="button" class="kl-btn kl-copy">Copy notation</button>' + (host.check && F && o.check !== false ? '<button type="button" class="kl-btn kl-check">Check it in the judge</button>' : '') +
        (host.kalpana && F && R.layout ? '<button type="button" class="kl-btn kl-kalpana" title="The kalpana swara generator sings this exact rhythm in a raga: the same phrases, gaps and cadence">Sing it as kalpana swaras →</button>' : '') +
        '<span class="kl-gridsum">' + esc(o.summary || '') + '</span></div>' +
        (snd ? '<div class="kl-sound" role="group" aria-label="Sound">' +
          '<label>Sa <select class="kl-sa" aria-label="Sa, the pitch the drum and the phrase tones are tuned to">' + SA_NAMES.map((n, i) => '<option value="' + i + '"' + (i === snd.sa ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></label>' +
          '<label>Tempo <input type="range" class="kl-bpm" min="40" max="140" step="2" value="' + snd.bpm + '" aria-label="Tempo, beats a minute"><span class="kl-bpmv">' + snd.bpm + '</span></label>' +
          '<button type="button" class="kl-chip kl-tones" aria-pressed="' + !!S.tones + '" title="A tone at the start of each phrase, higher for a longer phrase">Phrase tones</button>' +
          '<span class="kl-hint">Each phrase opens on an accent; ' + (S.tones ? 'its tone rises with its length, so the shape of the purvanga is heard as a melody.' : 'turn the phrase tones on to hear the lengths as pitches.') + '</span></div>' : '') +
        '<div class="kl-gridwrap">' + gridHTML(c, L, { atita: F && F.start < 0 }) + '</div>' + legendHTML(L);
      const gw = el.querySelector('.kl-gridwrap');
      // size the cells so that a whole avartanam fits on one line where it can (20 to 30 px a pulse)
      const avail = gw.clientWidth;
      if (avail > 0) {
        const cw = Math.floor((avail - 92 - c.beats * 7 - c.tala.angas.length * 12) / c.pulses), grid = gw.querySelector('.kl-grid');
        if (cw < 30) { grid.style.setProperty('--kl-cw', Math.max(25, cw) + 'px'); grid.classList.toggle('dense', cw < 27); }
      }
      el.querySelector('.kl-play').addEventListener('click', e => audio.play(e.currentTarget, { root: gw, sylls: L.sylls, cells: L.cells, tones: !!S.tones, per: c.gati, total: c.beats, angaStarts: new Set(c.angaStarts) }));
      if (snd) {
        el.querySelector('.kl-sa').addEventListener('change', e => { audio.stop(); audio.setSound('sa', +e.target.value); });
        const bp = el.querySelector('.kl-bpm');
        bp.addEventListener('input', () => { el.querySelector('.kl-bpmv').textContent = bp.value; });
        bp.addEventListener('change', () => { audio.stop(); audio.setSound('bpm', +bp.value); });
        el.querySelector('.kl-tones').addEventListener('click', () => { S.tones = S.tones ? 0 : 1; save(); draw(); });
      }
      el.querySelector('.kl-copy').addEventListener('click', e => copy(c.name + ' · gati ' + c.gati + (c.kalai > 1 ? ' · kalai ' + c.kalai : '') + '\n' + gridText(c, L), e.currentTarget));
      const kb = el.querySelector('.kl-kalpana');
      if (kb) kb.addEventListener('click', () => { audio.stop(); host.kalpana.open(F, L, { label: (R.variation && R.variation.label) || o.summary || '', form: R.kind || '' }); });
      const ck = el.querySelector('.kl-check');
      if (ck) {
        const x = K.toJathiScript(F, R);
        if (x.error) { ck.disabled = true; ck.title = x.error; }
        else ck.addEventListener('click', () => host.check.open(x.script));
      }
    }
    function checksHTML(R) {
      return '<ul class="kl-checks">' + R.layout.checks.map(x => '<li class="' + (x.ok ? 'ok' : 'bad') + '">' + esc(x.text) + '</li>').join('') + '</ul>';
    }
    // statement lengths as bars: the shape of a mora or a yati
    function barsHTML(lens, cls) {
      const mx = Math.max.apply(null, lens);
      return '<span class="kl-bars ' + (cls || '') + '" aria-hidden="true">' + lens.map(l => '<i style="height:' + Math.max(12, Math.round(100 * l / mx)) + '%"></i>').join('') + '</span>';
    }
    function ratioHTML(V, U) {
      const v = Math.round(100 * V / (V + U));
      return '<div class="kl-ratio" role="img" aria-label="purvanga ' + V + ', uttaranga ' + U + '"><span class="pv" style="flex:' + V + '">purvanga ' + V + '</span><span class="ut" style="flex:' + U + '">uttaranga ' + U + '</span></div><div class="kl-hint">' + v + ' : ' + (100 - v) + (v >= 30 && v <= 70 ? ' (inside 30 : 70 to 70 : 30)' : ' (outside the usual balance)') + '</div>';
    }
    // a frame for a lesson: the learner's tala, gati and kalai, and the rest from o
    const frame = o => K.korvaiFrame(Object.assign({ fam: S.fam, L: S.L, gati: S.gati, kalai: S.kalai }, o));
    // the fewest cycles that give a mora room: at least 20 pulses
    const roomy = c => Math.max(1, Math.ceil(20 / c.pulses));

    /* ---------- the explorer: every variation of a form under the learner's constraints (v0.8.2) ----------
       K.exploreSpace enumerates them, K.exploreOrder orders them by the creativity dial (familiar → novel,
       spread so neighbours differ), K.exploreSurprise draws one. The list adapts to its size: chips up to
       12, a dropdown up to 80, and a searchable, paged list beyond. */
    const CREATIVITY = [[0.45, 'Traditional'], [0.95, 'Balanced'], [1.45, 'Inventive'], [2.01, 'Adventurous']];
    const creativityWord = T => (CREATIVITY.find(x => T < x[0]) || CREATIVITY[3])[1];
    const FACET_LABEL = { series: 'Repeat', shape: 'Shape', gap: 'Gaps', beat: 'Placement', texture: 'Sollu', half: 'Gap size', purvanga: 'Purvanga', balance: 'Balance', mora: 'Mora', remainder: 'Remainder', statements: 'Statements', direction: 'Direction', repeat: 'Each played', kind: 'Kind', inner: 'Inner gaps', form: 'Form' };
    const SORTS = [['creative', 'By creativity, varied'], ['familiar', 'Most familiar first'], ['novel', 'Most unusual first'], ['short', 'Shortest first'], ['long', 'Longest first']];
    function exState(holder, key) {
      const e = holder[key] && typeof holder[key] === 'object' ? holder[key] : (holder[key] = {});
      const def = { pos: 0, T: 0.4, sort: 'creative', seed: 1, q: '', more: 60, browse: 0 };
      Object.keys(def).forEach(k => { if (typeof e[k] !== typeof def[k]) e[k] = def[k]; });
      if (!e.filters || typeof e.filters !== 'object') e.filters = {};
      if (!Array.isArray(e.seen)) e.seen = [];
      return e;
    }
    const meter = (v, cls) => '<span class="kl-meter ' + cls + '"><i style="width:' + Math.round(100 * v) + '%"></i></span>';
    function explore(space, e) {
      const order = K.exploreOrder(space, { T: e.T, sort: e.sort, filters: e.filters }), N = order.length, total = space.count;
      // each value counts the variations it would leave, given the other filters (0: none, so it is greyed out)
      const fc = K.exploreFacetCounts(space, e.filters);
      const fsel = Object.keys(space.facets).map(f => { const anyN = fc[f].reduce((t, x) => t + x.count, 0); return '<label class="kl-exf"><span>' + esc(FACET_LABEL[f] || f) + '</span><select data-exf="' + esc(f) + '" data-fk="exf:' + esc(f) + '"><option value="">any (' + anyN.toLocaleString('en') + ')</option>' +
        fc[f].map(x => '<option value="' + esc(x.value) + '"' + (e.filters[f] === x.value ? ' selected' : x.count ? '' : ' disabled') + '>' + esc(x.value) + ' (' + x.count.toLocaleString('en') + ')</option>').join('') + '</select></label>'; }).join('');
      const head = '<div class="kl-exhead"><b>' + total.toLocaleString('en') + ' variation' + (total === 1 ? '' : 's') + '</b> fit these settings' + (N !== total ? '; <b>' + N.toLocaleString('en') + '</b> match the filters' : '') + '. <span class="kl-hint" style="display:inline">Each filter’s numbers count what choosing it would leave, given the others.</span>' +
        (Object.keys(e.filters).length ? ' <button type="button" class="kl-link" data-ex="clear">Clear filters</button>' : '') + '</div>' + (fsel ? '<div class="kl-exfilters">' + fsel + '</div>' : '');
      if (!N) return { order, item: null, html: '<div class="kl-ex">' + head + notice('No variation matches these filters.', 'warn') + '</div>', wire: el => wireEx(el, space, order, e) };
      const pos = Math.max(0, Math.min(N - 1, e.pos | 0)), item = space.items[order[pos]];
      const nav = '<div class="kl-exnav">' +
        '<button type="button" class="kl-btn" data-ex="prev" data-fk="ex:prev" aria-label="Previous variation">◀</button>' +
        '<label class="kl-expos">Variation <input type="number" data-ex="pos" data-fk="ex:pos" min="1" max="' + N + '" value="' + (pos + 1) + '" aria-label="Variation number"> of ' + N.toLocaleString('en') + '</label>' +
        '<button type="button" class="kl-btn" data-ex="next" data-fk="ex:next" aria-label="Next variation">▶</button>' +
        (N > 12 ? '<input type="range" class="kl-exjump" data-ex="jump" data-fk="ex:jump" min="1" max="' + N + '" value="' + (pos + 1) + '" aria-label="Jump to a variation">' : '') +
        '<button type="button" class="kl-btn primary" data-ex="surprise" data-fk="ex:surprise" title="A variation drawn at the creativity setting, one you have not seen yet">🎲 Surprise me</button>' +
        '<label class="kl-exT">Creativity <input type="range" data-ex="T" data-fk="ex:T" min="0" max="2" step="0.1" value="' + e.T + '" aria-label="Creativity"><span class="kl-exTw">' + creativityWord(e.T) + '</span></label>' +
        '<label class="kl-exsort">Order <select data-ex="sort" data-fk="ex:sort">' + SORTS.map(([v, l]) => '<option value="' + v + '"' + (v === e.sort ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></label></div>';
      const cur = '<div class="kl-excur"><div><b>' + esc(item.label) + '</b><small>' + esc(item.sub) + '</small></div><div class="kl-exmeters" title="how familiar and how unusual this variation is, among these">familiar ' + meter(item.Fn, 'f') + ' unusual ' + meter(item.Nn, 'n') + '</div>' +
        '<div class="kl-extags">' + Object.keys(item.facets).filter(f => space.facets[f]).map(f => '<span>' + esc(item.facets[f]) + '</span>').join('') + '</div></div>';
      let browse = '';
      if (N <= 12) browse = '<div class="kl-sols" role="group" aria-label="All variations">' + order.map((k, p) => '<button type="button" class="kl-sol" data-exi="' + p + '" aria-pressed="' + (p === pos) + '"><b>' + esc(space.items[k].label) + '</b><small>' + esc(space.items[k].sub) + '</small></button>').join('') + '</div>';
      else if (N <= 80) browse = '<label class="kl-expick">All of them <select data-ex="pick" data-fk="ex:pick">' + order.map((k, p) => '<option value="' + p + '"' + (p === pos ? ' selected' : '') + '>' + (p + 1) + '. ' + esc(space.items[k].label) + ' — ' + esc(space.items[k].sub) + '</option>').join('') + '</select></label>';
      else {
        const terms = e.q.toLowerCase().split(/\s+/).filter(Boolean);
        const hits = []; order.forEach((k, p) => { const x = space.items[k], txt = (x.label + ' ' + x.sub + ' ' + Object.values(x.facets).join(' ')).toLowerCase(); if (terms.every(t => txt.includes(t))) hits.push(p); });
        const shown = hits.slice(0, e.more);
        browse = '<details class="kl-exbrowse" data-ex="browse"' + (e.browse ? ' open' : '') + '><summary>Browse all ' + N.toLocaleString('en') + '</summary>' +
          '<input type="search" class="kl-text" data-ex="q" data-fk="ex:q" value="' + esc(e.q) + '" placeholder="Filter, e.g. gopuccha 33 takadhom" aria-label="Filter the variations">' +
          '<p class="kl-hint">' + hits.length.toLocaleString('en') + ' shown in this order' + (hits.length > shown.length ? ', the first ' + shown.length + ' listed' : '') + '.</p>' +
          '<ol class="kl-exlist" role="listbox" aria-label="Variations">' + shown.map(p => { const x = space.items[order[p]]; return '<li><button type="button" role="option" data-exi="' + p + '" aria-selected="' + (p === pos) + '"><span class="n">' + (p + 1) + '</span><b>' + esc(x.label) + '</b><small>' + esc(x.sub) + '</small></button></li>'; }).join('') + '</ol>' +
          (hits.length > shown.length ? '<button type="button" class="kl-btn" data-ex="more">Show ' + Math.min(60, hits.length - shown.length) + ' more</button>' : '') + '</details>';
      }
      return { order, item, pos, html: '<div class="kl-ex">' + head + nav + cur + browse + '</div>', wire: el => wireEx(el, space, order, e) };
    }
    function wireEx(el, space, order, e) {
      const box = el.querySelector('.kl-ex'); if (!box) return;
      const N = order.length, go = p => { e.pos = ((p % N) + N) % N; e.seen = e.seen.concat(order[e.pos]).slice(-30); save(); draw(); };
      const on = (sel, ev, fn) => box.querySelectorAll(sel).forEach(x => x.addEventListener(ev, fn));
      on('[data-ex="prev"]', 'click', () => go((e.pos | 0) - 1));
      on('[data-ex="next"]', 'click', () => go((e.pos | 0) + 1));
      on('[data-ex="pos"]', 'change', ev => go(Math.round(+ev.target.value || 1) - 1));
      on('[data-ex="jump"]', 'input', ev => { const i = box.querySelector('[data-ex="pos"]'); if (i) i.value = ev.target.value; });
      on('[data-ex="jump"]', 'change', ev => go(+ev.target.value - 1));
      on('[data-ex="pick"]', 'change', ev => go(+ev.target.value));
      on('[data-exi]', 'click', ev => go(+ev.currentTarget.dataset.exi));
      on('[data-ex="surprise"]', 'click', () => { e.seed = (e.seed | 0) + 1; const p = K.exploreSurprise(space, order, { T: Math.max(e.T, 0.8), seed: e.seed, avoid: e.seen }); if (p >= 0) go(p); });
      on('[data-ex="T"]', 'input', ev => { const w = box.querySelector('.kl-exTw'); if (w) w.textContent = creativityWord(+ev.target.value); });
      on('[data-ex="T"]', 'change', ev => { e.T = +ev.target.value; e.pos = 0; save(); draw(); });
      on('[data-ex="sort"]', 'change', ev => { e.sort = ev.target.value; e.pos = 0; save(); draw(); });
      on('[data-exf]', 'change', ev => { const f = ev.target.dataset.exf; if (ev.target.value) e.filters[f] = ev.target.value; else delete e.filters[f]; e.pos = 0; save(); draw(); });
      on('[data-ex="clear"]', 'click', () => { e.filters = {}; e.pos = 0; save(); draw(); });
      on('[data-ex="browse"]', 'toggle', ev => { e.browse = ev.target.open ? 1 : 0; save(); });
      on('[data-ex="q"]', 'input', ev => { e.q = ev.target.value; e.more = 60; save(); clearTimeout(wireEx.t); wireEx.t = setTimeout(draw, 250); });
      on('[data-ex="more"]', 'click', () => { e.more += 60; save(); draw(); });
      box.addEventListener('keydown', ev => { if (ev.target.matches('input, select')) return; if (ev.key === 'ArrowRight' || ev.key === ']') { ev.preventDefault(); go((e.pos | 0) + 1); } else if (ev.key === 'ArrowLeft' || ev.key === '[') { ev.preventDefault(); go((e.pos | 0) - 1); } });
    }
    /* an explored block: the explorer, then the realised variation drawn by render(R, F2) */
    function exploreBlock(el, c, F, holder, key, form, opts, intro, empty, render) {
      const space = K.exploreSpace(F, form, opts), e = exState(holder, key);
      if (!space.count) { el.innerHTML = intro + notice(empty, 'warn'); return null; }
      const X = explore(space, e);
      if (!X.item) { el.innerHTML = intro + X.html; X.wire(el); return null; }
      const R = K.exploreRealize(F, X.item, opts);
      if (!R || R.error) { el.innerHTML = intro + X.html + notice(esc((R && R.error) || 'This variation could not be drawn.'), 'bad'); X.wire(el); return null; }
      const F2 = R.frame || F;
      el.innerHTML = intro + X.html + render(R, F2);
      X.wire(el);
      return { R, F2, c2: F2 === F ? c : F2.cycle, item: X.item };
    }

    /* ---------- lessons ---------- */
    const LESSONS = [
      { title: 'Count the cycle in pulses', draw: lessonCycle },
      { title: 'The mora: three statements, two gaps', draw: lessonMora },
      { title: 'Land on sam: count back', draw: lessonChart },
      { title: 'Every way to fill a span', draw: lessonSolve },
      { title: 'A repeating phrase: when does it land?', draw: lessonDrift },
      { title: 'Shapes and series', draw: lessonShapes },
      { title: 'The six yatis', draw: lessonYati },
      { title: 'Purvanga patterns: AP, GP, Fibonacci …', draw: lessonPatterns },
      { title: 'The korvai: purvanga and uttaranga', draw: lessonKorvai },
      { title: 'Three statements, and progressive korvais', draw: lessonStatements },
      { title: 'Composing: the Samam and Edapu algorithms', draw: lessonAlgorithms },
      { title: 'Same total, a new korvai', draw: lessonConstant },
      { title: 'Off sam: the eduppu', draw: lessonEduppu },
      { title: 'Trikaala: one jati, three speeds', draw: lessonTrikaala },
      { title: 'A tihai of tihais', draw: lessonChakradar }
    ];
    function drawLearn() {
      const i = Math.max(0, Math.min(LESSONS.length - 1, S.lesson | 0));
      view.innerHTML = '<div class="kl-learn"><nav class="kl-rail" aria-label="Lessons"><ol>' + LESSONS.map((l, k) => '<li><button type="button" data-lesson="' + k + '"' + (k === i ? ' aria-current="step"' : '') + '><span class="n">' + (k + 1) + '</span>' + esc(l.title) + '</button></li>').join('') + '</ol></nav>' +
        '<article class="kl-lesson" aria-live="polite"><p class="kl-kicker">Lesson ' + (i + 1) + ' of ' + LESSONS.length + '</p><h3>' + esc(LESSONS[i].title) + '</h3><div class="kl-lbody"></div>' +
        '<div class="kl-lnav"><button type="button" class="kl-btn" data-go="-1"' + (i === 0 ? ' disabled' : '') + '>← Previous</button><span class="kl-dots">' + LESSONS.map((_, k) => '<i' + (k === i ? ' class="on"' : '') + '></i>').join('') + '</span>' +
        (i < LESSONS.length - 1 ? '<button type="button" class="kl-btn primary" data-go="1">Next: ' + esc(LESSONS[i + 1].title) + ' →</button>' : '<button type="button" class="kl-btn primary" data-build>Build your own →</button>') + '</div></article></div>';
      view.querySelectorAll('[data-lesson]').forEach(b => b.addEventListener('click', () => { S.lesson = +b.dataset.lesson; save(); draw(); view.querySelector('.kl-lesson').scrollIntoView && view.querySelector('.kl-lesson').scrollIntoView({ block: 'nearest' }); }));
      view.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { S.lesson = i + Number(b.dataset.go); save(); draw(); }));
      const bb = view.querySelector('[data-build]'); if (bb) bb.addEventListener('click', () => setMode('build'));
      const body = view.querySelector('.kl-lbody');
      try { LESSONS[i].draw(body, cyc()); } catch (e) { body.innerHTML = notice('Something went wrong drawing this lesson: ' + esc(e.message), 'bad'); }
    }
    const P = t => '<p>' + t + '</p>';
    const tip = t => '<p class="kl-tip">' + t + '</p>';

    function lessonCycle(el, c) {
      const F = frame({ cycles: 1 }), syl = K.jatiOf(c.gati);
      const parts = []; for (let b = 0; b < c.beats; b++) parts.push({ role: 'count', syl: syl.slice(), part: b, label: 'beat ' + (b + 1) });
      const R = { layout: K.layoutParts(F, parts) };
      el.innerHTML = P('A korvai or a tihai is arithmetic. Everything is counted in <b>pulses</b> (maatras), so the first step is to know how many pulses one cycle (avartanam) of your tala holds.') +
        P('<b>' + esc(c.name) + '</b> has angas of ' + esc(c.angaText) + ' aksharas' + (c.kalai > 1 ? ', each split into ' + c.kalai + ' beats (kalai ' + c.kalai + ')' : '') + '. In ' + esc(K.GATI_NAME[c.gati].toLowerCase()) + ' gati each beat holds ' + plural(c.gati, 'pulse') + ', recited as “' + esc(syl.join(' ')) + '”. One avartanam is therefore <b>' + c.pulses + ' pulses</b>.') +
        stepsHTML(F.steps.slice(0, 1)) + '<div class="kl-gb"></div>' +
        tip('Change the tala, gati or kalai at the top: the count, the grid and every lesson after this one follow. Above each beat is its kriya: ● a clap, ○ a wave, • a finger count.');
      gridBlock(el.querySelector('.kl-gb'), c, R, null, { summary: c.pulses + ' pulses = one cycle', check: false });
    }

    function lessonMora(el, c) {
      const st = S.l2, T = 3 * st.P + 2 * st.G, cycles = Math.max(1, Math.ceil(T / c.pulses)), land = T - cycles * c.pulses;
      const F = frame({ cycles, start: 0, land, counting: 'end' });
      const R = F.ok ? K.moraPlan(F, { P: st.P, G: st.G }) : { error: F.error };
      el.innerHTML = P('A <b>mora</b> (a <b>tihai</b> in Hindustani music) says one phrase three times, with the same gap between: <i>statement · gap · statement · gap · statement</i>. The gaps must be equal; the statements identical, or shaped in an orderly way (lesson 5). It can start anywhere and resolves to sam, or to the song’s eduppu.') +
        P('With statements of <b>P</b> pulses and gaps of <b>G</b>, it lasts <b>3P + 2G</b>: there is no gap after the third statement.') +
        '<div class="kl-try"><b>Try it</b>' + stepper('P', 'Statement P', st.P, 1, 24) + stepper('G', 'Gap G', st.G, 0, 16) + '</div>' +
        '<div class="kl-big">3 × ' + st.P + ' + 2 × ' + st.G + ' = <b>' + T + '</b> pulses</div>' +
        P('With gaps it is a <i>damdar</i> tihai; with none, a <i>bedam</i> (3P = T, so T must divide by 3). To fill one cycle of ' + c.pulses + ' with P = ' + st.P + ', the gap must be G = (' + c.pulses + ' − 3 × ' + st.P + ') ÷ 2 = <b>' + ((c.pulses - 3 * st.P) / 2) + '</b>' + ((c.pulses - 3 * st.P) < 0 ? ': too long a statement.' : (c.pulses - 3 * st.P) % 2 ? ': half a pulse, because P and the cycle differ in parity (odd and even); it works only if a pulse splits in two (Unit 3 Ex. 8.4).' : '.')) +
        (R.error ? notice(esc(R.error), 'bad') : notice(land === 0 ? 'Started on sam, it fills ' + plural(cycles, 'cycle') + ' exactly: the closing “tha” lands on sam. ✓' : 'Started on sam, it ends ' + esc(where(c, land)) + ', so it does not land on sam. To land, it would have to start ' + plural(-land, 'pulse') + ' later: that is lesson 3.', land === 0 ? 'ok' : 'warn') + '<div class="kl-gb"></div>');
      wireSteppers(el, { P: { min: 1, max: 24, get: () => st.P, set: v => { st.P = v; save(); draw(); } }, G: { min: 0, max: 16, get: () => st.G, set: v => { st.G = v; save(); draw(); } } });
      if (!R.error) gridBlock(el.querySelector('.kl-gb'), c, R, F, { summary: 'from sam', check: false });
    }

    function lessonChart(el, c) {
      const st = S.l3, ch = K.seriesChart(c.pulses, 3), on = st.counting === 'on';
      const T = 3 * st.a + 2 * st.k, o = K.offsetFor(on ? T + 1 : T, c.pulses, { counting: st.counting });
      const F = frame({ cycles: Math.max(1, o.cycles), start: o.start, land: 0, counting: st.counting });
      const R = F.ok ? K.moraPlan(F, { P: st.a, G: st.k }) : { error: F.error };
      el.innerHTML = P('To land on sam, a mora must start early enough. Count back from sam: leave <b>off</b> pulses after sam, then begin, where off = C − (the total mod C). Balaji (2024) teaches this with a chart for each tala: down the side, the statement a; across the top, the gap k; in each cell, the total 3a + 2k and its offset.') +
        P('Pick a cell. The mora is drawn starting at its offset, and it lands on sam.') +
        '<div class="kl-try"><b>Counting</b>' + chips('cnt', [{ v: 'end', label: 'Count to sam', sub: 'then “tha” on sam' }, { v: 'on', label: 'Last stroke on sam', sub: 'tabla style: +1' }], st.counting) + '</div>' +
        '<div class="kl-chartwrap"><table class="kl-chart"><caption>' + esc(c.name) + ', ' + c.pulses + ' pulses: total / offset' + (on ? ' (the last stroke on sam: one more pulse)' : '') + '</caption><thead><tr><th>a \\ k</th>' + ch.rows[0].cells.map(x => '<th>' + x.k + '</th>').join('') + '</tr></thead><tbody>' +
          ch.rows.map(r => '<tr><th>' + r.a + '</th>' + r.cells.map(x => { const tot = on ? x.total + 1 : x.total, off = K.offsetFor(tot, c.pulses, { counting: st.counting }).start, sel = r.a === st.a && x.k === st.k; return '<td><button type="button" data-ak="' + r.a + ',' + x.k + '"' + (sel ? ' aria-pressed="true"' : '') + ' title="' + r.a + ' (' + x.k + ') ' + r.a + ' (' + x.k + ') ' + r.a + '">' + tot + '<small>' + off + '</small></button></td>'; }).join('') + '</tr>').join('') +
        '</tbody></table></div>' +
        (R.error ? notice(esc(R.error), 'bad') : '<div class="kl-big">' + st.a + ' (' + st.k + ') ' + st.a + ' (' + st.k + ') ' + st.a + ' = ' + T + (on ? ' + 1' : '') + ' → leave <b>' + o.start + '</b> (' + esc(K.beatsText(o.start, c.gati)) + ')</div>' + stepsHTML(R.steps.slice(1)) + '<div class="kl-gb"></div>');
      wireChips(el, { cnt: v => { st.counting = v; save(); draw(); } });
      el.querySelectorAll('[data-ak]').forEach(b => b.addEventListener('click', () => { const [a, k] = b.dataset.ak.split(',').map(Number); st.a = a; st.k = k; save(); draw(); const nb = view.querySelector('[data-ak="' + a + ',' + k + '"]'); if (nb) nb.focus(); }));
      if (!R.error) gridBlock(el.querySelector('.kl-gb'), c, R, F, { summary: 'starts ' + K.beatsText(o.start, c.gati) + ' after sam' });
    }

    function solutionChips(sols, pick, key, label) {
      return '<div class="kl-sols" role="group" aria-label="' + esc(label || 'Solutions') + '">' + sols.map((s, k) => '<button type="button" class="kl-sol" data-' + key + '="' + k + '" aria-pressed="' + (k === pick) + '">' + s.html + '</button>').join('') + '</div>';
    }
    function moraSolHTML(s, k) {
      return '<b>' + (s.n === 'buildup' ? '1·2·3 ' : s.n > 3 ? s.n + '×' : '') + s.P + ' (' + s.G + ')</b><small>' + esc(s.eq) + '</small>' + (k < 3 ? '<em>suggested</em>' : '') + (s.beatAligned ? '<i title="every statement starts at the same place in the beat">♪</i>' : '') + (s.gapless ? '<i title="no karvai: bedam">no gap</i>' : '');
    }
    function lessonSolve(el, c) {
      const st = S.l4, F = frame({ cycles: st.cycles, counting: st.counting });
      if (F.error) { el.innerHTML = notice(esc(F.error), 'bad'); return; }
      const sols = K.moraSolutions(F.total, { gati: c.gati }), pick = Math.min(st.pick, Math.max(0, sols.length - 1));
      const halves = st.counting === 'end' ? K.halfTihais(F.total) : [], hp = st.half != null && st.half >= 0 && st.half < halves.length ? st.half : -1;
      const D = hp >= 0 ? K.doubledFrame(F) : null;
      const R = hp >= 0 ? K.moraPlan(D, { P: 2 * halves[hp].P, G: 2 * halves[hp].G }) : sols.length ? K.moraPlan(F, sols[pick]) : null;
      el.innerHTML = P('Now turn it around: fix the space and solve <b>3P + 2G = N</b>. G = (N − 3P) ÷ 2 must be a whole number, so P and N must be both odd or both even. Every N from 5 up has a solution (and 3); 1, 2 and 4 have none.') +
        P('Gaps of zero give a tihai without karvai, which tabla players call <i>bedam</i>; with gaps it is <i>damdar</i>. Solutions marked ♪ start every statement at the same place in the beat, which is easiest to feel.') +
        '<div class="kl-try"><b>Try it</b>' + stepper('cy', 'Avartanams', st.cycles, 1, 4) + chips('cnt', [{ v: 'end', label: 'Count to sam' }, { v: 'on', label: 'Last stroke on sam' }], st.counting) + '</div>' +
        stepsHTML(F.steps.slice(1)) +
        '<p class="kl-solhead"><b>' + sols.length + ' solutions</b> for N = ' + F.total + '. Pick one:</p>' + solutionChips(sols.map((s, k) => ({ html: moraSolHTML(s, k) })), hp >= 0 ? -1 : pick, 'sol') +
        (halves.length ? '<p class="kl-solhead">And ' + plural(halves.length, 'more') + ' with a half-pulse gap (P of the other parity; drawn at two cells a pulse):</p>' + solutionChips(halves.map(h => ({ html: '<b>' + h.P + ' (' + h.G + ')</b><small>' + esc(h.eq) + '</small><i>½</i>' })), hp, 'hs', 'Half-gap tihais') : '') +
        (R ? checksHTML(R) + '<div class="kl-gb"></div>' : notice('No mora fills ' + F.total + ' pulses.', 'bad'));
      wireSteppers(el, { cy: { min: 1, max: 4, get: () => st.cycles, set: v => { st.cycles = v; st.pick = 0; save(); draw(); } } });
      wireChips(el, { cnt: v => { st.counting = v; st.pick = 0; save(); draw(); } });
      el.querySelectorAll('[data-sol]').forEach(b => b.addEventListener('click', () => { st.pick = +b.dataset.sol; st.half = -1; save(); draw(); }));
      el.querySelectorAll('[data-hs]').forEach(b => b.addEventListener('click', () => { st.half = +b.dataset.hs; save(); draw(); }));
      if (R && !R.error) gridBlock(el.querySelector('.kl-gb'), hp >= 0 ? D.cycle : c, R, hp >= 0 ? D : F, { summary: hp >= 0 ? halves[hp].eq + ' (two cells a pulse)' : sols[pick].eq, check: hp < 0 });
    }

    function lessonShapes(el, c) {
      const st = S.l5, cycles = Math.max(roomy(c), st.n > 3 ? Math.ceil(40 / c.pulses) : 1), F = frame({ cycles });
      const shp = st.n === 'buildup' ? 'sama' : st.shape;
      const sols = F.ok ? K.moraSolutions(F.total, { gati: c.gati, n: st.n }).filter(s => shp === 'sama' || s.P >= 3) : [];
      const s = sols[0], R = s ? K.moraPlan(F, { P: s.P, G: s.G, n: st.n, shape: shp }) : null;
      el.innerHTML = P('The statements need not be equal. Grow them by one each time, <b>(5) (6) (7)</b>, or shrink them, <b>(7) (6) (5)</b>, and the total stays the same, because the average does not change (Nelson; Balaji calls it averaging). The shapes have names from the yatis: growing is <i>srotovaha</i>, a river widening to the sea; shrinking is <i>gopuccha</i>, a cow’s tail.') +
        P('A <b>series</b> says each statement two or three times before the gap: <b>aa (k) aa (k) aa = 6a + 2k</b> and <b>aaa (k) aaa (k) aaa = 9a + 2k</b> (Balaji 2024). Shaped, 7 7 7 (2) 8 8 8 (2) 9 9 9 still makes 76.') +
        '<div class="kl-try"><b>Shape</b>' + chips('shape', [{ v: 'sama', label: barsHTML([3, 3, 3]) + 'Equal', sub: 'sama' }, { v: 'srotovaha', label: barsHTML([2, 3, 4]) + 'Growing', sub: 'srotovaha' }, { v: 'gopuccha', label: barsHTML([4, 3, 2]) + 'Shrinking', sub: 'gopuccha' }], st.shape) +
        '<b>Repeat</b>' + chips('n', [{ v: 3, label: '× 3', sub: 'a (k) a (k) a' }, { v: 6, label: '× 6', sub: 'aa (k) aa (k) aa' }, { v: 9, label: '× 9', sub: 'aaa (k) …' }, { v: 'buildup', label: '1 · 2 · 3', sub: 'a (k) aa (k) aaa' }], st.n) + '</div>' +
        (st.n === 'buildup' ? P('The <b>build-up</b> says the statement once, twice, then three times, with two equal gaps: 6a + 2k. It is the uttaranga of the slides’ standard 96-pulse korvai: Thadiginathom (Dhinku × 3) Thadiginathom × 2 (Dhinku × 3) Thadiginathom × 3 (Unit 3 Ex. 7.1). It has no shaped form.') : '') +
        (R && !R.error ? stepsHTML(R.steps.filter(x => x.id === 'span' || x.id === 'eq')) + '<div class="kl-gb"></div>' : notice('No ' + (st.n > 3 ? 'series' : 'mora') + ' of this shape fits ' + (F.ok ? F.total : '') + ' pulses here; try another repeat or a longer tala.', 'warn'));
      wireChips(el, { shape: v => { st.shape = v; save(); draw(); }, n: v => { st.n = v === 'buildup' ? 'buildup' : +v; save(); draw(); } });
      if (R && !R.error) gridBlock(el.querySelector('.kl-gb'), c, R, F, { summary: R.lens.join(' · ') + (s.G ? ', gaps of ' + s.G : ''), check: shp === 'sama' && st.n !== 'buildup' });
    }

    function korvaiBlock(el, c, F, st, intro) {
      const fits = K.gatiFits(F.total, c.beats).filter(x => x.gati !== c.gati);
      const X = exploreBlock(el, c, F, st.exs || st, st.exs ? 'korvai' : 'ex', 'korvai', { shape: 'any' }, intro + '<p class="kl-solhead"><b>Explore the korvais.</b> Every split of the span, every purvanga that fills it, every mora that ends it, and two sollu textures; step through them, filter them, or let the creativity dial choose.</p>',
        'No balanced korvai fits ' + F.total + ' pulses. Add an avartanam.',
        R => ratioHTML(R.V, R.U) + stepsHTML(R.steps.filter(x => ['split', 'purvanga', 'uttaranga'].includes(x.id))) + '<div class="kl-gb"></div>' + checksHTML(R) +
          notice(esc(R.thrice.text) + (fits.some(x => x.ok) ? ' Recited in ' + fits.filter(x => x.ok).map(x => K.GATI_NAME[x.gati].toLowerCase() + ' gati (' + plural(x.cycles, 'cycle') + ')').join(' or ') + ', the same ' + F.total + ' syllables also fill whole cycles (Balaji 2024: a gati change).' : ''), R.thrice.ok ? 'ok' : 'warn'));
      if (X) gridBlock(el.querySelector('.kl-gb'), X.c2, X.R, X.F2, { summary: X.R.V + ' + ' + X.R.U + ' = ' + F.total });
      return X && X.R;
    }
    function lessonKorvai(el, c) {
      const st = S.l6, F = frame({ cycles: st.cycles });
      const intro = P('A <b>korvai</b> joins two parts: the <b>purvanga</b>, which introduces and develops an idea, and the <b>uttaranga</b>, a mora that ends it (Balaji 2024). Their lengths add up to the span, and their balance stays between 30 : 70 and 70 : 30.') +
        P('If the purvanga divides by 3 it can be a phrase and its karvai three times; any length can also be a pattern (lesson 8). Otherwise shape it as a <b>yati</b>: lines that shrink (gopuccha), grow (srotovaha), swell (mridanga) or pinch (damaru). Or use Balaji’s rule: take away 7 (1 + 2 + 4) or 14 (2 + 4 + 8) until it divides by 3, and put prefixes of 1, 2 and 4 before the three phrases.') +
        '<div class="kl-try"><b>Try it</b>' + stepper('cy', 'Avartanams', st.cycles, 1, 4) + '</div>';
      if (F.error) { el.innerHTML = intro + notice(esc(F.error), 'bad'); }
      else korvaiBlock(el, c, F, st, intro);
      wireSteppers(el, { cy: { min: 1, max: 4, get: () => st.cycles, set: v => { st.cycles = v; st.pick = 0; st.pv = 0; save(); draw(); } } });
    }

    function lessonEduppu(el, c) {
      const st = S.l7, C = c.pulses;
      st.land = Math.max(-(C - 1), Math.min(C - 1, st.land)); st.start = Math.max(-(C - 1), Math.min(C - 1, st.start));
      const F = frame({ cycles: roomy(c), start: st.start, land: st.land });
      const sols = F.ok ? K.moraSolutions(F.total, { gati: c.gati }) : [], R = sols.length ? K.moraPlan(F, sols[0]) : null;
      const kind = x => x === 0 ? 'sama' : x > 0 ? 'anagata: after sam' : 'atita: before sam';
      el.innerHTML = P('A song does not always begin on sam. Its <b>eduppu</b> is where it begins: <i>sama</i> (on sam), <i>atita</i> (before sam) or <i>anagata</i> (after sam). A mora or korvai that ends a passage lands on the eduppu, so the song can come straight back in.') +
        P('The space is then <b>cycles × C + eduppu − start</b>. A start before sam is atita too: the grid then shows the cycle before.') +
        '<div class="kl-try"><b>Try it</b>' + stepper('ed', 'Lands on the eduppu', st.land, -(C - 1), C - 1, esc(kind(st.land) + (st.land ? ', ' + K.beatsText(st.land, c.gati) : ''))) + stepper('st', 'Starts at', st.start, -(C - 1), C - 1, esc(st.start === 0 ? 'on sam' : where(c, st.start))) + '</div>' +
        (F.error ? notice(esc(F.error), 'bad') : stepsHTML(F.steps.slice(1, 2)) + (R ? '<div class="kl-big">' + esc(sols[0].eq) + '</div><div class="kl-gb"></div>' + checksHTML(R) + notice(esc(K.korvaiThrice(F).text), K.korvaiThrice(F).ok ? 'ok' : 'warn') : notice('No mora fills ' + F.total + ' pulses.', 'bad')));
      wireSteppers(el, { ed: { min: -(C - 1), max: C - 1, get: () => st.land, set: v => { st.land = v; save(); draw(); } }, st: { min: -(C - 1), max: C - 1, get: () => st.start, set: v => { st.start = v; save(); draw(); } } });
      if (R) gridBlock(el.querySelector('.kl-gb'), c, R, F, { summary: 'lands ' + (st.land === 0 ? 'on sam' : where(c, st.land)) });
    }

    function trikaalaBlock(el, c, st, intro) {
      const R = K.trikaala({ fam: S.fam, L: S.L, kalai: S.kalai, n: st.n, variant: st.variant });
      el.innerHTML = intro + '<div class="kl-try"><b>Try it</b>' + stepper('tn', 'Jati of', st.n, 3, 10, esc(K.jatiOf(st.n).join(' '))) +
        chips('tv', [{ v: 'full', label: 'Full', sub: '1, 2, 4 times' }, { v: 'gap', label: 'Concert', sub: 'third speed ×3, a gap first' }, { v: 'lead', label: 'Concert', sub: 'the fourth moved to the front' }], st.variant) + '</div>' +
        (R.error ? notice(esc(R.error), 'bad') : stepsHTML(R.steps) + '<div class="kl-gb"></div>' + checksHTML(R));
      wireSteppers(el, { tn: { min: 3, max: 10, get: () => st.n, set: v => { st.n = v; save(); draw(); } } });
      wireChips(el, { tv: v => { st.variant = v; save(); draw(); } });
      if (!R.error) gridBlock(el.querySelector('.kl-gb'), R.frame.cycle, R, R.frame, { summary: 'start on beat ' + (R.startBeat + 1), check: false });
    }
    function lessonTrikaala(el, c) {
      trikaalaBlock(el, c, S.l8, P('<b>Trikaala</b> is how students learn to place a phrase (Balaji 2024): recite a jati of n once at one syllable a beat, twice at two, and four times at four. Each speed takes n beats, so 3n beats in all; count back from sam to find where to begin. In a concert the third speed is said three times, and the missing one is either left as a gap at the start or moved before the first speed.') +
        P('This exercise always counts four pulses a beat, so that the third speed has one pulse a syllable.'));
    }

    function lessonChakradar(el, c) {
      const st = S.l9, minC = Math.max(1, Math.ceil(40 / c.pulses));
      if (st.cycles < minC) st.cycles = Math.min(8, minC);
      const F = frame({ cycles: st.cycles, counting: st.counting });
      const pure = st.mode === 'pure', halves = pure && st.halves && st.counting === 'end';
      const sols = !F.ok ? [] : pure ? K.chakkardarSolutions(F.total, { halves, limit: 12 }) : K.chakradarSolutions(F.total, { gati: c.gati, limit: 8 }), pick = Math.min(st.pick, Math.max(0, sols.length - 1));
      const R = sols.length ? (pure ? K.chakkardarPlan(F, sols[pick]) : K.chakradarPlan(F, sols[pick])) : null, RF = R && R.frame ? R.frame : F;
      el.innerHTML = P('The idea nests one level up. A <b>chakkardar</b> tihai is a tihai played as a tihai: the inner tihai 3P₁ + 2G₁ three times with outer gaps G₂, so <b>9P₁ + 6G₁ + 2G₂ = T</b> and the phrase is heard nine times (Unit 3 §8.1). Hindustani drummers also put a mukhra before each inner tihai, the <b>chakradar</b>: 3 × (M + 3t + 2g) + 2G (digitabla), where only the last tihai lands. Counting the last stroke on sam, two cycles of a 16-beat tala is 33 = 3 × (2 + 3 × 3).') +
        '<div class="kl-try"><b>Try it</b>' + chips('chm', [{ v: 'pure', label: 'Chakkardar', sub: '9P₁ + 6G₁ + 2G₂' }, { v: 'mukhra', label: 'With a mukhra', sub: '3(M + 3t + 2g) + 2G' }], st.mode) + stepper('cy', 'Avartanams', st.cycles, minC, Math.max(4, minC)) + chips('cnt', [{ v: 'on', label: 'Last stroke on sam' }, { v: 'end', label: 'Count to sam' }], st.counting) +
          (pure && st.counting === 'end' ? chips('chh', [{ v: 0, label: 'Whole gaps' }, { v: 1, label: 'Half gaps too', sub: 'G₂ may be x.5' }], st.halves ? 1 : 0) : '') + '</div>' +
        (R && !R.error ? solutionChips(sols.map((s, k) => ({ html: '<b>' + (pure ? s.P1 + ' (' + s.G1 + ') · ' + s.G2 : s.M + ' + ' + s.t + ' (' + s.g + ')') + '</b><small>' + esc(s.eq) + '</small>' + (k < 2 ? '<em>suggested</em>' : '') + (s.half ? '<i>½</i>' : '') })), pick, 'ch', 'Tihais of tihais') + stepsHTML(R.steps.filter(x => x.id !== 'cycle')) + '<div class="kl-gb"></div>' : notice('No ' + (pure ? 'chakkardar' : 'chakradar') + ' fits ' + (F.ok ? F.total : '') + ' pulses; add an avartanam' + (pure && st.counting === 'end' && !st.halves ? ' or allow half gaps' : '') + '.', 'warn'));
      wireSteppers(el, { cy: { min: minC, max: Math.max(4, minC), get: () => st.cycles, set: v => { st.cycles = v; st.pick = 0; save(); draw(); } } });
      wireChips(el, { cnt: v => { st.counting = v; st.pick = 0; save(); draw(); } });
      wireChips(el, { chm: v => { st.mode = v; st.pick = 0; save(); draw(); }, chh: v => { st.halves = +v; st.pick = 0; save(); draw(); } });
      el.querySelectorAll('[data-ch]').forEach(b => b.addEventListener('click', () => { st.pick = +b.dataset.ch; save(); draw(); }));
      if (R && !R.error) gridBlock(el.querySelector('.kl-gb'), RF.cycle, R, RF, { summary: sols[pick].eq + (R.frame ? ' (two cells a pulse)' : ''), check: !R.frame });
    }

    /* ---------- v0.8.1: the Unit 3 lessons ---------- */
    // a free passage from sam: phrases of the given lengths (one nested family), ending wherever it ends
    function passage(c, lens, gap) {
      const S = lens.reduce((a, b) => a + b, 0) + (gap || 0) * lens.length, cycles = Math.max(1, Math.ceil(S / c.pulses)), land = S - cycles * c.pulses;
      if (cycles > 8) return { error: 'This passage is ' + S + ' pulses, more than 8 avartanams; the lab draws up to 8.' };
      const F = frame({ cycles, start: 0, land, counting: 'end' });
      if (F.error) return { error: F.error };
      const fam = K.nestedPhrases(lens), parts = [];
      lens.forEach((l, k) => { parts.push({ role: 'purvanga', syl: fam[k], part: k, label: 'phrase ' + (k + 1) + ': ' + l }); if (gap) parts.push({ role: 'pgap', syl: new Array(gap).fill(','), part: k, label: 'karvai' }); });
      return { F, R: { layout: K.layoutParts(F, parts) }, S, land, cycles };
    }
    const endsText = (c, p) => p.land === 0 ? 'From sam it fills ' + plural(p.cycles, 'cycle') + ' exactly: the closing “tha” lands on sam. ✓' : 'From sam it ends ' + where(c, p.land) + ', not on sam.';
    const termsHTML = t => '<div class="kl-terms">' + barsHTML(t, 'tall') + '<code>' + esc(t.join(' · ')) + '</code></div>';

    function lessonDrift(el, c) {
      const st = S.ld, C = c.pulses, D = K.drift(st.L, C, c.gati);
      const ends = new Map(D.visits.map(v => [v.end, v.r]));
      let strip = '<div class="kl-strip" role="img" aria-label="where each repetition ends">';
      for (let p = 0; p < C; p++) strip += '<i class="' + (ends.has(p) ? 'on' : '') + (p % c.gati === 0 ? ' beat' : '') + (p === 0 ? ' sam' : '') + '" title="offset ' + p + (ends.has(p) ? ': repetition ' + ends.get(p) + ' ends here' : ': never reached') + '">' + (ends.has(p) ? ends.get(p) : '') + '</i>';
      strip += '</div>';
      let grid = '';
      if (D.cycles <= 8) {
        const F = frame({ cycles: D.cycles }), parts = [];
        for (let r = 0; r < D.reps; r++) parts.push({ role: 'count', syl: K.statementOf(st.L), part: r, label: 'repetition ' + (r + 1) });
        grid = { F, R: { layout: K.layoutParts(F, parts) } };
      }
      el.innerHTML = P('Repeat one phrase of <b>L</b> pulses from sam, over and over. Each repetition ends L pulses further on, so it drifts against the cycle (graha-bheda, a shifted reference point) until the two meet again on sam. They meet after <b>lcm(L, C)</b> pulses: C ÷ gcd(L, C) repetitions, filling L ÷ gcd(L, C) cycles. On the way the phrase only ever ends on multiples of gcd(L, C), each once (Unit 3 §6.3).') +
        P('The same arithmetic gives nadai-bheda, a phrase grouped against the beat: groups of L meet a beat every lcm(L, gati) pulses (groups of 3 over 4 a beat meet every 12: “4 against 3”).') +
        '<div class="kl-try"><b>Try it</b>' + stepper('dl', 'Phrase L', st.L, 1, 48) + '</div>' +
        '<div class="kl-big">gcd(' + st.L + ', ' + C + ') = ' + D.gcd + ' · lcm = <b>' + D.lcm + '</b> pulses = ' + plural(D.reps, 'repetition') + ' = ' + plural(D.cycles, 'cycle') + '</div>' +
        '<p class="kl-solhead">Where each repetition ends, in one cycle of ' + C + ' pulses (0 is sam):</p>' + strip +
        notice(esc(D.text) + ' Groups of ' + st.L + ' meet a beat every ' + D.beatMeet + ' pulses (' + plural(D.beatMeet / c.gati, 'beat') + ').', D.gcd === C ? 'ok' : '') +
        (grid ? '<div class="kl-gb"></div>' : notice('Back on sam only after ' + plural(D.cycles, 'cycle') + ': too long to draw here.', 'warn'));
      wireSteppers(el, { dl: { min: 1, max: 48, get: () => st.L, set: v => { st.L = v; save(); draw(); } } });
      if (grid) gridBlock(el.querySelector('.kl-gb'), c, grid.R, grid.F, { summary: D.reps + ' × ' + st.L + ' = ' + D.lcm, check: false });
    }

    const YATI_ICON = { sama: [3, 3, 3], srotovaha: [2, 3, 4], gopuccha: [4, 3, 2], mridanga: [2, 4, 2], damaru: [4, 2, 4], vishama: [3, 1, 4] };
    function lessonYati(el, c) {
      const st = S.ly, I = K.YATI_INFO, sym = st.kind === 'mridanga' || st.kind === 'damaru';
      let y = null, note = '';
      if (st.kind === 'vishama') {
        const t = String(st.terms).split(/[^0-9]+/).filter(Boolean).map(Number).filter(x => x >= 1 && x <= 32).slice(0, 12);
        if (t.length) { y = K.yatiSum('vishama', { terms: t }); const cl = K.classifyYati(t); note = cl.kind === 'vishama' ? 'Read as a yati, ' + t.join(', ') + ' is vishama: ' + cl.why + '.' : t.join(', ') + ' is not irregular: it is a ' + I[cl.kind].name.toLowerCase() + ' yati.'; }
      } else if (st.fit) {
        const target = st.fit * c.pulses, r = K.fitYati(st.kind, target, sym ? { m: st.m, d: st.d } : { n: st.n, d: st.d });
        if (r.error) note = 'To fill ' + plural(st.fit, 'cycle') + ' (' + target + ' pulses): ' + r.error;
        else { y = r; note = 'Solved for the ' + (st.kind === 'damaru' ? 'outer' : 'first') + ' phrase: it fills ' + plural(st.fit, 'cycle') + ' of ' + c.name + ' exactly.'; }
      }
      if (!y && st.kind !== 'vishama') y = K.yatiSum(st.kind, sym ? (st.kind === 'mridanga' ? { a: st.a, d: st.d, m: st.m } : { b: st.a, d: st.d, m: st.m }) : { a: st.a, d: st.d, n: st.n });
      const p = y && y.ok ? passage(c, y.terms, 0) : null;
      el.innerHTML = P('A <b>yati</b> is the shape made by the lengths of successive phrases. Standard texts list six (Unit 3 §10.1). Each regular one is an arithmetic progression, or two of them back to back, so each has a closed-form sum:') +
        '<div class="kl-chartwrap"><table class="kl-ytable"><tbody>' + K.YATIS.map(k => '<tr' + (k === st.kind ? ' class="on"' : '') + '><td>' + barsHTML(YATI_ICON[k], 'small') + '</td><th>' + esc(I[k].name) + '</th><td>' + esc(I[k].shape) + '</td><td>' + esc(I[k].picture) + '</td><td><code>' + esc(I[k].sum) + '</code></td></tr>').join('') + '</tbody></table></div>' +
        '<div class="kl-try"><b>Yati</b>' + chips('yk', K.YATIS.map(k => ({ v: k, label: barsHTML(YATI_ICON[k]) + I[k].name.replace(/ \(.*/, '') })), st.kind) + '</div>' +
        (st.kind === 'vishama' ? '<div class="kl-try"><b>Lengths</b><div class="kl-field"><span class="kl-lab">Phrase lengths</span><input type="text" class="kl-text" data-fk="vterms" value="' + esc(st.terms) + '" aria-label="Phrase lengths, separated by spaces"></div></div>'
          : '<div class="kl-try"><b>Shape it</b>' + chips('yf', [{ v: 0, label: 'Choose the first phrase' }, { v: 1, label: 'Fit to 1 cycle' }, { v: 2, label: 'Fit to 2 cycles' }], st.fit) +
            (st.fit ? '' : stepper('ya', st.kind === 'damaru' ? 'Outer phrase b' : st.kind === 'gopuccha' ? 'First (longest) a' : 'First phrase a', st.a, 1, 24)) +
            (st.kind === 'sama' ? '' : stepper('yd', 'Step d', st.d, 1, 6)) + (sym ? stepper('ym', 'Steps m to the middle', st.m, 1, 4) : stepper('yn', 'Phrases n', st.n, 2, 9)) + '</div>') +
        (note ? notice(esc(note), /:\s/.test(note) && !y ? 'warn' : '') : '') +
        (y && y.ok ? termsHTML(y.terms) + '<div class="kl-big">' + esc(y.formula) + '</div>' + (p && !p.error ? notice(esc(endsText(c, p)), p.land === 0 ? 'ok' : '') + '<div class="kl-gb"></div>' : p ? notice(esc(p.error), 'warn') : '')
          : y ? notice('The phrase lengths would be ' + esc(y.terms.join(', ')) + ': every phrase must be at least one pulse.', 'bad') : '') +
        tip('Each line is the end of one long phrase: gopuccha trims it from the front (tha dhi gi na thom, dhi gi na thom, gi na thom …), srotovaha grows it back, so the ending is never disturbed.');
      wireChips(el, { yk: v => { st.kind = v; save(); draw(); }, yf: v => { st.fit = +v; save(); draw(); } });
      wireSteppers(el, { ya: { min: 1, max: 24, get: () => st.a, set: v => { st.a = v; save(); draw(); } }, yd: { min: 1, max: 6, get: () => st.d, set: v => { st.d = v; save(); draw(); } }, yn: { min: 2, max: 9, get: () => st.n, set: v => { st.n = v; save(); draw(); } }, ym: { min: 1, max: 4, get: () => st.m, set: v => { st.m = v; save(); draw(); } } });
      const vt = el.querySelector('[data-fk="vterms"]'); if (vt) vt.addEventListener('change', () => { st.terms = vt.value; save(); draw(); });
      if (p && !p.error) gridBlock(el.querySelector('.kl-gb'), c, p.R, p.F, { summary: y.terms.join(' + ') + ' = ' + y.sum, check: false });
    }

    const PATS = [{ v: 'ap', label: 'AP', sub: 'a, a + d, …' }, { v: 'gp', label: 'GP', sub: 'a, ar, ar², …' }, { v: 'fib', label: 'Fibonacci-like', sub: 'x₁, x₂, x₁ + x₂, …' }, { v: 'squares', label: 'Squares', sub: 'k², (k + 1)², …' }, { v: 'polite', label: 'Polite', sub: 'consecutive integers' }, { v: 'kuraippu', label: 'Kuraippu', sub: 'L, L/2, L/4, …' }];
    function lessonPatterns(el, c) {
      const st = S.lp;
      let info = null, extra = '', err = '';
      const pr = K.politeRuns(st.S);
      if (st.kind === 'ap') info = K.patternInfo({ kind: 'ap', a: st.a, d: st.d, n: st.n });
      else if (st.kind === 'gp') info = K.patternInfo({ kind: 'gp', a: st.a, r: st.r, n: st.n });
      else if (st.kind === 'fib') info = K.patternInfo({ kind: 'fib', x1: st.x1, x2: st.x2, n: st.n });
      else if (st.kind === 'squares') info = K.patternInfo({ kind: 'squares', k: st.k, n: st.n });
      else if (st.kind === 'kuraippu') { const q = Math.pow(2, st.n - 1); if (st.L % q) err = 'L = ' + st.L + ' cannot be halved ' + (st.n - 1) + ' times in whole pulses: it must be a multiple of ' + q + '.'; else info = K.patternInfo({ kind: 'kuraippu', L: st.L, n: st.n }); }
      else if (st.kind === 'polite') {
        const pick = Math.min(st.pp, Math.max(0, pr.runs.length - 1));
        if (pr.runs.length) info = K.patternInfo({ kind: 'polite', a: pr.runs[pick].a, n: pr.runs[pick].n });
        extra = P(st.S + ' has odd divisors ' + pr.oddDivisors.join(', ') + ', so ' + plural(pr.runs.length, 'way') + ' (odd divisors − 1). ' + (pr.powerOf2 ? 'It is a power of 2, so it is impolite: no run of consecutive integers makes it (one Adi cycle, 32, is one of these).' : 'For each odd divisor d > 1 the centre is ' + st.S + ' ÷ d.')) +
          (pr.runs.length ? solutionChips(pr.runs.map(r => ({ html: '<b>' + esc(r.terms.length > 7 ? r.terms.slice(0, 3).join('+') + '+…+' + r.terms[r.terms.length - 1] : r.terms.join('+')) + '</b><small>d = ' + r.d + ': ' + esc(r.rule) + '</small>' })), pick, 'pp', 'Runs') : '');
      }
      const params = {
        ap: [['pa', 'First a', 'a', 1, 16], ['pd', 'Step d', 'd', 1, 6], ['pn', 'Terms n', 'n', 2, 9]],
        gp: [['pa', 'First a', 'a', 1, 8], ['pr', 'Ratio r', 'r', 2, 3], ['pn', 'Terms n', 'n', 2, 6]],
        fib: [['px', 'Seed x₁', 'x1', 1, 12], ['py', 'Seed x₂', 'x2', 1, 12], ['pn', 'Terms n', 'n', 3, 8]],
        squares: [['pk', 'From k', 'k', 1, 5], ['pn', 'Terms n', 'n', 2, 6]],
        polite: [['ps', 'Number S', 'S', 3, 200]],
        kuraippu: [['pl', 'Start L', 'L', 2, 64], ['pn', 'Terms n', 'n', 2, 6]]
      }[st.kind];
      // as a purvanga: the fewest cycles that leave an uttaranga of at least 3 in each of three statements
      let K3 = null, cyc3 = 0, F3 = null;
      if (info) for (let k = 1; k <= 8 && !K3; k++) { const F = frame({ cycles: k }); if (F.ok && Math.floor(F.total / 3) - info.sum >= 3) { K3 = K.statementKorvai(F, { terms: info.terms, pattern: info }); cyc3 = k; F3 = F; if (K3.error) K3 = null; } }
      el.innerHTML = P('A purvanga’s phrases can follow a mathematical pattern, and its length is then the pattern’s sum (Unit 3 §9.3): an <b>arithmetic progression</b> (2, 3, 4, 5, 6, 7 = 27), a <b>geometric progression</b> (2, 4, 8, 16, 32 = 62), a <b>Fibonacci-like</b> run where each phrase is the two before it added (3, 4, 7, 11, 18 = 43; or true Fibonacci 3, 5, 8), <b>squares</b> (1, 4, 9, 16, 25 = 55), a run of <b>consecutive integers</b> (a polite number: 35 = 5 + 6 + 7 + 8 + 9), or <b>kuraippu</b>, halving each time (16, 8, 4, 2, 1 = 31, always short of 2L).') +
        '<div class="kl-try"><b>Pattern</b>' + chips('pk', PATS, st.kind) + '</div>' +
        '<div class="kl-try"><b>Choose</b>' + params.map(([key, lab, f, lo, hi]) => stepper(key, lab, st[f], lo, hi)).join('') + '</div>' + extra +
        (err ? notice(esc(err), 'warn') : '') +
        (info ? termsHTML(info.terms) + '<div class="kl-big">' + esc(info.name) + ': ' + esc(info.formula) + '</div>' : '') +
        (K3 ? '<p class="kl-solhead"><b>As a purvanga:</b> three statements of purvanga ' + info.sum + ' + uttaranga, in ' + plural(cyc3, 'cycle') + ' of ' + esc(c.name) + '.</p>' + stepsHTML(K3.steps.filter(x => ['statement', 'uttaranga'].includes(x.id))) + '<div class="kl-gb"></div>' + checksHTML(K3)
          : info ? notice('A purvanga of ' + info.sum + ' is too long for three statements in up to 8 cycles here.', 'warn') : '');
      wireChips(el, { pk: v => { st.kind = v; st.pp = 0; save(); draw(); } });
      const spec = {}; params.forEach(([key, , f, lo, hi]) => { spec[key] = { min: lo, max: hi, get: () => st[f], set: v => { st[f] = v; st.pp = 0; save(); draw(); } }; });
      wireSteppers(el, spec);
      el.querySelectorAll('[data-pp]').forEach(b => b.addEventListener('click', () => { st.pp = +b.dataset.pp; save(); draw(); }));
      if (K3) gridBlock(el.querySelector('.kl-gb'), c, K3, F3, { summary: K3.lens.join(' + ') + ' = ' + K3.lens.reduce((a, b) => a + b, 0) });
    }

    const KIND_FILTER = [{ v: 'all', label: 'Any pattern' }, { v: 'ap', label: 'AP' }, { v: 'gp', label: 'GP' }, { v: 'fib', label: 'Fibonacci' }, { v: 'squares', label: 'Squares' }, { v: 'polite', label: 'Polite' }, { v: 'kuraippu', label: 'Kuraippu' }, { v: 'yati', label: 'Yatis' }];
    const kindsOf = v => v === 'all' ? null : v === 'yati' ? ['sama', 'srotovaha', 'gopuccha', 'mridanga', 'damaru'] : [v];
    function statementsBlock(el, c, F, st, intro) {
      const X = exploreBlock(el, c, F, st.exs || st, st.exs ? 'statements' : 'ex', 'statements', { kinds: kindsOf(st.kind || 'all') }, intro,
        'No ' + (st.kind && st.kind !== 'all' ? st.kind + ' ' : '') + 'purvanga gives a balanced statement of ' + Math.floor(F.total / 3) + ' here. Try another pattern or another span.',
        (R, F2) => stepsHTML(R.steps.filter(x => ['statement', 'length', 'purvanga', 'uttaranga'].includes(x.id))) + '<div class="kl-gb"></div>' + checksHTML(R) +
          notice('Type: ' + esc(R.type) + (F2.land ? ', and a porutham: it ends on the song’s eduppu.' : '.') + (F2.start !== F.start ? ' The remainder is absorbed by starting ' + plural(F2.start - F.start, 'pulse') + ' later.' : ''), ''));
      if (X) gridBlock(el.querySelector('.kl-gb'), X.c2, X.R, X.F2, { summary: X.R.lens.join(' + ') });
      return X && X.R;
    }
    function progressiveBlock(el, c, F, st, intro) {
      const X = exploreBlock(el, c, F, st.exs || st, st.exs ? 'progressive' : 'exp', 'progressive', {}, intro,
        'No progressive korvai of 2 to 5 statements fits ' + F.total + ' pulses here.',
        R => stepsHTML(R.steps.filter(x => x.id !== 'land')) + '<div class="kl-gb"></div>' + checksHTML(R));
      if (X) gridBlock(el.querySelector('.kl-gb'), X.c2, X.R, X.F2, { summary: X.R.Ps.join(', ') + ' + ' + X.R.U });
    }
    function lessonStatements(el, c) {
      const st = S.lq, F = frame({ cycles: st.cycles }), lc = K.lengthCondition(c.pulses);
      const intro = P('The course notes describe a korvai another way: one <b>statement</b>, a purvanga P and an uttaranga U, played three times, so <b>3(P + U) = kN</b>. Three identical statements need a span that divides by 3: ' + esc(lc.text) + ' Otherwise make the statements unequal (Adi in 2 cycles: 21, 21, 22), or absorb the remainder with an eduppu (Unit 3 §7.3, §7.7).') +
        P('In a <b>progressive</b> korvai the purvanga grows (or shrinks) by a step d from statement to statement while the uttaranga stays: r(mP + d·m(m − 1)/2 + mU) = kN, and only the total must fill the span (Unit 3 Def. 7.4).') +
        '<div class="kl-try"><b>Try it</b>' + stepper('cy', 'Avartanams', st.cycles, 1, 6) + chips('sm', [{ v: 'equal', label: 'Three statements' }, { v: 'prog', label: 'Progressive' }], st.mode) + '</div>' +
        (st.mode === 'equal' ? '<div class="kl-try"><b>Purvanga</b>' + chips('sk', KIND_FILTER, st.kind) + '</div>' : '');
      if (F.error) { el.innerHTML = intro + notice(esc(F.error), 'bad'); }
      else if (st.mode === 'prog') progressiveBlock(el, c, F, st, intro);
      else statementsBlock(el, c, F, st, intro);
      wireSteppers(el, { cy: { min: 1, max: 6, get: () => st.cycles, set: v => { st.cycles = v; st.pick = 0; st.prog = 0; save(); draw(); } } });
      wireChips(el, { sm: v => { st.mode = v; save(); draw(); }, sk: v => { st.kind = v; st.pick = 0; if (st.ex) st.ex.pos = 0; save(); draw(); } });
    }

    function lessonAlgorithms(el, c) {
      const st = S.la, C = c.pulses;
      st.ek = Math.max(-(C - 1), Math.min(C - 1, st.ek));
      const head = P('The slides give two recipes (Unit 3 §9). <b>Samam</b>: build the purvanga, take its remainder M = T(P) mod n, and the uttaranga must be <b>T(U) = (n − M) + kn</b>; an uttaranga of three phrases with two gaps is then a tihai, 3t + 2g = T(U). <b>Edapu</b>: when the song starts k pulses after sam, the korvai runs from sam to that point, mn + k pulses, which must split into three: find the smallest m with 3 | mn + k (n must not be a multiple of 3, or the remainder never changes).') +
        '<div class="kl-try"><b>Algorithm</b>' + chips('al', [{ v: 'samam', label: 'Samam', sub: 'T(U) = (n − M) + kn' }, { v: 'edapu', label: 'Edapu', sub: '3 | mn + k' }], st.alg) + '</div>';
      if (st.alg === 'samam') {
        const R = K.samamKorvai({ fam: S.fam, L: S.L, gati: S.gati, kalai: S.kalai, phrase: st.f, kaarvai: st.p, k: st.k, form: st.form, pick: st.pick });
        const A = R.samam || (R.error ? null : null);
        el.innerHTML = head + '<div class="kl-try"><b>Purvanga</b>' + stepper('af', 'Phrase', st.f, 1, 16) + stepper('ap', 'Kaarvai', st.p, 0, 12) + stepper('ak', 'k (extra cycles)', st.k, 0, 2) +
          chips('au', [{ v: 3, label: 'Tihai', sub: '3t + 2g' }, { v: 'buildup', label: 'Build-up', sub: 't (g) 2t (g) 3t' }], st.form) + '</div>' +
          (A ? '<div class="kl-chartwrap"><table class="kl-chart kl-plain"><thead><tr><th>k</th><th>T(U)</th><th>total</th><th>cycles</th></tr></thead><tbody>' + A.rows.map(r => '<tr' + (r.k === st.k ? ' class="on"' : '') + '><td>' + r.k + '</td><td>' + r.TU + '</td><td>' + r.total + '</td><td>' + r.cycles + '</td></tr>').join('') + '</tbody></table></div>' : '') +
          (R.error ? notice(esc(R.error), 'warn') : solutionChips(R.uttarangaOptions.map((u, k) => ({ html: moraSolHTML(u, k) })), Math.min(st.pick, R.uttarangaOptions.length - 1), 'au2', 'Uttarangas') + stepsHTML(R.steps.filter(x => x.id !== 'cycle')) + '<div class="kl-gb"></div>' + checksHTML(R));
        wireSteppers(el, { af: { min: 1, max: 16, get: () => st.f, set: v => { st.f = v; st.pick = 0; save(); draw(); } }, ap: { min: 0, max: 12, get: () => st.p, set: v => { st.p = v; st.pick = 0; save(); draw(); } }, ak: { min: 0, max: 2, get: () => st.k, set: v => { st.k = v; st.pick = 0; save(); draw(); } } });
        wireChips(el, { al: v => { st.alg = v; save(); draw(); }, au: v => { st.form = v === 'buildup' ? 'buildup' : 3; st.pick = 0; save(); draw(); } });
        el.querySelectorAll('[data-au2]').forEach(b => b.addEventListener('click', () => { st.pick = +b.dataset.au2; save(); draw(); }));
        if (!R.error) gridBlock(el.querySelector('.kl-gb'), c, R, K.korvaiFrame({ fam: S.fam, L: S.L, gati: S.gati, kalai: S.kalai, cycles: R.samam.rows[st.k].cycles }), { summary: R.V + ' + ' + R.U });
        return;
      }
      const E2 = K.edapuAlgorithm(C, st.ek);
      let R = null, G = null;
      if (E2.ok && E2.m <= 8) { G = frame({ cycles: E2.m, land: st.ek }); const o = G.ok ? K.statementOptions(G, { limit: 1 })[0] : null; if (o) R = K.statementKorvai(G, { terms: o.terms, pattern: o }); }
      el.innerHTML = head + '<div class="kl-try"><b>The song starts</b>' + stepper('ae', 'Eduppu k', st.ek, -(C - 1), C - 1, esc(st.ek === 0 ? 'on sam' : where(c, st.ek))) + '</div>' +
        '<div class="kl-chartwrap"><table class="kl-chart kl-plain"><thead><tr><th>m</th><th>' + C + 'm ' + (st.ek < 0 ? '−' : '+') + ' ' + Math.abs(st.ek) + '</th><th>mod 3</th></tr></thead><tbody>' + E2.table.slice(0, 6).map(r => '<tr' + (E2.ok && r.m === E2.m ? ' class="on"' : '') + '><td>' + r.m + '</td><td>' + r.value + '</td><td>' + r.rem + (r.rem === 0 && r.value > 0 ? ' ✓' : '') + '</td></tr>').join('') + '</tbody></table></div>' +
        notice(esc(E2.text), E2.ok ? 'ok' : 'warn') +
        (R ? '<p class="kl-solhead"><b>The korvai:</b> three equal statements of ' + E2.third + ', ending on the eduppu.</p>' + stepsHTML(R.steps.filter(x => ['statement', 'purvanga', 'uttaranga'].includes(x.id))) + '<div class="kl-gb"></div>' + checksHTML(R) : E2.ok ? notice('The span needs ' + plural(E2.m, 'cycle') + '; the lab draws up to 8.', 'warn') : '');
      wireSteppers(el, { ae: { min: -(C - 1), max: C - 1, get: () => st.ek, set: v => { st.ek = v; save(); draw(); } } });
      wireChips(el, { al: v => { st.alg = v; save(); draw(); } });
      if (R) gridBlock(el.querySelector('.kl-gb'), c, R, G, { summary: E2.span + ' = 3 × ' + E2.third });
    }

    const BASES = { k96: { f: 8, p: 8, form: 'buildup', u: 5, g: 9, adi: true, label: 'The slides’ 96', sub: '(8 + 8) × 3, then 5 (9) 5 5 (9) 5 5 5' }, k64: { f: 8, p: 6, form: 3, u: 6, g: 2, adi: true, label: 'The slides’ 64', sub: '(8 + 6) × 3, then 6 (2) 6 (2) 6' } };
    function lessonConstant(el, c) {
      const st = S.lc;
      let base = BASES[st.base], tala = base && base.adi ? { fam: 'triputa', L: 4, gati: 4, kalai: 1 } : { fam: S.fam, L: S.L, gati: S.gati, kalai: S.kalai };
      if (!base) {
        // the learner's tala: a Samam korvai with a phrase of 8 and a kaarvai of 2
        const R0 = K.samamKorvai(Object.assign({ phrase: 8, kaarvai: 2, k: 0, form: 3 }, tala));
        base = R0.error ? null : { f: 8, p: 2, form: 3, u: R0.uttaranga.P, g: R0.uttaranga.G };
      }
      const fam = base ? K.constantTotal(base, { x: 2 }) : null, list = fam ? [Object.assign({ step: 0 }, fam.base, { total: fam.total })].concat(st.method === 'A' ? fam.A : fam.B) : [];
      const pick = Math.min(st.pick, Math.max(0, list.length - 1)), v = list[pick];
      const R = v ? K.constantTotalPlan(Object.assign({ form: base.form, sounded: !!st.sounded }, tala), v) : null;
      const c2 = R && R.frame ? R.frame.cycle : c;
      el.innerHTML = P('A new korvai can keep the old one’s total: whatever is taken from one part is given back to another (the constant-total principle, Unit 3 §7.6). <b>Method A</b> changes only the uttaranga: take 3 from each of its two kaarvais and give the 6 to its phrases (a build-up of 6 phrases gains 1 each, 6t + 2g stays fixed; a tihai of 3 gains 2 each). <b>Method B</b> changes both: take from each purvanga kaarvai and give it to each uttaranga phrase, one for one (p + u stays fixed).') +
        '<div class="kl-try"><b>Start from</b>' + chips('cb', [{ v: 'k96', label: BASES.k96.label, sub: BASES.k96.sub }, { v: 'k64', label: BASES.k64.label, sub: BASES.k64.sub }, { v: 'own', label: 'Your tala', sub: c.name }], st.base) + '</div>' +
        '<div class="kl-try"><b>Method</b>' + chips('cm', [{ v: 'A', label: 'A: the uttaranga only' }, { v: 'B', label: 'B: both parts' }], st.method) + chips('cs', [{ v: 1, label: 'Sounded kaarvais', sub: 'Dhin, Dhinku …' }, { v: 0, label: 'Silent kaarvais' }], st.sounded ? 1 : 0) + '</div>' +
        (base && base.adi ? tip('These are Adi korvais (32 pulses a cycle), drawn in Adi whatever tala is chosen above.') : '') +
        (!fam ? notice('No Samam korvai with a phrase of 8 and a kaarvai of 2 fits ' + esc(c.name) + '; try a slides example.', 'warn')
          : '<div class="kl-big">' + esc(st.method === 'A' ? fam.eqA : fam.eqB) + ' · total ' + fam.total + '</div>' +
            solutionChips(list.map((x, k) => ({ html: '<b>' + (k === 0 ? 'the original' : 'step ' + x.step) + '</b><small>kaarvai ' + x.p + ' · phrase ' + x.u + ' · gap ' + x.g + ' · ' + x.TP + ' + ' + x.TU + '</small>' })), pick, 'cv', 'Variants') +
            (list.length === 1 ? notice('No further variant: a kaarvai would go below zero.', 'warn') : '') +
            (R && !R.error ? '<div class="kl-gb"></div>' + checksHTML(R) : R ? notice(esc(R.error), 'warn') : ''));
      wireChips(el, { cb: v => { st.base = v; st.pick = 0; save(); draw(); }, cm: v => { st.method = v; st.pick = 0; save(); draw(); }, cs: v => { st.sounded = +v; save(); draw(); } });
      el.querySelectorAll('[data-cv]').forEach(b => b.addEventListener('click', () => { st.pick = +b.dataset.cv; save(); draw(); }));
      if (R && !R.error) gridBlock(el.querySelector('.kl-gb'), c2, R, R.frame, { summary: v.TP + ' + ' + v.TU + ' = ' + v.total, check: !st.sounded });
    }

    /* ---------- build ---------- */
    const FORMS = [{ v: 'mora', label: 'Mora / tihai', sub: '3P + 2G' }, { v: 'korvai', label: 'Korvai', sub: 'purvanga + mora' }, { v: 'statements', label: 'Korvai', sub: '(P + U) × 3' }, { v: 'progressive', label: 'Progressive', sub: 'P, P + d, …' }, { v: 'chakradar', label: 'Tihai of tihais', sub: 'chakkardar' }, { v: 'trikaala', label: 'Trikaala', sub: 'three speeds' }];
    function drawBuild() {
      const b = S.b, c = cyc(), C = c.pulses;
      b.start = Math.max(-(C - 1), Math.min(C - 1, b.start)); b.land = Math.max(-(C - 1), Math.min(C - 1, b.land));
      const isT = b.form === 'trikaala';
      view.innerHTML = '<div class="kl-build"><div class="kl-panel">' +
        '<div class="kl-field"><span class="kl-lab">Form</span>' + chips('form', FORMS, b.form) + '</div>' +
        (isT ? '' : '<div class="kl-row2">' + stepper('cy', 'Avartanams', b.cycles, 1, 8) +
          stepper('st', 'Starts at', b.start, -(C - 1), C - 1, esc(b.start === 0 ? 'on sam' : where(c, b.start))) +
          stepper('ed', 'Lands on (eduppu)', b.land, -(C - 1), C - 1, esc(b.land === 0 ? 'sam' : where(c, b.land))) + '</div>' +
          '<div class="kl-field"><span class="kl-lab">Counting</span>' + chips('cnt', [{ v: 'end', label: 'Count to the landing', sub: 'then “tha” on it (Carnatic charts)' }, { v: 'on', label: 'Last syllable on the landing', sub: 'counted (tabla style)' }], b.counting) + '</div>') +
        (b.form === 'statements' ? '<div class="kl-field"><span class="kl-lab">Purvanga pattern</span>' + chips('bk', KIND_FILTER, b.kind || 'all') + '</div>' : '') +
        (b.form === 'chakradar' ? '<div class="kl-field"><span class="kl-lab">Kind</span>' + chips('bm', [{ v: 'any', label: 'Any' }, { v: 'pure', label: 'Chakkardar', sub: '9P₁ + 6G₁ + 2G₂' }, { v: 'mukhra', label: 'With a mukhra', sub: 'chakradar' }], b.cmode || 'any') + '</div>' : '') +
        (b.form === 'mora' ? '<div class="kl-row2"><div class="kl-field"><span class="kl-lab">Repeat</span>' + chips('n', [{ v: 'any', label: 'Any' }, { v: 3, label: '× 3' }, { v: 6, label: '× 6' }, { v: 9, label: '× 9' }, { v: 'buildup', label: '1 · 2 · 3' }], b.n) + '</div>' +
          '<div class="kl-field"><span class="kl-lab">Shape</span>' + chips('shape', [{ v: 'any', label: 'Any' }, { v: 'sama', label: barsHTML([3, 3, 3]) + 'Equal' }, { v: 'srotovaha', label: barsHTML([2, 3, 4]) + 'Growing' }, { v: 'gopuccha', label: barsHTML([4, 3, 2]) + 'Shrinking' }], b.shape) + '</div></div>' : '') +
        '</div><div class="kl-result"></div></div>';
      const res = view.querySelector('.kl-result');
      wireChips(view.querySelector('.kl-panel'), { form: v => { b.form = v; b.pick = 0; b.pv = 0; b.prog = 0; save(); draw(); }, cnt: v => { b.counting = v; b.pick = 0; save(); draw(); }, n: v => { b.n = v === 'buildup' || v === 'any' ? v : +v; b.pick = 0; save(); draw(); }, shape: v => { b.shape = v; save(); draw(); }, bk: v => { b.kind = v; b.pick = 0; if (b.exs.statements) b.exs.statements.pos = 0; save(); draw(); }, bm: v => { b.cmode = v; b.pick = 0; save(); draw(); } });
      wireSteppers(view.querySelector('.kl-panel'), {
        cy: { min: 1, max: 8, get: () => b.cycles, set: v => { b.cycles = v; b.pick = 0; b.pv = 0; save(); draw(); } },
        st: { min: -(C - 1), max: C - 1, get: () => b.start, set: v => { b.start = v; b.pick = 0; save(); draw(); } },
        ed: { min: -(C - 1), max: C - 1, get: () => b.land, set: v => { b.land = v; b.pick = 0; save(); draw(); } }
      });
      try {
        if (isT) { trikaalaBlock(res, c, { get n() { return b.tn; }, set n(v) { b.tn = v; }, get variant() { return b.tvar; }, set variant(v) { b.tvar = v; } }, ''); return; }
        const F = frame({ cycles: b.cycles, start: b.start, land: b.land, counting: b.counting });
        if (F.error) { res.innerHTML = notice(esc(F.error), 'bad'); return; }
        const head = '<div class="kl-card">' + stepsHTML(F.steps) + '</div>';
        if (b.form === 'korvai') { korvaiBlock(res, c, F, b, head); return; }
        if (b.form === 'statements') { b.kind = b.kind || 'all'; statementsBlock(res, c, F, b, head); return; }
        if (b.form === 'progressive') { b.prog = b.prog || 0; progressiveBlock(res, c, F, b, head); return; }
        if (b.form === 'chakradar') {
          const X = exploreBlock(res, c, F, b.exs, 'chakradar', 'chakradar', { cmode: b.cmode || 'any' }, head, 'No tihai of tihais fits ' + F.total + ' pulses. Add an avartanam.',
            R => stepsHTML(R.steps.filter(x => x.id === 'eq')) + '<div class="kl-gb"></div>' + checksHTML(R));
          if (X) gridBlock(res.querySelector('.kl-gb'), X.c2, X.R, X.F2, { summary: X.item.sub + (X.R.frame ? ' (two cells a pulse)' : ''), check: !X.R.frame });
          return;
        }
        const X = exploreBlock(res, c, F, b.exs, 'mora', 'mora', { n: b.n, shape: b.n === 'buildup' ? 'sama' : b.shape }, head,
          'No ' + (b.n === 'buildup' ? 'build-up' : b.n === 'any' ? 'mora or series' : b.n > 3 ? 'series of ' + b.n : 'mora') + ' fills ' + F.total + ' pulses. Change the span by a pulse, or the repeat.',
          R => stepsHTML(R.steps.filter(x => x.id === 'eq' || x.id === 'where')) + '<div class="kl-gb"></div>' + checksHTML(R) + notice(esc(K.korvaiThrice(F).text), K.korvaiThrice(F).ok ? 'ok' : 'warn'));
        if (X) gridBlock(res.querySelector('.kl-gb'), X.c2, X.R, X.F2, { summary: X.item.sub + (X.R.frame ? ' (two cells a pulse)' : '') });
      } catch (e) { res.innerHTML = notice('Something went wrong: ' + esc(e.message), 'bad'); }
    }

    /* ---------- drawing, with the focus kept ---------- */
    function draw() {
      audio.stop();
      const a = document.activeElement, fk = a && root.contains(a) && a.dataset ? (a.dataset.fk || (a.dataset.st ? a.dataset.st + ':' + a.dataset.d : null) || (a.dataset.lesson != null ? 'lesson:' + a.dataset.lesson : null)) : null;
      if (host.check && host.check.hide) host.check.hide();
      if (S.mode === 'check' && host.check && host.check.show) { view.innerHTML = ''; host.check.show(view); return; }
      if (S.mode === 'build') drawBuild(); else drawLearn();
      if (fk) {
        const sel = fk.startsWith('lesson:') ? '[data-lesson="' + fk.slice(7) + '"]' : fk.includes(':') && !fk.includes('"') && /^[a-z]+:-?1$/.test(fk) ? '[data-st="' + fk.split(':')[0] + '"][data-d="' + fk.split(':')[1] + '"]' : '[data-fk="' + fk.replace(/"/g, '') + '"]';
        const n = root.querySelector(sel); if (n) { n.focus(); if (n.type === 'search' || n.type === 'text') try { n.setSelectionRange(n.value.length, n.value.length); } catch (e) { /* not a text box */ } }
      }
    }
    drawTop(); draw();
    return { unmount() { audio.stop(); root.innerHTML = ''; root.classList.remove('kl'); }, setMode };
  }
  function merge(base, saved) {
    const out = clone(base);
    Object.keys(out).forEach(k => {
      if (!(k in saved)) return;
      if (out[k] && typeof out[k] === 'object') { if (saved[k] && typeof saved[k] === 'object') Object.keys(out[k]).forEach(j => { if (typeof saved[k][j] === typeof out[k][j] || (j === 'n' && (saved[k][j] === 'buildup' || saved[k][j] === 'any'))) out[k][j] = saved[k][j]; }); }
      else if (typeof saved[k] === typeof out[k]) out[k] = saved[k];
    });
    if (!['learn', 'build'].includes(out.mode)) out.mode = 'learn';
    if (!GATI_UI.includes(out.gati)) out.gati = 4;
    if (![1, 2].includes(out.kalai)) out.kalai = 1;
    return out;
  }
  function validTala(fam, L) { return FAMS.includes(fam) && (fam === 'chapu' ? [3, 5, 7] : [3, 4, 5, 7, 9]).includes(L); }
  g.VGKorvaiLab = { mount };
})(typeof globalThis !== 'undefined' ? globalThis : this);
