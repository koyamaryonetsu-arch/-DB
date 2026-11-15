// 第86回 A班: 幻の職業 2つの 乗り物の ドット絵（名前と 値段は shared/data/jobs-r86a.js の R86A_VEHICLES）
//  ・大きな白い犬（人とようかいのかけ橋）… ふさふさの 白い 大きな 犬。とがった 耳・長い 鼻・金の 目・赤い かざりひも・
//                                         上に まく 大きな しっぽ。足もとに 白い 風（こうか）
//  ・雷と炎の二ひきの竜（竜神の剣士）  … 青い 雷の 竜（おく）と 赤い 炎の 竜（てまえ）が、長い 体を より合わせて うねる。
//                                         首を 立てず、頭を 低く 前へ・体を 横に 長く（馬に 見えない ように。第85回 B班の 火竜と おなじ きまり）。
//                                         こうかは 青い いなずまと 赤い 火の粉
// render/vehicle-art.js が addR86aVehicleArt(ART, kit) を よぶ（kit … 乗り物の 絵の どうぐ）。かき方の きまりは vehicle-art.js と おなじ
//   むきは 'side'（ひだりむき）・'front'・'back'。'back' の 層は 乗る 人より うしろ、'front' の 層は まえ。fx … すきとおった こうか
//   どちらも 3コマ（幻の 乗り物と おなじ）

export function addR86aVehicleArt(ART, kit) {
  ART.white_dog = whiteDogArt(kit);
  ART.twin_dragons = twinDragonsArt(kit);
}

