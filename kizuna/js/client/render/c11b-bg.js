// 第3部 第3章 第2幕「月の都と、名前のランプ」の 戦いの 背景（c9b-bg.js の drawC9bBg から よぶ。BW×BH の まま かく。hor … 地面の たかさ）
// ・c11b_alley（deco 'c11b_alley'）… うらの 町の 道: 暗い 夜空に 三日月・低い 家の 屋根・あたたかい 色の 小さな ランプ（うら道の 魔物）
// ・c11b_tower（deco 'c11b_tower'）… 名前の 塔の おもて: 白い 石の かべ・たなに ならぶ 名前の ランプ（明るい。塔の 魔物・ランプの番人）
// ・c11b_towerb（deco 'c11b_towerb'）… 名前の 塔の うら: 同じ 形の かべが あい色に しずむ・消えた ランプ・あたたかい 小さな 明かり（塔の うらの 魔物）
// ・c11b_terrace（deco 'c11b_terrace'）… 塔の 上の テラス: 大きな 月・雲の 海・白い 手すり（月のむかえ オボロ）
const BW = 256, BH = 144;

export const C11B_BG = {
  c11b_alley: { sky: ['#0a0820', '#141238', '#201c50', '#2e2864'], far: '#1e1a48', near: '#16123a', ground: ['#4a3a30', '#3a2c24'], deco: 'c11b_alley' },
  c11b_tower: { sky: ['#c8c8e0', '#d8d8ec', '#e4e4f2', '#eeeef8'], far: '#b8b8d0', near: '#a8a8c4', ground: ['#c0bcd4', '#a8a4c0'], deco: 'c11b_tower' },
  c11b_towerb: { sky: ['#0c0a24', '#16143a', '#201e4e', '#2a2860'], far: '#1c1a46', near: '#141238', ground: ['#3a3460', '#2c2850'], deco: 'c11b_towerb' },
  c11b_terrace: { sky: ['#060818', '#0e1238', '#1a2058', '#2a3278'], far: '#1a2058', near: '#141a48', ground: ['#d8d8e8', '#b8b8d0'], deco: 'c11b_terrace' },
};
export const C11B_DECOS = new Set(Object.keys(C11B_BG));

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
// 三日月（cx, cy … まんなか・r … 大きさ・bg … かける 色）
function crescent(x, cx, cy, r, col, bg) {
  disc(x, cx, cy, r, col);
  disc(x, cx + r * 0.45, cy - r * 0.2, r * 0.85, bg);
}
// 小さな ランプ（あたたかい 光）
function lampAt(x, cx, cy, warm = true, on = true) {
  if (on) {
    x.fillStyle = warm ? 'rgba(255,200,110,0.25)' : 'rgba(255,250,220,0.3)';
    x.beginPath(); x.arc(cx, cy, 7, 0, Math.PI * 2); x.fill();
  }
  x.fillStyle = '#6a5030';
  x.fillRect(cx - 2, cy - 4, 4, 1);
  x.fillStyle = on ? (warm ? '#ffc860' : '#fff4c0') : '#5a5670';
  x.fillRect(cx - 2, cy - 3, 4, 5);
  x.fillStyle = '#6a5030';
  x.fillRect(cx - 2, cy + 2, 4, 1);
}

// うらの 町の 道
function drawAlley(x, hor) {
  stars(x, 30, hor - 30, 1.3);
  crescent(x, 206, 26, 11, '#fff2c0', '#141238');
  // 低い 家の 屋根（とおく）
  for (let i = 0; i < 7; i++) {
    const bx = i * 40 - 8, bw = 36, bh = 22 + (i % 3) * 6;
    x.fillStyle = i % 2 ? '#241e4a' : '#2a2452';
    x.fillRect(bx, hor - bh, bw, bh);
    x.fillStyle = '#3a2a3a';
    x.beginPath(); x.moveTo(bx - 3, hor - bh); x.lineTo(bx + bw / 2, hor - bh - 10); x.lineTo(bx + bw + 3, hor - bh); x.fill();
    // あたたかい まど
    x.fillStyle = '#ffc860';
    x.fillRect(bx + 8, hor - bh + 8, 4, 4);
    if (i % 2) x.fillRect(bx + 22, hor - bh + 10, 4, 4);
  }
  // つるした ランプの ひも
  x.strokeStyle = 'rgba(200,180,140,0.6)';
  x.lineWidth = 1;
  x.beginPath(); x.moveTo(0, hor - 44); x.quadraticCurveTo(128, hor - 30, 256, hor - 46); x.stroke();
  for (let i = 0; i < 6; i++) lampAt(x, 24 + i * 42, hor - 38 + Math.round(Math.sin(i * 1.7) * 3), true, true);
}
function alleyFloor(x, hor) {
  x.fillStyle = 'rgba(0,0,0,0.25)';
  for (let y = hor + 6; y < BH; y += 7) for (let i = 0; i < 10; i++) x.fillRect(((i * 29 + y * 3) % 256), y, 12, 1);
  x.fillStyle = 'rgba(255,200,110,0.12)';
  x.fillRect(0, hor, BW, 6);
}

