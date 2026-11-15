// 第86回 B班: 幻の職業の 乗り物の ドット絵（名前と ねだんは shared/data/vehicles.js。第79回 vehicle-phantom.js と おなじ きまり）
//  ・武術会のリング（tenka_ring。天下一の格闘王）… 白い 道着に 赤い おびの 4人の 力もちが かつぐ 四角い リング。
//    赤い ロープ・4すみの 金の 柱・赤と 白の はたが 風で ゆれる。かつぐ 人の 足が ちょこちょこ 動く
//  ・空飛ぶカバの軍師台（hippo_stage。混とんの大軍師）… 空飛ぶ 白い カバ（ほう神の大軍師の 空飛ぶカバ）が せおう 木の 台。
//    白と 黒の はた・作戦の 地図・金の ふち。足もとの 雲と、白と 黒の 光の つぶ
// render/vehicle-art.js が addR86bVehicleArt(ART, kit) を よぶ（kit … 乗り物の 絵の どうぐ）。かき方の きまりは vehicle-art.js と おなじ
//   むきは 'side'（ひだりむき）・'front'・'back'。'back' の 層は 乗る 人より うしろ、'front' の 層は まえ。fx … すきとおった こうか
//   どれも 3コマ・こうか つき。2D と 2.5D は おなじ 絵

export function addR86bVehicleArt(ART, kit) {
  ART.tenka_ring = ringArt(kit);
  ART.hippo_stage = hippoStageArt(kit);
}

const GOLD = '#f2c14e', GOLDD = '#b8862a', GOLDL = '#fff2a8';
function art({ sw, fw, h, rider, paint, fx = null, shadow = 1.6 }) {
  return { frames: 3, size: (view) => (view === 'side' ? [sw, h] : [fw, h]), rider, paint, fx, fxUnder: false, shadowScale: shadow };
}

