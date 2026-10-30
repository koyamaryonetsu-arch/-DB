// 第2部 第6章 Step 6「時計塔の心臓」の 魔物と、ボス ゼンマイ・リオンの けいこ・時のまぼろし（B: 戦い。docs/plan-ch6.md の 13-3・16・17）
// monsters.js（MONSTERS）・loot.js（MAT_DROPS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/ch6-tokei6-art.js。ゼンマイの しかけは shared/battle-tokei6.js（battle-ch6.js から よぶ）
//
// 出現表（encounters-tokei6.js）: t6_tower_high＝時計塔 6〜10階（千年前だけ。おすすめ Lv66〜68）
// 新しい 魔物 7しゅ（どれも 仲間に なる）は、配合で 足りない 系統・ランクに 入れる（docs/plan-r53-breed-more.md の 1）
//   新しい 絵 4しゅ: 時計ゆうれい（ゾンビ A）・かねの精（せいれい A）・大時計の番人（物質 S）・ぜんまい草（植物 B）
//   今の 絵の 色がえ 3しゅ: 秒針の精（せいれい B。ゆがみの精の 絵）・ねじまき小あくま（悪魔 B。小あくまの 絵）・からくりがいこつ（ゾンビ B。がいこつの 絵）
//   ランクは 出やすさ（encounters-tokei6.js の 重み）と 仲間に なりやすさ（companions-tokei6.js の rate）で きまる（tools/gen-monster-ranks.mjs）
//
// ・影の時計師ゼンマイ（zenmai。10階の ボス。Lv68。2だん）… battle-tokei6.js
//   1だんめ: 家来の しかけを じゅんばんに 使う（砂が落ちきる → まきもどし → 時のふりこ → 時のかね）。しかけの 数は ch6.zen.stages
//   2だんめ（HP が p2At より へる）: 文字ばんの 針（hand）が、ゼンマイが 動く たびに 1時間 進む。12時で「時の大ほうかい」。
//     まわりに 歯車 3つ（べつの 敵。弱点が 氷・雷・光）。こわすと 針が back 時間 もどる。revive 回 動くと また 動き出す
// ・歯車 3つ・リオンの けいこ・時のまぼろしは 数えない 形（図鑑・魔物の 数・配合に 出ない。addTokei6Hidden）

const BOSS_STATUS = { sleep: 0, poison: 0.3, confuse: 0, blind: 0.3, silence: 0.2, paralyze: 0 };
const SPAR_STATUS = { sleep: 0.2, poison: 0.4, confuse: 0.2, blind: 0.4, silence: 0.4, paralyze: 0.2 };
export const ZENMAI = 'zenmai';
export const TOKEI6_BOSSES = [ZENMAI];
// 歯車（弱点 → 魔物の ID）
export const ZEN_GEARS = { ice: 'zen_gear_fire', bolt: 'zen_gear_water', light: 'zen_gear_shadow' };
export const RION_SPARS = ['rion_spar1', 'rion_spar2', 'rion_spar3'];
// 時のまぼろし（第6章の ボスの 強い すがた。1日ごとに かわる。world/tokei-phantom.js）
export const TOKI_PHANTOM_BASES = ['sand_clock', 'geardon', 'star_eater', 'pendula', 'carillon', ZENMAI];
export const tokiPhantomId = (base) => `toki_ph_${base}`;

