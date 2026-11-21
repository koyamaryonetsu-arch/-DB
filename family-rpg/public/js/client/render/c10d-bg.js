// 第3部 第2章 第4幕「金の音と、星の橋」の 戦いの 背景（c9b-bg.js の drawC9bBg から よぶ。BW×BH の まま かく。hor … 地面の たかさ）
// ・c10d_stair（deco 'c10d_stair'）… 星の 階段: 夜の 空・光の 階段が 上へ のびる・下に 雲と 小さな 世界（門の 番人の 戦い）
// ・c10d_summit（deco 'c10d_summit'）… いただき: 金色の 光の 玉・まわりは 星の 海の ような 空・雲の 上の 広い ゆか（ミラーレの 戦い）
const BW = 256, BH = 144;

export const C10D_BG = {
  c10d_stair: { sky: ['#0a1030', '#16205a', '#243484', '#3a4aa8'], far: '#2a3a8a', near: '#1e2a6a', ground: ['#8a9ad8', '#7080c0'], deco: 'c10d_stair' },
  c10d_summit: { sky: ['#0c0a28', '#1e1650', '#3a2a78', '#7a5aa0'], far: '#4a3a88', near: '#3a2a70', ground: ['#d8c890', '#c0ae74'], deco: 'c10d_summit' },
};
export const C10D_DECOS = new Set(Object.keys(C10D_BG));

const rnd = (i, s = 1) => {
  const v = Math.sin(i * 127.1 * s + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const disc = (x, cx, cy, r, c) => { x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); };
function stars(x, n, h, s = 1) {
  for (let i = 0; i < n; i++) {
    x.fillStyle = i % 5 ? '#ffffff' : '#ffe8a0';
    x.fillRect(Math.round(rnd(i, 1.7 * s) * 254), Math.round(rnd(i, 2.3 * s) * h), 1, 1);
  }
}
function cloud(x, cx, cy, w, col) {
  x.fillStyle = col;
  for (let k = 0; k < 5; k++) {
    x.beginPath();
    x.ellipse(cx + (k - 2) * w * 0.22, cy - (k % 2) * w * 0.06, w * 0.2, w * 0.1, 0, 0, Math.PI * 2);
    x.fill();
  }
}
function glow(x, cx, cy, r, core, rim) {
  const g = x.createRadialGradient ? x.createRadialGradient(cx, cy, 1, cx, cy, r * 2.6) : null;
  if (g?.addColorStop) {
    g.addColorStop(0, rim);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.fillRect(cx - r * 2.6, cy - r * 2.6, r * 5.2, r * 5.2);
  }
  disc(x, cx, cy, r, core);
  disc(x, cx - r * 0.3, cy - r * 0.3, r * 0.35, '#ffffff');
}

// 星の 階段: 夜の 空・ななめに のぼる 光の 階段・下に 雲と 小さな 世界（4つの 国の 小さな 光）
function drawStair(x, hor) {
  stars(x, 26, hor - 10);
  // とおくの 星の塔の てっぺん（下の 方に 小さく）
  x.fillStyle = '#3a4a9a';
  x.fillRect(30, hor - 22, 10, 22);
  x.fillRect(27, hor - 24, 16, 3);
  disc(x, 35, hor - 27, 2, '#ffe8a0');
  // 光の 階段（左下 → 右上。1だんずつ）
  for (let i = 0; i < 11; i++) {
    const sx = 70 + i * 16, sy = hor - 6 - i * 6;
    x.fillStyle = 'rgba(255,240,180,0.18)';
    x.fillRect(sx - 2, sy - 1, 20, 6);
    x.fillStyle = i % 2 ? '#e8e0ff' : '#fff4c8';
    x.fillRect(sx, sy, 16, 2);
    x.fillStyle = 'rgba(160,170,255,0.5)';
    x.fillRect(sx, sy + 2, 16, 2);
  }
  // 階段の いちばん 上の 門（金の わく）
  x.fillStyle = '#c8a040';
  x.fillRect(226, hor - 82, 3, 18);
  x.fillRect(244, hor - 82, 3, 18);
  x.fillRect(224, hor - 85, 25, 3);
  glow(x, 236, hor - 92, 3, '#fff4c8', 'rgba(255,230,150,0.45)');
  // 下の 雲の 海と 小さな 世界の 光（ミドリナ・シロガネ・コガネ・クモイ）
  for (let i = 0; i < 7; i++) cloud(x, 16 + i * 40, hor - 2 + (i % 2) * 3, 58, i % 2 ? '#7a88c8' : '#8a98d8');
  for (const [cx, col] of [[24, '#8aff9a'], [78, '#f0f4ff'], [150, '#ffd860'], [212, '#c0d8ff']]) disc(x, cx, hor + 1, 1.5, col);
}
function stairFloor(x, hor) {
  // 足もとの 光の だん（すきとおった ゆか）
  x.fillStyle = 'rgba(255,255,255,0.25)';
  for (let y = hor + 6; y < BH; y += 9) x.fillRect(0, y, BW, 1);
  x.fillStyle = 'rgba(255,240,180,0.3)';
  for (let i = 0; i < 12; i++) x.fillRect(Math.round(rnd(i, 3.1) * 246), hor + 4 + Math.round(rnd(i, 4.3) * (BH - hor - 8)), 2, 1);
}
// いただき: 星の 海の ような 空・金色の 光の 玉・雲の 上の 広い ゆか
function drawSummit(x, hor) {
  stars(x, 40, hor - 6, 1.3);
  // 天の 川の ような 光の おび
  x.fillStyle = 'rgba(220,200,255,0.12)';
  x.beginPath();
  x.moveTo(0, 30);
  x.lineTo(256, 4);
  x.lineTo(256, 24);
  x.lineTo(0, 54);
  x.closePath();
  x.fill();
  // 金色の 光の 玉（まん中 おく）
  glow(x, 128, hor - 42, 7, '#ffe070', 'rgba(255,220,110,0.55)');
  // 光の 玉の 台（石の 柱）
  x.fillStyle = '#b8a878';
  x.fillRect(122, hor - 32, 12, 32);
  x.fillStyle = '#d8c898';
  x.fillRect(119, hor - 34, 18, 3);
  // 雲の 海（地平線）
  for (let i = 0; i < 7; i++) cloud(x, 18 + i * 40, hor - 1 + (i % 2) * 2, 60, i % 2 ? '#c8b8e8' : '#d8c8f0');
}
function summitFloor(x, hor) {
  x.fillStyle = 'rgba(255,240,180,0.18)';
  x.beginPath();
  x.ellipse(128, hor + 16, 92, 10, 0, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = 'rgba(255,255,255,0.3)';
  for (let i = 0; i < 12; i++) x.fillRect(Math.round(rnd(i, 8.3) * 250), hor + 4 + Math.round(rnd(i, 9.1) * (BH - hor - 8)), 1, 1);
}

export function drawC10dBg(x, d, hor) {
  if (d.deco === 'c10d_summit') drawSummit(x, hor);
  else drawStair(x, hor);
}
export function drawC10dFloorBg(x, d, hor) {
  if (d.deco === 'c10d_summit') summitFloor(x, hor);
  else stairFloor(x, hor);
}
