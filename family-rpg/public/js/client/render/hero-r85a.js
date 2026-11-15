// 第85回 A班: スレイヤーズの 系統の みため（大食いの旅の魔道士 → 天才美少女魔道士リナ → ドラまた）
// 「それと わかる、でも そのまま うつさない」ゲームの ドットえ。今 ある 服の 形（旅の 服 'travel' ＝ 上着・ベルト・マント）・はちまき（hero-gear.js の 'headband'）・
// かたあて（今 ある pauldron）・オーラ（hero-aura.js）を 使う。新しい 絵の ぶひんは 作らない（outfit85a で かたあてを のせる だけ）
//  ・大食いの旅の魔道士 … だいだい色の 旅の 服・こげ茶の マント・黄色い はちまき・小さな 金の かたあて
//  ・天才美少女魔道士リナ … 赤い 服・黒い マント・黄色い かたあて（金）・黄色い はちまき
//  ・ドラまた             … こい 赤の 服・黒い マント（長い）・金の かたあて（大きめ・2まい）・赤い はちまき・赤い オーラ（'red85'）
// かみの 色は その 人の まま（家族の 見た目を のこす）。男の子も おなじ 服（女の子は 今の 'travel' と おなじく スカート）
//
//   R85A_JOBS     … 職業の id
//   R85A_OUTFIT   … 布の服の ときの 服（hero-outfit.js の JOB_OUTFIT に まぜる。r85a: かたあての 大きさ）
//   R85A_BODY     … よろいを かえても のこる からだの とくちょう（JOB_BODY に まぜる。オーラ）
//   R85A_HAT      … 布の服の ときの はちまき（hero-gear.js の JOB_HAT に まぜる）
//   R85A_OLD_LOOK … 古い 小さな え（chars.js の JOB_LOOK に まぜる）
//   AURA85A       … 赤い オーラ（hero-aura.js の AURA に まぜる）
//   outfit85a(O, S, metal) … 黄色い かたあてを のせる（hero-outfit.js の outfitOf の おわりに 1行。metal は hero-outfit.js の 金ぞくの 色。
//     この ファイルから hero-outfit.js を import しない〈おたがいに import すると、先に 読まれた 方で まだ ない 名前を 使って しまう〉）

export const R85A_JOBS = ['tabi_madoshi', 'lina', 'doramata'];

export const R85A_OUTFIT = {
  tabi_madoshi: { kind: 'travel', main: '#e07a2a', cloak: '#5a3a22', r85a: 0.75 },
  lina: { kind: 'travel', main: '#d42a2a', cloak: '#1c1824', r85a: 0.9 },
  doramata: { kind: 'travel', main: '#a8101c', cloak: '#120e18', r85a: 1.05, r85aLayers: 2 },
};

// からだの とくちょう（よろいを きても のこる）。ドラまたは 赤い オーラ
export const R85A_BODY = {
  tabi_madoshi: { iris: '#8a3a1a' },
  lina: { iris: '#a8202a' },
  doramata: { iris: '#c81a2a', aura: 'red85' },
};

// はちまき（段で 色が かわる）
export const R85A_HAT = {
  tabi_madoshi: { kind: 'headband', c: '#f2c14e' },
  lina: { kind: 'headband', c: '#f6d03a' },
  doramata: { kind: 'headband', c: '#e8202a' },
};

// 古い 小さな え（chars.js。32×42）
export const R85A_OLD_LOOK = {
  tabi_madoshi: { outfit: 'traveler', cloth: '#e07a2a', hat: 'headband', hatColor: '#f2c14e', cape: '#5a3a22' },
  lina: { outfit: 'traveler', cloth: '#d42a2a', hat: 'headband', hatColor: '#f6d03a', cape: '#1c1824' },
  doramata: { outfit: 'traveler', cloth: '#a8101c', hat: 'headband', hatColor: '#e8202a', cape: '#120e18' },
};

// 赤い オーラ（ほのおの ような 赤い 光。根もとは だいだい → さきは こい 赤）
export const AURA85A = {
  red85: { glow: 0.55, len: 3.2, wid: 1.1, up: 1.1, gap: 2.1, flicker: 0.15, cols: [['#fff0d8', 210], ['#ff9a5a', 180], ['#ff3a2a', 150], ['#b00a14', 110]] },
};

// 黄色い かたあて（金ぞくの 金。S.r85a … 大きさ）
export function outfit85a(O, S, metal) {
  if (!S?.r85a) return;
  O.pauldron = { m: metal('gold'), size: S.r85a, kind: 'plate', layers: S.r85aLayers || 1 };
}
