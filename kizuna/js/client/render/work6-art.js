// お仕事いらい板の たのまれごと 30〜32（第75回 D班）と 千年前の ミドリナの より道（第75回 D班）の 絵（render/work-art.js から まぜる）
// ・addWork6Art(ART) … 物の 絵（'mon:<id>' の NPC）: 嵐の島の ゴロゴロかみなり雲／にこにこ雲・雪原の広場の ラーメンの 屋台・
//     千年前の ホシフルの里の やきいもの 灰の 山・千年前の 泉の里の 南の むくろじの 木（より道）
//     （まいごの ちび竜は 今までの ちびドラゴンの 絵）
// ・WORK6_NPC_LOOKS … 人の みため（render/chars.js の NPC_LOOKS に まざる）
// かきかたは work-art.js と おなじ（g … w・h の わりあいで かく。f … 0 か 1 の コマ）
import { spark } from './ch3-draw.js?v=65d7afc110b4';

// ───────────── 人の みため ─────────────
export const WORK6_NPC_LOOKS = {
  // 嵐の島: 漁師の おかみさんシオ（あいの エプロン・白い バンダナ）・漁師の 男の子タク（しまの シャツ）・天気見の おばあさん（空色の ローブ・つえ）
  fq_fisher_wife: { hair: 1, hairStyle: 'bun', skin: 1, outfit: 'apron', cloth: '#3a5a8a', female: true, hat: 'bandana', hatColor: '#f4f4f4' },
  fq_fisher_boy: { hair: 0, hairStyle: 'spiky', skin: 2, outfit: 'tunic', cloth: '#e8e8f0', small: true, hat: 'bandana', hatColor: '#d83a3a' },
  fq_weather_granny: { hair: 5, hairStyle: 'bun', skin: 0, outfit: 'robe', robeMain: '#7ab8e0', robeTrim: '#f4f4f4', female: true, cane: true, hunch: true },
  // 星竜山のふもと: 竜守りの 見習いアオイ（青い 服・白い はちまき）・竜守りの おばあさん（こい 青の ローブ）・旅の かりゅうど（茶色の ベスト・ぼうし）
  fq_dragon_girl: { hair: 2, hairStyle: 'pony', skin: 0, outfit: 'tunic', cloth: '#3a7ac8', female: true, hat: 'headband', hatColor: '#f4f4f4' },
  fq_dragon_granny: { hair: 5, hairStyle: 'bun', skin: 1, outfit: 'robe', robeMain: '#2a4a7a', robeTrim: '#e8c050', female: true, cane: true, hunch: true },
  fq_hunter: { hair: 3, hairStyle: 'short', skin: 1, outfit: 'vest', cloth: '#7a5a32', hat: 'cap', hatColor: '#5a4a2a', beard: true },
  // 雪原の広場: 屋台の テツおやじ（白い 上着・ねじり はちまき）・むすめユズ（赤い エプロン）・忍者ごっこの 男の子（オレンジの 服・青い はちまき）
  fq_ramen_master: { hair: 5, hairStyle: 'short', skin: 1, outfit: 'apron', cloth: '#f4f0e4', beard: true, hat: 'headband', hatColor: '#f4f4f4' },
  fq_ramen_girl: { hair: 1, hairStyle: 'twin', skin: 0, outfit: 'apron', cloth: '#d83a3a', female: true, small: true, hat: 'bandana', hatColor: '#f4f4f4' },
  fq_ninja_kid: { hair: '#f0c838', hairStyle: 'spiky', skin: 0, outfit: 'tunic', cloth: '#f0883a', small: true, hat: 'headband', hatColor: '#3a4a8a' },
};

// ───────────── 30. 嵐の島の ゴロゴロかみなり雲（おこった 目・いなずまが ピカッ）─────────────
const TC = { D: '#3a3a4a', M: '#5a5a6e', L: '#7a7a90', E: '#f4f4f4', K: '#1a1a22', Y: '#f8e040', YL: '#fff8b0', S: '#a8b0b8' };
function thunderCloudArt(g, f) {
  const C = TC;
  g.ell(0.5, 0.92, 0.3, 0.05, C.S);
  // 雲（ふわふわの かたまり）
  g.ell(0.5, 0.42, 0.42, 0.22, C.D);
  g.ell(0.3, 0.36, 0.18, 0.16, C.M);
  g.ell(0.55, 0.28, 0.22, 0.18, C.M);
  g.ell(0.74, 0.38, 0.16, 0.14, C.M);
  g.ell(0.5, 0.46, 0.36, 0.14, C.M);
  g.ell(0.48, 0.24, 0.1, 0.06, C.L);
  // おこった 目と まゆ
  g.ell(0.4, 0.44, 0.05, 0.05, C.E); g.ell(0.6, 0.44, 0.05, 0.05, C.E);
  g.ell(0.41, 0.45, 0.025, 0.025, C.K); g.ell(0.59, 0.45, 0.025, 0.025, C.K);
  g.line([[0.33, 0.36], [0.45, 0.4]], C.K, 1); g.line([[0.67, 0.36], [0.55, 0.4]], C.K, 1);
  g.line([[0.44, 0.54], [0.5, 0.51], [0.56, 0.54]], C.K, 1);
  // いなずま（2コマで ピカッ）
  const bolt = [[0.34, 0.6], [0.28, 0.74], [0.34, 0.74], [0.27, 0.9], [0.42, 0.7], [0.36, 0.7], [0.42, 0.6]];
  g.poly(bolt, f ? C.YL : C.Y);
  if (f) g.poly([[0.68, 0.6], [0.64, 0.72], [0.69, 0.72], [0.64, 0.84], [0.75, 0.68], [0.7, 0.68], [0.74, 0.6]], C.Y);
}

