// 第3部 第2章 第3幕「紫と、うばわれた音」の 魔物の 仲間（companions.js で まぜる）
// 第26回の きまり（data/companions-c10b.js と おなじ）:
// ・ふつうの 魔物は 1/10〜1/16・強い 魔物は 1/22〜1/26
// ・growth の 合計は 今までの 仲間と おなじ はば（力の 魔物 5.8〜6.1・呪文の 魔物 6.8〜7.3）
// ・learn の 技は 味方が 使っても うごく もの（ボスの しかけの 技は 入れない）
// ・mix … 系統まぜ配合で 生まれる 相手の 系統（breed-mix.js）
// ・8しゅ とも 系統配合（familyPool）の 子には ならない（noFamily）
// ・ランクは 出現表から（tools/gen-monster-ranks.mjs の 表 … data/monster-ranks.js）
// ・ここは ほかの データを import しない（酒場・ゲストの 一覧からも 読む ため）
export const FRIENDS_C10C = {
  c10c_sheep: {
    rate: 1 / 10, mix: ['spirit'], names: ['ムラクモ', 'モコムラ', 'フワリ', 'ユメヒツジ'],
    growth: { hp: 1.15, mp: 0.6, str: 1.1, def: 1.1, agi: 0.75, mag: 0.6, heal: 0.6 },
    learn: [[1, 'm_tackle'], [4, 'm10c_sh_tackle'], [9, 'hoimi'], [14, 'sukara'], [20, 'm10c_sh_mist']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'むらさき雲ひつじ。仲間になると、ねむれない夜に、もこもこの毛でつつんでくれる。',
  },
  c10c_ray: {
    rate: 1 / 11, mix: ['dragon'], names: ['ヨゾラ', 'エイタ', 'ホシマダラ', 'スイスイ'],
    growth: { hp: 1.0, mp: 0.5, str: 1.2, def: 0.95, agi: 1.3, mag: 0.5, heal: 0.4 },
    learn: [[1, 'm_bite'], [4, 'm10c_ry_glide'], [9, 'baikiruto'], [14, 'sukara'], [20, 'm10c_ry_sting']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'よぞらエイ。仲間になると、夜空の散歩に、せなかへ乗せてくれる。',
  },
  c10c_puff: {
    rate: 1 / 12, mix: ['slime'], names: ['ゴロタ', 'ピカクモ', 'ムラサメ', 'ゴロン'],
    growth: { hp: 0.95, mp: 1.3, str: 0.7, def: 0.9, agi: 1.15, mag: 1.4, heal: 0.6 },
    learn: [[1, 'm_tackle'], [4, 'm10c_pf_bolt'], [9, 'hoimi'], [14, 'behoimi'], [20, 'm10c_pf_rain']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'ゴロゴロぐも。仲間になると、はたけに、ちょうどいい雨をふらせてくれる。',
  },
  c10c_jelly: {
    rate: 1 / 14, mix: ['slime'], names: ['ウキクラ', 'フワフワ', 'イシモチ', 'クラリン'],
    growth: { hp: 1.15, mp: 0.5, str: 1.1, def: 1.15, agi: 0.95, mag: 0.5, heal: 0.5 },
    learn: [[1, 'm_tackle'], [4, 'm10c_jl_sting'], [9, 'sukara'], [14, 'm10c_jl_glow'], [20, 'm10c_jl_stone']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'うき石クラゲ。仲間になると、高い所の物を、ふわりと取ってきてくれる。',
  },
  c10c_carrier: {
    rate: 1 / 10, mix: ['material'], names: ['ハコビ', 'セッセ', 'ホシクズ', 'ハコスケ'],
    growth: { hp: 1.2, mp: 0.5, str: 1.25, def: 1.2, agi: 0.85, mag: 0.6, heal: 0.4 },
    learn: [[1, 'm_tackle'], [4, 'm10c_cr_box'], [9, 'sukara'], [14, 'm10c_cr_rest'], [20, 'm10c_cr_throw']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'ほしくずはこび。仲間になると、おもい荷物を、よろこんで運んでくれる。ほめると、もっと運ぶ。',
  },
  c10c_mole: {
    rate: 1 / 11, mix: ['beast'], names: ['ホリホリ', 'キラヅメ', 'モグスケ', 'ツチボシ'],
    growth: { hp: 1.15, mp: 0.5, str: 1.35, def: 1.2, agi: 0.9, mag: 0.5, heal: 0.4 },
    learn: [[1, 'm_bite'], [4, 'm10c_ml_drill'], [9, 'baikiruto'], [14, 'sukara'], [20, 'm10c_ml_dust']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'ほしほりモグラ。仲間になると、にわに、きらきらの石をうめてくれる。',
  },
  c10c_lamp: {
    rate: 1 / 14, mix: ['undead'], names: ['ランタ', 'ミハリン', 'ジリリ', 'ヒカリメ'],
    growth: { hp: 0.95, mp: 1.3, str: 0.7, def: 0.95, agi: 1.0, mag: 1.45, heal: 0.6 },
    learn: [[1, 'm_tackle'], [4, 'm10c_lp_beam'], [9, 'hoimi'], [14, 'm10c_lp_alarm'], [20, 'm10c_lp_flare']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'みはりランタン。仲間になると、夜の道を、ずっとてらしてくれる。',
  },
  c10c_haniwa: {
    rate: 1 / 16, mix: ['material'], names: ['ハニタ', 'ムラハニ', 'ツチヘイ', 'カタハニ'],
    growth: { hp: 1.3, mp: 0.4, str: 1.3, def: 1.45, agi: 0.6, mag: 0.4, heal: 0.4 },
    learn: [[1, 'm_tackle'], [4, 'm10c_hw_spear'], [9, 'sukara'], [14, 'm10c_hw_guard'], [20, 'm10c_hw_march']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'とりでのはにわ兵。仲間になると、家の前に立って、まじめに見はりをしてくれる。',
  },
};

// 8しゅ とも 系統配合の 子には ならない（companions.js の familyPool。まぜ配合の 子には なる）
for (const sp of Object.keys(FRIENDS_C10C)) FRIENDS_C10C[sp].noFamily = true;
