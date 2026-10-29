// 第5章 Step 3・4（B）「クモイ地方」と「しずみゆく島の古い神殿」の 魔物と ガイアイーターの え（shared/data/monsters-kumoi.js）
// render/monsters.js が addKumoiArt を よぶ。かきかたは ch5-tower-art.js と おなじ（g … w・h の わりあいで かく。f … 0 か 1 の コマ）
// ガイアイーター: gaia_eater … 体ぜんぶ（図鑑・台本の showMon('gaia_eater')）。戦いでは 部位ごとの え
//   gaia_tail（しっぽ・左）・gaia_body（体・まん中）・gaia_head（頭・右。client/battle-gaia.js の gaiaSprite）。
//   3つを 左から ならべると 1ぴきの 大ムカデに 見える（ふしの つなぎめが まどの はしに かかる）
import { fit, bez, taper, spark } from './ch3-draw.js?v=060276fb0270';

// 部分の わくの 中に かく（x0, y0 … わくの 左上、sx, sy … わくの 大きさ。どれも 0〜1）
function sub(g, x0, y0, sx, sy) {
  const P = (pts) => pts.map(([x, y]) => [x0 + x * sx, y0 + y * sy]);
  return {
    w: g.w * sx, h: g.h * sy,
    ell: (cx, cy, rx, ry, c, rot) => g.ell(x0 + cx * sx, y0 + cy * sy, rx * sx, ry * sy, c, rot),
    poly: (pts, c) => g.poly(P(pts), c),
    rect: (x, y, w, h, c) => g.rect(x0 + x * sx, y0 + y * sy, w * sx, h * sy, c),
    line: (pts, c, lw = 1) => g.line(P(pts), c, lw * Math.min(1, sx * 1.4)),
    dot: (x, y, c) => g.dot(x0 + x * sx, y0 + y * sy, c),
  };
}

// ───── 雲ひつじ ─────
const SHEEP = {
  W: '#f4f6ff', WL: '#ffffff', WS: '#c8cee8', WD: '#9aa2c8', // 雲の 毛
  F: '#5a5470', FD: '#3a344e', // 顔・足
  H: '#e8c88a', HD: '#b08a4a', // つの
  E: '#ffe8a0', P: '#1a1026', N: '#ff9ab0',
};
// 雲ひつじ: もこもこの 雲の 毛の ひつじ（ななめ前）。まるい つの・小さな 顔・細い 足。コマ1で 毛が ふくらむ
function cloudSheep(g0, f) {
  const g = fit(g0, 52);
  const C = SHEEP;
  const k = g.w / g.h;
  const R = (x, y, r, c) => g.ell(x, y, r, r * k, c);
  const p = f ? 0.012 : 0;
  // 足
  for (const x of [0.32, 0.44, 0.6, 0.7]) {
    g.rect(x - 0.02, 0.7, 0.04, 0.2, C.FD);
    g.rect(x - 0.015, 0.7, 0.025, 0.18, C.F);
  }
  // 雲の 毛（まるい かたまり）
  const puffs = [[0.3, 0.52, 0.14], [0.45, 0.4, 0.16], [0.6, 0.42, 0.15], [0.7, 0.56, 0.13], [0.5, 0.62, 0.17], [0.34, 0.66, 0.12], [0.62, 0.68, 0.12]];
  for (const [x, y, r] of puffs) R(x, y + 0.02, r + p, C.WD);
  for (const [x, y, r] of puffs) R(x, y, r + p, C.WS);
  for (const [x, y, r] of puffs) R(x - r * 0.15, y - r * 0.2, r * 0.8 + p, C.W);
  for (const [x, y, r] of puffs.slice(0, 4)) R(x - r * 0.3, y - r * 0.4, r * 0.35, C.WL);
  // 顔（左がわ）
  g.ell(0.2, 0.46, 0.09, 0.12, C.FD);
  g.ell(0.2, 0.45, 0.075, 0.105, C.F);
  // つの（くるり）
  for (const s of [-1, 1]) {
    const cx = 0.2 + s * 0.08;
    R(cx, 0.36, 0.05, C.HD);
    R(cx, 0.36, 0.035, C.H);
    R(cx + s * 0.005, 0.365, 0.015, C.HD);
  }
  // 頭の 上の 毛
  R(0.2, 0.32, 0.06, C.W);
  R(0.18, 0.3, 0.03, C.WL);
  // 目・鼻
  for (const s of [-1, 1]) {
    R(0.2 + s * 0.035, 0.45, 0.018, C.E);
    R(0.2 + s * 0.035, 0.452, 0.009, C.P);
  }
  g.ell(0.2, 0.53, 0.025, 0.015, C.N);
}

