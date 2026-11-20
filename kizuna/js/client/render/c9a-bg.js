// 第3部 第1章 第1幕「星ふるえの夜」の 戦いの 背景（battlefx.js の battleBackground から よぶ。BW×BH の まま かく。hor … 地面の たかさ）
// ・c9a_forest（deco 'c9a_forest'）… 星ふるえの森: 星の 夜空と ながれ星の すじ・たおれた 木・光る かけらが ちらばる 森（3人組の 戦いも ここ）
// ・c9a_cave（deco 'c9a_cave'）… 星の石の地下道: 暗い 石の 道・光る こけ・星の石の 根・大きな 光の 水しょう（ホシモリの ためしも ここ）
// 第3部 第1章 第2幕（大地の下・ごちそうの 間。c9b-bg.js）もここから
import { C9B_BG, C9B_DECOS, drawC9bBg, drawC9bFloorBg } from './c9b-bg.js?v=69e37e491d1f';

const BW = 256, BH = 144;

export const C9A_BG = {
  c9a_forest: { sky: ['#060a1c', '#0c1430', '#18224a', '#283462'], far: '#142438', near: '#0e1c2a', ground: ['#22382a', '#1a2c22'], deco: 'c9a_forest' },
  c9a_cave: { sky: ['#06060e', '#0c0c1a', '#141426', '#1c1c32'], far: '#1a1a2c', near: '#141424', ground: ['#2a2a3a', '#22222e'], deco: 'c9a_cave' },
  ...C9B_BG,
};
export const C9A_DECOS = new Set(Object.keys(C9A_BG));

