// 第4章「砂の海にしずむ星」の マップ: つながり・砂嵐・人・宝箱・出現表（昼と 夜）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, isBlocked, effectiveTile, SEA_PLACES } from '../public/js/shared/maps/index.js';
import { CH4_MAPS, SOUTH_TOWNS } from '../public/js/shared/maps/ch4.js';
import { SANDSEA_POS } from '../public/js/shared/maps/duna.js';
import {
  SOUTH_W, SOUTH_H, SOUTH_PLACES, SOUTH_POS, SOUTH_LANDING, SOUTH_ARRIVE, LANDING_BEACH, OASIS_CAMP, STORM_Y, STORM_GAP_X, STORM_FLAG, STORM_END_FLAG,
  southBgmAt, southWeatherAt, southZoneAt,
} from '../public/js/shared/maps/south.js';
import { slideReach, slideSolid } from '../public/js/shared/maps/slide.js';
import { SCRIPTS } from '../public/js/shared/data/story.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import { ENCOUNTER_TABLES, FIXED_ENCOUNTERS, ZONE_BG } from '../public/js/shared/data/encounters.js';
import { NIGHT_ZONES } from '../public/js/shared/data/night.js';
import { MONSTERS_CH4 } from '../public/js/shared/data/monsters-ch4.js';
import { ENCOUNTERS_CH4, NIGHT_ZONES_CH4 } from '../public/js/shared/data/encounters-ch4.js';
import { hasNightSplit } from '../public/js/shared/world/monsters.js';
import { warpDest } from '../public/js/shared/world/services.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import { FIELD_CHEST_COUNT, fieldChestLootTable } from '../public/js/shared/data/fieldchests.js';

const key = (x, y) => `${x},${y}`;
const hasOf = (flags) => (f) => flags.includes(f);
// 歩いて 行ける マス（ワープの マスは ふむと べつの 場所へ とぶので その 先へは 行かない）
function reach(map, start, flags = []) {
  const has = hasOf(flags);
  const base = slideSolid(map, has);
  const warps = new Set(map.warps.map((w) => key(w.x, w.y)));
  const s = slideReach(map, start, has, (x, y) => base(x, y) || warps.has(key(x, y)));
  return (x, y) => s.has(key(x, y));
}
function near(r, x, y, d = 1) {
  for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) if (r(x + dx, y + dy)) return true;
  return false;
}
const HAM = SOUTH_PLACES.hamil;
const ARRIVE = [Math.floor(SOUTH_ARRIVE.x), Math.floor(SOUTH_ARRIVE.y)];

test('第4章: マップが ぜんぶ ある', () => {
  for (const id of CH4_MAPS) assert.ok(MAPS[id], id);
  assert.equal(MAPS.south.kind, 'field');
  assert.equal(MAPS.north_well.kind, 'dungeon');
  assert.equal(MAPS.south.w, SOUTH_W);
  assert.equal(MAPS.south.h, SOUTH_H);
  // 新しい タイルは 地図の 色と 名前が ある
  for (const id of [T.DESERT, T.DUNE, T.SANDSTONE, T.PALM, T.CACTUS, T.ADOBE, T.SANDSTORM, T.WELL_HOLE]) {
    assert.ok(TILE_INFO[id]?.name && TILE_INFO[id].mapColor, `tile ${id}`);
  }
  // 北は 海（竜で 北の はしを こえる）・竜が おりる 海辺は 砂浜
  for (let x = 0; x < SOUTH_W; x++) assert.ok([T.WATER, T.DEEP].includes(MAPS.south.tiles[x]), `北の はし ${x}`);
  assert.ok(!isBlocked(MAPS.south, ...ARRIVE, () => false), '竜が おりる ところは 歩ける');
});

