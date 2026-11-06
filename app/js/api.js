/* Talking to the Vocal Gym server. */
let metaPromise = null;

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  } catch (e) {
    const err = new Error('Cannot reach the Vocal Gym server. Is it still running?'); err.offline = true; throw err;
  }
  let data = null;
  try { data = await res.json(); } catch (e) { /* fall through */ }
  if (!res.ok) { const err = new Error((data && data.error) || 'The server answered ' + res.status + '.'); err.status = res.status; throw err; }
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
  render: body => request('POST', '/api/render', body),
  // v0.8.7: accounts and practice (server/auth.js, server/practice.js)
  auth: {
    me: () => request('POST', '/api/auth/me', {}),
    register: body => request('POST', '/api/auth/register', body),
    login: body => request('POST', '/api/auth/login', body),
    logout: () => request('POST', '/api/auth/logout', {})
  },
  account: {
    update: body => request('POST', '/api/account/update', body),
    password: body => request('POST', '/api/account/password', body),
    remove: body => request('POST', '/api/account/delete', body)
  },
  practice: {
    routines: () => request('POST', '/api/practice/routines', {}),
    saveRoutine: body => request('POST', '/api/practice/routines/save', body),
    deleteRoutine: id => request('POST', '/api/practice/routines/delete', { id }),
    log: body => request('POST', '/api/practice/log', body),
    logs: body => request('POST', '/api/practice/logs', body || {}),
    deleteLog: id => request('POST', '/api/practice/logs/delete', { id }),
    summary: today => request('POST', '/api/practice/summary', { today })
  },
  // v0.9.1: a singer's corrections to the repertoire, and the log of them (server/edits.js)
  repertoire: {
    edits: comp => request('POST', '/api/repertoire/edits', { comp }),
    save: body => request('POST', '/api/repertoire/edits/save', body),
    restore: body => request('POST', '/api/repertoire/edits/restore', body),
    changes: body => request('POST', '/api/repertoire/changes', body || {}),
    octaveOk: body => request('POST', '/api/repertoire/octave-ok', body),
    octaveAsk: body => request('POST', '/api/repertoire/octave-ask', body)
  }
};
