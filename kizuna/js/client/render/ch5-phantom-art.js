// 第5章 Step 8（B8）「影の城」の 魔物と、3人の まぼろしの え（shared/data/monsters-phantom.js）
// render/monsters.js が addPhantomArt を よぶ（さいごに。もとの ボスの え が もう ある とき）。かきかたは ch5-earth-mon-art.js と おなじ
//   （g … w・h の わりあいで かく。f … 0 か 1 の コマ）
// まぼろし（phantom_storm・phantom_ignia・phantom_morgana）: もとの ボスの え の うしろに 影の もや を かき、
//   色を 1つの 色あいに そろえ（tint。ストルム＝あおみどり・イグニア＝むらさき・モルガナ＝あい色）、下の ほうを すきとおらせる（fade）。
//   たたかいでは client/battle-phantom.js が ゆらぐ ざんぞうを かさねる
// まぼろしの 手下（嵐の兵の まぼろし・かげ火の まぼろし）は もとの 魔物の え の 色がえ（monsters-phantom.js の art・tint）
import { fit, spark } from './ch3-draw.js?v=848d7b87f783';

// ───── あらしガラス ─────
const CROW = {
  K: '#1e1a2a', KL: '#3a3450', KH: '#5a5478', // 黒い 羽
  B: '#e0b040', BD: '#a07a20', E: '#ff5040', // くちばし・目
  C: '#6a6a8a', CL: '#9a9ab8', Y: '#fff070', // 雲・いなずま
};
// あらしガラス: 黒い 雲を まとった 大きな カラス（正面より 少し 左むき）。コマ1で つばさを 上げる
function galeCrow(g0, f) {
  const g = fit(g0, 56);
  const C = CROW;
  const k = g.w / g.h;
  const R = (x, y, r, c) => g.ell(x, y, r, r * k, c);
  // 足もとの 雲
  for (const [x, r] of [[0.3, 0.1], [0.46, 0.13], [0.64, 0.11], [0.78, 0.08]]) g.ell(x, 0.86, r, r * 0.7, C.C);
  for (const [x, r] of [[0.36, 0.06], [0.58, 0.07]]) g.ell(x, 0.82, r, r * 0.6, C.CL);
  // つばさ（コマ1で 上げる）
  const up = f ? -0.16 : 0;
  for (const s of [-1, 1]) {
    const x0 = 0.5 + s * 0.12;
    g.poly([[x0, 0.42], [0.5 + s * 0.48, 0.28 + up], [0.5 + s * 0.46, 0.44 + up], [0.5 + s * 0.4, 0.5 + up * 0.5], [0.5 + s * 0.32, 0.6], [x0, 0.6]], C.K);
    for (let i = 0; i < 3; i++) g.line([[x0 + s * 0.04, 0.48 + i * 0.03], [0.5 + s * (0.42 - i * 0.05), 0.34 + up + i * 0.06]], C.KL, 1.2);
  }
  // 体
  g.ell(0.5, 0.56, 0.17, 0.22, C.K);
  g.ell(0.47, 0.5, 0.08, 0.12, C.KL);
  // 頭
  R(0.47, 0.28, 0.12, C.K);
  g.ell(0.44, 0.24, 0.05, 0.04, C.KH);
  // くちばし
  g.poly([[0.38, 0.29], [0.24, 0.33], [0.38, 0.35]], C.B);
  g.line([[0.37, 0.32], [0.27, 0.33]], C.BD, 0.8);
  // 目
  R(0.45, 0.27, 0.025, C.E);
  // 足
  for (const x of [0.45, 0.55]) g.line([[x, 0.76], [x, 0.82]], C.BD, 1.6);
  // かみなりの 羽（コマで ひかる 所が かわる）
  const [lx, ly] = f ? [0.78, 0.18] : [0.2, 0.36];
  g.line([[lx, ly], [lx + 0.03, ly + 0.06], [lx - 0.01, ly + 0.08], [lx + 0.02, ly + 0.14]], C.Y, 1.2);
  spark(g, f ? 0.22 : 0.8, f ? 0.4 : 0.22, 0.03, C.Y, C.CL);
}

