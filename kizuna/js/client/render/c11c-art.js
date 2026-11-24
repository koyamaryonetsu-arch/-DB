// 第3部 第3章 第3幕（B）「はかりの回ろうと、ふたつの光」の 魔物・バラバラン3号・近衛の隊長エース・トランプの へいたい の え（shared/data/monsters-c11c.js）
// render/c9b-art.js の addC9bArt が addC11cArt を よぶ。かきかたは c11b-art.js と おなじ（g … w・h の わりあいで かく。f … コマ）
// ・新しい 絵 2つ … トランプの へいたい（体が 1まいの カード。マークは 月・星・ほうき星・太陽 … 同じ 絵の マークちがい・色ちがい 4しゅ）・
//   てんびんどり（光の はかりを せおった 鳥）
// ・色ちがい … かいろうランプ（なふだランプ）・さくのひかりガ（こはくガ）
// ・ボスは 2倍の こまかさ（size は 2倍で かき、artScale: 0.5）
//   バラバラン3号 … あたま（ガラスの まるい まどに 3人組の かお・アンテナ・ラッパ）・うで（ばねの うでと 大きな こぶし）・あし（ばねの あしと 大きな くつ）
//   近衛の隊長エース … カードの よろいの 背の 高い 隊長（羽の ついた かぶと・長い やり・むねに 太陽の マーク）。コマ 2・3 … カードに もどって ちらばる
//   トランプの へいたい（ボスの まわり）… へいたいの 2倍の こまかさ
//   もとの お話の ハート・スペード・ダイヤ・クラブの マークは かかない（月・星・ほうき星・太陽だけ）
import { fit, spark, bez } from './ch3-draw.js?v=71ec2a6ff6b8';

const EYE = ['#ffffff', '#1a1026'];
const pal = (P) => [...new Set([...Object.values(P), ...EYE])];

// ───── マーク（月・星・ほうき星・太陽。x, y … まんなか・s … 大きさ）─────
function mark(g, kind, x, y, s, col, sub = '#ffffff') {
  const k = g.w / g.h;
  if (kind === 'moon') {
    g.ell(x, y, s, s * k, col);
    g.ell(x + s * 0.45, y - s * 0.25 * k, s * 0.85, s * 0.85 * k, sub);
  } else if (kind === 'star') {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? s * 0.45 : s;
      pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r * k]);
    }
    g.poly(pts, col);
  } else if (kind === 'comet') {
    g.poly([[x - s * 1.4, y - s * 0.9 * k], [x - s * 0.1, y - s * 0.55 * k], [x + s * 0.2, y + s * 0.35 * k], [x - s * 1.2, y - s * 0.3 * k]], sub);
    g.ell(x + s * 0.2, y + s * 0.1 * k, s * 0.6, s * 0.6 * k, col);
  } else {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      g.poly([[x + Math.cos(a - 0.2) * s * 0.6, y + Math.sin(a - 0.2) * s * 0.6 * k], [x + Math.cos(a) * s * 1.1, y + Math.sin(a) * s * 1.1 * k], [x + Math.cos(a + 0.2) * s * 0.6, y + Math.sin(a + 0.2) * s * 0.6 * k]], col);
    }
    g.ell(x, y, s * 0.6, s * 0.6 * k, col);
  }
}
const MARK_COL = { moon: '#e8c040', star: '#4a8ae0', comet: '#e04a6a', sun: '#f08a20' };

