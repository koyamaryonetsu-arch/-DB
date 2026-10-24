// 影の城 7階の 炎の 柱（第42回）: 西と 東の 通路の a・b の 柱の 間に 待てる マスが ある・
// 立っている マスで 炎が ふき上がっても、そこから 出ていける（client/field.js の boxFree）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, isBlocked } from '../public/js/shared/maps/index.js';
import { castleMapId } from '../public/js/shared/maps/castle.js';
import { CASTLE_ROWS } from '../public/js/shared/maps/castle-rows.js';
import { Field } from '../public/js/client/field.js';

const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

test('炎の 柱: a と b は となりあわない（どの 階も。となりあうと 待つ マスが なく 通れない）', () => {
  for (const [n, rows] of Object.entries(CASTLE_ROWS)) {
    rows.forEach((r, y) => [...r].forEach((ch, x) => {
      if (ch !== 'a') return;
      for (const [dx, dy] of D4) assert.notEqual(rows[y + dy]?.[x + dx], 'b', `${n}階 (${x},${y})`);
    }));
  }
});

// 7階の 柱の マス（a … '@fireA' で ふき上がる）
function pillars7() {
  const rows = CASTLE_ROWS[7], out = [];
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === 'a' || ch === 'b') out.push({ x, y, ch }); }));
  return out;
}

test('7階: 炎が ふき上がった 柱の 上に いても、となりの マスへ 出ていける（新しく 入る かべ・柱は とおれない）', () => {
  const map = MAPS[castleMapId(7)];
  const a = pillars7().find((p) => p.ch === 'a');
  const fire = new Set(['@fireA']);
  const f = Object.assign(Object.create(Field.prototype), {
    map, me: { x: a.x + 0.5, y: a.y + 0.5 }, npcState: new Map(), scriptHidden: new Set(),
    gateFlag: (fl) => (fl === '@fireB' ? !fire.has('@fireA') : fire.has(fl)),
    hasFlag: () => false, chestGone: () => false,
  });
  const has = (fl) => f.gateFlag(fl);
  assert.ok(isBlocked(map, a.x, a.y, has), 'a の 柱が ふき上がっている');
  // 通路の 東西の どちらかは ゆか（待つ マス）
  const exits = [[1, 0], [-1, 0]].filter(([dx]) => !isBlocked(map, a.x + dx, a.y, has));
  assert.ok(exits.length >= 1, '柱の となりに ゆか');
  for (const [dx] of exits) assert.ok(f.boxFree(a.x + 0.5 + dx * 0.1, a.y + 0.5), `柱の 中から ${dx > 0 ? '東' : '西'}へ 動ける`);
  // 柱の 中でも、北と 南の かべには 入れない
  assert.ok(!f.boxFree(a.x + 0.5, a.y - 0.6), '北の かべ');
  assert.ok(!f.boxFree(a.x + 0.5, a.y + 1.2), '南の かべ');
  // 柱の 外に 出たら、ふき上がっている 柱には もどれない
  const [[dx]] = exits;
  f.me = { x: a.x + 0.5 + dx, y: a.y + 0.5 };
  assert.ok(!f.boxFree(a.x + 0.5 + dx * 0.3, a.y + 0.5), 'もえている 柱には 入れない');
});