// ───── 風車の番人 ─────
const MILL = {
  S: '#7a7468', SL: '#a49e90', SD: '#4e4a42', SDD: '#2e2c28', // 石の 体
  W: '#8a5a32', WL: '#b07a48', WD: '#5a3a1e', CL: '#d8d0b8', // 木の 頭・風車の ぬの
  E: '#80e0ff', // 目
};
// 風車の番人: 石の 体に 木の 頭、頭の 上で 4まいの はねが 回る（正面）。コマ1で はねが 45度 回る
function millKeeper(g0, f) {
  const g = fit(g0, 60);
  const C = MILL;
  const k = g.w / g.h;
  const R = (x, y, r, c) => g.ell(x, y, r, r * k, c);
  // 足
  for (const s of [-1, 1]) {
    g.rect(0.5 + s * 0.12 - 0.07, 0.78, 0.14, 0.17, C.SDD);
    g.rect(0.5 + s * 0.12 - 0.06, 0.78, 0.12, 0.15, C.SD);
  }
  // うで（はねの ような 板）
  for (const s of [-1, 1]) {
    g.line([[0.5 + s * 0.2, 0.48], [0.5 + s * 0.36, 0.62]], C.SDD, 4);
    g.poly([[0.5 + s * 0.32, 0.56], [0.5 + s * 0.46, 0.66], [0.5 + s * 0.4, 0.8], [0.5 + s * 0.3, 0.7]], C.WD);
    g.poly([[0.5 + s * 0.33, 0.58], [0.5 + s * 0.44, 0.66], [0.5 + s * 0.39, 0.77], [0.5 + s * 0.31, 0.69]], C.CL);
  }
  // 体（石の つみかさね）
  g.poly([[0.3, 0.44], [0.7, 0.44], [0.66, 0.8], [0.34, 0.8]], C.SDD);
  g.poly([[0.32, 0.45], [0.68, 0.45], [0.64, 0.78], [0.36, 0.78]], C.S);
  for (const y of [0.56, 0.67]) g.line([[0.34, y], [0.66, y]], C.SD, 1);
  for (const [x, y] of [[0.42, 0.5], [0.56, 0.61], [0.44, 0.72]]) g.ell(x, y, 0.05, 0.025, C.SL);
  // 木の 頭（小さな 家の 形）
  g.poly([[0.38, 0.3], [0.62, 0.3], [0.62, 0.45], [0.38, 0.45]], C.WD);
  g.poly([[0.39, 0.31], [0.61, 0.31], [0.61, 0.44], [0.39, 0.44]], C.W);
  g.poly([[0.35, 0.31], [0.5, 0.2], [0.65, 0.31]], C.WD);
  g.line([[0.4, 0.37], [0.6, 0.37]], C.WL, 0.8);
  for (const x of [0.45, 0.55]) R(x, 0.39, 0.022, C.E);
  // 風車の はね（4まい。コマ1で 45度）
  const cx = 0.5, cy = 0.17;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + (f ? Math.PI / 4 : 0);
    const ex = cx + Math.cos(a) * 0.17, ey = cy + Math.sin(a) * 0.15;
    g.line([[cx, cy], [ex, ey]], C.WD, 1.6);
    const px = Math.cos(a + Math.PI / 2) * 0.035, py = Math.sin(a + Math.PI / 2) * 0.03;
    g.poly([[cx + (ex - cx) * 0.35, cy + (ey - cy) * 0.35], [ex, ey], [ex + px, ey + py], [cx + (ex - cx) * 0.35 + px, cy + (ey - cy) * 0.35 + py]], C.CL);
  }
  R(cx, cy, 0.03, C.WL);
}

