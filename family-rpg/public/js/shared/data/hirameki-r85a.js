// 第85回 A班: スレイヤーズの 系統の ひらめき技（3つの 職業に 1つずつ。第84回 B班〈らんま1/2 の 系統〉と おなじ）
// ・しくみは hirameki-r29.js と おなじ
//   job … その 職業か、その 職業から 進んだ 職業の とき だけ ひらめく（stats.js の hiraAllowed）
//   from … その 道の 技を 使った 回数
//   強さは その 職業の 同じくらいの MPの 技と おなじくらい（大砲の 呪文〈となえて から〉より ずっと 弱い）
// ・id は hi_ で はじめる

const sp = (job, o) => ({ kind: 'spell', job, hirameki: true, ...o });

export const HIRA_R85A_ABILITIES = {
  // 大食いの旅の魔道士: 風の かたまりで ふきとばす
  hi_bomb_di_win: sp('tabi_madoshi', {
    name: 'ボム・ディ・ウィン', kana: 'ぼむでぃうぃん', mp: 9, target: 'enemies',
    effect: { type: 'magic', element: 'wind', base: [50, 62], thr: 50 },
    desc: '大きな風のかたまりをぶつけて、ふきとばす。敵全体に風のダメージ。', cast: '{a}「ボム・ディ・ウィン！」', anim: 'r85a_wind',
  }),
  // 天才美少女魔道士リナ: 青い 炎の 大きな 玉
  hi_burst_flare: sp('lina', {
    name: 'バースト・フレア', kana: 'ばーすとふれあ', mp: 16, target: 'enemy',
    effect: { type: 'magic', element: 'fire', base: [186, 214], thr: 75 },
    desc: '青い炎の大きな玉をぶつける。敵1体に炎のダメージ。', cast: '{a}「バースト・フレア！」', anim: 'r85a_fireball',
  }),
  // ドラまた: 黒い 光で 敵を つつむ
  hi_blast_ash: sp('doramata', {
    name: 'ブラスト・アッシュ', kana: 'ぶらすとあっしゅ', mp: 26, target: 'enemies',
    effect: { type: 'magic', element: 'dark', base: [150, 174], thr: 90 },
    desc: '黒い光のうずで、敵をつつみこむ。敵全体に闇のダメージ。', cast: '{a}「ブラスト・アッシュ！」', anim: 'r85a_ash',
  }),
};

// ひらめきの じょうけん（技 → 使った 回数）
export const HIRAMEKI_R85A = {
  hi_bomb_di_win: { from: { tm_fireball: 20, tm_touzoku: 8 } },
  hi_burst_flare: { from: { ln_elmekia: 15, lina_sig: 5 } },
  hi_blast_ash: { from: { dr_zelas: 12, dr_ragna: 5 } },
};
