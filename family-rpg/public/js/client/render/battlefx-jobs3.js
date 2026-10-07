// おかん・最強のおかん・社ちく・ブラックきぎょうの星・天才しせつ管理者・はかい神 の 技の エフェクト
// battlefx.js の play() で battlefx-jobs2.js の つぎに よばれる（ここに ない anim なら false を かえす）
// どれも あたる しゅんかんが すぐ（ダメージの 数字と ずれない）。スマホでも 見やすい ように 大きく・はっきり。1.8びょう いないで おわる
//
// みかたに かける 技（PARTY_ANIMS3）は、がめんの したの ほう（みかたの いる ところ）に 大きく 出る。
// battle.js は みかたに かける ときに PARTY_ANIMS3 を 見て fx.play(anim, [{ x: BW / 2, y: BH * 0.62 }], null, { fromAlly: true }) と よぶ。
// 敵に つかっても（敵の いちを わたしても）、敵の ところにも ひかりが 出るので おかしく ならない
// 「パーン」「コラ!」「見える化」などの もじは、どの きかいでも おなじに 見える ように ドットの もじで かく

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);
const easeIn = (t) => t * t;
// すこし いきすぎて もどる（ぽんっと でる）
const easeBack = (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

// みかたに かける 技（がめんの まん中で よぶ もの）と、たたかいの 音の めやす（battle.js の ANIM_SFX に まぜる。audio.js に ある 音だけ）
export const PARTY_ANIMS3 = new Set(['gohan', 'zangyou', 'black_aura', 'yochou_shield', 'hirune', 'hakai_aura']);
export const JOB3_SFX = {
  okan_otama: 'bat', oyasumi: 'sleep', slipper_smack: 'whip', okan_kaminari: 'thunder', manin_densha: 'train',
  black_star: 'smash', mieruka: 'reach', hakai: 'dark', hakai_ball: 'blast',
  gohan: 'heal', zangyou: 'buff', black_aura: 'fire', yochou_shield: 'warn', hirune: 'sleep', hakai_aura: 'dark',
};

// ───────────── ドットの もじ ─────────────
// '#': ぬる。もじごとに 高さが ちがっても たての まん中で そろえる
const GLYPH = {
  'パ': ['........#.', '.......#.#', '........#.', '...#..#...', '..#....#..', '..#.....#.', '.#......#.', '#........#'],
  'ー': ['.........', '.........', '.........', '#########', '#########', '.........', '.........', '.........'],
  'ン': ['.........', '.#.......', '..#.....#', '...#...#.', '......#..', '.....#...', '...##....', '###......'],
  'コ': ['.........', '.#######.', '.......#.', '.......#.', '.......#.', '.......#.', '.#######.', '.........'],
  'ラ': ['.#######.', '.........', '#########', '........#', '.......#.', '......#..', '....##...', '..##.....'],
  '!': ['##', '##', '##', '##', '##', '..', '##', '##'],
  'Z': ['#######', '.....#.', '....#..', '...#...', '..#....', '.#.....', '#######'],
  '見': ['.#######.', '.#.....#.', '.#######.', '.#.....#.', '.#######.', '.#.....#.', '.#######.', '..#..#...', '##...####'],
  'え': ['...##....', '.........', '.######..', '....#....', '...#.....', '..#.##...', '.#....#..', '#.....###'],
  'る': ['.######..', '.....#...', '....#....', '...####..', '..#....#.', '.#.....#.', '.#.###.#.', '..#..##..'],
  '化': ['...#..#..', '..#...#..', '..#...#.#', '.##...##.', '#.#...#..', '..#..##..', '..#...#..', '..#...#..', '..#....##'],
  '%': ['##...#', '##..#.', '...#..', '..#...', '.#..##', '#...##'],
  0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['###', '..#', '###', '#..', '###'], 3: ['###', '..#', '.##', '..#', '###'],
  4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '###', '..#', '###'], 6: ['###', '#..', '###', '#.#', '###'], 7: ['###', '..#', '..#', '.#.', '.#.'],
  8: ['###', '#.#', '###', '#.#', '###'], 9: ['###', '#.#', '###', '..#', '###'],
};

// もじれつを (cx, cy) を まん中に かく。s: 1ドットの 大きさ、edge: ふちの いろ、bold: ふとじ、n: はじめの n もじ だけ
function pixText(x, str, cx, cy, s, fill, edge = null, bold = true, n = Infinity) {
  const gl = [...str].map((ch) => GLYPH[ch] || GLYPH['!']);
  const widths = gl.map((g) => g[0].length);
  const rows = Math.max(...gl.map((g) => g.length));
  const total = widths.reduce((a, b) => a + b, 0) + (gl.length - 1);
  const x0 = cx - (total * s) / 2, y0 = cy - (rows * s) / 2;
  const cells = [];
  let ox = 0;
  gl.forEach((g, k) => {
    if (k < n) {
      const oy = (rows - g.length) / 2;
      g.forEach((row, r) => { for (let c = 0; c < row.length; c++) if (row[c] === '#') cells.push([x0 + (ox + c) * s, y0 + (oy + r) * s]); });
    }
    ox += widths[k] + 1;
  });
  pixCells(x, cells, s, fill, edge, bold);
  return { w: total * s, h: rows * s };
}
function pixCells(x, cells, s, fill, edge, bold) {
  const bw = bold ? s * 1.45 : s;
  if (edge) {
    x.fillStyle = edge;
    const e = s * 0.75;
    for (const [px, py] of cells) x.fillRect(px - e, py - e, bw + e * 2, s + e * 2);
  }
  x.fillStyle = fill;
  for (const [px, py] of cells) x.fillRect(px, py, bw, s);
}
// まんがの いかりマーク（4つの まがった すじ。r: 大きさ）
function angerMark(x, cx, cy, r, fill = '#ff3a3a', edge = '#5a0a10') {
  const d = r * 0.62;
  // かどの 4つの すじ（まん中に むかって まがる。たて・よこの じくの ところは すきまを あける）
  const arcs = () => {
    x.beginPath();
    for (const [sx, sy] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) {
      const ax = cx + sx * d * 1.25, ay = cy + sy * d * 1.25, mid = Math.atan2(-sy, -sx);
      x.moveTo(ax + Math.cos(mid - 0.62) * d, ay + Math.sin(mid - 0.62) * d);
      x.arc(ax, ay, d, mid - 0.62, mid + 0.62);
    }
  };
  x.save();
  x.lineCap = 'butt';
  arcs(); x.strokeStyle = edge; x.lineWidth = r * 0.24 + 1.4; x.stroke();
  arcs(); x.strokeStyle = fill; x.lineWidth = r * 0.24; x.stroke();
  x.restore();
}

// 5つの かどの 星の かたち（R: そと、r: うち、rot: かたむき）
function starPath(x, cx, cy, R, r, rot = 0) {
  x.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot - Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r : R;
    if (i) x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    else x.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  x.closePath();
}
function circle(x, cx, cy, r) {
  x.beginPath();
  x.arc(cx, cy, Math.max(0.1, r), 0, Math.PI * 2);
}
// ぼんやり ひかる まる（グラデーション）
function haloAt(x, cx, cy, r, rgb, a) {
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, Math.max(0.5, r));
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = g;
  x.fillRect(cx - r, cy - r, r * 2, r * 2);
}
const hash = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };

