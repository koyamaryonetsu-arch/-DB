// 第2部 第6章 Step 5 の 戦いの 背景（battlefx.js の battleBackground から よぶ。BW×BH の まま かく。hor … 地面の たかさ）
// ・tokei（deco 'tokei'）… 止まった時計塔 1〜5階と カリヨン: 灰色に 止まった 石の かべ・おくに 12時で 止まった 大きな 文字ばん・
//   かべの 大きな 歯車・天井から さがる 止まった ふりこと かね・まどからの 光の すじ（光の 中の ちりも 止まっている）。
//   ゆかは 板と 鉄の わくの 歯車もよう
const BW = 256, BH = 144;

export const TOKEI_BG = {
  tokei: { sky: ['#2a2630', '#34303a', '#3e3a44', '#48444c'], far: '#3a363e', near: '#4a4448', ground: ['#5a4a3a', '#4a3c30'], deco: 'tokei' },
};
export const TOKEI_DECOS = new Set(['tokei']);

// 0〜1 の まいかい おなじ ちらばり（背景は 1回だけ かく）
const rnd = (i, s = 1) => {
  const v = Math.sin(i * 127.1 * s + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const disc = (x, cx, cy, r, c) => { x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); };
const ring = (x, cx, cy, r, c, w = 1) => { x.strokeStyle = c; x.lineWidth = w; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke(); };
const line = (x, pts, c, w = 1) => {
  x.strokeStyle = c;
  x.lineWidth = w;
  x.beginPath();
  pts.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py)));
  x.stroke();
};
// 歯車（cx・cy … まん中・r … 大きさ・n … 歯の 数・a … 回り）
function gear(x, cx, cy, r, n, a, c, cl, hole) {
  x.fillStyle = c;
  for (let i = 0; i < n; i++) {
    const t = a + (i / n) * Math.PI * 2;
    const s = (Math.PI / n) * 0.5;
    x.beginPath();
    x.moveTo(cx + Math.cos(t - s) * r * 0.85, cy + Math.sin(t - s) * r * 0.85);
    x.lineTo(cx + Math.cos(t - s * 0.6) * r * 1.12, cy + Math.sin(t - s * 0.6) * r * 1.12);
    x.lineTo(cx + Math.cos(t + s * 0.6) * r * 1.12, cy + Math.sin(t + s * 0.6) * r * 1.12);
    x.lineTo(cx + Math.cos(t + s) * r * 0.85, cy + Math.sin(t + s) * r * 0.85);
    x.closePath();
    x.fill();
  }
  disc(x, cx, cy, r * 0.9, c);
  ring(x, cx, cy, r * 0.62, cl, 1);
  for (let i = 0; i < 4; i++) {
    const t = a + (i / 4) * Math.PI * 2;
    line(x, [[cx, cy], [cx + Math.cos(t) * r * 0.62, cy + Math.sin(t) * r * 0.62]], cl, 1);
  }
  disc(x, cx, cy, r * 0.2, hole);
}

