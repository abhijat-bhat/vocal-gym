#!/usr/bin/env node
/* Vocal Gym · what teachers have said about the raga phrases (v0.11)
   Reads the verdicts and suggestions from the Phrase review page, phrase by phrase. It changes nothing: a phrase a teacher rejects
   is lowered or removed in data/raga-profiles.json by hand, and one they suggest is added there with them as its source
   (docs/raga-profiles.md, section 7), then `npm run profiles`.

   Usage: node scripts/phrase-reviews.js            a readable list
          node scripts/phrase-reviews.js --json     the same as JSON */
import { getDb } from '../server/db.js';

const db = await getDb();
const reviews = db.prepare('SELECT r.raga, r.phrase_id, r.swaras, r.verdict, r.note, r.created_at, u.display_name AS teacher FROM phrase_reviews r JOIN users u ON u.id = r.user_id ORDER BY r.raga, r.phrase_id, r.created_at').all();
const suggestions = db.prepare('SELECT s.raga, s.swaras, s.note, s.created_at, u.display_name AS teacher FROM phrase_suggestions s JOIN users u ON u.id = s.user_id ORDER BY s.raga, s.created_at').all();
if (process.argv.includes('--json')) { console.log(JSON.stringify({ reviews, suggestions }, null, 2)); process.exit(0); }
if (!reviews.length && !suggestions.length) { console.log('No verdicts or suggestions yet.'); process.exit(0); }
let at = '';
reviews.forEach(r => { if (r.raga !== at) { at = r.raga; console.log('\n' + at); } console.log('  ' + r.swaras + '  [' + r.phrase_id + ']  ' + r.verdict + ' (' + r.teacher + ')' + (r.note ? ': ' + r.note : '')); });
if (suggestions.length) { console.log('\nSuggested'); suggestions.forEach(s => console.log('  ' + s.raga + ': ' + s.swaras + ' (' + s.teacher + ')' + (s.note ? ': ' + s.note : ''))); }
