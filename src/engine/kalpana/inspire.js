import { mod12 } from '../projection.js';
import { getProfile, getSource } from '../profiles.js';
import { dial } from '../random.js';
import { eduppuNeighbours } from './landing.js';
import { rhythmPhrases } from './rhythm.js';

/* Vocal Gym engine · a prompt for inspired kalpana swaras on a lab rhythm (v0.8.5)
   rhythmPrompt() writes out everything a language model (or a person) needs to suggest swara lines for a
   rhythm from the korvai lab: the raga's arohana and avarohana, its resting, weak and avoided swaras and
   phrases attested in data/raga-profiles.json (with their sources), the direction rule and the range,
   the tala and gati, every phrase of the rhythm beat by beat with its family (a yati, a repeat, the
   cadence), the landing, the creativity, and the answer's JSON shape (INSPIRATION_SCHEMA).
   The answer is only inspiration: kalpanaRhythm(raga, template, { inspiration }) fits each suggested line
   to its rhythm and the raga and sings it only where every hard rule still holds. Pure and browser-safe:
   calling a model is the server's job (server/llm.js), or the reader's, by copy and paste. */

export const INSPIRATION_SCHEMA = {
  type: 'object',
  properties: {
    idea: { type: 'string', description: 'One or two sentences on the musical idea of the passage.' },
    phrases: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          phrase: { type: 'integer', description: 'The phrase number, from 1.' },
          swaras: { type: 'string', description: 'One token a syllable, separated by spaces: a swara, or a comma to hold the swara before.' }
        },
        required: ['phrase', 'swaras'],
        additionalProperties: false
      }
    }
  },
  required: ['idea', 'phrases'],
  additionalProperties: false
};

const ROLE = { purvanga: 'purvanga', statement: 'cadence statement', uttaranga: 'uttaranga (cadence)', mukhra: 'mukhra', count: 'count', speed1: 'first speed', speed2: 'second speed', speed3: 'third speed' };

/* opts: { eduppuPitch | targetPitch, T } (as for kalpanaRhythm). Returns { system, prompt, schema,
   phrases } or { error } */
