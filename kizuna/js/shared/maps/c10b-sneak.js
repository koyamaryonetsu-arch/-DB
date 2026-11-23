// 第3部 第2章 第2幕「青と白」（第95回 A班）の こっそりの きまり（サーバー world/c10b-steps.js と 画面 client/c10b-view.js で 同じ 計算）
// ※ ネタバレ注意（docs/plan-part3-c10b.md の 14-2）
// ・見はりの フクロウは、その 人が 4歩 歩く ごとに 向きを かえる（dirs の じゅん）
// ・見て いる マス … 前の 3マス（1つ目は 1マス・2つ目と 3つ目は 3マスの 扇）。かべ・柱が あると その うしろは 見えない
// ・雪の 山の 中・すべる 氷の 上は 見つからない
// ・ease の だんの 見はりは、その 階で 3回 見つかる ごとに 1ぴき いなく なる
// ほかの しくみ（world・台本）を 読まない
import { effectiveTile } from './index.js?v=b3f22aad5877';
import { T, TILE_INFO } from '../tiles.js?v=b3f22aad5877';
import { C10B_OWL_TURN_STEPS, C10B_OWL_RANGE, C10B_CAUGHT_EASE } from './c10b-flags.js?v=b3f22aad5877';

const DV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
// 見はりの 向き（steps … その 人の 歩数）
export const owlDir10b = (owl, steps) => owl.dirs[Math.floor(steps / C10B_OWL_TURN_STEPS) % owl.dirs.length];
// まだ いる 見はり（n … 見つかった 回数）
export const activeOwls10b = (map, n) => (map.c10bOwls || []).filter((o) => !o.ease || n < C10B_CAUGHT_EASE * o.ease);
const opaque = (t) => TILE_INFO[t]?.solid ?? true;
export function owlView10b(map, owl, dir, has = () => false) {
  const [dx, dy] = DV[dir];
  const px = -dy, py = dx; // よこ
  const out = [];
  for (let k = 1; k <= C10B_OWL_RANGE; k++) {
    const half = k >= 2 ? 1 : 0;
    for (let o = -half; o <= half; o++) {
      // その マスまでの 道すじ（まっすぐ 1マス → よこへ → まっすぐ）が 見とおせるか
      let ok = true;
      for (let j = 1; j <= k && ok; j++) {
        const oo = j >= 2 ? o : 0;
        const x = owl.x + dx * j + px * oo, y = owl.y + dy * j + py * oo;
        if (x < 0 || y < 0 || x >= map.w || y >= map.h || opaque(effectiveTile(map, x, y, has))) ok = false;
      }
      if (ok) out.push([owl.x + dx * k + px * o, owl.y + dy * k + py * o]);
    }
  }
  return out;
}
// 今 見はりに 見られて いる マス（Set 'x,y'）
export function watchedCells10b(map, steps, n, asleep, has) {
  const out = new Set();
  if (asleep) return out;
  for (const o of activeOwls10b(map, n)) for (const [x, y] of owlView10b(map, o, owlDir10b(o, steps), has)) out.add(`${x},${y}`);
  return out;
}
// 見つからない マス（雪の 山の 中・すべる 氷の 上）
export const hidden10b = (t) => t === T.C10B_SNOWPILE || t === T.C10B_SLIDE;
// その マスの 部屋（見つかったら その 入口へ）
export const roomAt10b = (map, x, y) => (map.c10bRooms || []).find((r) => x >= r.x0 && y >= r.y0 && x <= r.x1 && y <= r.y1) || map.c10bRooms?.[0] || null;
