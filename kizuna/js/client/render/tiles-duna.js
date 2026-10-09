// 第4章 Step 6 の タイル（16×16 ドット）: 砂の海（金色の 砂の 波が ゆっくり 東へ ながれる）・砂クジラの ねどこの 砂の うず
// render/tiles-ch4.js が まぜる。2.5D は render/field3d.js（砂の海は うごく 地面、うずは ねどこ ぜんたいで 1まいの え）
// (p, v, f, m) … Painter / ちがい（うずは ねどこの まん中からの ずれ）/ アニメの コマ / となりの ようす（岸）
import { T } from '../../shared/tiles.js?v=b2a0d9b4a2ff';
import { makeCanvas, ctxOf, prand } from './pixel.js?v=b2a0d9b4a2ff';

const SEA = {
  base: '#d4a050', deep: '#bc8640', trough: '#a8743a', crest: '#ecc272', foam: '#f8dc9c', glint: '#fff2cc',
  shore: '#e8c886', shoreL: '#f6e2aa',
};
export const SAND_SEA_FRAMES = 4;

// 砂の海: 2本の 波がしら（よこ 16ドットで つながる）。コマごとに 4ドット 東へ ながれる。となりが 陸の がわは 明るい 砂の ふち
// m … 1=北 2=東 4=南 8=西 が 陸
export function paintSandSea(p, v, f, m = 0) {
  p.rect(0, 0, 16, 16, SEA.base);
  const r = prand(v * 37 + 5);
  for (let i = 0; i < 8; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? SEA.deep : SEA.crest);
  const shift = (f % SAND_SEA_FRAMES) * 4;
  for (const [y0, amp, ph] of [[4, 1.2, 0], [11, 1.4, 6]]) {
    for (let x = 0; x < 16; x++) {
      const u = (x + 16 - shift + ph) % 16;
      const y = y0 + Math.round(Math.sin((u / 16) * Math.PI * 2) * amp);
      p.set(x, y + 1, SEA.trough);
      p.set(x, y, SEA.crest);
      if (u < 3) p.set(x, y - 1, SEA.foam);
    }
  }
  if ((v & 3) === 0) p.set((5 + shift) & 15, 8, SEA.glint);
  if (m & 1) { p.hline(0, 15, 0, SEA.shoreL); p.hline(0, 15, 1, SEA.shore); }
  if (m & 4) p.hline(0, 15, 15, SEA.shore);
  if (m & 8) { p.vline(0, 0, 15, SEA.shoreL); p.vline(1, 0, 15, SEA.shore); }
  if (m & 2) p.vline(15, 0, 15, SEA.shore);
}

// ───── 砂の うず（砂クジラの ねどこ。c4_whale で しずまる）─────
const WHIRL = ['#5e3a1e', '#7a4e28', '#956434', '#b07a40', '#c8924c', '#dcaa5e', '#ecc272', '#f8dc9c'];
export const SAND_WHIRL_FRAMES = 8;
// うずの まん中からの ずれ（ドット）での 色。3本の うでが まわる。まん中ほど こい
function whirlColor(gx, gy, f) {
  const r = Math.hypot(gx, gy);
  const a = Math.atan2(gy, gx);
  const s = Math.sin(a * 3 - r * 0.3 + (f % SAND_WHIRL_FRAMES) * (Math.PI / 4));
  const k = Math.max(0, 1 - r / 40);
  const i = Math.round(4.6 + s * 2 - k * 4.2);
  return WHIRL[Math.max(0, Math.min(WHIRL.length - 1, i))];
}
// 2D: v … ねどこの まん中の マスからの ずれ（下4ビット x+8・上4ビット y+8。whirlVariant）
export function paintSandWhirl(p, v, f) {
  const dx = (v & 15) - 8, dy = ((v >> 4) & 15) - 8;
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p.set(x, y, whirlColor(dx * 16 + x - 7.5, dy * 16 + y - 7.5, f));
}
// render/tiles.js の prepareMap: うずの マスの ちがい（map.whirl … ねどこの まん中の マス）
export function whirlVariant(t, map, x, y, v) {
  if (t !== T.SAND_WHIRL || !map?.whirl) return v;
  return ((x - map.whirl.x + 8) & 15) | (((y - map.whirl.y + 8) & 15) << 4);
}
// 2.5D: ねどこ ぜんたいの うず（n マス × n マス。まん中が ねどこの まん中の マス）
export function whirlCanvas(f, n = 5) {
  const S = n * 16;
  const c = makeCanvas(S, S);
  const x = ctxOf(c);
  for (let py = 0; py < S; py++) {
    for (let px = 0; px < S; px++) {
      x.fillStyle = whirlColor(px - S / 2 + 0.5, py - S / 2 + 0.5, f);
      x.fillRect(px, py, 1, 1);
    }
  }
  return c;
}

export const DUNA_PAINTERS = {
  [T.SAND_SEA]: paintSandSea,
  [T.SAND_WHIRL]: paintSandWhirl,
};
export const DUNA_FRAMES = { [T.SAND_SEA]: SAND_SEA_FRAMES, [T.SAND_WHIRL]: SAND_WHIRL_FRAMES };
export const DUNA_SPEED = { [T.SAND_SEA]: 360, [T.SAND_WHIRL]: 130 };

// 岸: となりが 砂の 海でも うずでも 砂嵐でも ない（陸・さんばし）がわ。1=北 2=東 4=南 8=西（あてはまらない タイルは -1）
const SEAISH = new Set([T.SAND_SEA, T.SAND_WHIRL, T.SANDSTORM]);
export function dunaMask(t, at, x, y) {
  if (t !== T.SAND_SEA) return -1;
  const land = (dx, dy) => { const n = at(x + dx, y + dy); return n !== -1 && !SEAISH.has(n); };
  return (land(0, -1) ? 1 : 0) | (land(1, 0) ? 2 : 0) | (land(0, 1) ? 4 : 0) | (land(-1, 0) ? 8 : 0);
}
