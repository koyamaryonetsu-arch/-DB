// 第5章 Step 2「星の塔」の 戦いの 背景（battlefx.js の battleBackground から よぶ。BW×BH の まま かく。hor … 地面の たかさ）
// ・star_tower（deco 'stower'）… 石の 塔の 中: 青みがかった 石の かべ・おくへ 上がって いく らせん階段・
//   星空が 見える アーチの まど・星の ランプ。ゆかは 石だたみに 星の 紋
// ・star_tower_top（deco 'stop'）… 塔の てっぺん: 天の川の かかる 星空・ゆらめく「天のとばり」（光の まく）・
//   遠くの 雲の 海・両がわの くずれた 柱。ゆかは 星座の 円が きざまれた 石の 台
import { mix } from './pixel.js?v=4cd67bf27571';

const BW = 256, BH = 144;

export const TOWER_BG = {
  star_tower: { sky: ['#0a0e22', '#141a36', '#20284a'], far: '#2e3858', near: '#566082', ground: ['#6a7494', '#5c6686'], deco: 'stower' },
  star_tower_top: { sky: ['#04061a', '#0c1236', '#1a1e52', '#2e2a6a'], far: '#d8dcf0', near: '#7a7aa0', ground: ['#8a8cae', '#7a7ca0'], deco: 'stop' },
};
export const TOWER_DECOS = new Set(['stower', 'stop']);

