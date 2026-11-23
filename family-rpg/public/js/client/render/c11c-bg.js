// 第3部 第3章 第3幕「はかりの回ろうと、ふたつの光」の 戦いの 背景（c9b-bg.js の drawC9bBg から よぶ。BW×BH の まま かく。hor … 地面の たかさ）
// ・c11c_hall（deco 'c11c_hall'）… はかりの 回ろう: 暗い 石の ろうか・アーチ・かべの 青白い ランプ・光の さく（回ろうの 魔物）
// ・c11c_tower（deco 'c11c_tower'）… 月の都の 名前の 塔の 前: 夜の 広場・白い 高い 塔・三日月・屋根（バラバラン3号）
// ・c11c_door（deco 'c11c_door'）… 王宮の 大とびらの 前: 大きな 白い とびら・はかりの もよう・両がわの 柱・赤い じゅうたん（近衛の隊長エース）
const BW = 256, BH = 144;

export const C11C_BG = {
  c11c_hall: { sky: ['#0a0c1e', '#10142c', '#161c3a', '#1c2448'], far: '#161c3a', near: '#10142c', ground: ['#2a2e48', '#20243a'], deco: 'c11c_hall' },
  c11c_tower: { sky: ['#080a20', '#101438', '#1a2050', '#262c66'], far: '#1a2050', near: '#141a44', ground: ['#c8c4dc', '#aaa6c4'], deco: 'c11c_tower' },
  c11c_door: { sky: ['#e8e4f4', '#dcd8ee', '#d0cce6', '#c4c0de'], far: '#c4c0de', near: '#b8b4d4', ground: ['#a8323e', '#86262e'], deco: 'c11c_door' },
};
export const C11C_DECOS = new Set(Object.keys(C11C_BG));

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
function crescent(x, cx, cy, r, col, bg) {
  disc(x, cx, cy, r, col);
  disc(x, cx + r * 0.45, cy - r * 0.2, r * 0.85, bg);
}
// 青白い かべの ランプ
function wallLamp(x, cx, cy) {
  x.fillStyle = 'rgba(160,200,255,0.22)';
  x.beginPath(); x.arc(cx, cy, 8, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#4a5070';
  x.fillRect(cx - 1, cy + 3, 2, 4);
  x.fillStyle = '#d8ecff';
  x.fillRect(cx - 2, cy - 3, 4, 6);
}

// はかりの 回ろう
function drawHall(x, hor) {
  // アーチの つらなり（おく へ）
  for (let i = 0; i < 5; i++) {
    const cx = 26 + i * 51;
    x.fillStyle = '#1e2442';
    x.fillRect(cx - 20, 18, 40, hor - 18);
    x.fillStyle = '#0c0e22';
    x.fillRect(cx - 14, 30, 28, hor - 30);
    x.beginPath(); x.arc(cx, 30, 14, Math.PI, 0); x.fill();
    // おくの 小さな 光（はかりの 間の 光）
    x.fillStyle = 'rgba(255,240,190,0.25)';
    x.fillRect(cx - 2, hor - 26, 4, 10);
  }
  // 柱
  x.fillStyle = '#2c3254';
  for (let i = 0; i < 6; i++) x.fillRect(i * 51 - 2, 10, 6, hor - 10);
  for (let i = 0; i < 6; i++) wallLamp(x, i * 51 + 1, 40);
  // 光の さく（青白い たての 線）
  x.fillStyle = 'rgba(150,220,255,0.45)';
  for (let k = 0; k < 4; k++) x.fillRect(150 + k * 6, hor - 34, 1, 34);
  x.fillStyle = 'rgba(150,220,255,0.18)';
  x.fillRect(146, hor - 36, 26, 36);
}
function hallFloor(x, hor) {
  x.fillStyle = 'rgba(0,0,0,0.3)';
  for (let y = hor + 6; y < BH; y += 9) x.fillRect(0, y, BW, 1);
  for (let i = 0; i < 9; i++) x.fillRect(i * 32 + ((hor / 3) % 16), hor, 1, BH - hor);
  // かげの 台（丸い 黒い ゆか）
  x.fillStyle = 'rgba(10,8,30,0.45)';
  x.beginPath(); x.ellipse(60, hor + 18, 18, 5, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = 'rgba(160,140,255,0.25)';
  x.fillRect(42, hor + 17, 36, 1);
}

// 月の都の 名前の 塔の 前（夜）
function drawTowerFront(x, hor) {
  stars(x, 36, hor - 20, 2.7);
  crescent(x, 40, 26, 10, '#fff2c0', '#101438');
  // 白い 高い 塔（まん中）
  x.fillStyle = '#d8d8ec';
  x.fillRect(110, 8, 36, hor - 8);
  x.fillStyle = '#b8b8d4';
  x.fillRect(110, 8, 6, hor - 8);
  x.fillStyle = '#e8e8f8';
  x.beginPath(); x.moveTo(104, 10); x.lineTo(128, -6); x.lineTo(152, 10); x.fill();
  // 塔の まど（ランプ）
  for (let i = 0; i < 4; i++) {
    x.fillStyle = i % 2 ? '#ffd880' : '#fff0c0';
    x.fillRect(124, 22 + i * 18, 8, 8);
  }
  // 両がわの 屋根
  for (let i = 0; i < 6; i++) {
    if (i === 2 || i === 3) continue;
    const bx = i * 44 - 6, bh = 20 + (i % 2) * 8;
    x.fillStyle = '#2a2a56';
    x.fillRect(bx, hor - bh, 40, bh);
    x.fillStyle = '#3a3468';
    x.beginPath(); x.moveTo(bx - 3, hor - bh); x.lineTo(bx + 20, hor - bh - 9); x.lineTo(bx + 43, hor - bh); x.fill();
    x.fillStyle = '#ffd880';
    x.fillRect(bx + 10, hor - bh + 7, 4, 4);
  }
}
function towerFrontFloor(x, hor) {
  x.fillStyle = 'rgba(110,100,160,0.28)';
  for (let y = hor + 7; y < BH; y += 9) x.fillRect(0, y, BW, 1);
  for (let i = 0; i < 10; i++) x.fillRect(i * 28 + 4, hor, 1, BH - hor);
}

// 王宮の 大とびらの 前
function drawDoor(x, hor) {
  // 白い 石の かべ
  x.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < 10; i++) x.fillRect(i * 28, 0, 1, hor);
  // 大きな とびら（まん中）
  x.fillStyle = '#f4f2fc';
  x.fillRect(84, 6, 88, hor - 6);
  x.beginPath(); x.arc(128, 10, 44, Math.PI, 0); x.fill();
  x.fillStyle = '#d4d0e8';
  x.fillRect(127, 4, 2, hor - 4);
  // はかりの もよう（金）
  x.strokeStyle = '#c8a040';
  x.lineWidth = 1.5;
  x.beginPath(); x.moveTo(128, 18); x.lineTo(128, 40); x.moveTo(108, 26); x.lineTo(148, 26); x.stroke();
  x.beginPath(); x.moveTo(104, 26); x.lineTo(108, 34); x.lineTo(112, 26); x.moveTo(144, 26); x.lineTo(148, 34); x.lineTo(152, 26); x.stroke();
  disc(x, 128, 16, 3, '#e8c060');
  // 両がわの 柱
  for (const px of [64, 182]) {
    x.fillStyle = '#e0dcf0';
    x.fillRect(px, 0, 10, hor);
    x.fillStyle = '#c4c0dc';
    x.fillRect(px + 7, 0, 3, hor);
  }
  // 旗（月・星・ほうき星・太陽の もよう）
  const marks = ['#f4e8a0', '#fff4c8', '#c8e0ff', '#ffc070'];
  for (let i = 0; i < 4; i++) {
    const fx = i < 2 ? 12 + i * 26 : 204 + (i - 2) * 26;
    x.fillStyle = '#3a3a78';
    x.fillRect(fx, 10, 16, 30);
    x.beginPath(); x.moveTo(fx, 40); x.lineTo(fx + 8, 46); x.lineTo(fx + 16, 40); x.fill();
    disc(x, fx + 8, 24, 4, marks[i]);
  }
}
function doorFloor(x, hor) {
  // 赤い じゅうたん（まん中）と 石の ゆか
  x.fillStyle = 'rgba(255,255,255,0.12)';
  for (let y = hor + 8; y < BH; y += 10) x.fillRect(0, y, BW, 1);
  x.fillStyle = '#c83a48';
  x.beginPath(); x.moveTo(108, hor); x.lineTo(148, hor); x.lineTo(176, BH); x.lineTo(80, BH); x.fill();
  x.fillStyle = '#e8c060';
  x.fillRect(108, hor, 1, 2);
  x.fillRect(147, hor, 1, 2);
}

export function drawC11cBg(x, d, hor) {
  if (d.deco === 'c11c_hall') return drawHall(x, hor);
  if (d.deco === 'c11c_tower') return drawTowerFront(x, hor);
  return drawDoor(x, hor);
}
export function drawC11cFloorBg(x, d, hor) {
  if (d.deco === 'c11c_hall') return hallFloor(x, hor);
  if (d.deco === 'c11c_tower') return towerFrontFloor(x, hor);
  return doorFloor(x, hor);
}
