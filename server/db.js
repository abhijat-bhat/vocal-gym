/* Vocal Gym server · the database (v0.8.7)
   One SQLite file on this machine, through Node's built-in node:sqlite (Node 22.13 or later; no package to
   install). The file is var/vocal-gym.db, or VG_DB to put it elsewhere (VG_DB=:memory: keeps nothing).
   It opens on first use, so the rest of the server runs on older Node versions with accounts unavailable.
   Tables: users, sessions (login tokens, stored hashed), routines (a user's practice routines) and logs
   (finished practice sessions); v0.9.1: notation_edits (a singer's corrections to the repertoire, server/edits.js); v0.9.5: octave_ok (octave questions a singer has settled as correct as written).
   Foreign keys cascade, so deleting a user deletes everything of theirs. */
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export class Unavailable extends Error {}
const DEFAULT_FILE = fileURLToPath(new URL('../var/vocal-gym.db', import.meta.url));
const SCHEMA = `
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name TEXT NOT NULL,
  pass TEXT NOT NULL,
  daily_goal_min INTEGER NOT NULL DEFAULT 20,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS routines (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  items TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS routines_user ON routines(user_id);
CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  routine_id INTEGER,
  routine_name TEXT NOT NULL,
  local_date TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT NOT NULL,
  seconds INTEGER NOT NULL,
  items TEXT NOT NULL,
  rating INTEGER,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  UNIQUE (user_id, client_id)
);
CREATE INDEX IF NOT EXISTS logs_user_date ON logs(user_id, local_date);
CREATE TABLE IF NOT EXISTS notation_edits (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comp TEXT NOT NULL,
  line_key TEXT NOT NULL,
  action TEXT NOT NULL,
  section INTEGER NOT NULL,
  line INTEGER,
  anchor TEXT,
  base TEXT,
  before TEXT,
  after TEXT,
  note TEXT NOT NULL DEFAULT '',
  revert_of INTEGER,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS notation_edits_comp ON notation_edits(user_id, comp, line_key, id);
CREATE TABLE IF NOT EXISTS octave_ok (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comp TEXT NOT NULL,
  line TEXT NOT NULL,
  fix TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, comp, line, fix)
);
INSERT OR IGNORE INTO meta (key, value) VALUES ('schema', '1');
`;

let db = null, opening = null;
/* the open database (opened, and its tables created, on first use) */
export async function getDb() {
  if (db) return db;
  if (!opening) opening = (async () => {
    let DatabaseSync;
    try { ({ DatabaseSync } = await import('node:sqlite')); } catch (e) {
      throw new Unavailable('Accounts need Node 22.13 or later (for its built-in SQLite); this server runs Node ' + process.version + '.');
    }
    const file = process.env.VG_DB || DEFAULT_FILE;
    if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
    const d = new DatabaseSync(file);
    if (file !== ':memory:') d.exec('PRAGMA journal_mode = WAL;');
    d.exec(SCHEMA);
    db = d;
    return d;
  })().catch(e => { opening = null; throw e; });
  return opening;
}
export const now = () => new Date().toISOString();
