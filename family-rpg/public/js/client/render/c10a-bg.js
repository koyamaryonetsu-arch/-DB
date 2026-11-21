// 第3部 第2章 第1幕「赤と緑」の 戦いの 背景（c9b-bg.js の drawC9bBg から よぶ。BW×BH の まま かく。hor … 地面の たかさ）
// ・c10r_road（deco 'c10r_road'）… 炎の山の 下の 古い 道: 昔の 人が 作った 石の 道と 石の アーチ・下の 方で 赤く 光る ようがん（ふつうの 戦い）
// ・c10r_heat（deco 'c10r_heat'）… 熱の 間: 赤い 光の 玉（星の音）・ゆらゆら 上がる 熱気・ほりかけの 岩の かべ（タマゴンの 戦い）
// ・c10g_roots（deco 'c10g_roots'）… 大地の下の 根の国: 天じょうから たれ下がる 大きな 根・大きな 葉・光る ほうし（明るい。ふつうの 戦い）
// ・c10g_tree（deco 'c10g_tree'）… 大木の 前: カビで 弱った 大きな 木の みき・うろ・カビの もよう（モルドの 戦い）
const BW = 256, BH = 144;

export const C10A_BG = {
  c10r_road: { sky: ['#1a0c0a', '#2a1210', '#3a1a14', '#4a2216'], far: '#2e1612', near: '#24100c', ground: ['#5a4a40', '#4a3c34'], deco: 'c10r_road' },
  c10r_heat: { sky: ['#2a0c08', '#40140c', '#5a1e10', '#742a14'], far: '#3e160e', near: '#2e100a', ground: ['#6a3a26', '#5a3020'], deco: 'c10r_heat' },
  c10g_roots: { sky: ['#123a2e', '#1a4a38', '#245a42', '#2e6a4c'], far: '#1e4a36', near: '#163a2a', ground: ['#4a5a32', '#3e4e2a'], deco: 'c10g_roots' },
  c10g_tree: { sky: ['#14302a', '#1c3e34', '#24483c', '#2e5444'], far: '#1c3a2e', near: '#142c22', ground: ['#4a4a30', '#3e3e28'], deco: 'c10g_tree' },
};
export const C10A_DECOS = new Set(Object.keys(C10A_BG));

const rnd = (i, s = 1) => {
  const v = Math.sin(i * 127.1 * s + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const disc = (x, cx, cy, r, c) => { x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); };

// 古い 道: 石の アーチ・石の かべ・下で 光る ようがん
function drawRoad(x, hor) {
  // ようがんの 光（下の 方）
  const gr = x.createLinearGradient ? x.createLinearGradient(0, hor - 30, 0, hor) : null;
  if (gr?.addColorStop) {
    gr.addColorStop(0, 'rgba(255,90,30,0)');
    gr.addColorStop(1, 'rgba(255,110,40,0.45)');
    x.fillStyle = gr;
    x.fillRect(0, hor - 30, BW, 30);
  }
  // 石の かべ（両がわ）
  for (const [x0, w] of [[0, 54], [202, 54]]) {
    x.fillStyle = '#3a2a24';
    x.fillRect(x0, 0, w, hor);
    x.fillStyle = '#4a3830';
    for (let r = 0; r < 8; r++) for (let c = 0; c < 4; c++) x.fillRect(x0 + c * 14 + (r % 2 ? 7 : 0) - 2, r * 13 + 2, 12, 10);
  }
  // 石の アーチ（昔の 人の 道）
  x.fillStyle = '#4e3c32';
  x.beginPath();
  x.moveTo(70, hor);
  x.lineTo(70, 46);
  x.quadraticCurveTo(128, 6, 186, 46);
  x.lineTo(186, hor);
  x.lineTo(172, hor);
  x.lineTo(172, 50);
  x.quadraticCurveTo(128, 22, 84, 50);
  x.lineTo(84, hor);
  x.closePath();
  x.fill();
  x.fillStyle = '#6a5446';
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + (i / 8) * Math.PI;
    x.fillRect(Math.round(128 + Math.cos(a) * 52) - 3, Math.round(40 + Math.sin(a) * 26), 6, 4);
  }
  // おくの ようがんの 川（アーチの むこう）
  x.fillStyle = '#ff6a2a';
  x.fillRect(84, hor - 6, 88, 3);
  x.fillStyle = '#ffd060';
  for (let i = 0; i < 8; i++) x.fillRect(90 + i * 10 + Math.round(rnd(i, 2.1) * 4), hor - 6, 3, 1);
  // かべの たいまつ
  for (const cx of [40, 216]) {
    x.fillStyle = '#5a3a20';
    x.fillRect(cx - 1, 40, 3, 12);
    disc(x, cx, 37, 4, '#ff9a2a');
    disc(x, cx, 36, 2, '#ffe070');
  }
}
function roadFloor(x, hor) {
  // 石だたみ
  x.fillStyle = 'rgba(0,0,0,0.22)';
  for (let y = hor + 6; y < BH; y += 9) x.fillRect(0, y, BW, 1);
  for (let r = 0; r < 6; r++) for (let c = 0; c < 12; c++) x.fillRect(c * 24 + (r % 2 ? 12 : 0), hor + 6 + r * 9, 1, 9);
  // ひびの ようがん
  x.fillStyle = '#ff7a2a';
  for (let i = 0; i < 5; i++) x.fillRect(Math.round(rnd(i, 4.4) * 230), hor + 14 + Math.round(rnd(i, 1.7) * (BH - hor - 20)), 6 + Math.round(rnd(i, 3.3) * 8), 1);
}

