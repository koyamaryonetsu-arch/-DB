// お仕事いらい板の たのまれごと（第39回 C・第41回）の きまった 戦い（だいほんは data/sidequests-family.js・sidequests-work.js）
// 第1部クリアの ころ（Lv55〜58）の パーティーが、完全オートでも 勝てる くらいの 軽い 戦い（ボスほど 強く しない）
// enemyLv … その レベルまで 強く する（data/treasure.js の scaleEnemy）
export const FIXED_FAMILY = {
  // サファラ劇場の 屋上: 室外機の ファンに 住みついた すなぼこりの 魔物（砂嵐の精 3びき）
  fq_dust: { group: [['sandstorm_spirit', 3, 3]], bg: 'desert', bgm: 'battle', canFlee: false, enemyLv: 50 },
  // カナトコの 南の 道: 岩しおを かかえた ほりほりモグラ（3びき）
  fq_mole: { group: [['mole_miner', 3, 3]], bg: 'snowfield', bgm: 'battle', canFlee: false, enemyLv: 50 },
  // 第41回: ハミルの オアシスの 池の こわれた 橋に 住みついた 砂ガニ（2ひき。ひとりでも 勝てる くらい）
  fq_crab: { group: [['sand_crab', 2, 2]], bg: 'desert', bgm: 'battle', canFlee: false, enemyLv: 50 },
  // 第41回: ユノハの 宿の 物置の たなの おくの つららコウモリ（3びき）
  fq_bat: { group: [['ice_bat', 3, 3]], bg: 'snowfield', bgm: 'battle', canFlee: false, enemyLv: 50 },
};
