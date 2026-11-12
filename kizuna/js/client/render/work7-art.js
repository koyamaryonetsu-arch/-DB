// お仕事いらい板の たのまれごと 33〜35（第80回 D班）と より道「時をこえる手紙の、最後の1通」（第80回 D班）の 絵（render/work-art.js から まぜる）
// ・addWork7Art(ART) … 物の 絵（'mon:<id>' の NPC）: 小さなオアシスの 水の さく（立てふだ）・東の平原の ちいさな 剣術道場・
//     炎の山のふもとの お湯の 土管（ひっこした パックンフラワーは 今までの 絵）
// ・WORK7_NPC_LOOKS … 人の みため（render/chars.js の NPC_LOOKS に まざる。より道の 人も）
// かきかたは work-art.js と おなじ（g … w・h の わりあいで かく。f … 0 か 1 の コマ）

// ───────────── 人の みため ─────────────
export const WORK7_NPC_LOOKS = {
  // 小さなオアシス: おだいかん（むらさきの ローブ・金の ふち・ターバン・ひげ）・ラクダひきの おかみさんザラ（だいだいの ドレス・ショール）・
  //   旅の 子どもリタ（みどりの 服・ターバン）・年よりの キャラバン（茶色の ローブ・つえ）・水売りの おにいさん（青い ベスト・ターバン）
  fq_daikan: { hair: 0, hairStyle: 'short', skin: 1, outfit: 'robe', robeMain: '#6a3a8a', robeTrim: '#f0c040', hat: 'turban', hatColor: '#f0c040', beard: true },
  fq_camel_wife: { hair: 3, hairStyle: 'long', skin: 2, outfit: 'dress', cloth: '#e0883a', female: true, hat: 'shawl', hatColor: '#c84a5a' },
  fq_desert_kid: { hair: 2, hairStyle: 'twin', skin: 2, outfit: 'tunic', cloth: '#5aa86a', female: true, small: true, hat: 'turban', hatColor: '#f4f0e0' },
  fq_old_caravan: { hair: 5, hairStyle: 'short', skin: 2, outfit: 'robe', robeMain: '#8a6a4a', robeTrim: '#e8d8b0', beard: true, cane: true, hunch: true, hat: 'keffiyeh', hatColor: '#f4f0e0' },
  fq_water_seller: { hair: 1, hairStyle: 'short', skin: 2, outfit: 'vest', cloth: '#3a7ac8', hat: 'turban', hatColor: '#7ac8e8' },
  // 東の平原: 道場の 師範ミヤコ（白い 着物・あいの はかま・ポニーテール）・道場やぶりゴンゾウ（こげ茶の 着物・はちまき・ひげ）・
  //   弟子の 男の子ヤヒコ（白い 道着）・羊かいの おばさん（みどりの エプロン）
  fq_dojo_master: { hair: 0, hairStyle: 'pony', skin: 0, outfit: 'hakama', cloth: '#f4f0f4', hakama: '#3a4a8a', female: true, hat: 'ribbon', hatColor: '#c83a5a' },
  fq_dojo_rival: { hair: 0, hairStyle: 'spiky', skin: 2, outfit: 'hakama', cloth: '#6a4a32', hakama: '#3a3030', hat: 'headband', hatColor: '#d83a3a', beard: true },
  fq_dojo_kid: { hair: 0, hairStyle: 'spiky', skin: 1, outfit: 'gi', cloth: '#f4f4f4', giTrim: '#3a4a8a', small: true, hat: 'headband', hatColor: '#f4f4f4' },
  fq_shepherd: { hair: 3, hairStyle: 'bun', skin: 1, outfit: 'apron', cloth: '#6aa84a', female: true, hat: 'bandana', hatColor: '#f4e8c8' },
  // 炎の山のふもと: 湯の 番頭ゴロウ（あいの はっぴ風の ベスト・はちまき）・湯の 見習いモモ（ももいろの エプロン）・石工の おじさん（茶色の ベスト・ぼうし）・
  //   土管あそびの 子ども（赤い ぼうし・青い 服）
  fq_bath_master: { hair: 5, hairStyle: 'short', skin: 1, outfit: 'vest', cloth: '#2a4a8a', beard: true, hat: 'headband', hatColor: '#f4f4f4' },
  fq_bath_girl: { hair: 1, hairStyle: 'twin', skin: 0, outfit: 'apron', cloth: '#f4a8c0', female: true, small: true },
  fq_mason: { hair: 3, hairStyle: 'short', skin: 1, outfit: 'vest', cloth: '#8a6a4a', hat: 'cap', hatColor: '#6a5a4a', beard: true },
  fq_pipe_kid: { hair: 1, hairStyle: 'short', skin: 0, outfit: 'tunic', cloth: '#3a6ad8', small: true, hat: 'cap', hatColor: '#d83a3a' },
  // より道（今の ホシフル村）: 手紙を あずかる ゆうびん屋さん（こい 青の 上着・ぼうし）・村の 子ども 3人
  c8rd_postman: { hair: 5, hairStyle: 'short', skin: 1, outfit: 'suit', cloth: '#2a3a6a', tie: '#d83a3a', hat: 'conductor', hatColor: '#2a3a6a', beard: true },
  c8rd_kid1: { hair: 1, hairStyle: 'spiky', skin: 1, outfit: 'tunic', cloth: '#e8a03a', small: true },
  c8rd_kid2: { hair: 2, hairStyle: 'twin', skin: 0, outfit: 'dress', cloth: '#e86a8a', female: true, small: true },
  c8rd_kid3: { hair: 0, hairStyle: 'short', skin: 2, outfit: 'tunic', cloth: '#5a8a4a', small: true, hat: 'cap', hatColor: '#8a5a32' },
};

