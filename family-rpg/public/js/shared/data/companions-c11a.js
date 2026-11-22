// 第3部 第3章 第1幕「星の船と、星座の島」の 魔物の 仲間（companions.js で まぜる）
// 第26回の きまり（data/companions-c10c.js と おなじ）:
// ・ふつうの 魔物は 1/10〜1/16・強い 魔物は 1/22〜1/26
// ・growth の 合計は 今までの 仲間と おなじ はば（力の 魔物 5.8〜6.1・呪文の 魔物 6.8〜7.3）
// ・learn の 技は 味方が 使っても うごく もの（ボスの しかけの 技は 入れない）
// ・mix … 系統まぜ配合で 生まれる 相手の 系統（breed-mix.js）
// ・8しゅ とも 系統配合（familyPool）の 子には ならない（noFamily）
// ・ランクは 出現表から（tools/gen-monster-ranks.mjs の 表 … data/monster-ranks.js）
// ・ここは ほかの データを import しない（酒場・ゲストの 一覧からも 読む ため）
export const FRIENDS_C11A = {
  c11a_jelly: {
    rate: 1 / 10, mix: ['slime'], names: ['ウミボシ', 'クラリン', 'キラカサ', 'ユラユラ'],
    growth: { hp: 1.1, mp: 0.6, str: 1.1, def: 1.1, agi: 0.85, mag: 0.6, heal: 0.6 },
    learn: [[1, 'm_tackle'], [4, 'm11a_jl_sting'], [9, 'hoimi'], [14, 'sukara'], [20, 'm11a_jl_flash']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'ほしのうみクラゲ。仲間になると、夜の水あびのとき、かさをぴかぴか光らせてくれる。',
  },
  c11a_comet: {
    rate: 1 / 12, mix: ['dragon'], names: ['ホウキ', 'スイセイ', 'シッポボシ', 'ピュー'],
    growth: { hp: 1.0, mp: 0.5, str: 1.2, def: 0.95, agi: 1.35, mag: 0.5, heal: 0.4 },
    learn: [[1, 'm_bite'], [4, 'm11a_cm_dash'], [9, 'baikiruto'], [14, 'sukara'], [20, 'm11a_cm_trail']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'ほうきぼしウオ。仲間になると、光のしっぽで、夜空にきれいな線をかいてくれる。',
  },
  c11a_ray: {
    rate: 1 / 11, mix: ['dragon'], names: ['アマノ', 'ミルキー', 'ヒラヒラ', 'ホシカワ'],
    growth: { hp: 1.05, mp: 0.5, str: 1.2, def: 1.0, agi: 1.2, mag: 0.5, heal: 0.4 },
    learn: [[1, 'm_bite'], [4, 'm11a_ry_glide'], [9, 'baikiruto'], [14, 'sukara'], [20, 'm11a_ry_wave']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'あまのがわエイ。仲間になると、星の海のおさんぽに、せなかへ乗せてくれる。',
  },
  c11a_tobi: {
    rate: 1 / 10, mix: ['beast'], names: ['トビボシ', 'ピョンウオ', 'ナガレ', 'ハネスケ'],
    growth: { hp: 1.0, mp: 0.55, str: 1.25, def: 0.95, agi: 1.3, mag: 0.55, heal: 0.4 },
    learn: [[1, 'm_tackle'], [4, 'm11a_tb_jump'], [9, 'baikiruto'], [14, 'sukara'], [20, 'm11a_tb_splash']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'ながれぼしトビウオ。仲間になると、船のまわりを、ぴょんぴょんとんで、ついてくる。',
  },
  c11a_crab: {
    rate: 1 / 14, mix: ['material'], names: ['ホシモリ', 'ハサミン', 'カタガニ', 'セイザン'],
    growth: { hp: 1.25, mp: 0.4, str: 1.3, def: 1.45, agi: 0.6, mag: 0.4, heal: 0.4 },
    learn: [[1, 'm_tackle'], [4, 'm11a_cr_pinch'], [9, 'sukara'], [14, 'm11a_cr_shell'], [20, 'baikiruto']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'ほしもりガニ。仲間になると、家の大切なものを、はさみでしっかり守ってくれる。',
  },
  c11a_ram: {
    rate: 1 / 10, mix: ['spirit'], names: ['コヒツジ', 'メエボシ', 'モコリン', 'ユメノ'],
    growth: { hp: 1.15, mp: 0.6, str: 1.1, def: 1.1, agi: 0.75, mag: 0.6, heal: 0.6 },
    learn: [[1, 'm_tackle'], [4, 'm11a_rm_horn'], [9, 'hoimi'], [14, 'sukara'], [20, 'm11a_rm_lull']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'ほしのこひつじ。仲間になると、ねむれない夜に、こもりうたを歌ってくれる。',
  },
  c11a_wisp: {
    rate: 1 / 16, mix: ['slime'], names: ['ツナギ', 'イトボシ', 'ピカット', 'ムスビ'],
    growth: { hp: 0.95, mp: 1.3, str: 0.7, def: 0.95, agi: 1.05, mag: 1.45, heal: 0.6 },
    learn: [[1, 'm_tackle'], [4, 'm11a_ws_thread'], [9, 'hoimi'], [14, 'behoimi'], [20, 'm11a_ws_tie']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'ほしつなぎ。仲間になると、光の糸で、まいごにならないように道しるべを作ってくれる。',
  },
  c11a_owl: {
    rate: 1 / 24, mix: ['undead'], names: ['ヨルホウ', 'ミミズク', 'ホシミ', 'フクスケ'],
    growth: { hp: 1.0, mp: 1.2, str: 0.8, def: 0.95, agi: 1.1, mag: 1.35, heal: 0.6 },
    learn: [[1, 'm_bite'], [4, 'm11a_ow_swoop'], [9, 'hoimi'], [14, 'behoimi'], [20, 'm11a_ow_gaze']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'しまのよるフクロウ。仲間になると、夜のあいだ、ずっと見はりをしてくれる。',
  },
};

// 8しゅ とも 系統配合の 子には ならない（companions.js の familyPool。まぜ配合の 子には なる）
for (const sp of Object.keys(FRIENDS_C11A)) FRIENDS_C11A[sp].noFamily = true;
