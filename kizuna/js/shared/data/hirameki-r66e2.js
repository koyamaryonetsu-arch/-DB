// 第66回 E2班の ひらめき技（data/jobs-r66e2.js。docs/plan-r66-legend.md）
//
// ・超級職（eスポーツ世界王者・楽天ゴールドカードマン・サイキッカー）に 1つずつ、
//   伝説の職業（ゲームの神・楽天ブラックカードマン・さいきくすお）に 2つずつ
// ・しくみは hirameki-r41a.js と おなじ
//   job … その 職業の とき だけ ひらめく（stats.js の hiraAllowed）
//   from … その 職業の 技を 使った 回数
//   強さは その 職業の 同じくらいの MPの 技と おなじくらい。anim は 前から ある エフェクト
// ・id は hi_ で はじめる

const sk = (job, o) => ({ kind: 'skill', job, hirameki: true, ...o });

export const HIRA_R66E2_ABILITIES = {
  // eスポーツ世界王者: ガードからの カウンターコンボ
  hi_ek_counter: sk('esports_king', {
    name: 'カウンターコンボ', kana: 'かうんたーこんぼ', mp: 14, target: 'enemy',
    effect: { type: 'phys', mult: 0.56, hits: 5, critBonus: 0.1 },
    desc: '相手のすきに、カウンターからコンボをつなぐ。敵1体に5回攻撃する。会心が出やすい。', cast: '{a}「そこ、カウンター！」', anim: 'punch_multi',
  }),
  // 楽天ゴールドカードマン: ポイントの 大かんげん
  hi_gcm_kangen: sk('gold_cardman', {
    name: 'ゴールドポイント大かんげん', kana: 'ごーるどぽいんとだいかんげん', mp: 16, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [62, 78], thr: 45 }, { type: 'mpHeal', base: [5, 8] }] },
    desc: 'たまったポイントを、みんなにお返しする。仲間全員のHPとMPを回復する。お金はへらない。', cast: '{a}「ポイント、大かんげんだ！」', anim: 'coins',
  }),
  // サイキッカー: 念力の かべ
  hi_psy_barrier: sk('psychicer', {
    name: 'サイコバリア', kana: 'さいこばりあ', mp: 12, target: 'allies', role: 'sup',
    effect: { type: 'buff', stat: 'def', mult: 1.4, dur: 40 },
    desc: '念力で、見えないかべをつくる。仲間全員の守備力が上がる。', cast: '{a}のまわりに、見えないかべがうかんだ！', anim: 'guard',
  }),
  // ゲームの神: つよくて ニューゲーム・ハイスコアラッシュ
  hi_gg_newgame: sk('game_god', {
    name: '強くてニューゲーム', kana: 'つよくてにゅーげーむ', mp: 20, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stats: ['atk', 'agi'], mult: 1.4, dur: 30 }, { type: 'heal', base: [90, 110], thr: 60 }] },
    desc: 'クリアした強さのまま、もう一度初めから。自分のHPを回復して、攻撃力と素早さが上がる。', cast: '{a}「2しゅう目は、もっと強いよ！」', anim: 'buff',
  }),
  hi_gg_score: sk('game_god', {
    name: 'ハイスコアラッシュ', kana: 'はいすこあらっしゅ', mp: 24, target: 'enemy',
    effect: { type: 'phys', mult: 0.7, hits: 5, ignoreDef: 0.2 },
    desc: 'ハイスコアをぬりかえる、ものすごい連続攻撃。敵1体に5回攻撃する。守りが固い敵にも強い。', cast: '{a}のスコアが、どんどん上がっていく！', anim: 'punch_multi',
  }),
  // 楽天ブラックカードマン: ポイントで プレゼント・れんぞく決さい
  hi_bcm_present: sk('black_cardman', {
    name: 'ポイントでプレゼント', kana: 'ぽいんとでぷれぜんと', mp: 26, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [110, 130], thr: 65 }, { type: 'buff', stat: 'def', mult: 1.3, dur: 40 }] },
    desc: 'ためたポイントで、みんなにプレゼント。仲間全員のHPを回復して、守備力も上がる。お金はへらない。', cast: '{a}「いつもありがとう！プレゼントだ！」', anim: 'heal2',
  }),
  hi_bcm_kessai: sk('black_cardman', {
    name: 'ブラックカードのれんぞく決さい', kana: 'ぶらっくかーどのれんぞくけっさい', mp: 22, target: 'enemy',
    effect: { type: 'phys', mult: 1.05, hits: 3, ptScale: 0.04 },
    desc: 'ピッ、ピッ、ピッ！黒いカードで3回つづけて決さいする。敵1体に3回攻撃する。楽天ポイントが多いほど強い。', cast: '{a}「ピッ、ピッ、ピッ！」', anim: 'cards',
  }),
  // さいきくすお: いん石ストップ・ちょっと本気の念力
  hi_ksu_inseki: sk('saiki', {
    name: 'いん石ストップ', kana: 'いんせきすとっぷ', mp: 20, target: 'allies', role: 'sup',
    effect: { type: 'buff', stat: 'def', mult: 1.4, dur: 40 },
    desc: '空から落ちてきたいん石も、念力でそっと止める。仲間全員の守備力が上がる。', cast: '{a}「…やれやれ、また止めなきゃいけないのか」', anim: 'guard',
  }),
  hi_ksu_honki: sk('saiki', {
    name: 'ちょっと本気の念力', kana: 'ちょっとほんきのねんりき', mp: 22, target: 'enemy',
    effect: { type: 'magic', base: [190, 220], thr: 80 },
    desc: 'ほんの少しだけ、本気を出した念力。敵1体にとても大きなダメージ。', cast: '{a}「少しだけ、本気を出す」', anim: 'void',
  }),
};

// ひらめきの じょうけん（技 → 使った 回数）
export const HIRAMEKI_R66E2 = {
  hi_ek_counter: { from: { ek_renda: 10, ek_guard: 6 } },
  hi_gcm_kangen: { from: { gcm_kaimono: 8, gcm_card: 8 } },
  hi_psy_barrier: { from: { psy_iyashi: 8, psy_teleport: 6 } },
  hi_gg_newgame: { from: { gg_save: 6, gg_guard: 6 } },
  hi_gg_score: { from: { gg_renda: 10, gg_combo: 6 } },
  hi_bcm_present: { from: { bcm_concierge: 8, bcm_gobai: 6 } },
  hi_bcm_kessai: { from: { bcm_card: 10, bcm_arashi: 6 } },
  hi_ksu_inseki: { from: { ksu_seigyo: 6, ksu_modosu: 6 } },
  hi_ksu_honki: { from: { ksu_nenriki: 10, ksu_arashi: 6 } },
};
