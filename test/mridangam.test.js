import { test } from 'node:test';
import { E, checker } from './helpers.js';
import { SYLLABLES } from '../scripts/solkattu-bank.js';
import { loadMridangam, renderSollus } from '../scripts/mridangam-wav.js';

const M = loadMridangam(), SR = 44100, ALL = Object.keys(M.STROKES).concat(Object.keys(M.DERIVED));
/* the strongest frequency between lo and hi Hz in x[a..b) seconds */
function peak(x, lo, hi, a, b) {
  const s = x.subarray(Math.round(a * SR), Math.round(b * SR)), n = s.length;
  let best = 0, bf = 0;
  for (let f = lo; f <= hi; f += 0.5) {
    let re = 0, im = 0;
    for (let i = 0; i < n; i++) { const w = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1)), p = 2 * Math.PI * f * i / SR; re += s[i] * w * Math.cos(p); im -= s[i] * w * Math.sin(p); }
    const m = re * re + im * im; if (m > best) { best = m; bf = f; }
  }
  return bf;
}
/* seconds until the 10 ms RMS has fallen 40 dB below its peak */
function t40(x) {
  const n = Math.round(0.01 * SR), r = [];
  for (let i = 0; i + n < x.length; i += Math.round(n / 2)) { let e = 0; for (let j = i; j < i + n; j++) e += x[j] * x[j]; r.push(Math.sqrt(e / n)); }
  const p = r.indexOf(Math.max(...r)), k = r.findIndex((v, i) => i > p && v < r[p] / 100);
  return (k < 0 ? r.length : k - p) * 0.005;
}

test('mridangam: every sollu becomes a stroke, groups take their standard strokes', t => {
  const { ok, done } = checker(t);
  SYLLABLES.concat(Object.keys(E.ALIAS), Array.from(E.KNOWN)).forEach(s => { const k = M.realize([s])[0]; ok(ALL.includes(k), s + ' realizes as a stroke (' + k + ')'); });
  Object.values(E.SOLLU).forEach(groups => groups.forEach(g => M.realize(g).forEach((k, i) => ok(ALL.includes(k), g.join(' ') + ': ' + g[i] + ' → ' + k))));
  const r = s => M.realize(s.split(' ')).join(' ');
  ok(r('tha dhi gi na thom') === 'thi ta thi num thom', 'ta din gin na thom → ki ta ki nam thom (Karya): ' + r('tha dhi gi na thom'));
  ok(r('ta din gin na thom') === r('tha dhi gi na thom'), 'spellings vary: ta din gin = tha dhi gi');
  ok(r('tha ka') === 'thi tha' && r('tha ri ki ta') === 'thom thi num tha', 'ta ka → ki tha; ta ri ki ta → thom ki nam tha');
  ok(r('tha ka dhi mi tha ki ta') === 'thi tha num tha thi ta thi', 'a seven in one group: ' + r('tha ka dhi mi tha ki ta'));
  ok(JSON.stringify(M.realize(['tha', ',', ',', 'ka', '', 'thom'])) === JSON.stringify(['thi', null, null, 'tha', null, 'thom']), 'karvai and empty cells stay rests, and a group spans them');
  ok(r('thom') === 'thom' && r('nam') === 'num' && r('jham') === 'tham' && r('dhim') === 'dheem', 'single sollus: thom, nam, jham, dhim');
  done();
});