// ───── 空とびエイ ─────
const RAY = {
  B: '#4a7ab8', BL: '#7aa8e0', BH: '#b8d8ff', BD: '#2a4a80', BDD: '#16264a', // せなか
  U: '#e8f0ff', // おなか
  Y: '#ffe040', YL: '#fffbc0', // 雷
  E: '#1a1026', EL: '#ffffff',
};
// 空とびエイ: 大きな ひれを 広げて 空を およぐ エイ（上から 少し）。長い しっぽの 先に 雷。コマ1で ひれの 先が 上がる
function skyRay(g0, f) {
  const g = fit(g0, 64);
  const C = RAY;
  const k = g.w / g.h;
  const R = (x, y, r, c) => g.ell(x, y, r, r * k, c);
  const up = f ? -0.12 : 0;
  // しっぽ（下へ のびて 右へ まがる）
  const tail = bez([[0.52, 0.6], [0.56, 0.82], [0.7, 0.9], [0.84, 0.82]], 10);
  taper(g, tail, 0.04, 0.012, C.BDD);
  // しっぽの 先の 雷
  g.poly([[0.82, 0.66], [0.88, 0.76], [0.85, 0.77], [0.92, 0.92], [0.82, 0.8], [0.86, 0.79]], f ? C.YL : C.Y);
  // ひれ（左右に 大きく 広げる。先が 上下する）
  for (const s of [-1, 1]) {
    const X = (x) => 0.5 + s * x;
    g.poly([[X(0.06), 0.36], [X(0.3), 0.3 + up * 0.5], [X(0.48), 0.24 + up], [X(0.44), 0.42 + up * 0.6], [X(0.3), 0.6], [X(0.08), 0.66]], C.BDD);
    g.poly([[X(0.07), 0.38], [X(0.3), 0.32 + up * 0.5], [X(0.46), 0.27 + up], [X(0.42), 0.42 + up * 0.6], [X(0.29), 0.58], [X(0.08), 0.63]], C.B);
    g.poly([[X(0.08), 0.4], [X(0.28), 0.34 + up * 0.5], [X(0.42), 0.3 + up], [X(0.24), 0.44]], C.BL);
    // ひれの 白い 雲の もよう
    g.ell(X(0.22), 0.44, 0.03, 0.04, C.BH);
    g.ell(X(0.34), 0.38 + up * 0.5, 0.02, 0.03, C.BH);
  }
  // 体（まん中）
  g.ell(0.5, 0.5, 0.13, 0.2, C.BDD);
  g.ell(0.5, 0.49, 0.12, 0.18, C.B);
  g.ell(0.5, 0.56, 0.08, 0.1, C.U);
  g.ell(0.48, 0.4, 0.06, 0.06, C.BL);
  // 頭の ひれ（つのの ような 2本）
  for (const s of [-1, 1]) {
    g.poly([[0.5 + s * 0.06, 0.34], [0.5 + s * 0.12, 0.14], [0.5 + s * 0.1, 0.33]], C.BD);
    g.poly([[0.5 + s * 0.07, 0.33], [0.5 + s * 0.11, 0.18], [0.5 + s * 0.095, 0.32]], C.BL);
  }
  // 目
  for (const s of [-1, 1]) {
    R(0.5 + s * 0.08, 0.4, 0.022, C.EL);
    R(0.5 + s * 0.08, 0.402, 0.012, C.E);
  }
  // 雷の 火花
  if (f) spark(g, 0.9, 0.66, 0.05, C.Y, C.YL);
}

// ───── かみなりぐも ─────
const PUFF = {
  C: '#7a7e98', CL: '#a8aac0', CH: '#d0d2e2', CD: '#4e5270', CDD: '#2e3048', // 雲
  Y: '#ffe040', YL: '#fffbc0', // いなずま
  E: '#ffffff', P: '#1a1026', M: '#2a1a3a',
};
// かみなりぐも: ゴロゴロ 鳴る 小さな 雷雲（正面）。おこった 目・ぎざぎざの 口。下に いなずま。コマ1で いなずまが 光る
function thunderPuff(g0, f) {
  const g = fit(g0, 40);
  const C = PUFF;
  const k = g.w / g.h;
  const R = (x, y, r, c) => g.ell(x, y, r, r * k, c);
  // いなずま（下へ）
  const bolt = (dx, c) => g.poly([[0.42 + dx, 0.62], [0.52 + dx, 0.62], [0.47 + dx, 0.76], [0.56 + dx, 0.76], [0.4 + dx, 0.98], [0.44 + dx, 0.8], [0.36 + dx, 0.8]], c);
  bolt(0, f ? C.YL : C.Y);
  if (f) bolt(0.26, C.Y);
  // 雲
  const puffs = [[0.24, 0.5, 0.17], [0.42, 0.36, 0.2], [0.62, 0.38, 0.18], [0.78, 0.52, 0.15], [0.5, 0.56, 0.22]];
  for (const [x, y, r] of puffs) R(x, y + 0.03, r, C.CDD);
  for (const [x, y, r] of puffs) R(x, y, r, C.CD);
  for (const [x, y, r] of puffs) R(x - r * 0.12, y - r * 0.15, r * 0.82, C.C);
  for (const [x, y, r] of puffs.slice(0, 4)) R(x - r * 0.3, y - r * 0.38, r * 0.4, C.CL);
  R(0.38, 0.26, 0.05, C.CH);
  // おこった 目
  for (const s of [-1, 1]) {
    const x = 0.5 + s * 0.12;
    R(x, 0.48, 0.055, C.E);
    R(x + s * 0.01, 0.49, 0.028, C.P);
    g.poly([[x - 0.08, 0.4 + (s < 0 ? 0 : 0.03)], [x + 0.08, 0.4 + (s < 0 ? 0.03 : 0)], [x + 0.08, 0.43 + (s < 0 ? 0.03 : 0)], [x - 0.08, 0.43 + (s < 0 ? 0 : 0.03)]], C.CDD);
  }
  // ぎざぎざの 口
  g.poly([[0.4, 0.6], [0.45, 0.57], [0.5, 0.6], [0.55, 0.57], [0.6, 0.6], [0.55, 0.64], [0.45, 0.64]], C.M);
}

