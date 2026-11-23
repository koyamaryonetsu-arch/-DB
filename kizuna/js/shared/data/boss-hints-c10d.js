// 第3部 第2章 第4幕「金の音と、星の橋」の 負けた 時の ヒントの 文（B が 文・E班の しくみ。docs/plan-part3-c10d.md の 16-3）
// C10D_BOSS_HINTS[戦いの id] = [1回目（ぼんやり）, 2回目（もう 少し）, 3回目（はっきり）]。言う 人は ノクト
//   門の 番人は 1だんの ひとこと（何回 負けても おなじ）
//   40字 くらいまで・子どもに わかる 言葉・しかけの 話だけ
//   ここで mergeBossHints を よぶ（encounters-c10d.js が import する）。もう一度 いどむ 行き先（retry）は A班が 足す
import { mergeBossHints } from './boss-hints.js?v=34af8e641519';
import { C10D_BATTLE_B as C10D_BATTLE } from '../maps/c10d-flags.js?v=34af8e641519';

export const C10D_HINT_WHO = 'ノクト';
export const C10D_BOSS_HINTS = {
  [C10D_BATTLE.gate1]: ['体の色を見ろ。「音を鳴らす」で同じ色を鳴らせば、まくがわれる。'],
  [C10D_BATTLE.gate2]: ['2人はまくの色がちがう。1人ずつ、同じ色の音で、わっていけ。'],
  [C10D_BATTLE.gate3]: ['色は、すぐかわるぞ。しるしをつけられたら、その色の音も鳴らせ。'],
  [C10D_BATTLE.gate4]: ['小さいかけらは、まくをわって、1つずつ早くへらせ。'],
  [C10D_BATTLE.mirror]: [
    'あの鏡、色のまくで、こうげきをはじいているぞ。',
    '「音を鳴らす」で、まくと同じ色の音を鳴らせ。2色とも、だ。',
    '1色鳴らしたら、すぐ、もう1色。スピカの星のうたで、1色ですむようになる。',
  ],
};

mergeBossHints(C10D_BOSS_HINTS, { who: Object.fromEntries(Object.keys(C10D_BOSS_HINTS).map((id) => [id, C10D_HINT_WHO])) });
