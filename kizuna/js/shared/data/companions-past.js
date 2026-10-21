// 第2部 第6章 Step 1・2 の 魔物の なかま（companions.js で まぜる）と、ゲストの ミナモ（MINAMO_GUEST。名前の 約束 docs/plan-ch6.md の 9）
// 第26回の きまり（data/companions-phantom.js と おなじ）:
// ・ふつうの 魔物は 1/14〜1/18・強い 魔物（大きな 魔物・よろいの からくり）は 1/20〜1/24
// ・growth の 合計は 今までの 仲間と おなじ はば（力の 魔物 5.8〜6.1・呪文の 魔物 6.8〜7.3）
// ・learn の 技は 味方が 使っても うごく もの（ボスの しかけの 技は 入れない）
// ・familyPool に 入れない（noFamily: 系統配合の 子には ならない）
// ・ここは ほかの データを import しない（酒場・ゲストの 一覧からも 読む ため）
export const FRIENDS_PAST = {
  moss_deer: {
    rate: 1 / 20, names: ['コケジカ', 'モリー', 'ツノスケ', 'みどりん'],
    growth: { hp: 1.2, mp: 0.5, str: 1.2, def: 1.15, agi: 0.85, mag: 0.6, heal: 0.6 },
    learn: [[1, 'm_tackle'], [4, 'm6_md_horn'], [9, 'm6_md_call'], [14, 'sukara'], [20, 'm6_md_stomp']],
    gear: { weapons: [], armor: ['cloth', 'heavy'], shield: false, head: false },
    note: '千年前の森の大きなシカ。仲間になると、背中のこけがふかふかしている。めったに仲間にならない。',
  },
  amber_moth: {
    rate: 1 / 16, names: ['コハク', 'ヒラリ', 'アンバー', 'ぱたぱた'],
    growth: { hp: 0.85, mp: 1.3, str: 0.7, def: 0.85, agi: 1.15, mag: 1.4, heal: 0.75 },
    learn: [[1, 'm_tackle'], [4, 'm6_am_wing'], [9, 'm6_am_dust'], [14, 'gira'], [20, 'm6_am_amber']],
    gear: { weapons: [], armor: ['cloth', 'robe'], shield: false, head: false },
    note: 'こはく色のはねのガ。仲間になると、夜もぼんやり光ってくれる。',
  },
  elder_sprout: {
    rate: 1 / 18, names: ['コボク', 'メブキ', 'ドングリ', 'もりお'],
    growth: { hp: 1.15, mp: 1.0, str: 0.85, def: 1.1, agi: 0.6, mag: 1.0, heal: 1.2 },
    learn: [[1, 'hoimi'], [4, 'm6_es_root'], [9, 'm6_es_leaf'], [14, 'behoimi'], [20, 'm6_es_nut']],
    gear: { weapons: ['staff'], armor: ['cloth', 'robe'], shield: false, head: 'hat' },
    note: '古い木から生まれた木の子ども。仲間になると、木の実でみんなを回復してくれる。',
  },
  toki_hare: {
    rate: 1 / 14, names: ['トキピョン', 'チクタク', 'ハヤミ', 'いそぎ'],
    growth: { hp: 0.9, mp: 0.7, str: 1.1, def: 0.8, agi: 1.6, mag: 0.8, heal: 0.6 },
    learn: [[1, 'm_tackle'], [4, 'm6_th_kick'], [9, 'm6_th_hurry'], [14, 'piorimu'], [20, 'm6_th_bell']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: 'hat' },
    note: '大きな時計をさげた、白いうさぎ。仲間になっても、いつもいそいでいる。',
  },
  sand_sprite: {
    rate: 1 / 16, names: ['サラリ', 'スナッチ', 'キララ', 'つぶつぶ'],
    growth: { hp: 0.85, mp: 1.3, str: 0.7, def: 0.85, agi: 1.25, mag: 1.35, heal: 0.75 },
    learn: [[1, 'mera'], [4, 'm6_sp_flow'], [9, 'm6_sp_hide'], [14, 'merami'], [20, 'm6_sp_throw']],
    gear: { weapons: [], armor: ['cloth', 'robe'], shield: false, head: false },
    note: 'さらさらの砂でできた、小さな精。仲間になると、かたにのって、くすぐったい。',
  },
  glass_scorpion: {
    rate: 1 / 16, names: ['サソリン', 'スナハサミ', 'トキバリ', 'ちょきちょき'],
    growth: { hp: 1.05, mp: 0.55, str: 1.2, def: 1.15, agi: 0.95, mag: 0.6, heal: 0.55 },
    learn: [[1, 'm_tackle'], [4, 'm6_gs_claw'], [9, 'm6_gs_shell'], [14, 'baikiruto'], [20, 'm6_gs_tail']],
    gear: { weapons: [], armor: ['cloth', 'heavy'], shield: false, head: false },
    note: 'しっぽの先が砂時計のサソリ。仲間になると、ときどき砂の時計で時間を教えてくれる。',
  },
  sand_golem: {
    rate: 1 / 22, names: ['スナゴン', 'サンディ', 'ズシン', 'すなお'],
    growth: { hp: 1.25, mp: 0.5, str: 1.25, def: 1.35, agi: 0.45, mag: 0.6, heal: 0.55 },
    learn: [[1, 'm_swing'], [4, 'm6_sgl_fist'], [9, 'kabau'], [14, 'sukara'], [20, 'm6_sgl_pit']],
    gear: { weapons: [], armor: ['heavy'], shield: true, head: false },
    note: '時のほこらを守っていた、砂の番兵。仲間になると、仲間をかばってくれる。めったに仲間にならない。',
  },
  gear_beetle: {
    rate: 1 / 18, names: ['ギアカブ', 'ゼンマ', 'カブトン', 'くるくる'],
    growth: { hp: 1.1, mp: 0.5, str: 1.25, def: 1.25, agi: 0.8, mag: 0.55, heal: 0.55 },
    learn: [[1, 'm_tackle'], [4, 'm6_gb_horn'], [9, 'm6_gb_wind'], [14, 'baikiruto'], [20, 'm6_gb_spin']],
    gear: { weapons: [], armor: ['cloth', 'heavy'], shield: false, head: false },
    note: '背中に歯車のあるカブトムシ。仲間になると、ぜんまいをまくのを手つだってほしがる。',
  },
  ruin_sentinel: {
    rate: 1 / 22, names: ['イシモリ', 'バンペイ', 'ゴロタ', 'まもるん'],
    growth: { hp: 1.2, mp: 0.55, str: 1.2, def: 1.35, agi: 0.5, mag: 0.75, heal: 0.55 },
    learn: [[1, 'm_swing'], [4, 'm6_rsn_spear'], [9, 'm6_rsn_guard'], [14, 'sukara'], [20, 'm6_rsn_beam']],
    gear: { weapons: ['spear'], armor: ['heavy'], shield: true, head: 'helm' },
    note: '時の神殿を守っていた石の番兵。仲間になっても、まじめに見はりをしている。めったに仲間にならない。',
  },
  pendulum_bat: {
    rate: 1 / 16, names: ['フリコ', 'ゆらゆら', 'チクバット', 'こうもん'],
    growth: { hp: 0.9, mp: 1.0, str: 1.05, def: 0.85, agi: 1.4, mag: 1.0, heal: 0.6 },
    learn: [[1, 'm_tackle'], [4, 'm6_pdb_swing'], [9, 'm6_pdb_tick'], [14, 'piorimu'], [20, 'm6_pdb_ring']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: 'ふりこのように体をゆらすコウモリ。仲間になると、じっと見ているとねむくなる。',
  },
  chrono_knight: {
    rate: 1 / 24, names: ['トキモリ', 'クロノ', 'ハリー', 'ぎんきし'],
    growth: { hp: 1.2, mp: 0.6, str: 1.25, def: 1.3, agi: 0.6, mag: 0.75, heal: 0.5 },
    learn: [[1, 'm_swing'], [4, 'm6_ck_blade'], [9, 'kabau'], [14, 'm6_ck_slow'], [20, 'm6_ck_stop']],
    gear: { weapons: ['sword', 'spear'], armor: ['heavy'], shield: true, head: 'helm' },
    note: '時の神殿のおくを守っていた、よろいのからくり。仲間になると、時間をきっちり守る。めったに仲間にならない。',
  },
  rewind_ghost: {
    rate: 1 / 18, names: ['モドリン', 'ユラ', 'ムカシ', 'まきまき'],
    growth: { hp: 0.9, mp: 1.3, str: 0.7, def: 0.85, agi: 1.0, mag: 1.3, heal: 1.1 },
    learn: [[1, 'hoimi'], [4, 'm6_rg_hand'], [9, 'behoimi'], [14, 'm6_rg_song'], [20, 'm6_rg_rewind']],
    gear: { weapons: ['staff'], armor: ['cloth', 'robe'], shield: false, head: false },
    note: '時の流れにまよいこんだ、ゆうれい。仲間になると、キズをまきもどしてなおしてくれる。',
  },
  clock_spider: {
    rate: 1 / 18, names: ['トケイグ', 'ビョウシン', 'チックン', 'あみあみ'],
    growth: { hp: 1.05, mp: 0.7, str: 1.2, def: 1.0, agi: 1.15, mag: 0.75, heal: 0.55 },
    learn: [[1, 'm_tackle'], [4, 'm6_cs_fang'], [9, 'm6_cs_web'], [14, 'baikiruto'], [20, 'm6_cs_jump']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '体が時計の文字ばんのクモ。仲間になると、おなかの時計がいつも正しい。',
  },
};

// 系統配合の 子には ならない（companions.js の familyPool）
for (const f of Object.values(FRIENDS_PAST)) f.noFamily = true;

// ───── ゲストの ミナモ（千年前の 星読みの むすめ。リオンの おさななじみ）─────
// A が 台本の guest で 入れ、c6_flow で 外れる（shops.js の GUESTS.minamo）。world/party.js の guestChar → makeNpcSupportChar で 作る
//   レベルは パーティーの いちばん 高い レベル（minLevel より 低い ときは minLevel）。職業は 星の歌姫（回復が とくいな 超級職。星読みに ちなむ）・作戦は いのちだいじに
//   その 子だけの 技 skills（ひらめき技として 入る。オートで 使いやすい かんたんな 技）: 星のしずく（1人を 大きく 回復）・
//   星読みのいのり（みんなを 回復）・ながれぼし（敵みんなに 光）・星読みの守り（みんなの 守備力）
//   装備は 千年前の 里の 店（ランク10）の 品
export const MINAMO_GUEST = {
  id: 'guest_minamo', name: 'ミナモ', job: 'star_diva', tactics: 'heal', minLevel: 57,
  look: { body: 1, hair: 1, hairColor: 4, skin: 0, color: 4, style: 'braid', hcol: 'aqua', tone: 'fair', face: 'calm' },
  skills: ['mm6_dew', 'mm6_prayer', 'mm6_comet', 'mm6_read'],
  gear: { weapon: 'p6_kodai_staff', armor: 'p6_kodai_robe', head: 'p6_kodai_hat' },
};
