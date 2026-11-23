// 第3部 第3章 第3幕「はかりの回ろうと、ふたつの光」の 魔物・中ボス・幕の ボス（B: 戦い。docs/plan-part3-c11c.md の 19-4）
// monsters.js（MONSTERS）・loot.js（MAT_DROPS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/c11c-art.js。ボスの しかけは shared/battle-c11c.js（battle-c9b.js から よぶ）
//
// 出現表（encounters-c11c.js）: t11c_hall1（はかりの 回ろう 1階。Lv122）・t11c_hall2（2階。Lv122〜123）・t11c_hall3（3階。Lv123〜124）
// ふつうの 魔物 7しゅ（どれも 仲間に なる。region: 6。新しい 絵は 2つ ＋ 色ちがい 5つ）
//   トランプの へいたい 4しゅ（マークは 月・星・ほうき星・太陽。ハート などの マークは 使わない）… つきのトランプへい（新しい 絵）と その 色ちがい 3つ
//   てんびんどり（新しい 絵。光の はかりを せおった 鳥）・かいろうランプ（なふだランプの 色ちがい）・さくのひかりガ（こはくガの 色ちがい）
//
// ・中ボス「3人組の メカ 3号 バラバラン3号」（月の都の 名前の 塔の 前。Lv123）… 3つの 体（あたま・うで・あし ＝ 3体の 敵）
//   こわした 所の 技が 出なく なる（うで … 強い 1人攻撃〈前ぶれ〉・あし … 全体攻撃・あたま … こわれた 所を 直す〈3回の 番ごと〉）。あたまは かたい
//   前の 2つ（スイトール1号・ヒックリカエール2号）と ならぶ、まぬけで にくめない メカ（battle-c11c.js の mecha）
// ・幕の ボス「近衛の 隊長 エース」（大とびらの 前。Lv124）と トランプの へいたい 2体 … 先に 見える 3まいの カード（battle-c11c.js の ace）
//   カードの よろいの、きちんと した 隊長。もとは 本の お話の トランプの へいたい（もとの お話の 名前・言葉・ハート などの マークは 使わない。テストで 見る）
// ・ボスの え は 2倍の こまかさ（size は 2倍・artScale: 0.5）。勝っても 隊長は たおれない（カードに もどって ちらばる）

const BOSS_STATUS = { sleep: 0, poison: 0.3, confuse: 0, blind: 0.3, silence: 0.2, paralyze: 0 };
// ふつうの 魔物（仲間に なる 7しゅ）
export const C11C_HALL1_MON = ['c11c_tmoon', 'c11c_tstar', 'c11c_bird'];
export const C11C_HALL2_MON = ['c11c_tcomet', 'c11c_lamp'];
export const C11C_HALL3_MON = ['c11c_tsun', 'c11c_moth'];
export const C11C_MINIONS = [...C11C_HALL1_MON, ...C11C_HALL2_MON, ...C11C_HALL3_MON];
// トランプの へいたい（マークは 月・星・ほうき星・太陽）
export const C11C_CARD_MON = ['c11c_tmoon', 'c11c_tstar', 'c11c_tcomet', 'c11c_tsun'];
// 色ちがいの もと（今 いる 魔物の 絵か、この 幕の 新しい 絵）
export const C11C_RECOLOR_BASE = { c11c_tstar: 'c11c_tmoon', c11c_tcomet: 'c11c_tmoon', c11c_tsun: 'c11c_tmoon', c11c_lamp: 'c11b_lamp', c11c_moth: 'amber_moth' };
// 新しい 絵（ふつうの 魔物は 4しゅまで）
export const C11C_NEW_ART = ['c11c_tmoon', 'c11c_bird'];

// 中ボス（3つの 体）
export const C11C_HEAD = 'c11c_mhead';
export const C11C_ARM = 'c11c_marm';
export const C11C_LEG = 'c11c_mleg';
export const C11C_PARTS = [C11C_HEAD, C11C_ARM, C11C_LEG];
export const MECHA_NAME = 'バラバラン3号';
export const PART_NAME = { head: 'あたま', arm: 'うで', leg: 'あし' };
// 幕の ボスと へいたい
export const C11C_ACE = 'c11c_ace';
export const C11C_GUARD = 'c11c_guard';
export const ACE_NAME = '近衛の隊長エース';
export const ACE_SHORT = 'エース';
export const GUARD_NAME = 'トランプのへいたい';
export const C11C_BOSSES = [...C11C_PARTS, C11C_ACE, C11C_GUARD];

