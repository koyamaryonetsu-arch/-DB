// 第3部 第1章 第4幕（B）「星のはかば」の 魔物・あそびたい魔人 ムウ・ムウムウ の え（shared/data/monsters-c9d.js）
// render/c9b-art.js の addC9bArt が addC9dArt を よぶ。かきかたは c9a-art.js と おなじ（g … w・h の わりあいで かく。f … コマ）
// ・色ちがい 2しゅ … 谷わたりグモ（とけいグモ）・星あかりのガ（こはくのガ ＋ きらめき）
// ・新しい 絵 3つ … こだまのふたご・つりばしヤギ・かげぼうしネコ（3しゅまで）
// ・ボスは 2倍の こまかさ（docs/plan-ch7.md の 4-4）: size は 2倍で かき、artScale: 0.5
//   ムウ … 丸くて うす紫、ねむそうな 目、黄色い 星の ついた こん色の ナイトキャップ
//   ムウムウ … おなじ 形で ミント色、こい みどり青の 三日月の ついた ナイトキャップ（2体 ならんでも 見分けが つく。ピンクには しない）
//   コマ 0・1 … 戦い ／ 2・3 … ばたんきゅう（たおれて 目が うずまき・星が まわる）／ 4・5 … すわりこむ（勝った あと。にこにこ）
//   もとの 作品の 絵は 使わない（頭の 上の 角・ベスト・マントは かかない。ぼうしと 星が しるし）
import { fit, spark, bez } from './ch3-draw.js?v=dc7c9b067c89';
import { sparkled } from './c9a-art.js?v=dc7c9b067c89';

const EYE = ['#ffffff', '#1a1026'];
const pal = (P) => [...new Set([...Object.values(P), ...EYE])];

// ───── こだまのふたご（手を のばした 小さな こだまの 精。2ひきで 手を つなぐ）─────
const TW = {
  B: '#bfe8ff', BD: '#7ab4e0', BL: '#eaf8ff', // 体
  Y: '#ffe680', YD: '#e0b84a', // 頭の 星の しずく
  M: '#5a4a8a', // 口（オー）
  P: '#ffb0c8', K: '#1a1026', W: '#ffffff',
};
function twins(g0, f) {
  const g = fit(g0, 40);
  const C = TW;
  const k = g.w / g.h;
  const up = f ? 0.03 : 0;
  // しっぽ（ゆうれいの ような すそ）
  g.poly([[0.28, 0.62 - up], [0.72, 0.62 - up], [0.66, 0.86 - up], [0.56, 0.78 - up], [0.48, 0.9 - up], [0.4, 0.78 - up], [0.32, 0.86 - up]], C.BD);
  // 体
  g.ell(0.5, 0.52 - up, 0.26, 0.26 * k * 0.95, C.BD);
  g.ell(0.5, 0.5 - up, 0.24, 0.24 * k * 0.95, C.B);
  g.ell(0.42, 0.42 - up, 0.08, 0.06, C.BL);
  // 手（左右に のばす … となりの ふたごと つなぐ）
  g.line([[0.28, 0.58 - up], [0.08, 0.5 - up * 2]], C.BD, 3);
  g.line([[0.72, 0.58 - up], [0.92, 0.5 - up * 2]], C.BD, 3);
  g.ell(0.07, 0.5 - up * 2, 0.05, 0.05 * k, C.B);
  g.ell(0.93, 0.5 - up * 2, 0.05, 0.05 * k, C.B);
  // 頭の 星の しずく
  g.poly([[0.5, 0.16 - up], [0.56, 0.28 - up], [0.44, 0.28 - up]], C.YD);
  spark(g, 0.5, 0.24 - up, 0.07, C.Y, C.W);
  // 目（にこっ）と オーの 口（こだまを 言う）
  for (const ex of [0.42, 0.58]) g.ell(ex, 0.48 - up, 0.03, 0.04 * k, C.K);
  g.ell(0.5, 0.6 - up, 0.045, 0.05 * k, C.M);
  g.ell(0.36, 0.56 - up, 0.04, 0.025, C.P);
  g.ell(0.64, 0.56 - up, 0.04, 0.025, C.P);
}

