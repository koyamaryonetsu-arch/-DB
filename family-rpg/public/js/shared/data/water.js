// 第47回: 新しい 属性「水」（water）。魔物の 水の 効きぐあいを、かんたんな きまりで つける（docs/plan-r47-water.md）
//
// ・monsters.js の おわりで applyWater(MONSTERS) を よぶ。数えない 形（色ちがい いがいの かくれた 魔物）も ふくめて
//   MONSTERS[id].resist.water に かずを 書く（ふつうの 魔物も 1 と 書くので、あとから 見て わかる）
// ・色ちがい（variants.js）は もとの 魔物の resist を うつすので、もとの 水を うけつぐ
// ・データに もう resist.water が 書いてある 魔物は、その かずを つかう（きまりより 先）
// ・古い セーブ・水の ない データは、resist.water が なくても `?? 1` で ふつう（1倍）
// ・ここは ほかの データを import しない（monsters.js から 読まれる）

// 水の 効きぐあいの かず
export const WATER_VALUES = { weak: 1.5, weakSoft: 1.25, none: 1, resistSoft: 0.75, resist: 0.5, metal: 0 };

// ボスの 弱点は ここまで（ていねいに 調整した ボスが、水で きゅうに やさしく ならない ように）。
// さらに ボスは、もとからの いちばんの 弱点（炎〜闇の いちばん 大きい かず）を こえない
export const WATER_BOSS_WEAK_MAX = 1.25;

// 1. 1体ずつ きめた もの（ポケモンは タイプの とおり。ボスで きまりと ちがう ものも ここ）
export const WATER_OVERRIDE = {
  // ポケモン（ほのおタイプは 弱い・みず と くさは 強い・ほかは ふつう）
  charmander: 1.5, charmeleon: 1.5, charizard: 1.5, flareon: 1.5,
  squirtle: 0.5, wartortle: 0.5, blastoise: 0.5, vaporeon: 0.5,
  bulbasaur: 0.5, ivysaur: 0.5, venusaur: 0.5,
  pikachu: 1, raichu: 1, eevee: 1, jolteon: 1, umbreon: 1, snorlax: 1, gengar: 1, mew: 1,
  // 第6章の ボスは しかけ（砂・時を おぼえる・かねの 音）で 調整ずみなので ふつう
  sand_clock: 1, geardon: 1, carillon: 1,
  // 水が かれて ひからびた カエル（カエルだが 水の 中に いない）
  dry_frog: 1,
};

// 2. 水の 魔物（海・川・ぬま・雨・魚・カニ・カメ・くらげ・イカ・水の 竜）→ 0.5
export const WATER_SEA = [
  'marine_slime', 'hedoron', 'frog', 'armor_crab', 'shell_knight', 'sea_serpent', 'coral_golem', 'glow_jelly',
  'tobiuo', 'uzumaki_gai', 'hoseki_game', 'kiba_walrus', 'penguin_knight', 'sand_crab', 'crab_star',
  'water_spirit', 'water_dragon', 'prison_guard', 'water_prison', 'mirror_jelly', 'shade_serpent', 'foam_siren', 'star_jelly',
  'ss_kraken', 'giant_squid', 'tm_king', 'tm_serpent', 'morgana', 'morgana_true', 'phantom_morgana',
];

// 3. 炎の 魔物。きまり: 炎が 0.5いか で 氷が 1.2いじょう（この ゲームの 炎の 魔物は みんな 氷に 弱い）。
//    それに 当てはまらない 炎の 魔物は ここに 書く → 1.5（竜は うろこが かたいので 1.25）
export const WATER_FIRE = ['lantern_ghost', 'ryuou_grandson'];

// 4. 砂・土の 体、砂の 中に すむ（水で くずれる）→ 1.5
export const WATER_SAND = [
  'sand_slime', 'sand_golem', 'sand_sprite', 'sandstorm_spirit', 'sandstone_golem', 'haniwa_soldier',
  'sand_worm', 'sand_shark', 'ar_shark', 'ar_sharkking', 'sand_whale',
];

// 5. 岩・石の 体（かたいので 少しだけ。いちばんの 弱点は 今までの 爆発など）→ 1.25
export const WATER_ROCK = [
  'rockman', 'rock_shard', 'golem', 'goldoon', 'tm_golem', 'ss_goldoon', 'stone_keeper', 'dragon_statue', 'trial_guardian',
  'gargoyle', 'stone_gargoyle', 'ruin_sentinel',
];

