// 第98回 K2班: 百きの大将の オート（data/jobs-r98-hyakki.js。しくみは 親の 物〈ばくりゅうは・大よう化・風の技・運しだいの 技〉と ばくりゅうはの share〈battle-r82a.js〉）
//   ai.js の decideAlly が battle-kizuna.js の kizunaPlan から よぶ（この 職業の 技〈a.job〉を 持つ 人だけ）
//   第96回の 作戦の きまり: ガンガンは 攻撃の 答えだけ 通る（ai.js の only）。しくみの ある ボスで みんな オートの 時は tacticsOf が 前の えらび方に する

// オートの わりあい（tools/sim-r86a.mjs・tools/sim-jobs.mjs で 合わせた）
export const HYAKKI_AI = { tele: 0.85, yobu: 0.35, daiyou: 0.2, sig: 0.2, boss: 0.3, many: 0.12 };

export function hyakkiPlan(b, c, foes, mine, allies, fw) {
  const my = mine.filter(({ a }) => a.job === 'hyakki_taishou');
  if (!my.length || !foes.length) return null;
  const find = (id) => my.find((x) => x.id === id);
  const sig = find('hyakki_taishou_sig');
  const boss = foes.find((f) => f.boss);
  const tele = foes.some((f) => f.telegraph);
  // 1) 前ぶれ ＝ ばくりゅうはの かまえ（看板なら ようかいの 行列 ＋ かまえ。返すと 仲間に 力が のる）
  if (tele) {
    if (c.stance?.kind === 'bakuryu' || !b.rng.chance(HYAKKI_AI.tele)) return null;
    const bk = sig || find('hyk_bakuryu');
    return bk ? { type: 'ability', id: bk.id } : null;
  }
  // 2) ボス: 仲間の 半分 いじょうが 強く なって いない ＝ ようかいを よぶ／大よう化／ときどき 看板／はり手・竜りんの大きば
  if (boss) {
    if (c.hp < c.maxHp * 0.35) return null;
    const yobu = find('hyk_yobu');
    const weak = allies.filter((x) => x.alive && !x.buffs?.atk).length;
    if (yobu && weak * 2 >= allies.length && b.rng.chance(HYAKKI_AI.yobu)) return { type: 'ability', id: yobu.id };
    const dy = find('hyk_daiyou');
    if (dy && !c.youkaiCtl && !c.youkai && b.rng.chance(HYAKKI_AI.daiyou)) return { type: 'ability', id: dy.id };
    if (sig && b.rng.chance(HYAKKI_AI.sig)) return { type: 'ability', id: sig.id };
    if (b.rng.chance(HYAKKI_AI.boss)) {
      const one = c.mp < c.maxMp * 0.3 ? find('hyk_ryurin') || find('hyk_harite') : find('hyk_harite') || find('hyk_ryurin');
      if (one) return { type: 'ability', id: one.id, target: boss.id };
    }
    return null;
  }
  // 3) 敵が 多い ＝ 看板（強い 敵）・百きの風のきず・お皿の大つなみ
  if (foes.length >= 3 && b.rng.chance(HYAKKI_AI.many)) {
    if (sig && fw?.hard) return { type: 'ability', id: sig.id };
    const all = find('hyk_kaze') || find('hyk_osara');
    if (all) return { type: 'ability', id: all.id };
  }
  return null;
}
