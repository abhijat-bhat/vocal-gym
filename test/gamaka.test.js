import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { E, ALL, checker } from './helpers.js';
import { validateProfiles, validateGamaka, resolveTarget } from '../scripts/check-raga-profiles.js';

const DOC = JSON.parse(readFileSync(new URL('../data/raga-profiles.json', import.meta.url), 'utf8'));
const byId = id => ALL.find(r => r.id === id);
const clone = x => JSON.parse(JSON.stringify(x));

test('gamakaRender: the transcriptions validate, compile, and bad inputs are rejected (plan test 16)', t => {
  const { ok, done } = checker(t);
  const withRules = Object.keys(DOC.ragas).filter(id => DOC.ragas[id].gamakaRender);
  const withText = Object.keys(DOC.ragas).filter(id => Object.keys(DOC.ragas[id].gamaka).some(k => k !== 'sources'));
  ok(withRules.length === 23 && withText.length === 23 && withText.every(id => withRules.includes(id)), 'the 23 ragas with gamaka text have gamakaRender');
  withRules.forEach(id => {
    const gr = DOC.ragas[id].gamakaRender, n = Object.values(gr.rules).reduce((s, l) => s + l.length, 0);
    ok(n >= 1, id + ': at least one rule');
    Object.values(gr.rules).flat().forEach(r => ok(DOC.ragas[id].gamaka.sources.includes(r.src) || ['S193', 'S194', 'S195', 'S196', 'S197', 'S198', 'S199'].includes(r.src), id + ': rule cites one of the raga\'s gamaka sources'));
    ok(validateGamaka(byId(id), gr, DOC).length === 0, id + ': validates');
  });
  ok(validateProfiles(clone(DOC)).length === 0, 'the whole file validates');

  // resolution: letters to semitone offsets with the raga's own swarasthanas
  const todi = byId('mela8'), kal = byId('mela65');
  ok(resolveTarget(todi, 3, 'R') === -2 && resolveTarget(todi, 3, 'M') === 2, 'Todi G2: R1 is 2 below, M1 2 above');
  ok(resolveTarget(todi, 10, "S'") === 2 && resolveTarget(todi, 10, 'D') === -2, "Todi N2: S' 2 above, D1 2 below");
  ok(resolveTarget(kal, 4, '+1') === 2 && resolveTarget(kal, 4, '-1') === -2 && resolveTarget(kal, 11, '+1') === 1, 'Kalyani: +1 and -1 are the next raga swaras');
  ok(resolveTarget(kal, 0, '-30c') === -0.3 && resolveTarget(kal, 0, 'self') === 0, 'cents and self');

  // the engine sees every raga's gamaka, with defaults where there is no data
  let defaults = 0;
  ALL.forEach(r => {
    const g = E.getProfile(r).gamaka;
    ok(g && typeof g.style === 'string' && g.maxChain >= 1, r.id + ': compiled gamaka');
    if (g.basis === 'default') { defaults++; ok(g.style === 'light' && !Object.keys(g.rules).length, r.id + ': light default without rules'); }
    Object.values(g.rules).flat().forEach(x => ['lo', 'hi', 'from'].forEach(k => { if (x[k] != null) ok(typeof x[k] === 'number' && Math.abs(x[k]) <= 7, r.id + ': offsets resolved'); }));
    g.sources.forEach(s => ok(!!E.getSource(s), r.id + ': gamaka source ' + s + ' is exported'));
  });
  ok(defaults === 63, '63 ragas fall back to the default, got ' + defaults);

  // crafted bad inputs
  const bad = (id, mutate, expect) => {
    const d = clone(DOC); mutate(d.ragas[id].gamakaRender, d);
    const errs = validateGamaka(byId(id), d.ragas[id].gamakaRender, d);
    ok(errs.some(e => expect.test(e)), id + ': expected an error matching ' + expect + ', got ' + JSON.stringify(errs));
  };
  bad('mela8', g => { delete g.rules.S[0].src; }, /missing src/);
  bad('mela8', g => { g.rules.S[0].src = 'S999'; }, /unknown or missing src S999/);
  bad('mela8', g => { g.rules.G[0].body = 'wobble'; }, /body wobble/);
  bad('mela8', g => { g.rules.G[0].cycles = [3, 1]; }, /cycles/);
  bad('mela8', g => { g.rules.S[0] = { body: 'kampita', lo: 'self', hi: "N'", src: 'S37' }; }, /semitones away/);
  bad('mela8', g => { g.rules.G[1].lo = 'M'; g.rules.G[1].hi = 'R'; }, /lo must be below hi/);
  bad('mohanam', g => { g.rules.M = [{ body: 'plain', src: 'S174' }]; }, /not a swara of Mohanam/);
  bad('mela8', g => { g.rules.G[0].when.tempo = 2; }, /unknown condition tempo/);
  bad('mela8', g => { g.rules.M[0].when.dir = 'sideways'; }, /dir sideways/);
  bad('mela8', g => { g.style = 'spicy'; }, /style spicy/);
  bad('mela65', g => { g.rules.N[1].when.prev = 'X'; }, /bad swara/);
  bad('mela8', g => { g.global[0].src = 'nope'; }, /global\[0\]/);
  const styles = {}; withRules.forEach(id => { const st = DOC.ragas[id].gamakaRender.style; styles[st] = (styles[st] || 0) + 1; });
  t.diagnostic(withRules.length + ' ragas with gamaka rules (' + Object.entries(styles).map(([k, v]) => v + ' ' + k).join(', ') + '), ' + defaults + ' on the light default');
  done();
});
