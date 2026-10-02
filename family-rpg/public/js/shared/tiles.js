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
};

export function parseRows(rows) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const tiles = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x] ?? ' ';
      tiles[y * w + x] = LEGEND[ch] ?? T.VOID;
    }
  }
  return { w, h, tiles };
}
