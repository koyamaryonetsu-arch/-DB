// マップの ぜんたい（フィールド・どうくつ）と、そこに いる 人や たからばこ
import { T, parseRows, TILE_INFO } from '../tiles.js';
import { makeRng, hash2 } from '../rng.js';
import { buildOverworld, PLACES, zoneAt, areaName, OW_W, OW_H, CAVE_ENTRANCE, FOREST_CLEARING, LAKE, SWAMP } from './overworld.js';
import { CAVE_B1_ROWS, CAVE_B2_ROWS } from './cave-rows.js';
import { npc } from './npc.js';
import { buildCh2Maps, SEA_PLACES } from './ch2.js';

const V = (x, y) => [PLACES.village.x + x, PLACES.village.y + y];
const TW = (x, y) => [PLACES.town.x + x, PLACES.town.y + y];
const SH = (x, y) => [PLACES.shrine.x + x, PLACES.shrine.y + y];

export const POS = {
  heroHome: V(6, 4),
  villagePlaza: V(16, 13),
  starStone: V(16, 11),
  elderHouse: V(24, 18),
  villageChurch: V(6, 19),
  townPlaza: TW(23, 20),
  townChurch: TW(7, 31),
  shrineAltar: SH(5, 3),
  pierEnd: [28, 122.5], // 村の 南の さんばしの 先（船に のる ところ）
};

