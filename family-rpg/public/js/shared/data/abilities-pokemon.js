// 第44回（ポケモン P1）: ポケモンの 魔物が 覚える 技（data/companions-pokemon.js の learn）
//   ・kind は 'monster'（魔物の 技。仲間の 魔物は MP を つかう）
//   ・えんしゅつ（anim）の pk_〜 は 絵の 係（P2）が 作る（名前の 約束: pk_spark・pk_thunder・pk_quick・pk_ember・pk_flame・
//     pk_water・pk_hydro・pk_leaf・pk_solar・pk_shadow・pk_psychic・pk_bodyslam）。ほかの 技は 今 ある えんしゅつ
//   ・強さの めやす: 系統の おうぎ（abilities-ougi.js。Lv30 の 1体 150〜180・Lv60 の 全体 135〜180）を こえない
//   ・水の 技は 属性なし（ゲームに 水の 属性が ないので、今の 水てっぽう・大波と おなじ）
//   abilities.js が まぜる。ここは ほかの データを import しない

const PARA = (chance) => ({ status: 'paralyze', chance, turns: [1, 2] });

export const POKEMON_ABILITIES = {
  // ───────────── でんき（ピカチュウ・ライチュウ・サンダース）─────────────
  pk_thundershock: {
    name: 'でんきショック', kana: 'でんきしょっく', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', element: 'bolt', base: [24, 32], thr: 20, status: PARA(0.1) },
    desc: 'ほっぺから電気を出して、敵1体に雷のダメージ。マヒさせることもある。', cast: '{a}のでんきショック！', anim: 'pk_spark',
  },
  pk_thunderwave: {
    name: 'でんじは', kana: 'でんじは', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'status', status: 'paralyze', chance: 0.6, turns: [1, 2] },
    desc: '弱い電気の波を当てて、敵1体をマヒさせる。', cast: '{a}はでんじはを放った！', anim: 'pk_spark',
  },
  pk_thunderbolt: {
    name: '10まんボルト', kana: 'じゅうまんぼると', kind: 'monster', mp: 9, target: 'enemy',
    effect: { type: 'magic', element: 'bolt', base: [95, 115], thr: 50, status: PARA(0.1) },
    desc: '強い電気を放って、敵1体に大きな雷のダメージ。マヒさせることもある。', cast: '{a}の10まんボルト！', anim: 'pk_thunder',
  },
  pk_thunder: {
    name: 'かみなり', kana: 'かみなり', kind: 'monster', mp: 18, target: 'enemies',
    effect: { type: 'magic', element: 'bolt', base: [110, 135], thr: 70, status: PARA(0.2) },
    desc: '空から大きな雷を落として、敵全体に雷のダメージ。マヒさせることもある。', cast: '空がゴロゴロ鳴りだした…！{a}のかみなり！', anim: 'pk_thunder',
  },
  pk_quickattack: {
    name: 'でんこうせっか', kana: 'でんこうせっか', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.3, acc: 1, critBonus: 0.05 },
    desc: '目にもとまらぬ速さで体当たりする。敵1体にダメージ。', cast: '{a}のでんこうせっか！', anim: 'pk_quick',
  },
  pk_pinmissile: {
    name: 'ミサイルばり', kana: 'みさいるばり', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'phys', mult: 0.55, hits: 4, random: true },
    desc: 'とがった毛をはりのようにとばす。敵にランダムで4回ダメージ。', cast: '{a}の毛がピンと立った！ミサイルばり！', anim: 'pk_quick',
  },

  // ───────────── ほのお（ヒトカゲ・リザード・リザードン・ブースター）─────────────
  pk_ember: {
    name: 'ひのこ', kana: 'ひのこ', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', element: 'fire', base: [24, 32], thr: 20 },
    desc: '小さな火の粉をとばして、敵1体に炎のダメージ。', cast: '{a}のひのこ！', anim: 'pk_ember',
  },
  pk_flamethrower: {
    name: 'かえんほうしゃ', kana: 'かえんほうしゃ', kind: 'monster', mp: 9, target: 'enemy',
    effect: { type: 'magic', element: 'fire', base: [100, 120], thr: 50 },
    desc: 'はげしい炎をふきつけて、敵1体に大きな炎のダメージ。', cast: '{a}のかえんほうしゃ！', anim: 'pk_flame',
  },
  pk_fireblast: {
    name: 'だいもんじ', kana: 'だいもんじ', kind: 'monster', mp: 18, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [115, 140], thr: 70 },
    desc: '大の字の形の大きな炎で、敵全体に炎のダメージ。', cast: '{a}のだいもんじ！大の字の炎が広がった！', anim: 'pk_flame',
  },

  // ───────────── みず（ゼニガメ・カメール・カメックス・シャワーズ）─────────────
  pk_watergun: {
    name: 'みずでっぽう', kana: 'みずでっぽう', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'magic', base: [24, 32], thr: 20 },
    desc: '口から水をいきおいよくとばす。敵1体にダメージ。', cast: '{a}のみずでっぽう！', anim: 'pk_water',
  },
  pk_surf: {
    name: 'なみのり', kana: 'なみのり', kind: 'monster', mp: 10, target: 'enemies',
    effect: { type: 'magic', base: [70, 88], thr: 50 },
    desc: '大きな波を起こして、敵全体をおし流す。', cast: '{a}は大きな波に乗った！なみのり！', anim: 'pk_hydro',
  },
  pk_hydropump: {
    name: 'ハイドロポンプ', kana: 'はいどろぽんぷ', kind: 'monster', mp: 16, target: 'enemy',
    effect: { type: 'magic', base: [150, 180], thr: 80 },
    desc: 'ものすごいいきおいの水をうち出す。敵1体にとても大きなダメージ。', cast: '{a}のハイドロポンプ！', anim: 'pk_hydro',
  },
  pk_aquaring: {
    name: 'アクアリング', kana: 'あくありんぐ', kind: 'monster', mp: 6, target: 'self', role: 'heal',
    effect: { type: 'regen', base: [16, 22], thr: 40, dur: 30 },
    desc: '水のわで体をつつみ、しばらくのあいだ少しずつHPを回復する。', cast: '{a}の体を、水のわがつつんだ！', anim: 'heal1',
  },

  // ───────────── くさ（フシギダネ・フシギソウ・フシギバナ）─────────────
  pk_vinewhip: {
    name: 'つるのムチ', kana: 'つるのむち', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.35 },
    desc: 'せなかからのびるつるで、敵1体を打つ。', cast: '{a}のつるのムチ！', anim: 'pk_leaf',
  },
  pk_razorleaf: {
    name: 'はっぱカッター', kana: 'はっぱかったー', kind: 'monster', mp: 7, target: 'enemies',
    effect: { type: 'phys', mult: 0.95, critBonus: 0.15 },
    desc: 'するどいはっぱをとばして、敵全体を切りつける。会心が出やすい。', cast: '{a}のはっぱカッター！', anim: 'pk_leaf',
  },
  pk_sleeppowder: {
    name: 'ねむりごな', kana: 'ねむりごな', kind: 'monster', mp: 5, target: 'enemy',
    effect: { type: 'status', status: 'sleep', chance: 0.6, turns: [1, 2] },
    desc: 'ねむくなる粉をふりかけて、敵1体をねむらせる。', cast: '{a}はねむりごなをまいた！', anim: 'sleep',
  },
  pk_solarbeam: {
    name: 'ソーラービーム', kana: 'そーらーびーむ', kind: 'monster', mp: 16, target: 'enemy',
    effect: { type: 'magic', element: 'light', base: [150, 180], thr: 80 },
    desc: 'お日さまの光を集めて、光の線をうち出す。敵1体にとても大きなダメージ。', cast: '{a}は光を集めた…！ソーラービーム！', anim: 'pk_solar',
  },
  pk_synthesis: {
    name: 'こうごうせい', kana: 'こうごうせい', kind: 'monster', mp: 8, target: 'self', role: 'heal',
    effect: { type: 'heal', base: [120, 150], thr: 40 },
    desc: 'お日さまの光をあびて、自分のHPを回復する。', cast: '{a}は光をあびて、元気をとりもどした！', anim: 'heal1',
  },

  // ───────────── ノーマル・あく・ゴースト・エスパー ─────────────
  pk_swift: {
    name: 'スピードスター', kana: 'すぴーどすたー', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'magic', element: 'light', base: [30, 40], thr: 30 },
    desc: '星の形の光をとばして、敵全体にダメージ。', cast: '{a}のスピードスター！', anim: 'holy',
  },
  pk_bodyslam: {
    name: 'のしかかり', kana: 'のしかかり', kind: 'monster', mp: 6, target: 'enemy',
    effect: { type: 'phys', mult: 1.6, status: PARA(0.3) },
    desc: '大きな体で、敵1体にのしかかる。マヒさせることもある。', cast: '{a}ののしかかり！', anim: 'pk_bodyslam',
  },
  pk_gigaimpact: {
    name: 'ギガインパクト', kana: 'ぎがいんぱくと', kind: 'monster', mp: 18, target: 'enemy',
    effect: { type: 'phys', mult: 2.6 },
    desc: '体じゅうの力をこめて、敵1体に思いきりぶつかる。とても大きなダメージ。', cast: '{a}のギガインパクト！', anim: 'pk_bodyslam',
  },
  pk_rest: {
    name: 'ねむる', kana: 'ねむる', kind: 'monster', mp: 8, target: 'self', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [220, 260], thr: 40 }, { type: 'cure', statuses: ['poison', 'paralyze', 'confuse', 'blind', 'silence'] }] },
    desc: 'ぐっすりねむって、自分のHPを大きく回復し、悪いじょうたいも治す。', cast: '{a}はぐうぐうねむった…。', anim: 'heal1',
  },
  pk_shadowball: {
    name: 'シャドーボール', kana: 'しゃどーぼーる', kind: 'monster', mp: 9, target: 'enemy',
    effect: { type: 'magic', element: 'dark', base: [100, 120], thr: 50 },
    desc: '影のかたまりをぶつけて、敵1体に大きな闇のダメージ。', cast: '{a}のシャドーボール！', anim: 'pk_shadow',
  },
  pk_darkpulse: {
    name: 'あくのはどう', kana: 'あくのはどう', kind: 'monster', mp: 10, target: 'enemies',
    effect: { type: 'magic', element: 'dark', base: [70, 88], thr: 50 },
    desc: '悪い心の波をまわりに広げて、敵全体に闇のダメージ。', cast: '{a}のあくのはどう！', anim: 'pk_shadow',
  },
  pk_hypnosis: {
    name: 'さいみんじゅつ', kana: 'さいみんじゅつ', kind: 'monster', mp: 5, target: 'enemy',
    effect: { type: 'status', status: 'sleep', chance: 0.55, turns: [1, 2] },
    desc: 'ふしぎな動きで、敵1体をねむらせる。', cast: '{a}のさいみんじゅつ！', anim: 'sleep',
  },
  pk_confuseray: {
    name: 'あやしいひかり', kana: 'あやしいひかり', kind: 'monster', mp: 5, target: 'enemy',
    effect: { type: 'status', status: 'confuse', chance: 0.6, turns: [1, 3] },
    desc: 'ふしぎな光を見せて、敵1体を混乱させる。', cast: '{a}の体があやしく光った！', anim: 'dance',
  },
  pk_moonlight: {
    name: 'つきのひかり', kana: 'つきのひかり', kind: 'monster', mp: 8, target: 'self', role: 'heal',
    effect: { type: 'heal', base: [120, 150], thr: 40 },
    desc: '月の光をあびて、自分のHPを回復する。', cast: '{a}は月の光をあびた！', anim: 'heal1',
  },
  pk_psychic: {
    name: 'サイコキネシス', kana: 'さいこきねしす', kind: 'monster', mp: 10, target: 'enemy',
    effect: { type: 'magic', base: [110, 130], thr: 60 },
    desc: 'ふしぎな力で、敵1体に大きなダメージ。', cast: '{a}のサイコキネシス！', anim: 'pk_psychic',
  },
};

export const POKEMON_ABILITY_IDS = Object.keys(POKEMON_ABILITIES);
