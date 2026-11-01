/* Vocal Gym web API: thin, validated wrappers around the engine.
   Each handler takes a parsed JSON body and returns a plain object ready for the browser:
   display-ready swaras, the tala layout, the facts the page needs to play the result,
   and a plain-English explanation of what was made and why it is correct. */
import * as E from '../src/engine/index.js';
import * as llm from './llm.js';

export class BadRequest extends Error {}
export { Unavailable } from './llm.js';
const bad = msg => { throw new BadRequest(msg); };

const R = E.allRagas();
const ALL = R.melakartas.concat(R.janyas);
const RAGA = new Map(ALL.map(r => [r.id, r]));

const UP = { S: 'Ṡ', R: 'Ṙ', G: 'Ġ', M: 'Ṁ', P: 'Ṗ', D: 'Ḋ', N: 'Ṅ' };
const DOWN = { S: 'Ṣ', R: 'Ṛ', M: 'Ṃ', D: 'Ḍ', N: 'Ṇ' };
const SUB = { 1: '₁', 2: '₂', 3: '₃' };
const FULL = { S: 'Sa', R: 'Ri', G: 'Ga', M: 'Ma', P: 'Pa', D: 'Dha', N: 'Ni' };
const POPULAR = ['mela15', 'mela29', 'mela65', 'mela22', 'mohanam', 'hamsadhwani', 'mela8', 'abhogi'];
const ANGA_NAME = { L: 'Laghu', O: 'Dhrutam', U: 'Anudhrutam', C: 'Part' };
const YATI_TEXT = {
  none: 'no yati',
  sama: 'sama yati: equal blocks',
  gopuccha: 'gopuccha yati: blocks that taper, like a cow’s tail',
  srotovaha: 'srotovaha yati: blocks that widen, like a river',
  mridanga: 'mridanga yati: wide in the middle, like the drum',
  damaru: 'damaru yati: narrow in the middle, like the hourglass drum'
};

/* ---------- formatting ---------- */
function swara(raga, p, numbers) {
  const pc = E.mod12(p), oct = Math.floor(p / 12), lab = raga.labels[pc] || '?', L = lab[0];
  let ch = L;
  if (oct > 0) ch = UP[L] || L + '̇';
  if (oct < 0) ch = DOWN[L] || L + '̣';
  if (numbers && lab.length > 1) ch += SUB[lab[1]] || lab[1];
  return ch;
}
function swaraName(raga, p) {
  const pc = E.mod12(p), oct = Math.floor(p / 12), lab = raga.labels[pc] || '?';
  const base = (FULL[lab[0]] || lab) + (lab.length > 1 ? ' ' + lab[1] : '');
  return base + (oct > 0 ? ' (upper octave)' : oct < 0 ? ' (lower octave)' : '');
}
const plural = (n, one, many) => n + ' ' + (n === 1 ? one : (many || one + 's'));

function ragaInfo(r) {
  const pcs = Array.from(new Set(r.aro.concat(r.avaro).map(E.mod12))).sort((a, b) => a - b);
  const parent = r.kind === 'janya' ? R.melakartas[r.parent - 1] : null;
  return {
    id: r.id, name: r.name, kind: r.kind, cls: r.cls,
    mela: r.mela || null, chakra: r.chakra || null,
    parent: parent ? { mela: parent.mela, name: parent.name } : null,
    popular: POPULAR.includes(r.id),
    aro: r.aro.map(p => ({ p, t: swara(r, p, true), name: swaraName(r, p) })),
    avaro: r.avaro.map(p => ({ p, t: swara(r, p, true), name: swaraName(r, p) })),
    swaras: pcs.map(pc => ({ pc, t: swara(r, pc, true), short: swara(r, pc, false), name: swaraName(r, pc) })),
    count: pcs.length
  };
}
function talaInfo(tl) {
  let pos = 0;
  const angas = tl.angas.map(a => {
    const o = { type: a.type, len: a.len, start: pos, name: ANGA_NAME[a.type] };
    pos += a.len; return o;
  });
  // the kriya: what the hand does on each beat
  const kriya = [];
  tl.angas.forEach(a => {
    for (let k = 0; k < a.len; k++) {
      if (a.type === 'C') kriya.push(k === 0 ? 'clap' : 'count');
      else if (a.type === 'O') kriya.push(k === 0 ? 'clap' : 'wave');
      else kriya.push(k === 0 ? 'clap' : 'count');
    }
  });
  return { fam: tl.fam, L: tl.L, name: tl.name, total: tl.total, angas, kriya, key: tl.fam + '-' + (tl.fam === 'chapu' ? tl.total : tl.L) };
}

