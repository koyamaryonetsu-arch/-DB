// 2026年11月（第66回 B班）の 伝説の 職業の 技: アイドル・芸能・料理（docs/plan-r66-legend.md）
//   星の歌姫 か フルーツジッパー → ニューカワイイ（女性だけ）
//   星の歌姫 か アラシ         → SMAP（男性だけ）
//   M-1王者 → 大御所（M-1王者と ほかの 超級職 1つ）
//   三ツ星シェフ → 五つ星シェフ（三ツ星シェフと ほかの 超級職 1つ）
//
// 家族の ねがい
// ・ニューカワイイ: 歌で 全員を 強く する（「紅白の大トリ」の 女の子の 行き先）
// ・SMAP: 5人の 歌で 全員を 強く する（「紅白の大トリ」の 男の子の 行き先）
// ・大御所: お笑い界の トップ。敵を 笑わせて 動けなく する・こんらん
// ・五つ星シェフ: 戦いの 中で 料理を 出して、全員を 回復し 強く する
// 技の 名前は 歌の 題名ふうに みじかく（そのまま うつさない）
// きまりは abilities-r41a.js と おなじ
//  ・攻撃技は 伝説 2つ いじょう（技は Lv1〜10 で 7こ）
//  ・みんなに かける 補助は 伝説の 上限まで（1.4倍。いくつもの 強さは 1.35倍）
//  ・Lv10 の 技が いちばん MPを 使う
//  ・看板の 技は <職業の id>_sig（anim も 同じ 名前。エフェクトは client/render/battlefx-r66b.js）

const STATUS_ALL = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];

