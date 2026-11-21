// 第3部 第2章 第1幕「赤と緑」の 魔物の 仲間（companions.js で まぜる）
// 第26回の きまり（data/companions-c9d.js と おなじ）:
// ・ふつうの 魔物は 1/10〜1/16・強い 魔物は 1/22〜1/26
// ・growth の 合計は 今までの 仲間と おなじ はば（力の 魔物 5.8〜6.1・呪文の 魔物 6.8〜7.3）
// ・learn の 技は 味方が 使っても うごく もの（中ボスの しかけの 技は 入れない）
// ・mix … 系統まぜ配合で 生まれる 相手の 系統（breed-mix.js）
// ・8しゅ とも 系統配合（familyPool）の 子には ならない（noFamily。はじめの ころの 配合に Lv105 いじょうの 子が まざらない ように）
// ・ここは ほかの データを import しない（酒場・ゲストの 一覧からも 読む ため）
export const FRIENDS_C10A = {
  c10r_lizard: {
    rate: 1 / 12, mix: ['beast'], names: ['コミチ', 'アカセナ', 'ヒビトカ', 'イシダタ'],
    growth: { hp: 1.15, mp: 0.6, str: 1.25, def: 1.15, agi: 0.95, mag: 0.6, heal: 0.4 },
    learn: [[1, 'm_bite'], [4, 'm10r_lz_bite'], [9, 'baikiruto'], [14, 'm10r_lz_tail'], [20, 'm10r_lz_spit']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '古道のマグマトカゲ。仲間になると、つめたい夜に、せなかであたためてくれる。',
  },
  c10r_slime: {
    rate: 1 / 10, mix: ['plant'], names: ['ネップ', 'ポカポカ', 'ドライヤ', 'フワネツ'],
    growth: { hp: 1.0, mp: 1.15, str: 0.85, def: 1.0, agi: 1.0, mag: 1.2, heal: 1.0 },
    learn: [[1, 'm_tackle'], [4, 'm10r_sl_body'], [9, 'behoimi'], [14, 'hoimi'], [20, 'm10r_sl_wind']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'ねっぷうぷるりん。仲間になると、ぬれた服を、あつい風でかわかしてくれる。',
  },
  c10r_turtle: {
    rate: 1 / 24, mix: ['material'], names: ['ゴツガメ', 'ヨウガン', 'カメキチ', 'コウラ'],
    growth: { hp: 1.35, mp: 0.45, str: 1.25, def: 1.4, agi: 0.5, mag: 0.6, heal: 0.4 },
    learn: [[1, 'm_tackle'], [4, 'm10r_tt_bash'], [9, 'sukara'], [14, 'm10r_tt_shell'], [20, 'm10r_tt_quake']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'ようがんガメ。仲間になると、こうらの上で、おゆをわかしてくれる。',
  },
  c10r_pot: {
    rate: 1 / 16, mix: ['demon'], names: ['ツボッチ', 'ヒノツボ', 'カマド', 'ボッボ'],
    growth: { hp: 0.95, mp: 1.25, str: 0.8, def: 1.1, agi: 0.85, mag: 1.4, heal: 0.6 },
    learn: [[1, 'm_tackle'], [4, 'm10r_pt_bonk'], [9, 'mera'], [14, 'm10r_pt_smoke'], [20, 'm10r_pt_fire']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'ほのおのつぼ。仲間になると、キャンプで、おいしいシチューをにこんでくれる。',
  },
  c10g_spore: {
    rate: 1 / 10, mix: ['slime'], names: ['ホウシー', 'キノピカ', 'ポワン', 'ネムタケ'],
    growth: { hp: 1.0, mp: 1.15, str: 0.85, def: 0.95, agi: 0.9, mag: 1.3, heal: 1.0 },
    learn: [[1, 'm_tackle'], [4, 'm10g_sp_bump'], [9, 'hoimi'], [14, 'm10g_sp_puff'], [20, 'm10g_sp_glow']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'ほうしキノコ。仲間になると、暗い夜に、ほうしをぽわっと光らせてくれる。',
  },
  c10g_vine: {
    rate: 1 / 11, mix: ['undead'], names: ['ネッコ', 'ツタロウ', 'カラミ', 'シュルル'],
    growth: { hp: 1.1, mp: 0.7, str: 1.2, def: 1.05, agi: 1.05, mag: 0.6, heal: 0.4 },
    learn: [[1, 'm_bite'], [4, 'm10g_vn_whip'], [9, 'baikiruto'], [14, 'm10g_vn_bind'], [20, 'm10g_vn_sap']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'ねっこヅタ。仲間になると、高い木の上の実を、つるでとってくれる。',
  },
  c10g_beetle: {
    rate: 1 / 24, mix: ['material'], names: ['ネッカブ', 'ツノタロウ', 'カブリン', 'ブンブン'],
    growth: { hp: 1.3, mp: 0.5, str: 1.35, def: 1.3, agi: 0.75, mag: 0.5, heal: 0.4 },
    learn: [[1, 'm_tackle'], [4, 'm10g_bt_horn'], [9, 'sukara'], [14, 'm10g_bt_guard'], [20, 'm10g_bt_charge']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'ねっこカブト。仲間になると、おもい荷物を、せなかにのせてはこんでくれる。',
  },
  c10g_bag: {
    rate: 1 / 14, mix: ['demon'], names: ['ミノッチ', 'ハッパ', 'ユラユラ', 'ミノタン'],
    growth: { hp: 1.05, mp: 1.0, str: 0.95, def: 1.15, agi: 1.0, mag: 1.1, heal: 0.6 },
    learn: [[1, 'm_tackle'], [4, 'm10g_bg_swing'], [9, 'hoimi'], [14, 'm10g_bg_hide'], [20, 'm10g_bg_leaf']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'はっぱミノムシ。仲間になると、雨の日に、大きな葉をかさにしてくれる。',
  },
};

// 8しゅ とも 系統配合の 子には ならない（companions.js の familyPool。まぜ配合の 子には なる）
for (const sp of Object.keys(FRIENDS_C10A)) FRIENDS_C10A[sp].noFamily = true;
