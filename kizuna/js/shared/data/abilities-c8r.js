// 第2部 第8章 第4幕「時のはざま」の 魔物・時の門番フリーゾン（4つの すがた）・心の ためし・ソリトゥス（3だん）の 技（B: 戦い。abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
// とくべつな こうか（c8gOrb … 時の大玉・c8gOrbFail … 大玉が 消える・c8gFinal … 最終形態・c8tGust … 大風・c8tPuff … ともしびを ふく・
//   c8dSlash・c8dMock・c8dBig … 見くだす影・c8dCheer … おうえん・c8sCall … よびかける・c8sBig … くらい心の 大技・c8sHarden … 心が かたまる・
//   c8sAlone … ひとりに する・c8sTear … 星の なみだ・c8sCrack … 時の くずれ・c8sPromise … 千年の約束・c8sBound … へびで しばられて いる）は
//   shared/battle-c8r.js の c8rEffect
// desc は 1文めで 何を するか わかる ように（スマホの たて持ちは 1文めだけ 出る。client/ui/skillinfo.js の firstSentence）
// anim は c8rn_〜（手下）・c8g_〜（門番）・c8t_〜（守りぬく）・c8d_〜（一騎うち）・c8s_〜（ソリトゥス）。client/render/battlefx-c8r.js
export const C8R_ABILITIES = {
  // ── 時のたましい ──
  m8n_ts_flame: {
    name: '時のむらさき火', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'magic', base: [132, 150], thr: 99, element: 'dark' }, cast: '{a}が、むらさきの火を、{t}にとばした！', anim: 'c8rn_flame',
    desc: 'むらさきの火で、1人に闇の大きなダメージ。',
  },
  m8n_ts_slow: {
    name: 'ゆっくりののろい', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'debuff', stat: 'agi', mult: 0.8, chance: 0.45 }, cast: '{a}「ゆっくり…ゆっくり…」', anim: 'c8rn_slow',
    desc: '敵みんなの素早さを、下げることがある。',
  },
  m8n_ts_drain: {
    name: 'たましいすい', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', base: [104, 120], thr: 99, element: 'dark' }, cast: '{a}が、{t}の元気を、すうっとすいとった！', anim: 'c8rn_drain',
    desc: '1人に闇のダメージ。',
  },
  // ── 時かげスカラベ ──
  m8n_ks_bite: {
    name: 'かげのあご', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.35 }, cast: '{a}が、大きなあごで、{t}にかみついた！', anim: 'c8rn_bite',
    desc: '1人に大きなダメージ。',
  },
  m8n_ks_sand: {
    name: '時のすなあらし', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 0.5 }, { type: 'status', status: 'blind', chance: 0.25, turns: [2, 3] }] },
    cast: '{a}が、時のすなを、はげしくまき上げた！', anim: 'c8rn_sand',
    desc: '敵みんなにダメージ。目がくらむことがある。',
  },
  m8n_ks_rewind: {
    name: 'まきもどし', kind: 'monster', mp: 4, target: 'self',
    effect: { type: 'heal', base: [300, 340], thr: 99 }, cast: '{a}の体の時間が、くるくるとまきもどった！', anim: 'c8rn_rewind',
    desc: '自分の時間をまきもどして、HPを回復する。',
  },
  // ── 時くいガ ──
  m8n_tm_powder: {
    name: 'ねむりのりんぷん', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.2, turns: [1, 2] }, cast: '{a}が、きらきら光る粉を、ばさばさとまいた…', anim: 'c8rn_powder',
    desc: '敵みんなを、ねむらせることがある。',
  },
  m8n_tm_bite: {
    name: '時かじり', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.3 }, cast: '{a}が、{t}の時間を、カリカリかじった！', anim: 'c8rn_gnaw',
    desc: '1人に大きなダメージ。',
  },
  m8n_tm_flutter: {
    name: 'はばたきの風', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [86, 100], thr: 99, element: 'wind' }, cast: '{a}が、大きなはねで、はげしくはばたいた！', anim: 'c8rn_flutter',
    desc: '大きなはばたきで、敵みんなに風のダメージ。',
  },
  // ── チクタクワニ ──
  m8n_cw_chomp: {
    name: 'ワニのひとのみ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.5 }, cast: '{a}が、大きな口で、{t}にガブリとかみついた！', anim: 'c8rn_chomp',
    desc: '大きな口で、1人に大ダメージ。',
  },
  m8n_cw_tick: {
    name: 'チクタクチクタク', kind: 'monster', mp: 2, target: 'self',
    effect: { type: 'buff', stat: 'atk', mult: 1.25 }, cast: '{a}のおなかから、チクタク、チクタク…と音がする…', anim: 'c8rn_tick',
    desc: 'おなかのとけいが鳴って、自分の攻撃力を上げる。',
  },
  m8n_cw_tail: {
    name: 'ワニのしっぽ', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'phys', mult: 0.6 }, cast: '{a}が、太いしっぽを、ぶうんとふり回した！', anim: 'c8rn_tail',
    desc: 'しっぽをふり回して、敵みんなにダメージ。',
  },
  // ── すなどけいの騎士 ──
  m8n_sk_slash: {
    name: 'すなの剣', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.45 }, cast: '{a}が、すなでできた剣で、{t}に切りかかった！', anim: 'c8rn_slash',
    desc: '1人に大ダメージ。',
  },
  m8n_sk_sand: {
    name: 'すなながし', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [90, 104], thr: 99, element: 'dark' }, cast: '{a}の体から、時のすなが、ざあっとながれ出した！', anim: 'c8rn_flow',
    desc: '時のすなをながして、敵みんなに闇のダメージ。',
  },
  m8n_sk_turn: {
    name: 'すなどけいがえし', kind: 'monster', mp: 4, target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.3 }, cast: '{a}は、体のすなどけいを、くるりとひっくり返した！', anim: 'c8rn_turn',
    desc: '体のすなどけいを返して、自分の守りを上げる。',
  },

  // ── 時の門番フリーゾン ──
  m8g_finger: {
    name: 'ゆびさきビーム', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'magic', base: [300, 330], thr: 99, element: 'light' }, cast: '{a}「おやおや。」\n{a}は、指先から、ほそい光をはなった！', anim: 'c8g_finger',
    desc: '指先から光を出して、1人に光の大ダメージ。',
  },
  m8g_tail: {
    name: 'しっぽのムチ', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 1.25 }, cast: '{a}は、長いしっぽで、{t}をぴしりと打った！', anim: 'c8g_tail',
    desc: 'しっぽで、1人に大きなダメージ。',
  },
  m8g_glare: {
    name: '見くだしの目', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'debuff', stat: 'atk', mult: 0.8, chance: 0.45 }, cast: '{a}「ずいぶん、小さなお客さまですね。」', anim: 'c8g_glare',
    desc: '敵みんなの攻撃力を、下げることがある。',
  },
  m8g_horn: {
    name: 'つのの一げき', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}は、長いつので、{t}にとっしんした！', anim: 'c8g_horn',
    desc: 'つのでとっしんして、1人に大ダメージ。',
  },
  m8g_orb: {
    name: '時の大玉', kind: 'monster', target: 'enemies',
    effect: { type: 'c8gOrb' }, cast: '{a}「これで、おしまいです。」\n{a}は、指先の大きな光の玉を、ゆっくりと下ろした！', anim: 'c8g_orb',
    desc: '大きな光の玉で、敵みんなに大ダメージ。かまえをくずすと消える。',
  },
  m8g_orbfail: {
    name: 'くずれた大玉', kind: 'monster', target: 'self',
    effect: { type: 'c8gOrbFail' }, cast: '{a}「な…なんですって…！？」', anim: 'c8g_orbfail',
    desc: 'かまえがくずれて、大玉が消えてしまう。何もできない。',
  },
  m8g_final: {
    name: 'さいごのすがた', kind: 'monster', target: 'self',
    effect: { type: 'c8gFinal' }, cast: '{a}「…いいでしょう。わたしの、ほんとうのすがたを、お見せしましょう。」', anim: 'c8g_final',
    desc: 'さいごのすがたにかわる。速く、強くなる。',
  },
  m8g_leave: {
    name: '時の門', kind: 'monster', target: 'self',
    effect: { type: 'c8gLeave' }, cast: '{a}は、時の門をひらいた…', anim: 'c8g_leave',
    desc: '時の門の中へ去っていく。',
  },
  // 最終形態
  m8g_beam: {
    name: 'デスゆびビーム', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'magic', base: [330, 360], thr: 99, element: 'light' }, cast: '{a}は、指先から、するどい光を、すばやくはなった！', anim: 'c8g_finger',
    desc: 'するどい光で、1人に光の大ダメージ。',
  },
  m8g_fbarrage: {
    name: 'ゆびさきの雨', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'magic', base: [150, 170], thr: 99, element: 'light' }, cast: '{a}「ほら、ほら、ほら。」\n{a}の指先から、光が雨のようにふってきた！', anim: 'c8g_barrage',
    desc: '光の雨で、敵みんなに光のダメージ。',
  },

  // ── 心の ためし「守りぬく」（やみの風・ふきけし小おに）──
  m8t_breeze: {
    name: 'やみのそよ風', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 0.7 }, cast: '{a}が、ひゅうっと、つめたくふいた…', anim: 'c8t_breeze',
    desc: '1人にダメージ。',
  },
  m8t_gust: {
    name: '大風', kind: 'monster', target: 'self',
    effect: { type: 'c8tGust' }, cast: '{a}が、ごうっと、ともしびにむかってふきつけた！', anim: 'c8t_gust',
    desc: 'ともしびに大風をふきつける。身を守る人がいると、半分になる。',
  },
  m8t_dawn: {
    name: '夜明け', kind: 'monster', target: 'self',
    effect: { type: 'c8tDawn' }, cast: '{a}の風が、だんだん弱くなってきた…', anim: 'c8t_dawn',
    desc: '夜が明けて、やみの風が消える。',
  },
  m8t_puff: {
    name: 'ふーっ', kind: 'monster', target: 'self',
    effect: { type: 'c8tPuff' }, cast: '{a}「ふーっ！」', anim: 'c8t_puff',
    desc: 'ともしびに、いきをふきかける。',
  },

  // ── 心の ためし「一騎うち」（見くだす影）──
  m8d_slash: {
    name: 'かげの剣', kind: 'monster', target: 'self',
    effect: { type: 'c8dSlash' }, cast: '{a}が、かげの剣で切りかかった！', anim: 'c8d_slash',
    desc: 'リオンに切りかかる。',
  },
  m8d_mock: {
    name: '見くだすことば', kind: 'monster', target: 'self',
    effect: { type: 'c8dMock' }, cast: '{a}「おまえなんか、ひとりでは何もできない。」', anim: 'c8d_mock',
    desc: 'リオンの攻撃力を下げる。おうえんがあると、きかない。',
  },
  m8d_big: {
    name: 'かげの大剣', kind: 'monster', target: 'self',
    effect: { type: 'c8dBig' }, cast: '{a}は、かげの剣を、大きくふりかぶった！', anim: 'c8d_big',
    desc: 'リオンに大ダメージ。身を守ると半分になる。',
  },
  // おうえん（一騎うちの 間だけ、家族の キャラが 使える。オートは 使わない）
  m8d_cheer_pow: {
    name: 'おうえん（力）', kind: 'monster', mp: 0, target: 'self', noAuto: true,
    effect: { type: 'c8dCheer', cheer: 'pow' }, cast: '{a}「リオン、がんばれー！」', anim: 'c8d_cheer',
    desc: 'リオンの攻撃力を上げる。ゆうきが1つたまる。',
  },
  m8d_cheer_def: {
    name: 'おうえん（守り）', kind: 'monster', mp: 0, target: 'self', noAuto: true,
    effect: { type: 'c8dCheer', cheer: 'def' }, cast: '{a}「リオン、気をつけて！」', anim: 'c8d_cheer',
    desc: 'リオンの守りを上げる。ゆうきが1つたまる。',
  },
  m8d_cheer_heal: {
    name: 'おうえん（回復）', kind: 'monster', mp: 0, target: 'self', noAuto: true,
    effect: { type: 'c8dCheer', cheer: 'heal' }, cast: '{a}「リオン、まけないで！」', anim: 'c8d_cheer',
    desc: 'リオンのHPを回復する。ゆうきが1つたまる。',
  },

  // ── ソリトゥス ──
  // くらい心の 技（それぞれ 第1〜4幕の ボスの 技が まじる）
  m8s_greed: {
    name: 'よくばりのへびのつえ', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'magic', base: [270, 300], thr: 99, element: 'dark' }, { type: 'status', status: 'sleep', chance: 0.15, turns: [1, 1] }] },
    cast: '{a}は、へびのつえのような闇を、ゆらゆらとふった…', anim: 'c8s_greed',
    desc: '敵みんなに闇のダメージ。ねむらせることがある。',
  },
  m8s_anger: {
    name: 'いかりの青い炎', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'magic', base: [290, 310], thr: 99, element: 'fire' }, cast: '{a}のかみが、青い炎になって、もえ上がった！', anim: 'c8s_anger',
    desc: '青い炎で、敵みんなに炎のダメージ。',
  },
  m8s_hoard: {
    name: 'ひとりじめのドッスン', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'phys', mult: 0.6, ignoreDef: 0.2 }, cast: '{a}「ぜんぶ、ひとりじめだ…！」\n{a}は、高くとび上がって、おちてきた！', anim: 'c8s_hoard',
    desc: 'とび上がっておち、敵みんなにダメージ。',
  },
  m8s_scorn: {
    name: '見くだしのゆび', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'magic', base: [420, 460], thr: 99, element: 'light' }, cast: '{a}は、指先を、{t}にむけた…', anim: 'c8s_scorn',
    desc: '指先の光で、1人に光の大ダメージ。',
  },
  m8s_dark: {
    name: 'くらい心のつめ', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 1.3 }, cast: '{a}のくらい心が、つめになって、{t}をおそった！', anim: 'c8s_claw',
    desc: '1人に大きなダメージ。',
  },
  m8s_big: {
    name: 'くらい心のあらし', kind: 'monster', target: 'enemies',
    effect: { type: 'c8sBig' }, cast: '{a}のまわりで、4つのくらい心が、うずをまいた…！', anim: 'c8s_big',
    desc: 'くらい心のあらしで、敵みんなに大ダメージ。身を守ると半分になる。',
  },
  m8s_harden: {
    name: 'かたまるくらい心', kind: 'monster', target: 'self',
    effect: { type: 'c8sHarden' }, cast: '{a}「…だれも、来ない。やっぱり、ひとりだ。」', anim: 'c8s_harden',
    desc: 'ゆらいだ心がかたまって、HPがもどる。敵みんなに闇のダメージ。',
  },
  m8s_shell: {
    name: 'こうらにはばまれて', kind: 'monster', target: 'self',
    effect: { type: 'c8sShell' }, cast: '{a}は、こうげきしようとした…', anim: 'c8s_shell',
    desc: '大きなこうらに、こうげきをはね返される。',
  },
  m8s_bound: {
    name: 'へびにしばられて', kind: 'monster', target: 'self',
    effect: { type: 'nothing' }, cast: '{a}は、へびにしばられて、動けない！', anim: 'c8s_bound',
    desc: 'へびにしばられて、動けない。',
  },
  // 2だんめ: ひとりぼっちの 星
  m8s_tear: {
    name: '星のなみだ', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'c8sTear' }, cast: '{a}の目から、つめたい星のなみだが、こぼれおちた…', anim: 'c8s_tear',
    desc: '星のなみだで、敵みんなに大ダメージ。ひとりの人が多いほど強い。',
  },
  m8s_comet: {
    name: 'ながれぼし', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'magic', base: [430, 470], thr: 99, element: 'light' }, cast: '{a}の上から、ながれぼしが、{t}におちてきた！', anim: 'c8s_comet',
    desc: 'ながれぼしで、1人に光の大ダメージ。',
  },
  m8s_alone: {
    name: 'ひとりにする', kind: 'monster', target: 'enemy',
    effect: { type: 'c8sAlone' }, cast: '{a}「…みんな、ひとりになればいい。」', anim: 'c8s_alone',
    desc: '1人を闇にとじこめて、ひとりにする。仲間がよびかけるともどる。',
  },
  // 3だんめ: くずれる 時のはざま
  m8s_crack: {
    name: '時のくずれ', kind: 'monster', target: 'enemies',
    effect: { type: 'c8sCrack' }, cast: '時のはざまが、ガラガラと、くずれ始めた…！', anim: 'c8s_crack',
    desc: 'くずれる時のはざまで、敵みんなに大ダメージ。身を守ると半分になる。',
  },
  // よびかける・千年の約束（ソリトゥスの 戦いの 間だけ、みんなが 使える。オートは 使わない）
  m8s_call: {
    name: 'よびかける', kind: 'skill', mp: 0, target: 'enemy', noAuto: true,
    effect: { type: 'c8sCall' }, cast: '{a}は、{t}にむかって、大きな声でよびかけた！', anim: 'c8s_call',
    desc: '心がゆらいだ星に、よびかける。くらい心がはがれる。',
  },
  m8s_promise: {
    name: '千年の約束', kind: 'skill', mp: 0, target: 'enemy', noAuto: true,
    effect: { type: 'c8sPromise' }, cast: '千年前と今の、みんなの手がかさなった…！', anim: 'c8s_promise',
    desc: 'みんなの力を1つにする合体技。光がたまると使える。',
  },
};
