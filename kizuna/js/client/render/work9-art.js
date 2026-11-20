// お仕事いらい板の たのまれごと 39〜41（第92回 D班）と より道「大王の、大きなランタン」「まいごの、もぐら兵」の 物の 絵
// （render/work-art.js から まぜる。人は 地下の民・もぐら兵の 絵〈render/c9b-npc-art.js〉を そのまま 使う）
// ・addWork9Art(ART) … 物の 絵（'mon:<id>' の NPC）: 大地の下の かれた わき水の 岩（わき出た あと）・ヒカリゴケの里の キノコ畑・
//     ゆうれいの 声が する 岩の われめ・帰り道の こけ石（ともす 前 ／ ともった あと）
//   より道の ざいりょうの きらりは 第90回の 'c9ad_glint' を 使う
// かきかたは work-art.js と おなじ（g … w・h の わりあいで かく。f … 0 か 1 の コマ）。大地の下の 暗い ゆかの 上で 見える 色に する

// ───────────── 39. かれた わき水の 岩 ／ わき出た わき水 ─────────────
const SP = { R: '#6a6070', RL: '#8a8094', RD: '#3e3846', K: '#221e28', M: '#3a6a4a', W: '#8ad8f0', WL: '#d8f6ff', WD: '#3a8ab8', C: '#c8e8ff' };
function springRock(g, C) {
  g.ell(0.5, 0.94, 0.46, 0.06, C.RD);
  g.poly([[0.04, 0.92], [0.08, 0.42], [0.26, 0.14], [0.56, 0.06], [0.84, 0.2], [0.96, 0.6], [0.92, 0.92]], C.R);
  g.poly([[0.16, 0.44], [0.28, 0.2], [0.5, 0.14], [0.36, 0.38]], C.RL);
  // われめ 3つ（右・まん中・左）
  g.line([[0.24, 0.5], [0.2, 0.7], [0.24, 0.9]], C.K, 1);
  g.line([[0.76, 0.46], [0.8, 0.68], [0.74, 0.9]], C.K, 1);
  // こけ
  g.ell(0.72, 0.18, 0.08, 0.03, C.M);
  g.ell(0.14, 0.86, 0.06, 0.03, C.M);
}
function drySpringArt(g, f) {
  const C = SP;
  springRock(g, C);
  // まん中の われめ（ふさがって いる）と しめった あと
  g.line([[0.5, 0.36], [0.46, 0.6], [0.52, 0.9]], C.K, 2);
  g.ell(0.5, 0.92, 0.1, 0.03, f ? C.WD : C.RD);
}
function springFlowArt(g, f) {
  const C = SP;
  springRock(g, C);
  // まん中の われめから 水（ちょろちょろ）と 小さな 池
  g.poly([[0.44, 0.36], [0.56, 0.36], [0.6, 0.9], [0.4, 0.9]], C.WD);
  g.poly([[0.47, 0.36], [0.53, 0.36], [0.55, 0.88], [0.45, 0.88]], C.W);
  g.line([[0.5, 0.4 + (f ? 0.08 : 0)], [0.5, 0.56 + (f ? 0.08 : 0)]], C.WL, 1);
  g.ell(0.5, 0.92, 0.3, 0.06, C.W);
  g.ell(f ? 0.42 : 0.58, 0.91, 0.05, 0.02, C.WL);
  // カニの あわ
  g.ell(0.82, f ? 0.62 : 0.66, 0.03, 0.03, C.C);
}

// ───────────── 40. ヒカリゴケの里の キノコ畑（光る こけの 下の うね と キノコ）─────────────
const KF = { S: '#4a3a2a', SD: '#2e2418', SL: '#6a5238', K: '#d8c8a8', KD: '#a8987a', R: '#c85a5a', RL: '#f08a7a', G: '#7ae8a0', GL: '#c8ffd8', T: '#a8784a' };
function kinokoFieldArt(g, f) {
  const C = KF;
  // うね（3本）
  for (let i = 0; i < 3; i++) {
    const y = 0.5 + i * 0.16;
    g.ell(0.5, y + 0.06, 0.46, 0.06, C.SD);
    g.ell(0.5, y + 0.04, 0.44, 0.05, C.S);
    g.ell(0.5, y + 0.02, 0.4, 0.02, C.SL);
  }
  // キノコ（赤い かさ・白い かさ）
  const kin = (x, y, s, red) => {
    g.rect(x - s * 0.25, y, s * 0.5, s * 0.9, C.K);
    g.ell(x, y, s, s * 0.6, red ? C.R : C.KD);
    g.ell(x - s * 0.3, y - s * 0.2, s * 0.25, s * 0.15, red ? C.RL : C.K);
  };
  kin(0.24, 0.46, 0.09, true); kin(0.5, 0.42, 0.11, false); kin(0.76, 0.48, 0.08, true);
  kin(0.34, 0.62, 0.08, false); kin(0.66, 0.6, 0.1, true); kin(0.5, 0.78, 0.08, true);
  // 小さな ふだ
  g.rect(0.86, 0.36, 0.02, 0.3, C.T);
  g.rect(0.8, 0.3, 0.14, 0.09, C.T);
  // 光る こけの つぶ（ちかちか）
  g.ell(f ? 0.14 : 0.18, 0.28, 0.025, 0.025, C.G);
  g.ell(f ? 0.6 : 0.56, 0.22, 0.02, 0.02, C.GL);
  g.ell(0.4, f ? 0.3 : 0.26, 0.02, 0.02, C.G);
}

