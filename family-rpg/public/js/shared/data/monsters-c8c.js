// 第2部 第8章 第3幕「くろがねの 空中ようさい」（Step 5・6）の 魔物と、ボス 2体（B: 戦い。docs/plan-ch8.md の 8）
// monsters.js（MONSTERS）・loot.js（MAT_DROPS）が まぜる。ここは ほかの データを import しない（じゅんかんを さける）
// え は client/render/c8c-art.js。ボスの しかけは shared/battle-c8c.js（battle-c8b.js から よぶ）
//
// 出現表（encounters-c8c.js）: t8c_fort＝くろがねの 空中ようさい 1〜4階（Lv86〜88）・t8c_deep＝5〜8階（Lv88〜90）
// 手下の 魔物 5しゅ（どれも 仲間に なる）。家族が えらんだ 出どころ: マリオの クッパ軍団（名前は もじる。今 いる ノコノコ・アイスブロス・
//   キラー・ジュゲム・テレサ などと 名前も しゅるいも かぶらない）
//   新しい 絵 3しゅ: トンカチブロス（ドラゴン E。ハンマーブロスが もと）・ブリキクッパ（ドラゴン D。メカクッパが もと。ゼンマイの おもちゃ）・
//     ドッシーン（物質 C。ドッスンが もと。いかった 顔の 石の かたまり）
//   今の 絵の 色がえ 2しゅ: メラバブル（せいれい F。マグマから はねる 火の玉〈バブル〉が もと。火こぞうの 色がえ）・
//     ドデカキラー（物質 A。マグナムキラーが もと。キラーの 色がえ・大きい）
//   ランクは 出やすさ（encounters-c8c.js の 重み）と 仲間に なりやすさ（companions-c8c.js の rate）で きまる（tools/gen-monster-ranks.mjs）
//   region: 6 … ふつうの 魔物が まれに 落とす「空の レア装備」の 地方（第6章・第7章・第8章 第1・2幕と おなじ）
//
// ・マジカメック（c8_kamek。Step 5 の さいごの 中ボス。Lv88。大魔王の 手下の 魔法使い。カメックが もと）… battle-c8c.js の kamek「でっかくなあれ」
//   子分 2ひき（トンカチブロス・ブリキクッパ）を つれて いる。grow.every 回 動く たびに、子分 1ぴきに「でっかくなあれ」の 魔法。
//   その 2つ前の 番から、ねらった 子分の 足もとに 魔法じん（前ぶれ）。魔法が かかる 前に その 子分を たおすと、魔法は から回り（あれれ？）。
//   魔法が かかると 子分は「デカ〜」（HP grow.hp・攻撃力 grow.atk・みんなを ふみつける）。魔法じんの 上の 子分は うける ダメージ grow.soft ばい。
//   から回りした 魔法は はね返って、マジカメックが「ちびカメック」に（tiny.turns 回 動く 間 うける ダメージ tiny.k ばい）。
//   子分が 2ひき より へると「出てこい、子分たち！」（summon。そのあと summonCd 回は よばない）。
//   HP が broomAt より へると、ほうきに のって 空へ（え は コマ 2・3。魔法が はやく なる … grow.broomEvery）。
//   マジカメックが たおれると、子分たちは にげて いく（minionsFall）
// ・初代大魔王クッパード（c8_bowser。第3幕の さいごの ボス。Lv90。2だん）… battle-c8c.js の bowser「ギガクッパード」
//   1だんめ（ふつう）: pound.every 回 動く たびに「ドッスンヒップドロップ」（高く とび上がる 前ぶれ → みんなに 物理の 大技。身を 守ると 半分）
//   HP が gigaAt + 0.07 より へると、かけらが 光る（前ぶれ）。gigaAt より へると、次の 番に「ギガクッパード」（それまで HP は gigaAt より 下がらない）
//   2だんめ（ギガ。え は コマ 2・3）: うける ダメージ giga.cut ばい（かたい）。giga.every 回 動く たびに「ギガほのお」（みんなに 炎の 大技。守ると 半分）。
//     ギガに なると、ようさいの 大橋の「橋のオノ」（c8_axe。べつの 敵。HP は たたく 回数）が あらわれる。
//     オノを ぶきで axeHits 回 たたくと 橋が おちて、クッパードは 下へ おちて ふつうの 大きさに もどる（fall の ダメージ・1回 動けない）。
//     giga.regrow 回 動くと、また ギガに なる（オノも また あらわれる）。オノは 呪文では うごかない
// ・ボスの え は 今までの ボスの 2倍の こまかさ（size は 2倍・artScale: 0.5。docs/plan-ch7.md の 4-4）。
//   マジカメックの ほうきの すがた・ギガクッパードは おなじ え の コマ 2・3（client/battle-c8c.js の c8cSprite）