// ───────────── 人（NPC） ─────────────
// npc() の つかいかたは npc.js
const OVERWORLD_NPCS = [
  // ホシフル村
  npc('elder', 'ホシミばあちゃん', V(24, 17), 'elder', 'elder'),
  npc('luca_home', 'ルカ', V(8, 8), 'luca', 'luca_village', { show: { not: ['p_opening'] } }),
  npc('luca_rest', 'ルカ', V(26, 19), 'luca', 'luca_rest', { show: { all: ['p_attack'], not: ['c1_clear'] }, dir: 'up' }),
  npc('luca_plaza', 'ルカ', V(19, 13), 'luca', 'luca_after', { show: { all: ['c1_clear'] } }),
  npc('dog', 'ポチ', V(4, 5), 'dog', 'dog', { wander: 1 }),
  npc('v_shop', 'よろず屋のおじさん', V(23, 3), 'merchant', 'shop_village'),
  npc('v_priest', '神父さま', V(6, 18), 'priest', 'church', { dir: 'down' }),
  npc('v_guard', '見張りのドンク', V(15, 1), 'guard', 'village_guard', { show: { not: ['p_attack'] } }),
  npc('v_guard_b', '見張りのポルン', V(16, 1), 'guard', 'village_guard', { show: { not: ['p_attack'] } }),
  npc('v_guard2', '見張りのドンク', V(13, 1), 'guard', 'village_guard', { show: { all: ['p_attack'] } }),
  npc('v_guard2_b', '見張りのポルン', V(18, 1), 'guard', 'village_guard', { show: { all: ['p_attack'] } }),
  npc('v_farmer', '畑のおじさん', V(27, 9), 'farmer', 'v_farmer', { wander: 2 }),
  npc('v_girl', '村の女の子', V(9, 12), 'girl', 'v_girl', { wander: 2 }),
  npc('v_boy', '村の男の子', V(21, 10), 'boy', 'v_boy', { wander: 2 }),
  npc('v_oldman', 'おじいさん', V(13, 21), 'oldman', 'v_oldman', { wander: 1 }),
  npc('v_woman', '村のおくさん', V(8, 15), 'woman', 'v_woman', { wander: 2 }),
  npc('star_stone', '守り星の石', V(16, 11), 'starstone', 'star_stone', { solid: false }),

  // ほしみの丘
  npc('star_flower', '星の花', SH(5, 4), 'flower', 'star_flower', { show: { all: ['p_start'], not: ['p_flower'] }, solid: false }),
  npc('mike', 'ミケ', [68, 90], 'cat', 'mike_cat', { show: { all: ['q_mike_start'], not: ['q_mike_found'] }, wander: 1 }),

  // ルミナの町
  npc('mayor', '町長ゴードン', TW(7, 4), 'mayor', 'mayor'),
  npc('priestess', '神官セレナ', TW(23, 5), 'priestess', 'job_change'),
  npc('sage', 'ひらめきの賢者', TW(20, 7), 'sage', 'sage'),
  npc('bartender', '酒場のマスター', TW(38, 3), 'bartender', 'tavern'),
  npc('weapon_keeper', '武器屋のおやじ', TW(6, 13), 'merchant', 'shop_weapon'),
  npc('armor_keeper', '防具屋のおねえさん', TW(6, 22), 'woman', 'shop_armor'),
  npc('item_keeper', '道具屋のむすめ', TW(41, 13), 'girl', 'shop_item'),
  npc('innkeeper', '宿屋のおかみ', TW(41, 23), 'woman', 'inn'),
  npc('t_priest', '神父さま', TW(7, 30), 'priest', 'church'),
  npc('carpenter', '大工のガンテツ', TW(38, 31), 'carpenter', 'carpenter'),
  npc('star_granny', '星集めのおばあさん', TW(17, 31), 'elder', 'star_granny'),
  npc('mike_girl', 'リリ', TW(27, 20), 'girl', 'mike_girl', { wander: 1 }),
  npc('cook', '酒場のコック', TW(41, 7), 'cook', 'cook'),
  npc('farmer_wolf', '牧場のおじさん', TW(44, 20), 'farmer', 'wolf_hunt', { wander: 1 }),
  npc('t_guard1', '門番', TW(21, 33), 'guard', 't_guard'),
  npc('t_guard2', '門番', TW(26, 33), 'guard', 't_guard'),
  npc('t_traveler', '旅の詩人', TW(28, 16), 'bard', 't_traveler', { wander: 2 }),
  npc('t_kid', '町の子ども', TW(18, 22), 'boy', 't_kid', { wander: 3 }),
  npc('t_lady', '町のおばさん', TW(34, 24), 'woman', 't_lady', { wander: 2 }),
  npc('t_oldman', '物知りじいさん', TW(12, 10), 'oldman', 't_oldman', { wander: 2 }),
  npc('t_drinker', 'よっぱらい', TW(42, 8), 'farmer', 't_drinker'),

  // フィールド
  npc('bridge_worker', '橋の番人', [123, 61], 'carpenter', 'bridge_worker'),
  npc('lake_traveler', '旅人', [84, 70], 'bard', 'lake_traveler', { wander: 2 }),
  npc('treant', 'ダークトレント', [FOREST_CLEARING.x, FOREST_CLEARING.y - 1], 'treant', 'treant', { big: true, show: { not: ['c1_treant'] } }),
  npc('treant_calm', 'トレント', [FOREST_CLEARING.x, FOREST_CLEARING.y - 1], 'treant_calm', 'treant_calm', { big: true, show: { all: ['c1_treant'] } }),
  npc('east_hunter', 'かりゅうど', [141, 70], 'guard', 'east_hunter', { wander: 2 }),

  // 第2章: 村の 南の さんばし
  npc('captain_pier', '船長マリナ', [27, 121], 'captain', 'captain_pier', { show: { all: ['c2_start'], not: ['c2_ship'] }, dir: 'right' }),
  npc('ship', 'しおかぜ号', [27.5, 124], 'ship', 'ship_board', { show: { all: ['c2_start'] } }),
];

// ───────────── たからばこ ─────────────
const OVERWORLD_CHESTS = [
  { id: 'ow_island', x: LAKE.x, y: LAKE.y, item: 'swift_ring' },
  { id: 'ow_forestA', x: 118, y: 34, item: 'wind_clothes' },
  { id: 'ow_forestB', x: 96, y: 13, item: 'magic_water', n: 2 },
  { id: 'ow_swamp', x: SWAMP.x, y: SWAMP.y, item: 'power_ring' },
  { id: 'ow_north', x: 60, y: 8, item: 'seed_mag' },
  { id: 'ow_east', x: 150, y: 30, item: 'guard_ring' },
  { id: 'ow_beach', x: 46, y: 116, item: 'revive_flower' },
  { id: 'ow_west', x: 13, y: 40, item: 'seed_def' },
  { id: 'ow_hill', x: 70, y: 76, gold: 120 },
];

