// 第83回 B班: ぬ〜べ〜の 系統 3つの 職業の みため（docs/plan-r83-jobs-b.md）
// 「それと わかる、でも そのまま うつさない」ゲームの ドットえ。今 ある 服の 形（suit）・名札（lanyard）・マント・オーラを 使い、
// 足りない 部品（左手だけの 手ぶくろ）だけ 足す。かみの 形と 色は その 人の まま（家族の 見た目を のこす）
//  ・小学校の先生         … オリーブ色の 上着に 黄色い ネクタイ・首から 名札（手ぶくろは まだ ない）
//  ・れい能力教師ぬ〜べ〜 … こい 灰色の 上着と ズボンに 赤い ネクタイ・左手だけ 黒い 手ぶくろ（おにの手を ふういん している）
//  ・おにの手のじごく先生 … 黒い 上着と ズボンに 赤い ネクタイ・えんじの マント・左手の 黒い 手ぶくろに 赤い すじ（おにの手が 目ざめかけている）・赤黒い オーラ
// 戦いで おにの手を 出すと、赤い おにの手の えんしゅつ（battlefx-r83b.js）と 仲間の まどの「おにの手+○%」の 札で 見せる
//
//   R83B_JOBS     … 職業の id
//   R83B_OUTFIT   … 布の服の ときの 服（hero-outfit.js の JOB_OUTFIT に まぜる）
//   R83B_BODY     … よろいを かえても のこる からだの とくちょう（JOB_BODY に まぜる。hand83 … 左手の 手ぶくろ）
//   R83B_OLD_LOOK … 古い 小さな え（chars.js の JOB_LOOK に まぜる）
//   handMark83(cv, A, P, O) … 左手の 手ぶくろ（hero.js の 手の あと）
import { mat, TH } from './hero-raster.js?v=a2a86317c288';

export const R83B_JOBS = ['elem_teacher', 'nube', 'jigoku_sensei'];

// ───────────── 服（布の服 の とき） ─────────────
export const R83B_OUTFIT = {
  elem_teacher: { kind: 'suit', main: '#7a8a5a', tie: '#e0a830', pants: '#4a4a58', lanyard: '#2a9a5a' },
  nube: { kind: 'suit', main: '#3a3644', tie: '#c8302a', pants: '#2e2a36' },
  jigoku_sensei: { kind: 'suit', main: '#24202c', tie: '#d8202a', pants: '#1e1a24', cape: '#6a1a2a', capeLen: 35.4 },
};
// からだの とくちょう（よろいを きても のこる）。hand83: 'black' … 黒い 手ぶくろ／'oni' … 赤い すじの 入った 黒い 手ぶくろ
export const R83B_BODY = {
  elem_teacher: { iris: '#4a3a2a' },
  nube: { iris: '#3a2a1a', hand83: 'black' },
  jigoku_sensei: { iris: '#c83a2a', hand83: 'oni', aura: 'blackred' },
};
// 古い 小さな え（chars.js。32×42）
export const R83B_OLD_LOOK = {
  elem_teacher: { outfit: 'suit', cloth: '#7a8a5a', tie: '#e0a830' },
  nube: { outfit: 'suit', cloth: '#3a3644', tie: '#c8302a' },
  jigoku_sensei: { outfit: 'suit', cloth: '#24202c', tie: '#d8202a', cape: '#6a1a2a' },
};

// ───────────── 左手の 手ぶくろ（hero.js の 手の あと。右手は はだの まま） ─────────────
const BLACK = mat({ r: ['#08080c', '#16141e', '#2a2834', '#4e4c5c'], th: TH.matte, spec: 0.96 });
export function handMark83(cv, A, P, O) {
  const kind = O.body?.hand83;
  if (!kind || A.right) return;
  const r = (P.fem ? 1.22 : 1.38) * (1 + ((O.armW || 1) - 1) * 0.4);
  cv.part({ ol: 'soft' });
  cv.ell(A.hand[0], A.hand[1], r * 1.04, r * 1.08, BLACK, { bulge: 0.85 });
  if (kind !== 'oni') return;
  // 赤い すじ（目ざめかけた おにの手）
  cv.part({ ol: 'none', cast: false });
  const x = cv.X(A.hand[0]), y = cv.Y(A.hand[1]);
  const n = cv.k >= 4 ? 2 : 1;
  for (let i = -n; i <= n; i++) cv.px(x + i, y - Math.abs(i), i === 0 ? '#ff6a4a' : '#d0201c');
}
