// 第3部 第2章 第2幕「青と白」の 戦いの 背景（c9b-bg.js の drawC9bBg から よぶ。BW×BH の まま かく。hor … 地面の たかさ）
// ・c10b_mirror（deco 'c10b_mirror'）… 水鏡の うら: 天じょうに うらがえしの 水鏡が ゆれる・青い 石の 柱・水の 光の すじ（ふつうの 戦い）
// ・c10b_dry（deco 'c10b_dry'）… かれた 間: 水が ぬけた 広間・ひびわれた 床・まん中に 青い 光の 玉・砂の 山（ゲッコーの 戦い）
// ・c10b_ice（deco 'c10b_ice'）… 氷の 下の 道: すきとおった 氷の かべ・つらら・中で ねむる けものの かげ（見はりに 見つかった 時）
// ・c10b_moon（deco 'c10b_moon'）… 月の 間: 氷の 天じょうから さしこむ 月の 光・白い 光の 玉（シロフクロウの 戦い）
const BW = 256, BH = 144;

export const C10B_BG = {
  c10b_mirror: { sky: ['#0a1a3a', '#10284e', '#183662', '#204476'], far: '#14305a', near: '#0e2448', ground: ['#2a4a6a', '#223e5a'], deco: 'c10b_mirror' },
  c10b_dry: { sky: ['#2a2418', '#3a3020', '#4a3c26', '#5a482e'], far: '#3a3020', near: '#2a2418', ground: ['#8a7448', '#7a663e'], deco: 'c10b_dry' },
  c10b_ice: { sky: ['#0a1428', '#102038', '#18304a', '#20405c'], far: '#183050', near: '#102440', ground: ['#5a7a9a', '#4a6a88'], deco: 'c10b_ice' },
  c10b_moon: { sky: ['#06081a', '#0c1030', '#141a46', '#1c245a'], far: '#121a40', near: '#0c1230', ground: ['#7a8aaa', '#6a7a9a'], deco: 'c10b_moon' },
};
export const C10B_DECOS = new Set(Object.keys(C10B_BG));

