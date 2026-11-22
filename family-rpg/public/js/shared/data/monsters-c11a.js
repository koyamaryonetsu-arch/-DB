// 第3部 第3章 第1幕「星の船と、星座の島」の 魔物・中ボス・幕の ボス（B: 戦い。docs/plan-part3-c11a.md の 17-4）
// monsters.js（MONSTERS）・loot.js（MAT_DROPS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/c11a-art.js。ボスの しかけは shared/battle-c11a.js（battle-c9b.js から よぶ）
//
// 出現表（encounters-c11a.js）: t11a_sea（星の海 c11_sea。船の 上の 戦い。Lv118〜119）・t11a_isle1〜3（星座の 島。Lv119〜120）
// ふつうの 魔物 8しゅ（どれも 仲間に なる。region: 6。新しい 絵は 2つ ＋ 色ちがい 6つ）
//   海 … ほしのうみクラゲ（星くらげの 色ちがい）・ほうきぼしウオ（新しい 絵）・あまのがわエイ（空とびエイの 色ちがい）・ながれぼしトビウオ（トビウオンの 色ちがい）
//   島 … ほしもりガニ（星座ガニの 色ちがい）・ほしのこひつじ（ひなたの星ひつじの 色ちがい）・ほしつなぎ（新しい 絵。光の 糸を もつ 小さな 星の 子）・
//        しまのよるフクロウ（星読みフクロウの 色ちがい）
//
// ・中ボス「星座のけもの」（3つめの 明かりを ともした 島。Lv119）… 3つの 星（あたま・むね・しっぽ）。そろえて たおす（battle-c11a.js の beast）
//   名前と 形は B班（もとの お話は ない）。星 3つと 光の 線で できた けもの（大きな 星の 犬の ような 形）
// ・幕の ボス「いかり船長 イバリー」と「チクタクザメ」（星座の門の 前。Lv120）… 時計の おしつけ合い（battle-c11a.js の pirate）
//   片手が いかりの、えらそうで こわがりな 船長。サメは 体の 中で 時計が 鳴る（ねらえない … 戦いの 的には ならない。え だけ）
//   もとは ピーター・パンの 海ぞくの 船長と 時計を のみこんだ ワニ。もとの 名前・絵・せりふ・かぎの 手・ワニは 使わない（テストで 見る）
// ・ボスの え は 2倍の こまかさ（size は 2倍・artScale: 0.5）。勝っても 船長は たおれない（サメに 追われて にげる）

const BOSS_STATUS = { sleep: 0, poison: 0.3, confuse: 0, blind: 0.3, silence: 0.2, paralyze: 0 };
// ふつうの 魔物（仲間に なる 8しゅ）
export const C11A_SEA_MON = ['c11a_jelly', 'c11a_comet', 'c11a_ray', 'c11a_tobi'];
export const C11A_ISLE_MON = ['c11a_crab', 'c11a_ram', 'c11a_wisp', 'c11a_owl'];
export const C11A_MINIONS = [...C11A_SEA_MON, ...C11A_ISLE_MON];
// 色ちがいの もと（今 いる 魔物の 絵）
export const C11A_RECOLOR_BASE = { c11a_jelly: 'star_jelly', c11a_ray: 'sky_ray', c11a_tobi: 'tobiuo', c11a_crab: 'crab_star', c11a_ram: 'sun_ram', c11a_owl: 'star_owl' };
// 新しい 絵（ふつうの 魔物は 4しゅまで）
export const C11A_NEW_ART = ['c11a_comet', 'c11a_wisp'];

// 星座のけもの（3つの 星。ならびは あたま・むね・しっぽ。となりは あたま−むね−しっぽ）
//   3つとも おなじ ボスの 品（星座のくびわ。1人 1つ … 2つめからは 落ちない）。けいけんちの おまけ（限界の石）は あたまだけ
export const C11A_HEAD = 'c11a_beast_head';
export const C11A_CHEST = 'c11a_beast_chest';
export const C11A_TAIL = 'c11a_beast_tail';
export const C11A_STARS = [C11A_HEAD, C11A_CHEST, C11A_TAIL];
export const BEAST_NAME = '星座のけもの';
// 船長
export const C11A_CAPTAIN = 'c11a_captain';
export const CAPTAIN_NAME = 'いかり船長イバリー';
export const CAPTAIN_SHORT = 'イバリー';
export const SHARK_NAME = 'チクタクザメ';
export const C11A_BOSSES = [...C11A_STARS, C11A_CAPTAIN];

