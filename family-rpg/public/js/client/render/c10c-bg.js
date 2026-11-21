// 第3部 第2章 第3幕「紫と、うばわれた音」の 戦いの 背景（c9b-bg.js の drawC9bBg から よぶ。BW×BH の まま かく。hor … 地面の たかさ）
// ・c10c_sky（deco 'c10c_sky'）… 空の 小島: 雲の 海の 上の うかぶ 小島・とおくに 影の城の かげ・光の 橋（ふつうの 戦い）
// ・c10c_ruin（deco 'c10c_ruin'）… うかぶ いせき: こわれた 石の 柱・まん中に 紫の 光の 玉・空に うかぶ 3つの うき石（たいさの 戦い）
// ・c10c_belt（deco 'c10c_belt'）… ベルトの 工場: 流れる ベルト（矢じるし）・星の かけらの 箱・歯車・ランプ（ふつうの 戦い）
// ・c10c_room（deco 'c10c_room'）… 少年の 間: 光の びんが ならぶ たな・まん中に 紫の 音・こい 紫の かべ（アルゴルの 戦い）
const BW = 256, BH = 144;

export const C10C_BG = {
  c10c_sky: { sky: ['#2a3a7a', '#4a5aa0', '#7a7ac0', '#b0a0d8'], far: '#8a8ac8', near: '#6a6aa8', ground: ['#8a7a9a', '#7a6a8a'], deco: 'c10c_sky' },
  c10c_ruin: { sky: ['#1a1a4a', '#2a2a6a', '#4a3a8a', '#7a5aa8'], far: '#4a3a7a', near: '#3a2a6a', ground: ['#8a8098', '#766c86'], deco: 'c10c_ruin' },
  c10c_belt: { sky: ['#1a1418', '#261e22', '#32282c', '#3e3236'], far: '#2a2226', near: '#201a1e', ground: ['#4a4248', '#3e363c'], deco: 'c10c_belt' },
  c10c_room: { sky: ['#0a0614', '#140c24', '#1e1234', '#281844'], far: '#1a1030', near: '#120a24', ground: ['#3a2a52', '#302246'], deco: 'c10c_room' },
};
export const C10C_DECOS = new Set(Object.keys(C10C_BG));