// ───── つりばしヤギ（つのに 小さな かね。がけの ヤギ）─────
const GT = {
  B: '#e8e0d0', BD: '#b8ac98', BL: '#fffaf0', // 毛
  H: '#8a6a4a', HD: '#5a4430', // つの
  G: '#ffd040', GD: '#c8901a', // かね
  N: '#ffc8b8', K: '#1a1026', L: '#6a5a4a', // 鼻・目・足
  R: '#7a6a5a', RD: '#4a3e34', // 岩
};
function goat(g0, f) {
  const g = fit(g0, 56);
  const C = GT;
  const k = g.w / g.h;
  const up = f ? 0.015 : 0;
  // 岩の 足場
  g.poly([[0.1, 0.92], [0.9, 0.92], [0.82, 0.8], [0.6, 0.76], [0.3, 0.78], [0.16, 0.84]], C.RD);
  g.poly([[0.16, 0.88], [0.84, 0.88], [0.78, 0.8], [0.58, 0.78], [0.32, 0.8]], C.R);
  // 足
  for (const x of [0.32, 0.44, 0.6, 0.72]) g.rect(x - 0.025, 0.62, 0.05, 0.18, C.L);
  // 体（もこもこ）
  g.ell(0.54, 0.56 - up, 0.28, 0.16, C.BD);
  for (const [x, y] of [[0.36, 0.5], [0.48, 0.46], [0.6, 0.46], [0.72, 0.5], [0.42, 0.6], [0.64, 0.6]]) g.ell(x, y - up, 0.09, 0.08, C.B);
  g.ell(0.5, 0.46 - up, 0.06, 0.04, C.BL);
  // しっぽ
  g.ell(0.82, 0.48 - up, 0.04, 0.04 * k, C.BL);
  // 頭
  g.ell(0.24, 0.4 - up, 0.12, 0.13, C.BD);
  g.ell(0.24, 0.39 - up, 0.11, 0.12, C.B);
  g.ell(0.16, 0.46 - up, 0.06, 0.05, C.N);
  // ひげ
  g.poly([[0.2, 0.5 - up], [0.26, 0.5 - up], [0.23, 0.6 - up]], C.BL);
  // つの（くるり）
  g.line(bez([[0.26, 0.3 - up], [0.36, 0.18 - up], [0.42, 0.28 - up], [0.36, 0.34 - up]], 8), C.HD, 4);
  g.line(bez([[0.26, 0.3 - up], [0.36, 0.18 - up], [0.42, 0.28 - up], [0.36, 0.34 - up]], 8), C.H, 2.4);
  g.line(bez([[0.2, 0.3 - up], [0.12, 0.18 - up], [0.06, 0.28 - up], [0.12, 0.34 - up]], 8), C.HD, 4);
  g.line(bez([[0.2, 0.3 - up], [0.12, 0.18 - up], [0.06, 0.28 - up], [0.12, 0.34 - up]], 8), C.H, 2.4);
  // かね（ゆれる）
  const sw = f ? 0.015 : -0.015;
  for (const x of [0.36, 0.12]) {
    g.line([[x, 0.34 - up], [x + sw, 0.39 - up]], C.GD, 1);
    g.poly([[x - 0.03 + sw, 0.44 - up], [x + 0.03 + sw, 0.44 - up], [x + 0.02 + sw, 0.38 - up], [x - 0.02 + sw, 0.38 - up]], C.G);
    g.ell(x + sw, 0.45 - up, 0.01, 0.01 * k, C.GD);
  }
  // 目（はんぶん とじた のんびり 目）
  g.line([[0.2, 0.38 - up], [0.25, 0.37 - up]], C.K, 1.6);
}

