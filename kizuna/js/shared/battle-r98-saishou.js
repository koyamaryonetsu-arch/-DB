// 第98回 K3班: 国を動かす名さいしょうの オート（data/jobs-r98-saishou.js。新しい 戦いの しくみは ない ので オートだけ）
//   ai.js の decideAlly が battle-kizuna.js の kizunaPlan から よぶ（この 職業の 技〈a.job〉を 持つ 人だけ）
//   作戦を 立てる・前ぶれに 先読みの答弁・敵の 強化に ふうじの太極図 は、大軍師と おなじ r83aPlan（4.9。技の こうかで 見る）に まかせる。
//   ここでは かけ合わせの 技（国を動かす大会議）・ながーい会議（敵の 番を おくらせる）・打神べん・国
//   第96回の 作戦の きまり: ガンガンは 攻撃の 答えだけ 通る（ai.js の only）
import { activePlan } from './battle-r83a.js?v=96e031897dcd';

// オートの わりあい（tools/sim-r86a.mjs で 合わせた）
export const SAISHOU_AI = { sig: 0.55, kaigi: 0.35, ten: 0.85, many: 0.15, seme: 1 };

export function saishouPlan(b, c, foes, mine, allies, fw) {
  const my = mine.filter(({ a }) => a.job === 'kuni_saishou');
  if (!my.length || !foes.length) return null;
  const find = (id) => my.find((x) => x.id === id);
  const sig = find('kuni_saishou_sig');
  const boss = foes.find((f) => f.boss);
  // 前ぶれの 間は 先読みの答弁（r83aPlan）・大わざに そなえる に まかせる
  if (foes.some((f) => f.telegraph)) return null;
  const plan = activePlan(b, c.side);
  // 1) ボス: 作戦が あって ほう神計画が 切れて いれば 大会議（作戦の 効き目 2倍・仲間が すぐ 動く）。作戦が まだ なら r83aPlan に まかせる
  if (boss) {
    if (c.hp < c.maxHp * 0.35) return null;
    const sak = my.find(({ a }) => a.effect?.type === 'r83aSakusen');
    if (!plan && sak) return b.rng.chance(SAISHOU_AI.seme) ? { type: 'ability', id: sak.id, sakusen: 'seme' } : null;
    if (sig && !(plan?.boost > 0) && c.mp >= c.maxMp * 0.3 && b.rng.chance(SAISHOU_AI.sig)) return { type: 'ability', id: sig.id };
    // ボスの 番が 近い ＝ ながーい会議（番を おくらせる）
    const kaigi = find('msj_kaigi');
    if (kaigi && (boss.atb || 0) >= 50 && b.rng.chance(SAISHOU_AI.kaigi)) return { type: 'ability', id: kaigi.id };
    const ten = find('msj_ten');
    if (ten && b.rng.chance(SAISHOU_AI.ten)) return { type: 'ability', id: ten.id, target: boss.id };
    return null;
  }
  // 2) 敵が 多い ＝ ながーい会議（敵の 番を おくらせる）。大会議は ボスだけ（ふだんの 戦いで 作戦 2倍を くり返すと 強すぎる。sim-jobs の 1人の ダメージ）
  if (foes.length >= 3 && b.rng.chance(SAISHOU_AI.many)) {
    const kaigi = find('msj_kaigi');
    if (kaigi) return { type: 'ability', id: kaigi.id };
  }
  return null;
}
