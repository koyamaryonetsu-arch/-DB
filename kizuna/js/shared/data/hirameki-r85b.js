// 第85回 B班: 烈火の炎の 系統の ひらめき技（2つの 職業に 1つずつ。第84回 B班〈らんま1/2 の 系統〉と おなじ）
// ・しくみは hirameki-r29.js と おなじ
//   job … その 職業か、その 職業から 進んだ 職業の とき だけ ひらめく（stats.js の hiraAllowed）
//   from … その 道の 技を 使った 回数
//   強さは その 職業の 同じくらいの MPの 技と おなじくらい
// ・id は hi_ で はじめる。炎の 技は 晴れの 天気で ×1.3（R85B_FIRE に 足す）
import { R85B_FIRE } from './abilities-r85b.js?v=ff854d15a612';

const sk = (job, o) => ({ kind: 'skill', job, hirameki: true, ...o });

export const HIRA_R85B_ABILITIES = {
  // 炎術士: 炎を まとった クナイ
  hi_hikunai: sk('enjutsushi', {
    name: '火のクナイ', kana: 'ひのくない', mp: 7, target: 'enemy',
    effect: { type: 'phys', mult: 2.3, element: 'fire' },
    desc: '炎をまとったクナイを、敵1体に投げつける。炎のダメージ。', cast: '{a}は、火のクナイを投げた！', anim: 'r85b_kiba',
  }),
  // 八竜の炎術士・烈火: 火竜の ほのおを ぜんぶ こぶしに
  hi_ryuken: sk('rekka', {
    name: '火竜のこぶし', kana: 'かりゅうのこぶし', mp: 20, target: 'enemy',
    effect: { type: 'phys', mult: 3.7, element: 'fire' },
    desc: '火竜の炎を右うでに集めて、敵1体を思いきりなぐる。炎のとても大きなダメージ。', cast: '{a}「くらえ、火竜のこぶし！」', anim: 'r85b_kiba',
  }),
};
for (const id of Object.keys(HIRA_R85B_ABILITIES)) R85B_FIRE.add(id);

// ひらめきの じょうけん（技 → 使った 回数）
export const HIRAMEKI_R85B = {
  hi_hikunai: { from: { ej_hanabi: 15, ej_shuriken: 10 } },
  hi_ryuken: { from: { rk_kiba: 12, rk_ryu: 15 } },
};
