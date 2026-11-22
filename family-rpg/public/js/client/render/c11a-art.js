// 第3部 第3章 第1幕（B）「星の船と、星座の島」の 魔物・星座のけもの・いかり船長 の え（shared/data/monsters-c11a.js）
// render/c9b-art.js の addC9bArt が addC11aArt を よぶ。かきかたは c10c-art.js と おなじ（g … w・h の わりあいで かく。f … コマ）
// ・色ちがい 6しゅ … ほしのうみクラゲ（星くらげ）・あまのがわエイ（空とびエイ）・ながれぼしトビウオ（トビウオン）・
//   ほしもりガニ（星座ガニ）・ほしのこひつじ（ひなたの星ひつじ）・しまのよるフクロウ（星読みフクロウ）
// ・新しい 絵 2つ … ほうきぼしウオ（光の しっぽの 魚）・ほしつなぎ（光の 糸を もつ 小さな 星の 子）
// ・ボスは 2倍の こまかさ（size は 2倍で かき、artScale: 0.5）
//   星座のけもの … 大きな 星（白い 五角の 星に 顔・水色の 光の かこみ）と、となりへ のびる 光の 線。あたま … 耳と 口・むね … まるい 星・しっぽ … ほうき
//     コマ 2・3 … 光が 弱い（よみがえる 前に 光りはじめる … client/battle-c11a.js が 光を かさねる）
//   いかり船長 イバリー … 大きな 青い ぼうし（星の かざり）・赤い コート・くるんと した ひげ・右手は 大きな いかり。足もとの 波に サメの せびれ
//     （チクタクザメは ねらえない ので 船長の え の 下に かく。おなかの 中で 時計の 光）
//     コマ 2・3 … にげる（帽子が とぶ・あせ・サメが 大きな 口を あけて 追う）
//   もとの お話の 絵は 使わない（かぎの 手・ワニは かかない。手は いかり・サメ）
import { fit, spark, bez } from './ch3-draw.js';

const EYE = ['#ffffff', '#1a1026'];
const pal = (P) => [...new Set([...Object.values(P), ...EYE])];

// ───── ほうきぼしウオ（光の しっぽを 引く 魚。48×40）─────
const CM = {
  B: '#3a5ac8', BD: '#22378a', BL: '#8ab0ff', // 体
  T: '#fff2a0', TL: '#ffffff', TD: '#ffc84a', // 光の しっぽ
  F: '#6a8ae8', // ひれ
  K: '#1a1026', W: '#ffffff',
};
function comet(g0, f) {
  const g = fit(g0, 48);
  const C = CM;
  const k = g.w / g.h;
  const sw = f ? 0.03 : -0.03;
  // 光の しっぽ（左へ ながく）
  g.poly([[0.42, 0.42], [0.02, 0.22 + sw], [0.1, 0.5], [0.02, 0.78 - sw], [0.42, 0.58]], C.TD);
  g.poly([[0.42, 0.45], [0.08, 0.32 + sw], [0.16, 0.5], [0.08, 0.68 - sw], [0.42, 0.55]], C.T);
  g.poly([[0.42, 0.47], [0.2, 0.44], [0.24, 0.5], [0.2, 0.56], [0.42, 0.53]], C.TL);
  for (const [x, y] of [[0.12, 0.3], [0.08, 0.66], [0.2, 0.5]]) spark(g, x, y + sw * 0.5, 0.035, C.T, C.TL);
  // 体（右むきの 魚）
  g.ell(0.62, 0.5, 0.26, 0.2, C.BD);
  g.ell(0.62, 0.48, 0.24, 0.17, C.B);
  g.ell(0.66, 0.56, 0.16, 0.07, C.BL);
  // せびれ・むなびれ
  g.poly([[0.52, 0.32], [0.62, 0.16 + sw], [0.7, 0.32]], C.F);
  g.poly([[0.6, 0.6], [0.56, 0.76 - sw], [0.68, 0.64]], C.F);
  // 体の 星の もよう
  spark(g, 0.56, 0.44, 0.03, C.T, C.TL);
  // 目・口
  g.ell(0.76, 0.44, 0.05, 0.05 * k, C.W);
  g.ell(0.77, 0.45, 0.026, 0.026 * k, C.K);
  g.line([[0.84, 0.54], [0.88, 0.52]], C.BD, 1.4);
}

