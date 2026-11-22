// 第3部 第1章 第2幕（B）「鉱山の底の先」の 魔物・デデドン大王・皿 の え（shared/data/monsters-c9b.js）
// render/c9a-art.js の addC9aArt が addC9bArt を よぶ。かきかたは c9a-art.js と おなじ（g … w・h の わりあいで かく。f … コマ）
// ・色ちがい 3しゅ … すいしょうのカニ（星座ガニ）・光るキノコ（ねむりキノコ）・どうくつコウモリ（つららコウモリ）
// ・新しい 絵 2つ … くらやみの大ミミズ・もぐら兵（やり と なべ は 1つの かき方の 2つの すがた）
// ・ボスは 今までの ボスの 2倍の こまかさ（docs/plan-ch7.md の 4-4）: size は 2倍で かき、artScale: 0.5
//   デデドン大王 … 大きな もぐらの 王さま。赤い マント・木の 大づち・小さな かんむり。いばって いるが にくめない 顔
//   コマ 0・1 … 戦い（大づちを かつぐ）/ 2・3 … すわりこんで おなかが 鳴る（client/battle-c9b.js の c9bSprite が pub の kDown で えらぶ）
//   もとの 作品（星のカービィ）の 絵は 使わない（ペンギンでは なく もぐら・青い ぼうしでは なく 小さな 金の かんむり）
// ・皿 3つ … にく・ケーキ・からいスープ（ボスの しかけの 部ひん。ふつうの こまかさ）
import { fit, spark, bez } from './ch3-draw.js?v=7362a49921c1';
import { sparkled } from './c9a-art.js?v=7362a49921c1';
// 第3部 第1章 第3幕（c9c-art.js）
import { addC9cArt } from './c9c-art.js?v=7362a49921c1';
// 第3部 第1章 第4幕（c9d-art.js）
import { addC9dArt } from './c9d-art.js?v=7362a49921c1';
// 第3部 第2章 第1幕（c10a-art.js）
import { addC10aArt } from './c10a-art.js?v=7362a49921c1';
// 第3部 第2章 第2幕（c10b-art.js）
import { addC10bArt } from './c10b-art.js?v=7362a49921c1';
// 第3部 第2章 第3幕（c10c-art.js）
import { addC10cArt } from './c10c-art.js?v=7362a49921c1';
// 第3部 第2章 第4幕（c10d-art.js）
import { addC10dArt } from './c10d-art.js?v=7362a49921c1';
// 第3部 第3章 第1幕（c11a-art.js）
import { addC11aArt } from './c11a-art.js?v=7362a49921c1';

const EYE = ['#ffffff', '#1a1026'];
const pal = (P) => [...new Set([...Object.values(P), ...EYE])];

// ───── くらやみの大ミミズ（暗い 所に だけ いる、とても 長い ミミズ。目は 小さく まるい。こわく ない）─────
const MZ = {
  B: '#4a2e52', BD: '#2a1a32', BL: '#6e4a78', // 体
  R: '#8a6a92', // わの すじ
  E: '#ffe860', EL: '#fffbd0', K: '#1a1026', // 目
  M: '#c8708a', // 口
  S: '#3a2a20', SL: '#5a4434', // 土
};
function mimizu(g0, f) {
  const g = fit(g0, 64);
  const C = MZ;
  const k = g.w / g.h;
  const up = f ? 1 : 0;
  // 土の もりあがり（体が 出て いる 穴）
  g.ell(0.78, 0.9, 0.2, 0.08, C.S);
  g.ell(0.78, 0.88, 0.16, 0.05, C.SL);
  // 体（S の 形に くねる。まるを ならべる）
  const pts = bez([[0.8, 0.88], [0.92, 0.5 - up * 0.04], [0.42, 0.62 + up * 0.04], [0.3, 0.3], [0.2, 0.2 + up * 0.03]], 22);
  pts.forEach(([x, y], i) => g.ell(x, y, 0.085, 0.085 * k * 1.1, C.BD));
  pts.forEach(([x, y], i) => {
    g.ell(x, y - 0.01, 0.075, 0.075 * k * 1.1, i % 3 === 0 ? C.R : C.B);
  });
  pts.forEach(([x, y], i) => { if (i % 2 === 0) g.ell(x - 0.02, y - 0.04, 0.025, 0.018, C.BL); });
  // 頭
  const [hx, hy] = pts[pts.length - 1];
  g.ell(hx, hy, 0.11, 0.11 * k, C.BD);
  g.ell(hx, hy - 0.01, 0.1, 0.1 * k, C.B);
  // 小さな まるい 目（光る）
  for (const d of [-1, 1]) {
    const ex = hx + d * 0.045, ey = hy - 0.03;
    g.ell(ex, ey, 0.026, 0.026 * k, C.E);
    g.ell(ex + 0.004, ey + 0.004, 0.013, 0.015 * k, C.K);
    g.ell(ex - 0.007, ey - 0.008, 0.006, 0.006 * k, C.EL);
  }
  // 口（にこっと）
  g.line(bez([[hx - 0.035, hy + 0.05], [hx, hy + 0.075 + up * 0.01], [hx + 0.035, hy + 0.05]], 6), C.M, 1.6);
}