// ───────────── 33. 小さなオアシスの 水の さく（木の さく・立てふだ「水1ぱい 100ゴールド」）─────────────
const OF = { W: '#a8783e', WL: '#c8985a', WD: '#6a4a24', P: '#f0e0b0', K: '#3a2a1a', B: '#4aa8e0', BL: '#8ad0f4', S: '#e0c890', G: '#f0c040' };
function oasisFenceArt(g, f) {
  const C = OF;
  g.ell(0.5, 0.94, 0.44, 0.05, C.S);
  // うしろの 池の 水（きらり）
  g.ell(0.5, 0.78, 0.4, 0.1, C.B);
  g.ell(f ? 0.36 : 0.62, 0.76, 0.06, 0.02, C.BL);
  // さくの くい（5本）と よこ木
  for (let i = 0; i < 5; i++) {
    const x = 0.1 + i * 0.19;
    g.rect(x, 0.5, 0.06, 0.42, C.W);
    g.poly([[x, 0.5], [x + 0.03, 0.44], [x + 0.06, 0.5]], C.WL);
  }
  g.rect(0.08, 0.6, 0.86, 0.05, C.WD);
  g.rect(0.08, 0.78, 0.86, 0.05, C.WD);
  // 立てふだ（まん中。字の かわりに 線と 金の 丸）
  g.rect(0.47, 0.3, 0.06, 0.4, C.WD);
  g.rect(0.26, 0.08, 0.48, 0.26, C.P);
  g.line([[0.26, 0.08], [0.74, 0.08], [0.74, 0.34], [0.26, 0.34], [0.26, 0.08]], C.WD, 1);
  g.line([[0.32, 0.16], [0.6, 0.16]], C.K, 1);
  g.line([[0.32, 0.24], [0.52, 0.24]], C.K, 1);
  g.ell(0.64, 0.24, 0.04, 0.04, C.G);
}

