// 古代の大迷宮（第4章クリアの あとの より道）の え（render/ch4-art.js の addCh4Art から addLabArt を よぶ）
// ・old_dragon … ボス「古竜オルドラ」（こはく色の 目・岩の ような うろこ・大きな つばさ。地下10階の 大きな NPC も おなじ え）
// ・lab_star_tower … 星読みの塔（コガネ地方の 東の はし。たてながの NPC）
// ・lab_ruin_arch … 砂の古代都市の 門（砂の海の 小島）
// ・lab_ironwood … 古代の鉄木（地下4階）・lab_glint … ダイゴの コンパス（地下7階で 光る）
// かきかたは monsters.js・ch3-art.js と おなじ（g … w・h の わりあいで かく。f … 0 か 1 の コマ）
import { fit, bez, taper, spark } from './ch3-draw.js?v=661924ced2fb';

// ───── 古竜オルドラ ─────
const OD = {
  B: '#b8843e', BL: '#d8a85a', BLL: '#f0cc84', BD: '#8a5a2a', BDD: '#5a361a', // うろこ（こはく色の 岩）
  U: '#e8d4a0', UD: '#c4a874', // おなか
  W: '#7a4a2a', WL: '#a86a3a', WD: '#4e2a16', // つばさの まく
  H: '#f4ecd8', HD: '#c8b894', // つの・キバ・つめ
  E: '#ffb020', EL: '#fff0a0', // 目
  M: '#3a1408', F: '#ff8a1a', FL: '#ffe070', // 口の 中・口の 火
  S: '#6a6a6a', SL: '#9a9a9a', // こけの 石（せなかに のった 岩）
};
function oldDragon(g0, f) {
  const g = fit(g0, 150);
  const C = OD;
  const k = g.w / g.h;
  const R = (x, y, r, c) => g.ell(x, y, r, r * k, c);
  const up = f ? -0.02 : 0;
  // うしろの つばさ（右上へ 大きく）
  const wing = (dx, dark) => {
    g.poly([[0.5 + dx, 0.42], [0.62 + dx, 0.12 + up], [0.78 + dx, 0.02 + up], [0.96 + dx, 0.1 + up], [0.9 + dx, 0.24], [0.94 + dx, 0.36], [0.84 + dx, 0.42], [0.86 + dx, 0.54], [0.7 + dx, 0.56]], C.BDD);
    g.poly([[0.52 + dx, 0.42], [0.63 + dx, 0.14 + up], [0.78 + dx, 0.05 + up], [0.93 + dx, 0.11 + up], [0.88 + dx, 0.24], [0.91 + dx, 0.35], [0.82 + dx, 0.41], [0.83 + dx, 0.52], [0.7 + dx, 0.54]], dark ? C.WD : C.W);
    for (const [ex, ey] of [[0.93, 0.11], [0.88, 0.24], [0.91, 0.35], [0.83, 0.52]]) g.line([[0.6 + dx, 0.2 + up], [ex + dx, ey + (ey < 0.2 ? up : 0)]], dark ? C.BDD : C.WL, 1.4);
    g.line([[0.52 + dx, 0.42], [0.63 + dx, 0.14 + up], [0.78 + dx, 0.05 + up]], C.BL, 2);
  };
  wing(0.04, true);
  // しっぽ（右下へ まるまる）
  const tail = bez([[0.78, 0.74], [0.98, 0.8], [0.98, 0.96], [0.78, 0.97], [0.62, 0.94]], 18);
  taper(g, tail, 0.14, 0.03, C.BDD);
  taper(g, tail, 0.12, 0.02, C.B);
  for (let i = 2; i < 17; i += 3) { const [x, y] = tail[i]; g.poly([[x - 0.02, y - 0.04], [x, y - 0.075], [x + 0.02, y - 0.04]], C.BD); }
  // うしろあし
  g.ell(0.74, 0.86, 0.1, 0.1, C.BDD); g.ell(0.735, 0.85, 0.09, 0.09, C.B);
  for (const kx of [0, 1, 2]) g.poly([[0.66 + kx * 0.035, 0.93], [0.685 + kx * 0.035, 0.93], [0.67 + kx * 0.035, 0.975]], C.H);
  // からだ（大きな 岩の ような せなか）
  g.ell(0.6, 0.66, 0.26, 0.21, C.BDD);
  g.ell(0.595, 0.655, 0.25, 0.2, C.B);
  g.ell(0.56, 0.58, 0.16, 0.09, C.BL);
  // せなかの こけの 石（ねむって いた ながい 年月）
  g.ell(0.66, 0.5, 0.06, 0.035, C.S); g.ell(0.65, 0.49, 0.04, 0.02, C.SL);
  g.ell(0.52, 0.52, 0.035, 0.022, C.S);
  // うろこの もよう（岩の ひび）
  for (const [x, y] of [[0.5, 0.66], [0.6, 0.7], [0.7, 0.64], [0.66, 0.76], [0.54, 0.76], [0.76, 0.72]]) {
    g.line([[x - 0.03, y], [x, y - 0.02], [x + 0.03, y]], C.BD, 1.2);
    R(x, y - 0.01, 0.008, C.BLL);
  }
  // おなか
  g.poly([[0.4, 0.62], [0.5, 0.78], [0.66, 0.84], [0.56, 0.86], [0.42, 0.8], [0.36, 0.7]], C.UD);
  g.poly([[0.41, 0.64], [0.5, 0.78], [0.62, 0.83], [0.55, 0.845], [0.43, 0.79], [0.38, 0.7]], C.U);
  for (const y of [0.68, 0.72, 0.76, 0.8]) g.line([[0.4, y], [0.5, y + 0.03]], C.UD, 0.9);
  // まえの つばさ（たたみかけ）
  wing(-0.06, false);
  // まえあし
  g.ell(0.42, 0.86, 0.08, 0.09, C.BDD); g.ell(0.415, 0.855, 0.07, 0.08, C.B);
  for (const kx of [0, 1, 2]) g.poly([[0.35 + kx * 0.03, 0.925], [0.372 + kx * 0.03, 0.925], [0.36 + kx * 0.03, 0.975]], C.H);
  // くび（左上へ）
  const neck = bez([[0.46, 0.6], [0.36, 0.52], [0.3, 0.4 + up], [0.24, 0.34 + up]], 14);
  taper(g, neck, 0.17, 0.12, C.BDD);
  taper(g, neck, 0.15, 0.105, C.B);
  taper(g, neck.map(([x, y]) => [x - 0.03, y + 0.03]), 0.06, 0.04, C.U);
  for (let i = 1; i < 13; i += 3) { const [x, y] = neck[i]; g.poly([[x + 0.02, y - 0.05], [x + 0.06, y - 0.09], [x + 0.055, y - 0.03]], C.BD); }
  // あたま（左むき）
  const [hx, hy] = neck[14];
  const open = f ? 0.05 : 0.02;
  g.poly([[hx + 0.08, hy - 0.06], [hx - 0.04, hy - 0.08], [hx - 0.15, hy - 0.04], [hx - 0.19, hy + 0.01], [hx - 0.1, hy + 0.03], [hx + 0.08, hy + 0.05]], C.BDD);
  g.poly([[hx + 0.07, hy - 0.05], [hx - 0.04, hy - 0.07], [hx - 0.14, hy - 0.035], [hx - 0.175, hy + 0.005], [hx - 0.1, hy + 0.02], [hx + 0.07, hy + 0.04]], C.B);
  g.line([[hx + 0.05, hy - 0.055], [hx - 0.11, hy - 0.04]], C.BLL, 1.2);
  // 下あご
  g.poly([[hx + 0.05, hy + 0.035], [hx - 0.09, hy + 0.015 + open], [hx - 0.16, hy + 0.02 + open], [hx - 0.1, hy + 0.055 + open], [hx + 0.05, hy + 0.07]], C.BD);
  g.poly([[hx - 0.15, hy + 0.008], [hx - 0.06, hy + 0.014], [hx - 0.08, hy + 0.014 + open], [hx - 0.15, hy + 0.018 + open]], C.M);
  for (let i = 0; i < 4; i++) { const x = hx - 0.145 + i * 0.024; g.poly([[x, hy + 0.008], [x + 0.012, hy + 0.008], [x + 0.006, hy + 0.028]], C.H); }
  // 口の 中の 火（コマ1で 強く）
  if (f) { R(hx - 0.13, hy + 0.03, 0.022, C.F); R(hx - 0.13, hy + 0.03, 0.012, C.FL); }
  // つの（うしろへ 2本）
  g.poly([[hx + 0.02, hy - 0.07], [hx + 0.14, hy - 0.2], [hx + 0.08, hy - 0.06]], C.HD);
  g.poly([[hx + 0.03, hy - 0.07], [hx + 0.13, hy - 0.18], [hx + 0.07, hy - 0.065]], C.H);
  g.poly([[hx + 0.06, hy - 0.04], [hx + 0.19, hy - 0.12], [hx + 0.1, hy - 0.03]], C.HD);
  // 目（こはく色に 光る）
  R(hx - 0.05, hy - 0.035, 0.026, C.BDD);
  R(hx - 0.05, hy - 0.037, 0.019, C.E);
  R(hx - 0.052, hy - 0.04, 0.008, C.EL);
  // ひげ
  g.line([[hx - 0.16, hy + 0.0], [hx - 0.22, hy + 0.06], [hx - 0.2, hy + 0.12]], C.BLL, 1);
}

