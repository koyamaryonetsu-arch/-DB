// 第33回の 新しい 職業 11この みため（服・ぼうし・かみ・かお・もちもの）
// hero-outfit.js（服・からだ）・hero-r26.js（つけたし・かお・もちもの・ぼうし）・hero-gear.js（ぼうし）・hero.js（かみの いろ・手）・chars.js（古い 小さな え）から よばれる。
// どの え も「それと わかる、でも そのまま うつさない」ゲームの ドットえ（ロゴや 顔は かかない）。
//
//  手品師        … 黒い えんび服・赤い 蝶ネクタイ・黒い マント（うらは 赤）・黒い シルクハット・白い 手ぶくろ・ステッキ
//  かいとう      … こい むらさきの スーツ・白い マント・白い シルクハット・片めがね・白い 手ぶくろ・予告状
//  かいとうキッド … 白い スーツ（青い シャツ・赤い ネクタイ）・白い マント・白い シルクハット・片めがね（クローバーの かざり）・トランプ銃
//  魔法学校の生徒 … 黒い ローブ・白い えりと しまの ネクタイ・つえ
//  ハリーポッター … 黒い ローブ（うらは 赤）・赤と 金の マフラーと ネクタイ・まるめがね・ひたいの いなずまの きず・くしゃくしゃの 黒い かみ・つえ・せなかの ほうき
//  3年B組の担任  … まん中で 分けた 長めの かみ・茶色の ジャケット・ネクタイ・出席ぼ
//  れん金術師    … 茶色の ローブ・白い 手ぶくろに 赤い れん金の 円
//  国家れん金術師 … 青い 軍服・白い 手ぶくろ（れん金の 円）・銀時計（こしの くさりと 手に もつ 時計）
//  はがねのれん金術師 … 赤い コート（せなかに 黒い しるし）・黒い 服・金の みつあみ・金の 目・機械の 右うで
//  美少女戦士    … セーラーえりの 戦闘服・大きな リボン・ティアラ（銀）・ひざまでの ブーツ・白い 手ぶくろ
//  セーラームーン … 金の ツインテールと おだんご・ティアラ（金に 赤い 石）・赤い ブーツ・月の ステッキ
//
//   R33_JOBS     … 職業の id（データの 人との やくそく。docs/plan-r33-jobs.md）
//   R33_OUTFIT   … 布の服の ときの 服（hero-outfit.js の JOB_OUTFIT に まぜる）
//   R33_BODY     … よろいを かえても のこる からだの とくちょう（JOB_BODY に まぜる）
//   R33_HAIR     … かみの いろ（hero.js の JOB_HAIR_RAMP に まぜる）
//   R33_HAT      … 布の服の ときの ぼうし（hero-gear.js の JOB_HAT に まぜる）
//   R33_BODY_HAT … よろいでも のこる ぼうし（ティアラ。hero-gear.js の からだの ぼうしに まぜる）
//   R33_OLD_LOOK … 古い 小さな え（chars.js の JOB_LOOK に まぜる）
//   R33_MASC・masc33(job, fem) … 男の子の 美少女戦士・セーラームーン（タキシード仮面ふう。上の 表の かわり）
//   outfit33(O, S, Lk, fem) … 服の つけたし（outfit26 の つけたしから よぶ）
//   body33(O, JB)           … からだの つけたし（body26 から よぶ。機械の うで・手ぶくろの 円）
//   drawR33(cv, P, O, layer) … マント・マフラー・ほうき・リボン・ネクタイ・くさり・せなかの しるし（drawR26 から よぶ）
//   face33(cv, H, B, view, phase) … まるめがね・片めがね・いなずまの きず（face26 から よぶ）
//   drawHat33(cv, P, H, G, view) … シルクハット・ティアラ（drawHat26 から よぶ。かいたら true）
//   drawProp33(cv, P, A, O) … たての ない 手の もちもの（drawProp26 から よぶ。かいたら true）
//   handMark33(cv, A, P, O) … 手ぶくろの れん金の 円（hero.js の 手の あとで よぶ）
import { mat, ramp, TH, mixC } from './hero-raster.js?v=b006a21bc0e3';
import { EYE_V } from './hero-face.js?v=b006a21bc0e3';
// 第40回: 男の子の ネオ・クイーン・セレニティ（キング・エンディミオン）も masc33 で かえす
import { R40_MASC } from './hero-r40.js?v=b006a21bc0e3';
// 第41回 B: 男の子の 雪の女王（雪の王）・第5のせいれいの 見た目
import { R41B_MASC } from './hero-r41b.js?v=b006a21bc0e3';
// 第43回: 男の子の 配管工の 系統（配管工・ひげおやじ・マリオ）の 見た目
import { R43J_MASC } from './hero-r43j.js?v=b006a21bc0e3';

export const R33_JOBS = ['magician', 'kaito', 'kaito_kid', 'wizard_student', 'harry', 'homeroom_3b', 'alchemist', 'state_alchemist', 'fullmetal', 'sailor_soldier', 'sailor_moon'];

// ───────────── ざいしつ ─────────────
const cl = (c, o = {}) => mat({ r: ramp(c, 4, o), th: o.th || TH.cloth });
const mt = (r) => mat({ r, th: TH.metal, spec: 0.958, sc: '#ffffff' });
const GOLD = ['#5a3210', '#9c5e1a', '#d69a2e', '#f6d26c', '#fff6cc'];
const SILVER = ['#3a4256', '#78839e', '#b6bed2', '#e4e8f2', '#ffffff'];
// 機械の うで（青みの ある はがね）
const STEEL = ['#252c3c', '#55607a', '#8e9ab4', '#c8d0e0', '#f4f6fc'];
const STEEL_D = ['#1a1e2a', '#3a4256', '#646e88', '#9aa4bc', '#d8dcea'];
const white = () => mat({ r: ['#8e8ca6', '#cac8da', '#f2f2f8', '#ffffff'], th: TH.cloth });
const wood = () => mat({ r: ['#2a1608', '#5a3218', '#8a5228', '#b87a40'], th: TH.matte });
const gemM = (c) => mat({ r: [mixC(c, '#000000', 0.45), mixC(c, '#000000', 0.15), c, mixC(c, '#ffffff', 0.55), '#ffffff'], th: TH.gem, spec: 0.9, sc: '#ffffff' });
// しまもよう（赤と 金・こんと 銀）: ふつうは 1つめの いろ、もようの ところは 3つめの いろ
const stripeMat = (a, b) => mat({ r: [mixC(a, '#000000', 0.35), a, b, mixC(b, '#ffffff', 0.4)], th: [-0.3, 0.6, 1.4] });
const stripeTex = (k, ang = 1) => {
  const s = k >= 4 ? 4 : 2;
  return (ix, iy) => (Math.floor((iy + ix * ang * 0.5) / s) % 2 ? 2.2 : 0);
};

