// 第5章 Step 5「星読みの里」の まわりと「ノクトの思い出の迷宮」の 戦いの 背景（battlefx.js の drawBg から よぶ。BW×BH の まま かく。hor … 地面の たかさ）
// ・hoshiyomi（deco 'hoshiyomi'）… 星読みの里の まわり: こい あい色の 夜空・天の川・三日月・遠くの 里の 星見の 塔（まるい やね）と うかぶ 小島。
//   ゆかは 夜の 草地（青い 草・光る 星の 砂）
// ・memory（deco 'memory'）… 思い出の迷宮 1〜3階: うすむらさきの もやの 中に うかぶ 思い出の かけら（まどの わく・村の 家の 形）・
//   ランプの あたたかい 光。ゆかは 古い 木の ゆか（ランプの 光の わと 長い 影）
// ・memory_deep（deco 'memory_deep'）… 4〜6階・ノクトの影の 広間: くらい むらさきの 中に われた 思い出の かけら・大きな 影。
//   ゆかは 黒い 水の ような ゆか（光の わが うつる）
import { mix } from './pixel.js?v=f7adbedf412d';

const BW = 256, BH = 144;

export const HOSHIYOMI_BG = {
  hoshiyomi: { sky: ['#06081e', '#0e1436', '#1c2450', '#2c3466'], far: '#141a3a', near: '#1e3a4a', ground: ['#24485a', '#1c3a4a'], deco: 'hoshiyomi' },
  memory: { sky: ['#2a2238', '#3a3050', '#524466', '#6a5a7a'], far: '#3a3048', near: '#5a4636', ground: ['#6a5440', '#5a4634'], deco: 'memory' },
  memory_deep: { sky: ['#06040c', '#100a1a', '#1a1028', '#241634'], far: '#120c1c', near: '#1e1630', ground: ['#1a1428', '#120e1e'], deco: 'memory_deep' },
};
export const HOSHIYOMI_DECOS = new Set(['hoshiyomi', 'memory', 'memory_deep']);

