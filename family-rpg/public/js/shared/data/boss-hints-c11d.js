// 第3部 第3章 第4幕「かがやきの女王と、八つめの音」の 負けた 時の ヒントの 文（B が 文・E班の しくみ。docs/plan-part3-c11d.md の 20-5）
// C11D_BOSS_HINTS[戦いの id] = [1回目（ぼんやり）, 2回目（もう 少し）, 3回目（はっきり）]。言う 人は ノクト
//   中ボス（鏡と月の使い）は 2だん・さいごの ボス（かがやきの女王ポラリス）は 3だん（女王の 文は 設計 20-5 の まま）
//   子どもに わかる 言葉・しかけの 話だけ
//   ここで mergeBossHints を よぶ（encounters-c11d.js が import する）。もう一度 いどむ 行き先（retry）は A班が 足す
import { mergeBossHints } from './boss-hints.js';
import { C11D_BATTLE_B as C11D_BATTLE } from './c11d-names-b.js';

export const C11D_HINT_WHO = 'ノクト';
export const C11D_BOSS_HINTS = {
  [C11D_BATTLE.duo]: [
    '前に出ているほうのしかけだけが、きくぞ。今、どっちが前か、よく見ろ。',
    'ミラーレが前なら、まくと同じ色の「音を鳴らす」。オボロが前なら、スピカに「よびかける」だ。',
  ],
  [C11D_BATTLE.queen]: [
    '女王は、いちばん弱っているやつを、はかって、ながすぞ',
    '「手をつなぐ」で、だれかとつないでおけ。つないでいれば、ながされない',
    'みんなで1つの輪になれ。つなぎは3回の番で切れる。切れる前に、つなぎ直せ。「八つの音」は、苦しい時のためにとっておけ',
  ],
};

mergeBossHints(C11D_BOSS_HINTS, { who: Object.fromEntries(Object.keys(C11D_BOSS_HINTS).map((id) => [id, C11D_HINT_WHO])) });