// ───── 星読みの塔（たてながの 石の 塔。てっぺんに 大きな 望遠鏡）─────
const TW = { S: '#d8c08c', SL: '#f2e0b4', SD: '#a88a58', SDD: '#7a5e36', B: '#3a4a8a', BL: '#6a7ac8', G: '#f2c14e', GL: '#fff0a0', D: '#2a1a10', W: '#8ab8e8' };
function starTower(g, f) {
  const C = TW;
  // 塔（下が ふとい）
  g.poly([[0.22, 0.98], [0.3, 0.28], [0.7, 0.28], [0.78, 0.98]], C.SDD);
  g.poly([[0.24, 0.97], [0.32, 0.29], [0.66, 0.29], [0.74, 0.97]], C.S);
  g.poly([[0.24, 0.97], [0.32, 0.29], [0.4, 0.29], [0.34, 0.97]], C.SL);
  for (const y of [0.42, 0.56, 0.7, 0.84]) g.line([[0.28, y], [0.72, y]], C.SD, 1);
  // まど・入口
  for (const y of [0.4, 0.62]) { g.rect(0.45, y, 0.1, 0.07, C.D); g.rect(0.47, y + 0.01, 0.06, 0.03, f ? C.GL : C.G); }
  g.poly([[0.42, 0.98], [0.42, 0.88], [0.5, 0.84], [0.58, 0.88], [0.58, 0.98]], C.D);
  // てっぺんの へや（青い 星の やね）
  g.rect(0.26, 0.2, 0.48, 0.09, C.SD);
  g.poly([[0.24, 0.21], [0.5, 0.06], [0.76, 0.21]], C.B);
  g.poly([[0.3, 0.2], [0.5, 0.09], [0.52, 0.2]], C.BL);
  // 望遠鏡（ななめ 上へ）
  g.line([[0.58, 0.16], [0.86, 0.02]], C.G, 3);
  g.line([[0.6, 0.15], [0.84, 0.035]], C.GL, 1);
  g.ell(0.86, 0.025, 0.035, 0.02, C.W);
  // 星
  spark(g, 0.14, 0.08, f ? 0.05 : 0.035, C.GL, '#ffffff');
  spark(g, 0.9, 0.22, f ? 0.03 : 0.045, C.GL, '#ffffff');
}

