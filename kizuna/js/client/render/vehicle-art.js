// 乗り物の ドット絵（第37回 C。すべて オリジナル。名前と 値段は shared/data/vehicles.js）
//
// かき方:
//  ・人の 絵と おなじ「32×42 の こまかさ」（1マスの 半分 = 1ドット。du）で かいて、Scale2x で res 4 に する
//  ・むきは 3つ: 'side'（ひだりむき。みぎむきは はんてん）・'front'（down）・'back'（up）
//  ・1つの 乗り物は 2つの 層（'back' … 乗る 人より うしろ、'front' … 乗る 人より まえ）と、
//    すきとおった こうか（fx … オーラ・風・花びら。ふちどり なし）で できている
//  ・乗る 人は 主人公の 絵（res 4）を そのまま のせる（かみ・服が 見える）。
//    rider(view, f) … { x, y（人の 絵の ひだりうえ。du）, crop（上から 何ドット 見せるか）, frame（人の コマ） }
//  ・じめんは 絵の いちばん 下から 2ドット 上（人の 絵と おなじ。2D の かげ・2.5D の 足もとが そろう）
// テスト（test/vehicles.test.js）は paintVehicle で、すべての 乗り物・むき・コマに 絵が あるかを 見る
import { Painter, scale2x, rimShade, outline2, makeCanvas, ctxOf, flipCanvas, shade } from './pixel.js?v=e9f7d3379e55';
import { addFamilyVehicleArt } from './family-art.js?v=e9f7d3379e55';
// 第50回 D3: 景品の 乗り物（色がえで 使い回す）
import { addPrizeVehicleArt } from './prize-vehicle-art.js?v=e9f7d3379e55';
// 第43回: ヨッシー（マリオ・ピーチ）
import { addR43jVehicleArt } from './vehicle-r43j.js?v=e9f7d3379e55';

const OUT = '#1b1330';
export const RIDER_W = 32;
export const RIDER_H = 42;
export const VIEWS = ['side', 'front', 'back'];
export const viewOf = (dir) => (dir === 'down' ? 'front' : dir === 'up' ? 'back' : 'side');

// ───────────── 絵の どうぐ（du） ─────────────
function poly(p, pts, c) {
  let y0 = Infinity, y1 = -Infinity;
  for (const [, y] of pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const yc = y + 0.5;
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
      if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + ((yc - ay) / (by - ay)) * (bx - ax));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) p.set(x, y, c);
  }
}
// ふとい 線（t … はば）
function seg(p, x0, y0, x1, y1, c, t = 1) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n;
    if (t <= 1) p.set(x, y, c);
    else p.ellipse(x, y, t / 2, t / 2, c);
  }
}
// かどの まるい しかく（上 1ドット あかるく・下 1ドット くらく）
function box(p, x, y, w, h, c, { r = 1, top = true, bottom = true } = {}) {
  for (let j = 0; j < h; j++) {
    const inset = r && (j === 0 || j === h - 1) ? r : 0;
    const col = top && j === 0 ? shade(c, 0.22) : bottom && j === h - 1 ? shade(c, -0.25) : c;
    p.hline(Math.round(x + inset), Math.round(x + w - 1 - inset), Math.round(y + j), col);
  }
}
// 車輪（よこから。f で スポークが まわる）
function wheel(p, cx, cy, r, f, o = {}) {
  const tire = o.tire || '#2a2630', rim = o.rim || '#c8ccd8', hub = o.hub || '#8a8e9a';
  p.ellipse(cx, cy, r, r, tire);
  const ri = r - Math.max(1.2, r * 0.28);
  p.ellipse(cx, cy, ri, ri, rim);
  if (o.spokes !== false && ri > 2) {
    const a0 = (f % 3) * (Math.PI / 6);
    for (let k = 0; k < 3; k++) {
      const a = a0 + (k * Math.PI) / 3;
      seg(p, cx - Math.cos(a) * ri, cy - Math.sin(a) * ri, cx + Math.cos(a) * ri, cy + Math.sin(a) * ri, shade(rim, -0.35));
    }
  }
  p.ellipse(cx, cy, Math.max(0.8, r * 0.22), Math.max(0.8, r * 0.22), hub);
  // スポークの ない 車輪も まわって 見える ように（ふちの しるし）
  if (o.spokes === false) {
    const a = (f % 3) * ((Math.PI * 2) / 3) + 0.6;
    p.set(cx + Math.cos(a) * (r - 0.6), cy + Math.sin(a) * (r - 0.6), shade(tire, 0.45));
  }
}
// 車輪（前・うしろから。たての ほそい だえん）
function wheelEdge(p, cx, cy, r, rx = 1.6, tire = '#2a2630', f = 0) {
  p.ellipse(cx, cy, rx, r, tire);
  // みぞ（コマで うごく）
  const y = Math.round(cy + 1 + (f % 2) * Math.max(1, Math.floor(r * 0.4)));
  p.vline(Math.round(cx), y, y + 1, shade(tire, 0.3));
}
// すきとおった こうかの いろ（fx の 層 だけ）
const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
// 星（きらきら）
function twinkle(p, x, y, c, big = false) {
  p.set(x, y, c);
  p.set(x - 1, y, c); p.set(x + 1, y, c); p.set(x, y - 1, c); p.set(x, y + 1, c);
  if (big) { p.set(x - 2, y, c); p.set(x + 2, y, c); p.set(x, y - 2, c); p.set(x, y + 2, c); }
}

// 人の おき方
const seat = (cx, hipY, crop = 33, frame = 0) => ({ x: cx - 16, y: hipY - 31, crop, frame });
const stand = (cx, feetY, frame = 1, crop = null) => ({ x: cx - 16, y: feetY - 40, crop, frame });

// ───────────── 型 1: 馬（馬・よろい馬・白馬・天馬・竜の子） ─────────────
// o: coat, mane, hoof, saddle, armor?, wings?, dragon?（竜の 頭と しっぽ）, blaze?
function horseArt(o) {
  const coat = o.coat, coatD = shade(coat, -0.22), coatL = shade(coat, 0.2);
  const mane = o.mane, hoof = o.hoof || '#3a2a22';
  const saddle = o.saddle || '#a83a3a', saddleL = shade(saddle, 0.25);
  const W = o.wings ? 76 : 64;
  const FW = o.wings ? 64 : 36;
  const fly = !!o.fly;
  const lift = fly ? 6 : 0;
  const leg = (p, hx, hy, fx, fy, c, t = 3.4) => {
    const kx = (hx + fx) / 2 + (fx < hx ? 1 : -0.4), ky = (hy + fy) / 2 - 0.5;
    seg(p, hx, hy, kx, ky, c, t);
    seg(p, kx, ky, fx, fy - 1.5, c, t - 0.6);
    p.rect(Math.round(fx - 1.6), Math.round(fy - 1.6), 4, 2, hoof);
  };
  // 足の いち（よこ。f … 0〜2）: [前てまえ, 前おく, 後ろてまえ, 後ろおく] の 足先
  const GALLOP = [
    [[15, -4], [27, 0], [50, 0], [39, -4]],
    [[21, 0], [24, -1], [45, 0], [48, -1]],
    [[27, 0], [16, -5], [40, -5], [51, 0]],
  ];
  const wing = (p, x, y, f, side, c, cD) => {
    // side: -1 … ひだりへ ひろげる・1 … みぎへ。f で 上下
    const up = f === 1 ? 4 : f === 2 ? -3 : 0;
    for (let i = 0; i < 6; i++) {
      const len = 13 - i * 1.6;
      seg(p, x, y + i * 1.2, x + side * len, y - 8 + up + i * 2.4, i % 2 ? cD : c, 2.4);
    }
  };
  const side = (p, f, layer) => {
    const G = 50 - lift, by = 31 - lift;
    const L = GALLOP[f];
    const ox = o.wings ? 6 : 0;
    if (layer === 'back') {
      if (o.wings) wing(p, 34 + ox, by - 6, f, 1, shade(o.wings, -0.15), shade(o.wings, -0.32));
      leg(p, 25 + ox, by + 4, L[1][0] + ox, G + L[1][1], coatD);
      leg(p, 46 + ox, by + 4, L[3][0] + ox, G + L[3][1], coatD);
      // しっぽ（うしろへ なびく）
      if (o.dragon) {
        for (let i = 0; i < 14; i++) p.ellipse(51 + ox + i, by + 1 + i * 0.5 - (f === 1 ? i * 0.15 : 0), 2.6 - i * 0.15, 2.6 - i * 0.15, i % 3 ? coat : coatD);
      } else {
        for (let k = 0; k < 4; k++) seg(p, 51 + ox, by - 3 + k, 58 + ox + (f === 1 ? 1 : 0), by + 9 + k * 1.2 - (f === 2 ? 3 : 0), k % 2 ? mane : shade(mane, 0.15), 1.6);
      }
      return;
    }
    // からだ
    p.ellipse(34 + ox, by, 15, 7, coat);
    p.ellipse(22 + ox, by - 0.5, 6.5, 6.8, coat);
    p.ellipse(45 + ox, by - 1, 6.8, 6.8, coat);
    p.hline(24 + ox, 44 + ox, by - 7, coatL);
    p.ellipse(34 + ox, by + 4.5, 11, 2, coatD);
    if (o.dragon) {
      // うろこの おなか
      for (let x = 20; x < 46; x += 3) p.ellipse(x + ox, by + 4.5, 1.4, 1.6, o.belly || '#e8d88a');
    }
    // くび と 頭
    if (o.dragon) {
      poly(p, [[16 + ox, by + 1], [25 + ox, by - 5], [17 + ox, by - 16], [10 + ox, by - 13]], coat);
      p.ellipse(10 + ox, by - 16, 5.5, 4.2, coat);
      p.ellipse(4.5 + ox, by - 15, 4, 3, coat);
      p.hline(2 + ox, 7 + ox, by - 12.5, coatD);
      p.rect(8 + ox, by - 18, 2, 2, '#1b1330');
      p.set(8 + ox, by - 18, '#ffe070');
      // つの
      seg(p, 13 + ox, by - 19, 18 + ox, by - 23, o.horn || '#f4e8c0', 1.6);
      seg(p, 11 + ox, by - 20, 14 + ox, by - 25, o.horn || '#f4e8c0', 1.6);
      // せなかの とげ
      for (let x = 24; x <= 46; x += 4) poly(p, [[x + ox - 1.5, by - 6.5], [x + ox + 1.5, by - 6.5], [x + ox + 0.5, by - 9.5]], o.spike || '#f2a03a');
    } else {
      poly(p, [[15 + ox, by + 1], [25 + ox, by - 5], [17 + ox, by - 16.5], [10.5 + ox, by - 14]], coat);
      p.ellipse(11 + ox, by - 16, 4.6, 4, coat);
      p.ellipse(6 + ox, by - 13.5, 3.4, 2.8, o.muzzle || coat);
      p.set(3.5 + ox, by - 13.5, '#2a1a18');
      p.rect(10 + ox, by - 17, 2, 2, '#1b1330');
      p.set(10 + ox, by - 17, '#ffffff');
      poly(p, [[12 + ox, by - 19.5], [15 + ox, by - 20], [14.5 + ox, by - 24]], coat);
      if (o.blaze) seg(p, 8 + ox, by - 18, 5 + ox, by - 14, o.blaze, 1.4);
      // たてがみ
      for (let i = 0; i <= 9; i++) {
        const t = i / 9;
        p.ellipse(14.5 + ox + t * 10, by - 19 + t * 13, 2.2, 1.8, i % 2 ? mane : shade(mane, 0.12));
      }
    }
    // よろい（むね・くび・顔）
    if (o.armor) {
      const a = o.armor, aD = shade(a, -0.3), aL = shade(a, 0.3);
      poly(p, [[16 + ox, by - 2], [26 + ox, by - 4], [27 + ox, by + 5], [17 + ox, by + 5]], a);
      p.hline(17 + ox, 26 + ox, by - 2, aL);
      for (let x = 18; x < 27; x += 3) p.vline(x + ox, by - 1, by + 4, aD);
      poly(p, [[8 + ox, by - 19], [13 + ox, by - 19.5], [12 + ox, by - 14], [7 + ox, by - 15]], a);
      if (o.trim) { p.hline(16 + ox, 27 + ox, by + 5, o.trim); p.set(10 + ox, by - 19, o.trim); }
      // しりの よろい
      p.ellipse(45 + ox, by - 1, 6.2, 5.6, a);
      p.hline(41 + ox, 49 + ox, by - 5, aL);
      if (o.trim) p.hline(40 + ox, 50 + ox, by + 4, o.trim);
    }
    // てまえの 足
    leg(p, 23 + ox, by + 4, L[0][0] + ox, G + L[0][1], coat);
    leg(p, 44 + ox, by + 4, L[2][0] + ox, G + L[2][1], coat);
    // くら（てまえの あぶみ）
    box(p, 28 + ox, by - 8, 12, 4, saddle, { r: 1 });
    poly(p, [[30 + ox, by - 5], [38 + ox, by - 5], [37 + ox, by + 2], [31 + ox, by + 2]], saddle);
    p.hline(31 + ox, 37 + ox, by - 5, saddleL);
    seg(p, 34 + ox, by + 2, 34 + ox, by + 5, '#5a4a3a');
    p.rect(32 + ox, by + 5, 4, 1, '#c8ccd8');
    if (o.trim) p.hline(28 + ox, 39 + ox, by - 8, o.trim);
    if (o.wings) wing(p, 33 + ox, by - 4, f, 1, o.wings, shade(o.wings, -0.18));
  };
  const front = (p, f, layer) => {
    const cx = FW / 2, G = 50 - lift, by = 31 - lift;
    const bob = f === 1 ? -1 : 0;
    if (layer === 'back') {
      if (o.wings) {
        for (const s of [-1, 1]) wing(p, cx + s * 6, by - 6 + bob, f, s, o.wings, shade(o.wings, -0.18));
      }
      // おくの からだ と うしろ足
      p.ellipse(cx, by - 1 + bob, 10, 6.5, coatD);
      leg(p, cx - 6, by + 2, cx - 6.5, G - (f === 2 ? 3 : 0), coatD, 3.2);
      leg(p, cx + 6, by + 2, cx + 6.5, G - (f === 0 ? 3 : 0), coatD, 3.2);
      // くら（よこに はみ出る）
      box(p, cx - 11, by - 7 + bob, 22, 4, saddle, { r: 1 });
      return;
    }
    // むね と 前足
    p.ellipse(cx, by + 2 + bob, 10.5, 7.5, coat);
    leg(p, cx - 5.5, by + 6, cx - 6, G - (f === 0 ? 3 : 0), coat, 4);
    leg(p, cx + 5.5, by + 6, cx + 6, G - (f === 2 ? 3 : 0), coat, 4);
    if (o.armor) {
      p.ellipse(cx, by + 3 + bob, 9.5, 6, o.armor);
      p.hline(cx - 7, cx + 7, by - 2 + bob, shade(o.armor, 0.3));
      if (o.trim) p.hline(cx - 8, cx + 8, by + 8 + bob, o.trim);
    }
    // あぶみ
    for (const s of [-1, 1]) {
      p.vline(Math.round(cx + s * 11), by - 3 + bob, by + 4 + bob, '#5a4a3a');
      p.rect(Math.round(cx + s * 11 - 1), by + 4 + bob, 3, 1, '#c8ccd8');
    }
    // 頭（てまえ）
    const hy = by - 1 + bob;
    if (o.dragon) {
      p.ellipse(cx, hy, 6.5, 5.8, coat);
      p.ellipse(cx, hy + 4.5, 5, 3.4, shade(coat, 0.12));
      for (const s of [-1, 1]) {
        seg(p, cx + s * 3.5, hy - 4.5, cx + s * 7.5, hy - 10, o.horn || '#f4e8c0', 1.8);
        p.rect(Math.round(cx + s * 3 - 1), Math.round(hy - 1), 2, 2, '#1b1330');
        p.set(Math.round(cx + s * 3 - (s < 0 ? 1 : 0)), Math.round(hy - 1), '#ffe070');
        p.set(Math.round(cx + s * 1.6), Math.round(hy + 6), '#3a2a22');
      }
    } else {
      for (const s of [-1, 1]) poly(p, [[cx + s * 2.2, hy - 5], [cx + s * 5.2, hy - 5.5], [cx + s * 4.6, hy - 10.5]], coat);
      p.ellipse(cx, hy + 2, 4.6, 7.2, coat);
      p.ellipse(cx, hy + 6.5, 3.8, 3, o.muzzle || shade(coat, 0.15));
      if (o.blaze) p.vline(Math.round(cx), Math.round(hy - 3), Math.round(hy + 4), o.blaze);
      if (o.armor) { p.rect(Math.round(cx - 2), Math.round(hy - 4), 5, 5, o.armor); if (o.trim) p.set(Math.round(cx), Math.round(hy - 3), o.trim); }
      for (const s of [-1, 1]) {
        p.rect(Math.round(cx + s * 3.8 - 0.5), Math.round(hy), 1, 2, '#1b1330');
        p.set(Math.round(cx + s * 1.4), Math.round(hy + 7.5), '#2a1a18');
      }
      // まえがみ
      p.ellipse(cx, hy - 4.5, 2.6, 2.2, mane);
    }
  };
  const back = (p, f, layer) => {
    const cx = FW / 2, G = 50 - lift, by = 31 - lift;
    const bob = f === 1 ? -1 : 0;
    if (layer === 'back') {
      // くび と 頭（人の むこう）
      p.ellipse(cx, by - 9 + bob, 4.5, 6, coat);
      if (o.dragon) for (const s of [-1, 1]) seg(p, cx + s * 2.5, by - 14 + bob, cx + s * 5, by - 19 + bob, o.horn || '#f4e8c0', 1.6);
      else for (const s of [-1, 1]) poly(p, [[cx + s * 1.5, by - 13 + bob], [cx + s * 4, by - 13.5 + bob], [cx + s * 3.5, by - 18 + bob]], coat);
      if (!o.dragon) p.ellipse(cx, by - 11 + bob, 1.8, 4, mane);
      leg(p, cx - 5, by + 2, cx - 5.5, G - (f === 2 ? 3 : 0), coatD, 3.2);
      leg(p, cx + 5, by + 2, cx + 5.5, G - (f === 0 ? 3 : 0), coatD, 3.2);
      return;
    }
    if (o.wings) for (const s of [-1, 1]) wing(p, cx + s * 6, by - 5 + bob, f, s, o.wings, shade(o.wings, -0.18));
    // おしり と うしろ足
    p.ellipse(cx, by + 2 + bob, 11, 8, coat);
    p.vline(Math.round(cx), Math.round(by - 2 + bob), Math.round(by + 8 + bob), coatD);
    leg(p, cx - 6, by + 6, cx - 6.5, G - (f === 0 ? 3 : 0), coat, 4);
    leg(p, cx + 6, by + 6, cx + 6.5, G - (f === 2 ? 3 : 0), coat, 4);
    if (o.armor) {
      p.ellipse(cx, by + bob, 8.5, 5.5, o.armor);
      p.hline(cx - 6, cx + 6, by - 4 + bob, shade(o.armor, 0.3));
      if (o.trim) p.hline(cx - 8, cx + 8, by + 5 + bob, o.trim);
    }
    box(p, cx - 9, by - 7 + bob, 18, 4, saddle, { r: 1 });
    if (o.trim) p.hline(cx - 8, cx + 8, by - 7 + bob, o.trim);
    // しっぽ
    if (o.dragon) {
      for (let i = 0; i < 8; i++) p.ellipse(cx + Math.sin(i / 2 + f) * 1.5, by + 4 + i * 1.6 + bob, 2.4 - i * 0.2, 1.4, i % 2 ? coat : coatD);
    } else {
      for (let k = -1; k <= 1; k++) seg(p, cx + k, by + bob, cx + k * 2 + (f === 1 ? 1 : -1), by + 12 + bob, k ? mane : shade(mane, 0.15), 1.8);
    }
  };
  return {
    frames: 3,
    size: (view) => (view === 'side' ? [W, 52] : [o.wings ? 64 : 36, 52]),
    rider: (view, f) => {
      const bob = view === 'side' ? (f === 1 ? -1 : 0) : f === 1 ? -1 : 0;
      if (view === 'side') return seat(35 + (o.wings ? 6 : 0), 26 - lift + bob, 34);
      return seat((o.wings ? 64 : 36) / 2, 27 - lift + bob, 34);
    },
    paint(p, view, f, layer) {
      if (view === 'side') side(p, f, layer);
      else if (view === 'front') front(p, f, layer);
      else back(p, f, layer);
    },
    fx: fly ? (p, view, f) => {
      // 足もとの 光の つぶ
      const w = view === 'side' ? W : o.wings ? 64 : 36;
      for (let i = 0; i < 5; i++) twinkle(p, (w * (i + 1)) / 6 + ((f + i) % 3) - 1, 46 + ((i * 3 + f * 2) % 5), rgba('#fff6c0', 0.8));
    } : null,
    shadowScale: 1.7,
  };
}

