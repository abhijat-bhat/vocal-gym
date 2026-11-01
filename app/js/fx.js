/* The app's motion layer (v0.8.8): depth and movement, written by hand (no library, nothing to download).
     soundField(canvas)  a live 3D "sound field": a mesh of travelling waves seen in perspective, in the app's
                         saffron, violet and teal, that swells under the pointer. It pauses when off screen or
                         in a hidden tab, scales to the screen's pixel density, and draws one still frame for
                         people who ask their system for less motion.
     initFx()            card tilt (elements with data-tilt lean toward the pointer, with a moving glare),
                         reveals (cards, sections and headings rise into place as they scroll into view, a
                         little after one another), and the entrance of each page. Watches #main, so pages
                         need do nothing but render.
   Everything respects prefers-reduced-motion and is skipped on touch screens where it would not help. */
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---- the 3D sound field ---- */
export function soundField(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const COLS = 72, ROWS = 30, DEPTH = 26, WIDTH = 34;
  let w = 0, h = 0, dpr = 1, raf = 0, visible = true, t0 = performance.now(), colors = null;
  const ptr = { x: 0.5, y: 0.6, tx: 0.5, ty: 0.6, energy: 0, te: 0 };
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const rgb = hex => { const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex); return m ? [1, 2, 3].map(i => parseInt(m[i], 16)) : [242, 169, 59]; };
  const readColors = () => { colors = { near: rgb(css('--saffron')), mid: rgb(css('--violet')), far: rgb(css('--teal')), light: css('color-scheme').includes('light') }; };
  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1); w = Math.max(1, r.width); h = Math.max(1, r.height);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  }
  const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  function height(x, z, t) {
    // travelling waves (a drone and its overtones), and a swell under the pointer
    const px = (ptr.x - 0.5) * WIDTH, pz = 4 + (1 - ptr.y) * DEPTH * 0.7;
    const d = Math.hypot(x - px, (z - pz) * 0.8);
    return 0.9 * Math.sin(x * 0.42 + t * 0.9) * Math.cos(z * 0.33 - t * 0.6)
      + 0.45 * Math.sin(x * 0.9 - z * 0.5 + t * 1.6)
      + 0.25 * Math.sin(Math.hypot(x, z - 10) * 0.8 - t * 2.2)
      + (0.6 + ptr.energy * 1.6) * Math.exp(-d * d / 18) * Math.cos(d * 1.1 - t * 3.2);
  }
  function frame(now) {
    const t = (now - t0) / 1000;
    ptr.x += (ptr.tx - ptr.x) * 0.06; ptr.y += (ptr.ty - ptr.y) * 0.06; ptr.energy += (ptr.te - ptr.energy) * 0.04; ptr.te *= 0.97;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const f = Math.min(w, h * 1.6) * 0.9, horizon = h * 0.34, camY = 5.2, camZ = 3, tilt = (ptr.x - 0.5) * 0.18;
    const P = [];
    for (let r = 0; r < ROWS; r++) {
      const z = (r / (ROWS - 1)) * DEPTH, row = [];
      for (let c = 0; c < COLS; c++) {
        const x0 = (c / (COLS - 1) - 0.5) * WIDTH, x = x0 + tilt * z, y = height(x0, z, t), zz = z + camZ;
        row.push([w / 2 + (x * f) / zz, horizon + ((camY - y) * f) / zz / 2.2, z]);
      }
      P.push(row);
    }
    ctx.lineWidth = 1.25;
    for (let r = ROWS - 1; r >= 0; r--) {
      const k = r / (ROWS - 1), col = k < 0.5 ? mix(colors.near, colors.mid, k * 2) : mix(colors.mid, colors.far, (k - 0.5) * 2);
      const a = (colors.light ? 0.6 : 0.9) * (1 - k * 0.82);
      ctx.strokeStyle = 'rgba(' + col.join(',') + ',' + a.toFixed(3) + ')';
      ctx.beginPath();
      P[r].forEach((p, c) => (c ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.stroke();
      if (r % 3 === 0) {
        ctx.fillStyle = 'rgba(' + col.join(',') + ',' + Math.min(1, a * 1.4).toFixed(3) + ')';
        for (let c = 0; c < COLS; c += 3) { const p = P[r][c]; ctx.fillRect(p[0] - 0.9, p[1] - 0.9, 1.8, 1.8); }
      }
    }
    // faint lengthwise threads, like the strings of a tanpura running into the distance
    ctx.lineWidth = 0.7;
    for (let c = 0; c < COLS; c += 6) {
      ctx.strokeStyle = 'rgba(' + colors.mid.join(',') + ',' + (colors.light ? 0.12 : 0.16) + ')';
      ctx.beginPath(); for (let r = 0; r < ROWS; r++) { const p = P[r][c]; r ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.stroke();
    }
    if (!reduce() && visible && !document.hidden) raf = requestAnimationFrame(frame);
  }
  const start = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); };
  const onMove = e => { const r = canvas.getBoundingClientRect(); ptr.tx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); ptr.ty = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)); ptr.te = Math.min(1, ptr.te + 0.08); };
  const onVis = () => { if (!document.hidden && visible) start(); };
  const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) start(); });
  const ro = new ResizeObserver(() => { resize(); if (reduce()) start(); });
  const mo = new MutationObserver(() => { readColors(); if (reduce()) start(); });
  readColors(); resize();
  io.observe(canvas); ro.observe(canvas);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('visibilitychange', onVis);
  start();
  return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); mo.disconnect(); window.removeEventListener('pointermove', onMove); document.removeEventListener('visibilitychange', onVis); };
}

