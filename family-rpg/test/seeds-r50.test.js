// 第50回 D1: 強さを 上げる 種・木の実は 手に入りにくく
//   サブクエスト・景品・魔物の ドロップで 手に入る。宝の洞窟・ひみつのダンジョン・れん金・フィールドの 宝箱・きらきらからは 出ない
//   魔物の ドロップ（と ぬすむ）は 前の 1/3・物語の 地図の 宝箱は 半分
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { ITEMS } from '../public/js/shared/data/items.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { monsterDrops, stealPick, isStatSeed, STEAL_SEED_MAX, STEAL_RARE_MULT } from '../public/js/shared/data/loot.js';
import { FIELD_CHEST_ZONES, fieldChestLootTable, fieldChestLoot } from '../public/js/shared/data/fieldchests.js';
import { chestLoot, TM_LV_MAX } from '../public/js/shared/data/treasure.js';
import { sdBigReward, sdSmallReward } from '../public/js/shared/data/secret.js';
import { RECIPES } from '../public/js/shared/data/alchemy.js';
import { sparkleLoot } from '../public/js/shared/maps/index.js';
import { NORTH_SPARKLE_LOOT } from '../public/js/shared/maps/ch3.js';
import { SOUTH_SPARKLE_LOOT } from '../public/js/shared/maps/ch4.js';
import { makeRng } from '../public/js/shared/rng.js';

const SEED_IDS = ['seed_str', 'seed_def', 'seed_agi', 'seed_mag', 'seed_hp', 'seed_mp', 'seed_heal', 'star_nut', 'gold_nut'];
const SEED = new Set(SEED_IDS);
// 第50回の 前の 物語の 地図（shared/maps/*.js）に 書いてあった 種・木の実の 数（宝箱・つぼ・きらきら）
const OLD_MAP_SEED_REFS = 104;
// 第50回の 前の 魔物の 種の ドロップ（1/N の N → その 数）
const OLD_DROP_N = { 3: 3, 8: 1, 32: 11, 36: 32, 40: 24, 44: 7, 48: 24, 64: 11, 96: 9, 128: 6 };
const OLD_DROP_SUM = Object.entries(OLD_DROP_N).reduce((s, [n, k]) => s + k / Number(n), 0);

test('種・木の実: 9しゅるい とも 強さを 上げる 道具（isStatSeed）', () => {
  for (const id of SEED_IDS) assert.ok(ITEMS[id] && isStatSeed(id), id);
  for (const id of ['herb', 'elf_drink', 'revive_flower', 'iron_sword']) assert.ok(!isStatSeed(id), id);
});

test('フィールドの 宝箱・きらきら: 種は 出ない', () => {
  for (const z of FIELD_CHEST_ZONES) {
    for (const e of fieldChestLootTable(z)) assert.ok(!SEED.has(e.item), `${z}: ${e.item}`);
    const rng = makeRng(z.length * 97 + 1);
    for (let i = 0; i < 300; i++) assert.ok(!SEED.has(fieldChestLoot(z, rng).item), z);
  }
  const zones = new Set([...FIELD_CHEST_ZONES, ...Object.keys(NORTH_SPARKLE_LOOT), ...Object.keys(SOUTH_SPARKLE_LOOT)]);
  for (const z of zones) for (let r = 0; r < 1; r += 0.002) assert.ok(!SEED.has(sparkleLoot(z, r)), `${z} ${r}`);
});

test('宝の洞窟: 種は 出ない（ふつう・主の 宝箱 A・B）。進化の 石・めずらしい 回復の 道具は 出る', () => {
  const rng = makeRng(50);
  const got = new Map();
  for (let i = 0; i < 9000; i++) {
    const lv = 1 + (i % TM_LV_MAX);
    const r = chestLoot(rng, lv, ['normal', 'bossA', 'bossB'][i % 3]);
    assert.ok(!SEED.has(r.item), `Lv${lv}: ${r.item}`);
    if (r.item) got.set(r.item, (got.get(r.item) || 0) + 1);
  }
  for (const id of ['elf_drink', 'revive_flower', 'fire_stone']) assert.ok(got.get(id) > 0, id);
});