// ───────────── 型 2: 自転車・バイクの なかま ─────────────
// o.kind: 'bicycle' | 'mamachari' | 'unicycle' | 'tricycle' | 'police' | 'delivery'
function bikeArt(o) {
  const fr = o.color, frD = shade(fr, -0.3);
  const metal = '#c8ccd8';
  const motor = o.kind === 'police' || o.kind === 'delivery';
  const SW = o.kind === 'unicycle' ? 36 : 52;
  const side = (p, f, layer) => {
    const G = 50;
    if (o.kind === 'unicycle') {
      if (layer === 'back') return;
      wheel(p, 18, G - 7, 7, f, { rim: metal });
      seg(p, 18, G - 7, 18, 31, frD, 2);
      box(p, 14, 29, 9, 3, fr);
      // ペダル
      const a = f ? -1 : 1;
      seg(p, 18, G - 7, 18 + a * 3, G - 4, '#5a5a6a', 1.4);
      p.rect(17 + a * 3, G - 4, 3, 1, '#2a2630');
      return;
    }
    if (o.kind === 'tricycle') {
      if (layer === 'back') {
        wheel(p, 38, G - 4, 4, f, { rim: metal, spokes: false });
        return;
      }
      wheel(p, 14, G - 7, 7, f, { rim: '#f4f0e0' });
      wheel(p, 34, G - 4, 4, f, { rim: metal, spokes: false });
      seg(p, 14, G - 7, 17, 26, fr, 2.4);
      seg(p, 17, 29, 36, G - 6, fr, 2.4);
      seg(p, 32, G - 5, 41, G - 5, fr, 2);
      box(p, 26, 30, 9, 3, '#3a3a4a');
      seg(p, 16, 26, 20, 25, '#3a3a4a', 1.6);
      p.rect(19, 24, 3, 2, '#f4f0e0');
      // ペダル（前の 車輪の まんなか）
      const a = f ? -1 : 1;
      seg(p, 14, G - 7, 14 + a * 3, G - 4, '#5a5a6a', 1.4);
      p.rect(13 + a * 3, G - 4, 3, 1, '#2a2630');
      return;
    }
    const rw = motor ? 6.5 : 7.5;
    const fx = motor ? 9 : 10, bx = motor ? 41 : 40;
    if (layer === 'back') {
      // おくの ペダル
      if (!motor) { const a = f ? 1 : -1; seg(p, 26, G - 8, 26 + a * 3, G - 5, '#4a4a5a', 1.4); }
      return;
    }
    wheel(p, fx, G - rw, rw, f, { rim: motor ? '#8a8e9a' : metal, spokes: !motor });
    wheel(p, bx, G - rw, rw, f, { rim: motor ? '#8a8e9a' : metal, spokes: !motor });
    if (motor) {
      // エンジンと からだ
      const body = o.kind === 'police' ? '#f4f4f8' : o.color;
      seg(p, fx, G - rw, 15, 27, '#5a5a6a', 2);
      poly(p, [[14, 29], [24, 27], [36, 28], [42, G - 9], [24, G - 6], [16, G - 9]], body);
      p.rect(22, G - 10, 9, 5, '#5a5a6a');
      p.hline(23, 30, G - 8, '#8a8e9a');
      box(p, 27, 26, 13, 3, '#2a2630');
      if (o.kind === 'police') {
        poly(p, [[12, 21], [18, 19], [19, 28], [13, 29]], '#f4f4f8');
        p.hline(13, 18, 25, '#3a64c8');
        p.rect(14, 16, 4, 3, f ? '#ff5a5a' : '#c83a3a');
        p.rect(36, 22, 6, 4, '#f4f4f8');
        p.hline(36, 41, 24, '#3a64c8');
        seg(p, 40, 21, 41, 12, '#5a5a6a', 1);
        p.rect(14, 28, 2, 2, '#ffe070');
      } else {
        // 出前の 箱（うしろ）
        seg(p, 38, 26, 38, 21, '#8a8e9a', 1.4);
        box(p, 34, 12, 11, 10, '#d8dce6');
        p.hline(35, 43, 15, '#c83a3a');
        p.rect(37, 17, 5, 3, '#c83a3a');
        p.rect(38, 18, 3, 1, '#f4f0e0');
        poly(p, [[12, 20], [16, 18], [17, 26], [13, 27]], 'rgba(190,230,255,0.85)');
        p.rect(13, 28, 2, 2, '#ffe070');
      }
      // ハンドル
      seg(p, 14, 23, 19, 21, '#2a2630', 1.6);
      return;
    }
    // フレーム
    seg(p, bx, G - rw, 29, 30, fr, 2);
    seg(p, 29, 29, 26, G - 8, fr, 2);
    seg(p, 26, G - 8, bx, G - rw, fr, 1.6);
    seg(p, 29, 30, 15, 28, fr, 2);
    seg(p, 26, G - 8, 15, 29, fr, 2);
    seg(p, 15, 27, fx, G - rw, frD, 2);
    seg(p, 15, 27, 16, 22, '#5a5a6a', 1.6);
    seg(p, 13, 22, 19, 22, '#5a5a6a', 1.6);
    p.rect(12, 21, 3, 2, '#2a2630');
    box(p, 26, 27, 8, 3, '#2a2630');
    // てまえの ペダル と チェーンの カバー
    const a = f ? -1 : 1;
    p.ellipse(26, G - 8, 2.2, 2.2, '#8a8e9a');
    seg(p, 26, G - 8, 26 + a * 3, G - 5, '#5a5a6a', 1.4);
    p.rect(25 + a * 3, G - 5, 3, 1, '#2a2630');
    if (o.kind === 'mamachari') {
      // 前の かご と ネギ
      seg(p, 2, 18, 4, 14, '#5aa848', 1.6);
      seg(p, 4, 18, 3, 11, '#7ac860', 1.6);
      p.rect(3, 9, 2, 3, '#f4f4e8');
      box(p, 1, 18, 11, 7, '#c8ccd8');
      for (let x = 2; x < 11; x += 2) p.vline(x, 19, 23, '#8a8e9a');
      // どろよけ と うしろの にだい
      seg(p, 33, 31, 47, 31, '#c8ccd8', 1.4);
      seg(p, 47, 31, 46, 36, '#c8ccd8', 1.2);
    } else {
      // ベル
      p.rect(17, 20, 2, 2, '#ffe070');
    }
  };
  const front = (p, f, layer) => {
    const cx = 18, G = 50;
    if (o.kind === 'unicycle') {
      if (layer === 'back') return;
      wheelEdge(p, cx, G - 7, 7, 1.8, undefined, f);
      seg(p, cx, G - 7, cx, 32, frD, 2);
      box(p, cx - 3, 30, 6, 3, fr);
      for (const s of [-1, 1]) p.rect(cx + s * 3 - (s < 0 ? 2 : 0), G - 7 + (f ? s : -s) * 2, 2, 1, '#2a2630');
      return;
    }
    if (layer === 'back') {
      if (o.kind === 'tricycle') for (const s of [-1, 1]) wheelEdge(p, cx + s * 8, G - 4, 4, 1.6, undefined, f);
      return;
    }
    const r = o.kind === 'tricycle' ? 7 : motor ? 6.5 : 7.5;
    wheelEdge(p, cx, G - r, r, motor ? 2.4 : 1.6, undefined, f);
    seg(p, cx - 2, G - r, cx - 2, 26, frD, 1.4);
    seg(p, cx + 2, G - r, cx + 2, 26, frD, 1.4);
    if (motor) {
      const body = o.kind === 'police' ? '#f4f4f8' : o.color;
      box(p, cx - 6, 24, 12, 9, body, { r: 2 });
      p.ellipse(cx, 28, 2.4, 2.2, '#ffe070');
      if (o.kind === 'police') {
        p.rect(cx - 6, 21, 4, 3, f ? '#ff5a5a' : '#c83a3a');
        p.rect(cx + 2, 21, 4, 3, f ? '#c83a3a' : '#ff5a5a');
        p.hline(cx - 5, cx + 4, 32, '#3a64c8');
      } else {
        poly(p, [[cx - 5, 24], [cx + 5, 24], [cx + 4, 16], [cx - 4, 16]], 'rgba(190,230,255,0.75)');
      }
      seg(p, cx - 11, 23, cx + 11, 23, '#2a2630', 1.6);
      return;
    }
    seg(p, cx - 9, 23, cx + 9, 23, '#5a5a6a', 1.6);
    p.rect(cx - 11, 22, 3, 2, '#2a2630');
    p.rect(cx + 9, 22, 3, 2, '#2a2630');
    p.ellipse(cx, 27, 1.6, 1.6, '#ffe070');
    for (const s of [-1, 1]) p.rect(cx + s * 4 - 1, G - 7 + (f ? s : -s) * 2, 3, 1, '#2a2630');
    if (o.kind === 'mamachari') {
      box(p, cx - 6, 24, 12, 7, '#c8ccd8');
      for (let x = cx - 5; x < cx + 6; x += 2) p.vline(x, 25, 29, '#8a8e9a');
      // ネギ（顔に かからない ように みじかく。かごの よこから 出る）
      seg(p, cx - 4, 25, cx - 8, 20, '#7ac860', 1.6);
      seg(p, cx + 4, 25, cx + 7, 21, '#5aa848', 1.6);
      p.rect(cx - 10, 18, 2, 3, '#f4f4e8');
    }
  };
  const back = (p, f, layer) => {
    const cx = 18, G = 50;
    if (o.kind === 'unicycle') return front(p, f, layer === 'back' ? 'none' : layer);
    if (layer === 'back') {
      // ハンドル（人の むこう）
      seg(p, cx - 9, 23, cx + 9, 23, '#5a5a6a', 1.6);
      if (motor) seg(p, cx - 11, 23, cx + 11, 23, '#2a2630', 1.6);
      return;
    }
    if (o.kind === 'tricycle') {
      for (const s of [-1, 1]) wheelEdge(p, cx + s * 8, G - 4, 4, 1.6, undefined, f);
      seg(p, cx - 8, G - 5, cx + 8, G - 5, fr, 2);
      box(p, cx - 4, 30, 8, 3, '#3a3a4a');
      return;
    }
    const r = motor ? 6.5 : 7.5;
    wheelEdge(p, cx, G - r, r, motor ? 2.4 : 1.6, undefined, f);
    seg(p, cx, G - r, cx, 30, frD, 2);
    box(p, cx - 3, 29, 6, 3, '#2a2630');
    if (motor) {
      const body = o.kind === 'police' ? '#f4f4f8' : o.color;
      box(p, cx - 6, 32, 12, 6, body, { r: 2 });
      p.rect(cx - 4, 34, 2, 2, '#e04040');
      p.rect(cx + 2, 34, 2, 2, '#e04040');
      if (o.kind === 'delivery') {
        box(p, cx - 6, 16, 12, 11, '#d8dce6');
        p.hline(cx - 5, cx + 4, 19, '#c83a3a');
        p.rect(cx - 2, 21, 4, 3, '#c83a3a');
      } else {
        p.rect(cx - 2, 14, 4, 3, f ? '#ff5a5a' : '#c83a3a');
        seg(p, cx, 17, cx, 30, '#5a5a6a', 1);
      }
      return;
    }
    p.rect(cx - 1, G - r - 3, 3, 2, '#e04040');
    if (o.kind === 'mamachari') {
      box(p, cx - 6, 30, 12, 3, '#c8ccd8');
    }
  };
  return {
    frames: 2,
    size: (view) => (view === 'side' ? [SW, 52] : [36, 52]),
    rider: (view, f) => {
      if (motor) return view === 'side' ? seat(32, 30, 34) : seat(18, 31, 34);
      if (o.kind === 'unicycle') return stand(18, 41, f);
      if (o.kind === 'tricycle') return view === 'side' ? stand(29, 42, f) : stand(18, 42, f);
      return view === 'side' ? stand(30, 40, f) : stand(18, 41, f);
    },
    paint(p, view, f, layer) {
      if (view === 'side') side(p, f, layer);
      else if (view === 'front') front(p, f, layer);
      else back(p, f, layer);
    },
    shadowScale: 1.3,
  };
}

