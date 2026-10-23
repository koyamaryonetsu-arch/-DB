// 2026年10月（第40回）の 新しい 職業の 技: 2つの 伝説の 職業
//   竜の騎士 → 竜魔人（竜の騎士と ほかの 超級職 1つ）
//   セーラームーン → ネオ・クイーン・セレニティ（セーラームーンと ほかの 超級職 1つ。男の子は キング・エンディミオン）
//
// 家族の ねがい「ドラゴンの騎士の上の職業で、竜魔人を作って」「セーラームーンの上に、ネオ・クイーン・セレニティを作って」
// ・竜魔人: 両手の 竜の紋章・竜闘気・魔法剣・竜闘気を 集めた 大きな 光の 波動（もとの お話の 技の 名前は そのまま つかわず、ゲームの ことばに した）
// ・ネオ・クイーン・セレニティ: 銀水しょうの 光・仲間を 守る 結界・いやし・よみがえり・月の 王国の 力
// ・名前の 字: 「双・祈・浄・輝・翼・奇跡」は 習わない 字なので つかわない（両手の・いのり・しずめる・かがやき）。「晶」は 第33回と おなじく「銀水しょう」
// きまりは abilities-jobs8.js・abilities-jobs9.js と おなじ
//  ・攻撃技は 伝説 2つ いじょう
//  ・みんなに かける 補助は 伝説の 上限まで（1.4倍。いくつもの 強さは 1.35倍）
//  ・Lv10 の 技が いちばん MPを 使う
//  ・看板の 技は <職業の id>_sig（anim も 同じ 名前。エフェクトは client/render/battlefx-jobs8.js）
//  ・ネオ・クイーン・セレニティの 男の子（look.body が 1 で ない）は masc の 名前・セリフ・説明・えんしゅつ（強さは おなじ。shared/ability-label.js）

const STATUS_ALL = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];

