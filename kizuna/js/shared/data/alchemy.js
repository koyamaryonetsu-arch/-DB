// れん金がま（第32回 C。ドラクエ8が もと）の きまり
//
// ・カモメ港に 着いたら（c2_port_seen）、どこかの ふしぎなかじ屋で「れん金がま」（大事な物）を もらえる
// ・メニューの「道具」の いちばん上から 開く。ふくろの 装備や 道具を 2〜3こ 入れると、少し 歩くと できあがる（POT_STEPS）
//   1つの かまで 1回ずつ。できあがると ふくろに 入って 知らせが 出る（world/alchemy.js の alchemySteps）
// ・レシピ（RECIPES）… 本だな・かじ屋の 親方・れん金のメモ で 少しずつ わかる。わかった レシピは かまの 画面で 見られる
//   知らない 組み合わせも 入れられる。当たれば できあがった ときに 新しい レシピと して おぼえる。はずれは 入れられない（もどす）
//   tier … その章（1〜5）。本だなや メモで わかるのは、その章まで 進んだ 人だけ（TIER_FLAG）
// ・同じ 武具を 2つ 入れると、レア度は かわらないが きたえられる 回数（+の 上限）が 1 ふえる（CAP_UP_MAX 回まで。
//   その 装備の しゅるいごと。c.alchemy.cap）。第35回: 店で 買える 装備（★1）は きたえられない ので、これも できない
// ・第35回: 生まれ変わりの 武器の 1だん目は「店の 武器＋素材＋星のかけら」（items-alchemy.js の REBIRTH_START）。
//   第36回: かくさない。本だな・れん金のメモ・かじ屋の 親方で わかる（親方は 生まれ変わりの レシピを 先に 教える）。
//   町の 人・本だな・宝箱・はなす にも ヒント（secret-hints.js）
import { ITEMS, baseItemId } from './items.js?v=909bdfecce1d';
import { UPGRADE_TYPES, CAP_UP_MAX } from './items-forge.js?v=909bdfecce1d';
import { ALCHEMY_POT, ALCHEMY_MEMO, REBIRTH_START } from './items-alchemy.js?v=909bdfecce1d';
import { isShopGear } from './items-rare.js?v=909bdfecce1d';
// 第5章 Step 3・4 の レシピ（items-kumoi.js）
import { KUMOI_RECIPES } from './items-kumoi.js?v=909bdfecce1d';
import { HOSHIYOMI_RECIPES } from './items-hoshiyomi.js?v=909bdfecce1d';
import { EARTH_RECIPES } from './items-earth.js?v=909bdfecce1d';
import { CASTLE_RECIPES } from './items-castle.js?v=909bdfecce1d';
import { PAST_RECIPES } from './items-past.js?v=909bdfecce1d';

export { ALCHEMY_POT, ALCHEMY_MEMO, CAP_UP_MAX };

// かまを もらえる しるし（カモメ港に 着いた）
export const POT_FLAG = 'c2_port_seen';
// その章の レシピが 本だな・メモ・親方で わかる ように なる しるし
export const TIER_FLAG = { 1: null, 2: null, 3: 'c3_start', 4: 'c4_start', 5: 'c4_clear' };
// 同じ 武具を 2つ 入れる（きたえる 回数を ふやす）レシピの ID（はじめから 知っている）
export const MERGE_RECIPE = 'r_merge';

// 第33回: れん金術師の 系統（れん金術師・国家れん金術師・はがねのれん金術師）に 今 ついている 人が
// パーティーに いると、できあがるまでの 歩数が 半分（1歩で 2歩ぶん 進む。world/alchemy.js の potRate）
export const POT_FAST_JOBS = ['alchemist', 'state_alchemist', 'fullmetal'];
export const POT_FAST_RATE = 2;

// できあがるまでの 歩数（道具・素材 30・★2までの 装備 40・★3 50・★4 60・同じ 武具 40）
export function potSteps(out, merge = false) {
  if (merge) return 40;
  const it = ITEMS[out];
  if (!it || it.type === 'use' || it.type === 'mat') return 30;
  const r = it.rarity || 0;
  return r >= 4 ? 60 : r === 3 ? 50 : 40;
}

