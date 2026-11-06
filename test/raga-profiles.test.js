import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { E, ALL, checker } from './helpers.js';
import { parsePhrase, phraseFeatures, validateProfiles, KALPANA_RANGE } from '../scripts/check-raga-profiles.js';
import { compileProfiles, compileProfileTable, PROFILES_MODULE } from '../scripts/compile-profiles.js';

const DOC = JSON.parse(readFileSync(new URL('../data/raga-profiles.json', import.meta.url), 'utf8'));
const BY_ID = Object.fromEntries(ALL.map(r => [r.id, r]));
const LETTERS = new Set(['S', 'R', 'G', 'M', 'P', 'D', 'N']);
const ROLE_KEYS = ['jiva', 'nyasa', 'chaya', 'prominent', 'graha', 'dirgha', 'alpa', 'notNyasa'];
const engineScale = (r, list) => list.map(p => (p === 12 ? "S'" : r.labels[E.mod12(p)])).join(' ');

test('raga profiles cover exactly the 100 engine ragas with the engine scales', t => {
  const { ok, done } = checker(t);
  const ids = Object.keys(DOC.ragas);
  ok(ids.length === 100, '100 profiles, found ' + ids.length);
  ALL.forEach(r => ok(!!DOC.ragas[r.id], 'profile for ' + r.id));
  ids.forEach(id => ok(!!BY_ID[id], 'no extra profile ' + id));
  ok(DOC.schemaVersion === 1, 'schemaVersion 1');
  ids.filter(id => BY_ID[id]).forEach(id => {
    const r = BY_ID[id], p = DOC.ragas[id];
    ok(p.id === id && p.name === r.name, id + ': id and name');
    ok(p.kind === r.kind, id + ': kind');
    ok(p.scale.arohana === engineScale(r, r.aro), id + ': arohana ' + p.scale.arohana);
    ok(p.scale.avarohana === engineScale(r, r.avaro), id + ': avarohana ' + p.scale.avarohana);
    if (r.kind === 'melakarta') { ok(p.mela === r.mela && id === 'mela' + p.mela, id + ': mela number'); ok(Array.isArray(p.vivadiPairs), id + ': vivadiPairs'); }
    else ok(p.parent === r.parent, id + ': parent mela');
  });
  done();
});

test('every phrase parses and its computed flags match the engine', t => {
  const { ok, done } = checker(t);
  let n = 0, exceptions = 0;
  Object.entries(DOC.ragas).forEach(([id, prof]) => {
    const r = BY_ID[id]; if (!r) return;
    const P = E.makeProjector(r);
    prof.phrases.forEach(ph => {
      n++;
      const res = parsePhrase(r, ph.swaras);
      ok(!res.error, id + ' "' + ph.swaras + '" parses: ' + res.error);
      if (res.error) return;
      let steps = true;
      for (let i = 1; i < res.pitches.length; i++) if (!P.valid(res.pitches[i - 1], res.pitches[i])) steps = false;
      const rule = steps && res.anya.length === 0;
      if (!rule) exceptions++;
      ok(ph.directionRuleOk === rule, id + ' "' + ph.swaras + '": directionRuleOk ' + ph.directionRuleOk + ', engine says ' + rule);
      ok(JSON.stringify(ph.anyaSwaras) === JSON.stringify(res.anya), id + ' "' + ph.swaras + '": anyaSwaras');
      ok(ph.inEngineRange === res.pitches.every(p => p >= KALPANA_RANGE[0] && p <= KALPANA_RANGE[1]), id + ' "' + ph.swaras + '": inEngineRange');
      ok(JSON.stringify(ph.features) === JSON.stringify(phraseFeatures(r, res.pitches, res.anya)), id + ' "' + ph.swaras + '": features');
      ok(typeof ph.weight === 'number' && ph.weight >= 0 && ph.weight <= 1, id + ' "' + ph.swaras + '": weight in [0, 1]');
      ok(typeof ph.octaveCertain === 'boolean', id + ' "' + ph.swaras + '": octaveCertain is boolean');
      if (ph.derivedFrom != null) ok(ph.derivedFrom === 'composition' && typeof ph.composition === 'string' && ph.composition.length > 0, id + ': derivedFrom names a composition');
    });
    prof.avoid.forEach(a => {
      ok(a.swaras != null || typeof a.rule === 'string', id + ': avoid entry has swaras or a rule');
      if (a.swaras != null) { const res = parsePhrase(r, a.swaras); ok(!res.error, id + ' avoid "' + a.swaras + '" parses: ' + res.error); }
    });
  });
  t.diagnostic(n + ' phrases, ' + exceptions + ' flagged as direction-rule exceptions');
  ok(n > 0, 'some phrases');
  done();
});