// ───── もぐら兵（大王の 手下。やり ＝ 鉄の かぶとと やり・なべ ＝ なべを かぶって おたま）─────
const MG = {
  F: '#7a5a42', FD: '#4e3626', FL: '#a07e62', // 毛
  B: '#e8d0b0', // おなか
  N: '#ff9aa8', ND: '#d8607a', // 鼻
  H: '#ffc8b8', // 手
  K: '#1a1026',
  M: '#9aa2b0', MD: '#5e6676', ML: '#d8dee8', // 鉄
  W: '#a07040', WD: '#6e4a28', // 木（やりの え）
  P: '#5a5e68', PD: '#363a42', PL: '#8a909c', // なべ
  V: '#3a5a9a', VD: '#26406e', // 服（青い 兵隊の 服）
};
function mole(g0, f, pot) {
  const g = fit(g0, 40);
  const C = MG;
  const k = g.w / g.h;
  const up = f ? 0.015 : 0;
  // 足
  g.ell(0.38, 0.95, 0.09, 0.04, C.FD);
  g.ell(0.6, 0.95, 0.09, 0.04, C.FD);
  // 体
  g.ell(0.5, 0.7 - up, 0.27, 0.25, C.FD);
  g.ell(0.5, 0.69 - up, 0.25, 0.24, C.F);
  g.rect(0.28, 0.66 - up, 0.44, 0.14, C.V);
  g.rect(0.28, 0.66 - up, 0.44, 0.03, C.VD);
  g.ell(0.5, 0.82 - up, 0.13, 0.08, C.B);
  // 頭
  const hy = 0.38 - up;
  g.ell(0.5, hy, 0.25, 0.22, C.FD);
  g.ell(0.5, hy - 0.01, 0.23, 0.21, C.F);
  g.ell(0.5, hy + 0.06, 0.13, 0.09, C.FL);
  // 目（細い にこにこ。少し こまった まゆ）
  for (const d of [-1, 1]) {
    g.line(bez([[0.5 + d * 0.13, hy], [0.5 + d * 0.1, hy - 0.025], [0.5 + d * 0.07, hy]], 5), C.K, 1.6);
    g.line([[0.5 + d * 0.14, hy - 0.06], [0.5 + d * 0.07, hy - 0.045]], C.FD, 1.2);
  }
  // 鼻
  g.ell(0.5, hy + 0.06, 0.055, 0.045, C.ND);
  g.ell(0.5, hy + 0.055, 0.045, 0.035, C.N);
  g.ell(0.485, hy + 0.045, 0.012, 0.01, '#ffffff');
  // ひげ
  for (const d of [-1, 1]) for (const dy of [-0.01, 0.02]) g.line([[0.5 + d * 0.08, hy + 0.07 + dy], [0.5 + d * 0.22, hy + 0.05 + dy * 2]], C.K, 0.8);
  if (pot) {
    // なべ（取っ手つき）
    g.poly([[0.26, hy - 0.08], [0.74, hy - 0.08], [0.7, hy - 0.26], [0.3, hy - 0.26]], C.PD);
    g.poly([[0.28, hy - 0.09], [0.72, hy - 0.09], [0.69, hy - 0.25], [0.31, hy - 0.25]], C.P);
    g.rect(0.24, hy - 0.11, 0.52, 0.04, C.PL);
    g.rect(0.16, hy - 0.2, 0.1, 0.03, C.PD);
    g.rect(0.74, hy - 0.2, 0.1, 0.03, C.PD);
    // おたま（右手）
    g.line([[0.78, 0.66 - up], [0.9, 0.36 - up * 2]], C.ML, 2.2);
    g.ell(0.9, 0.33 - up * 2, 0.06, 0.05, C.M);
    g.ell(0.9, 0.32 - up * 2, 0.045, 0.035, C.ML);
  } else {
    // 鉄の かぶと（まん中に 小さな とさか）
    g.ell(0.5, hy - 0.1, 0.25, 0.13, C.MD);
    g.ell(0.5, hy - 0.11, 0.23, 0.12, C.M);
    g.rect(0.25, hy - 0.08, 0.5, 0.035, C.MD);
    g.ell(0.42, hy - 0.15, 0.06, 0.03, C.ML);
    g.rect(0.48, hy - 0.3, 0.04, 0.1, '#d8505a');
    // やり（右手）
    g.line([[0.82, 0.92], [0.82, 0.12 - up * 2]], C.WD, 2.8);
    g.line([[0.82, 0.92], [0.82, 0.12 - up * 2]], C.W, 1.6);
    g.poly([[0.82, 0.0 - up * 2], [0.87, 0.13 - up * 2], [0.77, 0.13 - up * 2]], C.ML);
  }
  // 手
  g.ell(0.24, 0.68 - up, 0.06, 0.05, C.H);
  g.ell(0.8, 0.66 - up, 0.06, 0.05, C.H);
}

