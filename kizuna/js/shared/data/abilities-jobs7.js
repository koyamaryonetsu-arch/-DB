// 2026年10月（第27回）の 新しい 職業の 技: 暴れんぼう将軍（伝説の職業。将軍＋ほかの 超級職 1つ）
//
// きまりは abilities-jobs6.js と おなじ
//  ・攻撃技は 2つ いじょう（みね打ちじゃ・白馬の早がけ・成敗！）
//  ・みんなに かける 補助は 伝説の 上限まで（1つの 強さ 1.4倍・いくつもの 強さ 1.35倍）
//  ・看板の 技は abarenbo_shogun_sig（anim も 同じ 名前。エフェクトは client/render/battlefx-jobs5.js）

const STATUS_ALL = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];

export const JOB7_ABILITIES = {
  // ───────────── 暴れんぼう将軍 ─────────────
  ab_mineuchi: {
    name: 'みね打ちじゃ', kana: 'みねうちじゃ', kind: 'skill', job: 'abarenbo_shogun', mp: 12, target: 'enemy',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 3.2, nonLethal: true },
        { type: 'atbSet', sub: 45, chance: 0.6, msg: '{t}は目を回して動けない！', failMsg: '{t}は、なんとか立ち上がった！' },
      ],
    },
    desc: '刀のみねで、敵1体を強く打つ。たおさずにHPを1のこし、目を回して動きが止まることもある。', cast: '{a}「安心せい、みね打ちじゃ」', anim: 'slash_heavy',
  },
  ab_kao: {
    name: '余の顔を見忘れたか', kana: 'よのかおをみわすれたか', kind: 'skill', job: 'abarenbo_shogun', mp: 16, target: 'enemies', role: 'sup',
    effect: {
      type: 'multi',
      parts: [
        { type: 'atbSet', sub: 50, chance: 0.65, msg: '{t}は思わずひれふした！', failMsg: '{t}は、上様の顔を知らなかった…' },
        { type: 'debuff', stat: 'atk', mult: 0.8, dur: 40, chance: 0.7 },
      ],
    },
    desc: '「余の顔を見忘れたか！」敵全体が思わずひれふして、動きが止まったり、攻撃力が下がったりする。', cast: '{a}「…余の顔を見忘れたか！」', anim: 'warcry',
  },
  ab_hakuba: {
    name: '白馬の早がけ', kana: 'はくばのはやがけ', kind: 'skill', job: 'abarenbo_shogun', mp: 18, target: 'enemies',
    effect: { type: 'phys', mult: 1.8 },
    desc: '白い馬にまたがり、海辺を走るいきおいのまま、敵全体をけちらす。', cast: '{a}は白い馬にまたがって、海辺から走ってきた！', anim: 'quake',
  },
  ab_meyasu: {
    name: '目安箱', kana: 'めやすばこ', kind: 'skill', job: 'abarenbo_shogun', mp: 20, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [110, 135], thr: 60 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: '町のみんなの声がとどく目安箱。仲間全員のHPを回復して、悪いじょうたいを治す。', cast: '{a}は目安箱をあけた。「みなの声、しかと聞いたぞ」', anim: 'heal2',
  },
  ab_onari: {
    name: '上様のおなり', kana: 'うえさまのおなり', kind: 'skill', job: 'abarenbo_shogun', mp: 20, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'def'], mult: 1.35, dur: 45 }, { type: 'bondUp', amount: 20 }] },
    desc: '「上様の、おなーりー！」仲間全員の攻撃力と守備力が上がり、きずなゲージもふえる。', cast: '「上様の、おなーりー！」', anim: 'warcry',
  },
  abarenbo_shogun_sig: {
    name: '成敗！', kana: 'せいばい', kind: 'skill', job: 'abarenbo_shogun', mp: 34, target: 'enemies',
    effect: { type: 'phys', mult: 1.6, hits: 2, ignoreDef: 0.3 },
    desc: '悪いやつらをまとめてこらしめる、上様の太刀。敵全体を2回斬る。守りの固い敵にもよく効く。', cast: '{a}「…成敗！」', anim: 'abarenbo_shogun_sig',
  },
};
