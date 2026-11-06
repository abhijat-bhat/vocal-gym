/* Vocal Gym server · a teacher's review of the raga phrases (v0.11)
   The generators use only data/raga-profiles.json, with its sources. A teacher's verdict or suggested phrase is a row here, and
   changes nothing by itself: scripts/phrase-reviews.js lists them, and what is accepted is written into the file with the teacher
   as its source, so the file stays the one place raga knowledge comes from. */
import * as E from '../src/engine/index.js';
import { getDb, now } from './db.js';
import { Invalid } from './auth.js';
import { checkPhrase } from '../scripts/check-raga-profiles.js';

const R = E.allRagas(), ALL = R.melakartas.concat(R.janyas), BY = new Map(ALL.map(r => [r.id, r]));
const VERDICTS = new Set(['right', 'wrong-raga', 'wrong-octave', 'unsure']);
const bad = msg => { throw new Invalid(msg); };
const ragaOf = id => BY.get(id) || bad('That is not a raga of Vocal Gym.');
const text = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

/* a pitch, written as the file writes it */
function written(raga, p) { const pc = E.mod12(p), lab = raga.labels[pc]; const two = lab && Object.values(raga.labels).filter(l => l[0] === lab[0]).length > 1; const nm = lab ? (two ? lab : lab[0]) : ['S', 'R1', 'R2', 'G2', 'G3', 'M1', 'M2', 'P', 'D1', 'D2', 'N2', 'N3'][pc]; return nm + (p >= 12 ? "'" : p < 0 ? '.' : ''); }
function phrasesOf(raga) {
  const p = E.getProfile(raga);
  return (p ? p.phrases.concat(p.exceptions) : []).map(ph => {
    const s = E.getSource(ph.source);
    return { id: ph.id, pitches: ph.pitches, durs: ph.durs, swaras: ph.pitches.map((x, i) => written(raga, x) + ' ,'.repeat(ph.durs[i] - 1)).join(' '), type: ph.type, weight: ph.weight, octaveCertain: ph.octaveCertain, exception: (ph.anya || p.exceptions.includes(ph)) ? true : false, anya: ph.anya || [], source: s ? { title: s.title, url: s.url } : null };
  }).sort((a, b) => b.weight - a.weight);
}

/* every raga, with how much there is to review and how far this teacher has got */
export async function overview(body, ctx) {
  const db = await getDb(), mine = new Map(db.prepare('SELECT raga, COUNT(*) AS n FROM phrase_reviews WHERE user_id = ? GROUP BY raga').all(ctx.user.id).map(r => [r.raga, r.n]));
  return { ragas: ALL.map(r => ({ id: r.id, name: r.name, kind: r.kind, phrases: phrasesOf(r).length, reviewed: mine.get(r.id) || 0 })) };
}
export async function raga(body, ctx) {
  const r = ragaOf(body.raga), db = await getDb();
  const mine = new Map(db.prepare('SELECT phrase_id, verdict, note FROM phrase_reviews WHERE user_id = ? AND raga = ?').all(ctx.user.id, r.id).map(x => [x.phrase_id, x]));
  const all = db.prepare('SELECT phrase_id, verdict, COUNT(*) AS n FROM phrase_reviews WHERE raga = ? GROUP BY phrase_id, verdict').all(r.id);
  const counts = {}; all.forEach(x => { (counts[x.phrase_id] = counts[x.phrase_id] || {})[x.verdict] = x.n; });
  const suggested = db.prepare('SELECT id, swaras, note, created_at FROM phrase_suggestions WHERE user_id = ? AND raga = ? ORDER BY id DESC').all(ctx.user.id, r.id);
  return { raga: { id: r.id, name: r.name }, phrases: phrasesOf(r).map(p => Object.assign(p, { mine: mine.get(p.id) ? { verdict: mine.get(p.id).verdict, note: mine.get(p.id).note } : null, counts: counts[p.id] || {} })), suggested };
}
/* body { raga, phrase, verdict, note }; a verdict of null takes this teacher's back */
export async function verdict(body, ctx) {
  const r = ragaOf(body.raga), db = await getDb(), ph = phrasesOf(r).find(p => p.id === body.phrase);
  if (!ph) bad('That is not a phrase of ' + r.name + '.');
  if (body.verdict == null) { db.prepare('DELETE FROM phrase_reviews WHERE user_id = ? AND raga = ? AND phrase_id = ?').run(ctx.user.id, r.id, ph.id); return { ok: true }; }
  if (!VERDICTS.has(body.verdict)) bad('Choose one of the verdicts.');
  db.prepare('INSERT INTO phrase_reviews (user_id, raga, phrase_id, swaras, verdict, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, raga, phrase_id) DO UPDATE SET verdict = excluded.verdict, note = excluded.note, swaras = excluded.swaras, created_at = excluded.created_at')
    .run(ctx.user.id, r.id, ph.id, ph.swaras, body.verdict, text(body.note, 400), now());
  return { ok: true };
}
/* body { raga, swaras, note }: read the way the file reads a phrase, so a mistake is named at once */
export async function suggest(body, ctx) {
  const r = ragaOf(body.raga), swaras = text(body.swaras, 240);
  if (!swaras) bad('Write the phrase in swaras, such as P D N S\'.');
  const c = checkPhrase(r, swaras);
  if (c.error) bad(/^bad token/.test(c.error) ? c.error.replace(/^bad token "(.*)"$/, '“$1” is not a swara. Use S R G M P D N, with an apostrophe or a dot for the octave, and a comma to hold.') : c.error.charAt(0).toUpperCase() + c.error.slice(1) + '.');
  if (c.pitches.length < 2) bad('A phrase needs at least two swaras.');
  const db = await getDb();
  db.prepare('INSERT INTO phrase_suggestions (user_id, raga, swaras, note, created_at) VALUES (?, ?, ?, ?, ?)').run(ctx.user.id, r.id, swaras, text(body.note, 400), now());
  return { ok: true, pitches: c.pitches, keepsRules: c.directionRuleOk, anya: c.anyaSwaras };
}
export async function unsuggest(body, ctx) {
  const db = await getDb();
  db.prepare('DELETE FROM phrase_suggestions WHERE id = ? AND user_id = ?').run(Number(body.id), ctx.user.id);
  return { ok: true };
}
