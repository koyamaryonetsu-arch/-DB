// 第3部 第2章 第4幕「金の音と、星の橋」の 門の 番人・ミラーレ・「音を鳴らす」の 技（B: 戦い。abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
// とくべつな こうか（c10dRing … 音を鳴らす・c10dMark … 色を うつす・c10dMeasure … 光を はかる・c10dDaze … ひびが しみる〈休み〉）は
//   shared/battle-c10d.js の c10dEffect
// desc は 1文めで 何を するか わかる ように（スマホの たて持ちは 1文めだけ 出る）
// anim は c10d_〜（門の 番人）・c10m_〜（ミラーレ）・c10d_ring（音を鳴らす）。client/render/battlefx-c10d.js
export const NARASU = 'm10_narasu';
export const C10D_ABILITIES = {
  // ── 門の 番人 ──
  m10d_sd_slash: {
    name: '鏡のつるぎ', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 1.2 }, cast: '{a}が、鏡のつるぎで、{t}に切りかかった！', anim: 'c10d_slash',
    desc: '鏡のつるぎで、1人に大きなダメージ。',
  },
  m10d_sd_flash: {
    name: 'かがみの光', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'magic', base: [640, 700], thr: 99, element: 'light' }, cast: '{a}の体が光って、{t}に光がはね返った！', anim: 'c10d_flash',
    desc: '光をはね返して、1人に光の大きなダメージ。',
  },
  m10d_sw_cross: {
    name: '十字のきらめき', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'phys', mult: 0.5 }, cast: '{a}が、つるぎで十字をえがいた！きらめきが、みんなをおそう！', anim: 'c10d_cross',
    desc: '十字のきらめきで、敵みんなにダメージ。',
  },
  m10d_sm_wave: {
    name: 'まどいの光', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'magic', base: [400, 440], thr: 99, element: 'light' }, cast: '{a}の体の色が、くるくるかわって、光がうずをまいた！', anim: 'c10d_wave',
    desc: 'くるくるかわる光で、敵みんなに光のダメージ。',
  },
  m10d_ss_rain: {
    name: 'かけらの雨', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'magic', base: [250, 270], thr: 99, element: 'light' }, cast: '{a}から、小さな鏡のかけらが、ざあっとふりそそいだ！', anim: 'c10d_rain',
    desc: '鏡のかけらの雨で、敵みんなに光のダメージ。',
  },
  m10d_ss_poke: {
    name: 'かけらのとげ', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 1.05 }, cast: '{a}が、とがったはしで、{t}をつついた！', anim: 'c10d_poke',
    desc: 'とがったはしで、1人にダメージ。',
  },
  m10d_mark: {
    name: '色をうつす', kind: 'monster', target: 'enemy',
    effect: { type: 'c10dMark' }, cast: '{a}が、まくの色を、{t}にうつした！', anim: 'c10d_mark',
    desc: '1人に色のしるしをつけて、番をおそくする。しるしと同じ色の音で消える。',
  },

  // ── 幕の ボス: ミラーレ ──
  m10d_mr_glare: {
    name: 'ねむたいにらみ', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'magic', base: [1400, 1480], thr: 99, element: 'light' }, cast: '{a}が、ねむそうな目で、{t}をじろりとにらんだ！', anim: 'c10m_glare',
    desc: 'ねむそうににらんで、1人に光の大きなダメージ。',
  },
  m10d_mr_hands: {
    name: '手鏡のきらめき', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'magic', base: [920, 980], thr: 99, element: 'light' }, cast: '{a}のまわりの手鏡が、いっせいに光をはね返した！', anim: 'c10m_hands',
    desc: '手鏡の光で、敵みんなに光のダメージ。',
  },
  m10d_mr_frame: {
    name: '金のふちでごつん', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 1.15 }, cast: '{a}「ふわぁ…じゃまだ。」金のふちで、{t}をごつんとたたいた！', anim: 'c10m_frame',
    desc: '金のふちでたたいて、1人に大きなダメージ。',
  },
  m10d_measure: {
    name: '光をはかる', kind: 'monster', target: 'enemy',
    effect: { type: 'c10dMeasure' }, cast: '{a}「いちばん光る者よ…光の強さ、はかってやろう。」まぶしい光が、ひとすじにのびた！', anim: 'c10m_measure',
    desc: 'いちばんHPが多い人に、光の大ダメージ。「防御」で、へらせる。',
  },
  m10d_daze: {
    name: 'ひびがしみる', kind: 'monster', target: 'self',
    effect: { type: 'c10dDaze' }, cast: '{a}「…む、むむ。まくが…。」', anim: 'c10m_daze',
    desc: 'まくがわれて、ひびがしみている。',
  },

  // ── だれでも（門の 番人と ミラーレの 戦いだけ。その 人の 番を 使う。cmd.choice … 0 レ赤・1 ミ黄・2 ファ緑・3 ソ青・4 ラ白・5 シむらさき）──
  //   cmdOnly … 特技の 一覧には 出さない（コマンドの いちばん 上の「音を鳴らす」から 色を えらぶ。client/battle.js）
  [NARASU]: {
    name: '音を鳴らす', kind: 'skill', mp: 0, target: 'self', noAuto: true, cmdOnly: true,
    effect: { type: 'c10dRing' }, cast: '{a}は、星の音を鳴らした！', anim: 'c10d_ring',
    desc: '星の音を1つ鳴らす。まくと同じ色の音で、まくがわれる。',
  },
};
