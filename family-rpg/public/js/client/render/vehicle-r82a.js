// 第82回 A班の 乗り物の ドット絵: 二またの大ねこ（犬夜叉の 系統。名前と 値段は shared/data/vehicles.js）
// クリーム色の 大きな ねこ・先の 黒い 耳・しっぽが 2本・ひたいの もよう・赤い 目・足もとの ほのお（オリジナルの ドット絵）
// render/vehicle-art.js が addR82aVehicleArt(ART, kit) を よぶ（kit … 乗り物の 絵の どうぐ）。かき方の きまりは vehicle-art.js と おなじ
//   むきは 'side'（ひだりむき）・'front'・'back'。'back' の 層は 乗る 人より うしろ、'front' の 層は まえ

export function addR82aVehicleArt(ART, kit) {
  ART.twin_cat = twinCatArt(kit);
}

function twinCatArt({ seg, poly, shade, seat }) {
  const C = '#f2e2bc', CD = shade(C, -0.22), CL = shade(C, 0.12), BLK = '#2a2230', EYE = '#d8282a';
  const FL = '#ff8a2a', FY = '#ffe25a';
  // 足もとの ほのお（小さな 2だんの ほのお。f で ゆれる）
  const flame = (p, x, y, f) => {
    const h = f === 1 ? 3.6 : 2.8;
    p.ellipse(x, y - 0.5, 2.4, h * 0.6, FL);
    p.ellipse(x + (f === 2 ? 0.5 : -0.3), y - h * 0.7, 1.4, h * 0.5, FY);
  };
  // 足（つけね → 足先）と まるい 足
  const leg = (p, hx, hy, fx, fy, c, f) => {
    seg(p, hx, hy, fx, fy - 2, c, 4.4);
    p.ellipse(fx, fy - 1.6, 3.0, 1.9, c);
    flame(p, fx, fy + 1.2, f);
  };
  // 耳（先が 黒い 三角）
  const ear = (p, x, y, s, c) => {
    poly(p, [[x - 2.4, y + 2], [x + 2.4, y + 2], [x + s * 0.6, y - 4]], c);
    poly(p, [[x - 1 + s * 0.4, y - 1.6], [x + 1 + s * 0.4, y - 1.6], [x + s * 0.6, y - 4]], BLK);
  };
  // しっぽ（2本。先は 黒）
  const tail = (p, x0, y0, dx, dy, f, c) => {
    let x = x0, y = y0;
    for (let i = 0; i < 9; i++) {
      const w = Math.sin(i / 2.5 + f) * 0.6;
      x += dx + w;
      y += dy - i * 0.12;
      p.ellipse(x, y, 2.6 - i * 0.1, 2.6 - i * 0.1, i >= 7 ? BLK : c);
    }
  };
  // 足の いち（よこ。f … 0〜2）: [てまえ前, てまえ後ろ, おく前, おく後ろ] の 足先の x
  const RUN = [[20, 44, 26, 50], [24, 48, 22, 46], [28, 52, 20, 42]];
  const side = (p, f, layer) => {
    const g = 50, by = 33;
    const L = RUN[f];
    if (layer === 'back') {
      // おくの 足・2本の しっぽ（うしろへ・上へ）
      leg(p, 26, by + 4, L[2], g, CD, f);
      leg(p, 46, by + 4, L[3], g, CD, (f + 1) % 3);
      tail(p, 49, by - 2, 1.0, -1.1, f, CD);
      tail(p, 49, by, 1.3, -0.6, f + 1, C);
      return;
    }
    // からだ
    p.ellipse(36, by, 16, 9.5, C);
    p.hline(24, 48, by - 9, CL);
    p.ellipse(34, by + 5, 10, 3.8, CL);
    // 首と 頭
    poly(p, [[24, by + 3], [27, by - 5], [17, by - 13], [12, by - 8]], C);
    p.ellipse(14, by - 12, 8, 7, C);
    ear(p, 12, by - 18, -1, C);
    ear(p, 18, by - 18, 1, CD);
    // ひたいの もよう（黒い ひし形）・赤い 目・はな
    poly(p, [[14, by - 17], [15.5, by - 15], [14, by - 13], [12.5, by - 15]], BLK);
    p.rect(9, by - 13, 2, 2, EYE);
    p.ellipse(7.4, by - 9.4, 3.4, 2.4, CL);
    p.set(5, by - 10, BLK);
    // てまえの 足
    leg(p, 28, by + 4, L[0], g, C, (f + 2) % 3);
    leg(p, 44, by + 4, L[1], g, C, f);
  };
  const front = (p, f, layer) => {
    const cx = 18, g = 50, by = 32;
    const bob = f === 1 ? -1 : 0;
    if (layer === 'back') {
      // せなかと 2本の しっぽ（人の むこう）
      p.ellipse(cx, by - 1 + bob, 11, 7, CD);
      tail(p, cx - 3, by - 6 + bob, -0.8, -1.2, f, CD);
      tail(p, cx + 3, by - 6 + bob, 0.8, -1.2, f + 1, CD);
      return;
    }
    // むね・足
    p.ellipse(cx, by + 3 + bob, 10, 7.5, C);
    p.ellipse(cx, by + 5 + bob, 6, 4.5, CL);
    leg(p, cx - 6, by + 8, cx - 6, g - (f === 0 ? 2 : 0), C, f);
    leg(p, cx + 6, by + 8, cx + 6, g - (f === 2 ? 2 : 0), C, (f + 1) % 3);
    // 頭（てまえ）・耳・もよう・目
    const hy = by + 2 + bob;
    p.ellipse(cx, hy - 2, 7.6, 6, C);
    ear(p, cx - 5, hy - 8, -1, C);
    ear(p, cx + 5, hy - 8, 1, C);
    poly(p, [[cx, hy - 7], [cx + 1.5, hy - 5], [cx, hy - 3], [cx - 1.5, hy - 5]], BLK);
    for (const s of [-1, 1]) p.rect(Math.round(cx + s * 3 - 1), Math.round(hy - 3), 2, 2, EYE);
    p.ellipse(cx, hy + 1.6, 3.6, 2.2, CL);
    p.set(cx, Math.round(hy + 1), BLK);
  };
  const back = (p, f, layer) => {
    const cx = 18, g = 50, by = 32;
    const bob = f === 1 ? -1 : 0;
    if (layer === 'back') {
      // 頭と 耳（人の むこう）・まえ足
      p.ellipse(cx, by - 11 + bob, 6.4, 5.4, C);
      ear(p, cx - 4.4, by - 16 + bob, -1, C);
      ear(p, cx + 4.4, by - 16 + bob, 1, C);
      leg(p, cx - 5, by + 4, cx - 5.5, g - (f === 2 ? 2 : 0), CD, f);
      leg(p, cx + 5, by + 4, cx + 5.5, g - (f === 0 ? 2 : 0), CD, (f + 1) % 3);
      return;
    }
    // おしり・うしろ足・2本の しっぽ（上へ ゆれる）
    p.ellipse(cx, by + 2 + bob, 11, 8, C);
    p.hline(cx - 8, cx + 8, Math.round(by - 5 + bob), CL);
    leg(p, cx - 6.5, by + 6, cx - 6.5, g - (f === 0 ? 2 : 0), C, (f + 2) % 3);
    leg(p, cx + 6.5, by + 6, cx + 6.5, g - (f === 2 ? 2 : 0), C, f);
    tail(p, cx - 2, by + 4 + bob, -0.9, -1.1, f, C);
    tail(p, cx + 2, by + 4 + bob, 0.9, -1.1, f + 1, C);
  };
  return {
    frames: 3,
    size: (view) => (view === 'side' ? [64, 52] : [36, 52]),
    rider: (view, f) => {
      const bob = f === 1 ? -1 : 0;
      if (view === 'side') return seat(36, 27 + bob, 34);
      return seat(18, 28 + bob, 34);
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
