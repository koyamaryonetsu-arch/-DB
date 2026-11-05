// 第2部 第7章 第2幕「海の紋章」の てきの くみあわせ（B: 戦い。encounters.js で まぜる）
// 出現表の 名前は A（マップ）との 約束（docs/plan-ch7.md の 4-3）
//   t7_sea   … 千年前の クモイの 海の フィールド（島と サンゴしょう。おすすめ Lv72〜74）
//   t7_light … しずむ前の島の灯台 1〜8階（おすすめ Lv74〜76）。休み所・ボスの 間は 魔物が 出ない（A の マップ）
// 手下の 魔物 5しゅ（どれも 仲間に なる）。重みで 出やすさを きめて、配合で 足りない ランクに 入れる（tools/gen-monster-ranks.mjs）
//   めやす: プクプク … 20%いじょう（F）／カロン … 12〜20%（E）／ジュゲム … 12〜20%（D）／魚人の海賊 … 6〜12%（C）／海賊オウム … 6〜12%（A）
//   第7章の B〜S は 2わりまで（test/monsters-r43a.test.js）なので、第2幕の B〜S は 海賊オウムだけ
import { C7_REEF, C7_LIGHT } from './monsters-c7s.js?v=3cac07ff7cd4';

export const ENCOUNTERS_C7S = {
  t7_sea: [
    { w: 5, group: [['pukupuku', 1, 2], ['karon', 0, 1]] },
    { w: 4, group: [['pukupuku', 2, 3]] },
    { w: 3, group: [['jugemu', 1, 1], ['pukupuku', 1, 1]] },
    { w: 3, group: [['karon', 1, 1], ['pukupuku', 1, 1]] },
    { w: 2, group: [['jugemu', 1, 1], ['karon', 1, 1]] },
    // 第1幕の 神殿の 水の 魔物も 少し（ランクが かわらない くらい）
    { w: 2, group: [['uzu_eel', 1, 1], ['pukupuku', 1, 1]] },
    { w: 2, group: [['gesso', 1, 1], ['jugemu', 1, 1]] },
  ],
  t7_light: [
    { w: 3, group: [['fish_pirate', 1, 1], ['karon', 1, 1], ['jugemu', 1, 1]] },
    { w: 3, group: [['karon', 1, 1], ['teresa', 1, 1]] },
    { w: 2, group: [['pirate_parrot', 1, 1], ['fish_pirate', 1, 1]] },
    { w: 2, group: [['pirate_parrot', 1, 1], ['karon', 1, 1]] },
    { w: 3, group: [['water_youma', 1, 1], ['jugemu', 1, 1]] },
    { w: 2, group: [['pukupuku', 1, 2], ['water_youma', 1, 1]] },
    { w: 1, group: [['jugemu', 1, 2]] },
    { w: 2, group: [['curse_lump', 1, 1], ['teresa', 0, 1]] },
    { w: 2, group: [['gesso', 1, 2]] },
  ],
};

// きまった 戦い（docs/plan-ch7.md の 4-3）。台本は ['showMon', id] → ['battle', id]
//   c7_reef  … 海賊船ジョリーホック号（Step 3 の さいごの 中ボス。Lv74）。サンゴしょうの 海
//   c7_light … ホック船長（しずむ前の島の灯台の ボス。Lv76。2だん）。灯台の てっぺん
//   どちらも 曲 boss6。負けた ときは 今までの ボスと おなじ
export const FIXED_C7S = {
  [C7_REEF]: { group: [[C7_REEF, 1, 1]], bg: 'sea', bgm: 'boss6', canFlee: false, boss: true },
  [C7_LIGHT]: { group: [[C7_LIGHT, 1, 1]], bg: 'tower_top', bgm: 'boss6', canFlee: false, boss: true },
};

// 出現表 → 戦いの 背景（海は 島の 浜べ・灯台は 石の 柱の 塔の 中）
export const ZONE_BG_C7S = { t7_sea: 'beach', t7_light: 'tower' };
