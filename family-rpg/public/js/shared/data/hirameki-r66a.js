// 第66回 A班（2026年11月）の 4つの 伝説の 職業の ひらめき技
//
// ・守りの神・光と闇の剣神・ポケモンマスター・千年の大魔法使いに 2つずつ（ほかの 伝説の 職業と おなじ）
// ・しくみは hirameki-r41a.js と おなじ
//   job … その 職業の とき だけ ひらめく（stats.js の hiraAllowed）
//   from … その 職業の 技を 使った 回数（伝説の 技は MPが 多いので、回数は 少なめ）
//   強さは その 職業の 同じくらいの MPの 技と おなじくらい
//   anim は 前から ある エフェクト（abilities-r66a.js の r66a_… も ふくむ）
// ・id は hi_ で はじめる

const sk = (job, o) => ({ kind: 'skill', job, hirameki: true, ...o });
const STATUS_ALL = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];

export const HIRA_R66A_ABILITIES = {
  // 守りの神: 天使の つばさで みんなを つつむ・たてで 大きく はね返す
  hi_gg_tsubasa: sk('guard_god', {
    name: '守りの神のつばさ', kana: 'まもりのかみのつばさ', mp: 26, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [120, 150], thr: 60 }, { type: 'buff', stat: 'def', mult: 1.3, dur: 40 }] },
    desc: '白いつばさを広げて、仲間をやさしくつつむ。仲間全員のHPを回復して、守備力も上がる。', cast: '{a}のせなかに、白いつばさが広がった！', anim: 'heal2',
  }),
  hi_gg_hangeki: sk('guard_god', {
    name: '神のたての大はんげき', kana: 'かみのたてのだいはんげき', mp: 20, target: 'enemy',
    effect: { type: 'phys', mult: 3.6, atkFrom: 'def', element: 'light' },
    desc: '受けとめた力を、たてで大きくはね返す。敵1体にとても大きなダメージ。守備力が高いほど強い。', cast: '{a}は、たてで力をはね返した！', anim: 'r66a_shield',
  }),
  // 光と闇の剣神: 光の 一太刀・光と 闇の うず
  hi_ks_hitotachi: sk('kenshin', {
    name: '光の一太刀', kana: 'ひかりのひとたち', mp: 22, target: 'enemy',
    effect: { type: 'phys', mult: 3.8, element: 'light', critBonus: 0.1 },
    desc: '心をしずめて、光の剣で一度だけ切る。敵1体にとても大きなダメージ。会心も出やすい。', cast: '{a}は、しずかに光の剣をぬいた…！', anim: 'r66a_light_blade',
  }),
  hi_ks_uzu: sk('kenshin', {
    name: '光と闇のうず', kana: 'ひかりとやみのうず', mp: 24, target: 'enemies',
    effect: { type: 'phys', mult: 1.15, hits: 2, ignoreDef: 0.2 },
    desc: '光と闇の剣を回して、大きなうずをおこす。敵全体に2回ダメージ。', cast: '{a}のまわりに、光と闇のうずがまき起こった！', anim: 'r66a_cross',
  }),
  // ポケモンマスター: みんな 出てこい・しんかの 光
  hi_pk_zenin: sk('poke_master', {
    name: 'みんな出てこい！', kana: 'みんなでてこい', mp: 24, target: 'enemies',
    effect: { type: 'phys', mult: 0.6, hits: 4, random: true, monPal: 0.2 },
    desc: 'ボールを一度にたくさん投げて、魔物たちと攻撃する。敵全体に、ランダムで4回ダメージ。いっしょに戦う仲間の魔物が多いほど強い。', cast: '{a}「みんな、出てこい！」ボールがいっせいにひらいた！', anim: 'r66a_team',
  }),
  hi_pk_shinka: sk('poke_master', {
    name: 'しんかの光', kana: 'しんかのひかり', mp: 24, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'def'], mult: 1.3, dur: 40 }, { type: 'heal', base: [70, 90], thr: 50 }] },
    desc: 'ふしぎな光が、仲間をつつむ。仲間全員の攻撃力と守備力が上がり、HPも少し回復する。', cast: '{a}の仲間たちが、ふしぎな光につつまれた！', anim: 'buff',
  }),
  // 千年の大魔法使い: 星を ふらせる 魔法・よごれを きれいに する 魔法（集めた ふしぎな 魔法の 1つ）
  hi_sm_hoshi: sk('sennen_mage', {
    name: '星をふらせる魔法', kana: 'ほしをふらせるまほう', kind: 'spell', mp: 30, target: 'enemies',
    effect: { type: 'magic', element: 'blast', base: [175, 205], thr: 90 },
    desc: '夜空の星を、敵の上にふらせる。敵全体に大ダメージ。', cast: '{a}がつえをふると、星がふってきた！', anim: 'meteor',
  }),
  hi_sm_kirei: sk('sennen_mage', {
    name: 'よごれをきれいにする魔法', kana: 'よごれをきれいにするまほう', kind: 'spell', mp: 10, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'cure', statuses: STATUS_ALL }, { type: 'heal', base: [60, 80], thr: 40 }] },
    desc: '旅のとちゅうで集めた、ふしぎで便利な魔法。仲間全員の悪いじょうたいを治して、HPも少し回復する。', cast: '{a}「これ、とっても便利な魔法なんだ」', anim: 'heal_ring',
  }),
};

// ひらめきの じょうけん（技 → 使った 回数）
export const HIRAMEKI_R66A = {
  hi_gg_tsubasa: { from: { gg_megumi: 8, gg_kabau: 6 } },
  hi_gg_hangeki: { from: { gg_seinaru: 10, gg_ten: 6 } },
  hi_ks_hitotachi: { from: { ks_hikari: 10, ks_nitou: 6 } },
  hi_ks_uzu: { from: { ks_juuji: 8, ks_ame: 6 } },
  hi_pk_zenin: { from: { pk_issho: 8, pk_ball: 6 } },
  hi_pk_shinka: { from: { pk_kimeta: 8, pk_center: 6 } },
  hi_sm_hoshi: { from: { sm_kaminari: 8, sm_kougeki: 6 } },
  hi_sm_kirei: { from: { sm_hanabatake: 8, sm_bougyo: 6 } },
};
