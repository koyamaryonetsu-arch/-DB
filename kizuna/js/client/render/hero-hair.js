// かみがた（まえ・うしろ・よこ）
// ざひょうは あたまの まんなか から（u: よこ。よこむき では かおの ほうが ＋、v: たて。したが ＋）
// かく ところ:
//   behind(…) … からだより うしろ（まえむきの ながい かみ・たれる たば）
//   front(…)  … かおの うえ（あたまの かみ・前がみ・かおの よこの かみ）
//   back(…)   … うしろむき（からだの うえに かぶさる）
//   side(…), sideBehind(…) … よこむき
// hat: ぼうし・かぶとの とき（'top': あたまの うえの ボリュームを かかない / 'band': はちまき など）
import { HeroCanvas } from './hero-raster.js?v=3aa373e94169';

// ───────────── べんりな かんすう ─────────────
const rad = (d) => (d * Math.PI) / 180;
// だえんの こ（a0 → a1 ど。0: みぎ、-90: うえ、180: ひだり）
function arc(cx, cy, rx, ry, a0, a1, n = 12, wob = null) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = rad(a0 + ((a1 - a0) * i) / n);
    const w = wob ? wob(a, i) : 1;
    out.push([cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w]);
  }
  return out;
}
// みぎ はんぶん（うえ → した）を かがみに うつして とじた かたちに（ひだり した → うえ → みぎ した）
function sym(right) {
  const left = right.map(([u, v]) => [-u, v]).reverse();
  return [...left, ...right];
}
// あたまの ざひょう → がめん
function toScreen(H, pts) {
  return pts.map(([u, v]) => [H.X(u), H.y + v]);
}
function fill(cv, H, pts, m, o = {}) {
  cv.poly(toScreen(H, pts), m, { n: 'sphere', sph: [H.X(o.su ?? -1.2), H.y + (o.sv ?? -2.4), (H.rx + 1.2) * (o.sr ?? 1.12), (H.ry + 1.4) * (o.sr ?? 1.12)], cx: o.curv ?? 0.95, bias: o.bias || 0, nyMax: o.nyMax ?? 0.5 });
}
// たば（u,v の 3てんの ベジエ）
function lock(cv, H, p0, p1, p2, r0, r1, m, o = {}) {
  const pts = HeroCanvas.bez(p0, p1, p2, o.seg || 8);
  const rs = pts.map((_, i) => r0 + (r1 - r0) * Math.pow(i / (pts.length - 1), o.ease || 1));
  cv.stroke(toScreen(H, pts), rs, m, { sph: [H.X(-1.2), H.y - 2.4, (H.rx + 1.2) * 1.15, (H.ry + 1.4) * 1.15], lw: o.lw ?? 0.5, sw: o.sw ?? 0.75, bias: o.bias || 0 });
}
// かみの すじ（くらい せん）
function strand(cv, H, pts, parts, depth = -0.42, w = 0.3) {
  const p = pts.length === 3 ? HeroCanvas.bez(pts[0], pts[1], pts[2], 6) : pts;
  cv.crease(toScreen(H, p), Math.max(w, 0.5 / cv.k), depth, { parts });
}
// つや（てんしの わ）
function shine(cv, H, a0, a1, rv, parts, amt = 0.42, cv0 = -0.6, w = 0.42) {
  const pts = arc(0, cv0, H.rx * rv, H.ry * rv, a0, a1, 10);
  cv.crease(toScreen(H, pts), w, amt, { parts });
}

// ───────────── かみがた ─────────────
// どの かみがたも まえ・うしろ・よこ を もつ。parts: ここで かいた パーツ（すじ・つや の ため）
function frontCap(cv, H, m, pts, o = {}) {
  const id = cv.part({ ol: 'line' });
  fill(cv, H, pts, m, o);
  return id;
}

// よく つかう 前がみ（みぎ → ひだり の ギザギザ）
const FRINGE = {
  neat: [[5.9, -1.8], [5.0, -0.4], [3.9, -2.6], [2.6, -0.1], [1.3, -2.9], [-0.1, -0.3], [-1.5, -2.8], [-2.9, 0.0], [-4.1, -2.5], [-5.2, -0.4], [-5.9, -1.8]],
  spiky: [[5.9, -1.7], [5.4, 0.6], [3.9, -2.5], [2.8, 0.8], [1.3, -2.7], [-0.1, 0.4], [-1.5, -2.7], [-2.9, 0.8], [-4.0, -2.5], [-5.3, 0.6], [-5.9, -1.7]],
  soft: [[6.0, -1.5], [5.2, 0.4], [4.1, -2.1], [2.6, 0.2], [1.2, -2.4], [-0.2, 0.1], [-1.6, -2.3], [-3.0, 0.3], [-4.2, -2.1], [-5.3, 0.3], [-6.0, -1.5]],
  blunt: [[6.1, -1.5], [6.0, -0.9], [4.0, -0.9], [3.6, -1.2], [2.0, -0.9], [1.5, -1.2], [-0.2, -0.9], [-0.6, -1.2], [-2.3, -0.9], [-2.7, -1.2], [-4.4, -0.9], [-6.0, -0.9], [-6.1, -1.5]],
  part: [[6.0, -1.7], [5.6, 0.1], [4.6, -1.9], [3.8, -0.1], [2.6, -2.7], [1.6, -4.1], [0.4, -2.5], [-1.0, -0.1], [-2.2, -2.1], [-3.5, 0.1], [-4.6, -1.7], [-5.5, 0.1], [-6.0, -1.7]],
  sweep: [[6.0, -2.1], [5.0, -3.1], [3.8, -1.7], [2.6, -2.7], [1.0, -0.5], [-0.2, -1.7], [-2.0, 0.9], [-3.0, -0.3], [-4.6, 2.1], [-5.6, 0.5], [-6.2, 1.5], [-6.4, -1.1]],
  short: [[5.8, -2.4], [4.8, -1.8], [3.6, -2.8], [2.4, -1.9], [1.1, -3.0], [-0.2, -2.0], [-1.5, -3.0], [-2.8, -1.9], [-4.0, -2.8], [-5.0, -1.8], [-5.8, -2.4]],
};

// ふつうの あたま（まえ）。side: よこの かみが どこまで さがるか（v）
function domeFront(R = 8.3, top = -9.0, side = 2.8, spikesOut = null) {
  // みぎ はんぶん: うえ → した
  const right = [[0, top], [3.0, top + 0.2], [5.6, top + 1.0], [7.4, top + 2.4], [R - 0.1, top + 4.5], [R, top + 7.0], [R - 0.3, top + 9.4], [R - 1.1, side]];
  return right;
}

function closeFront(rightOuter, fringe, inner = [[6.4, 0.6]]) {
  // ひだり した → うえ → みぎ した → みぎの うちがわ → 前がみ（みぎ → ひだり）→ ひだりの うちがわ
  const left = rightOuter.map(([u, v]) => [-u, v]).reverse();
  const innerL = inner.map(([u, v]) => [-u, v]).reverse();
  return [...left, ...rightOuter.slice(1), ...inner, ...fringe, ...innerL];
}

const STYLES = {};

