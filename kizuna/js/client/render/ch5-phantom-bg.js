// 第5章 Step 8「影の城」の 戦いの 背景（battlefx.js の drawBg から よぶ。BW×BH の まま かく。hor … 地面の たかさ）
// ・castle_wind（deco 'castle_wind'）… 1〜4階「風の階」とストルムのまぼろし: 黒い 石の 広間・高い まどの 外の むらさきの 空と 回る 風車・
//   ちぎれそうに なびく 旗・風の すじ。ゆかは 黒い 石だたみに うずまく 風の もよう
// ・castle_fire（deco 'castle_fire'）… 5〜8階「炎の階」とイグニアのまぼろし: 黒い かべ・むらさきと 赤の 炎の はしら・火ばち。
//   ゆかは 黒曜石の ような 床（われめから 炎の 光）。火の粉が とぶ（embers）
// ・castle_water（deco 'castle_water'）… 9〜12階「水の階」とモルガナのまぼろし: あい色の アーチ・天井から たれる しずく・かべを つたう 水。
//   ゆかは 水が はった 床（はもんと、うつりこみ）
const BW = 256, BH = 144;

export const PHANTOM_BG = {
  castle_wind: { sky: ['#0e0c1a', '#1a1630', '#2a2446', '#3a325a'], far: '#1e1a30', near: '#2a2640', ground: ['#2e2a40', '#24203a'], deco: 'castle_wind' },
  castle_fire: { sky: ['#0e0608', '#1e0a10', '#320e18', '#4a1420'], far: '#1e0a0e', near: '#30101a', ground: ['#2a1014', '#200a10'], deco: 'castle_fire', embers: true },
  castle_water: { sky: ['#060c1a', '#0c1830', '#14264a', '#1e3460'], far: '#0e1a30', near: '#16284a', ground: ['#1a3050', '#142640'], deco: 'castle_water' },
};
export const PHANTOM_DECOS = new Set(['castle_wind', 'castle_fire', 'castle_water']);

// 0〜1 の まいかい おなじ ちらばり（背景は 1回だけ かく）
const rnd = (i, s = 1) => {
  const v = Math.sin(i * 127.1 * s + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const disc = (x, cx, cy, r, c) => { x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); };
const line = (x, pts, c, w = 1) => {
  x.strokeStyle = c;
  x.lineWidth = w;
  x.beginPath();
  pts.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py)));
  x.stroke();
};

// 黒い 石の かべ（ブロック）。c … [r, g, b] の もとの 色
function wall(x, hor, c, a = 0.4) {
  for (let row = 0; row * 10 < hor; row++) {
    for (let col = -1; col * 22 < BW; col++) {
      const bx = col * 22 + (row % 2 ? 11 : 0), by = row * 10;
      const v = rnd(row * 31 + col, 2.3);
      x.fillStyle = `rgba(${c[0] + Math.round(v * 24)},${c[1] + Math.round(v * 20)},${c[2] + Math.round(v * 26)},${a})`;
      x.fillRect(bx + 1, by + 1, 20, 8);
    }
  }
}
// 高い まど（アーチ）。sky … まどの 中の 色
function window_(x, cx, top, w, h, sky, frame) {
  x.fillStyle = frame;
  x.fillRect(cx - w / 2 - 2, top + w / 2 - 2, w + 4, h - w / 2 + 2);
  disc(x, cx, top + w / 2, w / 2 + 2, frame);
  x.fillStyle = sky;
  x.fillRect(cx - w / 2, top + w / 2, w, h - w / 2);
  disc(x, cx, top + w / 2, w / 2, sky);
}

// ───── 風の階 ─────
function drawWind(x, hor) {
  wall(x, hor, [40, 34, 66]);
  // 高い まど（外は むらさきの 空と 風車）
  for (const [cx, k] of [[44, 0], [128, 1], [212, 2]]) {
    window_(x, cx, 8, 30, hor - 22, '#4a3a78', '#141022');
    // 外の 雲
    for (let i = 0; i < 4; i++) disc(x, cx - 10 + i * 7, 34 + (i % 2) * 4, 5, 'rgba(150,130,200,0.5)');
    // 風車（まどの 外。はね 4まい）
    const wx = cx + (k - 1) * 4, wy = 40;
    x.fillStyle = '#1a1428';
    x.fillRect(wx - 2, wy, 4, hor - 22 - wy + 4);
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + k * 0.5;
      line(x, [[wx, wy], [wx + Math.cos(a) * 11, wy + Math.sin(a) * 11]], '#2a2040', 2);
      x.fillStyle = 'rgba(200,190,230,0.55)';
      x.beginPath();
      x.moveTo(wx + Math.cos(a) * 4, wy + Math.sin(a) * 4);
      x.lineTo(wx + Math.cos(a) * 11, wy + Math.sin(a) * 11);
      x.lineTo(wx + Math.cos(a + 0.35) * 10, wy + Math.sin(a + 0.35) * 10);
      x.closePath();
      x.fill();
    }
    disc(x, wx, wy, 1.5, '#c8b8f0');
  }
  // なびく 旗（まどの 間）
  for (const [fx, c] of [[86, '#5a2a6a'], [170, '#2a4a6a']]) {
    x.fillStyle = '#141022';
    x.fillRect(fx - 1, 6, 2, 6);
    for (let y = 12; y < 52; y += 2) {
      const sw = Math.round(Math.sin(y * 0.25) * 3);
      x.fillStyle = c;
      x.fillRect(fx - 7 + sw, y, 14, 2);
    }
    x.fillStyle = '#c8a040';
    x.fillRect(fx - 3, 24, 6, 6);
  }
  // 風の すじ（ななめに 何本も）
  for (let i = 0; i < 22; i++) {
    const sx = rnd(i, 4.4) * BW, sy = 10 + rnd(i, 5.5) * (hor - 20), len = 14 + rnd(i, 6.6) * 30;
    line(x, [[sx, sy], [sx + len * 0.5, sy - 3], [sx + len, sy + 1]], `rgba(190,200,240,${(0.18 + rnd(i, 7.1) * 0.25).toFixed(2)})`, 1);
  }
  // つむじ風（はしの うず）
  for (const cx of [20, 236]) for (let r = 4; r < 22; r += 4) {
    x.strokeStyle = `rgba(170,180,230,${(0.35 - r * 0.012).toFixed(2)})`;
    x.beginPath(); x.ellipse(cx, hor - 14 - r * 0.6, r, r * 0.35, 0, 0, Math.PI * 2); x.stroke();
  }
}