/* ---------- argument parsing ---------- */
function getRaga(id) {
  const r = RAGA.get(String(id || ''));
  if (!r) bad('Unknown raga "' + id + '".');
  return r;
}
function getTala(fam, L, { allowChapu } = {}) {
  fam = String(fam || ''); L = Number(L);
  if (fam === 'chapu' && !allowChapu) bad('This exercise uses the 35 suladi talas; chapu talas are for jathis.');
  try { return E.tala(fam, L); } catch (e) { bad(e.message); }
}
function num(v, lo, hi, def) {
  if (v === undefined || v === null || v === '') return def;
  const n = Number(v);
  if (!Number.isFinite(n)) bad('Expected a number, got "' + v + '".');
  return Math.min(hi, Math.max(lo, n));
}
const int = (v, lo, hi, def) => Math.round(num(v, lo, hi, def));
function oneOf(v, list, def) {
  if (v === undefined || v === null || v === '') return def;
  if (!list.includes(v)) bad('Expected one of ' + list.join(', ') + ', got "' + v + '".');
  return v;
}
function motifArg(m, tl) {
  if (!Array.isArray(m) || m.length === 0 || m.length > 64) bad('A pattern must be a list of 1 to 64 notes.');
  const out = m.map(x => {
    const d = Number(x && x.d), dur = Number(x && x.dur);
    if (!Number.isInteger(d) || d < -2 || d > 20 || (dur !== 1 && dur !== 2)) bad('Each note of a pattern needs a scale degree d and a duration of 1 or 2.');
    return { d, dur };
  });
  if (tl && out.reduce((s, x) => s + x.dur, 0) !== tl.total) bad('This pattern does not fill one ' + tl.name + ' cycle.');
  return out;
}

/* ---------- /api/meta ---------- */
let META = null;
export function meta() {
  if (META) return META;
  const talas = [];
  Object.keys(E.FAM).forEach(fam => [3, 4, 5, 7, 9].forEach(L => talas.push(Object.assign(talaInfo(E.tala(fam, L)), { isDefault: E.DEFJ[fam] === L }))));
  [3, 5, 7].forEach(L => talas.push(Object.assign(talaInfo(E.tala('chapu', L)), { isDefault: L === 7 })));
  META = {
    version: E.VERSION,
    ragas: ALL.map(ragaInfo),
    families: Object.keys(E.FAM).map(fam => ({ fam, name: fam[0].toUpperCase() + fam.slice(1), pattern: E.FAM[fam], defaultJati: E.DEFJ[fam] }))
      .concat([{ fam: 'chapu', name: 'Chapu', pattern: 'C', defaultJati: 7 }]),
    jatis: [3, 4, 5, 7, 9].map(L => ({ L, name: E.JATI[L] })),
    talas,
    sheet: Object.keys(E.FAM).map(fam => [4, 3, 7, 5, 9].map(L => { const e = E.pdfEntry(fam, L); return { fam, L, ref: e.ref, title: e.title, asc: e.asc }; })),
    examples: [
      { id: 'adi', title: 'Adi tala, two cycles', blurb: 'A complete, correct jathi. Start here.', script: E.JATHI_EXAMPLES.adi },
      { id: 'short', title: 'One beat missing', blurb: 'The same jathi with a mistake. See how the judge finds it.', script: E.JATHI_EXAMPLES.short },
      { id: 'chapu', title: 'Misra Chapu', blurb: 'A dance tala counted 3 + 2 + 2.', script: E.JATHI_EXAMPLES.chapu },
      { id: 'speed', title: 'Changing speed', blurb: 'Phrases that switch to double speed.', script: E.JATHI_EXAMPLES.speed }
    ]
  };
  return META;
}

