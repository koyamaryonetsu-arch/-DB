// 第66回 A班の 4つの 伝説の 職業の みため（守りの神・光と闇の剣神・ポケモンマスター・千年の大魔法使い）
// 今 ある 服・からだ・ぼうしの 形の 色を かえて 使う（新しい 絵の ぶひんは 作らない。hero-weather.js と おなじ やりかた）
// hero-outfit.js（服・からだ）・hero-gear.js（ぼうし）・chars.js（古い 小さな え）から よばれる
//
//  守りの神          … 白金の 大きな よろいに 金の ふち・クリーム色の 下ぎ・白い 長い マント・金の つばさの かぶと
//                      からだ: 小さな 白い はね（hero-r40.js の wings40）・金の きらきらの オーラ
//  光と闇の剣神      … こい むらさきの 大きな よろいに 金の ふち・黒むらさきの 長い マント・むらさきの 宝石の 金の サークレット
//                      からだ: 金の オーラ（光）と むらさきの よろい（闇）・金の 目
//  ポケモンマスター  … 青い ベストに 黄色い おび・赤い 野球ぼう
//                      からだ: 小さな いなずま（黄色い 仲間の 魔物の 力）
//  千年の大魔法使い  … 白い ローブに 金の ふち・赤い 宝石・白い 長い マント（ぼうしは なし）
//                      からだ: 白い ツインテール（hair: 'twin'・hcol: 'nikawhite'）・みどりの 目
//
//   R66A_JOBS     … 職業の id（データの 人との やくそく。docs/plan-r66-legend.md）
//   R66A_OUTFIT   … 布の服の ときの 服（hero-outfit.js の JOB_OUTFIT に まぜる）
//   R66A_BODY     … よろいを かえても のこる からだの とくちょう（JOB_BODY に まぜる）
//   R66A_HAT      … 布の服の ときの ぼうし（hero-gear.js の JOB_HAT に まぜる）
//   R66A_OLD_LOOK … 古い 小さな え（chars.js の JOB_LOOK に まぜる）
export const R66A_JOBS = ['guard_god', 'kenshin', 'poke_master', 'sennen_mage'];

export const R66A_OUTFIT = {
  guard_god: { kind: 'plate', metal: 'platinum', under: '#f4e8b0', trim: 'gold', cape: '#f8f4e6', capeLen: 39.0, big: true, rank: 6 },
  kenshin: { kind: 'plate', metal: 'magic', under: '#1a1030', trim: 'gold', cape: '#24102e', capeLen: 38.6, big: true, rank: 6 },
  poke_master: { kind: 'vest', main: '#2a5ac8', sash: '#f2c82e' },
  sennen_mage: { kind: 'robe', main: '#f6f4ee', trim: '#d6a02e', trimMetal: 'gold', gem: '#d8303a', cape: '#fbfbff', capeLen: 39.2 },
};

// からだの とくちょう（よろいを きても のこる）
// wings40・r40: 小さな 白い はね（hero-r40.js の body40）  aura: hero-aura.js の オーラ  spark: 小さな いなずま
export const R66A_BODY = {
  guard_god: { aura: 'hof', wings40: true, r40: true, iris: '#d6a02e' },
  kenshin: { aura: 'gold', iris: '#f2c430' },
  poke_master: { spark: true },
  sennen_mage: { hair: 'twin', hcol: 'nikawhite', iris: '#3a9a6a' },
};

// ぼうし（千年の大魔法使いは なし）
export const R66A_HAT = {
  guard_god: { kind: 'winged', mk: 'platinum', trim: 'gold', wing: 'gold', gemc: '#7ad8ff', hides: 'top' },
  kenshin: { kind: 'circlet', mk: 'gold', gemc: '#8a3ac8' },
  poke_master: { kind: 'bbcap', c: '#d8202c', hides: 'top' },
};

// 古い 小さな え（chars.js。32×42）
export const R66A_OLD_LOOK = {
  guard_god: { outfit: 'armor', cloth: '#e8e4d6', cape: '#f8f4e6', hat: 'helmet' },
  kenshin: { outfit: 'armor', cloth: '#4a2a7a', cape: '#24102e' },
  poke_master: { outfit: 'vest', cloth: '#2a5ac8', hat: 'bbcap', hatColor: '#d8202c' },
  sennen_mage: { outfit: 'robe', robeMain: '#f6f4ee', robeTrim: '#d6a02e', cape: '#fbfbff' },
};