// ── ショート ──
STYLES.short = {
  front(cv, H, m, o) {
    const outer = domeFront(8.3, -9.0, 2.8);
    const id = frontCap(cv, H, m, closeFront(outer, o.hat === 'top' ? FRINGE.short : FRINGE.neat));
    for (const [a, b] of [[[-0.6, -6.6], [-1.5, -2.3]], [[2.0, -6.4], [1.3, -2.4]], [[-3.4, -5.9], [-4.1, -2.0]], [[4.4, -5.6], [3.9, -2.1]]]) strand(cv, H, [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 0.3], b], [id]);
    strand(cv, H, [[-6.6, -3.2], [-7.0, -0.4], [-6.8, 2.0]], [id], -0.3);
    strand(cv, H, [[6.6, -3.2], [7.0, -0.4], [6.8, 2.0]], [id], -0.3);
    if (o.hat !== 'top') shine(cv, H, 200, 300, 1.0, [id]);
  },
  back(cv, H, m, o) {
    const right = [[0, -9.0], [3.0, -8.8], [5.6, -8.0], [7.4, -6.6], [8.2, -4.5], [8.3, -2.0], [8.0, 1.0], [7.2, 3.6], [5.6, 5.4], [3.0, 5.8], [1.4, 5.0], [0, 5.9]];
    const id = frontCap(cv, H, m, sym(right));
    for (const u of [-4.2, -1.4, 1.4, 4.2]) strand(cv, H, [[u * 0.4, -6.0], [u * 0.9, -1.0], [u, 4.8]], [id]);
    if (o.hat !== 'top') shine(cv, H, 205, 300, 0.98, [id]);
  },
  side(cv, H, m, o) {
    sideDome(cv, H, m, o, { nape: 5.2, fringe: o.hat === 'top' ? 'short' : 'neat' });
  },
};

// よこむきの あたまの かみ（まえ = ＋u）
// nape: うしろの すその たかさ  fringe: 前がみの かたち  extra: さらに たす（spikes など）
const SIDE_FRINGE = {
  neat: [[6.2, -2.7], [7.6, -0.1], [6.4, -1.3], [5.6, 0.5], [4.6, -1.5], [3.9, 0.1]],
  spiky: [[6.2, -2.5], [8.4, 0.7], [6.6, -1.1], [6.4, 1.1], [4.8, -1.1], [4.2, 0.7]],
  soft: [[6.2, -2.5], [7.6, 0.5], [6.0, -1.1], [5.4, 0.7], [4.2, -0.9], [3.8, 0.5]],
  blunt: [[6.4, -2.3], [7.7, -0.9], [7.4, -0.8], [4.0, -0.9], [3.8, -0.3]],
  short: [[6.4, -3.6], [7.6, -2.4], [6.6, -2.6], [5.8, -2.0], [4.6, -2.4], [3.9, -1.8]],
  sweep: [[6.2, -2.7], [8.0, 0.7], [6.8, 0.1], [6.6, 1.9], [5.0, 0.1], [4.0, 0.9]],
  none: [[6.0, -4.6], [5.0, -4.4], [3.9, -3.4]],
};
function sideDome(cv, H, m, o, { nape = 5.2, fringe = 'neat', R = 8.2, top = -9.0, back = null, temple = 2.4 } = {}) {
  // まえ（おでこ）→ うえ → うしろ → うなじ → みみの うしろ → みみの まえ（もみあげ）→ 前がみ
  const pts = [];
  const fr = SIDE_FRINGE[fringe] || SIDE_FRINGE.neat;
  pts.push(...fr.slice(0, 1));
  for (const p of arc(-0.6, -0.4, R, R + 0.3, -48, -180, 14)) pts.push(p);
  if (back) pts.push(...back);
  else pts.push([-R - 0.2, 1.6], [-R + 0.4, nape - 1.2], [-R + 1.6, nape]);
  pts.push([-4.6, nape - 0.6], [-3.0, 1.0], [-2.4, -0.8], [-0.6, -0.2], [0.2, temple], [1.6, 2.2], [2.0, -0.6]);
  pts.push(...fr.slice(1).reverse());
  const id = frontCap(cv, H, m, pts, { su: 0.6 });
  strand(cv, H, [[2.4, -6.6], [0.6, -3.0], [-0.4, 1.2]], [id], -0.34);
  strand(cv, H, [[-1.6, -7.4], [-4.0, -3.4], [-5.6, 2.6]], [id], -0.38);
  strand(cv, H, [[4.4, -5.6], [5.4, -3.0], [5.6, -1.0]], [id], -0.3);
  if (o.hat !== 'top') shine(cv, H, 200, 285, 1.0, [id], 0.42, -0.6);
  return id;
}

// ── ツンツン（勇者らしい とんがり） ──
const SPIKES_F = [[-7.2, 2.8], [-8.6, 0.8], [-10.4, -0.8], [-8.7, -2.6], [-10.9, -4.8], [-8.5, -5.9], [-9.6, -9.0], [-6.3, -8.5], [-5.7, -11.6], [-3.4, -9.5], [-1.6, -12.4], [0.4, -9.8], [2.4, -12.2], [3.6, -9.5], [5.8, -11.2], [6.6, -8.3], [9.6, -8.6], [8.4, -5.7], [10.7, -4.3], [8.6, -2.4], [10.2, -0.5], [8.4, 0.9], [7.2, 2.8]];
STYLES.spiky = {
  front(cv, H, m, o) {
    let pts;
    if (o.hat === 'top') pts = closeFront(domeFront(8.3, -9.0, 2.8), FRINGE.spiky);
    else pts = [...SPIKES_F, [6.2, 0.6], ...FRINGE.spiky, [-6.2, 0.6]];
    const id = frontCap(cv, H, m, pts);
    for (const [a, c, b] of [[[-1.2, -8.8], [-1.2, -5.0], [-1.5, -2.2]], [[1.8, -8.6], [1.6, -5.0], [1.3, -2.2]], [[-4.6, -8.2], [-4.4, -4.6], [-4.0, -2.0]], [[4.8, -8.0], [4.5, -4.6], [3.9, -2.0]], [[-7.6, -6.0], [-7.6, -3.6], [-7.0, -1.2]], [[7.6, -6.0], [7.6, -3.6], [7.0, -1.2]]]) strand(cv, H, [a, c, b], [id]);
    if (o.hat !== 'top') shine(cv, H, 205, 295, 0.98, [id]);
  },
  back(cv, H, m, o) {
    const pts = o.hat === 'top'
      ? sym([[0, -9.0], [3.0, -8.8], [5.6, -8.0], [7.4, -6.6], [8.2, -4.5], [8.3, -2.0], [8.0, 1.0], [7.2, 3.6], [5.2, 5.6], [2.6, 4.6], [0, 6.2]])
      : [...SPIKES_F.slice(0, -1).map(([u, v]) => [u, v]), [8.6, 3.0], [6.8, 4.4], [5.6, 7.0], [3.6, 5.2], [1.6, 7.4], [-0.4, 5.4], [-2.4, 7.2], [-3.8, 5.0], [-5.8, 6.8], [-6.8, 4.2], [-8.6, 3.0]];
    const id = frontCap(cv, H, m, pts);
    for (const u of [-4.8, -1.6, 1.6, 4.8]) strand(cv, H, [[u * 0.5, -7.0], [u * 0.9, -1.0], [u, 5.0]], [id]);
    if (o.hat !== 'top') shine(cv, H, 205, 300, 0.98, [id]);
  },
  side(cv, H, m, o) {
    if (o.hat === 'top') return sideDome(cv, H, m, o, { fringe: 'spiky', nape: 5.6 });
    const back = [[-9.4, -6.4], [-12.0, -5.6], [-9.0, -3.4], [-11.4, -1.4], [-8.6, 0.6], [-10.2, 3.2], [-7.4, 3.6], [-7.2, 6.4]];
    const id = sideDome(cv, H, m, o, { fringe: 'spiky', nape: 6.4, back });
    // うえの とげ
    cv.part({ ol: 'soft' });
    for (const [a, c, b, w] of [[[1.8, -8.0], [3.4, -10.0], [5.8, -11.0], 2.0], [[-1.4, -8.6], [-1.0, -10.6], [0.8, -11.4], 2.1], [[-4.6, -7.6], [-6.0, -9.8], [-6.8, -10.8], 1.9], [[-7.4, -5.8], [-9.6, -7.4], [-11.6, -8.0], 1.8]]) lock(cv, H, a, c, b, w, 0.25, m, { ease: 1.3 });
    return id;
  },
};

