import { mod12 } from '../projection.js';

/* Vocal Gym engine · reading suggested swara lines (v0.8.5)
   parseInspiration() reads the answer to rhythmPrompt(): JSON of { idea, phrases: [{ phrase, swaras }] },
   as a language model or a person writes it, alone or inside other text or a code fence. A line is written
   one token a syllable: a swara (S R G M P D N, with a variant number if wanted: R2, D1), an apostrophe
   after it for the upper octave (S') and a dot for the lower (P.); a comma (or a dash) holds the swara
   before it. Swaras outside the raga are kept as pitches and moved onto the raga by kalpanaRhythm. */

const BASE = { S: 0, R: 2, G: 4, M: 5, P: 7, D: 9, N: 11 };
const VARIANT = { R1: 1, R2: 2, R3: 3, G1: 2, G2: 3, G3: 4, M1: 5, M2: 6, D1: 8, D2: 9, D3: 10, N1: 9, N2: 10, N3: 11 };
const TOKEN = /([.'^]*)([SRGMPDN])([123])?([.'^]*)|[,\-]/gi;
const MAX_PHRASES = 400, MAX_TOKENS = 200;

/* the pitch of a swara name in a raga: its own variant when written, else the raga's swara of that letter */
function pitchOf(letter, digit, raga) {
  const L = letter.toUpperCase();
  if (digit && VARIANT[L + digit] != null) return VARIANT[L + digit];
  if (L === 'S' || L === 'P') return BASE[L];
  const pcs = Array.from(new Set(raga.aro.concat(raga.avaro).map(mod12))).sort((a, b) => a - b);
  const own = raga.labels ? pcs.filter(pc => String(raga.labels[pc] || '').toUpperCase().startsWith(L)) : [];
  return own.length ? own[0] : BASE[L];
}
/* one line of tokens: a pitch for each swara, null for each hold */
export function parseSwaras(text, raga) {
  const out = [];
  let outside = 0;
  const pcs = new Set(raga.aro.concat(raga.avaro).map(mod12));
  String(text).replace(TOKEN, (m, pre, letter, digit, post) => {
    if (out.length >= MAX_TOKENS) return m;
    if (!letter) { out.push(null); return m; }
    const marks = (pre || '') + (post || ''), up = (marks.match(/['^]/g) || []).length, down = (marks.match(/\./g) || []).length;
    const p = pitchOf(letter, digit, raga) + 12 * (up - down);
    if (!pcs.has(mod12(p))) outside++;
    out.push(p);
    return m;
  });
  return { tokens: out, outside };
}
/* the whole answer: { phrases: [{ phrase (0-based), tokens }], note, outside } or { error } */
export function parseInspiration(input, raga) {
  if (input && typeof input === 'object' && input.parsed === true && Array.isArray(input.phrases)) return input;
  let obj = input;
  if (typeof input === 'string') {
    const s = input.replace(/```(?:json)?/gi, ''), a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a < 0 || b <= a) return { error: 'no JSON object was found in the answer.' };
    try { obj = JSON.parse(s.slice(a, b + 1)); } catch (e) { return { error: 'the answer is not valid JSON (' + e.message + ').' }; }
  }
  if (!obj || typeof obj !== 'object' || !Array.isArray(obj.phrases)) return { error: 'the answer has no "phrases" list.' };
  const phrases = [];
  let outside = 0;
  for (const x of obj.phrases.slice(0, MAX_PHRASES)) {
    if (!x || typeof x !== 'object') continue;
    const k = Number(x.phrase), line = Array.isArray(x.swaras) ? x.swaras.join(' ') : x.swaras;
    if (!Number.isInteger(k) || typeof line !== 'string') continue;
    const t = parseSwaras(line, raga);
    outside += t.outside;
    phrases.push({ phrase: k - 1, tokens: t.tokens });
  }
  if (!phrases.length) return { error: 'the answer suggests no phrases the engine can read.' };
  return { parsed: true, phrases, note: typeof obj.idea === 'string' ? obj.idea.slice(0, 400) : '', outside };
}