// 0〜1 の まいかい おなじ ちらばり（背景は 1回だけ かく）
const rnd = (i, s = 1) => {
  const v = Math.sin(i * 127.1 * s + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

function star(x, px, py, r, c) {
  x.fillStyle = c;
  x.fillRect(px, py, 1, 1);
  if (r > 0) {
    x.fillRect(px - r, py, r, 1); x.fillRect(px + 1, py, r, 1);
    x.fillRect(px, py - r, 1, r); x.fillRect(px, py + 1, 1, r);
  }
}

// ───── 石の 塔の 中 ─────
function drawTowerHall(x, hor) {
  // 石の かべ（上ほど くらい）
  for (let y = 0; y < hor; y++) {
    const t = y / hor;
    x.fillStyle = mix('#0a0e20', '#3e4868', Math.min(1, t * t * 0.9 + t * 0.25));
    x.fillRect(0, y, BW, 1);
  }
  // 石の ブロックの めじ（まるい かべ なので まん中が ひろく、はしが せまい）
  for (let r = 0, y0 = 3; y0 < hor; r++, y0 += 9) {
    const t = Math.min(1, (y0 + 4) / hor);
    x.fillStyle = mix('#04060e', '#1e2438', t);
    x.fillRect(0, y0, BW, 1);
    let bx = (r % 2) * 9;
    while (bx < BW) {
      const d = Math.abs(bx - BW / 2) / (BW / 2);
      const wdt = Math.round(30 - d * 18);
      x.fillStyle = mix('#04060e', '#1e2438', t);
      x.fillRect(bx, y0, 1, 9);
      if (t > 0.25) {
        x.fillStyle = mix('#1a2034', '#6a7494', t * 0.9);
        x.fillRect(bx + 1, y0 + 1, Math.max(1, wdt - 2), 1);
      }
      bx += wdt;
    }
  }
  // おくの らせん階段（まん中で 右へ 左へ と 上がって いく）
  for (let i = 0; i < 26; i++) {
    const a = i * 0.55;
    const sx = Math.round(BW / 2 + Math.sin(a) * 52);
    const sy = Math.round(hor - 8 - i * 2.6);
    if (sy < 2) break;
    const front = Math.cos(a) > 0;
    x.fillStyle = front ? '#7a84a4' : '#3a4262';
    x.fillRect(sx - 7, sy, 14, 2);
    x.fillStyle = front ? '#a8b0cc' : '#4a5274';
    x.fillRect(sx - 7, sy, 14, 1);
    x.fillStyle = '#141a2e';
    x.fillRect(sx - 7, sy + 2, 14, 1);
  }
  // 階段の まん中の 柱
  x.fillStyle = '#1a2036'; x.fillRect(BW / 2 - 5, 0, 10, hor);
  x.fillStyle = '#3a4466'; x.fillRect(BW / 2 - 4, 0, 8, hor);
  x.fillStyle = '#5a6488'; x.fillRect(BW / 2 - 4, 0, 2, hor);
  // アーチの まど（星空が 見える）2つ
  for (const cx of [52, 204]) {
    const w = 26, top = 14, bot = 54;
    x.fillStyle = '#10142a';
    x.fillRect(cx - w / 2 - 3, top + 6, w + 6, bot - top - 4);
    x.beginPath(); x.arc(cx, top + 9, w / 2 + 3, Math.PI, 0); x.fill();
    // 中の 星空
    for (let y = top; y < bot; y++) {
      const t = (y - top) / (bot - top);
      x.fillStyle = mix('#06082a', '#2a2a6a', t);
      const half = y < top + 9 ? Math.round(Math.sqrt(Math.max(0, (w / 2) ** 2 - (top + 9 - y) ** 2))) : w / 2;
      x.fillRect(cx - half, y, half * 2, 1);
    }
    for (let i = 0; i < 9; i++) {
      const px = Math.round(cx - w / 2 + 2 + rnd(i + cx) * (w - 4)), py = Math.round(top + 4 + rnd(i * 3 + cx, 2) * (bot - top - 8));
      star(x, px, py, i % 4 === 0 ? 1 : 0, i % 3 ? '#ffffff' : '#ffe8a0');
    }
    // まどわく
    x.fillStyle = '#7a84a4';
    x.fillRect(cx - w / 2 - 3, bot - 2, w + 6, 3);
    x.fillStyle = '#a8b0cc';
    x.fillRect(cx - w / 2 - 3, bot - 2, w + 6, 1);
    x.fillStyle = '#2a3048';
    x.fillRect(cx - 1, top + 2, 2, bot - top - 3);
    // まどから さしこむ 星の 光
    for (let y = bot; y < hor + 14; y++) {
      const a = 0.08 * (1 - (y - bot) / (hor + 14 - bot));
      x.fillStyle = `rgba(190,200,255,${a.toFixed(3)})`;
      x.fillRect(Math.round(cx - w / 2 + (y - bot) * 0.25), y, w, 1);
    }
  }
  // 星の ランプ（かべの 金の 台に 青白い 星の 光）
  for (const cx of [16, 98, 158, 240]) {
    const cy = 46;
    x.fillStyle = 'rgba(160,190,255,0.16)';
    x.beginPath(); x.arc(cx, cy, 14, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(200,220,255,0.28)';
    x.beginPath(); x.arc(cx, cy, 7, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#a07a2a'; x.fillRect(cx - 4, cy + 4, 8, 2); x.fillRect(cx - 1, cy + 6, 2, 5);
    x.fillStyle = '#e8c060'; x.fillRect(cx - 4, cy + 4, 8, 1);
    star(x, cx, cy, 2, '#e8f0ff');
    x.fillStyle = '#ffffff'; x.fillRect(cx, cy, 1, 1);
  }
  // 足もとの かべの 下の かげ
  x.fillStyle = 'rgba(0,0,0,0.25)';
  x.fillRect(0, hor - 4, BW, 4);
}

// ───── 塔の てっぺん ─────
function drawTowerTop(x, hor) {
  // 星空（上が こい 青、下が むらさき）
  const bands = ['#02041a', '#060a28', '#0c1236', '#141a48', '#1e1e56', '#2a2462', '#3a2c6c'];
  for (let y = 0; y < hor; y++) {
    const t = y / hor;
    const i = Math.min(bands.length - 1, Math.floor(t * bands.length));
    x.fillStyle = bands[i];
    x.fillRect(0, y, BW, 1);
  }
  // 天の川（ななめの 光の おび）
  for (let i = 0; i < 520; i++) {
    const u = rnd(i, 1.3), v = rnd(i, 2.7);
    const px = Math.round(u * BW);
    const center = 8 + px * 0.24;
    const py = Math.round(center + (v - 0.5) * 26 * (0.6 + rnd(i, 5.1)));
    if (py < 0 || py >= hor - 20) continue;
    const a = 0.12 + rnd(i, 7.7) * 0.25;
    x.fillStyle = i % 5 ? `rgba(200,190,255,${a.toFixed(2)})` : `rgba(255,230,200,${a.toFixed(2)})`;
    x.fillRect(px, py, 1, 1);
  }
  // 星
  for (let i = 0; i < 70; i++) {
    const px = Math.round(rnd(i, 3.1) * BW), py = Math.round(rnd(i, 4.3) * (hor - 26));
    star(x, px, py, i % 11 === 0 ? 2 : i % 5 === 0 ? 1 : 0, i % 7 === 0 ? '#ffe8a0' : i % 3 ? '#ffffff' : '#bfe0ff');
  }
  // 天のとばり（上の ほうで ゆらめく 光の まく。むらさき・水色・みどり）
  for (const [base, amp, col, off] of [[10, 5, 'rgba(160,140,255,0.22)', 0], [16, 6, 'rgba(120,220,255,0.18)', 1.7], [22, 4, 'rgba(140,255,200,0.12)', 3.1]]) {
    for (let px = 0; px < BW; px++) {
      const y0 = Math.round(base + Math.sin(px * 0.045 + off) * amp + Math.sin(px * 0.13 + off * 2) * 2);
      const len = 10 + Math.round(Math.abs(Math.sin(px * 0.07 + off)) * 10);
      for (let k = 0; k < len; k++) {
        if (k % 2 && px % 2) continue;
        x.fillStyle = col;
        x.fillRect(px, y0 + k, 1, 1);
      }
    }
  }
  // 遠くの 雲の 海（地平線の ところ。白く もこもこ）
  for (let px = 0; px < BW; px++) {
    const h = 9 + Math.abs(Math.sin(px * 0.06)) * 6 + Math.abs(Math.sin(px * 0.17 + 1)) * 3;
    for (let k = 0; k < h; k++) {
      const t = k / h;
      x.fillStyle = mix('#e8ecff', '#8a8cc0', t);
      x.fillRect(px, hor - h + k, 1, 1);
    }
  }
  // くずれた 柱（左右）
  for (const [cx, top, broken] of [[22, 18, true], [58, 36, false], [198, 30, false], [236, 12, true]]) {
    x.fillStyle = '#2a2c48'; x.fillRect(cx - 8, top, 16, hor - top);
    x.fillStyle = '#7a7ca0'; x.fillRect(cx - 7, top, 14, hor - top);
    x.fillStyle = '#a8aac8'; x.fillRect(cx - 7, top, 3, hor - top);
    x.fillStyle = '#4a4c6c'; x.fillRect(cx + 4, top, 2, hor - top);
    for (let y = top + 6; y < hor; y += 12) { x.fillStyle = '#5a5c7e'; x.fillRect(cx - 7, y, 14, 1); }
    if (broken) {
      // ぎざぎざの こわれた あたま
      x.fillStyle = '#02041a';
      for (let k = -7; k < 7; k++) x.fillRect(cx + k, top, 1, Math.round(rnd(k + cx) * 5));
    } else {
      x.fillStyle = '#a8aac8'; x.fillRect(cx - 9, top - 3, 18, 3);
      x.fillStyle = '#e8c060'; x.fillRect(cx - 9, top - 4, 18, 1);
    }
  }
}

export function drawTowerBg(x, d, hor) {
  if (d.deco === 'stower') drawTowerHall(x, hor);
  else if (d.deco === 'stop') drawTowerTop(x, hor);
}

// ゆか: 塔の 中は 石だたみに 星の 紋、てっぺんは 星座の 円の 石の 台
export function drawTowerFloorBg(x, d, hor) {
  const top = d.deco === 'stop';
  // 石だたみの めじ（おくへ ちぢむ）
  for (let i = 0; i < 7; i++) {
    const y = hor + 3 + Math.round(i * i * 1.4);
    if (y >= BH) break;
    x.fillStyle = top ? 'rgba(40,40,80,0.35)' : 'rgba(20,24,44,0.35)';
    x.fillRect(0, y, BW, 1);
    const n = 6 + i * 2;
    for (let j = 0; j <= n; j++) {
      const px = Math.round(BW / 2 + (j - n / 2) * (BW / n) * (1 + i * 0.06));
      x.fillRect(px, y - Math.round(i * 1.3) - 1, 1, Math.round(i * 1.3) + 1);
    }
  }
  // まん中の 星の 紋（だ円）
  const cx = BW / 2, cy = 118;
  x.strokeStyle = top ? 'rgba(232,192,96,0.6)' : 'rgba(170,190,255,0.4)';
  x.lineWidth = 1;
  x.beginPath(); x.ellipse(cx, cy, 70, 11, 0, 0, Math.PI * 2); x.stroke();
  x.beginPath(); x.ellipse(cx, cy, 52, 8, 0, 0, Math.PI * 2); x.stroke();
  // 星の 形（5つの 先）
  x.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.42 : 1;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(a) * 46 * r, py = cy + Math.sin(a) * 7.5 * r;
    if (i) x.lineTo(px, py);
    else x.moveTo(px, py);
  }
  x.closePath();
  x.stroke();
  if (top) {
    // 星座の 点と 線
    const pts = [[cx - 60, cy - 2], [cx - 34, cy + 6], [cx - 12, cy - 6], [cx + 20, cy + 5], [cx + 44, cy - 4], [cx + 62, cy + 3]];
    x.strokeStyle = 'rgba(255,240,168,0.5)';
    x.beginPath();
    pts.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py)));
    x.stroke();
    for (const [px, py] of pts) { x.fillStyle = '#fff0a8'; x.fillRect(Math.round(px), Math.round(py), 2, 1); }
    // 台の ふち（金）
    x.fillStyle = '#a07a2a'; x.fillRect(0, hor, BW, 2);
    x.fillStyle = '#e8c060'; x.fillRect(0, hor, BW, 1);
  } else {
    x.fillStyle = 'rgba(200,215,255,0.5)';
    for (let i = 0; i < 12; i++) x.fillRect(Math.round(cx - 66 + i * 12), cy + Math.round(Math.sin(i) * 3), 1, 1);
  }
}
