// ひみつのダンジョン（何階まで もぐれるかを 家族で きそう、終わりの ない ダンジョン）
//
// ・入口は ルミナの町の 南門の 外（maps/secret-dungeon.js の SD_DOOR）。ルミナの町に 着く（c1_town）と 開く
// ・地下1階から はじまり、終わりが ない。階の 形は 階の 番号だけで きまる（家族みんな おなじ 形。sdSeed）
// ・5階ごとに 休み所（ごほうびの 宝箱・回復の泉・「先へ進む／地上へもどる」）。10階ごとの 休み所には 階段を 守る 番人
// ・魔物は 仲間に ならない（map.noBefriend）。糸・羽・ルーラは 使えない（map.noEscape）。全滅すると 入口へ（お金は へらない）
//
// マップの ID: 'sd_gate'（入口の 広間）・'sd_<階>'（たとえば sd_12。maps/index.js が ID から つくる）
//
// キャラの セーブ（なくても よい。むかしの セーブも そのまま 読める）
//   c.sd = { best, at, with, got, tries, run }
//     best … いちばん 深く 着いた 階 / at … その 時こく / with … その とき いっしょに いた 家族の 名前
//     got  … 大きな ごほうびを もらった 休み所の 階 [5, 10, …] / tries … ちょうせんした 回数
//     run  … 今の ちょうせん { f: 今の 階, mid: とちゅうから 来た（記録に ならない）, took: ごほうびを 開けた 階 }
import { MONSTERS } from './monsters.js';
import { ITEMS, SLOTS } from './items.js';
import { ENCOUNTER_TABLES, ZONE_BG, FIXED_ENCOUNTERS } from './encounters.js';
import { makeRng } from '../rng.js';
import { rewardGold } from './difficulty.js';

export const SD_GATE = 'sd_gate';
export const SD_NAME = 'ひみつのダンジョン';
export const SD_OPEN_FLAG = 'c1_town'; // ルミナの町に 着いたら 入口が 開く
export const SD_REST_EVERY = 5; // 5階ごとに 休み所
export const SD_GUARD_EVERY = 10; // 10階ごとの 休み所に 番人
export const SD_MAX = 999; // 階の 番号の 上限（ID の 形のため。ほんとうは 終わりが ない）
export const SD_BOARD_MAX = 10; // 記録の 板に 出す 人数

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ───────────── ID ─────────────
export const sdFloorId = (f) => `sd_${f}`;
const FLOOR_ID = /^sd_([1-9]\d{0,2})$/;
// 'sd_12' → 12（ちがえば 0）
export function sdFloorOf(id) {
  const m = typeof id === 'string' ? FLOOR_ID.exec(id) : null;
  return m ? Number(m[1]) : 0;
}
export const isSdFloorId = (id) => sdFloorOf(id) > 0;
export const isSdMapId = (id) => id === SD_GATE || isSdFloorId(id);
export const isRestFloor = (f) => f > 0 && f % SD_REST_EVERY === 0;
export const isGuardFloor = (f) => f > 0 && f % SD_GUARD_EVERY === 0;

// 階の 形を きめる 数（階の 番号だけで きまる。家族みんな、何回 入っても おなじ 形）
export function sdSeed(f) {
  let h = Math.imul(f + 0x2545, 0x9e3779b1) ^ 0x5d1c0de;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) & 0x7fffffff;
}

// ───────────── 強さ ─────────────
// 魔物の レベル: 1階 4・10階 13・20階 23・30階 33・40階 43 …（1階ごとに 1つ）
export function sdEnemyLv(f) {
  return 3 + f;
}
// 深い 階の 倍率（30階までは 1倍。そこから 1階ごとに 3%：40階 1.3倍・50階 1.6倍・70階 2.2倍）
export function sdPower(f) {
  return f <= 30 ? 1 : Math.round((1 + (f - 30) * 0.03) * 100) / 100;
}
// おすすめの レベル（主人公。魔物の レベルより 1つ 上）
export function sdRecommendLv(f) {
  return sdEnemyLv(f) + 1;
}
// 階の 広さ（宝の洞窟の 地図 Lv1〜4 の 大きさ。小さめ〜ふつう）
export function sdLayoutLv(f) {
  return clamp(1 + Math.floor(f / 12), 1, 4);
}

