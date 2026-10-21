// ※※ 仮の ファイル（まとめる 時に 消す）※※ 第6章 Step 1・2（A: 世界と物語）の 仮の データ
// B（戦い・品）の データ（出現表・きまった 戦い・背景・店の 品・宝箱の 中み・ミナモの 強さ）が 入ったら、この ファイルは 消す。
// 消す 時に かえる 所（docs/plan-ch6.md の「実装メモ（A … 世界と物語。第6章 Step 1・2）」の「まとめる時に消すもの」）:
//   ・data/story-ch6.js の `import { MINAMO_GUEST } from './ch6-stub.js';` と `if (!GUESTS.minamo) GUESTS.minamo = MINAMO_GUEST;`（B が data/shops.js で 登録するので 2行とも 消す）
//   ・maps/past.js・maps/toki-shrine.js・maps/toki-ruin.js の `from '../data/ch6-stub.js'`（PAST_TREASURE・PAST_RUIN_FLOORS は '../data/items-past.js' から）
//   ・test/ch6-step12.test.js の `from '../public/js/shared/data/ch6-stub.js'` と、漢字の テストの ファイルの 一覧の ch6-stub.js
//   ・tools/kanji-check.mjs の gameFiles() の ch6-stub.js
//
// 名前の 約束（docs/plan-ch6.md の 9）:
//   出現表 t6_past_field（千年前の フィールド）・t6_shrine（時のほこら）・t6_ruin_up（時のいせき 1〜4階）・t6_ruin_low（5〜7階）
//   きまった 戦い sand_clock・geardon / 背景 past_field・toki_shrine・toki_ruin・toki_ruin_boss / 店 SHOPS_PAST（past_weapon・past_armor・past_item）
//   宝箱 PAST_TREASURE（{ toki_shrine: [...], toki_ruin: [...], overworld_past: [...] }）/ ゲスト MINAMO_GUEST（data/companions-past.js）
// A の マップと 台本が B の 前でも 動いて、テストが 通る ように、今 ある 魔物・品で 作った いちばん 小さな ものを、
// まだ ない ときだけ たす（B の ものが あれば、そちらが つかわれる。上がきは しない）
import { ENCOUNTER_TABLES, FIXED_ENCOUNTERS, ZONE_BG } from './encounters.js';
import { SHOPS } from './shops.js';
import { HANONO9_SHOP_WEAPONS, HANONO9_SHOP_ARMOR, HANONO9_SHOP_TOOLS } from './items-earth.js';

const fill = (to, add) => {
  for (const [k, v] of Object.entries(add)) if (!(k in to)) to[k] = v;
};

// 出現表（今は 影の城の 魔物）
fill(ENCOUNTER_TABLES, {
  t6_past_field: [{ w: 3, group: [['gale_crow', 1, 2]] }, { w: 2, group: [['wind_weasel', 1, 2]] }],
  t6_shrine: [{ w: 3, group: [['ember_wolf', 1, 2]] }, { w: 2, group: [['candle_ghost', 1, 2]] }],
  t6_ruin_up: [{ w: 3, group: [['mill_keeper', 1, 1], ['gale_crow', 0, 1]] }, { w: 2, group: [['mirror_jelly', 1, 2]] }],
  t6_ruin_low: [{ w: 3, group: [['blackflame_knight', 1, 1]] }, { w: 2, group: [['shade_serpent', 1, 1], ['foam_siren', 0, 1]] }],
});

// きまった 戦い（B の サンドクロック・ギアドン。今は まぼろしの 魔物）。曲は A が 作った boss6
fill(FIXED_ENCOUNTERS, {
  sand_clock: { group: [['phantom_storm', 1, 1]], bg: 'castle_wind', bgm: 'boss6', canFlee: false, boss: true },
  geardon: { group: [['phantom_ignia', 1, 1]], bg: 'castle_fire', bgm: 'boss6', canFlee: false, boss: true },
});

// 戦いの 背景（B: past_field・toki_shrine・toki_ruin。今は ある 背景で）
fill(ZONE_BG, { t6_past_field: 'kumoi', t6_shrine: 'castle_fire', t6_ruin_up: 'earth_temple', t6_ruin_low: 'earth_temple_deep' });

// 宝箱の 中み（B の PAST_TREASURE と PAST_RUIN_FLOORS（data/items-past.js）。今は 影の城の ★5 の 品。
// 数は B と おなじ: 時のほこら 6・時のいせき 14（1階ごとに 2つ）・千年前の フィールド 6）
const CS = ['cs_vane_bangle', 'cs_mill_axe', 'cs_whirl_boomerang', 'cs_storm_mantle', 'cs_weasel_claw', 'cs_gale_helm', 'cs_sky_boots', 'cs_flame_shield',
  'cs_blackfire_dagger', 'cs_phoenix_fan', 'cs_ember_gi', 'cs_candle_staff', 'cs_blackfire_mail', 'cs_phoenix_ring', 'cs_mirror_shield', 'cs_tide_spear',
  'cs_ripple_whip', 'cs_pearl_robe', 'cs_tide_crown', 'cs_castle_sword', 'cs_wave_bat', 'cs_alch_sword', 'cs_alch_mail', 'cs_alch_crown', 'ph_storm_bangle', 'ph_ignia_earring'];
export const PAST_TREASURE = { toki_shrine: CS.slice(0, 6), toki_ruin: CS.slice(6, 20), overworld_past: CS.slice(20, 26) };
export const PAST_RUIN_FLOORS = Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((n) => [n, PAST_TREASURE.toki_ruin.slice(2 * n - 2, 2 * n)]));

// ホシフルの里の 店（B の data/shops-past.js の SHOPS_PAST。今は ハネノの ランク9の 品）
fill(SHOPS, {
  past_weapon: { name: 'ホシフルの里の武器屋', kind: 'weapon', keeper: '武器屋のおじさん', hello: 'いらっしゃい。\n里の鉄で打った、自まんの武器だよ。', items: HANONO9_SHOP_WEAPONS },
  past_armor: { name: 'ホシフルの里の防具屋', kind: 'armor', keeper: '防具屋のおばさん', hello: 'いらっしゃい。\n星の糸でぬった防具よ。', items: HANONO9_SHOP_ARMOR },
  past_item: { name: 'ホシフルの里の道具屋', kind: 'item', keeper: '道具屋のむすめ', hello: 'いらっしゃいませ。\n旅のそなえは、ここでどうぞ。', items: HANONO9_SHOP_TOOLS },
});

// ミナモの ゲストの 強さ（B の data/companions-past.js の MINAMO_GUEST。今は 回復の 得意な そうりょ）
export const MINAMO_GUEST = {
  id: 'guest_minamo', name: 'ミナモ', job: 'priest',
  look: { body: 1, hair: 1, hairColor: 4, skin: 0, color: 4 },
  tactics: 'heal', minLevel: 57,
};