// ───── かまいたち ─────
const WEASEL = {
  F: '#c8b890', FL: '#e8dcb8', FD: '#8a7a58', K: '#3a3020', // 毛・こい 所
  B: '#d0e0f0', BL: '#ffffff', W: '#9ad0e0', // かまの ツメ・風
  E: '#2a1a10', N: '#e08080', // 目・はな
};
// かまいたち: つむじ風に のった 小さな いたち（左むき）。前足が かまの 形。コマ1で しっぽと 風が うごく
function windWeasel(g0, f) {
  const g = fit(g0, 48);
  const C = WEASEL;
  const k = g.w / g.h;
  const R = (x, y, r, c) => g.ell(x, y, r, r * k, c);
  // つむじ風
  for (let i = 0; i < 3; i++) {
    const y = 0.86 - i * 0.05;
    g.ell(0.56 + (f ? 0.02 : -0.02) * (i % 2 ? 1 : -1), y, 0.3 - i * 0.06, 0.04, i % 2 ? C.W : C.FL);
  }
  // しっぽ（コマで ゆれる）
  const ty = f ? 0.2 : 0.3;
  g.line([[0.7, 0.58], [0.84, 0.48], [0.9, ty]], C.FD, 4.5);
  g.line([[0.7, 0.58], [0.84, 0.48], [0.9, ty]], C.F, 3);
  // 体（ほそ長い）
  g.ell(0.56, 0.6, 0.2, 0.13, C.FD);
  g.ell(0.55, 0.58, 0.19, 0.12, C.F);
  g.ell(0.52, 0.64, 0.12, 0.05, C.FL);
  // 後ろ足
  g.line([[0.68, 0.66], [0.72, 0.76]], C.FD, 2.2);
  // 頭
  R(0.3, 0.46, 0.1, C.F);
  g.poly([[0.22, 0.48], [0.1, 0.52], [0.22, 0.54]], C.F);
  R(0.11, 0.52, 0.018, C.N);
  g.poly([[0.28, 0.36], [0.32, 0.27], [0.36, 0.37]], C.FD);
  R(0.26, 0.45, 0.022, C.E);
  g.line([[0.28, 0.5], [0.36, 0.54]], C.FL, 1);
  // かまの 前足（2本。コマ1で ふり上げる）
  const up = f ? -0.1 : 0;
  for (const [x0, d] of [[0.4, 0], [0.47, 0.03]]) {
    g.line([[x0, 0.62], [x0 - 0.06, 0.7 + up]], C.K, 2);
    g.poly([[x0 - 0.06, 0.7 + up], [x0 - 0.24 - d, 0.6 + up], [x0 - 0.2 - d, 0.66 + up], [x0 - 0.06, 0.74 + up]], C.B);
    g.line([[x0 - 0.08, 0.71 + up], [x0 - 0.22 - d, 0.62 + up]], C.BL, 0.8);
  }
}

// ───── 火の粉オオカミ ─────
const WOLF = {
  G: '#5a3a3a', GL: '#7a5048', GD: '#3a2424', // 毛なみ
  F: '#ff7a2a', FL: '#ffd060', FD: '#c83a1a', // もえる たてがみ
  E: '#fff0a0', T: '#f0f0e0', // 目・キバ
};
// 火の粉オオカミ: もえる たてがみの オオカミ（左むき）。コマ1で 火が ゆれて 口を ひらく
function emberWolf(g0, f) {
  const g = fit(g0, 62);
  const C = WOLF;
  const k = g.w / g.h;
  const R = (x, y, r, c) => g.ell(x, y, r, r * k, c);
  // 足
  for (const x of [0.32, 0.42, 0.66, 0.76]) {
    g.line([[x, 0.66], [x - 0.01, 0.92]], C.GD, 3.4);
    g.line([[x, 0.66], [x - 0.01, 0.9]], C.G, 2);
  }
  // しっぽ（火）
  g.poly([[0.82, 0.5], [0.98, 0.3 + (f ? -0.04 : 0)], [0.94, 0.48], [0.86, 0.58]], C.FD);
  g.poly([[0.84, 0.5], [0.95, 0.36 + (f ? -0.04 : 0)], [0.9, 0.5]], C.F);
  // 体
  g.ell(0.55, 0.56, 0.3, 0.16, C.GD);
  g.ell(0.55, 0.54, 0.29, 0.15, C.G);
  g.ell(0.58, 0.5, 0.18, 0.06, C.GL);
  // もえる たてがみ（コマで ゆれる）
  const sw = f ? 0.03 : 0;
  for (let i = 0; i < 5; i++) {
    const x = 0.26 + i * 0.07;
    g.poly([[x - 0.05, 0.46], [x + sw, 0.2 + (i % 2) * 0.06], [x + 0.05, 0.46]], C.FD);
    g.poly([[x - 0.03, 0.46], [x + sw * 0.5, 0.28 + (i % 2) * 0.06], [x + 0.03, 0.46]], C.F);
  }
  g.ell(0.34, 0.44, 0.08, 0.04, C.FL);
  // 頭
  g.ell(0.2, 0.44, 0.12, 0.1, C.GD);
  g.ell(0.2, 0.43, 0.11, 0.09, C.G);
  g.poly([[0.12, 0.42], [0.02, 0.48 + (f ? 0.02 : 0)], [0.12, 0.52]], C.G);
  if (f) g.poly([[0.03, 0.5], [0.12, 0.5], [0.1, 0.56]], C.GD);
  g.poly([[0.06, 0.48], [0.08, 0.52], [0.1, 0.48]], C.T);
  g.poly([[0.2, 0.34], [0.24, 0.24], [0.28, 0.36]], C.GD);
  R(0.16, 0.41, 0.02, C.E);
  // 火の粉
  for (const [x, y] of f ? [[0.4, 0.14], [0.6, 0.24], [0.12, 0.26]] : [[0.46, 0.18], [0.7, 0.3], [0.2, 0.22]]) R(x, y, 0.014, C.FL);
}

