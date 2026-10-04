// 第4章「砂の海にしずむ星」の モンスター（monsters.js で まぜる）
// え は render/ch4-art.js（ID で きまる）
// s_coast=北の海辺 s_dune=砂ばく s_oasis=オアシスの まわり s_well=北の古井戸（夜は *_night。encounters-ch4.js）

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
};

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる）
export const CH4_MAT_DROPS = {
  sand_slime: ['magic_powder', 6],
  scorpion_soldier: ['beast_fang', 4],
  sand_vulture: ['wind_feather', 4],
  gold_beetle: ['silver_shard', 3],
  mirage_flower: ['magic_powder', 4],
  dry_frog: ['magic_powder', 5],
};
