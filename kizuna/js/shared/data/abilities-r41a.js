// 2026年10月（第41回 A）の 新しい 職業の 技: 2つの 伝説の 職業（docs/plan-r41-jobs-a.md）
//   京急の運転士 → 京急の社長（京急の運転士と ほかの 超級職 1つ）
//   二刀流スター → 野球界の殿堂入り（二刀流スターと ほかの 超級職 1つ）
//
// 家族の ねがい「京急の運転士の上に、京急の社長」「プロ野球の系統の伝説の職業に、野球界の殿堂入り」
// ・京急の社長: 出発進行の 号令・ダイヤの 立て直し・安全点検（仲間を はげまして 守る）と、赤い 電車の 大きな 技
// ・野球界の殿堂入り: 予告ホームラン・消える魔球・三しん（打つのも 投げるのも 一流）と、チームの 円じん
// ・名前の 字: 「陣・振・援・誇・輝」は 習わない 字なので つかわない（円じん・三しん）
// きまりは abilities-jobs10.js と おなじ
//  ・攻撃技は 伝説 2つ いじょう
//  ・みんなに かける 補助は 伝説の 上限まで（1.4倍。いくつもの 強さは 1.35倍）
//  ・Lv10 の 技が いちばん MPを 使う
//  ・看板の 技は <職業の id>_sig（anim も 同じ 名前。エフェクトは client/render/battlefx-r41a.js）

const STATUS_ALL = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];

