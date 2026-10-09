// 第4章 Step 7「砂の底の神殿とモルガナ」の 戦いの 背景（battlefx.js の battleBackground から よぶ。BW×BH の まま かく。hor … 地面の たかさ）
// ・sand_temple（deco 'temple'）… 砂の 下に しずんだ 古い 神殿: 青みどりの 石の かべ・水の もようを ほった 柱・
//   天井の すき間から さしこむ 光の おび・かべを つたう 水の すじ。ゆかは ぬれた 石だたみと まん中の 水路
// ・mirror_hall（deco 'mirror'）… 鏡の間: かべ いちめんの 大きな 鏡（光の すじ・うつりこみ）・銀の わく・むらさきの カーテン。
//   ゆかの 半分は 鏡の ゆか（うつりこみ）
// ・morgana_hall（deco 'mhall'）… 水鏡の広間: 広間いっぱいの 大きな 水鏡（中に 遠い 空に うかぶ 島が ゆらゆら うつる。第5章の 伏線）・
//   両がわから 流れ落ちる 水・青く 光る 水の 柱。ゆかは 水が うすく はった 石の ゆか
import { mix } from './pixel.js';

const BW = 256, BH = 144;

export const TEMPLE_BG = {
  sand_temple: { sky: ['#06121a', '#0c2230', '#163848'], far: '#1e4a5a', near: '#3a6a72', ground: ['#4a7a7a', '#3e6c6e'], deco: 'temple' },
  mirror_hall: { sky: ['#0c0a1a', '#1a1630', '#2a2448'], far: '#3a3460', near: '#6a6898', ground: ['#8a8ab8', '#7a7aa8'], deco: 'mirror' },
  morgana_hall: { sky: ['#020818', '#061430', '#0c2448'], far: '#123a6a', near: '#2a5a8a', ground: ['#3a6a9a', '#2e5e8e'], deco: 'mhall' },
};
export const TEMPLE_DECOS = new Set(['temple', 'mirror', 'mhall']);

// ───── 砂の底の神殿 ─────
function drawTempleWall(x, hor) {
  for (let y = 0; y < hor; y++) {
    const t = y / hor;
    x.fillStyle = mix('#050e14', '#2e5a62', Math.min(1, t * t * 1.05 + t * 0.2));
    x.fillRect(0, y, BW, 1);
  }
  // 石の ブロックの めじ
  for (let r = 0, y0 = 4; y0 < hor; r++, y0 += 10) {
    const t = Math.min(1, (y0 + 5) / hor);
    x.fillStyle = mix('#030a0e', '#18343a', t);
    x.fillRect(0, y0, BW, 1);
    for (let bx = (r % 2) * 13; bx < BW; bx += 26) x.fillRect(bx, y0, 1, 10);
    if (t > 0.3) {
      x.fillStyle = mix('#14282c', '#5a8a8a', t);
      for (let bx = (r % 2) * 13 + 1; bx < BW; bx += 26) x.fillRect(bx, y0 + 1, 24, 1);
    }
  }
  // 天井の すき間から さす 光の おび（砂の 上の 日の 光）
  for (const [cx, w] of [[70, 16], [176, 12]]) {
    for (let y = 0; y < hor + 20; y++) {
      const a = 0.12 * (1 - y / (hor + 20));
      x.fillStyle = `rgba(200,240,230,${a.toFixed(3)})`;
      x.fillRect(Math.round(cx - w / 2 + y * 0.18), y, Math.round(w + y * 0.12), 1);
    }
    x.fillStyle = '#d8c48a';
    x.fillRect(cx - w / 2 - 2, 0, w + 4, 2);
  }
  // 水の もようを ほった 柱（4本）
  for (const cx of [18, 98, 158, 238]) {
    x.fillStyle = '#081c22'; x.fillRect(cx - 9, 0, 18, hor);
    x.fillStyle = '#2e5e64'; x.fillRect(cx - 8, 0, 16, hor);
    x.fillStyle = '#5a9090'; x.fillRect(cx - 8, 0, 3, hor);
    x.fillStyle = '#183a40'; x.fillRect(cx + 5, 0, 2, hor);
    // 波の ほりもの
    x.fillStyle = '#7ab8b0';
    for (let y = 10; y < hor - 10; y += 14) {
      for (let k = -5; k <= 5; k++) x.fillRect(cx + k, y + Math.round(Math.sin(k * 0.9) * 2), 1, 1);
    }
    x.fillStyle = '#183a40'; x.fillRect(cx - 10, 4, 20, 3); x.fillRect(cx - 10, hor - 6, 20, 6);
    x.fillStyle = '#6aa0a0'; x.fillRect(cx - 10, 4, 20, 1); x.fillRect(cx - 10, hor - 6, 20, 1);
  }
  // かべを つたう 水の すじ
  for (const [wx, top] of [[56, 8], [124, 2], [206, 12]]) {
    for (let y = top; y < hor; y++) {
      x.fillStyle = y % 5 < 2 ? 'rgba(150,220,240,0.55)' : 'rgba(90,184,232,0.4)';
      x.fillRect(wx + ((y >> 3) % 2), y, 2, 1);
    }
  }
  // かべの 下の 水たまりと こけ
  x.fillStyle = '#2a6a5a';
  for (let k = 0; k < BW; k++) {
    const h = Math.round(2 + Math.abs(Math.sin(k * 0.07)) * 3);
    x.fillRect(k, hor - h, 1, h);
  }
}

