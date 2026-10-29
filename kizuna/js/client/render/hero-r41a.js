// 第41回 A の 新しい 伝説の 職業 2つの みため（服・からだ・ぼうし・もちもの）
// hero-outfit.js（服・からだ）・hero-r26.js（服の つけたし・むねの かざり・もちもの）・hero-gear.js（ぼうし）・chars.js（古い 小さな え）・
// hero-aura.js（殿堂入りの 金の オーラ hof）から よばれる。
// どの え も「それと わかる、でも そのまま うつさない」ゲームの ドットえ（ロゴや 顔は かかない）。
//
//  京急の社長       … こんの スーツに 赤い ベストと ネクタイ・金の えりの バッジ・白い 手ぶくろ・金の 時計の くさり・
//                     赤い マント・金の おびの ぼうし・手に 赤い 電車（白い 線）の もけい
//  野球界の殿堂入り … 金の ふちの 白い ユニフォーム・金の ぼうし・首から 金の メダル・手に 白い ボール・
//                     きらきら ひかる 金の オーラ（hero-aura.js の hof）
//
//   R41A_JOBS     … 職業の id（データの 人との やくそく。docs/plan-r41-jobs-a.md）
//   R41A_OUTFIT   … 布の服の ときの 服（hero-outfit.js の JOB_OUTFIT に まぜる）
//   R41A_BODY     … よろいを かえても のこる からだの とくちょう（JOB_BODY に まぜる）
//   R41A_HAT      … 布の服の ときの ぼうし（hero-gear.js の JOB_HAT に まぜる）
//   R41A_OLD_LOOK … 古い 小さな え（chars.js の JOB_LOOK に まぜる）
//   outfit41a(O, S)            … 服の つけたし（outfit26 の つけたしから よぶ。白い 手ぶくろ・メダル・時計の くさり）
//   drawR41a(cv, P, O, layer)  … むねの かざり（drawR26 から よぶ。メダル・時計の くさり）
//   drawProp41a(cv, P, A, O)   … たての ない 手の もちもの（drawProp26 から よぶ。電車の もけい・ボール。かいたら true）
import { mat, ramp, TH } from './hero-raster.js?v=a8edacfcfd44';

export const R41A_JOBS = ['keikyu_president', 'hall_of_fame'];

// ───────────── ざいしつ ─────────────
const cl = (c, o = {}) => mat({ r: ramp(c, 4, o), th: o.th || TH.cloth });
const mt = (r) => mat({ r, th: TH.metal, spec: 0.958, sc: '#ffffff' });
const GOLD = ['#5a3210', '#9c5e1a', '#d69a2e', '#f6d26c', '#fff6cc'];
// 赤い 電車（つやの ある 赤）
const redM = () => mat({ r: ['#5a0a10', '#9a1420', '#d8202c', '#f25a5a', '#ffd0d0'], th: TH.metal, spec: 0.94, sc: '#ffffff' });
// 白い ボール
const ballM = () => mat({ r: ['#8a8a96', '#c8c8d2', '#eeeef4', '#ffffff'], th: TH.cloth });

// ───────────── 職業ごとの 服（布の服 の とき） ─────────────
// r41a: この ファイルの つけたしを つかう  glove41a: 手ぶくろの いろ  chain41a: 金の 時計の くさり  medal41a: 首から 金の メダル（リボンの いろ）
export const R41A_OUTFIT = {
  keikyu_president: { kind: 'suit', main: '#1a2142', tie: '#d8202c', vest: '#d8202c', pin: true, cape: '#c8141e', capeLen: 35.6, r41a: true, glove41a: '#f6f6fa', chain41a: true },
  hall_of_fame: { kind: 'baseball', main: '#fbf8ee', trim: '#d6a02e', r41a: true, medal41a: '#c8202c' },
};

// からだの とくちょう（よろいを きても のこる）
// prop: もちもの（drawProp41a。'train41a' … 赤い 電車の もけい  'ball41a' … 白い ボール）  aura: 'hof' … 金の きらきら
export const R41A_BODY = {
  keikyu_president: { prop: 'train41a', r41a: true },
  hall_of_fame: { aura: 'hof', prop: 'ball41a', r41a: true },
};
// ぼうし（京急の社長: こんに 金の おび〈はちまきの いろ なし＝金〉・殿堂入り: 金の 野球ぼう）
export const R41A_HAT = {
  keikyu_president: { kind: 'conductor', c: '#1a2142', hides: 'top' },
  hall_of_fame: { kind: 'bbcap', c: '#d6a02e', hides: 'top' },
};
// 古い 小さな え（chars.js。32×42）
export const R41A_OLD_LOOK = {
  keikyu_president: { outfit: 'suit', cloth: '#1a2142', tie: '#d8202c', cape: '#c8141e', hat: 'conductor', hatColor: '#d8202c' },
  hall_of_fame: { outfit: 'baseball', cloth: '#fbf8ee', trim: '#d6a02e', hat: 'bbcap', hatColor: '#d6a02e' },
};

