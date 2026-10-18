// 第5章 Step 6・7「根の島」と「大地の神殿」の 戦いの 背景（battlefx.js の drawBg から よぶ。BW×BH の まま かく。hor … 地面の たかさ）
// ・root_isle（deco 'root_isle'）… 根の島: 昼の 青い 空・白い 雲の 海・島の はしから たれる 大きな 木の 根・遠くの 大きな 木。
//   ゆかは こけと 根の 草地（小さな 葉・根の すじ）
// ・earth_temple（deco 'earth_temple'）… 大地の神殿 1〜4階: こげ茶の 石の かべ・かべを はう 木の 根・こけ・地下水の 青い すじ・たいまつ。
//   ゆかは 石だたみ（根が はいだす）
// ・earth_temple_deep（deco 'earth_temple_deep'）… 5〜8階・ノクトの 祭だん: 大地の心の あかね色の 光・赤く 光る 光石の はしら・われめ。
//   ゆかは あかね色に てらされた 岩の ゆか（われめから 光が もれる）
const BW = 256, BH = 144;

export const EARTH_BG = {
  root_isle: { sky: ['#3a7ad8', '#6aa8ea', '#a8d2f4', '#e4f2fa'], far: '#e8f0f8', near: '#5a8a3a', ground: ['#5e8e3c', '#4e7e32'], deco: 'root_isle' },
  earth_temple: { sky: ['#1a120a', '#2a1c10', '#3a2818', '#4a3420'], far: '#3a2a1a', near: '#5a4428', ground: ['#6a5034', '#5a442c'], deco: 'earth_temple' },
  earth_temple_deep: { sky: ['#140806', '#240e0a', '#3a1410', '#521c14'], far: '#2a100c', near: '#5a2418', ground: ['#5a2a1c', '#4a2216'], deco: 'earth_temple_deep' },
};
export const EARTH_DECOS = new Set(['root_isle', 'earth_temple', 'earth_temple_deep']);

// 0〜1 の まいかい おなじ ちらばり（背景は 1回だけ かく）
const rnd = (i, s = 1) => {
  const v = Math.sin(i * 127.1 * s + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const disc = (x, cx, cy, r, c) => { x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); };
// 木の 根（ふとさが へっていく 線）。pts … [[x, y], …]
function root(x, pts, w0, c, cl) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const w = Math.max(1, w0 * (1 - i / pts.length));
    x.strokeStyle = c;
    x.lineWidth = w;
    x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke();
    if (cl && w > 2) {
      x.strokeStyle = cl;
      x.lineWidth = 1;
      x.beginPath(); x.moveTo(ax - w / 3, ay); x.lineTo(bx - w / 3, by); x.stroke();
    }
  }
}

// ───── 根の島 ─────
function drawRootIsle(x, hor) {
  // 雲の 海（遠く）
  for (let i = 0; i < 26; i++) disc(x, rnd(i, 1.3) * BW, hor - 14 + rnd(i, 2.2) * 10, 8 + rnd(i, 3.1) * 12, i % 2 ? '#ffffff' : '#eef4fa');
  // 空の 雲
  for (const [cx, cy, r] of [[40, 20, 9], [52, 18, 11], [64, 22, 8], [186, 30, 10], [200, 26, 12], [214, 31, 8]]) disc(x, cx, cy, r, 'rgba(255,255,255,0.9)');
  // 遠くの 大きな 木（うかぶ 島の 上）
  x.fillStyle = '#7a8aa0';
  x.beginPath(); x.moveTo(150, hor - 22); x.lineTo(196, hor - 22); x.lineTo(176, hor - 8); x.closePath(); x.fill();
  x.fillStyle = '#6a5a4a';
  x.fillRect(170, hor - 48, 6, 26);
  for (const [cx, cy, r] of [[173, hor - 54, 16], [160, hor - 48, 11], [186, hor - 48, 12]]) disc(x, cx, cy, r, '#4a7a4a');
  for (const [cx, cy, r] of [[168, hor - 58, 6], [180, hor - 52, 5]]) disc(x, cx, cy, r, '#6aa05a');
  // 島の はしから たれる 根（遠くの 島）
  root(x, [[176, hor - 10], [178, hor + 2], [174, hor + 10]], 2, '#5a4a3a');
  // 近くの 大きな 根（左右の はしに）
  root(x, [[0, 30], [18, 50], [24, hor - 20], [30, hor + 6]], 9, '#5a3e24', '#8a6a44');
  root(x, [[8, 10], [30, 26], [44, 44], [48, hor - 4]], 5, '#5a3e24', '#8a6a44');
  root(x, [[256, 40], [236, 58], [230, hor - 10], [222, hor + 8]], 8, '#5a3e24', '#8a6a44');
  // 根に はえた こけ と 小さな 葉
  for (let i = 0; i < 18; i++) {
    const side = i % 2;
    const px = side ? 226 + rnd(i, 5.1) * 16 : 14 + rnd(i, 5.1) * 18, py = 40 + rnd(i, 6.3) * (hor - 50);
    x.fillStyle = i % 3 ? '#5aa83a' : '#9ad860';
    x.fillRect(Math.round(px), Math.round(py), 2, 2);
  }
  // 光の すじ
  x.fillStyle = 'rgba(255,255,230,0.12)';
  x.beginPath(); x.moveTo(90, 0); x.lineTo(120, 0); x.lineTo(150, hor); x.lineTo(110, hor); x.closePath(); x.fill();
}

