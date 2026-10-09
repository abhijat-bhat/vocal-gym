import { test } from 'node:test';
import { E, checker } from './helpers.js';

const X = E.JATHI_EXAMPLES;
const hdr = 'tala: adi\nnadai: 4\n';
const jj = body => E.judgeJathi(hdr + body);

test('worked examples', t => {
  const { ok, done } = checker(t);
  ['adi', 'chapu', 'speed'].forEach(k => { const J = E.judgeJathi(X[k]); ok(J.ok && J.gatePass && J.total >= 85, 'example ' + k + ' scores ' + J.total); });
  ok(E.judgeJathi(X.adi).total === 100, 'the guide example scores 100');
  const J = E.judgeJathi(X.short);
  ok(J.ok && !J.gatePass && J.total <= 49, 'one-matra-short example fails the gate and is capped');
  ok(J.gate.find(g => g.id === 'span').detail.includes('1 matra short'), 'says 1 matra short');
  ok(J.fixes[0].startsWith('Start with line 11'), 'first fix points at line 11');
  ok(J.fixes.some(f => /Add 1 matra of karvai/.test(f)), 'suggests one karvai');
  done();
});

test('syntax errors are reported with line and column', t => {
  const { ok, done } = checker(t);
  const unclosed = jj('(tha ka dhi mi');
  ok(!unclosed.ok && unclosed.errors[0].line === 3, 'unclosed bracket');
  ok(!jj('$Q tha').ok, 'undefined phrase');
  ok(!E.judgeJathi('tala: dhruvva\ntha').ok, 'unknown tala');
  ok(!jj('{tha dhi gi na thom}x2').ok, 'teermanam with x2');
  ok(!jj('@11 tha').ok, 'unsupported speed');
  const stray = jj('tha ) ka');
  ok(!stray.ok && stray.errors[0].line === 3 && stray.errors[0].col === 5, 'stray bracket at line 3, column 5');
  ok(!jj('tha x99').ok, 'repeat count out of range');
  ok(!jj('(tha {tha dhi}/1)').ok, 'teermanam inside a group');
  ok(!E.judgeJathi('tala: adi\n').ok, 'empty jathi');
  ok(!E.judgeJathi('tala: adi\nnadai: 72\ntha').ok, 'nadai above 36');
  ok(!E.judgeJathi('let A = $A\ntala: adi\n$A').ok, 'self-referencing phrase');
  ok(jj('takadhimi tha').warnings.some(w => /ta-ka-dhi-mi|tha-ka-dhi-mi/.test(w.msg)), 'compound word warning suggests hyphens');
  ok(jj('blorp tha').warnings.some(w => /not in the sollu vocabulary/.test(w.msg)), 'unknown syllable warning');
  done();
});

