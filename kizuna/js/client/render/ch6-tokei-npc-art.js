// 第6章 Step 5「止まった時計塔」の とくべつな え（render/ch6-art.js が まぜる）
// ・clock_tower … 千年前の 北の 山の 止まった時計塔（フィールドの 大きな え。てっぺんの 大時計は 12時で 止まっている）
// ・carillon_npc … かねつきのからくり カリヨン（5階の 広間の すがた。大きな ハンマーを もった からくり人形）
// ・stop_mon_a・stop_mon_b … 止まった 部屋の 止まった 魔物（灰色の 歯車虫・ふりこコウモリ）
// ・toki_orn … トキネの 砂時計の かざり（小さな 金の 砂時計。光る）
import { Painter } from './pixel.js?v=b006a21bc0e3';

const BR = { d: '#5a3e18', b: '#a07a30', l: '#d8b050', hl: '#f8e090' };
const ST = { dd: '#2e2418', d: '#4a3c2c', b: '#6e5a44', l: '#8e7a62', ln: '#3a2e22' };
const GRAY = { d: '#5e5e66', b: '#8a8a92', l: '#b0b0b8', hl: '#d0d0d6' };

function gear(p, cx, cy, r, c, cl, cd, teeth = 8, rot = 0) {
  p.ellipse(cx, cy, r, r, c);
  for (let i = 0; i < teeth; i++) {
    const a = rot + (i * Math.PI * 2) / teeth;
    p.set(Math.round(cx + Math.cos(a) * (r + 1)), Math.round(cy + Math.sin(a) * (r + 1)), c);
    p.set(Math.round(cx + Math.cos(a) * (r + 0.4)), Math.round(cy + Math.sin(a) * (r + 0.4)), cl);
  }
  p.ellipse(cx, cy, Math.max(1, r * 0.35), Math.max(1, r * 0.35), cd);
}

// 止まった時計塔（48×150。下が ふとく 上が ほそい 石の 塔・てっぺんに 大時計・灰色の 歯車）
function paintClockTower(f) {
  const W = 48, H = 150, p = new Painter(W, H);
  for (let y = 30; y < H; y++) {
    const t = (y - 30) / (H - 30);
    const half = Math.round(10 + t * 9);
    const x0 = 24 - half, x1 = 23 + half;
    p.hline(x0, x1, y, ST.b);
    p.set(x0, y, ST.l); p.set(x0 + 1, y, ST.l);
    p.set(x1, y, ST.dd); p.set(x1 - 1, y, ST.d);
    if (y % 7 === 0) p.hline(x0 + 1, x1 - 1, y, ST.ln);
    else if (y % 7 === 3) for (let x = x0 + 4; x < x1; x += 6) p.set(x, y, ST.ln);
  }
  // 窓（止まった 時計の 光は ない）
  for (let i = 0; i < 6; i++) {
    const y = H - 24 - i * 16;
    p.rect(22, y, 4, 6, '#1a140e'); p.rect(23, y + 1, 2, 4, '#4a4048');
  }
  // かべの 歯車（止まっている）
  gear(p, 13, 96, 4, BR.d, BR.b, ST.dd, 8, 0.2); gear(p, 35, 70, 3, BR.d, BR.b, ST.dd, 7, 0.5);
  // てっぺんの 大時計（12時で 止まっている）と とんがり やね
  p.rect(10, 12, 28, 20, ST.d); p.hline(10, 37, 12, ST.l);
  p.ellipse(24, 22, 10, 10, BR.d); p.ellipse(24, 22, 9, 9, '#e8dcc0');
  for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; p.set(Math.round(24 + Math.sin(a) * 7.5), Math.round(22 - Math.cos(a) * 7.5), i % 3 ? '#8a7a5a' : '#2a1a10'); }
  p.vline(24, 15, 22, '#1a1010'); p.vline(23, 16, 22, '#1a1010');
  p.set(24, 22, '#c83a2a');
  for (let y = 0; y < 12; y++) { const half = Math.round(2 + y * 1.3); p.hline(24 - half, 23 + half, y, y % 3 ? BR.d : BR.b); }
  p.set(24, 0, f % 2 ? BR.hl : BR.l);
  // まわりの 灰色の もや（時が 止まっている）
  for (const [x, y] of [[4, 40], [42, 52], [6, 88], [44, 110], [3, 128]]) p.set(x, y, GRAY.l);
  return { p, oc: '#140e08' };
}