// 星座のけものの しかけ（battle-c11a.js の beast）
//   role … 'head' 強い 1人攻撃（前ぶれ）・'chest' 仲間の 星を 回復・'tail' 全体攻撃
//   revive … たおれて から この 回数 だれかが 動くと よみがえる（reviveBy 'all' … 味方も 敵も 数える。となりの 星が のこって いる 時。HP reviveHp）
//   reviveUp … よみがえる たびに 3つの 星の 与える ダメージが この わりあい 上がる（ばらばらに たおし続けると 苦しく なる。設計に ない 足し物）
//   roar … あたまの 前ぶれ（every 回 動く ごとに → 次の あたまの 番に かみつき。mult・guardCut … 身を 守ると）
//   mend … むねの 回復（仲間の 星の 最大HPの この わりあい）
//   few … 人数（家族の キャラの 数）で 合わせる [1人, 2人, 3人, 4人, 5人]（hp・atk・revive）。solo … 仲間なしの ひとり。monK … 魔物の 仲間 1体ごと
const BEAST = (o) => ({
  kind: 'beast', revive: 5, reviveBy: 'all', reviveHp: 0.5, reviveUp: 0.25, roar: { every: 3, first: 2, mult: 2.3, guardCut: 0.35 }, mend: 0.05,
  few: { hp: [0.8, 0.85, 1, 1, 1.12], atk: [0.82, 0.88, 1, 1, 1.04], revive: [6, 6, 5, 5, 5] },
  solo: { hp: 0.28, atk: 0.38, revive: 8 },
  monK: { hp: 0.03, atk: 0.02 },
  ...o,
});
const STAR = { race: 'spirit', size: 'l', boss: true, turns: 1, hit: 'magic', artScale: 0.5, flying: true, region: 6 };
const STAR_RES = { ...BOSS_STATUS, fire: 1.0, ice: 1.0, wind: 1.0, bolt: 1.0, light: 0.6, dark: 1.2 };

