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
