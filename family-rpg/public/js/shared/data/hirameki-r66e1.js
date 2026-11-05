// 第66回 E1班の ひらめき技（docs/plan-r66-legend.md の E1班）
//
// ・公安ゼロ・トリプルフェイス・ハイパーレスキュー・火消しの神・登録者1000万人・世界一の配信者に 1つずつ
// ・しくみは hirameki-r43j.js・hirameki-r41a.js と おなじ
//   job … その 職業の とき だけ ひらめく（stats.js の hiraAllowed）
//   from … その 職業の 技を 使った 回数
//   強さは その 職業の 同じくらいの MPの 技と おなじくらい。anim は 前から ある エフェクト
// ・id は hi_ で はじめる

const sk = (job, o) => ({ kind: 'skill', job, hirameki: true, ...o });

export const HIRA_R66E1_ABILITIES = {
  // 公安ゼロ: ジャブで すきを 作って、まっすぐ 打ちこむ
  hi_zero_straight: sk('koan_zero', {
    name: 'ゼロのストレート', kana: 'ぜろのすとれーと', mp: 12, target: 'enemy',
    effect: { type: 'phys', mult: 2.6, critBonus: 0.1 },
    desc: 'ジャブですきを作って、まっすぐ打ちこむ。敵1体に大きなダメージ。会心も出やすい。', cast: '{a}の、ゼロのストレート！', anim: 'punch',
  }),
  // トリプルフェイス: 3つの 顔を 入れかえながら 打つ
  hi_face_change: sk('triple_face', {
    name: '顔がわりのカウンター', kana: 'かおがわりのかうんたー', mp: 16, target: 'enemy',
    effect: { type: 'phys', mult: 3.4, ignoreDef: 0.3 },
    desc: '3つの顔を入れかえながら、あいてのすきをついて打ちこむ。敵1体に大ダメージ。守りの固い敵にもよく効く。', cast: '{a}は、一しゅんで顔を入れかえた…！', anim: 'holy_punch',
  }),
  // ハイパーレスキュー: のびる はしごで なぎはらう
  hi_rescue_ladder: sk('hyper_rescue', {
    name: 'ハイパーはしごアタック', kana: 'はいぱーはしごあたっく', mp: 12, target: 'enemy',
    effect: { type: 'phys', mult: 2.6 },
    desc: 'ぐんぐんのびるはしごで、敵1体を大きくなぎはらう。', cast: '{a}の、ハイパーはしごアタック！', anim: 'slash_heavy',
  }),
  // 火消しの神: まといを 大きく 回して 敵を まとめて うつ
  hi_matoi_kaiten: sk('hikeshi_god', {
    name: 'まといの大回転', kana: 'まといのだいかいてん', mp: 20, target: 'enemies',
    effect: { type: 'phys', mult: 1.75 },
    desc: 'まといを大きくふり回して、敵全体をまとめてうつ。', cast: '{a}は、まといを大きくふり回した！', anim: 'quake',
  }),
  // 登録者1000万人: 名場面を 切りとった 動画が つぎつぎ 流れる
  hi_kirinuki: sk('top_streamer', {
    name: 'きりぬき動画', kana: 'きりぬきどうが', mp: 14, target: 'enemies',
    effect: { type: 'magic', base: [95, 115], thr: 60 },
    desc: '名場面だけを集めた動画が、つぎつぎに流れる。敵全体にダメージ。', cast: '{a}の、きりぬき動画が大人気！', anim: 'superchat',
  }),
  // 世界一の配信者: 世界中から 投げせんが ふる
  hi_world_superchat: sk('world_streamer', {
    name: 'スパチャの大雨', kana: 'すぱちゃのおおあめ', mp: 26, target: 'enemies',
    effect: { type: 'magic', base: [150, 175], thr: 75 },
    desc: '世界中から、投げせんが大雨のようにふりそそぐ。敵全体に大ダメージ。', cast: '{a}の配信に、世界中から投げせんがふってきた！', anim: 'coins',
  }),
};

// ひらめきの じょうけん（技 → 使った 回数）
export const HIRAMEKI_R66E1 = {
  hi_zero_straight: { from: { kz_jab: 12, kz_kakuho: 8 } },
  hi_face_change: { from: { tf_jab: 12, tf_drive: 6 } },
  hi_rescue_ladder: { from: { hr_jet: 12, hr_suiryu: 6 } },
  hi_matoi_kaiten: { from: { hg_jet: 10, hg_suiryu: 6 } },
  hi_kirinuki: { from: { ts_buzz: 10, ts_comment: 6 } },
  hi_world_superchat: { from: { ws_honyaku: 12, ws_trend: 6 } },
};