/* ---- tilt, reveals and page entrances ---- */
const REVEAL = '.phead > *, .section > h2, .section > .lead, .feature, .flow > div, .card, .hero-demo, .pr-stat, .pr-rt, .mx-grid, .mx-detail, .mx-build, .kl-card';
const TILT = '.feature, .pr-stat, .pr-rt, .hero-demo, .flow > div';
export function initFx() {
  const main = document.getElementById('main');
  if (!main) return;
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: 0.06 }) : null;
  let pending = 0;
  function scan() {
    pending = 0;
    const fresh = Array.from(main.querySelectorAll(REVEAL)).filter(el => !el.dataset.reveal);
    let k = 0, lastParent = null;
    fresh.forEach(el => {
      el.dataset.reveal = '1';
      if (reduce() || !io) { el.classList.add('in'); return; }
      // siblings rise one after another; a new group starts the count again
      k = el.parentElement === lastParent ? k + 1 : 0; lastParent = el.parentElement;
      el.style.setProperty('--d', Math.min(k, 6) * 70 + 'ms');
      io.observe(el);
    });
    if (finePointer() && !reduce()) main.querySelectorAll(TILT).forEach(el => { if (!el.hasAttribute('data-tilt')) el.setAttribute('data-tilt', ''); });
  }
  new MutationObserver(() => { if (!pending) pending = requestAnimationFrame(scan); }).observe(main, { childList: true, subtree: true });
  scan();
  // tilt: the card under the pointer leans toward it, and a glare follows
  let cur = null, raf = 0, ev = null;
  const apply = () => {
    raf = 0; if (!cur || !ev) return;
    const r = cur.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
    const max = r.width > 520 ? 3 : 7;
    cur.style.setProperty('--rx', ((0.5 - y) * max).toFixed(2) + 'deg'); cur.style.setProperty('--ry', ((x - 0.5) * max).toFixed(2) + 'deg');
    cur.style.setProperty('--gx', (x * 100).toFixed(1) + '%'); cur.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
  };
  const leave = el => { el.classList.remove('tilting'); el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); };
  document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || reduce()) return;
    const el = e.target.closest && e.target.closest('[data-tilt]');
    if (el !== cur) { if (cur) leave(cur); cur = el; if (cur) cur.classList.add('tilting'); }
    ev = e; if (cur && !raf) raf = requestAnimationFrame(apply);
  }, { passive: true });
  document.addEventListener('pointerleave', () => { if (cur) leave(cur); cur = null; });
}
/* each page enters with a short rise (called by the router after it mounts a page) */
export function enter(main) {
  if (reduce()) return;
  main.classList.remove('entering'); void main.offsetWidth; main.classList.add('entering');
}
