// 第2部 第6章 Step 3・4 の 戦いの 背景（battlefx.js の battleBackground から よぶ。BW×BH の まま かく。hor … 地面の たかさ）
// ・hoshimichi（deco 'hoshimichi'）… 星めぐりの古道 1〜4階と 星くいのよる鳥: こい 青の 夜空・天の川・星座の 線・
//   遠くの 山（battlefx.js の ふつうの 山なみ）・道の 両わきの 道しるべの 石（てっぺんに 星の 光）。ゆかは 古い 石だたみの 道と 星くず
// ・hoshimichi_deep（deco 'hoshimichi_deep'）… 5〜8階と ペンデュラ: むらさきの 夜空に 時の うず・うかぶ 時計の かけら・
//   ふりこの 形の 星座。ゆかは 文字ばんの ような 光の わと 石だたみ
const BW = 256, BH = 144;

export const ROAD_BG = {
  hoshimichi: { sky: ['#060a1e', '#0c1430', '#141e44', '#1e2a58'], far: '#121a34', near: '#2a3450', ground: ['#4a4e6a', '#3e4260'], deco: 'hoshimichi' },
  hoshimichi_deep: { sky: ['#0a0618', '#140c2a', '#20123e', '#2c1a52'], far: '#160e2a', near: '#2e2248', ground: ['#4a3e66', '#3c3256'], deco: 'hoshimichi_deep' },
};
export const ROAD_DECOS = new Set(['hoshimichi', 'hoshimichi_deep']);

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
// 4つの 光の 星
function twinkle(x, cx, cy, s, c) {
  x.fillStyle = c;
  x.fillRect(Math.round(cx) - s, Math.round(cy), s * 2 + 1, 1);
  x.fillRect(Math.round(cx), Math.round(cy) - s, 1, s * 2 + 1);
}
// 夜空の 星（top … ここより 上だけ）
function stars(x, n, top, seed, cols) {
  for (let i = 0; i < n; i++) {
    const sx = rnd(i, seed) * BW, sy = rnd(i, seed + 1.3) * top;
    x.fillStyle = cols[i % cols.length];
    x.fillRect(Math.round(sx), Math.round(sy), i % 9 ? 1 : 2, i % 9 ? 1 : 2);
  }
}
// 道しるべの 石（cx … まん中・h … 高さ・c … 石の 色・glow … 星の 光）
function guideStone(x, cx, hor, h, c, cl, glow) {
  x.fillStyle = c;
  x.fillRect(cx - 5, hor - h, 10, h);
  x.fillStyle = cl;
  x.fillRect(cx - 4, hor - h, 3, h);
  x.fillStyle = c;
  x.beginPath(); x.moveTo(cx - 6, hor - h); x.lineTo(cx, hor - h - 6); x.lineTo(cx + 6, hor - h); x.closePath(); x.fill();
  disc(x, cx, hor - h - 9, 6, 'rgba(255,240,170,0.18)');
  disc(x, cx, hor - h - 9, 3, 'rgba(255,240,170,0.45)');
  twinkle(x, cx, hor - h - 9, 3, glow);
  // 石に きざんだ 星の しるし
  twinkle(x, cx, hor - h + 10, 2, 'rgba(180,210,255,0.7)');
}

// ───── 星めぐりの古道 ─────
function drawRoad(x, hor) {
  // 天の川（ななめの うすい 光の おび）
  for (let i = 0; i < 160; i++) {
    const t = rnd(i, 2.1);
    const cx = t * BW, cy = 6 + t * 30 + (rnd(i, 3.3) - 0.5) * 14;
    x.fillStyle = `rgba(200,210,255,${(0.08 + rnd(i, 4.4) * 0.2).toFixed(2)})`;
    x.fillRect(Math.round(cx), Math.round(cy), 1, 1);
  }
  stars(x, 60, hor - 30, 1.7, ['#ffffff', '#cfe0ff', '#fff2c0']);
  // 星座（オオカミと ひつじの 形の 線）
  const wolf = [[30, 14], [44, 10], [58, 16], [70, 12], [80, 20], [66, 26], [50, 24]];
  line(x, wolf, 'rgba(150,200,255,0.45)', 1);
  for (const [px, py] of wolf) twinkle(x, px, py, 1, '#ffffff');
  const ram = [[176, 12], [188, 8], [202, 12], [210, 22], [196, 28], [184, 24]];
  line(x, ram, 'rgba(255,220,150,0.45)', 1);
  for (const [px, py] of ram) twinkle(x, px, py, 1, '#fff2c0');
  // 大きな 星
  twinkle(x, 128, 18, 3, '#fff6c0');
  disc(x, 128, 18, 4, 'rgba(255,246,192,0.2)');
  // 道しるべの 石
  guideStone(x, 22, hor, 30, '#5a5e7a', '#7a809e', '#fff6c0');
  guideStone(x, 234, hor, 26, '#5a5e7a', '#7a809e', '#fff6c0');
  guideStone(x, 92, hor, 14, '#4a4e6a', '#6a6e8a', '#cfe0ff');
  guideStone(x, 168, hor, 12, '#4a4e6a', '#6a6e8a', '#cfe0ff');
  // 草と こけ
  for (let i = 0; i < 30; i++) {
    const gx = rnd(i, 5.5) * BW;
    line(x, [[gx, hor], [gx + (rnd(i, 6.6) - 0.5) * 3, hor - 2 - rnd(i, 7.7) * 4]], 'rgba(60,90,90,0.8)', 1);
  }
}