/* ---------- /api/alankara ---------- */
function devicesText(d) {
  const parts = [];
  const add = (n, one, many) => { if (n) parts.push(plural(n, one, many)); };
  add(d.runs, 'run'); add(d.turns, 'turn'); add(d.restarts, 'restart on Sa at an anga line', 'restarts on Sa at anga lines');
  add(d.leaps, 'leap'); add(d.karvais, 'held note', 'held notes'); add(d.repeats, 'repeated swara', 'repeated swaras');
  return parts.join(', ');
}
export function alankara(body) {
  const r = getRaga(body.raga), tl = getTala(body.fam, body.L);
  const sheetMotif = E.pdfMotif(tl.fam, tl.L), pe = E.pdfEntry(tl.fam, tl.L);
  const defaultSpan = E.motifSpan(sheetMotif);
  let motif, source = 'sheet', gen = null;
  if (body.generate) {
    const g = body.generate;
    const T = num(g.T, 0, 2, 0.8), span = int(g.span, 3, 7, defaultSpan), seed = int(g.seed, 0, 1e9, 1);
    const avoid = Array.isArray(g.avoid) ? g.avoid.slice(0, 300).map(m => motifArg(m)) : [];
    const res = E.newMotif(tl, { T, seed, span, avoid: [sheetMotif].concat(avoid) });
    if (!res) return { exhausted: true, message: 'You have seen every distinct pattern with a span of ' + span + ' swaras that fits ' + tl.name + '. Try a different span.' };
    motif = res.motif; source = 'new'; gen = { T, span, diff: res.diff };
  } else if (body.motif) {
    motif = motifArg(body.motif, tl);
    if (body.source === 'new') {
      const g = body.generated || {};
      source = 'new'; gen = { T: num(g.T, 0, 2, 0.8), span: int(g.span, 3, 7, defaultSpan), diff: int(g.diff, 0, 64, 0) };
    }
  } else motif = sheetMotif;

  const res = E.alankara(r, tl, motif);
  const P = E.makeProjector(r);
  let badSteps = 0;
  res.lines.forEach(l => { for (let i = 1; i < l.notes.length; i++) if (!P.valid(l.notes[i - 1].p, l.notes[i].p)) badSteps++; });
  const lines = res.lines.map(l => ({
    dir: l.dir,
    notes: l.notes.map(n => ({ p: n.p, dur: n.dur, t: swara(r, n.p, false), tn: swara(r, n.p, true), name: swaraName(r, n.p), adjusted: !!n.adjusted }))
  }));
  const up = lines.filter(l => l.dir === 'asc').length, down = lines.length - up;
  const rep = E.motifReport(motif, tl);
  const beat = Math.round(rep.conventionality * 35);
  const isSheetRaga = r.mela === 15;

  const checks = [
    { ok: true, title: 'Every line fills exactly one cycle of ' + tl.name, detail: res.slotsPerLine + ' beats per line, which is one avartanam in first speed.' },
    { ok: true, title: 'Held notes stay inside their section of the tala', detail: 'A held note (written ,) never crosses an anga line.' },
    { ok: badSteps === 0, title: 'Every step obeys ' + r.name + '’s direction rules', detail: 'Going up, every note is in the arohana; going down, every note is in the avarohana.' },
    { ok: true, title: res.adjustedCount ? plural(res.adjustedCount, 'swara') + ' adjusted to fit the raga' : 'No swaras needed adjusting', detail: res.adjustedCount ? 'They are underlined. The engine changed them so the line keeps its shape and stays in the raga.' : 'The pattern fits ' + r.name + ' as it is.' }
  ];
  let summary;
  if (source === 'sheet') {
    summary = 'This is the traditional first pattern for ' + tl.name + ' (sheet ' + pe.ref + '), ' + (isSheetRaga ? 'in Mayamalavagowla, the raga the sheet is written in.' : 'moved into ' + r.name + '. The sheet is written in Mayamalavagowla; the engine keeps the shape and uses ' + r.name + '’s swaras.') +
      ' Sing it ' + up + ' times going up, starting one swara higher each time, then ' + down + ' times coming down.';
  } else {
    summary = 'A new pattern, made at creativity ' + gen.T.toFixed(1) + '. It differs from the sheet pattern, and from every pattern you have already seen here, in at least ' + gen.diff + ' of ' + tl.total + ' beats. ' +
      (beat ? 'It is more conventional than ' + beat + ' of the 35 sheet patterns.' : 'It is less conventional than every sheet pattern.') + ' It uses ' + (devicesText(rep.devices) || 'plain steps') + '.';
  }
  return {
    raga: ragaInfo(r), tala: talaInfo(tl), motif, source, generated: gen,
    sheet: { ref: pe.ref, title: pe.title, asc: pe.asc, desc: pe.desc }, defaultSpan, span: res.span,
    lines, up, down, slotsPerLine: res.slotsPerLine, adjustedCount: res.adjustedCount,
    report: { conventionality: rep.conventionality, beatsSheetLines: beat, devices: rep.devices, devicesText: devicesText(rep.devices) },
    checks, summary
  };
}

