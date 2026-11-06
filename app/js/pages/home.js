/* Home (v0.10): the threshold. A tala's beats are the dots of a kolam and the music draws the line, so the first thing here
   is the product's real promise, working: press Play and watch the line close on sam. A student who is logged in finds
   today's practice on the stone at the foot of the floor instead, with one Start. Below: what a day looks like, the
   rooms of the app, and plainly what is and is not built. */
import { api } from '../api.js';
import { toggle, pitchedJob, stop, initPlayButton } from '../audio.js';
import { esc, term, notation, $ } from '../ui.js';
import { liveKolam, kolamSvg, bleedKolam, dayDots, daySeed } from '../kolam-view.js';
import { getUser, refreshUser, userKnown, onUser, getRun, startRun, localDate, routeOf, KIND } from '../session.js';

const ROOMS = [
  ['#/alankara', 'Alankaras', 'The classic patterns in all 35 talas and 86 ragas, starting from the traditional sheet.'],
  ['#/kalpana', 'Kalpana swaras', 'Model improvised rounds that fit the beat and land where you choose, from recognisable to adventurous.'],
  ['#/repertoire', 'Repertoire', 'Over 1,500 compositions on the tala grid, each sung with its gamaka. Correct a line, and your copy keeps it.'],
  ['#/korvai', 'Korvai lab', 'How moras, tihais and korvais are counted to land, in fifteen short lessons, then a builder.'],
  ['#/melakarta', 'Melakartas', 'The 72 parent ragas as a system, and how the katapayadi rule hides the number in the name.'],
  ['#/judge', 'Jathi judge', 'Write a jathi and have its arithmetic checked exactly, with the fix for any line that fails.']
];
const minutes = r => r.items.reduce((s, it) => s + it.minutes, 0);

