// 第2部 第8章 第2幕「よみの 青い火」の 戦いの 背景（battlefx.js の battleBackground から よぶ。BW×BH の まま かく。hor … 地面の たかさ）
// ・yomi_temple（deco 'yomi_temple'）… よみの 海底神殿 1〜4階: 深い 海の 青・上から さしこむ 光の すじ・しずんだ 神殿の 柱と 三角屋根・
//   青い 火の かがり火 2つ・ゆれる 海草・のぼる あわ。ゆかは 砂の かかった 古い 石だたみ
// ・yomi_deep（deco 'yomi_deep'）… 海底神殿 5〜8階: もっと 深く くらい みどりがかった 青・くずれた 柱・ただよう 青い たましいの 火・
//   ゆかに 魚の ホネと 貝がら
// ・yomi_throne（deco 'yomi_throne'）… よみの王の 間（ハデロス）: くらい むらさきの 大広間・おくに ドクロの 大きな 玉座・左右に 青い 炎の 大がま・
//   ゆかの ふちを ながれる よみの 川（青みどりの うず）
const BW = 256, BH = 144;

export const C8B_BG = {
  yomi_temple: { sky: ['#041428', '#0a2848', '#14406a', '#1e5a86'], far: '#2a5a7a', near: '#4a7a90', ground: ['#8a9a98', '#7a8a88'], deco: 'yomi_temple' },
  yomi_deep: { sky: ['#020a14', '#061a28', '#0c2a38', '#123a46'], far: '#1a3a44', near: '#3a5a62', ground: ['#5a6e70', '#4c6062'], deco: 'yomi_deep' },
  yomi_throne: { sky: ['#06040e', '#100a1e', '#1a1230', '#241a40'], far: '#2a2240', near: '#3e3458', ground: ['#4a4260', '#3e3852'], deco: 'yomi_throne' },
};
export const C8B_DECOS = new Set(['yomi_temple', 'yomi_deep', 'yomi_throne']);

