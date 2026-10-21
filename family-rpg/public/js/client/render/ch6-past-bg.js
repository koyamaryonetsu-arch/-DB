// 第2部 第6章 Step 1・2 の 戦いの 背景（battlefx.js の battleBackground から よぶ。BW×BH の まま かく。hor … 地面の たかさ）
// ・past_field（deco 'past_field'）… 千年前の ミドリナ地方: 少し セピアがかった 金色の 空・大きな 古い 木の 森・遠くの ほしみの丘。
//   ゆかは 道の ない 草原（花と 長い 草）
// ・toki_shrine（deco 'toki_shrine'）… 時のほこらとサンドクロック: 砂岩の かべ・砂時計の 形の はしら・天井から 流れ落ちる 砂の すじ・
//   かべの 時計の もよう。ゆかは 砂の 波もよう
// ・toki_ruin（deco 'toki_ruin'）… 時のいせき: 白い 石の はしら（時計の 文字ばんの かざり）・かべに うまった 歯車・木の 根。
//   ゆかは 石の タイルと 歯車の もよう
// ・toki_ruin_boss（deco 'toki_ruin_boss'）… 番人の間とギアドン: おくの かべに 大きな 時計・まわりに 歯車・青い 光の すじ。
//   ゆかは 時計の 文字ばんの ような まるい もよう
const BW = 256, BH = 144;

export const PAST_BG = {
  past_field: { sky: ['#e8c890', '#f0d8a8', '#f4e4c0', '#e8e0c0'], far: '#7a8a5a', near: '#5a7a40', ground: ['#86a050', '#76904a'], deco: 'past_field' },
  toki_shrine: { sky: ['#1a1208', '#2a1e10', '#3e2c16', '#523a1e'], far: '#4a3620', near: '#6a5030', ground: ['#b8945a', '#a8844e'], deco: 'toki_shrine' },
  toki_ruin: { sky: ['#141a22', '#1e2834', '#2a3646', '#384656'], far: '#3a4656', near: '#58687a', ground: ['#7a8494', '#6c7686'], deco: 'toki_ruin' },
  toki_ruin_boss: { sky: ['#0a0e1a', '#121a2e', '#1a2642', '#223256'], far: '#22304a', near: '#3a4a6a', ground: ['#4a5a78', '#404e6c'], deco: 'toki_ruin_boss' },
};
export const PAST_DECOS = new Set(['past_field', 'toki_shrine', 'toki_ruin', 'toki_ruin_boss']);

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
// 時計の 文字ばん（cx, cy … まん中・r … 大きさ・a … 針の 角度）
function clockFace(x, cx, cy, r, face, rim, hand, a = 0) {
  disc(x, cx, cy, r + 2, rim);
  disc(x, cx, cy, r, face);
  for (let i = 0; i < 12; i++) {
    const t = (i * Math.PI) / 6;
    x.fillStyle = rim;
    x.fillRect(Math.round(cx + Math.cos(t) * r * 0.8) - (i % 3 ? 0 : 1), Math.round(cy + Math.sin(t) * r * 0.8) - (i % 3 ? 0 : 1), i % 3 ? 1 : 2, i % 3 ? 1 : 2);
  }
  line(x, [[cx, cy], [cx + Math.cos(a) * r * 0.7, cy + Math.sin(a) * r * 0.7]], hand, Math.max(1, r / 10));
  line(x, [[cx, cy], [cx + Math.cos(a * 3 + 1) * r * 0.45, cy + Math.sin(a * 3 + 1) * r * 0.45]], hand, Math.max(1, r / 8));
}
// 歯車（かべの かざり）
function cog(x, cx, cy, r, n, a, c, hole) {
  x.fillStyle = c;
  x.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const t = a + (i * Math.PI) / n;
    const rr = i % 2 ? r * 0.8 : r;
    const px = cx + Math.cos(t) * rr, py = cy + Math.sin(t) * rr;
    if (i) x.lineTo(px, py);
    else x.moveTo(px, py);
  }
  x.closePath();
  x.fill();
  disc(x, cx, cy, r * 0.35, hole);
}

