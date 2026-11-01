import { makeProjector, mod12 } from '../projection.js';
import { getProfile } from '../profiles.js';
import { rng, dial } from '../random.js';
import { tala as makeTala, customTala } from '../talas.js';
import { KALPANA_RANGE, eduppuNeighbours } from './landing.js';
import { parseInspiration } from './sargam.js';

/* Vocal Gym engine · kalpana swaras on a rhythm from the korvai lab (v0.8.3)
   The korvai and tihai lab gives the rhythm: every pulse, which phrase it belongs to, where the gaps are,
   where the cadence (the mora statements or uttaranga) is and where the passage lands. kalpanaRhythm()
   sings it in a raga, following what the kalpana literature describes for swara designs
   (docs/research/kalpana-structure.md, after Field 2018 and Vidya Subramanian 2008):
     - every swara starts on one of the lab's syllables; held syllables and the lab's gaps become karvais
       (held swaras), so the rhythm, and with it the AP, GP, kuraippu or yati, is unchanged. Not every
       syllable needs its own swara (v0.8.5): weak pulses may be held from the swara before, while phrase
       starts, the beat's strong pulses and a cadence's last syllable always sound;
     - phrases are grouped into families from the syllables themselves: identical phrases repeat, and
       phrases that are the ends of one longer phrase (a yati or pattern purvanga, a shaped mora) form a
       nested family. A family is sung from one line, and each member is the end of that line, so a
       gopuccha of swaras keeps its ending ("P M G R S, M G R S, G R S …") as the lab's sollus do;
     - each line moves by step and mostly descends into its last swara ("the melodic contour in each unit
       usually descends", Field 2018 p. 7), a resting swara of the raga (nyasa, landing or jiva, or S and P);
     - repeats are identical, or at higher creativity a sequence, each a step lower, like the Todi korvai's
       mora (Field Ex. 3);
     - the cadence's line ends on the swara just below or above the eduppu, so the song resumes on time.
   Hard: the exact length and onsets, the direction rule on every move, no hard-avoid phrase, no leap of
   more than a fifth inside a line or of more than a sixth at a join. Deterministic.
   Suggested lines (opts.inspiration: a language model's answer to rhythmPrompt(), see inspire.js) are
   fitted to the rhythm and the raga and sung only where every hard rule still holds. */

const ROLES = new Set(['pre', 'purvanga', 'pgap', 'statement', 'gap', 'uttaranga', 'mukhra', 'close', 'count', 'speed1', 'speed2', 'speed3']);
const GAP = new Set(['gap', 'pgap']);
const CADENCE = new Set(['statement', 'uttaranga']);
const isSyl = s => !!s && s !== ',';

/* ---------- the template ---------- */
/* the lab's output: its frame and the cells of a layout (from layoutParts). When the lab counts the last
   syllable on the landing, that syllable is the eduppu itself, so it becomes the closing cell. */
export function rhythmTemplate(F, layout, meta) {
  const cells = layout.cells.map(c => ({ s: String(c.syl == null ? '' : c.syl), r: c.role, f: c.first ? 1 : 0 }));
  if (F.counting === 'on' && cells[layout.landIndex]) cells[layout.landIndex] = { s: cells[layout.landIndex].s, r: 'close', f: 1 };
  const tl = F.tala;
  return {
    v: 1, tala: tl.fam === 'custom' ? { fam: 'custom', angas: tl.angas.map(a => a.len) } : { fam: tl.fam, L: tl.fam === 'chapu' ? tl.total : tl.L },
    gati: F.gati, kalai: F.kalai, cycles: F.cycles, start: F.start, land: F.land, cells,
    label: (meta && meta.label) || '', form: (meta && meta.form) || ''
  };
}
/* checks a template (it may come from a page or a request); returns { error } or the parsed rhythm */
export function parseRhythmTemplate(t) {
  if (!t || typeof t !== 'object' || t.v !== 1) return { error: 'The rhythm is not one from the korvai lab (version 1).' };
  let tl;
  try {
    if (t.tala && t.tala.fam === 'custom') {
      const a = t.tala.angas;
      if (!Array.isArray(a) || !a.length || a.length > 16 || a.some(x => !(Number.isInteger(x) && x >= 1 && x <= 16))) return { error: 'The rhythm’s custom tala is not valid.' };
      tl = customTala(a);
    } else tl = makeTala(String(t.tala && t.tala.fam), Number(t.tala && t.tala.L));
  } catch (e) { return { error: 'The rhythm’s tala is not valid: ' + e.message }; }
  const gati = Number(t.gati), kalai = Number(t.kalai || 1);
  if (!(Number.isInteger(gati) && gati >= 1 && gati <= 18)) return { error: 'The rhythm’s gati must be 1 to 18 pulses a beat.' };
  if (![1, 2, 4].includes(kalai)) return { error: 'The rhythm’s kalai must be 1, 2 or 4.' };
  if (!Array.isArray(t.cells) || !t.cells.length || t.cells.length > 6000) return { error: 'The rhythm must have 1 to 6000 pulses.' };
  const cells = [];
  for (const c of t.cells) {
    if (!c || typeof c !== 'object' || typeof c.s !== 'string' || c.s.length > 12 || !/^[a-z,]*$/i.test(c.s) || !ROLES.has(c.r)) return { error: 'The rhythm has a pulse that is not valid.' };
    cells.push({ s: c.s, r: c.r, f: c.f ? 1 : 0 });
  }
  let lead = 0; while (lead < cells.length && cells[lead].r === 'pre') lead++;
  const ci = cells.findIndex(c => c.r === 'close');
  if (ci >= 0 && ci !== cells.length - 1) return { error: 'The rhythm’s closing pulse must be its last.' };
  const body = cells.slice(lead, ci >= 0 ? ci : cells.length);
  if (!body.some(c => isSyl(c.s) && !GAP.has(c.r))) return { error: 'The rhythm has no syllables to sing.' };
  if (body.some(c => c.r === 'pre')) return { error: 'The rhythm has silence inside it.' };
  return { tala: tl, gati, kalai, lead, cells, body, closed: ci >= 0, label: String(t.label || '').slice(0, 200), form: String(t.form || '').slice(0, 40), start: Number(t.start) || 0, land: Number(t.land) || 0 };
}

