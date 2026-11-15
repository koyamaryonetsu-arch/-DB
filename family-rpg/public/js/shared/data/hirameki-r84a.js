// 第84回 A班: 幽☆遊☆白書の 系統の ひらめき技（4つの 職業に 1つずつ。第83回 A班〈封神演義の 系統〉と おなじ）
// ・しくみは hirameki-r29.js と おなじ
//   job … その 職業か、その 職業から 進んだ 職業の とき だけ ひらめく（stats.js の hiraAllowed）
//   from … その 道の 技を 使った 回数
//   強さは その 職業の 同じくらいの MPの 技と おなじくらい
// ・id は hi_ で はじめる。どれも れい丸は 使わない（ひらめきは いつでも 出る 技）

const sk = (job, o) => ({ kind: 'skill', job, hirameki: true, ...o });

export const HIRA_R84A_ABILITIES = {
  // ふりょう: バットを ふり回す（素手でも こぶしを ぶん回す）
  hi_furyo_bat: sk('furyo', {
    name: 'ぶんぶんスイング', kana: 'ぶんぶんすいんぐ', mp: 5, target: 'group',
    effect: { type: 'phys', mult: 1.05 },
    desc: '体ごと、ぶんぶんふり回す。同じ種類の敵をまとめてなぎはらう。', cast: '{a}は、体ごとぶんぶんふり回した！', anim: 'r84a_rush',
  }),
  // れい界探てい: 指先の れい力を 少しだけ とばす
  hi_reiki_dan: sk('reikai_tantei', {
    name: 'れい気だん', kana: 'れいきだん', mp: 7, target: 'enemy',
    effect: { type: 'phys', mult: 2.4, atbAfter: 30 },
    desc: '指先から、小さなれい力のつぶをすばやくとばす。敵1体にダメージ。すぐに次の番が来る。', cast: '{a}は、指先かられい気だんをとばした！', anim: 'r84a_reigan',
  }),
  // うら飯ゆう助: 足に れい力を こめた けり
  hi_rei_kick: sk('yusuke', {
    name: 'れい光キック', kana: 'れいこうきっく', mp: 14, target: 'enemy',
    effect: { type: 'phys', mult: 3.6 },
    desc: '足にれい力をこめて、思いきりける。敵1体に大きなダメージ。', cast: '{a}のれい光キック！', anim: 'r84a_punch',
  }),
  // 魔界の王の子: 魔界の 力で 大地を なぐる
  hi_makai_ken: sk('makai_prince', {
    name: '魔界ばくれつけん', kana: 'まかいばくれつけん', mp: 26, target: 'enemies',
    effect: { type: 'phys', mult: 1.0, hits: 7, random: true },
    desc: '魔界の力をこめたこぶしの連打を、敵にランダムで7回打ちこむ。', cast: '{a}の魔界ばくれつけん！', anim: 'r84a_rush',
  }),
};

// ひらめきの じょうけん（技 → 使った 回数）
export const HIRAMEKI_R84A = {
  hi_furyo_bat: { from: { fr_punch: 20, fr_zutsuki: 8 } },
  hi_reiki_dan: { from: { rt_reigan: 12, rt_tame: 8 } },
  hi_rei_kick: { from: { yu_reikou: 15, yu_niren: 6 } },
  hi_makai_ken: { from: { yu_bakuretsu: 10, mk_youga: 10 } },
};
