// あたらしい 仲間モンスター（2026年10月。ドラゴンクエストモンスターズ ふうの 配合を ゆたかに）
//
// ・やせいで 出会える 魔物 11しゅ（第1章〜第4章の 出現表に すこしだけ まぜる。encounters*.js）
// ・配合でしか 生まれない 魔物 16しゅ（breedOnly）
//     recipeOnly … きまった 組み合わせ（特殊配合）でしか 生まれない
//     それ いがいは 特殊配合の ほかに、系統配合（1ぴきめの 系統 ＋ どの魔物でも）でも 生まれる（companions.js の breedOutcome）
//
// monsters.js（MONSTERS）・companions.js（MONSTER_FRIENDS・BREED_RECIPES）・abilities.js（ABILITIES）・loot.js（MAT_DROPS）が まぜる。
// ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/r23-art.js

// ───────────── 魔物の データ ─────────────
export const MONSTERS_R23 = {
  // ── やせいの 魔物 ──
  donguri: {
    name: 'どんぐりん', lv: 2, hp: 13, str: 11, def: 8, agi: 7, exp: 4, gold: 5,
    race: 'plant', size: 's', resist: { fire: 1.4, wind: 0.8 }, drops: { common: ['herb', 8], rare: ['seed_hp', 128] },
    actions: [{ w: 3, id: 'attack' }, { w: 1, id: 'm_acorn_roll' }],
    desc: 'かたいぼうしをかぶった、どんぐりの魔物。ころころ転がって体当たりしてくる。',
  },
  hana_pururin: {
    name: 'はなぷるりん', lv: 4, hp: 21, mp: 14, str: 15, def: 8, agi: 9, mag: 10, exp: 7, gold: 8,
    race: 'slime', size: 's', resist: { fire: 1.4, wind: 0.8, sleep: 0.5 }, drops: { common: ['herb', 6], rare: ['seed_mag', 96] },
    actions: [{ w: 3, id: 'attack' }, { w: 1, id: 'hoimi', cond: 'allyHurt' }],
    desc: '頭に花をさかせたぷるりん。花のかおりで仲間の傷をいやす。',
  },
  karamizuta: {
    name: 'からみヅタ', lv: 6, hp: 34, str: 24, def: 13, agi: 9, exp: 13, gold: 10,
    race: 'plant', size: 'm', resist: { fire: 1.5, ice: 0.8, wind: 1.2, poison: 0.5 }, drops: { common: ['antidote', 6], rare: ['thorn_whip', 64] },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_vine_bind' }],
    desc: '森の木にからみつくツタの魔物。長いつるで旅人をしばりつける。',
  },
  koakuma: {
    name: 'こあくま', lv: 9, hp: 40, mp: 30, str: 30, def: 15, agi: 24, mag: 24, exp: 26, gold: 24,
    race: 'demon', size: 's', flying: true, hit: 'slash', resist: { light: 1.4, dark: 0.6, fire: 0.8, ice: 1.2 }, drops: { common: ['magic_water', 24], rare: ['seed_mag', 64] },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'mera' }, { w: 1, id: 'm_imp_trick' }],
    desc: '小さなつばさとしっぽの、いたずら好きな悪魔。三つまたのやりでつついてくる。',
  },
  buriki: {
    name: 'ブリキへい', lv: 11, hp: 60, str: 38, def: 34, agi: 11, exp: 34, gold: 28,
    race: 'material', size: 'm', hit: 'slash', resist: { bolt: 1.5, fire: 0.8, ice: 0.8, poison: 0, sleep: 0, confuse: 0.3 }, drops: { common: ['herb', 6], rare: ['iron_helm', 64] },
    actions: [{ w: 3, id: 'attack' }, { w: 1, id: 'm_tin_cannon' }, { w: 1, id: 'm_harden', cond: 'notRecent:m_harden' }],
    desc: 'ゼンマイで動く、ブリキのおもちゃの兵隊。背中のかぎが回っている間は止まらない。',
  },
  tobiuo: {
    name: 'トビウオン', lv: 12, hp: 52, str: 40, def: 18, agi: 38, exp: 36, gold: 22,
    race: 'beast', size: 's', flying: true, resist: { bolt: 1.4, wind: 1.2, ice: 0.8 }, drops: { common: ['herb', 6], rare: ['seed_agi', 64] },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_fin_slash' }],
    desc: '大きなむなびれで海の上を飛ぶ魚。波の間から、とつぜん飛び出してくる。',
  },
  uzumaki_gai: {
    name: 'うずまきガイ', lv: 14, hp: 80, mp: 20, str: 44, def: 50, agi: 12, mag: 26, exp: 50, gold: 34,
    race: 'material', size: 'm', resist: { ice: 0.6, fire: 1.2, bolt: 1.4, poison: 0, sleep: 0.5 }, drops: { common: ['magic_water', 24], rare: ['seed_def', 48] },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_shell_spin' }, { w: 1, id: 'm_shell_guard', cond: 'notRecent:m_shell_guard' }],
    desc: 'うずまきもようの大きな貝。からの中から、するどい目でこちらをのぞいている。',
  },
  tsurara_sou: {
    name: 'つららソウ', lv: 20, hp: 140, mp: 40, str: 56, def: 40, agi: 24, mag: 50, exp: 86, gold: 44,
    race: 'plant', size: 'm', resist: { ice: 0.3, fire: 1.6, wind: 0.8 }, drops: { common: ['moonherb', 10], rare: ['seed_mag', 48] },
    actions: [{ w: 2, id: 'attack' }, { w: 2, id: 'm_ice_bloom' }, { w: 1, id: 'hyado' }],
    desc: '雪の下でさく、つららの花びらの植物。こおった花びらを、ふぶきのようにまき散らす。',
  },
  hoseki_game: {
    name: 'ほうせきガメ', lv: 23, hp: 230, mp: 20, str: 70, def: 76, agi: 16, mag: 36, exp: 128, gold: 90,
    race: 'beast', size: 'm', hit: 'bite', resist: { fire: 0.8, ice: 0.8, blast: 1.4, bolt: 1.2, poison: 0.5 }, drops: { common: ['herb', 6], rare: ['seed_def', 32] },
    actions: [{ w: 3, id: 'attack' }, { w: 1, id: 'm_gem_shine' }, { w: 1, id: 'm_shell_guard', cond: 'notRecent:m_shell_guard' }],
    desc: 'こうらに宝石が生えた、のんびり屋のカメ。こうらの宝石から光を放つ。',
  },
  hinezumi: {
    name: 'ひのこネズミ', lv: 24, hp: 140, str: 66, def: 38, agi: 60, mag: 40, exp: 108, gold: 54,
    race: 'beast', size: 's', hit: 'bite', resist: { fire: 0.3, ice: 1.5, wind: 1.1 }, drops: { common: ['herb', 8], rare: ['fire_claw', 64] },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_ember_dash' }, { w: 1, id: 'm_fire_spark' }],
    desc: 'しっぽの先に火がともったネズミ。火の粉をまきながら、すばしこく走り回る。',
  },
  toge_saboten: {
    name: 'トゲサボテン', lv: 30, hp: 300, mp: 30, str: 104, def: 64, agi: 40, mag: 50, exp: 176, gold: 84,
    race: 'plant', size: 'm', resist: { fire: 1.4, ice: 1.2, wind: 0.8, poison: 0.5, blind: 0.5 }, drops: { common: ['herb', 6], rare: ['seed_hp', 48] },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_needle_rain' }],
    desc: 'オアシスのそばでおどる、トゲだらけのサボテン。体中のトゲを雨のように飛ばす。',
  },

  // ── 配合でしか 生まれない 魔物（やせいには いない） ──
  mandra: {
    name: 'さけびマンドラ', lv: 16, hp: 120, mp: 40, str: 50, def: 36, agi: 30, mag: 40, exp: 0, gold: 0, breedOnly: true,
    race: 'plant', size: 's', resist: { fire: 1.4, wind: 0.8, sleep: 0.3, confuse: 0.5 },
    actions: [{ w: 3, id: 'attack' }, { w: 1, id: 'm_scream' }],
    desc: '土の中からぬけ出した、根っこの魔物。大声でさけんで、相手の体をしびれさせる。',
  },
  kiraboshi: {
    name: 'きらぼし', lv: 18, hp: 110, mp: 70, str: 40, def: 36, agi: 50, mag: 56, exp: 0, gold: 0, breedOnly: true,
    race: 'spirit', size: 's', flying: true, resist: { light: 0.3, dark: 1.5, ice: 0.8 },
    actions: [{ w: 2, id: 'm_star_dust' }, { w: 1, id: 'attack' }],
    desc: '流れ星のかけらから生まれた、小さな星のせいれい。きらきらの粉をまいて、闇をはらう。',
  },
  mimic: {
    name: 'ばけばこ', lv: 19, hp: 150, mp: 40, str: 66, def: 52, agi: 34, mag: 40, exp: 0, gold: 0, breedOnly: true,
    race: 'material', size: 'm', resist: { light: 1.3, dark: 0.6, poison: 0, sleep: 0.3, confuse: 0.3 },
    actions: [{ w: 2, id: 'attack' }, { w: 2, id: 'm_mimic_bite' }, { w: 1, id: 'm_pot_suck' }],
    desc: '宝箱のふりをして、旅人を待ちぶせる魔物。ふたの中には、するどいキバがならんでいる。',
  },
  pururin_tower: {
    name: 'ぷるりんタワー', lv: 20, hp: 230, mp: 30, str: 62, def: 48, agi: 20, mag: 30, exp: 0, gold: 0, breedOnly: true,
    race: 'slime', size: 'l', resist: { bolt: 1.3, fire: 0.8, ice: 0.8 },
    actions: [{ w: 3, id: 'attack' }, { w: 1, id: 'm_tower_crash' }],
    desc: 'ぷるりんが4ひき積み重なったタワー。てっぺんのぷるりんが、みんなに号令をかける。',
  },
  fairy_dragon: {
    name: 'ようせいドラゴン', lv: 21, hp: 140, mp: 80, str: 50, def: 40, agi: 50, mag: 60, exp: 0, gold: 0, breedOnly: true,
    race: 'dragon', size: 's', flying: true, resist: { fire: 0.7, ice: 0.8, light: 0.6, dark: 1.3, sleep: 0.5 },
    actions: [{ w: 2, id: 'attack' }, { w: 1, id: 'm_fairy_breath' }, { w: 1, id: 'hoimi', cond: 'allyHurt' }],
    desc: 'チョウのはねをもつ、小さなドラゴン。あまい花のかおりの息で、相手をねむらせる。',
  },
  headless: {
    name: 'くびなし騎士', lv: 21, hp: 170, mp: 20, str: 70, def: 56, agi: 30, mag: 20, exp: 0, gold: 0, breedOnly: true,
    race: 'undead', size: 'm', hit: 'slash', resist: { dark: 0.5, light: 1.6, poison: 0, sleep: 0, confuse: 0.5 },
    actions: [{ w: 3, id: 'attack' }, { w: 1, id: 'm_headless_slash' }],
    desc: 'かぶとの中がからっぽの、さまようよろいの騎士。自分の頭を探して、夜な夜な歩き回る。',
  },
  gargoyle: {
    name: 'ガーゴイル', lv: 24, hp: 210, mp: 30, str: 76, def: 60, agi: 44, mag: 40, exp: 0, gold: 0, breedOnly: true,
    race: 'demon', size: 'm', flying: true, resist: { dark: 0.5, light: 1.4, blast: 1.2, poison: 0, paralyze: 0.5 },
    actions: [{ w: 3, id: 'attack' }, { w: 1, id: 'm_stone_wing' }],
    desc: '神殿の屋根を守っていた石の悪魔。夜になると動き出し、石のつばさで急降下する。',
  },
  aurora_spirit: {
    name: 'オーロラの精', lv: 27, hp: 200, mp: 120, str: 60, def: 50, agi: 60, mag: 90, exp: 0, gold: 0, breedOnly: true,
    race: 'spirit', size: 'm', flying: true, resist: { ice: 0.3, bolt: 0.6, fire: 1.3, dark: 1.3 },
    actions: [{ w: 2, id: 'm_aurora' }, { w: 1, id: 'attack' }],
    desc: '北の夜空をまう、オーロラのせいれい。七色の光のカーテンで、すべてをこおらせる。',
  },
  bone_dragon: {
    name: 'ほねドラゴン', lv: 30, hp: 300, mp: 40, str: 92, def: 64, agi: 34, mag: 50, exp: 0, gold: 0, breedOnly: true,
    race: 'undead', size: 'l', hit: 'bite', resist: { dark: 0.4, light: 1.8, fire: 1.3, ice: 0.7, poison: 0, sleep: 0 },
    actions: [{ w: 3, id: 'attack' }, { w: 1, id: 'm_bone_breath' }],
    desc: '大昔の竜のほねが、闇の力で動き出した。冷たい闇の息をはく。',
  },
  pegasus: {
    name: 'ペガサス', lv: 30, hp: 260, mp: 60, str: 86, def: 56, agi: 76, mag: 56, exp: 0, gold: 0, breedOnly: true,
    race: 'beast', size: 'l', flying: true, resist: { wind: 0.4, light: 0.6, bolt: 1.3, dark: 1.2 },
    actions: [{ w: 3, id: 'attack' }, { w: 1, id: 'm_pegasus_wing' }],
    desc: '白いつばさで空をかける天馬。雲の上を走り、ひづめの音は風の歌になる。',
  },
  silver_king: {
    name: 'ぎんいろキング', lv: 32, hp: 120, mp: 60, str: 90, def: 255, agi: 60, mag: 60, exp: 0, gold: 0, breedOnly: true,
    race: 'slime', size: 'l', resist: { fire: 0, ice: 0, wind: 0, blast: 0, bolt: 0, light: 0, dark: 0, sleep: 0, poison: 0, confuse: 0 },
    actions: [{ w: 3, id: 'attack' }, { w: 1, id: 'm_silver_flash' }],
    desc: '銀色にかがやく、大きなぷるりんの王さま。とても固く、どんな呪文もはね返しそう。',
  },
  elder_treant: {
    name: '長老トレント', lv: 32, hp: 360, mp: 80, str: 90, def: 80, agi: 20, mag: 70, exp: 0, gold: 0, breedOnly: true,
    race: 'plant', size: 'l', resist: { fire: 1.4, wind: 0.6, sleep: 0, poison: 0.3 },
    actions: [{ w: 3, id: 'attack' }, { w: 1, id: 'm_big_branch' }],
    desc: '何百年も森を見守ってきた、大きな木の長老。体中にこけと花をまとい、森の命をあやつる。',
  },
  archmage: {
    name: '大魔道士', lv: 33, hp: 240, mp: 200, str: 60, def: 56, agi: 50, mag: 110, exp: 0, gold: 0, breedOnly: true,
    race: 'demon', size: 'm', resist: { dark: 0.4, light: 1.3, fire: 0.7, ice: 0.7, silence: 0.3, confuse: 0.5 },
    actions: [{ w: 2, id: 'm_arcane_burst' }, { w: 2, id: 'merami' }, { w: 1, id: 'attack' }],
    desc: '闇の魔道をきわめた魔道士。ローブの中には、星空が広がっているという。',
  },
  gold_golem: {
    name: '黄金ゴーレム', lv: 34, hp: 420, str: 110, def: 110, agi: 18, mag: 30, exp: 0, gold: 0, breedOnly: true,
    race: 'material', size: 'l', resist: { fire: 0.6, ice: 0.6, bolt: 0.8, blast: 1.2, sleep: 0, poison: 0, confuse: 0.2 },
    actions: [{ w: 3, id: 'attack' }, { w: 1, id: 'm_gold_punch' }],
    desc: '金のかたまりから作られた、かがやくきょじん。たおすと大金持ちになれるといううわさ。',
  },
  phoenix: {
    name: 'フェニックス', lv: 36, hp: 300, mp: 100, str: 90, def: 60, agi: 70, mag: 90, exp: 0, gold: 0, breedOnly: true,
    race: 'beast', size: 'l', flying: true, resist: { fire: 0.2, dark: 0.6, ice: 1.4, poison: 0, sleep: 0.3 },
    actions: [{ w: 2, id: 'attack' }, { w: 1, id: 'm_phoenix_fire' }],
    desc: '炎の中から何度でもよみがえるという、火の鳥。羽ばたくたびに、金色の火の粉がまう。',
  },
  thunder_dragon: {
    name: 'いかずちドラゴン', lv: 38, hp: 420, mp: 80, str: 110, def: 80, agi: 50, mag: 80, exp: 0, gold: 0, breedOnly: true,
    race: 'dragon', size: 'l', resist: { bolt: 0.2, wind: 0.6, fire: 0.7, ice: 1.2, paralyze: 0.2, sleep: 0.3 },
    actions: [{ w: 3, id: 'attack' }, { w: 1, id: 'm_thunder_breath' }],
    desc: '雷雲をまとう、大きな青い竜。つばさを広げると、空いっぱいにいなずまが走る。',
  },
};