export async function mount(root) {
  root.innerHTML = '<section class="th"><div class="th-kolam" id="th-kolam"></div><div class="th-floor"><div class="th-copy">' +
      '<h1 id="th-h">The daily practice room for Carnatic singers.</h1>' +
      '<p class="th-lead" id="th-p">The dots are the beats of the ' + term('tala') + '. The music draws one line around them, and when a phrase lands, the line closes on ' + term('sam') + '.<span class="th-more"> Practise ' + term('alankara', 'alankaras') + ', ' + term('kalpana', 'kalpana swaras') + ' and your ' + term('raga') + ' repertoire here, and keep a log of each day.</span></p>' +
    '</div></div><div class="slab th-slab" id="th-slab"></div></section>' +
    '<div class="tiles" aria-hidden="true"></div>' +

    '<div class="wrap"><section class="day-way"><h2>What a day of practice looks like</h2><ol class="day-steps">' +
      '<li><b>Pick a routine</b><span>Start from a ready one, or write your own around what your teacher gave you this week.</span></li>' +
      '<li><b>Sing with the tools</b><span>The timer runs across every tool. A drone holds Sa, clicks keep the tala, and the line follows the music.</span></li>' +
      '<li><b>Move on, then finish</b><span>Next takes you to the following item. Finish lets you note what to work on tomorrow.</span></li>' +
      '<li><b>Leave a kolam</b><span>Each day you log leaves a kolam on your floor, larger the longer you sang.</span></li>' +
    '</ol></section>' +

    '<section class="rooms"><h2>The rooms</h2><div class="reg">' + ROOMS.map(([href, name, text]) => '<a class="reg-row" href="' + href + '"><b>' + esc(name) + '</b><span>' + esc(text) + '</span></a>').join('') + '</div></section>' +

    '<section class="truth"><div><h2>Working today</h2><ul>' +
      '<li>Every generated exercise keeps the raga’s direction rules and fills its tala exactly. Phrase grammar and gamaka are not checked yet.</li>' +
      '<li>86 ragas: all 72 melakartas and 14 janyas. 35 talas, and the chapu talas in the jathi tools.</li>' +
      '<li>New patterns avoid what you have already seen on this visit.</li>' +
      '<li>Routines with timers, a session log, a daily goal and a streak.</li>' +
      '<li>Install it as an app. The repertoire and your log work offline; new exercises need a connection.</li>' +
    '</ul></div><div><h2>Not built yet</h2><ul>' +
      '<li>Listening to your voice through the microphone.</li><li>Pitch tracking, and spotting where you leave the raga.</li><li>A daily voice check and a personal warm-up plan.</li><li>A kalpana tutor that responds to what you sing.</li>' +
    '</ul><p>Today, Vocal Gym plays to you; it does not listen.</p></div></section></div>';

  const stage = $('#th-kolam', root), th = $('.th', root);
  // the floor in three dimensions, over the drawn figure, which stays beneath for anyone it cannot reach
  let scene = null, figure = [8, 3, { mode: 'live' }];
  const lay = (n, seed, o) => { figure = [n, seed, o]; if (scene) scene.show(n, seed, o); };
  let offKolam = () => {};
  const liveHero = () => { offKolam(); offKolam = liveKolam(stage, 8, { seed: 3, label: 'A kolam of eight dots, one for each beat of Adi tala. The line closes on the first beat.', cls: 'th-k' }); fit(); };
  const fit = () => { if (stage.firstElementChild) bleedKolam(stage.firstElementChild); };
  import('../threshold3d.js').then(m => {
    if (!alive) return;
    scene = m.mountThreshold({ th, stage, slab, copy: $('.th-copy', root), onFail: () => { scene = null; } });
    if (scene) scene.show(...figure);
  }).catch(() => { /* the drawn figure stays */ });
  const wider = matchMedia('(min-width:981px)');
  wider.addEventListener('change', fit);
  liveHero();
  let alive = true;
  const slab = $('#th-slab', root);

  // anyone: the sample, working
  const sample = async () => {
    $('#th-h', root).innerHTML = pitch.h; $('#th-p', root).innerHTML = pitch.p;
    th.classList.remove('today'); liveHero(); lay(8, 3, { mode: 'live' });
    slab.innerHTML = '<div class="slab-in th-sample"><div class="th-say"><b>Press Play and watch the line</b><span>The first alankara in Adi tala, Mayamalavagowla</span></div>' +
      '<button class="btn primary big play" id="hd-play"></button><div class="notation-wrap" id="hd-n"><p class="muted">Loading a sample…</p></div>' +
      '<a class="btn th-next" href="#/account">Sign in to keep a log</a></div>';
    initPlayButton($('#hd-play', slab));
    try {
      const r = await api.alankara({ raga: 'mela15', fam: 'triputa', L: 4 });
      if (!alive || !$('#hd-n', slab)) return;
      const lines = r.lines.slice(0, 1), slots = [], notes = [];
      lines.forEach(l => l.notes.forEach(n => { slots.push({ t: n.t, title: n.name }); for (let i = 1; i < n.dur; i++) slots.push({ t: ',', cls: 'hold' }); notes.push({ p: n.p, slots: n.dur }); }));
      $('#hd-n', slab).innerHTML = notation(slots, r.tala, 1, { rowLabel: i => ({ text: '↑ ' + (i + 1), cls: 'up' }) });
      const starts = new Set(r.tala.angas.map(a => a.start));
      const job = pitchedJob($('#hd-n', slab), notes, 1, r.tala.total, starts, { raga: r.raga.id, gamaka: 0 });
      $('#hd-play', slab).onclick = () => toggle($('#hd-play', slab), job);
    } catch (e) { const n = $('#hd-n', slab); if (n) n.innerHTML = '<p class="muted">' + esc(e.message) + '</p>'; }
  };

  const pitch = { h: $('#th-h', root).innerHTML, p: $('#th-p', root).innerHTML };
  // a student who has come back: today, on the stone, and no pitch to read first
  const today = async () => {
    const u = getUser(), run = getRun();
    th.classList.add('today');
    $('#th-h', root).textContent = 'Your floor is ready, ' + u.displayName + '.';
    $('#th-p', root).textContent = '';
    slab.innerHTML = '<div class="slab-in"><p class="muted">Finding today’s practice…</p></div>';
    try {
      const [S, R, L] = await Promise.all([api.practice.summary(localDate()), api.practice.routines(), api.practice.logs({ limit: 1 })]);
      if (!alive) return;
      const all = R.routines.concat(R.starters), last = L.logs[0];
      const next = (last && all.find(r => r.id === last.routineId || r.name === last.routineName)) || all[0];
      const st = S.streak, streak = st.current ? st.current + '-day streak' + (st.today ? '' : ', practise today to keep it') : 'A new floor today';
      let action;
      if (run && !run.finished) { const to = routeOf(run.items[run.index]); action = '<a class="btn primary big" href="' + (to || '#/practice') + '">Back to ' + esc(run.items[run.index].title) + '</a>'; }
      else if (run) action = '<a class="btn primary big" href="#/practice/finish">Save your session</a>';
      else action = '<button class="btn primary big" id="th-start">Start ' + esc(next.name) + '</button>';
      // today's kolam: the dots are waiting until you sing; then the line grows with the minutes
      offKolam(); offKolam = () => {};
      stage.innerHTML = S.todayMinutes
        ? kolamSvg(dayDots(S.todayMinutes), { seed: daySeed(localDate()), cls: 'today-k' + (S.goalMet ? ' met' : ''), label: 'Today’s kolam, from ' + S.todayMinutes + ' minutes of practice' })
        : kolamSvg(8, { seed: daySeed(localDate()), cls: 'today-k undrawn', label: 'Eight dots on the floor, waiting for today’s line' });
      fit();
      lay(S.todayMinutes ? dayDots(S.todayMinutes) : 8, daySeed(localDate()), { mode: S.todayMinutes ? 'laid' : 'dots', met: S.goalMet });
      $('#th-p', root).textContent = last && last.notes ? 'Your note from last time: ' + last.notes : S.todayMinutes ? 'Today’s line grows as you sing.' : 'The floor is swept. Today’s line starts when you sing.';
      slab.innerHTML = '<div class="slab-in th-today">' +
        '<div class="th-say"><b>Today, ' + esc(u.displayName) + ': ' + S.todayMinutes + ' of ' + S.goal + ' minutes</b><span>' + esc(streak) + (S.goalMet ? '. Daily goal met.' : '') + '</span>' +
        '<span>' + esc(next.name) + ' · ' + minutes(next) + ' min · ' + next.items.map(it => esc((KIND[it.kind] || KIND.free).label)).join(', ') + '</span></div>' +
        '<div class="th-acts">' + action + '<a class="btn" href="#/practice">All routines</a></div></div>';
      const go = $('#th-start', slab);
      if (go) go.onclick = () => startRun(next);
    } catch (e) { if (e.status === 401) return refreshUser(); sample(); }
  };

  const draw = () => { if (alive) { stop(); (getUser() ? today : sample)(); } };
  if (!userKnown()) await refreshUser();
  const offUser = onUser(draw);
  draw();
  return () => { alive = false; stop(); offKolam(); offUser(); wider.removeEventListener('change', fit); if (scene) scene.dispose(); };
}
