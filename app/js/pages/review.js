/* Phrase review (v0.11): a teacher hears each raga's phrases, says whether they belong, and suggests what is missing. A verdict
   changes nothing by itself: what is accepted goes into data/raga-profiles.json with the teacher as its source
   (scripts/phrase-reviews.js), so the generators keep one source of raga knowledge. */
import { api } from '../api.js';
import { toggle, pitchedJob, initPlayButton, stop } from '../audio.js';
import { pageHead, esc, $, toast } from '../ui.js';
import { getUser, refreshUser, userKnown, onUser } from '../session.js';

const VERDICTS = [['right', 'Belongs'], ['wrong-raga', 'Not this raga'], ['wrong-octave', 'Wrong octave'], ['unsure', 'Not sure']];

export async function mount(root, meta, parts) {
  if (!userKnown()) await refreshUser();
  let alive = true;
  const head = pageHead({ title: 'Phrase review', lead: 'The phrases the generators draw on come from published sources, and no teacher has checked them yet. Hear each one and say whether it belongs. Nothing changes until your verdicts are read and written into the raga’s sourced profile.' });
  const signedOut = () => { root.innerHTML = '<div class="wrap">' + head + '<div class="card pr-cta"><p>Your verdicts need an account, so they can be read together and credited to you.</p><div class="pr-row"><a class="btn primary" href="#/account">Sign in</a></div></div></div>'; };
  const off = onUser(() => { if (alive) draw(); });

  async function draw() {
    if (!getUser()) { signedOut(); return; }
    root.innerHTML = '<div class="wrap">' + head + '<div class="tool rv"><aside class="panel" aria-label="Ragas"><div class="step"><label class="lab" for="rv-q">Find a raga</label><input type="search" id="rv-q" placeholder="Name" autocomplete="off"><label class="acct-check"><input type="checkbox" id="rv-none"> Only ragas with no phrases</label></div><div class="step rv-list" id="rv-list"><p class="muted">Loading…</p></div></aside><section class="result" id="rv-main" aria-live="polite"><p class="muted">Choose a raga.</p></section></div></div>';
    let list = [];
    try { list = (await api.review.overview()).ragas; } catch (x) { $('#rv-list', root).innerHTML = '<p class="muted">' + esc(x.message) + '</p>'; return; }
    if (!alive) return;
    let current = parts && parts[0] && list.some(r => r.id === parts[0]) ? parts[0] : (list.find(r => r.id === 'bhairavi') || list[0]).id;
    const fold = s => s.toLowerCase().replace(/[^a-z]/g, '');
    const paint = () => {
      const q = fold($('#rv-q', root).value), only = $('#rv-none', root).checked;
      $('#rv-list', root).innerHTML = list.filter(r => (!q || fold(r.name).includes(q)) && (!only || !r.phrases)).map(r => '<button type="button" class="rp-secbtn" data-r="' + r.id + '" aria-current="' + (r.id === current) + '">' + esc(r.name) + '<small>' + (r.phrases ? r.reviewed + ' of ' + r.phrases : 'no phrases') + '</small></button>').join('') || '<p class="muted">No raga matches.</p>';
      root.querySelectorAll('[data-r]').forEach(b => { b.onclick = () => { current = b.dataset.r; paint(); open(current); }; });
    };
    $('#rv-q', root).oninput = paint; $('#rv-none', root).onchange = paint;
    paint(); open(current);

    async function open(id) {
      const main = $('#rv-main', root); stop();
      let r;
      try { r = await api.review.raga(id); } catch (x) { main.innerHTML = '<p class="muted">' + esc(x.message) + '</p>'; return; }
      if (!alive || id !== current) return;
      main.innerHTML = '<div class="card-h"><div><h2>' + esc(r.raga.name) + '</h2><div class="card-sub">' + (r.phrases.length ? r.phrases.length + ' phrase' + (r.phrases.length === 1 ? '' : 's') + ' in its profile' : 'No published phrase could be found for this raga. If you know how it moves, please write one below.') + '</div></div></div>' +
        '<ol class="rv-phrases">' + r.phrases.map((p, i) => '<li class="rv-ph" data-i="' + i + '"><div class="rv-line"><button type="button" class="btn small play" data-play="' + i + '"></button><code class="rv-sw">' + esc(p.swaras) + '</code></div>' +
          '<p class="hint">' + (p.source ? '<a href="' + esc(p.source.url) + '" target="_blank" rel="noopener">' + esc(p.source.title) + '</a>' : 'No source') + ' · weight ' + p.weight + (p.octaveCertain ? '' : ' · octave inferred') + (p.exception ? ' · outside the raga’s usual rules, sung only whole' : '') + (Object.keys(p.counts).length ? ' · so far: ' + VERDICTS.filter(([k]) => p.counts[k]).map(([k, w]) => w.toLowerCase() + ' ' + p.counts[k]).join(', ') : '') + '</p>' +
          '<div class="seg rv-seg" role="group" aria-label="Your verdict">' + VERDICTS.map(([k, w]) => '<button type="button" data-v="' + k + '" aria-pressed="' + (!!p.mine && p.mine.verdict === k) + '">' + esc(w) + '</button>').join('') + '</div>' +
          '<input type="text" class="rv-note" maxlength="400" placeholder="A note, if you like: what it should be, or in which school" aria-label="A note on this phrase" value="' + esc(p.mine ? p.mine.note : '') + '"></li>').join('') + '</ol>' +
        '<form class="slab-card rv-suggest" id="rv-sug" novalidate><h3>Suggest a phrase</h3><p class="hint">Use the raga’s letters: S R G M P D N, with an apostrophe for the upper octave (S’), a dot for the lower (N.), a comma to hold, and a number where a swara has two forms (D1, D2).</p><div class="field"><label class="lab" for="rv-sw">The phrase</label><input type="text" id="rv-sw" maxlength="240" spellcheck="false" autocomplete="off" placeholder="P D N S\'"></div><div class="field"><label class="lab" for="rv-sn">Where it comes from</label><input type="text" id="rv-sn" maxlength="400" placeholder="Your teacher, a composition, a book"></div><p class="pr-err" id="rv-se" role="alert"></p><div class="pr-row"><button class="btn" type="submit">Suggest it</button></div>' +
        (r.suggested.length ? '<ul class="rv-mine">' + r.suggested.map(s => '<li><code>' + esc(s.swaras) + '</code>' + (s.note ? ' <span class="muted">' + esc(s.note) + '</span>' : '') + ' <button type="button" class="btn small ghost" data-un="' + s.id + '">Remove</button></li>').join('') + '</ul>' : '') + '</form>';
      const ph = r.phrases;
      root.querySelectorAll('[data-play]').forEach(b => {
        const p = ph[+b.dataset.play]; initPlayButton(b, 'Hear');
        b.onclick = () => { const total = p.durs.reduce((s, d) => s + d, 0); toggle(b, pitchedJob(null, p.pitches.map((x, k) => ({ p: x, slots: p.durs[k] })), 1, total, new Set([0]), { raga: id, seed: 1 })); };
      });
      root.querySelectorAll('.rv-ph').forEach(li => {
        const p = ph[+li.dataset.i], note = $('.rv-note', li);
        const save = async v => { try { await api.review.verdict({ raga: id, phrase: p.id, verdict: v, note: note.value }); const row = list.find(x => x.id === id); const had = !!p.mine; if (v == null && had) row.reviewed--; else if (v != null && !had) row.reviewed++; p.mine = v == null ? null : { verdict: v, note: note.value }; li.querySelectorAll('[data-v]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.v === v))); paint(); } catch (x) { toast(x.message); } };
        li.querySelectorAll('[data-v]').forEach(b => { b.onclick = () => save(p.mine && p.mine.verdict === b.dataset.v ? null : b.dataset.v); });
        note.onchange = () => { if (p.mine) save(p.mine.verdict); };
      });
      $('#rv-sug', root).onsubmit = async e => {
        e.preventDefault(); const out = $('#rv-se', root); out.textContent = '';
        try { await api.review.suggest({ raga: id, swaras: $('#rv-sw', root).value, note: $('#rv-sn', root).value }); toast('Thank you. It will be read with the others.'); open(id); }
        catch (x) { out.textContent = x.message; }
      };
      root.querySelectorAll('[data-un]').forEach(b => { b.onclick = async () => { await api.review.unsuggest(+b.dataset.un); open(id); }; });
    }
  }
  draw();
  return () => { alive = false; stop(); off(); };
}
