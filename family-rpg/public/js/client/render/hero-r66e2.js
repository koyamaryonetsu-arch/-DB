// 第66回 E2班の 6つの 職業の みため（data/jobs-r66e2.js。docs/plan-r66-legend.md）
// 今 ある 服の 形（esports・tights26・gakuran）の 色を かえて 使う（新しい 絵の ぶひんは 作らない。hero-weather.js と おなじ やりかた）
//  eスポーツ世界王者      … こんの チームの ユニフォームに 金の おび・金に ひかる ヘッドセット
//  ゲームの神             … 白い ユニフォームに 金の おびと 金の マント・金の ヘッドセット・金の オーラ
//  楽天ゴールドカードマン … 金色の 全身タイツ・こい 金の マント・金の ベルト・むねに カード・金色の ずきん・手に カード
//  楽天ブラックカードマン … 黒い 全身タイツに 金の マント・黒い ずきん・手に カード・金の きらきら
//  サイキッカー           … むらさきの たかい えりの 服・銀の ボタン・うすむらさきの マント・ふしぎな オーラ
//  さいきくすお           … こんの 学生服・銀の ボタン・めがね・ピンクの かみ・ふしぎな オーラ
//   R66E2_OUTFIT   … 布の服の ときの 服（hero-outfit.js の JOB_OUTFIT に まぜる）
//   R66E2_BODY     … よろいを かえても のこる からだの とくちょう（JOB_BODY に まぜる）
//   R66E2_HAT      … 布の服の ときの ぼうし（hero-gear.js の JOB_HAT に まぜる）
//   R66E2_HAIR     … 職業の かみの いろ（hero.js の JOB_HAIR_RAMP に まぜる）
//   R66E2_OLD_LOOK … 古い 小さな え（chars.js の JOB_LOOK に まぜる）
export const R66E2_JOBS = ['esports_king', 'gold_cardman', 'psychicer', 'game_god', 'black_cardman', 'saiki'];

export const R66E2_OUTFIT = {
  esports_king: { kind: 'esports', main: '#1a2a6a', trim: '#f2c430' },
  game_god: { kind: 'esports', main: '#f6f2e0', trim: '#e0a81c', cape: '#f2c430', capeLen: 36.4 },
  gold_cardman: { kind: 'tights26', main: '#e8b830', cape: '#b8801a', capeLen: 35.4, belt: 'gold', emblem: 'card' },
  black_cardman: { kind: 'tights26', main: '#26222e', cape: '#d6a02e', capeLen: 37.4, belt: 'gold', emblem: 'card' },
  psychicer: { kind: 'gakuran', main: '#5a2ab8', silver: true, pants: '#2e1a5c', cape: '#d8c8ff', capeLen: 34.5 },
  saiki: { kind: 'gakuran', main: '#2a2c44', silver: true, pants: '#22243a', glasses: true },
};

export const R66E2_BODY = {
  game_god: { aura: 'gold', iris: '#e0a81c' },
  gold_cardman: { prop: 'card', cardGlasses: true },
  black_cardman: { prop: 'card', cardGlasses: true, aura: 'hof' },
  psychicer: { iris: '#b050ff', aura: 'psy' },
  saiki: { hcol: 'saikipink', iris: '#c0508a', aura: 'psy' },
};

export const R66E2_HAT = {
  esports_king: { kind: 'gameset', c: '#1a2a6a', neon: '#f2c430', neon2: '#f2c430' },
  game_god: { kind: 'gameset', c: '#f6f2e0', neon: '#ffd84a', neon2: '#ff5ad8' },
  gold_cardman: { kind: 'cowl', c: '#e8b830', hides: 'top' },
  black_cardman: { kind: 'cowl', c: '#26222e', hides: 'top' },
};

// さいきくすおの ピンクの かみ
export const R66E2_HAIR = {
  saikipink: ['#7a1a4a', '#c0407e', '#ec78ac', '#ffb0d4', '#ffe4f0'],
};

export const R66E2_OLD_LOOK = {
  esports_king: { outfit: 'baseball', cloth: '#1a2a6a', trim: '#f2c430' },
  game_god: { outfit: 'baseball', cloth: '#f6f2e0', trim: '#e0a81c', cape: '#f2c430' },
  gold_cardman: { outfit: 'tunic', cloth: '#e8b830', cape: '#b8801a', hat: 'cowl', hatColor: '#e8b830', glasses: true },
  black_cardman: { outfit: 'tunic', cloth: '#26222e', cape: '#d6a02e', hat: 'cowl', hatColor: '#26222e', glasses: true },
  psychicer: { outfit: 'robe', robeMain: '#5a2ab8', robeTrim: '#d8c8ff' },
  saiki: { outfit: 'suit', cloth: '#2a2c44', tie: '#2a2c44', glasses: true },
};
