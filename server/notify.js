/* Vocal Gym server · sending a confirmation code (v0.10)
   By email over SMTP (node:net and node:tls, no dependency), set up in the environment (see .env.example):

     SMTP_URL    smtps://user:password@smtp.example.com:465, or smtp://user:password@host:587 (upgraded with STARTTLS)
     MAIL_FROM   "Vocal Gym <practice@example.com>"; defaults to the SMTP user

   With no mail service, a server that is not in production prints the code on its console, so the sign-in can be tried
   without a mail account; in production the method is simply not offered. */
import { connect as tcpConnect } from 'node:net';
import { connect as tlsConnect } from 'node:tls';
import { hostname } from 'node:os';

const isProduction = () => process.env.NODE_ENV === 'production';
const hasEmail = () => !!process.env.SMTP_URL;

/* tests replace the transports; nothing else does */
const overrides = {};
export function setTransport(kind, fn) { if (fn) overrides[kind] = fn; else delete overrides[kind]; }

/* how a code of this kind goes out: 'provider', 'console', or null when it cannot */
export function delivery(kind) {
  if (overrides[kind]) return 'provider';
  if (kind === 'email' && hasEmail()) return 'provider';
  return isProduction() ? null : 'console';
}

const SUBJECT = 'Your Vocal Gym code';
const bodyOf = code => 'Your Vocal Gym code is ' + code + '. It lasts 10 minutes.\r\n\r\nIf you did not ask for it, you can ignore this message.\r\n';

export async function sendCode(kind, to, code) {
  if (overrides[kind]) return overrides[kind](to, code);
  if (kind === 'email' && hasEmail()) return sendMail(process.env.SMTP_URL, process.env.MAIL_FROM, to, SUBJECT, bodyOf(code));
  if (!isProduction()) { console.log('[sign-in] No ' + kind + ' service is set up, so here is the code for ' + to + ': ' + code); return; }
  throw new Error('No ' + kind + ' service is set up.');
}

/* ---- SMTP ---- */
/* the socket's replies, one at a time, however many lines each has */
function replies(socket) {
  let buf = '';
  const waiting = [], ready = [];
  const onData = d => {
    buf += d.toString('utf8');
    let m;
    while ((m = /^(\d{3}) .*\r?\n/m.exec(buf))) {
      const end = m.index + m[0].length, r = { code: +m[1], text: buf.slice(0, end) };
      buf = buf.slice(end);
      if (waiting.length) waiting.shift()(r); else ready.push(r);
    }
  };
  socket.on('data', onData);
  return { next: () => (ready.length ? Promise.resolve(ready.shift()) : new Promise(res => waiting.push(res))), stop: () => socket.off('data', onData) };
}
const addressOf = s => { const m = /<([^<>\s]+)>/.exec(s); return m ? m[1] : String(s).trim(); };
const clean = s => String(s).replace(/[\r\n]+/g, ' ').trim();

/* url: smtps:// from the first byte, smtp:// upgraded with STARTTLS. ?tls=off is only for a server on this machine. */
export async function sendMail(url, from, to, subject, body) {
  const u = new URL(url), implicit = u.protocol === 'smtps:', plain = u.searchParams.get('tls') === 'off';
  if (plain && !['localhost', '127.0.0.1', '[::1]'].includes(u.hostname)) throw new Error('SMTP without TLS is only allowed on this machine.');
  const port = +u.port || (implicit ? 465 : 587), host = u.hostname, user = decodeURIComponent(u.username), pass = decodeURIComponent(u.password);
  const sender = clean(from || user), envelope = addressOf(sender);
  if (!envelope) throw new Error('Set MAIL_FROM, or a user in SMTP_URL.');
  const failed = reject => e => reject(e);
  let socket = await new Promise((res, rej) => {
    const s = implicit ? tlsConnect({ host, port, servername: host }, () => res(s)) : tcpConnect({ host, port }, () => res(s));
    s.once('error', failed(rej));
  });
  const limit = s => s.setTimeout(20000, () => s.destroy(new Error('The mail server did not answer in time.')));
  limit(socket);
  try {
    let r = replies(socket);
    const lost = new Promise((_, rej) => socket.once('close', () => rej(new Error('The mail server closed the connection.'))));
    const ask = async (line, ok) => {
      if (line != null) socket.write(line + '\r\n');
      const a = await Promise.race([r.next(), lost]);
      if (!ok.includes(a.code)) throw new Error('The mail server refused ' + (line ? line.split(' ')[0] : 'the connection') + ': ' + a.code);
      return a;
    };
    await ask(null, [220]);
    const me = 'EHLO ' + (hostname().replace(/[^a-z0-9.-]/gi, '') || 'vocal-gym');
    const hello = await ask(me, [250]);
    if (!implicit && !plain) {
      if (!/STARTTLS/i.test(hello.text)) throw new Error('The mail server does not offer STARTTLS.');
      await ask('STARTTLS', [220]);
      r.stop();
      socket = await new Promise((res, rej) => { const t = tlsConnect({ socket, servername: host }, () => res(t)); t.once('error', failed(rej)); });
      limit(socket);
      r = replies(socket);
      await ask(me, [250]);
    }
    if (user) await ask('AUTH PLAIN ' + Buffer.from('\0' + user + '\0' + pass).toString('base64'), [235]);
    await ask('MAIL FROM:<' + envelope + '>', [250]);
    await ask('RCPT TO:<' + to + '>', [250, 251]);
    await ask('DATA', [354]);
    const message = ['From: ' + sender, 'To: <' + to + '>', 'Subject: ' + clean(subject), 'Date: ' + new Date().toUTCString(), 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=utf-8', 'Content-Transfer-Encoding: 8bit', '', body].join('\r\n');
    socket.write(message.replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..') + '\r\n.\r\n');
    await ask(null, [250]);
    socket.write('QUIT\r\n');
  } finally {
    socket.removeAllListeners('close');
    socket.on('error', () => { /* it is going away */ });
    socket.end();
  }
}