// かねつきのからくり カリヨン（40×46。からくり人形が 大きな ハンマーを ふり上げる。コマで ハンマーが 動く）
function paintCarillon(f) {
  const W = 40, H = 46, p = new Painter(W, H);
  const M = { d: '#3a2a1a', b: '#7a5a34', l: '#a88050', hl: '#d8b07a' };
  p.ellipse(20, 44.5, 13, 1.6, '#100a04');
  // 台と 足
  p.rect(10, 38, 20, 6, M.d); p.hline(10, 29, 38, M.l);
  p.rect(14, 30, 4, 8, M.b); p.rect(22, 30, 4, 8, M.b);
  // 体（かねの 形の どう）
  for (let y = 14; y < 31; y++) { const half = Math.round(5 + (y - 14) * 0.4); p.hline(20 - half, 19 + half, y, BR.b); p.set(20 - half, y, BR.l); p.set(19 + half, y, BR.d); }
  p.hline(12, 27, 30, BR.d); p.hline(13, 26, 29, BR.l);
  gear(p, 20, 22, 3, BR.d, BR.hl, M.d, 8, f * 0.4);
  // 頭（まるい 時計の 顔）
  p.ellipse(20, 8, 6, 6, M.b); p.ellipse(20, 8, 4.5, 4.5, '#e8dcc0');
  p.set(18, 7, '#1a1010'); p.set(22, 7, '#1a1010'); p.hline(18, 22, 10, '#c83a2a');
  p.vline(20, 1, 2, BR.l); p.set(20, 0, BR.hl);
  // うで と ハンマー（コマで 上と 下）
  const up = f % 2 === 0;
  p.vline(29, 16, 22, M.b); p.vline(30, 16, 22, M.d);
  if (up) { p.vline(33, 2, 16, M.l); p.rect(30, 0, 8, 5, '#8a8a9a'); p.hline(30, 37, 0, '#c8c8d8'); }
  else { p.hline(30, 37, 20, M.l); p.rect(36, 16, 4, 9, '#8a8a9a'); p.vline(36, 16, 24, '#c8c8d8'); }
  p.vline(10, 16, 24, M.b); p.vline(9, 16, 24, M.d);
  return { p, oc: '#0c0804' };
}

// 止まった 魔物（灰色。時が 止まって 動かない。コマでも 同じ）
function paintStopMonA() {
  const p = new Painter(16, 16);
  p.ellipse(8, 14.5, 6, 1.3, '#3a3a42');
  p.ellipse(8, 9, 6, 4.5, GRAY.b); p.ellipse(7, 8, 4, 3, GRAY.l);
  gear(p, 8, 9, 2, GRAY.d, GRAY.hl, '#4a4a52', 6);
  for (const x of [3, 6, 10, 13]) p.vline(x, 12, 14, GRAY.d);
  p.set(4, 6, '#ffffff'); p.set(12, 6, '#ffffff');
  p.vline(5, 2, 5, GRAY.d); p.vline(11, 2, 5, GRAY.d);
  return { p, oc: '#2a2a32' };
}
function paintStopMonB() {
  const p = new Painter(16, 16);
  p.ellipse(8, 15, 4, 1, '#3a3a42');
  p.ellipse(8, 7, 3.5, 3.5, GRAY.b); p.set(7, 6, '#ffffff'); p.set(9, 6, '#ffffff');
  for (let k = 0; k < 6; k++) { p.set(4 - Math.floor(k / 2), 6 + k, GRAY.d); p.set(12 + Math.floor(k / 2), 6 + k, GRAY.d); }
  p.hline(1, 4, 5, GRAY.l); p.hline(12, 15, 5, GRAY.l);
  p.vline(8, 10, 13, GRAY.d); p.ellipse(8, 13, 1.6, 1.6, GRAY.hl);
  return { p, oc: '#2a2a32' };
}
// トキネの 砂時計の かざり（小さな 金の 砂時計。光る）
function paintOrnament(f) {
  const p = new Painter(10, 12);
  p.ellipse(5, 10.5, 3, 1, '#5a4a2a');
  p.hline(2, 7, 1, BR.b); p.hline(2, 7, 9, BR.b);
  for (let y = 2; y < 9; y++) { const w = Math.abs(y - 5); p.hline(5 - Math.max(1, w), 4 + Math.max(1, w), y, '#e8f4ff'); p.set(5 - Math.max(1, w), y, '#7aa8c8'); p.set(4 + Math.max(1, w), y, '#7aa8c8'); }
  p.hline(4, 5, 7, '#f8dc90'); p.hline(3, 6, 8, '#e0b860');
  const c = f % 2 ? '#ffffff' : '#fff4c8';
  p.set(1, 3, c); p.set(8, 2, c); p.set(9, 6, f % 2 ? '#fff4c8' : '#ffffff');
  return { p, oc: '#3a2a10' };
}

export function paintTokeiSpecial(kind, dir, f) {
  switch (kind) {
    case 'clock_tower': return paintClockTower(f);
    case 'carillon_npc': return paintCarillon(f);
    case 'stop_mon_a': return paintStopMonA();
    case 'stop_mon_b': return paintStopMonB();
    case 'toki_orn': return paintOrnament(f);
    default: return null;
  }
}
export const TOKEI_SPECIALS = ['clock_tower', 'carillon_npc', 'stop_mon_a', 'stop_mon_b', 'toki_orn'];
