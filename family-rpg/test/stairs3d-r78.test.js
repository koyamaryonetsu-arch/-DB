// 第78回: 2.5D の 階段・くさりを 見やすく（render/mark3d.js・render/field3d.js。docs/plan-r78-stairs3d.md）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, effectiveTile } from '../public/js/shared/maps/index.js';
import { T } from '../public/js/shared/tiles.js';
import { blockSpec } from '../public/js/client/render/field3d.js';
import {
  TOUCH_LOOK, markKind, collectMarks, stairCuts, CUT_H, hiddenBehind, markBob, marksShown, nearMark, drawMark, MARK_LIFT, isClimbTile,
} from '../public/js/client/render/mark3d.js';

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

test('目じるしの きまり: 行き来する 所だけ ▲▼。宝箱・とびら・しかけには つけない', () => {
  assert.equal(TOUCH_LOOK.move.mark, true);
  for (const k of ['chest', 'door', 'gimmick']) assert.equal(TOUCH_LOOK[k].mark, false, k);
  assert.equal(markKind(T.STAIRS_UP), 'up');
  assert.equal(markKind(T.STAIRS_DOWN), 'down');
  assert.equal(markKind(T.C8C_CHAIN), 'up'); // いかりの くさりは のぼる
  assert.equal(markKind(T.ROPE_LADDER, T.RUIN_SHAFT), 'down'); // たて穴に かけた 縄ばしご（2階 → 5階）
  assert.equal(markKind(T.ROPE_LADDER, T.ROPE_COIL), 'up'); // 5階 → 2階
  for (const t of [T.CAVE_FLOOR, T.DOOR, T.LOCKED_DOOR, T.C8C_ANCHOR, T.RUIN_SHAFT, T.ROPE_COIL, T.TREE]) assert.equal(markKind(t), null, String(t));
  assert.ok(isClimbTile(T.C8C_CHAIN) && !isClimbTile(T.STAIRS_UP));
  assert.ok(MARK_LIFT.climb > MARK_LIFT.stairs);
});

test('目じるしを あつめる: 2マス はばの 階段は 1つ。ぜんぶの 階段に 目じるし', () => {
  // 古代の大迷宮 地下1階: 2マス はばの 下り（37,21）（38,21）と 上り（21,31）（22,31）
  const m = MAPS.lab_b1;
  const marks = collectMarks(m.w, m.h, idAtOf(m, 'none'));
  const down = marks.find((k) => k.kind === 'down');
  assert.deepEqual([down.tx, down.ty, down.w, down.x, down.y], [37, 21, 2, 38, 21.5]);
  assert.equal(marks.length, 2);
  // すべての マップ: 階段の マスは どれかの 目じるしに 入る（フラグで あらわれる 階段も）
  let n = 0;
  for (const mm of Object.values(MAPS)) {
    for (const flags of ['none', 'all']) {
      const idAt = idAtOf(mm, flags);
      const ms = collectMarks(mm.w, mm.h, idAt);
      for (let y = 0; y < mm.h; y++) for (let x = 0; x < mm.w; x++) {
        if (!isStairs(idAt(x, y))) continue;
        n++;
        assert.ok(ms.some((k) => k.ty === y && x >= k.tx && x < k.tx + k.w), `${mm.id} ${x},${y}`);
      }
    }
  }
  assert.ok(n > 600, String(n));
});

test('くさり・縄ばしご: フラグが たつと 目じるし（千年前の 森の いかりの くさり・古い神殿の 縄ばしご）', () => {
  const f = MAPS.overworld_past;
  const g = f.gates.find((q) => q.levels?.some(([, t]) => t === T.C8C_CHAIN));
  assert.ok(g);
  const at = (flags) => collectMarks(f.w, f.h, (x, y) => effectiveTile(f, x, y, (fl) => flags.includes(fl))).filter((k) => k.tx === g.x && k.ty === g.y);
  assert.equal(at([]).length, 0); // まだ 木
  assert.equal(at(['c8c_entry'])[0].kind, 'up');
  assert.ok(at(['c8c_entry'])[0].climb);
  // 縄ばしご: 2階は 下り・5階は 上り
  for (const [id, kind] of [['sink_ruin_2f', 'down'], ['sink_ruin_5f', 'up']]) {
    const m = MAPS[id];
    const under = (x, y) => m.gates.find((q) => q.x === x && q.y === y)?.closed ?? null;
    const ms = collectMarks(m.w, m.h, idAtOf(m, 'all'), under).filter((k) => k.id === T.ROPE_LADDER);
    assert.equal(ms.length, 1, id);
    assert.equal(ms[0].kind, kind, id);
  }
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

test('かくれて いるか・ゆれ・出す 時', () => {
  assert.equal(hiddenBehind(() => 0), false);
  assert.equal(hiddenBehind((k) => (k === 1 ? 1.6 : 0)), true); // すぐ 手前に 洞窟の かべ
  assert.equal(hiddenBehind((k) => (k === 1 ? CUT_H[0] : k === 2 ? CUT_H[1] : 0)), false);
  assert.equal(hiddenBehind((k) => (k === 1 ? 1.6 : null), 1.6), false); // 足もとも 高い
  for (let t = 0; t < 4000; t += 97) assert.ok(Math.abs(markBob(t, 3, 4)) <= 0.07);
  assert.notEqual(markBob(0, 1, 1), markBob(800, 1, 1));
  assert.equal(marksShown({}), true);
  for (const o of [{ busy: true }, { menu: true }, { look: true }, { state: 'battle' }]) assert.equal(marksShown(o), false, JSON.stringify(o));
  const m = { x: 5, y: 5.5, w: 2 };
  assert.ok(nearMark(m, 5.4, 5.5) && nearMark(m, 4.3, 5.6));
  assert.ok(!nearMark(m, 5, 7) && !nearMark(m, 7, 5.5));
});

test('▲▼ の 絵: ▲は 上が とがる・▼は 下が とがる。左右 おなじ。うすくも かける', () => {
  const draw = (kind, s, a = 1) => {
    const rows = new Map();
    let alpha = null;
    const ctx = {
      fillStyle: '', globalAlpha: 1,
      save() {}, restore() {},
      fillRect(x, y, w) { if (this.fillStyle === '#7ee8ff') { rows.set(y, [x, w]); alpha = this.globalAlpha; } },
    };
    drawMark(ctx, 100, 100, s, kind, a);
    return { rows: [...rows.entries()].sort((p, q) => p[0] - q[0]).map(([, v]) => v), alpha };
  };
  for (const s of [4, 7, 12]) {
    const up = draw('up', s).rows, dn = draw('down', s).rows;
    assert.equal(up.length, Math.round(s));
    assert.ok(up[0][1] < up.at(-1)[1], 'up');
    assert.ok(dn[0][1] > dn.at(-1)[1], 'down');
    for (const [x, w] of up) assert.equal(x + w / 2, 100.5); // まん中
  }
  assert.equal(draw('up', 6, 0.55).alpha, 0.55);
});
