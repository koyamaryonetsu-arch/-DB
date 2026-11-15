// 第85回 A班の 乗り物の ドット絵: ごちそうの荷車（スレイヤーズの 系統。名前と 値段は shared/data/vehicles.js）
// 子どもの 竜（みどりの まるい 体・小さな つばさ・しっぽ）が、ごちそう（ほね つきの 肉・まるい パン・赤い 実）を つんだ 木の 荷車を ひく。
// 乗る 人は 荷車の こしかけに すわる（またがらない）。竜は 3コマで とことこ 歩き、車輪が 回る（オリジナルの ドット絵）
// render/vehicle-art.js が addR85aVehicleArt(ART, kit) を よぶ（kit … 乗り物の 絵の どうぐ）。かき方の きまりは vehicle-art.js と おなじ
//   むきは 'side'（ひだりむき）・'front'・'back'。'back' の 層は 乗る 人より うしろ、'front' の 層は まえ

export function addR85aVehicleArt(ART, kit) {
  ART.feast_cart = feastCartArt(kit);
}

function feastCartArt({ seg, poly, shade, seat }) {
  const DG = '#5ab84a', DGD = shade(DG, -0.25), DGL = shade(DG, 0.25), BELLY = '#f2e6a0', EYE = '#1a1620', WING = '#e86a4a';
  const WOOD = '#9a6a3a', WOODD = shade(WOOD, -0.3), WOODL = shade(WOOD, 0.2), WHEEL = '#6a4422', HUB = '#f2c14e';
  const MEAT = '#c8603a', BONE = '#f6f0e0', BREAD = '#e8b060', FRUIT = '#e8282a', LEAF = '#3a9a3a', CLOTH = '#f6f2e6', RED = '#d42a2a';
  // 車輪（f で スポークが 回る）
  const wheel = (p, cx, cy, r, f) => {
    p.ellipse(cx, cy, r, r, WHEEL);
    p.ellipse(cx, cy, r - 1.4, r - 1.4, WOODL);
    const a = (f * Math.PI) / 3;
    for (let k = 0; k < 3; k++) {
      const t = a + (k * Math.PI) / 3;
      seg(p, cx - Math.cos(t) * (r - 1), cy - Math.sin(t) * (r - 1), cx + Math.cos(t) * (r - 1), cy + Math.sin(t) * (r - 1), WHEEL, 1);
    }
    p.ellipse(cx, cy, 1.4, 1.4, HUB);
  };
  // つみあげた ごちそう（x0 … 左はし・y … 荷台の 上）
  const food = (p, x0, y, w) => {
    p.ellipse(x0 + w * 0.3, y - 2, 5, 3.4, BREAD);
    p.hline(Math.round(x0 + w * 0.3 - 3), Math.round(x0 + w * 0.3 + 2), Math.round(y - 4), shade(BREAD, 0.25));
    // ほね つきの 肉
    p.ellipse(x0 + w * 0.62, y - 4, 4.4, 3.2, MEAT);
    seg(p, x0 + w * 0.62 + 3, y - 6, x0 + w * 0.62 + 7, y - 9, BONE, 1.6);
    p.ellipse(x0 + w * 0.62 + 7.4, y - 9.4, 1.4, 1.4, BONE);
    // 赤い 実と 葉
    p.ellipse(x0 + w * 0.12, y - 1.5, 2.2, 2.2, FRUIT);
    p.ellipse(x0 + w * 0.86, y - 1.5, 2.2, 2.2, FRUIT);
    p.set(Math.round(x0 + w * 0.12), Math.round(y - 4), LEAF);
  };
  // 子どもの 竜（よこ。x … 頭の 先・by … 体の まん中・f … 歩き）
  const dragonSide = (p, x, by, f) => {
    const step = [0, 1, 0][f], lift = [[0, -2], [0, 0], [-2, 0]][f];
    // しっぽ
    seg(p, x + 18, by + 1, x + 24, by - 3, DG, 2.4);
    // 体（まるい）・おなか
    p.ellipse(x + 13, by + 1 - step, 7, 5.5, DG);
    p.ellipse(x + 12, by + 3 - step, 4.6, 2.6, BELLY);
    // 小さな つばさ（あかい まく）
    poly(p, [[x + 13, by - 4 - step], [x + 18, by - 9 - step], [x + 17, by - 3 - step]], WING);
    // 頭・目・はな・小さな つの
    p.ellipse(x + 5, by - 4 - step, 5, 4.2, DGL);
    p.ellipse(x + 1.6, by - 3 - step, 2.4, 2, DGL);
    p.set(Math.round(x + 4), Math.round(by - 6 - step), EYE);
    p.set(Math.round(x + 0.6), Math.round(by - 3.4 - step), DGD);
    seg(p, x + 7, by - 8 - step, x + 8.4, by - 10.6 - step, BELLY, 1.2);
    // 足（2本ずつ。とことこ）
    seg(p, x + 9, by + 5, x + 9 + lift[0], 50 + lift[1], DGD, 2.4);
    seg(p, x + 16, by + 5, x + 16 + lift[1], 50 + lift[0], DGD, 2.4);
  };
  const side = (p, f, layer) => {
    const by = 38, cy = 30;
    if (layer === 'back') {
      // おくの 車輪
      wheel(p, 47, 44, 5.6, f);
      return;
    }
    // ひく ぼう（竜の 体から 荷車へ）
    seg(p, 16, by - 1, 30, cy + 6, WOODD, 1.4);
    dragonSide(p, 0, by, f);
    // 荷台（木の はこ）・ふちの 赤い 布
    poly(p, [[28, cy], [62, cy], [61, cy + 9], [29, cy + 9]], WOOD);
    p.hline(28, 62, cy, WOODL);
    p.hline(29, 61, cy + 9, WOODD);
    for (let x = 34; x < 62; x += 7) seg(p, x, cy + 1, x, cy + 8, WOODD, 0.8);
    poly(p, [[28, cy + 2], [62, cy + 2], [62, cy + 4], [28, cy + 4]], RED);
    // うしろの ごちそう（人の うしろ）
    food(p, 46, cy, 16);
    // てまえの 車輪
    wheel(p, 44, 44, 6, f);
  };
  const front = (p, f, layer) => {
    const cx = 18;
    const bob = f === 1 ? -1 : 0;
    if (layer === 'back') {
      // 荷台と ごちそう（人の うしろ）
      poly(p, [[cx - 14, 26], [cx + 14, 26], [cx + 13, 36], [cx - 13, 36]], WOOD);
      p.hline(cx - 14, cx + 14, 26, WOODL);
      food(p, cx - 10, 26, 20);
      wheel(p, cx - 12, 43, 4.5, f);
      wheel(p, cx + 12, 43, 4.5, f);
      return;
    }
    // 竜（てまえ。人の 足もとの 下）
    const hy = 40 + bob;
    p.ellipse(cx, hy + 2, 7, 5.5, DG);
    p.ellipse(cx, hy + 3, 4, 3, BELLY);
    for (const s of [-1, 1]) poly(p, [[cx + s * 5, hy - 2], [cx + s * 10, hy - 6], [cx + s * 8, hy + 1]], WING);
    p.ellipse(cx, hy - 4, 5, 4.2, DGL);
    for (const s of [-1, 1]) {
      p.set(Math.round(cx + s * 2), Math.round(hy - 5), EYE);
      seg(p, cx + s * 2.6, hy - 8, cx + s * 3.4, hy - 10.4, BELLY, 1.1);
    }
    seg(p, cx - 4, hy + 6, cx - 4, 50 - (f === 0 ? 2 : 0), DGD, 2.2);
    seg(p, cx + 4, hy + 6, cx + 4, 50 - (f === 2 ? 2 : 0), DGD, 2.2);
  };
  const back = (p, f, layer) => {
    const cx = 18;
    const bob = f === 1 ? -1 : 0;
    if (layer === 'back') {
      // 竜の 頭と つばさ（人の むこう）
      p.ellipse(cx, 16 + bob, 4.6, 4, DG);
      for (const s of [-1, 1]) poly(p, [[cx + s * 4, 19 + bob], [cx + s * 9, 14 + bob], [cx + s * 7, 21 + bob]], WING);
      return;
    }
    // 荷台の うしろ（木と 赤い 布）・車輪・はみ出した ごちそう
    poly(p, [[cx - 14, 30], [cx + 14, 30], [cx + 13, 40], [cx - 13, 40]], WOOD);
    p.hline(cx - 14, cx + 14, 30, WOODL);
    poly(p, [[cx - 14, 33], [cx + 14, 33], [cx + 14, 35], [cx - 14, 35]], RED);
    p.ellipse(cx - 8, 30, 3, 2.2, BREAD);
    p.ellipse(cx + 8, 30, 2.2, 2.2, FRUIT);
    p.rect(cx - 2, 36, 4, 2, CLOTH);
    wheel(p, cx - 12, 44, 4.5, f);
    wheel(p, cx + 12, 44, 4.5, f);
  };
  return {
    frames: 3,
    size: (view) => (view === 'side' ? [64, 52] : [36, 52]),
    rider: (view, f) => {
      const bob = f === 1 ? -1 : 0;
      if (view === 'side') return seat(40, 30 + bob, 33);
      return seat(18, 30 + bob, 33);
    },
    paint(p, view, f, layer) {
      if (view === 'side') side(p, f, layer);
      else if (view === 'front') front(p, f, layer);
      else back(p, f, layer);
    },
    fx: null,
    shadowScale: 2.0,
  };
}
