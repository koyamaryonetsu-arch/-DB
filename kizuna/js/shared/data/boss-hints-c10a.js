// 第3部 第2章 第1幕「赤と緑」の 中ボスに 負けた 時の ヒントの 文（B が 文・E班の しくみ。docs/plan-part3-c10a.md の 13-5）
// C10A_BOSS_HINTS[戦いの id] = [1回目（ぼんやり）, 2回目（もう 少し）, 3回目（はっきり）]。言う 人は ノクト
//   40字 くらいまで・子どもに わかる 言葉・しかけの 話だけ（「ぼうぎょ」は 漢字の きまりで「防御」と 書く）
//   ここで mergeBossHints を よぶ（encounters-c10a.js が import する）。もう一度 いどむ 行き先（retry）は A班が 足す
import { mergeBossHints } from './boss-hints.js?v=27b736e61284';
import { C10A_BATTLE } from '../maps/c10a-flags.js?v=27b736e61284';

export const C10A_HINT_WHO = 'ノクト';
export const C10A_BOSS_HINTS = {
  [C10A_BATTLE.red]: [
    'あついな…。むりをすると、のぼせるぞ。',
    '防御で、水を飲め。あつさが下がる。',
    'あのメカも、あつくなると止まる。炎を当てろ。氷は、ひやしてしまうぞ。',
  ],
  [C10A_BATTLE.green]: [
    'カビがたまると、動けなくなるぞ。',
    'スピカにてらしてもらえ。カビは、光に弱い。',
    'てらすと、あいつのかべも消える。星のうたと、かわりばんこに使え。',
  ],
};

mergeBossHints(C10A_BOSS_HINTS, { who: { [C10A_BATTLE.red]: C10A_HINT_WHO, [C10A_BATTLE.green]: C10A_HINT_WHO } });