// ───────────── 仲間に なった とき ─────────────
// growth の 合計は ランクに あわせる（はじめの 魔物 6くらい・中ごろ 6.5〜7・配合の 上の 魔物 7.5〜8.5）
// gear: 装備できる 物（companions.js の RACE_GEAR を うわがき）
export const FRIENDS_R23 = {
  donguri: {
    rate: 1 / 10, names: ['ドングー', 'コロン', 'くりぼう', 'どんた'],
    growth: { hp: 1.0, mp: 0.6, str: 1.0, def: 1.1, agi: 0.85, mag: 0.6, heal: 0.85 },
    learn: [[1, 'm_acorn_roll'], [4, 'm_harden'], [8, 'm_sleep_powder'], [12, 'kabau'], [17, 'm_branch_whip'], [23, 'm_root_heal']],
    note: 'かたいぼうしのどんぐり。仲間をかばう。',
  },
  hana_pururin: {
    rate: 1 / 10, names: ['はなぷる', 'フラワ', 'さくら', 'ぷるはな'],
    growth: { hp: 0.9, mp: 1.1, str: 0.8, def: 0.9, agi: 1.0, mag: 0.95, heal: 1.25 },
    learn: [[1, 'hoimi'], [3, 'm_tackle'], [6, 'kiarii'], [10, 'm_petal_heal'], [14, 'behoimi'], [19, 'kiariku'], [25, 'behomara']],
    gear: { armor: ['cloth', 'robe'] },
    note: 'いやしの呪文が得意な花のぷるりん。',
  },
  karamizuta: {
    rate: 1 / 14, names: ['ツタまる', 'グリン', 'からみん', 'ツルリ'],
    growth: { hp: 1.1, mp: 0.6, str: 1.05, def: 1.0, agi: 0.75, mag: 0.6, heal: 0.8 },
    learn: [[1, 'm_vine_bind'], [4, 'm_root_drain'], [8, 'm_branch_whip'], [13, 'm_pollen'], [19, 'm_poison_spray']],
    note: 'つるで敵をしばる植物。敵のHPを吸い取る。',
  },
  koakuma: {
    rate: 1 / 16, names: ['ポッチ', 'デビ', 'いたずら', 'ちびあく'],
    growth: { hp: 0.9, mp: 1.1, str: 0.95, def: 0.85, agi: 1.25, mag: 1.15, heal: 0.6 },
    learn: [[1, 'mera'], [3, 'm_imp_trick'], [7, 'manusa'], [11, 'merami'], [15, 'begirama'], [20, 'medapani'], [26, 'merazoma']],
    gear: { weapons: ['spear', 'dagger', 'staff'], armor: ['cloth', 'robe'], shield: false, head: 'hat' },
    note: '炎の呪文といたずらが得意な小さな悪魔。やり・つえを持てる。',
  },
  buriki: {
    rate: 1 / 18, names: ['ゼンマイ', 'カチコチ', 'ティン', 'ブリキ'],
    growth: { hp: 1.1, mp: 0.5, str: 1.1, def: 1.3, agi: 0.8, mag: 0.6, heal: 0.5 },
    learn: [[1, 'm_tin_cannon'], [4, 'm_harden'], [8, 'kabau'], [12, 'kabutowari'], [16, 'm_twin_slash'], [22, 'gd_wall']],
    gear: { weapons: ['sword', 'spear', 'axe'] },
    note: 'ブリキの兵隊。固くて、剣・やり・たて・かぶとを装備できる。剣を持つとかぶと割りが使える。',
  },
  tobiuo: {
    rate: 1 / 12, names: ['トビオ', 'ヒレまる', 'ウオン', 'とびっこ'],
    growth: { hp: 0.85, mp: 0.6, str: 1.05, def: 0.8, agi: 1.45, mag: 0.7, heal: 0.6 },
    learn: [[1, 'm_fin_slash'], [4, 'm_splash'], [8, 'piorimu'], [12, 'kamaitachi'], [16, 'm_tidal'], [21, 'issen']],
    gear: { weapons: [] },
    note: 'とても素早い飛ぶ魚。水と風の技を使う。',
  },
  uzumaki_gai: {
    rate: 1 / 16, names: ['ウズマキ', 'カイくん', 'ぐるぐる', 'シェルン'],
    growth: { hp: 1.15, mp: 0.7, str: 0.95, def: 1.4, agi: 0.6, mag: 0.8, heal: 0.8 },
    learn: [[1, 'm_shell_spin'], [4, 'm_shell_guard'], [8, 'm_splash'], [12, 'sukuruto'], [16, 'm_tidal'], [21, 'gd_wall']],
    gear: { weapons: [], head: false },
    note: '固い貝がらの中に入って身を守る。水の技も使う。',
  },
  tsurara_sou: {
    rate: 1 / 14, names: ['ヒョウカ', 'ユキバナ', 'こおりばな', 'ツララ'],
    growth: { hp: 1.0, mp: 1.15, str: 0.8, def: 0.95, agi: 0.8, mag: 1.25, heal: 1.05 },
    learn: [[1, 'hyado'], [4, 'm_pollen'], [8, 'm_ice_bloom'], [12, 'hyadaruko'], [16, 'behoimi'], [21, 'sg_mahyado']],
    note: '氷の呪文が得意な花。',
  },
  hoseki_game: {
    rate: 1 / 18, names: ['カメキチ', 'ジュエル', 'のんびり', 'ほうせき'],
    growth: { hp: 1.3, mp: 0.7, str: 1.0, def: 1.45, agi: 0.5, mag: 0.85, heal: 0.8 },
    learn: [[1, 'm_bite'], [5, 'm_shell_guard'], [9, 'kabau'], [13, 'm_gem_shine'], [18, 'sukuruto'], [24, 'gd_wall']],
    gear: { weapons: [], armor: ['cloth', 'heavy'] },
    note: 'とても固いカメ。宝石の光で敵をうつ。',
  },
  hinezumi: {
    rate: 1 / 14, names: ['チュウタ', 'ひのこ', 'ボッチ', 'ネズミン'],
    growth: { hp: 0.9, mp: 0.7, str: 1.05, def: 0.85, agi: 1.45, mag: 0.95, heal: 0.6 },
    learn: [[1, 'm_ember_dash'], [4, 'm_fire_spark'], [8, 'piorimu'], [12, 'gira'], [16, 'kamaitachi'], [21, 'begirama']],
    note: '火をまとって走り回る、すばしこいネズミ。',
  },
  toge_saboten: {
    rate: 1 / 16, names: ['トゲまる', 'チクチク', 'サボテン', 'オアシス'],
    growth: { hp: 1.15, mp: 0.6, str: 1.15, def: 1.05, agi: 0.9, mag: 0.6, heal: 0.75 },
    learn: [[1, 'm_needle_rain'], [5, 'm_harden'], [10, 'm_root_drain'], [15, 'kamaitachi'], [20, 'm_branch_whip'], [26, 'mawashigeri']],
    note: 'トゲで敵みんなをうつサボテン。',
  },

  // ── 配合でしか 生まれない ──
  mandra: {
    rate: 0, breedOnly: true, names: ['マンドラ', 'ねっこ', 'ギャー', 'だいこん'],
    growth: { hp: 1.05, mp: 1.0, str: 0.95, def: 0.95, agi: 0.95, mag: 1.05, heal: 1.15 },
    learn: [[1, 'm_scream'], [4, 'm_root_drain'], [8, 'hoimi'], [12, 'm_pollen'], [16, 'behoimi'], [21, 'mahoton'], [26, 'behomara']],
    note: '大声でさけぶ根っこ。敵をしびれさせ、仲間をいやす。',
  },
  kiraboshi: {
    rate: 0, breedOnly: true, names: ['キラリ', 'ほしこ', 'スピカ', 'ながれぼし'],
    growth: { hp: 0.85, mp: 1.25, str: 0.7, def: 0.85, agi: 1.3, mag: 1.3, heal: 1.1 },
    learn: [[1, 'm_star_dust'], [4, 'hoimi'], [8, 'piorimu'], [12, 'io'], [16, 'behoimi'], [20, 'iora'], [26, 'm_star_breath']],
    note: '星のせいれい。光の技と回復の呪文を覚える。',
  },
  mimic: {
    rate: 0, breedOnly: true, names: ['バケバコ', 'たからん', 'パクパク', 'ミミ'],
    growth: { hp: 1.1, mp: 0.85, str: 1.15, def: 1.15, agi: 0.95, mag: 0.85, heal: 0.6 },
    learn: [[1, 'm_mimic_bite'], [4, 'm_pot_suck'], [8, 'm_harden'], [12, 'm_glare'], [17, 'mahoton'], [22, 'tamashii']],
    gear: { weapons: [], shield: false, head: false },
    note: '宝箱の魔物。かみついて、MPも吸い取る。',
  },
  pururin_tower: {
    rate: 0, breedOnly: true, names: ['タワー', 'ぷるタワー', 'つみぷる', 'よんきょうだい'],
    growth: { hp: 1.35, mp: 0.9, str: 1.1, def: 1.1, agi: 0.75, mag: 0.9, heal: 1.0 },
    learn: [[1, 'm_tackle'], [4, 'm_tower_crash'], [8, 'hoimi'], [12, 'm_king_press'], [16, 'sukuruto'], [22, 'behomara']],
    gear: { armor: ['cloth', 'heavy'] },
    note: 'ぷるりんの塔。HPが多く、敵みんなにのしかかる。',
  },
  fairy_dragon: {
    rate: 0, breedOnly: true, names: ['フェアリ', 'チョウチョ', 'ピクシー', 'はなドラ'],
    growth: { hp: 1.0, mp: 1.2, str: 0.9, def: 0.9, agi: 1.15, mag: 1.15, heal: 1.25 },
    learn: [[1, 'm_fairy_breath'], [4, 'hoimi'], [8, 'm_fire_breath'], [12, 'behoimi'], [16, 'kiariku'], [21, 'behomara'], [27, 'm_star_breath']],
    gear: { armor: ['cloth', 'robe'], head: 'hat' },
    note: '回復が得意な小さなドラゴン。ねむりの息もはく。',
  },
  headless: {
    rate: 0, breedOnly: true, names: ['クビナシ', 'デュラ', 'からっぽ', 'ヨロイン'],
    growth: { hp: 1.15, mp: 0.55, str: 1.3, def: 1.25, agi: 0.9, mag: 0.55, heal: 0.5 },
    learn: [[1, 'm_headless_slash'], [4, 'm_cursed_blade'], [8, 'kabau'], [12, 'chikaratame'], [16, 'm_twin_slash'], [22, 'nioudachi']],
    gear: { weapons: ['sword', 'axe', 'spear'], head: false },
    note: '頭のない騎士。剣とたてで仲間を守る。',
  },
  gargoyle: {
    rate: 0, breedOnly: true, names: ['ガーゴ', 'セキゾウ', 'イシバネ', 'ゴイル'],
    growth: { hp: 1.1, mp: 0.7, str: 1.25, def: 1.25, agi: 1.0, mag: 0.7, heal: 0.5 },
    learn: [[1, 'm_stone_wing'], [4, 'm_harden'], [8, 'm_stone_gaze'], [12, 'm_dive'], [16, 'tamashii'], [22, 'gd_wall']],
    gear: { weapons: ['spear', 'axe'] },
    note: '石の体の悪魔。固くて、急降下で敵をうつ。',
  },
  aurora_spirit: {
    rate: 0, breedOnly: true, names: ['オーロラ', 'ニジカ', 'ミレイ', 'カーテン'],
    growth: { hp: 0.95, mp: 1.35, str: 0.7, def: 0.9, agi: 1.2, mag: 1.4, heal: 1.05 },
    learn: [[1, 'hyado'], [4, 'm_thunder'], [8, 'hyadaruko'], [12, 'm_aurora'], [17, 'mk_raiden'], [22, 'sg_mahyado']],
    note: '氷と雷の呪文が得意なせいれい。',
  },
  bone_dragon: {
    rate: 0, breedOnly: true, names: ['ホネドラ', 'スカル', 'ガイコツリュウ', 'ボーン'],
    growth: { hp: 1.35, mp: 0.75, str: 1.38, def: 1.2, agi: 0.85, mag: 0.85, heal: 0.45 },
    learn: [[1, 'm_bite'], [4, 'm_dragon_claw'], [8, 'm_glare'], [12, 'm_bone_breath'], [17, 'ms_soul'], [23, 'm_dragon_roar'], [29, 'dk_ikari']],
    gear: { weapons: ['claw'], armor: ['cloth', 'heavy'], shield: false, head: 'helm' },
    note: '竜のほね。闇の息と、するどいツメで戦う。',
  },
  pegasus: {
    rate: 0, breedOnly: true, recipeOnly: true, names: ['ペガ', 'ハヤテ', 'テンマ', 'ソラカケ'],
    growth: { hp: 1.15, mp: 0.95, str: 1.2, def: 0.95, agi: 1.5, mag: 0.95, heal: 1.0 },
    learn: [[1, 'm_dive'], [4, 'piorimu'], [8, 'kamaitachi'], [12, 'behoimi'], [16, 'm_pegasus_wing'], [21, 'sg_bagikurosu'], [27, 'gh_shinsoku']],
    gear: { weapons: [], armor: ['cloth', 'heavy'], head: 'helm' },
    note: '空をかける天馬。とても素早く、風の技と回復を覚える。',
  },
  silver_king: {
    rate: 0, breedOnly: true, recipeOnly: true, names: ['ギンキング', 'シルバ', 'ぎんちゃま', 'メタルン'],
    growth: { hp: 0.95, mp: 1.0, str: 1.0, def: 1.85, agi: 1.6, mag: 1.05, heal: 1.0 },
    learn: [[1, 'm_king_press'], [4, 'merami'], [8, 'm_silver_flash'], [13, 'behoimi'], [18, 'iora'], [24, 'sg_behoma'], [30, 'merazoma']],
    resist: { sleep: 0.5, poison: 0.3, confuse: 0.5, paralyze: 0.5 },
    gear: { head: false },
    note: '銀色の王さま。とても固くて素早い。',
  },
  elder_treant: {
    rate: 0, breedOnly: true, recipeOnly: true, names: ['ちょうろう', 'オオキ', 'モリノヌシ', 'じゅかい'],
    growth: { hp: 1.5, mp: 1.1, str: 1.05, def: 1.3, agi: 0.5, mag: 1.0, heal: 1.45 },
    learn: [[1, 'm_root_heal'], [4, 'm_branch_whip'], [8, 'behoimi'], [12, 'm_forest_blessing'], [16, 'm_pollen'], [22, 'zao'], [28, 'sg_behoma']],
    note: '森の長老。HPがとても多く、仲間みんなをいやす。',
  },
  archmage: {
    rate: 0, breedOnly: true, recipeOnly: true, names: ['マドウ', 'ヤミノ', 'グリモア', 'ほしぞら'],
    growth: { hp: 0.95, mp: 1.38, str: 0.7, def: 0.9, agi: 1.0, mag: 1.45, heal: 1.15 },
    learn: [[1, 'merami'], [4, 'rukani'], [8, 'begirama'], [12, 'm_arcane_burst'], [16, 'mahoton'], [20, 'merazoma'], [26, 'sm_jigo']],
    gear: { weapons: ['staff', 'dagger'], armor: ['cloth', 'robe'], shield: false, head: 'hat' },
    note: '闇の大魔道士。強い攻撃呪文をたくさん覚える。',
  },
  gold_golem: {
    rate: 0, breedOnly: true, recipeOnly: true, names: ['ゴールド', 'キンキラ', 'こがね', 'おおがね'],
    growth: { hp: 1.5, mp: 0.55, str: 1.42, def: 1.55, agi: 0.6, mag: 0.5, heal: 0.5 },
    learn: [[1, 'm_boulder'], [4, 'm_harden'], [8, 'm_gold_punch'], [13, 'kabau'], [18, 'm_stomp'], [24, 'gd_wall'], [30, 'm_avalanche']],
    note: '黄金のきょじん。とても固く、黄金のこぶしで大ダメージ。',
  },
  phoenix: {
    rate: 0, breedOnly: true, recipeOnly: true, names: ['フェニ', 'ほむら', 'ヒノトリ', 'あかつき'],
    growth: { hp: 1.1, mp: 1.15, str: 1.05, def: 0.9, agi: 1.3, mag: 1.2, heal: 1.2 },
    learn: [[1, 'm_spark_wing'], [4, 'hoimi'], [8, 'm_flame_breath'], [12, 'behoimi'], [16, 'zao'], [20, 'm_phoenix_fire'], [26, 'behomara'], [32, 'sg_behoma']],
    gear: { weapons: [] },
    note: '火の鳥。炎の技と、仲間を生き返らせる呪文を覚える。',
  },
  thunder_dragon: {
    rate: 0, breedOnly: true, recipeOnly: true, names: ['ライリュウ', 'イナズマ', 'ボルト', 'カミナリ'],
    growth: { hp: 1.45, mp: 0.95, str: 1.4, def: 1.25, agi: 1.0, mag: 1.05, heal: 0.6 },
    learn: [[1, 'm_bite'], [3, 'm_thunder'], [7, 'm_dragon_claw'], [11, 'm_thunder_fang'], [15, 'm_dragon_roar'], [20, 'mk_raiden'], [26, 'm_thunder_breath'], [32, 'gh_ikazuchi']],
    note: '雷の竜。雷の技をたくさん覚える、とても強い竜。',
  },
};

