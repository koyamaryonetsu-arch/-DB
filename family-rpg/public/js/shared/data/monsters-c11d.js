// 第3部 第3章 第4幕「かがやきの女王と、八つめの音」の 魔物・中ボス・さいごの ボス（B: 戦い。docs/plan-part3-c11d.md の 20-5）
// monsters.js（MONSTERS）・loot.js（MAT_DROPS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/c11d-art.js。ボスの しかけは shared/battle-c11d.js（battle-c9b.js から よぶ）
//
// 出現表（encounters-c11d.js）: t11d_tower1（かがやきの 塔 1階。Lv124）・t11d_tower2（2階。Lv124〜125）・t11d_tower3（3階。Lv125〜126）
// ふつうの 魔物 7しゅ（どれも 仲間に なる。region: 6。新しい 絵は 4つ ＋ 色ちがい 3つ）
//   プリズムナイト（新しい 絵。光の かけらの よろいの 騎士）・かんむりどり（新しい 絵。光の かんむりを のせた 鳥）・
//   てかがみ（新しい 絵。宙に うかぶ 手鏡）・ほしのかけら（新しい 絵。ほうき星の かけらの 精）
//   あかつきナイト（プリズムナイトの 色ちがい）・まばゆどり（てんびんどりの 色ちがい）・よるのかがみ（てかがみの 色ちがい）
//
// ・中ボス「鏡と 月の 使い」（4階 音の 間。Lv125）… ミラーレ（第2章 第4幕）と オボロ（第2幕）の 2人。前に 出て いる 方の しくみだけが きく
//   （battle-c11d.js の duo。勝つと 2人とも 引く ＝ たおれない）。もとの 戦いの 魔物（c10d_mirare・c11b_oboro）とは べつの id（絵は 同じ）
// ・さいごの ボス「かがやきの女王ポラリス」（玉座の 間。Lv126）… 手を つなぐ（battle-c11d.js の queen。勝つと 手を 下ろす ＝ たおれない）
// ・ボスの え は 2倍の こまかさ（size は 2倍・artScale: 0.5）

const BOSS_STATUS = { sleep: 0, poison: 0.3, confuse: 0, blind: 0.3, silence: 0.2, paralyze: 0 };
// ふつうの 魔物（仲間に なる 7しゅ）
export const C11D_TOWER1_MON = ['c11d_knight', 'c11d_crown', 'c11d_dazzle'];
export const C11D_TOWER2_MON = ['c11d_hmirror', 'c11d_dawn'];
export const C11D_TOWER3_MON = ['c11d_shard', 'c11d_nmirror'];
export const C11D_MINIONS = [...C11D_TOWER1_MON, ...C11D_TOWER2_MON, ...C11D_TOWER3_MON];
// 色ちがいの もと（今 いる 魔物の 絵か、この 幕の 新しい 絵）
export const C11D_RECOLOR_BASE = { c11d_dawn: 'c11d_knight', c11d_dazzle: 'c11c_bird', c11d_nmirror: 'c11d_hmirror' };
// 新しい 絵（ふつうの 魔物は 4しゅまで）
export const C11D_NEW_ART = ['c11d_knight', 'c11d_crown', 'c11d_hmirror', 'c11d_shard'];

// 中ボス（2人）
export const C11D_MIRROR = 'c11d_mirror';
export const C11D_MOON = 'c11d_moon';
export const DUO_NAME = '鏡と月の使い';
export const MIRROR_SHORT = 'ミラーレ';
export const MOON_SHORT = 'オボロ';
// 絵の もと（今 ある 絵。client/render/c11d-art.js が 写す）
export const C11D_DUO_ART = { [C11D_MIRROR]: 'c10d_mirare', [C11D_MOON]: 'c11b_oboro' };
// さいごの ボス
export const C11D_QUEEN = 'c11d_queen';
export const QUEEN_NAME = 'かがやきの女王ポラリス';
export const QUEEN_SHORT = '女王';
export const C11D_BOSSES = [C11D_MIRROR, C11D_MOON, C11D_QUEEN];

