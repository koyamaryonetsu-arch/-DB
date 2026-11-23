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
  // 第6章 Step 6「時計塔の心臓」（maps/tokei-high.js・render/tiles-tokei.js）。307 から
  PEND_FLOOR: 307, PEND_BLADE: 308, GEAR_N: 309, GEAR_S: 310, GEAR_STILL: 311, GEAR_CRANK: 312, GEAR_CRANK_ON: 313, GEAR_WEIGHT: 314,
  TIME_DOOR: 315, FACE_STARS: 316,
  // 第2部 第7章 Step 1・2「みどりの水の神殿」（maps/c7-temple.js・render/tiles-c7.js）。317 から
  C7_CUR_N: 317, C7_CUR_E: 318, C7_CUR_S: 319, C7_CUR_W: 320, C7_LOTUS: 321, C7_SAND: 322, C7_SPOUT_FLOOR: 323, C7_SPOUT: 324, C7_GUARD: 325,
  // 第2部 第7章 Step 3・4「しずむ前の島の灯台」と 千年前の クモイの 海（maps/c7s-light.js・c7s-sea.js・render/tiles-c7s.js）。326 から
  C7S_BOARD: 326, C7S_WET_SAND: 327, C7S_BELL: 328, C7S_WAVE_FLOOR: 329, C7S_WAVE: 330, C7S_KDOOR: 331, C7S_CABINET: 332,
  C7S_LAMP: 333, C7S_LAMP_ON: 334, C7S_DRY: 335, C7S_REEF: 336,
  // 第2部 第7章 Step 5・6「氷の竜の城」と 千年前の シロガネ地方（maps/c7i-castle.js・c7i-snow.js・render/tiles-c7i.js）。337 から
  C7I_THORN: 337, C7I_PUDDLE: 338, C7I_ICEBOX: 339, C7I_DDOOR: 340, C7I_ICICLE_FLOOR: 341, C7I_ICICLE: 342,
  // 第2部 第8章 第1幕「月の王宮の地下迷宮」（maps/c8a-palace.js・c8a-field.js・render/tiles-c8a.js）。343 から
  C8A_MIRROR_A: 343, C8A_MIRROR_B: 344, C8A_LIGHT: 345, C8A_DARKBRIDGE: 346, C8A_SANDRIVER: 347, C8A_DUNE: 348,
  C8A_MOONBOX: 349, C8A_MOONGATE: 350, C8A_SHADOWSEAL: 351, C8A_FALL_FLOOR: 352, C8A_SANDFALL: 353, C8A_SLAB: 354,
  // 第2部 第8章 第2幕「よみの海底神殿」（maps/c8b-temple.js・c8b-sea.js・render/tiles-c8b.js）。355 から
  C8B_BRAZIER: 355, C8B_BRAZIER_ON: 356, C8B_SPIRITWAY: 357, C8B_VOID: 358, C8B_SEAWATER: 359, C8B_SHELLBOX: 360,
  C8B_SHELLGATE: 361, C8B_FLAMEWALL: 362, C8B_GEYSER_FLOOR: 363, C8B_GEYSER: 364, C8B_WHIRL: 365, C8B_SHELLDOOR: 366,
  // 第2部 第8章 第3幕「くろがねの空中要塞」（maps/c8c-fort.js・c8c-field.js・render/tiles-c8c.js）。367 から
  C8C_SKY: 367, C8C_CRUSH: 368, C8C_TILT: 369, C8C_MOSS: 370, C8C_SLIDE_N: 371, C8C_SLIDE_E: 372, C8C_SLIDE_S: 373, C8C_SLIDE_W: 374,
  C8C_PROP_ON: 375, C8C_PROP_OFF: 376, C8C_CANNON_L: 377, C8C_CANNON_R: 378, C8C_SHUTTER_OPEN: 379, C8C_SHUTTER_SHUT: 380,
  C8C_ROOTS: 381, C8C_PLATE: 382, C8C_GAP: 383, C8C_MAILBOX: 384, C8C_LOCKDOOR: 385, C8C_BARRIER: 386, C8C_STEAM_FLOOR: 387, C8C_STEAM: 388,
  C8C_ANCHOR: 389, C8C_CHAIN: 390, C8C_WRECK: 391, C8C_WRECKDOOR: 392, C8C_HATCH: 393, C8C_CAGEBAR: 394,
  // 第2部 第8章 第4幕「時のはざま」（maps/c8r-*.js・render/tiles-c8r.js）。395 から
  C8R_VOID: 395, C8R_SANDFLOW: 396, C8R_FORD: 397, C8R_CREST: 398, C8R_CREST_MOON: 399, C8R_CREST_FIRE: 400, C8R_CREST_IRON: 401, C8R_CREST_ICE: 402,
  C8R_BIGDOOR: 403, C8R_WINGDOOR: 404, C8R_WISP: 405, C8R_RIFT: 406,
  // 第3部 第1章 第1幕「星ふるえの夜」（maps/c9a-*.js・render/tiles-c9a.js）。407〜426
  C9A_MOSS: 407, C9A_SOURCE: 408, C9A_CRYSTAL: 409, C9A_CRYSTAL_ON: 410, C9A_DOOR: 411, C9A_HOLE: 412, C9A_LOG: 413, C9A_SHARD: 414,
  C9A_STARROCK: 415, C9A_CRATER: 416, C9A_TENT: 417, C9A_BOARD: 418, C9A_CHALKDOOR: 419, C9A_ICEDOOR: 420, C9A_ROPE: 421,
  C9A_TRIALDOOR: 422, C9A_PEDESTAL: 423, C9A_LANTERN: 424, C9A_LANTERN_ON: 425, C9A_RIM: 426,
  // 第3部 第1章 第2幕「鉱山の底の先」（第91回 A班。427〜446）
  C9B_GROUND: 427, C9B_ROCK: 428, C9B_PILLAR: 429, C9B_PILLAR_ON: 430, C9B_MOSS: 431, C9B_VOID: 432, C9B_CLIFF: 433, C9B_SHAFT: 434,
  C9B_RIVER: 435, C9B_DOCK: 436, C9B_HUT: 437, C9B_LUMP: 438, C9B_LUMP_ON: 439, C9B_HALL: 440, C9B_HALLWALL: 441, C9B_TABLE: 442,
  C9B_BOX: 443, C9B_GATE: 444, C9B_CRATE: 445, C9B_LAMP: 446,
  // 第3部 第1章 第3幕「さかさのピラミッド」（第92回 A班。447〜470。maps/c9c*.js・render/tiles-c9c.js）
  C9C_CAVE: 447, C9C_BANK: 448, C9C_RIV_N: 449, C9C_RIV_E: 450, C9C_RIV_S: 451, C9C_RIV_W: 452, C9C_POOL: 453, C9C_RIVROCK: 454,
  C9C_DOCK: 455, C9C_WALL: 456, C9C_FLOOR: 457, C9C_HOLE: 458, C9C_HOLE_C: 459, C9C_STONE: 460, C9C_STONE_LOW: 461, C9C_PAD: 462,
  C9C_SHAFT: 463, C9C_SHAFT_UP: 464, C9C_FENCE: 465, C9C_FOUNT: 466, C9C_TABLET: 467,
  // 第3部 第1章 第4幕「星のはかば」（第93回 A班。471〜490。maps/c9d*.js・render/tiles-c9d.js）
  C9D_ROCK: 471, C9D_FLOOR: 472, C9D_CHASM: 473, C9D_BRIDGE: 474, C9D_ECHO: 475, C9D_LAMP: 476, C9D_MOSS: 477, C9D_DOOR: 478,
  C9D_DOOR_OPEN: 479, C9D_GRAVE: 480, C9D_HOLLOW: 481, C9D_HOLLOW_BIG: 482, C9D_GRAVE_ROCK: 483, C9D_TABLET: 484,
  // 第3部 第2章 第1幕「赤と緑」（第94回 A班。491〜520。maps/c10a*.js・render/tiles-c10a.js）
  C10A_ROAD: 491, C10A_WALL: 492, C10A_GLOW: 493, C10A_VINEWALL: 494, C10A_VINEWALL_OPEN: 495, C10A_ORB: 496,
  C10A_GROUND: 497, C10A_ROOTWALL: 498, C10A_GAP: 499, C10A_CLIFF: 500, C10A_BUD: 501, C10A_BUD_OPEN: 502, C10A_VINE: 503,
  C10A_LEAF: 504, C10A_SPROUT: 505, C10A_SHROOM: 506, C10A_LOOKOUT: 507, C10A_TREE: 508, C10A_HOLLOW: 509, C10A_ICEBUD: 510,
  C10A_FIREBLOOM: 511, C10A_HANGROOT: 512, C10A_STUMP: 513, C10A_SPORE: 514, C10A_ROOT_H: 515, C10A_ROOT_V: 516,
  // 第3部 第2章 第2幕「青と白」（第95回 A班。521〜550。maps/c10b*.js・render/tiles-c10b.js）
  C10B_WALL: 521, C10B_FLOOR0: 522, C10B_FLOOR1: 523, C10B_FLOOR2: 524, C10B_CLIFF: 525, C10B_WATER: 526, C10B_RAMP: 527,
  C10B_DIVE: 528, C10B_BELL: 529, C10B_FLOW_E: 530, C10B_FLOW_W: 531, C10B_TRENCH: 532, C10B_KEYSTONE: 533, C10B_DOOR: 534,
  C10B_WHIRL: 535, C10B_ICEBRIDGE: 536, C10B_ORB: 537, C10B_SAND: 538, C10B_SPRING: 539, C10B_ICEFLOOR: 540, C10B_ICEWALL: 541,
  C10B_SLIDE: 542, C10B_SNOWPILE: 543, C10B_THIN: 544, C10B_PILLAR: 545, C10B_MELTWALL: 546, C10B_MOONFLOOR: 547,
  C10B_LIGHTSTAIRS: 548, C10B_ICESTAIRS: 549, C10B_DEEP: 550,
  // 第3部 第2章 第3幕「紫と、うばわれた音」（第97回 A班。551〜590。maps/c10c*.js・render/tiles-c10c.js）
  C10C_ISLE: 551, C10C_BRIDGE_R: 552, C10C_BRIDGE_Y: 553, C10C_BRIDGE_G: 554, C10C_BRIDGE_B: 555, C10C_BRIDGE_W: 556,
  C10C_STONE: 557, C10C_RUIN: 558, C10C_RUINWALL: 559, C10C_FLOAT: 560, C10C_ORB: 561, C10C_VORTEX: 562,
  C10C_FWALL: 563, C10C_FFLOOR: 564, C10C_BELT_RN: 565, C10C_BELT_RE: 566, C10C_BELT_RS: 567, C10C_BELT_RW: 568,
  C10C_BELT_BN: 569, C10C_BELT_BE: 570, C10C_BELT_BS: 571, C10C_BELT_BW: 572, C10C_LEVER_R: 573, C10C_LEVER_R_ON: 574,
  C10C_LEVER_B: 575, C10C_LEVER_B_ON: 576, C10C_CRATES: 577, C10C_PUSHER: 578, C10C_JARS: 579, C10C_HALL: 580,
  C10C_BACKDOOR: 581, C10C_PORTAL: 582,
  // 第3部 第2章 第4幕「金の音と、星の橋」（第99回 A班。591〜620。maps/c10d*.js・render/tiles-c10d.js）
  C10D_STEP: 591, C10D_LANDING: 592, C10D_GATE: 593, C10D_GATE_OPEN: 594, C10D_WELL: 595, C10D_WELL_DRY: 596,
  C10D_SUMMIT: 597, C10D_ORB: 598, C10D_STARROCK: 599, C10D_GOLD: 600, C10D_SKYSTAIR: 601, C10D_PORTAL: 602,
  // 第3部 第3章 第1幕「星の船と、星座の島」（第100回 A班。621〜660。maps/c11a*.js・render/tiles-c11a.js）
  C11A_SEA: 621, C11A_CUR_N: 622, C11A_CUR_E: 623, C11A_CUR_S: 624, C11A_CUR_W: 625, C11A_SHOAL: 626, C11A_CLOUD: 627,
  C11A_ISLE: 628, C11A_PIER: 629, C11A_BRIDGE: 630, C11A_GATE: 631, C11A_GATE_OPEN: 632, C11A_GATEROCK: 633, C11A_MIST: 634,
  C11A_GROUND: 635, C11A_GRASS: 636, C11A_RIM: 637, C11A_SKY: 638, C11A_STAR: 639, C11A_LIGHT: 640, C11A_LIGHT_ON: 641,
  C11A_DOCK: 642, C11A_TREE: 643, C11A_TABLET: 644, C11A_HUT: 645, C11A_SPRING: 646, C11A_PATH: 647, C11A_LENS: 648, C11A_LENS_STAR: 649,
  // 第3部 第3章 第2幕「月の都と、名前のランプ」（第102回 A班。661〜700。maps/c11b*.js・render/tiles-c11b.js）
  C11B_F_PAVE: 661, C11B_F_WALL: 662, C11B_F_HOUSE: 663, C11B_F_CANAL: 664, C11B_B_PAVE: 665, C11B_B_WALL: 666, C11B_B_HOUSE: 667,
  C11B_B_RUBBLE: 668, C11B_DOOR: 669, C11B_SCALEGATE: 670, C11B_LAMPRACK: 671, C11B_LAMPHOOK: 672, C11B_FOUNT: 673, C11B_LANTERNWELL: 674,
  C11B_DOCK: 675, C11B_TOWERDOOR: 676, C11B_T_FLOOR_F: 677, C11B_T_WALL_F: 678, C11B_T_FLOOR_B: 679, C11B_T_WALL_B: 680,
  C11B_LIGHTFLOOR: 681, C11B_LIGHTFLOOR_ON: 682, C11B_SHUTDOOR: 683, C11B_OPENDOOR: 684, C11B_LAMP_A: 685, C11B_LAMP_A_ON: 686,
  C11B_LAMP_B: 687, C11B_LAMP_B_ON: 688, C11B_CHASM: 689, C11B_SHADOWBRIDGE: 690, C11B_SHELF: 691, C11B_TERRACE: 692, C11B_RAIL: 693,
  C11B_MOONROCK: 694, C11B_B_LANTERN: 695, C11B_F_FLOWER: 696, C11B_T_STAIRS_F: 697, C11B_T_STAIRS_B: 698,
  // 第3部 第3章 第3幕「はかりの回ろうと、ふたつの光」（第103回 A班。701〜740。maps/c11c*.js・render/tiles-c11c.js）
  C11C_FLOOR: 701, C11C_WALL: 702, C11C_PED_A: 703, C11C_PED_B: 704, C11C_PED_C: 705, C11C_PED_D: 706,
  C11C_FENCE_A: 707, C11C_FENCE_B: 708, C11C_FENCE_C: 709, C11C_FENCE_D: 710, C11C_FENCE_OFF: 711, C11C_GROOVE: 712, C11C_BRIDGE: 713,
  C11C_LANE: 714, C11C_STAIRS_UP: 715, C11C_STAIRS_DOWN: 716, C11C_HALLDOOR: 717, C11C_SPRING: 718, C11C_BIGDOOR: 719, C11C_BIGDOOR_OPEN: 720,
  C11C_CARPET: 721, C11C_PILLAR: 722, C11C_REST_FLOOR: 723,
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
// 第6章 Step 6「時計塔の心臓」（render/tiles-tokei.js）
def(T.PEND_FLOOR, 'pend_floor', { mapColor: '#6a5848' }); // ふりこの やいばが 通る ゆか（やいばが 向こうに ある 間は 歩ける）
def(T.PEND_BLADE, 'pend_blade', { solid: true, mapColor: '#b8bcc8' }); // ふりこの やいば（通れない）
def(T.GEAR_N, 'gear_n', { flow: [0, -1], anim: true, mapColor: '#b08a3a' }); // 歯車の ゆか（北へ 運ばれる）
def(T.GEAR_S, 'gear_s', { flow: [0, 1], anim: true, mapColor: '#b08a3a' }); // 歯車の ゆか（南へ 運ばれる）
def(T.GEAR_STILL, 'gear_still', { mapColor: '#8a6a2a' }); // 止めた 歯車の ゆか（歩ける）
def(T.GEAR_CRANK, 'gear_crank', { mapColor: '#c89a40' }); // 歯車の ハンドル（上に 立つと 針が 回る）
def(T.GEAR_CRANK_ON, 'gear_crank_on', { light: true, mapColor: '#f0c860' }); // 回っている ハンドル（人か おもりが のっている）
def(T.GEAR_WEIGHT, 'gear_weight', { solid: true, talkThrough: true, mapColor: '#5a5a66' }); // 歯車の おもり（しらべると 持てる）
def(T.TIME_DOOR, 'time_door', { solid: true, mapColor: '#6a5a9a' }); // 止まった時の間の とびら
def(T.FACE_STARS, 'face_stars', { solid: true, light: true, mapColor: '#3a3a7a' }); // 大時計の あと（星の 光に なった かべ）
// 第7章 Step 1・2: 千年前の 神殿の 流れる 水路（あさい 水。のると 流される）・はすの 葉・今の 水路に たまった 砂・水の ふき上げ・番人の 石像
def(T.C7_CUR_N, 'c7_cur_n', { flow: [0, -1], anim: true, mapColor: '#4aa0c8' }); // 流れる 水路（北へ 流される）
def(T.C7_CUR_E, 'c7_cur_e', { flow: [1, 0], anim: true, mapColor: '#4aa0c8' }); // 流れる 水路（東へ）
def(T.C7_CUR_S, 'c7_cur_s', { flow: [0, 1], anim: true, mapColor: '#4aa0c8' }); // 流れる 水路（南へ）
def(T.C7_CUR_W, 'c7_cur_w', { flow: [-1, 0], anim: true, mapColor: '#4aa0c8' }); // 流れる 水路（西へ）
def(T.C7_LOTUS, 'c7_lotus', { water: true, anim: true, mapColor: '#5aa860' }); // 水に うかぶ 大きな はすの 葉（歩ける）
def(T.C7_SAND, 'c7_sand', { solid: true, mapColor: '#c8a868' }); // 今の かれた 水路に たまった 砂の 山（通れない）
def(T.C7_SPOUT_FLOOR, 'c7_spout_floor', { mapColor: '#5a7a7a' }); // 水が ふき上げる あなの ある ゆか（水が 出ていない 間は 歩ける）
def(T.C7_SPOUT, 'c7_spout', { solid: true, anim: true, mapColor: '#9ad8f0' }); // ふき上げる 水の 柱（通れない）
def(T.C7_GUARD, 'c7_guard', { solid: true, mapColor: '#7a8a7a' }); // 神殿の 番人の 石像（石の 箱を かかえている）
// 第7章 Step 3・4: 灯台の うき板・引き潮の ぬれた 砂・しおの 鐘・大波・からくりの とびら・かべの 戸だな・灯台の 大ランプ・今の かわいた 海の そこ・サンゴの 岩
def(T.C7S_BOARD, 'c7s_board', { water: true, anim: true, mapColor: '#a8784a' }); // 満ち潮の 水に うかぶ 木の うき板（歩ける）
def(T.C7S_WET_SAND, 'c7s_wet_sand', { mapColor: '#b8a078' }); // 引き潮で 出てきた ぬれた 砂（歩ける）
def(T.C7S_BELL, 'c7s_bell', { solid: true, mapColor: '#d8b040' }); // しおの 鐘（しらべると しおが 満ちる・引く）
def(T.C7S_WAVE_FLOOR, 'c7s_wave_floor', { mapColor: '#6a8aa0' }); // 大波が うちよせる 通路（波が 来ていない 間は 歩ける）
def(T.C7S_WAVE, 'c7s_wave', { solid: true, anim: true, mapColor: '#bfe8f8' }); // うちよせる 大波（通れない）
def(T.C7S_KDOOR, 'c7s_kdoor', { solid: true, mapColor: '#7a5a3a' }); // さびた からくりの とびら（合言葉で 開く）
def(T.C7S_CABINET, 'c7s_cabinet', { solid: true, mapColor: '#8a6a4a' }); // かべの 小さな 戸だな（時をこえる手紙を 入れる）
def(T.C7S_LAMP, 'c7s_lamp', { solid: true, mapColor: '#8a8a9a' }); // 灯台の 大ランプ（火が 消えている）
def(T.C7S_LAMP_ON, 'c7s_lamp_on', { solid: true, anim: true, light: true, mapColor: '#ffe890' }); // 灯台の 大ランプ（火が ともっている）
def(T.C7S_DRY, 'c7s_dry', { mapColor: '#b8b0a0' }); // 今の かわいた 海の そこ（貝がらと サンゴの かけら。歩ける）
def(T.C7S_REEF, 'c7s_reef', { solid: true, water: true, anim: true, mapColor: '#e87a7a' }); // 海の 中の サンゴの 岩（通れない）
// 第7章 Step 5・6: 魔女の いばら・とけた 水たまり・氷の 箱・竜の とびら・つららの 落ちる ゆか・落ちてくる つらら
def(T.C7I_THORN, 'c7i_thorn', { solid: true, mapColor: '#3a2a4a' }); // いばらの魔女の 黒い いばら（通れない）
def(T.C7I_PUDDLE, 'c7i_puddle', { mapColor: '#8ab0c8' }); // 氷が とけた 水たまり（歩ける。すべって 来ると 止まる）
def(T.C7I_ICEBOX, 'c7i_icebox', { solid: true, mapColor: '#a8d8f0' }); // 氷の 箱（時をこえる手紙を 入れる）
def(T.C7I_DDOOR, 'c7i_ddoor', { solid: true, mapColor: '#6a7a9a' }); // しまった 竜の とびら（竜の 名前を よぶと 開く）
def(T.C7I_ICICLE_FLOOR, 'c7i_icicle_floor', { mapColor: '#7a8aa8' }); // つららが 落ちてくる ゆか（落ちていない 間は 歩ける）
def(T.C7I_ICICLE, 'c7i_icicle', { solid: true, anim: true, mapColor: '#d8f4ff' }); // 落ちてきた つらら（通れない）
// 第8章 第1幕: 月の 鏡（2つの むき）・月の 光の 橋・光の 当たらない 暗い 谷・千年前の 砂の 川・今の 砂山・月の 箱・月の 門・黒い 砂の かべ・砂の 滝・月の 石板
def(T.C8A_MIRROR_A, 'c8a_mirror_a', { solid: true, light: true, mapColor: '#d8e0f8' }); // 月の 鏡（むき「／」）
def(T.C8A_MIRROR_B, 'c8a_mirror_b', { solid: true, light: true, mapColor: '#d8e0f8' }); // 月の 鏡（むき「＼」）
def(T.C8A_LIGHT, 'c8a_light', { anim: true, light: true, mapColor: '#f4f0b8' }); // 月の 光の 橋（光が 当たっている 間は わたれる）
def(T.C8A_DARKBRIDGE, 'c8a_darkbridge', { solid: true, mapColor: '#1a1a34' }); // 光の 当たらない 橋の あと（暗い 谷。通れない）
def(T.C8A_SANDRIVER, 'c8a_sandriver', { solid: true, anim: true, mapColor: '#c89a50' }); // 千年前の 砂の 川（通れない）
def(T.C8A_DUNE, 'c8a_dune', { solid: true, mapColor: '#b08a50' }); // 今の 砂山（流れが 止まって つもった 砂。通れない）
def(T.C8A_MOONBOX, 'c8a_moonbox', { solid: true, mapColor: '#c8b878' }); // 月の 箱（時をこえる手紙を 入れる）
def(T.C8A_MOONGATE, 'c8a_moongate', { solid: true, mapColor: '#5a5a8a' }); // しまった 月の 門（王家の 言葉で 開く）
def(T.C8A_SHADOWSEAL, 'c8a_shadowseal', { solid: true, anim: true, mapColor: '#2a1a3a' }); // 大臣の 魔術の 黒い 砂の かべ（通れない）
def(T.C8A_FALL_FLOOR, 'c8a_fall_floor', { mapColor: '#8a7a5a' }); // 砂が ふってくる ゆか（ふっていない 間は 歩ける）
def(T.C8A_SANDFALL, 'c8a_sandfall', { solid: true, anim: true, mapColor: '#e8c880' }); // ふってくる 砂の 滝（通れない）
def(T.C8A_SLAB, 'c8a_slab', { solid: true, mapColor: '#8a8aa8' }); // 王の間の 月の もようの 石板（開くと 地下への かいだん）
// 第8章 第2幕: 青い 火の 台（火の ない 台・ともった 台）・よみの道（光の 中で 見える ゆか・光が ない 所）・千年前の 海の 水・貝の 箱・しおの とびら・
//   青い ほのおの かべ・青い 火の 柱（ふき出す ゆか・ふき出した 柱）・うずしおの岩場の 青い うず・雲から出てきた島の 貝の もようの 石の とびら
def(T.C8B_BRAZIER, 'c8b_brazier', { solid: true, mapColor: '#3a4a6a' }); // 火の ない 青い 火の 台（千年前で しらべると 火が ともる）
def(T.C8B_BRAZIER_ON, 'c8b_brazier_on', { solid: true, anim: true, light: true, mapColor: '#6ad8ff' }); // 青い 火が ともった 台（よみの 火は 千年 消えない）
def(T.C8B_SPIRITWAY, 'c8b_spiritway', { anim: true, light: true, mapColor: '#8ae0ff' }); // よみの道（青い 火の 光の 中で 見える ゆか。歩ける）
def(T.C8B_VOID, 'c8b_void', { solid: true, anim: true, mapColor: '#d8e4f4' }); // 光の ない よみの道（見えない。雲の 海。通れない）
def(T.C8B_SEAWATER, 'c8b_seawater', { solid: true, water: true, anim: true, mapColor: '#1a4a7a' }); // 千年前の 神殿に 入りこんだ 海の 水（通れない）
def(T.C8B_SHELLBOX, 'c8b_shellbox', { solid: true, mapColor: '#e8c8b8' }); // 貝の 箱（時をこえる手紙を 入れる）
def(T.C8B_SHELLGATE, 'c8b_shellgate', { solid: true, mapColor: '#6a8aa8' }); // しまった しおの とびら（海の 祝いの 言葉で 開く）
def(T.C8B_FLAMEWALL, 'c8b_flamewall', { solid: true, anim: true, light: true, mapColor: '#4ab8ff' }); // 青い ほのおの かべ（通れない）
def(T.C8B_GEYSER_FLOOR, 'c8b_geyser_floor', { mapColor: '#3a5a7a' }); // 青い 火が ふき出す ゆか（ふき出して いない 間は 歩ける）
def(T.C8B_GEYSER, 'c8b_geyser', { solid: true, anim: true, light: true, mapColor: '#8ae8ff' }); // ふき出した 青い 火の 柱（通れない）
def(T.C8B_WHIRL, 'c8b_whirl', { solid: true, anim: true, light: true, mapColor: '#2a6aa8' }); // うずしおの岩場の 青い うず（開くと 海の 底への かいだん）
def(T.C8B_SHELLDOOR, 'c8b_shelldoor', { solid: true, mapColor: '#c8b8a0' }); // 雲から出てきた島の 貝の もようの 石の とびら（開くと 下への かいだん）
// 第8章 第3幕: 千年前の 空（要塞の 外・ゆかの すきま）・今の つぶれた 鉄・かたむいた 鉄の 板（歩ける）・ゆかの あなの 森の 土（歩ける）・
//   今の かたむいた ゆか（すべる。北・東・南・西）・要塞の しかけ（プロペラ・たいほう・まどの シャッター。千年前で 動かす）・
//   今の 木の 根（かべの すきまを 通る）・千年前の ゆるんだ 鉄の 板（根の ある 所。すきまに なる）・鉄の ポスト・今の まほうの じょうの とびら・
//   まほうの かべ・ゆげの あな（ゆげ）・千年前の 森の いかり（くさり）・今の 森の 残がい（入口）・8階の まほうの おり
def(T.C8C_SKY, 'c8c_sky', { solid: true, anim: true, mapColor: '#a8d0f0' }); // 千年前の 空（要塞の 外・ゆかの すきま。通れない）
def(T.C8C_CRUSH, 'c8c_crush', { solid: true, mapColor: '#6a5040' }); // 今の つぶれた 鉄（通れない）
def(T.C8C_TILT, 'c8c_tilt', { mapColor: '#8a7a68' }); // 今の かたむいた 鉄の 板（歩ける）
def(T.C8C_MOSS, 'c8c_moss', { mapColor: '#5a8a48' }); // 今の ゆかの あなから 見える 森の 土（歩ける）
def(T.C8C_SLIDE_N, 'c8c_slide_n', { flow: [0, -1], anim: true, mapColor: '#9a8470' }); // 今の かたむいた ゆか（北へ すべる）
def(T.C8C_SLIDE_E, 'c8c_slide_e', { flow: [1, 0], anim: true, mapColor: '#9a8470' }); // 今の かたむいた ゆか（東へ すべる）
def(T.C8C_SLIDE_S, 'c8c_slide_s', { flow: [0, 1], anim: true, mapColor: '#9a8470' }); // 今の かたむいた ゆか（南へ すべる）
def(T.C8C_SLIDE_W, 'c8c_slide_w', { flow: [-1, 0], anim: true, mapColor: '#9a8470' }); // 今の かたむいた ゆか（西へ すべる）
def(T.C8C_PROP_ON, 'c8c_prop_on', { solid: true, anim: true, mapColor: '#b8b0a0' }); // まわる プロペラ
def(T.C8C_PROP_OFF, 'c8c_prop_off', { solid: true, mapColor: '#8a8478' }); // 止まった プロペラ
def(T.C8C_CANNON_L, 'c8c_cannon_l', { solid: true, mapColor: '#3a3a44' }); // 西を 向いた たいほう
def(T.C8C_CANNON_R, 'c8c_cannon_r', { solid: true, mapColor: '#3a3a44' }); // 東を 向いた たいほう
def(T.C8C_SHUTTER_OPEN, 'c8c_shutter_open', { solid: true, mapColor: '#8ac0e8' }); // 開いた まどの シャッター
def(T.C8C_SHUTTER_SHUT, 'c8c_shutter_shut', { solid: true, mapColor: '#5a5a62' }); // しまった まどの シャッター
def(T.C8C_ROOTS, 'c8c_roots', { solid: true, mapColor: '#6a4a2a' }); // 今の かべの すきまを 通る 木の 根（通れない）
def(T.C8C_PLATE, 'c8c_plate', { solid: true, mapColor: '#4a4a52' }); // 千年前の ゆるんだ 鉄の 板（根の ある 所。すきまを 見つけると 通れる）
def(T.C8C_GAP, 'c8c_gap', { mapColor: '#5a5048' }); // 千年前の かべの すきま（歩ける）
def(T.C8C_MAILBOX, 'c8c_mailbox', { solid: true, mapColor: '#c84a3a' }); // 鉄の ポスト（時をこえる手紙を 入れる）
def(T.C8C_LOCKDOOR, 'c8c_lockdoor', { solid: true, anim: true, light: true, mapColor: '#8a5ad8' }); // 今の まほうの じょうの とびら（合言葉で 開く）
def(T.C8C_BARRIER, 'c8c_barrier', { solid: true, anim: true, light: true, mapColor: '#c87ae8' }); // まほうの かべ（通れない）
def(T.C8C_STEAM_FLOOR, 'c8c_steam_floor', { mapColor: '#5a5a5a' }); // ゆげの あな（ふき出して いない 間は 歩ける）
def(T.C8C_STEAM, 'c8c_steam', { solid: true, anim: true, mapColor: '#f0f0f0' }); // ふき出した ゆげ（通れない）
def(T.C8C_ANCHOR, 'c8c_anchor', { solid: true, mapColor: '#4a4a52' }); // 千年前の 森に ささった 要塞の いかり（しらべると くさりを のぼれる）
def(T.C8C_CHAIN, 'c8c_chain', { mapColor: '#6a6a72' }); // 要塞へ のぼる いかりの くさり（歩ける。のぼると 要塞の 1階）
def(T.C8C_WRECK, 'c8c_wreck', { solid: true, mapColor: '#6a5a40' }); // 今の 森の 要塞の 残がい（こけの 鉄の 板。通れない）
def(T.C8C_WRECKDOOR, 'c8c_wreckdoor', { solid: true, mapColor: '#5a4a30' }); // 今の 残がいの しまった 出入り口
def(T.C8C_HATCH, 'c8c_hatch', { mapColor: '#3a3020' }); // 今の 残がいの 開いた 出入り口（歩ける）
def(T.C8C_CAGEBAR, 'c8c_cagebar', { solid: true, anim: true, light: true, mapColor: '#e8a8ff' }); // まほうの おり（通れない）
// 第8章 第4幕「時のはざま」（maps/c8r-*.js・render/tiles-c8r.js）
def(T.C8R_VOID, 'c8r_void', { solid: true, anim: true, mapColor: '#2a2050' }); // 時のはざまの 空（星と 砂が うずまく。通れない）
def(T.C8R_SANDFLOW, 'c8r_sandflow', { solid: true, anim: true, light: true, mapColor: '#d8b868' }); // 時の砂の 川（流れが 速くて 通れない）
def(T.C8R_FORD, 'c8r_ford', { anim: true, light: true, mapColor: '#f0d890' }); // 時の砂の 浅せ（わたると その 階の 時代が 入れかわる）
def(T.C8R_CREST, 'c8r_crest', { solid: true, talkThrough: true, mapColor: '#6a6a8a' }); // 時の広間の 紋章の 台（まだ 光って いない）
def(T.C8R_CREST_MOON, 'c8r_crest_moon', { solid: true, talkThrough: true, light: true, mapColor: '#f0e8a0' }); // 光る 紋章（月のつばさ・カリム）
def(T.C8R_CREST_FIRE, 'c8r_crest_fire', { solid: true, talkThrough: true, light: true, mapColor: '#7ad8ff' }); // 光る 紋章（青火のつばさ・カイ）
def(T.C8R_CREST_IRON, 'c8r_crest_iron', { solid: true, talkThrough: true, light: true, mapColor: '#c8b0f0' }); // 光る 紋章（くろがねのつばさ・ミナモ）
def(T.C8R_CREST_ICE, 'c8r_crest_ice', { solid: true, talkThrough: true, light: true, mapColor: '#c0f0ff' }); // 光る 紋章（氷のつばさ・リオン）
def(T.C8R_BIGDOOR, 'c8r_bigdoor', { solid: true, mapColor: '#8a7ab8' }); // 最後の 回廊の 大とびら（門番を たおすと 開く）
def(T.C8R_WINGDOOR, 'c8r_wingdoor', { anim: true, light: true, mapColor: '#e8d8ff' }); // つばさの 入口の 光の アーチ（歩ける）
def(T.C8R_WISP, 'c8r_wisp', { solid: true, anim: true, light: true, mapColor: '#8ae8ff' }); // にげる 青い 火（追いかけっこ）
def(T.C8R_RIFT, 'c8r_rift', { anim: true, light: true, mapColor: '#b89aff' }); // 時の さけめ（時の広間への 入口・近道。歩ける）
// 第3部 第1章 第1幕「星ふるえの夜」（光の輪・星ふるえの森・ながれ星のくぼ地・星の石の地下道）
def(T.C9A_MOSS, 'c9a_moss', { mapColor: '#3a4a3a' }); // 光る こけ（ふむと 光る。光って いるかは 光の輪の しくみ〈world/c9a-steps.js〉）
def(T.C9A_SOURCE, 'c9a_source', { solid: true, talkThrough: true, anim: true, light: true, mapColor: '#bff0ff' }); // 光の みなもと（大きな 水しょう）
def(T.C9A_CRYSTAL, 'c9a_crystal', { solid: true, talkThrough: true, mapColor: '#5a6a8a' }); // とびらの 水しょう（まだ 光って いない）
def(T.C9A_CRYSTAL_ON, 'c9a_crystal_on', { solid: true, talkThrough: true, light: true, mapColor: '#d8f8ff' }); // 光った とびらの 水しょう
def(T.C9A_DOOR, 'c9a_door', { solid: true, mapColor: '#6a6aa8' }); // 光の とびら（水しょうが 光ると 開く）
def(T.C9A_HOLE, 'c9a_hole', { mapColor: '#3a3446' }); // 見えない 穴（ゆかに 見える。光が とどくと 見える。落ちると 階の 入口へ）
def(T.C9A_LOG, 'c9a_log', { solid: true, mapColor: '#6a4a2a' }); // たおれた 木（星ふるえで たおれた）
def(T.C9A_SHARD, 'c9a_shard', { anim: true, light: true, mapColor: '#f8f0b0' }); // 光る かけら（拾える。ならびが 道しるべ）
def(T.C9A_STARROCK, 'c9a_starrock', { solid: true, talkThrough: true, anim: true, light: true, mapColor: '#f0e8c8' }); // ながれ星の 石（くぼ地の まん中）
def(T.C9A_CRATER, 'c9a_crater', { mapColor: '#6a5848' }); // くぼ地の ゆか（焼けた 土）
def(T.C9A_TENT, 'c9a_tent', { solid: true, mapColor: '#d8b878' }); // 職人の テント
def(T.C9A_BOARD, 'c9a_board', { solid: true, talkThrough: true, mapColor: '#2a4a3a' }); // 黒板（ひみつの 部屋 1）
def(T.C9A_CHALKDOOR, 'c9a_chalkdoor', { solid: true, mapColor: '#5a7a5a' }); // 黒板の とびら（先生の 流れの 職業で 開く）
def(T.C9A_ICEDOOR, 'c9a_icedoor', { solid: true, mapColor: '#a8e0f8' }); // こおった とびら（炎術士の 流れの 職業で とける）
def(T.C9A_ROPE, 'c9a_rope', { light: true, mapColor: '#c8a870' }); // 井戸の ひも（村の 井戸への 近道。歩ける）
def(T.C9A_TRIALDOOR, 'c9a_trialdoor', { solid: true, mapColor: '#8a7a6a' }); // ためしの とびら（ふくろうの もよう）
def(T.C9A_PEDESTAL, 'c9a_pedestal', { solid: true, talkThrough: true, light: true, mapColor: '#e8d8a8' }); // 星の音さの 台
def(T.C9A_LANTERN, 'c9a_lantern', { solid: true, talkThrough: true, mapColor: '#8a5a3a' }); // 祭りの ちょうちん（まだ 火が ない）
def(T.C9A_LANTERN_ON, 'c9a_lantern_on', { solid: true, talkThrough: true, light: true, mapColor: '#ffb84a' }); // 火の ともった ちょうちん
def(T.C9A_RIM, 'c9a_rim', { solid: true, mapColor: '#4a3626' }); // くぼ地の ふち（ながれ星が 落ちて もり上がった 焼けた 土）
// 第3部 第1章 第2幕「鉱山の底の先」（第91回 A班。大地の下・たてあな・ヒカリゴケの里・大王のやしき。明るさは world/c9b-steps.js・client/c9b-light.js）
def(T.C9B_GROUND, 'c9b_ground', { mapColor: '#3a3448' }); // 大地の下の ゆか（暗い 土）
def(T.C9B_ROCK, 'c9b_rock', { solid: true, mapColor: '#16141e' }); // 大地の下の 岩
def(T.C9B_PILLAR, 'c9b_pillar', { solid: true, talkThrough: true, mapColor: '#5a6a8a' }); // 水晶の 柱（まだ ともって いない）
def(T.C9B_PILLAR_ON, 'c9b_pillar_on', { solid: true, talkThrough: true, light: true, anim: true, mapColor: '#d8f8ff' }); // ともった 水晶の 柱
def(T.C9B_MOSS, 'c9b_moss', { mapColor: '#2e4a3a' }); // 光る こけの 原（ふむと しばらく 光る）
def(T.C9B_VOID, 'c9b_void', { solid: true, mapColor: '#05040a' }); // 大きな 空どう（足もとが ない）
def(T.C9B_CLIFF, 'c9b_cliff', { solid: true, mapColor: '#2a2430' }); // たてあなの 岩かべ
def(T.C9B_SHAFT, 'c9b_shaft', { mapColor: '#5a5060' }); // たてあなの 道
def(T.C9B_RIVER, 'c9b_river', { solid: true, water: true, anim: true, mapColor: '#1a3a5a' }); // 地下の 川
def(T.C9B_DOCK, 'c9b_dock', { mapColor: '#7a5a3a' }); // 船着き場（木の さんばし）
def(T.C9B_HUT, 'c9b_hut', { solid: true, mapColor: '#6a5a4a' }); // 地下の 民の 家（キノコの 形の 石の 家）
def(T.C9B_LUMP, 'c9b_lump', { solid: true, talkThrough: true, mapColor: '#4a4a3a' }); // 村の 明かりの 台（光る こけが ない）
def(T.C9B_LUMP_ON, 'c9b_lump_on', { solid: true, talkThrough: true, light: true, anim: true, mapColor: '#c8ffb0' }); // 村の 明かり（光る こけの 大きな かたまり）
def(T.C9B_HALL, 'c9b_hall', { mapColor: '#8a4a3a' }); // 大王のやしきの ゆか
def(T.C9B_HALLWALL, 'c9b_hallwall', { solid: true, mapColor: '#3a2a22' }); // 大王のやしきの かべ
def(T.C9B_TABLE, 'c9b_table', { solid: true, talkThrough: true, mapColor: '#b8884a' }); // ごちそうの テーブル
def(T.C9B_BOX, 'c9b_box', { solid: true, talkThrough: true, mapColor: '#d8a84a' }); // 村の ごちそうの はこ（食料庫）
def(T.C9B_GATE, 'c9b_gate', { solid: true, mapColor: '#a87a3a' }); // 大王のやしきの 門
def(T.C9B_CRATE, 'c9b_crate', { solid: true, mapColor: '#6a4a2a' }); // 食料庫の たる・からの はこ
def(T.C9B_LAMP, 'c9b_lamp', { solid: true, talkThrough: true, light: true, mapColor: '#b8f0a0' }); // 村の 小さな こけの 明かり
// 第3部 第1章 第3幕「さかさのピラミッド」（第92回 A班）
// 地下の川: 川の 流れ（flow。のると その むきへ 流される。いかだに 乗った 絵）・ゆるい 所（止まって 行き先を えらぶ）
// さかさのピラミッド: ゆかの あな（ふつうの 時は 通れない。さかさの 時は 天じょう … gate '@flip' で 459）・ぶら下がる 石（さかさの 時は かべ。ふつうの 時は 下を 通れる 461）・
//   さかさの 台（ふむと 向きが かわる）・ふきぬけ（砂の たき。ふつうは 下の 階・さかさは 上の 階へ。さかさの 時は 464）・ふちの さく（2階。番人に 勝つまで さかさの 人を とおさない）
def(T.C9C_CAVE, 'c9c_cave', { solid: true, mapColor: '#14121c' }); // 地下の川の 岩かべ
def(T.C9C_BANK, 'c9c_bank', { mapColor: '#3a3446' }); // 川岸（岩の 岸）
def(T.C9C_RIV_N, 'c9c_riv_n', { flow: [0, -1], anim: true, river: true, mapColor: '#1a3a5a' }); // 川の 流れ（北へ）
def(T.C9C_RIV_E, 'c9c_riv_e', { flow: [1, 0], anim: true, river: true, mapColor: '#1a3a5a' }); // 川の 流れ（東へ）
def(T.C9C_RIV_S, 'c9c_riv_s', { flow: [0, 1], anim: true, river: true, mapColor: '#1a3a5a' }); // 川の 流れ（南へ）
def(T.C9C_RIV_W, 'c9c_riv_w', { flow: [-1, 0], anim: true, river: true, mapColor: '#1a3a5a' }); // 川の 流れ（西へ）
def(T.C9C_POOL, 'c9c_pool', { anim: true, river: true, mapColor: '#24486a' }); // 流れが ゆるい 広い 所（いかだが 止まる）
def(T.C9C_RIVROCK, 'c9c_rivrock', { solid: true, mapColor: '#2a2834' }); // 川の 中の 岩（ぶつかると 止まる）
def(T.C9C_DOCK, 'c9c_dock', { mapColor: '#7a5a3a' }); // いかだ乗り場（木の さんばし）
def(T.C9C_WALL, 'c9c_wall', { solid: true, mapColor: '#6a5430' }); // さかさのピラミッドの かべ
def(T.C9C_FLOOR, 'c9c_floor', { mapColor: '#b89a5a' }); // ゆか（さかさの 時は 天じょう。色は テーマ）
def(T.C9C_HOLE, 'c9c_hole', { solid: true, mapColor: '#1a1208' }); // ゆかの あな（ふつうの 時は 通れない）
def(T.C9C_HOLE_C, 'c9c_hole_c', { mapColor: '#8a7a9a' }); // あなの 上の 天じょう（さかさの 時は 歩ける）
def(T.C9C_STONE, 'c9c_stone', { solid: true, mapColor: '#5a4a6a' }); // ぶら下がる 石（さかさの 時は かべ）
def(T.C9C_STONE_LOW, 'c9c_stone_low', { mapColor: '#a8905a' }); // ぶら下がる 石の 下（ふつうの 時は 通れる）
def(T.C9C_PAD, 'c9c_pad', { anim: true, mapColor: '#d8b0ff' }); // さかさの 台（ふむと 向きが かわる）
def(T.C9C_SHAFT, 'c9c_shaft', { anim: true, mapColor: '#e8c878' }); // ふきぬけ（砂の たき。ふつうの 時は 下の 階へ）
def(T.C9C_SHAFT_UP, 'c9c_shaft_up', { anim: true, mapColor: '#c8a8f0' }); // ふきぬけ（さかさの 時。砂が 上へ のぼる。上の 階へ）
def(T.C9C_FENCE, 'c9c_fence', { solid: true, mapColor: '#8a6a3a' }); // ふきぬけの ふちの さく（2階。さかさの 人だけ とおさない）
def(T.C9C_FOUNT, 'c9c_fount', { solid: true, talkThrough: true, anim: true, mapColor: '#6ac8f0' }); // 回復の いずみ（3階）
def(T.C9C_TABLET, 'c9c_tablet', { solid: true, talkThrough: true, mapColor: '#c8b078' }); // わらべ歌の 石の 板（3階）
// 第3部 第1章 第4幕「星のはかば」（第93回 A班。ふたごの道・星のはかば・ピラミッドの 岸の ひびきの とびら）
def(T.C9D_ROCK, 'c9d_rock', { solid: true, mapColor: '#1a1626' }); // ふたごの道の 岩かべ
def(T.C9D_FLOOR, 'c9d_floor', { mapColor: '#3a3450' }); // ふたごの道の ゆか
def(T.C9D_CHASM, 'c9d_chasm', { solid: true, mapColor: '#04030a' }); // 深い 谷（左右の 道の 間。橋が かかる 所も）
def(T.C9D_BRIDGE, 'c9d_bridge', { mapColor: '#8a6a9a' }); // 光の 橋（ひびきの石が 2つ 同時に 鳴ると かかる。かかった まま）
def(T.C9D_ECHO, 'c9d_echo', { solid: true, talkThrough: true, mapColor: '#9ad8ff' }); // ひびきの石（しらべると 鳴らせる）
def(T.C9D_LAMP, 'c9d_lamp', { solid: true, mapColor: '#c8a05a' }); // 道の ランプ（向こうの 道の 石が 鳴ると しばらく 光る）
def(T.C9D_MOSS, 'c9d_moss', { mapColor: '#2e4a40' }); // 光る こけ（ふむと 40歩 光る。第2幕と 同じ）
def(T.C9D_DOOR, 'c9d_door', { solid: true, mapColor: '#6a6a8a' }); // ひびきの とびら（ピラミッドの 岸の 岩かべ）
def(T.C9D_DOOR_OPEN, 'c9d_door_open', { mapColor: '#2a2440' }); // 開いた ひびきの とびら（ふたごの道へ）
def(T.C9D_GRAVE, 'c9d_grave', { mapColor: '#3a3e5a' }); // 星のはかばの 地面（しずかな 灰色の 砂）
def(T.C9D_HOLLOW, 'c9d_hollow', { solid: true, talkThrough: true, mapColor: '#8a8a9a' }); // 小さな くぼみと ねむる 星（灰色の 石）
def(T.C9D_HOLLOW_BIG, 'c9d_hollow_big', { solid: true, talkThrough: true, mapColor: '#0e0c1a' }); // いちばん 大きな くぼみ（中は から）
def(T.C9D_GRAVE_ROCK, 'c9d_grave_rock', { solid: true, mapColor: '#22223a' }); // はかばの まわりの 岩
def(T.C9D_TABLET, 'c9d_tablet', { solid: true, talkThrough: true, mapColor: '#9a96a8' }); // 古い 石の 文字
// 第3部 第2章 第1幕「赤と緑」（第94回 A班。炎の山の 下の 古い 道・大地の下の 根の国・今の マップに フラグで 出る 物）
def(T.C10A_ROAD, 'c10a_road', { mapColor: '#6a5048' }); // 古い 道の 石だたみ（昔の 人が 作った 道）
def(T.C10A_WALL, 'c10a_wall', { solid: true, mapColor: '#2a1612' }); // 古い 道の 岩かべ
def(T.C10A_GLOW, 'c10a_glow', { solid: true, anim: true, light: true, mapColor: '#a8341a' }); // 下の 方で 赤く 光る 溶岩（遠い。通れない）
def(T.C10A_VINEWALL, 'c10a_vinewall', { solid: true, talkThrough: true, mapColor: '#4a5a3a' }); // つるの からまった かべ（緑の 音で ひらく。おまけの 部屋）
def(T.C10A_VINEWALL_OPEN, 'c10a_vinewall_open', { mapColor: '#3a4a2e' }); // ひらいた つるの かべ
def(T.C10A_ORB, 'c10a_orb', { solid: true, talkThrough: true, anim: true, light: true, mapColor: '#ff5a2a' }); // 赤い 光の 玉（熱の 間）
def(T.C10A_GROUND, 'c10a_ground', { mapColor: '#215248' }); // 根の国の 地面（こけと 落ち葉）
def(T.C10A_ROOTWALL, 'c10a_rootwall', { solid: true, mapColor: '#4a3020' }); // 大きな 根の かべ
def(T.C10A_GAP, 'c10a_gap', { solid: true, mapColor: '#0e1a10' }); // 深い 谷（大きな 葉が のびると 橋）
def(T.C10A_CLIFF, 'c10a_cliff', { solid: true, mapColor: '#6a4a2a' }); // 高い 段の がけ（つるが のびると はしご）
def(T.C10A_BUD, 'c10a_bud', { solid: true, talkThrough: true, anim: true, mapColor: '#c8a0e8' }); // 音の つぼみ（星の音さで さく）
def(T.C10A_BUD_OPEN, 'c10a_bud_open', { solid: true, talkThrough: true, mapColor: '#e8a0d0' }); // さいた 音の つぼみ
def(T.C10A_VINE, 'c10a_vine', { mapColor: '#6ab04a' }); // のびた つる（がけを のぼる はしご）
def(T.C10A_LEAF, 'c10a_leaf', { mapColor: '#7ac85a' }); // のびた 大きな 葉（谷を わたる 橋）
def(T.C10A_SPROUT, 'c10a_sprout', { mapColor: '#5a8a3a' }); // きのこの め（まだ 小さい）
def(T.C10A_SHROOM, 'c10a_shroom', { mapColor: '#e06a5a' }); // のびた きのこ（ふむと 高い 所へ はねる）
def(T.C10A_LOOKOUT, 'c10a_lookout', { solid: true, talkThrough: true, mapColor: '#c8a878' }); // 見はらし台（しらべると 遠くまで 見える）
def(T.C10A_TREE, 'c10a_tree', { solid: true, mapColor: '#5a3a22' }); // 根の国の まん中の 大木の みき
def(T.C10A_HOLLOW, 'c10a_hollow', { mapColor: '#1a0e08' }); // 大木の うろ（通れる）
def(T.C10A_ICEBUD, 'c10a_icebud', { solid: true, talkThrough: true, mapColor: '#9ad8f0' }); // こおった つぼみ（赤の 音で 火の 花が さく。おまけ）
def(T.C10A_FIREBLOOM, 'c10a_firebloom', { anim: true, mapColor: '#ff8a3a' }); // さいた 火の 花（通れる）
def(T.C10A_HANGROOT, 'c10a_hangroot', { solid: true, talkThrough: true, mapColor: '#7a5a3a' }); // 天じょうから たれ下がる 大きな 根（大地の下の 西の がけ）
def(T.C10A_STUMP, 'c10a_stump', { mapColor: '#8a6a42' }); // 切りかぶの 近道（ささやきの森の ひらけた 所）
def(T.C10A_SPORE, 'c10a_spore', { mapColor: '#2e6c5c' }); // 光る 胞子の 草（根の国の 地面）
def(T.C10A_ROOT_H, 'c10a_root_h', { mapColor: '#4a3020' }); // 地面を はう 太い 根（よこ。上を 歩ける）
def(T.C10A_ROOT_V, 'c10a_root_v', { mapColor: '#4a3020' }); // 地面を はう 太い 根（たて。上を 歩ける）
// 第3部 第2章 第2幕「青と白」（第95回 A班）
// 青: 水鏡の うら（c10bRaft … 水の 上は いかだ。水の 高さで かわる すがたは maps/c10b.js の c10bCell）
def(T.C10B_WALL, 'c10b_wall', { solid: true, mapColor: '#1a3048' }); // 青い 石の かべ
def(T.C10B_FLOOR0, 'c10b_floor0', { mapColor: '#6a7a78' }); // 湖の 底（水が ぬけた 低い 所。ぬれた 石）
def(T.C10B_FLOOR1, 'c10b_floor1', { mapColor: '#7a96a8' }); // 中の 段（青い 石だたみ）
def(T.C10B_FLOOR2, 'c10b_floor2', { mapColor: '#a8c0cc' }); // 高い 岸（白っぽい 石）
def(T.C10B_CLIFF, 'c10b_cliff', { solid: true, mapColor: '#3a5068' }); // 高い 所の ふちの がけ（下からは 上れない）
def(T.C10B_WATER, 'c10b_water', { anim: true, c10bRaft: true, mapColor: '#2a7ac0' }); // 水（いかだで 進む）
def(T.C10B_RAMP, 'c10b_ramp', { mapColor: '#8aa0b0' }); // 坂（いつでも 上り下り できる）
def(T.C10B_DIVE, 'c10b_dive', { mapColor: '#c8e0f0' }); // 飛びこめる ふち（下が 水の 時だけ）
def(T.C10B_BELL, 'c10b_bell', { solid: true, talkThrough: true, light: true, mapColor: '#e0c060' }); // 音の 鐘（星の音で 水の 高さが かわる）
def(T.C10B_FLOW_E, 'c10b_flow_e', { flow: [1, 0], anim: true, c10bRaft: true, mapColor: '#3a9ad8' }); // 流れる 水路（東へ。中の 時だけ）
def(T.C10B_FLOW_W, 'c10b_flow_w', { flow: [-1, 0], anim: true, c10bRaft: true, mapColor: '#3a9ad8' }); // 流れる 水路（西へ。中の 時だけ）
def(T.C10B_TRENCH, 'c10b_trench', { solid: true, mapColor: '#14202c' }); // 水路の 穴（水が ない・天じょうまで 水の 時は 通れない）
def(T.C10B_KEYSTONE, 'c10b_keystone', { solid: true, talkThrough: true, light: true, mapColor: '#6ae0ff' }); // かぎの 石（湖の 底）
def(T.C10B_DOOR, 'c10b_door', { solid: true, talkThrough: true, mapColor: '#3a6a9a' }); // おくへの とびら（かぎの 石で 開く）
def(T.C10B_WHIRL, 'c10b_whirl', { solid: true, anim: true, talkThrough: true, mapColor: '#1a5a9a' }); // うず（白の 音で こおる。おまけ）
def(T.C10B_ICEBRIDGE, 'c10b_icebridge', { mapColor: '#d0f0ff' }); // こおった うずの 橋
def(T.C10B_ORB, 'c10b_orb', { solid: true, talkThrough: true, anim: true, light: true, mapColor: '#3a8aff' }); // 青い 光の 玉（かれた 間）
def(T.C10B_SAND, 'c10b_sand', { mapColor: '#c8b080' }); // かれた 間の ゆか（水が 砂に なった）
def(T.C10B_SPRING, 'c10b_spring', { anim: true, light: true, mapColor: '#6ac0ff' }); // わき水（水鏡の 広間への 近道）
// 白: 白銀の湖の 氷の 下（こっそり）
def(T.C10B_ICEFLOOR, 'c10b_icefloor', { mapColor: '#9ab8d0' }); // 氷の 下の ゆか（すべらない）
def(T.C10B_ICEWALL, 'c10b_icewall', { solid: true, mapColor: '#4a6a90' }); // 氷の かべ
def(T.C10B_SLIDE, 'c10b_slide', { slide: true, mapColor: '#c8e8ff' }); // すべる 氷（見はりの 目の 前を 一気に ぬけられる）
def(T.C10B_SNOWPILE, 'c10b_snowpile', { mapColor: '#f4f8ff' }); // 雪の 山（中に 入ると 見はりに 見えない）
def(T.C10B_THIN, 'c10b_thin', { mapColor: '#b0d0e8' }); // うすい 氷（ふむと 大きな 音）
def(T.C10B_PILLAR, 'c10b_pillar', { solid: true, mapColor: '#6a9ac8' }); // 氷の 柱（見はりの フクロウが とまる・かげに かくれる）
def(T.C10B_MELTWALL, 'c10b_meltwall', { solid: true, talkThrough: true, mapColor: '#8ac8f0' }); // 青の 音で とける 氷の かべ（おまけ）
def(T.C10B_MOONFLOOR, 'c10b_moonfloor', { mapColor: '#b8c8e0' }); // 月の 間の ゆか（月の 光）
def(T.C10B_LIGHTSTAIRS, 'c10b_lightstairs', { light: true, anim: true, mapColor: '#d8f0ff' }); // 夜の 湖の 光の 階段（氷の 下へ）
def(T.C10B_ICESTAIRS, 'c10b_icestairs', { mapColor: '#c0e8ff' }); // 岸への 氷の 階段（月の 間へ）
def(T.C10B_DEEP, 'c10b_deep', { anim: true, c10bRaft: true, mapColor: '#1a5aa0' }); // ふかい 水（いかだで 進む）
// 第3部 第2章 第3幕「紫と、うばわれた音」（第97回 A班）
// 空の 小島（下は 雲の 海 T.CLOUD_SEA。小島の ふちは かべと 同じで 落ちない）
def(T.C10C_ISLE, 'c10c_isle', { mapColor: '#9ac87a' }); // 空の 小島の 地面
def(T.C10C_BRIDGE_R, 'c10c_bridge_r', { anim: true, light: true, mapColor: '#ff7a7a' }); // 光の 橋（赤・レ）
def(T.C10C_BRIDGE_Y, 'c10c_bridge_y', { anim: true, light: true, mapColor: '#ffe070' }); // 光の 橋（黄・ミ）
def(T.C10C_BRIDGE_G, 'c10c_bridge_g', { anim: true, light: true, mapColor: '#7ae08a' }); // 光の 橋（緑・ファ）
def(T.C10C_BRIDGE_B, 'c10c_bridge_b', { anim: true, light: true, mapColor: '#7ab8ff' }); // 光の 橋（青・ソ）
def(T.C10C_BRIDGE_W, 'c10c_bridge_w', { anim: true, light: true, mapColor: '#f4f8ff' }); // 光の 橋（白・ラ）
def(T.C10C_STONE, 'c10c_stone', { solid: true, talkThrough: true, light: true, mapColor: '#c8b8e8' }); // 橋の 石（星の音を 鳴らすと 光の 橋）
def(T.C10C_RUIN, 'c10c_ruin', { mapColor: '#b8b0c8' }); // うかぶ いせきの 石だたみ
def(T.C10C_RUINWALL, 'c10c_ruinwall', { solid: true, mapColor: '#6a6080' }); // くずれた 柱
def(T.C10C_FLOAT, 'c10c_float', { solid: true, mapColor: '#8a80a8' }); // うき石（かざり）
def(T.C10C_ORB, 'c10c_orb', { solid: true, talkThrough: true, anim: true, light: true, mapColor: '#a86ae0' }); // 紫の 光の 玉
def(T.C10C_VORTEX, 'c10c_vortex', { solid: true, talkThrough: true, anim: true, light: true, mapColor: '#c8a8ff' }); // 光の うず（しらべると 竜が 乗せて くれる）
// 少年の とりで（ベルトの 工場）
def(T.C10C_FWALL, 'c10c_fwall', { solid: true, mapColor: '#2a2438' }); // とりでの かべ
def(T.C10C_FFLOOR, 'c10c_ffloor', { mapColor: '#5a5468' }); // とりでの ゆか（鉄の 板）
def(T.C10C_BELT_RN, 'c10c_belt_rn', { flow: [0, -1], anim: true, c10cBelt: 'red', mapColor: '#8a4a4a' }); // 流れる ベルト（赤の しるし・北へ）
def(T.C10C_BELT_RE, 'c10c_belt_re', { flow: [1, 0], anim: true, c10cBelt: 'red', mapColor: '#8a4a4a' }); // （東へ）
def(T.C10C_BELT_RS, 'c10c_belt_rs', { flow: [0, 1], anim: true, c10cBelt: 'red', mapColor: '#8a4a4a' }); // （南へ）
def(T.C10C_BELT_RW, 'c10c_belt_rw', { flow: [-1, 0], anim: true, c10cBelt: 'red', mapColor: '#8a4a4a' }); // （西へ）
def(T.C10C_BELT_BN, 'c10c_belt_bn', { flow: [0, -1], anim: true, c10cBelt: 'blue', mapColor: '#4a5a8a' }); // 流れる ベルト（青の しるし・北へ）
def(T.C10C_BELT_BE, 'c10c_belt_be', { flow: [1, 0], anim: true, c10cBelt: 'blue', mapColor: '#4a5a8a' }); // （東へ）
def(T.C10C_BELT_BS, 'c10c_belt_bs', { flow: [0, 1], anim: true, c10cBelt: 'blue', mapColor: '#4a5a8a' }); // （南へ）
def(T.C10C_BELT_BW, 'c10c_belt_bw', { flow: [-1, 0], anim: true, c10cBelt: 'blue', mapColor: '#4a5a8a' }); // （西へ）
def(T.C10C_LEVER_R, 'c10c_lever_r', { solid: true, talkThrough: true, mapColor: '#d05a4a' }); // 赤の レバー
def(T.C10C_LEVER_R_ON, 'c10c_lever_r_on', { solid: true, talkThrough: true, mapColor: '#d05a4a' }); // 赤の レバー（引いた）
def(T.C10C_LEVER_B, 'c10c_lever_b', { solid: true, talkThrough: true, mapColor: '#4a7ad0' }); // 青の レバー
def(T.C10C_LEVER_B_ON, 'c10c_lever_b_on', { solid: true, talkThrough: true, mapColor: '#4a7ad0' }); // 青の レバー（引いた）
def(T.C10C_CRATES, 'c10c_crates', { solid: true, mapColor: '#8a6a4a' }); // 星の かけらの 箱の 山
def(T.C10C_PUSHER, 'c10c_pusher', { anim: true, c10cPush: true, mapColor: '#b08a5a' }); // おし出される 箱（ふれると 1マス もどされる だけ）
def(T.C10C_JARS, 'c10c_jars', { solid: true, light: true, mapColor: '#8a7ab8' }); // 光の びんの たな（少年の 間）
def(T.C10C_HALL, 'c10c_hall', { mapColor: '#3a3050' }); // 少年の 間の ゆか
def(T.C10C_BACKDOOR, 'c10c_backdoor', { mapColor: '#4a3a2a' }); // とりでの うら口（大地の下の 東の はし）
def(T.C10C_PORTAL, 'c10c_portal', { anim: true, light: true, mapColor: '#d0b0ff' }); // 光の 出口（少年の 間 → うら口）
// 第3部 第2章 第4幕「金の音と、星の橋」（第99回 A班。maps/c10d*.js・render/tiles-c10d.js。下の 雲の 海は 第5章の T.CLOUD_SEA）
def(T.C10D_STEP, 'c10d_step', { anim: true, light: true, mapColor: '#e8e0b0' }); // 星の 階段の 段（光の 板）
def(T.C10D_LANDING, 'c10d_landing', { light: true, mapColor: '#c8c0e0' }); // おどり場（星の 石の ゆか）
def(T.C10D_GATE, 'c10d_gate', { solid: true, talkThrough: true, light: true, mapColor: '#d8c060' }); // 門（番人に 勝つと 開く）
def(T.C10D_GATE_OPEN, 'c10d_gate_open', { light: true, mapColor: '#f0e0a0' }); // 開いた 門（開いた まま）
def(T.C10D_WELL, 'c10d_well', { solid: true, talkThrough: true, anim: true, light: true, mapColor: '#9ad8ff' }); // 星の いずみ（3つの めぐみから 1つ）
def(T.C10D_WELL_DRY, 'c10d_well_dry', { solid: true, talkThrough: true, mapColor: '#8a88a8' }); // えらんだ あとの 星の いずみ（しずか）
def(T.C10D_SUMMIT, 'c10d_summit', { light: true, mapColor: '#d8d0f0' }); // いただきの ゆか
def(T.C10D_ORB, 'c10d_orb', { solid: true, talkThrough: true, anim: true, light: true, mapColor: '#ffd84a' }); // 金色の 光の 玉
def(T.C10D_STARROCK, 'c10d_starrock', { solid: true, light: true, mapColor: '#a8a0d0' }); // いただきの ふちの 光る 石
def(T.C10D_GOLD, 'c10d_gold', { anim: true, light: true, mapColor: '#ffd84a' }); // 金色に 光る 星の ゆか（星の塔 1階 ⇔ てっぺん）
def(T.C10D_SKYSTAIR, 'c10d_skystair', { anim: true, light: true, mapColor: '#fff0a0' }); // 空へ のびる 光の 階段（てっぺん → 星の 階段）
def(T.C10D_PORTAL, 'c10d_portal', { anim: true, light: true, mapColor: '#ffe8a0' }); // 光の 出口（いただき → 星の塔の てっぺん）
// 第3部 第3章 第1幕「星の船と、星座の島」（第100回 A班。maps/c11a*.js・render/tiles-c11a.js）
// 星の海: 船で すすむ（sail）。星の 流れ（flow。のると 止まる 所まで 運ばれる）・あさせ（星の すな。通れない）・雲（通れない）
def(T.C11A_SEA, 'c11a_sea', { solid: true, sail: true, anim: true, mapColor: '#2a3478' }); // 星の海（しずかな 海）
def(T.C11A_CUR_N, 'c11a_cur_n', { solid: true, sail: true, flow: [0, -1], anim: true, mapColor: '#5a70d0' }); // 星の 流れ（北へ）
def(T.C11A_CUR_E, 'c11a_cur_e', { solid: true, sail: true, flow: [1, 0], anim: true, mapColor: '#5a70d0' }); // 星の 流れ（東へ）
def(T.C11A_CUR_S, 'c11a_cur_s', { solid: true, sail: true, flow: [0, 1], anim: true, mapColor: '#5a70d0' }); // 星の 流れ（南へ）
def(T.C11A_CUR_W, 'c11a_cur_w', { solid: true, sail: true, flow: [-1, 0], anim: true, mapColor: '#5a70d0' }); // 星の 流れ（西へ）
def(T.C11A_SHOAL, 'c11a_shoal', { solid: true, anim: true, mapColor: '#c8c0e8' }); // あさせ（星の すな。船では 通れない）
def(T.C11A_CLOUD, 'c11a_cloud', { solid: true, anim: true, mapColor: '#9aa4d0' }); // 雲（星の海の 下の 雲。すき間に 小さな 地上）
def(T.C11A_ISLE, 'c11a_isle', { solid: true, mapColor: '#6a6aa0' }); // 島（星の海から 見た 島の 岩）
def(T.C11A_PIER, 'c11a_pier', { mapColor: '#c8a070' }); // はとば（ふむと 島へ）
def(T.C11A_BRIDGE, 'c11a_bridge', { anim: true, light: true, mapColor: '#fff0a0' }); // 光の 橋の 先（ふむと 星見の丘へ）
def(T.C11A_GATE, 'c11a_gate', { solid: true, talkThrough: true, anim: true, light: true, mapColor: '#e8d890' }); // 星座の門（とじて いる）
def(T.C11A_GATE_OPEN, 'c11a_gate_open', { solid: true, sail: true, anim: true, light: true, mapColor: '#fff4c0' }); // 開いた 星座の門（むこうは まだ 星の きり）
def(T.C11A_GATEROCK, 'c11a_gaterock', { solid: true, light: true, mapColor: '#7a74b0' }); // 門の 岩（星の 柱）
def(T.C11A_MIST, 'c11a_mist', { solid: true, anim: true, mapColor: '#b8b8d8' }); // 星の きり（門の むこう。この 幕では 通れない）
// 星座の 島・とまり木の島: 地面・星の 草・ふち・空（星座の 線は 空の 上）・星（ひとふで書きの 星。ここだけ 立てる）
def(T.C11A_GROUND, 'c11a_ground', { mapColor: '#8a86b8' }); // 島の 地面（うかぶ 岩）
def(T.C11A_GRASS, 'c11a_grass', { mapColor: '#6a9a9a' }); // 星の 草
def(T.C11A_RIM, 'c11a_rim', { solid: true, mapColor: '#4a4878' }); // 島の ふち（岩の かべ）
def(T.C11A_SKY, 'c11a_sky', { solid: true, anim: true, mapColor: '#141a44' }); // 空（通れない。星座の 線は この 上）
def(T.C11A_STAR, 'c11a_star', { anim: true, light: true, mapColor: '#fff0a0' }); // 星座の 星（うかぶ 星の 石）
def(T.C11A_LIGHT, 'c11a_light', { solid: true, talkThrough: true, mapColor: '#8a88a8' }); // 島の 明かり（まだ ともって いない）
def(T.C11A_LIGHT_ON, 'c11a_light_on', { solid: true, talkThrough: true, anim: true, light: true, mapColor: '#ffe070' }); // ともった 島の 明かり
def(T.C11A_DOCK, 'c11a_dock', { mapColor: '#b88a5a' }); // 船着き場（ふむと 星の海へ）
def(T.C11A_TREE, 'c11a_tree', { solid: true, mapColor: '#4a7a8a' }); // 星の 木
def(T.C11A_TABLET, 'c11a_tablet', { solid: true, talkThrough: true, mapColor: '#9a98c0' }); // 石ぶみ（島の きまり）
def(T.C11A_HUT, 'c11a_hut', { solid: true, mapColor: '#7a6a9a' }); // とまり木の島の 小さな 家
def(T.C11A_SPRING, 'c11a_spring', { solid: true, talkThrough: true, anim: true, light: true, mapColor: '#9ad8ff' }); // いのりの いずみ（教会の かわり）
def(T.C11A_PATH, 'c11a_path', { mapColor: '#a8a0c8' }); // とまり木の島の 道
// 灯台島（風の海）: レンズが ゆかに うつした 星座（光の ゆか。通れない）と その 星
def(T.C11A_LENS, 'c11a_lens', { solid: true, anim: true, light: true, mapColor: '#9ab8e8' }); // うつった 星座の 光の ゆか
def(T.C11A_LENS_STAR, 'c11a_lens_star', { anim: true, light: true, mapColor: '#fff0a0' }); // うつった 星座の 星（立てる）
// 第3部 第3章 第2幕「月の都と、名前のランプ」（第102回 A班。maps/c11b*.js・render/tiles-c11b.js）
// 月の都: おもて（明るい 白と 銀。水路は 通れない）と うら（暗くて あたたかい 明かり。がらくたは 通れない）。同じ 形の 町が 2まい
def(T.C11B_F_PAVE, 'c11b_f_pave', { mapColor: '#e8e4f8' }); // おもての 石だたみ
def(T.C11B_F_WALL, 'c11b_f_wall', { solid: true, mapColor: '#a8a4c8' }); // おもての 白い かべ
def(T.C11B_F_HOUSE, 'c11b_f_house', { solid: true, mapColor: '#c8c0e8' }); // おもての 家
def(T.C11B_F_CANAL, 'c11b_f_canal', { solid: true, anim: true, mapColor: '#7ab0e8' }); // おもての 水路（通れない。うらは 道）
def(T.C11B_B_PAVE, 'c11b_b_pave', { mapColor: '#6a5048' }); // うらの 石だたみ
def(T.C11B_B_WALL, 'c11b_b_wall', { solid: true, mapColor: '#2a2028' }); // うらの かべ
def(T.C11B_B_HOUSE, 'c11b_b_house', { solid: true, mapColor: '#4a3438' }); // うらの 小屋
def(T.C11B_B_RUBBLE, 'c11b_b_rubble', { solid: true, mapColor: '#3a2c28' }); // うらの がらくた（通れない。おもては 道）
def(T.C11B_DOOR, 'c11b_door', { anim: true, light: true, mapColor: '#ffe890' }); // 月かげの 戸（乗って A で、同じ 場所の もう 片方へ）
def(T.C11B_SCALEGATE, 'c11b_scalegate', { solid: true, talkThrough: true, light: true, mapColor: '#f0e0a0' }); // はかりの門（とじて いる）
def(T.C11B_LAMPRACK, 'c11b_lamprack', { solid: true, talkThrough: true, anim: true, light: true, mapColor: '#fff0a0' }); // 名前の ランプの 台
def(T.C11B_LAMPHOOK, 'c11b_lamphook', { solid: true, talkThrough: true, mapColor: '#b8b0d0' }); // ランプの ない かぎ
def(T.C11B_FOUNT, 'c11b_fount', { solid: true, talkThrough: true, anim: true, light: true, mapColor: '#a8d8ff' }); // おもての 月の いずみ（回復）
def(T.C11B_LANTERNWELL, 'c11b_lanternwell', { solid: true, talkThrough: true, anim: true, light: true, mapColor: '#ffb060' }); // うらの ともしびの 井戸（回復）
def(T.C11B_DOCK, 'c11b_dock', { mapColor: '#c8b0e0' }); // 都の はとば（ふむと 星の海へ）
def(T.C11B_TOWERDOOR, 'c11b_towerdoor', { anim: true, light: true, mapColor: '#fff8d0' }); // 名前の 塔の 入口
// 名前の 塔: おもて（白い 石）・うら（暗い 石）。光の ゆか（おもて）→ うらの 同じ 場所の とびら。ランプ（おもて）→ うらの かげの 橋
def(T.C11B_T_FLOOR_F, 'c11b_t_floor_f', { mapColor: '#d8d4f0' }); // 塔の ゆか（おもて）
def(T.C11B_T_WALL_F, 'c11b_t_wall_f', { solid: true, mapColor: '#8a86b8' }); // 塔の かべ（おもて）
def(T.C11B_T_FLOOR_B, 'c11b_t_floor_b', { mapColor: '#5a4458' }); // 塔の ゆか（うら）
def(T.C11B_T_WALL_B, 'c11b_t_wall_b', { solid: true, mapColor: '#221822' }); // 塔の かべ（うら）
def(T.C11B_LIGHTFLOOR, 'c11b_lightfloor', { anim: true, light: true, mapColor: '#b8e0ff' }); // 月の 光の ゆか（まだ ふんで いない）
def(T.C11B_LIGHTFLOOR_ON, 'c11b_lightfloor_on', { anim: true, light: true, mapColor: '#fff8c0' }); // ふんだ 光の ゆか
def(T.C11B_SHUTDOOR, 'c11b_shutdoor', { solid: true, mapColor: '#3a2a3a' }); // うらの とじた とびら
def(T.C11B_OPENDOOR, 'c11b_opendoor', { light: true, mapColor: '#ffd890' }); // うらの 開いた とびら
def(T.C11B_LAMP_A, 'c11b_lamp_a', { solid: true, talkThrough: true, mapColor: '#6a7ab8' }); // 青い ランプ（消えて いる）
def(T.C11B_LAMP_A_ON, 'c11b_lamp_a_on', { solid: true, talkThrough: true, anim: true, light: true, mapColor: '#8ad0ff' }); // ともった 青い ランプ
def(T.C11B_LAMP_B, 'c11b_lamp_b', { solid: true, talkThrough: true, mapColor: '#a88a5a' }); // 金の ランプ（消えて いる）
def(T.C11B_LAMP_B_ON, 'c11b_lamp_b_on', { solid: true, talkThrough: true, anim: true, light: true, mapColor: '#ffd860' }); // ともった 金の ランプ
def(T.C11B_CHASM, 'c11b_chasm', { solid: true, anim: true, mapColor: '#0a060e' }); // うらの かげの 谷（通れない）
def(T.C11B_SHADOWBRIDGE, 'c11b_shadowbridge', { anim: true, mapColor: '#8a6a9a' }); // かげの 橋
def(T.C11B_SHELF, 'c11b_shelf', { solid: true, talkThrough: true, mapColor: '#7a6a5a' }); // 消された ランプの たな
def(T.C11B_TERRACE, 'c11b_terrace', { light: true, mapColor: '#e0dcf8' }); // 塔の 上の テラス
def(T.C11B_RAIL, 'c11b_rail', { solid: true, mapColor: '#b8b4d8' }); // テラスの 手すり（空の 上）
def(T.C11B_MOONROCK, 'c11b_moonrock', { solid: true, light: true, mapColor: '#f0e0a0' }); // 星の海から 見た 月の都（三日月の 岩と 白い 塔）
def(T.C11B_B_LANTERN, 'c11b_b_lantern', { solid: true, anim: true, light: true, mapColor: '#ffa050' }); // うらの ちょうちん
def(T.C11B_F_FLOWER, 'c11b_f_flower', { solid: true, mapColor: '#d8c8f0' }); // おもての 花だん
def(T.C11B_T_STAIRS_F, 'c11b_t_stairs_f', { light: true, mapColor: '#ffffff' }); // 塔の 階段（おもて）
def(T.C11B_T_STAIRS_B, 'c11b_t_stairs_b', { light: true, mapColor: '#c89a70' }); // 塔の 階段（うら）

