/* The threshold in three dimensions (v0.10). A polished oxide floor at dawn, a brass lamp, and the kolam laid on the floor in
   rice flour. The dots are the beats of the tala and the music lays the line, as a hand does, a pinch of flour falling at its
   head, and it closes on sam. Moving the pointer moves the eye, and the flame leans. Drag to walk round the figure; touch a
   dot to hear its beat.

   No library: one fragment shader traces the floor and the lamp. The figure comes from the engine (src/engine/kolam.js) and
   is baked into a texture holding, for each point of the floor, the distance to the line and how far along the line it
   falls, so the line can be laid by moving one number. Colours come from the page's own tokens, so both themes follow.

   This is a layer over the plain page, never a condition of it. Without WebGL2, or if the device cannot keep up, the canvas
   goes away and the drawn kolam beneath is what remains; with reduced motion it renders only when something changes, with no
   flicker and no moving eye. */
import { kolam, lineAt } from '/engine/kolam.js';
import { onClock, tick } from './audio.js';

const LAMP = .72, LAMP_H = 3.5 * LAMP;   // the lamp's scale and height, where dots are 2 apart

const FRAG = `
precision highp float;
out vec4 outColor;
uniform vec2 uRes;
uniform vec3 uCam, uR, uU, uF;
uniform vec2 uLens, uShift;
uniform float uMottle, uFall, uTime, uLean, uFlare, uLamp, uAmb, uFill, uGloss, uLinear, uIntro, uE, uProg, uGhost, uShowFlame;
uniform vec3 uFlame, uBase, uRoom, uFloorC, uFlour, uTurm, uLineC, uTint;
uniform vec4 uRip, uCopy;
uniform float uDotOn[64];
uniform sampler2D uMap, uNoise;

const float PI = 3.14159265;
const vec3 FLAME = vec3(1.0, .68, .36);
#define sat(x) clamp(x, 0., 1.)

float smin(float a, float b, float k) { float h = sat(.5 + .5 * (b - a) / k); return mix(b, a, h) - k * h * (1. - h); }
float ell(vec2 q, vec2 r) { float k = length(q / r); return (k - 1.) * min(r.x, r.y); }
float cyl(vec2 q, float r, float y0, float y1) { return max(q.x - r, max(y0 - q.y, q.y - y1)); }

#ifdef HQ
/* a kuthu vilakku, turned on a lathe: foot, stem with its knops, the oil dish, a finial */
float lamp(vec3 p) {
  vec2 q = vec2(length(p.xz - uBase.xz), p.y) / ${LAMP.toFixed(2)};
  float d = ell(q - vec2(0., .03), vec2(.62, .09));
  d = smin(d, ell(q - vec2(0., .16), vec2(.34, .20)), .10);
  d = smin(d, cyl(q, .055, .1, 2.86), .05);
  d = smin(d, ell(q - vec2(0., .92), vec2(.13, .10)), .06);
  d = smin(d, ell(q - vec2(0., 1.08), vec2(.075, .05)), .03);
  d = smin(d, ell(q - vec2(0., 1.98), vec2(.11, .085)), .05);
  float dish = max(ell(q - vec2(0., 2.78), vec2(.54, .17)), -ell(q - vec2(0., 2.86), vec2(.48, .13)));
  d = smin(d, dish, .025);
  d = smin(d, cyl(q, .04, 2.8, 3.32), .03);
  d = smin(d, ell(q - vec2(0., 3.20), vec2(.085, .06)), .03);
  d = smin(d, ell(q - vec2(0., 3.42), vec2(.052, .10)), .02);
  return d * ${LAMP.toFixed(2)};
}
vec3 lampN(vec3 p) {
  const vec2 e = vec2(.004, -.004);
  return normalize(e.xyy * lamp(p + e.xyy) + e.yyx * lamp(p + e.yyx) + e.yxy * lamp(p + e.yxy) + e.xxx * lamp(p + e.xxx));
}
/* the lamp's bounding box along a ray, then a short march inside it */
float hitLamp(vec3 ro, vec3 rd) {
  vec3 lo = vec3(uBase.x - .48, 0., uBase.z - .48), hi = vec3(uBase.x + .48, ${LAMP_H.toFixed(2)} + .05, uBase.z + .54), inv = 1. / rd;
  vec3 a = (lo - ro) * inv, b = (hi - ro) * inv, mn = min(a, b), mx = max(a, b);
  float t0 = max(max(mn.x, mn.y), mn.z), t1 = min(min(mx.x, mx.y), mx.z);
  if (t1 < max(t0, 0.)) return -1.;
  float t = max(t0, 0.);
  for (int i = 0; i < 44; i++) {
    float d = lamp(ro + rd * t);
    if (d < .002) return t;
    t += d * .9;
    if (t > t1) break;
  }
  return -1.;
}
#endif

/* the flame, a soft teardrop that always faces the eye */
vec3 flame(vec3 ro, vec3 rd, float strength, float air) {
  float tc = dot(uFlame - ro, rd);
  if (tc < 0.) return vec3(0.);
  vec3 q = ro + rd * tc - uFlame, side = normalize(cross(rd, vec3(0., 1., 0.)));
  float w = q.y, u = dot(q, side);
  u -= uLean * .7 * pow(max(w + .10, 0.), 2.) + sin(uTime * 8.3 + w * 8.) * .012 * max(w + .14, 0.) * uShowFlame;
  float y = (w + .10) / .40;
  vec3 c = FLAME * .022 / (dot(q, q) + .05) * air;   // the air around it
  if (y > 0. && y < 1.) {
    float wd = .082 * pow(y, .55) * pow(1. - y, .85) * 2.2, d = abs(u) / max(wd, .001), m = smoothstep(1., .35, d);
    vec3 body = mix(vec3(1., .42, .10), vec3(1., .86, .50), smoothstep(.15, .9, (1. - d) * (1. - y * .55)));
    body = mix(body, vec3(.20, .24, .55), smoothstep(.18, .0, y) * .75);
    c += body * m * 2.6 * strength;
  }
  return c;
}

/* what polished floor and brass see: a dim warm room, and the flame */
vec3 room(vec3 p, vec3 r) {
  vec3 e = uRoom * (.16 + .84 * sat(r.y * 1.1 + .1));
  return e + flame(p, r, uShowFlame, .2 * uShowFlame);
}

/* the flour at one point of the floor: height and how much covers it */
float lineW(vec2 p) { return .050 * (.72 + .56 * texture(uNoise, p * .19).r); }
float laidAt(float t) { return mix(uGhost, 1., smoothstep(uProg + .004, uProg - .004, t)); }
float heightAt(vec2 p, float w) {
  vec2 uv = p / (2. * uE) + .5;
  vec4 m = texture(uMap, uv);
  float k = m.r / w, profile = sqrt(max(1. - k * k, 0.));
  return profile * .020 * laidAt(m.g) + m.b * .042;
}

vec3 tone(vec3 c) { return sat((c * (2.51 * c + .03)) / (c * (2.43 * c + .59) + .14)); }

vec3 shadeFloor(vec3 P, vec3 rd) {
  vec2 p = P.xz, uv = p / (2. * uE) + .5;
  vec3 V = -rd;
  vec4 n0 = texture(uNoise, p * .055), n1 = texture(uNoise, p * .21), n2 = texture(uNoise, p * .62), n3 = texture(uNoise, p * .233), n4 = texture(uNoise, p * .317 + .37);
  vec4 m = vec4(1., 2., 0., 0.);
  bool inside = all(greaterThan(uv, vec2(.002))) && all(lessThan(uv, vec2(.998)));
  if (inside) m = texture(uMap, uv);

  // the floor: oxide, burnished by hand, so the shine is uneven and runs in strokes
  float mottle = n0.r * .55 + n1.g * .45, stroke = n1.b, rough = .17 + .20 * mottle + .06 * stroke;
  vec3 alb = uFloorC * (1. + uMottle * (.76 * mottle - .38)) * (1. + uMottle * (.24 * stroke - .12));
  vec3 N = normalize(vec3((n2.g - .5) * .02 + (n1.g - .5) * .035, 1., (n2.r - .5) * .02 + (n1.b - .5) * .035));

  // sam goes through the floor as a ring
  float rr = distance(p, uRip.xy), ring = rr - uRip.z * 5.5;
  float wave = sin(ring * 5.) * exp(-ring * ring * .32) * uRip.w;
  N.xz += normalize(p - uRip.xy + .001) * wave * .05;
  N = normalize(N);

  vec3 L = uFlame - P;
  float d2 = dot(L, L), lamp1 = uLamp / (1. + d2 * .058);
  L /= sqrt(d2);
  float NoL = sat(dot(N, L)), NoV = sat(dot(N, V));

  // flour
  float cover = 0., dotCover = 0.;
  vec3 flourN = vec3(0., 1., 0.), flourC = uLineC;
  if (inside && (m.r < .3 || m.b > .002)) {
    float w = lineW(p);
    float d = m.r + (n2.g - .5) * .030 + (n3.a - .5) * .034;
    float mask = 1. - smoothstep(w - .010, w + .010, d);
    cover = mask * laidAt(m.g);
    // what the fingers let fall beside the line
    float fall = step(.90, n4.a) * exp(-max(d - w, 0.) / .045) * smoothstep(uProg + .004, uProg - .004, m.g);
    cover = max(cover, fall * .85);
    dotCover = smoothstep(.24, .40, m.b + (n3.a - .5) * .22 + (n2.g - .5) * .16);
    int idx = int(texelFetch(uMap, ivec2(uv * vec2(textureSize(uMap, 0))), 0).a * 65. + .5) - 1;
    if (dotCover > 0. && idx >= 0) {
      float on = uDotOn[idx];
      flourC = mix(idx == 0 ? uTurm * vec3(.92, .62, .42) : uFlour, flourC, 1. - dotCover);
      dotCover *= idx == 0 ? 1. : mix(.62, 1., on);
    }
    cover = max(cover, dotCover);
    float e = .016, h = heightAt(p, w);
    vec3 grad = vec3(heightAt(p + vec2(e, 0.), w) - h, 0., heightAt(p + vec2(0., e), w) - h) / e;
    flourN = normalize(vec3(-grad.x + (n3.a - .5) * .9, 1., -grad.z + (n4.a - .5) * .9));
  }

  // the flour stands proud of the floor, so the lamp throws its shadow on it
  float shade = 1.;
  if (inside) {
    vec2 toward = normalize(L.xz + .0001) * .045;
    vec4 s = texture(uMap, uv + toward / (2. * uE));
    float block = (1. - smoothstep(.03, .08, s.r)) * laidAt(s.g);
    block = max(block, smoothstep(.2, .5, s.b));
    shade = 1. - .42 * block;
    shade *= mix(.88, 1., smoothstep(.04, .16, m.r));
  }

  // lit floor
  vec3 col = alb * (FLAME * lamp1 * NoL * shade + uRoom * uAmb);
  vec3 H = normalize(L + V);
  float NoH = sat(dot(N, H)), a = rough * rough, a2 = a * a, dd = NoH * NoH * (a2 - 1.) + 1.;
  float D = a2 / (PI * dd * dd), F = .05 + .95 * pow(1. - sat(dot(H, V)), 5.);
  col += FLAME * lamp1 * NoL * D * F * .13 * shade;

  // the polish: it mirrors the room and the flame, more at a glancing look
  vec3 R = reflect(rd, N);
  float fres = .055 + .945 * pow(1. - NoV, 5.);
  vec3 seen = room(P + N * .001, R);
#ifdef HQ
  float tl = hitLamp(P + vec3(0., .001, 0.), R);
  if (tl > 0.) {
    vec3 q = P + R * tl, nl = lampN(q);
    vec3 lq = normalize(uFlame - q);
    seen = vec3(.86, .60, .26) * (FLAME * uLamp * .16 * (.25 + .75 * sat(dot(nl, lq))) + uRoom * .4);
  }
#endif
  col += seen * fres * uGloss * (1.25 - rough * 2.) * shade;

  // the flour
  vec3 fl = flourC * (.70 + .42 * n3.a);
  float wrap = sat(dot(flourN, L) * .72 + .28);
  vec3 flc = fl * (FLAME * lamp1 * wrap * .5 + vec3(1., .96, .90) * uFill);
  flc += fl * max(wave, 0.) * 1.5;
  col = mix(col, flc, cover);

#ifdef HQ
  // the lamp's foot sits on the floor
  float fd = length(p - uBase.xz);
  col *= mix(.3, 1., smoothstep(.32, .95, fd));
#endif
  return col;
}

void main() {
  vec2 px = gl_FragCoord.xy / uRes * 2. - 1. - uShift;
  vec3 rd = normalize(uF + uR * px.x * uLens.x + uU * px.y * uLens.y), col;
  float tf = rd.y < -.001 ? -uCam.y / rd.y : -1.;
  bool floorHit = tf > 0.;
  if (floorHit) {
    vec3 P = uCam + rd * tf;
    col = shadeFloor(P, rd);
    // the floor goes on into the dark of the room
    col *= mix(1., .35, smoothstep(9., 34., length(P.xz)));
  } else col = uRoom * .05;

#ifdef HQ
  float tl = hitLamp(uCam, rd);
  if (tl > 0. && (!floorHit || tl < tf)) {
    vec3 P = uCam + rd * tl, N = lampN(P), V = -rd, L = uFlame - P;
    float d2 = dot(L, L); L /= sqrt(d2);
    vec3 F0 = vec3(.78, .54, .22);
    vec3 R = reflect(rd, N), H = normalize(L + V);
    float NoV = sat(dot(N, V)), NoL = sat(dot(N, L)), NoH = sat(dot(N, H));
    vec3 F = F0 + (1. - F0) * pow(1. - NoV, 5.);
    float a = .30 * .30, a2 = a * a, dd = NoH * NoH * (a2 - 1.) + 1.;
    float near = uLamp * .75 / (1. + d2 * .35);
    vec3 env = uRoom * (.12 + .5 * sat(R.y) + 1.1 * pow(sat(dot(R, normalize(vec3(-.65, .55, .5)))), 6.));
    // the floor below it, lit by the flame, is what the brass mostly sees
    if (R.y < 0.) env = uFloorC * (.3 + uLamp * .45) * FLAME * (.55 + .45 * sat(-R.y * 2.));
    col = F * (env * 1.1 + FLAME * near * (NoL * .34 + a2 / (PI * dd * dd) * NoL * .16));
    col *= mix(.45, 1., smoothstep(0., .55, P.y));
  }
#endif

  col += flame(uCam, rd, uShowFlame, uShowFlame) * uIntro;

  vec3 mapped = mix(tone(col * 1.2), col, uLinear);
  mapped = pow(max(mapped, 0.), vec3(1. / 2.2));
  // the words sit on a quiet part of the floor, whatever is behind them
  vec2 fromCopy = abs(gl_FragCoord.xy - uCopy.xy) - uCopy.zw;
  float dc = length(max(fromCopy, 0.)) + min(max(fromCopy.x, fromCopy.y), 0.);
  mapped = mix(mapped, uTint, (1. - smoothstep(-40., uFall, dc)) * .82);
  // a little noise, so the dark does not band
  mapped += (texture(uNoise, gl_FragCoord.xy / 512.).a - .5) / 255. * 2.;
  outColor = vec4(mapped, 1.);
}`;

