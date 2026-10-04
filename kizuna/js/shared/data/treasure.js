// 宝の地図（ドラクエ9の 宝の地図の ように、地図の 場所を ほると 毎回 ちがう 洞窟が あらわれる）
//
// キャラの セーブ: c.treasureMaps = [{ id, seed, lv, map, x, y, found, cleared, at }]（なくても よい）
//   seed … 洞窟の 形・宝・主が きまる 数 / lv … 地図の レベル（魔物の 強さ・階の 数・宝）
//   map, x, y … ほる 場所（ミドリナ地方 か 風の海の 島）/ found … ほって 入り口を 見つけた / cleared … 主を たおした
//
// 洞窟の マップ ID: tm_<seed36>_<lv>_<o|s><x>x<y>_<階>（たとえば tm_k3f9a2_3_o120x45_2）
//   ID だけで 洞窟が つくれる（サーバーと 画面で おなじ 形。とちゅうで ログインしなおしても おなじ 洞窟）
import { MONSTERS } from './monsters.js?v=a4aa89e14206';
import { ITEMS, SLOTS } from './items.js?v=a4aa89e14206';
import { ENCOUNTER_TABLES, ZONE_BG } from './encounters.js?v=a4aa89e14206';
import { makeRng } from '../rng.js?v=a4aa89e14206';

export const TM_MAX = 20; // 持てる 地図の 数
export const TM_LV_MAX = 12; // 地図の レベルの 上限
export const TM_BOSS_LV = 10; // 主の データの レベル（monsters-tm.js）

// 洞窟の しゅるい
//   pool … 出てくる 魔物（地図の レベルに ちかい ものを えらんで 強くする）/ bosses … 主
export const TM_THEMES = {
  earth: {
    label: '土', words: ['大地', '岩', 'まぼろし', 'ねむり', 'ひみつ', '古代'], dark: true, bg: 'cave', bossBg: 'cave_boss',
    pool: ['goblin', 'wolf', 'hedoron', 'armor_crab', 'skeleton', 'dark_bat', 'rockman', 'shadow_mage', 'coconut', 'ghost_pirate', 'coral_golem', 'storm_soldier'],
    bosses: ['tm_golem', 'tm_knight', 'tm_panther'],
  },
  ice: {
    label: '氷', words: ['氷', '雪', '白銀', '冬', '氷河', 'つらら'], dark: false, bg: 'tm_ice', bossBg: 'tm_ice',
    pool: ['ice_pururin', 'armor_crab', 'dark_bat', 'nemuri', 'marine_slime', 'wind_imp', 'shell_knight', 'sea_serpent', 'coral_golem', 'storm_bird'],
    bosses: ['tm_serpent', 'tm_king', 'tm_panther'],
  },
  lava: {
    label: '炎', words: ['炎', '火', 'ようがん', '赤岩', '火の山', '火山'], dark: true, bg: 'tm_lava', bossBg: 'tm_lava',
    pool: ['pururin_beth', 'goblin', 'lamp', 'crow', 'skeleton', 'rockman', 'shadow_mage', 'thunder_imp', 'storm_soldier'],
    bosses: ['tm_dragon', 'tm_golem', 'tm_knight'],
  },
};
export const THEME_KEYS = Object.keys(TM_THEMES);

// ほる 場所の ある マップ（ID の 1文字）
export const SPOT_MAPS = { o: 'overworld', s: 'sea' };
const SPOT_CODE = { overworld: 'o', sea: 's' };

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const seed36 = (seed) => (seed >>> 0).toString(36);

