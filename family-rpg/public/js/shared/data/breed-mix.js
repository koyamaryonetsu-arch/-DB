// 系統まぜ配合と 色の石（第53回。docs/plan-r53-breed-more.md の 2-1 の A・D）
//
// A. 系統まぜ配合: ちがう 系統の 親 どうしから 生まれる「まぜの 子」（companions.js の breedCandidates の 'mix'）
//   ・表は 2つの 系統の 組み合わせ（28通り）ごとに、どちらかの 系統の 今の 魔物を ならべる（ランクは 魔物の ランク）
//   ・子の 候補に 入るのは、高いほうの 親の ランク（育てると 1つ上・えらぶだけなら 1つ下も）の 魔物
//   ・新しい 魔物は MONSTER_FRIENDS の mix に ほかの 系統を 書くだけで 入る（例: mix: ['material']。自分の 系統 ＋ その 系統）
//   ・ボス・メタル・SS・きまった 組み合わせ だけの 魔物（recipeOnly）・進化の すがたは 表に 書いても 入らない（companions.js の mixPool）
// D. 色の石: 配合の 時に 使うと、生まれる 子が 色ちがい（variants.js）の 仲間に なる（world/breed.js）
//   ・色ちがいが ある 魔物（敵に 色ちがいが 出る 魔物。variants.js の colorKinds）だけ。しゅるいは 自分で えらぶ
//   ・仲間は もとの しゅぞくの まま char.color を もつ（強さは 色ちがいの 倍率の 半分・属性は 色ちがいの きまり。stats.js）
//   ・手に入る 所: カジノの 景品（第2章クリアの あと）・宝の洞窟の 宝箱（まれ）・きらきらぷるりんが まれに 落とす（loot.js）

// 組み合わせの 名前（系統を ABC じゅんに ならべて ＋ で つなぐ）
export const mixKey = (a, b) => [a, b].sort().join('+');