// スリッパ（うえから 見た かたち: あしの かたちの そこ・つまさきを おおう こう・しろい ふわふわの ふちと ぽんぽん）
// ローカル ざひょう: かかと (0, 0) → つまさき (L, 0)
function slipperBody(x, L, s) {
  x.lineJoin = 'round';
  // そこ（k: そとがわへ ひろげる ぶん）
  const sole = (k) => {
    x.beginPath();
    x.moveTo(L * 0.1, -L * 0.15 - k);
    x.quadraticCurveTo(L * 0.42, -L * 0.12 - k, L * 0.7, -L * 0.21 - k);
    x.bezierCurveTo(L * 1.02 + k, -L * 0.24 - k, L * 1.04 + k, L * 0.22 + k, L * 0.7, L * 0.21 + k);
    x.quadraticCurveTo(L * 0.42, L * 0.12 + k, L * 0.1, L * 0.15 + k);
    x.bezierCurveTo(-L * 0.05 - k, L * 0.15 + k, -L * 0.05 - k, -L * 0.15 - k, L * 0.1, -L * 0.15 - k);
    x.closePath();
  };
  sole(1.4 * s); x.fillStyle = '#5a1a30'; x.fill();
  sole(0); x.fillStyle = '#d05a84'; x.fill();
  sole(-1.4 * s); x.fillStyle = '#ffc8da'; x.fill();
  x.fillStyle = '#f4a8c4';
  x.beginPath(); x.ellipse(L * 0.2, 0, L * 0.08, L * 0.07, 0, 0, Math.PI * 2); x.fill();
  // こう（つまさきの がわ半分を おおう）
  const upper = (k) => {
    x.beginPath();
    x.moveTo(L * 0.5 - k, -L * 0.2 - k);
    x.quadraticCurveTo(L * 0.4 - k, 0, L * 0.5 - k, L * 0.2 + k);
    x.lineTo(L * 0.7, L * 0.215 + k);
    x.bezierCurveTo(L * 1.0 + k, L * 0.23 + k, L * 1.0 + k, -L * 0.23 - k, L * 0.7, -L * 0.215 - k);
    x.closePath();
  };
  upper(1.2 * s); x.fillStyle = '#5a1a30'; x.fill();
  upper(0); x.fillStyle = '#ea4c8a'; x.fill();
  x.fillStyle = '#ff8ab8';
  x.beginPath(); x.ellipse(L * 0.74, -L * 0.08, L * 0.13, L * 0.05, 0.1, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#b83a6a';
  x.beginPath(); x.ellipse(L * 0.74, L * 0.13, L * 0.14, L * 0.035, -0.1, 0, Math.PI * 2); x.fill();
  // はきぐちの しろい ふわふわ と ぽんぽん
  x.strokeStyle = '#fff4f8';
  x.lineWidth = 2.2 * s;
  x.lineCap = 'round';
  x.beginPath(); x.moveTo(L * 0.5, -L * 0.19); x.quadraticCurveTo(L * 0.4, 0, L * 0.5, L * 0.19); x.stroke();
  x.fillStyle = '#5a1a30'; circle(x, L * 0.45, 0, 3.7 * s); x.fill();
  x.fillStyle = '#ffffff'; circle(x, L * 0.45, 0, 2.9 * s); x.fill();
  x.fillStyle = '#ffd8e6'; circle(x, L * 0.45 + 0.9 * s, 0.9 * s, 1.3 * s); x.fill();
}

// ───────────── こまかい つぶの かきかた（battlefx.js の FINE に まぜる） ─────────────
// x: キャンバス、p: つぶ、t: 0〜1（age / life）、fx: Effects（がめんの 大きさ fx.W・fx.H）
export const JOB3_FINE = {
  // おたま（にぎる ところを じくに ふりおろす。swing の あいだに a0 → a1、あとで すこし はねかえる）
  ladle3(x, p, t) {
    const s = p.s || 1, sw = p.swing || 90;
    const a = p.age < sw ? p.a0 + (p.a1 - p.a0) * easeIn(p.age / sw) : p.a1 - Math.sin(clamp01((p.age - sw) / 170) * Math.PI) * 0.22;
    const fade = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
    const L = 34 * s, br = 8 * s;
    const px = p.x - Math.cos(p.a1) * L, py = p.y - Math.sin(p.a1) * L;
    x.save();
    x.translate(px, py);
    x.rotate(a);
    if (p.age < sw + 50) {
      // ふりおろす ときの しろい ざんぞう
      x.globalAlpha = 0.4 * fade;
      x.fillStyle = '#ffffff';
      x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, L + br, -0.7, 0); x.closePath(); x.fill();
    }
    x.globalAlpha = fade;
    x.lineCap = 'round';
    // え（にぎる ところの さきは くるっと まがった フック）
    const handle = () => {
      x.beginPath();
      x.arc(0, -2.4 * s, 2.4 * s, Math.PI * 0.5, Math.PI * 1.45);
      x.moveTo(0, 0); x.quadraticCurveTo(L * 0.5, -2.6 * s, L - br, -0.6 * s);
    };
    for (const [w, c] of [[4.2, '#262636'], [2.4, '#c8ccd8']]) { x.strokeStyle = c; x.lineWidth = w * s; handle(); x.stroke(); }
    x.strokeStyle = '#ffffff'; x.lineWidth = 0.8 * s;
    x.beginPath(); x.moveTo(8 * s, -1.8 * s); x.quadraticCurveTo(L * 0.5, -3.1 * s, L - br - 2 * s, -1.4 * s); x.stroke();
    // おわん（よこから 見た はんえんの カップ。ふちの 中に みそしる）
    const cup = (r) => { x.beginPath(); x.moveTo(L - r, 0); x.arc(L, 0, r, Math.PI, 0, true); x.closePath(); };
    cup(br + 1.4 * s); x.fillStyle = '#262636'; x.fill();
    cup(br); x.fillStyle = '#c4cad8'; x.fill();
    x.fillStyle = '#7a8098';
    x.beginPath(); x.moveTo(L - br * 0.2, br * 0.98); x.arc(L, 0, br, Math.PI * 0.42, Math.PI * 0.08, true); x.lineTo(L + br * 0.45, br * 0.2); x.closePath(); x.fill();
    x.fillStyle = '#ffffff';
    x.beginPath(); x.ellipse(L - br * 0.5, br * 0.45, br * 0.16, br * 0.3, 0.5, 0, Math.PI * 2); x.fill();
    // ふち
    x.fillStyle = '#262636'; x.beginPath(); x.ellipse(L, 0, br + 1.4 * s, br * 0.34 + 1.2 * s, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#e8ecf4'; x.beginPath(); x.ellipse(L, 0, br, br * 0.34, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#c8803a'; x.beginPath(); x.ellipse(L, 0.3 * s, br * 0.8, br * 0.22, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#f0b868'; x.fillRect(L - br * 0.45, -0.3 * s, br * 0.4, 0.8 * s);
    x.restore();
  },
  // まんがの 星（あたまの うえを ぐるぐる まわる）
  cstar3(x, p, t) {
    const ang = p.a0 + (p.age / 1000) * p.spin;
    const X = p.cx + Math.cos(ang) * p.rx, Y = p.cy + Math.sin(ang) * p.ry;
    p.x = X; p.y = Y;
    const pop = clamp01(p.age / 90);
    const R = p.size * pop;
    x.globalAlpha = t < 0.8 ? 1 : 1 - (t - 0.8) / 0.2;
    starPath(x, X, Y, R + 1.2, (R + 1.2) * 0.45, ang * 0.6); x.fillStyle = '#5a3a08'; x.fill();
    starPath(x, X, Y, R, R * 0.45, ang * 0.6); x.fillStyle = '#ffe040'; x.fill();
    x.fillStyle = '#fffbd0'; x.fillRect(X - R * 0.3, Y - R * 0.35, Math.max(0.6, R * 0.3), Math.max(0.6, R * 0.3));
  },
  // みかづき（まわりが ぼんやり ひかる）
  moon3(x, p, t) {
    const a = t < 0.15 ? t / 0.15 : t > 0.85 ? (1 - t) / 0.15 : 1;
    const r = p.r;
    x.globalAlpha = a;
    haloAt(x, p.x, p.y, r * 2.6, '255,236,170', 0.4);
    x.save();
    circle(x, p.x, p.y, r); x.clip();
    x.beginPath(); x.arc(p.x, p.y, r, 0, Math.PI * 2); x.arc(p.x + r * 0.5, p.y - r * 0.2, r * 0.86, 0, Math.PI * 2);
    x.fillStyle = '#ffe680'; x.fill('evenodd');
    x.restore();
    x.fillStyle = '#fff8d0'; x.fillRect(p.x - r * 0.75, p.y - r * 0.2, 1.4, r * 0.5);
  },
  // ナイトキャップ（うえから おちて あたまに のる。さきが たれて ぽんぽん）
  cap3(x, p, t) {
    const s = p.s || 1;
    let Y;
    if (p.age < p.drop) Y = p.y0 + (p.y - p.y0) * easeIn(p.age / p.drop);
    else Y = p.y - Math.abs(Math.sin(clamp01((p.age - p.drop) / 240) * Math.PI)) * 4 * s;
    const X = p.x + Math.sin(p.age / 260) * 0.8;
    x.save();
    x.globalAlpha = t > 0.82 ? (1 - t) / 0.18 : 1;
    x.lineJoin = 'round';
    const cone = () => {
      x.beginPath();
      x.moveTo(X - 8 * s, Y); x.quadraticCurveTo(X - 5 * s, Y - 16 * s, X + 3 * s, Y - 17 * s);
      x.quadraticCurveTo(X + 10 * s, Y - 17 * s, X + 13 * s, Y - 7 * s); x.lineTo(X + 10.5 * s, Y - 7.5 * s);
      x.quadraticCurveTo(X + 8 * s, Y - 13 * s, X + 3 * s, Y - 12.5 * s); x.quadraticCurveTo(X + 7 * s, Y - 6 * s, X + 8 * s, Y); x.closePath();
    };
    cone(); x.strokeStyle = '#1a1c40'; x.lineWidth = 2 * s; x.stroke();
    cone(); x.fillStyle = p.c || '#4a6ad8'; x.fill();
    x.save(); cone(); x.clip();
    x.fillStyle = 'rgba(255,255,255,0.55)';
    for (const k of [0, 1]) { x.beginPath(); x.moveTo(X - 8 * s, Y - (5 + k * 6) * s); x.lineTo(X + 12 * s, Y - (9 + k * 6) * s); x.lineTo(X + 12 * s, Y - (7 + k * 6) * s); x.lineTo(X - 8 * s, Y - (3 + k * 6) * s); x.fill(); }
    x.restore();
    // ふち（しろい ふわふわ）と ぽんぽん
    x.fillStyle = '#1a1c40'; x.beginPath(); x.ellipse(X, Y, 10 * s, 3.4 * s, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(X, Y - 0.3 * s, 9 * s, 2.5 * s, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#1a1c40'; circle(x, X + 12.6 * s, Y - 6.6 * s, 3.4 * s); x.fill();
    x.fillStyle = '#fff6c0'; circle(x, X + 12.6 * s, Y - 6.6 * s, 2.6 * s); x.fill();
    x.restore();
  },
  // Z（ふわっと のぼる。だんだん 大きく）
  zzz3(x, p, t) {
    const a = t < 0.15 ? t / 0.15 : t > 0.7 ? (1 - t) / 0.3 : 1;
    x.globalAlpha = a;
    x.save();
    x.translate(p.x, p.y);
    x.rotate(-0.18 + Math.sin(p.age / 200) * 0.12);
    pixText(x, 'Z', 0, 0, (p.s || 1) * (0.8 + t * 0.5), '#ffffff', '#2a3a8a');
    x.restore();
  },
  // まるい あわに 入った 大きな Z（ひるね）
  zbub3(x, p, t) {
    const a = t < 0.15 ? t / 0.15 : t > 0.75 ? (1 - t) / 0.25 : 1;
    const s = (p.s || 1) * (0.85 + t * 0.3);
    const X = p.x + Math.sin(p.age / 240 + (p.ph || 0)) * 3;
    x.globalAlpha = a * 0.55;
    x.fillStyle = '#dce8ff'; circle(x, X, p.y, 8.5 * s); x.fill();
    x.globalAlpha = a;
    x.strokeStyle = '#7a8ad8'; x.lineWidth = 1; circle(x, X, p.y, 8.5 * s); x.stroke();
    x.fillStyle = '#ffffff'; x.fillRect(X - 5 * s, p.y - 5.5 * s, 2 * s, 2 * s);
    pixText(x, 'Z', X, p.y, 1.25 * s, '#4a5ac0', '#ffffff');
  },
  // 大きな スリッパ（かかとを じくに ふりおろして、そこで パーン）
  slip3(x, p, t) {
    const s = p.s || 1, sw = p.swing || 70;
    const a = p.age < sw ? p.a0 + (p.a1 - p.a0) * easeIn(p.age / sw) : p.a1 - Math.sin(clamp01((p.age - sw) / 150) * Math.PI) * 0.18;
    const fade = t > 0.68 ? 1 - (t - 0.68) / 0.32 : 1;
    const L = 30 * s, R = 36 * s;
    // あたる ところ（p.x, p.y）に つまさき が くる ように、じくは そこから R はなれた ところ
    const px = p.x - Math.cos(p.a1) * R, py = p.y - Math.sin(p.a1) * R;
    x.save();
    x.translate(px, py);
    x.rotate(a);
    if (p.age < sw + 50) {
      x.globalAlpha = 0.42 * fade;
      x.fillStyle = '#ffd0e4';
      x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, R + 6 * s, -0.75, 0.05); x.closePath(); x.fill();
    }
    x.globalAlpha = fade;
    x.translate(R - L - 2 * s, 0);
    slipperBody(x, L, s * 0.9);
    x.restore();
  },
  // まんがの「パーン」（ぎざぎざの きいろい 星と 大きな もじ）
  pow3(x, p, t) {
    const pop = t < 0.1 ? 0.3 + (t / 0.1) * 0.95 : t < 0.18 ? 1.25 - ((t - 0.1) / 0.08) * 0.25 : 1;
    const a = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
    const s = (p.s || 1) * pop;
    const rot = p.rot ?? -0.12;
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    x.rotate(rot);
    const burst = (R0, R1) => {
      x.beginPath();
      for (let i = 0; i < 28; i++) {
        const ang = (i / 28) * Math.PI * 2, rr = i % 2 ? R1 : R0 * (1 + 0.12 * Math.sin(i * 2.1));
        if (i) x.lineTo(Math.cos(ang) * rr * 1.35, Math.sin(ang) * rr);
        else x.moveTo(Math.cos(ang) * rr * 1.35, Math.sin(ang) * rr);
      }
      x.closePath();
    };
    burst(24 * s, 15 * s); x.fillStyle = '#c01830'; x.fill();
    burst(21 * s, 13 * s); x.fillStyle = '#ffe040'; x.fill();
    x.globalAlpha = a * 0.8; x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(0, 0, 18 * s, 9 * s, 0, 0, Math.PI * 2); x.fill();
    x.globalAlpha = a;
    pixText(x, p.text || 'パーン', 0, 0, 1.05 * s, '#ff3a6a', '#4a0010');
    x.restore();
  },
  // さけびの ふきだし（ぎざぎざ。もじと いかりマーク。はじめは ぶるぶる ふるえる）
  bubble3(x, p, t) {
    const pop = t < 0.1 ? 0.35 + (t / 0.1) * 0.85 : t < 0.16 ? 1.2 - ((t - 0.1) / 0.06) * 0.2 : 1;
    const a = t < 0.75 ? 1 : 1 - (t - 0.75) / 0.25;
    const shake = t < 0.4 ? (Math.random() - 0.5) * 3 : 0;
    const X = p.x + shake, Y = p.y + (t < 0.4 ? (Math.random() - 0.5) * 2 : 0);
    const rx = 34 * pop, ry = 15 * pop;
    x.save();
    x.globalAlpha = a;
    const shape = (k) => {
      x.beginPath();
      for (let i = 0; i < 26; i++) {
        const ang = (i / 26) * Math.PI * 2, rr = (i % 2 ? 1.16 : 1) * k;
        if (i) x.lineTo(X + Math.cos(ang) * rx * rr, Y + Math.sin(ang) * ry * rr);
        else x.moveTo(X + Math.cos(ang) * rx * rr, Y + Math.sin(ang) * ry * rr);
      }
      x.closePath();
    };
    shape(1.08); x.fillStyle = '#2a0a0a'; x.fill();
    // しっぽ（したの みかたの ほうへ）
    x.beginPath(); x.moveTo(X - 6 * pop, Y + ry * 0.8); x.lineTo(X - 16 * pop, Y + ry * 2.1); x.lineTo(X + 4 * pop, Y + ry * 0.9); x.fill();
    shape(1.0); x.fillStyle = '#ffffff'; x.fill();
    x.beginPath(); x.moveTo(X - 5 * pop, Y + ry * 0.75); x.lineTo(X - 13 * pop, Y + ry * 1.75); x.lineTo(X + 2 * pop, Y + ry * 0.85); x.fill();
    pixText(x, p.text || 'コラ!', X, Y, 1.35 * pop, '#e8202a', '#5a0a10');
    angerMark(x, X + rx * 0.95, Y - ry * 1.0, 8 * pop);
    x.restore();
  },
  // いかりマーク（ぽんっと でる）
  mark3(x, p, t) {
    const pop = t < 0.15 ? easeBack(t / 0.15) : 1;
    x.globalAlpha = t < 0.75 ? 1 : 1 - (t - 0.75) / 0.25;
    angerMark(x, p.x, p.y, 8.5 * pop);
  },
  // まんいんの 通勤電車（2りょう。まどに ぎゅうぎゅうの かお。p.y: レール）
  // せんとうは t1 の あいだに x0 → xh へ いっきに つっこみ、そのあとは v（px/ms）で はしりぬける
  mantrain3(x, p) {
    const X = p.age < p.t1 ? p.x0 + (p.xh - p.x0) * (p.age / p.t1) : p.xh + (p.age - p.t1) * p.v;
    const Y = p.y;
    p.x = X;
    const carW = 86, gap = 3, hh = 30;
    x.save();
    x.globalAlpha = 1;
    // うしろの かぜの すじ
    x.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 6; i++) x.fillRect(X - 2 * carW - gap - 26 - i * 12, Y - 24 + i * 4, 22, 1.2);
    for (let c = 0; c < 2; c++) {
      const x1 = X - c * (carW + gap), x0 = x1 - carW;
      // しゃたい（ぎんいろ・オレンジの おび）
      x.fillStyle = '#2a2a3a'; x.fillRect(x0 - 1, Y - hh - 1, carW + 2, hh + 2);
      x.fillStyle = '#dfe3ea'; x.fillRect(x0, Y - hh, carW, hh);
      x.fillStyle = '#f4f6fa'; x.fillRect(x0, Y - hh, carW, 3);
      x.fillStyle = '#f08a2a'; x.fillRect(x0, Y - 9, carW, 4);
      // まど（ぎゅうぎゅうの かお）とドア
      for (let w = 0; w < 5; w++) {
        const wx = x0 + 5 + w * 16, wy = Y - hh + 5;
        x.fillStyle = '#2a3048'; x.fillRect(wx, wy, 12, 13);
        x.fillStyle = '#9ab8d8'; x.fillRect(wx + 1, wy + 1, 10, 11);
        // うしろにも 人が ぎっしり（すこし くらい）
        for (let f = 0; f < 2; f++) {
          const bx = wx + 4.3 + f * 3.6, by = wy + 3.4;
          x.fillStyle = '#c8987c'; x.beginPath(); x.ellipse(bx, by, 1.9, 2, 0, 0, Math.PI * 2); x.fill();
          x.fillStyle = f ? '#3a2a20' : '#1a1a24'; x.fillRect(bx - 1.9, by - 2.3, 3.8, 1.4);
        }
        for (let f = 0; f < 3; f++) {
          const seed = c * 17 + w * 5 + f;
          const fx0 = wx + 2.5 + f * 3.6, fy = wy + 6 + (seed % 2) * 2.2;
          const squish = seed % 4 === 0;
          x.fillStyle = squish ? '#ffd8bc' : '#f0c4a0';
          x.beginPath(); x.ellipse(fx0, fy, squish ? 2.6 : 2.1, squish ? 2.0 : 2.3, 0, 0, Math.PI * 2); x.fill();
          x.fillStyle = ['#2a1a14', '#4a2a1a', '#1a1a24', '#6a4a2a'][seed % 4];
          x.fillRect(fx0 - 2.1, fy - 2.6, 4.2, 1.6);
          x.fillStyle = '#1a1a24';
          x.fillRect(fx0 - 1.1, fy - 0.3, 0.7, 0.7); x.fillRect(fx0 + 0.5, fy - 0.3, 0.7, 0.7);
          if (seed % 3 === 0) { x.fillStyle = '#5ab8ff'; x.fillRect(fx0 + 1.6, fy - 1.8, 0.8, 1.2); }
        }
        // つりかわ
        x.fillStyle = '#ffffff'; x.fillRect(wx + 5.5, wy + 1, 0.8, 2);
      }
      for (const dx of [27, 59]) { x.fillStyle = '#9aa0b0'; x.fillRect(x0 + dx, Y - hh + 4, 1, hh - 6); }
      // しゃりん
      x.fillStyle = '#1a1a24';
      for (const dx of [10, 22, carW - 24, carW - 12]) { circle(x, x0 + dx, Y + 1, 3); x.fill(); }
      x.fillStyle = '#6a6a7a';
      for (const dx of [10, 22, carW - 24, carW - 12]) x.fillRect(x0 + dx - 0.6, Y + 0.4, 1.2, 1.2);
    }
    // せんとうの かお（ななめの まど・ライト・いきさきの ひょうじ）
    x.fillStyle = '#2a2a3a';
    x.beginPath(); x.moveTo(X, Y - hh - 1); x.lineTo(X + 12, Y - hh + 8); x.lineTo(X + 13, Y + 1); x.lineTo(X, Y + 1); x.fill();
    x.fillStyle = '#dfe3ea';
    x.beginPath(); x.moveTo(X, Y - hh); x.lineTo(X + 11, Y - hh + 8.5); x.lineTo(X + 12, Y); x.lineTo(X, Y); x.fill();
    x.fillStyle = '#2a3048'; x.beginPath(); x.moveTo(X + 1, Y - hh + 4); x.lineTo(X + 9, Y - hh + 10); x.lineTo(X + 9, Y - 13); x.lineTo(X + 1, Y - 13); x.fill();
    x.fillStyle = '#f08a2a'; x.fillRect(X, Y - 9, 12, 4);
    x.fillStyle = '#fff6b0'; x.fillRect(X + 9, Y - 5, 3, 2);
    x.fillStyle = '#1a1a24'; x.fillRect(X - 30, Y - hh - 4, 22, 4);
    x.fillStyle = '#ffb040'; x.fillRect(X - 29, Y - hh - 3, 20, 2);
    x.restore();
  },
  // 赤黒い 星の いんせき（ほのおの おを ひいて おちて、おちた ところで しばらく どくどく ひかる）
  dstar3(x, p) {
    const u = clamp01(p.age / p.travel);
    const e = u * u;
    const X = p.x0 + (p.x1 - p.x0) * e, Y = p.y0 + (p.y1 - p.y0) * e;
    p.x = X; p.y = Y;
    let R = p.r, fade = 1;
    if (u < 1) {
      for (let k = 7; k >= 1; k--) {
        const b = Math.max(0, e - k * 0.07);
        const bx = p.x0 + (p.x1 - p.x0) * b, by = p.y0 + (p.y1 - p.y0) * b;
        x.globalAlpha = 0.85 * (1 - k / 8);
        x.fillStyle = k > 4 ? '#3a0408' : k > 2 ? '#c41a1a' : '#ff6a3a';
        circle(x, bx, by, p.r * (1 - k * 0.09)); x.fill();
      }
    } else {
      // おちた あと: ぐっと 大きく なって、どくどく して きえる
      const v = clamp01((p.age - p.travel) / Math.max(1, p.life - p.travel));
      R = p.r * (1.5 + 0.18 * Math.sin(p.age / 45)) * (v < 0.15 ? 0.8 + v / 0.15 * 0.2 : 1);
      fade = v < 0.7 ? 1 : 1 - (v - 0.7) / 0.3;
    }
    const rot = u < 1 ? p.age / 60 : p.travel / 60;
    x.globalAlpha = fade;
    haloAt(x, X, Y, R * 2.6, '255,60,40', 0.55);
    starPath(x, X, Y, R + 1.8, (R + 1.8) * 0.48, rot); x.fillStyle = '#ff4a2a'; x.fill();
    starPath(x, X, Y, R, R * 0.48, rot); x.fillStyle = '#1a0206'; x.fill();
    starPath(x, X, Y, R * 0.55, R * 0.26, rot); x.fillStyle = '#a01010'; x.fill();
    x.fillStyle = '#ffe066'; circle(x, X, Y, R * 0.2); x.fill();
  },
  // 水色の スキャンの 線（がめんを ひだりから みぎへ）
  scan3(x, p, t, fx) {
    const W = fx?.W || 256, H = fx?.H || 144;
    const u = clamp01(t / 0.9);
    const X = -12 + (W + 24) * (u * u * (3 - 2 * u));
    const g = x.createLinearGradient(X - 46, 0, X, 0);
    g.addColorStop(0, 'rgba(56,216,255,0)');
    g.addColorStop(1, 'rgba(56,216,255,0.32)');
    x.globalAlpha = t > 0.9 ? (1 - t) / 0.1 : 1;
    x.fillStyle = g; x.fillRect(X - 46, 0, 46, H);
    x.fillStyle = '#c8f8ff'; x.fillRect(X - 1, 0, 2, H);
    x.fillStyle = '#5ae4ff';
    for (let y = 4; y < H; y += 10) x.fillRect(X - 5, y, 4, 1);
  },
  // うすい あみめ（HUD）
  grid3(x, p, t, fx) {
    const W = fx?.W || 256, H = fx?.H || 144;
    const a = (t < 0.15 ? t / 0.15 : t > 0.75 ? (1 - t) / 0.25 : 1) * 0.22;
    x.globalAlpha = a;
    x.fillStyle = '#5ae4ff';
    for (let gx = 8; gx < W; gx += 16) x.fillRect(gx, 18, 1, H - 40);
    for (let gy = 18; gy < H - 20; gy += 16) x.fillRect(0, gy, W, 1);
  },
  // HUDの みだし（「見える化」が 1もじずつ でる・わく・カーソル）
  hud3(x, p, t) {
    const a = t < 0.08 ? t / 0.08 : t > 0.82 ? (1 - t) / 0.18 : 1;
    const n = Math.min(4, Math.floor(p.age / 90) + 1);
    x.globalAlpha = a * 0.75;
    x.fillStyle = '#06202e'; x.fillRect(p.x, p.y, 62, 19);
    x.globalAlpha = a;
    x.fillStyle = '#5ae4ff';
    x.fillRect(p.x, p.y, 62, 1); x.fillRect(p.x, p.y + 18, 62, 1); x.fillRect(p.x, p.y, 1, 19); x.fillRect(p.x + 61, p.y, 1, 19);
    x.fillRect(p.x + 3, p.y + 3, 2, 13);
    pixText(x, p.text || '見える化', p.x + 34, p.y + 9.5, 1.2, '#e8fdff', '#0a4a64', false, n);
    if (Math.floor(p.age / 160) % 2) x.fillRect(p.x + 56, p.y + 13, 3, 2);
  },
  // ねらいの わく（大きい ところから ちぢんで ロック・ちかちか）
  bracket3(x, p, t) {
    const k = 1 + 0.9 * (1 - easeOut(clamp01(p.age / 170)));
    const w = p.w * k / 2, h = p.h * k / 2, L = 6;
    const blink = p.age > 170 && p.age < 420 && Math.floor(p.age / 60) % 2;
    x.globalAlpha = (t > 0.8 ? (1 - t) / 0.2 : 1) * (blink ? 0.5 : 1);
    x.fillStyle = '#7aeaff';
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const cx = p.x + sx * w, cy = p.y + sy * h;
      x.fillRect(sx < 0 ? cx : cx - L, cy - 1, L, 2);
      x.fillRect(cx - 1, sy < 0 ? cy : cy - L, 2, L);
    }
    x.fillRect(p.x - 3, p.y, 6, 1); x.fillRect(p.x, p.y - 3, 1, 6);
  },
  // 小さな ぼうグラフの パネル（ぼうが のびる・おれせん）
  chart3(x, p, t) {
    const pop = clamp01(p.age / 120);
    const a = (t > 0.8 ? (1 - t) / 0.2 : 1) * pop;
    const w = 28, h = 18, X = p.x - w / 2, Y = p.y - h / 2;
    x.globalAlpha = a * 0.75;
    x.fillStyle = '#06202e'; x.fillRect(X, Y, w, h);
    x.globalAlpha = a;
    x.fillStyle = '#5ae4ff';
    x.fillRect(X, Y, w, 1); x.fillRect(X, Y + h - 1, w, 1); x.fillRect(X, Y, 1, h); x.fillRect(X + w - 1, Y, 1, h);
    const hs = [0.45, 0.7, 0.55, 0.9].map((v, i) => (v + 0.2 * hash(p.seed || 0, i)) % 1 * 0.8 + 0.2);
    hs.forEach((v, i) => {
      const g = easeOut(clamp01((p.age - 80 - i * 60) / 220));
      const bh = Math.round((h - 6) * v * g);
      x.fillStyle = i === 3 ? '#ffe066' : '#7aeaff';
      x.fillRect(X + 3 + i * 6, Y + h - 3 - bh, 4, bh);
    });
    x.fillStyle = '#e8fdff';
    for (let i = 0; i < 3; i++) {
      const g = clamp01((p.age - 200 - i * 60) / 100);
      if (g > 0) x.fillRect(X + 5 + i * 6, Y + h - 3 - (h - 6) * hs[i] - 2, 6 * g, 1);
    }
  },
  // ％の かず（0 から かぞえあがって ぽんっと とまる）
  pct3(x, p, t) {
    const v = Math.round(p.n * clamp01(p.age / 380));
    const pop = p.age > 380 && p.age < 470 ? 1.2 : 1;
    x.globalAlpha = t > 0.8 ? (1 - t) / 0.2 : 1;
    pixText(x, `${v}%`, p.x, p.y, 1.3 * pop, '#ffe066', '#3a2a00');
  },
  // ちり（ふわっと うえへ きえる）
  dust3(x, p, t) {
    x.globalAlpha = (1 - t) * 0.95;
    x.fillStyle = p.color;
    x.fillRect(p.x, p.y, p.size, p.size);
  },
  // くずれる まく: 敵の うえを くらい むらさきの こまかい 四角で おおい、うえから じゅんに ちりに なって とんでいく
  // p.cells: [dx, dy, じゅんばん（0〜1）, vx, vy]、p.cs: 四角の 大きさ、p.t0: くずれはじめ、p.spread: うえから したまでの じかん
  crumble3(x, p) {
    const age = p.age, cs = p.cs;
    const appear = clamp01(age / 140);
    for (const [dx, dy, k, vx, vy] of p.cells) {
      const u = clamp01((age - p.t0 - k * p.spread) / 460);
      if (u >= 1) continue;
      if (u <= 0) {
        // まだ くずれて いない: くらい むらさきで おおう（ときどき むらさきに ひかる）
        x.globalAlpha = appear * 0.72;
        x.fillStyle = (Math.floor(age / 50) + Math.floor(k * 9)) % 5 === 0 ? '#8a3ac8' : '#24082e';
        x.fillRect(p.x + dx, p.y + dy, cs, cs);
        continue;
      }
      const sz = cs * (1 - u * 0.55);
      x.globalAlpha = (1 - u) * 0.9;
      x.fillStyle = u < 0.3 ? '#6a2a8a' : u < 0.6 ? '#b080d8' : '#e0d0f0';
      x.fillRect(p.x + dx + vx * u + Math.sin(u * 7 + k * 20) * 1.2 * u, p.y + dy + vy * u, sz, sz);
    }
  },
  // くろっぽい ほのお（かさねても しろく ならない。c2: そと、c1: なか、c3: ねもとの ひかり）
  dflame3(x, p, t) {
    const life = Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.05));
    const h = p.h * (0.35 + 0.65 * life) * (1 + 0.1 * Math.sin(p.age / 40 + p.ph));
    const w = p.w * (0.6 + 0.4 * life);
    if (h < 1) return;
    const sway = Math.sin(p.age / 70 + p.ph) * w * 0.35;
    const tongue = (hh, ww) => {
      x.beginPath();
      x.moveTo(p.x - ww, p.y);
      x.quadraticCurveTo(p.x - ww * 1.05, p.y - hh * 0.45, p.x + sway, p.y - hh);
      x.quadraticCurveTo(p.x + ww * 1.05, p.y - hh * 0.45, p.x + ww, p.y);
      x.closePath();
      x.fill();
    };
    const a = Math.max(0, 1 - Math.max(0, t - 0.6) / 0.4);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = 0.9 * a; x.fillStyle = p.c2; tongue(h, w);
    x.globalAlpha = 0.95 * a; x.fillStyle = p.c1; tongue(h * 0.62, w * 0.55);
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = 0.55 * a; x.fillStyle = p.c3; tongue(h * 0.32, w * 0.9);
    x.globalCompositeOperation = 'source-over';
  },
  // はかいの 玉（オレンジの 小さな 太陽。ふくらんでから まっすぐ おちる）
  sun3(x, p) {
    const age = p.age;
    let r = p.r * (age < p.grow ? 0.45 + 0.55 * easeOut(age / p.grow) : 1);
    let X = p.x0, Y = p.y0;
    if (age > p.grow) {
      const u = clamp01((age - p.grow) / p.fall), e = u * u;
      X = p.x0 + (p.x1 - p.x0) * e; Y = p.y0 + (p.y1 - p.y0) * e;
      r *= 1 + 0.2 * u;
    }
    p.x = X; p.y = Y;
    if (age > p.grow + p.fall) return;
    x.globalAlpha = 1;
    haloAt(x, X, Y, r * 3.2, '255,140,40', 0.55);
    // ゆらめく ほのおの とげ
    x.fillStyle = '#ffb030';
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + age / 260, L = r * (1.45 + 0.25 * Math.sin(age / 50 + i * 1.7));
      x.globalAlpha = 0.75;
      x.beginPath(); x.moveTo(X + Math.cos(a - 0.14) * r, Y + Math.sin(a - 0.14) * r); x.lineTo(X + Math.cos(a) * L, Y + Math.sin(a) * L); x.lineTo(X + Math.cos(a + 0.14) * r, Y + Math.sin(a + 0.14) * r); x.fill();
    }
    x.globalAlpha = 1;
    const g = x.createRadialGradient(X - r * 0.3, Y - r * 0.3, r * 0.1, X, Y, r);
    g.addColorStop(0, '#fffbe0'); g.addColorStop(0.45, '#ffd040'); g.addColorStop(1, '#ff7a14');
    x.fillStyle = g; circle(x, X, Y, r); x.fill();
  },
  // ごはんの ちゃわん（v 0）・みそしるの おわん（v 1）
  bowl3(x, p, t) {
    const pop = p.age < 170 ? easeBack(p.age / 170) : 1;
    const s = (p.s || 1) * Math.max(0.05, pop);
    x.save();
    x.globalAlpha = t > 0.85 ? (1 - t) / 0.15 : 1;
    x.translate(p.x, p.y);
    x.scale(s, s);
    if (!p.v) {
      // ごはん（こんもり。つぶつぶ）
      x.fillStyle = '#3a3a48';
      x.beginPath(); x.arc(0, -0.5, 10.4, Math.PI, 0); x.fill();
      x.fillStyle = '#ffffff';
      x.beginPath(); x.arc(0, -0.5, 9.4, Math.PI, 0); x.fill();
      x.fillStyle = '#e4e6f0';
      for (const [a, b] of [[-5, -3], [-1, -6], [3, -4], [6, -2], [-3, -1], [1, -2], [-6, -5], [4, -7]]) x.fillRect(a, b, 1.6, 1);
      // ちゃわん（しろに あおい もよう）
      x.fillStyle = '#2a2a3a';
      x.beginPath(); x.moveTo(-12, -1.2); x.lineTo(12, -1.2); x.quadraticCurveTo(11, 9, 4.5, 9.5); x.lineTo(-4.5, 9.5); x.quadraticCurveTo(-11, 9, -12, -1.2); x.fill();
      x.fillStyle = '#f6f4ee';
      x.beginPath(); x.moveTo(-11, -0.4); x.lineTo(11, -0.4); x.quadraticCurveTo(10, 8, 4, 8.5); x.lineTo(-4, 8.5); x.quadraticCurveTo(-10, 8, -11, -0.4); x.fill();
      x.fillStyle = '#3a5ab8';
      x.fillRect(-10.4, 1.2, 20.8, 1.2);
      for (const a of [-7, -2, 3, 8]) { circle(x, a, 4.8, 1); x.fill(); }
      x.fillStyle = '#2a2a3a'; x.fillRect(-4.5, 9.3, 9, 2.2);
      x.fillStyle = '#d8d4cc'; x.fillRect(-3.8, 9.5, 7.6, 1.4);
    } else {
      // みそしる（あかい うるしの おわん・みその いろ・ねぎと とうふ）
      x.fillStyle = '#2a0a0a';
      x.beginPath(); x.moveTo(-12, -1.5); x.lineTo(12, -1.5); x.quadraticCurveTo(11.5, 9.5, 4, 10); x.lineTo(-4, 10); x.quadraticCurveTo(-11.5, 9.5, -12, -1.5); x.fill();
      x.fillStyle = '#9a2a24';
      x.beginPath(); x.moveTo(-11, -0.6); x.lineTo(11, -0.6); x.quadraticCurveTo(10.5, 8.6, 3.6, 9); x.lineTo(-3.6, 9); x.quadraticCurveTo(-10.5, 8.6, -11, -0.6); x.fill();
      x.fillStyle = '#d8584a'; x.fillRect(-9, 1, 3, 4);
      x.fillStyle = '#2a0a0a'; x.beginPath(); x.ellipse(0, -1.4, 12, 3.4, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#c8803a'; x.beginPath(); x.ellipse(0, -1.4, 10.8, 2.6, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#e0a860'; x.beginPath(); x.ellipse(-1.5, -1.8, 6, 1.2, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#ffffff'; for (const [a, b] of [[-5, -2.2], [3, -1.6]]) x.fillRect(a, b, 2.2, 1.6);
      x.fillStyle = '#5ab84a'; for (const [a, b] of [[-1, -2.6], [5, -2.2], [-7, -1.2], [1, -0.8]]) x.fillRect(a, b, 1.6, 0.9);
      x.fillStyle = '#2a0a0a'; x.fillRect(-4, 9.8, 8, 2);
    }
    x.restore();
  },
  // ゆげ（ゆらゆら のぼる しろい すじ）
  steam3(x, p, t) {
    x.globalAlpha = Math.sin(Math.PI * clamp01(t)) * 0.8;
    x.strokeStyle = '#ffffff';
    x.lineWidth = 1.5;
    x.beginPath();
    for (let i = 0; i <= 10; i++) {
      const u = i / 10;
      const yy = p.y - u * p.h - t * 6, xx = p.x + Math.sin(u * 6 + p.ph + p.age / 150) * 2.4 * u;
      if (i) x.lineTo(xx, yy); else x.moveTo(xx, yy);
    }
    x.stroke();
    x.lineWidth = 1;
  },
  // かべかけ 時計（はりが ぐるぐる まわる）
  clock3(x, p, t) {
    const pop = p.age < 160 ? easeBack(p.age / 160) : 1;
    const r = p.r * Math.max(0.05, pop);
    x.save();
    x.globalAlpha = t > 0.85 ? (1 - t) / 0.15 : 1;
    x.translate(p.x, p.y);
    x.fillStyle = '#1a1a2a'; circle(x, 0, 0, r + 2.4); x.fill();
    x.fillStyle = '#a8b0c8'; circle(x, 0, 0, r + 1.4); x.fill();
    x.fillStyle = '#fbfbff'; circle(x, 0, 0, r); x.fill();
    x.fillStyle = '#2a2a3a';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2, big = i % 3 === 0;
      x.save(); x.rotate(a); x.fillRect(-(big ? 1 : 0.5), -r + 1.5, big ? 2 : 1, big ? 3.4 : 2); x.restore();
    }
    const am = p.age / 52, ah = p.age / 620;
    // ながい はりの ざんぞう
    x.globalAlpha *= 0.3;
    x.fillStyle = '#5a6a9a';
    x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, r * 0.82, am - Math.PI / 2 - 0.9, am - Math.PI / 2); x.closePath(); x.fill();
    x.globalAlpha = t > 0.85 ? (1 - t) / 0.15 : 1;
    x.lineCap = 'round';
    x.strokeStyle = '#1a1a2a';
    x.lineWidth = 2.4; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(ah - Math.PI / 2) * r * 0.5, Math.sin(ah - Math.PI / 2) * r * 0.5); x.stroke();
    x.lineWidth = 1.4; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(am - Math.PI / 2) * r * 0.82, Math.sin(am - Math.PI / 2) * r * 0.82); x.stroke();
    x.fillStyle = '#e8303a'; circle(x, 0, 0, 1.6); x.fill();
    x.restore();
  },
  // よるの オフィスビル（がめんの したに ならび、まどの あかりが つぎつぎ つく）
  windows3(x, p, t, fx) {
    const W = fx?.W || 256, H = fx?.H || 144;
    const a = t < 0.1 ? t / 0.1 : t > 0.85 ? (1 - t) / 0.15 : 1;
    x.globalAlpha = a * 0.86;
    const B = [[0, 34, 20], [36, 30, 14], [68, 40, 24], [110, 30, 16], [142, 44, 22], [188, 32, 15], [222, 34, 19]];
    for (const [bx, bw, bh] of B) {
      const top = H - bh;
      x.fillStyle = '#0c1230'; x.fillRect(bx, top, bw, bh);
      x.fillStyle = '#1c2450'; x.fillRect(bx, top, bw, 1.5);
      for (let wy = top + 4, r = 0; wy < H - 3; wy += 6, r++) {
        for (let wx = bx + 3, c = 0; wx < bx + bw - 4; wx += 6, c++) {
          const on = t > 0.08 + 0.6 * hash(bx + c * 3.1, r * 7.7);
          x.fillStyle = on ? (hash(c, r + bx) < 0.3 ? '#fff6c8' : '#ffd860') : '#202a58';
          x.fillRect(wx, wy, 3.4, 3);
        }
      }
    }
  },
  // エナジードリンクの かん（くろに みどりの いなずま。とびあがって くるくる）
  can3(x, p, t) {
    x.save();
    x.globalAlpha = t > 0.8 ? (1 - t) / 0.2 : 1;
    x.translate(p.x, p.y);
    x.rotate((p.rot || 0) + p.age / 260 * (p.spin || 1));
    x.fillStyle = '#1a1a24'; x.fillRect(-4.6, -8, 9.2, 16);
    x.fillStyle = '#2c2c3c'; x.fillRect(-3.6, -7, 7.2, 14);
    x.fillStyle = '#c8ccd8'; x.fillRect(-3.6, -8.6, 7.2, 1.8); x.fillRect(-3.6, 6.8, 7.2, 1.6);
    x.fillStyle = '#7aff3a';
    x.beginPath(); x.moveTo(0.8, -5.5); x.lineTo(-2.2, 0.6); x.lineTo(0, 0.6); x.lineTo(-1, 5.2); x.lineTo(2.4, -1); x.lineTo(0.2, -1); x.fill();
    x.fillStyle = '#ffffff'; x.fillRect(-3, -6, 1, 9);
    x.restore();
  },
  // 六角形の シールドの ドーム（まん中の したから ひろがる。hit の とき ひかる）
  hexdome3(x, p, t) {
    const age = p.age;
    const a = t > 0.85 ? (1 - t) / 0.15 : 1;
    const R = 7.5, hw = R * Math.sqrt(3) / 2;
    const flash = age > p.hit ? Math.max(0, 1 - (age - p.hit) / 280) : 0;
    x.save();
    x.lineWidth = 1;
    for (let row = 0; row < 12; row++) {
      const cy = p.y - row * R * 1.5;
      for (let col = -9; col <= 9; col++) {
        const cx = p.x + col * hw * 2 + (row % 2 ? hw : 0);
        const dx = (cx - p.x) / p.rx, dy = (cy - p.y) / p.ry;
        const d = dx * dx + dy * dy;
        if (d > 1 || cy > p.y) continue;
        const appear = clamp01((age - Math.sqrt(d) * 260) / 140);
        if (appear <= 0) continue;
        const near = p.hx === undefined ? 0 : Math.max(0, 1 - Math.hypot(cx - p.hx, cy - p.hy) / 60) * flash;
        x.beginPath();
        for (let i = 0; i < 6; i++) {
          const an = Math.PI / 6 + (i * Math.PI) / 3, rr = R * (0.55 + 0.45 * appear) - 0.4;
          if (i) x.lineTo(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr); else x.moveTo(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr);
        }
        x.closePath();
        x.globalAlpha = a * (0.1 + 0.25 * near + 0.08 * flash);
        x.fillStyle = near > 0.2 ? '#e8fdff' : '#38d8ff';
        x.fill();
        x.globalAlpha = a * Math.min(1, 0.55 + near + 0.3 * flash) * appear;
        x.strokeStyle = near > 0.2 ? '#ffffff' : '#7aeaff';
        x.stroke();
      }
    }
    // ドームの ふち
    x.globalAlpha = a * (0.7 + 0.3 * flash);
    x.strokeStyle = '#c8f8ff';
    x.lineWidth = 1.6;
    x.beginPath(); x.ellipse(p.x, p.y, p.rx, p.ry, 0, Math.PI, Math.PI * 2); x.stroke();
    x.restore();
  },
  // けいこくの 三角（「!」。スキャンされて、ドームに あたって くだける）
  warn3(x, p, t) {
    const age = p.age;
    const hitAt = p.hit;
    if (age < hitAt) {
      const fall = clamp01((age - p.hold) / (hitAt - p.hold));
      const Y = p.y + (p.y1 - p.y) * easeIn(fall);
      const X = p.x;
      const blink = Math.floor(age / 90) % 2;
      x.globalAlpha = 1;
      x.fillStyle = '#2a1a00';
      x.beginPath(); x.moveTo(X, Y - 12); x.lineTo(X + 12, Y + 9); x.lineTo(X - 12, Y + 9); x.closePath(); x.fill();
      x.fillStyle = blink ? '#ffd020' : '#ffb000';
      x.beginPath(); x.moveTo(X, Y - 9); x.lineTo(X + 9.4, Y + 7.4); x.lineTo(X - 9.4, Y + 7.4); x.closePath(); x.fill();
      pixText(x, '!', X, Y + 0.5, 1.4, '#2a1a00', null, false);
      // スキャン（水色の 線が うえから したへ とおる）
      const sc = clamp01((age - 120) / 260);
      if (sc > 0 && sc < 1) {
        x.fillStyle = '#7aeaff';
        x.fillRect(X - 16, Y - 13 + sc * 24, 32, 1.5);
        x.globalAlpha = 0.6;
        x.fillRect(X - 18, Y - 14, 2, 26); x.fillRect(X + 16, Y - 14, 2, 26);
      }
      return;
    }
    // くだけた かけら
    const u = clamp01((age - hitAt) / Math.max(1, p.life - hitAt));
    x.globalAlpha = 1 - u;
    x.fillStyle = '#ffd020';
    for (let i = 0; i < 7; i++) {
      const an = -Math.PI / 2 + (i - 3) * 0.42;
      const d = 6 + u * 40;
      const cx = p.x + Math.cos(an) * d, cy = p.y1 + Math.sin(an) * d * 0.7 + u * u * 30;
      x.beginPath(); x.moveTo(cx, cy - 3); x.lineTo(cx + 3, cy + 2); x.lineTo(cx - 3, cy + 2); x.closePath(); x.fill();
    }
  },
  // 大きな まくら（ふかふか。ぽんっと でて すこし はずむ）
  pillow3(x, p, t) {
    const pop = p.age < 180 ? easeBack(p.age / 180) : 1 + Math.sin(p.age / 300) * 0.02;
    x.save();
    x.globalAlpha = t > 0.85 ? (1 - t) / 0.15 : 1;
    x.translate(p.x, p.y);
    x.scale(pop, pop);
    const body = (k, c) => {
      x.fillStyle = c;
      x.beginPath();
      x.moveTo(-26 * k, -8 * k); x.quadraticCurveTo(0, -14 * k, 26 * k, -8 * k); x.quadraticCurveTo(32 * k, 0, 26 * k, 8 * k);
      x.quadraticCurveTo(0, 13 * k, -26 * k, 8 * k); x.quadraticCurveTo(-32 * k, 0, -26 * k, -8 * k); x.fill();
    };
    body(1.06, '#3a3a6a');
    body(1, '#f4f6ff');
    x.fillStyle = '#c8d0f0';
    x.beginPath(); x.ellipse(2, 3, 18, 5, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ffffff';
    x.beginPath(); x.ellipse(-8, -4, 10, 3, -0.1, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#8a9ae0';
    for (const [a, b] of [[-16, 0], [12, -4], [18, 4]]) { starPath(x, a, b, 2.2, 1, 0); x.fill(); }
    x.restore();
  },
  // はなちょうちん（ふくらんだり しぼんだり して、さいごに パチンと われる）
  snot3(x, p, t) {
    if (t > 0.88) {
      // われた しぶき
      const u = (t - 0.88) / 0.12;
      x.globalAlpha = 1 - u;
      x.fillStyle = '#cfe8ff';
      for (let i = 0; i < 6; i++) { const an = (i / 6) * Math.PI * 2; x.fillRect(p.x + Math.cos(an) * (6 + u * 10), p.y + Math.sin(an) * (6 + u * 10), 1.6, 1.6); }
      return;
    }
    const r = 3 + 8 * (0.5 + 0.5 * Math.sin(p.age / 260 - Math.PI / 2)) * clamp01(p.age / 200) + t * 3;
    x.globalAlpha = 0.45;
    x.fillStyle = '#dcefff'; circle(x, p.x + r * 0.7, p.y, r); x.fill();
    x.globalAlpha = 0.95;
    x.strokeStyle = '#7ab0e8'; x.lineWidth = 0.9; circle(x, p.x + r * 0.7, p.y, r); x.stroke(); x.lineWidth = 1;
    x.fillStyle = '#ffffff'; x.fillRect(p.x + r * 0.35, p.y - r * 0.55, Math.max(1, r * 0.3), Math.max(1, r * 0.3));
  },
};

// ───────────── 技ごとの えんしゅつ ─────────────
// その anim の エフェクトを だす（だしたら true）
// fx: Effects、W・H: たたかいの がめんの 大きさ
const CAP_COL = ['#4a6ad8', '#d84a7a', '#3aa87a'];
const DUST = ['#c8a8e0', '#8a6aa8', '#5a4a6a', '#e8d8f0', '#3a2a4a'];
const KI_RED = ['#ff4a3a', '#ffe066', '#2a0408', '#ffffff'];
// くずれる まくの 四角（w・h: 敵の 大きさ）
function crumbleCells(w, h, cs) {
  const rx = w * 0.42, ry = h * 0.46, cells = [];
  for (let gy = -ry; gy < ry; gy += cs) {
    for (let gx = -rx; gx < rx; gx += cs) {
      const ex = (gx + cs / 2) / rx, ey = (gy + cs / 2) / ry;
      if (ex * ex + ey * ey > 1 + rnd(-0.15, 0.15)) continue;
      cells.push([gx, gy, clamp01((gy + ry) / (2 * ry) + rnd(-0.12, 0.12)), rnd(14, 40), rnd(-34, -10)]);
    }
  }
  return cells;
}

export function playJob3Fx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  const crit = !!opts.crit;
  const all = targets.length > 1;
  const each = (fn) => targets.forEach((t, ti) => fn(t.x, t.y, ti * (all ? 70 : 0), ti, t));
  switch (anim) {
    // ── おかん ──
    case 'okan_otama': // おたまで ポカッ: 大きな おたまが ふりおろされて、まんがの 星が あたまの うえを まわる
      each((x, y, d, ti) => {
        const hy = y - 8;
        fx.add({ kind: 'ladle3', x, y: hy, s: 1, a0: -2.5, a1: -0.25, swing: 85, life: 520, delay: d });
        const hd = d + 80;
        fx.impact(x, hy, { r: crit ? 22 : 17, delay: hd });
        fx.star(x, hy, '#fff6b0', crit ? 20 : 15, hd, 220);
        fx.shock(x, hy, { r0: 3, r1: 30, color: '#ffffff', w: 2.2, delay: hd, life: 260 });
        // こぼれる みそしる
        for (let k = 0; k < 8; k++) fx.drop(x + rnd(-6, 6), hy, { color: pick(['#d89040', '#b8702a', '#f0c070']), vx: rnd(-70, 70), vy: rnd(-110, -40), g: 300, size: rnd(1, 1.7), delay: hd, life: 560 });
        for (let k = 0; k < 4; k++) fx.add({ kind: 'cstar3', cx: x, cy: hy - 12, x, y: hy - 12, rx: 14, ry: 4.5, a0: (k / 4) * Math.PI * 2, spin: 7, size: 3.8, life: 1050, delay: hd + 40 });
        if (ti === 0) fx.hitStop(crit ? 180 : 110, hd, 1.1);
      });
      return true;
    case 'oyasumi': { // 早く ねなさい！: よぞらに なって 月が でて、ナイトキャップが あたまに のって、Zzz
      fx.tintAt('rgba(16, 24, 72, 0.42)', 1300);
      fx.add({ kind: 'moon3', x: W - 42, y: 26, r: 13, life: 1500 });
      for (let k = 0; k < 9; k++) fx.twinkle(rnd(14, W - 14), rnd(8, 54), { color: k % 2 ? '#fff6c0' : '#ffffff', size: rnd(2, 4), delay: k * 50, life: 900, spin: 2 });
      each((x, y, d, ti) => {
        const top = y - 16;
        fx.add({ kind: 'cap3', x, y: top, y0: top - 46, drop: 110, life: 1250, delay: d, c: CAP_COL[ti % CAP_COL.length] });
        fx.puff(x, y - 4, { color: '#c8d8ff', r0: 6, r1: 20, alpha: 0.55, delay: d + 60, life: 600 });
        fx.glow(x, y, { color: '#8aa0ff', r: 22, delay: d + 30, life: 500 });
        for (let k = 0; k < 3; k++) fx.add({ kind: 'zzz3', x: x + 10 + k * 6, y: y - 12 - k * 5, vx: 10, vy: -18, s: 0.8 + k * 0.3, life: 900, delay: d + 160 + k * 220 });
      });
      return true;
    }
    case 'slipper_smack': // スリッパで パーン！: 大きな ピンクの スリッパが はたいて、まんがの「パーン」
      each((x, y, d, ti) => {
        const hd = d + 60, k = all ? 0.8 : 1;
        // 「パーン」は スリッパの ななめ うえ。スリッパは あとから 足して まえに かく（かくれない ように）
        fx.add({ kind: 'pow3', x: x + 20 * k, y: Math.max(26, y - 26 * k), s: (crit ? 1.2 : 1) * k, life: 720, delay: hd, rot: rnd(-0.18, 0.05) });
        fx.add({ kind: 'slip3', x, y: y - 4, s: 1.45 * k, a0: -2.6, a1: -0.5, swing: 70, life: 640, delay: d });
        fx.shock(x, y - 4, { r0: 4, r1: 46, color: '#ffffff', w: 2.6, delay: hd, life: 300 });
        fx.speedLines(x, y - 4, { delay: hd, r1: 96, color: '#ffe0ec' });
        fx.burst(x, y - 4, ['#ffffff', '#ff9ac0', '#ffe066'], 16, 120, { delay: hd });
        if (ti === 0) { fx.flashAt(70, '#ffe0f0', hd); fx.hitStop(crit ? 220 : 160, hd, 1.4); }
      });
      return true;
    case 'okan_kaminari': { // おかんの かみなり: 「コラ!」の ふきだしが どーんと でて、きいろい いなずまが ぜんいんに おちる
      fx.flashAt(90, '#fff6c0', 30);
      fx.tintAt('rgba(40, 30, 0, 0.22)', 700);
      each((x, y, d, ti) => {
        const dd = d * 0.6;
        fx.zap(x + rnd(-6, 6), -4, x, y, { color: '#fff070', glow: '#ffb020', w: 2.6, delay: dd, life: 340, forks: 2 });
        fx.zap(x + rnd(-14, 14), -4, x + rnd(-6, 6), y + 4, { color: '#ffffff', glow: '#ffd040', w: 1.3, delay: dd + 90, life: 260, forks: 1 });
        fx.glow(x, y, { color: '#ffe060', r: 30, delay: dd, life: 420 });
        fx.star(x, y, '#fff6b0', crit ? 20 : 16, dd + 20, 260);
        fx.sparks(x, y, { colors: ['#ffffff', '#fff070', '#ffb020'], n: 16, speed: 160, delay: dd + 20, life: 380, len: 9 });
        fx.add({ kind: 'mark3', x: x + 12, y: y - 20, life: 700, delay: dd + 60 });
        if (ti === 0) fx.hitStop(200, dd + 20, 1.6);
      });
      // ふきだしは うえの ほうに（いなずまは その うしろから おちる）。
      // がめんの いちばん うえは 技の 名前の 札が かさなるので、その すぐ 下に
      fx.add({ kind: 'bubble3', x: W / 2, y: 46, text: 'コラ!', life: 1100 });
      return true;
    }
    // ── 社ちく・ブラックきぎょうの星 ──
    case 'manin_densha': { // まんいん電車: 人で ぎゅうぎゅうの 通勤電車が 敵を まとめて はねとばす
      const xs = targets.map((t) => t.x);
      const left = Math.min(...xs);
      const yRow = Math.min(H - 12, Math.max(...targets.map((t) => t.y)) + 16);
      // ひだりの はしから いっきに 1ばんめの 敵まで つっこみ（t1）、そのあとは すこし ゆっくり（かおが 見える）
      const x0 = -14, xh = Math.max(x0 + 1, left - 10), t1 = 70, v = 0.7;
      fx.add({ kind: 'mantrain3', x: x0, y: yRow, x0, xh, t1, v, life: t1 + (W + 200 - xh) / v });
      each((x, y, d, ti) => {
        const hd = t1 + Math.max(0, x - 10 - xh) / v;
        // でんしゃが くる まえの かぜ（すぐ ゆれる）と、ぶつかる しゅんかん
        fx.speedLines(x, y, { delay: 0, r0: 14, r1: 70, n: 12, life: 220, color: '#ffffff' });
        fx.puff(x - 10, y + 8, { color: '#e8e0d0', vx: 60, r0: 4, r1: 14, alpha: 0.6, life: 360 });
        fx.bigHit(x, y, { crit, heavy: true, delay: hd, color: '#ffb060' });
        fx.debris(x, y + 14, ['#d8c8b0', '#a89070', '#ffffff'], 8, hd, 110);
        if (ti === 0) fx.hitStop(240, hd, 1.6);
      });
      return true;
    }
    case 'black_star': // ブラックきぎょうの星: 赤黒い 星が いんせきの ように おちて、ズドン
      each((x, y, d, ti) => {
        const x0 = x - 72, y0 = -18;
        const hd = d + 90;
        fx.add({ kind: 'orb', x, y, color: '#ff4a3a', r: crit ? 26 : 20, life: 380, delay: hd });
        fx.star(x, y, '#ffe066', crit ? 24 : 19, hd, 260);
        fx.shock(x, y, { r0: 4, r1: 60, color: '#ff6a4a', w: 3, delay: hd, life: 360 });
        fx.shock(x, y + 14, { r0: 6, r1: 72, sy: 0.3, color: '#3a0408', w: 3, delay: hd, life: 460, add: false });
        for (let k = 0; k < 7; k++) fx.add({ kind: 'dflame3', x: x + rnd(-18, 18), y: y + 16, h: 14 + rnd(0, 14), w: 5 + rnd(0, 4), c1: '#1a0206', c2: '#b01420', c3: '#ff5a2a', ph: rnd(0, 6), vy: -16, life: 560 + rnd(0, 200), delay: hd + k * 15 });
        fx.burst(x, y, KI_RED, 26, 140, { delay: hd });
        fx.speedLines(x, y, { delay: hd, r1: 110, color: '#ffb0a0' });
        // 星は いちばん うえに かく（ほのおに かくれない ように）
        fx.add({ kind: 'dstar3', x0, y0, x1: x, y1: y, x: x0, y: y0, r: 9, travel: 90, life: 600, delay: d });
        if (ti === 0) { fx.flashAt(80, '#ff2a1a', hd); fx.hitStop(crit ? 320 : 260, hd, 2); fx.vignette('#600010', 700, 0.45); }
      });
      return true;
    // ── 天才しせつ管理者 ──
    case 'mieruka': // 見える化: 水色の HUD が 敵を スキャン。わくで ロックして、ぼうグラフと ％が でる
      fx.add({ kind: 'scan3', x: 0, y: 0, life: 640 });
      fx.add({ kind: 'grid3', x: W / 2, y: H / 2, life: 1300 });
      fx.add({ kind: 'hud3', x: 6, y: 8, text: '見える化', life: 1400 });
      fx.flashAt(50, '#bff4ff', 0);
      each((x, y, d, ti) => {
        fx.add({ kind: 'bracket3', x, y, w: 32, h: 30, life: 1300, delay: d * 0.6 });
        fx.add({ kind: 'chart3', x: Math.min(W - 16, x + 22), y: Math.max(14, y - 24), life: 1150, delay: 120 + d, seed: ti });
        fx.add({ kind: 'pct3', x, y: Math.min(H - 8, y + 24), n: 61 + ((ti * 37 + 13) % 38), life: 1100, delay: 200 + d });
        fx.glow(x, y, { color: '#38d8ff', r: 20, delay: d * 0.6, life: 380 });
        fx.sparks(x, y, { colors: ['#e8fdff', '#5ae4ff'], n: 10, speed: 90, delay: d * 0.6 + 40, life: 300, len: 6 });
      });
      return true;
    // ── はかい神 ──
    case 'hakai': // はかい: 敵の まわりに むらさきと くろの いなずまが はしって、ちりに なって くずれる
      fx.tintAt('rgba(30, 0, 40, 0.35)', 1100);
      each((x, y, d, ti, t) => {
        const w = Math.max(16, Math.min(96, t.w || 32)), h = Math.max(16, Math.min(96, t.h || 32));
        const cs = Math.max(3, Math.round(Math.min(w, h) / 11));
        fx.glow(x, y, { color: '#1a0028', r: 30, add: false, alpha: 0.75, delay: d, life: 700 });
        fx.glow(x, y, { color: '#b050ff', r: 20, delay: d, life: 420 });
        // くらい まくが 敵を おおって、うえから ちりに なって くずれる
        fx.add({ kind: 'crumble3', x, y, cells: crumbleCells(w, h, cs), cs, t0: 260, spread: 380, life: 1120, delay: d });
        for (let k = 0; k < 6; k++) {
          const a = rnd(0, Math.PI * 2), r = rnd(10, 22);
          fx.zap(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.8, x + Math.cos(a + 1.4) * r * 0.7, y + Math.sin(a + 1.4) * r * 0.6, { color: k % 2 ? '#d080ff' : '#ffffff', glow: '#6a10a0', w: 1.3, delay: d + k * 45, life: 220, forks: 1 });
        }
        fx.shock(x, y, { r0: 34, r1: 4, color: '#c070ff', w: 2, delay: d + 220, life: 160 });
        for (let k = 0; k < 24; k++) fx.add({ kind: 'dust3', x: x + rnd(-16, 16), y: y + rnd(-16, 18), vx: rnd(-14, 14) + 14, vy: rnd(-34, -8), g: -6, size: rnd(1, 2.4), color: pick(DUST), life: rnd(500, 850), delay: d + 300 + k * 14 });
        fx.burst(x, y, ['#d080ff', '#ffffff', '#3a0a4a'], 14, 60, { delay: d + 260 });
        if (ti === 0) fx.hitStop(160, d + 30, 1.2);
      });
      return true;
    case 'hakai_ball': { // はかいの 玉: 頭の うえで オレンジの 小さな 太陽が ふくらみ、敵の まん中に おちて 大ばくはつ
      const cx = W / 2, cy = 24;
      const tx = targets.reduce((a, t) => a + t.x, 0) / targets.length, ty = targets.reduce((a, t) => a + t.y, 0) / targets.length;
      fx.add({ kind: 'sun3', x: cx, y: cy, x0: cx, y0: cy, x1: tx, y1: ty, grow: 110, fall: 90, r: 15, life: 210 });
      const hd = 200;
      // ねつで すぐに 敵が ゆらぐ
      each((x, y, d) => {
        fx.glow(x, y, { color: '#ff7a1a', r: 18, delay: d * 0.4, life: 320 });
        fx.sparks(x, y + 8, { colors: ['#ffb040', '#fff2a0'], n: 8, speed: 50, ang: -Math.PI / 2, spread: 0.8, g: -60, delay: d * 0.4, life: 360, len: 4 });
      });
      fx.add({ kind: 'orb', x: tx, y: ty, color: '#ffb040', r: 52, life: 620, delay: hd });
      fx.shock(tx, ty, { r0: 10, r1: 150, color: '#fff2b0', w: 4, delay: hd, life: 520 });
      fx.shock(tx, ty + 16, { r0: 10, r1: 170, sy: 0.3, color: '#ff8a2a', w: 3, delay: hd + 40, life: 600 });
      each((x, y, d) => {
        fx.bigHit(x, y, { crit, heavy: true, delay: hd + d * 0.3, color: '#ffb040' });
        for (let k = 0; k < 4; k++) fx.puff(x + rnd(-10, 10), y + rnd(-8, 8), { color: pick(['#ff9a3a', '#ffd070', '#8a3a1a']), vx: rnd(-30, 30), vy: rnd(-40, -10), r0: 6, r1: 22, alpha: 0.8, delay: hd + 40 + k * 30, life: 700 });
        fx.debris(x, y + 12, ['#6a3a1a', '#a86a3a', '#ffd070'], 10, hd + 30, 140);
      });
      fx.flashAt(220, '#fff0c0', hd);
      fx.hitStop(380, hd, 2.4);
      fx.vignette('#a03000', 900, 0.5);
      return true;
    }
    // ── みかたに かける 技（がめんの した） ──
    case 'gohan': { // ごはん できたよ: あったかい ごはんと みそしる・ゆげ・あたたかい きらきら
      fx.tintAt('rgba(255, 170, 80, 0.12)', 1100);
      const by = H - 12;
      [[W / 2 - 44, 0], [W / 2, 1], [W / 2 + 44, 0]].forEach(([bx, v], k) => {
        fx.add({ kind: 'bowl3', x: bx, y: by, v, s: 1.15, life: 1350, delay: k * 70 });
        for (let j = 0; j < 3; j++) fx.add({ kind: 'steam3', x: bx - 6 + j * 6, y: by - 14, h: 24, ph: rnd(0, 6), life: 900, delay: 180 + k * 70 + j * 90 });
      });
      for (let k = 0; k < 16; k++) fx.twinkle(rnd(14, W - 14), rnd(H * 0.42, H - 10), { color: pick(['#ffe8a0', '#ffffff', '#ffb870']), size: rnd(3, 5), vy: -rnd(10, 30), delay: 120 + k * 40, life: 640, spin: 3 });
      each((x, y, d) => {
        fx.glow(x, y, { color: '#ffc870', r: 26, delay: d, life: 600 });
        for (let k = 0; k < 8; k++) fx.add({ x: x + rnd(-14, 14), y: y + 10, vx: 0, vy: -30 - rnd(0, 20), color: pick(['#ffe8a0', '#ffffff', '#ffb870']), life: 700, size: 1.6, delay: d + k * 30 });
      });
      return true;
    }
    case 'zangyou': { // ざんぎょう: よるの オフィス。かべの 時計の はりが ぐるぐる まわり、まどの あかりが つぎつぎ ついて、本人が ひかる
      fx.tintAt('rgba(10, 16, 48, 0.45)', 1400);
      fx.add({ kind: 'windows3', x: 0, y: H - 34, life: 1500 });
      fx.add({ kind: 'clock3', x: W / 2, y: 34, r: 17, life: 1450 });
      each((x, y, d) => {
        fx.glow(x, y, { color: '#ffe080', r: 34, delay: 200 + d, life: 900, grow: 0.8 });
        fx.add({ kind: 'ellipse', x, y: y + 20, color: '#ffe080', life: 700, delay: 260 + d, r1: 60 });
        for (let k = 0; k < 10; k++) fx.twinkle(x + rnd(-26, 26), y + rnd(-6, 20), { color: k % 2 ? '#fff6c0' : '#ffd860', size: rnd(2.5, 4.5), vy: -rnd(20, 40), delay: 280 + d + k * 50, life: 600, spin: 4 });
      });
      return true;
    }
    case 'black_aura': { // ブラックオーラ: 赤黒い ほのおが みかたから もえあがり、エナジードリンクの しゅわしゅわ
      fx.tintAt('rgba(60, 0, 0, 0.22)', 900);
      fx.flashAt(80, '#ff3a2a', 0);
      for (let k = 0; k < 22; k++) fx.add({ kind: 'dflame3', x: 8 + (k * (W - 16)) / 21 + rnd(-4, 4), y: H + 6, h: 24 + rnd(0, 24), w: 8 + rnd(0, 6), c1: '#1a0206', c2: '#b01420', c3: '#ff5a2a', ph: rnd(0, 6), vy: -22, life: 760 + rnd(0, 220), delay: k * 10 });
      fx.add({ kind: 'ellipse', x: W / 2, y: H - 8, color: '#ff4a3a', life: 640, r1: 130 });
      for (let k = 0; k < 3; k++) fx.add({ kind: 'can3', x: W / 2 + (k - 1) * 58, y: H - 24, vx: (k - 1) * 14, vy: -90, g: 140, rot: (k - 1) * 0.4, spin: k % 2 ? -1 : 1, life: 950, delay: 120 + k * 90 });
      for (let k = 0; k < 26; k++) fx.add({ kind: 'spark', x: rnd(20, W - 20), y: H - rnd(0, 20), vx: rnd(-10, 10), vy: -rnd(40, 90), g: -20, drag: 0.98, len: 3, color: pick(['#b8ff3a', '#f0ff60', '#ffffff']), size: 1.2, life: 700, delay: 150 + k * 18, add: true });
      each((x, y, d) => {
        fx.swirl(x, y, ['#ff3a2a', '#2a0408', '#ff9a6a'], { n: 22, rad: 20, h: 60, delay: d, life: 700, size: 2 });
        fx.glow(x, y, { color: '#ff2a1a', r: 30, delay: d, life: 500 });
      });
      fx.hitStop(120, 0, 0.8);
      return true;
    }
    case 'yochou_shield': { // 予兆シールド: みかたの うえに 水色の 六角形の ドーム。おちてくる「!」を スキャンして はじく
      const cx = W / 2, cy = H + 6, ry = 58;
      const hit = 640;
      fx.add({ kind: 'hexdome3', x: cx, y: cy, rx: 128, ry, hit, hx: cx + 34, hy: cy - ry, life: 1450 });
      fx.add({ kind: 'warn3', x: cx + 34, y: 18, y1: cy - ry - 6, hold: 300, hit, life: 1050 });
      fx.sparks(cx + 34, cy - ry, { colors: ['#ffffff', '#7aeaff', '#ffd020'], n: 22, speed: 150, ang: -Math.PI / 2, spread: 1.2, delay: hit, life: 420, len: 7 });
      fx.shock(cx + 34, cy - ry, { r0: 4, r1: 36, color: '#c8f8ff', w: 2, delay: hit, life: 320 });
      fx.flashAt(60, '#c8f8ff', hit);
      fx.hitStop(100, hit, 0.8);
      each((x, y, d) => fx.glow(x, y, { color: '#38d8ff', r: 26, delay: d, life: 600 }));
      return true;
    }
    case 'hirune': { // ひるね: 大きな まくらと ナイトキャップ、ふわふわの Zzz と はなちょうちん
      fx.tintAt('rgba(120, 140, 220, 0.16)', 1300);
      fx.add({ kind: 'pillow3', x: W / 2 - 8, y: H - 12, life: 1450 });
      fx.add({ kind: 'cap3', x: W / 2 + 14, y: H - 22, y0: H - 66, drop: 160, s: 1.2, c: CAP_COL[0], life: 1400 });
      fx.add({ kind: 'snot3', x: W / 2 + 34, y: H - 34, life: 1350, delay: 150 });
      for (let k = 0; k < 4; k++) fx.add({ kind: 'zbub3', x: W / 2 + 38 + k * 18, y: H - 46 - k * 14, vx: 8, vy: -14, s: 0.9 + k * 0.22, ph: k, life: 1000, delay: 120 + k * 170 });
      each((x, y, d) => {
        fx.glow(x, y, { color: '#a8b8ff', r: 26, delay: d, life: 600 });
        fx.add({ kind: 'zzz3', x: x - 14, y: y - 8, vx: -6, vy: -16, s: 0.9, life: 900, delay: d + 200 });
      });
      return true;
    }
    case 'hakai_aura': { // はかいの オーラ: むらさきの ほのおが もえあがり、オレンジの 火の粉が まう
      fx.flashAt(90, '#e0b0ff', 0);
      fx.tintAt('rgba(60, 0, 90, 0.2)', 900);
      for (let k = 0; k < 22; k++) fx.add({ kind: 'dflame3', x: 8 + (k * (W - 16)) / 21 + rnd(-4, 4), y: H + 6, h: 22 + rnd(0, 24), w: 8 + rnd(0, 6), c1: '#3a1060', c2: '#9a40e8', c3: '#f0b0ff', ph: rnd(0, 6), vy: -22, life: 760 + rnd(0, 220), delay: k * 10 });
      fx.add({ kind: 'ellipse', x: W / 2, y: H - 8, color: '#c070ff', life: 640, r1: 130 });
      fx.sparks(W / 2, H, { colors: ['#ffb040', '#ff7a1a', '#fff2a0'], n: 40, speed: 150, ang: -Math.PI / 2, spread: 0.9, g: -60, drag: 0.97, life: 800, len: 5 });
      each((x, y, d) => {
        fx.swirl(x, y, ['#c070ff', '#f0d8ff', '#ff9a3a'], { n: 22, rad: 20, h: 60, delay: d, life: 700, size: 2 });
        fx.glow(x, y, { color: '#a040f0', r: 30, delay: d, life: 500 });
      });
      fx.hitStop(120, 0, 0.9);
      return true;
    }
    default:
      return false;
  }
}
