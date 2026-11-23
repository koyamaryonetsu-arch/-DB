// 第3部 第3章 第3幕「はかりの回ろうと、ふたつの光」の 魔物・バラバラン3号・近衛の隊長エース・へいたい・「アルゴルにたのむ」の 技（B: 戦い。abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
// とくべつな こうか（c11cFix … あたまが こわれた 体を 直す・c11cRocket … ロケットパンチ・c11cLay … カードを ならべる・c11cCard … カードを めくって 使う・
//   c11cSalute … へいたいの けいれい・c11cEat … アルゴルにたのむ）は shared/battle-c11c.js の c11cEffect
// desc は 1文めで 何を するか わかる ように（スマホの たて持ちは 1文めだけ 出る）
// anim は c11v_〜（ふつうの 魔物）・c11h_〜／c11r_〜／c11l_〜（メカの あたま・うで・あし）・c11e_〜（隊長）・c11g_〜（へいたい）・c11c_eat（アルゴルにたのむ）。
//   client/render/battlefx-c11c.js
export const TANOMU = 'm11_tanomu';
export const LAY = 'm11a_lay';
export const CARD_IDS = { comet: 'm11a_comet', star: 'm11a_star', moon: 'm11a_moon', sun: 'm11a_sun' };
export const FIX = 'm11h_fix';
export const ROCKET = 'm11r_rocket';
export const C11C_ABILITIES = {
  // ── つきのトランプへい ──
  m11c_tm_spear: {
    name: 'カードのやり', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}が、うすいカードのやりで、{t}をついた！', anim: 'c11v_spear',
    desc: 'カードのやりでついて、1人に大きなダメージ。',
  },
  m11c_tm_moon: {
    name: '月のひらり', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.15, turns: [1, 2] }, cast: '{a}が、月のマークを、ひらりと見せた…', anim: 'c11v_moon',
    desc: '月のマークを見せて、敵みんなをねむらせることがある。',
  },
  // ── ほしのトランプへい ──
  m11c_ts_spear: {
    name: 'ほしのやり', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.38 }, cast: '{a}が、星の形のやりで、{t}をついた！', anim: 'c11v_spear',
    desc: '星のやりでついて、1人に大きなダメージ。',
  },
  m11c_ts_star: {
    name: 'ほしとばし', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [108, 122], thr: 99, element: 'light' }, cast: '{a}のやりの先から、小さな星がとびだした！', anim: 'c11v_star',
    desc: '小さな星をとばして、敵みんなに光のダメージ。',
  },
  // ── てんびんどり ──
  m11c_bd_peck: {
    name: 'おもいほうつつき', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}が、はかりで「重い方」に決めた{t}を、つついた！', anim: 'c11v_peck',
    desc: '重い方の人をつついて、1人に大きなダメージ。',
  },
  m11c_bd_weigh: {
    name: '光をはかる', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'debuff', stat: 'def', mult: 0.8, chance: 0.6 }, cast: '{a}が、{t}の光をはかって「…かるい」と首をかしげた。', anim: 'c11v_weigh',
    desc: '光をはかって、1人の守りを下げる。',
  },
  // ── ほうきぼしのトランプへい ──
  m11c_tc_dash: {
    name: 'ほうきぼしつっこみ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.42 }, cast: '{a}が、長いしっぽを引いて、{t}につっこんだ！', anim: 'c11v_dash',
    desc: 'ものすごい速さでつっこんで、1人に大きなダメージ。',
  },
  m11c_tc_tail: {
    name: 'ほうきぼしのしっぽ', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [110, 124], thr: 99, element: 'fire' }, cast: '{a}のしっぽから、火のこが、ぱらぱらとふった！', anim: 'c11v_tail',
    desc: 'しっぽの火のこで、敵みんなに炎のダメージ。',
  },
  // ── かいろうランプ ──
  m11c_lp_beam: {
    name: 'あおじろい光', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', base: [180, 196], thr: 99, element: 'light' }, cast: '{a}から、青白い光が、{t}にのびた！', anim: 'c11v_beam',
    desc: '青白い光で、1人に光の大きなダメージ。',
  },
  m11c_lp_fence: {
    name: '光のさく', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'debuff', stat: 'agi', mult: 0.85, chance: 0.35 }, cast: '{a}が、光のさくを、ぱっと作った！', anim: 'c11v_fence',
    desc: '光のさくで、敵みんなの素早さを下げることがある。',
  },
  // ── たいようのトランプへい ──
  m11c_tu_spear: {
    name: 'たいようのやり', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}が、太陽の形のやりで、{t}をついた！', anim: 'c11v_spear',
    desc: '太陽のやりでついて、1人に大きなダメージ。',
  },
  m11c_tu_sun: {
    name: 'おひさまの光', kind: 'monster', mp: 4, target: 'allies',
    effect: { type: 'heal', base: [300, 340] }, cast: '{a}が、太陽のマークを、高くかかげた！', anim: 'c11v_sun',
    desc: 'お日さまの光で、仲間みんなのHPを回復する。',
  },
  // ── さくのひかりガ ──
  m11c_mt_dust: {
    name: 'ちくちくりんぷん', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', base: [178, 194], thr: 99, element: 'light' }, cast: '{a}が、光るこなを、{t}にふりかけた！', anim: 'c11v_dust',
    desc: 'ちくちくするこなで、1人に光の大きなダメージ。',
  },
  m11c_mt_flit: {
    name: 'ひらひらまい', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'confuse', chance: 0.15, turns: [1, 2] }, cast: '{a}が、光のさくのまわりを、ひらひらまった！', anim: 'c11v_flit',
    desc: 'ひらひらまって、敵みんなを混乱させることがある。',
  },

  // ── 中ボス: バラバラン3号（あたま・うで・あし）──
  m11h_beam: {
    name: 'あたまビーム', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'magic', base: [700, 760], thr: 99, element: 'bolt' }, cast: '{a}の目から、ビビビッと、ビームが出た！', anim: 'c11h_beam',
    desc: '目からビームを出して、1人に雷のダメージ。',
  },
  m11h_horn: {
    name: 'ラッパのおと', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'magic', base: [420, 460], thr: 99, element: 'blast' }, cast: '{a}のラッパから「パッパカパーン！」と大きな音が出た！', anim: 'c11h_horn',
    desc: '大きな音で、敵みんなにダメージ。',
  },
  [FIX]: {
    name: 'なおすでございマス', kind: 'monster', target: 'self',
    effect: { type: 'c11cFix' }, cast: '{a}から、ねじとスパナが、にょきっと出た！', anim: 'c11h_fix',
    desc: 'こわれた体を、なおしてしまう。',
  },
  m11r_punch: {
    name: 'メカパンチ', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 1.0 }, cast: '{a}が、ガシーンと、{t}をなぐった！', anim: 'c11r_punch',
    desc: 'メカのうでで、1人にダメージ。',
  },
  m11r_grab: {
    name: 'つかんでぶんぶん', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 0.9 }, cast: '{a}が、{t}をつかんで、ぶんぶんふり回した！', anim: 'c11r_grab',
    desc: 'つかんでふり回して、1人にダメージ。',
  },
  [ROCKET]: {
    name: 'ロケットパンチ', kind: 'monster', target: 'enemy',
    effect: { type: 'c11cRocket' }, cast: '{a}「ロケットパーンチ！」', anim: 'c11r_rocket',
    desc: 'うでがとんできて、ねらった1人に、とても大きなダメージ。「防御」で、へらせる。',
  },
  m11l_stomp: {
    name: 'じだんだ', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'phys', mult: 0.55 }, cast: '{a}が、ドスンドスンと、じだんだをふんだ！', anim: 'c11l_stomp',
    desc: 'じだんだをふんで、敵みんなにダメージ。',
  },
  m11l_kick: {
    name: 'メカキック', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 0.95 }, cast: '{a}が、{t}を、けとばした！', anim: 'c11l_kick',
    desc: 'メカのあしでけって、1人にダメージ。',
  },

  // ── 幕の ボス: 近衛の隊長エース（カード）──
  [LAY]: {
    name: 'カードをならべる', kind: 'monster', target: 'self',
    effect: { type: 'c11cLay' }, cast: '{a}は、カードを、しゅっしゅっと、ならべた。', anim: 'c11e_lay',
    desc: 'これから使うわざのカードを、うら向きにならべる。',
  },
  [CARD_IDS.comet]: {
    name: 'ほうき星のカード', kind: 'monster', target: 'enemy',
    effect: { type: 'c11cCard', card: 'comet' }, cast: '{a}は、カードをめくった！', anim: 'c11e_comet',
    desc: 'ほうき星が、ねらった1人に、とても大きなダメージ。「防御」で、へらせる。',
  },
  [CARD_IDS.star]: {
    name: '星のカード', kind: 'monster', target: 'enemies',
    effect: { type: 'c11cCard', card: 'star' }, cast: '{a}は、カードをめくった！', anim: 'c11e_star',
    desc: '星がふって、敵みんなにダメージ。「防御」で、へらせる。',
  },
  [CARD_IDS.moon]: {
    name: '月のカード', kind: 'monster', target: 'enemies',
    effect: { type: 'c11cCard', card: 'moon' }, cast: '{a}は、カードをめくった！', anim: 'c11e_moon',
    desc: '月の光で、身を守っていない人をねむらせる。',
  },
  [CARD_IDS.sun]: {
    name: '太陽のカード', kind: 'monster', target: 'self',
    effect: { type: 'c11cCard', card: 'sun' }, cast: '{a}は、カードをめくった！', anim: 'c11e_sun',
    desc: '太陽の光で、隊長とへいたいのHPを回復する。',
  },
  // ── トランプの へいたい ──
  m11g_spear: {
    name: 'トランプのやり', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 0.9 }, cast: '{a}が、カードのやりで、{t}をついた！', anim: 'c11g_spear',
    desc: 'カードのやりで、1人にダメージ。',
  },
  m11g_salute: {
    name: 'けいれい', kind: 'monster', target: 'self',
    effect: { type: 'c11cSalute' }, cast: '{a}は、ピシッと、けいれいをした。', anim: 'c11g_salute',
    desc: '隊長に、けいれいをしている。何もしない。',
  },

  // ── だれでも（近衛の隊長エースの 戦いで。その 人の 番を 使う。ねらいは 場に 出て いる カード 1まい … cmd.choice〈カードの 番号〉）──
  //   cmdOnly … 特技の 一覧には 出さない（コマンドの いちばん 上の「アルゴルにたのむ」から。client/battle.js）
  [TANOMU]: {
    name: 'アルゴルにたのむ', kind: 'skill', mp: 0, target: 'self', noAuto: true, cmdOnly: true,
    effect: { type: 'c11cEat' }, cast: '{a}は、アルゴルにたのんだ！', anim: 'c11c_eat',
    desc: '場に出ているカードを1まい、アルゴルに食べてもらう。そのわざは出ない。食べてもらえるのは、ならんだカードにつき1まい。',
  },
};
