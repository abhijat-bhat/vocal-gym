/* v0.10 signing in with Google, or with an email and a code (server/signin.js, server/notify.js), over HTTP
   against a fresh database file. Mail and Google are stood in for; nothing leaves this machine. */
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer as tcpServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'vg-signin-'));
process.env.VG_DB = join(dir, 'test.db');
const { createApp } = await import('../server/app.js');
const { normalEmail, resetSignin } = await import('../server/signin.js');
const { setTransport, sendMail } = await import('../server/notify.js');
const { getDb } = await import('../server/db.js');

let server, base;
const inbox = [];
before(async () => {
  server = createApp(); await new Promise(r => server.listen(0, '127.0.0.1', r)); base = 'http://127.0.0.1:' + server.address().port;
  setTransport('email', async (to, code) => { inbox.push({ to, code }); });
});
after(() => { setTransport('email'); server.close(); try { rmSync(dir, { recursive: true, force: true }); } catch (e) { /* Windows may hold the file */ } });
beforeEach(() => { resetSignin(); });

const realFetch = globalThis.fetch;
function client() {
  const jar = {};
  const take = r => (r.headers.getSetCookie ? r.headers.getSetCookie() : []).forEach(c => { const m = /^([^=]+)=([^;]*)/.exec(c); if (m) { if (m[2]) jar[m[1]] = m[2]; else delete jar[m[1]]; } });
  const cookie = () => Object.entries(jar).map(([k, v]) => k + '=' + v).join('; ');
  const post = async (path, body) => { const r = await realFetch(base + path, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, cookie() ? { Cookie: cookie() } : {}), body: JSON.stringify(body || {}) }); take(r); return { status: r.status, body: await r.json() }; };
  const visit = async path => { const r = await realFetch(base + path, { redirect: 'manual', headers: cookie() ? { Cookie: cookie() } : {} }); take(r); return { status: r.status, location: r.headers.get('location') }; };
  return { post, visit, jar };
}
const lastCode = to => inbox.filter(m => m.to === to).pop().code;
/* a code's cooldown, without waiting half a minute */
const age = async (kind, value) => { (await getDb()).prepare('UPDATE login_codes SET created_at = ? WHERE kind = ? AND value = ?').run(new Date(Date.now() - 40 * 1000).toISOString(), kind, value); };
const signIn = async (c, kind, value, name) => {
  const asked = await c.post('/api/auth/code', { kind, value });
  assert.equal(asked.status, 200, JSON.stringify(asked.body));
  return c.post('/api/auth/code/check', { kind, value, code: lastCode(asked.body.value), displayName: name });
};

test('addresses are normalised, and refused in words', () => {
  assert.equal(normalEmail('  Asha@Example.COM '), 'asha@example.com');
  assert.throws(() => normalEmail('asha'), /email address/);
  assert.throws(() => normalEmail('a b@example.com'), /email address/);
  assert.throws(() => normalEmail('a@b.c\r\nBcc: x@y.z'), /email address/);
});

test('a code signs in by email: a new account the first time, the same one after', async () => {
  const c = client(), asked = await c.post('/api/auth/code', { kind: 'email', value: 'Asha@Example.com' });
  assert.equal(asked.status, 200);
  assert.equal(asked.body.value, 'asha@example.com');
  assert.match(asked.body.to, /^as•••@example\.com$/);
  assert.equal(asked.body.devCode, undefined, 'never in the answer unless asked for');
  assert.equal(asked.body.expiresIn, 600);
  const code = lastCode('asha@example.com');
  assert.match(code, /^\d{6}$/);
  // only a salted hash is kept
  const row = (await getDb()).prepare("SELECT * FROM login_codes WHERE value = 'asha@example.com'").get();
  assert.ok(!JSON.stringify(row).includes(code));
  const done = await c.post('/api/auth/code/check', { kind: 'email', value: 'asha@example.com', code, displayName: 'Asha' });
  assert.equal(done.status, 200, JSON.stringify(done.body));
  assert.equal(done.body.created, true); assert.equal(done.body.user.displayName, 'Asha'); assert.equal(done.body.user.hasPassword, false);
  assert.equal((await c.post('/api/auth/me')).body.user.username, done.body.user.username);
  // used once
  assert.equal((await c.post('/api/auth/code/check', { kind: 'email', value: 'asha@example.com', code })).status, 401);
  // back again, from another device: the same account
  const d = client(); await age('email', 'asha@example.com');
  const again = await signIn(d, 'email', 'asha@example.com');
  assert.equal(again.body.created, false); assert.equal(again.body.user.username, done.body.user.username); assert.equal(again.body.user.displayName, 'Asha');
});