/* ---------- /api/kalpana ---------- */
export function kalpana(body) {
  if (body.rhythm != null) return kalpanaRhythm(body);
  const r = getRaga(body.raga), tl = getTala(body.fam, body.L);
  const aksharas = int(body.aksharas, 2, 64, tl.total), per = int(body.per, 1, 2, 2);
  const start = int(body.start, -12, 24, 0), land = int(body.land, -12, 24, 7);
  const T = num(body.T, 0, 2, 0.8), seed = int(body.seed, 0, 1e9, 3), ending = oneOf(body.ending, ['auto', 'mora', 'free', 'korvai'], 'auto');
  // v0.4: the phrase plan follows the tala's angas (docs/research/kalpana-structure.md)
  const res = E.kalpana(r, { aksharas, perAkshara: per, startPitch: start, targetPitch: land, T, seed, ending, angas: tl.angas.map(a => a.len) });
  const base = { raga: ragaInfo(r), tala: talaInfo(tl), aksharas, per, start, land, T, seed };
  if (!res) return Object.assign(base, { impossible: true, message: 'There is not enough room to get from ' + swaraName(r, start) + ' to ' + swaraName(r, land) + ' in ' + aksharas + ' beats while obeying the raga. Make the round longer or choose swaras closer together.' });
  const units = res.units.map(u => ({
    kind: u.kind, name: u.name, dir: u.dir,
    notes: u.notes.map(n => ({ p: n.p, dur: n.dur, t: swara(r, n.p, false), name: swaraName(r, n.p) }))
  }));
  const counts = { conv: 0, nov: 0, step: 0, mora: 0 };
  units.forEach(u => u.notes.forEach(n => { const k = u.kind === 'start' ? 'step' : u.kind; counts[k] = (counts[k] || 0) + n.dur; }));
  const st = res.stats, slots = aksharas * per;
  const devices = Object.keys(st.devices).map(k => ({ name: k, count: st.devices[k] }));
  const endTxt = res.ending.type === 'korvai'
    ? 'It ends with a korvai: three descending units, each a run with shrinking rests and a mora, landing on ' + swaraName(r, land) + '.'
    : res.ending.type === 'mora'
    ? 'It ends with a mora: the phrase ' + res.ending.phrase.map(p => swara(r, p, false)).join(' ') + ' three times' + (res.ending.q ? ', with ' + plural(res.ending.q, 'beat') + ' of rest between,' : '') + ' landing on ' + swaraName(r, land) + '.'
    : 'It ends freely on ' + swaraName(r, land) + (res.ending.fallbackFrom ? ' (no mora fits this length, so the ending is free).' : '.');
  const pct = x => Math.round(x * 100);
  return Object.assign(base, {
    units, counts, slots, devices,
    ending: { type: res.ending.type, phrase: res.ending.phrase ? res.ending.phrase.map(p => swara(r, p, false)) : null, gap: res.ending.q || 0, fallback: !!res.ending.fallbackFrom, text: endTxt },
    stats: { novelShare: st.novelShare, convShare: st.convShare },
    summary: 'A round of ' + slots + ' swaras (' + aksharas + ' beats × ' + per + ' per beat) in ' + r.name + ', starting on ' + swaraName(r, start) + '. ' + endTxt +
      ' At creativity ' + T.toFixed(1) + ', ' + pct(st.convShare) + '% of the swaras come from familiar devices and ' + pct(st.novelShare) + '% from unusual ones. When it ends, the song line resumes at the eduppu.',
    checks: [
      { ok: true, title: 'Exactly ' + slots + ' swaras', detail: aksharas + ' beats at ' + per + ' swara' + (per > 1 ? 's' : '') + ' per beat, so the song resumes on time.' },
      { ok: true, title: 'Starts on ' + swaraName(r, start) + ' and lands on ' + swaraName(r, land), detail: 'The landing is planned from the start, so the round always arrives.' },
      { ok: true, title: 'Every step obeys ' + r.name + '’s direction rules', detail: 'Going up uses the arohana; going down uses the avarohana.' },
      { ok: true, title: res.ending.type === 'mora' ? 'Mora: three identical statements, equal gaps' : 'Free ending', detail: endTxt }
    ]
  });
}