// ───────────── 特殊配合（きまった 組み合わせ。companions.js の BREED_RECIPES に まぜる） ─────────────
// a・b: しゅぞくID か { race } の じょうけん（どちらが 1ぴきめでも よい）
export const RECIPES_R23 = [
  { a: 'pururin', b: 'king_pururin', child: 'pururin_tower' },
  { a: 'kirakira', b: 'king_pururin', child: 'silver_king' },
  { a: 'golem', b: 'clockwork_knight', child: 'gold_golem' },
  { a: 'great_dragon', b: 'ikazuchi_tiger', child: 'thunder_dragon' },
  { a: 'star_panther', b: 'storm_bird', child: 'pegasus' },
  { a: 'ember_bird', b: 'fire_imp', child: 'phoenix' },
  { a: 'shadow_mage', b: 'demon_knight', child: 'archmage' },
  { a: 'snow_wisp', b: 'thunder_imp', child: 'aurora_spirit' },
  { a: 'chibi_treant', b: { race: 'spirit' }, child: 'elder_treant' },
  { a: 'dragon_statue', b: { race: 'demon' }, child: 'gargoyle' },
  { a: 'skeleton', b: { race: 'dragon' }, child: 'bone_dragon' },
  { a: 'fuwari', b: { race: 'dragon' }, child: 'fairy_dragon' },
];

