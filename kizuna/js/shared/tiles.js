// タイル（マップの マス）の しゅるい
// solid: とおれない / talkThrough: カウンター（むこうの人と はなせる）
// search: しらべると どうぐが でることがある / anim: うごく タイル

export const T = {
  VOID: 0,
  GRASS: 1, FLOWERS: 2, TALLGRASS: 3, DIRT: 4, SAND: 5, WATER: 6, DEEP: 7,
  TREE: 8, PINE: 9, MOUNTAIN: 10, HILL: 11, ROCK: 12, BRIDGE_H: 13, BRIDGE_V: 14, BROKEN_BRIDGE: 15,
  SWAMP: 16, FOREST_FLOOR: 17, STEPPING: 18, CLIFF: 19, SHRINE_FLOOR: 21, CAVE_ENTRANCE: 22,
  STONE_PATH: 30, PLAZA: 31, WALL_STONE: 32, WALL_WOOD: 33, FLOOR_WOOD: 34, FLOOR_STONE: 35,
  DOOR: 36, COUNTER: 37, TABLE: 38, CHAIR: 39, BED: 40, SHELF: 41, POT: 42, BARREL: 43, WELL: 44,
  FOUNTAIN: 45, FENCE: 46, SIGN: 47, STATUE: 48, ALTAR: 49, STAR_ALTAR: 50, CARPET: 51, LAMP: 52,
  HEDGE: 53, FIREPLACE: 55, BOOKSHELF: 56, CRATE: 57, TOWN_FLOWERS: 59, STAIRS_DOWN: 60, STAIRS_UP: 61,
  CAVE_FLOOR: 70, CAVE_WALL: 71, CAVE_WATER: 72, CRYSTAL: 73, TORCH: 74, PILLAR: 75, LOCKED_DOOR: 76,
  RUBBLE: 77, BOSS_FLOOR: 78, CAVE_BRIDGE: 79, PIER: 80, RUBBLE_WALL: 81,
  WHIRLPOOL: 82,
  // 第3章（雪・氷・ようがん・鉱山・神殿）
  SNOW: 90, SNOW_PATH: 91, DEEP_SNOW: 92, SNOW_PINE: 93, SNOW_ROCK: 94, ICE: 95, ICE_BLOCK: 96,
  LAVA: 98, LAVA_FLOOR: 99, OBSIDIAN: 100, RAIL: 101, LEVER: 102, LEVER_ON: 103, PLATE: 104, PLATE_ON: 105,
  BRAZIER: 106, BRAZIER_LIT: 107, HOT_SPRING: 108, SNOW_WALL: 109, FLAME_WALL: 110, ASH: 111, MINE_BEAM: 112,
  ICE_WALL: 113, DRAGON_GATE: 114, CHASM: 115, RAIL_BRIDGE: 116, RAIL_STOP: 117, ASH_ROCK: 118,
  // 第4章（砂の国）
  DESERT: 119, DUNE: 120, SANDSTONE: 121, PALM: 122, CACTUS: 123, ADOBE: 124, SANDSTORM: 125, WELL_HOLE: 126,
  // 第4章 Step 2（かれた地下水路）
  CANAL_FLOOR: 127, CANAL_WALL: 128, CANAL_BED: 129, CANAL_WATER: 130, SLUICE: 131, SLUICE_OPEN: 132, GRATE: 133, DAM: 134,
  // 第4章 Step 3（王都サファラ）
  DRY_FOUNTAIN: 135,
  // 第4章 Step 4（王家のピラミッド・オベリスク・日時計の とびら・歌の ボタン・流れる 砂・ありじごく）
  PYRAMID: 136, PYR_DOOR: 137, PYR_GATE: 138, OBELISK_BASE: 139, SUN_SHADOW: 140,
  BTN_SUN: 141, BTN_SAND: 142, BTN_MOON: 143, BTN_STAR: 144, BTN_SUN_ON: 145, BTN_SAND_ON: 146, BTN_MOON_ON: 147, BTN_STAR_ON: 148,
  FLOW_N: 149, FLOW_E: 150, FLOW_S: 151, FLOW_W: 152, SAND_PIT: 153,
  PYR_CRACK: 154, PYR_SLAB: 155, SARCOPHAGUS: 156, PYR_ALTAR: 157, PYR_GLYPH: 158, SEAL_RUNE: 159,
  // 第4章 Step 6（砂の港ドゥナ・砂の海・砂クジラの ねどこ）
  SAND_SEA: 160, SAND_WHIRL: 161,
  // 第4章 Step 7（砂の底の神殿: 水の 高さで かわる 水と 底・うく 石の 板・とび石・3色の レバー・鏡の 床・大きな 鏡・水の ろう・水鏡・
  // 砂の海賊の ほこら・かべ画・空気の ドームの かべ・水が もどった 王都の ふん水）
  TW_HI: 162, TW_MID: 163, TW_LO: 164, TW_BED: 165, TW_BED_LO: 166, TW_RAFT: 167, TW_STEP: 168, TW_COLUMN: 169, TW_SHAFT: 170,
  LEVER_R: 171, LEVER_R_ON: 172, LEVER_B: 173, LEVER_B_ON: 174, LEVER_Y: 175, LEVER_Y_ON: 176,
  MIRROR_FLOOR: 177, MIRROR_LIT: 178, BIG_MIRROR: 179, MIRROR_BROKEN: 180, WATER_PRISON: 181, WATER_MIRROR: 182,
  CLAN_SHRINE: 183, MURAL: 184, AIR_WALL: 185, FULL_FOUNTAIN: 186,
  // 第4章クリアの あとの より道「古代の大迷宮」（maps/labyrinth.js。ほかの 人と ぶつからない ように 230 から）
  RUIN_FLOOR: 230, RUIN_GATE: 231, RUIN_GATE_SHUT: 232, REST_FIRE: 233, WARP_RING: 234, WARP_RING_OFF: 235,
  ANC_DOOR: 236, ANC_MURAL: 237, DRAGON_BONE: 238,
  // 第5章 Step 1・2「星の塔」（maps/tower.js・render/tiles-tower.js。190 から）
  SKY_FLOOR: 190, STAR_DIM: 191, STAR_GLOW: 192, STAR_LIT: 193, LIFT: 194, LIFT_SHAFT: 195, LIFT_UP: 196, WEIGHT: 197, WEIGHT_ON: 198,
  WIND_E: 199, WIND_WINDOW: 200, WIND_SHUT: 201, VANE: 202, VANE_ON: 203, WIND_PIT: 204, ELEVATOR: 205, ELEVATOR_LIT: 206,
  STAR_WINDOW: 207, TOWER_MURAL: 208, STAR_CHART: 209, STAR_FONT: 210, STAR_DOOR: 211, TOWER_DOOR: 212, TOWER_GATE: 213,
  TOWER_BASE: 214, TOP_FLOOR: 215, TOP_EDGE: 216, CREST_ALTAR: 217, TOWER_EXIT: 218,
  // 第5章 Step 3・4「クモイ地方」（maps/kumoi.js・render/tiles-kumoi.js。219〜228）
  CLOUD_SEA: 219, CLOUD_RIM: 220, SKYWIND_N: 221, SKYWIND_E: 222, SKYWIND_S: 223, SKYWIND_W: 224,
  TILT_TREE: 225, TILT_PILLAR: 226, RUIN_WALL: 227, RUIN_DOOR: 228,
  // 第5章 Step 4「しずみゆく島の古い神殿」（maps/sink-ruin.js。239〜255）
  TILT_FLOOR_W: 239, TILT_FLOOR_E: 240, BOULDER: 241, TILT_LEVER: 242, TILT_LEVER_ON: 243,
  SCALE_PAN: 244, SCALE_PAN_ON: 245, PAN_ROCK: 246, SCALE_DOOR: 247, SCALE_BEAM: 248,
  CLOUD_FLOOR: 249, RUIN_SHAFT: 250, ROPE_LADDER: 251, ROPE_COIL: 252, RUIN_MURAL: 253, SHARD_ALTAR: 254, GAIA_ROOT: 255,
  // 第5章 Step 5「ノクトの思い出の迷宮」（maps/memory.js・render/tiles-memory.js。あいている 62〜69）と「星読みの里」（maps/hoshiyomi.js。83・84）
  MEM_VOID: 62, SHADOW_PATH: 63, SHADOW_FLOOR: 64, LAMP_STAND: 65, LAMP_LIT: 66, MEM_SHARD: 67, MEM_PILLAR: 68, MEM_EXIT: 69,
  STAR_CRYSTAL: 83, STAR_SCOPE: 84,
  // 第5章 Step 6・7「大地の神殿」と 根の島（maps/earth.js・render/tiles-earth.js。あいていた 20・23〜29・54・58・85〜89）
  ROOT_BRIDGE: 20, ROOT_GAP: 23, WATER_JAR: 24, WATER_JAR_ON: 25, GOLEM_S: 26, GOLEM_SLAB: 27, UNDO_SLAB: 28, EARTH_PIT: 29,
  GOLEM_FILL: 54, EARTH_DOOR: 58, LIFT_BROKEN: 85, EARTH_LIFT: 86, EARTH_ALTAR: 87, ROOT_GATE: 88, GOLEM_E: 89,
  // 第5章 Step 8「影の城」（maps/castle.js・render/tiles-castle.js。A8 が 使って よい あきは 97・187・188 だけ。ほかは 今の タイルの 色がえ）
  WINDMILL: 97, FIRE_PILLAR: 187, FIRE_VENT: 188,
  // 第5章 Step 9「影の城の てっぺん（星のない広間）」（maps/castle-top.js・render/tiles-top.js。A9 は 189・229 だけ）
  STARLESS_FLOOR: 189, STARLESS_ALTAR: 229,
  // 第6章 Step 1・2「時の砂時計」（maps/past.js・toki-shrine.js・toki-ruin.js・render/tiles-ch6.js）。0〜255 は ぜんぶ 使われているので 256 から。
  // 256 いじょうの タイルは 第6章の マップ（タイルの ならびが Uint16Array）だけで 使う（今の フィールドなど Uint8Array の マップには 置かない）
  SAND_DOOR: 256, SAND_DOOR_OPEN: 257, SAND_DIAL: 258, SAND_DIAL_ON: 259, TIME_ALTAR: 260, TIME_ALTAR_EMPTY: 261,
  FROZEN_WATER: 262, STRAW_WALL: 263, TIME_PLATE: 264, TIME_PLATE_ON: 265,
  // 第6章 Step 3・4「星めぐりの古道」（maps/hoshimichi.js・render/tiles-hoshimichi.js）。266〜279 は ほかの 人の ために あけて 280 から
  HM_MIST: 280, HM_ROUTE: 281, DRY_VALLEY: 282, YOUNG_TREE: 283, METEOR: 284, STAR_POST: 285, STAR_CATCH: 286, STAR_STONE: 287, STAR_STONE_ON: 288,
  // 第6章 Step 5「止まった時計塔」（maps/tokei.js・render/tiles-tokei.js）。289 から
  CLOCK_PIT: 289, HAND_BRIDGE: 290, CLOCK_HUB: 291, HAND_SWITCH: 292, CLOCK_PAINT: 293, THUD_FLOOR: 294, THUD_STONE: 295, STOP_FLOOR: 296,
  STOP_WATER: 297, BIG_GEAR: 298, GEAR_FLAT: 299, TIME_GAP: 300, CLOCK_DOOR: 301, BIG_BELL: 302, FROZEN_TREE: 303, FROZEN_GRASS: 304,
  MURAL_NEW: 305, CLOCK_FACE: 306,
};

