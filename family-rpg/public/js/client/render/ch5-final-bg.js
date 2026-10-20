// 第5章 Step 9（B9）「星のない広間」の 戦いの 背景（battlefx.js の battleBackground から よぶ。BW×BH の まま かく。hor … 地面の たかさ）
// ・castle_top（deco 'castle_top'）… 影の城の てっぺん「星のない広間」: 星の ない こん色の 空・大きな まるい 窓わく・左右の こわれた 黒い はしら・
//   むらさきの 火の 台。ゆかは 黒い 石の ゆか（うすく うつりこむ）
// ・solitus_void（deco 'solitus_void'）… ソリトゥスの 第2段階から: ひとりぼっちの闇。まっ黒な 空に 闇の わ・うかぶ 広間の かけら・
//   遠くの 小さな ひとりぼっちの 光。ゆかは 黒い 水かがみ（波の すじ）
const BW = 256, BH = 144;

export const FINAL_BG = {
  castle_top: { sky: ['#05040c', '#0a0818', '#120e26', '#1a1434'], far: '#0c0a18', near: '#1e1830', ground: ['#16121f', '#0e0b16'], deco: 'castle_top' },
  solitus_void: { sky: ['#000000', '#040208', '#0a0414', '#120820'], far: '#04020a', near: '#0c0814', ground: ['#07050c', '#030206'], deco: 'solitus_void' },
};
export const FINAL_DECOS = new Set(['castle_top', 'solitus_void']);

const rnd = (i, s = 1) => {
  const v = Math.sin(i * 127.1 * s + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const disc = (x, cx, cy, r, c) => { x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); };
const ring = (x, cx, cy, rx, ry, c, w = 1) => { x.strokeStyle = c; x.lineWidth = w; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.stroke(); };

// ───── 星のない広間 ─────
function drawTop(x, hor) {
  // 大きな まるい 窓わく（星の ない 夜が 見える）
  disc(x, 128, 34, 40, '#0a0816');
  ring(x, 128, 34, 40, 40, '#2a2448', 3);
  ring(x, 128, 34, 34, 34, '#1e1a36', 1);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    x.strokeStyle = '#221e3c';
    x.lineWidth = 1;
    x.beginPath(); x.moveTo(128 + Math.cos(a) * 6, 34 + Math.sin(a) * 6); x.lineTo(128 + Math.cos(a) * 39, 34 + Math.sin(a) * 39); x.stroke();
  }
  disc(x, 128, 34, 6, '#1a1630');
  // 消えた 星の あと（とても うすい）
  for (let i = 0; i < 9; i++) disc(x, 100 + rnd(i, 2.3) * 56, 10 + rnd(i, 3.1) * 48, 0.6, 'rgba(120,110,170,0.35)');
  // 左右の 黒い はしら（上が こわれている）
  for (const [px, top, w] of [[14, 6, 18], [52, 18, 14], [190, 16, 14], [224, 4, 18]]) {
    x.fillStyle = '#0e0b1a';
    x.fillRect(px, top, w, hor - top);
    x.fillStyle = '#1c1830';
    x.fillRect(px + 2, top, 3, hor - top);
    x.fillStyle = '#08060f';
    x.fillRect(px + w - 3, top, 3, hor - top);
    // こわれた 上の はし
    x.fillStyle = '#05040c';
    x.beginPath(); x.moveTo(px, top); x.lineTo(px + w * 0.4, top + 5); x.lineTo(px + w * 0.7, top - 1); x.lineTo(px + w, top + 4); x.lineTo(px + w, top - 6); x.lineTo(px, top - 6); x.closePath(); x.fill();
    x.fillStyle = '#2a2448';
    x.fillRect(px - 2, hor - 6, w + 4, 6);
  }
  // むらさきの 火の 台（はしらの あいだ）
  for (const fx of [40, 216]) {
    x.fillStyle = '#1c1830';
    x.fillRect(fx - 3, hor - 18, 6, 18);
    x.fillRect(fx - 6, hor - 20, 12, 3);
    disc(x, fx, hor - 25, 6, 'rgba(120,70,200,0.35)');
    disc(x, fx, hor - 24, 3.5, '#7a4ac8');
    disc(x, fx, hor - 23, 2, '#c8a8ff');
  }
  // 広間の かべの すじ
  x.fillStyle = 'rgba(40,32,70,0.5)';
  for (let y = 70; y < hor; y += 4) x.fillRect(70, y, 116, 1);
}
function drawTopFloor(x, hor) {
  // 黒い 石の ゆか（たいる の めじ と うつりこみ）
  x.fillStyle = 'rgba(60,50,100,0.25)';
  for (let i = 0; i < 6; i++) {
    const y = hor + 6 + i * i * 2;
    if (y < BH) x.fillRect(0, y, BW, 1);
  }
  for (let k = -8; k <= 8; k++) {
    x.strokeStyle = 'rgba(60,50,100,0.2)';
    x.lineWidth = 1;
    x.beginPath(); x.moveTo(128 + k * 6, hor + 2); x.lineTo(128 + k * 30, BH); x.stroke();
  }
  // 窓の 光の うつりこみ（まん中に うすい むらさき）
  x.fillStyle = 'rgba(90,70,160,0.12)';
  x.beginPath(); x.ellipse(128, hor + 22, 46, 10, 0, 0, Math.PI * 2); x.fill();
  // 火の 台の うつりこみ
  for (const fx of [40, 216]) {
    x.fillStyle = 'rgba(120,70,200,0.18)';
    x.fillRect(fx - 2, hor + 3, 4, 14);
  }
}

