// 第3部 第1章 第3幕「さかさのピラミッド」の 魔物の 仲間（companions.js で まぜる）
// 第26回の きまり（data/companions-c9b.js と おなじ）:
// ・ふつうの 魔物は 1/10〜1/16・強い 魔物は 1/22〜1/26
// ・growth の 合計は 今までの 仲間と おなじ はば（力の 魔物 5.8〜6.1・呪文の 魔物 6.8〜7.3）
// ・learn の 技は 味方が 使っても うごく もの（ボスの しかけの 技は 入れない）
// ・mix … 系統まぜ配合で 生まれる 相手の 系統（breed-mix.js）。6しゅ ぜんぶ
//   系統配合（familyPool）の 子にも なるのは 砂時計ゴーレムだけ（第1幕の 石の子ども・第2幕の 大ミミズと おなじ きまり）。ほかは noFamily
// ・ここは ほかの データを import しない（酒場・ゲストの 一覧からも 読む ため）
export const FRIENDS_C9C = {
  c9c_namazu: {
    rate: 1 / 16, mix: ['slime'], names: ['ナマズン', 'ヒゲヒゲ', 'ドロマル', 'ゴロナマ'],
    growth: { hp: 1.3, mp: 0.5, str: 1.25, def: 1.15, agi: 0.6, mag: 0.7, heal: 0.4 },
    learn: [[1, 'm_bite'], [4, 'm9c_nz_gulp'], [9, 'sukara'], [14, 'm9c_nz_mud'], [20, 'm9c_nz_quake']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '地下の川の大なまず。仲間になると、雨がふる前に、ひげをぴくぴくさせて知らせてくれる。',
  },
  c9c_gama: {
    rate: 1 / 10, mix: ['plant'], names: ['ゲコスケ', 'ガマタ', 'ケロン', 'カワベ'],
    growth: { hp: 1.15, mp: 0.95, str: 1.0, def: 1.05, agi: 0.75, mag: 1.0, heal: 1.0 },
    learn: [[1, 'm_tackle'], [4, 'm9c_gm_tongue'], [9, 'hoimi'], [14, 'm9c_gm_song'], [20, 'm9c_gm_splash']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '川べのガマ。仲間になると、夜になると、ゲコゲコ子もり歌を歌ってくれる。',
  },
  c9c_bat: {
    rate: 1 / 11, mix: ['demon'], names: ['サカサ', 'クルリン', 'パタパタ', 'ブラン'],
    growth: { hp: 0.95, mp: 0.6, str: 1.25, def: 0.9, agi: 1.45, mag: 0.6, heal: 0.4 },
    learn: [[1, 'm_bite'], [4, 'm9c_bt_fang'], [9, 'baikiruto'], [14, 'm9c_bt_swoop'], [20, 'm9c_bt_flip']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'さかさコウモリ。仲間になると、ゆかにぶら下がってねようとして、いつもころんでいる。',
  },
  c9c_golem: {
    rate: 1 / 24, mix: ['dragon'], names: ['スナトキ', 'サラサラ', 'ゴロン', 'トキゴー'],
    growth: { hp: 1.35, mp: 0.5, str: 1.3, def: 1.3, agi: 0.55, mag: 0.6, heal: 0.4 },
    learn: [[1, 'm_tackle'], [4, 'm9c_gl_punch'], [9, 'sukara'], [14, 'm9c_gl_turn'], [20, 'm9c_gl_sand']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '砂時計のゴーレム。仲間になると、ごはんの時間を、きっちり計ってくれる。',
  },
  c9c_scarab: {
    rate: 1 / 12, mix: ['material'], names: ['コガネ', 'キンピカ', 'スカラン', 'ゴロコロ'],
    growth: { hp: 1.1, mp: 0.6, str: 1.2, def: 1.35, agi: 0.85, mag: 0.6, heal: 0.4 },
    learn: [[1, 'm_bite'], [4, 'm9c_sc_horn'], [9, 'baikiruto'], [14, 'm9c_sc_shine'], [20, 'm9c_sc_roll']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'こがねスカラベ。仲間になると、砂の玉をころがして、へやをぴかぴかにそうじしてくれる。',
  },
  c9c_mummy: {
    rate: 1 / 14, mix: ['beast'], names: ['サカミイ', 'ホウタイ', 'マキマキ', 'ミイラン'],
    growth: { hp: 1.15, mp: 0.8, str: 1.2, def: 1.1, agi: 0.8, mag: 0.95, heal: 0.6 },
    learn: [[1, 'm_bite'], [4, 'm9c_mm_grab'], [9, 'hoimi'], [14, 'm9c_mm_bandage'], [20, 'm9c_mm_upside']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'さかさミイラ。仲間になると、ほうたいの上の方を、ときどきなおしてほしがる。',
  },
};

// 砂時計ゴーレム いがいの 5しゅは 系統配合の 子には ならない（companions.js の familyPool。まぜ配合の 子には なる）
for (const sp of ['c9c_namazu', 'c9c_gama', 'c9c_bat', 'c9c_scarab', 'c9c_mummy']) FRIENDS_C9C[sp].noFamily = true;
