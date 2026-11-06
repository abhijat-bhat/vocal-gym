/* The kolam on the page (v0.10). The geometry is the engine's (src/engine/kolam.js): one dot per beat of the tala, and one
   closed line. Here it is drawn, and driven by the music: while something plays, the audio clock draws the line around the
   dots, and it closes on sam. Nothing else moves it. */
import { kolam, lineAt } from '/engine/kolam.js';
import { onClock } from './audio.js';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const seedFrom = s => { let h = 7; for (const c of String(s)) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0; return (h % 97) + 1; };

/* an SVG of the figure. label: read out; without one it is decoration. */
export function kolamSvg(n, opts) {
  const o = opts || {}, k = kolam(n, { seed: o.seed || 1 }), m = .9;
  return '<svg class="kolam ' + (o.cls || '') + '" viewBox="' + -m + ' ' + -m + ' ' + (k.width + 2 * m) + ' ' + (k.height + 2 * m) + '" ' + (o.label ? 'role="img" aria-label="' + o.label + '"' : 'aria-hidden="true"') + '>' +
    '<path class="k-ghost" d="' + k.d + '"/><path class="k-line"' + (o.hundredths ? ' pathLength="100"' : '') + ' d="' + k.d + '"/>' +
    k.dots.map(d => '<circle class="k-dot' + (d.beat === 0 ? ' sam' : '') + '" data-beat="' + d.beat + '" cx="' + d.x + '" cy="' + d.y + '" r="' + (d.beat === 0 ? .24 : .17) + '"/>').join('') + '</svg>';
}

/* a kolam that keeps the tala: el receives the figure for total beats, and follows the player; it redraws if what plays has
   another cycle. → dispose */
export function liveKolam(el, total, opts) {
  const o = opts || {};
  let n = 0, k = null, line = null, dots = [];
  const draw = t => {
    n = t; k = kolam(t, { seed: o.seed || 1 });
    el.innerHTML = kolamSvg(t, { seed: o.seed || 1, cls: 'idle ' + (o.cls || ''), label: o.label });
    line = el.querySelector('.k-line'); dots = Array.from(el.querySelectorAll('.k-dot'));
  };
  draw(total);
  const off = onClock(c => {
    if (c && !el.getClientRects().length) return;   // not on this layout
    const svg = el.firstElementChild;
    if (!c) { if (svg) { svg.classList.add('idle'); svg.classList.remove('closed'); } if (line) line.style.strokeDasharray = ''; dots.forEach(d => d.classList.remove('on')); return; }
    if (c.total !== n && c.total >= 1 && c.total <= 64) draw(c.total);
    if (!k || c.beats < 0) return;
    el.firstElementChild.classList.remove('idle');
    const cycle = ((c.beats % n) + n) % n, at = reduced() ? Math.floor(cycle) : cycle;
    // a stroke of fixed width has its dashes measured on the screen, so the length is the path's as drawn now
    const ctm = line.getScreenCTM(), drawn = line.getTotalLength() * (ctm ? ctm.a : 1);
    line.style.strokeDasharray = (lineAt(k, at) * drawn).toFixed(1) + ' ' + (drawn + 4).toFixed(1);
    // the line has closed: it stays whole through sam, while the next one begins over it
    el.firstElementChild.classList.toggle('closed', c.beats >= n && cycle < .75);
    const beat = Math.floor(cycle);
    dots.forEach(d => d.classList.toggle('on', +d.dataset.beat <= beat));
  });
  return off;
}

/* crop a figure so its outer lobes run off the floor and every dot stays on it: past the top and right on a wide floor, past
   both sides on a narrow one. A figure too small to do that is left whole. */
export function bleedKolam(svg) {
  const dots = Array.from(svg.querySelectorAll('.k-dot')), xs = dots.map(d => +d.getAttribute('cx')), ys = dots.map(d => +d.getAttribute('cy'));
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), edge = .62, room = 1.15;
  if (x1 - x0 < 4) return;
  const wide = matchMedia('(min-width:981px)').matches;
  svg.setAttribute('viewBox', (wide ? [x0 - room, y0 - edge, x1 - x0 + room + edge, y1 - y0 + edge + room] : [x0 - edge, y0 - room, x1 - x0 + 2 * edge, y1 - y0 + 2 * room]).join(' '));
  svg.setAttribute('preserveAspectRatio', wide ? 'xMaxYMin meet' : 'xMidYMid meet');
}

/* how many dots a day earns: more minutes, more dots */
export const dayDots = minutes => Math.max(1, Math.min(25, Math.round(minutes / 2.5)));
export const daySeed = seedFrom;
/* one day of practice as a kolam; a day without practice is bare floor */
export function dayKolam(date, minutes, goal) {
  if (!minutes) return '<svg class="kolam day bare" viewBox="0 0 10 10" aria-hidden="true"><circle class="k-dot" cx="5" cy="5" r=".55"/></svg>';
  const n = dayDots(minutes);
  return kolamSvg(n, { seed: seedFrom(date), cls: 'day' + (minutes >= goal ? ' met' : '') });
}
