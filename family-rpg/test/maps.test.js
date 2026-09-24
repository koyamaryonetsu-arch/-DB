import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, isBlocked, tileAt, POS } from '../public/js/shared/maps/index.js';
import { PLACES, CAVE_ENTRANCE, FOREST_CLEARING, LAKE, SWAMP } from '../public/js/shared/maps/overworld.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import { SCRIPTS } from '../public/js/shared/data/story.js';

function bfs(map, start, flags = []) {
  const has = (f) => flags.includes(f);
  const seen = new Uint8Array(map.w * map.h);
  const q = [start];
  seen[start[1] * map.w + start[0]] = 1;
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h) continue;
      const k = ny * map.w + nx;
      if (seen[k]) continue;
      if (isBlocked(map, nx, ny, has)) continue;
      if (map.chestAt.has(k)) continue;
      seen[k] = 1;
      q.push([nx, ny]);
    }
  }
  return (x, y) => !!seen[y * map.w + x];
}

// となりの マスに たどりつけるか
function nextTo(reach, x, y) {
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => reach(x + dx, y + dy));
}

test('フィールド: 村から 丘・町・森の おくへ いける', () => {
  const ow = MAPS.overworld;
  const reach = bfs(ow, POS.heroHome);
  assert.ok(reach(...POS.villagePlaza), '村の ひろば');
  assert.ok(nextTo(reach, ...POS.shrineAltar), 'ほこら');
  assert.ok(reach(...POS.townPlaza), '町の ひろば');
  assert.ok(nextTo(reach, FOREST_CLEARING.x, FOREST_CLEARING.y - 1), '森の おく');
  assert.ok(!reach(CAVE_ENTRANCE.x, CAVE_ENTRANCE.y), '橋が なおるまでは どうくつへ いけない');
  const reach2 = bfs(ow, POS.heroHome, ['bridge_fixed']);
  assert.ok(reach2(CAVE_ENTRANCE.x, CAVE_ENTRANCE.y), '橋が なおれば どうくつへ いける');
});

test('フィールド: たからばこ・かんばん・人に ちかづける', () => {
  const ow = MAPS.overworld;
  const reach = bfs(ow, POS.heroHome, ['bridge_fixed']);
  for (const c of ow.chests) {
    assert.ok(!TILE_INFO[tileAt(ow, c.x, c.y)].solid, `chest ${c.id} on solid tile`);
    assert.ok(nextTo(reach, c.x, c.y), `chest ${c.id} unreachable`);
  }
  for (const s of ow.signs) assert.ok(nextTo(reach, s.x, s.y), `sign ${s.x},${s.y} unreachable`);
  for (const n of ow.npcs) {
    const tx = Math.floor(n.x), ty = Math.floor(n.y);
    const tile = tileAt(ow, tx, ty);
    if (!['star_stone'].includes(n.id)) assert.ok(!TILE_INFO[tile].solid, `npc ${n.id} on solid tile ${TILE_INFO[tile].name}`);
    const ok = reach(tx, ty) || nextTo(reach, tx, ty) || [[0, 2], [0, -2], [2, 0], [-2, 0]].some(([dx, dy]) => reach(tx + dx, ty + dy));
    assert.ok(ok, `npc ${n.id} unreachable`);
    assert.ok(SCRIPTS[n.script], `script ${n.script} for ${n.id}`);
  }
  for (const sp of ow.sparkles) assert.ok(reach(sp.x, sp.y), `sparkle ${sp.id}`);
});

test('どうくつ: 入口から 階段・たからばこ・ボスの へやへ いける', () => {
  const b1 = MAPS.cave_b1;
  const r1 = bfs(b1, [24, 32]);
  assert.ok(nextTo(r1, 43, 3) || r1(43, 3), 'B1 stairs');
  for (const c of b1.chests) assert.ok(nextTo(r1, c.x, c.y), `b1 chest ${c.id}`);
  const b2 = MAPS.cave_b2;
  const r2 = bfs(b2, [43, 32]);
  for (const c of b2.chests.filter((c) => !c.show)) assert.ok(nextTo(r2, c.x, c.y), `b2 chest ${c.id}`);
  assert.ok(nextTo(r2, 20, 13), 'spring');
  assert.ok(!r2(23, 6), 'とびらが しまっている');
  const r3 = bfs(b2, [43, 32], ['c1_door']);
  assert.ok(r3(23, 6), 'とびらを あければ ボスの へや');
  for (const c of b2.chests.filter((c) => c.show)) assert.ok(nextTo(r3, c.x, c.y), `boss chest ${c.id}`);
  for (const n of b2.npcs) assert.ok(SCRIPTS[n.script], n.script);
});

test('ワープ先は とおれる マス', () => {
  for (const m of Object.values(MAPS)) {
    for (const w of m.warps) {
      const dest = MAPS[w.to.map];
      assert.ok(dest, w.to.map);
      assert.ok(!isBlocked(dest, Math.floor(w.to.x), Math.floor(w.to.y), () => true), `${m.id} → ${w.to.map} ${w.to.x},${w.to.y}`);
      assert.ok(!dest.warpAt.has(Math.floor(w.to.y) * dest.w + Math.floor(w.to.x)), 'ワープ先が ワープの マスに なっていない');
    }
  }
});
