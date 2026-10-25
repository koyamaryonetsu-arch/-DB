// 第40回の 新しい 伝説の 職業 2つの みため（服・からだ・かお・もちもの）
// hero-outfit.js（服・からだ）・hero-r26.js（服の つけたし・かお・もちもの）・hero.js（かみの いろ・手）・chars.js（古い 小さな え）・
// hero-r33.js（男の子の すがた masc33）から よばれる。
// どの え も「それと わかる、でも そのまま うつさない」ゲームの ドットえ（ロゴや 顔は かかない）。
//
//  竜魔人                     … こい あお緑の 竜の うろこの よろい（とげの ある かたあて）・金の ふち・こい 赤の 長い マント・
//                                金の 竜の 目・ひたいと 両手の 竜の紋章（金と 赤）・水色に 光る 竜闘気の オーラ（hero-aura.js の ryuma）
//  ネオ・クイーン・セレニティ … 足もとまでの 白い ドレス（うすい むらさきの ふち）・銀色の 長い ツインテールと おだんご・
//                                ひたいの 金の 三日月・せなかの 小さな 白い はね・銀水しょうの ついた 長い つえ
//  キング・エンディミオン（男の子の ネオ・クイーン・セレニティ）… 銀と 黒の よろい・金の ふち・黒い 長い マント・光る 赤い バラ・ひたいの 金の 三日月
//
//   R40_JOBS     … 職業の id（データの 人との やくそく。docs/plan-r40-jobs.md）
//   R40_OUTFIT   … 布の服の ときの 服（hero-outfit.js の JOB_OUTFIT に まぜる）
//   R40_BODY     … よろいを かえても のこる からだの とくちょう（JOB_BODY に まぜる）
//   R40_HAIR     … かみの いろ（hero.js の JOB_HAIR_RAMP に まぜる）
//   R40_OLD_LOOK … 古い 小さな え（chars.js の JOB_LOOK に まぜる）
//   R40_MASC     … 男の子の ネオ・クイーン・セレニティ（キング・エンディミオン。hero-r33.js の masc33 が この 表も 見る）
//   outfit40(O, S, Lk, fem) … 服の つけたし（outfit26 の つけたしから よぶ。足もとまでの ドレス・とげの かたあて）
//   body40(O, JB)           … からだの つけたし（hero-outfit.js の outfitOf から よぶ。白い はね・両手の 紋章）
//   face40(cv, H, B, view, phase) … ひたいの 竜の紋章・三日月（face26 から よぶ）
//   drawProp40(cv, P, A, O) … たての ない 手の もちもの（drawProp26 から よぶ。銀水しょうの つえ。かいたら true）
//   handMark40(cv, A, P, O) … 手の こうの 竜の紋章（hero.js の 手の あとで よぶ）
import { mat, ramp, TH } from './hero-raster.js?v=f6a4d212e9b8';

export const R40_JOBS = ['ryumajin', 'neo_queen'];

// ───────────── ざいしつ ─────────────
const cl = (c, o = {}) => mat({ r: ramp(c, 4, o), th: o.th || TH.cloth });
const mt = (r) => mat({ r, th: TH.metal, spec: 0.958, sc: '#ffffff' });
const GOLD = ['#5a3210', '#9c5e1a', '#d69a2e', '#f6d26c', '#fff6cc'];
// 銀水しょう（すきとおった 白と うすい むらさき）
const crystalM = () => mat({ r: ['#6a64a8', '#a8a4dc', '#dcdcf6', '#f6f6ff', '#ffffff'], th: TH.gem, spec: 0.88, sc: '#ffffff' });
// 白い はね
const featherM = () => mat({ r: ['#8a86aa', '#c4c2dc', '#e8e8f4', '#fafaff', '#ffffff'], th: TH.hair, spec: 0.965, sc: '#ffffff' });

// ───────────── 職業ごとの 服（布の服 の とき） ─────────────
// r40: この ファイルの つけたしを つかう  gown40: 足もとまでの ドレス  spike40: かたあてに 竜の とげ
export const R40_OUTFIT = {
  ryumajin: { kind: 'plate', metal: 'ryuma', under: '#22305a', trim: 'gold', cape: '#7a1428', capeLen: 38.6, big: true, rank: 6, r40: true, spike40: true },
  neo_queen: { kind: 'dress', main: '#fbfaff', trim: '#d8ccf6', r40: true, gown40: true },
};

// からだの とくちょう（よろいを きても のこる）
// crest40: ひたいの 竜の紋章  handCrest40: 両手の 竜の紋章の いろ  crescent40: ひたいの 金の 三日月  wings40: 小さな 白い はね
// prop: もちもの（drawProp40。'scepter40' … 銀水しょうの つえ）
export const R40_BODY = {
  ryumajin: { aura: 'ryuma', iris: '#f2c430', crest40: true, handCrest40: '#ffd84a', r40: true },
  neo_queen: { hair: 'moon33', hcol: 'r40silver', iris: '#7a6ad8', crescent40: true, wings40: true, prop: 'scepter40', r40: true },
};
// かみの いろ（ネオ・クイーン・セレニティ: 銀色に うすい むらさき）
export const R40_HAIR = {
  r40silver: ['#5a5684', '#9692c0', '#cac6e6', '#ecebf8', '#ffffff'],
};
// 古い 小さな え（chars.js。32×42）
export const R40_OLD_LOOK = {
  ryumajin: { outfit: 'armor', cloth: '#2e5e6e', cape: '#7a1428' },
  neo_queen: { outfit: 'dress', cloth: '#fbfaff', hat: 'tiara', hatColor: '#f2c14e' },
};