// ───────────── 型 3: 車・電車の なかま ─────────────
// o: body, len（よこの ながさ du）, h（車体の たかさ）, roof: 'cab'|'open'|'long'（電車・バス）, wheels, extra(p, view, f, layer, g)
function carArt(o) {
  const body = o.body, bodyD = shade(body, -0.25), bodyL = shade(body, 0.22);
  const glass = o.glass || '#5a7a9a', inner = '#2a2438';
  const len = o.len || 56, FW = o.fw || 40;
  const bh = o.h || 12; // 車体の たかさ
  const rr = o.wheelR || 5;
  const roof = o.roof || 'cab';
  const winH = o.winH || 16;
  const G = 50;
  const top = G - rr - bh; // 車体の 上
  const side = (p, f, layer) => {
    const x0 = 2, x1 = len - 2;
    const cab = o.cab || [Math.round(len * 0.32), Math.round(len * 0.78)];
    if (layer === 'back') {
      if (roof !== 'open') p.rect(cab[0] + 1, top - winH, cab[1] - cab[0] - 2, winH, inner);
      o.extra?.(p, 'side', f, 'back', { top, G, len, cab, rt: top - winH - 2 });
      return;
    }
    // 車体
    box(p, x0, top, x1 - x0, bh, body, { r: 2 });
    if (o.stripe) p.hline(x0 + 1, x1 - 1, top + Math.round(bh * 0.55), o.stripe);
    if (o.stripe2) p.hline(x0 + 1, x1 - 1, top + Math.round(bh * 0.55) + 1, o.stripe2);
    // まど わく と やね
    if (roof === 'cab' || roof === 'long') {
      const rt = top - winH - 2;
      box(p, cab[0], rt, cab[1] - cab[0], 3, o.roofCol || body, { r: 1 });
      p.vline(cab[0], rt, top, o.pillar || bodyD);
      p.vline(cab[0] + 1, rt + 1, top, o.pillar || bodyD);
      p.vline(cab[1] - 1, rt, top, o.pillar || bodyD);
      p.vline(cab[1] - 2, rt + 1, top, o.pillar || bodyD);
      if (roof === 'long') {
        // 電車・バスの まど（人は まんなかの まど）
        const n = o.windows || 3;
        const step = (cab[1] - cab[0]) / n;
        for (let i = 1; i < n; i++) {
          const x = Math.round(cab[0] + step * i);
          p.vline(x, rt + 2, top, o.pillar || bodyD);
          p.vline(x + 1, rt + 2, top, o.pillar || bodyD);
        }
      }
    } else if (roof === 'open') {
      // まえの ガラス
      poly(p, [[cab[0] - 1, top], [cab[0] + 1, top], [cab[0] - 2, top - 6], [cab[0] - 4, top - 6]], 'rgba(190,230,255,0.8)');
      seg(p, cab[0] - 1, top, cab[0] - 4, top - 6, '#c8ccd8');
    }
    // ライト
    p.rect(x0, top + 2, 2, 2, '#ffe070');
    p.rect(x1 - 2, top + 2, 2, 2, '#e04040');
    // 車輪
    const wx = o.wheelX || [x0 + rr + 4, x1 - rr - 4];
    for (const x of wx) {
      p.ellipse(x, G - rr, rr + 1, rr + 1, shade(body, -0.5));
      wheel(p, x, G - rr, rr, f, { rim: o.rim || '#c8ccd8', spokes: o.spokes ?? false });
    }
    o.extra?.(p, 'side', f, 'front', { top, G, len, cab, rt: top - winH - 2 });
  };
  const front = (p, f, layer) => {
    const cx = FW / 2;
    const w = o.fwBody || FW - 6;
    const x0 = cx - w / 2;
    if (layer === 'back') {
      if (roof !== 'open') p.rect(Math.round(x0 + 2), top - winH, Math.round(w - 4), winH, inner);
      o.extra?.(p, 'front', f, 'back', { top, G, cx, w, x0, rt: top - winH - 2 });
      return;
    }
    // タイヤ（下に すこし）
    for (const s of [-1, 1]) {
      const tx = Math.round(cx + s * (w / 2 - 3) - 2);
      p.rect(tx, G - 5, 5, 5, '#2a2630');
      p.hline(tx + 1, tx + 3, G - 4 + (f % 2) * 2, '#5a5662'); // タイヤの みぞ（まわって 見える）
    }
    box(p, x0, top, w, bh, body, { r: 2 });
    if (o.stripe) p.hline(Math.round(x0 + 1), Math.round(x0 + w - 2), top + Math.round(bh * 0.55), o.stripe);
    // ライト・グリル・ナンバー
    for (const s of [-1, 1]) p.ellipse(cx + s * (w / 2 - 4), top + 4, 2, 1.6, '#fff6c0');
    if (!o.noGrill) p.rect(Math.round(cx - 4), top + 3, 8, 3, shade(body, -0.4));
    p.rect(Math.round(cx - 3), top + bh - 4, 6, 2, '#f4f4e8');
    if (roof === 'cab' || roof === 'long') {
      const rt = top - winH - 2;
      box(p, x0 + 1, rt, w - 2, 3, o.roofCol || body, { r: 1 });
      for (const s of [0, 1]) {
        const x = s ? Math.round(x0 + w - 3) : Math.round(x0 + 1);
        p.vline(x, rt, top, o.pillar || bodyD);
        p.vline(x + 1, rt + 1, top, o.pillar || bodyD);
      }
    } else if (roof === 'open') {
      seg(p, x0 + 2, top - 5, x0 + w - 2, top - 5, '#c8ccd8');
      p.rect(Math.round(x0 + 3), top - 4, Math.round(w - 6), 4, 'rgba(190,230,255,0.55)');
    }
    o.extra?.(p, 'front', f, 'front', { top, G, cx, w, x0, rt: top - winH - 2 });
  };
  const back = (p, f, layer) => {
    const cx = FW / 2;
    const w = o.fwBody || FW - 6;
    const x0 = cx - w / 2;
    if (layer === 'back') {
      if (roof !== 'open') p.rect(Math.round(x0 + 2), top - winH, Math.round(w - 4), winH, inner);
      o.extra?.(p, 'back', f, 'back', { top, G, cx, w, x0, rt: top - winH - 2 });
      return;
    }
    for (const s of [-1, 1]) {
      const tx = Math.round(cx + s * (w / 2 - 3) - 2);
      p.rect(tx, G - 5, 5, 5, '#2a2630');
      p.hline(tx + 1, tx + 3, G - 4 + (f % 2) * 2, '#5a5662'); // タイヤの みぞ（まわって 見える）
    }
    box(p, x0, top, w, bh, body, { r: 2 });
    if (o.stripe) p.hline(Math.round(x0 + 1), Math.round(x0 + w - 2), top + Math.round(bh * 0.55), o.stripe);
    for (const s of [-1, 1]) p.rect(Math.round(cx + s * (w / 2 - 4) - 1), top + 3, 3, 2, '#e04040');
    p.rect(Math.round(cx - 3), top + bh - 4, 6, 2, '#f4f4e8');
    if (roof === 'cab' || roof === 'long') {
      const rt = top - winH - 2;
      box(p, x0 + 1, rt, w - 2, 3, o.roofCol || body, { r: 1 });
      for (const s of [0, 1]) {
        const x = s ? Math.round(x0 + w - 3) : Math.round(x0 + 1);
        p.vline(x, rt, top, o.pillar || bodyD);
        p.vline(x + 1, rt + 1, top, o.pillar || bodyD);
      }
    }
    o.extra?.(p, 'back', f, 'front', { top, G, cx, w, x0, rt: top - winH - 2 });
  };
  // 人の あたまが まどの まんなかに 来るように（こしは 車の 中）
  // （かみの 上の はしが まどの 上の すぐ下。やねで すこし かくれても よい）
  const riderY = roof === 'open' ? top - 22 : top - Math.max(winH, 16) - 3;
  return {
    frames: o.frames || 2,
    size: (view) => (view === 'side' ? [len, 52] : [FW, 52]),
    rider: (view, f) => {
      const bob = o.bob && f === 1 ? -1 : 0;
      const y = Math.round(riderY + bob + (o.riderDy || 0));
      const crop = Math.min(42, top + 2 - y);
      if (view === 'side') return { x: Math.round((o.seatX ?? (o.cab ? (o.cab[0] + o.cab[1]) / 2 : len * 0.55)) - 16), y, crop, frame: 0 };
      return { x: FW / 2 - 16, y, crop, frame: 0 };
    },
    paint(p, view, f, layer) {
      if (view === 'side') side(p, f, layer);
      else if (view === 'front') front(p, f, layer);
      else back(p, f, layer);
    },
    fx: o.fx ? (p, view, f) => o.fx(p, view, f, { w: view === 'side' ? len : FW, top, G }) : null,
    ghosts: o.ghosts,
    shadowScale: o.shadowScale || 1.8,
  };
}

