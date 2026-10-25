// 古代の大迷宮の ボス（古竜オルドラ）の しかけを 知っている 人の オート（tools/sim.js の「知っている人」。b.knowsLab）
// ・前ぶれ（大きく 息を すいこんだ）を 見たら、いにしえの炎が 自分の つぎの 番より 先に 来る ときは 身を 守る
// 反撃の構え（しっぽを かかげた）の ときに なぐらないのは、ふつうの オートと おなじ（ai.js の countering）。
// 知らない 人は b.ignoreStance（構えでも なぐる）と、前ぶれでも 守らない（b.labNaive）
import { atbRate } from './battle.js?v=f6a4d212e9b8';

export const LAB_BIG = 'm_old_flare';

export function labPlan(b, c) {
  if (c.side !== 'ally' || !b.knowsLab) return null;
  const mine = 100 / atbRate(c);
  const big = b.aliveEnemies().find((e) => e.telegraph === LAB_BIG);
  if (big && (100 - big.atb) / atbRate(big) <= mine) return { type: 'defend' };
  return null;
}

// 前ぶれに 気づかない 人は、ふつうの「大技に そなえる」も しない
export function labIgnored(b, f) {
  return !!b.labNaive && f.telegraph === LAB_BIG;
}
