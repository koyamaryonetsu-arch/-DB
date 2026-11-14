// 第78回: 2.5D で 階段・くさりを 見やすく する（docs/plan-r78-stairs3d.md）
// 第82回: 上に 出して いた ▲▼ の 目じるしと 足もとの 光は やめた（家族の ねがい「階段とかの 矢印は いらない」）
//
// さわれる 物の 見え方の きまり（2.5D）
//   ・行き来する 所（階段・くさり・縄ばしご）… 立体の 形で 見せる（上りは 段・下りは 穴。くさりは 太く 明るい 絵）。
//     階段の 手前の 高い かべは ひくく して かくさない。矢印などの 目じるしは つけない
//   ・宝箱・とびら・しかけ … これまでどおり 立てた 絵（ふちどり つき）で 見せる
//   ・ほかの しるしと まぜない: きらきら（白と 黄色の 十字）・宝の地図（赤むらさきの 光の 柱）
//
// ここは 絵と きまり だけ（three.js は つかわない。テストで しらべる）
import { T } from '../../shared/tiles.js?v=283f9a2c8227';
import { Painter } from './pixel.js?v=283f9a2c8227';

// さわれる 物の 見え方（どの 物を 立体の 形に するか）
export const TOUCH_LOOK = {
  move: { solid: true }, // 階段・くさり・縄ばしご
  chest: { solid: false }, // 宝箱（立てた 絵）
  door: { solid: false }, // とびら（かべ・立てた 絵）
  gimmick: { solid: false }, // しかけ（立てた 絵）
};

// くさりの ふちどりの 色
const CHAIN_LINE = '#1b1330';
// くさりの かくれた 所の 色（じぶんの シルエットと おなじ しくみ）・たての のばし（まっすぐ たてるので 見た目は 0.8 ばい）
export const CHAIN_GHOST = '#bfefff';
export const CHAIN_STRETCH = 0.8;

// 階段の 手前（南）の 高い かべを ひくく する（カメラは 南から 見おろす。かべに かくれない ように）
//   すぐ 手前は ひくい ふち、2つ 手前は こしの 高さ。くさり・縄ばしごは 立てた 絵 なので しない
export const CUT_H = [0.3, 0.85];
export function stairCuts(w, h, idAt, blockH) {
  const cuts = new Map();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const id = idAt(x, y);
      if (id !== T.STAIRS_UP && id !== T.STAIRS_DOWN) continue;
      for (let k = 1; k <= CUT_H.length; k++) {
        const yy = y + k;
        if (yy >= h) break;
        const bh = blockH(x, yy);
        if (bh === null || bh === undefined) break; // かべで ない（ゆか・水）なら その 先は 見える
        const lim = CUT_H[k - 1];
        if (bh > lim) {
          const key = yy * w + x;
          cuts.set(key, Math.min(cuts.get(key) ?? Infinity, lim));
        }
      }
    }
  }
  return cuts;
}

// 足もとが 手前の 物に かくれて いるか（テストで stairCuts を たしかめる ために のこす。カメラは 55度 上から。k マス 手前の 高さ が 1.43×(k−0.5) より 高いと かくれる）
export function hiddenBehind(topAt, base = 0) {
  for (let k = 1; k <= 3; k++) {
    const hh = topAt(k);
    if (hh !== null && hh !== undefined && hh - base > 1.43 * (k - 0.5)) return true;
  }
  return false;
}

// 2.5D の いかりの くさり（太く・明るい 鉄の わ・こい ふちどり・ところどころ 光る。足もとに こけ）
let chainC = null;
export function chainCanvas3d() {
  if (chainC) return chainC;
  const W = 14, H = 46;
  const p = new Painter(W, H);
  const D = '#55607a', B = '#b4bdd2', L = '#eef2fa', HL = '#ffffff';
  for (let y = 0, i = 0; y < H - 5; y += 4, i++) {
    if (i % 2) {
      // よこむきの わ（まるく 見える）
      p.ellipse(7, y + 2, 3.6, 2.2, B);
      p.ellipse(7, y + 2, 1.6, 0.8, D);
      p.set(5, y + 1, L); p.set(6, y + 1, L);
    } else {
      // たてむきの わ（ほそく 見える）
      p.rect(6, y, 3, 5, B);
      p.vline(6, y, y + 4, L);
      p.vline(8, y + 1, y + 3, D);
    }
    if (i % 4 === 1) p.set(5, y + 1, HL);
  }
  p.ellipse(7, H - 3, 6, 2.2, '#3a5a2a');
  p.ellipse(7, H - 3, 4, 1.4, '#5a8a3a');
  p.rect(6, H - 6, 3, 3, B);
  p.outline(CHAIN_LINE);
  chainC = p.toCanvas();
  return chainC;
}