// 6. からくり・機械・鉄の 体（さびる。いちばんの 弱点は 今までの 雷）→ 1.25
export const WATER_MACHINE = [
  'clockwork_knight', 'buriki', 'clockwork_guard', 'sky_guard', 'gear_beetle', 'chrono_knight', 'cog_roller',
  'killer', 'killer_karakuri', 'castle_armor', 'ss_sky_giant',
];

const ELEMS7 = ['fire', 'ice', 'wind', 'blast', 'bolt', 'light', 'dark'];
const SEA = new Set(WATER_SEA), FIRE = new Set(WATER_FIRE), SAND = new Set(WATER_SAND), ROCK = new Set(WATER_ROCK), MACHINE = new Set(WATER_MACHINE);

// メタル（どの 属性も 0）
export const isMetalResist = (r) => !!r && ELEMS7.every((k) => r[k] === 0);
// 炎の 魔物（きまり）
export const isFireBody = (id, m) => FIRE.has(id) || ((m.resist?.fire ?? 1) <= 0.5 && (m.resist?.ice ?? 1) >= 1.2);

// どの きまりで、いくつに なるか（{ value, rule }）。rule は ドキュメントと テストの ための 名前
export function waterRuleOf(id, m) {
  const r = m?.resist || {};
  if (Object.prototype.hasOwnProperty.call(r, 'water') && !AUTO.has(r)) return { value: r.water, rule: 'data' };
  let out;
  if (Object.prototype.hasOwnProperty.call(WATER_OVERRIDE, id)) out = { value: WATER_OVERRIDE[id], rule: 'override' };
  else if (m.metal || isMetalResist(r)) out = { value: WATER_VALUES.metal, rule: 'metal' };
  else if (SEA.has(id)) out = { value: WATER_VALUES.resist, rule: 'sea' };
  else if (isFireBody(id, m)) out = { value: m.race === 'dragon' ? WATER_VALUES.weakSoft : WATER_VALUES.weak, rule: 'fire' };
  else if (SAND.has(id)) out = { value: WATER_VALUES.weak, rule: 'sand' };
  else if (ROCK.has(id)) out = { value: WATER_VALUES.weakSoft, rule: 'rock' };
  else if (MACHINE.has(id)) out = { value: WATER_VALUES.weakSoft, rule: 'machine' };
  else if ((r.ice ?? 1) <= 0.5) out = { value: WATER_VALUES.resistSoft, rule: 'ice' };
  else if (m.race === 'plant') out = { value: WATER_VALUES.resistSoft, rule: 'plant' };
  else out = { value: WATER_VALUES.none, rule: 'none' };
  // ボスの 弱点は WATER_BOSS_WEAK_MAX まで。そのうえ、もとからの いちばんの 弱点を こえない
  // （ボスの「この 属性が 効く」と いう 作戦が かわらない。1体ずつ きめた ものは そのまま）
  if (m.boss && out.rule !== 'override' && out.value > 1) {
    const cap = Math.min(WATER_BOSS_WEAK_MAX, Math.max(1, ...ELEMS7.map((k) => r[k] ?? 1)));
    if (out.value > cap) out = { value: cap, rule: `${out.rule}+boss` };
  }
  return out;
}

// applyWater が 作った resist（2回目に よんでも「データに 書いてある」と まちがえない ため）
const AUTO = new WeakSet();
// applyWater で きまった きまりの 名前（id → 'sea' など。テストと 図鑑の 見なおし用）
export const WATER_RULE = {};

// 表の すべての 魔物に resist.water を つける（resist は あたらしい オブジェクトに する。
// ROCK_RESIST・METAL_RESIST のような 共有の オブジェクトを かきかえない ため）
export function applyWater(table) {
  for (const id of Object.getOwnPropertyNames(table)) {
    const m = table[id];
    if (!m || typeof m !== 'object') continue;
    const { value, rule } = waterRuleOf(id, m);
    m.resist = { ...(m.resist || {}), water: value };
    AUTO.add(m.resist);
    WATER_RULE[id] = rule;
  }
  return table;
}