// 中ボスの しかけ（battle-c11d.js の duo。2人 とも 同じ 数を 見る）
//   swap … 前に 出て いる 方が この 回数 動くと 入れかわる（その 1回 前に 前ぶれ）
//   backK … うしろの 方が 受ける ダメージ（うしろで まもられて いる）
//   veilK … ミラーレが 前で 色の まくが ある 間の 受ける ダメージ・forgetK … オボロが 前で スピカの わすれが 1 いじょうの 間の 受ける ダメージ
//   max … スピカの 思い出の 数（ぜんぶ 消えると つれて いかれて 負け）
//   few … 人数で 合わせる [1人, 2人, 3人, 4人, 5人]（hp・atk）。bare … 仲間なしの 2人・3人。solo … ひとり。monK … 魔物の 仲間 1体ごと
//   （設計に ない 足し物: autoK … だれも えらんで いない〈完全オート・人が みんな たおれた〉時の 受ける ダメージ）
const DUO = {
  kind: 'duo', swap: 3, backK: 0.3, veilK: 0.2, forgetK: 0.25, max: 3, autoK: 0.4,
  few: { hp: [0.8, 0.85, 0.9, 0.75, 0.95], atk: [0.75, 0.85, 0.92, 1.3, 1.3] },
  bare: { hp: [0.6, 0.85], atk: [0.9, 1.0] },
  solo: { hp: 0.55, atk: 0.62, spd: 0.66 },
  monK: { hp: 0.1, atk: 0.02 },
};
// さいごの ボスの しかけ（battle-c11d.js の queen）
//   link … つないだ 手が ほどけるまでの 女王の 番の 数（その 1回 前に「切れそう」）
//   measure … 光の はかり（every 回 動く ごとに、1回 前に 前ぶれ・first … はじめの 前ぶれまで）。ながされた 人は away 回の 自分の 番の 間 戦いの 外・もどると HP back
//   shine … かがやき（全体。every・first・loose … つないで いない 人の 強さ・held … つないで いる 人の 強さ・guardCut … 身を 守ると）
//   late … 八つめの 音の あと（shine の 強さ ×・names … 星の 名前を よぶ〈自分を 回復〉の 番の 数・heal … 1回の 回復）
//   eight … 八つの音（uses … 戦いで 使える 数・lock … ほどけない 輪と はかりが きかない 女王の 番の 数・heal … みんなの 回復）
//   glow … スピカの ほのかな光が 輪の 人数 ×（ring … 1人 あたりの 回復の わりあい）
//   few・bare・solo・monK … 人数で 合わせる（solo の away・measure も）
//   （設計に ない 足し物: autoK … だれも えらんで いない 時の 女王の 受ける ダメージ）
const QUEEN = {
  kind: 'queen', link: 3,
  measure: { every: 4, first: 3, away: 2, back: 0.5 },
  shine: { every: 3, first: 2, loose: 1.6, held: 0.35, guardCut: 0.5 },
  late: { shineK: 1.2, names: 4, heal: 0.03 },
  eight: { uses: 2, lock: 4, heal: 0.15 },
  glow: { ring: 0.03 },
  autoK: 0.3,
  few: { hp: [0.8, 0.85, 0.9, 0.75, 0.95], atk: [0.75, 0.85, 0.92, 1.2, 1.25] },
  bare: { hp: [0.42, 0.75], atk: [0.86, 0.93], spd: [0.85, 1] },
  solo: { hp: 0.45, atk: 0.73, spd: 0.85 },
  monK: { hp: 0.1, atk: 0.02 },
};