const BOSS_STATUS = { sleep: 0, poison: 0.3, confuse: 0, blind: 0.3, silence: 0.2, paralyze: 0 };
const PART_RESIST = { sleep: 0, poison: 0, confuse: 0, blind: 0, silence: 0, paralyze: 0 };
export const C8_KAMEK = 'c8_kamek';
export const C8_BOWSER = 'c8_bowser';
export const C8_AXE = 'c8_axe';
export const C8C_BOSSES = [C8_KAMEK, C8_BOWSER];
// 第8章 第3幕の 手下の 魔物（仲間に なる 5しゅ）
export const C8C_MINIONS = ['mera_bubble', 'tonkachi_bro', 'buriki_koopa', 'dosshiin', 'dodeka_killer'];
// マジカメックの 子分（でっかくなあれの あいて。たたかいの はじめから 2ひき）
export const KAMEK_KIDS = ['tonkachi_bro', 'buriki_koopa'];
// ギガクッパードの 行動（ギガに なると 入れかわる・ちぢむと もどる）
export const GIGA_ACTIONS = [
  { w: 3, id: 'm8b_gstomp' }, { w: 2, id: 'm8b_gbreath', cond: 'notRecent:m8b_gbreath' }, { w: 1, id: 'm8b_groar', cond: 'notRecent:m8b_groar' }, { w: 1, id: 'attack' },
];
export const BOWSER_ACTIONS = [
  { w: 3, id: 'm8b_claw' }, { w: 2, id: 'm8b_breath', cond: 'notRecent:m8b_breath' }, { w: 2, id: 'm8b_shell', cond: 'notRecent:m8b_shell' }, { w: 1, id: 'attack' },
];
// でっかくなった 子分が ふえる 行動
export const GIGA_KID_ACTION = { w: 3, id: 'm8k_kstomp' };
export const GIGA_NAME = 'ギガクッパード';