// ───── 砂の古代都市の 門（2本の 太い 柱と こわれた アーチ）─────
const AR = { S: '#d8b878', SL: '#f0d8a0', SD: '#a8844a', SDD: '#6e5228', D: '#2a1a0c', G: '#e8b840' };
function ruinArch(g) {
  const C = AR;
  for (const x of [0.08, 0.72]) {
    g.rect(x, 0.22, 0.2, 0.78, C.SDD);
    g.rect(x + 0.01, 0.23, 0.17, 0.76, C.S);
    g.rect(x + 0.01, 0.23, 0.05, 0.76, C.SL);
    for (const y of [0.4, 0.6, 0.8]) g.line([[x, y], [x + 0.2, y]], C.SD, 1);
  }
  // アーチ（右が かけている）
  g.poly([[0.06, 0.24], [0.2, 0.08], [0.5, 0.02], [0.72, 0.08], [0.78, 0.16], [0.7, 0.2], [0.5, 0.14], [0.28, 0.2], [0.24, 0.26]], C.SDD);
  g.poly([[0.08, 0.23], [0.21, 0.1], [0.5, 0.04], [0.7, 0.1], [0.74, 0.16], [0.68, 0.18], [0.5, 0.12], [0.28, 0.18], [0.25, 0.24]], C.S);
  g.line([[0.21, 0.1], [0.5, 0.04], [0.7, 0.1]], C.SL, 1.2);
  // 竜の しるし
  g.ell(0.48, 0.09, 0.05, 0.03, C.G);
  g.ell(0.48, 0.09, 0.025, 0.015, C.D);
}

