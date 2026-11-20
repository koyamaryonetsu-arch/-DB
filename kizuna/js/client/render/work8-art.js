// お仕事いらい板の たのまれごと 36〜38（第90回 D班）と より道「星ふるえで、まいごになった物」（第90回 D班）の 絵（render/work-art.js から まぜる）
// ・addWork8Art(ART) … 物の 絵（'mon:<id>' の NPC）: ルミナの 星ぞら教室の 黒板・鏡の湖の かがり火（こおった ／ ともった）・道を ふさいだ 大岩・
//     より道の 落とし物の きらり・たこが ひっかかった 木（たこを とった あとの 木）・木の はしご
// ・WORK8_NPC_LOOKS … 人の みため（render/chars.js の NPC_LOOKS に まざる。より道の 人も）
// かきかたは work-art.js と おなじ（g … w・h の わりあいで かく。f … 0 か 1 の コマ）

// ───────────── 人の みため ─────────────
export const WORK8_NPC_LOOKS = {
  // 36. ルミナの町: 子どもたちの お母さんサナ（きいろの エプロン）・こわがっている 子どもたち（毛布を かぶった 小さな 子）・
  //   ねむれない 男の子テト（パジャマ色・ナイトキャップの かわりの バンダナ）・星読みの おじいさん（こん色の ローブ）・おねえちゃんのリリ（もも色の ドレス）
  fq_kids_mom: { hair: 3, hairStyle: 'bun', skin: 1, outfit: 'apron', cloth: '#f0c84a', female: true, hat: 'bandana', hatColor: '#f4f0e0' },
  fq_scared_kids: { hair: 1, hairStyle: 'short', skin: 0, outfit: 'robe', robeMain: '#8ab0e0', robeTrim: '#f4f0e0', small: true, hat: 'cowl', hatColor: '#8ab0e0' },
  fq_sleepy_boy: { hair: 0, hairStyle: 'spiky', skin: 1, outfit: 'tunic', cloth: '#7ab0e8', small: true, hat: 'bandana', hatColor: '#4a6ab8' },
  fq_star_elder: { hair: 5, hairStyle: 'long', skin: 0, outfit: 'robe', robeMain: '#2a3a6a', robeTrim: '#f2d060', beard: true, cane: true, hat: 'wizard', hatColor: '#2a3a6a' },
  fq_big_sister: { hair: 2, hairStyle: 'pony', skin: 0, outfit: 'dress', cloth: '#f08ab0', female: true, small: true, hat: 'ribbon', hatColor: '#ffffff' },
  // 37. 鏡の湖: わたし守ナギサ（水色の ベスト・ポニーテール）・つりびと（茶色の ベスト・ぼうし）・湖の 子どもミズキ（水色の 服）・見はり番の おばあさん（ショール）
  fq_ferry_girl: { hair: 1, hairStyle: 'pony', skin: 1, outfit: 'vest', cloth: '#3a9ac8', female: true, hat: 'bandana', hatColor: '#f4f4f4' },
  fq_lake_angler: { hair: 5, hairStyle: 'short', skin: 1, outfit: 'vest', cloth: '#7a6a3a', beard: true, hat: 'cap', hatColor: '#5a7a4a' },
  fq_lake_kid: { hair: 3, hairStyle: 'twin', skin: 1, outfit: 'tunic', cloth: '#5ac8e8', female: true, small: true },
  fq_watch_granny: { hair: 5, hairStyle: 'bun', skin: 0, outfit: 'dress', cloth: '#7a4a6a', female: true, hunch: true, cane: true, hat: 'shawl', hatColor: '#c8a8d8' },
  // 38. ミドリナ平原: 見回りの 兵士ガンテ（よろい・かぶと）・薬屋の おねえさんユズ（白い 上着）・ミルク売りの おじさん（青い エプロン）・材木屋の おじいさん（はちまき）
  fq_road_guard: { hair: 0, hairStyle: 'short', skin: 2, outfit: 'armor', cloth: '#4a6a9a', hat: 'helmet', hatColor: '#b8c0c8', spear: true },
  fq_medicine_girl: { hair: 0, hairStyle: 'long', skin: 0, outfit: 'robe', robeMain: '#f4f4f0', robeTrim: '#5ab87a', female: true, hat: 'ribbon', hatColor: '#5ab87a' },
  fq_milkman: { hair: 1, hairStyle: 'short', skin: 1, outfit: 'apron', cloth: '#4a7ac8', beard: true, hat: 'cap', hatColor: '#f4f4f4' },
  fq_lumber_elder: { hair: 5, hairStyle: 'bald', skin: 1, outfit: 'vest', cloth: '#8a5a32', beard: true, hunch: true, hat: 'headband', hatColor: '#f4f4f4' },
  // より道: 落とし物あずかり所の おねえさん（こん色の 上着・ぼうし）・笛ふきの おじいさん・ルミナの 女の子ノノ・羊かいの おにいさん・小さな 男の子ピコ
  c9ad_clerk: { hair: 2, hairStyle: 'bun', skin: 0, outfit: 'suit', cloth: '#2a4a7a', tie: '#f2c14e', female: true, hat: 'conductor', hatColor: '#2a4a7a' },
  c9ad_flute_elder: { hair: 5, hairStyle: 'short', skin: 1, outfit: 'robe', robeMain: '#5a8a4a', robeTrim: '#f4e8c0', beard: true, hat: 'feather', hatColor: '#c84a3a' },
  c9ad_nono: { hair: 4, hairStyle: 'twin', skin: 0, outfit: 'dress', cloth: '#8a6ae0', female: true, small: true, hat: 'ribbon', hatColor: '#f2d060' },
  c9ad_shepherd: { hair: 1, hairStyle: 'spiky', skin: 1, outfit: 'traveler', cloth: '#6a9a4a', hat: 'cap', hatColor: '#c8a870' },
  c9ad_piko: { hair: 0, hairStyle: 'short', skin: 2, outfit: 'tunic', cloth: '#e86a3a', small: true },
};