// ───── トランプの へいたい（体が 1まいの カード。40×48。big … ボスの まわりの へいたい〈2倍〉）─────
const TS = {
  C: '#fbf8ee', CD: '#d8d2bc', CE: '#a89e80', // カード
  A: '#3a3a78', AD: '#24244e', // うで・あし（こん色）
  H: '#f2dcc8', HD: '#d0b49c', // かお
  M: '#c8a040', ML: '#f0d878', // やり・かざり
  K: '#1a1026', W: '#ffffff', R: '#d84a4a',
};
function soldier(kind, base = 40) {
  return (g0, f) => {
    const g = fit(g0, base);
    const C = TS;
    const k = g.w / g.h;
    const st = f ? 0.015 : 0;
    // やり（右手）
    g.line([[0.86, 0.1 - st], [0.82, 0.94]], C.CE, 2);
    g.poly([[0.86, 0.02 - st], [0.9, 0.12 - st], [0.86, 0.15 - st], [0.82, 0.12 - st]], C.M);
    // あし
    g.poly([[0.36, 0.78], [0.44, 0.78], [0.44, 0.96], [0.34, 0.96]], C.A);
    g.poly([[0.56, 0.78], [0.64, 0.78], [0.66, 0.96], [0.56, 0.96]], C.A);
    g.ell(0.38, 0.97, 0.07, 0.02, C.K);
    g.ell(0.62, 0.97, 0.07, 0.02, C.K);
    // うで
    g.poly([[0.22, 0.36], [0.28, 0.34], [0.22, 0.62], [0.16, 0.6]], C.A);
    g.poly([[0.72, 0.36], [0.78, 0.34], [0.84, 0.58], [0.78, 0.6]], C.A);
    g.ell(0.18, 0.62, 0.035, 0.025, C.H);
    g.ell(0.82, 0.58, 0.035, 0.025, C.H);
    // カードの 体
    g.poly([[0.25, 0.28 + st], [0.75, 0.28 + st], [0.75, 0.8], [0.25, 0.8]], C.CE);
    g.poly([[0.26, 0.29 + st], [0.74, 0.29 + st], [0.74, 0.79], [0.26, 0.79]], C.C);
    g.poly([[0.29, 0.32 + st], [0.71, 0.32 + st], [0.71, 0.76], [0.29, 0.76]], C.CD);
    g.poly([[0.3, 0.33 + st], [0.7, 0.33 + st], [0.7, 0.75], [0.3, 0.75]], C.C);
    // マーク（まん中と すみ）
    mark(g, kind, 0.5, 0.54 + st, 0.11, MARK_COL[kind], C.C);
    mark(g, kind, 0.35, 0.38 + st, 0.035, MARK_COL[kind], C.C);
    mark(g, kind, 0.65, 0.7 + st, 0.035, MARK_COL[kind], C.C);
    // かお（カードの 上）
    const hx = 0.5, hy = 0.2;
    g.ell(hx, hy, 0.1, 0.09, C.HD);
    g.ell(hx, hy - 0.004, 0.092, 0.082, C.H);
    for (const ex of [hx - 0.035, hx + 0.035]) g.ell(ex, hy, 0.014, 0.012 * k, C.K);
    g.line([[hx - 0.02, hy + 0.04], [hx + 0.02, hy + 0.04]], C.R, 1);
    // ぼうし（つつの 形）
    g.poly([[hx - 0.08, hy - 0.06], [hx + 0.08, hy - 0.06], [hx + 0.07, hy - 0.16], [hx - 0.07, hy - 0.16]], C.AD);
    g.poly([[hx - 0.08, hy - 0.08], [hx + 0.08, hy - 0.08], [hx + 0.08, hy - 0.06], [hx - 0.08, hy - 0.06]], C.M);
    mark(g, kind, hx, hy - 0.115, 0.025, C.ML, C.AD);
  };
}

