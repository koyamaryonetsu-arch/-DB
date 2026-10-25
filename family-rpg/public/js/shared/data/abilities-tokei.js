// 第2部 第6章 Step 5「止まった時計塔」の 魔物と、カリヨンの 技・ゲストの リオンの 技（B: 戦い。abilities.js で まぜる）
// 呪文の ダメージは base（thr: 99 で 魔力に よらない）。レベル22から 0.7倍に なる（battle.js の enemyFixedScale）
// バフ・デバフは かかった 人が 3回 行動すると 切れる（第38回 C。dur は 書かない）
// とくべつな こうか（crBell … 時の かね）は shared/battle-tokei.js の tokeiEffect
// anim は a6t_〜（client/render/battlefx-tokei.js）
export const TOKEI_ABILITIES = {
  // ── ころがり歯車 ──
  m6t_cg_roll: {
    name: '歯車ころがし', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.45 }, cast: '{a}は、ごろごろところがって、{t}に体あたり！', anim: 'a6t_roll',
    desc: 'ころがってぶつかり、1人に大きなダメージ。',
  },
  m6t_cg_spin: {
    name: 'ギアスピン', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'phys', mult: 0.7 }, cast: '{a}は、その場で、ギュイーンと回り出した！\n歯車のはが、みんなをけずる！', anim: 'a6t_spin',
    desc: 'はげしく回って、敵みんなにダメージ。',
  },
  m6t_cg_lock: {
    name: '歯車がっちり', kind: 'monster', target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.3 }, cast: '{a}の歯車が、ガチリとかみあった！', anim: 'a6t_lock',
    desc: '歯車をかみあわせて、守りを上げる。',
  },

  // ── びっくりばねばこ ──
  m6t_sb_punch: {
    name: 'びっくりパンチ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.5 }, cast: '{a}のふたが、パカッとあいた！\nばねのピエロが、{t}にパンチ！', anim: 'a6t_punch',
    desc: 'ばねでとび出して、1人に大きなダメージ。',
  },
  m6t_sb_jump: {
    name: 'ばねジャンプ', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'phys', mult: 0.7 }, cast: '{a}は、びよーん、びよーんと、はねまわった！', anim: 'a6t_jump',
    desc: 'ばねではねまわって、敵みんなにダメージ。',
  },
  m6t_sb_scare: {
    name: 'おどかし', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'confuse', chance: 0.2, turns: [1, 2] }, cast: '{a}のふたが、ばあっ！とあいた！\nみんな、びっくりして、目が回る…！', anim: 'a6t_scare',
    desc: 'とつぜんとび出して、敵みんなを混乱させることがある。',
  },

  // ── キラー ──
  m6t_kl_rush: {
    name: 'まっすぐとっしん', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.5, acc: 1.1 }, cast: '{a}は、ゴオオッと音を立てて、{t}にまっすぐつっこんだ！', anim: 'a6t_rush',
    desc: 'まっすぐつっこんで、1人にとても大きなダメージ。',
  },
  m6t_kl_call: {
    name: 'たいほうのあいず', kind: 'monster', target: 'self',
    effect: { type: 'callHelp', species: 'killer' }, cast: '{a}は、うしろのたいほうに、あいずをおくった！\nドーン！', anim: 'none',
    desc: 'たいほうから、仲間のキラーをよぶ。',
  },

  // ── カリヨン（中ボス。shared/battle-tokei.js）──
  m6t_cr_hammer: {
    name: 'かねつきハンマー', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.5 }, cast: '{a}は、大きなハンマーを、{t}めがけてふり下ろした！', anim: 'a6t_hammer',
    desc: 'かねをつく大きなハンマーで、1人に大きなダメージ。',
  },
  m6t_cr_chime: {
    name: 'かねのねいろ', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', base: [120, 140], thr: 99 }, cast: '{a}の小さなかねたちが、カラン、コロンと鳴りひびいた！\n音のなみが、みんなをおそう！', anim: 'a6t_chime',
    desc: 'かねの音のなみで、敵みんなにダメージ。',
  },
  m6t_cr_spin: {
    name: 'からくり回転', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'phys', mult: 0.8 }, cast: '{a}の体が、ギリギリと回り出した！\nハンマーが、みんなをなぎはらう！', anim: 'a6t_cspin',
    desc: '体を回して、敵みんなにダメージ。',
  },
  m6t_cr_tick: {
    name: 'ねじまきの音', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'debuff', stat: 'agi', mult: 0.75, chance: 0.5 }, cast: '{a}のせなかのねじが、ギィ…ギィ…と回った…\nみんなの動きが、にぶくなっていく…', anim: 'a6t_tick',
    desc: 'ねじの音で、敵みんなの素早さを下げることがある。',
  },
  // 時の かね（カリヨンが 4回 動くと かならず。battle-tokei.js の tokeiTurnStart が えらぶ）:
  //   味方の バフと、カリヨンの デバフが ぜんぶ 消える → みんなに 物理の 一撃（身を 守ると 半分）
  m6t_cr_bell: {
    name: '時のかね', kind: 'monster', target: 'enemies',
    effect: { type: 'crBell' }, cast: '{a}は、大きなかねを、力いっぱいついた！\nゴーン…！ゴーン…！', anim: 'a6t_bell',
    desc: '時のかねを鳴らす。強くなった力と、カリヨンの弱くなった力がみんな消え、そのあと敵みんなにとても大きなダメージ。身を守ると半分になる。',
  },

  // ── ゲストの リオン（最初の 紋章の 勇者。data/companions-tokei.js の RION_GUEST）──
  rn6_crest: {
    name: '紋章の光の剣', kana: 'もんしょうのひかりのけん', kind: 'skill', mp: 10, target: 'enemy', sword: true,
    effect: { type: 'phys', mult: 1.8, element: 'light' }, cast: '{a}の手の紋章が、まぶしく光った！\n「いくぞ…！」光の剣が、{t}を切りさく！', anim: 'a6t_crest',
    desc: '紋章の光をやどした剣で、敵1体に光の大ダメージ。',
  },
};