// ───────────── かんばん ─────────────
const OVERWORLD_SIGNS = [
  { x: 25, y: 88, text: 'ここはホシフル村。\n↑ 北へ進むとルミナの町。' },
  { x: 46, y: 99, text: '→ 星見の丘' },
  { x: 91, y: 44, text: '← ルミナの町　↑ ささやきの森\n↘ 東の橋' },
  { x: 121, y: 61, text: 'この先、東の平原。\n魔物が強いので注意！' },
  { x: 149, y: 56, text: 'なげきの洞窟\n（深い所には強い魔物がいるぞ）' },
  { x: 29, y: 115, text: 'ホシフル村のさんばし\n（船に乗ると、南の海へ出られる）' },
  { x: LAKE.x - 3, y: LAKE.y - LAKE.ry - 2, text: '鏡の湖\n静かな湖。何かが光っている…？' },
  { x: 97, y: 50, text: 'ささやきの森\n迷わないように気を付けて。' },
];

// ───────────── ワープ（出入り口） ─────────────
const OVERWORLD_WARPS = [
  { x: CAVE_ENTRANCE.x, y: CAVE_ENTRANCE.y, to: { map: 'cave_b1', x: 24, y: 32.6, dir: 'up' } },
];

// ───────────── イベントの ばしょ（ふむと はじまる） ─────────────
const OVERWORLD_TRIGGERS = [
  { id: 'town_arrive', x: PLACES.town.x + 20, y: PLACES.town.y + 30, w: 8, h: 6, script: 'town_arrive', show: { all: ['p_attack'], not: ['c1_town'] } },
  { id: 'opening', x: PLACES.village.x + 3, y: PLACES.village.y + 2, w: 7, h: 5, script: 'opening', show: { not: ['p_opening'] } },
];

// きらきら（ひろえる どうぐ）
function makeSparkles(tiles, w, h) {
  const rng = makeRng(777);
  const list = [];
  let tries = 0;
  while (list.length < 22 && tries++ < 5000) {
    const x = rng.int(4, w - 5), y = rng.int(4, h - 5);
    const tile = tiles[y * w + x];
    if (![T.GRASS, T.FLOWERS, T.FOREST_FLOOR, T.SAND, T.TALLGRASS, T.HILL].includes(tile)) continue;
    const z = zoneAt(x, y);
    if (z.startsWith('safe')) continue;
    if (list.some((s) => Math.abs(s.x - x) + Math.abs(s.y - y) < 12)) continue;
    list.push({ id: 'sp' + list.length, x, y, zone: z });
  }
  return list;
}

// フィールドの かんばんは タイルを おきかえる
function placeSigns(m, signs) {
  for (const s of signs) m.tiles[s.y * m.w + s.x] = T.SIGN;
}