// ───────────── 型 4: 板・ふしぎな 乗り物（立つ・すわる。うかぶ ことも） ─────────────
// o.lift … うく たかさ（du）。o.sit … すわる。o.paint(p, view, f, layer, g) … 板の 絵
function deckArt(o) {
  const SW = o.w || 44, FW = o.fw || 36;
  const lift = o.lift || 0;
  return {
    frames: o.frames || 2,
    size: (view) => (view === 'side' ? [SW, o.h || 52] : [FW, o.h || 52]),
    rider: (view, f) => {
      const bob = lift && f === 1 ? -1 : 0;
      const H = o.h || 52;
      const g = H - 2 - lift + bob - (o.deckY || 0);
      const cx = view === 'side' ? (o.cx ?? SW / 2) : FW / 2;
      if (o.sit) return seat(cx, g - (o.seatUp || 0), o.crop ?? 34, 0);
      return stand(cx, g, o.riderFrame === 'walk' ? f % 2 : o.riderFrame ?? 1);
    },
    paint(p, view, f, layer) {
      const H = o.h || 52;
      const bob = lift && f === 1 ? -1 : 0;
      const g = H - 2 - lift + bob - (o.deckY || 0);
      o.paint(p, view, f, layer, { g, w: view === 'side' ? SW : FW, cx: view === 'side' ? (o.cx ?? SW / 2) : FW / 2, H, lift });
    },
    fx: o.fx ? (p, view, f, ctx) => {
      const H = o.h || 52;
      const bob = lift && f === 1 ? -1 : 0;
      o.fx(p, view, f, { g: H - 2 - lift + bob - (o.deckY || 0), w: view === 'side' ? SW : FW, cx: view === 'side' ? (o.cx ?? SW / 2) : FW / 2, H, ...ctx });
    } : null,
    fxUnder: o.fxUnder,
    ghosts: o.ghosts,
    stretch: o.stretch,
    shadowScale: o.shadowScale || 1.2,
  };
}

// ───────────── それぞれの 乗り物 ─────────────
const ART = {};

// ───── ふつうの 乗り物 ─────
ART.kickboard = deckArt({
  w: 40, frames: 2, riderFrame: 'walk', deckY: 4,
  paint(p, view, f, layer, { g, w, cx }) {
    if (view === 'side') {
      if (layer === 'back') return;
      box(p, 8, g, 24, 2, '#3a8ad8');
      wheel(p, 9, g + 3, 2.4, f, { spokes: false, rim: '#f4f4f8' });
      wheel(p, 31, g + 3, 2.4, f, { spokes: false, rim: '#f4f4f8' });
      seg(p, 9, g, 11, g - 17, '#8a8e9a', 1.6);
      seg(p, 8, g - 17, 14, g - 17, '#2a2630', 1.6);
      return;
    }
    if (view === 'front') {
      if (layer === 'back') { box(p, cx - 3, g, 6, 3, '#3a8ad8'); return; }
      seg(p, cx, g + 3, cx, g - 13, '#8a8e9a', 1.6);
      seg(p, cx - 8, g - 13, cx + 8, g - 13, '#2a2630', 1.6);
      wheelEdge(p, cx, g + 3, 2.2, 1.4, undefined, f);
      return;
    }
    if (layer === 'back') { seg(p, cx - 8, g - 13, cx + 8, g - 13, '#2a2630', 1.6); seg(p, cx, g - 4, cx, g - 13, '#8a8e9a', 1.6); return; }
    box(p, cx - 3, g, 6, 3, '#3a8ad8');
    wheelEdge(p, cx, g + 3, 2.2, 1.4, undefined, f);
    p.rect(cx - 1, g + 1, 2, 1, '#e04040');
  },
});

ART.unicycle = bikeArt({ kind: 'unicycle', color: '#e0543a' });
ART.bicycle = bikeArt({ kind: 'bicycle', color: '#3a74d8' });
ART.horse = horseArt({ coat: '#a8683a', mane: '#3a2618', blaze: '#f4ecdc', saddle: '#a83a3a' });

// 空飛ぶじゅうたん（すわる）
const carpetPaint = (cols) => (p, view, f, layer, { g, w, cx }) => {
  const [main, edge, pat] = cols;
  const wave = f === 1 ? 1 : 0;
  if (view === 'side') {
    if (layer === 'back') return;
    for (let x = 4; x < w - 4; x++) {
      const y = g + Math.round(Math.sin((x + f * 4) / 4) * 0.8);
      p.vline(x, y - 1, y + 1, x < 6 || x > w - 7 ? edge : main);
      if (x % 4 === 0) p.set(x, y, pat);
    }
    for (const x of [3, w - 4]) for (let k = 0; k < 3; k++) p.set(x + (x < 10 ? -k : k), g + k - 1 + wave, '#f2c14e');
    return;
  }
  // 前・うしろ: ひし形の 板（おく が 上）
  const pts = [[cx - 15, g + 1], [cx + 15, g + 1], [cx + 11, g - 6], [cx - 11, g - 6]];
  if (layer === 'back') { poly(p, pts, main); return; }
  poly(p, [[cx - 16, g + 1], [cx + 16, g + 1], [cx + 15, g + 3 + wave], [cx - 15, g + 3 + wave]], edge);
  for (let x = cx - 14; x <= cx + 14; x += 3) p.set(x, g + 2, pat);
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) p.set(cx + s * (16 + k), g + 2 + k, '#f2c14e');
};
ART.carpet = deckArt({
  w: 48, fw: 40, sit: true, lift: 8, crop: 33, frames: 2, seatUp: 0,
  paint: carpetPaint(['#b8343a', '#7a1e2a', '#f2c14e']),
  fx(p, view, f, { g, w }) {
    for (let i = 0; i < 3; i++) twinkle(p, 6 + i * (w / 3) + f * 3, g + 6 + (i % 2) * 2, rgba('#fff2a8', 0.7));
  },
});

// ───── 職業の 乗り物 ─────
ART.armor_horse = horseArt({ coat: '#6a6a78', mane: '#2a2630', saddle: '#3a4a8a', armor: '#b8bcc8', trim: '#f2c14e' });
ART.white_horse = horseArt({ coat: '#f4f2ee', mane: '#d8d4e0', saddle: '#c83a3a', trim: '#f2c14e', hoof: '#5a4a3a', muzzle: '#f8e0d8' });
ART.pegasus = horseArt({ coat: '#f8f6ff', mane: '#a8d8f8', saddle: '#5a9ad8', wings: '#ffffff', fly: true, muzzle: '#f8e8f0' });
// 第41回 B: 水の馬（雪の女王・第5のせいれい。すきとおった 水色・白い しぶきの たてがみ）
ART.water_horse = horseArt({ coat: '#6cc4ee', mane: '#eafcff', saddle: '#3a8ed0', hoof: '#2e74b4', muzzle: '#a8e2fa' });
ART.hero_pegasus = horseArt({ coat: '#f4f0e8', mane: '#e8b030', saddle: '#2a4ab8', wings: '#ffe8a8', armor: '#f2c14e', trim: '#c83a3a', fly: true });
ART.baby_dragon = horseArt({ coat: '#4aa85a', mane: '#2a7a3a', saddle: '#a8683a', dragon: true, belly: '#e8e08a', spike: '#f2a03a', wings: '#7ac88a' });

// 黄色い雲（立つ）
const cloudPaint = (col, colD) => (p, view, f, layer, { g, w, cx }) => {
  const puff = (x, y, r, c) => p.ellipse(x, y, r, r * 0.8, c);
  if (view === 'side') {
    if (layer === 'back') return;
    for (let i = 0; i < 6; i++) puff(cx - 12 + i * 5, g + 2 + ((i + f) % 2), 4.2, i % 2 ? colD : col);
    puff(cx + 17, g + 1, 3, col);
    puff(cx + 22, g + 2, 2, col);
    for (let i = 0; i < 4; i++) puff(cx - 9 + i * 6, g - 1, 3.4, shade(col, 0.18));
    return;
  }
  if (layer === 'back') { for (let i = 0; i < 4; i++) puff(cx - 9 + i * 6, g - 2, 3.6, colD); return; }
  for (let i = 0; i < 5; i++) puff(cx - 12 + i * 6, g + 2 + ((i + f) % 2), 4, i % 2 ? colD : col);
  for (let i = 0; i < 3; i++) puff(cx - 6 + i * 6, g + 4, 3.2, shade(col, 0.15));
};
ART.cloud = deckArt({ w: 52, fw: 40, lift: 7, frames: 2, deckY: 1, paint: cloudPaint('#ffe070', '#f2b830') });

// 空飛ぶ本（すわる）
ART.book = deckArt({
  w: 46, fw: 40, sit: true, lift: 8, crop: 33, frames: 2,
  paint(p, view, f, layer, { g, cx }) {
    const cover = '#6a3a9a', page = '#fbf6e8', pageD = '#e0d6bc';
    const flap = f === 1 ? 1 : 0;
    if (view === 'side') {
      if (layer === 'back') { poly(p, [[cx + 2, g - 1], [cx + 18, g - 6 - flap], [cx + 19, g - 4 - flap], [cx + 3, g + 1]], page); return; }
      poly(p, [[cx - 18, g - 4 - flap], [cx, g], [cx, g + 3], [cx - 19, g - 1 - flap]], cover);
      poly(p, [[cx - 17, g - 5 - flap], [cx, g - 1], [cx, g + 1], [cx - 17, g - 3 - flap]], page);
      for (let x = cx - 14; x < cx - 2; x += 3) p.set(x, Math.round(g - 3 - flap + (x - cx + 14) * 0.18), pageD);
      p.rect(cx - 1, g, 3, 3, '#f2c14e');
      return;
    }
    if (layer === 'back') { p.rect(cx - 15, g - 6, 30, 5, page); return; }
    poly(p, [[cx - 17, g - 1 - flap], [cx, g + 1], [cx + 17, g - 1 - flap], [cx + 17, g + 2], [cx, g + 4], [cx - 17, g + 2]], cover);
    poly(p, [[cx - 16, g - 3 - flap], [cx, g - 1], [cx + 16, g - 3 - flap], [cx + 16, g - 1], [cx, g + 1], [cx - 16, g - 1]], page);
    p.vline(cx, g - 1, g + 3, pageD);
    p.rect(cx - 2, g + 2, 4, 2, '#f2c14e');
  },
  fx(p, view, f, { g, w }) {
    for (let i = 0; i < 4; i++) p.set(6 + i * (w / 4) + ((f + i) % 2) * 2, g + 5 + (i % 2) * 3, rgba('#c8a0ff', 0.8));
    for (let i = 0; i < 3; i++) twinkle(p, 10 + i * (w / 3), g - 30 + ((i + f) % 3) * 3, rgba('#e8d8ff', 0.6));
  },
});

// 大玉（立つ。玉が ころがる）
ART.big_ball = deckArt({
  w: 36, fw: 36, frames: 3, riderFrame: 1, deckY: 20,
  paint(p, view, f, layer, { cx, H }) {
    if (layer === 'back') return;
    const cy = H - 12;
    p.ellipse(cx, cy, 10.5, 10.5, '#e83a4a');
    for (let k = 0; k < 3; k++) {
      const a = (k * Math.PI) / 1.5 + f * 0.7;
      for (let r = -10; r <= 10; r++) {
        const x = cx + Math.cos(a) * r * 0.35, y = cy + r;
        if (Math.hypot(x - cx, y - cy) < 10) p.ellipse(x + Math.sin(a) * 4, y, 1.6, 0.8, k === 1 ? '#f4f0e0' : '#3a7ae0');
      }
    }
    p.ellipse(cx - 4, cy - 5, 2.4, 1.6, '#ff9aa8');
    for (let i = 0; i < 5; i++) twinkle(p, cx - 8 + i * 4, cy, '#ffe070');
  },
});

// ホッピング（ぴょんぴょん。コマで 上下）
ART.pogo = {
  frames: 3,
  size: () => [32, 60],
  rider: (view, f) => stand(16, 48 - [0, 6, 3][f], 1),
  paint(p, view, f, layer) {
    const up = [0, 6, 3][f];
    const cx = 16;
    if (view === 'back' ? layer === 'front' : layer === 'back') {
      // ハンドル
      seg(p, cx - 6, 30 - up, cx + 6, 30 - up, '#2a2630', 1.6);
    }
    if (layer === 'back') return;
    seg(p, cx, 31 - up, cx, 52 - up, '#e0543a', 2);
    // ばね
    for (let y = 50 - up; y < 58 - up + (f === 0 ? 0 : 2); y += 2) seg(p, cx - 2, y, cx + 2, y + 1, '#c8ccd8', 1);
    seg(p, cx - 4, 47 - up, cx + 4, 47 - up, '#8a8e9a', 1.6);
    if (view !== 'back') seg(p, cx - 6, 30 - up, cx + 6, 30 - up, '#2a2630', 1.6);
    p.rect(cx - 1, 58 - up + (f === 0 ? 0 : 1), 3, 1, '#2a2630');
  },
  fx(p, view, f) {
    if (f === 0) for (let i = -1; i <= 1; i++) p.set(16 + i * 5, 57, rgba('#d8c8a8', 0.8));
  },
  shadowScale: 0.8,
};