// ───── 星めぐりの古道の おく ─────
function drawDeep(x, hor) {
  stars(x, 50, hor - 30, 2.9, ['#ffffff', '#e0c8ff', '#c8f0ff']);
  // 時の うず（大きな うずまき）
  for (let r = 6; r < 46; r += 5) {
    x.strokeStyle = `rgba(180,140,255,${(0.42 - r * 0.007).toFixed(2)})`;
    x.lineWidth = 1;
    x.beginPath();
    x.arc(128, 28, r, r * 0.12, r * 0.12 + Math.PI * 1.3);
    x.stroke();
  }
  disc(x, 128, 28, 5, 'rgba(200,240,255,0.35)');
  disc(x, 128, 28, 2, 'rgba(255,255,255,0.8)');
  // うかぶ 時計の かけら
  for (const [cx, cy, r, a] of [[40, 22, 9, 0.4], [214, 18, 7, 2.1], [74, 48, 5, 1.2], [188, 46, 6, 3]]) {
    x.fillStyle = 'rgba(220,226,244,0.55)';
    x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, r, a, a + Math.PI * 1.4); x.closePath(); x.fill();
    line(x, [[cx, cy], [cx + Math.cos(a + 0.6) * r * 0.8, cy + Math.sin(a + 0.6) * r * 0.8]], 'rgba(40,30,70,0.9)', 1);
    x.fillStyle = 'rgba(216,176,64,0.8)';
    x.fillRect(Math.round(cx) - 1, Math.round(cy) - 1, 2, 2);
  }
  // ふりこの 形の 星座
  const pend = [[150, 4], [150, 10], [158, 22], [164, 32]];
  line(x, pend.slice(0, 3), 'rgba(255,220,140,0.5)', 1);
  line(x, [[158, 22], [164, 32]], 'rgba(255,220,140,0.5)', 1);
  for (const [px, py] of pend) twinkle(x, px, py, 1, '#fff2c0');
  disc(x, 166, 36, 4, 'rgba(255,220,140,0.35)');
  // 道しるべの 石（こわれかけ）
  guideStone(x, 20, hor, 24, '#4e4268', '#6e6290', '#e0c8ff');
  guideStone(x, 236, hor, 28, '#4e4268', '#6e6290', '#e0c8ff');
  // 時の すじ（ななめの 光）
  for (let i = 0; i < 5; i++) {
    const sx = 30 + i * 50;
    x.fillStyle = 'rgba(160,120,255,0.08)';
    x.beginPath(); x.moveTo(sx, 0); x.lineTo(sx + 6, 0); x.lineTo(sx + 20, hor); x.lineTo(sx + 14, hor); x.closePath(); x.fill();
  }
}

export function drawRoadBg(x, d, hor) {
  if (d.deco === 'hoshimichi') drawRoad(x, hor);
  else drawDeep(x, hor);
}

// ゆか: 古い 石だたみの 道（遠近）と 星くず ／ 文字ばんの ような 光の わ
export function drawRoadFloorBg(x, d, hor) {
  const deep = d.deco === 'hoshimichi_deep';
  // 石だたみ（横の めじ）
  x.fillStyle = 'rgba(0,0,0,0.25)';
  for (let i = 0; i < 7; i++) {
    const y = hor + 4 + i * i * 2;
    if (y < BH) x.fillRect(0, y, BW, 1);
  }
  // たての めじ（遠近）
  for (let j = -7; j <= 7; j++) for (let y = hor + 4; y < BH; y += 2) x.fillRect(Math.round(BW / 2 + (j + (Math.floor((y - hor) / 6) % 2) * 0.5) * 22 * (1 + (y - hor) / 40)), y, 1, 2);
  // 道の ふち（まん中の 道を 少し 明るく）
  x.fillStyle = deep ? 'rgba(170,140,230,0.08)' : 'rgba(180,200,255,0.08)';
  x.beginPath(); x.moveTo(BW / 2 - 30, hor); x.lineTo(BW / 2 + 30, hor); x.lineTo(BW / 2 + 110, BH); x.lineTo(BW / 2 - 110, BH); x.closePath(); x.fill();
  if (deep) {
    // 文字ばんの ような 光の わ
    for (let r = 20; r <= 100; r += 20) {
      x.strokeStyle = `rgba(190,150,255,${(0.3 - r * 0.002).toFixed(2)})`;
      x.lineWidth = 1;
      x.beginPath(); x.ellipse(128, hor + 32, r, r * 0.22, 0, 0, Math.PI * 2); x.stroke();
    }
    for (let i = 0; i < 12; i++) {
      const t = (i * Math.PI) / 6;
      x.fillStyle = 'rgba(216,176,64,0.75)';
      x.fillRect(Math.round(128 + Math.cos(t) * 90), Math.round(hor + 32 + Math.sin(t) * 20), 3, 2);
    }
  }
  // 星くず
  for (let i = 0; i < 40; i++) {
    const sx = rnd(i, 8.1) * BW, sy = hor + 3 + rnd(i, 9.2) * (BH - hor - 5);
    x.fillStyle = i % 3 ? 'rgba(255,246,192,0.55)' : deep ? 'rgba(220,190,255,0.6)' : 'rgba(180,220,255,0.6)';
    x.fillRect(Math.round(sx), Math.round(sy), 1, 1);
  }
  for (let i = 0; i < 6; i++) twinkle(x, rnd(i, 10.3) * BW, hor + 8 + rnd(i, 11.4) * (BH - hor - 14), 1, 'rgba(255,246,192,0.8)');
}
