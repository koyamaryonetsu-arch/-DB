// 第5章 Step 8「影の城」の 魔物の なかま（companions.js で まぜる）
// 第26回の きまり（data/companions-earth.js と おなじ）:
// ・ふつうの 魔物は 1/14〜1/18・強い 魔物（大きな 魔物・よろいの 騎士）は 1/20〜1/24
// ・growth の 合計は 今までの 仲間と おなじ はば（力の 魔物 5.8〜6.1・呪文の 魔物 6.8〜7.3）
// ・learn の 技は 味方が 使っても うごく もの（まぼろしの 技・はね返す 光は 入れない）
// ・familyPool に 入れない（noFamily: 系統配合の 子には ならない）
// （ファイルの 名前: data/companions-castle.js は B9 の 酒場の ノクト〈NOCTO_COMPANION〉の ファイル）
export const FRIENDS_PHANTOM = {
  gale_crow: {
    rate: 1 / 16, names: ['カァスケ', 'クロウ', 'アラシ', 'くろまる'],
    growth: { hp: 0.95, mp: 0.9, str: 1.1, def: 0.9, agi: 1.3, mag: 1.0, heal: 0.6 },
    learn: [[1, 'm_tackle'], [4, 'm_gc_dive'], [9, 'm_gc_feather'], [14, 'baikiruto'], [20, 'm_gc_wing']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: 'hat' },
    note: '黒い雲をまとった大きなカラス。仲間になると、風のつばさであおいでくれる。',
  },
  mill_keeper: {
    rate: 1 / 20, names: ['クルクル', 'フウシャ', 'ミル', 'ぐるん'],
    growth: { hp: 1.2, mp: 0.5, str: 1.2, def: 1.35, agi: 0.5, mag: 0.75, heal: 0.5 },
    learn: [[1, 'm_swing'], [4, 'm_mk_brace'], [9, 'm_mk_blade'], [14, 'sukara'], [20, 'm_mk_gust']],
    gear: { weapons: [], armor: ['heavy'], shield: true, head: false },
    note: '影の城の風車を守っていた、石と木の番人。今は仲間のために、うでを回す。',
  },
  wind_weasel: {
    rate: 1 / 14, names: ['カマタ', 'シュン', 'ヒュウ', 'つむじ'],
    growth: { hp: 0.9, mp: 0.7, str: 1.15, def: 0.85, agi: 1.5, mag: 0.8, heal: 0.6 },
    learn: [[1, 'm_tackle'], [4, 'm_ww_dance'], [9, 'm_ww_cut'], [14, 'baikiruto'], [20, 'piorimu']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'つむじ風にのって走る、小さなけもの。仲間になると、とても素早い。',
  },
  ember_wolf: {
    rate: 1 / 16, names: ['ヒノコ', 'ガルル', 'ホムラ', 'あかまる'],
    growth: { hp: 1.05, mp: 0.6, str: 1.2, def: 0.95, agi: 1.15, mag: 0.85, heal: 0.55 },
    learn: [[1, 'm_tackle'], [4, 'm_ew_fang'], [9, 'm_ew_howl'], [14, 'gira'], [20, 'm_ew_breath']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'もえる毛なみのオオカミ。仲間になると、あたたかい。',
  },
  candle_ghost: {
    rate: 1 / 16, names: ['ロウソ', 'ポッ', 'ともしび', 'ゆらり'],
    growth: { hp: 0.9, mp: 1.3, str: 0.75, def: 0.9, agi: 1.0, mag: 1.4, heal: 0.75 },
    learn: [[1, 'mera'], [4, 'm_cg_flame'], [9, 'm_cg_wax'], [14, 'merami'], [20, 'begirama']],
    gear: { weapons: [], armor: ['cloth', 'robe'], shield: false, head: false },
    note: 'ろうそくの火にやどった、小さなおばけ。仲間になると、くらい所をてらしてくれる。',
  },
  blackflame_knight: {
    rate: 1 / 22, names: ['クロホノ', 'ナイト', 'ゴウエン', 'くろきし'],
    growth: { hp: 1.2, mp: 0.55, str: 1.25, def: 1.3, agi: 0.6, mag: 0.7, heal: 0.5 },
    learn: [[1, 'm_swing'], [4, 'm_bk_slash'], [9, 'kabau'], [14, 'sukara'], [20, 'm_bk_wall']],
    gear: { weapons: ['sword', 'axe', 'spear'], armor: ['heavy'], shield: true, head: 'helm' },
    note: '黒い炎をまとった、よろいの騎士。仲間になると、もう城を守らなくていい。めったに仲間にならない。',
  },
  mirror_jelly: {
    rate: 1 / 16, names: ['カガミン', 'ぷるる', 'キラリ', 'クラゲン'],
    growth: { hp: 1.0, mp: 1.2, str: 0.8, def: 1.0, agi: 0.95, mag: 1.3, heal: 0.8 },
    learn: [[1, 'm_tackle'], [4, 'm_mj_sting'], [9, 'hoimi'], [14, 'm_mj_bubble'], [20, 'behoimi']],
    gear: { weapons: [], armor: ['cloth', 'robe'], shield: false, head: false },
    note: '鏡のように光る、すきとおったくらげ。仲間になると、ぷかぷかついてくる。',
  },
  shade_serpent: {
    rate: 1 / 22, names: ['ミズチ', 'ウネ', 'ニョロ', 'あおへび'],
    growth: { hp: 1.25, mp: 0.55, str: 1.2, def: 1.15, agi: 0.8, mag: 0.7, heal: 0.55 },
    learn: [[1, 'm_tackle'], [4, 'm_ss_bite'], [9, 'm_ss_coil'], [14, 'baikiruto'], [20, 'm_ss_tide']],
    gear: { weapons: [], armor: ['cloth', 'heavy'], shield: false, head: false },
    note: '水路にひそんでいた大きなへび。仲間になると、背中にのせてくれる…かもしれない。めったに仲間にならない。',
  },
  foam_siren: {
    rate: 1 / 18, names: ['アワミ', 'ウタ', 'シャボン', 'みなも'],
    growth: { hp: 0.9, mp: 1.3, str: 0.7, def: 0.85, agi: 1.05, mag: 1.3, heal: 1.1 },
    learn: [[1, 'hoimi'], [4, 'm_fsi_shot'], [9, 'm_fsi_lull'], [14, 'behoimi'], [20, 'm_fsi_mend']],
    gear: { weapons: ['staff', 'fan'], armor: ['cloth', 'robe'], shield: false, head: 'hat' },
    note: '水のあわから生まれた歌姫。仲間になると、いやしの歌をうたってくれる。',
  },
};

// 系統配合の 子には ならない（companions.js の familyPool）
for (const f of Object.values(FRIENDS_PHANTOM)) f.noFamily = true;