// ───────────── ID ─────────────
export function caveKey(tm) {
  return `tm_${seed36(tm.seed)}_${tm.lv}_${SPOT_CODE[tm.map] || 'o'}${tm.x}x${tm.y}`;
}
export function floorMapId(tm, floor) {
  return `${caveKey(tm)}_${floor}`;
}
const FLOOR_ID = /^tm_([0-9a-z]{1,7})_(\d{1,2})_([os])(\d{1,3})x(\d{1,3})_(\d{1,2})$/;
export function isTreasureMapId(id) {
  return typeof id === 'string' && id.startsWith('tm_');
}
// 'tm_…' → { seed, lv, spot: { map, x, y }, floor }（形が ちがえば null）
export function parseFloorId(id) {
  const m = typeof id === 'string' ? FLOOR_ID.exec(id) : null;
  if (!m) return null;
  const seed = parseInt(m[1], 36);
  const lv = Number(m[2]);
  const floor = Number(m[6]);
  if (!Number.isFinite(seed) || seed < 0 || seed > 0x7fffffff || lv < 1 || lv > TM_LV_MAX || floor < 1) return null;
  return { seed, lv, spot: { map: SPOT_MAPS[m[3]], x: Number(m[4]), y: Number(m[5]) }, floor };
}
// フラグ・宝箱の なまえ（地図を 捨てた ときに まとめて 消せる ように seed を 入れる）
export const clearedFlag = (seed) => `tmc_${seed36(seed)}`;
export const foundFlag = (seed) => `tmf_${seed36(seed)}`;
export const chestPrefix = (seed) => `tm_${seed36(seed)}_`;

// ───────────── 洞窟の なかみ（seed と レベルで きまる）─────────────
export function caveInfo(seed, lv) {
  const r = makeRng((seed ^ 0x5bd1e995) >>> 0);
  const theme = r.weighted([{ k: 'earth', w: 4 }, { k: 'ice', w: 3 }, { k: 'lava', w: 3 }]).k;
  const th = TM_THEMES[theme];
  const word = r.pick(th.words);
  const floors = clamp(2 + Math.floor((lv - 1) / 2) + (r.chance(0.35) ? 1 : 0), 2, 6);
  const boss = r.pick(th.bosses);
  return { seed, lv, theme, word, floors, boss, caveName: `${word}の洞窟`, mapName: `${word}の宝の地図` };
}

// 地図の なまえ（「大地の宝の地図 Lv3」）
export function tmTitle(tm) {
  return `${caveInfo(tm.seed, tm.lv).mapName} Lv${tm.lv}`;
}

// 魔物の 強さ（レベル）。深い 階ほど すこし 強い
export function enemyLvOf(lv, floor = 1) {
  return 9 + lv * 2 + (floor - 1) * 0.6;
}
// 主の 強さ（いちばん 下の 階の 魔物より すこし 上）
export function bossLvOf(seed, lv) {
  return enemyLvOf(lv, caveInfo(seed, lv).floors) + 1.5;
}

// ───────────── 出てくる 魔物 ─────────────
export function encounterZone(lv, theme) {
  return `tm${lv}${theme[0]}`;
}

// 地図の レベルと 洞窟の しゅるいで きまる 魔物の くみあわせ（ENCOUNTER_TABLES に 入れる）
export function ensureEncounterTable(lv, theme) {
  const zone = encounterZone(lv, theme);
  if (ENCOUNTER_TABLES[zone]) return zone;
  const L = enemyLvOf(lv, 1);
  const pool = TM_THEMES[theme].pool.filter((sp) => MONSTERS[sp]).sort((a, b) => MONSTERS[a].lv - MONSTERS[b].lv);
  let pick = pool.filter((sp) => MONSTERS[sp].lv <= L + 1 && MONSTERS[sp].lv >= L - 9);
  if (pick.length < 4) pick = pool.slice().sort((a, b) => Math.abs(MONSTERS[a].lv - L) - Math.abs(MONSTERS[b].lv - L)).slice(0, 4).sort((a, b) => MONSTERS[a].lv - MONSTERS[b].lv);
  pick = pick.slice(-6);
  const max = (sp) => (MONSTERS[sp].size === 'l' ? 2 : 3);
  const table = pick.map((sp) => ({ w: 3, group: [[sp, 1, max(sp)]] }));
  for (let i = 0; i + 1 < pick.length; i += 2) table.push({ w: 2, group: [[pick[i + 1], 1, 2], [pick[i], 1, 1]] });
  ENCOUNTER_TABLES[zone] = table;
  ZONE_BG[zone] = TM_THEMES[theme].bg;
  return zone;
}