// ───── 雲海へび ─────
const SERP = {
  B: '#5aa898', BL: '#8ad0bc', BH: '#c8f0e0', BD: '#2e7064', BDD: '#1a4038', // うろこ
  U: '#f0e8c0', // おなか
  W: '#ffffff', WS: '#d8e4f4', // 雲
  E: '#ff5a3a', EL: '#ffd0a0', K: '#f0c860', // 目・ひげ・ひれ
};
// 雲海へび: 雲の 海から 顔を 出す 長い へび（S字）。ひげと 金の ひれ。下に 雲。コマ1で 体を くねらせる
function skySerpent(g0, f) {
  const g = fit(g0, 60);
  const C = SERP;
  const k = g.w / g.h;
  const R = (x, y, r, c) => g.ell(x, y, r, r * k, c);
  const s = f ? 0.04 : 0;
  // 体（S字）
  const body = bez([[0.92, 0.82], [0.8, 0.5 - s], [0.55, 0.95], [0.42, 0.55 + s], [0.3, 0.25], [0.2, 0.32]], 18);
  taper(g, body, 0.08, 0.13, C.BDD);
  taper(g, body, 0.065, 0.11, C.BD);
  taper(g, body.map(([x, y]) => [x - 0.006, y - 0.012]), 0.04, 0.07, C.B);
  // おなかの すじ
  for (let i = 3; i < body.length - 2; i += 2) {
    const [x, y] = body[i];
    R(x + 0.012, y + 0.02, 0.012, C.U);
  }
  // せなかの 金の ひれ
  for (let i = 4; i < body.length - 3; i += 4) {
    const [x, y] = body[i];
    g.poly([[x - 0.03, y - 0.04], [x, y - 0.12], [x + 0.03, y - 0.04]], C.K);
  }
  // うろこの 光
  for (let i = 2; i < body.length - 2; i += 3) {
    const [x, y] = body[i];
    R(x - 0.01, y - 0.02, 0.008, C.BH);
  }
  // 頭
  g.ell(0.17, 0.3, 0.11, 0.09, C.BDD);
  g.ell(0.17, 0.29, 0.1, 0.08, C.BD);
  g.ell(0.15, 0.27, 0.07, 0.05, C.BL);
  g.poly([[0.06, 0.3], [0.1, 0.36], [0.18, 0.35]], C.U);
  // ひげ
  g.line([[0.08, 0.32], [0.03, 0.42 + s], [0.04, 0.5]], C.K, 1);
  g.line([[0.12, 0.33], [0.1, 0.45 - s], [0.14, 0.52]], C.K, 1);
  // 目
  R(0.18, 0.25, 0.022, C.EL);
  R(0.183, 0.252, 0.013, C.E);
  // 雲の 海（下）
  const sea = [[0.12, 0.9, 0.14], [0.32, 0.92, 0.15], [0.52, 0.91, 0.14], [0.72, 0.92, 0.15], [0.88, 0.9, 0.12]];
  for (const [x, y, r] of sea) g.ell(x, y, r, r * 0.45, C.WS);
  for (const [x, y, r] of sea) g.ell(x - 0.02, y - 0.02, r * 0.8, r * 0.3, C.W);
}

// ───── 石の守り手 ─────
const KEEP = {
  S: '#8a8670', SL: '#b0ac94', SH: '#d4d0b8', SD: '#5e5a48', SDD: '#363428', // 古い 石
  M: '#6a8a4a', ML: '#9ac06a', // こけ
  G: '#5affb0', GL: '#d0fff0', // 光る もじ
};
// 石の守り手: 古い 神殿の 石の 守り手（正面）。四角い 体・大きな うで・顔は 古い 仮面。体の もじが 光る。コマ1で 光が 強く・うでが 上がる
function stoneKeeper(g0, f) {
  const g = fit(g0, 46);
  const C = KEEP;
  const k = g.w / g.h;
  const R = (x, y, r, c) => g.ell(x, y, r, r * k, c);
  const lift = f ? -0.04 : 0;
  // 足
  for (const s of [-1, 1]) {
    const x = 0.5 + s * 0.14;
    g.rect(x - 0.09, 0.76, 0.18, 0.2, C.SDD);
    g.rect(x - 0.08, 0.76, 0.16, 0.18, C.SD);
    g.rect(x - 0.08, 0.76, 0.05, 0.18, C.S);
  }
  // うで（大きな 石の かたまり）
  for (const s of [-1, 1]) {
    const x = 0.5 + s * 0.36;
    g.poly([[x - 0.12, 0.34 + lift], [x + 0.12, 0.34 + lift], [x + 0.13, 0.72 + lift], [x - 0.13, 0.72 + lift]], C.SDD);
    g.poly([[x - 0.11, 0.35 + lift], [x + 0.11, 0.35 + lift], [x + 0.12, 0.7 + lift], [x - 0.12, 0.7 + lift]], C.SD);
    g.poly([[x - 0.1, 0.36 + lift], [x - 0.02, 0.36 + lift], [x - 0.04, 0.68 + lift], [x - 0.1, 0.68 + lift]], C.S);
    g.rect(x - 0.12, 0.52 + lift, 0.24, 0.02, C.SDD);
  }
  // 体
  g.poly([[0.26, 0.3], [0.74, 0.3], [0.78, 0.8], [0.22, 0.8]], C.SDD);
  g.poly([[0.27, 0.31], [0.73, 0.31], [0.76, 0.78], [0.24, 0.78]], C.SD);
  g.poly([[0.28, 0.32], [0.62, 0.32], [0.6, 0.76], [0.26, 0.76]], C.S);
  g.poly([[0.3, 0.33], [0.4, 0.33], [0.38, 0.74], [0.28, 0.74]], C.SL);
  // ひび
  g.line([[0.6, 0.4], [0.55, 0.5], [0.6, 0.58]], C.SDD, 0.9);
  // 光る もじ（むね）
  const gc = f ? C.GL : C.G;
  g.line([[0.42, 0.46], [0.5, 0.42], [0.58, 0.46], [0.5, 0.56], [0.42, 0.46]], gc, 1.1);
  g.line([[0.5, 0.56], [0.5, 0.66]], gc, 1.1);
  g.line([[0.44, 0.62], [0.56, 0.62]], gc, 1.1);
  // 頭（仮面）
  g.poly([[0.36, 0.06], [0.64, 0.06], [0.68, 0.3], [0.32, 0.3]], C.SDD);
  g.poly([[0.37, 0.07], [0.63, 0.07], [0.66, 0.29], [0.34, 0.29]], C.S);
  g.poly([[0.38, 0.08], [0.5, 0.08], [0.48, 0.28], [0.36, 0.28]], C.SH);
  // 目（光る 線）・口
  for (const s of [-1, 1]) g.rect(0.5 + s * 0.08 - 0.04, 0.15, 0.08, 0.03, gc);
  g.rect(0.44, 0.23, 0.12, 0.02, C.SDD);
  // こけ
  R(0.3, 0.12, 0.03, C.M);
  R(0.7, 0.66, 0.035, C.M);
  R(0.29, 0.11, 0.015, C.ML);
  R(0.7, 0.65, 0.016, C.ML);
  R(0.16, 0.38 + lift, 0.025, C.M);
}

