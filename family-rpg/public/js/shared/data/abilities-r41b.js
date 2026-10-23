// 2026年10月（第41回 B）の 新しい 職業の 技: 雪の女王（超級職）と 第5のせいれい（伝説の職業）
//   賢者＋スーパースター → 雪の女王（男の子は 雪の王）→ 第5のせいれい（雪の女王と ほかの 超級職 1つ）
//
// 家族の ねがい「雪の女王（エルサ）という超級職をつくって。その上に、第5の精霊という伝説の職業を作って」
// ・雪の女王: 氷の 魔法・氷の かべ・雪の 仲間（ゆかいな 雪だるま・雪の 大男）・心を こめた 歌・氷の 城
// ・第5のせいれい: 風・火・水・大地の 4つの せいれいを つなぐ 5つめの せいれい。4つの 力と 氷と 光を 1つに
// ・もとの お話の 名前（歌や 仲間の 名前）は そのまま つかわず、ゲームの ことばに した
// ・名前の 字: 「霊・巨・晶・凍」は 習わない 字なので つかわない（せいれい・大男・けっしょう・こおりつく）
// きまりは abilities-jobs9.js・abilities-jobs10.js と おなじ
//  ・攻撃技は 超級職・伝説 2つ いじょう
//  ・みんなに かける 補助は ランクの 上限まで（超級職と 伝説 1.4倍。いくつもの 強さは 超級職 1.3倍・伝説 1.35倍）
//  ・Lv10 の 技が いちばん MPを 使う
//  ・看板の 技は <職業の id>_sig（anim も 同じ 名前。エフェクトは client/render/battlefx-r41b.js）
//  ・男の子の 雪の女王は「雪の王」（職業の 名前・説明・見た目だけ。技の 名前は どちらも おなじ）

const STATUS_ALL = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];