// 名前の 塔（おもて・うら）
function drawTower(x, hor, back) {
  // 石の かべ（たての すじ）
  x.fillStyle = back ? 'rgba(120,110,200,0.12)' : 'rgba(255,255,255,0.4)';
  for (let i = 0; i < 9; i++) x.fillRect(i * 30 + 6, 0, 2, hor);
  // たなに ならぶ 名前の ランプ（3だん）
  for (let row = 0; row < 3; row++) {
    const y = 22 + row * 24;
    x.fillStyle = back ? '#3a3468' : '#9a94b8';
    x.fillRect(0, y + 6, BW, 2);
    for (let i = 0; i < 12; i++) {
      const cx = 12 + i * 21 + (row % 2) * 8;
      // うらは 消えた ランプが 多い（あたたかい 明かりが ぽつぽつ）
      const on = back ? (i + row * 3) % 5 === 0 : (i + row) % 7 !== 3;
      lampAt(x, cx, y, back, on);
    }
  }
  // まん中の 高い まど（月の 光）
  x.fillStyle = back ? '#26224e' : '#f8f8ff';
  x.fillRect(116, 4, 24, 14);
  x.beginPath(); x.arc(128, 4, 12, Math.PI, 0); x.fill();
  if (!back) crescent(x, 128, 8, 4, '#fff2c0', '#f8f8ff');
}
function towerFloor(x, hor, back) {
  x.fillStyle = back ? 'rgba(0,0,0,0.3)' : 'rgba(120,110,160,0.25)';
  for (let y = hor + 8; y < BH; y += 10) x.fillRect(0, y, BW, 1);
  for (let i = 0; i < 9; i++) x.fillRect(i * 32 + ((hor / 2) % 16), hor, 1, BH - hor);
}

// 塔の 上の テラス
function drawTerrace(x, hor) {
  stars(x, 40, hor - 10, 2.1);
  // 大きな 月
  disc(x, 186, 40, 30, '#e8e0c0');
  disc(x, 186, 40, 28, '#f8f2d8');
  disc(x, 176, 32, 5, '#e8e0c0');
  disc(x, 196, 50, 4, '#e8e0c0');
  x.fillStyle = 'rgba(255,250,220,0.08)';
  x.beginPath(); x.arc(186, 40, 44, 0, Math.PI * 2); x.fill();
  // 雲の 海（下）
  for (let i = 0; i < 9; i++) {
    x.fillStyle = i % 2 ? '#3a4280' : '#4a5296';
    x.beginPath(); x.ellipse(i * 32, hor - 6 + (i % 3) * 2, 24, 8, 0, 0, Math.PI * 2); x.fill();
  }
  // 白い 手すり
  x.fillStyle = '#e8e8f4';
  x.fillRect(0, hor - 14, BW, 3);
  for (let i = 0; i < 17; i++) x.fillRect(i * 16 + 4, hor - 12, 3, 12);
}
function terraceFloor(x, hor) {
  x.fillStyle = 'rgba(120,120,170,0.25)';
  for (let y = hor + 8; y < BH; y += 12) x.fillRect(0, y, BW, 1);
  for (let i = 0; i < 8; i++) x.fillRect(i * 36 + 10, hor, 1, BH - hor);
}

export function drawC11bBg(x, d, hor) {
  if (d.deco === 'c11b_alley') return drawAlley(x, hor);
  if (d.deco === 'c11b_tower' || d.deco === 'c11b_towerb') return drawTower(x, hor, d.deco === 'c11b_towerb');
  return drawTerrace(x, hor);
}
export function drawC11bFloorBg(x, d, hor) {
  if (d.deco === 'c11b_alley') return alleyFloor(x, hor);
  if (d.deco === 'c11b_tower' || d.deco === 'c11b_towerb') return towerFloor(x, hor, d.deco === 'c11b_towerb');
  return terraceFloor(x, hor);
}
