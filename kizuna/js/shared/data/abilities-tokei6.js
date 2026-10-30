// 第2部 第6章 Step 6「時計塔の心臓」の 魔物・ゼンマイ・リオンの けいこの 技（B: 戦い。abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
// とくべつな こうか（zenCollapse … 時の大ほうかい）は shared/battle-tokei6.js の tokei6Effect
// anim は a6z_〜・a6s_〜（client/render/battlefx-tokei6.js）
//
// ゼンマイの 1だんめは 家来の 技（大砂流・まきもどし・時止め・大ふりこ・時のかね）を そのまま 使う。
// 名前・セリフ・えんしゅつだけ ゼンマイの ものに する（ZEN_BY → 技の by.zenmai。shared/ability-label.js の abilityFor）
export const TOKEI6_ABILITIES = {
  // ── 時計ゆうれい ──
  m6z_gh_touch: {
    name: 'つめたい手', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', base: [128, 148], thr: 99, element: 'ice' }, cast: '{a}のつめたい手が、{t}の体をすりぬけた…！', anim: 'a6z_touch',
    desc: 'つめたい手で、1人に氷のダメージ。',
  },
  m6z_gh_wail: {
    name: '時のなげき', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', base: [70, 84], thr: 99, element: 'dark' }, cast: '{a}は、止まった時をなげいて、くさりを鳴らした…！', anim: 'a6z_wail',
    desc: 'なげきの声で、敵みんなに闇のダメージ。',
  },
  m6z_gh_steal: {
    name: '時をうばう', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'debuff', stat: 'agi', mult: 0.7, chance: 0.6 }, cast: '{a}の顔の時計が、{t}の時を、カチカチとすいとった…！', anim: 'a6z_steal',
    desc: '時をすいとって、1人の素早さを下げることがある。',
  },
  // ── かねの精 ──
  m6z_bs_chime: {
    name: 'すずの音', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [68, 82], thr: 99, element: 'wind' }, cast: '{a}は、チリン、チリンと、かねをゆらした！\n音の風が、みんなをつつむ！', anim: 'a6z_chime',
    desc: 'かねの音の風で、敵みんなにダメージ。',
  },
  m6z_bs_heal: {
    name: 'やさしいかね', kind: 'monster', mp: 8, target: 'allies',
    effect: { type: 'heal', base: [160, 190], thr: 99 }, cast: '{a}のかねが、やさしく鳴った…', anim: 'a6z_kind',
    desc: 'やさしいかねの音で、仲間みんなを回復する。',
  },
  m6z_bs_ring: {
    name: '目ざましのかね', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'status', status: 'confuse', chance: 0.3, turns: [1, 2] }, cast: '{a}は、{t}の耳もとで、ジリリリリ…！とかねを鳴らした！', anim: 'a6z_ring',
    desc: '耳もとでかねを鳴らして、1人を混乱させることがある。',
  },
  // ── 秒針の精 ──
  m6z_ss_tick: {
    name: 'チクタクづき', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 0.7, hits: 2 }, cast: '{a}は、チク、タク！と、{t}を2回つついた！', anim: 'a6z_tick',
    desc: '秒針で、1人を2回つつく。',
  },
  m6z_ss_rain: {
    name: '針の雨', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'phys', mult: 0.6 }, cast: '{a}は、細い針を、雨のようにふらせた！', anim: 'a6z_rain',
    desc: '針の雨で、敵みんなにダメージ。',
  },
  m6z_ss_haste: {
    name: 'いそぎの針', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'agi', mult: 1.3 }, cast: '{a}の針が、チクタクチクタク…と、速く回り出した！', anim: 'a6z_haste',
    desc: '針を速く回して、素早さを上げる。',
  },
  // ── 大時計の番人 ──
  m6z_cg_pound: {
    name: '文字ばんパンチ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.5 }, cast: '{a}は、大きなこぶしで、{t}をなぐりつけた！\nゴーン…！', anim: 'a6z_pound',
    desc: '大きなこぶしで、1人にとても大きなダメージ。',
  },
  m6z_cg_alarm: {
    name: '大時計のベル', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', base: [92, 108], thr: 99 }, cast: '{a}のむねの文字ばんから、大きなベルの音がひびいた！', anim: 'a6z_alarm',
    desc: '大きなベルの音で、敵みんなにダメージ。',
  },
  m6z_cg_guard: {
    name: '歯車のよろい', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.3 }, cast: '{a}の体の歯車が、ガチリとかみあった！', anim: 'a6z_guard',
    desc: '歯車をかみあわせて、守りを上げる。',
  },
  // ── ぜんまい草 ──
  m6z_zf_whip: {
    name: 'くるくるムチ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.35 }, cast: '{a}のまいたわか葉が、びよーんとのびて、{t}をたたいた！', anim: 'a6z_whip',
    desc: 'わか葉をのばして、1人に大きなダメージ。',
  },
  m6z_zf_spring: {
    name: 'ばねのつる', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'phys', mult: 0.62 }, cast: '{a}のつるが、ばねのように、みんなをはじいた！', anim: 'a6z_vine',
    desc: 'ばねのようなつるで、敵みんなにダメージ。',
  },
  m6z_zf_spore: {
    name: 'ぜんまいのほうし', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.2, turns: [1, 2] }, cast: '{a}は、うずまきのほうしを、ふわりとまいた…', anim: 'a6z_spore',
    desc: 'ほうしをまいて、敵みんなをねむらせることがある。',
  },
  // ── ねじまき小あくま ──
  m6z_wd_key: {
    name: 'ねじまきづき', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}は、せなかのかぎをぬいて、{t}をついた！', anim: 'a6z_key',
    desc: 'ねじまきのかぎで、1人に大きなダメージ。',
  },
  m6z_wd_dark: {
    name: 'いたずらの闇', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', base: [70, 84], thr: 99, element: 'dark' }, cast: '{a}は、けらけらわらって、闇の玉をばらまいた！', anim: 'a6z_mischief',
    desc: '闇の玉で、敵みんなに闇のダメージ。',
  },
  m6z_wd_wind: {
    name: 'ねじをまく', kind: 'monster', mp: 4, target: 'allies',
    effect: { type: 'buff', stat: 'atk', mult: 1.2 }, cast: '{a}は、仲間のせなかのねじを、キリキリとまいた！', anim: 'a6z_windup',
    desc: '仲間みんなのねじをまいて、攻撃力を上げる。',
  },
  // ── からくりがいこつ ──
  m6z_cb_slash: {
    name: '歯車けん', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}は、歯車の剣で、{t}に切りかかった！', anim: 'a6z_cogslash',
    desc: '歯車の剣で、1人に大きなダメージ。',
  },
  m6z_cb_rattle: {
    name: 'カタカタおどり', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'phys', mult: 0.62 }, cast: '{a}は、カタカタとおどりながら、みんなに体あたり！', anim: 'a6z_rattle',
    desc: 'おどりながら、敵みんなにダメージ。',
  },

  // ── ゼンマイ（ボス。shared/battle-tokei6.js）──
  m6z_zm_hand: {
    name: '時計の針', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.45 }, cast: '{a}は、大きな時計の針を、{t}めがけてふり下ろした！', anim: 'a6z_hand',
    desc: '大きな時計の針で、1人に大きなダメージ。',
  },
  m6z_zm_spring: {
    name: 'ぜんまいの嵐', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'phys', mult: 0.72 }, cast: '{a}のマントから、何本ものぜんまいが、とび出した！\nびゅんびゅんと、みんなを打つ！', anim: 'a6z_spring',
    desc: 'ぜんまいの嵐で、敵みんなにダメージ。',
  },
  m6z_zm_shadow: {
    name: '影の歯車', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', base: [150, 175], thr: 99, element: 'dark' }, cast: '{a}は、影の歯車を、いくつも回して、とばした！', anim: 'a6z_shadow',
    desc: '影の歯車で、敵みんなに闇のダメージ。',
  },
  m6z_zm_slow: {
    name: 'ねじもどし', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'debuff', stat: 'agi', mult: 0.75, chance: 0.5 }, cast: '{a}は、みんなの時のねじを、ギリギリと、もどした…', anim: 'a6z_slow',
    desc: '時のねじをもどして、敵みんなの素早さを下げることがある。',
  },
  m6z_zm_twin: {
    name: '長い針と短い針', kind: 'monster', mp: 6, target: 'enemy',
    effect: { type: 'phys', mult: 0.95, hits: 2 }, cast: '{a}は、長い針と短い針で、{t}を、ざくり、ざくりと切りさいた！', anim: 'a6z_twin',
    desc: '2本の針で、1人を2回切る。',
  },
  // 時の大ほうかい（2だんめ。針が 12時に なると かならず。battle-tokei6.js が えらぶ）: みんなに とても 大きな 物理の 一撃（身を 守ると 半分）
  m6z_zm_collapse: {
    name: '時の大ほうかい', kind: 'monster', target: 'enemies',
    effect: { type: 'zenCollapse' }, cast: '文字ばんの針が、12時に重なった…！\n{a}「時よ…くずれよ！」\n時計塔の心臓が、くだけちった！', anim: 'a6z_collapse',
    desc: '針が12時になると起こる。敵みんなに、とても大きなダメージ。身を守ると半分になる。歯車をこわすと、針がもどる。',
  },
  // 歯車（2だんめの まわりの 敵。動かない）
  m6z_gr_turn: {
    name: 'くるくる', kind: 'monster', target: 'self',
    effect: { type: 'nothing' }, cast: '{a}は、カチ、カチ…と回っている。', anim: 'none',
    desc: '回っているだけ。',
  },

  // ── リオンの けいこ（1人で 戦う）──
  m6s_rn_slash: {
    name: 'はやての二段斬り', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 0.72, hits: 2 }, cast: '{a}「はっ…！」\nはやての二段斬り！{t}を2回切りつけた！', anim: 'a6s_slash',
    desc: 'すばやく2回切りつける。',
  },
  m6s_rn_guard: {
    name: '剣のかまえ', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.3 }, cast: '{a}は、剣をしずかにかまえた…！', anim: 'a6s_guard',
    desc: '剣をかまえて、守りを上げる。',
  },
  m6s_rn_crest: {
    name: '紋章の光の剣', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.6, element: 'light' }, cast: '{a}の手の紋章が、まぶしく光った！\n「いくぞ…！」光の剣が、{t}を切りさく！', anim: 'a6t_crest',
    desc: '紋章の光をやどした剣で、1人に光の大ダメージ。',
  },
  m6s_rn_charge: {
    name: '光をためる', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm6s_rn_burst' }, cast: '{a}は、剣を高くかかげた…！\n紋章の光が、剣にあつまっていく…！', anim: 'a6s_charge',
    desc: '次の番に「光の大剣」。身を守ろう。',
  },
  m6s_rn_burst: {
    name: '光の大剣', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 2.1, element: 'light' }, cast: '{a}「これが…紋章の勇者の剣だ！」\n光の大剣が、{t}をのみこんだ！', anim: 'a6s_burst',
    desc: '光の大剣で、とても大きなダメージ。身を守ると半分になる。',
  },
};

