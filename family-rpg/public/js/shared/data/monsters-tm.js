// 宝の洞窟の 主（ボス）（monsters.js で まぜる）
// つよさは レベル10の ときの もの。地図の レベルに あわせて つよくなる（data/treasure.js の scaleEnemy）
// art … 絵の もとに する 魔物 / artScale … 大きさ / tint … 色の かえかた（hue: 色あい 度・sat: あざやかさ・light: 明るさ）
// どの 主も 1ターンに 2回 行動し、大わざの 前に ためる（telegraph）

const BOSS_STATUS = { sleep: 0.1, poison: 0.3, confuse: 0.1, blind: 0.3, silence: 0.2, paralyze: 0.1 };

export const MONSTERS_TM = {
  tm_golem: {
    name: '黄金のゴーレム', lv: 10, hp: 1350, mp: 30, str: 46, def: 32, agi: 11, mag: 18, exp: 900, gold: 500,
    race: 'material', size: 'xl', boss: true, turns: 2, tmBoss: true,
    art: 'golem', artScale: 2.2, tint: { hue: 12, sat: 1.7, light: 1.12 },
    drops: { boss: ['tm_gold_bangle'] },
    resist: { ...BOSS_STATUS, fire: 0.7, ice: 0.8, blast: 1.4, bolt: 1.2, poison: 0, sleep: 0 },
    actions: [
      { w: 3, id: 'attack' }, { w: 2, id: 'm_rock_crush' }, { w: 2, id: 'm_stomp' }, { w: 1, id: 'm_inhale', cond: 'notRecent:m_inhale' },
    ],
    phases: [
      { hpBelow: 0.5, msg: ['黄金のゴーレムの体がまぶしく光った！'], summon: ['rockman'] },
      { hpBelow: 0.25, msg: ['黄金のゴーレムはいかりくるっている！', '攻撃力が上がった！'], buff: { atk: 1.2 }, addActions: [{ w: 2, id: 'm_inhale', cond: 'notRecent:m_inhale' }] },
    ],
    desc: '宝の洞窟のおくで、宝を守りつづける黄金のきょじん。息を吸いこんだら、岩なだれに気を付けよう。',
  },
  tm_king: {
    name: '宝石のキングぷるりん', lv: 10, hp: 1250, mp: 60, str: 42, def: 28, agi: 16, mag: 30, exp: 900, gold: 520,
    race: 'slime', size: 'xl', boss: true, turns: 2, tmBoss: true,
    art: 'king_pururin', artScale: 2.3, tint: { hue: -70, sat: 1.3, light: 1.05 },
    drops: { boss: ['tm_gem_ring'] },
    resist: { ...BOSS_STATUS, ice: 0.5, fire: 1.2, bolt: 1.3 },
    actions: [
      { w: 3, id: 'attack' }, { w: 2, id: 'm_king_press' }, { w: 2, id: 'hyado' }, { w: 1, id: 'm_whirl_charge', cond: 'notRecent:m_whirl_charge' },
    ],
    phases: [
      { hpBelow: 0.5, msg: ['宝石のキングぷるりんは仲間を呼んだ！'], summon: ['ice_pururin', 'ice_pururin'] },
      { hpBelow: 0.25, msg: ['宝石のキングぷるりんの体がかがやいた！', '攻撃力が上がった！'], buff: { atk: 1.2 }, addActions: [{ w: 2, id: 'm_whirl_charge', cond: 'notRecent:m_whirl_charge' }] },
    ],
    desc: '宝石をのみこんで大きくなったぷるりんの王さま。まわりの水がうずをまいたら、大うずしおが来る。',
  },
  tm_dragon: {
    name: '炎の竜ガルドラ', lv: 10, hp: 1300, mp: 40, str: 48, def: 26, agi: 18, mag: 28, exp: 950, gold: 500,
    race: 'dragon', size: 'xl', boss: true, turns: 2, tmBoss: true,
    art: 'chibi_dragon', artScale: 2.5, tint: { hue: -18, sat: 1.25, light: 0.82 },
    drops: { boss: ['tm_dragon_scale'] },
    resist: { ...BOSS_STATUS, fire: 0.3, ice: 1.4, wind: 0.9 },
    actions: [
      { w: 3, id: 'attack' }, { w: 2, id: 'm_fire_breath' }, { w: 2, id: 'm_stomp' }, { w: 1, id: 'm_inhale', cond: 'notRecent:m_inhale' },
    ],
    phases: [
      { hpBelow: 0.5, msg: ['ガルドラはほえ声で炎のせいれいを呼び出した！'], summon: ['lamp', 'lamp'] },
      { hpBelow: 0.25, msg: ['ガルドラはいかりくるっている！', '攻撃力が上がった！'], buff: { atk: 1.2 }, addActions: [{ w: 2, id: 'm_fire_breath' }] },
    ],
    desc: 'ようがんの洞窟にすむ竜。大きく息を吸いこむと、岩なだれをふらせてくる。',
  },
  tm_knight: {
    name: '闇の騎士ナイトメア', lv: 10, hp: 1200, mp: 40, str: 45, def: 30, agi: 18, mag: 22, exp: 950, gold: 520,
    race: 'demon', size: 'xl', boss: true, turns: 2, tmBoss: true,
    art: 'demon_knight', artScale: 2.3, tint: { hue: 75, sat: 1.35, light: 0.85 },
    drops: { boss: ['tm_dark_ring'] },
    resist: { ...BOSS_STATUS, dark: 0.5, light: 1.4, wind: 0.8 },
    actions: [
      { w: 3, id: 'attack' }, { w: 2, id: 'm_darkslash' }, { w: 1, id: 'm_warcry', cond: 'notRecent:m_warcry' }, { w: 1, id: 'm_tornado_charge', cond: 'notRecent:m_tornado_charge' },
    ],
    phases: [
      { hpBelow: 0.5, msg: ['ナイトメア「出よ、しもべたちよ！」'], summon: ['skeleton'] },
      { hpBelow: 0.25, msg: ['闇のよろいがくだけた！', 'ナイトメア「まだだ…まだ宝はわたさぬ！」'], debuff: { def: 0.8 }, buff: { atk: 1.2 }, addActions: [{ w: 2, id: 'm_darkslash' }] },
    ],
    desc: '宝の洞窟をさまよう、闇のよろいの騎士。マントがふくらんだら、大竜巻が来る。',
  },
  tm_serpent: {
    name: '氷の大へびフロスト', lv: 10, hp: 1200, mp: 50, str: 42, def: 26, agi: 19, mag: 26, exp: 950, gold: 500,
    race: 'dragon', size: 'xl', boss: true, turns: 2, tmBoss: true,
    art: 'sea_serpent', artScale: 2.0, tint: { hue: 25, sat: 0.55, light: 1.3 },
    drops: { boss: ['tm_ice_pendant'] },
    resist: { ...BOSS_STATUS, ice: 0.2, fire: 1.3, bolt: 1.3 },
    actions: [
      { w: 3, id: 'attack' }, { w: 2, id: 'm_coil' }, { w: 2, id: 'hyado' }, { w: 1, id: 'm_whirl_charge', cond: 'notRecent:m_whirl_charge' },
    ],
    phases: [
      { hpBelow: 0.5, msg: ['フロストのまわりに、氷のつぶがうずまいた！'], summon: ['marine_slime', 'marine_slime'] },
      { hpBelow: 0.25, msg: ['フロストはいかりくるっている！', '攻撃力が上がった！'], buff: { atk: 1.2 }, addActions: [{ w: 2, id: 'm_tidal' }] },
    ],
    desc: '氷の洞窟の水の中にひそむ大へび。水がうずをまいたら、大うずしおに気を付けよう。',
  },
  tm_panther: {
    name: '影のパンサー', lv: 10, hp: 1050, mp: 30, str: 42, def: 24, agi: 24, mag: 20, exp: 900, gold: 480,
    race: 'beast', size: 'xl', boss: true, turns: 2, tmBoss: true,
    art: 'star_panther', artScale: 2.1, tint: { hue: 55, sat: 1.1, light: 0.85 },
    drops: { boss: ['tm_shadow_anklet'] },
    resist: { ...BOSS_STATUS, dark: 0.6, light: 1.3, wind: 0.8 },
    actions: [
      { w: 3, id: 'attack' }, { w: 1, id: 'm_pounce' }, { w: 1, id: 'm_gust' }, { w: 1, id: 'm_tornado_charge', cond: 'notRecent:m_tornado_charge' },
    ],
    phases: [
      { hpBelow: 0.5, msg: ['影のパンサーが遠ぼえをした！'], summon: ['dark_bat', 'dark_bat'] },
      { hpBelow: 0.25, msg: ['影のパンサーの目があやしく光った！', '攻撃力が上がった！'], buff: { atk: 1.15 }, addActions: [{ w: 1, id: 'm_pounce' }] },
    ],
    desc: '暗やみにとけこむ、影のようなけもの。とても素早く、とびかかってくる。',
  },
};
