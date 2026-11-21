// 第3部 第2章 第2幕「青と白」の 魔物・中ボス 2人（B: 戦い。docs/plan-part3-c10b.md の 14-3）
// monsters.js（MONSTERS）・loot.js（MAT_DROPS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/c10b-art.js。中ボスの しかけは shared/battle-c10b.js（battle-c9b.js から よぶ）
//
// 出現表（encounters-c10b.js）: t10b_blue_wet（水の 高さ「上」… 水の 魔物が 多い）・t10b_blue_dry（「下」… 砂の 魔物が 多い）。Lv109〜110
// 白の 道は ふつうの 魔物が 出ない（こっそりの じゃまを しない）。見はりに 見つかった 時だけ 決まった 戦い c10b_watch1〜3（Lv111〜112。にげられる）
// ふつうの 魔物 7しゅ（どれも 仲間に なる。region: 6。新しい 絵は 合わせて 2つ）
//   青 … みかがみの精（水の精の 色ちがい）・うら砂ガニ（砂ガニの 色ちがい）・しずくウオ（新しい 絵）・すなぼうず（新しい 絵）
//   白 … つららフクロウ（星読みフクロウの 色ちがい）・ゆきあかりオオカミ（こおりオオカミの 色ちがい）・氷のよろい（古城のよろいの 色ちがい）
//
// ・青の 中ボス「サー・ゲッコー」（c10b_gecko。Lv111）… battle-c10b.js の しくみ「水を たもつ」
// ・白の 中ボス「かいとう シロフクロウ」（c10b_owl。Lv113）と まぼろし（c10b_owl_fake）… しくみ「本物を 見きわめる」
// ・中ボスの え は 2倍の こまかさ（size は 2倍・artScale: 0.5）。勝つと 2人とも たおれない（え の コマ 2・3 … しょんぼり・おじぎ）
// ・もとの 作品の 絵・名前・せりふ・決まり文句は 使わない（砂色の 長い コートの トカゲの しんし・砂時計の かたちの ステッキ ／
//   白い 羽の マント・フクロウの 仮面・羽かざりの ぼうし）

const BOSS_STATUS = { sleep: 0, poison: 0.3, confuse: 0, blind: 0.3, silence: 0.2, paralyze: 0 };
export const C10B_GECKO = 'c10b_gecko';
export const C10B_OWL = 'c10b_owl';
export const C10B_OWL_FAKE = 'c10b_owl_fake';
export const C10B_BOSSES = [C10B_GECKO, C10B_OWL];
export const GECKO_NAME = 'サー・ゲッコー';
export const OWL_NAME = 'かいとうシロフクロウ';
// ふつうの 魔物（仲間に なる 7しゅ）
export const C10B_BLUE_MON = ['c10b_spirit', 'c10b_crab', 'c10b_fish', 'c10b_sand'];
export const C10B_WHITE_MON = ['c10b_iceowl', 'c10b_wolf', 'c10b_armor'];
export const C10B_MINIONS = [...C10B_BLUE_MON, ...C10B_WHITE_MON];
// 色ちがいの もと（今 いる 魔物の 絵）
export const C10B_RECOLOR_BASE = { c10b_spirit: 'water_spirit', c10b_crab: 'sand_crab', c10b_iceowl: 'star_owl', c10b_wolf: 'frost_wolf', c10b_armor: 'castle_armor' };
// 新しい 絵（合わせて 4しゅまで）
export const C10B_NEW_ART = ['c10b_fish', 'c10b_sand'];

// 白の 中ボスの え と しかけ（本物と まぼろしで おなじ）
const OWL_BASE = {
  name: OWL_NAME, short: 'シロフクロウ', lv: 113, mp: 9999, def: 380, agi: 260, mag: 1100,
  race: 'beast', size: 'xl', boss: true, turns: 1, speed: 1.6, hit: 'slash', artScale: 0.5, flying: true,
  resist: { ...BOSS_STATUS, poison: 0, fire: 1.1, ice: 1.0, wind: 0.8, bolt: 1.0, light: 1.0, dark: 1.0 },
  actions: [{ w: 3, id: 'm10o_feather' }, { w: 2, id: 'm10o_wing', cond: 'notRecent:m10o_wing' }, { w: 2, id: 'm10o_moon' }],
  desc: '白い羽のマントに、フクロウの仮面。羽かざりのぼうしの、かいとう。いつも3人いて、本物は1人だけ。',
};

