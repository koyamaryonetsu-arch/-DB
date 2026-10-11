// 2026年10月（第29回）の 新しい 職業の 技: るろうに剣士 → 人斬りばっ刀さい → ひ村ばっ刀さい → 飛天御剣流けい承者
//
// 家族の ねがい「キャラクター追加 るろうに剣士→人斬り抜刀斎→緋村抜刀斎→飛天御剣流継承者 技については、今までのルールと同じでお願い」
// ・名前の 字: 「抜・斎・緋・継・龍・槌・翔・刃」は 習わない 字なので ひらがなに した（龍は「竜」に。天翔龍閃は 読みの「天かける竜のひらめき」）
// きまりは abilities-jobs6.js・abilities-jobs7.js と おなじ
//  ・攻撃技は 基本職 3つ いじょう、上級職・超級職・伝説 2つ いじょう
//  ・みんなに かける 補助は ランクの 上限まで（基本職 1.15倍・上級職 1.25倍・超級職と 伝説 1.4倍。いくつもの 強さは 1.12・1.2・1.3・1.35倍）
//  ・Lv10 の 技が いちばん MPを 使う
//  ・看板の 技は <職業の id>_sig（anim も 同じ 名前。エフェクトは client/render/battlefx-jobs6.js）
//    るろうに剣士「竜つい閃」・人斬りばっ刀さい「竜巣閃」・ひ村ばっ刀さい「九頭竜閃」・飛天御剣流けい承者「天かける竜のひらめき」

const STATUS_ALL = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];

