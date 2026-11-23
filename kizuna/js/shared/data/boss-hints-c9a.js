// 第3部 第1章 第1幕「星ふるえの夜」の ボスに 負けた 時の ヒントの 文（B が 文・E班の しくみ。docs/plan-part3.md の 9-3）
// C9A_BOSS_HINTS[戦いの id] = [1回目（ぼんやり）, 2回目（もう 少し）, 3回目（はっきり）]。言う 人は ノクト（第3部は トキネが ねむって いる）
//   40字 くらいまで・子どもに わかる 言葉・しかけの 話だけ（ボスの 正体・先の 場面は 書かない）
//   3回目は「仲間もつれて来い」… ひとりだけ（仲間 なし）では どちらも 勝てない 強さ（tools/sim-ch9.mjs の PARTY=solo）
//   ここで mergeBossHints を よぶ（encounters-c9a.js が import する）。もう一度 いどむ 行き先（retry）は A班の 台本の id を A班が 足す
import { mergeBossHints } from './boss-hints.js?v=efa1b5f542af';
import { C9A_BATTLE } from '../maps/c9a-flags.js?v=efa1b5f542af';

export const C9A_HINT_WHO = 'ノクト';
export const C9A_BOSS_HINTS = {
  [C9A_BATTLE.trio]: [
    'すいこみ口が星の子をむいた時…だれも前に立たなかったな。',
    'すいこみ口がむいたら、だれかが「防御」で星の子の前に立て。',
    'むいたら1人が「防御」。のこりはすいこみ口をこわせ。仲間もつれて来い。',
  ],
  [C9A_BATTLE.trial]: [
    '火をけされた仲間を、ほうっておくな。',
    '火がある者が、となりに分けてやれ。',
    '「明かりをわける」を使え。全員の火が消えたら負けだ。仲間もつれて来い。',
  ],
};

mergeBossHints(C9A_BOSS_HINTS, { who: { [C9A_BATTLE.trio]: C9A_HINT_WHO, [C9A_BATTLE.trial]: C9A_HINT_WHO } });