function buildMaps() {
  const ow = buildOverworld();
  placeSigns(ow, OVERWORLD_SIGNS);
  const maps = {};
  maps.overworld = {
    id: 'overworld', name: 'ミドリナ地方', kind: 'field', bgm: 'field', dark: false,
    w: ow.w, h: ow.h, tiles: ow.tiles, gates: ow.gates,
    npcs: OVERWORLD_NPCS, chests: OVERWORLD_CHESTS, signs: OVERWORLD_SIGNS, warps: OVERWORLD_WARPS,
    triggers: OVERWORLD_TRIGGERS,
    sparkles: makeSparkles(ow.tiles, ow.w, ow.h),
    roofs: [
      // 村
      ...[[3, 2, 7, 5, 'red'], [22, 2, 7, 5, 'blue'], [3, 16, 7, 5, 'purple'], [22, 16, 7, 5, 'green']]
        .map(([x, y, w, h, color]) => ({ x: PLACES.village.x + x, y: PLACES.village.y + y, w, h, color })),
      // 町
      ...[[3, 2, 9, 7, 'green'], [17, 2, 14, 8, 'white'], [35, 2, 10, 8, 'orange'], [3, 12, 8, 6, 'red'], [37, 12, 8, 6, 'blue'],
        [3, 21, 8, 6, 'teal'], [37, 21, 8, 6, 'brown'], [3, 28, 9, 6, 'purple'], [14, 29, 7, 5, 'pink'], [36, 29, 9, 5, 'brown']]
        .map(([x, y, w, h, color]) => ({ x: PLACES.town.x + x, y: PLACES.town.y + y, w, h, color })),
    ],
    zoneAt, areaName,
    places: PLACES,
    spawnCounts: { outskirts: 12, plains: 18, forest: 14, swamp: 6, east: 16 },
  };
  const b1 = parseRows(CAVE_B1_ROWS);
  maps.cave_b1 = {
    id: 'cave_b1', name: 'なげきの洞窟　地下1階', kind: 'dungeon', bgm: 'cave', dark: true,
    w: b1.w, h: b1.h, tiles: b1.tiles, gates: [],
    npcs: [],
    chests: [
      { id: 'b1_a', x: 9, y: 13, item: 'magic_water' },
      { id: 'b1_b', x: 43, y: 22, item: 'scale_shield' },
      { id: 'b1_c', x: 11, y: 5, item: 'seed_str' },
    ],
    signs: [],
    warps: [
      { x: 23, y: 34, to: { map: 'overworld', x: CAVE_ENTRANCE.x + 0.5, y: CAVE_ENTRANCE.y + 1.7, dir: 'down' } },
      { x: 24, y: 34, to: { map: 'overworld', x: CAVE_ENTRANCE.x + 0.5, y: CAVE_ENTRANCE.y + 1.7, dir: 'down' } },
      { x: 43, y: 3, to: { map: 'cave_b2', x: 43.5, y: 32.6, dir: 'down' } },
    ],
    triggers: [
      { id: 'cave_enter', x: 19, y: 28, w: 10, h: 6, script: 'cave_enter', show: { not: ['c1_cave'] } },
    ],
    sparkles: [],
    roofs: [],
    zoneAt: () => 'cave1',
    areaName: () => 'なげきの洞窟　地下1階',
    spawnCounts: { cave1: 10 },
  };
  const b2 = parseRows(CAVE_B2_ROWS);
  const b2gates = [];
  for (let y = 0; y < b2.h; y++) for (let x = 0; x < b2.w; x++) {
    if (b2.tiles[y * b2.w + x] === T.LOCKED_DOOR) b2gates.push({ x, y, closed: T.LOCKED_DOOR, open: T.CAVE_FLOOR, flag: 'c1_door' });
  }
  maps.cave_b2 = {
    id: 'cave_b2', name: 'なげきの洞窟　地下2階', kind: 'dungeon', bgm: 'cave', dark: true,
    w: b2.w, h: b2.h, tiles: b2.tiles, gates: b2gates,
    npcs: [
      npc('spring', 'いやしの泉', [20, 13], 'spring', 'spring', { solid: true }),
      npc('locked_door', 'とびら', [23, 11], 'none', 'locked_door', { show: { not: ['c1_door'] }, solid: false }),
      npc('locked_door2', 'とびら', [24, 11], 'none', 'locked_door', { show: { not: ['c1_door'] }, solid: false }),
      npc('boss_rock', 'ゴルドーン', [23.5, 5], 'goldoon_sleep', 'boss_rock', { big: true, show: { not: ['c1_boss'] } }),
    ],
    chests: [
      { id: 'b2_key', x: 6, y: 26, item: 'cave_key' },
      { id: 'b2_a', x: 9, y: 15, item: 'healing_staff' },
      { id: 'b2_b', x: 42, y: 17, item: 'mage_earring' },
      { id: 'b2_boss1', x: 21, y: 3, item: 'stardust_sword', show: { all: ['c1_boss'] } },
      { id: 'b2_boss2', x: 26, y: 3, item: 'star_mail', show: { all: ['c1_boss'] } },
    ],
    signs: [],
    warps: [
      { x: 43, y: 31, to: { map: 'cave_b1', x: 43.5, y: 4.6, dir: 'down' } },
    ],
    triggers: [
      { id: 'boss_room', x: 14, y: 2, w: 20, h: 8, script: 'boss_event', show: { all: ['c1_door'], not: ['c1_boss'] } },
    ],
    sparkles: [],
    roofs: [],
    zoneAt: (x, y) => (y <= 10 && x >= 14 && x <= 33 ? 'safe:boss' : 'cave2'),
    areaName: () => 'なげきの洞窟　地下2階',
    spawnCounts: { cave2: 10 },
  };
  Object.assign(maps, buildCh2Maps());
  for (const m of Object.values(maps)) {
    m.npcById = Object.fromEntries(m.npcs.map((n) => [n.id, n]));
    m.chestAt = new Map(m.chests.map((c) => [c.y * m.w + c.x, c]));
    m.signAt = new Map((m.signs || []).map((s) => [s.y * m.w + s.x, s]));
    m.warpAt = new Map(m.warps.map((w) => [w.y * m.w + w.x, w]));
  }
  return maps;
}

