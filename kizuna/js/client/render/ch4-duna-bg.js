// 第4章 Step 6「砂の海賊と砂クジラ」の 戦いの 背景（battlefx.js の battleBackground から よぶ。BW×BH の まま かく。hor … 地面の たかさ）
// ・sand_castle（deco 'castle'）… 砂の古城の 中: ふるい 石の 広間・アーチの まどから さす 日の 光・やぶれた 赤い 旗・
//   くずれた 柱・かべの 下の 砂の ふきだまり。ゆかは ひびの 入った 石だたみと 色あせた 赤い じゅうたん
// ・sand_sea / sand_sea_night / whale_deck（deco 'sand_sea'。かんぱんは battlefx.js の deck）… すなかぜ号の 上:
//   遠くの 赤い 岩山・金色の 砂の 波・右に マストと たたんだ 帆。whale_deck は 砂クジラの ねどこ（遠くに 大きな 砂の うず・
//   赤く にごる 空・まいあがる 砂）
import { mix } from './pixel.js?v=fd5519597012';

const BW = 256, BH = 144;

// ───── 砂の古城 ─────
const WINDOWS = [[48, 14], [128, 12], [208, 14]];

export function drawCastleHall(x, hor) {
  // かべ（上ほど くらい。石の ブロックの めじ）
  for (let y = 0; y < hor; y++) {
    const t = y / hor;
    x.fillStyle = mix('#1a140e', '#7a6a52', Math.min(1, t * t * 1.1 + t * 0.25));
    x.fillRect(0, y, BW, 1);
  }
  for (let r = 0, y0 = 3; y0 < hor; r++, y0 += 9) {
    const t = Math.min(1, (y0 + 4) / hor);
    x.fillStyle = mix('#0c0806', '#3e3428', t);
    x.fillRect(0, y0, BW, 1);
    for (let bx = (r % 2) * 11; bx < BW; bx += 22) x.fillRect(bx, y0, 1, 9);
    // ブロックの 上の ふちの 光
    if (t > 0.35) {
      x.fillStyle = mix('#2e261c', '#a8967a', t);
      for (let bx = (r % 2) * 11 + 1; bx < BW; bx += 22) x.fillRect(bx, y0 + 1, 20, 1);
    }
  }
  // アーチの まど（日の 光の 空・こわれた ところ）
  for (const [cx, w] of WINDOWS) {
    const top = 10, bot = 46, r = w / 2;
    for (let y = top; y <= bot; y++) {
      const dy = top + r - y;
      const half = y < top + r ? Math.sqrt(Math.max(0, r * r - dy * dy)) : r;
      x.fillStyle = mix('#f6e2b0', '#e8b878', (y - top) / (bot - top));
      x.fillRect(Math.round(cx - half), y, Math.round(half * 2), 1);
    }
    // まどの わく（くずれかけた 石）
    x.fillStyle = '#3a3024';
    x.beginPath(); x.arc(cx, top + r, r + 3, Math.PI, 0); x.arc(cx, top + r, r, 0, Math.PI, true); x.fill();
    x.fillRect(cx - r - 3, top + r, 3, bot - top - r + 2); x.fillRect(cx + r, top + r, 3, bot - top - r + 2);
    x.fillStyle = '#8a7a5e';
    x.fillRect(cx - r - 4, bot + 1, w + 8, 3);
    x.fillStyle = '#b8a888';
    x.fillRect(cx - r - 4, bot + 1, w + 8, 1);
    // 遠くの 砂丘
    x.fillStyle = '#d8a860';
    x.fillRect(cx - r, bot - 6, w, 6);
    x.fillStyle = '#c08a48';
    x.fillRect(cx - r, bot - 2, w, 2);
  }
  // 日の 光の おび（まどから ななめに さしこむ）
  for (const [cx, w] of WINDOWS) {
    x.fillStyle = 'rgba(255,236,190,0.07)';
    for (let y = 46; y < hor; y++) {
      const t = (y - 46) / (hor - 46);
      x.fillRect(Math.round(cx - w / 2 + t * 18), y, Math.round(w + t * 10), 1);
    }
  }
  // やぶれた 赤い 旗（まどの あいだ。すそが ぎざぎざ）
  for (const fx of [88, 168]) {
    x.fillStyle = '#3a1a14'; x.fillRect(fx - 9, 8, 18, 2);
    for (let y = 10; y < 52; y++) {
      const torn = y > 40 ? Math.abs(Math.sin(y * 1.7 + fx)) * 6 : 0;
      x.fillStyle = y % 7 < 2 ? '#6a1a1e' : '#8a2a2a';
      x.fillRect(fx - 8 + Math.round(torn * 0.5), y, Math.round(16 - torn), 1);
    }
    // 金の しるし（砂の 海賊の いかりの もよう）
    x.fillStyle = '#c8a040';
    x.fillRect(fx - 1, 18, 2, 12); x.fillRect(fx - 4, 20, 8, 2); x.fillRect(fx - 5, 27, 3, 2); x.fillRect(fx + 2, 27, 3, 2);
  }
  // 柱（ふるい 砂岩。ひとつは 上が くずれている）
  for (const [cx, broken] of [[16, false], [128 - 36, true], [128 + 36, false], [240, true]]) {
    const top = broken ? 30 : 0;
    x.fillStyle = '#2a221a'; x.fillRect(cx - 8, top, 16, hor - top);
    x.fillStyle = '#8a7858'; x.fillRect(cx - 7, top, 14, hor - top);
    x.fillStyle = '#b4a27e'; x.fillRect(cx - 7, top, 3, hor - top);
    x.fillStyle = '#5e5038'; x.fillRect(cx + 4, top, 2, hor - top);
    if (broken) {
      // くずれた てっぺん
      x.fillStyle = '#8a7858';
      for (let k = -7; k < 7; k++) x.fillRect(cx + k, top - Math.round(Math.abs(Math.sin(k * 1.3)) * 5), 1, 5);
    } else {
      x.fillStyle = '#5e5038'; x.fillRect(cx - 9, 6, 18, 3);
      x.fillStyle = '#b4a27e'; x.fillRect(cx - 9, 6, 18, 1);
    }
    x.fillStyle = '#5e5038'; x.fillRect(cx - 9, hor - 5, 18, 5);
    x.fillStyle = '#b4a27e'; x.fillRect(cx - 9, hor - 5, 18, 1);
  }
  // かべの 下の 砂の ふきだまり
  x.fillStyle = '#c8a060';
  for (let k = 0; k < BW; k++) {
    const h = Math.round(3 + Math.abs(Math.sin(k * 0.045)) * 6 + Math.sin(k * 0.21) * 1.2);
    x.fillRect(k, hor - h, 1, h);
  }
  x.fillStyle = '#e2c080';
  for (let k = 0; k < BW; k += 3) x.fillRect(k, hor - Math.round(3 + Math.abs(Math.sin(k * 0.045)) * 6), 2, 1);
}

