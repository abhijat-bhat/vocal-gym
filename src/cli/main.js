/* vocal-gym command line: generate alankaras, kalpana swaras and jathis, work out moras and korvais, and judge JathiScript. */
import { readFileSync } from 'node:fs';
import * as E from '../engine/index.js';
import { swara, scale, layout, noteCells, angaText } from './format.js';

const HELP = `vocal-gym ${E.VERSION}: Carnatic exercises that cannot break raga or tala rules

Usage
  vocal-gym ragas                                   list the 86 encoded ragas
  vocal-gym talas                                   list the 35 suladi talas and the chapu talas
  vocal-gym sheet [--tala "misra jhampa"]           the 35 first lines from the tala alankara sheet
  vocal-gym alankara --raga <raga> --tala <tala> [--new N] [--temp T] [--seed S] [--span s] [--speed 1|2|4] [--numbers]
  vocal-gym kalpana --raga <raga> --tala <tala> [--aksharas K] [--per 1|2] [--start S] [--eduppu-swara P] [--ending auto|mora|free|korvai] [--mora-style auto|shift|gopuccha|srotovaha|expand|contract|identical] [--session] [--phrases off] [--allow-exceptions] [--gamaka off|light|performative|full|0-100] [--bpm 72] [--contour json [--voice]] [--temp T] [--seed S]
  vocal-gym jathi --tala <tala> [--nadai 4] [--avartanams 2] [--eduppu 0] [--yati auto] [--land sam|end] [--temp T] [--seed S] [--script]
  vocal-gym korvai --tala <tala> [--form mora|korvai|statements|progressive|chakradar|chakkardar|trikaala] [--gati 4] [--kalai 1] [--cycles 2] [--start 0] [--land 0] [--counting end|on] [--series 3|6|9|buildup] [--shape sama|srotovaha|gopuccha] [--kind ap|gp|fib|squares|polite|kuraippu|yati] [--terms 3,4,5] [--halves] [--n 5] [--variant full|gap|lead] [--pick N] [--script]
  vocal-gym mela <raga | number>                    a melakarta: its swaras worked out from the number, its chakra, how its name gives the number
  vocal-gym katapayadi <word>                       decode a word by the katapayadi rule (IAST or plain letters)
  vocal-gym judge <file.jathi | -> [--json]
  vocal-gym example <adi|short|chapu|speed>

Arguments
  <raga>   mela number (15), id (mela15, mohanam) or name (Mayamalavagowla, kalyani)
  <tala>   adi, rupaka, "misra jhampa", "khanda jati ata", "misra chapu", "custom 3+2+2"
  --temp   temperature 0 to 2, the performer's creativity (0 conventional, 2 adventurous)
  --gamaka  print the round with gamaka marks: G~(R–M) kampita, (M)G touched from M, G/ orikkai, R₂* a turn off the scale,
           →G jaru. The level is 0-100 or a name: off 0 (straight notes), light 30, performative 55,
           full 100 (heavy, accurate). --contour json prints the rendered pitch contour as JSON, with
           its legato groups and the expression layer (phrases, stress, loudness); --voice sings
           straight notes legato at gamaka off instead of stepping them
  --eduppu-swara  the swara the composition resumes on (S' tara, S. mandra); the round ends on
           the raga's swara just below or just above it. --land X (deprecated) ends on X itself.

Examples
  vocal-gym alankara --raga mohanam --tala "misra jhampa"
  vocal-gym alankara --raga 65 --tala adi --new 3 --temp 1.2
  vocal-gym kalpana --raga kalyani --tala adi --aksharas 8 --eduppu-swara P --temp 0
  vocal-gym jathi --tala "misra chapu" --eduppu -2 --yati gopuccha --script > my.jathi
  vocal-gym korvai --tala "khanda triputa" --form korvai --cycles 2
  vocal-gym mela 29
  vocal-gym katapayadi Dhīraśaṅkarābharaṇam
  vocal-gym judge examples/short.jathi`;

function args(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) { const k = a.slice(2); const v = argv[i + 1]; if (v === undefined || v.startsWith('--')) o[k] = true; else { o[k] = v; i++; } }
    else o._.push(a);
  }
  return o;
}
class UserError extends Error {}
const fail = msg => { throw new UserError(msg); };

