// 夜の 宮殿の 王の間（第4章 Step 5。大臣ザイード・砂の魔神ザイードの 戦い）の 戦いの 背景
// battlefx.js の battleBackground から よぶ（deco: 'palace'）。BW×BH の まま かく（hor … 地面の たかさ）
import { mix } from './pixel.js?v=fa0687a214b4';

const BW = 256, BH = 144;
// 高い まど（まん中 x・はば・アーチの てっぺん y・まどの 下 y）。まん中の まどに 大きな 月
const WINDOWS = [[52, 22, 10, 50], [128, 30, 6, 48], [204, 22, 10, 50]];
const PILLARS = [14, 90, 166, 242];
const LAMPS = [[71, 46], [185, 46]];

// おくの かべ: こい 青の タイルの かべ・月明かりが さしこむ 高い まど（3つ。まん中に 大きな 月）・むらさきの カーテン・
// 青と 金の 柱・水の 国の 波の もようの おび・まん中の 玉座（月を せおう）・左右の 青い 火の ランプ
export function drawPalaceHall(x, hor) {
  // かべ（下ほど 明るい）と タイルの めじ
  for (let y = 0; y < hor; y++) {
    const t = y / hor;
    x.fillStyle = mix('#05071a', '#22305c', Math.min(1, t * t * 1.2 + t * 0.2));
    x.fillRect(0, y, BW, 1);
  }
  for (let r = 0, y0 = 4; y0 < hor; r++, y0 += 7) {
    const t = Math.min(1, (y0 + 3) / hor);
    x.fillStyle = mix('#03040e', '#141c3c', t);
    x.fillRect(0, y0, BW, 1);
    for (let bx = (r % 2) * 8; bx < BW; bx += 16) x.fillRect(bx, y0, 1, 7);
    // タイルの まん中の 小さな ひしがた（下の だん だけ 見える）
    if (t > 0.45) {
      x.fillStyle = mix('#1a2448', '#3a5088', t);
      for (let bx = (r % 2) * 8 + 8; bx < BW; bx += 16) { x.fillRect(bx - 1, y0 + 3, 3, 1); x.fillRect(bx, y0 + 2, 1, 3); }
    }
  }
  // 高い まど（夜空・星・月。金の わく と こうし）
  for (const [cx, w, top, bot] of WINDOWS) {
    const r = w / 2;
    for (let y = top; y <= bot; y++) {
      const dy = top + r - y;
      const half = y < top + r ? Math.sqrt(Math.max(0, r * r - dy * dy)) : r;
      x.fillStyle = mix('#0a1240', '#26388a', (y - top) / (bot - top));
      x.fillRect(Math.round(cx - half), y, Math.round(half * 2), 1);
    }
    x.fillStyle = '#ffffff';
    for (let i = 0; i < 5; i++) x.fillRect(Math.round(cx - r + 3 + ((i * 7 + cx) % (w - 6))), top + 6 + ((i * 11 + cx) % (bot - top - 10)), 1, 1);
    // わく（金）
    x.fillStyle = '#a8842e';
    x.beginPath(); x.arc(cx, top + r, r + 2, Math.PI, 0); x.arc(cx, top + r, r, 0, Math.PI, true); x.fill();
    x.fillRect(cx - r - 2, top + r, 2, bot - top - r + 1); x.fillRect(cx + r, top + r, 2, bot - top - r + 1);
    x.fillRect(cx - r - 3, bot, w + 6, 3);
    x.fillStyle = '#e0bc58';
    x.fillRect(cx - r - 3, bot, w + 6, 1);
  }
  // まん中の まどの 大きな 月（月の鏡の 月）
  const [mx, , mtop] = WINDOWS[1];
  const glow = x.createRadialGradient(mx, mtop + 18, 0, mx, mtop + 18, 26);
  glow.addColorStop(0, 'rgba(220,232,255,0.45)');
  glow.addColorStop(1, 'rgba(220,232,255,0)');
  x.fillStyle = glow;
  x.beginPath(); x.arc(mx, mtop + 18, 26, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#fff6c8';
  x.beginPath(); x.arc(mx, mtop + 18, 10, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#e8dca0';
  x.fillRect(mx - 4, mtop + 14, 3, 2); x.fillRect(mx + 2, mtop + 20, 3, 2); x.fillRect(mx - 1, mtop + 23, 2, 1);
  // まどの こうし（月の 前にも かかる）
  x.fillStyle = 'rgba(10,12,30,0.85)';
  for (const [cx, w, top, bot] of WINDOWS) {
    x.fillRect(cx, top + 1, 1, bot - top - 1);
    for (let y = top + w / 2 + 6; y < bot; y += 9) x.fillRect(cx - w / 2, y, w, 1);
  }
  // むらさきの カーテン（まどの 両がわに たれて、すそを たばねる）
  for (const [cx, w, top, bot] of WINDOWS) {
    for (const s of [-1, 1]) {
      for (let y = top - 4; y < bot + 6; y++) {
        const tie = y > bot - 8 ? (y - (bot - 8)) * 0.5 : 0;
        const wid = Math.max(2, 7 - tie);
        const x0 = s < 0 ? cx - w / 2 - 4 - wid + tie * 0.6 : cx + w / 2 + 4 - tie * 0.6;
        x.fillStyle = y % 5 < 2 ? '#3a1e58' : '#4e2a74';
        x.fillRect(Math.round(x0), y, Math.round(wid), 1);
      }
      x.fillStyle = '#c8a040';
      x.fillRect(Math.round(cx + s * (w / 2 + 6)) - 2, bot - 8, 4, 2);
    }
  }
  // 水の 国の 波の もようの おび（青と 金）
  const fy = 58;
  x.fillStyle = '#1a3a6a'; x.fillRect(0, fy, BW, 8);
  x.fillStyle = '#a8842e'; x.fillRect(0, fy, BW, 1); x.fillRect(0, fy + 7, BW, 1);
  x.fillStyle = '#3ab8d8';
  for (let k = 0; k < BW; k++) {
    const y = fy + 4 + Math.round(Math.sin(k * 0.5) * 1.6);
    x.fillRect(k, y, 1, 1);
  }
  x.fillStyle = '#9ae4f4';
  for (let k = 2; k < BW; k += 13) x.fillRect(k, fy + 2, 1, 1);
  // 柱（こい 青の 石・金の かしら と だい）
  for (const cx of PILLARS) {
    x.fillStyle = '#0c1230'; x.fillRect(cx - 8, 0, 16, hor);
    x.fillStyle = '#1e2c5e'; x.fillRect(cx - 7, 0, 14, hor);
    x.fillStyle = '#34488a'; x.fillRect(cx - 7, 0, 3, hor);
    x.fillStyle = '#121a40'; x.fillRect(cx + 4, 0, 2, hor);
    x.fillStyle = '#a8842e'; x.fillRect(cx - 9, 8, 18, 3); x.fillRect(cx - 9, hor - 5, 18, 5);
    x.fillStyle = '#e0bc58'; x.fillRect(cx - 9, 8, 18, 1); x.fillRect(cx - 9, hor - 5, 18, 1);
    x.fillStyle = '#3ab8d8'; x.fillRect(cx - 2, 20, 4, 4);
  }
  // 玉座（まん中。月を せおう。青い ぬのの せもたれ と 金の かざり）
  const tx = 128, tt = 50;
  x.fillStyle = '#6e5418'; x.fillRect(tx - 13, tt, 26, hor - tt);
  x.fillStyle = '#c8a040'; x.fillRect(tx - 12, tt + 1, 24, hor - tt - 1);
  x.fillStyle = '#2a4a9a'; x.fillRect(tx - 9, tt + 3, 18, hor - tt - 12);
  x.fillStyle = '#3a68c8'; x.fillRect(tx - 9, tt + 3, 4, hor - tt - 12);
  x.fillStyle = '#e0bc58';
  x.beginPath(); x.arc(tx, tt + 1, 7, Math.PI, 0); x.fill();
  x.fillStyle = '#3ab8d8'; x.fillRect(tx - 2, tt - 4, 4, 4);
  x.fillStyle = '#c8a040'; x.fillRect(tx - 16, hor - 10, 32, 4);
  x.fillStyle = '#e0bc58'; x.fillRect(tx - 16, hor - 10, 32, 1);
  // 青い 火の ランプ（まわりが ぼんやり 明るい）
  for (const [lx, ly] of LAMPS) {
    const g = x.createRadialGradient(lx, ly, 0, lx, ly, 24);
    g.addColorStop(0, 'rgba(110,200,255,0.4)');
    g.addColorStop(1, 'rgba(110,200,255,0)');
    x.fillStyle = g;
    x.beginPath(); x.arc(lx, ly, 24, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#6e5418'; x.fillRect(lx - 1, ly + 4, 3, hor - ly - 4); x.fillRect(lx - 5, ly + 3, 11, 2); x.fillRect(lx - 4, hor - 2, 9, 2);
    x.fillStyle = '#3a9aff';
    x.beginPath(); x.ellipse(lx + 0.5, ly - 1, 3.5, 5, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#d8f4ff';
    x.beginPath(); x.ellipse(lx + 0.5, ly, 1.6, 2.6, 0, 0, Math.PI * 2); x.fill();
  }
}

// ゆか: みがいた 石の タイル（おくへ むかって せまく なる めじ）・玉座へ のびる 赤い じゅうたん（金の ふち）・
// まどから さしこむ 月明かり（ななめの 光の おび）
export function drawPalaceFloor(x, hor) {
  const H = BH - hor;
  x.fillStyle = 'rgba(0,0,0,0.2)';
  for (let i = 0; i < 7; i++) {
    const y = hor + 4 + i * i * 2;
    if (y < BH) x.fillRect(0, y, BW, 1);
  }
  for (let k = -9; k <= 9; k++) {
    for (let y = hor + 4; y < BH; y += 2) {
      const t = (y - hor) / H;
      x.fillRect(Math.round(128 + k * (13 + t * 28)), y, 1, 2);
    }
  }
  // 赤い じゅうたん（金の ふち）
  for (let y = hor; y < BH; y++) {
    const t = (y - hor) / H;
    const hw = 16 + t * 44;
    x.fillStyle = '#c8a040'; x.fillRect(Math.round(128 - hw - 2), y, Math.round(hw * 2 + 4), 1);
    x.fillStyle = mix('#4a1020', '#9a2030', Math.min(1, t * 1.3)); x.fillRect(Math.round(128 - hw), y, Math.round(hw * 2), 1);
    if (y % 6 === 0) { x.fillStyle = 'rgba(232,180,80,0.35)'; x.fillRect(Math.round(128 - hw + 3), y, Math.round(hw * 2 - 6), 1); }
  }
  // 月明かり（3つの まどから ななめに さしこむ 光の おび）
  for (const [cx, w] of WINDOWS) {
    x.fillStyle = 'rgba(200,220,255,0.08)';
    for (let y = hor; y < BH; y++) {
      const t = (y - hor) / H;
      const c = cx + 12 + t * 34;
      x.fillRect(Math.round(c - w / 2 - t * 8), y, Math.round(w + t * 16), 1);
    }
  }
  // ゆかに うつる 月の 光
  x.fillStyle = 'rgba(220,232,255,0.16)';
  x.beginPath(); x.ellipse(150, hor + 30, 22, 4, 0, 0, Math.PI * 2); x.fill();
}
