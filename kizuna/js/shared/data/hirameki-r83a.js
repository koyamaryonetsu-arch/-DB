// 第83回 A班: 封神演義の 系統の ひらめき技（4つの 職業に 1つずつ。第82回 A班〈犬夜叉の 系統〉と おなじ）
// ・しくみは hirameki-r29.js と おなじ
//   job … その 職業か、その 職業から 進んだ 職業の とき だけ ひらめく（stats.js の hiraAllowed）
//   from … その 道の 技を 使った 回数
//   強さは その 職業の 同じくらいの MPの 技と おなじくらい
// ・id は hi_ で はじめる

const sk = (job, o) => ({ kind: 'skill', job, hirameki: true, ...o });

export const HIRA_R83A_ABILITIES = {
  // つりをする道士: つり糸に かかった いわしの むれが いっせいに とびかかる
  hi_iwashi: sk('fishing_doshi', {
    name: 'いわしの大ぐん', kana: 'いわしのおおぐん', mp: 5, target: 'group',
    effect: { type: 'magic', element: 'water', base: [24, 32], thr: 26 },
    desc: 'つり糸にかかったいわしのむれが、いっせいにとびかかる。同じ種類の敵をまとめて、水のダメージ。', cast: '{a}のつり糸に、いわしの大ぐんがかかった！', anim: 'r83a_fish',
  }),
  // せん人界の道士: おふだを 風に のせて ばらまく
  hi_tsumujifuda: sk('sennin_doshi', {
    name: 'つむじ風のおふだ', kana: 'つむじかぜのおふだ', mp: 9, target: 'enemies',
    effect: { type: 'magic', element: 'wind', base: [46, 58], thr: 42 },
    desc: 'たくさんのおふだを、つむじ風にのせてばらまく。敵全体に風のダメージ。', cast: '{a}は、おふだをつむじ風にのせた！', anim: 'r83a_ofuda',
  }),
  // 太公望: スープーが 空から 風を まき起こす
  hi_supu_kaze: sk('taikobo', {
    name: 'スープーのつむじ風', kana: 'すーぷーのつむじかぜ', mp: 14, target: 'enemy',
    effect: { type: 'magic', element: 'wind', base: [122, 142], thr: 62 },
    desc: '空飛ぶカバのスープーが、空の上から大きなつむじ風を起こす。敵1体に風の大ダメージ。', cast: '{a}「スープー、たのむ！」', anim: 'r83a_wind2',
  }),
  // ほう神の大軍師: 太極の 力を 風に のせる
  hi_taikyoku_kaze: sk('hoshin_gunshi', {
    name: '太極の大風', kana: 'たいきょくのおおかぜ', mp: 28, target: 'enemies',
    effect: { type: 'magic', element: 'wind', base: [134, 156], thr: 86 },
    desc: '白と黒の太極の力を、大きな風にのせる。敵全体に風の大ダメージ。', cast: '{a}「太極の大風！」', anim: 'sennin_doshi_sig',
  }),
};

// ひらめきの じょうけん（技 → 使った 回数）
export const HIRAMEKI_R83A = {
  hi_iwashi: { from: { fd_tsurizao: 20, fd_nonbiri: 8 } },
  hi_tsumujifuda: { from: { sd_dashin: 10, fd_ofuda: 15 } },
  hi_supu_kaze: { from: { tk_supu: 6, tk_yaiba: 10 } },
  hi_taikyoku_kaze: { from: { hg_ten: 10, taikobo_sig: 6 } },
};