// ───── 千年前の フィールド ─────
function drawField(x, hor) {
  // 遠くの ほしみの丘
  x.fillStyle = 'rgba(150,140,110,0.5)';
  x.beginPath(); x.ellipse(196, hor - 6, 70, 22, 0, Math.PI, 0); x.fill();
  // 大きな 古い 木（みき・枝・葉の かたまり）
  for (const [tx, s] of [[18, 1.2], [70, 0.8], [118, 0.6], [236, 1.1]]) {
    const h = 54 * s;
    x.fillStyle = '#5a4026';
    x.fillRect(tx - 4 * s, hor - h * 0.55, 8 * s, h * 0.55);
    line(x, [[tx, hor - h * 0.45], [tx - 12 * s, hor - h * 0.7]], '#5a4026', 2 * s);
    line(x, [[tx, hor - h * 0.5], [tx + 12 * s, hor - h * 0.72]], '#5a4026', 2 * s);
    for (let i = 0; i < 7; i++) {
      const ox = (rnd(i + tx, 2.2) - 0.5) * 34 * s, oy = (rnd(i + tx, 3.1) - 0.5) * 18 * s;
      disc(x, tx + ox, hor - h * 0.75 + oy, (10 + rnd(i + tx, 4.4) * 6) * s, i % 2 ? '#4e7a34' : '#6a9a44');
    }
    for (let i = 0; i < 4; i++) disc(x, tx + (rnd(i + tx, 5.5) - 0.5) * 24 * s, hor - h * 0.82 + (rnd(i, 6.6) - 0.5) * 10 * s, 4 * s, '#8ab85a');
    // 木の 根
    line(x, [[tx - 4 * s, hor], [tx - 10 * s, hor + 3]], '#4a3420', 2);
    line(x, [[tx + 4 * s, hor], [tx + 10 * s, hor + 3]], '#4a3420', 2);
  }
  // 森の おくの 光の すじ（セピアの 光）
  for (let i = 0; i < 8; i++) {
    const sx = 30 + rnd(i, 7.7) * 200;
    x.fillStyle = 'rgba(255,240,190,0.12)';
    x.beginPath(); x.moveTo(sx, 0); x.lineTo(sx + 10, 0); x.lineTo(sx + 26, hor); x.lineTo(sx + 14, hor); x.closePath(); x.fill();
  }
  // とぶ 光の つぶ（花粉・こはく色）
  for (let i = 0; i < 26; i++) disc(x, rnd(i, 8.1) * BW, 6 + rnd(i, 9.2) * (hor - 12), 0.8 + rnd(i, 1.3), 'rgba(255,230,150,0.7)');
  // 鳥
  for (const [bx, by] of [[150, 18], [162, 14], [172, 20]]) line(x, [[bx - 3, by], [bx, by + 2], [bx + 3, by]], 'rgba(90,70,40,0.7)', 1);
}

// ───── 時のほこら ─────
function drawShrine(x, hor) {
  // 砂岩の かべ（ブロック）
  for (let row = 0; row * 10 < hor; row++) {
    for (let col = -1; col * 24 < BW; col++) {
      const v = rnd(row * 31 + col, 2.3);
      x.fillStyle = `rgba(${120 + Math.round(v * 30)},${86 + Math.round(v * 22)},${46 + Math.round(v * 16)},0.45)`;
      x.fillRect(col * 24 + (row % 2 ? 12 : 0) + 1, row * 10 + 1, 22, 8);
    }
  }
  // 砂時計の 形の はしら
  for (const cx of [26, 230]) {
    x.fillStyle = '#3a2814';
    x.fillRect(cx - 14, 0, 28, 6);
    x.fillRect(cx - 14, hor - 6, 28, 6);
    x.fillStyle = '#7a5a30';
    x.beginPath(); x.moveTo(cx - 12, 6); x.lineTo(cx + 12, 6); x.lineTo(cx + 3, hor / 2); x.lineTo(cx + 12, hor - 6); x.lineTo(cx - 12, hor - 6); x.lineTo(cx - 3, hor / 2); x.closePath(); x.fill();
    x.fillStyle = '#e8c070';
    x.beginPath(); x.moveTo(cx - 9, hor - 6); x.lineTo(cx + 9, hor - 6); x.lineTo(cx, hor / 2 + 8); x.closePath(); x.fill();
    line(x, [[cx, hor / 2 - 2], [cx, hor - 10]], '#f4dca0', 1);
  }
  // かべの 大きな 時計の もよう（2つ）
  clockFace(x, 92, 28, 14, 'rgba(232,200,130,0.45)', '#5a4020', '#3a2410', -1);
  clockFace(x, 168, 34, 11, 'rgba(232,200,130,0.4)', '#5a4020', '#3a2410', 0.8);
  // 天井から 流れ落ちる 砂の すじ
  for (const sx of [58, 128, 200]) {
    for (let y = 0; y < hor; y += 2) {
      x.fillStyle = `rgba(240,210,140,${(0.4 + (y % 6) * 0.05).toFixed(2)})`;
      x.fillRect(sx + Math.round(Math.sin(y * 0.2) * 1), y, 2, 2);
    }
    x.fillStyle = 'rgba(230,190,110,0.6)';
    x.beginPath(); x.ellipse(sx + 1, hor - 2, 10, 4, 0, Math.PI, 0); x.fill();
  }
  // まう 砂の つぶ
  for (let i = 0; i < 30; i++) {
    x.fillStyle = 'rgba(255,230,170,0.6)';
    x.fillRect(Math.round(rnd(i, 3.3) * BW), Math.round(rnd(i, 4.4) * hor), 1, 1);
  }
}

