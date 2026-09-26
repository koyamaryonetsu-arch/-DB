// 第2章「海をわたる風」の モンスター（monsters.js で まぜる）
// sea=風の海 isle=島 storm=嵐の島の まわり seacave=海鳴りの洞窟 tower=嵐の塔

export const MONSTERS_CH2 = {
  // ── 海 ──
  marine_slime: {
    name: 'マリンぷるりん', lv: 11, hp: 58, mp: 24, str: 40, def: 30, agi: 20, mag: 26, exp: 34, gold: 22,
    race: 'slime', size: 's', resist: { ice: 0.5, bolt: 1.4 }, drops: [{ item: 'herb', rate: 0.2 }, { item: 'seed_def', rate: 0.01 }],
    actions: [{ w: 4, id: 'attack' }, { w: 2, id: 'm_splash' }, { w: 1, id: 'hoimi', cond: 'allyHurt' }],
    desc: '海でくらす、すきとおったぷるりん。水てっぽうをとばしてくる。',
  },
  wild_gull: {
    name: 'あばれカモメ', lv: 12, hp: 52, str: 46, def: 22, agi: 38, exp: 36, gold: 20,
    race: 'beast', size: 's', flying: true, resist: { wind: 0.6 }, drops: [{ item: 'return_wing', rate: 0.05 }],
    actions: [{ w: 4, id: 'attack' }, { w: 3, id: 'm_dive' }, { w: 1, id: 'm_gust' }],
    desc: '船の上をとびまわる、らんぼうなカモメ。空から急降下してくる。',
  },
  shell_knight: {
    name: 'シェルナイト', lv: 13, hp: 70, str: 52, def: 58, agi: 12, exp: 42, gold: 30,
    race: 'beast', size: 'm', resist: { fire: 1.3, ice: 0.7 }, drops: [{ item: 'shell_shield', rate: 0.03 }],
    actions: [{ w: 4, id: 'attack' }, { w: 2, id: 'm_pinch' }, { w: 1, id: 'm_shell_guard', cond: 'notRecent:m_shell_guard' }],
    desc: '大きな貝がらをよろいにした、ヤドカリの騎士。とてもかたい。',
  },
  sea_serpent: {
    name: '海へび', lv: 14, hp: 90, mp: 20, str: 58, def: 34, agi: 30, mag: 24, exp: 50, gold: 34,
    race: 'dragon', size: 'l', resist: { ice: 0.6, bolt: 1.3 }, drops: [{ item: 'seed_hp', rate: 0.02 }],
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_coil' }, { w: 1, id: 'm_tidal' }],
    desc: '波の間から顔を出す、長い長い海のへび。まきついて動けなくする。',
  },
  // ── 島 ──
  wind_imp: {
    name: '風こぞう', lv: 12, hp: 48, mp: 40, str: 34, def: 24, agi: 40, mag: 34, exp: 38, gold: 26,
    race: 'spirit', size: 's', resist: { wind: 0.3, fire: 1.2 }, drops: [{ item: 'magic_water', rate: 0.03 }],
    actions: [{ w: 3, id: 'bagi' }, { w: 2, id: 'attack' }, { w: 1, id: 'm_dance' }],
    desc: 'いたずら好きな風のこぞう。つむじ風をおこしてよろこぶ。',
  },
  coconut: {
    name: 'ココナッツン', lv: 12, hp: 66, str: 48, def: 32, agi: 16, exp: 36, gold: 22,
    race: 'plant', size: 'm', resist: { fire: 1.4, wind: 0.8 }, drops: [{ item: 'herb', rate: 0.25 }, { item: 'seed_hp', rate: 0.01 }],
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_coconut' }, { w: 1, id: 'm_sleep_powder' }],
    desc: 'ヤシの木に化けた魔物。頭の実をなげつけてくる。',
  },
  ghost_pirate: {
    name: 'ゆうれい海賊', lv: 14, hp: 72, mp: 20, str: 56, def: 30, agi: 28, mag: 20, exp: 48, gold: 60,
    race: 'undead', size: 'm', resist: { light: 1.5, dark: 0.5, poison: 0 }, drops: [{ item: 'silver_dagger', rate: 0.02 }],
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_cursed_blade' }, { w: 1, id: 'm_ghost_laugh' }],
    desc: '海にしずんだ海賊のゆうれい。今も宝を探して島をさまよう。',
  },
  // ── 嵐の島の まわり ──
  thunder_imp: {
    name: '雷こぞう', lv: 15, hp: 60, mp: 50, str: 40, def: 28, agi: 42, mag: 44, exp: 55, gold: 34,
    race: 'spirit', size: 's', resist: { bolt: 0.2, ice: 1.3 }, drops: [{ item: 'magic_water', rate: 0.04 }],
    actions: [{ w: 3, id: 'm_thunder' }, { w: 2, id: 'attack' }, { w: 1, id: 'm_gust' }],
    desc: '嵐の雲から生まれた雷のこぞう。雷を落としてくる。',
  },
  storm_bird: {
    name: 'ストームバード', lv: 16, hp: 88, str: 62, def: 34, agi: 50, exp: 62, gold: 36,
    race: 'beast', size: 'm', flying: true, resist: { wind: 0.3, bolt: 0.8 }, drops: [{ item: 'seed_agi', rate: 0.02 }],
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_dive' }, { w: 2, id: 'm_storm_wing' }],
    desc: '嵐の中を平気でとぶ大きな鳥。つばさで風のやいばをおこす。',
  },
  // ── 海鳴りの洞窟 ──
  coral_golem: {
    name: 'サンゴゴーレム', lv: 15, hp: 120, str: 64, def: 60, agi: 10, exp: 60, gold: 40,
    race: 'material', size: 'l', resist: { fire: 0.7, bolt: 1.4, sleep: 0, poison: 0 }, drops: [{ item: 'seed_def', rate: 0.02 }],
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm_coral_punch' }, { w: 1, id: 'm_harden', cond: 'notRecent:m_harden' }],
    desc: 'サンゴが集まって動き出した。たたくとかたいが、雷に弱い。',
  },
  // ── 嵐の塔 ──
  storm_soldier: {
    name: '嵐の兵', lv: 16, hp: 96, str: 66, def: 46, agi: 30, exp: 64, gold: 40,
    race: 'demon', size: 'm', resist: { wind: 0.5, bolt: 0.8 }, drops: [{ item: 'moonherb', rate: 0.05 }],
    actions: [{ w: 4, id: 'attack' }, { w: 2, id: 'm_wind_slash' }, { w: 1, id: 'm_harden', cond: 'notRecent:m_harden' }],
    desc: '嵐の将軍に仕える兵士。風のマントで身を守る。',
  },

  // ── ボス ──
  giant_squid: {
    name: '大王イカ', lv: 15, hp: 2400, str: 74, def: 36, agi: 20, mag: 30, exp: 1600, gold: 700,
    race: 'beast', size: 'xl', boss: true, turns: 2,
    resist: { fire: 1.2, ice: 0.6, wind: 1.0, blast: 1.0, bolt: 1.5, sleep: 0.1, poison: 0.3, confuse: 0.1, blind: 0.2, silence: 0, paralyze: 0.1 },
    actions: [
      { w: 3, id: 'attack' }, { w: 3, id: 'm_tentacle' }, { w: 2, id: 'm_ink' }, { w: 2, id: 'm_squeeze' },
      { w: 1, id: 'm_whirl_charge', cond: 'notRecent:m_whirl_charge' },
    ],
    phases: [
      { hpBelow: 0.5, msg: ['大王イカはすみを大量にはいた！', 'あたりがまっ暗になっていく…'], addActions: [{ w: 2, id: 'm_ink' }] },
      { hpBelow: 0.25, msg: ['大王イカはいかりくるっている！', '攻撃力が上がった！'], buff: { atk: 1.25 }, addActions: [{ w: 2, id: 'm_whirl_charge', cond: 'notRecent:m_whirl_charge' }] },
    ],
    desc: '海鳴りの洞窟の主。嵐の将軍にあやつられ、灯台の光の玉をうばった。',
  },
  storm_general: {
    name: '嵐の将軍ストルム', lv: 20, hp: 3200, str: 78, def: 48, agi: 34, mag: 50, exp: 3600, gold: 1500,
    race: 'demon', size: 'xl', boss: true, turns: 2,
    resist: { fire: 1.0, ice: 1.0, wind: 0.3, blast: 1.0, bolt: 0.6, light: 1.3, dark: 0.8, sleep: 0, poison: 0.2, confuse: 0.1, blind: 0.3, silence: 0.3, paralyze: 0 },
    actions: [
      { w: 3, id: 'attack' }, { w: 3, id: 'm_storm_blade' }, { w: 2, id: 'm_thunder_call' }, { w: 1, id: 'm_warcry', cond: 'notRecent:m_warcry' },
      { w: 1, id: 'm_tornado_charge', cond: 'notRecent:m_tornado_charge' },
    ],
    phases: [
      { hpBelow: 0.6, msg: ['ストルム「出よ、嵐の兵たちよ！」'], summon: ['storm_soldier', 'storm_soldier'] },
      { hpBelow: 0.3, msg: ['嵐のよろいがくだけた！', 'ストルム「まだだ…嵐はここからだ！」'], debuff: { def: 0.75 }, buff: { atk: 1.2 }, addActions: [{ w: 2, id: 'm_tornado_charge', cond: 'notRecent:m_tornado_charge' }] },
    ],
    desc: '四ツ影の1人。嵐をあやつり、風の守り星の力で海をとざしていた。',
  },
};
