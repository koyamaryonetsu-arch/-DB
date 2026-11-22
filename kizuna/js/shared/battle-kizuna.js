// 第98回: きずなの職業の 戦いの まとめ（オートの 計画。docs/plan-kizuna-jobs.md）
//   きずなの職業は 新しい 戦いの しくみを 作らず、親の しくみ（火竜・予兆保全・影分身 など）を 使う。ここは 職業ごとの オートの 計画だけ
//   ai.js の decideAlly が 4.78 で kizunaPlan を 1回 よぶ（ここに 足しても ai.js は かえなくて よい）
// ★ あとの 組へ: shared/battle-r98-<名前>.js に <名前>Plan を 作って、下の PLANS の おわりに 1行 足す（import も 1行）
import { kuuchouPlan } from './battle-r98-kuuchou.js?v=379ca0afcef1';
import { hokagePlan } from './battle-r98-hokage.js?v=379ca0afcef1';
import { hyakkiPlan } from './battle-r98-hyakki.js?v=379ca0afcef1';
import { kengouPlan } from './battle-r98-kengou.js?v=379ca0afcef1';
import { saishouPlan } from './battle-r98-saishou.js?v=379ca0afcef1';
import { ptaPlan } from './battle-r98-pta.js?v=379ca0afcef1';
import { keijiPlan } from './battle-r98-keiji.js?v=379ca0afcef1';
import { otenkiPlan } from './battle-r98-otenki.js?v=379ca0afcef1';
import { toukaPlan } from './battle-r98-touka.js?v=379ca0afcef1';

const PLANS = [
  kuuchouPlan, // 熱と風の空調マスター
  hokagePlan, // 八竜の火影
  hyakkiPlan, // 百きの大将
  kengouPlan, // 天下無そうの剣ごう
  saishouPlan, // 国を動かす名さいしょう
  ptaPlan, // 伝説のPTA会長
  keijiPlan, // 元ヤンのけいじ
  otenkiPlan, // おてんき格闘流の師はん
  toukaPlan, // 等価交かんの大魔道士
];

// 1つ 答えが 出たら それを かえす（その 職業の 技を 持たない 人は どれも null。運も 使わない）
export function kizunaPlan(b, c, foes, mine, allies, fw) {
  for (const plan of PLANS) {
    const cmd = plan(b, c, foes, mine, allies, fw);
    if (cmd) return cmd;
  }
  return null;
}