const rnd = (i, s = 1) => {
  const v = Math.sin(i * 127.1 * s + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const disc = (x, cx, cy, r, c) => { x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); };
const tri = (x, a, b, c, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(...a); x.lineTo(...b); x.lineTo(...c); x.closePath(); x.fill(); };
function glowOrb(x, cx, cy, r, core, rim) {
  const g = x.createRadialGradient ? x.createRadialGradient(cx, cy, 1, cx, cy, r * 2.4) : null;
  if (g?.addColorStop) {
    g.addColorStop(0, rim);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.fillRect(cx - r * 2.4, cy - r * 2.4, r * 4.8, r * 4.8);
  }
  disc(x, cx, cy, r, core);
  disc(x, cx - r * 0.3, cy - r * 0.3, r * 0.35, '#ffffff');
}

// 水鏡の うら: 天じょうの 水鏡・青い 石の 柱・光の すじ
function drawMirror(x, hor) {
  // 天じょうの 水鏡（ゆれる 水面）
  x.fillStyle = '#3a7ac8';
  x.fillRect(0, 0, BW, 22);
  x.fillStyle = '#5a9ae0';
  for (let px = 0; px < BW; px += 4) x.fillRect(px, 18 + Math.round(Math.sin(px * 0.09) * 3), 4, 4);
  x.fillStyle = '#bff0ff';
  for (let i = 0; i < 14; i++) x.fillRect(Math.round(rnd(i, 1.3) * 240), 6 + Math.round(rnd(i, 2.7) * 12), 8, 1);
  // 光の すじ（水鏡から 下へ）
  x.fillStyle = 'rgba(160,220,255,0.12)';
  for (const cx of [60, 128, 196]) {
    x.beginPath();
    x.moveTo(cx - 6, 22);
    x.lineTo(cx + 6, 22);
    x.lineTo(cx + 22, hor);
    x.lineTo(cx - 22, hor);
    x.closePath();
    x.fill();
  }
  // 青い 石の 柱
  for (const cx of [24, 92, 164, 232]) {
    x.fillStyle = '#1e3a5e';
    x.fillRect(cx - 8, 22, 16, hor - 22);
    x.fillStyle = '#2e5280';
    x.fillRect(cx - 8, 22, 4, hor - 22);
    x.fillStyle = '#16304e';
    x.fillRect(cx - 10, hor - 8, 20, 8);
    x.fillRect(cx - 10, 22, 20, 5);
  }
}
function mirrorFloor(x, hor) {
  // ぬれた 石の 床（うすい 水たまり）
  x.fillStyle = 'rgba(0,0,0,0.2)';
  for (let y = hor + 6; y < BH; y += 9) x.fillRect(0, y, BW, 1);
  x.fillStyle = 'rgba(120,200,255,0.3)';
  for (let i = 0; i < 6; i++) x.fillRect(Math.round(rnd(i, 3.1) * 220), hor + 10 + Math.round(rnd(i, 5.3) * (BH - hor - 16)), 18 + Math.round(rnd(i, 2.2) * 16), 2);
}

// かれた 間: ひびわれた かべ・砂の 山・青い 光の 玉
function drawDry(x, hor) {
  // かべ（水の あとの しま）
  x.fillStyle = '#4a3e2a';
  x.fillRect(0, 10, BW, hor - 10);
  for (let i = 0; i < 4; i++) {
    x.fillStyle = i % 2 ? '#56482e' : '#3e3424';
    x.fillRect(0, 20 + i * 14, BW, 3);
  }
  // ひび
  x.strokeStyle = '#2a2014';
  x.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const sx = Math.round(rnd(i, 1.9) * 240);
    x.beginPath();
    x.moveTo(sx, 12);
    x.lineTo(sx + 6, 30);
    x.lineTo(sx - 2, 46);
    x.lineTo(sx + 4, 62);
    x.stroke();
  }
  // 砂の 山（両がわ）
  tri(x, [0, hor], [40, hor - 26], [86, hor], '#a88850');
  tri(x, [176, hor], [222, hor - 30], [256, hor], '#a88850');
  tri(x, [10, hor], [40, hor - 24], [50, hor], '#c8a868');
  // 青い 光の 玉（まん中の おく。まわりは 砂に かわりかけ）
  glowOrb(x, 128, 40, 7, '#5ab8ff', 'rgba(90,184,255,0.45)');
  x.fillStyle = '#d8b870';
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    x.fillRect(Math.round(128 + Math.cos(a) * 16), Math.round(40 + Math.sin(a) * 10), 2, 2);
  }
}
function dryFloor(x, hor) {
  // ひびわれた 床
  x.strokeStyle = 'rgba(40,30,16,0.6)';
  x.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    const sx = Math.round(rnd(i, 4.1) * 240), sy = hor + 6 + Math.round(rnd(i, 2.3) * (BH - hor - 10));
    x.beginPath();
    x.moveTo(sx, sy);
    x.lineTo(sx + 10, sy + 4);
    x.lineTo(sx + 18, sy + 1);
    x.stroke();
  }
  x.fillStyle = '#c8a868';
  for (let i = 0; i < 16; i++) x.fillRect(Math.round(rnd(i, 6.6) * 250), hor + 4 + Math.round(rnd(i, 7.7) * (BH - hor - 6)), 2, 1);
}

