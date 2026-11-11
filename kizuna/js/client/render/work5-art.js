// お仕事いらい板の たのまれごと 27〜29（第74回 D班）と 千年前の クモイの 海の より道（第74回 D班）の 絵（render/work-art.js から まぜる）
// ・addWork5Art(ART) … 物の 絵（'mon:<id>' の NPC）: 海鳴りの小島の 洞窟の 入り口の 岩かげ・北の海辺の ハサミ団の かくれ岩・
//     白銀の湖の けずりかけの 氷の 像／できあがった 氷の 竜の 像・千年前の ナギの島の ウミガメの すな山（より道）
//     （ちびガニ・団長は 今までの よろいガニ・星座ガニの 絵）
// ・WORK5_NPC_LOOKS … 人の みため（render/chars.js の NPC_LOOKS に まざる）
// かきかたは work-art.js と おなじ（g … w・h の わりあいで かく。f … 0 か 1 の コマ）
import { spark } from './ch3-draw.js?v=94ec7101b93e';

// ───────────── 人の みため ─────────────
export const WORK5_NPC_LOOKS = {
  // 海鳴りの小島の キャンプの 先生ミサキ（みどりの ベスト・オレンジの ぼうし）
  fq_camp_teacher: { hair: 1, hairStyle: 'pony', skin: 0, outfit: 'vest', cloth: '#3a8a5a', female: true, hat: 'cap', hatColor: '#e0883a' },
  // 北の海辺の しお作りの ムサ（白い ローブ・青い ふち・白い ターバン・ひげ）
  fq_salt_maker: { hair: 5, hairStyle: 'bald', skin: 2, outfit: 'robe', robeMain: '#ece4cc', robeTrim: '#4a8ac8', beard: true, hat: 'turban', hatColor: '#f4f4f4' },
  // 白銀の湖の 見習いシズク（水色の 服・白い リボン）・親方ゴウ（こい 青の ベスト・赤い はちまき・ひげ）
  fq_ice_kid: { hair: 2, hairStyle: 'twin', skin: 0, outfit: 'tunic', cloth: '#8ad0f0', female: true, small: true, hat: 'ribbon', hatColor: '#ffffff' },
  fq_ice_master: { hair: 0, hairStyle: 'spiky', skin: 1, outfit: 'vest', cloth: '#3a5a8a', beard: true, hat: 'headband', hatColor: '#d83a3a' },
};

// ───────────── 27. 海鳴りの小島の 洞窟の 入り口の 岩かげ（かげの 中に 光る 目）─────────────
const SR = { R: '#7a7468', RL: '#a8a294', RD: '#4a4640', K: '#1a1622', KL: '#2e2838', E: '#f2e85a', S: '#e0d0a0' };
function shadeRockArt(g, f) {
  const C = SR;
  g.ell(0.5, 0.9, 0.46, 0.08, C.S);
  // かげ（地面に のびる）
  g.ell(0.42, 0.84, 0.4, 0.1, C.K);
  // 岩
  g.ell(0.58, 0.56, 0.34, 0.3, C.RD);
  g.ell(0.56, 0.52, 0.3, 0.26, C.R);
  g.ell(0.48, 0.42, 0.12, 0.08, C.RL);
  g.line([[0.5, 0.6], [0.62, 0.52], [0.7, 0.62]], C.RD, 1);
  // かげの 中の 目（2コマで まばたき）
  g.ell(0.24, 0.8, 0.12, 0.07, C.KL);
  if (!f) { g.ell(0.2, 0.79, 0.025, 0.02, C.E); g.ell(0.29, 0.79, 0.025, 0.02, C.E); }
  else g.line([[0.18, 0.8], [0.31, 0.8]], C.E, 1);
}

// ───────────── 28. 北の海辺の ハサミ団の かくれ岩（あなと ハサミと 小さな はた）─────────────
const CD = { R: '#a08a6a', RL: '#c8b490', RD: '#6a5a44', H: '#2a2018', C: '#e0503a', CL: '#f2805a', S: '#ead79c', F: '#3a3a4a', W: '#f4f4f4', P: '#8a6a4a' };
function crabDenArt(g, f) {
  const C = CD;
  g.ell(0.5, 0.9, 0.46, 0.08, C.S);
  // 岩
  g.ell(0.5, 0.6, 0.42, 0.32, C.RD);
  g.ell(0.48, 0.56, 0.38, 0.28, C.R);
  g.ell(0.4, 0.44, 0.14, 0.08, C.RL);
  // あな（3つ）
  g.ell(0.3, 0.66, 0.07, 0.06, C.H);
  g.ell(0.56, 0.7, 0.08, 0.07, C.H);
  g.ell(0.7, 0.52, 0.06, 0.05, C.H);
  // あなから のぞく ハサミ（2コマで カチカチ）
  const o = f ? 0.02 : 0;
  g.poly([[0.5, 0.66], [0.47 - o, 0.58], [0.53, 0.62]], C.C);
  g.poly([[0.6, 0.66], [0.63 + o, 0.58], [0.57, 0.62]], C.C);
  g.ell(0.3, 0.64, 0.025, 0.02, C.CL);
  // 小さな はた（ドクロの かわりに ハサミの しるし）
  g.rect(0.6, 0.14, 0.02, 0.24, C.P);
  g.poly([[0.62, 0.14], [0.84, 0.18 + o], [0.62, 0.26]], C.F);
  g.line([[0.68, 0.17], [0.75, 0.22]], C.W, 1); g.line([[0.68, 0.22], [0.75, 0.17]], C.W, 1);
}

