// 第83回 B班の 乗り物の ドット絵: がたがたの先生の自転車（ぬ〜べ〜の 系統。名前と 値段は shared/data/vehicles.js）
// 古い くすんだ みどりの 自転車（前から ある 自転車の 絵 bikeArt を もとに）。フレームに さびの てん・前の かごに テストの 紙の たば（赤い はなまる）・
// うしろに にだい。3コマで がたがた ゆれる（1コマだけ 1ドット うく）・車輪の よこに 小さな ゆれの 線
// render/vehicle-art.js が addR83bVehicleArt(ART, kit) を よぶ（kit … 乗り物の 絵の どうぐ）。かき方の きまりは vehicle-art.js と おなじ
//   むきは 'side'（ひだりむき）・'front'・'back'。'back' の 層は 乗る 人より うしろ、'front' の 層は まえ

export function addR83bVehicleArt(ART, kit) {
  ART.teacher_bike = teacherBikeArt(kit);
}

// p を dy だけ ずらして かく（がたがた）
function shifted(p, dy) {
  return new Proxy(p, {
    get(o, k) {
      if (k === 'set') return (x, y, c) => o.set(x, y + dy, c);
      if (k === 'rect') return (x, y, w, h, c) => o.rect(x, y + dy, w, h, c);
      if (k === 'hline') return (x1, x2, y, c) => o.hline(x1, x2, y + dy, c);
      if (k === 'vline') return (x, y1, y2, c) => o.vline(x, y1 + dy, y2 + dy, c);
      if (k === 'ellipse') return (cx, cy, rx, ry, c) => o.ellipse(cx, cy + dy, rx, ry, c);
      const v = o[k];
      return typeof v === 'function' ? v.bind(o) : v;
    },
  });
}

function teacherBikeArt({ bikeArt, box, seg, rgba }) {
  const base = bikeArt({ kind: 'bicycle', color: '#5e7058' });
  const DY = [0, -1, 0];
  const RUST = '#a2622a', PAPER = '#f6f4ec', LINE = '#9aa4c0', MARU = '#e0343a', BASKET = '#9aa0a8';
  // テストの 紙の たば（x, y … 左上）
  const papers = (p, x, y, w) => {
    for (let i = 0; i < 3; i++) p.rect(x + i, y - i, w, 2, i === 2 ? PAPER : '#e4e0d4');
    p.hline(x + 3, x + w, y - 1, LINE);
    p.set(x + w - 1, y - 2, MARU);
    p.set(x + w, y - 2, MARU);
  };
  return {
    frames: 3,
    size: (view) => base.size(view),
    rider(view, f) {
      const R = base.rider(view, f % 2);
      return { ...R, y: R.y + DY[f] };
    },
    paint(p, view, f, layer) {
      const q = shifted(p, DY[f]);
      base.paint(q, view, f % 2, layer);
      if (layer !== 'front' && view !== 'back') return;
      if (view === 'side') {
        if (layer !== 'front') return;
        // 前の かごと テストの 紙
        papers(q, 2, 17, 8);
        box(q, 1, 18, 11, 7, BASKET);
        for (let x = 2; x < 11; x += 2) q.vline(x, 19, 23, '#6a707a');
        // うしろの にだい・どろよけ
        seg(q, 33, 31, 47, 31, '#8a8e9a', 1.4);
        seg(q, 47, 31, 46, 36, '#8a8e9a', 1.2);
        // さびの てん
        for (const [x, y] of [[20, 29], [33, 35], [24, 40], [37, 33]]) q.set(x, y, RUST);
        return;
      }
      if (view === 'front') {
        papers(q, 12, 23, 10);
        box(q, 12, 24, 12, 7, BASKET);
        for (let x = 13; x < 24; x += 2) q.vline(x, 25, 29, '#6a707a');
        q.set(16, 36, RUST);
        return;
      }
      // うしろから: にだい（人の むこう）
      if (layer === 'back') box(q, 12, 30, 12, 3, '#8a8e9a');
      else q.set(19, 38, RUST);
    },
    // 車輪の よこの ゆれの 線（すきとおる）
    fx(p, view, f) {
      if (f !== 1) return;
      const c = rgba('#c8ccd8', 0.8);
      if (view === 'side') {
        for (const x of [2, 50]) { p.set(x, 44, c); p.set(x, 46, c); }
      } else {
        for (const x of [8, 28]) { p.set(x, 44, c); p.set(x, 46, c); }
      }
    },
    shadowScale: base.shadowScale,
  };
}
