// 第3部 第2章 第2幕「青と白」の 魔物・サー・ゲッコー・かいとう シロフクロウ・「水の音を鳴らす」の 技（B: 戦い。abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
// とくべつな こうか（c10xRing … 水の音を鳴らす・c10xStorm … 砂あらし・c10xDry … 大かんそう・
//   c10xStop … 大かんそうが 止まった・c10oShuffle … シャッフル・c10oSteal … ぬすむ）は shared/battle-c10b.js の c10bEffect
// desc は 1文めで 何を するか わかる ように（スマホの たて持ちは 1文めだけ 出る）
// anim は c10b_〜（ふつうの 魔物）・c10x_〜（ゲッコー）・c10o_〜（シロフクロウ）・c10b_ring（水の音）。client/render/battlefx-c10b.js
export const MIZUOTO = 'm10_mizuoto';
export const C10B_ABILITIES = {
  // ── みかがみの精 ──
  m10b_sp_shot: {
    name: 'さかさしずく', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', base: [160, 176], thr: 99, element: 'water' }, cast: '{a}が、下から上へ、水のしずくを、{t}にとばした！', anim: 'c10b_drop',
    desc: '水のしずくをとばして、1人に水の大きなダメージ。',
  },
  m10b_sp_rain: {
    name: 'うらがえしの雨', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [104, 118], thr: 99, element: 'water' }, cast: '{a}のまわりで、雨が下から上へふり始めた！', anim: 'c10b_rain',
    desc: '下からふる雨で、敵みんなに水のダメージ。',
  },
  // ── うら砂ガニ ──
  m10b_cr_pinch: {
    name: 'あおばさみ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}が、青いはさみで、{t}をはさんだ！', anim: 'c10b_pinch',
    desc: 'はさみで、1人に大きなダメージ。',
  },
  m10b_cr_sand: {
    name: 'すなかけ', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 0.5 }, { type: 'status', status: 'blind', chance: 0.2, turns: [2, 3] }] },
    cast: '{a}が、はさみで砂を、ばさっとかけてきた！', anim: 'c10b_sandkick',
    desc: '砂をかけて、敵みんなにダメージ。目がくらむことがある。',
  },
  m10b_cr_guard: {
    name: 'こうらにかくれる', kind: 'monster', mp: 3, target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.3 }, cast: '{a}は、こうらに、ぎゅっと身をかくした！', anim: 'c10b_shell',
    desc: 'こうらにかくれて、守りを上げる。',
  },
  // ── しずくウオ ──
  m10b_fs_bite: {
    name: 'しずくがみ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.36 }, cast: '{a}が、しずくからとび出して、{t}にかみついた！', anim: 'c10b_bite',
    desc: 'とび出してかみつき、1人に大きなダメージ。',
  },
  m10b_fs_jet: {
    name: 'みずでっぽう', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'magic', base: [100, 114], thr: 99, element: 'water' }, cast: '{a}が、口から水を、ぴゅぴゅーっとふき出した！', anim: 'c10b_jet',
    desc: '水をふき出して、敵みんなに水のダメージ。',
  },
  m10b_fs_bubble: {
    name: 'あわのまく', kind: 'monster', mp: 3, target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.3 }, cast: '{a}のしずくが、ぷくっとふくらんだ！', anim: 'c10b_bubble',
    desc: 'しずくをふくらませて、守りを上げる。',
  },
  // ── すなぼうず ──
  m10b_sd_punch: {
    name: 'すなパンチ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}が、砂のうでを、{t}にふり下ろした！', anim: 'c10b_punch',
    desc: '砂のうでで、1人に大きなダメージ。',
  },
  m10b_sd_storm: {
    name: 'ちいさな砂あらし', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [100, 114], thr: 99, element: 'wind' }, cast: '{a}が、くるくる回って、砂をまき上げた！', anim: 'c10b_dust',
    desc: '砂をまき上げて、敵みんなに風のダメージ。',
  },
  m10b_sd_sink: {
    name: 'ずぶずぶ', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 0.9 }, { type: 'debuff', stat: 'agi', mult: 0.7 }] }, cast: '{a}が、{t}の足もとを、砂にかえた！', anim: 'c10b_sink',
    desc: '足もとを砂にして、1人にダメージ。素早さを下げる。',
  },
  // ── つららフクロウ ──
  m10b_ow_claw: {
    name: 'つららづめ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.42 }, cast: '{a}が、つららのつめで、{t}にとびかかった！', anim: 'c10b_claw',
    desc: 'つららのつめで、1人に大きなダメージ。',
  },
  m10b_ow_blow: {
    name: 'こなゆきのはばたき', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [112, 126], thr: 99, element: 'ice' }, cast: '{a}が、大きくはばたいて、こな雪をまき上げた！', anim: 'c10b_snow',
    desc: 'こな雪をまき上げて、敵みんなに氷のダメージ。',
  },
  m10b_ow_glare: {
    name: 'みはりのめ', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'status', status: 'confuse', chance: 0.16, turns: [1, 2] }, cast: '{a}の大きな目が、ぎょろりと光った！', anim: 'c10b_glare',
    desc: '敵みんなを、混乱させることがある。',
  },
  // ── ゆきあかりオオカミ ──
  m10b_wf_fang: {
    name: 'つきあかりのキバ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.45 }, cast: '{a}が、音もなく、{t}にかみついた！', anim: 'c10b_fang',
    desc: '音もなくかみつき、1人に大きなダメージ。',
  },
  m10b_wf_howl: {
    name: 'とおぼえ', kind: 'monster', mp: 3, target: 'self',
    effect: { type: 'buff', stat: 'atk', mult: 1.25 }, cast: '{a}が、月にむかって、ウォーンとほえた！', anim: 'c10b_howl',
    desc: 'ほえて、自分の攻撃力を上げる。',
  },
  m10b_wf_breath: {
    name: 'こおりのいき', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [110, 124], thr: 99, element: 'ice' }, cast: '{a}が、つめたい息を、ふうっとはいた！', anim: 'c10b_breath',
    desc: 'つめたい息で、敵みんなに氷のダメージ。',
  },
  // ── 氷のよろい ──
  m10b_ar_slash: {
    name: 'こおりのけん', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.42 }, cast: '{a}が、氷の剣で、{t}に切りかかった！', anim: 'c10b_slash',
    desc: '氷の剣で、1人に大きなダメージ。',
  },
  m10b_ar_sweep: {
    name: 'こおりのなぎはらい', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'phys', mult: 0.62 }, cast: '{a}が、氷の剣で、ぐるりとなぎはらった！', anim: 'c10b_sweep',
    desc: '剣でなぎはらって、敵みんなにダメージ。',
  },
  m10b_ar_guard: {
    name: 'こおりのたて', kind: 'monster', mp: 3, target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.3 }, cast: '{a}は、氷のたてを、がしっとかまえた！', anim: 'c10b_guard',
    desc: 'たてをかまえて、守りを上げる。',
  },

  // ── 青の 中ボス: サー・ゲッコー ──
  m10x_cane: {
    name: 'すなどけいステッキ', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 1.15 }, cast: '{a}「失礼。」砂時計のステッキで、{t}をこつんとたたいた！', anim: 'c10x_cane',
    desc: 'ステッキで、1人に大きなダメージ。',
  },
  m10x_sand: {
    name: 'すなのつぶて', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'magic', base: [180, 200], thr: 99, element: 'wind' }, cast: '{a}のコートから、砂のつぶが、ざあっととんできた！', anim: 'c10x_sand',
    desc: '砂のつぶで、敵みんなに風のダメージ。',
  },
  m10x_tail: {
    name: 'しっぽのひとふり', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 1.3 }, cast: '{a}が、長いしっぽを、ひゅっとふった！', anim: 'c10x_tail',
    desc: 'しっぽで、1人に大きなダメージ。',
  },
  m10x_storm: {
    name: '砂あらし', kind: 'monster', target: 'enemies',
    effect: { type: 'c10xStorm' }, cast: '{a}「かわいた砂は、よいものだ。」広間に、砂あらしがふきあれた！', anim: 'c10x_storm',
    desc: '水がない間、毎回ふく砂あらし。敵みんなにダメージ。',
  },
  m10x_dry: {
    name: '大かんそう', kind: 'monster', target: 'enemies',
    effect: { type: 'c10xDry' }, cast: '{a}「大かんそう！」広間の水が、ぜんぶ砂にすいこまれた！', anim: 'c10x_dry',
    desc: '水をすい上げて、敵みんなに大ダメージ。防御で、へらせる。',
  },
  m10x_stop: {
    name: 'しびれた', kind: 'monster', target: 'self',
    effect: { type: 'c10xStop' }, cast: '{a}「…む、むむ。体が、いうことをきかない。」', anim: 'c10x_stop',
    desc: '大かんそうが止まって、しびれている。',
  },

  // ── 白の 中ボス: かいとう シロフクロウ ──
  m10o_feather: {
    name: '羽を投げる', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 1.15 }, cast: '{a}が、羽を投げた！白い羽が、{t}につきささる！', anim: 'c10o_feather',
    desc: '白い羽を投げて、1人に大きなダメージ。',
  },
  m10o_wing: {
    name: 'マントのつむじ風', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'magic', base: [1000, 1080], thr: 99, element: 'wind' }, cast: '{a}が、羽のマントを、ばさりとひるがえした！', anim: 'c10o_wing',
    desc: 'マントの風で、敵みんなに風のダメージ。',
  },
  m10o_moon: {
    name: '月のひとみ', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'magic', base: [1300, 1380], thr: 99, element: 'light' }, cast: '{a}の仮面の目が、月の光で、きらりと光った！', anim: 'c10o_moon',
    desc: '月の光で、1人に光の大きなダメージ。',
  },
  m10o_shuffle: {
    name: 'シャッフル', kind: 'monster', target: 'self',
    effect: { type: 'c10oShuffle' }, cast: '白い羽が、ぶわっとまい上がった！', anim: 'c10o_shuffle',
    desc: '白い羽にかくれて、場所が入れかわる。',
  },
  m10o_steal: {
    name: 'ぬすむ', kind: 'monster', target: 'self',
    effect: { type: 'c10oSteal' }, cast: '{a}が、ひらりと、とびこんできた！', anim: 'c10o_steal',
    desc: 'ねらった人のよい効果を、ぜんぶぬすむ。防御でふせげる。',
  },

  // ── だれでも（ゲッコーの 戦いだけ。その 人の 番を 使う）──
  [MIZUOTO]: {
    name: '水の音を鳴らす', kind: 'skill', mp: 0, target: 'self', noAuto: true,
    effect: { type: 'c10xRing' }, cast: '{a}は、星の音さを、そっと鳴らした。', anim: 'c10b_ring',
    desc: '星の音さで、広間に水をよぶ。水のめもりが2つふえる（3まで）。',
  },
};