const VERT = `void main() { vec2 a = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); gl_Position = vec4(a * 2. - 1., 0., 1.); }`;

/* grains of flour falling, and dust in the lamplight */
const GRAIN_V = `
in vec4 aP;
uniform vec3 uCam, uR, uU, uF;
uniform vec2 uLens, uShift, uRes;
out float vA;
void main() {
  vec3 v = aP.xyz - uCam;
  float z = dot(v, uF);
  gl_Position = z > .1 ? vec4(dot(v, uR) / (z * uLens.x) + uShift.x, dot(v, uU) / (z * uLens.y) + uShift.y, 0., 1.) : vec4(2., 2., 0., 1.);
  gl_PointSize = max(1.2, uRes.y * .024 / z * (1. + aP.w));
  vA = aP.w;
}`;
const GRAIN_F = `
precision highp float;
in float vA;
out vec4 c;
uniform vec3 uFlour;
void main() {
  float r = length(gl_PointCoord * 2. - 1.);
  float a = smoothstep(1., .25, r) * min(vA, 1.);
  c = vec4(pow(uFlour, vec3(1. / 2.2)), a);
}`;

function compile(gl, type, src, defs) {
  const s = gl.createShader(type);
  gl.shaderSource(s, '#version 300 es\n' + (defs || '') + src);
  gl.compileShader(s);
  return s;
}
function program(gl, vs, fs, defs) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs, defs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs, defs));
  gl.linkProgram(p);
  return p;
}