export const JOB8_ABILITIES = {
  // ───────────── るろうに剣士（基本職） ─────────────
  rr_battou: {
    name: 'ばっ刀術', kana: 'ばっとうじゅつ', kind: 'skill', job: 'rurouni', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.5, critBonus: 0.1 },
    desc: 'さやから目にもとまらぬ速さで刀をぬき、敵1体を打つ。会心が少し出やすい。', cast: '{a}は、目にもとまらぬ速さで刀をぬいた！', anim: 'slash_fast',
  },
  rr_oro: {
    name: 'おろ？', kana: 'おろ', kind: 'skill', job: 'rurouni', mp: 2, target: 'self', role: 'sup',
    effect: { type: 'buff', stat: 'eva', add: 0.25, dur: 30 },
    desc: '「おろ？」と、とぼけた顔で、ひょいっと身をかわす。自分が攻撃をかわしやすくなる。', cast: '{a}「おろ？」', anim: 'buff',
  },
  rr_doryu: {
    name: '土竜閃', kana: 'どりゅうせん', kind: 'skill', job: 'rurouni', mp: 5, target: 'enemies',
    effect: { type: 'phys', mult: 0.85 },
    desc: '刀で地面を打ちくだき、飛びちる石つぶてで、敵全体を打つ。', cast: '{a}の飛天御剣流！土竜閃！', anim: 'quake',
  },
  rr_ryukan: {
    name: '竜巻閃', kana: 'りゅうかんせん', kind: 'skill', job: 'rurouni', mp: 6, target: 'enemy',
    effect: { type: 'phys', mult: 2.0 },
    desc: '体をくるりと回して敵の後ろへ回りこみ、回るいきおいのまま、敵1体を打つ。', cast: '{a}の飛天御剣流！竜巻閃！', anim: 'wind2',
  },
  rr_sentaku: {
    name: 'おせんたくでござる', kana: 'おせんたくでござる', kind: 'skill', job: 'rurouni', mp: 7, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [30, 40], thr: 30 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: 'たらいで、みんなの服をごしごしあらう。仲間全員のHPが少し回復して、悪いじょうたいも治る。', cast: '{a}「おせんたくは、せっしゃにおまかせでござる」', anim: 'heal1',
  },
  rurouni_sig: {
    name: '竜つい閃', kana: 'りゅうついせん', kind: 'skill', job: 'rurouni', mp: 10, target: 'enemy',
    effect: { type: 'phys', mult: 2.6 },
    desc: '高く飛び上がり、落ちるいきおいのまま、真上から敵1体に刀を打ち下ろす。', cast: '{a}の飛天御剣流！竜つい閃！', anim: 'rurouni_sig',
  },

  // ───────────── 人斬りばっ刀さい（上級職。るろうに剣士を きわめる） ─────────────
  htk_ryusho: {
    name: '竜しょう閃', kana: 'りゅうしょうせん', kind: 'skill', job: 'hitokiri', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.9 },
    desc: '刀のみねに手をそえて、下から上へ、敵1体を切り上げる。', cast: '{a}の飛天御剣流！竜しょう閃！', anim: 'slash_heavy',
  },
  htk_kenki: {
    name: '人斬りの剣気', kana: 'ひときりのけんき', kind: 'skill', job: 'hitokiri', mp: 5, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.3, dur: 35 },
    desc: 'はりつめた、するどい剣気をまとう。自分の攻撃力と素早さが上がる。', cast: '{a}の目が、金色にするどく光った…', anim: 'charge',
  },
  htk_soryu: {
    name: 'そう竜閃', kana: 'そうりゅうせん', kind: 'skill', job: 'hitokiri', mp: 6, target: 'enemy',
    effect: { type: 'phys', mult: 1.15, hits: 2 },
    desc: 'ばっ刀の一太刀のあとに、さやでもう一げき。敵1体を2回打つ。', cast: '{a}の飛天御剣流！そう竜閃！', anim: 'slash_fast',
  },
  htk_yamiyo: {
    name: '闇夜の太刀', kana: 'やみよのたち', kind: 'skill', job: 'hitokiri', mp: 10, target: 'enemies',
    effect: { type: 'phys', mult: 1.0, element: 'dark' },
    desc: '夜の闇にまぎれて、敵全体を切りつける。闇のダメージ。', cast: '{a}は、夜の闇にすうっと消えた…', anim: 'dark_slash',
  },
  htk_ryumei: {
    name: '竜鳴閃', kana: 'りゅうめいせん', kind: 'skill', job: 'hitokiri', mp: 9, target: 'enemies', role: 'sup',
    effect: {
      type: 'multi',
      parts: [
        { type: 'atbSet', sub: 45, chance: 0.55, msg: '{t}は、耳がキーンとして動けない！', failMsg: '{t}は、耳をふさいでたえた！' },
        { type: 'status', status: 'confuse', chance: 0.3, turns: [1, 2] },
      ],
    },
    desc: 'さやに刀をはげしくおさめて、するどい音をひびかせる。敵全体の動きが止まったり、混乱したりする。', cast: '{a}は、刀をさやへはげしくおさめた！キイイン！', anim: 'warcry',
  },
  hitokiri_sig: {
    name: '竜巣閃', kana: 'りゅうそうせん', kind: 'skill', job: 'hitokiri', mp: 18, target: 'enemies',
    effect: { type: 'phys', mult: 0.7, hits: 6, random: true },
    desc: '目にもとまらぬ速さで、何度も切りつける。敵にランダムで6回当たる。', cast: '{a}の飛天御剣流！竜巣閃！', anim: 'hitokiri_sig',
  },

  // ───────────── ひ村ばっ刀さい（超級職。人斬りばっ刀さいを きわめる） ─────────────
  hm_hiryu: {
    name: '飛竜閃', kana: 'ひりゅうせん', kind: 'skill', job: 'himura', mp: 6, target: 'enemy',
    effect: { type: 'phys', mult: 2.4 },
    desc: 'さやの中の刀を、つばごと指ではじいて飛ばす。飛んでいく刀のつかが、敵1体に当たる。', cast: '{a}の飛天御剣流！飛竜閃！', anim: 'slash_light',
  },
  hm_fusatsu: {
    name: '不殺のちかい', kana: 'ふさつのちかい', kind: 'skill', job: 'himura', mp: 10, target: 'allies', role: 'sup',
    effect: { type: 'buff', stat: 'def', mult: 1.35, dur: 40 },
    desc: '「もう、だれもきずつけさせない」と、心にちかう。仲間全員の守備力が上がる。', cast: '{a}「仲間は、せっしゃが守るでござる」', anim: 'guard',
  },
  hm_arashi: {
    name: '竜巻閃・嵐', kana: 'りゅうかんせんあらし', kind: 'skill', job: 'himura', mp: 10, target: 'group',
    effect: { type: 'phys', mult: 1.7 },
    desc: '体ごと回りながら、うずまく刀で、同じ種類の敵をまとめて切る。', cast: '{a}の飛天御剣流！竜巻閃・嵐！', anim: 'wind2',
  },
  hm_ocha: {
    name: 'お茶にするでござる', kana: 'おちゃにするでござる', kind: 'skill', job: 'himura', mp: 14, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [90, 110], thr: 50 }, { type: 'mpHeal', base: [3, 5] }] },
    desc: 'ひと休みして、みんなで、あったかいお茶を飲む。仲間全員のHPを回復して、MPも少し回復する。', cast: '{a}「まずは、お茶にするでござるよ」', anim: 'heal2',
  },
  hm_tsumuji: {
    name: '竜巻閃・旋', kana: 'りゅうかんせんつむじ', kind: 'skill', job: 'himura', mp: 16, target: 'enemies',
    effect: { type: 'phys', mult: 1.45 },
    desc: 'つむじ風のように回りながら、敵全体を切る。', cast: '{a}の飛天御剣流！竜巻閃・旋！', anim: 'slash_multi',
  },
  himura_sig: {
    name: '九頭竜閃', kana: 'くずりゅうせん', kind: 'skill', job: 'himura', mp: 28, target: 'enemy',
    effect: { type: 'phys', mult: 0.44, hits: 9 },
    desc: '9つの方向から、同時に打ちこむ飛天御剣流の大技。敵1体を9回切る。', cast: '{a}の飛天御剣流！九頭竜閃！', anim: 'himura_sig',
  },

  // ───────────── 飛天御剣流けい承者（伝説の職業。ひ村ばっ刀さい＋ほかの 超級職 1つ） ─────────────
  ht_shinsoku: {
    name: '神速の太刀', kana: 'しんそくのたち', kind: 'skill', job: 'hiten', mp: 12, target: 'enemy',
    effect: { type: 'phys', mult: 3.3, critBonus: 0.1 },
    desc: '神のような速さの一太刀。敵1体に大きなダメージ。会心も出やすい。', cast: '{a}の姿が、ふっと消えた…！', anim: 'slash_heavy',
  },
  ht_mantle: {
    name: '白いマントをぬぐ', kana: 'しろいまんとをぬぐ', kind: 'skill', job: 'hiten', mp: 10, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.5, dur: 45 },
    desc: 'とても重い白いマントをぬぐ。体が軽くなって、自分の攻撃力と素早さがとても上がる。', cast: '{a}は白いマントをぬいだ。ドスン！地面が少しへこんだ…', anim: 'charge',
  },
  ht_ootatsu: {
    name: '飛天の大竜巻', kana: 'ひてんのおおたつまき', kind: 'skill', job: 'hiten', mp: 18, target: 'enemies',
    effect: { type: 'phys', mult: 1.75, element: 'wind' },
    desc: '刀をふりぬいて大きな竜巻を起こし、敵全体を切りきざむ。風のダメージ。', cast: '{a}の飛天御剣流！大竜巻！', anim: 'wind2',
  },
  ht_ikiyou: {
    name: '生きようとする心', kana: 'いきようとするこころ', kind: 'skill', job: 'hiten', mp: 22, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [110, 135], thr: 50 }, { type: 'buff', stat: 'atk', mult: 1.35, dur: 40 }] },
    desc: '生きようとする心が、何よりも強い力になる。仲間全員のHPを回復して、攻撃力も上がる。', cast: '{a}「生きようとする心こそが、いちばん強い力だ」', anim: 'heal2',
  },
  ht_yomi: {
    name: '先を読む目', kana: 'さきをよむめ', kind: 'skill', job: 'hiten', mp: 14, target: 'enemies', role: 'sup',
    effect: {
      type: 'multi',
      parts: [
        { type: 'debuff', stat: 'def', mult: 0.75, dur: 40, chance: 0.8 },
        { type: 'debuff', stat: 'agi', mult: 0.8, dur: 40, chance: 0.7 },
      ],
    },
    desc: '敵の動きを、すべて先読みする。敵全体の守備力と素早さが下がる。', cast: '{a}には、敵の次の動きが見えている…', anim: 'debuff',
  },
  hiten_sig: {
    name: '天かける竜のひらめき', kana: 'あまかけるりゅうのひらめき', kind: 'skill', job: 'hiten', mp: 36, target: 'enemies',
    effect: { type: 'phys', mult: 1.6, hits: 2, critBonus: 0.2, ignoreDef: 0.2 },
    desc: '飛天御剣流のおく義。神速をこえるばっ刀で真空を生み、すいよせた敵全体を2回切る。守りの固い敵にも効き、会心も出やすい。', cast: '{a}の飛天御剣流、おく義！天かける竜のひらめき！', anim: 'hiten_sig',
  },
};
