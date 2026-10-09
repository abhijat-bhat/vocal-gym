import { tala, customTala, DEFJ, JATI, CHAPU, angaStarts } from '../talas.js';
import { norm, KNOWN, splitCompound } from '../sollu.js';

/* Vocal Gym engine · JathiScript
   A deterministic text format for jathis: one word is one matra at the current speed.
   parseJathiScript() turns text into timed events (integer ticks, 2520 per akshara);
   jathiToScript() writes a generated jathi back out as JathiScript. */
const TICKS = 2520; // ticks per akshara: divisible by every speed from 1 to 10, 12, 14, 15, 18, 20, 21, 24, 28, 30, 35 and 36
const JATI_WORDS = { tisra: 3, tishra: 3, thisra: 3, chatusra: 4, chaturasra: 4, chatushra: 4, chaturashra: 4, chathusra: 4, khanda: 5, kanda: 5, misra: 7, mishra: 7, sankeerna: 9, sankirna: 9 };
const FAM_WORDS = { dhruva: 'dhruva', druva: 'dhruva', matya: 'matya', mathya: 'matya', madhya: 'matya', rupaka: 'rupaka', roopaka: 'rupaka', rupakam: 'rupaka', jhampa: 'jhampa', jampa: 'jhampa', triputa: 'triputa', triputai: 'triputa', ata: 'ata', atta: 'ata', eka: 'eka', ekam: 'eka', chapu: 'chapu', capu: 'chapu', adi: 'adi' };
const JATI_NAME = { 3: 'tisra', 4: 'chatusra', 5: 'khanda', 7: 'misra', 9: 'sankeerna' };
function talaSpec(tl) {
  if (tl.fam === 'chapu') return JATI_NAME[tl.total] + ' chapu';
  if (tl.fam === 'custom') return 'custom ' + tl.angas.map(a => a.len).join('+');
  if (tl.fam === 'triputa' && tl.L === 4) return 'adi';
  return JATI_NAME[tl.L] + ' ' + tl.fam;
}
function parseTalaSpec(s) {
  const raw = s.toLowerCase().trim();
  if (/^custom\b/.test(raw)) {
    const parts = raw.replace(/^custom/, '').split(/[^0-9]+/).filter(Boolean).map(Number);
    if (!parts.length || parts.some(p => !(p >= 1 && p <= 16))) return { error: 'Write a custom tala as counts, for example "custom 3+2+2".' };
    return { tl: customTala(parts) };
  }
  const w = raw.replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(x => x && !['jati', 'jathi', 'tala', 'talam', 'thalam', 'thala'].includes(x));
  let fam = null, L = null; const unknown = [];
  w.forEach(x => { if (FAM_WORDS[x]) fam = FAM_WORDS[x]; else if (JATI_WORDS[x]) L = JATI_WORDS[x]; else if (/^\d+$/.test(x)) L = +x; else unknown.push(x); });
  if (unknown.length) return { error: 'Unknown word in the tala: "' + unknown.join(' ') + '". Use a family (dhruva, matya, rupaka, jhampa, triputa, ata, eka, chapu or adi) and a jati (tisra, chatusra, khanda, misra, sankeerna).' };
  if (fam === 'adi') return { tl: tala('triputa', 4), note: L && L !== 4 ? 'Adi is chatusra jati triputa; the jati was ignored.' : null };
  if (fam === 'chapu') { L = L || 7; if (!CHAPU[L]) return { error: 'Chapu talas here are tisra (1+2), khanda (2+3) and misra (3+2+2).' }; return { tl: tala('chapu', L) }; }
  if (!fam) return { error: 'No tala family found in "' + s + '".' };
  L = L || DEFJ[fam];
  if (!JATI[L]) return { error: 'The jati must be tisra (3), chatusra (4), khanda (5), misra (7) or sankeerna (9).' };
  return { tl: tala(fam, L) };
}
function tokenizeLine(str, line) {
  const out = [], re = /\s+|(\|\|)|(\|)|(\()|(\))|(\{)|(\})|(,)|(;)|@(\d+)|\$([A-Za-z_]\w*)|[x×*](\d+)|\/(\d+)|([A-Za-z]+(?:-(?:[A-Za-z]+|,|;))*)|(\S)/gy;
  let m;
  while (re.lastIndex < str.length && (m = re.exec(str))) {
    const col = m.index + 1;
    if (m[1]) out.push({ t: 'dbar', line, col });
    else if (m[2]) out.push({ t: 'bar', line, col });
    else if (m[3]) out.push({ t: '(', line, col });
    else if (m[4]) out.push({ t: ')', line, col });
    else if (m[5]) out.push({ t: '{', line, col });
    else if (m[6]) out.push({ t: '}', line, col });
    else if (m[7]) out.push({ t: 'kv', n: 1, line, col });
    else if (m[8]) out.push({ t: 'kv', n: 2, line, col });
    else if (m[9]) out.push({ t: 'speed', n: +m[9], line, col });
    else if (m[10]) out.push({ t: 'var', name: m[10], line, col });
    else if (m[11]) out.push({ t: 'rep', n: +m[11], line, col });
    else if (m[12]) out.push({ t: 'gap', n: +m[12], line, col });
    else if (m[13]) out.push({ t: 'word', v: m[13], line, col });
    else if (m[14]) out.push({ t: 'bad', v: m[14], line, col });
  }
  return out;
}
function parseJathiScript(text) {
  const errors = [], warnings = [], header = {}, defs = {}, bodyToks = [];
  const err = (line, col, msg) => errors.push({ line, col, msg });
  String(text).replace(/\r/g, '').split('\n').forEach((raw, k) => {
    const line = k + 1, s = raw.replace(/#.*$/, '');
    if (!s.trim()) return;
    let m = s.match(/^\s*(tala|talam|nadai|gati|kalai|avartanams?|avartas?|cycles|eduppu|land|title|name|by)\s*:\s*(.*?)\s*$/i);
    if (m) { header[m[1].toLowerCase()] = { v: m[2], line }; return; }
    m = s.match(/^\s*let\s+([A-Za-z_]\w*)\s*=\s*(.*)$/i);
    if (m) {
      if (defs[m[1]]) err(line, 1, 'The phrase $' + m[1] + ' is defined twice.');
      defs[m[1]] = { toks: tokenizeLine(m[2], line), line };
      return;
    }
    tokenizeLine(s, line).forEach(t => bodyToks.push(t));
  });
  // header
  const hv = k => { for (const key of [].concat(k)) if (header[key]) return header[key]; return null; };
  let tl = tala('triputa', 4);
  const ht = hv(['tala', 'talam']);
  if (ht) { const r = parseTalaSpec(ht.v); if (r.error) err(ht.line, 1, r.error); else { tl = r.tl; if (r.note) warnings.push({ line: ht.line, msg: r.note }); } }
  else warnings.push({ line: 0, msg: 'No tala given; assuming Adi.' });
  let nadai = 4; const hn = hv(['nadai', 'gati']);
  if (hn) { const named = JATI_WORDS[hn.v.toLowerCase().split(/\s+/)[0]]; nadai = named || parseInt(hn.v, 10); if (!(nadai >= 1 && nadai <= 36 && TICKS % nadai === 0)) { err(hn.line, 1, 'Nadai must be a whole number of matras per akshara that divides 2520 (3, 4, 5, 6, 7, 8, 9 …).'); nadai = 4; } }
  let kalai = 1; const hk = hv('kalai');
  if (hk) { kalai = parseInt(hk.v, 10); if (!(kalai >= 1 && kalai <= 4)) { err(hk.line, 1, 'Kalai must be 1, 2, 3 or 4.'); kalai = 1; } }
  let avartanams = null; const ha = hv(['avartanams', 'avartanam', 'avartas', 'avarta', 'cycles']);
  if (ha) { avartanams = parseInt(ha.v, 10); if (!(avartanams >= 1 && avartanams <= 32)) { err(ha.line, 1, 'Avartanams must be a whole number from 1 to 32.'); avartanams = null; } }
  let eduppu = 0; const he = hv('eduppu');
  if (he) {
    const v = he.v.toLowerCase().trim(); let m2;
    if (v === 'sam' || v === 'samam' || v === '0' || v === 'sama') eduppu = 0;
    else if ((m2 = v.match(/^([+-]?)\s*(\d+)$/))) eduppu = (m2[1] === '-' ? -1 : 1) * +m2[2];
    else if ((m2 = v.match(/^(atita|atheetha|atitha|before)\s+(\d+)$/))) eduppu = -m2[2];
    else if ((m2 = v.match(/^(anagata|anagatha|after)\s+(\d+)$/))) eduppu = +m2[2];
    else err(he.line, 1, 'Write the eduppu as sam, +n (n matras after sam, anagata) or -n (n matras before sam, atita).');
  }
  let land = { type: 'sam', k: 0 }; const hl = hv('land');
  if (hl) {
    const v = hl.v.toLowerCase().trim(); let m2;
    if (v === 'sam') land = { type: 'sam', k: 0 };
    else if (v === 'end' || v === 'before sam' || v === 'before-sam') land = { type: 'end', k: 0 };
    else if ((m2 = v.match(/^\+\s*(\d+)$/))) land = { type: 'after', k: +m2[1] };
    else err(hl.line, 1, 'Land must be sam (the last syllable sounds on sam), end (the jathi ends exactly at sam) or +n (the last syllable falls n matras after sam).');
  }
  const cycleTicks = tl.total * kalai * TICKS, matra = TICKS / nadai;
  if (Math.abs(eduppu) * matra >= cycleTicks) err(he ? he.line : 0, 1, 'The eduppu must be less than one avartanam from sam.');
  // parser
  function parseSeq(toks, ctx) {
    let i = 0, depth = 0; const items = [];
    function seq(end) {
      const out = [];
      while (i < toks.length) {
        const tk = toks[i];
        if (end && tk.t === end) { i++; return out; }
        if (tk.t === ')' || tk.t === '}') { err(tk.line, tk.col, 'Unexpected "' + tk.t + '" with no matching opening bracket.'); i++; continue; }
        let node = null;
        if (tk.t === 'word') {
          i++;
          const parts = tk.v.split('-');
          if (parts.length > 1) node = { type: 'group', kind: 'hyphen', items: parts.map(p => p === ',' ? { type: 'kv', n: 1 } : p === ';' ? { type: 'kv', n: 2 } : { type: 'syl', v: p.toLowerCase(), line: tk.line, col: tk.col }), line: tk.line, col: tk.col };
          else node = { type: 'syl', v: tk.v.toLowerCase(), line: tk.line, col: tk.col };
        } else if (tk.t === 'kv') { i++; node = { type: 'kv', n: tk.n }; }
        else if (tk.t === '(') { i++; depth++; const inner = seq(')'); depth--; node = { type: 'group', kind: 'paren', items: inner, line: tk.line, col: tk.col }; }
        else if (tk.t === '{') {
          i++; const inner = seq('}');
          if (ctx === 'def') err(tk.line, tk.col, 'A teermanam cannot go inside a phrase variable.');
          if (depth > 0) err(tk.line, tk.col, 'A teermanam cannot go inside brackets.');
          let q = 0;
          if (toks[i] && toks[i].t === 'rep') { if (toks[i].n !== 3) err(toks[i].line, toks[i].col, 'A teermanam {…} always repeats 3 times; write x3 or leave it out.'); i++; }
          if (toks[i] && toks[i].t === 'gap') { q = toks[i].n; i++; }
          node = { type: 'teer', items: inner, q, line: tk.line, col: tk.col };
        } else if (tk.t === 'var') {
          i++;
          const d = defs[tk.name];
          if (!d) { err(tk.line, tk.col, 'The phrase $' + tk.name + ' is not defined. Add a line: let ' + tk.name + ' = …'); continue; }
          if (d.parsing) { err(tk.line, tk.col, 'The phrase $' + tk.name + ' refers to itself.'); continue; }
          if (!d.ast) { d.parsing = true; d.ast = parseSeq(d.toks, 'def'); d.parsing = false; }
          node = { type: 'group', kind: 'var', name: tk.name, items: d.ast, line: tk.line, col: tk.col };
        } else if (tk.t === 'bar' || tk.t === 'dbar') {
          i++; if (ctx === 'def') err(tk.line, tk.col, 'Bars cannot go inside a phrase variable.');
          node = { type: 'bar', dbl: tk.t === 'dbar', line: tk.line, col: tk.col };
        } else if (tk.t === 'speed') {
          i++;
          if (!(tk.n >= 1 && tk.n <= 36 && TICKS % tk.n === 0)) err(tk.line, tk.col, '@' + tk.n + ' is not a supported speed. Use a number of syllables per akshara that divides 2520, such as 2, 3, 4, 5, 6, 7, 8, 9, 10, 12 or 14.');
          node = { type: 'speed', n: tk.n, line: tk.line, col: tk.col };
        } else if (tk.t === 'rep') { i++; err(tk.line, tk.col, 'x' + tk.n + ' must follow a group, a phrase variable or a syllable.'); continue; }
        else if (tk.t === 'gap') { i++; err(tk.line, tk.col, '/' + tk.n + ' (a teermanam gap) must follow a {…} teermanam.'); continue; }
        else { i++; err(tk.line, tk.col, 'Unexpected character "' + tk.v + '".'); continue; }
        if (toks[i] && toks[i].t === 'rep' && node.type !== 'teer') {
          const n = toks[i].n; i++;
          if (!(n >= 1 && n <= 64)) err(tk.line, tk.col, 'Repeat counts run from 1 to 64.');
          if (node.type === 'bar' || node.type === 'speed') err(tk.line, tk.col, 'A bar or speed mark cannot be repeated.');
          node = { type: 'rep', n, node, line: tk.line, col: tk.col };
        }
        out.push(node);
      }
      if (end) { const last = toks[toks.length - 1]; err(last ? last.line : 0, last ? last.col : 0, 'Missing "' + end + '".'); }
      return out;
    }
    items.push.apply(items, seq(null));
    return items;
  }
  const ast = parseSeq(bodyToks, 'body');
  Object.keys(defs).forEach(k => { if (!defs[k].ast) warnings.push({ line: defs[k].line, msg: 'The phrase $' + k + ' is defined but never used.' }); });
  if (!bodyToks.length) err(0, 0, 'The jathi has no syllables yet.');
  // expansion into timed events
  const E0 = eduppu * matra;
  const events = [], units = [], bars = [], speeds = [], teers = [];
  let pos = 0, speed = nadai, unit = TICKS / speed, open = null, uid = 0;
  const isLeaf = items => items.every(n => n.type === 'syl' || n.type === 'kv');
  const closeLoose = () => { if (open) { open.end = pos; units.push(open); open = null; } };
  const sylWarned = new Set();
  function emitSyl(v, role, unitRef, line, col) {
    const n = norm(v);
    if (!KNOWN.has(n) && !sylWarned.has(v)) {
      sylWarned.add(v);
      const sp2 = splitCompound(v);
      warnings.push({ line, msg: sp2 ? '"' + v + '" is counted as one matra. If it means ' + sp2.length + ' syllables, write ' + sp2.join('-') + '.' : '"' + v + '" is not in the sollu vocabulary. It still counts as one matra.' });
    }
    events.push({ k: 'syl', v, n, start: pos, dur: unit, role, unit: unitRef });
    if (unitRef) { unitRef.syls.push(v); unitRef.nsyl++; }
    pos += unit;
  }
  function emitKv(n, role, unitRef) {
    for (let j = 0; j < n; j++) { events.push({ k: 'kv', v: ',', start: pos, dur: unit, role, unit: unitRef }); if (unitRef) unitRef.syls.push(','); pos += unit; }
  }
  function expand(items, role, unitRef, depth) {
    if (depth > 40) { err(0, 0, 'Phrases are nested too deeply.'); return; }
    items.forEach(nd => {
      if (errors.length > 50) return;
      if (nd.type === 'syl') {
        if (!unitRef && !open) open = { id: ++uid, kind: 'loose', start: pos, syls: [], nsyl: 0, role };
        emitSyl(nd.v, role, unitRef || open, nd.line, nd.col);
      } else if (nd.type === 'kv') {
        if (unitRef) emitKv(nd.n, role, unitRef);
        else { closeLoose(); emitKv(nd.n, role === 'teer' ? 'teer' : role, null); }
      } else if (nd.type === 'group') {
        if (unitRef) { expand(nd.items, role, unitRef, depth + 1); return; }
        closeLoose();
        if (isLeaf(nd.items)) {
          const u = { id: ++uid, kind: nd.kind, name: nd.name, start: pos, syls: [], nsyl: 0, role };
          expand(nd.items, role, u, depth + 1); u.end = pos; units.push(u);
        } else { expand(nd.items, role, null, depth + 1); closeLoose(); }
      } else if (nd.type === 'rep') {
        for (let r = 0; r < nd.n; r++) expand([nd.node], role, unitRef, depth + 1);
      } else if (nd.type === 'teer') {
        if (unitRef) { err(nd.line, nd.col, 'A teermanam cannot sit inside a group.'); return; }
        closeLoose();
        const t0 = pos, reps = [];
        for (let r = 0; r < 3; r++) {
          reps.push(pos);
          if (isLeaf(nd.items)) { const u = { id: ++uid, kind: 'teer', start: pos, syls: [], nsyl: 0, role: 'teer' }; expand(nd.items, 'teer', u, depth + 1); u.end = pos; units.push(u); }
          else { expand(nd.items, 'teer', null, depth + 1); closeLoose(); }
          if (r < 2) emitKv(nd.q, 'gap', null);
        }
        const phraseLen = reps[1] - reps[0] - nd.q * unit;
        teers.push({ start: t0, end: pos, reps, phrase: phraseLen, gap: nd.q * unit, q: nd.q, explicit: true, line: nd.line,
          syls: events.filter(e => e.start >= reps[2] && e.start < pos).map(e => e.v) });
      } else if (nd.type === 'bar') {
        closeLoose(); bars.push({ at: pos, dbl: nd.dbl, line: nd.line, col: nd.col });
      } else if (nd.type === 'speed') {
        closeLoose(); speed = nd.n; unit = TICKS / speed; speeds.push({ at: pos, n: nd.n, line: nd.line, col: nd.col });
      }
    });
  }
  if (!errors.length) { expand(ast, 'body', null, 0); closeLoose(); }
  units.forEach(u => { u.len = u.end - u.start; });
  return { ok: !errors.length, errors, warnings, header: { tala: tl, nadai, kalai, avartanams, eduppu, land }, tl, nadai, kalai, avartanams, eduppu, land, cycleTicks, matra, E0, events, units, bars, speeds, teers, total: pos };
}

/* export a generated jathi as JathiScript */
function jathiToScript(res, tl, opts) {
  const o = opts || {}, g = res.g, cycle = res.cycle, starts = angaStarts(tl);
  const lines = ['# Generated jathi: ' + tl.name + ', nadai ' + g + ', seed ' + (o.seed || 1) + ', temperature ' + (o.T == null ? 1 : o.T),
    'tala: ' + talaSpec(tl), 'nadai: ' + g, 'avartanams: ' + res.avartanams,
    'eduppu: ' + (res.offset === 0 ? 'sam' : (res.offset > 0 ? '+' : '') + res.offset), 'land: ' + (res.land === 'end' ? 'end' : 'sam'), ''];
  let pos = res.offset, line = [];
  const boundary = () => {
    if (pos <= 0 && res.offset >= 0) return;
    const r = ((pos % cycle) + cycle) % cycle;
    if (r === 0) { line.push('||'); lines.push(line.join(' ')); line = []; }
    else if (r % g === 0 && starts.has(r / g)) line.push('|');
  };
  let teerDone = false;
  res.segs.forEach((sg, k) => {
    if (sg.role === 'body' || sg.role === 'yati') {
      if (line.length || pos !== res.offset) boundary();
      line.push(sg.syl.length > 1 ? sg.syl.join('-') : sg.syl[0]);
      pos += sg.syl.length;
    } else if (!teerDone && sg.role === 'teermanam') {
      if (pos !== res.offset) boundary();
      const u = sg.syl, inner = u.some(x => x === ',') ? u.join(' ') : u.join('-');
      line.push('{' + inner + '}/' + res.plan.q);
      teerDone = true;
    }
  });
  if (line.length) lines.push(line.join(' '));
  return lines.join('\n') + '\n';
}

export { TICKS, JATI_WORDS, FAM_WORDS, JATI_NAME, talaSpec, parseTalaSpec, tokenizeLine, parseJathiScript, jathiToScript };