export const TILE_INFO = {};
const def = (id, name, opts = {}) => { TILE_INFO[id] = { id, name, solid: false, ...opts }; };

def(T.VOID, 'void', { solid: true });
def(T.GRASS, 'grass');
def(T.FLOWERS, 'flowers');
def(T.TALLGRASS, 'tallgrass');
def(T.DIRT, 'dirt');
def(T.SAND, 'sand');
def(T.WATER, 'water', { solid: true, water: true, anim: true });
def(T.DEEP, 'deep', { solid: true, water: true, anim: true });
def(T.TREE, 'tree', { solid: true });
def(T.PINE, 'pine', { solid: true });
def(T.MOUNTAIN, 'mountain', { solid: true });
def(T.HILL, 'hill');
def(T.ROCK, 'rock', { solid: true });
def(T.BRIDGE_H, 'bridge_h');
def(T.BRIDGE_V, 'bridge_v');
def(T.BROKEN_BRIDGE, 'broken_bridge', { solid: true, water: true });
def(T.SWAMP, 'swamp', { poison: true, anim: true });
def(T.FOREST_FLOOR, 'forest_floor');
def(T.STEPPING, 'stepping', { water: true, anim: true });
def(T.CLIFF, 'cliff', { solid: true });
def(T.SHRINE_FLOOR, 'shrine_floor');
def(T.CAVE_ENTRANCE, 'cave_entrance');
def(T.STONE_PATH, 'stone_path');
def(T.PLAZA, 'plaza');
def(T.WALL_STONE, 'wall_stone', { solid: true });
def(T.WALL_WOOD, 'wall_wood', { solid: true });
def(T.FLOOR_WOOD, 'floor_wood');
def(T.FLOOR_STONE, 'floor_stone');
def(T.DOOR, 'door');
def(T.COUNTER, 'counter', { solid: true, talkThrough: true });
def(T.TABLE, 'table', { solid: true });
def(T.CHAIR, 'chair');
def(T.BED, 'bed', { solid: true });
def(T.SHELF, 'shelf', { solid: true, search: true });
def(T.POT, 'pot', { solid: true, search: true });
def(T.BARREL, 'barrel', { solid: true, search: true });
def(T.WELL, 'well', { solid: true });
def(T.FOUNTAIN, 'fountain', { solid: true, anim: true });
def(T.FENCE, 'fence', { solid: true });
def(T.SIGN, 'sign', { solid: true });
def(T.STATUE, 'statue', { solid: true });
def(T.ALTAR, 'altar', { solid: true, talkThrough: true });
def(T.STAR_ALTAR, 'star_altar', { solid: true });
def(T.CARPET, 'carpet');
def(T.LAMP, 'lamp', { solid: true });
def(T.HEDGE, 'hedge', { solid: true });
def(T.FIREPLACE, 'fireplace', { solid: true, anim: true });
def(T.BOOKSHELF, 'bookshelf', { solid: true, search: true });
def(T.CRATE, 'crate', { solid: true, search: true });
def(T.TOWN_FLOWERS, 'town_flowers');
def(T.STAIRS_DOWN, 'stairs_down');
def(T.STAIRS_UP, 'stairs_up');
def(T.CAVE_FLOOR, 'cave_floor');
def(T.CAVE_WALL, 'cave_wall', { solid: true });
def(T.CAVE_WATER, 'cave_water', { solid: true, water: true, anim: true });
def(T.CRYSTAL, 'crystal', { solid: true, anim: true });
def(T.TORCH, 'torch', { solid: true, anim: true, light: true });
def(T.PILLAR, 'pillar', { solid: true });
def(T.LOCKED_DOOR, 'locked_door', { solid: true });
def(T.RUBBLE, 'rubble');
def(T.BOSS_FLOOR, 'boss_floor');
def(T.CAVE_BRIDGE, 'cave_bridge');
def(T.PIER, 'pier');
def(T.RUBBLE_WALL, 'rubble_wall', { solid: true });
def(T.WHIRLPOOL, 'whirlpool', { solid: true, water: true, anim: true }); // 嵐の うず（船でも とおれない）
// 第3章
// slide: 氷（すべって、なにかに ぶつかるまで とまれない。client/field.js）
// hurt: ようがんの 地面（熱を ふせぐ お守りが ないと ダメージ。world/hazards.js）
// mapColor: 地図の 色（client/ui/menu.js）
def(T.SNOW, 'snow', { mapColor: '#e8eef8' });
def(T.SNOW_PATH, 'snow_path', { mapColor: '#c8c0b0' });
def(T.DEEP_SNOW, 'deep_snow', { mapColor: '#f6f8ff' });
def(T.SNOW_PINE, 'snow_pine', { solid: true, mapColor: '#3a6a5a' });
def(T.SNOW_ROCK, 'snow_rock', { solid: true, mapColor: '#8a90a0' });
def(T.ICE, 'ice', { slide: true, mapColor: '#9ad8f4' });
def(T.ICE_BLOCK, 'ice_block', { solid: true, mapColor: '#5a9ac8' });
def(T.LAVA, 'lava', { solid: true, anim: true, light: true, mapColor: '#ff6a1a' });
def(T.LAVA_FLOOR, 'lava_floor', { hurt: true, anim: true, mapColor: '#c8401a' });
def(T.OBSIDIAN, 'obsidian', { mapColor: '#3a2e3a' });
def(T.RAIL, 'rail', { mapColor: '#8a7058' });
def(T.LEVER, 'lever', { solid: true, mapColor: '#c8a040' });
def(T.LEVER_ON, 'lever_on', { solid: true, mapColor: '#f2c14e' });
def(T.PLATE, 'plate', { mapColor: '#8a8aa8' });
def(T.PLATE_ON, 'plate_on', { mapColor: '#ffe680' });
def(T.BRAZIER, 'brazier', { solid: true, mapColor: '#6a6a7a' });
def(T.BRAZIER_LIT, 'brazier_lit', { solid: true, anim: true, light: true, mapColor: '#ffb040' });
def(T.HOT_SPRING, 'hot_spring', { solid: true, water: true, anim: true, mapColor: '#6ad0d8' });
def(T.SNOW_WALL, 'snow_wall', { solid: true, mapColor: '#ffffff' });
def(T.FLAME_WALL, 'flame_wall', { solid: true, anim: true, light: true, mapColor: '#ff4a8a' });
def(T.ASH, 'ash', { mapColor: '#6a5a5a' });
def(T.MINE_BEAM, 'mine_beam', { solid: true, mapColor: '#7a5230' });
def(T.ICE_WALL, 'ice_wall', { solid: true, mapColor: '#4a7ab8' });
def(T.DRAGON_GATE, 'dragon_gate', { solid: true, mapColor: '#4a5a9a' });
def(T.CHASM, 'chasm', { solid: true, mapColor: '#0a0806' });
def(T.RAIL_BRIDGE, 'rail_bridge', { solid: true, mapColor: '#8a6a4a' });
def(T.RAIL_STOP, 'rail_stop', { mapColor: '#c84a3a' });
def(T.ASH_ROCK, 'ash_rock', { solid: true, mapColor: '#4a3a3a' });
// 第4章（砂の国）
def(T.DESERT, 'desert', { mapColor: '#e2c27e' }); // 砂ばくの 地面（風もようの 砂）
def(T.DUNE, 'dune', { solid: true, mapColor: '#c89a58' }); // 大きな 砂丘（こえられない）
def(T.SANDSTONE, 'sandstone', { solid: true, mapColor: '#b0663e' }); // 赤茶色の 砂岩の がけ・岩山
def(T.PALM, 'palm', { solid: true, mapColor: '#3f8a46' }); // ヤシの木
def(T.CACTUS, 'cactus', { solid: true, mapColor: '#5a9a4e' }); // サボテン
def(T.ADOBE, 'adobe', { solid: true, mapColor: '#c89464' }); // 日干しれんがの かべ（砂の国の 家）
def(T.SANDSTORM, 'sandstorm', { solid: true, anim: true, mapColor: '#a8784a' }); // 砂嵐の かべ（物語で 弱まる）
def(T.WELL_HOLE, 'well_hole', { mapColor: '#6a6a7a' }); // 古い 井戸の 入り口（なわばしごで 下へ）
// かれた地下水路（王国が 昔 つくった 石の 水路）
def(T.CANAL_FLOOR, 'canal_floor', { mapColor: '#b7a07a' }); // 水路の わきの 石だたみの 通路
def(T.CANAL_WALL, 'canal_wall', { solid: true, mapColor: '#6e5236' }); // 水路の 石の かべ（大きな 砂岩の ブロック）
def(T.CANAL_BED, 'canal_bed', { mapColor: '#9a8158' }); // 水が かれた 水路の 底（ひびわれた どろ。歩ける）
def(T.CANAL_WATER, 'canal_water', { solid: true, anim: true, mapColor: '#3d8db0' }); // 水路を 流れる 水
def(T.SLUICE, 'sluice', { solid: true, mapColor: '#5e4a36' }); // しまった 水門（木と 鉄の とびら）
def(T.SLUICE_OPEN, 'sluice_open', { solid: true, mapColor: '#8a7660' }); // 開いた 水門（とびらが 上がっている）
def(T.GRATE, 'grate', { solid: true, mapColor: '#55555e' }); // 水路の 入り口の 鉄の こうし
def(T.DAM, 'dam', { solid: true, mapColor: '#7e6044' }); // 魔物が つみ上げた がれきの せき
// 王都サファラ（Step 3）
def(T.DRY_FOUNTAIN, 'dry_fountain', { solid: true, mapColor: '#bfae8c' }); // 水が かれた ふん水（石の ふちと ひびわれた 底。まん中は ふき出し口）
// 王家のピラミッド（Step 4）
// flow: 流れる 砂（のると その むきへ 流される。client/field.js・maps/flow.js）/ pit: ありじごく（下の 階へ おちる。マップの ワープ）
def(T.PYRAMID, 'pyramid', { solid: true, mapColor: '#dcb86c' }); // ピラミッド（フィールドの 大きな 石の 山。まん中ほど 高い）
def(T.PYR_DOOR, 'pyr_door', { solid: true, mapColor: '#a8844a' }); // 日時計の とびら（しまった 大きな 石）
def(T.PYR_GATE, 'pyr_gate', { mapColor: '#3a2a18' }); // 開いた とびら（ピラミッドの 中へ）
def(T.OBELISK_BASE, 'obelisk_base', { mapColor: '#b89a6a' }); // オベリスクの 台（石の 柱は 人の え。client/render/chars.js）
def(T.SUN_SHADOW, 'sun_shadow', { mapColor: '#b8945a' }); // オベリスクの 影（お日さまの むきで のびる）
for (const [id, name] of [[T.BTN_SUN, 'btn_sun'], [T.BTN_SAND, 'btn_sand'], [T.BTN_MOON, 'btn_moon'], [T.BTN_STAR, 'btn_star']]) def(id, name, { solid: true, mapColor: '#b8985a' }); // 歌の ボタン（石の 台）
for (const [id, name] of [[T.BTN_SUN_ON, 'btn_sun_on'], [T.BTN_SAND_ON, 'btn_sand_on'], [T.BTN_MOON_ON, 'btn_moon_on'], [T.BTN_STAR_ON, 'btn_star_on']]) def(id, name, { solid: true, light: true, mapColor: '#ffd66b' }); // 光った ボタン
def(T.FLOW_N, 'flow_n', { flow: [0, -1], anim: true, mapColor: '#e6c27c' }); // 流れる 砂（北へ）
def(T.FLOW_E, 'flow_e', { flow: [1, 0], anim: true, mapColor: '#e6c27c' }); // 流れる 砂（東へ）
def(T.FLOW_S, 'flow_s', { flow: [0, 1], anim: true, mapColor: '#e6c27c' }); // 流れる 砂（南へ）
def(T.FLOW_W, 'flow_w', { flow: [-1, 0], anim: true, mapColor: '#e6c27c' }); // 流れる 砂（西へ）
def(T.SAND_PIT, 'sand_pit', { pit: true, anim: true, mapColor: '#5a3a1e' }); // ありじごく（砂が すいこまれる あな。下の 階へ）
def(T.PYR_CRACK, 'pyr_crack', { solid: true, mapColor: '#8a6a40' }); // ひびの 入った かべ（かくしべやの 入り口）
def(T.PYR_SLAB, 'pyr_slab', { solid: true, mapColor: '#9a7a4a' }); // 石の とびら（レバーで 開く ぬけ道）
def(T.SARCOPHAGUS, 'sarcophagus', { solid: true, mapColor: '#c8a040' }); // 金の ひつぎ
def(T.PYR_ALTAR, 'pyr_altar', { solid: true, talkThrough: true, mapColor: '#d8c070' }); // 王の 台（月の鏡）
def(T.PYR_GLYPH, 'pyr_glyph', { solid: true, mapColor: '#8a6a3a' }); // 絵文字の きざまれた かべ
def(T.SEAL_RUNE, 'seal_rune', { mapColor: '#8a6ab8' }); // 呪文を すいこむ もんしょう（2階の ゆか）
// 砂の海（Step 6）
// sail: 船で すすめる（sailable の マップだけ。maps/index.js の isBlocked・onWater）。ほかの マップでは 歩けない けしき
def(T.SAND_SEA, 'sand_sea', { solid: true, sail: true, anim: true, mapColor: '#d8a456' }); // 砂の海（さらさら 流れる こまかい 砂。すなかぜ号で すすむ）
def(T.SAND_WHIRL, 'sand_whirl', { solid: true, anim: true, mapColor: '#7a4e28' }); // 砂の うず（砂クジラの ねどこ。船でも 入れない）
// 砂の底の神殿（Step 7）。地下1階の 水の 高さ（上・中・下）は maps/temple.js の gates の levels で かわる
def(T.TW_HI, 'tw_hi', { solid: true, water: true, anim: true, mapColor: '#3a8ac8' }); // 水（水の 高さが「上」の ときの 水面）
def(T.TW_MID, 'tw_mid', { solid: true, water: true, anim: true, mapColor: '#2a6aa8' }); // 水（「中」の 水面。ふかい 底の 上だけ）
def(T.TW_LO, 'tw_lo', { solid: true, water: true, anim: true, mapColor: '#1e4e88' }); // 水（「下」でも のこる 水。下の 水門の 前の たまり）
def(T.TW_BED, 'tw_bed', { mapColor: '#5a8a88' }); // 水が ひいた 中の 底（ぬれた 石だたみ）
def(T.TW_BED_LO, 'tw_bed_lo', { mapColor: '#3e6a6e' }); // 水が ひいた ふかい 底（もに おおわれた 石）
def(T.TW_RAFT, 'tw_raft', { mapColor: '#c8d8e0' }); // 水に うく 石の 板（水が「上」の ときだけ わたれる）
def(T.TW_STEP, 'tw_step', { mapColor: '#a8c0c8' }); // とび石（水が「中」の ときだけ 水から 顔を 出す）
def(T.TW_COLUMN, 'tw_column', { solid: true, mapColor: '#6a8a90' }); // 水が ひいて 高い 柱に なった とび石（上れない）
def(T.TW_SHAFT, 'tw_shaft', { solid: true, mapColor: '#0a1418' }); // 石の 板が しずんだ あとの ふかい たて穴
for (const [id, name, color, on] of [[T.LEVER_R, 'lever_r', '#c8403a', false], [T.LEVER_R_ON, 'lever_r_on', '#ff6a5a', true],
  [T.LEVER_B, 'lever_b', '#3a6ac8', false], [T.LEVER_B_ON, 'lever_b_on', '#6aa8ff', true],
  [T.LEVER_Y, 'lever_y', '#c8a020', false], [T.LEVER_Y_ON, 'lever_y_on', '#ffe050', true]]) def(id, name, { solid: true, light: on, mapColor: color }); // 赤・青・黄の 水門の レバー
