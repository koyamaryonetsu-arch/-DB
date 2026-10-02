// 第3章「星の竜がねむる山」の モンスター（monsters.js で まぜる）
// え は render/ch3-art.js・ch3-boss-art.js（ID で きまる）
// n_snow=雪原 n_forest=しずか雪の森 n_lake=白銀の湖 n_mine=鉱山への道 n_peak=星竜山のふもと n_volcano=炎の山のふもと
// n_ice=氷の洞窟 n_mine1/n_mine2=鉱山 n_volc=炎の山 n_temple=竜の試練の神殿 n_peak_out/n_peak_in=星竜山

const BOSS_STATUS = { sleep: 0.1, poison: 0.3, confuse: 0.1, blind: 0.3, silence: 0.2, paralyze: 0.1 };

export const MONSTERS_CH3 = {
  // ── 雪原・森 ──
  snow_slime: {
    name: 'ゆきぷるりん', lv: 19, hp: 124, mp: 30, str: 58, def: 40, agi: 22, mag: 40, exp: 80, gold: 40,
    race: 'slime', size: 's', resist: { ice: 0.3, fire: 1.5 }, drops: { common: ['herb', 6], rare: ['seed_def', 64] },
    actions: [{ w: 4, id: 'attack' }, { w: 2, id: 'm_snowball' }, { w: 1, id: 'hyado' }],
    desc: '頭に雪をのせた、つめたいぷるりん。ほっぺが赤いのは、さむいから。',
  },
  frost_wolf: {
    name: 'こおりオオカミ', lv: 20, hp: 142, str: 66, def: 36, agi: 46, exp: 88, gold: 42,
    race: 'beast', size: 'm', hit: 'bite', resist: { ice: 0.4, fire: 1.4 }, drops: { common: ['herb', 8], rare: ['fire_claw', 64] },
    actions: [{ w: 4, id: 'attack' }, { w: 2, id: 'm_bite' }, { w: 2, id: 'm_frost_breath' }, { w: 1, id: 'm_frost_howl', cond: 'callHelp' }],
    desc: 'つららのようなたてがみの、白いオオカミ。こおりの息で、えものの足を止める。',
  },
  snowman: {
    name: 'ゆきだるまん', lv: 20, hp: 168, mp: 20, str: 60, def: 46, agi: 14, mag: 36, exp: 90, gold: 45,
    race: 'material', size: 'm', resist: { ice: 0, fire: 1.6, poison: 0 }, drops: { common: ['herb', 6], rare: ['fur_hat', 48] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_snowball' }, { w: 2, id: 'm_broom_sweep' }, { w: 1, id: 'm_snow_mend', cond: 'hpBelow:0.5' }],
    desc: '赤いバケツをかぶった、動く雪だるま。ほうきで雪をはらいながら、雪玉をなげてくる。',
  },
  yeti: {
    name: 'イエティ', lv: 23, hp: 262, str: 78, def: 48, agi: 24, exp: 132, gold: 60,
    race: 'beast', size: 'l', resist: { ice: 0.3, fire: 1.3 }, drops: { common: ['moonherb', 8], rare: ['seed_str', 32] },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_yeti_punch' }, { w: 2, id: 'm_snow_quake' }, { w: 1, id: 'm_warcry', cond: 'notRecent:m_warcry' }],
    desc: '雪山にすむ、白い毛むくじゃらの大男。大きなこぶしで、雪ごと地面をたたく。',
  },
  ice_bat: {
    name: 'つららコウモリ', lv: 19, hp: 104, str: 56, def: 30, agi: 52, exp: 76, gold: 36,
    race: 'beast', size: 's', flying: true, hit: 'bite', resist: { ice: 0.3, fire: 1.3, wind: 1.2 }, drops: { common: ['herb', 8], rare: ['seed_agi', 64] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_icicle_dive' }, { w: 1, id: 'm_drain' }],
    desc: 'つららのつばさをもつコウモリ。天井から、つららのように落ちてくる。',
  },
  snow_wisp: {
    name: 'ゆきんこ', lv: 20, hp: 112, mp: 60, str: 42, def: 34, agi: 40, mag: 56, exp: 86, gold: 44,
    race: 'spirit', size: 's', resist: { ice: 0, fire: 1.5, sleep: 0.3 }, drops: { common: ['magic_water', 24], rare: ['seed_mag', 48] },
    actions: [{ w: 3, id: 'hyado' }, { w: 2, id: 'm_snow_flurry' }, { w: 2, id: 'attack' }, { w: 1, id: 'rariho', cond: 'notRecent:rariho' }],
    desc: '雪のみのを着た、小さな雪のせいれい。いたずらで、ふぶきをおこす。',
  },
  // ── 湖・氷の洞窟 ──
  penguin_knight: {
    name: 'ペンギン騎士', lv: 21, hp: 168, str: 68, def: 54, agi: 28, exp: 96, gold: 52,
    race: 'beast', size: 'm', hit: 'slash', resist: { ice: 0.4, bolt: 1.3 }, drops: { common: ['herb', 6], rare: ['ice_shield', 64] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_belly_slide' }, { w: 1, id: 'm_shield_guard', cond: 'notRecent:m_shield_guard' }],
    desc: '小さなかぶとと丸いたてで身を守る、ペンギンの騎士。氷の上を、はらばいですべってくる。',
  },
  ice_golem: {
    name: 'アイスゴーレム', lv: 22, hp: 286, mp: 20, str: 74, def: 66, agi: 12, mag: 30, exp: 132, gold: 58,
    race: 'material', size: 'l', resist: { ice: 0, fire: 1.4, blast: 1.3, sleep: 0, poison: 0 }, drops: { common: ['ice_crystal', 6], rare: ['frost_mail', 64] },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_ice_punch' }, { w: 1, id: 'm_harden', cond: 'notRecent:m_harden' }, { w: 1, id: 'm_frost_breath' }],
    desc: 'すきとおった氷のブロックでできたゴーレム。体の中で、青いしんがかがやいている。',
  },
  kiba_walrus: {
    name: 'キバセイウチ', lv: 22, hp: 246, mp: 20, str: 76, def: 44, agi: 18, mag: 30, exp: 122, gold: 55,
    race: 'beast', size: 'l', resist: { ice: 0.5, bolt: 1.3, fire: 1.1 }, drops: { common: ['moonherb', 8], rare: ['seed_hp', 32] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_tusk' }, { w: 1, id: 'm_tidal' }],
    desc: '長いキバのセイウチ。キバをつき立てて、氷ごとえものをつきさす。',
  },
  // ── 鉱山 ──
  mole_miner: {
    name: 'ほりほりモグラ', lv: 22, hp: 164, str: 70, def: 46, agi: 30, exp: 100, gold: 60,
    race: 'beast', size: 's', resist: { blast: 1.2, ice: 1.2, bolt: 0.8 }, drops: { common: ['herb', 6], rare: ['steel_helm', 64] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm_pickaxe' }, { w: 1, id: 'm_rock_throw' }],
    desc: 'ヘルメットをかぶったモグラ。ツルハシで、なんでもほってしまう。',
  },
  ore_slime: {
    name: 'こうせきぷるりん', lv: 22, hp: 138, mp: 20, str: 62, def: 82, agi: 20, mag: 30, exp: 110, gold: 96,
    race: 'slime', size: 's', resist: { fire: 0.8, ice: 0.8, bolt: 1.5, poison: 0 }, drops: { common: ['iron_shard', 6], rare: ['seed_def', 32] },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_ore_bash' }, { w: 1, id: 'm_harden', cond: 'notRecent:m_harden' }],
    desc: '鉱石のかけらをのみこんで、かたくなったぷるりん。雷に弱い。お金をたくさん持っている。',
  },
  minecart_ghost: {
    name: 'トロッコおばけ', lv: 23, hp: 204, mp: 30, str: 74, def: 50, agi: 34, mag: 40, exp: 114, gold: 64,
    race: 'undead', size: 'm', resist: { light: 1.5, dark: 0.5, poison: 0, bolt: 1.2 }, drops: { common: ['smoke_ball', 10], rare: ['hammer_axe', 96] },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_cart_rush' }, { w: 1, id: 'm_ghost_laugh' }],
    desc: 'すてられたトロッコに、ゆうれいがとりついた。夜な夜な、レールの上を走り回る。',
  },
  fire_imp: {
    name: '火こぞう', lv: 23, hp: 134, mp: 60, str: 52, def: 36, agi: 44, mag: 62, exp: 108, gold: 58,
    race: 'spirit', size: 's', resist: { fire: 0.2, ice: 1.5 }, drops: { common: ['magic_water', 20], rare: ['seed_mag', 48] },
    actions: [{ w: 3, id: 'm_fire_spark' }, { w: 2, id: 'gira' }, { w: 2, id: 'attack' }, { w: 1, id: 'm_dance' }],
    desc: 'ほのおのくせっ毛の、いたずらこぞう。イグニアの手下になって、鉱山で火の玉をとばしている。',
  },
  // ── 炎の山 ──
  lava_lizard: {
    name: 'マグマトカゲ', lv: 24, hp: 236, mp: 30, str: 78, def: 56, agi: 28, mag: 40, exp: 118, gold: 62,
    race: 'dragon', size: 'm', resist: { fire: 0.1, ice: 1.5 }, drops: { common: ['herb', 6], rare: ['seed_hp', 48] },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_lava_spit' }, { w: 2, id: 'm_tail_whip' }],
    desc: 'ようがんの中でもへいきな、黒と赤のトカゲ。ひびの間から、マグマが光っている。',
  },
  fire_hound: {
    name: 'ファイアハウンド', lv: 25, hp: 214, str: 82, def: 46, agi: 54, mag: 44, exp: 126, gold: 64,
    race: 'beast', size: 'm', hit: 'bite', resist: { fire: 0.2, ice: 1.4 }, drops: { common: ['beast_fang', 4], rare: ['fire_claw', 48] },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_bite' }, { w: 2, id: 'm_flame_breath' }],
    desc: '炎をまとった黒い犬。火の山をかけ回り、炎の息をはく。',
  },
  magma_slime: {
    name: 'マグマぷるりん', lv: 24, hp: 176, mp: 40, str: 66, def: 52, agi: 26, mag: 50, exp: 112, gold: 58,
    race: 'slime', size: 's', resist: { fire: 0, ice: 1.6 }, drops: { common: ['herb', 6], rare: ['seed_def', 48] },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_magma_splash' }, { w: 1, id: 'behoimi', cond: 'allyHurt' }],
    desc: 'どろどろにとけた、あついぷるりん。仲間がきずつくと、ベホイミでなおす。',
  },
  ember_bird: {
    name: 'ひばなドリ', lv: 24, hp: 152, str: 68, def: 38, agi: 58, mag: 48, exp: 110, gold: 56,
    race: 'beast', size: 's', flying: true, resist: { fire: 0.2, ice: 1.4, wind: 1.2 }, drops: { common: ['wind_feather', 8], rare: ['seed_agi', 48] },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_dive' }, { w: 2, id: 'm_spark_wing' }],
    desc: '火の粉のつばさの小鳥。とびまわると、あたりに火の粉がまいちる。',
  },
  obsidian_knight: {
    name: '黒曜の騎士', lv: 26, hp: 330, mp: 20, str: 88, def: 72, agi: 26, mag: 30, exp: 162, gold: 82,
    race: 'demon', size: 'l', hit: 'slash', resist: { fire: 0.3, ice: 1.2, blast: 1.4, bolt: 1.2, sleep: 0.3, poison: 0 }, drops: { common: ['moonherb', 6], rare: ['obsidian_sword', 64] },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_obsidian_slash' }, { w: 1, id: 'm_harden', cond: 'notRecent:m_harden' }, { w: 1, id: 'm_warcry', cond: 'notRecent:m_warcry' }],
    desc: 'とがった黒曜石のよろいの騎士。よろいのつなぎ目が、赤く光っている。',
  },
  // ── 竜の試練の神殿・星竜山 ──
  dragon_statue: {
    name: '竜の石像', lv: 26, hp: 344, mp: 30, str: 86, def: 76, agi: 16, mag: 40, exp: 160, gold: 70,
    race: 'material', size: 'l', resist: { sleep: 0, poison: 0, blast: 1.4, bolt: 1.3, fire: 0.8, ice: 0.8, paralyze: 0 }, drops: { common: ['star_shard', 6], rare: ['seed_def', 32] },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_stomp' }, { w: 1, id: 'm_stone_gaze' }, { w: 1, id: 'm_harden', cond: 'notRecent:m_harden' }],
    desc: 'こけむした、竜の石像。試練をうける者の力を、ためしてくる。',
  },
  star_wyvern: {
    name: '星ワイバーン', lv: 28, hp: 310, mp: 40, str: 90, def: 58, agi: 50, mag: 56, exp: 178, gold: 86,
    race: 'dragon', size: 'l', flying: true, resist: { wind: 0.6, ice: 0.8, fire: 0.8, bolt: 1.3 }, drops: { common: ['moonherb', 6], rare: ['frost_lance', 64] },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_dragon_dive' }, { w: 2, id: 'm_star_breath' }, { w: 1, id: 'm_dragon_claw' }],
    desc: 'つばさに星のもようがある、こい青のワイバーン。夜空のような息をはく。',
  },
  shadow_flame: {
    name: 'かげ火', lv: 25, hp: 152, mp: 60, str: 52, def: 40, agi: 46, mag: 70, exp: 120, gold: 60,
    race: 'undead', size: 's', resist: { fire: 0.2, dark: 0.3, light: 1.6, ice: 1.3, poison: 0 }, drops: { common: ['magic_water', 16], rare: ['seed_mag', 32] },
    actions: [{ w: 3, id: 'm_shadow_fire' }, { w: 2, id: 'm_dark_bolt' }, { w: 1, id: 'attack' }, { w: 1, id: 'manusa', cond: 'notRecent:manusa' }],
    desc: 'むらさき色にゆらめく、目のある炎。炎の魔女イグニアの手下。',
  },
  frost_drake: {
    name: 'フロストドレイク', lv: 27, hp: 302, mp: 30, str: 86, def: 56, agi: 36, mag: 50, exp: 166, gold: 78,
    race: 'dragon', size: 'l', resist: { ice: 0.2, fire: 1.4 }, drops: { common: ['moonherb', 6], rare: ['frost_lance', 48] },
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_blizzard_breath' }, { w: 1, id: 'm_dragon_claw' }, { w: 1, id: 'm_tail_whip' }],
    desc: '白と水色の、わかい竜。こおりつく息をはいて、山を守っている。',
  },

  // ── ボス ──
  blizzard_mammoth: {
    name: 'ブリザマンモス', lv: 21, hp: 4600, str: 80, def: 44, agi: 20, mag: 40, exp: 3800, gold: 1600,
    race: 'beast', size: 'xl', boss: true, turns: 2, speed: 0.86, drops: { boss: ['ice_fang_charm'] },
    resist: { ...BOSS_STATUS, ice: 0.2, fire: 1.4, bolt: 1.0, wind: 1.0, blast: 1.0 },
    actions: [
      { w: 3, id: 'attack' }, { w: 3, id: 'm_tusk_charge' }, { w: 2, id: 'm_blizzard_breath' }, { w: 2, id: 'm_stomp' },
      { w: 1, id: 'm_mammoth_roar', cond: 'notRecent:m_mammoth_roar' },
    ],
    phases: [
      { hpBelow: 0.5, msg: ['ブリザマンモスは大きくほえた！', 'つららコウモリたちが天井からおりてきた！'], summon: ['ice_bat', 'ice_bat'] },
      { hpBelow: 0.25, msg: ['ブリザマンモスはいかりくるっている！', '攻撃力が上がった！'], buff: { atk: 1.2 }, addActions: [{ w: 2, id: 'm_mammoth_roar', cond: 'notRecent:m_mammoth_roar' }] },
    ],
    desc: '氷の洞窟の主。氷がとけていく山のいたみに、心をみだされていた。鼻を高く上げたら、なだれが来る。',
  },
  magma_golem: {
    name: 'マグマゴーレム', lv: 23, hp: 4600, mp: 40, str: 82, def: 60, agi: 14, mag: 44, exp: 4400, gold: 1900,
    race: 'material', size: 'xl', boss: true, turns: 2, speed: 0.74, drops: { boss: ['magma_bangle'] },
    resist: { ...BOSS_STATUS, fire: 0, ice: 1.5, blast: 1.3, bolt: 1.0, poison: 0, sleep: 0 },
    actions: [
      { w: 3, id: 'attack' }, { w: 3, id: 'm_magma_punch' }, { w: 2, id: 'm_lava_burst' }, { w: 1, id: 'm_harden', cond: 'notRecent:m_harden' },
      { w: 1, id: 'm_inhale', cond: 'notRecent:m_inhale' },
    ],
    phases: [
      { hpBelow: 0.6, msg: ['マグマゴーレムの体から、マグマがしたたり落ちた！', 'マグマぷるりんが生まれた！'], summon: ['magma_slime', 'magma_slime'] },
      { hpBelow: 0.25, msg: ['マグマゴーレムの体が、まっかにもえ上がった！', '攻撃力が上がった！'], buff: { atk: 1.2 }, addActions: [{ w: 2, id: 'm_lava_burst' }] },
    ],
    desc: '鉱山のおくで炎の石を集めていた、イグニアの手下のゴーレム。息を吸いこんだら、岩なだれが来る。',
  },
  flame_knight: {
    name: '炎の騎士フレアード', lv: 25, hp: 5000, mp: 60, str: 88, def: 56, agi: 40, mag: 60, exp: 5200, gold: 2200,
    race: 'demon', size: 'xl', boss: true, turns: 2, speed: 0.78, hit: 'slash', drops: { boss: ['flare_brooch'] },
    resist: { ...BOSS_STATUS, fire: 0.1, ice: 1.3, light: 1.1, dark: 0.8 },
    actions: [
      { w: 3, id: 'attack' }, { w: 3, id: 'm_flame_sword' }, { w: 2, id: 'm_flame_wave' }, { w: 1, id: 'm_warcry', cond: 'notRecent:m_warcry' },
      { w: 1, id: 'm_blaze_charge', cond: 'notRecent:m_blaze_charge' },
    ],
    phases: [
      { hpBelow: 0.55, msg: ['フレアード「出でよ、炎の犬たちよ！」'], summon: ['fire_hound', 'fire_hound'] },
      { hpBelow: 0.25, msg: ['フレアードのマントが、はげしくもえ上がった！', 'フレアード「イグニアさまのため…ここで終わるわけにはいかぬ！」'], buff: { atk: 1.2 }, addActions: [{ w: 2, id: 'm_blaze_charge', cond: 'notRecent:m_blaze_charge' }] },
    ],
    desc: 'イグニアの副官。炎の剣をふるう、まっかなよろいの騎士。マントがふくらんだら、炎の竜巻が来る。',
  },
  trial_guardian: {
    name: '竜の番人', lv: 27, hp: 5600, mp: 60, str: 92, def: 64, agi: 30, mag: 60, exp: 6000, gold: 2400,
    race: 'material', size: 'xl', boss: true, turns: 2, speed: 0.86, hit: 'slash', drops: { boss: ['courage_emblem'] },
    resist: { ...BOSS_STATUS, sleep: 0, poison: 0, fire: 0.9, ice: 0.9, light: 0.7, dark: 1.2, blast: 1.2 },
    actions: [
      { w: 3, id: 'attack' }, { w: 2, id: 'm_halberd_thrust' }, { w: 2, id: 'm_halberd_sweep' }, { w: 1, id: 'm_rune_beam' },
      { w: 1, id: 'm_guard_stance', cond: 'notRecent:m_guard_stance' }, { w: 1, id: 'm_judgment_charge', cond: 'notRecent:m_judgment_charge' },
    ],
    phases: [
      { hpBelow: 0.5, msg: ['竜の番人「その勇気、まことのものか…！」', '番人の体の古い文字が、強く光り始めた！'], buff: { atk: 1.15 }, addActions: [{ w: 1, id: 'm_rune_beam' }] },
      { hpBelow: 0.2, msg: ['竜の番人「おそれずに、立ち向かってみせよ！」'], debuff: { def: 0.8 }, addActions: [{ w: 2, id: 'm_judgment_charge', cond: 'notRecent:m_judgment_charge' }] },
    ],
    desc: '勇気の試練を守る、石の竜人。古い文字がきざまれたほこをふるう。体が光ったら、さばきの光が来る。',
  },
  flame_witch: {
    name: '炎の魔女イグニア', lv: 29, hp: 5000, mp: 200, str: 72, def: 56, agi: 44, mag: 90, exp: 5000, gold: 2000,
    race: 'demon', size: 'xl', boss: true, turns: 2, speed: 0.8, drops: { boss: ['flame_earring'] },
    resist: { ...BOSS_STATUS, fire: 0, ice: 1.2, light: 1.2, dark: 0.6 },
    actions: [
      { w: 3, id: 'm_witch_fire' }, { w: 2, id: 'm_hellfire' }, { w: 2, id: 'attack' }, { w: 1, id: 'm_heat_haze', cond: 'notRecent:m_heat_haze' },
      { w: 1, id: 'm_witch_call', cond: 'callHelp' },
    ],
    phases: [
      { hpBelow: 0.5, msg: ['イグニア「ふふ…少しはやるようね。」', 'イグニアは、かげ火たちを呼び出した！'], summon: ['shadow_flame', 'shadow_flame'] },
      { hpBelow: 0.25, msg: ['イグニアのかみが、はげしくもえ上がった！'], addActions: [{ w: 2, id: 'm_hellfire' }] },
    ],
    desc: '四ツ影の1人、炎の魔女。炎の守り星をうばい、星竜山の氷をとかしていた。',
  },
  flame_witch_true: {
    name: 'イグニア（真の姿）', lv: 30, hp: 5800, mp: 300, str: 96, def: 60, agi: 46, mag: 100, exp: 7000, gold: 3000,
    race: 'demon', size: 'xl', boss: true, turns: 2, speed: 0.82, drops: { boss: ['witch_ring'] },
    resist: { ...BOSS_STATUS, fire: 0, ice: 1.2, light: 1.25, dark: 0.5, sleep: 0, confuse: 0 },
    actions: [
      { w: 3, id: 'attack' }, { w: 2, id: 'm_flame_wing' }, { w: 2, id: 'm_crown_flare' }, { w: 1, id: 'm_dark_flame' },
      { w: 1, id: 'm_inferno_charge', cond: 'notRecent:m_inferno_charge' },
    ],
    phases: [
      { hpBelow: 0.5, msg: ['イグニア「この炎で…山ごと、もやしつくしてあげる！」'], buff: { atk: 1.15 }, addActions: [{ w: 1, id: 'm_inferno_charge', cond: 'notRecent:m_inferno_charge' }] },
      { hpBelow: 0.2, msg: ['イグニアの炎のつばさが、ゆらぎ始めた…！', '守りが弱くなった！'], debuff: { def: 0.75 } },
    ],
    desc: '炎と一つになった、イグニアの本当のすがた。炎のつばさを広げたら、すべてをやく大炎が来る。',
  },
};

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる）
export const CH3_MAT_DROPS = {
  snow_slime: ['ice_crystal', 6],
  frost_wolf: ['beast_fang', 4],
  snowman: ['white_snowball', 3],
  snow_wisp: ['ice_crystal', 4],
  ice_bat: ['beast_fang', 6],
  penguin_knight: ['iron_shard', 6],
  ice_golem: ['ice_crystal', 3],
  kiba_walrus: ['beast_fang', 4],
  mole_miner: ['iron_shard', 4],
  ore_slime: ['silver_shard', 4],
  minecart_ghost: ['iron_shard', 4],
  fire_imp: ['flame_stone', 5],
  lava_lizard: ['flame_stone', 4],
  fire_hound: ['flame_stone', 5],
  magma_slime: ['flame_stone', 3],
  ember_bird: ['wind_feather', 4],
  obsidian_knight: ['silver_shard', 4],
  dragon_statue: ['magic_powder', 4],
  star_wyvern: ['star_iron', 16],
  shadow_flame: ['magic_powder', 4],
  frost_drake: ['dragon_scale', 5],
  yeti: ['beast_fang', 3],
};
