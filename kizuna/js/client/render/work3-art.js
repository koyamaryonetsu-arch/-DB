// お仕事いらい板の たのまれごと 18〜23（第68回 D班）の 絵（render/work-art.js から まぜる）
// ・addWork3Art(ART) … 物の 絵（'mon:<id>' の NPC）: 竜守りの村の もえる まきおき場・鏡の湖の カッパ（子ども・じいさま・大カッパ）
//     （かぜひきの 子竜は ちびドラゴン、ホシフル村の 古い 宝箱は ひとくい箱 の 今までの 絵。星読みの里は 人の 絵だけ〈第5章の きまり〉。
//      けいこづくえは ノンタの 師しょうと 開ける）
// ・WORK3_NPC_LOOKS … 人の みため（render/chars.js の NPC_LOOKS に まざる）
// かきかたは work-art.js と おなじ（g … w・h の わりあいで かく。f … 0 か 1 の コマ）
import { spark } from './ch3-draw.js?v=a13852808b4d';

// ───────────── 人の みため ─────────────
export const WORK3_NPC_LOOKS = {
  // ルミナの 会議の 係ギロン（こん色の スーツ・めがね）・八百屋の おかみ（みどりの エプロン・バンダナ）
  fq_clerk: { hair: 0, hairStyle: 'short', skin: 0, outfit: 'suit', cloth: '#2e3a5a', tie: '#c83a3a', glasses: true },
  fq_greengrocer: { hair: 2, hairStyle: 'bun', skin: 1, outfit: 'apron', cloth: '#4a9a4a', female: true, hat: 'bandana', hatColor: '#f2c14e' },
  // ハミルの 花よめライラ（白い ドレス・白い ベール）
  fq_bride: { hair: 1, hairStyle: 'long', skin: 2, outfit: 'dress', cloth: '#fafaf4', female: true, hat: 'veil', hatColor: '#ffffff' },
  // 星読みの里の 見習いノンタ（黄色い シャツ・めがね）・シズ（ピンクの ワンピース）・旅人ペペ（だいだいの 旅の 服・ぼうし）・
  // ガキ大将ゴウタ（だいだいの シャツ・大きめ）
  fq_nonta: { hair: 0, hairStyle: 'short', skin: 0, outfit: 'tunic', cloth: '#f2d23a', glasses: true, small: true },
  fq_shizu: { hair: 1, hairStyle: 'twin', skin: 0, outfit: 'dress', cloth: '#f4a0c0', female: true, small: true },
  fq_pepe: { hair: 3, hairStyle: 'short', skin: 2, outfit: 'traveler', cloth: '#d8823a', hat: 'feather', hatColor: '#3a8a5a', beard: true },
  fq_gouta: { hair: 0, hairStyle: 'spiky', skin: 1, outfit: 'tunic', cloth: '#e0782e' },
  // ホシフル村の 花好きの おばあさんハナ（うすむらさきの ローブ・花の ショール・つえ）
  fq_granny: { hair: 5, hairStyle: 'bun', skin: 0, outfit: 'robe', robeMain: '#a88ac8', robeTrim: '#7ab8f0', female: true, cane: true, hunch: true, hat: 'shawl', hatColor: '#7ab8f0' },
};

// ───────────── 21. 竜守りの村の もえる まきおき場（まきの 山・雪の 上・ほのお と けむり）─────────────
const FP = { W: '#8a5a32', WL: '#b8834e', WD: '#4a2e18', F: '#f28a2e', FL: '#f2d24e', FR: '#e04a2a', S: '#9a9aa8', SL: '#c8c8d4', SN: '#f4f8fc', SND: '#c8d4e4' };
function firePileArt(g, f) {
  const C = FP;
  g.ell(0.5, 0.92, 0.46, 0.07, C.SND);
  // けむり（2コマで ゆれる）
  g.ell(f ? 0.42 : 0.56, 0.14, 0.12, 0.08, C.SL);
  g.ell(f ? 0.56 : 0.44, 0.06, 0.08, 0.05, C.S);
  // まきの 山（切り口の 丸を ならべる）
  g.poly([[0.08, 0.9], [0.18, 0.6], [0.82, 0.6], [0.92, 0.9]], C.WD);
  for (const [x, y] of [[0.22, 0.82], [0.38, 0.82], [0.54, 0.82], [0.7, 0.82], [0.3, 0.68], [0.46, 0.68], [0.62, 0.68]]) {
    g.ell(x, y, 0.08, 0.07, C.W);
    g.ell(x, y, 0.04, 0.035, C.WL);
  }
  // ほのお
  const s = f ? 0.04 : 0;
  g.poly([[0.28, 0.66], [0.34, 0.36 - s], [0.42, 0.5], [0.5, 0.22 + s], [0.58, 0.48], [0.66, 0.32 - s], [0.72, 0.66]], C.FR);
  g.poly([[0.34, 0.66], [0.4, 0.46], [0.46, 0.54], [0.5, 0.36 + s], [0.56, 0.54], [0.62, 0.44], [0.66, 0.66]], C.F);
  g.poly([[0.42, 0.66], [0.46, 0.54], [0.5, 0.48], [0.54, 0.56], [0.58, 0.66]], C.FL);
  // まわりの 雪
  g.ell(0.12, 0.9, 0.08, 0.04, C.SN); g.ell(0.88, 0.9, 0.09, 0.04, C.SN);
  spark(g, f ? 0.2 : 0.8, 0.4, 0.05, C.FL, '#ffffff');
}