// ───── ろうそくおばけ ─────
const CANDLE = {
  W: '#f0e8d0', WD: '#c8b898', // ろう
  F: '#ffb040', FL: '#fff0a0', FC: '#ff6a2a', // 火
  E: '#3a2a4a', P: '#a08a50', PD: '#6a5a30', // 目・お皿
};
// ろうそくおばけ: とけた ろうそくに 顔（正面）。頭の 火が ゆれる。コマ1で 火が 大きく
function candleGhost(g0, f) {
  const g = fit(g0, 36);
  const C = CANDLE;
  const k = g.w / g.h;
  const R = (x, y, r, c) => g.ell(x, y, r, r * k, c);
  // お皿
  g.ell(0.5, 0.92, 0.42, 0.06, C.PD);
  g.ell(0.5, 0.9, 0.4, 0.05, C.P);
  // ろうの 体（とけて たれる）
  g.poly([[0.24, 0.4], [0.76, 0.4], [0.8, 0.9], [0.2, 0.9]], C.WD);
  g.poly([[0.27, 0.4], [0.73, 0.4], [0.76, 0.88], [0.24, 0.88]], C.W);
  for (const [x, l] of [[0.32, 0.18], [0.5, 0.1], [0.66, 0.22]]) g.ell(x, 0.4 + l / 2, 0.035, l / 2, C.WD);
  // 顔
  for (const x of [0.4, 0.6]) g.ell(x, 0.58, 0.05, 0.05, C.E);
  g.ell(0.5, 0.7, f ? 0.06 : 0.04, f ? 0.04 : 0.02, C.E);
  // 芯と 火
  g.line([[0.5, 0.4], [0.5, 0.33]], C.E, 1);
  const s = f ? 1.15 : 1;
  g.poly([[0.5, 0.34], [0.36, 0.22], [0.5, 0.34 - 0.3 * s], [0.64, 0.22]], C.FC);
  g.poly([[0.5, 0.34], [0.4, 0.24], [0.5, 0.34 - 0.24 * s], [0.6, 0.24]], C.F);
  R(0.5, 0.26, 0.06, C.FL);
}