// ───── かげぼうしネコ（暗やみに とけこむ 黒い ネコ。光る 目だけ）─────
const KG = {
  B: '#1c1a2e', BD: '#0c0a18', BL: '#34304e', // 体
  E: '#ffe060', EL: '#fff8c0', K: '#0a0810', // 目
  P: '#4a3a6a', // 耳の 中
};
function kage(g0, f) {
  const g = fit(g0, 48);
  const C = KG;
  const k = g.w / g.h;
  const up = f ? 0.015 : 0;
  // けむりの ような かげ（すそ）
  for (let i = 0; i < 6; i++) g.ell(0.18 + i * 0.13, 0.86 + (i % 2 ? 0.02 : 0), 0.08, 0.05, C.BD);
  // しっぽ（ゆらゆら）
  const sw = f ? 0.04 : -0.04;
  g.line(bez([[0.78, 0.7], [0.94, 0.56], [0.86 + sw, 0.34], [0.92 + sw, 0.24]], 10), C.BD, 4);
  g.line(bez([[0.78, 0.7], [0.94, 0.56], [0.86 + sw, 0.34], [0.92 + sw, 0.24]], 10), C.B, 2.4);
  // 体
  g.ell(0.52, 0.66 - up, 0.28, 0.2, C.BD);
  g.ell(0.52, 0.64 - up, 0.26, 0.18, C.B);
  g.ell(0.44, 0.58 - up, 0.1, 0.05, C.BL);
  // 頭
  g.ell(0.36, 0.42 - up, 0.2, 0.18, C.BD);
  g.ell(0.36, 0.41 - up, 0.19, 0.17, C.B);
  // 耳
  g.poly([[0.2, 0.34 - up], [0.22, 0.14 - up], [0.32, 0.28 - up]], C.B);
  g.poly([[0.22, 0.3 - up], [0.23, 0.19 - up], [0.29, 0.28 - up]], C.P);
  g.poly([[0.4, 0.28 - up], [0.5, 0.14 - up], [0.52, 0.34 - up]], C.B);
  g.poly([[0.43, 0.28 - up], [0.49, 0.19 - up], [0.5, 0.3 - up]], C.P);
  // 光る 目（コマで まばたき）
  const eh = f ? 0.05 : 0.035;
  for (const ex of [0.28, 0.44]) {
    g.ell(ex, 0.42 - up, 0.055, eh * k, C.E);
    g.ell(ex, 0.42 - up, 0.012, eh * k * 0.9, C.K);
    g.ell(ex - 0.02, 0.4 - up, 0.012, 0.012 * k, C.EL);
  }
  // ひげ
  for (const d of [-1, 1]) g.line([[0.36 + d * 0.06, 0.5 - up], [0.36 + d * 0.2, 0.48 - up + d * 0.01]], C.BL, 0.8);
}

