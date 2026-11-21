// 第98回 K4班: 等価交かんの大魔道士の オート（data/jobs-r98-touka.js。新しい 戦いの しくみは ない ので オートだけ）
//   ai.js の decideAlly が battle-kizuna.js の kizunaPlan から よぶ（この 職業の 技〈a.job〉を 持つ 人だけ）
//   となえて いる 時の 大砲（真理のやいば・真理のとびら・大呪文）と 定食（大ぐい定食）は ドラまたと おなじ r85aPlan に まかせる
//   （となえて いる 間は ここでは 何も しない）。ここでは「とうか交かん」（HP を はらって となえ、すぐ もう 1回 動く）を いつ 使うか
//   第96回の 作戦の きまり: ガンガンは 攻撃の 答えだけ 通る（ai.js の only。とうか交かんは 補助なので 通らない ＝ ガンガンでは となえない）
import { chanting } from './battle-r85a.js';
import { mpCost } from './stats.js';

// オートの わりあい（tools/sim-r86a.mjs で 合わせた）。hp … この HP の わりあい いじょうの 時だけ はらう
export const TOUKA_AI = { touka: 0.8, hp: 0.45, many: 0.5 };

export function toukaPlan(b, c, foes, mine, allies, fw) {
  const my = mine.filter(({ a }) => a.job === 'touka_madoushi');
  if (!my.length || !foes.length || c.side !== 'ally') return null;
  if (chanting(c)) return null;
  const touka = my.find(({ id }) => id === 'tk_touka');
  if (!touka) return null;
  const boss = foes.find((f) => f.boss);
  const hard = !!(boss || fw?.hard);
  if (!hard && foes.length < 3) return null;
  // 前ぶれの 間は「大わざに そなえる」に まかせる
  if (foes.some((f) => f.telegraph)) return null;
  // HP が 少ない 時は はらわない（定食〈r85aPlan〉・回復に まかせる）
  if (c.hp < c.maxHp * TOUKA_AI.hp) return null;
  // 大砲を うつ MP が のこって いる 時だけ（大砲の いちばん 安い 物 ＋ とうか交かん）
  const big = (c.abilities || []).filter((id) => ['tk_blade', 'touka_madoushi_sig'].includes(id));
  if (!big.length) return null;
  const need = mpCost(c.penChar, touka.id) + Math.min(...big.map((id) => mpCost(c.penChar, id)));
  if (c.mp < need) return null;
  if (b.rng.chance(hard ? TOUKA_AI.touka : TOUKA_AI.many)) return { type: 'ability', id: touka.id };
  return null;
}