export const JOB10_ABILITIES = {
  // ───────────── 竜魔人（伝説の職業。竜の騎士＋ほかの 超級職 1つ） ─────────────
  rm_monshou: {
    name: '両手の竜の紋章', kana: 'りょうてのりゅうのもんしょう', kind: 'skill', job: 'ryumajin', mp: 10, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'mag'], mult: 1.5, dur: 45 },
    desc: '右手と左手に、竜の紋章がうかび上がる。自分の攻撃力と魔力がとても上がる。', cast: '{a}の両手に、竜の紋章がかがやいた！', anim: 'r40_crest',
  },
  rm_mahouken: {
    name: 'いなずまの魔法剣', kana: 'いなずまのまほうけん', kind: 'skill', job: 'ryumajin', mp: 14, target: 'enemy',
    effect: { type: 'phys', mult: 3.1, element: 'bolt', critBonus: 0.1 },
    desc: '剣にいなずまの呪文をこめて、そのまま切りおろす魔法剣。敵1体に雷の大ダメージ。会心も出やすい。', cast: '{a}は、剣にいなずまをよびこんだ…！', anim: 'r40_magic_sword',
  },
  rm_otakebi: {
    name: '竜魔のおたけび', kana: 'りゅうまのおたけび', kind: 'skill', job: 'ryumajin', mp: 14, target: 'enemies', role: 'sup',
    effect: {
      type: 'multi',
      parts: [
        { type: 'debuff', stat: 'atk', mult: 0.75, dur: 40, chance: 0.8 },
        { type: 'atbSet', sub: 40, chance: 0.5, msg: '{t}は、おたけびにすくみ上がった！', failMsg: '{t}は、ふみとどまった！' },
      ],
    },
    desc: '竜のようなおたけびで、あたりをふるわせる。敵全体の攻撃力が下がり、すくんで止まる敵もいる。', cast: '{a}の、竜魔のおたけび！', anim: 'warcry',
  },
  rm_mamori: {
    name: '竜闘気の守り', kana: 'どらごにっくおーらのまもり', kind: 'skill', job: 'ryumajin', mp: 22, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [100, 125], thr: 50 }, { type: 'buff', stat: 'def', mult: 1.35, dur: 40 }] },
    desc: '竜闘気を大きく広げて、仲間をつつむ。仲間全員のHPを回復して、守備力も上がる。', cast: '{a}の竜闘気が、仲間みんなをつつみこんだ！', anim: 'r40_aura_guard',
  },
  rm_honoo: {
    name: '竜魔の大火炎', kana: 'りゅうまのだいかえん', kind: 'skill', job: 'ryumajin', mp: 20, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [135, 160], thr: 80 },
    desc: '竜の口のように両手を合わせて、大きな炎をはく。敵全体に炎の大ダメージ。', cast: '{a}は、両手から大きな炎をはいた！', anim: 'fire3',
  },
  ryumajin_sig: {
    name: '竜魔の大波動', kana: 'りゅうまのだいはどう', kind: 'skill', job: 'ryumajin', mp: 42, target: 'enemies', spellLike: true,
    effect: { type: 'magic', element: 'void', base: [225, 265], thr: 95 },
    desc: '両手の竜の紋章に竜闘気を集めて、大きな光の波動にしてはなつ、竜魔人の最強の技。敵全体に大ダメージ。どんな敵にも効く。', cast: '{a}は両手をつき出した…！竜魔の大波動！', anim: 'ryumajin_sig',
  },

  // ───────────── ネオ・クイーン・セレニティ（伝説の職業。セーラームーン＋ほかの 超級職 1つ） ─────────────
  // 男の子（look.body が 1 で ない）は キング・エンディミオン: masc の 名前・セリフ・説明・えんしゅつ
  nq_hikari: {
    name: '銀水しょうの光', kana: 'ぎんずいしょうのひかり', kind: 'skill', job: 'neo_queen', mp: 12, target: 'enemy',
    effect: { type: 'magic', element: 'light', base: [125, 150], thr: 70 },
    desc: '銀水しょうから、まっすぐな銀色の光をはなつ。敵1体に光の大ダメージ。', cast: '{a}は、銀水しょうを高くかかげた！', anim: 'r40_crystal',
    masc: { name: '王の剣の光', kana: 'おうのけんのひかり', cast: '{a}は、王の剣を高くかかげた！', desc: '王の剣から、まっすぐな金色の光をはなつ。敵1体に光の大ダメージ。' },
  },
  nq_kekkai: {
    name: 'クリスタルの結界', kana: 'くりすたるのけっかい', kind: 'skill', job: 'neo_queen', mp: 18, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'def', mult: 1.35, dur: 45 }, { type: 'regen', base: [22, 28], thr: 30, dur: 24 }] },
    desc: 'すきとおったクリスタルのかべで、仲間をつつむ。仲間全員の守備力が上がり、少しずつ回復していく。', cast: '{a}のまわりに、クリスタルの結界がひろがった！', anim: 'r40_barrier',
  },
  nq_iyashi: {
    name: '月の女王のいやし', kana: 'つきのじょおうのいやし', kind: 'skill', job: 'neo_queen', mp: 24, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [150, 180], thr: 70 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: 'やさしい月の女王の光が、みんなをつつむ。仲間全員のHPを大きく回復して、悪いじょうたいも治す。', cast: '{a}「みんな、もうだいじょうぶよ」', anim: 'r40_queen_heal',
    masc: { name: '地球の王のいやし', kana: 'ちきゅうのおうのいやし', cast: '{a}「みんな、もうだいじょうぶだ」', desc: '地球の王のやさしい光が、みんなをつつむ。仲間全員のHPを大きく回復して、悪いじょうたいも治す。' },
  },
  nq_fukkatsu: {
    name: 'よみがえりの銀水しょう', kana: 'よみがえりのぎんずいしょう', kind: 'skill', job: 'neo_queen', mp: 22, target: 'deadAlly', role: 'heal',
    effect: { type: 'revive', hpRatio: 1 },
    desc: '銀水しょうの力を、ひとりにそそぐ。たおれた仲間1人を、元気いっぱいに生き返らせる。', cast: '{a}は、銀水しょうに心をこめた…', anim: 'revive',
    masc: { name: 'よみがえりの黄金クリスタル', kana: 'よみがえりのおうごんくりすたる', cast: '{a}は、黄金のクリスタルに心をこめた…', desc: '地球の黄金のクリスタルの力を、ひとりにそそぐ。たおれた仲間1人を、元気いっぱいに生き返らせる。' },
  },
  nq_shizume: {
    name: 'やすらぎの月光', kana: 'やすらぎのげっこう', kind: 'skill', job: 'neo_queen', mp: 20, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'light', base: [110, 130], thr: 75 },
        { type: 'status', status: 'sleep', chance: 0.3, turns: [1, 2] },
      ],
    },
    desc: 'しずかな月の光で、あれた心をしずめる。敵全体に光のダメージ。そのままねむってしまう敵もいる。', cast: '{a}のまわりに、しずかな月の光がふりそそいだ…', anim: 'holy',
  },
  neo_queen_sig: {
    name: 'よみがえる月の王国', kana: 'よみがえるつきのおうこく', kind: 'skill', job: 'neo_queen', mp: 42, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'light', base: [205, 240], thr: 90 },
        { type: 'heal', target: 'allies', base: [70, 90], thr: 50 },
      ],
    },
    desc: '銀水しょうの力をすべてときはなち、むかしの月の王国のかがやきをよみがえらせる。敵全体に光の大ダメージ。仲間全員のHPも回復する。', cast: '{a}「銀水しょうよ、月の王国の光を！」', anim: 'neo_queen_sig',
    masc: { name: 'ゴールデン・クリスタル', kana: 'ごーるでんくりすたる', cast: '{a}「地球の黄金のクリスタルよ、力を！」', desc: '地球の王の黄金のクリスタルが、大地をつつむ光をはなつ。敵全体に光の大ダメージ。仲間全員のHPも回復する。', anim: 'r40_king_sig' },
  },
};
