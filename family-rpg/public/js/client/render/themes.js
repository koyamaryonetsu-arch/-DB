// 色の かえかた（宝の洞窟の しゅるい・第3章の 氷と 火の 洞窟・第4章の 砂の 洞窟と 地下水路・洞窟の 主の 色ちがい）
// もとの ドット絵は そのままに、明るさを たもって 色だけ かえる
import { T } from '../../shared/tiles.js';
import { makeCanvas, ctxOf } from './pixel.js';
import { CANAL_CTX, CANAL_CTX_TILES } from './tiles-canal.js';

// どの 部分か（ゆか・かべ・水）
const PART_OF_TILE = {
  [T.CAVE_WALL]: 'wall', [T.TORCH]: 'wall', [T.CAVE_WATER]: 'water', [T.CAVE_BRIDGE]: 'water',
};
const PART_OF_EXTRA = { cave_top: 'wall', cave_side: 'wall', stone_top: 'floor', pillar_side: 'floor', cave_plank: 'floor', dark_hole: 'none' };
// 第3章の タイル（氷・ようがん・レバー など）は 色を かえない（もとから その 場所の 色）
for (const id of [T.SNOW, T.SNOW_PATH, T.DEEP_SNOW, T.SNOW_PINE, T.SNOW_ROCK, T.ICE, T.ICE_BLOCK, T.LAVA, T.LAVA_FLOOR, T.OBSIDIAN,
  T.RAIL, T.LEVER, T.LEVER_ON, T.PLATE, T.PLATE_ON, T.BRAZIER, T.BRAZIER_LIT, T.HOT_SPRING, T.SNOW_WALL, T.FLAME_WALL, T.ASH,
  T.MINE_BEAM, T.ICE_WALL, T.DRAGON_GATE, T.CHASM, T.RAIL_BRIDGE, T.RAIL_STOP, T.ASH_ROCK]) PART_OF_TILE[id] = 'none';
for (const name of ['snow_top', 'snow_side', 'ice_top', 'ice_side', 'ash_top', 'ashrock_side', 'beam_side', 'gate_side', 'flame_side', 'snowrock_side']) PART_OF_EXTRA[name] = 'none';
// 第4章の タイル（砂ばく・砂丘・砂岩・ヤシ・サボテン・日干しれんが・砂嵐・古井戸）も もとの 色の まま
for (const id of [T.DESERT, T.DUNE, T.SANDSTONE, T.PALM, T.CACTUS, T.ADOBE, T.SANDSTORM, T.WELL_HOLE]) PART_OF_TILE[id] = 'none';
for (const name of ['sandstone_top', 'sandstone_side', 'adobe_side', 'wall_top_adobe', 'dune_top']) PART_OF_EXTRA[name] = 'none';
// 第4章 Step 2（かれた地下水路）の タイルと 2.5D の え も もとの 色の まま
for (const id of [T.CANAL_FLOOR, T.CANAL_WALL, T.CANAL_BED, T.CANAL_WATER, T.SLUICE, T.SLUICE_OPEN, T.GRATE, T.DAM]) PART_OF_TILE[id] = 'none';
for (const name of ['canal_side', 'canal_wall_side', 'canal_wall_top', 'canal_wall_top_sun', 'dam_top', 'sluice_top', 'sluice_board', 'canal_pillar_side', 'canal_pillar_top']) PART_OF_EXTRA[name] = 'none';
// mask … 地下水路の え で かいた たいまつ・レバー・かいだん など（mask の CANAL_CTX）も 色を かえない
export const partOfTile = (id, mask = 0) => (mask & CANAL_CTX && CANAL_CTX_TILES.has(id) ? 'none' : PART_OF_TILE[id] || 'floor');
export const partOfExtra = (name) => PART_OF_EXTRA[name] || 'floor';
// 2.5D の たてた もの（レバー など）。地下水路では 2D と おなじ ように レバーの 色を かえない
export const partOfProp = (id, theme) => (theme === 'canal' ? partOfTile(id) : 'floor');

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const G = (...stops) => stops.map(([p, h]) => [p, hex(h)]);
function grad(stops, t) {
  t = Math.max(0, Math.min(1, t));
  for (let i = 1; i < stops.length; i++) {
    const [p1, c1] = stops[i];
    if (t <= p1) {
      const [p0, c0] = stops[i - 1];
      const k = (t - p0) / Math.max(1e-6, p1 - p0);
      return [0, 1, 2].map((j) => Math.round(c0[j] + (c1[j] - c0[j]) * k));
    }
  }
  return stops[stops.length - 1][1];
}