// ───── てんびんどり（光の はかりを せおった 鳥。44×40）─────
const BD = {
  B: '#7a8ab8', BD: '#56648e', BL: '#a8b8e0', // 体
  Y: '#f0c040', // くちばし・あし
  G: '#e8c060', GD: '#b08a30', // はかり
  L: '#fff4c0', K: '#1a1026', W: '#ffffff',
};
function bird(g0, f) {
  const g = fit(g0, 44);
  const C = BD;
  const k = g.w / g.h;
  const tilt = f ? 0.03 : -0.03;
  // はかり（せなかの 上）
  g.line([[0.5, 0.36], [0.5, 0.1]], C.GD, 1.6);
  g.line([[0.24, 0.12 + tilt], [0.76, 0.12 - tilt]], C.G, 1.6);
  for (const [x, dy] of [[0.24, tilt], [0.76, -tilt]]) {
    g.line([[x, 0.12 + dy], [x - 0.06, 0.24 + dy]], C.GD, 1);
    g.line([[x, 0.12 + dy], [x + 0.06, 0.24 + dy]], C.GD, 1);
    g.poly([[x - 0.09, 0.24 + dy], [x + 0.09, 0.24 + dy], [x + 0.06, 0.28 + dy], [x - 0.06, 0.28 + dy]], C.G);
  }
  g.ell(0.24, 0.2 + tilt, 0.035, 0.035 * k, C.L);
  g.ell(0.5, 0.08, 0.03, 0.03 * k, C.G);
  // あし
  g.line([[0.44, 0.78], [0.42, 0.94]], C.Y, 1.4);
  g.line([[0.56, 0.78], [0.58, 0.94]], C.Y, 1.4);
  // 体・つばさ
  g.ell(0.5, 0.6, 0.24, 0.2, C.BD);
  g.ell(0.5, 0.58, 0.22, 0.18, C.B);
  g.poly([[0.32, 0.56], [0.12, 0.5 + (f ? 0.06 : 0)], [0.2, 0.7], [0.38, 0.68]], C.BD);
  g.poly([[0.68, 0.56], [0.88, 0.5 + (f ? 0.06 : 0)], [0.8, 0.7], [0.62, 0.68]], C.BD);
  g.ell(0.5, 0.64, 0.12, 0.1, C.BL);
  // 頭
  g.ell(0.5, 0.4, 0.13, 0.12, C.B);
  for (const ex of [0.45, 0.55]) { g.ell(ex, 0.38, 0.025, 0.025 * k, C.W); g.ell(ex, 0.385, 0.012, 0.012 * k, C.K); }
  g.poly([[0.47, 0.44], [0.53, 0.44], [0.5, 0.52]], C.Y);
}