test('a phone number is not a way in', async () => {
  const c = client(), r = await c.post('/api/auth/code', { kind: 'phone', value: '+919876511111' });
  assert.equal(r.status, 400); assert.match(r.body.error, /Google or an email/);
  assert.equal((await c.post('/api/auth/code/check', { kind: 'phone', value: '+919876511111', code: '123456' })).status, 400);
  assert.equal('phone' in await (await realFetch(base + '/api/auth/methods')).json(), false);
});

test('wrong, stale and over-tried codes are refused; a new code replaces the old', async () => {
  const c = client(), value = 'tries@example.com';
  await c.post('/api/auth/code', { kind: 'email', value });
  const code = lastCode(value), wrong = code === '000000' ? '000001' : '000000';
  assert.equal((await c.post('/api/auth/code/check', { kind: 'email', value, code: '12' })).status, 400);
  for (let i = 0; i < 5; i++) assert.equal((await c.post('/api/auth/code/check', { kind: 'email', value, code: wrong })).status, 401);
  assert.equal((await c.post('/api/auth/code/check', { kind: 'email', value, code })).status, 401, 'the right code is dead after five wrong tries');
  // expired
  await age('email', value);
  await c.post('/api/auth/code', { kind: 'email', value });
  (await getDb()).prepare("UPDATE login_codes SET expires_at = '2000-01-01T00:00:00.000Z' WHERE value = ? AND consumed = 0").run(value);
  assert.equal((await c.post('/api/auth/code/check', { kind: 'email', value, code: lastCode(value) })).status, 401);
  // a new code stops the older one
  await age('email', value);
  await c.post('/api/auth/code', { kind: 'email', value }); const first = lastCode(value);
  await age('email', value);
  await c.post('/api/auth/code', { kind: 'email', value }); const second = lastCode(value);
  if (first !== second) assert.equal((await c.post('/api/auth/code/check', { kind: 'email', value, code: first })).status, 401);
  assert.equal((await c.post('/api/auth/code/check', { kind: 'email', value, code: second })).status, 200);
});

test('asking for codes is limited, and a failed send is said plainly', async () => {
  const c = client(), value = 'limit@example.com';
  assert.equal((await c.post('/api/auth/code', { kind: 'email', value })).status, 200);
  const soon = await c.post('/api/auth/code', { kind: 'email', value });
  assert.equal(soon.status, 429); assert.match(soon.body.error, /half a minute/);
  for (let i = 0; i < 4; i++) { await age('email', value); assert.equal((await c.post('/api/auth/code', { kind: 'email', value })).status, 200, 'code ' + (i + 2)); }
  await age('email', value);
  const many = await c.post('/api/auth/code', { kind: 'email', value });
  assert.equal(many.status, 429); assert.match(many.body.error, /hour/);
  // per network address
  resetSignin();
  let last;
  for (let i = 0; i < 21; i++) last = await c.post('/api/auth/code', { kind: 'email', value: 'n' + i + '@example.com' });
  assert.equal(last.status, 429); assert.match(last.body.error, /network/);
  resetSignin();
  setTransport('email', async () => { throw new Error('boom'); });
  const off = await c.post('/api/auth/code', { kind: 'email', value: 'down@example.com' });
  setTransport('email', async (to, code) => { inbox.push({ to, code }); });
  assert.equal(off.status, 503); assert.match(off.body.error, /could not be sent/); assert.ok(!/boom/.test(off.body.error));
});