// ───── 黒ほのおの騎士 ─────
const KNIGHT = {
  A: '#2e2a36', AL: '#4e4860', AH: '#7a7490', AD: '#18161e', // 黒い よろい
  F: '#8a3ac8', FL: '#d090ff', // 黒い 炎（むらさき）
  R: '#ff3050', S: '#c8c8d8', GO: '#c8a040', // 目・剣・かざり
};
// 黒ほのおの騎士: 黒い よろいの 騎士（正面）。右手に 炎の 剣、体から むらさきの 炎。コマ1で 炎が ゆれ、剣を 上げる
function blackflameKnight(g0, f) {
  const g = fit(g0, 60);
  const C = KNIGHT;
  const k = g.w / g.h;
  const R = (x, y, r, c) => g.ell(x, y, r, r * k, c);
  // 黒い 炎（うしろ）
  const sw = f ? 0.03 : -0.02;
  for (const [x, h] of [[0.28, 0.32], [0.4, 0.42], [0.6, 0.4], [0.72, 0.3]]) g.poly([[x - 0.08, 0.6], [x + sw, 0.6 - h], [x + 0.08, 0.6]], C.F);
  // 足
  for (const s of [-1, 1]) {
    g.rect(0.5 + s * 0.1 - 0.06, 0.74, 0.12, 0.2, C.AD);
    g.rect(0.5 + s * 0.1 - 0.05, 0.74, 0.1, 0.18, C.A);
  }
  // 体
  g.poly([[0.3, 0.34], [0.7, 0.34], [0.64, 0.76], [0.36, 0.76]], C.AD);
  g.poly([[0.32, 0.35], [0.68, 0.35], [0.62, 0.74], [0.38, 0.74]], C.A);
  g.poly([[0.42, 0.38], [0.58, 0.38], [0.55, 0.56], [0.45, 0.56]], C.AL);
  g.rect(0.36, 0.6, 0.28, 0.04, C.GO);
  // かた
  for (const s of [-1, 1]) {
    g.ell(0.5 + s * 0.22, 0.36, 0.1, 0.07, C.AD);
    g.ell(0.5 + s * 0.22, 0.35, 0.09, 0.06, C.AL);
    g.ell(0.5 + s * 0.24, 0.33, 0.04, 0.02, C.AH);
  }
  // 左手の たて
  g.poly([[0.12, 0.42], [0.28, 0.42], [0.28, 0.6], [0.2, 0.7], [0.12, 0.6]], C.AD);
  g.poly([[0.14, 0.44], [0.26, 0.44], [0.26, 0.59], [0.2, 0.67], [0.14, 0.59]], C.AL);
  g.line([[0.2, 0.46], [0.2, 0.64]], C.GO, 1);
  // 右手の 炎の 剣
  const up = f ? -0.06 : 0;
  g.line([[0.72, 0.46], [0.8, 0.5]], C.AD, 3);
  g.poly([[0.79, 0.48 + up], [0.83, 0.5 + up], [0.97, 0.12 + up], [0.94, 0.1 + up]], C.S);
  g.line([[0.83, 0.42 + up], [0.95, 0.12 + up]], C.FL, 1.2);
  g.rect(0.74, 0.47 + up, 0.12, 0.03, C.GO);
  // かぶと
  g.ell(0.5, 0.22, 0.12, 0.13, C.AD);
  g.ell(0.5, 0.21, 0.11, 0.12, C.A);
  g.rect(0.41, 0.2, 0.18, 0.04, C.AD);
  for (const x of [0.45, 0.55]) R(x, 0.22, 0.018, C.R);
  g.poly([[0.5, 0.09], [0.46, 0.0], [0.54, 0.0]], C.FL);
  g.ell(0.47, 0.15, 0.03, 0.02, C.AH);
}

// ───── 鏡くらげ ─────
const JELLY = {
  M: '#a8c8e0', ML: '#e0f0ff', MD: '#6a8aa8', // 鏡の かさ
  T: '#8ab0d0', TD: '#5a7a98', // 手
  E: '#2a3a5a', P: '#f0a0c8', WH: '#ffffff', // 目・ほっぺ・光
};
// 鏡くらげ: 鏡の ように 光る かさの くらげ（正面）。長い 手が ゆれる。コマ1で 手が 反対に ゆれ、光が うごく
function mirrorJelly(g0, f) {
  const g = fit(g0, 48);
  const C = JELLY;
  const k = g.w / g.h;
  const R = (x, y, r, c) => g.ell(x, y, r, r * k, c);
  // 手（ゆれる）
  for (let i = 0; i < 5; i++) {
    const x = 0.26 + i * 0.12;
    const d = ((i + (f ? 1 : 0)) % 2 ? 1 : -1) * 0.05;
    g.line([[x, 0.5], [x + d, 0.68], [x - d, 0.84], [x + d * 0.5, 0.96]], i % 2 ? C.TD : C.T, 1.8);
  }
  // かさ
  g.ell(0.5, 0.36, 0.38, 0.26, C.MD);
  g.ell(0.5, 0.34, 0.36, 0.24, C.M);
  g.ell(0.5, 0.52, 0.36, 0.06, C.MD);
  // 鏡の 光
  g.ell(f ? 0.62 : 0.38, 0.26, 0.12, 0.08, C.ML);
  spark(g, f ? 0.66 : 0.34, 0.22, 0.05, C.WH, C.ML);
  // 顔
  for (const x of [0.4, 0.6]) R(x, 0.4, 0.035, C.E);
  for (const x of [0.32, 0.68]) g.ell(x, 0.46, 0.04, 0.02, C.P);
  g.ell(0.5, 0.46, 0.03, 0.015, C.E);
}