export function rhythmPrompt(raga, template, opts = {}) {
  const S = rhythmPhrases(template);
  if (S.error) return { error: S.error, code: 'bad-rhythm' };
  const { R, phrases: ph, families: fams } = S, profile = getProfile(raga), D = dial(opts.T == null ? 0.8 : opts.T);
  const lab = pc => (raga.labels && raga.labels[mod12(pc)]) || String(mod12(pc));
  const sw = p => lab(p) + (p >= 24 ? "''" : p >= 12 ? "'" : p < 0 ? '.' : '');
  const list = (pcs, none) => pcs && pcs.length ? pcs.map(lab).join(', ') : none;
  // the landing
  let landing;
  if (opts.eduppuPitch != null) {
    const nb = eduppuNeighbours(raga, opts.eduppuPitch);
    if (nb.error) return { error: nb.error, code: nb.code };
    const ok = [nb.lo, nb.hi].filter(p => p != null);
    if (!ok.length) return { error: 'No swara of ' + raga.name + ' steps legally into that eduppu.', code: 'no-neighbour' };
    landing = 'The song resumes on ' + sw(opts.eduppuPitch) + ' (the eduppu) right after the passage, so the last phrase must end on ' + ok.map(sw).join(' or ') + ', the swara next to it, with a swara (not a comma) on its last syllable.';
  } else if (opts.targetPitch != null) landing = 'The last phrase must end on ' + sw(opts.targetPitch) + ', with a swara (not a comma) on its last syllable.';
  else return { error: 'Give eduppuPitch or targetPitch.', code: 'no-landing' };

  // the raga
  const L = [];
  L.push('Raga: ' + raga.name + (raga.mela ? ' (melakarta ' + raga.mela + ')' : raga.parent ? ' (a janya of ' + raga.parent + ')' : '') + '.');
  L.push('Arohana: ' + raga.aro.map(sw).join(' '));
  L.push('Avarohana: ' + raga.avaro.map(sw).join(' '));
  L.push('Direction rule (hard): moving up, the next swara must be one of the arohana; moving down, one of the avarohana. Repeating a swara is always allowed.');
  if (profile) {
    L.push('Resting swaras (nyasa): ' + list(profile.nyasa, 'S and P') + '. Good landing swaras: ' + list(profile.landing, 'S and P') + '. Jiva (characteristic) swaras: ' + list(profile.jiva, 'none listed') + '.');
    L.push('Weak (alpa) swaras, touched but not dwelt on: ' + list(profile.alpa, 'none listed') + '. Do not end a phrase on: ' + list(profile.alpa.concat(profile.avoidLanding, profile.notNyasa), 'no restriction listed') + '.');
    const av = profile.avoid.filter(a => a.pitches && a.pitches.length);
    if (av.length) L.push('Phrases to avoid' + ': ' + av.map(a => a.pitches.map(sw).join(' ') + (a.strength === 'hard' ? ' (never)' : ' (rarely)')).join('; ') + '.');
    const att = profile.phrases.slice().sort((a, b) => (b.weight || 0) - (a.weight || 0)).slice(0, 8);
    if (att.length) {
      L.push('Phrases attested for ' + raga.name + ' (use them as models of its idiom, not to copy whole):');
      att.forEach(a => { const s = getSource(a.source); L.push('  - ' + a.pitches.map(sw).join(' ') + ' (' + a.type + '; ' + (s ? s.title : a.source) + ')'); });
    }
  } else L.push('No detailed profile is available: rest on S and P and keep to the scale.');
  L.push('Range: from mandra P (P.) up to tara G (G\'), mostly in the middle octave. Move mostly by step, sometimes a skip; no leap wider than a fifth inside a phrase or a sixth between phrases.');
  L.push('');
  // the rhythm
  const per = R.gati, total = R.body.length;
  L.push('Tala: ' + R.tala.name + ', ' + per + ' pulses a beat' + (R.kalai > 1 ? ', kalai ' + R.kalai : '') + '. The passage is ' + total + ' pulses long, from the korvai lab' + (R.form ? ' (a ' + R.form + (R.label ? ': ' + R.label : '') + ')' : R.label ? ' (' + R.label + ')' : '') + '.');
  L.push('Each phrase is written with its syllables (sollus); "|" marks a beat, and "~" is a pulse the lab already holds, which takes no token. Karvais between phrases are silent or held and need no swaras.');
  const famOf = fams.map(f => {
    const nums = f.members.map(k => k + 1).join(', ');
    if (f.kind === 'nested') return 'Phrases ' + nums + ' are one yati (' + f.lens.join(' → ') + ' syllables): each is the end of a longer phrase, so sing them as the ends of one line, all ending on the same swara' + (f.rounds > 1 ? '; the whole yati comes ' + f.rounds + ' times, move it to other swaras each time' : '') + '.';
    if (f.kind === 'repeat') return /^speed\d$/.test(f.role) ? 'Phrases ' + nums + ' are one phrase at three speeds: sing the same swaras each time.' : 'Phrases ' + nums + ' repeat one rhythm: a repeated rhythm is not a repeated melody. Keep the shape but start it from another swara, as an alankara does, or vary it' + (f.members.includes(ph.length - 1) ? '; the last one lands' : '') + '.';
    return null;
  });
  ph.forEach((q, k) => {
    let s = '';
    q.cells.forEach(i => { if ((R.lead + i) % per === 0) s += (s ? ' ' : '') + '|'; const c = R.body[i]; s += ' ' + (c.s && c.s !== ',' ? c.s : '~'); });
    // the gap after it
    const lastCell = q.cells[q.cells.length - 1], next = k + 1 < ph.length ? ph[k + 1].cells[0] : total;
    const gap = next - lastCell - 1;
    L.push('Phrase ' + (k + 1) + ' (' + (ROLE[q.role] || q.role) + ', ' + q.sylls.length + ' syllables, family ' + (q.fam + 1) + '):' + s.replace(/\s+/g, ' ') + (gap > 0 ? '   then a karvai of ' + gap + ' pulse' + (gap > 1 ? 's' : '') : ''));
  });
  famOf.filter(Boolean).forEach(x => L.push(x));
  L.push('');
  L.push(landing);
  L.push('Creativity ' + D.T.toFixed(1) + ' of 2: ' + (D.T < 0.6 ? 'conventional; stepwise, familiar turns of the raga, clear sequences.' : D.T < 1.3 ? 'balanced; familiar idiom with some surprises, varied repetitions.' : 'adventurous; unexpected turns, skips and contrasts, still within the raga.'));
  L.push('');
  L.push('How to write each phrase: exactly one token for each syllable, separated by spaces. A token is a swara, which starts on that syllable, or a comma, which holds the swara before it. Do not give every syllable its own swara: let lines breathe with held swaras, as singers do, keeping a swara on the first syllable of each phrase and usually on the beat. In a fast gati about half to two-thirds of the syllables carry a new swara.');
  L.push('Swaras: S R G M P D N (the variant number is optional, e.g. ' + lab(raga.aro[1]) + '); an apostrophe after a swara for the upper octave (S\'), a dot after it for the lower (P.).');
  L.push('Answer with JSON only: {"idea": "the musical idea in a sentence", "phrases": [{"phrase": 1, "swaras": "S , R G"}, ...]} with every phrase from 1 to ' + ph.length + '.');
  const system = 'You are an experienced Carnatic musician who sings kalpana swaras. You suggest swara lines for a rhythm that is already fixed, keeping strictly to the raga\'s grammar. Your lines are taken as inspiration by a rule-based engine that checks every rule, so be idiomatic and musical rather than exhaustive.';
  return { system, prompt: L.join('\n'), schema: INSPIRATION_SCHEMA, phrases: ph.length };
}
