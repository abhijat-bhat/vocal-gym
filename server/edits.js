/* Vocal Gym server · a singer's corrections to the repertoire, and the log of them (v0.9.1)
   The imported notation (data/repertoire/) is never written to. Each change a singer makes to a line is one row
   of notation_edits: what the line was, what it became, when and (if they say) why. The rows are only ever added
   to: undoing a change is a new change, so the log stays whole. The engine's applyEdits lays a singer's rows
   over a composition when it is read, so they outlast a re-import.
   Line keys: b:<section>:<line> for a line of the import, n:<id> for a line the singer added. */
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { getDb, now } from './db.js';
import { Invalid } from './auth.js';
import { cleanLine, lineText, sameLine } from '../src/engine/repertoire.js';

const DATA = new URL('../data/repertoire/', import.meta.url);
const COMP = /^[a-z0-9][a-z0-9-]{0,119}$/;
const MAX_EDITS = 20000;   // a singer's whole log
const bad = msg => { throw new Invalid(msg); };

function loadComp(id) {
  if (typeof id !== 'string' || !COMP.test(id)) bad('That is not a composition of the repertoire.');
  try { return JSON.parse(readFileSync(new URL('c/' + id + '.json', DATA), 'utf8')); } catch (e) { return bad('No composition “' + id + '” in the repertoire.'); }
}
let titles = null;
const titleOf = id => {
  if (!titles) titles = new Map(JSON.parse(readFileSync(new URL('index.json', DATA), 'utf8')).compositions.map(c => [c.id, c.name]));
  return titles.get(id) || id;
};
const nice = s => String(s || '').replace(/^./, c => c.toUpperCase());
const sectionName = (c, si) => { const s = c && c.sections[si]; return s && s.title ? nice(s.title) : 'Section ' + (si + 1); };
const whereOf = (r, c) => sectionName(c, r.section) + (r.line != null ? ', line ' + (r.line + 1) : ', an added line');
const parse = s => (s == null ? null : JSON.parse(s));
const rowOf = (r, c) => ({ id: r.id, comp: r.comp, key: r.line_key, action: r.action, section: r.section, line: r.line, anchor: r.anchor, base: r.base, before: parse(r.before), after: parse(r.after), note: r.note, revertOf: r.revert_of, at: r.created_at, where: whereOf(r, c) });
const contentOf = l => ({ cells: l.cells, syl: l.syl || [], label: l.label || '' });
const noteOf = v => { if (v == null) return ''; if (typeof v !== 'string') bad('The note must be text.'); const s = v.trim(); if (s.length > 300) bad('The note must be at most 300 characters.'); return s; };