// 熱の 間: 赤い 光の 玉・熱気・ほりかけの 岩
function drawHeat(x, hor) {
  // 岩の かべ（ごつごつ）
  x.fillStyle = '#3a1a10';
  x.beginPath();
  x.moveTo(0, hor);
  for (let px = 0; px <= BW; px += 8) x.lineTo(px, 18 + Math.round(rnd(px, 1.3) * 18));
  x.lineTo(BW, hor);
  x.closePath();
  x.fill();
  // ほりかけの あな（ドリルの あと）
  for (const [cx, cy, r] of [[46, 60, 12], [210, 54, 10]]) {
    disc(x, cx, cy, r, '#24100a');
    x.strokeStyle = '#5a2a18';
    x.lineWidth = 1;
    for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(cx, cy, r - i * 3, 0, Math.PI * 2); x.stroke(); }
  }
  // 赤い 光の 玉（星の音）
  x.globalAlpha = 0.3;
  disc(x, 128, 36, 22, '#ff6a4a');
  x.globalAlpha = 0.55;
  disc(x, 128, 36, 12, '#ff9a6a');
  x.globalAlpha = 1;
  disc(x, 128, 36, 6, '#ffe0c8');
  // ゆらゆら 上がる 熱気
  x.strokeStyle = 'rgba(255,170,90,0.35)';
  x.lineWidth = 1;
  for (let i = 0; i < 7; i++) {
    const cx = 20 + i * 36;
    x.beginPath();
    x.moveTo(cx, hor - 2);
    x.quadraticCurveTo(cx + 6, hor - 18, cx, hor - 30);
    x.quadraticCurveTo(cx - 6, hor - 42, cx, hor - 54);
    x.stroke();
  }
  // ようがんの 池（はしっこ）
  x.fillStyle = '#ff5a1a';
  x.fillRect(0, hor - 4, 30, 4);
  x.fillRect(226, hor - 4, 30, 4);
  x.fillStyle = '#ffd060';
  x.fillRect(6, hor - 4, 8, 1);
  x.fillRect(236, hor - 4, 10, 1);
}
function heatFloor(x, hor) {
  x.fillStyle = 'rgba(0,0,0,0.2)';
  for (let y = hor + 8; y < BH; y += 9) x.fillRect(0, y, BW, 1);
  // 岩の かけら
  x.fillStyle = '#4a2416';
  for (let i = 0; i < 16; i++) x.fillRect(Math.round(rnd(i, 3.9) * BW), hor + 4 + Math.round(rnd(i, 6.7) * (BH - hor - 8)), 3, 2);
  x.fillStyle = '#ff8a3a';
  for (let i = 0; i < 6; i++) x.fillRect(Math.round(rnd(i, 8.1) * BW), hor + 6 + Math.round(rnd(i, 2.3) * (BH - hor - 10)), 4, 1);
}

