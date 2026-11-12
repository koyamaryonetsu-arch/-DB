// お仕事いらい板の たのまれごと 24〜26（第73回 D班）と 千年前の 緑の王国の より道（第73回 D班）の 絵（render/work-art.js から まぜる）
// ・addWork4Art(ART) … 物の 絵（'mon:<id>' の NPC）: ひみつの温泉の 湯けむりの 白い岩・ピラミッドの 前の はっくつの あな・
//     千年前の 市場の 天びんばかり（より道「市場のずるい分銅」）
//     （子ザルは 今までの サル、子ラクダは 今までの ラクダの 絵。ハネノの島は 人の 絵だけ）
// ・WORK4_NPC_LOOKS … 人の みため（render/chars.js の NPC_LOOKS に まざる）
// かきかたは work-art.js と おなじ（g … w・h の わりあいで かく。f … 0 か 1 の コマ）
import { spark } from './ch3-draw.js?v=ddd62e12d679';

// ───────────── 人の みため ─────────────
export const WORK4_NPC_LOOKS = {
  // ひみつの温泉の 温泉守りイワオ（こげ茶の はんてん・頭に 手ぬぐい・つえ）・れん金術師見習いアルト（赤い コート・金の かみ）
  fq_spa_keeper: { hair: 5, hairStyle: 'bald', skin: 1, outfit: 'robe', robeMain: '#7a4a2e', robeTrim: '#e8d8b0', beard: true, cane: true, hunch: true, hat: 'bandana', hatColor: '#f4f4f4' },
  fq_alch_kid: { hair: 3, hairStyle: 'pony', skin: 0, outfit: 'traveler', cloth: '#c83a3a', small: true },
  // ハネノの島の ソヨ（空色の ワンピース・小さな はね）・フワ（白い シャツ・小さな はね）・雲つりの おじいさん（麦わらぼうし・はね）
  fq_soyo: { hair: 2, hairStyle: 'twin', skin: 0, outfit: 'dress', cloth: '#8ad0f0', female: true, small: true, wings: '#ffffff', wingSize: 'small' },
  fq_fuwa: { hair: 0, hairStyle: 'spiky', skin: 1, outfit: 'tunic', cloth: '#f4f4f4', small: true, wings: '#f4f6ff', wingSize: 'small' },
  fq_cloud_fisher: { hair: 5, hairStyle: 'bald', skin: 1, outfit: 'vest', cloth: '#5a8ac8', beard: true, hat: 'straw', wings: '#d8dce4' },
  // ピラミッドの はっくつ隊の 隊長ザイナブ（すな色の 服・ぼうし）・料理番（白い エプロン・ターバン）
  fq_dig_boss: { hair: 1, hairStyle: 'pony', skin: 2, outfit: 'vest', cloth: '#c8a060', female: true, hat: 'cap', hatColor: '#8a6a3a', glasses: true },
  fq_dig_cook: { hair: 2, hairStyle: 'bun', skin: 2, outfit: 'apron', cloth: '#f4f0e4', female: true, hat: 'turban', hatColor: '#e0883a' },
};

// ───────────── 24. ひみつの温泉の 湯けむりの 白い岩（雪の 上・湯気が ゆれる）─────────────
const WR = { R: '#e8e8ee', RL: '#ffffff', RD: '#a8acbc', RS: '#7a7e90', SN: '#f4f8fc', SND: '#c8d4e4', ST: '#dfe8f4' };
function whiteRockArt(g, f) {
  const C = WR;
  g.ell(0.5, 0.9, 0.44, 0.08, C.SND);
  // 岩（大きい 丸と 小さい 丸）
  g.ell(0.46, 0.66, 0.34, 0.24, C.RD);
  g.ell(0.44, 0.62, 0.3, 0.2, C.R);
  g.ell(0.36, 0.56, 0.12, 0.07, C.RL);
  g.ell(0.76, 0.76, 0.14, 0.1, C.RD);
  g.ell(0.75, 0.74, 0.11, 0.08, C.R);
  g.line([[0.34, 0.72], [0.46, 0.66], [0.56, 0.74]], C.RS, 1);
  // 湯気（2コマで ゆれる）
  g.ell(f ? 0.36 : 0.44, 0.3, 0.08, 0.06, C.ST);
  g.ell(f ? 0.5 : 0.42, 0.18, 0.06, 0.05, C.ST);
  g.ell(f ? 0.62 : 0.56, 0.32, 0.07, 0.05, C.ST);
  g.ell(0.14, 0.9, 0.08, 0.04, C.SN); g.ell(0.88, 0.9, 0.08, 0.04, C.SN);
  if (f) spark(g, 0.3, 0.5, 0.04, C.RL, '#ffffff');
}