test('an account can add ways in, and can never lose its last one', async () => {
  const a = client(), first = await signIn(a, 'email', 'ways@example.com', 'Ways');
  let list = await a.post('/api/account/identities');
  assert.deepEqual(list.body.identities.map(x => x.kind), ['email']); assert.equal(list.body.hasPassword, false);
  const only = await a.post('/api/account/identities/remove', { kind: 'email', id: 'ways@example.com' });
  assert.equal(only.status, 400); assert.match(only.body.error, /only way in/);
  // add another email by confirming it
  await a.post('/api/auth/code', { kind: 'email', value: 'ways2@example.com' });
  const linked = await a.post('/api/auth/code/check', { kind: 'email', value: 'ways2@example.com', code: lastCode('ways2@example.com') });
  assert.equal(linked.body.linked, true); assert.equal(linked.body.identities.length, 2);
  // it now signs in to the same account
  const b = client(); await age('email', 'ways2@example.com');
  const viaSecond = await signIn(b, 'email', 'ways2@example.com');
  assert.equal(viaSecond.body.user.username, first.body.user.username);
  // someone else's address cannot be taken
  const c = client(); await signIn(c, 'email', 'other@example.com');
  await age('email', 'ways@example.com');
  await c.post('/api/auth/code', { kind: 'email', value: 'ways@example.com' });
  const taken = await c.post('/api/auth/code/check', { kind: 'email', value: 'ways@example.com', code: lastCode('ways@example.com') });
  assert.equal(taken.status, 400); assert.match(taken.body.error, /another account/);
  assert.equal((await a.post('/api/account/identities/remove', { kind: 'email', id: 'ways2@example.com' })).status, 200);
  assert.equal((await a.post('/api/account/identities/remove', { kind: 'email', id: 'ways2@example.com' })).status, 400);
});

test('an account with no password can set one, and is deleted by typing its username', async () => {
  const a = client(), me = (await signIn(a, 'email', 'nopass@example.com')).body.user;
  assert.equal((await a.post('/api/account/password', { password: 'sa ri ga ma pa 1' })).status, 200);
  const b = client();
  assert.equal((await b.post('/api/auth/login', { username: me.username, password: 'sa ri ga ma pa 1' })).status, 200);
  // and now a current password is needed
  assert.equal((await a.post('/api/account/password', { password: 'pa da ni sa 123' })).status, 401);
  const c = client(), other = (await signIn(c, 'email', 'freed@example.com')).body.user;
  assert.equal((await c.post('/api/account/delete', { confirm: 'wrong' })).status, 401);
  assert.equal((await c.post('/api/account/delete', { confirm: other.username })).status, 200);
  assert.equal((await getDb()).prepare("SELECT COUNT(*) AS n FROM identities WHERE value = 'freed@example.com'").get().n, 0);
  // an address freed can be used again, as a new account
  const d = client(); await age('email', 'freed@example.com');
  assert.equal((await signIn(d, 'email', 'freed@example.com')).body.created, true);
  // an account with no password cannot be logged into with an empty one
  assert.equal((await client().post('/api/auth/login', { username: other.username, password: '' })).status, 401);
});