// 魔物を 地図の レベルに あわせて 強くする（たたかいの はじめに 1体ずつ）
export function scaleEnemy(m, L) {
  const L0 = m.lv || 1;
  if (!Number.isFinite(L) || Math.abs(L - L0) < 0.01) return m;
  const k = (L + 6) / (L0 + 6);
  const hk = Math.pow(k, m.boss ? 1.3 : 1.15);
  m.maxHp = m.hp = Math.max(1, Math.round(m.maxHp * hk));
  m.maxMp = m.mp = Math.round(m.maxMp * k);
  m.atk = Math.round(m.atk * k);
  m.dfn = Math.round(m.dfn * k);
  m.mag = Math.round(m.mag * k);
  m.healPow = Math.round(m.healPow * k);
  m.agi = Math.round(m.agi * Math.sqrt(k));
  m.lv = Math.round(L);
  m.rewardK = k;
  return m;
}

// 強くした 魔物の ぶん ふえる 経験値・ゴールド
export function scaledRewardBonus(battle) {
  let exp = 0, gold = 0;
  for (const c of battle.combatants) {
    if (c.side !== 'enemy' || c.alive || c.fled || !c.rewardK) continue;
    const m = MONSTERS[c.species];
    if (!m) continue;
    exp += Math.round((m.exp || 0) * (Math.pow(c.rewardK, 1.2) - 1));
    gold += Math.round((m.gold || 0) * (c.rewardK - 1));
  }
  return { exp, gold };
}

// ───────────── 宝箱の なかみ ─────────────
// 装備の ランクは 地図の レベルで（いまの 物語の 店より 強すぎない）
export function equipRankOf(lv) {
  return lv <= 3 ? 3 : 4;
}
let equipCache = null;
function equipPools() {
  if (equipCache) return equipCache;
  const all = Object.entries(ITEMS).filter(([, it]) => SLOTS.includes(it.type) && !it.unique && it.rank);
  equipCache = {
    shop: (rank) => all.filter(([, it]) => !it.star && it.price > 0 && it.rank >= rank - 1 && it.rank <= rank).map(([id]) => id),
    star: (rank) => all.filter(([, it]) => it.star && it.rank <= rank).map(([id]) => id),
  };
  return equipCache;
}

const CONSUMABLES = [
  ['herb', 4, 1, 3], ['moonherb', 3, 1, 99], ['antidote', 1, 1, 2], ['magic_water', 3, 1, 99], ['holy_water', 1, 1, 99],
  ['return_wing', 2, 1, 99], ['revive_flower', 1, 1, 99], ['smoke_ball', 1, 1, 99],
];
const SEEDS = ['seed_str', 'seed_def', 'seed_agi', 'seed_mag', 'seed_hp'];

// rng … 宝箱ごとに きまった 乱数（洞窟の seed から）/ kind: 'normal' | 'bossA' | 'bossB'
export function chestLoot(rng, lv, kind = 'normal') {
  const pools = equipPools();
  const rank = equipRankOf(lv);
  const rare = () => {
    const list = pools.star(rank);
    return list.length ? { item: rng.pick(list) } : { item: 'revive_flower' };
  };
  const equip = () => {
    const list = pools.shop(rank);
    return list.length ? { item: rng.pick(list) } : { gold: 100 };
  };
  if (kind === 'bossA') return rng.chance(0.3) ? rare() : equip();
  if (kind === 'bossB') {
    const r = rng.next();
    if (r < 0.45) return { gold: Math.round((400 + lv * 220) * rng.float(0.9, 1.2) / 10) * 10 };
    if (r < 0.75) return { item: rng.pick(SEEDS), n: 2 };
    return { item: rng.pick(['revive_flower', 'magic_water']), n: 2 };
  }
  const r = rng.next();
  const rareP = 0.03 + lv * 0.004;
  if (r < rareP) return rare();
  if (r < rareP + 0.2) return equip();
  if (r < rareP + 0.33) return { item: rng.pick(SEEDS) };
  if (r < rareP + 0.62) return { gold: Math.round((50 + lv * 40) * rng.float(0.7, 1.4) / 10) * 10 };
  const list = CONSUMABLES.filter(([, , a, b]) => lv >= a && lv <= b).map(([id, w]) => ({ id, w }));
  const id = rng.weighted(list).id;
  return { item: id, n: id === 'herb' ? 3 : 1 };
}

