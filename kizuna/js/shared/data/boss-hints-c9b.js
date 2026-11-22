// 第3部 第1章 第2幕「鉱山の底の先」の ボスに 負けた 時の ヒントの 文（B が 文・E班の しくみ。docs/plan-part3.md の 10-3）
// C9B_BOSS_HINTS[戦いの id] = [1回目（ぼんやり）, 2回目（もう 少し）, 3回目（はっきり）]。言う 人は ノクト
//   40字 くらいまで・子どもに わかる 言葉・しかけの 話だけ
//   ここで mergeBossHints を よぶ（encounters-c9b.js が import する）。もう一度 いどむ 行き先（retry）は A班が 足す
import { mergeBossHints } from './boss-hints.js?v=a3f1dc027cbc';
import { C9B_BATTLE } from '../maps/c9b-flags.js?v=a3f1dc027cbc';

export const C9B_HINT_WHO = 'ノクト';
export const C9B_BOSS_HINTS = {
  [C9B_BATTLE.king]: [
    'あいつ、食べる前に、皿をじっと見てるぞ。',
    '見てる皿を、先にこわせ。食べさせるな。',
    '暗くなったらスピカにてらしてもらえ。大ジャンプは防御だ。仲間もつれて来い。',
  ],
};

mergeBossHints(C9B_BOSS_HINTS, { who: { [C9B_BATTLE.king]: C9B_HINT_WHO } });