// ── ロング ──
STYLES.long = {
  behind(cv, H, m) {
    cv.part({ ol: 'line' });
    fill(cv, H, sym([[0, -4], [7.6, -4], [8.8, 2.0], [9.4, 8.0], [9.0, 13.2], [7.4, 14.6], [4.4, 14.2], [2.0, 15.0], [0, 14.4]]), m, { bias: -0.04 });
  },
  front(cv, H, m, o) {
    const outer = [[0, -9.0], [3.0, -8.8], [5.6, -8.0], [7.4, -6.6], [8.3, -4.5], [8.6, -1.0], [8.8, 3.0], [9.1, 7.4], [8.6, 11.0], [7.6, 12.8]];
    const inner = [[7.0, 9.6], [6.9, 6.0], [6.6, 2.4], [6.2, -0.4]];
    const id = frontCap(cv, H, m, closeFront(outer, o.hat === 'top' ? FRINGE.short : FRINGE.soft, inner));
    for (const s of [-1, 1]) {
      strand(cv, H, [[s * 7.4, -2.0], [s * 8.2, 4.0], [s * 7.9, 11.0]], [id]);
      strand(cv, H, [[s * 6.7, 1.0], [s * 7.4, 6.0], [s * 7.2, 10.0]], [id], -0.28);
    }
    for (const [a, b] of [[[-0.6, -6.6], [-1.6, -1.8]], [[2.0, -6.4], [1.2, -1.9]], [[-3.4, -5.9], [-4.2, -1.6]], [[4.4, -5.6], [4.1, -1.6]]]) strand(cv, H, [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 0.3], b], [id]);
    if (o.hat !== 'top') shine(cv, H, 200, 300, 1.0, [id]);
  },
  back(cv, H, m, o) {
    const id = frontCap(cv, H, m, sym([[0, -9.0], [3.0, -8.8], [5.6, -8.0], [7.4, -6.6], [8.3, -4.5], [8.7, -1.0], [9.1, 4.0], [9.4, 9.0], [8.8, 13.0], [7.0, 14.8], [4.4, 14.0], [2.2, 15.2], [0, 14.6]]));
    for (const u of [-6.0, -3.4, -1.0, 1.4, 3.8, 6.2]) strand(cv, H, [[u * 0.35, -6.6], [u * 0.9, 2.0], [u, 13.6]], [id]);
    if (o.hat !== 'top') shine(cv, H, 205, 300, 0.98, [id]);
  },
  sideBehind(cv, H, m) {
    cv.part({ ol: 'line' });
    fill(cv, H, [[-2.0, -6.0], [-6.6, -5.0], [-8.8, 0.0], [-9.4, 6.0], [-9.0, 11.0], [-7.6, 14.4], [-5.0, 15.0], [-3.6, 12.0], [-2.8, 6.0], [-1.6, 1.0]], m, { su: -3, bias: -0.03 });
  },
  side(cv, H, m, o) {
    const back = [[-8.6, 1.6], [-9.0, 6.0], [-8.4, 10.4], [-7.0, 13.6], [-5.2, 14.4], [-4.6, 11.0], [-4.2, 6.0]];
    const id = sideDome(cv, H, m, o, { fringe: o.hat === 'top' ? 'short' : 'soft', back });
    strand(cv, H, [[-3.2, -4.0], [-6.2, 3.0], [-6.4, 12.6]], [id]);
    strand(cv, H, [[-5.4, -2.0], [-7.6, 4.0], [-7.6, 12.0]], [id], -0.3);
    return id;
  },
};

// ── ポニーテール ──
function ponyTail(cv, H, m, view) {
  cv.part({ ol: 'line' });
  if (view === 'back') {
    fill(cv, H, [[-1.6, -4.2], [1.6, -4.2], [2.6, 0.0], [2.8, 5.0], [2.0, 10.0], [0.6, 13.4], [-0.6, 11.4], [-1.6, 13.0], [-2.6, 9.0], [-2.8, 4.0], [-2.6, 0.0]], m, { su: -1.0, sv: 3, sr: 1.0 });
  } else if (view === 'side') {
    fill(cv, H, [[-6.8, -5.0], [-8.4, -6.4], [-10.4, -5.6], [-11.6, -2.6], [-11.8, 2.0], [-11.0, 6.4], [-9.4, 10.2], [-9.0, 7.6], [-8.4, 10.6], [-8.0, 6.0], [-8.6, 1.0], [-8.4, -2.6], [-7.0, -3.4]], m, { su: -9, sv: 0, sr: 0.8 });
  } else {
    // まえむき: あたまの うしろから みぎに すこし 見える
    fill(cv, H, [[5.6, -6.4], [8.6, -7.2], [10.4, -5.4], [10.8, -1.6], [10.2, 3.0], [9.2, 6.8], [8.2, 3.6], [7.6, -0.6]], m, { su: 8, sv: -2, sr: 0.7, bias: -0.1 });
  }
}
function tie(cv, H, u, v, r, color, view) {
  cv.part({ ol: 'line' });
  cv.ell(H.X(u), H.y + v, r, r * 0.8, color, { bulge: 0.8 });
}
STYLES.pony = {
  behind(cv, H, m) { ponyTail(cv, H, m, 'front'); },
  front(cv, H, m, o) {
    const id = frontCap(cv, H, m, closeFront(domeFront(8.2, -9.0, 2.4), o.hat === 'top' ? FRINGE.short : FRINGE.part));
    for (const [a, b] of [[[0.4, -7.0], [1.6, -3.6]], [[-2.6, -6.6], [-2.2, -1.6]], [[3.2, -6.4], [4.6, -1.4]], [[-5.2, -5.6], [-4.6, -1.2]]]) strand(cv, H, [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 0.3], b], [id]);
    if (o.hat !== 'top') shine(cv, H, 200, 300, 1.0, [id]);
  },
  back(cv, H, m, o) {
    const id = frontCap(cv, H, m, sym([[0, -9.0], [3.0, -8.8], [5.6, -8.0], [7.4, -6.6], [8.2, -4.5], [8.2, -2.0], [7.6, 1.4], [6.0, 4.0], [3.0, 5.0], [0, 5.4]]));
    for (const s of [-1, 1]) strand(cv, H, [[s * 6.8, 2.0], [s * 4.0, -1.0], [s * 1.6, -3.6]], [id], -0.34);
    strand(cv, H, [[0, -8.6], [0, -6.0], [0, -4.4]], [id], -0.3);
    ponyTail(cv, H, m, 'back');
    tie(cv, H, 0, -4.4, 1.5, o.tie, 'back');
  },
  side(cv, H, m, o) {
    ponyTail(cv, H, m, 'side');
    const id = sideDome(cv, H, m, o, { fringe: o.hat === 'top' ? 'short' : 'neat', nape: 4.6 });
    tie(cv, H, -7.4, -4.4, 1.4, o.tie, 'side');
    return id;
  },
};