/* v0.8.3: a round on a rhythm from the korvai lab (E.kalpanaRhythm): body { raga, rhythm, land, T, seed,
   density: 'auto' | 'full', inspiration (v0.8.5: suggested lines, the text or JSON of an answer to the prompt) } */
function inspirationOf(x) {
  if (x == null || x === '') return null;
  if (typeof x === 'string') { if (x.length > 40000) bad('The inspiration is too long.'); return x; }
  if (typeof x === 'object' && !Array.isArray(x)) return x;
  bad('The inspiration must be the text or JSON of an answer.');
}
function kalpanaRhythm(body) {
  const r = getRaga(body.raga), land = int(body.land, -12, 24, 7), T = num(body.T, 0, 2, 0.8), seed = int(body.seed, 0, 1e9, 3);
  const density = oneOf(body.density, ['auto', 'full'], 'auto'), inspiration = inspirationOf(body.inspiration);
  const parsed = E.parseRhythmTemplate(body.rhythm);
  if (parsed.error) bad(parsed.error);
  const res = E.kalpanaRhythm(r, body.rhythm, { targetPitch: land, T, seed, density, inspiration });
  const tlv = parsed.kalai > 1 ? Object.assign({}, parsed.tala, { angas: parsed.tala.angas.map(a => Object.assign({}, a, { len: a.len * parsed.kalai })), total: parsed.tala.total * parsed.kalai }) : parsed.tala;
  const base = { raga: ragaInfo(r), tala: talaInfo(tlv), per: parsed.gati, land, T, seed, density, rhythm: { label: parsed.label, form: parsed.form } };
  if (res.error) return Object.assign(base, { impossible: true, message: res.error });
  const units = res.units.map(u => ({ kind: u.kind === 'gap' ? 'step' : u.kind, name: u.name, inspired: !!u.inspired, notes: u.notes.map(n => n.p == null ? { p: null, dur: n.dur } : { p: n.p, dur: n.dur, t: swara(r, n.p, false), name: swaraName(r, n.p) }) }));
  const counts = { conv: 0, nov: 0, step: 0, mora: 0 };
  units.forEach(u => u.notes.forEach(n => { counts[u.kind] = (counts[u.kind] || 0) + n.dur; }));
  const fams = res.families.map(f => ({ name: (f.role === 'statement' || f.role === 'uttaranga' ? 'cadence' : f.role) + (f.kind === 'nested' ? ' ' + f.lens.slice(0, f.lens.length / (f.rounds || 1)).join('→') + (f.rounds > 1 ? ' × ' + f.rounds : '') : f.kind === 'repeat' ? ' × ' + f.lens.length : '') + ': ' + f.how + '; its line: ' + f.shapes.join(', then '), count: 1 }));
  const aksharas = Math.round((res.slots + res.lead) / parsed.gati);
  return Object.assign(base, {
    aksharas, slots: res.slots, lead: res.lead, units, counts, devices: fams, breath: res.breath, inspiration: res.inspiration,
    ending: { type: 'rhythm', phrase: null, gap: 0, fallback: false, text: 'It ends on ' + swaraName(r, res.ending.final) + ', on the lab’s landing.' },
    stats: { novelShare: (counts.nov || 0) / res.slots, convShare: (counts.conv || 0) / res.slots },
    summary: 'The korvai lab’s rhythm' + (parsed.label ? ' (' + parsed.label + ')' : '') + ', sung in ' + r.name + ': ' + res.slots + ' pulses at ' + parsed.gati + ' a beat, each swara starting on one of the lab’s syllables (' + res.breath.swaras + ' swaras on ' + res.breath.syllables + ' syllables: mostly one swara a syllable, with a held swara now and then at the end of a sollu word) and every gap a karvai.'
      + (res.inspiration && res.inspiration.used.length ? ' ' + res.inspiration.used.length + ' of its phrases come from the suggested lines, fitted to the rhythm and the raga.' : '') + ' A yati (an AP, GP or kuraippu purvanga, a shaped mora) is one line, each phrase the end of it; repeated phrases keep their rhythm but not their swaras: their shape moves to other swaras, or at higher creativity they are re-sung. It lands on ' + swaraName(r, res.ending.final) + '.',
    checks: res.checks.map(c => ({ ok: c.ok, title: c.text, detail: '' }))
  });
}

