// 第29回の 新しい 職業 4つの みため（るろうに剣士 → 人斬りばっ刀さい → ひ村ばっ刀さい → 飛天御剣流けい承者）
// hero-outfit.js（服・からだ）・hero-r26.js（つけたし・かお）・hero.js（かみの いろ）・chars.js（古い 小さな え）から よばれる。
// どの え も「それと わかる、でも そのまま うつさない」ゲームの ドットえ。
//  ・4つとも: 長い 赤毛を 後ろで しばる（hero-hair.js の 'rurouni'）・ほおに 十字の きず・こしに 刀
//  ・るろうに剣士: 赤い 着物に 白い はかま（目は やさしい むらさき）
//  ・人斬りばっ刀さい: 暗い こんいろの 着物と はいいろの はかま（目は するどい 金色）
//  ・ひ村ばっ刀さい: こい 赤（えんじ）の 着物に はいいろの はかま。落ち着いた かんじ
//  ・飛天御剣流けい承者: 赤い 着物に 白い はかま、白い マント（うらは 赤）を はおり、かたあて つき
//
//   R29_OUTFIT … 布の服の ときの 服（hero-outfit.js の JOB_OUTFIT に まぜる）
//   R29_BODY   … よろいを かえても のこる からだの とくちょう（かみがた・かみの いろ・目の いろ・十字の きず）
//   R29_HAIR   … かみの いろ（hero.js の JOB_HAIR_RAMP に まぜる）
//   R29_OLD_LOOK … 古い 小さな え（chars.js の JOB_LOOK に まぜる）
//   outfit29(O, S) … マントの うら・かたあて・かみの ひも（hero-r26.js の outfit26 の つけたしから よぶ）
//   drawR29(cv, P, O, layer) … マントの まえの はし・かたあて（hero-r26.js の drawR26 から よぶ）
//   face29(cv, H, B, view, phase) … ほおの 十字の きず（hero-r26.js の face26 から よぶ）
import { mat, ramp, TH } from './hero-raster.js?v=345c127ce483';
import { EYE_V } from './hero-face.js?v=345c127ce483';

const cl = (c, o = {}) => mat({ r: ramp(c, 4, o), th: o.th || TH.cloth });

// ───────────── 服（布の服 の とき） ─────────────
// hakama: はかま（hero-outfit.js の 'hakama'）。sheath は hero-r26.js の こしの 刀。r29: この ファイルの つけたし
export const R29_OUTFIT = {
  rurouni: { kind: 'hakama', main: '#c8304a', hakama: '#ebe5d8', sheath: '#3a2a22', r29: true },
  hitokiri: { kind: 'hakama', main: '#2c3048', hakama: '#4c4856', sheath: '#16121a', r29: true },
  himura: { kind: 'hakama', main: '#9a1c2e', hakama: '#7c7684', sheath: '#2a1a1a', r29: true },
  // 白い マント（うらは 赤）・かたあて
  hiten: { kind: 'hakama', main: '#c42a3a', hakama: '#ece8e0', sheath: '#3a2a22', r29: true, cape: '#f2f0ea', capeLen: 36.4, capeIn: '#b01c2c', mantle29: true },
};
// からだの とくちょう（よろいを きても のこる）。cross: ほおの 十字の きず
export const R29_BODY = {
  rurouni: { hair: 'rurouni', hcol: 'rurouni', iris: '#7a5ab0', cross: true },
  hitokiri: { hair: 'rurouni', hcol: 'rurouni', iris: '#d89a20', cross: true },
  himura: { hair: 'rurouni', hcol: 'rurouni', iris: '#6a4a9a', cross: true },
  hiten: { hair: 'rurouni', hcol: 'rurouni', iris: '#8a5ab8', cross: true },
};
// かみの いろ: あざやかな 赤
export const R29_HAIR = {
  rurouni: ['#3e0a10', '#7a1620', '#b02a2c', '#dc4a3a', '#ff9070'],
};
// 古い 小さな え（chars.js。32×42）
export const R29_OLD_LOOK = {
  rurouni: { outfit: 'hakama', cloth: '#c8304a', hakama: '#ebe5d8' },
  hitokiri: { outfit: 'hakama', cloth: '#2c3048', hakama: '#4c4856' },
  himura: { outfit: 'hakama', cloth: '#9a1c2e', hakama: '#7c7684' },
  hiten: { outfit: 'hakama', cloth: '#c42a3a', hakama: '#ece8e0', cape: '#f2f0ea' },
};