const ICE = {
  floor: G([0, '#35557f'], [0.3, '#7ea2cf'], [0.55, '#c3dcf2'], [1, '#ffffff']),
  wall: G([0, '#0d1a33'], [0.25, '#284872'], [0.5, '#5f89bf'], [1, '#d6ecff']),
  water: G([0, '#0a2f5a'], [0.35, '#2a78b8'], [0.7, '#8fdcf6'], [1, '#ffffff']),
  gem: G([0, '#2a78b8'], [0.5, '#9ee8ff'], [1, '#ffffff']),
  flame: G([0, '#2a78b8'], [0.5, '#7ae0ff'], [1, '#f0fcff']),
};
const LAVA = {
  floor: G([0, '#1c0a06'], [0.2, '#4a2014'], [0.4, '#7a3c22'], [0.7, '#b0683e'], [1, '#f0b078']),
  wall: G([0, '#0a0404'], [0.2, '#2e140c'], [0.45, '#5a2818'], [1, '#b0603a']),
  water: G([0, '#6a0e02'], [0.3, '#d0380a'], [0.6, '#ff8a1a'], [0.85, '#ffd66b'], [1, '#fff6d0']),
  gem: G([0, '#8a1a06'], [0.5, '#ff6a1a'], [1, '#ffe8a0']),
  flame: null,
};
// 砂の 洞窟（第4章の 北の古井戸）: 赤茶の 砂岩の かべ・かわいた 砂の ゆか・にごった 緑の 水・こはく色の 石
const SAND = {
  floor: G([0, '#1a1006'], [0.15, '#4a3018'], [0.3, '#8a6034'], [0.5, '#c09050'], [0.75, '#e6c486'], [1, '#fff2d0']),
  wall: G([0, '#0c0604'], [0.15, '#341c10'], [0.3, '#6e3e22'], [0.5, '#a8683c'], [1, '#e8b080']),
  water: G([0, '#06201e'], [0.35, '#1c5a52'], [0.7, '#5aa890'], [1, '#e4fff0']),
  gem: G([0, '#6a3a08'], [0.5, '#f0a830'], [1, '#fff4c8']),
  flame: null,
};
// 地下水路（第4章 Step 2）: 黄土色の 切り石・こい かげ・たいまつの あかり（火は そのまま）・すきとおった 青緑の 水・青い 石
// 洞窟の ゆか（#4a4038）は 水路の 石だたみ（#b8a07a）くらいの 明るさに、かべは 水路の 切り石の 色に
const CANAL = {
  floor: G([0, '#1c1209'], [0.1, '#3e2e1c'], [0.2, '#7a6446'], [0.3, '#b09872'], [0.45, '#c6af88'], [0.7, '#ddc9a3'], [1, '#fff6e2']),
  wall: G([0, '#0c0804'], [0.12, '#2c1f13'], [0.24, '#5a4229'], [0.36, '#866646'], [0.6, '#a8865c'], [1, '#e6c99c']),
  water: G([0, '#06222e'], [0.35, '#1d6c8c'], [0.7, '#5cbad2'], [1, '#e8fcff']),
  gem: G([0, '#0a4650'], [0.5, '#3fc6be'], [1, '#e6fff8']),
  flame: null,
};
const THEMES = { ice: ICE, lava: LAVA, sand: SAND, canal: CANAL };

// 1つの 色を かえる
export function themeRgb(r, g, b, theme, part) {
  const P = THEMES[theme];
  if (!P || part === 'none') return [r, g, b];
  const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const warm = r > 170 && g > 70 && b < 110 && r > b + 80; // たいまつの 火
  const cool = b > r + 25 && b >= g - 10; // 水・水晶
  if (warm) return P.flame ? grad(P.flame, l * 1.15) : [r, g, b];
  if (part === 'water') return grad(P.water, theme === 'lava' ? l * 1.9 + 0.12 : l * 1.5);
  if (cool) return grad(P.gem, l * 1.3);
  if (part === 'wall') return grad(P.wall, theme === 'ice' ? Math.pow(l, 0.75) * 1.25 : l * 1.2);
  return grad(P.floor, theme === 'ice' ? Math.pow(l, 0.6) * 1.2 : l * 1.15);
}

const hexCache = new Map();
export function themeHex(h, theme, tileId) {
  if (!THEMES[theme] || typeof h !== 'string' || h[0] !== '#' || h.length !== 7) return h;
  const key = `${h}|${theme}|${tileId}`;
  let v = hexCache.get(key);
  if (!v) {
    const [r, g, b] = hex(h);
    v = '#' + themeRgb(r, g, b, theme, partOfTile(tileId)).map((x) => x.toString(16).padStart(2, '0')).join('');
    hexCache.set(key, v);
  }
  return v;
}

// ドット絵の キャンバスを 色がえした コピー（もとの キャンバスは かえない）
const canvasCache = new WeakMap();
export function themedCanvas(src, theme, part) {
  if (!THEMES[theme] || !src) return src;
  let per = canvasCache.get(src);
  if (!per) { per = new Map(); canvasCache.set(src, per); }
  const key = `${theme}|${part}`;
  if (per.has(key)) return per.get(key);
  const c = makeCanvas(src.width, src.height);
  c.res = src.res;
  const x = ctxOf(c);
  x.drawImage(src, 0, 0);
  try {
    const img = x.getImageData(0, 0, c.width, c.height);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const [r, g, b] = themeRgb(d[i], d[i + 1], d[i + 2], theme, part);
      d[i] = r; d[i + 1] = g; d[i + 2] = b;
    }
    x.putImageData(img, 0, 0);
  } catch { /* 色が かえられない ときは そのまま */ }
  per.set(key, c);
  return c;
}

// 洞窟の 主の 色ちがい（hue: 色あい 度 / sat: あざやかさ / light: 明るさ）。ふちどりの 黒は そのまま
export function tintCanvas(src, tint) {
  const c = makeCanvas(src.width, src.height);
  c.res = src.res;
  const x = ctxOf(c);
  x.drawImage(src, 0, 0);
  try {
    const img = x.getImageData(0, 0, c.width, c.height);
    const d = img.data;
    const dh = (tint.hue || 0) / 360, ks = tint.sat ?? 1, kl = tint.light ?? 1;
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      let [h, s, l] = rgbToHsl(d[i], d[i + 1], d[i + 2]);
      if (l < 0.13) continue;
      h = (h + dh + 1) % 1;
      s = Math.min(1, s * ks);
      l = Math.min(0.97, l * kl);
      const [r, g, b] = hslToRgb(h, s, l);
      d[i] = r; d[i + 1] = g; d[i + 2] = b;
    }
    x.putImageData(img, 0, 0);
  } catch { /* そのまま */ }
  return c;
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToRgb(h, s, l) {
  if (!s) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    t = (t + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((v) => Math.round(v * 255));
}
