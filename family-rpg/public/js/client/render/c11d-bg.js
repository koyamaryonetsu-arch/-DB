// 第3部 第3章 第4幕「かがやきの女王と、八つめの音」の 戦いの 背景（c9b-bg.js の drawC9bBg から よぶ。BW×BH の まま かく。hor … 地面の たかさ）
// ・c11d_tower（deco 'c11d_tower'）… かがやきの 塔の 中: 白い 石の かべ・高い まど・光の すじ・らせん階段（塔の 魔物）
// ・c11d_sound（deco 'c11d_sound'）… 4階 音の 間: 7つの 色の 台・かべに 歌の 絵（音の しるし）・天井の 星（鏡と月の使い）
// ・c11d_throne（deco 'c11d_throne'）… いただきの 玉座の 間: 白い 柱・大きな まどの 外に 星の海 ぜんぶ・まん中に 光の 玉座（かがやきの女王ポラリス）
const BW = 256, BH = 144;

export const C11D_BG = {
  c11d_tower: { sky: ['#dcdcf0', '#d0d0ea', '#c4c4e2', '#b8b8da'], far: '#c4c4e2', near: '#b0b0d4', ground: ['#e8e6f4', '#c8c6dc'], deco: 'c11d_tower' },
  c11d_sound: { sky: ['#14183a', '#1c2248', '#262c58', '#303868'], far: '#262c58', near: '#1c2248', ground: ['#3a3a68', '#2a2a52'], deco: 'c11d_sound' },
  c11d_throne: { sky: ['#060820', '#0c1030', '#141a44', '#1e2658'], far: '#141a44', near: '#0c1030', ground: ['#ecebf6', '#cfcde4'], deco: 'c11d_throne' },
};
export const C11D_DECOS = new Set(Object.keys(C11D_BG));

