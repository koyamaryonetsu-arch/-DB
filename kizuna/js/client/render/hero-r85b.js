// 第85回 B班: 烈火の炎の 系統の みため（炎術士 → 八竜の炎術士・烈火。docs/plan-r85-jobs-b.md）
// 「それと わかる、でも そのまま うつさない」ゲームの ドットえ。今 ある 忍びの 服（'gi' の ninja）・オーラの 形の 色を かえて 使い、
// 足りない 部品（右うでの こて）だけ 足す。かみの 形と 色は その 人の まま（家族の 見た目を のこす）
//  ・炎術士               … 黒い 忍びの 服に 赤い ふち・赤い おび・右うでに 赤黒い こて
//  ・八竜の炎術士・烈火   … まっ黒な 忍びの 服に 朱色の ふち・竜の もよう・右うでの こてに 金の 竜の 印・炎の オーラ（赤から 黄色。'honoo85'）
// 忍者（こい あい色・ずきん）とは 色と ずきんで 見分けが つく。男の子も 女の子も おなじ 服
//
//   R85B_JOBS     … 職業の id
//   R85B_OUTFIT   … 布の服の ときの 服（hero-outfit.js の JOB_OUTFIT に まぜる）
//   R85B_BODY     … よろいを かえても のこる からだの とくちょう（JOB_BODY に まぜる。kote85 … 右うでの こて）
//   R85B_OLD_LOOK … 古い 小さな え（chars.js の JOB_LOOK に まぜる）
//   AURA85B       … 炎の オーラ（hero-aura.js の AURA に まぜる）
//   koteMark85(cv, A, P, O) … 右うでの こて（hero.js の 手の あと）
import { mat, TH } from './hero-raster.js?v=e3ea39586b77';

export const R85B_JOBS = ['enjutsushi', 'rekka'];

export const R85B_OUTFIT = {
  enjutsushi: { kind: 'gi', main: '#1e1c26', trim: '#d8301c', ninja: true },
  rekka: { kind: 'gi', main: '#121016', trim: '#f04a1c', ninja: true, dragon: true },
};

// からだの とくちょう（よろいを きても のこる）。kote85: 'red' … 赤黒い こて／'ryu' … 金の 竜の 印の ある こて
export const R85B_BODY = {
  enjutsushi: { iris: '#8a2a1a', kote85: 'red' },
  rekka: { iris: '#d8401c', kote85: 'ryu', aura: 'honoo85' },
};

// 古い 小さな え（chars.js。32×42）
export const R85B_OLD_LOOK = {
  enjutsushi: { outfit: 'gi', cloth: '#1e1c26', giTrim: '#d8301c' },
  rekka: { outfit: 'gi', cloth: '#121016', giTrim: '#f04a1c' },
};

// 炎の オーラ（赤から だいだい・黄色。ゆらめいて 上へ）
export const AURA85B = {
  honoo85: { glow: 0.55, len: 3.4, wid: 1.15, up: 1.25, gap: 2.0, flicker: 0.22, cols: [['#fff0a0', 210], ['#ffb040', 182], ['#ff6a1c', 150], ['#c8201c', 112]] },
};

// ───────────── 右うでの こて（hero.js の 手の あと。左うでは そのまま） ─────────────
const KOTE = mat({ r: ['#2a0c0c', '#5a1a14', '#8a2a1c', '#c8503a'], th: TH.matte, spec: 0.97, sc: '#ffb08a' });
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export function koteMark85(cv, A, P, O) {
  const kind = O.body?.kote85;
  if (!kind || !A.right || !A.el || !A.wr) return;
  const r2 = (P.fem ? 1.15 : 1.3) * 1.28;
  // ひじの 下から 手首まで（こて）・手の こう
  cv.part({ ol: 'soft' });
  cv.cap(...lerp(A.el, A.wr, 0.3), r2, A.wr[0], A.wr[1], r2 * 1.05, KOTE, { n: [0, -0.1] });
  cv.part({ ol: 'soft' });
  const r = (P.fem ? 1.22 : 1.38) * 1.04;
  cv.ell(A.hand[0], A.hand[1], r, r * 1.05, KOTE, { bulge: 0.85 });
  // 竜の 印（金の 小さな もよう。伝説）・炎の 線（炎術士）
  cv.part({ ol: 'none', cast: false });
  const [mx, my] = lerp(A.el, A.wr, 0.62);
  const x = cv.X(mx), y = cv.Y(my);
  if (kind === 'ryu') {
    const n = cv.k >= 4 ? 2 : 1;
    for (let i = -n; i <= n; i++) cv.px(x + i, y + (i % 2 ? -1 : 0), i === 0 ? '#fff4a0' : '#f2c14e');
    cv.px(x, y + 1, '#f2c14e');
  } else {
    cv.px(x, y, '#ff8a3a');
    if (cv.k >= 4) cv.px(x, y - 1, '#ffd04a');
  }
}
