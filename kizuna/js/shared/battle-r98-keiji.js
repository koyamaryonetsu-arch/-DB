// 第98回 K4班: 元ヤンのけいじの オート（data/jobs-r98-keiji.js。新しい 戦いの しくみは ない ので オートだけ）
//   ai.js の decideAlly が battle-kizuna.js の kizunaPlan から よぶ（この 職業の 技〈a.job〉を 持つ 人だけ）
//   れい丸が 0 の 時に ためる（ねばりの張りこみ）・ざこに れい丸を 使わない きまりは 魔界の王の子と おなじ r84aPlan・r84aAdjust に まかせる
//   ここでは かけ合わせの 技（最後の一発・たいほれい丸）: ボス・強い 敵に、のこりの れい丸が 少ない 時（強い 一発）か、敵が 前ぶれの 大技を ためて いる 時（止める）
//   第96回の 作戦の きまり: ガンガンは 攻撃の 答えだけ 通る（ai.js の only）
import { reiLeft, reiMax } from './battle-r84a.js?v=c20c6ea76166';

// オートの わりあい（tools/sim-r86a.mjs で 合わせた）
export const KEIJI_AI = { last: 0.85, stop: 0.6, reigan: 0.5, siren: 0.5, kikikomi: 0.25, low: 2 };

export function keijiPlan(b, c, foes, mine, allies, fw) {
  const my = mine.filter(({ a }) => a.job === 'motoyan_keiji');
  if (!my.length || !foes.length) return null;
  const find = (id) => my.find((x) => x.id === id);
  const sig = find('motoyan_keiji_sig');
  const boss = foes.find((f) => f.boss);
  const hard = !!(boss || fw?.hard);
  if (!hard) return null;
  const t = boss || foes.slice().sort((x, y) => y.hp - x.hp)[0];
  const left = reiLeft(c), max = reiMax(c);
  // 1) 前ぶれの 大技を ためて いる 敵 ＝ たいほして 止める（れい丸が 1発 いじょう）
  const tele = foes.find((f) => f.telegraph);
  if (tele && sig && left >= 1 && b.rng.chance(KEIJI_AI.stop)) return { type: 'ability', id: sig.id, target: tele.id };
  if (tele) return null;
  // 2) ボスで まだ 弱点が わからない ＝ 聞きこみ調査（守りも 下げる）
  const kiki = find('ky_kikikomi');
  if (boss && kiki && !boss.debuffs?.def && b.rng.chance(KEIJI_AI.kikikomi)) return { type: 'ability', id: kiki.id };
  // 3) のこりが 少ない（KEIJI_AI.low 発 いか）＝ 最後の一発（いちばん 強い）
  if (sig && left >= 1 && left <= KEIJI_AI.low && b.rng.chance(KEIJI_AI.last)) return { type: 'ability', id: sig.id, target: t.id };
  // 4) のこりが 多い ＝ ふつうの れい丸で へらして いく（敵が 多ければ サイレン）
  if (left > KEIJI_AI.low && max) {
    const siren = find('ky_siren');
    if (siren && foes.length >= 3 && left >= 2 && b.rng.chance(KEIJI_AI.siren)) return { type: 'ability', id: siren.id };
    const reigan = find('ky_reigan');
    if (reigan && b.rng.chance(KEIJI_AI.reigan)) return { type: 'ability', id: reigan.id, target: t.id };
  }
  return null;
}
