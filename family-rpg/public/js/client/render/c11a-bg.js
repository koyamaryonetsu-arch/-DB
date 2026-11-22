// 第3部 第3章 第1幕「星の船と、星座の島」の 戦いの 背景（c9b-bg.js の drawC9bBg から よぶ。BW×BH の まま かく。hor … 地面の たかさ）
// ・c11a_deck（deck 'c11a_deck'）… 星の船の 上: 星の海（こい 青に 星が うかぶ）・7色の 光の ほ・下に 雲と 小さな 地上。ゆかは 船の 板（海の 魔物）
// ・c11a_isle（deco 'c11a_isle'）… 星座の 島: 夜空に 星座の 点と 線・うかぶ 島の 草地・光る 石の 星（島の 魔物・星座のけもの）
// ・c11a_gate（deco 'c11a_gate'）… 星座の門の 前: 大きな 門（3つの 明かり）・海ぞく船の 黒い ほ・星の海の 波（いかり船長）
const BW = 256, BH = 144;

export const C11A_BG = {
  c11a_deck: { sky: ['#060a24', '#0c1640', '#16246a', '#22388e'], far: '#18286a', near: '#121e52', ground: ['#8a6a48', '#6e5236'], deco: 'c11a_deck' },
  c11a_isle: { sky: ['#080a26', '#121848', '#1e2a6e', '#30408e'], far: '#24305e', near: '#1a2448', ground: ['#4a7a5a', '#3a6248'], deco: 'c11a_isle' },
  c11a_gate: { sky: ['#0a0820', '#16123e', '#261e62', '#3a2e80'], far: '#2a2268', near: '#1e1a50', ground: ['#2a4a8a', '#203c74'], deco: 'c11a_gate' },
};
export const C11A_DECOS = new Set(Object.keys(C11A_BG));

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
// 星座（点と うすい 線）
function constellation(x, pts, col = 'rgba(190,230,255,0.55)') {
  x.strokeStyle = col;
  x.lineWidth = 1;
  x.beginPath();
  pts.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py)));
  x.stroke();
  for (const [px, py] of pts) { disc(x, px, py, 1.6, '#ffffff'); disc(x, px, py, 0.8, '#fff2a0'); }
}
// 星の海の 波（星が うかぶ）
function starSea(x, top, bottom) {
  x.fillStyle = '#0e1a4a';
  x.fillRect(0, top, BW, bottom - top);
  x.fillStyle = 'rgba(120,170,255,0.25)';
  for (let y = top + 3; y < bottom; y += 6) for (let i = 0; i < 9; i++) x.fillRect(Math.round(rnd(i + y, 5.1) * 240), y, 10, 1);
  for (let i = 0; i < 14; i++) disc(x, rnd(i, 6.7) * 254, top + rnd(i, 7.9) * (bottom - top), 0.8, i % 3 ? '#ffffff' : '#ffe890');
}