// レシピ（ins … 入れる 物〈2〜3こ。同じ 物も 2つ 書く〉/ out … できる 物 / tier … 章）
const R = (id, tier, out, ...ins) => ({ id, tier, out, ins });
export const RECIPES = [
  // ── 第1章 ──
  R('r_jou_herb', 1, 'jou_herb', 'herb', 'herb'),
  R('r_panacea', 1, 'panacea', 'herb', 'antidote', 'moonherb'),
  R('r_moonherb', 1, 'moonherb', 'antidote', 'antidote'),
  R('r_holy_water', 1, 'holy_water', 'herb', 'magic_powder'),
  R('r_magic_water', 1, 'magic_water', 'holy_water', 'magic_powder', 'magic_powder'),
  R('r_return_wing', 1, 'return_wing', 'wind_feather', 'wind_feather'),
  R('r_smoke_ball', 1, 'smoke_ball', 'jelly', 'magic_powder'),
  R('r_revive', 1, 'revive_flower', 'moonherb', 'magic_water', 'seed_hp'),
  R('r_silver', 1, 'silver_shard', 'iron_shard', 'iron_shard', 'iron_shard'),
  R('r_fang_spear', 1, 'fang_spear', 'bronze_spear', 'beast_fang', 'beast_fang'),
  R('r_feather_hat', 1, 'feather_hat', 'pointy_hat', 'wind_feather', 'wind_feather'),
  R('r_forest_sage', 1, 'forest_sage_staff', 'treant_staff', 'magic_powder', 'wind_feather'),
  R('r_rock_king', 1, 'rock_king_fist', 'goldoon_fist', 'iron_shard', 'iron_shard'),
  R('r_goldsilver', 1, 'goldsilver_axe', 'gold_axe', 'iron_axe', 'silver_shard'),
  // ── 第2章 ──
  R('r_toku_herb', 2, 'toku_herb', 'jou_herb', 'jou_herb'),
  R('r_elf_drink', 2, 'elf_drink', 'magic_water', 'magic_water', 'seed_mag'),
  R('r_dragon_scale', 2, 'dragon_scale', 'silver_shard', 'silver_shard', 'pretty_shell'),
  R('r_shell_mail', 2, 'shell_mail', 'leather_armor', 'pretty_shell', 'pretty_shell'),
  R('r_wind_brooch', 2, 'wind_brooch', 'fang_charm', 'wind_feather', 'silver_shard'),
  R('r_ocean_whip', 2, 'ocean_whip', 'kraken_whip', 'dragon_scale'),
  R('r_fujin', 2, 'fujin_helm', 'storm_general_helm', 'wind_feather', 'silver_shard'),
  R('r_otohime', 2, 'otohime_shield', 'mermaid_shield', 'pretty_shell', 'pretty_shell'),
  // ── 第3章 ──
  R('r_ice_crystal', 3, 'ice_crystal', 'white_snowball', 'white_snowball', 'white_snowball'),
  R('r_star_iron', 3, 'star_iron', 'dragon_scale', 'dragon_scale', 'star_shard'),
  R('r_flame_axe', 3, 'flame_axe', 'steel_axe', 'flame_stone', 'flame_stone'),
  R('r_frost_robe', 3, 'frost_robe', 'snow_robe', 'ice_crystal', 'ice_crystal'),
  R('r_winter_goddess', 3, 'winter_goddess_robe', 'mammoth_fur', 'ice_crystal', 'ice_crystal'),
  R('r_hephaestus', 3, 'hephaestus_hammer', 'magma_hammer', 'flame_stone', 'flame_stone'),
  R('r_walpurgis', 3, 'walpurgis_broom', 'witch_broom', 'witch_hat'),
  R('r_gae_bolg', 3, 'gae_bolg', 'guardian_halberd', 'star_iron'),
  // ── 第4章 ──
  R('r_ifrit', 4, 'ifrit_sword', 'majin_scimitar', 'dragon_scale', 'flame_stone'),
  R('r_pharaoh', 4, 'pharaoh_staff', 'ankh_staff', 'revive_flower'),
  R('r_mermaid', 4, 'mermaid_dress', 'seawitch_dress', 'pretty_shell', 'pretty_shell'),
  // ── 第5章 ──
  R('r_dragon_slayer', 5, 'dragon_slayer', 'old_fang_sword', 'dragon_scale', 'star_iron'),
  R('r_senrigan', 5, 'senrigan_helm', 'hundred_eye_helm', 'star_shard', 'star_shard'),
  ...KUMOI_RECIPES,
  ...HOSHIYOMI_RECIPES,
  // 第5章 Step 6・7: 大地の根・大地の光石で ★4 → ★5（items-earth.js）
  ...EARTH_RECIPES,
  // 第5章 Step 8: 影の城の 素材（黒い風の羽・影火の石・黒しんじゅ）で ★5 → もっと 強い ★5（items-castle.js）
  ...CASTLE_RECIPES,
  // 第2部 第6章 Step 1・2: 時の砂・古い歯車で ★5 → もっと 強い ★5（items-past.js）
  ...PAST_RECIPES,
  // ── 生まれ変わりの 武器の 1だん目（第35回。第36回から かくさない）──
  ...REBIRTH_START.map((x) => ({ ...R(x.id, 2, x.to, x.from, x.mat, 'star_shard'), reborn: true })),
];
export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
// かまを もらった ときに 教えて もらう レシピ
export const STARTER_RECIPES = ['r_jou_herb', 'r_panacea', 'r_silver'];
// かじ屋の 親方が 教えて くれる レシピ（行く たびに 1つ。facilities.js の FORGES の 場所）
export const KEEPER_RECIPES = {
  // 第36回: 生まれ変わりの 武器の 1だん目も（親方は これを 先に 教える）
  town: ['r_reborn_sword', 'r_reborn_bat', 'r_fang_spear', 'r_feather_hat', 'r_rock_king', 'r_goldsilver'],
  port: ['r_reborn_boomerang', 'r_reborn_staff', 'r_shell_mail', 'r_wind_brooch', 'r_otohime', 'r_dragon_scale'],
  kanatoko: ['r_reborn_bokuto', 'r_flame_axe', 'r_frost_robe', 'r_hephaestus', 'r_star_iron'],
};

