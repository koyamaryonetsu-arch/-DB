// 第44回（ポケモン P1）: 進化の 石・かわらずのいし・ふしぎないでんし（items.js で まぜる）
//
// ・進化の 石（4つ）: メニューの「道具」→「使う」で 仲間の イーブイに 使うと すぐ 進化（world/evolve.js の useEvoStone）。使うと なくなる
//   手に入る 所: カジノの 景品（第2章クリアの あと）・メダル王（45まい）・宝の地図の 宝箱（data/casino.js・data/treasure.js）
//   かわらずのいしは カジノの 景品と メダル王（45まい）
// ・かわらずのいし: 魔物だけが 装備できる アクセサリー（monsterOnly。stats.js の canEquip）。装備していると レベルで 進化しない
// ・ふしぎないでんし: 大事な物。ひみつのダンジョンの 地下50階の 休み所（星空のはての階）で 1回だけ（data/secret.js の sdBigReward）。
//   進化した ポケモン 2ひきと 配合すると ミュウが 生まれる（素材配合。品は なくなる）

const STONE = (o) => ({ type: 'use', price: 0, sell: 250, target: 'ally', field: true, ...o });

export const POKEMON_ITEMS = {
  fire_stone: STONE({
    name: 'ほのおのいし', effect: { type: 'evoStone' },
    desc: '中でほのおがゆらめく、赤い石。イーブイに使うと、ブースターに進化する。',
  }),
  water_stone: STONE({
    name: 'みずのいし', effect: { type: 'evoStone' },
    desc: '水のもようがうかぶ、青い石。イーブイに使うと、シャワーズに進化する。',
  }),
  thunder_stone: STONE({
    name: 'かみなりのいし', effect: { type: 'evoStone' },
    desc: 'いなずまのもようの、黄色い石。イーブイに使うと、サンダースに進化する。',
  }),
  moon_stone: STONE({
    name: 'つきのいし', effect: { type: 'evoStone' },
    desc: '月の光をすいこんだ、黒い石。イーブイに使うと、ブラッキーに進化する。',
  }),
  everstone: {
    name: 'かわらずのいし', type: 'acc', rank: 2, price: 0, sell: 150, monsterOnly: true,
    desc: '持っていると、すがたがかわらない、ふしぎな石。魔物だけが装備できる。装備しているあいだは、レベルが上がっても進化しない。',
  },
  mew_gene: {
    name: 'ふしぎないでんし', type: 'key',
    desc: 'ひみつのダンジョンのおくで見つけた、ふしぎな光のつぶ。進化したポケモン2ひきと配合すると、何かが生まれるという。',
  },
};

export const POKEMON_ITEM_KANA = {
  fire_stone: 'ほのおのいし', water_stone: 'みずのいし', thunder_stone: 'かみなりのいし', moon_stone: 'つきのいし',
  everstone: 'かわらずのいし', mew_gene: 'ふしぎないでんし',
};