test('timing: landing modes, eduppu, kalai, speeds and bars', t => {
  const { ok, done } = checker(t);
  const J = s => E.judgeJathi(s);
  ok(J('tala: adi\nnadai: 4\navartanams: 1\nland: end\n(tha-ka-dhi-mi)x3 tha , , , , {tha-dhi-gi-na-thom}/0').gatePass, 'land: end');
  const inf = J('tala: adi\nnadai: 4\nland: sam\n(tha-ka-dhi-mi)x4 tha , {tha-dhi-gi-na-thom}/0');
  ok(inf.gatePass && inf.avartanams === 1, 'avartanams inferred');
  ok(J('tala: adi\nnadai: 4\navartanams: 1\nland: +2\n(tha-ka-dhi-mi)x4 tha , , , {tha-dhi-gi-na-thom}/0').gatePass, 'land: +2');
  ok(J('tala: rupaka\nnadai: 3\nkalai: 2\navartanams: 1\n(tha-ki-ta)x7 tha , , {tha-dhi-gi-na-thom}/0').parsed.cycleTicks === 6 * 2 * 2520, 'kalai 2 doubles the cycle');
  ok(J('tala: misra chapu\nnadai: 4\navartanams: 2\neduppu: +4\ntha-ka-dhi-mi tha-ka-jho-nu | tha-ka-dhi-mi tha-ka-jho-nu | tha-ka-dhi-mi tha-ka-jho-nu || tha-ki-ta tha-ka-dhi-mi tha-ka-tha-ki-ta {tha-dhi-gi-na-thom}/1').gatePass, 'anagata eduppu with bars');
  ok(J('tala: adi\nnadai: 4\navartanams: 1\neduppu: -2\ndhi-mi || (tha-ka-dhi-mi)x4 tha , {tha-dhi-gi-na-thom}/0').gatePass, 'atita eduppu with a pickup bar');
  ok(J('tala: adi\nnadai: 4\navartanams: 1\n@8 (tha-ka-dhi-mi-tha-ka-jho-nu)x4 | @4 tha , {tha-dhi-gi-na-thom}/0').gatePass, 'speed change @8 then @4');
  const late = J('tala: adi\nnadai: 4\navartanams: 1\n(tha-ka-dhi-mi)x4 tha | (tha-ka-dhi-mi)x2 {tha-dhi-gi-na-thom}/0');
  ok(!late.gatePass && /1 matra late/.test(late.gate.find(g => g.id === 'bars').detail), 'misplaced bar reported as 1 matra late');
  const uneq = J('tala: adi\nnadai: 4\navartanams: 1\n(tha-ka-dhi-mi)x4 | tha-dhi-gi-na-thom , , tha-dhi-gi-na-thom , , , tha-dhi-gi-na-thom');
  ok(!uneq.gatePass && uneq.gate.find(g => g.id === 'teer').ok === false, 'unequal written-out teermanam gaps fail');
  const det = J('tala: adi\nnadai: 4\navartanams: 1\n(tha-ka-dhi-mi)x4 | tha-dhi-gi-na-thom , tha-dhi-gi-na-thom , tha-dhi-gi-na-thom');
  ok(det.gatePass && det.teer && !det.teer.explicit, 'written-out teermanam detected');
  const noTeer = J('tala: adi\nnadai: 4\navartanams: 1\n(tha-ka-dhi-mi)x8 tha');
  ok(!noTeer.gatePass && noTeer.gate.find(g => g.id === 'teer').ok === false && /End with a teermanam/.test(noTeer.fixes.join(' ')), 'a jathi without a teermanam fails the gate');
  const opensKv = J('tala: adi\nnadai: 4\navartanams: 1\neduppu: -2\n, , (tha-ka-dhi-mi)x4 tha , {tha-dhi-gi-na-thom}/0');
  ok(!opensKv.gatePass && opensKv.gate.find(g => g.id === 'open').ok === false && /eduppu: sam/.test(opensKv.fixes.join(' ')), 'opening on karvai fails the gate and suggests moving the eduppu');
  ok(J('tala: adi\nnadai: 4\navartanams: 1\neduppu: before 2\ndhi-mi || (tha-ka-dhi-mi)x4 tha , {tha-dhi-gi-na-thom}/0').gatePass, 'eduppu alias "before n"');
  ok(J('tala: adi\nnadai: 4\navartanams: 1\neduppu: samam\nland: before sam\n(tha-ka-dhi-mi)x3 tha , , , , {tha-dhi-gi-na-thom}/0').gatePass, 'aliases samam and "before sam"');
  const trail = J('tala: adi\nnadai: 4\navartanams: 1\n(tha-ka-dhi-mi)x4 tha {tha-dhi-gi-na-thom}/0 ,');
  ok(!trail.gatePass && trail.gate.find(g => g.id === 'trail').ok === false, 'trailing karvai after the landing fails');
  done();
});

test('generated scripts round-trip through the parser', t => {
  const { ok, done } = checker(t);
  [E.tala('triputa', 4), E.tala('chapu', 7), E.tala('ata', 5)].forEach(tl => [-2, 0, 3].forEach(off => [0, 2].forEach(T => {
    const r = E.jathi({ tl, nadai: 4, avartanams: 2, offset: off, T, seed: 9 });
    const P = E.parseJathiScript(r.script);
    ok(P.ok, 'parses');
    ok(P.events.length === r.used, 'same number of slots: ' + P.events.length + ' vs ' + r.used);
    ok(P.events.map(e => e.v).join(' ') === r.segs.flatMap(s => s.syl).join(' '), 'same syllables in the same order');
  })));
  done();
});
