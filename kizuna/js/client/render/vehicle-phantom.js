// 第79回: 幻の職業の 乗り物の ドット絵（12こ。名前と ねだんは shared/data/vehicles-phantom.js）
// render/vehicle-art.js が addPhantomVehicleArt(ART, kit) を よぶ（kit … 乗り物の 絵の どうぐ）。かき方の きまりは vehicle-art.js と おなじ
//   ・むきは 'side'（ひだりむき。みぎむきは はんてん）・'front'（down）・'back'（up）
//   ・'back' の 層は 乗る 人より うしろ、'front' の 層は まえ。fx … すきとおった こうか（ふちどり なし。fxUnder なら いちばん うしろ）
//   ・どれも 3コマ（動きの ある 絵）。伝説の 乗り物（勇者の天馬・空飛ぶ玉座）より 1だん ごうかに
//   ・2D と 2.5D は おなじ 絵（client/field.js の vehicleSprite）。ほかの 人の 画面も おなじ

export function addPhantomVehicleArt(ART, kit) {
  ART.sky_galleon = galleonArt(kit);
  ART.thunder_dragon = thunderDragonArt(kit);
  ART.sun_toad = sunToadArt(kit);
  ART.hover_pod = hoverPodArt(kit);
  ART.detective_blimp = blimpArt(kit);
  ART.moon_carriage = moonCarriageArt(kit);
  ART.magic_disc = magicDiscArt(kit);
  ART.gold_mikoshi = mikoshiArt(kit);
  ART.rocket_mamachari = rocketMamachariArt(kit);
  ART.tiny_planet = tinyPlanetArt(kit);
  ART.dream_express = dreamExpressArt(kit);
  ART.typhoon_eye = typhoonArt(kit);
}

// ───────────── 小さな どうぐ ─────────────
const TAU = Math.PI * 2;
const GOLD = '#f2c14e', GOLDD = '#b8862a', GOLDL = '#fff2a8';
// 3コマの 乗り物の かた（size・rider・paint・fx）
function art({ sw, fw, h, rider, paint, fx = null, fxUnder = false, shadow = 1.6 }) {
  return {
    frames: 3,
    size: (view) => (view === 'side' ? [sw, h] : [fw, h]),
    rider,
    paint,
    fx,
    fxUnder,
    shadowScale: shadow,
  };
}
// 5つの かどの 星（rot … まわす。sy … たての ちぢみ）
function starPts(x, y, r, rot = 0, sy = 1, inner = 0.45) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + rot + (i * Math.PI) / 5, rr = i % 2 ? r * inner : r;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * sy]);
  }
  return pts;
}
// だえんの 上半分（back）か 下半分（front）だけ ぬる
function halfEllipse(p, cx, cy, rx, ry, c, front) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    if (front ? y + 0.5 < cy : y + 0.5 >= cy) continue;
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) p.set(x, y, c);
    }
  }
}
// だえんの ふち（front … てまえ半分・false … おく半分・null … ぜんぶ）
function ring(p, cx, cy, rx, ry, c, front = null, n = 96) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, s = Math.sin(a);
    if (front === true && s < 0) continue;
    if (front === false && s >= 0) continue;
    p.set(cx + Math.cos(a) * rx, cy + s * ry, c);
  }
}
// いなずま（ジグザグ）。seed で 形が かわる
function bolt(p, x, y, n, dx, dy, seed, core, glow) {
  let px = x, py = y;
  const pts = [[px, py]];
  for (let i = 0; i < n; i++) {
    const w = (((seed * 7 + i * 5) % 5) - 2) * 1.2;
    px += dx + w * Math.abs(dy) / 3;
    py += dy + w * Math.abs(dx) / 3;
    pts.push([px, py]);
  }
  const line = (c, ox, oy) => {
    for (let i = 0; i + 1 < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
      const m = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) * 1.5));
      for (let k = 0; k <= m; k++) p.set(ax + ((bx - ax) * k) / m + ox, ay + ((by - ay) * k) / m + oy, c);
    }
  };
  if (glow) { line(glow, 1, 0); line(glow, -1, 0); line(glow, 0, 1); }
  line(core, 0, 0);
}
// わたぐもの ひとつぶ（下は かげ）
function puff(p, x, y, r, c, cD) {
  p.ellipse(x, y + r * 0.35, r, r * 0.75, cD);
  p.ellipse(x, y, r, r * 0.8, c);
}
// ずらして かく（宇宙ママチャリ。もとの 自転車の 絵を うかせる）
function shifted(p, dx, dy) {
  return {
    w: p.w, h: p.h,
    set: (x, y, c) => p.set(x + dx, y + dy, c),
    get: (x, y) => p.get(x + dx, y + dy),
    rect: (x, y, w, h, c) => p.rect(Math.round(x + dx), Math.round(y + dy), w, h, c),
    hline: (x1, x2, y, c) => p.hline(Math.round(x1 + dx), Math.round(x2 + dx), Math.round(y + dy), c),
    vline: (x, y1, y2, c) => p.vline(Math.round(x + dx), Math.round(y1 + dy), Math.round(y2 + dy), c),
    ellipse: (cx, cy, rx, ry, c) => p.ellipse(cx + dx, cy + dy, rx, ry, c),
  };
}

