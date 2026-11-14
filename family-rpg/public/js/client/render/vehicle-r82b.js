// 第82回 B班の 乗り物の ドット絵: 大きなトラ（YAIBA の 系統。名前と 値段は shared/data/vehicles.js）
// オレンジの 体に 黒い しまもよう・白い おなかと 口もと・まるい 耳・長い しまの しっぽ。4本足で かける（オリジナルの ドット絵）
// render/vehicle-art.js が addR82bVehicleArt(ART, kit) を よぶ（kit … 乗り物の 絵の どうぐ）。かき方の きまりは vehicle-art.js と おなじ
//   むきは 'side'（ひだりむき）・'front'・'back'。'back' の 層は 乗る 人より うしろ、'front' の 層は まえ

export function addR82bVehicleArt(ART, kit) {
  ART.big_tiger = tigerArt(kit);
}

function tigerArt({ seg, poly, shade, seat }) {
  const O = '#f08a24', OD = shade(O, -0.25), OL = shade(O, 0.2);
  const W = '#fbf6ea', K = '#2a1a14', EYE = '#1b1330', NOSE = '#e07a8a';
  // 足先の いち（よこ。f … 0〜2）: [前てまえ, 前おく, 後ろてまえ, 後ろおく]
  const RUN = [
    [[13, -4], [26, 0], [50, 0], [40, -4]],
    [[19, 0], [22, -1], [45, 0], [48, -1]],
    [[26, 0], [14, -5], [41, -5], [51, 0]],
  ];
  const leg = (p, hx, hy, fx, fy, c, t = 4) => {
    const kx = (hx + fx) / 2 + (fx < hx ? 1 : -0.4), ky = (hy + fy) / 2 - 0.5;
    seg(p, hx, hy, kx, ky, c, t);
    seg(p, kx, ky, fx, fy - 1.5, c, t - 0.5);
    // まるい 足先（白い つめ先）
    p.ellipse(fx, fy - 1.4, 2.4, 1.5, c);
    p.set(fx - 1.5, fy - 0.6, W);
  };
  // しまもよう（よこ。体の 上から 下へ みじかい 黒い すじ）
  const stripes = (p, x0, x1, top, len) => {
    for (let x = x0; x <= x1; x += 4.5) seg(p, x, top, x - 1.5, top + len, K, 1.8);
  };
  const side = (p, f, layer) => {
    const G = 50, by = 32;
    const L = RUN[f];
    if (layer === 'back') {
      leg(p, 24, by + 4, L[1][0], G + L[1][1], OD);
      leg(p, 46, by + 4, L[3][0], G + L[3][1], OD);
      // しっぽ（うしろへ 上がって、先が くるん）
      const sw = f === 1 ? -2 : f === 2 ? 1 : 0;
      for (let i = 0; i < 12; i++) {
        const x = 51 + i * 0.9, y = by - 2 - i * 0.9 + (i > 7 ? (i - 7) * 1.4 + sw : 0);
        p.ellipse(x, y, 1.8, 1.8, i % 3 === 2 ? K : O);
      }
      return;
    }
    // からだ（白い おなか）
    p.ellipse(35, by, 15.5, 7.5, O);
    p.ellipse(23, by, 7, 7.2, O);
    p.ellipse(47, by - 0.5, 7, 7, O);
    p.hline(25, 45, by - 7, OL);
    p.ellipse(34, by + 5, 11, 2.2, W);
    stripes(p, 27, 50, by - 7, 6);
    // 頭（大きく まるい）・まるい 耳・白い ほおと 口もと・目・ひたいの しま・ひげ
    p.ellipse(13, by - 9, 9.5, 8.5, O);
    for (const [x, y] of [[8, by - 17.5], [17, by - 17.5]]) {
      p.ellipse(x, y, 2.8, 2.6, O);
      p.ellipse(x, y + 0.3, 1.3, 1.2, K);
    }
    p.ellipse(7, by - 5, 5.2, 3.6, W);
    p.ellipse(14, by - 3.5, 4, 2.6, W);
    p.ellipse(3.2, by - 7.5, 1.6, 1.2, NOSE);
    p.hline(3, 7, by - 4, K);
    p.rect(9, by - 12, 2, 2, EYE);
    p.set(9, by - 12, '#ffe070');
    for (const [x0, y0, x1, y1] of [[12, by - 17, 12.5, by - 14], [15, by - 16.5, 15.5, by - 13], [19, by - 14, 21, by - 11], [20, by - 9, 22, by - 7]]) seg(p, x0, y0, x1, y1, K, 1.4);
    seg(p, 4, by - 5, -1, by - 6.5, '#ffffff', 1);
    seg(p, 4, by - 4, -1, by - 3, '#ffffff', 1);
    // てまえの 足
    leg(p, 23, by + 4, L[0][0], G + L[0][1], O);
    leg(p, 45, by + 4, L[2][0], G + L[2][1], O);
    for (const i of [0, 2]) for (const dy of [7, 4]) seg(p, L[i][0] - 1, G + L[i][1] - dy, L[i][0] + 2, G + L[i][1] - dy - 0.5, K, 1.1);
    // あい色の くらぬの（白い ふち）
    poly(p, [[28, by - 8], [41, by - 8], [40, by - 1], [29, by - 1]], '#2a4aa8');
    p.hline(28, 41, by - 8, '#f4f4f4');
    p.hline(29, 40, by - 1, '#f4f4f4');
  };
  const front = (p, f, layer) => {
    const cx = 18, G = 50, by = 32;
    const bob = f === 1 ? -1 : 0;
    if (layer === 'back') {
      // おくの からだ・うしろ足・くらぬの
      p.ellipse(cx, by - 1 + bob, 11, 7, OD);
      leg(p, cx - 6.5, by + 2, cx - 7, G - (f === 2 ? 3 : 0), OD, 3.6);
      leg(p, cx + 6.5, by + 2, cx + 7, G - (f === 0 ? 3 : 0), OD, 3.6);
      poly(p, [[cx - 12, by - 8 + bob], [cx + 12, by - 8 + bob], [cx + 11, by - 3 + bob], [cx - 11, by - 3 + bob]], '#2a4aa8');
      p.hline(cx - 12, cx + 12, by - 8 + bob, '#f4f4f4');
      return;
    }
    // むねと 前足
    p.ellipse(cx, by + 3 + bob, 11, 7.5, O);
    p.ellipse(cx, by + 5 + bob, 6, 4.5, W);
    leg(p, cx - 6, by + 6, cx - 6.5, G - (f === 0 ? 3 : 0), O, 4.4);
    leg(p, cx + 6, by + 6, cx + 6.5, G - (f === 2 ? 3 : 0), O, 4.4);
    // 頭（てまえ。人の 足もとの 下）
    const hy = by + 2 + bob;
    for (const s of [-1, 1]) {
      p.ellipse(cx + s * 6, hy - 6, 2.4, 2.2, O);
      p.set(Math.round(cx + s * 6), Math.round(hy - 6), K);
    }
    p.ellipse(cx, hy, 8, 6.5, O);
    // ひたいの しま（王の 字では なく、3本の すじ）
    for (const dx of [-2, 0, 2]) seg(p, cx + dx, hy - 6, cx + dx, hy - 3.5, K, 1);
    for (const s of [-1, 1]) {
      seg(p, cx + s * 7.5, hy - 1, cx + s * 5, hy, K, 1);
      p.rect(Math.round(cx + s * 3 - (s < 0 ? 1 : 0)), Math.round(hy - 2), 1, 2, EYE);
    }
    p.ellipse(cx, hy + 3.5, 4.5, 2.6, W);
    p.rect(Math.round(cx - 1), Math.round(hy + 1.5), 2, 1, NOSE);
    for (const s of [-1, 1]) seg(p, cx + s * 4, hy + 3, cx + s * 8, hy + 2.5, '#ffffff', 1);
  };
  const back = (p, f, layer) => {
    const cx = 18, G = 50, by = 32;
    const bob = f === 1 ? -1 : 0;
    if (layer === 'back') {
      // 頭（人の むこう）・耳・前足
      p.ellipse(cx, by - 9 + bob, 7, 5.5, O);
      for (const s of [-1, 1]) {
        p.ellipse(cx + s * 5.5, by - 14 + bob, 2.2, 2, O);
        p.set(Math.round(cx + s * 5.5), Math.round(by - 14 + bob), K);
      }
      for (const dx of [-3, 0, 3]) seg(p, cx + dx, by - 13 + bob, cx + dx, by - 10 + bob, K, 1);
      leg(p, cx - 6, by + 2, cx - 6.5, G - (f === 2 ? 3 : 0), OD, 3.6);
      leg(p, cx + 6, by + 2, cx + 6.5, G - (f === 0 ? 3 : 0), OD, 3.6);
      return;
    }
    // おしり・うしろ足・しま・しっぽ
    p.ellipse(cx, by + 2 + bob, 11.5, 8, O);
    for (const dy of [-3, 1, 5]) {
      seg(p, cx - 11, by + dy + bob, cx - 7, by + dy + 1 + bob, K, 1.2);
      seg(p, cx + 11, by + dy + bob, cx + 7, by + dy + 1 + bob, K, 1.2);
    }
    leg(p, cx - 6.5, by + 6, cx - 7, G - (f === 0 ? 3 : 0), O, 4.4);
    leg(p, cx + 6.5, by + 6, cx + 7, G - (f === 2 ? 3 : 0), O, 4.4);
    for (let i = 0; i < 8; i++) p.ellipse(cx + Math.sin(i / 2 + f) * 1.6, by + 5 + i * 1.5 + bob, 1.8, 1.2, i % 3 === 2 ? K : O);
    poly(p, [[cx - 11, by - 8 + bob], [cx + 11, by - 8 + bob], [cx + 10, by - 3 + bob], [cx - 10, by - 3 + bob]], '#2a4aa8');
    p.hline(cx - 11, cx + 11, by - 8 + bob, '#f4f4f4');
    p.hline(cx - 10, cx + 10, by - 3 + bob, '#f4f4f4');
  };
  return {
    frames: 3,
    size: (view) => (view === 'side' ? [64, 52] : [36, 52]),
    rider: (view, f) => {
      const bob = f === 1 ? -1 : 0;
      if (view === 'side') return seat(35, 26 + bob, 34);
      return seat(18, 27 + bob, 34);
    },
    paint(p, view, f, layer) {
      if (view === 'side') side(p, f, layer);
      else if (view === 'front') front(p, f, layer);
      else back(p, f, layer);
    },
    fx: null,
    shadowScale: 1.7,
  };
}
