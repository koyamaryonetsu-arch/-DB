// 第37回 A: サファラ闘技場の 王者たちの 技（abilities.js で まぜる。monsters-arena.js）
// とくべつな こうか（arCombo・arArmor・arSpell）は shared/battle-arena.js の arenaEffect。
// 前ぶれ（telegraph）・呪文を はね返す 光（reflect）・よみがえりの まい（reviveAll と chant）・砂に もぐる（burrow）は 今ある しくみ
export const ARENA_ABILITIES = {
  // ───── ランク1の 王者: 力じまんの戦士（前ぶれ → 1人に 大きな 一撃）─────
  m_ar1_punch: {
    name: '力じまんパンチ', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.35 }, cast: '{a}の、力じまんパンチ！', anim: 'punch',
    desc: '太いうでで、1人をなぐる。',
  },
  m_ar1_flex: {
    name: '力こぶ', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'atk', mult: 1.25, dur: 25 }, cast: '{a}は、むきむきの力こぶを見せつけた！', anim: 'warcry',
    desc: '力こぶを見せつけて、攻撃力を上げる。',
  },
  m_ar1_charge: {
    name: 'ばくれつの前ぶれ', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_ar1_bomb' }, cast: '{a}は、大きく息をすって、両うでに力をためている…！', anim: 'charge',
    desc: '次の番に「ばくれつかぶとわり」。身を守ろう。',
  },
  m_ar1_bomb: {
    name: 'ばくれつかぶとわり', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 2.3, ignoreDef: 0.3 }, cast: '{a}の、ばくれつかぶとわり！\n{t}の頭の上に、重い一撃がふり下ろされた！', anim: 'slash_heavy',
    desc: '力をためた、とても重い一撃。1人に大ダメージ。身を守ると半分になる。',
  },

  // ───── ランク2の 王者: 砂嵐三兄弟（合図 → 3人の 合体技。生きている 兄弟が 多いほど 強い）─────
  m_ar2_slash: {
    name: '三日月切り', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.2 }, cast: '{a}は、三日月刀で{t}に切りかかった！', anim: 'slash_fast',
    desc: '三日月刀で、1人に切りかかる。',
  },
  m_ar2_sand: {
    name: '砂かけ', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [26, 34], thr: 99, status: { status: 'blind', chance: 0.2, turns: [2, 3] } },
    cast: '{a}は、足で砂をけり上げた！', anim: 'sand_spray',
    desc: '砂をけり上げて、敵みんなにダメージ。目をくらませることがある。',
  },
  m_ar2_signal: {
    name: '三兄弟の合図', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_ar2_combo' }, cast: '{a}が、ピーッと口笛をふいた！\n三兄弟が、ぐるりとまわりをかこんでくる…！', anim: 'charge',
    desc: '次の番に、三兄弟の合体技。兄弟を先にたおすと弱くなる。',
  },
  m_ar2_combo: {
    name: '砂嵐トライアングル', kind: 'monster', target: 'enemies',
    effect: { type: 'arCombo', mult: 1.45, ignoreDef: 0.2 }, cast: '三兄弟の合体技、砂嵐トライアングル！\n3つの三日月刀が、砂嵐のようにうずをまく！', anim: 'hit_all',
    desc: '三兄弟の合体技。敵みんなに大ダメージ。生きている兄弟が少ないほど弱くなり、1人だけでは出せない。',
  },

  // ───── ランク3の 王者: ランプの大魔人（光っている 間は 呪文を はね返す）─────
  m_ar3_blaze: {
    name: '魔人のほのお', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [44, 56], thr: 99 }, cast: '{a}は、ランプのけむりから、ほのおのうずをふき出した！', anim: 'fire_wave',
    desc: 'ほのおのうずで、敵みんなにダメージ。',
  },
  m_ar3_fist: {
    name: '魔人のげんこつ', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.55 }, cast: '{a}は、大きなげんこつを、{t}にふり下ろした！', anim: 'tackle',
    desc: '大きなげんこつで、1人に大ダメージ。',
  },
  m_ar3_glow: {
    name: '魔人の光', kind: 'monster', target: 'self',
    effect: { type: 'reflect', kind: 'glow' }, cast: '{a}の体が、金色にまぶしく光り始めた！', anim: 'mirror_glow',
    desc: '体が金色に光る。次の番まで、呪文をはね返す。',
  },
  m_ar3_lamp_fire: {
    name: 'ランプのほのお', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'magic', element: 'fire', base: [40, 50], thr: 99 }, cast: '{a}は、小さなほのおを、{t}にとばした！', anim: 'fire1',
    desc: 'ほのおで、1人にダメージ。',
  },
  m_ar3_lamp_heal: {
    name: 'ランプのいやし', kind: 'monster', mp: 6, target: 'ally',
    effect: { type: 'heal', base: [140, 170] }, cast: '{a}は、やさしい光で、{t}をつつんだ！', anim: 'heal1',
    desc: '仲間1人のHPを回復する。',
  },

  // ───── ランク4の 王者: 太陽の剣士ソルと 月の剣士ルナ（片方を たおすと、もう片方が よみがえりの まい）─────
  m_ar4_sun_slash: {
    name: '太陽切り', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.45, element: 'fire' }, cast: '{a}の剣が、太陽のようにかがやいた！\n{t}に切りかかる！', anim: 'slash_heavy',
    desc: 'ほのおの剣で、1人に切りかかる。',
  },
  m_ar4_moon_slash: {
    name: '月光切り', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 0.8, hits: 2 }, cast: '{a}の剣が、月の光のように青く光った！\n{t}に2回切りかかる！', anim: 'slash_fast',
    desc: 'すばやい2回切り。',
  },
  m_ar4_twin: {
    name: 'ツインクロス', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 0.75 }, cast: '{a}は、剣で大きな十字をえがいた！', anim: 'hit_all',
    desc: '十字の剣のあとで、敵みんなにダメージ。',
  },
  m_ar4_sun_dance: {
    name: 'よみがえりのまい', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_ar4_sun_revive', chant: 0.12, windup: 40 }, cast: '{a}は、たおれた月の剣士のそばで、よみがえりのまいをおどり始めた…！', anim: 'charge',
    desc: '次の番に、たおれたルナを生き返らせる。大きなダメージで止められる。',
  },
  m_ar4_sun_revive: {
    name: 'よみがえりのまい', kind: 'monster', target: 'self',
    effect: { type: 'reviveAll', species: 'ar_moon', hpRatio: 0.5 }, cast: '{a}のまいが、太陽の光をよんだ！', anim: 'revive',
    desc: 'たおれたルナを生き返らせる。',
  },
  m_ar4_moon_dance: {
    name: 'よみがえりのまい', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_ar4_moon_revive', chant: 0.12, windup: 40 }, cast: '{a}は、たおれた太陽の剣士のそばで、よみがえりのまいをおどり始めた…！', anim: 'charge',
    desc: '次の番に、たおれたソルを生き返らせる。大きなダメージで止められる。',
  },
  m_ar4_moon_revive: {
    name: 'よみがえりのまい', kind: 'monster', target: 'self',
    effect: { type: 'reviveAll', species: 'ar_sun', hpRatio: 0.5 }, cast: '{a}のまいが、月の光をよんだ！', anim: 'revive',
    desc: 'たおれたソルを生き返らせる。',
  },

  // ───── ランク5の 王者: 闘技場の王者ガルム（2だんの 前ぶれ → 敵みんなに とても 大きい 一撃）─────
  m_ar5_slash: {
    name: '王者の大剣', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.5 }, cast: '{a}は、大剣を{t}にたたきつけた！', anim: 'slash_heavy',
    desc: '大剣で、1人に大ダメージ。',
  },
  m_ar5_sweep: {
    name: 'なぎはらい', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 0.78 }, cast: '{a}は、大剣を大きくふり回した！', anim: 'hit_all',
    desc: '大剣で、敵みんなをなぎはらう。',
  },
  m_ar5_roar: {
    name: '王者のおたけび', kind: 'monster', target: 'enemies',
    effect: { type: 'debuff', stat: 'def', mult: 0.8, dur: 20, chance: 0.7 }, cast: '{a}は、闘技場がふるえるほどの、おたけびを上げた！', anim: 'warcry',
    desc: 'おたけびで、敵みんなの守備力を下げる。',
  },
  m_ar5_raise: {
    name: '王者のかまえ', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_ar5_gather' }, cast: '{a}は、大剣を、まっすぐ天にかかげた…！', anim: 'charge',
    desc: '大技のかまえ（1つめの前ぶれ）。',
  },
  m_ar5_gather: {
    name: '王者の気', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_ar5_finish' }, cast: '{a}の大剣に、王者の気が、どんどん集まり始めた…！！\n（次は大技だ！身を守ろう！）', anim: 'charge',
    desc: '大技のかまえ（2つめの前ぶれ）。次の番に「王者の一撃」。',
  },
  m_ar5_finish: {
    name: '王者の一撃', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 1.55, ignoreDef: 0.3 }, cast: '{a}の、王者の一撃！！\n大剣から、金色の光のうずが走った！', anim: 'slash_heavy',
    desc: '王者の大技。敵みんなに、とても大きなダメージ。身を守ると半分になる。',
  },

  // ───── ランク6（伝説の部）の 王者: 砂ザメの王（砂に もぐる → とび出す）─────
  m_ar6_bite: {
    name: '王のかみつき', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.6, acc: 0.95 }, cast: '{a}は、大きな口で{t}にかみついた！', anim: 'bite',
    desc: '大きな口で、1人にかみつく。',
  },
  m_ar6_fin: {
    name: 'せびれ回転', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 0.72 }, cast: '{a}は、砂の上で、くるりと大きく回った！\nするどいせびれが、みんなを切りさく！', anim: 'hit_all',
    desc: 'せびれで、敵みんなを切りさく。',
  },
  m_ar6_dive: {
    name: '砂にもぐる', kind: 'monster', target: 'self',
    effect: { type: 'burrow', next: 'm_ar6_jump' }, cast: '{a}は、闘技場の砂の中に、しずかにもぐった…！', anim: 'burrow',
    desc: '砂の中にもぐる。次の番まで、攻撃がとどかない。砂がもり上がったら、大ジャンプが来る。',
  },
  m_ar6_jump: {
    name: '王の大ジャンプ', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 1.7, ignoreDef: 0.3 }, cast: '{a}が、砂の中から飛び出した！\n大きな体が、闘技場の空から落ちてくる！', anim: 'whale_jump',
    desc: '砂の中から飛び出して、敵みんなの上に落ちてくる。とても大きなダメージ。身を守ると半分になる。',
  },

  // ───── ランク7（伝説の部）の 王者: 七色の魔導王（属性の よろい・同じ 属性は すいこむ）─────
  m_ar7_armor: {
    name: '七色のよろい', kind: 'monster', target: 'self',
    effect: { type: 'arArmor' }, cast: '{a}は、つえを高くかかげた！', anim: 'buff',
    desc: '炎・氷・雷・風のどれかのよろいをまとう。同じ属性の攻撃はすいこんで回復し、弱点の属性でくだける。',
  },
  m_ar7_spell: {
    name: 'よろいの大呪文', kind: 'monster', mp: 10, target: 'enemies',
    effect: { type: 'arSpell', base: [70, 86], thr: 99 }, cast: '{a}は、よろいの力を、大きな呪文にかえた！', anim: 'blast2',
    desc: 'まとっているよろいと同じ属性の呪文で、敵みんなにダメージ。',
  },
  m_ar7_bolt: {
    name: '七色の光線', kind: 'monster', mp: 6, target: 'enemy',
    effect: { type: 'magic', element: 'light', base: [130, 150], thr: 99 }, cast: '{a}のつえから、七色の光線が{t}に走った！', anim: 'mirror_beam',
    desc: '七色の光線で、1人に大ダメージ。',
  },
  m_ar7_charge: {
    name: 'にじの前ぶれ', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_ar7_rainbow' }, cast: '{a}のまわりに、七色の光が集まり始めた…！\n（次は大技だ！身を守ろう！）', anim: 'charge',
    desc: '次の番に「にじのさばき」。身を守ろう。',
  },
  m_ar7_rainbow: {
    name: 'にじのさばき', kind: 'monster', target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [190, 220], thr: 99 }, cast: '{a}の、にじのさばき！\n七色の光の柱が、闘技場じゅうにふりそそぐ！', anim: 'blast2',
    desc: '七色の光の柱で、敵みんなにとても大きなダメージ。身を守ると少し弱くなる。',
  },

  // ───── ランク8（伝説の部）の 王者: 伝説のチャンピオン レオーネと 2人の 弟子（合図 → 3人の 合体技）─────
  m_ar8_slash: {
    name: '伝説の剣', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.55 }, cast: '{a}の剣が、{t}に、光のように走った！', anim: 'slash_heavy',
    desc: '光のような剣で、1人に大ダメージ。',
  },
  m_ar8_wave: {
    name: '剣の大波', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 0.82 }, cast: '{a}は、剣で大きな波をえがいた！', anim: 'hit_all',
    desc: '剣の大波で、敵みんなにダメージ。',
  },
  m_ar8_signal: {
    name: '王者たちの合図', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_ar8_combo' }, cast: '{a}が、剣を高くかかげた！\n「行くぞ、2人とも！」…弟子たちが、同じかまえをとった！', anim: 'charge',
    desc: '次の番に、3人の合体技。弟子を先にたおすと弱くなる。',
  },
  m_ar8_combo: {
    name: 'レジェンド・トリニティ', kind: 'monster', target: 'enemies',
    effect: { type: 'arCombo', mult: 1.9, ignoreDef: 0.3 }, cast: '3人の合体技、レジェンド・トリニティ！！\n3つの光が1つになって、闘技場をつらぬいた！', anim: 'slash_heavy',
    desc: '伝説の3人の合体技。敵みんなに、とても大きなダメージ。生きている弟子が少ないほど弱くなり、1人だけでは出せない。',
  },
  m_ar8_fist: {
    name: '弟子のれんだ', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 0.62, hits: 3 }, cast: '{a}は、{t}に、すばやいれんだをくり出した！', anim: 'punch',
    desc: 'すばやい3回のれんだ。',
  },
  m_ar8_cheer: {
    name: '弟子のおうえん', kind: 'monster', target: 'ally',
    effect: { type: 'heal', base: [700, 820] }, cast: '{a}は、{t}をはげました！\n「先生、まだまだ！」', anim: 'heal1',
    desc: '仲間1人のHPを回復する。',
  },
  m_ar8_guard: {
    name: '弟子のかまえ', kind: 'monster', target: 'allies',
    effect: { type: 'buff', stat: 'def', mult: 1.25, dur: 25 }, cast: '{a}は、たてをかまえて、みんなの前に立った！', anim: 'guard',
    desc: '仲間みんなの守備力を上げる。',
  },

  // ───── 第65回 C: ランク9（伝説の部）の 王者: 炎と氷の竜きょうだい（ふたご。息を すったら ブレス・片方を たおすと よびもどしの 声）─────
  m_ar9_fire_claw: {
    name: '炎のツメ', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.45, element: 'fire' }, cast: '{a}は、まっかにもえるツメで、{t}を引きさいた！', anim: 'slash_heavy',
    desc: 'もえるツメで、1人に切りかかる。',
  },
  m_ar9_ice_claw: {
    name: '氷のツメ', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 0.8, hits: 2, element: 'ice' }, cast: '{a}は、こおりのツメで、{t}に2回切りかかった！', anim: 'slash_fast',
    desc: 'こおりのツメで、すばやく2回切りかかる。',
  },
  m_ar9_tail: {
    name: '竜のしっぽ', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 0.72 }, cast: '{a}は、大きなしっぽを、ぶうんとふり回した！', anim: 'hit_all',
    desc: 'しっぽで、敵みんなをなぎはらう。',
  },
  m_ar9_fire_inhale: {
    name: '炎の前ぶれ', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_ar9_fire_blast' }, cast: '{a}は、むねいっぱいに、大きく息をすいこんだ…！\n（口のおくが、まっかに光っている！）', anim: 'charge',
    desc: '次の番に「ほのおの大ブレス」。身を守ろう。',
  },
  m_ar9_fire_blast: {
    name: 'ほのおの大ブレス', kind: 'monster', target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [195, 215], thr: 99 }, cast: '{a}の、ほのおの大ブレス！\n闘技場が、まっかな炎につつまれた！', anim: 'fire_wave',
    desc: '炎のブレスで、敵みんなにとても大きなダメージ。身を守ると少し弱くなる。',
  },
  m_ar9_ice_inhale: {
    name: '氷の前ぶれ', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_ar9_ice_blast' }, cast: '{a}は、むねいっぱいに、大きく息をすいこんだ…！\n（まわりの空気が、きんきんにひえていく！）', anim: 'charge',
    desc: '次の番に「こおりの大ブレス」。身を守ろう。',
  },
  m_ar9_ice_blast: {
    name: 'こおりの大ブレス', kind: 'monster', target: 'enemies',
    effect: { type: 'magic', element: 'ice', base: [195, 215], thr: 99 }, cast: '{a}の、こおりの大ブレス！\n闘技場が、まっ白なふぶきにつつまれた！', anim: 'blizzard',
    desc: '氷のブレスで、敵みんなにとても大きなダメージ。身を守ると少し弱くなる。',
  },
  m_ar9_fire_call: {
    name: 'よびもどしの声', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_ar9_fire_revive', chant: 0.12, windup: 40 }, cast: '{a}は、たおれた氷の竜にむかって、大きな声でよびかけ始めた…！', anim: 'charge',
    desc: '次の番に、たおれた氷の竜を生き返らせる。大きなダメージで止められる。',
  },
  m_ar9_fire_revive: {
    name: 'よびもどしの声', kind: 'monster', target: 'self',
    effect: { type: 'reviveAll', species: 'ar_ice_drake', hpRatio: 0.3 }, cast: '{a}の声が、闘技場にひびきわたった！', anim: 'revive',
    desc: 'たおれた氷の竜を生き返らせる。',
  },
  m_ar9_ice_call: {
    name: 'よびもどしの声', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_ar9_ice_revive', chant: 0.12, windup: 40 }, cast: '{a}は、たおれた炎の竜にむかって、大きな声でよびかけ始めた…！', anim: 'charge',
    desc: '次の番に、たおれた炎の竜を生き返らせる。大きなダメージで止められる。',
  },
  m_ar9_ice_revive: {
    name: 'よびもどしの声', kind: 'monster', target: 'self',
    effect: { type: 'reviveAll', species: 'ar_fire_drake', hpRatio: 0.3 }, cast: '{a}の声が、闘技場にひびきわたった！', anim: 'revive',
    desc: 'たおれた炎の竜を生き返らせる。',
  },

  // ───── 第65回 C: ランク10（伝説の部）の 王者: 星の大王者レグルスと ひこ星のアルタ・おり姫のベガ
  //   （属性の よろい〈ランク7と おなじ しくみ〉と 3人の 合体技〈ランク8と おなじ しくみ〉）─────
  m_ar10_armor: {
    name: '星のよろい', kind: 'monster', target: 'self',
    effect: { type: 'arArmor' }, cast: '{a}は、星空にむかって、高くほえた！', anim: 'buff',
    desc: '炎・氷・雷・風のどれかのよろいをまとう。同じ属性の攻撃はすいこんで回復し、弱点の属性でくだける。',
  },
  m_ar10_claw: {
    name: '大王者のツメ', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.5 }, cast: '{a}は、金色のツメで、{t}を打ちすえた！', anim: 'slash_heavy',
    desc: '金色のツメで、1人に大ダメージ。',
  },
  m_ar10_roar: {
    name: '星をゆらすおたけび', kind: 'monster', target: 'enemies',
    effect: { type: 'debuff', stat: 'def', mult: 0.8, dur: 20, chance: 0.6 }, cast: '{a}は、星がゆれるほどの、大きなおたけびを上げた！', anim: 'warcry',
    desc: 'おたけびで、敵みんなの守備力を下げる。',
  },
  m_ar10_spell: {
    name: '星のよろいの大呪文', kind: 'monster', mp: 10, target: 'enemies',
    effect: { type: 'arSpell', base: [155, 175], thr: 99 }, cast: '{a}は、よろいの力を、星の大呪文にかえた！', anim: 'blast2',
    desc: 'まとっているよろいと同じ属性の呪文で、敵みんなにダメージ。',
  },
  m_ar10_signal: {
    name: '大三角の合図', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_ar10_combo' }, cast: '{a}が、夜空にむかって、たてがみをかがやかせた！\n「アルタ、ベガ、行くぞ！」…3つの星が、三角形にならんだ！', anim: 'charge',
    desc: '次の番に、3人の合体技。アルタとベガを先にたおすと弱くなる。',
  },
  m_ar10_combo: {
    name: 'ほしぞらトライアングル', kind: 'monster', target: 'enemies',
    effect: { type: 'arCombo', mult: 1.75, ignoreDef: 0.3 }, cast: '3人の合体技、ほしぞらトライアングル！！\n3つの星の光が、闘技場の空から落ちてくる！', anim: 'slash_heavy',
    desc: '3人の合体技。敵みんなに、とても大きなダメージ。生きている仲間が少ないほど弱くなり、1人だけでは出せない。',
  },
  m_ar10_dive: {
    name: 'ひこ星のきゅうこうか', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 0.62, hits: 3 }, cast: '{a}は、空の上から、{t}にむかって3回つっこんできた！', anim: 'tackle',
    desc: '空からつっこんで、1人に3回攻撃する。',
  },
  m_ar10_gale: {
    name: '天の川の風', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', element: 'wind', base: [120, 140], thr: 99 }, cast: '{a}は、大きなつばさで、天の川の風をおこした！', anim: 'wind2',
    desc: '風で、敵みんなにダメージ。',
  },
  m_ar10_song: {
    name: 'おり姫の歌', kind: 'monster', mp: 8, target: 'ally',
    effect: { type: 'heal', base: [900, 1000] }, cast: '{a}は、やさしい歌で、{t}をつつんだ！\n「まだまだ、がんばって！」', anim: 'heal1',
    desc: '仲間1人のHPを回復する。',
  },
  m_ar10_veil: {
    name: '星のベール', kind: 'monster', target: 'allies',
    effect: { type: 'buff', stat: 'def', mult: 1.25, dur: 25 }, cast: '{a}は、星の光をおって、みんなにかけた！', anim: 'guard',
    desc: '仲間みんなの守備力を上げる。',
  },

  // ───── 第68回 C: ランク11（伝説の部）の 王者: 白銀の大王者ボレアスと 雪だるまのコロン・雪の子チララ
  //   （こおる・とける。こおりを とかす・こおらせるは battle-arena.js の arFreeze と ダメージの しかけ）─────
  m_ar11_claw: {
    name: '白銀のツメ', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.5, element: 'ice' }, cast: '{a}は、こおりのツメで、{t}を打ちすえた！', anim: 'slash_heavy',
    desc: 'こおりのツメで、1人に大ダメージ。',
  },
  m_ar11_icicle: {
    name: 'つららおとし', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 0.72, element: 'ice' }, cast: '{a}が足をふみならすと、天井から大きなつららがふってきた！', anim: 'hit_all',
    desc: 'つららを落として、敵みんなにダメージ。',
  },
  m_ar11_inhale: {
    name: 'ふぶきの前ぶれ', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_ar11_blizzard' }, cast: '{a}は、こおった体で、むねいっぱいに息をすいこんだ…！\n（まわりに、雪がうずをまき始めた！）', anim: 'charge',
    desc: '次の番に「ぜったいれいどの大ふぶき」。身を守ろう。炎でこおりをとかすと止まる。',
  },
  m_ar11_blizzard: {
    name: 'ぜったいれいどの大ふぶき', kind: 'monster', target: 'enemies',
    effect: { type: 'magic', element: 'ice', base: [210, 230], thr: 99 }, cast: '{a}の、ぜったいれいどの大ふぶき！\n闘技場が、まっ白にこおりついた！', anim: 'blizzard',
    desc: '大ふぶきで、敵みんなにとても大きなダメージ。身を守ると少し弱くなる。',
  },
  m_ar11_refreeze: {
    name: 'こおりのよろい', kind: 'monster', target: 'self',
    effect: { type: 'arFreeze' }, cast: '{a}は、北の風を体いっぱいにあびた！', anim: 'buff',
    desc: 'とけた体を、またこおらせる。こおった体には、炎いがいはほとんど効かない。',
  },
  m_ar11_snow_breath: {
    name: 'つめたいいき', kind: 'monster', target: 'self',
    effect: { type: 'arFreeze' }, cast: '{a}は、大王者のそばにかけよった！', anim: 'buff',
    desc: 'とけた大王者を、またこおらせる。',
  },
  m_ar11_snowball: {
    name: '大雪玉', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.3, element: 'ice' }, cast: '{a}は、大きな雪玉を、{t}にむかって転がした！', anim: 'tackle',
    desc: '大きな雪玉で、1人にダメージ。',
  },
  m_ar11_snowdance: {
    name: '雪のまい', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'magic', element: 'ice', base: [120, 140], thr: 99 }, cast: '{a}は、くるくるまって、雪をふらせた！', anim: 'blizzard',
    desc: '雪をふらせて、敵みんなにダメージ。',
  },

  // ───── 第74回 C: ランク12（伝説の部）の 王者: 深海の大王者リヴァイアスと あわふきガニのブクブ・光クラゲのポワン
  //   （あわの よろい。あわが はじける・まとい直すは battle-arena.js の arBubble と ダメージの しかけ）─────
  m_ar12_fang: {
    name: '深海のキバ', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.5, element: 'water' }, cast: '{a}は、大きなキバで、{t}にかみついた！', anim: 'bite',
    desc: '大きなキバで、1人に大ダメージ。',
  },
  m_ar12_wave: {
    name: '大波', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 0.72, element: 'water' }, cast: '{a}が、しっぽで水面をたたくと、大きな波がおしよせた！', anim: 'hit_all',
    desc: '大きな波で、敵みんなにダメージ。',
  },
  m_ar12_inhale: {
    name: '大うずの前ぶれ', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_ar12_maelstrom' }, cast: '{a}は、あわの中で、ぐるぐると回り始めた…！\n（闘技場の水が、大きくうずをまき始めた！）', anim: 'charge',
    desc: '次の番に「深海の大うずしお」。身を守ろう。',
  },
  m_ar12_maelstrom: {
    name: '深海の大うずしお', kind: 'monster', target: 'enemies',
    effect: { type: 'magic', element: 'water', base: [280, 300], thr: 99 }, cast: '{a}の、深海の大うずしお！\n闘技場が、まるごと大きなうずにのみこまれた！', anim: 'whirlpool',
    desc: '大うずしおで、敵みんなにとても大きなダメージ。身を守ると少し弱くなる。',
  },
  m_ar12_rebubble: {
    name: 'あわのよろい', kind: 'monster', target: 'self',
    effect: { type: 'arBubble' }, cast: '{a}は、口から大きなあわを、ぶくぶくとふきだした！', anim: 'buff',
    desc: 'あわのよろいをまとい直す。あわは、どんな攻撃でも1回当たると1つはじける。',
  },
  m_ar12_scissors: {
    name: '大バサミ', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.35 }, cast: '{a}は、大きなハサミで、{t}をはさみこんだ！', anim: 'slash_heavy',
    desc: '大きなハサミで、1人にダメージ。',
  },
  m_ar12_spray: {
    name: 'あわのしぶき', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'magic', element: 'water', base: [115, 135], thr: 99 }, cast: '{a}は、あわを、いきおいよくふきつけた！', anim: 'hit_all',
    desc: 'あわをふきつけて、敵みんなにダメージ。',
  },
  m_ar12_heal: {
    name: 'やさしい光', kind: 'monster', mp: 8, target: 'ally',
    effect: { type: 'heal', base: [1000, 1150] }, cast: '{a}の体が、やさしく光って、{t}をつつんだ！', anim: 'heal1',
    desc: '仲間1人のHPを回復する。',
  },
  m_ar12_sting: {
    name: 'しびれのしょくしゅ', kind: 'monster', target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 1.1 }, { type: 'status', status: 'paralyze', chance: 0.2, turns: [1, 1] }] }, cast: '{a}は、ながいしょくしゅで、{t}をぴしゃりと打った！', anim: 'tackle',
    desc: 'しょくしゅで、1人にダメージ。動けなくすることがある。',
  },

  // ───── 第80回 C: ランク13（伝説の部）の 王者: 時の大王者クロノガルドと 時計の騎士チクタク・砂時計の精サラリ
  //   （時の まきもどし。砂時計を さかさまに する・まきもどすは battle-arena.js の arFlip・arRewind）─────
  m_ar13_hands: {
    name: '時計の針', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.5 }, cast: '{a}は、大きな時計の針で、{t}をつきさした！', anim: 'slash_heavy',
    desc: '大きな時計の針で、1人に大ダメージ。',
  },
  m_ar13_gears: {
    name: '歯車のあらし', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 0.72 }, cast: '{a}の体から、たくさんの歯車がとび出した！', anim: 'hit_all',
    desc: '歯車をとばして、敵みんなにダメージ。',
  },
  m_ar13_flip: {
    name: '砂時計がえし', kind: 'monster', target: 'self',
    effect: { type: 'arFlip' }, cast: '{a}は、大きな砂時計を、くるりとさかさまにした！', anim: 'buff',
    desc: '次の番までに受けたダメージを、まきもどす。その間にダメージを受けないと、時がゆがむ。',
  },
  m_ar13_rewind: {
    name: '時のまきもどし', kind: 'monster', target: 'self',
    effect: { type: 'arRewind' }, cast: '{a}の砂時計の砂が、さかさまに流れ始めた…！', anim: 'heal1',
    desc: '砂時計をさかさまにしてから受けたダメージを、まきもどす。',
  },
  m_ar13_inhale: {
    name: '時のあらしの前ぶれ', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_ar13_storm' }, cast: '{a}の歯車が、ものすごい速さで回り始めた…！\n（闘技場の時計が、ぐるぐると回り出した！）', anim: 'charge',
    desc: '次の番に「時のはざまの大あらし」。身を守ろう。',
  },
  m_ar13_storm: {
    name: '時のはざまの大あらし', kind: 'monster', target: 'enemies',
    effect: { type: 'magic', element: 'wind', base: [250, 270], thr: 99 }, cast: '{a}の、時のはざまの大あらし！\n闘技場に、いくつもの時代の風がふきあれた！', anim: 'blizzard',
    desc: '時のあらしで、敵みんなにとても大きなダメージ。身を守ると少し弱くなる。',
  },
  m_ar13_slash: {
    name: '秒針ぎり', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.35 }, cast: '{a}は、秒針の剣で、{t}にすばやく切りかかった！', anim: 'slash_heavy',
    desc: '秒針の剣で、1人にダメージ。',
  },
  m_ar13_guard: {
    name: '時計のたて', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.25, dur: 25 }, cast: '{a}は、時計の文字ばんのたてを、かまえた！', anim: 'guard',
    desc: '守りを上げる。',
  },
  m_ar13_sand: {
    name: '時の砂', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'magic', element: 'wind', base: [125, 145], thr: 99 }, cast: '{a}は、時の砂を、いきおいよくふきつけた！', anim: 'hit_all',
    desc: '時の砂をふきつけて、敵みんなにダメージ。',
  },
  m_ar13_sleep: {
    name: 'ねむりの砂', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.25, turns: [1, 2] }, cast: '{a}は、ねむりの砂を、さらさらとまいた！', anim: 'sleep',
    desc: '敵みんなを、ねむらせることがある。',
  },
};
