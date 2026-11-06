/* Shared helpers for the test suite. Each test counts its checks and fails with the first
   twenty messages, so one run can verify hundreds of thousands of properties. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as E from '../src/engine/index.js';

export { E };
export const R = E.allRagas();
export const ALL = R.melakartas.concat(R.janyas);
export const FAMS = Object.keys(E.FAM);
export const JATIS = [3, 4, 5, 7, 9];
/* ragas whose phrases come only from the repertoire's notation (scripts/mine-repertoire-phrases.js) */
export const MINED = new Set(Object.values(JSON.parse(readFileSync(new URL('../data/raga-profiles.json', import.meta.url), 'utf8')).ragas).filter(r => r.phrases.some(p => p.mined)).map(r => r.id));

export function checker(t) {
  const st = { checks: 0, fails: [] };
  const ok = (cond, msg) => { st.checks++; if (!cond) st.fails.push(msg); };
  const done = () => {
    t.diagnostic(st.checks.toLocaleString('en-US') + ' checks');
    assert.equal(st.fails.length, 0, st.fails.length + ' failed checks:\n' + st.fails.slice(0, 20).join('\n'));
  };
  return { ok, done };
}

/* Plain-text swara labels: S' for tara, S. for mandra. */
export const lab = (raga, p) => { const pc = E.mod12(p), o = Math.floor(p / 12); const l = raga.labels[pc][0]; return o > 0 ? l + "'" : o < 0 ? l + '.' : l; };
export const render = (raga, line) => line.notes.map(n => lab(raga, n.p) + (n.dur > 1 ? ' ,'.repeat(n.dur - 1) : '')).join(' ');
export const stripBars = s => s.replace(/\s*\|\|?\s*/g, ' ').trim().replace(/\s+/g, ' ');
