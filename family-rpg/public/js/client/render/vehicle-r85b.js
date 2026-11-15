// 第85回 B班の 乗り物の ドット絵: 火竜（烈火の炎の 系統。名前と 値段は shared/data/vehicles.js）
// 長い 体が S の 字に うねる 竜（足は 小さく、体の 下に 小さな 炎）。空に うかんで、コマごとに うねりが 前から うしろへ 流れる。
// 馬に 見えない ように、首を 立てず、頭を 低く 前に のばし、体を 横に 長く・しっぽを 上に はねる（金の 竜の 乗り物が 馬に 見えた ため）
// 体は 赤、おなかは だいだい、せなかに 金の たてがみ・頭に 2本の つの（オリジナルの ドット絵）
// render/vehicle-art.js が addR85bVehicleArt(ART, kit) を よぶ（kit … 乗り物の 絵の どうぐ）。かき方の きまりは vehicle-art.js と おなじ
//   むきは 'side'（ひだりむき）・'front'・'back'。'back' の 層は 乗る 人より うしろ、'front' の 層は まえ

export function addR85bVehicleArt(ART, kit) {
  ART.fire_dragon = dragonArt(kit);
}

function dragonArt({ seg, poly, shade, seat }) {
  const R = '#d8301c', RD = shade(R, -0.22), RL = shade(R, 0.18), BEL = '#ffb040', MANE = '#f2c14e', HORN = '#fff0c0', EYE = '#1b1330';
  const FL = ['#fff0a0', '#ffb040', '#ff6a1c'];
  const BOB = [0, -1, -0.5];
  // 体の 中心の 線（よこ。左が 頭）。f で うねりが 流れる
  const spine = (f, by) => {
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const x = 14 + i * 4.4;
      const y = by + Math.sin(i * 0.75 - f * 2.1) * 3.4 - (i > 9 ? (i - 9) * 2.2 : 0);
      pts.push([x, y]);
    }
    return pts;
  };
  // 小さな 炎（体の 下）
  const flame = (p, x, y, f, k) => {
    p.ellipse(x, y, 1.6, 2.4 + ((f + k) % 3) * 0.4, FL[(f + k) % 3]);
    p.set(Math.round(x), Math.round(y - 2), '#fff8d0');
  };
  const side = (p, f, layer) => {
    const by = 34 + BOB[f];
    const S = spine(f, by);
    if (layer === 'back') {
      // おくの 小さな 足（ふたつ）・体の 下の 炎
      for (const i of [3, 8]) seg(p, S[i][0] + 1, S[i][1] + 3, S[i][0] + 2, S[i][1] + 7, RD, 2);
      for (const i of [2, 5, 8, 11]) flame(p, S[i][0], S[i][1] + 9, f, i);
      return;
    }
    // 体（しっぽに 向かって ほそく）
    for (let i = S.length - 1; i > 0; i--) {
      const w = 6.2 - i * 0.36;
      seg(p, S[i - 1][0], S[i - 1][1], S[i][0], S[i][1], R, Math.max(2, w));
    }
    for (let i = 1; i < S.length - 2; i++) seg(p, S[i][0], S[i][1] + 1.6, S[i + 1][0], S[i + 1][1] + 1.6, BEL, Math.max(1.2, 2.4 - i * 0.12));
    // せなかの 金の たてがみ（ぎざぎざ）
    for (let i = 1; i < S.length - 1; i += 2) poly(p, [[S[i][0] - 1.5, S[i][1] - 2.4], [S[i][0] + 0.5, S[i][1] - 5.6], [S[i][0] + 2, S[i][1] - 2.4]], MANE);
    // しっぽの 先の 炎
    const T = S[S.length - 1];
    p.ellipse(T[0] + 1.5, T[1] - 1.5, 2.4, 3, FL[f % 3]);
    p.ellipse(T[0] + 1.5, T[1] - 1, 1.2, 1.6, '#fff8d0');
    // てまえの 小さな 足
    for (const i of [2, 7]) {
      seg(p, S[i][0], S[i][1] + 3, S[i][0] - 1.5, S[i][1] + 7.5, R, 2.4);
      p.ellipse(S[i][0] - 2, S[i][1] + 8, 1.6, 1, RL);
    }
    // 頭（低く 前に のびる。長い 口・つの・目・ひげ）
    const H = S[0];
    p.ellipse(H[0] - 1, H[1] - 1, 5.2, 4, R);
    poly(p, [[H[0] - 4, H[1] - 3], [H[0] - 11, H[1] - 1.5], [H[0] - 11, H[1] + 1.5], [H[0] - 4, H[1] + 2.5]], RL);
    p.hline(Math.round(H[0] - 10), Math.round(H[0] - 4), Math.round(H[1] + 0.5), RD);
    p.set(Math.round(H[0] - 10), Math.round(H[1] - 1), EYE);
    p.rect(Math.round(H[0] - 2), Math.round(H[1] - 3), 2, 2, EYE);
    p.set(Math.round(H[0] - 2), Math.round(H[1] - 3), '#ffe060');
    seg(p, H[0] + 1, H[1] - 3.5, H[0] + 6, H[1] - 8, HORN, 1.2);
    seg(p, H[0] + 3, H[1] - 2.5, H[0] + 8, H[1] - 5.5, HORN, 1.1);
    seg(p, H[0] - 9, H[1] + 1.5, H[0] - 13, H[1] + 4.5, MANE, 0.8);
  };
  // まえ・うしろ: 体が 左右に S の 字に うねって おくへ のびる
  const front = (p, f, layer) => {
    const cx = 18, by = 32 + BOB[f];
    if (layer === 'back') {
      // おくへ のびる 体（左右に うねる）・しっぽの 炎
      for (let i = 0; i < 5; i++) {
        const x = cx + Math.sin(i * 1.1 - f * 2) * 7, y = by - 4 - i * 3.6;
        p.ellipse(x, y, 5.6 - i * 0.7, 3.2 - i * 0.3, i % 2 ? RD : R);
        poly(p, [[x - 1.2, y - 2.6], [x, y - 5], [x + 1.2, y - 2.6]], MANE);
      }
      p.ellipse(cx + Math.sin(5 * 1.1 - f * 2) * 7, by - 23, 2, 2.6, FL[f % 3]);
      for (const s of [-1, 1]) flame(p, cx + s * 8, by + 12, f, s + 2);
      return;
    }
    // てまえの 体・小さな 足
    p.ellipse(cx, by + 3, 8, 5, R);
    p.ellipse(cx, by + 5, 5, 2.4, BEL);
    for (const s of [-1, 1]) seg(p, cx + s * 6, by + 6, cx + s * 7, by + 10, R, 2.2);
    // 頭（てまえ。下を むいて 前へ）・つの・目
    const hy = by + 10;
    p.ellipse(cx, hy, 6, 4.2, R);
    p.ellipse(cx, hy + 3, 4, 2.4, RL);
    for (const s of [-1, 1]) {
      seg(p, cx + s * 3.5, hy - 3, cx + s * 7.5, hy - 8, HORN, 1.2);
      p.rect(Math.round(cx + s * 2.6 - 0.5), Math.round(hy - 1.5), 1.5, 1.5, EYE);
      seg(p, cx + s * 2.5, hy + 4, cx + s * 7, hy + 7, MANE, 0.8);
    }
  };
  const back = (p, f, layer) => {
    const cx = 18, by = 32 + BOB[f];
    if (layer === 'back') {
      // 頭（むこう）・つの
      const hy = by - 12;
      p.ellipse(cx, hy, 5.4, 3.8, R);
      for (const s of [-1, 1]) seg(p, cx + s * 3, hy - 2.5, cx + s * 6.5, hy - 7, HORN, 1.2);
      return;
    }
    // てまえに のびて うねる 体・しっぽの 炎
    for (let i = 0; i < 5; i++) {
      const x = cx + Math.sin(i * 1.1 - f * 2) * 7, y = by - 2 + i * 3.4;
      p.ellipse(x, y, 7 - i * 0.9, 3.6 - i * 0.35, i % 2 ? RD : R);
      poly(p, [[x - 1.3, y - 2.8], [x, y - 5.4], [x + 1.3, y - 2.8]], MANE);
    }
    p.ellipse(cx + Math.sin(5 * 1.1 - f * 2) * 7, by + 16, 2.2, 2.8, FL[f % 3]);
    for (const s of [-1, 1]) flame(p, cx + s * 9, by + 12, f, s + 2);
  };
  return {
    frames: 3,
    size: (view) => (view === 'side' ? [72, 52] : [36, 52]),
    rider: (view, f) => {
      const bob = BOB[f];
      if (view === 'side') return seat(30, 27 + bob, 34);
      return seat(18, 25 + bob, 34);
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