// ───── 時のいせき（と 番人の間）─────
function drawRuin(x, hor, boss) {
  // 白っぽい 石の かべ
  for (let row = 0; row * 12 < hor; row++) {
    for (let col = -1; col * 26 < BW; col++) {
      const v = rnd(row * 17 + col, 3.1);
      const b = boss ? [40, 56, 90] : [96, 108, 124];
      x.fillStyle = `rgba(${b[0] + Math.round(v * 20)},${b[1] + Math.round(v * 20)},${b[2] + Math.round(v * 24)},0.4)`;
      x.fillRect(col * 26 + (row % 2 ? 13 : 0) + 1, row * 12 + 1, 24, 10);
    }
  }
  if (boss) {
    // おくの 大きな 時計と まわりの 歯車
    cog(x, 70, 30, 18, 10, 0.2, 'rgba(160,120,60,0.7)', '#121a2e');
    cog(x, 186, 26, 14, 8, 0.5, 'rgba(160,120,60,0.7)', '#121a2e');
    cog(x, 200, 54, 9, 8, 0.1, 'rgba(120,90,50,0.7)', '#121a2e');
    clockFace(x, 128, 34, 26, 'rgba(220,230,250,0.55)', '#8a6a30', '#1a2030', -1.2);
    // 青い 光の すじ
    for (let i = 0; i < 6; i++) {
      const sx = 20 + i * 44;
      x.fillStyle = 'rgba(120,200,255,0.1)';
      x.beginPath(); x.moveTo(sx, 0); x.lineTo(sx + 8, 0); x.lineTo(sx + 18, hor); x.lineTo(sx + 10, hor); x.closePath(); x.fill();
    }
    for (let i = 0; i < 24; i++) disc(x, rnd(i, 5.1) * BW, rnd(i, 6.2) * hor, 0.8, 'rgba(160,220,255,0.8)');
  } else {
    // かべに うまった 歯車
    for (const [cx, cy, r] of [[100, 18, 10], [114, 30, 6], [160, 48, 12], [178, 40, 7], [60, 56, 8]]) cog(x, cx, cy, r, 8, cx * 0.1, 'rgba(150,130,90,0.55)', '#1e2834');
    // 木の 根（今の 時代の いせき）
    for (const [sx, dir] of [[0, 1], [256, -1]]) {
      line(x, [[sx, 4], [sx + dir * 20, 18], [sx + dir * 26, 40], [sx + dir * 40, 60]], 'rgba(90,70,50,0.8)', 3);
      line(x, [[sx + dir * 20, 18], [sx + dir * 44, 22], [sx + dir * 58, 34]], 'rgba(90,70,50,0.8)', 2);
    }
    for (let i = 0; i < 10; i++) disc(x, (i % 2 ? 20 : 236) + (rnd(i, 2.7) - 0.5) * 30, 10 + rnd(i, 3.9) * 50, 2 + rnd(i, 1.1) * 2, 'rgba(90,140,70,0.6)');
  }
  // 白い 石の はしら（時計の 文字ばんの かざり）
  for (const cx of boss ? [16, 240] : [16, 88, 168, 240]) {
    x.fillStyle = boss ? '#2a3654' : '#8a94a6';
    x.fillRect(cx - 9, 0, 18, hor);
    x.fillStyle = boss ? '#3a4a70' : '#a8b2c2';
    x.fillRect(cx - 7, 0, 5, hor);
    x.fillStyle = boss ? '#1a2238' : '#5e687a';
    x.fillRect(cx - 11, 0, 22, 4);
    x.fillRect(cx - 11, hor - 4, 22, 4);
    clockFace(x, cx, 24, 6, boss ? '#c8d8f0' : '#e8ecf2', boss ? '#8a6a30' : '#5e687a', '#2a2e3a', cx * 0.05);
  }
}