export const MONSTERS_C11D = {
  // ── かがやきの 塔 1階（Lv124）──
  // プリズムナイト: 光の かけらの よろいの 騎士（新しい 絵）
  c11d_knight: {
    name: 'プリズムナイト', lv: 124, hp: 4060, mp: 180, str: 640, def: 450, agi: 260, mag: 380, exp: 10340, gold: 3540,
    race: 'material', size: 'm', hit: 'slash', region: 6,
    resist: { fire: 1.0, ice: 1.0, wind: 1.0, bolt: 1.35, light: 0.6, dark: 1.2, poison: 0, sleep: 0.3, confuse: 0.4 }, drops: { common: ['silver_shard', 12], rare: ['c7i_snow_mail', 80] },
    actions: [{ w: 3, id: 'm11d_kn_slash' }, { w: 2, id: 'm11d_kn_prism', cond: 'notRecent:m11d_kn_prism' }, { w: 1, id: 'attack' }],
    desc: 'かがやきの塔を守る、光のかけらのよろいの騎士。雷がよく効く。',
  },
  // かんむりどり: 光の かんむりを のせた 鳥（新しい 絵）
  c11d_crown: {
    name: 'かんむりどり', lv: 124, hp: 3900, mp: 240, str: 590, def: 400, agi: 330, mag: 440, exp: 10360, gold: 3550,
    race: 'beast', size: 'm', flying: true, hit: 'claw', region: 6,
    resist: { fire: 1.0, ice: 1.35, wind: 0.7, bolt: 1.0, light: 0.8, dark: 1.0, poison: 0.5, sleep: 0.4, confuse: 0.4 }, drops: { common: ['cloud_cotton', 12], rare: ['c7i_snow_helm', 80] },
    actions: [{ w: 3, id: 'm11d_cr_peck' }, { w: 2, id: 'm11d_cr_proud', cond: 'notRecent:m11d_cr_proud' }, { w: 1, id: 'attack' }],
    desc: '光のかんむりを、頭にのせた鳥。いばって、むねをはる。氷がよく効く。',
  },
  // まばゆどり: てんびんどりの 色ちがい（白い 光）
  c11d_dazzle: {
    name: 'まばゆどり', lv: 124, hp: 3880, mp: 240, str: 580, def: 390, agi: 330, mag: 450, exp: 10380, gold: 3560,
    race: 'beast', size: 'm', flying: true, hit: 'claw', region: 6,
    resist: { fire: 1.0, ice: 1.0, wind: 0.7, bolt: 1.35, light: 0.7, dark: 1.1, poison: 0.5, sleep: 0.4, confuse: 0.4 }, drops: { common: ['magic_water', 12], rare: ['c7i_snow_staff', 80] },
    actions: [{ w: 3, id: 'm11d_dz_peck' }, { w: 2, id: 'm11d_dz_flash', cond: 'notRecent:m11d_dz_flash' }, { w: 1, id: 'attack' }],
    desc: 'まぶしい白いはねの鳥。はねをひろげて、目をくらませる。雷がよく効く。',
  },

  // ── かがやきの 塔 2階（Lv124〜125）──
  // てかがみ: 宙に うかぶ 手鏡（新しい 絵）
  c11d_hmirror: {
    name: 'てかがみ', lv: 125, hp: 3820, mp: 280, str: 540, def: 420, agi: 280, mag: 470, exp: 10440, gold: 3580,
    race: 'material', size: 's', flying: true, hit: 'magic', region: 6,
    resist: { fire: 1.0, ice: 1.0, wind: 1.0, bolt: 1.0, light: 0.5, dark: 1.35, poison: 0, sleep: 0.4, confuse: 0.4 }, drops: { common: ['magic_powder', 12], rare: ['c7i_snow_robe', 80] },
    actions: [{ w: 3, id: 'm11d_hm_beam' }, { w: 2, id: 'm11d_hm_flash', cond: 'notRecent:m11d_hm_flash' }, { w: 1, id: 'attack' }],
    desc: '宙にうかぶ、小さな手鏡。光をはね返して、ちくりとさす。闇がよく効く。',
  },
  // あかつきナイト: プリズムナイトの 色ちがい（夜明けの 色）
  c11d_dawn: {
    name: 'あかつきナイト', lv: 124, hp: 4120, mp: 180, str: 650, def: 460, agi: 250, mag: 380, exp: 10420, gold: 3570,
    race: 'material', size: 'm', hit: 'slash', region: 6,
    resist: { fire: 0.7, ice: 1.35, wind: 1.0, bolt: 1.0, light: 0.7, dark: 1.1, poison: 0, sleep: 0.3, confuse: 0.4 }, drops: { common: ['jou_herb', 10], rare: ['c7i_snow_dagger', 80] },
    actions: [{ w: 3, id: 'm11d_dw_slash' }, { w: 1, id: 'm11d_dw_sun', cond: 'notRecent:m11d_dw_sun' }, { w: 2, id: 'attack' }],
    desc: '夜明けの色の、かけらのよろいの騎士。お日さまの火をまとう。氷がよく効く。',
  },

  // ── かがやきの 塔 3階（Lv125〜126）──
  // ほしのかけら: ほうき星の かけらの 精（新しい 絵）
  c11d_shard: {
    name: 'ほしのかけら', lv: 126, hp: 3940, mp: 280, str: 560, def: 410, agi: 310, mag: 480, exp: 10520, gold: 3620,
    race: 'spirit', size: 's', flying: true, hit: 'magic', region: 6,
    resist: { fire: 1.0, ice: 1.0, wind: 1.35, bolt: 1.0, light: 0.6, dark: 1.1, poison: 0, sleep: 0.4, confuse: 0.4 }, drops: { common: ['star_sand', 12], rare: ['c7i_snow_gi', 80] },
    actions: [{ w: 3, id: 'm11d_sh_beam' }, { w: 2, id: 'm11d_sh_rain', cond: 'notRecent:m11d_sh_rain' }, { w: 1, id: 'attack' }],
    desc: '星の海から、まいおちてきた、ほうき星のかけら。きらきらの雨をふらせる。風がよく効く。',
  },
  // よるのかがみ: てかがみの 色ちがい（夜の 色）
  c11d_nmirror: {
    name: 'よるのかがみ', lv: 125, hp: 3860, mp: 280, str: 550, def: 420, agi: 290, mag: 480, exp: 10480, gold: 3600,
    race: 'material', size: 's', flying: true, hit: 'magic', region: 6,
    resist: { fire: 1.35, ice: 1.0, wind: 1.0, bolt: 1.0, light: 1.1, dark: 0.5, poison: 0, sleep: 0.4, confuse: 0.4 }, drops: { common: ['moonherb', 10], rare: ['c7i_snow_boomerang', 80] },
    actions: [{ w: 3, id: 'm11d_nm_beam' }, { w: 2, id: 'm11d_nm_sleep', cond: 'notRecent:m11d_nm_sleep' }, { w: 1, id: 'attack' }],
    desc: '夜の色にくもった、小さな手鏡。ねむくなる光をうつす。炎がよく効く。',
  },

  // ── 中ボス: 鏡と月の使い（ミラーレと オボロ。Lv125）──
  // c11d … しかけ（battle-c11d.js の duo）。role … mirror（色の まく ＋ 音を鳴らす）・moon（わすれの 衣 ＋ よびかける）
  [C11D_MIRROR]: {
    name: MIRROR_SHORT, short: MIRROR_SHORT, lv: 125, hp: 9200, mp: 9999, str: 2380, def: 430, agi: 260, mag: 1200, exp: 56000, gold: 19000,
    race: 'material', size: 'xl', boss: true, turns: 1, speed: 1.1, hit: 'magic', artScale: 0.5, flying: true,
    drops: { boss: ['c11db_duo_ribbon'], bonus: ['limit_stone'] },
    resist: { ...BOSS_STATUS, fire: 1.0, ice: 1.0, wind: 1.0, bolt: 1.0, light: 0.6, dark: 1.1 },
    c11d: { ...DUO, role: 'mirror' },
    actions: [{ w: 3, id: 'm11u_glare' }, { w: 2, id: 'm11u_hands', cond: 'notRecent:m11u_hands' }],
    desc: '金のふちの、大きな鏡。前に出ている間は、色のまくをまとう。同じ色の「音を鳴らす」で、まくがわれる。',
  },
  [C11D_MOON]: {
    name: MOON_SHORT, short: MOON_SHORT, lv: 125, hp: 9200, mp: 9999, str: 2380, def: 430, agi: 260, mag: 1200, exp: 56000, gold: 19000,
    race: 'human', size: 'xl', boss: true, turns: 1, speed: 1.1, hit: 'magic', artScale: 0.5,
    drops: { boss: ['c11db_duo_ribbon'] },
    resist: { ...BOSS_STATUS, fire: 1.0, ice: 0.9, wind: 1.0, bolt: 1.0, light: 0.6, dark: 1.2 },
    c11d: { ...DUO, role: 'moon' },
    actions: [{ w: 3, id: 'm11u_whip' }, { w: 2, id: 'm11u_moon', cond: 'notRecent:m11u_moon' }],
    desc: '雲の車に乗った、月のむかえの使い。前に出ている間は、わすれの衣で、スピカの思い出を消そうとする。',
  },

  // ── さいごの ボス: かがやきの女王ポラリス（玉座の 間。Lv126）──
  // c11d … しかけ（battle-c11d.js の queen）。たおれない（勝つと 手を 下ろす）
  [C11D_QUEEN]: {
    name: QUEEN_NAME, short: QUEEN_SHORT, lv: 126, hp: 52000, mp: 9999, str: 2500, def: 450, agi: 280, mag: 1250, exp: 124000, gold: 40000,
    race: 'human', size: 'xl', boss: true, turns: 1, speed: 1.3, hit: 'magic', artScale: 0.5,
    drops: { boss: ['c11db_queen_tiara'], bonus: ['limit_stone'] },
    resist: { ...BOSS_STATUS, fire: 1.0, ice: 1.0, wind: 1.0, bolt: 1.0, light: 0.5, dark: 1.0 },
    c11d: QUEEN,
    actions: [{ w: 3, id: 'm11q_strike' }, { w: 2, id: 'm11q_rain', cond: 'notRecent:m11q_rain' }],
    desc: '月の都の、かがやきの女王。北の空で動かない星の名前を持つ。きまりを、1つもまげずに守ってきた。',
  },
};

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる。今の 素材だけ）
export const C11D_MAT_DROPS = {
  c11d_knight: ['silver_shard', 3],
  c11d_crown: ['cloud_cotton', 3],
  c11d_dazzle: ['magic_powder', 3],
  c11d_hmirror: ['silver_shard', 4],
  c11d_dawn: ['star_sand', 3],
  c11d_shard: ['star_sand', 4],
  c11d_nmirror: ['magic_powder', 4],
};