test('sources, enums and swara letters are valid', t => {
  const { ok, done } = checker(t);
  const EN = DOC.enums;
  Object.entries(DOC.sources).forEach(([sid, s]) => {
    ok(/^S\d+$/.test(sid), 'source id ' + sid);
    ok(typeof s.title === 'string' && /^https?:\/\//.test(s.url), sid + ': title and url');
    ok(EN.reliability.includes(s.reliability), sid + ': reliability ' + s.reliability);
  });
  const src = (s, where) => ok(!!DOC.sources[s], where + ': source ' + s + ' exists');
  (DOC.melakartaNotes.sources || []).forEach(s => src(s, 'melakartaNotes'));
  Object.entries(DOC.ragas).forEach(([id, p]) => {
    const r = BY_ID[id]; if (!r) return;
    const letters = new Set(Object.values(r.labels).map(l => l[0]));
    const letterOk = (x, where) => ok(LETTERS.has(x) && letters.has(x), id + ' ' + where + ': ' + x + ' is a swara of the raga');
    ok(EN.kind.includes(p.kind), id + ': kind');
    ok(EN.jantaDattu.includes(p.janta) && EN.jantaDattu.includes(p.dattu), id + ': janta/dattu');
    ['scale', 'roles', 'phrases'].forEach(k => ok(EN.confidence.includes(p.confidence[k]) || (k === 'scale' && ['low', 'medium', 'high'].includes(p.confidence[k])), id + ': confidence.' + k));
    ok((p.phrases.length === 0) === (p.confidence.phrases === 'none'), id + ': confidence.phrases none iff no phrases');
    ROLE_KEYS.forEach(k => { ok(Array.isArray(p.swaraRoles[k]), id + ': swaraRoles.' + k); (p.swaraRoles[k] || []).forEach(x => letterOk(x, 'swaraRoles.' + k)); });
    p.swaraRoles.sources.forEach(s => src(s, id + ' swaraRoles'));
    if (ROLE_KEYS.some(k => p.swaraRoles[k].length)) ok(p.swaraRoles.sources.length > 0, id + ': roles have sources');
    Object.keys(p.gamaka).filter(k => k !== 'sources' && k !== 'general').forEach(k => letterOk(k, 'gamaka'));
    p.gamaka.sources.forEach(s => src(s, id + ' gamaka'));
    if (Object.keys(p.gamaka).length > 1) ok(p.gamaka.sources.length > 0, id + ': gamaka has sources');
    p.phrases.forEach(ph => {
      src(ph.source, id + ' phrase');
      ok(EN.phraseType.includes(ph.type), id + ' "' + ph.swaras + '": type ' + ph.type);
      ok(EN.context.includes(ph.context), id + ' "' + ph.swaras + '": context ' + ph.context);
      ph.features.forEach(f => ok(EN.phraseFeature.includes(f), id + ': feature ' + f));
    });
    p.avoid.forEach(a => { src(a.source, id + ' avoid'); ok(EN.avoidStrength.includes(a.strength), id + ': avoid strength'); });
    p.allied.forEach(a => {
      ok(EN.alliedBasis.includes(a.basis), id + ': allied basis');
      if (a.basis === 'source') src(a.source, id + ' allied');
    });
    if (p.kind === 'melakarta') ok(p.allied.some(a => a.basis === 'structural'), id + ': mela twin listed');
    p.references.forEach(s => src(s, id + ' references'));
    ok(p.references.length > 0, id + ': at least one reference');
    ok(EN.hintBasis.includes(p.kalpanaHints.basis), id + ': hint basis');
    p.kalpanaHints.landingSwaras.forEach(x => letterOk(x.replace(/['.]$/, ''), 'landingSwaras'));
    p.kalpanaHints.avoidLanding.forEach(x => letterOk(x, 'avoidLanding'));
    ok(p.kalpanaHints.landingSwaras.length > 0, id + ': landing swaras (at least the S/P default)');
    if (!p.phrases.length || p.confidence.roles === 'none') ok(p.gaps.length > 0, id + ': gaps recorded where data is missing');
  });
  done();
});

test('the reusable checker agrees with the file', t => {
  const { ok, done } = checker(t);
  const errs = validateProfiles(JSON.parse(JSON.stringify(DOC)));
  ok(errs.length === 0, 'validateProfiles: ' + errs.slice(0, 5).join('; '));
  done();
});

test('the compiled profile module is up to date with the JSON and loads in the engine', t => {
  const { ok, done } = checker(t);
  const fresh = compileProfiles(JSON.parse(JSON.stringify(DOC)));
  ok(fresh === compileProfiles(JSON.parse(JSON.stringify(DOC))), 'compiling is deterministic');
  const onDisk = readFileSync(PROFILES_MODULE, 'utf8').replace(/\r\n/g, '\n');
  ok(onDisk === fresh, 'src/engine/data/profiles.generated.js is stale: run npm run profiles and commit it');
  const table = compileProfileTable(DOC);
  let phrases = 0;
  ALL.forEach(r => {
    const p = E.getProfile(r.id), P = E.makeProjector(r), pcs = new Set(r.aro.concat(r.avaro).map(E.mod12));
    ok(!!p, 'getProfile(' + r.id + ')');
    if (!p) return;
    ok(JSON.stringify(p) === JSON.stringify(table[r.id]), r.id + ': engine entry equals the compiled entry');
    ok(E.getProfile(r) === p, r.id + ': getProfile accepts the raga object');
    ['landing', 'avoidLanding', 'nyasa', 'jiva', 'alpa', 'notNyasa'].forEach(k => ok(p[k].every(pc => pcs.has(pc)), r.id + ': ' + k + ' are swaras of the raga'));
    ok(p.landing.length > 0, r.id + ': landing swaras');
    if (DOC.ragas[r.id].confidence.phrases === 'none') ok(p.phrases.length === 0, r.id + ': no phrases compiled where the JSON has none');
    p.phrases.forEach(ph => {
      phrases++;
      ok(ph.id.startsWith(r.id + '#') && DOC.ragas[r.id].phrases[+ph.id.split('#')[1]], ph.id + ': id names a JSON phrase');
      ok(ph.pitches.length === ph.durs.length && ph.durs.every(d => d >= 1), ph.id + ': one duration per swara');
      ok(ph.weight >= 0.15 && ph.pitches.every(x => x >= KALPANA_RANGE[0] && x <= KALPANA_RANGE[1]), ph.id + ': weight and range filter');
      for (let i = 1; i < ph.pitches.length; i++) ok(P.valid(ph.pitches[i - 1], ph.pitches[i]), ph.id + ': direction rule');
      ok(!!DOC.sources[ph.source], ph.id + ': source');
    });
    p.exceptions.forEach(ph => ok(DOC.ragas[r.id].phrases[+ph.id.split('#')[1]].directionRuleOk === false, ph.id + ': exceptions are direction-rule exceptions'));
  });
  ok(E.getProfile('nosuchraga') === null && E.getProfile(null) === null, 'unknown ragas give null');
  E.setProfiles({ mohanam: { landing: [0] } });
  ok(E.getProfile('mohanam').landing.length === 1 && E.getProfile('mela65') === null, 'setProfiles overrides the table');
  E.setProfiles(null);
  ok(E.getProfile('mela65') && E.getProfile('mela65').phrases.length > 0, 'setProfiles(null) restores the compiled table');
  t.diagnostic(Object.keys(table).length + ' compiled profiles, ' + phrases + ' usable phrases, ' + (Buffer.byteLength(fresh) / 1024).toFixed(0) + ' KB module');
  done();
});

test('phrases from the repertoire: only for ragas with nothing else, each from a real composition of that raga, and repeatable', async t => {
  const { ok, done } = checker(t);
  const { mine, apply } = await import('../scripts/mine-repertoire-phrases.js');
  const { readFileSync, readdirSync } = await import('node:fs');
  const doc = JSON.parse(readFileSync(new URL('../data/raga-profiles.json', import.meta.url), 'utf8'));
  const dir = new URL('../data/repertoire/c/', import.meta.url);
  const comps = readdirSync(dir).map(f => JSON.parse(readFileSync(new URL(f, dir), 'utf8'))).sort((a, b) => a.id.localeCompare(b.id));
  const byUrl = new Map(comps.map(c => [c.url, c]));
  const ragas = Object.values(doc.ragas), mined = ragas.filter(r => r.phrases.some(p => p.mined));
  ok(mined.length > 0, 'some ragas take phrases from the repertoire');
  mined.forEach(r => {
    ok(r.kind === 'melakarta', r.name + ' is a melakarta');
    ok(!r.phrases.some(p => !p.mined && p.weight >= 0.4), r.name + ': no phrase of weight from anywhere else');
    ok(r.confidence.phrases === 'low', r.name + ': phrase confidence stays low');
    r.phrases.filter(p => p.mined).forEach(p => {
      ok(p.weight < 0.5, r.name + ': lower weight than a lakshana');
      const c = byUrl.get(doc.sources[p.source].url);
      ok(!!c, r.name + ': "' + p.swaras + '" names a composition of the repertoire');
      if (c) { ok(!c.ragamalika, r.name + ': not from a ragamalika'); ok(!!p.composition, r.name + ': says which composition'); }
    });
  });
  // the same files give the same phrases, and applying again changes nothing
  const before = JSON.stringify(doc.ragas);
  const a = mine(doc, comps), b = mine(doc, comps);
  ok(JSON.stringify(a.report.map(l => l.phrases.map(x => x.swaras))) === JSON.stringify(b.report.map(l => l.phrases.map(x => x.swaras))), 'deterministic');
  apply(doc, a.found);
  const norm = s => JSON.stringify(JSON.parse(s), (k, v) => (['features', 'directionRuleOk', 'anyaSwaras', 'inEngineRange'].includes(k) ? undefined : v));
  ok(norm(JSON.stringify(doc.ragas)) === norm(before), 'running it again changes nothing');
  done();
});