// ── ツインテール ──
function twinTail(cv, H, m, s, len = 12.5) {
  cv.part({ ol: 'line' });
  const pts = [[s * 6.6, -5.4], [s * 9.2, -5.0], [s * 10.8, -1.6], [s * 11.2, 3.4], [s * 10.6, 8.0], [s * 9.4, len], [s * 8.8, len - 3.2], [s * 8.0, len - 0.8], [s * 7.8, 5.0], [s * 8.2, 0.4], [s * 7.6, -2.6]];
  fill(cv, H, s > 0 ? pts : pts.reverse(), m, { su: s * 9.4, sv: 1, sr: 0.75 });
}
STYLES.twin = {
  behind(cv, H, m) { twinTail(cv, H, m, -1); twinTail(cv, H, m, 1); },
  front(cv, H, m, o) {
    const id = frontCap(cv, H, m, closeFront(domeFront(8.2, -9.0, 2.6), o.hat === 'top' ? FRINGE.short : FRINGE.soft));
    for (const [a, b] of [[[-0.6, -6.6], [-1.6, -1.8]], [[2.0, -6.4], [1.2, -1.9]], [[-3.4, -5.9], [-4.2, -1.6]], [[4.4, -5.6], [4.1, -1.6]]]) strand(cv, H, [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 0.3], b], [id]);
    if (o.hat !== 'top') shine(cv, H, 200, 300, 1.0, [id]);
    for (const s of [-1, 1]) tie(cv, H, s * 7.6, -5.0, 1.45, o.tie);
  },
  back(cv, H, m, o) {
    for (const s of [-1, 1]) twinTail(cv, H, m, s);
    const id = frontCap(cv, H, m, sym([[0, -9.0], [3.0, -8.8], [5.6, -8.0], [7.4, -6.6], [8.2, -4.5], [8.2, -2.0], [7.6, 1.4], [6.0, 4.2], [3.0, 5.2], [0, 5.6]]));
    strand(cv, H, [[0, -9.0], [0, -2.0], [0, 5.4]], [id], -0.5);
    for (const s of [-1, 1]) strand(cv, H, [[s * 2.2, -7.0], [s * 5.0, -5.6], [s * 7.0, -5.0]], [id], -0.3);
    for (const s of [-1, 1]) tie(cv, H, s * 7.6, -5.0, 1.45, o.tie);
  },
  sideBehind(cv, H, m) {
    cv.part({ ol: 'line' });
    fill(cv, H, [[-3.6, -6.4], [-5.6, -7.2], [-7.4, -4.0], [-8.4, 1.0], [-8.2, 6.0], [-7.2, 10.4], [-6.6, 7.6], [-5.6, 10.0], [-5.2, 4.0], [-4.6, -1.0]], m, { su: -6, sr: 0.8, bias: -0.15 });
  },
  side(cv, H, m, o) {
    const id = sideDome(cv, H, m, o, { fringe: o.hat === 'top' ? 'short' : 'soft', nape: 4.8 });
    cv.part({ ol: 'line' });
    fill(cv, H, [[-4.4, -5.6], [-6.4, -6.6], [-8.6, -3.6], [-9.6, 1.6], [-9.4, 6.6], [-8.2, 11.6], [-7.6, 8.4], [-6.6, 11.0], [-6.2, 4.6], [-5.4, -0.6]], m, { su: -7.4, sr: 0.8 });
    tie(cv, H, -5.4, -5.6, 1.4, o.tie);
    return id;
  },
};

// ── ボブ ──
STYLES.bob = {
  front(cv, H, m, o) {
    const outer = [[0, -9.0], [3.0, -8.8], [5.6, -8.0], [7.6, -6.4], [8.6, -4.0], [9.0, -0.6], [9.1, 2.6], [8.8, 5.0], [7.8, 6.2], [6.6, 5.6]];
    const inner = [[6.4, 3.4], [6.3, 0.6], [6.0, -0.8]];
    const id = frontCap(cv, H, m, closeFront(outer, o.hat === 'top' ? FRINGE.short : FRINGE.blunt, inner));
    for (const s of [-1, 1]) strand(cv, H, [[s * 7.2, -3.0], [s * 7.8, 1.6], [s * 7.4, 5.4]], [id]);
    for (const u of [-3.0, 0.4, 3.4]) strand(cv, H, [[u * 0.6, -7.0], [u * 0.9, -3.4], [u, -0.8]], [id], -0.3);
    if (o.hat !== 'top') shine(cv, H, 198, 300, 1.02, [id]);
  },
  back(cv, H, m, o) {
    const id = frontCap(cv, H, m, sym([[0, -9.0], [3.0, -8.8], [5.6, -8.0], [7.6, -6.4], [8.6, -4.0], [9.0, -0.6], [9.1, 2.6], [8.8, 5.0], [7.6, 6.4], [4.6, 6.8], [2.0, 6.4], [0, 6.8]]));
    for (const u of [-5.0, -2.4, 0, 2.4, 5.0]) strand(cv, H, [[u * 0.4, -6.4], [u * 0.9, 0.0], [u, 6.0]], [id], -0.36);
    if (o.hat !== 'top') shine(cv, H, 205, 300, 1.0, [id]);
  },
  side(cv, H, m, o) {
    const back = [[-8.8, 0.6], [-9.0, 3.6], [-8.4, 5.8], [-6.6, 6.8], [-4.4, 6.6], [-2.2, 6.2]];
    const id = sideDome(cv, H, m, o, { fringe: o.hat === 'top' ? 'short' : 'blunt', back, temple: 5.2 });
    strand(cv, H, [[-3.0, -3.6], [-4.4, 1.6], [-4.8, 6.0]], [id], -0.34);
    return id;
  },
};

// ── おだんご ──
function bunBall(cv, H, m, u, v, r) {
  cv.part({ ol: 'line' });
  cv.ell(H.X(u), H.y + v, r, r * 0.92, m, { bulge: 0.85 });
  const id = cv.cur;
  strand(cv, H, [[u - r * 0.6, v - r * 0.3], [u, v - r * 0.05], [u + r * 0.5, v + r * 0.5]], [id], -0.36, 0.26);
  strand(cv, H, [[u - r * 0.4, v + r * 0.5], [u + r * 0.1, v + r * 0.3], [u + r * 0.6, v - r * 0.2]], [id], -0.3, 0.26);
  return id;
}
STYLES.bun = {
  front(cv, H, m, o) {
    if (o.hat !== 'top') bunBall(cv, H, m, 0.2, -8.7, 2.4);
    const id = frontCap(cv, H, m, closeFront(domeFront(7.9, -8.6, 1.8), o.hat === 'top' ? FRINGE.short : FRINGE.part, [[6.2, 0.2]]));
    for (const [a, b] of [[[0.4, -7.0], [1.6, -3.6]], [[-2.6, -6.6], [-2.2, -1.6]], [[3.2, -6.4], [4.6, -1.4]]]) strand(cv, H, [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 0.3], b], [id]);
    if (o.hat !== 'top') shine(cv, H, 200, 300, 0.98, [id]);
  },
  back(cv, H, m, o) {
    const id = frontCap(cv, H, m, sym([[0, -8.6], [3.0, -8.4], [5.4, -7.6], [7.2, -6.2], [7.9, -4.2], [8.0, -1.8], [7.5, 1.4], [6.0, 3.6], [3.0, 4.4], [0, 4.6]]));
    for (const u of [-4.6, -1.6, 1.6, 4.6]) strand(cv, H, [[u, 4.0], [u * 0.8, -2.0], [u * 0.25, -7.4]], [id], -0.34);
    if (o.hat !== 'top') bunBall(cv, H, m, 0, -7.9, 2.6);
  },
  side(cv, H, m, o) {
    if (o.hat !== 'top') bunBall(cv, H, m, -4.6, -8.0, 2.5);
    return sideDome(cv, H, m, o, { fringe: o.hat === 'top' ? 'short' : 'neat', nape: 4.0, R: 7.9 });
  },
};