const R = E.allRagas(), ALL = R.melakartas.concat(R.janyas);
const ALIASES = { kalyani: 'mela65', sankarabharanam: 'mela29', shankarabharanam: 'mela29', todi: 'mela8', bhairavi: null, harikambhoji: 'mela28', kharaharapriya: 'mela22' };
function findRaga(q) {
  if (!q || q === true) fail('Give a raga with --raga (a mela number, an id such as mohanam, or a name).');
  const s = String(q).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (/^\d+$/.test(s)) { const n = +s; if (n >= 1 && n <= 72) return R.melakartas[n - 1]; fail('Mela numbers run from 1 to 72.'); }
  if (ALIASES[s]) return ALL.find(r => r.id === ALIASES[s]);
  const hit = ALL.find(r => r.id === s) || ALL.find(r => r.name.toLowerCase().replace(/[^a-z]/g, '') === s) || ALL.find(r => r.name.toLowerCase().replace(/[^a-z]/g, '').startsWith(s));
  if (!hit) fail('Unknown raga "' + q + '". Run "vocal-gym ragas" to list them.');
  return hit;
}
function findTala(q, { suladiOnly } = {}) {
  if (!q || q === true) fail('Give a tala with --tala, for example adi or "misra jhampa".');
  const r = E.parseTalaSpec(String(q));
  if (r.error) fail(r.error);
  if (suladiOnly && !E.FAM[r.tl.fam]) fail('Alankaras are defined for the 35 suladi talas; ' + r.tl.name + ' is not one of them.');
  return r.tl;
}
function swaraPitch(raga, q, fallback) {
  if (q === undefined || q === true) return fallback;
  const s = String(q).trim();
  const tara = /['’]$|^ṡ$/i.test(s), mandra = /\.$/.test(s), letter = s[0].toUpperCase();
  const pcs = Array.from(new Set(raga.aro.concat(raga.avaro).map(E.mod12)));
  const pc = pcs.find(p => (raga.labels[p] || '')[0] === letter);
  if (pc === undefined) fail(letter + ' is not a swara of ' + raga.name + '.');
  return pc + (tara ? 12 : mandra ? -12 : 0);
}
const num = (v, d) => v === undefined || v === true ? d : Number(v);
const ragaHeader = r => r.name + ' · ' + (r.kind === 'melakarta' ? 'mela ' + r.mela + ' · ' + r.chakra + ' chakra' : 'janya of ' + r.parent + ' ' + E.MELA_NAMES[r.parent - 1]) + ' · ' + r.cls + '\n  arohana ' + scale(r, r.aro) + '   avarohana ' + scale(r, r.avaro);

function cmdRagas(out) {
  out('Melakartas (all sampurna in both directions)');
  R.melakartas.forEach(r => out('  ' + String(r.mela).padStart(2) + '  ' + r.id.padEnd(7) + ' ' + r.name.padEnd(22) + scale(r, r.aro.slice(0, 7))));
  out('\nJanyas');
  R.janyas.forEach(r => out('  ' + r.id.padEnd(14) + r.name.padEnd(16) + r.cls.padEnd(22) + scale(r, r.aro) + '  /  ' + scale(r, r.avaro)));
}
/* v0.8.7: the melakarta and katapayadi explorer (src/engine/melakarta.js) */
function cmdMela(o, out) {
  const q = o._.slice(1).join(' ') || o.raga;
  const r = findRaga(q), n = r.kind === 'melakarta' ? r.mela : r.parent;
  if (r.kind !== 'melakarta') out(r.name + ' is a janya of mela ' + n + '.\n');
  const M = E.melakartaInfo(n), k = M.katapayadi;
  out(M.n + ' · ' + M.name + ' (' + M.iast + ')');
  out('  ' + scale(r.kind === 'melakarta' ? r : R.melakartas[n - 1], M.aro) + '   chakra ' + M.chakra.index + ', ' + M.chakra.name + ' (' + M.chakra.meaning + ')');
  out('\nFrom the number');
  M.steps.forEach(s => out('  ' + s));
  out('\nFrom the name (katapayadi)');
  out('  ' + k.syllables.map(s => s.text + ' → ' + s.letter + ' = ' + s.digit).join(';  ') + ';  reversed: ' + (k.reading === 'phala' ? k.phalaNumber : k.number) + (k.reading === 'rule' ? '' : k.reading === 'phala' ? ' (by a convention)' : ' (an exception)'));
  out('  ' + k.note);
  out('\nIn chakra ' + M.chakra.name + ': ' + M.chakra.members.map(m => m + ' ' + E.MELA_NAMES[m - 1]).join(', '));
  out('With ' + (M.madhyama === 'M1' ? 'M2' : 'M1') + ' instead: ' + M.twin.n + ' ' + M.twin.name);
  if (M.janyas.length) out('Janyas here: ' + M.janyas.map(j => j.name).join(', '));
}
function cmdKatapayadi(o, out) {
  const w = o._.slice(1).join(' ');
  const k = E.katapayadi(w);
  if (k.error) fail(k.error);
  out(k.syllables.map(s => s.text + ' → ' + s.letter + ' = ' + s.digit + (s.alt ? ' (or ' + s.alt.letter + ' = ' + (s.alt.digit == null ? 'none' : s.alt.digit) + ')' : '')).join('\n'));
  out('\nThe first two digits, ' + k.digits.slice(0, 2).join(' ') + ', reversed: ' + (k.number == null ? 'none' : k.number) + (k.number >= 1 && k.number <= 72 ? ' (mela ' + k.number + ', ' + E.MELA_NAMES[k.number - 1] + ')' : ''));
  if (k.phala) out('Passing over a ya, ra or va written beneath a consonant (a convention some names need): ' + k.phala.number);
  if (k.alternatives && k.alternatives.length) out('Plain letters are ambiguous (t may be ṭ, n may be ṇ, sh may be ṣ): it could also read ' + k.alternatives.join(', '));
  if (k.note) out(k.note);
}
function cmdTalas(out) {
  out('Suladi talas: 7 families x 5 jatis (laghu |L, dhrutam O = 2, anudhrutam U = 1)');
  Object.keys(E.FAM).forEach(f => [3, 4, 5, 7, 9].forEach(L => { const tl = E.tala(f, L); out('  ' + tl.name.padEnd(30) + angaText(tl).padEnd(14) + String(tl.total).padStart(3) + ' aksharas' + (E.DEFJ[f] === L ? '  (default jati)' : '')); }));
  out('\nChapu talas');
  [3, 5, 7].forEach(L => { const tl = E.tala('chapu', L); out('  ' + tl.name.padEnd(30) + angaText(tl).padEnd(14) + String(tl.total).padStart(3) + ' counts'); });
}
function cmdSheet(o, out) {
  const show = (f, L) => { const e = E.pdfEntry(f, L); out(e.title + '\n  up:   ' + e.asc + '\n  down: ' + e.desc.replace(/S'/g, 'Ṡ')); };
  if (o.tala) { const tl = findTala(o.tala, { suladiOnly: true }); show(tl.fam, tl.L); return; }
  Object.keys(E.FAM).forEach(f => [4, 3, 7, 5, 9].forEach(L => show(f, L)));
}
function cmdAlankara(o, out) {
  const r = findRaga(o.raga), tl = findTala(o.tala, { suladiOnly: true }), per = num(o.speed, 1), T = num(o.temp, 0.6), seed = num(o.seed, 1), n = num(o.new, 0);
  const sheet = E.pdfMotif(tl.fam, tl.L), span = num(o.span, E.motifSpan(sheet)), e = E.pdfEntry(tl.fam, tl.L);
  const hist = [{ motif: sheet, source: 'sheet' }];
  for (let k = 1; k <= n; k++) {
    const res = E.newMotif(tl, { T, seed: seed + k * 31, span, avoid: hist.map(h => h.motif) });
    if (!res) { out('(No further distinct pattern with a span of ' + span + ' fits ' + tl.name + '.)'); break; }
    hist.push(Object.assign({ source: 'new' }, res));
  }
  out(ragaHeader(r));
  out(tl.name + ' · ' + angaText(tl) + ' = ' + tl.total + ' aksharas\n');
  hist.forEach((h, k) => {
    const a = E.alankara(r, tl, h.motif);
    if (h.source === 'sheet') out('Variation 0 · sheet ' + e.title + (r.kind === 'janya' ? ' (adapted to ' + r.name + ')' : ''));
    else { const rep = E.motifReport(h.motif, tl); const c = Math.round(rep.conventionality * 35); out('Variation ' + k + ' · new pattern at T ' + T + ' · differs from every earlier pattern in at least ' + h.diff + ' of ' + tl.total + ' slots · ' + (c ? 'more conventional than ' + c + ' of the 35 sheet lines' : 'less conventional than every sheet line')); }
    const cells = []; a.lines.forEach(l => cells.push(...noteCells(r, l.notes, o.numbers)));
    out(layout(cells, tl, per));
    if (a.adjustedCount) out('  ' + a.adjustedCount + ' swaras adjusted to keep the raga\'s direction rules');
    out('');
  });
}
const LICENCE = { phrase: 'inside an attested phrase', structural: 'landing on S, P or a resting swara of the raga', consonant: 'a fourth, fifth or octave', arpeggio: 'inside an arpeggio', none: 'unlicensed' };
function leapText(L) {
  if (!L.total) return 'Leaps: none; every move is a step.';
  const by = {}; L.list.forEach(x => { const k = x.licence || 'none'; by[k] = (by[k] || 0) + 1; });
  const parts = Object.keys(LICENCE).filter(k => by[k]).map(k => (L.total > 1 && by[k] === L.total ? (L.total === 2 ? 'both ' : 'all ') : by[k] + ' ') + LICENCE[k]);
  return 'Leaps: ' + L.total + ', ' + parts.join(', ') + (L.unresolved ? '; ' + L.unresolved + ' not stepped back from' : L.total > 1 ? '; all resolved' : '; resolved') + '.';
}
/* compact gamaka marks: G~(R–M) kampita, G≈(…) andolita, (M)G touched from M, →G jaru, G/ orikkai;
   a turn outside the raga's scale is named by its svarasthana with a star (Todi's ga turns at R₂*) */
const SVARASTHANA = { labels: { 0: 'S', 1: 'R1', 2: 'R2', 3: 'G2', 4: 'G3', 5: 'M1', 6: 'M2', 7: 'P', 8: 'D1', 9: 'D2', 10: 'N2', 11: 'N3' } };
function turnName(r, q) {
  const k = Math.round(q);
  return r.labels[E.mod12(k)] ? swara(r, k) : swara(SVARASTHANA, k, true) + '*';
}
function gamakaMark(r, n) {
  const f = n.form || {}, s = swara(r, n.p);
  let m = s;
  if (f.body === 'kampita' || f.body === 'andolita') m += (f.body === 'kampita' ? '~(' : '≈(') + turnName(r, f.lo) + '–' + turnName(r, f.hi) + ')';
  if (['nokku', 'odukkal', 'sphurita', 'pratyahata'].includes(f.onset) && f.from != null) m = '(' + turnName(r, f.from) + ')' + m;
  if (f.onset === 'jaru') m = '→' + m;
  if (f.exit === 'orikkai') m += '/';
  if (f.exit === 'jaru') m += '→';
  return m;
}
function cmdKalpana(o, out) {
  const r = findRaga(o.raga), tl = findTala(o.tala || 'adi'), per = num(o.per, 2), K = num(o.aksharas, tl.total), T = num(o.temp, 1), seed = num(o.seed, 3);
  const pcs = Array.from(new Set(r.aro.concat(r.avaro).map(E.mod12)));
  const start = swaraPitch(r, o.start, 0), legacy = o['eduppu-swara'] === undefined && o.land !== undefined;
  // v0.4: the phrase plan follows the tala's angas (docs/research/kalpana-structure.md); --phrases off gives v0.3 rounds
  const opts = { aksharas: K, perAkshara: per, startPitch: start, T, seed, ending: o.ending || 'auto', allowExceptions: !!o['allow-exceptions'], moraStyle: o['mora-style'] || 'auto',
    angas: tl.angas.map(a => a.len), phrases: o.phrases !== 'off' };
  if (o.ending && !['auto', 'mora', 'free', 'korvai'].includes(o.ending)) fail('--ending is auto, mora, free or korvai.');
  if (legacy) opts.targetPitch = swaraPitch(r, o.land);   // --land: deprecated, the last swara itself
  else opts.eduppuPitch = swaraPitch(r, o['eduppu-swara'], pcs.includes(7) ? 7 : 12);
  if (o.session) return kalpanaSessionText(r, tl, opts, legacy, out);
  const res = E.kalpanaRound(r, opts);
  // the gamaka intensity dial (docs/research/gamaka-naturalness.md §3.2): a name or 0 to 100
  const GAMAKA = { off: 0, light: 0.3, performative: 0.55, medium: 0.55, full: 1, heavy: 1 }, bpm = num(o.bpm, 72);
  const gmode = o.gamaka === true ? 'full' : o.gamaka;
  const glevel = gmode === undefined ? undefined : GAMAKA[gmode] !== undefined ? GAMAKA[gmode] : /^\d+(\.\d+)?$/.test(String(gmode)) && +gmode <= 100 ? +gmode / 100 : null;
  if (glevel === null) fail('--gamaka is off, light, performative, full, or a level from 0 to 100.');
  if (o.contour !== undefined) {
    if (o.contour !== 'json') fail('--contour takes json.');
    if (res.error) fail(res.error);
    // --voice: at gamaka off, straight notes sung legato (the voice's motion) instead of stepped
    const angaStarts = []; let a0 = 0; tl.angas.forEach(a => { angaStarts.push(a0); a0 += a.len; });
    const g = E.renderGamaka(res.notes, { raga: r, slotSec: 60 / bpm / per, intensity: glevel === undefined ? 1 : glevel, units: res.units, seed, voice: !!o.voice, per, cycleBeats: tl.total, angaStarts });
    const q = (x, k) => Math.round(x * k) / k, pair = pt => [q(pt.t, 1e5), q(pt.p, 1e4)];
    out(JSON.stringify({ raga: r.id, bpm, intensity: g.intensity, slotSec: 60 / bpm / per, notes: res.notes, style: g.style, basis: g.basis, stats: g.stats, rendered: g.notes.map(({ targets, source, ...n }) => n), points: g.points.map(pair),
      groups: g.groups.map(gr => ({ t0: q(gr.t0, 1e5), t1: q(gr.t1, 1e5), points: gr.points.map(pair) })),
      expression: { phrases: g.expression.phrases, notes: g.expression.notes, gain: g.expression.gain.map(x => x.map(y => [y.t, y.g])) } }));
    return;
  }
  out(ragaHeader(r));
  out(tl.name + ' · ' + K + ' aksharas x ' + per + ' = ' + K * per + ' slots · T ' + T + ' · seed ' + seed + '\n');
  if (res.error) fail(res.error);
  out(layout(noteCells(r, res.notes), tl, per) + '  → eduppu' + (legacy ? '' : ' ' + swara(r, opts.eduppuPitch)) + '\n');
  if (glevel) {
    const g = E.renderGamaka(res.notes, { raga: r, slotSec: 60 / bpm / per, intensity: glevel, units: res.units, seed });
    const prof = E.getProfile(r).gamaka;
    out('Gamaka (' + (GAMAKA[gmode] !== undefined ? gmode + ', ' : '') + Math.round(glevel * 100) + '%, ' + bpm + ' aksharas a minute) · ' + (prof.basis === 'default' ? 'generic: no raga-specific data yet' : prof.style + ', from ' + prof.sources.join(', ')) + ' · ' + Math.round(g.stats.gamakaShare * 100) + '% of swaras with gamaka');
    const cells = [];
    g.notes.forEach((n, k) => { cells.push(gamakaMark(r, n)); for (let j = 1; j < res.notes[k].dur; j++) cells.push(','); });
    out(layout(cells, tl, per) + '\n');
  }
  out('Devices');
  const KIND = { nov: 'unconventional · ', conv: 'conventional · ', mora: 'mora · ', korvai: 'korvai · ', phrase: 'attested · ', 'phrase-fragment': 'attested · ', 'phrase-variant': 'variant · ' };
  res.units.forEach(u => out('  ' + u.notes.map(n => swara(r, n.p) + (n.dur > 1 ? ' ,'.repeat(n.dur - 1) : '')).join(' ').padEnd(26) + (KIND[u.kind] || '') + u.name + (u.dir > 0 ? ' ↑' : u.dir < 0 ? ' ↓' : '') +
    (u.phraseId ? '  [' + u.phraseId + ', ' + u.source + (E.getSource(u.source) ? ': ' + E.getSource(u.source).title : '') + ']' : '')));
  const st = res.stats;
  out('\n' + (st.profileCoverage === 'phrases' ? Math.round(st.phraseShare * 100) + '% of swaras from attested phrases, ' + Math.round(st.variantShare * 100) + '% from phrase variants'
    : 'Phrase data: none for ' + r.name + ', so generic devices only') + (o['allow-exceptions'] ? ' · direction-rule exceptions allowed' : ''));
  const end = res.notes[res.notes.length - 1].p;
  const lands = legacy ? 'lands on ' + swara(r, end, true)
    : 'lands on ' + swara(r, end, true) + ', the swara just ' + (res.ending.approach === 'below' ? 'below' : 'above') + ' the eduppu ' + swara(r, opts.eduppuPitch, true) + (res.ending.approach === 'below' ? ' (rising into it)' : ' (descending into it)');
  out(Math.round(res.stats.novelShare * 100) + '% of swaras from unconventional devices and phrase variants, ' + Math.round(res.stats.convShare * 100) + '% from conventional ones · ' +
    endingText(res.ending) + ' · ' + lands);
  if (res.phrases && res.phrases.length) out(phraseText(r, res));
  out(leapText(res.stats.leaps) + (res.stats.relaxed ? ' (the leap filter was relaxed to fit this short span)' : ''));
  if (legacy) out('(--land is deprecated: use --eduppu-swara, the swara the composition resumes on.)');
}
function endingText(en) {
  if (en.type === 'korvai') return 'korvai of three descending units (runs of ' + en.run + ', rests shrinking from ' + en.rests + '), gap ' + en.gap;
  if (en.type === 'mora') return en.style + ' mora (' + (en.template === 'generic' ? 'generic contour' : 'contour of ' + en.templatePhrase) + '), gap ' + en.q + (en.timing ? ', statements of ' + en.timing.join(', ') + ' slots' : '') + (en.fallbackFrom ? ' (no korvai fits)' : '');
  return en.fallbackFrom ? 'free ending (no ' + en.fallbackFrom + ' fits)' : 'free ending';
}
/* the phrase plan as sung: each phrase's focus and the swara it held (v0.4) */
function phraseText(r, res) {
  const ph = res.phrases, held = ph.filter(p => p.held != null), onF = held.filter(p => p.held === p.focal).length;
  const echoes = res.units.filter(u => /rhyme|sequence|yati/.test(u.base)).map(u => u.name);
  return 'Phrases: ' + ph.length + ' (' + ph.map(p => (p.focal != null ? 'focus ' + swara(r, p.focal) : '') + (p.held != null ? ', held ' + swara(r, p.held) : '')).join(' · ') + ')' +
    (held.length ? '; ' + onF + ' of ' + held.length + ' end on their focal note' : '') + (echoes.length ? ' · ' + echoes.join(', ') : '');
}
/* --session: the whole svara kalpana, round by round (v0.4) */
function kalpanaSessionText(r, tl, opts, legacy, out) {
  if (legacy) fail('--session needs --eduppu-swara.');
  const S = E.kalpanaSession(r, { eduppuPitch: opts.eduppuPitch, startPitch: opts.startPitch, angas: opts.angas, perAkshara: opts.perAkshara, T: opts.T, seed: opts.seed, moraStyle: opts.moraStyle });
  out(ragaHeader(r));
  out(tl.name + ' · a whole svara kalpana: first speed, second speed, koraippu, korvai · T ' + opts.T + ' · seed ' + opts.seed + ' · eduppu ' + swara(r, opts.eduppuPitch) + '\n');
  const AV = { 0.25: '¼', 0.5: '½' };
  S.rounds.forEach((x, k) => {
    out((k + 1) + '. ' + x.part + ' · ' + (AV[x.avartanas] || x.avartanas) + ' avartanam' + (x.avartanas > 1 ? 's' : '') + ' · ' + x.per + ' a beat' + (x.focus != null ? ' · focus ' + swara(r, x.focus) : '') + ' · ' + endingText(x.round.ending));
    out(layout(noteCells(r, x.round.notes), tl, x.per) + '  → eduppu\n');
  });
  S.failed.forEach(x => out('(' + x.part + ', ' + x.avartanas + ' avartanam: ' + x.error + ')'));
}
function cmdJathi(o, out) {
  const tl = findTala(o.tala || 'adi'), g = num(o.nadai, 4), N = num(o.avartanams, 2), off = num(o.eduppu, 0), T = num(o.temp, 1), seed = num(o.seed, 5);
  const res = E.jathi({ tl, nadai: g, avartanams: N, offset: off, yatiPref: o.yati || 'auto', land: o.land === 'end' ? 'end' : 'sam', T, seed });
  if (res.error) fail(res.error);
  if (o.script) { process.stdout.write(res.script); return; }
  const cyc = tl.total * g, lead = off >= 0 ? off : cyc + off;
  const cells = res.segs.flatMap(s => s.syl.map(x => s.role === 'teermanam' ? x.toUpperCase() : x));
  out(tl.name + ' · nadai ' + g + ' · ' + N + ' avartanams · eduppu ' + (off === 0 ? 'sam' : off > 0 ? '+' + off : off) + ' · T ' + T + ' · seed ' + seed + '\n');
  out(layout(cells, tl, g, lead));
  out('\n' + res.audit.span + '\nbody ' + res.audit.body + ' + yati ' + res.audit.yatiLen + ' (' + res.audit.yati + ') + teermanam ' + res.audit.teermanam + ' = ' + res.used + ' slots');
  const J = E.judgeJathi(res.script);
  out('judge: ' + J.total + '/100 · ' + J.grade + '   (teermanam in capitals; --script prints JathiScript)');
}
/* v0.8: the korvai and tihai lab's arithmetic (docs/research/korvai-tihai.md) */
function cmdKorvai(o, out) {
  const tl = findTala(o.tala || 'adi'), K = E.korvai, form = o.form || 'mora';
  if (!['mora', 'korvai', 'statements', 'progressive', 'chakradar', 'chakkardar', 'trikaala'].includes(form)) fail('--form is mora, korvai, statements, progressive, chakradar, chakkardar or trikaala.');
  const pick = num(o.pick, 1) - 1;
  let F, R, sols = [];
  if (form === 'trikaala') {
    R = K.trikaala({ tala: tl, kalai: num(o.kalai, 1), n: num(o.n, 5), variant: o.variant || 'full' });
    if (R.error) fail(R.error);
    F = R.frame;
  } else {
    F = K.korvaiFrame({ tala: tl, gati: num(o.gati, 4), kalai: num(o.kalai, 1), cycles: num(o.cycles, 2), start: num(o.start, 0), land: num(o.land, 0), counting: o.counting === 'on' ? 'on' : o.counting ? (o.counting === 'end' ? 'end' : fail('--counting is end or on.')) : 'end' });
    if (F.error) fail(F.error);
    if (form === 'mora') {
      const series = o.series === 'buildup' ? 'buildup' : num(o.series, 3);
      sols = K.moraSolutions(F.total, { gati: F.gati, n: series });
      if (!sols.length) fail('No ' + (series === 'buildup' ? 6 : series) + 'P + 2G fills ' + F.total + ' pulses.');
      const s = sols[Math.max(0, Math.min(sols.length - 1, pick))];
      R = K.moraPlan(F, { P: s.P, G: s.G, n: s.n, shape: s.n === 'buildup' ? 'sama' : o.shape || 'sama' });
    } else if (form === 'statements') {
      if (o.terms) { R = K.statementKorvai(F, { terms: String(o.terms).split(/[^0-9]+/).filter(Boolean).map(Number) }); }
      else {
        const kinds = !o.kind ? null : o.kind === 'yati' ? ['sama', 'srotovaha', 'gopuccha', 'mridanga', 'damaru'] : String(o.kind).split(',');
        sols = K.statementOptions(F, { kinds }).map(x => Object.assign({}, x, { eq: x.terms.join(' + ') + ' (' + x.name + ') + ' + x.U + ', ' + Math.round(100 * x.ratio) + '%' }));
        if (!sols.length) fail('No balanced purvanga pattern fits a statement of ' + Math.floor(F.total / 3) + '.');
        const x = sols[Math.max(0, Math.min(sols.length - 1, pick))]; R = K.statementKorvai(F, { terms: x.terms, pattern: x });
      }
    } else if (form === 'progressive') {
      sols = K.progressiveOptions(F).map(x => Object.assign({}, x, { eq: x.text }));
      if (!sols.length) fail('No progressive korvai fits ' + F.total + ' pulses.');
      R = K.progressiveKorvai(F, sols[Math.max(0, Math.min(sols.length - 1, pick))]);
    } else if (form === 'chakkardar') {
      sols = K.chakkardarSolutions(F.total, { halves: !!o.halves });
      if (!sols.length) fail('No 9P1 + 6G1 + 2G2 fills ' + F.total + ' pulses.');
      R = K.chakkardarPlan(F, sols[Math.max(0, Math.min(sols.length - 1, pick))]);
      if (R.frame) F = R.frame;
    } else if (form === 'korvai') {
      sols = K.korvaiPlans(F);
      if (!sols.length) fail('No balanced korvai fits ' + F.total + ' pulses; add an avartanam.');
      R = K.korvaiPlan(F, sols[Math.max(0, Math.min(sols.length - 1, pick))]);
    } else {
      sols = K.chakradarSolutions(F.total, { gati: F.gati });
      if (!sols.length) fail('No chakradar fits ' + F.total + ' pulses; add an avartanam.');
      R = K.chakradarPlan(F, sols[Math.max(0, Math.min(sols.length - 1, pick))]);
    }
    if (R.error) fail(R.error);
  }
  if (o.script) { const x = K.toJathiScript(F, R); if (x.error) fail(x.error); process.stdout.write(x.script); return; }
  out(tl.name + ' · gati ' + F.gati + (F.kalai > 1 ? ' · kalai ' + F.kalai : '') + ' · ' + form + '\n');
  R.steps.forEach((s, i) => out((i + 1) + '. ' + s.title + ': ' + s.math));
  if (sols.length) out('\n' + sols.length + ' solution' + (sols.length > 1 ? 's' : '') + (sols.length > 8 ? ', the first 8' : '') + ' (--pick N chooses):\n  ' + sols.slice(0, 8).map((s, i) => (i + 1) + ') ' + (s.eq || s.text)).join('\n  '));
  const cy = F.cycle, cells = R.layout.cells.map(c => c.role === 'pre' ? '·' : c.syl === '' ? '-' : c.role === 'statement' ? c.syl.toUpperCase() : c.syl);
  out('\n' + layout(cells, Object.assign({}, tl, { angas: tl.angas.map(a => Object.assign({}, a, { len: a.len * cy.kalai })), total: cy.beats }), cy.gati, 0));
  R.layout.checks.forEach(c => out((c.ok ? 'ok   ' : 'FAIL ') + c.text));
  out('(mora statements in capitals; --script prints it as JathiScript for the judge)');
}
function cmdJudge(o, out) {
  const file = o._[1];
  if (!file) fail('Give a JathiScript file, or - to read standard input.');
  const text = readFileSync(file === '-' ? 0 : file, 'utf8');
  const J = E.judgeJathi(text);
  if (o.json) { const { parsed, ...rest } = J; out(JSON.stringify(rest, null, 2)); return J.ok && J.gatePass ? 0 : 1; }
  if (!J.ok) { J.errors.forEach(e => out((e.line ? 'line ' + e.line + (e.col ? ':' + e.col : '') + '  ' : '') + e.msg)); return 1; }
  const P = J.parsed;
  out(P.tl.name + ' · nadai ' + P.nadai + (P.kalai > 1 ? ' · kalai ' + P.kalai : '') + ' · ' + (J.avartanams || '?') + ' avartanams' + (P.avartanams ? '' : ' (inferred)') + '\n');
  out('Score ' + J.total + '/100 · ' + J.grade + (J.gatePass ? '' : ' (capped at 49 until the gate passes)') + '\n');
  out('Correctness gate');
  J.gate.forEach(g => out('  ' + (g.ok ? 'pass ' : 'FAIL ') + g.label + ': ' + g.detail));
  if (J.fixes.length) { out('\nWhat to change'); J.fixes.forEach((f, i) => out('  ' + (i + 1) + '. ' + f)); }
  out('\nCraft');
  J.aspects.forEach(a => { out('  ' + a.name.padEnd(24) + String(Math.round(a.score * 10) / 10).padStart(5) + ' / ' + a.max); a.notes.forEach(n => out('      ' + n)); });
  if (J.warnings.length) { out('\nWarnings'); J.warnings.forEach(w => out('  ' + (w.line ? 'line ' + w.line + ': ' : '') + w.msg)); }
  return J.gatePass ? 0 : 1;
}

export function main(argv, out = s => process.stdout.write(s + '\n')) {
  const o = args(argv), cmd = o._[0];
  try {
    switch (cmd) {
      case 'ragas': cmdRagas(out); return 0;
      case 'talas': cmdTalas(out); return 0;
      case 'sheet': cmdSheet(o, out); return 0;
      case 'alankara': cmdAlankara(o, out); return 0;
      case 'kalpana': cmdKalpana(o, out); return 0;
      case 'jathi': cmdJathi(o, out); return 0;
      case 'judge': return cmdJudge(o, out);
      case 'korvai': cmdKorvai(o, out); return 0;
      case 'mela': cmdMela(o, out); return 0;
      case 'katapayadi': cmdKatapayadi(o, out); return 0;
      case 'example': { const k = o._[1]; if (!E.JATHI_EXAMPLES[k]) fail('Examples: ' + Object.keys(E.JATHI_EXAMPLES).join(', ')); process.stdout.write(E.JATHI_EXAMPLES[k]); return 0; }
      case undefined: case 'help': case '--help': out(HELP); return 0;
      default: if (o.help) { out(HELP); return 0; } fail('Unknown command "' + cmd + '". Run vocal-gym help.');
    }
  } catch (err) {
    if (err instanceof UserError) { process.stderr.write('vocal-gym: ' + err.message + '\n'); return 2; }
    throw err;
  }
}