// 根の国: たれ下がる 大きな 根・大きな 葉・光る ほうし
function drawRoots(x, hor) {
  // とおくの 光（明るい みどり）
  x.globalAlpha = 0.25;
  disc(x, 128, hor - 20, 60, '#bfffc8');
  x.globalAlpha = 1;
  // たれ下がる 大きな 根
  for (const [cx, w, len] of [[24, 14, hor - 6], [74, 8, hor - 30], [150, 10, hor - 18], [206, 16, hor - 4], [244, 7, hor - 40]]) {
    x.fillStyle = '#5a442c';
    x.beginPath();
    x.moveTo(cx - w / 2, 0);
    x.quadraticCurveTo(cx - w / 2 + 6, len / 2, cx - 2, len);
    x.lineTo(cx + 2, len);
    x.quadraticCurveTo(cx + w / 2 + 6, len / 2, cx + w / 2, 0);
    x.closePath();
    x.fill();
    x.fillStyle = '#7a5e3e';
    x.fillRect(cx - w / 2 + 2, 0, 2, Math.round(len * 0.8));
  }
  // 大きな 葉
  for (const [cx, cy, s] of [[54, 40, 1], [180, 28, 1.2], [110, 64, 0.8]]) {
    x.fillStyle = '#3a8a3a';
    x.beginPath();
    x.ellipse(cx, cy, 16 * s, 6 * s, -0.3, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = '#6ac86a';
    x.fillRect(cx - 12 * s, cy, 24 * s, 1);
  }
  // 光る ほうし
  for (let i = 0; i < 26; i++) {
    x.globalAlpha = 0.45 + rnd(i, 2.9) * 0.5;
    x.fillStyle = i % 3 ? '#e8ffb0' : '#bff4ff';
    x.fillRect(Math.round(rnd(i, 1.3) * BW), Math.round(rnd(i, 5.1) * (hor - 4)), 1, 1);
  }
  x.globalAlpha = 1;
}
function rootsFloor(x, hor) {
  x.fillStyle = 'rgba(0,0,0,0.16)';
  for (let y = hor + 8; y < BH; y += 9) x.fillRect(0, y, BW, 1);
  // こけと 小さな 草
  x.fillStyle = '#6aa84a';
  for (let i = 0; i < 22; i++) {
    const px = Math.round(rnd(i, 4.3) * BW), py = hor + 4 + Math.round(rnd(i, 2.7) * (BH - hor - 8));
    x.fillRect(px, py, 1, 3);
    x.fillRect(px + 2, py + 1, 1, 2);
  }
  // 地面を はう 根
  x.fillStyle = '#5a442c';
  x.fillRect(0, hor + 12, 90, 3);
  x.fillRect(170, hor + 22, 86, 3);
}

// 大木の 前: カビで 弱った 大きな 木の みき・うろ・カビの もよう
function drawTree(x, hor) {
  // ほうしの ひかり
  for (let i = 0; i < 18; i++) {
    x.globalAlpha = 0.35 + rnd(i, 3.1) * 0.4;
    x.fillStyle = '#c8f0a0';
    x.fillRect(Math.round(rnd(i, 1.7) * BW), Math.round(rnd(i, 6.3) * (hor - 4)), 1, 1);
  }
  x.globalAlpha = 1;
  // 大きな みき（まん中）
  x.fillStyle = '#4a3a2a';
  x.beginPath();
  x.moveTo(70, hor);
  x.quadraticCurveTo(96, hor - 40, 92, 0);
  x.lineTo(164, 0);
  x.quadraticCurveTo(160, hor - 40, 186, hor);
  x.closePath();
  x.fill();
  x.fillStyle = '#5e4a36';
  for (let i = 0; i < 5; i++) x.fillRect(100 + i * 12, 4, 2, hor - 14);
  // うろ
  x.fillStyle = '#1e140c';
  x.beginPath();
  x.ellipse(128, hor - 34, 14, 18, 0, 0, Math.PI * 2);
  x.fill();
  // カビの もよう（みきに ぽつぽつ。うすい 紫と 黄緑）
  for (let i = 0; i < 14; i++) {
    const cx = 96 + Math.round(rnd(i, 2.2) * 64), cy = 6 + Math.round(rnd(i, 4.8) * (hor - 20));
    x.globalAlpha = 0.7;
    disc(x, cx, cy, 2 + Math.round(rnd(i, 7.1) * 3), i % 2 ? '#a8b87a' : '#8a7a9a');
  }
  x.globalAlpha = 1;
  // かれた 葉（左右）
  for (const [cx, cy] of [[30, 30], [226, 22], [48, 60], [212, 58]]) {
    x.fillStyle = '#7a7a4a';
    x.beginPath();
    x.ellipse(cx, cy, 14, 5, 0.4, 0, Math.PI * 2);
    x.fill();
  }
}
function treeFloor(x, hor) {
  x.fillStyle = 'rgba(0,0,0,0.2)';
  for (let y = hor + 8; y < BH; y += 9) x.fillRect(0, y, BW, 1);
  // 大木の 根と カビの しみ
  x.fillStyle = '#4a3a2a';
  x.fillRect(40, hor + 4, 60, 3);
  x.fillRect(156, hor + 10, 70, 3);
  for (let i = 0; i < 8; i++) {
    x.globalAlpha = 0.5;
    disc(x, Math.round(rnd(i, 3.6) * BW), hor + 8 + Math.round(rnd(i, 5.5) * (BH - hor - 14)), 2 + (i % 3), '#8a8a5a');
  }
  x.globalAlpha = 1;
}

export function drawC10aBg(x, d, hor) {
  if (d.deco === 'c10r_heat') drawHeat(x, hor);
  else if (d.deco === 'c10g_roots') drawRoots(x, hor);
  else if (d.deco === 'c10g_tree') drawTree(x, hor);
  else drawRoad(x, hor);
}
export function drawC10aFloorBg(x, d, hor) {
  if (d.deco === 'c10r_heat') heatFloor(x, hor);
  else if (d.deco === 'c10g_roots') rootsFloor(x, hor);
  else if (d.deco === 'c10g_tree') treeFloor(x, hor);
  else roadFloor(x, hor);
}