export const MONSTERS_C10B = {
  // ── 青: 水鏡の うら（Lv109〜110）──
  // みかがみの精: 第4章の 水の精の 色ちがい（青白い 体・うらがえしの 水鏡の 光）
  c10b_spirit: {
    name: 'みかがみの精', lv: 109, hp: 1600, mp: 240, str: 410, def: 360, agi: 240, mag: 360, exp: 7600, gold: 2600,
    race: 'spirit', size: 'm', flying: true, hit: 'magic', region: 6,
    resist: { fire: 0.5, ice: 0.6, wind: 1.0, bolt: 1.4, light: 1.0, dark: 1.0, poison: 0, sleep: 0.5, confuse: 0.6 }, drops: { common: ['magic_water', 14], rare: ['c7i_snow_staff', 80] },
    actions: [{ w: 3, id: 'm10b_sp_shot' }, { w: 2, id: 'm10b_sp_rain', cond: 'notRecent:m10b_sp_rain' }, { w: 2, id: 'behoimi', cond: 'allyHurt' }, { w: 1, id: 'attack' }],
    desc: '水鏡のうらに住む、水の精。うらがえしの水の中を、さかさまにおよぐ。雷がよく効く。',
  },
  // うら砂ガニ: 第4章の 砂ガニの 色ちがい（こい 青の こうら・白い はさみ）
  c10b_crab: {
    name: 'うら砂ガニ', lv: 109, hp: 1720, mp: 80, str: 470, def: 470, agi: 170, mag: 180, exp: 7660, gold: 2620,
    race: 'beast', size: 'm', hit: 'slash', region: 6,
    resist: { fire: 0.8, ice: 1.2, wind: 1.0, bolt: 1.35, light: 1.0, dark: 1.0, poison: 0.5, sleep: 0.4, confuse: 0.5 }, drops: { common: ['antidote', 14], rare: ['c7i_snow_shield', 80] },
    actions: [{ w: 3, id: 'm10b_cr_pinch' }, { w: 2, id: 'm10b_cr_sand', cond: 'notRecent:m10b_cr_sand' }, { w: 1, id: 'm10b_cr_guard', cond: 'notRecent:m10b_cr_guard' }, { w: 1, id: 'attack' }],
    desc: '水のぬけた砂の上を、横歩きするカニ。こい青のこうらは、とてもかたい。雷と氷がよく効く。',
  },
  // しずくウオ: 大きな 水の しずくの 中を およぐ 魚（新しい 絵）
  c10b_fish: {
    name: 'しずくウオ', lv: 110, hp: 1660, mp: 200, str: 440, def: 380, agi: 260, mag: 330, exp: 7720, gold: 2640,
    race: 'beast', size: 'm', flying: true, hit: 'bite', region: 6,
    resist: { fire: 0.7, ice: 0.9, wind: 1.1, bolt: 1.4, light: 1.0, dark: 1.0, poison: 0.4, sleep: 0.4, confuse: 0.4 }, drops: { common: ['jou_herb', 10], rare: ['c7i_snow_spear', 80] },
    actions: [{ w: 3, id: 'm10b_fs_bite' }, { w: 2, id: 'm10b_fs_jet', cond: 'notRecent:m10b_fs_jet' }, { w: 1, id: 'm10b_fs_bubble', cond: 'notRecent:m10b_fs_bubble' }, { w: 1, id: 'attack' }],
    desc: '大きな水のしずくの中を、くるくるおよぐ魚。しずくごと、空中にうかんでいる。雷がよく効く。',
  },
  // すなぼうず: 水が ぬけた 所に できる 砂の 山の 魔物（新しい 絵）
  c10b_sand: {
    name: 'すなぼうず', lv: 110, hp: 1760, mp: 160, str: 460, def: 420, agi: 190, mag: 280, exp: 7760, gold: 2660,
    race: 'material', size: 'm', hit: 'smash', region: 6,
    resist: { fire: 1.0, ice: 1.2, wind: 0.8, bolt: 0.9, light: 1.0, dark: 1.0, poison: 0, sleep: 0.3, confuse: 0.3 }, drops: { common: ['toku_herb', 10], rare: ['c7i_snow_axe', 80] },
    actions: [{ w: 3, id: 'm10b_sd_punch' }, { w: 2, id: 'm10b_sd_storm', cond: 'notRecent:m10b_sd_storm' }, { w: 1, id: 'm10b_sd_sink', cond: 'notRecent:m10b_sd_sink' }, { w: 1, id: 'attack' }],
    desc: '水がすっかりぬけた所に、もこもこ生まれる砂の山。かわいた砂を、まきちらす。水と氷がよく効く。',
  },

  // ── 白: 見はりの 魔物（見つかった 時だけ。Lv111〜112。ふつうより 強め・にげられる）──
  // つららフクロウ: 星読みフクロウの 色ちがい（白と 水色の 羽・つららの つめ）
  c10b_iceowl: {
    name: 'つららフクロウ', lv: 111, hp: 1620, mp: 200, str: 470, def: 390, agi: 300, mag: 360, exp: 8200, gold: 2800,
    race: 'beast', size: 'm', flying: true, hit: 'slash', region: 6,
    resist: { fire: 1.35, ice: 0.3, wind: 0.6, bolt: 1.0, light: 1.0, dark: 0.8, poison: 0.5, sleep: 0.3, confuse: 0.3 }, drops: { common: ['moon_drop', 14], rare: ['c7i_snow_fan', 80] },
    actions: [{ w: 3, id: 'm10b_ow_claw' }, { w: 2, id: 'm10b_ow_blow', cond: 'notRecent:m10b_ow_blow' }, { w: 1, id: 'm10b_ow_glare', cond: 'notRecent:m10b_ow_glare' }, { w: 1, id: 'attack' }],
    desc: '氷の柱にとまって、氷の下の道を見はるフクロウ。目が合うと、仲間をよぶ。炎がよく効く。',
  },
  // ゆきあかりオオカミ: こおりオオカミの 色ちがい（月の 光の 白い 毛）
  c10b_wolf: {
    name: 'ゆきあかりオオカミ', lv: 111, hp: 1760, mp: 120, str: 500, def: 400, agi: 290, mag: 220, exp: 8260, gold: 2820,
    race: 'beast', size: 'm', hit: 'bite', region: 6,
    resist: { fire: 1.35, ice: 0.3, wind: 1.0, bolt: 1.0, light: 1.0, dark: 1.0, poison: 0.4, sleep: 0.4, confuse: 0.4 }, drops: { common: ['jou_herb', 10], rare: ['c7i_snow_gi', 80] },
    actions: [{ w: 3, id: 'm10b_wf_fang' }, { w: 2, id: 'm10b_wf_howl', cond: 'notRecent:m10b_wf_howl' }, { w: 1, id: 'm10b_wf_breath', cond: 'notRecent:m10b_wf_breath' }, { w: 1, id: 'attack' }],
    desc: '月あかりの白い毛の、大きなオオカミ。雪の上でも、足音をたてない。炎がよく効く。',
  },
  // 氷のよろい: 古城のよろいの 色ちがい（すきとおった 氷の よろい）
  c10b_armor: {
    name: '氷のよろい', lv: 112, hp: 1900, mp: 60, str: 520, def: 500, agi: 170, mag: 200, exp: 8380, gold: 2860,
    race: 'material', size: 'm', hit: 'slash', region: 6,
    resist: { fire: 1.3, ice: 0.3, wind: 1.0, bolt: 1.3, blast: 1.25, light: 1.0, dark: 1.0, poison: 0, sleep: 0, confuse: 0.3, blind: 0.5 }, drops: { common: ['silver_shard', 12], rare: ['c7i_snow_mail', 80] },
    actions: [{ w: 3, id: 'm10b_ar_slash' }, { w: 2, id: 'm10b_ar_sweep', cond: 'notRecent:m10b_ar_sweep' }, { w: 1, id: 'm10b_ar_guard', cond: 'notRecent:m10b_ar_guard' }, { w: 1, id: 'attack' }],
    desc: '氷の下の道を守る、すきとおったよろい。中は、からっぽ。炎と雷がよく効く。',
  },

  // ── 青の 中ボス: サー・ゲッコー（かれた 間。Lv111）──
  // c10b … しかけ（battle-c10b.js の gecko）
  //   water … 広間の 水の めもり（start … はじめ・max … さい大・ring … 水の音を鳴らすと ふえる 数・elem … 水や 氷の 技を 当てると ふえる 数）
  //   dry … かわき（every 回 動く うち、skip 回めは へらない ＝ 3回に 2回 1つ へる）
  //   sand … めもり 0 の「砂の体」で 受ける ダメージの ばい・storm … 砂あらし（めもり 0 の 間 毎回。全体の 物理の 強さ mult）
  //   wet … めもり 2 いじょうの「ぬれた」で 受ける ダメージの ばい・bolt … ぬれた 時の 雷の さらに かける ばい
  //   big … 大かんそう（めもり 3。前ぶれ → 次の 番。mult・guardCut … 身を 守ると）
  [C10B_GECKO]: {
    name: GECKO_NAME, short: 'ゲッコー', lv: 111, hp: 50000, mp: 9999, str: 5200, def: 380, agi: 240, mag: 1100, exp: 82000, gold: 28000,
    race: 'dragon', size: 'xl', boss: true, turns: 1, speed: 0.9, hit: 'smash', artScale: 0.5,
    drops: { boss: ['c10bb_hourglass'], bonus: ['limit_stone'] },
    resist: { ...BOSS_STATUS, fire: 1.0, ice: 1.0, water: 1, wind: 1.0, bolt: 1.2, light: 1.0, dark: 1.0 },
    c10b: {
      kind: 'gecko',
      water: { start: 2, max: 3, ring: 2, elem: 1 },
      dry: { every: 3, skip: 3 },
      sand: 0.1,
      storm: { mult: 0.35 },
      wet: 1.3, bolt: 1.3,
      big: { mult: 2.3, guardCut: 0.35 },
      // 人数（家族の キャラの 数）で 合わせる [1人, 2人, 3人, 4人, 5人]: hp・atk … HP・攻撃力の ばい・bigK … 大かんそうの 強さ・spd … はやさ
      //   solo … 仲間なしの ひとり（sand … 砂の体が もっと かたい）。monK … 魔物の 仲間 1体ごとの HP・攻撃
      //   atk は 与える ダメージ（物理も 呪文も。battle-c10b.js の scale … dmgRate）。tools/sim-ch10.mjs で 合わせた（docs/plan-part3-c10b.md の 実装メモ）
      few: { hp: [0.55, 0.75, 1, 1, 1.1], atk: [0.62, 0.62, 1, 1, 1.3], bigK: [0.35, 0.4, 1, 1, 1], spd: [1, 1, 1, 1, 1] },
      solo: { hp: 0.12, atk: 0.25, bigK: 0.4, sand: 0.02 },
      monK: { hp: -0.15, atk: 0.17 },
    },
    actions: [{ w: 3, id: 'm10x_cane' }, { w: 2, id: 'm10x_sand', cond: 'notRecent:m10x_sand' }, { w: 2, id: 'm10x_tail' }],
    desc: '砂色の長いコートを着た、トカゲのしんし。砂時計の形のステッキ。体から、さらさら砂がこぼれる。水が大のにがて。',
  },

  // ── 白の 中ボス: かいとう シロフクロウ（月の 間。Lv113）──
  // c10b … しかけ（battle-c10b.js の owl）
  //   n … はじめの 人数（左・中・右）・half … HPが 半分を 切った あとの 人数
  //   shuffle … 動く 回数ごとに シャッフル（前ぶれ → 次の 番に 入れかわる）・halfShuffle … HP 半分 いかの 回数
  //   aoe … 全体攻撃で 本物が 受ける ダメージの ばい
  //   tease … まぼろしを 攻撃した 人の「からかいの羽」（dmg … 最大HPの わりあい・delay … 次の 番が おくれる ぶん〈ゲージ〉）
  //   steal … 「ぬすむ」（every 回 動く ごとに 前ぶれ・ねらう 人 → 次の 番。防御で ふせげる）
  //   lit … スピカの てらすで 本物が 光る 番（てらすの lit と おなじ）
  [C10B_OWL]: {
    ...OWL_BASE, hp: 14000, str: 6000, exp: 84000, gold: 29000,
    drops: { boss: ['c10bb_owl_plume'], bonus: ['limit_stone'] },
    c10b: {
      kind: 'owl',
      n: 3, half: 4,
      shuffle: 2, halfShuffle: 1,
      aoe: 0.5,
      tease: { dmg: 0.3, delay: 100 },
      steal: { every: 3 },
      // 人数で 合わせる（ゲッコーと おなじ 形）。solo … 仲間なしの ひとり
      few: { hp: [1.1, 0.8, 1, 1, 1.2], atk: [0.85, 1.0, 1, 1, 1.05], spd: [0.9, 0.9, 1, 1, 1] },
      solo: { hp: 0.12, atk: 0.28, spd: 0.75 },
      monK: { hp: 0.15, atk: -0.01 },
    },
  },
  // まぼろし（本物と 見た目も 名前も おなじ。動かない・攻撃しても すりぬける・たおれない）
  //   どれが 本物かは 戦いの 中で 入れかわる（battle-c10b.js）。exp 0（たおした ことに ならない）。落とす 品は 本物と おなじ
  [C10B_OWL_FAKE]: {
    ...OWL_BASE, hp: 14000, str: 6000, exp: 0, gold: 0, fake: true,
    drops: { boss: ['c10bb_owl_plume'] },
    c10b: { kind: 'owlFake' },
  },
};

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる。今の 素材だけ）
export const C10B_MAT_DROPS = {
  c10b_spirit: ['magic_powder', 3],
  c10b_crab: ['silver_shard', 3],
  c10b_fish: ['beast_fang', 3],
  c10b_sand: ['land_shard', 3],
  c10b_iceowl: ['star_sand', 3],
  c10b_wolf: ['beast_fang', 3],
  c10b_armor: ['silver_shard', 3],
};
