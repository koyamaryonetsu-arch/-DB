// ホーム画面の アイコンを つくる（ドット絵の 紋章）
// つかいかた: node tools/make-icons.mjs   → public/icons/*.png
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'icons');

// 32x32 の ドット絵を かく
const N = 32;
const px = new Array(N * N).fill(null);
const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < N && y < N) px[y * N + x] = c; };
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 255];

// よぞら
for (let y = 0; y < N; y++) {
  for (let x = 0; x < N; x++) {
    const t = y / (N - 1);
    set(x, y, [Math.round(11 + 30 * t), Math.round(15 + 12 * t), Math.round(42 + 60 * t), 255]);
  }
}
for (const [x, y] of [[4, 4], [27, 6], [6, 25], [25, 26], [3, 15], [29, 18], [14, 2]]) set(x, y, hex('#c9d4ff'));

// きんの わ
const cx = 15.5, cy = 15.5;
for (let y = 0; y < N; y++) {
  for (let x = 0; x < N; x++) {
    const d = Math.hypot(x - cx, y - cy);
    if (d >= 11.2 && d < 13.3) set(x, y, d < 12.2 ? hex('#ffd66b') : hex('#b3822a'));
    else if (d < 11.2) set(x, y, hex('#3a2a8c'));
  }
}
// わの かざり（4つの たま）
for (const [x, y] of [[15, 3], [16, 3], [15, 28], [16, 28], [3, 15], [3, 16], [28, 15], [28, 16]]) set(x, y, hex('#fff2b8'));

// ほし（5つの とがり）
const star = (x, y) => {
  const ang = Math.atan2(y - cy, x - cx) + Math.PI / 2; // 0 = まうえ
  const d = Math.hypot(x - cx, y - cy);
  const k = ((((ang / (Math.PI * 2)) * 5) % 1) + 1) % 1;
  const f = Math.abs(k - 0.5) * 2; // 1: とがり 0: くぼみ
  const r = 4.1 + f * 5.6;
  return d <= r;
};
for (let y = 0; y < N; y++) {
  for (let x = 0; x < N; x++) {
    if (!star(x + 0.5, y + 0.5)) continue;
    const light = (x + y) < 30;
    set(x, y, light ? hex('#fffbe8') : hex('#ffe08a'));
  }
}
// ほしの ふち
const edge = px.slice();
for (let y = 0; y < N; y++) {
  for (let x = 0; x < N; x++) {
    if (star(x + 0.5, y + 0.5)) continue;
    const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => star(x + dx + 0.5, y + dy + 0.5));
    if (near && Math.hypot(x - cx, y - cy) < 11.2) edge[y * N + x] = hex('#6a4a12');
  }
}

function png(size) {
  const k = size / N;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const c = edge[Math.floor(y / k) * N + Math.floor(x / k)];
      raw.set(c, y * (size * 4 + 1) + 1 + x * 4);
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const TABLE = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
function crc32(buf) {
  let c = -1;
  for (const b of buf) c = TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return c ^ -1;
}

fs.mkdirSync(OUT, { recursive: true });
for (const size of [180, 192, 512]) {
  fs.writeFileSync(path.join(OUT, `icon-${size}.png`), png(size));
  console.log(`icons/icon-${size}.png`);
}