// ───────────── 1. 海賊王: 空飛ぶ王の海賊船（雲の 海を 走る。ほに 風） ─────────────
function galleonArt({ box, seg, poly, rgba, shade, twinkle, stand }) {
  const H = 64, G = H - 2, SW = 80, FW = 52;
  const WOOD = '#8a4a24', WOODD = shade(WOOD, -0.3), WOODL = shade(WOOD, 0.18);
  const RED = '#c8303a', SAIL = '#fbf6e8', SAILD = '#ddd2b8', BLACK = '#2a2630', HAT = '#f2d060';
  const BOB = [0, -1, -2];
  const T = (f) => G - 22 + BOB[f]; // かんぱん
  const B = (f) => G - 10 + BOB[f]; // 船の そこ
  // ほ（ふくらむ）。x0..x1・y0..y1。bulge … まえ（ひだり）への ふくらみ
  const sideSail = (p, x0, x1, y0, y1, bulge, c, cD) => {
    const pts = [[x1, y0], [x1, y1]];
    for (let k = 0; k <= 8; k++) {
      const u = 1 - k / 8, y = y0 + (y1 - y0) * u;
      pts.push([x0 - Math.sin(u * Math.PI) * bulge, y]);
    }
    poly(p, pts, c);
    for (let k = 1; k < 4; k++) seg(p, x1 - 1, y0 + ((y1 - y0) * k) / 4, x0 - bulge * 0.7, y0 + ((y1 - y0) * k) / 4, cD);
  };
  // はた（どくろに むぎわらぼうし。風で ゆれる）
  const flag = (p, x, y, f) => {
    for (let i = 0; i < 10; i++) {
      const wy = Math.round(Math.sin(i * 0.8 + f * 2.1));
      p.vline(x + 1 + i, y + wy, y + 6 + wy, BLACK);
    }
    const wy = Math.round(Math.sin(4.5 * 0.8 + f * 2.1));
    p.rect(x + 4, y + 3 + wy, 3, 2, '#f4f0e8');
    p.hline(x + 3, x + 7, y + 2 + wy, HAT);
    p.hline(x + 4, x + 6, y + 1 + wy, HAT);
    p.set(x + 5, y + 2 + wy, RED);
  };
  const mast = (p, x, t, f, sailC, sailD, wide) => {
    seg(p, x, t + 2, x, t - 33, WOODD, 2.2);
    flag(p, x, t - 39, f);
    seg(p, x, t - 33, x, t - 39, WOODD, 1.2);
    if (wide) {
      // まえ・うしろから: 四角い ほ（下が ふくらむ）
      const bl = [3, 5, 4][f];
      for (let y = t - 30; y <= t - 9; y++) {
        const u = (y - (t - 30)) / 21;
        const half = 16 + Math.sin(u * Math.PI) * 1.5;
        p.hline(Math.round(x - half), Math.round(x + half), y, (y === t - 19 || y === t - 18) ? RED : sailC);
      }
      for (let i = -16; i <= 16; i++) p.vline(x + i, t - 9, Math.round(t - 9 + Math.sin(((i + 16) / 32) * Math.PI) * bl), sailC);
      seg(p, x - 18, t - 31, x + 18, t - 31, WOODD, 1.6);
      p.ellipse(x, t - 24, 3.5, 3, RED);
      p.ellipse(x, t - 24, 2, 1.6, sailD);
      return;
    }
    seg(p, x - 12, t - 31, x + 2, t - 31, WOODD, 1.4);
    sideSail(p, x - 11, x - 1, t - 30, t - 8, [7, 9, 8][f], sailC, sailD);
    p.hline(x - 18, x - 2, t - 19, RED);
    p.hline(x - 17, x - 2, t - 18, RED);
  };
  const side = (p, f, layer) => {
    const t = T(f), b = B(f);
    if (layer === 'back') {
      mast(p, 56, t, f, SAIL, SAILD, false);
      // うしろの 小さな ほ（三角）
      poly(p, [[70, t - 8], [70, t - 24], [76 + [0, 1, 1][f], t - 9]], SAILD);
      seg(p, 70, t + 1, 70, t - 25, WOODD, 1.4);
      return;
    }
    poly(p, [[2, t - 5], [8, t], [68, t], [70, t - 7], [78, t - 7], [77, t + 1], [72, b - 2], [64, b], [18, b], [9, t + 5]], WOOD);
    for (const [y, c] of [[t + 3, WOODL], [t + 6, WOODD], [t + 9, WOODL]]) p.hline(12, 72, y, c);
    p.hline(8, 68, t, GOLD); p.hline(70, 77, t - 7, GOLD);
    p.hline(18, 66, b - 3, RED);
    p.hline(18, 66, b - 2, GOLDD);
    // 大ほう の まど
    for (const x of [24, 36, 48, 60]) { p.ellipse(x, t + 5, 1.8, 1.8, GOLD); p.set(x, t + 5, BLACK); }
    // うしろの へや（まどに あかり）
    for (const x of [72, 75]) p.rect(x, t - 5, 2, 3, f === 1 ? '#fff6c0' : '#ffd060');
    // てすり
    for (let x = 12; x <= 66; x += 6) p.vline(x, t - 3, t, GOLDD);
    p.hline(10, 67, t - 3, GOLDD);
    // へさきの 金の かざり（王の かんむり）と へさき の 棒
    seg(p, 4, t - 5, 0, t - 10, WOODD, 1.6);
    p.ellipse(4, t - 4, 2.6, 2.4, GOLD);
    poly(p, [[2, t - 7], [3, t - 10], [4, t - 7], [5, t - 10], [6, t - 7]], GOLD);
    p.set(4, t - 4, RED);
    // ランプ
    p.rect(77, t - 10, 2, 3, f === 1 ? '#fff6c0' : '#ffb040');
  };
  const front = (p, f, layer) => {
    const cx = FW / 2, t = T(f), b = B(f);
    if (layer === 'back') { mast(p, cx, t, f, SAIL, SAILD, true); return; }
    poly(p, [[cx - 17, t], [cx + 17, t], [cx + 11, b], [cx - 11, b]], WOOD);
    for (const [y, c] of [[t + 3, WOODL], [t + 6, WOODD]]) p.hline(cx - 15, cx + 15, y, c);
    p.hline(cx - 17, cx + 17, t, GOLD);
    p.hline(cx - 11, cx + 11, b - 3, RED);
    p.hline(cx - 11, cx + 11, b - 2, GOLDD);
    for (const s of [-1, 1]) { p.vline(cx + s * 16, t - 3, t, GOLDD); p.vline(cx + s * 8, t - 3, t, GOLDD); }
    p.hline(cx - 16, cx + 16, t - 3, GOLDD);
    // かんむりの かざり
    p.ellipse(cx, t + 4, 3.4, 3, GOLD);
    poly(p, [[cx - 4, t + 2], [cx - 3, t - 2], [cx - 1, t + 1], [cx, t - 3], [cx + 1, t + 1], [cx + 3, t - 2], [cx + 4, t + 2]], GOLD);
    p.set(cx, t + 4, RED);
  };
  const back = (p, f, layer) => {
    const cx = FW / 2, t = T(f), b = B(f);
    if (layer === 'back') { mast(p, cx, t, f, SAILD, shade(SAILD, -0.12), true); return; }
    poly(p, [[cx - 18, t - 7], [cx + 18, t - 7], [cx + 15, b], [cx - 15, b]], WOOD);
    box(p, cx - 18, t - 8, 37, 2, GOLD, { r: 0 });
    for (let i = -2; i <= 2; i++) p.rect(cx + i * 6 - 1, t - 4, 3, 3, f === 1 ? '#fff6c0' : '#ffd060');
    p.hline(cx - 16, cx + 16, t + 1, GOLDD);
    p.hline(cx - 15, cx + 15, t + 4, WOODL);
    p.hline(cx - 14, cx + 14, b - 3, RED);
    for (const s of [-1, 1]) p.rect(cx + s * 18 - 1, t - 11, 3, 3, f === 1 ? '#fff6c0' : '#ffb040');
  };
  return art({
    sw: SW, fw: FW, h: H, shadow: 2,
    rider: (view, f) => stand(view === 'side' ? 32 : FW / 2, T(f) + 5, 1),
    paint(p, view, f, layer) {
      if (view === 'side') side(p, f, layer);
      else if (view === 'front') front(p, f, layer);
      else back(p, f, layer);
    },
    fx(p, view, f) {
      const b = B(f), w = view === 'side' ? SW : FW;
      // 波しぶきの かわりに 雲
      const W = rgba('#ffffff', 0.92), WD = rgba('#c8d8f0', 0.9);
      const n = view === 'side' ? 8 : 5;
      for (let i = 0; i < n; i++) {
        const x = ((i * (w / n) + f * 4) % (w + 6)) - 2;
        puff(p, x, b + 2 + (i % 2), 3.2 + (i % 3) * 0.8, W, WD);
      }
      if (view === 'side') {
        puff(p, 4, b - 3, 4, W, WD);
        puff(p, 8 - f, b - 6, 2.6, W, WD);
        // 風の 線
        for (let i = 0; i < 3; i++) p.hline(60 + ((f * 5 + i * 4) % 10), SW - 1, T(f) - 32 + i * 9, rgba('#ffffff', 0.6));
      } else {
        for (let i = 0; i < 3; i++) p.vline(4 + i * 22, b - 30 + ((f * 4 + i * 5) % 9), b - 24 + ((f * 4 + i * 5) % 9), rgba('#ffffff', 0.55));
      }
      for (let i = 0; i < 3; i++) twinkle(p, 6 + i * (w / 3) + f * 3, b - 34 + ((i + f) % 3) * 6, rgba(GOLDL, 0.85));
    },
  });
}

// ───────────── 2. 伝説の超勇者: 雷を まとう 金の 竜 ─────────────
function thunderDragonArt({ horseArt, rgba, twinkle }) {
  const base = horseArt({
    coat: '#f0c038', mane: '#fff0a0', saddle: '#2a4ab8', trim: '#f4f4f8', dragon: true, belly: '#fff4c8',
    spike: '#ffffff', horn: '#ffffff', wings: '#ffe680', fly: true, hoof: '#a8761a',
  });
  const core = rgba('#fffbe0', 0.95), glow = rgba('#7ad8ff', 0.7);
  // いなずまの いち（コマごとに かわる）[x, y, 向き]
  const SIDE = [
    [[6, 6, 1], [58, 10, -1], [30, 46, 1]],
    [[18, 2, 1], [70, 22, -1], [8, 34, 1]],
    [[44, 4, -1], [66, 38, -1], [2, 18, 1]],
  ];
  const FRONT = [
    [[4, 10, 1], [58, 14, -1], [22, 46, 1]],
    [[14, 4, 1], [60, 30, -1], [44, 46, -1]],
    [[50, 4, -1], [2, 30, 1], [32, 46, 1]],
  ];
  return {
    ...base,
    fx(p, view, f, ctx) {
      base.fx?.(p, view, f, ctx);
      const L = (view === 'side' ? SIDE : FRONT)[f];
      L.forEach(([x, y, d], i) => bolt(p, x, y, 3, d * 3, 3, f * 3 + i, core, glow));
      // 体の まわりの 電気の つぶ
      const w = view === 'side' ? 76 : 64;
      for (let i = 0; i < 6; i++) {
        const x = (i * 13 + f * 7) % w, y = 14 + ((i * 11 + f * 5) % 28);
        p.set(x, y, glow); p.set(x + 1, y, core);
      }
      twinkle(p, [10, 40, 66][f] % w, [8, 4, 12][f], rgba('#ffffff', 0.9), true);
      // 足もとの 電気の わ（とぎれとぎれ。コマで まわる）
      for (let i = 0; i < 40; i++) {
        if ((i + f * 2) % 5 > 2) continue;
        const a = (i / 40) * TAU;
        p.set(w / 2 + Math.cos(a) * (w / 2 - 6), 46 + Math.sin(a) * 3, i % 2 ? glow : core);
      }
    },
    shadowScale: 1.9,
  };
}