// 3つの 体の しかけ（battle-c11c.js の mecha）
//   role … あたま・うで・あし
//   head.hard … あたまの 受ける ダメージ（かたい）・fix … あたまが 直す までの あたまの 番の 数（その 1回 前に 前ぶれ）・fixHp … 直した 体の HP
//   arm.rocket … ロケットパンチの 前ぶれまでの うでの 番の 数・mult … ロケットパンチの 強さ・guardCut … 身を 守ると
//   few … 人数で 合わせる [1人, 2人, 3人, 4人, 5人]（hp・atk・fix）。bare … 仲間なしの 2人・3人。solo … 仲間なしの ひとり。monK … 魔物の 仲間 1体ごと
//   （設計に ない 足し物: autoFix … だれも えらんで いない〈完全オート・人が みんな たおれた〉時の 直すまでの 数。autoHard … その 時の あたまの かたさ〈hard に かける〉・
//     autoHeal … その 時 あたまが 番ごとに 自分を 直す わりあい）
const MECHA = {
  kind: 'mecha', hard: 0.5, autoHard: 0.5, autoHeal: 0.08, fix: 3, autoFix: 1, fixHp: 1,
  rocket: { every: 3, first: 2, mult: 2.4, guardCut: 0.35 },
  few: { hp: [0.8, 0.85, 0.9, 0.7, 0.85], atk: [0.75, 0.85, 0.9, 1.23, 1.25], fix: [3, 3, 3, 3, 3] },
  bare: { hp: [0.55, 0.75], atk: [0.7, 0.85] },
  solo: { hp: 0.43, atk: 0.49, spd: 0.7, fix: 5, rocketMult: 1.6 },
  monK: { hp: 0.1, atk: 0.02 },
};
const PART_RES = { ...BOSS_STATUS, fire: 1.0, ice: 1.0, wind: 1.0, bolt: 1.3, light: 1.0, dark: 1.0 };
const PART = { race: 'material', size: 'l', boss: true, turns: 1, hit: 'smash', artScale: 0.5, mp: 9999, def: 420, agi: 240, mag: 1100, gold: 4000 };