test('コガネ地方: 北の海辺から 村・井戸・小さな オアシスへ 歩いて 行けて、砂嵐の 南へは 行けない', () => {
  const m = MAPS.south;
  const r = reach(m, ARRIVE);
  const wl = SOUTH_POS.well;
  // 村の 東・北・南の 門
  assert.ok(r(HAM.x + HAM.w - 1, HAM.y + 9), '東の 門');
  assert.ok(r(HAM.x + 14, HAM.y), '北の 門');
  assert.ok(r(HAM.x + 14, HAM.y + HAM.h - 1), '南の 門');
  assert.ok(near(r, wl.x, wl.y), '北の古井戸');
  assert.equal(effectiveTile(m, wl.x, wl.y, () => false), T.WELL_HOLE);
  assert.ok(r(OASIS_CAMP.x + 6, OASIS_CAMP.y + 2), '小さな オアシス');
  assert.ok(r(STORM_GAP_X[0], STORM_Y[0] - 1), '砂嵐の かべの 前');
  // 砂嵐の かべの 南へは 行けない（どの はしも）
  for (let y = STORM_Y[1] + 1; y < SOUTH_H; y += 7) for (let x = 0; x < SOUTH_W; x += 3) assert.ok(!r(x, y), `${x},${y} へは まだ 行けない`);
  // 砂嵐の かべは 東西 ぜんぶ（砂岩の がけ か 砂嵐）
  for (let y = STORM_Y[0]; y <= STORM_Y[1]; y++) {
    for (let x = 0; x < SOUTH_W; x++) assert.ok([T.SANDSTORM, T.SANDSTONE].includes(effectiveTile(m, x, y, () => false)), `${x},${y}`);
  }
  // よろい大サソリ（Step 2）を たおすと 道の ところだけ 弱まる
  const r2 = reach(m, ARRIVE, [STORM_FLAG]);
  assert.ok(r2(STORM_GAP_X[0] + 1, STORM_Y[1] + 3), '王都への 道が ひらく');
  for (let x = 0; x < SOUTH_W; x++) {
    if (x >= STORM_GAP_X[0] && x <= STORM_GAP_X[1]) continue;
    assert.notEqual(effectiveTile(m, x, STORM_Y[0], hasOf([STORM_FLAG])), T.DESERT, `${x}: ほかは まだ 砂嵐`);
  }
  // モルガナを たおすと（第4章の さいご）ぜんぶ はれる
  for (let x = 0; x < SOUTH_W; x++) assert.notEqual(effectiveTile(m, x, STORM_Y[0], hasOf([STORM_FLAG, STORM_END_FLAG])), T.SANDSTORM, `${x}`);
});

