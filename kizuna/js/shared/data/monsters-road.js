// 第2部 第6章 Step 3・4「星めぐりの古道」の 魔物と、中ボス・ボス（B: 戦い。docs/plan-ch6.md の 11-2・11-4・12-1）
// monsters.js（MONSTERS）・loot.js（MAT_DROPS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/ch6-road-art.js。ボスの しかけ（星くい・時のふりこ）は shared/battle-road.js（battle-ch6.js から よぶ）
//
// 出現表（encounters-road.js）: t6_road_up＝星めぐりの古道 1〜4階（今と 千年前の 両方。Lv61〜62）/ t6_road_low＝5〜8階（Lv63〜64）
// region: 6 … 空の レア装備の 地方（rare-loot.js の regionOf）。どれも 仲間に なる（companions-road.js）
//
// ・星座の 魔物（c6tod）… 夜だけ 強い（ほしかげオオカミ・時わすれフクロウ）／昼だけ 強い（ひなたの星ひつじ・星座ガニ）。
//   たたかいの はじめに、その 時間なら 力が 上がる（battle-road.js の setupRoad。昼か 夜かは world/battles.js の hooks.night）
// ・星くずの けもの（星くずモグラ・星くずドラゴン）・時の ゆがみの 精（ゆがみの精・ふたご星の精）
//
// ・星くいのよる鳥（star_eater。古道 4階の 中ボス。Lv62）… 道しるべの 星（3つ）を ねらって 食べる（HPが もどり、力が 上がる）。
//   ねらっている 間に 光の 攻撃を 当てると、目が くらんで 食べそこねる。星が なくなると「よぞらのはばたき」（みんなに 大技）
// ・ふりこの魔女 ペンデュラ（pendula。古道の いちばん おく。Lv64）… 時のふりこ が 左右に ゆれる（がめんに 出る）。
//   左の 間は 味方が 速く 魔女が おそい・右の 間は その 逆。まん中を 通る ときに 時止めの 前ぶれ（ねらわれた 1人の ゲージが 止まる。
//   身を 守っていると 止まらない）。右の はしで 大ふりこの 前ぶれ（みんなに 大技。身を 守ると 半分）

const BOSS_STATUS = { sleep: 0, poison: 0.3, confuse: 0, blind: 0.3, silence: 0.2, paralyze: 0 };
export const STAR_EATER = 'star_eater';
export const PENDULA = 'pendula';
export const ROAD_BOSSES = [STAR_EATER, PENDULA];