// ───── ひとりぼっちの闇 ─────
function drawVoid(x, hor) {
  // 闇の わ（ソリトゥスの まわりに ひろがる）
  for (let i = 0; i < 5; i++) ring(x, 128, 50, 30 + i * 22, 14 + i * 10, `rgba(${70 - i * 8},${40 - i * 4},${120 - i * 14},${0.5 - i * 0.08})`, 1);
  // うかぶ 広間の かけら（黒い 石の かたまり）
  for (let i = 0; i < 7; i++) {
    const cx = rnd(i, 4.1) * BW, cy = 10 + rnd(i, 5.3) * (hor - 26), s = 3 + rnd(i, 6.7) * 6;
    x.fillStyle = '#100c1c';
    x.beginPath(); x.moveTo(cx - s, cy); x.lineTo(cx, cy - s * 0.6); x.lineTo(cx + s, cy); x.lineTo(cx + s * 0.4, cy + s * 0.8); x.lineTo(cx - s * 0.5, cy + s * 0.6); x.closePath(); x.fill();
    x.fillStyle = '#2a2244';
    x.fillRect(Math.round(cx - s * 0.6), Math.round(cy - 1), Math.round(s), 1);
  }
  // 遠くの 小さな ひとりぼっちの 光（ぽつん、ぽつん）
  for (const [cx, cy] of [[22, 18], [236, 26], [60, 60], [196, 64]]) {
    disc(x, cx, cy, 3, 'rgba(90,150,220,0.25)');
    disc(x, cx, cy, 1, '#9ad8ff');
  }
  // 上から たれる 闇の すじ
  x.fillStyle = 'rgba(30,14,50,0.6)';
  for (let i = 0; i < 12; i++) {
    const px = Math.round(rnd(i, 7.9) * BW), len = 10 + Math.round(rnd(i, 8.3) * 30);
    x.fillRect(px, 0, 1, len);
  }
}
function drawVoidFloor(x, hor) {
  // 黒い 水かがみ（波の すじ）
  for (let i = 0; i < 7; i++) {
    const y = hor + 4 + i * i * 1.6;
    if (y >= BH) break;
    x.fillStyle = `rgba(80,60,140,${0.22 - i * 0.025})`;
    for (let k = (i * 13) % 20; k < BW; k += 26) x.fillRect(k, Math.round(y), 10 + (i % 3) * 4, 1);
  }
  x.fillStyle = 'rgba(90,150,220,0.1)';
  x.beginPath(); x.ellipse(128, hor + 26, 60, 9, 0, 0, Math.PI * 2); x.fill();
}

export function drawFinalBg(x, d, hor) {
  if (d.deco === 'castle_top') drawTop(x, hor);
  else if (d.deco === 'solitus_void') drawVoid(x, hor);
}
export function drawFinalFloorBg(x, d, hor) {
  if (d.deco === 'castle_top') drawTopFloor(x, hor);
  else if (d.deco === 'solitus_void') drawVoidFloor(x, hor);
}