test('mridangam: strokes are deterministic, follow Sa, and ring as measured', t => {
  const { ok, done } = checker(t);
  ALL.forEach(s => {
    const a = M.render(s, 261.63, SR), b = M.render(s, 261.63, SR);
    ok(a.length === b.length && a.every((v, i) => v === b[i]), s + ': the same every time');
    let pk = 0; for (const v of a) { ok(Number.isFinite(v), s + ': finite'); pk = Math.max(pk, Math.abs(v)); }
    ok(pk > 0.05 && pk <= 0.9 + 1e-6, s + ': peak ' + pk.toFixed(3));
  });
  // the right head is tuned to Sa: chapu sounds Sa, and moves with it
  [261.63, 311.13].forEach(sa => { const f = peak(M.render('cha', sa, SR), sa * 0.9, sa * 1.1, 0.05, 0.3); ok(Math.abs(f / sa - 1) < 0.02, 'chapu on Sa ' + sa + ': ' + f + ' Hz'); });
  // the thoppi's bass glides down into its pitch in the first tens of milliseconds
  const thom = M.render('thom', 261.63, SR), f0 = 0.3601 * 261.63, early = peak(thom, f0 * 0.9, f0 * 1.4, 0, 0.03), late = peak(thom, f0 * 0.9, f0 * 1.4, 0.15, 0.35);
  ok(early > late * 1.03 && Math.abs(late / f0 - 1) < 0.03, 'thom glides from ' + early + ' to ' + late + ' Hz');
  // closed strokes die away faster than the open, ringing ones (measured: ta, thi ~0.15 s to −40 dB; dhin, cha, bheem longer)
  const d = Object.fromEntries(['ta', 'thi', 'tha', 'dhin', 'cha', 'bheem'].map(s => [s, t40(M.render(s, 261.63, SR))]));
  ok(Math.max(d.ta, d.thi, d.tha) < Math.min(d.dhin, d.cha, d.bheem), 'closed strokes are shorter: ' + JSON.stringify(d));
  // gumki bends up into the thoppi's ring
  const gum = M.render('gumki', 261.63, SR), g0 = 0.558 * 261.63;
  ok(peak(gum, g0 * 0.7, g0 * 1.1, 0, 0.04) < peak(gum, g0 * 0.7, g0 * 1.1, 0.3, 0.5), 'gumki rises');
  // a line of sollus renders to one buffer
  const { y, strokes } = renderSollus(M, 'tha ka dhi mi tha ki ta , thom'.split(' '), 0.2, 261.63, SR);
  ok(strokes.filter(Boolean).length === 8 && y.length > 1.8 * SR && y.every(Number.isFinite), 'a jathi line renders');
  t.diagnostic('time to −40 dB (s): ' + JSON.stringify(d));
  done();
});

test('mridangam: strokes are prepared ahead and scheduled with a cut', t => {
  const { ok, done } = checker(t);
  const sa = 277.18;
  ok(!M.ready('dheem', sa), 'not rendered before it is needed');
  return new Promise(resolve => M.prepare(sa, ['dheem', 'ta', 'nope'], () => {
    ok(M.ready('dheem', sa) && M.ready('ta', sa), 'prepared in the background');
    const log = [], param = () => ({ setValueAtTime: (v, x) => log.push(['set', v, x]), linearRampToValueAtTime: (v, x) => log.push(['ramp', v, x]) });
    const ac = { createBuffer: (c, n, r) => { const d = new Float32Array(n); return { duration: n / r, sampleRate: r, getChannelData: () => d }; },
      createBufferSource: () => ({ connect: n => n, start: x => log.push(['start', x]), stop: x => log.push(['stop', x]) }), createGain: () => ({ gain: param(), connect: n => n }) };
    const play = M.voice(ac, {}, sa);
    ok(play(1, 'dheem', 0.1) && !play(2, 'nope', 0.1) && !play(3, null, 0.1), 'known strokes play, others are refused');
    const ramp = log.find(e => e[0] === 'ramp');
    ok(ramp && Math.abs(ramp[2] - 1.45) < 1e-9, 'a stroke rings 0.35 s under the next one, then is damped');
    done(); resolve();
  }));
});

