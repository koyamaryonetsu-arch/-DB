// 第66回 C班（2026年11月）の 4つの 伝説の 職業の ひらめき技（docs/plan-r66-legend.md の C班）
//
// ・総理大臣・会長・働き方改革の星・あの方に 2つずつ（ほかの 伝説の 職業と おなじ）
// ・しくみは hirameki-r41a.js と おなじ
//   job … その 職業の とき だけ ひらめく（stats.js の hiraAllowed）
//   from … その 職業の 技を 使った 回数（伝説の 技は MPが 多いので、回数は 少なめ）
//   強さは その 職業の 同じくらいの MPの 技と おなじくらい
//   anim は 前から ある エフェクト
// ・id は hi_ で はじめる

const sk = (job, o) => ({ kind: 'skill', job, hirameki: true, ...o });

export const HIRA_R66C_ABILITIES = {
  // 総理大臣: 記者会見の フラッシュと、みんなの 国づくり
  hi_sor_kaiken: sk('souri', {
    name: '記者会見のフラッシュ', kana: 'きしゃかいけんのふらっしゅ', mp: 24, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'light', base: [110, 130], thr: 70 },
        { type: 'status', status: 'blind', chance: 0.45, turns: [2, 3] },
      ],
    },
    desc: 'カメラのフラッシュが、いっせいに光る。敵全体に光のダメージ。目がくらむ敵もいる。', cast: 'パシャパシャ！{a}の記者会見が始まった！', anim: 'holy',
  }),
  hi_sor_kunizukuri: sk('souri', {
    name: '笑顔の国づくり', kana: 'えがおのくにづくり', mp: 26, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [120, 150], thr: 70 }, { type: 'buff', stat: 'mag', mult: 1.3, dur: 40 }] },
    desc: 'みんなが笑顔でくらせる国を作る。仲間全員のHPを回復して、魔力も上がる。', cast: '{a}「みんなが笑顔の国にしよう！」', anim: 'heal2',
  }),
  // 会長: 株主へ おれいの プレゼントと、純金の ゴルフ
  hi_kch_yuutai: sk('kaichou', {
    name: '株主ゆうたい', kana: 'かぶぬしゆうたい', mp: 24, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [100, 125], thr: 50 }, { type: 'mpHeal', base: [8, 12] }] },
    desc: 'いつもおうえんしてくれるみんなに、おれいのプレゼント。仲間全員のHPとMPを回復する。', cast: '{a}「いつもありがとう。おれいの品だよ」', anim: 'coins',
  }),
  hi_kch_golf: sk('kaichou', {
    name: '純金のゴルフスイング', kana: 'じゅんきんのごるふすいんぐ', mp: 20, target: 'enemy',
    effect: { type: 'phys', mult: 1.9, hits: 2 },
    desc: '純金のゴルフクラブで、ナイスショット！敵1体に2回、大ダメージ。', cast: '{a}「ファー！…いや、ナイスショット！」', anim: 'bat_swing',
  }),
  // 働き方改革の星: 家族と 晩ごはんと、月曜日の ロケットスタート
  hi_hwk_bangohan: sk('hatarakikata', {
    name: '家族そろって晩ごはん', kana: 'かぞくそろってばんごはん', mp: 24, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [120, 150], thr: 60 }, { type: 'cure', statuses: ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'] }] },
    desc: '早く帰って、家族みんなで晩ごはん。仲間全員のHPを回復して、悪いじょうたいも治す。', cast: '{a}「ただいま！いただきます！」', anim: 'heal2',
  }),
  hi_hwk_rocket: sk('hatarakikata', {
    name: '月曜日のロケットスタート', kana: 'げつようびのろけっとすたーと', mp: 20, target: 'enemy',
    effect: { type: 'phys', mult: 2.0, hits: 2 },
    desc: '週末にしっかり休んだので、元気いっぱい！敵1体に2回、大ダメージ。', cast: '{a}「休みで元気満タン！行ってきます！」', anim: 'tackle',
  }),
  // あの方: 組織の わなと、ふしぎな 黒い けむり
  hi_ano_wana: sk('ano_kata', {
    name: '組織のわな', kana: 'そしきのわな', mp: 22, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 1.0, element: 'dark' },
        { type: 'atbSet', sub: 40, chance: 0.45, msg: '{t}は、わなにかかって動けない！', failMsg: '{t}は、わなに気がついた！' },
      ],
    },
    desc: '組織がしかけた、ひみつのわな。敵全体に闇のダメージ。わなにかかって、行動がおくれる敵もいる。', cast: '{a}「…もう、手は打ってあるよ」', anim: 'dark1',
  }),
  hi_ano_kemuri: sk('ano_kata', {
    name: 'ふしぎな黒いけむり', kana: 'ふしぎなくろいけむり', mp: 20, target: 'enemies', role: 'sup',
    effect: {
      type: 'multi',
      parts: [
        { type: 'debuff', stat: 'def', mult: 0.7, dur: 40, chance: 0.8 },
        { type: 'status', status: 'blind', chance: 0.45, turns: [2, 3] },
      ],
    },
    desc: 'もくもくと黒いけむりがたちこめる。敵全体の守備力が下がり、目がくらむ敵もいる。', cast: '{a}のまわりから、黒いけむりがわき出した…', anim: 'dark1',
  }),
};

// ひらめきの じょうけん（技 → 使った 回数）
export const HIRAMEKI_R66C = {
  hi_sor_kaiken: { from: { sor_touben: 10, sor_enzetsu: 6 } },
  hi_sor_kunizukuri: { from: { sor_kyufu: 8, sor_kakugi: 6 } },
  hi_kch_yuutai: { from: { kch_bonus: 8, kch_okotoba: 6 } },
  hi_kch_golf: { from: { kch_hanko: 10, kch_group: 6 } },
  hi_hwk_bangohan: { from: { hwk_nozan: 8, hwk_refresh: 6 } },
  hi_hwk_rocket: { from: { hwk_teiji: 10, hwk_flex: 6 } },
  hi_ano_wana: { from: { ano_karasu: 10, ano_mail: 6 } },
  hi_ano_kemuri: { from: { ano_kusuri: 8, ano_kage: 6 } },
};