// ───────────── 技 ─────────────
export const R23_ABILITIES = {
  m_acorn_roll: {
    name: 'どんぐりころがし', kana: 'どんぐりころがし', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4, acc: 0.9 }, cast: '{a}はころころ転がって体当たりした！', anim: 'tackle',
    desc: '転がって体当たりする。少し外れやすい。',
  },
  m_petal_heal: {
    name: '花びらのいやし', kana: 'はなびらのいやし', kind: 'monster', mp: 5, target: 'allies',
    effect: { type: 'heal', base: [22, 30], thr: 20 }, cast: '{a}は花びらをまいた！やさしいかおりが広がる…', anim: 'heal1',
    desc: '花びらのかおりで、味方みんなのHPを少し回復する。',
  },
  m_vine_bind: {
    name: 'つるでしばる', kana: 'つるでしばる', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.0, status: { status: 'paralyze', chance: 0.2, turns: [1, 2] } }, cast: '{a}は長いつるをのばした！', anim: 'hit',
    desc: 'つるでしばりつける。マヒさせることがある。',
  },
  m_imp_trick: {
    name: 'こあくまのいたずら', kana: 'こあくまのいたずら', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'status', status: 'confuse', chance: 0.3, turns: [1, 2] }, cast: '{a}はくすくすわらって、いたずらをしかけた！', anim: 'debuff',
    desc: 'いたずらで、敵1体を混乱させることがある。',
  },
  m_tin_cannon: {
    name: 'ブリキほう', kana: 'ぶりきほう', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'magic', element: 'blast', base: [18, 24], thr: 99 }, cast: '{a}の背中のつつが、ドカンと火をふいた！', anim: 'blast1',
    desc: '背中のつつから玉をうって、敵1体に爆発のダメージ。',
  },
  m_fin_slash: {
    name: 'ひれカッター', kana: 'ひれかったー', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.35, element: 'wind' }, cast: '{a}は風を切って飛び、むなびれで切りつけた！', anim: 'slash_fast',
    desc: 'するどいむなびれで、風のように切りつける。',
  },
  m_shell_spin: {
    name: 'うずまきスピン', kana: 'うずまきすぴん', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'phys', mult: 0.75 }, cast: '{a}はぐるぐる回って、体当たりしてきた！', anim: 'hit_all',
    desc: '回転しながら、敵みんなに体当たりする。',
  },
  m_ice_bloom: {
    name: 'つららの花', kana: 'つららのはな', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'magic', element: 'ice', base: [24, 32], thr: 99 }, cast: '{a}はこおった花びらをまき散らした！', anim: 'blizzard',
    desc: 'こおった花びらで、敵みんなに氷のダメージ。',
  },
  m_gem_shine: {
    name: '宝石の光', kana: 'ほうせきのひかり', kind: 'monster', mp: 5, target: 'enemy',
    effect: { type: 'magic', element: 'light', base: [44, 56], thr: 99 }, cast: '{a}のこうらの宝石が、まぶしく光った！', anim: 'dragon_beam',
    desc: 'こうらの宝石から光を放ち、敵1体に光のダメージ。',
  },
  m_ember_dash: {
    name: 'ひのこダッシュ', kana: 'ひのこだっしゅ', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.45, element: 'fire' }, cast: '{a}は火の粉をまいて、つっこんできた！', anim: 'tackle',
    desc: '火をまとって体当たりする。炎の力がこもる。',
  },
  m_needle_rain: {
    name: 'トゲの雨', kana: 'とげのあめ', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'phys', mult: 0.75 }, cast: '{a}は体中のトゲを、雨のように飛ばした！', anim: 'hit_all',
    desc: 'トゲを飛ばして、敵みんなを攻撃する。',
  },
  m_tower_crash: {
    name: 'タワーくずし', kana: 'たわーくずし', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'phys', mult: 1.05 }, cast: '{a}はぐらりとかたむいて、敵みんなの上にくずれ落ちた！', anim: 'quake',
    desc: 'タワーごとくずれ落ちて、敵みんなにのしかかる。',
  },
  m_silver_flash: {
    name: '銀のきらめき', kana: 'ぎんのきらめき', kind: 'monster', mp: 12, target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [60, 76], thr: 99 }, cast: '{a}の体が、銀色にきらめいた！', anim: 'holy',
    desc: '銀色のかがやきで、敵みんなに光のダメージ。',
  },
  m_scream: {
    name: 'さけび声', kana: 'さけびごえ', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'status', status: 'paralyze', chance: 0.2, turns: [1, 2] }, cast: '{a}は耳をつんざく大声でさけんだ！', anim: 'warcry',
    desc: '大声でさけび、敵みんなをマヒさせることがある。',
  },
  m_forest_blessing: {
    name: '森のめぐみ', kana: 'もりのめぐみ', kind: 'monster', mp: 14, target: 'allies',
    effect: { type: 'heal', base: [80, 100], thr: 60 }, cast: '{a}の枝から、やさしい光がふりそそいだ！', anim: 'heal2',
    desc: '森の力で、味方みんなのHPを回復する。',
  },
  m_aurora: {
    name: 'オーロラカーテン', kana: 'おーろらかーてん', kind: 'monster', mp: 12, target: 'enemies',
    effect: { type: 'magic', element: 'ice', base: [56, 70], thr: 99 }, cast: '{a}は七色の光のカーテンを広げた！', anim: 'blizzard',
    desc: 'オーロラの光で、敵みんなに氷のダメージ。',
  },
  m_star_dust: {
    name: '星くずのきらめき', kana: 'ほしくずのきらめき', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [26, 34], thr: 99 }, cast: '{a}は星くずの粉をまいた！', anim: 'holy',
    desc: 'きらきらの星くずで、敵みんなに光のダメージ。',
  },
  m_stone_wing: {
    name: '石のつばさ', kana: 'いしのつばさ', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.6, acc: 0.9 }, cast: '{a}は空高くまい上がり、石のつばさで急降下した！', anim: 'gigabreak',
    desc: '急降下して、石のつばさでたたきつける。少し外れやすい。',
  },
  m_arcane_burst: {
    name: '闇の大魔道', kana: 'やみのだいまどう', kind: 'monster', mp: 14, target: 'enemies',
    effect: { type: 'magic', element: 'dark', base: [66, 82], thr: 99 }, cast: '{a}はローブを広げ、闇の大魔道をとなえた！', anim: 'dark1',
    desc: '闇の力を集めて、敵みんなに闇のダメージ。',
  },
  m_bone_breath: {
    name: '闇の息', kana: 'やみのいき', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'magic', element: 'dark', base: [44, 56], thr: 99, breath: true }, cast: '{a}は冷たい闇の息をはいた！', anim: 'breath',
    desc: '冷たい闇の息で、敵みんなに闇のダメージ。',
  },
  m_headless_slash: {
    name: 'くびなし斬り', kana: 'くびなしぎり', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.7 }, cast: '{a}は頭のないまま、大きく剣をふり下ろした！', anim: 'slash_heavy',
    desc: '大きく剣をふり下ろす、重い一撃。',
  },
  m_mimic_bite: {
    name: 'ばくっとかみつく', kana: 'ばくっとかみつく', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.8, acc: 0.85 }, cast: '{a}のふたが開いて、ばくっとかみついた！', anim: 'bite',
    desc: '大きな口でかみつく。外れやすいが、当たれば大ダメージ。',
  },
  m_gold_punch: {
    name: '黄金のこぶし', kana: 'おうごんのこぶし', kind: 'monster', mp: 6, target: 'enemy',
    effect: { type: 'phys', mult: 2.0, acc: 0.9 }, cast: '{a}は黄金のこぶしを、思いきりふり下ろした！', anim: 'slash_heavy',
    desc: '黄金のこぶしで、敵1体に大ダメージ。少し外れやすい。',
  },
  m_fairy_breath: {
    name: 'あまい花の息', kana: 'あまいはなのいき', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.35, turns: [1, 2] }, cast: '{a}はあまい花のかおりの息をはいた！', anim: 'breath',
    desc: 'あまい息で、敵みんなをねむらせることがある。',
  },
  m_thunder_breath: {
    name: 'いかずちの息', kana: 'いかずちのいき', kind: 'monster', mp: 16, target: 'enemies',
    effect: { type: 'magic', element: 'bolt', base: [84, 102], thr: 30, breath: true }, cast: '{a}はいかずちの息をはいた！空がまっ白に光る！', anim: 'bolt2',
    desc: 'いなずまの息で、敵みんなに雷の大ダメージ。',
  },
  m_pegasus_wing: {
    name: '天馬のつばさ', kana: 'てんまのつばさ', kind: 'monster', mp: 12, target: 'enemies',
    effect: { type: 'magic', element: 'wind', base: [58, 72], thr: 99 }, cast: '{a}が大きくはばたくと、つむじ風がまき起こった！', anim: 'wind2',
    desc: '大きなつばさで風を起こし、敵みんなに風のダメージ。',
  },
  m_phoenix_fire: {
    name: '不死鳥の炎', kana: 'ふしちょうのほのお', kind: 'monster', mp: 14, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [74, 90], thr: 99 }, cast: '{a}は金色の炎をまとって、はばたいた！', anim: 'fire_wave',
    desc: '金色の炎で、敵みんなに炎のダメージ。',
  },
};

// ───────────── 素材の ドロップ（loot.js の MAT_DROPS に まぜる） ─────────────
export const R23_MAT_DROPS = {
  donguri: ['magic_powder', 12],
  hana_pururin: ['magic_powder', 10],
  karamizuta: ['magic_powder', 8],
  koakuma: ['magic_powder', 6],
  buriki: ['iron_shard', 4],
  tobiuo: ['pretty_shell', 6],
  uzumaki_gai: ['pretty_shell', 4],
  tsurara_sou: ['ice_crystal', 5],
  hoseki_game: ['silver_shard', 3],
  hinezumi: ['flame_stone', 5],
  toge_saboten: ['magic_powder', 5],
};
