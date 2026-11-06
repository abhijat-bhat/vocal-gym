/* The melakarta wheel (v0.10). The 72 ragas as one carved stone dial: twelve chakras of six, the shuddha madhyama half and the
   prati madhyama half facing each other, so that the raga straight across from any raga is the same scale with the other
   madhyama. The tile at the brass index on the right is the raga shown beside it; there its name reads level. In the hub, the
   twelve semitones, with the raga's seven drawn as one line of flour, so each raga has its own shape and turning the wheel
   turns one into the next.

   Drag to turn it, with weight; click a raga to bring it to the index and hear it, or the hub to hear the one there. Arrow
   keys move a raga at a time, Page keys a chakra. It draws only when something changes. It is a way of choosing, not the only
   one: the table beside it does everything it does, and takes over where WebGL2 is missing or the device cannot keep up.

   No library: one fragment shader, traced against the dial's solid shape. Colours come from the page's tokens. */
import { onClock } from './audio.js';

const STEP = Math.PI * 2 / 72;

const FRAG = `
precision highp float;
out vec4 outColor;
uniform vec2 uRes, uLens, uShift;
uniform vec3 uCam, uR, uU, uF, uStone, uTile, uTile2, uFlour, uTurm, uInk, uRoom, uLight;
uniform float uRot, uPos, uHover, uLinear, uAmb, uPower;
uniform float uKeys[12], uOn[12];
uniform vec2 uPoly[7];
uniform sampler2D uDecal;
const float DA = ${STEP.toFixed(7)}, PI = 3.14159265;
const vec3 BRASS = vec3(.80, .56, .24);
#define sat(x) clamp(x, 0., 1.)

/* how far this tile is from the index, in tiles; the wheel's own frame */
float tileId(vec3 p) { return mod(round((atan(p.z, p.x) - uRot) / DA), 72.); }
float fromIndex(float id) { return mod(id - uPos + 36., 72.) - 36.; }

/* a tile: a wedge, raised as it comes under the index, like a follower on a cam */
float tile(vec3 p, float r, float k, float id) {
  float da = (k - id) * DA, off = fromIndex(mod(id, 72.)), lift = .07 * exp(-off * off / .55), top = .058 + lift;
  vec3 q = vec3(abs(da) * r - (DA * .5 * r - .0042), abs(r - .815) - .157, abs(p.y - top * .5) - top * .5);
  return length(max(q + .007, 0.)) + min(max(q.x, max(q.y, q.z)), 0.) - .007;
}
vec2 map(vec3 p) {
  float r = length(p.xz), wa = atan(p.z, p.x), a = wa - uRot, k = a / DA;
  float d = tile(p, r, k, round(k));
  // the raised ones stand over their neighbours' cells, so a ray beside them must be told
  if (abs(wa) < .34 && r > .56) {
    float near = round(uPos);
    for (int j = -1; j <= 1; j++) { float id = near + float(j); d = min(d, tile(p, r, k, id + 72. * round((k - id) / 72.))); }
  }
  vec2 res = vec2(d, 2.);
  // the plate, with the hub let into it
  float plateTop = r < .50 ? .004 : .022;
  float plate = max(max(r - 1., -.06 - p.y), p.y - plateTop) * (r < .52 ? .7 : 1.);
  if (plate < res.x) res = vec2(plate, 1.);
  // the brass: a rim, the inner ring, the hub's edge, a rib between chakras, and the index
  float b = length(vec2(r - .988, p.y - .028)) - .017;
  b = min(b, length(vec2(r - .652, p.y - .03)) - .009);
  b = min(b, length(vec2(r - .505, p.y - .02)) - .012);
  float six = a / (DA * 6.) - .5, rib = (six - round(six)) * DA * 6. * r;
  b = min(b, max(max(abs(rib) - .0048, abs(r - .815) - .17), abs(p.y - .036) - .040));
  float side = abs(p.z) - max(p.x - 1.0, 0.) * .34 - .002;
  b = min(b, max(max(side, max(.985 - p.x, p.x - 1.12)), abs(p.y - .05) - .045));
  if (b < res.x) res = vec2(b, 3.);
  // the twelve semitones, studs round the hub
  float ka = atan(p.z, p.x) + PI * .5, kk = round(ka / (PI / 6.)), kb = kk * PI / 6. - PI * .5;
  float stud = length((p - vec3(cos(kb) * .375, .012, sin(kb) * .375)) * vec3(1., 1.6, 1.)) - .022;
  if (stud < res.x) res = vec2(stud, 4.);
  return res;
}
vec3 normalAt(vec3 p) {
  const vec2 e = vec2(.0016, -.0016);
  return normalize(e.xyy * map(p + e.xyy).x + e.yyx * map(p + e.yyx).x + e.yxy * map(p + e.yxy).x + e.xxx * map(p + e.xxx).x);
}
float shadow(vec3 p, vec3 l) {
  float s = 1., t = .012;
  for (int i = 0; i < 14 && t < .7; i++) {
    float h = map(p + l * t).x;
    if (h < .0006) return .25;
    s = min(s, 11. * h / t);
    t += clamp(h, .006, .08);
  }
  return .25 + .75 * sat(s);
}
vec3 room(vec3 r) {
  // a dim room with one tall window: its streak is what makes stone read as polished
  vec3 w = normalize(vec3(-.5, .72, -.48));
  float strip = smoothstep(.975, .995, dot(r, w)) * smoothstep(.2, .0, abs(dot(r, normalize(vec3(.7, 0., -.7)))) - .05);
  return uRoom * (.10 + .55 * sat(r.y)) + vec3(1., .96, .9) * strip * 1.6;
}
vec3 tone(vec3 c) { return sat((c * (2.51 * c + .03)) / (c * (2.43 * c + .59) + .14)); }
float segD(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * sat(dot(pa, ba) / dot(ba, ba))); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main() {
  vec2 px = gl_FragCoord.xy / uRes * 2. - 1. - uShift;
  vec3 rd = normalize(uF + uR * px.x * uLens.x + uU * px.y * uLens.y);
  // the slab of space the dial occupies
  float t = (.26 - uCam.y) / rd.y, end = (-.06 - uCam.y) / rd.y;
  vec2 hit = vec2(1., 0.);
  bool found = false;
  for (int i = 0; i < 56 && t < end; i++) {
    hit = map(uCam + rd * t);
    if (hit.x < .0007) { found = true; break; }
    t += hit.x * .82;
  }
  vec3 G = uCam + rd * end;
  if (!found) {
    // the page shows through; the dial's shadow lies on it
    float sh = 1. - smoothstep(.95, 1.19, length(G.xz - vec2(.03, .04)));
    outColor = vec4(0., 0., 0., sh * sh * .62);
    return;
  }
  vec3 P = uCam + rd * t, N = normalAt(P), V = -rd, L = normalize(uLight - P), H = normalize(L + V), R = reflect(rd, N);
  float r = length(P.xz), mat = hit.y, c = cos(uRot), s = sin(uRot);
  vec2 ring = vec2(c * P.x + s * P.z, -s * P.x + c * P.z);
  float grain = hash(floor(P.xz * 620.));

  vec3 alb = uStone, F0 = vec3(.05);
  float rough = .22, ink = 0.;
  vec3 inkC = uFlour;
  if (mat < 1.5) {
    // the plate: black stone, polished. In its band, the chakras; in the hub, the semitones and the raga's line
    if (r > .5) {
      ink = texture(uDecal, ring / 2.04 + .5).r;
      inkC = mix(mix(BRASS * 1.1, uFlour, .35), uFlour, uLinear);
    } else {
      float ka = atan(P.z, P.x) + PI * .5, kk = mod(round(ka / (PI / 6.)), 12.);
      int ki = int(kk);
      ink = texture(uDecal, P.xz / 2.04 + .5).r * (.5 + .5 * uKeys[ki]);
      inkC = mix(uFlour, uTurm, uOn[ki]);
      float d = 1e3;
      for (int i = 0; i < 7; i++) d = min(d, segD(P.xz, uPoly[i], uPoly[i == 6 ? 0 : i + 1]));
      float line = 1. - smoothstep(.0085, .0125, d + (grain - .5) * .006);
      if (line > 0.) { alb = mix(alb, uFlour * (.78 + .3 * grain), line); rough = mix(rough, .9, line); F0 = mix(F0, vec3(.02), line); }
    }
  } else if (mat < 2.5) {
    // a tile: honed, one half on stone and the other on oxide; the raga at the index in turmeric
    float id = tileId(P), off = fromIndex(id), top = sat((N.y - .75) * 4.);
    bool prati = id >= 36.;
    alb = prati ? uTile2 : uTile;
    alb *= .92 + .16 * grain;
    rough = .5;
    float sel = (1. - smoothstep(.34, .6, abs(off))) * top;
    float twin = (1. - smoothstep(.34, .6, 36. - abs(off))) * top;
    if (abs(id - uHover) < .5) alb = mix(alb, uFlour, .14);
    alb = mix(alb, BRASS * .55, twin * .75);
    alb = mix(alb, uTurm, sel);
    ink = texture(uDecal, ring / 2.04 + .5).r * top;
    inkC = mix(uFlour, uInk, sel);
  } else if (mat < 3.5) {
    alb = vec3(0.); F0 = BRASS; rough = .32;
  } else {
    float ka = atan(P.z, P.x) + PI * .5; int ki = int(mod(round(ka / (PI / 6.)), 12.));
    alb = vec3(0.); F0 = mix(BRASS * .45, BRASS * 1.2, uKeys[ki]); rough = .3;
    alb = uTurm * uOn[ki] * 1.2;
    if (uKeys[ki] > .5 && uOn[ki] < .5) { alb = uFlour * .7; F0 = vec3(.05); rough = .6; }
  }
  alb = mix(alb, inkC, ink);
  rough = mix(rough, .7, ink);

  float NoL = sat(dot(N, L)), NoV = max(dot(N, V), .02), NoH = sat(dot(N, H));
  float sh = shadow(P + N * .002, L);
  float ao = sat(.45 + map(P + N * .035).x / .035 * .55);
  float a = rough * rough, a2 = a * a, dd = NoH * NoH * (a2 - 1.) + 1.;
  vec3 F = F0 + (1. - F0) * pow(1. - sat(dot(H, V)), 5.);
  vec3 lamp = vec3(1., .86, .68) * uPower;
  vec3 col = alb * (lamp * NoL * sh / PI + uRoom * uAmb * ao);
  col += lamp * NoL * sh * F * a2 / (PI * dd * dd) * .25;
  vec3 Fv = F0 + (1. - F0) * pow(1. - NoV, 5.);
  col += room(R) * Fv * ao * (1.15 - rough);

  vec3 mapped = mix(tone(col * 1.25), sat(col), uLinear);
  outColor = vec4(pow(max(mapped, 0.), vec3(1. / 2.2)), 1.);
}`;
const VERT = 'void main() { vec2 a = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); gl_Position = vec4(a * 2. - 1., 0., 1.); }';