/* v0.8.5: the prompt for inspired lines on a lab rhythm (E.rhythmPrompt): body { raga, rhythm, land, T } */
export function kalpanaPrompt(body) {
  const r = getRaga(body.raga), land = int(body.land, -12, 24, 7), T = num(body.T, 0, 2, 0.8);
  if (body.rhythm == null) bad('A rhythm from the korvai lab is required.');
  const p = E.rhythmPrompt(r, body.rhythm, { targetPitch: land, T });
  if (p.error) bad(p.error);
  return { raga: ragaInfo(r), system: p.system, prompt: p.prompt, schema: p.schema, phrases: p.phrases, model: llm.MODEL, configured: llm.configured() };
}
/* v0.8.5: ask Claude for lines, then sing the rhythm with them as inspiration */
export async function kalpanaInspire(body) {
  const p = kalpanaPrompt(body);
  const answer = await llm.askClaude({ system: p.system, prompt: p.prompt, schema: p.schema });
  const out = kalpana(Object.assign({}, body, { inspiration: answer }));
  return Object.assign(out, { answer, model: llm.MODEL });
}

/* ---------- v0.8.7: melakartas and katapayadi ---------- */
/* body { n } or { raga } (a janya gives its parent mela) */
export function mela(body) {
  let n = body.n;
  if (n == null && body.raga != null) { const r = getRaga(body.raga); n = r.kind === 'melakarta' ? r.mela : r.parent; }
  n = Number(n);
  if (!(Number.isInteger(n) && n >= 1 && n <= 72)) bad('Give n, a melakarta number from 1 to 72, or a raga.');
  const M = E.melakartaInfo(n);
  return Object.assign(M, { scale: M.aro.map(p => swara(E.melakarta(n), p, false)).join(' '), letters: E.katapayadiLetters(n) });
}
/* body { text } or { swaras: { R, G, M, D, N } } */
export function katapayadi(body) {
  if (body.swaras != null) { const r = E.melaFromSwaras(body.swaras); if (r.error) bad(r.error); return r; }
  if (typeof body.text !== 'string' || !body.text.trim()) bad('Give text, a word to decode.');
  const k = E.katapayadi(body.text);
  if (k.error) bad(k.error);
  return Object.assign(k, { mela: k.number >= 1 && k.number <= 72 ? { n: k.number, name: E.MELA_NAMES[k.number - 1] } : null });
}

