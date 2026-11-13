// 第78回: 2.5D で 階段・くさりを 見やすく する（docs/plan-r78-stairs3d.md）
//
// さわれる 物の 見え方の きまり（2.5D）
//   ・行き来する 所（階段・くさり・縄ばしご）… 立体の 形 ＋ 上に ▲（上り・のぼる）／▼（下り）の 目じるし。
//     目じるしは 明るい 水色に こい ふちどり。ゆっくり 上下に ゆれる。足もとに うすい 光。
//     くらい 階の やみ・手前の かべの 上にも かく（かべの 向こうの ときは うすく）
//   ・宝箱・とびら・しかけ … 目じるしは つけない（ふえすぎて 階段が 目立たなく ならない ように）。
//     これまでどおり 立てた 絵（ふちどり つき）で 見せる
//   ・ほかの しるしと まぜない: きらきら（白と 黄色の 十字）・宝の地図（赤むらさきの 光の 柱）
//
// ここは 絵と きまり だけ（three.js は つかわない。テストで しらべる）
import { T } from '../../shared/tiles.js?v=b671a0f110f0';
import { Painter } from './pixel.js?v=b671a0f110f0';

// さわれる 物の 見え方（どの 物に 何を つけるか）
export const TOUCH_LOOK = {
  move: { mark: true, solid: true, glow: true }, // 階段・くさり・縄ばしご
  chest: { mark: false, solid: false, glow: false }, // 宝箱（立てた 絵）
  door: { mark: false, solid: false, glow: false }, // とびら（かべ・立てた 絵）
  gimmick: { mark: false, solid: false, glow: false }, // しかけ（立てた 絵）
};

// 目じるしの 色（明るい 水色・ふち・光る ところ）
export const MARK_COLOR = { body: '#7ee8ff', light: '#e8fbff', dark: '#2a9ac0', line: '#1b1330', glow: '126, 232, 255' };

// タイル → 目じるし（'up' ▲ / 'down' ▼ / null）
//   under … フラグで かわる 所の、しまっている ときの タイル（たて穴に かけた 縄ばしごは 下りる）
export function markKind(id, under = null) {
  if (id === T.STAIRS_UP) return 'up';
  if (id === T.STAIRS_DOWN) return 'down';
  if (id === T.C8C_CHAIN) return 'up'; // ようさいへ のぼる いかりの くさり
  if (id === T.ROPE_LADDER) return under === T.RUIN_SHAFT ? 'down' : 'up';
  return null;
}

// 目じるしの 高さ（足もと からの マス。くさりは 上まで のびて いるので その 上）
export const MARK_LIFT = { stairs: 1.15, climb: 2.75 };
// くさりの かくれた 所の 色（じぶんの シルエットと おなじ しくみ）・たての のばし（まっすぐ たてるので 見た目は 0.8 ばい）
export const CHAIN_GHOST = '#bfefff';
export const CHAIN_STRETCH = 0.8;
export const isClimbTile = (id) => id === T.C8C_CHAIN || id === T.ROPE_LADDER;

// マップ ぜんたいの 目じるし。となりあう おなじ 階段（2マス はば）は 1つに まとめる
//   idAt(x, y) … いまの タイル（フラグで かわる とびらも）/ underAt(x, y) … しまっている ときの タイル（なければ null）
//   → [{ x（まん中）, y（まん中）, tx, ty, w（マスの 数）, kind, climb }]
export function collectMarks(w, h, idAt, underAt = () => null) {
  const out = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const id = idAt(x, y);
      const kind = markKind(id, underAt(x, y));
      if (!kind) continue;
      const prev = out[out.length - 1];
      if (prev && prev.ty === y && prev.tx + prev.w === x && prev.kind === kind && prev.id === id) {
        prev.w++;
        prev.x = prev.tx + prev.w / 2;
        continue;
      }
      out.push({ x: x + 0.5, y: y + 0.5, tx: x, ty: y, w: 1, kind, id, climb: isClimbTile(id) });
    }
  }
  return out;
}

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

// 足もとが 手前の 物に かくれて いるか（カメラは 55度 上から。k マス 手前の 高さ が 1.43×(k−0.5) より 高いと かくれる）
export function hiddenBehind(topAt, base = 0) {
  for (let k = 1; k <= 3; k++) {
    const hh = topAt(k);
    if (hh !== null && hh !== undefined && hh - base > 1.43 * (k - 0.5)) return true;
  }
  return false;
}

// ゆれ（マス。1.6びょうで 1かい 上下。場所で すこし ずらす）
export function markBob(t, x = 0, y = 0) {
  return Math.sin(t / 255 + x * 0.7 + y * 1.3) * 0.07;
}

// 目じるしを 出すか（イベント中・メニュー・見る 場所が かわって いる 時・その 上に 立って いる 時は 出さない）
export function marksShown({ busy = false, menu = false, look = false, state = 'field' } = {}) {
  return state === 'field' && !busy && !menu && !look;
}
export function nearMark(m, px, py) {
  const dx = Math.max(0, Math.abs(px - m.x) - (m.w - 1) / 2);
  return Math.hypot(dx, py - m.y) < 0.75;
}

// ▲／▼ を ドットで かく（ctx は うえに かさねる 2D の がめん。cx, cy … 三角の まん中・s … 大きさ（ドット）・a … こさ）
export function drawMark(ctx, cx, cy, s, kind, a = 1) {
  const n = Math.max(3, Math.round(s)); // 三角の 高さ（行）
  const px = Math.max(1, Math.round(n / 6)); // ふちの はば
  const x0 = Math.round(cx), y0 = Math.round(cy - n / 2);
  // 上から i 行め の 半分の はば（▲は 下へ ひろがる・▼は 上が ひろい）
  const row = (i) => Math.round((kind === 'down' ? n - 1 - i : i) * 0.75);
  ctx.save();
  ctx.globalAlpha = a;
  // ふち（ひとまわり 大きい）
  ctx.fillStyle = MARK_COLOR.line;
  for (let i = -px; i < n + px; i++) {
    const half = row(Math.max(0, Math.min(n - 1, i))) + px;
    ctx.fillRect(x0 - half, y0 + i, half * 2 + 1, 1);
  }
  // 中
  for (let i = 0; i < n; i++) {
    const half = row(i);
    ctx.fillStyle = MARK_COLOR.body;
    ctx.fillRect(x0 - half, y0 + i, half * 2 + 1, 1);
    // 左がわは 明るく・右の はしは こく
    ctx.fillStyle = MARK_COLOR.light;
    ctx.fillRect(x0 - half, y0 + i, Math.max(1, Math.round(half * 0.5)), 1);
    ctx.fillStyle = MARK_COLOR.dark;
    if (half > 1) ctx.fillRect(x0 + half, y0 + i, 1, 1);
  }
  ctx.restore();
}

// 足もとの うすい 光（x, y … 足もと・r … 半径・a … こさ）
export function drawMarkGlow(ctx, x, y, r, a) {
  const g = ctx.createRadialGradient(x, y, r * 0.15, x, y, r);
  g.addColorStop(0, `rgba(${MARK_COLOR.glow}, ${a})`);
  g.addColorStop(1, `rgba(${MARK_COLOR.glow}, 0)`);
  ctx.save();
  // ゆかに そった だ円（よこ 1・たて 0.6）
  ctx.translate(x, y);
  ctx.scale(1, 0.6);
  ctx.translate(-x, -y);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
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
  p.outline(MARK_COLOR.line);
  chainC = p.toCanvas();
  return chainC;
}