// ───── あそびたい魔人 ムウ・ムウムウ（2倍の こまかさ）─────
const MU = {
  B: '#c8b0f0', BD: '#9a7ad0', BL: '#e8dcff', BS: '#7a5ab0', // 体（うす紫）
  C: '#3a3a8a', CD: '#24245a', CL: '#5a5ab0', // ぼうし（こん色）
  Y: '#ffe040', YD: '#d8a820', // 星
  F: '#fff4fc', // おなか
  P: '#ff9ac0', M: '#8a3a5a', T: '#ff6a8a', // ほお・口・した
  K: '#1a1026', W: '#ffffff', S: '#bff4ff', // 目・なみだ
  D: '#5a4a7a', // 足の うら
};
const MM = {
  B: '#b4ecd8', BD: '#78c8ac', BL: '#e4fff4', BS: '#4a9a80', // 体（ミント色。ピンクに しない … もとの 作品に にない ように）
  C: '#2a9a8a', CD: '#1a6a60', CL: '#8ae0d0', // ぼうし（こい みどり青）
  Y: '#fff4a0', YD: '#e0c050', // 三日月
  F: '#fffaf0', P: '#ffa8b8', M: '#5a3a4a', T: '#ff7a8a', K: '#1a1026', W: '#ffffff', S: '#bff4ff', D: '#4a6a60',
};
// 三日月
function moon(g, x, y, r, c, cut) {
  const k = g.w / g.h;
  g.ell(x, y, r, r * k, c);
  g.ell(x + r * 0.45, y - r * 0.25 * k, r * 0.8, r * 0.8 * k, cut);
}
// ナイトキャップ（ぽんぽんに 星か 月）。lean … ぼうしの さきが たれる 向き
function cap(g, C, x, y, w, lean, mumu, f, flat = false) {
  const k = g.w / g.h;
  const tipX = x + lean * w * 1.1, tipY = flat ? y + 0.02 : y - w * 0.9;
  g.poly([[x - w, y], [x + w, y], [tipX + 0.02, tipY + 0.04], [tipX - 0.01, tipY]], C.CD);
  g.poly([[x - w * 0.9, y - 0.005], [x + w * 0.85, y - 0.005], [tipX + 0.01, tipY + 0.035], [tipX - 0.005, tipY + 0.01]], C.C);
  // ぼうしの もよう（小さな 点）
  for (const [dx, dy] of [[-0.4, -0.15], [0.2, -0.3], [0.5, -0.12]]) g.ell(x + dx * w, y + dy * w, 0.008, 0.008 * k, C.CL);
  // ふち（白い もこもこ）
  g.rect(x - w * 1.02, y - 0.012, w * 2.04, 0.034, C.F);
  for (let i = 0; i < 6; i++) g.ell(x - w + (i * w * 2) / 5, y + 0.005, 0.018, 0.016, C.BL);
  // さきの しるし（ムウ … 星・ムウムウ … 三日月）
  const sx = tipX, sy = tipY + (f % 2 ? 0.006 : 0);
  if (mumu) moon(g, sx, sy, 0.035, C.Y, C.C);
  else spark(g, sx, sy, 0.05, C.Y, C.W);
}
// コマ 0・1 … 立つ（ぽよん）
function muStand(g, C, f, mumu) {
  const k = g.w / g.h;
  const up = f % 2 ? 0.012 : 0;
  const sq = f % 2 ? 0.01 : 0;
  // 足
  for (const x of [0.38, 0.62]) {
    g.ell(x, 0.9, 0.08, 0.045, C.BD);
    g.ell(x, 0.895, 0.07, 0.035, C.B);
  }
  // 体（まんまる）
  g.ell(0.5, 0.6 - up, 0.34 + sq, 0.32 - sq, C.BD);
  g.ell(0.5, 0.59 - up, 0.33 + sq, 0.31 - sq, C.B);
  g.ell(0.38, 0.46 - up, 0.1, 0.06, C.BL);
  // おなか
  g.ell(0.5, 0.7 - up, 0.18, 0.15, C.F);
  // 手（ばんざい ぎみ・ちょっと ちがう）
  const ay = mumu ? -0.02 : 0.02;
  g.ell(0.14, 0.56 - up + ay, 0.07, 0.08, C.BD);
  g.ell(0.14, 0.555 - up + ay, 0.06, 0.07, C.B);
  g.ell(0.86, 0.56 - up - ay, 0.07, 0.08, C.BD);
  g.ell(0.86, 0.555 - up - ay, 0.06, 0.07, C.B);
  // ねむそうな 目（はんぶん とじた まぶた）
  const ey = 0.5 - up;
  for (const ex of [0.4, 0.6]) {
    g.ell(ex, ey, 0.05, 0.035 * k, C.W);
    g.ell(ex, ey + 0.008, 0.028, 0.026 * k, C.K);
    // まぶた（上 はんぶんを 体の 色で）
    g.poly([[ex - 0.055, ey - 0.002], [ex + 0.055, ey - 0.002], [ex + 0.05, ey - 0.04 * k], [ex - 0.05, ey - 0.04 * k]], C.B);
    g.line([[ex - 0.052, ey - 0.002], [ex + 0.052, ey - 0.002]], C.BS, 1.6);
  }
  // ほっぺ・口（あそぼう！）
  g.ell(0.3, 0.58 - up, 0.045, 0.025, C.P);
  g.ell(0.7, 0.58 - up, 0.045, 0.025, C.P);
  g.poly([[0.44, 0.6 - up], [0.56, 0.6 - up], [0.53, 0.66 - up], [0.47, 0.66 - up]], C.M);
  g.ell(0.5, 0.645 - up, 0.03, 0.015, C.T);
  // ぼうし（ムウは 右に たれる・ムウムウは 左に たれる）
  cap(g, C, 0.5, 0.33 - up, 0.2, mumu ? -1 : 1, mumu, f);
  // ムウムウは リボン（おそろいの ブローチ の かわり … 見分け）
  if (mumu) { g.poly([[0.5, 0.82 - up], [0.42, 0.78 - up], [0.42, 0.86 - up]], C.CD); g.poly([[0.5, 0.82 - up], [0.58, 0.78 - up], [0.58, 0.86 - up]], C.CD); g.ell(0.5, 0.82 - up, 0.02, 0.02 * k, C.C); }
  else spark(g, 0.5, 0.8 - up, 0.04, C.Y, C.W);
}
// コマ 2・3 … ばたんきゅう（あおむけに たおれて 目が うずまき）
function muDown(g, C, f, mumu) {
  const k = g.w / g.h;
  // たいらに つぶれた 体
  g.ell(0.5, 0.8, 0.42, 0.14, C.BD);
  g.ell(0.5, 0.79, 0.41, 0.13, C.B);
  g.ell(0.36, 0.72, 0.12, 0.04, C.BL);
  // 足（上に つき出す）
  for (const x of [0.78, 0.88]) { g.ell(x, 0.64, 0.05, 0.06, C.BD); g.ell(x, 0.635, 0.04, 0.05, C.D); }
  // うずまきの 目
  for (const ex of [0.36, 0.52]) {
    const pts = [];
    for (let i = 0; i <= 18; i++) {
      const a = i * 0.7, r = 0.004 + i * 0.0022;
      pts.push([ex + Math.cos(a) * r, 0.76 + Math.sin(a) * r * k]);
    }
    g.line(pts, C.K, 1.6);
  }
  // 口（へにゃ）
  g.line([[0.4, 0.84], [0.44, 0.82], [0.48, 0.84]], C.M, 1.6);
  // ぼうし（ずれて 横に）
  cap(g, C, 0.2, 0.86, 0.12, -1, mumu, f, true);
  // 頭の 上を まわる 星
  for (let i = 0; i < 3; i++) {
    const a = (f % 2 ? 0.6 : 0) + (i * Math.PI * 2) / 3;
    spark(g, 0.44 + Math.cos(a) * 0.16, 0.6 + Math.sin(a) * 0.04, 0.03, '#fff4a0', '#ffffff');
  }
}
// コマ 4・5 … すわりこむ（にこにこ。たのしかった）
function muSit(g, C, f, mumu) {
  const k = g.w / g.h;
  const up = f % 2 ? 0.006 : 0;
  // のばした 足
  for (const x of [0.32, 0.68]) { g.ell(x, 0.9, 0.09, 0.05, C.BD); g.ell(x, 0.89, 0.08, 0.04, C.B); g.ell(x + (x < 0.5 ? -0.05 : 0.05), 0.89, 0.03, 0.035, C.D); }
  // 体（ぺたん）
  g.ell(0.5, 0.68 - up, 0.36, 0.26, C.BD);
  g.ell(0.5, 0.67 - up, 0.35, 0.25, C.B);
  g.ell(0.5, 0.76 - up, 0.18, 0.12, C.F);
  g.ell(0.38, 0.56 - up, 0.1, 0.05, C.BL);
  // 手（おなかの 上）
  g.ell(0.3, 0.72 - up, 0.07, 0.06, C.BD);
  g.ell(0.7, 0.72 - up, 0.07, 0.06, C.BD);
  // にこにこの 目（^ ^）
  for (const ex of [0.41, 0.59]) g.line([[ex - 0.04, 0.6 - up], [ex, 0.57 - up], [ex + 0.04, 0.6 - up]], C.K, 2);
  // ほっぺ・口
  g.ell(0.32, 0.65 - up, 0.05, 0.028, C.P);
  g.ell(0.68, 0.65 - up, 0.05, 0.028, C.P);
  g.line(bez([[0.44, 0.67 - up], [0.5, 0.72 - up], [0.56, 0.67 - up]], 6), C.M, 2);
  // あせ（たくさん あそんだ）
  g.ell(0.82, 0.5 - up, 0.018, 0.03 * k, C.S);
  g.ell(0.17, 0.54 - up, 0.015, 0.025 * k, C.S);
  // ぼうし
  cap(g, C, 0.5, 0.45 - up, 0.2, mumu ? -1 : 1, mumu, f);
}
function mu(g0, f, mumu) {
  const g = fit(g0, 208);
  const C = mumu ? MM : MU;
  if (f >= 4) return muSit(g, C, f, mumu);
  if (f >= 2) return muDown(g, C, f, mumu);
  return muStand(g, C, f, mumu);
}

export function addC9dArt(ART) {
  // 色ちがい（今の 絵。新しい 絵では ない）
  if (ART.clock_spider) ART.c9d_spider = { ...ART.clock_spider, tint: { hueTo: 30, sat: 0.7, light: 0.9 } };
  if (ART.amber_moth) ART.c9d_moth = sparkled(ART.amber_moth, { hueTo: 235, sat: 0.8, light: 1.05 });
  // 新しい 絵（こだまのふたご・つりばしヤギ・かげぼうしネコ）
  ART.c9d_twins = { size: [40, 36], pal: pal(TW), draw: twins };
  ART.c9d_goat = { size: [56, 56], pal: pal(GT), draw: goat };
  ART.c9d_kage = { size: [48, 40], pal: pal(KG), draw: kage };
  // ボス（2倍の こまかさ。monsters-c9d.js の artScale 0.5。台本の showMon でも 大きく）
  ART.c9d_mu = { size: [208, 216], npc: 0.6, pal: pal(MU), draw: (g, f) => mu(g, f, false) };
  ART.c9d_mumu = { size: [208, 216], npc: 0.6, pal: pal(MM), draw: (g, f) => mu(g, f, true) };
}