// ───── 岩もぐら ─────
const MOLE = {
  B: '#7a5a42', BL: '#a07a5a', BD: '#4e3626', BDD: '#2e1e14', // 毛
  N: '#ff8aa0', ND: '#c85a72', // 鼻
  C: '#d8d0c0', CD: '#9a9080', // ツメ
  R: '#8a8a9a', RL: '#b4b4c4', // 岩
  E: '#1a1026',
};
// 岩もぐら: 岩を かかえた もぐら（ななめ前）。大きな ツメ・ピンクの 鼻・小さな 目。コマ1で ツメを ふり上げる
function rockMole(g0, f) {
  const g = fit(g0, 44);
  const C = MOLE;
  const k = g.w / g.h;
  const R = (x, y, r, c) => g.ell(x, y, r, r * k, c);
  const up = f ? -0.08 : 0;
  // 岩（足もと）
  for (const [x, y, r] of [[0.16, 0.86, 0.1], [0.84, 0.88, 0.09], [0.5, 0.92, 0.07]]) {
    R(x, y, r, C.R);
    R(x - r * 0.3, y - r * 0.3, r * 0.4, C.RL);
  }
  // 体
  g.ell(0.52, 0.6, 0.3, 0.3, C.BDD);
  g.ell(0.52, 0.59, 0.28, 0.28, C.BD);
  g.ell(0.5, 0.56, 0.24, 0.24, C.B);
  g.ell(0.44, 0.48, 0.12, 0.1, C.BL);
  // 鼻づら
  g.ell(0.38, 0.52, 0.1, 0.07, C.BD);
  R(0.3, 0.52, 0.045, C.ND);
  R(0.295, 0.515, 0.03, C.N);
  // 目
  R(0.42, 0.42, 0.02, C.E);
  R(0.56, 0.42, 0.02, C.E);
  // ツメ（左右）
  for (const s of [-1, 1]) {
    const x = 0.5 + s * 0.3, y = 0.6 + (s < 0 ? up : 0);
    g.ell(x, y, 0.08, 0.07, C.BD);
    for (const d of [-0.04, 0, 0.04]) g.poly([[x + d - 0.02, y + 0.02], [x + d + 0.02, y + 0.02], [x + d + s * 0.04, y + 0.16]], C.CD);
    for (const d of [-0.04, 0, 0.04]) g.poly([[x + d - 0.012, y + 0.02], [x + d + 0.012, y + 0.02], [x + d + s * 0.03, y + 0.13]], C.C);
  }
}

// ───── つちくいムカデ ─────
const LARVA = {
  B: '#a8542e', BL: '#d8804a', BH: '#f0b07a', BD: '#6e3018', BDD: '#3a180c', // ふし
  L: '#e8c890', LD: '#a8884e', // 足
  P: '#b05aff', PL: '#e8c0ff', // 毒の キバ
  E: '#ffe060',
};
// ムカデの ふし 1つ（x, y … まんなか、r … 大きさ）
function segment(g, x, y, r, C, k) {
  g.ell(x, y + r * 0.1, r * 1.05, r * 0.95 * k, C.BDD);
  g.ell(x, y, r, r * 0.85 * k, C.BD);
  g.ell(x - r * 0.08, y - r * 0.1 * k, r * 0.82, r * 0.62 * k, C.B);
  g.ell(x - r * 0.25, y - r * 0.32 * k, r * 0.35, r * 0.22 * k, C.BL);
}
// つちくいムカデ: 体を まるめた ムカデの 子ども（よこ）。たくさんの 足と 毒の キバ。コマ1で 足が 動く・頭を もち上げる
function gaiaLarva(g0, f) {
  const g = fit(g0, 56);
  const C = LARVA;
  const k = g.w / g.h;
  const pts = bez([[0.92, 0.7], [0.75, 0.86], [0.45, 0.82], [0.3, 0.62], [0.24, f ? 0.32 : 0.38]], 7);
  // 足
  pts.forEach(([x, y], i) => {
    if (i === pts.length - 1) return;
    for (const s of [-1, 1]) {
      const sw = (i + (f ? 1 : 0)) % 2 ? 0.02 : -0.02;
      g.line([[x, y + 0.04], [x + s * 0.04 + sw, y + 0.16], [x + s * 0.05 + sw, y + 0.2]], C.LD, 1.4);
      g.line([[x, y + 0.04], [x + s * 0.04 + sw, y + 0.15]], C.L, 0.8);
    }
  });
  // ふし
  pts.forEach(([x, y], i) => {
    if (i === pts.length - 1) return;
    segment(g, x, y, 0.075 + i * 0.006, C, k);
  });
  // 頭
  const [hx, hy] = pts[pts.length - 1];
  segment(g, hx, hy, 0.1, C, k);
  g.ell(hx - 0.02, hy - 0.03, 0.04, 0.025, C.BH);
  // しょっかく
  g.line([[hx + 0.02, hy - 0.08], [hx + 0.08, hy - 0.22], [hx + 0.14, hy - 0.26]], C.BD, 1.1);
  g.line([[hx - 0.03, hy - 0.08], [hx - 0.06, hy - 0.24], [hx - 0.02, hy - 0.3]], C.BD, 1.1);
  // 毒の キバ
  for (const s of [-1, 1]) {
    g.poly([[hx - 0.06, hy + 0.04 * s + 0.02], [hx - 0.17, hy + 0.06 * s + 0.06], [hx - 0.08, hy + 0.06]], C.P);
    g.poly([[hx - 0.07, hy + 0.04 * s + 0.03], [hx - 0.13, hy + 0.05 * s + 0.06], [hx - 0.08, hy + 0.055]], C.PL);
  }
  // 目
  g.ell(hx - 0.04, hy - 0.04, 0.015, 0.015 * k, C.E);
  g.ell(hx + 0.01, hy - 0.05, 0.015, 0.015 * k, C.E);
}

