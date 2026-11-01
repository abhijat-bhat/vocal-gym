import { dial, rng, soft } from '../random.js';
import { korvaiPlans, korvaiPlan, moraSolutions, moraPlan, purvangaShapes, chakradarSolutions, chakradarPlan, layoutParts, statementOf, jatiOf, trikaala, korvaiFrame } from './index.js';
import { statementOptions, statementKorvai, progressiveOptions, progressiveKorvai, chakkardarSolutions, chakkardarPlan, halfTihais, doubledFrame } from './compose.js';

/* Vocal Gym engine · exploring every variation (v0.8.2)
   For a frame and the learner's constraints, exploreSpace() enumerates the complete variations of a form
   (a mora's P, G, series and shape; a korvai's split, uttaranga, purvanga, mora shape; …), each with
   facets to filter by and two scores: familiarity F (the ranking the builders already use) and novelty N
   (rare patterns, shaped moras, cross-rhythms, extreme balances, a second sollu texture). The order
   follows the project's creativity rule, score = (1 − c)·F + c·N with c = T/2 (src/engine/random.js),
   then a diversity pass so that each variation differs from the last few in some facet; surprise()
   samples one at the dial's τ from a seed. Every variation is laid out and checked by the same plan
   builders (exploreRealize), so exploring never relaxes a hard rule. Deterministic. */

const RARE = { triple: 0, '124': 0.55, sama: 0.25, srotovaha: 0.4, gopuccha: 0.4, ap: 0.5, polite: 0.6, mridanga: 0.7, damaru: 0.8, fib: 0.9, squares: 0.95, gp: 1, kuraippu: 1 };
const KIND_NAME = { triple: 'phrase (gap) × 3', '124': 'the 1-2-4 rule', sama: 'sama yati', srotovaha: 'srotovaha yati (a rising AP)', gopuccha: 'gopuccha yati (a falling AP)', ap: 'arithmetic progression', polite: 'consecutive integers', mridanga: 'mridanga yati', damaru: 'damaru yati', fib: 'Fibonacci-like', squares: 'squares', gp: 'geometric progression', kuraippu: 'kuraippu' };
const SERIES_NAME = { 3: '× 3', 6: '× 6 (aa (k) aa (k) aa)', 9: '× 9 (aaa (k) …)', buildup: '1 · 2 · 3 (build-up)' };
const SHAPE_NAME = { sama: 'equal', srotovaha: 'growing', gopuccha: 'shrinking' };
export const TEXTURES = { standard: 'tadiginathom endings', takadhom: 'takadhom endings, tha ri ki ta phrases' };
/* purvanga shapes for exploring: the best of every kind first (so GP, kuraippu, squares and the rest are
   never crowded out by the many yatis), then the rest by score */
function diverseShapes(list, cap) {
  const first = [], seen = new Set();
  list.forEach(p => { if (!seen.has(p.kind)) { seen.add(p.kind); first.push(p); } });
  return first.concat(list.filter(p => !first.includes(p))).slice(0, cap);
}
const band = r => r < 0.45 ? 'purvanga 30–45%' : r <= 0.55 ? 'purvanga 45–55%' : 'purvanga 55–70%';

/* ---------- the variation space ---------- */
/* o: { n: 3 | 6 | 9 | 'buildup' | 'any', shape: 'sama' | 'srotovaha' | 'gopuccha' | 'any', kinds (statements),
   cmode: 'pure' | 'mukhra' | 'any' (chakradar), trikaala: { n, fam, L, kalai }, textures: true } */
