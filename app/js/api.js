/* Talking to the Vocal Gym server. */
let metaPromise = null;

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  } catch (e) {
    throw new Error('Cannot reach the Vocal Gym server. Is it still running?');
  }
  let data = null;
  try { data = await res.json(); } catch (e) { /* fall through */ }
  if (!res.ok) throw new Error((data && data.error) || 'The server answered ' + res.status + '.');
  return data;
}

export const api = {
  meta: () => (metaPromise = metaPromise || request('GET', '/api/meta').catch(e => { metaPromise = null; throw e; })),
  alankara: body => request('POST', '/api/alankara', body),
  kalpana: body => request('POST', '/api/kalpana', body),
  kalpanaPrompt: body => request('POST', '/api/kalpana/prompt', body),
  kalpanaInspire: body => request('POST', '/api/kalpana/inspire', body),
  jathi: body => request('POST', '/api/jathi/generate', body),
  judge: script => request('POST', '/api/jathi/judge', { script }),
  render: body => request('POST', '/api/render', body)
};