// ───── バラバラン3号（2倍。あたま 160×144・うで 144×144・あし 128×160）─────
const MC = {
  M: '#c84a3a', MD: '#8a2e24', ML: '#f07a5a', // 赤い 体
  S: '#a8acb8', SD: '#6a6e7a', SL: '#e0e4ee', // 鉄
  G: '#bfe8ff', GL: '#ffffff', GD: '#7ab8e0', // ガラス
  Y: '#f0c840', YD: '#b08a20', // ねじ・ラッパ
  F1: '#f2d0c0', F2: '#e8c0a8', F3: '#f8dcc8', // 3人組の かお
  H1: '#e85a9a', H2: '#5a5a8a', H3: '#6a4a2a', // 3人組の かみ
  K: '#1a1026', W: '#ffffff', B: '#3a2a20',
};
function mHead(g0, f) {
  const g = fit(g0, 160);
  const C = MC;
  const k = g.w / g.h;
  const fr = f % 2;
  // アンテナ（くるくる）
  g.line(bez([[0.5, 0.2], [0.46, 0.12], [0.56, 0.08], [0.52, 0.02]], 10), C.SD, 3);
  g.ell(0.52, 0.03, 0.03, 0.03 * k, fr ? C.Y : C.ML);
  // 体（はこ）
  g.poly([[0.16, 0.24], [0.84, 0.24], [0.88, 0.86], [0.12, 0.86]], C.MD);
  g.poly([[0.18, 0.26], [0.82, 0.26], [0.85, 0.84], [0.15, 0.84]], C.M);
  g.poly([[0.18, 0.26], [0.82, 0.26], [0.8, 0.32], [0.2, 0.32]], C.ML);
  // ガラスの まど（3人組が のぞく）
  g.ell(0.5, 0.52, 0.28, 0.22, C.GD);
  g.ell(0.5, 0.51, 0.26, 0.2, C.G);
  const faces = [[0.36, C.F1, C.H1], [0.5, C.F2, C.H2], [0.64, C.F3, C.H3]];
  for (const [x, fc, hc] of faces) {
    g.ell(x, 0.53, 0.06, 0.07, fc);
    g.poly([[x - 0.065, 0.5], [x + 0.065, 0.5], [x + 0.05, 0.44], [x - 0.05, 0.44]], hc);
    g.ell(x - 0.02, 0.53, 0.008, 0.012, C.K);
    g.ell(x + 0.02, 0.53, 0.008, 0.012, C.K);
    g.line([[x - 0.015, 0.57], [x + 0.015, 0.57]], C.K, 1);
  }
  g.ell(0.4, 0.4, 0.06, 0.025, C.GL);
  // ラッパ（よこ）
  g.poly([[0.84, 0.44], [0.98, 0.36], [0.98, 0.6], [0.84, 0.52]], C.Y);
  g.ell(0.98, 0.48, 0.02, 0.12, C.YD);
  // ねじ
  for (const [x, y] of [[0.22, 0.78], [0.78, 0.78], [0.22, 0.34], [0.78, 0.34]]) { g.ell(x, y, 0.02, 0.02 * k, C.Y); g.line([[x - 0.012, y], [x + 0.012, y]], C.YD, 1); }
  // 数字の 3
  g.line(bez([[0.44, 0.74], [0.5, 0.7], [0.56, 0.74], [0.5, 0.77]], 6), C.Y, 2.5);
  g.line(bez([[0.5, 0.77], [0.56, 0.8], [0.5, 0.84], [0.44, 0.81]], 6), C.Y, 2.5);
  if (fr) spark(g, 0.12, 0.2, 0.03, C.Y, C.W);
}
function mArm(g0, f) {
  const g = fit(g0, 144);
  const C = MC;
  const k = g.w / g.h;
  const sw = f % 2 ? 0.02 : -0.02;
  // つけね
  g.ell(0.18, 0.4, 0.14, 0.14 * k, C.MD);
  g.ell(0.18, 0.4, 0.11, 0.11 * k, C.M);
  g.ell(0.18, 0.4, 0.04, 0.04 * k, C.Y);
  // ばねの うで
  const pts = bez([[0.26, 0.42], [0.42, 0.3 + sw], [0.52, 0.58 - sw], [0.66, 0.5]], 14);
  g.line(pts, C.SD, 10);
  for (let i = 1; i < pts.length; i += 2) g.line([[pts[i][0] - 0.02, pts[i][1] - 0.04], [pts[i][0] + 0.02, pts[i][1] + 0.04]], C.SL, 2);
  // 大きな こぶし
  g.ell(0.78, 0.52, 0.18, 0.2, C.MD);
  g.ell(0.78, 0.5, 0.16, 0.18, C.M);
  for (let i = 0; i < 4; i++) g.line([[0.7 + i * 0.05, 0.36], [0.7 + i * 0.05, 0.46]], C.MD, 2);
  g.ell(0.72, 0.6, 0.06, 0.06 * k, C.ML);
  // ロケットの ほのお（コマ 1）
  if (f % 2) {
    g.poly([[0.6, 0.48], [0.52, 0.42], [0.54, 0.5], [0.5, 0.56], [0.6, 0.54]], C.Y);
  }
}
function mLeg(g0, f) {
  const g = fit(g0, 128);
  const C = MC;
  const up = f % 2 ? 0.02 : 0;
  // こし
  g.poly([[0.22, 0.04 + up], [0.78, 0.04 + up], [0.72, 0.2 + up], [0.28, 0.2 + up]], C.MD);
  g.poly([[0.24, 0.05 + up], [0.76, 0.05 + up], [0.7, 0.18 + up], [0.3, 0.18 + up]], C.M);
  // ばねの あし（2本）
  for (const x of [0.36, 0.64]) {
    for (let i = 0; i < 7; i++) {
      const y = 0.22 + i * 0.075 + up * (1 - i / 7);
      g.poly([[x - 0.09, y], [x + 0.09, y], [x + 0.09, y + 0.035], [x - 0.09, y + 0.035]], i % 2 ? C.SD : C.SL);
    }
  }
  // 大きな くつ
  for (const x of [0.32, 0.68]) {
    g.poly([[x - 0.14, 0.78], [x + 0.12, 0.78], [x + 0.2, 0.92], [x - 0.16, 0.96]], C.MD);
    g.poly([[x - 0.12, 0.79], [x + 0.11, 0.79], [x + 0.17, 0.9], [x - 0.14, 0.93]], C.M);
    g.poly([[x - 0.16, 0.94], [x + 0.2, 0.92], [x + 0.2, 0.97], [x - 0.16, 0.98]], C.B);
  }
}