/* ---------- jathis ---------- */
function role(r) { return r === 'teermanam' ? 'teer' : r; }
export function jathiGenerate(body) {
  const fam = String(body.fam || 'triputa');
  const tl = getTala(fam, body.L, { allowChapu: true });
  const nadai = oneOf(Number(body.nadai), [3, 4, 5, 7, 9], 4), avartanams = int(body.avartanams, 1, 4, 2);
  const cycle = tl.total * nadai;
  const eduppu = int(body.eduppu, -(cycle - 1), cycle - 1, 0);
  const yati = oneOf(body.yati, ['auto', 'none', 'sama', 'gopuccha', 'srotovaha', 'mridanga', 'damaru'], 'auto');
  const land = oneOf(body.land, ['sam', 'end'], 'sam');
  const T = num(body.T, 0, 2, 0.8), seed = int(body.seed, 0, 1e9, 5);
  const settings = { tala: talaInfo(tl), nadai, avartanams, eduppu, cycle, yati, land, T, seed };
  const res = E.jathi({ tl, nadai, avartanams, offset: eduppu, yatiPref: yati, land, T, seed });
  if (res.error) return Object.assign(settings, { error: res.error });
  const lead = eduppu >= 0 ? eduppu : cycle + eduppu;
  const slots = [];
  const parts = [];
  res.segs.forEach(sg => {
    const rl = role(sg.role);
    const last = parts[parts.length - 1];
    // the opening phrases merge into one block; yati blocks and teermanam statements stay separate to show their shape
    if (last && rl === 'body' && last.role === 'body') last.len += sg.syl.length; else parts.push({ role: rl, len: sg.syl.length });
    sg.syl.forEach((s, i) => slots.push({ t: s, role: rl, first: i === 0 && rl !== 'gap', hold: s === ',' }));
  });
  const Jg = E.judgeJathi(res.script);
  const yatiType = res.plan.yati;
  const teerPhrase = res.plan.teer.join(' ');
  const edTxt = eduppu === 0 ? 'starting on sam (beat 1)' : eduppu > 0 ? 'starting ' + plural(eduppu, 'matra') + ' after sam' : 'starting ' + plural(-eduppu, 'matra') + ' before sam';
  return Object.assign(settings, {
    lead, slots, parts, script: res.script,
    teermanam: { phrase: res.plan.teer, gap: res.plan.q },
    yatiType, yatiText: YATI_TEXT[yatiType] || yatiType,
    audit: res.audit,
    judge: Jg.ok ? { total: Jg.total, grade: Jg.grade, gatePass: Jg.gatePass, aspects: Jg.aspects.map(a => ({ name: a.name, score: a.score, max: a.max })) } : null,
    summary: 'A jathi for ' + tl.name + ' in nadai ' + nadai + ' (' + nadai + ' syllables per beat), ' + plural(avartanams, 'cycle') + ' long, ' + edTxt + '. ' +
      'It opens with free phrases, ' + (yatiType === 'none' ? 'goes straight to' : 'builds through a ' + YATI_TEXT[yatiType] + ', then ends with') + ' a teermanam: "' + teerPhrase + '" said three times' +
      (res.plan.q ? ' with ' + plural(res.plan.q, 'matra') + ' of rest between' : '') + (land === 'sam' ? ', so the last "' + res.plan.teer[res.plan.teer.length - 1] + '" falls exactly on sam.' : ', finishing exactly at sam.'),
    checks: [
      { ok: true, title: 'The length is exact', detail: res.audit.span + '.' },
      { ok: res.audit.ok, title: 'The parts add up', detail: 'Opening ' + res.audit.body + ' + yati ' + res.audit.yatiLen + ' + teermanam ' + res.audit.teermanam + ' = ' + res.used + ' syllable slots.' },
      { ok: true, title: 'The teermanam repeats three times with equal gaps', detail: '"' + teerPhrase + '" × 3' + (res.plan.q ? ', separated by ' + plural(res.plan.q, 'matra') + ' of karvai.' : ', back to back.') },
      { ok: !!(Jg.ok && Jg.gatePass), title: 'The judge agrees', detail: Jg.ok ? 'Scored ' + Jg.total + '/100 (' + Jg.grade + ') when read back as JathiScript.' : 'The exported script did not parse.' }
    ]
  });
}

const lcm = (a, b) => { const g = (x, y) => y ? g(y, x % y) : x; return a / g(a, b) * b; };
export function jathiJudge(body) {
  const script = String(body.script == null ? '' : body.script);
  if (script.length > 20000) bad('That script is too long (over 20,000 characters).');
  const J = E.judgeJathi(script);
  if (!J.ok) return { ok: false, errors: J.errors.slice(0, 20).map(e => ({ line: e.line || null, col: e.col || null, msg: e.msg })), warnings: (J.warnings || []).map(w => ({ line: w.line || null, msg: w.msg })) };
  const P = J.parsed, kal = P.kalai;
  const dtl = kal === 1 ? P.tl : Object.assign({}, P.tl, { angas: P.tl.angas.map(a => Object.assign({}, a, { len: a.len * kal })), total: P.tl.total * kal });
  const per = [P.nadai].concat(P.speeds.map(s => s.n)).reduce(lcm);
  const cycTicks = P.cycleTicks;
  const gridStart = P.E0 >= 0 ? 0 : -cycTicks;
  let grid = null;
  if (per <= 24) {
    const tick = E.TICKS / per;
    const lead = (P.E0 - gridStart) / tick;
    const slots = []; for (let i = 0; i < lead; i++) slots.push({ t: '', role: 'pre' });
    const starts = new Set(P.units.map(u => u.start));
    const sylIdx = P.events.map((e, i) => e.k === 'syl' ? i : -1).filter(i => i >= 0), lastSyl = sylIdx[sylIdx.length - 1];
    P.events.forEach((ev, i) => {
      const n = Math.round(ev.dur / tick);
      slots.push({ t: ev.k === 'kv' ? ',' : ev.v, role: ev.role === 'teer' ? 'teer' : ev.role === 'gap' ? 'gap' : 'body', hold: ev.k === 'kv', first: starts.has(ev.start) && ev.k === 'syl', land: i === lastSyl });
      for (let j = 1; j < n; j++) slots.push({ t: '', role: 'sub' });
    });
    grid = { slots, per, tala: talaInfo(dtl) };
  }
  const eduppu = P.eduppu;
  return {
    ok: true, total: J.total, grade: J.grade, gatePass: J.gatePass, cap: J.cap,
    gate: J.gate.map(g => ({ id: g.id, ok: g.ok, title: g.label, detail: g.detail })),
    fixes: J.fixes,
    aspects: J.aspects.map(a => ({ id: a.id, name: a.name, score: a.score, max: a.max, notes: a.notes })),
    warnings: J.warnings.map(w => ({ line: w.line || null, msg: w.msg })),
    info: {
      tala: P.tl.name, nadai: P.nadai, kalai: kal, avartanams: J.avartanams, avartanamsInferred: !P.avartanams,
      eduppu, land: P.land.type === 'after' ? '+' + P.land.k : P.land.type,
      teermanam: J.teer ? (J.teer.explicit ? 'written with { }' : 'detected') : null, yati: J.yati ? J.yati.type : null
    },
    grid,
    play: {
      ticksPerBeat: E.TICKS, gridStart, end: P.E0 + P.total, cycleBeats: dtl.total,
      angaStarts: Array.from(E.angaStarts(dtl)),
      events: P.events.filter(e => e.k === 'syl').map(e => ({ at: P.E0 + e.start, v: e.v }))
    }
  };
}