// ───────────── 職業ごとの 服（布の服 の とき） ─────────────
// r33: この ファイルの つけたしを つかう  cape・capeIn: マントと その うら  drape: まえに たれる マント  gloves: 白い 手ぶくろ
// tie33: [ネクタイの いろ, しまの いろ]（ローブの まえに 白い えりと ネクタイ）  scarf33: マフラー  broom33: せなかの ほうき
// senshi: セーラー戦士の 服の いろ { collar, skirt, bow, boots, gem }  chain33: こしの 銀の くさり  crest33: せなかの 黒い しるし
export const R33_OUTFIT = {
  magician: { kind: 'suit', main: '#1c1a26', bow: '#d0202c', lapel: '#0c0a12', pants: '#16141e', r33: true, cape: '#1c1a28', capeIn: '#c41a2a', capeLen: 35.6, drape: true, gloves: true },
  kaito: { kind: 'suit', main: '#2c2646', tie: '#6a4ab4', pants: '#221e38', r33: true, cape: '#f4f4f8', capeIn: '#4a3a7e', capeLen: 36.0, drape: true, gloves: true },
  kaito_kid: { kind: 'suit', main: '#f4f4f8', tie: '#d0202c', shirt: '#3a62c8', pants: '#eceef6', r33: true, cape: '#f8f8fc', capeIn: '#d8deec', capeLen: 36.4, drape: true, gloves: true },
  wizard_student: { kind: 'robe', main: '#1c1a26', trim: '#3c3a4c', r33: true, tie33: ['#2a3e86', '#c4c8d6'] },
  harry: { kind: 'robe', main: '#1a1822', trim: '#8e1a22', r33: true, tie33: ['#9a1c24', '#e8b42e'], scarf33: ['#9a1c24', '#e8b42e'], broom33: true },
  homeroom_3b: { kind: 'suit', main: '#86704e', tie: '#2a4a8a', pants: '#4a4a58', r33: true },
  alchemist: { kind: 'robe', main: '#6a4630', trim: '#c89a4a', r33: true },
  state_alchemist: { kind: 'uniform', main: '#27367a', r33: true, chain33: true },
  fullmetal: { kind: 'coat', main: '#b81e28', lining: '#1a1820', plain: true, r33: true, crest33: true, shirt: '#1a1820' },
  sailor_soldier: { kind: 'sailor', r33: true, senshi: { collar: '#d8487e', skirt: '#d8487e', bow: '#7a4ad0', boots: '#d8487e', gem: '#ff7ab8' } },
  sailor_moon: { kind: 'sailor', r33: true, senshi: { collar: '#2a4ec0', skirt: '#2a4ec0', bow: '#e0203a', boots: '#d81e34', gem: '#f6d26c', moon: true } },
};

// からだの とくちょう（よろいを きても のこる）
// glasses33: 'round'（まるめがね）  monocle33: 'plain' | 'clover'（片めがね）  bolt33: ひたいの いなずまの きず
// circle33: 手ぶくろの れん金の 円の いろ  mech33: 機械の 右うで  prop: もちもの（drawProp33）
export const R33_BODY = {
  magician: { prop: 'stick33', r33: true },
  kaito: { monocle33: 'plain', prop: 'notice33', r33: true },
  kaito_kid: { monocle33: 'clover', prop: 'cardgun33', iris: '#4a6ab8', r33: true },
  wizard_student: { prop: 'wand33', r33: true },
  harry: { hair: 'messy33', hcol: 'r33black', iris: '#2a8a4a', glasses33: 'round', bolt33: true, prop: 'wand33', r33: true },
  homeroom_3b: { hair: 'center33', prop: 'book33', r33: true },
  alchemist: { circle33: '#d0202c', r33: true },
  state_alchemist: { circle33: '#d0202c', prop: 'watch33', r33: true },
  fullmetal: { hair: 'braid33', hcol: 'r33gold', iris: '#d89a1a', mech33: true, r33: true },
  sailor_soldier: { iris: '#c03a76', r33: true },
  sailor_moon: { hair: 'moon33', hcol: 'r33moon', iris: '#3a72d8', prop: 'moonstick33', r33: true },
};
// かみの いろ
export const R33_HAIR = {
  r33black: ['#110c18', '#1e1626', '#2d2330', '#4a3e5e', '#7a6e96'],
  // はがねの れん金術師: こい 金
  r33gold: ['#6e420c', '#b47a1a', '#e2aa32', '#f8d866', '#fff2bc'],
  // セーラームーン: あかるい 金
  r33moon: ['#9a6a16', '#dca432', '#f6d052', '#ffee88', '#fffbe0'],
};
// 布の服の ときの ぼうし
export const R33_HAT = {
  magician: { kind: 'silk33', c: '#1c1a26', band: '#c41a2a', hides: 'top' },
  kaito: { kind: 'silk33', c: '#f4f4f8', band: '#4a3a7e', hides: 'top' },
  kaito_kid: { kind: 'silk33', c: '#f8f8fc', band: '#2a4ab0', hides: 'top' },
};
// よろいでも のこる ぼうし（ティアラ）
export const R33_BODY_HAT = {
  sailor_soldier: { kind: 'tiara33', mk: SILVER, gemc: '#ff5aa0' },
  sailor_moon: { kind: 'tiara33', mk: GOLD, gemc: '#e8203a', moon: true },
};
// 古い 小さな え（chars.js。32×42）
export const R33_OLD_LOOK = {
  magician: { outfit: 'suit', cloth: '#1c1a26', tie: '#d0202c', cape: '#1c1a28', hat: 'cap', hatColor: '#1c1a26' },
  kaito: { outfit: 'suit', cloth: '#2c2646', tie: '#6a4ab4', cape: '#f4f4f8', hat: 'cap', hatColor: '#f4f4f8' },
  kaito_kid: { outfit: 'suit', cloth: '#f4f4f8', tie: '#d0202c', cape: '#f8f8fc', hat: 'cap', hatColor: '#f8f8fc' },
  wizard_student: { outfit: 'robe', robeMain: '#1c1a26', robeTrim: '#3c3a4c' },
  harry: { outfit: 'robe', robeMain: '#1a1822', robeTrim: '#9a1c24', glasses: true },
  homeroom_3b: { outfit: 'suit', cloth: '#86704e', tie: '#2a4a8a' },
  alchemist: { outfit: 'robe', robeMain: '#6a4630', robeTrim: '#c89a4a' },
  state_alchemist: { outfit: 'uniform', cloth: '#27367a' },
  fullmetal: { outfit: 'robe', robeMain: '#b81e28', robeTrim: '#1a1820' },
  sailor_soldier: { outfit: 'dress', cloth: '#d8487e', hat: 'tiara', hatColor: '#dcdcec' },
  sailor_moon: { outfit: 'dress', cloth: '#2a4ec0', hat: 'tiara', hatColor: '#f2c14e' },
};

// ───────────── 男の子の 美少女戦士・セーラームーン（タキシード仮面ふう。家族が きめた こと） ─────────────
// 男性（look.body が 1 で ない）の ときだけ、上の 表の かわりに つかう。女の子は 今の まま（セーラー服・おだんご・ティアラ）
//  黒い えんび服・白い シャツ・黒い 蝶ネクタイ・黒い マント（うらは 赤）・黒い シルクハット・目もとの 白い 仮面・赤い バラ
//  美少女戦士 … マントが みじかめで うらは こい 赤・ふつうの バラ
//  セーラームーン … マントが 長く うらは あかるい 赤・バラが 光る
//   outfit: 布の服の ときの 服（JOB_OUTFIT の かわり）  body: からだの とくちょう（JOB_BODY の かわり。仮面と バラは よろいでも のこる）
//   hat: 布の服の ときの ぼうし（JOB_HAT の かわり。ティアラ R33_BODY_HAT は かぶらない）  old: 古い 小さな え（JOB_LOOK の かわり）
const TUX = (capeIn, capeLen) => ({ kind: 'suit', main: '#1a1822', bow: '#141018', lapel: '#0a0810', pants: '#15131c', r33: true, cape: '#17151f', capeIn, capeLen, drape: true, gloves: true });
export const R33_MASC = {
  sailor_soldier: {
    outfit: TUX('#a0162a', 33.4),
    body: { mask33: true, prop: 'rose33', rose33: '#a0162a', r33: true },
    hat: { kind: 'silk33', c: '#1c1a26', band: '#3c3a4a', hides: 'top' },
    old: { outfit: 'suit', cloth: '#1c1a26', tie: '#141018', cape: '#1c1a28', hat: 'silk', hatColor: '#1c1a26', mask: true, rose: 'plain' },
  },
  sailor_moon: {
    outfit: TUX('#ec2a40', 36.4),
    body: { mask33: true, prop: 'rose33', rose33: '#ec2a40', roseGlow33: true, r33: true },
    hat: { kind: 'silk33', c: '#1c1a26', band: '#141018', hides: 'top' },
    old: { outfit: 'suit', cloth: '#1c1a26', tie: '#141018', cape: '#1c1a28', hat: 'silk', hatColor: '#1c1a26', mask: true, rose: 'glow' },
  },
};
// 男性で タキシード仮面ふうに なる 職業なら その 見た目（ほかは null）。fem: 女性か（look.body === 1）
export const masc33 = (job, fem) => (!fem && (R33_MASC[job] || R40_MASC[job] || R41B_MASC[job] || R43J_MASC[job])) || null;

