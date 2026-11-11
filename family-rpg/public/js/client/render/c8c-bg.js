// 第2部 第8章 第3幕「くろがねの 空中ようさい」の 戦いの 背景（battlefx.js の battleBackground から よぶ。BW×BH の まま かく。hor … 地面の たかさ）
// ・fort_deck（deco 'fort_deck'）… ようさい 1〜4階・マジカメック: 夕やけの 空・雲の 海・左右に 回る 大きな プロペラ・鉄の マストと 旗・
//   ゆかは 黒い 鉄の 甲板（びょうが ならぶ）
// ・fort_engine（deco 'fort_engine'）… ようさい 5〜8階: くらい 鉄の 部屋・おくに 大きな 歯車・オレンジに 光る かまど・パイプと けむり
// ・fort_bridge（deco 'fort_bridge'）… クッパード（ようさいの 大橋）: くらい 赤い 空・ずっと 下に マグマ・おくに 大魔王の ようさいの かげ・
//   ゆかは くさりで つられた 鉄の 大橋。右の はしに 橋のオノ（しかけの え とは べつ。けしき）
const BW = 256, BH = 144;

export const C8C_BG = {
  fort_deck: { sky: ['#3a2a5a', '#6a3a6a', '#c86a5a', '#f0a868'], far: '#a86a7a', near: '#7a4a6a', ground: ['#4a4a58', '#3e3e4a'], deco: 'fort_deck' },
  fort_engine: { sky: ['#0e0a10', '#1a1218', '#2a1a1a', '#3a2418'], far: '#3a2a24', near: '#4a3428', ground: ['#3a3438', '#2e2a2e'], deco: 'fort_engine' },
  fort_bridge: { sky: ['#12060a', '#2a0a10', '#5a1414', '#8a2a14'], far: '#3a1010', near: '#5a1a14', ground: ['#4a4450', '#3a3640'], deco: 'fort_bridge' },
};
export const C8C_DECOS = new Set(['fort_deck', 'fort_engine', 'fort_bridge']);

// 0〜1 の まいかい おなじ ちらばり（背景は 1回だけ かく）
const rnd = (i, s = 1) => {
  const v = Math.sin(i * 127.1 * s + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const disc = (x, cx, cy, r, c) => { x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); };

// 雲（まるい かたまり）
function cloud(x, cx, cy, w, col) {
  x.fillStyle = col;
  for (let i = 0; i < 5; i++) disc(x, cx + (i - 2) * w * 0.18, cy - (i % 2) * w * 0.06, w * (0.14 + (i % 3) * 0.03), col);
  x.fillRect(cx - w * 0.4, cy, w * 0.8, w * 0.08);
}
// 大きな プロペラ（cx・cy … まんなか、r … 長さ）
function propeller(x, cx, cy, r) {
  x.fillStyle = '#2a2a34';
  x.fillRect(cx - 2, cy, 4, 40);
  for (const a of [0.3, 0.3 + Math.PI * 2 / 3, 0.3 + Math.PI * 4 / 3]) {
    x.fillStyle = '#5a5a68';
    x.beginPath();
    x.moveTo(cx, cy);
    x.lineTo(cx + Math.cos(a - 0.18) * r, cy + Math.sin(a - 0.18) * r * 0.5);
    x.lineTo(cx + Math.cos(a + 0.18) * r, cy + Math.sin(a + 0.18) * r * 0.5);
    x.closePath();
    x.fill();
  }
  // ぶれ（回っている）
  x.strokeStyle = 'rgba(220,220,240,0.25)';
  x.lineWidth = 1;
  x.beginPath();
  x.ellipse(cx, cy, r, r * 0.5, 0, 0, Math.PI * 2);
  x.stroke();
  disc(x, cx, cy, 4, '#c8a040');
}
// 歯車（cx・cy … まんなか、r … 大きさ）
function gear(x, cx, cy, r, col, hole) {
  x.fillStyle = col;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    x.save();
    x.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    x.rotate(a);
    x.fillRect(-r * 0.12, -r * 0.1, r * 0.24, r * 0.2);
    x.restore();
  }
  disc(x, cx, cy, r, col);
  disc(x, cx, cy, r * 0.45, hole);
  disc(x, cx, cy, r * 0.18, col);
}
// びょう（鉄の 板の ならび）
function rivets(x, y, step, col) {
  x.fillStyle = col;
  for (let k = 4; k < BW; k += step) x.fillRect(k, y, 2, 2);
}