// ───────────── 大きな白い犬 ─────────────
function whiteDogArt({ seg, poly, shade, seat, rgba, twinkle }) {
  const C = '#f8f6f0', CD = shade(C, -0.16), CDD = shade(C, -0.3), CL = '#ffffff', PINK = '#f0b0b8', EYE = '#e8a818', NOSE = '#2a2230';
  const ROPE = '#d8202c', ROPED = '#9a1420', BEAD = '#f2c14e';
  // 足（つけね → 足先）と まるい 足
  const leg = (p, hx, hy, fx, fy, c) => {
    seg(p, hx, hy, fx, fy - 2, c, 4.6);
    p.ellipse(fx, fy - 1.4, 3.2, 1.9, c);
    p.hline(Math.round(fx - 2), Math.round(fx + 2), Math.round(fy - 0.5), CDD);
  };
  // とがった 耳（中は もも色）
  const ear = (p, x, y, s, c) => {
    poly(p, [[x - 2.6, y + 2.4], [x + 2.6, y + 2.4], [x + s * 0.8, y - 5]], c);
    poly(p, [[x - 1.2, y + 1.6], [x + 1.2, y + 1.6], [x + s * 0.7, y - 2.6]], PINK);
  };
  // ふさふさの しっぽ（上に まく）
  const tail = (p, x0, y0, dx, f, c) => {
    let x = x0, y = y0;
    for (let i = 0; i < 9; i++) {
      x += dx * (1 - i * 0.08) + Math.sin(i / 2 + f) * 0.4;
      y -= 1.5 + i * 0.12;
      p.ellipse(x + 0.6, y + 0.8, 3.9 - i * 0.12, 3.4 - i * 0.1, CD);
      p.ellipse(x, y, 3.8 - i * 0.12, 3.3 - i * 0.1, c);
    }
    p.ellipse(x, y - 1, 2.4, 2.2, CL);
  };
  // 赤い かざりひも（首の まわり・はしが たなびく）
  const rope = (p, x0, y0, x1, y1, f) => {
    seg(p, x0, y0, x1, y1, ROPE, 1.8);
    p.ellipse((x0 + x1) / 2, (y0 + y1) / 2 + 1.5, 1.4, 1.4, BEAD);
    const wave = [0, 1.2, 0.6][f];
    seg(p, x1, y1, x1 + 6, y1 - 2 + wave, ROPED, 1.2);
    seg(p, x1 + 6, y1 - 2 + wave, x1 + 10, y1 + wave, ROPE, 1);
  };
  const RUN = [[20, 44, 26, 50], [24, 48, 22, 46], [28, 52, 20, 42]];
  const side = (p, f, layer) => {
    const g = 51, by = 33;
    const L = RUN[f];
    if (layer === 'back') {
      leg(p, 27, by + 4, L[2], g, CD);
      leg(p, 46, by + 4, L[3], g, CD);
      tail(p, 50, by - 3, 1.5, f, C);
      return;
    }
    // からだ（ふさふさの 毛の もよう）
    p.ellipse(36, by, 17, 10, C);
    for (let i = 0; i < 6; i++) poly(p, [[22 + i * 5, by + 8], [24 + i * 5, by + 12], [26 + i * 5, by + 8]], C);
    p.hline(24, 48, by - 9, CL);
    p.ellipse(34, by + 5, 11, 3.8, CL);
    for (let i = 0; i < 4; i++) p.hline(28 + i * 5, 31 + i * 5, by - 4 + (i % 2), CD);
    // 首と 頭（長い 鼻）
    poly(p, [[24, by + 4], [28, by - 6], [18, by - 14], [12, by - 8]], C);
    p.ellipse(15, by - 12, 7.4, 6.4, C);
    p.ellipse(8, by - 9.6, 5.4, 3.2, C);
    p.ellipse(7, by - 8.4, 4, 2, CD);
    p.rect(2, by - 11, 2, 2, NOSE);
    ear(p, 14, by - 18, -1, C);
    ear(p, 19, by - 18, 1, CD);
    // 金の 目・まゆの 赤い しるし
    p.rect(10, by - 14, 2, 2, EYE);
    p.set(10, by - 14, '#fff6c0');
    p.hline(10, 12, by - 16, ROPE);
    rope(p, 22, by - 4, 27, by + 2, f);
    leg(p, 29, by + 4, L[0], g, C);
    leg(p, 44, by + 4, L[1], g, C);
  };
  const front = (p, f, layer) => {
    const cx = 18, g = 51, by = 32;
    const bob = f === 1 ? -1 : 0;
    if (layer === 'back') {
      p.ellipse(cx, by - 1 + bob, 12, 7.5, CD);
      tail(p, cx + 2, by - 6 + bob, 0.4, f, C);
      return;
    }
    p.ellipse(cx, by + 3 + bob, 11, 8, C);
    p.ellipse(cx, by + 5 + bob, 6.5, 4.6, CL);
    leg(p, cx - 6, by + 8, cx - 6, g - (f === 0 ? 2 : 0), C);
    leg(p, cx + 6, by + 8, cx + 6, g - (f === 2 ? 2 : 0), C);
    const hy = by + 2 + bob;
    p.ellipse(cx, hy - 2, 8, 6.4, C);
    ear(p, cx - 5, hy - 9, -1, C);
    ear(p, cx + 5, hy - 9, 1, C);
    for (const s of [-1, 1]) {
      p.rect(Math.round(cx + s * 3 - 1), Math.round(hy - 3), 2, 2, EYE);
      p.hline(Math.round(cx + s * 3 - 1), Math.round(cx + s * 3 + 1), Math.round(hy - 5), ROPE);
    }
    p.ellipse(cx, hy + 2, 4, 2.6, CL);
    p.rect(cx - 1, Math.round(hy + 1), 2, 2, NOSE);
    seg(p, cx - 7, hy + 5, cx + 7, hy + 5, ROPE, 1.6);
    p.ellipse(cx, hy + 6.4, 1.4, 1.4, BEAD);
  };
  const back = (p, f, layer) => {
    const cx = 18, g = 51, by = 32;
    const bob = f === 1 ? -1 : 0;
    if (layer === 'back') {
      p.ellipse(cx, by - 11 + bob, 6.8, 5.6, C);
      ear(p, cx - 4.6, by - 17 + bob, -1, C);
      ear(p, cx + 4.6, by - 17 + bob, 1, C);
      seg(p, cx - 6, by - 7 + bob, cx + 6, by - 7 + bob, ROPE, 1.6);
      leg(p, cx - 5, by + 4, cx - 5.5, g - (f === 2 ? 2 : 0), CD);
      leg(p, cx + 5, by + 4, cx + 5.5, g - (f === 0 ? 2 : 0), CD);
      return;
    }
    p.ellipse(cx, by + 2 + bob, 12, 8.4, C);
    p.hline(cx - 8, cx + 8, Math.round(by - 5 + bob), CL);
    leg(p, cx - 6.5, by + 6, cx - 6.5, g - (f === 0 ? 2 : 0), C);
    leg(p, cx + 6.5, by + 6, cx + 6.5, g - (f === 2 ? 2 : 0), C);
    tail(p, cx, by + 4 + bob, 0.3, f, C);
  };
  // 足もとの 白い 風・毛の きらきら
  const fx = (p, view, f) => {
    const w = view === 'side' ? 64 : 36;
    const W = rgba('#ffffff', 0.75), G = rgba('#d8fff0', 0.6);
    for (let i = 0; i < 4; i++) {
      const y = 46 + (i % 2) * 3;
      const x0 = ((i * 17 + f * 6) % (w + 10)) - 6;
      p.hline(Math.round(x0), Math.round(x0 + 7), y, i % 2 ? G : W);
    }
    if (view === 'side') for (let i = 0; i < 3; i++) p.hline(52 + ((f * 4 + i * 3) % 8), 63, 22 + i * 7, rgba('#ffffff', 0.55));
    for (let i = 0; i < 3; i++) twinkle(p, 6 + i * (w / 3) + f * 3, 14 + ((i + f) % 3) * 5, rgba('#ffd0d0', 0.85));
  };
  return {
    frames: 3,
    size: (view) => (view === 'side' ? [64, 52] : [36, 52]),
    rider: (view, f) => {
      const bob = f === 1 ? -1 : 0;
      if (view === 'side') return seat(36, 26 + bob, 34);
      return seat(18, 28 + bob, 34);
    },
    paint(p, view, f, layer) {
      if (view === 'side') side(p, f, layer);
      else if (view === 'front') front(p, f, layer);
      else back(p, f, layer);
    },
    fx,
    shadowScale: 1.7,
  };
}