/* ---------- render: a line of swaras as the voice sings it (docs/research/expressive-voice.md) ----------
   body { raga, notes: [{ p, dur }] (p null for a rest, dur in slots), bpm, per, intensity 0–1, seed?,
          cycleBeats?, angaStarts?, units? }. Returns the pitch contour with the raga's gamaka at that
   intensity (straight notes sung legato at 0), its legato groups and the expression layer (phrases,
   stress, loudness), in the form web/shared/voice.js sings. Rendering only: the notes are not changed. */
export function render(body) {
  const r = getRaga(body.raga);
  if (!Array.isArray(body.notes) || !body.notes.length || body.notes.length > 4000) bad('notes must be a list of 1 to 4000 swaras.');
  const notes = body.notes.map(n => {
    const p = n && n.p === null ? null : Number(n && n.p), dur = Number(n && n.dur);
    if (p !== null && !(Number.isInteger(p) && p >= -24 && p <= 36)) bad('A swara pitch must be a whole number of semitones from Sa (-24 to 36).');
    if (!(Number.isInteger(dur) && dur >= 1 && dur <= 64)) bad('A swara lasts 1 to 64 slots.');
    return { p, dur };
  });
  const bpm = num(body.bpm, 20, 300, 72), per = int(body.per, 1, 18, 2), intensity = num(body.intensity, 0, 1, 0.55), seed = int(body.seed, 1, 1e9, 1);
  const cycleBeats = body.cycleBeats == null ? undefined : int(body.cycleBeats, 1, 128, 8);
  const angaStarts = Array.isArray(body.angaStarts) ? body.angaStarts.slice(0, 32).map(x => int(x, 0, 127, 0)) : undefined;
  let units;
  if (Array.isArray(body.units)) {
    units = body.units.map(u => ({ kind: String(u && u.kind || ''), notes: Array.isArray(u && u.notes) ? u.notes.map(() => ({})) : [] }));
    if (units.reduce((s, u) => s + u.notes.length, 0) !== notes.length) units = undefined;   // must cover the notes exactly
  }
  const c = E.renderGamaka(notes, { raga: r, slotSec: 60 / bpm / per, intensity, voice: true, seed, per, cycleBeats, angaStarts, units });
  const q = (x, k) => Math.round(x * k) / k;
  return {
    raga: r.id, bpm, per, intensity, slotSec: 60 / bpm / per,
    groups: c.groups.map(g => ({ t0: q(g.t0, 1e5), t1: q(g.t1, 1e5), points: g.points.map(pt => [q(pt.t, 1e5), q(pt.p, 1e4)]) })),
    notes: c.notes.map(n => ({ i: n.i, t0: q(n.t0, 1e5), t1: q(n.t1, 1e5), p: n.p, shape: n.shape || null, rule: n.rule || null })),
    expression: { phrases: c.expression.phrases, notes: c.expression.notes, gain: c.expression.gain.map(g => g.map(x => [x.t, x.g])) },
    stats: c.stats
  };
}
