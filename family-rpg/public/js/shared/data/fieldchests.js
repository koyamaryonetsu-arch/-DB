// フィールドの 宝箱（大陸・海の 島）
// ・ランダムな 場所に あらわれ、開けると きえる。しばらくすると べつの 場所に また 出る（world/fieldchests.js）
// ・中みは その ちいきに あわせる（w … 出やすさ）
// ・地図に はじめから おいてある フィールドの 宝箱も、開けたら きえる（洞窟・塔・町の 宝箱は のこる）

// マップごとに 同時に 出ている 数
export const FIELD_CHEST_COUNT = { overworld: 7, sea: 5, north: 6 };
// 1こ 開けられて から つぎが 出るまで・開けられない まま 場所が かわるまで
export const FIELD_CHEST_RESPAWN_MS = 90 * 1000;
export const FIELD_CHEST_LIFE_MS = 20 * 60 * 1000;

const LOOT = {
  outskirts: [
    { w: 6, gold: [15, 40] }, { w: 6, item: 'herb', n: [1, 2] }, { w: 3, item: 'antidote' }, { w: 1, item: 'magic_water' },
    { w: 1.2, item: 'iron_shard' }, { w: 1, item: 'beast_fang' }, { w: 0.6, item: 'leather_hat' }, { w: 0.25, item: 'seed_hp' },
  ],
  plains: [
    { w: 6, gold: [30, 70] }, { w: 5, item: 'herb', n: [1, 3] }, { w: 2, item: 'antidote' }, { w: 1.5, item: 'magic_water' },
    { w: 1.5, item: 'iron_shard' }, { w: 1.2, item: 'beast_fang' }, { w: 1, item: 'return_wing' }, { w: 0.6, item: 'bandana' },
    { w: 0.3, item: 'seed_agi' }, { w: 0.3, item: 'seed_def' },
  ],
  forest: [
    { w: 5, gold: [40, 90] }, { w: 4, item: 'herb', n: [2, 3] }, { w: 3, item: 'moonherb' }, { w: 1.5, item: 'magic_water' },
    { w: 2, item: 'magic_powder' }, { w: 1.5, item: 'beast_fang', n: [1, 2] }, { w: 0.6, item: 'leather_armor' },
    { w: 0.4, item: 'seed_mag' }, { w: 0.4, item: 'seed_hp' },
  ],
  swamp: [
    { w: 5, gold: [40, 100] }, { w: 4, item: 'antidote', n: [2, 3] }, { w: 3, item: 'moonherb' }, { w: 1.5, item: 'holy_water' },
    { w: 2, item: 'magic_powder', n: [1, 2] }, { w: 0.6, item: 'poison_knife' }, { w: 0.4, item: 'seed_def' }, { w: 0.4, item: 'seed_mag' },
  ],
  east: [
    { w: 5, gold: [70, 160] }, { w: 3, item: 'herb', n: [2, 3] }, { w: 2, item: 'magic_water' }, { w: 1.5, item: 'holy_water' },
    { w: 2, item: 'iron_shard', n: [1, 2] }, { w: 1.5, item: 'wind_feather' }, { w: 0.6, item: 'iron_helm' }, { w: 0.5, item: 'iron_shield' },
    { w: 0.5, item: 'seed_str' }, { w: 0.5, item: 'seed_agi' },
  ],
  isle: [
    { w: 5, gold: [120, 280] }, { w: 3, item: 'moonherb', n: [1, 2] }, { w: 2.5, item: 'magic_water', n: [1, 2] },
    { w: 2, item: 'pretty_shell', n: [1, 2] }, { w: 1.5, item: 'silver_shard' }, { w: 1, item: 'return_wing' },
    { w: 0.6, item: 'captain_hat' }, { w: 0.5, item: 'shell_shield' }, { w: 0.6, item: 'seed_hp' }, { w: 0.5, item: 'seed_mag' },
  ],
  storm: [
    { w: 5, gold: [180, 380] }, { w: 2.5, item: 'magic_water', n: [1, 2] }, { w: 2, item: 'silver_shard', n: [1, 2] },
    { w: 2, item: 'wind_feather', n: [1, 2] }, { w: 0.8, item: 'silver_helm' }, { w: 0.6, item: 'silver_shield' },
    { w: 0.6, item: 'seed_str' }, { w: 0.6, item: 'seed_agi' },
  ],
  // 第3章（シロガネ地方）
  n_snow: [
    { w: 5, gold: [150, 320] }, { w: 3, item: 'herb', n: [2, 3] }, { w: 2.5, item: 'moonherb', n: [1, 2] }, { w: 2, item: 'ice_crystal', n: [1, 2] },
    { w: 1.5, item: 'magic_water' }, { w: 0.6, item: 'fur_hat' }, { w: 0.5, item: 'seed_def' }, { w: 0.5, item: 'seed_hp' },
  ],
  n_forest: [
    { w: 5, gold: [150, 320] }, { w: 3, item: 'moonherb', n: [1, 2] }, { w: 2, item: 'magic_water' }, { w: 2, item: 'ice_crystal', n: [1, 2] },
    { w: 1.5, item: 'beast_fang', n: [1, 2] }, { w: 0.6, item: 'fur_coat' }, { w: 0.5, item: 'seed_mag' }, { w: 0.5, item: 'seed_agi' },
  ],
  n_lake: [
    { w: 5, gold: [180, 360] }, { w: 3, item: 'ice_crystal', n: [1, 3] }, { w: 2, item: 'magic_water' }, { w: 0.6, item: 'seed_def' },
  ],
  n_mine: [
    { w: 5, gold: [200, 400] }, { w: 3, item: 'iron_shard', n: [1, 3] }, { w: 2, item: 'silver_shard' }, { w: 2, item: 'magic_water' },
    { w: 0.6, item: 'steel_helm' }, { w: 0.5, item: 'seed_str' }, { w: 0.5, item: 'seed_def' },
  ],
  n_peak: [
    { w: 5, gold: [200, 400] }, { w: 3, item: 'moonherb', n: [1, 2] }, { w: 2, item: 'magic_water', n: [1, 2] }, { w: 2, item: 'star_shard', n: [1, 2] },
    { w: 0.6, item: 'snow_gi' }, { w: 0.5, item: 'seed_hp' }, { w: 0.5, item: 'seed_mag' },
  ],
  n_volcano: [
    { w: 5, gold: [220, 450] }, { w: 3, item: 'flame_stone', n: [1, 2] }, { w: 2, item: 'herb', n: [2, 3] }, { w: 2, item: 'magic_water' },
    { w: 0.6, item: 'steel_shield' }, { w: 0.5, item: 'seed_str' }, { w: 0.5, item: 'seed_agi' },
  ],
};

// 中みを きめる（{ gold } か { item, n }）
export function fieldChestLoot(zone, rng) {
  const e = rng.weighted(LOOT[zone] || LOOT.plains);
  const roll = (r) => (Array.isArray(r) ? rng.int(r[0], r[1]) : r || 1);
  return e.gold ? { gold: roll(e.gold) } : { item: e.item, n: roll(e.n) };
}
export const FIELD_CHEST_ZONES = Object.keys(LOOT);
export const fieldChestLootTable = (zone) => LOOT[zone] || null;

// 開けたら きえる 宝箱か（フィールドの マップに おいてある もの）
export function chestVanishes(map) {
  return map?.kind === 'field';
}
