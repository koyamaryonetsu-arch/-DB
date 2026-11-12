// 第2部 第8章 第3幕「くろがねの 空中ようさい」の てきの くみあわせ（B: 戦い。encounters.js で まぜる）
// 出現表の 名前は A（マップ）との 約束（docs/plan-ch8.md の 8-2）
//   t8c_fort … くろがねの 空中ようさい 1〜4階（千年前と 今の がわ。おすすめ Lv86〜88）
//   t8c_deep … くろがねの 空中ようさい 5〜8階（おすすめ Lv88〜90）。休み所・ボスの 間は 魔物が 出ない（A の マップ）
// 手下の 魔物 5しゅ（どれも 仲間に なる）。重みで 出やすさを きめて、配合で 足りない ランクに 入れる（tools/gen-monster-ranks.mjs）
//   めやす: メラバブル … 30%いじょう（F）／トンカチブロス … 12〜20%（E）／ブリキクッパ … 12〜20%（D）／ドッシーン … 6〜12%（C）／ドデカキラー … 6〜12%（A）
//   （トンカチブロスは 仲間に なりやすい 1/11・ブリキクッパは ときどき 1/15 なので、おなじ 出やすさでも ランクが ちがう）
//   第8章の B〜S は 2わりまで（test/monsters-r43a.test.js）なので、第3幕の B〜S は ドデカキラーだけ
import { C8_KAMEK, C8_BOWSER, KAMEK_KIDS } from './monsters-c8c.js?v=9a5805f1f322';

export const ENCOUNTERS_C8C = {
  t8c_fort: [
    { w: 5, group: [['mera_bubble', 1, 2], ['tonkachi_bro', 0, 1]] },
    { w: 4, group: [['mera_bubble', 2, 3]] },
    { w: 3, group: [['tonkachi_bro', 1, 1], ['mera_bubble', 1, 1]] },
    { w: 3, group: [['buriki_koopa', 1, 2], ['mera_bubble', 1, 1]] },
    { w: 1, group: [['buriki_koopa', 1, 1], ['tonkachi_bro', 1, 1]] },
    // 第8章 第2幕の 魔物も 少し（ランクが かわらない くらい）
    { w: 1, group: [['bone_fish', 1, 1], ['mera_bubble', 1, 1]] },
  ],
  t8c_deep: [
    { w: 3, group: [['dosshiin', 1, 1], ['buriki_koopa', 1, 1], ['mera_bubble', 1, 1]] },
    { w: 3, group: [['buriki_koopa', 1, 1], ['mera_bubble', 1, 1]] },
    { w: 2, group: [['dodeka_killer', 1, 1], ['mera_bubble', 1, 1]] },
    { w: 2, group: [['dodeka_killer', 1, 1], ['tonkachi_bro', 1, 1]] },
    { w: 3, group: [['mera_bubble', 1, 2], ['tonkachi_bro', 1, 1]] },
    { w: 2, group: [['dosshiin', 1, 1], ['tonkachi_bro', 1, 1]] },
    { w: 2, group: [['mera_bubble', 2, 3]] },
    { w: 1, group: [['hydran', 1, 1], ['mera_bubble', 1, 1]] },
  ],
};

// きまった 戦い（docs/plan-ch8.md の 8-2）。台本は ['showMon', id] → ['battle', id]
//   c8_kamek  … マジカメック（Step 5 の さいごの 中ボス。Lv88。子分の トンカチブロス・ブリキクッパと いっしょ。showMon の え は マジカメック）
//   c8_bowser … 初代大魔王クッパード（第3幕の さいごの ボス。Lv90。2だん … ふつう → ギガクッパード〈橋のオノで もとに もどる〉）
//   負けた ときは 今までの ボスと おなじ
export const FIXED_C8C = {
  [C8_KAMEK]: { group: [[C8_KAMEK, 1, 1], ...KAMEK_KIDS.map((sp) => [sp, 1, 1])], bg: 'fort_deck', bgm: 'kamek_magic', canFlee: false, boss: true },
  [C8_BOWSER]: { group: [[C8_BOWSER, 1, 1]], bg: 'fort_bridge', bgm: 'bowser_king', canFlee: false, boss: true },
};

// 出現表 → 戦いの 背景（上の 階は 空を とぶ ようさいの 甲板・下の 階は ようさいの 中の 大きな 歯車の 部屋。client/render/c8c-bg.js）
export const ZONE_BG_C8C = { t8c_fort: 'fort_deck', t8c_deep: 'fort_engine' };