// ───── 水かげの大へび ─────
const SERPENT = {
  S: '#2a5a6a', SL: '#4a8a9a', SD: '#1a3a48', B: '#a8c8b8', // うろこ・はら
  F: '#6ac0d0', E: '#ffe060', T: '#e04060', W: '#7ad0f0', // ひれ・目・した・水
};
// 水かげの大へび: とぐろを まいて 首を もたげた 大きな へび（左むき）。コマ1で 首を のばし、したを 出す
function shadeSerpent(g0, f) {
  const g = fit(g0, 70);
  const C = SERPENT;
  const k = g.w / g.h;
  const R = (x, y, r, c) => g.ell(x, y, r, r * k, c);
  // 水の わ
  g.ell(0.55, 0.92, 0.42, 0.06, C.W);
  // とぐろ（3だん）
  for (const [y, rx, ry] of [[0.82, 0.38, 0.12], [0.7, 0.32, 0.11], [0.6, 0.24, 0.09]]) {
    g.ell(0.56, y, rx, ry, C.SD);
    g.ell(0.56, y - 0.01, rx - 0.02, ry - 0.02, C.S);
    g.ell(0.5, y + 0.02, rx * 0.6, ry * 0.35, C.B);
  }
  // 首（コマ1で のびる）
  const hx = f ? 0.2 : 0.26, hy = f ? 0.18 : 0.24;
  g.line([[0.5, 0.58], [0.4, 0.44], hx + 0.08 > 0.4 ? [0.36, 0.34] : [0.34, 0.32], [hx + 0.06, hy + 0.04]], C.SD, 9);
  g.line([[0.5, 0.58], [0.4, 0.44], [0.35, 0.33], [hx + 0.06, hy + 0.04]], C.S, 6.5);
  g.line([[0.47, 0.56], [0.39, 0.45]], C.SL, 2);
  // ひれ
  g.poly([[0.42, 0.42], [0.54, 0.3], [0.5, 0.46]], C.F);
  g.poly([[0.36, 0.32], [0.46, 0.2], [0.42, 0.36]], C.F);
  // 頭
  g.ell(hx, hy, 0.12, 0.08, C.SD);
  g.ell(hx, hy - 0.005, 0.11, 0.07, C.S);
  g.ell(hx + 0.02, hy - 0.03, 0.05, 0.02, C.SL);
  R(hx - 0.03, hy - 0.02, 0.018, C.E);
  if (f) g.line([[hx - 0.1, hy + 0.02], [hx - 0.16, hy + 0.03], [hx - 0.18, hy + 0.0]], C.T, 1.2);
  else g.line([[hx - 0.1, hy + 0.02], [hx - 0.13, hy + 0.03]], C.T, 1.2);
}

// ───── あわの歌姫 ─────
const SIREN = {
  H: '#7ab8e0', HL: '#c0e4f8', HD: '#4a88b8', // あわの かみ
  S: '#d8eef6', SD: '#a8c8d8', D: '#5a9ac8', // はだ・ドレス
  B: '#e8f8ff', E: '#2a4a7a', M: '#e08aa0', // あわ・目・口
};
// あわの歌姫: あわの かみの すきとおった 歌姫（正面）。まわりに あわ。コマ1で 口を ひらいて 歌い、あわが 上がる
function foamSiren(g0, f) {
  const g = fit(g0, 46);
  const C = SIREN;
  const k = g.w / g.h;
  const R = (x, y, r, c) => g.ell(x, y, r, r * k, c);
  // 長い かみ（うしろ）
  g.poly([[0.3, 0.2], [0.7, 0.2], [0.82, 0.7], [0.7, 0.8], [0.3, 0.8], [0.18, 0.7]], C.HD);
  // ドレス（下は あわに なって きえる）
  g.poly([[0.38, 0.44], [0.62, 0.44], [0.74, 0.88], [0.26, 0.88]], C.D);
  for (const [x, r] of [[0.3, 0.06], [0.44, 0.07], [0.58, 0.07], [0.7, 0.05]]) R(x, 0.9, r, C.HL);
  // うで
  for (const s of [-1, 1]) g.line([[0.5 + s * 0.1, 0.48], [0.5 + s * 0.2, 0.6], [0.5 + s * 0.14, 0.66]], C.SD, 2);
  // 顔
  g.ell(0.5, 0.3, 0.13, 0.13, C.SD);
  g.ell(0.5, 0.29, 0.12, 0.12, C.S);
  for (const x of [0.45, 0.55]) R(x, 0.29, 0.016, C.E);
  g.ell(0.5, 0.36, f ? 0.025 : 0.02, f ? 0.02 : 0.008, C.M);
  // 前がみ
  g.poly([[0.36, 0.26], [0.42, 0.14], [0.58, 0.14], [0.64, 0.26], [0.56, 0.2], [0.44, 0.2]], C.H);
  g.ell(0.44, 0.15, 0.06, 0.03, C.HL);
  // あわ（コマで 上がる）
  const up = f ? -0.06 : 0;
  for (const [x, y, r] of [[0.16, 0.5, 0.04], [0.84, 0.42, 0.035], [0.12, 0.3, 0.025], [0.88, 0.62, 0.03], [0.8, 0.22, 0.02]]) {
    R(x, y + up, r, C.B);
    R(x - r * 0.3, y + up - r * 0.3, r * 0.3, C.H);
  }
}