// ゆか: ひびの 入った 石だたみ（おくへ むかって せまく なる めじ）・まん中に 色あせた 赤い じゅうたん・砂の すじ
export function drawCastleFloor(x, hor) {
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
  // 色あせた 赤い じゅうたん（ふちは 青銅の 色）
  for (let y = hor; y < BH; y++) {
    const t = (y - hor) / H;
    const hw = 12 + t * 34;
    x.fillStyle = '#8a6a34'; x.fillRect(Math.round(128 - hw - 2), y, Math.round(hw * 2 + 4), 1);
    x.fillStyle = mix('#3a1416', '#7a2a26', Math.min(1, t * 1.3)); x.fillRect(Math.round(128 - hw), y, Math.round(hw * 2), 1);
  }
  // ひび と 砂の すじ
  x.fillStyle = 'rgba(30,20,10,0.35)';
  for (const [sx, sy, len] of [[40, 96, 14], [200, 104, 18], [70, 122, 22], [178, 128, 16]]) {
    for (let i = 0; i < len; i++) x.fillRect(sx + i, sy + Math.round(Math.sin(i * 0.9) * 1.5), 1, 1);
  }
  x.fillStyle = 'rgba(232,196,128,0.5)';
  for (const [sx, sy, len] of [[14, 110, 30], [214, 116, 26], [100, 136, 20]]) x.fillRect(sx, sy, len, 1);
  // まどの 光が ゆかに うつる
  x.fillStyle = 'rgba(255,236,190,0.1)';
  for (const [cx] of WINDOWS) {
    x.beginPath(); x.ellipse(cx + 22, hor + 26, 20, 4, 0, 0, Math.PI * 2); x.fill();
  }
}