// ゼンマイが 家来の 技を 使う ときの 名前・セリフ・えんしゅつ（abilities.js が addZenBy で 技に by.zenmai を つける）
export const ZEN_BY = {
  m6_sc_fall_charge: { name: '砂時計の呪い', cast: 'ゼンマイのマントから、最後の砂が、さらりと落ちた…！\n大きな砂時計が、ゼンマイのうしろにうかび上がる…！' },
  m6_sc_fall: { name: '大砂流', cast: '{a}「サンドクロックの砂よ…のみこめ！」\n砂の大波が、みんなをのみこむ！' },
  m6_gd_record: { name: '時を覚える', cast: '{a}のむねの歯車が、カチリと止まった…！\n「今の体を…覚えておこう」' },
  m6_gd_rewind: { name: 'まきもどし', cast: '{a}「ギアドンのぜんまいよ…もどれ！」\n時が、ぎゅるぎゅるとさか回りする！' },
  m6_pd_stop_charge: { name: 'ふりこがまん中に', cast: '{a}のうしろの大きなふりこが、まん中で、ぴたりと止まった…！\nチク…タク…' },
  m6_pd_stop: { name: '時止め', cast: '{a}「ペンデュラのふりこよ…止めよ！」' },
  m6_pd_big_charge: { name: 'ふりこをふり上げる', cast: '{a}のうしろの大きなふりこが、右のはしで、高くふり上がった…！' },
  m6_pd_big: { name: '大ふりこ', cast: '{a}の大ふりこ！\n大きなふりこが、みんなをまとめて、なぎはらう！' },
  m6t_cr_bell: { name: '時のかね', cast: '{a}「カリヨンのかねよ…鳴りひびけ！」\nゴーン…！ゴーン…！', anim: 'a6z_bell' },
};
export function addZenBy(table) {
  for (const [id, over] of Object.entries(ZEN_BY)) {
    const a = table[id];
    if (!a) continue;
    a.by = { ...(a.by || {}), zenmai: { ...over, desc: a.desc } };
  }
}
