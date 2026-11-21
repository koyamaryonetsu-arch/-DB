// 第3部 第2章 第3幕「紫と、うばわれた音」の 魔物・たいさムスカリ・アルゴル・「うつる」の 技（B: 戦い。abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
// とくべつな こうか（c10kBolt … 大いなずま・c10kWhy … な、なぜだ〈休み〉・c10kMove … うつる ／
//   c10yEat … 光を食べる・c10yVeil … やみのとばり・c10yBlast … 星の音（全体）・c10yStill … 音が止まった〈動けない〉）は shared/battle-c10c.js の c10cEffect
// desc は 1文めで 何を するか わかる ように（スマホの たて持ちは 1文めだけ 出る）
// anim は c10c_〜（ふつうの 魔物）・c10k_〜（たいさ）・c10y_〜（アルゴル）・c10c_move（うつる）。client/render/battlefx-c10c.js
export const UTSURU = 'm10_utsuru';
export const C10C_ABILITIES = {
  // ── むらさき雲ひつじ ──
  m10c_sh_tackle: {
    name: 'もこもこタックル', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.38 }, cast: '{a}が、もこもこの体で、{t}にぶつかってきた！', anim: 'c10c_tackle',
    desc: 'もこもこの体でぶつかり、1人に大きなダメージ。',
  },
  m10c_sh_mist: {
    name: 'むらさきのねむり雲', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.16, turns: [1, 2] }, cast: '{a}の毛から、むらさきの雲が、ふわふわ出てきた！', anim: 'c10c_mist',
    desc: '敵みんなを、ねむらせることがある。',
  },
  // ── よぞらエイ ──
  m10c_ry_glide: {
    name: 'よぞらのすべりこみ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.42 }, cast: '{a}が、すうっと、{t}の足もとにすべりこんだ！', anim: 'c10c_glide',
    desc: 'すべりこんで、1人に大きなダメージ。',
  },
  m10c_ry_sting: {
    name: 'いなずましっぽ', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'magic', base: [170, 186], thr: 99, element: 'bolt' }, { type: 'status', status: 'paralyze', chance: 0.12, turns: [1, 1] }] },
    cast: '{a}のしっぽが、ぱちぱち光った！', anim: 'c10c_sting',
    desc: '雷のしっぽで、1人に雷のダメージ。しびれることがある。',
  },
  // ── ゴロゴロぐも ──
  m10c_pf_bolt: {
    name: 'むらさきいなずま', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', base: [176, 192], thr: 99, element: 'bolt' }, cast: '{a}が、むらさきのいなずまを、{t}に落とした！', anim: 'c10c_bolt',
    desc: 'いなずまを落として、1人に雷の大きなダメージ。',
  },
  m10c_pf_rain: {
    name: 'ゴロゴロあめ', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [108, 122], thr: 99, element: 'bolt' }, cast: '{a}が、ゴロゴロ鳴りながら、雨をふらせた！', anim: 'c10c_rain',
    desc: '雷の雨で、敵みんなに雷のダメージ。',
  },
  // ── うき石クラゲ ──
  m10c_jl_sting: {
    name: 'ふわふわのあし', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 1.2 }, { type: 'status', status: 'poison', chance: 0.25, turns: [3, 4] }] },
    cast: '{a}の長いあしが、{t}にからみついた！', anim: 'c10c_jsting',
    desc: 'あしをからめて、1人にダメージ。毒になることがある。',
  },
  m10c_jl_stone: {
    name: 'うき石おとし', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'phys', mult: 0.6 }, cast: '{a}が、かかえていた小石を、ぱっとはなした！', anim: 'c10c_stone',
    desc: '小石を落として、敵みんなにダメージ。',
  },
  m10c_jl_glow: {
    name: 'ゆらゆらのひかり', kind: 'monster', mp: 3, target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.3 }, cast: '{a}の体が、ゆらゆら光った！', anim: 'c10c_glow',
    desc: '体を光らせて、守りを上げる。',
  },
  // ── ほしくずはこび ──
  m10c_cr_box: {
    name: 'はこでどすん', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}が、星のかけらのはこを、{t}の上に落とした！', anim: 'c10c_box',
    desc: 'はこを落として、1人に大きなダメージ。',
  },
  m10c_cr_throw: {
    name: '星くずなげ', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'magic', base: [104, 118], thr: 99, element: 'light' }, cast: '{a}が、はこの中の星くずを、ぱらぱらなげた！', anim: 'c10c_throw',
    desc: '星くずをなげて、敵みんなに光のダメージ。',
  },
  m10c_cr_rest: {
    name: 'ひとやすみ', kind: 'monster', mp: 3, target: 'self',
    effect: { type: 'heal', base: [330, 370], thr: 99 }, cast: '{a}は、はこにすわって、ひとやすみした。', anim: 'c10c_rest',
    desc: 'ひとやすみして、自分のHPを回復する。',
  },
  // ── ほしほりモグラ ──
  m10c_ml_drill: {
    name: 'ほしほりづめ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.44 }, cast: '{a}が、大きなつめで、{t}をひっかいた！', anim: 'c10c_drill',
    desc: '大きなつめで、1人に大きなダメージ。',
  },
  m10c_ml_dust: {
    name: 'きらきらすなけむり', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 0.48 }, { type: 'status', status: 'blind', chance: 0.2, turns: [2, 3] }] },
    cast: '{a}が、星のかけらまじりの土を、ばさっとかけた！', anim: 'c10c_dust',
    desc: '土をかけて、敵みんなにダメージ。目がくらむことがある。',
  },
  // ── みはりランタン ──
  m10c_lp_beam: {
    name: 'みはりのひかり', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', base: [176, 192], thr: 99, element: 'light' }, cast: '{a}の目が、ぎらりと光って、{t}をてらした！', anim: 'c10c_beam',
    desc: '光をあてて、1人に光の大きなダメージ。',
  },
  m10c_lp_alarm: {
    name: 'ジリリリ！', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'status', status: 'confuse', chance: 0.16, turns: [1, 2] }, cast: '{a}が、ジリリリ！と、大きな音を鳴らした！', anim: 'c10c_alarm',
    desc: '大きな音で、敵みんなを混乱させることがある。',
  },
  m10c_lp_flare: {
    name: 'ランタンのほのお', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [108, 122], thr: 99, element: 'fire' }, cast: '{a}の中のほのおが、ぼうっと大きくなった！', anim: 'c10c_flare',
    desc: 'ほのおをふき出して、敵みんなに炎のダメージ。',
  },
  // ── とりでのはにわ兵 ──
  m10c_hw_spear: {
    name: 'はにわのやり', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.42 }, cast: '{a}が、土のやりで、{t}をついた！', anim: 'c10c_spear',
    desc: '土のやりで、1人に大きなダメージ。',
  },
  m10c_hw_march: {
    name: 'とりでのこうしん', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'phys', mult: 0.6 }, cast: '{a}が、ざっざっと、足ぶみをして進んできた！', anim: 'c10c_march',
    desc: '足ぶみで進んで、敵みんなにダメージ。',
  },
  m10c_hw_guard: {
    name: 'はにわのかまえ', kind: 'monster', mp: 3, target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.3 }, cast: '{a}は、やりをかまえて、じっと立った！', anim: 'c10c_guard',
    desc: 'かまえて、守りを上げる。',
  },

  // ── 空の 中ボス: たいさムスカリ ──
  m10k_slab: {
    name: '石ばんでこつん', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 1.15 }, cast: '{a}「下がりたまえ。」雷の石ばんで、{t}をこつんとたたいた！', anim: 'c10k_slab',
    desc: '石ばんでたたいて、1人に大きなダメージ。',
  },
  m10k_spark: {
    name: 'ぱちぱちいなずま', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'magic', base: [820, 880], thr: 99, element: 'bolt' }, cast: '{a}の石ばんから、小さないなずまが、ぱちぱちとびちった！', anim: 'c10k_spark',
    desc: '小さないなずまで、敵みんなに雷のダメージ。',
  },
  m10k_flash: {
    name: 'ゴーグルのひかり', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'magic', base: [1160, 1240], thr: 99, element: 'light' }, cast: '{a}の丸いゴーグルが、むらさきに光った！', anim: 'c10k_flash',
    desc: 'ゴーグルの光で、1人に光の大きなダメージ。',
  },
  m10k_bolt: {
    name: '大いなずま', kind: 'monster', target: 'enemies',
    effect: { type: 'c10kBolt' }, cast: '{a}「石の上の者たちよ、雷を受けたまえ！」光った石に、大いなずまが落ちた！', anim: 'c10k_bolt',
    desc: '光った石の上の人みんなに、雷の大ダメージ。光っていない石なら当たらない。',
  },
  m10k_why: {
    name: 'な、なぜだ', kind: 'monster', target: 'self',
    effect: { type: 'c10kWhy' }, cast: '{a}「な、なぜだ…！雷が、当たらぬとは…！」', anim: 'c10k_why',
    desc: '雷が外れて、うろたえている。',
  },

  // ── 幕の ボス: アルゴル ──
  m10y_shard: {
    name: '星くずのつぶて', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'magic', base: [860, 920], thr: 99, element: 'dark' }, cast: '{a}が手をふると、くらい星くずが、ざあっとふりそそいだ！', anim: 'c10y_shard',
    desc: 'くらい星くずで、敵みんなに闇のダメージ。',
  },
  m10y_cold: {
    name: 'つめたい光', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'magic', base: [1240, 1320], thr: 99, element: 'dark' }, cast: '{a}の手から、つめたい光が、{t}にのびた！', anim: 'c10y_cold',
    desc: 'つめたい光で、1人に闇の大きなダメージ。',
  },
  m10y_mantle: {
    name: 'マントのひとふり', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 1.2 }, cast: '{a}が、こい色のマントを、ばさりとふった！', anim: 'c10y_mantle',
    desc: 'マントをふって、1人に大きなダメージ。',
  },
  m10y_eat: {
    name: '光を食べる', kind: 'monster', target: 'enemies',
    effect: { type: 'c10yEat' }, cast: '{a}「…その光、もらう。」', anim: 'c10y_eat',
    desc: '敵みんなのよい効果を、ぜんぶ食べて、回復して強くなる。',
  },
  m10y_veil: {
    name: 'やみのとばり', kind: 'monster', target: 'enemies',
    effect: { type: 'c10yVeil' }, cast: '{a}が、マントを大きく広げた。あたりが、すうっと暗くなった…', anim: 'c10y_veil',
    desc: 'あたりを暗くして、敵みんなのこうげきを、半分しか通らなくする。光で消える。',
  },
  m10y_blast: {
    name: '星の音', kind: 'monster', target: 'enemies',
    effect: { type: 'c10yBlast' }, cast: '{a}が、むらさきの音をかざした！むらさきの音が、ごうっとひびいた！', anim: 'c10y_blast',
    desc: 'うばったむらさきの音で、敵みんなに大ダメージ。防御で、へらせる。',
  },
  m10y_still: {
    name: '音が止まった', kind: 'monster', target: 'self',
    effect: { type: 'c10yStill' }, cast: '{a}「…なぜ、音が、こたえない。」', anim: 'c10y_still',
    desc: 'むらさきの音が止まって、動けない。',
  },

  // ── だれでも（たいさの 戦いだけ。その 人の 番を 使う。cmd.choice … 0 左・1 まん中・2 右）──
  [UTSURU]: {
    name: 'うつる', kind: 'skill', mp: 0, target: 'self', noAuto: true,
    effect: { type: 'c10kMove' }, cast: '{a}は、となりのうき石へ、ぴょんととびうつった！', anim: 'c10c_move',
    desc: 'べつのうき石へ、とびうつる。光っていない石にいれば、雷は当たらない。',
  },
};
