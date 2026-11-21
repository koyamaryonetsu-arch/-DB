// 第3部 第2章 第3幕「紫と、うばわれた音」の ボスに 負けた 時の ヒントの 文（B が 文・E班の しくみ。docs/plan-part3-c10c.md の 15-3）
// C10C_BOSS_HINTS[戦いの id] = [1回目（ぼんやり）, 2回目（もう 少し）, 3回目（はっきり）]。言う 人は ノクト
//   40字 くらいまで・子どもに わかる 言葉・しかけの 話だけ
//   ここで mergeBossHints を よぶ（encounters-c10c.js が import する）。もう一度 いどむ 行き先（retry）は A班が 足す
import { mergeBossHints } from './boss-hints.js?v=d4d473d565e8';
import { C10C_BATTLE_B as C10C_BATTLE } from './c10c-names-b.js?v=d4d473d565e8';

export const C10C_HINT_WHO = 'ノクト';
export const C10C_BOSS_HINTS = {
  [C10C_BATTLE.colonel]: [
    '光った石に、雷が落ちるぞ。',
    '「うつる」で、光っていない石へ動け。',
    'みんなで同じ石にかたまるな。雷が外れたら、たたみかけろ。',
  ],
  [C10C_BATTLE.algol]: [
    'あいつ、こっちの強くなる技を、食っているぞ。',
    '強くなる技は、使うな。食われて、回復される。',
    '暗くなったら、てらせ。あいつが音をかざしたら、スピカの星のうただ。',
  ],
};

mergeBossHints(C10C_BOSS_HINTS, { who: { [C10C_BATTLE.colonel]: C10C_HINT_WHO, [C10C_BATTLE.algol]: C10C_HINT_WHO } });