test('第4章: 人・宝箱・かんばん・しかけ・ワープが ただしく、ぜんぶ 行ける', () => {
  const ALL = ['c4_start', 'c4_arrive', 'c4_hamil', 'c4_nadim', 'c4_well', 'c4_ami', 'c4_canal'];
  for (const id of CH4_MAPS) {
    const m = MAPS[id];
    // ワープで 入って くる ところ（フィールドは 竜が おりる ところと、ダンジョンから 出て くる ところ。
    // 王都の 宮殿の 中庭は、宮殿の地下水路の 古井戸からだけ 入れる。砂の海〈Step 6〉は すなかぜ号で 出航して 着く ところ）
    const warpIn = Object.values(MAPS).flatMap((o) => o.warps.filter((w) => w.to.map === id).map((w) => [Math.floor(w.to.x), Math.floor(w.to.y)]));
    const sailIn = id === 'sand_sea' ? [[Math.floor(SANDSEA_POS.arrive.x), Math.floor(SANDSEA_POS.arrive.y)]] : [];
    const starts = id === 'south' ? [ARRIVE, ...warpIn] : [...sailIn, ...warpIn];
    assert.ok(starts.length, `${id}: 入り口`);
    // 水門の レバー（地下水路）は どちらでも 行けるように 両方 しらべる（つながりは test/ch4-canal.test.js）
    // よろい大サソリの 前と あと（あとは 砂嵐の 切れ目の 南の 王都サファラへ 行ける。サソリの いた 水路の 底は 水に なる）
    const levers = [...new Set(m.gates.filter((g) => g.closed === T.LEVER).map((g) => g.flag))];
    const sets = [ALL, [...ALL, 'c4_scorpion']];
    for (const lv of levers) for (const st of sets.slice()) sets.push([...st, lv]);
    // しかけを ぜんぶ といた あと（ピラミッドの 歌の ボタン・3階の 近道・4階の ひびの 入った かべ。お昼の 影も）
    sets.push([...ALL, 'c4_scorpion', ...new Set(m.gates.map((g) => g.flag).filter(Boolean))]);
    const rs = sets.flatMap((fl) => starts.map((s0) => reach(m, s0, fl)));
    const r = (x, y) => rs.some((f) => f(x, y));
    for (const c of m.chests) {
      assert.ok(!isBlocked(m, c.x, c.y, () => true), `${id} chest ${c.id} の 下は ゆか`);
      assert.ok(near(r, c.x, c.y), `${id} chest ${c.id} に 行けない`);
      assert.ok(c.gold || ITEMS[c.item], `${id} chest ${c.id} item ${c.item}`);
    }
    for (const n of m.npcs) {
      assert.ok(SCRIPTS[n.script], `${id} npc ${n.id} script ${n.script}`);
      assert.ok(near(r, Math.floor(n.x), Math.floor(n.y), n.big ? 3 : 2), `${id} npc ${n.id} に 行けない`);
      // その 人が 見えている 時の マスで しらべる（サソリが いる 水路の 底は、たおすと 水に なる）
      const seen = (f) => !(n.show?.not || []).includes(f);
      assert.ok(!isBlocked(m, Math.floor(n.x), Math.floor(n.y), seen), `${id} npc ${n.id} が かべの 中`);
    }
    for (const s of m.signs) assert.ok(near(r, s.x, s.y), `${id} sign ${s.x},${s.y}`);
    for (const a of m.actions || []) {
      assert.ok(SCRIPTS[a.script], `${id} action ${a.script}`);
      assert.ok(near(r, a.x, a.y), `${id} action ${a.script} ${a.x},${a.y}`);
    }
    for (const tr of m.triggers) assert.ok(SCRIPTS[tr.script], `${id} trigger ${tr.id}`);
    for (const w of m.warps) {
      assert.ok(near(r, w.x, w.y), `${id} warp ${w.x},${w.y}`);
      assert.ok(MAPS[w.to.map].warps.some((b) => b.to.map === id), `${id} → ${w.to.map} から もどれる`);
      assert.ok(!isBlocked(MAPS[w.to.map], Math.floor(w.to.x), Math.floor(w.to.y), () => false), `${id} → ${w.to.map} の 着く ところ`);
    }
    for (const s of m.sparkles) assert.ok(r(s.x, s.y), `${id} sparkle ${s.id}`);
    for (const z of Object.keys(m.spawnCounts || {})) {
      assert.ok(ENCOUNTER_TABLES[z]?.length, `${id}: 出現表 ${z}`);
      assert.ok(ZONE_BG[z], `${id}: たたかいの はいけい ${z}`);
    }
  }
  // 村の お店・宿屋・教会
  assert.ok(SHOPS.hamil, 'ハミルの よろず屋');
  for (const it of SHOPS.hamil.items) assert.ok(ITEMS[it], it);
  const kinds = (MAPS.south.boards || []).map((b) => b.kind);
  for (const k of ['inn', 'general', 'church']) assert.ok(kinds.includes(k), k);
  // フィールドの 宝箱（ランダム）も 出る。中みは ちいきに あわせる
  assert.ok(FIELD_CHEST_COUNT.south > 0);
  for (const z of Object.keys(MAPS.south.spawnCounts)) {
    const t = fieldChestLootTable(z);
    assert.ok(t?.length, `宝箱の 中み ${z}`);
    for (const e of t) assert.ok(e.gold || ITEMS[e.item], `${z}: ${e.item}`);
  }
  // アミの へやの まわりは 魔物が 出ない（イベントの 戦いだけ）
  assert.equal(MAPS.north_well.zoneAt(24, 22), 'safe:ami');
  assert.equal(MAPS.north_well.zoneAt(4, 3), 'safe:entry');
  assert.equal(MAPS.north_well.zoneAt(16, 14), 's_well');
});

test('コガネ地方: ルーラ・帰り道の羽で ハミルへ 行ける（村の 東の 門の 外）', () => {
  assert.ok(SEA_PLACES.hamil, 'ルーラの 行き先');
  assert.equal(SEA_PLACES.hamil, SOUTH_TOWNS.hamil);
  const d = warpDest('hamil');
  assert.equal(d.map, 'south');
  assert.ok(!isBlocked(MAPS.south, Math.floor(d.x), Math.floor(d.y), () => false), '歩ける ところに おりる');
  const r = reach(MAPS.south, ARRIVE);
  assert.ok(r(Math.floor(d.x), Math.floor(d.y)), '海辺と つながっている');
  const [rx, ry, rw, rh] = SEA_PLACES.hamil.rect;
  assert.deepEqual([rx, ry, rw, rh], [HAM.x, HAM.y, HAM.w, HAM.h], '村に 入ると 行ったことに なる');
});

