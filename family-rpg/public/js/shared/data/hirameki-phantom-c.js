// 第51回 C3: 幻の職業（宇宙一のおかん・はかいと創造の神・夢のスタジアム鉄道・天候の神）の ひらめき技
//
// ・1つの 職業に 1つずつ。しくみは hirameki-r41a.js と おなじ
//   job … その 職業の とき だけ ひらめく（stats.js の hiraAllowed）
//   from … その 職業の 技を 使った 回数（幻の 技は MPが 多いので、回数は 少なめ）
//   anim は 前から ある エフェクト
// ・id は hi_ で はじめる

const sk = (job, o) => ({ kind: 'skill', job, hirameki: true, ...o });

export const HIRA_PHANTOM_C_ABILITIES = {
  // 宇宙一のおかん: 流れ星の 形の おにぎり（HPと MPを 回復）
  hi_co_onigiri: sk('cosmic_okan', {
    name: '流れ星おにぎり', kana: 'ながれぼしおにぎり', mp: 24, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [115, 140], thr: 60 }, { type: 'mpHeal', base: [10, 14] }] },
    desc: '星の形の、大きなおにぎり。仲間全員のHPとMPを回復する。', cast: '{a}「おなかがすいたら、力が出えへんよ！」', anim: 'gohan',
  }),
  // はかいと創造の神: こわして すぐ 作りなおす 2回の こぶし
  hi_cc_nirengeki: sk('chaos_creator', {
    name: 'はかいと創造の二連げき', kana: 'はかいとそうぞうのにれんげき', mp: 22, target: 'enemy',
    effect: { type: 'phys', mult: 2.0, hits: 2, ignoreDef: 0.2 },
    desc: '左手でこわし、右手で作りなおす。敵1体に2回、大ダメージ。守りの固い敵にもよく効く。', cast: '{a}「こわして…作る！」', anim: 'hakai',
  }),
  // 夢のスタジアム鉄道: 場外ホームランが 3本
  hi_ds_jougai: sk('dream_stadium', {
    name: 'スタジアム場外ホームラン', kana: 'すたじあむじょうがいほーむらん', mp: 22, target: 'enemy', crowd: 0.1,
    effect: { type: 'phys', mult: 1.45, hits: 3 },
    desc: '打球がスタジアムの外まで、3本つづけてとんでいく。敵1体に3回ダメージ。観客が多いほど強い。', cast: '{a}の打球が、スタジアムの外へ！', anim: 'bat_swing',
  }),
  // 天候の神: 空から ひょう
  hi_wg_hyou: sk('weather_god', {
    name: '天のひょう', kana: 'てんのひょう', mp: 22, target: 'enemies',
    effect: { type: 'magic', element: 'ice', base: [150, 175], thr: 75 },
    desc: '空から、大きな氷のつぶをふらせる。敵全体に氷のダメージ。', cast: '{a}が空をにらむと、ひょうがふってきた！', anim: 'ice2',
  }),
};

// ひらめきの じょうけん（技 → 使った 回数）
export const HIRAMEKI_PHANTOM_C = {
  hi_co_onigiri: { from: { co_gohan: 8, co_bentou: 6 } },
  hi_cc_nirengeki: { from: { cc_kesu: 10, cc_kowashite: 6 } },
  hi_ds_jougai: { from: { ds_kaisoku: 10, ds_manin: 6 } },
  hi_wg_hyou: { from: { wg_kaminari: 8, wg_gouu: 6 } },
};
