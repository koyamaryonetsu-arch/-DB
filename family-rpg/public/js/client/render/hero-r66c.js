// 第66回 C班の 伝説の職業 4つの みため（総理大臣・会長・働き方改革の星・あの方。docs/plan-r66-legend.md の C班）
// 今 ある 服の 形（suit・shirt・coat）・ぼうし（silk33・fedora26）・もちもの・オーラの 色を かえて 使う（新しい 絵の ぶひんは 作らない。hero-weather.js と おなじ）
//  総理大臣       … こんの スーツに 赤い ネクタイ・むねの バッジ・むらさきの マント・手に 演説の まき紙・金の きらきら（hof）
//  会長           … 黒い スーツに 金の ベストと ネクタイ・めがね・赤い マント・金の おびの シルクハット・つえ・うすい 金の オーラ（okan）
//  働き方改革の星 … 水色の ワイシャツ（そでを まくらない）・金の 星の バッジ・手に 時計（定時）・はちまきも オーラも なし（ブラックを 卒業）
//  あの方         … まっ黒な コートと マント・黒い ぼうし（赤い おび）・むらさきの やみの オーラ・金の 目（顔は 見せない ボス）
//   R66C_OUTFIT   … 布の服の ときの 服（hero-outfit.js の JOB_OUTFIT に まぜる）
//   R66C_BODY     … よろいを かえても のこる からだの とくちょう（JOB_BODY に まぜる）
//   R66C_HAT      … 布の服の ときの ぼうし（hero-gear.js の JOB_HAT に まぜる）
//   R66C_OLD_LOOK … 古い 小さな え（chars.js の JOB_LOOK に まぜる）
export const R66C_JOBS = ['souri', 'kaichou', 'hatarakikata', 'ano_kata'];

export const R66C_OUTFIT = {
  souri: { kind: 'suit', main: '#1c2238', tie: '#c8202c', pin: true, cape: '#4a3a8a', capeLen: 35.6 },
  kaichou: { kind: 'suit', main: '#16161e', tie: '#e8b830', vest: '#c89a2a', pin: true, glasses: true, cape: '#8a1a2a', capeLen: 35.6 },
  hatarakikata: { kind: 'shirt', main: '#cfe6ff', pants: '#2a3a5a', badge: true },
  ano_kata: { kind: 'coat', main: '#0c0a10', lining: '#5a1a2a', plain: true, cape: '#0c0a10', capeLen: 38.6 },
};

export const R66C_BODY = {
  souri: { prop: 'scroll', aura: 'hof' },
  kaichou: { prop: 'stick33', aura: 'okan' },
  hatarakikata: { prop: 'watch33', iris: '#2a9a5a' },
  ano_kata: { aura: 'dark', iris: '#d8b040' },
};

export const R66C_HAT = {
  kaichou: { kind: 'silk33', c: '#16161e', band: '#e8b830', hides: 'top' },
  ano_kata: { kind: 'fedora26', c: '#0c0a10', band: '#8a1a2a', hides: 'top' },
};

export const R66C_OLD_LOOK = {
  souri: { outfit: 'suit', cloth: '#1c2238', tie: '#c8202c', cape: '#4a3a8a' },
  kaichou: { outfit: 'suit', cloth: '#16161e', tie: '#e8b830', glasses: true, cape: '#8a1a2a', hat: 'cap', hatColor: '#16161e' },
  hatarakikata: { outfit: 'suit', cloth: '#cfe6ff', tie: '#3a8a5a' },
  ano_kata: { outfit: 'robe', robeMain: '#0c0a10', robeTrim: '#5a1a2a', hat: 'cap', hatColor: '#0c0a10', cape: '#0c0a10' },
};
