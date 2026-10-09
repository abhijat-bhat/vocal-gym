import { rng, soft, dial } from '../random.js';
import { SOLLU } from '../sollu.js';
import { jathiToScript } from './script.js';

/* Vocal Gym engine · jathi generator
   Enumerates every (teermanam, gap, yati) combination that satisfies
   body + yati + 3u + 2q = slots exactly, picks one by temperature, then fills the body. */
const TEER = [
  { id: 'tdgnt', s: ['tha', 'dhi', 'gi', 'na', 'thom'], F: 0.8, N: 0 },
  { id: 'tktdgnt', s: ['tha', 'ka', 'tha', 'dhi', 'gi', 'na', 'thom'], F: 0.4, N: 0.2 },
  { id: 'gapped', s: ['tha', ',', 'dhi', ',', 'gi', 'na', 'thom'], F: 0.0, N: 0.6 },
  { id: 'nine', s: ['tha', 'ka', 'dhi', 'mi', 'tha', 'dhi', 'gi', 'na', 'thom'], F: 0.1, N: 0.3 }
];
function yatiBlocks(pref) {
  const out = [];
  if (pref === 'none') return out;
  const want = t => pref === 'auto' || pref === t;
  Object.keys(SOLLU).map(Number).filter(w => w >= 5).forEach(w => SOLLU[w].forEach(base => {
    [1, 2].forEach(dd => [3, 4].forEach(cnt => {
      if (w - dd * (cnt - 1) < 2) return;
      const sufs = []; for (let i = 0; i < cnt; i++) sufs.push(base.slice(i * dd));
      if (want('gopuccha')) out.push({ type: 'gopuccha', parts: sufs });
      if (want('srotovaha')) out.push({ type: 'srotovaha', parts: sufs.slice().reverse() });
      if (cnt === 3 && want('mridanga')) out.push({ type: 'mridanga', parts: sufs.slice().reverse().concat(sufs.slice(1)) });
      if (cnt === 3 && want('damaru')) out.push({ type: 'damaru', parts: sufs.concat(sufs.slice(0, 2).reverse()) });
    }));
  }));
  if (want('sama')) [3, 4, 5].forEach(w => SOLLU[w].forEach(base => [3, 4].forEach(cnt => out.push({ type: 'sama', parts: Array.from({ length: cnt }, () => base) }))));
  out.forEach(y => { y.len = y.parts.reduce((s, p) => s + p.length, 0); });
  return out;
}
function jathi(opts) {
  const { tl, nadai, avartanams } = opts;
  const offset = opts.offset || 0, yatiPref = opts.yatiPref || 'auto', land = opts.land || 'sam';
  const D = dial(opts.T == null ? 1 : opts.T), rand = rng(opts.seed || 1), g = nadai, cycle = tl.total * g;
  if (Math.abs(offset) >= cycle) return { error: 'The eduppu must be less than one avartanam away from sam.' };
  const M = avartanams * cycle - offset;     // matras from the eduppu to sam (offset < 0 means atita: starts before sam)
  const slots = land === 'end' ? M : M + 1;  // land on sam: the final syllable sounds on sam
  if (M < 6) return { error: 'The span is too short. Add an avartanam or move the eduppu closer to sam.' };
  const yOpts = [{ type: 'none', len: 0, parts: [] }].concat(yatiBlocks(yatiPref));
  const combos = [];
  TEER.forEach(u => { for (let q = 0; q <= 4; q++) yOpts.forEach(y => {
    const tlen = 3 * u.s.length + 2 * q, free = slots - tlen - y.len;
    if (free < 0) return;
    if (yatiPref !== 'auto' && yatiPref !== 'none' && y.type === 'none') return;
    combos.push({ u, q, y, tlen, free });
  }); });
  if (!combos.length) return { error: 'No teermanam fits this span with the chosen yati. Add an avartanam or set yati to auto.' };
  const cs = combos.map(x => {
    let F = x.u.F, N = x.u.N;
    const teerStart = offset + x.free + x.y.len;
    if ((x.u.s.length + x.q) % g === 0 && ((teerStart % g) + g) % g === 0) F += 1.0; else N += 0.5;
    if (x.q <= 2) F += 0.4;
    if (x.free >= g) F += 0.6;
    if (x.free % g === 0) F += 0.5; else N += 0.3;
    if (x.y.type === 'none') F += 0.3;
    else if (x.y.type === 'sama') { F += 0.2; N += 0.2; }
    else N += (x.y.type === 'mridanga' || x.y.type === 'damaru') ? 1.0 : 0.8;
    if (yatiPref !== 'auto' && x.y.type !== 'none') { F += 0.5; N += 0.5; }
    const share = x.tlen / slots; F -= Math.abs(share - 0.35) * 1.5; N -= Math.abs(share - 0.35);
    return (1 - D.c) * F + D.c * N;
  });
  const c = combos[soft(cs, D.tau, rand)];
  const body = []; let pos = offset, rem = c.free, prevKey = null;
  while (rem > 0) {
    const cands = [];
    Object.keys(SOLLU).map(Number).filter(l => l <= rem).forEach(l => SOLLU[l].forEach(ph => cands.push(ph)));
    const sc = cands.map(p => {
      const l = p.length, end = pos + l; let F = 0, N = 0;
      if (l === g) F += 1.0; else if (l === 2 * g) F += 0.5; else if (l % 2 === 1) N += 0.6;
      if (((end % g) + g) % g === 0) F += 0.8; else N += 0.4;
      if (((pos % g) + g) % g !== 0) N += 0.2;
      if (p.join() === prevKey) { F += 0.4; N -= 0.4; } else N += 0.3;
      if (l === 1) { F -= 0.9; N -= 0.5; }
      if (p[p.length - 1] === 'thom') { F -= 0.5; N -= 0.5; }
      if (p[0] === 'tai' || p[0] === 'tat') F -= 0.3;
      return (1 - D.c) * F + D.c * N;
    });
    const ph = cands[soft(sc, D.tau, rand)];
    body.push(ph); prevKey = ph.join(); pos += ph.length; rem -= ph.length;
  }
  const gap = new Array(c.q).fill(',');
  const teer = [c.u.s, gap, c.u.s, gap, c.u.s];
  const segs = [];
  body.forEach(p => segs.push({ role: 'body', syl: p }));
  c.y.parts.forEach(p => segs.push({ role: 'yati', syl: p }));
  teer.forEach((p, i) => { if (p.length) segs.push({ role: i % 2 ? 'gap' : 'teermanam', syl: p }); });
  const used = segs.reduce((s, x) => s + x.syl.length, 0);
  const spanTxt = avartanams + ' × ' + tl.total + ' aksharas × ' + g + ' matras ' + (offset > 0 ? '− ' + offset + ' (eduppu after sam)' : offset < 0 ? '+ ' + (-offset) + ' (eduppu before sam)' : '(eduppu on sam)') + ' = ' + M + ' matras to sam';
  const res = {
    segs, slots, M, cycle, g, offset, avartanams, used, land,
    plan: { body: body.length, yati: c.y.type, teer: c.u.s, q: c.q },
    audit: {
      span: spanTxt, body: c.free,
      yati: c.y.type === 'none' ? 'none' : c.y.type + ' (' + c.y.parts.map(p => p.length).join(' → ') + ')',
      yatiLen: c.y.len, teermanam: '3 × ' + c.u.s.length + ' + 2 × ' + c.q + ' = ' + c.tlen,
      ok: used === slots
    }
  };
  res.script = jathiToScript(res, tl, opts);
  return res;
}

export { TEER, yatiBlocks, jathi };