export const MONSTERS_C8C = {
  // ── くろがねの 空中ようさい 1〜4階（Lv86〜88）──
  // メラバブル: ようさいの マグマの 炉から ぴょーんと はねる 火の玉（マリオの バブルが もと。火こぞうの 絵の 色がえ。オレンジ）
  mera_bubble: {
    name: 'メラバブル', lv: 86, hp: 2240, mp: 260, str: 256, def: 236, agi: 250, mag: 400, exp: 4200, gold: 1420,
    race: 'spirit', size: 's', flying: true, hit: 'claw', region: 6, art: 'fire_imp', artScale: 1.0, tint: { hueTo: 28, sat: 1.1, light: 1.18 },
    resist: { fire: 0.3, ice: 1.35, wind: 1.0, bolt: 1.0, light: 1.0, dark: 0.9, poison: 0.3, sleep: 0.5, confuse: 0.5 }, drops: { common: ['magic_water', 12], rare: ['c7i_snow_robe', 80] },
    actions: [{ w: 3, id: 'm8n_mb_hop' }, { w: 2, id: 'm8n_mb_magma', cond: 'notRecent:m8n_mb_magma' }, { w: 1, id: 'm8n_mb_bounce', cond: 'notRecent:m8n_mb_bounce' }, { w: 1, id: 'attack' }],
    desc: 'ようさいのマグマのかまから、ぴょーんととび出す火の玉。あつくて、さわれない。氷がよく効く。',
  },
  // トンカチブロス: トンカチを 次々に なげる カメの 兄弟（マリオの ハンマーブロスが もと）
  tonkachi_bro: {
    name: 'トンカチブロス', lv: 86, hp: 2300, mp: 120, str: 300, def: 268, agi: 214, mag: 200, exp: 4240, gold: 1430,
    race: 'dragon', size: 'm', hit: 'bash', region: 6,
    resist: { bolt: 1.3, fire: 1.0, ice: 1.0, wind: 1.0, dark: 1.0, light: 1.0, poison: 0.5, sleep: 0.5, confuse: 0.6 }, drops: { common: ['toku_herb', 10], rare: ['c7i_snow_helm', 80] },
    actions: [{ w: 3, id: 'm8n_tb_throw' }, { w: 2, id: 'm8n_tb_jump', cond: 'notRecent:m8n_tb_jump' }, { w: 1, id: 'm8n_tb_rain', cond: 'notRecent:m8n_tb_rain' }, { w: 1, id: 'attack' }],
    desc: 'トンカチを、次々になげてくるカメの兄弟。ぴょんぴょんはねながら、こちらのようすを見ている。雷がよく効く。',
  },
  // ブリキクッパ: せなかの ゼンマイで 走る、大魔王の おもちゃ（マリオの メカクッパが もと）
  buriki_koopa: {
    name: 'ブリキクッパ', lv: 87, hp: 2280, mp: 100, str: 308, def: 300, agi: 190, mag: 160, exp: 4300, gold: 1450,
    race: 'dragon', size: 's', hit: 'bite', region: 6,
    resist: { bolt: 1.4, fire: 0.8, ice: 1.0, wind: 1.0, dark: 1.0, light: 1.0, poison: 0, sleep: 0, confuse: 0.4 }, drops: { common: ['holy_water', 12], rare: ['c7i_snow_mail', 80] },
    actions: [{ w: 3, id: 'm8n_bk_bite' }, { w: 2, id: 'm8n_bk_dash', cond: 'notRecent:m8n_bk_dash' }, { w: 1, id: 'm8n_bk_wind', cond: 'notRecent:m8n_bk_wind' }, { w: 1, id: 'attack' }],
    desc: 'せなかのゼンマイで、カタカタ走る大魔王のおもちゃ。何でもガブガブかじる。ゼンマイが切れると止まる。雷がよく効く。',
  },

  // ── くろがねの 空中ようさい 5〜8階（Lv88〜90）──
  // ドッシーン: 天井から ドッシーンと おちてくる、いかった 顔の 石の かたまり（マリオの ドッスンが もと）
  dosshiin: {
    name: 'ドッシーン', lv: 88, hp: 2420, mp: 80, str: 326, def: 360, agi: 120, mag: 120, exp: 4480, gold: 1500,
    race: 'material', size: 'm', flying: true, hit: 'bash', region: 6,
    resist: { blast: 1.35, fire: 0.8, ice: 0.8, bolt: 1.0, wind: 1.0, dark: 1.0, light: 1.0, poison: 0, sleep: 0.3, confuse: 0.3 }, drops: { common: ['moon_drop', 18], rare: ['c7i_snow_gi', 80] },
    actions: [{ w: 3, id: 'm8n_ds_drop' }, { w: 2, id: 'm8n_ds_quake', cond: 'notRecent:m8n_ds_quake' }, { w: 1, id: 'm8n_ds_glare', cond: 'notRecent:m8n_ds_glare' }, { w: 1, id: 'attack' }],
    desc: '天井から、ドッシーンとおちてくる石のかたまり。いつも、おこった顔をしている。ばくはつがよく効く。',
  },
  // ドデカキラー: ようさいの 大ほうから とんでくる、とても 大きな 黒い たま（マリオの マグナムキラーが もと。キラーの 絵の 色がえ・大きい）。めったに 見ない
  dodeka_killer: {
    name: 'ドデカキラー', lv: 89, hp: 2480, mp: 60, str: 332, def: 320, agi: 200, mag: 100, exp: 4700, gold: 1560,
    race: 'material', size: 'l', flying: true, hit: 'bash', region: 6, art: 'killer', artScale: 1.45, tint: { hueTo: 230, sat: 0.35, light: 0.8 },
    resist: { bolt: 1.35, fire: 0.9, ice: 1.0, wind: 1.0, dark: 0.8, light: 1.0, poison: 0, sleep: 0, confuse: 0.3 }, drops: { common: ['elf_drink', 30], rare: ['c7i_snow_dagger', 80] },
    actions: [{ w: 3, id: 'm8n_dk_rush' }, { w: 2, id: 'm8n_dk_boom', cond: 'notRecent:m8n_dk_boom' }, { w: 1, id: 'm8n_dk_aim', cond: 'notRecent:m8n_dk_aim' }, { w: 1, id: 'attack' }],
    desc: 'ようさいの大ほうから、まっすぐとんでくる大きな黒いたま。キラーの何ばいも大きい。めったに姿を見せない。雷がよく効く。',
  },

  // ── Step 5 の さいご: マジカメック（中ボス。Lv88。子分 2ひきと いっしょ）──
  // c8c … しかけ（battle-c8c.js）
  //   grow … でっかくなあれ（every … 魔法までの 行動・broomEvery … ほうきの あと・aimAt … 魔法じんが 出る しるしの のこり・hp・atk … でっかくなった 子分の HP・攻撃力・def … 守りの ばい・soft … 魔法じんの 上の 子分の ダメージ）/
  //   tiny … ちびカメック（turns … 動く 数・k … ダメージの ばい）/
  //   summon … 子分を よぶ（kids … よぶ 魔物・cd … よんだ あと よばない 行動の 数・hp … 子分の HP の ばい〈魔法で 少し じょうぶ〉）/ broomAt … ほうきに のる HP
  [C8_KAMEK]: {
    name: 'マジカメック', lv: 88, hp: 124000, mp: 6000, str: 1180, def: 300, agi: 250, mag: 960, exp: 76000, gold: 22000,
    race: 'dragon', size: 'xl', boss: true, turns: 1, speed: 1.1, hit: 'bash', artScale: 0.5,
    drops: { boss: ['c8k_magic_charm'], bonus: ['limit_stone'], rare: ['c8k_magic_staff', 1] },
    resist: { ...BOSS_STATUS, bolt: 1.2, light: 1.15, dark: 0.7, fire: 1.0, ice: 1.0, wind: 1.0 },
    minionsFall: KAMEK_KIDS, fallMsg: '子分たちは、あわてて、にげていった！',
    c8c: {
      kind: 'kamek',
      grow: { every: 4, broomEvery: 3, aimAt: 2, hp: 21000, atk: 1700, def: 1.2, soft: 2 },
      tiny: { turns: 2, k: 2 },
      summon: { kids: KAMEK_KIDS, cd: 2, hp: 1.15 },
      broomAt: 0.5,
    },
    actions: [
      { w: 3, id: 'm8k_shapes' }, { w: 2, id: 'm8k_spark', cond: 'notRecent:m8k_spark' }, { w: 1, id: 'm8k_shrink', cond: 'notRecent:m8k_shrink' }, { w: 1, id: 'attack' },
    ],
    desc: '大魔王の手下の魔法使い。めがねをかけて、ほうきで空をとぶ。魔法で、子分を大きくしてしまう。',
  },

  // ── Step 6 の さいご: 初代大魔王クッパード（第3幕の さいごの ボス。Lv90。2だん）──
  // c8c … しかけ（battle-c8c.js）
  //   pound … ドッスンヒップドロップ（every … 大技までの 行動・mult・ignoreDef）/ gigaAt … ギガに なる HP /
  //   giga … ギガの すがた（atk … 上がる 攻撃力・cut … うける ダメージの ばい・every … ギガほのおまでの 行動・base … ギガほのおの 強さ・
  //     regrow … おちて もどってから また ギガに なるまでの 行動・fall … おちた ときの ダメージ〈最大HPの わりあい〉・axeHits … オノを たたく 回数）
  [C8_BOWSER]: {
    name: '初代大魔王クッパード', short: 'クッパード', lv: 90, hp: 109000, mp: 6000, str: 1520, def: 320, agi: 200, mag: 900, exp: 90000, gold: 30000,
    race: 'dragon', size: 'xl', boss: true, turns: 1, speed: 0.95, hit: 'bash', artScale: 0.5,
    drops: { boss: ['c8w_king_charm'], bonus: ['limit_stone'], rare: ['c8w_king_claw', 1] },
    // 水は ふつう（water.js の WATER_OVERRIDE。炎の 魔物の きまりで 水に 弱く ならない ように。しかけは 橋の オノ）
    resist: { ...BOSS_STATUS, fire: 0.5, ice: 1.25, bolt: 1.1, light: 1.1, dark: 0.8, wind: 1.0 },
    minionsFall: [C8_AXE], fallMsg: 'クッパードがたおれて、橋のオノも、ガラガラとくずれおちた！',
    c8c: {
      kind: 'bowser',
      pound: { every: 3, mult: 1.0, ignoreDef: 0.3 },
      gigaAt: 0.5,
      giga: { atk: 1.12, cut: 0.7, every: 3, base: [560, 600], regrow: 5, fall: 0.05, axeHits: 3 },
    },
    actions: BOWSER_ACTIONS,
    phases: [
      { hpBelow: 0.2, msg: ['クッパードが、ほえた！「ワガハイは、ぜったいに、負けんのだー！」', 'クッパードの攻撃力が上がった！'], buff: { atk: 1.05 } },
    ],
    desc: '千年前の、空の大魔王。くろがねの空中ようさいの王さま。いばりんぼで、ちょっとそそっかしい。黒い星のかけらの力で、ギガクッパードになる。',
  },
};