// 入れた 物の ならび（もとの 装備の ID で。きたえた 装備も もとの 装備と して あつかう）
const key = (ids) => ids.map((id) => baseItemId(id)).sort().join('|');
const BY_KEY = new Map(RECIPES.map((r) => [key(r.ins), r]));

// その 人の れん金の きろく（ない ときは 空）
export function alchemyOf(c) {
  const a = c?.alchemy;
  return a && typeof a === 'object' ? a : {};
}
export const hasPot = (c) => Array.isArray(c?.keyItems) && c.keyItems.includes(ALCHEMY_POT);
export function knownRecipes(c) {
  const k = alchemyOf(c).known;
  return Array.isArray(k) ? k.filter((id) => RECIPE_BY_ID[id]) : [];
}
export const knowsRecipe = (c, id) => id === MERGE_RECIPE || knownRecipes(c).includes(id);

// その 装備の きたえる 回数が れん金で いくつ ふえているか（0〜CAP_UP_MAX）
export function capUp(c, id) {
  const n = alchemyOf(c).cap?.[baseItemId(id)];
  return Number.isInteger(n) ? Math.max(0, Math.min(CAP_UP_MAX, n)) : 0;
}

// 同じ 武具を 2つ（きたえられる 装備で、もとの 装備が 同じ）
export function isMergePair(ids) {
  if (!Array.isArray(ids) || ids.length !== 2) return false;
  const [a, b] = ids.map((id) => ITEMS[id]);
  return !!a && !!b && UPGRADE_TYPES.includes(a.type) && baseItemId(ids[0]) === baseItemId(ids[1]) && !isShopGear(ITEMS[baseItemId(ids[0])]);
}
// 同じ 店の 武具を 2つ（第35回: 店の 品は きたえられない ので、回数も ふやせない）
function isShopPair(ids) {
  if (!Array.isArray(ids) || ids.length !== 2 || baseItemId(ids[0]) !== baseItemId(ids[1])) return false;
  const it = ITEMS[baseItemId(ids[0])];
  return !!it && UPGRADE_TYPES.includes(it.type) && isShopGear(it);
}