// ───────────── 服の つけたし（outfit26 の つけたしから） ─────────────
export function outfit41a(O, S) {
  if (!S.r41a) return;
  if (S.glove41a) {
    O.glove = cl(S.glove41a);
    O.sleeve = { ...O.sleeve, cuff: cl('#f6f6fa') };
  }
  const R = {};
  if (S.chain41a) R.chain = mt(GOLD);
  if (S.medal41a) R.medal = { m: mt(GOLD), ribbon: cl(S.medal41a) };
  O.r41a = R;
}

// ───────────── むねの かざり（drawR26 から） ─────────────
export function drawR41a(cv, P, O, layer) {
  const R = O.r41a;
  if (!R || layer !== 'over' || P.back) return;
  const view = P.side ? 'side' : 'front';
  if (R.chain) watchChain(cv, P, R.chain, view);
  if (R.medal) medal(cv, P, R.medal, view);
}
// 金の 時計の くさり（ベストの ボタンから ポケットへ。はしに 小さな 時計）
function watchChain(cv, P, m, view) {
  cv.part({ ol: 'none' });
  if (view === 'side') {
    const X = P.X, b = P.bob || 0;
    cv.stroke([[X(2.0), 27.4 + b], [X(1.4), 28.8 + b], [X(0.4), 28.6 + b]], 0.22, m, { n: [0, -0.3] });
    return;
  }
  cv.stroke([[16.2, 27.0], [17.2, 28.6], [18.6, 28.9], [19.6, 28.2]], 0.22, m, { n: [0, -0.3] });
  cv.part({ ol: 'line' });
  cv.ell(19.8, 28.0, 0.62, 0.62, m, { bulge: 0.8 });
}
// 首から さげた 金の メダル（赤い リボン）
function medal(cv, P, M, view) {
  let x, y, tops;
  if (view === 'side') {
    const X = P.X, b = P.bob || 0;
    x = X(2.6); y = 26.2 + b; tops = [[X(0.6), 21.4 + b]];
  } else {
    x = 16; y = 26.0; tops = [[14.6, 21.4], [17.4, 21.4]];
  }
  cv.part({ ol: 'soft' });
  for (const [tx, ty] of tops) cv.stroke([[tx, ty], [x + (tx < x ? -0.3 : 0.3), y - 1.1]], 0.36, M.ribbon, { n: [0, 0] });
  cv.part({ ol: 'line' });
  cv.ell(x, y, 1.45, 1.45, M.m, { bulge: 0.85 });
  const id = cv.cur;
  const ring = [];
  for (let i = 0; i <= 16; i++) { const a = (i / 16) * Math.PI * 2; ring.push([x + Math.cos(a) * 0.95, y + Math.sin(a) * 0.95]); }
  cv.crease(ring, 0.14, -0.35, { parts: [id] });
  if (cv.k >= 4) {
    // まん中の 星
    cv.part({ ol: 'none', cast: false });
    const X = cv.X(x), Y = cv.Y(y);
    cv.stamp(X - 1, Y - 1, ['.W.', 'WWW', '.W.'], { W: '#fffbe0' });
  }
}

// ───────────── もちもの（drawProp26 から） ─────────────
export function drawProp41a(cv, P, A, O) {
  const kind = O.body?.prop;
  if (kind !== 'train41a' && kind !== 'ball41a') return false;
  const [hx, hy] = A.hand;
  const d = P.side ? P.facing : A.s || 1;
  if (kind === 'ball41a') {
    // 白い 野球の ボール（赤い ぬい目）
    const bx = hx + d * 0.7, by = hy - 2.3;
    cv.part({ ol: 'line' });
    cv.ell(bx, by, 1.2, 1.2, ballM(), { bulge: 0.9 });
    if (cv.k >= 4) {
      cv.part({ ol: 'none', cast: false });
      const X = cv.X(bx), Y = cv.Y(by);
      for (const [dx, dy] of [[-2, -2], [-2, 0], [-2, 2], [2, -2], [2, 0], [2, 2]]) cv.px(X + dx, Y + dy, '#d8202c');
    }
    return true;
  }
  // 赤い 電車の もけい（白い 線・まどと ライト）。手の 上に よこに もつ
  const x0 = hx - d * 2.4, x1 = hx + d * 2.6, y0 = hy - 4.6, y1 = hy - 1.4;
  cv.part({ ol: 'line' });
  cv.poly([[x0, y1], [x0, y0], [x1 - d * 0.9, y0], [x1, y0 + 1.0], [x1, y1]], redM(), { cx: 0.5, cy: 0.4 });
  const id = cv.cur;
  cv.part({ ol: 'none', clip: id });
  cv.stroke([[x0, y0 + 2.1], [x1, y0 + 2.1]], 0.36, cl('#f6f6fa'), { n: [0, 0] });
  if (cv.k >= 4) {
    cv.part({ ol: 'none', cast: false });
    // まど（こい あお）と ライト（きいろ）
    const wy = cv.Y(y0 + 0.9);
    for (const t of [0.2, 0.45, 0.7]) cv.px(cv.X(x0 + (x1 - x0) * t), wy, '#2a3a6a');
    cv.px(cv.X(x1 - d * 0.35), cv.Y(y1 - 0.45), '#ffe066');
  }
  return true;
}