// ボスの しかけの 部ひん（図鑑・配合には 出ない。monsters.js が addC8cHidden で まぜる）
export const C8C_HIDDEN = {
  // ようさいの 大橋の オノ（ギガクッパードの とき あらわれる。ぶきで たたくと 橋が おちる）
  [C8_AXE]: {
    name: '橋のオノ', lv: 90, hp: 3, mp: 0, str: 0, def: 9999, agi: 1, mag: 0, exp: 0, gold: 0,
    race: 'material', size: 'm', speed: 0.001, hit: 'bash', noBefriend: true, c8axe: true,
    resist: { ...PART_RESIST, fire: 1.0, ice: 1.0, bolt: 1.0, wind: 1.0, light: 1.0, dark: 1.0 },
    drops: {}, actions: [{ w: 1, id: 'm8b_axe_wait' }],
    desc: 'ようさいの大橋をささえる、大きなオノ。ぶきで3回たたくと、橋がおちる。呪文では動かない。',
  },
};

// monsters.js が よぶ。何回 よんでも おなじ
export function addC8cHidden(table) {
  for (const [id, m] of Object.entries(C8C_HIDDEN)) {
    if (Object.prototype.hasOwnProperty.call(table, id)) continue;
    Object.defineProperty(table, id, { value: { ...m }, enumerable: false, configurable: true, writable: true });
  }
}

// 素材の ドロップ（loot.js の MAT_DROPS に まぜる。今の 素材だけ。入手先の 画面に 出る）
// レアの ドロップは 第7章 第3幕の 雪の 村の 店の 防具など（第8章 第1・2幕の 手下が まだ 落とさない 品）
export const C8C_MAT_DROPS = {
  mera_bubble: ['flame_stone', 3],
  tonkachi_bro: ['iron_shard', 4],
  buriki_koopa: ['p6_old_gear', 3],
  dosshiin: ['land_shard', 3],
  dodeka_killer: ['cs_ember_stone', 3],
};