function drawTempleFloor(x, hor) {
  const H = BH - hor;
  // ぬれた 石だたみ（おくへ せまく なる めじ）
  x.fillStyle = 'rgba(0,20,30,0.25)';
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
  // まん中の 水路（光る 水）
  for (let y = hor + 2; y < BH; y++) {
    const t = (y - hor) / H;
    const hw = 8 + t * 26;
    x.fillStyle = mix('#1a5a7a', '#3a8ab8', t);
    x.fillRect(Math.round(128 - hw), y, Math.round(hw * 2), 1);
    if (y % 3 === 0) {
      x.fillStyle = 'rgba(200,240,255,0.35)';
      x.fillRect(Math.round(128 - hw * 0.6 + Math.sin(y * 0.9) * 4), y, Math.round(hw * 0.3), 1);
    }
  }
  // ぬれた ゆかの 光
  x.fillStyle = 'rgba(180,230,240,0.18)';
  for (let i = 0; i < 14; i++) x.fillRect((i * 71 + 13) % BW, hor + 8 + ((i * 29) % (H - 10)), 6, 1);
}

// ───── 鏡の間 ─────
const MIRRORS = [[40, 26], [128, 34], [216, 26]];
function drawMirrorWall(x, hor) {
  for (let y = 0; y < hor; y++) {
    const t = y / hor;
    x.fillStyle = mix('#0a0816', '#3e3864', Math.min(1, t * 1.1));
    x.fillRect(0, y, BW, 1);
  }
  // むらさきの カーテン（鏡の あいだ）
  for (const cx of [84, 172]) {
    for (let y = 0; y < hor - 4; y++) {
      for (let k = -12; k <= 12; k++) {
        const fold = Math.sin(k * 0.8 + y * 0.03);
        x.fillStyle = fold > 0.3 ? '#5a3a8a' : fold > -0.3 ? '#46286e' : '#2e1a4a';
        x.fillRect(cx + k, y, 1, 1);
      }
    }
    x.fillStyle = '#c8b060'; x.fillRect(cx - 13, 0, 26, 2);
  }
  // 大きな 鏡（銀の わく。うつりこみの 光の すじ）
  for (const [cx, w] of MIRRORS) {
    const top = 6, bot = hor - 6, r = w / 2;
    for (let y = top; y <= bot; y++) {
      const dy = top + r - y;
      const half = y < top + r ? Math.sqrt(Math.max(0, r * r - dy * dy)) : r;
      x.fillStyle = mix('#cfe4f6', '#6a86b8', (y - top) / (bot - top));
      x.fillRect(Math.round(cx - half), y, Math.round(half * 2), 1);
    }
    // うつりこみ（ななめの 光・とおくの 鏡の 鏡）
    x.fillStyle = 'rgba(255,255,255,0.5)';
    for (let y = top + 6; y < bot - 4; y++) x.fillRect(Math.round(cx - r + 4 + (y - top) * 0.35), y, 3, 1);
    x.fillStyle = 'rgba(255,255,255,0.28)';
    for (let y = top + 14; y < bot - 8; y++) x.fillRect(Math.round(cx - r + 12 + (y - top) * 0.35), y, 1, 1);
    x.fillStyle = 'rgba(60,70,120,0.35)';
    x.fillRect(Math.round(cx - r * 0.5), bot - 22, Math.round(r), 14);
    // わく
    x.strokeStyle = '#2a2a3a'; x.lineWidth = 4;
    x.beginPath(); x.arc(cx, top + r, r + 1, Math.PI, 0); x.lineTo(cx + r + 1, bot + 1); x.lineTo(cx - r - 1, bot + 1); x.closePath(); x.stroke();
    x.strokeStyle = '#c8ccd8'; x.lineWidth = 2;
    x.beginPath(); x.arc(cx, top + r, r + 1, Math.PI, 0); x.lineTo(cx + r + 1, bot + 1); x.lineTo(cx - r - 1, bot + 1); x.closePath(); x.stroke();
    x.fillStyle = '#f0d878'; x.fillRect(cx - 2, top - 3, 4, 4);
  }
  // 天井の 光の つぶ
  x.fillStyle = '#ffffff';
  for (let i = 0; i < 12; i++) x.fillRect((i * 53 + 7) % BW, (i * 17) % 20 + 2, 1, 1);
}