// ───────────── 3. 日の火影: 日輪を せおった 大きな ガマ（ぴょーんと はねる） ─────────────
function sunToadArt({ seg, poly, rgba, shade, stand }) {
  const H = 72, G = H - 2, SW = 68, FW = 56;
  const BODY = '#c0602e', BODYD = shade(BODY, -0.25), BODYL = shade(BODY, 0.2), BELLY = '#f2dcae', SPOT = '#8a3a1a';
  const EYE = '#ffe070', PUP = '#1b1330', ROPE = '#f4ecd8';
  const HOP = [0, -5, -2];
  const BY = (f) => G - 13 + HOP[f];
  const sun = (p, x, y) => {
    p.ellipse(x, y, 13, 13, GOLDD);
    p.ellipse(x, y, 12, 12, '#ff7a2a');
    p.ellipse(x, y, 9.5, 9.5, '#ffa83a');
    p.ellipse(x, y, 7, 7, '#ffd060');
    p.ellipse(x - 2, y - 2, 3, 3, GOLDL);
  };
  const eye = (p, x, y, side) => {
    p.ellipse(x, y, side ? 5.4 : 4.6, side ? 5 : 4.2, BODY);
    p.ellipse(x - (side ? 0.6 : 0), y - 0.8, 3.2, 2.8, EYE);
    p.hline(Math.round(x - 2), Math.round(x + 1), Math.round(y - 0.8), PUP);
    p.set(x - 1, y - 2, '#ffffff');
  };
  const toes = (p, x, y, c, n = 3) => { for (let i = 0; i < n; i++) p.ellipse(x - 2 + i * 2, y, 1.4, 1.2, c); };
  const side = (p, f, layer) => {
    const by = BY(f), up = HOP[f] < 0;
    if (layer === 'back') {
      sun(p, 46, by - 30);
      // おくの 足
      if (up) { seg(p, 50, by + 4, 62, by + 12, BODYD, 4); toes(p, 64, by + 13, BODYD); }
      else { p.ellipse(52, by + 6, 7, 5, BODYD); toes(p, 46, G - 1, BODYD); }
      seg(p, 22, by + 6, 16, up ? by + 12 : G - 1, BODYD, 3);
      return;
    }
    // からだ
    p.ellipse(38, by, 21, 12, BODY);
    p.ellipse(38, by - 4, 17, 6, BODYL);
    p.ellipse(38, by - 1, 19, 9, BODY);
    for (const [x, y, r] of [[34, -6, 2.4], [44, -3, 2], [50, -7, 1.6], [28, -2, 1.4], [54, 1, 1.8]]) p.ellipse(x, by + y, r, r * 0.8, SPOT);
    // しめなわ（おなかの まわり）
    p.hline(30, 50, by + 3, ROPE);
    for (let x = 31; x <= 49; x += 3) p.set(x, by + 4, shade(ROPE, -0.2));
    // 頭（ひだり）
    p.ellipse(17, by - 1, 13, 9.5, BODY);
    p.ellipse(15, by + 4, 11, 4.5, BELLY);
    // 口（大きく よこに）
    for (let x = 5; x <= 25; x++) p.set(x, by + 1 + Math.round(Math.sin(((x - 5) / 20) * Math.PI) * 1.5), BODYD);
    p.set(6, by - 4, PUP);
    eye(p, 15, by - 10, true);
    // 前足
    if (up) { seg(p, 22, by + 6, 14, by + 13, BODY, 3.6); toes(p, 12, by + 14, BODY); }
    else { seg(p, 22, by + 6, 20, G - 2, BODY, 3.6); toes(p, 19, G - 1, BODY); }
    // うしろ足（大きな もも）
    p.ellipse(52, by + 4, 9, 7, BODY);
    p.ellipse(52, by + 2, 7, 4, BODYL);
    if (up) { seg(p, 56, by + 8, 64, by + 14, BODY, 4); toes(p, 65, by + 15, BODY); }
    else { seg(p, 50, by + 10, 46, G - 2, BODY, 3.4); toes(p, 45, G - 1, BODY, 4); }
  };
  const front = (p, f, layer) => {
    const cx = FW / 2, by = BY(f), up = HOP[f] < 0;
    if (layer === 'back') {
      sun(p, cx, by - 30);
      for (const s of [-1, 1]) { p.ellipse(cx + s * 17, by + 5, 6, 5, BODYD); toes(p, cx + s * 19, up ? by + 12 : G - 1, BODYD); }
      return;
    }
    p.ellipse(cx, by, 21, 12, BODY);
    p.ellipse(cx, by + 5, 14, 6.5, BELLY);
    for (const [x, y, r] of [[-14, -4, 2], [13, -6, 1.8], [-8, -8, 1.4], [16, 0, 1.4]]) p.ellipse(cx + x, by + y, r, r * 0.8, SPOT);
    // 口
    for (let x = -15; x <= 15; x++) p.set(cx + x, by + 2 + Math.round((1 - (x / 15) ** 2) * 1.5), BODYD);
    for (const s of [-1, 1]) p.set(cx + s * 3, by - 3, PUP);
    for (const s of [-1, 1]) eye(p, cx + s * 12, by - 10, false);
    p.hline(cx - 13, cx + 13, by + 9, ROPE);
    for (const s of [-1, 1]) {
      seg(p, cx + s * 12, by + 7, cx + s * 14, up ? by + 12 : G - 2, BODY, 3.6);
      toes(p, cx + s * 14, up ? by + 13 : G - 1, BODY);
    }
  };
  const back = (p, f, layer) => {
    const cx = FW / 2, by = BY(f), up = HOP[f] < 0;
    if (layer === 'back') {
      sun(p, cx, by - 30);
      for (const s of [-1, 1]) { p.ellipse(cx + s * 12, by - 10, 4.4, 4, BODY); p.ellipse(cx + s * 12, by - 11, 3, 2.4, BODYL); }
      return;
    }
    p.ellipse(cx, by, 21, 12, BODY);
    p.ellipse(cx, by - 4, 16, 6, BODYL);
    for (const [x, y, r] of [[-6, -4, 2.4], [7, -2, 2], [0, 4, 1.8], [-14, 2, 1.6], [14, -6, 1.4]]) p.ellipse(cx + x, by + y, r, r * 0.8, SPOT);
    p.hline(cx - 18, cx + 18, by + 3, ROPE);
    for (const s of [-1, 1]) {
      p.ellipse(cx + s * 16, by + 5, 7, 6, BODY);
      p.ellipse(cx + s * 16, by + 3, 5, 3, BODYL);
      if (up) { seg(p, cx + s * 18, by + 9, cx + s * 22, by + 15, BODY, 3.6); toes(p, cx + s * 22, by + 16, BODY); }
      else toes(p, cx + s * 18, G - 1, BODY, 4);
    }
  };
  return art({
    sw: SW, fw: FW, h: H, shadow: 2,
    rider: (view, f) => stand(view === 'side' ? 38 : FW / 2, BY(f) - 11, 1),
    paint(p, view, f, layer) {
      if (view === 'side') side(p, f, layer);
      else if (view === 'front') front(p, f, layer);
      else back(p, f, layer);
    },
    fxUnder: true,
    fx(p, view, f) {
      // 日輪の 光（まわる）
      const x0 = view === 'side' ? 46 : FW / 2, y0 = BY(f) - 30;
      for (let i = 0; i < 12; i++) {
        const a = (i * TAU) / 12 + (f * Math.PI) / 18;
        const r1 = 14, r2 = i % 2 ? 18 : 21;
        for (let r = r1; r <= r2; r += 0.5) p.set(x0 + Math.cos(a) * r, y0 + Math.sin(a) * r, rgba(i % 2 ? '#ffb040' : '#ffe070', 0.85 - (r - r1) * 0.06));
      }
      // ちゃくちの 土けむり
      if (f === 0) for (const s of [-1, 1]) for (let i = 0; i < 3; i++) p.ellipse((view === 'side' ? 34 : FW / 2) + s * (16 + i * 4), G - 1 - i, 2, 1.2, rgba('#e8dcc0', 0.6));
    },
  });
}