// 第3部 第3章 第3幕「はかりの回ろうと、ふたつの光」（第103回 A班。maps/c11c*.js・render/tiles-c11c.js）
// ・かげの 台（4色）: 立って A で アルゴルが 来る。同じ 色の 光の さくを、まわりの 輪の 中だけ 食べる
// ・光の さく（4色。とおれない）は とびら（gates）で 食べられた さく（とおれる）に かわる。スピカの 光の 橋は みぞの 上に かかる
def(T.C11C_FLOOR, 'c11c_floor', { mapColor: '#4a4060' }); // 回ろうの ゆか
def(T.C11C_WALL, 'c11c_wall', { solid: true, mapColor: '#1a1428' }); // 回ろうの かべ
def(T.C11C_PED_A, 'c11c_ped_a', { light: true, mapColor: '#5a8aff' }); // かげの 台（青）
def(T.C11C_PED_B, 'c11c_ped_b', { light: true, mapColor: '#5ad870' }); // かげの 台（緑）
def(T.C11C_PED_C, 'c11c_ped_c', { light: true, mapColor: '#ff6a6a' }); // かげの 台（赤）
def(T.C11C_PED_D, 'c11c_ped_d', { light: true, mapColor: '#ffd84a' }); // かげの 台（黄）
def(T.C11C_FENCE_A, 'c11c_fence_a', { solid: true, anim: true, light: true, mapColor: '#9ab8ff' }); // 光の さく（青）
def(T.C11C_FENCE_B, 'c11c_fence_b', { solid: true, anim: true, light: true, mapColor: '#9af0a8' }); // 光の さく（緑）
def(T.C11C_FENCE_C, 'c11c_fence_c', { solid: true, anim: true, light: true, mapColor: '#ffa8a8' }); // 光の さく（赤）
def(T.C11C_FENCE_D, 'c11c_fence_d', { solid: true, anim: true, light: true, mapColor: '#fff0a0' }); // 光の さく（黄）
def(T.C11C_FENCE_OFF, 'c11c_fence_off', { mapColor: '#3a3450' }); // 食べられた さく（とおれる）
def(T.C11C_GROOVE, 'c11c_groove', { solid: true, anim: true, mapColor: '#06040c' }); // 回ろうの みぞ（とおれない）
def(T.C11C_BRIDGE, 'c11c_bridge', { anim: true, light: true, mapColor: '#f0f0ff' }); // スピカの 光の 橋
def(T.C11C_LANE, 'c11c_lane', { mapColor: '#6a4a5a' }); // 見はりの カードの 通り道
def(T.C11C_STAIRS_UP, 'c11c_stairs_up', { light: true, mapColor: '#ffffff' }); // 上への 階段
def(T.C11C_STAIRS_DOWN, 'c11c_stairs_down', { mapColor: '#8a80a8' }); // 下への 階段
def(T.C11C_HALLDOOR, 'c11c_halldoor', { anim: true, light: true, mapColor: '#c8a0ff' }); // うらの 町の おくの 古い 戸（回ろうへ）
def(T.C11C_SPRING, 'c11c_spring', { solid: true, talkThrough: true, anim: true, light: true, mapColor: '#a8e0ff' }); // ひと休みの いずみ（回復）
def(T.C11C_BIGDOOR, 'c11c_bigdoor', { solid: true, talkThrough: true, light: true, mapColor: '#e8d080' }); // 王宮の 大とびら（とじて いる）
def(T.C11C_BIGDOOR_OPEN, 'c11c_bigdoor_open', { solid: true, talkThrough: true, anim: true, light: true, mapColor: '#ffffff' }); // 開いた 大とびら（まぶしい）
def(T.C11C_CARPET, 'c11c_carpet', { mapColor: '#6a5aa8' }); // 大とびらへの じゅうたん
def(T.C11C_PILLAR, 'c11c_pillar', { solid: true, mapColor: '#2a2440' }); // 柱
def(T.C11C_REST_FLOOR, 'c11c_rest_floor', { mapColor: '#6a5a50' }); // ひと休みの 部屋の ゆか

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