// ───── 近衛の隊長エース（2倍。192×224）─────
const AC = {
  C: '#fbf8ee', CD: '#d8d2bc', CE: '#a89e80', // カードの よろい
  N: '#2a3a78', ND: '#1a2450', NL: '#4a5aa8', // こん色の 服
  H: '#f2dcc8', HD: '#d0b49c', // かお
  G: '#e0b040', GD: '#a87e20', GL: '#fff0a0', // 金
  P: '#ffffff', PD: '#d8d8e8', // 羽
  K: '#1a1026', W: '#ffffff', R: '#c83a48',
};
function ace(g0, f) {
  const g = fit(g0, 192);
  const C = AC;
  const k = g.w / g.h;
  const fr = f % 2;
  if (f >= 2) {
    // カードに もどって ちらばる（コマ 2・3）
    const n = 14;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (fr ? 0.3 : 0);
      const r = fr ? 0.38 : 0.24;
      const x = 0.5 + Math.cos(a) * r * (0.8 + (i % 3) * 0.1);
      const y = 0.5 + Math.sin(a) * r * k * 0.8 - (fr ? 0.06 : 0);
      const w = 0.045, h = 0.06;
      const tw = (i % 4) * 0.012;
      g.poly([[x - w, y - h + tw], [x + w, y - h - tw], [x + w, y + h - tw], [x - w, y + h + tw]], C.CE);
      g.poly([[x - w + 0.006, y - h + tw + 0.006], [x + w - 0.006, y - h - tw + 0.006], [x + w - 0.006, y + h - tw - 0.006], [x - w + 0.006, y + h + tw - 0.006]], C.C);
      mark(g, ['moon', 'star', 'comet', 'sun'][i % 4], x, y, 0.018, MARK_COL[['moon', 'star', 'comet', 'sun'][i % 4]], C.C);
    }
    spark(g, 0.5, 0.5, fr ? 0.05 : 0.08, C.GL, C.W);
    return;
  }
  const sw = fr ? 0.008 : -0.008;
  // 長い やり（右）
  g.line([[0.84, 0.06], [0.8, 0.96]], C.GD, 4);
  g.poly([[0.84, 0.0], [0.88, 0.08], [0.84, 0.11], [0.8, 0.08]], C.G);
  g.poly([[0.8, 0.12], [0.92, 0.14 + sw], [0.92, 0.22 + sw], [0.8, 0.2]], C.N);
  mark(g, 'sun', 0.86, 0.17 + sw, 0.022, C.G, C.N);
  // マント（うしろ）
  g.poly([[0.32, 0.26], [0.68, 0.26], [0.78, 0.9], [0.22, 0.9]], C.ND);
  // あし
  g.poly([[0.4, 0.74], [0.47, 0.74], [0.47, 0.95], [0.38, 0.95]], C.N);
  g.poly([[0.53, 0.74], [0.6, 0.74], [0.62, 0.95], [0.53, 0.95]], C.N);
  g.ell(0.42, 0.96, 0.06, 0.02, C.K);
  g.ell(0.58, 0.96, 0.06, 0.02, C.K);
  // うで
  g.poly([[0.3, 0.3], [0.36, 0.3], [0.3, 0.6], [0.24, 0.58]], C.N);
  g.poly([[0.64, 0.3], [0.7, 0.3], [0.8, 0.52], [0.74, 0.56]], C.N);
  g.ell(0.26, 0.6, 0.03, 0.025, C.H);
  g.ell(0.8, 0.52, 0.03, 0.025, C.H);
  // カードの よろい（むね・はら）
  g.poly([[0.33, 0.28], [0.67, 0.28], [0.67, 0.76], [0.33, 0.76]], C.CE);
  g.poly([[0.34, 0.29], [0.66, 0.29], [0.66, 0.75], [0.34, 0.75]], C.C);
  g.poly([[0.37, 0.32], [0.63, 0.32], [0.63, 0.72], [0.37, 0.72]], C.CD);
  g.poly([[0.38, 0.33], [0.62, 0.33], [0.62, 0.71], [0.38, 0.71]], C.C);
  mark(g, 'sun', 0.5, 0.5, 0.08, '#f08a20', C.C);
  for (const [mx, my, mk] of [[0.42, 0.37, 'moon'], [0.58, 0.37, 'star'], [0.42, 0.66, 'comet'], [0.58, 0.66, 'star']]) mark(g, mk, mx, my, 0.022, MARK_COL[mk], C.C);
  // かた かざり（金）
  g.ell(0.33, 0.29, 0.05, 0.025, C.G);
  g.ell(0.67, 0.29, 0.05, 0.025, C.G);
  // かお
  const hx = 0.5, hy = 0.19;
  g.ell(hx, hy, 0.07, 0.075, C.HD);
  g.ell(hx, hy - 0.004, 0.064, 0.068, C.H);
  for (const ex of [hx - 0.025, hx + 0.025]) g.line([[ex - 0.012, hy - 0.004], [ex + 0.012, hy - 0.004]], C.K, 2);
  g.line([[hx - 0.03, hy + 0.035], [hx + 0.03, hy + 0.035]], C.K, 1.6);
  // かぶと と 羽
  g.poly([[hx - 0.075, hy - 0.03], [hx + 0.075, hy - 0.03], [hx + 0.06, hy - 0.1], [hx - 0.06, hy - 0.1]], C.N);
  g.poly([[hx - 0.075, hy - 0.04], [hx + 0.075, hy - 0.04], [hx + 0.075, hy - 0.03], [hx - 0.075, hy - 0.03]], C.G);
  g.line(bez([[hx, hy - 0.1], [hx - 0.02, hy - 0.18], [hx + 0.08, hy - 0.2 + sw], [hx + 0.12, hy - 0.14 + sw]], 10), C.PD, 6);
  g.line(bez([[hx, hy - 0.1], [hx - 0.02, hy - 0.17], [hx + 0.07, hy - 0.19 + sw], [hx + 0.11, hy - 0.14 + sw]], 10), C.P, 3);
}

