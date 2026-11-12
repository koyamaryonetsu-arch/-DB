// 第2部 第8章 第1幕「月の王宮の うらぎり」の てきの くみあわせ（B: 戦い。encounters.js で まぜる）
// 出現表の 名前は A（マップ）との 約束（docs/plan-ch8.md の 5-2）
//   t8a_palace … 月の王宮の 地下迷宮 1〜4階（千年前と 今の がわ。おすすめ Lv80〜82）
//   t8a_deep   … 月の王宮の 地下迷宮 5〜8階（おすすめ Lv82〜84）。休み所・ボスの 間は 魔物が 出ない（A の マップ）
// 手下の 魔物 5しゅ（どれも 仲間に なる）。重みで 出やすさを きめて、配合で 足りない ランクに 入れる（tools/gen-monster-ranks.mjs）
//   めやす: 宮殿の衛兵 … 30%いじょう（F）／サンボ … 12〜20%（E）／コブラー … 12〜20%（D）／ランプのけむり … 6〜12%（C）／月のスカラベ … 6〜12%（A）
//   （サンボは 仲間に なりやすい 1/11・コブラーは ときどき 1/15 なので、おなじ 出やすさでも ランクが ちがう）
//   第8章の B〜S は 2わりまで（test/monsters-r43a.test.js）なので、第1幕の B〜S は 月のスカラベだけ
import { C8_PET, C8_JAFAR, C8_STAFF } from './monsters-c8a.js?v=d13bba1204d4';

export const ENCOUNTERS_C8A = {
  t8a_palace: [
    { w: 5, group: [['palace_guard', 1, 2], ['sanbo', 0, 1]] },
    { w: 4, group: [['palace_guard', 2, 3]] },
    { w: 3, group: [['sanbo', 1, 1], ['palace_guard', 1, 1]] },
    { w: 3, group: [['cobrar', 1, 2], ['palace_guard', 1, 1]] },
    { w: 1, group: [['cobrar', 1, 1], ['sanbo', 1, 1]] },
    // 第7章の 魔物も 少し（ランクが かわらない くらい）
    { w: 1, group: [['thorn_goblin', 1, 1], ['palace_guard', 1, 1]] },
  ],
  t8a_deep: [
    { w: 3, group: [['lamp_smoke', 1, 1], ['cobrar', 1, 1], ['palace_guard', 1, 1]] },
    { w: 3, group: [['cobrar', 1, 1], ['palace_guard', 1, 1]] },
    { w: 2, group: [['moon_scarab', 1, 1], ['lamp_smoke', 1, 1]] },
    { w: 2, group: [['moon_scarab', 1, 1], ['palace_guard', 1, 1]] },
    { w: 3, group: [['palace_guard', 1, 2], ['sanbo', 1, 1]] },
    { w: 2, group: [['sanbo', 1, 1], ['cobrar', 1, 1]] },
    { w: 2, group: [['palace_guard', 2, 3]] },
    { w: 1, group: [['ice_mirror', 1, 1], ['palace_guard', 1, 1]] },
  ],
};

// きまった 戦い（docs/plan-ch8.md の 5-2）。台本は ['showMon', id] → ['battle', id]
//   c8_vizier_pet … オウムのイアゴン（Step 1 の さいごの 中ボス。Lv81）
//   c8_jafar      … 大臣ジャハール（第1幕の さいごの ボス。Lv83。3だん … 大きな コブラ → ランプの 魔人）。横に へびのつえ（べつの 敵）。
//                   黒いランプ（べつの 敵 c8_lamp）は 3だんめで あらわれる（battle-c8a.js の genie。b.addEnemies）
//   負けた ときは 今までの ボスと おなじ
export const FIXED_C8A = {
  [C8_PET]: { group: [[C8_PET, 1, 1]], bg: 'pyramid_boss', bgm: 'boss6', canFlee: false, boss: true },
  [C8_JAFAR]: { group: [[C8_JAFAR, 1, 1], [C8_STAFF, 1, 1]], bg: 'palace_night', bgm: 'sand_demon', canFlee: false, boss: true },
};

// 出現表 → 戦いの 背景（上の 階は かれた 地下水路・下の 階は 金色の 砂岩の 広間）
export const ZONE_BG_C8A = { t8a_palace: 'canal', t8a_deep: 'pyramid' };