// ───────────── 服の つけたし（outfit26 の つけたしから） ─────────────
export function outfit33(O, S, Lk, fem) {
  if (!S.r33) return;
  const R = (O.r33 = O.r33 || {});
  if (S.cape && O.cape) {
    O.cape.inner = cl(S.capeIn || mixC(S.cape, '#000000', 0.35), { light: 1.05 });
    if (S.drape) R.drape = { m: O.cape.m, inner: O.cape.inner, clasp: S.cape === '#1c1a28' ? mt(GOLD) : gemM(S.capeIn) };
  }
  if (S.gloves) {
    O.glove = white();
    O.sleeve = { ...O.sleeve, cuff: O.glove };
  }
  if (S.tie33) {
    // ローブの まえ: グレーの セーター・白い えり・しまの ネクタイ。おびは しない
    R.tie = { m: stripeMat(S.tie33[0], S.tie33[1]), shirt: white(), knit: cl('#6a6a74') };
    O.belt = null;
  }
  if (S.scarf33) R.scarf = stripeMat(S.scarf33[0], S.scarf33[1]);
  if (S.broom33) R.broom = { stick: wood(), straw: mat({ r: ['#6a4a1a', '#a8803a', '#d8b46a', '#f4dca0'], th: TH.matte }), band: mt(SILVER) };
  if (S.chain33) R.chain = mt(SILVER);
  if (S.crest33) R.crest = cl('#1a1820');
  if (S.senshi) senshi(O, S.senshi, Lk, fem, R);
}

// セーラー戦士の 戦闘服（'sailor' の 服を かえる）
function senshi(O, C, Lk, fem, R) {
  const wm = white();
  O.top = wm;
  O.torso = { ...O.torso, hem: 29.4, stripe: null, collar: cl(C.collar, { light: 1.05 }), scarf: cl(C.bow, { light: 1.1 }), line: wm };
  O.sleeve = { upper: wm, lower: wm, cuff: cl(C.bow, { light: 1.1 }), cuffW: 1.16, puff: 1.32 };
  O.glove = wm;
  O.belt = null;
  O.pants = fem ? Lk.skin : cl(C.skirt);
  O.skirt = fem ? { m: cl(C.skirt, { light: 1.05 }), y0: 28.4, y1: 32.2, flare: 1.9, kind: 'pleat' } : null;
  O.boots = { m: cl(C.boots, { light: 1.08 }), h: 0.84, cuff: cl(mixC(C.boots, '#ffffff', 0.25)) };
  R.bow = { m: cl(C.bow, { light: 1.1 }), gem: C.moon ? mt(GOLD) : gemM(C.gem), moon: !!C.moon };
}

// ───────────── からだの つけたし（body26 から） ─────────────
export function body33(O, JB) {
  if (!JB.r33) return;
  if (JB.circle33) {
    // れん金の 円は 白い 手ぶくろの 上に（よろいでも 手ぶくろは のこる）
    if (!O.glove) O.glove = white();
    O.handMark = JB.circle33;
  }
  if (JB.mech33) {
    // 機械の 右うで（ひじから 先が 銀。そでは まくった かたち）
    O.sleeveR = { ...O.sleeve, lower: mt(STEEL), cuff: mt(STEEL_D), cuffW: 1.2, tex: null, bandage: null, roll: O.sleeve.upper, mech: true };
    O.glove = O.glove || white();
    // みつあみの ひもは 黒
    O.tie = '#2a2430';
  }
}

// ───────────── かく（hero.js の じゅんばん。drawR26 の あとで よぶ） ─────────────
// layer: 'behind'（まえむきの からだの うしろ）/ 'over'（服の うえ）/ 'neck'（うでの あと）/ 'backTop'（うしろむきの うでの あと）/ 'side'（よこむきの からだの うしろ）
export function drawR33(cv, P, O, layer) {
  const R = O.r33;
  if (!R) return;
  const view = P.side ? 'side' : P.back ? 'back' : 'front';
  if (layer === 'behind') {
    if (R.broom) broom(cv, P, R.broom, 'behind');
    return;
  }
  if (layer === 'side') {
    if (R.broom) broom(cv, P, R.broom, 'side');
    return;
  }
  if (layer === 'over') {
    if (view === 'back') {
      if (R.bow) backBow(cv, P, R.bow);
      if (R.crest) backCrest(cv, R.crest);
      return;
    }
    if (R.tie) robeTie(cv, P, R.tie, view);
    if (R.bow) chestBow(cv, P, R.bow, view);
    if (R.chain) watchChain(cv, P, R.chain, view);
    return;
  }
  if (layer === 'neck') {
    if (R.scarf && view !== 'back') scarf(cv, P, R.scarf, view);
    if (R.drape) drape(cv, P, R.drape, view);
    return;
  }
  if (layer === 'backTop') {
    if (R.scarf) scarfBack(cv, R.scarf);
    if (R.broom) broom(cv, P, R.broom, 'back');
  }
}

// まえに たれる マント（かたから ひらいて うでに かかる。はしと すそに うらの 色）
function drape(cv, P, M, view) {
  const sw = P.f === 0 ? 1 : -1;
  if (view === 'front') {
    for (const s of [-1, 1]) {
      const x = (u) => 16 + s * u;
      cv.part({ ol: 'line' });
      cv.poly([[x(3.0), 20.6], [x(5.8), 20.4], [x(7.4), 23.0], [x(7.9), 28.0], [x(8.3 + 0.3 * sw * s), 33.6], [x(5.6), 33.8], [x(5.2), 28.4], [x(4.6), 23.4]], M.m, { cx: 0.8, cy: 0.2 });
      const id = cv.cur;
      cv.part({ ol: 'none', clip: id, cast: false });
      cv.poly([[x(3.0), 20.6], [x(4.0), 20.6], [x(4.9), 23.4], [x(5.6), 28.4], [x(6.2), 34.0], [x(5.2), 34.0], [x(4.8), 28.4], [x(3.9), 23.6]], M.inner, { cx: 0.5 });
      cv.crease([[x(6.4), 24.0], [x(6.9), 32.8]], 0.26, -0.42, { parts: [id] });
    }
    // むねの とめ金（まん中の 上）
    cv.part({ ol: 'line' });
    cv.ell(16, 21.0, 0.85, 0.75, M.clasp, { bulge: 0.9 });
    return;
  }
  if (view === 'side') {
    const X = P.X, b = P.bob || 0;
    cv.part({ ol: 'line' });
    cv.poly([[X(1.4), 20.6 + b], [X(-2.6), 20.8 + b], [X(-3.8), 25.6 + b], [X(-4.2), 31.8], [X(-0.8), 32.0], [X(0.8), 25.8 + b]], M.m, { cx: 0.8, cy: 0.2 });
    const id = cv.cur;
    cv.part({ ol: 'none', clip: id, cast: false });
    cv.poly([[X(1.4), 20.6 + b], [X(0.4), 20.6 + b], [X(-0.2), 25.8 + b], [X(-1.6), 32.2], [X(-0.6), 32.2], [X(0.9), 25.8 + b]], M.inner, { cx: 0.5 });
    cv.crease([[X(-1.6), 23.0 + b], [X(-2.4), 31.0]], 0.26, -0.42, { parts: [id] });
    cv.part({ ol: 'line' });
    cv.ell(X(1.6), 21.2 + b, 0.6, 0.75, M.clasp, { bulge: 0.9 });
  }
}

