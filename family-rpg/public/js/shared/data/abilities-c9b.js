// 第3部 第1章 第2幕「鉱山の底の先」の 魔物・デデドン大王・スピカの「てらす」の 技（B: 戦い。abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
// とくべつな こうか（c9kWatch … 皿を じっと 見る・c9kEat … 食べる・c9kSulk … しょんぼり・c9kLight … 明かりを 食べる・
//   c9kJumpUp … 大ジャンプの 前ぶれ・c9kJump … 大ジャンプ・c9bTeru … てらす）は shared/battle-c9b.js の c9bEffect
// desc は 1文めで 何を するか わかる ように（スマホの たて持ちは 1文めだけ 出る。client/ui/skillinfo.js の firstSentence）
// anim は c9u_〜（ふつうの 魔物）・c9k_〜（デデドン大王）・c9b_teru（てらす）。client/render/battlefx-c9b.js
export const TERU = 'm9_teru';
export const C9B_ABILITIES = {
  // ── 水晶のカニ ──
  m9u_cr_pinch: {
    name: '水晶のハサミ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}が、水晶のハサミで、{t}をはさんだ！', anim: 'c9u_pinch',
    desc: '水晶のハサミで、1人に大きなダメージ。',
  },
  m9u_cr_bubble: {
    name: 'きらきらのあわ', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [100, 114], thr: 99, element: 'ice' }, cast: '{a}が、つめたいあわを、ぶくぶくふき出した！', anim: 'c9u_bubble',
    desc: 'つめたいあわで、敵みんなに氷のダメージ。',
  },
  m9u_cr_shell: {
    name: '水晶のこうら', kind: 'monster', mp: 2, target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.3 }, cast: '{a}のこうらの水晶が、きらりと光った！', anim: 'c9u_shell',
    desc: 'こうらを光らせて、自分の守りを上げる。',
  },
  // ── 光るキノコ ──
  m9u_kn_bonk: {
    name: '光るずつき', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.36 }, cast: '{a}が、光るかさで、{t}にずつきした！', anim: 'c9u_bonk',
    desc: '光るかさでずつきして、1人に大きなダメージ。',
  },
  m9u_kn_spore: {
    name: 'ねむねむの光', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.2, turns: [1, 2] }, cast: '{a}が、やさしい光のこなを、ふわっとまいた…', anim: 'c9u_spore',
    desc: '敵みんなを、ねむらせることがある。',
  },
  m9u_kn_glow: {
    name: 'かさのあかり', kind: 'monster', mp: 4, target: 'self',
    effect: { type: 'heal', base: [320, 360], thr: 99 }, cast: '{a}のかさが、ぽうっと光った！', anim: 'c9u_glow',
    desc: 'かさを光らせて、自分のHPを回復する。',
  },
  // ── どうくつコウモリ ──
  m9u_bt_fang: {
    name: 'コウモリのキバ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.38 }, cast: '{a}が、すうっとおりてきて、{t}にかみついた！', anim: 'c9u_fang',
    desc: 'とびおりてかみつき、1人に大きなダメージ。',
  },
  m9u_bt_wave: {
    name: 'キーンのこえ', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'status', status: 'confuse', chance: 0.18, turns: [1, 2] }, cast: '{a}が、キーンと高い声を出した！', anim: 'c9u_wave',
    desc: '敵みんなを、混乱させることがある。',
  },
  m9u_bt_dive: {
    name: 'くるりんダイブ', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'phys', mult: 0.6 }, cast: '{a}が、くるりと回って、みんなのあいだをとびぬけた！', anim: 'c9u_dive',
    desc: 'とびぬけて、敵みんなにダメージ。',
  },
  // ── くらやみの大ミミズ ──
  m9u_mz_wrap: {
    name: 'ぐるぐるまき', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.45 }, cast: '{a}が、暗やみから、{t}にぐるぐるまきついた！', anim: 'c9u_wrap',
    desc: '長い体でまきついて、1人に大きなダメージ。',
  },
  m9u_mz_dust: {
    name: 'くらやみのすな', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 0.5 }, { type: 'status', status: 'blind', chance: 0.25, turns: [2, 3] }] },
    cast: '{a}が、地面の黒いすなを、ばさっとまき上げた！', anim: 'c9u_dust',
    desc: '黒いすなで、敵みんなにダメージ。目がくらむことがある。',
  },
  m9u_mz_dig: {
    name: 'もぐってどーん', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.6 }, cast: '{a}が、地面にもぐって…{t}の足もとから、とび出した！', anim: 'c9u_dig',
    desc: '足もとからとび出して、1人に大ダメージ。',
  },
  // ── もぐら兵（やり）──
  m9u_ms_poke: {
    name: 'えいっとつき', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}「えいっ！」\n{a}が、やりで{t}をついた！', anim: 'c9u_poke',
    desc: 'やりでついて、1人に大きなダメージ。',
  },
  m9u_ms_line: {
    name: 'ならんでつんつん', kind: 'monster', mp: 3, target: 'enemies',
    effect: { type: 'phys', mult: 0.6 }, cast: '{a}「みんな、ならべー！」\nやりが、つんつんつんと、つき出された！', anim: 'c9u_line',
    desc: 'やりをならべてついて、敵みんなにダメージ。',
  },
  m9u_ms_ehhen: {
    name: 'えっへんのポーズ', kind: 'monster', mp: 2, target: 'self',
    effect: { type: 'buff', stat: 'atk', mult: 1.25 }, cast: '{a}「大王さまの兵隊だぞ、えっへん！」', anim: 'c9u_ehhen',
    desc: 'いばって、自分の攻撃力を上げる。',
  },
  // ── もぐら兵（なべ）──
  m9u_mp_ladle: {
    name: 'おたまでポカリ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.35 }, cast: '{a}が、おたまで{t}を、ポカリとたたいた！', anim: 'c9u_ladle',
    desc: 'おたまでたたいて、1人に大きなダメージ。',
  },
  m9u_mp_soup: {
    name: 'あつあつスープ', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'magic', base: [150, 166], thr: 99, element: 'fire' }, cast: '{a}「大王さまのスープだ、あちちっ！」\nあつあつのスープが、{t}にとんだ！', anim: 'c9u_soup',
    desc: 'あつあつのスープで、1人に炎の大きなダメージ。',
  },
  m9u_mp_lid: {
    name: 'なべぶたガード', kind: 'monster', mp: 2, target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.3 }, cast: '{a}は、なべのふたで、さっと身をかくした！', anim: 'c9u_lid',
    desc: 'なべのふたで、自分の守りを上げる。',
  },

  // ── 幕の ボス: デデドン大王 ──
  m9k_mallet: {
    name: '大づちドスン', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 1.3 }, cast: '{a}「えーい、どけどけ！」\n木の大づちが、{t}にドスンと落ちた！', anim: 'c9k_mallet',
    desc: '木の大づちで、1人に大きなダメージ。',
  },
  m9k_belly: {
    name: 'おなかでボヨーン', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'phys', mult: 0.6 }, cast: '{a}が、大きなおなかで、ボヨーンとつっこんできた！', anim: 'c9k_belly',
    desc: '大きなおなかでぶつかって、敵みんなにダメージ。',
  },
  m9k_ehhen: {
    name: '王さまのいばりんぼ', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'debuff', stat: 'atk', mult: 0.8, chance: 0.4 }, cast: '{a}「わしは、大地の下の王さまだぞ！えっへん！」', anim: 'c9k_ehhen',
    desc: '大いばりして、敵みんなの攻撃力を下げることがある。',
  },
  m9k_spin: {
    name: '大づちぐるぐる', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'phys', mult: 0.72 }, cast: '{a}が、大づちをもって、ぐるぐる回り出した！', anim: 'c9k_spin',
    desc: '大づちをふり回して、敵みんなにダメージ。',
  },
  m9k_watch: {
    name: 'ごちそうをじっと見る', kind: 'monster', target: 'self',
    effect: { type: 'c9kWatch' }, cast: '{a}「…ふむ。」', anim: 'c9k_watch',
    desc: '皿を1つ、じっと見る。次に、その皿を食べる。',
  },
  m9k_eat: {
    name: 'いただきまーす', kind: 'monster', target: 'self',
    effect: { type: 'c9kEat' }, cast: '{a}「いただきまーす！」', anim: 'c9k_eat',
    desc: '見ていた皿を食べて、その力を出す。',
  },
  m9k_sulk: {
    name: 'しょんぼり', kind: 'monster', target: 'self',
    effect: { type: 'c9kSulk' }, cast: '{a}は、からっぽのテーブルを見て、しょんぼりしている…', anim: 'c9k_sulk',
    desc: 'ごちそうを取り上げられて、しょんぼり。何もできない。',
  },
  m9k_light: {
    name: '明かりをぱくり', kind: 'monster', target: 'self',
    effect: { type: 'c9kLight' }, cast: '{a}「ええい、明かりも、ぜーんぶわしのものだ！」', anim: 'c9k_light',
    desc: '広間の明かりを食べて、まっ暗にする。',
  },
  m9k_jumpup: {
    name: '大ジャンプのかまえ', kind: 'monster', target: 'self',
    effect: { type: 'c9kJumpUp' }, cast: '{a}が、大づちをかついで、ぐっとしゃがみこんだ…！', anim: 'c9k_jumpup',
    desc: '大ジャンプのかまえ。次に、とび上がってみんなの上に落ちてくる。',
  },
  m9k_jump: {
    name: '大づち大ジャンプ', kind: 'monster', target: 'enemies',
    effect: { type: 'c9kJump' }, cast: '{a}が、天じょうまでとび上がって…ズドーン！！', anim: 'c9k_jump',
    desc: 'とび上がって落ちてきて、敵みんなに大ダメージ。身を守ると、へらせる。',
  },
  m9k_soup: {
    name: 'からからほのお', kind: 'monster', target: 'enemies',
    effect: { type: 'magic', base: [600, 640], thr: 99, element: 'fire' }, cast: '{a}「か、からーい！！」\n{a}の口から、ほのおがゴオッとふき出した！', anim: 'c9k_soup',
    desc: 'からいスープを食べて、敵みんなに炎の大ダメージ。',
  },
  m9k_dish: {
    name: 'ほかほか', kind: 'monster', target: 'self',
    effect: { type: 'nothing' }, cast: '{a}から、おいしそうなにおいがする。', anim: 'c9k_dish',
    desc: 'おいしそうなにおいがするだけ。何もしない。',
  },

  // ── スピカの てらす（だれでも 使える。その 人の 番を 使う。オートでは 使わない）──
  [TERU]: {
    name: 'スピカ：てらす', kind: 'skill', mp: 0, target: 'self', noAuto: true,
    effect: { type: 'c9bTeru' }, cast: '{a}が、スピカに声をかけた。\nスピカ「うん！てらすね！」', anim: 'c9b_teru',
    desc: 'スピカの光で、暗やみをはらう。かくれた物が見えるようになる。',
  },
};