export const R66B_ABILITIES = {
  // ───────────── ニューカワイイ（伝説の職業。星の歌姫 か フルーツジッパー。女性だけ） ─────────────
  nk_ichiban: {
    name: '一番かわいいところ', kana: 'いちばんかわいいところ', kind: 'skill', job: 'new_kawaii', mp: 12, target: 'allies', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'mag'], mult: 1.3, dur: 45 },
    desc: 'みんなの一番かわいいところを、歌でほめちぎる。仲間全員の攻撃力と魔力が上がる。', cast: '{a}「みんなの一番かわいいところ、知ってるよ！」', anim: 'r66b_kawaii',
  },
  nk_heart: {
    name: 'ハートのビーム', kana: 'はーとのびーむ', kind: 'skill', job: 'new_kawaii', mp: 12, target: 'enemy',
    effect: { type: 'magic', element: 'light', base: [130, 155], thr: 70 },
    desc: '両手でハートを作って、ピンクの光をうちだす。敵1体に光の大ダメージ。', cast: '{a}のハートのビーム！', anim: 'r66b_heart',
  },
  nk_yell: {
    name: 'ずっとエール', kana: 'ずっとえーる', kind: 'skill', job: 'new_kawaii', mp: 20, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [110, 135], thr: 60 }, { type: 'regen', base: [18, 24], thr: 30, dur: 24 }] },
    desc: 'がんばるみんなに、元気なエールの歌。仲間全員のHPを回復して、そのあとも少しずつ回復する。', cast: '{a}「フレー！フレー！みんな！」', anim: 'heal_dance',
  },
  nk_mitore: {
    name: '見とれちゃう？', kana: 'みとれちゃう', kind: 'skill', job: 'new_kawaii', mp: 18, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'light', base: [85, 105], thr: 70 },
        { type: 'status', status: 'paralyze', chance: 0.35, turns: [1, 2] },
      ],
    },
    desc: 'ウインクひとつで、ステージがきらきらにかがやく。敵全体に光のダメージ。見とれて動けなくなる敵もいる。', cast: '{a}はウインクした！', anim: 'r66b_heart',
  },
  nk_newstage: {
    name: 'ニューステージ', kana: 'にゅーすてーじ', kind: 'skill', job: 'new_kawaii', mp: 22, target: 'allies', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'def', 'agi'], mult: 1.3, dur: 45 },
    desc: '新しいステージの幕が上がる。仲間全員の攻撃力・守備力・素早さが上がる。', cast: '{a}「新しいステージ、はじまるよ！」', anim: 'stage',
  },
  nk_ribbon: {
    name: 'キラキラ流れ星', kana: 'きらきらながれぼし', kind: 'skill', job: 'new_kawaii', mp: 24, target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [125, 150], thr: 75 },
    desc: 'リボンをつけた流れ星が、つぎつぎにふってくる。敵全体に光の大ダメージ。', cast: '{a}が空を指さすと、キラキラの流れ星がふってきた！', anim: 'meteor',
  },
  new_kawaii_sig: {
    name: '世界一かわいいライブ', kana: 'せかいいちかわいいらいぶ', kind: 'skill', job: 'new_kawaii', mp: 42, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'light', base: [205, 240], thr: 90 },
        { type: 'buff', target: 'allies', stats: ['atk', 'mag'], mult: 1.25, dur: 30 },
      ],
    },
    desc: 'ピンクのライトとハートがあふれる、ニューカワイイの最強のライブ。敵全体に光の大ダメージ。仲間全員の攻撃力と魔力も上がる。', cast: '{a}「世界でいちばんかわいいライブ、始めます！」', anim: 'new_kawaii_sig',
  },

  // ───────────── SMAP（伝説の職業。星の歌姫 か アラシ。男性だけ） ─────────────
  sm_smile: {
    name: 'オリジナルスマイル', kana: 'おりじなるすまいる', kind: 'skill', job: 'smap', mp: 12, target: 'allies', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.3, dur: 45 },
    desc: 'とびきりのえがおで歌う。仲間全員の攻撃力と素早さが上がる。', cast: '{a}は、とびきりのえがおで歌った！', anim: 'r66b_five',
  },
  sm_inazuma: {
    name: '青いいなずま', kana: 'あおいいなずま', kind: 'skill', job: 'smap', mp: 16, target: 'enemies',
    effect: { type: 'magic', element: 'bolt', base: [105, 125], thr: 70 },
    desc: 'ステージに青いいなずまが走る。敵全体に雷のダメージ。', cast: '{a}の青いいなずま！', anim: 'bolt2',
  },
  sm_lion: {
    name: 'らいおんハート', kana: 'らいおんはーと', kind: 'skill', job: 'smap', mp: 18, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'def', mult: 1.35, dur: 45 }, { type: 'regen', base: [20, 26], thr: 30, dur: 24 }] },
    desc: 'ライオンのように強くやさしい心で、みんなを守る歌。仲間全員の守備力が上がり、少しずつ回復していく。', cast: '{a}「きみを守るよ」', anim: 'r66b_five',
  },
  sm_shake: {
    name: 'シェイク', kana: 'しぇいく', kind: 'skill', job: 'smap', mp: 16, target: 'enemies',
    effect: { type: 'status', status: 'confuse', chance: 0.45, turns: [1, 3] },
    desc: 'ノリノリのダンスで、ステージをゆらす。敵全体がつられておどりだし、混乱することがある。', cast: '{a}のシェイク！ステージがゆれる！', anim: 'notes',
  },
  sm_ganbaro: {
    name: 'がんばりましょう', kana: 'がんばりましょう', kind: 'skill', job: 'smap', mp: 22, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [120, 150], thr: 60 }, { type: 'mpHeal', base: [6, 10] }] },
    desc: '5人の声で「がんばりましょう！」。仲間全員のHPとMPを回復する。', cast: '5人の声がひびいた！「がんばりましょう！」', anim: 'r66b_five',
  },
  sm_yozora: {
    name: '夜空のむこう', kana: 'よぞらのむこう', kind: 'skill', job: 'smap', mp: 24, target: 'enemy',
    effect: { type: 'magic', element: 'light', base: [190, 225], thr: 80 },
    desc: '夜空のむこうから、白い光がまっすぐとどく。敵1体に光の大ダメージ。', cast: '{a}は、夜空のむこうを見上げた…', anim: 'holy',
  },
  smap_sig: {
    name: '世界に一つだけの花', kana: 'せかいにひとつだけのはな', kind: 'skill', job: 'smap', mp: 42, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'light', base: [205, 240], thr: 90 },
        { type: 'buff', target: 'allies', stats: ['atk', 'def', 'agi'], mult: 1.2, dur: 30 },
      ],
    },
    desc: '5人の歌声が1つになって、みんなの心に花がさく、SMAPの最強の歌。敵全体に光の大ダメージ。仲間全員の攻撃力・守備力・素早さも上がる。', cast: '5人の歌声が、1つになった…！', anim: 'smap_sig',
  },

  // ───────────── 大御所（伝説の職業。M-1王者＋ほかの 超級職 1つ） ─────────────
  og_hitokoto: {
    name: '大御所のひとこと', kana: 'おおごしょのひとこと', kind: 'skill', job: 'oogosho', mp: 12, target: 'enemy',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', base: [135, 160], thr: 70 },
        { type: 'atbSet', sub: 35, chance: 0.6, msg: '{t}は、思わずふき出した！', failMsg: '{t}は、ぐっとこらえた！' },
      ],
    },
    desc: 'ぼそっと言ったひとことが、ずしんとひびく。敵1体に大ダメージ。笑って動きがおそくなることもある。', cast: '{a}「…まあ、そういうことやな」', anim: 'r66b_laugh',
  },
  og_bakushou: {
    name: 'スタジオ大爆笑', kana: 'すたじおだいばくしょう', kind: 'skill', job: 'oogosho', mp: 16, target: 'enemies',
    effect: { type: 'atbSet', sub: 60, chance: 0.6, msg: '{t}は、笑いが止まらない！', failMsg: '{t}は、なんとかこらえた！' },
    desc: 'スタジオ中が、おなかをかかえて大笑い。敵全体が笑いころげて、行動ゲージがへる（ボスには効きにくい）。', cast: '{a}のトークで、スタジオが大爆笑！', anim: 'laugh',
  },
  og_boke: {
    name: 'まさかの大ボケ', kana: 'まさかのおおぼけ', kind: 'skill', job: 'oogosho', mp: 18, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', base: [95, 115], thr: 70 },
        { type: 'status', status: 'confuse', chance: 0.4, turns: [1, 3] },
      ],
    },
    desc: 'だれも考えつかない、まさかの大ボケ。敵全体にダメージ。わけがわからなくなって、混乱する敵もいる。', cast: '{a}の、まさかの大ボケ！', anim: 'r66b_laugh',
  },
  og_kanroku: {
    name: '大御所のかんろく', kana: 'おおごしょのかんろく', kind: 'skill', job: 'oogosho', mp: 14, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['def', 'mag'], mult: 1.5, dur: 45 },
    desc: 'どっしりかまえて、大御所のかんろくを見せる。自分の守備力と魔力がとても上がる。', cast: '{a}は、どっしりとかまえた。', anim: 'buff',
  },
  og_wakate: {
    name: '若手へのアドバイス', kana: 'わかてへのあどばいす', kind: 'skill', job: 'oogosho', mp: 20, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'mag'], mult: 1.3, dur: 40 }, { type: 'mpHeal', base: [4, 6] }] },
    desc: '若手に、笑いのコツをこっそり教える。仲間全員の攻撃力と魔力が上がり、MPも少し回復する。', cast: '{a}「ここは、もっと大きな声でいこか」', anim: 'warcry',
  },
  og_harisen: {
    name: '大御所のハリセン', kana: 'おおごしょのはりせん', kind: 'skill', job: 'oogosho', mp: 22, target: 'enemy',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 2.9, dispel: true },
        { type: 'atbSet', sub: 50, chance: 0.5, msg: '{t}は、目を回している！', failMsg: '{t}は、ふんばった！' },
      ],
    },
    desc: '大きなハリセンで、スパーンと一発。敵1体に大ダメージ。強くなっていた力を消して、動きも止める（ボスには効きにくい）。', cast: 'スパーン！{a}のハリセン！', anim: 'r66b_harisen',
  },
  oogosho_sig: {
    name: '日本中が大爆笑', kana: 'にっぽんじゅうがだいばくしょう', kind: 'skill', job: 'oogosho', mp: 42, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'light', base: [205, 240], thr: 90 },
        { type: 'atbSet', sub: 40, chance: 0.5, msg: '{t}は、笑いころげて動けない！', failMsg: '{t}は、ぎりぎりこらえた！' },
      ],
    },
    desc: 'テレビの前の日本中が、いっしょに大笑いする、大御所の最強の芸。敵全体に光の大ダメージ。笑いころげて動きが止まる敵もいる。', cast: '{a}の伝説の芸！日本中が大爆笑！', anim: 'oogosho_sig',
  },

  // ───────────── 五つ星シェフ（伝説の職業。三ツ星シェフ＋ほかの 超級職 1つ） ─────────────
  fc_zensai: {
    name: '五つ星の前菜', kana: 'いつつぼしのぜんさい', kind: 'skill', job: 'five_star_chef', mp: 14, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [95, 120], thr: 50 }, { type: 'mpHeal', base: [4, 6] }] },
    desc: '色あざやかな前菜を、さっと出す。仲間全員のHPとMPを回復する。', cast: '{a}「まずは、前菜をどうぞ」', anim: 'r66b_dish',
  },
  fc_houchou: {
    name: '黄金の包丁さばき', kana: 'おうごんのほうちょうさばき', kind: 'skill', job: 'five_star_chef', mp: 14, target: 'enemy',
    effect: { type: 'phys', mult: 0.85, hits: 4, critBonus: 0.1 },
    desc: '金色にかがやく包丁で、目にもとまらぬ早わざ。敵1体に4回切りつけ、会心が出やすい。', cast: '{a}の黄金の包丁さばき！', anim: 'slash_multi',
  },
  fc_flambe: {
    name: '炎のフランベ', kana: 'ほのおのふらんべ', kind: 'skill', job: 'five_star_chef', mp: 18, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [110, 130], thr: 70 },
    desc: 'フライパンから、ぼわっと大きな炎が上がる。敵全体に炎のダメージ。', cast: '{a}のフランベ！炎がまい上がった！', anim: 'fire_tornado',
  },
  fc_soup: {
    name: 'ぽかぽかスープ', kana: 'ぽかぽかすーぷ', kind: 'skill', job: 'five_star_chef', mp: 18, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'regen', base: [24, 30], thr: 30, dur: 28 }, { type: 'buff', stat: 'def', mult: 1.35, dur: 40 }] },
    desc: 'じっくりにこんだ、ほかほかのスープ。仲間全員が少しずつ回復していき、守備力も上がる。', cast: '{a}「体があたたまりますよ」', anim: 'r66b_dish',
  },
  fc_main: {
    name: 'とくべつメインディッシュ', kana: 'とくべつめいんでぃっしゅ', kind: 'skill', job: 'five_star_chef', mp: 26, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [130, 160], thr: 70 }, { type: 'buff', stats: ['atk', 'mag'], mult: 1.3, dur: 40 }] },
    desc: 'この日のためのとくべつなメインディッシュ。仲間全員のHPを大きく回復して、攻撃力と魔力も上がる。', cast: '{a}「本日のメインディッシュでございます」', anim: 'r66b_dish',
  },
  fc_dessert: {
    name: 'ごほうびデザート', kana: 'ごほうびでざーと', kind: 'skill', job: 'five_star_chef', mp: 20, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'cure', statuses: STATUS_ALL }, { type: 'buff', stat: 'agi', mult: 1.4, dur: 40 }] },
    desc: 'あまくてふわふわの、ごほうびデザート。仲間全員の悪いじょうたいを治して、素早さも上がる。', cast: '{a}「デザートは、べつばらですよ」', anim: 'heal2',
  },
  five_star_chef_sig: {
    name: '五つ星のフルコース', kana: 'いつつぼしのふるこーす', kind: 'skill', job: 'five_star_chef', mp: 44, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'fire', base: [200, 235], thr: 90 },
        { type: 'heal', target: 'allies', base: [80, 100], thr: 50 },
        { type: 'buff', target: 'allies', stat: 'atk', mult: 1.25, dur: 30 },
      ],
    },
    desc: '金色の星が5つかがやく、五つ星シェフの最強のフルコース。敵全体に炎の大ダメージ。仲間全員のHPを回復して、攻撃力も上がる。', cast: '{a}「五つ星のフルコース、めし上がれ！」', anim: 'five_star_chef_sig',
  },
};
