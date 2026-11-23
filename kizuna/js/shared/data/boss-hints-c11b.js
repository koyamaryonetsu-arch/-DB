// 第3部 第3章 第2幕「月の都と、名前のランプ」の 負けた 時の ヒントの 文（B が 文・E班の しくみ。docs/plan-part3-c11b.md の 18-4）
// C11B_BOSS_HINTS[戦いの id] = [1回目（ぼんやり）, 2回目（もう 少し）, 3回目（はっきり）]。言う 人は ノクト
//   中ボス（ランプの番人）は 2だん・幕の ボス（月のむかえ オボロ）は 3だん（文は 設計 18-4 の まま）
//   40字 くらいまで・子どもに わかる 言葉・しかけの 話だけ
//   ここで mergeBossHints を よぶ（encounters-c11b.js が import する）。もう一度 いどむ 行き先（retry）は A班が 足す
import { mergeBossHints } from './boss-hints.js?v=b3f22aad5877';
import { C11B_BATTLE_B as C11B_BATTLE } from '../maps/c11b-flags.js?v=b3f22aad5877';

export const C11B_HINT_WHO = 'ノクト';
export const C11B_BOSS_HINTS = {
  [C11B_BATTLE.keeper]: [
    'ランプが明るい時と、暗い時で、効くこうげきが、ちがうぞ。',
    '明るい時は呪文、暗い時は物理だ。ランプがちらちらしたら「防御」しろ。',
  ],
  [C11B_BATTLE.oboro]: [
    'オボロの衣で、スピカの思い出が、消えていくぞ。',
    '「よびかける」で、スピカの名前をよべ。思い出がもどる。',
    '天人をたおすと、オボロにこうげきが通る。思い出が「あと1」になる前に、だれかがよびかけろ。',
  ],
};

mergeBossHints(C11B_BOSS_HINTS, { who: Object.fromEntries(Object.keys(C11B_BOSS_HINTS).map((id) => [id, C11B_HINT_WHO])) });