// ── 三つ編み ──
function braid(cv, H, m, pts, tieCol) {
  // pts: たばの とおり みち（u, v）。たまご がたを ならべる
  const segs = HeroCanvas.bez(pts[0], pts[1], pts[2], 7);
  for (let i = 0; i < segs.length; i++) {
    cv.part({ ol: 'soft' });
    const [u, v] = segs[i];
    const r = 1.45 - i * 0.06;
    cv.ell(H.X(u + (i % 2 ? 0.35 : -0.35)), H.y + v, r, r * 0.8, m, { rot: (i % 2 ? 0.5 : -0.5) * H.facing0, bulge: 0.75 });
  }
  const [eu, ev] = segs[segs.length - 1];
  cv.part({ ol: 'line' });
  cv.ell(H.X(eu), H.y + ev + 0.8, 0.95, 0.7, tieCol, { bulge: 0.7 });
  cv.part({ ol: 'soft' });
  cv.poly(toScreen(H, [[eu - 0.9, ev + 1.2], [eu + 0.9, ev + 1.2], [eu + 0.6, ev + 2.8], [eu, ev + 2.2], [eu - 0.6, ev + 2.8]]), m, { cx: 0.6 });
}
STYLES.braid = {
  front(cv, H, m, o) {
    const id = frontCap(cv, H, m, closeFront(domeFront(8.0, -8.8, 2.4), o.hat === 'top' ? FRINGE.short : FRINGE.part));
    for (const [a, b] of [[[0.4, -7.0], [1.6, -3.6]], [[-2.6, -6.6], [-2.2, -1.6]], [[3.2, -6.4], [4.6, -1.4]]]) strand(cv, H, [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 0.3], b], [id]);
    if (o.hat !== 'top') shine(cv, H, 200, 300, 1.0, [id]);
    braid(cv, H, m, [[-6.6, 2.0], [-7.6, 7.0], [-6.6, 12.6]], o.tie);
  },
  back(cv, H, m, o) {
    const id = frontCap(cv, H, m, sym([[0, -8.8], [3.0, -8.6], [5.6, -7.8], [7.4, -6.4], [8.0, -4.4], [8.0, -1.8], [7.4, 1.6], [5.6, 4.0], [3.0, 4.8], [0, 5.0]]));
    for (const u of [-4.6, -1.6, 1.6, 4.6]) strand(cv, H, [[u * 0.25, -7.4], [u * 0.8, -1.0], [3.0, 4.4]], [id], -0.34);
    braid(cv, H, m, [[3.4, 3.6], [6.6, 6.0], [7.0, 12.4]], o.tie);
  },
  side(cv, H, m, o) {
    const id = sideDome(cv, H, m, o, { fringe: o.hat === 'top' ? 'short' : 'neat', nape: 4.6 });
    braid(cv, H, m, [[-6.0, 3.0], [-5.6, 8.0], [-3.6, 12.8]], o.tie);
    return id;
  },
};

// ── ふんわりウェーブ ──
const wave = (n) => (a, i) => 1 + (i % 2 ? 0.035 : -0.02) * n;
STYLES.wavy = {
  behind(cv, H, m) {
    cv.part({ ol: 'line' });
    fill(cv, H, [[-8.0, -4.0], [8.0, -4.0], [9.8, 1.0], [10.6, 5.0], [9.8, 8.0], [10.8, 11.0], [9.4, 13.8], [7.4, 13.0], [5.6, 14.8], [3.0, 13.6], [0, 14.8], [-3.0, 13.6], [-5.6, 14.8], [-7.4, 13.0], [-9.4, 13.8], [-10.8, 11.0], [-9.8, 8.0], [-10.6, 5.0], [-9.8, 1.0]], m, { bias: -0.04 });
  },
  front(cv, H, m, o) {
    const outer = [[0, -9.4], [3.2, -9.2], [6.0, -8.4], [8.0, -6.8], [9.2, -4.4], [9.4, -1.2], [10.2, 1.8], [9.4, 4.4], [10.2, 7.4], [9.2, 10.4], [9.8, 12.2], [8.0, 12.6]];
    const inner = [[7.6, 10.0], [7.0, 7.6], [7.4, 5.0], [6.8, 2.6], [6.6, 0.0], [6.2, -0.8]];
    const id = frontCap(cv, H, m, closeFront(outer, o.hat === 'top' ? FRINGE.short : FRINGE.part, inner));
    for (const s of [-1, 1]) {
      strand(cv, H, [[s * 7.6, -3.0], [s * 9.4, 3.0], [s * 8.2, 8.0]], [id]);
      strand(cv, H, [[s * 8.4, 3.6], [s * 7.4, 8.0], [s * 8.6, 11.6]], [id], -0.3);
    }
    for (const [a, b] of [[[0.4, -7.0], [1.6, -3.6]], [[-2.6, -6.6], [-2.2, -1.6]], [[3.2, -6.4], [4.6, -1.4]]]) strand(cv, H, [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 0.3], b], [id]);
    if (o.hat !== 'top') shine(cv, H, 200, 300, 1.03, [id]);
  },
  back(cv, H, m, o) {
    const id = frontCap(cv, H, m, sym([[0, -9.4], [3.2, -9.2], [6.0, -8.4], [8.0, -6.8], [9.2, -4.4], [9.6, -1.0], [10.6, 2.6], [9.8, 6.0], [10.8, 9.6], [9.6, 13.0], [7.4, 13.6], [5.4, 14.8], [3.0, 13.8], [0, 14.8]]));
    for (const u of [-6.4, -3.6, -1.0, 1.6, 4.2, 6.8]) strand(cv, H, [[u * 0.3, -7.0], [u * 1.1, 3.0], [u * 0.9, 13.6]], [id]);
    if (o.hat !== 'top') shine(cv, H, 205, 300, 1.0, [id]);
  },
  sideBehind(cv, H, m) {
    cv.part({ ol: 'line' });
    fill(cv, H, [[-2.0, -6.0], [-7.0, -5.0], [-9.6, 0.0], [-10.6, 4.0], [-9.6, 7.0], [-10.6, 10.4], [-8.8, 14.4], [-5.6, 14.6], [-3.6, 11.0], [-3.0, 6.0], [-1.6, 1.0]], m, { su: -3, bias: -0.03 });
  },
  side(cv, H, m, o) {
    const back = [[-9.4, 1.0], [-10.2, 4.4], [-9.2, 7.2], [-10.0, 10.6], [-8.4, 13.4], [-6.0, 13.6], [-4.6, 10.0], [-4.2, 6.0]];
    const id = sideDome(cv, H, m, o, { fringe: o.hat === 'top' ? 'short' : 'soft', back, R: 8.6 });
    strand(cv, H, [[-3.6, -3.0], [-7.8, 4.0], [-6.2, 12.6]], [id]);
    return id;
  },
};

