/* Vocal Gym server · Voice Check: a singer's measurements and short form (v0.11)
   The recording never comes here: the browser measures it and may keep it on the device. What is stored is one row a day of plain
   numbers, the short form and the context, with the version of the consent they agreed to. A singer can read all of it, and delete
   any of it; deleting the account deletes it too (the foreign key cascades). */
import { getDb, now } from './db.js';
import { Invalid } from './auth.js';

export const CONSENT_VERSION = 1;
const bad = msg => { throw new Invalid(msg); };
const FEATURES = ['stepsHeard', 'roomDb', 'stabilityCents', 'offCents', 'hnr', 'cpp', 'tilt', 'softOnsetSec', 'softBreaks', 'softHeard', 'rangeSemis', 'lowHz', 'highHz', 'swellDb', 'driftCents', 'saraliOffCents'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const num = (v, lo, hi) => (typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi ? v : null);

function cleanFeatures(f) {
  if (!f || typeof f !== 'object') bad('The measurements are missing.');
  const out = {};
  FEATURES.forEach(k => { out[k] = num(f[k], -2000, 20000); });
  if (!(out.stepsHeard >= 1)) bad('Nothing was sung in this check, so there is nothing to keep.');
  return out;
}
function cleanForm(f) {
  const o = f && typeof f === 'object' ? f : {}, out = {};
  ['tired', 'effort', 'recover'].forEach(k => { const v = num(o[k], 0, 4); out[k] = v == null ? null : Math.round(v); });
  const r = num(o.effortRating, 0, 10); out.effortRating = r == null ? null : Math.round(r);
  out.pain = o.pain === true; out.hoarseWeeks = o.hoarseWeeks === true; out.lostVoice = o.lostVoice === true;
  return out;
}
function cleanContext(c) {
  const o = c && typeof c === 'object' ? c : {};
  return { hoursAwake: num(o.hoursAwake, 0, 48), hoursSlept: num(o.hoursSlept, 0, 24), unwell: o.unwell === true, device: typeof o.device === 'string' ? o.device.trim().slice(0, 60) : '' };
}
const rowOut = r => ({ id: r.id, localDate: r.local_date, createdAt: r.created_at, features: JSON.parse(r.features), form: JSON.parse(r.form), context: JSON.parse(r.context) });

/* body { localDate, consent, features, form, context }. One a day: taking it again replaces that day's. */
export async function save(body, ctx) {
  if (body.consent !== CONSENT_VERSION) bad('Agree to what Voice Check keeps before saving it.');
  if (typeof body.localDate !== 'string' || !DATE.test(body.localDate)) bad('The date is not valid.');
  const db = await getDb(), features = cleanFeatures(body.features), form = cleanForm(body.form), context = cleanContext(body.context);
  db.prepare('INSERT INTO voice_checks (user_id, local_date, features, form, context, consent_version, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, local_date) DO UPDATE SET features = excluded.features, form = excluded.form, context = excluded.context, consent_version = excluded.consent_version, created_at = excluded.created_at')
    .run(ctx.user.id, body.localDate, JSON.stringify(features), JSON.stringify(form), JSON.stringify(context), CONSENT_VERSION, now());
  return list(body, ctx);
}
/* the singer's history, newest first */
export async function list(body, ctx) {
  const db = await getDb();
  return { checks: db.prepare('SELECT * FROM voice_checks WHERE user_id = ? ORDER BY local_date DESC LIMIT 400').all(ctx.user.id).map(rowOut), consentVersion: CONSENT_VERSION };
}
export async function remove(body, ctx) {
  const db = await getDb(), id = Number(body.id);
  if (!Number.isInteger(id)) bad('Say which check to delete.');
  db.prepare('DELETE FROM voice_checks WHERE id = ? AND user_id = ?').run(id, ctx.user.id);
  return list(body, ctx);
}
export async function removeAll(body, ctx) {
  const db = await getDb();
  db.prepare('DELETE FROM voice_checks WHERE user_id = ?').run(ctx.user.id);
  return { checks: [], consentVersion: CONSENT_VERSION };
}
