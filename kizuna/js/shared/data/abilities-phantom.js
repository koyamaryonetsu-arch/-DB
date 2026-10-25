// 第5章 Step 8「影の城」の 魔物と 3人の まぼろしの 技（B8: 戦い。abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
// とくべつな こうか（psWall … 風のかべ・piCall … かげ火を よぶ・piInferno … かげ火を すいこむ 大炎・pmWave … 水かさの 大波の 前ぶれ）は
// shared/battle-phantom.js の phantomEffect。水の衣・まぼろし・大波の 2だん目・はね返す 光は battle-temple.js・battle-ch4.js の しくみ
export const PHANTOM_ABILITIES = {
  // ── あらしガラス ──
  m_gc_wing: {
    name: '風のつばさ', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', element: 'wind', base: [70, 84], thr: 99 }, cast: '{a}は、大きなつばさで、はげしい風をおこした！', anim: 'gc_wing',
    desc: '大きなつばさで風をおこして、敵みんなにダメージ。',
  },
  m_gc_dive: {
    name: '急降下', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.45 }, cast: '{a}は、空の上から、{t}めがけて急降下した！', anim: 'gc_dive',
    desc: '空の上から急降下して、1人に大きなダメージ。',
  },
  m_gc_feather: {
    name: 'かみなりの羽', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'magic', element: 'bolt', base: [80, 96], thr: 99 }, { type: 'status', status: 'paralyze', chance: 0.22, turns: [1, 1] }] },
    cast: '{a}は、ぱちぱち光る羽を、{t}にとばした！', anim: 'gc_feather',
    desc: '雷の羽をとばして、1人にダメージ。体がしびれることがある。',
  },

  // ── 風車の番人 ──
  m_mk_blade: {
    name: '風車ぎり', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'phys', mult: 0.75 }, cast: '{a}は、風車のはねのようなうでを、ぐるぐる回した！', anim: 'mk_blade',
    desc: '風車のようなうでを回して、敵みんなを切る。',
  },
  m_mk_gust: {
    name: 'つむじ風', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'magic', element: 'wind', base: [58, 70], thr: 99 }, { type: 'status', status: 'blind', chance: 0.25, turns: [2, 3] }] },
    cast: '{a}のうでが風をよび、つむじ風がまきおこった！\n砂ぼこりで、前が見えない…', anim: 'mk_gust',
    desc: 'つむじ風で、敵みんなにダメージ。まぼろしにかけることがある。',
  },
  m_mk_brace: {
    name: '石のふんばり', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.4, dur: 20 }, cast: '{a}は、石の足で、どっしりとふんばった！', anim: 'mk_brace',
    desc: 'どっしりとふんばって、守りを上げる。',
  },

  // ── かまいたち ──
  m_ww_cut: {
    name: '風のやいば', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'phys', mult: 0.7, hits: 3, random: true, element: 'wind' }, cast: '{a}は、つむじ風になって、走りぬけた！\n見えない風のやいばが、おそいかかる！', anim: 'ww_cut',
    desc: '風のやいばで、だれかを3回切りつける。',
  },
  m_ww_dance: {
    name: '風のおどり', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'agi', mult: 1.35, dur: 20 }, cast: '{a}は、くるくると風の中でおどった！', anim: 'ww_dance',
    desc: '風の中でおどって、素早さを上げる。',
  },

  // ── 火の粉オオカミ ──
  m_ew_breath: {
    name: '火の粉のいき', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [72, 86], thr: 99, breath: true }, cast: '{a}は、火の粉まじりのいきを、ふきつけた！', anim: 'ew_breath',
    desc: '火の粉のいきで、敵みんなにダメージ。',
  },
  m_ew_fang: {
    name: 'もえるキバ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4, element: 'fire' }, cast: '{a}は、もえるキバで、{t}にかみついた！', anim: 'ew_fang',
    desc: 'もえるキバで、1人にかみつく。炎のダメージ。',
  },
  m_ew_howl: {
    name: 'ほのおのとおぼえ', kind: 'monster', mp: 3, target: 'allies',
    effect: { type: 'buff', stat: 'atk', mult: 1.2, dur: 20 }, cast: '{a}は、もえるようなとおぼえを上げた！', anim: 'ew_howl',
    desc: 'とおぼえで、仲間みんなの攻撃力を上げる。',
  },

  // ── ろうそくおばけ ──
  m_cg_flame: {
    name: 'ゆらめく火', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'magic', element: 'fire', base: [110, 128], thr: 99 }, cast: '{a}の頭の火が、ゆらりと大きくなって、{t}をつつんだ！', anim: 'cg_flame',
    desc: '頭の火で、1人にダメージ。',
  },
  m_cg_wax: {
    name: 'ろうのしずく', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'debuff', stat: 'agi', mult: 0.75, dur: 20, chance: 0.5 }, cast: '{a}は、あついろうを、ぽたぽたとたらした！\nろうがかたまって、足が重い…', anim: 'cg_wax',
    desc: 'とけたろうをたらして、敵みんなの素早さを下げることがある。',
  },
  m_cg_sway: {
    name: 'ゆらゆらの火', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'confuse', chance: 0.22, turns: [1, 2] }, cast: '{a}の火が、ゆらゆらとゆれている…\n見ていると、頭がぼんやりする…', anim: 'cg_sway',
    desc: 'ゆれる火を見せて、敵みんなを混乱させることがある。',
  },

  // ── 黒ほのおの騎士 ──
  m_bk_slash: {
    name: '黒炎ぎり', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.5, element: 'fire' }, cast: '{a}は、黒い炎の剣で、{t}に切りかかった！', anim: 'bk_slash',
    desc: '黒い炎の剣で、1人を切る。炎のダメージ。',
  },
  m_bk_wall: {
    name: '炎のかべ', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [76, 90], thr: 99 }, cast: '{a}が剣をつき立てると、黒い炎のかべが、まわりをつつんだ！', anim: 'bk_wall',
    desc: '黒い炎のかべで、敵みんなにダメージ。',
  },

  // ── 鏡くらげ ──
  m_mj_sting: {
    name: 'しびれる手', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.25, status: { status: 'paralyze', chance: 0.2, turns: [1, 1] } }, cast: '{a}の長い手が、{t}にまきついた！', anim: 'mj_sting',
    desc: '長い手で、1人を攻撃する。しびれることがある。',
  },
  m_mj_bubble: {
    name: '光るあわ', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'magic', element: 'water', base: [64, 78], thr: 99 }, cast: '{a}は、きらきら光るあわを、たくさんはきだした！', anim: 'mj_bubble',
    desc: '光るあわで、敵みんなにダメージ。',
  },
  // 体が 光る（次の 自分の 番まで 呪文を はね返す。battle-temple.js の reflect）
  m_mj_glow: {
    name: '鏡の光', kind: 'monster', target: 'self',
    effect: { type: 'reflect', kind: 'glow' }, cast: '{a}の体が、鏡のように光り始めた！', anim: 'mj_glow',
    desc: '体が光る。次の番まで、呪文をはね返す。',
  },

  // ── 水かげの大へび ──
  m_ss_bite: {
    name: 'かみつく', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.5 }, cast: '{a}は、{t}に大きな口でかみついた！', anim: 'ss_bite',
    desc: '大きな口で、1人にかみつく。',
  },
  m_ss_coil: {
    name: 'しめつける', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.1, debuff: { stat: 'agi', mult: 0.7, dur: 20, chance: 0.7 } }, cast: '{a}は、長い体で、{t}をしめつけた！', anim: 'ss_coil',
    desc: '長い体でしめつけて、素早さを下げる。',
  },
  m_ss_tide: {
    name: 'うずしお', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', element: 'water', base: [70, 84], thr: 99 }, cast: '{a}は、水路の水を、うずまかせた！', anim: 'ss_tide',
    desc: 'うずしおで、敵みんなにダメージ。',
  },

  // ── あわの歌姫 ──
  m_fsi_shot: {
    name: '水のつぶて', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', element: 'water', base: [104, 122], thr: 99 }, cast: '{a}は、水のつぶてを、{t}にはなった！', anim: 'fsi_shot',
    desc: '水のつぶてで、1人にダメージ。',
  },
  m_fsi_lull: {
    name: 'ねむりの歌', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.25, turns: [1, 2] }, cast: '{a}は、やさしい声で歌い始めた…\nまぶたが、重くなってくる…', anim: 'fsi_lull',
    desc: 'ねむりの歌で、敵みんなをねむらせることがある。',
  },
  m_fsi_mend: {
    name: 'いやしの歌', kind: 'monster', mp: 8, target: 'allies',
    effect: { type: 'heal', base: [180, 220], thr: 99 }, cast: '{a}は、いやしの歌をうたった！', anim: 'fsi_mend',
    desc: 'いやしの歌で、仲間みんなを回復する。',
  },

  // ── ストルムのまぼろし（shared/battle-phantom.js）──
  m_ps_blade: {
    name: '嵐の剣', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.45, element: 'wind' }, cast: '{a}の嵐の剣！\n風のやいばが、うなりをあげる！', anim: 'ps_blade',
    desc: '風のやいばの剣で、1人に大きなダメージ。',
  },
  m_ps_thunder: {
    name: '雷を呼ぶ', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'magic', element: 'bolt', base: [150, 174], thr: 99 }, cast: '{a}は剣を空にかかげた！\n雷が、ふりそそぐ！', anim: 'ps_thunder',
    desc: '雷を呼んで、敵みんなにダメージ。',
  },
  // 竜巻の 前ぶれ → 次の 番に 大竜巻（身を 守ると 半分）
  m_ps_tornado_charge: {
    name: '竜巻をためる', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_ps_tornado' }, cast: '{a}のマントが、大きくふくらんだ！\n大きな竜巻が、生まれようとしている…！', anim: 'ps_tornado_charge',
    desc: '次の番に「大竜巻」。身を守るとダメージが半分になる。',
  },
  m_ps_tornado: {
    name: '大竜巻', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 1.2, ignoreDef: 0.3, element: 'wind', acc: 1.2 }, cast: '{a}の大竜巻！\nはげしい風が、すべてをまきあげる！', anim: 'ps_tornado',
    desc: '大きな竜巻で、敵みんなにとても大きなダメージ。',
  },
  // 風のかべ: ストルムが 何回か 動くまで、物理の 攻撃を はね返す（呪文・合体技は とどく）
  m_ps_wall: {
    name: '風のかべ', kind: 'monster', target: 'self',
    effect: { type: 'psWall' }, cast: '{a}のまわりを、ごうごうとうなる風のかべが、かこんだ！', anim: 'ps_wall',
    desc: '風のかべをまとう。その間は、物理の攻撃がはね返される。呪文と合体技はとどく。',
  },
  // 嵐の兵の まぼろし
  m_pss_slash: {
    name: '風のやいば', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.3, element: 'wind' }, cast: '{a}は、風のやいばで、{t}に切りかかった！', anim: 'pss_slash',
    desc: '風のやいばで、1人を切る。',
  },

  // ── イグニアのまぼろし（shared/battle-phantom.js）──
  m_pi_fire: {
    name: '魔女の炎', kind: 'monster', mp: 6, target: 'enemy',
    effect: { type: 'magic', element: 'fire', base: [200, 230], thr: 99 }, cast: '{a}は、つえの宝石から、大きな火の玉をはなった！', anim: 'pi_fire',
    desc: '大きな火の玉で、1人にダメージ。',
  },
  m_pi_hellfire: {
    name: 'ごうかの炎', kind: 'monster', mp: 10, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [150, 172], thr: 99 }, cast: '{a}は、つえをふりかざした！\nごうかの炎が、うずまく！', anim: 'pi_hellfire',
    desc: 'ごうかの炎で、敵みんなにダメージ。',
  },
  m_pi_haze: {
    name: 'かげろう', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'status', status: 'blind', chance: 0.4, turns: [2, 3] }, cast: '{a}のまわりに、ゆらゆらと、かげろうが立ちのぼった！', anim: 'pi_haze',
    desc: 'かげろうで、敵みんなにまぼろしを見せる。',
  },
  // かげ火を よぶ（castle.call 体。いっしょに いるのは castle.max 体まで）
  m_pi_call: {
    name: 'かげ火をよぶ', kind: 'monster', target: 'self',
    effect: { type: 'piCall' }, cast: '{a}は、ぱちんと指をならした！', anim: 'pi_call',
    desc: 'かげ火のまぼろしをよび出す。大炎のときに、すいこまれる。',
  },
  // 大炎の 前ぶれ → 次の 番に 大炎（のこっている かげ火を すいこむ ほど 強い。身を 守ると 半分）
  m_pi_inferno_charge: {
    name: '大炎をためる', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_pi_inferno' }, cast: '{a}は、炎のつばさを大きく広げた！\nかげ火たちが、つばさにひきよせられていく…！', anim: 'pi_inferno_charge',
    desc: '次の番に「大炎」。のこっているかげ火をすいこんで強くなる。かげ火をたおし、身を守ろう。',
  },
  m_pi_inferno: {
    name: '大炎', kind: 'monster', target: 'enemies',
    effect: { type: 'piInferno', mult: 1.1, ignoreDef: 0.3 }, cast: '{a}の大炎！\n城をつつむほどの炎が、すべてをのみこむ！', anim: 'pi_inferno',
    desc: 'すべてをやく大炎。敵みんなにとても大きなダメージ。',
  },
  // かげ火の まぼろし
  m_pf_fire: {
    name: 'むらさきの火', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', element: 'fire', base: [92, 108], thr: 99 }, cast: '{a}は、むらさきの火を、{t}にふきつけた！', anim: 'pf_fire',
    desc: 'むらさきの火で、1人にダメージ。',
  },

  // ── モルガナのまぼろし（水の衣・まぼろしの 分身・鏡写しは 第4章の モルガナと おなじ しくみ。shared/battle-phantom.js）──
  m_pm_blade: {
    name: '水のやいば', kind: 'monster', mp: 6, target: 'enemy',
    effect: { type: 'magic', element: 'water', base: [210, 240], thr: 99 }, cast: '{a}は、水のやいばを、{t}にはなった！', anim: 'pm_blade',
    desc: '水のやいばで、1人に大きなダメージ。',
  },
  m_pm_whirl: {
    name: 'うずしお', kind: 'monster', mp: 10, target: 'group',
    effect: { type: 'magic', element: 'water', base: [140, 162], thr: 99 }, cast: '{a}は、広間の水をうずまかせた！\nうずしおが、みんなをのみこむ！', anim: 'pm_whirl',
    desc: 'うずしおで、敵みんなにダメージ。',
  },
  // 分身も 使う（まぼろしの 分身は ふつうの 攻撃と これだけ）
  m_pm_splash: {
    name: '水しぶき', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'magic', element: 'water', base: [110, 128], thr: 99 }, cast: '{a}は、つめたい水しぶきを、{t}にあびせた！', anim: 'pm_splash',
    desc: 'つめたい水しぶきで、1人にダメージ。',
  },
  // 月の鏡で まぶしい（第4章の モルガナより 早く 立ちなおる。この 1回だけ 動けない。2回行動の のこりは 動く）
  m_pm_dazzled: {
    name: 'まぶしい', kind: 'monster', target: 'self',
    effect: { type: 'nothing' }, cast: '{a}は、月の光にまぶしそうに目を細めた…が、すぐにふりはらった！', anim: 'none',
    desc: '月の鏡の光で、1回だけ動けない。',
  },
  m_pm_heal: {
    name: 'いやしの水', kind: 'monster', mp: 12, target: 'self',
    effect: { type: 'heal', base: [1600, 1900], thr: 99 }, cast: '{a}は、広間の水を体にあびた！', anim: 'pm_heal',
    desc: '水をあびて、自分のキズを回復する。',
  },
  // 水かさが いっぱい（castle.tide.max）: 2だんの 前ぶれ → 大波（身を 守ると 半分。大波の あと 水かさは 0 に もどる）
  m_pm_wave_charge: {
    name: '大波の前ぶれ', kind: 'monster', target: 'self',
    effect: { type: 'pmWave', stage: 1, next: 'm_pm_wave_build' }, cast: '水かさが、いっぱいになった…！\n水がうずをまいている…！', anim: 'pm_wave_charge',
    desc: '2つあとの番に「大波」。身を守ろう。',
  },
  m_pm_wave_build: {
    name: '大波の前ぶれ', kind: 'monster', target: 'self',
    effect: { type: 'wave', stage: 2, next: 'm_pm_wave' }, cast: '{a}のまわりで、水のうずが、どんどん大きくなっていく…！', anim: 'pm_wave_charge',
    desc: '次の番に「大波」。身を守ろう。',
  },
  m_pm_wave: {
    name: '大波', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', element: 'water', mult: 1.6, ignoreDef: 0.5 }, cast: '{a}の大波！\n広間いっぱいの水が、みんなにおそいかかる！', anim: 'pm_wave',
    desc: '広間いっぱいの大波で、敵みんなにとても大きなダメージ。身を守ると半分になる。',
  },
};