test('methods: a code on the console outside production; not offered in production', async () => {
  setTransport('email');
  const c = client();
  let m = await (await realFetch(base + '/api/auth/methods')).json();
  assert.deepEqual(m, { google: false, email: true, consoleCodes: { email: true } });
  const log = console.log; const said = [];
  console.log = (...a) => said.push(a.join(' '));
  const asked = await c.post('/api/auth/code', { kind: 'email', value: 'console@example.com' });
  console.log = log;
  assert.equal(asked.body.onConsole, true); assert.match(said.join('\n'), /console@example\.com: \d{6}/);
  process.env.NODE_ENV = 'production';
  m = await (await realFetch(base + '/api/auth/methods')).json();
  assert.deepEqual(m, { google: false, email: false, consoleCodes: { email: false } });
  const refused = await c.post('/api/auth/code', { kind: 'email', value: 'noservice@example.com' });
  assert.equal(refused.status, 400); assert.match(refused.body.error, /not set up/);
  // the test hook is dead in production
  process.env.VG_AUTH_DEV = '1'; setTransport('email', async () => {});
  const hook = await c.post('/api/auth/code', { kind: 'email', value: 'prod@example.com' });
  assert.equal(hook.body.devCode, undefined);
  delete process.env.NODE_ENV;
  await age('email', 'prod@example.com');
  assert.match((await c.post('/api/auth/code', { kind: 'email', value: 'prod@example.com' })).body.devCode, /^\d{6}$/);
  delete process.env.VG_AUTH_DEV;
  setTransport('email', async (to, code) => { inbox.push({ to, code }); });
});

test('Google: the round trip, and everything it refuses', async () => {
  const c = client();
  assert.match((await c.visit('/api/auth/google/start')).location, /google-off/, 'not set up');
  process.env.GOOGLE_CLIENT_ID = 'client-1'; process.env.GOOGLE_CLIENT_SECRET = 'secret-1';
  const token = claims => ({ id_token: ['h', Buffer.from(JSON.stringify(claims)).toString('base64url'), 's'].join('.') });
  let reply, sentTo = null;
  globalThis.fetch = async (url, o) => {
    if (String(url).startsWith('https://oauth2.googleapis.com/')) { sentTo = o.body; return new Response(JSON.stringify(reply), { status: 200 }); }
    return realFetch(url, o);
  };
  try {
    const go = async (who, claims, over) => {
      const s = await who.visit('/api/auth/google/start'), u = new URL(s.location), state = u.searchParams.get('state'), nonce = u.searchParams.get('nonce');
      assert.equal(u.origin, 'https://accounts.google.com');
      assert.equal(u.searchParams.get('client_id'), 'client-1'); assert.equal(u.searchParams.get('code_challenge_method'), 'S256');
      assert.ok(u.searchParams.get('redirect_uri').endsWith('/api/auth/google/callback'));
      reply = token(Object.assign({ iss: 'https://accounts.google.com', aud: 'client-1', exp: Math.floor(Date.now() / 1000) + 600, nonce }, claims));
      return who.visit('/api/auth/google/callback?code=abc&state=' + (over || state));
    };
    // first time: a new account, its name and email from Google
    const a = client(), first = await go(a, { sub: 'g-1', email: 'Meera@Example.com', email_verified: true, name: 'Meera' });
    assert.equal(first.status, 302); assert.equal(first.location, '/#/practice');
    assert.equal(sentTo.get('code_verifier').length > 40, true); assert.equal(sentTo.get('client_secret'), 'secret-1');
    const me = (await a.post('/api/auth/me')).body.user;
    assert.equal(me.displayName, 'Meera'); assert.equal(me.hasPassword, false);
    assert.equal(a.jar.vg_oauth, undefined, 'the round-trip cookie is cleared');
    // again: the same account
    const b = client(); await go(b, { sub: 'g-1', email: 'meera@example.com', email_verified: true, name: 'Other' });
    assert.equal((await b.post('/api/auth/me')).body.user.username, me.username);
    // the email it vouches for now signs in to the same account
    const byCode = client();
    assert.equal((await signIn(byCode, 'email', 'meera@example.com')).body.user.username, me.username);
    // Google vouching for an address already confirmed here joins that account; an unverified one does not
    const e = client(), viaCode = (await signIn(e, 'email', 'joined@example.com')).body.user;
    const j = client(); await go(j, { sub: 'g-2', email: 'joined@example.com', email_verified: true });
    assert.equal((await j.post('/api/auth/me')).body.user.username, viaCode.username);
    const k = client(); await go(k, { sub: 'g-3', email: 'joined@example.com', email_verified: false });
    assert.notEqual((await k.post('/api/auth/me')).body.user.username, viaCode.username);
    // logged in, it adds Google to the account
    const l = client(); await signIn(l, 'email', 'adds.google@example.com');
    assert.match((await go(l, { sub: 'g-4' })).location, /google-added/);
    assert.ok((await l.post('/api/account/identities')).body.identities.some(x => x.kind === 'google'));
    assert.match((await go(l, { sub: 'g-1' })).location, /other-account/);
    // refused: a forged state, the wrong audience, a stale token, the wrong nonce, the wrong issuer, a cancelled consent
    for (const [claims, over] of [[{ sub: 'x' }, 'forged'], [{ sub: 'x', aud: 'other' }], [{ sub: 'x', exp: 1 }], [{ sub: 'x', nonce: 'other' }], [{ sub: 'x', iss: 'https://evil.example.com' }], [{}]]) {
      const m = client(), r = await go(m, claims, over);
      assert.match(r.location, /google-failed/, JSON.stringify(claims));
      assert.equal((await m.post('/api/auth/me')).body.user, null);
    }
    const n = client(); await n.visit('/api/auth/google/start');
    assert.match((await n.visit('/api/auth/google/callback?error=access_denied')).location, /google-failed\/cancelled/);
    assert.match((await client().visit('/api/auth/google/callback?code=abc&state=x')).location, /google-failed\/expired/, 'no cookie, no login');
  } finally {
    globalThis.fetch = realFetch; delete process.env.GOOGLE_CLIENT_ID; delete process.env.GOOGLE_CLIENT_SECRET;
  }
});