// ───── デデドン大王（大きな もぐらの 王さま。2倍の こまかさ）─────
const DK = {
  F: '#8a6448', FD: '#5a3e2a', FL: '#b08a6a', FX: '#c8a484', // 毛
  B: '#f0dcc0', BD: '#d8c0a0', // おなか
  N: '#ff8a9a', ND: '#d0587a', NL: '#ffc8d0', // 鼻
  H: '#ffbca8', HD: '#d8907a', // 手・足の うら
  K: '#1a1026',
  R: '#d8303a', RD: '#9a1a24', RL: '#ff6a6a', // マント
  E: '#ffffff', ED: '#d8d8e4', // マントの 白い ふち
  G: '#ffd040', GD: '#c8901a', GL: '#fff4a0', // かんむり・ボタン
  J: '#5ac8ff', // かんむりの 宝石
  W: '#b07a44', WD: '#7a4e26', WL: '#d8a06a', // 木の 大づち
  S: '#7ab0ff', // あせ・なみだ
};
function dededon(g0, f) {
  const g = fit(g0, 240);
  const C = DK;
  const k = g.w / g.h;
  const sit = f >= 2;
  const up = f % 2;
  const dy = sit ? 0.1 : up ? -0.01 : 0;
  // マント（うしろ。すわる ときは 床に 広がる）
  const cy = sit ? 0.94 : 0.92;
  g.poly([[0.24, 0.36 + dy], [0.76, 0.36 + dy], [0.94, cy], [0.06, cy]], C.RD);
  g.poly([[0.26, 0.38 + dy], [0.74, 0.38 + dy], [0.9, cy - 0.02], [0.1, cy - 0.02]], C.R);
  for (let i = 0; i < 4; i++) g.line([[0.32 + i * 0.12, 0.42 + dy], [0.24 + i * 0.17, cy - 0.04]], C.RL, 1.2);
  // マントの 白い ふち（ふわふわ・黒い てん）
  for (let i = 0; i <= 10; i++) g.ell(0.06 + i * 0.088, cy, 0.05, 0.03, C.E);
  for (let i = 0; i <= 10; i += 2) g.ell(0.06 + i * 0.088, cy, 0.008, 0.012, C.K);
  // 足
  if (sit) {
    for (const d of [-1, 1]) {
      g.ell(0.5 + d * 0.22, 0.9, 0.1, 0.06, C.FD);
      g.ell(0.5 + d * 0.27, 0.88, 0.06, 0.07, C.H);
      for (let i = -1; i <= 1; i++) g.ell(0.5 + d * 0.27 + i * 0.02, 0.84, 0.012, 0.016, C.HD);
    }
  } else {
    for (const d of [-1, 1]) {
      g.ell(0.5 + d * 0.14, 0.9, 0.1, 0.06, C.FD);
      g.ell(0.5 + d * 0.14, 0.92, 0.08, 0.035, C.HD);
    }
  }
  // 体（まるくて 大きい）
  const by = 0.62 + dy;
  g.ell(0.5, by, 0.32, 0.27, C.FD);
  g.ell(0.5, by - 0.01, 0.3, 0.26, C.F);
  g.ell(0.42, by - 0.12, 0.12, 0.06, C.FL);
  // おなか
  g.ell(0.5, by + 0.05, 0.2, 0.18, C.BD);
  g.ell(0.5, by + 0.04, 0.19, 0.17, C.B);
  g.ell(0.5, by + 0.06, 0.012, 0.012 * k, C.BD);
  // マントの むすび目（金の ボタン）
  g.ell(0.38, 0.4 + dy, 0.035, 0.035 * k, C.GD);
  g.ell(0.62, 0.4 + dy, 0.035, 0.035 * k, C.GD);
  g.ell(0.38, 0.4 + dy, 0.025, 0.025 * k, C.G);
  g.ell(0.62, 0.4 + dy, 0.025, 0.025 * k, C.G);
  g.line(bez([[0.38, 0.4 + dy], [0.5, 0.45 + dy], [0.62, 0.4 + dy]], 8), C.G, 2);
  // 頭（体と くっついた まるい 頭）
  const hy = 0.3 + dy;
  g.ell(0.5, hy, 0.24, 0.19, C.FD);
  g.ell(0.5, hy - 0.01, 0.225, 0.18, C.F);
  g.ell(0.5, hy + 0.06, 0.14, 0.09, C.FX);
  // 目（いばった 細い 目 ／ すわると くるくる ＋ なみだ）
  for (const d of [-1, 1]) {
    const ex = 0.5 + d * 0.09, ey = hy - 0.03;
    if (sit) {
      g.line(bez([[ex - 0.03, ey], [ex, ey + 0.025], [ex + 0.03, ey]], 6), C.K, 3);
      g.ell(ex + d * 0.025, ey + 0.05, 0.012, 0.02, C.S);
    } else {
      g.line(bez([[ex - 0.035, ey + 0.005], [ex, ey - 0.02], [ex + 0.035, ey + 0.005]], 6), C.K, 3.4);
      // まゆ（いばって 上がる）
      g.line([[ex - d * 0.04, ey - 0.07], [ex + d * 0.04, ey - 0.05 - up * 0.01]], C.FD, 3);
    }
  }
  // ほっぺ
  g.ell(0.36, hy + 0.04, 0.03, 0.02, '#ff9aa0');
  g.ell(0.64, hy + 0.04, 0.03, 0.02, '#ff9aa0');
  // 鼻（大きな ピンクの 鼻）
  g.ell(0.5, hy + 0.05, 0.07, 0.05, C.ND);
  g.ell(0.5, hy + 0.045, 0.06, 0.042, C.N);
  g.ell(0.48, hy + 0.03, 0.018, 0.012, C.NL);
  // 口（いばった にやり ／ すわると ぽかん）
  if (sit) g.ell(0.5, hy + 0.12, 0.03, 0.025, '#7a2a3a');
  else g.line(bez([[0.44, hy + 0.11], [0.5, hy + 0.14], [0.57, hy + 0.1]], 8), C.K, 2.4);
  // ひげ
  for (const d of [-1, 1]) for (const dy2 of [-0.015, 0.015, 0.045]) g.line([[0.5 + d * 0.08, hy + 0.06 + dy2], [0.5 + d * 0.26, hy + 0.03 + dy2 * 1.8]], C.K, 1);
  // 小さな かんむり（少し かたむく）
  const tilt = sit ? 0.03 : 0;
  const cx0 = 0.5 + tilt, cyc = hy - 0.17 + (sit ? 0.01 : 0);
  g.poly([[cx0 - 0.08, cyc + 0.04], [cx0 + 0.08, cyc + 0.04 - tilt], [cx0 + 0.09, cyc - 0.05 - tilt], [cx0 + 0.045, cyc - 0.01], [cx0, cyc - 0.07], [cx0 - 0.045, cyc - 0.01], [cx0 - 0.09, cyc - 0.05]], C.GD);
  g.poly([[cx0 - 0.07, cyc + 0.03], [cx0 + 0.07, cyc + 0.03 - tilt], [cx0 + 0.08, cyc - 0.035 - tilt], [cx0 + 0.04, cyc], [cx0, cyc - 0.055], [cx0 - 0.04, cyc], [cx0 - 0.08, cyc - 0.035]], C.G);
  g.ell(cx0, cyc + 0.01, 0.018, 0.018 * k, C.J);
  g.ell(cx0 - 0.005, cyc + 0.005, 0.006, 0.006 * k, C.GL);
  // 手と 木の 大づち
  if (sit) {
    // すわる: 大づちは 床に ころがる。手は おなかを おさえる
    g.line([[0.76, 0.93], [0.98, 0.84]], C.WD, 7);
    g.line([[0.76, 0.93], [0.98, 0.84]], C.W, 4.6);
    g.rect(0.66, 0.84, 0.14, 0.12, C.WD);
    g.rect(0.67, 0.85, 0.12, 0.1, C.W);
    g.rect(0.67, 0.85, 0.12, 0.02, C.WL);
    g.ell(0.38, by + 0.06, 0.06, 0.05, C.H);
    g.ell(0.62, by + 0.06, 0.06, 0.05, C.H);
    // おなかが 鳴る（ぐ〜 の しるし。コマ1 で 大きく）
    for (let i = 0; i < 3; i++) g.line(bez([[0.62 + i * 0.05, by - 0.02 - up * 0.02], [0.66 + i * 0.05, by - 0.05], [0.7 + i * 0.05, by - 0.02 - up * 0.02]], 6), C.FD, 1.4);
    // あせ
    g.ell(0.72, hy - 0.08, 0.012, 0.02, C.S);
  } else {
    // 左手は こしに（いばって）
    g.ell(0.22, by - 0.02, 0.06, 0.06, C.FD);
    g.ell(0.21, by, 0.05, 0.045, C.H);
    for (let i = -1; i <= 1; i++) g.ell(0.18 + i * 0.01, by + 0.03, 0.01, 0.014, C.HD);
    // 右手で 大づちを かつぐ（コマ1 で 少し ふり上げる）
    const ty = up ? -0.03 : 0;
    g.line([[0.78, by - 0.02], [0.62, 0.1 + ty]], C.WD, 7);
    g.line([[0.78, by - 0.02], [0.62, 0.1 + ty]], C.W, 4.6);
    g.poly([[0.5, 0.02 + ty], [0.74, 0.0 + ty], [0.78, 0.2 + ty], [0.54, 0.22 + ty]], C.WD);
    g.poly([[0.515, 0.035 + ty], [0.73, 0.017 + ty], [0.765, 0.19 + ty], [0.55, 0.205 + ty]], C.W);
    g.line([[0.52, 0.06 + ty], [0.74, 0.04 + ty]], C.WL, 1.6);
    g.line([[0.54, 0.17 + ty], [0.76, 0.155 + ty]], C.WD, 1.4);
    g.ell(0.8, by - 0.02, 0.06, 0.055, C.H);
  }
}