export const R41A_ABILITIES = {
  // ───────────── 京急の社長（伝説の職業。京急の運転士＋ほかの 超級職 1つ） ─────────────
  kqp_gourei: {
    name: '出発進行の号令', kana: 'しゅっぱつしんこうのごうれい', kind: 'skill', job: 'keikyu_president', mp: 12, target: 'allies', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.35, dur: 45 },
    desc: '白い手ぶくろで、まっすぐ前をゆびさす。仲間全員の攻撃力と素早さが上がる。', cast: '{a}「出発、進行！」', anim: 'r41a_signal',
  },
  kqp_tokkyu: {
    name: 'ノンストップ特急', kana: 'のんすとっぷとっきゅう', kind: 'skill', job: 'keikyu_president', mp: 14, target: 'enemy',
    effect: { type: 'phys', mult: 3.1, ignoreDef: 0.3 },
    desc: 'どの駅にも止まらない赤い特急が、まっすぐ走りぬける。敵1体に大ダメージ。守りの固い敵にもよく効く。', cast: '{a}の合図で、ノンストップ特急が走りぬけた！', anim: 'r41a_express',
  },
  kqp_tenken: {
    name: '全線安全点検', kana: 'ぜんせんあんぜんてんけん', kind: 'skill', job: 'keikyu_president', mp: 20, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [100, 125], thr: 50 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: '線路も車両も、すみずみまで点検する。仲間全員のHPを回復して、悪いじょうたいも治す。', cast: '{a}「安全第一！全線を点検せよ！」', anim: 'r41a_check',
  },
  kqp_daiya: {
    name: 'ダイヤ大改正', kana: 'だいやだいかいせい', kind: 'skill', job: 'keikyu_president', mp: 20, target: 'allies', role: 'sup',
    effect: {
      type: 'multi',
      parts: [
        { type: 'atbSet', add: 50, msg: '{t}は、すぐに動けるようになった！' },
        { type: 'buff', stat: 'def', mult: 1.35, dur: 40 },
      ],
    },
    desc: '時こく表を、新しく作り直す。仲間全員の行動ゲージがたまり、守備力も上がる。', cast: '{a}は、新しい時こく表を発表した！', anim: 'r41a_timetable',
  },
  kqp_renketsu: {
    name: '12両の大連結', kana: 'じゅうにりょうのだいれんけつ', kind: 'skill', job: 'keikyu_president', mp: 22, target: 'enemies',
    effect: { type: 'phys', mult: 0.8, hits: 6, random: true },
    desc: '赤い車両が12両つながって、ごうごうと走る。敵全体に、ランダムで6回ぶつかる。', cast: '{a}の12両の大連結！', anim: 'redtrain',
  },
  keikyu_president_sig: {
    name: '全線大快特', kana: 'ぜんせんだいかいとく', kind: 'skill', job: 'keikyu_president', mp: 40, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 2.7, ignoreDef: 0.3 },
        { type: 'buff', target: 'allies', stat: 'agi', mult: 1.25, dur: 30 },
      ],
    },
    desc: '社長の合図で、全部の線路の赤い電車が一気に走りだす、京急の社長の最強の技。敵全体に大ダメージ。守りの固い敵にもよく効き、仲間全員の素早さも上がる。', cast: '{a}「全線、大快特で出発進行！」', anim: 'keikyu_president_sig',
  },

  // ───────────── 野球界の殿堂入り（伝説の職業。二刀流スター＋ほかの 超級職 1つ） ─────────────
  hof_yokoku: {
    name: '予告ホームラン', kana: 'よこくほーむらん', kind: 'skill', job: 'hall_of_fame', mp: 10, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'agi'], mult: 1.5, dur: 45 },
    desc: 'バットでスタンドをゆびさして、ホームランを予告する。自分の攻撃力と素早さがとても上がる。', cast: '{a}は、バットでスタンドをゆびさした！', anim: 'r41a_callshot',
  },
  hof_makyu: {
    name: '消える魔球', kana: 'きえるまきゅう', kind: 'skill', job: 'hall_of_fame', mp: 14, target: 'enemy',
    effect: { type: 'phys', mult: 3.1, critBonus: 0.1 },
    desc: 'とちゅうでふっと消える、伝説の魔球。敵1体に大ダメージ。会心も出やすい。', cast: '{a}の消える魔球！', anim: 'r41a_vanish',
  },
  hof_enjin: {
    name: '声出し円じん', kana: 'こえだしえんじん', kind: 'skill', job: 'hall_of_fame', mp: 20, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [80, 100], thr: 50 }, { type: 'buff', stats: ['atk', 'def'], mult: 1.3, dur: 40 }] },
    desc: '仲間とまるくなって、大きな声を出す。仲間全員のHPを回復して、攻撃力と守備力も上がる。', cast: '{a}「さあ、いこう！」みんなの声がひとつになった！', anim: 'r41a_huddle',
  },
  hof_sanshin: {
    name: '三者三しん', kana: 'さんしゃさんしん', kind: 'skill', job: 'hall_of_fame', mp: 18, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 1.6 },
        { type: 'atbSet', sub: 40, chance: 0.45, msg: '{t}は、空ぶり三しん！', failMsg: '{t}は、なんとかバットに当てた！' },
      ],
    },
    desc: 'うなる球で、つぎつぎに空ぶりをうばう。敵全体にダメージ。三しんして止まる敵もいる。', cast: '{a}の三者三しん！', anim: 'r41a_strikeout',
  },
  hof_allstar: {
    name: '夢のオールスター', kana: 'ゆめのおーるすたー', kind: 'skill', job: 'hall_of_fame', mp: 24, target: 'enemies',
    effect: { type: 'phys', mult: 0.65, hits: 3 },
    desc: '野球の歴史にのこる名選手たちのまぼろしが、いっしょに戦う。敵全体に3回ダメージ。', cast: '{a}のまわりに、伝説の名選手たちのまぼろしが現れた！', anim: 'r41a_allstar',
  },
  hall_of_fame_sig: {
    name: '黄金のサヨナラホームラン', kana: 'おうごんのさよならほーむらん', kind: 'skill', job: 'hall_of_fame', mp: 40, target: 'enemies',
    effect: { type: 'phys', mult: 2.7, ignoreDef: 0.25, critBonus: 0.15 },
    desc: '黄金にかがやく打球が、空のかなたへ消えていく、野球界の殿堂入りの最強の技。敵全体に大ダメージ。守りの固い敵にもよく効き、会心も出やすい。', cast: 'カキーン！{a}の打球は、黄金にかがやきながら空のかなたへ…！', anim: 'hall_of_fame_sig',
  },
};
