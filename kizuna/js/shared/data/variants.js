// 色ちがいの 魔物（今 いる 魔物の 絵を 使い回して、色・名前・強さ・経験値を かえる。2026年10月 第32回 B）
//
// つかいかた（物語でも ひみつのダンジョンでも おなじ）
//   const id = registerVariant('frost_wolf', 'dark');   // → 'v_dark_frost_wolf'（MONSTERS に とうろくして ID を かえす）
//   出現表・きまった 戦いには この ID を そのまま 書く（[['v_dark_frost_wolf', 1, 2]] など）
//   とうろくは モジュールを 読みこんだ ときに すませる（サーバーと 画面の 両方で おなじ ID が 引けるように）
//
// きまり
//   ・ID は 'v_<しゅるい>_<もとの 魔物>'。MONSTERS には「数えない」形（enumerable: false）で 入れる
//     → Object.keys(MONSTERS)（図鑑の ならび・魔物の 数・配合の 一覧）には 出ない。MONSTERS[id] は ふつうに 引ける
//   ・絵: もとの 魔物の 絵（art）に 色の かえかた（tint。render/themes.js の tintCanvas）を かける。hueTo … 色あいを その 色に そろえる
//   ・強さ: もとの 魔物に しゅるいの 倍率（k）を かける。レベルは もとと おなじ（ひみつのダンジョンでは 階の レベルまで 強くなる）
//   ・経験値・お金: しゅるいの 倍率（exp・gold）。落とす 物は もとと おなじ（素材〈loot.js の MAT_DROPS〉は 落とさない）
//   ・仲間に ならない（noBefriend。MONSTER_FRIENDS にも 入れない）。図鑑には 出ない（見た・たおした 記録は 色ちがいの ID で のこる）
import { MONSTERS } from './monsters.js?v=7936c145c576';

// しゅるい（名前の 前に つける ことば・色・強さ）
export const VARIANT_KINDS = {
  dark: {
    prefix: 'ダーク', tint: { hueTo: 272, sat: 0.95, light: 0.68 },
    k: { hp: 1.3, str: 1.2, def: 1.15, agi: 1.1, mag: 1.25 }, exp: 1.6, gold: 1.5,
    resist: { dark: 0.5, light: 1.25 }, desc: 'やみの力で黒くそまった色ちがい。もとの魔物より強い。',
  },
  shadow: {
    prefix: 'シャドウ', tint: { hueTo: 228, sat: 0.3, light: 0.62 },
    k: { hp: 1.2, str: 1.25, def: 1.1, agi: 1.45, mag: 1.2 }, exp: 1.8, gold: 1.5,
    resist: { dark: 0.6, blind: 0.5 }, desc: 'かげのようにすがたがうすい色ちがい。とても素早い。',
  },
  red: {
    prefix: 'レッド', tint: { hueTo: 356, sat: 1.25, light: 0.92 },
    k: { hp: 1.35, str: 1.35, def: 1.2, agi: 1.15, mag: 1.3 }, exp: 2, gold: 1.6,
    resist: { fire: 0.5, ice: 1.25 }, desc: 'ほのおのように赤くもえる色ちがい。力がとても強い。',
  },
  gold: {
    prefix: 'ゴールド', tint: { hueTo: 46, sat: 1.4, light: 1.18 },
    k: { hp: 1.5, str: 1.1, def: 1.3, agi: 1, mag: 1 }, exp: 2.5, gold: 6,
    resist: {}, desc: '金色にかがやく、めずらしい色ちがい。たおすとお金をたくさん落とす。',
  },
};
export const VARIANT_PREFIX = 'v_';
export const variantId = (baseId, kind) => `${VARIANT_PREFIX}${kind}_${baseId}`;

const r = (v, k) => Math.max(0, Math.round((Number(v) || 0) * k));
// 色の かえかたを かさねる（もとの 魔物が 色がえの 絵〈宝の洞窟の 主 など〉なら その 上に）
function mixTint(a, b) {
  if (!a) return { ...b };
  const out = { hue: a.hue || 0, sat: (a.sat ?? 1) * (b.sat ?? 1), light: (a.light ?? 1) * (b.light ?? 1) };
  if (b.hueTo !== undefined) out.hueTo = b.hueTo;
  else out.hue += b.hue || 0;
  return out;
}

// 色ちがいの データを 作る（とうろくは しない。もとが なければ null）
export function makeVariant(baseId, kind) {
  const m = MONSTERS[baseId];
  const v = VARIANT_KINDS[kind];
  if (!m || !v || m.variant) return null;
  const resist = { ...(m.resist || {}) };
  for (const [el, x] of Object.entries(v.resist || {})) resist[el] = x < 1 ? Math.min(resist[el] ?? 1, x) : Math.max(resist[el] ?? 1, x);
  return {
    ...m,
    name: `${v.prefix}${m.name}`,
    hp: Math.max(1, r(m.hp, v.k.hp)), mp: r(m.mp, 1),
    str: r(m.str, v.k.str), def: r(m.def, v.k.def), agi: r(m.agi, v.k.agi), mag: r(m.mag, v.k.mag),
    exp: r(m.exp, v.exp), gold: r(m.gold, v.gold),
    resist,
    actions: (m.actions || [{ w: 1, id: 'attack' }]).map((a) => ({ ...a })),
    drops: m.drops ? JSON.parse(JSON.stringify(m.drops)) : undefined,
    art: m.art || baseId,
    tint: mixTint(m.tint, v.tint),
    variant: { base: baseId, kind },
    noBefriend: true,
    desc: v.desc,
  };
}

// MONSTERS に とうろく（何回 よんでも おなじ。ID を かえす。作れなければ null）
export function registerVariant(baseId, kind) {
  const id = variantId(baseId, kind);
  if (Object.prototype.hasOwnProperty.call(MONSTERS, id)) return id;
  const data = makeVariant(baseId, kind);
  if (!data) return null;
  Object.defineProperty(MONSTERS, id, { value: data, enumerable: false, configurable: true, writable: true });
  return id;
}

// 色ちがいなら { base, kind }（ちがえば null）
export function variantOf(sp) {
  return MONSTERS[sp]?.variant || null;
}
// もとの 魔物の ID（色ちがいで なければ そのまま）
export const baseSpecies = (sp) => variantOf(sp)?.base || sp;
// 名前が もう その ことばで 始まる 魔物（ダークトレント など）には、その しゅるいを 作らない
export const variantFits = (baseId, kind) => !!MONSTERS[baseId] && !!VARIANT_KINDS[kind] && !MONSTERS[baseId].name.startsWith(VARIANT_KINDS[kind].prefix);