// ───── はにわ兵 ─────
const HANI = {
  C: '#c88a5a', CL: '#e8b080', CH: '#f8d0a8', CD: '#94603a', CDD: '#5a361e', // 土
  H: '#1a0e08', // 目と 口の あな
  S: '#7a7a8a', SL: '#b0b0c0', // やりの 先
  W: '#8a5a32', // やりの え
  R: '#c83a2a', // かざり
};
// はにわ兵: 古代の 土の 人形の 兵（正面）。つつの 体・あなの 目と 口・頭の かざり・土の やり。コマ1で 口が 大きく あく（歌）
function haniwaSoldier(g0, f) {
  const g = fit(g0, 40);
  const C = HANI;
  const k = g.w / g.h;
  const R = (x, y, r, c) => g.ell(x, y, r, r * k, c);
  // やり（右手）
  g.rect(0.8, 0.08, 0.035, 0.84, C.W);
  g.poly([[0.817, 0.0], [0.86, 0.1], [0.817, 0.14], [0.775, 0.1]], C.S);
  g.poly([[0.817, 0.02], [0.84, 0.09], [0.817, 0.11]], C.SL);
  // 台（下の つつ）
  g.poly([[0.32, 0.72], [0.68, 0.72], [0.72, 0.98], [0.28, 0.98]], C.CDD);
  g.poly([[0.33, 0.72], [0.67, 0.72], [0.7, 0.96], [0.3, 0.96]], C.CD);
  for (const y of [0.8, 0.88]) g.rect(0.3, y, 0.4, 0.015, C.CDD);
  // 体（つつ）
  g.poly([[0.3, 0.34], [0.7, 0.34], [0.72, 0.74], [0.28, 0.74]], C.CDD);
  g.poly([[0.31, 0.35], [0.69, 0.35], [0.71, 0.73], [0.29, 0.73]], C.C);
  g.poly([[0.32, 0.36], [0.44, 0.36], [0.42, 0.72], [0.3, 0.72]], C.CL);
  g.rect(0.29, 0.56, 0.42, 0.03, C.R);
  // うで（左は 上に、右は やりを もつ）
  g.poly([[0.3, 0.42], [0.16, 0.3], [0.12, 0.34], [0.28, 0.5]], C.CD);
  g.poly([[0.7, 0.42], [0.8, 0.5], [0.8, 0.56], [0.7, 0.5]], C.CD);
  R(0.13, 0.3, 0.035, C.C);
  // 頭
  g.ell(0.5, 0.22, 0.17, 0.16, C.CDD);
  g.ell(0.5, 0.215, 0.155, 0.145, C.C);
  g.ell(0.45, 0.18, 0.08, 0.07, C.CH);
  // 頭の かざり（みずら）
  for (const s of [-1, 1]) {
    R(0.5 + s * 0.17, 0.28, 0.04, C.CD);
    R(0.5 + s * 0.17, 0.27, 0.025, C.CL);
  }
  // あなの 目と 口
  for (const s of [-1, 1]) g.ell(0.5 + s * 0.065, 0.2, 0.03, 0.022, C.H);
  g.ell(0.5, 0.28, f ? 0.035 : 0.025, f ? 0.04 : 0.018, C.H);
}

// ───── 雲間のゆうれい ─────
const WRAITH = {
  W: '#e8eeff', WL: '#ffffff', WS: '#b8c4e8', WD: '#8090c0', WDD: '#4a5688', // 雲の 体
  E: '#2a1a4a', EL: '#7ad8ff', // 目の あな・光
};
// 雲間のゆうれい: 雲で できた ゆうれい（正面）。長い うで・ぽっかり あいた 目。下は きりに なって 消える。コマ1で うでを のばす
function cloudWraith(g0, f) {
  const g = fit(g0, 50);
  const C = WRAITH;
  const k = g.w / g.h;
  const R = (x, y, r, c) => g.ell(x, y, r, r * k, c);
  const reach = f ? 0.03 : 0;
  // きりの すそ
  for (const [x, y, r] of [[0.32, 0.86, 0.1], [0.5, 0.9, 0.12], [0.68, 0.86, 0.1], [0.42, 0.78, 0.12], [0.6, 0.78, 0.12]]) R(x, y, r, C.WD);
  for (const [x, y, r] of [[0.42, 0.76, 0.1], [0.6, 0.76, 0.1]]) R(x, y, r, C.WS);
  // うで
  for (const s of [-1, 1]) {
    const arm = bez([[0.5 + s * 0.12, 0.42], [0.5 + s * 0.3, 0.38], [0.5 + s * (0.37 + reach), 0.52], [0.5 + s * (0.4 + reach), 0.62]], 8);
    taper(g, arm, 0.07, 0.03, C.WDD);
    taper(g, arm, 0.05, 0.02, C.WS);
    // ゆび
    const [ex, ey] = arm[arm.length - 1];
    for (const d of [-0.025, 0, 0.025]) g.line([[ex, ey], [ex + d + s * 0.01, ey + 0.07]], C.WS, 1);
  }
  // 体
  g.ell(0.5, 0.48, 0.18, 0.28, C.WDD);
  g.ell(0.5, 0.46, 0.16, 0.26, C.WS);
  g.ell(0.47, 0.4, 0.12, 0.18, C.W);
  g.ell(0.44, 0.3, 0.06, 0.08, C.WL);
  // 目と 口（あな）
  for (const s of [-1, 1]) {
    g.ell(0.5 + s * 0.06, 0.36, 0.035, 0.05, C.E);
    R(0.5 + s * 0.06, 0.37, f ? 0.016 : 0.01, C.EL);
  }
  g.ell(0.5, 0.5, 0.04, 0.06, C.E);
}

