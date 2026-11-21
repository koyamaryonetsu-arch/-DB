// 第3部 第2章 第2幕「青と白」の 魔物の 仲間（companions.js で まぜる）
// 第26回の きまり（data/companions-c10a.js と おなじ）:
// ・ふつうの 魔物は 1/10〜1/16・強い 魔物は 1/22〜1/26
// ・growth の 合計は 今までの 仲間と おなじ はば（力の 魔物 5.8〜6.1・呪文の 魔物 6.8〜7.3）
// ・learn の 技は 味方が 使っても うごく もの（中ボスの しかけの 技は 入れない）
// ・mix … 系統まぜ配合で 生まれる 相手の 系統（breed-mix.js）
// ・7しゅ とも 系統配合（familyPool）の 子には ならない（noFamily）
// ・白の 見はりの 魔物 3しゅは 出現表に 出ない（見つかった 時の 決まった 戦いだけ）ので、ランクは 手で きめる（rank。tools/gen-monster-ranks.mjs の 表に 入らない）
// ・ここは ほかの データを import しない（酒場・ゲストの 一覧からも 読む ため）
export const FRIENDS_C10B = {
  c10b_spirit: {
    rate: 1 / 10, mix: ['slime'], names: ['ミカガミ', 'サカサ', 'シズク', 'ウラミズ'],
    growth: { hp: 1.0, mp: 1.2, str: 0.8, def: 0.95, agi: 1.0, mag: 1.3, heal: 1.0 },
    learn: [[1, 'm_tackle'], [4, 'm10b_sp_shot'], [9, 'behoimi'], [14, 'hoimi'], [20, 'm10b_sp_rain']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'みかがみの精。仲間になると、のどがかわいた時に、つめたい水をくれる。',
  },
  c10b_crab: {
    rate: 1 / 11, mix: ['material'], names: ['アオガニ', 'ヨコアルキ', 'ハサミン', 'カニタ'],
    growth: { hp: 1.2, mp: 0.5, str: 1.2, def: 1.35, agi: 0.75, mag: 0.5, heal: 0.4 },
    learn: [[1, 'm_bite'], [4, 'm10b_cr_pinch'], [9, 'sukara'], [14, 'm10b_cr_guard'], [20, 'm10b_cr_sand']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'うら砂ガニ。仲間になると、砂の中から、きれいな貝がらをさがしてくれる。',
  },
  c10b_fish: {
    rate: 1 / 14, mix: ['dragon'], names: ['シズクン', 'ピチャ', 'ウオスケ', 'プカリ'],
    growth: { hp: 1.05, mp: 1.0, str: 1.05, def: 1.0, agi: 1.15, mag: 0.85, heal: 0.6 },
    learn: [[1, 'm_bite'], [4, 'm10b_fs_bite'], [9, 'hoimi'], [14, 'm10b_fs_bubble'], [20, 'm10b_fs_jet']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'しずくウオ。仲間になると、あつい日に、しずくの中に入れてくれる。',
  },
  c10b_sand: {
    rate: 1 / 16, mix: ['demon'], names: ['スナボウ', 'サラサラ', 'モコスナ', 'ザラリ'],
    growth: { hp: 1.25, mp: 0.6, str: 1.25, def: 1.2, agi: 0.7, mag: 0.6, heal: 0.4 },
    learn: [[1, 'm_tackle'], [4, 'm10b_sd_punch'], [9, 'sukara'], [14, 'm10b_sd_sink'], [20, 'm10b_sd_storm']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'すなぼうず。仲間になると、すなはまで、大きなお城を作ってくれる。',
  },
  c10b_iceowl: {
    rank: 'D', rate: 1 / 22, mix: ['spirit'], names: ['ツララ', 'ミハリ', 'ホウホウ', 'シロメ'],
    growth: { hp: 1.0, mp: 1.0, str: 1.15, def: 0.95, agi: 1.3, mag: 0.8, heal: 0.6 },
    learn: [[1, 'm_bite'], [4, 'm10b_ow_claw'], [9, 'baikiruto'], [14, 'm10b_ow_glare'], [20, 'm10b_ow_blow']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'つららフクロウ。仲間になると、夜のあいだ、ずっと見はりをしてくれる。',
  },
  c10b_wolf: {
    rank: 'D', rate: 1 / 24, mix: ['dragon'], names: ['ユキアカリ', 'ツキゲ', 'シロガネ', 'ハヤテ'],
    growth: { hp: 1.15, mp: 0.5, str: 1.3, def: 1.0, agi: 1.25, mag: 0.4, heal: 0.4 },
    learn: [[1, 'm_bite'], [4, 'm10b_wf_fang'], [9, 'baikiruto'], [14, 'm10b_wf_howl'], [20, 'm10b_wf_breath']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'ゆきあかりオオカミ。仲間になると、雪の夜道を、先にあるいて道を教えてくれる。',
  },
  c10b_armor: {
    rank: 'C', rate: 1 / 26, mix: ['undead'], names: ['ヒョウガ', 'カチコチ', 'ヨロイン', 'スケルン'],
    growth: { hp: 1.3, mp: 0.4, str: 1.3, def: 1.45, agi: 0.6, mag: 0.4, heal: 0.4 },
    learn: [[1, 'm_tackle'], [4, 'm10b_ar_slash'], [9, 'sukara'], [14, 'm10b_ar_guard'], [20, 'm10b_ar_sweep']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '氷のよろい。仲間になると、なつの日に、ひんやりつめたいせなかにもたれさせてくれる。',
  },
};

// 7しゅ とも 系統配合の 子には ならない（companions.js の familyPool。まぜ配合の 子には なる）
for (const sp of Object.keys(FRIENDS_C10B)) FRIENDS_C10B[sp].noFamily = true;
