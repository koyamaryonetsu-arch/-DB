// 第2部 第8章 第4幕「時のはざま」の 戦いの 背景（battlefx.js の battleBackground から よぶ。BW×BH の まま かく。hor … 地面の たかさ）
// ・rift_wing（deco 'rift_wing'）… 4つの つばさ: むらさきの 空・時の すなの 川・うかぶ 今までの 場所の かけら（王宮・海の 神殿・空中ようさい・時計塔）
// ・rift_last（deco 'rift_last'）… 最後の 回廊: こわれた 大時計の 回廊・ならぶ 柱・ひびの 入った 空
// ・rift_hall（deco 'rift_hall'）… 時の広間（門番）: 大きな 時の門・4つの 紋章の かべ・まるい ゆかの 文字ばん
// ・rift_moon（deco 'rift_moon'）… 月のつばさの ためし: 夜の 鏡の 部屋・まん中に ともしびの 台
// ・rift_ice（deco 'rift_ice'）… 氷のつばさの ためし: こおった 闘技場・氷の 柱
// ・rift_core（deco 'rift_core'）… さいごの 場所（ソリトゥス）: 星の 海・くずれる 時の 輪・とおくの 千年前と 今の 景色
const BW = 256, BH = 144;

export const C8R_BG = {
  rift_wing: { sky: ['#1a1030', '#2a1a4a', '#4a2a6a', '#7a4a8a'], far: '#4a3a6a', near: '#3a2a5a', ground: ['#5a4a6a', '#4a3a5a'], deco: 'rift_wing' },
  rift_last: { sky: ['#0e0a18', '#1a1028', '#2a1a3a', '#4a2a4a'], far: '#2a2038', near: '#3a2a48', ground: ['#4a4050', '#3a3242'], deco: 'rift_last' },
  rift_hall: { sky: ['#140c24', '#24164a', '#3a2a6a', '#5a3a8a'], far: '#3a2a5a', near: '#2a2048', ground: ['#5a5070', '#4a4060'], deco: 'rift_hall' },
  rift_moon: { sky: ['#0a0c20', '#141a38', '#22284e', '#343a68'], far: '#2a3058', near: '#22284a', ground: ['#4a4e6a', '#3a3e58'], deco: 'rift_moon' },
  rift_ice: { sky: ['#0e1a2a', '#1a3048', '#2a4a68', '#4a7a9a'], far: '#5a8aaa', near: '#3a6a8a', ground: ['#a8c8e0', '#88a8c8'], deco: 'rift_ice' },
  rift_core: { sky: ['#04020c', '#0c0620', '#1a0e36', '#2a1648'], far: '#1a1030', near: '#120a24', ground: ['#2a2040', '#1e1834'], deco: 'rift_core' },
};
export const C8R_DECOS = new Set(Object.keys(C8R_BG));

const rnd = (i, s = 1) => {
  const v = Math.sin(i * 127.1 * s + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const disc = (x, cx, cy, r, c) => { x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); };
function stars(x, n, s, hor, col = '#ffffff') {
  for (let i = 0; i < n; i++) {
    x.globalAlpha = 0.3 + rnd(i, s) * 0.7;
    x.fillStyle = col;
    x.fillRect(Math.round(rnd(i, s * 1.7) * BW), Math.round(rnd(i, s * 2.3) * (hor - 6)), 1, 1);
  }
  x.globalAlpha = 1;
}
// 時計の 文字ばん（cx・cy … まんなか、r … 大きさ）
function clock(x, cx, cy, r, rim, face, hand) {
  disc(x, cx, cy, r, rim);
  disc(x, cx, cy, r * 0.85, face);
  x.fillStyle = rim;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    x.fillRect(Math.round(cx + Math.cos(a) * r * 0.7), Math.round(cy + Math.sin(a) * r * 0.7), 1, 1);
  }
  x.strokeStyle = hand;
  x.lineWidth = 1;
  x.beginPath();
  x.moveTo(cx, cy);
  x.lineTo(cx + r * 0.1, cy - r * 0.55);
  x.moveTo(cx, cy);
  x.lineTo(cx + r * 0.45, cy + r * 0.2);
  x.stroke();
}
// うかぶ 島の かけら（上に 小さな けしき）
function shard(x, cx, cy, w, top, kind) {
  x.fillStyle = '#3a2a4a';
  x.beginPath();
  x.moveTo(cx - w / 2, cy);
  x.lineTo(cx + w / 2, cy);
  x.lineTo(cx + w * 0.1, cy + w * 0.5);
  x.closePath();
  x.fill();
  x.fillStyle = top;
  x.fillRect(Math.round(cx - w / 2), Math.round(cy - 2), Math.round(w), 2);
  x.fillStyle = '#e8e0f0';
  if (kind === 'palace') { x.fillRect(cx - 3, cy - 9, 6, 7); disc(x, cx, cy - 10, 3, '#f0d070'); }
  if (kind === 'temple') { for (let i = -1; i <= 1; i++) x.fillRect(cx + i * 4, cy - 8, 2, 6); x.fillRect(cx - 6, cy - 9, 13, 1); }
  if (kind === 'fort') { x.fillStyle = '#4a4a58'; x.fillRect(cx - 6, cy - 6, 12, 4); x.fillRect(cx - 1, cy - 11, 2, 5); }
  if (kind === 'tower') { x.fillStyle = '#c8b890'; x.fillRect(cx - 2, cy - 14, 4, 12); disc(x, cx, cy - 12, 2, '#fff4c0'); }
}