// ローブの まえの V（グレーの セーター・白い えり・しまの ネクタイ）
function robeTie(cv, P, T, view) {
  if (view === 'side') {
    const X = P.X, b = P.bob || 0;
    cv.part({ ol: 'soft' });
    cv.poly([[X(1.6), 21.0 + b], [X(2.6), 21.2 + b], [X(2.8), 23.6 + b], [X(1.9), 24.0 + b]], T.knit, { n: [0, 0] });
    cv.part({ ol: 'soft' });
    cv.poly([[X(2.2), 21.6 + b], [X(2.9), 21.8 + b], [X(3.0), 24.4 + b], [X(2.4), 24.6 + b]], T.m, { cx: 0.5, tex: stripeTex(cv.k) });
    return;
  }
  cv.part({ ol: 'line' });
  cv.poly([[13.6, 20.8], [18.4, 20.8], [17.4, 24.2], [16, 26.4], [14.6, 24.2]], T.knit, { n: [0, -0.1] });
  const vid = cv.cur;
  cv.part({ ol: 'soft', clip: vid });
  for (const s of [-1, 1]) cv.poly([[16 + s * 0.2, 21.0], [16 + s * 2.4, 20.8], [16 + s * 1.9, 22.6], [16 + s * 0.4, 22.2]], T.shirt, { n: [s * 0.2, -0.1] });
  cv.part({ ol: 'soft', clip: vid });
  cv.poly([[15.4, 21.8], [16.6, 21.8], [16.8, 25.2], [16, 26.2], [15.2, 25.2]], T.m, { cx: 0.6, tex: stripeTex(cv.k) });
  cv.part({ ol: 'soft' });
  cv.ell(16, 21.9, 0.7, 0.55, T.m, { bulge: 0.7 });
}

// むねの 大きな リボン（2つの わ・たれ・まん中の 石）
function chestBow(cv, P, B, view) {
  if (view === 'side') {
    const X = P.X, b = P.bob || 0;
    cv.part({ ol: 'line' });
    cv.poly([[X(1.6), 22.6 + b], [X(3.6), 21.8 + b], [X(3.8), 24.6 + b], [X(2.0), 24.2 + b]], B.m, { cx: 0.6 });
    cv.part({ ol: 'line' });
    cv.poly([[X(2.0), 24.0 + b], [X(3.2), 24.4 + b], [X(3.0), 27.0 + b], [X(2.2), 26.4 + b]], B.m, { cx: 0.6 });
    cv.part({ ol: 'line' });
    cv.ell(X(2.6), 23.4 + b, 0.7, 0.75, B.gem, { bulge: 0.9 });
    return;
  }
  // たれ
  for (const s of [-1, 1]) {
    cv.part({ ol: 'line' });
    cv.poly([[16 + s * 0.4, 24.0], [16 + s * 2.4, 27.6], [16 + s * 1.6, 27.9], [16 + s * 1.2, 27.2], [16 + s * 0.2, 25.2]], B.m, { cx: 0.6 });
  }
  // わ
  for (const s of [-1, 1]) {
    cv.part({ ol: 'line' });
    cv.poly([[16, 23.6], [16 + s * 2.4, 22.0], [16 + s * 3.6, 22.4], [16 + s * 3.4, 24.6], [16 + s * 2.2, 25.0]], B.m, { cx: 0.6, cy: 0.4 });
    cv.crease([[16 + s * 0.8, 23.6], [16 + s * 2.6, 23.2]], 0.16, -0.5, { parts: [cv.cur] });
  }
  // まん中の 石（セーラームーン: 金の まるい ブローチ）
  cv.part({ ol: 'line' });
  if (B.moon) {
    cv.ell(16, 23.6, 1.2, 1.15, B.gem, { bulge: 0.95 });
    const id = cv.cur;
    cv.part({ ol: 'none', clip: id, cast: false });
    cv.ell(16, 23.6, 0.55, 0.55, gemM('#e8203a'), { bulge: 0.6 });
  } else cv.ell(16, 23.6, 1.0, 1.0, B.gem, { bulge: 0.95 });
}
// こしの うしろの 大きな リボン
function backBow(cv, P, B) {
  const sw = P.f === 0 ? 0.3 : -0.3;
  for (const s of [-1, 1]) {
    cv.part({ ol: 'line' });
    cv.poly([[16 + s * 0.6, 29.0], [16 + s * 2.6 + sw, 33.4], [16 + s * 1.6 + sw, 33.8], [16 + s * 1.2, 32.8], [16 + s * 0.2, 30.2]], B.m, { cx: 0.6 });
  }
  for (const s of [-1, 1]) {
    cv.part({ ol: 'line' });
    cv.poly([[16, 28.6], [16 + s * 2.8, 26.8], [16 + s * 4.2, 27.4], [16 + s * 4.0, 29.8], [16 + s * 2.6, 30.2]], B.m, { cx: 0.6, cy: 0.4 });
    cv.crease([[16 + s * 0.8, 28.6], [16 + s * 3.0, 28.2]], 0.16, -0.5, { parts: [cv.cur] });
  }
  cv.part({ ol: 'line' });
  cv.ell(16, 28.6, 1.0, 0.9, B.m, { bulge: 0.8 });
}

// 国家れん金術師の 銀時計の くさり（ベルトから ポケットへ）
function watchChain(cv, P, M, view) {
  cv.part({ ol: 'none' });
  if (view === 'side') {
    const X = P.X, b = P.bob || 0;
    cv.stroke([[X(1.8), 28.8 + b], [X(1.2), 30.2 + b], [X(0.2), 29.8 + b]], 0.2, M, { n: [0, -0.3] });
    return;
  }
  cv.stroke([[13.0, 28.9], [14.0, 30.4], [15.6, 30.8], [17.2, 30.2]], 0.2, M, { n: [0, -0.3] });
}

// はがねの れん金術師の コートの せなかの しるし（十字に へびが まきつく。かんたんな かたち）
function backCrest(cv, M) {
  const k = cv.k;
  cv.part({ ol: 'none', cast: false });
  const c = '#141018';
  const X = cv.X(16), Y = cv.Y(35.2);
  if (k >= 4) {
    cv.stamp(X - 5, Y - 8, [
      '.....K.....',
      '....KKK....',
      '.....K.....',
      '..KKKKKKK..',
      '.....K.....',
      '...KKK.....',
      '..K..K.K...',
      '.....KK....',
      '...K.K.....',
      '....KKK....',
      '.....K..K..',
      '.....KKK...',
      '.....K.....',
      '....KKK....',
    ], { K: c });
  } else {
    cv.stamp(X - 2, Y - 4, ['..K..', 'KKKKK', '..K..', '.KK..', '..KK.', '.KK..', '..K..', '.KKK.'], { K: c });
  }
  void M;
}