// ───────────── 34. 東の平原の ちいさな 剣術道場（かわらの やね・かんばん・木の かべ）─────────────
const DJ = { R: '#4a5468', RL: '#6a768a', RD: '#2a3040', W: '#c8a070', WL: '#e0c090', WD: '#7a5a34', P: '#f4ecd8', K: '#2a1a12', G: '#7ab85a', D: '#3a2a1a', S: '#ffffff' };
function dojoHallArt(g, f) {
  const C = DJ;
  g.ell(0.5, 0.95, 0.48, 0.05, C.G);
  // やね（かわら）
  g.poly([[0.02, 0.36], [0.18, 0.16], [0.82, 0.16], [0.98, 0.36]], C.R);
  g.rect(0.18, 0.12, 0.64, 0.05, C.RD);
  for (let i = 0; i < 6; i++) g.line([[0.14 + i * 0.145, 0.2], [0.08 + i * 0.16, 0.35]], C.RL, 1);
  // かべ・はしら
  g.rect(0.08, 0.36, 0.84, 0.56, C.W);
  g.rect(0.08, 0.36, 0.84, 0.04, C.WD);
  g.rect(0.08, 0.36, 0.05, 0.56, C.WD);
  g.rect(0.87, 0.36, 0.05, 0.56, C.WD);
  // 入り口（しょうじ）
  g.rect(0.36, 0.52, 0.28, 0.4, C.P);
  g.line([[0.5, 0.52], [0.5, 0.92]], C.WD, 1);
  g.line([[0.36, 0.66], [0.64, 0.66]], C.WL, 1);
  g.line([[0.36, 0.8], [0.64, 0.8]], C.WL, 1);
  // かんばん（たて長。字の かわりに 太い 線）
  g.rect(0.16, 0.44, 0.12, 0.38, C.WL);
  g.line([[0.16, 0.44], [0.28, 0.44], [0.28, 0.82], [0.16, 0.82], [0.16, 0.44]], C.D, 1);
  g.line([[0.22, 0.5], [0.22, 0.58]], C.K, 1);
  g.line([[0.2, 0.62], [0.24, 0.66]], C.K, 1);
  g.line([[0.22, 0.7], [0.22, 0.78]], C.K, 1);
  // まど の 木刀かけ
  g.line([[0.72, 0.5], [0.84, 0.5]], C.WD, 1);
  g.line([[0.72, 0.56], [0.84, 0.56]], C.WD, 1);
  // せんたく物（ゆれる）
  const sw = f ? 0.01 : 0;
  g.line([[0.7, 0.66], [0.9, 0.66]], C.D, 1);
  g.rect(0.72 + sw, 0.66, 0.06, 0.1, C.S);
  g.rect(0.81 - sw, 0.66, 0.06, 0.08, C.S);
}

// ───────────── 35. 炎の山のふもとの お湯の 土管（みどりの 土管・湯気）─────────────
const HP = { G: '#3aa84a', GL: '#6ad07a', GD: '#1e6a2a', K: '#123a18', R: '#8a8478', RL: '#b0aa9c', S: '#ffffff', SN: '#e8eef8' };
function hotPipeArt(g, f) {
  const C = HP;
  g.ell(0.5, 0.94, 0.4, 0.05, C.SN);
  // 石の 台
  g.rect(0.14, 0.82, 0.72, 0.12, C.R);
  g.rect(0.14, 0.82, 0.72, 0.03, C.RL);
  // 土管の どう
  g.rect(0.22, 0.36, 0.56, 0.48, C.G);
  g.rect(0.28, 0.36, 0.08, 0.48, C.GL);
  g.rect(0.66, 0.36, 0.08, 0.48, C.GD);
  // 土管の 口（ふち）
  g.rect(0.14, 0.24, 0.72, 0.14, C.G);
  g.rect(0.2, 0.24, 0.08, 0.14, C.GL);
  g.rect(0.74, 0.24, 0.08, 0.14, C.GD);
  g.ell(0.5, 0.25, 0.34, 0.04, C.K);
  // つなぎ目
  g.line([[0.22, 0.62], [0.78, 0.62]], C.GD, 1);
  // 湯気（ゆらり）
  const s = f ? -0.03 : 0;
  g.ell(0.42, 0.16 + s, 0.05, 0.035, C.S); g.ell(0.5, 0.09 + s, 0.04, 0.03, C.S); g.ell(0.58, 0.04 + s, 0.035, 0.025, C.S);
}

export function addWork7Art(ART) {
  ART.fq_oasis_fence = { size: [28, 26], field: 28, npc: 1, pal: Object.values(OF), draw: oasisFenceArt };
  ART.fq_dojo_hall = { size: [40, 34], field: 40, npc: 1, pal: Object.values(DJ), draw: dojoHallArt };
  ART.fq_hot_pipe = { size: [24, 28], field: 24, npc: 1, pal: Object.values(HP), draw: hotPipeArt };
}
