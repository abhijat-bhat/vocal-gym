/* Vocal Gym · the melakarta and katapayadi explorer (docs/research/melakarta-katapayadi.md)
   A classic script shared by the playground pages (inlined by scripts/build.js) and the app (served at
   /shared/). It sets globalThis.VGMelaExplorer = { mount(root, host) }, which returns { unmount, select }:
     host.M      the engine's melakarta module: melakartaInfo, melaName, katapayadi, melaFromSwaras,
                 katapayadiLetters, MELA_NAMES, MELA_IAST, CHAKRA, CHAKRA_MEANING
                 (VGEngine in the playground, /engine/melakarta.js and /engine/ragas.js in the app)
     host.audio  optional { play(btn, notes, info), stop() }: notes are pitches (semitones from Sa), the
                 arohana then the avarohana; info is melakartaInfo's answer. play toggles.
     host.store  optional localStorage key for the chosen mela
   The 72 melas in their 12 chakras; for the chosen one, its swaras worked out from the number, how its name
   gives the number by the katapayadi rule (or why it does not), its chakra, its twin across the madhyamas
   and its janyas; a decoder for any word; and a builder that names the mela of a choice of swaras. All the
   arithmetic is the engine's; the page only draws it. */
(function (g) {
  'use strict';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DN = ['D1 N1', 'D1 N2', 'D1 N3', 'D2 N2', 'D2 N3', 'D3 N3'], RG = ['R1 G1', 'R1 G2', 'R1 G3', 'R2 G2', 'R2 G3', 'R3 G3'];
  // the twelve semitones of the octave, with the swara names each can take
  const KEYS = [['S'], ['R1'], ['R2', 'G1'], ['R3', 'G2'], ['G3'], ['M1'], ['M2'], ['P'], ['D1'], ['D2', 'N1'], ['D3', 'N2'], ['N3']];
  const READING = { rule: 'by the rule', phala: 'by a convention', exception: 'an exception' };
  const plainKey = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const sub = l => esc(l).replace(/([RGMDN])([123])/g, '$1<sub>$2</sub>');

  function mount(root, host) {
    const M = host.M, audio = host.audio || null;
    let n = 29;
    try { const v = host.store && localStorage.getItem(host.store); if (v && +v >= 1 && +v <= 72) n = +v; } catch (e) { /* not stored */ }
    root.innerHTML =
      '<div class="mx">' +
      '<div class="mx-find"><label for="mx-q">Find a melakarta by name or number, or decode any word by katapayadi</label>' +
      '<input id="mx-q" type="search" autocomplete="off" spellcheck="false" placeholder="Kalyani, 15, Mechakalyani, Dhīraśaṅkarābharaṇam…">' +
      '<div class="mx-findout" aria-live="polite"></div></div>' +
      '<div class="mx-cols"><div class="mx-grid" role="group" aria-label="The 72 melakartas"></div><div class="mx-detail" aria-live="polite"></div></div>' +
      '<div class="mx-build"><h3>Build a scale</h3><p class="mx-sub">Choose one of each swara: the engine names the melakarta, or says why the choice is not one.</p><div class="mx-sel"></div><div class="mx-buildout" aria-live="polite"></div></div>' +
      '</div>';
    const $ = s => root.querySelector(s);

    /* the 72, chakra by chakra: two halves (the madhyamas), each six chakras of six melas */
    $('.mx-grid').innerHTML = [0, 1].map(h => '<table class="mx-half"><caption>' + (h ? 'Prati madhyama (M<sub>2</sub>), 37–72' : 'Shuddha madhyama (M<sub>1</sub>), 1–36') + '</caption><colgroup><col class="mx-ch">' + '<col>'.repeat(6) + '</colgroup>' +
      '<thead><tr><th scope="col">Chakra</th>' + DN.map(d => '<th scope="col">' + sub(d) + '</th>').join('') + '</tr></thead><tbody>' +
      [0, 1, 2, 3, 4, 5].map(r => { const ci = h * 6 + r; return '<tr><th scope="row"><b>' + (ci + 1) + ' ' + esc(M.CHAKRA[ci]) + '</b><span>' + sub(RG[r]) + '</span></th>' +
        [0, 1, 2, 3, 4, 5].map(c => { const m = ci * 6 + c + 1; return '<td><button type="button" class="mx-m" data-n="' + m + '" title="' + esc(m + ' ' + M.MELA_NAMES[m - 1]) + '"><b>' + m + '</b><span>' + esc(M.MELA_NAMES[m - 1]) + '</span></button></td>'; }).join('') + '</tr>'; }).join('') +
      '</tbody></table>').join('');

    function chips(sy) { return sy.map(s => '<span class="mx-chip"><b>' + esc(s.text) + '</b><span>' + esc(s.letter) + ' = ' + (s.digit == null ? '?' : s.digit) + '</span></span>').join(''); }
    function draw() {
      const I = M.melakartaInfo(n), K = I.katapayadi, read = K.reading === 'phala' ? K.phalaNumber : K.number;
      root.querySelectorAll('.mx-m').forEach(b => { const on = +b.dataset.n === n; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
      const inScale = new Set(I.pitches);
      $('.mx-detail').innerHTML =
        '<div class="mx-head"><div><h3>' + I.n + ' · ' + esc(I.name) + '</h3><p class="mx-iast">' + esc(I.iast) + '</p></div>' +
        (audio ? '<button type="button" class="btn mx-play">Play arohana and avarohana</button>' : '') + '</div>' +
        '<p class="mx-scale">' + I.labels.map(sub).join(' ') + ' Ṡ</p>' +
        '<div class="mx-keys" aria-label="The scale on the twelve semitones">' + KEYS.map((k, p) => '<span class="' + (inScale.has(p) ? 'in' : '') + '">' + (inScale.has(p) ? sub(I.labels[I.pitches.indexOf(p)]) : k.map(sub).join('/')) + '</span>').join('') + '</div>' +
        '<h4>The name gives the number <span class="mx-badge ' + K.reading + '">' + READING[K.reading] + '</span></h4>' +
        '<div class="mx-kp">' + chips(K.syllables) + '<span class="mx-arrow">digits ' + K.digits.join(' ') + ', reversed</span><span class="mx-num ' + (read === n ? 'ok' : 'bad') + '">' + (read == null ? '?' : read) + '</span></div>' +
        '<p class="mx-note">' + esc(K.note) + '</p>' +
        '<h4>The number gives the swaras</h4><ol class="mx-steps">' + I.steps.map(s => '<li>' + esc(s) + '</li>').join('') + '</ol>' +
        '<h4>Chakra ' + I.chakra.index + ', ' + esc(I.chakra.name) + '</h4><p class="mx-note">' + esc(I.chakra.name) + ' stands for ' + I.chakra.stands + ': ' + esc(I.chakra.meaning) + '. Its six melas share ' + sub(I.rg.join(' ')) + ' and ' + sub(I.madhyama) + ', and differ only in D and N.</p>' +
        '<div class="mx-links">' + I.chakra.members.map(m => '<button type="button" class="mx-go' + (m === n ? ' on' : '') + '" data-n="' + m + '">' + m + ' ' + esc(M.MELA_NAMES[m - 1]) + '</button>').join('') + '</div>' +
        '<p class="mx-note">The same scale with ' + sub(I.madhyama === 'M1' ? 'M2' : 'M1') + ': <button type="button" class="mx-go" data-n="' + I.twin.n + '">' + I.twin.n + ' ' + esc(I.twin.name) + '</button></p>' +
        (I.janyas.length ? '<p class="mx-note">Janyas of it in Vocal Gym: ' + I.janyas.map(j => esc(j.name)).join(', ') + '.</p>' : '') +
        lettersText(n);
      const pb = $('.mx-play');
      if (pb) pb.onclick = () => audio.play(pb, I.aro.concat(I.avaro.slice(1)), I);
      root.querySelectorAll('.mx-detail .mx-go').forEach(b => { b.onclick = () => select(+b.dataset.n); });
    }
    function lettersText(m) {
      const L = M.katapayadiLetters(m);
      return '<p class="mx-note">Any name for ' + m + ' must begin with a syllable worth ' + L.first.digit + ' (' + esc(L.first.letters.join(', ')) + ') and go on with one worth ' + L.second.digit + ' (' + esc(L.second.letters.join(', ')) + '), as the digits are read in reverse.</p>';
    }
    function select(m) {
      if (!(m >= 1 && m <= 72)) return;
      n = m; draw();
      if (host.onSelect) host.onSelect(n);
      try { if (host.store) localStorage.setItem(host.store, String(n)); } catch (e) { /* not stored */ }
    }

    /* find: names and numbers, and the katapayadi reading of whatever is typed */
    const keys = M.MELA_NAMES.map((nm, i) => [plainKey(nm), plainKey(M.MELA_IAST[i])]);
    $('#mx-q').addEventListener('input', () => {
      const q = $('#mx-q').value.trim(), out = $('.mx-findout');
      if (!q) { out.innerHTML = ''; return; }
      if (/^\d+$/.test(q)) { const m = +q; out.innerHTML = m >= 1 && m <= 72 ? '<button type="button" class="mx-go" data-n="' + m + '">' + m + ' ' + esc(M.MELA_NAMES[m - 1]) + '</button>' : '<p class="mx-note">Melakartas run from 1 to 72.</p>'; bindFind(); return; }
      const pk = plainKey(q), hits = [];
      keys.forEach((k, i) => { if (pk.length >= 2 && (k[0].startsWith(pk) || k[1].startsWith(pk) || (pk.length >= 4 && k[0].includes(pk)))) hits.push(i + 1); });
      const k = M.katapayadi(q);
      let h = hits.length ? '<div class="mx-links">' + hits.slice(0, 8).map(m => '<button type="button" class="mx-go" data-n="' + m + '">' + m + ' ' + esc(M.MELA_NAMES[m - 1]) + '</button>').join('') + '</div>' : '';
      if (!k.error) {
        const num = k.number, mel = num >= 1 && num <= 72;
        h += '<div class="mx-kp">' + chips(k.syllables.slice(0, 6)) + (k.syllables.length > 6 ? '<span class="mx-arrow">…</span>' : '') +
          '<span class="mx-arrow">first two digits ' + k.digits.slice(0, 2).join(' ') + ', reversed</span><span class="mx-num">' + (num == null ? '?' : num) + '</span>' +
          (mel ? '<button type="button" class="mx-go" data-n="' + num + '">mela ' + num + ' ' + esc(M.MELA_NAMES[num - 1]) + '</button>' : '') + '</div>';
        if (k.phala) h += '<p class="mx-note">Passing over a ya, ra or va written beneath a consonant, as some names need: ' + k.phala.number + '.</p>';
        if (k.alternatives && k.alternatives.length) h += '<p class="mx-note">In plain letters t may be ṭ, d ḍ, n ṇ and sh ś or ṣ, so it could also read ' + k.alternatives.map(a => a >= 1 && a <= 72 ? '<button type="button" class="mx-go" data-n="' + a + '">' + a + ' ' + esc(M.MELA_NAMES[a - 1]) + '</button>' : String(a)).join(' ') + '. Type it with diacritics (ṭ, ṇ, ś, ṣ, ā) to be exact.</p>';
        if (k.note) h += '<p class="mx-note">' + esc(k.note) + '</p>';
      }
      out.innerHTML = h; bindFind();
    });
    function bindFind() { root.querySelectorAll('.mx-findout .mx-go').forEach(b => { b.onclick = () => select(+b.dataset.n); }); }
    $('#mx-q').addEventListener('keydown', e => { if (e.key === 'Enter') { const b = root.querySelector('.mx-findout .mx-go'); if (b) b.click(); } });

    /* build a scale */
    const SEL = { R: ['R1', 'R2', 'R3'], G: ['G1', 'G2', 'G3'], M: ['M1', 'M2'], D: ['D1', 'D2', 'D3'], N: ['N1', 'N2', 'N3'] };
    $('.mx-sel').innerHTML = Object.keys(SEL).map(k => '<label>' + k + ' <select data-k="' + k + '">' + SEL[k].map(v => '<option>' + v + '</option>').join('') + '</select></label>').join('') + '<button type="button" class="btn ghost mx-open" disabled>Open it</button>';
    const sels = Array.from(root.querySelectorAll('.mx-sel select'));
    function build() {
      const sel = {}; sels.forEach(s => { sel[s.dataset.k] = s.value; });
      const r = M.melaFromSwaras(sel), ob = $('.mx-open');
      $('.mx-buildout').innerHTML = r.error ? '<p class="mx-note bad">' + esc(r.error) + '</p>' : '<p class="mx-note">S ' + ['R', 'G', 'M'].map(k => sub(sel[k])).join(' ') + ' P ' + ['D', 'N'].map(k => sub(sel[k])).join(' ') + ' Ṡ is mela <b>' + r.n + ', ' + esc(r.name) + '</b>.</p>';
      ob.disabled = !!r.error; ob.onclick = r.error ? null : () => select(r.n);
    }
    function syncBuild() { const L = M.melakartaInfo(n).labels; const by = { R: L[1], G: L[2], M: L[3], D: L[5], N: L[6] }; sels.forEach(s => { s.value = by[s.dataset.k]; }); build(); }
    sels.forEach(s => s.addEventListener('change', build));
    root.querySelectorAll('.mx-grid .mx-m').forEach(b => { b.onclick = () => { select(+b.dataset.n); syncBuild(); }; });

    draw(); syncBuild();
    return { unmount() { if (audio && audio.stop) audio.stop(); root.innerHTML = ''; }, select: m => { select(m); syncBuild(); } };
  }
  g.VGMelaExplorer = { mount };
})(typeof globalThis !== 'undefined' ? globalThis : this);