const listFor = (db, user, comp) => db.prepare('SELECT * FROM notation_edits WHERE user_id = ? AND comp = ? ORDER BY id').all(user, comp);
const listRows = (db, user, comp, c) => listFor(db, user, comp).map(r => rowOf(r, c));
/* the latest row of a line, and the line as it stands: the import's, or that row's */
function current(db, user, comp, c, key) {
  const row = db.prepare('SELECT * FROM notation_edits WHERE user_id = ? AND comp = ? AND line_key = ? ORDER BY id DESC LIMIT 1').get(user, comp, key);
  if (row) return { row, line: parse(row.after) };
  const m = /^b:(\d+):(\d+)$/.exec(String(key));
  const l = m && c.sections[+m[1]] && c.sections[+m[1]].lines[+m[2]];
  if (!l) bad('That line is not in this composition.');
  return { row: null, line: contentOf(l), section: +m[1], index: +m[2], base: lineText(l.cells) };
}
function insert(db, user, comp, e) {
  if (db.prepare('SELECT COUNT(*) AS n FROM notation_edits WHERE user_id = ?').get(user).n >= MAX_EDITS) bad('Your log of changes is full (' + MAX_EDITS + ').');
  const r = db.prepare('INSERT INTO notation_edits (user_id, comp, line_key, action, section, line, anchor, base, before, after, note, revert_of, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(user, comp, e.key, e.action, e.section, e.line == null ? null : e.line, e.anchor || null, e.base == null ? null : e.base, e.before ? JSON.stringify(e.before) : null, e.after ? JSON.stringify(e.after) : null, e.note || '', e.revertOf || null, now());
  return Number(r.lastInsertRowid);
}
/* a change on top of the latest row of its line; expect (the latest row the page saw) stops a second tab overwriting the first */
function checkExpected(body, cur) {
  if (body.expect === undefined) return;
  if (Number(body.expect || 0) !== (cur.row ? cur.row.id : 0)) bad('This line was changed somewhere else since this page loaded it. Reload the page, then try again.');
}

/* ---- octave questions settled (v0.9.5) ----
   A singer can say a line flagged by the octave checks is correct as written. It is remembered by the line's text and the
   fix it answers, so a line reading the same is settled too, a change to the line asks again, and it outlasts a re-import. */
const okRows = (db, user, comp) => db.prepare('SELECT line, fix FROM octave_ok WHERE user_id = ? AND comp = ? ORDER BY created_at, line').all(user, comp).map(r => ({ line: r.line, fix: r.fix }));
const textOf = cells => { const r = cleanLine({ cells }); if (r.errors.length) bad(r.errors[0]); return lineText(r.line.cells); };
export async function octaveOk(body, ctx) {
  const c = loadComp(body.comp), db = await getDb(), user = ctx.user.id;
  if (db.prepare('SELECT COUNT(*) AS n FROM octave_ok WHERE user_id = ?').get(user).n >= MAX_EDITS) bad('Your list of settled octaves is full (' + MAX_EDITS + ').');
  db.prepare('INSERT OR IGNORE INTO octave_ok (user_id, comp, line, fix, created_at) VALUES (?, ?, ?, ?, ?)').run(user, c.id, textOf(body.line), textOf(body.fix), now());
  return { octaveOk: okRows(db, user, c.id) };
}
export async function octaveAsk(body, ctx) {
  const c = loadComp(body.comp), db = await getDb(), user = ctx.user.id;
  db.prepare('DELETE FROM octave_ok WHERE user_id = ? AND comp = ? AND line = ? AND fix = ?').run(user, c.id, textOf(body.line), textOf(body.fix));
  return { octaveOk: okRows(db, user, c.id) };
}

/* ---- the routes ---- */
export async function edits(body, ctx) {
  const c = loadComp(body.comp), db = await getDb();
  return { edits: listRows(db, ctx.user.id, c.id, c), octaveOk: okRows(db, ctx.user.id, c.id) };
}
/* body { comp, action: 'edit' | 'add' | 'remove', key?, section?, anchor?, line?, note?, expect? } */
export async function save(body, ctx) {
  const c = loadComp(body.comp), db = await getDb(), user = ctx.user.id, action = body.action, note = noteOf(body.note);
  if (!['edit', 'add', 'remove'].includes(action)) bad('Choose what to do with the line: edit, add or remove.');
  let line = null;
  if (action !== 'remove') {
    const r = cleanLine(body.line);
    if (r.errors.length) bad(r.errors[0]);
    line = r.line;
  }
  // a swara must be one its raga has; one the line already has may stay, so the rest of the line can be corrected
  const inRaga = (si, keep) => {
    const s = c.sections[si], scale = s ? c.ragas[s.raga != null && c.ragas[s.raga] ? s.raga : 0] : null;
    const r = cleanLine(body.line, { scale, keep });
    if (r.errors.length) bad(r.errors[0]);
  };
  let id;
  if (action === 'add') {
    const section = Number(body.section);
    if (!(Number.isInteger(section) && c.sections[section])) bad('That section is not in this composition.');
    inRaga(section);
    const anchor = body.anchor == null ? 's' : String(body.anchor);
    let base = null;
    if (anchor !== 's') {
      const a = current(db, user, c.id, c, anchor);
      base = a.row ? a.row.base : a.base;
    }
    id = insert(db, user, c.id, { key: 'n:' + randomBytes(6).toString('hex'), action, section, anchor, base, before: null, after: line, note });
  } else {
    const key = String(body.key || ''), cur = current(db, user, c.id, c, key);
    checkExpected(body, cur);
    if (!cur.line) bad('That line has been removed. Restore it from the log of changes first.');
    if (action === 'edit' && sameLine(line, cur.line)) bad('Nothing has changed.');
    if (action === 'edit') inRaga(cur.row ? cur.row.section : cur.section, cur.line.cells);
    const r = cur.row;
    id = insert(db, user, c.id, { key, action, section: r ? r.section : cur.section, line: r ? r.line : cur.index, anchor: r ? r.anchor : null, base: r ? r.base : cur.base, before: cur.line, after: line, note });
  }
  return { id, edits: listRows(db, user, c.id, c) };
}
/* body { comp, id, to: 'before' | 'after' | 'site', note?, expect? }: put a line back to how it was before or after
   the change `id`, or to the import's own. It is a new row: nothing is rewritten. */
export async function restore(body, ctx) {
  const c = loadComp(body.comp), db = await getDb(), user = ctx.user.id, note = noteOf(body.note), to = body.to;
  if (!['before', 'after', 'site'].includes(to)) bad('Choose which version to put back.');
  const row = db.prepare('SELECT * FROM notation_edits WHERE id = ? AND user_id = ? AND comp = ?').get(Number(body.id), user, c.id);
  if (!row) bad('No such change.');
  const cur = current(db, user, c.id, c, row.line_key);
  checkExpected(body, cur);
  let target = to === 'before' ? parse(row.before) : parse(row.after);
  if (to === 'site') {
    const l = row.line != null && c.sections[row.section] && c.sections[row.section].lines[row.line];
    target = row.line_key.startsWith('b:') && l && lineText(l.cells) === row.base ? contentOf(l) : null;
    if (row.line_key.startsWith('b:') && !target) bad('The site’s version of this line is no longer where it was.');
  }
  if (cur.line ? (target && sameLine(cur.line, target)) : !target) bad('The line is already like that.');
  const id = insert(db, user, c.id, { key: row.line_key, action: 'restore', section: row.section, line: row.line, anchor: row.anchor, base: row.base, before: cur.line, after: target, note, revertOf: row.id });
  return { id, edits: listRows(db, user, c.id, c) };
}
/* every change of a singer, newest first, for the log page: body { comp?, action?, before?, limit? } */
export async function changes(body, ctx) {
  const db = await getDb(), user = ctx.user.id, limit = Math.max(1, Math.min(100, Number(body.limit) || 30));
  const where = ['user_id = ?'], args = [user];
  if (body.comp) { if (typeof body.comp !== 'string' || !COMP.test(body.comp)) bad('That is not a composition of the repertoire.'); where.push('comp = ?'); args.push(body.comp); }
  if (body.action) { if (!['edit', 'add', 'remove', 'restore'].includes(body.action)) bad('That is not a kind of change.'); where.push('action = ?'); args.push(body.action); }
  if (body.before) { where.push('id < ?'); args.push(Number(body.before)); }
  const rows = db.prepare('SELECT * FROM notation_edits WHERE ' + where.join(' AND ') + ' ORDER BY id DESC LIMIT ?').all(...args, limit + 1);
  const seen = new Map();
  const comp = id => { if (!seen.has(id)) { let c = null; try { c = loadComp(id); } catch (e) { /* no longer imported */ } seen.set(id, c); } return seen.get(id); };
  const latest = new Map(db.prepare('SELECT comp, line_key, MAX(id) AS id FROM notation_edits WHERE user_id = ? GROUP BY comp, line_key').all(user).map(r => [r.comp + ' ' + r.line_key, r.id]));
  const list = rows.slice(0, limit).map(r => Object.assign(rowOf(r, comp(r.comp)), { title: titleOf(r.comp), latest: latest.get(r.comp + ' ' + r.line_key) === r.id }));
  const comps = db.prepare('SELECT comp, COUNT(*) AS n, MAX(id) AS last FROM notation_edits WHERE user_id = ? GROUP BY comp ORDER BY last DESC').all(user).map(r => ({ id: r.comp, title: titleOf(r.comp), n: r.n }));
  return { changes: list, more: rows.length > limit, comps };
}