test('mridangam: the lab’s structure is audible: accented phrase starts, the cadence on tham, and phrase tones by length that follow Sa', t => {
  const { ok, done } = checker(t);
  const K = E.korvai, starts = A => A.filter(a => a && a.guide != null && !a.close);
  // a passage of phrases of the given lengths, from sam (the lab's yati and pattern lessons)
  const passage = lens => {
    const S = lens.reduce((a, b) => a + b, 0), C = 32, cycles = Math.ceil(S / C), F = K.korvaiFrame({ cycles, land: S - cycles * C });
    const fam = K.nestedPhrases(lens);
    return K.layoutParts(F, lens.map((l, k) => ({ role: 'purvanga', syl: fam[k], part: k }))).cells;
  };
  const guides = lens => starts(M.arrange(passage(lens))).map(a => a.guide);
  const dec = g => g.every((x, i) => i === 0 || x < g[i - 1]), inc = g => g.every((x, i) => i === 0 || x > g[i - 1]);
  ok(dec(guides([11, 9, 7, 5])), 'gopuccha falls: ' + guides([11, 9, 7, 5]));
  ok(inc(guides([5, 7, 9, 11])), 'srotovaha rises: ' + guides([5, 7, 9, 11]));
  const md = guides([4, 6, 8, 10, 8, 6, 4]); ok(inc(md.slice(0, 4)) && dec(md.slice(3)), 'mridanga rises and falls: ' + md);
  const dm = guides([8, 6, 4, 6, 8]); ok(dec(dm.slice(0, 3)) && inc(dm.slice(2)), 'damaru falls and rises: ' + dm);
  const ku = guides([16, 8, 4, 2, 1]); ok(dec(ku) && ku[0] - ku[1] >= 5, 'kuraippu halves in steps of about a fifth: ' + ku);
  const gp = guides([2, 4, 8, 16]), ap = guides([2, 3, 4, 5]); ok(inc(gp) && inc(ap) && gp[3] - gp[0] > ap[3] - ap[0], 'a GP climbs faster than an AP: ' + gp + ' / ' + ap);
  ok(new Set(guides([6, 6, 6, 6])).size === 1, 'equal phrases share one tone');
  // a korvai: purvanga starts accented with a bass layer, the mora statements on tham, gaps silent, the close a tham on Sa's octave
  const F = K.korvaiFrame({ cycles: 2 }), R = K.korvaiPlan(F, K.korvaiPlans(F)[0]), A = M.arrange(R.layout.cells);
  R.layout.cells.forEach((c, i) => {
    if (c.role === 'gap' || c.role === 'pgap' || c.role === 'pre' || c.syl === ',' || c.syl === '') ok(A[i] === null, 'silent cell ' + i);
  });
  const firsts = R.layout.cells.map((c, i) => [c, A[i]]).filter(([c, a]) => a && a.guide != null && !a.close);
  ok(firsts.filter(([c]) => c.role === 'purvanga').every(([, a]) => a.gain > 1 && a.layer === 'thom'), 'purvanga phrases open accented, over a thom');
  ok(firsts.filter(([c]) => c.role === 'statement').length === 3 && firsts.filter(([c]) => c.role === 'statement').every(([, a]) => a.stroke === 'tham'), 'the three statements open on tham');
  ok(A.filter(a => a && a.guide == null).every(a => a.gain < 1), 'strokes inside a phrase are lighter');
  const close = A[A.length - 1]; ok(close && close.close && close.stroke === 'tham' && close.guide === 12, 'the closing syllable: tham, with Sa an octave up');
  // the tones follow Sa
  ok(Math.abs(M.guideHz(293.66, 0) / M.guideHz(261.63, 0) - 293.66 / 261.63) < 1e-9 && Math.abs(M.guideHz(261.63, 12) - 4 * 261.63) < 1e-6, 'guideHz tracks Sa');
  [0, 2, 4, 5, 7, 9, 11, 12, 14, 24].forEach(s => ok(M.snap(s) === s, 'scale degree ' + s + ' stays'));
  // played: every oscillator frequency is Sa times a scale ratio, so changing Sa moves every tone
  const freqs = sa => {
    const fs = [];
    const node = x => Object.assign({ connect: n => n, disconnect() {} }, x);
    const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
    const ac = { currentTime: 0, createOscillator: () => { const o = node({ type: '', start() {}, stop() {} }); o.frequency = { set value(v) { fs.push(v); }, get value() { return 0; } }; return o; },
      createGain: () => node({ gain: param() }), createBuffer: (c, n) => ({ duration: n / SR, getChannelData: () => new Float32Array(n) }), createBufferSource: () => node({ start() {}, stop() {} }) };
    M.playArranged(ac, node({}), 0, 0.1, R.layout.cells, { sa, drum: false });
    return fs;
  };
  const c = freqs(261.63), d = freqs(293.66);
  ok(c.length > 0 && c.length === d.length && c.every((f, i) => Math.abs(d[i] / f - 293.66 / 261.63) < 1e-9), 'D moves every tone up a whole step from C');
  done();
});