// ───────────── 服の つけたし（outfit26 の あとで） ─────────────
export function outfit29(O, S) {
  if (!S.r29) return;
  // かみを しばる ひもは こげ茶の ひも
  O.tie = '#4a2a1e';
  if (S.mantle29 && O.cape) {
    O.cape.inner = cl(S.capeIn, { light: 1.05 });
    O.mantle29 = { m: O.cape.m, inner: O.cape.inner, pad: mat({ r: ['#8e8ca6', '#cac8da', '#f2f2f8', '#ffffff'], th: TH.cloth, spec: 0.97 }) };
  }
}

// ───────────── マントの まえの はしと かたあて ─────────────
// layer は hero.js の じゅんばん（drawR26 と おなじ）
export function drawR29(cv, P, O, layer) {
  const M = O.mantle29;
  if (!M) return;
  const sw = P.f === 0 ? 1 : -1;
  if (!P.side && !P.back && layer === 'neck') {
    // まえむき: かたから 下へ ひらいた マント（うでの 上に かかる。手は あとで かく）
    for (const s of [-1, 1]) {
      const x = (u) => 16 + s * u;
      cv.part({ ol: 'line' });
      cv.poly([[x(3.4), 20.6], [x(6.0), 20.4], [x(7.6), 23.0], [x(8.0), 28.0], [x(8.4 + 0.3 * sw * s), 33.4], [x(5.0), 33.6], [x(4.4), 28.4], [x(4.0), 23.6]], M.m, { cx: 0.8, cy: 0.2 });
      const id = cv.cur;
      // うらの 赤が すそと はしに 見える
      cv.part({ ol: 'none', clip: id, cast: false });
      cv.poly([[x(3.4), 20.6], [x(4.4), 20.6], [x(4.9), 28.4], [x(5.6), 33.8], [x(4.6), 33.8], [x(4.2), 28.4], [x(3.8), 23.6]], M.inner, { cx: 0.5 });
      cv.crease([[x(6.4), 24.0], [x(6.8), 32.6]], 0.26, -0.42, { parts: [id] });
      pad(cv, x(6.2), 21.4, M.pad);
    }
    return;
  }
  if (P.back && layer === 'backTop') {
    for (const s of [-1, 1]) pad(cv, 16 + s * 5.6, 21.3, M.pad);
    return;
  }
  if (P.side && layer === 'neck') {
    const X = P.X, b = P.bob || 0;
    cv.part({ ol: 'line' });
    cv.poly([[X(1.6), 20.6 + b], [X(-2.8), 20.8 + b], [X(-4.2), 26.0 + b], [X(-4.6), 31.6], [X(-1.2), 31.8], [X(0.8), 26.0 + b]], M.m, { cx: 0.8, cy: 0.2 });
    const id = cv.cur;
    cv.crease([[X(-1.6), 23.0 + b], [X(-2.4), 31.0]], 0.26, -0.42, { parts: [id] });
    pad(cv, X(-0.6), 21.6 + b, M.pad);
  }
}
// かたあて（まるく ふくらんだ 白い ぬの）
function pad(cv, x, y, m) {
  cv.part({ ol: 'line' });
  cv.ell(x, y, 2.5, 1.5, m, { bulge: 0.85 });
}

// ───────────── ほおの 十字の きず（ひだりの ほお = まえから 見て みぎ） ─────────────
export function face29(cv, H, B, view, phase) {
  if (!B.cross || phase !== 'face') return;
  if (!(view === 'front' || (view === 'side' && H.facing < 0))) return;
  cv.part({ ol: 'none', cast: false });
  const c = '#b04850', d = '#7a2a32';
  const sx = view === 'front' ? cv.X(H.X(3.2)) : cv.X(H.X(H.rx - 2.6));
  const sy = cv.Y(H.y + EYE_V + 2.3);
  const big = cv.res >= 8;
  // ながい ななめ（みぎ上 → ひだり下）と、それに 十字に まじわる みじかい ななめ
  const L = big ? 3 : 1, S = big ? 2 : 1;
  for (let i = -L; i <= L; i++) cv.px(sx + i, sy - i, c);
  for (let i = -S; i <= S; i++) if (i) cv.px(sx + i, sy + i, d);
  if (big) cv.px(sx, sy, d);
}