// 氷の 下の 道: 氷の かべ・つらら・ねむる けものの かげ
function drawIce(x, hor) {
  x.fillStyle = '#2a4a6e';
  x.fillRect(0, 0, BW, hor);
  // すきとおった 氷の ブロック
  for (let i = 0; i < 9; i++) {
    const bx = i * 30 - 6, by = 8 + Math.round(rnd(i, 1.7) * 14);
    x.fillStyle = i % 2 ? 'rgba(160,210,240,0.28)' : 'rgba(120,180,230,0.22)';
    x.fillRect(bx, by, 26, hor - by - 4);
    x.fillStyle = 'rgba(255,255,255,0.35)';
    x.fillRect(bx + 3, by + 4, 2, hor - by - 16);
  }
  // 氷の 中で ねむる けもの（かげ）
  x.fillStyle = 'rgba(20,30,50,0.5)';
  x.beginPath();
  x.ellipse(196, hor - 22, 26, 12, 0, 0, Math.PI * 2);
  x.fill();
  disc(x, 176, hor - 26, 7, 'rgba(20,30,50,0.5)');
  // つらら
  for (let i = 0; i < 16; i++) {
    const cx = 6 + i * 16 + Math.round(rnd(i, 3.3) * 6);
    const len = 8 + Math.round(rnd(i, 4.4) * 12);
    tri(x, [cx - 3, 0], [cx + 3, 0], [cx, len], '#cfeaff');
  }
}
function iceFloor(x, hor) {
  x.fillStyle = 'rgba(255,255,255,0.25)';
  for (let i = 0; i < 8; i++) x.fillRect(Math.round(rnd(i, 2.9) * 220), hor + 8 + Math.round(rnd(i, 3.9) * (BH - hor - 12)), 24, 1);
  x.fillStyle = 'rgba(200,230,255,0.4)';
  for (let i = 0; i < 12; i++) x.fillRect(Math.round(rnd(i, 8.1) * 250), hor + 4 + Math.round(rnd(i, 9.3) * (BH - hor - 6)), 2, 2);
}

// 月の 間: 氷の 天じょう・月の 光・白い 光の 玉
function drawMoon(x, hor) {
  // 氷の 天じょう（まるい まど）
  x.fillStyle = '#1a2a5a';
  x.fillRect(0, 0, BW, 26);
  disc(x, 128, 6, 22, '#3a5a9a');
  disc(x, 128, 6, 18, '#8ab0e8');
  disc(x, 132, 2, 9, '#fffbe0'); // 月
  // 月の 光（下へ ひろがる）
  x.fillStyle = 'rgba(255,250,220,0.14)';
  x.beginPath();
  x.moveTo(112, 20);
  x.lineTo(144, 20);
  x.lineTo(196, hor);
  x.lineTo(60, hor);
  x.closePath();
  x.fill();
  // 氷の 柱（両がわ）
  for (const cx of [20, 236]) {
    x.fillStyle = 'rgba(180,210,250,0.45)';
    x.fillRect(cx - 10, 20, 20, hor - 20);
    x.fillStyle = 'rgba(255,255,255,0.5)';
    x.fillRect(cx - 6, 24, 3, hor - 30);
  }
  // 白い 光の 玉（月の 光の 中）
  glowOrb(x, 128, 44, 6, '#f4f8ff', 'rgba(240,248,255,0.5)');
  // ちらちら まう 羽・星
  x.fillStyle = '#ffffff';
  for (let i = 0; i < 14; i++) x.fillRect(Math.round(rnd(i, 5.5) * 250), 28 + Math.round(rnd(i, 6.1) * (hor - 34)), 1, 1);
}
function moonFloor(x, hor) {
  // 氷の 床に うつる 月の 光
  x.fillStyle = 'rgba(255,250,220,0.18)';
  x.beginPath();
  x.ellipse(128, hor + 18, 70, 10, 0, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = 'rgba(255,255,255,0.3)';
  for (let i = 0; i < 8; i++) x.fillRect(Math.round(rnd(i, 3.7) * 230), hor + 6 + Math.round(rnd(i, 4.9) * (BH - hor - 10)), 20, 1);
}

export function drawC10bBg(x, d, hor) {
  if (d.deco === 'c10b_dry') drawDry(x, hor);
  else if (d.deco === 'c10b_ice') drawIce(x, hor);
  else if (d.deco === 'c10b_moon') drawMoon(x, hor);
  else drawMirror(x, hor);
}
export function drawC10bFloorBg(x, d, hor) {
  if (d.deco === 'c10b_dry') dryFloor(x, hor);
  else if (d.deco === 'c10b_ice') iceFloor(x, hor);
  else if (d.deco === 'c10b_moon') moonFloor(x, hor);
  else mirrorFloor(x, hor);
}