// 入れた 物で 何が できるか
//  { ok: true, recipe, out, merge?, steps } / { ok: false, why }
export function matchPot(ids, c = null) {
  if (!Array.isArray(ids) || ids.length < 2 || ids.length > 3 || ids.some((id) => !ITEMS[id] || ITEMS[id].type === 'key')) return { ok: false, why: 'bad' };
  if (isMergePair(ids)) {
    const base = baseItemId(ids[0]);
    if (capUp(c, base) >= CAP_UP_MAX) return { ok: false, why: 'capMax' };
    // できる 物は きたえた 回数が 多い ほう
    const out = (ITEMS[ids[0]].plus || 0) >= (ITEMS[ids[1]].plus || 0) ? ids[0] : ids[1];
    return { ok: true, recipe: MERGE_RECIPE, out, merge: base, steps: potSteps(out, true) };
  }
  const r = BY_KEY.get(key(ids));
  if (!r || !ITEMS[r.out]) return { ok: false, why: isShopPair(ids) ? 'shop' : 'none' };
  return { ok: true, recipe: r.id, out: r.out, steps: potSteps(r.out) };
}

// その章まで 進んでいるか（hasFlag: その 人の フラグ）
export function tierOpen(tier, hasFlag = () => false) {
  const f = TIER_FLAG[tier];
  return f === undefined ? false : !f || hasFlag(f);
}
// まだ 知らない、その章までの レシピ（本だな・メモ・親方で わかる もの）。章の 早い じゅん
export function learnableRecipes(c, hasFlag = () => false, pool = null) {
  const known = new Set(knownRecipes(c));
  return RECIPES.filter((r) => (!pool || pool.includes(r.id)) && !known.has(r.id) && tierOpen(r.tier, hasFlag) && ITEMS[r.out])
    .sort((a, b) => a.tier - b.tier);
}

// 「薬草＋薬草」
export function insText(ins) {
  return ins.map((id) => ITEMS[id]?.name || id).join('＋');
}
// レシピの 文（「薬草＋薬草 → 上薬草」）
export function recipeText(id) {
  const r = RECIPE_BY_ID[id];
  if (!r) return id === MERGE_RECIPE ? '同じ武具＋同じ武具 → きたえられる回数が1ふえる' : '';
  return `${insText(r.ins)} → ${ITEMS[r.out]?.name || r.out}`;
}

// レシピの 材料を ふくろから えらぶ（きたえて いない 物から 先に。たりなければ null）
export function pickIngredients(c, recipeId) {
  const r = RECIPE_BY_ID[recipeId];
  if (!r) return null;
  const bag = new Map((c?.items || []).map((e) => [e.id, e.n]));
  const out = [];
  for (const want of r.ins) {
    // 同じ もとの 装備の なかで、きたえた 回数が 少ない 物
    const cands = [...bag.entries()].filter(([id, n]) => n > 0 && baseItemId(id) === want).sort((a, b) => (ITEMS[a[0]].plus || 0) - (ITEMS[b[0]].plus || 0));
    if (!cands.length) return null;
    const id = cands[0][0];
    bag.set(id, bag.get(id) - 1);
    out.push(id);
  }
  return out;
}

// レシピの 材料が 足りない 物（[{ id, need, have }]）
export function recipeLack(c, recipeId) {
  const r = RECIPE_BY_ID[recipeId];
  if (!r) return [];
  const need = new Map();
  for (const id of r.ins) need.set(id, (need.get(id) || 0) + 1);
  const have = (id) => (c?.items || []).filter((e) => baseItemId(e.id) === id).reduce((a, e) => a + (e.n || 0), 0);
  return [...need].filter(([id, n]) => have(id) < n).map(([id, n]) => ({ id, need: n, have: have(id) }));
}
