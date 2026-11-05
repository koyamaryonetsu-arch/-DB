// 第66回 D班の 伝説の 職業 5つの ひらめき技（docs/plan-r66-legend.md）
//
// ・月下のき術師・のぶドラ・かっぱの大王・真理のとびらをひらく者・ロゼッタに 2つずつ（ほかの 伝説の 職業と おなじ）
// ・しくみは hirameki-r41a.js と おなじ
//   job … その 職業の とき だけ ひらめく（stats.js の hiraAllowed）
//   from … その 職業の 技を 使った 回数（伝説の 技は MPが 多いので、回数は 少なめ）
//   強さは その 職業の 同じくらいの MPの 技と おなじくらい
//   anim は 前から ある エフェクト
// ・id は hi_ で はじめる

const sk = (job, o) => ({ kind: 'skill', job, hirameki: true, ...o });
const STATUS_ALL = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];

export const HIRA_R66D_ABILITIES = {
  // 月下のき術師: ハトの パレードと、ジョーカーの トリック
  hi_gx_hato: sk('gekka', {
    name: '満月のハトのパレード', kana: 'まんげつのはとのぱれーど', mp: 22, target: 'enemies',
    effect: { type: 'phys', mult: 1.0, hits: 2 },
    desc: 'シルクハットから、白いハトがつぎつぎにとび出す。敵全体に2回ダメージ。', cast: '{a}がシルクハットをひっくり返すと、ハトの大パレード！', anim: 'r33_hat_trick',
  }),
  hi_gx_joker: sk('gekka', {
    name: 'ジョーカーのトリック', kana: 'じょーかーのとりっく', mp: 20, target: 'enemy',
    effect: { type: 'phys', mult: 1.9, hits: 2, critBonus: 0.1 },
    desc: 'どこから出てきたのか、ジョーカーのトランプが2まい。敵1体に2回、大ダメージ。会心も出やすい。', cast: '{a}「さて、ジョーカーはどちらでしょう？」', anim: 'cards',
  }),
  // のぶドラ: ジャンボガンと、どら焼きパーティー
  hi_nd_jumbo: sk('nobu_dora', {
    name: 'ジャンボガン', kana: 'じゃんぼがん', mp: 22, target: 'enemy',
    effect: { type: 'phys', mult: 1.8, hits: 2, element: 'blast' },
    desc: 'とても大きな空気ほうのようなひみつ道具。敵1体に2回、爆発の大ダメージ。', cast: '{a}「ジャンボガン〜！」ドッカーン！', anim: 'blast2',
  }),
  hi_nd_dorayaki: sk('nobu_dora', {
    name: 'どら焼きパーティー', kana: 'どらやきぱーてぃー', mp: 24, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [120, 150], thr: 70 }, { type: 'buff', stat: 'agi', mult: 1.3, dur: 40 }] },
    desc: 'ポケットから、たくさんのどら焼きを出して、みんなでパーティー。仲間全員のHPを回復して、素早さも上がる。', cast: '{a}「どら焼き、いっぱいあるよ〜！」', anim: 'heal2',
  }),
  // かっぱの大王: 大ずもうと、花畑
  hi_kd_ozumou: sk('kappa_king', {
    name: 'カッパの大ずもう', kana: 'かっぱのおおずもう', mp: 20, target: 'enemy',
    effect: { type: 'phys', mult: 2.0, hits: 2 },
    desc: 'がっぷり組んで、2回つづけて投げとばす。敵1体に2回、大ダメージ。', cast: '{a}「はっけよーい、のこった！」', anim: 'punch_multi',
  }),
  hi_kd_hanabatake: sk('kappa_king', {
    name: '大王の花畑', kana: 'だいおうのはなばたけ', mp: 24, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [120, 150], thr: 70 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: 'あたり一面に、色とりどりの花がさく。仲間全員のHPを回復して、悪いじょうたいも治す。', cast: '{a}の頭から、花のたねがとびちった…あたり一面、花畑！', anim: 'heal_ring',
  }),
  // 真理のとびらをひらく者: 石の 大男と、等価こうかん
  hi_tg_golem: sk('truth_gate', {
    name: '石の大男のれん成', kana: 'いしのおおおとこのれんせい', mp: 22, target: 'enemies',
    effect: { type: 'phys', mult: 1.15, hits: 2, ignoreDef: 0.2 },
    desc: '地面から、大きな石の大男を作り出す。敵全体に2回ダメージ。守りの固い敵にも効く。', cast: '{a}が手を合わせると、地面から石の大男が立ち上がった！', anim: 'rock_smash',
  }),
  hi_tg_koukan: sk('truth_gate', {
    name: '真理の等価こうかん', kana: 'しんりのとうかこうかん', mp: 24, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [110, 135], thr: 60 }, { type: 'mpHeal', base: [8, 12] }] },
    desc: '同じだけのものを、みんなに分ける。仲間全員のHPとMPを回復する。', cast: '{a}「みんなの力を、みんなに返そう」', anim: 'heal_ring',
  }),
  // ロゼッタ: グランドスターと、チコの子守歌
  hi_rz_grandstar: sk('rosetta', {
    name: 'グランドスター', kana: 'ぐらんどすたー', mp: 22, target: 'enemy',
    effect: { type: 'magic', element: 'light', base: [170, 200], thr: 80 },
    desc: '大きな大きな星の光を、まっすぐぶつける。敵1体に光の大ダメージ。', cast: '{a}の手の上に、大きな星が生まれた！', anim: 'holy',
  }),
  hi_rz_komoriuta: sk('rosetta', {
    name: 'チコの子守歌', kana: 'ちこのこもりうた', mp: 24, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [120, 150], thr: 70 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: 'チコたちが、やさしい子守歌を歌う。仲間全員のHPを回復して、悪いじょうたいも治す。', cast: 'チコたちの歌声が、星空にひびいた…', anim: 'heal2',
  }),
};

// ひらめきの じょうけん（技 → 使った 回数）
export const HIRAMEKI_R66D = {
  hi_gx_hato: { from: { gx_hanafubuki: 8, gx_mirror: 6 } },
  hi_gx_joker: { from: { gx_ace: 10, gx_ushiro: 6 } },
  hi_nd_jumbo: { from: { nd_shock: 8, nd_dokodemo: 6 } },
  hi_nd_dorayaki: { from: { nd_gourmet: 8, nd_biglight: 6 } },
  hi_kd_ozumou: { from: { kd_harite: 10, kd_shiko: 6 } },
  hi_kd_hanabatake: { from: { kd_himawari: 8, kd_saboten: 6 } },
  hi_tg_golem: { from: { tg_chikei: 8, tg_ude: 6 } },
  hi_tg_koukan: { from: { tg_iyashi: 8, tg_buki: 6 } },
  hi_rz_grandstar: { from: { rz_ryusei: 10, rz_henshin: 6 } },
  hi_rz_komoriuta: { from: { rz_starbits: 8, rz_chiko: 6 } },
};