export const MONSTERS_C11C = {
  // ── はかりの 回ろう 1階（Lv122）──
  // つきのトランプへい: 月の マークの トランプの へいたい（新しい 絵）
  c11c_tmoon: {
    name: 'つきのトランプへい', lv: 122, hp: 3900, mp: 160, str: 600, def: 420, agi: 270, mag: 360, exp: 10000, gold: 3440,
    race: 'material', size: 'm', hit: 'slash', region: 6,
    resist: { fire: 1.35, ice: 1.0, wind: 1.1, bolt: 1.0, light: 0.9, dark: 0.9, poison: 0, sleep: 0.3, confuse: 0.4 }, drops: { common: ['moonherb', 10], rare: ['c7i_snow_mail', 80] },
    actions: [{ w: 3, id: 'm11c_tm_spear' }, { w: 2, id: 'm11c_tm_moon', cond: 'notRecent:m11c_tm_moon' }, { w: 1, id: 'attack' }],
    desc: 'はかりの回ろうを見まわる、月のマークのトランプのへいたい。紙なので、炎がよく効く。',
  },
  // ほしのトランプへい: 星の マーク（色ちがい）
  c11c_tstar: {
    name: 'ほしのトランプへい', lv: 122, hp: 3820, mp: 200, str: 580, def: 410, agi: 280, mag: 400, exp: 10020, gold: 3450,
    race: 'material', size: 'm', hit: 'slash', region: 6,
    resist: { fire: 1.35, ice: 1.0, wind: 1.0, bolt: 1.1, light: 0.8, dark: 1.0, poison: 0, sleep: 0.3, confuse: 0.4 }, drops: { common: ['star_sand', 12], rare: ['c7i_snow_helm', 80] },
    actions: [{ w: 3, id: 'm11c_ts_spear' }, { w: 2, id: 'm11c_ts_star', cond: 'notRecent:m11c_ts_star' }, { w: 1, id: 'attack' }],
    desc: '星のマークのトランプのへいたい。やりの先から、星をとばす。炎がよく効く。',
  },
  // てんびんどり: 光の はかりを せおった 鳥（新しい 絵）
  c11c_bird: {
    name: 'てんびんどり', lv: 122, hp: 3760, mp: 240, str: 560, def: 380, agi: 320, mag: 430, exp: 10040, gold: 3460,
    race: 'beast', size: 'm', flying: true, hit: 'claw', region: 6,
    resist: { fire: 1.0, ice: 1.0, wind: 0.7, bolt: 1.35, light: 1.0, dark: 1.0, poison: 0.5, sleep: 0.4, confuse: 0.4 }, drops: { common: ['magic_water', 12], rare: ['c7i_snow_staff', 80] },
    actions: [{ w: 3, id: 'm11c_bd_peck' }, { w: 2, id: 'm11c_bd_weigh', cond: 'notRecent:m11c_bd_weigh' }, { w: 1, id: 'attack' }],
    desc: '光のはかりを、せなかにせおった鳥。重い方の人を、くちばしでつつく。雷がよく効く。',
  },

  // ── はかりの 回ろう 2階（Lv122〜123）──
  // ほうきぼしのトランプへい: ほうき星の マーク（色ちがい）
  c11c_tcomet: {
    name: 'ほうきぼしのトランプへい', lv: 123, hp: 3960, mp: 160, str: 630, def: 420, agi: 300, mag: 340, exp: 10120, gold: 3480,
    race: 'material', size: 'm', hit: 'slash', region: 6,
    resist: { fire: 1.35, ice: 0.9, wind: 1.0, bolt: 1.0, light: 1.0, dark: 1.0, poison: 0, sleep: 0.3, confuse: 0.4 }, drops: { common: ['jou_herb', 10], rare: ['c7i_snow_dagger', 80] },
    actions: [{ w: 3, id: 'm11c_tc_dash' }, { w: 1, id: 'm11c_tc_tail', cond: 'notRecent:m11c_tc_tail' }, { w: 2, id: 'attack' }],
    desc: 'ほうき星のマークのトランプのへいたい。長いしっぽを引いて、ものすごい速さでつっこんでくる。炎がよく効く。',
  },
  // かいろうランプ: なふだランプの 色ちがい（青白い 光）
  c11c_lamp: {
    name: 'かいろうランプ', lv: 123, hp: 3720, mp: 260, str: 530, def: 400, agi: 260, mag: 440, exp: 10140, gold: 3490,
    race: 'material', size: 's', flying: true, hit: 'magic', region: 6,
    resist: { fire: 0.5, ice: 1.35, wind: 1.0, bolt: 1.0, light: 0.6, dark: 1.2, poison: 0, sleep: 0.4, confuse: 0.4 }, drops: { common: ['magic_powder', 12], rare: ['c7i_snow_gi', 80] },
    actions: [{ w: 3, id: 'm11c_lp_beam' }, { w: 2, id: 'm11c_lp_fence', cond: 'notRecent:m11c_lp_fence' }, { w: 1, id: 'attack' }],
    desc: '回ろうのかべにともる、青白いランプ。光のさくを、ぱっと作る。氷がよく効く。',
  },

  // ── はかりの 回ろう 3階（Lv123〜124）──
  // たいようのトランプへい: 太陽の マーク（色ちがい）
  c11c_tsun: {
    name: 'たいようのトランプへい', lv: 123, hp: 4100, mp: 200, str: 620, def: 460, agi: 240, mag: 380, exp: 10180, gold: 3500,
    race: 'material', size: 'm', hit: 'slash', region: 6,
    resist: { fire: 1.1, ice: 1.3, wind: 1.0, bolt: 1.0, light: 0.6, dark: 1.1, poison: 0, sleep: 0.3, confuse: 0.4 }, drops: { common: ['silver_shard', 12], rare: ['c7i_snow_robe', 80] },
    actions: [{ w: 3, id: 'm11c_tu_spear' }, { w: 1, id: 'm11c_tu_sun', cond: 'notRecent:m11c_tu_sun' }, { w: 2, id: 'attack' }],
    desc: '太陽のマークのトランプのへいたい。お日さまの光で、仲間の傷をなおす。氷がよく効く。',
  },
  // さくのひかりガ: こはくガの 色ちがい（光の さくの 色）
  c11c_moth: {
    name: 'さくのひかりガ', lv: 124, hp: 3800, mp: 220, str: 570, def: 390, agi: 300, mag: 420, exp: 10260, gold: 3520,
    race: 'beast', size: 'm', flying: true, hit: 'magic', region: 6,
    resist: { fire: 1.35, ice: 0.9, wind: 1.1, bolt: 1.0, light: 0.7, dark: 1.0, poison: 0.5, sleep: 0.3, confuse: 0.4 }, drops: { common: ['moonherb', 10], rare: ['c7i_snow_boomerang', 80] },
    actions: [{ w: 3, id: 'm11c_mt_dust' }, { w: 2, id: 'm11c_mt_flit', cond: 'notRecent:m11c_mt_flit' }, { w: 1, id: 'attack' }],
    desc: '光のさくのまわりを、ひらひらとぶガ。はねのこなが、ちくちくする。炎がよく効く。',
  },

  // ── 中ボス: 3人組の メカ 3号 バラバラン3号（3つの 体。Lv123）──
  // c11c … しかけ（battle-c11c.js の mecha）。あたま … かたい・こわれた 所を 直す ／ うで … 強い 1人攻撃（前ぶれ）／ あし … 全体攻撃
  [C11C_HEAD]: {
    ...PART, name: 'バラバランのあたま', lv: 123, hp: 5200, str: 2000, exp: 12000, speed: 0.62,
    drops: { boss: ['c11cb_gear_badge'], bonus: ['limit_stone'] }, resist: PART_RES,
    c11c: { ...MECHA, role: 'head' },
    actions: [{ w: 3, id: 'm11h_beam' }, { w: 1, id: 'm11h_horn', cond: 'notRecent:m11h_horn' }],
    desc: 'バラバラン3号のあたま。とてもかたい。こわれた体を、ねじでなおしてしまう。',
  },
  [C11C_ARM]: {
    ...PART, name: 'バラバランのうで', lv: 123, hp: 4300, str: 2350, exp: 12000, speed: 0.66,
    drops: { boss: ['c11cb_gear_badge'] }, resist: PART_RES,
    c11c: { ...MECHA, role: 'arm' },
    actions: [{ w: 3, id: 'm11r_punch' }, { w: 1, id: 'm11r_grab', cond: 'notRecent:m11r_grab' }],
    desc: 'バラバラン3号のうで。ぐるぐる回ったあと、ロケットパンチがとんでくる。',
  },
  [C11C_LEG]: {
    ...PART, name: 'バラバランのあし', lv: 123, hp: 4300, str: 2200, exp: 12000, speed: 0.6,
    drops: { boss: ['c11cb_gear_badge'] }, resist: PART_RES,
    c11c: { ...MECHA, role: 'leg' },
    actions: [{ w: 3, id: 'm11l_stomp' }, { w: 1, id: 'm11l_kick' }],
    desc: 'バラバラン3号のあし。じだんだをふんで、みんなをゆらす。',
  },

  // ── 幕の ボス: 近衛の 隊長 エース（大とびらの 前。Lv124）──
  // c11c … しかけ（battle-c11c.js の ace）
  //   cards … ならべる カードの 数（へいたいが いる 間は ＋1）
  //   comet … ほうき星の カード（1人に とても 大きな ダメージ。mult・身を 守ると guardCut）
  //   star … 星の カード（全体の ダメージ。base・身を 守ると guardCut）
  //   moon … 月の カード（全体の 小さな ダメージ ＋ 身を 守って いない 人は ねむる turns 回の 番。ひとりの 時は ねむらず 動きが おそく なる）
  //   sun … 太陽の カード（隊長と へいたいが 回復 … 隊長は 最大HPの heal・へいたいは ぜんぶ）
  //   two … HPが 半分を 切ると、ほうき星の カードが 2まい まざる わりあい
  //   back … たおした へいたいが もどるまでの 隊長の 番の 数・aoeK … へいたいが 全体の 技で 受ける ダメージ・aoeBoss … 隊長が 全体の 技で 受ける ダメージ
  //   few … 人数で 合わせる [1人, 2人, 3人, 4人, 5人]（hp・atk・cards・back）。bare … 仲間なしの 2人・3人。solo … ひとり（カード 2まい・へいたい 1体）。monK … 魔物の 仲間 1体ごと
  //   （設計に ない 足し物: autoK … だれも えらんで いない 時の 隊長の 受ける ダメージ）
  [C11C_ACE]: {
    name: ACE_NAME, short: ACE_SHORT, lv: 124, hp: 12000, mp: 9999, str: 2450, def: 440, agi: 260, mag: 1200, exp: 108000, gold: 37000,
    race: 'human', size: 'xl', boss: true, turns: 1, speed: 1.0, hit: 'slash', artScale: 0.5,
    drops: { boss: ['c11cb_ace_cape'], bonus: ['limit_stone'] },
    resist: { ...BOSS_STATUS, fire: 1.1, ice: 1.0, wind: 1.0, bolt: 1.0, light: 0.8, dark: 1.0 },
    c11c: {
      kind: 'ace', cards: 3,
      comet: { mult: 2.6, guardCut: 0.35 },
      star: { base: [760, 800], guardCut: 0.5 },
      moon: { base: [260, 300], turns: 2, slow: 0.5 },
      sun: { heal: 0.08 },
      two: 0.5, back: 5, aoeK: 0.3, aoeBoss: 0.6, autoK: 0.5,
      few: { hp: [0.8, 0.95, 0.95, 1, 1.2], atk: [0.75, 0.9, 0.95, 1, 1.05], back: [5, 5, 5, 5, 4] },
      bare: { hp: [0.5, 0.7], atk: [0.6, 0.75] },
      solo: { hp: 0.6, atk: 0.5, cards: 2, guards: 1, back: 8 },
      monK: { hp: 0.1, atk: 0 },
    },
    actions: [{ w: 1, id: 'm11a_lay' }],
    desc: '王宮の大とびらを守る、近衛の隊長。これから使うわざのカードを、先にならべる。',
  },
  // トランプの へいたい（隊長の まわりに 2体。たおしても しばらくすると もどる）
  [C11C_GUARD]: {
    name: GUARD_NAME, lv: 124, hp: 1500, mp: 9999, str: 2600, def: 400, agi: 270, mag: 900, exp: 8200, gold: 2100, speed: 0.9,
    race: 'material', size: 'm', boss: true, turns: 1, hit: 'slash', artScale: 0.5, region: 6,
    // 隊長と おなじ ボスの 品（1人 1つ … 2つめからは 落ちない）
    drops: { boss: ['c11cb_ace_cape'] },
    resist: { ...BOSS_STATUS, fire: 1.3, ice: 1.0, wind: 1.0, bolt: 1.0, light: 1.0, dark: 1.0 },
    c11c: { kind: 'guard' },
    actions: [{ w: 3, id: 'm11g_spear' }, { w: 1, id: 'm11g_salute', cond: 'notRecent:m11g_salute' }],
    desc: '隊長のまわりをかためる、トランプのへいたい。へいたいがいる間、隊長はカードを1まい多くならべる。',
  },
};

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる。今の 素材だけ）
export const C11C_MAT_DROPS = {
  c11c_tmoon: ['magic_powder', 3],
  c11c_tstar: ['star_sand', 3],
  c11c_bird: ['cloud_cotton', 3],
  c11c_tcomet: ['star_sand', 4],
  c11c_lamp: ['magic_powder', 4],
  c11c_tsun: ['silver_shard', 3],
  c11c_moth: ['cloud_cotton', 3],
};