test('ひみつのダンジョン: 休み所の ごほうびに 種は 出ない', () => {
  for (let f = 1; f <= 200; f++) for (const e of sdBigReward(f)) assert.ok(!SEED.has(e.item), `${f}階: ${e.item}`);
  assert.ok(sdBigReward(10).some((e) => e.item === 'elf_drink' || e.item === 'revive_flower'), 'かわりの 道具');
  const rng = makeRng(7);
  for (let i = 0; i < 4000; i++) assert.ok(!SEED.has(sdSmallReward(1 + (i % 120), rng).item));
});

test('れん金: 種は 作れない（材料には 使える）', () => {
  for (const r of RECIPES) assert.ok(!SEED.has(r.out), `${r.id}: ${r.out}`);
  assert.ok(RECIPES.some((r) => r.ins.some((i) => SEED.has(i))), '材料には 使える');
});

test('魔物の ドロップ: 種は 前の 1/3（ふつうの 魔物は 1/96 より 出にくい）', () => {
  let sum = 0;
  for (const sp of Object.keys(MONSTERS)) {
    for (const d of monsterDrops(sp)) {
      if (!SEED.has(d.item)) continue;
      sum += d.rate;
      const m = MONSTERS[sp];
      const min = m.boss ? 9 : d.kind === 'common' ? 24 : 96;
      assert.ok(d.n >= min, `${sp}: ${d.item} 1/${d.n}`);
    }
  }
  assert.ok(sum > 0, '魔物から 手に入る');
  assert.ok(sum <= OLD_DROP_SUM / 3 + 1e-9, `${sum} <= ${OLD_DROP_SUM / 3}`);
});

test('ぬすむ: 種は 1/3 まで。ほかの 物の かわりにも ならない', () => {
  const seedy = [];
  for (const sp of Object.keys(MONSTERS)) if (monsterDrops(sp).some((d) => SEED.has(d.item))) seedy.push(sp);
  assert.ok(seedy.length > 20);
  for (const sp of seedy) {
    const rng = makeRng(sp.length * 13 + 5);
    let n = 0;
    const N = 1500;
    for (let i = 0; i < N; i++) if (SEED.has(stealPick(sp, rng))) n++;
    const d = monsterDrops(sp).find((x) => SEED.has(x.item));
    const p = Math.min(STEAL_SEED_MAX, d.rate * STEAL_RARE_MULT);
    assert.ok(n <= N * p * 1.35 + 12, `${sp}: ${n}/${N} (p=${p.toFixed(3)})`);
  }
  // 影の城の 主（種しか 持っていない）: 前は かならず とれた → 1/3 ほど
  const rng = makeRng(3);
  let got = 0;
  for (let i = 0; i < 6000; i++) {
    const id = stealPick('phantom_storm', rng);
    assert.ok(id === null || id === 'seed_agi', id);
    if (id) got++;
  }
  assert.ok(got > 6000 / 3 * 0.85 && got < 6000 / 3 * 1.15, `${got}`);
});

test('物語の 地図の 宝箱: 種は 前の 半分くらい（家族クエストの ごほうびは そのまま）', () => {
  const dir = new URL('../public/js/shared/maps/', import.meta.url);
  const re = new RegExp(`'(${SEED_IDS.join('|')})'`, 'g');
  let n = 0;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.js'))) n += (readFileSync(new URL(f, dir), 'utf8').match(re) || []).length;
  assert.ok(n > 0 && n <= OLD_MAP_SEED_REFS * 0.55, `${n} / ${OLD_MAP_SEED_REFS}`);
  const fq = readFileSync(new URL('family-quests.js', dir), 'utf8');
  assert.match(fq, /item: 'seed_str', n: 2/);
});