// ───────────── 36. 星ぞら教室の 黒板（木の 足・夜空と ながれ星の 絵）─────────────
const SB = { W: '#a8783e', WD: '#6a4a24', B: '#2a4a3a', BL: '#3a5a4a', C: '#f4f4f0', Y: '#f2d060', G: '#7ab85a' };
function starBoardArt(g, f) {
  const C = SB;
  g.ell(0.5, 0.95, 0.42, 0.05, C.G);
  // 足
  g.line([[0.2, 0.62], [0.12, 0.94]], C.WD, 2);
  g.line([[0.8, 0.62], [0.88, 0.94]], C.WD, 2);
  // わく と 黒板
  g.rect(0.08, 0.12, 0.84, 0.56, C.W);
  g.rect(0.13, 0.17, 0.74, 0.46, C.B);
  g.rect(0.13, 0.17, 0.74, 0.06, C.BL);
  // 星（チョーク）と ながれ星
  g.poly([[0.3, 0.3], [0.32, 0.36], [0.38, 0.36], [0.33, 0.4], [0.35, 0.46], [0.3, 0.42], [0.25, 0.46], [0.27, 0.4], [0.22, 0.36], [0.28, 0.36]], C.Y);
  g.line([[0.48, 0.3], [0.72, 0.5]], C.C, 1);
  g.ell(0.74, 0.52, 0.03, 0.03, C.Y);
  g.ell(f ? 0.6 : 0.56, 0.32, 0.015, 0.015, C.C);
  // チョーク おき
  g.rect(0.13, 0.63, 0.74, 0.03, C.WD);
  g.rect(0.3, 0.6, 0.06, 0.03, C.C);
}