// ───── 炎の階 ─────
function drawFire(x, hor) {
  wall(x, hor, [46, 14, 22], 0.45);
  // 炎の はしら（むらさきと 赤）
  for (const [cx, w, purple] of [[22, 14, true], [70, 10, false], [186, 10, false], [234, 14, true]]) {
    x.fillStyle = '#120608';
    x.fillRect(cx - w / 2 - 2, 0, w + 4, hor);
    for (let y = 0; y < hor; y += 3) {
      const sw = Math.round(Math.sin(y * 0.3 + cx) * 2);
      const t = y / hor;
      x.fillStyle = purple ? `rgba(${150 + Math.round(t * 60)},${40 + Math.round(t * 30)},${200 - Math.round(t * 60)},0.75)` : `rgba(${230},${70 + Math.round(t * 90)},${40},0.75)`;
      x.fillRect(cx - w / 2 + sw, y, w, 3);
    }
    for (let r = 18; r > 0; r -= 3) disc(x, cx, hor - 10, r, purple ? `rgba(190,90,255,${(0.02 + (18 - r) * 0.01).toFixed(3)})` : `rgba(255,120,60,${(0.02 + (18 - r) * 0.01).toFixed(3)})`);
  }
  // おくの 火ばち
  for (const tx of [108, 148]) {
    x.fillStyle = '#2a1414';
    x.fillRect(tx - 6, hor - 18, 12, 4);
    x.fillRect(tx - 2, hor - 14, 4, 14);
    for (let i = 0; i < 5; i++) {
      x.fillStyle = ['#ff5a2a', '#ffb040', '#ffe070', '#c040ff', '#ff8a3a'][i];
      x.beginPath(); x.moveTo(tx - 5 + i * 2, hor - 18); x.lineTo(tx - 4 + i * 2 + (i % 2 ? 1 : -1), hor - 28 - (i % 3) * 3); x.lineTo(tx - 3 + i * 2, hor - 18); x.closePath(); x.fill();
    }
  }
  // かべの われめから もれる 赤い 光
  for (const [sx, sy] of [[96, 10], [160, 20], [128, 44]]) {
    const pts = [[sx, sy]];
    for (let k = 1; k < 6; k++) pts.push([sx + (k % 2 ? 4 : -3), sy + k * 5]);
    line(x, pts, 'rgba(255,90,60,0.65)', 1);
  }
  // 黒い 炎の もや
  for (let i = 0; i < 14; i++) disc(x, rnd(i, 3.7) * BW, hor - 4 - rnd(i, 8.2) * 12, 4 + rnd(i, 2.2) * 6, 'rgba(60,10,40,0.35)');
}

