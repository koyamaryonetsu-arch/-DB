// 第3部 第1章 第3幕「さかさのピラミッド」の 戦いの 背景（c9b-bg.js の drawC9bBg から よぶ。BW×BH の まま かく。hor … 地面の たかさ）
// ・c9c_river（deco 'c9c_river'）… 地下の川: 暗い 空どうの 川。頭の 上に さかさの 町の 家と まどの 明かり・光る こけ・いかだ
// ・c9c_pyramid（deco 'c9c_pyramid'）… さかさのピラミッド: 下ほど せまい 金色の 石の かべ・まん中の ふきぬけに 砂の たき（下から 上へ 光る つぶ）
//   ナゾカケの 戦いも ここ（天じょうの 石の 板）
// ・c9c_note（deco 'c9c_note'）… 音の間: 黄色い 光の 玉（星の音）が うかぶ 大広間・天じょうに ほった あな（3人組が 落ちて きた）
const BW = 256, BH = 144;

export const C9C_BG = {
  c9c_river: { sky: ['#04060e', '#060a18', '#0a1224', '#101a30'], far: '#0a1220', near: '#08101a', ground: ['#14324a', '#0e2638'], deco: 'c9c_river' },
  c9c_pyramid: { sky: ['#1a1408', '#2a2010', '#3a2c16', '#4a381e'], far: '#3a2c16', near: '#2a2010', ground: ['#6a5430', '#5a4626'], deco: 'c9c_pyramid' },
  c9c_note: { sky: ['#140e1e', '#221830', '#2e2240', '#3a2c4e'], far: '#2a2038', near: '#1e162a', ground: ['#5a4a3a', '#4a3c2e'], deco: 'c9c_note' },
};
export const C9C_DECOS = new Set(Object.keys(C9C_BG));