/* the phrases of a rhythm (a phrase starts at a `first` cell outside a gap) and their families */
function phrasesOf(body) {
  const out = [];
  let cur = null;
  body.forEach((c, i) => {
    if (GAP.has(c.r)) { if (c.f || cur) cur = null; return; }
    if (c.f || !cur) { cur = { i: out.length, role: c.r, cells: [], sylls: [], sc: [] }; out.push(cur); }
    cur.cells.push(i);
    if (isSyl(c.s)) { cur.sylls.push(c.s.toLowerCase()); cur.sc.push(i); }
  });
  return out.filter(p => p.sylls.length);
}
/* where a swara must start inside a beat of g pulses: its first pulse and the strong subdivision(s)
   (4 = 2 + 2, 5 = 2 + 3, 7 = 3 + 4, 9 = 3 + 3 + 3) */
const STRONG = { 3: [0], 4: [0, 2], 5: [0, 2], 6: [0, 3], 7: [0, 3], 8: [0, 4], 9: [0, 3, 6] };
const strongAt = (pos, g) => pos === 0 || (STRONG[g] || [0, Math.floor(g / 2)]).includes(pos);
// how often a swara starts on a weak pulse, before creativity: the faster the gati, the more is held
const weakKeep = g => g <= 3 ? 0.45 : g <= 5 ? 0.3 : g === 6 ? 0.25 : 0.2;
const suffix = (a, b) => a.length <= b.length && a.every((x, k) => x === b[b.length - a.length + k]);
function familiesOf(ph) {
  const fams = [];
  ph.forEach((q, k) => {
    let f = null;
    for (let j = fams.length - 1; j >= 0 && !f; j--) {
      const g = fams[j];
      // the three speeds of a trikaala are one phrase: one family
      if (g.role.replace(/^speed\d$/, 'speed') !== q.role.replace(/^speed\d$/, 'speed')) continue;
      const rel = suffix(q.sylls, g.master) || suffix(g.master, q.sylls);
      const adjacent = g.members[g.members.length - 1] === k - 1;
      if (rel && (Math.min(q.sylls.length, g.master.length) >= 2 || adjacent)) f = g;
    }
    if (!f) { f = { id: fams.length, role: q.role, master: q.sylls, members: [] }; fams.push(f); }
    if (q.sylls.length > f.master.length) f.master = q.sylls;
    f.members.push(k); q.fam = f.id;
  });
  fams.forEach(f => {
    const lens = f.members.map(k => ph[k].sylls.length);
    f.n = Math.max(...lens); f.lens = lens;
    f.kind = f.members.length === 1 ? 'single' : lens.every(x => x === lens[0]) ? 'repeat' : 'nested';
    // a nested family that comes back whole (a yati in each of three statements) has rounds
    // rounds: the shortest period of the length pattern (6 8 10 12 6 8 10 12 …), so a damaru's 11 10 9 10 11 stays one round
    const m = lens.length; let per = m;
    for (let p = 1; p < m; p++) if (m % p === 0 && lens.every((x, j) => x === lens[j % p])) { per = p; break; }
    if (f.kind !== 'nested') per = m;
    f.first = [];
    f.members.forEach((k, j) => { const r = Math.floor(j / per); ph[k].round = r; if (f.first[r] == null) f.first[r] = j; });
    f.rounds = Math.ceil(m / per);
  });
  return fams;
}

