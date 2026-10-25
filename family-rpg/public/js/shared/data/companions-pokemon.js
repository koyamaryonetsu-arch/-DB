// 第44回（ポケモン P1。docs/plan-breed-new.md の 2 の C・D と 7-1）: ポケモンの 魔物が 仲間に なった とき・生まれかた・進化
//
// ・やせいには いない（rate 0・breedOnly）。系統配合では 生まれない（recipeOnly）。ここの レシピと 進化だけ
// ・ランクは 手で きめる（rank。docs/plan-monsters.md の きまり: 進化の 前 D〜C・まん中 B・さいご A・ミュウ SS）
// ・evolve: { lv, to } … その レベルに なると 進化の 用意（world/evolve.js。「…おや？」→ みまもる／とめる）
//   stones: { 品ID: しゅぞくID } … 石を 使うと すぐ 進化（イーブイ）
//   かわらずのいし（everstone。アクセサリー）を 装備していると、レベルで 進化しない
// ・learn は 進化の 前の 技も ふくめる（進化しても 覚えていた 技は のこる。受けついだ 技・＋・強さは そのまま）
// ・gear: 装備（companions.js の RACE_GEAR を うわがき）。進化して 装備できなく なった 物は ふくろへ
// companions.js が まぜる。ここは ほかの データを import しない

const P = (o) => ({ rate: 0, breedOnly: true, recipeOnly: true, ...o });

// 進化の 前の すがたの 技（進化した すがたも 覚えている）
const PIKA = [[1, 'pk_thundershock'], [3, 'pk_quickattack'], [7, 'pk_thunderwave'], [12, 'pk_swift'], [18, 'pk_thunderbolt']];
const HITO = [[1, 'pk_ember'], [3, 'm_bite'], [8, 'm_warcry'], [14, 'm_dragon_claw'], [20, 'pk_flamethrower']];
const LIZA = [...HITO, [30, 'm_blaze'], [38, 'dk_ikari']];
const ZENI = [[1, 'pk_watergun'], [3, 'm_tackle'], [7, 'm_harden'], [12, 'm_bite'], [18, 'kabau'], [22, 'pk_surf']];
const KAME = [...ZENI, [30, 'pk_aquaring'], [36, 'm_stomp']];
const DANE = [[1, 'pk_vinewhip'], [3, 'm_tackle'], [7, 'pk_sleeppowder'], [11, 'm_root_heal'], [16, 'pk_razorleaf'], [22, 'pk_synthesis']];
const SOU = [...DANE, [30, 'm_pollen'], [36, 'behoimi']];
const BUI = [[3, 'pk_quickattack'], [8, 'm_bite'], [12, 'pk_swift']];