// ── 姫カット ──
STYLES.hime = {
  behind(cv, H, m) {
    cv.part({ ol: 'line' });
    fill(cv, H, sym([[0, -4], [7.8, -4], [8.8, 2.0], [9.0, 8.0], [8.8, 14.4], [0, 14.4]]), m, { bias: -0.04 });
  },
  front(cv, H, m, o) {
    const outer = [[0, -9.0], [3.0, -8.8], [5.6, -8.0], [7.4, -6.6], [8.3, -4.5], [8.6, -1.0], [8.8, 3.0], [8.8, 6.6], [6.4, 6.6]];
    const inner = [[6.3, 3.0], [6.2, -0.6]];
    const id = frontCap(cv, H, m, closeFront(outer, o.hat === 'top' ? FRINGE.short : FRINGE.blunt, inner));
    for (const s of [-1, 1]) strand(cv, H, [[s * 7.4, -2.6], [s * 7.7, 2.0], [s * 7.6, 6.4]], [id], -0.34);
    for (const u of [-4.2, -1.4, 1.4, 4.2]) strand(cv, H, [[u * 0.5, -7.4], [u * 0.9, -3.4], [u, -0.6]], [id], -0.3);
    if (o.hat !== 'top') shine(cv, H, 198, 300, 1.0, [id]);
  },
  back(cv, H, m, o) {
    const id = frontCap(cv, H, m, sym([[0, -9.0], [3.0, -8.8], [5.6, -8.0], [7.4, -6.6], [8.3, -4.5], [8.7, -1.0], [8.9, 4.0], [9.0, 9.0], [8.9, 14.4], [0, 14.4]]));
    for (const u of [-6.0, -3.0, 0, 3.0, 6.0]) strand(cv, H, [[u * 0.3, -6.6], [u * 0.95, 2.0], [u, 14.0]], [id], -0.36);
    if (o.hat !== 'top') shine(cv, H, 205, 300, 0.98, [id]);
  },
  sideBehind(cv, H, m) {
    cv.part({ ol: 'line' });
    fill(cv, H, [[-2.0, -6.0], [-6.6, -5.0], [-8.8, 0.0], [-9.2, 6.0], [-9.2, 14.4], [-3.4, 14.4], [-3.0, 6.0], [-1.6, 1.0]], m, { su: -3, bias: -0.03 });
  },
  side(cv, H, m, o) {
    const back = [[-8.6, 1.6], [-9.0, 6.0], [-9.0, 14.4], [-4.2, 14.4], [-4.2, 6.0]];
    const id = sideDome(cv, H, m, o, { fringe: o.hat === 'top' ? 'short' : 'blunt', back, temple: 5.6 });
    strand(cv, H, [[-3.2, -4.0], [-6.2, 3.0], [-6.4, 13.6]], [id], -0.34);
    return id;
  },
};

// ── 長い前がみ（かた目に かかる） ──
STYLES.side = {
  front(cv, H, m, o) {
    const outer = [[0, -9.0], [3.0, -8.8], [5.6, -8.0], [7.4, -6.6], [8.3, -4.5], [8.6, -1.6], [8.6, 2.0], [8.0, 5.0]];
    const inner = [[6.8, 2.4], [6.4, -0.6]];
    const id = frontCap(cv, H, m, closeFront(outer, o.hat === 'top' ? FRINGE.short : FRINGE.sweep, inner));
    for (const [a, c, b] of [[[3.4, -7.4], [0.6, -3.0], [-2.0, 1.2]], [[5.6, -6.6], [3.0, -2.6], [1.0, -0.2]], [[0.4, -8.0], [-2.6, -3.6], [-4.4, 2.4]]]) strand(cv, H, [a, c, b], [id]);
    strand(cv, H, [[7.0, -2.0], [7.6, 1.6], [7.4, 4.6]], [id], -0.3);
    strand(cv, H, [[-7.0, -2.0], [-7.6, 1.6], [-7.4, 4.6]], [id], -0.3);
    if (o.hat !== 'top') shine(cv, H, 205, 300, 1.0, [id]);
  },
  back(cv, H, m, o) {
    const id = frontCap(cv, H, m, sym([[0, -9.0], [3.0, -8.8], [5.6, -8.0], [7.4, -6.6], [8.3, -4.5], [8.6, -1.6], [8.4, 2.4], [7.4, 5.4], [5.0, 6.4], [2.4, 5.8], [0, 6.6]]));
    for (const u of [-4.2, -1.4, 1.4, 4.2]) strand(cv, H, [[u * 0.4, -6.0], [u * 0.9, -1.0], [u, 5.6]], [id]);
    if (o.hat !== 'top') shine(cv, H, 205, 300, 0.98, [id]);
  },
  side(cv, H, m, o) {
    return sideDome(cv, H, m, o, { fringe: o.hat === 'top' ? 'short' : 'sweep', nape: 6.2 });
  },
};

// ── ライオンヘア（たてがみ） ──
const MANE = [[-7.0, 3.2], [-8.8, 6.6], [-9.8, 3.4], [-11.8, 4.2], [-10.6, 0.6], [-12.2, -1.6], [-10.2, -3.4], [-11.4, -6.4], [-8.8, -6.8], [-9.2, -9.8], [-6.2, -8.8], [-5.2, -11.8], [-3.0, -9.6], [-1.0, -12.4], [0.6, -9.8], [2.6, -12.2], [3.8, -9.6], [6.0, -11.4], [6.6, -8.6], [9.6, -9.4], [8.8, -6.4], [11.6, -6.0], [10.2, -3.2], [12.2, -1.4], [10.4, 0.8], [11.8, 4.4], [9.6, 3.6], [8.6, 6.8], [7.0, 3.2]];
STYLES.wild = {
  behind(cv, H, m) {
    cv.part({ ol: 'line' });
    fill(cv, H, [[-8.4, -3.0], [8.4, -3.0], [10.6, 2.0], [11.0, 7.0], [9.0, 9.6], [8.4, 12.0], [6.0, 10.6], [3.6, 12.6], [1.2, 10.8], [-1.2, 12.6], [-3.6, 10.6], [-6.0, 12.0], [-8.4, 10.0], [-9.4, 12.2], [-11.0, 7.0], [-10.6, 2.0]], m, { bias: -0.05 });
  },
  front(cv, H, m, o) {
    const pts = o.hat === 'top' ? closeFront(domeFront(8.3, -9.0, 3.2), FRINGE.spiky) : [...MANE, [6.2, 0.6], ...FRINGE.spiky, [-6.2, 0.6]];
    const id = frontCap(cv, H, m, pts);
    for (const [a, c, b] of [[[-1.2, -8.8], [-1.2, -5.0], [-1.5, -2.2]], [[1.8, -8.6], [1.6, -5.0], [1.3, -2.2]], [[-4.6, -8.2], [-4.4, -4.6], [-4.0, -2.0]], [[4.8, -8.0], [4.5, -4.6], [3.9, -2.0]], [[-8.0, -5.0], [-8.6, -1.0], [-8.2, 3.6]], [[8.0, -5.0], [8.6, -1.0], [8.2, 3.6]]]) strand(cv, H, [a, c, b], [id]);
    if (o.hat !== 'top') shine(cv, H, 205, 295, 1.0, [id]);
  },
  back(cv, H, m, o) {
    const pts = [...MANE.slice(1, -1), [9.2, 7.6], [7.4, 10.6], [5.6, 9.0], [3.4, 12.0], [1.0, 9.6], [-1.2, 12.2], [-3.4, 9.4], [-5.6, 11.6], [-7.4, 9.2], [-9.4, 8.0]];
    const id = frontCap(cv, H, m, pts);
    for (const u of [-6.0, -3.0, 0, 3.0, 6.0]) strand(cv, H, [[u * 0.4, -7.0], [u * 0.9, 0.0], [u, 10.0]], [id]);
    if (o.hat !== 'top') shine(cv, H, 205, 300, 1.0, [id]);
  },
  side(cv, H, m, o) {
    const back = [[-9.4, -6.6], [-12.4, -5.6], [-9.6, -3.4], [-12.4, -1.0], [-9.6, 1.0], [-11.6, 4.6], [-8.8, 5.0], [-9.6, 9.4], [-6.8, 8.0], [-6.6, 11.2], [-4.6, 7.4]];
    const id = sideDome(cv, H, m, o, { fringe: 'spiky', back });
    if (o.hat !== 'top') {
      cv.part({ ol: 'soft' });
      for (const [a, c, b, w] of [[[1.8, -8.0], [3.4, -10.0], [5.6, -10.9], 2.0], [[-1.4, -8.6], [-1.0, -10.6], [0.6, -11.4], 2.1], [[-4.6, -7.6], [-6.0, -9.8], [-6.8, -10.8], 1.9]]) lock(cv, H, a, c, b, w, 0.25, m, { ease: 1.3 });
    }
    return id;
  },
};