/* the phrases and families of a rhythm, as kalpanaRhythm sees them (for rhythmPrompt) */
export function rhythmPhrases(template) {
  const R = parseRhythmTemplate(template);
  if (R.error) return R;
  const ph = phrasesOf(R.body);
  return { R, phrases: ph, families: familiesOf(ph) };
}

/* ---------- singing it ---------- */
/* opts: { eduppuPitch (the swara the song resumes on; the passage ends next to it) or targetPitch (the
   swara to end on), T (creativity 0–2), seed, karvai: 'hold' (default) or 'rest', melody: 'auto' |
   'repeat' | 'sequence', density: 'auto' (default: weak pulses may be held) | 'full' (a swara on every
   syllable), inspiration: suggested lines, the text or JSON of { phrases: [{ phrase, swaras }] } } */
export function kalpanaRhythm(raga, template, opts = {}) {
  const R = parseRhythmTemplate(template);
  if (R.error) return { error: R.error, code: 'bad-rhythm' };
  const D = dial(opts.T == null ? 0.8 : opts.T), c = D.c, Pj = makeProjector(raga), profile = getProfile(raga);
  const pcs = Array.from(new Set(raga.aro.concat(raga.avaro).map(mod12))).sort((a, b) => a - b);
  const notes = []; for (let o = -1; o <= 1; o++) pcs.forEach(pc => { const p = pc + 12 * o; if (p >= KALPANA_RANGE[0] && p <= KALPANA_RANGE[1]) notes.push(p); });
  notes.sort((a, b) => a - b);
  const ix = p => notes.indexOf(p);
  // the landing: next to the eduppu, or a chosen swara
  let targets;
  if (opts.eduppuPitch != null) {
    const nb = eduppuNeighbours(raga, opts.eduppuPitch);
    if (nb.error) return { error: nb.error, code: nb.code };
    targets = [nb.lo, nb.hi].filter(p => p != null && ix(p) >= 0);
    if (!targets.length) return { error: 'No swara of ' + raga.name + ' in range steps legally into that eduppu.', code: 'no-neighbour' };
  } else if (opts.targetPitch != null) {
    if (ix(opts.targetPitch) < 0) return { error: 'The landing swara is not a swara of ' + raga.name + ' inside the kalpana range.', code: 'target-not-in-raga' };
    targets = [opts.targetPitch];
  } else return { error: 'Give eduppuPitch, the swara the song resumes on (or targetPitch, the swara to end on).', code: 'no-landing' };

  const ph = phrasesOf(R.body), fams = familiesOf(ph);
  const lastPhrase = ph[ph.length - 1], cadFam = fams[lastPhrase.fam];
  const rest = new Set(profile ? profile.nyasa.concat(profile.landing, profile.jiva) : [0, 7]);
  const bad = new Set(profile ? profile.alpa.concat(profile.avoidLanding, profile.notNyasa) : []);
  const anchors = notes.filter(p => (rest.has(mod12(p)) || mod12(p) === 0 || mod12(p) === 7) && !bad.has(mod12(p)) && p >= -2 && p <= 16);
  const hardAvoid = profile ? profile.avoid.filter(a => a.strength === 'hard').map(a => a.pitches) : [];
  const hasRun = (seq, pat) => { for (let i = 0; i + pat.length <= seq.length; i++) if (pat.every((x, k) => seq[i + k] === x)) return true; return false; };
  const melody = opts.melody || 'auto';

  /* one line of n swaras ending on `end`, built backwards: each earlier swara a step (sometimes two) above
     the next, so the line descends into its end; it turns upward only at the edge of the range or now and
     then at higher creativity, and every move obeys the direction rule */
  function line(end, n, rand) {
    const out = [end];
    let dir = 1, lo = ix(end), hi = ix(end);   // dir: the earlier swara is above (+1) or below (−1) the next
    // a line stays within about an octave (7 raga steps) and below tara Ga, turning back at its edges
    const W = 7, top = notes.filter(p => p <= 16).length - 1;
    for (let k = 1; k < n; k++) {
      const cur = out[0], i = ix(cur);
      if (rand() < 0.06 + 0.16 * c) dir = -dir;
      let made = false;
      for (const d of [dir, -dir]) {
        const steps = rand() < 0.12 + 0.22 * c ? [2, 1] : [1, 2];
        for (const s of steps) {
          const j = i + d * s;
          if (j < 0 || j > top || Math.max(hi, j) - Math.min(lo, j) > W) continue;
          const prev = notes[j];
          if (!Pj.valid(prev, cur)) continue;
          out.unshift(prev); made = true; dir = d; lo = Math.min(lo, j); hi = Math.max(hi, j); break;
        }
        if (made) break;
      }
      if (!made) out.unshift(cur);   // a repeated swara is always legal
    }
    return out;
  }
  /* ---- a repeated rhythm is not a repeated melody (v0.8.4) ----
     A singer keeps the rhythm of a repeated phrase and changes its swaras. At low creativity the shape is
     kept and moved: the same contour from another swara, as an alankara climbs the scale (a step lower or
     higher each time, by thirds, in an arch or a wave), with the raga's direction rule restored where a
     moved swara breaks it (the projector's repair, as alankaras do for janya ragas). As creativity rises
     the repetitions are varied: a new opening on the same ending, the contour turned upside down, or a
     fresh line to the same rhythm. Exact repetition is kept where the tradition wants it: a trikaala's
     three speeds, and some moras at low creativity. */
  const inRange = ps => ps && ps.every(p => p != null && ix(p) >= 0 && p <= 16);
  const fit = naive => { if (naive.some(p => p == null)) return null; const r = Pj.repair(naive); return r.feasible && inRange(r.pitches) ? r.pitches : null; };
  const transpose = (b, s) => s === 0 ? b.slice() : fit(b.map(p => notes[ix(p) + s]));
  const invert = b => { const L = ix(b[b.length - 1]); return fit(b.map(p => notes[2 * L - ix(p)])); };
  const recompose = (b, keep, rand) => { if (keep >= b.length) return b.slice(); const tail = b.slice(-keep), head = line(tail[0], b.length - keep + 1, rand); return head.slice(0, -1).concat(tail); };
  const PLANS = {
    down: (k, m) => m - 1 - k, up: (k, m) => -(m - 1 - k), thirds: (k, m) => 2 * (m - 1 - k),
    arch: (k, m) => k === m - 1 ? 0 : (k % 2 ? 2 : 1), wave: (k, m) => k === m - 1 ? 0 : [2, -1, 1, -2][k % 4]
  };
  const HOW = { down: 'the same shape, each a step lower', up: 'the same shape, each a step higher', thirds: 'the same shape from every other swara, as an alankara', arch: 'the same shape, rising then settling', wave: 'the same shape, moving up and down the scale' };
  // the offset of occurrence k of m: groups of three (a series, a chakkardar) follow the plan inside and step down between
  const offsetOf = (plan, k, m) => { if (m > 4 && m % 3 === 0) { const g = Math.floor(k / 3), G = m / 3; return PLANS[plan](k % 3, 3) + (G - 1 - g); } return PLANS[plan](k, m); };
  const weighted = (items, rand) => { const tot = items.reduce((s, x) => s + x[1], 0); let r = rand() * tot; for (const [v, w] of items) { r -= w; if (r <= 0) return v; } return items[items.length - 1][0]; };

  /* ---- breath (v0.8.5): not every pulse needs its own swara ----
     A run of syllables (tha ka dhi mi tha) is the rhythm, not a demand for one swara on each pulse. A
     swara starts on every phrase's first syllable and on the beat's strong pulses; a weak pulse is held from
     the swara before it at a rate that falls as the gati quickens and rises with creativity. The breath is
     the family's, counted from the end, so repeats breathe alike and a yati's lines are the ends of one line
     in rhythm as well as in swaras. A cadence always sounds its last syllable, and the lab's own karvais
     (the "D , ," at a phrase end) stay as they are. A trikaala keeps every syllable: its speeds are the point. */
  const full = opts.density === 'full' || R.gati <= 2;
  const refPos = fams.map(f => { const q = ph[f.members[f.lens.indexOf(Math.max(...f.lens))]]; return q.sc.map(i => (R.lead + i) % R.gati).reverse(); });
  const breath = (f, rand) => {
    const all = full || /^speed\d$/.test(f.role), p = weakKeep(R.gati) + 0.15 * c;
    return refPos[f.id].map((pos, d) => all || strongAt(pos, R.gati) || (d === 0 && (f === cadFam || CADENCE.has(f.role))) || rand() < p ? 1 : 0);
  };
  const maskOf = (q, fm) => q.sylls.map((_, j) => j === 0 || fm[q.sylls.length - 1 - j] ? 1 : 0);
  const count = m => m.reduce((a, b) => a + b, 0);
  const pOf = new Map(); ph.forEach((q, k) => q.cells.forEach(i => pOf.set(i, k)));

  /* the passage, pulse by pulse: a swara where the mask starts one, a karvai where it holds */
  function assemble(pitches, masks) {
    const out = [], units = [], cur = ph.map(() => 0), syl = ph.map(() => 0);
    let unit = null;
    R.body.forEach((cl, i) => {
      const k = pOf.get(i);
      if (k != null && isSyl(cl.s) && masks[k][syl[k]++]) {
        const q = ph[k], n = { p: pitches[k][cur[k]++], dur: 1 };
        if (!unit || unit.phrase !== k) { unit = { phrase: k, fam: q.fam, role: q.role, notes: [] }; units.push(unit); }
        unit.notes.push(n); out.push(n);
      } else if (out.length && (k != null || opts.karvai !== 'rest')) out[out.length - 1].dur++;
      else { const n = { p: null, dur: 1 }; if (out.length && out[out.length - 1].p === null) out[out.length - 1].dur++; else { out.push(n); units.push({ phrase: null, role: 'gap', notes: [n] }); unit = null; } }
    });
    return { out, units };
  }
  /* the hard rules: a reason when one is broken, else the swaras and the joins */
  function legal(pitches, out) {
    const seq = out.filter(n => n.p != null).map(n => n.p);
    if (seq.some(p => p == null || ix(p) < 0)) return 'range';
    for (let i = 1; i < seq.length; i++) if (!Pj.valid(seq[i - 1], seq[i])) return 'direction';
    const joins = [];
    for (let k = 1; k < ph.length; k++) { const a = pitches[k - 1][pitches[k - 1].length - 1], b = pitches[k][0]; joins.push(Math.abs(b - a)); if (Math.abs(b - a) > 9) return 'join'; }
    for (const q of pitches) for (let i = 1; i < q.length; i++) if (Math.abs(q[i] - q[i - 1]) > 7) return 'leap';
    if (hardAvoid.some(pat => hasRun(seq, pat))) return 'avoid';
    return { seq, joins };
  }

  function attempt(seed) {
    const rand = rng(seed), target = targets[Math.floor(rand() * targets.length)];
    const lines = {}, styles = {}, plans = {}, hows = {};
    // each family's breath, then its line as long as its longest member's swaras
    const fm = {}; fams.forEach(f => { fm[f.id] = breath(f, rand); });
    const masks = ph.map(q => maskOf(q, fm[q.fam])), nOn = {};
    fams.forEach(f => { nOn[f.id] = Math.max(...f.members.map(k => count(masks[k]))); });
    // the cadence ends on the landing; the others on a resting swara
    fams.forEach(f => {
      let end;
      if (f === cadFam) end = target;
      else { const pool = anchors.length ? anchors : notes; end = pool[Math.floor(rand() * pool.length)]; }
      lines[f.id] = line(end, nOn[f.id], rand);
      const speed = /^speed\d$/.test(f.role), cad = f === cadFam;
      if (f.kind === 'repeat') {
        if (speed || melody === 'repeat') styles[f.id] = 'repeat';
        else if (melody === 'sequence') styles[f.id] = 'sequence';
        else styles[f.id] = weighted([['repeat', (cad ? 0.35 : 0.08) * (1 - c)], ['sequence', 1.1 - 0.6 * c], ['varied', 0.15 + 1.3 * c]], rand);
        plans[f.id] = weighted([['down', 0.32], ['thirds', 0.24], ['up', 0.16 + 0.1 * c], ['arch', 0.18 + 0.15 * c], ['wave', 0.1 + 0.2 * c]], rand);
      } else { styles[f.id] = f.kind; if (f.kind === 'nested' && f.rounds > 1) plans[f.id] = weighted([['down', 0.32], ['thirds', 0.22], ['up', 0.2], ['arch', 0.16 + 0.15 * c], ['wave', 0.1 + 0.2 * c]], rand); }
      hows[f.id] = styles[f.id] === 'repeat' ? (speed ? 'one phrase at three speeds' : 'identical') : styles[f.id] === 'sequence' ? HOW[plans[f.id]] : styles[f.id] === 'varied' ? 'varied: the rhythm kept, the swaras re-sung' : styles[f.id] === 'nested' ? (c >= 0.5 ? 'one line, each phrase its end, the openings re-sung' : 'one line, each phrase its end') + (f.rounds > 1 ? '; each of its ' + f.rounds + ' rounds ' + HOW[plans[f.id]].replace('the same shape, ', '').replace('the same shape ', '') : '') : 'one phrase';
    });
    // a round of a repeated yati moves as one: the first offset (of the plan's, its mirror, or a step
    // either side) that fits the family's whole line, so every line of the round shifts together
    const shifts = {};
    const roundShift = (f, r) => {
      const key = f.id + ':' + r;
      if (shifts[key] != null) return shifts[key];
      const o = offsetOf(plans[f.id], r, f.rounds);
      for (const s of [o, -o, o + 1, o - 1, -o + 1, -o - 1, 0]) if (s === 0 || transpose(lines[f.id], s)) return (shifts[key] = s);
      return (shifts[key] = 0);
    };
    const rlines = {};
    const roundLine = (f, r) => { const key = f.id + ':' + r; return rlines[key] || (rlines[key] = transpose(lines[f.id], roundShift(f, r)) || lines[f.id]); };
    const seen = {}, pitches = ph.map((q, qk) => {
      const f = fams[q.fam], n = count(masks[qk]), base = lines[f.id].slice(-n), st = styles[f.id];
      const k = seen[f.id] = (seen[f.id] == null ? 0 : seen[f.id] + 1), m = f.members.length, isLast = k === m - 1;
      if (st === 'nested') {
        // a yati keeps its shared ending inside a round; when the whole yati comes back (the purvanga of
        // each of three statements), each round is the yati moved to another swara, like a repeat
        // the round's whole line is moved (and repaired) once, and each line of the round is its end
        const r = q.round, rl = f.rounds > 1 ? roundLine(f, r) : lines[f.id], mv = rl.slice(-n);
        if (c < 0.5 || n <= 3 || f.first[r] === k) return mv;
        return recompose(mv, Math.max(2, Math.ceil(n * (1 - 0.55 * c))), rand);
      }
      if (st === 'repeat' || st === 'single') return base;
      const shifted = transpose(base, offsetOf(plans[f.id], k, m)) || transpose(base, -offsetOf(plans[f.id], k, m)) || base;
      if (st === 'sequence') return shifted;
      // varied: the occurrence's own way; the cadence's last one still ends on the landing
      const op = weighted([['transpose', 1], ['recompose', 0.5 + 1.2 * c], ['invert', 0.5 * c], ['fresh', Math.max(0, c - 0.35) * 1.6]], rand);
      if (op === 'transpose') return isLast && f === cadFam ? base : shifted;
      if (op === 'recompose') return recompose(isLast && f === cadFam ? base : shifted, Math.max(2, Math.ceil(n * (0.6 - 0.25 * c))), rand);
      if (op === 'invert') return (isLast && f === cadFam ? invert(base) : invert(shifted)) || shifted;
      return line(isLast && f === cadFam ? target : shifted[n - 1], n, rand);
    });
    const { out, units } = assemble(pitches, masks), L = legal(pitches, out);
    if (typeof L === 'string') return null;
    const { seq, joins } = L;
    let S = -0.12 * joins.reduce((a, b) => a + b, 0) / Math.max(1, joins.length) * joins.length / 3;
    let skips = 0; pitches.forEach(q => { for (let i = 1; i < q.length; i++) if (Math.abs(ix(q[i]) - ix(q[i - 1])) > 1) skips++; });
    S -= (1 - c) * 0.25 * skips;
    const lo = Math.min(...seq), hi = Math.max(...seq);
    S -= Math.max(0, hi - 14) * 0.3 + Math.max(0, -3 - lo) * 0.3;
    S += 0.2 * new Set(fams.map(f => lines[f.id][lines[f.id].length - 1])).size;
    fams.forEach(f => { if (f.kind === 'repeat' && styles[f.id] !== 'repeat' && f.members.length > 1) S += (0.4 + 0.6 * c) * (new Set(f.members.map(k => pitches[k].join())).size - 1) / (f.members.length - 1); });
    return { notes: out, units, pitches, masks, lines, styles, hows, plans, target, score: S, inspired: ph.map(() => false) };
  }
  let best = null;
  const seed0 = (opts.seed || 1) * 7919 + 13;
  for (let k = 0; k < 60; k++) { const a = attempt(seed0 + k * 104729); if (a && (!best || a.score > best.score)) best = a; }
  if (!best) return { error: 'No line in ' + raga.name + ' fits this rhythm within the raga’s rules; try another eduppu swara or raga.', code: 'unsingable' };

  /* ---- inspiration (v0.8.5) ----
     Lines suggested from outside the engine (a language model given rhythmPrompt(), or a person) are taken
     as inspiration, not as orders. Each suggested phrase is fitted to its rhythm: its holds are kept when it
     has one token a syllable, otherwise its swaras are spread over the engine's breath; every swara is moved
     onto the raga inside the range, the direction rule is restored (the projector's repair), and the
     phrase's fixed ending is kept (the landing for the last phrase, the shared ending of a yati). A phrase is
     sung only if the whole passage still keeps every hard rule; otherwise the engine's own phrase stays and
     the reason is reported. */
  let insp = null;
  if (opts.inspiration) {
    const I = parseInspiration(opts.inspiration, raga);
    insp = { suggested: 0, used: [], set: [], note: I.note || '', error: I.error || null };
    if (!I.error) {
      const P = best.pitches.map(x => x.slice()), M = best.masks.map(x => x.slice()), lastK = ph.length - 1;
      const snap = p => {
        if (ix(p) >= 0) return p;
        for (const o of [12, -12]) if (ix(p + o) >= 0) return p + o;
        return notes.reduce((a, b) => Math.abs(b - p) < Math.abs(a - p) ? b : a, notes[0]);
      };
      const endOn = (arr, end) => {
        const m = arr.length;
        if (end == null || arr[m - 1] === end) return arr;
        arr[m - 1] = end;
        if (m < 2 || (Pj.valid(arr[m - 2], end) && Math.abs(arr[m - 2] - end) <= 7)) return arr;
        const opt = notes.filter(x => Pj.valid(x, end) && Math.abs(x - end) <= 7 && (m < 3 || (Pj.valid(arr[m - 3], x) && Math.abs(arr[m - 3] - x) <= 7)));
        if (!opt.length) return null;
        arr[m - 2] = opt.reduce((a, b) => Math.abs(b - arr[m - 2]) < Math.abs(a - arr[m - 2]) ? b : a);
        return arr;
      };
      const WHY = { range: 'it leaves the kalpana range', direction: 'it breaks ' + raga.name + '’s direction rule where it meets its neighbours', join: 'it leaps more than a sixth from the phrase before or after', leap: 'it leaps more than a fifth', avoid: 'it sings a phrase ' + raga.name + ' avoids' };
      // each suggestion fitted once; then up to three passes, as one sung phrase can make room for its neighbour
      const pending = [], taken = new Set();
      I.phrases.forEach(s => {
        const k = s.phrase;
        insp.suggested++;
        if (!(Number.isInteger(k) && k >= 0 && k < ph.length)) { insp.set.push({ phrase: k + 1, why: 'there is no phrase ' + (k + 1) }); return; }
        if (taken.has(k)) { insp.set.push({ phrase: k + 1, why: 'it was suggested twice; the first is used' }); return; }
        taken.add(k);
        const q = ph[k], f = fams[q.fam], n = q.sylls.length, sw = s.tokens.filter(t => t != null);
        if (!sw.length) { insp.set.push({ phrase: k + 1, why: 'it has no swaras' }); return; }
        // its own breath when it gives one token a syllable starting on a swara (not for a trikaala)
        const mask = s.tokens.length === n && s.tokens[0] != null && !/^speedd$/.test(q.role) ? s.tokens.map(t => t != null ? 1 : 0) : M[k].slice();
        if ((k === lastK || CADENCE.has(q.role)) && !mask[n - 1]) mask[n - 1] = 1;
        const m = count(mask);
        const naive = Array.from({ length: m }, (_, j) => snap(sw[m === 1 || sw.length === 1 ? 0 : Math.round(j * (sw.length - 1) / (m - 1))]));
        const rep = Pj.repair(naive);
        const end = k === lastK ? best.target : f.kind === 'nested' ? P[k][P[k].length - 1] : null;
        const fitted = rep.feasible ? endOn(rep.pitches.slice(), end) : null;
        if (!fitted || !inRange(fitted)) { insp.set.push({ phrase: k + 1, why: 'it cannot be sung in ' + raga.name + ' with this ending' }); return; }
        const tries = (end == null ? [fitted, fitted.map(p => p + 12), fitted.map(p => p - 12)] : [fitted]).filter(inRange);
        pending.push({ k, mask, tries, why: null, sung: false });
      });
      for (let pass = 0; pass < 3; pass++) {
        let moved = false;
        pending.forEach(x => {
          if (x.sung) return;
          for (const cand of x.tries) {
            const P2 = P.slice(), M2 = M.slice(); P2[x.k] = cand; M2[x.k] = x.mask;
            const L = legal(P2, assemble(P2, M2).out);
            if (typeof L === 'string') { x.why = x.why || L; continue; }
            P[x.k] = cand; M[x.k] = x.mask; best.inspired[x.k] = true; x.sung = moved = true; break;
          }
        });
        if (!moved) break;
      }
      pending.forEach(x => { if (x.sung) insp.used.push(x.k + 1); else insp.set.push({ phrase: x.k + 1, why: WHY[x.why || 'range'] }); });
      insp.used.sort((p, q) => p - q); insp.set.sort((p, q) => p.phrase - q.phrase);
      if (insp.used.length) { const a = assemble(P, M); best = Object.assign({}, best, { notes: a.out, units: a.units, pitches: P, masks: M }); }
    }
  }

  const total = best.notes.reduce((s, n) => s + n.dur, 0);
  const swName = p => (raga.labels && raga.labels[mod12(p)] ? raga.labels[mod12(p)][0] : String(p)) + (p >= 12 ? "'" : p < 0 ? '.' : '');
  const famInfo = fams.map(f => ({ id: f.id, rounds: f.rounds, role: f.role, kind: f.kind, style: best.styles[f.id], how: best.hows[f.id] + (f.members.some(k => best.inspired[k]) ? '; ' + f.members.filter(k => best.inspired[k]).length + ' of its phrases from the inspiration' : ''), plan: best.plans[f.id] || null, lens: f.lens, line: best.lines[f.id], end: best.lines[f.id][best.lines[f.id].length - 1] }));
  const kindOf = u => u.role === 'gap' ? 'gap' : CADENCE.has(u.role) ? 'mora' : best.styles[u.fam] === 'sequence' || best.styles[u.fam] === 'varied' || best.inspired[u.phrase] ? 'nov' : 'conv';
  const units = best.units.map(u => ({ kind: kindOf(u), role: u.role, phrase: u.phrase, family: u.fam, inspired: u.phrase != null && best.inspired[u.phrase], name: u.role === 'gap' ? 'karvai' : (CADENCE.has(u.role) ? 'cadence' : u.role) + ' · family ' + (u.fam + 1) + (fams[u.fam] && fams[u.fam].kind === 'nested' ? ' (' + fams[u.fam].lens.join(' → ') + ')' : '') + (best.inspired[u.phrase] ? ' · inspired' : ''), notes: u.notes }));
  const last = best.pitches[best.pitches.length - 1], final = last[last.length - 1];
  const sylls = ph.reduce((s, q) => s + q.sylls.length, 0), swaras = best.notes.filter(n => n.p != null).length;
  const checks = [
    { ok: total === R.body.length, text: 'Exactly ' + total + ' pulses, the lab’s span: every swara starts on one of its syllables (' + swaras + ' swaras on ' + sylls + ' syllables), every phrase on its first.' },
    { ok: true, text: 'Every move obeys ' + raga.name + '’s direction rule: up to an arohana swara, down to an avarohana swara.' },
    { ok: final === best.target, text: 'The last swara is ' + swName(final) + (opts.eduppuPitch != null ? ', next to the eduppu ' + swName(opts.eduppuPitch) : '') + '.' },
    { ok: fams.every(f => f.kind !== 'nested' || f.members.every(k => { const r = ph[k].round, e0 = best.pitches[f.members[f.first[r]]]; return best.pitches[k][best.pitches[k].length - 1] === e0[e0.length - 1]; })), text: 'Every nested family (a yati or pattern purvanga, a shaped mora) keeps one ending swara in each of its rounds.' }
  ];
  if (insp) checks.push({ ok: true, text: insp.error ? 'The inspiration could not be read: ' + insp.error : insp.used.length + ' of ' + insp.suggested + ' suggested phrases sung, fitted to the rhythm and the raga' + (insp.set.length ? '; set aside: ' + insp.set.map(x => 'phrase ' + x.phrase + ' (' + x.why + ')').join(', ') : '') + '.' });
  return {
    ok: checks.every(x => x.ok), raga: raga.id, tala: R.tala, per: R.gati, kalai: R.kalai, lead: R.lead, slots: total,
    notes: best.notes, units, phrases: ph.map((q, k) => ({ role: q.role, family: q.fam, round: q.round || 0, mask: best.masks[k], inspired: best.inspired[k], pitches: best.pitches[k] })), families: famInfo,
    ending: { type: 'rhythm', final, target: best.target, eduppu: opts.eduppuPitch == null ? null : opts.eduppuPitch },
    breath: { density: full ? 'full' : 'auto', syllables: sylls, swaras },
    inspiration: insp,
    label: R.label, form: R.form, dial: D, checks
  };
}
