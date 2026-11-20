// 第86回 A班: 幻の職業 2つの みため（docs/plan-r86-phantom-a.md・docs/plan-r79-phantom-looks.md と おなじ 考え方）
// 「きわめた 2つの 職業が 合わさった、いちばん 上の すがた」。もとの 2つの 衣装の とくちょうを どちらも 入れ、伝説の 衣装より 1だん ごうか。
// 今 ある 服の 形・ぼうし・オーラを 組み合わせ、足りない 部品（竜神の剣士の 左右で 色の ちがう こて）だけ ここで 足す。
//
//  人とようかいのかけ橋 … 犬夜しゃの 赤い 着物と はかま・じゅず・白い かみ（その 人の かみの 形の まま 色だけ ではなく、犬夜しゃと おなじ 長い 白い かみ）・
//                          先生の 黒い 手ぶくろ（左手。おにの手の 赤い すじ）・前に ひらいた 白い マント（銀の かたかざり・うらは 赤）・白と 赤の オーラ
//  竜神の剣士           … 青い よろい（ロトの 青と 金）に 赤い 下ぎ・右うでは 赤い 炎の こて、左うでは 青い 雷の こて・
//                          赤い マント（うらは 青・金の かたかざり）・金の サークレット・左半分 青い 雷／右半分 赤い 炎の オーラ
// 男の子も 女の子も おなじ 服
//
//   R86A_JOBS     … 職業の id
//   R86A_OUTFIT   … 布の服の ときの 服（hero-outfit.js の JOB_OUTFIT に まぜる）
//   R86A_BODY     … よろいを かえても のこる からだの とくちょう（JOB_BODY に まぜる。kote86 … 左右の こて）
//   R86A_HAT      … 布の服の ときの ぼうし（hero-gear.js の JOB_HAT に まぜる）
//   R86A_OLD_LOOK … 古い 小さな え（chars.js の JOB_LOOK に まぜる）
//   AURA86A       … オーラ（hero-aura.js の AURA に まぜる。cols2 は みぎ半分の 色）
//   koteMark86(cv, A, P, O) … 左右の こて（hero.js の 手の あと）
import { mat, TH } from './hero-raster.js?v=d61110f93b38';

export const R86A_JOBS = ['yokai_bridge', 'ryujin_kenshi'];

// r79: 第79回の つけたし（capeIn … マントの うら、pad79 … まえに ひらいた マントと かたかざり）を つかう
export const R86A_OUTFIT = {
  yokai_bridge: { kind: 'hakama', main: '#d0202c', hakama: '#a8142a', sheath: '#2a1a14', r82: true, beads82: true, cape: '#f8f6f0', capeIn: '#d0202c', capeLen: 36.6, r79: true, pad79: 'silver' },
  ryujin_kenshi: { kind: 'plate', metal: 'royal', under: '#c8201c', trim: 'gold', cape: '#c8201c', capeIn: '#2a62d6', capeLen: 37.6, big: true, rank: 7, gemc: '#ffd04a', r79: true, pad79: 'gold' },
};

// からだの とくちょう（よろいを きても のこる）
export const R86A_BODY = {
  yokai_bridge: { hair: 'inu82', hcol: 'inugin', iris: '#f0b818', hand83: 'oni', aura: 'kizuna86' },
  ryujin_kenshi: { hair: 'spiky', iris: '#2a6ae8', spark: true, kote86: true, aura: 'raien86' },
};

// ぼうし（かけ橋は かみを 見せる）
export const R86A_HAT = {
  ryujin_kenshi: { kind: 'circlet', mk: 'gold', gemc: '#3a8aff' },
};

// 古い 小さな え（chars.js。32×42）
export const R86A_OLD_LOOK = {
  yokai_bridge: { outfit: 'hakama', cloth: '#d0202c', hakama: '#a8142a', cape: '#f8f6f0' },
  ryujin_kenshi: { outfit: 'armor', cloth: '#2c62d6', cape: '#c8201c', hat: 'crown', hatColor: '#f2c14e' },
};

// オーラ
export const AURA86A = {
  // 人とようかいのかけ橋: 白い ようかいの 光に 赤い おにの 光（cols2 は みぎ半分）
  kizuna86: { glow: 0.5, len: 3.0, wid: 1.1, up: 1.15, gap: 2.2, cols: [['#ffffff', 215], ['#f4f0f8', 186], ['#d8d0e8', 150], ['#a8a0c0', 112]], cols2: [['#fff0f0', 205], ['#ffa098', 176], ['#e8403a', 144], ['#a8141a', 108]] },
  // 竜神の剣士: 左半分 青い 雷・右半分 赤い 炎
  raien86: { glow: 0.6, len: 3.5, wid: 1.2, up: 1.15, gap: 2.0, cols: [['#f0f8ff', 215], ['#8ac0ff', 186], ['#3a7ae8', 152], ['#1a3aa8', 116]], cols2: [['#fff0a0', 215], ['#ffb040', 186], ['#ff6a1c', 152], ['#c8201c', 116]] },
};

// ───────────── 左右の こて（hero.js の 手の あと） ─────────────
// 右うで ＝ 赤い 炎の こて（火竜）、左うで ＝ 青い 雷の こて（雷の 玉）
const RED = mat({ r: ['#3a0a08', '#8a1a12', '#d0301c', '#ff7a4a', '#ffd0b0'], th: TH.metal, spec: 0.958, sc: '#ffffff' });
const BLUE = mat({ r: ['#0a1440', '#1a3a9c', '#2c62d6', '#72a6f6', '#e2f0ff'], th: TH.metal, spec: 0.958, sc: '#ffffff' });
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export function koteMark86(cv, A, P, O) {
  if (!O.body?.kote86 || !A.el || !A.wr) return;
  const m = A.right ? RED : BLUE;
  const r2 = (P.fem ? 1.15 : 1.3) * 1.3;
  cv.part({ ol: 'soft' });
  cv.cap(...lerp(A.el, A.wr, 0.25), r2, A.wr[0], A.wr[1], r2 * 1.06, m, { n: [0, -0.1] });
  cv.part({ ol: 'soft' });
  const r = (P.fem ? 1.22 : 1.38) * 1.05;
  cv.ell(A.hand[0], A.hand[1], r, r * 1.05, m, { bulge: 0.85 });
  // 炎（右）・いなずま（左）の しるし
  cv.part({ ol: 'none', cast: false });
  const [mx, my] = lerp(A.el, A.wr, 0.6);
  const x = cv.X(mx), y = cv.Y(my);
  if (A.right) {
    cv.px(x, y, '#ffd04a');
    cv.px(x, y - 1, '#ff8a3a');
    if (cv.k >= 4) { cv.px(x - 1, y, '#ff8a3a'); cv.px(x + 1, y - 1, '#ffd04a'); }
  } else {
    cv.px(x, y - 1, '#fff080');
    cv.px(x + 1, y, '#fff080');
    if (cv.k >= 4) { cv.px(x, y + 1, '#fff6b0'); cv.px(x - 1, y - 2, '#fff6b0'); }
  }
}