// ───── 砂の海（すなかぜ号の かんぱんの 上）─────
// d.far … 砂の 海の 色。d.whirl … 砂クジラの ねどこ（遠くに 砂の うず・赤く にごった 空・まいあがる 砂）
export function drawSandSea(x, d, hor) {
  const sea = d.far, dark = mix(d.far, '#000000', 0.28), lit = mix(d.far, '#ffffff', 0.35);
  if (d.whirl) {
    // にごった 空の くも
    x.fillStyle = 'rgba(90,40,30,0.35)';
    for (const [cx, cy, w] of [[30, 12, 70], [140, 6, 90], [220, 18, 60]]) {
      x.fillRect(cx, cy, w, 6); x.fillRect(cx + 8, cy - 3, w - 16, 3); x.fillRect(cx + 4, cy + 6, w - 8, 2);
    }
  } else if (!d.night) {
    // 白い くも
    x.fillStyle = 'rgba(255,255,255,0.75)';
    for (const [cx, cy, w] of [[30, 16, 28], [150, 10, 36], [214, 24, 22]]) {
      x.fillRect(cx, cy, w, 4); x.fillRect(cx + 4, cy - 3, w - 8, 3);
    }
  }
  // 遠くの 赤い 岩山（砂の海の 岸）
  x.fillStyle = mix(d.night ? '#5a3a2a' : '#b86c40', d.far, 0.25);
  for (const [mx, mw, mh] of [[0, 46, 16], [70, 20, 9], [168, 54, 20], [238, 30, 12]]) {
    for (let k = 0; k < mw; k++) {
      const h = mh - Math.round(Math.abs(k - mw / 2) / (mw / 2) * (mh * 0.35));
      x.fillRect(mx + k, hor - 22 - h, 1, h);
    }
  }
  // 砂の 海（地平線から てまえへ。波がしらは てまえほど 大きい）
  for (let y = hor - 22; y < hor; y++) {
    const t = (y - (hor - 22)) / 22;
    x.fillStyle = mix(mix(sea, '#ffffff', 0.18), sea, t);
    x.fillRect(0, y, BW, 1);
  }
  for (let row = 0; row < 6; row++) {
    const y = hor - 20 + row * 3.4;
    const len = 6 + row * 3, gap = 22 + row * 6;
    for (let k = (row * 17) % gap; k < BW; k += gap) {
      x.fillStyle = lit; x.fillRect(k, Math.round(y), len, 1);
      x.fillStyle = dark; x.fillRect(k + 1, Math.round(y) + 1, len, 1);
    }
  }
  if (d.whirl) {
    // 砂クジラの ねどこの 大きな 砂の うず
    const cx = 92, cy = hor - 11;
    for (let i = 7; i >= 0; i--) {
      x.fillStyle = mix('#4a2a16', sea, i / 7);
      x.beginPath(); x.ellipse(cx, cy, 10 + i * 6, 2 + i * 1.1, 0, 0, Math.PI * 2); x.fill();
    }
    x.strokeStyle = 'rgba(255,226,170,0.6)';
    x.lineWidth = 1;
    for (let i = 1; i < 7; i += 2) {
      x.beginPath(); x.ellipse(cx, cy, 10 + i * 6, 2 + i * 1.1, 0, 0.3 + i, 2.4 + i); x.stroke();
    }
    // まいあがる 砂の すじ
    for (let i = 0; i < 26; i++) {
      x.fillStyle = i % 2 ? 'rgba(240,200,130,0.55)' : 'rgba(200,140,80,0.5)';
      x.fillRect((i * 67 + 11) % BW, 10 + ((i * 29) % (hor - 30)), 6 + (i % 4) * 3, 1);
    }
  } else {
    // 遠くの 小島と ヤシの木
    x.fillStyle = mix(sea, '#5a4020', 0.35);
    x.beginPath(); x.ellipse(206, hor - 17, 14, 3, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = d.night ? '#2a3a2a' : '#3a6a2e';
    x.fillRect(207, hor - 30, 1, 12);
    for (let k = -6; k <= 6; k++) x.fillRect(207 + k, hor - 30 + Math.round(Math.abs(k) / 2.5), 1, 1);
  }
  // 右の マストと たたんだ 帆（すなかぜ号の 上）
  x.fillStyle = '#4a2e1a'; x.fillRect(236, 0, 5, hor);
  x.fillStyle = '#6a4428'; x.fillRect(236, 0, 2, hor);
  x.fillStyle = d.night ? '#9a8c70' : '#e8d8b0'; x.fillRect(226, 14, 24, 7);
  x.fillStyle = '#c83a3a'; x.fillRect(226, 18, 24, 2);
  x.fillStyle = '#3a2416';
  for (let k = 0; k < 40; k++) x.fillRect(Math.round(240 - k * 1.1), 20 + k, 1, 1);
  for (let k = 0; k < 30; k++) x.fillRect(Math.round(238 - k * 2.2), 22 + Math.round(k * 0.4), 1, 1);
}