// ───────────── 4. 天才しせつ管理者AI: 自動運転の ホバーポッド ─────────────
function hoverPodArt({ seg, poly, rgba, shade, seat }) {
  const H = 56, G = H - 2, SW = 56, FW = 44;
  const SHELL = '#eef2f8', SHELLD = '#b4bccc', LINE = '#3ae8ff', LINED = '#2a6a8a', DARK = '#26304a';
  const BOB = [0, -1, -1];
  const PY = (f) => G - 18 + BOB[f];
  // 光る 線（まわりを はしる）
  const lights = (p, x0, x1, y, f) => {
    p.hline(x0, x1, y, LINED);
    const len = x1 - x0, at = x0 + ((f * Math.round(len / 3)) % len);
    for (let k = 0; k < 7; k++) p.set(x0 + ((at - x0 + k) % (len + 1)), y, LINE);
  };
  const visorEyes = (p, x, y, f) => {
    p.rect(x, y, 9, 4, DARK);
    p.hline(x + 1, x + 7, y, shade(DARK, 0.3));
    // にっこり 目（コマで まばたき）
    if (f === 2) { p.hline(x + 2, x + 3, y + 2, LINE); p.hline(x + 6, x + 7, y + 2, LINE); }
    else { p.rect(x + 2, y + 1, 2, 2, LINE); p.rect(x + 6, y + 1, 2, 2, LINE); }
  };
  const side = (p, f, layer) => {
    const cx = 28, py = PY(f);
    if (layer === 'back') {
      poly(p, [[cx + 15, py - 5], [cx + 21, py - 14], [cx + 24, py - 14], [cx + 22, py - 3]], SHELLD);
      seg(p, cx + 22, py - 13, cx + 23, py - 5, LINE);
      seg(p, cx + 10, py - 7, cx + 13, py - 19, '#8a90a0', 1.2);
      p.ellipse(cx + 13, py - 20, 1.6, 1.6, f === 1 ? '#ff5a5a' : '#8a2a2a');
      return;
    }
    p.ellipse(cx, py + 2, 21, 7.5, SHELLD);
    p.ellipse(cx, py - 0.5, 22, 7.8, SHELL);
    p.hline(cx - 16, cx + 16, py - 7, '#ffffff');
    lights(p, cx - 20, cx + 20, py + 2, f);
    visorEyes(p, cx - 21, py - 4, f);
    p.rect(cx - 22, py + 1, 2, 2, '#fff6c0');
    p.vline(cx + 6, py - 6, py + 5, SHELLD);
    // 足もとの ふき出し口
    for (const s of [-1, 1]) p.rect(cx + s * 10 - 2, py + 7, 5, 2, DARK);
  };
  const front = (p, f, layer, back) => {
    const cx = FW / 2, py = PY(f);
    if (layer === 'back') {
      seg(p, cx + 10, py - 7, cx + 12, py - 19, '#8a90a0', 1.2);
      p.ellipse(cx + 12, py - 20, 1.6, 1.6, f === 1 ? '#ff5a5a' : '#8a2a2a');
      return;
    }
    p.ellipse(cx, py + 2, 17, 7.5, SHELLD);
    p.ellipse(cx, py - 0.5, 18, 7.8, SHELL);
    p.hline(cx - 13, cx + 13, py - 7, '#ffffff');
    lights(p, cx - 16, cx + 16, py + 3, f);
    if (back) {
      for (const s of [-1, 1]) { poly(p, [[cx + s * 14, py - 4], [cx + s * 19, py - 12], [cx + s * 20, py - 4]], SHELLD); p.rect(cx + s * 11 - 1, py, 3, 2, '#ff4a4a'); }
    } else {
      visorEyes(p, cx - 4, py - 3, f);
      for (const s of [-1, 1]) p.ellipse(cx + s * 13, py, 2, 1.5, '#fff6c0');
    }
    for (const s of [-1, 1]) p.rect(cx + s * 9 - 2, py + 7, 5, 2, DARK);
  };
  return art({
    sw: SW, fw: FW, h: H, shadow: 1.6,
    rider: (view, f) => seat(view === 'side' ? 30 : FW / 2, PY(f) - 1, 33),
    paint(p, view, f, layer) {
      if (view === 'side') side(p, f, layer);
      else front(p, f, layer, view === 'back');
    },
    fx(p, view, f) {
      const cx = view === 'side' ? 29 : FW / 2, py = PY(f);
      // ガラスの まるい やね
      const rx = view === 'side' ? 15 : 13, top = py - 7;
      for (let y = top - 18; y <= top; y++) {
        const t = (top - y) / 18;
        const half = rx * Math.sqrt(Math.max(0, 1 - t * t));
        const L = Math.round(cx - half), R = Math.round(cx + half);
        p.set(L, y, rgba('#e8ffff', 0.7)); p.set(R, y, rgba('#e8ffff', 0.7));
        if (y === top - 18) p.hline(L, R, y, rgba('#e8ffff', 0.7));
      }
      for (let k = 0; k < 5; k++) p.set(cx - rx + 4 + k, top - 14 + k, rgba('#ffffff', 0.75));
      // 足もとの 風
      for (const s of [-1, 1]) {
        const x = cx + s * 9 - (view === 'side' ? 1 : 0);
        const len = [5, 7, 6][f];
        for (let j = 0; j < len; j++) p.hline(Math.round(x - j * 0.4), Math.round(x + 1 + j * 0.4), py + 9 + j, rgba('#9af4ff', 0.6 - j * 0.07));
        for (let i = 0; i < 2; i++) p.hline(Math.round(x + s * (6 + ((f * 3 + i * 4) % 8))), Math.round(x + s * (6 + ((f * 3 + i * 4) % 8))) + 3, G - 1 - i, rgba('#ffffff', 0.55));
      }
    },
  });
}

// ───────────── 5. 名探てい王: 探ていの 小さな 飛行船（サーチライト） ─────────────
function blimpArt({ box, seg, poly, rgba, shade, seat }) {
  const H = 72, G = H - 2, SW = 80, FW = 56;
  const BAL = '#8a6a44', BALD = shade(BAL, -0.25), BALL = shade(BAL, 0.22), CHECK = '#6a4e30', RED = '#c8303a';
  const WOOD = '#5a3a22';
  const BOB = [0, -1, -1];
  const BC = (f) => 12 + BOB[f]; // ふうせんの まんなか
  const GY = (f) => 52 + BOB[f]; // ゴンドラの 上
  const glass = (p, x, y) => {
    p.ellipse(x, y, 4, 4, GOLD);
    p.ellipse(x, y, 2.6, 2.6, '#bfe8ff');
    p.set(x - 1, y - 1, '#ffffff');
    seg(p, x + 3, y + 3, x + 6, y + 6, GOLDD, 1.6);
  };
  const balloonSide = (p, f) => {
    const y = BC(f);
    poly(p, [[62, y - 5], [71, y - 12], [75, y - 12], [74, y - 3]], RED);
    poly(p, [[62, y + 5], [71, y + 12], [75, y + 12], [74, y + 3]], shade(RED, -0.2));
    p.ellipse(40, y, 32, 11, BAL);
    p.ellipse(38, y - 4, 26, 5, BALL);
    p.ellipse(40, y + 1, 31, 9, BAL);
    for (let x = 14; x <= 66; x += 6) for (let yy = y - 9; yy <= y + 9; yy++) {
      const dx = (x - 40) / 32, dy = (yy - y) / 11;
      if (dx * dx + dy * dy <= 0.92) p.set(x, yy, CHECK);
    }
    p.hline(10, 70, y, BALD);
    p.hline(14, 66, y + 6, BALD);
    glass(p, 36, y - 1);
    // プロペラ（回る）
    p.rect(73, y - 1, 3, 3, '#5a5a6a');
    const L = [6, 2, 4][f];
    p.vline(77, y - L, y + L, '#c8ccd8');
    if (f === 1) p.hline(76, 78, y, '#c8ccd8');
  };
  const side = (p, f, layer) => {
    const gy = GY(f), y = BC(f);
    if (layer === 'back') {
      balloonSide(p, f);
      for (const [a, b] of [[28, 26], [52, 54]]) seg(p, a, y + 10, b, gy, '#3a2a22');
      return;
    }
    box(p, 24, gy, 33, 10, WOOD, { r: 2 });
    p.hline(25, 55, gy + 1, GOLD);
    p.hline(25, 55, gy + 7, GOLDD);
    for (const x of [32, 40, 48]) p.rect(x - 1, gy + 3, 3, 3, '#ffd060');
    // サーチライト
    box(p, 19, gy + 1, 6, 5, '#3a3a4a', { r: 1 });
    p.rect(18, gy + 2, 2, 3, '#fff6c0');
  };
  const front = (p, f, layer, back) => {
    const cx = FW / 2, gy = GY(f), y = BC(f);
    if (layer === 'back') {
      for (const s of [-1, 1]) poly(p, [[cx + s * 20, y - 2], [cx + s * 27, y - 4], [cx + s * 27, y + 4], [cx + s * 20, y + 2]], RED);
      poly(p, [[cx - 2, y - 10], [cx + 2, y - 10], [cx + 1, y - 13], [cx - 1, y - 13]], RED);
      p.ellipse(cx, y, 21, 11, BAL);
      p.ellipse(cx - 2, y - 4, 15, 5, BALL);
      for (let x = cx - 18; x <= cx + 18; x += 6) for (let yy = y - 9; yy <= y + 9; yy++) {
        const dx = (x - cx) / 21, dy = (yy - y) / 11;
        if (dx * dx + dy * dy <= 0.9) p.set(x, yy, CHECK);
      }
      p.hline(cx - 19, cx + 19, y + 5, BALD);
      if (back) {
        p.rect(cx - 1, y - 1, 3, 3, '#5a5a6a');
        const L = [6, 2, 4][f];
        p.hline(cx - L, cx + L, y + 1, '#c8ccd8');
      } else glass(p, cx - 1, y - 2);
      for (const s of [-1, 1]) seg(p, cx + s * 12, y + 9, cx + s * 14, gy, '#3a2a22');
      return;
    }
    box(p, cx - 15, gy, 31, 10, WOOD, { r: 2 });
    p.hline(cx - 14, cx + 14, gy + 1, GOLD);
    p.hline(cx - 14, cx + 14, gy + 7, GOLDD);
    if (back) for (const s of [-1, 1]) p.rect(cx + s * 10 - 1, gy + 3, 3, 2, '#e04040');
    else { box(p, cx - 3, gy + 4, 7, 5, '#3a3a4a', { r: 1 }); p.rect(cx - 1, gy + 5, 3, 3, '#fff6c0'); }
  };
  return art({
    sw: SW, fw: FW, h: H, shadow: 1.8,
    rider: (view, f) => seat(view === 'side' ? 42 : FW / 2, GY(f) + 3, 34),
    paint(p, view, f, layer) {
      if (view === 'side') side(p, f, layer);
      else front(p, f, layer, view === 'back');
    },
    fx(p, view, f) {
      const gy = GY(f);
      const beam = rgba('#fff6c0', 0.26), spot = rgba('#fff6c0', 0.5);
      if (view === 'side') {
        const sx = [6, 12, 2][f];
        poly(p, [[18, gy + 2], [18, gy + 5], [sx + 8, G], [sx - 6, G]], beam);
        p.ellipse(sx + 1, G - 1, 8, 2, spot);
      } else if (view === 'front') {
        const sx = FW / 2 + [-8, 0, 8][f];
        poly(p, [[FW / 2 - 1, gy + 7], [FW / 2 + 2, gy + 7], [sx + 9, G], [sx - 9, G]], beam);
        p.ellipse(sx, G - 1, 10, 2.4, spot);
      }
      // ? の 形の きらきら（なぞの けはい）
      const w = view === 'side' ? SW : FW;
      for (let i = 0; i < 3; i++) {
        const x = 6 + i * (w / 3) + f * 2, y = 30 + ((i * 7 + f * 4) % 14);
        p.set(x, y, rgba('#ffffff', 0.8)); p.set(x + 1, y - 1, rgba('#ffffff', 0.6));
      }
    },
  });
}

