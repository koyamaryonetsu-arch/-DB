// 第3部 第3章 第4幕「かがやきの女王と、八つめの音」の 魔物・鏡と月の使い・かがやきの女王ポラリス・「手をつなぐ」「八つの音」の 技（B: 戦い。abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
// とくべつな こうか（c11dRobe … わすれの衣・c11dStrike … 女王の ふつうの 攻撃〈ながされた 人は ねらわない〉・c11dMeasure … 光の はかり・
//   c11dShine … かがやき・c11dNames … 星の 名前を よぶ・c11dEightScene … 八つめの 音の 場面・c11dHold … 手をつなぐ・c11dEight … 八つの音）は
//   shared/battle-c11d.js の c11dEffect。中ボスの「音を鳴らす」（c10dRing）・「よびかける」（c11bCall）も、この 幕の 戦いでは c11dEffect が 先に 受ける
// desc は 1文めで 何を するか わかる ように（スマホの たて持ちは 1文めだけ 出る）
// anim は c11w_〜（ふつうの 魔物）・中ボスは 今 ある え（c10m_〜・c11o_〜）・c11q_〜（女王）・c11d_hold／c11d_eight（コマンド）。client/render/battlefx-c11d.js
export const HOLD = 'm11_tewotsunagu';
export const EIGHT = 'm11_yatsunone';
export const ROBE = 'm11u_robe';
export const BACK_HIT = { mirror: 'm11u_back_m', moon: 'm11u_back_o' };
export const STRIKE = 'm11q_strike';
export const RAIN = 'm11q_rain';
export const MEASURE = 'm11q_measure';
export const SHINE = 'm11q_shine';
export const NAMES = 'm11q_names';
export const SCENE = 'm11q_eight';
export const EIGHT_AFTER = 'm11q_eight2';
// スピカの さいごの ごほうび（c11_act4）の 技の 名前（battle-c11d.js の c11dGlowEight）
export const EIGHT_SONG_NAME = '八つの音のうた';
export const C11D_ABILITIES = {
  // ── プリズムナイト ──
  m11d_kn_slash: {
    name: 'プリズムぎり', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}が、光るけんで、{t}をきりつけた！', anim: 'c11w_slash',
    desc: '光るけんできりつけて、1人に大きなダメージ。',
  },
  m11d_kn_prism: {
    name: 'にじのかけら', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [112, 126], thr: 99, element: 'light' }, cast: '{a}のよろいから、にじ色のかけらが、とびちった！', anim: 'c11w_prism',
    desc: 'にじ色のかけらをとばして、敵みんなに光のダメージ。',
  },
  // ── かんむりどり ──
  m11d_cr_peck: {
    name: 'かんむりつつき', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}が、むねをはって、{t}をつついた！', anim: 'c11w_peck',
    desc: 'えらそうにつついて、1人に大きなダメージ。',
  },
  m11d_cr_proud: {
    name: 'いばりのポーズ', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'debuff', stat: 'atk', mult: 0.82, chance: 0.6 }, cast: '{a}が「えっへん！」と、むねをはった。{t}は、気が引けてしまった…', anim: 'c11w_proud',
    desc: 'いばって見せて、1人の力を下げる。',
  },
  // ── まばゆどり ──
  m11d_dz_peck: {
    name: 'まばゆいくちばし', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.38 }, cast: '{a}が、光るくちばしで、{t}をつついた！', anim: 'c11w_peck',
    desc: '光るくちばしでつついて、1人に大きなダメージ。',
  },
  m11d_dz_flash: {
    name: 'まぶしいはばたき', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'blind', chance: 0.2, turns: [1, 2] }, cast: '{a}が、白いはねを、ぱあっとひろげた！', anim: 'c11w_flash',
    desc: 'まぶしくはばたいて、敵みんなの目をくらませることがある。',
  },
  // ── てかがみ ──
  m11d_hm_beam: {
    name: 'てかがみの光', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', base: [182, 198], thr: 99, element: 'light' }, cast: '{a}が、光をはね返して、{t}にあてた！', anim: 'c11w_beam',
    desc: 'はね返した光で、1人に光の大きなダメージ。',
  },
  m11d_hm_flash: {
    name: 'ちらちらはんしゃ', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [110, 124], thr: 99, element: 'light' }, cast: '{a}が、くるくる回って、光をあちこちにはね返した！', anim: 'c11w_prism',
    desc: 'ちらちら光をはね返して、敵みんなに光のダメージ。',
  },
  // ── あかつきナイト ──
  m11d_dw_slash: {
    name: 'あかつきぎり', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.42 }, cast: '{a}が、夜明けの色のけんで、{t}をきりつけた！', anim: 'c11w_slash',
    desc: '夜明けの色のけんで、1人に大きなダメージ。',
  },
  m11d_dw_sun: {
    name: 'あさひのほのお', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [112, 126], thr: 99, element: 'fire' }, cast: '{a}のけんから、朝日のような火が、ひろがった！', anim: 'c11w_sun',
    desc: '朝日のような火で、敵みんなに炎のダメージ。',
  },
  // ── ほしのかけら ──
  m11d_sh_beam: {
    name: 'ほしのかけらビーム', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', base: [184, 200], thr: 99, element: 'light' }, cast: '{a}の先っぽから、きらりと光が出て、{t}にあたった！', anim: 'c11w_beam',
    desc: 'とがった光で、1人に光の大きなダメージ。',
  },
  m11d_sh_rain: {
    name: 'きらきらのあめ', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', base: [114, 128], thr: 99, element: 'light' }, cast: '{a}が、きらきらの雨を、ざあっとふらせた！', anim: 'c11w_rain',
    desc: 'きらきらの雨で、敵みんなに光のダメージ。',
  },
  // ── よるのかがみ ──
  m11d_nm_beam: {
    name: 'よるのうつしえ', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', base: [182, 198], thr: 99, element: 'dark' }, cast: '{a}が、夜の色の光を、{t}にうつした！', anim: 'c11w_dark',
    desc: '夜の色の光で、1人に闇の大きなダメージ。',
  },
  m11d_nm_sleep: {
    name: 'ねむりのうつしえ', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.15, turns: [1, 2] }, cast: '{a}に、星空がうつって、ゆらゆらゆれた…', anim: 'c11w_dark',
    desc: 'ゆれる星空をうつして、敵みんなをねむらせることがある。',
  },

  // ── 中ボス: 鏡と月の使い（ミラーレ・オボロ）──
  m11u_glare: {
    name: 'ねむけのにらみ', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 0.85 }, cast: '{a}が、ねむそうな目で、{t}をじろりとにらんだ！', anim: 'c10m_glare',
    desc: 'ねむそうににらんで、1人にダメージ。',
  },
  m11u_hands: {
    name: '手鏡のきらきら', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'magic', base: [700, 740], thr: 99, element: 'light' }, cast: '{a}のまわりの手鏡が、いっせいに光をはね返した！', anim: 'c10m_hands',
    desc: '手鏡の光で、敵みんなに光のダメージ。',
  },
  m11u_whip: {
    name: '雲のしなり', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 0.85 }, cast: '{a}が、雲のむちを、{t}にしならせた。', anim: 'c11o_whip',
    desc: '雲のむちで、1人にダメージ。',
  },
  m11u_moon: {
    name: '月のしずく光', kind: 'monster', mp: 0, target: 'enemies',
    effect: { type: 'magic', base: [700, 740], thr: 99, element: 'ice' }, cast: '{a}「月の光は、つめとうございます」', anim: 'c11o_moon',
    desc: 'つめたい月の光で、敵みんなに氷のダメージ。',
  },
  [BACK_HIT.mirror]: {
    name: 'うしろから手鏡', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 0.42 }, cast: '{a}が、うしろから、手鏡の光を{t}にちらっとあてた。', anim: 'c10m_glare',
    desc: 'うしろから、1人に小さなダメージ。',
  },
  [BACK_HIT.moon]: {
    name: 'うしろから雲', kind: 'monster', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 0.42 }, cast: '{a}が、うしろから、小さな雲を{t}にぶつけた。', anim: 'c11o_whip',
    desc: 'うしろから、1人に小さなダメージ。',
  },
  [ROBE]: {
    name: 'わすれの衣をかける', kind: 'monster', target: 'self',
    effect: { type: 'c11dRobe' }, cast: '{a}が、わすれの衣を、スピカのほうへ、ふわりとなびかせた…！', anim: 'c11o_robe',
    desc: 'スピカの思い出を1つ消す。思い出が消えている間、オボロは衣につつまれて、こうげきが通りにくい。',
  },

  // ── さいごの ボス: かがやきの女王ポラリス ──
  [STRIKE]: {
    name: '光のしゃく', kind: 'monster', target: 'enemy',
    effect: { type: 'c11dStrike', mult: 0.85 }, cast: '{a}が、光のしゃくを、まっすぐにふりおろした。', anim: 'c11q_strike',
    desc: '光のしゃくで、1人にダメージ。',
  },
  [RAIN]: {
    name: '光の雨', kind: 'monster', target: 'enemies',
    effect: { type: 'c11dStrike', aoe: true, base: [760, 800] }, cast: '{a}が、光のしゃくを、高くかかげた。', anim: 'c11q_rain',
    desc: '光の雨で、敵みんなに光のダメージ。',
  },
  [MEASURE]: {
    name: '光のはかり', kind: 'monster', target: 'enemy',
    effect: { type: 'c11dMeasure' }, cast: '{a}「…はかります。」', anim: 'c11q_measure',
    desc: 'いちばん弱っている人の光をはかる。だれとも手をつないでいないと、光の川にながされる。',
  },
  [SHINE]: {
    name: 'かがやき', kind: 'monster', target: 'enemies',
    effect: { type: 'c11dShine' }, cast: '{a}が、まぶしく、かがやいた！', anim: 'c11q_shine',
    desc: 'まぶしい光で、敵みんなにダメージ。手をつないでいない人には、とても大きなダメージ。',
  },
  [NAMES]: {
    name: '星の名前をよぶ', kind: 'monster', target: 'self',
    effect: { type: 'c11dNames' }, cast: '{a}は、目をとじて、星の名前を、1つよんだ。', anim: 'c11q_names',
    desc: 'ながした星の名前を、1つずつよぶ。こうげきではない。女王のHPが少し回復する。',
  },
  [SCENE]: {
    name: '八つめの音', kind: 'monster', target: 'self',
    effect: { type: 'c11dEightScene' }, cast: '……。', anim: 'c11q_eight',
    desc: '八つめの音が、やってくる。',
  },
  [EIGHT_AFTER]: {
    name: '八つめの音がとどく', kind: 'monster', target: 'self',
    effect: { type: 'c11dEightAfter' }, cast: '八つめの音が、ひびいた…！', anim: 'c11d_eight',
    desc: 'みんなが回復して、1つの輪になる。',
  },

  // ── だれでも（女王の 戦いで。その 人の 番を 使う）──
  //   cmdOnly … 特技の 一覧には 出さない（コマンドの いちばん 上の「手をつなぐ」「八つの音」から。client/battle.js）
  //   手をつなぐ … ねらいは 味方 1人（cmd.choice … 味方の id・'spica'・ひとりの 時は 'algol'）
  [HOLD]: {
    name: '手をつなぐ', kind: 'skill', mp: 0, target: 'self', noAuto: true, cmdOnly: true,
    effect: { type: 'c11dHold' }, cast: '{a}は、手をのばした！', anim: 'c11d_hold',
    desc: '仲間1人と、手をつなぐ。つないでいる間は、光のはかりでながされない。つながった人どうしで、1つの輪になる。',
  },
  //   八つの音 … 八つめの 音が 来た あとに 出る。戦いで 2回 まで
  [EIGHT]: {
    name: '八つの音', kind: 'skill', mp: 0, target: 'self', noAuto: true, cmdOnly: true,
    effect: { type: 'c11dEight' }, cast: '{a}は、8つの音を、いっしょに鳴らした！', anim: 'c11d_eight',
    desc: 'みんなが1つの、ほどけない輪になる。しばらくの間、光のはかりがきかない。戦いで2回まで。',
  },
};