const KEYS = ['S', 'R1', 'R2 G1', 'R3 G2', 'G3', 'M1', 'M2', 'P', 'D1', 'D2 N1', 'D3 N2', 'N3'];
const hex = s => { const m = /#([0-9a-f]{6})/i.exec(s) || [0, '808080'], n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => Math.pow(v / 255, 2.2)); };
const mix3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = a => { const l = Math.hypot(...a) || 1; return a.map(v => v / l); };

/* every word on the dial, in one image: the ring's words in the ring's own frame, the semitones in the hub's */
function drawDecal(M, S) {
  const cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d'), U = S / 2.04, k = S / 2048;
  g.fillStyle = '#000'; g.fillRect(0, 0, S, S);
  g.fillStyle = '#fff'; g.textBaseline = 'middle';
  g.translate(S / 2, S / 2);
  for (let m = 1; m <= 72; m++) {
    g.save(); g.rotate((m - 1) * STEP); g.translate(.672 * U, 0);
    g.font = '600 ' + 37 * k + 'px Arima, serif'; g.textAlign = 'right';
    g.fillText(String(m), 48 * k, 0);
    g.font = '500 ' + 34 * k + 'px "Hind Madurai", sans-serif'; g.textAlign = 'left';
    const name = M.MELA_NAMES[m - 1], room = .972 * U - .672 * U - 60 * k, w = g.measureText(name).width;
    g.translate(60 * k, 0); g.scale(Math.min(1, room / w), 1);
    g.fillText(name, 0, 0);
    g.restore();
  }
  for (let c = 0; c < 12; c++) {
    g.save(); g.rotate((c * 6 + 2.5) * STEP); g.translate(.578 * U, 0);
    g.font = '600 ' + 37 * k + 'px Arima, serif'; g.textAlign = 'center';
    const name = M.melakartaInfo(c * 6 + 1).chakra.name, room = .125 * U, w = g.measureText(name).width;
    g.scale(Math.min(1, room / w), 1);
    g.fillText(name, 0, 0);
    g.restore();
  }
  KEYS.forEach((label, p) => {
    const a = -Math.PI / 2 + p * Math.PI / 6, r = .44 * U, parts = label.split(' ');
    g.font = '600 ' + (parts.length > 1 ? 29 : 37) * k + 'px "Hind Madurai", sans-serif'; g.textAlign = 'center';
    parts.forEach((t, i) => g.fillText(t, Math.cos(a) * r, Math.sin(a) * r + (i - (parts.length - 1) / 2) * 30 * k));
  });
  return cv;
}

/* opts: host (an element), M (the engine's melakarta module), value, onTurn(n), onPick(n), onFail. → { set(n), dispose } or null */
export function mountWheel(opts) {
  const { host, M, onTurn, onPick, onFail } = opts;
  const forced = (() => { try { return localStorage.getItem('vg-3d') === 'force'; } catch (e) { return false; } })();
  const canvas = document.createElement('canvas');
  canvas.className = 'mw-gl';
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: true, premultipliedAlpha: false, powerPreference: 'high-performance' });
  if (!gl) return null;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow = () => matchMedia('(max-width:980px)').matches;
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'slider');
  canvas.setAttribute('aria-label', 'The melakarta wheel');
  canvas.setAttribute('aria-valuemin', '1'); canvas.setAttribute('aria-valuemax', '72');
  host.appendChild(canvas);

  const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, '#version 300 es\n' + src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  const parallel = gl.getExtension('KHR_parallel_shader_compile');
  const vao = gl.createVertexArray(), uni = {};
  let decal = null, ready = false, alive = true, failed = false, raf = 0, last = performance.now(), visible = true, dirty = true, firstDrawn = false;

  let rot = 0, vel = 0, aim = null, shown = opts.value || 29, hover = -1, drag = null, scale = 1, notified = shown, lastNotify = 0;
  const keys = new Float32Array(12), on = new Float32Array(12), keyTo = new Float32Array(12);
  const polyA = new Float32Array(7), polyTo = new Float32Array(7), polyXY = new Float32Array(14);
  let notes = [];
  const colors = {};
  const view = { lens: [1, 1], shift: [0, 0], D: 6, base: 60 * Math.PI / 180, pos: [0, 0, 0], F: [0, 0, 0], R: [0, 0, 0], U: [0, 0, 0] };

  const rotOf = n => -(n - 1) * STEP;
  const nearest = (from, to) => { const turn = Math.PI * 2; return to + Math.round((from - to) / turn) * turn; };
  const posOf = r => ((-r / STEP) % 72 + 72) % 72;
  const atIndex = () => (Math.round(posOf(rot)) % 72) + 1;

  function scaleOf(n) {
    const I = M.melakartaInfo(n), set = new Set(I.pitches);
    for (let p = 0; p < 12; p++) keyTo[p] = set.has(p) ? 1 : 0;
    I.pitches.slice(0, 7).forEach((p, i) => { polyTo[i] = -Math.PI / 2 + p * Math.PI / 6; });
    notes = I.aro.concat(I.avaro.slice(1));
    canvas.setAttribute('aria-valuenow', String(n));
    canvas.setAttribute('aria-valuetext', n + ' ' + I.name + ', chakra ' + I.chakra.name);
    if (still) { keys.set(keyTo); polyA.set(polyTo); }
    dirty = true;
  }

  const place = (D) => {
    const pos = [0, Math.sin(view.base) * D, Math.cos(view.base) * D], F = norm(pos.map(v => -v)), R = norm(cross(F, [0, 1, 0])), U = cross(R, F);
    return { pos, F, R, U };
  };
  function frame() {
    const c = canvas.getBoundingClientRect();
    if (!c.width || !c.height) return;
    const tan = Math.tan(11 * Math.PI / 180), aspect = c.width / c.height, small = narrow();
    view.lens = [tan * aspect, tan];
    const bounds = D => {
      const cc = place(D); let l = 9, r = -9, b = 9, t = -9;
      for (let i = 0; i < 32; i++) {
        const a = i / 32 * Math.PI * 2, v = [Math.cos(a) * 1.23 - cc.pos[0], .02 - cc.pos[1], Math.sin(a) * 1.23 - cc.pos[2]], d = dot(v, cc.F);
        const x = dot(v, cc.R) / (d * view.lens[0]), y = dot(v, cc.U) / (d * view.lens[1]);
        l = Math.min(l, x); r = Math.max(r, x); b = Math.min(b, y); t = Math.max(t, y);
      }
      return { l, r, b, t };
    };
    // a whole dial on a wide screen; on a narrow one, its right side large enough to read, with the hub running off to the left
    let lo = 1, hi = 60;
    for (let i = 0; i < 24; i++) { const D = (lo + hi) / 2, m = bounds(D); const fits = small ? m.r - m.l <= 4.1 : m.r - m.l <= 2 && m.t - m.b <= 2; if (fits) hi = D; else lo = D; }
    view.D = hi;
    const m = bounds(hi);
    view.shift = small ? [.98 - (m.r - m.l) / 2 * (1.13 / 1.23) - (m.l + m.r) / 2, -(m.t + m.b) / 2] : [-(m.l + m.r) / 2 - (c.width >= 1100 ? 48 / c.width * 2 : 0), -(m.t + m.b) / 2];   // room for its name beside the index
    dirty = true;
  }
  function size() {
    const box = host.getBoundingClientRect();
    const h = narrow() ? Math.min(560, box.width * 1.38) : Math.min(box.width * .84, Math.max(640, window.innerHeight - 84));
    canvas.style.height = h + 'px';
    // finer than the screen on a plain display: there is no other smoothing
    const fine = Math.min(2, Math.max(1.5, window.devicePixelRatio || 1)), ratio = Math.min(fine, Math.sqrt(3200000 / Math.max(1, box.width * h))) * scale;
    canvas.width = Math.max(2, Math.round(box.width * ratio)); canvas.height = Math.max(2, Math.round(h * ratio));
    gl.viewport(0, 0, canvas.width, canvas.height);
    frame();
  }
  function readColors() {
    const css = getComputedStyle(document.documentElement), tok = n => hex(css.getPropertyValue(n));
    const bg = tok('--bg'), light = bg[0] * .3 + bg[1] * .6 + bg[2] * .1 > .5, surface = tok('--surface'), raise = tok('--raise'), flour = tok('--flour');
    Object.assign(colors, { light, stone: surface, tile: light ? surface : raise, tile2: light ? mix3(surface, flour, .2) : bg.map(v => v * .62), flour, turm: tok('--saffron'), ink: tok('--saffron-ink'), room: light ? [1, .98, .94] : [.42, .32, .25], amb: light ? .72 : .55, power: light ? .95 : 2.6, linear: light ? 1 : 0 });
    dirty = true;
  }

  /* the wheel's plane, under a point on the screen */
  const planeAt = e => {
    const c = canvas.getBoundingClientRect(), nx = (e.clientX - c.left) / c.width * 2 - 1 - view.shift[0], ny = 1 - (e.clientY - c.top) / c.height * 2 - view.shift[1];
    const d = norm([0, 1, 2].map(i => view.F[i] + view.R[i] * nx * view.lens[0] + view.U[i] * ny * view.lens[1]));
    if (d[1] >= -.001) return null;
    const t = (.04 - view.pos[1]) / d[1], x = view.pos[0] + d[0] * t, z = view.pos[2] + d[2] * t;
    return { x, z, r: Math.hypot(x, z), a: Math.atan2(z, x) };
  };
  const tileUnder = p => (p && p.r > .64 && p.r < .985 ? ((Math.round((p.a - rot) / STEP) % 72) + 72) % 72 : -1);
  const go = (n, sing) => {
    aim = nearest(rot, rotOf(n)); vel = still ? 0 : vel;
    if (still) { rot = aim; aim = null; }
    shown = n; notified = n; scaleOf(n); dirty = true;
    if (sing) onPick(n);
  };
  const onDown = e => {
    if (e.button) return;
    const p = planeAt(e); if (!p) return;
    drag = { a: p.a, x: e.clientX, y: e.clientY, moved: false, vel: 0, t: performance.now(), tile: tileUnder(p), hub: p.r < .5 };
    try { canvas.setPointerCapture(e.pointerId); } catch (x) { /* it went */ }
    canvas.classList.add('held');
    aim = null; vel = 0;
  };
  const onMove = e => {
    const p = planeAt(e);
    if (!drag) { const t = e.pointerType === 'touch' ? -1 : tileUnder(p), hub = p && p.r < .5; if (t !== hover) { hover = t; dirty = true; } canvas.style.cursor = t >= 0 || hub ? 'pointer' : ''; return; }
    if (!p) return;
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) drag.moved = true;
    if (!drag.moved) return;
    let da = p.a - drag.a; if (da > Math.PI) da -= Math.PI * 2; if (da < -Math.PI) da += Math.PI * 2;
    drag.a = p.a; rot += da;
    const t = performance.now(), dt = Math.max(.004, (t - drag.t) / 1000); drag.t = t;
    drag.vel = drag.vel * .7 + da / dt * .3;
    dirty = true;
  };
  const onUp = () => {
    if (!drag) return;
    const d = drag; drag = null; canvas.classList.remove('held');
    if (!d.moved) {
      if (d.tile >= 0) go(d.tile + 1, true);
      else if (d.hub) onPick(shown);
      return;
    }
    vel = still ? 0 : Math.max(-9, Math.min(9, performance.now() - d.t > 120 ? 0 : d.vel));
    dirty = true;
  };
  const onKey = e => {
    const by = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, PageDown: 6, PageUp: -6 }[e.key];
    if (by) { e.preventDefault(); const n = ((shown - 1 + by) % 72 + 72) % 72 + 1; go(n); onTurn(n); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(shown); }
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', () => { if (hover !== -1) { hover = -1; dirty = true; } });
  canvas.addEventListener('keydown', onKey);

  // while the scale is sung, its swara lights in the hub
  const offClock = onClock(c => {
    on.fill(0);
    if (c && c.beats >= 0 && notes.length) { const p = notes[Math.floor(c.beats) % notes.length]; on[((p % 12) + 12) % 12] = 1; }
    dirty = true;
  });

  const ro = new ResizeObserver(size); ro.observe(host);
  window.addEventListener('resize', size);
  const io = new IntersectionObserver(es => { visible = es[es.length - 1].isIntersecting; }, { threshold: 0 }); io.observe(canvas);
  const mo = new MutationObserver(readColors); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const scheme = matchMedia('(prefers-color-scheme: light)'); scheme.addEventListener('change', readColors);
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); fail(); });

  function fail() { if (failed) return; failed = true; dispose(); if (onFail) onFail(); }

  function linkDone() {
    if (!decal) return false;
    if (parallel && !gl.getProgramParameter(prog, parallel.COMPLETION_STATUS_KHR)) return false;
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn('[wheel]', gl.getProgramInfoLog(prog)); fail(); return false; }
    gl.useProgram(prog);
    ['uRes', 'uLens', 'uShift', 'uCam', 'uR', 'uU', 'uF', 'uStone', 'uTile', 'uTile2', 'uFlour', 'uTurm', 'uInk', 'uRoom', 'uLight', 'uRot', 'uPos', 'uHover', 'uLinear', 'uAmb', 'uPower', 'uKeys', 'uOn', 'uPoly', 'uDecal'].forEach(n => { uni[n] = gl.getUniformLocation(prog, n); });
    ready = true;
    return true;
  }

  /* the dial has weight: a flick runs on and slows, and it always comes to rest on a raga */
  function step(dt) {
    let moving = false;
    if (drag) moving = true;
    else if (aim !== null) {
      const k = 34, c = 11.5;
      vel += ((aim - rot) * k - vel * c) * dt; rot += vel * dt; moving = true;
      if (Math.abs(aim - rot) < .0004 && Math.abs(vel) < .01) { rot = aim; vel = 0; aim = null; }
    } else if (Math.abs(vel) > 1.1) {
      rot += vel * dt; vel *= Math.exp(-dt * 1.35); moving = true;
    } else {
      const snap = Math.round(rot / STEP) * STEP, gap = snap - rot;
      if (Math.abs(gap) > .0004 || Math.abs(vel) > .01) { vel += (gap * 90 - vel * 15) * dt; rot += vel * dt; moving = true; }
      else if (rot !== snap) { rot = snap; vel = 0; }
    }
    // what is at the index is what the page shows; while it spins, not on every tile
    const n = atIndex();
    if (aim === null && n !== shown) { shown = n; scaleOf(n); }
    if (aim === null && shown !== notified) {
      const t = performance.now();
      if (!moving || t - lastNotify > 110) { lastNotify = t; notified = shown; onTurn(shown); }
    }
    let settling = false;
    for (let i = 0; i < 12; i++) { const d = keyTo[i] - keys[i]; if (Math.abs(d) > .002) { keys[i] += d * Math.min(1, dt * 9); settling = true; } else keys[i] = keyTo[i]; }
    for (let i = 0; i < 7; i++) { const d = polyTo[i] - polyA[i]; if (Math.abs(d) > .0008) { polyA[i] += d * Math.min(1, dt * 11); settling = true; } else polyA[i] = polyTo[i]; }
    return moving || settling;
  }
  function draw() {
    const c = place(view.D);
    view.pos = c.pos; view.F = c.F; view.R = c.R; view.U = c.U;
    for (let i = 0; i < 7; i++) { polyXY[i * 2] = Math.cos(polyA[i]) * .375; polyXY[i * 2 + 1] = Math.sin(polyA[i]) * .375; }
    gl.useProgram(prog);
    gl.bindVertexArray(vao);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uni.uRes, canvas.width, canvas.height); gl.uniform2fv(uni.uLens, view.lens); gl.uniform2fv(uni.uShift, view.shift);
    gl.uniform3fv(uni.uCam, c.pos); gl.uniform3fv(uni.uR, c.R); gl.uniform3fv(uni.uU, c.U); gl.uniform3fv(uni.uF, c.F);
    gl.uniform3fv(uni.uStone, colors.stone); gl.uniform3fv(uni.uTile, colors.tile); gl.uniform3fv(uni.uTile2, colors.tile2); gl.uniform3fv(uni.uFlour, colors.flour);
    gl.uniform3fv(uni.uTurm, colors.turm); gl.uniform3fv(uni.uInk, colors.ink); gl.uniform3fv(uni.uRoom, colors.room);
    gl.uniform3f(uni.uLight, -1.25, 2.3, -1.05);
    gl.uniform1f(uni.uRot, rot); gl.uniform1f(uni.uPos, posOf(rot)); gl.uniform1f(uni.uHover, hover); gl.uniform1f(uni.uLinear, colors.linear); gl.uniform1f(uni.uAmb, colors.amb); gl.uniform1f(uni.uPower, colors.power);
    gl.uniform1fv(uni.uKeys, keys); gl.uniform1fv(uni.uOn, on); gl.uniform2fv(uni.uPoly, polyXY);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, decal); gl.uniform1i(uni.uDecal, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  const LEVELS = [1, .75, .55];
  let level = 0, count = 0, spent = 0, skip = 0;
  function governor(dt) {
    if (forced || still) return;
    if (skip > 0) { skip--; return; }
    spent += dt; count++;
    if (count < 30 && spent < 1.5) return;
    const avg = spent / count; count = 0; spent = 0;
    if (avg > (level === LEVELS.length - 1 ? .08 : .045)) {
      if (level === LEVELS.length - 1) { fail(); return; }
      level++; scale = LEVELS[level]; size(); skip = 6;
    }
  }
  let wasMoving = false;
  function loop(now) {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    if (!ready && !linkDone()) return;
    const raw = (now - last) / 1000; last = now;
    if (!visible) return;
    const moving = step(still ? 1 : Math.min(.04, raw));
    if (!moving && !dirty) { wasMoving = false; return; }
    draw();
    dirty = false;
    if (!firstDrawn) { firstDrawn = true; requestAnimationFrame(() => { if (alive) host.classList.add('has-3d'); }); }
    if (moving && wasMoving && raw < 3) governor(raw);
    wasMoving = moving;
  }

  function set(n) {
    if (!alive || n === shown) return;
    go(n);
  }
  function dispose() {
    if (!alive) return;
    alive = false;
    cancelAnimationFrame(raf);
    offClock(); ro.disconnect(); window.removeEventListener('resize', size); io.disconnect(); mo.disconnect(); scheme.removeEventListener('change', readColors);
    host.classList.remove('has-3d');
    canvas.remove();
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
  }

  rot = rotOf(shown);
  scaleOf(shown); keys.set(keyTo); polyA.set(polyTo);
  readColors();
  size();
  raf = requestAnimationFrame(loop);

  // the words wait for the page's own type
  const faces = Promise.race([Promise.all([document.fonts.load('600 40px Arima'), document.fonts.load('500 40px "Hind Madurai"'), document.fonts.load('600 40px "Hind Madurai"')]), new Promise(r => setTimeout(r, 1800))]);
  faces.catch(() => {}).then(() => {
    if (!alive) return;
    const cv = drawDecal(M, 2048);
    decal = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, decal);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, cv);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    const an = gl.getExtension('EXT_texture_filter_anisotropic');
    if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(an.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    dirty = true;
  });
  return { set, dispose };
}