// ───── 水の階 ─────
function drawWater(x, hor) {
  wall(x, hor, [16, 30, 60], 0.45);
  // アーチ（おくに 3つ）
  for (const cx of [48, 128, 208]) {
    x.fillStyle = '#0a1426';
    x.fillRect(cx - 34, 30, 6, hor - 30);
    x.fillRect(cx + 28, 30, 6, hor - 30);
    x.strokeStyle = '#2a4a7a';
    x.lineWidth = 3;
    x.beginPath(); x.arc(cx, 32, 31, Math.PI, 0); x.stroke();
    x.fillStyle = 'rgba(40,90,150,0.35)';
    x.fillRect(cx - 28, 32, 56, hor - 32);
  }
  // かべを つたう 水
  for (const sx of [14, 90, 166, 242]) {
    for (let y = 0; y < hor; y += 2) {
      x.fillStyle = `rgba(120,200,255,${(0.25 + (y % 6) * 0.03).toFixed(2)})`;
      x.fillRect(sx + Math.round(Math.sin(y * 0.25) * 1.5), y, 1, 2);
    }
  }
  // 天井から たれる しずく
  for (let i = 0; i < 24; i++) {
    const dx = Math.round(rnd(i, 2.9) * BW), dl = 2 + Math.round(rnd(i, 3.3) * 8);
    x.fillStyle = 'rgba(150,210,255,0.6)';
    x.fillRect(dx, 0, 1, dl);
    disc(x, dx + 0.5, dl + 1, 1, 'rgba(200,240,255,0.8)');
  }
  // 水の 光の もよう
  for (let i = 0; i < 18; i++) {
    x.strokeStyle = 'rgba(140,210,255,0.18)';
    x.lineWidth = 1;
    x.beginPath(); x.ellipse(rnd(i, 6.1) * BW, 10 + rnd(i, 7.3) * (hor - 20), 6 + rnd(i, 1.7) * 8, 2, 0, 0, Math.PI * 2); x.stroke();
  }
}

export function drawPhantomBg(x, d, hor) {
  if (d.deco === 'castle_wind') drawWind(x, hor);
  else if (d.deco === 'castle_fire') drawFire(x, hor);
  else drawWater(x, hor);
}

// ゆか: うずまく 風の 石だたみ ／ 炎の われめの 黒い 床 ／ 水の はった 床
export function drawPhantomFloorBg(x, d, hor) {
  // 石だたみの すじ（遠近）
  x.fillStyle = 'rgba(0,0,0,0.3)';
  for (let i = 0; i < 6; i++) {
    const y = hor + 4 + i * i * 2;
    if (y < BH) x.fillRect(0, y, BW, 1);
  }
  for (let j = -8; j <= 8; j++) for (let y = hor + 4; y < BH; y += 2) x.fillRect(Math.round(BW / 2 + j * 18 * (1 + (y - hor) / 40)), y, 1, 2);
  if (d.deco === 'castle_wind') {
    // うずまく 風の もよう
    for (const [cx, cy] of [[60, hor + 30], [190, hor + 24], [128, hor + 46]]) {
      for (let r = 6; r < 30; r += 6) {
        x.strokeStyle = `rgba(170,170,230,${(0.32 - r * 0.008).toFixed(2)})`;
        x.lineWidth = 1;
        x.beginPath(); x.ellipse(cx, cy, r, r * 0.3, 0, 0.3, Math.PI * 1.7); x.stroke();
      }
    }
    for (let i = 0; i < 16; i++) line(x, [[rnd(i, 2.1) * BW, hor + 6 + rnd(i, 3.4) * 50], [rnd(i, 2.1) * BW + 12, hor + 5 + rnd(i, 3.4) * 50]], 'rgba(200,210,250,0.25)', 1);
    return;
  }
  if (d.deco === 'castle_fire') {
    // 黒曜石の つや・われめの 炎の 光
    for (const [sx, sy, len] of [[30, hor + 12, 60], [140, hor + 26, 70], [200, hor + 8, 40], [80, hor + 42, 50]]) {
      const pts = [[sx, sy]];
      for (let k = 1; k <= 6; k++) pts.push([sx + (k * len) / 6, sy + (k % 2 ? 2 : -1)]);
      line(x, pts, 'rgba(255,90,50,0.65)', 1);
    }
    x.fillStyle = 'rgba(200,60,255,0.12)';
    x.beginPath(); x.ellipse(128, hor + 22, 96, 16, 0, 0, Math.PI * 2); x.fill();
    for (let i = 0; i < 20; i++) {
      x.fillStyle = 'rgba(255,255,255,0.12)';
      x.fillRect(Math.round(rnd(i, 4.8) * BW), hor + 4 + Math.round(rnd(i, 5.9) * (BH - hor - 8)), 3, 1);
    }
    return;
  }
  // 水の はった 床: はもん・アーチの うつりこみ・光
  x.fillStyle = 'rgba(80,160,230,0.22)';
  x.fillRect(0, hor, BW, BH - hor);
  for (const cx of [48, 128, 208]) {
    x.fillStyle = 'rgba(10,20,40,0.35)';
    x.fillRect(cx - 34, hor + 2, 6, 14);
    x.fillRect(cx + 28, hor + 2, 6, 14);
  }
  for (let i = 0; i < 16; i++) {
    x.strokeStyle = `rgba(170,230,255,${(0.2 + rnd(i, 1.9) * 0.25).toFixed(2)})`;
    x.lineWidth = 1;
    x.beginPath(); x.ellipse(rnd(i, 8.3) * BW, hor + 8 + rnd(i, 9.1) * (BH - hor - 12), 8 + rnd(i, 3.9) * 14, 2 + rnd(i, 4.2) * 2, 0, 0, Math.PI * 2); x.stroke();
  }
  for (let i = 0; i < 24; i++) {
    x.fillStyle = 'rgba(220,245,255,0.5)';
    x.fillRect(Math.round(rnd(i, 6.6) * BW), hor + 4 + Math.round(rnd(i, 7.7) * (BH - hor - 8)), 2, 1);
  }
}