ART.taxi = carArt({
  body: '#f2c632', len: 56, h: 11, roof: 'cab', stripe: '#2a2630', cab: [16, 42],
  extra(p, view, f, layer, g) {
    if (layer !== 'front') return;
    // やねの「TAXI」の あんどん
    const y = g.rt - 3;
    if (view === 'side') { box(p, 25, y, 8, 3, '#f4f4e8'); p.hline(27, 30, y + 1, '#c83a3a'); }
    else { box(p, g.cx - 4, y, 8, 3, '#f4f4e8'); p.hline(g.cx - 2, g.cx + 1, y + 1, '#c83a3a'); }
    if (view === 'side') for (let x = 4; x < 52; x += 4) p.set(x, g.top + 6, '#2a2630');
  },
});
ART.limo = carArt({
  body: '#22202a', len: 72, h: 10, roof: 'cab', cab: [18, 58], windows: 2, pillar: '#121018', stripe: '#c8ccd8', rim: '#f2c14e', roofCol: '#2e2a38',
  extra(p, view, f, layer, g) {
    if (layer !== 'front') return;
    if (view === 'front') { p.rect(g.cx - 1, g.top - 2, 2, 2, '#f2c14e'); }
  },
});
ART.open_car = carArt({
  body: '#f07ab4', len: 56, h: 11, roof: 'open', cab: [18, 42], stripe: '#ffffff', rim: '#f4f4f8',
  fx(p, view, f, { w }) {
    // ハートと 音ぷ
    const c = rgba('#ff8ac8', 0.9);
    for (let i = 0; i < 3; i++) {
      const x = 6 + i * (w / 3) + ((f + i) % 2) * 2, y = 4 + ((i + f) % 3) * 3;
      p.set(x - 1, y, c); p.set(x + 1, y, c); p.hline(x - 2, x + 2, y + 1, c); p.hline(x - 1, x + 1, y + 2, c); p.set(x, y + 3, c);
    }
  },
});
// トロッコ（手こぎ）
ART.trolley = carArt({
  body: '#8a5a32', len: 44, h: 9, roof: 'open', cab: [12, 32], rim: '#8a8e9a', wheelR: 4, stripe: '#5a3a22', noGrill: true, bob: true,
  extra(p, view, f, layer, g) {
    if (layer !== 'front') return;
    // 手こぎの ぼう
    const a = f ? 4 : -4;
    if (view === 'side') { seg(p, 22, g.top, 22 + a, g.top - 9, '#5a5a6a', 1.6); seg(p, 18 + a, g.top - 9, 26 + a, g.top - 9, '#5a5a6a', 1.6); }
    else seg(p, g.cx - 7, g.top - 6 - (f ? 2 : 0), g.cx + 7, g.top - 6 - (f ? 2 : 0), '#5a5a6a', 1.6);
    // 線路
    if (view === 'side') { p.hline(0, 43, g.G - 1, '#6a6a78'); }
  },
});
ART.red_train = carArt({
  body: '#d8303a', len: 80, h: 16, roof: 'long', windows: 4, cab: [6, 74], stripe: '#f4f4f8', wheelR: 4, wheelX: [14, 26, 54, 66], seatX: 16, fw: 40,
  extra(p, view, f, layer, g) {
    if (layer !== 'front') return;
    const rt = g.rt;
    // パンタグラフ
    if (view === 'side') { seg(p, 36, rt, 40, rt - 5, '#5a5a6a'); seg(p, 44, rt, 40, rt - 5, '#5a5a6a'); p.hline(36, 44, rt - 5, '#5a5a6a'); p.hline(0, 79, g.G - 1, '#6a6a78'); }
    else { seg(p, g.cx - 4, rt, g.cx, rt - 5, '#5a5a6a'); seg(p, g.cx + 4, rt, g.cx, rt - 5, '#5a5a6a'); p.hline(g.cx - 4, g.cx + 4, rt - 5, '#5a5a6a'); }
    if (view === 'front') { box(p, g.cx - 7, g.rt + 3, 14, 3, '#2a2630'); p.hline(g.cx - 5, g.cx + 4, g.rt + 4, '#ff9a3a'); }
  },
  fx(p, view, f, { w }) {
    if (view !== 'side') return;
    for (let i = 0; i < 4; i++) p.hline(w - 2 + ((f * 3 + i * 5) % 6), w + 6, 14 + i * 7, rgba('#ffffff', 0.5));
  },
  shadowScale: 2.4,
});
ART.relief_car = carArt({
  body: '#2a7ae0', len: 44, h: 10, roof: 'open', cab: [16, 34], stripe: '#f4f4f8', rim: '#f4f4f8', wheelR: 4,
  extra(p, view, f, layer, g) {
    if (layer !== 'front') return;
    // 大きな ボール と ヘルメットの やね
    if (view === 'side') {
      p.ellipse(8, g.top - 4, 5, 5, '#f8f8f4');
      seg(p, 5, g.top - 7, 9, g.top - 1, '#e04040'); seg(p, 7, g.top - 8, 11, g.top - 2, '#e04040');
      seg(p, 36, g.top, 36, g.top - 22, '#c8ccd8', 1.2);
      box(p, 24, g.top - 26, 18, 4, '#1e3a8a');
    } else {
      p.ellipse(g.cx, g.top + 4, 4, 4, '#f8f8f4');
      for (const s of [-1, 1]) seg(p, g.cx + s * 12, g.top, g.cx + s * 12, g.top - 22, '#c8ccd8', 1.2);
      box(p, g.cx - 14, g.top - 26, 28, 4, '#1e3a8a');
    }
  },
});
ART.town_bus = carArt({
  body: '#3aa868', len: 72, h: 14, roof: 'long', windows: 4, cab: [6, 66], stripe: '#f4f0e0', wheelR: 5, wheelX: [16, 56], seatX: 18, roofCol: '#f4f0e0',
  extra(p, view, f, layer, g) {
    if (layer !== 'front') return;
    if (view === 'front') { box(p, g.cx - 7, g.rt + 3, 14, 3, '#2a2630'); p.hline(g.cx - 5, g.cx + 4, g.rt + 4, '#ffe070'); }
    if (view === 'side') { p.rect(46, g.rt + 3, 6, g.top + 9 - g.rt - 3, '#2a6a48'); p.vline(49, g.rt + 4, g.top + 8, '#5a7a9a'); }
  },
  shadowScale: 2.2,
});
ART.tricycle = bikeArt({ kind: 'tricycle', color: '#e0343a' });
ART.police_bike = bikeArt({ kind: 'police', color: '#f4f4f8' });
ART.fire_truck = carArt({
  body: '#d8303a', len: 72, h: 14, roof: 'cab', cab: [6, 26], stripe: '#f4f4f8', wheelR: 5, wheelX: [16, 58], seatX: 16, rim: '#f4f4f8',
  extra(p, view, f, layer, g) {
    if (layer !== 'front') return;
    const rt = g.rt;
    if (view === 'side') {
      // はしご
      seg(p, 26, g.top - 3, 70, g.top - 3, '#c8ccd8', 1.6);
      seg(p, 26, g.top - 7, 70, g.top - 7, '#c8ccd8', 1.6);
      for (let x = 28; x < 70; x += 4) p.vline(x, g.top - 7, g.top - 3, '#c8ccd8');
      p.rect(10, rt - 3, 3, 3, f ? '#ff5a5a' : '#8a1a1a');
      p.rect(20, rt - 3, 3, 3, f ? '#8a1a1a' : '#ff5a5a');
      // ホース
      p.ellipse(52, g.top + 6, 4, 3, '#f4f0e0');
      p.ellipse(52, g.top + 6, 2, 1.4, '#c8b88a');
    } else {
      p.rect(g.cx - 8, rt - 3, 4, 3, f ? '#ff5a5a' : '#8a1a1a');
      p.rect(g.cx + 4, rt - 3, 4, 3, f ? '#8a1a1a' : '#ff5a5a');
      if (view === 'back') for (let y = rt; y < g.top + 8; y += 3) p.hline(g.cx - 4, g.cx + 4, y, '#c8ccd8');
    }
  },
  shadowScale: 2.2,
});
// 屋台（のれん）
ART.food_cart = carArt({
  body: '#a8743a', len: 52, h: 12, roof: 'open', cab: [16, 40], stripe: '#7a4a22', rim: '#c8a070', wheelR: 6, wheelX: [26], spokes: true, noGrill: true,
  extra(p, view, f, layer, g) {
    if (layer !== 'front') return;
    const y = g.top - 24;
    const sway = f ? 1 : 0;
    if (view === 'side') {
      seg(p, 4, g.top, 4, y, '#7a4a22', 1.6); seg(p, 48, g.top, 48, y, '#7a4a22', 1.6);
      poly(p, [[0, y], [52, y], [50, y - 5], [2, y - 5]], '#c83a3a');
      for (let x = 2; x < 50; x += 6) p.rect(x, y - 4, 3, 4, '#f4f0e0');
      for (let x = 6; x < 46; x += 8) p.rect(x + sway, y + 1, 6, 5, '#2a3a6a');
      // ちょうちん
      p.ellipse(4, y + 9, 2, 2.6, '#ff6a3a');
      // かじ棒
      seg(p, 48, g.top + 4, 52, g.top + 2, '#7a4a22', 1.6);
    } else {
      for (const s of [-1, 1]) seg(p, g.cx + s * 16, g.top, g.cx + s * 16, y, '#7a4a22', 1.6);
      box(p, g.cx - 19, y - 5, 38, 5, '#c83a3a', { r: 0 });
      for (let x = g.cx - 17; x < g.cx + 17; x += 6) p.rect(x, y - 4, 3, 4, '#f4f0e0');
      if (view === 'front') for (let x = g.cx - 15; x < g.cx + 15; x += 8) p.rect(x + sway, y + 1, 6, 5, '#2a3a6a');
      p.ellipse(g.cx - 16, y + 9, 2, 2.6, '#ff6a3a');
    }
  },
});
ART.delivery_bike = bikeArt({ kind: 'delivery', color: '#e0543a' });
// キャスターつきの いす
ART.roll_chair = deckArt({
  w: 32, fw: 32, sit: true, crop: 34, frames: 2, deckY: 9, seatUp: 0,
  paint(p, view, f, layer, { g, cx, H }) {
    const G = H - 2;
    const seatC = '#3a3a4a';
    if (view === 'side') {
      if (layer === 'back') { box(p, cx + 4, g - 18, 5, 18, seatC, { r: 2 }); return; }
      box(p, cx - 8, g - 1, 16, 4, seatC, { r: 1 });
      seg(p, cx, g + 3, cx, G - 3, '#8a8e9a', 1.6);
      seg(p, cx - 7, G - 3, cx + 7, G - 3, '#5a5a6a', 1.4);
      for (const x of [cx - 7, cx + 7]) p.ellipse(x + (f ? 1 : 0), G - 1, 1.6, 1.6, '#2a2630');
      seg(p, cx - 6, g - 5, cx + 2, g - 5, '#5a5a6a', 1.2);
      return;
    }
    if (view === 'front') {
      if (layer === 'back') { box(p, cx - 8, g - 20, 16, 14, seatC, { r: 3 }); return; }
      box(p, cx - 9, g - 1, 18, 4, seatC, { r: 1 });
    } else {
      if (layer === 'back') return;
      box(p, cx - 8, g - 22, 16, 18, seatC, { r: 3 });
      box(p, cx - 9, g - 1, 18, 4, seatC, { r: 1 });
    }
    seg(p, cx, g + 3, cx, G - 3, '#8a8e9a', 1.6);
    seg(p, cx - 8, G - 3, cx + 8, G - 3, '#5a5a6a', 1.4);
    for (const x of [cx - 8, cx, cx + 8]) p.ellipse(x + (f ? 1 : 0), G - 1, 1.4, 1.4, '#2a2630');
  },
});
// 闇の つばさ（うかぶ）
const wingPaint = (c, cD, n = 6) => (p, view, f, layer, { g, cx }) => {
  if (layer !== 'back') return;
  const up = f === 1 ? -6 : f === 2 ? 3 : 0;
  const sh = g - 22; // せなか（かたの すこし 下）
  const one = (s, k = 1) => {
    for (let i = 0; i < n; i++) {
      const len = (20 - i * 2.2) * k;
      seg(p, cx + s * 3, sh + i * 1.4, cx + s * (4 + len), sh - 12 + up + i * 3.2, i % 2 ? cD : c, 2.8);
    }
    // はねの ふち（むらさきの ひかり）
    p.set(cx + s * (4 + 20 * k), sh - 12 + up, '#8a5ab8');
  };
  if (view === 'side') one(1, 0.85);
  else { one(-1); one(1); }
};
ART.dark_wings = deckArt({
  w: 48, fw: 64, lift: 10, frames: 3, riderFrame: 1,
  paint: wingPaint('#3a2a4a', '#1e1428'),
  fx(p, view, f, { g, w }) {
    // まいおちる 黒い 羽
    for (let i = 0; i < 4; i++) {
      const x = 8 + i * (w / 4) + ((f + i) % 3) * 2, y = g - 6 + ((i * 5 + f * 4) % 12);
      p.set(x, y, rgba('#2a1e3a', 0.85)); p.set(x + 1, y + 1, rgba('#2a1e3a', 0.85)); p.set(x + 2, y + 1, rgba('#6a4a8a', 0.7));
    }
  },
});
// ぶくう術（気の オーラ と 風）
ART.bukujutsu = deckArt({
  w: 44, fw: 40, lift: 10, frames: 3, riderFrame: 1,
  paint() {},
  fxUnder: true,
  fx(p, view, f, { g, cx, w }) {
    const top = g - 44;
    const edge = rgba('#fffbe0', 0.85), mid = rgba('#ffe64a', 0.55), core = rgba('#ffffff', 0.22);
    const col = mid;
    // ほのおの ような オーラ（ふちは あかるく、中は うすく）
    for (let y = top; y <= g + 2; y++) {
      const t = (y - top) / (g + 2 - top);
      const half = 6 + Math.sin(t * Math.PI) * 11 + Math.sin(y * 0.9 + f * 2) * 1.5;
      const L = Math.round(cx - half), R = Math.round(cx + half);
      p.hline(L, R, y, core);
      p.hline(L, L + 1, y, edge); p.hline(R - 1, R, y, edge);
      p.set(L + 2, y, mid); p.set(R - 2, y, mid);
    }
    // ほのおの 先
    for (let k = -2; k <= 2; k++) poly(p, [[cx + k * 4 - 2, top + 3], [cx + k * 4 + 2, top + 3], [cx + k * 4 + ((f + k) % 2), top - 5 - (k === 0 ? 3 : 0)]], col);
    // 風の 線（うしろへ）
    if (view === 'side') for (let i = 0; i < 4; i++) p.hline(Math.round(cx + 12 + ((f * 4 + i * 3) % 8)), w - 1, top + 10 + i * 8, rgba('#ffffff', 0.6));
    else for (let i = 0; i < 3; i++) p.vline(Math.round(cx - 14 + i * 14), g + 2 + ((f + i) % 3), g + 8, rgba('#ffffff', 0.6));
  },
  shadowScale: 1,
});
// 大きな ドローン（立つ）
ART.drone = deckArt({
  w: 52, fw: 52, lift: 10, frames: 2, deckY: 2,
  paint(p, view, f, layer, { g, cx }) {
    if (layer === 'back') {
      if (view !== 'side') for (const s of [-1, 1]) { seg(p, cx + s * 6, g - 1, cx + s * 18, g - 4, '#3a3a4a', 1.6); p.ellipse(cx + s * 18, g - 5, f ? 6 : 2, 1, '#8a8e9a'); }
      return;
    }
    box(p, cx - 9, g, 18, 4, '#e8eaf0', { r: 1 });
    p.hline(cx - 7, cx + 7, g + 2, '#3a8ad8');
    const arms = view === 'side' ? [-1, 1] : [-1, 1];
    for (const s of arms) {
      seg(p, cx + s * 8, g + 1, cx + s * 21, g + 3, '#3a3a4a', 1.6);
      p.vline(cx + s * 21, g, g + 3, '#3a3a4a');
      p.ellipse(cx + s * 21, g - 1, f ? 7 : 2.5, 1, '#8a8e9a');
    }
    // カメラ
    p.rect(cx - 2, g + 4, 4, 3, '#2a2630');
    p.set(cx, g + 5, '#e04040');
  },
});
ART.kart = carArt({
  body: '#3ac85a', len: 44, h: 7, roof: 'open', cab: [14, 30], stripe: '#ffe070', wheelR: 4, wheelX: [9, 35], rim: '#f4f4f8',
  extra(p, view, f, layer, g) {
    if (layer !== 'front') return;
    if (view === 'side') { box(p, 34, g.top - 6, 8, 3, '#2a2630'); seg(p, 38, g.top - 3, 38, g.top, '#5a5a6a'); }
    else if (view === 'back') { box(p, g.cx - 10, g.top - 6, 20, 3, '#2a2630'); }
    if (view !== 'back') { p.ellipse(view === 'side' ? 4 : g.cx, g.top + 3, 1.6, 1.6, '#ffe070'); }
  },
  fx(p, view, f, { w }) {
    if (view === 'side') for (let i = 0; i < 2; i++) p.ellipse(w - 2 + ((f + i) % 2) * 3, 44 - i * 3, 2, 1.6, rgba('#d8d8e8', 0.6));
  },
});
ART.mamachari = bikeArt({ kind: 'mamachari', color: '#e8e4dc' });
ART.spy_car = carArt({
  body: '#1e1c26', len: 60, h: 9, roof: 'cab', cab: [20, 42], winH: 12, stripe: '#5a5a6a', rim: '#c8ccd8', pillar: '#121018', glass: '#3a4a5a',
});
// ターボつき スケボー（けむり）
ART.skateboard = deckArt({
  w: 40, fw: 32, frames: 2, riderFrame: 0, deckY: 4,
  paint(p, view, f, layer, { g, cx }) {
    if (view === 'side') {
      if (layer === 'back') return;
      poly(p, [[6, g - 1], [34, g - 1], [36, g - 3], [35, g + 1], [5, g + 1], [4, g - 3]], '#e0543a');
      p.hline(7, 33, g - 1, '#ffe070');
      wheel(p, 10, g + 3, 2.2, f, { spokes: false, rim: '#f4f4f8' });
      wheel(p, 30, g + 3, 2.2, f, { spokes: false, rim: '#f4f4f8' });
      // ターボ
      box(p, 31, g - 4, 5, 3, '#8a8e9a');
      return;
    }
    if (layer === 'back') return;
    box(p, cx - 6, g - 1, 12, 3, '#e0543a');
    for (const s of [-1, 1]) p.rect(cx + s * 5 - 1, g + 2, 2, 3, '#2a2630');
    if (view === 'back') box(p, cx - 2, g - 3, 4, 3, '#8a8e9a');
  },
  fx(p, view, f, { g, w, cx }) {
    const c = rgba('#d8d8e8', 0.7);
    if (view === 'side') for (let i = 0; i < 3; i++) p.ellipse(38 + i * 3 + f * 2, g - 2 - i * 0.6, 1.8 + i * 0.5, 1.6 + i * 0.4, c);
    else if (view === 'back') for (let i = 0; i < 3; i++) p.ellipse(cx + ((i + f) % 2 ? 1 : -1), g + 1 + i * 2, 1.6 + i * 0.6, 1, c);
    else for (let i = 0; i < 2; i++) p.ellipse(cx + (i ? 6 : -6), g - 1 - f, 1.4, 1.2, c);
  },
});
// 竹とんぼプロペラ（頭の 上）
ART.propeller = deckArt({
  w: 40, fw: 40, lift: 10, h: 60, frames: 2, riderFrame: 1,
  paint(p, view, f, layer, { g, cx }) {
    if (layer !== 'front') return;
    const top = g - 40 + 4; // 頭の てっぺん
    p.vline(cx, top - 4, top + 1, '#c8a050');
    p.ellipse(cx, top + 1, 1.6, 1, '#f2c14e');
    const half = f ? 10 : 4;
    seg(p, cx - half, top - 5, cx + half, top - 5, '#e8c070', 1.8);
    if (f) { p.set(cx - half, top - 5, '#c8a050'); p.set(cx + half, top - 5, '#c8a050'); }
  },
  fx(p, view, f, { g, cx }) {
    const top = g - 40 + 4;
    p.ellipse(cx, top - 5, 11, 1.6, rgba('#f4e8c0', 0.35));
  },
});
// ハスの 葉
ART.lotus = deckArt({
  w: 44, fw: 40, lift: 3, frames: 2, deckY: 1,
  paint(p, view, f, layer, { g, cx }) {
    const leaf = '#4aa84a', leafD = '#2a7a3a';
    if (view === 'side') {
      if (layer === 'back') return;
      p.ellipse(cx, g + 1, 18, 2.4, leaf);
      p.hline(cx - 16, cx + 16, g + 2, leafD);
      // 花
      for (const s of [-1, 0, 1]) p.ellipse(cx - 14 + s * 1.6, g - 2 - (s ? 0 : 1), 1.6, 2.4, '#f8a8c8');
      p.set(cx - 14, g - 2, '#ffe070');
      return;
    }
    if (layer === 'back') { p.ellipse(cx, g - 1, 16, 4, leafD); return; }
    p.ellipse(cx, g + 1, 17, 4.5, leaf);
    for (let i = -3; i <= 3; i++) seg(p, cx, g + 1, cx + i * 5, g + 1 + (i % 2 ? 2 : 3), leafD);
    poly(p, [[cx - 1, g - 3], [cx + 1, g - 3], [cx, g + 1]], view === 'front' ? leaf : leafD);
    for (const s of [-1, 0, 1]) p.ellipse(cx + 12 + s * 1.6, g - 1 - (s ? 0 : 1), 1.6, 2.4, '#f8a8c8');
    p.set(cx + 12, g - 1, '#ffe070');
  },
  fx(p, view, f, { g, cx }) {
    const c = rgba('#bfe8ff', 0.7);
    for (const s of [-1, 1]) p.hline(Math.round(cx + s * (19 + f * 2)) - 1, Math.round(cx + s * (19 + f * 2)) + 1, g + 2, c);
  },
});
// 桜の 風（花びら と 残像）
ART.sakura_dash = deckArt({
  w: 48, fw: 40, frames: 3, riderFrame: 0, deckY: 0,
  paint() {},
  ghosts: [{ dx: 7, a: 0.32 }, { dx: 13, a: 0.16 }],
  fx(p, view, f, { g, w, cx }) {
    const pet = ['#ffc0d8', '#ff9ac0', '#fff0f6'];
    for (let i = 0; i < 9; i++) {
      const x = ((i * 11 + f * 5) % (w - 4)) + 2, y = g - 4 - ((i * 7 + f * 3) % 34);
      const c = rgba(pet[i % 3], 0.9);
      p.set(x, y, c); p.set(x + 1, y, c); p.set(x, y + 1, c);
    }
    if (view === 'side') for (let i = 0; i < 3; i++) p.hline(Math.round(cx + 10), w - 2, g - 30 + i * 10 + f, rgba('#ffffff', 0.45));
  },
  shadowScale: 1,
});
// 白い ハンググライダー
ART.glider = deckArt({
  w: 56, fw: 72, lift: 14, frames: 2, riderFrame: 1, h: 62,
  paint(p, view, f, layer, { g, cx }) {
    const sail = '#f8f8fc', sailD = '#c8cce0';
    const top = g - 44; // 頭の 上
    const sway = f ? 1 : 0;
    if (view === 'side') {
      if (layer === 'back') {
        // つばさ（よこから: うすい くさび形）
        poly(p, [[cx - 24, top + 3 + sway], [cx + 24, top - 4 - sway], [cx + 22, top + 1 - sway], [cx - 20, top + 6 + sway]], sail);
        p.hline(cx - 16, cx + 18, top + 2, sailD);
        seg(p, cx - 1, top + 2, cx + 6, top + 22, '#8a8e9a', 1);
        return;
      }
      // にぎる ぼう（顔の まえを よこぎらない）
      seg(p, cx - 1, top + 2, cx - 10, top + 25, '#8a8e9a', 1);
      seg(p, cx - 12, top + 25, cx - 6, top + 25, '#8a8e9a', 1.4);
      return;
    }
    if (layer === 'back') {
      poly(p, [[cx, top - 6], [cx + 34, top + 6 + sway], [cx, top + 2], [cx - 34, top + 6 - sway]], view === 'back' ? sailD : sail);
      p.vline(cx, top - 6, top + 2, '#8a8e9a');
      return;
    }
    // そうじゅうの ぼう（むねの たかさ。顔の よこを とおる）
    for (const sd of [-1, 1]) seg(p, cx + sd * 10, top + 2, cx + sd * 12, top + 25, '#8a8e9a', 1);
    seg(p, cx - 12, top + 25, cx + 12, top + 25, '#8a8e9a', 1.4);
  },
  fx(p, view, f, { g, w }) {
    for (let i = 0; i < 3; i++) twinkle(p, 6 + i * (w / 3) + f * 4, 6 + ((i + f) % 2) * 4, rgba('#ffffff', 0.7));
  },
  shadowScale: 1.6,
});
// れん成の 石車
ART.rock_cart = carArt({
  body: '#8a8274', len: 52, h: 12, roof: 'open', cab: [16, 38], stripe: '#6a6458', rim: '#a8a090', wheelR: 6, spokes: false, noGrill: true,
  extra(p, view, f, layer, g) {
    if (layer !== 'front') return;
    // 石の もよう と れん成の 光の わ
    const cx = view === 'side' ? 26 : g.cx;
    for (let i = 0; i < 5; i++) p.set(cx - 18 + i * 9, g.top + 3 + (i % 2) * 4, '#6a6458');
    const ring = rgba('#7af0ff', 0.9);
    const r = 4;
    for (let a = 0; a < 16; a++) p.set(cx + Math.cos(a / 16 * Math.PI * 2) * r, g.top + 6 + Math.sin(a / 16 * Math.PI * 2) * r * 0.8, f ? ring : '#5ad8f0');
    p.set(cx, g.top + 6, '#5ad8f0');
  },
  fx(p, view, f, { w }) {
    if (f) for (let i = 0; i < 4; i++) p.set(4 + i * (w / 4), 46 + (i % 2) * 2, rgba('#9af8ff', 0.8));
  },
});
ART.pirate_cart = carArt({
  body: '#8a5a32', len: 60, h: 11, roof: 'open', cab: [18, 44], stripe: '#f2c14e', rim: '#c8a070', spokes: true, wheelR: 5, noGrill: true,
  extra(p, view, f, layer, g) {
    const sway = f ? 1 : 0;
    if (layer === 'back') {
      // マスト と ほ（人の うしろ）
      const mx = view === 'side' ? 40 : g.cx + 8;
      seg(p, mx, g.top, mx, g.top - 30, '#5a3a22', 1.6);
      poly(p, [[mx - 1, g.top - 28], [mx - 1, g.top - 12], [mx - 13 - sway, g.top - 14], [mx - 11 - sway, g.top - 27]], '#f4f0e0');
      p.hline(mx - 10, mx - 2, g.top - 20, '#c83a3a');
      poly(p, [[mx, g.top - 30], [mx + 8, g.top - 28], [mx, g.top - 26]], '#2a2630');
      return;
    }
    if (view === 'side') {
      // へさき
      poly(p, [[2, g.top], [8, g.top], [6, g.top - 6], [0, g.top - 4]], '#8a5a32');
      for (let x = 10; x < 56; x += 7) p.ellipse(x, g.top + 5, 1.4, 1.4, '#3a2a22');
    } else for (let x = g.x0 + 4; x < g.x0 + g.w - 3; x += 7) p.ellipse(x, g.top + 5, 1.4, 1.4, '#3a2a22');
  },
});
// ゴムの ロケット（うでを のばす）
ART.gomu_rocket = deckArt({
  w: 64, fw: 44, lift: 6, frames: 3, riderFrame: 1, cx: 40,
  paint() {},
  stretch: true,
  fx(p, view, f, { g, cx, w }) {
    // ばねの ような 線（足もと）と けむり
    const c = rgba('#ffffff', 0.6);
    if (view === 'side') {
      for (let i = 0; i < 3; i++) p.hline(Math.round(cx + 10 + ((f * 4 + i * 5) % 10)), w - 1, g - 28 + i * 9, c);
    } else for (let i = -1; i <= 1; i++) p.ellipse(cx + i * 10, g + 3 + ((f + i + 3) % 3), 3, 1.6, rgba('#e8e0d0', 0.6));
  },
  shadowScale: 1,
});
// 忍び走り（残像 と 線）
ART.ninja_dash = deckArt({
  w: 52, fw: 40, frames: 3, riderFrame: 0,
  paint() {},
  ghosts: [{ dx: 8, a: 0.35 }, { dx: 15, a: 0.18 }],
  fx(p, view, f, { g, w, cx }) {
    const c = rgba('#d8f0ff', 0.75);
    if (view === 'side') for (let i = 0; i < 5; i++) p.hline(Math.round(cx + 9 + ((f * 5 + i * 7) % 9)), w - 1, g - 36 + i * 8, c);
    else for (let i = 0; i < 4; i++) p.vline(Math.round(cx - 15 + i * 10), g - 6 + ((f + i) % 3) * 2, g + 1, c);
    // 木の葉
    for (let i = 0; i < 3; i++) { const x = (i * 17 + f * 6) % (w - 4) + 2, y = g - 8 - i * 9; p.set(x, y, rgba('#5ac85a', 0.9)); p.set(x + 1, y + 1, rgba('#3a9a3a', 0.9)); }
  },
  shadowScale: 1,
});
// 大きな ぷるりん（すわる）
ART.slime = deckArt({
  w: 44, fw: 40, sit: true, crop: 33, frames: 2, deckY: 13, seatUp: 0,
  paint(p, view, f, layer, { g, cx, H }) {
    const G = H - 2;
    const sq = f ? 1 : 0;
    const col = '#4a8ae0', colL = '#8ac0ff', colD = '#2a5aa8';
    if (layer === 'back') { if (view !== 'back') p.ellipse(cx, g - 2 + sq, 12, 6, colD); return; }
    p.ellipse(cx, G - 7 + sq, 17 + sq, 8 - sq, col);
    p.ellipse(cx, g + 1 + sq, 12, 5, col);
    p.ellipse(cx - 6, G - 11 + sq, 4, 2.4, colL);
    if (view === 'back') return;
    const ex = view === 'side' ? cx - 9 : cx;
    for (const s of (view === 'side' ? [0] : [-1, 1])) {
      p.rect(Math.round(ex + s * 6 - 1), G - 9 + sq, 3, 4, '#1b1330');
      p.set(Math.round(ex + s * 6 - 1), G - 9 + sq, '#ffffff');
    }
    seg(p, ex - 3, G - 3 + sq, ex + 3, G - 3 + sq, '#1b1330');
  },
});
// ほうき星（立つ。光の 尾）
ART.shooting_star = deckArt({
  w: 56, fw: 40, lift: 9, frames: 2, deckY: 2,
  paint(p, view, f, layer, { g, cx }) {
    if (layer === 'back') return;
    const star = (x, y, r, c) => {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
        pts.push([x + Math.cos(a) * rr * 1.3, y + Math.sin(a) * rr * 0.6]);
      }
      poly(p, pts, c);
    };
    star(cx, g + 1, 10, '#ffe070');
    star(cx, g + 1, 5, '#fff6c0');
  },
  fxUnder: true,
  fx(p, view, f, { g, cx, w }) {
    const cols = ['#ff9ac8', '#ffe070', '#9ad8ff'];
    if (view === 'side') {
      for (let k = 0; k < 3; k++) for (let x = cx + 8; x < w - 1; x++) p.set(x, g + 1 + (k - 1) * 2 + Math.round(Math.sin((x + f * 3) / 3) * 0.6), rgba(cols[k], 0.75 - (x - cx) / (w * 1.8)));
    } else for (let k = 0; k < 3; k++) for (let y = g + 4; y < g + 12; y++) p.set(cx + (k - 1) * 4 + ((y + f) % 2), y, rgba(cols[k], 0.7 - (y - g) / 20));
    for (let i = 0; i < 4; i++) twinkle(p, 4 + i * (w / 4) + f * 3, g - 34 + ((i + f) % 3) * 9, rgba('#ffffff', 0.85));
  },
});
ART.swan_boat = carArt({
  body: '#f4f2f8', len: 52, h: 12, roof: 'open', cab: [18, 40], stripe: '#9ad8f8', rim: '#c8ccd8', wheelR: 4, noGrill: true,
  extra(p, view, f, layer, g) {
    if (layer !== 'front') return;
    if (view === 'side') {
      // 白鳥の くび と 頭
      seg(p, 8, g.top + 2, 6, g.top - 12, '#f4f2f8', 3.4);
      p.ellipse(9, g.top - 14, 3.6, 2.8, '#f4f2f8');
      poly(p, [[12, g.top - 15], [17, g.top - 13], [12, g.top - 12]], '#f2a03a');
      p.set(9, g.top - 15, '#1b1330');
      // はね
      poly(p, [[30, g.top + 1], [48, g.top - 3], [44, g.top + 5], [30, g.top + 6]], '#e4e2ec');
    } else if (view === 'front') {
      // 白鳥の 顔（ボートの まえ。乗る 人の 顔を かくさない）
      p.ellipse(g.cx, g.top + 3, 3.6, 3.2, '#f4f2f8');
      p.rect(g.cx - 1, g.top + 4, 3, 3, '#f2a03a');
      p.set(g.cx - 2, g.top + 2, '#1b1330'); p.set(g.cx + 2, g.top + 2, '#1b1330');
    } else {
      poly(p, [[g.cx - 6, g.top], [g.cx + 6, g.top], [g.cx, g.top - 6]], '#e4e2ec');
    }
  },
  fx(p, view, f, { w }) {
    for (let i = 0; i < 3; i++) p.hline(4 + i * (w / 3) + f * 2, 7 + i * (w / 3) + f * 2, 47, rgba('#9ad8ff', 0.7));
  },
});
ART.kei_truck = carArt({
  body: '#f0f0f4', len: 56, h: 10, roof: 'cab', cab: [6, 22], wheelR: 4, wheelX: [12, 44], seatX: 14, stripe: '#3a64b0', rim: '#c8ccd8',
  extra(p, view, f, layer, g) {
    if (layer !== 'front') return;
    if (view === 'side') {
      // にだいの あおり・エアコンの 外の 機械・はしご
      p.rect(24, g.top - 4, 30, 2, '#d8d8e0');
      p.vline(53, g.top - 4, g.top, '#d8d8e0');
      box(p, 30, g.top - 12, 14, 9, '#e8e8e0');
      p.ellipse(35, g.top - 7.5, 3.2, 3.2, '#8a8e9a');
      for (let a = 0; a < 4; a++) p.set(35 + Math.round(Math.cos(a + f) * 2), g.top - 7.5 + Math.round(Math.sin(a + f) * 2), '#3a3a4a');
      for (let y = g.top - 11; y < g.top - 4; y += 2) p.hline(40, 43, y, '#a8a8b0');
      seg(p, 22, g.top - 14, 56, g.top - 14, '#c8a050', 1.4);
      seg(p, 22, g.top - 17, 56, g.top - 17, '#c8a050', 1.4);
      for (let x = 24; x < 56; x += 4) p.vline(x, g.top - 17, g.top - 14, '#c8a050');
    } else if (view === 'back') {
      box(p, g.cx - 7, g.top - 9, 14, 8, '#e8e8e0');
      for (let y = g.top - 8; y < g.top - 2; y += 2) p.hline(g.cx - 5, g.cx + 5, y, '#a8a8b0');
      seg(p, g.cx - 10, g.top - 12, g.cx + 10, g.top - 12, '#c8a050', 1.4);
    }
  },
});
ART.commuter_train = carArt({
  body: '#d8dce4', len: 80, h: 16, roof: 'long', windows: 4, cab: [6, 74], stripe: '#3aa868', stripe2: '#e8803a', wheelR: 4, wheelX: [14, 26, 54, 66], seatX: 40, fw: 40,
  extra(p, view, f, layer, g) {
    if (layer === 'back') {
      // ぎゅうぎゅうの 人の 頭（まどの 中）
      const heads = view === 'side' ? [10, 14, 20, 26, 31, 50, 55, 60, 65, 70] : [g.cx - 12, g.cx - 7, g.cx + 7, g.cx + 12];
      const hc = ['#2d2330', '#6b4226', '#3a3040', '#5a4a3a'];
      heads.forEach((x, i) => {
        p.ellipse(x, g.top - 4, 2.6, 3, hc[i % 4]);
        p.rect(x - 3, g.top - 2, 6, 3, i % 2 ? '#3a4a6a' : '#5a5a6a');
      });
      return;
    }
    if (view === 'side') p.hline(0, 79, g.G - 1, '#6a6a78');
  },
  shadowScale: 2.4,
});
// 空飛ぶ カード（立つ）
ART.flying_card = deckArt({
  w: 44, fw: 40, lift: 9, frames: 2, deckY: 1,
  paint(p, view, f, layer, { g, cx }) {
    if (view === 'side') {
      if (layer === 'back') return;
      box(p, cx - 16, g, 32, 3, '#d8303a', { r: 1 });
      p.rect(cx - 12, g, 4, 1, '#f2c14e');
      return;
    }
    const pts = [[cx - 16, g + 2], [cx + 16, g + 2], [cx + 12, g - 6], [cx - 12, g - 6]];
    if (layer === 'back') { poly(p, pts, '#d8303a'); return; }
    poly(p, [[cx - 17, g + 2], [cx + 17, g + 2], [cx + 17, g + 4], [cx - 17, g + 4]], '#a81e2a');
    p.rect(cx - 10, g, 5, 2, '#f2c14e');
    p.hline(cx + 2, cx + 12, g + 1, '#f4f0e0');
  },
  fx(p, view, f, { g, w }) {
    // ポイントの きらきら
    for (let i = 0; i < 4; i++) {
      const x = 4 + i * (w / 4) + f * 2, y = g + 6 + ((i + f) % 3) * 2;
      p.ellipse(x, y, 1.4, 1.4, rgba('#ffe070', 0.85));
    }
  },
});
// 蒸気機関車（黒い 車体・けむり）
ART.steam_train = carArt({
  body: '#2a2630', len: 80, h: 14, roof: 'cab', cab: [52, 74], wheelR: 6, wheelX: [16, 30, 44, 64], seatX: 63, stripe: '#c83a3a', rim: '#c83a3a', spokes: true, fw: 40, roofCol: '#3a3640', bob: true,
  extra(p, view, f, layer, g) {
    if (layer !== 'front') return;
    if (view === 'side') {
      // ボイラー と えんとつ
      box(p, 4, g.top - 9, 48, 10, '#3a3640', { r: 3 });
      p.hline(6, 50, g.top - 8, '#5a5660');
      for (const x of [16, 30, 44]) p.vline(x, g.top - 9, g.top, '#c8a050');
      box(p, 9, g.top - 17, 6, 8, '#2a2630');
      box(p, 7, g.top - 19, 10, 3, '#3a3640');
      p.ellipse(28, g.top - 10, 3, 2.4, '#c8a050');
      // ロッド
      seg(p, 16, g.G - 6 + (f ? 1 : -1), 44, g.G - 6 + (f ? 1 : -1), '#c8ccd8', 1.4);
      p.hline(0, 79, g.G - 1, '#6a6a78');
      // まえの カウキャッチャー
      poly(p, [[0, g.G - 2], [6, g.top + 6], [6, g.G - 2]], '#c83a3a');
    } else if (view === 'front') {
      p.ellipse(g.cx, g.top - 2, 13, 10, '#3a3640');
      p.ellipse(g.cx, g.top - 2, 9, 7, '#2a2630');
      p.ellipse(g.cx, g.top - 3, 3, 2.4, '#ffe070');
      box(p, g.cx - 3, g.top - 18, 6, 6, '#2a2630');
      poly(p, [[g.cx - 14, g.G - 2], [g.cx + 14, g.G - 2], [g.cx + 10, g.top + 9], [g.cx - 10, g.top + 9]], '#c83a3a');
    }
  },
  fx(p, view, f, { w }) {
    const c = rgba('#f0eef4', 0.75), c2 = rgba('#c8c4d0', 0.65);
    const sx = view === 'side' ? 12 : w / 2;
    for (let i = 0; i < 4; i++) {
      const x = sx + (view === 'side' ? i * 7 + f * 3 : (i % 2 ? 4 : -4) * (i / 2)), y = 14 - i * 3 - f;
      p.ellipse(x, Math.max(3, y), 3 + i * 1.2, 2.4 + i * 0.6, i % 2 ? c2 : c);
    }
  },
  shadowScale: 2.4,
});
// 念力ふわり（むらさきの 光 と うかぶ 石）
ART.psy_float = deckArt({
  w: 44, fw: 40, lift: 9, frames: 3, riderFrame: 1,
  paint(p, view, f, layer, { g, cx }) {
    const rocks = [[-14, -6], [13, -16], [-12, -28], [15, -32]];
    rocks.forEach(([dx, dy], i) => {
      const front = (i + f) % 2 === 0;
      if ((layer === 'front') !== front) return;
      const y = g + dy + ((i + f) % 3) - 1;
      p.ellipse(cx + dx, y, 2.4, 1.8, '#8a7a6a');
      p.set(cx + dx - 1, y - 1, '#b8a898');
    });
  },
  fxUnder: true,
  fx(p, view, f, { g, cx }) {
    const c = rgba('#e0b0ff', 0.2), edge = rgba('#f0c8ff', 0.85), mid = rgba('#b060ff', 0.6);
    for (let y = g - 42; y <= g; y++) {
      const t = (y - g + 42) / 42;
      const half = 10 + Math.sin(t * Math.PI) * 4 + Math.sin(y * 0.7 + f * 2);
      const L = Math.round(cx - half), R = Math.round(cx + half);
      p.hline(L, R, y, c);
      p.set(L, y, edge); p.set(R, y, edge); p.set(L + 1, y, mid); p.set(R - 1, y, mid);
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + f * 0.6;
      p.set(cx + Math.cos(a) * 14, g - 20 + Math.sin(a) * 18, rgba('#e8c8ff', 0.9));
    }
  },
  shadowScale: 1,
});
// 空飛ぶ ほうき（すわる）
ART.broom = deckArt({
  w: 52, fw: 40, sit: true, lift: 10, crop: 34, frames: 2,
  paint(p, view, f, layer, { g, cx }) {
    const wood = '#8a5a32', straw = '#e8c060', strawD = '#b88a30';
    if (view === 'side') {
      if (layer === 'back') return;
      seg(p, cx - 22, g - 1, cx + 10, g + 1, wood, 2);
      for (let k = -2; k <= 2; k++) seg(p, cx + 10, g + 1, cx + 22 + (f ? 1 : 0), g + 1 + k * 1.6, k % 2 ? strawD : straw, 1.6);
      p.rect(cx + 9, g, 2, 3, '#c83a3a');
      return;
    }
    if (view === 'front') {
      if (layer === 'back') { for (let k = -2; k <= 2; k++) seg(p, cx, g - 1, cx + k * 3, g - 7, k % 2 ? strawD : straw, 1.6); return; }
      p.ellipse(cx, g + 1, 2, 2, wood);
      return;
    }
    if (layer === 'back') { p.ellipse(cx, g - 3, 1.4, 1.4, wood); return; }
    for (let k = -2; k <= 2; k++) seg(p, cx, g, cx + k * 3, g + 7 + (f ? 1 : 0), k % 2 ? strawD : straw, 1.8);
    p.rect(cx - 1, g - 1, 3, 2, '#c83a3a');
  },
  fx(p, view, f, { g, w, cx }) {
    for (let i = 0; i < 4; i++) twinkle(p, (view === 'side' ? cx + 14 : cx - 10) + i * 5 + f * 2, g + 3 + ((i + f) % 3) * 2, rgba('#fff6c0', 0.8));
  },
});
// 三日月（すわる）
ART.crescent = deckArt({
  w: 44, fw: 40, sit: true, lift: 8, crop: 34, frames: 2, seatUp: 0,
  paint(p, view, f, layer, { g, cx }) {
    const moon = '#ffe070', moonL = '#fff6c0';
    // 三日月（まるから まるを ぬく）
    const draw = (c, ox, oy, r) => {
      for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
        if (x * x + y * y > r * r) continue;
        if (x * x + (y + r * 0.62) ** 2 < (r * 0.86) ** 2) continue;
        p.set(ox + x, oy + y, c);
      }
    };
    const R = 15, cy = g - 10;
    if (layer === 'back') { if (view !== 'back') draw(shade(moon, -0.18), cx, cy, R); return; }
    if (view === 'back') { draw(moon, cx, cy, R); return; }
    // てまえの ふち（下の 半分）
    for (let y = 3; y <= R; y++) for (let x = -R; x <= R; x++) {
      if (x * x + y * y > R * R || x * x + (y + R * 0.62) ** 2 < (R * 0.86) ** 2) continue;
      p.set(cx + x, cy + y, y < 7 ? moonL : moon);
    }
  },
  fx(p, view, f, { g, w }) {
    for (let i = 0; i < 4; i++) twinkle(p, 4 + i * (w / 4) + f * 2, g - 28 + ((i * 2 + f) % 4) * 7, rgba('#fff6c0', 0.85), i === 1);
  },
});
// 空飛ぶ 玉座（すわる）
ART.dark_throne = deckArt({
  w: 44, fw: 40, sit: true, lift: 9, crop: 34, frames: 2, deckY: 0,
  paint(p, view, f, layer, { g, cx }) {
    const seatC = '#4a2a6a', trim = '#f2c14e', cush = '#a8203a';
    if (view === 'side') {
      if (layer === 'back') { box(p, cx + 4, g - 26, 6, 27, seatC, { r: 2 }); p.vline(cx + 6, g - 25, g - 2, trim); poly(p, [[cx + 3, g - 26], [cx + 11, g - 26], [cx + 7, g - 31]], trim); return; }
      box(p, cx - 9, g - 1, 19, 5, seatC, { r: 1 });
      p.hline(cx - 8, cx + 9, g - 1, cush);
      box(p, cx - 8, g - 8, 3, 8, seatC, { r: 1 });
      p.hline(cx - 9, cx + 9, g + 3, trim);
      return;
    }
    if (view === 'front') {
      if (layer === 'back') { box(p, cx - 11, g - 30, 22, 30, seatC, { r: 3 }); for (const s of [-1, 0, 1]) poly(p, [[cx + s * 7 - 2, g - 30], [cx + s * 7 + 2, g - 30], [cx + s * 7, g - 35]], trim); return; }
      box(p, cx - 11, g - 1, 22, 5, seatC, { r: 1 });
      for (const s of [-1, 1]) box(p, cx + s * 11 - 2, g - 9, 4, 10, seatC, { r: 1 });
      p.hline(cx - 10, cx + 10, g + 3, trim);
      return;
    }
    if (layer === 'back') return;
    box(p, cx - 11, g - 32, 22, 36, seatC, { r: 3 });
    p.hline(cx - 10, cx + 10, g - 31, trim);
    p.ellipse(cx, g - 22, 3, 3, trim);
    p.ellipse(cx, g - 22, 1.6, 1.6, cush);
  },
  fxUnder: true,
  fx(p, view, f, { g, cx }) {
    for (let y = g + 1; y < g + 8; y++) {
      const half = 14 - (y - g) * 1.4;
      p.hline(Math.round(cx - half), Math.round(cx + half), y + (f && y % 2 ? 1 : 0), rgba('#9a4ad8', 0.45));
    }
  },
});

