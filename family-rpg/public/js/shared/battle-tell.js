// 第92回 第3便: 前ぶれの 間は、えらぶ 人を 待つ（第3部の ボス。battle.js の tick・advance から よぶ）
//
// ・ボスの 側は「今、こたえが いる 前ぶれが 出て いる」と いう しるし b.tell を 立てる だけ（null … ない。文字 … なんの 前ぶれか）
//   （第3部 第1章 … battle-c9a.js の c9Tell を c9aAfter で 毎回 入れる。ほかの 幕の ボスも 同じ ように 行動の あとで 入れる）
// ・b.tell が ある 間、人が 動かす 味方（controller が あって オートで ない）の コマンドの まどが 開いて いる
//   （番が 来て、まだ えらんで いない）と、敵の ゲージは 進まない。味方の ゲージ・どく は ふだん どおり
// ・オートの 味方・自動の 仲間・魔物の 仲間は 待たない（humans() に 入らない）
// ・1つの まどに つき 待つのは TELL_HOLD_MAX まで（席を はなれても 止まらない ように）。こえたら 時は 流れる
// ・ウェイトの 設定とは べつ（ウェイトで 止まって いる 間は 何も しない）。b.tell が ない 戦いは 何も かわらない
// ・待って いる 間が かわると { t: 'hold', on } を 出す（画面の「えらぶまで、待っているよ」）
export const TELL_HOLD_MAX = 20000;

// この ティックで 敵の ゲージを 止めるか（dtReal … 本当の ミリびょう。skip … ウェイトで もう 止まって いる）
export function tellHold(b, dtReal, skip = false) {
  let on = false;
  if (b.tell || b.holding) {
    for (const h of b.humans()) {
      if (!b.tell || skip || !h.alive || !h.ready) {
        if (h.tellMs) h.tellMs = 0;
        continue;
      }
      h.tellMs = (h.tellMs || 0) + dtReal;
      if (h.tellMs <= TELL_HOLD_MAX) on = true;
    }
  }
  if (on !== !!b.holding) {
    b.holding = on;
    b.emit({ t: 'hold', on });
  }
  return on;
}