// 0〜1 の まいかい おなじ ちらばり（背景は 1回だけ かく）
const rnd = (i, s = 1) => {
  const v = Math.sin(i * 127.1 * s + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const disc = (x, cx, cy, r, c) => { x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); };
const star4 = (x, cx, cy, r, c) => {
  x.fillStyle = c;
  x.fillRect(Math.round(cx) - r, Math.round(cy), r * 2 + 1, 1);
  x.fillRect(Math.round(cx), Math.round(cy) - r, 1, r * 2 + 1);
};

// ───── 星読みの里の まわり ─────
function drawHoshiyomi(x, hor) {
  // 天の川（ななめの 光の おび）
  for (let i = 0; i < 260; i++) {
    const t = rnd(i, 1.7);
    const cx = t * BW, cy = 8 + t * 46 + (rnd(i, 2.3) - 0.5) * 22;
    x.fillStyle = `rgba(200,210,255,${(0.08 + rnd(i, 3.1) * 0.18).toFixed(3)})`;
    x.fillRect(Math.round(cx), Math.round(cy), 1 + Math.round(rnd(i, 4.2)), 1);
  }
  // 星
  for (let i = 0; i < 90; i++) {
    const px = Math.round(rnd(i, 5.5) * BW), py = Math.round(rnd(i, 6.6) * (hor - 20));
    x.fillStyle = ['#ffffff', '#fff0b0', '#b8d0ff'][i % 3];
    x.fillRect(px, py, 1, 1);
  }
  for (const [cx, cy] of [[30, 18], [96, 10], [168, 30], [236, 14], [70, 44], [206, 50]]) star4(x, cx, cy, 2, '#fff8d0');
  // 三日月
  disc(x, 216, 22, 10, '#fff4c0');
  disc(x, 221, 19, 9, '#0e1436');
  // 遠くの うかぶ 小島（かげ）
  for (const [cx, cy, w] of [[40, hor - 34, 26], [140, hor - 44, 16]]) {
    x.fillStyle = '#10163a';
    x.beginPath(); x.moveTo(cx - w / 2, cy); x.lineTo(cx + w / 2, cy); x.lineTo(cx + 2, cy + w * 0.6); x.closePath(); x.fill();
    x.fillStyle = '#1e2a5a';
    x.fillRect(Math.round(cx - w / 2), Math.round(cy - 1), Math.round(w), 2);
  }
  // 里の 星見の 塔（まるい やねの 小さな たてもの）と 家の あかり
  x.fillStyle = '#0c1230';
  x.fillRect(176, hor - 34, 14, 34);
  disc(x, 183, hor - 34, 9, '#0c1230');
  x.fillStyle = '#ffd870';
  x.fillRect(181, hor - 26, 3, 3);
  x.fillRect(178, hor - 38, 9, 1);
  for (const [hx, hw, hh] of [[150, 20, 14], [196, 18, 12], [222, 22, 16]]) {
    x.fillStyle = '#0c1230';
    x.fillRect(hx, hor - hh, hw, hh);
    x.beginPath(); x.moveTo(hx - 2, hor - hh); x.lineTo(hx + hw / 2, hor - hh - 8); x.lineTo(hx + hw + 2, hor - hh); x.closePath(); x.fill();
    x.fillStyle = '#ffcf60';
    x.fillRect(hx + Math.round(hw / 2) - 1, hor - hh + 4, 3, 3);
  }
  // 流れ星
  x.fillStyle = 'rgba(255,255,255,0.8)';
  for (let k = 0; k < 14; k++) x.fillRect(60 + k * 2, 26 + k, 2, 1);
  x.fillStyle = '#ffffff';
  x.fillRect(88, 40, 2, 2);
}

// ───── 思い出の迷宮 ─────
// 思い出の かけら（まどの わくの 形）。cx, cy … まんなか、w・h … 大きさ、c … ふち、glass … 中の 色
function frame(x, cx, cy, w, h, c, glass) {
  x.fillStyle = c;
  x.fillRect(Math.round(cx - w / 2), Math.round(cy - h / 2), Math.round(w), Math.round(h));
  x.fillStyle = glass;
  x.fillRect(Math.round(cx - w / 2) + 2, Math.round(cy - h / 2) + 2, Math.round(w) - 4, Math.round(h) - 4);
  x.fillStyle = c;
  x.fillRect(Math.round(cx) - 1, Math.round(cy - h / 2), 2, Math.round(h));
  x.fillRect(Math.round(cx - w / 2), Math.round(cy) - 1, Math.round(w), 2);
}
function drawMemory(x, hor, deep) {
  // もやの もよう
  for (let i = 0; i < 40; i++) {
    const px = rnd(i, 2.1) * BW, py = rnd(i, 3.4) * hor;
    disc(x, px, py, 6 + rnd(i, 4.7) * 14, deep ? 'rgba(80,40,120,0.07)' : 'rgba(255,230,255,0.06)');
  }
  // うかぶ 思い出の かけら（まどの わく。中に 星空や 夕やけ）
  const frames = deep
    ? [[36, 40, 22, 18, -0.2], [104, 24, 16, 20, 0.15], [176, 46, 24, 16, -0.1], [228, 22, 14, 18, 0.25], [66, 70, 12, 10, 0.3]]
    : [[40, 36, 24, 20, 0], [112, 22, 18, 22, 0], [184, 40, 26, 18, 0], [232, 20, 16, 20, 0]];
  frames.forEach(([cx, cy, w, h, rot], i) => {
    x.save();
    x.translate(cx, cy);
    x.rotate(rot);
    const glass = deep ? ['#2a1a4a', '#3a1a2e', '#1a2244'][i % 3] : ['#ffcf90', '#9ab8f0', '#f0a8c0'][i % 3];
    frame(x, 0, 0, w, h, deep ? '#4a3a62' : '#8a6a4a', glass);
    if (!deep) {
      // 中の 小さな 思い出（星・家の かげ）
      x.fillStyle = 'rgba(40,30,60,0.55)';
      x.fillRect(-w / 2 + 3, h / 2 - 7, w - 6, 4);
      x.fillStyle = '#ffffff';
      x.fillRect(-3, -h / 2 + 4, 1, 1);
      x.fillRect(4, -h / 2 + 6, 1, 1);
    } else if (i % 2) {
      // われめ
      x.fillStyle = '#0a0612';
      for (let k = 0; k < 8; k++) x.fillRect(-w / 2 + 3 + k * 2, -h / 2 + 3 + Math.round(Math.sin(k) * 2) + k, 2, 1);
    }
    x.restore();
  });
  // ランプの 光（あたたかい わ）と 長い 影
  const lx = deep ? 128 : 76, ly = hor - 6;
  for (let r = deep ? 46 : 60; r > 0; r -= 4) disc(x, lx, ly - 18, r, deep ? `rgba(180,140,255,${(0.012 + (60 - r) * 0.0012).toFixed(3)})` : `rgba(255,210,140,${(0.02 + (60 - r) * 0.0016).toFixed(3)})`);
  x.fillStyle = deep ? '#5a4a7a' : '#6a4a2a';
  x.fillRect(lx - 1, ly - 30, 2, 24);
  x.fillStyle = deep ? '#c8b0ff' : '#ffd870';
  x.fillRect(lx - 3, ly - 34, 6, 6);
  x.fillStyle = '#ffffff';
  x.fillRect(lx - 1, ly - 32, 2, 2);
  if (deep) {
    // 大きな 影（ひざを かかえた 子の かげ）
    x.fillStyle = 'rgba(4,2,8,0.75)';
    x.beginPath();
    x.ellipse(206, hor - 22, 22, 24, 0, 0, Math.PI * 2);
    x.fill();
    disc(x, 206, hor - 52, 11, 'rgba(4,2,8,0.75)');
    // 落ちて いく 光の つぶ
    for (let i = 0; i < 24; i++) {
      x.fillStyle = `rgba(200,170,255,${(0.2 + rnd(i, 8.1) * 0.5).toFixed(2)})`;
      x.fillRect(Math.round(rnd(i, 7.3) * BW), Math.round(rnd(i, 9.7) * hor), 1, 2);
    }
  }
  x.fillStyle = 'rgba(0,0,0,0.25)';
  x.fillRect(0, hor - 3, BW, 3);
}

export function drawHoshiyomiBg(x, d, hor) {
  if (d.deco === 'hoshiyomi') drawHoshiyomi(x, hor);
  else drawMemory(x, hor, d.deco === 'memory_deep');
}

// ゆか: 夜の 草地（青い 草・光る 星の 砂）／ 古い 木の ゆか（光の わと 影）／ 黒い 水の ような ゆか（光の わが うつる）
export function drawHoshiyomiFloorBg(x, d, hor) {
  if (d.deco === 'hoshiyomi') {
    for (let i = 0; i < 70; i++) {
      const px = Math.round(rnd(i, 3.3) * BW), py = hor + 5 + Math.round(rnd(i, 4.4) * (BH - hor - 8));
      x.fillStyle = i % 3 ? '#2a5a6a' : '#4a8a9a';
      x.fillRect(px, py, 1, 2);
    }
    // 光る 星の 砂
    for (let i = 0; i < 26; i++) {
      const px = Math.round(rnd(i, 6.1) * BW), py = hor + 6 + Math.round(rnd(i, 7.2) * (BH - hor - 10));
      x.fillStyle = ['#fff4b0', '#b8d8ff', '#ffffff'][i % 3];
      x.fillRect(px, py, 1, 1);
    }
    return;
  }
  const deep = d.deco === 'memory_deep';
  if (!deep) {
    // 木の ゆかの いたの すじ（遠近）
    x.fillStyle = 'rgba(30,18,10,0.35)';
    for (let i = 0; i < 6; i++) {
      const y = hor + 4 + i * i * 2;
      if (y < BH) x.fillRect(0, y, BW, 1);
    }
    for (let j = -8; j <= 8; j++) {
      for (let y = hor + 4; y < BH; y += 2) x.fillRect(Math.round(BW / 2 + j * 16 * (1 + (y - hor) / 40)), y, 1, 2);
    }
    // ランプの 光の わ
    x.fillStyle = 'rgba(255,214,140,0.16)';
    x.beginPath(); x.ellipse(76, hor + 18, 70, 14, 0, 0, Math.PI * 2); x.fill();
    // 長い 影
    x.fillStyle = 'rgba(20,10,30,0.3)';
    x.beginPath(); x.moveTo(150, hor + 10); x.lineTo(256, hor + 4); x.lineTo(256, hor + 30); x.lineTo(150, hor + 22); x.closePath(); x.fill();
    return;
  }
  // 黒い 水の ような ゆか: 光の わの うつりこみ・なみの すじ
  for (let i = 0; i < 8; i++) {
    const y = hor + 4 + i * i * 2;
    if (y >= BH) break;
    x.fillStyle = `rgba(120,90,200,${(0.06 + i * 0.01).toFixed(3)})`;
    for (let px = (i * 37) % 30; px < BW; px += 30) x.fillRect(px, y, 14, 1);
  }
  x.strokeStyle = 'rgba(200,170,255,0.35)';
  x.lineWidth = 1;
  for (const r of [18, 34, 52]) {
    x.beginPath(); x.ellipse(128, hor + 26, r * 2, r * 0.4, 0, 0, Math.PI * 2); x.stroke();
  }
  x.fillStyle = mix('#c8b0ff', '#120e1e', 0.5);
  x.fillRect(126, hor + 6, 4, 16);
}
