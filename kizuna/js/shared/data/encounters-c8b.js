// 第2部 第8章 第2幕「よみの 青い火」の てきの くみあわせ（B: 戦い。encounters.js で まぜる）
// 出現表の 名前は A（マップ）との 約束（docs/plan-ch8.md の 6-2）
//   t8b_temple … よみの 海底神殿 1〜4階（千年前と 今の がわ。おすすめ Lv83〜85）
//   t8b_deep   … よみの 海底神殿 5〜8階（おすすめ Lv85〜87）。休み所・ボスの 間は 魔物が 出ない（A の マップ）
// 手下の 魔物 5しゅ（どれも 仲間に なる）。重みで 出やすさを きめて、配合で 足りない ランクに 入れる（tools/gen-monster-ranks.mjs）
//   めやす: ケロベロス … 30%いじょう（F）／ホネギョ … 12〜20%（E）／ビリクラゲ … 12〜20%（D）／青火のたましい … 6〜12%（C）／ヒドラン … 6〜12%（A）
//   （ホネギョは 仲間に なりやすい 1/11・ビリクラゲは ときどき 1/15 なので、おなじ 出やすさでも ランクが ちがう）
//   第8章の B〜S は 2わりまで（test/monsters-r43a.test.js）なので、第2幕の B〜S は ヒドランだけ
import { C8_PAIN, C8_PANIC, C8_HADES } from './monsters-c8b.js?v=76aae2682384';

export const ENCOUNTERS_C8B = {
  t8b_temple: [
    { w: 5, group: [['kerberos', 1, 2], ['bone_fish', 0, 1]] },
    { w: 4, group: [['kerberos', 2, 3]] },
    { w: 3, group: [['bone_fish', 1, 1], ['kerberos', 1, 1]] },
    { w: 3, group: [['biri_jelly', 1, 2], ['kerberos', 1, 1]] },
    { w: 1, group: [['biri_jelly', 1, 1], ['bone_fish', 1, 1]] },
    // 第8章 第1幕の 魔物も 少し（ランクが かわらない くらい）
    { w: 1, group: [['cobrar', 1, 1], ['kerberos', 1, 1]] },
  ],
  t8b_deep: [
    { w: 3, group: [['blue_soul', 1, 1], ['biri_jelly', 1, 1], ['kerberos', 1, 1]] },
    { w: 3, group: [['biri_jelly', 1, 1], ['kerberos', 1, 1]] },
    { w: 2, group: [['hydran', 1, 1], ['blue_soul', 1, 1]] },
    { w: 2, group: [['hydran', 1, 1], ['kerberos', 1, 1]] },
    { w: 3, group: [['kerberos', 1, 2], ['bone_fish', 1, 1]] },
    { w: 2, group: [['bone_fish', 1, 1], ['biri_jelly', 1, 1]] },
    { w: 2, group: [['kerberos', 2, 3]] },
    { w: 1, group: [['lamp_smoke', 1, 1], ['kerberos', 1, 1]] },
  ],
};

// きまった 戦い（docs/plan-ch8.md の 6-2）。台本は ['showMon', id] → ['battle', id]
//   c8_painpanic … ペイニックと パニクル（Step 3 の さいごの 中ボス。Lv84。2ひきで 1組。showMon の え は ペイニック）
//   c8_hades     … よみの王ハデロス（第2幕の さいごの ボス。Lv86。2だん … 青い 炎 → おこった 赤い 炎）
//   負けた ときは 今までの ボスと おなじ
export const FIXED_C8B = {
  [C8_PAIN]: { group: [[C8_PAIN, 1, 1], [C8_PANIC, 1, 1]], bg: 'yomi_temple', bgm: 'yomi_imps', canFlee: false, boss: true },
  [C8_HADES]: { group: [[C8_HADES, 1, 1]], bg: 'yomi_throne', bgm: 'yomi_king', canFlee: false, boss: true },
};

// 出現表 → 戦いの 背景（上の 階は 青い 火の ともる 海底神殿・下の 階は 深い 海の 底の よみの 回廊。client/render/c8b-bg.js）
export const ZONE_BG_C8B = { t8b_temple: 'yomi_temple', t8b_deep: 'yomi_deep' };
