// 第3部 第3章 第3幕「はかりの回ろうと、ふたつの光」の 負けた 時の ヒントの 文（B が 文・E班の しくみ。docs/plan-part3-c11c.md の 19-4）
// C11C_BOSS_HINTS[戦いの id] = [1回目（ぼんやり）, 2回目（もう 少し）, 3回目（はっきり）]。言う 人は ノクト
//   中ボス（バラバラン3号）は 2だん・幕の ボス（近衛の隊長エース）は 3だん（文は 設計 19-4 の まま）
//   40字 くらいまで・子どもに わかる 言葉・しかけの 話だけ
//   ここで mergeBossHints を よぶ（encounters-c11c.js が import する）。もう一度 いどむ 行き先（retry）は A班が 足す
import { mergeBossHints } from './boss-hints.js?v=ae1035a9a013';
import { C11C_BATTLE_B as C11C_BATTLE } from './c11c-names-b.js?v=ae1035a9a013';

export const C11C_HINT_WHO = 'ノクト';
export const C11C_BOSS_HINTS = {
  [C11C_BATTLE.mecha]: [
    'こわした所のわざは、出なくなるぞ。でも、あたまは、なおしてしまう。',
    'かたくても、あたまからこわせ。うでがぐるぐる回ったら、ねらわれた人は「防御」だ。',
  ],
  [C11C_BATTLE.ace]: [
    '隊長は、次に使うわざのカードを、先にならべているぞ。',
    'スピカの『てらす』で、うら向きのカードが見える。こわいカードを、アルゴルに食べてもらえ。',
    '食べてもらえるのは、3まいにつき1まいだ。ほうき星か、月のカードをえらべ。星のカードは、ぼうぎょでうけろ。',
  ],
};

mergeBossHints(C11C_BOSS_HINTS, { who: Object.fromEntries(Object.keys(C11C_BOSS_HINTS).map((id) => [id, C11C_HINT_WHO])) });