// ───── 大地の神殿 ─────
function drawTemple(x, hor, deep) {
  // 石の かべ（ブロック）
  for (let row = 0; row * 10 < hor; row++) {
    for (let col = -1; col * 22 < BW; col++) {
      const bx = col * 22 + (row % 2 ? 11 : 0), by = row * 10;
      const v = rnd(row * 31 + col, 1.9);
      x.fillStyle = deep ? `rgba(${90 + Math.round(v * 40)},${30 + Math.round(v * 16)},${20 + Math.round(v * 10)},0.35)` : `rgba(${80 + Math.round(v * 30)},${60 + Math.round(v * 24)},${36 + Math.round(v * 16)},0.4)`;
      x.fillRect(bx + 1, by + 1, 20, 8);
    }
  }
  if (!deep) {
    // かべを はう 根
    root(x, [[20, 0], [30, 24], [24, 50], [36, hor]], 6, '#3a2a18', '#6a5034');
    root(x, [[110, 0], [104, 18], [120, 40], [116, 64]], 4, '#3a2a18', '#6a5034');
    root(x, [[236, 0], [226, 30], [238, 56], [230, hor]], 6, '#3a2a18', '#6a5034');
    // こけ
    for (let i = 0; i < 40; i++) {
      x.fillStyle = i % 3 ? 'rgba(90,140,60,0.7)' : 'rgba(140,190,90,0.7)';
      x.fillRect(Math.round(rnd(i, 7.7) * BW), Math.round(rnd(i, 8.1) * hor), 3, 2);
    }
    // 地下水の 青い すじ
    x.fillStyle = 'rgba(90,170,230,0.45)';
    for (const sx of [70, 162]) for (let y = 6; y < hor; y += 3) x.fillRect(sx + Math.round(Math.sin(y * 0.3)), y, 1, 2);
    // たいまつ
    for (const tx of [52, 204]) {
      x.fillStyle = '#4a3420';
      x.fillRect(tx - 1, hor - 34, 3, 14);
      for (let r = 14; r > 0; r -= 3) disc(x, tx, hor - 38, r, `rgba(255,180,90,${(0.03 + (14 - r) * 0.012).toFixed(3)})`);
      disc(x, tx, hor - 38, 3, '#ffd060');
      disc(x, tx, hor - 39, 1.5, '#fff4c0');
    }
    return;
  }
  // 深い 階: 大地の心の あかね色の 光（まん中の おく）
  for (let r = 70; r > 0; r -= 5) disc(x, 128, hor - 24, r, `rgba(255,110,60,${(0.015 + (70 - r) * 0.0016).toFixed(3)})`);
  disc(x, 128, hor - 24, 8, '#ff9a5a');
  disc(x, 128, hor - 24, 4, '#ffe0b0');
  // 光石の はしら（赤く 光る けっしょう）
  for (const [cx, h, w] of [[30, 44, 10], [62, 30, 7], [196, 34, 8], [226, 50, 11]]) {
    x.fillStyle = '#6a1e14';
    x.beginPath(); x.moveTo(cx - w / 2, hor); x.lineTo(cx, hor - h); x.lineTo(cx + w / 2, hor); x.closePath(); x.fill();
    x.fillStyle = '#e0603a';
    x.beginPath(); x.moveTo(cx - w / 4, hor); x.lineTo(cx, hor - h + 4); x.lineTo(cx + 1, hor); x.closePath(); x.fill();
    disc(x, cx, hor - h + 6, 2, '#ffd0a0');
  }
  // かべの われめ（光が もれる）
  x.strokeStyle = 'rgba(255,140,80,0.7)';
  x.lineWidth = 1;
  for (const [sx, sy] of [[90, 8], [170, 14], [140, 40]]) {
    x.beginPath(); x.moveTo(sx, sy);
    for (let k = 1; k < 6; k++) x.lineTo(sx + (k % 2 ? 4 : -3), sy + k * 5);
    x.stroke();
  }
  // 古い 祭だんの かげ
  x.fillStyle = 'rgba(20,6,4,0.6)';
  x.fillRect(104, hor - 12, 48, 12);
  x.fillRect(112, hor - 18, 32, 6);
}

