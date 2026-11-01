/* Draws the app's install icons (app/icons/*.png) from the logo in app/favicon.svg: the saffron wave on the
   night-blue tile. PNGs are written with node:zlib; no image library. Run: node scripts/make-icons.js
     icon-192.png, icon-512.png   a rounded tile with transparent corners (purpose "any")
     maskable-512.png             full bleed, the wave inside the central safe zone (purpose "maskable") */
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'app', 'icons');
const BG = [0x0e, 0x10, 0x22], WAVE = [0xf2, 0xa9, 0x3b];

// the favicon's path, M5 18 c3-8 5-8 7 0 s4 8 6 0 4-8 6 0 3 4 3 4, as cubic segments in its 32-unit box
const CUBICS = [[[5, 18], [8, 10], [10, 10], [12, 18]], [[12, 18], [14, 26], [16, 26], [18, 18]], [[18, 18], [20, 10], [22, 10], [24, 18]], [[24, 18], [26, 26], [27, 22], [27, 22]]];
const bez = ([a, b, c, d], t) => { const u = 1 - t; return [0, 1].map(i => u * u * u * a[i] + 3 * u * u * t * b[i] + 3 * u * t * t * c[i] + t * t * t * d[i]); };
const POINTS = [].concat(...CUBICS.map(cb => Array.from({ length: 41 }, (_, k) => bez(cb, k / 40))));
function distToPath(x, y) {
  let best = Infinity;
  for (let i = 1; i < POINTS.length; i++) {
    const [ax, ay] = POINTS[i - 1], [bx, by] = POINTS[i], dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
    const t = L ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L)) : 0, ex = ax + t * dx - x, ey = ay + t * dy - y;
    best = Math.min(best, ex * ex + ey * ey);
  }
  return Math.sqrt(best);
}
const cover = (d, aa) => Math.max(0, Math.min(1, 0.5 - d / aa));

function draw(size, maskable) {
  const px = Buffer.alloc(size * size * 4), s = size / 32;
  // the wave's box: the whole 32-unit tile, or its central 70% for a maskable icon
  const scale = maskable ? 0.7 : 1, off = (1 - scale) * 16;
  const r = maskable ? 0 : 8 * s;   // the tile's corner radius (the favicon's rx 8)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const cx = x + 0.5, cy = y + 0.5;
    // the rounded tile: signed distance to a rounded square
    let a = 1;
    if (r) { const qx = Math.max(Math.abs(cx - size / 2) - (size / 2 - r), 0), qy = Math.max(Math.abs(cy - size / 2) - (size / 2 - r), 0); a = cover(Math.hypot(qx, qy) - r, 1); }
    const u = ((cx / s) - off) / scale, v = ((cy / s) - off) / scale;
    const w = cover(distToPath(u, v) - 1.2, 1 / (s * scale));   // stroke width 2.4
    const i = (y * size + x) * 4;
    for (let c = 0; c < 3; c++) px[i + c] = Math.round(BG[c] + (WAVE[c] - BG[c]) * w);
    px[i + 3] = Math.round(255 * a);
  }
  return png(size, size, px);
}

const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = buf => { let c = -1; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function chunk(type, data) { const len = Buffer.alloc(4), t = Buffer.from(type), crc = Buffer.alloc(4); len.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([t, data]))); return Buffer.concat([len, t, data, crc]); }
function png(w, h, rgba) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;   // 8-bit RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

fs.mkdirSync(OUT, { recursive: true });
for (const [name, size, mask] of [['icon-192.png', 192, false], ['icon-512.png', 512, false], ['maskable-512.png', 512, true]]) {
  const b = draw(size, mask); fs.writeFileSync(path.join(OUT, name), b);
  console.log('app/icons/' + name + '  ' + (b.length / 1024).toFixed(1) + ' KB');
}