function drawMirrorFloor(x, hor) {
  const H = BH - hor;
  // 石の ゆか（ひだり）と 鏡の ゆか（みぎ半分。上の 鏡が さかさに うつる）
  for (let y = hor + 2; y < BH; y++) {
    const t = (y - hor) / H;
    const mx = Math.round(128 - 20 * t);
    x.fillStyle = mix('#9ab4d8', '#cfe0f4', t);
    x.fillRect(mx, y, BW - mx, 1);
    if (y % 4 === 0) {
      x.fillStyle = 'rgba(255,255,255,0.4)';
      x.fillRect(mx + 10 + Math.round(t * 30), y, 18, 1);
    }
  }
  // 鏡の ゆかの ふち（銀）
  x.fillStyle = '#e8ecf4';
  for (let y = hor + 2; y < BH; y++) x.fillRect(Math.round(128 - 20 * ((y - hor) / H)) - 1, y, 2, 1);
  // 石の めじ
  x.fillStyle = 'rgba(20,16,40,0.25)';
  for (let i = 0; i < 7; i++) {
    const y = hor + 4 + i * i * 2;
    if (y < BH) x.fillRect(0, y, 120, 1);
  }
  for (let k = -9; k <= 0; k++) {
    for (let y = hor + 4; y < BH; y += 2) {
      const t = (y - hor) / H;
      x.fillRect(Math.round(128 + k * (13 + t * 28)), y, 1, 2);
    }
  }
}

