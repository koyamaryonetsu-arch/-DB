// 第2部 第6章 Step 1・2 の 魔物と、サンドクロック・ギアドン・ゲストの ミナモの 技（B: 戦い。abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
// バフ・デバフは かかった 人が 3回 行動すると 切れる（第38回 C。dur は 書かない）
// とくべつな こうか（scFall … 大砂流〈砂が もどる〉・gdRecord … 時を覚える・gdRewind … まきもどし）は shared/battle-ch6.js の ch6Effect
// anim は a6_〜（client/render/battlefx-ch6.js）。ミナモの 技は mm6_〜（ひらめき技として 入る。world/party.js の makeNpcSupportChar）
export const PAST_ABILITIES = {
  // ── こけむしツノジカ ──
  m6_md_horn: {
    name: 'ツノのとっしん', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.45 }, cast: '{a}は、こけむしたツノをかまえて、{t}にとっしんした！', anim: 'a6_horn',
    desc: '大きなツノでとっしんして、1人に大きなダメージ。',
  },
  m6_md_stomp: {
    name: 'ひづめのじひびき', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'phys', mult: 0.7 }, cast: '{a}は、前足を高く上げて、地面をふみならした！\nじひびきが、みんなをおそう！', anim: 'a6_stomp',
    desc: '地面をふみならして、敵みんなにダメージ。',
  },
  m6_md_call: {
    name: '森のよびごえ', kind: 'monster', mp: 3, target: 'allies',
    effect: { type: 'buff', stat: 'def', mult: 1.25 }, cast: '{a}は、森にひびく声でないた！\n森の力が、仲間たちを守る…', anim: 'a6_call',
    desc: '森によびかけて、仲間みんなの守りを上げる。',
  },

  // ── こはくのガ ──
  m6_am_amber: {
    name: 'こはくの光', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'magic', element: 'light', base: [104, 122], thr: 99 }, { type: 'status', status: 'paralyze', chance: 0.18, turns: [1, 1] }] },
    cast: '{a}のはねが、こはく色に光った！\n{t}の体が、かたまっていく…！', anim: 'a6_amber',
    desc: 'こはく色の光で、1人にダメージ。体がかたまって動けなくなることがある。',
  },
  m6_am_wing: {
    name: 'ひかるはね', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'magic', base: [62, 76], thr: 99 }, cast: '{a}は、光るはねを、ひらひらとまきちらした！', anim: 'a6_wing',
    desc: '光るはねをまきちらして、敵みんなにダメージ。',
  },
  m6_am_dust: {
    name: 'ねむりのりんぷん', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.22, turns: [1, 2] }, cast: '{a}は、こはく色のりんぷんをふりまいた…\nまぶたが、重くなってくる…', anim: 'a6_dust',
    desc: 'りんぷんで、敵みんなをねむらせることがある。',
  },

  // ── 古木の子ども ──
  m6_es_root: {
    name: 'ねっこしばり', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.1, debuff: { stat: 'agi', mult: 0.7, chance: 0.6 } }, cast: '{a}のねっこが、地面からのびて、{t}の足にからみついた！', anim: 'a6_root',
    desc: 'ねっこで足をしばって、素早さを下げる。',
  },
  m6_es_leaf: {
    name: 'このはのうず', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'magic', element: 'wind', base: [64, 78], thr: 99 }, cast: '{a}のえだがゆれて、このはが、うずをまいた！', anim: 'a6_leaf',
    desc: 'このはのうずで、敵みんなにダメージ。',
  },
  m6_es_nut: {
    name: '木の実をおとす', kind: 'monster', mp: 8, target: 'allies',
    effect: { type: 'heal', base: [200, 240], thr: 99 }, cast: '{a}は、頭の木の実を、ぽとぽととおとした！', anim: 'a6_nut',
    desc: '木の実をおとして、仲間みんなを回復する。',
  },

  // ── ときうさぎ ──
  m6_th_kick: {
    name: 'あわてキック', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 0.8, hits: 2 }, cast: '{a}は、「いそげ、いそげ！」と、{t}を2回けとばした！', anim: 'a6_kick',
    desc: 'あわてて2回けとばす。',
  },
  m6_th_hurry: {
    name: 'いそげいそげ', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'agi', mult: 1.35 }, cast: '{a}は、時計を見て、「ちこくだ、ちこくだ！」とあわてだした！', anim: 'a6_hurry',
    desc: 'あわてて、素早さを上げる。',
  },
  m6_th_bell: {
    name: 'めざましのベル', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'confuse', chance: 0.18, turns: [1, 2] }, cast: '{a}の時計が、ジリリリリ！と鳴りひびいた！\n頭がくらくらする…', anim: 'a6_bell',
    desc: '大きなベルの音で、敵みんなを混乱させることがある。',
  },

  // ── 砂つぶの精 ──
  m6_sp_flow: {
    name: 'さらさらの砂', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [60, 74], thr: 99 }, cast: '{a}は、さらさらの砂を、風にのせてとばした！', anim: 'a6_flow',
    desc: 'さらさらの砂で、敵みんなにダメージ。',
  },
  m6_sp_throw: {
    name: 'すなかけ', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'status', status: 'blind', chance: 0.3, turns: [2, 3] }, cast: '{a}は、砂をばさっとかけた！\n目に砂が入って、前が見えない…', anim: 'a6_sand',
    desc: '砂をかけて、敵みんなにまぼろしを見せることがある。',
  },
  m6_sp_hide: {
    name: '砂にかくれる', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'eva', add: 0.25 }, cast: '{a}は、さらさらと、砂の中にとけこんだ！', anim: 'a6_hide',
    desc: '砂の中にかくれて、攻撃をかわしやすくなる。',
  },

  // ── 砂時計サソリ ──
  m6_gs_tail: {
    name: 'どくばり', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.2, status: { status: 'poison', chance: 0.4, turns: [3, 4] } }, cast: '{a}は、砂時計のしっぽで、{t}をさした！', anim: 'a6_tail',
    desc: 'しっぽのどくばりでさす。毒になることがある。',
  },
  m6_gs_claw: {
    name: 'はさみうち', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 0.8, hits: 2 }, cast: '{a}は、大きなはさみで、{t}を2回はさんだ！', anim: 'a6_pinch',
    desc: 'はさみで2回はさむ。',
  },
  m6_gs_shell: {
    name: 'からにこもる', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.4 }, cast: '{a}は、かたいからに体をまるめた！', anim: 'a6_shell',
    desc: 'からにこもって、守りを上げる。',
  },

  // ── 砂の番兵 ──
  m6_sgl_fist: {
    name: '砂のこぶし', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.5 }, cast: '{a}は、大きな砂のこぶしを、{t}にふりおろした！', anim: 'a6_fist',
    desc: '砂のこぶしで、1人に大きなダメージ。',
  },
  m6_sgl_pit: {
    name: 'すなじごく', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'phys', mult: 0.65, debuff: { stat: 'agi', mult: 0.75, chance: 0.5 } }, cast: '{a}のまわりの砂が、うずをまいてしずみ始めた！\n足が砂にとられる…！', anim: 'a6_pit',
    desc: '砂のうずで、敵みんなにダメージ。素早さが下がることがある。',
  },
  m6_sgl_mend: {
    name: '砂を集める', kind: 'monster', mp: 6, target: 'self',
    effect: { type: 'heal', base: [400, 460], thr: 99 }, cast: '{a}は、まわりの砂を集めて、キズをうめた！', anim: 'a6_mend',
    desc: '砂を集めて、自分のキズを回復する。',
  },

  // ── 歯車カブト ──
  m6_gb_horn: {
    name: 'ギアホーン', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.5 }, cast: '{a}は、歯車のツノを回しながら、{t}につっこんだ！', anim: 'a6_ghorn',
    desc: '回る歯車のツノで、1人に大きなダメージ。',
  },
  m6_gb_spin: {
    name: 'ぐるぐる歯車', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'phys', mult: 0.7 }, cast: '{a}は、背中の歯車を、ぐるぐるととばした！', anim: 'a6_spin',
    desc: '歯車をとばして、敵みんなにダメージ。',
  },
  m6_gb_wind: {
    name: 'ぜんまいをまく', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'atk', mult: 1.3 }, cast: '{a}は、背中のぜんまいを、ギリギリとまいた！', anim: 'a6_wind',
    desc: 'ぜんまいをまいて、攻撃力を上げる。',
  },

  // ── いにしえの番兵 ──
  m6_rsn_spear: {
    name: '石のやり', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.45, ignoreDef: 0.2 }, cast: '{a}は、石のやりで、{t}をするどくついた！', anim: 'a6_spear',
    desc: '石のやりで、1人をつく。守りを少しむしする。',
  },
  m6_rsn_beam: {
    name: '目からの光', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [70, 84], thr: 99 }, cast: '{a}の石の目が、まぶしく光った！', anim: 'a6_beam',
    desc: '目からの光で、敵みんなにダメージ。',
  },
  m6_rsn_guard: {
    name: 'いにしえの守り', kind: 'monster', mp: 4, target: 'allies',
    effect: { type: 'buff', stat: 'def', mult: 1.25 }, cast: '{a}は、やりを地面に立てて、守りのかまえをとった！', anim: 'a6_guard',
    desc: '仲間みんなの守りを上げる。',
  },

  // ── ふりこコウモリ ──
  m6_pdb_swing: {
    name: 'ふりこアタック', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'phys', mult: 0.7, hits: 3, random: true }, cast: '{a}は、ふりこのように、右へ左へとびまわった！', anim: 'a6_swing',
    desc: '右へ左へとびまわって、だれかを3回攻撃する。',
  },
  m6_pdb_ring: {
    name: 'キーンという音', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'confuse', chance: 0.2, turns: [1, 2] }, cast: '{a}は、キーンと高い音を出した！\n頭がくらくらする…', anim: 'a6_ring',
    desc: '高い音で、敵みんなを混乱させることがある。',
  },
  m6_pdb_tick: {
    name: 'ちくたくの音', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'debuff', stat: 'agi', mult: 0.75, chance: 0.5 }, cast: 'チク、タク、チク、タク…\n{a}の羽の音を聞いていると、体がのろくなる…', anim: 'a6_tick',
    desc: '時計の音で、敵みんなの素早さを下げることがある。',
  },

  // ── ときの守り手 ──
  m6_ck_blade: {
    name: '時の剣', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.5 }, cast: '{a}は、時計の針の形の剣で、{t}に切りかかった！', anim: 'a6_tblade',
    desc: '時計の針の剣で、1人に大きなダメージ。',
  },
  m6_ck_slow: {
    name: 'おそくなれ', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'debuff', stat: 'agi', mult: 0.7, chance: 0.6 }, cast: '{a}は、剣をゆっくりと回した…\nまわりの時が、のろのろと流れ始めた…', anim: 'a6_slow',
    desc: '時の流れをおそくして、敵みんなの素早さを下げることがある。',
  },
  m6_ck_stop: {
    name: '時止めのひとふり', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.0, status: { status: 'paralyze', chance: 0.22, turns: [1, 1] } }, cast: '{a}の剣が、{t}の時を止めようとした！', anim: 'a6_stop',
    desc: '1人を切る。動けなくなることがある。',
  },

  // ── まきもどしのゆうれい ──
  m6_rg_hand: {
    name: 'つめたい時の手', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', base: [128, 148], thr: 99 }, cast: '{a}のすきとおった手が、{t}にふれた！', anim: 'a6_hand',
    desc: 'つめたい手で、1人にダメージ。',
  },
  m6_rg_rewind: {
    name: 'もとにもどれ', kind: 'monster', mp: 8, target: 'ally',
    effect: { type: 'heal', base: [380, 440], thr: 99 }, cast: '{a}は、時計の針を、くるくると、さかさまに回した！\n{t}のキズが、もとにもどっていく…！', anim: 'a6_rewind',
    desc: '仲間1人のキズを、時をまきもどしてなおす。',
  },
  m6_rg_song: {
    name: 'むかしの歌', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.2, turns: [1, 2] }, cast: '{a}は、ずっとむかしの歌を、小さな声で歌い始めた…', anim: 'a6_song',
    desc: 'むかしの歌で、敵みんなをねむらせることがある。',
  },

  // ── とけいグモ ──
  m6_cs_fang: {
    name: '針のキバ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.3, status: { status: 'poison', chance: 0.35, turns: [3, 4] } }, cast: '{a}は、時計の針のようなキバで、{t}にかみついた！', anim: 'a6_fang',
    desc: '針のキバでかみつく。毒になることがある。',
  },
  m6_cs_web: {
    name: '秒針の糸', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'debuff', stat: 'agi', mult: 0.7, chance: 0.6 }, cast: '{a}は、チクタクと光る糸を、はりめぐらせた！', anim: 'a6_web',
    desc: '糸で、敵みんなの素早さを下げることがある。',
  },
  m6_cs_jump: {
    name: 'とびかかり', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.6 }, cast: '{a}は、高くとび上がって、{t}にとびかかった！', anim: 'a6_jump',
    desc: '高くとんで、1人にとびかかる。',
  },

  // ── サンドクロック（shared/battle-ch6.js）──
  m6_sc_spray: {
    name: 'すなのつぶて', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'magic', base: [320, 360], thr: 99 }, cast: '{a}は、かたい砂のつぶてを、{t}にうちだした！', anim: 'a6_spray',
    desc: 'かたい砂のつぶてで、1人に大きなダメージ。',
  },
  m6_sc_swing: {
    name: '時のふりこ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}の大きなふりこが、{t}めがけて、ぶうんとゆれた！', anim: 'a6_pend',
    desc: '大きなふりこで、1人をたたく。',
  },
  m6_sc_storm: {
    name: '砂あらし', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'magic', base: [150, 172], thr: 99 }, { type: 'status', status: 'blind', chance: 0.25, turns: [2, 3] }] },
    cast: '{a}は、体をぐるりと回した！\nほこらいっぱいに、砂あらしがふきあれる！', anim: 'a6_storm',
    desc: '砂あらしで、敵みんなにダメージ。まぼろしを見ることがある。',
  },
  m6_sc_sink: {
    name: 'すなじごく', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'phys', mult: 0.72, debuff: { stat: 'agi', mult: 0.75, chance: 0.5 } }, cast: '{a}のまわりの砂が、うずをまいてしずみ始めた！', anim: 'a6_pit',
    desc: '砂のうずで、敵みんなにダメージ。素早さが下がることがある。',
  },
  // 砂が 落ちきった（砂 0）: 前ぶれ → 次の 番に 大砂流。この 間に 氷を 当てると、砂が こおって 止まる
  m6_sc_fall_charge: {
    name: '最後の砂', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm6_sc_fall' }, cast: 'サンドクロックの最後の砂が、さらりと落ちた…！\nガラスの中で、砂がうずをまいている…！', anim: 'a6_fall_charge',
    desc: '次の番に「大砂流」。身を守ろう。氷を当てれば止められる。',
  },
  m6_sc_fall: {
    name: '大砂流', kind: 'monster', target: 'enemies',
    effect: { type: 'scFall', mult: 1.0, ignoreDef: 0.4, debuff: { stat: 'agi', mult: 0.75, chance: 0.5 } }, cast: '{a}の大砂流！\n砂時計がひっくり返り、砂の大波が、みんなをのみこむ！', anim: 'a6_fall',
    desc: '砂の大波で、敵みんなにとても大きなダメージ。身を守ると半分になる。',
  },

  // ── ギアドン（shared/battle-ch6.js）──
  m6_gd_fist: {
    name: 'ぜんまいパンチ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.45 }, cast: '{a}は、ぜんまいのうでを、ぎゅるんとのばして、{t}をなぐった！', anim: 'a6_gfist',
    desc: 'ぜんまいのうででなぐって、1人に大きなダメージ。',
  },
  m6_gd_cog: {
    name: '歯車ブーメラン', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'phys', mult: 0.75 }, cast: '{a}は、かたの歯車をはずして、ぶうんと投げた！', anim: 'a6_cog',
    desc: '歯車を投げて、敵みんなにダメージ。',
  },
  m6_gd_hand: {
    name: '時の針', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'magic', base: [240, 272], thr: 99 }, { type: 'debuff', stat: 'agi', mult: 0.75, chance: 0.5 }] },
    cast: '{a}のむねの時計から、長い針がとびだして、{t}をさした！', anim: 'a6_needle',
    desc: '時計の針で、1人に大きなダメージ。素早さが下がることがある。',
  },
  m6_gd_steam: {
    name: 'じょうきふき', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [150, 172], thr: 99 }, cast: '{a}の体じゅうから、あついじょうきが、ふきだした！', anim: 'a6_steam',
    desc: 'あついじょうきで、敵みんなにダメージ。',
  },
  // ギアプレスの 前ぶれ → 次の 番に ギアプレス（身を 守ると 半分）
  m6_gd_press_charge: {
    name: '大歯車をかかげる', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm6_gd_press' }, cast: '{a}は、むねの大歯車を、頭の上に高くかかげた…！', anim: 'a6_press_charge',
    desc: '次の番に「ギアプレス」。身を守るとダメージが半分になる。',
  },
  m6_gd_press: {
    name: 'ギアプレス', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 1.4, ignoreDef: 0.3 }, cast: '{a}のギアプレス！\n大歯車が、ずしんと落ちてきた！', anim: 'a6_press',
    desc: '大歯車をおとして、敵みんなにとても大きなダメージ。',
  },
  // 時を覚える（今の HPを おぼえる。wind 回 動いたら まきもどし。その 間に 雷を need 回 当てると こわれる）
  m6_gd_record: {
    name: '時を覚える', kind: 'monster', target: 'self',
    effect: { type: 'gdRecord' }, cast: '{a}のむねの大歯車が、カチリと止まった…！', anim: 'a6_record',
    desc: '今の体を、時の中に覚える。しばらくすると「まきもどし」。雷の攻撃を2回当てれば止められる。',
  },
  m6_gd_rewind: {
    name: 'まきもどし', kind: 'monster', target: 'self',
    effect: { type: 'gdRewind' }, cast: '{a}のぜんまいが、ぎゅるぎゅると、さか回りし始めた！', anim: 'a6_rewind_big',
    desc: '時をまきもどして、覚えたときの体にもどる（キズがなおる）。',
  },

  // ── ゲストの ミナモ（星読みの むすめ。回復が とくい。data/companions-past.js の MINAMO_GUEST）──
  mm6_dew: {
    name: '星のしずく', kana: 'ほしのしずく', kind: 'spell', mp: 10, target: 'ally',
    effect: { type: 'heal', base: [250, 290], thr: 60 }, cast: '{a}は、夜空にいのった。\n星のしずくが、{t}の上にふりそそいだ！', anim: 'a6_dew',
    desc: '星のしずくで、仲間1人のHPを大きく回復する。',
  },
  mm6_prayer: {
    name: '星読みのいのり', kana: 'ほしよみのいのり', kind: 'spell', mp: 22, target: 'allies',
    effect: { type: 'heal', base: [150, 180], thr: 60 }, cast: '{a}は、星読みのいのりをささげた！\nやさしい星の光が、みんなをつつむ…', anim: 'a6_prayer',
    desc: '星の光で、仲間みんなのHPを回復する。',
  },
  mm6_comet: {
    name: 'ながれぼし', kana: 'ながれぼし', kind: 'spell', mp: 16, target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [110, 136], thr: 80 }, cast: '{a}がゆびさすと、ながれぼしが、敵にふりそそいだ！', anim: 'a6_comet',
    desc: 'ながれぼしで、敵全体に光のダメージ。',
  },
  mm6_read: {
    name: '星読みの守り', kana: 'ほしよみのまもり', kind: 'spell', mp: 12, target: 'allies',
    effect: { type: 'buff', stat: 'def', mult: 1.25 }, cast: '{a}は、星の動きを読んだ。\n「…来るよ！みんな、守って！」', anim: 'a6_read',
    desc: '星を読んで、仲間みんなの守備力を上げる。',
  },
};
