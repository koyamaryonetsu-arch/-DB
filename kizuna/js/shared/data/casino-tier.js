// 第37回 B: カジノの「豪華さの段」（宝の地図を クリアした 数で きまる）
//
// ・c.tmClears … 宝の地図の 主を たおした 数（キャラごと。へらない）。world/treasure.js の bossEvent で 1つ ふやす
//   むかしの セーブには ない。はじめて 見た ときに、のこっている きろく（c.flags の tmc_… と、
//   c.treasureMaps の cleared）から 1回だけ 数えなおす（ensureTmClears。world/save.js の repairChar から）
//   ※ 古い 地図の きろくは セーブが ふえすぎない ように 消える（world/treasure.js の pruneTreasureData）ので、
//     数えなおしで わかるのは のこっている ぶん だけ
// ・段 0〜4: 段0（0〜2）・段1（3〜5）・段2（6〜9）・段3（10〜14）・段4（15〜）
//   段が 上がると、景品が ふえ、すごろく場に 新しい すごろくが 入る（data/casino.js・data/sugoroku.js）

export const TIER_AT = [0, 3, 6, 10, 15];
export const TIER_MAX = TIER_AT.length - 1;
export const TIER_NAMES = ['ふつう', 'ブロンズ', 'シルバー', 'ゴールド', 'レジェンド'];

const seed36 = (seed) => (seed >>> 0).toString(36);

// のこっている きろくから 数える（むかしの セーブ用）
export function countOldTmClears(c) {
  const keys = new Set();
  const flags = c?.flags && typeof c.flags === 'object' ? c.flags : {};
  for (const [k, v] of Object.entries(flags)) if (v && k.startsWith('tmc_') && k.length > 4) keys.add(k.slice(4));
  for (const tm of Array.isArray(c?.treasureMaps) ? c.treasureMaps : []) {
    if (tm && tm.cleared && Number.isFinite(tm.seed)) keys.add(seed36(tm.seed));
  }
  return keys.size;
}

// クリアした 数（まだ 数えていない セーブは のこっている きろくから）
export function tmClearCount(c) {
  const n = Math.floor(Number(c?.tmClears));
  if (Number.isFinite(n) && c?.tmClears !== null && c?.tmClears !== undefined) return Math.max(0, n);
  return countOldTmClears(c);
}

// 数を セーブに のこす（何回 よんでも おなじ。新しい クリアを 数える 前に よぶ）
export function ensureTmClears(c) {
  if (!c || typeof c !== 'object' || c.species) return 0;
  const n = Math.floor(Number(c.tmClears));
  c.tmClears = Number.isFinite(n) && c.tmClears !== null ? Math.max(0, n) : countOldTmClears(c);
  return c.tmClears;
}

// 1つ クリアした
export function addTmClear(c) {
  ensureTmClears(c);
  c.tmClears += 1;
  return c.tmClears;
}

export function tierFor(n) {
  let t = 0;
  for (let i = 0; i < TIER_AT.length; i++) if (n >= TIER_AT[i]) t = i;
  return t;
}

// その キャラの 段
export function casinoTier(c) {
  return tierFor(tmClearCount(c));
}

// 次の 段まで あと いくつ（いちばん 上なら 0）
export function tierLeft(c) {
  const t = casinoTier(c);
  return t >= TIER_MAX ? 0 : TIER_AT[t + 1] - tmClearCount(c);
}

// カジノの まどに わたす まとめ
export function tierInfo(c) {
  const t = casinoTier(c);
  return { tier: t, clears: tmClearCount(c), left: tierLeft(c), name: TIER_NAMES[t], at: TIER_AT };
}
