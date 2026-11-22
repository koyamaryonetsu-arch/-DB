// 第3部 第3章 第1幕「星の船と、星座の島」の 魔物・星座のけもの・いかり船長・「時計を投げる」の 技（B: 戦い。abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
// とくべつな こうか（c11aFang … 大きな かみつき・c11aMend … むねの 星が 仲間の 星を 回復 ／
//   c11aThrow … 船長が 時計を 投げる・c11aAnchor … いかりなげ・c11aDizzy … 目を 回す〈休み〉・c11aBrag … いばる ／ c11aPass … 時計を投げる）は
//   shared/battle-c11a.js の c11aEffect
// desc は 1文めで 何を するか わかる ように（スマホの たて持ちは 1文めだけ 出る）
// anim は c11a_〜（ふつうの 魔物）・c11b_〜（星座のけもの）・c11p_〜（船長）・c11a_pass（時計を投げる）。client/render/battlefx-c11a.js
export const TOKEI_NAGE = 'm11_tokeinage';
export const C11A_ABILITIES = {
  // ── ほしのうみクラゲ ──
  m11a_jl_sting: {
    name: 'ほしのとげ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.36 }, cast: '{a}が、星の形のあしで、{t}をちくりとさした！', anim: 'c11a_sting',
    desc: '星の形のあしでさして、1人に大きなダメージ。',
  },
  m11a_jl_flash: {
    name: 'またたきの光', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'blind', chance: 0.18, turns: [2, 3] }, cast: '{a}のかさが、ぴかぴかとまたたいた！', anim: 'c11a_flash',
    desc: 'まぶしい光で、敵みんなの目をくらませることがある。',
  },
  // ── ほうきぼしウオ ──
  m11a_cm_dash: {
    name: 'ほうき星のつっこみ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.42 }, cast: '{a}が、光のしっぽを引いて、{t}につっこんできた！', anim: 'c11a_dash',
    desc: '光のしっぽを引いてつっこみ、1人に大きなダメージ。',
  },
  m11a_cm_trail: {
    name: '光のしっぽ', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [112, 126], thr: 99, element: 'light' }, cast: '{a}が、くるりとまわって、光のしっぽをふりまいた！', anim: 'c11a_trail',
    desc: '光のしっぽをふりまいて、敵みんなに光のダメージ。',
  },
  // ── あまのがわエイ ──
  m11a_ry_glide: {
    name: '星の海のすべりこみ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}が、星の海をすうっとすべって、{t}にぶつかった！', anim: 'c11a_glide',
    desc: 'すべるようにぶつかって、1人に大きなダメージ。',
  },
  m11a_ry_wave: {
    name: '星くずの波', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [108, 122], thr: 99, element: 'ice' }, cast: '{a}が大きなひれをふって、星くずの波をおこした！', anim: 'c11a_wave',
    desc: '星くずの波で、敵みんなに氷のダメージ。',
  },
  // ── ながれぼしトビウオ ──
  m11a_tb_jump: {
    name: 'ながれ星ジャンプ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.38 }, cast: '{a}が、船のへりからとび上がって、{t}にとびかかった！', anim: 'c11a_jump',
    desc: 'とび上がって、1人に大きなダメージ。',
  },
  m11a_tb_splash: {
    name: 'しぶきの星', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', base: [178, 194], thr: 99, element: 'ice' }, cast: '{a}が、星のしぶきを、{t}にはねかけた！', anim: 'c11a_splash',
    desc: '星のしぶきで、1人に氷の大きなダメージ。',
  },
  // ── ほしもりガニ ──
  m11a_cr_pinch: {
    name: 'ほしばさみ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}が、大きなはさみで、{t}をはさんだ！', anim: 'c11a_pinch',
    desc: '大きなはさみで、1人に大きなダメージ。',
  },
  m11a_cr_shell: {
    name: 'こうらをとじる', kind: 'monster', mp: 3, target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.3 }, cast: '{a}は、星のこうらを、ぎゅっととじた！', anim: 'c11a_shell',
    desc: 'こうらをとじて、自分の守りを上げる。',
  },
  // ── ほしのこひつじ ──
  m11a_rm_horn: {
    name: 'くるくるつのアタック', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.38 }, cast: '{a}が、くるくるのつので、{t}にとっしんした！', anim: 'c11a_horn',
    desc: 'つので体当たりして、1人に大きなダメージ。',
  },
  m11a_rm_lull: {
    name: '星のこもりうた', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.15, turns: [1, 2] }, cast: '{a}が「めえぇ〜」と、ねむたくなる声で鳴いた！', anim: 'c11a_lull',
    desc: '敵みんなを、ねむらせることがある。',
  },
  // ── ほしつなぎ ──
  m11a_ws_thread: {
    name: '光の糸', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', base: [176, 192], thr: 99, element: 'light' }, cast: '{a}が、光の糸を、ぴんとはって、{t}にはじいた！', anim: 'c11a_thread',
    desc: '光の糸をはじいて、1人に光の大きなダメージ。',
  },
  m11a_ws_tie: {
    name: '星むすび', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'debuff', stat: 'agi', mult: 0.75, chance: 0.6 }, cast: '{a}が、{t}の足に、光の糸をくるくるまきつけた！', anim: 'c11a_tie',
    desc: '光の糸をまきつけて、1人の素早さを下げる。',
  },
  // ── しまのよるフクロウ ──
  m11a_ow_swoop: {
    name: 'よぞらのつめ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.36 }, cast: '{a}が、音もなくまい下りて、{t}をつめでひっかいた！', anim: 'c11a_swoop',
    desc: '音もなくまい下り、1人に大きなダメージ。',
  },
  m11a_ow_gaze: {
    name: 'ほしよみのひとみ', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [104, 118], thr: 99, element: 'dark' }, cast: '{a}の大きなひとみが、星のようにまたたいた！', anim: 'c11a_gaze',
    desc: 'ふしぎなひとみで、敵みんなに闇のダメージ。',
  },

  // ── 星座のけもの（あたま・むね・しっぽの 3つの 星）──
  m11b_claw: {
    name: '星のつめ', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 1.1 }, cast: '{a}が、光のつめで、{t}をひっかいた！', anim: 'c11b_claw',
    desc: '光のつめで、1人にダメージ。',
  },
  m11b_fang: {
    name: '星座のかみつき', kind: 'monster', target: 'enemy',
    effect: { type: 'c11aFang' }, cast: '{a}が、大きな口をあけて、とびかかった！', anim: 'c11b_fang',
    desc: 'ねらった1人に、とても大きなダメージ。「防御」で、へらせる。',
  },
  m11b_pulse: {
    name: '星のこどう', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'magic', base: [420, 450], thr: 99, element: 'light' }, cast: '{a}が、どくん、と光って、{t}に光をぶつけた！', anim: 'c11b_pulse',
    desc: '光をぶつけて、1人に光のダメージ。',
  },
  m11b_mend: {
    name: '星をつなぐ光', kind: 'monster', target: 'self',
    effect: { type: 'c11aMend' }, cast: '{a}から、光の線がのびて、仲間の星をつないだ！', anim: 'c11b_mend',
    desc: '光の線で、仲間の星のHPを回復する。',
  },
  m11b_sweep: {
    name: '星のしっぽはらい', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'phys', mult: 0.5 }, cast: '{a}が、光のしっぽを、ぶうんとふりまわした！', anim: 'c11b_sweep',
    desc: 'しっぽをふりまわして、敵みんなにダメージ。',
  },
  m11b_dust: {
    name: '星くずのふぶき', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'magic', base: [260, 280], thr: 99, element: 'light' }, cast: '{a}から、星くずが、ふぶきのようにふきつけた！', anim: 'c11b_dust',
    desc: '星くずのふぶきで、敵みんなに光のダメージ。',
  },

  // ── 幕の ボス: いかり船長 ──
  m11p_saber: {
    name: 'いかりでドスン', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 1.0 }, cast: '{a}「どけどけ！」片手のいかりで、{t}をドスンとたたいた！', anim: 'c11p_saber',
    desc: '片手のいかりでたたいて、1人に大きなダメージ。',
  },
  m11p_cannon: {
    name: '星のほうだん', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'magic', base: [820, 880], thr: 99, element: 'fire' }, cast: '{a}「うてーっ！」船から、星のほうだんが、どかんととんできた！', anim: 'c11p_cannon',
    desc: '船のほうだんで、敵みんなに炎のダメージ。',
  },
  m11p_brag: {
    name: 'いばる', kind: 'monster', target: 'self',
    effect: { type: 'c11aBrag' }, cast: '{a}「おれさまは、星の海いちばんの船長だぞ！」', anim: 'c11p_brag',
    desc: 'むねをはって、いばっている。何もしない。',
  },
  m11p_throw: {
    name: '時計なげ', kind: 'monster', target: 'enemy',
    effect: { type: 'c11aThrow' }, cast: '{a}「そ、そんなもの、いらん！」', anim: 'c11p_throw',
    desc: '目ざまし時計を、だれかに投げつける。',
  },
  m11p_anchor: {
    name: 'いかりなげ', kind: 'monster', target: 'enemy',
    effect: { type: 'c11aAnchor' }, cast: '{a}「いかりをくらえ！」', anim: 'c11p_anchor',
    desc: 'いかりを投げて、1人にダメージ。番がおそくなる。「防御」で、ふせげる。',
  },
  m11p_dizzy: {
    name: '目を回す', kind: 'monster', target: 'self',
    effect: { type: 'c11aDizzy' }, cast: '{a}「ひ、ひえぇ…」', anim: 'c11p_dizzy',
    desc: 'サメにかまれて、目を回している。',
  },

  // ── だれでも（いかり船長の 戦いで、時計を 持って いる 人だけ。その 人の 番を 使う）──
  //   cmdOnly … 特技の 一覧には 出さない（コマンドの いちばん 上の「時計を投げる」から。client/battle.js）
  [TOKEI_NAGE]: {
    name: '時計を投げる', kind: 'skill', mp: 0, target: 'self', noAuto: true, cmdOnly: true,
    effect: { type: 'c11aPass' }, cast: '{a}は、目ざまし時計を投げた！', anim: 'c11a_pass',
    desc: '持っている目ざまし時計を、船長に投げ返す。',
  },
};