export const FRIENDS_POKEMON = {
  // ───── ピカチュウ →（Lv25）ライチュウ ─────
  pikachu: P({
    rank: 'C', names: ['ピカ', 'チュウた', 'ピカまる', 'でんきち'],
    growth: { hp: 0.95, mp: 0.9, str: 1.0, def: 0.85, agi: 1.4, mag: 1.15, heal: 0.8 },
    learn: [...PIKA, [30, 'pk_thunder']],
    evolve: { lv: 25, to: 'raichu' },
    note: '電気の技が得意な、すばやいネズミ。Lv25でライチュウに進化する。',
  }),
  raichu: P({
    rank: 'B', names: ['ライ', 'ライまる', 'いなずま', 'ゴロゴロ'],
    growth: { hp: 1.1, mp: 0.95, str: 1.1, def: 0.95, agi: 1.4, mag: 1.25, heal: 0.8 },
    learn: [...PIKA, [26, 'm_thunder_fang'], [30, 'pk_thunder'], [40, 'pk_gigaimpact']],
    note: 'ピカチュウが進化したすがた。10まんボルトとかみなりで、敵をしびれさせる。',
  }),
  // ───── ヒトカゲ →（Lv25）リザード →（Lv50）リザードン ─────
  charmander: P({
    rank: 'D', names: ['ヒトカ', 'カゲまる', 'ほのか', 'チャーム'],
    growth: { hp: 1.0, mp: 0.85, str: 1.15, def: 0.95, agi: 1.1, mag: 1.05, heal: 0.7 },
    learn: HITO,
    evolve: { lv: 25, to: 'charmeleon' },
    gear: { head: 'hat' },
    note: 'しっぽにほのおがともるトカゲ。Lv25でリザードに進化する。',
  }),
  charmeleon: P({
    rank: 'B', names: ['リザ', 'ほむら', 'ヒノコ', 'カエン'],
    growth: { hp: 1.1, mp: 0.9, str: 1.25, def: 1.0, agi: 1.15, mag: 1.1, heal: 0.75 },
    learn: LIZA,
    evolve: { lv: 50, to: 'charizard' },
    note: 'ヒトカゲが進化したすがた。するどいツメとほのおで戦う。Lv50でリザードンに進化する。',
  }),
  charizard: P({
    rank: 'A', names: ['リザ', 'ヒリュウ', 'グレン', 'ほむらまる'],
    growth: { hp: 1.25, mp: 1.0, str: 1.4, def: 1.1, agi: 1.2, mag: 1.25, heal: 0.8 },
    learn: [...LIZA, [50, 'm_dragon_dive'], [55, 'pk_fireblast']],
    note: 'リザードが進化したすがた。空をとび、だいもんじのほのおで敵みんなを焼く。',
  }),
  // ───── ゼニガメ →（Lv25）カメール →（Lv50）カメックス ─────
  squirtle: P({
    rank: 'D', names: ['ゼニ', 'カメきち', 'みずお', 'こうら'],
    growth: { hp: 1.1, mp: 0.85, str: 0.95, def: 1.3, agi: 0.9, mag: 0.95, heal: 0.9 },
    learn: ZENI,
    evolve: { lv: 25, to: 'wartortle' },
    note: 'かたいこうらの子ガメ。水の技と、身を守る技が得意。Lv25でカメールに進化する。',
  }),
  wartortle: P({
    rank: 'B', names: ['カメ', 'ナミお', 'ふさお', 'カメすけ'],
    growth: { hp: 1.2, mp: 0.9, str: 1.0, def: 1.4, agi: 0.9, mag: 1.0, heal: 0.95 },
    learn: KAME,
    evolve: { lv: 50, to: 'blastoise' },
    note: 'ゼニガメが進化したすがた。なみのりで敵みんなをおし流す。Lv50でカメックスに進化する。',
  }),
  blastoise: P({
    rank: 'A', names: ['カメ', 'タイホウ', 'ドンガメ', 'カメすけ'],
    growth: { hp: 1.35, mp: 0.95, str: 1.15, def: 1.55, agi: 0.85, mag: 1.15, heal: 1.0 },
    learn: [...KAME, [50, 'pk_hydropump'], [56, 'gd_wall']],
    // せなかの こうらに 大きな たいほう: かぶとは かぶれない
    gear: { head: false },
    note: 'カメールが進化したすがた。こうらのたいほうから、ハイドロポンプをうち出す。',
  }),
  // ───── フシギダネ →（Lv25）フシギソウ →（Lv50）フシギバナ ─────
  bulbasaur: P({
    rank: 'D', names: ['ダネ', 'たねまる', 'フシギ', 'みどりん'],
    growth: { hp: 1.1, mp: 1.0, str: 0.95, def: 1.05, agi: 0.9, mag: 1.0, heal: 1.15 },
    learn: DANE,
    evolve: { lv: 25, to: 'ivysaur' },
    note: 'せなかにたねをせおった魔物。つるのムチと、ねむりごなを使う。Lv25でフシギソウに進化する。',
  }),
  ivysaur: P({
    rank: 'B', names: ['ダネ', 'つぼみん', 'はなお', 'フシギ'],
    growth: { hp: 1.15, mp: 1.05, str: 1.0, def: 1.1, agi: 0.9, mag: 1.05, heal: 1.2 },
    learn: SOU,
    evolve: { lv: 50, to: 'venusaur' },
    note: 'フシギダネが進化したすがた。はっぱカッターで敵みんなを切る。Lv50でフシギバナに進化する。',
  }),
  venusaur: P({
    rank: 'A', names: ['ダネ', 'はなまる', 'だいりん', 'フシギ'],
    growth: { hp: 1.3, mp: 1.1, str: 1.1, def: 1.2, agi: 0.85, mag: 1.2, heal: 1.25 },
    learn: [...SOU, [50, 'pk_solarbeam'], [56, 'behomara']],
    // せなかの 大きな 花: ぼうしは かぶれない
    gear: { head: false },
    note: 'フシギソウが進化したすがた。ソーラービームと、回復の技で仲間を助ける。',
  }),
  // ───── イーブイ → 石で 4つの すがた ─────
  eevee: P({
    rank: 'C', names: ['ブイ', 'イーブ', 'ふわもこ', 'しっぽ'],
    growth: { hp: 1.0, mp: 0.9, str: 1.0, def: 0.95, agi: 1.15, mag: 0.95, heal: 0.95 },
    learn: [[1, 'm_tackle'], ...BUI, [18, 'piorimu'], [24, 'pk_bodyslam']],
    stones: { fire_stone: 'flareon', water_stone: 'vaporeon', thunder_stone: 'jolteon', moon_stone: 'umbreon' },
    note: 'ふわふわのけもの。ほのお・みず・かみなり・つきの石を使うと、ちがうすがたに進化する。',
  }),
  flareon: P({
    rank: 'B', names: ['ブースタ', 'もえぞう', 'ほのかぜ', 'ファイ'],
    growth: { hp: 1.05, mp: 0.9, str: 1.5, def: 0.95, agi: 1.05, mag: 1.15, heal: 0.75 },
    learn: [[1, 'pk_ember'], ...BUI, [20, 'pk_flamethrower'], [30, 'm_blaze'], [38, 'pk_fireblast']],
    note: 'ほのおのいしで進化したイーブイ。力がとても強く、ほのおの技で戦う。',
  }),
  vaporeon: P({
    rank: 'B', names: ['シャワ', 'みなも', 'アクア', 'しずく'],
    growth: { hp: 1.5, mp: 1.0, str: 0.9, def: 0.9, agi: 0.9, mag: 1.15, heal: 1.05 },
    learn: [[1, 'pk_watergun'], ...BUI, [20, 'pk_aquaring'], [26, 'pk_surf'], [38, 'pk_hydropump']],
    note: 'みずのいしで進化したイーブイ。HPがとても多く、アクアリングで少しずつ回復する。',
  }),
  jolteon: P({
    rank: 'B', names: ['サンダ', 'ビリビリ', 'イナズマ', 'トゲまる'],
    growth: { hp: 0.95, mp: 0.95, str: 1.0, def: 0.85, agi: 1.6, mag: 1.25, heal: 0.75 },
    learn: [[1, 'pk_thundershock'], ...BUI, [16, 'pk_thunderwave'], [20, 'pk_thunderbolt'], [28, 'pk_pinmissile'], [38, 'pk_thunder']],
    note: 'かみなりのいしで進化したイーブイ。とてもすばやく、電気の技で戦う。',
  }),
  umbreon: P({
    rank: 'B', names: ['ブラッキ', 'つきよ', 'ルナ', 'よるまる'],
    growth: { hp: 1.35, mp: 0.9, str: 0.95, def: 1.4, agi: 0.95, mag: 0.85, heal: 1.0 },
    learn: [[1, 'm_tackle'], ...BUI.slice(0, 2), [12, 'pk_confuseray'], [20, 'pk_moonlight'], [26, 'pk_darkpulse'], [34, 'kabau']],
    note: 'つきのいしで進化したイーブイ。とてもかたく、闇の技と、ふしぎな光で戦う。',
  }),
  // ───── 進化しない ─────
  snorlax: P({
    rank: 'B', names: ['カビ', 'ねむすけ', 'ゴロンタ', 'まんぷく'],
    growth: { hp: 2.0, mp: 0.65, str: 1.35, def: 1.15, agi: 0.5, mag: 0.65, heal: 1.0 },
    learn: [[1, 'm_tackle'], [4, 'pk_rest'], [9, 'pk_bodyslam'], [15, 'm_king_press'], [22, 'm_stomp'], [30, 'pk_gigaimpact']],
    // とても 大きな 体: 頭の 装備は なし
    gear: { head: false },
    note: 'とても大きなけもの。HPがとても多く、ねむるとHPが大きく回復する。',
  }),
  gengar: P({
    rank: 'B', names: ['ゲンガ', 'カゲっち', 'ニヤリ', 'ゴース'],
    growth: { hp: 0.95, mp: 1.35, str: 0.75, def: 0.8, agi: 1.3, mag: 1.55, heal: 0.75 },
    learn: [[1, 'm_drain'], [3, 'pk_hypnosis'], [7, 'm_dark_bolt'], [12, 'pk_confuseray'], [18, 'pk_shadowball'], [24, 'manusa'], [30, 'pk_darkpulse'], [38, 'pk_psychic']],
    // 影の ゆうれい: 重い よろいや たては 持たない
    gear: { weapons: ['dagger', 'staff'], armor: ['cloth', 'robe'], shield: false, head: 'hat' },
    note: 'いたずら好きの影のゆうれい。闇の技と、ねむらせる・混乱させる技が得意。',
  }),
  // ───── まぼろし（SS）─────
  mew: P({
    rank: 'SS', names: ['ミュウ', 'ミュー', 'まぼろし', 'ピンク'],
    growth: { hp: 1.23, mp: 1.23, str: 1.23, def: 1.23, agi: 1.23, mag: 1.23, heal: 1.23 },
    learn: [
      [1, 'm_tackle'], [3, 'hoimi'], [8, 'pk_swift'], [14, 'pk_psychic'], [20, 'behoimi'], [26, 'pk_flamethrower'],
      [32, 'pk_thunderbolt'], [38, 'pk_shadowball'], [44, 'pk_solarbeam'], [50, 'pk_hydropump'], [56, 'sg_behoma'],
    ],
    note: 'まぼろしの魔物。どんな技でも覚えられる。',
    // 図鑑・酒場の うわさの ヒント（素材配合。companions.js の recipeHint）
    hint: 'ふしぎないでんし ＋ 進化したポケモン2ひき（リザードン・フシギバナ・カメックス・ライチュウ）',
  }),
};

