// 第38回 C: バフ・デバフ・じわじわ回復は「かかった 人の 行動の 回数」で 数える（docs/plan-r38.md の C）
//
// ・バフ・デバフ（攻撃力・守備力・素早さ・魔力・かいひ など）と かばう … かかった 人が BUFF_ACTS 回 行動したら、
//   その 行動の おわりに 切れる（2回 行動する 敵は 1回ずつ 数える）。かけ直すと BUFF_ACTS 回に もどる。
//   ボスの 段階の こうか など ずっと つづく ものは left: Infinity（left の ない 古い 形も ずっと つづく あつかい）
// ・じわじわ回復 … かかった 人の 行動の はじめに 回復する。回数は 技の レベル（道具・合体技・敵の 技は REGEN_BASE 回）
// ・技の レベル … その 技を 使った 回数（ひらめきと おなじ 数え方。char.skillUse）で 1〜5
//
// サーバーでも ブラウザでも つかう（battle.js・client/battle.js・ui/skillinfo.js・ui/menu.js）

export const BUFF_ACTS = 3;

// 技の レベル: 使った 回数が この 数に なると Lv1・Lv2・Lv3・Lv4・Lv5（ひらめきの 回数は 6〜15回が 多い）
export const SKILL_LV_USES = [0, 5, 15, 30, 50];
export const SKILL_LV_MAX = SKILL_LV_USES.length;

export function skillLvOf(n) {
  let lv = 1;
  for (let i = 1; i < SKILL_LV_USES.length; i++) if ((n || 0) >= SKILL_LV_USES[i]) lv = i + 1;
  return lv;
}

// use … 使った 回数（char.skillUse か たたかいの c.use）
export function skillLevel(use, id) {
  return skillLvOf(use?.[id] || 0);
}

// つぎの レベルまで あと 何回（Lv5 なら null）
export function skillLvLeft(n) {
  const lv = skillLvOf(n);
  return lv >= SKILL_LV_MAX ? null : SKILL_LV_USES[lv] - (n || 0);
}

// じわじわ回復の 回数（技Lv1・2 … 3回 / Lv3・4 … 4回 / Lv5 … 5回）。道具・料理（合体技の ごはん など）・敵の 技は REGEN_BASE
export const REGEN_BASE = 3;
export const REGEN_TIMES = [3, 3, 4, 4, 5];
export function regenTimes(lv) {
  if (!lv) return REGEN_BASE;
  return REGEN_TIMES[Math.max(1, Math.min(SKILL_LV_MAX, lv)) - 1];
}

// のこりの 回数（ずっと つづく ものは Infinity）
export function leftOf(b) {
  return Number.isFinite(b?.left) ? b.left : Infinity;
}

// かけ直した ときの のこり（ずっと つづく ものは ずっと。ほかは n 回に もどる）
export function renewLeft(cur, n = BUFF_ACTS) {
  return cur && !Number.isFinite(cur.left) ? Infinity : n;
}

// 戦いの 画面の しるし（client/ui/info.js の buffNames）
export const BUFF_MARKS = { atk: '攻', def: '守', agi: '速', mag: '魔', eva: 'かわ', breath: '息' };
