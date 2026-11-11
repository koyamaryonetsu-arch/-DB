// 第2部 第8章 第3幕「くろがねの 空中ようさい」の 魔物の 仲間（companions.js で まぜる）
// 第26回の きまり（data/companions-c8b.js と おなじ）:
// ・ふつうの 魔物は 1/10〜1/16・強い 魔物は 1/22〜1/26
// ・growth の 合計は 今までの 仲間と おなじ はば（力の 魔物 5.8〜6.1・呪文の 魔物 6.8〜7.3）
// ・learn の 技は 味方が 使っても うごく もの（ボスの しかけの 技・なかまを よぶ 技は 入れない）
// ・mix … 系統まぜ配合で 生まれる 相手の 系統（breed-mix.js）。5しゅ ぜんぶ
//   系統配合（familyPool）の 子にも なるのは A の ドデカキラーだけ（第7章・第8章 第1・2幕と おなじ きまり）。F〜C の 4しゅは noFamily
//   せいれい F・ドラゴン E・ドラゴン D・物質 C・物質 A（docs/plan-r53-breed-more.md の 1。第8章 第2幕の あとで 少ない 所）
//   第8章の B〜S は 2わりまで（test/monsters-r43a.test.js）なので、第3幕の B〜S は ドデカキラーだけ
//   ランクは tools/gen-monster-ranks.mjs の 表（monster-ranks.js）
// ・ここは ほかの データを import しない（酒場・ゲストの 一覧からも 読む ため）
// ・ゲストの リオン（第8章用）は data/shops.js の GUESTS.rion8（物語の ゲスト。docs/plan-ch8.md の 8-2）
export const FRIENDS_C8C = {
  // せいれい F（1/10）
  mera_bubble: {
    rate: 1 / 10, mix: ['slime'], names: ['メラッチ', 'ポッポ', 'ひのたま', 'ピョン'],
    growth: { hp: 0.9, mp: 1.15, str: 0.75, def: 0.85, agi: 1.3, mag: 1.35, heal: 0.6 },
    learn: [[1, 'mera'], [4, 'm8n_mb_hop'], [9, 'piorimu'], [14, 'm8n_mb_magma'], [20, 'merazoma']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'マグマからはねる火の玉。仲間になると、さむい日は、そばにいるだけで、ぽかぽか温かい。',
  },
  // ドラゴン E（1/11）
  tonkachi_bro: {
    rate: 1 / 11, mix: ['beast'], names: ['トンカ', 'ブロッチ', 'カナヅチ', 'ハンマ'],
    growth: { hp: 1.05, mp: 0.5, str: 1.3, def: 1.05, agi: 1.1, mag: 0.5, heal: 0.45 },
    learn: [[1, 'm_tackle'], [4, 'm8n_tb_jump'], [9, 'baikiruto'], [14, 'm8n_tb_throw'], [20, 'm8n_tb_rain']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: 'hat' },
    note: 'トンカチをなげるカメの兄弟。仲間になると、こわれた物を、トンカチでトントンとなおしてくれる。',
  },
  // ドラゴン D（1/15）
  buriki_koopa: {
    rate: 1 / 15, mix: ['material'], names: ['ブリキ', 'カタカタ', 'ゼンマイ', 'ガブ'],
    growth: { hp: 1.05, mp: 0.45, str: 1.25, def: 1.25, agi: 0.95, mag: 0.45, heal: 0.5 },
    learn: [[1, 'm_bite'], [4, 'm8n_bk_bite'], [9, 'sukara'], [14, 'm8n_bk_dash'], [20, 'm8n_bk_wind']],
    gear: { weapons: [], armor: ['heavy'], shield: false, head: false },
    note: 'ゼンマイで走る大魔王のおもちゃ。仲間になると、朝になると、だれかにゼンマイをまいてもらうのを、じっと待っている。',
  },
  // 物質 C（1/16）
  dosshiin: {
    rate: 1 / 16, mix: ['demon'], names: ['ドッシ', 'ゴロタ', 'イシオ', 'ズシン'],
    growth: { hp: 1.2, mp: 0.4, str: 1.25, def: 1.45, agi: 0.55, mag: 0.4, heal: 0.6 },
    learn: [[1, 'm_tackle'], [4, 'm8n_ds_drop'], [9, 'sukara'], [14, 'm8n_ds_quake'], [20, 'kabau']],
    gear: { weapons: [], armor: ['heavy'], shield: false, head: false },
    note: 'おこった顔の石のかたまり。仲間になると、本当はやさしくて、わらうと、ちょっとだけ顔がゆるむ。',
  },
  // 物質 A（なりにくい 1/26）
  dodeka_killer: {
    rate: 1 / 26, mix: ['dragon'], names: ['ドデカ', 'マグナ', 'クロダマ', 'ドーン'],
    growth: { hp: 1.1, mp: 0.4, str: 1.35, def: 1.2, agi: 1.1, mag: 0.4, heal: 0.4 },
    learn: [[1, 'm_tackle'], [4, 'm8n_dk_rush'], [9, 'baikiruto'], [14, 'm8n_dk_aim'], [20, 'm8n_dk_boom']],
    gear: { weapons: [], armor: ['heavy'], shield: false, head: false },
    note: 'とても大きな黒いたま。仲間になると、まっすぐしか進めないので、だれかが向きをかえてあげないといけない。',
  },
};

// F〜C の 4しゅは 系統配合の 子には ならない（companions.js の familyPool。まぜ配合の 子には なる）
for (const sp of ['mera_bubble', 'tonkachi_bro', 'buriki_koopa', 'dosshiin']) FRIENDS_C8C[sp].noFamily = true;