// ───────────── 6. 銀河の女王: 三日月と 星の 馬車（小さな 星が 引く） ─────────────
function moonCarriageArt({ seg, poly, rgba, shade, twinkle, seat }) {
  const H = 60, G = H - 2, SW = 80, FW = 52;
  const MOON = '#ffe070', MOONL = '#fff6c0', MOOND = '#e0b030', VEL = '#7a3ab8', RIB = '#ff8ac8', RIM = '#c8d0ff';
  const BOB = [0, -1, -1];
  const BY = (f) => G - 20 + BOB[f];
  // 三日月（大きな まるから まるを ぬく）。keep(y) … その 行を かくか
  const crescent = (p, cx, cy, R, ox, oy, r2, keep, col) => {
    for (let y = -R; y <= R; y++) {
      if (!keep(cy + y)) continue;
      for (let x = -R; x <= R; x++) {
        if (x * x + y * y > R * R) continue;
        if ((x - ox) ** 2 + (y - oy) ** 2 < r2 * r2) continue;
        p.set(cx + x, cy + y, col(x, y));
      }
    }
  };
  const starWheel = (p, x, y, r, f) => {
    p.ellipse(x, y, r, r, '#2a2a5a');
    p.ellipse(x, y, r - 1.2, r - 1.2, RIM);
    poly(p, starPts(x, y, r - 1.2, (f * TAU) / 15), MOON);
    p.ellipse(x, y, 1.2, 1.2, '#ffffff');
  };
  const leader = (p, x, y, f, face = true) => {
    poly(p, starPts(x, y, 7, [0, 0.12, -0.12][f]), MOON);
    poly(p, starPts(x - 0.5, y - 0.5, 4, [0, 0.12, -0.12][f]), MOONL);
    if (face) { p.set(x - 2, y, '#3a2a5a'); p.set(x + 1, y, '#3a2a5a'); p.hline(x - 1, x, y + 2, '#e85a8a'); }
  };
  const ribbon = (p, x0, y0, x1, y1, f) => {
    const n = Math.ceil(Math.abs(x1 - x0) * 1.5);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      p.set(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(t * Math.PI * 2 + f * 2) * 1.5, RIB);
    }
  };
  const col = (x, y) => (y < -6 ? MOONL : y > 6 ? MOOND : MOON);
  const side = (p, f, layer) => {
    const by = BY(f), cx = 52;
    if (layer === 'back') {
      crescent(p, cx, by, 19, -5, -8, 16, (y) => y < by - 3, col);
      return;
    }
    // 車輪と じく
    seg(p, 40, G - 7, 64, G - 7, GOLDD, 1.4);
    starWheel(p, 40, G - 7, 7, f);
    starWheel(p, 64, G - 7, 7, f);
    crescent(p, cx, by, 19, -5, -8, 16, (y) => y >= by - 3, col);
    // ビロードの ざぶとん・金の ふち
    p.hline(cx - 13, cx + 8, by + 2, VEL);
    for (let a = 0.2; a < Math.PI - 0.2; a += 0.35) p.set(cx + Math.cos(a) * 18, by + Math.sin(a) * 18, '#ffffff');
    // 引く 星と リボン
    const ly = by - 4 + [0, 1, -1][f];
    ribbon(p, 15, ly + 1, 34, by + 2, f);
    leader(p, 10, ly, f);
  };
  const front = (p, f, layer) => {
    const by = BY(f), cx = FW / 2;
    if (layer === 'back') {
      crescent(p, cx, by - 6, 17, 7, -6, 15, () => true, col);
      return;
    }
    for (const s of [-1, 1]) {
      p.ellipse(cx + s * 17, G - 5, 2.2, 5, '#2a2a5a');
      p.ellipse(cx + s * 17, G - 5, 1, 4, RIM);
      p.set(cx + s * 17, G - 8 + f * 2, MOON);
    }
    halfEllipse(p, cx, by, 18, 11, MOON, true);
    halfEllipse(p, cx, by + 4, 16, 7, MOOND, true);
    p.hline(cx - 17, cx + 17, by, MOONL);
    p.hline(cx - 14, cx + 14, by + 1, VEL);
    const ly = by + 6 + [0, 1, -1][f];
    leader(p, cx, ly, f);
  };
  const back = (p, f, layer) => {
    const by = BY(f), cx = FW / 2;
    if (layer === 'back') {
      leader(p, cx + 13, by - 26 + [0, 1, -1][f], f, false);
      crescent(p, cx, by - 6, 17, -7, -6, 15, (y) => y < by - 6, col);
      return;
    }
    for (const s of [-1, 1]) {
      p.ellipse(cx + s * 17, G - 5, 2.2, 5, '#2a2a5a');
      p.ellipse(cx + s * 17, G - 5, 1, 4, RIM);
      p.set(cx + s * 17, G - 8 + f * 2, MOON);
    }
    halfEllipse(p, cx, by, 18, 11, MOON, true);
    halfEllipse(p, cx, by + 4, 16, 7, MOOND, true);
    p.hline(cx - 17, cx + 17, by, MOONL);
    for (const s of [-1, 1]) poly(p, starPts(cx + s * 9, by + 5, 2.6, 0), MOONL);
  };
  return art({
    sw: SW, fw: FW, h: H, shadow: 1.9,
    rider: (view, f) => seat(view === 'side' ? 50 : FW / 2, BY(f) - 1, 34),
    paint(p, view, f, layer) {
      if (view === 'side') side(p, f, layer);
      else if (view === 'front') front(p, f, layer);
      else back(p, f, layer);
    },
    fx(p, view, f) {
      const w = view === 'side' ? SW : FW;
      if (view === 'side') {
        for (let i = 0; i < 5; i++) twinkle(p, 66 + ((i * 5 + f * 3) % 14), G - 18 + ((i * 7 + f * 2) % 16), rgba(i % 2 ? '#ffffff' : '#fff6c0', 0.85), i === 2);
      }
      for (let i = 0; i < 4; i++) twinkle(p, 4 + i * (w / 4) + f * 2, 6 + ((i * 3 + f) % 4) * 4, rgba('#d8e0ff', 0.85), i === f);
    },
  });
}

// ───────────── 7. 大魔導王: 空飛ぶ 魔法じんの 円ばん（もようが 回る） ─────────────
function magicDiscArt({ poly, rgba, stand }) {
  const H = 60, G = H - 2, W = 64;
  const BASE = '#2a2058', GEM = ['#ff5a8a', '#5ad8ff', '#7aff8a', '#ffe070'];
  const BOB = [0, -1, -1];
  const GT = (f) => G - 11 + BOB[f]; // 円ばんの 上
  const cx = W / 2;
  const gems = (p, f, front) => {
    for (let i = 0; i < 8; i++) {
      const a = (i * TAU) / 8 + (f * Math.PI) / 12, s = Math.sin(a);
      if ((s >= 0) !== front) continue;
      p.ellipse(cx + Math.cos(a) * 25, GT(f) + 2 + s * 5, 1.4, 1.2, GEM[i % 4]);
    }
  };
  return art({
    sw: W, fw: W, h: H, shadow: 1.6,
    rider: (view, f) => stand(cx, GT(f) + 1, 1),
    paint(p, view, f, layer) {
      const g = GT(f);
      if (layer === 'back') {
        ring(p, cx, g + 1, 26, 5, GOLDD, false);
        ring(p, cx, g + 1, 25, 4.5, GOLD, false);
        gems(p, f, false);
        return;
      }
      halfEllipse(p, cx, g + 1, 26, 7, BASE, true);
      halfEllipse(p, cx, g + 3, 22, 5, '#3a2a78', true);
      ring(p, cx, g + 1, 26, 5, GOLD, true);
      ring(p, cx, g + 2, 26, 5, GOLDD, true);
      gems(p, f, true);
      // 下の ふさと 水しょう
      poly(p, [[cx - 2, g + 8], [cx + 2, g + 8], [cx, g + 13]], f === 1 ? '#bff8ff' : '#5ad8ff');
      for (const s of [-1, 1]) p.vline(cx + s * 12, g + 6, g + 9 + (f === s + 1 ? 1 : 0), '#d8303a');
    },
    fxUnder: true,
    fx(p, view, f) {
      const g = GT(f), cy = g + 1;
      const LINE = rgba('#9af0ff', 0.95), DIM = rgba('#9af0ff', 0.55);
      // 光の 柱（うすく）
      for (let y = g - 30; y < g; y++) {
        const a = 0.14 * ((y - (g - 30)) / 30);
        p.set(cx - 21, y, rgba('#9af0ff', a)); p.set(cx + 21, y, rgba('#9af0ff', a));
      }
      // 円ばんの 上の 面
      for (let y = -5; y <= 5; y++) for (let x = -25; x <= 25; x++) if ((x / 25) ** 2 + (y / 5) ** 2 <= 1) p.set(cx + x, cy + y, rgba('#3a2a7a', 0.92));
      // 魔法じん（2重の わ・回る 六ぼう星・ルーン）
      ring(p, cx, cy, 22, 4.2, LINE);
      ring(p, cx, cy, 15, 2.9, LINE);
      const rot = (f * TAU) / 18;
      for (const off of [0, Math.PI / 3]) {
        const v = [0, 1, 2].map((k) => [cx + Math.cos(rot + off + (k * TAU) / 3) * 15, cy + Math.sin(rot + off + (k * TAU) / 3) * 2.9]);
        for (let k = 0; k < 3; k++) {
          const [ax, ay] = v[k], [bx, by] = v[(k + 1) % 3];
          for (let t = 0; t <= 30; t++) p.set(ax + ((bx - ax) * t) / 30, ay + ((by - ay) * t) / 30, DIM);
        }
      }
      for (let i = 0; i < 8; i++) {
        const a = -rot * 1.5 + (i * TAU) / 8;
        const x = cx + Math.cos(a) * 18.5, y = cy + Math.sin(a) * 3.6;
        p.set(x, y, LINE); p.set(x + 1, y, LINE);
      }
      // 下の 小さな 魔法じん（地面）
      ring(p, cx, G - 1, 14, 2.4, rgba('#c89aff', 0.7));
      for (let i = 0; i < 6; i++) { const a = rot * 2 + (i * TAU) / 6; p.set(cx + Math.cos(a) * 10, G - 1 + Math.sin(a) * 1.6, rgba('#c89aff', 0.85)); }
      // まわる ルーンの 石
      for (let i = 0; i < 3; i++) {
        const a = rot * 2 + (i * TAU) / 3, s = Math.sin(a);
        const x = cx + Math.cos(a) * 27, y = g - 16 + s * 4 + i * 3;
        p.rect(Math.round(x) - 1, Math.round(y) - 1, 3, 3, rgba('#c89aff', 0.8));
        p.set(x, y, rgba('#ffffff', 0.95));
      }
    },
  });
}