// ───────────── 生まれかた（companions.js の BREED_RECIPES・MATERIAL_RECIPES に まぜる）─────────────
// { any: [しゅぞくID…], label } … その どれか（ヒントは label）。ほかの レシピは かわらない（companions.js の specMatch）
export const BOLT_KIN = {
  label: 'かみなりの魔物',
  any: ['thunder_imp', 'thunder_puff', 'sky_ray', 'ikazuchi_tiger', 'cloud_wyvern', 'thunder_dragon', 'pikachu', 'raichu', 'jolteon'],
};
export const FIRE_KIN = {
  label: 'ほのおの魔物',
  any: [
    'fire_imp', 'hinezumi', 'fire_hound', 'ember_bird', 'ember_wolf', 'magma_slime', 'lava_lizard', 'lamp', 'wisp_lamp', 'chibi_dragon',
    'phoenix', 'shadow_flame', 'candle_ghost', 'lamp_genie', 'blackflame_knight', 'charmander', 'charmeleon', 'charizard', 'flareon',
  ],
};
export const WATER_KIN = {
  label: '水の魔物',
  any: [
    'marine_slime', 'sea_serpent', 'water_dragon', 'water_spirit', 'coral_golem', 'uzumaki_gai', 'tobiuo', 'shell_knight', 'armor_crab',
    'kiba_walrus', 'penguin_knight', 'foam_siren', 'shade_serpent', 'squirtle', 'wartortle', 'blastoise', 'vaporeon',
  ],
};
// D ランク（2）いじょう（「強い 親から」）
const D = 2;
export const RECIPES_POKEMON = [
  { a: { race: 'beast' }, b: BOLT_KIN, child: 'pikachu' },
  { a: { race: 'dragon' }, b: FIRE_KIN, child: 'charmander' },
  { a: { race: 'material' }, b: WATER_KIN, child: 'squirtle' },
  { a: { race: 'plant', minRank: D }, b: { race: 'plant', minRank: D }, child: 'bulbasaur' },
  { a: { race: 'beast' }, b: { race: 'slime', minRank: D }, child: 'eevee' },
  { a: { race: 'beast' }, b: 'king_pururin', child: 'snorlax' },
  { a: { race: 'undead', minRank: D }, b: { race: 'demon', minRank: D }, child: 'gengar' },
];

// ミュウ: 進化した ポケモン 2ひき（同じ しゅぞくでも よい）＋ ふしぎないでんし（ひみつのダンジョンの 50階で 1つだけ。品は なくなる）
export const MEW_PARENTS = ['charizard', 'venusaur', 'blastoise', 'raichu'];
export const MATERIAL_RECIPES_POKEMON = [
  { a: { any: MEW_PARENTS }, b: { any: MEW_PARENTS }, item: 'mew_gene', child: 'mew' },
];