// ハリーの マフラー（くびに まいて、はしが むねに たれる）
function scarf(cv, P, M, view) {
  const tx = stripeTex(cv.k, 0);
  if (view === 'side') {
    const X = P.X, b = P.bob || 0;
    cv.part({ ol: 'line' });
    cv.poly([[X(-2.6), 20.2 + b], [X(2.4), 20.2 + b], [X(2.8), 22.2 + b], [X(-2.8), 22.2 + b]], M, { cx: 0.6, tex: tx });
    cv.part({ ol: 'line' });
    cv.poly([[X(1.6), 21.6 + b], [X(2.8), 21.8 + b], [X(3.4), 27.6 + b], [X(2.2), 27.8 + b]], M, { cx: 0.6, tex: tx });
    return;
  }
  cv.part({ ol: 'line' });
  cv.poly([[11.8, 20.0], [20.2, 20.0], [20.8, 21.4], [19.6, 22.6], [12.4, 22.6], [11.2, 21.4]], M, { cx: 0.8, tex: tx });
  const sw = P.f === 0 ? 0.2 : -0.2;
  cv.part({ ol: 'line' });
  cv.poly([[17.2, 21.8], [19.2, 21.8], [19.6 + sw, 28.4], [17.6 + sw, 28.6]], M, { cx: 0.6, tex: tx });
  // はしの ふさ
  cv.part({ ol: 'soft' });
  for (let i = 0; i < 3; i++) cv.stroke([[17.9 + sw + i * 0.6, 28.5], [17.9 + sw + i * 0.6, 29.4]], 0.18, M, { n: [0, 0] });
}
function scarfBack(cv, M) {
  cv.part({ ol: 'line' });
  cv.poly([[11.6, 20.0], [20.4, 20.0], [20.8, 21.6], [11.2, 21.6]], M, { cx: 0.8, tex: stripeTex(cv.k, 0) });
}

// せなかの ほうき（え は ななめ。さきに わらの ふさ）
function broom(cv, P, B, where) {
  let a, e, d;
  if (where === 'behind') { a = [22.6, 16.4]; e = [10.2, 36.4]; d = -1; }
  else if (where === 'back') { a = [9.4, 16.4]; e = [21.8, 36.2]; d = 1; }
  else {
    const X = P.X;
    a = [X(-1.6), 15.8]; e = [X(-5.2), 36.6]; d = -P.facing;
  }
  // え
  cv.part({ ol: 'line' });
  cv.cap(a[0], a[1], 0.42, e[0] + (a[0] - e[0]) * 0.18, e[1] + (a[1] - e[1]) * 0.18, 0.46, B.stick);
  // わらの ふさ（さきが ひろがる）
  const ux = (e[0] - a[0]), uy = (e[1] - a[1]), L = Math.hypot(ux, uy);
  const nx = -uy / L, ny = ux / L;
  const P0 = [e[0] - ux * 0.2, e[1] - uy * 0.2];
  cv.part({ ol: 'line' });
  cv.poly([[P0[0] + nx * 0.7, P0[1] + ny * 0.7], [e[0] + nx * 2.2, e[1] + ny * 2.2], [e[0] + ux * 0.04 + nx * 0.4, e[1] + uy * 0.04 + ny * 0.4], [e[0] - nx * 2.2, e[1] - ny * 2.2], [P0[0] - nx * 0.7, P0[1] - ny * 0.7]], B.straw, { cx: 0.6 });
  const sid = cv.cur;
  for (const t of [-1.2, 0, 1.2]) cv.crease([[P0[0] + nx * t * 0.4, P0[1] + ny * t * 0.4], [e[0] + nx * t, e[1] + ny * t]], 0.14, -0.45, { parts: [sid] });
  // ふさを しばる 銀の わ
  cv.part({ ol: 'soft' });
  cv.cap(P0[0] - ux * 0.01, P0[1] - uy * 0.01, 0.75, P0[0] + ux * 0.03, P0[1] + uy * 0.03, 0.8, B.band, { cap: false });
  void d;
}

// ───────────── かお ─────────────
// phase: 'face'（かみの まえ）/ 'top'（かみの あと）/ 'over'（ぼうしの あと）
export function face33(cv, H, B, view, phase) {
  if (!B.r33 || view === 'back') return;
  // 目もとの 白い 仮面は 目の あと・かみの まえ（前がみが 上に かかる）
  if (phase === 'face' && B.mask33) dominoMask(cv, H, view);
  if (phase !== 'top') return;
  if (B.glasses33) roundGlasses(cv, H, view);
  if (B.monocle33) monocle(cv, H, view, B.monocle33 === 'clover');
  if (B.bolt33) boltScar(cv, H, view);
}
// ドットの わ（x, y: ドット  r: はんけい ドット）
function ringPx(cv, x, y, r, col) {
  const n = Math.max(12, Math.round(r * 8));
  const seen = new Set();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const px = Math.round(x + Math.cos(a) * r), py = Math.round(y + Math.sin(a) * r);
    const key = px * 1000 + py;
    if (seen.has(key)) continue;
    seen.add(key);
    cv.px(px, py, col);
  }
}
// 目もとの 白い 仮面（ドミノマスク。タキシード仮面ふう）
// 目の まわりを 白く ぬり、目（もう かいて ある いろ そのままの ドット）は のこす。ふちは こい 線、下の ふちは かげ。
// かおの パーツ（目の まんなかの パーツ）の 上だけに かく。よこむきは てまえの 目と、うしろへ はねる はし
function dominoMask(cv, H, view) {
  const k = cv.k, res = cv.res;
  const ey = cv.Y(H.y + EYE_V);
  const sc = Math.abs(cv.tx(H.x + 10) - cv.tx(H.x)) * k / 10; // あたまの 1マスが 何ドットか
  const side = view === 'side';
  const eyes = side ? [cv.X(H.X(H.rx - 2.2))] : [-1, 1].map((s) => cv.X(H.x + s * 2.95));
  const face = cv.partAt(eyes[0], ey);
  if (!face) return;
  // 目の ドットの はんい（この 中の いろ そのままの ドットは 目）
  const ehw = res >= 8 ? 4.5 : 2.5, ehh = res >= 8 ? 4.5 : 3.0;
  const isEye = (x, y) => eyes.some((ex) => Math.abs(x - ex) <= ehw && Math.abs(y - ey) <= ehh) && cv.fix[y * cv.w + x] !== -1;
  // 仮面の かたち（u: 目から そとへ、v: 目の たかさから 下へ。マス）
  const lens = (u, v) => (u / 2.55) ** 2 + ((v + 0.15) / (v < 0 ? 1.75 : 1.5)) ** 2 <= 1;
  // そとの はしは 上に はねる
  const wing = (u, v) => u > 1.0 && u < 4.3 && v > -1.4 - (u - 1.0) * 0.55 && v < 0.5 - (u - 1.0) * 0.62;
  const inMask = (x, y) => {
    const v = (y - ey) / sc;
    if (side) {
      const back = (x - eyes[0]) / sc * -H.facing; // うしろ（みみの ほう）が プラス
      return lens(back, v) || wing(back, v);
    }
    const mid = (eyes[0] + eyes[1]) / 2;
    const a = Math.abs(x - mid) / sc;
    // はなの 上の つなぎ
    if (a < 1.6 && v > -1.0 && v < 0.1) return true;
    const u = a - 2.95;
    return lens(u, v) || wing(u, v);
  };
  const x0 = Math.min(...eyes) - Math.ceil(7 * sc), x1 = Math.max(...eyes) + Math.ceil(7 * sc);
  const y0 = ey - Math.ceil(3 * sc), y1 = ey + Math.ceil(3 * sc);
  // いろは ふやさない（白と りんかくの いろ）
  const W = '#ffffff', L = '#1b1330';
  cv.part({ ol: 'none', cast: false });
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (!inMask(x, y) || cv.partAt(x, y) !== face || isEye(x, y)) continue;
      const edge = !inMask(x - 1, y) || !inMask(x + 1, y) || !inMask(x, y - 1) || !inMask(x, y + 1);
      cv.px(x, y, edge ? L : W);
    }
  }
}

