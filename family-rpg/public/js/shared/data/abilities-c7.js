// 第2部 第7章 第1幕「緑の王国」の 魔物・ウツボきょうだい・オクタリア・ゲストの カリムの 技（B: 戦い。abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
// とくべつな こうか（c7Swirl … ふたごの大うずしお・c7Call … よびもどし・c7Steal … 声うばいの歌・c7Chorus … うばった声の大合唱）は
//   shared/battle-c7.js の c7Effect
// anim は a7_〜（手下）・a7g_〜（ウツボきょうだい）・a7t_〜（オクタリア）・a7k_〜（カリム）。client/render/battlefx-c7.js
export const C7_ABILITIES = {
  // ── ノコノコ ──
  m7_nk_shell: {
    name: 'こうらアタック', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.35 }, cast: '{a}は、こうらに頭と手足をしまって、くるくるっとすべってきた！', anim: 'a7_shell',
    desc: 'こうらに入ってすべり、1人に大きなダメージ。',
  },
  m7_nk_hide: {
    name: 'こうらにかくれる', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.35 }, cast: '{a}は、こうらに首と手足をひっこめた！', anim: 'guard',
    desc: 'こうらに頭と手足をしまって、守りを上げる。',
  },
  // ── パックンフラワー ──
  m7_pk_bite: {
    name: 'パックンかみつき', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}は、大きな口で、{t}にパクッ！とかみついた！', anim: 'a7_chomp',
    desc: '大きな口で、1人に大きなダメージ。',
  },
  m7_pk_fire: {
    name: '火の玉', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'magic', base: [132, 152], thr: 99, element: 'fire' }, cast: '{a}は、口から火の玉をポンッ！とはいた！', anim: 'a7_fireball',
    desc: '口から火の玉をはいて、1人に炎のダメージ。',
  },
  // ── トランプの兵 ──
  m7_cs_spear: {
    name: 'ハートのやり', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.3 }, cast: '{a}は、ハートのやりで、{t}をついた！', anim: 'a7_spear',
    desc: 'やりで、1人に大きなダメージ。',
  },
  m7_cs_march: {
    name: 'トランプの行進', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'phys', mult: 0.6 }, cast: '{a}は、ずらりとならんで、ザッザッと行進してきた！', anim: 'a7_cards',
    desc: 'ならんで行進して、敵みんなにダメージ。',
  },
  // ── 使いのカラス ──
  m7_cw_peck: {
    name: 'つつきまわす', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 0.72, hits: 2 }, cast: '{a}は、{t}を、くちばしでつつきまわした！', anim: 'a7_peck',
    desc: 'くちばしで、1人を2回つつく。',
  },
  m7_cw_hex: {
    name: 'みどりの目', kind: 'monster', mp: 5, target: 'enemy',
    effect: { type: 'magic', base: [130, 150], thr: 99, element: 'dark' }, cast: '{a}の目が、あやしいみどり色に光った…！', anim: 'a7_hex',
    desc: 'あやしい目の光で、1人に闇のダメージ。',
  },
  m7_cw_caw: {
    name: 'カァカァさわぐ', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'confuse', chance: 0.18, turns: [1, 2] }, cast: '{a}は、頭の上で、カァカァとさわぎ立てた！', anim: 'a7_caw',
    desc: 'さわぎ立てて、敵みんなを混乱させることがある。',
  },
  // ── うずしおウツボ ──
  m7_ue_bite: {
    name: 'ウツボのキバ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.35 }, cast: '{a}は、水の中から、{t}にガブリとかみついた！', anim: 'bite',
    desc: 'するどいキバで、1人に大きなダメージ。',
  },
  m7_ue_swirl: {
    name: '小さなうずしお', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'magic', base: [74, 88], thr: 99, element: 'water' }, cast: '{a}は、ぐるぐると回って、うずしおをおこした！', anim: 'whirlpool',
    desc: 'うずしおをおこして、敵みんなに水のダメージ。',
  },
  // ── 行進のほうき ──
  m7_mb_bucket: {
    name: 'バケツの水', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', base: [130, 150], thr: 99, element: 'water' }, cast: '{a}は、バケツの水を、{t}にザバーッ！とかけた！', anim: 'a7_bucket',
    desc: 'バケツの水をかけて、1人に水のダメージ。',
  },
  m7_mb_sweep: {
    name: 'はきそうじ', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'phys', mult: 0.58 }, cast: '{a}は、ザッザッと、みんなをはきとばした！', anim: 'a7_sweep',
    desc: 'ほうきではいて、敵みんなにダメージ。',
  },
  m7_mb_more: {
    name: 'ほうきの行進', kind: 'monster', target: 'self',
    effect: { type: 'callHelp', species: 'march_broom' }, cast: '{a}の、うしろから…ザッザッザッ…！', anim: 'none',
    desc: 'もう1本のほうきが、行進してくる。',
  },
  // ── ゲッソー ──
  m7_gs_dash: {
    name: 'ふわふわ体当たり', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.3 }, cast: '{a}は、ふわっと上がって、{t}にまっすぐおりてきた！', anim: 'tackle',
    desc: '上からまっすぐおりてきて、1人に大きなダメージ。',
  },
  m7_gs_ink: {
    name: 'すみをはく', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'magic', base: [64, 78], thr: 99, element: 'water' }, { type: 'status', status: 'blind', chance: 0.25, turns: [2, 3] }] },
    cast: '{a}は、まっ黒なすみを、ブシューッ！とはいた！', anim: 'a7_ink',
    desc: 'すみをはいて、敵みんなに水のダメージ。まぼろしに包むことがある。',
  },
  // ── テレサ ──
  m7_tr_boo: {
    name: 'うしろからおどかす', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.45 }, cast: '{a}は、{t}のうしろから、そーっと近づいて…ばあっ！', anim: 'a7_boo',
    desc: 'うしろからおどかして、1人に大きなダメージ。',
  },
  m7_tr_shy: {
    name: 'はずかしがる', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'eva', add: 0.25, dur: 30 }, cast: '{a}は、両手で顔をかくして、すきとおってしまった！', anim: 'buff',
    desc: '顔をかくしてすきとおり、攻撃を当たりにくくする。',
  },
  m7_tr_tongue: {
    name: 'べろべろ', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'status', status: 'confuse', chance: 0.35, turns: [1, 2] }, cast: '{a}は、長いべろを出して、{t}をからかった！', anim: 'a7_tongue',
    desc: 'べろを出してからかい、1人を混乱させることがある。',
  },
  // ── 水のようま ──
  m7_wy_lash: {
    name: '水のムチ', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', base: [136, 156], thr: 99, element: 'water' }, cast: '{a}は、水をムチのようにしならせて、{t}を打った！', anim: 'water_shot',
    desc: '水のムチで、1人に水のダメージ。',
  },
  m7_wy_drain: {
    name: '元気をすいとる', kind: 'monster', mp: 5, target: 'enemy',
    effect: { type: 'drainHp', mult: 1.0 }, cast: '{a}は、{t}の元気を、すうっとすいとった！', anim: 'a7_drain',
    desc: '1人の元気をすいとって、自分のHPを回復する。',
  },
  m7_wy_mist: {
    name: 'つめたいきり', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'debuff', stat: 'agi', mult: 0.8, chance: 0.45 }, cast: '{a}は、つめたいきりを、あたりにひろげた…', anim: 'a7_mist',
    desc: 'きりで、敵みんなの素早さを下げることがある。',
  },
  // ── のろいだま ──
  m7_cl_hands: {
    name: 'たくさんの手', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 0.55, hits: 3 }, cast: '{a}の体から、たくさんの手がのびてきた！', anim: 'a7_hands',
    desc: 'たくさんの手で、1人を3回たたく。',
  },
  m7_cl_eye: {
    name: 'のろいの目', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'status', status: 'paralyze', chance: 0.3, turns: [1, 2] }, cast: '{a}の、たくさんの目が、{t}をにらみつけた…！', anim: 'a7_eye',
    desc: 'たくさんの目でにらんで、1人をマヒさせることがある。',
  },
  m7_cl_storm: {
    name: 'のろいのうず', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', base: [80, 96], thr: 99, element: 'dark' }, cast: '{a}から、のろいのうずがふき出した…！', anim: 'a7_curse',
    desc: 'のろいのうずで、敵みんなに闇のダメージ。',
  },

  // ── 水門の ウツボきょうだい（中ボス）──
  m7g_bite: {
    name: 'ふたごのキバ', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.25 }, cast: '{a}は、水門のすき間から、{t}にガブリとかみついた！', anim: 'bite',
    desc: '大きなキバで、1人に大きなダメージ。',
  },
  m7g_tail: {
    name: 'しっぽの大波', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 0.62, element: 'water' }, cast: '{a}は、しっぽで水面をたたいた！大波がおしよせる！', anim: 'big_wave',
    desc: 'しっぽで大波をおこして、敵みんなに水のダメージ。',
  },
  m7g_spark: {
    name: 'でんきウツボ', kind: 'monster', target: 'enemy',
    effect: { type: 'magic', base: [150, 170], thr: 99, element: 'bolt' }, cast: '{a}の体が、バチバチッと光った！', anim: 'a7g_spark',
    desc: '体から雷を出して、1人に雷のダメージ。',
  },
  m7g_swirl: {
    name: 'ふたごの大うずしお', kind: 'monster', target: 'enemies',
    effect: { type: 'c7Swirl' }, cast: '2ひきのウツボが、ぐるぐるぐる…と、まわりを回り出した！\n「せーの…！ふたごの大うずしお！」', anim: 'a7g_swirl',
    desc: '2ひきがそろっている時だけ。いきがたまると、敵みんなにとても大きなダメージ。身を守ると半分になる。',
  },
  m7g_call: {
    name: 'よびもどし', kind: 'monster', target: 'self',
    effect: { type: 'c7Call' }, cast: '{a}は、水の底にむかって、大きな声でよんだ！', anim: 'a7g_call',
    desc: 'たおれたきょうだいを、よびもどす。2ひきとも、少し強くなる。',
  },

  // ── うずの魔女オクタリア（神殿の ボス）──
  m7t_arms: {
    name: '8本の足', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 0.5, hits: 3 }, cast: '{a}の長い足が、{t}を、ビシッ、ビシッ、ビシッ！', anim: 'a7t_arms',
    desc: '長い足で、1人を3回たたく。',
  },
  m7t_wave: {
    name: 'くらい大波', kind: 'monster', target: 'enemies',
    effect: { type: 'magic', base: [130, 150], thr: 99, element: 'water' }, cast: '{a}は、両手を上げて、くらい大波をよんだ！', anim: 'big_wave',
    desc: '大波をよんで、敵みんなに水のダメージ。',
  },
  m7t_ink: {
    name: '魔女のすみ', kind: 'monster', target: 'enemies',
    effect: { type: 'status', status: 'blind', chance: 0.3, turns: [2, 3] }, cast: '{a}は、むらさき色のすみを、ぶわっとはいた！', anim: 'a7_ink',
    desc: 'すみで、敵みんなをまぼろしに包むことがある。',
  },
  m7t_curse: {
    name: 'けいやくののろい', kind: 'monster', target: 'enemy',
    effect: { type: 'debuff', stat: 'def', mult: 0.75, chance: 0.7 }, cast: '{a}「…この紙に、名前を書いておくれ。」\n{t}の体に、金色の文字がまきついた！', anim: 'a7t_contract',
    desc: 'けいやくののろいで、1人の守りを下げることがある。',
  },
  m7t_trident: {
    name: '三つまたのいかずち', kind: 'monster', target: 'enemy',
    effect: { type: 'magic', base: [230, 260], thr: 99, element: 'bolt' }, cast: '{a}は、三つまたのほこを、{t}にむけた！\nいかずちが走る！', anim: 'a7t_trident',
    desc: '三つまたのほこから雷を落として、1人に雷の大ダメージ。',
  },
  m7t_steal: {
    name: '声うばいの歌', kind: 'monster', target: 'enemy',
    effect: { type: 'c7Steal' }, cast: '{a}は、あまい声で歌い出した…♪\n「その声…あたしに、ちょうだい…」', anim: 'a7t_steal',
    desc: '1人の声をうばって、声の貝にすいこむ。声をうばわれると、呪文が使えない。声の貝をこわすと、もどる。',
  },
  m7t_chorus: {
    name: 'うばった声の大合唱', kind: 'monster', target: 'enemies',
    effect: { type: 'c7Chorus' }, cast: '声の貝が、ぱかっと開いた…！\nうばわれた声が、{a}といっしょに歌い出す！', anim: 'a7t_chorus',
    desc: '声がたまると使う。敵みんなに、とても大きな呪文のダメージ。たまった声が多いほど強い。声の貝をこわすと止まる。',
  },
  // 声の貝（動かない）
  m7t_shell_glow: {
    name: 'ひかる', kind: 'monster', target: 'self',
    effect: { type: 'nothing' }, cast: '{a}の中で、うばわれた声が、かすかにないている…', anim: 'none',
    desc: '何もしない。',
  },

  // ── ゲストの カリム（千年前の 若い 騎士。data/companions-c7.js の KARIM_GUEST）──
  kr7_shield: {
    name: '王家のたて', kana: 'おうけのたて', kind: 'skill', mp: 12, target: 'allies',
    effect: { type: 'buff', stat: 'def', mult: 1.35, dur: 30 }, cast: '{a}は、王家の紋章のたてを、高くかかげた！\n「みんな、ぼくのうしろへ…！」', anim: 'a7k_shield',
    desc: '王家のたてをかかげて、仲間みんなの守備力を大きく上げる。',
  },
};
