// 第3部 第1章 第2幕「鉱山の底の先」の 戦いの 背景（c9a-bg.js の drawC9aBg から よぶ。BW×BH の まま かく。hor … 地面の たかさ）
// ・c9b_under（deco 'c9b_under'）… 大地の下: まっ暗な 大きな 空に、今まで もぐった ダンジョンの「底」が 天じょうから ぶら下がる。
//   遠くに 小さな 明かり・すいしょうの 柱・光る こけ（たてあな・大地の下・暗い 所の 大ミミズ）
// ・c9b_feast（deco 'c9b_feast'）… 大王の やしきの ごちそうの 間: 赤い たれまく・明かりの つぼ・長い テーブル（手下・大王の 戦い）
// 第3部 第1章 第3幕（地下の川・さかさのピラミッド・音の間。c9c-bg.js）もここから
import { C9C_BG, C9C_DECOS, drawC9cBg, drawC9cFloorBg } from './c9c-bg.js';
// 第3部 第1章 第4幕（ふたごの道・星のはかば。c9d-bg.js）
import { C9D_BG, C9D_DECOS, drawC9dBg, drawC9dFloorBg } from './c9d-bg.js';
// 第3部 第2章 第1幕（古い道・熱の間・根の国・大木の前。c10a-bg.js）
import { C10A_BG, C10A_DECOS, drawC10aBg, drawC10aFloorBg } from './c10a-bg.js';

const BW = 256, BH = 144;

export const C9B_BG = {
  c9b_under: { sky: ['#04040c', '#080816', '#0e0e22', '#16162e'], far: '#10101e', near: '#0c0c18', ground: ['#24222e', '#1c1a26'], deco: 'c9b_under' },
  c9b_feast: { sky: ['#1a0e10', '#2a1416', '#3a1c1c', '#4a2622'], far: '#3a1e18', near: '#2a1612', ground: ['#5a3a26', '#4a2e1e'], deco: 'c9b_feast' },
  ...C9C_BG,
  ...C9D_BG,
  ...C10A_BG,
};
export const C9B_DECOS = new Set(Object.keys(C9B_BG));