test('砂ばく: 夜だけ 月のゆうれいが 出る（昼の 出現表には 出ない）', () => {
  const species = (table) => (ENCOUNTER_TABLES[table] || []).flatMap((e) => e.group.map((g) => g[0]));
  const dayZones = ['s_coast', 's_dune', 's_oasis', 's_well'];
  for (const z of dayZones) assert.ok(!species(z).includes('moon_ghost'), `${z}: 昼は 出ない`);
  for (const [day, night] of Object.entries(NIGHT_ZONES_CH4)) {
    assert.equal(NIGHT_ZONES[day], night, `${day} → ${night}`);
    assert.ok(species(night).includes('moon_ghost'), `${night}: 夜は 出る`);
    assert.ok(ZONE_BG[night], `${night}: はいけい`);
    assert.ok(hasNightSplit(MAPS.south, day), `${day}: 昼と 夜で かわる`);
  }
  // フィールドの ちいきは ぜんぶ 昼と 夜で かわる。井戸の 中は かわらない
  for (const z of Object.keys(MAPS.south.spawnCounts)) assert.ok(NIGHT_ZONES[z], z);
  assert.ok(!hasNightSplit(MAPS.north_well, 's_well'), '井戸の 中は 昼も 夜も おなじ');
  // 月のゆうれいは 夜の 魔物（強いが 経験値も 多い）
  const ghost = MONSTERS.moon_ghost;
  assert.ok(ghost.night);
  for (const sp of ['sand_slime', 'scorpion_soldier', 'sand_vulture', 'mirage_flower']) assert.ok(ghost.exp > MONSTERS[sp].exp && ghost.lv > MONSTERS[sp].lv, sp);
});

test('第4章の 魔物: データ・技・出現表が そろっている', () => {
  for (const [id, mo] of Object.entries(MONSTERS_CH4)) {
    assert.equal(MONSTERS[id], mo, id);
    // 第4章は Lv30〜40 の 章（Step 5 の 南の砂ばくと 大臣ザイードは Lv34〜36、Step 6 の 砂クジラは Lv37）
    assert.ok(mo.name && mo.desc && mo.lv >= 29 && mo.lv <= 37, `${id}: Lv${mo.lv}`);
    for (const a of mo.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${id}: ${a.id}`);
    for (const d of Object.values(mo.drops || {})) assert.ok(ITEMS[d[0]], `${id}: ${d[0]}`);
  }
  for (const [z, list] of Object.entries(ENCOUNTERS_CH4)) {
    for (const e of list) for (const [sp] of e.group) assert.ok(MONSTERS[sp], `${z}: ${sp}`);
  }
  // 黄金虫は かたくて すぐ にげる（ゴールドが 多い）
  assert.ok(MONSTERS.gold_beetle.metal && MONSTERS.gold_beetle.gold >= 500);
  // 井戸の おくの 戦いは にげられない
  assert.equal(FIXED_ENCOUNTERS.well_ambush.canFlee, false);
  for (const [sp] of FIXED_ENCOUNTERS.well_ambush.group) assert.ok(MONSTERS[sp], sp);
});

test('コガネ地方: 音楽と 天気（村・昼・夜・砂嵐の かべ）', () => {
  assert.equal(southBgmAt(HAM.x + 10, HAM.y + 10), 'oasis');
  assert.equal(southBgmAt(HAM.x + 10, HAM.y + 10, true), 'oasis', '村の 中は 夜も 村の 曲');
  assert.equal(southBgmAt(80, 30), 'desert');
  assert.equal(southBgmAt(80, 30, true), 'desert_night');
  assert.equal(southWeatherAt(HAM.x + 10, HAM.y + 10), null, '村の 中は 砂ぼこりなし');
  assert.equal(southWeatherAt(36, STORM_Y[0] - 3), 'sandstorm');
  assert.equal(southWeatherAt(80, 30), 'sand');
  assert.equal(MAPS.south.areaName(HAM.x + 3, HAM.y + 3), HAM.name);
  assert.equal(MAPS.south.areaName(...ARRIVE), LANDING_BEACH.name);
  assert.equal(MAPS.south.areaName(SOUTH_POS.well.x, SOUTH_POS.well.y + 2), '北の古井戸');
  assert.equal(southZoneAt(HAM.x + 3, HAM.y + 3), 'safe:hamil');
  assert.equal(southZoneAt(...ARRIVE), 'safe:landing');
  // 竜が おりる 空の 場所（北の海辺）は 海辺を ふくむ
  for (const k of ['x', 'y']) assert.ok(SOUTH_ARRIVE[k] >= SOUTH_LANDING[k] && SOUTH_ARRIVE[k] < SOUTH_LANDING[k] + (k === 'x' ? SOUTH_LANDING.w : SOUTH_LANDING.h));
});