// ───── 皿（にく・ケーキ・からいスープ。大王の ごちそう）─────
const DS = {
  P: '#f4f4f8', PD: '#c8c8d8', PL: '#ffffff', // 皿
  M: '#a0522d', MD: '#6e3418', ML: '#d07a4a', BN: '#fff0d8', // にく・ほね
  C: '#fff4dc', CD: '#e8d0a8', CR: '#ffffff', ST: '#ff4a5a', SG: '#4aa04a', // ケーキ
  SB: '#d8402a', SD: '#9a2414', SL: '#ff8a4a', BW: '#7a5a3a', BWD: '#4e3622', // スープ・おわん
  V: '#ffffff', // ゆげ
};
function plate(g, C) {
  g.ell(0.5, 0.82, 0.44, 0.12, C.PD);
  g.ell(0.5, 0.8, 0.42, 0.11, C.P);
  g.ell(0.5, 0.79, 0.3, 0.06, C.PL);
}
function steam(g, f, C, x0 = 0.5) {
  for (let i = -1; i <= 1; i++) g.line(bez([[x0 + i * 0.12, 0.3], [x0 + i * 0.12 + (f ? 0.05 : -0.05), 0.18], [x0 + i * 0.12, 0.06]], 6), C.V, 1.2);
}
function dishMeat(g0, f) {
  const g = fit(g0, 44);
  const C = DS;
  plate(g, C);
  g.ell(0.46, 0.6, 0.26, 0.2, C.MD);
  g.ell(0.46, 0.58, 0.24, 0.18, C.M);
  g.ell(0.4, 0.52, 0.1, 0.06, C.ML);
  g.line([[0.66, 0.6], [0.86, 0.48]], C.BN, 4);
  g.ell(0.88, 0.45, 0.05, 0.05, C.BN);
  g.ell(0.86, 0.5, 0.045, 0.045, C.BN);
  steam(g, f, C, 0.46);
}
function dishCake(g0, f) {
  const g = fit(g0, 44);
  const C = DS;
  plate(g, C);
  g.poly([[0.22, 0.74], [0.78, 0.74], [0.78, 0.4], [0.22, 0.46]], C.CD);
  g.poly([[0.22, 0.46], [0.78, 0.4], [0.7, 0.32], [0.3, 0.36]], C.CR);
  g.rect(0.22, 0.56, 0.56, 0.04, C.ST);
  g.rect(0.22, 0.48, 0.56, 0.05, C.C);
  g.rect(0.22, 0.62, 0.56, 0.1, C.C);
  g.ell(0.5, 0.3, 0.07, 0.07, C.ST);
  g.ell(0.5, 0.25, 0.04, 0.025, C.SG);
  if (f) spark(g, 0.82, 0.24, 0.07, '#fff4a0', '#ffffff');
}
function dishSoup(g0, f) {
  const g = fit(g0, 44);
  const C = DS;
  plate(g, C);
  g.poly([[0.18, 0.5], [0.82, 0.5], [0.7, 0.78], [0.3, 0.78]], C.BWD);
  g.poly([[0.2, 0.5], [0.8, 0.5], [0.69, 0.76], [0.31, 0.76]], C.BW);
  g.ell(0.5, 0.5, 0.31, 0.08, C.SD);
  g.ell(0.5, 0.5, 0.29, 0.065, C.SB);
  g.ell(0.42, 0.49, 0.06, 0.02, C.SL);
  g.ell(0.6, 0.51, 0.03, 0.012, '#4a8a3a');
  // からい しるし（赤い ゆげ）
  for (let i = -1; i <= 1; i++) g.line(bez([[0.5 + i * 0.13, 0.4], [0.5 + i * 0.13 + (f ? 0.05 : -0.05), 0.27], [0.5 + i * 0.13, 0.12]], 6), i ? C.V : C.SL, 1.4);
}

