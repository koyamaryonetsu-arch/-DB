// 第5章 Step 3・4「クモイ地方」と「しずみゆく島の古い神殿」の 戦いの 背景（ch5-tower-bg.js の drawTowerBg から よぶ。BW×BH の まま かく。hor … 地面の たかさ）
// ・kumoi（deco 'kumoi'）… 雲の上の 島: 青い 空・もくもくの 雲・遠くに うかぶ 島（たきが 雲へ おちる）・お日さまの 光。
//   ゆかは 島の 草地。はしの 向こうは 雲の 海
// ・sink_ruin（deco 'sruin'）… しずみゆく島の 古い神殿（1〜3階）: 土色の 石の かべ・古い もようの 柱・こけと 根・かべの われめから さす 光。
//   ゆかは 少し かたむいた 石だたみ（島が かたむいている）
// ・sink_ruin_deep（deco 'sruin_deep'）… 神殿の 下の 階・雲が 入った 所・ガイアイーターの 広間: くらい 石の かべ・太い 根・
//   われめから 雲の きりが ながれこむ。ゆかは われた 石と 白い きり
import { mix } from './pixel.js?v=2551bc2b5aab';

const BW = 256, BH = 144;

export const KUMOI_BG = {
  kumoi: { sky: ['#3a8ae8', '#6aaef0', '#a8d4f8', '#e0f0ff'], far: '#e8f2ff', near: '#5aa84a', ground: ['#7ac860', '#68b450'], deco: 'kumoi' },
  sink_ruin: { sky: ['#1a120a', '#2a1e12', '#3a2a1a'], far: '#5a4630', near: '#8a7458', ground: ['#a08a68', '#8e785a'], deco: 'sruin' },
  sink_ruin_deep: { sky: ['#0e0a10', '#1a141c', '#262028'], far: '#3e3440', near: '#6a6070', ground: ['#7a7282', '#6a6474'], deco: 'sruin_deep' },
};
export const KUMOI_DECOS = new Set(['kumoi', 'sruin', 'sruin_deep']);