const rnd = (i, s = 1) => {
  const v = Math.sin(i * 127.1 * s + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const disc = (x, cx, cy, r, c) => { x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); };
const tri = (x, a, b, c, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(...a); x.lineTo(...b); x.lineTo(...c); x.closePath(); x.fill(); };

// 天じょうから ぶら下がる ダンジョンの 底（さかさの ピラミッド・鉱山の 岩・神殿の 柱）
function hanging(x, hor) {
  // さかさの ピラミッド（遠く。うすい 色）
  x.globalAlpha = 0.55;
  tri(x, [34, 0], [96, 0], [65, 46], '#3a3420');
  tri(x, [65, 0], [96, 0], [65, 46], '#2a2616');
  x.fillStyle = '#4a4228';
  for (let i = 1; i < 5; i++) x.fillRect(34 + i * 6, i * 9, 62 - i * 12, 1);
  // 鉱山の 底（ごつごつ した 岩と 光る 鉱石）
  x.fillStyle = '#2a2a36';
  x.beginPath();
  x.moveTo(140, 0);
  for (let i = 0; i <= 10; i++) x.lineTo(140 + i * 5, 14 + Math.round(rnd(i, 2.3) * 16) + (i > 3 && i < 7 ? 10 : 0));
  x.lineTo(190, 0);
  x.closePath();
  x.fill();
  for (let i = 0; i < 5; i++) {
    x.fillStyle = i % 2 ? '#bfe8ff' : '#ffd66b';
    x.fillRect(146 + i * 9, 10 + Math.round(rnd(i, 5.1) * 14), 2, 2);
  }
  // 水の神殿の 柱（さかさ）
  x.fillStyle = '#2a3a4a';
  for (const cx of [214, 226, 238]) x.fillRect(cx, 0, 6, 26 + (cx === 226 ? 6 : 0));
  x.fillRect(208, 26, 38, 4);
  x.globalAlpha = 1;
  // 遠くの 小さな 明かり（地下の 村）
  for (const [cx, cy] of [[112, hor - 26], [120, hor - 24], [116, hor - 30]]) {
    x.globalAlpha = 0.35;
    disc(x, cx, cy, 2, '#ffd66b');
    x.globalAlpha = 0.9;
    x.fillStyle = '#ffe9a0';
    x.fillRect(cx, cy, 1, 1);
  }
  x.globalAlpha = 1;
}
function drawUnder(x, hor) {
  // 遠くの まっ暗な 空の 光の つぶ（ただよう 胞子）
  for (let i = 0; i < 40; i++) {
    x.globalAlpha = 0.2 + rnd(i, 4.1) * 0.5;
    x.fillStyle = i % 3 ? '#8affc8' : '#bfe8ff';
    x.fillRect(Math.round(rnd(i, 1.3) * BW), Math.round(rnd(i, 2.9) * (hor - 10)), 1, 1);
  }
  x.globalAlpha = 1;
  hanging(x, hor);
  // すいしょうの 柱（左右）
  for (const [cx, h, c] of [[18, 46, '#5ac8e8'], [236, 38, '#7ad8f0'], [200, 22, '#5ab8d8']]) {
    x.globalAlpha = 0.2;
    disc(x, cx, hor - h / 2, h * 0.6, c);
    x.globalAlpha = 1;
    tri(x, [cx - 6, hor], [cx, hor - h], [cx + 6, hor], c);
    tri(x, [cx, hor], [cx, hor - h], [cx + 6, hor], '#c8f4ff');
  }
  // 地面の 岩
  x.fillStyle = '#16141e';
  for (let i = 0; i < BW; i += 4) x.fillRect(i, hor - 3 - Math.round(Math.abs(Math.sin(i * 0.07)) * 6), 4, 6);
  // 光る こけ
  for (let i = 0; i < 20; i++) {
    x.globalAlpha = 0.5 + rnd(i, 2.2) * 0.4;
    x.fillStyle = i % 3 ? '#8aff9a' : '#c8ffb0';
    x.fillRect(Math.round(rnd(i, 6.1) * BW), hor - 2 - Math.round(rnd(i, 8.3) * 6), 2, 1);
  }
  x.globalAlpha = 1;
}

// ごちそうの 間: 赤い たれまく・明かりの つぼ・王さまの はた
function drawFeast(x, hor) {
  // かべの 石
  x.fillStyle = 'rgba(0,0,0,0.18)';
  for (let y = 8; y < hor; y += 10) x.fillRect(0, y, BW, 1);
  for (let y = 8, r = 0; y < hor; y += 10, r++) for (let k = (r * 13) % 24; k < BW; k += 24) x.fillRect(k, y - 9, 1, 9);
  // 赤い たれまく
  for (const cx of [0, 64, 128, 192, 256]) {
    x.fillStyle = '#9a1a24';
    x.beginPath();
    x.moveTo(cx - 22, 0);
    x.quadraticCurveTo(cx - 10, 26, cx - 22, 40);
    x.lineTo(cx - 14, 40);
    x.quadraticCurveTo(cx, 18, cx + 14, 40);
    x.lineTo(cx + 22, 40);
    x.quadraticCurveTo(cx + 10, 26, cx + 22, 0);
    x.closePath();
    x.fill();
    x.fillStyle = '#ffd040';
    x.fillRect(cx - 22, 0, 44, 2);
  }
  // 王さまの はた（もぐらの 顔と かんむり。もとの 作品の しるしでは ない）
  for (const cx of [96, 160]) {
    x.fillStyle = '#d8303a';
    x.fillRect(cx - 9, 44, 18, 26);
    tri(x, [cx - 9, 70], [cx, 64], [cx + 9, 70], '#3a1c1c');
    disc(x, cx, 55, 5, '#8a6448');
    disc(x, cx, 57, 2, '#ff8a9a');
    x.fillStyle = '#ffd040';
    x.fillRect(cx - 4, 47, 8, 2);
    x.fillRect(cx - 4, 45, 1, 2);
    x.fillRect(cx, 44, 1, 3);
    x.fillRect(cx + 3, 45, 1, 2);
  }
  // 明かりの つぼ（光る こけ が 入って いる）
  for (const cx of [30, 128, 226]) {
    x.globalAlpha = 0.28;
    disc(x, cx, hor - 30, 14, '#ffd66b');
    x.globalAlpha = 1;
    x.fillStyle = '#6a4a2a';
    x.fillRect(cx - 4, hor - 24, 8, 24);
    x.fillStyle = '#c8a050';
    x.fillRect(cx - 6, hor - 28, 12, 4);
    disc(x, cx, hor - 32, 4, '#c8ff8a');
    x.fillStyle = '#ffffff';
    x.fillRect(cx - 1, hor - 34, 1, 1);
  }
  // 長い テーブル（おくに）
  x.fillStyle = '#7a4a2a';
  x.fillRect(48, hor - 14, 160, 6);
  x.fillStyle = '#f0e0c8';
  x.fillRect(48, hor - 16, 160, 3);
  x.fillStyle = '#5a3418';
  for (const cx of [54, 128, 200]) x.fillRect(cx, hor - 8, 3, 8);
}

export function drawC9bBg(x, d, hor) {
  if (C9C_DECOS.has(d.deco)) return drawC9cBg(x, d, hor);
  if (C9D_DECOS.has(d.deco)) return drawC9dBg(x, d, hor);
  if (C10A_DECOS.has(d.deco)) return drawC10aBg(x, d, hor);
  if (d.deco === 'c9b_feast') drawFeast(x, hor);
  else drawUnder(x, hor);
}

// ゆか: 大地の下 … 黒い すなと 光る こけ ／ ごちそうの 間 … 赤い じゅうたんと 木の ゆか
export function drawC9bFloorBg(x, d, hor) {
  if (C9C_DECOS.has(d.deco)) return drawC9cFloorBg(x, d, hor);
  if (C9D_DECOS.has(d.deco)) return drawC9dFloorBg(x, d, hor);
  if (C10A_DECOS.has(d.deco)) return drawC10aFloorBg(x, d, hor);
  if (d.deco === 'c9b_feast') {
    x.fillStyle = 'rgba(0,0,0,0.2)';
    for (let y = hor + 6; y < BH; y += 8) x.fillRect(0, y, BW, 1);
    x.fillStyle = '#9a1a24';
    x.beginPath();
    x.moveTo(96, hor + 2);
    x.lineTo(160, hor + 2);
    x.lineTo(200, BH);
    x.lineTo(56, BH);
    x.closePath();
    x.fill();
    x.fillStyle = '#ffd040';
    x.fillRect(96, hor + 2, 64, 1);
    return;
  }
  x.fillStyle = 'rgba(0,0,0,0.22)';
  for (let i = 0; i < 40; i++) x.fillRect(Math.round(rnd(i, 3.7) * BW), hor + 3 + Math.round(rnd(i, 6.5) * (BH - hor - 6)), 3, 1);
  for (let i = 0; i < 14; i++) {
    x.globalAlpha = 0.5 + rnd(i, 4.4) * 0.4;
    x.fillStyle = i % 2 ? '#8aff9a' : '#bfe8ff';
    x.fillRect(Math.round(rnd(i, 9.1) * BW), hor + 4 + Math.round(rnd(i, 5.7) * (BH - hor - 8)), 2, 1);
  }
  x.globalAlpha = 1;
}