// ようさいの 甲板（上の 階・マジカメック）
function drawDeck(x, hor) {
  // 夕やけの 雲の 海
  for (const [cx, cy, w] of [[30, 54, 70], [120, 62, 90], [210, 50, 80], [250, 66, 60]]) cloud(x, cx, cy, w, 'rgba(250,210,200,0.55)');
  for (const [cx, cy, w] of [[70, 24, 44], [180, 18, 50]]) cloud(x, cx, cy, w, 'rgba(255,230,220,0.35)');
  // 鉄の マストと 旗（まん中の おく）
  x.fillStyle = '#2a2a34';
  x.fillRect(126, 6, 4, hor - 6);
  x.fillStyle = '#3a3a48';
  x.fillRect(110, 18, 36, 3);
  x.fillStyle = '#8a1a2a';
  x.beginPath();
  x.moveTo(130, 6);
  x.lineTo(156, 11);
  x.lineTo(130, 17);
  x.closePath();
  x.fill();
  x.fillStyle = '#f4f0e0';
  disc(x, 140, 11, 2.4, '#f4f0e0');
  // 左右の プロペラ
  propeller(x, 26, 22, 26);
  propeller(x, 230, 26, 24);
  // てすり（鉄の 柵）
  x.fillStyle = '#2a2a34';
  x.fillRect(0, hor - 14, BW, 2);
  for (let k = 2; k < BW; k += 10) x.fillRect(k, hor - 14, 2, 14);
  x.fillStyle = 'rgba(0,0,0,0.3)';
  x.fillRect(0, hor - 3, BW, 3);
}

// ようさいの 中の 歯車の 部屋（下の 階）
function drawEngine(x, hor) {
  // 鉄の かべの 板
  x.fillStyle = 'rgba(0,0,0,0.25)';
  for (let k = 0; k < BW; k += 32) x.fillRect(k, 0, 1, hor);
  for (const y of [18, 44]) {
    x.fillRect(0, y, BW, 1);
    rivets(x, y + 2, 16, 'rgba(160,140,120,0.5)');
  }
  // 大きな 歯車（おく）
  gear(x, 60, 30, 26, '#4a3a30', '#1a1214');
  gear(x, 100, 52, 16, '#5a4636', '#1a1214');
  gear(x, 206, 34, 22, '#4a3a30', '#1a1214');
  // パイプ
  x.fillStyle = '#5a4a3e';
  x.fillRect(140, 0, 8, hor);
  x.fillRect(140, 30, 50, 6);
  x.fillStyle = '#7a6450';
  x.fillRect(141, 0, 2, hor);
  // オレンジに 光る かまど（まん中の 下）
  for (let r = 30; r > 0; r -= 5) disc(x, 128, hor - 6, r, `rgba(255,140,40,${(0.03 + (30 - r) * 0.007).toFixed(3)})`);
  x.fillStyle = '#2a2024';
  x.fillRect(108, hor - 22, 40, 22);
  x.fillStyle = '#ff8a2a';
  x.fillRect(114, hor - 14, 28, 10);
  x.fillStyle = '#ffe06a';
  x.fillRect(118, hor - 10, 20, 5);
  // けむり
  for (let i = 0; i < 14; i++) {
    x.fillStyle = 'rgba(120,110,110,0.18)';
    disc(x, 152 + rnd(i, 2.3) * 40, 4 + rnd(i, 3.1) * 30, 3 + rnd(i, 4.7) * 5, 'rgba(120,110,110,0.18)');
  }
  x.fillStyle = 'rgba(0,0,0,0.35)';
  x.fillRect(0, hor - 3, BW, 3);
}

