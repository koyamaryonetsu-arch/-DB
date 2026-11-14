// 第78回: 2.5D の 階段・くさりを 見やすく（render/mark3d.js・render/field3d.js。docs/plan-r78-stairs3d.md）
// 第82回: ▲▼ の 目じるしは やめた（家族の ねがい）。立体の 形・手前の かべを ひくく・くさりは のこす
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { MAPS, effectiveTile } from '../public/js/shared/maps/index.js';
import { T } from '../public/js/shared/tiles.js';
import { blockSpec, STAIR_EDGE } from '../public/js/client/render/field3d.js';
import * as mark3d from '../public/js/client/render/mark3d.js';

const { TOUCH_LOOK, stairCuts, CUT_H, hiddenBehind } = mark3d;

const isStairs = (t) => t === T.STAIRS_UP || t === T.STAIRS_DOWN;
// マップの いまの タイル（フラグ: all … ぜんぶ たっている / none … どれも ない）
const idAtOf = (m, flags) => (x, y) => (x < 0 || y < 0 || x >= m.w || y >= m.h ? -1 : effectiveTile(m, x, y, () => flags === 'all'));
// field3d と おなじ: ブロックの 高さ（ブロックで なければ null。水門などの とびらは 切らない）
const blockHOf = (idAt) => (x, y) => {
  const id = idAt(x, y);
  if (id === -1) return null;
  const s = blockSpec(id, x, y);
  return s && !s.gate ? s.h : null;
};

test('第82回: ▲▼ の 目じるしは 出さない（階段・くさり・縄ばしご）。立体の 形は のこす', () => {
  // きまりの 表: 行き来する 所だけ 立体の 形。目じるし・足もとの 光の 項目は ない
  assert.equal(TOUCH_LOOK.move.solid, true);
  for (const k of ['chest', 'door', 'gimmick']) assert.equal(TOUCH_LOOK[k].solid, false, k);
  for (const v of Object.values(TOUCH_LOOK)) assert.deepEqual(Object.keys(v), ['solid']);
  // 目じるしを かく 物は もう ない
  for (const k of ['drawMark', 'drawMarkGlow', 'collectMarks', 'markKind', 'markBob', 'marksShown', 'nearMark', 'MARK_LIFT', 'MARK_COLOR']) assert.equal(mark3d[k], undefined, k);
  const f3 = readFileSync(new URL('../public/js/client/render/field3d.js', import.meta.url), 'utf8');
  const fl = readFileSync(new URL('../public/js/client/field.js', import.meta.url), 'utf8');
  assert.ok(!/drawMarks|drawMark\b|collectMarks|this\.marks/.test(f3), 'field3d に 目じるしは ない');
  assert.ok(!/drawMarks/.test(fl), 'field.js から よばない');
  // かわりの ひかえめな 見え方: 段の てまえの ふちを すこし 明るく・下りの 穴に 細い 明るい ふち
  assert.ok(STAIR_EDGE.lit > 1 && STAIR_EDGE.lit <= 1.4);
  assert.ok(STAIR_EDGE.rim > 0 && STAIR_EDGE.rim <= 0.08);
  assert.ok(/addStairs\(g, x, y, hh, id, idAt/.test(f3) && /STAIR_EDGE\.rimLit/.test(f3));
  // いかりの くさり（太く 明るい 絵）は のこす
  assert.equal(typeof mark3d.chainCanvas3d, 'function');
});

test('手前の かべを ひくく: どの 階段も 手前の かべに かくれない（カメラは 南から 55度）', () => {
  let cut = 0, stairs = 0;
  for (const m of Object.values(MAPS)) {
    for (const flags of ['none', 'all']) {
      const idAt = idAtOf(m, flags);
      const bh = blockHOf(idAt);
      const cuts = stairCuts(m.w, m.h, idAt, bh);
      cut += cuts.size;
      // 切った あとの 高さ（ブロックで なければ 0）
      const topAt = (x, y) => {
        if (y >= m.h) return null;
        const h = bh(x, y);
        if (h === null) return 0;
        return cuts.has(y * m.w + x) ? Math.min(h, cuts.get(y * m.w + x)) : h;
      };
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
        if (!isStairs(idAt(x, y))) continue;
        stairs++;
        assert.equal(hiddenBehind((k) => topAt(x, y + k)), false, `${m.id} ${x},${y}`);
      }
    }
  }
  assert.ok(stairs > 600 && cut > 100, `${stairs} ${cut}`);
});

test('手前の かべを ひくく: すぐ 手前は ひくい ふち・2つ 手前は こしの 高さ。ゆかの 先は 切らない', () => {
  // 星の塔 2階: 下り 階段（13,20）の 手前（13,21）は 洞窟の かべ
  const m = MAPS.star_tower_2f;
  const idAt = idAtOf(m, 'none');
  const cuts = stairCuts(m.w, m.h, idAt, blockHOf(idAt));
  assert.equal(cuts.get(21 * m.w + 13), CUT_H[0]);
  assert.ok(!cuts.has(21 * m.w + 12) && !cuts.has(21 * m.w + 14)); // となりの かべは そのまま
  // なげきの洞窟 地下2階: 上り 階段（43,31）の 手前は ゆか → 切らない
  const m2 = MAPS.cave_b2;
  const i2 = idAtOf(m2, 'none');
  const c2 = stairCuts(m2.w, m2.h, i2, blockHOf(i2));
  assert.ok(![32, 33, 34].some((y) => c2.has(y * m2.w + 43)));
  // 手前に ゆかが あって、その 先の かべ（2つ 手前）だけ 高い とき
  const tiles = { '1,1': T.STAIRS_DOWN, '1,2': T.CAVE_FLOOR, '1,3': T.CAVE_WALL };
  const fake = (x, y) => tiles[`${x},${y}`] ?? T.CAVE_FLOOR;
  assert.equal(stairCuts(3, 5, fake, blockHOf(fake)).size, 0);
  const tiles2 = { '1,1': T.STAIRS_UP, '1,2': T.CAVE_WALL, '1,3': T.CAVE_WALL };
  const fake2 = (x, y) => tiles2[`${x},${y}`] ?? T.CAVE_FLOOR;
  const c3 = stairCuts(3, 5, fake2, blockHOf(fake2));
  assert.deepEqual([c3.get(2 * 3 + 1), c3.get(3 * 3 + 1)], CUT_H);
});

test('かくれて いるか（手前の かべを ひくく した 後を しらべる ため）', () => {
  assert.equal(hiddenBehind(() => 0), false);
  assert.equal(hiddenBehind((k) => (k === 1 ? 1.6 : 0)), true); // すぐ 手前に 洞窟の かべ
  assert.equal(hiddenBehind((k) => (k === 1 ? CUT_H[0] : k === 2 ? CUT_H[1] : 0)), false);
  assert.equal(hiddenBehind((k) => (k === 1 ? 1.6 : null), 1.6), false); // 足もとも 高い
});
