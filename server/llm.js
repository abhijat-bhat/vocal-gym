/* Vocal Gym server · asking Claude for kalpana swara inspiration (v0.8.5)
   The engine writes the prompt (E.rhythmPrompt: the raga's grammar and attested phrases, the lab's
   rhythm phrase by phrase, the landing and the creativity) and reads the answer (E.parseInspiration).
   This module only carries the prompt to Claude and the answer back, through the official SDK, which is
   loaded on first use so the server runs without it. The answer is inspiration: kalpanaRhythm fits each
   suggested line to the rhythm and the raga and sings it only where every hard rule still holds.
   Credentials: ANTHROPIC_API_KEY (or ANTHROPIC_AUTH_TOKEN) in the server's environment. Without them the
   route answers 503 and the page offers the copy-and-paste way instead. */

export const MODEL = process.env.VOCAL_GYM_MODEL || 'claude-opus-5-5';

export class Unavailable extends Error {}

let client = null, override = null;
/* tests (and other hosts) can swap the call: fn({ system, prompt, schema }) → Promise<answer text> */
export function setInspirer(fn) { override = fn || null; }
export const configured = () => !!(override || process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

async function sdk() {
  if (client) return client;
  let Anthropic;
  try { ({ default: Anthropic } = await import('@anthropic-ai/sdk')); } catch { throw new Unavailable('The Claude SDK is not installed on this server (npm install).'); }
  client = new Anthropic();
  return client;
}

/* one request: the engine's prompt, a JSON answer in the engine's schema. Server-side fallbacks are on,
   so a request Claude declines is re-run on Anthropic's recommended fallback model inside the same call. */
export async function askClaude({ system, prompt, schema }) {
  if (override) return override({ system, prompt, schema });
  if (!configured()) throw new Unavailable('Claude is not configured on this server: set ANTHROPIC_API_KEY and restart it. You can still copy the prompt to any assistant and paste its answer.');
  const c = await sdk();
  let msg;
  try {
    msg = await c.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system,
      messages: [{ role: 'user', content: prompt }],
      output_config: { effort: 'medium', format: { type: 'json_schema', schema } }
    });
  } catch (e) {
    const status = e && e.status;
    throw new Unavailable(status === 401 || status === 403 ? 'Claude refused the server’s credentials (' + status + ').' : status === 429 ? 'Claude is busy (rate limited); try again in a moment.' : 'Claude could not be reached' + (status ? ' (' + status + ')' : '') + '.');
  }
  if (msg.stop_reason === 'refusal') throw new Unavailable('Claude declined this request.');
  if (msg.stop_reason === 'max_tokens') throw new Unavailable('Claude’s answer was cut off; try again.');
  const text = (msg.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  if (!text) throw new Unavailable('Claude gave no answer.');
  return text;
}