// ───── ほしつなぎ（光の 糸を もつ 小さな 星の 子。40×44）─────
const WS = {
  S: '#ffe878', SD: '#d8b040', SL: '#fff8d0', // 星の 体
  R: '#bfe8ff', // 光の 糸
  P: '#ff9ab0', K: '#1a1026', W: '#ffffff',
};
function wisp(g0, f) {
  const g = fit(g0, 40);
  const C = WS;
  const k = g.w / g.h;
  const up = f ? 0.03 : 0;
  // 光の 糸（くるくる）
  g.line(bez([[0.78, 0.6 - up], [0.96, 0.5], [0.86, 0.86], [0.66, 0.8]], 10), C.R, 1.6);
  spark(g, 0.66, 0.8, 0.05, C.R, C.W);
  // 星の 体（五角）
  const cx = 0.48, cy = 0.46 - up;
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const r = i % 2 ? 0.17 : 0.38;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * k]);
  }
  g.poly(pts, C.SD);
  g.poly(pts.map(([x, y]) => [cx + (x - cx) * 0.9, cy + (y - cy) * 0.9]), C.S);
  g.ell(cx - 0.08, cy - 0.1, 0.07, 0.04, C.SL);
  // 顔
  for (const ex of [cx - 0.07, cx + 0.07]) { g.ell(ex, cy + 0.01, 0.035, 0.04 * k, C.W); g.ell(ex, cy + 0.015, 0.02, 0.024 * k, C.K); }
  g.ell(cx - 0.14, cy + 0.08, 0.03, 0.015, C.P);
  g.ell(cx + 0.14, cy + 0.08, 0.03, 0.015, C.P);
  g.line(bez([[cx - 0.04, cy + 0.09], [cx, cy + 0.12], [cx + 0.04, cy + 0.09]], 6), C.SD, 1.2);
  // 手（糸を もつ）
  g.line([[cx + 0.26, cy + 0.08], [0.78, 0.6 - up]], C.SD, 2);
}

// ───── 星座のけもの（3つの 星。2倍の こまかさ）─────
// 白い 星の 体 ＋ 水色の 光の かこみ ＋ となりへ のびる 光の 線。dim … 光が 弱い（コマ 2・3）
const BS = {
  S: '#f4f8ff', SD: '#a8c4e8', SL: '#ffffff', // 星
  G: '#bfe8ff', GD: '#6aa8e0', // 光の かこみ・線
  E: '#3a5ac8', // ひとみ
  M: '#2a3a6a', // 口
  K: '#1a1026', W: '#ffffff', P: '#ffb0c8',
};
function starShape(g, cx, cy, r, rin, col, k, rot = 0) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + rot + i * Math.PI / 5;
    const rr = i % 2 ? rin : r;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * k]);
  }
  g.poly(pts, col);
}
function beastStar(g0, f, part) {
  const g = fit(g0, 96);
  const C = BS;
  const k = g.w / g.h;
  const dim = f >= 2;
  const fr = f % 2;
  const up = fr ? 0.015 : 0;
  const cx = 0.5, cy = 0.5 - up;
  // 光の 線（となりの 星へ）
  const lines = part === 'head' ? [[0.98, 0.7]] : part === 'tail' ? [[0.02, 0.4]] : [[0.02, 0.36], [0.98, 0.64]];
  for (const [x, y] of lines) {
    g.line([[cx, cy], [x, y]], dim ? C.GD : C.G, dim ? 1 : 2.2);
    if (!dim) g.line([[cx, cy], [x, y]], C.SL, 0.8);
  }
  // 光の かこみ
  if (!dim) {
    g.ell(cx, cy, 0.4, 0.4 * k, C.GD);
    g.ell(cx, cy, 0.37, 0.37 * k, C.G);
  }
  const R = part === 'chest' ? 0.33 : 0.3;
  // あたま … 耳（星の とがり 2つ）・しっぽ … ほうき（光の ふさ）
  if (part === 'head') {
    g.poly([[cx - 0.2, cy - 0.12], [cx - 0.28, cy - 0.42], [cx - 0.06, cy - 0.22]], dim ? C.SD : C.S);
    g.poly([[cx + 0.2, cy - 0.12], [cx + 0.28, cy - 0.42], [cx + 0.06, cy - 0.22]], dim ? C.SD : C.S);
  }
  if (part === 'tail') {
    for (const [dy, dx] of [[-0.18, 0.1], [0, 0.14], [0.18, 0.1]]) g.line(bez([[cx + 0.2, cy], [cx + 0.34, cy + dy * 0.5], [cx + 0.42 + dx * 0.2, cy + dy + (fr ? 0.03 : -0.03)]], 8), dim ? C.SD : C.G, 3);
  }
  starShape(g, cx, cy, R, R * 0.5, dim ? '#8a98b8' : C.SD, k);
  starShape(g, cx, cy, R * 0.9, R * 0.45, dim ? '#c8d0e0' : C.S, k);
  g.ell(cx - 0.06, cy - 0.08, 0.06, 0.04, dim ? '#d8e0f0' : C.SL);
  // 顔（あたま … きりっと・口・きば ／ むね … まるい 目 ／ しっぽ … 目だけ）
  const ey = cy + (part === 'head' ? 0.0 : 0.02);
  for (const ex of [cx - 0.08, cx + 0.08]) {
    if (dim) g.line([[ex - 0.03, ey + 0.01], [ex + 0.03, ey + 0.01]], C.M, 1.4);
    else { g.ell(ex, ey, 0.04, 0.045 * k, C.W); g.ell(ex, ey + 0.005, 0.025, 0.03 * k, C.E); g.ell(ex - 0.01, ey - 0.01, 0.008, 0.008 * k, C.W); }
  }
  if (part === 'head' && !dim) {
    g.poly([[cx - 0.08, ey + 0.08], [cx + 0.08, ey + 0.08], [cx, ey + 0.14]], C.M);
    g.poly([[cx - 0.05, ey + 0.08], [cx - 0.03, ey + 0.11], [cx - 0.01, ey + 0.08]], C.W);
    g.poly([[cx + 0.01, ey + 0.08], [cx + 0.03, ey + 0.11], [cx + 0.05, ey + 0.08]], C.W);
  }
  if (part === 'chest' && !dim) {
    g.ell(cx - 0.14, ey + 0.07, 0.03, 0.015, C.P);
    g.ell(cx + 0.14, ey + 0.07, 0.03, 0.015, C.P);
    spark(g, cx, ey + 0.12, 0.03, C.G, C.W);
  }
  if (!dim) for (const [x, y] of [[0.16, 0.18], [0.84, 0.2], [0.8, 0.84]]) spark(g, x, y + (fr ? 0.02 : 0), 0.025, C.G, C.W);
}