// ───────────── 26. 王家のピラミッドの 前の 広場の はっくつの あな（さく・なわばしご・つるはし）─────────────
const DH = { S: '#e0c890', SD: '#b89a5a', H: '#4a3420', HD: '#2a1c10', W: '#8a5a32', WL: '#b8834e', R: '#d8c8a0', M: '#9a9aa8', G: '#f2c14e' };
function digHoleArt(g, f) {
  const C = DH;
  // 砂の 山と あな
  g.ell(0.5, 0.66, 0.46, 0.26, C.SD);
  g.ell(0.5, 0.64, 0.42, 0.22, C.S);
  g.ell(0.5, 0.66, 0.28, 0.14, C.H);
  g.ell(0.5, 0.68, 0.2, 0.09, C.HD);
  // なわばしご（あなの 中へ）
  g.line([[0.44, 0.54], [0.46, 0.76]], C.R, 1); g.line([[0.54, 0.54], [0.54, 0.76]], C.R, 1);
  for (const y of [0.6, 0.66, 0.72]) g.line([[0.45, y], [0.54, y]], C.R, 1);
  // さく（左右の くい）
  for (const x of [0.08, 0.92]) { g.rect(x - 0.025, 0.36, 0.05, 0.3, C.W); g.ell(x, 0.36, 0.03, 0.02, C.WL); }
  g.line([[0.08, 0.42], [0.3, 0.46]], C.R, 1); g.line([[0.92, 0.42], [0.7, 0.46]], C.R, 1);
  // つるはし
  g.line([[0.74, 0.86], [0.86, 0.66]], C.W, 1);
  g.poly([[0.78, 0.66], [0.94, 0.62], [0.86, 0.7]], C.M);
  // あなの 中で 光る（お守り）
  spark(g, 0.5, 0.7, f ? 0.05 : 0.03, C.G, '#ffffff');
}

// ───────────── より道: 千年前の 緑の王国の 市場の 天びんばかり（木の 台・2つの 皿・分銅）─────────────
const SC = { W: '#8a5a32', WL: '#b8834e', WD: '#4a2e18', B: '#d8b84a', BL: '#f2d870', BD: '#8a6a1e', M: '#7a7e90', ML: '#b8bcc8', C: '#e8e0f0' };
function scaleArt(g, f) {
  const C = SC;
  // 台
  g.rect(0.12, 0.7, 0.76, 0.12, C.W);
  g.rect(0.12, 0.7, 0.76, 0.03, C.WL);
  g.rect(0.16, 0.82, 0.06, 0.12, C.WD); g.rect(0.78, 0.82, 0.06, 0.12, C.WD);
  // はかりの 柱と うで（少し かたむく）
  g.rect(0.475, 0.2, 0.05, 0.5, C.BD);
  const t = f ? 0.02 : 0;
  g.line([[0.2, 0.26 - t], [0.8, 0.26 + t]], C.B, 2);
  g.ell(0.5, 0.2, 0.04, 0.035, C.BL);
  // ひもと 皿
  g.line([[0.2, 0.26 - t], [0.14, 0.48 - t]], C.BD, 1); g.line([[0.2, 0.26 - t], [0.26, 0.48 - t]], C.BD, 1);
  g.line([[0.8, 0.26 + t], [0.74, 0.48 + t]], C.BD, 1); g.line([[0.8, 0.26 + t], [0.86, 0.48 + t]], C.BD, 1);
  g.ell(0.2, 0.49 - t, 0.11, 0.035, C.B);
  g.ell(0.8, 0.49 + t, 0.11, 0.035, C.B);
  // 分銅と 布
  g.rect(0.75, 0.4 + t, 0.1, 0.08, C.M); g.rect(0.77, 0.38 + t, 0.06, 0.03, C.ML);
  g.rect(0.12, 0.42 - t, 0.16, 0.06, C.C);
  // 台の 上の 分銅（小さい）
  g.rect(0.62, 0.64, 0.06, 0.06, C.M); g.rect(0.7, 0.66, 0.05, 0.04, C.M);
  if (f) spark(g, 0.5, 0.14, 0.04, C.BL, '#ffffff');
}

export function addWork4Art(ART) {
  ART.fq_white_rock = { size: [28, 24], field: 28, npc: 1, pal: Object.values(WR), draw: whiteRockArt };
  ART.fq_dig_hole = { size: [32, 26], field: 32, npc: 1, pal: Object.values(DH), draw: digHoleArt };
  ART.fq_scale = { size: [24, 22], field: 24, npc: 1, pal: Object.values(SC), draw: scaleArt };
}
