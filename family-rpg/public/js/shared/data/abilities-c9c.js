// 第3部 第1章 第3幕「さかさのピラミッド」の 魔物・ナゾカケ・ヒックリカエール2号・「こたえる」「ひっくり返す」の 技（B: 戦い。abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
// とくべつな こうか（c9zRiddle … なぞを 出す・c9zTimeout … 時間切れ・c9zRest … 正かいで 休む・c9zAnswer … こたえる・
//   c9sEmpty … 砂が 落ちきった・c9sBoom … 大ばくはつ・c9sDizzy … 目が回る・c9sAdd … 砂を 足す・c9sPochiUp … ポチッとねの 前ぶれ・
//   c9sPochi … ポチッとね・c9sFlip … ひっくり返す）は shared/battle-c9c.js の c9cEffect
// desc は 1文めで 何を するか わかる ように（スマホの たて持ちは 1文めだけ 出る）
// anim は c9c_〜（ふつうの 魔物）・c9z_〜（ナゾカケ）・c9s_〜（ヒックリカエール2号）・c9c_answer・c9c_flip。client/render/battlefx-c9c.js
export const ANSWER = 'm9_kotae';
export const FLIP = 'm9_hikkuri';
export const C9C_ABILITIES = {
  // ── どうくつの大なまず ──
  m9c_nz_gulp: {
    name: 'ぱっくんどろ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.42 }, cast: '{a}が、大きな口で、{t}にぱっくんとかみついた！', anim: 'c9c_gulp',
    desc: '大きな口でかみついて、1人に大きなダメージ。',
  },
  m9c_nz_quake: {
    name: 'ひげびりびり', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [104, 118], thr: 99, element: 'bolt' }, cast: '{a}の長いひげが、びりびりっと光った！', anim: 'c9c_whisker',
    desc: 'ひげから電気を出して、敵みんなに雷のダメージ。',
  },
  m9c_nz_mud: {
    name: 'どろしぶき', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 0.48 }, { type: 'status', status: 'blind', chance: 0.22, turns: [2, 3] }] },
    cast: '{a}が、しっぽで川のどろを、ばしゃっとはね上げた！', anim: 'c9c_mud',
    desc: 'どろをはね上げて、敵みんなにダメージ。目がくらむことがある。',
  },
  // ── 川べのガマ ──
  m9c_gm_tongue: {
    name: 'のびーるした', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.38 }, cast: '{a}の長いしたが、{t}にびよーんとのびた！', anim: 'c9c_tongue',
    desc: '長いしたをのばして、1人に大きなダメージ。',
  },
  m9c_gm_song: {
    name: 'ゲコゲコのうた', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.2, turns: [1, 2] }, cast: '{a}が、ゲコゲコ、ゲーコと歌い出した…', anim: 'c9c_song',
    desc: '敵みんなを、ねむらせることがある。',
  },
  m9c_gm_splash: {
    name: '川べのみずでっぽう', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', base: [150, 168], thr: 99, element: 'ice' }, cast: '{a}が、つめたい川の水を、ぴゅーっとふき出した！', anim: 'c9c_splash',
    desc: 'つめたい水をふき出して、1人に氷の大きなダメージ。',
  },
  // ── さかさコウモリ ──
  m9c_bt_fang: {
    name: 'さかさがみ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.38 }, cast: '{a}が、下から上へとびあがって、{t}にかみついた！', anim: 'c9c_fang',
    desc: '下からとびあがってかみつき、1人に大きなダメージ。',
  },
  m9c_bt_flip: {
    name: 'くるりんさかさ', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'status', status: 'confuse', chance: 0.16, turns: [1, 2] }, cast: '{a}が、くるくるさかさに回って、みんなの目を回した！', anim: 'c9c_flip9',
    desc: '敵みんなを、混乱させることがある。',
  },
  m9c_bt_swoop: {
    name: 'さかさまダイブ', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'phys', mult: 0.6 }, cast: '{a}が、ゆかから天じょうへ、さかさまにとびぬけた！', anim: 'c9c_swoop',
    desc: 'とびぬけて、敵みんなにダメージ。',
  },
  // ── 砂時計ゴーレム ──
  m9c_gl_punch: {
    name: 'すなどけいパンチ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.45 }, cast: '{a}の、石のうでが、{t}にドスンと当たった！', anim: 'c9c_gpunch',
    desc: '石のうででなぐって、1人に大きなダメージ。',
  },
  m9c_gl_sand: {
    name: 'さらさらすなあらし', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'phys', mult: 0.55 }, cast: '{a}の体から、砂がさらさらとふき出した！', anim: 'c9c_sandfall',
    desc: '砂をふき出して、敵みんなにダメージ。',
  },
  m9c_gl_turn: {
    name: 'くるっとひっくり返り', kind: 'monster', mp: 2, target: 'self',
    effect: { type: 'heal', base: [300, 340], thr: 99 }, cast: '{a}は、自分をくるっとひっくり返した！砂が、さらさら落ちはじめた。', anim: 'c9c_gturn',
    desc: '自分をひっくり返して、HPを回復する。',
  },
  // ── こがねスカラベ ──
  m9c_sc_horn: {
    name: 'こがねのツノ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.36 }, cast: '{a}が、金色のツノで、{t}をはね上げた！', anim: 'c9c_horn',
    desc: '金色のツノで、1人に大きなダメージ。',
  },
  m9c_sc_roll: {
    name: 'すなだまごろごろ', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'phys', mult: 0.56 }, cast: '{a}が、大きな砂の玉を、ごろごろころがしてきた！', anim: 'c9c_roll',
    desc: '砂の玉をころがして、敵みんなにダメージ。',
  },
  m9c_sc_shine: {
    name: 'こがねのひかり', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'status', status: 'blind', chance: 0.2, turns: [2, 3] }, cast: '{a}のせなかが、ぴかーっと金色に光った！', anim: 'c9c_shine',
    desc: '金色に光って、敵みんなの目をくらませることがある。',
  },
  // ── さかさミイラ ──
  m9c_mm_grab: {
    name: 'ほうたいつかみ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}の、上へなびくほうたいが、{t}をぐいっとつかんだ！', anim: 'c9c_grab',
    desc: 'ほうたいでつかんで、1人に大きなダメージ。',
  },
  m9c_mm_bandage: {
    name: 'ぐるぐるほうたい', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'debuff', stat: 'agi', mult: 0.8, chance: 0.4 }, cast: '{a}のほうたいが、みんなにぐるぐるまきついた！', anim: 'c9c_bandage',
    desc: 'ほうたいをまきつけて、敵みんなの素早さを下げることがある。',
  },
  m9c_mm_upside: {
    name: 'さかさまうらみ', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'magic', base: [150, 168], thr: 99, element: 'dark' }, cast: '{a}が、さかさまにうかんで、{t}をにらんだ！', anim: 'c9c_glare',
    desc: 'さかさまにうかんでにらみ、1人に闇の大きなダメージ。',
  },

  // ── 中ボス: なぞの番人 ナゾカケ ──
  m9z_claw: {
    name: '石のつめ', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 1.3 }, cast: '{a}の、石のつめが、天じょうから{t}にふり下ろされた！', anim: 'c9z_claw',
    desc: '石のつめで、1人に大きなダメージ。',
  },
  m9z_tail: {
    name: '石のしっぽ', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'phys', mult: 0.6 }, cast: '{a}が、さかさのまま、石のしっぽをぶうんとふった！', anim: 'c9z_tail',
    desc: '石のしっぽをふって、敵みんなにダメージ。',
  },
  m9z_gaze: {
    name: 'なぞめいた目', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'debuff', stat: 'atk', mult: 0.8, chance: 0.4 }, cast: '{a}が、なぞめいた目で、みんなをじっと見下ろした…', anim: 'c9z_gaze',
    desc: 'ふしぎな目で見つめて、敵みんなの攻撃力を下げることがある。',
  },
  m9z_roar: {
    name: 'ほえる石ぞう', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'magic', base: [380, 410], thr: 99, element: 'wind' }, cast: '{a}が、ゴオオオッと大きくほえた！', anim: 'c9z_roar',
    desc: '大きくほえて、敵みんなに風のダメージ。',
  },
  m9z_riddle: {
    name: 'なぞかけ', kind: 'monster', target: 'self',
    effect: { type: 'c9zRiddle' }, cast: '{a}「…なぞを、ひとつ。答えてみよ。」', anim: 'c9z_riddle',
    desc: 'なぞを1つ出す。答えるまで、なぞの守りでダメージをへらす。',
  },
  m9z_timeout: {
    name: '時間切れ', kind: 'monster', target: 'enemies',
    effect: { type: 'c9zTimeout' }, cast: '{a}「…時間切れだ！」', anim: 'c9z_timeout',
    desc: 'なぞに答えられなかった者たちに、石の雨をふらせる。',
  },
  m9z_rest: {
    name: 'うーむ、せいかい', kind: 'monster', target: 'self',
    effect: { type: 'c9zRest' }, cast: '{a}「…うーむ。せいかいだ。」', anim: 'c9z_rest',
    desc: '答えを聞いて、考えこむ。何もしない。',
  },

  // ── 幕の ボス: ヒックリカエール2号 ──
  m9s_punch: {
    name: '砂時計パンチ', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 1.3 }, cast: 'ズラッカ「えいっ、だっぺ！」\nメカの大きなうでが、{t}にドーンと当たった！', anim: 'c9s_punch',
    desc: 'メカのうでで、1人に大きなダメージ。',
  },
  m9s_sandgun: {
    name: 'すなすなほうしゃ', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'phys', mult: 0.62 }, cast: 'ボヤッチ「すなすなほうしゃ、発しゃでございマス！」\n砂が、ザザーッとふき出した！', anim: 'c9s_sandgun',
    desc: '砂をふき出して、敵みんなにダメージ。',
  },
  m9s_drill: {
    name: 'ドリルぐるぐる', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 1.55 }, cast: 'キラジョ「ドリルで、ほっちゃいなさい！」\nメカのドリルが、{t}に、ぐるぐるぐるっ！', anim: 'c9s_drill',
    desc: 'ドリルで、1人に大ダメージ。',
  },
  m9s_empty: {
    name: '砂が落ちきった', kind: 'monster', target: 'self',
    effect: { type: 'c9sEmpty' }, cast: 'ボヤッチ「あ、あら？砂が…」', anim: 'c9s_empty',
    desc: '砂が落ちきった。次に、大ばくはつする。',
  },
  m9s_boom: {
    name: '大ばくはつ', kind: 'monster', target: 'enemies',
    effect: { type: 'c9sBoom' }, cast: 'ドッカーーーン！！', anim: 'c9s_boom',
    desc: 'メカが大ばくはつして、敵みんなに大ダメージ。身を守ると、へらせる。',
  },
  m9s_dizzy: {
    name: '目が回る〜', kind: 'monster', target: 'self',
    effect: { type: 'c9sDizzy' }, cast: 'キラジョ「め、目が回る〜…」', anim: 'c9s_dizzy',
    desc: '中の3人の目が回って、動けない。',
  },
  m9s_add: {
    name: '砂を足す', kind: 'monster', target: 'self',
    effect: { type: 'c9sAdd' }, cast: 'キラジョ「ボヤッチ！砂を足しなさい！」', anim: 'c9s_add',
    desc: '砂を足して、砂が早く落ちるようになる。',
  },
  m9s_pochiup: {
    name: 'ボタンにゆびを', kind: 'monster', target: 'self',
    effect: { type: 'c9sPochiUp' }, cast: 'キラジョ「ボヤッチ、あれを使うのよ！」', anim: 'c9s_pochiup',
    desc: 'あやしいボタンに、ゆびをのばした。次に、1人に大きな一撃が来る。',
  },
  m9s_pochi: {
    name: 'ポチッとね', kind: 'monster', target: 'enemy',
    effect: { type: 'c9sPochi' }, cast: 'ボヤッチ「ポチッとね！」', anim: 'c9s_pochi',
    desc: 'ボタンをおして、1人に大きなダメージ。',
  },

  // ── こたえる（だれでも。その 人の 番を 使う。3つの 答えから えらぶ … cmd.choice）──
  //   kind 'riddle' … 呪文・特技の 一覧には 出ない（コマンドの いちばん 上の「こたえる」から えらぶ。client/battle-c9c.js）
  [ANSWER]: {
    name: 'こたえる', kind: 'riddle', mp: 0, target: 'self', noAuto: true,
    effect: { type: 'c9zAnswer' }, cast: '{a}は、なぞに答えた！', anim: 'c9c_answer',
    desc: 'ナゾカケのなぞに答える。3つの答えから、1つえらぶ。',
  },
  // ── ひっくり返す（だれでも。その 人の 番を 使う）──
  [FLIP]: {
    name: 'ひっくり返す', kind: 'skill', mp: 0, target: 'self', noAuto: true,
    effect: { type: 'c9sFlip' }, cast: '{a}は、メカの砂時計に、とびついた！', anim: 'c9c_flip',
    desc: 'メカの砂時計をひっくり返して、砂をもどす。砂が少ない時なら、中の3人の目が回る。',
  },
};