// ───── いかり船長 イバリー と チクタクザメ（224×224）─────
const CP = {
  H: '#2a3a7a', HD: '#1a2450', HL: '#4a5aa8', // ぼうし
  Y: '#ffd860', // 星の かざり・金ボタン
  R: '#c83a3a', RD: '#8a2424', RL: '#e86a5a', // 赤い コート
  S: '#f4d4b0', SD: '#d0a880', // はだ
  M: '#5a3a24', ML: '#8a5a3a', // ひげ・まゆ
  A: '#7a7a8a', AD: '#4a4a5a', AL: '#b8b8c8', // いかり
  B: '#3a2a1a', // ブーツ・ベルト
  N: '#4a6a9a', ND: '#2a4068', NL: '#8ab0d8', // サメ
  T: '#ffe070', // 時計の 光
  O: '#2a4a8a', OL: '#6a9ad8', // 波
  K: '#1a1026', W: '#ffffff', P: '#ff9a9a',
};
function captain(g0, f) {
  const g = fit(g0, 224);
  const C = CP;
  const k = g.w / g.h;
  const run = f >= 2;
  const fr = f % 2;
  const up = fr ? 0.008 : 0;
  // 波（下）
  g.rect(0, 0.88, 1, 0.12, C.O);
  for (let i = 0; i < 6; i++) g.ell(0.08 + i * 0.17 + (fr ? 0.02 : 0), 0.885, 0.07, 0.02, C.OL);
  // チクタクザメ（ねらえない。波の 中）
  if (run) {
    // 大きな 口を あけて 追いかける（左下）
    g.poly([[0.0, 0.98], [0.06, 0.7], [0.34, 0.66], [0.44, 0.78], [0.3, 0.84], [0.42, 0.9], [0.3, 0.98]], C.ND);
    g.poly([[0.02, 0.96], [0.08, 0.72], [0.32, 0.68], [0.4, 0.78], [0.28, 0.84], [0.38, 0.9], [0.28, 0.96]], C.N);
    for (let i = 0; i < 5; i++) g.poly([[0.2 + i * 0.04, 0.78], [0.22 + i * 0.04, 0.82], [0.24 + i * 0.04, 0.78]], C.W);
    for (let i = 0; i < 4; i++) g.poly([[0.22 + i * 0.04, 0.86], [0.24 + i * 0.04, 0.83], [0.26 + i * 0.04, 0.86]], C.W);
    g.ell(0.18, 0.74, 0.02, 0.02 * k, C.W);
    g.ell(0.18, 0.745, 0.01, 0.01 * k, C.K);
    spark(g, 0.12, 0.88, 0.03, C.T, C.W);
  } else {
    // せびれが ぐるぐる（コマで 動く）
    const sx = fr ? 0.2 : 0.78;
    g.poly([[sx - 0.06, 0.89], [sx + 0.02, 0.76], [sx + 0.06, 0.89]], C.ND);
    g.poly([[sx - 0.04, 0.89], [sx + 0.02, 0.78], [sx + 0.04, 0.89]], C.N);
    spark(g, sx + 0.1, 0.93, 0.02, C.T, C.W);
  }
  const bx = run ? 0.58 : 0.5; // 船長の まん中
  const lean = run ? 0.04 : 0;
  // 足（ブーツ）
  if (run) {
    g.line([[bx - 0.04, 0.64], [bx - 0.12, 0.8]], C.B, 9);
    g.line([[bx + 0.04, 0.64], [bx + 0.12, 0.76]], C.B, 9);
  } else {
    for (const x of [bx - 0.06, bx + 0.06]) { g.rect(x - 0.03, 0.66 - up, 0.06, 0.18, C.B); g.ell(x + 0.01, 0.85, 0.05, 0.02, C.K); }
  }
  // コート
  g.poly([[bx - 0.16 + lean, 0.34 - up], [bx + 0.16 + lean, 0.34 - up], [bx + 0.2, 0.7 - up], [bx - 0.2, 0.7 - up]], C.RD);
  g.poly([[bx - 0.14 + lean, 0.35 - up], [bx + 0.14 + lean, 0.35 - up], [bx + 0.18, 0.68 - up], [bx - 0.18, 0.68 - up]], C.R);
  g.poly([[bx - 0.02 + lean, 0.36 - up], [bx + 0.02 + lean, 0.36 - up], [bx + 0.03, 0.68 - up], [bx - 0.03, 0.68 - up]], C.RL);
  g.rect(bx - 0.17, 0.54 - up, 0.34, 0.03, C.B);
  g.rect(bx - 0.03, 0.535 - up, 0.06, 0.04, C.Y);
  for (const y of [0.4, 0.46]) for (const x of [bx - 0.06 + lean, bx + 0.06 + lean]) g.ell(x, y - up, 0.01, 0.01 * k, C.Y);
  // 左うで（ふつうの 手）
  if (run) {
    g.line([[bx - 0.12 + lean, 0.4 - up], [bx - 0.26, 0.3]], C.RD, 8);
    g.ell(bx - 0.27, 0.29, 0.025, 0.025 * k, C.S);
  } else {
    g.line([[bx - 0.13, 0.4 - up], [bx - 0.2, 0.52 - up]], C.RD, 8);
    g.ell(bx - 0.2, 0.54 - up, 0.025, 0.025 * k, C.S);
  }
  // 右うで … 大きな いかり
  const ax = run ? bx + 0.24 : bx + 0.25, ay = run ? 0.36 : 0.5 - up;
  g.line([[bx + 0.13 + lean, 0.4 - up], [ax - 0.02, ay - 0.04]], C.RD, 8);
  g.rect(ax - 0.012, ay - 0.14, 0.024, 0.24, C.AD);
  g.rect(ax - 0.008, ay - 0.14, 0.016, 0.24, C.A);
  g.ell(ax, ay - 0.16, 0.03, 0.03 * k, C.AD);
  g.ell(ax, ay - 0.16, 0.016, 0.016 * k, C.K);
  g.rect(ax - 0.06, ay - 0.08, 0.12, 0.02, C.A);
  g.line(bez([[ax - 0.09, ay + 0.04], [ax, ay + 0.14], [ax + 0.09, ay + 0.04]], 8), C.A, 5);
  g.poly([[ax - 0.11, ay + 0.06], [ax - 0.08, ay + 0.01], [ax - 0.06, ay + 0.06]], C.AL);
  g.poly([[ax + 0.11, ay + 0.06], [ax + 0.08, ay + 0.01], [ax + 0.06, ay + 0.06]], C.AL);
  // 顔
  const hx = bx + lean * 1.5, hy = 0.26 - up;
  g.ell(hx, hy, 0.085, 0.085 * k, C.SD);
  g.ell(hx, hy - 0.004, 0.08, 0.08 * k, C.S);
  g.ell(hx, hy + 0.03, 0.025, 0.02, C.P); // 赤い はな
  // まゆ（えらそう ／ にげる 時は 八の字）
  if (run) { g.line([[hx - 0.06, hy - 0.04], [hx - 0.02, hy - 0.055]], C.M, 2.4); g.line([[hx + 0.06, hy - 0.04], [hx + 0.02, hy - 0.055]], C.M, 2.4); }
  else { g.line([[hx - 0.06, hy - 0.06], [hx - 0.02, hy - 0.04]], C.M, 2.4); g.line([[hx + 0.06, hy - 0.06], [hx + 0.02, hy - 0.04]], C.M, 2.4); }
  // 目（にげる 時は 白目を むいて まるい）
  for (const ex of [hx - 0.035, hx + 0.035]) {
    if (run) { g.ell(ex, hy - 0.01, 0.022, 0.026 * k, C.W); g.ell(ex, hy - 0.016, 0.008, 0.01 * k, C.K); }
    else { g.ell(ex, hy - 0.012, 0.016, 0.012 * k, C.W); g.ell(ex + 0.004, hy - 0.012, 0.008, 0.008 * k, C.K); }
  }
  // くるんと した ひげ
  g.line(bez([[hx - 0.005, hy + 0.05], [hx - 0.06, hy + 0.06], [hx - 0.09, hy + 0.02]], 8), C.M, 4);
  g.line(bez([[hx + 0.005, hy + 0.05], [hx + 0.06, hy + 0.06], [hx + 0.09, hy + 0.02]], 8), C.M, 4);
  if (run) g.ell(hx, hy + 0.075, 0.02, 0.016, C.K); // 「ひえ〜」の 口
  // ぼうし（大きな 三角の 船長ぼうし。にげる 時は とんで いる）
  const py = run ? hy - 0.16 - (fr ? 0.03 : 0) : hy - 0.06;
  const px = run ? hx - 0.1 : hx;
  g.poly([[px - 0.17, py + 0.02], [px, py - 0.1], [px + 0.17, py + 0.02], [px, py - 0.01]], C.HD);
  g.poly([[px - 0.15, py + 0.01], [px, py - 0.085], [px + 0.15, py + 0.01], [px, py - 0.015]], C.H);
  g.line([[px - 0.15, py + 0.01], [px + 0.15, py + 0.01]], C.Y, 2);
  spark(g, px, py - 0.035, 0.028, C.Y, C.W);
  if (run) {
    // あせ
    for (const [x, y] of [[hx + 0.1, hy - 0.04], [hx - 0.11, hy], [hx + 0.12, hy + 0.04]]) g.ell(x, y + (fr ? 0.01 : 0), 0.008, 0.014, C.OL);
  }
}