// ようさいの 大橋（クッパード）: マグマの 上・おくに 大魔王の ようさい
function drawBridge(x, hor) {
  // おくの ようさいの かげ（とうと とげ）
  x.fillStyle = '#1e0a0e';
  for (const [cx, w, h] of [[40, 30, 46], [80, 20, 30], [176, 24, 36], [218, 34, 52]]) {
    x.fillRect(cx - w / 2, hor - h, w, h);
    x.beginPath();
    x.moveTo(cx - w / 2 - 2, hor - h);
    x.lineTo(cx, hor - h - 14);
    x.lineTo(cx + w / 2 + 2, hor - h);
    x.closePath();
    x.fill();
  }
  // まどの 明かり
  x.fillStyle = '#ff8a2a';
  for (const [px, py] of [[36, 50], [44, 60], [214, 44], [222, 56], [174, 58]]) x.fillRect(px, py, 2, 3);
  // マグマの 光（下から）
  for (let y = hor - 20; y < hor; y++) {
    x.fillStyle = `rgba(255,90,20,${((y - hor + 20) * 0.012).toFixed(3)})`;
    x.fillRect(0, y, BW, 1);
  }
  // 火の粉
  for (let i = 0; i < 26; i++) {
    x.fillStyle = i % 3 ? 'rgba(255,170,80,0.8)' : 'rgba(255,230,140,0.9)';
    x.fillRect(Math.round(rnd(i, 6.1) * BW), Math.round(rnd(i, 7.3) * (hor - 4)), 1, 1);
  }
  // 橋を つる くさり（左右の 柱から）
  x.fillStyle = '#3a3640';
  x.fillRect(6, 10, 6, hor - 10);
  x.fillRect(244, 10, 6, hor - 10);
  x.strokeStyle = '#5a5664';
  x.lineWidth = 1;
  for (const [x0, x1] of [[9, 60], [247, 196]]) {
    x.beginPath();
    x.moveTo(x0, 14);
    x.quadraticCurveTo((x0 + x1) / 2, hor - 30, x1, hor - 4);
    x.stroke();
  }
  // 右の はしの 橋のオノ（けしき）
  x.fillStyle = '#5a3a1a';
  x.fillRect(236, hor - 30, 4, 30);
  x.fillStyle = '#c8ccd8';
  x.beginPath();
  x.moveTo(238, hor - 34);
  x.lineTo(252, hor - 38);
  x.lineTo(252, hor - 24);
  x.lineTo(238, hor - 26);
  x.closePath();
  x.fill();
  x.fillStyle = 'rgba(0,0,0,0.35)';
  x.fillRect(0, hor - 3, BW, 3);
}

export function drawC8cBg(x, d, hor) {
  if (d.deco === 'fort_deck') drawDeck(x, hor);
  else if (d.deco === 'fort_engine') drawEngine(x, hor);
  else drawBridge(x, hor);
}

// ゆか: 鉄の 甲板（びょう）／ 鉄の 板と 油の しみ（歯車の 部屋）／ 鉄の 大橋と 下の マグマ（大橋）
export function drawC8cFloorBg(x, d, hor) {
  const bridge = d.deco === 'fort_bridge';
  // 鉄の 板の めじ（遠近）
  for (let i = 0; i < 7; i++) {
    const y = hor + 3 + Math.round(i * i * 1.4);
    if (y >= BH) break;
    x.fillStyle = 'rgba(10,10,16,0.4)';
    x.fillRect(0, y, BW, 1);
    rivets(x, y + 1, 12 + i * 4, 'rgba(180,180,200,0.35)');
  }
  if (bridge) {
    // 手前の ふちの 下に マグマ
    for (let px = 0; px < BW; px++) {
      const y0 = BH - 8 + Math.round(Math.sin(px * 0.07) * 2);
      x.fillStyle = '#c83a10';
      x.fillRect(px, y0, 1, BH - y0);
      if ((px + Math.round(Math.sin(px * 0.2) * 4)) % 11 === 0) {
        x.fillStyle = '#ffd040';
        x.fillRect(px, y0 + 2 + (px % 3), 3, 1);
      }
    }
    x.fillStyle = 'rgba(255,160,80,0.4)';
    x.fillRect(0, BH - 9, BW, 1);
    return;
  }
  // 油の しみ（歯車の 部屋）・ボルト（甲板）
  for (let i = 0; i < (d.deco === 'fort_engine' ? 8 : 5); i++) {
    const px = Math.round(rnd(i, 9.3) * BW), py = hor + 10 + Math.round(rnd(i, 10.1) * (BH - hor - 16));
    if (d.deco === 'fort_engine') {
      x.fillStyle = 'rgba(10,8,10,0.35)';
      x.fillRect(px, py, 8, 2);
    } else {
      x.fillStyle = '#8a8a9a';
      x.fillRect(px, py, 3, 2);
      x.fillStyle = '#c8c8d8';
      x.fillRect(px, py, 1, 1);
    }
  }
}