const rnd = (i, s = 1) => {
  const v = Math.sin(i * 127.1 * s + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const disc = (x, cx, cy, r, c) => { x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); };
// 7つの 音の 色（レ赤・ミ黄・ファ緑・ソ青・ラ白・シむらさき・ド金）
const NOTE7 = ['#ff5a5a', '#ffd83a', '#4ad66a', '#4a9aff', '#f4f6ff', '#b068ff', '#ffc040'];

// かがやきの 塔の 中
function drawTower(x, hor) {
  // 白い 石の かべの 目地
  x.fillStyle = 'rgba(120,120,170,0.25)';
  for (let y = 12; y < hor; y += 14) x.fillRect(0, y, BW, 1);
  for (let i = 0; i < 12; i++) x.fillRect(((i * 22) + (i % 2) * 11) % BW, 0, 1, hor);
  // 高い まど（光の すじ）
  for (const cx of [48, 128, 208]) {
    x.fillStyle = '#f8f8ff';
    x.fillRect(cx - 9, 10, 18, 40);
    x.beginPath(); x.arc(cx, 10, 9, Math.PI, 0); x.fill();
    x.fillStyle = '#bfe0ff';
    x.fillRect(cx - 1, 2, 2, 48);
    x.fillStyle = 'rgba(255,250,220,0.22)';
    x.beginPath(); x.moveTo(cx - 9, 50); x.lineTo(cx + 9, 50); x.lineTo(cx + 26, hor); x.lineTo(cx - 26, hor); x.fill();
  }
  // らせん階段（はし）
  x.fillStyle = '#a8a8c8';
  for (let k = 0; k < 6; k++) x.fillRect(226 + (k % 2) * 6, hor - 10 - k * 9, 24, 3);
}
function towerFloor(x, hor) {
  x.fillStyle = 'rgba(140,140,190,0.25)';
  for (let y = hor + 8; y < BH; y += 10) x.fillRect(0, y, BW, 1);
  for (let i = 0; i < 9; i++) x.fillRect(i * 32 + 6, hor, 1, BH - hor);
}

// 4階 音の 間
function drawHall(x, hor) {
  // 天井の 星
  for (let i = 0; i < 40; i++) {
    x.fillStyle = i % 6 ? '#ffffff' : '#ffe8a0';
    x.fillRect(Math.round(rnd(i, 1.3) * 254), Math.round(rnd(i, 2.9) * 40), 1, 1);
  }
  // かべの 歌の 絵（7つの 音の しるしが ならぶ 線）
  x.strokeStyle = 'rgba(220,220,255,0.35)';
  x.lineWidth = 1;
  for (let k = 0; k < 5; k++) { x.beginPath(); x.moveTo(20, 52 + k * 4); x.lineTo(236, 52 + k * 4); x.stroke(); }
  for (let i = 0; i < 7; i++) disc(x, 40 + i * 30, 54 + ((i * 3) % 5) * 3, 3, NOTE7[i]);
  // 7つの 色の 台（ゆかの おく）
  for (let i = 0; i < 7; i++) {
    const cx = 28 + i * 33;
    x.fillStyle = '#20224a';
    x.fillRect(cx - 10, hor - 8, 20, 8);
    x.fillStyle = NOTE7[i];
    x.fillRect(cx - 9, hor - 9, 18, 3);
    x.fillStyle = 'rgba(255,255,255,0.18)';
    x.fillRect(cx - 2, hor - 28, 4, 19);
  }
}
function hallFloor(x, hor) {
  x.fillStyle = 'rgba(200,200,255,0.14)';
  for (let y = hor + 7; y < BH; y += 9) x.fillRect(0, y, BW, 1);
}

// いただきの 玉座の 間（大きな まどの 外に 星の海）
function drawThrone(x, hor) {
  // 大きな まど（星の海）
  x.fillStyle = '#0a0e30';
  x.fillRect(40, 6, 176, hor - 12);
  x.beginPath(); x.arc(128, 10, 88, Math.PI, 0); x.fill();
  // 星の 海（たくさんの 星・天の川）
  x.fillStyle = 'rgba(160,170,255,0.18)';
  x.beginPath(); x.moveTo(40, hor - 30); x.lineTo(216, 18); x.lineTo(216, 34); x.lineTo(40, hor - 14); x.fill();
  for (let i = 0; i < 90; i++) {
    const sx = 42 + Math.round(rnd(i, 1.9) * 172);
    const sy = 8 + Math.round(rnd(i, 3.1) * (hor - 20));
    x.fillStyle = i % 7 ? '#ffffff' : i % 2 ? '#ffe8a0' : '#bfe0ff';
    x.fillRect(sx, sy, i % 11 ? 1 : 2, i % 11 ? 1 : 2);
  }
  // 北の 星（まどの 上の まん中）
  disc(x, 128, 18, 3, '#ffffff');
  x.fillStyle = 'rgba(191,224,255,0.5)';
  x.fillRect(122, 17, 13, 1);
  x.fillRect(127, 12, 1, 12);
  // まどの わく（白と 金）
  x.strokeStyle = '#f4f2fc';
  x.lineWidth = 3;
  x.beginPath(); x.moveTo(40, hor - 6); x.lineTo(40, 10); x.arc(128, 10, 88, Math.PI, 0); x.lineTo(216, hor - 6); x.stroke();
  x.strokeStyle = '#e8c050';
  x.lineWidth = 1;
  x.beginPath(); x.moveTo(128, -78); x.lineTo(128, hor - 6); x.moveTo(40, 52); x.lineTo(216, 52); x.stroke();
  // 白い 柱
  for (const px of [10, 230]) {
    x.fillStyle = '#ecebf6';
    x.fillRect(px, 0, 16, hor);
    x.fillStyle = '#c8c6dc';
    x.fillRect(px + 12, 0, 4, hor);
    x.fillStyle = '#e8c050';
    x.fillRect(px - 2, 0, 20, 3);
  }
}
function throneFloor(x, hor) {
  // 白い ゆかと 光の 道
  x.fillStyle = 'rgba(160,160,200,0.22)';
  for (let y = hor + 8; y < BH; y += 10) x.fillRect(0, y, BW, 1);
  x.fillStyle = 'rgba(255,240,190,0.35)';
  x.beginPath(); x.moveTo(116, hor); x.lineTo(140, hor); x.lineTo(160, BH); x.lineTo(96, BH); x.fill();
}

export function drawC11dBg(x, d, hor) {
  if (d.deco === 'c11d_tower') return drawTower(x, hor);
  if (d.deco === 'c11d_sound') return drawHall(x, hor);
  return drawThrone(x, hor);
}
export function drawC11dFloorBg(x, d, hor) {
  if (d.deco === 'c11d_tower') return towerFloor(x, hor);
  if (d.deco === 'c11d_sound') return hallFloor(x, hor);
  return throneFloor(x, hor);
}