// ───────────── 地図が 手に入る ─────────────
// 戦いの あとで 宝の地図を 拾う 確率（第1章を クリアした あとだけ。world/treasure.js）
export function mapDropRate({ inCave = false, boss = false, fixed = false, maxEnemyLv = 1, playerLv = 1 } = {}) {
  if (fixed) return boss ? 0.5 : 0;
  if (inCave) return 1 / 60;
  if (maxEnemyLv >= 12 || maxEnemyLv >= playerLv - 2) return 1 / 100;
  return 1 / 180;
}
// 拾った 地図の レベル（戦った 魔物の 強さから）
export function dropMapLevel(rng, enemyLv) {
  const base = Math.round((enemyLv - 8) / 2);
  return clamp(base + (rng.chance(0.3) ? 1 : 0) - (rng.chance(0.2) ? 1 : 0), 1, TM_LV_MAX);
}
// 主を たおした ときに もらえる 地図の レベル（おなじ か 上）
export function nextMapLevel(rng, lv) {
  const r = rng.next();
  return clamp(lv + (r < 0.45 ? 0 : r < 0.9 ? 1 : 2), 1, TM_LV_MAX);
}

// ───────────── セーブ ─────────────
// こわれた・知らない 形の 地図は すてる（何回 よんでも おなじ けっか）
export function repairTreasureMaps(c) {
  if (!c || c.treasureMaps === undefined) return;
  if (!Array.isArray(c.treasureMaps)) {
    delete c.treasureMaps;
    return;
  }
  const seen = new Set();
  const out = [];
  for (const tm of c.treasureMaps) {
    if (!tm || typeof tm !== 'object') continue;
    const seed = Number(tm.seed);
    if (!Number.isInteger(seed) || seed < 0 || seed > 0x7fffffff || seen.has(seed)) continue;
    if (!SPOT_CODE[tm.map] || !Number.isInteger(tm.x) || !Number.isInteger(tm.y) || tm.x < 0 || tm.y < 0 || tm.x > 999 || tm.y > 999) continue;
    seen.add(seed);
    const rec = { id: seed36(seed), seed, lv: clamp(Math.floor(Number(tm.lv) || 1), 1, TM_LV_MAX), map: tm.map, x: tm.x, y: tm.y, found: !!tm.found, cleared: !!tm.cleared };
    if (Number.isFinite(tm.at)) rec.at = tm.at;
    out.push(rec);
  }
  c.treasureMaps = out.slice(0, TM_MAX);
}

// 家族サーバーと スマホで 地図を 合わせる（merge.js）。両方で ふえた 地図は 両方、どちらかで 捨てた 地図は 捨てる
export function mergeTreasureMaps(b, a, t) {
  const list = (x) => (Array.isArray(x) ? x.filter((e) => e && e.id) : []);
  const B = new Map(list(b).map((e) => [e.id, e]));
  const A = new Map(list(a).map((e) => [e.id, e]));
  const T = new Map(list(t).map((e) => [e.id, e]));
  if (!A.size && !T.size && !B.size) return undefined;
  const out = [];
  for (const [id, e] of [...A, ...T]) {
    if (out.some((x) => x.id === id)) continue;
    if (B.has(id) && (!A.has(id) || !T.has(id))) continue;
    const ea = A.get(id), et = T.get(id);
    const m = { ...(ea || et) };
    m.found = !!(ea?.found || et?.found);
    m.cleared = !!(ea?.cleared || et?.cleared);
    out.push(JSON.parse(JSON.stringify(m)));
  }
  return out.slice(0, TM_MAX);
}