// ───────────── 雷と炎の二ひきの竜 ─────────────
function twinDragonsArt({ seg, poly, shade, seat, rgba, twinkle }) {
  const BLUE = { b: '#2a6ae8', bd: shade('#2a6ae8', -0.25), bl: shade('#2a6ae8', 0.2), bel: '#a8d8ff', mane: '#fff080', horn: '#f0f8ff' };
  const RED = { b: '#d8301c', bd: shade('#d8301c', -0.22), bl: shade('#d8301c', 0.18), bel: '#ffb040', mane: '#f2c14e', horn: '#fff0c0' };
  const EYE = '#1b1330';
  const BOB = [0, -1, -0.5];
  // 体の 中心の 線（よこ。左が 頭）。ph … うねりの ずれ（2ひきが より合わさる）
  const spine = (f, by, ph) => {
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const x = 14 + i * 4.4;
      const y = by + Math.sin(i * 0.75 - f * 2.1 + ph) * 3.6 - (i > 9 ? (i - 9) * 2.2 : 0);
      pts.push([x, y]);
    }
    return pts;
  };
  const body = (p, S, K, w0) => {
    for (let i = S.length - 1; i > 0; i--) seg(p, S[i - 1][0], S[i - 1][1], S[i][0], S[i][1], K.b, Math.max(2.2, w0 - i * 0.5));
    for (let i = 1; i < S.length - 2; i++) seg(p, S[i][0], S[i][1] + 2.2, S[i + 1][0], S[i + 1][1] + 2.2, K.bel, Math.max(1.1, 3 - i * 0.18));
    for (let i = 1; i < S.length - 1; i += 2) poly(p, [[S[i][0] - 1.4, S[i][1] - 3], [S[i][0] + 0.5, S[i][1] - 6.4], [S[i][0] + 1.9, S[i][1] - 3]], K.mane);
  };
  const head = (p, H, K, f) => {
    p.ellipse(H[0] - 1, H[1] - 1, 5.6, 4.4, K.b);
    poly(p, [[H[0] - 4, H[1] - 3], [H[0] - 10.5, H[1] - 1.5], [H[0] - 10.5, H[1] + 1.5], [H[0] - 4, H[1] + 2.4]], K.bl);
    p.hline(Math.round(H[0] - 9.5), Math.round(H[0] - 4), Math.round(H[1] + 0.5), K.bd);
    p.set(Math.round(H[0] - 9.5), Math.round(H[1] - 1), EYE);
    p.rect(Math.round(H[0] - 2), Math.round(H[1] - 3), 2, 2, EYE);
    p.set(Math.round(H[0] - 2), Math.round(H[1] - 3), K.mane);
    seg(p, H[0] + 1, H[1] - 3.5, H[0] + 6, H[1] - 8, K.horn, 1.2);
    seg(p, H[0] + 3, H[1] - 2.5, H[0] + 8, H[1] - 5.5, K.horn, 1.1);
    seg(p, H[0] - 9, H[1] + 1.5, H[0] - 12.5, H[1] + 4 + (f === 1 ? 1 : 0), K.mane, 0.8);
  };
  const side = (p, f, layer) => {
    const by = 36 + BOB[f];
    // 青い 雷の 竜（おく・少し 上・うねりが はんたい）
    const SB = spine(f, by - 7, Math.PI);
    const SR = spine(f, by, 0);
    if (layer === 'back') {
      body(p, SB, BLUE, 7.6);
      head(p, [SB[0][0] + 3, SB[0][1]], BLUE, f);
      // しっぽの 先の 小さな いなずま
      const T = SB[SB.length - 1];
      poly(p, [[T[0], T[1] - 4], [T[0] + 3, T[1] - 1], [T[0] + 1, T[1] - 1], [T[0] + 4, T[1] + 3], [T[0] - 1, T[1]], [T[0] + 1, T[1]]], BLUE.mane);
      for (const i of [3, 8]) seg(p, SR[i][0] + 1, SR[i][1] + 3, SR[i][0] + 2, SR[i][1] + 7, RED.bd, 2);
      return;
    }
    // 赤い 炎の 竜（てまえ。人が 乗る）
    body(p, SR, RED, 8.4);
    const T = SR[SR.length - 1];
    p.ellipse(T[0] + 1.5, T[1] - 1.5, 2.4, 3, ['#fff0a0', '#ffb040', '#ff6a1c'][f]);
    p.ellipse(T[0] + 1.5, T[1] - 1, 1.2, 1.6, '#fff8d0');
    for (const i of [2, 7]) {
      seg(p, SR[i][0], SR[i][1] + 3, SR[i][0] - 1.5, SR[i][1] + 7.5, RED.b, 2.4);
      p.ellipse(SR[i][0] - 2, SR[i][1] + 8, 1.6, 1, RED.bl);
    }
    head(p, SR[0], RED, f);
  };
  // まえ・うしろ: 2ひきの 頭が ならび、体が より合わさって おくへ のびる
  const front = (p, f, layer) => {
    const cx = 18, by = 32 + BOB[f];
    if (layer === 'back') {
      for (let i = 0; i < 5; i++) {
        const y = by - 4 - i * 3.4;
        const sx = Math.sin(i * 1.1 - f * 2) * 6;
        p.ellipse(cx + sx, y, 5 - i * 0.6, 3 - i * 0.3, i % 2 ? BLUE.bd : BLUE.b);
        p.ellipse(cx - sx, y + 1, 5 - i * 0.6, 3 - i * 0.3, i % 2 ? RED.bd : RED.b);
      }
      return;
    }
    p.ellipse(cx, by + 3, 11, 6, RED.b);
    p.ellipse(cx, by + 5.5, 7, 2.8, RED.bel);
    for (const s of [-1, 1]) seg(p, cx + s * 6, by + 6, cx + s * 7, by + 10, RED.b, 2.2);
    // 2つの 頭（左 青・右 赤）
    for (const [s, K] of [[-1, BLUE], [1, RED]]) {
      const hx = cx + s * 6.5, hy = by + 10;
      p.ellipse(hx, hy, 5, 3.8, K.b);
      p.ellipse(hx, hy + 2.6, 3.2, 2, K.bl);
      seg(p, hx - 2, hy - 2.6, hx - 4.5, hy - 7, K.horn, 1.1);
      seg(p, hx + 2, hy - 2.6, hx + 4.5, hy - 7, K.horn, 1.1);
      p.rect(Math.round(hx - 2), Math.round(hy - 1.5), 1, 1, EYE);
      p.rect(Math.round(hx + 1), Math.round(hy - 1.5), 1, 1, EYE);
    }
  };
  const back = (p, f, layer) => {
    const cx = 18, by = 32 + BOB[f];
    if (layer === 'back') {
      for (const [s, K] of [[-1, BLUE], [1, RED]]) {
        const hy = by - 12;
        p.ellipse(cx + s * 6, hy, 4.6, 3.4, K.b);
        seg(p, cx + s * 6 - 2, hy - 2.4, cx + s * 6 - 4, hy - 6.5, K.horn, 1.1);
        seg(p, cx + s * 6 + 2, hy - 2.4, cx + s * 6 + 4, hy - 6.5, K.horn, 1.1);
      }
      return;
    }
    for (let i = 0; i < 5; i++) {
      const y = by - 2 + i * 3.4;
      const sx = Math.sin(i * 1.1 - f * 2) * 6;
      p.ellipse(cx + sx, y, 6.2 - i * 0.8, 3.4 - i * 0.35, i % 2 ? BLUE.bd : BLUE.b);
      p.ellipse(cx - sx, y + 1, 6.2 - i * 0.8, 3.4 - i * 0.35, i % 2 ? RED.bd : RED.b);
      poly(p, [[cx - sx - 1.2, y - 2], [cx - sx, y - 4.6], [cx - sx + 1.2, y - 2]], RED.mane);
    }
    p.ellipse(cx + Math.sin(5 * 1.1 - f * 2) * 6, by + 16, 2, 2.6, BLUE.mane);
    p.ellipse(cx - Math.sin(5 * 1.1 - f * 2) * 6, by + 16, 2.2, 2.8, '#ffb040');
  };
  // こうか: 青い いなずま（おくの 竜の まわり）と 赤い 火の粉（てまえの 竜の 下）
  const fx = (p, view, f) => {
    const w = view === 'side' ? 72 : 36;
    const Y = rgba('#fff080', 0.9), BL = rgba('#8ac8ff', 0.75), FR = rgba('#ffb040', 0.85), FD = rgba('#ff6a1c', 0.75);
    const zig = (x, y, n) => {
      let px = x, py = y;
      for (let i = 0; i < n; i++) {
        const nx = px + (i % 2 ? 2 : -2), ny = py + 2;
        seg(p, px, py, nx, ny, Y, 0.8);
        p.set(Math.round(nx) + 1, Math.round(ny), BL);
        px = nx;
        py = ny;
      }
    };
    for (let i = 0; i < 3; i++) zig(((i * 23 + f * 9) % (w - 8)) + 4, 8 + ((i + f) % 3) * 4, 3 + (i % 2));
    for (let i = 0; i < 6; i++) {
      const x = ((i * 13 + f * 5) % (w - 4)) + 2, y = 44 + ((i * 3 + f) % 5);
      p.ellipse(x, y, 1.2, 1.6, i % 2 ? FR : FD);
    }
    twinkle(p, 6 + f * 4, 20, rgba('#ffffff', 0.85));
  };
  return {
    frames: 3,
    size: (view) => (view === 'side' ? [72, 56] : [36, 56]),
    rider: (view, f) => {
      const bob = BOB[f];
      if (view === 'side') return seat(30, 32 + bob, 34);
      return seat(18, view === 'front' ? 29 + bob : 28 + bob, 34);
    },
    paint(p, view, f, layer) {
      if (view === 'side') side(p, f, layer);
      else if (view === 'front') front(p, f, layer);
      else back(p, f, layer);
    },
    fx,
    shadowScale: 1.7,
  };
}