function drawWing(x, hor) {
  stars(x, 40, 3.1, hor);
  // 時の すなの 川（ななめに ながれる 光）
  x.fillStyle = 'rgba(240,210,140,0.25)';
  x.beginPath();
  x.moveTo(0, hor - 30);
  x.quadraticCurveTo(128, hor - 60, 256, hor - 26);
  x.lineTo(256, hor - 18);
  x.quadraticCurveTo(128, hor - 50, 0, hor - 22);
  x.fill();
  for (let i = 0; i < 30; i++) {
    x.fillStyle = 'rgba(255,230,170,0.7)';
    const t = rnd(i, 4.4);
    x.fillRect(Math.round(t * BW), Math.round(hor - 26 - Math.sin(t * Math.PI) * 30 + rnd(i, 5.1) * 6), 1, 1);
  }
  shard(x, 40, 34, 30, '#f0d070', 'palace');
  shard(x, 100, 22, 24, '#4ab8ff', 'temple');
  shard(x, 168, 30, 30, '#8a8a9a', 'fort');
  shard(x, 222, 18, 24, '#c8b890', 'tower');
}
function drawLast(x, hor) {
  stars(x, 24, 7.3, hor, '#c8a8ff');
  // ひびの 入った 空
  x.strokeStyle = 'rgba(220,180,255,0.35)';
  x.lineWidth = 1;
  x.beginPath();
  x.moveTo(60, 0); x.lineTo(70, 16); x.lineTo(64, 28); x.lineTo(78, 44);
  x.moveTo(200, 0); x.lineTo(192, 20); x.lineTo(204, 34);
  x.stroke();
  // こわれた 大時計（おく）
  clock(x, 128, hor - 40, 30, '#6a5a7a', '#2a2038', '#c8b8e8');
  x.fillStyle = '#120a1c';
  x.beginPath();
  x.moveTo(140, hor - 70); x.lineTo(160, hor - 46); x.lineTo(150, hor - 20); x.lineTo(132, hor - 40);
  x.fill();
  // ならぶ 柱
  for (const px of [12, 52, 196, 236]) {
    x.fillStyle = '#3a3048';
    x.fillRect(px - 6, 10, 12, hor - 10);
    x.fillStyle = '#5a4a6a';
    x.fillRect(px - 6, 10, 3, hor - 10);
    x.fillRect(px - 8, 8, 16, 4);
  }
}
function drawHall(x, hor) {
  stars(x, 30, 5.5, hor);
  // 大きな 時の門（まるい わ）
  x.strokeStyle = '#c8a8ff';
  x.lineWidth = 3;
  x.beginPath();
  x.arc(128, hor - 6, 52, Math.PI, 0);
  x.stroke();
  x.strokeStyle = 'rgba(255,240,180,0.6)';
  x.lineWidth = 1;
  x.beginPath();
  x.arc(128, hor - 6, 46, Math.PI, 0);
  x.stroke();
  x.fillStyle = 'rgba(160,120,255,0.18)';
  x.beginPath();
  x.arc(128, hor - 6, 45, Math.PI, 0);
  x.fill();
  // 4つの 紋章（月・青い火・歯車・氷）
  const crest = [[30, '#f0d070'], [70, '#4ab8ff'], [186, '#c8c8d8'], [226, '#bfefff']];
  for (const [cx, col] of crest) {
    x.fillStyle = '#2a2048';
    x.fillRect(cx - 9, hor - 44, 18, 26);
    disc(x, cx, hor - 32, 6, col);
    disc(x, cx, hor - 32, 3, '#ffffff');
  }
}
function drawMoon(x, hor) {
  stars(x, 50, 2.2, hor);
  disc(x, 200, 26, 14, '#f4f0d0');
  disc(x, 206, 22, 12, '#22284e');
  // 鏡の かべ
  for (const px of [24, 76, 180, 232]) {
    x.fillStyle = '#3a4068';
    x.fillRect(px - 10, hor - 54, 20, 50);
    x.fillStyle = 'rgba(200,220,255,0.35)';
    x.fillRect(px - 8, hor - 52, 16, 46);
    x.fillStyle = 'rgba(255,255,255,0.5)';
    x.fillRect(px - 6, hor - 50, 2, 40);
  }
  // ともしびの 台（まん中の おく）
  x.fillStyle = '#4a4e6a';
  x.fillRect(122, hor - 22, 12, 20);
  x.fillRect(118, hor - 24, 20, 3);
}
function drawIce(x, hor) {
  stars(x, 20, 6.6, hor, '#e0f4ff');
  // 氷の 柱と 闘技場の かべ
  x.fillStyle = 'rgba(220,240,255,0.35)';
  x.fillRect(0, hor - 30, BW, 26);
  for (let i = 0; i < 8; i++) {
    const px = 16 + i * 32;
    x.fillStyle = '#bfe0f4';
    x.beginPath();
    x.moveTo(px - 6, hor - 4);
    x.lineTo(px, hor - 46 - (i % 3) * 8);
    x.lineTo(px + 6, hor - 4);
    x.fill();
    x.fillStyle = 'rgba(255,255,255,0.6)';
    x.fillRect(px - 1, hor - 38 - (i % 3) * 8, 1, 30);
  }
}
function drawCore(x, hor) {
  stars(x, 90, 9.9, hor);
  stars(x, 20, 3.3, hor, '#c8a8ff');
  // くずれる 時の 輪
  for (const [r, c] of [[60, 'rgba(200,160,255,0.35)'], [44, 'rgba(255,230,160,0.3)'], [28, 'rgba(160,220,255,0.3)']]) {
    x.strokeStyle = c;
    x.lineWidth = 2;
    x.beginPath();
    x.arc(128, hor - 30, r, 0.2, Math.PI * 2 - 0.5);
    x.stroke();
  }
  // とおくの 2つの けしき（左 … 千年前の 緑・右 … 今の 町の あかり）
  x.fillStyle = '#1a3a2a';
  x.beginPath();
  x.moveTo(0, hor); x.quadraticCurveTo(30, hor - 22, 64, hor); x.fill();
  x.fillStyle = '#2a2040';
  x.fillRect(196, hor - 14, 10, 14);
  x.fillRect(210, hor - 20, 8, 20);
  x.fillRect(222, hor - 12, 12, 12);
  x.fillStyle = '#ffd66b';
  for (const [px, py] of [[199, hor - 10], [212, hor - 16], [226, hor - 8]]) x.fillRect(px, py, 2, 2);
}

