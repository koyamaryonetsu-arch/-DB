// 第2部 第7章 第3幕「ひとりぼっちの星」の 魔物・いばらの魔女マレフィナ（黒い 竜）・カイの影の 技（B: 戦い。abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
// とくべつな こうか（c7iCurse … 百年ねむりののろい・c7iTransform … 黒い 竜に 変身・c7iBreath … 黒いほのおのいき・
//   c7iThrow … かげブーメラン・c7iDaze … ふらふら）は shared/battle-c7i.js の c7iEffect
// desc は 1文めで 何を するか わかる ように（スマホの たて持ちは 1文めだけ 出る。client/ui/skillinfo.js の firstSentence）
// anim は a7n_〜（手下）・a7m_〜（マレフィナ）・a7d_〜（黒い 竜）・a7h_〜（カイの影）。client/render/battlefx-c7i.js
export const C7I_ABILITIES = {
  // ── アイスブロス ──
  m7n_ib_ball: {
    name: 'こおりのたま', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 1.2, element: 'ice' }, { type: 'status', status: 'paralyze', chance: 0.12, turns: [1, 1] }] },
    cast: '{a}は、こおりのたまを、{t}にぽーんと投げた！', anim: 'a7n_iceball',
    desc: 'こおりのたまで、1人に氷のダメージ。こおりついて動けなくなることがある。',
  },
  m7n_ib_barrage: {
    name: 'こおりのたまの雨', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'magic', base: [78, 94], thr: 99, element: 'ice' }, cast: '{a}は、こおりのたまを、ぽんぽんぽん！と投げまくった！', anim: 'a7n_barrage',
    desc: 'こおりのたまを投げまくり、敵みんなに氷のダメージ。',
  },
  // ── こおりパックン ──
  m7n_ip_bite: {
    name: 'こおりのかみつき', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.3, element: 'ice' }, cast: '{a}は、つめたい口で、{t}にパクッ！とかみついた！', anim: 'a7n_bite',
    desc: 'こおった口でかみつき、1人に氷の大きなダメージ。',
  },
  m7n_ip_breath: {
    name: 'つめたいいき', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'magic', base: [80, 96], thr: 99, element: 'ice' }, cast: '{a}は、ひゅうううっと、つめたいいきをはいた！', anim: 'a7n_breath',
    desc: 'つめたいいきで、敵みんなに氷のダメージ。',
  },
  // ── いばらゴブリン ──
  m7n_tg_spear: {
    name: 'いばらのやり', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.35 }, cast: '{a}は、いばらのまいたやりで、{t}をついた！', anim: 'a7n_spear',
    desc: 'いばらのやりで、1人に大きなダメージ。',
  },
  m7n_tg_march: {
    name: 'わいわいとつげき', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'phys', mult: 0.62 }, cast: '{a}たちが、わいわいさわぎながら、つっこんできた！', anim: 'a7n_march',
    desc: 'さわぎながらつっこんで、敵みんなにダメージ。',
  },
  m7n_tg_cheer: {
    name: '魔女さまばんざい', kind: 'monster', mp: 3, target: 'self',
    effect: { type: 'buff', stat: 'atk', mult: 1.25 }, cast: '{a}「マレフィナさま、ばんざーい！」', anim: 'a7n_cheer',
    desc: 'はりきって、自分の攻撃力を上げる。',
  },
  // ── 氷の魔法鏡 ──
  m7n_im_beam: {
    name: 'うつしみの光', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', base: [132, 152], thr: 99, element: 'ice' }, cast: '{a}に、{t}の姿がうつった！\n鏡の中から、つめたい光がとび出した！', anim: 'a7n_beam',
    desc: '鏡の光で、1人に氷の大きなダメージ。',
  },
  m7n_im_frost: {
    name: '鏡のふぶき', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', base: [84, 100], thr: 99, element: 'ice' }, cast: '{a}の中から、ふぶきがふき出した！', anim: 'a7n_frost',
    desc: '鏡からふぶきを出し、敵みんなに氷のダメージ。',
  },
  m7n_im_shine: {
    name: '鏡のかがやき', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'blind', chance: 0.3, turns: [2, 3] }, cast: '{a}が、ピカーッとかがやいた！', anim: 'a7n_shine',
    desc: 'まぶしく光り、敵みんなをまぼろしに包むことがある。',
  },
  // ── ブリザード ──
  m7n_bz_storm: {
    name: 'ふぶきのうず', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', base: [88, 104], thr: 99, element: 'ice' }, cast: '{a}のまわりに、ふぶきが、ごうごうとうずまいた！', anim: 'a7n_storm',
    desc: 'ふぶきをうずまかせ、敵みんなに氷のダメージ。',
  },
  m7n_bz_freeze: {
    name: 'こおりつくいき', kind: 'monster', mp: 5, target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'magic', base: [120, 140], thr: 99, element: 'ice' }, { type: 'status', status: 'paralyze', chance: 0.3, turns: [1, 2] }] },
    cast: '{a}は、{t}に、こおりつくいきをふきかけた！', anim: 'a7n_freeze',
    desc: 'こおりつくいきで、1人に氷のダメージ。動けなくなることがある。',
  },
  m7n_bz_claw: {
    name: 'こおりのツメ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 0.7, hits: 2, element: 'ice' }, cast: '{a}は、こおりのツメで、{t}をひっかいた！', anim: 'a7n_claw',
    desc: 'こおりのツメで、1人を2回ひっかく。',
  },

  // ── いばらの魔女マレフィナ（中ボス。1だんめ）──
  m7m_whip: {
    name: 'いばらのムチ', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.35 }, cast: '{a}は、黒いいばらを、ムチのようにふるった！', anim: 'a7m_whip',
    desc: 'いばらをふるって、1人に大きなダメージ。',
  },
  m7m_green: {
    name: 'みどりのほのお', kind: 'monster', target: 'enemies',
    effect: { type: 'magic', base: [140, 162], thr: 99, element: 'fire' }, cast: '{a}のつえの先に、みどり色のほのおがもえ上がった！', anim: 'a7m_green',
    desc: 'みどりのほのおで、敵みんなに炎のダメージ。',
  },
  m7m_staff: {
    name: 'のろいのつえ', kind: 'monster', target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'magic', base: [200, 230], thr: 99, element: 'dark' }, { type: 'debuff', stat: 'def', mult: 0.8, chance: 0.4 }] },
    cast: '{a}のつえの玉が、{t}をにらんだ！', anim: 'a7m_staff',
    desc: 'つえの玉から闇を放ち、1人に闇の大ダメージ。',
  },
  m7m_laugh: {
    name: '魔女の高わらい', kind: 'monster', target: 'enemies',
    effect: { type: 'debuff', stat: 'atk', mult: 0.8, chance: 0.5 }, cast: '{a}「オーッホッホッホ！たよりない子どもたちだこと！」', anim: 'a7m_laugh',
    desc: '高わらいで、敵みんなの攻撃力を下げることがある。',
  },
  m7m_curse: {
    name: '百年ねむりののろい', kind: 'monster', target: 'enemies',
    effect: { type: 'c7iCurse' }, cast: '{a}「みんな、百年ねむるがいい…！」\n糸車のはりが、あやしく光った！', anim: 'a7m_curse',
    desc: '身を守っていない敵みんなを、ねむらせる。身を守ると、のろいをはね返せる。',
  },
  m7m_transform: {
    name: '本当の姿', kind: 'monster', target: 'self',
    effect: { type: 'c7iTransform' }, cast: '{a}「よくも…！わたしの本当の姿を、見せてあげよう！」', anim: 'a7m_transform',
    desc: '黒い竜に姿をかえる。いばらのかべは、もえて消える。',
  },
  m7m_thorn_creak: {
    name: 'ギシギシ', kind: 'monster', target: 'self',
    effect: { type: 'nothing' }, cast: '{a}が、ギシギシと音を立てた…', anim: 'none',
    desc: 'いばらがきしむ音。何もしない。',
  },

  // ── 黒い 竜（マレフィナの 2だんめ）──
  m7d_claw: {
    name: '竜のかぎづめ', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}は、大きなかぎづめで、{t}を切りさいた！', anim: 'a7d_claw',
    desc: 'かぎづめで、1人に大きなダメージ。',
  },
  m7d_tail: {
    name: 'しっぽのなぎはらい', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 0.68 }, cast: '{a}は、太いしっぽを、ぶうんとふり回した！', anim: 'a7d_tail',
    desc: 'しっぽをふり回し、敵みんなにダメージ。',
  },
  m7d_fire: {
    name: 'みどりの火の玉', kind: 'monster', target: 'enemy',
    effect: { type: 'magic', base: [230, 260], thr: 99, element: 'fire' }, cast: '{a}の口から、みどりの火の玉が、{t}にとんだ！', anim: 'a7d_fire',
    desc: '火の玉をはいて、1人に炎の大ダメージ。',
  },
  m7d_roar: {
    name: '竜のほうこう', kind: 'monster', target: 'enemies',
    effect: { type: 'debuff', stat: 'def', mult: 0.8, chance: 0.5 }, cast: '{a}「グオオオオオッ！」\n城じゅうが、ゆれた！', anim: 'a7d_roar',
    desc: 'ほえて、敵みんなの守りを下げることがある。',
  },
  m7d_breath: {
    name: '黒いほのおのいき', kind: 'monster', target: 'enemies',
    effect: { type: 'c7iBreath' }, cast: '{a}は、大きくいきをすいこんで…\n黒いほのおを、ゴオオオッ！とはいた！', anim: 'a7d_breath',
    desc: '黒いほのおのいきで、敵みんなに炎の大ダメージ。身を守ると半分になる。',
  },

  // ── カイの影（第7章の さいごの ボス）──
  m7h_star: {
    name: 'かげ手裏剣', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 0.5, hits: 3 }, cast: '{a}は、黒い手裏剣を、{t}にシュシュシュッと投げた！', anim: 'a7h_star',
    desc: '黒い手裏剣で、1人を3回打つ。',
  },
  m7h_boomerang: {
    name: 'かげのしおかぜ', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 0.42, hits: 2, ignoreDef: 0.5 }, cast: '{a}「いっくぞー…」\nカイと同じかまえで、黒いブーメランが、行って帰ってきた！', anim: 'a7h_boomerang',
    desc: '黒いブーメランで、敵みんなを2回打つ。',
  },
  m7h_stitch: {
    name: '影ぬいの術', kind: 'monster', target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 1.0, element: 'dark' }, { type: 'status', status: 'paralyze', chance: 0.35, turns: [1, 2] }] },
    cast: '{a}は、{t}の影に、黒いくないをつきさした！', anim: 'a7h_stitch',
    desc: '影をぬいとめて、1人に闇のダメージ。動けなくすることがある。',
  },
  m7h_hide: {
    name: 'やみがくれ', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'eva', add: 0.18, dur: 30 }, cast: '{a}は、やみの中に、すうっととけこんだ…', anim: 'a7h_hide',
    desc: 'やみにとけこみ、攻撃を当たりにくくする。',
  },
  m7h_dark: {
    name: 'ひとりぼっちのやみ', kind: 'monster', target: 'enemies',
    effect: { type: 'magic', base: [150, 172], thr: 99, element: 'dark' }, cast: '{a}「どうせ、だれもわかってくれない…」\nまわりが、まっ暗になった！', anim: 'a7h_dark',
    desc: 'まっ暗なやみで、敵みんなに闇のダメージ。',
  },
  m7h_throw: {
    name: 'かげブーメラン', kind: 'monster', target: 'enemy',
    effect: { type: 'c7iThrow' }, cast: '{a}は、ねらった相手に、大きなかげブーメランを投げつけた！', anim: 'a7h_throw',
    desc: 'ねらった人に、とても大きなダメージ。ねらわれた人が身を守ると、はね返せる。',
  },
  m7h_daze: {
    name: 'ふらふら', kind: 'monster', target: 'self',
    effect: { type: 'c7iDaze' }, cast: '{a}は、はね返されたブーメランに当たって、ふらふらしている…', anim: 'a7h_daze',
    desc: 'はね返されてふらつき、動けない。',
  },
};