// ───────────── 29. 白銀の湖の けずりかけの 氷の 像（四角い 氷から 竜の 頭が 出かかっている）─────────────
const IC = { I: '#bfe4f4', IL: '#eaf8ff', ID: '#7ab4d4', IS: '#4a84a8', SN: '#f4f8fc', SND: '#c8d4e4', W: '#8a5a32', M: '#9a9aa8' };
function iceBlockArt(g, f) {
  const C = IC;
  g.ell(0.5, 0.92, 0.46, 0.07, C.SND);
  // 四角い 氷
  g.rect(0.18, 0.38, 0.6, 0.52, C.ID);
  g.rect(0.2, 0.4, 0.56, 0.48, C.I);
  g.rect(0.22, 0.42, 0.1, 0.38, C.IL);
  // 上に 竜の 頭（けずりかけ）
  g.poly([[0.36, 0.4], [0.42, 0.18], [0.62, 0.14], [0.7, 0.24], [0.6, 0.3], [0.56, 0.4]], C.I);
  g.poly([[0.46, 0.18], [0.44, 0.08], [0.52, 0.16]], C.ID);
  g.ell(0.6, 0.2, 0.02, 0.02, C.IS);
  // おれた しっぽ（よこに ころがる）
  g.poly([[0.8, 0.86], [0.94, 0.8], [0.92, 0.88]], C.I);
  // のみと 木づち
  g.line([[0.08, 0.86], [0.16, 0.72]], C.W, 1);
  g.rect(0.14, 0.68, 0.04, 0.05, C.M);
  if (f) spark(g, 0.3, 0.5, 0.04, C.IL, '#ffffff');
}

// ───────────── 29. できあがった 氷の 竜の 像（台の 上で きらきら）─────────────
function iceDragonArt(g, f) {
  const C = IC;
  g.ell(0.5, 0.94, 0.46, 0.06, C.SND);
  // 台
  g.rect(0.16, 0.78, 0.68, 0.14, C.ID);
  g.rect(0.18, 0.78, 0.64, 0.04, C.IL);
  // 体と しっぽ
  g.ell(0.48, 0.64, 0.26, 0.16, C.I);
  g.poly([[0.7, 0.66], [0.94, 0.5], [0.88, 0.62], [0.72, 0.74]], C.I);
  // 首と 頭
  g.poly([[0.3, 0.6], [0.24, 0.32], [0.36, 0.3], [0.42, 0.56]], C.I);
  g.ell(0.28, 0.26, 0.12, 0.09, C.I);
  g.poly([[0.18, 0.26], [0.06, 0.3], [0.18, 0.32]], C.I);
  g.poly([[0.28, 0.18], [0.26, 0.06], [0.34, 0.16]], C.ID);
  g.poly([[0.36, 0.2], [0.4, 0.1], [0.42, 0.2]], C.ID);
  g.ell(0.26, 0.24, 0.02, 0.02, C.IS);
  // つばさ
  g.poly([[0.46, 0.52], [0.56, 0.2], [0.7, 0.3], [0.62, 0.52]], C.IL);
  g.line([[0.5, 0.5], [0.58, 0.26]], C.ID, 1); g.line([[0.56, 0.5], [0.66, 0.32]], C.ID, 1);
  // うろこの 光
  g.line([[0.38, 0.62], [0.58, 0.62]], C.ID, 1);
  spark(g, f ? 0.62 : 0.3, f ? 0.3 : 0.22, f ? 0.05 : 0.04, C.IL, '#ffffff');
}

// ───────────── より道: 千年前の ナギの島の ウミガメの すな山（たまごと 顔を 出す 赤ちゃん）─────────────
const TN = { S: '#ead79c', SD: '#c8b070', SL: '#f6ead0', E: '#f8f4e8', ED: '#d8d0bc', T: '#4a8a5a', TL: '#7ac08a', K: '#1a2a1a' };
function nestArt(g, f) {
  const C = TN;
  g.ell(0.5, 0.82, 0.44, 0.14, C.SD);
  g.ell(0.5, 0.76, 0.4, 0.14, C.S);
  g.ell(0.42, 0.7, 0.14, 0.05, C.SL);
  // たまご
  for (const [x, y] of [[0.36, 0.72], [0.5, 0.7], [0.62, 0.74]]) { g.ell(x, y, 0.06, 0.05, C.ED); g.ell(x - 0.01, y - 0.01, 0.05, 0.04, C.E); }
  // 赤ちゃんの 顔（2コマで ひょこっ）
  const y = f ? 0.6 : 0.64;
  g.ell(0.5, y + 0.04, 0.08, 0.05, C.T);
  g.ell(0.5, y, 0.05, 0.045, C.TL);
  g.ell(0.48, y - 0.005, 0.01, 0.01, C.K); g.ell(0.53, y - 0.005, 0.01, 0.01, C.K);
}

export function addWork5Art(ART) {
  ART.fq_shade_rock = { size: [28, 24], field: 28, npc: 1, pal: Object.values(SR), draw: shadeRockArt };
  ART.fq_crab_den = { size: [30, 26], field: 30, npc: 1, pal: Object.values(CD), draw: crabDenArt };
  ART.fq_ice_block = { size: [28, 30], field: 28, npc: 1, pal: Object.values(IC), draw: iceBlockArt };
  ART.fq_ice_dragon = { size: [32, 30], field: 32, npc: 1, pal: Object.values(IC), draw: iceDragonArt };
  ART.c8bd_nest = { size: [24, 20], field: 24, npc: 1, pal: Object.values(TN), draw: nestArt };
}