export function addC9bArt(ART) {
  // 大地の下の 魔物（今の 絵の 色ちがい。新しい 絵では ない）
  if (ART.crab_star) ART.c9b_crab = sparkled(ART.crab_star, { hueTo: 190, sat: 0.7, light: 1.12 });
  if (ART.nemuri) ART.c9b_kinoko = sparkled(ART.nemuri, { hueTo: 150, sat: 0.95, light: 1.15 });
  if (ART.ice_bat) ART.c9b_bat = { ...ART.ice_bat, tint: { hueTo: 275, sat: 0.6, light: 0.82 } };
  // 新しい 絵（大ミミズ・もぐら兵 2つの すがた）
  ART.c9b_mimizu = { size: [64, 48], pal: pal(MZ), draw: mimizu };
  ART.c9b_mole_spear = { size: [40, 46], pal: pal(MG), draw: (g, f) => mole(g, f, false) };
  ART.c9b_mole_pot = { size: [40, 46], pal: pal(MG), draw: (g, f) => mole(g, f, true) };
  // ボス（2倍の こまかさ。monsters-c9b.js の artScale 0.5。台本の showMon でも 大きく）
  ART.c9b_dededon = { size: [240, 232], npc: 0.6, pal: pal(DK), draw: dededon };
  // 皿（ボスの しかけの 部ひん）
  ART.c9b_dish_meat = { size: [44, 36], pal: pal(DS), draw: dishMeat };
  ART.c9b_dish_cake = { size: [44, 36], pal: pal(DS), draw: dishCake };
  ART.c9b_dish_soup = { size: [44, 36], pal: pal(DS), draw: dishSoup };
  // 第3部 第1章 第3幕（c9c-art.js）
  addC9cArt(ART);
  // 第3部 第1章 第4幕（c9d-art.js）
  addC9dArt(ART);
  // 第3部 第2章 第1幕（c10a-art.js）
  addC10aArt(ART);
  // 第3部 第2章 第2幕（c10b-art.js）
  addC10bArt(ART);
  // 第3部 第2章 第3幕（c10c-art.js）
  addC10cArt(ART);
  // 第3部 第2章 第4幕（c10d-art.js）
  addC10dArt(ART);
  // 第3部 第3章 第1幕（c11a-art.js）
  addC11aArt(ART);
}
