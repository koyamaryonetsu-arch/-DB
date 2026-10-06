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

  // ── 南の砂ばく（Step 5）──
  m_worm_bite: {
    name: 'くらいつく', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.3, acc: 0.95 }, cast: '{a}は、大きな口で{t}にくらいついた！', anim: 'bite',
    desc: '大きな口でくらいつく。',
  },
  // 砂に もぐる（かんたんな 形: 前ぶれ → つぎの 番に 飛び出し。ねらえなく なるのは Step 6 の 砂クジラから）
  m_worm_dive: {
    name: '砂にもぐる', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_worm_burst' }, cast: '{a}は、砂の中にもぐった！\n足もとの砂が、もり上がっていく…！', anim: 'charge',
    desc: '砂の中にもぐる。次の番に、砂の中から飛び出してくる。',
  },
  m_worm_burst: {
    name: '飛び出し', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 2.0, acc: 0.9 }, cast: '{a}が、砂の中から飛び出して、{t}にかみついた！', anim: 'tackle',
    desc: '砂の中から飛び出して、大きくかみつく。防御で受けよう。',
  },
  m_worm_spit: {
    name: '砂はき', kind: 'monster', mp: 2, target: 'enemies',
    effect: { type: 'status', status: 'blind', chance: 0.3, turns: [2, 3] }, cast: '{a}は、口から砂をはき出した！', anim: 'breath',
    desc: '口から砂をはいて、敵みんなの目をくらませることがある。',
  },
  m_spirit_gust: {
    name: '砂つむじ', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', element: 'wind', base: [36, 46], thr: 99 }, cast: '{a}は、ぐるぐる回って、砂つむじをおこした！', anim: 'wind2',
    desc: '砂つむじで、敵みんなに風のダメージ。',
  },
  m_spirit_dust: {
    name: '目つぶし', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'status', status: 'blind', chance: 0.6, turns: [2, 3] }, cast: '{a}は、{t}の顔に、砂をふきつけた！', anim: 'breath',
    desc: '砂をふきつけて、目をくらませる。',
  },
  m_spirit_whirl: {
    name: 'まきこみ', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 0.75, hits: 2 }, cast: '{a}は、{t}をまきこんで、ぐるぐる回った！', anim: 'slash_fast',
    desc: 'まきこんで、2回攻撃する。',
  },
  m_dark_sting: {
    name: 'やみの毒ばり', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.2, status: { status: 'poison', chance: 0.55 } }, cast: '{a}は、黒く光る毒ばりをつき立てた！', anim: 'hit',
    desc: '黒い毒ばりでさす。毒にすることがある。',
  },
  m_dark_stance: {
    name: '反撃の構え', kind: 'monster', target: 'self',
    effect: { type: 'stance', stance: 'counter', mult: 1.8, ignoreDef: 0.2 }, cast: '{a}は、黒いはさみを大きくひらいた！', anim: 'guard',
    desc: '黒いはさみを大きくひらいて、反撃の構え。次の番まで、物理で攻撃してきた相手に反撃する。',
  },

  // ── 大臣ザイード（Step 5 の ボス。まぼろしの分身は battle-ch4.js）──
  m_zaid_sandfire: {
    name: '熱砂の呪文', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [42, 52], thr: 99 }, cast: '{a}は、あやしい呪文をとなえた！\n熱い砂が、うずをまいてふりそそぐ！', anim: 'fire_wave',
    desc: '熱い砂の呪文で、敵みんなに炎のダメージ。',
  },
  m_zaid_sandshot: {
    name: '砂のつぶて', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'magic', base: [72, 86], thr: 99 }, cast: '{a}は、{t}に、かたい砂のつぶてをはなった！', anim: 'quake',
    desc: 'かたい砂のつぶてで、1人にダメージ。',
  },
  m_zaid_whisper: {
    name: 'あやしいささやき', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'status', status: 'confuse', chance: 0.5, turns: [1, 2] }, cast: '{a}は、{t}の耳もとで、あやしくささやいた…！', anim: 'debuff',
    desc: 'あやしいささやきで、混乱させることがある。',
  },
  // まぼろしを 作りなおす（分身が もどり、3人が 入れかわる。battle-ch4.js の mirageRemake）
  m_zaid_mirage: {
    name: 'まぼろしを作る', kind: 'monster', target: 'self',
    effect: { type: 'mirage' }, cast: '{a}は、あやしい呪文をとなえた…！', anim: 'none',
    desc: 'まぼろしの分身を作り出す。3人が、すばやく入れかわる。',
  },
  // 月の鏡の 光で まぶしい 番（battle-ch4.js の mirageAction）
  m_mirage_dazzled: {
    name: 'まぶしい', kind: 'monster', target: 'self',
    effect: { type: 'nothing' }, cast: '{a}は、月の光がまぶしくて、動けない！', anim: 'none',
  },
  // ── 砂の魔神ザイード ──
  m_demon_swing: {
    name: '魔神の大ぶり', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.9, acc: 0.9 }, cast: '{a}は、大きなうでを{t}にふり下ろした！', anim: 'tackle',
    desc: '大きなうでで、1人に大ダメージ。',
  },
  m_demon_storm: {
    name: '砂嵐', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'magic', base: [30, 38], thr: 99, status: { status: 'blind', chance: 0.45, turns: [2, 3] } }, cast: '{a}は、大きな口から、砂嵐をふき出した！', anim: 'sandstorm',
    desc: '砂嵐で、敵みんなにダメージ。目をくらませることがある。',
  },
  m_demon_hand: {
    name: '砂の手', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'status', status: 'paralyze', chance: 0.7, turns: [1, 2] }, cast: '{a}の足もとから砂の手がのびて、{t}の足をつかんだ！', anim: 'quake',
    desc: '砂の手で足をつかんで、動けなくする。',
  },
  m_demon_vortex_charge: {
    name: '砂の大うずの前ぶれ', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_demon_vortex' }, cast: '{a}の体のまわりで、砂がうずをまき始めた…！', anim: 'charge',
    desc: '次の番に「砂の大うず」。身を守ろう。',
  },
  m_demon_vortex: {
    name: '砂の大うず', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 1.3, ignoreDef: 0.25 }, cast: '{a}の砂の大うず！\n王の間じゅうに、砂があれくるう！', anim: 'sand_vortex',
    desc: '砂の大うずで、敵みんなに大ダメージ。防御で半分になる。',
  },
};