export const MONSTERS_C11A = {
  // ── 星の海（船の 上の 戦い。Lv118〜119）──
  // ほしのうみクラゲ: 星くらげの 色ちがい（夜の 海の こい 青に 金の 星）
  c11a_jelly: {
    name: 'ほしのうみクラゲ', lv: 118, hp: 3690, mp: 160, str: 550, def: 400, agi: 230, mag: 340, exp: 9400, gold: 3180,
    race: 'beast', size: 'm', flying: true, hit: 'slash', region: 6,
    resist: { fire: 1.3, ice: 0.8, wind: 1.0, bolt: 1.25, light: 0.9, dark: 1.0, poison: 0, sleep: 0.4, confuse: 0.4 }, drops: { common: ['moonherb', 10], rare: ['c7i_snow_robe', 80] },
    actions: [{ w: 3, id: 'm11a_jl_sting' }, { w: 1, id: 'm11a_jl_flash', cond: 'notRecent:m11a_jl_flash' }, { w: 2, id: 'attack' }],
    desc: '星の海をただよう、こい青のクラゲ。かさの中で、金の星がまたたく。炎と雷がよく効く。',
  },
  // ほうきぼしウオ: 光の しっぽを 引く 魚（新しい 絵）
  c11a_comet: {
    name: 'ほうきぼしウオ', lv: 118, hp: 3530, mp: 160, str: 580, def: 380, agi: 300, mag: 340, exp: 9440, gold: 3200,
    race: 'beast', size: 'm', flying: true, hit: 'slash', region: 6,
    resist: { fire: 1.0, ice: 1.3, wind: 1.1, bolt: 1.0, light: 0.6, dark: 1.2, poison: 0.5, sleep: 0.4, confuse: 0.5 }, drops: { common: ['jou_herb', 10], rare: ['c7i_snow_boomerang', 80] },
    actions: [{ w: 3, id: 'm11a_cm_dash' }, { w: 2, id: 'm11a_cm_trail', cond: 'notRecent:m11a_cm_trail' }, { w: 1, id: 'attack' }],
    desc: 'ほうき星のように、光のしっぽを引いておよぐ魚。とても素早い。氷がよく効く。',
  },
  // あまのがわエイ: 空とびエイの 色ちがい（白っぽい 天の川の もよう）
  c11a_ray: {
    name: 'あまのがわエイ', lv: 119, hp: 3800, mp: 160, str: 570, def: 390, agi: 270, mag: 360, exp: 9500, gold: 3220,
    race: 'beast', size: 'm', flying: true, hit: 'slash', region: 6,
    resist: { bolt: 1.3, ice: 0.6, wind: 0.9, fire: 1.1, light: 1.0, dark: 1.0, poison: 0.6, sleep: 0.4, confuse: 0.5 }, drops: { common: ['magic_water', 12], rare: ['c7i_snow_shield', 80] },
    actions: [{ w: 3, id: 'm11a_ry_glide' }, { w: 2, id: 'm11a_ry_wave', cond: 'notRecent:m11a_ry_wave' }, { w: 1, id: 'attack' }],
    desc: '星の海の、大きなエイ。せなかに、白い星の川のもようがある。雷がよく効く。',
  },
  // ながれぼしトビウオ: トビウオンの 色ちがい（金と むらさき）
  c11a_tobi: {
    name: 'ながれぼしトビウオ', lv: 119, hp: 3610, mp: 140, str: 590, def: 370, agi: 290, mag: 320, exp: 9520, gold: 3240,
    race: 'beast', size: 's', flying: true, hit: 'slash', region: 6,
    resist: { fire: 1.0, ice: 0.7, wind: 1.3, bolt: 1.2, light: 1.0, dark: 1.0, poison: 0.5, sleep: 0.4, confuse: 0.5 }, drops: { common: ['antidote', 12], rare: ['c7i_snow_dagger', 80] },
    actions: [{ w: 3, id: 'm11a_tb_jump' }, { w: 2, id: 'm11a_tb_splash', cond: 'notRecent:m11a_tb_splash' }, { w: 1, id: 'attack' }],
    desc: '星の海から、ぴょんととび出す魚。船の上までとんでくる。風がよく効く。',
  },

  // ── 星座の 島（Lv119〜120）──
  // ほしもりガニ: 星座ガニの 色ちがい（青白い こうら）
  c11a_crab: {
    name: 'ほしもりガニ', lv: 119, hp: 3950, mp: 120, str: 580, def: 470, agi: 200, mag: 240, exp: 9560, gold: 3260,
    race: 'beast', size: 'm', hit: 'slash', region: 6,
    resist: { bolt: 1.35, ice: 0.8, fire: 1.0, wind: 1.0, blast: 0.8, light: 1.0, dark: 1.0, poison: 0.5, sleep: 0.4, confuse: 0.5 }, drops: { common: ['silver_shard', 12], rare: ['c7i_snow_mail', 80] },
    actions: [{ w: 3, id: 'm11a_cr_pinch' }, { w: 1, id: 'm11a_cr_shell', cond: 'notRecent:m11a_cr_shell' }, { w: 2, id: 'attack' }],
    desc: '星座の島の星を、こっそり守るカニ。こうらが、とてもかたい。雷がよく効く。',
  },
  // ほしのこひつじ: ひなたの星ひつじの 色ちがい（夜の 青い 毛）
  c11a_ram: {
    name: 'ほしのこひつじ', lv: 119, hp: 3760, mp: 160, str: 560, def: 400, agi: 220, mag: 330, exp: 9580, gold: 3280,
    race: 'beast', size: 'm', hit: 'bite', region: 6,
    resist: { fire: 1.3, ice: 0.8, wind: 1.1, bolt: 1.0, light: 1.0, dark: 1.0, poison: 0.5, sleep: 0.2, confuse: 0.6 }, drops: { common: ['moonherb', 10], rare: ['c7i_snow_helm', 80] },
    actions: [{ w: 3, id: 'm11a_rm_horn' }, { w: 1, id: 'm11a_rm_lull', cond: 'notRecent:m11a_rm_lull' }, { w: 2, id: 'attack' }],
    desc: '星座の島で、星をながめてくらす子ひつじ。こもりうたで、ねむらせてくる。炎がよく効く。',
  },
  // ほしつなぎ: 光の 糸を もつ 小さな 星の 子（新しい 絵）
  c11a_wisp: {
    name: 'ほしつなぎ', lv: 120, hp: 3460, mp: 240, str: 510, def: 380, agi: 260, mag: 400, exp: 9640, gold: 3300,
    race: 'spirit', size: 's', flying: true, hit: 'magic', region: 6,
    resist: { fire: 1.0, ice: 1.0, wind: 1.0, bolt: 1.0, light: 0.4, dark: 1.4, poison: 0, sleep: 0.4, confuse: 0.4 }, drops: { common: ['magic_water', 12], rare: ['c7i_snow_staff', 80] },
    actions: [{ w: 3, id: 'm11a_ws_thread' }, { w: 2, id: 'm11a_ws_tie', cond: 'notRecent:m11a_ws_tie' }, { w: 1, id: 'attack' }],
    desc: '光の糸で、星と星をつないで回る、小さな星の子。闇がよく効き、光は効きにくい。',
  },
  // しまのよるフクロウ: 星読みフクロウの 色ちがい（こい むらさき）
  c11a_owl: {
    name: 'しまのよるフクロウ', lv: 120, hp: 3720, mp: 200, str: 550, def: 390, agi: 280, mag: 380, exp: 9660, gold: 3320,
    race: 'beast', size: 'm', flying: true, hit: 'slash', region: 6,
    resist: { fire: 1.0, ice: 1.0, wind: 0.7, bolt: 1.3, light: 1.2, dark: 0.6, poison: 0.5, sleep: 0, confuse: 0.4 }, drops: { common: ['star_sand', 12], rare: ['c7i_snow_gi', 80] },
    actions: [{ w: 3, id: 'm11a_ow_swoop' }, { w: 2, id: 'm11a_ow_gaze', cond: 'notRecent:m11a_ow_gaze' }, { w: 1, id: 'attack' }],
    desc: '星座の島の夜を見はる、大きなフクロウ。音を立てずに、まい下りてくる。雷がよく効く。',
  },

  // ── 中ボス: 星座のけもの（3つの 星。Lv119）──
  // c11a … しかけ（battle-c11a.js の beast）。あたま … 強い 1人攻撃（前ぶれ）・むね … 仲間の 星を 回復・しっぽ … 全体攻撃
  [C11A_HEAD]: {
    ...STAR, name: 'あたまの星', lv: 119, hp: 7000, mp: 9999, str: 1780, def: 400, agi: 250, mag: 1100, exp: 30000, gold: 11000, speed: 0.65,
    drops: { boss: ['c11ab_star_collar'], bonus: ['limit_stone'] }, resist: STAR_RES,
    c11a: BEAST({ role: 'head' }),
    actions: [{ w: 3, id: 'm11b_claw' }, { w: 2, id: 'm11b_pulse' }],
    desc: '星座のけものの、あたまの星。うなったあとに、大きくかみつく。',
  },
  [C11A_CHEST]: {
    ...STAR, name: 'むねの星', lv: 119, hp: 7000, mp: 9999, str: 1520, def: 420, agi: 230, mag: 1100, exp: 30000, gold: 11000, speed: 0.62,
    drops: { boss: ['c11ab_star_collar'] }, resist: STAR_RES,
    c11a: BEAST({ role: 'chest' }),
    actions: [{ w: 2, id: 'm11b_pulse' }, { w: 2, id: 'm11b_mend', cond: 'notRecent:m11b_mend' }, { w: 1, id: 'm11b_claw' }],
    desc: '星座のけものの、むねの星。光の線で、仲間の星を回復する。',
  },
  [C11A_TAIL]: {
    ...STAR, name: 'しっぽの星', lv: 119, hp: 7000, mp: 9999, str: 1610, def: 400, agi: 260, mag: 1100, exp: 30000, gold: 11000, speed: 0.65,
    drops: { boss: ['c11ab_star_collar'] }, resist: STAR_RES,
    c11a: BEAST({ role: 'tail' }),
    actions: [{ w: 3, id: 'm11b_sweep' }, { w: 2, id: 'm11b_dust', cond: 'notRecent:m11b_dust' }, { w: 1, id: 'm11b_claw' }],
    desc: '星座のけものの、しっぽの星。しっぽをふりまわして、みんなをおそう。',
  },

  // ── 幕の ボス: いかり船長 イバリー（星座の門の 前。Lv120）──
  // c11a … しかけ（battle-c11a.js の pirate）
  //   clock … 目ざまし時計（start … 数の はじまり〈動く 人の 数 ＋ plus〉・two … HPが この わりあいを 切ると 2つめ〈twoPlus … 2つめは 数を ずらす〉）
  //   bite … サメが かむ（ally … 味方の 最大HPの わりあい・guardCut … 身を 守ると・cap … 船長の 最大HPの わりあい・dizzy … 目を 回す 番の 数・dizzyK … 目を 回して いる 間の 受ける ダメージ）
  //   hard … ふだんの 受ける ダメージ（3わり）
  //   anchor … いかりなげ（every 回 動く ごとに 前ぶれ → 次の 番。mult・holder … 時計を 持つ 人を ねらう わりあい・atb … 当たった 人の ゲージ）
  //   song … スピカの 星のうた で 数が へらない 回数（歌った 番の あと）
  //   few … 人数で 合わせる [1人, 2人, 3人, 4人, 5人]（hp・atk・plus・spd）。solo … 仲間なしの ひとり（時計は 1つ）。monK … 魔物の 仲間 1体ごと
  [C11A_CAPTAIN]: {
    name: CAPTAIN_NAME, short: CAPTAIN_SHORT, lv: 120, hp: 37000, mp: 9999, str: 7300, def: 420, agi: 260, mag: 1180, exp: 98000, gold: 34000,
    race: 'human', size: 'xl', boss: true, turns: 1, speed: 1.22, hit: 'smash', artScale: 0.5,
    drops: { boss: ['c11ab_anchor_badge'], bonus: ['limit_stone'] },
    resist: { ...BOSS_STATUS, fire: 0.8, ice: 1.0, wind: 1.0, bolt: 1.1, light: 1.0, dark: 1.0 },
    c11a: {
      kind: 'pirate',
      clock: { plus: 2, two: 0.5, twoPlus: 2 },
      bite: { ally: 0.9, guardCut: 0.5, cap: 0.08, dizzy: 2, dizzyK: 1.5 },
      hard: 0.3,
      anchor: { every: 3, first: 2, mult: 0.85, holder: 0.7, atb: 0 },
      song: 1,
      few: { hp: [0.6, 0.58, 1, 1, 1.2], atk: [0.7, 0.66, 1, 1, 1.08], plus: [2, 2, 2, 2, 2], spd: [1, 1, 1, 1, 1] },
      solo: { hp: 0.2, atk: 0.24, spd: 0.75, two: 0 },
      // 魔物の 仲間は 時計を 投げない（3回に 1回だけ）・生き返らせない ので、1体ごとに 船長を 弱く する
      monK: { hp: -0.12, atk: -0.1 },
    },
    actions: [{ w: 3, id: 'm11p_saber' }, { w: 2, id: 'm11p_cannon', cond: 'notRecent:m11p_cannon' }, { w: 1, id: 'm11p_brag', cond: 'notRecent:m11p_brag' }],
    desc: '片手が、大きないかりの船長。いつもいばっているが、時計の音が大の苦手。',
  },
};

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる。今の 素材だけ）
export const C11A_MAT_DROPS = {
  c11a_jelly: ['star_sand', 3],
  c11a_comet: ['star_sand', 4],
  c11a_ray: ['cloud_cotton', 3],
  c11a_tobi: ['magic_powder', 3],
  c11a_crab: ['land_shard', 3],
  c11a_ram: ['cloud_cotton', 3],
  c11a_wisp: ['magic_powder', 3],
  c11a_owl: ['star_sand', 3],
};