export function exploreSpace(F, form, o = {}) {
  const items = [], tex = o.textures === false ? ['standard'] : ['standard', 'takadhom'];
  const add = (it) => { it.key = items.length; if (it.spec && it.spec.texture === 'takadhom') it.label += ' · takadhom'; if (it.spec && it.spec.mode === 'eduppu') it.label += ' · eduppu'; items.push(it); };
  if (form === 'trikaala') {
    ['full', 'gap', 'lead'].forEach((v, k) => add({ form, label: { full: 'Full: 1, 2, 4 times', gap: 'Concert: a gap first', lead: 'Concert: the fourth moved to the front' }[v], sub: 'a jati of ' + (o.trikaala ? o.trikaala.n : 5), facets: { form: v }, F: 1 - k * 0.3, N: k * 0.5, spec: { variant: v } }));
    return finish(form, items);
  }
  if (!F || !F.ok) return finish(form, items);
  const T = F.total, gati = F.gati;
  if (form === 'mora') {
    const series = o.n === 'any' || o.n == null ? [3, 6, 9, 'buildup'] : [o.n];
    const shapes = o.shape === 'any' ? ['sama', 'srotovaha', 'gopuccha'] : [o.shape || 'sama'];
    series.forEach(n => moraSolutions(T, { n, gati }).forEach(s => shapes.forEach(shape => {
      if (shape !== 'sama' && (n === 'buildup' || s.P < 2)) return;
      tex.forEach(t => add({ form, label: (n === 'buildup' ? '1·2·3 ' : n > 3 ? n + '× ' : '') + s.P + ' (' + s.G + ')' + (shape !== 'sama' ? ' ' + SHAPE_NAME[shape] : ''), sub: s.eq,
        facets: { series: SERIES_NAME[n], shape: SHAPE_NAME[shape], gap: s.G ? 'with karvai (damdar)' : 'no karvai (bedam)', beat: s.beatAligned ? 'each on the same beat' : 'across the beat', texture: TEXTURES[t], half: 'whole gaps' },
        F: s.score + (shape === 'sama' ? 1.2 : 0) + (n === 3 ? 0.6 : 0) + (t === 'standard' ? 1 : 0),
        N: (shape !== 'sama' ? 0.9 : 0) + (n !== 3 ? 0.6 : 0) + (s.beatAligned ? 0 : 0.6) + (s.G ? 0 : 0.3) + (t !== 'standard' ? 0.5 : 0) + Math.min(0.4, s.G / Math.max(1, s.P) * 0.2),
        spec: { kind: 'mora', P: s.P, G: s.G, n, shape, texture: t } }));
    })));
    if (F.counting === 'end' && series.includes(3) && shapes.includes('sama')) halfTihais(T).forEach(h => tex.forEach(t => add({ form, label: h.P + ' (' + h.G + ')', sub: h.eq + ' · half-pulse gaps',
      facets: { series: SERIES_NAME[3], shape: SHAPE_NAME.sama, gap: 'with karvai (damdar)', beat: 'across the beat', texture: TEXTURES[t], half: 'half-pulse gaps' },
      F: 0.5 + (h.P >= 3 ? 0.5 : 0) + (t === 'standard' ? 1 : 0), N: 1.2 + (t !== 'standard' ? 0.5 : 0), spec: { kind: 'half', P: h.P, G: h.G, texture: t } })));
  } else if (form === 'korvai') {
    const shapes = o.shape === 'any' || o.shape == null ? ['sama', 'srotovaha', 'gopuccha'] : [o.shape];
    korvaiPlans(F, { limit: o.limit || 48 }).forEach(plan => {
      const us = plan.uttarangaOptions.slice(0, 2), pvs = diverseShapes(purvangaShapes(plan.V, gati), 24);
      us.forEach((u, ui) => pvs.forEach((pv, pi) => shapes.forEach(shape => {
        if (shape !== 'sama' && u.P < 3) return;
        tex.forEach(t => add({ form, label: plan.V + ' + ' + plan.U + ' · ' + KIND_NAME[pv.kind] + (shape !== 'sama' ? ' · ' + SHAPE_NAME[shape] + ' mora' : ''), sub: pv.formula + ' · ' + u.eq + (pv.also && pv.also.length ? ' · also ' + pv.also.join(', ') : ''),
          facets: { purvanga: KIND_NAME[pv.kind] || pv.kind, balance: band(plan.ratio), mora: SHAPE_NAME[shape] + ' mora', gap: u.G ? 'mora with karvai' : 'mora without karvai', texture: TEXTURES[t] },
          F: pv.score + u.score - Math.abs(plan.ratio - 0.62) * 4 - ui * 0.3 - pi * 0.05 + (shape === 'sama' ? 1.2 : 0) + (t === 'standard' ? 1 : 0),
          N: (RARE[pv.kind] || 0.5) + (pv.lines[0].gap ? 0 : 0.15) + (shape !== 'sama' ? 0.7 : 0) + Math.abs(plan.ratio - 0.5) + (u.beatAligned ? 0 : 0.4) + (t !== 'standard' ? 0.5 : 0),
          spec: { kind: 'korvai', V: plan.V, U: plan.U, purvanga: pv, uttaranga: u, shape, texture: t } }));
      })));
    });
  } else if (form === 'statements') {
    const opts = statementOptions(F, { kinds: o.kinds || null, limit: 600 }), modes = T % 3 ? ['unequal', 'eduppu'] : ['equal'];
    opts.forEach(p => modes.forEach(m => {
      if (m === 'eduppu' && !(Math.abs(F.start + T % 3) < F.C)) return;
      tex.forEach(t => add({ form, label: p.terms.join(' ') + ' + ' + p.U, sub: p.name + ' · ' + Math.round(p.ratio * 100) + '% · ' + (m === 'eduppu' ? 'an eduppu absorbs ' + (T % 3) : m === 'unequal' ? 'unequal statements' : 'three equal statements'),
        facets: { purvanga: p.name.replace(/ \(.*/, ''), balance: band(p.ratio), remainder: m === 'equal' ? 'divides by 3' : m === 'eduppu' ? 'an eduppu' : 'unequal statements', texture: TEXTURES[t] },
        F: p.score + (m === 'eduppu' ? -0.2 : 0) + (t === 'standard' ? 1 : 0), N: (RARE[p.kind] || 0.5) + Math.abs(p.ratio - 0.55) + (m === 'eduppu' ? 0.4 : 0) + (t !== 'standard' ? 0.5 : 0) + (p.terms.length > 5 ? 0.2 : 0),
        spec: { kind: 'statements', terms: p.terms, pattern: p, mode: m, texture: t } }));
    }));
  } else if (form === 'progressive') {
    progressiveOptions(F, { limit: 600 }).forEach(p => tex.forEach(t => add({ form, label: p.text, sub: 'm ' + p.m + ', d ' + p.d + ', U ' + p.U + ', each ' + (p.r > 1 ? p.r + ' times' : 'once'),
      facets: { statements: p.m + ' statements', direction: p.d > 0 ? 'growing' : 'shrinking', repeat: p.r > 1 ? 'each × ' + p.r : 'each once', texture: TEXTURES[t] },
      F: p.score + (t === 'standard' ? 1 : 0), N: (p.d < 0 ? 0.5 : 0) + (Math.abs(p.d) > 1 ? 0.3 : 0) + (p.m > 3 ? 0.3 : 0) + (p.r > 1 ? 0.2 : 0) + (t !== 'standard' ? 0.5 : 0),
      spec: { kind: 'progressive', m: p.m, d: p.d, U: p.U, r: p.r, texture: t } })));
  } else if (form === 'chakradar') {
    const modes = o.cmode === 'any' || o.cmode == null ? ['pure', 'mukhra'] : [o.cmode];
    if (modes.includes('pure')) chakkardarSolutions(T, { halves: F.counting === 'end', limit: 500 }).forEach(s => tex.forEach(t => add({ form, label: s.P1 + ' (' + s.G1 + ') · ' + s.G2, sub: s.eq,
      facets: { kind: 'chakkardar (no mukhra)', half: s.half ? 'half-pulse outer gap' : 'whole gaps', inner: s.G1 ? 'inner gaps' : 'no inner gaps', texture: TEXTURES[t] },
      F: s.score + (t === 'standard' ? 1 : 0), N: (s.half ? 0.9 : 0) + (s.G1 ? 0 : 0.3) + (t !== 'standard' ? 0.5 : 0) + 0.2, spec: { kind: 'chakkardar', sol: s, texture: t } })));
    if (modes.includes('mukhra')) chakradarSolutions(T, { gati, limit: 300 }).forEach(s => tex.forEach(t => add({ form, label: s.M + ' + ' + s.t + ' (' + s.g + ')' + (s.G ? ' (' + s.G + ')' : ''), sub: s.eq,
      facets: { kind: 'chakradar (with a mukhra)', half: 'whole gaps', inner: s.g ? 'inner gaps' : 'no inner gaps', texture: TEXTURES[t] },
      F: s.score + (t === 'standard' ? 1 : 0), N: (s.G ? 0.4 : 0) + (s.g ? 0 : 0.3) + (t !== 'standard' ? 0.5 : 0) + Math.min(0.6, s.M / Math.max(1, s.T) * 0.3), spec: { kind: 'chakradar', sol: s, texture: t } })));
  }
  return finish(form, items);
}
function finish(form, items) {
  // scores normalised to 0–1, and the facets with their counts
  const nz = k => { const v = items.map(x => x[k]), lo = Math.min(...v), hi = Math.max(...v); items.forEach(x => { x[k + 'n'] = hi > lo ? (x[k] - lo) / (hi - lo) : 0.5; }); };
  if (items.length) { nz('F'); nz('N'); }
  const facets = {};
  items.forEach(x => Object.keys(x.facets).forEach(f => { const m = facets[f] || (facets[f] = new Map()); m.set(x.facets[f], (m.get(x.facets[f]) || 0) + 1); }));
  const out = {};
  Object.keys(facets).forEach(f => { if (facets[f].size > 1) out[f] = Array.from(facets[f], ([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count); });
  return { form, items, count: items.length, facets: out };
}

/* ---------- order, filters and surprise ---------- */
/* the order to step through: o: { T (creativity 0–2), sort: 'creative' | 'familiar' | 'novel' | 'short' |
   'long', filters: { facet: value } }. Returns item indices. 'creative' blends the scores by c = T/2
   and then spreads the first few hundred so that neighbours differ (a maximal-marginal-relevance pass). */
export function exploreOrder(space, o = {}) {
  const D = dial(o.T == null ? 0.6 : o.T), c = D.c, f = o.filters || {};
  let idx = space.items.filter(x => Object.keys(f).every(k => f[k] == null || f[k] === '' || x.facets[k] === f[k])).map(x => x.key);
  const it = space.items, score = i => (1 - c) * it[i].Fn + c * it[i].Nn;
  const len = i => { const s = it[i].spec; return s.V != null ? s.V : s.P != null ? s.P : s.terms ? s.terms.reduce((a, b) => a + b, 0) : s.sol ? (s.sol.P1 || s.sol.M) : 0; };
  if (o.sort === 'familiar') return idx.sort((a, b) => it[b].Fn - it[a].Fn || a - b);
  if (o.sort === 'novel') return idx.sort((a, b) => it[b].Nn - it[a].Nn || a - b);
  if (o.sort === 'short') return idx.sort((a, b) => len(a) - len(b) || score(b) - score(a) || a - b);
  if (o.sort === 'long') return idx.sort((a, b) => len(b) - len(a) || score(b) - score(a) || a - b);
  idx.sort((a, b) => score(b) - score(a) || a - b);
  // diversity: of the leading 300, each next one trades a little score for differing from the last three
  const head = idx.slice(0, 300), rest = idx.slice(300), out = [], lam = 0.35 + 0.4 * c;
  const keys = head.length ? Object.keys(it[head[0]].facets) : [];
  // the first facet (the purvanga, the series, the kind …) counts double: it is what a listener hears first
  const wt = keys.map((k, j) => j === 0 ? 2 : 1), W = wt.reduce((a, b) => a + b, 0) || 1;
  const sim = (a, b) => keys.reduce((s, k, j) => s + (it[a].facets[k] === it[b].facets[k] ? wt[j] : 0), 0) / W;
  const left = head.slice();
  while (left.length) {
    let best = 0, bs = -Infinity;
    for (let j = 0; j < left.length; j++) {
      const recent = out.slice(-4), pen = recent.length ? Math.max(...recent.map(r => sim(left[j], r))) : 0, v = score(left[j]) - lam * pen;
      if (v > bs + 1e-12) { bs = v; best = j; }
    }
    out.push(left.splice(best, 1)[0]);
  }
  return out.concat(rest);
}
/* one variation drawn at the dial's τ, avoiding the recently seen; returns a position in `order` */
export function exploreSurprise(space, order, o = {}) {
  if (!order.length) return -1;
  const D = dial(o.T == null ? 1 : o.T), seen = new Set(o.avoid || []), cand = order.map((k, pos) => ({ k, pos })).filter(x => !seen.has(x.k));
  const pool = cand.length ? cand : order.map((k, pos) => ({ k, pos }));
  const sc = pool.map(x => ((1 - D.c) * space.items[x.k].Fn + D.c * space.items[x.k].Nn) * 3);
  return pool[soft(sc, D.tau, rng((o.seed || 1) * 2654435761 >>> 0))].pos;
}

/* ---------- realising a variation ---------- */
// the second sollu texture: statements close on "tha ka thom", and purvanga phrases use tha ri ki ta
const ALT = { 2: ['ki', 'ta'], 3: ['tha', 'ka', 'jham'], 4: ['tha', 'ri', 'ki', 'ta'], 5: ['tha', 'ka', 'tha', 'ki', 'ta'], 6: ['tha', 'ri', 'ki', 'ta', 'tha', 'ka'], 7: ['tha', 'ka', 'dhi', 'mi', 'tha', 'ki', 'ta'], 8: ['tha', 'ri', 'ki', 'ta', 'tha', 'ka', 'jho', 'nu'] };
export function altStatement(n) { return n <= 3 ? statementOf(n) : jatiOf(n - 3).concat(['tha', 'ka', 'thom']); }
export function altPhrase(n) { return ALT[n] ? ALT[n].slice() : jatiOf(n); }
function retexture(R, F, nestedPurvanga) {
  R.parts = R.parts.map(p => {
    const L = p.syl.length;
    if (p.role === 'statement' || p.role === 'uttaranga') return Object.assign({}, p, { syl: altStatement(L) });
    if (!nestedPurvanga && p.role === 'purvanga' && L > 1) return Object.assign({}, p, { syl: altPhrase(L) });
    if (p.role === 'mukhra' && L > 0) return Object.assign({}, p, { syl: altPhrase(L) });
    return p;
  });
  R.layout = layoutParts(F, R.parts);
  R.ok = R.layout.ok;
  R.steps = R.steps.map(s => s.id === 'land' ? Object.assign({}, s, { math: R.layout.checks[1].text }) : s);
  return R;
}
/* the plan for one variation, laid out and checked; R.frame is set when it is drawn at another resolution */
export function exploreRealize(F, item, o = {}) {
  const s = item.spec;
  let R, frame = F, nested = false;
  if (s.kind === 'mora') R = moraPlan(F, { P: s.P, G: s.G, n: s.n, shape: s.shape });
  else if (s.kind === 'half') { frame = doubledFrame(F); if (frame.error) return frame; R = moraPlan(frame, { P: 2 * s.P, G: 2 * s.G }); }
  else if (s.kind === 'korvai') { R = korvaiPlan(F, { purvanga: s.purvanga, uttaranga: s.uttaranga }, { shape: s.shape }); nested = s.purvanga.kind !== 'triple' && s.purvanga.kind !== '124'; }
  else if (s.kind === 'statements') {
    if (s.mode === 'eduppu') { frame = korvaiFrame({ tala: F.tala, gati: F.gati, kalai: F.kalai, cycles: F.cycles, start: F.start + F.total % 3, land: F.land, counting: F.counting }); if (frame.error) return frame; }
    R = statementKorvai(frame, { terms: s.terms, pattern: s.pattern }); nested = true;
  } else if (s.kind === 'progressive') { R = progressiveKorvai(F, s); nested = true; }
  else if (s.kind === 'chakkardar') { R = chakkardarPlan(F, s.sol); if (R.frame) frame = R.frame; }
  else if (s.kind === 'chakradar') R = chakradarPlan(F, s.sol);
  else if (o.trikaala) { R = trikaala(Object.assign({}, o.trikaala, { variant: s.variant })); if (!R.error) frame = R.frame; return R; }
  if (!R || R.error) return R || { error: 'Nothing to realise.' };
  if (s.texture === 'takadhom') retexture(R, frame, nested);
  if (frame !== F) R.frame = frame;
  R.variation = item;
  return R;
}

/* the facet counts for the current filters, as a shop's filters count: each facet's values are counted
   among the variations that match every other active filter (not its own), so a value shows how many
   variations choosing it would leave. Values that would leave none have count 0. */
export function exploreFacetCounts(space, filters = {}) {
  const out = {}, active = Object.keys(filters).filter(k => filters[k] != null && filters[k] !== '');
  Object.keys(space.facets).forEach(f => {
    const m = new Map(space.facets[f].map(x => [x.value, 0]));
    space.items.forEach(x => { if (active.every(k => k === f || x.facets[k] === filters[k])) m.set(x.facets[f], (m.get(x.facets[f]) || 0) + 1); });
    out[f] = space.facets[f].map(x => ({ value: x.value, count: m.get(x.value) || 0 }));
  });
  return out;
}