// ───────────── 8. 天下むそうの剣聖: 金の おみこし（かつぐ 人の 足が ちょこちょこ） ─────────────
function mikoshiArt({ box, seg, poly, rgba, shade, twinkle, seat }) {
  const H = 64, G = H - 2, SW = 76, FW = 56;
  const BLK = '#2a1a1a', RED = '#d8303a', HAPPI = '#2a5ac8', SKIN = '#f7d4ae', HAIR = '#2a2022';
  const BOB = [0, -2, -1];
  const PY = (f) => G - 12 + BOB[f]; // かつぐ 棒
  // かつぐ 人（よこ。ひだりむき）。ph … 足の コマずれ
  const carrierSide = (p, x, f, ph, dark) => {
    const k = (f + ph) % 3, py = PY(f);
    const hp = dark ? shade(HAPPI, -0.3) : HAPPI, sk = dark ? shade(SKIN, -0.2) : SKIN;
    const LEG = [[-2, 1], [0, 0], [1, -2]][k];
    seg(p, x, G - 6, x + LEG[0], G - 1, dark ? '#3a3040' : '#4a4050', 1.4);
    seg(p, x + 1, G - 6, x + 1 + LEG[1], G - 1, dark ? '#3a3040' : '#4a4050', 1.4);
    box(p, x - 2, py + 2, 6, G - 6 - py - 1, hp, { r: 1 });
    p.vline(x, py + 3, G - 7, '#f4f4f8');
    p.ellipse(x, py - 1.5, 3, 3, sk);
    p.hline(x - 2, x + 3, py - 5, HAIR);
    p.hline(x - 3, x + 3, py - 4, '#f4f4f8');
    p.set(x + 2, py - 3, HAIR); p.set(x + 3, py - 2, HAIR);
    p.set(x - 2, py - 2, '#1b1330');
    seg(p, x - 1, py + 3, x - 2, py, sk, 1.2);
  };
  const carrierFront = (p, x, f, ph, dark, face) => {
    const k = (f + ph) % 3, py = PY(f);
    const hp = dark ? shade(HAPPI, -0.3) : HAPPI, sk = dark ? shade(SKIN, -0.2) : SKIN;
    const up = [[1, 0], [0, 1], [0, 0]][k];
    p.vline(x - 1, G - 6, G - 1 - up[0], '#4a4050');
    p.vline(x + 1, G - 6, G - 1 - up[1], '#4a4050');
    box(p, x - 3, py + 2, 7, G - 6 - py - 1, hp, { r: 1 });
    if (face) { p.vline(x - 1, py + 3, G - 7, '#f4f4f8'); p.vline(x + 1, py + 3, G - 7, '#f4f4f8'); }
    p.ellipse(x, py - 1.5, 3, 3, sk);
    if (face) { p.hline(x - 2, x + 2, py - 5, HAIR); p.set(x - 1, py - 1, '#1b1330'); p.set(x + 1, py - 1, '#1b1330'); p.hline(x - 3, x + 3, py - 4, '#f4f4f8'); }
    else { p.ellipse(x, py - 2, 3, 2.6, HAIR); p.hline(x - 3, x + 3, py - 4, '#f4f4f8'); p.set(x + 3, py - 3, RED); }
  };
  const shrine = (p, x0, x1, f) => {
    const py = PY(f), top = py - 12;
    box(p, x0, py - 3, x1 - x0, 3, BLK, { r: 0 });
    p.hline(x0, x1 - 1, py - 3, GOLD);
    box(p, x0 + 3, top, x1 - x0 - 6, 9, GOLD, { r: 1 });
    for (let x = x0 + 5; x < x1 - 5; x += 4) p.vline(x, top + 2, top + 7, RED);
    p.hline(x0 + 4, x1 - 5, top + 4, BLK);
    for (const x of [x0 + 3, x1 - 4]) p.vline(x, top, py - 4, GOLDD);
    // のき（はしが くるりと 上がる）と ふさ
    p.hline(x0 + 1, x1 - 2, top - 1, GOLDD);
    seg(p, x0 + 1, top - 1, x0 - 1, top - 5, GOLD, 1.6);
    seg(p, x1 - 2, top - 1, x1, top - 5, GOLD, 1.6);
    const sw = [-1, 1, 0][f];
    for (const x of [x0 + 1, x1 - 2]) { seg(p, x, top, x + sw, top + 6, RED, 1.4); p.ellipse(x + sw, top + 7, 1.2, 1.4, RED); }
    // すず
    for (const x of [x0 + 8, x1 - 9]) p.ellipse(x, top + 10, 1, 1, GOLDL);
    // むらさきの ざぶとん
    p.hline(x0 + 6, x1 - 7, top - 1, '#7a3ab8');
  };
  const side = (p, f, layer) => {
    const py = PY(f);
    if (layer === 'back') {
      seg(p, 2, py - 1, 74, py - 1, shade('#8a5a32', -0.3), 2);
      for (const [i, x] of [16, 36, 56].entries()) carrierSide(p, x + 3, f, i + 1, true);
      return;
    }
    shrine(p, 18, 58, f);
    seg(p, 2, py, 74, py, '#8a5a32', 2.2);
    p.rect(1, py - 1, 2, 3, GOLD); p.rect(73, py - 1, 2, 3, GOLD);
    for (const [i, x] of [8, 28, 48, 68].entries()) carrierSide(p, x, f, i, false);
  };
  const front = (p, f, layer, face) => {
    const cx = FW / 2, py = PY(f);
    if (layer === 'back') {
      for (const s of [-1, 1]) carrierFront(p, cx + s * 12 + s * 2, f, s + 2, true, face);
      return;
    }
    shrine(p, cx - 20, cx + 20, f);
    for (const s of [-1, 1]) { p.ellipse(cx + s * 14, py, 2, 2, '#8a5a32'); p.set(cx + s * 14, py, GOLD); }
    for (const s of [-1, 1]) carrierFront(p, cx + s * 19, f, s + 1, false, face);
    for (const s of [-1, 1]) carrierFront(p, cx + s * 8, f, s + 3, false, face);
  };
  return art({
    sw: SW, fw: FW, h: H, shadow: 2,
    rider: (view, f) => seat(view === 'side' ? 38 : FW / 2, PY(f) - 13, 34),
    paint(p, view, f, layer) {
      if (view === 'side') side(p, f, layer);
      else front(p, f, layer, view === 'front');
    },
    fx(p, view, f) {
      // 紙ふぶきと 金の きらきら
      const w = view === 'side' ? SW : FW;
      const C = ['#ff5a8a', '#5ad8ff', '#ffe070', '#7aff8a'];
      for (let i = 0; i < 8; i++) {
        const x = (i * 11 + f * 5) % w, y = 4 + ((i * 9 + f * 6) % 20);
        p.set(x, y, rgba(C[i % 4], 0.9)); p.set(x + 1, y + (i % 2), rgba(C[i % 4], 0.9));
      }
      for (let i = 0; i < 2; i++) twinkle(p, (view === 'side' ? 20 : 8) + i * (view === 'side' ? 36 : 40) + f, PY(f) - 18 + ((i + f) % 2) * 3, rgba(GOLDL, 0.9));
    },
  });
}