/* a tiling noise, baked once: R and G clouds at two scales, B long burnishing strokes, A single grains */
function noiseTexture(gl, S) {
  const data = new Uint8Array(S * S * 4);
  let seed = 90210;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const lattices = [4, 8, 16, 32, 64, 128].map(c => { const a = new Float32Array(c * c); for (let i = 0; i < a.length; i++) a[i] = rand(); return { c, a }; });
  const smooth = t => t * t * (3 - 2 * t);
  const value = (x, y, l, sx, sy) => {
    const cx = Math.max(1, Math.round(l.c * sx)), cy = Math.max(1, Math.round(l.c * sy));
    const u = x * cx, v = y * cy, iu = Math.floor(u), iv = Math.floor(v), fu = smooth(u - iu), fv = smooth(v - iv);
    const at = (i, j) => l.a[(((j % cy) + cy) % cy) % l.c * l.c + ((((i % cx) + cx) % cx) % l.c)];
    return (at(iu, iv) * (1 - fu) + at(iu + 1, iv) * fu) * (1 - fv) + (at(iu, iv + 1) * (1 - fu) + at(iu + 1, iv + 1) * fu) * fv;
  };
  const fbm = (x, y, first, n, sx, sy) => { let s = 0, w = .5, sum = 0; for (let o = 0; o < n; o++) { s += value(x, y, lattices[first + o], sx, sy) * w; sum += w; w *= .5; } return s / sum; };
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const x = i / S, y = j / S, k = (j * S + i) * 4;
    data[k] = 255 * fbm(x, y, 0, 4, 1, 1);
    data[k + 1] = 255 * fbm(x, y, 2, 4, 1, 1);
    data[k + 2] = 255 * fbm(x, y, 0, 4, .25, 2);
    data[k + 3] = 255 * rand();
  }
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, S, S, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  return t;
}