// ───── 3人の まぼろし（もとの ボスの え を つつむ）─────
// 影の もや（え の うしろ。左右に ゆれる。コマ1で 反対へ）
const MIST = { M: '#2a2440', ML: '#4a4270', MH: '#7a70b0' };
function mist(g, f, top = 0.3) {
  const sw = f ? 0.03 : -0.03;
  for (const [x, y, rx, ry, c] of [[0.2, 0.7, 0.18, 0.2, MIST.M], [0.8, 0.66, 0.18, 0.22, MIST.M], [0.5, 0.82, 0.4, 0.14, MIST.M],
    [0.26 + sw, 0.5, 0.12, 0.2, MIST.ML], [0.74 - sw, 0.48, 0.12, 0.2, MIST.ML], [0.5, top + 0.1, 0.16, 0.1, MIST.ML]]) g.ell(x, y, rx, ry, c);
  for (const [x, y] of [[0.14 + sw, 0.4], [0.86 - sw, 0.36], [0.3, 0.9], [0.72, 0.9]]) g.ell(x, y, 0.03, 0.03, MIST.MH);
}
// base … もとの え（MONSTER_ART の 1つ）。tint … 色の かえかた（render/themes.js の tintCanvas）
function phantomOf(base, tint, top) {
  return {
    size: base.size.slice(),
    pal: [...new Set([...base.pal, ...Object.values(MIST)])],
    draw: (g, f) => {
      mist(g, f, top);
      base.draw(g, f);
    },
    tint,
    // 下の ほうが すきとおる（足もとが 消えかけた まぼろし）
    fade: [[0, 1], [0.62, 0.92], [0.86, 0.55], [1, 0.3]],
    phantom: true,
  };
}
// 色（render/themes.js の tintCanvas。hueTo … 色あいを その 色に そろえる）
export const PHANTOM_TINT = {
  phantom_storm: { hueTo: 186, sat: 0.8, light: 1.04 },
  phantom_ignia: { hueTo: 288, sat: 0.95, light: 1.02 },
  phantom_morgana: { hueTo: 236, sat: 0.75, light: 0.98 },
};
// え の もと（render/monsters.js の MONSTER_ART の ID）
export const PHANTOM_BASE = { phantom_storm: 'storm_general', phantom_ignia: 'flame_witch', phantom_morgana: 'morgana' };

export function addPhantomArt(ART) {
  // 風の階
  ART.gale_crow = { size: [56, 48], pal: Object.values(CROW), draw: galeCrow };
  ART.mill_keeper = { size: [60, 70], pal: Object.values(MILL), draw: millKeeper };
  ART.wind_weasel = { size: [48, 40], pal: Object.values(WEASEL), draw: windWeasel };
  // 炎の階
  ART.ember_wolf = { size: [62, 46], pal: Object.values(WOLF), draw: emberWolf };
  ART.candle_ghost = { size: [36, 52], pal: Object.values(CANDLE), draw: candleGhost };
  ART.blackflame_knight = { size: [60, 72], pal: Object.values(KNIGHT), draw: blackflameKnight };
  // 水の階
  ART.mirror_jelly = { size: [48, 60], pal: Object.values(JELLY), draw: mirrorJelly };
  ART.shade_serpent = { size: [70, 60], pal: Object.values(SERPENT), draw: shadeSerpent };
  ART.foam_siren = { size: [46, 66], pal: Object.values(SIREN), draw: foamSiren };
  // 3人の まぼろし（もとの ボスの え が ある とき）
  for (const [id, from] of Object.entries(PHANTOM_BASE)) {
    if (ART[from]) ART[id] = phantomOf(ART[from], PHANTOM_TINT[id], id === 'phantom_morgana' ? 0.2 : 0.3);
  }
}
