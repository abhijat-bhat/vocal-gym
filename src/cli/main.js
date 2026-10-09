/* vocal-gym command line: generate alankaras, kalpana swaras and jathis, and judge JathiScript. */
import { readFileSync } from 'node:fs';
import * as E from '../engine/index.js';
import { swara, scale, layout, noteCells, angaText } from './format.js';

const HELP = `vocal-gym ${E.VERSION}: Carnatic exercises that cannot break raga or tala rules

Usage
  vocal-gym ragas                                   list the 86 encoded ragas
  vocal-gym talas                                   list the 35 suladi talas and the chapu talas
  vocal-gym sheet [--tala "misra jhampa"]           the 35 first lines from the tala alankara sheet
  vocal-gym alankara --raga <raga> --tala <tala> [--new N] [--temp T] [--seed S] [--span s] [--speed 1|2|4] [--numbers]
  vocal-gym kalpana --raga <raga> --tala <tala> [--aksharas K] [--per 1|2] [--start S] [--land P] [--ending auto|mora|free] [--temp T] [--seed S]
  vocal-gym jathi --tala <tala> [--nadai 4] [--avartanams 2] [--eduppu 0] [--yati auto] [--land sam|end] [--temp T] [--seed S] [--script]
  vocal-gym judge <file.jathi | -> [--json]
  vocal-gym example <adi|short|chapu|speed>

Arguments
  <raga>   mela number (15), id (mela15, mohanam) or name (Mayamalavagowla, kalyani)
  <tala>   adi, rupaka, "misra jhampa", "khanda jati ata", "misra chapu", "custom 3+2+2"
  --temp   temperature 0 to 2, the performer's creativity (0 conventional, 2 adventurous)

Examples
  vocal-gym alankara --raga mohanam --tala "misra jhampa"
  vocal-gym alankara --raga 65 --tala adi --new 3 --temp 1.2
  vocal-gym kalpana --raga kalyani --tala adi --aksharas 8 --land P --temp 0
  vocal-gym jathi --tala "misra chapu" --eduppu -2 --yati gopuccha --script > my.jathi
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
  const tara = /['’]$|^ṡ$/i.test(s), letter = s[0].toUpperCase();
  const pcs = Array.from(new Set(raga.aro.concat(raga.avaro).map(E.mod12)));
  const pc = pcs.find(p => (raga.labels[p] || '')[0] === letter);
  if (pc === undefined) fail(letter + ' is not a swara of ' + raga.name + '.');
  return pc + (tara ? 12 : 0);
}
const num = (v, d) => v === undefined || v === true ? d : Number(v);
const ragaHeader = r => r.name + ' · ' + (r.kind === 'melakarta' ? 'mela ' + r.mela + ' · ' + r.chakra + ' chakra' : 'janya of ' + r.parent + ' ' + E.MELA_NAMES[r.parent - 1]) + ' · ' + r.cls + '\n  arohana ' + scale(r, r.aro) + '   avarohana ' + scale(r, r.avaro);

function cmdRagas(out) {
  out('Melakartas (all sampurna in both directions)');
  R.melakartas.forEach(r => out('  ' + String(r.mela).padStart(2) + '  ' + r.id.padEnd(7) + ' ' + r.name.padEnd(22) + scale(r, r.aro.slice(0, 7))));
  out('\nJanyas');
  R.janyas.forEach(r => out('  ' + r.id.padEnd(14) + r.name.padEnd(16) + r.cls.padEnd(22) + scale(r, r.aro) + '  /  ' + scale(r, r.avaro)));
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
function cmdKalpana(o, out) {
  const r = findRaga(o.raga), tl = findTala(o.tala || 'adi'), per = num(o.per, 2), K = num(o.aksharas, tl.total), T = num(o.temp, 1), seed = num(o.seed, 3);
  const pcs = Array.from(new Set(r.aro.concat(r.avaro).map(E.mod12)));
  const start = swaraPitch(r, o.start, 0), land = swaraPitch(r, o.land, pcs.includes(7) ? 7 : 12);
  const res = E.kalpana(r, { aksharas: K, perAkshara: per, startPitch: start, targetPitch: land, T, seed, ending: o.ending || 'auto' });
  out(ragaHeader(r));
  out(tl.name + ' · ' + K + ' aksharas x ' + per + ' = ' + K * per + ' slots · T ' + T + ' · seed ' + seed + '\n');
  if (!res) fail('No legal round moves from ' + swara(r, start) + ' to ' + swara(r, land) + ' in ' + K * per + ' slots. Lengthen it or pick closer swaras.');
  out(layout(noteCells(r, res.notes), tl, per) + '  → eduppu\n');
  out('Devices');
  res.units.forEach(u => out('  ' + u.notes.map(n => swara(r, n.p) + (n.dur > 1 ? ' ,'.repeat(n.dur - 1) : '')).join(' ').padEnd(26) + (u.kind === 'nov' ? 'unconventional · ' : u.kind === 'conv' ? 'conventional · ' : u.kind === 'mora' ? 'mora · ' : '') + u.name + (u.dir > 0 ? ' ↑' : u.dir < 0 ? ' ↓' : '')));
  out('\n' + Math.round(res.stats.novelShare * 100) + '% of swaras from unconventional devices, ' + Math.round(res.stats.convShare * 100) + '% from conventional ones · ' +
    (res.ending.type === 'mora' ? 'mora ending, gap ' + res.ending.q : res.ending.fallbackFrom ? 'free ending (no mora fits)' : 'free ending') + ' · lands on ' + swara(r, land, true));
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
      case 'example': { const k = o._[1]; if (!E.JATHI_EXAMPLES[k]) fail('Examples: ' + Object.keys(E.JATHI_EXAMPLES).join(', ')); process.stdout.write(E.JATHI_EXAMPLES[k]); return 0; }
      case undefined: case 'help': case '--help': out(HELP); return 0;
      default: if (o.help) { out(HELP); return 0; } fail('Unknown command "' + cmd + '". Run vocal-gym help.');
    }
  } catch (err) {
    if (err instanceof UserError) { process.stderr.write('vocal-gym: ' + err.message + '\n'); return 2; }
    throw err;
  }
}