// ───── 雷雲ワイバーン ─────
const WYV = {
  B: '#4a4e6a', BL: '#6e7290', BH: '#9a9eb8', BD: '#2e3048', BDD: '#1a1a2a', // うろこ
  M: '#3a3e5a', ML: '#5a5e7e', // つばさの まく
  Y: '#ffe040', YL: '#fffbc0', // 雷の もよう
  E: '#ff4a2a', T: '#f0ead8', // 目・キバ
};
// 雷雲ワイバーン: つばさを 広げて とぶ 竜（正面）。体に 雷の もよう。コマ1で つばさが 上がり、雷が 光る
function cloudWyvern(g0, f) {
  const g = fit(g0, 64);
  const C = WYV;
  const k = g.w / g.h;
  const R = (x, y, r, c) => g.ell(x, y, r, r * k, c);
  const up = f ? -0.08 : 0;
  // つばさ
  for (const s of [-1, 1]) {
    const X = (x) => 0.5 + s * x;
    g.poly([[X(0.08), 0.42], [X(0.22), 0.12 + up], [X(0.48), 0.08 + up], [X(0.44), 0.36 + up * 0.5], [X(0.38), 0.5], [X(0.28), 0.44], [X(0.2), 0.58], [X(0.12), 0.52]], C.BDD);
    g.poly([[X(0.1), 0.42], [X(0.22), 0.15 + up], [X(0.46), 0.11 + up], [X(0.42), 0.36 + up * 0.5], [X(0.37), 0.47], [X(0.28), 0.41], [X(0.2), 0.55], [X(0.13), 0.5]], C.M);
    g.poly([[X(0.12), 0.4], [X(0.22), 0.18 + up], [X(0.3), 0.16 + up], [X(0.2), 0.4]], C.ML);
    g.line([[X(0.1), 0.42], [X(0.22), 0.15 + up], [X(0.46), 0.11 + up]], C.BL, 1.4);
    // つばさの 雷
    g.line([[X(0.3), 0.2 + up], [X(0.34), 0.28 + up * 0.7], [X(0.31), 0.3 + up * 0.7], [X(0.36), 0.38]], f ? C.YL : C.Y, 1);
  }
  // しっぽ
  const tail = bez([[0.5, 0.74], [0.6, 0.9], [0.76, 0.92], [0.84, 0.82]], 10);
  taper(g, tail, 0.06, 0.015, C.BD);
  g.poly([[0.84, 0.76], [0.9, 0.82], [0.83, 0.86]], C.Y);
  // 足
  for (const s of [-1, 1]) {
    g.ell(0.5 + s * 0.08, 0.76, 0.04, 0.06, C.BD);
    for (const d of [-0.02, 0.02]) g.poly([[0.5 + s * 0.08 + d - 0.01, 0.8], [0.5 + s * 0.08 + d + 0.01, 0.8], [0.5 + s * 0.08 + d, 0.86]], C.T);
  }
  // 体
  g.ell(0.5, 0.56, 0.13, 0.2, C.BDD);
  g.ell(0.5, 0.55, 0.115, 0.185, C.B);
  g.ell(0.48, 0.5, 0.07, 0.12, C.BL);
  // むねの 雷
  g.poly([[0.49, 0.46], [0.53, 0.46], [0.5, 0.54], [0.54, 0.54], [0.47, 0.66], [0.49, 0.57], [0.46, 0.57]], f ? C.YL : C.Y);
  // 首と 頭
  g.poly([[0.45, 0.4], [0.55, 0.4], [0.54, 0.3], [0.46, 0.3]], C.BD);
  g.ell(0.5, 0.24, 0.09, 0.08, C.BDD);
  g.ell(0.5, 0.235, 0.08, 0.07, C.B);
  g.ell(0.48, 0.21, 0.04, 0.03, C.BH);
  // つの
  for (const s of [-1, 1]) g.poly([[0.5 + s * 0.05, 0.18], [0.5 + s * 0.11, 0.06], [0.5 + s * 0.07, 0.19]], C.BL);
  // 目・口
  for (const s of [-1, 1]) R(0.5 + s * 0.035, 0.23, 0.014, C.E);
  g.poly([[0.45, 0.28], [0.55, 0.28], [0.5, 0.31]], C.BDD);
  g.poly([[0.46, 0.28], [0.475, 0.28], [0.467, 0.3]], C.T);
  g.poly([[0.525, 0.28], [0.54, 0.28], [0.533, 0.3]], C.T);
}

// ═════ ガイアイーター（島の 土を 食べる 大ムカデ）═════
export const GAIA_PAL = {
  B: '#7a5232', BL: '#a87a4e', BH: '#d0a478', BD: '#4a301c', BDD: '#26180c', // こうら（土の 色）
  R: '#b0402a', RL: '#e0704a', // ふしの へり（赤）
  L: '#dcc890', LD: '#9a8452', // 足・おなか
  S: '#6a7a4a', SL: '#94a86a', // こうらに のった 土と こけ
  K: '#8a8a96', KL: '#b8b8c4', // 岩
  E: '#ffe040', EL: '#fffbe0', // 目
  M: '#4a1410', F: '#f0e8d0', // 口の 中・キバ
  P: '#b45aff', PL: '#f0c8ff', // 毒ばり
};
const GP = GAIA_PAL;