/* the figure on the floor: centred points of the line, with how far along each falls */
function lineOf(k) {
  const nums = s => s.trim().split(/\s+/).map(Number), cx = k.width / 2, cy = k.height / 2, pts = [], cum = [0];
  let last = nums(/^M([^Q]+)/.exec(k.d)[1]);
  pts.push([last[0] - cx, last[1] - cy]);
  for (const m of k.d.matchAll(/Q([^Q]+)/g)) {
    const [ax, ay, bx, by] = nums(m[1]);
    for (let s = 1; s <= 10; s++) {
      const u = s / 10, v = 1 - u;
      pts.push([v * v * last[0] + 2 * v * u * ax + u * u * bx - cx, v * v * last[1] + 2 * v * u * ay + u * u * by - cy]);
    }
    last = [bx, by];
  }
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = cum[cum.length - 1];
  return { pts, along: cum.map(c => c / total) };
}
function bakeFigure(gl, k, line, T) {
  const E = Math.max(k.width, k.height) / 2 + 1.6, per = T / (2 * E), data = new Float32Array(T * T * 4), R = .42;
  for (let i = 0; i < T * T; i++) { data[i * 4] = 1; data[i * 4 + 1] = 2; }
  const { pts, along } = line, rp = Math.ceil(R * per);
  for (let s = 0; s + 1 < pts.length; s++) {
    const [ax, ay] = pts[s], [bx, by] = pts[s + 1], dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
    const x0 = Math.max(0, Math.floor((Math.min(ax, bx) + E) * per) - rp), x1 = Math.min(T - 1, Math.ceil((Math.max(ax, bx) + E) * per) + rp);
    const y0 = Math.max(0, Math.floor((Math.min(ay, by) + E) * per) - rp), y1 = Math.min(T - 1, Math.ceil((Math.max(ay, by) + E) * per) + rp);
    for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
      const px = (i + .5) / per - E, py = (j + .5) / per - E;
      const u = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2)), d = Math.hypot(px - ax - dx * u, py - ay - dy * u);
      if (d > R) continue;
      const o = (j * T + i) * 4;
      if (d < data[o]) data[o] = d;
      if (d > .125) continue;
      const t = along[s] + (along[s + 1] - along[s]) * u;
      if (t < data[o + 1]) data[o + 1] = t;
    }
  }
  const dots = k.dots.map(d => ({ x: d.x - k.width / 2, y: d.y - k.height / 2, beat: d.beat }));
  dots.forEach(d => {
    const size = d.beat === 0 ? .21 : .15, reach = .56, r = Math.ceil(reach * per), ci = Math.round((d.x + E) * per), cj = Math.round((d.y + E) * per);
    for (let j = Math.max(0, cj - r); j <= Math.min(T - 1, cj + r); j++) for (let i = Math.max(0, ci - r); i <= Math.min(T - 1, ci + r); i++) {
      const dd = Math.hypot((i + .5) / per - E - d.x, (j + .5) / per - E - d.y);
      if (dd > reach) continue;
      const o = (j * T + i) * 4;
      data[o + 2] = Math.max(data[o + 2], Math.exp(-(dd * dd) / (size * size)));
      if (dd < .46) data[o + 3] = (d.beat + 1) / 65;
    }
  });
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, T, T, 0, gl.RGBA, gl.FLOAT, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return { tex: t, E, dots, line };
}

