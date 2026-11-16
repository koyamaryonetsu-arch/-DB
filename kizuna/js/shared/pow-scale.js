// 呪文・回復の 魔力の 伸び（第87回 A班。docs/plan-balance-r87.md の 3-A）
//   x ＝（魔力〈回復の 技は 回復魔力〉− 技の めやす thr）÷ 150
//   倍率 ＝ 1 ＋ x を 0〜cap に 切った 数（cap は 技の scaleCap。書いて いなければ 1 ＝ 2倍で 頭打ち）
//   第87回: 味方は 頭打ちの あとも 3分の 1 の 速さで のびる（こえた 分 ÷ 3 を 足す。足す 分は ＋1.0 まで ＝ 全部で 3倍まで）
//     ・技に scaleCap が 書いて ある 物（わざと 頭打ちを 低く して いる 技）は 足さない
//     ・敵の 側（敵・ボス・試練の まぼろし・鏡の うつし身・かけの 魔物〈flip〉）は 足さない
// つかう 所: battle.js の calcMagic・heal・healAmountOf、ai.js の 回復の みつもり、
//   battle-dual.js（合体技の 見つもり・回復。下の powScaleDual）、skill-power.js・skill-sort.js（技の せつめい・ならび）、world/services.js（町・フィールドの 回復）
export const POW_SPAN = 150; // めやすから ＋150 で 2倍
export const OVER_RATE = 1 / 3; // 頭打ちの あとの のびの 速さ
export const OVER_MAX = 1; // 頭打ちの あとに 足す 分の 上限

// 頭打ちの あとも のびる 人か（味方だけ。かけの 魔物は 敵と おなじ 決まり）
export const growsAfterCap = (c) => !!c && c.side === 'ally' && !c.flip;

// pow: 魔力（回復魔力）・e: 技の 効果（thr・scaleCap）・grow: 頭打ちの あとも のびるか
export function powScaleOf(pow, e, grow = false) {
  const x = ((pow || 0) - (e?.thr ?? 20)) / POW_SPAN;
  const cap = e?.scaleCap ?? 1;
  let k = 1 + Math.max(0, Math.min(cap, x));
  if (grow && e?.scaleCap == null) k += Math.min(OVER_MAX, Math.max(0, x - cap) * OVER_RATE);
  return k;
}

// 第87回 E班: 合体技は「頭打ちの あとの のび」の 外（頭打ちで 止まる 前の 式）。合体技は もう 強いので これ いじょう 強く しない
//   つかう 所: battle-dual.js の skillEstimate（技に dualEst: true を つけて calcMagic へ）・memberHeal
export const powScaleDual = (pow, e) => powScaleOf(pow, e, false);

// 戦いの 中の 人 c が つかった 時の 倍率（e.dualEst … 合体技の 見つもり。のびない）
export const powScaleFor = (c, pow, e) => (e?.dualEst ? powScaleDual(pow, e) : powScaleOf(pow, e, growsAfterCap(c)));