// 大きな ふし 1つ（x, y … まんなか、rx, ry … 大きさ、spikes … せなかの とげ、rock … こうらに 岩と 土）
function bigSegment(g, x, y, rx, ry, { spikes = 2, rock = false, legs = 2, f = 0 } = {}) {
  // 足（とがった 長い 足。前へ・うしろへ ひらく。先は 白い）
  for (let i = 0; i < legs; i++) {
    const lx = x - rx * 0.55 + (legs > 1 ? (i / (legs - 1)) * rx * 1.1 : 0.55 * rx);
    const out = i % 2 ? 1 : -1;
    const sw = (i + f) % 2 ? rx * 0.1 : -rx * 0.1;
    const knee = [lx + out * rx * 0.3 + sw, y + ry * 0.95];
    const foot = [lx + out * rx * 0.22 + sw, y + ry * 1.45];
    g.line([[lx, y + ry * 0.4], knee, foot], GP.BDD, 2.4);
    g.line([[lx, y + ry * 0.4], knee, foot], GP.R, 1.3);
    g.line([knee, foot], GP.LD, 1.1);
    g.line([[foot[0] - out * rx * 0.02, foot[1] - ry * 0.12], foot], GP.L, 1);
  }
  // とげ（せなかに 大きく）
  for (let i = 0; i < spikes; i++) {
    const sx = x - rx * 0.5 + (spikes > 1 ? (i / (spikes - 1)) * rx : rx * 0.5);
    g.poly([[sx - rx * 0.16, y - ry * 0.7], [sx + rx * 0.08, y - ry * 1.5], [sx + rx * 0.18, y - ry * 0.7]], GP.BDD);
    g.poly([[sx - rx * 0.08, y - ry * 0.76], [sx + rx * 0.07, y - ry * 1.36], [sx + rx * 0.1, y - ry * 0.76]], GP.BL);
  }
  // こうら（よこに 長い いた。下は 平ら）
  const plate = (k, dy, c) => g.poly([
    [x - rx * k, y + ry * 0.55 + dy], [x - rx * k, y - ry * 0.1 + dy], [x - rx * 0.8 * k, y - ry * 0.65 * k + dy], [x - rx * 0.35 * k, y - ry * 0.95 * k + dy],
    [x + rx * 0.35 * k, y - ry * 0.95 * k + dy], [x + rx * 0.8 * k, y - ry * 0.65 * k + dy], [x + rx * k, y - ry * 0.1 + dy], [x + rx * k, y + ry * 0.55 + dy],
  ], c);
  plate(1.06, ry * 0.08, GP.BDD);
  plate(1, 0, GP.R);
  plate(0.9, -ry * 0.04, GP.BD);
  plate(0.76, -ry * 0.12, GP.B);
  // こうらの すじ
  g.line([[x - rx * 0.7, y - ry * 0.3], [x, y - ry * 0.55], [x + rx * 0.7, y - ry * 0.3]], GP.BD, 1);
  g.ell(x - rx * 0.3, y - ry * 0.56, rx * 0.3, ry * 0.12, GP.BL);
  g.ell(x - rx * 0.38, y - ry * 0.62, rx * 0.1, ry * 0.05, GP.BH);
  // へりの 光
  g.line([[x - rx * 0.98, y + ry * 0.05], [x - rx * 0.98, y + ry * 0.5], [x + rx * 0.5, y + ry * 0.55]], GP.RL, 1);
  // おなか
  g.rect(x - rx * 0.8, y + ry * 0.5, rx * 1.6, ry * 0.14, GP.L);
  g.rect(x - rx * 0.8, y + ry * 0.6, rx * 1.6, ry * 0.05, GP.LD);
  if (rock) {
    // こうらに のった 岩と 土・こけ
    g.ell(x + rx * 0.2, y - ry * 0.62, rx * 0.34, ry * 0.24, GP.S);
    g.ell(x + rx * 0.14, y - ry * 0.7, rx * 0.2, ry * 0.12, GP.SL);
    g.ell(x - rx * 0.24, y - ry * 0.6, rx * 0.2, ry * 0.18, GP.K);
    g.ell(x - rx * 0.28, y - ry * 0.66, rx * 0.1, ry * 0.08, GP.KL);
  }
}

// しっぽ（わくいっぱい）: 左へ だんだん 細く なる ふしと、上に まがった 毒ばり。右の はしは 体へ つづく
function gaiaTailIn(g, f) {
  const lift = f ? -0.06 : 0;
  // 右から 左へ（右の はしが 体へ）
  const segs = [[0.2, 0.36 + lift, 0.08, 0.12], [0.33, 0.48 + lift * 0.5, 0.1, 0.14], [0.5, 0.56, 0.12, 0.17], [0.69, 0.6, 0.14, 0.19], [0.86, 0.62, 0.13, 0.2]];
  segs.forEach(([x, y, rx, ry], i) => bigSegment(g, x, y, rx, ry, { spikes: i > 1 ? 2 : 1, legs: i > 0 ? 2 : 0, f, rock: i === 3 }));
  // 毒ばり（上に まがる）
  const st = bez([[0.18, 0.3 + lift], [0.1, 0.17 + lift], [0.16, 0.08 + lift], [0.28, 0.1 + lift]], 10);
  taper(g, st, 0.07, 0.02, GP.BD);
  taper(g, st.map(([x, y]) => [x + 0.005, y - 0.01]), 0.04, 0.01, GP.P);
  g.poly([[0.27, 0.07 + lift], [0.36, 0.11 + lift], [0.28, 0.14 + lift]], GP.PL);
  g.ell(0.14, 0.15 + lift, 0.02, 0.025, GP.PL);
}

// 体（わくいっぱい）: 大きな ふし 3つ。こうらに 岩と 土。左右の はしが しっぽ・頭へ つづく
function gaiaBodyIn(g, f) {
  const bob = f ? 0.015 : 0;
  bigSegment(g, 0.17, 0.6, 0.17, 0.24, { spikes: 2, legs: 2, f });
  bigSegment(g, 0.5, 0.55 + bob, 0.21, 0.29, { spikes: 3, legs: 3, f: f ? 0 : 1, rock: true });
  bigSegment(g, 0.83, 0.6, 0.17, 0.25, { spikes: 2, legs: 2, f });
}