// ───────────── 23. 鏡の湖の カッパ（みどりの からだ・頭の お皿・くちばし・こうら）─────────────
// kind … 'kid'（カン太）・'old'（じいさま: うすい みどり・白い まゆと ひげ）・'big'（大カッパの ドン太: こい みどり・太い うで）
const KP = {
  kid: { B: '#4ab86a', BD: '#2e8a4a', BL: '#8ad89a', P: '#e8f4f8', PW: '#7ac8e8', K: '#f2c14e', SH: '#8a6a3a', SHD: '#5a4224', E: '#1e2234' },
  old: { B: '#8ab88a', BD: '#5a8a5a', BL: '#b8d8b0', P: '#e8f4f8', PW: '#7ac8e8', K: '#e0b04e', SH: '#7a6a5a', SHD: '#4a4038', E: '#1e2234', W: '#f4f4f4' },
  big: { B: '#2e8a4a', BD: '#1e5a32', BL: '#5ab86a', P: '#e8f4f8', PW: '#5ab0e0', K: '#e8a03a', SH: '#6a4a2a', SHD: '#3a2a18', E: '#1e2234' },
};
function kappaArt(kind) {
  const C = KP[kind];
  const big = kind === 'big';
  return (g, f) => {
    const bob = f ? 0.01 : 0;
    // かげ
    g.ell(0.5, 0.95, 0.3, 0.04, C.BD);
    // あし
    g.ell(0.36, 0.9, 0.09, 0.05, C.BD); g.ell(0.64, 0.9, 0.09, 0.05, C.BD);
    // こうら（せなか。少し 見える）と からだ
    g.ell(0.5, 0.66 + bob, big ? 0.36 : 0.3, 0.24, C.SHD);
    g.ell(0.5, 0.66 + bob, big ? 0.32 : 0.26, 0.21, C.SH);
    g.ell(0.5, 0.68 + bob, big ? 0.24 : 0.19, 0.18, C.B);
    g.ell(0.5, 0.71 + bob, big ? 0.16 : 0.12, 0.12, C.BL);
    // うで（大カッパは 太い）
    const aw = big ? 0.09 : 0.06;
    g.ell(0.22, (f ? 0.62 : 0.66) + bob, aw, 0.08, C.B); g.ell(0.78, (f ? 0.66 : 0.62) + bob, aw, 0.08, C.B);
    // 頭
    g.ell(0.5, 0.36 + bob, 0.26, 0.2, C.B);
    // お皿（水が 光る）
    g.ell(0.5, 0.2 + bob, 0.18, 0.06, C.P);
    g.ell(0.5, 0.2 + bob, 0.13, 0.04, C.PW);
    // かみの毛の ぎざぎざ
    for (const x of [0.28, 0.36, 0.64, 0.72]) g.poly([[x - 0.04, 0.24 + bob], [x, 0.3 + bob], [x + 0.04, 0.24 + bob]], C.BD);
    // 目
    g.ell(0.41, 0.36 + bob, 0.04, 0.045, '#ffffff'); g.ell(0.59, 0.36 + bob, 0.04, 0.045, '#ffffff');
    g.ell(0.42, 0.37 + bob, 0.02, 0.025, C.E); g.ell(0.6, 0.37 + bob, 0.02, 0.025, C.E);
    // くちばし
    g.poly([[0.42, 0.44 + bob], [0.58, 0.44 + bob], [0.5, 0.52 + bob]], C.K);
    if (kind === 'old') {
      // 白い まゆと ひげ
      g.line([[0.36, 0.31 + bob], [0.46, 0.32 + bob]], C.W, 1); g.line([[0.54, 0.32 + bob], [0.64, 0.31 + bob]], C.W, 1);
      g.poly([[0.44, 0.5 + bob], [0.56, 0.5 + bob], [0.5, 0.62 + bob]], C.W);
    }
    if (kind === 'kid') g.ell(0.84, 0.5 + bob, 0.04, 0.06, '#5ac85a'); // 手に きゅうり
    if (f) spark(g, 0.72, 0.14, 0.04, C.PW, '#ffffff');
  };
}

export function addWork3Art(ART) {
  ART.fq_fire_pile = { size: [32, 30], field: 32, npc: 1, pal: Object.values(FP), draw: firePileArt };
  ART.fq_kappa = { size: [18, 22], field: 20, pal: [...Object.values(KP.kid), '#ffffff', '#5ac85a'], draw: kappaArt('kid') };
  ART.fq_kappa_old = { size: [18, 22], field: 20, pal: [...Object.values(KP.old), '#ffffff'], draw: kappaArt('old') };
  ART.fq_kappa_big = { size: [24, 26], field: 26, pal: [...Object.values(KP.big), '#ffffff'], draw: kappaArt('big') };
}
