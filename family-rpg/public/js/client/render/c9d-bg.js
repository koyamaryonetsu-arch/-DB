// 第3部 第1章 第4幕「星のはかば」の 戦いの 背景（c9b-bg.js の drawC9bBg から よぶ。BW×BH の まま かく。hor … 地面の たかさ）
// ・c9d_lane（deco 'c9d_lane'）… ふたごの道: 暗い 谷の 2本の 道（左と 右）。まん中は 深い 谷・上に ほそい 星空・
//   左右の がけに ひびきの石（青く 光る）・谷に かかる 糸の 橋（ふつうの 戦い）
// ・c9d_grave（deco 'c9d_grave'）… 星のはかば: 広くて しずかな くぼ地。大きな 星空と ながれ星・灰色の 石（ねむる 星）が くぼみに 1つずつ、
//   かすかに 光る・古い 石の 柱（魔人ムウの 戦い）。こわく ない（明るい 星空の 青と むらさき）
const BW = 256, BH = 144;

export const C9D_BG = {
  c9d_lane: { sky: ['#04040e', '#080a1c', '#0e1228', '#141a34'], far: '#0c1020', near: '#080c18', ground: ['#2a2838', '#22202e'], deco: 'c9d_lane' },
  c9d_grave: { sky: ['#0a0c26', '#141a3e', '#20285a', '#2e3670'], far: '#1c2246', near: '#141a36', ground: ['#4a4a62', '#3e3e54'], deco: 'c9d_grave' },
};
export const C9D_DECOS = new Set(Object.keys(C9D_BG));

