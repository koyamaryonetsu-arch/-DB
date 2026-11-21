// 第3部 第1章 第4幕「星のはかば」の 魔物・あそびたい魔人 ムウ・スピカの「星のうた」の 技（B: 戦い。abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
// とくべつな こうか（c9mSplit … 2体に 分かれる・c9mWake … おきて、おきて！・c9mBeamUp … おかしビームの 前ぶれ・c9mBeam … おかしビーム・
//   c9mDoonUp … いっしょに ドーンの 前ぶれ・c9mDoon … いっしょに ドーン・c9dSong … 星のうた）は shared/battle-c9d.js の c9dEffect
// desc は 1文めで 何を するか わかる ように（スマホの たて持ちは 1文めだけ 出る）
// anim は c9d_〜（ふつうの 魔物・星のうた）・c9m_〜（ムウ）。client/render/battlefx-c9d.js
export const SONG = 'm9_hoshiuta';
export const C9D_ABILITIES = {
  // ── こだまのふたご ──
  m9d_tw_bump: {
    name: 'ふたりでごっつん', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.3 }, cast: '{a}が、手をつないだまま、{t}にごっつんとぶつかった！', anim: 'c9d_bump',
    desc: '手をつないでぶつかり、1人にダメージ。',
  },
  m9d_tw_echo: {
    name: 'こだまがえし', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [96, 110], thr: 99, element: 'wind' }, cast: '{a}が「ヤッホー！」とさけぶと、こだまが、はね返ってきた！', anim: 'c9d_echo',
    desc: 'こだまをはね返して、敵みんなに風のダメージ。',
  },
  m9d_tw_hum: {
    name: 'ふたごのはなうた', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'confuse', chance: 0.14, turns: [1, 2] }, cast: '{a}が、ふたりで、ずれたはなうたを歌い出した…', anim: 'c9d_hum',
    desc: '敵みんなを、混乱させることがある。',
  },
  // ── 谷わたりグモ ──
  m9d_sp_bite: {
    name: 'ぶらんがみ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.38 }, cast: '{a}が、糸でぶらんとおりてきて、{t}にかみついた！', anim: 'c9d_bite',
    desc: '上からおりてきてかみつき、1人に大きなダメージ。',
  },
  m9d_sp_web: {
    name: 'つりばしの糸', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'debuff', stat: 'agi', mult: 0.8, chance: 0.4 }, cast: '{a}が、つりばしのような糸を、みんなにかけた！', anim: 'c9d_web',
    desc: '糸をかけて、敵みんなの素早さを下げることがある。',
  },
  m9d_sp_swing: {
    name: '糸ぶらんこ', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'phys', mult: 0.58 }, cast: '{a}が、糸にぶら下がって、ぶうんとゆれてきた！', anim: 'c9d_swing',
    desc: 'ゆれてぶつかり、敵みんなにダメージ。',
  },
  // ── 星あかりのガ ──
  m9d_mt_wing: {
    name: '星のはばたき', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.34 }, cast: '{a}が、星もようのはねで、{t}をはたいた！', anim: 'c9d_wing',
    desc: 'はねではたいて、1人に大きなダメージ。',
  },
  m9d_mt_dust: {
    name: 'きらきらりんぷん', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.18, turns: [1, 2] }, cast: '{a}のはねから、きらきら光るこなが、まいおちた…', anim: 'c9d_dust',
    desc: '光るこなで、敵みんなをねむらせることがある。',
  },
  m9d_mt_light: {
    name: '星あかりのまい', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [100, 114], thr: 99, element: 'light' }, cast: '{a}が、くるくるまうと、星の光が、ちらばった！', anim: 'c9d_mlight',
    desc: '星の光をちらして、敵みんなに光のダメージ。',
  },
  // ── つりばしヤギ ──
  m9d_gt_horn: {
    name: 'カランずつき', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.44 }, cast: '{a}が、カランとかねを鳴らして、{t}にずつきをした！', anim: 'c9d_horn',
    desc: 'つので、1人に大きなダメージ。',
  },
  m9d_gt_bell: {
    name: 'やまびこのかね', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'magic', base: [100, 114], thr: 99, element: 'bolt' }, cast: '{a}のかねが、カラーン、カラーンと、谷じゅうにひびいた！', anim: 'c9d_bell',
    desc: 'かねの音をひびかせて、敵みんなに雷のダメージ。',
  },
  m9d_gt_jump: {
    name: 'がけっぷちジャンプ', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'phys', mult: 0.6 }, cast: '{a}が、がけから、ぴょーんととびおりてきた！', anim: 'c9d_jump',
    desc: 'とびおりて、敵みんなにダメージ。',
  },
  // ── かげぼうしネコ ──
  m9d_kg_claw: {
    name: 'かげのつめ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '暗やみから、{a}のつめが、{t}にのびてきた！', anim: 'c9d_kclaw',
    desc: '暗やみからひっかいて、1人に大きなダメージ。',
  },
  m9d_kg_shadow: {
    name: 'かげふみ', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'debuff', stat: 'agi', mult: 0.8, chance: 0.35 }, cast: '{a}が、みんなのかげを、ぴたっとふんだ！', anim: 'c9d_shadow',
    desc: 'かげをふんで、敵みんなの素早さを下げることがある。',
  },
  m9d_kg_eyes: {
    name: 'ひかる目', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'magic', base: [150, 168], thr: 99, element: 'dark' }, cast: '暗やみの中で、{a}の目が、ぎらりと光った！', anim: 'c9d_eyes',
    desc: '光る目でにらんで、1人に闇の大きなダメージ。',
  },

  // ── 幕の ボス: あそびたい魔人 ムウ・ムウムウ ──
  m9m_pat: {
    name: 'ぽよんパンチ', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 1.15 }, cast: '{a}の、まるい手が、{t}にぽよーんと当たった！', anim: 'c9m_pat',
    desc: 'まるい手で、1人に大きなダメージ。',
  },
  m9m_bounce: {
    name: 'ぽよぽよジャンプ', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'phys', mult: 0.5 }, cast: '{a}が、ぽよん、ぽよんと、とびはねた！', anim: 'c9m_bounce',
    desc: 'とびはねて、敵みんなにダメージ。',
  },
  m9m_yawn: {
    name: 'ふわぁ〜あくび', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.16, turns: [1, 2] }, cast: '{a}が、ふわぁ〜っと、大きなあくびをした…', anim: 'c9m_yawn',
    desc: 'あくびがうつって、敵みんなをねむらせることがある。',
  },
  m9m_spin: {
    name: 'ぐるぐるあそび', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'magic', base: [250, 270], thr: 99, element: 'wind' }, cast: '{a}が、ぐるぐるぐるっと、こまのように回った！', anim: 'c9m_spin',
    desc: 'こまのように回って、敵みんなに風のダメージ。',
  },
  m9m_split: {
    name: 'ぽんっと分かれる', kind: 'monster', target: 'self',
    effect: { type: 'c9mSplit' }, cast: '{a}「…ひとりあそびは、つまらないなあ。」', anim: 'c9m_split',
    desc: '2体に分かれる。',
  },
  m9m_wake: {
    name: 'おきて、おきて！', kind: 'monster', target: 'self',
    effect: { type: 'c9mWake' }, cast: '{a}「おきて、おきて！」', anim: 'c9m_wake',
    desc: 'ばたんきゅうした方を起こす。起こすたびに、2体とも強くなる。',
  },
  m9m_beamup: {
    name: 'おかしビームのかまえ', kind: 'monster', target: 'self',
    effect: { type: 'c9mBeamUp' }, cast: '{a}の、ぼうしの星が、ピカピカ光り始めた…！', anim: 'c9m_beamup',
    desc: 'おかしビームをうつ人を決める。次に、その人をおかしにする。',
  },
  m9m_beam: {
    name: 'おかしビーム', kind: 'monster', target: 'enemy',
    effect: { type: 'c9mBeam' }, cast: '{a}「おかしになっちゃえ〜！」', anim: 'c9m_beam',
    desc: '1人をおかしにかえる。防御で、ふせげる。',
  },
  m9m_doonup: {
    name: 'いっしょにドーンのかまえ', kind: 'monster', target: 'self',
    effect: { type: 'c9mDoonUp' }, cast: '{a}「ねえねえ、いっしょにやろうよ！」', anim: 'c9m_doonup',
    desc: '2体で手をつなぐ。次に、いっしょにドーンが来る。',
  },
  m9m_doon: {
    name: 'いっしょにドーン', kind: 'monster', target: 'enemies',
    effect: { type: 'c9mDoon' }, cast: 'ムウとムウムウ「せーのっ！いっしょに、ドーン！！」', anim: 'c9m_doon',
    desc: '2体いっしょに、敵みんなに大ダメージ。防御で、へらせる。',
  },

  // ── スピカの 星のうた（だれでも。その 人の 番を 使う。5回の 番に 1回 たまる）──
  [SONG]: {
    name: 'スピカ：星のうた', kind: 'skill', mp: 0, target: 'self', noAuto: true,
    effect: { type: 'c9dSong' }, cast: '{a}が、スピカに声をかけた。\nスピカ「うん！歌うね！」', anim: 'c9d_song',
    desc: 'スピカの歌で、味方みんなの悪い状態をなおし、HPを少し回復する。',
  },
};
