// 第66回 B班（2026年11月）の 伝説の 職業 4つの ひらめき技（ニューカワイイ・SMAP・大御所・五つ星シェフ）
//
// ・1つの 職業に 2つずつ（ほかの 伝説の 職業と おなじ）。しくみは hirameki-r41a.js と おなじ
//   job … その 職業の とき だけ ひらめく（stats.js の hiraAllowed）
//   from … その 職業の 技を 使った 回数（伝説の 技は MPが 多いので、回数は 少なめ）
//   強さは その 職業の 同じくらいの MPの 技と おなじくらい
//   anim は 前から ある エフェクト
// ・id は hi_ で はじめる

const sk = (job, o) => ({ kind: 'skill', job, hirameki: true, ...o });

export const HIRA_R66B_ABILITIES = {
  // ニューカワイイ: きゅんと させる ビームと、ファンの おうえん
  hi_nk_kyun: sk('new_kawaii', {
    name: 'きゅんきゅんビーム', kana: 'きゅんきゅんびーむ', mp: 22, target: 'enemy',
    effect: { type: 'magic', element: 'light', base: [175, 205], thr: 80 },
    desc: '胸がきゅんとなる、ピンクのハートがとびだす。敵1体に光の大ダメージ。', cast: '{a}のきゅんきゅんビーム！', anim: 'hearts',
  }),
  hi_nk_fan: sk('new_kawaii', {
    name: 'ファンのおうえん', kana: 'ふぁんのおうえん', mp: 24, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [120, 150], thr: 60 }, { type: 'buff', stat: 'agi', mult: 1.3, dur: 40 }] },
    desc: '会場のファンが、ペンライトをふっておうえんしてくれる。仲間全員のHPを回復して、素早さも上がる。', cast: '会場いっぱいのペンライトが、ゆれている！', anim: 'heal2',
  }),
  // SMAP: ばくはつする ダンスと、5つの ハート
  hi_sm_dynamite: sk('smap', {
    name: 'ダイナマイト', kana: 'だいなまいと', mp: 24, target: 'enemies',
    effect: { type: 'magic', element: 'blast', base: [130, 155], thr: 75 },
    desc: 'ばくはつするようなダンスで、ステージがもえ上がる。敵全体に爆発のダメージ。', cast: '{a}のダイナマイトなダンス！', anim: 'blast2',
  }),
  hi_sm_five: sk('smap', {
    name: '5つのハート', kana: 'いつつのはーと', mp: 24, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [120, 150], thr: 60 }, { type: 'buff', stat: 'def', mult: 1.3, dur: 40 }] },
    desc: '5人の心が、仲間をやさしくつつむ。仲間全員のHPを回復して、守備力も上がる。', cast: '5つのハートが、仲間をつつんだ！', anim: 'heal_dance',
  }),
  // 大御所: 全員ずっこけと、大御所の おごり
  hi_og_zukkoke: sk('oogosho', {
    name: '全員ずっこけ', kana: 'ぜんいんずっこけ', mp: 22, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 1.3 },
        { type: 'atbSet', sub: 30, chance: 0.4, msg: '{t}は、ずっこけた！', failMsg: '{t}は、ふみとどまった！' },
      ],
    },
    desc: 'お決まりのギャグで、みんないっせいにずっこける。敵全体にダメージ。ころんで動きがおそくなる敵もいる。', cast: '{a}のギャグに、みんなずっこけた！', anim: 'laugh',
  }),
  hi_og_ogori: sk('oogosho', {
    name: '大御所のおごり', kana: 'おおごしょのおごり', mp: 22, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [100, 125], thr: 60 }, { type: 'mpHeal', base: [6, 10] }] },
    desc: '「今日は、わしのおごりや！」仲間全員のHPとMPを回復する。', cast: '{a}「今日は、わしのおごりや！」', anim: 'coins',
  }),
  // 五つ星シェフ: 五つ星の ステーキと、まかないごはん
  hi_fc_steak: sk('five_star_chef', {
    name: '五つ星ステーキ', kana: 'いつつぼしすてーき', mp: 22, target: 'enemy',
    effect: { type: 'magic', element: 'fire', base: [175, 205], thr: 80 },
    desc: 'じゅうじゅう音を立てる、あつあつの鉄板。敵1体に炎の大ダメージ。', cast: '{a}の五つ星ステーキ！鉄板がじゅうじゅう鳴る！', anim: 'fire3',
  }),
  hi_fc_makanai: sk('five_star_chef', {
    name: 'まかないごはん', kana: 'まかないごはん', mp: 24, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [120, 150], thr: 60 }, { type: 'regen', base: [16, 20], thr: 30, dur: 24 }] },
    desc: 'お店のみんなで食べる、ほっとするまかないごはん。仲間全員のHPを回復して、そのあとも少しずつ回復する。', cast: '{a}「さあ、まかないにしよう！」', anim: 'heal2',
  }),
};

// ひらめきの じょうけん（技 → 使った 回数）
export const HIRAMEKI_R66B = {
  hi_nk_kyun: { from: { nk_heart: 10, nk_mitore: 6 } },
  hi_nk_fan: { from: { nk_yell: 8, nk_ichiban: 6 } },
  hi_sm_dynamite: { from: { sm_inazuma: 10, sm_shake: 6 } },
  hi_sm_five: { from: { sm_ganbaro: 8, sm_lion: 6 } },
  hi_og_zukkoke: { from: { og_bakushou: 10, og_boke: 6 } },
  hi_og_ogori: { from: { og_wakate: 8, og_hitokoto: 6 } },
  hi_fc_steak: { from: { fc_houchou: 10, fc_flambe: 6 } },
  hi_fc_makanai: { from: { fc_zensai: 8, fc_main: 6 } },
};
