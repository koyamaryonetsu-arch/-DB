// お仕事いらい板の たのまれごと（第39回 C）の 絵（第41回で ふえた 6つの 絵は render/work-art.js。ここで まぜる）
// ・addFamilyArt(ART) … 物の 絵（'mon:<id>' の NPC。render/monsters.js が よぶ）
//     劇場: ふき出し口・空気の よごれメーター・空調機・室外機（止まっている／回っている）・ダンパー（しまっている／開いている）・中央かんしばん
//     料理大会: 雪わりきのこ　消えた 教会の かね: かねの 台（からっぽ／かねが もどった）・黒い 羽・赤い どろ・カラスの クロ
//     鉱山トロッコの 線路: こわれた 線路・古い 手紙
// ・FAMILY_NPC_LOOKS … 人の みため（render/chars.js の NPC_LOOKS に まぜる）
// ・addFamilyVehicleArt(ART, kit) … たのまれごとで もらう 乗り物の 絵（render/vehicle-art.js が よぶ。kit … 乗り物の 絵の どうぐ）
// かきかたは monsters.js・lab-art.js と おなじ（g … w・h の わりあいで かく。f … 0 か 1 の コマ）
import { spark } from './ch3-draw.js?v=5afd260db5f5';
import { WORK_NPC_LOOKS, addWorkArt, addWorkVehicleArt } from './work-art.js?v=5afd260db5f5';

// ───────────── 人の みため ─────────────
export const FAMILY_NPC_LOOKS = {
  // サファラ劇場の 支配人ラシード（赤い スーツ・金の ネクタイ・ひげ）
  fq_manager: { hair: 0, hairStyle: 'short', skin: 2, outfit: 'suit', cloth: '#7a2a3a', tie: '#f2c14e', beard: true },
  // ぶたいの 役者さん（羽の ぼうし・赤い マント）・女の 役者さん（金の ドレス・ティアラ）
  fq_actor: { hair: 1, hairStyle: 'short', skin: 1, outfit: 'tunic', cloth: '#c83a3a', hat: 'feather', cape: '#7a1a2a' },
  fq_actress: { hair: 2, hairStyle: 'long', skin: 0, outfit: 'dress', cloth: '#f2c14e', female: true, hat: 'tiara', hatGem: '#e83a8a' },
  // ユノハの おみやげ屋の ユキエ（赤い エプロン・バンダナ）
  fq_shopkeeper: { hair: 0, hairStyle: 'bun', skin: 0, outfit: 'apron', cloth: '#c84a5a', female: true, hat: 'bandana', hatColor: '#f4f0e4' },
  // 料理大会の 係ボルト（コックの ぼうし・ひげ）・しんさいんの ガンテおばば（めがね・つえ）
  fq_cook_host: { hair: 1, hairStyle: 'short', skin: 1, outfit: 'apron', cloth: '#f4f4f4', hat: 'chef', beard: true },
  fq_judge: { hair: 5, hairStyle: 'bun', skin: 1, outfit: 'robe', robeMain: '#8a5a3a', robeTrim: '#f2c14e', female: true, cane: true, hunch: true, glasses: true },
  // 年よりの 鉱夫ゲン（黄色い ヘルメット・白い ひげ・つえ）
  fq_old_miner: { hair: 5, hairStyle: 'bald', skin: 1, outfit: 'tunic', cloth: '#6a5a4a', beard: true, hat: 'miner', hatColor: '#f4cc2a', cane: true, hunch: true },
  // 第41回（render/work-art.js）
  ...WORK_NPC_LOOKS,
};

// ───────────── 劇場の 設備 ─────────────
// 金ぞくの 色（空調機・室外機・ダンパー・かんしばん）
const MT = { M: '#c8ccd4', ML: '#eef0f4', MD: '#8a90a0', MDD: '#4a5060', K: '#2a2e3a', B: '#3a7ad8', BL: '#8ac0ff', G: '#4ac86a', R: '#e04a3a', Y: '#f2c14e', S: '#d8b47a', SD: '#a8844a', W: '#ffffff' };
const MTP = Object.values(MT);