// ───── 古代の鉄木（黒い 木の えだが 石から つき出す）・ダイゴの コンパス（くらやみで 光る）─────
const IW = { T: '#3a3a44', TL: '#6a6a7a', TD: '#1e1e26', S: '#9a8a6a', SL: '#c8b890', G: '#a8e8ff' };
function ironwood(g, f) {
  const C = IW;
  g.ell(0.5, 0.86, 0.42, 0.12, C.S); g.ell(0.48, 0.84, 0.3, 0.07, C.SL);
  taper(g, bez([[0.36, 0.86], [0.42, 0.5], [0.6, 0.3], [0.7, 0.08]], 10), 0.18, 0.06, C.TD);
  taper(g, bez([[0.37, 0.85], [0.43, 0.5], [0.6, 0.3], [0.69, 0.09]], 10), 0.13, 0.04, C.T);
  g.line([[0.42, 0.6], [0.56, 0.36]], C.TL, 1);
  taper(g, bez([[0.48, 0.5], [0.3, 0.36], [0.2, 0.3]], 6), 0.07, 0.03, C.T);
  if (f) spark(g, 0.72, 0.12, 0.08, C.G, '#ffffff');
}
const GL = { C: '#c8a040', CL: '#f2d870', CD: '#7a5a20', N: '#e83a3a', G: '#fff8c0' };
function glint(g, f) {
  const C = GL;
  g.ell(0.5, 0.55, 0.32, 0.3, C.CD);
  g.ell(0.5, 0.53, 0.28, 0.26, C.C);
  g.ell(0.5, 0.53, 0.2, 0.18, '#f4ecd8');
  g.line([[0.5, 0.53], [0.5, 0.38]], C.N, 1.4);
  g.line([[0.5, 0.53], [0.5, 0.66]], '#3a3a4a', 1.2);
  g.rect(0.45, 0.2, 0.1, 0.08, C.CL);
  spark(g, f ? 0.8 : 0.22, f ? 0.2 : 0.28, 0.16, C.G, '#ffffff');
}

export function addLabArt(ART) {
  // ボス（大迷宮の いちばん 下。とても 大きい。地下10階の 大きな NPC は 0.6ばい）
  ART.old_dragon = { size: [150, 116], npc: 0.6, pal: Object.values(OD), draw: oldDragon };
  // マップの 目じるし（ちいさい NPC の え。field … フィールドの 大きさ）
  ART.lab_star_tower = { size: [36, 80], field: 60, pal: Object.values(TW), draw: starTower };
  ART.lab_ruin_arch = { size: [50, 40], field: 40, pal: Object.values(AR), draw: ruinArch };
  ART.lab_ironwood = { size: [24, 22], field: 18, pal: Object.values(IW), draw: ironwood };
  ART.lab_glint = { size: [16, 16], field: 14, pal: Object.values(GL), draw: glint };
}

// ───── たのまれごとの 人の みため（render/chars.js の NPC_LOOKS に まぜる）─────
export const LAB_NPC_LOOKS = {
  // ラクダ使いのハリド（キャラバンの 旅の ふく・ずきん）
  camel_owner: { hair: 0, hairStyle: 'short', skin: 2, outfit: 'traveler', cloth: '#c8702a', beard: true, hat: 'keffiyeh', hatColor: '#f4f0e4', hatTrim: '#c83a3a' },
  // 星読みのナジュム（星の 色の ローブ・めがね・つえ）
  star_reader: { hair: 5, hairStyle: 'long', skin: 1, outfit: 'robe', robeMain: '#2a3a7a', robeTrim: '#f2c14e', beard: true, glasses: true, cane: true, hunch: true, hat: 'turban', hatColor: '#3a4a8a', hatGem: '#f2c14e' },
  // 花屋のポーラ（ルミナの町。花の エプロン）
  flower_girl: { hair: 2, hairStyle: 'pony', skin: 0, outfit: 'apron', cloth: '#e86a9a', female: true },
  // なぞなぞじいさん（ユノハ。湯ゆかたの ような ローブと はちまき）
  riddle_old: { hair: 5, hairStyle: 'bald', skin: 1, outfit: 'robe', robeMain: '#5a8a6a', robeTrim: '#f4f4f4', beard: true, cane: true, hunch: true, hat: 'headband', hatColor: '#f4f4f4' },
  // 漁師のカイ（カモメ港。青い バンダナ）
  port_fisher: { hair: 1, hairStyle: 'short', skin: 2, outfit: 'vest', cloth: '#3a6aa8', hat: 'bandana', hatColor: '#2a8aa8' },
};
