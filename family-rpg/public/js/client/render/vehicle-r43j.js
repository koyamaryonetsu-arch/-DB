// 第43回の 乗り物の ドット絵: ヨッシー（マリオ・ピーチ。名前と 値段は shared/data/vehicles.js）
// 緑の 体・白い おなか・赤い くら・オレンジの くつ・大きな 鼻・頭の うしろの 赤い とげ。2本足で 走る（オリジナルの ドット絵）
// render/vehicle-art.js が addR43jVehicleArt(ART, kit) を よぶ（kit … 乗り物の 絵の どうぐ）。かき方の きまりは vehicle-art.js と おなじ
//   むきは 'side'（ひだりむき）・'front'・'back'。'back' の 層は 乗る 人より うしろ、'front' の 層は まえ

export function addR43jVehicleArt(ART, kit) {
  ART.yoshi = yoshiArt(kit);
}

function yoshiArt({ box, seg, poly, shade, seat }) {
  const G = '#4ac040', GD = shade(G, -0.25), GL = shade(G, 0.22);
  const W = '#fbfbf2', RED = '#e0302a', BOOT = '#f08a20', BOOTD = shade(BOOT, -0.25), EYE = '#1b1330';
  // 足の いち（よこ。f … 0〜2）: [てまえ, おく] の 足先
  const RUN = [[[24, -3], [42, 0]], [[33, 0], [31, -2]], [[42, 0], [24, -4]]];
  const leg = (p, hx, hy, fx, fy, c) => {
    seg(p, hx, hy, (hx + fx) / 2 + 1, (hy + fy) / 2, c, 4.2);
    seg(p, (hx + fx) / 2 + 1, (hy + fy) / 2, fx, fy - 2, c, 3.4);
    // オレンジの くつ（つまさきは まえ）
    p.ellipse(fx - 1.5, fy - 1.2, 3.2, 1.8, c === G ? BOOT : BOOTD);
  };
  const side = (p, f, layer) => {
    const g = 50, by = 31;
    const L = RUN[f];
    if (layer === 'back') {
      leg(p, 38, by + 4, L[1][0], g + L[1][1], GD);
      // しっぽ（うしろへ）
      for (let i = 0; i < 9; i++) p.ellipse(47 + i, by + 2 + i * 0.35, 3 - i * 0.28, 2.6 - i * 0.22, i % 3 ? G : GD);
      return;
    }
    // からだ・白い おなか
    p.ellipse(35, by, 12, 8, G);
    p.hline(27, 43, by - 8, GL);
    p.ellipse(32, by + 3.5, 7.5, 3.8, W);
    // くびと 頭
    // 頭の うしろの 赤い とげ（乗る 人に かからない ように 頭の すぐ うしろ）
    for (const [x, y] of [[16, by - 21], [18, by - 17], [20, by - 13]]) poly(p, [[x - 1.5, y - 1], [x + 1.5, y + 1.5], [x + 3, y - 2]], RED);
    poly(p, [[21, by + 2], [27, by - 4], [18, by - 15], [12, by - 12]], G);
    p.ellipse(13, by - 17, 6, 5.4, G);
    // 大きな まるい 鼻と 白い ほお
    p.ellipse(4.5, by - 15, 5.6, 4.4, G);
    p.ellipse(5, by - 16.5, 3.2, 1.6, GL);
    p.ellipse(9.5, by - 12, 4.2, 2.4, W);
    p.set(1, by - 15, GD);
    // 目（白い 大きな 目に 黒目）
    p.ellipse(12, by - 22, 2.3, 3.2, W);
    p.rect(11, by - 22, 2, 2, EYE);
    // 小さな うで
    seg(p, 24, by + 1, 21, by + 4, G, 2.2);
    // てまえの 足
    leg(p, 31, by + 4, L[0][0], g + L[0][1], G);
    // 赤い くら（白い ふち）
    box(p, 29, by - 10, 13, 5, RED, { r: 2 });
    p.hline(30, 40, by - 5, W);
  };
  const front = (p, f, layer) => {
    const cx = 18, g = 50, by = 31;
    const bob = f === 1 ? -1 : 0;
    if (layer === 'back') {
      p.ellipse(cx, by - 1 + bob, 10, 7, GD);
      // しっぽ（うしろに 少し）
      p.ellipse(cx + 6, by + 6 + bob, 3, 2.4, GD);
      box(p, cx - 9, by - 8 + bob, 18, 4, RED, { r: 1 });
      return;
    }
    // むね（白い おなか）と 足
    p.ellipse(cx, by + 2 + bob, 9.5, 8, G);
    p.ellipse(cx, by + 4 + bob, 6, 5.5, W);
    leg(p, cx - 5, by + 7, cx - 4.5, g - (f === 0 ? 3 : 0), G);
    leg(p, cx + 5, by + 7, cx + 6.5, g - (f === 2 ? 3 : 0), G);
    // 頭（てまえ）・大きな 鼻・上に 大きな 目・赤い とげ
    const hy = by + 2 + bob;
    p.ellipse(cx, hy - 2, 7, 5.5, G);
    for (const s of [-1, 1]) {
      p.ellipse(cx + s * 2.8, hy - 6, 2.2, 2.6, W);
      p.rect(Math.round(cx + s * 2.8 - 0.5), Math.round(hy - 6), 1, 2, EYE);
    }
    p.ellipse(cx, hy + 3, 6, 4.4, G);
    p.ellipse(cx, hy + 2, 3.6, 1.6, GL);
    for (const s of [-1, 1]) p.set(Math.round(cx + s * 1.8), Math.round(hy + 4), GD);
  };
  const back = (p, f, layer) => {
    const cx = 18, g = 50, by = 31;
    const bob = f === 1 ? -1 : 0;
    if (layer === 'back') {
      // 頭（人の むこう）・目の 上と 赤い とげ
      p.ellipse(cx, by - 11 + bob, 6, 5.5, G);
      for (const s of [-1, 1]) p.ellipse(cx + s * 2.6, by - 16 + bob, 2, 2.4, W);
      for (const y of [-12, -8]) poly(p, [[cx - 1.5, by + y + bob], [cx + 1.5, by + y + bob], [cx, by + y - 3 + bob]], RED);
      leg(p, cx - 5, by + 4, cx - 5.5, g - (f === 2 ? 3 : 0), GD);
      leg(p, cx + 5, by + 4, cx + 5.5, g - (f === 0 ? 3 : 0), GD);
      return;
    }
    // おしり・しっぽ・くら
    p.ellipse(cx, by + 2 + bob, 10.5, 8, G);
    p.vline(cx, Math.round(by - 2 + bob), Math.round(by + 8 + bob), GD);
    leg(p, cx - 6, by + 6, cx - 6, g - (f === 0 ? 3 : 0), G);
    leg(p, cx + 6, by + 6, cx + 6, g - (f === 2 ? 3 : 0), G);
    for (let i = 0; i < 6; i++) p.ellipse(cx + Math.sin(i / 2 + f) * 1.2, by + 6 + i * 1.5 + bob, 2.6 - i * 0.3, 1.5, i % 2 ? G : GD);
    box(p, cx - 9, by - 8 + bob, 18, 5, RED, { r: 2 });
    p.hline(cx - 8, cx + 8, by - 4 + bob, W);
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
    shadowScale: 1.6,
  };
}
