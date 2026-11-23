// 第3部 第3章 第2幕「月の都と、名前のランプ」の 魔物・中ボス・幕の ボス（B: 戦い。docs/plan-part3-c11b.md の 18-4）
// monsters.js（MONSTERS）・loot.js（MAT_DROPS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/c11b-art.js。ボスの しかけは shared/battle-c11b.js（battle-c9b.js から よぶ）
//
// 出現表（encounters-c11b.js）: t11b_alley（うらの 町の 道。Lv120〜121）・t11b_tower（名前の 塔の おもて。Lv121）・t11b_towerb（塔の うら。Lv121〜122）
//   おもての 町では 出ない（A班）
// ふつうの 魔物 7しゅ（どれも 仲間に なる。region: 6。新しい 絵は 3つ ＋ 色ちがい 4つ）
//   うら道 … つきあかりガ（こはくガの 色ちがい）・ろじうらぼうし（かげぼうしの 色ちがい）・やねのつきみネコ（新しい 絵）
//   塔の おもて … なふだランプ（新しい 絵。名前の 札を 下げた 小さな ランプ）・はかりのへい（時計の守り兵の 色ちがい）
//   塔の うら … くすみぼし（星くずスライムの 色ちがい）・わすれぐも（新しい 絵。名前を すいとる 小さな 雲）
//
// ・中ボス「ランプの番人カンテラ」（名前の 塔の いちばん 上。Lv121）… 明るい ／ 暗い を くり返す（battle-c11b.js の keeper）
//   大きな ランプを かかえた、背の 高い 番人（もとの お話は ない）
// ・幕の ボス「月のむかえ オボロ」（塔の 上の テラス。Lv122）と 小さな 天人 2体 … わすれの 衣（battle-c11b.js の oboro）
//   雲の 車に 乗った、ていねいで つめたい 使い。もとは 昔話の 月からの むかえ（もとの お話の 名前・言葉・絵は 使わない。テストで 見る）
// ・ボスの え は 2倍の こまかさ（size は 2倍・artScale: 0.5）。勝っても オボロは たおれない（雲の 車で 引いて いく）

const BOSS_STATUS = { sleep: 0, poison: 0.3, confuse: 0, blind: 0.3, silence: 0.2, paralyze: 0 };
// ふつうの 魔物（仲間に なる 7しゅ）
export const C11B_ALLEY_MON = ['c11b_moth', 'c11b_kage', 'c11b_cat'];
export const C11B_TOWER_MON = ['c11b_lamp', 'c11b_guard'];
export const C11B_TOWERB_MON = ['c11b_dim', 'c11b_cloud'];
export const C11B_MINIONS = [...C11B_ALLEY_MON, ...C11B_TOWER_MON, ...C11B_TOWERB_MON];
// 色ちがいの もと（今 いる 魔物の 絵）
export const C11B_RECOLOR_BASE = { c11b_moth: 'amber_moth', c11b_kage: 'kage_boushi', c11b_guard: 'clockwork_guard', c11b_dim: 'stardust_slime' };
// 新しい 絵（ふつうの 魔物は 4しゅまで）
export const C11B_NEW_ART = ['c11b_cat', 'c11b_lamp', 'c11b_cloud'];

// 中ボス
export const C11B_KEEPER = 'c11b_keeper';
export const KEEPER_NAME = 'ランプの番人カンテラ';
export const KEEPER_SHORT = 'カンテラ';
// 幕の ボスと 天人
export const C11B_OBORO = 'c11b_oboro';
export const C11B_TENNIN = 'c11b_tennin';
export const OBORO_NAME = '月のむかえオボロ';
export const OBORO_SHORT = 'オボロ';
export const TENNIN_NAME = '天人';
export const C11B_BOSSES = [C11B_KEEPER, C11B_OBORO, C11B_TENNIN];

