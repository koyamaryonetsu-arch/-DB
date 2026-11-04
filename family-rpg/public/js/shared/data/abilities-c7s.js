// 第2部 第7章 第2幕「海の紋章」の 魔物・ジョリーホック号・ホック船長・ゲストの カイの 技（B: 戦い。abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
// とくべつな こうか（c7sBroadside … いっせいほうげき・c7sPlank … 板わたりの号令・c7sDrop … ドボン！）は shared/battle-c7s.js の c7sEffect
// desc は 1文めで 何を するか わかる ように（スマホの たて持ちは 1文めだけ 出る。client/ui/skillinfo.js の firstSentence）
// anim は a7s_〜（手下）・a7r_〜（ジョリーホック号）・a7l_〜（ホック船長）・a7y_〜（カイ）。client/render/battlefx-c7s.js
export const C7S_ABILITIES = {
  // ── プクプク ──
  m7s_pk_jump: {
    name: 'ピョーンととびつく', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.3 }, cast: '{a}は、海からピョーンととび出して、{t}に体当たりした！', anim: 'a7s_jump',
    desc: 'とびはねて、1人に大きなダメージ。',
  },
  m7s_pk_splash: {
    name: '水しぶき', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [72, 86], thr: 99, element: 'water' }, cast: '{a}は、しっぽで、海の水をバシャーン！とはね上げた！', anim: 'a7s_splash',
    desc: '水しぶきで、敵みんなに水のダメージ。',
  },
  // ── カロン ──
  m7s_kr_bone: {
    name: 'ほねのブーメラン', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 0.7, hits: 2 }, cast: '{a}は、自分のほねをはずして、ブーメランのように投げた！', anim: 'a7s_bone',
    desc: 'ほねを投げて、1人を2回打つ。',
  },
  m7s_kr_crumble: {
    name: 'バラバラになる', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.4 }, cast: '{a}は、ガラガラッとくずれて…また組み上がった！', anim: 'a7s_crumble',
    desc: 'くずれて組み上がり、守りを上げる。',
  },
  // ── ジュゲム ──
  m7s_jg_spiny: {
    name: 'トゲのたま', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.35 }, cast: '{a}は、雲の上から、トゲトゲのたまを、{t}に落とした！', anim: 'a7s_spiny',
    desc: 'トゲのたまを落として、1人に大きなダメージ。',
  },
  m7s_jg_rain: {
    name: '雲の大雨', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'magic', base: [76, 90], thr: 99, element: 'water' }, cast: '{a}ののった雲が、ザーッと大雨をふらせた！', anim: 'a7s_rain',
    desc: '大雨をふらせて、敵みんなに水のダメージ。',
  },
  m7s_jg_cloud: {
    name: '雲にかくれる', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'eva', add: 0.22, dur: 30 }, cast: '{a}は、雲の中に、すっぽりかくれてしまった！', anim: 'buff',
    desc: '雲にかくれて、攻撃を当たりにくくする。',
  },
  // ── 魚人の海賊 ──
  m7s_fp_saber: {
    name: '海賊のサーベル', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.35 }, cast: '{a}は、サーベルで、{t}に切りかかった！', anim: 'a7s_saber',
    desc: 'サーベルで、1人に大きなダメージ。',
  },
  m7s_fp_karate: {
    name: '魚人のからて', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.15, ignoreDef: 0.4, element: 'water' }, cast: '{a}は、水をまとった手で、{t}をドンッ！とついた！', anim: 'a7s_karate',
    desc: '守りをつきぬける手で、1人に水のダメージ。',
  },
  m7s_fp_shout: {
    name: 'かかれー！', kind: 'monster', mp: 3, target: 'self',
    effect: { type: 'buff', stat: 'atk', mult: 1.25 }, cast: '{a}「者ども、かかれー！」', anim: 'a7s_shout',
    desc: '大声を上げて、自分の攻撃力を上げる。',
  },
  // ── 海賊オウム ──
  m7s_pp_peck: {
    name: 'くちばしつつき', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 0.72, hits: 2 }, cast: '{a}は、{t}を、くちばしでつつきまわした！', anim: 'a7s_peck',
    desc: 'くちばしで、1人を2回つつく。',
  },
  m7s_pp_mimic: {
    name: '口まね', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'status', status: 'confuse', chance: 0.35, turns: [1, 2] }, cast: '{a}「{t}のまね！{t}のまね！」\n{t}は、頭がこんがらがってきた…', anim: 'a7s_mimic',
    desc: '口まねでからかい、1人を混乱させることがある。',
  },
  m7s_pp_curse: {
    name: 'いじわるな歌', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'magic', base: [82, 96], thr: 99, element: 'dark' }, cast: '{a}は、いじわるな歌を、ガーガー歌い出した！', anim: 'a7s_song',
    desc: 'いじわるな歌で、敵みんなに闇のダメージ。',
  },

  // ── 海賊船ジョリーホック号（中ボス）──
  m7r_cannon: {
    name: 'たいほう', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.3, element: 'fire' }, cast: '{a}のたいほうが、{t}にむかって、ドーン！', anim: 'a7r_cannon',
    desc: 'たいほうをうって、1人に炎の大ダメージ。',
  },
  m7r_crew: {
    name: '手下のきりこみ', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 0.58 }, cast: '{a}から、海賊の手下たちが、ロープでとびうつってきた！', anim: 'a7r_crew',
    desc: '手下たちがとびうつり、敵みんなにダメージ。',
  },
  m7r_barrel: {
    name: '火薬のたる', kind: 'monster', target: 'enemies',
    effect: { type: 'magic', base: [120, 140], thr: 99, element: 'fire' }, cast: '手下たちが、火のついたたるを、ごろごろ投げてきた！', anim: 'a7r_barrel',
    desc: 'たるがばくはつして、敵みんなに炎のダメージ。',
  },
  m7r_anchor: {
    name: 'いかりなげ', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.6 }, cast: '{a}の大きないかりが、くさりごと、{t}にふってきた！', anim: 'a7r_anchor',
    desc: '大きないかりを落として、1人にとても大きなダメージ。',
  },
  m7r_broadside: {
    name: 'いっせいほうげき', kind: 'monster', target: 'enemies',
    effect: { type: 'c7sBroadside' }, cast: 'しおが満ちて、{a}が、ぐんと近づいてきた！\n手下たち「たいほう、全部…うてーっ！」', anim: 'a7r_broadside',
    desc: '満ち潮の最後に、敵みんなへたいほうをうちまくる。身を守ると半分になる。そのあと、しおが引く。',
  },
  m7r_stuck: {
    name: 'ギシギシ…', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 0.32 }, cast: '{a}は、サンゴしょうにのり上げて、ぐらりとかたむいた！\nたるがころがってきた！', anim: 'a7r_stuck',
    desc: 'のり上げた船から、たるがころがってくる。小さなダメージ。',
  },

  // ── ホック船長（灯台の ボス）──
  m7l_hook: {
    name: '金のかぎ', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.35 }, cast: '{a}は、右手の金のかぎを、{t}にふり下ろした！', anim: 'a7l_hook',
    desc: '金のかぎで、1人に大きなダメージ。',
  },
  m7l_saber: {
    name: 'サーベル三だんづき', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 0.52, hits: 3 }, cast: '{a}「それ、それ、それーっ！」\nサーベルが、{t}を3回ついた！', anim: 'a7l_saber',
    desc: 'サーベルで、1人を3回つく。',
  },
  m7l_cannon: {
    name: 'たいほうの号令', kind: 'monster', target: 'enemies',
    effect: { type: 'magic', base: [130, 150], thr: 99, element: 'fire' }, cast: '{a}「たいほう、うてーっ！」\n海の上の船から、たいほうのたまがとんできた！', anim: 'a7l_cannon',
    desc: '船のたいほうで、敵みんなに炎のダメージ。',
  },
  m7l_laugh: {
    name: '高わらい', kind: 'monster', target: 'enemies',
    effect: { type: 'debuff', stat: 'atk', mult: 0.8, chance: 0.5 }, cast: '{a}「ハーッハッハ！子どもに、何ができる！」', anim: 'a7l_laugh',
    desc: '高わらいで、敵みんなの攻撃力を下げることがある。',
  },
  m7l_frenzy: {
    name: 'やけくそサーベル', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 0.7 }, cast: '{a}「チクタクなんか、こわくないぞーっ！」\nサーベルを、めちゃくちゃにふり回した！', anim: 'a7l_frenzy',
    desc: 'サーベルをふり回して、敵みんなにダメージ。',
  },
  m7l_plank: {
    name: '板わたりの号令', kind: 'monster', target: 'enemy',
    effect: { type: 'c7sPlank' }, cast: '{a}「そいつを、板の上へ歩かせろ！」', anim: 'a7l_plank',
    desc: '1人を板の先へ歩かせて、動けなくする。次に船長が動くと海へ落ちて、大波がおこる。仲間が「手をのばす」と、もどれる。',
  },
  m7l_drop: {
    name: 'ドボン！', kind: 'monster', target: 'enemies',
    effect: { type: 'c7sDrop' }, cast: '{a}「さあ、海へ…ドボンだ！」\n{a}は、かぎで板をガツン！とたたいた！', anim: 'a7l_drop',
    desc: '板の上の人を海へ落とし、大波で敵みんなにダメージ。身を守ると半分になる。',
  },

  // ── ゲストの カイ（千年前の 海の 小さな 島の 少年。data/companions-c7s.js の KAI_GUEST）──
  ky7_boomerang: {
    name: 'しおかぜブーメラン', kana: 'しおかぜぶーめらん', kind: 'skill', mp: 10, target: 'enemies',
    effect: { type: 'phys', mult: 0.9, hits: 2, ignoreDef: 0.75 }, cast: '{a}「いっくぞー！」\n{a}のブーメランが、しお風にのって、行って帰ってきた！', anim: 'a7y_boomerang',
    desc: 'ブーメランで、敵みんなを2回打つ。',
  },
};
