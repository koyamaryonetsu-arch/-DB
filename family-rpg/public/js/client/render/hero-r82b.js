// 第82回 B班: YAIBA の 系統の みため（サムライ小ぞう → 雷神けんの剣士 → ヤイバ → 竜神けんのサムライ）
// 元気な 子どもの サムライ。今 ある 服・からだ・ぼうしの 形の 色を かえて 使う（hero-r66a.js と おなじ やりかた。新しい 絵の ぶひんは 作らない）
// hero-outfit.js（服・からだ）・hero-gear.js（ぼうし）・chars.js（古い 小さな え）から よばれる
//
//  サムライ小ぞう     … オレンジの 着物に こんの はかま・木の さや・白い はちまき・つんつん 頭
//  雷神けんの剣士     … 黄色い 着物に こんの はかま・黒い さや・青い はちまき・小さな いなずま
//  ヤイバ             … 青い 着物に 白い はかま・黒い さや・赤い はちまき・小さな いなずま
//  竜神けんのサムライ … みどりの 着物に 白い はかま・金の さや・クリーム色の 長い マント・金の はちまき・金の オーラと いなずま
// かみの 色は その 人の まま（家族の 見た目を のこす）。かみがたは つんつん（'spiky'）
//
//   R82B_JOBS     … 職業の id
//   R82B_OUTFIT   … 布の服の ときの 服（hero-outfit.js の JOB_OUTFIT に まぜる）
//   R82B_BODY     … よろいを かえても のこる からだの とくちょう（JOB_BODY に まぜる）
//   R82B_HAT      … 布の服の ときの ぼうし（hero-gear.js の JOB_HAT に まぜる）
//   R82B_OLD_LOOK … 古い 小さな え（chars.js の JOB_LOOK に まぜる）
export const R82B_JOBS = ['samurai_kid', 'raijin_sword', 'yaiba', 'ryujin_samurai'];

export const R82B_OUTFIT = {
  samurai_kid: { kind: 'hakama', main: '#e8782a', hakama: '#2a3a6a', sheath: '#8a5a2a' },
  raijin_sword: { kind: 'hakama', main: '#f2c430', hakama: '#2a3a6a', sheath: '#1e1a26' },
  yaiba: { kind: 'hakama', main: '#2a6ad8', hakama: '#f2ece0', sheath: '#1a1a24' },
  ryujin_samurai: { kind: 'hakama', main: '#2aa878', hakama: '#f2ece0', sheath: '#c8a040', cape: '#f6eed0', capeLen: 36.4 },
};

// からだの とくちょう（よろいを きても のこる）。spark: 小さな いなずま・aura: hero-aura.js の オーラ
export const R82B_BODY = {
  samurai_kid: { hair: 'spiky', iris: '#5a3a1a' },
  raijin_sword: { hair: 'spiky', iris: '#c89a10', spark: true },
  yaiba: { hair: 'spiky', iris: '#2a4aa8', spark: true },
  ryujin_samurai: { hair: 'spiky', iris: '#1a8a5a', spark: true, aura: 'gold' },
};

// はちまき（段で 色が かわる）
export const R82B_HAT = {
  samurai_kid: { kind: 'headband', c: '#f4f4f4' },
  raijin_sword: { kind: 'headband', c: '#2a5ad8' },
  yaiba: { kind: 'headband', c: '#d82a2a' },
  ryujin_samurai: { kind: 'headband', c: '#f2c430' },
};

// 古い 小さな え（chars.js。32×42）
export const R82B_OLD_LOOK = {
  samurai_kid: { outfit: 'hakama', cloth: '#e8782a', hakama: '#2a3a6a', hat: 'headband', hatColor: '#f4f4f4' },
  raijin_sword: { outfit: 'hakama', cloth: '#f2c430', hakama: '#2a3a6a', hat: 'headband', hatColor: '#2a5ad8' },
  yaiba: { outfit: 'hakama', cloth: '#2a6ad8', hakama: '#f2ece0', hat: 'headband', hatColor: '#d82a2a' },
  ryujin_samurai: { outfit: 'hakama', cloth: '#2aa878', hakama: '#f2ece0', cape: '#f6eed0', hat: 'headband', hatColor: '#f2c430' },
};