// 頭（わくいっぱい）: 左下から 首の ふしが 上がって、右上に 大きな 頭。大あごと キバ・たくさんの 目・しょっかく
function gaiaHeadIn(g, f) {
  const open = f ? 0.05 : 0;
  // 首の ふし
  bigSegment(g, 0.12, 0.74, 0.12, 0.17, { spikes: 1, legs: 2, f });
  bigSegment(g, 0.3, 0.6, 0.13, 0.18, { spikes: 2, legs: 2, f: f ? 0 : 1 });
  // しょっかく
  g.line([[0.52, 0.24], [0.42, 0.08], [0.3, 0.02]], GP.BD, 2.2);
  g.line([[0.68, 0.24], [0.8, 0.07], [0.94, 0.04]], GP.BD, 2.2);
  g.line([[0.52, 0.24], [0.42, 0.08]], GP.BL, 0.9);
  g.line([[0.68, 0.24], [0.8, 0.07]], GP.BL, 0.9);
  // 頭の こうら（よこに ひろい かぶとの 形）
  const head = (k, dy, c) => g.poly([[0.6 - 0.3 * k, 0.52 + dy], [0.6 - 0.29 * k, 0.34 + dy], [0.6 - 0.2 * k, 0.24 + dy], [0.6, 0.2 + dy - 0.02 * k],
    [0.6 + 0.2 * k, 0.24 + dy], [0.6 + 0.29 * k, 0.34 + dy], [0.6 + 0.3 * k, 0.52 + dy], [0.6 + 0.18 * k, 0.6 + dy], [0.6 - 0.18 * k, 0.6 + dy]], c);
  head(1.06, 0.02, GP.BDD);
  head(1, 0, GP.R);
  head(0.9, -0.01, GP.BD);
  head(0.74, -0.03, GP.B);
  g.line([[0.6, 0.22], [0.6, 0.4]], GP.BD, 1.2);
  g.ell(0.5, 0.28, 0.08, 0.04, GP.BL);
  g.ell(0.47, 0.27, 0.03, 0.02, GP.BH);
  // 頭の とげ（かんむり）
  for (const [x, h] of [[0.44, 0.1], [0.56, 0.14], [0.68, 0.12], [0.78, 0.08]]) {
    g.poly([[x - 0.04, 0.24], [x, 0.24 - h], [x + 0.04, 0.24]], GP.BDD);
    g.poly([[x - 0.02, 0.23], [x, 0.25 - h], [x + 0.02, 0.23]], GP.BL);
  }
  // 口の 中（大きく あく）
  g.ell(0.6, 0.62 + open * 0.5, 0.16, 0.08 + open, GP.M);
  // 大あご（左右から まがる キバ）
  for (const s of [-1, 1]) {
    const jaw = bez([[0.6 + s * 0.14, 0.52], [0.6 + s * 0.26, 0.66 + open], [0.6 + s * 0.16, 0.84 + open], [0.6 + s * 0.04, 0.8 + open]], 10);
    taper(g, jaw, 0.09, 0.02, GP.BDD);
    taper(g, jaw.map(([x, y]) => [x, y - 0.01]), 0.06, 0.012, GP.F);
  }
  // 口の キバ（小さい）
  for (const x of [0.54, 0.6, 0.66]) g.poly([[x - 0.015, 0.58], [x + 0.015, 0.58], [x, 0.64 + open]], GP.F);
  // 目（たくさん。光る）
  for (const [x, y, r] of [[0.5, 0.42, 0.035], [0.7, 0.42, 0.035], [0.44, 0.36, 0.022], [0.76, 0.36, 0.022], [0.55, 0.47, 0.018], [0.65, 0.47, 0.018]]) {
    g.ell(x, y, r * 1.3, r * 1.3, GP.BDD);
    g.ell(x, y, r, r, f ? GP.EL : GP.E);
    g.ell(x - r * 0.3, y - r * 0.3, r * 0.35, r * 0.35, GP.EL);
  }
  // 頭に のった 土
  g.ell(0.72, 0.24, 0.06, 0.03, GP.S);
  g.ell(0.71, 0.23, 0.03, 0.015, GP.SL);
  g.ell(0.38, 0.32, 0.03, 0.02, GP.K);
  g.ell(0.375, 0.315, 0.015, 0.01, GP.KL);
}

function gaiaTail(g0, f) { gaiaTailIn(fit(g0, 64), f); }
function gaiaBody(g0, f) { gaiaBodyIn(fit(g0, 92), f); }
function gaiaHead(g0, f) { gaiaHeadIn(fit(g0, 80), f); }
// 体ぜんぶ（図鑑・showMon）: しっぽ・体・頭を 1まいに。うしろに 土けむり
function gaiaWhole(g0, f) {
  const g = fit(g0, 120);
  // 足もとの われた 地面（岩の かけら）
  g.line([[0.04, 0.97], [0.2, 0.95], [0.32, 0.98], [0.5, 0.95], [0.66, 0.98], [0.9, 0.96]], GP.K, 1.2);
  for (const [x, y, r] of [[0.12, 0.95, 0.025], [0.42, 0.96, 0.02], [0.74, 0.95, 0.025]]) {
    g.ell(x, y, r, r * 0.6, GP.K);
    g.ell(x - r * 0.2, y - r * 0.2, r * 0.5, r * 0.3, GP.KL);
  }
  gaiaTailIn(sub(g, 0, 0.42, 0.3, 0.52), f);
  gaiaBodyIn(sub(g, 0.26, 0.38, 0.42, 0.56), f);
  gaiaHeadIn(sub(g, 0.58, 0.0, 0.42, 0.88), f);
}

export function addKumoiArt(ART) {
  // クモイ地方（とぶ 魔物は よこに ひろい）
  ART.cloud_sheep = { size: [52, 44], pal: Object.values(SHEEP), draw: cloudSheep };
  ART.sky_ray = { size: [64, 40], pal: Object.values(RAY), draw: skyRay };
  ART.thunder_puff = { size: [40, 34], pal: Object.values(PUFF), draw: thunderPuff };
  ART.sky_serpent = { size: [60, 46], pal: Object.values(SERP), draw: skySerpent };
  // しずみゆく島の 古い神殿
  ART.stone_keeper = { size: [46, 60], pal: Object.values(KEEP), draw: stoneKeeper };
  ART.rock_mole = { size: [44, 38], pal: Object.values(MOLE), draw: rockMole };
  ART.gaia_larva = { size: [56, 40], pal: Object.values(LARVA), draw: gaiaLarva };
  ART.haniwa_soldier = { size: [40, 60], pal: Object.values(HANI), draw: haniwaSoldier };
  // 雲が 入った 所
  ART.cloud_wraith = { size: [50, 48], pal: Object.values(WRAITH), draw: cloudWraith };
  ART.cloud_wyvern = { size: [64, 50], pal: Object.values(WYV), draw: cloudWyvern };
  // ガイアイーター: 体ぜんぶ（図鑑・showMon）と、戦いの 部位（左から しっぽ・体・頭。ならべると 1ぴきに 見える 大きさ）
  // （部位の パレットは 使う 色だけ: しっぽに 目と 口は ない・体に 毒ばりは ない）
  const but = (...no) => Object.entries(GAIA_PAL).filter(([k]) => !no.includes(k)).map(([, c]) => c);
  // （フィールドの 大きな NPC 'mon:gaia_eater' … 7階の 広間。npc の 大きさは 星の竜・古竜と おなじ）
  ART.gaia_eater = { size: [124, 96], npc: 0.6, pal: Object.values(GAIA_PAL), draw: gaiaWhole };
  ART.gaia_tail = { size: [64, 54], pal: but('E', 'EL', 'M', 'F'), draw: gaiaTail };
  ART.gaia_body = { size: [92, 62], pal: but('E', 'EL', 'M', 'F', 'P', 'PL'), draw: gaiaBody };
  ART.gaia_head = { size: [80, 86], pal: but('P', 'PL'), draw: gaiaHead };
}