// ───────────── 9. 宇宙一のおかん: ロケットつきの 宇宙ママチャリ（前かごに 買い物） ─────────────
function rocketMamachariArt({ bikeArt, box, seg, poly, rgba, shade, twinkle }) {
  const base = bikeArt({ kind: 'mamachari', color: '#5a4ac8' });
  const SW = 64, FW = 44, H = 56;
  const LIFT = [5, 6, 6];
  const DX = (view) => (view === 'side' ? 0 : 4);
  const DY = (f) => H - 52 - LIFT[f]; // もとの 絵（たかさ 52）を 下に そろえて うかせる
  const RW = '#f4f4f8', RR = '#e0343a';
  const rocketSide = (p, x, y, dark) => {
    const c = dark ? shade(RW, -0.3) : RW, r = dark ? shade(RR, -0.3) : RR;
    box(p, x, y, 14, 5, c, { r: 2 });
    poly(p, [[x, y], [x, y + 4], [x - 4, y + 2]], r);
    p.hline(x + 4, x + 9, y + 2, r);
    poly(p, [[x + 11, y], [x + 15, y - 3], [x + 15, y]], r);
    poly(p, [[x + 11, y + 4], [x + 15, y + 7], [x + 15, y + 4]], r);
    p.rect(x + 14, y + 1, 2, 3, '#5a5a6a');
    p.set(x + 6, y + 1, '#5ad8ff');
  };
  const groceries = (p) => {
    // バゲット・牛にゅう・りんご（ネギは もとの 絵）
    seg(p, 6, 17, 10, 11, '#d8a050', 2);
    p.set(9, 12, '#f0c070');
    box(p, 8, 14, 3, 5, '#f4f4f8', { r: 0 });
    p.hline(8, 10, 16, '#3a64d8');
    p.ellipse(5, 17, 1.6, 1.6, '#e0343a');
  };
  return {
    frames: 3,
    size: (view) => (view === 'side' ? [SW, H] : [FW, H]),
    rider(view, f) {
      const R = base.rider(view, f % 2);
      return { ...R, x: R.x + DX(view), y: R.y + DY(f) };
    },
    paint(p, view, f, layer) {
      const q = shifted(p, DX(view), DY(f));
      if (view === 'side') {
        if (layer === 'back') { rocketSide(q, 35, 23, true); base.paint(q, view, f, layer); return; }
        base.paint(q, view, f, layer);
        rocketSide(q, 34, 25, false);
        groceries(q);
        // 星の シール
        for (const [x, y] of [[20, 33], [36, 38]]) q.set(x, y, '#ffe070');
        return;
      }
      const cx = 18;
      if (view === 'front') {
        if (layer === 'back') for (const s of [-1, 1]) { q.ellipse(cx + s * 10, 28, 3.2, 3.2, RW); q.ellipse(cx + s * 10, 28, 1.6, 1.6, RR); }
        base.paint(q, view, f, layer);
        if (layer === 'front') { q.ellipse(cx - 2, 25, 1.4, 1.4, '#e0343a'); q.rect(cx + 2, 24, 2, 2, '#f4f4f8'); }
        return;
      }
      base.paint(q, view, f, layer);
      if (layer === 'front') for (const s of [-1, 1]) {
        q.ellipse(cx + s * 10, 28, 3.4, 3.4, RW);
        q.ellipse(cx + s * 10, 28, 2.2, 2.2, '#5a5a6a');
        for (const t of [-1, 1]) q.set(cx + s * 10 + t * 3, 24, RR);
      }
    },
    fx(p, view, f) {
      const dx = DX(view), dy = DY(f);
      const O = rgba('#ff7a2a', 0.85), Y = rgba('#ffe070', 0.95), C = rgba('#9af4ff', 0.55);
      if (view === 'side') {
        const L = [8, 11, 9][f];
        for (let k = 0; k < L; k++) {
          const half = 2.5 - k * 0.2;
          p.vline(51 + k, Math.round(27.5 + dy - half), Math.round(27.5 + dy + half), O);
          if (k < L - 3) p.vline(51 + k, Math.round(27.5 + dy - half / 2), Math.round(27.5 + dy + half / 2), Y);
        }
        for (let i = 0; i < 3; i++) twinkle(p, 54 + ((i * 4 + f * 3) % 9), 12 + i * 9 + dy, rgba('#ffffff', 0.85));
        for (const x of [10, 40]) p.ellipse(x, 50 + dy + 2, 5, 1.3, C);
      } else {
        const cx = 18 + dx;
        if (view === 'back') for (const s of [-1, 1]) {
          p.ellipse(cx + s * 10, 28 + dy + 3, 2.8 + (f % 2), 3 + f, O);
          p.ellipse(cx + s * 10, 28 + dy + 2, 1.6, 1.8 + f * 0.5, Y);
        }
        p.ellipse(cx, 50 + dy + 2, 4, 1.3, C);
        for (let i = 0; i < 3; i++) twinkle(p, 4 + i * 16 + f * 2, 8 + ((i + f) % 3) * 6, rgba('#ffffff', 0.8));
      }
    },
    shadowScale: 1.4,
  };
}

// ───────────── 10. はかいと創造の神: 小さな 星（草や 花が 生えては 消える） ─────────────
function tinyPlanetArt({ seg, poly, rgba, shade, twinkle, stand }) {
  const H = 72, G = H - 2, W = 60, cx = W / 2, R = 14;
  const SEA = '#3a8ad8', LAND = '#5ac85a', LANDD = '#3a9a48', RINGC = '#ffd0f0', ROCK = '#8a7a6a';
  const BOB = [0, -1, -1];
  const CY = (f) => G - 6 - R + BOB[f];
  const FLOW = ['#ff7ab4', '#ffe070', '#ffffff', '#ff9a3a', '#b48aff', '#7ad8ff'];
  const SPOTS = [-150, -128, -108, -72, -52, -30];
  const planet = (p, f) => {
    const cy = CY(f);
    p.ellipse(cx, cy, R, R, SEA);
    const blobs = [[-8, -5, 5, 3], [4, 2, 6, 4], [-3, 7, 4, 2], [9, -6, 4, 3], [-12, 3, 3, 3]];
    for (const [bx, by, rx, ry] of blobs) {
      let x = bx + f * 5;
      if (x > R + 6) x -= 2 * R + 12;
      for (let y = Math.floor(cy + by - ry); y <= Math.ceil(cy + by + ry); y++) for (let xx = Math.floor(cx + x - rx); xx <= Math.ceil(cx + x + rx); xx++) {
        const dx = (xx + 0.5 - (cx + x)) / rx, dy = (y + 0.5 - (cy + by)) / ry;
        const ox = xx + 0.5 - cx, oy = y + 0.5 - cy;
        if (dx * dx + dy * dy <= 1 && ox * ox + oy * oy <= R * R) p.set(xx, y, dx * dx + dy * dy > 0.6 ? LANDD : LAND);
      }
    }
    // かげ（みぎ下）と 光（ひだり上）
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
      if (x * x + y * y > R * R || x + y < 9) continue;
      const c = p.get(cx + x, cy + y);
      if (c && c[0] === '#') p.set(cx + x, cy + y, shade(c, -0.22));
    }
    p.ellipse(cx - 5, cy - 6, 3, 2, '#bfe8ff');
  };
  const planetRing = (p, f, front) => {
    const cy = CY(f) + 1;
    for (let i = 0; i < 120; i++) {
      const a = (i / 120) * TAU, s = Math.sin(a);
      if ((s >= 0) !== front) continue;
      const x = cx + Math.cos(a) * 23, y = cy + s * 4.5 - Math.cos(a) * 2;
      if (front || (x - cx) ** 2 + (y - CY(f)) ** 2 > R * R) { p.set(x, y, RINGC); p.set(x, y + 1, shade(RINGC, -0.2)); }
    }
  };
  const moon = (p, f, front) => {
    const a = (f * TAU) / 3 + 0.5, s = Math.sin(a);
    if ((s >= 0) !== front) return;
    const x = cx + Math.cos(a) * 26, y = CY(f) - 10 + s * 5;
    p.ellipse(x, y, 2.4, 2.4, '#e8e4dc');
    p.set(x - 1, y - 1, '#ffffff');
    p.set(x + 1, y + 1, '#a8a49c');
  };
  // 草と 花（stage: 0 … め・1 … さいた 花・2 … 消えた）
  const plants = (p, f) => {
    const cy = CY(f);
    SPOTS.forEach((deg, i) => {
      const stage = (f + i) % 3;
      if (stage === 2) return;
      const a = (deg * Math.PI) / 180;
      const x = cx + Math.cos(a) * (R - 0.5), y = cy + Math.sin(a) * (R - 0.5);
      const ux = Math.cos(a), uy = Math.sin(a);
      if (stage === 0) { seg(p, x, y, x + ux * 2, y + uy * 2, '#7ae860'); p.set(x + ux * 2 - uy, y + uy * 2 + ux, '#5ac84a'); return; }
      seg(p, x, y, x + ux * 4, y + uy * 4, '#5ac84a');
      const fx = x + ux * 5, fy = y + uy * 5, c = FLOW[i];
      for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) p.set(fx + ox, fy + oy, c);
      p.set(fx, fy, '#ffe070');
    });
  };
  return art({
    sw: W, fw: W, h: H, shadow: 1.4,
    rider: (view, f) => stand(cx, CY(f) - R + 1, 1),
    paint(p, view, f, layer) {
      if (layer === 'back') {
        moon(p, f, false);
        planetRing(p, f, false);
        planet(p, f);
        return;
      }
      plants(p, f);
      planetRing(p, f, true);
      moon(p, f, true);
      // こわれて 落ちる 小石
      const cy = CY(f);
      for (let i = 0; i < 3; i++) p.rect(Math.round(cx - 5 + i * 5 + (i === 1 ? f - 1 : 0)), Math.round(cy + R + 1 + ((f + i) % 3) * 2), 2, 2, i % 2 ? ROCK : shade(ROCK, -0.2));
    },
    fx(p, view, f) {
      const cy = CY(f);
      // 消えた 花の きらきら
      SPOTS.forEach((deg, i) => {
        if ((f + i) % 3 !== 2) return;
        const a = (deg * Math.PI) / 180;
        twinkle(p, cx + Math.cos(a) * (R + 4), cy + Math.sin(a) * (R + 4), rgba(FLOW[i], 0.85));
      });
      // うっすら 光る 空気
      ring(p, cx, cy, R + 2, R + 2, rgba('#bfe8ff', 0.35));
      for (let i = 0; i < 3; i++) twinkle(p, 6 + i * 20 + f * 2, 8 + ((i + f) % 3) * 8, rgba('#ffffff', 0.8));
    },
  });
}