def(T.MIRROR_FLOOR, 'mirror_floor', { mapColor: '#9ab8d0' }); // 鏡の 床（本物の 道と、すいこまれる にせの 道。見た目は おなじ）
def(T.MIRROR_LIT, 'mirror_lit', { anim: true, light: true, mapColor: '#e8f6ff' }); // 月の鏡で 光った 本物の 道
def(T.BIG_MIRROR, 'big_mirror', { solid: true, mapColor: '#b8d0e8' }); // 大きな 鏡（しらべると 鏡の うつし身）
def(T.MIRROR_BROKEN, 'mirror_broken', { mapColor: '#7a8ca0' }); // くだけた 大きな 鏡の あと（通れる）
def(T.WATER_PRISON, 'water_prison', { solid: true, anim: true, light: true, mapColor: '#5ab8e8' }); // 水の 柱の ろう
def(T.WATER_MIRROR, 'water_mirror', { solid: true, water: true, anim: true, light: true, mapColor: '#8ad0f0' }); // 水鏡（遠い 空に うかぶ 島が うつる）
def(T.CLAN_SHRINE, 'clan_shrine', { solid: true, talkThrough: true, mapColor: '#d8b878' }); // 砂の海賊の 一族の ほこら
def(T.MURAL, 'mural', { solid: true, mapColor: '#6a8aa0' }); // かべ画（水は、上から下へ。光は、下から上へ）
def(T.AIR_WALL, 'air_wall', { solid: true, mapColor: '#b8946a' }); // 空気の ドームの かべ（あわの 向こうは 砂）
def(T.FULL_FOUNTAIN, 'full_fountain', { solid: true, anim: true, mapColor: '#5aa8e0' }); // 水が もどった 王都の ふん水
// 古代の大迷宮（第4章クリアの あとの より道。maps/labyrinth.js・render/tiles-lab.js）
def(T.RUIN_FLOOR, 'ruin_floor', { mapColor: '#c8b08a' }); // 古代の 大きな 石だたみ（馬車も 通れる 広い 道）
def(T.RUIN_GATE, 'ruin_gate', { mapColor: '#3a2a1a' }); // 古代都市の 門の 下の かいだん（砂の海から 古代都市へ）
def(T.RUIN_GATE_SHUT, 'ruin_gate_shut', { solid: true, mapColor: '#8a6a40' }); // 砂に うもれた 門（第4章クリアまで）
def(T.REST_FIRE, 'rest_fire', { solid: true, talkThrough: true, anim: true, light: true, mapColor: '#ffb84a' }); // 休み所の 聖なる 火（回復と 記録）
def(T.WARP_RING, 'warp_ring', { anim: true, light: true, mapColor: '#7ae8ff' }); // 近道の「転送の門」（光っている）
def(T.WARP_RING_OFF, 'warp_ring_off', { mapColor: '#6a7a8a' }); // まだ 光っていない 転送の門（ふむと 光る）
def(T.ANC_DOOR, 'anc_door', { solid: true, mapColor: '#7a5a3a' }); // 古代の 石の とびら（しかけで 開く）
def(T.ANC_MURAL, 'anc_mural', { solid: true, mapColor: '#a87a4a' }); // 古代の かべ画（古竜と 古代都市の 話）
def(T.DRAGON_BONE, 'dragon_bone', { solid: true, mapColor: '#e8dcc0' }); // 大昔の 竜の ほね
// 第5章「星の塔」（maps/tower.js）。上の 階ほど 星空の 色（render/tiles-tower.js）
def(T.SKY_FLOOR, 'sky_floor', { mapColor: '#2a3470' }); // 星空の もようの ゆか（上の 階）
def(T.STAR_DIM, 'star_dim', { mapColor: '#4a5490' }); // 星座の ゆかの 星（昼は 光らない。本物も にせも おなじ え）
def(T.STAR_GLOW, 'star_glow', { anim: true, light: true, mapColor: '#c8d4ff' }); // 夜に 光る 本物の 星（'@night' の とびら）
def(T.STAR_LIT, 'star_lit', { anim: true, light: true, mapColor: '#fff0a0' }); // じゅんばんに ふんで 光った 星
def(T.LIFT, 'lift', { mapColor: '#c8b06a' }); // 上り下りの ゆか（下に いる。のると 重りで 上がる）
def(T.LIFT_SHAFT, 'lift_shaft', { solid: true, mapColor: '#3a3a52' }); // 上り下りの ゆかの 通り道（ゆかが 下に ある あいだは 高い だん）
def(T.LIFT_UP, 'lift_up', { mapColor: '#d8c07a' }); // 上がって 止まった 上り下りの ゆか（だんを 上り下り できる）
def(T.WEIGHT, 'weight', { mapColor: '#8a8aa8' }); // 重りの ゆか（だれかが のると、上り下りの ゆかが 上がる）
def(T.WEIGHT_ON, 'weight_on', { mapColor: '#ffe680' }); // しずんだ 重りの ゆか
def(T.WIND_E, 'wind_e', { flow: [1, 0], anim: true, mapColor: '#a8d8f0' }); // 風の 窓から ふく 強い 風（東へ 流される）
def(T.WIND_WINDOW, 'wind_window', { solid: true, anim: true, mapColor: '#6ac0e8' }); // 風が ふきこむ 窓
def(T.WIND_SHUT, 'wind_shut', { solid: true, mapColor: '#5a5a78' }); // しまった 風の 窓
def(T.VANE, 'vane', { solid: true, mapColor: '#8ab0c8' }); // 風見の石（しらべると 風の 窓が しまる・風の 道が できる）
def(T.VANE_ON, 'vane_on', { solid: true, light: true, mapColor: '#c8f0ff' }); // 回した 風見の石
def(T.WIND_PIT, 'wind_pit', { solid: true, mapColor: '#0a0c1e' }); // 塔の ふきぬけ（風が ふくと、風に のって わたれる）
def(T.ELEVATOR, 'elevator', { mapColor: '#6a7a9a' }); // 星の エレベーター（まだ 光っていない）
def(T.ELEVATOR_LIT, 'elevator_lit', { anim: true, light: true, mapColor: '#9ae0ff' }); // 光っている 星の エレベーター（近道）
def(T.STAR_WINDOW, 'star_window', { solid: true, mapColor: '#3a4a8a' }); // 星空が 見える 窓
def(T.TOWER_MURAL, 'tower_mural', { solid: true, mapColor: '#8a7aa8' }); // 昔の 勇者の かべ画
def(T.STAR_CHART, 'star_chart', { solid: true, mapColor: '#3a4aa0' }); // 星図（星座の ゆかの ヒント）
def(T.STAR_FONT, 'star_font', { solid: true, talkThrough: true, anim: true, light: true, mapColor: '#9ad8ff' }); // 休み所の 星の いずみ（回復と 記録）
def(T.STAR_DOOR, 'star_door', { solid: true, mapColor: '#5a5aa0' }); // 星の とびら（しかけで 開く）
def(T.TOWER_DOOR, 'tower_door', { solid: true, mapColor: '#7a7a8a' }); // 星の 塔の とびら（紋章で 開く。フィールド）
def(T.TOWER_GATE, 'tower_gate', { mapColor: '#2a2a3a' }); // 開いた 塔の とびら（中へ）
def(T.TOWER_BASE, 'tower_base', { solid: true, mapColor: '#9a9aaa' }); // 塔の 土台の 石（フィールド）
def(T.TOP_FLOOR, 'top_floor', { mapColor: '#6a70a8' }); // 塔の てっぺんの 石の ゆか
def(T.TOP_EDGE, 'top_edge', { solid: true, mapColor: '#4a4e7a' }); // てっぺんの ふちの 石がき（向こうは 夜空）
def(T.CREST_ALTAR, 'crest_altar', { solid: true, talkThrough: true, light: true, mapColor: '#e8d890' }); // 紋章の さいだん（天のとばりを 開く）
def(T.TOWER_EXIT, 'tower_exit', { mapColor: '#2a2a3a' }); // 1階の 出口（外へ）
// 第5章「クモイ地方」（maps/kumoi.js）。雲の 海に うかぶ 島々（render/tiles-kumoi.js）
def(T.CLOUD_SEA, 'cloud_sea', { solid: true, anim: true, mapColor: '#e4ecf8' }); // 雲の 海（歩けない。竜なら 上を 飛べる）
def(T.CLOUD_RIM, 'cloud_rim', { mapColor: '#c4dcc8' }); // 雲に とけかけた 島の ふち（しずみかけている。歩ける）
def(T.SKYWIND_N, 'skywind_n', { flow: [0, -1], anim: true, mapColor: '#9ad0f4' }); // 風の 道（北へ 流される。雲の 上を わたれる）
def(T.SKYWIND_E, 'skywind_e', { flow: [1, 0], anim: true, mapColor: '#9ad0f4' }); // 風の 道（東へ）
def(T.SKYWIND_S, 'skywind_s', { flow: [0, 1], anim: true, mapColor: '#9ad0f4' }); // 風の 道（南へ）
def(T.SKYWIND_W, 'skywind_w', { flow: [-1, 0], anim: true, mapColor: '#9ad0f4' }); // 風の 道（西へ）
def(T.TILT_TREE, 'tilt_tree', { solid: true, mapColor: '#4a8a4a' }); // かたむいた 木（島が しずんで かたむいた）
def(T.TILT_PILLAR, 'tilt_pillar', { solid: true, mapColor: '#c8c4b0' }); // かたむいた 古い 柱
def(T.RUIN_WALL, 'ruin_wall', { solid: true, mapColor: '#b8b098' }); // 古い 神殿の 石の かべ（フィールド）
def(T.RUIN_DOOR, 'ruin_door', { mapColor: '#3a3428' }); // 古い 神殿の 入口（中へ）
// しずみゆく島の古い神殿（maps/sink-ruin.js）。かべと ゆかは 洞窟の タイルを 神殿の 色に（render/themes.js の sky_ruin）
def(T.TILT_FLOOR_W, 'tilt_floor_w', { mapColor: '#a8a490' }); // かたむいた ゆか（西が ひくい）
def(T.TILT_FLOOR_E, 'tilt_floor_e', { mapColor: '#a8a490' }); // かたむいた ゆか（東が ひくい）
def(T.BOULDER, 'boulder', { solid: true, mapColor: '#7a6e5a' }); // 大きな 岩（ゆかが かたむくと ころがる）
def(T.TILT_LEVER, 'tilt_lever', { solid: true, mapColor: '#8a7a5a' }); // かたむきの石（おすと 島の かたむきが かわる）
def(T.TILT_LEVER_ON, 'tilt_lever_on', { solid: true, light: true, mapColor: '#e8c870' }); // おした かたむきの石
def(T.SCALE_PAN, 'scale_pan', { mapColor: '#c8a860' }); // 重さの てんびんの 皿（上がっている）
def(T.SCALE_PAN_ON, 'scale_pan_on', { mapColor: '#ffe080' }); // 下がった てんびんの 皿（つりあった）
def(T.PAN_ROCK, 'pan_rock', { solid: true, mapColor: '#8a7a5a' }); // 岩が のった てんびんの 皿
def(T.SCALE_DOOR, 'scale_door', { solid: true, mapColor: '#8a8070' }); // てんびんの とびら（つりあうと 開く）
def(T.SCALE_BEAM, 'scale_beam', { solid: true, mapColor: '#a88a40' }); // てんびんの 柱と うで
def(T.CLOUD_FLOOR, 'cloud_floor', { anim: true, mapColor: '#d8e0ec' }); // 入りこんだ 雲（歩ける。強い 魔物が 出る）
def(T.RUIN_SHAFT, 'ruin_shaft', { solid: true, mapColor: '#1a1814' }); // ふかい たて穴（縄ばしごを かけると 下りられる）
def(T.ROPE_LADDER, 'rope_ladder', { mapColor: '#a07a40' }); // 縄ばしご（2階 ⇔ 5階の 近道）
def(T.ROPE_COIL, 'rope_coil', { solid: true, mapColor: '#a07a40' }); // まるめた 縄ばしご（上へ かけられる）
def(T.RUIN_MURAL, 'ruin_mural', { solid: true, mapColor: '#9a8a6a' }); // 古い かべ画（大地の 守り星と ハネビト）
def(T.SHARD_ALTAR, 'shard_altar', { solid: true, talkThrough: true, light: true, mapColor: '#f0d890' }); // 守り星の かけらの 台
def(T.GAIA_ROOT, 'gaia_root', { solid: true, mapColor: '#6a5038' }); // 島を ささえる 大きな 根（食べられて ぼろぼろ）
// 第5章 Step 5「ノクトの思い出の迷宮」（maps/memory.js）。かべと ゆかは 洞窟の タイルを 思い出の 年の 色に（render/themes.js の memory_*）
def(T.MEM_VOID, 'mem_void', { solid: true, anim: true, mapColor: '#0c0a1a' }); // 思い出の とぎれた ところ（くらい もや。歩けない）
def(T.SHADOW_PATH, 'shadow_path', { anim: true, mapColor: '#4a3e78' }); // 影の 道（ランプの 光で できた 影の 中に だけ 見える。歩ける）
def(T.SHADOW_FLOOR, 'shadow_floor', { mapColor: '#4a4468' }); // ゆかに おちた 影（歩ける）
def(T.LAMP_STAND, 'lamp_stand', { solid: true, mapColor: '#8a7a5a' }); // ランプ台（しらべると 星読みの ランプの 光を うつす）
def(T.LAMP_LIT, 'lamp_lit', { solid: true, light: true, anim: true, mapColor: '#ffd870' }); // 光っている ランプ台
def(T.MEM_SHARD, 'mem_shard', { solid: true, light: true, anim: true, mapColor: '#c8e8ff' }); // 思い出の かけら（しらべると その 年の 場面）
def(T.MEM_PILLAR, 'mem_pillar', { solid: true, mapColor: '#9a90c0' }); // 思い出の 柱（ランプの 光で 影が のびる）
def(T.MEM_EXIT, 'mem_exit', { light: true, anim: true, mapColor: '#f0e8ff' }); // 思い出の 出口（光の 門。ふむと 星読みの 里へ）
// 星読みの 里（maps/hoshiyomi.js）
def(T.STAR_CRYSTAL, 'star_crystal', { solid: true, talkThrough: true, light: true, anim: true, mapColor: '#a8d8ff' }); // 星読みの 水晶（思い出の 中へ 入る）
def(T.STAR_SCOPE, 'star_scope', { solid: true, mapColor: '#8a7a4a' }); // 星見の 遠めがね
// 第5章 Step 6・7「大地の神殿」（maps/earth.js）。かべと ゆかは 洞窟の タイルを 階の 色に（render/themes.js の earth_*）
def(T.ROOT_BRIDGE, 'root_bridge', { mapColor: '#8a6a3a' }); // 根の 橋（水がめで のびた 大きな 根。歩ける）
def(T.ROOT_GAP, 'root_gap', { solid: true, anim: true, mapColor: '#0e0a06' }); // 根の すきまの ふかい 谷（歩けない）
def(T.WATER_JAR, 'water_jar', { solid: true, mapColor: '#6a7a8a' }); // 根の 水がめ（しらべると 根が のびる・ちぢむ）
def(T.WATER_JAR_ON, 'water_jar_on', { solid: true, anim: true, light: true, mapColor: '#7ab8e8' }); // 水を そそいだ 水がめ
def(T.GOLEM_S, 'golem_s', { solid: true, mapColor: '#9a8a6a' }); // 土の 守り手（南を むいた 石の ゴーレム）
def(T.GOLEM_E, 'golem_e', { solid: true, mapColor: '#9a8a6a' }); // 土の 守り手（東を むいた 石の ゴーレム）
def(T.GOLEM_SLAB, 'golem_slab', { solid: true, mapColor: '#b8a070' }); // 守り手の 石板（しらべると ゴーレムが 1歩 歩く）
def(T.UNDO_SLAB, 'undo_slab', { solid: true, mapColor: '#8aa0b8' }); // もとに もどす 石板（ゴーレムが はじめの 場所へ）
def(T.EARTH_PIT, 'earth_pit', { solid: true, mapColor: '#1a1208' }); // ゆかの あな（ゴーレムが おちると うまる）
def(T.GOLEM_FILL, 'golem_fill', { mapColor: '#8a7a5a' }); // あなを うめた ゴーレムの せなか（歩ける 足場）
def(T.EARTH_DOOR, 'earth_door', { solid: true, mapColor: '#7a5a3a' }); // 根の とびら（2つの ふむ石で 開く）
def(T.LIFT_BROKEN, 'lift_broken', { solid: true, mapColor: '#5a4a3a' }); // こわれた 上り下りの ゆか
def(T.EARTH_LIFT, 'earth_lift', { light: true, mapColor: '#c8a860' }); // 直った 上り下りの ゆか（1階 ⇔ 5階）
def(T.EARTH_ALTAR, 'earth_altar', { solid: true, talkThrough: true, light: true, anim: true, mapColor: '#e8905a' }); // 大地の 守り星の 祭だん
def(T.ROOT_GATE, 'root_gate', { mapColor: '#3a2a18' }); // 大地の 神殿の 入口（根の とびら）
// 第5章 Step 8「影の城」（maps/castle.js）。かべと ゆかは 洞窟の タイルを 階の 色に（render/themes.js の castle_wind・castle_fire・castle_water）
def(T.WINDMILL, 'windmill', { solid: true, anim: true, mapColor: '#9ab0c8' }); // 風車（3階。2つ 同時に 回すと 風の 窓が とじる）
def(T.FIRE_PILLAR, 'fire_pillar', { solid: true, anim: true, light: true, mapColor: '#ff6a2a' }); // 炎の 柱（ふき上がっている 間は 通れない）
def(T.FIRE_VENT, 'fire_vent', { mapColor: '#4a3a3a' }); // 炎の 柱の ふき出し口（炎が 止まっている 間は 歩ける）
// 第5章 Step 9「星のない広間」（maps/castle-top.js）。かべは 洞窟の タイルを 広間の 色に（render/tiles-top.js の ctop）
def(T.STARLESS_FLOOR, 'starless_floor', { mapColor: '#1c1828' }); // 星のない 広間の ゆか（星の もようが 消えた 黒い 石。歩ける）
def(T.STARLESS_ALTAR, 'starless_altar', { solid: true, talkThrough: true, anim: true, mapColor: '#5a3a7a' }); // 星のない 祭だん（黒い もやが ゆれる）
// 第6章 Step 1・2「時の砂時計」（render/tiles-ch6.js）
def(T.SAND_DOOR, 'sand_door', { solid: true, mapColor: '#a88a4a' }); // 砂時計の とびら（しまっている。台を しらべると 少しの 間だけ 開く）
def(T.SAND_DOOR_OPEN, 'sand_door_open', { anim: true, mapColor: '#e8cc84' }); // 開いた 砂時計の とびら（上から 砂が こぼれる）
def(T.SAND_DIAL, 'sand_dial', { solid: true, mapColor: '#c8a860' }); // 砂時計の 台（しらべると 砂時計が ひっくり返る）
def(T.SAND_DIAL_ON, 'sand_dial_on', { solid: true, anim: true, light: true, mapColor: '#ffe08a' }); // 砂が 落ちている 砂時計の 台
def(T.TIME_ALTAR, 'time_altar', { solid: true, talkThrough: true, anim: true, light: true, mapColor: '#ffe8a8' }); // 時の 砂時計の 台座（光の 砂の 大きな 砂時計）
def(T.TIME_ALTAR_EMPTY, 'time_altar_empty', { solid: true, talkThrough: true, mapColor: '#b8a070' }); // 砂時計を もらった あとの 台座
def(T.FROZEN_WATER, 'frozen_water', { solid: true, mapColor: '#9aa0a8' }); // 時が 止まった 泉（灰色の まま 動かない 水）
def(T.STRAW_WALL, 'straw_wall', { solid: true, mapColor: '#c8a860' }); // わらの 家の かべ（千年前の ホシフルの里）
def(T.TIME_PLATE, 'time_plate', { mapColor: '#8a8aa8' }); // 時の ふむ石（時のいせき 7階。2つの 時代で 同時に ふむ）
def(T.TIME_PLATE_ON, 'time_plate_on', { light: true, mapColor: '#ffe680' }); // しずんだ 時の ふむ石
// 第6章 Step 3・4「星めぐりの古道」（render/tiles-hoshimichi.js）
def(T.HM_MIST, 'hm_mist', { mapColor: '#6a6a9a' }); // 星の もや（歩ける。道を まちがえると もやの 入口に もどされる）
def(T.HM_ROUTE, 'hm_route', { anim: true, light: true, mapColor: '#c8d8ff' }); // 星の 道しるべ（夜空が 見える 間、もやの 中の 本当の 道に 星が 光る）
def(T.DRY_VALLEY, 'dry_valley', { mapColor: '#a08a62' }); // 千年前の かれた 谷（今は 川。歩ける）
def(T.YOUNG_TREE, 'young_tree', { solid: true, mapColor: '#5aa04a' }); // 千年前の 星の木の なえ（しらべると 向きを かえられる）
def(T.METEOR, 'meteor', { solid: true, mapColor: '#5a5068' }); // 今の 落ちた星（道を ふさぐ 大きな 星の 岩）
def(T.STAR_POST, 'star_post', { solid: true, anim: true, light: true, mapColor: '#fff0a0' }); // 光る 道しるべ（千年前で 受けとめた 星）
def(T.STAR_CATCH, 'star_catch', { solid: true, talkThrough: true, mapColor: '#c8b8e8' }); // 千年前の 星受けの台
def(T.STAR_STONE, 'star_stone', { mapColor: '#7a7aa8' }); // 星の石（ふむ石。2つの 時代で 同時に ふむ）
def(T.STAR_STONE_ON, 'star_stone_on', { light: true, mapColor: '#ffe680' }); // ともった 星の石
// 第6章 Step 5「止まった時計塔」（render/tiles-tokei.js）
def(T.CLOCK_PIT, 'clock_pit', { solid: true, mapColor: '#14100c' }); // 大時計の 文字ばんの あな（下で 歯車が 止まっている。通れない）
def(T.HAND_BRIDGE, 'hand_bridge', { mapColor: '#d8b050' }); // 時計の 針の 橋（スイッチで 1時間ずつ 回る。歩ける）
def(T.CLOCK_HUB, 'clock_hub', { mapColor: '#b89040' }); // 文字ばんの まん中の 台（針の 根もと。歩ける）
def(T.HAND_SWITCH, 'hand_switch', { solid: true, talkThrough: true, mapColor: '#e8c060' }); // 針の スイッチ（しらべると 針が 回る）
def(T.CLOCK_PAINT, 'clock_paint', { solid: true, mapColor: '#c8a878' }); // かべの 時計の 絵（何時に 合わせるかの ヒント）
def(T.THUD_FLOOR, 'thud_floor', { mapColor: '#6a5a4a' }); // 落ちてくる 石（ドッスン）の 下の ゆか（石が 上がっている 間は 歩ける）
def(T.THUD_STONE, 'thud_stone', { solid: true, mapColor: '#8a8a9a' }); // 落ちてきた 石（ドッスン。通れない）
def(T.STOP_FLOOR, 'stop_floor', { mapColor: '#9a98a0' }); // 止まった 部屋の ゆか（時の 砂時計の 光の 中の 人だけ 動ける）
def(T.STOP_WATER, 'stop_water', { mapColor: '#a8b0b8' }); // 止まった 水（止まっている 間は 上を 歩ける）
def(T.BIG_GEAR, 'big_gear', { solid: true, mapColor: '#a07a30' }); // 止まった 大きな 歯車（千年前では 動かない）
def(T.GEAR_FLAT, 'gear_flat', { mapColor: '#8a6a2a' }); // 回って 道に なった 歯車（歩ける）
def(T.TIME_GAP, 'time_gap', { anim: true, light: true, mapColor: '#e8e0ff' }); // 時の すきま（光る ゆか。ここで 時の 砂時計を 使うと、今の 星の塔と 行き来できる）
def(T.CLOCK_DOOR, 'clock_door', { solid: true, mapColor: '#8a6a3a' }); // 歯車の とびら（時計塔）
def(T.BIG_BELL, 'big_bell', { solid: true, talkThrough: true, mapColor: '#d8a840' }); // 大きな 鐘（5階）
def(T.FROZEN_TREE, 'frozen_tree', { solid: true, mapColor: '#8a8c90' }); // 時が 止まった 灰色の 木（千年前の 北の 山）
def(T.FROZEN_GRASS, 'frozen_grass', { mapColor: '#a8aaae' }); // 時が 止まった 灰色の 草（歩ける）
def(T.MURAL_NEW, 'mural_new', { solid: true, mapColor: '#b8b0a0' }); // 星の塔 1階の 新しい かべ画（うすく、半分しか 見えない）
def(T.CLOCK_FACE, 'clock_face', { solid: true, mapColor: '#d8c890' }); // かべの 大時計（12時で 止まっている）