// 階の 色と 戦いの 背景（10階ごとに かわる。60階からは 星空の 階）
export const SD_BANDS = [
  { from: 1, theme: 'sd_moss', bg: 'sd_moss', dark: false, label: 'こけむした石の階' },
  { from: 10, theme: 'sd_aqua', bg: 'sd_aqua', dark: false, label: '青いすいしょうの階' },
  { from: 20, theme: 'sd_violet', bg: 'sd_violet', dark: true, label: 'むらさきのきりの階' },
  { from: 30, theme: 'sd_crimson', bg: 'sd_crimson', dark: true, label: '赤い炎の階' },
  { from: 40, theme: 'sd_gold', bg: 'sd_gold', dark: true, label: '黄金の古代の階' },
  { from: 50, theme: 'sd_star', bg: 'sd_star', dark: true, label: '星空のはての階' },
];
export function sdBand(f) {
  let b = SD_BANDS[0];
  for (const x of SD_BANDS) if (f >= x.from) b = x;
  return b;
}

// ───────────── 出てくる 魔物 ─────────────
// 今の 章の 魔物を まぜて 使う（まだ 見ていない 章の 魔物も 出る）。ボス・配合だけの 魔物・しかけの 魔物は 出さない
const NOT_IN_POOL = new Set([
  'rock_shard', 'shadow_soldier', 'kirakira', 'gold_beetle', 'water_prison', 'prison_guard', 'utsushimi', 'royal_mummy',
]);
let poolCache = null;
export function sdMonsterPool() {
  if (!poolCache) {
    poolCache = Object.entries(MONSTERS)
      .filter(([id, m]) => !m.boss && !m.breedOnly && !NOT_IN_POOL.has(id) && !id.startsWith('tm_') && (m.exp || 0) > 0 && Array.isArray(m.actions))
      .map(([id]) => id)
      .sort((a, b) => MONSTERS[a].lv - MONSTERS[b].lv || (a < b ? -1 : 1));
  }
  return poolCache;
}

export const sdZone = (f) => `sd${f}`;

// その 階の 出現表（ENCOUNTER_TABLES に 入れる。階の 番号だけで きまる）
export function ensureSdTable(f) {
  const zone = sdZone(f);
  if (ENCOUNTER_TABLES[zone]) return zone;
  const L = sdEnemyLv(f);
  const pool = sdMonsterPool();
  let cand = pool.filter((sp) => MONSTERS[sp].lv <= L + 1 && MONSTERS[sp].lv >= L - 8);
  if (cand.length < 6) cand = pool.slice().sort((a, b) => Math.abs(MONSTERS[a].lv - L) - Math.abs(MONSTERS[b].lv - L) || (a < b ? -1 : 1)).slice(0, 8);
  const r = makeRng((sdSeed(f) ^ 0x6d0b5) >>> 0);
  const pick = r.shuffle(cand.slice()).slice(0, 5).sort((a, b) => MONSTERS[a].lv - MONSTERS[b].lv);
  const max = (sp) => (MONSTERS[sp].size === 'l' ? 2 : 3);
  const table = pick.map((sp) => ({ w: 3, group: [[sp, 1, max(sp)]] }));
  for (let i = 0; i + 1 < pick.length; i += 2) table.push({ w: 2, group: [[pick[i + 1], 1, 2], [pick[i], 1, 1]] });
  ENCOUNTER_TABLES[zone] = table;
  ZONE_BG[zone] = sdBand(f).bg;
  return zone;
}

// ───────────── 番人（10階ごと）─────────────
// 宝の洞窟の 主と、物語の ボス（しかけの いらない ボス）を じゅんばんに
export const SD_GUARDS = [
  'tm_golem', 'giant_squid', 'tm_panther', 'blizzard_mammoth', 'tm_knight', 'flame_knight', 'tm_dragon',
  'trial_guardian', 'tm_serpent', 'armor_scorpion', 'tm_king', 'storm_general', 'magma_golem', 'sand_whale',
];
export function sdGuardian(f) {
  const i = Math.max(0, Math.floor(f / SD_GUARD_EVERY) - 1);
  return SD_GUARDS[i % SD_GUARDS.length];
}
export const sdGuardLv = (f) => sdEnemyLv(f) + 2;
// 番人との 戦い（FIXED_ENCOUNTERS に 入れる）
export function sdGuardEncounter(f) {
  const id = `sdguard_${f}`;
  FIXED_ENCOUNTERS[id] = {
    group: [[sdGuardian(f), 1, 1]], bg: 'sd_guard', bgm: 'boss', canFlee: false, boss: true,
    enemyLv: sdGuardLv(f), enemyPow: sdPower(f),
  };
  return id;
}

