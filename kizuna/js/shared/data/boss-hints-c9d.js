// 第3部 第1章 第4幕「星のはかば」の ボスに 負けた 時の ヒントの 文（B が 文・E班の しくみ。docs/plan-part3-c9d.md の 12-3）
// C9D_BOSS_HINTS[戦いの id] = [1回目（ぼんやり）, 2回目（もう 少し）, 3回目（はっきり）]。言う 人は ノクト
//   40字 くらいまで・子どもに わかる 言葉・しかけの 話だけ
//   ここで mergeBossHints を よぶ（encounters-c9d.js が import する）。もう一度 いどむ 行き先（retry）は A班が 足す
import { mergeBossHints } from './boss-hints.js?v=34af8e641519';
import { C9D_BATTLE } from '../maps/c9d-flags.js?v=34af8e641519';

export const C9D_HINT_WHO = 'ノクト';
export const C9D_BOSS_HINTS = {
  [C9D_BATTLE.mu]: [
    '片方だけたおしても、起こされるぞ。',
    '2体を、同じくらいに、けずれ。へとへとになるまでな。',
    '2体とも、へとへとにしてから、全体攻撃でいっきにだ。おかしは、スピカの星のうただ。',
  ],
};

mergeBossHints(C9D_BOSS_HINTS, { who: { [C9D_BATTLE.mu]: C9D_HINT_WHO } });