export const R41B_ABILITIES = {
  // ───────────── 雪の女王（超級職。賢者＋スーパースター） ─────────────
  sq_tsubute: {
    name: '雪の花のつぶて', kana: 'ゆきのはなのつぶて', kind: 'skill', job: 'snow_queen', mp: 7, target: 'enemy',
    effect: { type: 'magic', element: 'ice', base: [70, 86], thr: 55 },
    desc: '手のひらから、雪の花のようなけっしょうをはなつ。敵1体に氷のダメージ。', cast: '{a}の手のひらから、雪の花がまい上がった！', anim: 'r41b_snow_shot',
  },
  sq_kabe: {
    name: '氷のかべ', kana: 'こおりのかべ', kind: 'skill', job: 'snow_queen', mp: 9, target: 'allies', role: 'sup',
    effect: { type: 'buff', stat: 'def', mult: 1.35, dur: 40 },
    desc: '地面から、すきとおった氷のかべをつき上げる。仲間全員の守備力が上がる。', cast: '{a}が地面にふれると、氷のかべがそびえ立った！', anim: 'r41b_ice_wall',
  },
  sq_yukidaruma: {
    name: 'ゆかいな雪だるま', kana: 'ゆかいなゆきだるま', kind: 'skill', job: 'snow_queen', mp: 10, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [55, 70], thr: 40 }, { type: 'buff', stat: 'agi', mult: 1.15, dur: 35 }] },
    desc: '魔法で生まれた、おしゃべりな雪だるまが、みんなを笑わせる。仲間全員のHPを回復して、素早さも少し上がる。', cast: '雪だるま「やあ！ぼく、あったかいハグが大すき！」', anim: 'r41b_snowman',
  },
  sq_ootoko: {
    name: '雪の大男', kana: 'ゆきのおおおとこ', kind: 'skill', job: 'snow_queen', mp: 14, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'ice', base: [80, 96], thr: 60 },
        { type: 'atbSet', sub: 35, chance: 0.35, msg: '{t}は、雪の大男にすくみ上がった！', failMsg: '{t}は、ふみとどまった！' },
      ],
    },
    desc: '氷の城を守る、大きな雪の大男をよび出す。敵全体に氷のダメージ。こわくて止まる敵もいる。', cast: '{a}の後ろから、大きな雪の大男があらわれた！', anim: 'r41b_snow_giant',
  },
  sq_uta: {
    name: 'ありのままの歌', kana: 'ありのままのうた', kind: 'skill', job: 'snow_queen', mp: 16, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['mag', 'agi'], mult: 1.25, dur: 40 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: 'かくしていた力を、もうかくさない。心をこめた歌が、みんなの心をときはなつ。仲間全員の魔力と素早さが上がり、悪いじょうたいも治る。', cast: '{a}は、心をこめて歌い始めた…', anim: 'r41b_song',
  },
  snow_queen_sig: {
    name: '氷の城の大ふぶき', kana: 'こおりのしろのおおふぶき', kind: 'skill', job: 'snow_queen', mp: 32, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'ice', base: [155, 182], thr: 85 },
        { type: 'status', status: 'paralyze', chance: 0.2, turns: [1, 2] },
      ],
    },
    desc: '山の上に、大きな氷の城をきずき上げ、城から大ふぶきをまき起こす。敵全体に氷の大ダメージ。こおりついて動けなくなる敵もいる。', cast: '{a}「もう、かくさない！」氷の城が、空へのびていく…！', anim: 'snow_queen_sig',
  },

  // ───────────── 第5のせいれい（伝説の職業。雪の女王＋ほかの 超級職 1つ） ─────────────
  fs_kaze: {
    name: '風のせいれいのつむじ風', kana: 'かぜのせいれいのつむじかぜ', kind: 'skill', job: 'fifth_spirit', mp: 16, target: 'enemies',
    effect: { type: 'magic', element: 'wind', base: [105, 125], thr: 70 },
    desc: 'いたずら好きの風のせいれいが、大きなつむじ風になって走りまわる。敵全体に風のダメージ。', cast: '{a}のまわりで、風のせいれいがくるくるおどった！', anim: 'wind2',
  },
  fs_hi: {
    name: '火のせいれいのほのお', kana: 'ひのせいれいのほのお', kind: 'skill', job: 'fifth_spirit', mp: 12, target: 'enemy',
    effect: { type: 'magic', element: 'fire', base: [130, 155], thr: 70 },
    desc: '小さなトカゲのすがたの火のせいれいが、青いほのおをふく。敵1体に炎の大ダメージ。', cast: '{a}の手の上で、小さな火のせいれいが目をさました！', anim: 'fire2',
  },
  fs_mizu: {
    name: '水のせいれいのいやし', kana: 'みずのせいれいのいやし', kind: 'skill', job: 'fifth_spirit', mp: 24, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [140, 170], thr: 70 }, { type: 'regen', base: [18, 24], thr: 30, dur: 24 }] },
    desc: '水でできた馬のせいれいが、しぶきを上げてかけぬける。仲間全員のHPを大きく回復して、そのあとも少しずつ回復する。', cast: '{a}のよびかけに、水の馬がこたえた！', anim: 'r41b_water_heal',
  },
  fs_daichi: {
    name: '大地のせいれいのあしぶみ', kana: 'だいちのせいれいのあしぶみ', kind: 'skill', job: 'fifth_spirit', mp: 22, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', base: [115, 135], thr: 75 },
        { type: 'atbSet', sub: 40, chance: 0.35, msg: '{t}は、ゆれる地面に立っていられない！', failMsg: '{t}は、ふみとどまった！' },
      ],
    },
    desc: '山のように大きな大地のせいれいが、ゆっくりと足をふみ下ろす。敵全体にダメージ。地面がゆれて、止まる敵もいる。', cast: '大地のせいれいが、ずしん…と足をふみ下ろした！', anim: 'quake',
  },
  fs_kokoro: {
    name: '4つのせいれいの心', kana: 'よっつのせいれいのこころ', kind: 'skill', job: 'fifth_spirit', mp: 20, target: 'allies', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'mag'], mult: 1.3, dur: 40 },
    desc: '風・火・水・大地のせいれいが、仲間のまわりを回って力をかす。仲間全員の攻撃力と魔力が上がる。', cast: '4つのせいれいが、{a}のまわりに集まった！', anim: 'r41b_spirit_bless',
  },
  fifth_spirit_sig: {
    name: 'せいれいをつなぐ光', kana: 'せいれいをつなぐひかり', kind: 'skill', job: 'fifth_spirit', mp: 42, target: 'enemies', spellLike: true,
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'void', base: [205, 240], thr: 95 },
        { type: 'cure', target: 'allies', statuses: STATUS_ALL },
      ],
    },
    desc: '4つのせいれいの力を、氷と光で1つにつなぐ、第5のせいれいの最強の技。敵全体に大ダメージ。どんな敵にも効く。仲間全員の悪いじょうたいも治す。', cast: '{a}「風、火、水、大地…みんなの力を1つに！」', anim: 'fifth_spirit_sig',
  },
};
