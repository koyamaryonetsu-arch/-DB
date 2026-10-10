// 第4章（コガネ地方・砂の底の神殿）と 夜の 魔物の なかま（companions.js で まぜる。2026年10月 見なおし）
//
// 前は 第4章の 魔物が 仲間に ならなかった（トゲサボテン だけ）。夜の 魔物も ならなかった。
// そのため 物語が すすむと「全然 仲間に ならない」ように 感じた。ここで 仲間に なる ように した。
// ・ふつうの 魔物は 1/12〜1/18（10〜20回 たたかえば 1回くらい）
// ・強い 魔物・めずらしい 魔物は 1/20〜1/24
// ・黄金虫（お金の 虫・すぐ にげる）は 仲間に ならない
// growth の 合計は 今までの 仲間と おなじ はば（力の 魔物 5.8〜6.1・呪文の 魔物 6.8〜7.3）
// learn の 技は 味方が 使っても うごく もの（仲間を 呼ぶ・もぐる・はね返す・前ぶれ・構え は 入れない）
// familyPool に 入れない（noFamily: 系統配合の 子には ならない。今までの 配合の 結果を かえない）
export const FRIENDS_CH4 = {
  // ───────────── 夜の 魔物（第1章・第2章の 夜） ─────────────
  moon_pururin: {
    rate: 1 / 12, names: ['ツキプル', 'よるぷる', 'ルナ', 'みかづき'],
    growth: { hp: 0.95, mp: 1.0, str: 0.85, def: 0.95, agi: 1.05, mag: 1.0, heal: 1.1 },
    learn: [[1, 'm_tackle'], [3, 'm_sleep_powder'], [6, 'hoimi'], [10, 'rariho'], [15, 'behoimi'], [21, 'm_star_dust']],
    note: '月の夜のぷるりん。ねむりの粉と回復の呪文を覚える。',
  },
  night_owl: {
    rate: 1 / 14, names: ['ホーホー', 'ヨフカシ', 'ミミズク', 'フクタ'],
    growth: { hp: 0.95, mp: 0.8, str: 1.05, def: 0.85, agi: 1.3, mag: 0.85, heal: 0.7 },
    learn: [[1, 'm_peck'], [4, 'm_glare'], [8, 'm_gust'], [13, 'piorimu'], [18, 'm_double_peck']],
    note: '夜ふかしのフクロウ。にらんで敵を動けなくする。',
  },
  wisp_lamp: {
    rate: 1 / 16, names: ['ヒトダマ', 'ボンボリ', 'あかり', 'ゆらめき'],
    growth: { hp: 0.85, mp: 1.3, str: 0.6, def: 0.85, agi: 1.0, mag: 1.4, heal: 0.8 },
    learn: [[1, 'mera'], [3, 'gira'], [7, 'merami'], [12, 'm_shadow_fire'], [17, 'begirama']],
    note: 'ゆらゆらゆれる火の玉。炎の呪文がとくい。',
  },
  dark_wolf: {
    rate: 1 / 18, names: ['クロガ', 'ヤミバ', 'ノワール', 'ヨルマル'],
    growth: { hp: 1.05, mp: 0.5, str: 1.3, def: 0.9, agi: 1.3, mag: 0.5, heal: 0.5 },
    learn: [[1, 'm_bite'], [4, 'm_drain'], [9, 'm_pounce'], [14, 'm_warcry'], [20, 'm_thunder_fang']],
    note: '闇にとける黒いオオカミ。かみついて体力をすいとる。',
  },
  glow_jelly: {
    rate: 1 / 16, names: ['ヒカリン', 'ピカプル', 'ほたる', 'ルミ'],
    growth: { hp: 1.0, mp: 1.15, str: 0.75, def: 0.95, agi: 0.95, mag: 1.15, heal: 1.1 },
    learn: [[1, 'm_splash'], [4, 'hoimi'], [8, 'rariho'], [12, 'm_tidal'], [17, 'behoimi'], [23, 'm_water_rain']],
    gear: { armor: ['cloth', 'robe'] },
    note: '夜の海で光るぷるりん。水と回復の呪文を覚える。',
  },

  // ───────────── 第4章: 砂の国 ─────────────
  sand_slime: {
    rate: 1 / 12, names: ['スナプル', 'サラサラ', 'すなまる', 'デューン'],
    growth: { hp: 1.0, mp: 0.9, str: 0.95, def: 1.05, agi: 1.0, mag: 0.85, heal: 0.95 },
    learn: [[1, 'm_tackle'], [3, 'm_sand_throw'], [7, 'hoimi'], [12, 'm_harden'], [17, 'manusa'], [23, 'behoimi']],
    note: '砂の中から顔を出すぷるりん。砂かけで敵の目をくらます。',
  },
  sand_vulture: {
    rate: 1 / 14, names: ['ハゲタ', 'コンドル', 'サバク', 'ヴァル'],
    growth: { hp: 1.0, mp: 0.5, str: 1.25, def: 0.9, agi: 1.3, mag: 0.5, heal: 0.5 },
    learn: [[1, 'm_peck'], [4, 'm_double_peck'], [9, 'm_gust'], [14, 'm_vulture_dive'], [20, 'piorimu']],
    note: '砂ばくの空を回るハゲタカ。急降下の一撃が強い。',
  },
  scorpion_soldier: {
    rate: 1 / 14, names: ['サソリン', 'ハリマル', 'スコープ', 'チクリ'],
    growth: { hp: 1.15, mp: 0.5, str: 1.2, def: 1.2, agi: 0.85, mag: 0.5, heal: 0.6 },
    learn: [[1, 'm_pinch'], [4, 'm_poison_sting'], [8, 'm_harden'], [13, 'm_scissor_combo'], [19, 'kabau']],
    note: 'かたいからのサソリの兵。毒ばりで敵を毒にする。',
  },
  mirage_flower: {
    rate: 1 / 14, names: ['ミラジュ', 'カゲロウ', 'はなび', 'ゆらり'],
    growth: { hp: 0.95, mp: 1.15, str: 0.7, def: 0.9, agi: 0.9, mag: 1.15, heal: 1.2 },
    learn: [[1, 'm_root_drain'], [4, 'm_mirage_pollen'], [8, 'm_petal_heal'], [13, 'm_sweet_scent'], [18, 'behoimi'], [24, 'behomara']],
    note: '砂ばくにさくまぼろしの花。仲間みんなの傷をいやす。',
  },
  dry_frog: {
    rate: 1 / 12, names: ['カラケロ', 'ヒリヒリ', 'ゲコサバ', 'ケロスナ'],
    growth: { hp: 1.1, mp: 0.7, str: 1.1, def: 0.95, agi: 1.0, mag: 0.7, heal: 0.75 },
    learn: [[1, 'm_frog_jump'], [4, 'm_tongue_sip'], [8, 'm_dry_croak'], [13, 'm_poison_lick'], [19, 'm_poison_spray']],
    note: 'かわいた運河のカエル。長い舌でMPをすいとる。',
  },
  moon_ghost: {
    rate: 1 / 16, names: ['ツキカゲ', 'ゆらら', 'ムーン', 'しらつゆ'],
    growth: { hp: 0.95, mp: 1.25, str: 0.8, def: 0.85, agi: 1.0, mag: 1.3, heal: 0.9 },
    learn: [[1, 'm_soul_sip'], [4, 'm_ghost_fade'], [8, 'mahoton'], [13, 'm_shadow_fire'], [19, 'm_moon_beam']],
    gear: { armor: ['cloth'], shield: false, head: 'hat' },
    note: '月の夜にあらわれるゆうれい。月の光線で敵みんなをうつ。',
  },
  mummy_soldier: {
    rate: 1 / 16, names: ['マミー', 'ホウタイ', 'グルグル', 'ミイラン'],
    growth: { hp: 1.25, mp: 0.5, str: 1.2, def: 1.05, agi: 0.75, mag: 0.5, heal: 0.6 },
    learn: [[1, 'm_mummy_grab'], [4, 'm_mummy_bandage'], [9, 'm_swing'], [14, 'kabau'], [20, 'm_cursed_blade']],
    note: 'ほうたいをまいたピラミッドの兵。ほうたいで敵をしばる。',
  },
  cursed_pot: {
    rate: 1 / 18, names: ['ツボッチ', 'ポット', 'カメキチ', 'のろたん'],
    growth: { hp: 1.0, mp: 1.2, str: 0.9, def: 1.25, agi: 0.7, mag: 1.0, heal: 0.8 },
    learn: [[1, 'm_pot_spin'], [4, 'm_pot_suck'], [9, 'm_pot_smoke'], [14, 'm_harden'], [20, 'm_shadow_fire']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: 'hat' },
    note: 'のろいのかかったつぼ。敵のMPをすいこんでしまう。',
  },
  sandstone_golem: {
    rate: 1 / 20, names: ['サガン', 'ゴロスナ', 'イワキチ', 'デザート'],
    growth: { hp: 1.4, mp: 0.4, str: 1.3, def: 1.45, agi: 0.5, mag: 0.4, heal: 0.55 },
    learn: [[1, 'm_rock_throw'], [4, 'm_golem_harden'], [9, 'kabau'], [14, 'm_stomp'], [21, 'm_avalanche']],
    note: '砂岩でできたゴーレム。とてもかたくて力もち。',
  },
  lamp_genie: {
    rate: 1 / 24, names: ['ジーニー', 'まじん', 'ランプン', 'アラジ'],
    growth: { hp: 1.05, mp: 1.3, str: 0.9, def: 0.9, agi: 0.95, mag: 1.4, heal: 0.75 },
    learn: [[1, 'mera'], [4, 'm_genie_smoke'], [9, 'merami'], [14, 'm_genie_blaze'], [20, 'm_genie_flame'], [26, 'begirama']],
    note: 'ランプからあらわれた魔人。炎の魔法がとても強い。めったに仲間にならない。',
  },
  sand_worm: {
    rate: 1 / 20, names: ['ワーム', 'スナモグ', 'ニョロン', 'ミミズン'],
    growth: { hp: 1.45, mp: 0.4, str: 1.3, def: 1.05, agi: 0.65, mag: 0.4, heal: 0.6 },
    learn: [[1, 'm_worm_bite'], [4, 'm_worm_spit'], [9, 'm_coil'], [15, 'm_stomp'], [21, 'm_drain']],
    gear: { weapons: [] },
    note: '砂の中をおよぐ大きなミミズ。大きな口でくらいつく。',
  },
  sandstorm_spirit: {
    rate: 1 / 18, names: ['スナアラシ', 'ツムジ', 'ヒュルル', 'サジン'],
    growth: { hp: 0.9, mp: 1.2, str: 0.75, def: 0.85, agi: 1.25, mag: 1.3, heal: 0.75 },
    learn: [[1, 'm_spirit_whirl'], [4, 'm_spirit_dust'], [8, 'bagi'], [13, 'm_spirit_gust'], [19, 'bagima']],
    note: '砂あらしのせいれい。砂つむじで敵みんなをまきこむ。',
  },
  dark_scorpion: {
    rate: 1 / 18, names: ['ヤミハリ', 'クロサソ', 'シャドウ', 'ドクロン'],
    growth: { hp: 1.15, mp: 0.5, str: 1.3, def: 1.15, agi: 0.9, mag: 0.5, heal: 0.5 },
    learn: [[1, 'm_pinch'], [4, 'm_dark_sting'], [9, 'm_scissor_combo'], [14, 'm_harden'], [20, 'm_poison_tail']],
    note: '夜の砂ばくのサソリ。やみの毒ばりで敵を毒にする。',
  },
  castle_armor: {
    rate: 1 / 20, names: ['ヨロイン', 'カラッポ', 'ガシャン', 'ナイト'],
    growth: { hp: 1.25, mp: 0.4, str: 1.25, def: 1.45, agi: 0.6, mag: 0.4, heal: 0.55 },
    learn: [[1, 'm_swing'], [4, 'm_armor_guard'], [9, 'kabau'], [14, 'm_armor_sweep'], [20, 'm_twin_slash']],
    gear: { weapons: ['sword', 'axe', 'spear'] },
    note: '古城の中を歩く、からっぽのよろい。仲間をかばって守る。',
  },
  sand_shark: {
    rate: 1 / 18, names: ['サメゾウ', 'ヒレマル', 'ジョーズ', 'スナザメ'],
    growth: { hp: 1.2, mp: 0.4, str: 1.35, def: 0.95, agi: 1.1, mag: 0.4, heal: 0.5 },
    learn: [[1, 'm_bite'], [4, 'm_shark_fin'], [9, 'm_shark_double'], [15, 'm_warcry'], [21, 'm_fin_slash']],
    gear: { weapons: [] },
    note: '砂の海をおよぐサメ。2回かみついてくる。',
  },
  water_spirit: {
    rate: 1 / 16, names: ['ミズハ', 'しずく', 'セセラギ', 'アクア'],
    growth: { hp: 0.9, mp: 1.3, str: 0.6, def: 0.85, agi: 1.0, mag: 1.15, heal: 1.4 },
    learn: [[1, 'm_splash'], [3, 'hoimi'], [7, 'm_water_shot'], [12, 'behoimi'], [17, 'm_spirit_mend'], [23, 'm_water_rain']],
    note: '神殿の水のせいれい。いやしの水で仲間を大きく回復する。',
  },
  water_dragon: {
    rate: 1 / 24, names: ['スイリュウ', 'ミズチ', 'リヴァ', 'うねり'],
    growth: { hp: 1.35, mp: 0.7, str: 1.3, def: 1.15, agi: 0.85, mag: 0.8, heal: 0.6 },
    learn: [[1, 'm_bite'], [4, 'm_dragon_bite'], [9, 'm_dragon_tail'], [15, 'm_water_breath'], [22, 'm_dragon_claw']],
    note: '神殿の水にすむ竜。水のブレスで敵みんなをおそう。めったに仲間にならない。',
  },
  sand_crab: {
    rate: 1 / 16, names: ['スナガニ', 'ハサミン', 'カニタロ', 'ガニマル'],
    growth: { hp: 1.15, mp: 0.4, str: 1.2, def: 1.4, agi: 0.7, mag: 0.4, heal: 0.55 },
    learn: [[1, 'm_pinch'], [4, 'm_harden'], [9, 'm_scissor_combo'], [14, 'kabau'], [20, 'm_shell_spin']],
    note: '大きなはさみの砂ガニ。からがとてもかたい。',
  },
  mirror_knight: {
    rate: 1 / 22, names: ['カガミン', 'ミラー', 'カガミ', 'リフレ'],
    growth: { hp: 1.15, mp: 0.6, str: 1.25, def: 1.35, agi: 0.85, mag: 0.6, heal: 0.6 },
    learn: [[1, 'm_mirror_blade'], [4, 'm_shield_guard'], [9, 'kabau'], [14, 'm_twin_slash'], [20, 'm_mirror_beam']],
    gear: { weapons: ['sword', 'spear'] },
    note: '鏡のよろいの騎士。鏡のつるぎで切りつける。',
  },
  trick_mirror: {
    rate: 1 / 20, names: ['マドワシ', 'ピカッ', 'かがみん', 'キラキラ'],
    growth: { hp: 0.85, mp: 1.25, str: 0.6, def: 1.1, agi: 1.05, mag: 1.3, heal: 0.8 },
    learn: [[1, 'm_mirror_beam'], [4, 'manusa'], [9, 'm_trick_light'], [14, 'm_gem_shine'], [20, 'm_star_breath']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '空にうかぶふしぎな鏡。まどわしの光で敵を混乱させる。',
  },
};

// 系統配合の 子には ならない（companions.js の familyPool）
for (const f of Object.values(FRIENDS_CH4)) f.noFamily = true;