// まるめがね（くろい ほそい ふち）
function roundGlasses(cv, H, view) {
  cv.part({ ol: 'none', cast: false });
  const c = '#22202c', g = '#e0f0ff';
  const k = cv.k, y = cv.Y(H.y + EYE_V);
  const r = Math.max(2, Math.round(1.75 * k));
  if (view === 'side') {
    const x = cv.X(H.X(H.rx - 2.3));
    ringPx(cv, x, y, r, c);
    cv.line(x - r * H.facing, y - 1, cv.X(H.X(-1.0)), y - 1, c);
    return;
  }
  for (const s of [-1, 1]) {
    const x = cv.X(H.x + s * 2.95);
    ringPx(cv, x, y, r, c);
    if (k >= 4) cv.px(x - r + 2, y - r + 2, g);
  }
  const xl = cv.X(H.x - 2.95) + r, xr = cv.X(H.x + 2.95) - r;
  cv.line(xl, y - 1, xr, y - 1, c);
  for (const s of [-1, 1]) cv.line(cv.X(H.x + s * 2.95) + s * r, y - 1, cv.X(H.x + s * 6.6), y - 2, c);
}
// 片めがね（がめんの みぎの 目。金の わと たれる くさり。clover: さきに クローバーの かざり）
function monocle(cv, H, view, clover) {
  cv.part({ ol: 'none', cast: false });
  const c = '#c8961e', hi = '#fff2b0', g = '#d8f0ff';
  const k = cv.k, y = cv.Y(H.y + EYE_V);
  const x = view === 'side' ? cv.X(H.X(H.rx - 2.3)) : cv.X(H.x + 2.95);
  const r = Math.max(2, Math.round(1.9 * k));
  ringPx(cv, x, y, r, c);
  cv.px(x - Math.round(r * 0.6), y - Math.round(r * 0.6), hi);
  if (k >= 4) { cv.px(x - r + 2, y - 1, g); cv.px(x - r + 3, y - 2, g); }
  // くさり（目の したから みみの ほうへ たれる）
  const dir = view === 'side' ? -H.facing : 1;
  const x1 = x + dir * Math.round(1.6 * k), y1 = y + Math.round(4.2 * k);
  cv.line(x + dir * Math.round(r * 0.7), y + Math.round(r * 0.7), x1, y1, c);
  if (clover) {
    // 4まいの はの クローバー（緑）
    const cc = '#2a9a4a', cd = '#1a6a32';
    if (k >= 4) cv.stamp(x1 - 2, y1, ['.C.C.', 'CCdCC', '.CdC.', '..d..'], { C: cc, d: cd });
    else cv.stamp(x1 - 1, y1, ['C.C', '.d.'], { C: cc, d: cd });
  }
}
// ひたいの いなずまの きず（がめんの ひだりの まゆの 上）
function boltScar(cv, H, view) {
  if (view === 'side' && H.facing > 0) return;
  cv.part({ ol: 'none', cast: false });
  const c = '#b8404a';
  const x = view === 'side' ? cv.X(H.X(H.rx - 3.4)) : cv.X(H.x - 1.6);
  const y = cv.Y(H.y - 2.4);
  if (cv.k >= 4) cv.stamp(x - 2, y - 3, ['...K', '..K.', '.KKK', '..K.', '.K..', 'K...'], { K: c });
  else cv.stamp(x - 1, y - 1, ['.K', 'KK', 'K.'], { K: c });
}

// ───────────── ぼうし ─────────────
const TS = (H, pts) => pts.map(([u, v]) => [H.X(u), H.y + v]);
function hpoly(cv, H, pts, m, o = {}) {
  cv.poly(TS(H, pts), m, { n: 'sphere', sph: [H.X(o.su ?? -1.2), H.y + (o.sv ?? -3.0), (H.rx + 1.4) * 1.15, (H.ry + 1.4) * 1.15], cx: 0.95 });
}
export function drawHat33(cv, P, H, G, view) {
  const side = view === 'side', back = view === 'back';
  switch (G.kind) {
    case 'silk33': {
      // シルクハット（ひろい つば・たかい つつ・つつの したに おび）
      const m = cl(G.c, { light: G.c === '#1c1a26' ? 1.3 : 1 });
      const band = cl(G.band);
      // つば
      cv.part({ ol: 'line' });
      if (side) hpoly(cv, H, [[9.0, -3.6], [9.4, -2.6], [-8.8, -2.4], [-8.6, -3.4]], m, { su: 0.4 });
      else hpoly(cv, H, [[-9.6, -3.4], [9.6, -3.4], [10.0, -2.4], [6.0, -1.9], [0, -1.7], [-6.0, -1.9], [-10.0, -2.4]], m);
      // つつ（すこし うえが ひろい）
      cv.part({ ol: 'line' });
      if (side) hpoly(cv, H, [[4.6, -3.2], [5.2, -13.2], [-5.6, -13.2], [-5.0, -3.2]], m, { su: 0.4 });
      else hpoly(cv, H, [[-5.4, -3.2], [-6.0, -13.4], [6.0, -13.4], [5.4, -3.2]], m);
      const id = cv.cur;
      // おび
      cv.part({ ol: 'none', clip: id });
      if (side) cv.poly(TS(H, [[5.4, -5.6], [5.4, -3.2], [-5.8, -3.2], [-5.8, -5.6]]), band, { cx: 0.6 });
      else cv.poly(TS(H, [[-6.0, -5.8], [6.0, -5.8], [6.0, -3.2], [-6.0, -3.2]]), band, { cx: 0.8 });
      // つやと うえの ふち
      cv.crease(TS(H, side ? [[2.6, -12.6], [2.4, -6.4]] : [[-3.0, -12.8], [-2.8, -6.4]]), 0.3, 0.55, { parts: [id] });
      if (!back) cv.crease(TS(H, side ? [[-5.4, -13.0], [5.0, -13.0]] : [[-5.8, -13.1], [5.8, -13.1]]), 0.22, -0.4, { parts: [id] });
      return true;
    }
    case 'tiara33': {
      // ティアラ（ひたいの 金・銀の わ と、まん中に V の かたちの かざりと 石）
      const m = mt(G.mk || GOLD);
      cv.part({ ol: 'line' });
      if (side) cv.poly(TS(H, [[6.8, -3.4], [6.6, -2.4], [-7.4, -2.0], [-7.4, -2.9]]), m, { n: 'bevel', bw: 0.3 });
      else cv.poly(TS(H, [[-7.9, -3.0], [-4.0, -3.4], [0, -3.6], [4.0, -3.4], [7.9, -3.0], [8.0, -2.1], [4.0, -2.4], [0, -2.6], [-4.0, -2.4], [-8.0, -2.1]]), m, { n: 'bevel', bw: 0.3 });
      if (back) return true;
      const gu = side ? 5.6 : 0;
      cv.part({ ol: 'line' });
      if (side) cv.poly(TS(H, [[gu - 1.0, -3.2], [gu, -5.4], [gu + 0.8, -3.2]]), m, { n: 'bevel', bw: 0.3 });
      else cv.poly(TS(H, [[-2.6, -3.4], [-1.4, -5.2], [0, -6.4], [1.4, -5.2], [2.6, -3.4], [0, -2.4]]), m, { n: 'bevel', bw: 0.4 });
      cv.part({ ol: 'line' });
      cv.ell(H.X(gu), H.y - 4.2, side ? 0.55 : 0.85, G.moon ? 1.05 : 0.85, gemM(G.gemc), { bulge: 0.9 });
      return true;
    }
  }
  return false;
}

