// 第3部 第2章 第2幕「青と白」の 中ボスに 負けた 時の ヒントの 文（B が 文・E班の しくみ。docs/plan-part3-c10b.md の 14-3）
// C10B_BOSS_HINTS[戦いの id] = [1回目（ぼんやり）, 2回目（もう 少し）, 3回目（はっきり）]。言う 人は ノクト
//   40字 くらいまで・子どもに わかる 言葉・しかけの 話だけ
//   ここで mergeBossHints を よぶ（encounters-c10b.js が import する）。もう一度 いどむ 行き先（retry）は A班が 足す
import { mergeBossHints } from './boss-hints.js?v=2a0885f3a643';
import { C10B_BATTLE_B as C10B_BATTLE } from '../maps/c10b-flags.js?v=2a0885f3a643';

export const C10B_HINT_WHO = 'ノクト';
export const C10B_BOSS_HINTS = {
  [C10B_BATTLE.blue]: [
    'あいつの体、砂だ。かわいていると、こうげきが通らないぞ。',
    '水の音を鳴らせ。ぬらせば、こうげきが通る。',
    '水は、2つぶんくらいが、ちょうどいい。入れすぎると、大かんそうが来る。雷か氷で止めろ。',
  ],
  [C10B_BATTLE.white]: [
    '3人いるが、本物は1人だ。にせものをなぐると、からかわれるぞ。',
    '動いたやつが、本物だ。どこが動いたか、よく見ろ。',
    'まざったら、次に動くまで待て。スピカにてらしてもらえば、本物が光る。',
  ],
};

mergeBossHints(C10B_BOSS_HINTS, { who: { [C10B_BATTLE.blue]: C10B_HINT_WHO, [C10B_BATTLE.white]: C10B_HINT_WHO } });
