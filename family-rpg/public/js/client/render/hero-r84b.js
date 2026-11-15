// 第84回 B班: らんま1/2 の 系統の みため（無差別格闘流の門下生 → 早おとめ乱馬 → 飛竜しょう天はの達人）
// 「それと わかる、でも そのまま うつさない」ゲームの ドットえ。今 ある 服・かみがた・オーラの 形の 色を かえて 使う
// （hero-r82b.js と おなじ やりかた。新しい 絵の ぶひんは 作らない。オーラの 色だけ hero-aura.js に まぜる）
//  ・無差別格闘流の門下生 … 赤い 中国風の 服（金の ふち）・おさげ（hero-hair.js の 'braid'）
//  ・早おとめ乱馬         … こい 赤の 中国風の 服（黄色い ふち）・おさげ
//  ・飛竜しょう天はの達人 … あかね色の 中国風の 服（金の ふち）・おさげ・竜巻の オーラ（白と 水色の 風。'tatsu84'）
// かみの 色は その 人の まま（家族の 見た目を のこす）。男の子も 女の子も おなじ 服（男女が 入れかわる 話には しない）
// 水の すがた・お湯の すがたは 戦いの 中だけ。仲間の まどの 札（client/battle-r84b.js）と えんしゅつ（水しぶき・ゆげ）で 分かる
//
//   R84B_JOBS     … 職業の id
//   R84B_OUTFIT   … 布の服の ときの 服（hero-outfit.js の JOB_OUTFIT に まぜる）
//   R84B_BODY     … よろいを かえても のこる からだの とくちょう（JOB_BODY に まぜる）
//   R84B_OLD_LOOK … 古い 小さな え（chars.js の JOB_LOOK に まぜる）
//   AURA84B       … 竜巻の オーラ（hero-aura.js の AURA に まぜる）
export const R84B_JOBS = ['musabetsu_student', 'ranma', 'hiryu_master'];

export const R84B_OUTFIT = {
  musabetsu_student: { kind: 'gi', main: '#d83a3a', trim: '#f2c14e' },
  ranma: { kind: 'gi', main: '#c81e2a', trim: '#f6e27a' },
  hiryu_master: { kind: 'gi', main: '#b0142a', trim: '#f2c14e', dragon: true },
};

// からだの とくちょう（よろいを きても のこる）。おさげ（'braid'）・竜巻の オーラ
export const R84B_BODY = {
  musabetsu_student: { hair: 'braid', iris: '#5a3a2a' },
  ranma: { hair: 'braid', iris: '#2a4a8a' },
  hiryu_master: { hair: 'braid', iris: '#1a8a8a', aura: 'tatsu84' },
};

// 古い 小さな え（chars.js。32×42）
export const R84B_OLD_LOOK = {
  musabetsu_student: { outfit: 'gi', cloth: '#d83a3a', giTrim: '#f2c14e' },
  ranma: { outfit: 'gi', cloth: '#c81e2a', giTrim: '#f6e27a' },
  hiryu_master: { outfit: 'gi', cloth: '#b0142a', giTrim: '#f2c14e' },
};

// 竜巻の オーラ（白から 水色の 風。ほそく 長く、ところどころ きえる ＝ うずの すじ）
export const AURA84B = {
  tatsu84: { glow: 0.5, len: 3.6, wid: 0.85, up: 1.3, gap: 1.8, flicker: 0.28, cols: [['#f6fffc', 205], ['#c4f6ea', 176], ['#7ad8cc', 140], ['#3aa8a8', 104]] },
};