// 星の船の 上
function drawDeck(x, hor) {
  stars(x, 34, hor - 20, 1.1);
  // 下に 雲と 小さな 地上（とおく）
  for (let i = 0; i < 6; i++) cloud(x, 20 + i * 46, hor - 22 + (i % 2) * 2, 50, i % 2 ? '#3a4a8a' : '#4a5a9a');
  for (const [cx, col] of [[40, '#8aff9a'], [118, '#ffd860'], [196, '#c0d8ff']]) disc(x, cx, hor - 18, 1.2, col);
  starSea(x, hor - 16, hor);
  // 7色の 光の ほ（左の マスト）
  x.fillStyle = '#5a3a20';
  x.fillRect(30, hor - 74, 3, 74);
  const sail = ['#ff6a6a', '#ffd84a', '#5ad66a', '#5a9aff', '#f4f6ff', '#b06aff', '#ffd060'];
  sail.forEach((c, i) => { x.fillStyle = c; x.globalAlpha = 0.75; x.fillRect(34, hor - 70 + i * 7, 26 - i * 2, 6); });
  x.globalAlpha = 1;
  // 船の へり（手すり）
  x.fillStyle = '#6a4a2a';
  x.fillRect(0, hor - 4, BW, 4);
  x.fillStyle = '#8a6a48';
  for (let i = 0; i < 16; i++) x.fillRect(i * 16 + 4, hor - 10, 2, 6);
  x.fillRect(0, hor - 11, BW, 2);
}
function deckFloor(x, hor) {
  x.fillStyle = 'rgba(0,0,0,0.22)';
  for (let y = hor + 5; y < BH; y += 7) x.fillRect(0, y, BW, 1);
  x.fillStyle = 'rgba(255,230,170,0.12)';
  for (let i = 0; i < 10; i++) x.fillRect(Math.round(rnd(i, 3.3) * 246), hor + 4 + Math.round(rnd(i, 4.1) * (BH - hor - 8)), 6, 1);
}
// 星座の 島
function drawIsle(x, hor) {
  stars(x, 30, hor - 10, 1.4);
  constellation(x, [[30, 20], [52, 34], [74, 26], [96, 42], [80, 56]]);
  constellation(x, [[170, 18], [196, 30], [222, 22], [236, 44]]);
  // うかぶ 島の ふち（とおくの 小島）
  x.fillStyle = '#3a5a4a';
  x.beginPath();
  x.ellipse(200, hor - 8, 30, 5, 0, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#5a4a3a';
  x.beginPath();
  x.moveTo(172, hor - 8);
  x.lineTo(228, hor - 8);
  x.lineTo(200, hor + 2);
  x.closePath();
  x.fill();
  // 光る 石の 星（おく）
  for (const [cx, cy] of [[60, hor - 10], [128, hor - 16], [150, hor - 8]]) { disc(x, cx, cy, 3, '#fff2a0'); disc(x, cx, cy, 1.5, '#ffffff'); }
  for (let i = 0; i < 6; i++) cloud(x, 18 + i * 46, hor - 1 + (i % 2) * 2, 44, i % 2 ? '#2a3870' : '#344480');
}
function isleFloor(x, hor) {
  x.fillStyle = 'rgba(160,220,170,0.25)';
  for (let i = 0; i < 18; i++) x.fillRect(Math.round(rnd(i, 2.9) * 250), hor + 3 + Math.round(rnd(i, 3.7) * (BH - hor - 6)), 2, 1);
  x.strokeStyle = 'rgba(190,230,255,0.35)';
  x.lineWidth = 1;
  x.beginPath();
  x.moveTo(40, hor + 14);
  x.lineTo(110, hor + 24);
  x.lineTo(170, hor + 12);
  x.lineTo(220, hor + 26);
  x.stroke();
}
// 星座の門の 前
function drawGate(x, hor) {
  stars(x, 36, hor - 6, 1.9);
  // 大きな 門（2本の 柱と アーチ。3つの 明かり）
  x.fillStyle = '#4a4a8a';
  x.fillRect(150, hor - 92, 10, 92);
  x.fillRect(222, hor - 92, 10, 92);
  x.strokeStyle = '#6a6aa8';
  x.lineWidth = 6;
  x.beginPath();
  x.arc(191, hor - 92, 36, Math.PI, 0);
  x.stroke();
  for (const [cx, cy] of [[164, hor - 112], [191, hor - 128], [218, hor - 112]]) { disc(x, cx, cy, 4, '#fff2a0'); disc(x, cx, cy, 2, '#ffffff'); }
  // 門の むこうの 光（少し 開いた）
  x.fillStyle = 'rgba(255,240,200,0.18)';
  x.fillRect(186, hor - 88, 10, 88);
  // 海ぞく船の 黒い ほ（左 おく）
  x.fillStyle = '#2a1e1e';
  x.fillRect(46, hor - 70, 3, 60);
  x.fillStyle = '#3a2a2a';
  x.beginPath();
  x.moveTo(49, hor - 66);
  x.lineTo(84, hor - 40);
  x.lineTo(49, hor - 22);
  x.closePath();
  x.fill();
  disc(x, 62, hor - 44, 3, '#c8c8c8');
  x.fillStyle = '#2a1e1e';
  x.fillRect(20, hor - 14, 76, 8);
  starSea(x, hor - 8, hor);
}
function gateFloor(x, hor) {
  // 足もとは 星の 海の 浅い 所（波）
  x.fillStyle = 'rgba(140,190,255,0.3)';
  for (let y = hor + 4; y < BH; y += 6) for (let i = 0; i < 6; i++) x.fillRect(Math.round(rnd(i + y, 1.9) * 240), y, 12, 1);
  for (let i = 0; i < 10; i++) disc(x, rnd(i, 8.1) * 254, hor + 4 + rnd(i, 9.3) * (BH - hor - 8), 0.8, '#ffffff');
}

export function drawC11aBg(x, d, hor) {
  if (d.deco === 'c11a_gate') drawGate(x, hor);
  else if (d.deco === 'c11a_isle') drawIsle(x, hor);
  else drawDeck(x, hor);
}
export function drawC11aFloorBg(x, d, hor) {
  if (d.deco === 'c11a_gate') gateFloor(x, hor);
  else if (d.deco === 'c11a_isle') isleFloor(x, hor);
  else deckFloor(x, hor);
}
