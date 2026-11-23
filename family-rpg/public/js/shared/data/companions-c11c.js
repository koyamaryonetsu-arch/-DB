// 第3部 第3章 第3幕「はかりの回ろうと、ふたつの光」の 魔物の 仲間（companions.js で まぜる）
// 第26回の きまり（data/companions-c11b.js と おなじ）:
// ・ふつうの 魔物は 1/10〜1/16・強い 魔物は 1/22〜1/26
// ・growth の 合計は 今までの 仲間と おなじ はば（力の 魔物 5.8〜6.1・呪文の 魔物 6.8〜7.3）
// ・learn の 技は 味方が 使っても うごく もの（ボスの しかけの 技は 入れない）
// ・mix … 系統まぜ配合で 生まれる 相手の 系統（breed-mix.js）
// ・7しゅ とも 系統配合（familyPool）の 子には ならない（noFamily）
// ・ランクは 出現表から（tools/gen-monster-ranks.mjs の 表 … data/monster-ranks.js）
// ・ここは ほかの データを import しない（酒場・ゲストの 一覧からも 読む ため）
export const FRIENDS_C11C = {
  c11c_tmoon: {
    rate: 1 / 12, mix: ['material'], names: ['ツキノスケ', 'カードン', 'ミカヅキへい', 'ペラリ'],
    growth: { hp: 1.15, mp: 0.5, str: 1.3, def: 1.3, agi: 0.8, mag: 0.5, heal: 0.4 },
    learn: [[1, 'm_tackle'], [4, 'm11c_tm_spear'], [9, 'sukara'], [14, 'baikiruto'], [20, 'm11c_tm_moon']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'つきのトランプへい。仲間になると、ねる前に、月のマークをひらりと見せて、ねかしつけてくれる。',
  },
  c11c_tstar: {
    rate: 1 / 12, mix: ['material'], names: ['ホシスケ', 'キラペラ', 'スターへい', 'ペラボシ'],
    growth: { hp: 1.05, mp: 0.5, str: 1.25, def: 1.15, agi: 0.95, mag: 0.6, heal: 0.4 },
    learn: [[1, 'm_tackle'], [4, 'm11c_ts_spear'], [9, 'sukara'], [14, 'baikiruto'], [20, 'm11c_ts_star']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'ほしのトランプへい。仲間になると、夜空の星の数を、いっしょにかぞえてくれる。',
  },
  c11c_bird: {
    rate: 1 / 13, mix: ['beast'], names: ['テンビン', 'ハカリン', 'ツリアイ', 'ピヨカリ'],
    growth: { hp: 0.95, mp: 1.2, str: 0.85, def: 0.9, agi: 1.35, mag: 1.3, heal: 0.6 },
    learn: [[1, 'm_bite'], [4, 'm11c_bd_peck'], [9, 'hoimi'], [14, 'behoimi'], [20, 'm11c_bd_weigh']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'てんびんどり。仲間になると、おやつを、ぴったり同じ重さに分けてくれる。',
  },
  c11c_tcomet: {
    rate: 1 / 14, mix: ['material'], names: ['ホウキ', 'シッポへい', 'スイスイ', 'ナガレペラ'],
    growth: { hp: 1.0, mp: 0.5, str: 1.35, def: 1.0, agi: 1.35, mag: 0.5, heal: 0.4 },
    learn: [[1, 'm_tackle'], [4, 'm11c_tc_dash'], [9, 'baikiruto'], [14, 'sukara'], [20, 'm11c_tc_tail']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'ほうきぼしのトランプへい。仲間になると、かけっこで、いつもいちばんにゴールする。',
  },
  c11c_lamp: {
    rate: 1 / 13, mix: ['material'], names: ['アオランプ', 'カイロン', 'ヒカリン', 'ポワ'],
    growth: { hp: 0.95, mp: 1.3, str: 0.7, def: 1.0, agi: 1.0, mag: 1.45, heal: 0.6 },
    learn: [[1, 'm_tackle'], [4, 'm11c_lp_beam'], [9, 'hoimi'], [14, 'behoimi'], [20, 'm11c_lp_fence']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'かいろうランプ。仲間になると、夜のろうかを、青白く明るくてらしてくれる。',
  },
  c11c_tsun: {
    rate: 1 / 14, mix: ['material'], names: ['オヒサマへい', 'サンペラ', 'ポカポカ', 'ヒノマル'],
    growth: { hp: 1.2, mp: 0.6, str: 1.15, def: 1.3, agi: 0.6, mag: 0.5, heal: 0.6 },
    learn: [[1, 'm_tackle'], [4, 'm11c_tu_spear'], [9, 'hoimi'], [14, 'sukara'], [20, 'm11c_tu_sun']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'たいようのトランプへい。仲間になると、さむい日に、ぽかぽかとあたためてくれる。',
  },
  c11c_moth: {
    rate: 1 / 24, mix: ['beast'], names: ['サクガ', 'ヒラヒラ', 'リンプン', 'ヒカリガ'],
    growth: { hp: 0.95, mp: 1.25, str: 0.75, def: 0.95, agi: 1.15, mag: 1.4, heal: 0.6 },
    learn: [[1, 'm_tackle'], [4, 'm11c_mt_dust'], [9, 'hoimi'], [14, 'behoimi'], [20, 'm11c_mt_flit']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'さくのひかりガ。仲間になると、光のさくのすきまを、こっそり教えてくれる。',
  },
};

// 7しゅ とも 系統配合の 子には ならない（companions.js の familyPool。まぜ配合の 子には なる）
for (const sp of Object.keys(FRIENDS_C11C)) FRIENDS_C11C[sp].noFamily = true;