// ───────────── 37. 鏡の湖の かがり火（こおった ／ ともった。石の 台・まき）─────────────
const FF = { R: '#8a8478', RL: '#b0aa9c', RD: '#5a564e', I: '#c8e8f8', IL: '#f0faff', ID: '#8ab8d8', W: '#7a5a34', O: '#f08a2a', Y: '#ffd84a', F: '#e83a1a', S: '#e8eef8' };
function brazierBase(g, C) {
  g.ell(0.5, 0.95, 0.36, 0.05, C.RD);
  g.rect(0.42, 0.5, 0.16, 0.42, C.R);
  g.rect(0.42, 0.5, 0.04, 0.42, C.RL);
  g.rect(0.3, 0.86, 0.4, 0.08, C.R);
  // 火を たく 皿
  g.poly([[0.16, 0.4], [0.84, 0.4], [0.7, 0.54], [0.3, 0.54]], C.RD);
  g.rect(0.16, 0.38, 0.68, 0.04, C.R);
}
function frozenFireArt(g, f) {
  const C = FF;
  brazierBase(g, C);
  // 氷の かたまり（台ごと）
  g.poly([[0.12, 0.62], [0.18, 0.2], [0.36, 0.08], [0.6, 0.1], [0.82, 0.22], [0.88, 0.6], [0.7, 0.7], [0.3, 0.7]], C.I);
  g.poly([[0.22, 0.24], [0.36, 0.14], [0.44, 0.3], [0.3, 0.44]], C.IL);
  g.line([[0.6, 0.16], [0.7, 0.4], [0.62, 0.6]], C.ID, 1);
  // きらり
  g.ell(f ? 0.74 : 0.28, f ? 0.3 : 0.56, 0.025, 0.025, C.IL);
}
function litFireArt(g, f) {
  const C = FF;
  brazierBase(g, C);
  // まき
  g.line([[0.28, 0.4], [0.66, 0.3]], C.W, 2);
  g.line([[0.72, 0.4], [0.34, 0.3]], C.W, 2);
  // ほのお（ゆらゆら）
  const s = f ? 0.03 : 0;
  g.poly([[0.26, 0.38], [0.34 - s, 0.14], [0.44, 0.26], [0.5 + s, 0.02], [0.58, 0.24], [0.68 + s, 0.12], [0.74, 0.38]], C.O);
  g.poly([[0.36, 0.38], [0.44, 0.2 + s], [0.5, 0.28], [0.56, 0.16 - s], [0.64, 0.38]], C.Y);
  g.ell(0.5, 0.34, 0.06, 0.03, C.F);
}

// ───────────── 38. 道を ふさいだ 大岩 ─────────────
const RK = { R: '#8a8478', RL: '#aaa498', RD: '#5a564e', K: '#3a3632', G: '#7ab85a', M: '#5a8a3a' };
function roadRockArt(g, f) {
  const C = RK;
  g.ell(0.5, 0.94, 0.46, 0.06, C.G);
  g.poly([[0.06, 0.9], [0.1, 0.5], [0.3, 0.2], [0.6, 0.12], [0.86, 0.3], [0.96, 0.66], [0.9, 0.92]], C.R);
  g.poly([[0.18, 0.5], [0.32, 0.26], [0.52, 0.2], [0.4, 0.42]], C.RL);
  g.poly([[0.62, 0.9], [0.86, 0.5], [0.9, 0.92]], C.RD);
  g.line([[0.46, 0.5], [0.58, 0.66], [0.54, 0.84]], C.K, 1);
  // こけ と 草
  g.ell(0.7, 0.24, 0.08, 0.03, C.M);
  g.line([[0.12, 0.92], [0.1, f ? 0.8 : 0.82]], C.M, 1);
  g.line([[0.86, 0.92], [0.9, f ? 0.82 : 0.8]], C.M, 1);
}