export function addC11aArt(ART) {
  // 色ちがい（今の 絵。新しい 絵では ない）
  if (ART.star_jelly) ART.c11a_jelly = { ...ART.star_jelly, tint: { hueTo: 225, sat: 0.75, light: 0.85 } };
  if (ART.sky_ray) ART.c11a_ray = { ...ART.sky_ray, tint: { hueTo: 205, sat: 0.35, light: 1.2 } };
  if (ART.tobiuo) ART.c11a_tobi = { ...ART.tobiuo, tint: { hueTo: 45, sat: 0.8, light: 1.1 } };
  if (ART.crab_star) ART.c11a_crab = { ...ART.crab_star, tint: { hueTo: 200, sat: 0.45, light: 1.15 } };
  if (ART.sun_ram) ART.c11a_ram = { ...ART.sun_ram, tint: { hueTo: 230, sat: 0.5, light: 0.95 } };
  if (ART.star_owl) ART.c11a_owl = { ...ART.star_owl, tint: { hueTo: 270, sat: 0.6, light: 0.8 } };
  // 新しい 絵（ほうきぼしウオ・ほしつなぎ）
  ART.c11a_comet = { size: [48, 40], pal: pal(CM), draw: comet };
  ART.c11a_wisp = { size: [40, 44], pal: pal(WS), draw: wisp };
  // ボス（2倍の こまかさ。monsters-c11a.js の artScale 0.5。台本の showMon でも 大きく）
  ART.c11a_beast_head = { size: [96, 96], npc: 0.6, pal: pal(BS).concat(['#8a98b8', '#c8d0e0', '#d8e0f0']), draw: (g, f) => beastStar(g, f, 'head') };
  ART.c11a_beast_chest = { size: [112, 112], npc: 0.6, pal: pal(BS).concat(['#8a98b8', '#c8d0e0', '#d8e0f0']), draw: (g, f) => beastStar(g, f, 'chest') };
  ART.c11a_beast_tail = { size: [96, 96], npc: 0.6, pal: pal(BS).concat(['#8a98b8', '#c8d0e0', '#d8e0f0']), draw: (g, f) => beastStar(g, f, 'tail') };
  ART.c11a_captain = { size: [224, 224], npc: 0.6, pal: pal(CP), draw: captain };
}
