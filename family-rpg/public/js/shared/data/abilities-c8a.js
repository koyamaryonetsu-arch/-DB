// 第2部 第8章 第1幕「月の王宮の うらぎり」の 魔物・オウムのイアゴン・大臣ジャハール（大きな コブラ・ランプの 魔人）の 技（B: 戦い。abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
// とくべつな こうか（c8aEcho … オウムがえし・c8aDizzy … 目をまわした・c8aHypno … さいみんじゅつ・c8aCobra … 大へびの姿・c8aDaze … つえがない・
//   c8aCoil … とぐろをまく・c8aStrike … 大へびのいちげき・c8aGenie … ランプの魔人・c8aBlast … むげんの魔力・c8aSealed … ランプの中）は
//   shared/battle-c8a.js の c8aEffect
// desc は 1文めで 何を するか わかる ように（スマホの たて持ちは 1文めだけ 出る。client/ui/skillinfo.js の firstSentence）
// anim は a8n_〜（手下）・a8p_〜（イアゴン）・a8j_〜（ジャハール）・a8c_〜（大きな コブラ）・a8g_〜（ランプの 魔人）。client/render/battlefx-c8a.js
export const C8A_ABILITIES = {
  // ── 宮殿の衛兵 ──
  m8n_pg_slash: {
    name: '三日月ぎり', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.35 }, cast: '{a}は、三日月の形の刀で、{t}に切りかかった！', anim: 'a8n_slash',
    desc: '三日月の刀で、1人に大きなダメージ。',
  },
  m8n_pg_rush: {
    name: 'いっせいにかかれ', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'phys', mult: 0.62 }, cast: '{a}「くせ者だ！いっせいにかかれー！」', anim: 'a8n_rush',
    desc: 'みんなでかかってきて、敵みんなにダメージ。',
  },
  m8n_pg_guard: {
    name: '衛兵のかまえ', kind: 'monster', mp: 3, target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.25 }, cast: '{a}は、刀をかまえて、守りをかためた！', anim: 'a8n_guard',
    desc: '刀をかまえて、自分の守りを上げる。',
  },
  // ── サンボ ──
  m8n_sb_needle: {
    name: 'サボテンのはり', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 1.2 }, { type: 'status', status: 'poison', chance: 0.25, turns: [3, 4] }] },
    cast: '{a}は、とげを、{t}にちくちくとさした！', anim: 'a8n_needle',
    desc: 'とげで、1人にダメージ。毒にすることがある。',
  },
  m8n_sb_roll: {
    name: 'ころころタックル', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'phys', mult: 0.6 }, cast: '{a}の体が、ばらばらになって、ころころところがってきた！', anim: 'a8n_roll',
    desc: 'ころがってきて、敵みんなにダメージ。',
  },
  m8n_sb_grow: {
    name: 'にょきにょき', kind: 'monster', mp: 3, target: 'self',
    effect: { type: 'buff', stat: 'atk', mult: 1.25 }, cast: '{a}の体が、にょきにょきと高くのびた！', anim: 'a8n_grow',
    desc: '体をのばして、自分の攻撃力を上げる。',
  },
  // ── コブラー ──
  m8n_cb_bite: {
    name: 'どくのキバ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 1.2 }, { type: 'status', status: 'poison', chance: 0.35, turns: [3, 4] }] },
    cast: '{a}は、{t}に、どくのキバでかみついた！', anim: 'a8n_bite',
    desc: 'どくのキバで、1人にダメージ。毒にすることがある。',
  },
  m8n_cb_jump: {
    name: 'つぼからとび出す', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.45 }, cast: '{a}が、つぼの中から、{t}めがけてとび出した！', anim: 'a8n_jump',
    desc: 'つぼからとび出して、1人に大きなダメージ。',
  },
  m8n_cb_glare: {
    name: 'へびにらみ', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'paralyze', chance: 0.18, turns: [1, 1] }, cast: '{a}は、ぎろりと、みんなをにらみつけた！', anim: 'a8n_glare',
    desc: 'にらみつけて、敵みんなを動けなくすることがある。',
  },
  // ── ランプのけむり ──
  m8n_ls_smoke: {
    name: 'むらさきのけむり', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', base: [88, 104], thr: 99, element: 'dark' }, cast: '{a}から、むらさきのけむりが、もくもくとあふれ出した！', anim: 'a8n_smoke',
    desc: 'むらさきのけむりで、敵みんなに闇のダメージ。',
  },
  m8n_ls_haze: {
    name: 'まどわしのけむり', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'status', status: 'confuse', chance: 0.25, turns: [1, 2] }, cast: '{a}が、あまいにおいのけむりを、ふわふわとまいた…', anim: 'a8n_haze',
    desc: 'けむりで、敵みんなをこんらんさせることがある。',
  },
  m8n_ls_arm: {
    name: 'けむりのうで', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 0.7, hits: 2 }, cast: '{a}から、けむりのうでがのびて、{t}をつかんだ！', anim: 'a8n_arm',
    desc: 'けむりのうでで、1人を2回打つ。',
  },
  // ── 月のスカラベ ──
  m8n_ms_beam: {
    name: '月の光', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', base: [134, 154], thr: 99, element: 'light' }, cast: '{a}のせなかが、月の光を集めて、{t}にはなった！', anim: 'a8n_beam',
    desc: '月の光をはなち、1人に光の大きなダメージ。',
  },
  m8n_ms_split: {
    name: 'ふたつにわれる', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'phys', mult: 0.45, hits: 2 }, cast: '{a}が、パカッと2つにわれて、とび回った！', anim: 'a8n_split',
    desc: '2つにわれてとび回り、敵みんなを2回打つ。',
  },
  m8n_ms_shine: {
    name: '銀のかがやき', kind: 'monster', mp: 3, target: 'self',
    effect: { type: 'buff', stat: 'eva', add: 0.15, dur: 30 }, cast: '{a}が、銀色にかがやいた！', anim: 'a8n_shine',
    desc: 'かがやいて、攻撃を当たりにくくする。',
  },

  // ── オウムのイアゴン（中ボス）──
  m8p_peck: {
    name: 'くちばしつつき', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.35 }, cast: '{a}は、大きなくちばしで、{t}をつつきまくった！', anim: 'a8p_peck',
    desc: 'くちばしで、1人に大きなダメージ。',
  },
  m8p_gust: {
    name: 'はばたきの風', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 0.64, element: 'wind' }, cast: '{a}は、大きなつばさで、バッサバッサとはばたいた！', anim: 'a8p_gust',
    desc: 'はばたきの風で、敵みんなに風のダメージ。',
  },
  m8p_jewel: {
    name: '宝石どろぼう', kind: 'monster', target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 1.0 }, { type: 'dispel' }] },
    cast: '{a}「キラキラしたもの、いただきー！」\n{t}の強くなる力をぬすんで、宝石を投げつけた！', anim: 'a8p_jewel',
    desc: '1人の強くなる力をぬすみ、宝石を投げつける。',
  },
  m8p_chatter: {
    name: 'ぺちゃくちゃ', kind: 'monster', target: 'enemies',
    effect: { type: 'debuff', stat: 'mag', mult: 0.8, chance: 0.5 }, cast: '{a}「ペチャクチャ、ペチャクチャ…あーあ、つかれた！」', anim: 'a8p_chatter',
    desc: 'しゃべりまくって、敵みんなの魔力を下げることがある。',
  },
  m8p_echo: {
    name: 'オウムがえし', kind: 'monster', target: 'enemies',
    effect: { type: 'c8aEcho' }, cast: '{a}「オウムがえしだ！」', anim: 'a8p_echo',
    desc: '聞き耳の間に覚えた呪文を、敵みんなにはね返す。身を守ると半分になる。',
  },
  m8p_dizzy: {
    name: '目をまわした', kind: 'monster', target: 'self',
    effect: { type: 'c8aDizzy' }, cast: '{a}は、目をくるくるまわしている…', anim: 'a8p_dizzy',
    desc: 'オウムがえしにしっぱいして、動けない。',
  },

  // ── 大臣ジャハール（1だんめ: へびの つえの 魔術師）──
  m8j_ray: {
    name: 'つえの赤い光', kind: 'monster', target: 'enemy',
    effect: { type: 'magic', base: [214, 244], thr: 99, element: 'fire' }, cast: '{a}のへびのつえの目から、赤い光がほとばしった！', anim: 'a8j_ray',
    desc: 'つえの赤い光で、1人に炎の大ダメージ。',
  },
  m8j_sand: {
    name: '大臣のすなあらし', kind: 'monster', target: 'enemies',
    effect: { type: 'magic', base: [140, 162], thr: 99, element: 'wind' }, cast: '{a}がつえをふると、すなあらしがまき起こった！', anim: 'a8j_sand',
    desc: 'すなあらしで、敵みんなに風のダメージ。',
  },
  m8j_laugh: {
    name: '大臣のわらい', kind: 'monster', target: 'enemies',
    effect: { type: 'debuff', stat: 'def', mult: 0.8, chance: 0.5 }, cast: '{a}「フフフ…ハーッハッハ！王国は、わたしのものだ！」', anim: 'a8j_laugh',
    desc: 'わらい声で、敵みんなの守りを下げることがある。',
  },
  m8j_hypno: {
    name: 'さいみんじゅつ', kind: 'monster', target: 'enemy',
    effect: { type: 'c8aHypno' }, cast: '{a}「わたしの目を見るのだ…おまえは、わたしの思うがまま…」\nへびのつえの目が、あやしく光った！', anim: 'a8j_hypno',
    desc: '1人をあやつって、こんらんさせる。へびのつえをこわすと、とける。',
  },
  m8j_daze: {
    name: 'つえがない！', kind: 'monster', target: 'self',
    effect: { type: 'c8aDaze' }, cast: '{a}「つ、つえが…！わたしのつえが…！」', anim: 'a8j_daze',
    desc: 'つえをこわされて、うろたえている。動けない。',
  },
  m8j_cobra: {
    name: '大へびの姿', kind: 'monster', target: 'self',
    effect: { type: 'c8aCobra' }, cast: '{a}「へびのようにずるがしこいと言ったな…ならば、へびになってやろう！」', anim: 'a8j_cobra',
    desc: '大きなコブラに姿をかえる。へびのつえは消える。',
  },
  m8j_staff_glow: {
    name: 'ルビーのかがやき', kind: 'monster', target: 'self',
    effect: { type: 'nothing' }, cast: '{a}のルビーの目が、ぎらりと光った…', anim: 'none',
    desc: 'つえの目が光る。何もしない。',
  },

  // ── 大きな コブラ（2だんめ）──
  m8c_bite: {
    name: '大へびのキバ', kind: 'monster', target: 'enemy',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 1.4 }, { type: 'status', status: 'poison', chance: 0.4, turns: [3, 4] }] },
    cast: '{a}は、大きなキバで、{t}にかみついた！', anim: 'a8c_bite',
    desc: '大きなキバで、1人に大ダメージ。毒にすることがある。',
  },
  m8c_tail: {
    name: 'しっぽのむち', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 0.66 }, cast: '{a}は、長いしっぽを、ムチのようにしならせた！', anim: 'a8c_tail',
    desc: 'しっぽをしならせ、敵みんなにダメージ。',
  },
  m8c_hiss: {
    name: 'シャーッ！', kind: 'monster', target: 'enemies',
    effect: { type: 'debuff', stat: 'atk', mult: 0.8, chance: 0.5 }, cast: '{a}「シャーーーッ！」', anim: 'a8c_hiss',
    desc: 'いかくして、敵みんなの攻撃力を下げることがある。',
  },
  m8c_coil: {
    name: 'とぐろをまく', kind: 'monster', target: 'self',
    effect: { type: 'c8aCoil' }, cast: '{a}は、長い体で、ぐるぐるととぐろをまいた…', anim: 'a8c_coil',
    desc: 'とぐろをまいて、攻撃してきた人にかみつく。次の番に大技。',
  },
  m8c_strike: {
    name: '大へびのいちげき', kind: 'monster', target: 'enemies',
    effect: { type: 'c8aStrike' }, cast: '{a}は、とぐろをほどいて、いきおいよくとびかかった！', anim: 'a8c_strike',
    desc: 'とびかかって、敵みんなに大ダメージ。とぐろの間にかみついた数だけ強い。',
  },
  m8c_genie: {
    name: 'ランプの魔人', kind: 'monster', target: 'self',
    effect: { type: 'c8aGenie' }, cast: '{a}「まだだ…！わたしは、世界一強いランプの魔人になるのだ！」', anim: 'a8j_genie',
    desc: 'ランプの魔人に姿をかえる。黒いランプがあらわれる。',
  },

  // ── ランプの 魔人（3だんめ）──
  m8g_fist: {
    name: '魔人のげんこつ', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.45 }, cast: '{a}は、大きなげんこつを、{t}にふり下ろした！', anim: 'a8g_fist',
    desc: '大きなげんこつで、1人に大ダメージ。',
  },
  m8g_fire: {
    name: '魔人のほのお', kind: 'monster', target: 'enemies',
    effect: { type: 'magic', base: [150, 172], thr: 99, element: 'fire' }, cast: '{a}の手のひらから、赤いほのおがうずまいた！', anim: 'a8g_fire',
    desc: 'ほのおをうずまかせ、敵みんなに炎のダメージ。',
  },
  m8g_wish: {
    name: 'ねがいの力', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'atk', mult: 1.2 }, cast: '{a}「わがねがいは…もっと、もっと強い力だ！」', anim: 'a8g_wish',
    desc: 'ねがいの力で、自分の攻撃力を上げる。',
  },
  m8g_blast: {
    name: 'むげんの魔力', kind: 'monster', target: 'enemies',
    effect: { type: 'c8aBlast' }, cast: '{a}「宇宙一の魔人の力を、思い知るがいい…！」\n黒いランプから、むげんの魔力があふれ出した！', anim: 'a8g_blast',
    desc: '魔力をあふれさせ、敵みんなに闇の大ダメージ。身を守ると半分になる。',
  },
  m8g_sealed: {
    name: 'ランプの中', kind: 'monster', target: 'self',
    effect: { type: 'c8aSealed' }, cast: '{a}は、ランプの中で、じたばたしている…', anim: 'a8g_sealed',
    desc: 'ランプにすいこまれて、動けない。',
  },
  m8g_lamp_glow: {
    name: 'ランプのゆらめき', kind: 'monster', target: 'self',
    effect: { type: 'nothing' }, cast: '{a}の火が、ゆらりとゆれた…', anim: 'none',
    desc: 'ランプの火がゆれる。何もしない。',
  },
};
