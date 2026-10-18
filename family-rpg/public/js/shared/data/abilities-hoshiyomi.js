// 第5章 Step 5「星読みの里」の まわりと「ノクトの思い出の迷宮」の 魔物と ノクトの影の 技（B: 戦い。abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
// とくべつな こうか（nsMimic … 職業の まね・nsBondBreak … きずなくだき）は shared/battle-nocto.js の noctoEffect
export const HOSHIYOMI_ABILITIES = {
  // ── 星読みの里の まわり ──
  // 黒ずくめの追っ手
  m_agent_shot: {
    name: 'しのびうち', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4, critBonus: 0.08, acc: 0.95 }, cast: '{a}は、音もなく{t}のうしろに回りこんだ！', anim: 'agent_shot',
    desc: '音もなくうしろに回りこんで攻撃する。会心が出やすい。',
  },
  m_agent_smoke: {
    name: '黒いけむり', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'blind', chance: 0.4, turns: [2, 3] }, cast: '{a}は、黒いけむり玉を地面にたたきつけた！', anim: 'agent_smoke',
    desc: '黒いけむりで、敵みんなの目をくらませることがある。',
  },
  m_agent_drug: {
    name: 'あやしいくすり', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'debuff', stat: 'atk', mult: 0.75, dur: 25, chance: 0.85 }, cast: '{a}は、{t}にあやしいくすりをふきかけた！\n体が、小さくなったような気がする…', anim: 'agent_drug',
    desc: 'あやしいくすりで、1人の攻撃力を下げる。',
  },
  // 星読みフクロウ
  m_owl_wind: {
    name: '夜風のはばたき', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'magic', element: 'wind', base: [56, 68], thr: 99 }, cast: '{a}が大きくはばたくと、つめたい夜風がふきあれた！', anim: 'owl_wind',
    desc: '夜風をおこして、敵みんなにダメージ。',
  },
  m_owl_gaze: {
    name: '星のまなざし', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'status', status: 'confuse', chance: 0.45, turns: [1, 2] }, cast: '{a}の大きな目に、星がぐるぐるうずをまいている…', anim: 'owl_gaze',
    desc: '星のまなざしで、1人を混乱させることがある。',
  },
  m_owl_dive: {
    name: 'つかみかかる', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.35, acc: 0.92 }, cast: '{a}は、音もなくまいおりて、{t}につかみかかった！', anim: 'owl_dive',
    desc: 'まいおりて、するどいツメでつかみかかる。',
  },
  // 星くずスライム
  m_stardust_hop: {
    name: '星くずアタック', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.3, element: 'light' }, cast: '{a}は、きらきら光りながら{t}にとびついた！', anim: 'stardust_hop',
    desc: '星くずの光をまとって、とびつく。',
  },
  m_stardust_shine: {
    name: 'きらきらスター', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [52, 64], thr: 99 }, cast: '{a}の体から、星くずがはじけとんだ！', anim: 'stardust_shine',
    desc: '星くずをはじけさせて、敵みんなにダメージ。',
  },

  // ── ノクトの思い出の迷宮 ──
  // さびしさのゆうれい
  m_ghost_tear: {
    name: 'なみだのしずく', kind: 'monster', mp: 5, target: 'enemy',
    effect: { type: 'magic', element: 'ice', base: [100, 118], thr: 99 }, cast: '{a}の目から、つめたいなみだがこぼれおちた…', anim: 'ghost_tear',
    desc: 'こおりのようにつめたいなみだで、1人にダメージ。',
  },
  m_ghost_cling: {
    name: 'ひとりにしないで', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 0.9, debuff: { stat: 'agi', mult: 0.7, dur: 25, chance: 0.85 } }, cast: '{a}は「ひとりにしないで…」と、{t}にしがみついた！', anim: 'ghost_cling',
    desc: 'しがみついて、素早さを下げる。',
  },
  m_ghost_song: {
    name: 'さびしい歌', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.3, turns: [1, 2] }, cast: '{a}は、だれもいない部屋で、さびしい歌を歌った…', anim: 'ghost_song',
    desc: 'さびしい歌で、敵みんなをねむらせることがある。',
  },
  // ひとりぼっちの人形
  m_doll_spin: {
    name: 'くるくるダンス', kind: 'monster', mp: 2, target: 'enemies',
    effect: { type: 'phys', mult: 0.85, hits: 3, random: true }, cast: '{a}は、くるくる回りながら、体当たりしてきた！', anim: 'doll_spin',
    desc: 'くるくる回って、だれかに3回ぶつかる。',
  },
  m_doll_mend: {
    name: 'つぎあて', kind: 'monster', mp: 4, target: 'self',
    effect: { type: 'heal', base: [150, 170], fixed: true }, cast: '{a}は、ほつれた所を自分でぬいあわせた…', anim: 'doll_mend',
    desc: 'ほつれた所をぬいあわせて、HPを回復する。',
  },
  m_doll_stare: {
    name: 'ボタンの目', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'status', status: 'paralyze', chance: 0.3, turns: [1, 1] }, cast: '{a}のボタンの目が、{t}をじっと見つめている…', anim: 'doll_stare',
    desc: 'ボタンの目で見つめて、動けなくすることがある。',
  },
  // かげぼうし
  m_shade_step: {
    name: '影ふみ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.2, status: { status: 'paralyze', chance: 0.2, turns: [1, 1] } }, cast: '{a}は、{t}の影をぎゅっとふんだ！', anim: 'shade_step',
    desc: '影をふんで攻撃する。動けなくすることがある。',
  },
  m_shade_melt: {
    name: '影にとける', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'eva', add: 0.2, dur: 20 }, cast: '{a}の体が、足もとの影にとけていく…', anim: 'shade_melt',
    desc: '影にとけて、攻撃を当たりにくくする。',
  },
  // たましいすい
  m_soul_kiss: {
    name: 'たましいのくちづけ', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'drainHp', mult: 1.3 }, cast: '{a}が、{t}に顔をよせてきた…！\nたましいがすいとられる…！', anim: 'soul_kiss',
    desc: '顔をよせて、HPをすいとる。',
  },
  m_soul_chill: {
    name: 'こおりつくさむけ', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', element: 'ice', base: [48, 58], thr: 99, debuff: { stat: 'agi', mult: 0.8, dur: 20, chance: 0.5 } }, cast: '{a}が近づくと、あたりがこおりつくように、さむくなった…', anim: 'soul_chill',
    desc: 'こおりつくさむけで、敵みんなにダメージ。素早さが下がることがある。',
  },
  m_soul_joy: {
    name: 'しあわせをすう', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'magic', element: 'dark', base: [30, 38], thr: 99 }, { type: 'dispel' }] }, cast: '{a}は、まわりのしあわせな気持ちを、すいとった…', anim: 'soul_joy',
    desc: 'しあわせな気持ちをすいとって、敵みんなの強くなる力を消す。',
  },
  // ひとがたの影
  m_homun_claw: {
    name: 'するどいツメ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.45, ignoreDef: 0.2 }, cast: '{a}の指が、するどいツメにかわった！', anim: 'homun_claw',
    desc: 'するどいツメでさく。守りを少しつらぬく。',
  },
  m_homun_blades: {
    name: '影のやいば', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'phys', mult: 0.7 }, cast: '{a}の足もとから、影のやいばが、いっせいにのびてきた！', anim: 'homun_blades',
    desc: '足もとからのびる影のやいばで、敵みんなを攻撃する。',
  },
  m_homun_stone: {
    name: '赤い石の力', kind: 'monster', mp: 6, target: 'self',
    effect: { type: 'regen', base: [70, 84], fixed: true, dur: 20 }, cast: '{a}のむねの赤い石が、どくんと光った！', anim: 'homun_stone',
    desc: 'むねの赤い石の力で、少しずつHPが回復する。',
  },

  // ── ノクトの影（shared/battle-nocto.js）──
  m_ns_blade: {
    name: '影のつるぎ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.35 }, cast: '{a}は、影でできたつるぎで、{t}に切りかかった！', anim: 'ns_blade',
    desc: '影のつるぎで、1人に切りかかる。',
  },
  m_ns_dark: {
    name: 'ひとりぼっちの闇', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'magic', element: 'dark', base: [112, 132], thr: 99 }, cast: '{a}のまわりから、つめたい闇があふれだした…！', anim: 'ns_dark',
    desc: 'ひとりぼっちの闇で、敵みんなにダメージ。',
  },
  // 職業の まね（だれか 1人の すがたと 職業を まねる。battle-nocto.js の nsMimic）
  m_ns_mimic: {
    name: '影のまね', kind: 'monster', target: 'self',
    effect: { type: 'nsMimic' }, cast: '{a}のすがたが、ゆらりとゆらめいた…', anim: 'ns_mimic',
    desc: 'だれか1人のすがたと職業をまねる。',
  },
  // 前ぶれ「きずなを じっと にらんでいる」→ 次の 番に きずなくだき（合体技を 見ると かならず。windup -30 … 次の 番まで ふつうより 少し 早い）
  m_ns_bond_watch: {
    name: 'きずなくだきの前ぶれ', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_ns_bond_break', windup: -30 }, cast: '{a}は、みんなのきずなを、じっとにらんでいる…！', anim: 'ns_bond_watch',
    desc: '次の番に「きずなくだき」。合体技の仲間のだれかが身を守れば、よやくは守れる。',
  },
  m_ns_bond_break: {
    name: 'きずなくだき', kind: 'monster', target: 'enemies',
    effect: { type: 'nsBondBreak' }, cast: '{a}の、きずなくだき！\nつながろうとする手を、闇がふりはらう！', anim: 'ns_bond_break',
    desc: '敵みんなに大きなダメージ。合体技のよやくをこわす。身を守ると半分になり、よやくも守れる。',
  },
};
