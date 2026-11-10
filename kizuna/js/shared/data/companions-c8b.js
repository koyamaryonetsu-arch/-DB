// 第2部 第8章 第2幕「よみの 青い火」の 魔物の 仲間（companions.js で まぜる）
// 第26回の きまり（data/companions-c8a.js と おなじ）:
// ・ふつうの 魔物は 1/10〜1/16・強い 魔物は 1/22〜1/26
// ・growth の 合計は 今までの 仲間と おなじ はば（力の 魔物 5.8〜6.1・呪文の 魔物 6.8〜7.3）
// ・learn の 技は 味方が 使っても うごく もの（ボスの しかけの 技・なかまを よぶ 技は 入れない）
// ・mix … 系統まぜ配合で 生まれる 相手の 系統（breed-mix.js）。5しゅ ぜんぶ
//   系統配合（familyPool）の 子にも なるのは A の ヒドランだけ（第7章・第8章 第1幕と おなじ きまり）。F〜C の 4しゅは noFamily
//   悪魔 F・ゾンビ E・スライム D・せいれい C・ドラゴン A（docs/plan-r53-breed-more.md の 1 の 足りない 所。第8章 第1幕の あとで 少ない 所）
//   第8章の B〜S は 2わりまで（test/monsters-r43a.test.js）なので、第2幕の B〜S は ヒドランだけ
//   ランクは tools/gen-monster-ranks.mjs の 表（monster-ranks.js）
// ・ここは ほかの データを import しない（酒場・ゲストの 一覧からも 読む ため）
// ・ゲストの カイは A（物語の ゲスト。docs/plan-ch8.md の 6-2）
export const FRIENDS_C8B = {
  // 悪魔 F（1/10）
  kerberos: {
    rate: 1 / 10, mix: ['beast'], names: ['ケロ', 'ベロ', 'ロス', 'みつご'],
    growth: { hp: 1.1, mp: 0.55, str: 1.25, def: 1.0, agi: 1.05, mag: 0.55, heal: 0.45 },
    learn: [[1, 'm_bite'], [4, 'm8n_kb_bite'], [9, 'gira'], [14, 'm8n_kb_fire'], [20, 'm8n_kb_howl']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'よみの国の番犬の子ども。仲間になると、3つの頭で、だれがいちばん先にごはんを食べるか、まいにちけんかしている。',
  },
  // ゾンビ E（1/11）
  bone_fish: {
    rate: 1 / 11, mix: ['dragon'], names: ['ホネオ', 'カラカラ', 'ギョギョ', 'スケルン'],
    growth: { hp: 1.0, mp: 0.5, str: 1.3, def: 0.95, agi: 1.2, mag: 0.5, heal: 0.4 },
    learn: [[1, 'm_bite'], [4, 'm8n_bf_bite'], [9, 'baikiruto'], [14, 'm8n_bf_dash'], [20, 'm8n_bf_rattle']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'ホネだけでおよぐ魚。仲間になると、池の中を、カラカラと音を立てて、楽しそうにおよいでいる。',
  },
  // スライム D（1/15）
  biri_jelly: {
    rate: 1 / 15, mix: ['spirit'], names: ['ビリー', 'ふわり', 'クララ', 'ピカゲ'],
    growth: { hp: 1.0, mp: 1.1, str: 0.8, def: 1.0, agi: 0.95, mag: 1.3, heal: 0.85 },
    learn: [[1, 'gira'], [4, 'm8n_bj_sting'], [9, 'rariho'], [14, 'm8n_bj_zap'], [20, 'm8n_bj_glow']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'しびれるクラゲ。仲間になると、夜は、ぼんやり青白く光って、ランプのかわりになってくれる。',
  },
  // せいれい C（1/16）
  blue_soul: {
    rate: 1 / 16, mix: ['undead'], names: ['アオビ', 'ゆらら', 'ソウル', 'しずく'],
    growth: { hp: 0.9, mp: 1.2, str: 0.75, def: 0.85, agi: 1.2, mag: 1.4, heal: 0.7 },
    learn: [[1, 'mera'], [4, 'm8n_bs_flame'], [9, 'manusa'], [14, 'm8n_bs_drain'], [20, 'merazoma']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'よみの国をさまよっていた、青い火のたましい。仲間になると、もう、さびしくないみたい。いつも、ぽかぽか温かい。',
  },
  // ドラゴン A（なりにくい 1/26）
  hydran: {
    rate: 1 / 26, mix: ['undead'], names: ['ヒドラ', 'ミツクビ', 'ヒドリン', 'アタマン'],
    growth: { hp: 1.15, mp: 0.6, str: 1.15, def: 1.1, agi: 0.95, mag: 0.6, heal: 0.5 },
    learn: [[1, 'm_bite'], [4, 'm8n_hy_bite'], [9, 'sukara'], [14, 'm8n_hy_heads'], [20, 'm8n_hy_regrow']],
    gear: { weapons: [], armor: ['heavy'], shield: false, head: false },
    note: '頭がいくつもある大へび。仲間になると、頭がみんなべつべつのことを考えていて、なかなか前にすすめない。',
  },
};

// F〜C の 4しゅは 系統配合の 子には ならない（companions.js の familyPool。まぜ配合の 子には なる）
for (const sp of ['kerberos', 'bone_fish', 'biri_jelly', 'blue_soul']) FRIENDS_C8B[sp].noFamily = true;
