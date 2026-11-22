// 第84回 A班の 乗り物の ドット絵: 青いれい界の鳥（幽☆遊☆白書の 系統。名前と 値段は shared/data/vehicles.js）
// まるい 青い からだの 大きな 鳥。白い おなか・オレンジの くちばし・頭の 上に ぴょんと 毛・大きな つばさを ゆっくり はばたく（オリジナルの ドット絵）
// render/vehicle-art.js が addR84aVehicleArt(ART, kit) を よぶ（kit … 乗り物の 絵の どうぐ）。かき方の きまりは vehicle-art.js と おなじ
//   むきは 'side'（ひだりむき）・'front'・'back'。'back' の 層は 乗る 人より うしろ、'front' の 層は まえ

export function addR84aVehicleArt(ART, kit) {
  ART.rei_bird = birdArt(kit);
}

export function birdArt({ seg, poly, shade, seat }) {
  const B = '#3a8ae8', BD = shade(B, -0.22), BL = '#7ac0ff';
  const BELLY = '#eef6ff', BEAK = '#f2a03a', EYE = '#1b1330', TUFT = '#a8dcff';
  // はばたき（f … 0〜2）: つばさの 角度・からだの 上下
  const BOB = [0, -1.5, -0.5];
  const FLAP = [0, -7, -3];
  // つばさ（x, y … つけね。dir … ±1。up … 上がりぐあい）
  const wing = (p, x, y, dir, up, c) => {
    poly(p, [[x, y], [x + dir * 16, y - 4 + up], [x + dir * 20, y + 2 + up * 0.6], [x + dir * 12, y + 6], [x + dir * 2, y + 6]], c);
    seg(p, x + dir * 4, y + 3, x + dir * 16, y + 1 + up * 0.8, shade(c, -0.15), 1.2);
  };
  const side = (p, f, layer) => {
    const by = 30 + BOB[f];
    if (layer === 'back') {
      // おくの つばさ・あし
      wing(p, 38, by - 4, 1, FLAP[f], BD);
      seg(p, 32, by + 7, 31, by + 13, '#e88a2a', 1.4);
      return;
    }
    // まるい からだ・おなか・しっぽ
    p.ellipse(36, by, 15, 9, B);
    p.ellipse(36, by - 6.5, 11, 2.2, BL);
    p.ellipse(32, by + 4, 10, 4, BELLY);
    poly(p, [[50, by - 3], [58, by - 7], [57, by + 1], [50, by + 3]], BD);
    // 頭・くちばし・目・頭の 毛
    p.ellipse(18, by - 8, 8, 7.5, B);
    p.ellipse(17, by - 5, 5, 3.5, BELLY);
    poly(p, [[11, by - 9], [4, by - 7], [11, by - 5]], BEAK);
    p.rect(14, Math.round(by - 11), 2, 2, EYE);
    p.set(14, Math.round(by - 11), '#ffffff');
    seg(p, 19, by - 15, 17, by - 19, TUFT, 1.4);
    seg(p, 20, by - 15, 22, by - 19, TUFT, 1.2);
    // てまえの あし・つばさ
    seg(p, 40, by + 8, 41, by + 14, '#e88a2a', 1.4);
    wing(p, 34, by - 3, 1, FLAP[f], B);
  };
  const front = (p, f, layer) => {
    const cx = 28, by = 30 + BOB[f];
    if (layer === 'back') {
      // 左右の つばさ（人の うしろ）・からだ
      wing(p, cx - 8, by - 4, -1, FLAP[f], BD);
      wing(p, cx + 8, by - 4, 1, FLAP[f], BD);
      p.ellipse(cx, by - 1, 12, 8, BD);
      return;
    }
    // むね・頭（てまえ）・くちばし・目・毛・あし
    p.ellipse(cx, by + 3, 12, 7.5, B);
    p.ellipse(cx, by + 5, 8, 4.5, BELLY);
    const hy = by + 1;
    p.ellipse(cx, hy, 7.5, 6.5, B);
    for (const s of [-1, 1]) p.rect(Math.round(cx + s * 3 - (s < 0 ? 1 : 0)), Math.round(hy - 2), 1, 2, EYE);
    poly(p, [[cx - 2, hy + 1], [cx + 2, hy + 1], [cx, hy + 4]], BEAK);
    seg(p, cx, hy - 6, cx - 2, hy - 10, TUFT, 1.4);
    seg(p, cx + 1, hy - 6, cx + 3, hy - 10, TUFT, 1.2);
    for (const s of [-1, 1]) seg(p, cx + s * 5, by + 10, cx + s * 5, by + 15, '#e88a2a', 1.4);
  };
  const back = (p, f, layer) => {
    const cx = 28, by = 30 + BOB[f];
    if (layer === 'back') {
      // 頭（人の むこう）・毛
      p.ellipse(cx, by - 9, 7, 5.5, B);
      seg(p, cx, by - 13, cx - 2, by - 17, TUFT, 1.4);
      seg(p, cx + 1, by - 13, cx + 3, by - 17, TUFT, 1.2);
      return;
    }
    // せなか・つばさ・しっぽ・あし
    p.ellipse(cx, by + 2, 12, 8.5, B);
    p.ellipse(cx, by - 4, 9, 2, BL);
    wing(p, cx - 8, by - 2, -1, FLAP[f], B);
    wing(p, cx + 8, by - 2, 1, FLAP[f], B);
    poly(p, [[cx - 4, by + 9], [cx + 4, by + 9], [cx + 2, by + 14], [cx - 2, by + 14]], BD);
    for (const s of [-1, 1]) seg(p, cx + s * 5, by + 9, cx + s * 5, by + 15, '#e88a2a', 1.4);
  };
  return {
    frames: 3,
    size: (view) => (view === 'side' ? [64, 52] : [56, 52]),
    rider: (view, f) => {
      const bob = Math.round(BOB[f]);
      return view === 'side' ? seat(36, 25 + bob, 34) : seat(28, 25 + bob, 34);
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
