// 第82回 A班: 犬夜叉の 系統 4つの 職業の みため（docs/plan-r82-jobs-a.md）
// 「それと わかる、でも そのまま うつさない」ゲームの ドットえ。今 ある 服の 形（hakama）・こしの 刀（sheath）・マント・オーラを 使い、
// 足りない 部品（長い 銀の かみと 犬の 耳・首の 数珠）だけ 足す
//  ・4つとも: 長い 銀色の かみに 頭の 上の 犬の 耳（hero-hair.js の 'inu82'）・金色の 目・赤い 着物と はかま・首に 黒い 玉と 白い きばの 数珠
//  ・半ようの少年       … 明るい 赤の 着物と はかま（刀は もたない。つめで 戦う）
//  ・鉄さいがの使い手   … 赤い 着物と はかま・こしに 古い 刀（鉄さいが）
//  ・犬夜しゃ           … こい 赤の 着物と はかま・こしに 鉄さいが
//  ・ばくりゅうはの大よう … えんじの 着物と はかま・白い 毛皮の マント・黒と 赤の ようきの オーラ
//
//   R82A_JOBS     … 職業の id
//   R82A_OUTFIT   … 布の服の ときの 服（hero-outfit.js の JOB_OUTFIT に まぜる）
//   R82A_BODY     … よろいを かえても のこる からだの とくちょう（JOB_BODY に まぜる）
//   R82A_HAIR     … かみの いろ（hero.js の JOB_HAIR_RAMP に まぜる）
//   R82A_OLD_LOOK … 古い 小さな え（chars.js の JOB_LOOK に まぜる）
//   outfit82(O, S)          … 服の つけたし（hero-r26.js の outfit26 から。数珠）
//   drawR82(cv, P, O, layer) … 首の 数珠（hero-r26.js の drawR26 から）
import { mat, ramp, TH } from './hero-raster.js';

export const R82A_JOBS = ['hanyo_boy', 'tessaiga_user', 'inuyasha', 'bakuryuha'];

// ───────────── 服（布の服 の とき） ─────────────
// hakama: はかま（hero-outfit.js の 'hakama'）。sheath は hero-r26.js の こしの 刀。r82: この ファイルの つけたし（beads82: 数珠）
export const R82A_OUTFIT = {
  hanyo_boy: { kind: 'hakama', main: '#d8323e', hakama: '#c42a36', r82: true, beads82: true },
  tessaiga_user: { kind: 'hakama', main: '#c42030', hakama: '#a81c2a', sheath: '#6a5a44', r82: true, beads82: true },
  inuyasha: { kind: 'hakama', main: '#d0202c', hakama: '#b01826', sheath: '#2a1a14', r82: true, beads82: true },
  bakuryuha: { kind: 'hakama', main: '#a8142a', hakama: '#7a1020', sheath: '#1a1014', r82: true, beads82: true, cape: '#f2efe6', capeLen: 34.6 },
};
// からだの とくちょう（よろいを きても のこる）
export const R82A_BODY = {
  hanyo_boy: { hair: 'inu82', hcol: 'inugin', iris: '#e8b020' },
  tessaiga_user: { hair: 'inu82', hcol: 'inugin', iris: '#e8b020' },
  inuyasha: { hair: 'inu82', hcol: 'inugin', iris: '#f0b818' },
  bakuryuha: { hair: 'inu82', hcol: 'inugin', iris: '#e83a3a', aura: 'blackred' },
};
// かみの いろ: 銀色（少し あおみの ある 白）
export const R82A_HAIR = {
  inugin: ['#6e6c88', '#a8a8be', '#d6d6e4', '#f2f2f8', '#ffffff'],
};
// 古い 小さな え（chars.js。32×42）
export const R82A_OLD_LOOK = {
  hanyo_boy: { outfit: 'hakama', cloth: '#d8323e', hakama: '#c42a36' },
  tessaiga_user: { outfit: 'hakama', cloth: '#c42030', hakama: '#a81c2a' },
  inuyasha: { outfit: 'hakama', cloth: '#d0202c', hakama: '#b01826' },
  bakuryuha: { outfit: 'hakama', cloth: '#a8142a', hakama: '#7a1020', cape: '#f2efe6' },
};

// ───────────── 服の つけたし（outfit26 の あとで） ─────────────
const bead = mat({ r: ['#120c1a', '#2a2036', '#4a3c5c', '#8a7aa0', '#e0d8f0'], th: TH.metal, spec: 0.95, sc: '#ffffff' });
const fang = mat({ r: ramp('#f4f0e2', 4, { light: 1.1 }), th: TH.cloth, spec: 0.9, sc: '#ffffff' });
export function outfit82(O, S) {
  if (!S.r82) return;
  O.r82 = { beads: S.beads82 ? { bead, fang } : null };
}

// ───────────── 首の 数珠（黒い 玉が ならび、ところどころ 白い きば） ─────────────
export function drawR82(cv, P, O, layer) {
  const R = O.r82;
  if (!R?.beads || layer !== 'neck' || P.back) return;
  const B = R.beads;
  const pts = [];
  if (P.side) {
    const X = P.X, b = P.bob || 0;
    for (let i = 0; i <= 5; i++) {
      const u = i / 5;
      pts.push([X(-0.8 + u * 3.6), 21.0 + Math.sin(u * Math.PI * 0.9) * 2.8 + b, i === 3]);
    }
  } else {
    for (let i = 0; i <= 8; i++) {
      const u = i / 8;
      pts.push([12.4 + u * 7.2, 21.0 + Math.sin(u * Math.PI) * 3.8, i === 2 || i === 4 || i === 6]);
    }
  }
  for (const [x, y, isFang] of pts) {
    cv.part({ ol: 'line' });
    if (isFang) cv.ell(x, y + 0.3, 0.5, 0.85, B.fang, { bulge: 0.85 });
    else cv.ell(x, y, 0.62, 0.62, B.bead, { bulge: 0.9 });
  }
}