// 組み合わせ → まぜの 子（ランクの ひくい じゅん。コメントは ランク）
const T = {
  // ぷるぷるの けもの・けものの ぷるりん
  'beast+slime': ['frog', 'dry_frog', 'cloud_sheep', 'fuwari', 'sand_worm', 'earth_pillbug', 'sun_ram', 'star_panther', 'pururin_knight'], // F F E E D C B A S
  // 花の ぷるりん・キノコ
  'plant+slime': ['hedoron', 'mirage_flower', 'kobushi', 'hana_pururin', 'nemuri', 'karamizuta', 'pururin_tower'], // F F E D D C B
  // いたずらな ぷるりん・小さな 悪魔
  'demon+slime': ['moon_pururin', 'spring_box', 'magma_slime', 'homunculus_shade', 'pururin_beth', 'koakuma'], // F E E D C C
  // 光る くらげ・水の 精
  'slime+spirit': ['stardust_slime', 'mirror_jelly', 'water_spirit', 'glow_jelly', 'ice_pururin', 'star_jelly', 'foam_siren', 'lamp', 'kiraboshi'], // F F F E E E E D C
  // どろどろの おばけ
  'slime+undead': ['hedoron', 'candle_ghost', 'glow_jelly', 'shadow_flame', 'cloud_wraith', 'pururin_knight'], // F F E D D S
  // からくりぷるりん・鏡の ぷるりん
  'material+slime': ['sand_slime', 'mirror_jelly', 'ore_slime', 'coral_golem', 'trick_mirror', 'cog_roller', 'sand_golem', 'uzumaki_gai', 'pururin_tower', 'pururin_knight'], // F F E E D C C C B S
  // とけた 竜・水の 竜
  'dragon+slime': ['lava_lizard', 'magma_slime', 'sea_serpent', 'water_dragon', 'pururin_beth', 'shade_serpent', 'dust_drake', 'axe_rider'], // F E E D C C B S
  // 森の けもの・虫
  'beast+plant': ['gaia_larva', 'coconut', 'kobushi', 'amber_moth', 'elder_sprout', 'moss_deer', 'toge_saboten', 'sun_ram'], // F F E D D C C B
  // 夜の けもの・小さな 悪魔
  'beast+demon': ['dark_bat', 'koumorin', 'dark_wolf', 'goblin', 'night_owl', 'gargoyle', 'koakuma'], // F F E E D C C
  // 風・星・雷の けもの
  'beast+spirit': ['wind_weasel', 'comet_bird', 'star_owl', 'sky_ray', 'thunder_puff', 'hinezumi', 'kiraboshi', 'crab_star', 'star_panther', 'ikazuchi_tiger'], // F F E E D C B A S
  // ゆうれいの けもの
  'beast+undead': ['sand_vulture', 'koumorin', 'dark_wolf', 'bone_dragon', 'night_owl', 'soul_eater', 'crow'], // F F E E D D C
  // よろいの けもの・からくりの 虫
  'beast+material': ['mole_miner', 'penguin_knight', 'gear_beetle', 'clock_spider', 'armor_crab', 'shell_knight', 'hoseki_game', 'buriki', 'crab_star', 'golem', 'clockwork_knight'], // F F E E D D C C B A S
  // 竜の けもの・けものの 竜
  'beast+dragon': ['lava_lizard', 'fire_hound', 'sea_serpent', 'frost_drake', 'tobiuo', 'chibi_dragon', 'star_wyvern', 'dust_drake', 'axe_rider', 'ikazuchi_tiger'], // F E E D D C C B S S
  // まどわす 花・さけぶ 根っこ
  'demon+plant': ['mirage_flower', 'goblin', 'nemuri', 'homunculus_shade', 'mandra', 'karamizuta'], // F E D D C C
  // 森の 精
  'plant+spirit': ['root_sprite', 'snow_wisp', 'aurora_spirit', 'wisp_lamp', 'chibi_treant', 'elder_sprout', 'tsurara_sou', 'kiraboshi'], // F F E E D D C C
  // おばけの 花・キノコ
  'plant+undead': ['mirage_flower', 'candle_ghost', 'kobushi', 'nemuri', 'soul_eater', 'mandra', 'karamizuta'], // F F E D D C C
  // 木と 石の 番人
  'material+plant': ['coconut', 'stone_keeper', 'coral_golem', 'haniwa_soldier', 'donguri', 'mill_keeper', 'toge_saboten'], // F F E E D C C
  // ランプの 魔人・影の 魔法使い
  'demon+spirit': ['fire_imp', 'thunder_imp', 'kage_boushi', 'twin_star', 'lamp_genie', 'lamp', 'faceless_shade', 'gazer_eye', 'shadow_mage'], // F F E E D D C C S
  // やみの 騎士・がいこつ
  'demon+undead': ['skeleton', 'mummy_soldier', 'black_agent', 'shadow_flame', 'soul_eater', 'demon_knight', 'blackflame_knight', 'headless', 'obsidian_knight', 'shadow_mage'], // F F E D D C C C A S
  // 石の 悪魔・ばけばこ
  'demon+material': ['cursed_pot', 'stone_gargoyle', 'spring_box', 'castle_armor', 'mirror_knight', 'killer', 'gargoyle', 'mimic', 'obsidian_knight'], // F F E D D D C C A
  // 悪魔の 竜・竜の 騎兵
  'demon+dragon': ['lava_lizard', 'stone_gargoyle', 'goblin', 'lamp_genie', 'shade_serpent', 'gargoyle', 'obsidian_knight', 'axe_rider'], // F F E D C C A S
  // ひとだま・かげ
  'spirit+undead': ['candle_ghost', 'lonely_ghost', 'moon_ghost', 'wisp_lamp', 'kage_boushi', 'rewind_ghost', 'cloud_wraith', 'faceless_shade'], // F F F E E E D C
  // ランプ・鏡・時の からくり
  'material+spirit': ['sand_sprite', 'lonely_doll', 'warp_wisp', 'haniwa_soldier', 'lamp', 'trick_mirror', 'ice_golem', 'chrono_knight', 'clockwork_guard'], // F F E E D D D C C
  // 雲と 水の 竜
  'dragon+spirit': ['wind_imp', 'sea_serpent', 'thunder_puff', 'fairy_dragon', 'sky_serpent', 'water_dragon', 'cloud_wyvern', 'star_wyvern', 'dust_drake', 'great_dragon'], // F E E D D D C C B S
  // からっぽの よろい・トロッコおばけ
  'material+undead': ['minecart_ghost', 'lonely_doll', 'cursed_pot', 'haniwa_soldier', 'castle_armor', 'sandstone_golem', 'headless', 'clockwork_knight'], // F F F E D D C S
  // ほねの 竜・水かげの へび
  'dragon+undead': ['ghost_pirate', 'bone_dragon', 'sea_serpent', 'shadow_flame', 'cloud_wraith', 'shade_serpent'], // F E E D D C
  // 竜の 石像・からくりの 竜
  'dragon+material': ['lava_lizard', 'stone_keeper', 'coral_golem', 'dragon_statue', 'frost_drake', 'ruin_sentinel', 'rockman', 'dust_drake', 'golem', 'axe_rider', 'clockwork_knight'], // F F E D D C B B A S S
  // 花の 竜・ひすいの 竜
  'dragon+plant': ['coconut', 'kobushi', 'fairy_dragon', 'elder_sprout', 'karamizuta', 'star_wyvern', 'great_dragon'], // F E D D C C S
};
// キーを mixKey の 形に そろえる（書く ときの じゅんばんは 気に しない）
export const MIX_TABLE = {};
for (const [k, list] of Object.entries(T)) {
  const [a, b] = k.split('+');
  MIX_TABLE[mixKey(a, b)] = list;
}

// 酒場の うわさ・配合の きまり（ことばは ここ だけ）
export const MIX_RUMOR = 'ちがう系統どうしでも、思いがけない魔物が生まれることがある';

// ───────────── D. 色の石 ─────────────
export const COLOR_STONE = 'color_stone';
// 色ちがいの 仲間の 強さ: もとの 魔物の 色ちがいの 倍率（variants.js の k）の 半分だけ 強く（1.3 → 1.15）
export const COLOR_STAT_RATE = 0.5;

export const MIX_ITEMS = {
  color_stone: {
    name: '色の石', type: 'mat', price: 0, sell: 300,
    desc: 'にじ色にかわる、ふしぎな石。配合の時に使うと、色ちがいの子が生まれることがある。使うとなくなる。',
  },
};
export const MIX_ITEM_KANA = { color_stone: 'いろのいし' };