const rnd = (i, s = 1) => {
  const v = Math.sin(i * 127.1 * s + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const disc = (x, cx, cy, r, c) => { x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); };
function glowOrb(x, cx, cy, r, core, rim) {
  const g = x.createRadialGradient ? x.createRadialGradient(cx, cy, 1, cx, cy, r * 2.4) : null;
  if (g?.addColorStop) {
    g.addColorStop(0, rim);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.fillRect(cx - r * 2.4, cy - r * 2.4, r * 4.8, r * 4.8);
  }
  disc(x, cx, cy, r, core);
  disc(x, cx - r * 0.3, cy - r * 0.3, r * 0.35, '#ffffff');
}
// 雲の かたまり
function cloud(x, cx, cy, w, col) {
  x.fillStyle = col;
  for (let k = 0; k < 5; k++) {
    x.beginPath();
    x.ellipse(cx + (k - 2) * w * 0.22, cy - (k % 2) * w * 0.06, w * 0.2, w * 0.1, 0, 0, Math.PI * 2);
    x.fill();
  }
}
// うかぶ 小島（上は 草・下は とがった 岩）
function islet(x, cx, cy, w, top = '#6a9a6a', rock = '#6a5a7a') {
  x.fillStyle = rock;
  x.beginPath();
  x.moveTo(cx - w / 2, cy);
  x.lineTo(cx + w / 2, cy);
  x.lineTo(cx + w * 0.1, cy + w * 0.45);
  x.lineTo(cx - w * 0.08, cy + w * 0.5);
  x.closePath();
  x.fill();
  x.fillStyle = top;
  x.fillRect(Math.round(cx - w / 2), Math.round(cy - 2), Math.round(w), 3);
}

// 空の 小島: 星の 空・雲の 海・うかぶ 小島・とおくの 影の城・光の 橋
function drawSky(x, hor) {
  x.fillStyle = '#ffffff';
  for (let i = 0; i < 18; i++) x.fillRect(Math.round(rnd(i, 1.7) * 250), Math.round(rnd(i, 2.3) * 30), 1, 1);
  // とおくの 影の城（かげ だけ）
  x.fillStyle = '#4a4a80';
  x.fillRect(200, 26, 18, 22);
  x.fillRect(196, 34, 26, 14);
  for (const cx of [198, 208, 218]) x.fillRect(cx, 20, 4, 8);
  // うかぶ 小島（とおく・ちかく）
  islet(x, 40, 40, 34, '#7aa07a', '#5a4a6a');
  islet(x, 150, 30, 22, '#7aa07a', '#5a4a6a');
  islet(x, 110, 54, 28, '#8ab08a', '#6a5a7a');
  // 光の 橋（2本）
  x.fillStyle = 'rgba(255,120,160,0.55)';
  x.fillRect(57, 39, 42, 2);
  x.fillStyle = 'rgba(120,200,255,0.55)';
  x.fillRect(124, 32, 16, 2);
  // 雲の 海（地面の すぐ 上）
  for (let i = 0; i < 7; i++) cloud(x, 18 + i * 40, hor - 4 + (i % 2) * 3, 60, i % 2 ? '#d8d0f0' : '#e8e0ff');
}
function skyFloor(x, hor) {
  // 足もとの 小島の 草と 雲の すき間
  x.fillStyle = 'rgba(255,255,255,0.25)';
  for (let i = 0; i < 10; i++) x.fillRect(Math.round(rnd(i, 3.1) * 240), hor + 4 + Math.round(rnd(i, 4.3) * (BH - hor - 8)), 14, 1);
  x.fillStyle = 'rgba(120,170,120,0.35)';
  x.fillRect(0, hor, BW, 3);
}

// うかぶ いせき: こわれた 柱・紫の 光の 玉・3つの うき石
function drawRuin(x, hor) {
  x.fillStyle = '#ffffff';
  for (let i = 0; i < 14; i++) x.fillRect(Math.round(rnd(i, 4.1) * 250), Math.round(rnd(i, 5.3) * 26), 1, 1);
  // こわれた 石の 柱
  for (const [cx, h] of [[22, 60], [62, 40], [194, 46], [234, 64]]) {
    x.fillStyle = '#5a5070';
    x.fillRect(cx - 7, hor - h, 14, h);
    x.fillStyle = '#7a7090';
    x.fillRect(cx - 7, hor - h, 3, h);
    x.fillStyle = '#4a4060';
    x.fillRect(cx - 9, hor - h - 3, 18, 4);
  }
  // 紫の 光の 玉（台の 上）
  x.fillStyle = '#4a4060';
  x.fillRect(118, hor - 20, 20, 20);
  glowOrb(x, 128, hor - 30, 6, '#c8a0ff', 'rgba(200,160,255,0.5)');
  // 空に うかぶ 3つの うき石（たいさの しかけ）
  for (const cx of [72, 128, 184]) {
    x.fillStyle = '#6a6080';
    x.beginPath();
    x.ellipse(cx, 24, 14, 4, 0, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = '#8a80a0';
    x.fillRect(cx - 12, 21, 24, 2);
  }
  // 雲の 海（おくに）
  for (let i = 0; i < 6; i++) cloud(x, 20 + i * 46, hor + 1, 54, 'rgba(220,210,250,0.5)');
}
function ruinFloor(x, hor) {
  // 古い 石の ゆか（しきつめた 石）
  x.fillStyle = 'rgba(0,0,0,0.18)';
  for (let y = hor + 8; y < BH; y += 10) x.fillRect(0, y, BW, 1);
  for (let i = 0; i < 12; i++) x.fillRect(Math.round(rnd(i, 6.7) * 250), hor + 2 + Math.round(rnd(i, 7.1) * (BH - hor - 4)), 1, 8);
  x.fillStyle = 'rgba(200,160,255,0.15)';
  x.beginPath();
  x.ellipse(128, hor + 10, 50, 6, 0, 0, Math.PI * 2);
  x.fill();
}

// ベルトの 工場: 歯車・ランプ・流れる ベルト・星の かけらの 箱
function drawBelt(x, hor) {
  // かべの 歯車
  for (const [cx, cy, r] of [[40, 34, 16], [214, 30, 20], [120, 22, 10]]) {
    disc(x, cx, cy, r, '#4a3e44');
    x.fillStyle = '#5a4e54';
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      x.fillRect(Math.round(cx + Math.cos(a) * r - 2), Math.round(cy + Math.sin(a) * r - 2), 4, 4);
    }
    disc(x, cx, cy, r * 0.35, '#2a2226');
  }
  // ランプ（だいだいの 光）
  for (const cx of [80, 176]) {
    x.fillStyle = 'rgba(255,170,80,0.18)';
    x.beginPath();
    x.moveTo(cx - 4, 14);
    x.lineTo(cx + 4, 14);
    x.lineTo(cx + 20, hor);
    x.lineTo(cx - 20, hor);
    x.closePath();
    x.fill();
    disc(x, cx, 12, 4, '#ffb040');
  }
  // 星の かけらの 箱（かべぎわに つみあげ）
  for (const [bx, by] of [[8, hor - 16], [8, hor - 30], [22, hor - 16], [230, hor - 16], [230, hor - 30], [216, hor - 16]]) {
    x.fillStyle = '#8a6a3a';
    x.fillRect(bx, by, 14, 14);
    x.fillStyle = '#ffe8a0';
    x.fillRect(bx + 4, by + 2, 2, 2);
    x.fillRect(bx + 8, by + 6, 2, 2);
  }
  // おくの ベルト（矢じるし）
  x.fillStyle = '#2a2428';
  x.fillRect(36, hor - 10, 184, 8);
  x.fillStyle = '#ffd040';
  for (let px = 44; px < 216; px += 16) {
    x.fillRect(px, hor - 7, 6, 2);
    x.fillRect(px + 6, hor - 8, 2, 4);
  }
}
function beltFloor(x, hor) {
  // 鉄の ゆか（しまの もよう）
  x.fillStyle = 'rgba(0,0,0,0.2)';
  for (let y = hor + 6; y < BH; y += 6) x.fillRect(0, y, BW, 1);
  x.fillStyle = 'rgba(255,208,64,0.25)';
  for (let px = 0; px < BW; px += 24) x.fillRect(px, hor + 2, 12, 2);
}

// 少年の 間: 光の びんの たな・紫の 音・こい 紫の かべ
function drawRoom(x, hor) {
  // たな（3だん）と 光の びん
  for (const sy of [18, 40, 62]) {
    if (sy > hor - 10) continue;
    x.fillStyle = '#2a1a3a';
    x.fillRect(4, sy + 10, 248, 3);
    for (let i = 0; i < 16; i++) {
      const bx = 10 + i * 15 + Math.round(rnd(i + sy, 1.9) * 4);
      if (bx > 110 && bx < 146) continue;
      const col = ['#ffe8a0', '#bfe8ff', '#ffd0f0', '#d8ffd0', '#fff0c0'][Math.floor(rnd(i + sy, 2.7) * 5)];
      x.fillStyle = 'rgba(200,200,240,0.35)';
      x.fillRect(bx, sy, 6, 10);
      x.fillStyle = col;
      x.fillRect(bx + 1, sy + 4, 4, 5);
      x.fillStyle = '#5a4a6a';
      x.fillRect(bx + 2, sy - 1, 2, 2);
    }
  }
  // まん中の 台と 紫の 音
  x.fillStyle = '#3a2a52';
  x.fillRect(116, hor - 22, 24, 22);
  glowOrb(x, 128, hor - 32, 6, '#b080ff', 'rgba(170,110,255,0.55)');
}
function roomFloor(x, hor) {
  x.fillStyle = 'rgba(170,110,255,0.14)';
  x.beginPath();
  x.ellipse(128, hor + 14, 80, 9, 0, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = 'rgba(255,232,160,0.25)';
  for (let i = 0; i < 10; i++) x.fillRect(Math.round(rnd(i, 8.3) * 250), hor + 4 + Math.round(rnd(i, 9.1) * (BH - hor - 8)), 1, 1);
}

export function drawC10cBg(x, d, hor) {
  if (d.deco === 'c10c_ruin') drawRuin(x, hor);
  else if (d.deco === 'c10c_belt') drawBelt(x, hor);
  else if (d.deco === 'c10c_room') drawRoom(x, hor);
  else drawSky(x, hor);
}
export function drawC10cFloorBg(x, d, hor) {
  if (d.deco === 'c10c_ruin') ruinFloor(x, hor);
  else if (d.deco === 'c10c_belt') beltFloor(x, hor);
  else if (d.deco === 'c10c_room') roomFloor(x, hor);
  else skyFloor(x, hor);
}
