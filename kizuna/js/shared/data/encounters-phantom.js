// 第5章 Step 8「影の城」の てきの くみあわせ（B8: 戦い。encounters.js で まぜる）
// 出現表の 名前は A8（マップ）との 約束（docs/plan-ch5.md の 17）。昼と 夜の 区別は ない
//   t5_castle_wind  … 影の城 1〜4階「風の階」（あらしガラス・風車の番人・かまいたち。かおのない影も 少し）
//   t5_castle_fire  … 5〜8階「炎の階」（火の粉オオカミ・ろうそくおばけ・黒ほのおの騎士。かおのない影も 少し）
//   t5_castle_water … 9〜12階「水の階」（鏡くらげ・水かげの大へび・あわの歌姫。かおのない影も 少し）
// 4階・8階の 休み所と、まぼろしの いる 部屋は 魔物が 出ない（A8 の マップ）
import { registerVariant } from './variants.js?v=2173b59e8cbd';

// 色ちがい（data/variants.js）: 階の おくで まれに 出る（経験値と お金が 多い）
export const PHANTOM_VARIANTS = [registerVariant('mill_keeper', 'dark'), registerVariant('blackflame_knight', 'shadow'), registerVariant('shade_serpent', 'dark')];
const [DARK_MILL, SHADOW_KNIGHT, DARK_SERPENT] = PHANTOM_VARIANTS;

export const ENCOUNTERS_PHANTOM = {
  t5_castle_wind: [
    { w: 4, group: [['gale_crow', 1, 2], ['wind_weasel', 0, 1]] },
    { w: 3, group: [['mill_keeper', 1, 1], ['gale_crow', 0, 1]] },
    { w: 3, group: [['wind_weasel', 2, 3]] },
    { w: 2, group: [['mill_keeper', 1, 1], ['wind_weasel', 1, 1]] },
    { w: 1, group: [['faceless_shade', 1, 1], ['gale_crow', 0, 1]] },
    { w: 1, group: [[DARK_MILL, 1, 1], ['wind_weasel', 0, 1]] },
  ],
  t5_castle_fire: [
    { w: 4, group: [['ember_wolf', 1, 2], ['candle_ghost', 0, 1]] },
    { w: 3, group: [['blackflame_knight', 1, 1], ['candle_ghost', 0, 1]] },
    { w: 3, group: [['candle_ghost', 2, 3]] },
    { w: 2, group: [['blackflame_knight', 1, 1], ['ember_wolf', 1, 1]] },
    { w: 1, group: [['faceless_shade', 1, 1], ['ember_wolf', 0, 1]] },
    { w: 1, group: [[SHADOW_KNIGHT, 1, 1], ['candle_ghost', 0, 1]] },
  ],
  t5_castle_water: [
    { w: 4, group: [['mirror_jelly', 1, 2], ['foam_siren', 0, 1]] },
    { w: 3, group: [['shade_serpent', 1, 1], ['mirror_jelly', 0, 1]] },
    { w: 3, group: [['foam_siren', 1, 1], ['shade_serpent', 1, 1]] },
    { w: 2, group: [['mirror_jelly', 2, 3]] },
    { w: 1, group: [['faceless_shade', 1, 1], ['foam_siren', 0, 1]] },
    { w: 1, group: [[DARK_SERPENT, 1, 1], ['mirror_jelly', 0, 1]] },
  ],
};

// きまった 戦い（A8 が 台本で ['battle', 'phantom_storm'] などと 使う。docs/plan-ch5.md の 17 の 名前の 約束）
//   曲は A8 が 作る（phantom）。まだ ない ときは 音が 鳴らないだけ（client/audio.js の play）
//   勝つと 台本が つづく。負けた ときは、今までの ボスと おなじ（loseOk なし。全滅して もどる）
//   モルガナのまぼろしは 3人（1人が 本物。battle-ch4.js の まぼろしの 分身）
export const FIXED_PHANTOM = {
  phantom_storm: { group: [['phantom_storm', 1, 1]], bg: 'castle_wind', bgm: 'phantom', canFlee: false, boss: true },
  phantom_ignia: { group: [['phantom_ignia', 1, 1]], bg: 'castle_fire', bgm: 'phantom', canFlee: false, boss: true },
  phantom_morgana: { group: [['phantom_morgana', 3, 3]], bg: 'castle_water', bgm: 'phantom', canFlee: false, boss: true },
};

// 出現表 → 戦いの 背景（render/ch5-phantom-bg.js）
export const ZONE_BG_PHANTOM = { t5_castle_wind: 'castle_wind', t5_castle_fire: 'castle_fire', t5_castle_water: 'castle_water' };