test('SMTP: the conversation, with a dot stuffed and the password sent only as asked', async () => {
  const lines = [];
  const smtp = tcpServer(s => {
    let inData = false, buf = '';
    s.write('220 test ESMTP\r\n');
    s.on('data', d => {
      buf += d;
      let i;
      while ((i = buf.indexOf('\r\n')) >= 0) {
        const line = buf.slice(0, i); buf = buf.slice(i + 2); lines.push(line);
        if (inData) { if (line === '.') { inData = false; s.write('250 queued\r\n'); } continue; }
        if (line.startsWith('EHLO')) s.write('250-test\r\n250 AUTH PLAIN\r\n');
        else if (line.startsWith('AUTH')) s.write('235 ok\r\n');
        else if (line === 'DATA') { inData = true; s.write('354 go\r\n'); }
        else if (line === 'QUIT') { s.write('221 bye\r\n'); s.end(); }
        else s.write('250 ok\r\n');
      }
    });
  });
  await new Promise(r => smtp.listen(0, '127.0.0.1', r));
  const port = smtp.address().port;
  await sendMail('smtp://me%40x.com:p%40ss@127.0.0.1:' + port + '?tls=off', 'Vocal Gym <me@x.com>', 'to@example.com', 'Your code\r\nBcc: evil@example.com', 'Line\r\n.dot first\r\n');
  smtp.close();
  assert.ok(lines.includes('MAIL FROM:<me@x.com>')); assert.ok(lines.includes('RCPT TO:<to@example.com>'));
  assert.ok(lines.includes('..dot first'), 'a leading dot is stuffed');
  assert.ok(lines.some(l => l === 'Subject: Your code Bcc: evil@example.com'), 'a header cannot be smuggled in');
  assert.equal(Buffer.from(lines.find(l => l.startsWith('AUTH PLAIN ')).slice(11), 'base64').toString(), '\0me@x.com\0p@ss');
  await assert.rejects(sendMail('smtp://a:b@example.com:25?tls=off', 'x@y.z', 'to@example.com', 's', 'b'), /only allowed on this machine/);
});