const rnd = (i, s = 1) => {
  const v = Math.sin(i * 127.1 * s + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const disc = (x, cx, cy, r, c) => { x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); };
const tri = (x, a, b, c, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(...a); x.lineTo(...b); x.lineTo(...c); x.closePath(); x.fill(); };

// 地下の川: 天じょうに さかさの 町（家の 屋根が 下・まどの 明かり）
function drawRiver(x, hor) {
  // 天じょうの 岩
  x.fillStyle = '#0c1220';
  x.beginPath();
  x.moveTo(0, 0);
  for (let i = 0; i <= 32; i++) x.lineTo(i * 8, 8 + Math.round(rnd(i, 3.3) * 8));
  x.lineTo(BW, 0);
  x.closePath();
  x.fill();
  // さかさの 町（天じょうから ぶら下がる 家。屋根が 下）
  for (let i = 0; i < 7; i++) {
    const cx = 18 + i * 36 + Math.round(rnd(i, 1.7) * 8), w = 18 + Math.round(rnd(i, 2.1) * 8), h = 14 + Math.round(rnd(i, 4.4) * 8);
    x.globalAlpha = 0.85;
    x.fillStyle = '#1e2638';
    x.fillRect(cx - w / 2, 10, w, h);
    tri(x, [cx - w / 2 - 2, 10 + h], [cx + w / 2 + 2, 10 + h], [cx, 10 + h + 8], '#2a3048');
    // まどの 明かり
    x.globalAlpha = 0.95;
    x.fillStyle = i % 2 ? '#ffd66b' : '#ffe9a0';
    x.fillRect(cx - 4, 13, 3, 3);
    if (w > 20) x.fillRect(cx + 2, 13 + Math.round(h / 3), 3, 3);
    x.globalAlpha = 0.25;
    disc(x, cx - 2, 15, 5, '#ffd66b');
  }
  x.globalAlpha = 1;
  // 光る こけ（かべ）
  for (let i = 0; i < 30; i++) {
    x.globalAlpha = 0.35 + rnd(i, 5.2) * 0.5;
    x.fillStyle = i % 3 ? '#8affc8' : '#bff4ff';
    x.fillRect(Math.round(rnd(i, 1.9) * BW), Math.round(36 + rnd(i, 6.6) * (hor - 40)), 1, 1);
  }
  x.globalAlpha = 1;
  // 遠くの 岸
  x.fillStyle = '#0a1018';
  for (let i = 0; i < BW; i += 4) x.fillRect(i, hor - 3 - Math.round(Math.abs(Math.sin(i * 0.07)) * 6), 4, 8);
}
function riverFloor(x, hor) {
  // 川の 流れ（光る すじ）
  for (let y = hor + 4, r = 0; y < BH; y += 7, r++) {
    x.globalAlpha = 0.35;
    x.fillStyle = '#4a8ac8';
    for (let k = (r * 23) % 40; k < BW; k += 40) x.fillRect(k, y, 14, 1);
  }
  x.globalAlpha = 1;
  // いかだ（手前）
  x.fillStyle = '#6a4a2a';
  x.fillRect(70, BH - 14, 116, 9);
  x.fillStyle = '#8a6440';
  for (let i = 0; i < 8; i++) x.fillRect(72 + i * 14, BH - 13, 12, 7);
  x.fillStyle = '#4a321a';
  x.fillRect(70, BH - 6, 116, 1);
}

// さかさのピラミッド: 下ほど せまい 金色の 石の かべ・まん中の ふきぬけ（砂の たき）・天じょうの 石の 板
function drawPyramid(x, hor, T = 0) {
  // さかさの 三角の かべ（下ほど せまい）
  tri(x, [0, 0], [BW, 0], [BW / 2, hor + 30], '#4a3a1c');
  tri(x, [16, 0], [BW - 16, 0], [BW / 2, hor + 20], '#5a4824');
  // 石の 段（よこの すじ。上ほど 長い）
  x.fillStyle = '#7a6434';
  for (let i = 1; i < 9; i++) {
    const y = i * 11;
    const half = (BW / 2 - 16) * (1 - y / (hor + 20));
    if (half <= 0) break;
    x.fillRect(BW / 2 - half, y, half * 2, 1);
  }
  // 天じょうの 石の 板
  x.fillStyle = '#3a2c14';
  x.fillRect(0, 0, BW, 6);
  // まん中の ふきぬけ（砂の たき）
  x.globalAlpha = 0.5;
  x.fillStyle = '#e8c870';
  x.fillRect(BW / 2 - 6, 6, 12, hor - 6);
  x.globalAlpha = 1;
  for (let i = 0; i < 24; i++) {
    x.globalAlpha = 0.5 + rnd(i, 2.7) * 0.5;
    x.fillStyle = i % 2 ? '#fff0b0' : '#f0d080';
    x.fillRect(BW / 2 - 5 + Math.round(rnd(i, 3.1) * 10), Math.round(8 + rnd(i, 7.7) * (hor - 12)), 1, 2);
  }
  x.globalAlpha = 1;
  // かべの たいまつ
  for (const cx of [40, BW - 40]) {
    x.fillStyle = '#3a2a14';
    x.fillRect(cx - 1, hor - 34, 2, 8);
    disc(x, cx, hor - 37, 3, '#ffb84a');
    disc(x, cx, hor - 38, 1.5, '#fff0a0');
    x.globalAlpha = 0.18;
    disc(x, cx, hor - 37, 12, '#ffb84a');
    x.globalAlpha = 1;
  }
  // ゆかの 物が うすく 見える（さかさの 国。天じょうに 宝箱の かげ）
  x.globalAlpha = 0.35;
  x.fillStyle = '#c89a2a';
  x.fillRect(70, 8, 10, 6);
  x.fillRect(176, 8, 10, 6);
  x.globalAlpha = 1;
  void T;
}
function pyramidFloor(x, hor) {
  x.fillStyle = 'rgba(0,0,0,0.22)';
  for (let y = hor + 8; y < BH; y += 9) x.fillRect(0, y, BW, 1);
  for (let y = hor + 8, r = 0; y < BH; y += 9, r++) for (let k = (r * 13) % 26; k < BW; k += 26) x.fillRect(k, y - 8, 1, 8);
  // 砂の すじ
  x.fillStyle = '#c8a860';
  for (let i = 0; i < 14; i++) x.fillRect(Math.round(rnd(i, 8.1) * BW), hor + 4 + Math.round(rnd(i, 3.9) * (BH - hor - 8)), 3, 1);
}

// 音の間: 黄色い 光の 玉・天じょうの あな・4つの ボタンの 台
function drawNote(x, hor) {
  // 天じょう（ほった あなから 光が さす）
  x.fillStyle = '#1a1424';
  x.fillRect(0, 0, BW, 10);
  x.fillStyle = '#0a0810';
  x.beginPath();
  x.ellipse(BW * 0.7, 6, 18, 6, 0, 0, Math.PI * 2);
  x.fill();
  x.globalAlpha = 0.18;
  tri(x, [BW * 0.7 - 16, 8], [BW * 0.7 + 16, 8], [BW * 0.7 + 30, hor], '#ffe9a0');
  x.globalAlpha = 1;
  // かべの はしら
  for (const cx of [24, 72, 184, 232]) {
    x.fillStyle = '#3a2e4a';
    x.fillRect(cx - 6, 10, 12, hor - 10);
    x.fillStyle = '#4a3c5a';
    x.fillRect(cx - 6, 10, 3, hor - 10);
  }
  // 星の音（黄色い 光の 玉）
  const cx = BW / 2, cy = 36;
  x.globalAlpha = 0.18;
  disc(x, cx, cy, 22, '#fff2a0');
  x.globalAlpha = 0.35;
  disc(x, cx, cy, 13, '#ffe066');
  x.globalAlpha = 1;
  disc(x, cx, cy, 7, '#ffe066');
  disc(x, cx - 2, cy - 2, 3, '#fffbe0');
  // 音の しるし（光の 輪）
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    x.globalAlpha = 0.6;
    x.fillStyle = '#fff2a0';
    x.fillRect(Math.round(cx + Math.cos(a) * 28), Math.round(cy + Math.sin(a) * 16), 1, 1);
  }
  x.globalAlpha = 1;
}
function noteFloor(x, hor) {
  x.fillStyle = 'rgba(0,0,0,0.2)';
  for (let y = hor + 8; y < BH; y += 9) x.fillRect(0, y, BW, 1);
  // 4つの ボタンの 台（太陽・砂・月・星）
  const cols = ['#ff9a4a', '#e8c870', '#bfe8ff', '#ffe066'];
  cols.forEach((c, i) => {
    const cx = 40 + i * 58;
    x.fillStyle = '#3a2e22';
    x.fillRect(cx - 7, hor + 10, 14, 5);
    disc(x, cx, hor + 10, 4, c);
  });
}

export function drawC9cBg(x, d, hor) {
  if (d.deco === 'c9c_river') drawRiver(x, hor);
  else if (d.deco === 'c9c_note') drawNote(x, hor);
  else drawPyramid(x, hor);
}
export function drawC9cFloorBg(x, d, hor) {
  if (d.deco === 'c9c_river') riverFloor(x, hor);
  else if (d.deco === 'c9c_note') noteFloor(x, hor);
  else pyramidFloor(x, hor);
}