export const MONSTERS_TOKEI6 = {
  // ── 時計塔 6〜10階（ゆうれい・精・からくり・草。Lv66〜68）──
  // 時計ゆうれい: 顔が かいちゅう時計の ゆうれい。ぼろの マントと くさりを ひきずる
  tokei_ghost: {
    name: '時計ゆうれい', lv: 67, hp: 1720, mp: 200, str: 240, def: 200, agi: 160, mag: 300, exp: 2150, gold: 860,
    race: 'undead', size: 'm', flying: true, hit: 'claw', region: 6,
    resist: { light: 1.4, dark: 0.3, ice: 0.8, fire: 1.1, poison: 0, sleep: 0.3, confuse: 0.4 }, drops: { common: ['magic_water', 12], rare: ['p6_kodai_robe', 80] },
    actions: [{ w: 3, id: 'm6z_gh_touch' }, { w: 2, id: 'm6z_gh_wail', cond: 'notRecent:m6z_gh_wail' }, { w: 2, id: 'm6z_gh_steal', cond: 'notRecent:m6z_gh_steal' }, { w: 1, id: 'attack' }],
    desc: '顔がかいちゅう時計のゆうれい。止まった時計塔を、くさりを引きずってさまよう。時をうばって、動きをおそくする。光がよく効く。',
  },
  // かねの精: 小さな 金の かねの 中に すむ 精。かねを ゆらして 仲間を いやす
  bell_sprite: {
    name: 'かねの精', lv: 67, hp: 1600, mp: 260, str: 220, def: 210, agi: 180, mag: 320, exp: 2100, gold: 880,
    race: 'spirit', size: 's', flying: true, hit: 'bash', region: 6,
    resist: { bolt: 1.35, light: 0.6, wind: 0.8, dark: 0.9, poison: 0.3, sleep: 0.5, confuse: 0.3 }, drops: { common: ['magic_water', 12], rare: ['p6_kodai_hat', 80] },
    actions: [{ w: 3, id: 'm6z_bs_chime' }, { w: 2, id: 'm6z_bs_heal', cond: ['allyHurt', 'notRecent:m6z_bs_heal'] }, { w: 2, id: 'm6z_bs_ring', cond: 'notRecent:m6z_bs_ring' }, { w: 1, id: 'attack' }],
    desc: '小さな金のかねの中にすむ精。かねの音で、仲間のキズをいやし、敵の目を回す。雷がよく効く。',
  },
  // 秒針の精: 時計の 秒針から 生まれた、すばやい 精（ゆがみの精の 絵の 色がえ）
  second_sprite: {
    name: '秒針の精', lv: 66, hp: 1500, mp: 180, str: 236, def: 190, agi: 214, mag: 280, exp: 2000, gold: 820,
    race: 'spirit', size: 's', flying: true, hit: 'bash', region: 6, art: 'warp_wisp', tint: { hueTo: 46, sat: 1.1, light: 1.05 },
    resist: { dark: 1.3, light: 0.7, bolt: 0.8, wind: 0.8, poison: 0.3, sleep: 0.4, confuse: 0.4 }, drops: { common: ['jou_herb', 10], rare: ['p6_kodai_dagger', 80] },
    actions: [{ w: 3, id: 'm6z_ss_tick' }, { w: 2, id: 'm6z_ss_rain', cond: 'notRecent:m6z_ss_rain' }, { w: 1, id: 'm6z_ss_haste', cond: 'notRecent:m6z_ss_haste' }, { w: 1, id: 'attack' }],
    desc: '時計の秒針から生まれた精。チクタクと、目にもとまらぬ速さで、針でつついてくる。闇がよく効く。',
  },
  // 大時計の番人: むねに 大きな 文字ばんの ある、からくりの 大男。めったに 姿を 見せない
  clock_golem: {
    name: '大時計の番人', lv: 68, hp: 3400, mp: 120, str: 312, def: 300, agi: 84, mag: 200, exp: 3600, gold: 1500,
    race: 'material', size: 'l', hit: 'bash', region: 6,
    resist: { bolt: 1.3, fire: 0.7, ice: 0.8, wind: 0.7, dark: 0.8, poison: 0, sleep: 0.2, confuse: 0.2, paralyze: 0.3 }, drops: { common: ['jou_herb', 10], rare: ['p6_kodai_shield', 80] },
    actions: [{ w: 3, id: 'm6z_cg_pound' }, { w: 2, id: 'm6z_cg_alarm', cond: 'notRecent:m6z_cg_alarm' }, { w: 1, id: 'm6z_cg_guard', cond: 'notRecent:m6z_cg_guard' }, { w: 2, id: 'attack' }],
    desc: 'むねに大きな文字ばんのある、からくりの大男。時計塔の心臓を、ずっと守ってきた。めったに姿を見せない。雷がよく効く。',
  },
  // ぜんまい草: くるくる まいた わか葉（ぜんまい）の 草の 魔物。わか葉を ばねの ように のばす
  zenmai_fern: {
    name: 'ぜんまい草', lv: 66, hp: 1800, mp: 160, str: 262, def: 202, agi: 140, mag: 240, exp: 2050, gold: 840,
    race: 'plant', size: 'm', hit: 'bash', region: 6,
    resist: { fire: 1.4, ice: 0.9, wind: 0.8, bolt: 0.8, poison: 0.3, sleep: 0.4, confuse: 0.5 }, drops: { common: ['jou_herb', 10], rare: ['p6_kodai_whip', 80] },
    actions: [{ w: 3, id: 'm6z_zf_whip' }, { w: 2, id: 'm6z_zf_spring', cond: 'notRecent:m6z_zf_spring' }, { w: 2, id: 'm6z_zf_spore', cond: 'notRecent:m6z_zf_spore' }, { w: 1, id: 'attack' }],
    desc: 'くるくるまいたわか葉の草。まいたわか葉を、ばねのようにびよーんとのばしてたたく。ほうしでねむらせる。炎がよく効く。',
  },
  // ねじまき小あくま: せなかに ねじまきの かぎが ささった 小さな あくま（小あくまの 絵の 色がえ）
  wind_devil: {
    name: 'ねじまき小あくま', lv: 66, hp: 1550, mp: 200, str: 244, def: 182, agi: 192, mag: 290, exp: 2000, gold: 860,
    race: 'demon', size: 's', flying: true, hit: 'claw', region: 6, art: 'koakuma', artScale: 1.15, tint: { hueTo: 38, sat: 0.9, light: 1.0 },
    resist: { light: 1.35, dark: 0.5, fire: 0.9, poison: 0.4, sleep: 0.4, confuse: 0.3 }, drops: { common: ['magic_water', 12], rare: ['p6_kodai_fan', 80] },
    actions: [{ w: 3, id: 'm6z_wd_key' }, { w: 2, id: 'm6z_wd_dark', cond: 'notRecent:m6z_wd_dark' }, { w: 1, id: 'm6z_wd_wind', cond: 'notRecent:m6z_wd_wind' }, { w: 1, id: 'attack' }],
    desc: 'せなかにねじまきのかぎがささった、小さなあくま。仲間のねじをまいて、力を上げる。光がよく効く。',
  },
  // からくりがいこつ: 歯車と ばねで うごく ほねの 兵（がいこつの 絵の 色がえ）。1回だけ くみ上がって 起き上がる
  clock_bones: {
    name: 'からくりがいこつ', lv: 66, hp: 1560, mp: 80, str: 272, def: 228, agi: 122, mag: 120, exp: 2050, gold: 840,
    race: 'undead', size: 'm', hit: 'slash', region: 6, art: 'skeleton', artScale: 1.1, tint: { hueTo: 40, sat: 0.7, light: 0.95 },
    revive: { hp: 0.3, not: ['fire', 'light'] },
    resist: { light: 1.35, fire: 1.2, dark: 0.4, bolt: 1.0, poison: 0, sleep: 0, confuse: 0.4 }, drops: { common: ['jou_herb', 10], rare: ['p6_kodai_sword', 80] },
    actions: [{ w: 3, id: 'm6z_cb_slash' }, { w: 2, id: 'm6z_cb_rattle', cond: 'notRecent:m6z_cb_rattle' }, { w: 2, id: 'attack' }],
    desc: '歯車とばねでうごく、ほねの兵。たおしても、1回だけカタカタとくみ上がって起き上がる。炎か光でとどめをさそう。',
  },

  // ── 10階: 影の時計師ゼンマイ（ボス。Lv68。2だん）──
  // ch6.zen … しかけ（battle-tokei6.js）
  //   order … 1だんめの しかけの じゅんばん / stages … しかけ ごとの 数（battle-ch6.js・battle-road.js・battle-tokei.js の 形の まま）
  //   p2At … 2だんめに なる HP / hand … 2だんめの 針（max … 大ほうかいの 時・back … 歯車で もどる 時間・revive … 歯車が また 動き出すまでの ゼンマイの 行動）
  [ZENMAI]: {
    name: 'ゼンマイ', lv: 68, hp: 49500, mp: 3000, str: 1020, def: 250, agi: 124, mag: 700, exp: 42000, gold: 12000,
    race: 'human', size: 'xl', boss: true, turns: 1, speed: 0.96, hit: 'slash', drops: { boss: ['p6z_zenmai_charm'], rare: ['p6z_zenmai_staff', 1] },
    resist: { ...BOSS_STATUS, light: 1.1, dark: 0.6, ice: 0.9, fire: 0.9, wind: 0.9, bolt: 1.0, blast: 1.0 },
    minionsFall: Object.values(ZEN_GEARS), fallMsg: '歯車たちも、くだけて消えた！',
    ch6: {
      kind: 'zen',
      zen: {
        order: ['sand', 'gear', 'pend', 'bell'],
        stages: {
          // ice: 0 … 氷で 砂は もどらない（前ぶれの 間に 当てると 止まる だけ。もどせると いつまでも 次へ 進まない）
          sand: { max: 3, ice: 0, stopTo: 2 },
          gear: { every: 2, wind: 3, need: 2, cut: 0.75 },
          pend: { reach: 2, ally: [1.25, 0.75], boss: [0.75, 1.4], stop: 2 },
          bell: { every: 4, mult: 1.2, ignoreDef: 0.3 },
        },
        p2At: 0.5,
        hand: { start: 4, max: 12, back: 3, revive: 6, warn: 10 },
        collapse: { mult: 2.25, ignoreDef: 0.6 },
      },
    },
    actions: [
      { w: 2, id: 'attack' }, { w: 3, id: 'm6z_zm_hand' }, { w: 2, id: 'm6z_zm_spring', cond: 'notRecent:m6z_zm_spring' },
      { w: 2, id: 'm6z_zm_shadow', cond: 'notRecent:m6z_zm_shadow' }, { w: 1, id: 'm6z_zm_slow', cond: 'notRecent:m6z_zm_slow' },
    ],
    phases: [
      { hpBelow: 0.5, msg: ['ゼンマイ「…よかろう。時計塔の心臓を、動かしてやる…！」', '文字ばんの針が、ギリ…ギリ…と動き出した！'], addActions: [{ w: 2, id: 'm6z_zm_twin', cond: 'notRecent:m6z_zm_twin' }] },
      { hpBelow: 0.2, msg: ['ゼンマイのぜんまいが、のびきり始めた…！', '守りが弱くなった！'], debuff: { def: 0.8 } },
    ],
    desc: '影の時計師。止まった時計塔のあるじ。家来たちの力を、じゅんばんに使ってくる。本気になると、文字ばんの針が動くたびに進み、12時で「時の大ほうかい」。まわりの歯車を弱点でこわすと、針がもどる。',
  },
};

