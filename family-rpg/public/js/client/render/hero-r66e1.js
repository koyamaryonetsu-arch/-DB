// 第66回 E1班の 6つの 職業の みため（docs/plan-r66-legend.md の E1班）
// 今 ある 服の 形（suit・work・hoodie）と ぼうし（firehelmet・gameset）の 色を かえて 使う（hero-weather.js と おなじ。新しい 絵の ぶひんは 作らない）
//  公安ゼロ         … グレーの スーツ・こんの ネクタイ・えりの バッジ（ぼうしは なし。かみがたは その 人の まま）
//  トリプルフェイス … こい こんの 3つぞろい（グレーの ベスト）・金の ネクタイ・こんの マント
//  ハイパーレスキュー … オレンジの 救助服・黄色い ひかる おび・白い ヘルメット
//  火消しの神       … こんの 活動服・赤い おび・赤い マント・金の ヘルメット・火の粉
//  登録者1000万人   … 白い パーカーに 金と ピンクの ひかる 線・白い ヘッドセット
//  世界一の配信者   … 金の パーカーに 白と 水色の ひかる 線・赤い マント・金の ヘッドセット・金の オーラ
//   R66E1_OUTFIT   … 布の服の ときの 服（hero-outfit.js の JOB_OUTFIT に まぜる）
//   R66E1_BODY     … よろいを かえても のこる からだの とくちょう（JOB_BODY に まぜる）
//   R66E1_HAT      … 布の服の ときの ぼうし（hero-gear.js の JOB_HAT に まぜる）
//   R66E1_OLD_LOOK … 古い 小さな え（chars.js の JOB_LOOK に まぜる）
export const R66E1_JOBS = ['koan_zero', 'hyper_rescue', 'top_streamer', 'triple_face', 'hikeshi_god', 'world_streamer'];

export const R66E1_OUTFIT = {
  koan_zero: { kind: 'suit', main: '#8a8e98', tie: '#1e2848', pin: true },
  triple_face: { kind: 'suit', main: '#2a2e3e', tie: '#d0a838', vest: '#8a8e98', pin: true, cape: '#1e2848', capeLen: 35.6 },
  hyper_rescue: { kind: 'work', main: '#e8662a', band: '#f2e86a', fire: true },
  hikeshi_god: { kind: 'work', main: '#1e2a5a', band: '#e8323a', fire: true, cape: '#d8202c', capeLen: 36.6 },
  top_streamer: { kind: 'hoodie', main: '#f4f2fa', neon: ['#ffd23a', '#ff48d8'], pants: '#2a2840' },
  world_streamer: { kind: 'hoodie', main: '#d8a020', neon: ['#ffffff', '#38e8ff'], pants: '#2a2840', cape: '#c8141e', capeLen: 35.6 },
};

export const R66E1_BODY = {
  hikeshi_god: { spark: 'ember' },
  world_streamer: { aura: 'gold' },
};

export const R66E1_HAT = {
  hyper_rescue: { kind: 'firehelmet', c: '#f4f4f8', hides: 'top' },
  hikeshi_god: { kind: 'firehelmet', c: '#e8c04a', hides: 'top' },
  top_streamer: { kind: 'gameset', c: '#f4f2fa', neon: '#ffd23a', neon2: '#ff48d8' },
  world_streamer: { kind: 'gameset', c: '#d8a020', neon: '#ffffff', neon2: '#38e8ff' },
};

export const R66E1_OLD_LOOK = {
  koan_zero: { outfit: 'suit', cloth: '#8a8e98', tie: '#1e2848' },
  triple_face: { outfit: 'suit', cloth: '#2a2e3e', tie: '#d0a838', cape: '#1e2848' },
  hyper_rescue: { outfit: 'uniform', cloth: '#e8662a', hat: 'helmet', hatColor: '#f4f4f8' },
  hikeshi_god: { outfit: 'uniform', cloth: '#1e2a5a', cape: '#d8202c', hat: 'helmet', hatColor: '#e8c04a' },
  top_streamer: { outfit: 'tunic', cloth: '#f4f2fa' },
  world_streamer: { outfit: 'tunic', cloth: '#d8a020', cape: '#c8141e' },
};