// ───────────── より道: 落とし物の きらり・たこの 木・木・はしご ─────────────
const GL = { Y: '#ffe680', W: '#ffffff', G: '#7ab85a', D: '#4a7a3a' };
function glintArt(g, f) {
  const C = GL;
  // 草むら と きらり（ちかちか）
  g.ell(0.5, 0.86, 0.34, 0.1, C.D);
  g.ell(0.38, 0.8, 0.14, 0.12, C.G);
  g.ell(0.62, 0.8, 0.14, 0.12, C.G);
  const r = f ? 0.2 : 0.14;
  g.poly([[0.5, 0.5 - r], [0.54, 0.5], [0.5, 0.5 + r], [0.46, 0.5]], C.Y);
  g.poly([[0.5 - r, 0.5], [0.5, 0.46], [0.5 + r, 0.5], [0.5, 0.54]], C.Y);
  g.ell(0.5, 0.5, 0.04, 0.04, C.W);
}
const TR = { T: '#7a5232', TD: '#5a3a22', L: '#4a9a4a', LL: '#6ab85a', LD: '#2e7a3a', K: '#f2d060', KR: '#e85a4a', S: '#f4f4f4' };
function treeBody(g, C, f) {
  g.ell(0.5, 0.95, 0.34, 0.05, C.LD);
  g.rect(0.42, 0.52, 0.16, 0.42, C.T);
  g.rect(0.42, 0.52, 0.05, 0.42, C.TD);
  g.ell(0.5, 0.36, 0.42, 0.28, C.L);
  g.ell(0.36, 0.28, 0.18, 0.14, C.LL);
  g.ell(0.66, 0.44, 0.16, 0.12, C.LD);
  g.ell(f ? 0.6 : 0.58, 0.2, 0.1, 0.07, C.LL);
}
function kiteTreeArt(g, f) {
  const C = TR;
  treeBody(g, C, f);
  // 枝に ひっかかった 星の たこ と しっぽ
  g.poly([[0.72, 0.04], [0.76, 0.12], [0.84, 0.12], [0.78, 0.17], [0.8, 0.25], [0.72, 0.2], [0.64, 0.25], [0.66, 0.17], [0.6, 0.12], [0.68, 0.12]], C.K);
  g.line([[0.72, 0.24], [f ? 0.8 : 0.76, 0.34], [0.74, 0.44]], C.KR, 1);
}
function plainTreeArt(g, f) {
  treeBody(g, TR, f);
}
const LD = { W: '#b8884a', WD: '#7a5a34', G: '#7ab85a' };
function ladderArt(g) {
  const C = LD;
  g.ell(0.5, 0.95, 0.3, 0.04, C.G);
  g.line([[0.3, 0.94], [0.38, 0.06]], C.WD, 2);
  g.line([[0.7, 0.94], [0.62, 0.06]], C.WD, 2);
  for (let i = 0; i < 6; i++) {
    const y = 0.16 + i * 0.14;
    g.line([[0.37 - i * 0.012, y], [0.63 + i * 0.012, y]], C.W, 2);
  }
}

export function addWork8Art(ART) {
  ART.fq_star_board = { size: [28, 26], field: 28, npc: 1, pal: Object.values(SB), draw: starBoardArt };
  ART.fq_frozen_fire = { size: [24, 28], field: 24, npc: 1, pal: Object.values(FF), draw: frozenFireArt };
  ART.fq_lit_fire = { size: [24, 28], field: 24, npc: 1, pal: Object.values(FF), draw: litFireArt };
  ART.fq_road_rock = { size: [30, 26], field: 30, npc: 1, pal: Object.values(RK), draw: roadRockArt };
  ART.c9ad_glint = { size: [18, 18], field: 18, npc: 1, pal: Object.values(GL), draw: glintArt };
  ART.c9ad_kite_tree = { size: [32, 36], field: 32, npc: 1, pal: Object.values(TR), draw: kiteTreeArt };
  ART.c9ad_tree = { size: [32, 36], field: 32, npc: 1, pal: Object.values(TR), draw: plainTreeArt };
  ART.c9ad_ladder = { size: [16, 28], field: 16, npc: 1, pal: Object.values(LD), draw: ladderArt };
}