// ── 数えない 形（図鑑・魔物の 数・配合に 出ない。MONSTERS[id] は ふつうに 引ける）──
const GEAR = (name, weak, hueTo, light) => ({
  name, lv: 68, hp: 600, mp: 0, str: 0, def: 420, agi: 1, mag: 0, exp: 0, gold: 0,
  race: 'material', size: 's', speed: 0.001, hit: 'bash', noBefriend: true, zenGear: weak, art: 'zen_gear', tint: { hueTo, sat: 1.0, light },
  resist: { sleep: 0, poison: 0, confuse: 0, blind: 0, silence: 0, paralyze: 0, fire: 0.1, ice: 0.1, bolt: 0.1, light: 0.1, dark: 0.1, wind: 0.1, blast: 0.1, void: 0.1, [weak]: 2.2 },
  drops: {}, actions: [{ w: 1, id: 'm6z_gr_turn' }],
});
const SPAR = (lv, hp, str, def, agi, extra) => ({
  name: 'リオン', lv, hp, mp: 400, str, def, agi, mag: 160, exp: lv * 120, gold: 0,
  race: 'human', size: 'm', boss: true, turns: 1, speed: 1, hit: 'slash', noBefriend: true, person: 'rion', drops: {},
  resist: { ...SPAR_STATUS, light: 0.85, dark: 1.1 },
  desc: '最初の紋章の勇者。千年前の泉の里で、剣のけいこをしている。けいこでも、手かげんはしない。',
  ...extra,
});
export const TOKEI6_HIDDEN = {
  // ゼンマイの まわりの 歯車（2だんめ。弱点 ちがいの 3つ）
  [ZEN_GEARS.ice]: { ...GEAR('ほのおの歯車', 'ice', 8, 1.05), desc: 'ゼンマイのまわりで回る、赤い歯車。氷でしかこわれにくい。' },
  [ZEN_GEARS.bolt]: { ...GEAR('水の歯車', 'bolt', 205, 1.0), desc: 'ゼンマイのまわりで回る、青い歯車。雷でしかこわれにくい。' },
  [ZEN_GEARS.light]: { ...GEAR('影の歯車', 'light', 285, 0.8), desc: 'ゼンマイのまわりで回る、むらさきの歯車。光でしかこわれにくい。' },
  // リオンの けいこ（1人で 戦う。だんだん 強く なる）
  rion_spar1: SPAR(64, 3000, 320, 180, 140, {
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm6s_rn_slash' }, { w: 1, id: 'm6s_rn_guard', cond: 'notRecent:m6s_rn_guard' }],
  }),
  rion_spar2: SPAR(68, 4400, 390, 200, 158, {
    actions: [{ w: 3, id: 'attack' }, { w: 2, id: 'm6s_rn_slash' }, { w: 2, id: 'm6s_rn_crest', cond: 'notRecent:m6s_rn_crest' }, { w: 1, id: 'm6s_rn_guard', cond: 'notRecent:m6s_rn_guard' }],
    phases: [{ hpBelow: 0.4, msg: ['リオン「まだまだ…！」', 'リオンの剣に、光がやどった！攻撃力が上がった！'], buff: { atk: 1.12 } }],
  }),
  rion_spar3: SPAR(72, 5800, 425, 215, 172, {
    actions: [
      { w: 3, id: 'attack' }, { w: 2, id: 'm6s_rn_slash' }, { w: 2, id: 'm6s_rn_crest', cond: 'notRecent:m6s_rn_crest' },
      { w: 1, id: 'm6s_rn_guard', cond: 'notRecent:m6s_rn_guard' }, { w: 1, id: 'm6s_rn_charge', cond: 'notRecent:m6s_rn_charge' },
    ],
    phases: [{ hpBelow: 0.5, msg: ['リオン「…ここからが、本気だ！」', 'リオンの手の紋章が、まぶしく光った！攻撃力が上がった！'], buff: { atk: 1.15 } }],
  }),
};

