// 第66回 A班（2026年11月）: 4つの 伝説の 職業の 技（docs/plan-r66-legend.md）
//   ガーディアン＋大神官 → 守りの神 ／ ソードマスター＋魔剣士 → 光と闇の剣神
//   モンスターマスター（＋ほかの 超級職 1つ）→ ポケモンマスター ／ 大賢者（＋ほかの 超級職 1つ）→ 千年の大魔法使い
//
// きまりは abilities-r41a.js と おなじ
//  ・1つの 職業に 7こ（Lv1・2・3・5・7・8・10）。攻撃技は 2つ いじょう
//  ・みんなに かける 補助は 伝説の 上限まで（1.4倍。いくつもの 強さは 1.35倍）
//  ・Lv10 の 技が いちばん MPを 使う
//  ・看板の 技は <職業の id>_sig（anim も 同じ 名前。エフェクトは client/render/battlefx-r66a.js）
//  ・敵に かける 技の 大事な もの（r66a_…）も battlefx-r66a.js。みかたに かける 技は 前から ある えんしゅつ
// ポケモンマスターの「仲間の 魔物と いっしょに」の 技は monPal（battle-r66a.js。仲間の 魔物 1体に つき 強く なる。3体まで）
// 千年の大魔法使いは こわい ことばを 使わない（家族の ねがい）

const STATUS_ALL = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];

