// ひみつのダンジョンの 番人（10階ごとの ボス）の 強さ（第32回 A）
// 階の 作り・出てくる 魔物・番人を だれに するかは data/secret.js（B）。ここは「強さの 数式」だけ
//
// sdGuardStrength(f, species) → { lv, pow }（world/battles.js の enemyLv・enemyPow。data/treasure.js の scaleEnemy）
//   ・30階までは 今まで どおり（レベル＝階＋5・倍率1）
//   ・40階から（第5章の ころ・やりこみ）は、番人ごとの 倍率 SD_GUARD_POW（深さでは かわらない。番人の レベルが 階と いっしょに 上がる）
//     めやす（tools/sim-boss.mjs）: 主人公が 階＋2 の レベルで 店の 装備（ドゥナの ランク7）だと 3〜5割、
//     レア装備（〜59階は 第5章の ★、60階からは ★5）で レベル＋4 なら 8〜9割
//   ・番人ごとに 強さが ちがう（物語の ボスは もとが 強いので ひかえめ・宝の洞窟の 主は 軽いので 多め・砂クジラは しかけが きついので 1倍の まま）
//     表に ない 番人は SD_GUARD_POW_DEFAULT
import { MONSTERS } from './monsters.js?v=13534ab82dda';

export const SD_GUARD_FROM = 40; // ここから 強く する 階
export const SD_GUARD_POW_DEFAULT = 1.3;
export const SD_GUARD_POW = {
  tm_golem: 1.52, tm_king: 1.72, tm_dragon: 1.5, tm_knight: 1.75, tm_serpent: 1.88, tm_panther: 1.85,
  giant_squid: 1.36, storm_general: 1.33,
  blizzard_mammoth: 1.15, magma_golem: 1.16, flame_knight: 1.18, trial_guardian: 1.17,
  armor_scorpion: 1.15, sand_whale: 1,
};

// 番人の レベル（今までと おなじ：階＋5。1階 4 の 魔物より 2つ 上）
export const sdGuardLevel = (f) => Math.max(1, Math.floor(f)) + 5;

export function sdGuardStrength(f, species) {
  const lv = sdGuardLevel(f);
  if (f < SD_GUARD_FROM) return { lv, pow: 1 };
  const base = SD_GUARD_POW[species] ?? (MONSTERS[species] ? SD_GUARD_POW_DEFAULT : 1);
  return { lv, pow: base };
}
