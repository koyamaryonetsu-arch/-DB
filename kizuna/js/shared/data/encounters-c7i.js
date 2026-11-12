// 第2部 第7章 第3幕「ひとりぼっちの星」の てきの くみあわせ（B: 戦い。encounters.js で まぜる）
// 出現表の 名前は A（マップ）との 約束（docs/plan-ch7.md の 8-2）
//   t7_snow   … 千年前の シロガネの フィールド（雪の 山と 森・竜守りの村の はじまりの 村の まわり。おすすめ Lv76〜78）
//   t7_castle … 氷の竜の城 1〜8階（おすすめ Lv78〜80）。休み所・ボスの 間は 魔物が 出ない（A の マップ）
// 手下の 魔物 5しゅ（どれも 仲間に なる）。重みで 出やすさを きめて、配合で 足りない ランクに 入れる（tools/gen-monster-ranks.mjs）
//   めやす: アイスブロス … 30%いじょう（F）／こおりパックン … 12〜20%（E）／いばらゴブリン … 12〜20%（D）／氷の魔法鏡 … 6〜12%（C）／ブリザード … 6〜12%（A）
//   （こおりパックンは 仲間に なりやすい 1/11・いばらゴブリンは ときどき 1/15 なので、おなじ 出やすさでも ランクが ちがう）
//   第7章の B〜S は 2わりまで（test/monsters-r43a.test.js）なので、第3幕の B〜S は ブリザードだけ
import { C7_WITCH, C7_THORN, C7_SHADOW } from './monsters-c7i.js?v=ddd62e12d679';

export const ENCOUNTERS_C7I = {
  t7_snow: [
    { w: 5, group: [['ice_bro', 1, 2], ['ice_pakkun', 0, 1]] },
    { w: 4, group: [['ice_bro', 2, 3]] },
    { w: 3, group: [['ice_pakkun', 1, 1], ['ice_bro', 1, 1]] },
    { w: 3, group: [['thorn_goblin', 1, 2], ['ice_bro', 1, 1]] },
    { w: 2, group: [['thorn_goblin', 1, 1], ['ice_pakkun', 1, 1]] },
    // 第2幕の 魔物も 少し（ランクが かわらない くらい）
    { w: 2, group: [['jugemu', 1, 1], ['ice_bro', 1, 1]] },
    { w: 1, group: [['karon', 1, 1], ['ice_bro', 1, 1]] },
  ],
  t7_castle: [
    { w: 3, group: [['ice_mirror', 1, 1], ['thorn_goblin', 1, 1], ['ice_pakkun', 1, 1]] },
    { w: 3, group: [['thorn_goblin', 1, 1], ['ice_bro', 1, 1]] },
    { w: 2, group: [['blizzard', 1, 1], ['ice_mirror', 1, 1]] },
    { w: 2, group: [['blizzard', 1, 1], ['thorn_goblin', 1, 1]] },
    { w: 3, group: [['ice_bro', 1, 2], ['ice_pakkun', 1, 1]] },
    { w: 2, group: [['ice_pakkun', 1, 1], ['ice_bro', 1, 1]] },
    { w: 2, group: [['fish_pirate', 1, 1], ['ice_bro', 1, 1]] },
    { w: 2, group: [['karon', 1, 1], ['ice_bro', 1, 1]] },
  ],
};

// きまった 戦い（docs/plan-ch7.md の 8-2）。台本は ['showMon', id] → ['battle', id]
//   c7_witch  … いばらの魔女マレフィナ（Step 5 の さいごの 中ボス。Lv78。2だん … 黒い 竜に 変身）。前に いばらのかべ（べつの 敵）
//   c7_shadow … カイの影（氷の竜の城の さいごの ボス。第7章の さいご。Lv80）
//   負けた ときは 今までの ボスと おなじ
export const FIXED_C7I = {
  [C7_WITCH]: { group: [[C7_WITCH, 1, 1], [C7_THORN, 1, 1]], bg: 'summit', bgm: 'boss6', canFlee: false, boss: true },
  [C7_SHADOW]: { group: [[C7_SHADOW, 1, 1]], bg: 'mirror_hall', bgm: 'nocto_shadow', canFlee: false, boss: true },
};

// 出現表 → 戦いの 背景（フィールドは 雪の 野原・城は 氷の どうくつ）
export const ZONE_BG_C7I = { t7_snow: 'snowfield', t7_castle: 'ice_cave' };