// ───────────── 30. にこにこ雲（白い 雲・にこにこ顔・小さな にじ）─────────────
const SC = { W: '#f4f8fc', L: '#ffffff', G: '#c8d4e4', K: '#3a3a4a', P: '#f4a8b8', R: '#f05a5a', O: '#f8b040', Y: '#f8e860', Gr: '#5ac87a', B: '#5a9ae8', D: '#8ac8f0' };
function smileCloudArt(g, f) {
  const C = SC;
  // 小さな にじ（うしろ）
  const arc = (r) => Array.from({ length: 13 }, (_, i) => [0.5 - Math.cos((i / 12) * Math.PI) * (r + 0.06), 0.7 - Math.sin((i / 12) * Math.PI) * r]);
  [[C.R, 0.4], [C.O, 0.37], [C.Y, 0.34], [C.Gr, 0.31], [C.B, 0.28]].forEach(([c, r]) => g.line(arc(r), c, 1));
  // 雲
  const y = f ? 0.4 : 0.42;
  g.ell(0.5, y + 0.06, 0.4, 0.18, C.G);
  g.ell(0.32, y, 0.16, 0.14, C.W);
  g.ell(0.55, y - 0.08, 0.2, 0.16, C.W);
  g.ell(0.72, y + 0.02, 0.14, 0.12, C.W);
  g.ell(0.5, y + 0.06, 0.34, 0.12, C.W);
  g.ell(0.48, y - 0.12, 0.08, 0.05, C.L);
  // にこにこ顔
  g.line([[0.38, y + 0.02], [0.41, y - 0.01], [0.44, y + 0.02]], C.K, 1);
  g.line([[0.56, y + 0.02], [0.59, y - 0.01], [0.62, y + 0.02]], C.K, 1);
  g.line([[0.44, y + 0.08], [0.5, y + 0.12], [0.56, y + 0.08]], C.K, 1);
  g.ell(0.35, y + 0.08, 0.03, 0.02, C.P); g.ell(0.65, y + 0.08, 0.03, 0.02, C.P);
  // 雨つぶ（やさしい 雨）
  for (const [x, dy] of [[0.36, 0], [0.5, 0.06], [0.64, 0.02]]) g.ell(x, 0.72 + dy + (f ? 0.04 : 0), 0.015, 0.03, C.D);
}

// ───────────── 32. 雪原の広場の ラーメンの 屋台（のれん・ちょうちん・湯気）─────────────
const RS = { W: '#8a5a32', WL: '#b07a48', WD: '#5a3a1e', R: '#d83a3a', RL: '#f05a5a', N: '#f4f0e4', K: '#2a1a12', L: '#f8c048', LL: '#fff0a0', S: '#ffffff', SN: '#e8eef8', B: '#f4f4f4' };
function ramenStallArt(g, f) {
  const C = RS;
  g.ell(0.5, 0.94, 0.46, 0.05, C.SN);
  // やね
  g.poly([[0.06, 0.3], [0.5, 0.14], [0.94, 0.3], [0.88, 0.36], [0.12, 0.36]], C.R);
  g.line([[0.12, 0.36], [0.88, 0.36]], C.WD, 1);
  // はしら
  g.rect(0.12, 0.36, 0.05, 0.54, C.WD);
  g.rect(0.83, 0.36, 0.05, 0.54, C.WD);
  // のれん（3まい。ゆれる）
  const sw = f ? 0.01 : 0;
  for (let i = 0; i < 3; i++) g.rect(0.2 + i * 0.21 + sw, 0.37, 0.18, 0.14, C.N);
  g.line([[0.29 + sw, 0.42], [0.29 + sw, 0.48]], C.R, 1);
  g.line([[0.5 + sw, 0.42], [0.5 + sw, 0.48]], C.R, 1);
  g.line([[0.71 + sw, 0.42], [0.71 + sw, 0.48]], C.R, 1);
  // カウンターと なべ
  g.rect(0.14, 0.62, 0.72, 0.28, C.W);
  g.rect(0.14, 0.62, 0.72, 0.05, C.WL);
  g.line([[0.14, 0.76], [0.86, 0.76]], C.WD, 1);
  g.ell(0.36, 0.6, 0.1, 0.04, C.K);
  g.ell(0.62, 0.6, 0.08, 0.03, C.B);
  // ちょうちん
  g.ell(0.08, 0.46, 0.05, 0.07, f ? C.LL : C.L);
  g.ell(0.92, 0.46, 0.05, 0.07, f ? C.L : C.LL);
  // 湯気
  const s = f ? -0.03 : 0;
  g.ell(0.34, 0.52 + s, 0.04, 0.03, C.S); g.ell(0.38, 0.46 + s, 0.03, 0.025, C.S); g.ell(0.33, 0.41 + s, 0.025, 0.02, C.S);
}