// 第39回 C: たのまれごとで もらう 乗り物（render/family-art.js）
addFamilyVehicleArt(ART, { carArt, deckArt, box, seg, wheel, poly, rgba, shade, twinkle });
// 第43回: ヨッシー（render/vehicle-r43j.js）
addR43jVehicleArt(ART, { box, seg, poly, shade, seat });
// 第50回 D3: 景品の 乗り物（render/prize-vehicle-art.js）
addPrizeVehicleArt(ART, { horseArt, bikeArt, carArt, deckArt, carpetPaint, cloudPaint, rgba, twinkle });

export const VEHICLE_ART = ART;

// ───────────── 絵を つくる ─────────────
// 1つの 層（Painter。du の まま）。テストでも 使う
export function paintVehicle(id, view, frame, layer) {
  const A = ART[id];
  if (!A) return null;
  const [w, h] = A.size(view);
  const p = new Painter(w, h);
  A.paint(p, view, frame % A.frames, layer, {});
  return p;
}

// すきとおった こうか（オーラ・風・花びら）だけの 層。ない 乗り物は null
export function paintVehicleFx(id, view, frame) {
  const A = ART[id];
  if (!A?.fx) return null;
  const [w, h] = A.size(view);
  const p = new Painter(w, h);
  A.fx(p, view, frame % A.frames, {});
  return p;
}

