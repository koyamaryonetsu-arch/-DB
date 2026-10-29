// 第51回 W の 天気の 職業 3つの みため（気象予報士・お天気キャスター・天候をあやつる者）
// 今 ある 服の 形（suit・robe）の 色を かえて 使う（新しい 絵の ぶひんは 作らない）
//  気象予報士       … 水色の スーツ・黄色い ネクタイ・青い ひもの 名札（天気の 研究所の 人）
//  お天気キャスター … 白い スーツ・オレンジの ネクタイ・名札（テレビの 人）
//  天候をあやつる者 … こい あいいろの ローブに 金の ふち・水色の 宝石・白い マント。からだに 小さな いなずま（ss2 と おなじ spark）
//   WEATHER_OUTFIT   … 布の服の ときの 服（hero-outfit.js の JOB_OUTFIT に まぜる）
//   WEATHER_BODY     … よろいを かえても のこる からだの とくちょう（JOB_BODY に まぜる）
//   WEATHER_OLD_LOOK … 古い 小さな え（chars.js の JOB_LOOK に まぜる）
export const WEATHER_JOBS_LOOK = ['kishou', 'otenki_caster', 'tenkou_tsukai'];

export const WEATHER_OUTFIT = {
  kishou: { kind: 'suit', main: '#5a8ac8', tie: '#ffd23a', lanyard: '#2a6ad0', pin: true },
  otenki_caster: { kind: 'suit', main: '#f4f2ea', tie: '#f0a83a', lanyard: '#e8506a', pin: true },
  tenkou_tsukai: { kind: 'robe', main: '#2e2c7a', trim: '#ffd23a', trimMetal: 'gold', gem: '#7ad8ff', cape: '#e8f4ff', capeLen: 38.6 },
};

export const WEATHER_BODY = {
  tenkou_tsukai: { spark: true, iris: '#5a7ae8' },
};

export const WEATHER_OLD_LOOK = {
  kishou: { outfit: 'suit', cloth: '#5a8ac8', tie: '#ffd23a' },
  otenki_caster: { outfit: 'suit', cloth: '#f4f2ea', tie: '#f0a83a' },
  tenkou_tsukai: { outfit: 'robe', robeMain: '#2e2c7a', robeTrim: '#ffd23a', hat: 'wizard', hatColor: '#2e2c7a', cape: '#e8f4ff' },
};
