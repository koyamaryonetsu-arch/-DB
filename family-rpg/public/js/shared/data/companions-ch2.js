// 第2章の なかまに なる モンスター（companions.js で まぜる）
export const FRIENDS_CH2 = {
  marine_slime: {
    rate: 1 / 12, names: ['マリン', 'ぷるうみ', 'しずく', 'なみお'],
    growth: { hp: 1.0, mp: 1.0, str: 0.9, def: 1.0, agi: 1.0, mag: 1.05, heal: 1.15 },
    learn: [[1, 'm_splash'], [4, 'hoimi'], [8, 'hyado'], [12, 'behoimi'], [16, 'm_tidal'], [22, 'behomara']],
    note: '水の技と回復の呪文を覚える、海のぷるりん。',
  },
  wild_gull: {
    rate: 1 / 12, names: ['カモメン', 'ソラノ', 'ウミネ', 'かもたろう'],
    growth: { hp: 0.85, mp: 0.6, str: 1.05, def: 0.8, agi: 1.4, mag: 0.6, heal: 0.6 },
    learn: [[1, 'm_dive'], [4, 'm_gust'], [8, 'piorimu'], [12, 'kamaitachi'], [17, 'm_storm_wing']],
    note: 'とてもすばやい。空から急降下して戦う。',
  },
  shell_knight: {
    rate: 1 / 14, names: ['シェルン', 'カイガラ', 'ヤドー', 'かたまる'],
    growth: { hp: 1.15, mp: 0.4, str: 1.1, def: 1.5, agi: 0.6, mag: 0.4, heal: 0.5 },
    learn: [[1, 'm_pinch'], [4, 'm_shell_guard'], [8, 'kabau'], [12, 'sukara'], [18, 'nioudachi']],
    note: 'とてもかたい。仲間を守るのがとくい。',
  },
  sea_serpent: {
    rate: 1 / 18, names: ['ウミヘビー', 'ナガオ', 'シーサ', 'うねうね'],
    growth: { hp: 1.2, mp: 0.8, str: 1.2, def: 1.0, agi: 1.0, mag: 0.9, heal: 0.6 },
    learn: [[1, 'm_coil'], [5, 'm_tidal'], [10, 'hyadaruko'], [15, 'm_storm_wing'], [21, 'sg_mahyado']],
    note: '海の大へび。まきつきと大波がとくい。',
  },
  wind_imp: {
    rate: 1 / 12, names: ['ビュン', 'かぜまる', 'つむじ', 'ソヨ'],
    growth: { hp: 0.8, mp: 1.2, str: 0.7, def: 0.8, agi: 1.35, mag: 1.2, heal: 0.8 },
    learn: [[1, 'bagi'], [5, 'm_dance'], [9, 'piorimu'], [13, 'bagima'], [19, 'sg_bagikurosu']],
    note: '風の呪文がとくいな、いたずらこぞう。',
  },
  coconut: {
    rate: 1 / 12, names: ['ココ', 'ヤシまる', 'ナッツ', 'みのり'],
    growth: { hp: 1.15, mp: 0.7, str: 1.05, def: 1.1, agi: 0.7, mag: 0.6, heal: 1.0 },
    learn: [[1, 'm_coconut'], [4, 'm_sleep_powder'], [8, 'm_root_heal'], [12, 'behoimi'], [17, 'm_branch_whip']],
    note: 'がんじょうなヤシの木。ねむりの粉で敵をねむらせる。',
  },
  ghost_pirate: {
    rate: 1 / 16, names: ['キャプテンG', 'ゆうれいくん', 'ボーン', 'ドクロン'],
    growth: { hp: 1.0, mp: 0.8, str: 1.2, def: 0.9, agi: 1.05, mag: 0.8, heal: 0.4 },
    learn: [[1, 'm_cursed_blade'], [5, 'm_ghost_laugh'], [10, 'pr_kaizokugiri'], [15, 'm_drain'], [21, 'ms_dark']],
    note: '海賊のゆうれい。呪いの剣で敵の目をくらます。',
  },
  thunder_imp: {
    rate: 1 / 16, names: ['ピカリ', 'ゴロゴロ', 'ライ', 'いなずま'],
    growth: { hp: 0.8, mp: 1.25, str: 0.7, def: 0.8, agi: 1.3, mag: 1.35, heal: 0.7 },
    learn: [[1, 'm_thunder'], [6, 'm_gust'], [11, 'mk_raiden'], [17, 'bagima']],
    note: '雷の力をもつこぞう。雷の技を覚える。',
  },
  storm_bird: {
    rate: 1 / 18, names: ['ストーム', 'アラシ', 'ハヤテ', 'ゲイル'],
    growth: { hp: 1.0, mp: 0.7, str: 1.2, def: 0.9, agi: 1.45, mag: 0.8, heal: 0.6 },
    learn: [[1, 'm_dive'], [5, 'm_storm_wing'], [10, 'kamaitachi'], [16, 'piorimu']],
    note: '嵐の中をとぶ鳥。風の技で敵みんなを切りさく。',
  },
  coral_golem: {
    rate: 1 / 18, names: ['サンゴー', 'コーラル', 'ゴロン', 'ももいろ'],
    growth: { hp: 1.4, mp: 0.4, str: 1.25, def: 1.45, agi: 0.5, mag: 0.4, heal: 0.6 },
    learn: [[1, 'm_coral_punch'], [5, 'm_harden'], [10, 'kabau'], [15, 'm_stomp']],
    note: 'サンゴの体をもつゴーレム。力もちで、とてもかたい。',
  },
  storm_soldier: {
    rate: 1 / 24, names: ['アラシヘイ', 'かぜまる', 'ゲイルン', 'ソルジャー'],
    growth: { hp: 1.1, mp: 0.5, str: 1.2, def: 1.15, agi: 1.0, mag: 0.5, heal: 0.5 },
    learn: [[1, 'm_wind_slash'], [5, 'm_harden'], [10, 'kabau'], [16, 'kaiha']],
    note: '嵐の将軍の兵士だった。心を入れかえて仲間になった。',
  },
};
