// 仲間モンスターのスカウト率（縦切り版ではコアロジック+テストのみ）
// - 獣奏士がいると確率上昇
// - 好物を使うと確率上昇
// - 状態異常で倒すと確率低下
// - ボスは原則スカウト不可

import type { MonsterDefinition } from './types';

export interface ScoutContext {
  beastCallerInParty: boolean;
  favoriteUsed: boolean;
  killedByStatus: boolean;
}

export function scoutChance(monster: MonsterDefinition, ctx: ScoutContext): number {
  if (monster.boss) return 0;
  const base = monster.scout?.rate ?? 0;
  if (base <= 0) return 0;
  let rate = base;
  if (ctx.beastCallerInParty) rate *= 1.5;
  if (ctx.favoriteUsed) rate *= 1.6;
  if (ctx.killedByStatus) rate *= 0.5;
  return Math.min(0.95, rate);
}
