// 第84回 B班の 乗り物の ドット絵: パンダ（らんま1/2 の 系統。名前と 値段は shared/data/vehicles.js）
// 白い まるい 体に 黒い 足・黒い 耳・目の まわりの 黒い もよう・かたの 黒い おび。4本足で のっしのっし 歩く。
// よこむきの 2コマめは、手に 小さな かんばん（字は かかない。黄色い 板）を もちあげる（オリジナルの ドット絵）
// render/vehicle-art.js が addR84bVehicleArt(ART, kit) を よぶ（kit … 乗り物の 絵の どうぐ）。かき方の きまりは vehicle-art.js と おなじ
//   むきは 'side'（ひだりむき）・'front'・'back'。'back' の 層は 乗る 人より うしろ、'front' の 層は まえ

export function addR84bVehicleArt(ART, kit) {
  ART.panda = pandaArt(kit);
}

function pandaArt({ seg, poly, shade, seat }) {
  const W = '#f6f4ee', WD = shade(W, -0.12), K = '#26222c', KL = shade(K, 0.25), EYE = '#ffffff', NOSE = '#1a1620';
  const SIGN = '#f2d060', POST = '#8a5a2a', SADDLE = '#c8202a';
  // 足先の いち（よこ。f … 0〜2）: [前てまえ, 前おく, 後ろてまえ, 後ろおく]（トラより ゆっくり・はばが せまい）
  const WALK = [
    [[15, -2], [24, 0], [47, 0], [40, -2]],
    [[19, 0], [21, 0], [44, 0], [45, 0]],
    [[24, 0], [16, -2], [41, -2], [48, 0]],
  ];
  const leg = (p, hx, hy, fx, fy, c, t = 5) => {
    const kx = (hx + fx) / 2, ky = (hy + fy) / 2;
    seg(p, hx, hy, kx, ky, c, t);
    seg(p, kx, ky, fx, fy - 1.5, c, t - 0.5);
    p.ellipse(fx, fy - 1.6, 2.8, 1.7, c);
  };
  const side = (p, f, layer) => {
    const G = 50, by = 31;
    const L = WALK[f];
    if (layer === 'back') {
      leg(p, 25, by + 5, L[1][0], G + L[1][1], KL);
      leg(p, 45, by + 5, L[3][0], G + L[3][1], KL);
      return;
    }
    // からだ（白くて まるい）・かたの 黒い おび・みじかい しっぽ
    p.ellipse(35, by, 16, 9, W);
    p.ellipse(24, by - 1, 8, 8, W);
    p.ellipse(46, by, 8, 8.5, W);
    p.ellipse(34, by + 6, 12, 2.6, WD);
    seg(p, 22, by - 7, 26, by + 6, K, 5);
    p.ellipse(53, by - 3, 2, 1.8, W);
    // 頭（大きく まるい）・黒い 耳・目の まわりの 黒い もよう・鼻
    p.ellipse(13, by - 9, 10, 9, W);
    for (const [x, y] of [[6, by - 17], [18, by - 18]]) p.ellipse(x, y, 3, 2.8, K);
    p.ellipse(8, by - 10, 2.6, 3.2, K);
    p.set(8, by - 11, EYE);
    p.ellipse(5, by - 5, 3.6, 2.6, W);
    p.ellipse(3.6, by - 6.4, 1.5, 1.1, NOSE);
    p.hline(3, 6, by - 3.5, K);
    // てまえの 足（黒）
    leg(p, 23, by + 5, L[0][0], G + L[0][1], K);
    leg(p, 45, by + 5, L[2][0], G + L[2][1], K);
    // 赤い くらぬの（金の ふち）
    poly(p, [[29, by - 9], [41, by - 9], [40, by - 2], [30, by - 2]], SADDLE);
    p.hline(29, 41, by - 9, '#f2c14e');
    p.hline(30, 40, by - 2, '#f2c14e');
    // 2コマめ: 小さな かんばんを もちあげる（字は かかない）
    if (f === 1) {
      seg(p, 5, by - 4, 5, by - 22, POST, 1.4);
      p.rect(0, by - 30, 11, 8, SIGN);
      p.hline(0, 10, by - 30, '#fff4b0');
      p.hline(0, 10, by - 23, shade(SIGN, -0.25));
      p.ellipse(5, by - 4, 2.2, 2, K);
    }
  };
  const front = (p, f, layer) => {
    const cx = 18, G = 50, by = 31;
    const bob = f === 1 ? -1 : 0;
    if (layer === 'back') {
      p.ellipse(cx, by - 1 + bob, 12, 8, WD);
      leg(p, cx - 7, by + 3, cx - 7.5, G - (f === 2 ? 2 : 0), KL, 4.4);
      leg(p, cx + 7, by + 3, cx + 7.5, G - (f === 0 ? 2 : 0), KL, 4.4);
      poly(p, [[cx - 12, by - 9 + bob], [cx + 12, by - 9 + bob], [cx + 11, by - 4 + bob], [cx - 11, by - 4 + bob]], SADDLE);
      p.hline(cx - 12, cx + 12, by - 9 + bob, '#f2c14e');
      return;
    }
    // むねの 黒い おびと 前足
    p.ellipse(cx, by + 3 + bob, 12, 8, W);
    seg(p, cx - 11, by + 1 + bob, cx + 11, by + 1 + bob, K, 3);
    leg(p, cx - 6.5, by + 6, cx - 7, G - (f === 0 ? 2 : 0), K, 5);
    leg(p, cx + 6.5, by + 6, cx + 7, G - (f === 2 ? 2 : 0), K, 5);
    // 頭（てまえ。人の 足もとの 下）
    const hy = by + 2 + bob;
    for (const s of [-1, 1]) p.ellipse(cx + s * 7, hy - 6.5, 2.8, 2.6, K);
    p.ellipse(cx, hy, 9, 7, W);
    for (const s of [-1, 1]) {
      p.ellipse(cx + s * 3.6, hy - 1, 2.2, 2.6, K);
      p.set(Math.round(cx + s * 3.4), Math.round(hy - 1.6), EYE);
    }
    p.ellipse(cx, hy + 3.6, 4.4, 2.6, WD);
    p.rect(Math.round(cx - 1), Math.round(hy + 2), 2, 1.5, NOSE);
  };
  const back = (p, f, layer) => {
    const cx = 18, G = 50, by = 31;
    const bob = f === 1 ? -1 : 0;
    if (layer === 'back') {
      // 頭（人の むこう）・耳・前足
      p.ellipse(cx, by - 9 + bob, 7.5, 6, W);
      for (const s of [-1, 1]) p.ellipse(cx + s * 6, by - 14.5 + bob, 2.6, 2.4, K);
      leg(p, cx - 6.5, by + 3, cx - 7, G - (f === 2 ? 2 : 0), KL, 4.4);
      leg(p, cx + 6.5, by + 3, cx + 7, G - (f === 0 ? 2 : 0), KL, 4.4);
      return;
    }
    // おしり・うしろ足（黒）・まるい しっぽ
    p.ellipse(cx, by + 2 + bob, 12.5, 8.5, W);
    leg(p, cx - 7, by + 6, cx - 7.5, G - (f === 0 ? 2 : 0), K, 5);
    leg(p, cx + 7, by + 6, cx + 7.5, G - (f === 2 ? 2 : 0), K, 5);
    p.ellipse(cx, by + 7 + bob, 2.4, 2, WD);
    poly(p, [[cx - 11, by - 9 + bob], [cx + 11, by - 9 + bob], [cx + 10, by - 4 + bob], [cx - 10, by - 4 + bob]], SADDLE);
    p.hline(cx - 11, cx + 11, by - 9 + bob, '#f2c14e');
    p.hline(cx - 10, cx + 10, by - 4 + bob, '#f2c14e');
  };
  return {
    frames: 3,
    size: (view) => (view === 'side' ? [64, 52] : [36, 52]),
    rider: (view, f) => {
      const bob = f === 1 ? -1 : 0;
      if (view === 'side') return seat(35, 25 + bob, 34);
      return seat(18, 26 + bob, 34);
    },
    paint(p, view, f, layer) {
      if (view === 'side') side(p, f, layer);
      else if (view === 'front') front(p, f, layer);
      else back(p, f, layer);
    },
    fx: null,
    shadowScale: 1.8,
  };
}
