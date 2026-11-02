/* Learn: a short primer for people new to Carnatic music, the full glossary, the 35 talas,
   and how Vocal Gym keeps every exercise correct. */
import { GROUPS, TERMS } from '../glossary.js';
import { esc, $, talaPicture } from '../ui.js';

const SWARAS = [
  ['Sa', 'S', 'Shadjam', 'Fixed. The home note, sung against the drone.', '0'],
  ['Ri', 'R', 'Rishabham', 'Three positions: R₁, R₂, R₃', '1, 2, 3'],
  ['Ga', 'G', 'Gandharam', 'Three positions: G₁, G₂, G₃', '2, 3, 4'],
  ['Ma', 'M', 'Madhyamam', 'Two positions: M₁, M₂', '5, 6'],
  ['Pa', 'P', 'Panchamam', 'Fixed. A fifth above Sa.', '7'],
  ['Dha', 'D', 'Dhaivatam', 'Three positions: D₁, D₂, D₃', '8, 9, 10'],
  ['Ni', 'N', 'Nishadam', 'Three positions: N₁, N₂, N₃', '9, 10, 11']
];

export function mount(root, meta, args) {
  const famOrder = meta.families.filter(f => f.fam !== 'chapu');
  const tl = (fam, L) => meta.talas.find(t => t.fam === fam && t.L === L);
  root.innerHTML = '<div class="wrap"><div class="phead"><span class="eyebrow"><span class="dot"></span>Learn</span><h1>A short guide to the ideas behind Vocal Gym</h1><p class="lead">You do not need to know Carnatic music to explore the app. This page explains every term it uses, in plain language. Tap any dotted term elsewhere in the app to see its definition here.</p></div>' +
    '<div class="learn"><nav class="toc" aria-label="On this page">' +
      '<a href="#" data-to="sec-start">Start here</a><a href="#" data-to="sec-swaras">The seven swaras</a>' + GROUPS.map(g => '<a href="#" data-to="sec-' + g.id + '">' + esc(g.title) + '</a>').join('') +
      '<a href="#" data-to="sec-talas">The 35 talas</a><a href="#" data-to="sec-reading">Reading the notation</a><a href="#" data-to="sec-rules">How correctness is guaranteed</a>' +
    '</nav><div>' +
      '<section class="lsec" id="sec-start"><h2>Start here</h2>' +
        '<p>Carnatic music is the classical music of South India. Every piece is set in a <b>raga</b>, which decides which notes you may sing and how you may move between them, and a <b>tala</b>, a repeating rhythmic cycle kept with the hand.</p>' +
        '<p>Students build their skill with exercises. Singers start with <b>alankaras</b>, patterns sung through the whole raga, and later learn to improvise <b>kalpana swaras</b>. Rhythm is practised with <b>jathis</b> and <b>korvais</b>, passages spoken in drum syllables that must add up to the tala.</p>' +
        '<p>The hard part of making new exercises is keeping them correct: every note must fit the raga’s rules and every phrase must add up to the beat. Vocal Gym does that arithmetic for you, so every exercise it makes is correct and you can ask for as many as you like.</p>' +
      '</section>' +
      '<section class="lsec" id="sec-swaras"><h2>The seven swaras</h2><p>Like do-re-mi, but sung relative to a home note, Sa, that each singer chooses. Most swaras have more than one possible pitch; a raga picks one of each.</p>' +
        '<div class="tbl-wrap"><table class="swtable"><thead><tr><th>Sung</th><th>Written</th><th>Full name</th><th>Positions</th><th>Semitones above Sa</th></tr></thead><tbody>' +
        SWARAS.map(s => '<tr><td><b>' + s[0] + '</b></td><td class="mono">' + s[1] + '</td><td>' + s[2] + '</td><td>' + s[3] + '</td><td class="mono">' + s[4] + '</td></tr>').join('') + '</tbody></table></div>' +
        '<p class="muted" style="font-size:.9rem">Some positions share a pitch: R₂ and G₁ are both 2 semitones above Sa. A dot above a swara (Ṡ) means the upper octave; a dot below (Ṣ) means the lower octave.</p>' +
      '</section>' +
      GROUPS.map(g => '<section class="lsec" id="sec-' + g.id + '"><h2>' + esc(g.title) + '</h2><div class="gloss">' + g.terms.map(t => '<div id="t-' + t + '"><b>' + esc(TERMS[t].name) + '</b><p>' + esc(TERMS[t].text) + '</p></div>').join('') + '</div></section>').join('') +
      '<section class="lsec" id="sec-talas"><h2>The 35 talas</h2><p>Seven families of section patterns, each in five lengths of laghu. The number is the beats in one cycle. Adi tala, the most common, is Chatusra Triputa: 4 + 2 + 2 = 8.</p>' +
        '<div class="tbl-wrap"><table class="swtable"><thead><tr><th>Family</th>' + meta.jatis.map(j => '<th>' + esc(j.name) + ' (' + j.L + ')</th>').join('') + '</tr></thead><tbody>' +
        famOrder.map(f => '<tr><td><b>' + esc(f.name) + '</b><br><span class="muted" style="font-size:.82rem">' + f.pattern.split('').map(c => ({ L: 'laghu', O: 'dhrutam', U: 'anudhrutam' })[c]).join(' + ') + '</span></td>' + meta.jatis.map(j => '<td class="mono">' + tl(f.fam, j.L).total + '</td>').join('') + '</tr>').join('') +
        '</tbody></table></div>' +
        '<p style="margin-top:16px">Here is Adi tala as Vocal Gym draws it. Each box is one section; filled circles are claps, hollow circles waves, small dots finger counts.</p>' + talaPicture(tl('triputa', 4)) +
      '</section>' +
      '<section class="lsec" id="sec-reading"><h2>Reading the notation</h2>' +
        '<p>Every result is laid out the same way. <b>One row is one cycle of the tala</b> (in first speed, one alankara line). The row is split into rounded boxes, one per section of the tala, and each box into beats. The ruler above the rows shows the beat numbers and the hand action for each.</p>' +
        '<p>A comma (,) means hold the previous note, or rest in a jathi. The cell with the saffron outline at the start of each row is <b>sam</b>, beat 1. When you press Play, the lit cell follows the sound, and the drone and the clicks help you keep your place. The louder click marks the start of each section.</p>' +
        '<p>Colours carry meaning: in kalpana swaras, teal marks familiar devices and violet unusual ones; in jathis, teal marks the yati and saffron the teermanam. A legend under each result names them.</p>' +
      '</section>' +
      '<section class="lsec" id="sec-rules"><h2>How correctness is guaranteed</h2>' +
        '<p>Vocal Gym does not make a guess and then check it. Before choosing each note or phrase, it works out which choices can still finish legally: in the raga, in the beat, and on the landing. It then picks only among those. So the result cannot be wrong, whatever the creativity setting.</p>' +
        '<p>Creativity changes only which legal choice is preferred. At 0, the most traditional, recognisable move wins. As you turn it up, rarer moves (leaps, zig-zags, unusual yati shapes) become more likely. They are always moves the rules allow.</p>' +
        '<p>Every result page ends with a checklist (“Why this is correct”) showing the checks for that result.</p>' +
      '</section>' +
    '</div></div></div>';

  root.querySelectorAll('[data-to]').forEach(a => a.onclick = e => { e.preventDefault(); const el = document.getElementById(a.dataset.to); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  const target = args && args[0] ? document.getElementById(TERMS[args[0]] ? 't-' + args[0] : 'sec-' + args[0]) : null;
  if (target) requestAnimationFrame(() => { target.scrollIntoView({ block: 'start' }); target.style.borderColor = 'var(--saffron)'; });
  else window.scrollTo(0, 0);
}