// ───────────── もちもの（たての ない 手） ─────────────
export function drawProp33(cv, P, A, O) {
  const kind = O.body?.prop;
  if (!kind || !kind.endsWith('33')) return false;
  const [hx, hy] = A.hand;
  const d = P.side ? P.facing : A.s || 1;
  switch (kind) {
    case 'stick33': {
      // 手品の ステッキ（黒い ぼうで りょうはしが 白）
      // からだの 外がわへ たおして もつ（黒い 服に かさならない ように）
      const t0 = [hx - d * 0.9, hy + 2.8], t1 = [hx + d * 2.6, hy - 5.0];
      const L = (t) => [t0[0] + (t1[0] - t0[0]) * t, t0[1] + (t1[1] - t0[1]) * t];
      cv.part({ ol: 'line' });
      cv.cap(...t0, 0.45, ...t1, 0.45, mat({ r: ['#141220', '#34304a', '#6a6688', '#b4b0d0'], th: TH.metal, spec: 0.95 }));
      const id = cv.cur;
      cv.part({ ol: 'none', clip: id });
      cv.cap(...L(0.86), 0.55, ...L(1.05), 0.55, white(), { cap: false });
      cv.part({ ol: 'none', clip: id });
      cv.cap(...L(-0.05), 0.55, ...L(0.12), 0.55, white(), { cap: false });
      return true;
    }
    case 'notice33': {
      // 予告状（白い カードに 赤い 字の しるし）
      const cx = hx + d * 0.9, cy = hy - 1.6;
      cv.part({ ol: 'line' });
      cv.poly([[cx - 1.5, cy - 1.1], [cx + 1.5, cy - 1.3], [cx + 1.6, cy + 1.0], [cx - 1.4, cy + 1.2]], white(), { n: 'bevel', bw: 0.25 });
      const id = cv.cur;
      cv.part({ ol: 'none', clip: id });
      cv.stroke([[cx - 0.9, cy - 0.4], [cx + 0.9, cy - 0.6]], 0.18, cl('#c8202c'), { n: [0, 0] });
      cv.stroke([[cx - 0.9, cy + 0.4], [cx + 0.5, cy + 0.2]], 0.16, cl('#2a2a3a'), { n: [0, 0] });
      return true;
    }
    case 'cardgun33': {
      // トランプ銃（白い つつと にぎり。つつの 先から トランプが 1まい 見える）
      const m = white();
      cv.part({ ol: 'line' });
      cv.cap(hx - d * 0.1, hy - 0.6, 0.55, hx + d * 0.3, hy + 1.4, 0.5, m);
      cv.part({ ol: 'line' });
      cv.cap(hx - d * 0.6, hy - 1.4, 0.75, hx + d * 2.8, hy - 1.6, 0.7, m);
      cv.part({ ol: 'soft' });
      cv.cap(hx + d * 0.4, hy - 1.5, 0.78, hx + d * 1.0, hy - 1.5, 0.78, cl('#2a4ab0'), { cap: false });
      // トランプ（赤い しるし）
      const cx = hx + d * 3.6, cy = hy - 1.9;
      cv.part({ ol: 'line' });
      cv.poly([[cx - 0.7, cy - 1.0], [cx + 0.7, cy - 1.1], [cx + 0.8, cy + 0.9], [cx - 0.6, cy + 1.0]], white(), { n: 'bevel', bw: 0.2 });
      cv.part({ ol: 'none', cast: false });
      cv.px(cv.X(cx), cv.Y(cy), '#d0202c');
      return true;
    }
    case 'wand33': {
      // つえ（細い 木の つえ。先が すこし 光る）
      cv.part({ ol: 'line' });
      cv.cap(hx - d * 0.2, hy + 0.8, 0.36, hx + d * 2.2, hy - 4.2, 0.22, wood());
      cv.part({ ol: 'none', cast: false });
      cv.px(cv.X(hx + d * 2.4), cv.Y(hy - 4.6), '#fffbe0');
      if (cv.k >= 4) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) cv.px(cv.X(hx + d * 2.4) + dx, cv.Y(hy - 4.6) + dy, '#ffe680');
      return true;
    }
    case 'book33': {
      // 出席ぼ（こんの 表紙の いた。白い 名前の らん）
      const cx = hx + d * 0.6, cy = hy - 1.4;
      cv.part({ ol: 'line' });
      cv.poly([[cx - 1.4, cy - 2.2], [cx + 1.5, cy - 2.4], [cx + 1.6, cy + 1.8], [cx - 1.3, cy + 2.0]], cl('#24346e'), { n: 'bevel', bw: 0.3 });
      const id = cv.cur;
      cv.part({ ol: 'none', clip: id });
      cv.rect(cx - 0.8, cy - 1.4, 1.6, 0.9, white(), { n: [0, 0] });
      cv.part({ ol: 'none', clip: id });
      cv.stroke([[cx - 1.4, cy + 1.0], [cx + 1.6, cy + 0.8]], 0.16, cl('#c8b070'), { n: [0, 0] });
      return true;
    }
    case 'watch33': {
      // 銀時計（ふたに しるし・くさりが 手から たれる）
      const cx = hx + d * 0.6, cy = hy - 1.3;
      cv.part({ ol: 'line' });
      cv.ell(cx, cy, 1.35, 1.35, mt(SILVER), { bulge: 0.95 });
      const id = cv.cur;
      cv.crease([[cx - 0.6, cy - 0.2], [cx, cy - 0.7], [cx + 0.6, cy - 0.2], [cx, cy + 0.5], [cx - 0.6, cy - 0.2]], 0.12, -0.6, { parts: [id] });
      cv.part({ ol: 'soft' });
      cv.ell(cx, cy - 1.5, 0.45, 0.35, mt(SILVER), { bulge: 0.9 });
      cv.part({ ol: 'none' });
      cv.stroke([[hx - d * 0.2, hy + 0.4], [hx - d * 0.4, hy + 1.8], [hx + d * 0.2, hy + 2.6]], 0.16, mt(SILVER), { n: [0, -0.3] });
      return true;
    }
    case 'rose33': {
      // 赤い バラ（みどりの くきと は。セーラームーンの 男の子は バラが 光る）
      const green = cl('#2e8a3a');
      const top = [hx + d * 1.3, hy - 4.6];
      cv.part({ ol: 'line' });
      cv.cap(hx - d * 0.2, hy + 1.2, 0.26, top[0], top[1] + 0.6, 0.24, green);
      cv.part({ ol: 'line' });
      cv.poly([[hx + d * 0.5, hy - 1.6], [hx + d * 1.9, hy - 2.6], [hx + d * 1.5, hy - 1.4]], green, { cx: 0.6 });
      const glow = !!O.body.roseGlow33;
      // バラの 赤は マントの うらと おなじ いろ（いろを ふやさない）
      const red = cl(O.body.rose33 || '#c8182c', { light: 1.05 });
      cv.part({ ol: 'line' });
      cv.ell(top[0], top[1], 1.25, 1.1, red, { bulge: 0.9 });
      const id = cv.cur;
      cv.crease([[top[0] - 0.6, top[1] + 0.1], [top[0], top[1] - 0.4], [top[0] + 0.5, top[1] + 0.2]], 0.14, -0.55, { parts: [id] });
      // がくの みどり
      cv.part({ ol: 'soft' });
      cv.poly([[top[0] - 0.7, top[1] + 0.8], [top[0] + 0.7, top[1] + 0.8], [top[0], top[1] + 1.4]], green, { cx: 0.6 });
      if (glow) {
        // 光の つぶ（バラの まわりに 白）
        cv.part({ ol: 'none', cast: false });
        const X = cv.X(top[0]), Y = cv.Y(top[1]), r = Math.max(3, Math.round(1.9 * cv.k));
        cv.px(X, Y - r, '#ffffff');
        cv.px(X + r, Y - 1, '#ffffff');
        cv.px(X - r, Y + 1, '#ffffff');
        if (cv.k >= 4) {
          for (const [dx, dy] of [[0, -r - 1], [1, -r], [-1, -r], [0, -r + 1]]) cv.px(X + dx, Y + dy, '#ffffff');
          cv.px(X + r - 1, Y + r - 1, '#ffffff');
        }
      }
      return true;
    }
    case 'moonstick33': {
      // 月の ステッキ（白い え・赤い 石と 金の 三日月の あたま）
      cv.part({ ol: 'line' });
      cv.cap(hx - d * 0.1, hy + 1.4, 0.32, hx + d * 0.9, hy - 3.6, 0.32, white());
      const id0 = cv.cur;
      cv.part({ ol: 'none', clip: id0 });
      cv.cap(hx + d * 0.5, hy - 1.6, 0.4, hx + d * 0.6, hy - 2.0, 0.4, cl('#ff7ab8'), { cap: false });
      const cx = hx + d * 1.1, cy = hy - 4.8;
      // 金の 三日月（まるから すこし ずらした まるを ぬく かわりに、ふちを ふとく かく）
      cv.part({ ol: 'line' });
      cv.ell(cx, cy, 1.5, 1.5, mt(GOLD), { bulge: 0.9 });
      cv.part({ ol: 'line' });
      cv.ell(cx, cy - 0.1, 0.85, 0.85, gemM('#e8203a'), { bulge: 0.9 });
      return true;
    }
  }
  return false;
}