export function drawPastBg(x, d, hor) {
  if (d.deco === 'past_field') drawField(x, hor);
  else if (d.deco === 'toki_shrine') drawShrine(x, hor);
  else drawRuin(x, hor, d.deco === 'toki_ruin_boss');
}

// ゆか: 草原 ／ 砂の 波もよう ／ 石の タイルと 歯車 ／ 文字ばんの もよう
export function drawPastFloorBg(x, d, hor) {
  if (d.deco === 'past_field') {
    // 長い 草と 花
    for (let i = 0; i < 70; i++) {
      const gx = rnd(i, 1.7) * BW, gy = hor + 2 + rnd(i, 2.9) * (BH - hor - 4);
      line(x, [[gx, gy], [gx + (rnd(i, 4.1) - 0.5) * 4, gy - 3 - rnd(i, 5.3) * 4]], i % 3 ? 'rgba(60,100,40,0.6)' : 'rgba(150,180,80,0.6)', 1);
    }
    for (let i = 0; i < 18; i++) disc(x, rnd(i, 6.7) * BW, hor + 4 + rnd(i, 7.9) * (BH - hor - 8), 1.2, ['#f4e070', '#f0a0c0', '#ffffff'][i % 3]);
    return;
  }
  if (d.deco === 'toki_shrine') {
    // 砂の 波もよう
    for (let i = 0; i < 9; i++) {
      const y = hor + 4 + i * 7;
      if (y >= BH) break;
      const pts = [];
      for (let px = 0; px <= BW; px += 8) pts.push([px, y + Math.sin(px * 0.06 + i) * 1.5]);
      line(x, pts, 'rgba(120,90,40,0.35)', 1);
    }
    for (let i = 0; i < 30; i++) {
      x.fillStyle = 'rgba(255,240,200,0.4)';
      x.fillRect(Math.round(rnd(i, 8.8) * BW), hor + 2 + Math.round(rnd(i, 9.9) * (BH - hor - 4)), 2, 1);
    }
    // 砂の 山
    for (const sx of [58, 128, 200]) {
      x.fillStyle = 'rgba(230,190,110,0.5)';
      x.beginPath(); x.ellipse(sx + 1, hor + 3, 14, 4, 0, 0, Math.PI * 2); x.fill();
    }
    return;
  }
  const boss = d.deco === 'toki_ruin_boss';
  // 石の タイル（遠近）
  x.fillStyle = 'rgba(0,0,0,0.25)';
  for (let i = 0; i < 6; i++) {
    const y = hor + 4 + i * i * 2;
    if (y < BH) x.fillRect(0, y, BW, 1);
  }
  for (let j = -8; j <= 8; j++) for (let y = hor + 4; y < BH; y += 2) x.fillRect(Math.round(BW / 2 + j * 20 * (1 + (y - hor) / 40)), y, 1, 2);
  if (boss) {
    // 文字ばんの ような まるい もよう
    for (let r = 20; r <= 100; r += 20) {
      x.strokeStyle = `rgba(140,200,255,${(0.32 - r * 0.0022).toFixed(2)})`;
      x.lineWidth = 1;
      x.beginPath(); x.ellipse(128, hor + 30, r, r * 0.22, 0, 0, Math.PI * 2); x.stroke();
    }
    for (let i = 0; i < 12; i++) {
      const t = (i * Math.PI) / 6;
      x.fillStyle = 'rgba(200,170,90,0.7)';
      x.fillRect(Math.round(128 + Math.cos(t) * 90), Math.round(hor + 30 + Math.sin(t) * 20), 3, 2);
    }
    return;
  }
  // 歯車の もよう
  for (const [cx, cy, r] of [[60, hor + 30, 10], [196, hor + 22, 8], [128, hor + 48, 12]]) cog(x, cx, cy, r, 8, 0.3, 'rgba(150,130,90,0.35)', 'rgba(60,70,90,0.5)');
  for (let i = 0; i < 20; i++) {
    x.fillStyle = 'rgba(255,255,255,0.12)';
    x.fillRect(Math.round(rnd(i, 4.8) * BW), hor + 4 + Math.round(rnd(i, 5.9) * (BH - hor - 8)), 3, 1);
  }
}