// ふき出し口（かべの 上。よこの すきまが ならぶ）
function vent(g, f) {
  const C = MT;
  g.rect(0.1, 0.2, 0.8, 0.6, C.MDD);
  g.rect(0.14, 0.24, 0.72, 0.52, C.M);
  for (let i = 0; i < 4; i++) g.rect(0.18, 0.3 + i * 0.12, 0.64, 0.05, C.K);
  g.rect(0.14, 0.24, 0.72, 0.05, C.ML);
  // 弱い 風（コマで ゆれる）
  if (f) g.line([[0.3, 0.86], [0.36, 0.94]], C.BL, 1);
}
// 空気の よごれメーター（4つの ぼうグラフ。みどり・赤）
function meter(g, f) {
  const C = MT;
  g.rect(0.12, 0.08, 0.76, 0.84, C.MDD);
  g.rect(0.16, 0.12, 0.68, 0.76, '#1a2a2a');
  const hs = [0.3, 0.55, 0.62, 0.26];
  hs.forEach((h, i) => g.rect(0.22 + i * 0.15, 0.8 - h, 0.1, h, h > 0.4 ? C.R : C.G));
  g.line([[0.18, 0.4], [0.82, 0.4]], f ? C.Y : C.ML, 1);
  g.rect(0.16, 0.12, 0.68, 0.06, C.MD);
}
// 空調機（大きな 箱・フィルターの 戸・ファンの まど・ダクト）
function ahu(g, f) {
  const C = MT;
  g.rect(0.04, 0.24, 0.92, 0.7, C.MDD);
  g.rect(0.06, 0.26, 0.88, 0.64, C.M);
  g.rect(0.06, 0.26, 0.88, 0.06, C.ML);
  // ダクト（上へ）
  g.rect(0.62, 0.02, 0.22, 0.24, C.MD);
  g.rect(0.64, 0.02, 0.18, 0.22, C.M);
  // フィルターの 戸（左）
  g.rect(0.1, 0.38, 0.3, 0.46, C.MD);
  for (let i = 0; i < 5; i++) g.rect(0.12, 0.42 + i * 0.08, 0.26, 0.04, C.S);
  // ファンの まど（右）
  g.ell(0.68, 0.58, 0.16, 0.24, C.K);
  const a = f ? 0.6 : 0;
  for (let k = 0; k < 3; k++) {
    const t = a + (k * Math.PI * 2) / 3;
    g.line([[0.68, 0.58], [0.68 + Math.cos(t) * 0.13, 0.58 + Math.sin(t) * 0.2]], C.MD, 2);
  }
  g.ell(0.68, 0.58, 0.03, 0.045, C.ML);
  // ランプ
  g.ell(0.46, 0.34, 0.025, 0.035, f ? C.G : C.Y);
  g.rect(0.04, 0.9, 0.92, 0.06, C.MDD);
}
// 室外機（横ながの 箱・大きな ファン。on … 回っている）
function unitArt(on) {
  return (g, f) => {
    const C = MT;
    g.rect(0.04, 0.16, 0.92, 0.72, C.MDD);
    g.rect(0.06, 0.18, 0.88, 0.68, C.ML);
    g.rect(0.06, 0.18, 0.88, 0.06, C.W);
    // ファン（右）
    g.ell(0.64, 0.52, 0.24, 0.3, C.MD);
    g.ell(0.64, 0.52, 0.21, 0.27, C.K);
    const a = on ? (f ? 0.5 : 0) : 0.2;
    for (let k = 0; k < 3; k++) {
      const t = a + (k * Math.PI * 2) / 3;
      g.poly([[0.64, 0.52], [0.64 + Math.cos(t) * 0.19, 0.52 + Math.sin(t) * 0.24], [0.64 + Math.cos(t + 0.6) * 0.16, 0.52 + Math.sin(t + 0.6) * 0.2]], C.M);
    }
    g.ell(0.64, 0.52, 0.04, 0.05, C.MDD);
    for (let i = 0; i < 4; i++) g.line([[0.42, 0.26 + i * 0.17], [0.86, 0.26 + i * 0.17]], C.MD, 0.8);
    // 左の パネル（ランプ）
    g.rect(0.1, 0.3, 0.22, 0.42, C.M);
    g.ell(0.21, 0.4, 0.04, 0.05, on ? C.G : C.R);
    // 足
    g.rect(0.1, 0.86, 0.12, 0.1, C.MDD); g.rect(0.78, 0.86, 0.12, 0.1, C.MDD);
    if (on) {
      // 出ていく 熱い 風
      for (let i = 0; i < 3; i++) g.line([[0.9, 0.3 + i * 0.18 + (f ? 0.04 : 0)], [0.98, 0.26 + i * 0.18 + (f ? 0.04 : 0)]], C.BL, 1);
    } else {
      // つもった 砂
      g.ell(0.5, 0.86, 0.3, 0.08, C.SD);
      g.ell(0.5, 0.84, 0.24, 0.06, C.S);
      g.ell(0.74, 0.7, 0.1, 0.06, C.S);
    }
  };
}
// ダンパー（ダクトの 中の 羽。open … 開いている）
function damperArt(open) {
  return (g, f) => {
    const C = MT;
    g.rect(0.16, 0, 0.68, 0.84, C.MDD);
    g.rect(0.2, 0.02, 0.6, 0.8, C.M);
    g.rect(0.22, 0.16, 0.56, 0.5, C.K);
    for (let i = 0; i < 3; i++) {
      const y = 0.24 + i * 0.16;
      if (open) g.rect(0.46, y - 0.04, 0.08, 0.12, C.ML);
      else g.rect(0.24, y, 0.52, 0.05, C.ML);
    }
    // つまみ
    g.ell(0.84, 0.42, 0.08, 0.06, open ? C.G : C.R);
    g.rect(0.2, 0.82, 0.6, 0.06, C.MDD);
    if (open) g.line([[0.32, 0.92 + (f ? 0.02 : 0)], [0.5, 0.98]], C.BL, 1);
  };
}
// 中央かんしばん（ランプと ボタンが ならぶ 台）
function panel(g, f) {
  const C = MT;
  g.rect(0.08, 0.1, 0.84, 0.86, C.MDD);
  g.rect(0.12, 0.14, 0.76, 0.5, '#1a2a3a');
  // 画面の 数字
  g.rect(0.18, 0.2, 0.36, 0.12, f ? C.BL : C.B);
  const lamps = [C.G, C.G, C.Y, C.R];
  lamps.forEach((c, i) => g.ell(0.24 + i * 0.16, 0.48, 0.05, 0.04, c));
  g.rect(0.12, 0.68, 0.76, 0.24, C.M);
  for (let i = 0; i < 3; i++) g.rect(0.2 + i * 0.22, 0.74, 0.14, 0.1, i === 1 ? C.R : C.MD);
}

