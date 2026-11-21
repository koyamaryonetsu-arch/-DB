// 第3部 第1章 第3幕「さかさのピラミッド」の ボスに 負けた 時の ヒントの 文（B が 文・E班の しくみ。docs/plan-part3.md の 11-4）
// C9C_BOSS_HINTS[戦いの id] = [1回目（ぼんやり）, 2回目（もう 少し）, 3回目（はっきり）]。言う 人は ノクト
//   40字 くらいまで・子どもに わかる 言葉・しかけの 話だけ
//   ここで mergeBossHints を よぶ（encounters-c9c.js が import する）。もう一度 いどむ 行き先（retry）は A班が 足す
import { mergeBossHints } from './boss-hints.js?v=7eefef6c1f45';
import { C9C_BATTLE } from '../maps/c9c-flags.js?v=7eefef6c1f45';

export const C9C_HINT_WHO = 'ノクト';
export const C9C_BOSS_HINTS = {
  [C9C_BATTLE.riddle]: [
    'あいつのなぞ、ほうっておくと、いたい目にあうぞ。',
    '「こたえる」で、答えをえらべ。さかさに読むんだ。',
    '正かいすると、守りが消える。その間に、たたみかけろ。',
  ],
  [C9C_BATTLE.trio2]: [
    'あのメカ、砂が落ちきると、ばくはつするぞ。',
    '「ひっくり返す」で、砂をもどせ。',
    '砂が少なくなるまで待ってから、ひっくり返せ。目を回したら、たたみかけろ。',
  ],
};

mergeBossHints(C9C_BOSS_HINTS, { who: { [C9C_BATTLE.riddle]: C9C_HINT_WHO, [C9C_BATTLE.trio2]: C9C_HINT_WHO } });
