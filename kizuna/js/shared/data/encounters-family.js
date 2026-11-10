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
  // ───── 第65回 D2（data/sidequests-work2.js）。お話が Lv68〜76 の ころなので 敵Lv70（それでも 完全オートで 勝てる 軽さ）─────
  // 12. 星読みの里の 見晴らし: 雲の 海から 上がってきた かみなりぐもと ふわりん
  fq_cloud: { group: [['thunder_puff', 1, 1], ['fuwari', 1, 1]], bg: 'hoshiyomi', bgm: 'battle', canFlee: false, enemyLv: 70 },
  // 14. 竜守りの村の 大岩の かげ: 雪くずれと いっしょに 来た ゆきだるまん（3びき）
  fq_snowmen: { group: [['snowman', 3, 3]], bg: 'snowfield', bgm: 'battle', canFlee: false, enemyLv: 70 },
  // 17. ドゥナの からくりゲーム機の バグで、ゲームの 中から とび出した いたずらゴブリン（3びき）
  fq_bug: { group: [['goblin', 3, 3]], bg: 'tokei', bgm: 'battle', canFlee: false, enemyLv: 70 },
  // ───── 第68回 D班（data/sidequests-work3.js）。第7章の カリムの あと（Lv76〜80 の ころ）なので 敵Lv76（それでも 完全オートで 勝てる 軽さ）─────
  // （ゆがみの精・ひとくい箱は もとが 強いので enemyPow で 少し 弱く する〈data/treasure.js の scaleEnemy〉。戦士ひとりでも 40回に 39回 いじょう 勝てる）
  // 20. 星読みの里の けいこづくえの 引き出し: 時の トンネルから 出てきた ゆがみの精（1ぴき）
  fq_warp: { group: [['warp_wisp', 1, 1]], bg: 'hoshiyomi', bgm: 'battle', canFlee: false, enemyLv: 76, enemyPow: 0.65 },
  // 21. 竜守りの村の まきおき場: ほのおの 中から 出てきた 火こぞう・ひのこネズミ
  fq_blaze: { group: [['fire_imp', 2, 2], ['hinezumi', 1, 1]], bg: 'snowfield', bgm: 'battle', canFlee: false, enemyLv: 76 },
  // 22. ホシフル村の 古い 宝箱: ひとくい箱（1ぴき）
  fq_mimic: { group: [['hitokui_box', 1, 1]], bg: 'grass', bgm: 'battle', canFlee: false, enemyLv: 76, enemyPow: 0.65 },
  // ───── 第73回 D班（data/sidequests-work4.js）。第8章 第1幕（Lv80 の ころ）なので 敵Lv80（それでも 完全オートで 勝てる 軽さ）─────
  // 24. ひみつの温泉の 湯けむりの 白い岩: 岩の 下に すを 作っていた 岩もぐら（2ひき）
  fq_rockmole: { group: [['rock_mole', 2, 2]], bg: 'snowfield', bgm: 'battle', canFlee: false, enemyLv: 80, enemyPow: 0.55 },
  // 26. 王家のピラミッドの 前の 広場の 夜の 見張り: 北の 砂から 来た サンドワームと やみサソリ
  fq_sandnight: { group: [['sand_worm', 1, 1], ['dark_scorpion', 1, 1]], bg: 'desert', bgm: 'battle', canFlee: false, enemyLv: 80, enemyPow: 0.7 },
  // ───── 第74回 D班（data/sidequests-work5.js）。第8章 第2幕（Lv84 の ころ）なので 敵Lv84（それでも 完全オートで 勝てる 軽さ。もとが 強いので enemyPow で 弱く する）─────
  // 27. 海鳴りの小島の 洞窟の 入り口の 月の 夜: かげを ぬすむ かげぼうしと ひとがたの影
  fq_shadownight: { group: [['kage_boushi', 2, 2], ['homunculus_shade', 1, 1]], bg: 'sea_cave', bgm: 'battle', canFlee: false, enemyLv: 84, enemyPow: 0.4 },
  // 28. 北の海辺の ハサミ団の かくれ岩: 用心棒の よろいガニと 星座ガニ
  fq_crabguard: { group: [['armor_crab', 2, 2], ['crab_star', 1, 1]], bg: 'beach', bgm: 'battle', canFlee: false, enemyLv: 84, enemyPow: 0.4 },
};
