// 第86回 B班: 幻の職業「天下一の格闘王」「混とんの大軍師」の みため（docs/plan-r86-phantom-b.md。第79回 hero-r79.js と おなじ やりかた）
// 「きわめた 2つの 職業が 合わさった、いちばん 上の すがた」。もとの 2つの 衣装の とくちょうを どちらも 入れ、伝説より 1だん ごうか。
// 今 ある 服の 形（道着 'gi'・道士の 服 'robe'）・羽織（hero-r26.js の haori）・かたあて（pauldron）・マント・はちまき・かんむり・オーラを 使い、
// 足りない 部品（手に もつ 太極の しるし）だけ 足す
//  ・天下一の格闘王 … 白い 道着（魔界の王の子・ゆう助の 道着）に 赤い 中国風の 上着（飛竜しょう天はの達人の 色の 羽織）・金の ベルト・
//                     おさげ（らんま）・赤い はちまき・青い れい気と 竜巻の オーラ
//  ・混とんの大軍師 … 道士の 服（ほう神の大軍師）に 黒い マント（ドラまた）と 金の かたあて・金の かんむり（むらさきの 玉）・
//                     手に 太極の しるし（白と 黒の まるい 玉）・白と 黒と むらさきの オーラ
// かみの 色は その 人の まま（家族の 見た目を のこす）。男の子も 女の子も おなじ 服
//
//   R86B_JOBS     … 職業の id
//   R86B_OUTFIT   … 布の服の ときの 服（hero-outfit.js の JOB_OUTFIT に まぜる。r86bBelt: 金の ベルト・r86bPad: 金の かたあての 大きさ）
//   R86B_BODY     … よろいを かえても のこる からだの とくちょう（JOB_BODY に まぜる。prop 'taiji86': 手に もつ 太極の しるし）
//   R86B_HAT      … 布の服の ときの ぼうし（hero-gear.js の JOB_HAT に まぜる）
//   R86B_OLD_LOOK … 古い 小さな え（chars.js の JOB_LOOK に まぜる）
//   AURA86B       … オーラ（hero-aura.js の AURA に まぜる）
//   outfit86b(O, S, metal) … 金の ベルト・金の かたあて（hero-outfit.js の outfitOf の おわりに 1行。metal は hero-outfit.js の 金ぞくの 色。
//     この ファイルから hero-outfit.js を import しない〈おたがいに import すると、先に 読まれた 方で まだ ない 名前を 使って しまう〉）
//   drawProp86b(cv, P, A, O) … 手に もつ 太極の しるし（hero-r26.js の drawProp26 から。かいたら true）
import { mat, ramp, TH } from './hero-raster.js?v=36007aad9f1d';

export const R86B_JOBS = ['tenkaichi_king', 'chaos_gunshi'];

export const R86B_OUTFIT = {
  tenkaichi_king: { kind: 'gi', main: '#f6f4ee', trim: '#c81e2a', haori: { c: '#c81e2a', hem: 'flame' }, r86bBelt: true },
  chaos_gunshi: { kind: 'robe', main: '#2a2056', trim: '#f2c14e', trimMetal: 'gold', gem: '#c08aff', cape: '#121018', capeLen: 38.8, r86bPad: 1.0 },
};

// からだの とくちょう（よろいを きても のこる）
export const R86B_BODY = {
  tenkaichi_king: { hair: 'braid', iris: '#2a5ab8', aura: 'tenka86' },
  chaos_gunshi: { iris: '#8a4ad8', prop: 'taiji86', aura: 'chaos86' },
};

// ぼうし（布の服の とき）
export const R86B_HAT = {
  tenkaichi_king: { kind: 'headband', c: '#c81e2a' },
  chaos_gunshi: { kind: 'circlet', mk: 'gold', gemc: '#c08aff' },
};

// 古い 小さな え（chars.js。32×42）
export const R86B_OLD_LOOK = {
  tenkaichi_king: { outfit: 'gi', cloth: '#f6f4ee', giTrim: '#c81e2a', hat: 'headband', hatColor: '#c81e2a' },
  chaos_gunshi: { outfit: 'robe', robeMain: '#2a2056', robeTrim: '#f2c14e', cape: '#121018', hat: 'circlet', hatColor: '#f2c14e' },
};

// オーラ（格闘王: 青い れい気に 白い 竜巻の すじ／大軍師: 白・黒・むらさきが まざる）
export const AURA86B = {
  tenka86: { glow: 0.6, len: 3.8, wid: 1.2, up: 1.25, gap: 1.9, flicker: 0.2, cols: [['#ffffff', 215], ['#bfeaff', 186], ['#5ab8ff', 150], ['#2a6ad8', 112]] },
  chaos86: { glow: 0.6, len: 3.5, wid: 1.25, up: 1.1, gap: 2.1, flicker: 0.18, cols: [['#ffffff', 205], ['#d8c8ff', 176], ['#7a3aa8', 146], ['#1a0a24', 118]] },
};

// 金の ベルト（格闘王）・金の かたあて（大軍師）
export function outfit86b(O, S, metal) {
  if (S?.r86bBelt) O.belt = { m: metal('gold'), y: 28.3, sash: true, obi: true };
  if (S?.r86bPad) O.pauldron = { m: metal('gold'), size: S.r86bPad, kind: 'plate', layers: 2 };
}

// ───────────── もちもの（drawProp26 から） ─────────────
const cl = (c, o = {}) => mat({ r: ramp(c, 4, o), th: o.th || TH.cloth });
const pearl = mat({ r: ['#9a9aa8', '#d8d8e4', '#f6f6fc', '#ffffff'], th: TH.gem, spec: 0.92 });
const ink = mat({ r: ['#06060a', '#121218', '#24242e', '#3a3a48'], th: TH.gem, spec: 0.9 });
const gold = mat({ r: ['#5a3210', '#9c5e1a', '#d69a2e', '#f6d26c', '#fff6cc'], th: TH.metal, spec: 0.958, sc: '#ffffff' });
export function drawProp86b(cv, P, A, O) {
  if (O.body?.prop !== 'taiji86') return false;
  const [hx, hy] = A.hand;
  const d = P.side ? P.facing : A.s || 1;
  // 手の 上に うかぶ 太極の しるし（白い 玉の 半分が 黒・金の ふち・まん中に 白と 黒の 小さな 点）
  const cx = hx + d * 0.6, cy = hy - 3.4;
  cv.part({ ol: 'line' });
  cv.ell(cx, cy, 1.75, 1.75, gold, { bulge: 0.9 });
  cv.part({ ol: 'none' });
  cv.ell(cx, cy, 1.45, 1.45, pearl, { bulge: 0.9 });
  cv.poly([[cx, cy - 1.45], [cx + 1.0, cy - 1.05], [cx + 1.45, cy], [cx + 1.0, cy + 1.05], [cx, cy + 1.45], [cx - 0.5, cy + 0.7], [cx, cy], [cx + 0.5, cy - 0.7]], ink, { n: [0, 0] });
  cv.ell(cx, cy - 0.72, 0.28, 0.28, pearl, { n: [0, 0] });
  cv.ell(cx, cy + 0.72, 0.28, 0.28, cl('#121218'), { n: [0, 0] });
  return true;
}
