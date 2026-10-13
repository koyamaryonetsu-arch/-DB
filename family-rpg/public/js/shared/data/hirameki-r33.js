// 第33回（2026年10月）の 11の 職業の ひらめき技
//
// ・上級職より 上の 9つ（かいとう・かいとうキッド・魔法学校の生徒・ハリーポッター・3年B組の担任・国家れん金術師・
//   はがねのれん金術師・美少女戦士・セーラームーン）に 1つずつ（伝説の 3年B組の担任は 2つ）。基本職（手品師・れん金術師）には 足さない
// ・しくみは hirameki-r27.js・hirameki-r29.js と おなじ
//   job … その 職業か、その 職業から 進んだ 職業の とき だけ ひらめく（stats.js の hiraAllowed）
//   from … その 道の 技を 使った 回数（上の 職業ほど 技の MPが 多いので、回数は 少なめ）
//   強さは その 職業の 同じくらいの MPの 技と おなじくらい
//   anim は 前から ある エフェクト
// ・id は hi_ で はじめる

const sk = (job, o) => ({ kind: 'skill', job, hirameki: true, ...o });
const sp = (job, o) => ({ kind: 'spell', job, hirameki: true, ...o });

export const HIRA_R33_ABILITIES = {
  // かいとう: トランプの いちばん 強い 1まい
  hi_joker: sk('kaito', {
    name: 'ジョーカーのきりふだ', kana: 'じょーかーのきりふだ', mp: 9, target: 'enemy',
    effect: { type: 'phys', mult: 2.6, critBonus: 0.2 },
    desc: 'トランプの中の、さいごのきりふだ。敵1体に大きなダメージ。会心がとても出やすい。', cast: '{a}は、ジョーカーのカードをひらりと見せた！', anim: 'cards',
  }),
  // かいとうキッド: 月の 下の マジックショー
  hi_tsukika: sk('kaito_kid', {
    name: '月下のマジックショー', kana: 'げっかのまじっくしょー', mp: 18, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'light', base: [100, 120], thr: 70 },
        { type: 'status', status: 'confuse', chance: 0.3, turns: [1, 2] },
      ],
    },
    desc: '月の光の下の、大がかりなマジックショー。敵全体に光のダメージ。見とれて混乱する敵もいる。', cast: '{a}「月下のマジックショー、開幕です！」', anim: 'meteor',
  }),
  // 魔法学校の生徒: 正しい 発音で となえた ふわふわ呪文
  hi_leviosa: sp('wizard_student', {
    name: 'ウィンガーディアム・レヴィオーサ', kana: 'うぃんがーでぃあむれゔぃおーさ', mp: 11, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', base: [50, 62], thr: 45 },
        { type: 'atbSet', sub: 35, chance: 0.45, msg: '{t}は、空中にうかび上がった！', failMsg: '{t}は、地面にしがみついた！' },
      ],
    },
    desc: '「レヴィオサーじゃない、レヴィオーサ」正しい発音でとなえると、大きな物までうく。敵全体をうかせて落とし、うかんだまま動けなくする。', cast: '{a}「ウィンガーディアム・レヴィオーサ！」', anim: 'void',
  }),
  // ハリーポッター: ぼうしから 出てくる 剣
  hi_gryffindor: sk('harry', {
    name: 'グリフィンドールの剣', kana: 'ぐりふぃんどーるのけん', mp: 14, target: 'enemy',
    effect: { type: 'phys', mult: 3.0, ignoreDef: 0.2 },
    desc: 'ピンチの時、古いぼうしの中から、ほんとうの勇気を持つ者に剣があらわれる。敵1体に大きなダメージ。守りの固い敵にも効く。', cast: '{a}がぼうしに手を入れると…光る剣が出てきた！', anim: 'slash_heavy',
  }),
  // 3年B組の担任: 卒業式と、夕日の 校庭
  hi_sotsugyou: sk('homeroom_3b', {
    name: 'なみだの卒業式', kana: 'なみだのそつぎょうしき', mp: 26, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [140, 170], thr: 70 }, { type: 'mpHeal', base: [6, 10] }] },
    desc: '「みんな、卒業おめでとう」なみだと笑顔の卒業式。仲間全員のHPとMPを回復する。', cast: '{a}「みんな…卒業、おめでとう！」', anim: 'heal2',
  }),
  hi_yuuhi: sk('homeroom_3b', {
    name: '夕日に向かって走れ', kana: 'ゆうひにむかってはしれ', mp: 22, target: 'enemies',
    effect: { type: 'phys', mult: 2.0, atbAfter: 30 },
    desc: '「あの夕日に向かって走るぞ！」みんなで土手をかけぬけて、敵全体をはねとばす。早めに次の番が来る。', cast: '{a}「みんな、あの夕日に向かって走れ！」', anim: 'tackle',
  }),
  // 国家れん金術師: 指ぱっちんを つづけて
  hi_honoo_uzu: sk('state_alchemist', {
    name: 'ほのおの大うず', kana: 'ほのおのおおうず', mp: 12, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [52, 64], thr: 55 },
    desc: '指をつづけて鳴らして、ほのおの大きなうずを作る。敵全体に炎のダメージ。', cast: '{a}は、指をつづけて鳴らした！パチン、パチン、パチン！', anim: 'fire_tornado',
  }),
  // はがねのれん金術師: 両手を 合わせる だけの れん成
  hi_ryoute: sk('fullmetal', {
    name: '両手でパン！', kana: 'りょうてでぱん', mp: 14, target: 'enemy',
    effect: { type: 'phys', mult: 3.0, ignoreDef: 0.25 },
    desc: '両手を合わせるだけで、一しゅんでれん成。地面からつき出す大きなこぶしで、敵1体に大きなダメージ。守りの固い敵にも効く。', cast: '{a}は、両手をパン！と合わせた！', anim: 'rock_smash',
  }),
  // 美少女戦士: 水の 戦士の 大技
  hi_aqua: sk('sailor_soldier', {
    name: 'シャイン・アクア・イリュージョン', kana: 'しゃいんあくあいりゅーじょん', mp: 12, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'ice', base: [58, 72], thr: 50 },
        { type: 'status', status: 'paralyze', chance: 0.2, turns: [1, 2] },
      ],
    },
    desc: 'きらめく水の大波で、敵全体をつつむ。敵全体に氷のダメージ。こおりついて動けなくなる敵もいる。', cast: '{a}「シャイン・アクア・イリュージョン！」', anim: 'ice2',
  }),
  // セーラームーン: ハートの つえの 必殺技
  hi_spiral: sk('sailor_moon', {
    name: 'ムーン・スパイラル・ハート・アタック', kana: 'むーんすぱいらるはーとあたっく', mp: 18, target: 'enemy',
    effect: { type: 'magic', element: 'light', base: [195, 235], thr: 85 },
    desc: 'ハートのついたつえから、うずをまくハートの光をうつ。敵1体に光の大ダメージ。', cast: '{a}「ムーン・スパイラル・ハート・アタック！」', anim: 'hearts',
  }),
};

// ひらめきの じょうけん（技 → 使った 回数）
export const HIRAMEKI_R33 = {
  hi_joker: { from: { kt_card: 15, kt_surikae: 6 } },
  hi_tsukika: { from: { kk_jewel: 8, kk_hato: 10 } },
  hi_leviosa: { from: { ws_uku: 12, ws_hikari: 10 } },
  hi_gryffindor: { from: { hy_kizu: 8, hy_dumbledore: 6 } },
  hi_sotsugyou: { from: { h3_katei: 8, homeroom_3b_sig: 4 } },
  hi_yuuhi: { from: { h3_taiiku: 8, h3_hito: 6 } },
  hi_honoo_uzu: { from: { sl_yubi: 12, sl_gin: 6 } },
  hi_ryoute: { from: { fm_ude: 10, fm_kabe: 6 } },
  hi_aqua: { from: { bs_shabon: 10, bs_heel: 8 } },
  hi_spiral: { from: { mn_stick: 12, mn_heal: 6 } },
};