// ───────────── 11. 夢のスタジアム鉄道: 夢の 特急（まどから 応えんの 旗） ─────────────
function dreamExpressArt({ carArt, seg, poly, rgba, twinkle }) {
  const FLAG = ['#d8303a', '#3a64d8', '#f2c14e', '#3ac85a'];
  const flag = (p, x, y, f, i, dir = -1) => {
    // 棒と ゆれる 旗（dir … 旗の むき）
    p.vline(x, y, y + 6, '#c8ccd8');
    const c = FLAG[i % 4];
    const k = (f + i) % 3;
    for (let j = 0; j < 5; j++) {
      const xx = x + dir * (j + 1);
      const wy = [0, j % 2, (j + 1) % 2][k];
      p.vline(xx, y + wy, y + 3 + wy - Math.floor(j / 2), c);
    }
  };
  const fan = (p, x, y, f, i) => {
    const up = (f + i) % 2;
    p.ellipse(x, y - up, 2.2, 2.2, '#f7d4ae');
    p.hline(x - 2, x + 2, y - 2 - up, ['#2a2022', '#8a4a22', '#e8c070', '#2a2022'][i % 4]);
  };
  return carArt({
    body: '#f6f2e8', len: 88, h: 15, roof: 'long', windows: 5, cab: [10, 82], stripe: '#d8303a', stripe2: '#f2c14e',
    wheelR: 4, wheelX: [16, 28, 62, 74], seatX: 17, fw: 44, roofCol: '#f2c14e', rim: '#f2c14e', frames: 3, bob: true,
    extra(p, view, f, layer, g) {
      if (view === 'side') {
        const step = (g.cab[1] - g.cab[0]) / 5;
        if (layer === 'back') {
          for (let i = 1; i < 5; i++) {
            const x = Math.round(g.cab[0] + step * i + step / 2);
            fan(p, x - 2, g.top - 4, f, i);
            fan(p, x + 3, g.top - 3, f, i + 1);
          }
          return;
        }
        // とがった 先頭（ひだり）
        poly(p, [[0, g.top + 14], [0, g.top + 6], [9, g.rt + 4], [10, g.rt + 4], [10, g.top + 14]], '#f6f2e8');
        poly(p, [[2, g.top + 4], [8, g.rt + 6], [9, g.top + 1], [4, g.top + 4]], '#5a7a9a');
        p.hline(0, 10, g.top + 8, '#d8303a');
        p.hline(0, 10, g.top + 9, '#f2c14e');
        p.rect(0, g.top + 11, 2, 2, '#ffe070');
        // 野球の ボールの マーク
        p.ellipse(46, g.top + 4, 3, 3, '#ffffff');
        p.set(45, g.top + 3, '#d8303a'); p.set(45, g.top + 5, '#d8303a'); p.set(47, g.top + 3, '#d8303a'); p.set(47, g.top + 5, '#d8303a');
        // まどから 旗
        for (let i = 1; i < 5; i++) flag(p, Math.round(g.cab[0] + step * i + step / 2), g.rt - 4, f, i, 1);
        return;
      }
      if (layer === 'back') return;
      // まえ・うしろ: やねの 両がわから 旗
      flag(p, Math.round(g.x0 + 1), g.rt - 5, f, 1, -1);
      flag(p, Math.round(g.x0 + g.w - 2), g.rt - 5, f, 2, 1);
      if (view === 'front') {
        p.ellipse(g.cx, g.top + 3, 2.6, 2.6, '#ffffff');
        p.set(g.cx - 1, g.top + 2, '#d8303a'); p.set(g.cx + 1, g.top + 4, '#d8303a');
      }
    },
    fx(p, view, f, { w }) {
      // 紙ふぶき
      const C = ['#ff5a8a', '#5ad8ff', '#ffe070', '#7aff8a', '#ffffff'];
      for (let i = 0; i < 10; i++) {
        const x = (i * 9 + f * 5) % w, y = 2 + ((i * 7 + f * 5) % 12);
        p.set(x, y, rgba(C[i % 5], 0.9)); p.set(x + (i % 2), y + 1, rgba(C[i % 5], 0.9));
      }
      if (view === 'side') for (let i = 0; i < 3; i++) p.hline(w - 8 + ((f * 2 + i) % 4), w - 1, 24 + i * 6, rgba('#ffffff', 0.6));
      twinkle(p, [12, 30, 20][f] % w, 8, rgba('#fff6c0', 0.9));
    },
    shadowScale: 2.2,
  });
}

// ───────────── 12. 天候の神: 小さな 台風の 目（まわりに 雲と 小さな 雷） ─────────────
function typhoonArt({ poly, rgba, stand }) {
  const H = 60, G = H - 2, W = 64, cx = W / 2;
  const BOB = [0, -1, -1];
  const EY = (f) => G - 10 + BOB[f];
  const CLOUD = (s) => {
    const v = Math.round(250 - s * 70);
    return `#${[v, v, Math.min(255, v + 12)].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
  };
  // うず（3本の うでの 雲。front … てまえ半分）
  const swirl = (p, f, front) => {
    const ey = EY(f), rot = -(f * TAU) / 9;
    const pts = [];
    for (let arm = 0; arm < 3; arm++) for (let k = 0; k <= 12; k++) {
      const s = k / 12, a = rot + (arm * TAU) / 3 + s * 3.4;
      const rad = 7 + s * 22, sn = Math.sin(a);
      if ((sn >= 0) !== front) continue;
      pts.push({ x: cx + Math.cos(a) * rad, y: ey + sn * rad * 0.3 - (1 - s) * 3, r: 2.2 + s * 2, s });
    }
    pts.sort((a, b) => a.y - b.y);
    for (const q of pts) puff(p, q.x, q.y, q.r, CLOUD(q.s), CLOUD(q.s + 0.35));
  };
  return art({
    sw: W, fw: W, h: H, shadow: 1.8,
    rider: (view, f) => stand(cx, EY(f), 1),
    paint(p, view, f, layer) {
      const ey = EY(f);
      if (layer === 'back') {
        swirl(p, f, false);
        // 目の かべ（おく）と 足もとの 雲
        for (let i = 0; i < 8; i++) { const a = Math.PI + (i / 7) * Math.PI; puff(p, cx + Math.cos(a) * 7, ey - 2 + Math.sin(a) * 2, 2.6, '#f4f4fa', '#c8ccdc'); }
        p.ellipse(cx, ey + 1, 6, 2, '#ffffff');
        return;
      }
      swirl(p, f, true);
      for (let i = 0; i < 6; i++) { const a = (i / 5) * Math.PI; puff(p, cx + Math.cos(a) * 7.5, ey + 1 + Math.sin(a) * 2, 2.4, '#f4f4fa', '#c8ccdc'); }
    },
    fx(p, view, f) {
      const ey = EY(f);
      const core = rgba('#fff8a0', 0.95), glow = rgba('#ffe070', 0.5);
      // 小さな 雷（コマで 場所が かわる）
      const B = [[[6, ey - 12, 1], [52, ey - 8, -1]], [[44, ey - 14, -1], [14, ey - 4, 1]], [[22, ey - 16, 1], [58, ey - 12, -1]]][f];
      B.forEach(([x, y, d], i) => bolt(p, x, y, 2, d * 2, 3, f + i, core, glow));
      // 雨つぶ
      for (let i = 0; i < 6; i++) {
        const x = 6 + ((i * 10 + f * 3) % (W - 12)), y = ey + 6 + ((i * 3 + f * 2) % 4);
        p.vline(x, y, y + 1, rgba('#8ac8ff', 0.75));
      }
      // 風の わ
      ring(p, cx, ey + 2, 30, 7, rgba('#ffffff', 0.25));
    },
  });
}
