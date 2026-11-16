// 第83回 B班の ひらめき技: ぬ〜べ〜の 系統（docs/plan-r83-jobs-b.md）
//
// ・小学校の先生・れい能力教師ぬ〜べ〜・おにの手のじごく先生 に 1つずつ
// ・しくみは hirameki-r82a.js と おなじ
//   job … その 職業の とき だけ ひらめく（stats.js の hiraAllowed）
//   from … その 職業の 技を 使った 回数
//   強さは その 職業の 同じくらいの MPの 技と おなじくらい。anim は 前から ある エフェクト か battlefx-r83b.js
// ・id は hi_ で はじめる
import { GHOST } from './abilities-r83b.js?v=03b6a2e7d2f9';

const sk = (job, o) => ({ kind: 'skill', job, hirameki: true, ...o });

export const HIRA_R83B_ABILITIES = {
  // 小学校の先生: ろうかを 走る 子を 止める 大きな 声
  hi_et_rouka: sk('elem_teacher', {
    name: 'ろうかを走るな！', kana: 'ろうかをはしるな', mp: 5, target: 'enemy',
    effect: { type: 'phys', mult: 1.5, debuff: { stat: 'agi', mult: 0.75, dur: 40, chance: 0.8 } },
    desc: '「こらー！ろうかを走るな！」大きな声でしかって、ぴたっと止める。敵1体にダメージをあたえ、素早さを下げる。', cast: '{a}「こらー！ろうかを走るな！」', anim: 'r83b_eraser',
  }),
  // れい能力教師ぬ〜べ〜: おにの手で 横に なぎはらう
  hi_nb_nagi: sk('nube', {
    name: 'おにの手・なぎはらい', kana: 'おにのてなぎはらい', mp: 16, target: 'enemies',
    effect: { type: 'phys', mult: 1.2, vsRace: GHOST, oni: true },
    desc: '大きくしたおにの手で、横にはらう。敵全体にダメージ。ゆうれい・アンデッド・悪魔には、とても強い。', cast: '{a}の、おにの手・なぎはらい！', anim: 'r83b_oni',
  }),
  // おにの手のじごく先生: 生徒みんなの 思いを のせた 一発
  hi_js_zenryoku: sk('jigoku_sensei', {
    name: '全力の先生パンチ', kana: 'ぜんりょくのせんせいぱんち', mp: 26, target: 'enemy',
    effect: { type: 'phys', mult: 3.6, critBonus: 0.1, vsRace: GHOST, oni: true },
    desc: '生徒みんなの思いをのせて、おにの手で思いきり打つ。敵1体に大ダメージ。会心も出やすい。ゆうれい・アンデッド・悪魔には、とても強い。', cast: '{a}「みんなの思い、とどけ！」', anim: 'r83b_renda',
  }),
};

// ひらめきの じょうけん（技 → 使った 回数）
export const HIRAMEKI_R83B = {
  hi_et_rouka: { from: { et_kokuban: 20, et_shukudai: 6 } },
  hi_nb_nagi: { from: { nb_onite: 15, nb_dasu: 4 } },
  hi_js_zenryoku: { from: { js_renda: 12, jigoku_sensei_sig: 4 } },
};