const hex = s => { const m = /#([0-9a-f]{6})/i.exec(s) || [0, '808080'], n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => v / 255); };
const linear = c => c.map(v => Math.pow(v, 2.2));
const sparkOnce = { intro: false };

/* opts: th, stage (where the figure belongs), slab, copy, onFail. → { show(n, seed, { mode, met }), dispose } or null */
export function mountThreshold(opts) {
  const forced = (() => { try { return localStorage.getItem('vg-3d') === 'force'; } catch (e) { return false; } })();
  const { th, stage, slab, copy, onFail } = opts;
  const canvas = document.createElement('canvas');
  canvas.className = 'th-gl';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance', desynchronized: false });
  if (!gl) return null;
  const small = () => matchMedia('(max-width:980px)').matches;
  const hq = !matchMedia('(pointer:coarse)').matches && !small();
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  th.prepend(canvas);

  const prog = program(gl, VERT, FRAG, hq ? '#define HQ\n' : '');
  const grainProg = program(gl, GRAIN_V, GRAIN_F);
  const parallel = gl.getExtension('KHR_parallel_shader_compile');
  const uni = {}, grainUni = {};
  const vao = gl.createVertexArray();
  const noise = noiseTexture(gl, hq ? 512 : 256);

  // the grains: x, y, z, life
  const COUNT = 220, grains = new Float32Array(COUNT * 4), vel = new Float32Array(COUNT * 3);
  let nextGrain = 0;
  const grainVao = gl.createVertexArray(), grainBuf = gl.createBuffer();

  let alive = true, ready = false, failed = false, raf = 0, last = 0, firstDrawn = false;
  let fig = null, figKey = '', mode = 'live', met = false;
  const dotOn = new Float32Array(64), dotShown = new Float32Array(64);
  let progress = 1, ghost = 1, ghostTo = 1, playing = false, lastCycle = 0, flare = 0, intro = sparkOnce.intro || still ? 1 : 0;
  let rip = [0, 0, -100, 0];
  let dirty = true, visible = true, scale = 1, moving = 0;
  let timeBase = 0;
  const cam = { yaw: 0, pitch: 0, vy: 0, vp: 0, ty: 0, tp: 0, lean: 0, leanTo: 0, dragYaw: 0 };
  const view = { pos: [0, 0, 0], F: [0, 0, 0], R: [0, 0, 0], U: [0, 0, 0], shift: [0, 0], lens: [1, 1], D: 12, base: 0, cx: 0, cz: 0 };
  let flamePos = [3, 3.2, -4], basePos = [3.4, 0, -4];
  const colors = {};

  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const norm = a => { const l = Math.hypot(...a) || 1; return a.map(v => v / l); };
  const place = (yaw, pitch, D) => {
    const cp = Math.cos(pitch), pos = [view.cx + Math.sin(yaw) * cp * D, Math.sin(pitch) * D, view.cz + Math.cos(yaw) * cp * D];
    const F = norm([view.cx - pos[0], -pos[1], view.cz - pos[2]]), R = norm(cross(F, [0, 1, 0])), U = cross(R, F);
    return { pos, F, R, U };
  };
  const project = (c, x, y, z) => { const v = [x - c.pos[0], y - c.pos[1], z - c.pos[2]], d = dot(v, c.F); return [dot(v, c.R) / (d * view.lens[0]), dot(v, c.U) / (d * view.lens[1])]; };

  /* the camera that sets the figure in the stage's box, whatever its shape: its outer lobes may run off a screen edge, its dots may not */
  function frame() {
    if (!fig) return;
    const c = canvas.getBoundingClientRect(), s = stage.getBoundingClientRect();
    if (!c.width || !c.height) return;
    const wide = !small(), tanH = Math.tan(12.5 * Math.PI / 180), aspect = c.width / c.height;
    view.lens = [tanH * aspect, tanH];
    view.base = (wide ? 57 : 60) * Math.PI / 180;
    const xs = fig.dots.map(d => d.x), ys = fig.dots.map(d => d.y);
    const span = (a, min) => { const lo = Math.min(...a), hi = Math.max(...a), m = (lo + hi) / 2, half = Math.max((hi - lo) / 2, min); return [m - half, m + half]; };
    const [x0, x1] = span(xs, 2.5), [z0, z1] = span(ys, 1.6);
    const box = wide ? [x0 - 1.15, x1 + .62, z0 - 1.1, z1 + 1.1] : [x0 - .62, x1 + .62, z0 - 1.05, z1 + 1.05];
    view.cx = (x0 + x1) / 2; view.cz = (z0 + z1) / 2;
    const xa = (s.left - c.left) / c.width * 2 - 1, xb = (s.right - c.left) / c.width * 2 - 1;
    let yb = 1 - (s.top - c.top) / c.height * 2, ya = 1 - (s.bottom - c.top) / c.height * 2;
    if (wide) yb -= (yb - ya) * .30;   // the lamp stands behind the figure
    const measure = D => {
      const cc = place(0, view.base, D), pts = [[box[0], box[2]], [box[1], box[2]], [box[0], box[3]], [box[1], box[3]]].map(([x, z]) => project(cc, x, 0, z));
      const ux = pts.map(p => p[0]), uy = pts.map(p => p[1]);
      return { l: Math.min(...ux), r: Math.max(...ux), b: Math.min(...uy), t: Math.max(...uy) };
    };
    let lo = 4, hi = 120;
    for (let i = 0; i < 26; i++) { const D = (lo + hi) / 2, m = measure(D); if (m.r - m.l > xb - xa || m.t - m.b > yb - ya) lo = D; else hi = D; }
    // the lamp stands at the head of the figure, on the eye's axis, so it stands straight
    basePos = wide ? [view.cx, 0, z0 - 1.55] : [view.cx + 1.4, 0, z0 - 4.2];
    flamePos = [basePos[0] - .44 * LAMP, 3.04 * LAMP, basePos[2] + .12 * LAMP];
    let D = hi, m;
    for (let i = 0; i < 24; i++) {
      m = measure(D);
      view.shift = [wide ? xb - m.r : (xa + xb) / 2 - (m.l + m.r) / 2, wide ? ya + .03 - m.b : (ya + yb) / 2 - (m.b + m.t) / 2];
      if (!wide || project(place(0, view.base, D), basePos[0], LAMP_H + .22, basePos[2])[1] + view.shift[1] < .93) break;
      D *= 1.035;
    }
    view.D = D;
    dirty = true;
  }

  function size() {
    const box = th.getBoundingClientRect(), sl = slab.getBoundingClientRect();
    const foot = Math.abs(sl.bottom - box.bottom) < 2 ? sl.height : 0, h = Math.max(1, box.height - foot);
    canvas.style.height = h + 'px';
    const ratio = Math.min(window.devicePixelRatio || 1, hq ? 1.5 : 1.25) * scale;
    const w = Math.max(2, Math.round(box.width * ratio)), hh = Math.max(2, Math.round(h * ratio));
    if (canvas.width !== w || canvas.height !== hh) { canvas.width = w; canvas.height = hh; gl.viewport(0, 0, w, hh); }
    frame();
  }

  /* the theme's colours, as the page has them */
  function readColors() {
    const css = getComputedStyle(document.documentElement), tok = n => hex(css.getPropertyValue(n));
    const bg = tok('--bg'), light = bg[0] * .3 + bg[1] * .6 + bg[2] * .1 > .5;
    Object.assign(colors, {
      light, floor: linear(bg), flour: linear(tok('--flour')), turm: linear(tok('--saffron')), tint: light ? bg : bg.map(v => v * .72),
      room: light ? [1, .98, .92] : [.34, .24, .18], amb: light ? .93 : .62, fill: light ? 1.0 : (hq ? .52 : .78), lamp: light ? .12 : 1.9, gloss: light ? .10 : 1.1, linear: light ? 1 : 0, mottle: light ? .10 : 1
    });
    dirty = true;
  }

  function spawn(x, y, z, vx, vy, vz, life) {
    const i = nextGrain; nextGrain = (nextGrain + 1) % COUNT;
    grains[i * 4] = x; grains[i * 4 + 1] = y; grains[i * 4 + 2] = z; grains[i * 4 + 3] = life;
    vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz;
  }
  const headAt = t => {
    const { pts, along } = fig.line;
    let lo = 0, hi = along.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (along[m] <= t) lo = m; else hi = m; }
    return pts[lo];
  };
  const puff = (x, z, n, force) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = (.2 + Math.random()) * force;
      spawn(x + Math.cos(a) * .12, .03, z + Math.sin(a) * .12, Math.cos(a) * s, (.5 + Math.random()) * force * 1.4, Math.sin(a) * s, 1 + Math.random() * .5);
    }
  };
  const ring = (x, z, power) => { rip = [x, z, 0, power]; flare = Math.max(flare, power); };
  const sam = () => { if (fig && fig.dots[0]) { ring(fig.dots[0].x, fig.dots[0].y, 1); if (!still) puff(fig.dots[0].x, fig.dots[0].y, 46, 1.1); } };

  // the music lays the line
  const offClock = onClock(c => {
    if (mode !== 'live' || !fig) return;
    if (!c) { if (playing) { playing = false; ghostTo = 1; progress = 1; dotOn.fill(1); lastCycle = 0; dirty = true; } return; }
    if (c.beats < 0) return;
    const n = fig.n;
    playing = true; ghostTo = .14;
    const cycle = ((c.beats % n) + n) % n, at = still ? Math.floor(cycle) : cycle, round = Math.floor(c.beats / n);
    if (round > lastCycle) { lastCycle = round; sam(); }
    progress = c.beats >= n && cycle < .75 ? 1 : lineAt(fig.k, at);
    const beat = Math.floor(cycle);
    for (let i = 0; i < n; i++) dotOn[i] = i <= beat ? 1 : 0;
    dirty = true;
  });

  // the pointer: the eye, the flame, the dots
  let drag = null, hoverDot = -1, lastX = 0, lastT = 0;
  const floorPoint = e => {
    const r = canvas.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width * 2 - 1 - view.shift[0], ny = 1 - (e.clientY - r.top) / r.height * 2 - view.shift[1];
    const d = norm([0, 1, 2].map(i => view.F[i] + view.R[i] * nx * view.lens[0] + view.U[i] * ny * view.lens[1]));
    if (d[1] >= -.001) return null;
    const t = -view.pos[1] / d[1];
    return [view.pos[0] + d[0] * t, view.pos[2] + d[2] * t];
  };
  const dotUnder = e => {
    if (!fig) return -1;
    const p = floorPoint(e); if (!p) return -1;
    let best = -1, near = .62;
    fig.dots.forEach((d, i) => { const g = Math.hypot(d.x - p[0], d.y - p[1]); if (g < near) { near = g; best = i; } });
    return best;
  };
  const onMove = e => {
    if (still) return;
    const r = canvas.getBoundingClientRect(), nx = Math.max(-1, Math.min(1, (e.clientX - r.left) / r.width * 2 - 1)), ny = Math.max(-1, Math.min(1, (e.clientY - r.top) / r.height * 2 - 1));
    if (e.pointerType !== 'touch') { cam.ty = nx * .075; cam.tp = -ny * .03; }
    const t = performance.now(), v = (e.clientX - lastX) / Math.max(8, t - lastT); lastX = e.clientX; lastT = t;
    cam.leanTo = Math.max(-1, Math.min(1, nx * .25 + v * .22));
    moving = 1;
    if (drag) {
      const dx = e.clientX - drag.x; if (Math.abs(dx) > 5) drag.moved = true;
      cam.dragYaw = Math.max(-.62, Math.min(.62, drag.yaw - dx * .0042));
    } else if (e.target === canvas && e.pointerType !== 'touch') {
      hoverDot = dotUnder(e);
      canvas.style.cursor = hoverDot >= 0 ? 'pointer' : '';
    }
  };
  const onDown = e => { if (e.button) return; drag = { x: e.clientX, yaw: cam.dragYaw, moved: false, dot: dotUnder(e) }; try { canvas.setPointerCapture(e.pointerId); } catch (x) { /* it went */ } if (!still) canvas.classList.add('held'); };
  const onUp = () => {
    if (!drag) return;
    const d = drag; drag = null; cam.dragYaw = cam.dragYaw * .999; canvas.classList.remove('held');
    if (!d.moved && d.dot >= 0 && fig) { const g = fig.dots[d.dot]; tick(g.beat === 0); ring(g.x, g.y, .55); if (!still) puff(g.x, g.y, 18, .7); dirty = true; }
  };
  const onLeave = () => { cam.ty = 0; cam.tp = 0; cam.leanTo = 0; hoverDot = -1; };
  th.addEventListener('pointermove', onMove);
  th.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  const ro = new ResizeObserver(size); ro.observe(th); ro.observe(slab); ro.observe(stage);
  const io = new IntersectionObserver(es => { visible = es[es.length - 1].isIntersecting; }, { threshold: 0 }); io.observe(canvas);
  const mo = new MutationObserver(readColors); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const scheme = matchMedia('(prefers-color-scheme: light)'); scheme.addEventListener('change', readColors);

  function fail() {
    if (failed) return;
    failed = true;
    dispose();
    if (onFail) onFail();
  }
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); fail(); });

  function linkDone() {
    if (parallel && !gl.getProgramParameter(prog, parallel.COMPLETION_STATUS_KHR)) return false;
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS) || !gl.getProgramParameter(grainProg, gl.LINK_STATUS)) {
      console.warn('[threshold]', gl.getProgramInfoLog(prog));
      fail();
      return false;
    }
    gl.useProgram(prog);
    ['uMottle', 'uFall', 'uRes', 'uCam', 'uR', 'uU', 'uF', 'uLens', 'uShift', 'uTime', 'uLean', 'uFlare', 'uLamp', 'uAmb', 'uFill', 'uGloss', 'uLinear', 'uIntro', 'uE', 'uProg', 'uGhost', 'uShowFlame', 'uFlame', 'uBase', 'uRoom', 'uFloorC', 'uFlour', 'uTurm', 'uLineC', 'uTint', 'uRip', 'uCopy', 'uDotOn', 'uMap', 'uNoise'].forEach(n => { uni[n] = gl.getUniformLocation(prog, n); });
    ['uCam', 'uR', 'uU', 'uF', 'uLens', 'uShift', 'uRes', 'uFlour'].forEach(n => { grainUni[n] = gl.getUniformLocation(grainProg, n); });
    gl.bindVertexArray(grainVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, grainBuf);
    gl.bufferData(gl.ARRAY_BUFFER, grains, gl.DYNAMIC_DRAW);
    const a = gl.getAttribLocation(grainProg, 'aP');
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 4, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    ready = true;
    return true;
  }

  function step(dt, now) {
    // the eye: a soft spring
    const k = 16, c = 6.5;
    cam.vy += (cam.ty + cam.dragYaw - cam.yaw) * k * dt - cam.vy * c * dt;
    cam.vp += (cam.tp - cam.pitch) * k * dt - cam.vp * c * dt;
    cam.yaw += cam.vy * dt; cam.pitch += cam.vp * dt;
    cam.lean += (cam.leanTo - cam.lean) * Math.min(1, dt * 3.5);
    cam.leanTo *= Math.exp(-dt * 1.2);
    if (!drag && Math.abs(cam.dragYaw) > .0005) cam.dragYaw *= Math.exp(-dt * .9);
    ghost += (ghostTo - ghost) * Math.min(1, dt * 7);
    flare *= Math.exp(-dt * 3.2);
    if (rip[3] > .002) { rip[2] += dt; rip[3] *= Math.exp(-dt * 1.3); }
    for (let i = 0; i < 64; i++) dotShown[i] += (dotOn[i] - dotShown[i]) * Math.min(1, dt * 12);
    if (intro < 1) { intro = Math.min(1, intro + dt / 1.5); if (intro === 1) sparkOnce.intro = true; }
    // grains fall where the head of the line is
    if (playing && fig && !still && progress < 1) {
      const [hx, hz] = headAt(progress);
      for (let i = 0; i < 2; i++) spawn(hx + (Math.random() - .5) * .16, .55 + Math.random() * .75, hz + (Math.random() - .5) * .16, (Math.random() - .5) * .1, -1.1 - Math.random() * .4, (Math.random() - .5) * .1, 1.1);
    }
    for (let i = 0; i < COUNT; i++) {
      if (grains[i * 4 + 3] <= 0) continue;
      vel[i * 3 + 1] -= 2.6 * dt;
      grains[i * 4] += vel[i * 3] * dt; grains[i * 4 + 1] += vel[i * 3 + 1] * dt; grains[i * 4 + 2] += vel[i * 3 + 2] * dt;
      grains[i * 4 + 3] -= dt * .55;
      if (grains[i * 4 + 1] < 0) grains[i * 4 + 3] = 0;
    }
    void now;
  }

  function draw(now) {
    const c = place(view.base === 0 ? 0 : cam.yaw, view.base + cam.pitch, view.D);
    view.pos = c.pos; view.F = c.F; view.R = c.R; view.U = c.U;
    const t = still ? 0 : (now - timeBase) / 1000;
    // the flame breathes, and now and then catches
    const breath = still ? 1 : 1 + .05 * Math.sin(t * 2.1) + .035 * Math.sin(t * 5.7 + 1.3) + .022 * Math.sin(t * 13.3 + .4);
    const lit = colors.lamp * breath * (1 + flare * .5) * (.0 + intro * intro);
    gl.useProgram(prog);
    gl.bindVertexArray(vao);
    gl.uniform2f(uni.uRes, canvas.width, canvas.height);
    gl.uniform3fv(uni.uCam, c.pos); gl.uniform3fv(uni.uR, c.R); gl.uniform3fv(uni.uU, c.U); gl.uniform3fv(uni.uF, c.F);
    gl.uniform2fv(uni.uLens, view.lens); gl.uniform2fv(uni.uShift, view.shift);
    const box = canvas.getBoundingClientRect(), cr = copy.getBoundingClientRect(), sx = canvas.width / box.width, sy = canvas.height / box.height;
    gl.uniform1f(uni.uMottle, colors.mottle); gl.uniform1f(uni.uFall, (small() ? 70 : 300) * sy);
    gl.uniform1f(uni.uTime, t); gl.uniform1f(uni.uLean, cam.lean); gl.uniform1f(uni.uLamp, lit);
    gl.uniform1f(uni.uAmb, colors.amb); gl.uniform1f(uni.uFill, colors.fill); gl.uniform1f(uni.uGloss, colors.gloss); gl.uniform1f(uni.uLinear, colors.linear);
    gl.uniform1f(uni.uIntro, intro); gl.uniform1f(uni.uE, fig.E); gl.uniform1f(uni.uProg, progress); gl.uniform1f(uni.uGhost, ghost);
    gl.uniform1f(uni.uShowFlame, hq ? 1 : 0);
    gl.uniform3fv(uni.uFlame, flamePos); gl.uniform3fv(uni.uBase, basePos); gl.uniform3fv(uni.uRoom, colors.room);
    gl.uniform3fv(uni.uFloorC, colors.floor); gl.uniform3fv(uni.uFlour, colors.flour); gl.uniform3fv(uni.uTurm, colors.turm);
    gl.uniform3fv(uni.uLineC, met ? colors.turm : colors.flour); gl.uniform3fv(uni.uTint, colors.tint);
    gl.uniform4f(uni.uRip, rip[0], rip[1], rip[2], rip[3]);
    gl.uniform1fv(uni.uDotOn, dotShown);
    // the words' rectangle, measured from the bottom of the canvas as the shader counts
    gl.uniform4f(uni.uCopy, (cr.left + cr.width / 2 - box.left) * sx, canvas.height - (cr.top + cr.height / 2 - box.top) * sy, cr.width / 2 * sx, cr.height / 2 * sy);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fig.tex); gl.uniform1i(uni.uMap, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, noise); gl.uniform1i(uni.uNoise, 1);
    gl.disable(gl.BLEND);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!still) {
      gl.useProgram(grainProg);
      gl.uniform3fv(grainUni.uCam, c.pos); gl.uniform3fv(grainUni.uR, c.R); gl.uniform3fv(grainUni.uU, c.U); gl.uniform3fv(grainUni.uF, c.F);
      gl.uniform2fv(grainUni.uLens, view.lens); gl.uniform2fv(grainUni.uShift, view.shift);
      gl.uniform2f(grainUni.uRes, canvas.width, canvas.height); gl.uniform3fv(grainUni.uFlour, colors.light ? colors.flour : [.95, .9, .78]);
      gl.bindVertexArray(grainVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, grainBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, grains);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.POINTS, 0, COUNT);
      gl.bindVertexArray(null);
    }
  }

  // how the device is keeping up: first a coarser picture, then the plain page
  const LEVELS = [1, .78, .6, .46];
  let level = 0, count = 0, frames = 0, spent = 0;
  function governor(dt) {
    if (forced || still) return;
    frames++;
    if (frames < 6) return;                 // the first frames carry the compiling and the baking
    spent += dt; count++;
    if (count < 40 && spent < 1.5) return;  // a second and a half, or forty frames, whichever comes first
    const avg = spent / count; count = 0; spent = 0;
    if (avg > (level === LEVELS.length - 1 ? .07 : .045)) {
      if (level === LEVELS.length - 1) { fail(); return; }
      level++; scale = LEVELS[level]; size(); frames = 0;
    }
  }

  function loop(now) {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    if (!ready && !linkDone()) return;
    if (!fig || !visible || !colors.floor) return;
    const raw = (now - last) / 1000;
    // with nothing moving, half the frames do: the flame is slow and batteries are not endless
    if (!still && !playing && !moving && !drag && raw < .03) return;
    if (still && !dirty) return;
    last = now;
    const dt = Math.min(.05, raw);
    moving = 0;
    step(still ? 1 : dt, now);
    draw(now);
    dirty = false;
    if (!firstDrawn) { firstDrawn = true; requestAnimationFrame(() => { if (alive) th.classList.add('has-3d'); }); }
    if (raw < 3) governor(raw);   // longer than that, the tab was away
  }

  function show(n, seed, o) {
    const m = (o && o.mode) || 'live';
    mode = m; met = !!(o && o.met);
    const key = n + '|' + seed + '|' + (small() ? 1 : 0);
    if (key !== figKey) {
      figKey = key;
      const k = kolam(n, { seed }), line = lineOf(k);
      const was = fig;
      fig = bakeFigure(gl, k, line, small() ? 768 : 1024);
      fig.k = k; fig.n = n;
      if (was) gl.deleteTexture(was.tex);
      size();
    }
    playing = false; lastCycle = 0;
    progress = m === 'dots' ? -1 : 1;
    ghost = ghostTo = m === 'dots' ? 0 : 1;
    dotOn.fill(1); dotShown.fill(1);
    dirty = true;
  }

  function dispose() {
    if (!alive) return;
    alive = false;
    cancelAnimationFrame(raf);
    offClock();
    th.removeEventListener('pointermove', onMove);
    th.removeEventListener('pointerleave', onLeave);
    ro.disconnect(); io.disconnect(); mo.disconnect(); scheme.removeEventListener('change', readColors);
    th.classList.remove('has-3d');
    canvas.remove();
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
  }

  timeBase = performance.now();
  readColors();
  raf = requestAnimationFrame(loop);
  return { show, dispose };
}
