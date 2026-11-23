// 第98回 K1班: 熱と風の空調マスターの オート（data/jobs-r98-kuuchou.js。新しい 戦いの しくみは ない ので オートだけ）
//   ai.js の decideAlly が battle-kizuna.js の kizunaPlan から よぶ（この 職業の 技〈a.job〉を 持つ 人だけ）
//   火竜を よぶ（火竜をよぶ・冷暖）は 烈火と おなじ r85bPlan に まかせる（4.96）。ここでは かけ合わせの 技（熱と風の全館運転）と 冷ぼう・かん気
//   第96回の 作戦の きまり: ガンガンは 攻撃の 答えだけ 通る（ai.js の only）。しくみの ある ボスで みんな オートの 時は tacticsOf が 前の えらび方に する
// 第98回 K3班: ボスに こくう（火竜をよぶ・冷暖）。MP の 計算は 烈火と おなじ（battle-r85b.js の ryuMp）
import { ryuMp, ryuSetOf } from './battle-r85b.js?v=47b761b2972a';

const badStatus = (x) => ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'].some((s) => x.status?.[s]);

// オートの わりあい（tools/sim-r86a.mjs で 合わせた。R98_AI=k_sig:0.5 などで ためせる）
export const KUUCHOU_AI = { cure: 0.85, many: 0.12, boss: 0.5, kiba: 0.85, guard: 0.35, kokuu: 0.6 };

// mine … 使える 技 [{ id, a }]、fw … ai.js の fightWeight
export function kuuchouPlan(b, c, foes, mine, allies, fw) {
  const my = mine.filter(({ a }) => a.job === 'kuuchou_master');
  if (!my.length || !foes.length) return null;
  const sig = my.find(({ id }) => id === 'kuuchou_master_sig');
  const find = (id) => my.find((x) => x.id === id);
  const boss = foes.find((f) => f.boss);
  const tele = foes.some((f) => f.telegraph);
  // 1) 悪い じょうたいの 仲間が 2人 いじょう ＝ 全館運転（敵も うつ）か 大かん気
  const sick = allies.filter(badStatus);
  if (sick.length >= 2 && b.rng.chance(KUUCHOU_AI.cure)) {
    if (sig) return { type: 'ability', id: sig.id };
    const kanki = find('km_kanki');
    if (kanki) return { type: 'ability', id: kanki.id };
  }
  // 前ぶれの 間は「大わざに そなえる」（身を 守る・守りの 補助）に まかせる
  if (tele) return null;
  // 2) ボスで 守りが 切れて いる 仲間が 多い ＝ 予兆保全・冷暖
  const yochou = find('km_yochou');
  if (boss && yochou && allies.filter((x) => !x.buffs?.def).length > allies.length / 2 && b.rng.chance(KUUCHOU_AI.guard)) return { type: 'ability', id: yochou.id };
  // 3) ボス ＝ 全館運転（ボスの ほかにも 敵が いる 時）・火竜の熱風きば（MP が 少なく 強い。1体なら こちら）
  if (boss) {
    if (c.hp < c.maxHp * 0.35) return null;
    if (sig && foes.length >= 2 && b.rng.chance(KUUCHOU_AI.boss)) return { type: 'ability', id: sig.id };
    // 第98回 K3班: こくう（守りを むしする 光線）を 火竜をよぶ・冷暖 で（MP が たりる 時）
    const ryu = find('km_ryu');
    if (ryu && ryuSetOf(ryu.id).includes('kokuu') && c.mp >= ryuMp(c.penChar || c, ryu.id, 'kokuu') && b.rng.chance(KUUCHOU_AI.kokuu)) return { type: 'ability', id: ryu.id, ryu: 'kokuu', target: boss.id };
    const kiba = find('km_kiba');
    if (kiba && b.rng.chance(KUUCHOU_AI.kiba)) return { type: 'ability', id: kiba.id, target: boss.id };
    return null;
  }
  // 4) 敵が 多い ＝ 全館運転・冷ぼう全開
  if (foes.length >= 3 && b.rng.chance(KUUCHOU_AI.many)) {
    if (sig && fw?.hard) return { type: 'ability', id: sig.id };
    const rei = find('km_reibou') || find('km_netpuu');
    if (rei) return { type: 'ability', id: rei.id };
  }
  return null;
}