// ───────────── 料理大会・消えた かね・線路 ─────────────
const MU = { C: '#f4f0e4', CL: '#ffffff', CD: '#c8bca0', S: '#e8d8b8', SD: '#a8946a', N: '#eef4ff', ND: '#b8c8e0', G: '#fff8c0' };
function mushroom(g, f) {
  const C = MU;
  g.ell(0.5, 0.86, 0.42, 0.12, C.ND); g.ell(0.5, 0.84, 0.36, 0.08, C.N);
  g.rect(0.42, 0.46, 0.16, 0.38, C.S);
  g.rect(0.42, 0.46, 0.05, 0.38, C.CL);
  g.ell(0.5, 0.42, 0.36, 0.22, C.CD);
  g.ell(0.5, 0.38, 0.34, 0.2, C.C);
  g.ell(0.38, 0.32, 0.08, 0.05, C.CL);
  g.ell(0.62, 0.4, 0.05, 0.04, C.SD);
  spark(g, f ? 0.82 : 0.18, f ? 0.16 : 0.22, 0.12, C.G, '#ffffff');
}
const BS = { W: '#8a5a32', WL: '#b8834e', WD: '#5a3a22', S: '#d8dce4', SL: '#ffffff', SD: '#8a90a0', R: '#4a3a2a' };
// かねの 台（bell … かねが もどった）
function bellStandArt(bell) {
  return (g, f) => {
    const C = BS;
    g.rect(0.14, 0.12, 0.1, 0.84, C.WD); g.rect(0.76, 0.12, 0.1, 0.84, C.WD);
    g.rect(0.16, 0.12, 0.06, 0.84, C.W); g.rect(0.78, 0.12, 0.06, 0.84, C.W);
    g.rect(0.08, 0.06, 0.84, 0.1, C.WD); g.rect(0.1, 0.07, 0.8, 0.06, C.WL);
    g.poly([[0.04, 0.08], [0.5, -0.02], [0.96, 0.08]], C.R);
    g.line([[0.5, 0.16], [0.5, 0.28]], C.SD, 1);
    if (bell) {
      const sw = f ? 0.03 : -0.03;
      g.poly([[0.38 + sw, 0.62], [0.42 + sw, 0.32], [0.5, 0.26], [0.58 + sw, 0.32], [0.62 + sw, 0.62]], C.SD);
      g.poly([[0.4 + sw, 0.6], [0.44 + sw, 0.33], [0.5, 0.28], [0.56 + sw, 0.33], [0.6 + sw, 0.6]], C.S);
      g.rect(0.43 + sw, 0.34, 0.04, 0.2, C.SL);
      g.ell(0.5 + sw, 0.66, 0.04, 0.03, C.SD);
      spark(g, 0.68, 0.3, 0.08, C.SL, '#ffffff');
    } else {
      g.ell(0.5, 0.3, 0.04, 0.03, C.SD); // からの フック
    }
    g.rect(0.06, 0.92, 0.88, 0.06, C.WD);
  };
}
const FE = { K: '#1a1a2a', KL: '#3a3a5a', B: '#5a6aa8' };
function feather(g, f) {
  const C = FE;
  g.poly([[0.18, 0.84], [0.42, 0.42], [0.72, 0.14], [0.86, 0.2], [0.64, 0.5], [0.3, 0.86]], C.K);
  g.poly([[0.32, 0.72], [0.56, 0.38], [0.74, 0.22], [0.7, 0.3], [0.5, 0.52]], f ? C.B : C.KL);
  g.line([[0.14, 0.92], [0.8, 0.18]], C.KL, 1);
}
const MD = { R: '#a8443a', RL: '#c86a5a', RD: '#6a2a22' };
function mud(g) {
  const C = MD;
  for (const [x, y, r] of [[0.2, 0.7, 0.12], [0.44, 0.5, 0.1], [0.66, 0.66, 0.11], [0.84, 0.42, 0.08]]) {
    g.ell(x, y, r, r * 0.7, C.RD); g.ell(x - 0.02, y - 0.02, r * 0.75, r * 0.5, C.R); g.ell(x - 0.03, y - 0.04, r * 0.3, r * 0.2, C.RL);
  }
}
const CR = { K: '#1a1a2a', KL: '#3a3a5a', B: '#5a6aa8', Y: '#f2c14e', N: '#8a5a32', NL: '#b8834e', S: '#d8dce4', W: '#ffffff' };
function crow(g, f) {
  const C = CR;
  // 巣
  g.ell(0.5, 0.82, 0.44, 0.16, C.N);
  for (let i = 0; i < 5; i++) g.line([[0.1 + i * 0.18, 0.76], [0.2 + i * 0.16, 0.9]], C.NL, 1);
  // 巣の 中の かね（きらり）
  g.ell(0.24, 0.7, 0.07, 0.06, C.S);
  if (f) spark(g, 0.2, 0.6, 0.08, C.W, '#ffffff');
  // カラス
  const up = f ? -0.03 : 0;
  g.ell(0.56, 0.52 + up, 0.24, 0.2, C.K);
  g.ell(0.68, 0.3 + up, 0.13, 0.13, C.K);
  g.poly([[0.78, 0.28 + up], [0.94, 0.32 + up], [0.78, 0.36 + up]], C.Y);
  g.ell(0.71, 0.27 + up, 0.03, 0.03, C.W);
  g.poly([[0.36, 0.5 + up], [0.14, 0.42 + up], [0.3, 0.6 + up]], C.KL);
  g.poly([[0.46, 0.46 + up], [0.66, 0.5 + up], [0.5, 0.62 + up]], f ? C.B : C.KL);
}
const RB = { R: '#8a8a98', RL: '#c8ccd8', W: '#8a5a32', WD: '#5a3a22', K: '#3a3640', S: '#a89a80' };
function railBroken(g, f) {
  const C = RB;
  // ずれた まくら木
  g.rect(0.08, 0.2, 0.84, 0.14, C.WD); g.rect(0.1, 0.62, 0.36, 0.14, C.W);
  g.poly([[0.54, 0.6], [0.9, 0.72], [0.86, 0.84], [0.5, 0.72]], C.WD);
  // まがった レール
  g.line([[0.28, 0], [0.3, 0.5], [0.2, 0.92]], C.R, 2.4);
  g.line([[0.72, 0], [0.7, 0.4], [0.88, 0.7]], C.R, 2.4);
  g.line([[0.27, 0], [0.29, 0.5]], C.RL, 0.8);
  // ぬけた くぎ・石
  g.rect(0.5, 0.44, 0.05, 0.12, C.K);
  g.ell(0.4, 0.88, 0.06, 0.04, C.S);
  if (f) g.ell(0.62, 0.3, 0.04, 0.03, C.RL);
}
const NT = { P: '#f0e4c4', PD: '#c8b48a', K: '#5a4a3a', R: '#c83a3a', RD: '#a82a2a' };
function note(g, f) {
  const C = NT;
  g.poly([[0.1, 0.3], [0.86, 0.18], [0.92, 0.72], [0.16, 0.84]], C.PD);
  g.poly([[0.12, 0.32], [0.84, 0.21], [0.89, 0.7], [0.17, 0.81]], C.P);
  for (let i = 0; i < 3; i++) g.line([[0.24, 0.42 + i * 0.12], [0.76, 0.34 + i * 0.12]], C.K, 0.7);
  g.ell(0.72, 0.68, 0.06, 0.06, f ? C.R : C.RD);
}