// ───────────── ごほうび ─────────────
const SEEDS = ['seed_str', 'seed_def', 'seed_agi', 'seed_mag', 'seed_hp'];
let equipCache = null;
function equipPools() {
  if (equipCache) return equipCache;
  const all = Object.entries(ITEMS).filter(([id, it]) => SLOTS.includes(it.type) && !it.unique && it.rank && !id.includes('+'));
  equipCache = {
    shop: (rank) => all.filter(([, it]) => !it.star && it.price > 0 && it.rank === rank).map(([id]) => id).sort(),
    star: (rank) => all.filter(([, it]) => it.star && it.rank <= rank && it.rank >= rank - 2).map(([id]) => id).sort(),
  };
  return equipCache;
}
// 宝箱の 装備の ランク（5階 2・15階 3・25階 4・35階 5・45階 6・55階から 7）
export const sdEquipRank = (f) => clamp(1 + Math.ceil(f / 10), 2, 7);
export const sdStarRank = (f) => clamp(3 + Math.floor(f / 20), 4, 7);

// 初めて 着いた 休み所の 大きな ごほうび（階の 番号だけで きまる。家族みんな おなじ）
//   [{ gold } | { item, n } | { medal: true }]
export function sdBigReward(f) {
  const r = makeRng((sdSeed(f) ^ 0xb16b00b) >>> 0);
  const out = [{ gold: rewardGold(Math.min(50000, 100 * f)) }];
  out.push({ item: r.pick(SEEDS), n: f >= 30 ? 2 : 1 });
  if (f % 10 === 0) out.push({ medal: true });
  if (f % 10 === 5) {
    const list = equipPools().shop(sdEquipRank(f));
    if (list.length) out.push({ item: r.pick(list), n: 1 });
  }
  if (f % 20 === 0) {
    const list = equipPools().star(sdStarRank(f));
    if (list.length) out.push({ item: r.pick(list), n: 1 });
  }
  if (f >= 50 && f % 10 === 0) out.push({ item: 'revive_flower', n: 2 });
  return out;
}

// 2回目からの 小さな ごほうび（1つ。rng … 世界の 乱数）
export function sdSmallReward(f, rng) {
  const list = [
    { k: 'gold', w: 4 },
    { k: 'herb', w: f < 15 ? 3 : 1 },
    { k: 'magic_water', w: 3 },
    { k: 'seed', w: 1 + Math.floor(f / 25) },
    { k: 'revive_flower', w: f >= 10 ? 2 : 0 },
    { k: 'star_shard', w: f >= 15 ? 1 : 0 },
  ].filter((x) => x.w > 0);
  const k = rng.weighted(list).k;
  if (k === 'gold') return { gold: rewardGold(Math.min(20000, 20 * f)) };
  if (k === 'herb') return { item: 'herb', n: 3 };
  if (k === 'seed') return { item: rng.pick(SEEDS), n: 1 };
  return { item: k, n: 1 };
}

// ごほうびの 文（「力の種を1個」「1000ゴールド」「小さなメダル」）
export function rewardText(e) {
  if (e.gold) return `${e.gold}ゴールド`;
  if (e.medal) return '小さなメダル';
  const name = ITEMS[e.item]?.name || e.item;
  return e.n > 1 ? `${name}を${e.n}個` : name;
}
// 小さなメダルの 場所の ID（c.medalSpots に のこる。メダル王に わたせる）
export const sdMedalId = (f) => `sd${f}`;

// ───────────── 記録 ─────────────
const names = (v) => (Array.isArray(v) ? [...new Set(v.filter((x) => typeof x === 'string' && x).map((x) => x.slice(0, 16)))].slice(0, 4) : []);
const floorList = (v) => (Array.isArray(v) ? [...new Set(v.filter((x) => Number.isInteger(x) && x > 0 && x <= SD_MAX))].sort((a, b) => a - b) : []);

