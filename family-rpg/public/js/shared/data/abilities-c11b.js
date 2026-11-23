// 第3部 第3章 第2幕「月の都と、名前のランプ」の 魔物・ランプの番人・月のむかえ オボロ・天人・「よびかける」の 技（B: 戦い。abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
// とくべつな こうか（c11bSwitch … 明かりが かわる〈全体攻撃〉・c11bRobe … わすれの 衣・c11bFlash … わすれの 光・c11bDrop … 天人が オボロを 回復・
//   c11bBow … オボロの おじぎ・c11bCall … よびかける）は shared/battle-c11b.js の c11bEffect
// desc は 1文めで 何を するか わかる ように（スマホの たて持ちは 1文めだけ 出る）
// anim は c11m_〜（ふつうの 魔物）・c11k_〜（ランプの番人）・c11o_〜（オボロ）・c11t_〜（天人）・c11b_call（よびかける）。client/render/battlefx-c11b.js
export const YOBIKAKE = 'm11_yobikake';
export const C11B_ABILITIES = {
  // ── つきあかりガ ──
  m11m_mt_powder: {
    name: '月のりんぷん', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', base: [176, 192], thr: 99, element: 'light' }, cast: '{a}が、はねをふって、光るこなを{t}にあびせた！', anim: 'c11m_powder',
    desc: '光るこなをあびせて、1人に光の大きなダメージ。',
  },
  m11m_mt_glow: {
    name: 'ランプまわり', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'confuse', chance: 0.15, turns: [1, 2] }, cast: '{a}が、くるくるとランプのまわりをとびまわった！', anim: 'c11m_glow',
    desc: 'くるくるとびまわって、敵みんなを混乱させることがある。',
  },
  // ── ろじうらぼうし ──
  m11m_kg_trip: {
    name: 'かげふみ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}が、{t}の足もとのかげを、ぎゅっとふんだ！', anim: 'c11m_trip',
    desc: '足もとのかげをふんで、1人に大きなダメージ。',
  },
  m11m_kg_hide: {
    name: 'ろじうらかくれ', kind: 'monster', mp: 3, target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.3 }, cast: '{a}は、うら道のかげに、すうっととけこんだ！', anim: 'c11m_hide',
    desc: 'かげにとけこんで、自分の守りを上げる。',
  },
  // ── やねのつきみネコ ──
  m11m_ct_claw: {
    name: 'やねからひっかき', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.42 }, cast: '{a}が、屋根からとび下りて、{t}をひっかいた！', anim: 'c11m_claw',
    desc: '屋根からとび下りて、1人に大きなダメージ。',
  },
  m11m_ct_moon: {
    name: 'つきみのうた', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.15, turns: [1, 2] }, cast: '{a}が、月を見上げて「にゃあ〜ん」と歌った！', anim: 'c11m_moon',
    desc: '月の歌で、敵みんなをねむらせることがある。',
  },
  // ── なふだランプ ──
  m11m_lp_flame: {
    name: 'なふだのほのお', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', base: [180, 196], thr: 99, element: 'fire' }, cast: '{a}の火が、ぼうっと大きくなって、{t}をつつんだ！', anim: 'c11m_flame',
    desc: 'ランプの火で、1人に炎の大きなダメージ。',
  },
  m11m_lp_name: {
    name: '名前よみ', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [108, 122], thr: 99, element: 'light' }, cast: '{a}が、札の名前を読み上げた！…でも、ちがう名前だ！', anim: 'c11m_name',
    desc: 'まちがった名前を読み上げて、敵みんなに光のダメージ。',
  },
  // ── はかりのへい ──
  m11m_gd_spear: {
    name: 'てんびんのやり', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}が、てんびんの形のやりで、{t}をついた！', anim: 'c11m_spear',
    desc: 'てんびんのやりでついて、1人に大きなダメージ。',
  },
  m11m_gd_scale: {
    name: '光をはかる', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'debuff', stat: 'atk', mult: 0.8, chance: 0.6 }, cast: '{a}が、{t}の光をはかって「…線より下です」と言った。', anim: 'c11m_scale',
    desc: '光をはかって、1人の攻撃力を下げる。',
  },
  // ── くすみぼし ──
  m11m_dm_bump: {
    name: 'すねてたいあたり', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.38 }, cast: '{a}が、ぷうっとふくれて、{t}にぶつかった！', anim: 'c11m_bump',
    desc: 'すねてぶつかって、1人に大きなダメージ。',
  },
  m11m_dm_dim: {
    name: 'くすみの光', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'status', status: 'blind', chance: 0.18, turns: [2, 3] }, cast: '{a}が、うすぼんやりと光った…。', anim: 'c11m_dim',
    desc: 'ぼんやりした光で、敵みんなの目をくらませることがある。',
  },
  // ── わすれぐも ──
  m11m_cl_mist: {
    name: 'わすれのきり', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', base: [178, 194], thr: 99, element: 'ice' }, cast: '{a}が、つめたいきりを、{t}にふきかけた！', anim: 'c11m_mist',
    desc: 'つめたいきりで、1人に氷の大きなダメージ。',
  },
  m11m_cl_rain: {
    name: 'ぼんやり雨', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [106, 120], thr: 99, element: 'ice' }, cast: '{a}から、ぼんやりした雨が、ぱらぱらとふってきた…', anim: 'c11m_rain',
    desc: 'ぼんやり雨で、敵みんなに氷のダメージ。',
  },

  // ── 中ボス: ランプの番人カンテラ ──
  m11k_bash: {
    name: 'ランプでゴツン', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 1.0 }, cast: '{a}が、大きなランプで、{t}をゴツンとたたいた！', anim: 'c11k_bash',
    desc: '大きなランプでたたいて、1人にダメージ。',
  },
  m11k_beam: {
    name: 'ランプの光線', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'magic', base: [560, 600], thr: 99, element: 'light' }, cast: '{a}のランプから、まっすぐな光が、{t}にのびた！', anim: 'c11k_beam',
    desc: 'まっすぐな光で、1人に光のダメージ。',
  },
  m11k_ring: {
    name: 'ランプのわ', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'magic', base: [300, 330], thr: 99, element: 'light' }, cast: '{a}のランプから、光のわが、ひろがった！', anim: 'c11k_ring',
    desc: '光のわで、敵みんなに光のダメージ。',
  },
  m11k_switch: {
    name: '明かりがかわる', kind: 'monster', target: 'enemies',
    effect: { type: 'c11bSwitch' }, cast: '{a}が、ランプを高くかかげた！', anim: 'c11k_switch',
    desc: '明かりがかわる時に、敵みんなに大きなダメージ。「防御」で、へらせる。',
  },

  // ── 幕の ボス: 月のむかえ オボロ ──
  m11o_whip: {
    name: '雲のむち', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 1.0 }, cast: '{a}が、雲のむちを、{t}にしならせた。「おどきください」', anim: 'c11o_whip',
    desc: '雲のむちで、1人にダメージ。',
  },
  m11o_moon: {
    name: 'つめたい月光', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'magic', base: [600, 640], thr: 99, element: 'ice' }, cast: '{a}「月の光は、つめとうございます」', anim: 'c11o_moon',
    desc: 'つめたい月の光で、敵みんなに氷のダメージ。',
  },
  m11o_bow: {
    name: 'ていねいなおじぎ', kind: 'monster', target: 'self',
    effect: { type: 'c11bBow' }, cast: '{a}は、ふかぶかと、おじぎをした。', anim: 'c11o_bow',
    desc: 'ていねいに、おじぎをしている。何もしない。',
  },
  m11o_robe: {
    name: 'わすれの衣', kind: 'monster', target: 'self',
    effect: { type: 'c11bRobe' }, cast: '{a}「ひめさま。下の世界のことは、すべて、おわすれください」', anim: 'c11o_robe',
    desc: 'スピカに衣をかけて、思い出を1つ消す。',
  },
  m11o_flash: {
    name: 'わすれの光', kind: 'monster', target: 'enemies',
    effect: { type: 'c11bFlash' }, cast: '{a}の衣が、白く光った！', anim: 'c11o_flash',
    desc: '敵みんなに光のダメージ。当たると、呪文か特技をわすれる。「防御」で、ふせげる。',
  },
  // ── 天人 ──
  m11t_sleeve: {
    name: 'そでのまい', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 0.9 }, cast: '{a}が、長いそでをひらりとふって、{t}をうった！', anim: 'c11t_sleeve',
    desc: '長いそでで、1人にダメージ。',
  },
  m11t_drop: {
    name: '月のしずく', kind: 'monster', target: 'self',
    effect: { type: 'c11bDrop' }, cast: '{a}が、月のしずくを、オボロにそそいだ。', anim: 'c11t_drop',
    desc: 'オボロのHPを、少し回復する。',
  },

  // ── だれでも（月のむかえ オボロの 戦いで。その 人の 番を 使う。ねらいは スピカか 味方 1人 … cmd.choice）──
  //   cmdOnly … 特技の 一覧には 出さない（コマンドの いちばん 上の「よびかける」から。client/battle.js）
  [YOBIKAKE]: {
    name: 'よびかける', kind: 'skill', mp: 0, target: 'self', noAuto: true, cmdOnly: true,
    effect: { type: 'c11bCall' }, cast: '{a}は、大きな声でよびかけた！', anim: 'c11b_call',
    desc: 'スピカか仲間の名前を、大きな声でよぶ。スピカの思い出がもどる。わすれた仲間は、すぐ思い出す。',
  },
};
