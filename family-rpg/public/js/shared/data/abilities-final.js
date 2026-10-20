// 第5章 Step 9（B9）ノクト（本気）・魔王ソリトゥスの 技と、仲間の ノクトの 技（B: 戦い。abilities.js で まぜる）
// 呪文の ダメージは base（レベル22から 0.7倍。battle.js の enemyFixedScale）
// とくべつな こうか（slAlone … ひとりにする・slMaw … 闇の口・slEat … きずなを食べる・slNight … 終わらない夜）は shared/battle-final.js の finalEffect
// ノクト（本気）は 1回目・ノクトの影の 技（m_n1_*・m_ns_*。abilities-earth.js・abilities-hoshiyomi.js）も 使う
export const FINAL_ABILITIES = {
  // ── ノクト（本気）──
  m_n2_blade: {
    name: '夜の紋章のつるぎ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.45, ignoreDef: 0.1 }, cast: '{a}の紋章から、夜の色のつるぎがのびた！', anim: 'n2_blade',
    desc: '紋章からのびる夜の色のつるぎで、1人に切りかかる。',
  },

  // ── 魔王ソリトゥス ──
  m_sl_claw: {
    name: '闇のつめ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}の大きな闇のつめが、{t}にふり下ろされた！', anim: 'sl_claw',
    desc: '大きな闇のつめで、1人を引きさく。',
  },
  m_sl_wave: {
    name: 'さびしさの波', kind: 'monster', mp: 10, target: 'enemies',
    effect: { type: 'magic', element: 'dark', base: [128, 150], thr: 99 }, cast: '{a}の体から、つめたいさびしさの波が、あふれ出した…！', anim: 'sl_wave',
    desc: 'さびしさの波で、敵みんなに闇のダメージ。',
  },
  // ひとりにする: 1人を 闇に とじこめる（動けない・仲間の 回復と 補助が とどかない。「よびかける」で もどる。battle-final.js）
  m_sl_alone: {
    name: 'ひとりにする', kind: 'monster', mp: 6, target: 'enemy',
    effect: { type: 'slAlone', mult: 0.6 }, cast: '{a}が、ゆっくりと指をさした…', anim: 'sl_alone',
    desc: '1人を闇にとじこめて、ひとりにする。ひとりの人は動けず、仲間の回復も補助もとどかない。仲間が「よびかける」ともどる。',
  },
  // 闇の口（第2段階から）: 1人に 大きい。強くなる 力を 食べる
  m_sl_maw: {
    name: '闇の口', kind: 'monster', mp: 6, target: 'enemy',
    effect: { type: 'slMaw', mult: 1.6 }, cast: '{a}の胸の、大きな闇の口が開いた…！', anim: 'sl_maw',
    desc: '大きな闇の口で、1人にかみつく。強くなっていた力を食べてしまう。',
  },
  // きずなを食べる（第2段階から。battle-final.js の finalAction が 前ぶれを 出す）
  m_sl_eat_watch: {
    name: 'きずなを食べる前ぶれ', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_sl_eat', windup: -20 }, cast: '{a}が、みんなのきずなを、じっと見つめている…！', anim: 'sl_eat_watch',
    desc: '次の番に「きずなを食べる」。身を守るとダメージが半分になり、強くなる力も食べられない。合体技の仲間のだれかが身を守れば、よやくも守れる。',
  },
  m_sl_eat: {
    name: 'きずなを食べる', kind: 'monster', target: 'enemies',
    effect: { type: 'slEat' }, cast: '{a}は、大きな口をあけて、みんなのきずなを食べようとした！', anim: 'sl_eat',
    desc: '敵みんなに大きなダメージ。合体技のよやくと、強くなっていた力を食べて、自分のHPを回復する。身を守った人は食べられない。',
  },
  // 終わらない夜（第3段階。battle-final.js の finalAction が 前ぶれを 出す）
  m_sl_night_watch: {
    name: '終わらない夜の前ぶれ', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_sl_night', windup: -20 }, cast: '{a}のまわりの星が、ひとつ、またひとつと消えていく…！', anim: 'sl_night_watch',
    desc: '次の番に「終わらない夜」。身を守るとダメージが半分になる。',
  },
  m_sl_night: {
    name: '終わらない夜', kind: 'monster', target: 'enemies',
    effect: { type: 'slNight' }, cast: '{a}の、終わらない夜！\n星のない空が、みんなをのみこむ！', anim: 'sl_night',
    desc: '星のない夜で、敵みんなに大きな闇のダメージ。身を守ると半分になる。',
  },

  // ── 仲間の ノクト（第3段階の ゲスト・クリアの あとの 酒場の 仲間。companions-castle.js の NOCTO_COMPANION）──
  // 前の 戦いの 技に ちなむ（紋章のつるぎ → 夜明けのつるぎ・黒い星のあらし → 白い星のあらし・かげぶんしん・ひとりにしない）
  nc_dawn_blade: {
    name: '夜明けのつるぎ', kana: 'よあけのつるぎ', kind: 'skill', mp: 8, target: 'enemy',
    effect: { type: 'phys', mult: 1.75, element: 'light' }, cast: '{a}の紋章から、夜明けの色のつるぎがのびた！', anim: 'nc_dawn_blade', sword: true,
    desc: '紋章からのびる夜明けの色のつるぎで、敵1体に光の大ダメージ。',
  },
  nc_star_storm: {
    name: '白い星のあらし', kana: 'しろいほしのあらし', kind: 'spell', mp: 22, target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [150, 182], thr: 80 }, cast: '{a}が手をかざすと、白い星が、あらしのようにふりそそいだ！', anim: 'nc_star_storm',
    desc: '白く光る星のあらしで、敵全体に光のダメージ。',
  },
  nc_shadow_step: {
    name: 'かげぶんしん', kana: 'かげぶんしん', kind: 'skill', mp: 6, target: 'self',
    effect: { type: 'buff', stat: 'eva', add: 0.25, dur: 30 }, cast: '{a}の足もとの影が、ゆらりと立ち上がった…！', anim: 'nc_shadow_step',
    desc: '自分の影をよび出して、敵の攻撃をかわしやすくなる。',
  },
  nc_not_alone: {
    name: 'ひとりにしない', kana: 'ひとりにしない', kind: 'spell', mp: 14, target: 'ally',
    effect: { type: 'heal', base: [190, 230], thr: 60 }, cast: '{a}は、{t}の手を、ぎゅっとにぎった。\n「…もう、だれも、ひとりにしない」', anim: 'heal2',
    desc: '仲間1人の手をにぎって、HPを大きく回復する。',
  },
};