// ───────────── 手ぶくろの れん金の 円（hero.js の 手の あと） ─────────────
export function handMark33(cv, A, P, O) {
  if (!O.handMark) return;
  // うしろむきの 手は 手の ひらが 見えないので かかない（よこむきは てまえの 手だけ）
  if (P.back || (P.side && !A.near)) return;
  cv.part({ ol: 'none', cast: false });
  const x = cv.X(A.hand[0]), y = cv.Y(A.hand[1]);
  const c = O.handMark;
  if (cv.k >= 4) {
    cv.stamp(x - 2, y - 2, ['.ccc.', 'c.c.c', 'cc.cc', 'c...c', '.ccc.'], { c });
  } else {
    cv.stamp(x - 1, y - 1, ['cc', 'cc'], { c });
  }
}

// ───────────── 第33回の ぶき（hero-gear.js の WEAPON_LOOK の shape 'wand33'。kind33 で かわる） ─────────────
// F: ぶきの むきの ざひょう（a: 手から 先へ、b: よこ）。仮の 品の id（A の データ）: magic_wand・chalk・pointer_stick・elder_wand
export const R33_WEAPON_LOOK = {
  magic_wand: { shape: 'wand33', kind33: 'stick', len: 10.4 },
  chalk: { shape: 'wand33', kind33: 'chalk', len: 5.2 },
  pointer_stick: { shape: 'wand33', kind33: 'pointer', len: 13.2 },
  elder_wand: { shape: 'wand33', kind33: 'elder', len: 10.8 },
  // ティアラ（なげる ぶき。手に もつ 金の わと 赤い 石）
  tiara_boomerang: { shape: 'wand33', kind33: 'tiara', len: 4.2 },
  // はがねの 機械の うで（ツメの かたちで、はがねの いろ）
  automail_arm: { shape: 'claw', mk: 'steel' },
};
export function drawWand33(cv, F, W) {
  const L = W.len || 10;
  switch (W.kind33) {
    case 'chalk': {
      // チョーク（白い みじかい ぼう。先が すこし 丸い）
      cv.part({ ol: 'line' });
      cv.poly(F.P([[-1.4, -0.75], [L - 0.6, -0.75], [L, 0], [L - 0.6, 0.75], [-1.4, 0.75]]), mat({ r: ['#a8a49a', '#e2ded2', '#f8f6ee', '#ffffff'], th: TH.matte }), { n: 'row', cx: 0.7 });
      return;
    }
    case 'pointer': {
      // 指し棒（のびる 銀の ぼう・先に 赤い 玉）
      cv.part({ ol: 'line' });
      cv.poly(F.P([[-2.2, -0.55], [L * 0.5, -0.45], [L - 0.6, -0.3], [L - 0.6, 0.3], [L * 0.5, 0.45], [-2.2, 0.55]]), mt(SILVER), { n: 'row', cx: 0.7 });
      cv.part({ ol: 'line' });
      cv.ell(...F.T(L, 0), 0.7, 0.7, cl('#d0202c', { light: 1.2 }), { bulge: 0.9 });
      cv.part({ ol: 'line' });
      cv.poly(F.P([[-2.6, -0.8], [0.6, -0.8], [0.6, 0.8], [-2.6, 0.8]]), cl('#2a2a36'), { n: 'row', cx: 0.7 });
      return;
    }
    case 'tiara': {
      // ティアラ（手の 先に 金の わ。まん中に 赤い 石）
      const [cx, cy] = F.T(L * 0.55, 0);
      cv.part({ ol: 'line' });
      cv.ell(cx, cy - 1.6, 2.1, 1.3, mt(GOLD), { bulge: 0.8 });
      const id = cv.cur;
      cv.part({ ol: 'none', clip: id });
      cv.ell(cx, cy - 1.4, 1.3, 0.6, mt(['#3a2208', '#6a4210', '#9c6a1a', '#c8962e']), { n: [0, 0.3] });
      cv.part({ ol: 'line' });
      cv.ell(cx, cy - 2.8, 0.6, 0.7, gemM('#e8203a'), { bulge: 0.9 });
      return;
    }
    case 'elder': {
      // ふしの ある 灰色の 木の つえ
      const m = mat({ r: ['#2e2a30', '#5a5458', '#8a8488', '#c4beba'], th: TH.matte });
      cv.part({ ol: 'line' });
      cv.poly(F.P([[-2.4, -0.7], [L - 1.0, -0.4], [L, 0], [L - 1.0, 0.4], [-2.4, 0.7]]), m, { n: 'row', cx: 0.7 });
      for (const a of [L * 0.3, L * 0.55, L * 0.78]) { cv.part({ ol: 'soft' }); cv.ell(...F.T(a, 0), 0.62, 0.62, m, { bulge: 0.8 }); }
      return;
    }
    default: {
      // 手品の ステッキ（黒い ぼうで りょうはしが 白）
      cv.part({ ol: 'line' });
      cv.poly(F.P([[-2.6, -0.62], [L, -0.62], [L, 0.62], [-2.6, 0.62]]), mat({ r: ['#141220', '#34304a', '#6a6688', '#b4b0d0'], th: TH.metal, spec: 0.95 }), { n: 'row', cx: 0.7 });
      const id = cv.cur;
      cv.part({ ol: 'none', clip: id });
      cv.poly(F.P([[L - 1.8, -0.7], [L, -0.7], [L, 0.7], [L - 1.8, 0.7]]), white(), { n: 'row', cx: 0.6 });
      cv.part({ ol: 'none', clip: id });
      cv.poly(F.P([[-2.6, -0.7], [-1.2, -0.7], [-1.2, 0.7], [-2.6, 0.7]]), white(), { n: 'row', cx: 0.6 });
    }
  }
}
// 仮の 品の id（A の データ）の よろい・ぼうしの 見た目
export const R33_ARMOR_LOOK = {
  school_robe: { kind: 'robe', main: '#1c1a26', trim: '#3c3a4c', r33: true, tie33: ['#2a3e86', '#c4c8d6'] },
  kid_mantle: { kind: 'suit', main: '#f4f4f8', tie: '#d0202c', shirt: '#3a62c8', pants: '#eceef6', r33: true, cape: '#f8f8fc', capeIn: '#d8deec', capeLen: 36.4, drape: true, gloves: true },
  nekketsu_jersey: { kind: 'jersey', main: '#c8202c', tee: '#f2f2f6' },
  // とうめいマント（ぎんいろに すける 旅の マント）
  invisible_cloak: { kind: 'travel', main: '#4a5068', cloak: '#c4ccdc' },
};
export const R33_HEAD_LOOK = {
  silk_hat: { kind: 'silk33', c: '#1c1a26', band: '#c41a2a', hides: 'top' },
};