export function isSolid(id) {
  return TILE_INFO[id]?.solid ?? true;
}

// 町や どうくつの ASCII マップの 文字 → タイル
export const LEGEND = {
  '.': T.GRASS, ',': T.FLOWERS, '"': T.TALLGRASS, '=': T.DIRT, 's': T.SAND, '~': T.WATER, '%': T.DEEP,
  'T': T.TREE, 'P': T.PINE, 'M': T.MOUNTAIN, 'h': T.HILL, 'R': T.ROCK, '-': T.BRIDGE_H, '|': T.BRIDGE_V,
  ':': T.STONE_PATH, ';': T.PLAZA, '#': T.WALL_STONE, 'W': T.WALL_WOOD, '_': T.FLOOR_WOOD, '+': T.FLOOR_STONE,
  'D': T.DOOR, 'C': T.COUNTER, 't': T.TABLE, 'c': T.CHAIR, 'B': T.BED, 'S': T.SHELF, 'o': T.POT, 'O': T.BARREL,
  'w': T.WELL, 'Q': T.FOUNTAIN, 'F': T.FENCE, '!': T.SIGN, 'Y': T.STATUE, 'A': T.ALTAR, 'X': T.STAR_ALTAR,
  'r': T.CARPET, 'l': T.LAMP, 'H': T.HEDGE, 'f': T.FIREPLACE, 'k': T.BOOKSHELF, 'x': T.CRATE, '*': T.TOWN_FLOWERS,
  '>': T.STAIRS_DOWN, '<': T.STAIRS_UP, 'E': T.CAVE_ENTRANCE, 'z': T.SHRINE_FLOOR, 'j': T.PIER,
  // どうくつ
  'g': T.CAVE_FLOOR, 'G': T.CAVE_WALL, 'v': T.CAVE_WATER, 'y': T.CRYSTAL, 'i': T.TORCH, 'p': T.PILLAR,
  'L': T.LOCKED_DOOR, 'u': T.RUBBLE, 'b': T.BOSS_FLOOR, 'n': T.CAVE_BRIDGE, 'U': T.RUBBLE_WALL,
  '@': T.WHIRLPOOL,
  // 第3章（雪・氷・ようがん・鉱山・神殿）
  'a': T.SNOW, 'd': T.SNOW_PATH, 'N': T.DEEP_SNOW, 'e': T.SNOW_PINE, 'K': T.SNOW_ROCK, 'I': T.ICE, 'Z': T.ICE_BLOCK,
  'V': T.LAVA, '$': T.LAVA_FLOOR, '&': T.OBSIDIAN, '1': T.RAIL, '9': T.LEVER, '/': T.PLATE, '^': T.BRAZIER,
  '(': T.HOT_SPRING, '?': T.SNOW_WALL, '{': T.FLAME_WALL, '}': T.ASH, '[': T.MINE_BEAM, ')': T.ICE_WALL,
  ']': T.DRAGON_GATE, '`': T.CHASM, '2': T.RAIL_BRIDGE, '3': T.RAIL_STOP, 'm': T.ASH_ROCK,
  '6': T.BRAZIER_LIT, '7': T.PLATE_ON, '8': T.LEVER_ON,
  // 第4章（砂の国）: 0=砂ばく J=日干しれんがの かべ q=砂岩 4=ヤシの木 5=サボテン
  '0': T.DESERT, 'J': T.ADOBE, 'q': T.SANDSTONE, '4': T.PALM, '5': T.CACTUS,
};

// extra: その マップだけの 文字（LEGEND より 先に 見る。文字が 足りない 第4章からの ダンジョン）
export function parseRows(rows, extra = null) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const tiles = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x] ?? ' ';
      tiles[y * w + x] = extra?.[ch] ?? LEGEND[ch] ?? T.VOID;
    }
  }
  return { w, h, tiles };
}