export const MONSTERS_C11B = {
  // ── うらの 町の 道（Lv120〜121）──
  // つきあかりガ: こはくガの 色ちがい（青白い 月の 色）
  c11b_moth: {
    name: 'つきあかりガ', lv: 120, hp: 3720, mp: 200, str: 560, def: 380, agi: 280, mag: 400, exp: 9720, gold: 3340,
    race: 'beast', size: 'm', flying: true, hit: 'magic', region: 6,
    resist: { fire: 1.35, ice: 0.9, wind: 1.1, bolt: 1.0, light: 0.8, dark: 1.0, poison: 0.5, sleep: 0.3, confuse: 0.4 }, drops: { common: ['moonherb', 10], rare: ['c7i_snow_robe', 80] },
    actions: [{ w: 3, id: 'm11m_mt_powder' }, { w: 2, id: 'm11m_mt_glow', cond: 'notRecent:m11m_mt_glow' }, { w: 1, id: 'attack' }],
    desc: '月の都のうら道で、ランプのまわりをとぶガ。はねの、こなが光る。炎がよく効く。',
  },
  // ろじうらぼうし: かげぼうしの 色ちがい（あい色の かげ）
  c11b_kage: {
    name: 'ろじうらぼうし', lv: 120, hp: 3840, mp: 160, str: 590, def: 390, agi: 300, mag: 340, exp: 9740, gold: 3350,
    race: 'spirit', size: 'm', hit: 'slash', region: 6,
    resist: { fire: 1.0, ice: 1.0, wind: 1.0, bolt: 1.1, light: 1.4, dark: 0.5, poison: 0, sleep: 0.4, confuse: 0.5 }, drops: { common: ['magic_water', 12], rare: ['c7i_snow_dagger', 80] },
    actions: [{ w: 3, id: 'm11m_kg_trip' }, { w: 2, id: 'm11m_kg_hide', cond: 'notRecent:m11m_kg_hide' }, { w: 1, id: 'attack' }],
    desc: 'うらの町の、ろじうらにすむかげ。足もとから、すっとのびてくる。光がよく効く。',
  },
  // やねのつきみネコ: 屋根の 上で 月を 見る ネコ（新しい 絵）
  c11b_cat: {
    name: 'やねのつきみネコ', lv: 121, hp: 3760, mp: 160, str: 610, def: 380, agi: 330, mag: 320, exp: 9800, gold: 3370,
    race: 'beast', size: 'm', hit: 'claw', region: 6,
    resist: { fire: 1.0, ice: 1.3, wind: 1.0, bolt: 1.1, light: 1.0, dark: 0.9, poison: 0.5, sleep: 0.5, confuse: 0.4 }, drops: { common: ['jou_herb', 10], rare: ['c7i_snow_boomerang', 80] },
    actions: [{ w: 3, id: 'm11m_ct_claw' }, { w: 2, id: 'm11m_ct_moon', cond: 'notRecent:m11m_ct_moon' }, { w: 1, id: 'attack' }],
    desc: '月の都の屋根の上で、まん丸の月を見ているネコ。とても素早い。氷がよく効く。',
  },

  // ── 名前の 塔の おもて（Lv121）──
  // なふだランプ: 名前の 札を 下げた 小さな ランプ（新しい 絵）
  c11b_lamp: {
    name: 'なふだランプ', lv: 121, hp: 3640, mp: 260, str: 520, def: 400, agi: 260, mag: 420, exp: 9820, gold: 3380,
    race: 'material', size: 's', flying: true, hit: 'magic', region: 6,
    resist: { fire: 0.5, ice: 1.35, wind: 1.0, bolt: 1.0, light: 0.6, dark: 1.2, poison: 0, sleep: 0.4, confuse: 0.4 }, drops: { common: ['magic_water', 12], rare: ['c7i_snow_staff', 80] },
    actions: [{ w: 3, id: 'm11m_lp_flame' }, { w: 2, id: 'm11m_lp_name', cond: 'notRecent:m11m_lp_name' }, { w: 1, id: 'attack' }],
    desc: '名前の札を下げて、塔の中をふわふわとぶランプ。名前をよびまちがえると、おこる。氷がよく効く。',
  },
  // はかりのへい: 時計の守り兵の 色ちがい（銀と 青）
  c11b_guard: {
    name: 'はかりのへい', lv: 121, hp: 4080, mp: 120, str: 620, def: 480, agi: 220, mag: 260, exp: 9840, gold: 3390,
    race: 'material', size: 'm', hit: 'slash', region: 6,
    resist: { bolt: 1.35, ice: 0.9, fire: 0.9, wind: 1.0, blast: 0.8, light: 0.9, dark: 1.1, poison: 0, sleep: 0.3, confuse: 0.5 }, drops: { common: ['silver_shard', 12], rare: ['c7i_snow_mail', 80] },
    actions: [{ w: 3, id: 'm11m_gd_spear' }, { w: 1, id: 'm11m_gd_scale', cond: 'notRecent:m11m_gd_scale' }, { w: 2, id: 'attack' }],
    desc: '光のはかりを守る、銀のへいたい。てんびんの形のやりを持つ。雷がよく効く。',
  },

  // ── 名前の 塔の うら（Lv121〜122）──
  // くすみぼし: 星くずスライムの 色ちがい（光の 弱い はい色の 星）
  c11b_dim: {
    name: 'くすみぼし', lv: 121, hp: 3880, mp: 180, str: 570, def: 420, agi: 240, mag: 360, exp: 9860, gold: 3400,
    race: 'slime', size: 's', hit: 'bite', region: 6,
    resist: { fire: 1.1, ice: 1.0, wind: 1.25, bolt: 1.0, light: 1.0, dark: 0.8, poison: 0.5, sleep: 0.4, confuse: 0.5 }, drops: { common: ['star_sand', 12], rare: ['c7i_snow_helm', 80] },
    actions: [{ w: 3, id: 'm11m_dm_bump' }, { w: 1, id: 'm11m_dm_dim', cond: 'notRecent:m11m_dm_dim' }, { w: 2, id: 'attack' }],
    desc: '光が弱くなって、塔のうらにかくれている星。ちょっと、すねている。風がよく効く。',
  },
  // わすれぐも: 名前を すいとる 小さな 雲（新しい 絵）
  c11b_cloud: {
    name: 'わすれぐも', lv: 122, hp: 3700, mp: 240, str: 540, def: 390, agi: 270, mag: 430, exp: 9940, gold: 3420,
    race: 'spirit', size: 'm', flying: true, hit: 'magic', region: 6,
    resist: { fire: 1.0, ice: 1.0, wind: 1.4, bolt: 1.1, light: 1.0, dark: 0.6, poison: 0, sleep: 0.4, confuse: 0.3 }, drops: { common: ['magic_powder', 12], rare: ['c7i_snow_gi', 80] },
    actions: [{ w: 3, id: 'm11m_cl_mist' }, { w: 2, id: 'm11m_cl_rain', cond: 'notRecent:m11m_cl_rain' }, { w: 1, id: 'attack' }],
    desc: 'ぼんやりした顔の、小さな雲。近くにいると、自分の名前をわすれそうになる。風がよく効く。',
  },

  // ── 中ボス: ランプの番人カンテラ（名前の 塔の いちばん 上。Lv121）──
  // c11b … しかけ（battle-c11b.js の keeper）
  //   every … 明かりが かわるまでの 番人の 番の 数（その 1回 前に 前ぶれ「ランプが、ちらちら…」）
  //   cut … 明るい 間の 物理・暗い 間の 呪文の 受ける ダメージ（3わり）・cutAuto … だれも えらんで いない 時の cut（設計に ない 足し物）
  //   wave … 明かりが かわる 時の 全体攻撃（物理の mult・身を 守ると guardCut）
  //   few … 人数で 合わせる [1人, 2人, 3人, 4人, 5人]（hp・atk・every）。bare … 仲間なしの 2人・3人。solo … 仲間なしの ひとり。monK … 魔物の 仲間 1体ごと
  [C11B_KEEPER]: {
    name: KEEPER_NAME, short: KEEPER_SHORT, lv: 121, hp: 13000, mp: 9999, str: 2450, def: 420, agi: 250, mag: 1150, exp: 34000, gold: 12000,
    race: 'human', size: 'xl', boss: true, turns: 1, speed: 1.15, hit: 'smash', artScale: 0.5,
    drops: { boss: ['c11bb_lamp_chain'], bonus: ['limit_stone'] },
    resist: { ...BOSS_STATUS, fire: 0.9, ice: 1.0, wind: 1.0, bolt: 1.0, light: 0.8, dark: 0.8 },
    c11b: {
      kind: 'keeper', every: 4, cut: 0.3, cutAuto: 0.12, wave: { mult: 1.6, guardCut: 0.5 },
      few: { hp: [0.85, 0.95, 0.95, 1.1, 1.25], atk: [0.8, 0.9, 0.95, 1.05, 1.05], every: [5, 4, 4, 4, 4] },
      bare: { hp: [0.8, 0.9], atk: [0.85, 0.9] },
      solo: { hp: 0.75, atk: 0.61, spd: 0.75, every: 4, cut: 0.6, wave: 2.1 },
      monK: { hp: 0.15, atk: 0.03 },
    },
    actions: [{ w: 3, id: 'm11k_bash' }, { w: 2, id: 'm11k_beam' }, { w: 1, id: 'm11k_ring', cond: 'notRecent:m11k_ring' }],
    desc: '名前の塔のいちばん上で、大きなランプを守る番人。ランプが明るいと物理が、暗いと呪文が効きにくい。',
  },

  // ── 幕の ボス: 月のむかえ オボロ（塔の 上の テラス。Lv122）──
  // c11b … しかけ（battle-c11b.js の oboro）
  //   max … スピカの「わすれ」が この 数に なると、スピカが つれて いかれて 負け
  //   robe … わすれの 衣（every 回 動く ごとに 前ぶれ → 次の 番に わすれ ＋1。first … はじめの 数。twice … HPが 半分を 切ると、つづけて もう 1回 かける わりあい。
//     auto … だれも えらんで いない 時の every）
  //   flash … わすれの 光（every 回 動く ごとに 前ぶれ → 次の 番に 全体の 光の ダメージ と わすれの じょうたい〈turns 回の 番〉。身を 守ると わすれない）
  //   第102回 見直し（2回め）: aoeK … 天人が 全体の 技（2体 いじょうを ねらう こうげき）で 受ける ダメージ（3わり）・aoeBoss … オボロが 全体の 技で 受ける ダメージ・
//     forgetK … スピカの わすれが 1 いじょうの 間 オボロが 受ける ダメージ（わすれの衣が オボロも つつむ）・robe.first 1 … はじめの 動きで 衣の 前ぶれ
//   hard … 天人が いる 間の オボロの 受ける ダメージ（5わり）・autoK … だれも えらんで いない 時の オボロの 受ける ダメージ・back … たおした 天人が もどるまでの オボロの 番の 数
  //   few … 人数で 合わせる [1人, 2人, 3人, 4人, 5人]（hp・atk・robe・back）。bare … 仲間なしの 2人・3人。solo … 仲間なしの ひとり（衣が おそい・天人 1体）。monK … 魔物の 仲間 1体ごと
  [C11B_OBORO]: {
    name: OBORO_NAME, short: OBORO_SHORT, lv: 122, hp: 10500, mp: 9999, str: 2400, def: 430, agi: 260, mag: 1200, exp: 104000, gold: 36000,
    race: 'human', size: 'xl', boss: true, turns: 1, speed: 1.0, hit: 'magic', artScale: 0.5,
    drops: { boss: ['c11bb_oboro_sash'], bonus: ['limit_stone'] },
    resist: { ...BOSS_STATUS, fire: 1.0, ice: 0.9, wind: 1.0, bolt: 1.0, light: 0.6, dark: 1.2 },
    c11b: {
      kind: 'oboro', max: 3,
      robe: { every: 3, first: 1, twice: 0.5, auto: 1 },
      flash: { every: 6, first: 5, base: [520, 560], turns: 2 },
      hard: 0.5, autoK: 0.5, aoeK: 0.3, aoeBoss: 0.6, forgetK: 0.5, back: 5,
      few: { hp: [0.8, 0.97, 0.95, 1, 1.25], atk: [0.75, 0.92, 0.95, 1, 1.08], robe: [4, 3, 3, 3, 3], back: [5, 4, 5, 4, 3] },
      bare: { hp: [0.4, 0.68], atk: [0.53, 0.74], robe: [5, 4] },
      solo: { hp: 0.65, atk: 0.48, robe: 6, back: 8, tennin: 1 },
      monK: { hp: 0.1, atk: 0 },
    },
    actions: [{ w: 3, id: 'm11o_whip' }, { w: 4, id: 'm11o_moon', cond: 'notRecent:m11o_moon' }, { w: 1, id: 'm11o_bow', cond: 'notRecent:m11o_bow' }],
    desc: '雲の車に乗った、月のむかえの使い。ていねいだが、つめたい。わすれの衣で、思い出を消そうとする。',
  },
  // 小さな 天人（オボロの まわりに 2体。たおしても しばらくすると もどる）
  [C11B_TENNIN]: {
    name: TENNIN_NAME, lv: 122, hp: 1400, mp: 9999, str: 2700, def: 380, agi: 280, mag: 900, exp: 8000, gold: 2000, speed: 0.95,
    race: 'spirit', size: 'm', boss: true, turns: 1, flying: true, hit: 'magic', artScale: 0.5, region: 6,
    // オボロと おなじ ボスの 品（1人 1つ … 2つめからは 落ちない。前の 幕の けものの 3つの 星と 同じ）
    drops: { boss: ['c11bb_oboro_sash'] },
    resist: { ...BOSS_STATUS, fire: 1.0, ice: 1.0, wind: 1.1, bolt: 1.0, light: 0.6, dark: 1.2 },
    c11b: { kind: 'tennin' },
    actions: [{ w: 3, id: 'm11t_sleeve' }, { w: 1, id: 'm11t_drop', cond: 'notRecent:m11t_drop' }],
    desc: 'オボロのまわりをまう、小さな天人。天人がいる間、オボロはこうげきが通りにくい。',
  },
};

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる。今の 素材だけ）
export const C11B_MAT_DROPS = {
  c11b_moth: ['magic_powder', 3],
  c11b_kage: ['star_sand', 3],
  c11b_cat: ['cloud_cotton', 3],
  c11b_lamp: ['magic_powder', 4],
  c11b_guard: ['silver_shard', 3],
  c11b_dim: ['star_sand', 4],
  c11b_cloud: ['cloud_cotton', 3],
};