// 時のまぼろし: 第6章の ボスの 強い すがた（もとの しかけの まま。強さは かけ算。落とし物は world/tokei-phantom.js が 1日1回）
// ボスごとに 少し ちがう（もとの 強さが ちがう ので。tools/sim-ch6.mjs の phantom で Lv72 の 知っている 人が 6〜8わり くらい）
const PH_K = { lv: 6, hp: 1.55, str: 1.18, mag: 1.18, def: 1.1, exp: 1.2 };
export const TOKI_PHANTOM_K = {
  sand_clock: { ...PH_K, lv: 14, hp: 1.9, str: 1.28, mag: 1.28 },
  geardon: PH_K,
  star_eater: { ...PH_K, lv: 9, hp: 1.9, str: 1.25, mag: 1.25 },
  pendula: PH_K,
  carillon: PH_K,
  zenmai: { ...PH_K, lv: 4, hp: 1.2, str: 1.07, mag: 1.07, def: 1.05 },
};
const PH_TINT = { hueTo: 268, sat: 0.75, light: 0.92 };

// monsters.js が よぶ（もとの ボスが そろった あと）。何回 よんでも おなじ
export function addTokei6Hidden(table) {
  const put = (id, m) => {
    if (Object.prototype.hasOwnProperty.call(table, id)) return;
    Object.defineProperty(table, id, { value: { noBefriend: true, ...m }, enumerable: false, configurable: true, writable: true });
  };
  for (const [id, m] of Object.entries(TOKEI6_HIDDEN)) put(id, m);
  for (const base of TOKI_PHANTOM_BASES) {
    const m = table[base];
    const K = TOKI_PHANTOM_K[base] || PH_K;
    if (!m) continue;
    put(tokiPhantomId(base), {
      ...m,
      name: `${m.name}のまぼろし`, lv: m.lv + K.lv,
      hp: Math.round(m.hp * K.hp), str: Math.round(m.str * K.str), mag: Math.round((m.mag || 0) * K.mag), def: Math.round(m.def * K.def),
      exp: Math.round(m.exp * K.exp), gold: 0, drops: {},
      art: m.art || base, tint: PH_TINT, base,
      desc: `止まった時の間にあらわれる、${m.name}のまぼろし。もとのすがたより、ずっと強い。しかけは、もとのまま。`,
    });
  }
}

// レアの ドロップは 千年前の 里の 店の 装備（種は 第50回の 上限に とどいて いる。test/seeds-r50.test.js）
// 素材の ドロップ（loot.js の MAT_DROPS に まぜる）。第6章の 素材（時の砂・古い歯車。れん金で 使う）
export const TOKEI6_MAT_DROPS = {
  tokei_ghost: ['p6_time_sand', 4],
  bell_sprite: ['p6_old_gear', 4],
  second_sprite: ['p6_time_sand', 4],
  clock_golem: ['p6_old_gear', 2],
  zenmai_fern: ['p6_time_sand', 3],
  wind_devil: ['p6_old_gear', 4],
  clock_bones: ['p6_old_gear', 3],
  // 時のまぼろし（1日1回の ごほうびとは べつに、ときどき 落とす）
  ...Object.fromEntries(TOKI_PHANTOM_BASES.map((b) => [tokiPhantomId(b), ['p6z_phantom_sand', 3]])),
};