// お仕事いらい板（木の わくと やね・2本の 足・8まいの はり紙と 色の ピン。第41回で はり紙が ふえた）
const QB = { W: '#a8743a', WD: '#6a4420', WL: '#d4a060', R: '#b83a2a', RD: '#7a2418', P: '#f4ecd4', PD: '#cfc0a0', K: '#5a4a3a', pins: ['#e04a3a', '#3a7ad8', '#4ac86a', '#f2c14e', '#c86ad8'] };
function questBoardArt(g, f) {
  const C = QB;
  g.rect(0.16, 0.5, 0.08, 0.48, C.WD); g.rect(0.76, 0.5, 0.08, 0.48, C.WD);
  g.rect(0.06, 0.16, 0.88, 0.56, C.WD);
  g.rect(0.09, 0.19, 0.82, 0.5, C.W);
  g.rect(0.09, 0.19, 0.82, 0.04, C.WL);
  g.poly([[0.0, 0.18], [0.5, 0.0], [1.0, 0.18], [0.94, 0.2], [0.5, 0.06], [0.06, 0.2]], C.RD);
  g.poly([[0.02, 0.17], [0.5, 0.02], [0.98, 0.17], [0.5, 0.08]], C.R);
  const papers = [[0.12, 0.24], [0.31, 0.23], [0.5, 0.25], [0.69, 0.24], [0.13, 0.46], [0.32, 0.47], [0.51, 0.45], [0.7, 0.47]];
  papers.forEach(([x, y], i) => {
    const w = 0.17, h = 0.19;
    g.rect(x + 0.01, y + 0.01, w, h, C.PD);
    g.rect(x, y, w, h, C.P);
    for (let k = 0; k < 3; k++) g.rect(x + 0.025, y + 0.07 + k * 0.045, w - 0.05, 0.015, C.K);
    g.ell(x + w / 2, y + 0.02, 0.022, 0.022, C.pins[i % C.pins.length]);
  });
  if (f) spark(g, 0.86, 0.12, 0.07, '#fff4c0', '#ffffff');
}