const rnd = (i, s = 1) => {
  const v = Math.sin(i * 127.1 * s + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const disc = (x, cx, cy, r, c) => { x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); };
// 4つの 光の きらきら（ドット）
function twinkle(x, cx, cy, r, c) {
  x.fillStyle = c;
  x.fillRect(cx - r, cy, r * 2 + 1, 1);
  x.fillRect(cx, cy - r, 1, r * 2 + 1);
  x.fillStyle = '#ffffff';
  x.fillRect(cx, cy, 1, 1);
}
// 光る かけら（小さな ひし形）
function shard(x, cx, cy, s, c) {
  x.fillStyle = c;
  x.beginPath();
  x.moveTo(cx, cy - s);
  x.lineTo(cx + s * 0.6, cy);
  x.lineTo(cx, cy + s);
  x.lineTo(cx - s * 0.6, cy);
  x.closePath();
  x.fill();
  x.globalAlpha = 0.25;
  disc(x, cx, cy, s * 2.2, c);
  x.globalAlpha = 1;
}
// 森の 木（かげ）
function tree(x, cx, base, h, c) {
  x.fillStyle = c;
  x.fillRect(cx - 2, base - h * 0.35, 4, h * 0.35);
  for (let i = 0; i < 3; i++) {
    const w = 18 - i * 4, y = base - h * 0.3 - i * h * 0.22;
    x.beginPath();
    x.moveTo(cx - w, y);
    x.lineTo(cx, y - h * 0.32);
    x.lineTo(cx + w, y);
    x.closePath();
    x.fill();
  }
}

function drawForest(x, hor) {
  // 星
  for (let i = 0; i < 60; i++) {
    x.globalAlpha = 0.3 + rnd(i, 4.1) * 0.7;
    x.fillStyle = i % 5 ? '#ffffff' : '#fff2a8';
    x.fillRect(Math.round(rnd(i, 1.3) * BW), Math.round(rnd(i, 2.9) * (hor - 24)), 1, 1);
  }
  x.globalAlpha = 1;
  for (const [cx, cy] of [[34, 12], [200, 22], [150, 8]]) twinkle(x, cx, cy, 2, '#fff2a8');
  // ながれ星の すじ（北東へ）
  const grad = x.createLinearGradient(60, 6, 168, 46);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(1, 'rgba(255,246,200,0.9)');
  x.strokeStyle = grad;
  x.lineWidth = 2;
  x.beginPath();
  x.moveTo(60, 6);
  x.lineTo(168, 46);
  x.stroke();
  disc(x, 168, 46, 2.5, '#fffbe0');
  x.globalAlpha = 0.3;
  disc(x, 168, 46, 7, '#fff2a8');
  x.globalAlpha = 1;
  // 遠くの 森
  for (let i = 0; i < 14; i++) tree(x, i * 20 + 6, hor - 4, 30 + rnd(i, 5.3) * 18, '#122030');
  // 近くの 木と たおれた 木
  for (const [cx, h] of [[16, 70], [236, 64], [62, 52], [200, 50]]) tree(x, cx, hor + 2, h, '#0a1620');
  x.fillStyle = '#2a1e16';
  x.save();
  x.translate(96, hor - 6);
  x.rotate(-0.12);
  x.fillRect(0, 0, 64, 6);
  x.fillStyle = '#3a2c20';
  x.fillRect(0, 0, 64, 2);
  x.restore();
  // 光る かけら（木の 間）
  for (const [cx, cy] of [[44, hor - 10], [120, hor - 18], [182, hor - 8], [226, hor - 14]]) shard(x, cx, cy, 2, '#bff4ff');
}
function drawCave(x, hor) {
  // 天じょうの 岩と つらら石
  x.fillStyle = '#0a0a14';
  for (let i = 0; i < BW; i += 6) {
    const h = 6 + Math.round(rnd(i, 3.3) * 14);
    x.fillRect(i, 0, 6, h);
    if (rnd(i, 7.7) > 0.7) {
      x.beginPath();
      x.moveTo(i, h);
      x.lineTo(i + 3, h + 10 + rnd(i, 1.1) * 10);
      x.lineTo(i + 6, h);
      x.closePath();
      x.fill();
    }
  }
  // 星の石の 根（白く 光る すじが 天じょうから）
  x.strokeStyle = 'rgba(200,220,255,0.35)';
  x.lineWidth = 2;
  for (const [sx, ex] of [[40, 30], [140, 152], [214, 226]]) {
    x.beginPath();
    x.moveTo(sx, 8);
    x.quadraticCurveTo((sx + ex) / 2 + 12, hor * 0.5, ex, hor - 6);
    x.stroke();
  }
  // 大きな 光の 水しょう（光の みなもと）
  x.globalAlpha = 0.25;
  disc(x, 128, hor - 30, 26, '#9ae8ff');
  x.globalAlpha = 1;
  x.fillStyle = '#7ad0f0';
  x.beginPath();
  x.moveTo(128, hor - 52);
  x.lineTo(138, hor - 30);
  x.lineTo(128, hor - 10);
  x.lineTo(118, hor - 30);
  x.closePath();
  x.fill();
  x.fillStyle = '#d8f8ff';
  x.beginPath();
  x.moveTo(128, hor - 50);
  x.lineTo(132, hor - 30);
  x.lineTo(128, hor - 16);
  x.closePath();
  x.fill();
  // かべの 光る こけ
  for (let i = 0; i < 26; i++) {
    const cx = Math.round(rnd(i, 6.1) * BW), cy = Math.round(18 + rnd(i, 8.3) * (hor - 26));
    if (Math.abs(cx - 128) < 30) continue;
    x.globalAlpha = 0.4 + rnd(i, 2.2) * 0.5;
    x.fillStyle = i % 3 ? '#8aff9a' : '#c8ffb0';
    x.fillRect(cx, cy, 2, 1);
  }
  x.globalAlpha = 1;
  // かべの 岩
  x.fillStyle = '#121220';
  for (let i = 0; i < BW; i += 4) x.fillRect(i, hor - 4 - Math.round(Math.abs(Math.sin(i * 0.09)) * 8), 4, 8);
}

export function drawC9aBg(x, d, hor) {
  if (C9B_DECOS.has(d.deco)) return drawC9bBg(x, d, hor);
  if (d.deco === 'c9a_cave') drawCave(x, hor);
  else drawForest(x, hor);
}

// ゆか: 森 … 草と 光る かけら ／ 地下道 … 石だたみと 光る こけ
export function drawC9aFloorBg(x, d, hor) {
  if (C9B_DECOS.has(d.deco)) return drawC9bFloorBg(x, d, hor);
  if (d.deco === 'c9a_cave') {
    x.fillStyle = 'rgba(0,0,0,0.25)';
    for (let y = hor + 8; y < BH; y += 9) x.fillRect(0, y, BW, 1);
    for (let y = hor + 8, r = 0; y < BH; y += 9, r++) for (let k = (r * 17) % 30; k < BW; k += 30) x.fillRect(k, y - 8, 1, 8);
    for (let i = 0; i < 18; i++) {
      x.globalAlpha = 0.5 + rnd(i, 4.4) * 0.4;
      x.fillStyle = '#8aff9a';
      x.fillRect(Math.round(rnd(i, 9.1) * BW), hor + 4 + Math.round(rnd(i, 5.7) * (BH - hor - 8)), 2, 1);
    }
    x.globalAlpha = 1;
    return;
  }
  // 森の ゆか: 草の かげ・光る かけら
  x.fillStyle = 'rgba(0,0,0,0.18)';
  for (let i = 0; i < 40; i++) x.fillRect(Math.round(rnd(i, 3.7) * BW), hor + 3 + Math.round(rnd(i, 6.5) * (BH - hor - 6)), 3, 1);
  for (let i = 0; i < 8; i++) {
    x.globalAlpha = 0.7;
    x.fillStyle = i % 2 ? '#bff4ff' : '#fff2a8';
    const cx = Math.round(rnd(i, 7.9) * BW), cy = hor + 6 + Math.round(rnd(i, 2.1) * (BH - hor - 12));
    x.fillRect(cx, cy, 1, 2);
    x.fillRect(cx - 1, cy + 1, 3, 1);
  }
  x.globalAlpha = 1;
}
