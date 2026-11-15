// 第83回 A班の 乗り物の ドット絵: 空飛ぶカバ（封神演義の 系統。名前と 値段は shared/data/vehicles.js）
// 白くて まるい カバの ような 生き物が、ふわふわ 空に うかぶ。小さな 耳・大きな 鼻づら・みじかい 足が ぶらん・足もとに 小さな 雲（オリジナルの ドット絵）
// render/vehicle-art.js が addR83aVehicleArt(ART, kit) を よぶ（kit … 乗り物の 絵の どうぐ）。かき方の きまりは vehicle-art.js と おなじ
//   むきは 'side'（ひだりむき）・'front'・'back'。'back' の 層は 乗る 人より うしろ、'front' の 層は まえ

export function addR83aVehicleArt(ART, kit) {
  ART.sky_hippo = hippoArt(kit);
}

function hippoArt({ seg, poly, shade, seat }) {
  const B = '#f4f2ee', BD = shade(B, -0.18), BL = '#ffffff';
  const SN = '#e8dcd0', PINK = '#f0a8b0', EYE = '#1b1330', CLOUD = '#dfe8f4';
  // うく 高さ（f … 0〜2。ゆっくり 上下）
  const BOB = [0, -1.5, -0.5];
  // 足もとの 小さな 雲
  const cloud = (p, cx, cy, w) => {
    for (let i = -2; i <= 2; i++) p.ellipse(cx + i * w * 0.22, cy + (Math.abs(i) === 2 ? 0.5 : 0), w * 0.18, 2.4, CLOUD);
    p.hline(Math.round(cx - w * 0.4), Math.round(cx + w * 0.4), Math.round(cy - 1.5), '#ffffff');
  };
  // みじかい 足（ぶらん）
  const stub = (p, x, y, sw, c) => {
    seg(p, x, y, x + sw, y + 4, c, 3.4);
    p.ellipse(x + sw, y + 4.6, 1.9, 1.2, shade(c, -0.08));
  };
  const side = (p, f, layer) => {
    const by = 30 + BOB[f];
    const sw = f === 1 ? 0.8 : f === 2 ? -0.8 : 0;
    if (layer === 'back') {
      stub(p, 26, by + 5, -sw, BD);
      stub(p, 44, by + 5, sw, BD);
      cloud(p, 35, 49, 34);
      return;
    }
    // まるい からだ・おなか
    p.ellipse(36, by, 15, 8.5, B);
    p.ellipse(36, by - 6.5, 11, 2.2, BL);
    p.ellipse(36, by + 5, 10, 2.4, BD);
    // 頭（大きな 鼻づら）・耳・目・鼻の あな・ほっぺ
    p.ellipse(17, by - 6, 8.5, 7.5, B);
    p.ellipse(8.5, by - 3, 6, 5, SN);
    p.ellipse(6.2, by - 4.5, 0.9, 0.7, EYE);
    p.ellipse(9.4, by - 5, 0.9, 0.7, EYE);
    p.hline(5, 11, Math.round(by - 0.6), shade(SN, -0.25));
    for (const [x, y] of [[19, by - 13.5], [23, by - 12.5]]) {
      p.ellipse(x, y, 1.8, 2.2, B);
      p.ellipse(x, y + 0.4, 0.8, 1.1, PINK);
    }
    p.rect(14, Math.round(by - 9), 2, 2, EYE);
    p.set(14, Math.round(by - 9), '#ffffff');
    p.ellipse(17, by - 3.5, 1.6, 1, PINK);
    // しっぽ（小さく まるい）
    p.ellipse(51.5, by - 1, 1.6, 1.4, BD);
    // てまえの 足
    stub(p, 29, by + 6, sw, B);
    stub(p, 46, by + 6, -sw, B);
    // 青い くらぬの（白い ふち）
    poly(p, [[29, by - 8], [43, by - 8], [42, by - 2], [30, by - 2]], '#3a6ad0');
    p.hline(29, 43, Math.round(by - 8), '#f4f4f4');
    p.hline(30, 42, Math.round(by - 2), '#f4f4f4');
  };
  const front = (p, f, layer) => {
    const cx = 18, by = 30 + BOB[f];
    if (layer === 'back') {
      // おくの からだ・うしろ足・くらぬの・雲
      p.ellipse(cx, by - 1, 12, 8, BD);
      stub(p, cx - 7, by + 4, 0, BD);
      stub(p, cx + 7, by + 4, 0, BD);
      poly(p, [[cx - 12, by - 8], [cx + 12, by - 8], [cx + 11, by - 3], [cx - 11, by - 3]], '#3a6ad0');
      p.hline(cx - 12, cx + 12, Math.round(by - 8), '#f4f4f4');
      cloud(p, cx, 49, 26);
      return;
    }
    // むねと 前足
    p.ellipse(cx, by + 3, 12, 7.5, B);
    stub(p, cx - 6, by + 7, -0.4, B);
    stub(p, cx + 6, by + 7, 0.4, B);
    // 頭（てまえ。人の 足もとの 下）・耳・目・大きな 鼻づら
    const hy = by + 3;
    for (const s of [-1, 1]) {
      p.ellipse(cx + s * 6.5, hy - 6.5, 1.8, 2.1, B);
      p.ellipse(cx + s * 6.5, hy - 6.1, 0.8, 1.0, PINK);
    }
    p.ellipse(cx, hy, 8.5, 6.5, B);
    for (const s of [-1, 1]) p.rect(Math.round(cx + s * 3.2 - (s < 0 ? 1 : 0)), Math.round(hy - 3), 1, 2, EYE);
    p.ellipse(cx, hy + 3, 6, 3.4, SN);
    for (const s of [-1, 1]) p.ellipse(cx + s * 2, hy + 2.4, 0.8, 0.7, shade(SN, -0.35));
    for (const s of [-1, 1]) p.ellipse(cx + s * 6, hy + 1, 1.2, 0.8, PINK);
  };
  const back = (p, f, layer) => {
    const cx = 18, by = 30 + BOB[f];
    if (layer === 'back') {
      // 頭（人の むこう）・耳
      p.ellipse(cx, by - 9, 7.5, 5.5, B);
      for (const s of [-1, 1]) {
        p.ellipse(cx + s * 5.5, by - 14, 1.8, 2.1, B);
        p.ellipse(cx + s * 5.5, by - 13.6, 0.8, 1.0, PINK);
      }
      stub(p, cx - 6, by + 3, 0, BD);
      stub(p, cx + 6, by + 3, 0, BD);
      return;
    }
    // おしり・うしろ足・しっぽ・くらぬの・雲
    p.ellipse(cx, by + 2, 12, 8.5, B);
    p.ellipse(cx, by + 6, 8, 2.2, BD);
    stub(p, cx - 7, by + 7, -0.5, B);
    stub(p, cx + 7, by + 7, 0.5, B);
    p.ellipse(cx, by + 4 + (f === 1 ? -0.5 : 0), 1.6, 1.4, BD);
    poly(p, [[cx - 11, by - 8], [cx + 11, by - 8], [cx + 10, by - 3], [cx - 10, by - 3]], '#3a6ad0');
    p.hline(cx - 11, cx + 11, Math.round(by - 8), '#f4f4f4');
    p.hline(cx - 10, cx + 10, Math.round(by - 3), '#f4f4f4');
    cloud(p, cx, 49, 26);
  };
  return {
    frames: 3,
    size: (view) => (view === 'side' ? [64, 52] : [36, 52]),
    rider: (view, f) => {
      const bob = Math.round(BOB[f]);
      if (view === 'side') return seat(36, 25 + bob, 34);
      return seat(18, 25 + bob, 34);
    },
    paint(p, view, f, layer) {
      if (view === 'side') side(p, f, layer);
      else if (view === 'front') front(p, f, layer);
      else back(p, f, layer);
    },
    fx: null,
    shadowScale: 1.5,
  };
}