// ───────────── 武術会のリング ─────────────
function ringArt({ box, seg, poly, rgba, shade, twinkle, seat }) {
  const H = 64, G = H - 2, SW = 80, FW = 58;
  const GI = '#f6f4ee', SASH = '#c81e2a', SKIN = '#f2c8a0', HAIR = '#2a2022', MAT = '#dcd6c8', ROPE = '#d8303a';
  const BOB = [0, -2, -1];
  const PY = (f) => G - 12 + BOB[f]; // かつぐ 棒
  // かつぐ 人（よこ。ひだりむき）。ph … 足の コマずれ。白い 道着に 赤い おび・はちまき
  const carrierSide = (p, x, f, ph, dark) => {
    const k = (f + ph) % 3, py = PY(f);
    const gi = dark ? shade(GI, -0.3) : GI, sk = dark ? shade(SKIN, -0.2) : SKIN;
    const LEG = [[-2, 1], [0, 0], [1, -2]][k];
    seg(p, x, G - 6, x + LEG[0], G - 1, dark ? '#9a968a' : '#d8d4c8', 1.5);
    seg(p, x + 1, G - 6, x + 1 + LEG[1], G - 1, dark ? '#9a968a' : '#d8d4c8', 1.5);
    box(p, x - 2, py + 2, 6, G - 6 - py - 1, gi, { r: 1 });
    p.hline(x - 2, x + 3, G - 8, dark ? shade(SASH, -0.3) : SASH);
    p.ellipse(x, py - 1.5, 3, 3, sk);
    p.hline(x - 2, x + 3, py - 5, HAIR);
    p.hline(x - 3, x + 3, py - 4, SASH);
    p.set(x - 2, py - 2, '#1b1330');
    seg(p, x - 1, py + 3, x - 2, py, sk, 1.4);
  };
  const carrierFront = (p, x, f, ph, dark, face) => {
    const k = (f + ph) % 3, py = PY(f);
    const gi = dark ? shade(GI, -0.3) : GI, sk = dark ? shade(SKIN, -0.2) : SKIN;
    const up = [[1, 0], [0, 1], [0, 0]][k];
    p.vline(x - 1, G - 6, G - 1 - up[0], '#c8c4b8');
    p.vline(x + 1, G - 6, G - 1 - up[1], '#c8c4b8');
    box(p, x - 3, py + 2, 7, G - 6 - py - 1, gi, { r: 1 });
    p.hline(x - 3, x + 3, G - 8, dark ? shade(SASH, -0.3) : SASH);
    p.ellipse(x, py - 1.5, 3, 3, sk);
    if (face) { p.hline(x - 2, x + 2, py - 5, HAIR); p.set(x - 1, py - 1, '#1b1330'); p.set(x + 1, py - 1, '#1b1330'); }
    else p.ellipse(x, py - 2, 3, 2.6, HAIR);
    p.hline(x - 3, x + 3, py - 4, SASH);
  };
  // リング（台・マット・4すみの 柱・ロープ・はた）
  const ringBox = (p, x0, x1, f, depth) => {
    const py = PY(f), top = py - 6;
    // 台（こげ茶の 木と 金の ふち）
    box(p, x0, py - 4, x1 - x0, 4, '#5a3a22', { r: 0 });
    p.hline(x0, x1 - 1, py - 4, GOLD);
    p.hline(x0, x1 - 1, py - 1, GOLDD);
    // マット（うすい 灰色・まん中に 赤い まる）
    box(p, x0 + 1, top - depth, x1 - x0 - 2, depth + 2, MAT, { r: 0 });
    p.ellipse((x0 + x1) / 2, top - depth / 2 + 1, Math.max(2, (x1 - x0) * 0.12), Math.max(1, depth * 0.25), shade(ROPE, 0.1));
    // 4すみの 柱（金）と 3本の ロープ（赤）
    const postH = 12;
    const posts = [[x0 + 1, top - depth], [x1 - 2, top - depth], [x0 + 1, top + 1], [x1 - 2, top + 1]];
    for (const [x, y] of posts) {
      p.vline(x, y - postH, y, GOLDD);
      p.vline(x + 1, y - postH, y, GOLD);
      p.ellipse(x + 0.5, y - postH, 1.2, 1.2, GOLDL);
    }
    for (let r = 0; r < 3; r++) {
      const dy = 3 + r * 3;
      p.hline(x0 + 2, x1 - 3, top + 1 - dy, ROPE);
      p.hline(x0 + 2, x1 - 3, top - depth - dy, shade(ROPE, -0.25));
    }
    // はた（赤と 白。風で ゆれる）
    const sw = [0, 1, -1][f];
    for (const [i, [x, y]] of posts.slice(0, 2).entries()) {
      const fy = y - postH;
      poly(p, [[x + 1, fy - 5], [x + 6 + sw, fy - 4 + sw * 0.5], [x + 1, fy - 1]], i ? '#f6f4ee' : ROPE);
      p.vline(x + 1, fy - 6, fy, GOLDD);
    }
  };
  const side = (p, f, layer) => {
    const py = PY(f);
    if (layer === 'back') {
      seg(p, 2, py - 1, 78, py - 1, shade('#8a5a32', -0.3), 2);
      for (const [i, x] of [18, 40, 62].entries()) carrierSide(p, x + 3, f, i + 1, true);
      return;
    }
    ringBox(p, 14, 66, f, 4);
    seg(p, 2, py, 78, py, '#8a5a32', 2.2);
    p.rect(1, py - 1, 2, 3, GOLD); p.rect(77, py - 1, 2, 3, GOLD);
    for (const [i, x] of [8, 30, 52, 72].entries()) carrierSide(p, x, f, i, false);
  };
  const front = (p, f, layer, face) => {
    const cx = FW / 2, py = PY(f);
    if (layer === 'back') {
      for (const s of [-1, 1]) carrierFront(p, cx + s * 14, f, s + 2, true, face);
      return;
    }
    ringBox(p, cx - 21, cx + 21, f, 6);
    for (const s of [-1, 1]) { p.ellipse(cx + s * 15, py, 2, 2, '#8a5a32'); p.set(cx + s * 15, py, GOLD); }
    for (const s of [-1, 1]) carrierFront(p, cx + s * 21, f, s + 1, false, face);
    for (const s of [-1, 1]) carrierFront(p, cx + s * 9, f, s + 3, false, face);
  };
  return art({
    sw: SW, fw: FW, h: H, shadow: 2,
    rider: (view, f) => seat(view === 'side' ? 40 : FW / 2, PY(f) - 9, 34),
    paint(p, view, f, layer) {
      if (view === 'side') side(p, f, layer);
      else front(p, f, layer, view === 'front');
    },
    fx(p, view, f) {
      // 青い れい気の つぶと 白い 風の すじ（武術会の 熱気）
      const w = view === 'side' ? SW : FW;
      for (let i = 0; i < 7; i++) {
        const x = (i * 13 + f * 5) % w, y = 6 + ((i * 7 + f * 5) % 18);
        p.set(x, y, rgba(i % 2 ? '#8ad8ff' : '#ffffff', 0.85));
        p.set(x + 1, y + 1, rgba('#5ab8ff', 0.6));
      }
      for (let i = 0; i < 3; i++) {
        const y = PY(f) - 22 + i * 4, x0 = (f * 6 + i * 9) % 12;
        for (let x = x0; x < x0 + 10; x++) p.set(x + (view === 'side' ? 4 : 2), y + ((x >> 2) % 2), rgba('#e8fff8', 0.55));
      }
      for (let i = 0; i < 2; i++) twinkle(p, (view === 'side' ? 18 : 10) + i * (view === 'side' ? 44 : 36) + f, PY(f) - 20 + ((i + f) % 2) * 3, rgba(GOLDL, 0.9));
    },
  });
}