// 乗る 人の いち（du）
export function riderSpot(id, view, frame) {
  const A = ART[id];
  return A ? A.rider(view, frame % A.frames) : null;
}

export function vehicleFrames(id) { return ART[id]?.frames || 2; }
export function vehicleShadow(id) { return ART[id]?.shadowScale || 1.2; }
export function vehicleSize(id, view) { return ART[id]?.size(view) || null; }
// 残像・のびる うでの ある 乗り物（人の 絵で つくる こうか）
export function vehicleRiderFx(id) { return !!(ART[id]?.ghosts?.length || ART[id]?.stretch); }

function fine(p) {
  const q = scale2x(p);
  rimShade(q, 0.18, 0.14);
  outline2(q, OUT, 0.4);
  return q;
}
function fxCanvas(p) {
  return scale2x(p).toCanvas();
}

// のばした うで（ゴムの ロケット）。skin … はだの いろ
function stretchArms(p, view, f, rx, ry, skin, sleeve) {
  const reach = [24, 30, 27][f];
  if (view === 'side') {
    // かた（ひだりむき）から まえへ
    for (const dy of [22, 24]) seg(p, rx + 12, ry + dy, rx + 12 - reach, ry + dy - 2, skin, 1.8);
    p.ellipse(rx + 12 - reach - 1, ry + 21, 2.6, 2.4, skin);
    p.ellipse(rx + 12 - reach - 1, ry + 23.5, 2.4, 2.2, shade(skin, -0.1));
    seg(p, rx + 11, ry + 21, rx + 14, ry + 21, sleeve, 2);
  } else if (view === 'front') {
    for (const s of [-1, 1]) {
      seg(p, rx + 16 + s * 6, ry + 24, rx + 16 + s * 4, ry + 30, skin, 2);
      p.ellipse(rx + 16 + s * 4, ry + 32, 3.6 + (f === 1 ? 0.8 : 0), 3.4 + (f === 1 ? 0.8 : 0), skin);
    }
  } else {
    for (const s of [-1, 1]) {
      seg(p, rx + 16 + s * 6, ry + 23, rx + 16 + s * 3, ry + 23 - reach * 0.6, skin, 1.8);
      p.ellipse(rx + 16 + s * 3, ry + 22 - reach * 0.6, 2, 2, skin);
    }
  }
}