// こわれた・知らない 形を ととのえる（何回 よんでも おなじ けっか）
export function repairSecret(c) {
  if (!c || c.sd === undefined) return;
  const s = c.sd;
  if (!s || typeof s !== 'object' || Array.isArray(s)) {
    delete c.sd;
    return;
  }
  const best = Math.floor(Number(s.best));
  const out = { best: Number.isFinite(best) ? clamp(best, 0, SD_MAX) : 0 };
  if (out.best > 0 && Number.isFinite(s.at)) out.at = s.at;
  if (out.best > 0) out.with = names(s.with);
  out.got = floorList(s.got).filter(isRestFloor);
  const tries = Math.floor(Number(s.tries));
  out.tries = Number.isFinite(tries) ? Math.max(0, tries) : 0;
  const r = s.run;
  const rf = Math.floor(Number(r?.f));
  if (r && typeof r === 'object' && Number.isFinite(rf) && rf >= 0 && rf <= SD_MAX) {
    out.run = { f: rf, took: floorList(r.took) };
    if (r.mid) out.run.mid = true;
  }
  c.sd = out;
}

export function sdRecordOf(c) {
  const s = c?.sd;
  return { best: Number.isFinite(s?.best) ? s.best : 0, at: s?.at || null, with: Array.isArray(s?.with) ? s.with : [], got: Array.isArray(s?.got) ? s.got : [], tries: s?.tries || 0 };
}

// その 階に 着いた（記録が のびたら true）。withNames … いっしょに いた 家族の 名前
export function noteSdFloor(c, f, withNames, now) {
  c.sd = c.sd && typeof c.sd === 'object' ? c.sd : { best: 0, got: [], tries: 0 };
  if (!(f > (c.sd.best || 0))) return false;
  c.sd.best = f;
  c.sd.at = now;
  c.sd.with = names(withNames);
  return true;
}

// 家族サーバーと スマホで 合わせる（merge.js）。深い ほうの 記録・ごほうびは 両方・ちょうせんの 回数は ふえた ぶん
export function mergeSecret(b, a, t) {
  if (!a && !t) return undefined;
  const A = a || {}, T = t || {}, B = b || {};
  const top = (T.best || 0) > (A.best || 0) || ((T.best || 0) === (A.best || 0) && (T.at || 0) && (!A.at || T.at < A.at)) ? T : A;
  const out = { best: top.best || 0 };
  if (out.best > 0) {
    if (Number.isFinite(top.at)) out.at = top.at;
    out.with = Array.isArray(top.with) ? top.with.slice() : [];
  }
  out.got = [...new Set([...(A.got || []), ...(T.got || [])])].sort((x, y) => x - y);
  out.tries = Math.max(0, (A.tries || 0) + (T.tries || 0) - (B.tries || 0), A.tries || 0, T.tries || 0);
  const run = (a ? A.run : T.run) || A.run || T.run;
  if (run) out.run = JSON.parse(JSON.stringify(run));
  return out;
}

// 記録の 板（深い じゅん。おなじ 階なら 先に 着いた 人が 上）。characters … 家族サーバーなら 家族みんな、ひとりの サイトなら 自分の キャラたち
export function sdBoardRows(characters, limit = SD_BOARD_MAX) {
  const rows = [];
  for (const c of Object.values(characters || {})) {
    if (!c || c.species) continue;
    const r = sdRecordOf(c);
    if (!(r.best > 0)) continue;
    rows.push({ id: c.id, name: c.name, best: r.best, at: r.at, with: r.with, level: c.level, job: c.job });
  }
  rows.sort((x, y) => y.best - x.best || (x.at || 9e15) - (y.at || 9e15) || (x.name < y.name ? -1 : 1));
  return rows.slice(0, limit).map((r, i) => ({ ...r, rank: i + 1 }));
}

// 日付（「10月9日」）
export function sdDate(t) {
  if (!Number.isFinite(t)) return '';
  const d = new Date(t);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}
// 記録の 1行（「地下12階（10月9日・ママといっしょ）」）
export function sdRecordText(r) {
  if (!(r?.best > 0)) return 'まだ記録がない';
  const parts = [sdDate(r.at), r.with?.length ? `${r.with.join('・')}といっしょ` : ''].filter(Boolean);
  return `地下${r.best}階${parts.length ? `（${parts.join('・')}）` : ''}`;
}