// ───────────── 空飛ぶカバの軍師台 ─────────────
function hippoStageArt({ box, seg, poly, rgba, shade, twinkle, seat }) {
  const H = 62, SW = 72, FW = 46;
  const B = '#f4f2ee', BD = shade(B, -0.18), BL = '#ffffff';
  const SN = '#e8dcd0', PINK = '#f0a8b0', EYE = '#1b1330', CLOUD = '#dfe8f4';
  const WOOD = '#7a4a26', CLOTH = '#2a2056';
  const BOB = [0, -1.5, -0.5];
  const cloud = (p, cx, cy, w) => {
    for (let i = -2; i <= 2; i++) p.ellipse(cx + i * w * 0.22, cy + (Math.abs(i) === 2 ? 0.5 : 0), w * 0.18, 2.6, CLOUD);
    p.hline(Math.round(cx - w * 0.4), Math.round(cx + w * 0.4), Math.round(cy - 1.5), '#ffffff');
  };
  const stub = (p, x, y, sw, c) => {
    seg(p, x, y, x + sw, y + 4, c, 3.6);
    p.ellipse(x + sw, y + 4.6, 2, 1.3, shade(c, -0.08));
  };
  // 軍師の 台（木の 台・こい あいの ぬの・金の ふち・作戦の 地図・白と 黒の はた）
  const stage = (p, x0, x1, y, f, map) => {
    box(p, x0, y - 3, x1 - x0, 4, WOOD, { r: 1 });
    p.hline(x0, x1 - 1, y - 3, GOLD);
    p.hline(x0 + 1, x1 - 2, y, GOLDD);
    poly(p, [[x0 + 1, y + 1], [x1 - 2, y + 1], [x1 - 4, y + 5], [x0 + 3, y + 5]], CLOTH);
    p.hline(x0 + 3, x1 - 4, y + 5, GOLD);
    if (map) {
      box(p, x0 + 3, y - 6, 7, 3, '#f0e2b8', { r: 0 });
      p.set(x0 + 5, y - 5, '#c81e2a'); p.set(x0 + 7, y - 4, '#2a6ad8'); p.set(x0 + 8, y - 5, '#3a3a48');
    }
    const sw = [0, 1, -1][f];
    for (const [i, x] of [x0 + 1, x1 - 2].entries()) {
      p.vline(x, y - 15, y - 3, GOLDD);
      poly(p, [[x, y - 15], [x + (i ? -6 : 6) + sw, y - 13 + sw * 0.5], [x, y - 10]], i ? '#1a1a22' : '#f6f6fa');
      p.ellipse(x, y - 15.5, 0.9, 0.9, GOLDL);
    }
  };
  const side = (p, f, layer) => {
    const by = 38 + BOB[f];
    const sw = f === 1 ? 0.8 : f === 2 ? -0.8 : 0;
    if (layer === 'back') {
      stub(p, 28, by + 6, -sw, BD);
      stub(p, 48, by + 6, sw, BD);
      cloud(p, 38, 58, 40);
      return;
    }
    p.ellipse(39, by, 17, 9.5, B);
    p.ellipse(39, by - 7, 12, 2.4, BL);
    p.ellipse(39, by + 6, 11, 2.6, BD);
    p.ellipse(18, by - 6, 9, 8, B);
    p.ellipse(9, by - 3, 6.5, 5.2, SN);
    p.ellipse(6.6, by - 4.5, 0.9, 0.7, EYE);
    p.ellipse(10, by - 5, 0.9, 0.7, EYE);
    p.hline(5, 12, Math.round(by - 0.5), shade(SN, -0.25));
    for (const [x, y] of [[20, by - 14], [24, by - 13]]) {
      p.ellipse(x, y, 1.8, 2.2, B);
      p.ellipse(x, y + 0.4, 0.8, 1.1, PINK);
    }
    p.rect(15, Math.round(by - 9), 2, 2, EYE);
    p.set(15, Math.round(by - 9), '#ffffff');
    p.ellipse(18, by - 3.5, 1.6, 1, PINK);
    p.ellipse(56.5, by - 1, 1.7, 1.5, BD);
    stub(p, 31, by + 7, sw, B);
    stub(p, 50, by + 7, -sw, B);
    stage(p, 28, 52, Math.round(by - 9), f, true);
  };
  const front = (p, f, layer) => {
    const cx = FW / 2, by = 38 + BOB[f];
    if (layer === 'back') {
      p.ellipse(cx, by - 1, 13, 8.5, BD);
      stub(p, cx - 8, by + 4, 0, BD);
      stub(p, cx + 8, by + 4, 0, BD);
      stage(p, cx - 13, cx + 13, Math.round(by - 9), f, false);
      cloud(p, cx, 58, 30);
      return;
    }
    p.ellipse(cx, by + 3, 13, 8, B);
    stub(p, cx - 7, by + 7, -0.4, B);
    stub(p, cx + 7, by + 7, 0.4, B);
    const hy = by + 3;
    for (const s of [-1, 1]) {
      p.ellipse(cx + s * 7, hy - 7, 1.8, 2.1, B);
      p.ellipse(cx + s * 7, hy - 6.6, 0.8, 1.0, PINK);
    }
    p.ellipse(cx, hy, 9, 7, B);
    for (const s of [-1, 1]) p.rect(Math.round(cx + s * 3.4 - (s < 0 ? 1 : 0)), Math.round(hy - 3), 1, 2, EYE);
    p.ellipse(cx, hy + 3, 6.5, 3.6, SN);
    for (const s of [-1, 1]) p.ellipse(cx + s * 2, hy + 2.4, 0.8, 0.7, shade(SN, -0.35));
    for (const s of [-1, 1]) p.ellipse(cx + s * 6.5, hy + 1, 1.2, 0.8, PINK);
  };
  const back = (p, f, layer) => {
    const cx = FW / 2, by = 38 + BOB[f];
    if (layer === 'back') {
      p.ellipse(cx, by - 10, 8, 6, B);
      for (const s of [-1, 1]) {
        p.ellipse(cx + s * 6, by - 15, 1.8, 2.1, B);
        p.ellipse(cx + s * 6, by - 14.6, 0.8, 1.0, PINK);
      }
      stub(p, cx - 7, by + 3, 0, BD);
      stub(p, cx + 7, by + 3, 0, BD);
      return;
    }
    p.ellipse(cx, by + 2, 13, 9, B);
    p.ellipse(cx, by + 6, 9, 2.4, BD);
    stub(p, cx - 8, by + 7, -0.5, B);
    stub(p, cx + 8, by + 7, 0.5, B);
    p.ellipse(cx, by + 4 + (f === 1 ? -0.5 : 0), 1.7, 1.5, BD);
    stage(p, cx - 13, cx + 13, Math.round(by - 9), f, false);
    cloud(p, cx, 58, 30);
  };
  return art({
    sw: SW, fw: FW, h: H, shadow: 1.7,
    rider: (view, f) => {
      const bob = Math.round(BOB[f]);
      if (view === 'side') return seat(40, 28 + bob, 34);
      return seat(FW / 2, 28 + bob, 34);
    },
    paint(p, view, f, layer) {
      if (view === 'side') side(p, f, layer);
      else if (view === 'front') front(p, f, layer);
      else back(p, f, layer);
    },
    fx(p, view, f) {
      // 白と 黒の 光の つぶ（太極）・むらさきの きらきら
      const w = view === 'side' ? SW : FW;
      for (let i = 0; i < 8; i++) {
        const x = (i * 9 + f * 4) % w, y = 4 + ((i * 11 + f * 7) % 22);
        p.set(x, y, rgba(i % 2 ? '#ffffff' : '#2a2a34', 0.8));
        if (i % 3 === 0) p.set(x + 1, y, rgba('#c08aff', 0.7));
      }
      for (let i = 0; i < 2; i++) twinkle(p, 6 + i * (w - 14) + f, 10 + ((i + f) % 2) * 4, rgba(GOLDL, 0.9));
    },
  });
}
