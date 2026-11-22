// 第3部 第3章 第1幕「星の船と、星座の島」の 負けた 時の ヒントの 文（B が 文・E班の しくみ。docs/plan-part3-c11a.md の 17-4）
// C11A_BOSS_HINTS[戦いの id] = [1回目（ぼんやり）, 2回目（もう 少し）, 3回目（はっきり）]。言う 人は ノクト
//   中ボス（星座のけもの）は 2だん・幕の ボス（いかり船長）は 3だん
//   40字 くらいまで・子どもに わかる 言葉・しかけの 話だけ
//   ここで mergeBossHints を よぶ（encounters-c11a.js が import する）。もう一度 いどむ 行き先（retry）は A班が 足す
import { mergeBossHints } from './boss-hints.js?v=92b65651df0b';
import { C11A_BATTLE_B as C11A_BATTLE } from './c11a-names-b.js?v=92b65651df0b';

export const C11A_HINT_WHO = 'ノクト';
export const C11A_BOSS_HINTS = {
  [C11A_BATTLE.beast]: [
    '1つだけたおしても、となりの星がのこっていると、よみがえるぞ。',
    'みんなをまとめてけずって、3つの星を、近い番でいっしょにたおせ。',
  ],
  [C11A_BATTLE.pirate]: [
    'あの時計が0になった時、持っているやつが、かまれるぞ。',
    '「時計を投げる」で、船長に投げ返せ。早すぎると、また投げ返される。',
    '数が1か2になるまで、がまんしろ。船長が目を回したら、いっせいにこうげきだ。',
  ],
};

mergeBossHints(C11A_BOSS_HINTS, { who: Object.fromEntries(Object.keys(C11A_BOSS_HINTS).map((id) => [id, C11A_HINT_WHO])) });
