// 第4章「砂の海にしずむ星」の モンスター（monsters.js で まぜる）
// え は render/ch4-art.js（ID で きまる）
// s_coast=北の海辺 s_dune=砂ばく s_oasis=オアシスの まわり s_well=北の古井戸（夜は *_night。encounters-ch4.js）
// Step 4: s_pdesert=王家の墓の砂ばく（王都の 東）s_pyr*=王家のピラミッドの 中

// ボスの じょうたい いじょうの 効きにくさ（第3章の ボスと おなじ）
const BOSS_STATUS = { sleep: 0.1, poison: 0.3, confuse: 0.1, blind: 0.3, silence: 0.2, paralyze: 0.1 };
// きらきらぷるりんと おなじ「とても かたい」魔物の たいせい（monsters.js の METAL_RESIST と おなじ）
const METAL_RESIST = { fire: 0, ice: 0, wind: 0, blast: 0, bolt: 0, light: 0, dark: 0, void: 0.5, sleep: 0, poison: 0, confuse: 0, blind: 0, silence: 0, paralyze: 0, debuff: 0 };

export const MONSTERS_CH4 = {
  // ── 砂ばく・海辺 ──
  sand_slime: {
    name: '砂ぷるりん', lv: 29, hp: 250, mp: 30, str: 100, def: 66, agi: 38, mag: 56, exp: 150, gold: 72,
    race: 'slime', size: 's', resist: { wind: 0.6, ice: 1.4, blast: 1.2, blind: 0 }, drops: { common: ['herb', 6], rare: ['seed_agi', 64] },
    actions: [{ w: 4, id: 'attack' }, { w: 2, id: 'm_sand_throw' }, { w: 1, id: 'm_sand_call', cond: 'callHelp' }],
    desc: '砂つぶからできた、黄色いぷるりん。かわいた砂をまき上げて、目をくらませる。',
  },
  scorpion_soldier: {
    name: 'サソリ兵', lv: 30, hp: 350, str: 116, def: 86, agi: 34, exp: 182, gold: 84,
    race: 'beast', size: 'm', hit: 'slash', resist: { ice: 1.35, bolt: 1.3, fire: 0.8, poison: 0 }, drops: { common: ['antidote', 4], rare: ['seed_def', 48] },
    actions: [
      { w: 4, id: 'attack' }, { w: 3, id: 'm_poison_sting' }, { w: 2, id: 'm_scissor_combo' }, { w: 1, id: 'm_harden', cond: 'notRecent:m_harden' },
      { w: 1, id: 'm_claw_guard', cond: 'notRecent:m_claw_guard' },
    ],
    desc: 'かたいこうらに身をつつんだ、大きなサソリ。しっぽの毒ばりと、2本のはさみでおそってくる。はさみをかまえたら、なぐりかかると反撃される。',
  },
  sand_vulture: {
    name: '砂ハゲタカ', lv: 30, hp: 270, str: 112, def: 52, agi: 74, exp: 172, gold: 80,
    race: 'beast', size: 'm', flying: true, hit: 'bite', resist: { wind: 0.5, bolt: 1.4, ice: 1.1 }, drops: { common: ['moonherb', 10], rare: ['seed_agi', 64] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_double_peck' }, { w: 2, id: 'm_vulture_dive' }],
    desc: '砂ばくの空をぐるぐる回る、大きなハゲタカ。弱った旅人を見つけると、急降下してくる。',
  },
  gold_beetle: {
    name: '黄金虫', lv: 31, hp: 6, mp: 10, str: 72, def: 255, agi: 92, mag: 10, exp: 900, gold: 640,
    race: 'beast', size: 's', metal: true, resist: METAL_RESIST, drops: { common: ['star_shard', 4], rare: ['seed_hp', 32] },
    actions: [{ w: 3, id: 'm_flee' }, { w: 2, id: 'attack' }, { w: 1, id: 'm_harden' }],
    desc: '金色にかがやく、とても固い虫。すぐににげてしまうが、たおすとゴールドがたくさん手に入る。',
  },
  mirage_flower: {
    name: 'まぼろしの花', lv: 31, hp: 260, mp: 60, str: 86, def: 58, agi: 44, mag: 96, exp: 176, gold: 82,
    race: 'plant', size: 'm', resist: { fire: 1.5, ice: 0.8, wind: 1.2, confuse: 0, sleep: 0.5 }, drops: { common: ['moonherb', 8], rare: ['seed_mag', 48] },
    actions: [{ w: 3, id: 'm_sweet_scent', cond: 'notRecent:m_sweet_scent' }, { w: 2, id: 'm_mirage_pollen' }, { w: 2, id: 'attack' }, { w: 1, id: 'm_root_drain' }],
    desc: 'オアシスのそばにさく、ゆらゆら光る花の魔物。あまい香りで、旅人をまどわせる。',
  },
  // ── 夜の 砂ばく ──
  moon_ghost: {
    name: '月のゆうれい', lv: 33, hp: 330, mp: 90, str: 104, def: 58, agi: 64, mag: 112, exp: 236, gold: 104,
    race: 'undead', size: 'm', night: true, resist: { light: 1.6, dark: 0.3, fire: 1.2, ice: 0.8, sleep: 0.2, poison: 0 }, drops: { common: ['moon_drop', 10], rare: ['seed_mag', 48] },
    actions: [
      { w: 3, id: 'm_moon_beam' }, { w: 2, id: 'm_soul_sip' }, { w: 2, id: 'attack' },
      { w: 1, id: 'mahoton', cond: 'notRecent:mahoton' }, { w: 1, id: 'm_ghost_fade', cond: 'notRecent:m_ghost_fade' },
    ],
    desc: '月の夜にだけ、砂ばくをさまようゆうれい。体がすけて、攻撃がすりぬけることがある。',
  },
  // ── かれた地下水路（Step 2）──
  dry_frog: {
    name: 'からからガエル', lv: 30, hp: 310, mp: 40, str: 108, def: 60, agi: 52, mag: 70, exp: 176, gold: 80,
    race: 'beast', size: 'm', hit: 'bite', resist: { fire: 1.4, wind: 1.2, ice: 0.7, poison: 0.5 }, drops: { common: ['magic_water', 24], rare: ['seed_mag', 48] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_tongue_sip' }, { w: 2, id: 'm_frog_jump' }, { w: 1, id: 'm_dry_croak', cond: 'notRecent:m_dry_croak' }],
    desc: '水がかれた水路で、からからにひからびてしまったカエル。長い舌で、旅人のMPを吸い取る。',
  },
  // ── ボス（Step 2・かれた地下水路の おく）──
  armor_scorpion: {
    name: 'よろい大サソリ', lv: 31, hp: 5600, mp: 60, str: 108, def: 86, agi: 30, mag: 50, exp: 7600, gold: 3200,
    race: 'beast', size: 'xl', boss: true, turns: 2, speed: 0.74, hit: 'slash', drops: { boss: ['scorpion_brooch'] },
    resist: { ...BOSS_STATUS, poison: 0, fire: 0.75, ice: 1.3, bolt: 1.3 },
    actions: [
      { w: 3, id: 'attack' }, { w: 2, id: 'm_poison_sting' }, { w: 2, id: 'm_scissor_combo' }, { w: 1, id: 'm_sand_throw', cond: 'notRecent:m_sand_throw' },
      { w: 2, id: 'm_claw_stance', cond: 'notRecent:m_claw_stance' },
    ],
    phases: [
      { hpBelow: 0.5, msg: ['よろい大サソリは、しっぽを高くふり上げた！', 'キシャアアア…！水路のおくから、サソリ兵がかけつけてきた！'], summon: ['scorpion_soldier', 'scorpion_soldier'] },
      { hpBelow: 0.25, msg: ['よろい大サソリのこうらが、まっかにそまった！', 'よろい大サソリは、いかりくるっている…！'], buff: { atk: 1.2 }, addActions: [{ w: 2, id: 'm_poison_tail' }] },
    ],
    desc: '地下水路のおくで、水をせき止めていた大きなサソリ。はさみを大きくひらいたら、反撃の構え。なぐらずに、呪文や防御で待とう。',
  },

  // ── 王家の墓の砂ばく・王家のピラミッド（Step 4）──
  // ミイラ兵: たおしても 1回だけ 起き上がる（revive。炎か 光で とどめを さすと 起き上がれない。battle.js）
  mummy_soldier: {
    name: 'ミイラ兵', lv: 32, hp: 360, str: 122, def: 74, agi: 30, mag: 40, exp: 214, gold: 98,
    race: 'undead', size: 'm', hit: 'slash', revive: { hp: 0.5, not: ['fire', 'light'] },
    resist: { fire: 1.5, light: 1.5, dark: 0.3, poison: 0, ice: 0.9, sleep: 0.3, confuse: 0.6 }, drops: { common: ['moonherb', 10], rare: ['seed_hp', 64] },
    actions: [{ w: 4, id: 'attack' }, { w: 2, id: 'm_mummy_bandage' }, { w: 2, id: 'm_mummy_grab' }],
    desc: '王家のピラミッドを守る、ほうたいにまかれた兵士。たおしても、1回だけ起き上がる。炎か光でとどめをさすと、もう起き上がれない。',
  },
  // のろいのつぼ: 宝の 入った つぼの ふり（金色の つぼ）。MPを すう
  cursed_pot: {
    name: 'のろいのつぼ', lv: 33, hp: 300, mp: 80, str: 100, def: 118, agi: 46, mag: 96, exp: 250, gold: 220,
    race: 'material', size: 's', resist: { light: 1.5, dark: 0.3, poison: 0, sleep: 0.4, blast: 1.25, confuse: 0.5, blind: 0.5 },
    drops: { common: ['magic_water', 20], rare: ['seed_mag', 48] },
    actions: [{ w: 3, id: 'm_pot_suck' }, { w: 2, id: 'attack' }, { w: 2, id: 'm_pot_spin' }, { w: 1, id: 'm_pot_smoke', cond: 'notRecent:m_pot_smoke' }],
    desc: '宝物の入ったつぼのふりをして、近づいた旅人のMPをすいとる。光の呪文がよく効く。',
  },
  // 砂岩ゴーレム: 守りが 高い。うでを ふりかぶると（前ぶれ）つぎの 番に 大ぶりの 一撃
  sandstone_golem: {
    name: '砂岩ゴーレム', lv: 33, hp: 520, str: 136, def: 124, agi: 24, mag: 20, exp: 300, gold: 140,
    race: 'material', size: 'l', hit: 'smash',
    resist: { ice: 1.4, blast: 1.4, fire: 0.6, wind: 0.8, bolt: 0.8, poison: 0, sleep: 0.3, confuse: 0.3, paralyze: 0.5 }, drops: { common: ['silver_shard', 12], rare: ['seed_def', 40] },
    actions: [{ w: 4, id: 'attack' }, { w: 2, id: 'm_golem_windup', cond: 'notRecent:m_golem_windup' }, { w: 1, id: 'm_golem_harden', cond: 'notRecent:m_golem_harden' }],
    desc: '岩山とピラミッドを守る、砂岩でできた大きな人形。守りがとても高い。うでをふりかぶったら、大ぶりの一撃が来る。氷と爆発が効く。',
  },
  // ランプの魔人（夜の 王家の墓の砂ばく）: 強い 炎の 呪文。MPが 多い
  lamp_genie: {
    name: 'ランプの魔人', lv: 34, hp: 400, mp: 220, str: 102, def: 76, agi: 60, mag: 132, exp: 330, gold: 210,
    race: 'demon', size: 'm', night: true, resist: { ice: 1.4, fire: 0.5, dark: 0.6, sleep: 0.4, confuse: 0.5, poison: 0.5 },
    drops: { common: ['magic_water', 16], rare: ['seed_mag', 40] },
    actions: [{ w: 3, id: 'm_genie_flame' }, { w: 2, id: 'm_genie_blaze' }, { w: 2, id: 'attack' }, { w: 1, id: 'm_genie_smoke', cond: 'notRecent:m_genie_smoke' }],
    desc: '夜の砂ばくにあらわれる、古いランプから出てくる魔人。強い炎の呪文をとなえる。氷が効く。',
  },
  // 王のミイラ兵（王のへや。アンクと いっしょに 出る。たおれても アンクの よみがえりの呪文で 生き返る）
  // ゆっくり 動く（speed 0.6）。アンクが たおれると くずれおちる（mummy_king の minionsFall）
  royal_mummy: {
    name: '王のミイラ兵', lv: 33, hp: 900, str: 100, def: 58, agi: 32, mag: 40, exp: 420, gold: 160,
    race: 'undead', size: 'm', hit: 'slash', speed: 0.6,
    resist: { fire: 1.5, light: 1.5, dark: 0.3, poison: 0, ice: 0.9, sleep: 0.3, confuse: 0.6 }, drops: { common: ['moonherb', 8], rare: ['seed_str', 96] },
    actions: [{ w: 4, id: 'attack' }, { w: 1, id: 'm_mummy_bandage' }, { w: 1, id: 'm_mummy_grab' }],
    desc: '王のへやを守る、金のかざりをつけたミイラ兵。ミイラの王の呪文で、何度でも生き返る。',
  },

  // ── ボス（Step 4・王家のピラミッドの 王のへや）──
  // よみがえりの呪文: 古い 言葉を となえ始めて（前ぶれ）、つぎの 番に たおれた 王のミイラ兵が みんな 生き返る。
  // となえて いる あいだに アンクの HPの 1わり ぶんの ダメージを あたえると、呪文が とぎれる（battle.js の chant）
  mummy_king: {
    name: 'ミイラの王アンク', lv: 33, hp: 6500, mp: 240, str: 116, def: 66, agi: 44, mag: 120, exp: 9800, gold: 4400,
    race: 'undead', size: 'xl', boss: true, turns: 2, speed: 0.66, hit: 'slash', drops: { boss: ['royal_bracelet'] },
    // アンクが たおれると、王の 力で うごいていた 王のミイラ兵も くずれおちる（battle.js の kill）
    minionsFall: ['royal_mummy'], fallMsg: '王の力が消えて、王のミイラ兵たちも、くずれおちた！',
    resist: { ...BOSS_STATUS, poison: 0.15, fire: 1.3, light: 1.3, dark: 0.5 },
    actions: [
      { w: 3, id: 'attack' }, { w: 2, id: 'm_anku_staff' }, { w: 1, id: 'm_anku_hand' },
      { w: 2, id: 'm_anku_curse_charge', cond: 'notRecent:m_anku_curse_charge' },
      // 王のミイラ兵が たおれて いる ときは、よく よみがえりの呪文を となえる
      { w: 7, id: 'm_anku_chant', cond: ['deadFriend:royal_mummy', 'notRecent:m_anku_chant'] },
    ],
    phases: [
      { hpBelow: 0.5, msg: ['アンクは、つえを高くかかげた！', 'ひつぎのふたが開いて、王のミイラ兵が起き上がった！'], summon: ['royal_mummy', 'royal_mummy'] },
      { hpBelow: 0.25, msg: ['アンクの目が、まっかにもえ上がった！', '「王のいかり」…アンクの攻撃力が上がった！'], buff: { atk: 1.3 } },
    ],
    desc: '王家のピラミッドの「王のへや」で、月の鏡を守るミイラの王。古い言葉をとなえ始めたら、よみがえりの呪文の前ぶれ。アンクに大きなダメージをあたえて止めよう。アンクをたおすと、王のミイラ兵もくずれおちる。',
  },
};

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる）
export const CH4_MAT_DROPS = {
  sand_slime: ['magic_powder', 6],
  scorpion_soldier: ['beast_fang', 4],
  sand_vulture: ['wind_feather', 4],
  gold_beetle: ['silver_shard', 3],
  mirage_flower: ['magic_powder', 4],
  dry_frog: ['magic_powder', 5],
  // Step 4
  mummy_soldier: ['magic_powder', 5],
  cursed_pot: ['silver_shard', 5],
  sandstone_golem: ['iron_shard', 3],
  lamp_genie: ['magic_powder', 4],
};
