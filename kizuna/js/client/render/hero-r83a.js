// 第83回 A班: 封神演義の 系統の みため（つりをする道士 → せん人界の道士 → 太公望 → ほう神の大軍師）
// 「それと わかる、でも そのまま うつさない」ゲームの ドットえ。今 ある 服の 形（道士の ゆったりした 服 ＝ 'robe'）・ぼうし（むぎわら・頭の ぬの・金の わ）・
// マント・オーラを 使い、足りない 部品（手に もつ つりざおと 風の むち）だけ 足す（hero-r26.js の drawProp26 から drawProp83a）
//  ・つりをする道士     … 水色の 道士の 服・むぎわらぼうし・手に 竹の つりざお（糸と うき）
//  ・せん人界の道士     … みどりの 道士の 服・白い 頭の ぬの・手に つりざお
//  ・太公望             … 白い 道士の 服に 青い ふち・青い 頭の ぬの・手に 打神べん（風の むち。みどりの 光の 玉）
//  ・ほう神の大軍師     … こい 青の 道士の 服に 金の ふち・白い マント・金の わ・打神べん・雲の オーラ
// かみの 色は その 人の まま（家族の 見た目を のこす）
//
//   R83A_JOBS     … 職業の id
//   R83A_OUTFIT   … 布の服の ときの 服（hero-outfit.js の JOB_OUTFIT に まぜる）
//   R83A_BODY     … よろいを かえても のこる からだの とくちょう（JOB_BODY に まぜる。prop: 手に もつ もの）
//   R83A_HAT      … 布の服の ときの ぼうし（hero-gear.js の JOB_HAT に まぜる）
//   R83A_OLD_LOOK … 古い 小さな え（chars.js の JOB_LOOK に まぜる）
//   drawProp83a(cv, P, A, O) … 手に もつ つりざお・打神べん（hero-r26.js の drawProp26 から）
import { mat, ramp, TH } from './hero-raster.js?v=6f7fa0f75e74';

export const R83A_JOBS = ['fishing_doshi', 'sennin_doshi', 'taikobo', 'hoshin_gunshi'];

export const R83A_OUTFIT = {
  fishing_doshi: { kind: 'robe', main: '#6a9ac8', trim: '#f4efe0' },
  sennin_doshi: { kind: 'robe', main: '#3f9a7a', trim: '#f4f2fa' },
  taikobo: { kind: 'robe', main: '#f2f0ea', trim: '#3a6ad0' },
  hoshin_gunshi: { kind: 'robe', main: '#2a3a8a', trim: '#f2c14e', trimMetal: 'gold', cape: '#f4f0e0', capeLen: 37.4 },
};

// からだの とくちょう（よろいを きても のこる）。prop: 手に もつ もの（rod83 つりざお・whip83 打神べん）
export const R83A_BODY = {
  fishing_doshi: { iris: '#3a4a6a', prop: 'rod83' },
  sennin_doshi: { iris: '#2a6a5a', prop: 'rod83' },
  taikobo: { iris: '#2a4aa8', prop: 'whip83' },
  hoshin_gunshi: { iris: '#8a6a1a', prop: 'whip83', whipGlow83: true, aura: 'cloud' },
};

// ぼうし（段で かわる）
export const R83A_HAT = {
  fishing_doshi: { kind: 'straw', c: '#ecc86c', band: '#3a6aa8', hides: 'top' },
  sennin_doshi: { kind: 'bandana', c: '#f4f0e6', hides: 'top' },
  taikobo: { kind: 'bandana', c: '#3a6ad0', hides: 'top' },
  hoshin_gunshi: { kind: 'circlet', mk: 'gold', gemc: '#5ae890' },
};

// 古い 小さな え（chars.js。32×42）
export const R83A_OLD_LOOK = {
  fishing_doshi: { outfit: 'robe', robeMain: '#6a9ac8', robeTrim: '#f4efe0', hat: 'straw', hatColor: '#ecc86c' },
  sennin_doshi: { outfit: 'robe', robeMain: '#3f9a7a', robeTrim: '#f4f2fa', hat: 'turban', hatColor: '#f4f0e6' },
  taikobo: { outfit: 'robe', robeMain: '#f2f0ea', robeTrim: '#3a6ad0', hat: 'bandana', hatColor: '#3a6ad0' },
  hoshin_gunshi: { outfit: 'robe', robeMain: '#2a3a8a', robeTrim: '#f2c14e', cape: '#f4f0e0', hat: 'circlet', hatColor: '#f2c14e' },
};

// ───────────── もちもの（drawProp26 から） ─────────────
const cl = (c, o = {}) => mat({ r: ramp(c, 4, o), th: o.th || TH.cloth });
const bamboo = mat({ r: ['#4a3a14', '#8a7a34', '#c8b860', '#efe4a0'], th: TH.matte });
const wood = mat({ r: ['#2a1608', '#5a3218', '#8a5228', '#b87a40'], th: TH.matte });
const jade = mat({ r: ['#0a4a2a', '#2a9a5a', '#6ae8a0', '#d8fff0'], th: TH.gem, spec: 0.9, emit: true });
export function drawProp83a(cv, P, A, O) {
  const kind = O.body?.prop;
  if (kind !== 'rod83' && kind !== 'whip83') return false;
  const [hx, hy] = A.hand;
  const d = P.side ? P.facing : A.s || 1;
  if (kind === 'rod83') {
    // 竹の つりざお（手から 上へ ながく。先から 糸が たれて、赤と 白の うき）
    const tx = hx + d * 4.2, ty = hy - 9.6;
    cv.part({ ol: 'line' });
    cv.cap(hx - d * 0.3, hy + 1.6, 0.48, tx, ty, 0.32, bamboo);
    const id = cv.cur;
    for (const t of [0.35, 0.7]) cv.crease([[hx + (tx - hx) * t - 0.3, hy + (ty - hy) * t], [hx + (tx - hx) * t + 0.3, hy + (ty - hy) * t]], 0.12, -0.6, { parts: [id] });
    cv.part({ ol: 'none', cast: false });
    cv.stroke([[tx, ty], [tx + d * 0.6, ty + 4.0], [tx + d * 0.8, ty + 7.2]], 0.1, cl('#f4f4f8'), { n: [0, 0] });
    cv.part({ ol: 'soft' });
    cv.ell(tx + d * 0.8, ty + 7.8, 0.55, 0.55, cl('#e0302a'), { bulge: 0.9 });
    cv.part({ ol: 'none' });
    cv.ell(tx + d * 0.8, ty + 7.4, 0.5, 0.25, cl('#ffffff'), { n: [0, 0] });
    return true;
  }
  // 打神べん（木の えの みじかい むち。ふしの ある 棒に、先に みどりの 光の 玉）
  const tx = hx + d * 2.4, ty = hy - 7.0;
  cv.part({ ol: 'line' });
  cv.cap(hx - d * 0.3, hy + 1.4, 0.46, tx, ty, 0.34, wood);
  const id = cv.cur;
  for (const t of [0.3, 0.55, 0.8]) cv.crease([[hx + (tx - hx) * t - 0.35, hy + (ty - hy) * t], [hx + (tx - hx) * t + 0.35, hy + (ty - hy) * t]], 0.14, -0.6, { parts: [id] });
  cv.part({ ol: 'line' });
  cv.ell(tx + d * 0.3, ty - 0.6, O.body.whipGlow83 ? 1.05 : 0.8, O.body.whipGlow83 ? 1.05 : 0.8, jade, { bulge: 0.95 });
  return true;
}