export function addFamilyArt(ART) {
  // ルミナの町の お仕事いらい板
  ART.fq_board = { size: [28, 30], field: 30, npc: 1, pal: [...Object.values(QB).flat(), '#fff4c0', '#ffffff'], draw: questBoardArt };
  // 劇場の 設備（field … フィールドの 大きさ。大きな 物は NPC の big で 3マス）
  ART.fq_vent = { size: [16, 14], field: 16, pal: MTP, draw: vent };
  ART.fq_meter = { size: [14, 18], field: 18, pal: [...MTP, '#1a2a2a'], draw: meter };
  ART.fq_ahu = { size: [46, 34], field: 46, npc: 1, pal: MTP, draw: ahu };
  ART.fq_unit = { size: [44, 30], field: 44, npc: 1, pal: MTP, draw: unitArt(false) };
  ART.fq_unit_on = { size: [44, 30], field: 44, npc: 1, pal: MTP, draw: unitArt(true) };
  ART.fq_damper = { size: [14, 18], field: 18, pal: MTP, draw: damperArt(false) };
  ART.fq_damper_open = { size: [14, 18], field: 18, pal: MTP, draw: damperArt(true) };
  ART.fq_panel = { size: [16, 20], field: 20, pal: [...MTP, '#1a2a3a'], draw: panel };
  // 料理大会・消えた かね・線路
  ART.fq_mushroom = { size: [14, 14], field: 14, pal: Object.values(MU), draw: mushroom };
  ART.fq_bell_stand = { size: [16, 22], field: 22, pal: Object.values(BS), draw: bellStandArt(false) };
  ART.fq_bell_stand_bell = { size: [16, 22], field: 22, pal: Object.values(BS), draw: bellStandArt(true) };
  ART.fq_feather = { size: [12, 12], field: 12, pal: Object.values(FE), draw: feather };
  ART.fq_mud = { size: [14, 10], field: 14, pal: Object.values(MD), draw: mud };
  ART.fq_crow = { size: [20, 16], field: 20, pal: Object.values(CR), draw: crow };
  ART.fq_rail_broken = { size: [16, 16], field: 16, pal: Object.values(RB), draw: railBroken };
  ART.fq_note = { size: [12, 10], field: 12, pal: Object.values(NT), draw: note };
  // 第41回（render/work-art.js）
  addWorkArt(ART);
}