const rnd = (i, s = 1) => {
  const v = Math.sin(i * 127.1 * s + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const disc = (x, cx, cy, r, c) => { x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); };
const tri = (x, a, b, c, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(...a); x.lineTo(...b); x.lineTo(...c); x.closePath(); x.fill(); };
function stars(x, n, y0, y1, s = 1) {
  for (let i = 0; i < n; i++) {
    x.globalAlpha = 0.35 + rnd(i, 2.3 * s) * 0.6;
    x.fillStyle = i % 5 ? '#ffffff' : '#fff2a8';
    x.fillRect(Math.round(rnd(i, 1.1 * s) * BW), Math.round(y0 + rnd(i, 5.7 * s) * (y1 - y0)), 1, 1);
  }
  x.globalAlpha = 1;
}
// ひびきの石（青く 光る 音の 石）
function echoStone(x, cx, by, on) {
  x.fillStyle = '#3a4a6a';
  x.beginPath();
  x.moveTo(cx - 6, by);
  x.lineTo(cx - 4, by - 16);
  x.lineTo(cx + 1, by - 20);
  x.lineTo(cx + 5, by - 14);
  x.lineTo(cx + 6, by);
  x.closePath();
  x.fill();
  x.fillStyle = '#5a6e94';
  x.fillRect(cx - 3, by - 15, 2, 12);
  if (on) {
    x.globalAlpha = 0.3;
    disc(x, cx, by - 10, 12, '#9ad8ff');
    x.globalAlpha = 0.9;
    x.fillStyle = '#bff4ff';
    x.fillRect(cx - 1, by - 13, 2, 6);
    x.globalAlpha = 1;
  }
}

// ふたごの道: 左右の がけの 道と、まん中の 深い 谷
function drawLane(x, hor) {
  // ほそい 星空（谷の 上）
  stars(x, 50, 2, 30);
  // 左右の 大きな がけ
  x.fillStyle = '#10121e';
  x.beginPath();
  x.moveTo(0, 0);
  x.lineTo(96, 0);
  for (let i = 0; i <= 8; i++) x.lineTo(96 + Math.round(rnd(i, 3.1) * 8) - i, i * (hor / 8));
  x.lineTo(0, hor);
  x.closePath();
  x.fill();
  x.beginPath();
  x.moveTo(BW, 0);
  x.lineTo(160, 0);
  for (let i = 0; i <= 8; i++) x.lineTo(160 - Math.round(rnd(i, 4.7) * 8) + i, i * (hor / 8));
  x.lineTo(BW, hor);
  x.closePath();
  x.fill();
  // がけの すじ
  x.fillStyle = '#1a1c2c';
  for (let i = 0; i < 14; i++) {
    const y = 6 + i * 6;
    x.fillRect(4 + Math.round(rnd(i, 2.2) * 60), y, 18, 1);
    x.fillRect(176 + Math.round(rnd(i, 6.2) * 60), y + 3, 18, 1);
  }
  // 谷の 下（まっ暗。すこし 青い きり）
  x.globalAlpha = 0.35;
  x.fillStyle = '#2a3a6a';
  x.fillRect(100, hor - 26, 56, 26);
  x.globalAlpha = 1;
  // 糸の 橋（谷わたりグモの）
  x.strokeStyle = 'rgba(220,230,255,0.45)';
  x.lineWidth = 1;
  x.beginPath();
  x.moveTo(96, 52);
  x.quadraticCurveTo(128, 64, 160, 52);
  x.stroke();
  x.beginPath();
  x.moveTo(96, 56);
  x.quadraticCurveTo(128, 70, 160, 56);
  x.stroke();
  // ひびきの石（左右に 1つずつ）
  echoStone(x, 44, hor - 2, true);
  echoStone(x, 212, hor - 2, true);
  // 光る こけ
  for (let i = 0; i < 20; i++) {
    x.globalAlpha = 0.4 + rnd(i, 5.5) * 0.5;
    x.fillStyle = i % 3 ? '#8affc8' : '#bff4ff';
    x.fillRect(Math.round(rnd(i, 7.9) * 90) + (i % 2 ? 166 : 0), Math.round(30 + rnd(i, 8.8) * (hor - 34)), 1, 1);
  }
  x.globalAlpha = 1;
}
function laneFloor(x, hor) {
  // 2本の 道（左と 右）・まん中の 谷の さけめ
  x.fillStyle = 'rgba(0,0,0,0.25)';
  for (let y = hor + 8; y < BH; y += 9) x.fillRect(0, y, BW, 1);
  x.fillStyle = '#06060e';
  x.beginPath();
  x.moveTo(112, hor);
  x.lineTo(144, hor);
  x.lineTo(150, BH);
  x.lineTo(106, BH);
  x.closePath();
  x.fill();
  x.fillStyle = '#3a3850';
  x.fillRect(110, hor, 2, BH - hor);
  x.fillRect(144, hor, 2, BH - hor);
  // 小石
  x.fillStyle = '#4a4860';
  for (let i = 0; i < 18; i++) x.fillRect(Math.round(rnd(i, 3.3) * 100) + (i % 2 ? 150 : 0), hor + 4 + Math.round(rnd(i, 6.1) * (BH - hor - 8)), 2, 1);
}

// 星のはかば: 大きな 星空・ながれ星・ねむる 星（灰色の 石）・古い 石の 柱
function drawGrave(x, hor) {
  stars(x, 120, 2, hor - 14, 1.7);
  // 天の 川（うすい 光の おび）
  x.globalAlpha = 0.12;
  x.fillStyle = '#c8d8ff';
  x.beginPath();
  x.moveTo(0, 30);
  x.quadraticCurveTo(128, 2, BW, 22);
  x.lineTo(BW, 38);
  x.quadraticCurveTo(128, 18, 0, 46);
  x.closePath();
  x.fill();
  x.globalAlpha = 1;
  // ながれ星
  x.strokeStyle = 'rgba(255,246,200,0.75)';
  x.lineWidth = 1;
  x.beginPath();
  x.moveTo(196, 12);
  x.lineTo(222, 26);
  x.stroke();
  disc(x, 223, 27, 1.2, '#fff6c8');
  // 遠くの なだらかな 山（くぼ地の ふち）
  x.fillStyle = '#1a2040';
  x.beginPath();
  x.moveTo(0, hor);
  for (let px = 0; px <= BW; px += 8) x.lineTo(px, hor - 12 - Math.round(Math.abs(Math.sin(px * 0.02)) * 10));
  x.lineTo(BW, hor);
  x.closePath();
  x.fill();
  // 古い 石の 柱（光の弱い星は、ここで、ねむる … 石の 文字）
  for (const [cx, h] of [[30, 34], [226, 28]]) {
    x.fillStyle = '#4a4e6a';
    x.fillRect(cx - 5, hor - h, 10, h);
    x.fillStyle = '#5e6484';
    x.fillRect(cx - 5, hor - h, 3, h);
    x.fillStyle = '#3a3e56';
    for (let i = 0; i < 4; i++) x.fillRect(cx - 2, hor - h + 6 + i * 6, 5, 1);
  }
  // ねむる 星（灰色の 石が くぼみに 1つずつ。かすかに 光る）
  for (let i = 0; i < 9; i++) {
    const cx = 18 + i * 28 + Math.round(rnd(i, 3.7) * 6), cy = hor - 4 + (i % 2 ? 2 : 0);
    x.fillStyle = '#2a2c44';
    x.beginPath();
    x.ellipse(cx, cy + 1, 7, 2.5, 0, 0, Math.PI * 2);
    x.fill();
    disc(x, cx, cy - 2, 3.5, '#8a8ca4');
    disc(x, cx - 1, cy - 3, 1.2, '#b8bad0');
    x.globalAlpha = 0.18 + rnd(i, 9.3) * 0.2;
    disc(x, cx, cy - 2, 7, '#fff2c8');
    x.globalAlpha = 1;
  }
}
function graveFloor(x, hor) {
  x.fillStyle = 'rgba(0,0,0,0.18)';
  for (let y = hor + 8; y < BH; y += 9) x.fillRect(0, y, BW, 1);
  // くぼみ（ねむる 星の くぼみ）
  for (let i = 0; i < 6; i++) {
    const cx = 20 + i * 44 + Math.round(rnd(i, 2.9) * 10), cy = hor + 14 + Math.round(rnd(i, 4.1) * (BH - hor - 22));
    x.fillStyle = '#34344a';
    x.beginPath();
    x.ellipse(cx, cy, 9, 3, 0, 0, Math.PI * 2);
    x.fill();
    disc(x, cx, cy - 1, 2.5, '#7a7c94');
  }
  // 光の つぶ（星の ちり）
  for (let i = 0; i < 16; i++) {
    x.globalAlpha = 0.4 + rnd(i, 7.7) * 0.4;
    x.fillStyle = i % 2 ? '#fff2a8' : '#bfe8ff';
    x.fillRect(Math.round(rnd(i, 5.3) * BW), hor + 4 + Math.round(rnd(i, 1.9) * (BH - hor - 8)), 1, 1);
  }
  x.globalAlpha = 1;
}

export function drawC9dBg(x, d, hor) {
  if (d.deco === 'c9d_grave') drawGrave(x, hor);
  else drawLane(x, hor);
  void tri;
}
export function drawC9dFloorBg(x, d, hor) {
  if (d.deco === 'c9d_grave') graveFloor(x, hor);
  else laneFloor(x, hor);
}
