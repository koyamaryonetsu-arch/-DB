// 第98回 K4班: 等価交かんの大魔道士の オート（data/jobs-r98-touka.js。新しい 戦いの しくみは ない ので オートだけ）
//   ai.js の decideAlly が battle-kizuna.js の kizunaPlan から よぶ（この 職業の 技〈a.job〉を 持つ 人だけ）
//   定食（大ぐい定食）は ドラまたと おなじ r85aPlan に まかせる。ここでは「とうか交かん」（HP を はらって となえ、すぐ もう 1回 動く）を いつ 使うかと、
//   となえて いる 時に この 職業の 大砲（真理のやいば・真理のとびら・大呪文）を えらぶ こと
//   第96回の 作戦の きまり: ガンガンは 攻撃の 答えだけ 通る（ai.js の only。とうか交かんは 補助なので 通らない ＝ ガンガンでは となえない）
import { chanting } from './battle-r85a.js?v=dc7c9b067c89';
import { mpCost } from './stats.js?v=dc7c9b067c89';

// オートの わりあい（tools/sim-r86a.mjs で 合わせた）。touka … ボスの 時・many … ほかの 強い 敵・敵が 多い 時。hp … この HP の わりあい いじょうの 時だけ はらう
export const TOUKA_AI = { touka: 0.35, hp: 0.6, many: 0.16, blade: 0.6 };

export function toukaPlan(b, c, foes, mine, allies, fw) {
  const my = mine.filter(({ a }) => a.job === 'touka_madoushi');
  if (!my.length || !foes.length || c.side !== 'ally') return null;
  const boss = foes.find((f) => f.boss);
  // となえて いる: この 職業の 大砲（1体なら 真理のやいば・ほかは 真理のとびら・大呪文）。どちらも ない 時は ドラまたの r85aPlan に まかせる
  //   （ギガ・スレイブ〈のこりの MP を 全部〉は ドラまたの 切り札。この 職業は 自分の 大砲を 先に えらぶ）
  if (chanting(c)) {
    const t = boss || foes.slice().sort((x, y) => y.hp - x.hp)[0];
    const sig = my.find(({ id }) => id === 'touka_madoushi_sig');
    const blade = my.find(({ id }) => id === 'tk_blade');
    if (blade && (foes.length === 1 || (boss && foes.length <= 2 && b.rng.chance(TOUKA_AI.blade)))) return { type: 'ability', id: blade.id, target: t.id };
    if (sig) return { type: 'ability', id: sig.id, target: t.id };
    if (blade) return { type: 'ability', id: blade.id, target: t.id };
    return null;
  }
  const touka = my.find(({ id }) => id === 'tk_touka');
  if (!touka) return null;
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
  if (b.rng.chance(boss ? TOUKA_AI.touka : TOUKA_AI.many)) return { type: 'ability', id: touka.id };
  return null;
}
