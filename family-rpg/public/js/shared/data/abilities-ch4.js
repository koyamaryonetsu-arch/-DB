// 第4章「砂の海にしずむ星」の モンスターの 技（abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
export const CH4_ABILITIES = {
  // ── 砂ばく・海辺 ──
  m_sand_throw: {
    name: '砂かけ', kind: 'monster', mp: 2, target: 'enemies',
    effect: { type: 'status', status: 'blind', chance: 0.3, turns: [2, 3] }, cast: '{a}はかわいた砂をまき上げた！', anim: 'breath',
    desc: '砂をまき上げて、敵みんなの目をくらませることがある。',
  },
  m_sand_call: {
    name: '仲間を呼ぶ', kind: 'monster', target: 'self',
    effect: { type: 'callHelp', species: 'sand_slime' }, cast: '{a}は砂の中から仲間を呼んだ！', anim: 'none',
  },
  m_poison_sting: {
    name: '毒ばり', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.1, status: { status: 'poison', chance: 0.45 } }, cast: '{a}はしっぽの毒ばりをつき立てた！', anim: 'hit',
    desc: 'しっぽの毒ばりでさす。毒にすることがある。',
  },
  m_scissor_combo: {
    name: 'はさみうち', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 0.85, hits: 2 }, cast: '{a}は2本のはさみで、はさみうちにした！', anim: 'slash_fast',
    desc: '2本のはさみで、2回続けて切りつける。',
  },
  m_double_peck: {
    name: '2回つつく', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 0.8, hits: 2 }, cast: '{a}はするどいくちばしで、2回つついてきた！', anim: 'slash_fast',
    desc: 'くちばしで2回続けてつつく。',
  },
  m_vulture_dive: {
    name: '急降下', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.6, acc: 0.8 }, cast: '{a}は空高くまい上がり、急降下してきた！', anim: 'tackle',
    desc: '空から急降下して体当たりする。当たると大きいが、よけやすい。',
  },
  m_sweet_scent: {
    name: 'あまい香り', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'confuse', chance: 0.25, turns: [1, 2] }, cast: '{a}はあまい香りをふりまいた！', anim: 'breath',
    desc: 'あまい香りで、敵みんなを混乱させることがある。',
  },
  m_mirage_pollen: {
    name: 'まぼろしの花粉', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'status', status: 'blind', chance: 0.5, turns: [2, 3] }, cast: '{a}は{t}に、きらきら光る花粉をふきかけた！', anim: 'debuff',
    desc: '光る花粉で、目をくらませることがある。',
  },
  m_root_drain: {
    name: '根っこで吸う', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'drainHp', mult: 0.9 }, cast: '{a}は根っこをのばして、{t}の力を吸い取った！', anim: 'hit',
    desc: '根っこで敵の力を吸い取って、自分のHPを回復する。',
  },
  // ── 夜の 砂ばく ──
  m_moon_beam: {
    name: '月の光線', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', element: 'dark', base: [40, 52], thr: 99 }, cast: '{a}は青白い月の光を、あびせてきた！', anim: 'dark1',
    desc: '冷たい月の光で、敵みんなに闇のダメージ。',
  },
  m_soul_sip: {
    name: '冷たい手', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'drainMp', amount: [8, 14] }, cast: '{a}の冷たい手が、{t}にふれた！', anim: 'dark1',
    desc: '冷たい手でふれて、MPを吸い取る。',
  },
  m_ghost_fade: {
    name: 'すけていく', kind: 'monster', mp: 3, target: 'self',
    effect: { type: 'buff', stat: 'eva', add: 0.3, dur: 30 }, cast: '{a}の体が、月の光にすけていく…！', anim: 'buff',
    desc: '体がすけて、しばらく攻撃がすりぬけやすくなる。',
  },
  // ── 反撃の構え（Step 2）: つぎの 自分の 番まで、物理で こうげきして きた 相手に やりかえす（battle.js の stance）──
  m_claw_stance: {
    name: '反撃の構え', kind: 'monster', target: 'self',
    effect: { type: 'stance', stance: 'counter', mult: 2.6, ignoreDef: 0.35 }, cast: '{a}は、はさみを大きくひらいた！', anim: 'guard',
    desc: 'はさみを大きくひらいて、反撃の構え。次の番まで、物理で攻撃してきた相手に反撃する。',
  },
  m_claw_guard: {
    name: '反撃の構え', kind: 'monster', target: 'self',
    effect: { type: 'stance', stance: 'counter', mult: 1.1 }, cast: '{a}は、はさみをかまえた！', anim: 'guard',
    desc: 'はさみをかまえて、反撃の構え。次の番まで、物理で攻撃してきた相手に反撃する。',
  },
  m_poison_tail: {
    name: '毒のしっぽ', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'phys', mult: 0.7, status: { status: 'poison', chance: 0.5 } }, cast: '{a}は、毒のしっぽを大きくふり回した！', anim: 'hit_all',
    desc: '毒のしっぽをふり回して、敵みんなを攻撃する。毒にすることがある。',
  },
  // ── かれた地下水路 ──
  m_tongue_sip: {
    name: '長い舌', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'drainMp', amount: [10, 16] }, cast: '{a}は長い舌をのばして、{t}をぺろりとなめた！', anim: 'hit',
    desc: '長い舌でなめて、MPを吸い取る。',
  },
  m_frog_jump: {
    name: 'とびかかる', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.35, acc: 0.9 }, cast: '{a}は高くとび上がって、{t}にとびかかった！', anim: 'tackle',
    desc: '高くとび上がって、体当たりする。',
  },
  m_dry_croak: {
    name: 'かすれた鳴き声', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'status', status: 'silence', chance: 0.25, turns: [2, 3] }, cast: '{a}は、かすれた声で「ゲロロ…」と鳴いた！', anim: 'debuff',
    desc: 'かすれた鳴き声で、敵みんなの呪文をふうじることがある。',
  },
  // ── 王家のピラミッド（Step 4）──
  m_mummy_bandage: {
    name: 'のろいのほうたい', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 0.9, status: { status: 'paralyze', chance: 0.18, turns: [1, 2] } }, cast: '{a}は、のろいのほうたいを{t}にまきつけた！', anim: 'hit',
    desc: 'のろいのほうたいをまきつける。体がしびれて、動けなくなることがある。',
  },
  m_mummy_grab: {
    name: 'しがみつく', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.25, acc: 0.9 }, cast: '{a}は、{t}にしがみついてきた！', anim: 'tackle',
    desc: 'しがみついて、しめつける。',
  },
  m_pot_suck: {
    name: 'MPをすいこむ', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'drainMp', amount: [16, 24] }, cast: '{a}は、つぼの口から、{t}の力をすいこんだ！', anim: 'dark1',
    desc: 'つぼの口から、MPをすいこむ。',
  },
  m_pot_spin: {
    name: 'ぐるぐる体当たり', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.3, acc: 0.9 }, cast: '{a}は、ぐるぐる回りながら、体当たりしてきた！', anim: 'tackle',
    desc: 'ぐるぐる回りながら、体当たりする。',
  },
  m_pot_smoke: {
    name: 'のろいのけむり', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'status', status: 'blind', chance: 0.25, turns: [2, 3] }, cast: '{a}の口から、黒いけむりがもくもくと出てきた！', anim: 'breath',
    desc: '黒いけむりで、敵みんなの目をくらませることがある。',
  },
  m_golem_windup: {
    name: 'ふりかぶる', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_golem_slam' }, cast: '{a}は、岩のうでを大きくふりかぶった！', anim: 'charge',
    desc: '岩のうでを大きくふりかぶる。次の番に、大ぶりの一撃。',
  },
  m_golem_slam: {
    name: '大ぶり', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 2.1, acc: 0.85 }, cast: '{a}は、岩のうでを{t}にふり下ろした！', anim: 'tackle',
    desc: '岩のうでをふり下ろす、大ぶりの一撃。防御で受けよう。',
  },
  m_golem_harden: {
    name: 'かたくなる', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.3, dur: 25 }, cast: '{a}の体の砂岩が、ぎゅっとかたまった！', anim: 'buff',
    desc: '体をかためて、守りを上げる。',
  },
  m_genie_flame: {
    name: '魔人のほのお', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [40, 52], thr: 99 }, cast: '{a}は、ランプのほのおを大きくふき出した！', anim: 'fire2',
    desc: '大きなほのおで、敵みんなに炎のダメージ。',
  },
  m_genie_blaze: {
    name: '魔人の火の玉', kind: 'monster', mp: 6, target: 'enemy',
    effect: { type: 'magic', element: 'fire', base: [70, 86], thr: 99 }, cast: '{a}は、大きな火の玉を{t}になげつけた！', anim: 'fire1',
    desc: '大きな火の玉で、1人に炎のダメージ。',
  },
  m_genie_smoke: {
    name: 'まぼろしのけむり', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'blind', chance: 0.3, turns: [2, 3] }, cast: '{a}のまわりに、むらさきのけむりがひろがった！', anim: 'breath',
    desc: 'まぼろしのけむりで、敵みんなの目をくらませることがある。',
  },
  // ── ミイラの王アンク（Step 4 の ボス）──
  m_anku_staff: {
    name: '王のつえ', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.35 }, cast: '{a}は、金のつえを{t}にふり下ろした！', anim: 'hit',
    desc: '金のつえで、1人を強くたたく。',
  },
  m_anku_hand: {
    name: 'ミイラの手', kind: 'monster', target: 'enemy',
    effect: { type: 'drainMp', amount: [10, 16] }, cast: '{a}のほうたいの手が、{t}の力をすい取った！', anim: 'dark1',
    desc: 'ほうたいの手で、1人のMPをすう。',
  },
  m_anku_curse_charge: {
    name: '王の呪いの前ぶれ', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_anku_curse' }, cast: '{a}の目が、あやしく光り始めた…！\nまわりに、黒いもやがうずをまいている…！', anim: 'charge',
    desc: '次の番に「王の呪い」。毒消し草や、毒をふせぐ物で、そなえよう。',
  },
  m_anku_curse: {
    name: '王の呪い', kind: 'monster', target: 'enemies',
    effect: { type: 'status', status: 'poison', chance: 0.65, quiet: true, also: { status: 'blind', chance: 0.45, turns: [2, 3], quiet: true } },
    cast: '{a}の「王の呪い」！\n黒いもやが、みんなをつつみこんだ！', anim: 'dark1',
    desc: '黒いもやで、敵みんなを毒とマヌーサにすることがある。',
  },
  // よみがえりの呪文（前ぶれ。chant … となえて いる あいだに 最大HPの この わりあいの ダメージで とぎれる）
  m_anku_chant: {
    name: 'よみがえりの呪文', kind: 'monster', target: 'self',
    // chant … 最大HPの 1わりの ダメージで とぎれる。windup … つぎの 番まで ゲージ 65 ぶん ながい（止める じかん）
    effect: { type: 'telegraph', next: 'm_anku_revive', chant: 0.1, windup: 65 }, cast: '{a}は、古い言葉をとなえ始めた…', anim: 'charge',
    desc: '古い言葉をとなえて、たおれたミイラ兵を生き返らせる。となえている間に大きなダメージをあたえると、呪文がとぎれる。',
  },
  m_anku_revive: {
    name: 'よみがえりの呪文', kind: 'monster', target: 'self',
    effect: { type: 'reviveAll', species: 'royal_mummy', hpRatio: 1 }, cast: '{a}の、よみがえりの呪文が、ひびきわたった！', anim: 'dark1',
    desc: 'たおれた王のミイラ兵を、みんな生き返らせる。',
  },
};