export const MONSTERS_ROAD = {
  // ── 星めぐりの古道 1〜4階（星座の けものと 星くず。Lv61〜62）──
  // ほしかげオオカミ: 体に 星座の 線が 光る オオカミ。夜は 星の 光で 強く なる
  star_wolf: {
    name: 'ほしかげオオカミ', lv: 61, hp: 1600, mp: 80, str: 258, def: 188, agi: 168, mag: 150, exp: 1780, gold: 760,
    race: 'beast', size: 'm', hit: 'bite', region: 6,
    resist: { light: 1.3, dark: 0.6, ice: 0.9, poison: 0.5, sleep: 0.5, confuse: 0.5 }, drops: { common: ['jou_herb', 10], rare: ['seed_agi', 108] },
    c6tod: { when: 'night', buff: { atk: 1.2, agi: 1.2 }, msg: '夜空の星座が光って、ほしかげオオカミの体が、青白くかがやいた！' },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm6_sw_fang' }, { w: 2, id: 'm6_sw_pack', cond: 'notRecent:m6_sw_pack' }, { w: 1, id: 'm6_sw_howl', cond: 'notRecent:m6_sw_howl' }],
    desc: '体に星座の線が光る、黒いオオカミ。夜になると、星の光で力が強くなる。光がよく効く。',
  },
  // ひなたの星ひつじ: 金色の 毛の 星座の ひつじ。昼は お日さまの 光で かたく なる
  sun_ram: {
    name: 'ひなたの星ひつじ', lv: 61, hp: 1880, mp: 100, str: 262, def: 214, agi: 92, mag: 160, exp: 1800, gold: 780,
    race: 'beast', size: 'l', hit: 'bash', region: 6,
    resist: { dark: 1.3, light: 0.6, fire: 0.8, poison: 0.5, sleep: 0.4, confuse: 0.5 }, drops: { common: ['jou_herb', 10], rare: ['seed_def', 108] },
    c6tod: { when: 'day', buff: { atk: 1.15, def: 1.25 }, msg: 'お日さまの光をあびて、ひなたの星ひつじの金の毛が、ふわりとかがやいた！' },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm6_sr_horn' }, { w: 2, id: 'm6_sr_rush', cond: 'notRecent:m6_sr_rush' }, { w: 2, id: 'm6_sr_wool', cond: ['allyHurt', 'notRecent:m6_sr_wool'] }],
    desc: '金色の毛の、大きなひつじ。昼はお日さまの光で、毛がかたくなる。キズはひだまりの毛でなおす。闇がよく効く。',
  },
  // 星くずモグラ: 空から 落ちた 星くずを ほる モグラ
  dust_mole: {
    name: '星くずモグラ', lv: 61, hp: 1460, mp: 100, str: 240, def: 196, agi: 110, mag: 176, exp: 1740, gold: 760,
    race: 'beast', size: 'm', hit: 'claw', region: 6,
    resist: { wind: 1.35, bolt: 0.8, fire: 0.9, poison: 0.5, sleep: 0.5, blind: 0.3, confuse: 0.5 }, drops: { common: ['magic_water', 12], rare: ['seed_str', 108] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm6_dm_claw' }, { w: 2, id: 'm6_dm_dust', cond: 'notRecent:m6_dm_dust' }, { w: 1, id: 'm6_dm_pile', cond: 'notRecent:m6_dm_pile' }],
    desc: '空から落ちた星くずを、ほって集めるモグラ。星くずをまいて、前を見えなくする。風がよく効く。',
  },
  // ゆがみの精: 時の ゆがみから 生まれた、すがたの ゆらぐ 精
  warp_wisp: {
    name: 'ゆがみの精', lv: 62, hp: 1140, mp: 200, str: 180, def: 150, agi: 176, mag: 232, exp: 1760, gold: 760,
    race: 'spirit', size: 's', flying: true, region: 6,
    resist: { blast: 1.35, ice: 0.7, dark: 0.7, poison: 0, sleep: 0.4, confuse: 0.3 }, drops: { common: ['magic_water', 12], rare: ['seed_mag', 108] },
    actions: [{ w: 3, id: 'm6_ww_flash' }, { w: 2, id: 'm6_ww_warp', cond: 'notRecent:m6_ww_warp' }, { w: 2, id: 'm6_ww_haste', cond: 'notRecent:m6_ww_haste' }, { w: 1, id: 'attack' }],
    desc: '時のゆがみから生まれた精。すがたが、ぐにゃりとゆらいで見える。みんなの動きをおそくする。爆発がよく効く。',
  },

  // ── 星めぐりの古道 5〜8階（星座と 時の ゆがみ。Lv63〜64）──
  // 星座ガニ: こうらに 星座の もようの ある 大きな カニ。昼は こうらが かたい
  crab_star: {
    name: '星座ガニ', lv: 63, hp: 2080, mp: 100, str: 284, def: 232, agi: 84, mag: 160, exp: 1880, gold: 800,
    race: 'beast', size: 'l', hit: 'claw', region: 6,
    resist: { bolt: 1.35, ice: 0.8, fire: 0.8, poison: 0.4, sleep: 0.4, confuse: 0.5 }, drops: { common: ['jou_herb', 10], rare: ['seed_def', 120] },
    c6tod: { when: 'day', buff: { def: 1.25 }, msg: 'お日さまの光をあびて、星座ガニのこうらが、ぎらりと光った！' },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm6_cb_pinch' }, { w: 2, id: 'm6_cb_foam', cond: 'notRecent:m6_cb_foam' }, { w: 1, id: 'm6_cb_shell', cond: 'notRecent:m6_cb_shell' }],
    desc: 'こうらに星座のもようがある、大きなカニ。昼は、こうらがとてもかたくなる。雷がよく効く。',
  },
  // 時わすれフクロウ: 夜の 古道の 見はり番。目を 見ると 時を わすれる
  toki_owl: {
    name: '時わすれフクロウ', lv: 63, hp: 1560, mp: 160, str: 244, def: 176, agi: 150, mag: 240, exp: 1840, gold: 790,
    race: 'beast', size: 'm', flying: true, hit: 'claw', region: 6,
    resist: { fire: 1.3, wind: 0.7, dark: 0.7, poison: 0.5, sleep: 0, confuse: 0.4 }, drops: { common: ['magic_water', 12], rare: ['seed_mag', 108] },
    c6tod: { when: 'night', buff: { atk: 1.2, agi: 1.2 }, msg: '夜空の星座が光って、時わすれフクロウの目が、金色にかがやいた！' },
    actions: [{ w: 3, id: 'm6_no_talon' }, { w: 2, id: 'm6_no_eye', cond: 'notRecent:m6_no_eye' }, { w: 2, id: 'm6_no_song', cond: 'notRecent:m6_no_song' }, { w: 2, id: 'attack' }],
    desc: '夜の古道を見はる、大きなフクロウ。その目を見ると、時をわすれてねむってしまう。夜は強い。炎がよく効く。',
  },
  // ふたご星の精: 光の 顔と 闇の 顔を もつ、ふたごの 星の 精
  twin_star: {
    name: 'ふたご星の精', lv: 63, hp: 1240, mp: 220, str: 200, def: 166, agi: 156, mag: 244, exp: 1860, gold: 800,
    race: 'spirit', size: 'm', flying: true, region: 6,
    resist: { ice: 1.35, light: 0.7, dark: 0.7, poison: 0, sleep: 0.4, confuse: 0.4 }, drops: { common: ['magic_water', 12], rare: ['seed_mag', 108] },
    actions: [{ w: 3, id: 'm6_ts_twin' }, { w: 2, id: 'm6_ts_spark', cond: 'notRecent:m6_ts_spark' }, { w: 2, id: 'm6_ts_swap', cond: ['allyHurt', 'notRecent:m6_ts_swap'] }, { w: 1, id: 'attack' }],
    desc: '光の顔と闇の顔をもつ、ふたごの星の精。2つの光をいっしょにうつ。仲間のキズもなおす。氷がよく効く。',
  },
  // 星くずドラゴン: 星くずを 食べて 大きく なった 小さな 竜
  dust_drake: {
    name: '星くずドラゴン', lv: 64, hp: 2380, mp: 120, str: 302, def: 236, agi: 100, mag: 200, exp: 1960, gold: 840,
    race: 'dragon', size: 'l', hit: 'bite', region: 6,
    resist: { ice: 1.3, fire: 0.6, light: 0.8, poison: 0.4, sleep: 0.4, confuse: 0.4 }, drops: { common: ['jou_herb', 12], rare: ['seed_hp', 120] },
    actions: [{ w: 3, id: 'attack' }, { w: 3, id: 'm6_dd_tail' }, { w: 2, id: 'm6_dd_breath', cond: 'notRecent:m6_dd_breath' }, { w: 1, id: 'm6_dd_roar', cond: 'notRecent:m6_dd_roar' }],
    desc: '空から落ちた星くずを食べて、大きくなった竜。きらきらの星くずのブレスをはく。氷がよく効く。',
  },

  // ── 古道 4階: 星くいのよる鳥（中ボス。Lv62）──
  // ch6.stars … 道しるべの 星（n … 星の 数・every … 何回 動くと 星を ねらうか・fastEvery … HPが fastAt より へった あと・
  //            heal … 食べた ときに もどる HP〈最大HPの わりあい〉・pow … 食べた ときの 力〈攻撃力と 魔力の かけ算〉・cut … 目が くらんだ ときの 守り・
//            stun … 目が くらんだ ときに ゲージも 0 に するか〈しない。知っている 人が 強く なりすぎる〉・dark … 星が なくなったら よぞらのはばたき〈false で しない〉）
  [STAR_EATER]: {
    name: '星くいのよる鳥', lv: 62, hp: 24000, mp: 3000, str: 770, def: 200, agi: 118, mag: 570, exp: 26000, gold: 8500,
    race: 'beast', size: 'xl', boss: true, turns: 2, speed: 0.85, flying: true, hit: 'claw', drops: { boss: ['p6r_eater_plume'], rare: ['p6r_night_claw', 1] },
    resist: { ...BOSS_STATUS, light: 0.8, dark: 0.5, wind: 0.7, fire: 1.0, ice: 1.1, bolt: 1.0, blast: 1.0 },
    ch6: { kind: 'stars', stars: { n: 3, every: 4, fastEvery: 3, fastAt: 0.5, heal: 0.1, pow: 1.1, cut: 0.8, stun: false } },
    actions: [
      { w: 2, id: 'attack' }, { w: 3, id: 'm6_se_peck' }, { w: 3, id: 'm6_se_wing' },
      { w: 2, id: 'm6_se_dust', cond: 'notRecent:m6_se_dust' }, { w: 2, id: 'm6_se_cry', cond: 'notRecent:m6_se_cry' },
    ],
    phases: [
      { hpBelow: 0.5, msg: ['星くいのよる鳥のはねが、夜の色にそまった！', '攻撃力が上がった！'], buff: { atk: 1.1 } },
      { hpBelow: 0.2, msg: ['星くいのよる鳥のはねが、ばらばらとぬけおちた！', '守りが弱くなった！'], debuff: { def: 0.75 } },
    ],
    desc: '影の時計師ゼンマイの家来。星の道しるべを食べてしまう、夜の大きな鳥。星をねらっている間に光を当てると、目がくらんで食べそこねる。星がなくなると、よぞらのはばたき。そのときは身を守ろう。',
  },
  // ── 古道の いちばん おく: ふりこの魔女 ペンデュラ（ゼンマイの 2番目の 家来。Lv64）──
  // ch6.pend … 時のふりこ（reach … はしまでの 目もり〈まん中 0・左 -reach・右 +reach。ペンデュラが 1回 動くと 1つ ゆれる〉・
  //            ally … 味方の 速さ〈左・右〉・boss … ペンデュラの 速さ〈左・右〉・stop … 時止めで 止まる 長さ〈ペンデュラが 動く 回数〉）
  [PENDULA]: {
    name: 'ペンデュラ', lv: 64, hp: 41000, mp: 3000, str: 950, def: 236, agi: 116, mag: 700, exp: 32000, gold: 10000,
    race: 'human', size: 'xl', boss: true, turns: 2, speed: 0.8, hit: 'bash', drops: { boss: ['p6r_pendulum_charm'], rare: ['p6r_witch_staff', 1] },
    resist: { ...BOSS_STATUS, light: 1.0, dark: 0.6, ice: 0.9, fire: 0.9, wind: 0.9, bolt: 1.0, blast: 1.05 },
    ch6: { kind: 'pend', pend: { reach: 3, ally: [1.25, 0.75], boss: [0.75, 1.4], stop: 3 } },
    actions: [
      { w: 2, id: 'attack' }, { w: 3, id: 'm6_pd_shot' }, { w: 3, id: 'm6_pd_hex' },
      { w: 2, id: 'm6_pd_tick', cond: 'notRecent:m6_pd_tick' }, { w: 2, id: 'm6_pd_twist', cond: 'notRecent:m6_pd_twist' },
    ],
    phases: [
      { hpBelow: 0.5, msg: ['ペンデュラ「…まだまだ、時はわたしのものよ！」', '攻撃力が上がった！'], buff: { atk: 1.12 } },
      { hpBelow: 0.2, msg: ['ペンデュラのぼうしの時計に、ひびが入った！', '守りが弱くなった！'], debuff: { def: 0.75 } },
    ],
    desc: '影の時計師ゼンマイの2番目の家来。大きな時のふりこを持つ魔女。ふりこが左の間はみんなが速く、右の間は魔女が速い。まん中で「時止め」の前ぶれ。ねらわれた人は身を守ろう。右のはしで大ふりこ。そのときも身を守ろう。',
  },
};

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる）。第6章 Step 1・2 の 素材（時の砂・古い歯車。れん金で 使う）
export const ROAD_MAT_DROPS = {
  star_wolf: ['p6_time_sand', 4],
  sun_ram: ['p6_time_sand', 4],
  dust_mole: ['p6_time_sand', 3],
  warp_wisp: ['p6_old_gear', 4],
  crab_star: ['p6_time_sand', 4],
  toki_owl: ['p6_old_gear', 4],
  twin_star: ['p6_old_gear', 4],
  dust_drake: ['p6_time_sand', 3],
};