// ── モヒカン ──
function shaved(cv, H, m2, view) {
  cv.part({ ol: 'soft' });
  if (view === 'side') fill(cv, H, [[5.4, -4.2], [3.6, -6.8], [0.0, -7.8], [-4.0, -7.0], [-6.8, -4.4], [-7.4, -0.6], [-6.4, 3.4], [-3.4, 3.0], [-1.6, -0.2], [0.6, 1.8], [2.0, -1.0], [4.6, -3.0]], m2, { su: 0 });
  else fill(cv, H, sym([[0, -7.8], [3.6, -7.4], [6.2, -5.6], [7.4, -2.8], [7.5, 0.6], [6.6, 1.8], [6.0, -1.6], [4.6, -3.8], [0, -4.4]]), m2);
}
STYLES.mohawk = {
  front(cv, H, m, o) {
    shaved(cv, H, o.stubble, 'front');
    if (o.hat === 'top') return;
    const id = frontCap(cv, H, m, [[-2.2, -3.6], [-2.8, -6.0], [-3.6, -8.6], [-2.4, -9.4], [-3.0, -11.6], [-1.0, -10.6], [-0.4, -12.6], [0.8, -10.8], [2.2, -12.0], [2.4, -9.6], [3.6, -9.0], [2.8, -6.0], [2.2, -3.6], [0.8, -2.2], [0, -3.2], [-0.8, -2.2]]);
    strand(cv, H, [[0, -11.0], [0.2, -7.0], [0, -3.4]], [id], -0.4);
    strand(cv, H, [[-1.6, -9.4], [-1.4, -6.0], [-1.2, -3.6]], [id], -0.3);
  },
  back(cv, H, m, o) {
    shaved(cv, H, o.stubble, 'back');
    if (o.hat === 'top') return;
    const id = frontCap(cv, H, m, [[-2.2, 4.4], [-2.6, 0.0], [-3.0, -4.6], [-3.4, -8.6], [-2.2, -9.4], [-2.6, -11.6], [-0.6, -10.6], [0.2, -12.6], [1.2, -10.6], [2.6, -11.6], [2.4, -9.4], [3.4, -8.6], [3.0, -4.6], [2.6, 0.0], [2.2, 4.4], [0, 5.2]]);
    strand(cv, H, [[0, -11.0], [0, -2.0], [0, 4.6]], [id], -0.4);
  },
  side(cv, H, m, o) {
    shaved(cv, H, o.stubble, 'side');
    if (o.hat === 'top') return;
    const id = frontCap(cv, H, m, [[5.4, -4.6], [6.4, -6.4], [4.6, -7.4], [5.6, -9.6], [2.8, -9.4], [2.6, -12.0], [0.2, -10.0], [-1.6, -12.6], [-3.0, -9.8], [-5.6, -11.4], [-6.0, -8.4], [-8.6, -8.6], [-8.0, -5.4], [-9.2, -2.4], [-7.6, -1.6], [-7.2, -4.4], [-4.6, -7.6], [-0.6, -8.6], [3.0, -7.6]], { su: 0 });
    strand(cv, H, [[4.4, -8.6], [-1.0, -10.4], [-7.0, -6.6]], [id], -0.4);
    return id;
  },
};

// ── オールバック ──
STYLES.slick = {
  front(cv, H, m, o) {
    const outer = domeFront(8.0, -8.8, 1.6);
    const fr = [[5.8, -2.2], [4.6, -4.4], [2.6, -5.2], [1.0, -4.6], [0, -3.8], [-1.0, -4.6], [-2.6, -5.2], [-4.6, -4.4], [-5.8, -2.2]];
    const id = frontCap(cv, H, m, closeFront(outer, fr, [[6.2, -0.4]]));
    for (const u of [-3.6, -1.2, 1.2, 3.6]) strand(cv, H, [[u * 1.05, -4.8], [u * 0.8, -7.0], [u * 0.4, -8.6]], [id], -0.38);
    strand(cv, H, [[-6.4, -2.6], [-6.8, -5.4], [-5.0, -7.6]], [id], -0.3);
    strand(cv, H, [[6.4, -2.6], [6.8, -5.4], [5.0, -7.6]], [id], -0.3);
    if (o.hat !== 'top') shine(cv, H, 205, 300, 0.95, [id], 0.5);
  },
  back(cv, H, m, o) {
    const id = frontCap(cv, H, m, sym([[0, -8.8], [3.0, -8.6], [5.6, -7.8], [7.4, -6.4], [8.0, -4.4], [8.1, -1.6], [7.6, 1.8], [6.0, 4.2], [3.0, 5.0], [0, 5.2]]));
    for (const u of [-5.0, -2.4, 0, 2.4, 5.0]) strand(cv, H, [[u * 0.3, -8.4], [u * 0.85, -2.0], [u * 0.9, 4.6]], [id], -0.36);
    if (o.hat !== 'top') shine(cv, H, 205, 300, 0.97, [id], 0.5);
  },
  side(cv, H, m, o) {
    const id = sideDome(cv, H, m, o, { fringe: 'none', nape: 4.6, R: 8.0 });
    for (const v of [-6.6, -4.4]) strand(cv, H, [[5.0, v], [0.0, v - 1.6], [-6.0, v + 1.4]], [id], -0.36);
    return id;
  },
};

