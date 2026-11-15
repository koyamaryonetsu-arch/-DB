// 第86回 B班: 幻の職業「天下一の格闘王」「混とんの大軍師」の ひらめき技（1つの 職業に 1つずつ。今の 幻と おなじ）
// ・しくみは hirameki-phantom-c.js と おなじ
//   job … その 職業の とき だけ ひらめく（stats.js の hiraAllowed）
//   from … その 職業の 技を 使った 回数（幻の 技は MP が 多いので、回数は 少なめ）
// ・どちらも れい丸・となえるは いらない（大砲の 呪文より ずっと 弱い）
// ・id は hi_ で はじめる

export const HIRA_R86B_ABILITIES = {
  // 天下一の格闘王: 竜巻を けりで おこす 回しげり（敵全体・風）
  hi_tkk_tatsumaki: {
    name: '天下一の竜巻げり', kana: 'てんかいちのたつまきげり', kind: 'skill', job: 'tenkaichi_king', hirameki: true, mp: 24, target: 'enemies', role: 'dmg',
    effect: { type: 'phys', mult: 2.5, element: 'wind' },
    desc: 'その場でくるりと回って、けりで竜巻をおこす。敵全体に風のダメージ。', cast: '{a}の天下一の竜巻げり！', anim: 'r86b_kick',
  },
  // 混とんの大軍師: 白と 黒の 光の 玉が 敵全体で はじける（となえなくても うてる）
  hi_kon_taikyoku: {
    name: '太極のばくはつ', kana: 'たいきょくのばくはつ', kind: 'spell', job: 'chaos_gunshi', hirameki: true, mp: 26, target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [170, 196], thr: 92 },
    desc: '白と黒の光の玉を、敵のまん中ではじけさせる。敵全体に光のダメージ。となえなくてもうてる。', cast: '{a}「太極のばくはつ！」', anim: 'r86b_burst',
  },
};

// ひらめきの じょうけん（技 → 使った 回数）
export const HIRAMEKI_R86B = {
  hi_tkk_tatsumaki: { from: { tkk_amaguri: 10, tenkaichi_king_sig: 4 } },
  hi_kon_taikyoku: { from: { kon_dashin: 10, kon_dragslave: 4 } },
};