export function addC11cArt(ART) {
  // トランプの へいたい（同じ 絵の マークちがい。月 … 新しい 絵・星／ほうき星／太陽 … マークと 色の ちがい）
  ART.c11c_tmoon = { size: [40, 48], pal: pal(TS).concat(Object.values(MARK_COL)), draw: soldier('moon') };
  ART.c11c_tstar = { ...ART.c11c_tmoon, draw: soldier('star'), tint: { hueTo: 220, sat: 0.25, light: 1.05 } };
  ART.c11c_tcomet = { ...ART.c11c_tmoon, draw: soldier('comet'), tint: { hueTo: 340, sat: 0.25, light: 1.0 } };
  ART.c11c_tsun = { ...ART.c11c_tmoon, draw: soldier('sun'), tint: { hueTo: 30, sat: 0.3, light: 1.05 } };
  ART.c11c_bird = { size: [44, 40], pal: pal(BD), draw: bird };
  // 色ちがい（今の 絵）
  if (ART.c11b_lamp) ART.c11c_lamp = { ...ART.c11b_lamp, tint: { hueTo: 205, sat: 0.45, light: 1.1 } };
  if (ART.amber_moth) ART.c11c_moth = { ...ART.amber_moth, tint: { hueTo: 190, sat: 0.5, light: 1.2 } };
  // ボス（2倍の こまかさ。monsters-c11c.js の artScale 0.5。台本の showMon でも 大きく）
  ART.c11c_mhead = { size: [160, 144], npc: 0.6, pal: pal(MC), draw: mHead };
  ART.c11c_marm = { size: [144, 144], npc: 0.6, pal: pal(MC), draw: mArm };
  ART.c11c_mleg = { size: [128, 160], npc: 0.6, pal: pal(MC), draw: mLeg };
  ART.c11c_ace = { size: [192, 224], npc: 0.6, pal: pal(AC).concat(Object.values(MARK_COL)), draw: ace };
  ART.c11c_guard = { size: [80, 96], npc: 0.6, pal: pal(TS).concat(Object.values(MARK_COL)), draw: soldier('sun', 40) };
}
// カードの マークを かく（client/battle-c11c.js の カードの まど・えんしゅつ でも 使う）
export { mark as c11cMark, MARK_COL as C11C_MARK_COL };