// ───────────── より道: 千年前の ホシフルの里の やきいもの 灰の 山（あつい 灰・葉っぱで くるんだ いも・けむり）─────────────
const IM = { A: '#8a8478', AL: '#b0aa9c', AD: '#5a564e', E: '#f05a2a', EL: '#f8b048', L: '#4a8a3a', LL: '#7ab85a', P: '#a8486a', S: '#d8d8d8', T: '#6a4a2a' };
function imoArt(g, f) {
  const C = IM;
  // 灰の 山
  g.ell(0.5, 0.8, 0.42, 0.14, C.AD);
  g.ell(0.5, 0.74, 0.38, 0.14, C.A);
  g.ell(0.42, 0.7, 0.14, 0.05, C.AL);
  // おき火（ちらちら）
  g.ell(0.3, 0.78, 0.04, 0.02, f ? C.EL : C.E);
  g.ell(0.66, 0.8, 0.04, 0.02, f ? C.E : C.EL);
  // 葉っぱに くるんだ いも（顔を 出す）
  g.ell(0.44, 0.68, 0.09, 0.05, C.L);
  g.ell(0.58, 0.7, 0.08, 0.045, C.LL);
  g.ell(0.38, 0.67, 0.03, 0.03, C.P);
  // 細い 木の えだ
  g.line([[0.72, 0.56], [0.84, 0.82]], C.T, 1);
  // けむり
  const s = f ? -0.03 : 0;
  g.ell(0.5, 0.54 + s, 0.04, 0.03, C.S); g.ell(0.54, 0.46 + s, 0.035, 0.025, C.S); g.ell(0.49, 0.38 + s, 0.03, 0.02, C.S);
}

// ───────────── より道: 千年前の 泉の里の 南の むくろじの 木（黄色い まるい 実）─────────────
const MK = { T: '#6a4a2a', TD: '#4a321a', G: '#3a8a3a', GL: '#5ab05a', GD: '#2a6a2a', Y: '#f0c048', YL: '#fff0a0', S: '#7aa85a' };
function soapTreeArt(g, f) {
  const C = MK;
  g.ell(0.5, 0.94, 0.3, 0.05, C.S);
  // みき
  g.rect(0.44, 0.56, 0.12, 0.38, C.T);
  g.line([[0.48, 0.6], [0.48, 0.9]], C.TD, 1);
  // は
  g.ell(0.5, 0.38, 0.4, 0.28, C.GD);
  g.ell(0.46, 0.34, 0.34, 0.24, C.G);
  g.ell(0.36, 0.26, 0.12, 0.08, C.GL);
  // 黄色い 実（きらり）
  for (const [x, y] of [[0.3, 0.44], [0.5, 0.5], [0.66, 0.4], [0.58, 0.26], [0.4, 0.34]]) g.ell(x, y, 0.035, 0.035, C.Y);
  if (f) spark(g, 0.66, 0.4, 0.04, C.YL, '#ffffff');
}

export function addWork6Art(ART) {
  ART.fq_thunder_cloud = { size: [30, 28], field: 30, npc: 1, pal: Object.values(TC), draw: thunderCloudArt };
  ART.fq_smile_cloud = { size: [30, 26], field: 30, npc: 1, pal: Object.values(SC), draw: smileCloudArt };
  ART.fq_ramen_stall = { size: [34, 30], field: 34, npc: 1, pal: Object.values(RS), draw: ramenStallArt };
  ART.c8cd_imo = { size: [24, 20], field: 24, npc: 1, pal: Object.values(IM), draw: imoArt };
  ART.c8cd_soap_tree = { size: [24, 28], field: 24, npc: 1, pal: Object.values(MK), draw: soapTreeArt };
}