// 人の 絵から はだの いろ・服の いろを とる（ゴムの ロケットの うで）
function sampleRider(c) {
  try {
    const x = ctxOf(c);
    const r = c.res || 4;
    const px = (dx, dy) => {
      const d = x.getImageData(Math.round(dx * r / 2), Math.round(dy * r / 2), 1, 1).data;
      return d[3] > 200 ? '#' + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, '0')).join('') : null;
    };
    return { skin: px(16, 17) || '#f7d4ae', cloth: px(16, 26) || '#d9534f' };
  } catch {
    return { skin: '#f7d4ae', cloth: '#d9534f' };
  }
}

// 人を のせた 乗り物の 絵（res 4）
//  riderOf(dir, frame) … 人の 絵（res 4。field.js の playerSprite）。key … 人の 見た目の キー（おぼえる ため）
const cache = new Map();
const CACHE_MAX = 600;
export function vehicleCanvas(id, key, riderOf, dir, frame) {
  const A = ART[id];
  if (!A) return null;
  const f = frame % A.frames;
  const k = `${id}|${key}|${dir}|${f}`;
  const hit = cache.get(k);
  if (hit) return hit;
  const view = viewOf(dir);
  const [w, h] = A.size(view);
  const R = A.rider(view, f);
  const minX = Math.min(0, R.x), minY = Math.min(0, R.y);
  const maxX = Math.max(w, R.x + RIDER_W);
  const ox = -minX, oy = -minY;
  const W = maxX - minX, H = h + oy;
  const c = makeCanvas(W * 2, H * 2);
  c.res = 4;
  const x = ctxOf(c);
  x.imageSmoothingEnabled = false;
  const layer = (name) => {
    const p = new Painter(w, h);
    A.paint(p, view, f, name, {});
    return fine(p).toCanvas();
  };
  // 人（みぎむきは ひだりむきの 絵に そろえて かいて、さいごに はんてん）
  const rdir = dir === 'right' ? 'right' : dir;
  let rider = riderOf(rdir, R.frame ?? 0);
  if (rider && dir === 'right') rider = flipCanvas(rider);
  const rx = (R.x + ox) * 2, ry = (R.y + oy) * 2;
  const crop = Math.min(RIDER_H, R.crop ?? RIDER_H, H - (R.y + oy));
  const fxLayer = () => {
    if (!A.fx) return null;
    // fx は 乗り物の ざひょうで かいて、ox・oy だけ ずらす
    const q = new Painter(w, h);
    A.fx(q, view, f, {});
    const p = new Painter(W, H);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const v = q.px[j * w + i]; if (v) p.set(i + ox, j + oy, v); }
    return fxCanvas(p);
  };
  const fxc = fxLayer();
  if (fxc && A.fxUnder) x.drawImage(fxc, 0, 0);
  x.drawImage(layer('back'), ox * 2, oy * 2);
  if (rider) {
    // 残像（忍び走り・桜の風）: うしろに うすく
    for (const gh of A.ghosts || []) {
      const back = view === 'side' ? gh.dx * 2 : 0;
      const up = view === 'side' ? 0 : view === 'front' ? -gh.dx * 0.6 : gh.dx * 0.6;
      x.globalAlpha = gh.a;
      x.drawImage(rider, 0, 0, rider.width, crop * 2, rx + back, ry + up, RIDER_W * 2, crop * 2);
      x.globalAlpha = 1;
    }
    x.drawImage(rider, 0, 0, rider.width, crop * 2, rx, ry, RIDER_W * 2, crop * 2);
    if (A.stretch) {
      const base = riderOf('down', 0);
      const col = base ? sampleRider(base) : { skin: '#f7d4ae', cloth: '#d9534f' };
      const p = new Painter(W, H);
      stretchArms(p, view, f, R.x + ox, R.y + oy, col.skin, col.cloth);
      x.drawImage(fine(p).toCanvas(), 0, 0);
    }
  }
  x.drawImage(layer('front'), ox * 2, oy * 2);
  if (fxc && !A.fxUnder) x.drawImage(fxc, 0, 0);
  let out = c;
  if (dir === 'right') {
    out = flipCanvas(c);
    out.res = 4;
  }
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(k, out);
  return out;
}