export const R66A_ABILITIES = {
  // ───────────── 守りの神（ガーディアン＋大神官） ─────────────
  gg_seinaru: {
    name: '聖なるたての一撃', kana: 'せいなるたてのいちげき', kind: 'skill', job: 'guard_god', mp: 10, target: 'enemy',
    effect: { type: 'phys', mult: 2.8, atkFrom: 'def', element: 'light' },
    desc: '光るたてで、思いきり体当たりする。敵1体に大ダメージ。守備力が高いほど強い。', cast: '{a}の聖なるたての一撃！', anim: 'r66a_shield',
  },
  gg_kabau: {
    name: '守りの神の構え', kana: 'まもりのかみのかまえ', kind: 'skill', job: 'guard_god', mp: 8, target: 'self',
    effect: { type: 'cover', dur: 30, all: true, defMult: 1.8 },
    desc: '仲間全員の前に立ち、自分がかわりに攻撃を受ける。自分の守備力もとても上がる。', cast: '{a}「みんな、うしろへ！」', anim: 'guard',
  },
  gg_megumi: {
    name: '神のめぐみ', kana: 'かみのめぐみ', kind: 'spell', job: 'guard_god', mp: 22, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [150, 180], thr: 70 }, { type: 'regen', base: [18, 24], thr: 40, dur: 24 }] },
    desc: 'やさしい光が、空からふりそそぐ。仲間全員のHPを回復して、しばらく少しずつ回復もする。', cast: '{a}はいのった。空から、やさしい光がふりそそぐ！', anim: 'heal2',
  },
  gg_hikari: {
    name: '光のとりで', kana: 'ひかりのとりで', kind: 'spell', job: 'guard_god', mp: 20, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'def', mult: 1.4, dur: 45 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: '光のかべで、仲間をすっぽりつつむ。仲間全員の守備力が上がり、悪いじょうたいも治す。', cast: '{a}のまわりに、光のとりでがそびえ立った！', anim: 'holy',
  },
  gg_inochi: {
    name: '命のいのり', kana: 'いのちのいのり', kind: 'spell', job: 'guard_god', mp: 30, target: 'deadAllies',
    effect: { type: 'revive', hpRatio: 0.6 },
    desc: '守りの神のいのりで、たおれた仲間全員を生き返らせる。', cast: '{a}は、たおれた仲間のためにいのった！', anim: 'revive',
  },
  gg_ten: {
    name: '天のさばきの光', kana: 'てんのさばきのひかり', kind: 'spell', job: 'guard_god', mp: 24, target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [150, 180], thr: 85, stat: 'heal' },
    desc: '空から、まっ白な光の柱がふりそそぐ。敵全体にダメージ。回復の力が強いほど強い。', cast: '{a}が手をかかげると、空から光がふりそそいだ！', anim: 'r66a_pillar',
  },
  guard_god_sig: {
    name: '守りの神の大結界', kana: 'まもりのかみのだいけっかい', kind: 'skill', job: 'guard_god', mp: 44, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 2.4, atkFrom: 'def', element: 'light' },
        { type: 'buff', target: 'allies', stat: 'def', mult: 1.3, dur: 40 },
        { type: 'heal', target: 'allies', base: [70, 90], thr: 50 },
      ],
    },
    desc: '大きな光のたてが空からおりてきて、敵をおしかえし、仲間を守る、守りの神の最強の技。敵全体に大ダメージ。守備力が高いほど強い。仲間全員の守備力が上がり、HPも回復する。', cast: '{a}「ここから先へは、だれも通さない！」', anim: 'guard_god_sig',
  },

  // ───────────── 光と闇の剣神（ソードマスター＋魔剣士） ─────────────
  ks_hikari: {
    name: '光の剣', kana: 'ひかりのけん', kind: 'skill', job: 'kenshin', mp: 10, target: 'enemy',
    effect: { type: 'phys', mult: 2.8, element: 'light', vsRace: { undead: 1.5, demon: 1.3 } },
    desc: '右手の光の剣で、まっすぐ切る。敵1体に大ダメージ。ゾンビや悪魔には、さらによく効く。', cast: '{a}の光の剣！', anim: 'r66a_light_blade',
  },
  ks_yami: {
    name: '闇の魔剣', kana: 'やみのまけん', kind: 'skill', job: 'kenshin', mp: 12, target: 'enemy',
    effect: { type: 'drainHp', mult: 2.6 },
    desc: '左手の闇の剣で切りつけて、敵の力をすいとる。敵1体に大ダメージ。あたえたダメージの半分だけ、自分のHPが回復する。', cast: '{a}の闇の魔剣！', anim: 'r66a_dark_blade',
  },
  ks_nitou: {
    name: '光と闇の二刀かまえ', kana: 'ひかりとやみのにとうかまえ', kind: 'skill', job: 'kenshin', mp: 10, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.5, dur: 45 },
    desc: '光の剣と闇の剣を、両手で構える。自分の攻撃力と素早さがとても上がる。', cast: '{a}は、光の剣と闇の剣を両手に構えた！', anim: 'charge',
  },
  ks_ame: {
    name: '光の剣の雨', kana: 'ひかりのけんのあめ', kind: 'skill', job: 'kenshin', mp: 20, target: 'enemies',
    effect: { type: 'phys', mult: 0.8, hits: 5, random: true, element: 'light' },
    desc: '空いっぱいに光の剣をうかべて、雨のようにふらせる。敵全体に、ランダムで5回ダメージ。', cast: '{a}が剣をかかげると、空に光の剣がならんだ！', anim: 'r66a_light_rain',
  },
  ks_yaminami: {
    name: '闇の大波', kana: 'やみのおおなみ', kind: 'skill', job: 'kenshin', mp: 20, target: 'enemies',
    effect: { type: 'phys', mult: 1.7, element: 'dark', debuff: { stat: 'def', mult: 0.75, dur: 40, chance: 0.7 } },
    desc: '闇の剣をふって、黒い大波をおこす。敵全体にダメージ。守備力が下がる敵もいる。', cast: '{a}の闇の大波！', anim: 'r66a_dark_wave',
  },
  ks_juuji: {
    name: '光と闇の十字斬り', kana: 'ひかりとやみのじゅうじぎり', kind: 'skill', job: 'kenshin', mp: 18, target: 'enemy',
    effect: { type: 'phys', mult: 1.9, hits: 2, ignoreDef: 0.3 },
    desc: '光の剣と闇の剣で、十字に切る。敵1体に2回、大ダメージ。守りの固い敵にもよく効く。', cast: '{a}の光と闇の十字斬り！', anim: 'r66a_cross',
  },
  kenshin_sig: {
    name: '光と闇の大剣神斬', kana: 'ひかりとやみのだいけんしんざん', kind: 'skill', job: 'kenshin', mp: 42, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 1.45, element: 'light', ignoreDef: 0.2 },
        { type: 'phys', mult: 1.45, element: 'dark', ignoreDef: 0.2 },
      ],
    },
    desc: '光の剣と闇の剣を1つに合わせて、天まで光る大きな剣にしてふりおろす、光と闇の剣神の最強の技。敵全体に、光と闇で2回大ダメージ。', cast: '{a}「光と闇、2つの剣を1つに！」', anim: 'kenshin_sig',
  },

  // ───────────── ポケモンマスター（モンスターマスター＋ほかの 超級職 1つ） ─────────────
  pk_ball: {
    name: 'モンスターボール', kana: 'もんすたーぼーる', kind: 'skill', job: 'poke_master', mp: 10, target: 'enemy',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 2.6 },
        { type: 'atbSet', sub: 40, chance: 0.4, msg: '{t}は、ボールの中でじたばたしている！', failMsg: '{t}は、すぐにボールから出てきた！' },
      ],
    },
    desc: '赤と白のボールを、思いきり投げる。敵1体に大ダメージ。ボールにすいこまれて、少しのあいだ止まる敵もいる。', cast: '{a}は、モンスターボールを投げた！', anim: 'r66a_ball',
  },
  pk_kimeta: {
    name: 'きみにきめた！', kana: 'きみにきめた', kind: 'skill', job: 'poke_master', mp: 14, target: 'allies', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.35, dur: 45 },
    desc: '仲間を、まっすぐ見つめてはげます。仲間全員の攻撃力と素早さが上がる。', cast: '{a}「きみにきめた！」', anim: 'warcry',
  },
  pk_10man: {
    name: 'たのんだぞ10まんボルト', kana: 'たのんだぞじゅうまんぼると', kind: 'skill', job: 'poke_master', mp: 18, target: 'enemies',
    effect: { type: 'phys', mult: 1.6, element: 'bolt', status: { status: 'paralyze', chance: 0.3, turns: [1, 1] } },
    desc: '黄色い仲間の魔物に、大きないなずまを出してもらう。敵全体に雷のダメージ。しびれて動けなくなる敵もいる。', cast: '{a}「10まんボルトだ！」', anim: 'r66a_volt',
  },
  pk_center: {
    name: 'ポケモンセンター', kana: 'ぽけもんせんたー', kind: 'skill', job: 'poke_master', mp: 22, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [140, 170], thr: 70 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: '魔物の病院のように、みんなをしっかり休ませる。仲間全員のHPを回復して、悪いじょうたいも治す。', cast: 'テレレレッテッテッテ～♪ みんな元気になった！', anim: 'heal_ring',
  },
  pk_issho: {
    name: 'いっしょに戦おう', kana: 'いっしょにたたかおう', kind: 'skill', job: 'poke_master', mp: 20, target: 'enemies',
    effect: { type: 'phys', mult: 0.75, hits: 2, monPal: 0.25 },
    desc: '仲間の魔物と、力を合わせて攻撃する。敵全体に2回ダメージ。いっしょに戦う仲間の魔物が多いほど強い。', cast: '{a}「みんな、いっしょにいくぞ！」', anim: 'r66a_team',
  },
  pk_masterball: {
    name: 'マスターボール', kana: 'ますたーぼーる', kind: 'skill', job: 'poke_master', mp: 22, target: 'enemy',
    effect: { type: 'phys', mult: 3.4, critBonus: 0.15, ignoreDef: 0.3 },
    desc: 'むらさきにかがやく、とくべつなボールを投げる。敵1体にとても大きなダメージ。守りの固い敵にもよく効き、会心も出やすい。', cast: '{a}は、とっておきのマスターボールを投げた！', anim: 'r66a_masterball',
  },
  poke_master_sig: {
    name: 'めざせポケモンマスター', kana: 'めざせぽけもんますたー', kind: 'skill', job: 'poke_master', mp: 42, target: 'enemies',
    effect: { type: 'phys', mult: 2.5, ignoreDef: 0.25, monPal: 0.15 },
    desc: 'いくつものボールが空をまい、出てきた魔物たちといっしょに大攻撃する、ポケモンマスターの最強の技。敵全体に大ダメージ。いっしょに戦う仲間の魔物が多いほど強い。', cast: '{a}「みんな、出てこい！」', anim: 'poke_master_sig',
  },

  // ───────────── 千年の大魔法使い（大賢者＋ほかの 超級職 1つ） ─────────────
  sm_hanabatake: {
    name: '花畑を出す魔法', kana: 'はなばたけをだすまほう', kind: 'spell', job: 'sennen_mage', mp: 16, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [100, 120], thr: 60 }, { type: 'regen', base: [16, 20], thr: 30, dur: 24 }] },
    desc: 'あたり一面に、きれいな花畑を出す。いちばん大すきな魔法。仲間全員のHPを回復して、しばらく少しずつ回復もする。', cast: '{a}がつえをふると、あたり一面に花がさいた！', anim: 'heal_dance',
  },
  sm_kougeki: {
    name: 'ふつうの攻撃魔法', kana: 'ふつうのこうげきまほう', kind: 'spell', job: 'sennen_mage', mp: 14, target: 'enemy',
    effect: { type: 'magic', element: 'void', base: [170, 200], thr: 85 },
    desc: 'むかしはだれも防げなかった光の魔法も、今ではふつうの攻撃魔法。敵1体にダメージ。どんな敵にも効く。', cast: '{a}は、ふつうの攻撃魔法をはなった！', anim: 'r66a_beam',
  },
  sm_bougyo: {
    name: '防御魔法', kana: 'ぼうぎょまほう', kind: 'spell', job: 'sennen_mage', mp: 16, target: 'allies', role: 'sup',
    effect: { type: 'buff', stat: 'def', mult: 1.4, dur: 45 },
    desc: '六角形の光のかべを、たくさんならべて守る。仲間全員の守備力が上がる。', cast: '{a}の前に、六角形の光のかべがならんだ！', anim: 'guard',
  },
  sm_kaminari: {
    name: 'かみなりの大魔法', kana: 'かみなりのだいまほう', kind: 'spell', job: 'sennen_mage', mp: 24, target: 'enemies',
    effect: { type: 'magic', element: 'bolt', base: [130, 155], thr: 80 },
    desc: '空から、大きないなずまを何本もおとす。敵全体に雷のダメージ。', cast: '{a}がつえを空に向けると、いなずまが走った！', anim: 'r66a_thunder',
  },
  sm_kakusu: {
    name: '魔力をかくす', kana: 'まりょくをかくす', kind: 'spell', job: 'sennen_mage', mp: 10, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['mag', 'agi'], mult: 1.5, dur: 45 },
    desc: '自分の魔力を小さく見せて、相手をゆだんさせる。千年かけてみがいたわざ。自分の魔力と素早さがとても上がる。', cast: '{a}は、魔力をすっとかくした…。', anim: 'charge',
  },
  sm_koori: {
    name: '氷の大魔法', kana: 'こおりのだいまほう', kind: 'spell', job: 'sennen_mage', mp: 24, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'ice', base: [125, 150], thr: 80 },
        { type: 'atbSet', sub: 35, chance: 0.4, msg: '{t}は、こおりついて動けない！', failMsg: '{t}は、氷をふりはらった！' },
      ],
    },
    desc: '大きな氷の柱を、いくつも地面から出す。敵全体に氷のダメージ。こおりついて、少しのあいだ止まる敵もいる。', cast: '{a}の氷の大魔法！', anim: 'r66a_ice',
  },
  sennen_mage_sig: {
    name: '千年の花の大魔法', kana: 'せんねんのはなのだいまほう', kind: 'spell', job: 'sennen_mage', mp: 46, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'void', base: [215, 250], thr: 95 },
        { type: 'heal', target: 'allies', base: [60, 80], thr: 50 },
      ],
    },
    desc: '千年の旅で集めた魔法を、全部1つにしてはなつ、千年の大魔法使いの最強の魔法。敵全体に大ダメージ。どんな敵にも効く。あとに花畑がひろがって、仲間全員のHPも回復する。', cast: '{a}「千年分の魔法、見せてあげる」', anim: 'sennen_mage_sig',
  },
};
