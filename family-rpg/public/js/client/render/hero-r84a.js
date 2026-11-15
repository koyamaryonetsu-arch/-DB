// 第84回 A班: 幽☆遊☆白書の 系統の みため（ふりょう → れい界探てい → うら飯ゆう助 → 魔界の王の子）
// 「それと わかる、でも そのまま うつさない」ゲームの ドットえ。今 ある 服の 形（学ラン 'gakuran'・スーツ 'suit'・道着 'gi'）・
// かみがた（オールバック 'slick'・長い かみ 'long'）・ぼうし（'fedora26'）・マント・オーラだけで かく（新しい 部品は ない）
//  ・ふりょう       … みどりの 学ラン（金の ボタン）・オールバック
//  ・れい界探てい   … こんの 上着に ゆるめた 青い ネクタイ・こげ茶の 中おれぼうし（探ていの 服）
//  ・うら飯ゆう助   … 白い 道着に 青い ふち・オールバック
//  ・魔界の王の子   … こい むらさきの 道着・白い ふち・黒い マント・長い かみ・金の 目・青い れい気の オーラ
// かみの 色は その 人の まま（家族の 見た目を のこす）
//
//   R84A_JOBS     … 職業の id
//   R84A_OUTFIT   … 布の服の ときの 服（hero-outfit.js の JOB_OUTFIT に まぜる）
//   R84A_BODY     … よろいを かえても のこる からだの とくちょう（JOB_BODY に まぜる。かみがた・目の 色・オーラ）
//   R84A_HAT      … 布の服の ときの ぼうし（hero-gear.js の JOB_HAT に まぜる）
//   R84A_OLD_LOOK … 古い 小さな え（chars.js の JOB_LOOK に まぜる）

export const R84A_JOBS = ['furyo', 'reikai_tantei', 'yusuke', 'makai_prince'];

export const R84A_OUTFIT = {
  furyo: { kind: 'gakuran', main: '#2f7a3e' },
  reikai_tantei: { kind: 'suit', main: '#2a3a6a', tie: '#2a9ad8', loose: true },
  yusuke: { kind: 'gi', main: '#f4f2fa', trim: '#2a6ad8' },
  makai_prince: { kind: 'gi', main: '#3a2a5a', trim: '#e8e0ff', cape: '#1a1430', capeLen: 34.6 },
};

// からだの とくちょう（よろいを きても のこる）
export const R84A_BODY = {
  furyo: { hair: 'slick', iris: '#3a3a4a' },
  reikai_tantei: { hair: 'slick', iris: '#2a4a8a' },
  yusuke: { hair: 'slick', iris: '#2a5ab8' },
  makai_prince: { hair: 'long', iris: '#e8c040', aura: 'ryuma' },
};

// ぼうし（れい界探ていだけ。中おれぼうし）
export const R84A_HAT = {
  reikai_tantei: { kind: 'fedora26', c: '#5a4434', band: '#2a9ad8', hides: 'top' },
};

// 古い 小さな え（chars.js。32×42）
export const R84A_OLD_LOOK = {
  furyo: { outfit: 'uniform', cloth: '#2f7a3e' },
  reikai_tantei: { outfit: 'suit', cloth: '#2a3a6a', tie: '#2a9ad8' },
  yusuke: { outfit: 'gi', cloth: '#f4f2fa', giTrim: '#2a6ad8' },
  makai_prince: { outfit: 'gi', cloth: '#3a2a5a', giTrim: '#e8e0ff', cape: '#1a1430' },
};