// 0〜1 の まいかい おなじ ちらばり（背景は 1回だけ かく）
const rnd = (i, s = 1) => {
  const v = Math.sin(i * 127.1 * s + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const disc = (x, cx, cy, r, c) => { x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); };

// 青い 火（cx … まんなか、by … ねもと、h … たかさ）
function blueFire(x, cx, by, h, cols = ['#2a6ad8', '#4ab8ff', '#bfefff']) {
  cols.forEach((c, i) => {
    const k = 1 - i * 0.3;
    x.fillStyle = c;
    x.beginPath();
    x.moveTo(cx - h * 0.35 * k, by);
    x.quadraticCurveTo(cx - h * 0.4 * k, by - h * 0.5 * k, cx, by - h * k);
    x.quadraticCurveTo(cx + h * 0.4 * k, by - h * 0.5 * k, cx + h * 0.35 * k, by);
    x.closePath();
    x.fill();
  });
}
// かがり火の 台（cx … まんなか、by … ゆか）
function brazier(x, cx, by, h, fireCols) {
  x.fillStyle = '#3a3a4a';
  x.fillRect(cx - 2, by - h, 4, h);
  x.fillStyle = '#5a5a6e';
  x.fillRect(cx - 7, by - h - 4, 14, 4);
  x.fillRect(cx - 5, by - 2, 10, 2);
  for (let r = 18; r > 0; r -= 4) {
    x.fillStyle = `rgba(74,184,255,${(0.05 + (18 - r) * 0.01).toFixed(3)})`;
    if (fireCols) x.fillStyle = `rgba(${fireCols.glow},${(0.05 + (18 - r) * 0.01).toFixed(3)})`;
    x.beginPath();
    x.arc(cx, by - h - 10, r, 0, Math.PI * 2);
    x.fill();
  }
  blueFire(x, cx, by - h - 3, 16, fireCols?.cols);
}
// しずんだ 神殿の 柱（cx … まんなか、top・bot … 上と 下、w … はば）
function column(x, cx, top, bot, w, light, dark, broken = 0) {
  x.fillStyle = dark;
  x.fillRect(cx - w / 2, top + broken, w, bot - top - broken);
  x.fillStyle = light;
  x.fillRect(cx - w / 2 + 1, top + broken, Math.max(1, w * 0.35), bot - top - broken);
  // みぞ
  x.fillStyle = 'rgba(0,0,0,0.18)';
  for (let k = cx - w / 2 + 3; k < cx + w / 2 - 1; k += 3) x.fillRect(k, top + broken + 3, 1, bot - top - broken - 6);
  if (!broken) {
    x.fillStyle = light;
    x.fillRect(cx - w / 2 - 2, top - 3, w + 4, 3);
  } else {
    // ぎざぎざの おれた 先
    x.fillStyle = dark;
    for (let k = 0; k < w; k += 2) x.fillRect(cx - w / 2 + k, top + broken - ((k * 7) % 5), 2, (k * 7) % 5);
  }
  x.fillStyle = dark;
  x.fillRect(cx - w / 2 - 2, bot - 2, w + 4, 2);
}
// 海草（cx … ねもと、h … たかさ）
function seaweed(x, cx, by, h, col, phase = 0) {
  x.fillStyle = col;
  for (let y = 0; y < h; y++) {
    const sx = Math.round(Math.sin(y / 5 + phase) * 2.2);
    x.fillRect(cx + sx, by - y, 2, 1);
    if (y % 6 === 3) x.fillRect(cx + sx + (y % 12 === 3 ? 2 : -2), by - y, 2, 1);
  }
}
// 光の すじ（上から）
function rays(x, hor, alpha) {
  for (const [cx, w] of [[50, 16], [120, 22], [196, 14]]) {
    for (let y = 0; y < hor + 10; y++) {
      const a = alpha * (1 - y / (hor + 10));
      x.fillStyle = `rgba(190,230,255,${a.toFixed(3)})`;
      x.fillRect(Math.round(cx - w / 2 + y * 0.35), y, w, 1);
    }
  }
}
// のぼる あわ
function bubbles(x, n, s) {
  for (let i = 0; i < n; i++) {
    const px = Math.round(rnd(i, s) * BW), py = Math.round(rnd(i, s + 1.3) * (BH - 20));
    const r = rnd(i, s + 2.1) < 0.3 ? 2 : 1;
    x.fillStyle = 'rgba(200,236,255,0.55)';
    x.fillRect(px, py, r, r);
    if (r > 1) {
      x.fillStyle = 'rgba(255,255,255,0.75)';
      x.fillRect(px, py, 1, 1);
    }
  }
}

// 海底神殿（上の 階）
function drawTemple(x, hor) {
  rays(x, hor, 0.08);
  // おくの 神殿（三角屋根と 柱）
  x.fillStyle = '#1c3a58';
  x.beginPath();
  x.moveTo(64, 26);
  x.lineTo(128, 6);
  x.lineTo(192, 26);
  x.closePath();
  x.fill();
  x.fillRect(62, 26, 132, 4);
  for (let k = 0; k < 6; k++) column(x, 72 + k * 22.4, 30, hor, 8, '#2e5878', '#1c3a58');
  // 手前の 大きな 柱（左右）
  column(x, 14, 4, hor + 6, 16, '#5a8aa0', '#34607a');
  column(x, 242, 18, hor + 6, 16, '#5a8aa0', '#34607a', 22);
  // かがり火（青い 火）
  brazier(x, 46, hor + 4, 22);
  brazier(x, 210, hor + 4, 22);
  // 海草
  for (const [cx, h, ph] of [[30, 26, 0], [36, 18, 1.4], [224, 22, 0.6], [232, 30, 2.1], [104, 12, 0.3], [160, 14, 1.1]]) seaweed(x, cx, hor + 2, h, '#2a7a5a', ph);
  bubbles(x, 34, 1.7);
  x.fillStyle = 'rgba(0,0,0,0.25)';
  x.fillRect(0, hor - 3, BW, 3);
}

// 海底神殿（下の 階）: もっと 深い。くずれた 柱・ただよう たましいの 火
function drawDeep(x, hor) {
  rays(x, hor, 0.035);
  for (const [cx, top, w, br] of [[24, 10, 12, 18], [70, 24, 10, 0], [150, 30, 10, 14], [200, 16, 12, 0], [240, 40, 10, 10]]) column(x, cx, top, hor, w, '#2e4c56', '#1a3038', br);
  // たおれた 柱
  x.fillStyle = '#1a3038';
  x.fillRect(96, hor - 7, 40, 7);
  x.fillStyle = '#2e4c56';
  x.fillRect(96, hor - 7, 40, 2);
  // ただよう 青い たましいの 火
  for (const [cx, cy, h] of [[44, 30, 9], [118, 18, 7], [176, 40, 8], [226, 24, 6], [90, 50, 6]]) {
    for (let r = 10; r > 0; r -= 3) disc(x, cx, cy - h * 0.4, r, `rgba(74,184,255,${(0.04 + (10 - r) * 0.01).toFixed(3)})`);
    blueFire(x, cx, cy, h);
    x.fillStyle = '#16224a';
    x.fillRect(cx - 2, cy - 3, 1, 1);
    x.fillRect(cx + 1, cy - 3, 1, 1);
  }
  for (const [cx, h, ph] of [[8, 20, 0.4], [60, 14, 1.2], [140, 10, 2], [214, 18, 0.9]]) seaweed(x, cx, hor + 2, h, '#1a5a48', ph);
  bubbles(x, 22, 3.3);
  x.fillStyle = 'rgba(0,0,0,0.35)';
  x.fillRect(0, hor - 3, BW, 3);
}

// よみの王の 間: おくに ドクロの 玉座・左右に 青い 炎の 大がま
function drawThrone(x, hor) {
  // おくの かべの アーチ
  x.fillStyle = '#1a1430';
  for (const cx of [40, 216]) {
    x.fillRect(cx - 22, 10, 44, hor - 10);
    disc(x, cx, 12, 22, '#1a1430');
  }
  x.fillStyle = '#100c20';
  for (const cx of [40, 216]) {
    x.fillRect(cx - 14, 18, 28, hor - 18);
    disc(x, cx, 20, 14, '#100c20');
  }
  // 玉座（高い せもたれ・ドクロ）
  x.fillStyle = '#2a2240';
  x.fillRect(104, 4, 48, hor - 4);
  x.beginPath();
  x.moveTo(104, 4);
  x.lineTo(116, -4);
  x.lineTo(128, 6);
  x.lineTo(140, -4);
  x.lineTo(152, 4);
  x.closePath();
  x.fill();
  x.fillStyle = '#3a3058';
  x.fillRect(110, 10, 36, hor - 18);
  x.fillStyle = '#2a2240';
  x.fillRect(98, hor - 22, 60, 22);
  x.fillStyle = '#4a4068';
  x.fillRect(98, hor - 22, 60, 2);
  // ドクロ
  disc(x, 128, 26, 9, '#c8c0a8');
  x.fillStyle = '#c8c0a8';
  x.fillRect(123, 31, 10, 6);
  x.fillStyle = '#1a1430';
  x.fillRect(123, 24, 3, 4);
  x.fillRect(130, 24, 3, 4);
  x.fillRect(127, 29, 2, 2);
  for (let k = 0; k < 4; k++) x.fillRect(124 + k * 2.5, 35, 1, 2);
  // 青い 炎の 大がま（左右）
  for (const cx of [70, 186]) {
    x.fillStyle = '#3a3a4a';
    x.fillRect(cx - 12, hor - 12, 24, 12);
    x.fillStyle = '#5a5a6e';
    x.fillRect(cx - 14, hor - 14, 28, 3);
    for (let r = 26; r > 0; r -= 4) disc(x, cx, hor - 26, r, `rgba(74,184,255,${(0.03 + (26 - r) * 0.008).toFixed(3)})`);
    blueFire(x, cx - 6, hor - 13, 18);
    blueFire(x, cx + 5, hor - 13, 16);
    blueFire(x, cx, hor - 13, 26);
  }
  // ふわふわ 浮かぶ 火の粉
  for (let i = 0; i < 24; i++) {
    x.fillStyle = i % 3 ? 'rgba(120,200,255,0.7)' : 'rgba(220,240,255,0.8)';
    x.fillRect(Math.round(rnd(i, 4.1) * BW), Math.round(rnd(i, 5.2) * (hor - 6)), 1, 1);
  }
  x.fillStyle = 'rgba(0,0,0,0.35)';
  x.fillRect(0, hor - 3, BW, 3);
}

export function drawC8bBg(x, d, hor) {
  if (d.deco === 'yomi_temple') drawTemple(x, hor);
  else if (d.deco === 'yomi_deep') drawDeep(x, hor);
  else drawThrone(x, hor);
}

// ゆか: 砂の かかった 石だたみ（海底神殿）／ ホネと 貝がら（深い 階）／ 黒い 石と よみの 川（王の 間）
export function drawC8bFloorBg(x, d, hor) {
  const throne = d.deco === 'yomi_throne';
  // 石だたみの めじ（遠近）
  for (let i = 0; i < 7; i++) {
    const y = hor + 3 + Math.round(i * i * 1.4);
    if (y >= BH) break;
    x.fillStyle = throne ? 'rgba(10,8,20,0.45)' : 'rgba(10,30,40,0.35)';
    x.fillRect(0, y, BW, 1);
    const n = 6 + i * 2;
    for (let j = 0; j <= n; j++) {
      const px = Math.round(BW / 2 + (j - n / 2) * (BW / n) * (1 + i * 0.06));
      x.fillRect(px, y - Math.round(i * 1.3) - 1, 1, Math.round(i * 1.3) + 1);
    }
  }
  if (throne) {
    // よみの 川（手前の ふち。青みどりの うず）
    for (let px = 0; px < BW; px++) {
      const y0 = BH - 9 + Math.round(Math.sin(px * 0.06) * 2);
      x.fillStyle = '#1a4a4a';
      x.fillRect(px, y0, 1, BH - y0);
      if ((px + Math.round(Math.sin(px * 0.2) * 4)) % 9 === 0) {
        x.fillStyle = '#5ac8b8';
        x.fillRect(px, y0 + 2 + (px % 3), 3, 1);
      }
    }
    x.fillStyle = 'rgba(120,220,200,0.35)';
    x.fillRect(0, BH - 10, BW, 1);
    return;
  }
  // 砂の すじ
  for (let i = 0; i < 40; i++) {
    const px = Math.round(rnd(i, 7.7) * BW), py = hor + 6 + Math.round(rnd(i, 8.8) * (BH - hor - 10));
    x.fillStyle = d.deco === 'yomi_deep' ? 'rgba(150,170,160,0.35)' : 'rgba(220,210,170,0.4)';
    x.fillRect(px, py, 3, 1);
  }
  // 貝がら・ホネ（深い 階）／ 小さな 貝（上の 階）
  for (let i = 0; i < (d.deco === 'yomi_deep' ? 9 : 5); i++) {
    const px = Math.round(rnd(i, 9.3) * BW), py = hor + 10 + Math.round(rnd(i, 10.1) * (BH - hor - 16));
    if (d.deco === 'yomi_deep' && i % 2) {
      x.fillStyle = '#d8d2c0';
      x.fillRect(px, py, 6, 1);
      for (let k = 1; k < 6; k += 2) x.fillRect(px + k, py - 1, 1, 3);
    } else {
      x.fillStyle = '#e8c8b8';
      x.fillRect(px, py, 3, 2);
      x.fillStyle = '#ffffff';
      x.fillRect(px, py, 1, 1);
    }
  }
}