// ───── 止まった時計塔 ─────
function drawTokei(x, hor) {
  // 石の かべ（れんがの めじ）
  x.fillStyle = 'rgba(0,0,0,0.18)';
  for (let y = 4; y < hor; y += 8) {
    x.fillRect(0, y, BW, 1);
    for (let k = (y / 8) % 2 ? 0 : 12; k < BW; k += 24) x.fillRect(k, y - 7, 1, 7);
  }
  // まどからの 光の すじ（ななめ。止まった ちり）
  for (const [sx, w] of [[34, 10], [206, 12]]) {
    x.fillStyle = 'rgba(255,236,190,0.08)';
    x.beginPath(); x.moveTo(sx, 0); x.lineTo(sx + w, 0); x.lineTo(sx + w + 26, hor); x.lineTo(sx + 26, hor); x.closePath(); x.fill();
    for (let i = 0; i < 12; i++) {
      const t = rnd(i, sx * 0.01 + 1.1);
      x.fillStyle = 'rgba(255,240,200,0.55)';
      x.fillRect(Math.round(sx + t * 26 + rnd(i, 2.2) * w), Math.round(t * hor), 1, 1);
    }
    // まど
    x.fillStyle = '#1a1820';
    x.fillRect(sx - 2, 2, w + 4, 14);
    x.fillStyle = 'rgba(220,210,180,0.5)';
    x.fillRect(sx, 4, w, 10);
    x.fillStyle = '#1a1820';
    x.fillRect(sx + w / 2 - 0.5, 4, 1, 10);
  }
  // おくの 大きな 文字ばん（12時で 止まっている）
  const cx = 128, cy = 34, r = 30;
  disc(x, cx, cy, r + 4, '#5a4a32');
  disc(x, cx, cy, r + 1, '#8a7650');
  disc(x, cx, cy, r, '#d8d0b8');
  ring(x, cx, cy, r - 4, 'rgba(90,74,50,0.6)', 1);
  for (let i = 0; i < 12; i++) {
    const t = (i / 12) * Math.PI * 2 - Math.PI / 2;
    x.fillStyle = i % 3 ? '#6a5a40' : '#3a2e20';
    const s = i % 3 ? 2 : 3;
    x.fillRect(Math.round(cx + Math.cos(t) * (r - 7)) - 1, Math.round(cy + Math.sin(t) * (r - 7)) - 1, s, s);
  }
  // はり（長い はりも 短い はりも 12）
  line(x, [[cx, cy], [cx, cy - r + 9]], '#2a2018', 2);
  line(x, [[cx, cy], [cx, cy - r + 15]], '#2a2018', 3);
  disc(x, cx, cy, 2.5, '#c8a040');
  // 文字ばんの ひび
  line(x, [[cx + 10, cy - 20], [cx + 14, cy - 12], [cx + 12, cy - 6], [cx + 18, cy + 2]], 'rgba(60,50,40,0.7)', 1);
  // かべの 大きな 歯車（止まっている）
  gear(x, 30, 54, 18, 12, 0.2, '#5a5048', '#7a7068', '#2a2630');
  gear(x, 58, 30, 11, 9, 0.5, '#6a5a3e', '#8a7a5a', '#2a2630');
  gear(x, 226, 50, 20, 14, 0.1, '#5a5048', '#7a7068', '#2a2630');
  gear(x, 196, 26, 10, 8, 0.7, '#6a5a3e', '#8a7a5a', '#2a2630');
  // 天井から さがる ふりこ（止まって、ななめの まま）と かね
  for (const [px, len, a] of [[88, 40, 0.18], [168, 44, -0.22]]) {
    const ex = px + Math.sin(a) * len, ey = Math.cos(a) * len;
    line(x, [[px, 0], [ex, ey]], '#8a7a5a', 1.5);
    disc(x, ex, ey, 6, '#b8963a');
    disc(x, ex - 1.5, ey - 1.5, 2.5, '#f0d080');
  }
  for (const bx of [70, 186]) {
    line(x, [[bx, 0], [bx, 8]], '#4a4048', 1);
    x.fillStyle = '#c8a040';
    x.beginPath(); x.moveTo(bx - 4, 9); x.lineTo(bx + 4, 9); x.lineTo(bx + 6, 17); x.lineTo(bx - 6, 17); x.closePath(); x.fill();
    disc(x, bx, 18, 1.5, '#5a4a32');
  }
  // かべの 柱
  for (const px of [8, 248]) {
    x.fillStyle = '#3a363e';
    x.fillRect(px - 6, 0, 12, hor);
    x.fillStyle = 'rgba(255,255,255,0.06)';
    x.fillRect(px - 5, 0, 3, hor);
  }
  // 止まった 時の 灰色の もや
  for (let i = 0; i < 16; i++) {
    disc(x, rnd(i, 3.3) * BW, hor - 3 - rnd(i, 4.4) * 14, 5 + rnd(i, 5.5) * 6, 'rgba(200,200,210,0.04)');
  }
}

export function drawTokeiBg(x, d, hor) {
  drawTokei(x, hor);
}

// ゆか: 古い 板（遠近）と 鉄の わくの 歯車もよう
export function drawTokeiFloorBg(x, d, hor) {
  // 板の めじ（横）
  x.fillStyle = 'rgba(0,0,0,0.25)';
  for (let i = 0; i < 8; i++) {
    const y = hor + 3 + i * i * 2;
    if (y < BH) x.fillRect(0, y, BW, 1);
  }
  // たての めじ（遠近）
  for (let j = -8; j <= 8; j++) for (let y = hor + 3; y < BH; y += 2) x.fillRect(Math.round(BW / 2 + (j + (Math.floor((y - hor) / 7) % 2) * 0.5) * 20 * (1 + (y - hor) / 40)), y, 1, 2);
  // まん中の 鉄の わく（歯車の 形）
  for (let r = 24; r <= 96; r += 24) {
    x.strokeStyle = `rgba(150,140,120,${(0.4 - r * 0.002).toFixed(2)})`;
    x.lineWidth = 1;
    x.beginPath(); x.ellipse(128, hor + 30, r, r * 0.22, 0, 0, Math.PI * 2); x.stroke();
  }
  for (let i = 0; i < 16; i++) {
    const t = (i * Math.PI) / 8;
    x.fillStyle = 'rgba(200,160,64,0.7)';
    x.fillRect(Math.round(128 + Math.cos(t) * 96) - 1, Math.round(hor + 30 + Math.sin(t) * 21), 3, 2);
  }
  // ボルト・ちり
  for (let i = 0; i < 30; i++) {
    const sx = rnd(i, 8.1) * BW, sy = hor + 3 + rnd(i, 9.2) * (BH - hor - 5);
    x.fillStyle = i % 3 ? 'rgba(220,210,190,0.35)' : 'rgba(120,110,100,0.7)';
    x.fillRect(Math.round(sx), Math.round(sy), 1, 1);
  }
  // ゆかに おちた 歯車
  for (const [gx, gy, r] of [[40, hor + 40, 5], [214, hor + 46, 6], [182, hor + 20, 3]]) {
    disc(x, gx, gy, r, 'rgba(120,100,70,0.8)');
    disc(x, gx, gy, r * 0.35, 'rgba(40,34,30,0.9)');
  }
}