// 0〜1 の まいかい おなじ ちらばり（背景は 1回だけ かく）
const rnd = (i, s = 1) => {
  const v = Math.sin(i * 127.1 * s + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const disc = (x, cx, cy, r, c) => { x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); };

// もくもくの 雲（cx, cy … まんなかの 下、w … はば）
function cumulus(x, cx, cy, w, shade = '#c8d4f0', body = '#f4f8ff', hi = '#ffffff') {
  const parts = [[-0.36, 0, 0.22], [-0.14, -0.14, 0.28], [0.12, -0.18, 0.3], [0.34, -0.04, 0.22], [0, 0.02, 0.3]];
  for (const [dx, dy, r] of parts) disc(x, cx + dx * w, cy + dy * w + 2, r * w, shade);
  for (const [dx, dy, r] of parts) disc(x, cx + dx * w - 1, cy + dy * w, r * w * 0.92, body);
  for (const [dx, dy, r] of parts.slice(1, 3)) disc(x, cx + dx * w - r * w * 0.3, cy + dy * w - r * w * 0.3, r * w * 0.4, hi);
  x.fillStyle = shade;
  x.fillRect(Math.round(cx - w * 0.5), Math.round(cy + w * 0.12), Math.round(w), 2);
}

// うかぶ 島（cx, cy … 上の まんなか、w … はば）
function floatIsland(x, cx, cy, w, fall = false) {
  // 下の 岩（さかさまの 山）
  x.fillStyle = '#7a6a8a';
  x.beginPath(); x.moveTo(cx - w / 2, cy); x.lineTo(cx + w / 2, cy); x.lineTo(cx + w * 0.12, cy + w * 0.7); x.lineTo(cx - w * 0.08, cy + w * 0.55); x.closePath(); x.fill();
  x.fillStyle = '#a898b0';
  x.beginPath(); x.moveTo(cx - w / 2, cy); x.lineTo(cx - w * 0.1, cy); x.lineTo(cx - w * 0.08, cy + w * 0.55); x.closePath(); x.fill();
  // 草の 上
  x.fillStyle = '#5aa84a';
  x.fillRect(Math.round(cx - w / 2), Math.round(cy - 2), Math.round(w), 3);
  x.fillStyle = '#8ad870';
  x.fillRect(Math.round(cx - w / 2), Math.round(cy - 2), Math.round(w), 1);
  // 木
  for (const d of [-0.25, 0.15]) {
    x.fillStyle = '#6a4a2a'; x.fillRect(Math.round(cx + d * w), Math.round(cy - 5), 1, 4);
    disc(x, cx + d * w + 0.5, cy - 6, Math.max(1.5, w * 0.08), '#3a8a3a');
  }
  // たき（雲へ おちる）
  if (fall) {
    for (let y = cy + 1; y < cy + w * 0.9; y++) {
      x.fillStyle = `rgba(230,244,255,${(0.8 - (y - cy) / (w * 1.2)).toFixed(2)})`;
      x.fillRect(Math.round(cx + w * 0.3), y, 2, 1);
    }
  }
}

// ───── 雲の上の 島 ─────
function drawKumoi(x, hor) {
  // お日さまの 光（右上）
  for (let r = 40; r > 0; r -= 4) {
    x.fillStyle = `rgba(255,250,220,${(0.06 + (40 - r) * 0.004).toFixed(3)})`;
    disc(x, 214, 16, r, x.fillStyle);
  }
  disc(x, 214, 16, 7, '#fffbe8');
  // 遠くの 雲（下の ほうに ひろがる 雲の 海）
  for (let i = 0; i < 9; i++) cumulus(x, 10 + i * 30 + rnd(i) * 10, hor - 16 - rnd(i, 2) * 6, 26 + rnd(i, 3) * 10, '#b8c8ec', '#e8f0ff', '#ffffff');
  // うかぶ 島
  floatIsland(x, 52, 30, 30, true);
  floatIsland(x, 150, 20, 18);
  floatIsland(x, 196, 44, 24, true);
  // 近くの 大きな 雲
  cumulus(x, 22, 26, 26);
  cumulus(x, 110, 40, 30);
  cumulus(x, 244, 52, 22);
  // 鳥の かげ
  x.fillStyle = '#4a6a9a';
  for (const [bx, by] of [[90, 14], [98, 18], [128, 10]]) { x.fillRect(bx, by, 2, 1); x.fillRect(bx + 3, by, 2, 1); x.fillRect(bx + 2, by + 1, 1, 1); }
  // 地平線の 雲の 海（白い おび）
  for (let px = 0; px < BW; px++) {
    const h = 5 + Math.abs(Math.sin(px * 0.09)) * 3 + Math.abs(Math.sin(px * 0.23 + 2)) * 2;
    for (let k = 0; k < h; k++) {
      x.fillStyle = mix('#ffffff', '#c8d8f4', k / h);
      x.fillRect(px, hor - h + k, 1, 1);
    }
  }
}

// ───── 古い神殿（上の 階・下の 階）─────
function drawRuin(x, hor, deep) {
  const wall = deep ? ['#0e0a10', '#2a2430'] : ['#1a120a', '#4a3a28'];
  for (let y = 0; y < hor; y++) {
    const t = y / hor;
    x.fillStyle = mix(wall[0], wall[1], Math.min(1, t * t * 0.8 + t * 0.3));
    x.fillRect(0, y, BW, 1);
  }
  // 石の ブロック（島が かたむいて、めじが 少し ななめ）
  const tilt = deep ? 0.05 : 0.035;
  for (let r = 0; r < 12; r++) {
    const y0 = 2 + r * 7;
    if (y0 > hor) break;
    const t = Math.min(1, (y0 + 4) / hor);
    x.fillStyle = mix('#050304', deep ? '#1a1620' : '#2a1e12', t);
    for (let px = 0; px < BW; px += 1) x.fillRect(px, Math.round(y0 + px * tilt), 1, 1);
    for (let bx = (r % 2) * 11; bx < BW; bx += 22) x.fillRect(bx, Math.round(y0 + bx * tilt), 1, 7);
  }
  // 柱（古い もよう）
  for (const cx of [28, 92, 164, 228]) {
    const top = 6, c1 = deep ? '#4a4252' : '#7a6448', c2 = deep ? '#6a6274' : '#a08a68', c3 = deep ? '#2a2430' : '#4a3a28';
    x.fillStyle = c3; x.fillRect(cx - 9, top, 18, hor - top);
    x.fillStyle = c1; x.fillRect(cx - 8, top, 16, hor - top);
    x.fillStyle = c2; x.fillRect(cx - 8, top, 4, hor - top);
    // もよう（うずまきの ような 古い 線）
    x.fillStyle = c3;
    for (let y = top + 10; y < hor - 6; y += 16) {
      x.fillRect(cx - 4, y, 8, 1); x.fillRect(cx + 3, y, 1, 4); x.fillRect(cx - 2, y + 3, 6, 1); x.fillRect(cx - 2, y + 1, 1, 3);
    }
    // 頭の かざり
    x.fillStyle = c2; x.fillRect(cx - 11, top, 22, 3);
    x.fillStyle = c3; x.fillRect(cx - 11, top + 3, 22, 1);
    // ひび
    x.fillStyle = c3;
    for (let k = 0; k < 6; k++) x.fillRect(cx + 2 + (k % 2), top + 22 + k * 3, 1, 3);
  }
  // こけと 根
  for (let i = 0; i < 18; i++) {
    const px = Math.round(rnd(i, 1.7) * BW), py = Math.round(rnd(i, 2.3) * (hor - 10));
    x.fillStyle = deep ? '#3a4a3a' : '#5a7a3a';
    x.fillRect(px, py, 3 + (i % 3), 2);
    x.fillStyle = deep ? '#5a6a4a' : '#8aa860';
    x.fillRect(px + 1, py, 1 + (i % 2), 1);
  }
  const roots = deep ? 7 : 3;
  for (let i = 0; i < roots; i++) {
    let rx = 10 + rnd(i, 4.1) * (BW - 20);
    x.fillStyle = deep ? '#3a2a1e' : '#5a4028';
    for (let y = 0; y < hor * (0.4 + rnd(i, 5.3) * 0.5); y++) {
      rx += Math.sin(y * 0.2 + i) * 0.6;
      x.fillRect(Math.round(rx), y, deep ? 3 : 2, 1);
    }
  }
  // かべの われめ（上の 階は 光が さす・下の 階は 雲の きりが ながれこむ）
  for (const [cx, w] of [[60, 8], [196, 10]]) {
    x.fillStyle = deep ? '#c8d0e8' : '#ffe8b0';
    for (let y = 4; y < 30; y++) x.fillRect(Math.round(cx + Math.sin(y * 0.6) * 2), y, 2, 1);
    if (!deep) {
      for (let y = 30; y < hor + 12; y++) {
        const a = 0.12 * (1 - (y - 30) / (hor + 12 - 30));
        x.fillStyle = `rgba(255,236,180,${a.toFixed(3)})`;
        x.fillRect(Math.round(cx - w / 2 + (y - 30) * 0.3), y, w, 1);
      }
    }
  }
  if (deep) {
    // 雲の きり（よこに ながれる 白い おび）
    for (let b = 0; b < 4; b++) {
      const by = 20 + b * 16;
      for (let px = 0; px < BW; px++) {
        const a = Math.max(0, Math.sin(px * 0.03 + b * 1.7)) * (0.1 + b * 0.04);
        if (a <= 0.02) continue;
        x.fillStyle = `rgba(220,228,248,${a.toFixed(3)})`;
        x.fillRect(px, by + Math.round(Math.sin(px * 0.05 + b) * 3), 1, 5);
      }
    }
  }
  x.fillStyle = 'rgba(0,0,0,0.3)';
  x.fillRect(0, hor - 4, BW, 4);
}

export function drawKumoiBg(x, d, hor) {
  if (d.deco === 'kumoi') drawKumoi(x, hor);
  else drawRuin(x, hor, d.deco === 'sruin_deep');
}

// ゆか: 島の 草地（はなと 小石）／ かたむいた 石だたみ（われめ・小石）／ われた 石と きり
export function drawKumoiFloorBg(x, d, hor) {
  if (d.deco === 'kumoi') {
    // 草の すじと 花
    for (let i = 0; i < 70; i++) {
      const px = Math.round(rnd(i, 3.3) * BW), py = hor + 5 + Math.round(rnd(i, 4.4) * (BH - hor - 8));
      x.fillStyle = i % 3 ? '#4a9a3a' : '#9ae078';
      x.fillRect(px, py, 1, 2);
    }
    for (let i = 0; i < 16; i++) {
      const px = Math.round(rnd(i, 6.1) * BW), py = hor + 8 + Math.round(rnd(i, 7.2) * (BH - hor - 12));
      x.fillStyle = ['#ffffff', '#ffe060', '#ff9ab0'][i % 3];
      x.fillRect(px, py, 2, 1); x.fillRect(px, py - 1, 1, 1);
    }
    // 小石
    for (let i = 0; i < 6; i++) {
      const px = Math.round(rnd(i, 8.3) * BW), py = hor + 10 + Math.round(rnd(i, 9.1) * 40);
      x.fillStyle = '#a8a8b8'; x.fillRect(px, py, 3, 2);
      x.fillStyle = '#d0d0dc'; x.fillRect(px, py, 2, 1);
    }
    // 島の ふち（手前に 雲が ちらっと）
    x.fillStyle = 'rgba(255,255,255,0.55)';
    for (let k = 0; k < BW; k += 23) x.fillRect(k, BH - 3 - (k % 3), 12, 3);
    return;
  }
  const deep = d.deco === 'sruin_deep';
  const tilt = deep ? 0.06 : 0.045;
  // かたむいた 石だたみの めじ
  for (let i = 0; i < 7; i++) {
    const y = hor + 3 + Math.round(i * i * 1.4);
    if (y >= BH) break;
    x.fillStyle = deep ? 'rgba(20,16,26,0.45)' : 'rgba(40,28,16,0.4)';
    for (let px = 0; px < BW; px += 1) x.fillRect(px, Math.round(y + (px - BW / 2) * tilt), 1, 1);
    const n = 6 + i * 2;
    for (let j = 0; j <= n; j++) {
      const px = Math.round(BW / 2 + (j - n / 2) * (BW / n) * (1 + i * 0.06));
      x.fillRect(px, Math.round(y + (px - BW / 2) * tilt) - Math.round(i * 1.3) - 1, 1, Math.round(i * 1.3) + 1);
    }
  }
  // われめ
  x.fillStyle = deep ? '#1a1420' : '#3a2a18';
  for (const [cx, cy] of [[60, hor + 30], [180, hor + 40], [124, hor + 52]]) {
    let px = cx, py = cy;
    for (let k = 0; k < 14; k++) {
      x.fillRect(Math.round(px), Math.round(py), 2, 1);
      px += 2;
      py += Math.sin(k * 1.3 + cx) * 1.2;
    }
  }
  // 小石
  for (let i = 0; i < 12; i++) {
    const px = Math.round(rnd(i, 5.7) * BW), py = hor + 6 + Math.round(rnd(i, 6.9) * (BH - hor - 10));
    x.fillStyle = deep ? '#8a8494' : '#b8a284'; x.fillRect(px, py, 2, 1);
  }
  if (deep) {
    // ゆかを はう きり
    for (let px = 0; px < BW; px++) {
      const a = 0.18 + Math.max(0, Math.sin(px * 0.04)) * 0.2;
      x.fillStyle = `rgba(228,234,250,${a.toFixed(3)})`;
      x.fillRect(px, hor + 2 + Math.round(Math.sin(px * 0.07) * 2), 1, 6);
      x.fillRect(px, BH - 10 + Math.round(Math.sin(px * 0.05 + 1) * 2), 1, 8);
    }
  }
}
