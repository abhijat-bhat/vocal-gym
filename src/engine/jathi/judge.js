import { TICKS, parseJathiScript } from './script.js';
import { norm, KNOWN, HEAVY, CADENCE, idiomatic } from '../sollu.js';

/* Vocal Gym engine · the jathi judge
   A correctness gate (span and landing, trailing karvai, bars, teermanam gaps) followed by six
   craft aspects that total 100, with computed fix suggestions. */
function fmtTicks(t, matra) {
  const sgn = t < 0 ? '−' : '', a = Math.abs(t);
  if (a % matra === 0) { const m = a / matra; return sgn + m + (m === 1 ? ' matra' : ' matras'); }
  const g = (x, y) => y ? g(y, x % y) : x, d = g(a, TICKS);
  return sgn + (a / d) + '/' + (TICKS / d) + ' of an akshara';
}
function judgeJathi(text) {
  const P = typeof text === 'string' ? parseJathiScript(text) : text;
  if (!P.ok) return { parsed: P, ok: false, errors: P.errors, warnings: P.warnings };
  const { tl, nadai, kalai, cycleTicks, matra, E0, events, units, bars, speeds, land } = P;
  const mod = (a, b) => ((a % b) + b) % b;
  const fm = t => fmtTicks(t, matra);
  const angaB = new Set([0]); let acc = 0; tl.angas.forEach(a => { acc += a.len * kalai * TICKS; angaB.add(acc % cycleTicks); });
  const abs = t => E0 + t;
  const where = a => { const c = Math.floor(a / cycleTicks) + 1, r = mod(a, cycleTicks), ak = Math.floor(r / TICKS) + 1, sub = r % TICKS; return 'cycle ' + c + ', akshara ' + ak + (sub ? ' + ' + fm(sub) : ''); };
  const syls = events.filter(e => e.k === 'syl');
  const gate = [], fixes = [];
  // teermanam: explicit, or detected from the last three equal units
  let teer = P.teers.length ? P.teers[P.teers.length - 1] : null, teerIssue = null;
  if (P.teers.length > 1) teerIssue = 'Only the last {…} counts as the teermanam; earlier ones are judged as part of the body.';
  if (!teer) {
    const body = units.filter(u => u.role === 'body' && u.nsyl > 0);
    if (body.length >= 3) {
      const [a, b, c] = body.slice(-3), key = u => u.syls.map(norm).join(' ');
      const between = (x, y) => events.filter(e => e.start >= x.end && e.start < y.start);
      const after = events.filter(e => e.start >= c.end);
      if (key(a) === key(b) && key(b) === key(c) && a.len === b.len && b.len === c.len && between(a, b).every(e => e.k === 'kv') && between(b, c).every(e => e.k === 'kv') && after.every(e => e.k === 'kv')) {
        const g1 = b.start - a.end, g2 = c.start - b.end;
        if (g1 === g2) { teer = { start: a.start, end: c.end, reps: [a.start, b.start, c.start], phrase: a.len, gap: g1, explicit: false, syls: c.syls }; [a, b, c].forEach(u => { u.role = 'teer'; }); }
        else teerIssue = 'The last three phrases are equal but the gaps between them are not (' + fm(g1) + ' and ' + fm(g2) + '). A teermanam needs equal gaps.';
      }
    }
  }
  // span and landing
  const lastSyl = syls[syls.length - 1];
  const endAbs = abs(P.total), landAbs = lastSyl ? abs(lastSyl.start) : abs(0);
  const kOff = land.type === 'after' ? land.k * matra : 0;
  const actual = land.type === 'end' ? endAbs : landAbs;
  let N = P.avartanams, diff = 0, spanOK = true, spanMsg;
  const landWord = land.type === 'end' ? 'The jathi ends' : 'The last syllable "' + (lastSyl ? lastSyl.v : '') + '" falls';
  if (N) {
    const target = N * cycleTicks + kOff; diff = target - actual;
    spanOK = diff === 0;
    spanMsg = spanOK ? landWord + (land.type === 'end' ? ' exactly at sam after ' : ' on ' + (land.type === 'after' ? fm(kOff) + ' after ' : '') + 'sam after ') + N + ' avartanam' + (N > 1 ? 's' : '') + '.'
      : landWord + ' at ' + where(actual) + '. It should ' + (land.type === 'end' ? 'end at sam' : 'fall on ' + (land.type === 'after' ? fm(kOff) + ' after ' : '') + 'sam') + ' after ' + N + ' avartanams: the jathi is ' + fm(Math.abs(diff)) + (diff > 0 ? ' short.' : ' too long.');
  } else {
    const r = mod(actual - kOff, cycleTicks);
    if (r === 0 && actual - kOff > 0) { N = (actual - kOff) / cycleTicks; spanMsg = landWord + ' on ' + (kOff ? fm(kOff) + ' after ' : '') + 'sam after ' + N + ' avartanam' + (N > 1 ? 's' : '') + ' (inferred; add "avartanams: ' + N + '" to make it a requirement).'; }
    else { spanOK = false; const lo = Math.floor((actual - kOff) / cycleTicks); diff = (lo + 1) * cycleTicks + kOff - actual; N = lo + 1; spanMsg = landWord + ' at ' + where(actual) + ', not on sam. Add ' + fm(diff) + ' to reach the next sam' + (r > 0 && lo >= 1 ? ', or remove ' + fm(r) + ' to land on the previous one.' : '.'); }
  }
  gate.push({ id: 'span', label: 'Span and landing', ok: spanOK, detail: spanMsg });
  if (!spanOK && diff) {
    const d = Math.abs(diff), dm = d / matra, isInt = Number.isInteger(dm);
    if (diff > 0) {
      fixes.push('Add ' + fm(d) + ' of karvai (' + (isInt && dm <= 8 ? new Array(dm).fill(',').join(' ') : ';') + ') ' + (teer ? 'just before the teermanam.' : 'before the final phrase.'));
      if (teer && isInt && dm % 2 === 0) fixes.push('Or widen the teermanam gap by ' + dm / 2 + ' (each of its two gaps grows by ' + dm / 2 + ', which adds ' + dm + ').');
      if (teer && isInt && dm % 3 === 0) fixes.push('Or lengthen the teermanam phrase by ' + dm / 3 + ' syllable' + (dm / 3 > 1 ? 's' : '') + ' (three repetitions add ' + dm + ').');
      if (isInt) fixes.push('Or start ' + fm(d) + ' earlier: eduppu ' + (P.eduppu - dm === 0 ? 'sam' : (P.eduppu - dm > 0 ? '+' : '') + (P.eduppu - dm)) + '.');
    } else {
      fixes.push('Remove ' + fm(d) + ' from the body (syllables or karvai).');
      if (teer && isInt && dm % 2 === 0 && teer.gap >= (dm / 2) * matra) fixes.push('Or narrow the teermanam gap by ' + dm / 2 + ' (both gaps shrink, which removes ' + dm + ').');
      if (teer && isInt && dm % 3 === 0) fixes.push('Or shorten the teermanam phrase by ' + dm / 3 + ' syllable' + (dm / 3 > 1 ? 's' : '') + '.');
      if (isInt) fixes.push('Or start ' + fm(d) + ' later: eduppu ' + (P.eduppu + dm === 0 ? 'sam' : (P.eduppu + dm > 0 ? '+' : '') + (P.eduppu + dm)) + '.');
    }
  }
  if (land.type !== 'end' && lastSyl) {
    const trail = P.total - (lastSyl.start + lastSyl.dur);
    gate.push({ id: 'trail', label: 'Nothing after the landing syllable', ok: trail === 0, detail: trail === 0 ? 'The jathi stops on its landing syllable.' : 'There is ' + fm(trail) + ' of karvai after the last syllable. Remove it, or set "land: end" if the jathi should end exactly at sam.' });
    if (trail) fixes.push('Delete the karvai after the final "' + lastSyl.v + '".');
  }
  const badBars = [];
  bars.forEach(b => {
    const a = abs(b.at), r = mod(a, cycleTicks);
    const ok = b.dbl ? r === 0 : angaB.has(r);
    if (!ok) {
      let best = null; const cands = b.dbl ? [0, cycleTicks] : Array.from(angaB).concat([cycleTicks]);
      cands.forEach(x => { const dd = x - r; if (best === null || Math.abs(dd) < Math.abs(best)) best = dd; });
      badBars.push('Line ' + b.line + ', column ' + b.col + ': "' + (b.dbl ? '||' : '|') + '" falls at ' + where(a) + '. ' + (best > 0 ? 'It is ' + fm(best) + ' early: the phrases before it are ' + fm(best) + ' short.' : 'It is ' + fm(-best) + ' late: the phrases before it are ' + fm(-best) + ' too long.'));
      if (!badBars.first) badBars.first = { line: b.line, delta: best };
    }
  });
  if (badBars.first) {
    const f = badBars.first;
    fixes.unshift('Start with line ' + f.line + ': the phrases before the bar there are ' + fm(Math.abs(f.delta)) + (f.delta > 0 ? ' short' : ' too long') + '.' + (diff === f.delta ? ' Fixing that also fixes the span.' : ''));
  }
  gate.push({ id: 'bars', label: 'Bars match the tala', ok: !badBars.length, detail: bars.length ? (badBars.length ? badBars.join(' ') : 'All ' + bars.length + ' bars fall on anga or avartanam lines.') : 'No bars written (optional; they let the judge check your counting).' });
  gate.push({ id: 'teer', label: 'Teermanam', ok: !!teer, detail: teer ? 'The final phrase repeats three times with equal gaps of ' + fm(teer.gap) + (teer.explicit ? '.' : ' (written out; detected).') : (teerIssue || 'No teermanam. A jathi ends with one phrase played three times with equal gaps.') });
  if (!teer) fixes.push(teerIssue && /equal but/.test(teerIssue) ? 'Make the gaps between the three final phrases equal, or write them as {phrase}/gap.' : 'End with a teermanam, for example {tha-dhi-gi-na-thom}/2: the phrase three times with gaps of 2.');
  {
    let lead = 0; for (const e of events) { if (e.k === 'kv') lead += e.dur; else break; }
    const lm = lead / matra;
    gate.push({ id: 'open', label: 'Opens at the eduppu', ok: lead === 0, detail: lead === 0 ? 'The first syllable sounds at the eduppu.' : 'The jathi opens with ' + fm(lead) + ' of karvai, so its first sound comes after the eduppu.' });
    if (lead) fixes.push('Remove the opening karvai' + (Number.isInteger(lm) ? ' and set "eduppu: ' + ((P.eduppu + lm) === 0 ? 'sam' : (P.eduppu + lm > 0 ? '+' : '') + (P.eduppu + lm)) + '"' : '') + ', so the jathi starts where it sounds.');
  }
  const ORDER = ['span', 'open', 'trail', 'bars', 'teer'];
  gate.sort((x, y) => ORDER.indexOf(x.id) - ORDER.indexOf(y.id));
  const gatePass = gate.every(g => g.ok);
  // ---------- aspects ----------
  const total = P.total, sounding = syls.length;
  const bodyUnits = units.filter(u => u.role === 'body' && u.nsyl > 0);
  const allUnits = units.filter(u => u.nsyl > 0);
  const onBeat = a => mod(a, TICKS) === 0;
  const asp = [];
  // 1 rhythmic integrity (20)
  {
    const notes = []; let s = 0;
    const anchors = [abs(0)].concat(allUnits.filter(u => onBeat(abs(u.start))).map(u => abs(u.start))).concat([abs(total)]).sort((a, b) => a - b);
    let maxGap = 0; for (let k = 1; k < anchors.length; k++) maxGap = Math.max(maxGap, anchors[k] - anchors[k - 1]);
    const gapAk = maxGap / TICKS;
    const a1 = gapAk <= 3 ? 8 : gapAk <= 4 ? 6 : gapAk <= 6 ? 3 : 0; s += a1;
    notes.push(a1 === 8 ? 'Phrases come back to a beat within three aksharas.' : 'One stretch runs ' + gapAk.toFixed(1) + ' aksharas before a phrase starts on a beat again. Cross-rhythm is welcome, but resolve it within three or four aksharas so the dancer can find the beat.');
    let a2 = 4; const firstEv = events[0];
    if (firstEv && firstEv.k === 'kv') { a2 -= 2; notes.push('The jathi opens with a karvai; the eduppu should sound.'); }
    let longKv = 0, runKv = 0; events.forEach(e => { if (e.k === 'kv' && e.role !== 'gap') { runKv += e.dur; if (runKv > TICKS) longKv++; } else runKv = 0; });
    if (longKv) { a2 -= 1; notes.push('A karvai inside the body lasts longer than one akshara.'); }
    s += Math.max(0, a2);
    let a3 = 4; speeds.forEach(sp2 => { if (!onBeat(abs(sp2.at))) { a3 -= 2; notes.push('The speed change at line ' + sp2.line + ' happens mid-akshara; change speed on a beat.'); } if (sp2.n > 2 * nadai) { a3 -= 1; notes.push('@' + sp2.n + ' is more than double the nadai; very fast for footwork.'); } });
    s += Math.max(0, a3);
    let a4 = 0;
    if (teer) { const step = teer.reps[1] - teer.reps[0]; a4 = step % TICKS === 0 ? 4 : 2; notes.push(a4 === 4 ? 'Each teermanam repetition starts at the same point in the beat.' : 'The teermanam repetitions start at different points in the beat (a deliberate effect, but harder to dance).'); }
    else a4 = 1;
    s += a4;
    asp.push({ id: 'rhythm', name: 'Rhythmic integrity', score: s, max: 20, notes });
  }
  // 2 structure (20)
  {
    const notes = []; let s = 0;
    if (teer) { s += 8; notes.push('Ends with a teermanam.'); } else notes.push('No teermanam. A jathi normally ends with one phrase played three times with equal gaps, for example {tha-dhi-gi-na-thom}/2.');
    if (teer) { const after = events.filter(e => e.start >= teer.end && e.k === 'syl'); if (!after.length) s += 3; else notes.push('Syllables follow the teermanam.'); }
    if (teer) { const share = (teer.end - teer.start) / total; if (share >= 0.15 && share <= 0.6) s += 5; else { s += 2; notes.push('The teermanam takes ' + Math.round(share * 100) + '% of the jathi; 15–60% is typical.'); } }
    const bodyLen = (teer ? teer.start : total);
    if (bodyLen >= TICKS) s += 2; else notes.push('There is almost no body before the teermanam.');
    s += P.avartanams ? 2 : 1; if (!P.avartanams) notes.push('State "avartanams:" so the span is a requirement, not a guess.');
    asp.push({ id: 'structure', name: 'Structure and form', score: s, max: 20, notes });
  }
  // 3 teermanam quality (15)
  {
    const notes = []; let s = 0;
    if (teer) {
      s += 8;
      const lastV = norm(teer.syls.filter(x => x !== ',').slice(-1)[0] || '');
      if (CADENCE.has(lastV)) s += 3; else notes.push('The teermanam ends on "' + lastV + '"; a closing syllable such as thom, dhit, tam or nam marks the arrival.');
      if (teer.gap <= teer.phrase) s += 2; else notes.push('The gap is longer than the phrase; the three statements may not sound connected.');
      const first = norm((teer.syls.find(x => x !== ',') || ''));
      if (teer.phrase >= 3 * (TICKS / nadai) && HEAVY.has(first)) s += 2; else notes.push('A teermanam phrase of three or more syllables that opens on a strong syllable (tha, dhi, tat, tai …) is easier to hear.');
      if (!teer.explicit) notes.push('Detected from three equal phrases. Writing it as {…}/gap makes your intention explicit.');
    } else notes.push('No teermanam to judge.');
    asp.push({ id: 'teermanam', name: 'Teermanam quality', score: s, max: 15, notes });
  }
  // 4 sollu idiom (15)
  {
    const notes = []; let s = 0;
    const known = syls.filter(e => KNOWN.has(e.n)).length / Math.max(1, sounding);
    s += 5 * known; if (known < 1) notes.push('Unrecognised syllables: ' + Array.from(new Set(syls.filter(e => !KNOWN.has(e.n)).map(e => e.v))).join(', ') + '.');
    const check = allUnits.filter(u => u.nsyl >= 2);
    const idi = check.length ? check.filter(u => idiomatic(u.syls)).length / check.length : 1;
    s += 5 * idi; if (idi < 0.8) notes.push(Math.round((1 - idi) * 100) + '% of phrases are not standard sollu groups (for example tha-ki-ta, tha-ka-dhi-mi, tha-dhi-gi-na-thom) or suffixes of them.');
    const beatSyl = syls.filter(e => onBeat(abs(e.start)));
    const unitStarts = new Set(allUnits.map(u => u.start));
    const strong = beatSyl.length ? beatSyl.filter(e => HEAVY.has(e.n) || unitStarts.has(e.start)).length / beatSyl.length : 1;
    s += 5 * strong; if (strong < 0.8) notes.push('Some beats fall on light syllables in the middle of a phrase (ka, ki, mi, nu …).');
    asp.push({ id: 'idiom', name: 'Sollu idiom', score: Math.round(s * 10) / 10, max: 15, notes });
  }
  // 5 variety and creativity (15) + yati detection
  let yati = null;
  {
    const notes = []; let s = 0;
    const lens = bodyUnits.map(u => u.len);
    const distinct = new Set(lens).size;
    s += distinct >= 3 ? 5 : distinct === 2 ? 3 : 1;
    // yati: the best-shaped run of consecutive phrases of two or more syllables
    const W = { mridanga: 3, damaru: 3, gopuccha: 2, srotovaha: 2, sama: 1 };
    const strictUp = a => a.every((v, k) => k === 0 || v > a[k - 1]), strictDown = a => a.every((v, k) => k === 0 || v < a[k - 1]);
    const shapeOf = L => {
      if (L.every(v => v === L[0])) return 'sama';
      if (strictDown(L)) return 'gopuccha';
      if (strictUp(L)) return 'srotovaha';
      if (L.length < 5) return null;
      const mx = Math.max.apply(null, L), mn = Math.min.apply(null, L);
      const peak = [L.indexOf(mx), L.lastIndexOf(mx)], val = [L.indexOf(mn), L.lastIndexOf(mn)];
      if (peak[1] - peak[0] <= 1 && peak[0] >= 2 && peak[1] <= L.length - 3 && strictUp(L.slice(0, peak[0] + 1)) && strictDown(L.slice(peak[1]))) return 'mridanga';
      if (val[1] - val[0] <= 1 && val[0] >= 2 && val[1] <= L.length - 3 && strictDown(L.slice(0, val[0] + 1)) && strictUp(L.slice(val[1]))) return 'damaru';
      return null;
    };
    const runs = []; let cur = [];
    bodyUnits.forEach(u => { if (u.nsyl >= 2) cur.push(u); else { if (cur.length) runs.push(cur); cur = []; } });
    if (cur.length) runs.push(cur);
    // derived: each phrase is a prefix or suffix of its longer neighbour, which is what makes the shape audible
    const str = u => u.syls.map(norm).join(' ');
    const related = (x, y) => { const a = str(x), b = str(y); const [sh, lo] = a.length <= b.length ? [a, b] : [b, a]; return sh === lo || lo.endsWith(' ' + sh) || lo.startsWith(sh + ' '); };
    runs.forEach(R2 => {
      for (let a = 0; a < R2.length; a++) for (let b = a + 3; b <= R2.length; b++) {
        const U = R2.slice(a, b), L = U.map(u => u.len), type = shapeOf(L);
        if (!type) continue;
        const derived = U.every((u, k) => k === 0 || related(U[k - 1], u));
        const w = W[type] + (derived ? 4 : 0);
        if (!yati || w > yati.w || (w === yati.w && L.length > yati.lens.length)) yati = { type, lens: L, derived, w };
      }
    });
    if (yati && yati.type !== 'sama') { s += yati.derived ? 4 : 3; notes.push(yati.type[0].toUpperCase() + yati.type.slice(1) + ' yati: ' + yati.lens.map(x => +(x / (TICKS / nadai)).toFixed(2)).join(' → ') + ' matras' + (yati.derived ? ', each phrase grown from or cut from its neighbour.' : '. The lengths make the shape; deriving each phrase from the one before (adding or dropping syllables at the front) makes it audible.')); }
    else if (yati) { s += 2; notes.push('Sama yati (equal groups). A shaped yati (gopuccha 7 → 5 → 3, srotovaha 3 → 5 → 7) adds interest.'); }
    else if (distinct >= 3) { s += 2; yati = { type: 'vishama', lens: [] }; notes.push('Free (vishama) grouping.'); }
    else notes.push('No yati shape.');
    const pats = bodyUnits.map(u => u.syls.join(' '));
    const ratio = pats.length ? new Set(pats).size / pats.length : 1;
    s += ratio >= 0.4 ? 3 : ratio >= 0.25 ? 2 : 1; if (ratio < 0.4) notes.push('Many phrases repeat exactly.');
    const cross = bodyUnits.some(u => !onBeat(abs(u.start))) || speeds.length > 0 || events.some(e => e.k === 'kv' && e.role === 'body');
    s += cross ? 3 : 1; if (!cross) notes.push('Every phrase starts on a beat with no karvai or speed change: clear, but plain.');
    asp.push({ id: 'variety', name: 'Variety and creativity', score: s, max: 15, notes });
  }
  // 6 danceability (15)
  {
    const notes = []; let s = 0;
    const dens = syls.reduce((a, e) => a + e.dur, 0) / Math.max(1, total);
    s += dens >= 0.6 && dens <= 0.95 ? 5 : (dens >= 0.45 && dens <= 1) ? 3 : 1;
    if (dens > 0.95) notes.push('Almost no karvai: the dancer has no place to settle.'); else if (dens < 0.6) notes.push('Many karvais: the jathi may feel sparse.');
    let run = 0, maxRun = 0; events.forEach(e => { if (e.k === 'syl') { run += e.dur; maxRun = Math.max(maxRun, run); } else run = 0; });
    const runCyc = maxRun / cycleTicks;
    s += runCyc <= 2 ? 4 : runCyc <= 3 ? 2 : 0; if (runCyc > 2) notes.push('One unbroken run lasts ' + runCyc.toFixed(1) + ' avartanams without a karvai.');
    const big = allUnits.filter(u => u.nsyl > 9).length;
    s += big ? 1 : 3; if (big) notes.push(big + ' phrase' + (big > 1 ? 's are' : ' is') + ' longer than 9 syllables; split long phrases so each maps to an adavu.');
    const maxSpeed = Math.max.apply(null, [nadai].concat(speeds.map(x => x.n)));
    s += maxSpeed <= 2 * nadai ? 3 : maxSpeed <= 3 * nadai ? 1 : 0;
    asp.push({ id: 'dance', name: 'Danceability', score: s, max: 15, notes });
  }
  let totalScore = Math.round(asp.reduce((a, x) => a + x.score, 0));
  const cap = gatePass ? 100 : 49;
  totalScore = Math.min(totalScore, cap);
  const grade = !gatePass ? 'Not yet correct' : totalScore >= 85 ? 'Excellent' : totalScore >= 70 ? 'Good' : totalScore >= 55 ? 'Fair' : 'Needs work';
  return { parsed: P, ok: true, gate, gatePass, aspects: asp, total: totalScore, cap, grade, fixes, teer, yati, warnings: P.warnings, avartanams: N };
}

export { fmtTicks, judgeJathi };