// ───── 水鏡の広間 ─────
function drawMorganaHall(x, hor) {
  for (let y = 0; y < hor; y++) {
    const t = y / hor;
    x.fillStyle = mix('#01040e', '#123060', Math.min(1, t * 1.1));
    x.fillRect(0, y, BW, 1);
  }
  // 大きな 水鏡（だえん。中に 遠い 空と うかぶ 島）
  const cx = 128, cy = 40, rx = 70, ry = 34;
  for (let y = cy - ry; y <= cy + ry; y++) {
    const dy = (y - cy) / ry;
    const half = Math.sqrt(Math.max(0, 1 - dy * dy)) * rx;
    const t = (y - (cy - ry)) / (ry * 2);
    x.fillStyle = mix('#7ab8e8', '#d8ecff', Math.min(1, t * 1.2));
    x.fillRect(Math.round(cx - half), y, Math.round(half * 2), 1);
  }
  // うかぶ 島（第5章の 伏線。ゆらゆら）
  x.fillStyle = '#5a7a5a';
  for (let k = -16; k <= 16; k++) x.fillRect(cx + 12 + k, 38 - Math.round(Math.cos(k / 16 * 1.4) * 4), 1, 4);
  x.fillStyle = '#7a6a4a';
  for (let k = -14; k <= 14; k++) x.fillRect(cx + 12 + k, 41, 1, Math.max(1, Math.round((14 - Math.abs(k)) * 0.6)));
  x.fillStyle = '#8ab87a'; x.fillRect(cx + 4, 33, 6, 2); x.fillRect(cx + 16, 32, 5, 2);
  x.fillStyle = '#ffffff';
  for (const [px, py] of [[cx - 40, 26], [cx - 22, 34], [cx + 40, 22], [cx + 52, 44]]) { x.fillRect(px, py, 8, 2); x.fillRect(px + 2, py - 1, 4, 1); }
  // 水面の ゆらぎ（よこの 光の すじ）
  x.fillStyle = 'rgba(255,255,255,0.35)';
  for (let y = cy - ry + 6; y < cy + ry - 4; y += 5) x.fillRect(Math.round(cx - 40 + Math.sin(y) * 10), y, 22, 1);
  // わく（青い 水晶）
  x.strokeStyle = '#0a1a3a'; x.lineWidth = 5;
  x.beginPath(); x.ellipse(cx, cy, rx + 2, ry + 2, 0, 0, Math.PI * 2); x.stroke();
  x.strokeStyle = '#5ab8e8'; x.lineWidth = 2;
  x.beginPath(); x.ellipse(cx, cy, rx + 2, ry + 2, 0, 0, Math.PI * 2); x.stroke();
  x.fillStyle = '#bfe6ff';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    x.fillRect(Math.round(cx + Math.cos(a) * (rx + 2)) - 1, Math.round(cy + Math.sin(a) * (ry + 2)) - 1, 3, 3);
  }
  // 両がわから 流れ落ちる 水（たき）
  for (const wx of [14, 230]) {
    for (let y = 0; y < hor; y++) {
      for (let k = 0; k < 12; k++) {
        const v = (Math.sin(y * 0.5 + k * 1.7) + 1) / 2;
        x.fillStyle = v > 0.7 ? '#e0f6ff' : v > 0.35 ? '#5ab8e8' : '#2e7cb8';
        x.fillRect(wx + k, y, 1, 1);
      }
    }
  }
  // 青く 光る 水の 柱
  for (const px of [52, 204]) {
    x.fillStyle = 'rgba(90,184,232,0.18)'; x.fillRect(px - 8, 0, 16, hor);
    x.fillStyle = 'rgba(160,220,255,0.35)'; x.fillRect(px - 3, 0, 6, hor);
    x.fillStyle = 'rgba(255,255,255,0.5)'; x.fillRect(px - 1, 0, 1, hor);
    x.fillStyle = '#1a3a6a'; x.fillRect(px - 10, hor - 8, 20, 8);
    x.fillStyle = '#5a8ab8'; x.fillRect(px - 10, hor - 8, 20, 1);
  }
}

function drawMorganaFloor(x, hor) {
  const H = BH - hor;
  // 水が うすく はった 石の ゆか（水鏡が うつる）
  for (let y = hor + 2; y < BH; y++) {
    const t = (y - hor) / H;
    if (y % 2 === 0) {
      x.fillStyle = `rgba(180,220,255,${(0.18 - t * 0.1).toFixed(3)})`;
      x.fillRect(Math.round(128 - 50 - t * 40), y, Math.round(100 + t * 80), 1);
    }
  }
  // 水の わ（ゆらゆら）
  x.strokeStyle = 'rgba(200,236,255,0.4)';
  x.lineWidth = 1;
  for (const [cx, cy, r] of [[70, hor + 30, 14], [190, hor + 40, 18], [128, hor + 54, 22]]) {
    x.beginPath(); x.ellipse(cx, cy, r, r * 0.25, 0, 0, Math.PI * 2); x.stroke();
  }
  x.fillStyle = 'rgba(0,10,30,0.2)';
  for (let i = 0; i < 6; i++) {
    const y = hor + 6 + i * i * 2;
    if (y < BH) x.fillRect(0, y, BW, 1);
  }
}

// battlefx.js の battleBackground から: かべ（地面の 上）
export function drawTempleBg(x, d, hor) {
  if (d.deco === 'temple') drawTempleWall(x, hor);
  else if (d.deco === 'mirror') drawMirrorWall(x, hor);
  else if (d.deco === 'mhall') drawMorganaHall(x, hor);
}

// ゆか（地面の あと）
export function drawTempleFloorBg(x, d, hor) {
  if (d.deco === 'temple') drawTempleFloor(x, hor);
  else if (d.deco === 'mirror') drawMirrorFloor(x, hor);
  else if (d.deco === 'mhall') drawMorganaFloor(x, hor);
}