export const MAPS = buildMaps();

// ───────────── べんりな かんすう ─────────────
export function tileAt(map, x, y) {
  if (x < 0 || y < 0 || x >= map.w || y >= map.h) return T.VOID;
  return map.tiles[y * map.w + x];
}

// フラグで かわる タイル（こわれた橋・カギの とびら）
export function effectiveTile(map, x, y, hasFlag) {
  const t = tileAt(map, x, y);
  if (map.gateAt === undefined) map.gateAt = new Map(map.gates.map((g) => [g.y * map.w + g.x, g]));
  const g = map.gateAt.get(y * map.w + x);
  if (g && hasFlag(g.flag)) return g.open;
  return t;
}

export function isBlocked(map, x, y, hasFlag) {
  const t = effectiveTile(map, x, y, hasFlag);
  // 海の マップでは 船で 水の 上を すすめる
  if (map.sailable && (t === T.WATER || t === T.DEEP)) return false;
  if (TILE_INFO[t]?.solid ?? true) return true;
  return false;
}

// 船に のっている（海の マップで 水の 上に いる）
export function onWater(map, x, y, hasFlag) {
  if (!map.sailable) return false;
  const t = effectiveTile(map, Math.floor(x), Math.floor(y), hasFlag);
  return t === T.WATER || t === T.DEEP;
}

// NPCや たからばこの 表示じょうけん
export function condOk(show, hasFlag) {
  if (!show) return true;
  if (show.all && !show.all.every(hasFlag)) return false;
  if (show.not && show.not.some(hasFlag)) return false;
  return true;
}

export function searchLoot(mapId, x, y) {
  // つぼ・たる・たな などを しらべた ときに でる もの（ばしょで きまる）
  const r = hash2(x, y, mapId.length * 31);
  if (r < 0.28) return { item: 'herb' };
  if (r < 0.40) return { item: 'antidote' };
  if (r < 0.50) return { item: 'star_shard' };
  if (r < 0.58) return { gold: 5 + Math.floor(hash2(x, y, 9) * 20) };
  if (r < 0.62) return { item: 'moonherb' };
  if (r < 0.64) return { item: 'magic_water' };
  return null;
}

export function sparkleLoot(zone, roll) {
  const tables = {
    outskirts: [['herb', 5], ['antidote', 2], ['star_shard', 3]],
    plains: [['herb', 4], ['antidote', 2], ['star_shard', 3], ['moonherb', 1]],
    forest: [['herb', 3], ['moonherb', 2], ['star_shard', 3], ['seed_hp', 0.4]],
    swamp: [['antidote', 4], ['star_shard', 3], ['seed_def', 0.4]],
    east: [['herb', 3], ['star_shard', 4], ['magic_water', 0.6], ['seed_str', 0.4]],
  };
  const t = tables[zone] || tables.plains;
  const total = t.reduce((s, e) => s + e[1], 0);
  let r = roll * total;
  for (const [id, w] of t) {
    r -= w;
    if (r < 0) return id;
  }
  return t[0][0];
}

export { PLACES, SEA_PLACES, zoneAt, areaName, OW_W, OW_H };