// ── ちょんまげ ──
function knot(cv, H, m, u, v, tieCol, back = false) {
  cv.part({ ol: 'line' });
  const pts = back
    ? [[u - 1.0, v + 1.2], [u - 1.2, v - 1.4], [u - 0.6, v - 4.2], [u + 0.6, v - 4.2], [u + 1.2, v - 1.4], [u + 1.0, v + 1.2]]
    : [[u - 0.9, v + 0.8], [u - 1.4, v - 1.0], [u - 0.4, v - 2.8], [u + 2.6, v - 3.4], [u + 3.2, v - 2.4], [u + 1.0, v - 1.2], [u + 0.9, v + 0.8]];
  fill(cv, H, pts, m, { su: u, sv: v - 2, sr: 0.5 });
  cv.part({ ol: 'line' });
  cv.ell(H.X(u), H.y + v - 0.2, 1.1, 0.55, tieCol, { bulge: 0.6 });
}
STYLES.topknot = {
  front(cv, H, m, o) {
    const outer = domeFront(7.9, -8.6, 1.4);
    const fr = [[5.8, -2.6], [4.6, -4.6], [2.0, -5.6], [0, -5.6], [-2.0, -5.6], [-4.6, -4.6], [-5.8, -2.6]];
    const id = frontCap(cv, H, m, closeFront(outer, fr, [[6.2, -0.6]]));
    for (const u of [-3.6, -1.2, 1.2, 3.6]) strand(cv, H, [[u * 1.05, -5.2], [u * 0.8, -7.0], [u * 0.3, -8.4]], [id], -0.34);
    if (o.hat !== 'top') { shine(cv, H, 205, 300, 0.95, [id], 0.45); knot(cv, H, m, 0, -8.8, o.tie, true); }
  },
  back(cv, H, m, o) {
    const id = frontCap(cv, H, m, sym([[0, -8.6], [3.0, -8.4], [5.4, -7.6], [7.2, -6.2], [7.9, -4.2], [8.0, -1.8], [7.4, 1.4], [5.8, 3.6], [3.0, 4.4], [0, 4.6]]));
    for (const u of [-4.6, -1.6, 1.6, 4.6]) strand(cv, H, [[u, 4.0], [u * 0.8, -2.0], [u * 0.2, -8.0]], [id], -0.34);
    if (o.hat !== 'top') knot(cv, H, m, 0, -8.6, o.tie, true);
  },
  side(cv, H, m, o) {
    const id = sideDome(cv, H, m, o, { fringe: 'none', nape: 4.0, R: 7.9 });
    if (o.hat !== 'top') knot(cv, H, m, -1.2, -8.4, o.tie);
    return id;
  },
};

// ── アフロ ── まるい ふさ（たま）を いくつも かさねて、もこもこの りんかくに する
// [u, v, r]（あたまの まんなか から。よこがおは まえが ＋）。うしろの ものから かく
const AFRO = {
  front: [[-8.4, 1.2, 2.3], [8.4, 1.2, 2.3], [-8.8, -3.0, 2.6], [8.8, -3.0, 2.6], [-7.2, -7.2, 2.7], [7.2, -7.2, 2.7],
    [-3.6, -9.6, 2.8], [3.6, -9.6, 2.8], [0, -10.2, 2.7], [-4.4, -5.8, 2.3], [4.4, -5.8, 2.3], [0, -6.8, 2.4]],
  back: [[-7.6, 3.4, 2.4], [7.6, 3.4, 2.4], [-2.6, 4.6, 2.4], [2.6, 4.6, 2.4], [-8.8, -1.0, 2.6], [8.8, -1.0, 2.6], [-7.2, -6.6, 2.7], [7.2, -6.6, 2.7],
    [-3.6, -9.6, 2.8], [3.6, -9.6, 2.8], [0, -10.2, 2.7], [-4.0, -4.0, 2.6], [4.0, -4.0, 2.6], [0, -0.4, 2.7], [0, -6.4, 2.6]],
  side: [[-7.8, 3.2, 2.3], [-4.2, 4.4, 2.3], [-9.0, -1.4, 2.4], [-8.2, -6.0, 2.6], [-5.0, -9.4, 2.8], [-0.6, -10.4, 2.7], [3.8, -9.0, 2.6],
    [6.2, -5.8, 2.3], [-5.2, -3.4, 2.6], [-1.0, -6.6, 2.5], [-4.6, 0.8, 2.4]],
};
function afroPuffs(cv, H, m, list) {
  for (const [u, v, r] of list) {
    cv.part({ ol: 'none', cast: false });
    cv.ell(H.X(u), H.y + v, r, r * 0.94, m, { bulge: 0.75 });
  }
}
STYLES.afro = {
  front(cv, H, m, o) {
    if (o.hat === 'top') return STYLES.short.front(cv, H, m, o);
    const ring = arc(0, -2.6, 9.4, 9.2, 160, 380, 22);
    const pts = [[-7.2, 3.0], ...ring, [7.2, 3.0], [6.2, 0.4], ...FRINGE.short.map(([u, v]) => [u, v + 0.6]), [-6.2, 0.4]];
    frontCap(cv, H, m, pts, { sr: 1.25, sv: -4 });
    afroPuffs(cv, H, m, AFRO.front);
  },
  back(cv, H, m, o) {
    if (o.hat === 'top') return STYLES.short.back(cv, H, m, o);
    frontCap(cv, H, m, arc(0, -2.2, 9.4, 9.2, 0, 360, 26), { sr: 1.25, sv: -4 });
    afroPuffs(cv, H, m, AFRO.back);
  },
  side(cv, H, m, o) {
    if (o.hat === 'top') return STYLES.short.side(cv, H, m, o);
    // まえがみは ひたいの うえ まで（め を かくさない）
    const ring = arc(-2.4, -2.6, 9.2, 9.2, -40, -290, 22);
    const id = frontCap(cv, H, m, [...ring, [-2.6, 4.0], [-1.4, -0.4], [0.4, 1.4], [1.8, -1.6], [5.4, -3.4]], { su: -1, sr: 1.25, sv: -4 });
    afroPuffs(cv, H, m, AFRO.side);
    return id;
  },
};

// ── ぼうず ──
STYLES.buzz = {
  front(cv, H, m, o) {
    const outer = [[0, -7.7], [3.0, -7.5], [5.4, -6.8], [6.9, -5.4], [7.5, -3.4], [7.6, -1.0], [7.3, 1.2]];
    const fr = [[5.6, -3.0], [3.0, -3.6], [0, -3.8], [-3.0, -3.6], [-5.6, -3.0]];
    frontCap(cv, H, o.stubble, closeFront(outer, fr, [[6.4, -0.6]]));
  },
  back(cv, H, m, o) {
    frontCap(cv, H, o.stubble, sym([[0, -7.7], [3.0, -7.5], [5.4, -6.8], [6.9, -5.4], [7.5, -3.4], [7.6, -0.6], [7.0, 2.4], [5.0, 4.6], [2.6, 5.2], [0, 5.4]]));
  },
  side(cv, H, m, o) {
    const pts = [[5.6, -4.0], ...arc(-0.6, -0.4, 7.4, 7.5, -50, -180, 12), [-7.6, 1.6], [-7.0, 4.0], [-5.6, 5.0], [-4.0, 4.4], [-3.0, 1.0], [-2.4, -0.8], [-0.6, -0.2], [0.2, 1.6], [1.4, 1.4], [1.8, -0.8], [4.0, -3.4]];
    return frontCap(cv, H, o.stubble, pts, { su: 0.6 });
  },
};

STYLES.bald = {
  front() {},
  back() {},
  side() {},
};

export const HAIR_STYLE_IDS = Object.keys(STYLES);

// ───────────── かく ─────────────
// layer: 'behind'（からだの うしろ） / 'head'（あたまの うえ）
// view: 'front' | 'back' | 'side'
export function drawHair(cv, H, layer, view, style, m, o = {}) {
  const S = STYLES[style] || STYLES.short;
  if (view === 'front') {
    if (layer === 'behind') { if (S.behind) S.behind(cv, H, m, o); return; }
    S.front(cv, H, m, o);
  } else if (view === 'back') {
    if (layer === 'behind') return;
    S.back(cv, H, m, o);
  } else {
    if (layer === 'behind') { if (S.sideBehind) S.sideBehind(cv, H, m, o); return; }
    S.side(cv, H, m, o);
  }
}