// ───────────── 男の子の ネオ・クイーン・セレニティ（キング・エンディミオン） ─────────────
// 男性（look.body が 1 で ない）の ときだけ、上の 表の かわりに つかう（hero-r33.js の masc33。女の子は 上の まま）
//  銀と 黒の よろい・金の ふち・黒い 長い マント・光る 赤い バラ（hero-r33.js の rose33）・ひたいの 金の 三日月。ぼうしは なし
export const R40_MASC = {
  neo_queen: {
    outfit: { kind: 'plate', metal: 'silver', under: '#22202e', trim: 'gold', cape: '#17151f', capeLen: 39.0, big: true, rank: 6 },
    body: { crescent40: true, r40: true, prop: 'rose33', rose33: '#ec2a40', roseGlow33: true, r33: true },
    hat: null,
    old: { outfit: 'armor', cloth: '#b6bed2', cape: '#17151f', rose: 'glow' },
  },
};

// ───────────── 服の つけたし（outfit26 の つけたしから） ─────────────
export function outfit40(O, S) {
  if (!S.r40) return;
  if (S.gown40) {
    // 足もとまでの 白い ドレス（すそは 広がる）・金の むねの かざり
    O.skirt = { ...O.skirt, y0: 28.4, y1: 39.4, flare: 3.8, kind: 'frill' };
    if (O.torso) O.torso = { ...O.torso, bow: mt(GOLD) };
    O.boots = { m: cl('#f6f4ff'), h: 0.4, cuff: cl(S.trim || '#d8ccf6') };
  }
  // 竜の うろこの かたあてに とげ
  if (S.spike40 && O.pauldron) O.pauldron = { ...O.pauldron, spike: true };
}

// ───────────── からだの つけたし（outfitOf から） ─────────────
export function body40(O, JB) {
  if (!JB?.r40) return;
  if (JB.wings40) O.wings = { m: featherM() };
  if (JB.handCrest40) O.handCrest40 = JB.handCrest40;
}

// ───────────── かお（face26 から。ひたいの しるし） ─────────────
export function face40(cv, H, B, view, phase) {
  if (!B.r40 || view === 'back' || phase !== 'top') return;
  if (B.crest40) foreheadMark(cv, H, view, 'crest');
  if (B.crescent40) foreheadMark(cv, H, view, 'moon');
}
// ひたいの まん中（前がみの 上に かく）
function foreheadMark(cv, H, view, kind) {
  const x = view === 'side' ? cv.X(H.X(H.rx - 2.6)) : cv.X(H.x);
  const y = cv.Y(H.y - 2.6);
  cv.part({ ol: 'none', cast: false });
  if (kind === 'crest') {
    // 竜の紋章（金の つばさと 赤い まん中）
    const C = { K: '#ffd84a', R: '#e8203a', D: '#8a4a10' };
    if (cv.k >= 4) cv.stamp(x - 4, y - 4, ['K.......K', 'KK..K..KK', '.KK.K.KK.', '..KKRKK..', '...KRK...', '....K....', '...D.D...'], C);
    else cv.stamp(x - 1, y - 1, ['K.K', '.R.', '.K.'], C);
  } else {
    // 金の 三日月（つのが 上）
    const C = { K: '#f6d26c', D: '#b47a1a' };
    if (cv.k >= 4) cv.stamp(x - 2, y - 2, ['K...K', 'K...K', 'DK.KD', '.KKK.'], C);
    else cv.stamp(x - 1, y - 1, ['K.K', '.K.'], C);
  }
}

// ───────────── もちもの（drawProp26 から） ─────────────
export function drawProp40(cv, P, A, O) {
  if (O.body?.prop !== 'scepter40') return false;
  const [hx, hy] = A.hand;
  const d = P.side ? P.facing : A.s || 1;
  // 銀水しょうの つえ（白い 長い え・金の 三日月・まん中に 大きな 銀水しょう）
  cv.part({ ol: 'line' });
  cv.cap(hx - d * 0.3, hy + 4.0, 0.36, hx + d * 1.0, hy - 5.6, 0.36, mt(GOLD));
  const id0 = cv.cur;
  cv.part({ ol: 'none', clip: id0 });
  cv.cap(hx + d * 0.5, hy - 2.2, 0.44, hx + d * 0.6, hy - 2.8, 0.44, cl('#ff9ac8'), { cap: false });
  const cx = hx + d * 1.2, cy = hy - 7.0;
  cv.part({ ol: 'line' });
  cv.ell(cx, cy + 0.5, 1.9, 1.3, mt(GOLD), { bulge: 0.9 });
  cv.part({ ol: 'line' });
  cv.poly([[cx, cy - 2.2], [cx + 1.25, cy - 0.4], [cx, cy + 1.2], [cx - 1.25, cy - 0.4]], crystalM(), { cx: 0.5, cy: 0.3 });
  return true;
}

// ───────────── 両手の 竜の紋章（hero.js の 手の あと） ─────────────
export function handMark40(cv, A, P, O) {
  if (!O.handCrest40) return;
  // うしろむきでも 手の こうは 見える。よこむきは てまえの 手だけ
  if (P.side && !A.near) return;
  cv.part({ ol: 'none', cast: false });
  const x = cv.X(A.hand[0]), y = cv.Y(A.hand[1]);
  const C = { c: O.handCrest40, r: '#e8203a' };
  if (cv.k >= 4) cv.stamp(x - 2, y - 2, ['c.c.c', 'ccrcc', '.crc.', '..c..'], C);
  else cv.stamp(x - 1, y, ['crc'], C);
}
