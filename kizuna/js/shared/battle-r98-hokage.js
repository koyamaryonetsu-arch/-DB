// 第98回 K1班: 八竜の火影の オート（data/jobs-r98-hokage.js。しくみは 親の 物〈影分身・火竜・姫を守る忍び〉と 火の意志〈battle-phantom-a.js の will〉）
//   ai.js の decideAlly が battle-kizuna.js の kizunaPlan から よぶ（この 職業の 技〈a.job〉を 持つ 人だけ）
//   火竜を よぶ（火竜をよぶ・火影。れっしんで 生き返らせる など）・里を守る忍び は 烈火と おなじ r85bPlan に まかせる（4.96）
//   第96回の 作戦の きまり: ガンガンは 攻撃の 答えだけ 通る（ai.js の only）。しくみの ある ボスで みんな オートの 時は tacticsOf が 前の えらび方に する
import { fallenAllies } from './battle-phantom-a.js?v=98a59fb17475';

// オートの わりあい（tools/sim-r86a.mjs で 合わせた）
export const HOKAGE_AI = { bunshin: 0.5, sig: 0.4, rendan: 0.6, rasen: 0.4, many: 0.4, will: 0.8 };

export function hokagePlan(b, c, foes, mine, allies, fw) {
  const my = mine.filter(({ a }) => a.job === 'hachiryu_hokage');
  if (!my.length || !foes.length) return null;
  const find = (id) => my.find((x) => x.id === id);
  const sig = find('hachiryu_hokage_sig');
  const boss = foes.find((f) => f.boss);
  const tele = foes.some((f) => f.telegraph);
  const clones = c.clones?.n || 0;
  // 前ぶれの 間は「大わざに そなえる」に まかせる
  if (tele) return null;
  // 1) 仲間が たおれて いる: 生き返らせる 火竜（れっしん。r85bPlan）に まかせる。MP が たりない・れっしんを 持たない 時は 火の意志で 看板
  if (fallenAllies(b, c) > 0) {
    const ryu = my.find(({ a }) => a.effect?.type === 'r85bRyu');
    if (ryu && c.mp >= 20) return null;
    if (sig && b.rng.chance(HOKAGE_AI.will)) return { type: 'ability', id: sig.id };
  }
  // 2) ボス: 分身が いなければ 影分身 → 分身・火竜れんだ／ときどき 看板（分身を 6人 出して 消える）・火竜らせん丸
  if (boss) {
    if (c.hp < c.maxHp * 0.35) return null;
    const t = boss;
    const bunshin = find('hh_bunshin');
    if (!clones && bunshin && b.rng.chance(HOKAGE_AI.bunshin)) return { type: 'ability', id: bunshin.id };
    const rendan = find('hh_rendan');
    if (clones && rendan && b.rng.chance(HOKAGE_AI.rendan)) return { type: 'ability', id: rendan.id, target: t.id };
    if (sig && b.rng.chance(HOKAGE_AI.sig)) return { type: 'ability', id: sig.id };
    const rasen = find('hh_rasen');
    if (rasen && b.rng.chance(HOKAGE_AI.rasen)) return { type: 'ability', id: rasen.id, target: t.id };
    return null;
  }
  // 3) 敵が 多い ＝ 看板（分身を 6人 出して 消える）・花火手裏剣（看板の MP が ない 時）
  if (foes.length >= 3 && b.rng.chance(HOKAGE_AI.many)) {
    if (sig) return { type: 'ability', id: sig.id };
    const hanabi = find('hh_hanabi');
    if (hanabi) return { type: 'ability', id: hanabi.id };
  }
  return null;
}
