// PWA用アイコン生成: 星環エンブレムを描画し、依存ライブラリなしでPNGへエンコードする。
// 使い方: node scripts/gen-icons.mjs  → public/icons/*.png を出力

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';

// ---- 最小PNGエンコーダ (RGBA / 8bit) ----

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0; // filter: none
    rgba.copy(raw, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- 描画 ----

function hex(c) {
  return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
}

function drawIcon(size) {
  const buf = Buffer.alloc(size * size * 4);
  const set = (x, y, [r, g, b]) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    buf[i] = r;
    buf[i + 1] = g;
    buf[i + 2] = b;
    buf[i + 3] = 255;
  };
  const BG = hex('#0e1428');
  const BG2 = hex('#141c36');
  const SILVER = hex('#c8ccd8');
  const SILVER_D = hex('#8a98c0');
  const GOLD = hex('#f0d060');
  const GEMS = ['#7ac858', '#e05050', '#50a0e0', '#e0d050', '#b070e0', '#e08a30', '#c8ccd8'].map(hex);

  // 背景(マスカブル対応の全面塗り + うっすら放射)
  const c = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - c, y - c) / c;
      set(x, y, d < 0.72 ? BG2 : BG);
    }
  }
  // 星屑(決定的)
  let seed = 20260726;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return (seed >>> 16) / 65536;
  };
  const px = Math.max(1, Math.round(size / 128));
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(rand() * size);
    const y = Math.floor(rand() * size);
    const col = rand() > 0.7 ? SILVER : SILVER_D;
    for (let dy = 0; dy < px; dy++) for (let dx = 0; dx < px; dx++) set(x + dx, y + dy, col);
  }
  // 欠けた星環
  const R = size * 0.34;
  const T = size * 0.085;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - c;
      const dy = y - c;
      const d = Math.hypot(dx, dy);
      if (d < R - T || d > R) continue;
      let a = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (a < 0) a += 360;
      if (a > 300 && a < 330) continue; // 砕けて欠けた部分
      set(x, y, d < R - T * 0.45 ? SILVER_D : SILVER);
    }
  }
  // 七つの環晶
  const gem = Math.max(2, Math.round(size * 0.055));
  for (let i = 0; i < 7; i++) {
    const rad = ((i * 51 - 90) * Math.PI) / 180;
    const gx = Math.round(c + Math.cos(rad) * (R - T / 2));
    const gy = Math.round(c + Math.sin(rad) * (R - T / 2));
    for (let dy = -gem; dy <= gem; dy++) {
      for (let dx = -gem; dx <= gem; dx++) {
        if (Math.abs(dx) + Math.abs(dy) <= gem) set(gx + dx, gy + dy, GEMS[i]); // ひし形
      }
    }
  }
  // 中央の星印
  const s = Math.max(2, Math.round(size * 0.07));
  for (let d = -s; d <= s; d++) {
    const w = Math.max(1, Math.round((s - Math.abs(d)) * 0.45));
    for (let t2 = -w; t2 <= w; t2++) {
      set(c + d, c + t2, GOLD);
      set(c + t2, c + d, GOLD);
    }
  }
  return encodePng(size, size, buf);
}

mkdirSync(new URL('../public/icons', import.meta.url).pathname, { recursive: true });
for (const size of [512, 192, 180]) {
  const png = drawIcon(size);
  const path = new URL(`../public/icons/icon-${size}.png`, import.meta.url).pathname;
  writeFileSync(path, png);
  console.log(`wrote ${path} (${png.length} bytes)`);
}
