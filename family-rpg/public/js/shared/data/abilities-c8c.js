// 第2部 第8章 第3幕「くろがねの 空中ようさい」の 魔物・マジカメック・初代大魔王クッパード（ギガ）の 技（B: 戦い。abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
// とくべつな こうか（c8cGrow … でっかくなあれ・c8cSummon … 子分を よぶ・c8cBroom … ほうきに のる・c8cFizzle … 魔法の から回り・
//   c8cPound … ドッスンヒップドロップ・c8cGiga … ギガクッパード・c8cGigaFire … ギガほのお・c8cFallen … おちて 目を まわす）は
//   shared/battle-c8c.js の c8cEffect
// desc は 1文めで 何を するか わかる ように（スマホの たて持ちは 1文めだけ 出る。client/ui/skillinfo.js の firstSentence）
// anim は c8n_〜（手下）・c8k_〜（マジカメック）・c8w_〜（クッパード）。client/render/battlefx-c8c.js
export const C8C_ABILITIES = {
  // ── メラバブル ──
  m8n_mb_hop: {
    name: 'ぴょんぴょん火の玉', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', base: [126, 144], thr: 99, element: 'fire' }, cast: '{a}が、ぴょーんとはねて、{t}にとびかかった！', anim: 'c8n_hop',
    desc: 'はねてとびかかり、1人に炎の大きなダメージ。',
  },
  m8n_mb_magma: {
    name: 'マグマのしぶき', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'magic', base: [84, 98], thr: 99, element: 'fire' }, cast: '{a}が、あついマグマのしぶきを、まきちらした！', anim: 'c8n_magma',
    desc: 'マグマのしぶきで、敵みんなに炎のダメージ。',
  },
  m8n_mb_bounce: {
    name: 'はねまわる', kind: 'monster', mp: 2, target: 'self',
    effect: { type: 'buff', stat: 'agi', mult: 1.3 }, cast: '{a}は、ぴょんぴょんと、すばやくはねまわった！', anim: 'c8n_bounce',
    desc: 'はねまわって、自分の素早さを上げる。',
  },
  // ── トンカチブロス ──
  m8n_tb_throw: {
    name: 'トンカチなげ', kind: 'monster', mp: 2, target: 'enemies',
    effect: { type: 'phys', mult: 0.5, hits: 3, random: true }, cast: '{a}は、トンカチを、次々になげてきた！', anim: 'c8n_throw',
    desc: 'トンカチを3回なげる。だれに当たるかは分からない。',
  },
  m8n_tb_jump: {
    name: 'ジャンプトンカチ', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.45 }, cast: '{a}は、高くジャンプして、{t}にトンカチをふりおろした！', anim: 'c8n_jump',
    desc: 'ジャンプして、1人に大ダメージ。',
  },
  m8n_tb_rain: {
    name: 'トンカチの雨', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'phys', mult: 0.42, hits: 1 }, cast: '{a}は、トンカチを、空に高くなげ上げた！', anim: 'c8n_rain',
    desc: 'トンカチがふってきて、敵みんなにダメージ。',
  },
  // ── ブリキクッパ ──
  m8n_bk_bite: {
    name: 'ガブガブ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 0.5, hits: 3 }, cast: '{a}は、カタカタ走ってきて、{t}にガブガブかみついた！', anim: 'c8n_bite',
    desc: '1人に3回かみつく。',
  },
  m8n_bk_dash: {
    name: 'ゼンマイとっしん', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}は、ゼンマイを全開にして、{t}にとっしんした！', anim: 'c8n_dash',
    desc: 'ゼンマイの力でとっしんし、1人に大ダメージ。',
  },
  m8n_bk_wind: {
    name: 'ゼンマイまき', kind: 'monster', mp: 2, target: 'self',
    effect: { type: 'buff', stat: 'atk', mult: 1.25 }, cast: '{a}のせなかのゼンマイが、キリキリとまかれた！', anim: 'c8n_wind',
    desc: 'ゼンマイをまいて、自分の攻撃力を上げる。',
  },
  // ── ドッシーン ──
  m8n_ds_drop: {
    name: 'ドッシーン！', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.55 }, cast: '{a}が、{t}の上に、ドッシーン！とおちてきた！', anim: 'c8n_drop',
    desc: '上からおちてきて、1人に大ダメージ。',
  },
  m8n_ds_quake: {
    name: 'ずしんゆれ', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'phys', mult: 0.6 }, cast: '{a}が、ゆかにおちて、ずしん！とゆれた！', anim: 'c8n_quake',
    desc: 'ゆかをゆらして、敵みんなにダメージ。',
  },
  m8n_ds_glare: {
    name: 'ギロリ', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'debuff', stat: 'agi', mult: 0.8, chance: 0.45 }, cast: '{a}は、おこった顔で、ギロリとにらんだ…！', anim: 'c8n_glare',
    desc: 'にらみつけて、敵みんなの素早さを下げることがある。',
  },
  // ── ドデカキラー ──
  m8n_dk_rush: {
    name: 'ドデカとっしん', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.6 }, cast: '{a}が、ゴオオッと、{t}めがけてとんできた！', anim: 'c8n_rush',
    desc: 'まっすぐとんできて、1人に大ダメージ。',
  },
  m8n_dk_boom: {
    name: 'ドッカーン', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'magic', base: [96, 112], thr: 99, element: 'blast' }, cast: '{a}が、かべにドーンと当たって、ばくはつした！', anim: 'c8n_boom',
    desc: 'ばくはつして、敵みんなにばくはつのダメージ。',
  },
  m8n_dk_aim: {
    name: 'ねらいをさだめる', kind: 'monster', mp: 2, target: 'self',
    effect: { type: 'buff', stat: 'atk', mult: 1.25 }, cast: '{a}の目が、ぎらりと光った…', anim: 'c8n_aim',
    desc: 'ねらいをさだめて、自分の攻撃力を上げる。',
  },

  // ── マジカメック ──
  m8k_shapes: {
    name: 'ふしぎな形の魔法', kind: 'monster', target: 'enemy',
    effect: { type: 'magic', base: [330, 360], thr: 99, element: 'bolt' }, cast: '{a}のつえから、さんかく・しかく・まるの光が、{t}めがけてとんだ！', anim: 'c8k_shapes',
    desc: 'ふしぎな形の光で、1人に雷の大ダメージ。',
  },
  m8k_spark: {
    name: 'きらきら魔法', kind: 'monster', target: 'enemies',
    effect: { type: 'magic', base: [204, 226], thr: 99, element: 'bolt' }, cast: '{a}がつえをふると、きらきら光る星が、あたりにふりそそいだ！', anim: 'c8k_spark',
    desc: '光る星をふらせ、敵みんなに雷のダメージ。',
  },
  m8k_shrink: {
    name: 'ちぢめる魔法', kind: 'monster', target: 'enemies',
    effect: { type: 'debuff', stat: 'atk', mult: 0.8, chance: 0.5 }, cast: '{a}「ちぢめ、ちぢめ～！」', anim: 'c8k_shrink',
    desc: '魔法で、敵みんなの攻撃力を下げることがある。',
  },
  m8k_broomhit: {
    name: 'ほうきアタック', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}は、ほうきにのって、{t}めがけてつっこんできた！', anim: 'c8k_broomhit',
    desc: 'ほうきでつっこみ、1人に大ダメージ。',
  },
  m8k_grow: {
    name: 'でっかくなあれ', kind: 'monster', target: 'self',
    effect: { type: 'c8cGrow' }, cast: '{a}「でっかく…なあれ～っ！！」', anim: 'c8k_grow',
    desc: '子分1ぴきを大きくする。魔法じんの子分を先にたおすと止まる。',
  },
  m8k_summon: {
    name: '出てこい子分', kind: 'monster', target: 'self',
    effect: { type: 'c8cSummon' }, cast: '{a}「子分たち、出てこーい！」', anim: 'c8k_summon',
    desc: '子分をよび出す。',
  },
  m8k_broom: {
    name: 'ほうきにのる', kind: 'monster', target: 'self',
    effect: { type: 'c8cBroom' }, cast: '{a}「ええい、こうなったら、空から魔法だ！」', anim: 'c8k_broom',
    desc: 'ほうきにのって空をとぶ。魔法が速くなる。',
  },
  m8k_fizzle: {
    name: 'あれれ？', kind: 'monster', target: 'self',
    effect: { type: 'c8cFizzle' }, cast: '{a}「あ、あれれ？」', anim: 'c8k_fizzle',
    desc: '魔法をかける子分がいなくて、から回りした。',
  },
  // でっかくなった 子分の 技
  m8k_kstomp: {
    name: 'デカふみつけ', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 0.62, ignoreDef: 0.2 }, cast: '大きくなった{a}が、ドシン！ドシン！とふみつけてきた！', anim: 'c8k_kstomp',
    desc: '大きな体でふみつけて、敵みんなにダメージ。',
  },

  // ── 初代大魔王クッパード（1だんめ: ふつう）──
  m8b_claw: {
    name: '大魔王のツメ', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}は、するどいツメで、{t}をひっかいた！', anim: 'c8w_claw',
    desc: 'するどいツメで、1人に大ダメージ。',
  },
  m8b_breath: {
    name: '大魔王のほのお', kind: 'monster', target: 'enemies',
    effect: { type: 'magic', base: [176, 198], thr: 99, element: 'fire' }, cast: '{a}は、口から、ごうごうともえる火をはいた！', anim: 'c8w_breath',
    desc: '口から火をはき、敵みんなに炎のダメージ。',
  },
  m8b_shell: {
    name: 'こうらスピン', kind: 'monster', target: 'enemies',
    effect: { type: 'phys', mult: 0.4, hits: 2 }, cast: '{a}は、こうらにひっこんで、ぐるぐる回りながら、とっしんしてきた！', anim: 'c8w_shell',
    desc: 'こうらで回って、敵みんなに2回ダメージ。',
  },
  m8b_pound: {
    name: 'ドッスンヒップドロップ', kind: 'monster', target: 'enemies',
    effect: { type: 'c8cPound' }, cast: '{a}は、高くとび上がって…\n「ワガハイの、おしりをくらえーっ！」', anim: 'c8w_pound',
    desc: 'とび上がっておしりでおち、敵みんなに大ダメージ。身を守ると半分になる。',
  },
  m8b_giga: {
    name: 'ギガクッパード', kind: 'monster', target: 'self',
    effect: { type: 'c8cGiga' }, cast: '{a}「黒い星のかけらよ…ワガハイに、力をよこせーっ！」', anim: 'c8w_giga',
    desc: 'かけらの力で、とても大きくなる。橋のオノをたたくと、もとにもどる。',
  },
  m8b_fallen: {
    name: 'あいたたた', kind: 'monster', target: 'self',
    effect: { type: 'c8cFallen' }, cast: '{a}「あいたたた…！橋が、おちるとは…！」', anim: 'c8w_fallen',
    desc: '橋からおちて、目を回している。動けない。',
  },
  // ── ギガクッパード（2だんめ）──
  m8b_gstomp: {
    name: 'ギガふみつけ', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.5 }, cast: '{a}の大きな足が、{t}の上から、ズシーン！とふみおろされた！', anim: 'c8w_gstomp',
    desc: '大きな足でふみつけ、1人に大ダメージ。',
  },
  m8b_gbreath: {
    name: 'ギガのほのお', kind: 'monster', target: 'enemies',
    effect: { type: 'magic', base: [196, 220], thr: 99, element: 'fire' }, cast: '{a}の大きな口から、まっ赤な火が、あふれ出した！', anim: 'c8w_gbreath',
    desc: '大きな火をはき、敵みんなに炎のダメージ。',
  },
  m8b_groar: {
    name: 'ギガのおたけび', kind: 'monster', target: 'enemies',
    effect: { type: 'debuff', stat: 'def', mult: 0.8, chance: 0.5 }, cast: '{a}「ガオオオオーッ！！」', anim: 'c8w_groar',
    desc: 'おたけびで、敵みんなの守りを下げることがある。',
  },
  m8b_gigafire: {
    name: 'ギガほのお', kind: 'monster', target: 'enemies',
    effect: { type: 'c8cGigaFire' }, cast: '{a}は、むねいっぱいに、いきをすいこんだ…\n「ギガ…ほのおーっ！！」', anim: 'c8w_gigafire',
    desc: '大きな火の海で、敵みんなに炎の大ダメージ。身を守ると半分になる。',
  },
  // 橋の オノ（何も しない）
  m8b_axe_wait: {
    name: '橋のきしみ', kind: 'monster', target: 'self',
    effect: { type: 'nothing' }, cast: '{a}が、ギギ…ときしんだ。', anim: 'none',
    desc: '橋がきしむ。何もしない。',
  },
};