export function drawC8rBg(x, d, hor) {
  switch (d.deco) {
    case 'rift_wing': drawWing(x, hor); break;
    case 'rift_last': drawLast(x, hor); break;
    case 'rift_hall': drawHall(x, hor); break;
    case 'rift_moon': drawMoon(x, hor); break;
    case 'rift_ice': drawIce(x, hor); break;
    default: drawCore(x, hor);
  }
}

// ゆか: 時の すなの ゆか（つばさ・回廊）／ まるい 文字ばん（広間）／ 鏡の ゆか（月）／ 氷の ゆか（氷）／ 星の 海（さいご）
export function drawC8rFloorBg(x, d, hor) {
  if (d.deco === 'rift_hall') {
    x.strokeStyle = 'rgba(220,200,255,0.35)';
    x.lineWidth = 1;
    for (const r of [40, 70, 100]) {
      x.beginPath();
      x.ellipse(128, hor + 30, r, r * 0.25, 0, 0, Math.PI * 2);
      x.stroke();
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      x.fillStyle = 'rgba(255,240,180,0.6)';
      x.fillRect(Math.round(128 + Math.cos(a) * 86), Math.round(hor + 30 + Math.sin(a) * 21), 2, 1);
    }
    return;
  }
  if (d.deco === 'rift_core') {
    // 星の 海（下にも 星）
    for (let i = 0; i < 30; i++) {
      x.globalAlpha = 0.3 + rnd(i, 1.9) * 0.6;
      x.fillStyle = i % 3 ? '#c8a8ff' : '#ffffff';
      x.fillRect(Math.round(rnd(i, 2.7) * BW), hor + 2 + Math.round(rnd(i, 3.9) * (BH - hor - 4)), 1, 1);
    }
    x.globalAlpha = 1;
    return;
  }
  for (let i = 0; i < 6; i++) {
    const y = hor + 3 + Math.round(i * i * 1.5);
    if (y >= BH) break;
    x.fillStyle = d.deco === 'rift_ice' ? 'rgba(255,255,255,0.35)' : d.deco === 'rift_moon' ? 'rgba(200,210,255,0.25)' : 'rgba(255,220,160,0.18)';
    x.fillRect(0, y, BW, 1);
  }
  for (let i = 0; i < 10; i++) {
    const px = Math.round(rnd(i, 8.1) * BW), py = hor + 6 + Math.round(rnd(i, 3.7) * (BH - hor - 10));
    x.fillStyle = d.deco === 'rift_ice' ? '#ffffff' : '#f0d8a0';
    x.fillRect(px, py, 1, 1);
  }
}
