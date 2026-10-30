// 第2部 第6章 Step 6「時計塔の心臓」の 魔物の なかま（companions.js で まぜる）
// 第26回の きまり（data/companions-tokei.js と おなじ）:
// ・ふつうの 魔物は 1/14〜1/18・強い 魔物は 1/20〜1/24（大時計の番人は めったに 見ない ので 1/32）
// ・growth の 合計は 今までの 仲間と おなじ はば（力の 魔物 5.8〜6.1・呪文の 魔物 6.8〜7.3）
// ・learn の 技は 味方が 使っても うごく もの（ボスの しかけの 技・なかまを よぶ 技は 入れない）
// ・系統配合の 子にも なる（noFamily を つけない。配合で 足りない 所を うめる … docs/plan-r53-breed-more.md の 1・plan-ch6.md の 16）
//   ゾンビ A・せいれい B と A・物質 S・植物 B・悪魔 B（＋ ゾンビ B）。ランクは tools/gen-monster-ranks.mjs の 表（monster-ranks.js）
// ・ここは ほかの データを import しない
export const FRIENDS_TOKEI6 = {
  // ゾンビ A（なりにくい 1/30）
  tokei_ghost: {
    rate: 1 / 30, names: ['チクタ', 'ボンボン', 'トケゴン', 'よなかの'],
    growth: { hp: 0.95, mp: 1.15, str: 0.8, def: 0.85, agi: 1.1, mag: 1.3, heal: 0.8 },
    learn: [[1, 'mera'], [4, 'm6z_gh_touch'], [9, 'm6z_gh_steal'], [14, 'hyadaruko'], [20, 'm6z_gh_wail']],
    gear: { weapons: [], armor: ['cloth', 'robe'], shield: false, head: false },
    note: '顔がかいちゅう時計のゆうれい。仲間になると、毎朝、同じ時間に、ボーン…と鳴って起こしてくれる。',
  },
  // せいれい A（1/24）
  bell_sprite: {
    rate: 1 / 24, names: ['チリン', 'リンリン', 'ベルル', 'すずね'],
    growth: { hp: 0.85, mp: 1.3, str: 0.7, def: 0.85, agi: 1.15, mag: 1.15, heal: 1.2 },
    learn: [[1, 'hoimi'], [4, 'm6z_bs_chime'], [9, 'behoimi'], [14, 'm6z_bs_ring'], [20, 'm6z_bs_heal']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: 'hat' },
    note: '小さな金のかねの中にすむ精。仲間になると、うれしい時に、チリンと鳴る。',
  },
  // せいれい B（1/22）
  second_sprite: {
    rate: 1 / 22, names: ['セコン', 'チック', 'ピコピコ', 'はりぼう'],
    growth: { hp: 0.85, mp: 0.95, str: 1.05, def: 0.8, agi: 1.45, mag: 1.0, heal: 0.6 },
    learn: [[1, 'm_tackle'], [4, 'm6z_ss_tick'], [9, 'piorimu'], [14, 'm6z_ss_haste'], [20, 'm6z_ss_rain']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '時計の秒針から生まれた精。仲間になると、いつも、ちょっとだけ先を歩いている。',
  },
  // 物質 S（めったに 見ない・1/32）
  clock_golem: {
    rate: 1 / 32, names: ['オオトケイ', 'ゴーン', 'ダイアル', 'もんばん'],
    growth: { hp: 1.3, mp: 0.4, str: 1.3, def: 1.45, agi: 0.45, mag: 0.6, heal: 0.4 },
    learn: [[1, 'm_swing'], [4, 'm6z_cg_pound'], [9, 'kabau'], [14, 'm6z_cg_guard'], [20, 'm6z_cg_alarm']],
    gear: { weapons: ['axe'], armor: ['heavy'], shield: true, head: false },
    note: 'むねに大きな文字ばんのある、からくりの大男。仲間になると、町の時計がおくれていないか、気になってしかたがない。',
  },
  // 植物 B（1/22）
  zenmai_fern: {
    rate: 1 / 22, names: ['クルリン', 'ゼンゼン', 'わかば', 'まきまき'],
    growth: { hp: 1.1, mp: 0.8, str: 1.1, def: 1.05, agi: 0.85, mag: 0.95, heal: 0.95 },
    learn: [[1, 'hoimi'], [4, 'm6z_zf_whip'], [9, 'm6z_zf_spore'], [14, 'behoimi'], [20, 'm6z_zf_spring']],
    gear: { weapons: ['whip'], armor: ['cloth'], shield: false, head: 'hat' },
    note: 'くるくるまいたわか葉の草。仲間になると、雨の日は、わか葉をのばして、かさのかわりになってくれる。',
  },
  // 悪魔 B（1/24）
  wind_devil: {
    rate: 1 / 24, names: ['ネジコ', 'キリキリ', 'ゼンマ', 'まきすけ'],
    growth: { hp: 0.85, mp: 1.1, str: 0.95, def: 0.8, agi: 1.25, mag: 1.2, heal: 0.6 },
    learn: [[1, 'mera'], [4, 'm6z_wd_key'], [9, 'm6z_wd_wind'], [14, 'medapani'], [20, 'm6z_wd_dark']],
    gear: { weapons: ['dagger'], armor: ['cloth'], shield: false, head: 'hat' },
    note: 'せなかにねじまきのかぎがささった小あくま。仲間になると、ねる前に、だれかにねじをまいてもらいたがる。',
  },
  // ゾンビ B（1/20）
  clock_bones: {
    rate: 1 / 20, names: ['カタカタ', 'ギアボーン', 'ほねきち', 'からっぽ'],
    growth: { hp: 1.05, mp: 0.4, str: 1.3, def: 1.15, agi: 0.95, mag: 0.5, heal: 0.5 },
    learn: [[1, 'm_swing'], [4, 'm6z_cb_slash'], [9, 'sukara'], [14, 'baikiruto'], [20, 'm6z_cb_rattle']],
    gear: { weapons: ['sword'], armor: ['heavy'], shield: true, head: 'helm' },
    note: '歯車とばねでうごく、ほねの兵。仲間になると、歩くたびにカタカタ鳴るので、かくれんぼがにがて。',
  },
};