// ───────────── 41. ゆうれいの 声が する 岩の われめ（上から 小石・風の すじ）─────────────
const GC = { R: '#5a5466', RL: '#7a7488', RD: '#36303e', K: '#141018', W: '#a8b8d8', P: '#8a8494' };
function ghostCrackArt(g, f) {
  const C = GC;
  g.ell(0.5, 0.94, 0.44, 0.05, C.RD);
  g.poly([[0.08, 0.94], [0.14, 0.38], [0.36, 0.12], [0.64, 0.12], [0.86, 0.38], [0.92, 0.94]], C.R);
  g.poly([[0.2, 0.4], [0.36, 0.18], [0.5, 0.16], [0.36, 0.4]], C.RL);
  // 大きな たての われめ
  g.poly([[0.46, 0.2], [0.56, 0.2], [0.6, 0.94], [0.4, 0.94]], C.K);
  // 風の すじ（ゆらゆら）
  const s = f ? 0.04 : 0;
  g.line([[0.2, 0.5 + s], [0.32, 0.46], [0.44, 0.5 - s]], C.W, 1);
  g.line([[0.58, 0.62 - s], [0.7, 0.58], [0.82, 0.62 + s]], C.W, 1);
  // 落ちて くる 小石
  g.ell(0.3, f ? 0.22 : 0.12, 0.025, 0.025, C.P);
  g.ell(0.72, 0.84, 0.03, 0.02, C.P);
}

// ───────────── より道: 帰り道の こけ石（ともす 前 ／ ともった あと）─────────────
const ST = { R: '#5a5a62', RL: '#7a7a84', RD: '#34343a', M: '#3a5a46', G: '#7af0a8', GL: '#d8ffe8', GD: '#2aa860' };
function stoneBody(g, C) {
  g.ell(0.5, 0.92, 0.36, 0.06, C.RD);
  g.poly([[0.2, 0.92], [0.18, 0.5], [0.32, 0.22], [0.5, 0.14], [0.68, 0.22], [0.82, 0.5], [0.8, 0.92]], C.R);
  g.poly([[0.28, 0.5], [0.34, 0.28], [0.48, 0.2], [0.4, 0.46]], C.RL);
}
function stoneArt(g, f) {
  const C = ST;
  stoneBody(g, C);
  // ねむって いる こけ（くすんだ 緑）
  g.ell(0.5, 0.56, 0.16, 0.14, C.M);
  g.ell(0.44, f ? 0.52 : 0.54, 0.03, 0.03, C.GD);
}
function stoneLitArt(g, f) {
  const C = ST;
  // まわりの 光
  g.ell(0.5, 0.6, f ? 0.48 : 0.44, f ? 0.42 : 0.38, C.GD);
  stoneBody(g, C);
  g.ell(0.5, 0.56, 0.2, 0.18, C.G);
  g.ell(0.46, 0.5, 0.08, 0.07, C.GL);
  g.ell(f ? 0.28 : 0.72, 0.24, 0.025, 0.025, C.GL);
}

export function addWork9Art(ART) {
  ART.fq_dry_spring = { size: [28, 28], field: 28, npc: 1, pal: Object.values(SP), draw: drySpringArt };
  ART.fq_spring_flow = { size: [28, 28], field: 28, npc: 1, pal: Object.values(SP), draw: springFlowArt };
  ART.fq_kinoko_field = { size: [30, 24], field: 30, npc: 1, pal: Object.values(KF), draw: kinokoFieldArt };
  ART.fq_ghost_crack = { size: [26, 28], field: 26, npc: 1, pal: Object.values(GC), draw: ghostCrackArt };
  ART.c9bd_stone = { size: [18, 18], field: 18, npc: 1, pal: Object.values(ST), draw: stoneArt };
  ART.c9bd_stone_lit = { size: [20, 20], field: 20, npc: 1, pal: Object.values(ST), draw: stoneLitArt };
}
