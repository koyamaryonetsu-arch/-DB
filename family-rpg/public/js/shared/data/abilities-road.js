// 第2部 第6章 Step 3・4「星めぐりの古道」の 魔物と、星くいのよる鳥・ペンデュラの 技（B: 戦い。abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
// バフ・デバフは かかった 人が 3回 行動すると 切れる（第38回 C。dur は 書かない）
// とくべつな こうか（seEat … 星くい・pdStop … 時止め）は shared/battle-road.js の roadEffect
// anim は a6r_〜（client/render/battlefx-road.js）
export const ROAD_ABILITIES = {
  // ── ほしかげオオカミ ──
  m6_sw_fang: {
    name: '星のキバ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.45 }, cast: '{a}のキバが、星のように光った！\n{t}にかみついた！', anim: 'a6r_fang',
    desc: '星のように光るキバで、1人にかみつく。',
  },
  m6_sw_pack: {
    name: '星座のむれ', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'phys', mult: 0.7 }, cast: '{a}の体から、星座の線がのびた！\n光のオオカミたちが、みんなにとびかかる！', anim: 'a6r_pack',
    desc: '星座の光のむれで、敵みんなにダメージ。',
  },
  m6_sw_howl: {
    name: 'とおぼえ', kind: 'monster', mp: 3, target: 'allies',
    effect: { type: 'buff', stat: 'atk', mult: 1.15 }, cast: '{a}は、星空にむかって、とおぼえをした！\n仲間たちの力が上がる…！', anim: 'a6r_howl',
    desc: 'とおぼえで、仲間みんなの攻撃力を上げる。',
  },

  // ── ひなたの星ひつじ ──
  m6_sr_horn: {
    name: '金のツノ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}は、金色のツノを、{t}につきだした！', anim: 'a6r_horn',
    desc: '金色のツノで、1人に大きなダメージ。',
  },
  m6_sr_rush: {
    name: '太陽のとっしん', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'phys', mult: 0.7 }, cast: '{a}は、まぶしく光りながら、みんなにとっしんした！', anim: 'a6r_rush',
    desc: '光りながらとっしんして、敵みんなにダメージ。',
  },
  m6_sr_wool: {
    name: 'ひだまりのけ', kind: 'monster', mp: 8, target: 'allies',
    effect: { type: 'heal', base: [200, 240], thr: 99 }, cast: '{a}の金の毛から、ひだまりのようなぬくもりが広がった…', anim: 'a6r_wool',
    desc: 'ひだまりのぬくもりで、仲間みんなを回復する。',
  },

  // ── 星くずモグラ ──
  m6_dm_claw: {
    name: 'ほりかえしのツメ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.35, debuff: { stat: 'def', mult: 0.8, chance: 0.4 } }, cast: '{a}は、大きなツメで、{t}をほりかえした！', anim: 'a6r_dig',
    desc: '大きなツメで1人をひっかく。守りが下がることがある。',
  },
  m6_dm_dust: {
    name: '星くずまき', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'magic', base: [66, 80], thr: 99 }, { type: 'status', status: 'blind', chance: 0.25, turns: [2, 3] }] },
    cast: '{a}は、ほった星くずを、ぱあっとまきちらした！', anim: 'a6r_dust',
    desc: '星くずをまいて、敵みんなにダメージ。まぼろしを見ることがある。',
  },
  m6_dm_pile: {
    name: '星くずの山', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.3 }, cast: '{a}は、星くずの山に、もぐりこんだ！', anim: 'a6r_pile',
    desc: '星くずの山にもぐって、守りを上げる。',
  },

  // ── ゆがみの精 ──
  m6_ww_flash: {
    name: 'ちぐはぐの光', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'magic', base: [128, 148], thr: 99 }, { type: 'status', status: 'confuse', chance: 0.15, turns: [1, 2] }] },
    cast: '{a}のまわりの景色が、ぐにゃりとゆがんだ！\nちぐはぐの光が、{t}をつつむ！', anim: 'a6r_flash',
    desc: 'ゆがんだ光で、1人にダメージ。混乱することがある。',
  },
  m6_ww_warp: {
    name: '時のゆがみ', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'debuff', stat: 'agi', mult: 0.75, chance: 0.6 }, cast: '{a}は、まわりの時を、ねじまげた…！\nみんなの動きが、のろくなっていく…', anim: 'a6r_warp',
    desc: '時をゆがめて、敵みんなの素早さを下げることがある。',
  },
  m6_ww_haste: {
    name: 'はやまわし', kind: 'monster', mp: 4, target: 'allies',
    effect: { type: 'buff', stat: 'agi', mult: 1.3 }, cast: '{a}は、まわりの時を、くるくるとはやく回した！', anim: 'a6r_haste',
    desc: '時をはやく回して、仲間みんなの素早さを上げる。',
  },

  // ── 星座ガニ ──
  m6_cb_pinch: {
    name: '星のはさみ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 0.85, hits: 2 }, cast: '{a}は、星の光るはさみで、{t}を2回はさんだ！', anim: 'a6r_pinch',
    desc: '星のはさみで、1人を2回はさむ。',
  },
  m6_cb_foam: {
    name: '星のあわ', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'magic', element: 'water', base: [70, 84], thr: 99 }, cast: '{a}は、星のようにきらめくあわを、ぶくぶくとはいた！', anim: 'a6r_foam',
    desc: 'つめたい星のあわで、敵みんなにダメージ。',
  },
  m6_cb_shell: {
    name: 'こうらをかためる', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.4 }, cast: '{a}は、星座のこうらを、ぎゅっとかためた！', anim: 'a6r_shell',
    desc: 'こうらをかためて、守りを大きく上げる。',
  },

  // ── 時わすれフクロウ ──
  m6_no_talon: {
    name: 'するどいかぎづめ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}は、音もなくまいおりて、{t}をかぎづめでつかんだ！', anim: 'a6r_talon',
    desc: 'するどいかぎづめで、1人に大きなダメージ。',
  },
  m6_no_eye: {
    name: 'ねむりの目', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'status', status: 'sleep', chance: 0.28, turns: [1, 2] }, cast: '{a}の大きな目が、{t}をじっと見つめた…\n時をわすれて、まぶたが重くなる…', anim: 'a6r_eye',
    desc: 'じっと見つめて、1人をねむらせることがある。',
  },
  m6_no_song: {
    name: '時わすれの歌', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'debuff', stat: 'agi', mult: 0.75, chance: 0.5 }, cast: '{a}は、ホウ、ホウ…と、ゆっくり歌いだした…\n時の流れが、のろくなっていく…', anim: 'a6r_song',
    desc: 'ふしぎな歌で、敵みんなの素早さを下げることがある。',
  },

  // ── ふたご星の精 ──
  m6_ts_twin: {
    name: 'ふたつの光', kind: 'monster', mp: 5, target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'magic', element: 'light', base: [76, 88], thr: 99 }, { type: 'magic', element: 'dark', base: [76, 88], thr: 99 }] },
    cast: '{a}の光の顔と闇の顔が、いっしょに光った！\n{t}に、ふたつの光がとんでいく！', anim: 'a6r_twin',
    desc: '光と闇のふたつの光で、1人に2回ダメージ。',
  },
  m6_ts_spark: {
    name: '星のまたたき', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'magic', base: [70, 84], thr: 99 }, cast: '{a}のまわりで、星が、ちかちかとまたたいた！', anim: 'a6r_spark',
    desc: '星のまたたきで、敵みんなにダメージ。',
  },
  m6_ts_swap: {
    name: 'いれかわりの光', kind: 'monster', mp: 8, target: 'allies',
    effect: { type: 'heal', base: [120, 140], thr: 99 }, cast: '{a}の光の顔と闇の顔が、くるりといれかわった！\nやさしい光が、仲間をつつむ…', anim: 'a6r_swap',
    desc: '光と闇がいれかわって、仲間みんなを回復する。',
  },

  // ── 星くずドラゴン ──
  m6_dd_tail: {
    name: '星くずのしっぽ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.5 }, cast: '{a}は、星くずのついたしっぽを、{t}にたたきつけた！', anim: 'a6r_tail',
    desc: '星くずのしっぽで、1人に大きなダメージ。',
  },
  m6_dd_breath: {
    name: '星くずのブレス', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', base: [92, 108], thr: 99, breath: true }, cast: '{a}は、きらきら光る星くずのブレスを、ふきつけた！', anim: 'a6r_breath',
    desc: '星くずのブレスで、敵みんなにダメージ。',
  },
  m6_dd_roar: {
    name: 'ほしなりのほえごえ', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'debuff', stat: 'atk', mult: 0.8, chance: 0.5 }, cast: '{a}は、ゴオォ…と、星がふるえるような声でほえた！', anim: 'a6r_roar',
    desc: '大きなほえごえで、敵みんなの攻撃力を下げることがある。',
  },

  // ── 星くいのよる鳥（中ボス。shared/battle-road.js）──
  m6_se_peck: {
    name: 'くちばしづき', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.5 }, cast: '{a}は、するどいくちばしで、{t}をつついた！', anim: 'a6r_peck',
    desc: 'するどいくちばしで、1人に大きなダメージ。',
  },
  m6_se_wing: {
    name: 'よるのつばさ', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', element: 'wind', base: [150, 172], thr: 99 }, cast: '{a}は、夜の色のつばさを、大きくはばたかせた！', anim: 'a6r_nwing',
    desc: 'つばさの風で、敵みんなにダメージ。',
  },
  m6_se_dust: {
    name: 'ほしくずのはね', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'magic', base: [120, 140], thr: 99 }, { type: 'status', status: 'blind', chance: 0.25, turns: [2, 3] }] },
    cast: '{a}のはねから、食べた星のくずが、きらきらとふりそそいだ！', anim: 'a6r_feather',
    desc: '星くずのはねで、敵みんなにダメージ。まぼろしを見ることがある。',
  },
  m6_se_cry: {
    name: 'やみのなきごえ', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'debuff', stat: 'atk', mult: 0.8, chance: 0.6 }, cast: '{a}は、ギャア…と、さびしい声でないた…\n体から、力がぬけていく…', anim: 'a6r_cry',
    desc: 'さびしいなきごえで、敵みんなの攻撃力を下げることがある。',
  },
  // 星を ねらう（前ぶれ）→ 次の 番に 星くい。この 間に 光の 攻撃を 当てると、目が くらんで 食べそこねる
  m6_se_aim: {
    name: '星をねらう', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm6_se_eat' }, cast: '{a}は、道しるべの星を、じっと見つめた…！\nくちばしを、星にむけている…！', anim: 'a6r_aim',
    desc: '次の番に、道しるべの星を食べる。光を当てれば、目がくらんで食べそこねる。',
  },
  m6_se_eat: {
    name: '星くい', kind: 'monster', target: 'self',
    effect: { type: 'seEat' }, cast: '{a}は、道しるべの星を、ぱくりと飲みこんだ！', anim: 'a6r_eat',
    desc: '道しるべの星を食べて、HPを回復し、力を上げる。',
  },
  // 星が ぜんぶ なくなった あと: 夜を まとう（前ぶれ）→ よぞらのはばたき（身を 守ると 半分）
  m6_se_dark_charge: {
    name: '夜をまとう', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm6_se_dark' }, cast: '{a}のつばさが、まっくらな夜の色にそまっていく…！', anim: 'a6r_dark_charge',
    desc: '次の番に「よぞらのはばたき」。身を守ろう。',
  },
  m6_se_dark: {
    name: 'よぞらのはばたき', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 1.3, ignoreDef: 0.3 }, cast: '{a}のよぞらのはばたき！\nまっくらな夜の風が、みんなをのみこむ！', anim: 'a6r_dark',
    desc: '夜の風で、敵みんなにとても大きなダメージ。身を守ると半分になる。',
  },

  // ── ペンデュラ（shared/battle-road.js）──
  m6_pd_shot: {
    name: 'ふりこうち', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.45 }, cast: '{a}は、大きなふりこを、{t}めがけて、ぶうんとふった！', anim: 'a6r_shot',
    desc: '大きなふりこで、1人に大きなダメージ。',
  },
  m6_pd_hex: {
    name: 'さかさ時計の魔法', kind: 'monster', mp: 6, target: 'enemy',
    effect: { type: 'magic', element: 'dark', base: [300, 340], thr: 99 }, cast: '{a}は、さかさまの時計の魔法を、となえた！\n{t}のまわりの時が、くるくるさか回りする！', anim: 'a6r_hex',
    desc: 'さかさまの時計の魔法で、1人に大きなダメージ。',
  },
  m6_pd_tick: {
    name: 'チクタクののろい', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'magic', base: [130, 150], thr: 99 }, { type: 'debuff', stat: 'agi', mult: 0.75, chance: 0.5 }] },
    cast: '{a}のふりこが、チク、タク、と鳴りひびいた…\nのろいの音が、みんなの体にしみこむ…！', anim: 'a6r_tick',
    desc: 'のろいの音で、敵みんなにダメージ。素早さが下がることがある。',
  },
  m6_pd_twist: {
    name: 'ねじれ時計', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'phys', mult: 0.75 }, cast: '{a}は、空中の時計の針を、ぐにゃりとねじまげた！\nねじれた針が、みんなをおそう！', anim: 'a6r_twist',
    desc: 'ねじれた時計の針で、敵みんなにダメージ。',
  },
  // ふりこが まん中に 来た: 時止めの 前ぶれ（ねらう 人は battle-road.js が きめる）→ 次の 番に 時止め
  m6_pd_stop_charge: {
    name: 'ふりこがまん中に', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm6_pd_stop' }, cast: '{a}のふりこが、まん中で、ぴたりと止まった…！\nチク…タク…チク…', anim: 'a6r_stop_charge',
    desc: '次の番に「時止め」。ねらわれた人は、身を守れば止まらない。',
  },
  m6_pd_stop: {
    name: '時止め', kind: 'monster', target: 'self',
    effect: { type: 'pdStop' }, cast: '{a}の時止め！\n「止まりなさい…！」', anim: 'a6r_stop',
    desc: 'ねらった1人の時を止めて、行動のゲージを止める。身を守っていると止まらない。',
  },
  // ふりこが 右の はしに 来た: 大ふりこの 前ぶれ → 次の 番に 大ふりこ（身を 守ると 半分）
  m6_pd_big_charge: {
    name: 'ふりこを高くふり上げる', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm6_pd_big' }, cast: '{a}のふりこが、右のはしで、高く高くふり上がった…！', anim: 'a6r_big_charge',
    desc: '次の番に「大ふりこ」。身を守ろう。',
  },
  m6_pd_big: {
    name: '大ふりこ', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 1.3, ignoreDef: 0.3 }, cast: '{a}の大ふりこ！\n大きなふりこが、みんなをまとめて、なぎはらう！', anim: 'a6r_big',
    desc: '大きなふりこで、敵みんなにとても大きなダメージ。身を守ると半分になる。',
  },
};