export function drawEarthBg(x, d, hor) {
  if (d.deco === 'root_isle') drawRootIsle(x, hor);
  else drawTemple(x, hor, d.deco === 'earth_temple_deep');
}

// ゆか: こけと 根の 草地 ／ 根の はいだす 石だたみ ／ あかね色に てらされた 岩の ゆか
export function drawEarthFloorBg(x, d, hor) {
  if (d.deco === 'root_isle') {
    for (let i = 0; i < 80; i++) {
      const px = Math.round(rnd(i, 3.3) * BW), py = hor + 4 + Math.round(rnd(i, 4.4) * (BH - hor - 6));
      x.fillStyle = i % 3 ? '#3e6e2a' : '#7ab84a';
      x.fillRect(px, py, 1, 2);
    }
    root(x, [[0, hor + 30], [60, hor + 22], [120, hor + 34], [170, hor + 26]], 3, '#5a3e24');
    root(x, [[256, hor + 12], [210, hor + 18], [180, hor + 14]], 2, '#5a3e24');
    for (let i = 0; i < 10; i++) {
      x.fillStyle = ['#ffffff', '#ffe070', '#f0a0c0'][i % 3];
      x.fillRect(Math.round(rnd(i, 9.2) * BW), hor + 6 + Math.round(rnd(i, 9.9) * (BH - hor - 10)), 1, 1);
    }
    return;
  }
  const deep = d.deco === 'earth_temple_deep';
  // 石だたみの すじ（遠近）
  x.fillStyle = deep ? 'rgba(20,6,4,0.4)' : 'rgba(30,20,10,0.35)';
  for (let i = 0; i < 6; i++) {
    const y = hor + 4 + i * i * 2;
    if (y < BH) x.fillRect(0, y, BW, 1);
  }
  for (let j = -8; j <= 8; j++) {
    for (let y = hor + 4; y < BH; y += 2) x.fillRect(Math.round(BW / 2 + j * 18 * (1 + (y - hor) / 40)), y, 1, 2);
  }
  if (!deep) {
    // 根が はいだす
    root(x, [[0, hor + 14], [40, hor + 20], [70, hor + 34]], 3, '#3a2a18', '#6a5034');
    root(x, [[256, hor + 10], [214, hor + 22], [196, hor + 40]], 3, '#3a2a18', '#6a5034');
    x.fillStyle = 'rgba(90,140,60,0.6)';
    for (let i = 0; i < 20; i++) x.fillRect(Math.round(rnd(i, 4.1) * BW), hor + 4 + Math.round(rnd(i, 5.6) * (BH - hor - 8)), 2, 1);
    return;
  }
  // われめから もれる あかね色の 光
  x.strokeStyle = 'rgba(255,120,60,0.6)';
  x.lineWidth = 1;
  for (const [sx, sy, len] of [[40, hor + 10, 50], [150, hor + 24, 60], [200, hor + 8, 40]]) {
    x.beginPath(); x.moveTo(sx, sy);
    for (let k = 1; k <= 6; k++) x.lineTo(sx + (k * len) / 6, sy + (k % 2 ? 2 : -1));
    x.stroke();
  }
  x.fillStyle = 'rgba(255,140,80,0.14)';
  x.beginPath(); x.ellipse(128, hor + 20, 90, 16, 0, 0, Math.PI * 2); x.fill();
}
