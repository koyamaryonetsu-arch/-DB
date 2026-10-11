// 第5章 Step 2「星の塔」の 魔物の なかま（companions.js で まぜる）
// 第26回の きまり（data/companions-ch4.js と おなじ）:
// ・ふつうの 魔物は 1/12〜1/18（10〜20回 たたかえば 1回くらい）
// ・強い 魔物・めずらしい 魔物は 1/20〜1/24
// growth の 合計は 今までの 仲間と おなじ はば（力の 魔物 5.8〜6.1・呪文の 魔物 6.8〜7.3）
// learn の 技は 味方が 使っても うごく もの（仲間を 呼ぶ・はね返す・前ぶれ・構え・見通しの目 は 入れない）
// familyPool に 入れない（noFamily: 系統配合の 子には ならない。今までの 配合の 結果を かえない）
export const FRIENDS_CH5 = {
  stone_gargoyle: {
    rate: 1 / 16, names: ['ガーゴ', 'イシガミ', 'ゴイル', 'セキゾウ'],
    growth: { hp: 1.15, mp: 0.5, str: 1.25, def: 1.35, agi: 0.85, mag: 0.5, heal: 0.5 },
    learn: [[1, 'm_peck'], [4, 'm_harden'], [9, 'm_garg_dive'], [14, 'kabau'], [20, 'm_stone_skin']],
    note: '塔の石のガーゴイル。石の体で守りをかためる。',
  },
  clockwork_guard: {
    rate: 1 / 20, names: ['カラクリ', 'ギアール', 'ゼンマイ', 'チクタク'],
    growth: { hp: 1.2, mp: 0.4, str: 1.25, def: 1.45, agi: 0.6, mag: 0.4, heal: 0.55 },
    learn: [[1, 'm_swing'], [4, 'm_gear_cutter'], [9, 'kabau'], [14, 'm_clock_wind'], [20, 'm_twin_slash']],
    gear: { weapons: ['sword', 'axe', 'spear'] },
    note: '昔の勇者の時代のからくり。歯車カッターで切りつける。',
  },
  tower_wind: {
    rate: 1 / 14, names: ['ツムジ', 'ヒュー', 'カザマ', 'ふうた'],
    growth: { hp: 0.85, mp: 1.2, str: 0.7, def: 0.8, agi: 1.35, mag: 1.3, heal: 0.75 },
    learn: [[1, 'bagi'], [4, 'm_wind_cut'], [8, 'piorimu'], [13, 'm_tower_gust'], [19, 'bagima']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '塔をふきあがるつむじ風。風の呪文がとくい。',
  },
  star_jelly: {
    rate: 1 / 14, names: ['ホシクラ', 'キララ', 'ミルキー', 'ぷかり'],
    growth: { hp: 0.95, mp: 1.25, str: 0.65, def: 0.9, agi: 0.95, mag: 1.15, heal: 1.35 },
    learn: [[1, 'm_splash'], [3, 'hoimi'], [7, 'm_star_dust'], [12, 'behoimi'], [17, 'm_jelly_heal'], [23, 'behomara']],
    gear: { weapons: [], armor: ['cloth', 'robe'], shield: false, head: 'hat' },
    note: '星空をただよう光るくらげ。星のしずくで仲間をいやす。',
  },
  comet_bird: {
    rate: 1 / 18, names: ['ホウキ', 'コメット', 'ながれ', 'スピカ'],
    growth: { hp: 1.0, mp: 0.5, str: 1.3, def: 0.9, agi: 1.35, mag: 0.55, heal: 0.5 },
    learn: [[1, 'm_peck'], [4, 'm_double_peck'], [9, 'm_comet_dive'], [14, 'piorimu'], [20, 'm_comet_tail']],
    gear: { weapons: [] },
    note: 'ほうき星のように夜空をとぶ鳥。もえながらつっこむ。',
  },
  gazer_eye: {
    rate: 1 / 22, names: ['メダマ', 'ギョロ', 'ミトオシ', 'アイ'],
    growth: { hp: 0.9, mp: 1.25, str: 0.75, def: 0.95, agi: 1.05, mag: 1.35, heal: 0.75 },
    learn: [[1, 'm_glare'], [4, 'm_eye_beam'], [9, 'mahoton'], [14, 'm_eye_seal'], [20, 'm_star_breath']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '大きな目玉の魔物。目から光線を出す。めったに仲間にならない。',
  },
};

// 系統配合の 子には ならない（companions.js の familyPool）
for (const f of Object.values(FRIENDS_CH5)) f.noFamily = true;
