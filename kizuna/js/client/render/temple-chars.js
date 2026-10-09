// 第4章 Step 7 の とくべつな え（render/chars.js の paintSpecial から）
// ・mira_prison … 水の 柱の ろうに とじこめられた 水のみこミラ（目を とじている）
// ・mira_prison_low … ろうの 番人を たおした あと（水が こしまで 下がり、目を あける）
// ・water_star … 水の守り星（青く すきとおった 星。水の しずくが まわりを まう）
import { Painter } from './pixel.js?v=a94c44ae0637';

const HAIR = '#2a3a5a', HAIRL = '#4a5a8a', SKIN = '#f0d0b0', SKIND = '#d8b090', ROBE = '#e8f6fc', ROBET = '#2a8ac8', VEIL = '#f4fbff';
const WATER = '#4aa8e0', WATERL = '#6ac0f0', WATERH = '#b8e8ff', WATERD = '#3a90c8';

// みこの すがた（16×28 の え の 下の ほう。eyes … 目を あけているか）
function priestess(p, eyes) {
  // ベール と かみ
  p.rect(5, 4, 6, 7, HAIR); p.rect(4, 6, 1, 8, HAIR); p.rect(11, 6, 1, 8, HAIR);
  p.rect(5, 3, 6, 2, VEIL); p.hline(4, 11, 5, VEIL); p.set(5, 3, '#ffffff');
  // かお
  p.rect(6, 6, 4, 4, SKIN); p.vline(9, 7, 9, SKIND);
  if (eyes) { p.set(6, 7, '#1a2a4a'); p.set(9, 7, '#1a2a4a'); } else { p.hline(6, 7, 7, '#8a6a5a'); p.hline(8, 9, 7, '#8a6a5a'); }
  p.set(7, 9, '#d88a8a');
  // ころも（いのる 手を むねの 前で くむ）
  p.rect(5, 10, 6, 13, ROBE); p.vline(10, 11, 22, '#c4dce8');
  p.hline(5, 10, 10, ROBET); p.vline(7, 11, 22, ROBET);
  p.rect(6, 13, 4, 2, SKIN); p.set(7, 12, SKIN); p.set(8, 12, SKIN);
  p.rect(4, 22, 8, 2, ROBET);
}

function prisonColumn(p, level) {
  // 水の 柱（level … 水の 高さ。0 が いちばん 上）
  for (let y = level; y < 27; y++) {
    for (let x = 2; x < 14; x++) {
      const px = p.get(x, y);
      const edge = x === 2 || x === 13;
      const c = edge ? WATERD : x === 4 ? WATERH : x === 5 ? WATERL : null;
      if (c) p.set(x, y, c);
      else if (!px) p.set(x, y, (x + y) % 5 ? WATER : WATERL);
      else p.set(x, y, mixBlue(px));
    }
  }
  p.hline(2, 13, level, WATERH);
  for (const [bx, by] of [[11, 22], [3, 15], [12, 8], [6, 25]]) if (by > level) p.set(bx, by, '#e8faff');
  p.hline(1, 14, 27, '#2e5a72');
}
// 水ごしの 色（青みを たす）
function mixBlue(hex) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  const k = 0.42;
  const to = (v, t) => Math.round(v + (t - v) * k).toString(16).padStart(2, '0');
  return `#${to(r, 0x4a)}${to(g, 0xa8)}${to(b, 0xe0)}`;
}

export function paintMiraPrison(low = false) {
  const p = new Painter(16, 28);
  priestess(p, low);
  prisonColumn(p, low ? 15 : 0);
  return p;
}

export function paintWaterStar(f) {
  const p = new Painter(16, 21);
  const b = f ? 1 : 0;
  p.ellipse(8, 19.5, 4, 1.2, '#1a3a5a');
  // 光の わ
  p.ellipse(8, 8 - b, 7, 7, '#2a6ab0');
  p.ellipse(8, 8 - b, 6, 6, '#3a8ad8');
  // 星（5つの かど）
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? 2.4 : 5.6;
    pts.push([8 + Math.cos(a) * r, 8 - b + Math.sin(a) * r]);
  }
  for (let y = 0; y < 21; y++) for (let x = 0; x < 16; x++) if (inPoly(x + 0.5, y + 0.5, pts)) p.set(x, y, y < 8 - b ? '#b8f0ff' : '#6ad0f8');
  p.set(7, 6 - b, '#ffffff'); p.set(8, 5 - b, '#ffffff'); p.set(7, 7 - b, '#e8fbff');
  // まう しずく
  if (f) { p.set(2, 3, '#e8f8ff'); p.set(14, 12, '#a8e4ff'); p.set(13, 2, '#ffffff'); } else { p.set(13, 4, '#e8f8ff'); p.set(2, 12, '#a8e4ff'); p.set(3, 1, '#ffffff'); }
  return p;
}
function inPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
