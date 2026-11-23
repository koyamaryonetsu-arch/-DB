// 第3部 第1章 第2幕「鉱山の底の先」の しくみ「明かりを 広げる 探検」（A: 世界と 物語）の 計算だけ（サーバー・画面・テストが 同じ 物を 使う）
// ※ ネタバレ注意（docs/plan-part3.md の 10-2）
// ・大地の下（c9b_under）は 暗い 世界地図。見えるのは スピカの 光の まわり C9B_SPICA_LIGHT マス（自分と 家族）
// ・水晶の 柱 6本: 星の音さを 鳴らすと ともる（フラグ c9_pillar1〜6。セーブする）。ともった 柱の まわり C9B_PILLAR_RADIUS マスは ずっと 明るい
// ・光る こけの 原: ふむと 光る（第1幕の 光の輪の 計算 maps/c9a-light.js を そのまま 使う。map.c9a の mossSteps = 40。みなもとに つなぐ きまりは なし）
// ・村の 小さな 明かり（いつも）・村の 明かりの 台（大王に 勝つと 大きく 光る）
// ・「行った 所」の 記録は 取らない: 地図（小さな 地図も）は 明るさ ＝ 柱の フラグで かく（litByFlags）
// ほかの ファイルを ほとんど 読まない（maps・world・client・test の どこからでも 読める）
import { C9B, C9B_PILLARS, C9B_PILLAR_RADIUS, C9B_SPICA_LIGHT } from './c9b-flags.js?v=b3f22aad5877';
import { UNDER_POS, UNDER_W, UNDER_H } from './c9b-rows.js?v=b3f22aad5877';

export const LIGHT_SPICA9B = C9B_SPICA_LIGHT; // スピカの 光（4マス）
export const LIGHT_PILLAR9B = C9B_PILLAR_RADIUS; // ともった 柱（9マス）
export const LIGHT_LAMP9B = 2.5; // 村の 小さな 明かり
export const LIGHT_LUMP9B = 11; // もどった 村の 明かり（大王に 勝った あと）
export const LIGHT_LUMP_DIM9B = 2; // 光る こけが ない 村の 明かりの 台（かすかに）
export const LIGHT_PILLAR_DIM9B = 1.2; // まだ ともって いない 柱（かすかに 見える。目じるし）

// 村の 小さな こけの 明かり（いつも 光って いる。村は 少しずつ 暗く なって いる）
export const LAMPS9B = [{ x: 34, y: 30 }, { x: 46, y: 35 }, { x: 38, y: 41 }, { x: 45, y: 44 }, { x: 41, y: 27 }];

// ともった 柱の 数（0〜6）。画面へ 出す 状態 pillarStage（F班の 曲が もりあがる）
export const pillarStage = (has) => C9B_PILLARS.filter((f) => has(f)).length;
export const pillarLit = (has, i) => has(C9B_PILLARS[i]);

// 光の まん中と はんい（[x, y, r, しゅるい]）。has … 世界の フラグ（パーティーなら リーダー）
//   しゅるい: 'pillar'（ともった 柱）・'dim'（まだ ともって いない 柱）・'lamp'（村の 小さな 明かり）・'lump'（村の 明かり）
export function underCenters(has) {
  const out = [];
  UNDER_POS.pillars.forEach((p, i) => out.push([p.x, p.y, pillarLit(has, i) ? LIGHT_PILLAR9B : LIGHT_PILLAR_DIM9B, pillarLit(has, i) ? 'pillar' : 'dim']));
  for (const p of LAMPS9B) out.push([p.x, p.y, LIGHT_LAMP9B, 'lamp']);
  const L = UNDER_POS.lump;
  out.push([L.x, L.y, has(C9B.king) ? LIGHT_LUMP9B : LIGHT_LUMP_DIM9B, 'lump']);
  return out;
}

// 円の 中の マス
function fillCircle(out, w, h, cx, cy, r) {
  const R = Math.ceil(r);
  for (let y = cy - R; y <= cy + R; y++) for (let x = cx - R; x <= cx + R; x++) {
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) out.add(y * w + x);
  }
}

// 明るい マス（柱・村の 明かり。こけと 人の 光は 入れない）。key が 同じなら 前の 物（柱の フラグ・大王）
const cache = new Map();
export function flagKey9b(has) {
  let k = 0;
  C9B_PILLARS.forEach((f, i) => { if (has(f)) k |= 1 << i; });
  if (has(C9B.king)) k |= 1 << 6;
  return k;
}
export function litByFlags(has, kinds = null) {
  const key = `${flagKey9b(has)}|${kinds ? kinds.join(',') : '*'}`;
  let s = cache.get(key);
  if (s) return s;
  s = new Set();
  for (const [x, y, r, kind] of underCenters(has)) if (!kinds || kinds.includes(kind)) fillCircle(s, UNDER_W, UNDER_H, x, y, r);
  if (cache.size > 300) cache.clear();
  cache.set(key, s);
  return s;
}
// 魔物の ための「明るい 所」（ともった 柱と もどった 村の 明かり）。ふつうの 魔物は ここだけ・大ミミズは ここに 入らない
export const brightCells9b = (has) => litByFlags(has, ['pillar', 'lump']);
// 地図（小さな 地図も）に かく マス（ともった 柱・村の 明かり・村の 小さな 明かり。「行った 所」の 記録の かわり）
export const mapCells9b = (has) => litByFlags(has);