// ───────────── たのまれごとで もらう 乗り物 ─────────────
// kit … render/vehicle-art.js の どうぐ（carArt・deckArt・box・seg・wheel・poly・rgba・shade・twinkle）
export function addFamilyVehicleArt(ART, kit) {
  const { carArt, deckArt, box, seg, wheel, poly, rgba, shade, twinkle } = kit;
  // 高所作業車（白い トラック・黄色い うで・人は 上がった 台の 上に 立つ）
  ART.lift_truck = deckArt({
    w: 60, fw: 44, h: 72, lift: 26, frames: 2, riderFrame: 1, cx: 36,
    paint(p, view, f, layer, { g, w, cx, H }) {
      const G = H - 2;
      const body = '#f4f4f8', yel = '#f2c632', yelD = shade('#f2c632', -0.3);
      const deck = (x0, x1) => {
        // 台（人の 足もと）と てすり
        box(p, x0, g, x1 - x0, 3, '#3a6ad8', { r: 0 });
        if (layer === 'front') { p.hline(x0, x1 - 1, g - 7, yel); p.vline(x0, g - 7, g, yel); p.vline(x1 - 1, g - 7, g, yel); }
      };
      if (view === 'side') {
        if (layer === 'back') {
          // うで（ななめ）
          seg(p, 22, G - 12, 34, g + 3, yelD, 3.6);
          seg(p, 22, G - 13, 34, g + 2, yel, 2.4);
          return;
        }
        // トラック（左が 前）
        box(p, 2, G - 17, 18, 13, body, { r: 2 });
        p.rect(4, G - 15, 8, 6, '#5a7a9a');
        box(p, 18, G - 11, 40, 7, '#d8dce4', { r: 1 });
        p.hline(3, 57, G - 7, '#e85a2a');
        p.rect(48, G - 14, 8, 3, '#8a90a0'); // にだいの 道具箱
        for (const x of [9, 46]) wheel(p, x, G - 3, 3.4, f, { rim: '#c8ccd8', spokes: false });
        p.rect(2, G - 11, 2, 2, '#ffe070');
        deck(28, 44);
        // ランプ（チカチカ）
        p.rect(8, G - 16, 3, 2, f ? '#ff9a3a' : '#a85a2a');
        return;
      }
      const x0 = cx - 15;
      if (layer === 'back') {
        if (view === 'back') { seg(p, cx, G - 12, cx, g + 3, yelD, 3.2); seg(p, cx, G - 12, cx, g + 3, yel, 2); }
        return;
      }
      box(p, x0, G - 14, 30, 11, body, { r: 2 });
      if (view === 'front') {
        p.rect(x0 + 3, G - 13, 24, 5, '#5a7a9a');
        for (const s of [-1, 1]) p.ellipse(cx + s * 11, G - 6, 2, 1.4, '#fff6c0');
      } else {
        for (const s of [-1, 1]) p.rect(cx + s * 11 - 1, G - 7, 3, 2, '#e04040');
        seg(p, cx, G - 12, cx, g + 3, yel, 2);
      }
      p.hline(x0 + 1, x0 + 28, G - 5, '#e85a2a');
      for (const s of [-1, 1]) { p.rect(Math.round(cx + s * 12 - 2), G - 4, 5, 4, '#2a2630'); p.hline(Math.round(cx + s * 12 - 1), Math.round(cx + s * 12 + 1), G - 3 + (f % 2), '#5a5662'); }
      p.rect(cx - 2, G - 17, 4, 2, f ? '#ff9a3a' : '#a85a2a');
      deck(cx - 9, cx + 9);
    },
    shadowScale: 1.9,
  });
  // 湯けむりの 人力車（人が 前を 引いて 走る。うしろに 赤い くるま）
  ART.rickshaw = deckArt({
    w: 60, fw: 40, h: 52, frames: 2, riderFrame: 'walk', cx: 12,
    paint(p, view, f, layer, { cx, H }) {
      const G = H - 2;
      const red = '#c83a3a', redD = shade('#c83a3a', -0.3), hood = '#2a2a3a';
      const cart = (x, front) => {
        // かじ棒・ざせき・ほろ・大きな 車輪
        if (front !== false) seg(p, x - 22, G - 16, x - 2, G - 12, '#5a3a22', 1.6);
        box(p, x - 2, G - 20, 18, 9, red, { r: 2 });
        p.rect(x, G - 26, 14, 6, redD);
        poly(p, [[x + 12, G - 20], [x + 18, G - 20], [x + 16, G - 34], [x + 4, G - 36]], hood);
        wheel(p, x + 8, G - 7, 7, f, { rim: '#d8a040', tire: '#3a2a22', spokes: true });
        // ちょうちん
        p.ellipse(x - 2, G - 26, 1.8, 2.4, '#ff8a3a');
      };
      if (view === 'side') {
        if (layer === 'back') return;
        cart(32);
        return;
      }
      // 前・うしろ: くるまは 人の うしろ（前むき）・前（うしろむき）
      const behind = view === 'front';
      if ((layer === 'back') !== behind) return;
      box(p, cx - 12, G - 22, 24, 11, red, { r: 2 });
      poly(p, [[cx - 13, G - 22], [cx + 13, G - 22], [cx + 11, G - 34], [cx - 11, G - 34]], hood);
      for (const s of [-1, 1]) { p.ellipse(cx + s * 14, G - 7, 1.8, 7, '#3a2a22'); p.vline(cx + s * 14, G - 12 + (f ? 2 : 0), G - 10 + (f ? 2 : 0), '#d8a040'); }
      for (const s of [-1, 1]) seg(p, cx + s * 8, G - 12, cx + s * 9, G - 4, '#5a3a22', 1.4);
    },
    fx(p, view, f, { w }) {
      // 湯けむり
      for (let i = 0; i < 3; i++) { const x = (view === 'side' ? 40 : 8) + i * 6, y = 8 + ((f + i) % 2) * 3; p.ellipse(x, y, 2.6, 1.6, rgba('#ffffff', 0.45)); }
      void w;
    },
    shadowScale: 1.8,
  });
  // キッチンカー（黄色い 車・やね の 上に 看板・横に 売り場の まど と ひさし）
  ART.kitchen_car = carArt({
    body: '#f2c632', len: 64, h: 14, roof: 'cab', cab: [4, 22], stripe: '#c83a3a', wheelR: 5, wheelX: [14, 52], seatX: 13, roofCol: '#f4f0e0', winH: 14,
    extra(p, view, f, layer, g) {
      if (layer !== 'front') return;
      if (view === 'side') {
        // うしろの 荷台（売り場）
        box(p, 22, g.rt, 40, g.top - g.rt + 2, '#f4f0e0', { r: 1 });
        p.rect(28, g.rt + 4, 26, 8, '#5a3a22');
        poly(p, [[26, g.rt + 3], [56, g.rt + 3], [60, g.rt - 1], [22, g.rt - 1]], '#c83a3a');
        for (let x = 24; x < 58; x += 6) p.rect(x, g.rt - 1, 3, 4, '#f4f4f8');
        // ゆげの でる なべ
        p.ellipse(36, g.rt + 10, 3, 1.6, '#c8ccd8');
        box(p, 40, g.rt - 8, 14, 5, '#3a8a4a', { r: 1 });
        p.hline(42, 51, g.rt - 6, '#f4f4f8');
      } else {
        box(p, g.cx - 8, g.rt - 7, 16, 5, '#3a8a4a', { r: 1 });
        p.hline(g.cx - 6, g.cx + 5, g.rt - 5, '#f4f4f8');
      }
    },
    fx(p, view, f) {
      if (view !== 'side') return;
      for (let i = 0; i < 2; i++) p.ellipse(36 + i * 3, 14 - i * 4 - (f ? 2 : 0), 2, 1.4, rgba('#ffffff', 0.55));
    },
    shadowScale: 2.1,
  });
  // パトカー（白と 黒・やねに 赤い ランプ）
  ART.patrol_car = carArt({
    body: '#f4f4f8', len: 60, h: 11, roof: 'cab', cab: [16, 44], stripe: '#1e1e26', rim: '#c8ccd8',
    extra(p, view, f, layer, g) {
      if (layer !== 'front') return;
      const y = g.rt - 3;
      if (view === 'side') {
        p.rect(2, g.top + 2, 14, 7, '#1e1e26');
        p.rect(44, g.top + 2, 14, 7, '#1e1e26');
        box(p, 24, y, 12, 3, '#d8dce4', { r: 1 });
        p.rect(25, y, 5, 2, f ? '#ff3a3a' : '#8a1a1a');
        p.rect(30, y, 5, 2, f ? '#3a6aff' : '#ff3a3a');
      } else {
        box(p, g.cx - 7, y, 14, 3, '#d8dce4', { r: 1 });
        p.rect(g.cx - 6, y, 6, 2, f ? '#ff3a3a' : '#8a1a1a');
        p.rect(g.cx, y, 6, 2, f ? '#3a6aff' : '#ff3a3a');
        p.hline(Math.round(g.x0 + 1), Math.round(g.x0 + g.w - 2), g.top + 8, '#1e1e26');
      }
    },
    fx(p, view, f, { w }) {
      if (!f) return;
      const x = view === 'side' ? 30 : w / 2;
      for (const [dx, dy] of [[-8, -2], [8, -2], [0, -5]]) p.set(x + dx, 22 + dy, rgba('#ff6a6a', 0.6));
    },
  });
  // 金の トロッコ（金色・きらきら）
  ART.gold_trolley = carArt({
    body: '#e8b830', len: 44, h: 9, roof: 'open', cab: [12, 32], rim: '#f4e08a', wheelR: 4, stripe: '#a87a1a', noGrill: true, bob: true,
    extra(p, view, f, layer, g) {
      if (layer !== 'front') return;
      const a = f ? 4 : -4;
      if (view === 'side') { seg(p, 22, g.top, 22 + a, g.top - 9, '#c8a040', 1.6); seg(p, 18 + a, g.top - 9, 26 + a, g.top - 9, '#c8a040', 1.6); p.hline(0, 43, g.G - 1, '#8a7a5a'); }
      else seg(p, g.cx - 7, g.top - 6 - (f ? 2 : 0), g.cx + 7, g.top - 6 - (f ? 2 : 0), '#c8a040', 1.6);
    },
    fx(p, view, f, { w, top }) {
      twinkle(p, f ? 6 : w - 6, top - 4, rgba('#fff6b0', 0.9), true);
      twinkle(p, f ? w - 10 : 10, top + 2, rgba('#ffffff', 0.8));
    },
  });
  // 第41回（render/work-art.js）
  addWorkVehicleArt(ART, kit);
}
