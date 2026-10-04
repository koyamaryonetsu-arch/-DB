// 第4章の タイル（16×16 ドット）: 砂ばく・砂丘・砂岩・ヤシ・サボテン・日干しれんが・砂嵐・古井戸（render/tiles.js が まぜる）
// Step 2 の かれた地下水路（石だたみ・切り石の かべ・水路の 底と 水・水門・鉄の こうし・がれきの せき）は render/tiles-canal.js
// (p, v, f, m) … Painter / ちがい（0〜3。砂嵐だけは ばしょ 0〜15。水路の 中は ばしょと 流れの むき）/ アニメの コマ / となりの ようす（mask。ch4Mask）
// ひかりは 左上から
import { T } from '../../shared/tiles.js?v=3285de757165';
import { Painter, prand, shade } from './pixel.js?v=3285de757165';
import { CANAL_PAINTERS, CANAL_FRAMES, CANAL_SPEED, CANAL_WALLS, canalMask } from './tiles-canal.js?v=3285de757165';

const TAU = Math.PI * 2;
// 4×4 の ディザ（だんだんの いろを まぜる）
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((n) => (n + 0.5) / 16);
const dither = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];

// 砂ばくの 砂（mapColor #e2c27e）
const DS = { base: '#e2c27e', lit: '#f0d898', hi: '#fbebc4', dot: '#d6b46e', rlit: '#eed49a', rsh: '#cfa964' };
// 砂丘（すこし こい 金色。かげは 赤みの ある 茶色）
const DN = ['#9e6e3c', '#b4844a', '#c89a58', '#dab06a', '#e8c480', '#f2d696', '#fbe8b6'];
// 砂岩（赤茶色の しま）
const SS = {
  rock: '#9c5a38', rockL: '#b46e48', rockD: '#80462a', cap: '#f0b88a', capL: '#f8d0a8', capD: '#d8966a', crack: '#7a3e24',
  band: ['#e2a070', '#cc8250', '#b86c42', '#d69060', '#c27448', '#a85e38', '#cc844f', '#b26640'], foot: '#5e3420',
};
// 日干しれんが
const AD = {
  face: '#d6a676', faceL: '#e8c292', faceD: '#c49060', stain: '#ba8656', brick: '#b8784c', brickL: '#c88a5a', mortar: '#966038',
  foot: '#a8784c', top: '#a87446', topIn: '#c08a5a', topL: '#d8a672', beam: '#5a3a20', beamL: '#82562e',
};
// 草地（オアシスの まわり）
const GR = { base: '#5bab4b', dark: '#4a953f', lit: '#79c663', blade: '#3e8436' };
// 砂嵐（こげ茶 → 黄土色。0 が いちばん くらい）
const ST = ['#5e3820', '#784a28', '#925e32', '#a8723e', '#bc864c', '#d09e60', '#e6bc80', '#f8dca8'];

// 小さな 砂の なみ（上が 明るく、下に かげ）
function ripple(p, x, y, len) {
  for (let i = 0; i < len; i++) {
    const end = i === 0 || i === len - 1;
    const yy = y + (end ? 1 : 0);
    p.set(x + i, yy + 1, DS.rsh);
    if (!end) p.set(x + i, yy, DS.rlit);
  }
}

// 砂ばくの 地面（つぶつぶと 風もよう）
export function desertBase(p, v, seed = 0) {
  p.rect(0, 0, 16, 16, DS.base);
  const r = prand(v * 41 + 17 + seed * 7);
  for (let i = 0; i < 10; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 3 === 0 ? DS.lit : DS.dot);
  p.set(Math.floor(r() * 16), Math.floor(r() * 16), DS.hi);
  // 風もよう: 1〜2本（すじが タイルの はしに かからない）
  const n = 1 + (r() < 0.6 ? 1 : 0);
  const y0 = 2 + Math.floor(r() * 3);
  for (let k = 0; k < n; k++) {
    const len = 4 + Math.floor(r() * 5);
    const x = 1 + Math.floor(r() * (15 - len));
    ripple(p, x, y0 + k * 7 + Math.floor(r() * 2), len);
  }
}

function grassBase(p, v, seed = 0) {
  p.rect(0, 0, 16, 16, GR.base);
  const r = prand(v * 97 + 13 + seed);
  for (let i = 0; i < 7; i++) {
    const x = Math.floor(r() * 15), y = Math.floor(r() * 14) + 1;
    p.set(x, y, GR.blade);
    p.set(x, y - 1, GR.lit);
  }
  for (let i = 0; i < 4; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), GR.dark);
}

// ヤシ・サボテンの 下の 地面（mask の 1 … まわりが 草地）
const groundBase = (p, v, m, seed) => (m & 1 ? grassBase(p, v, seed) : desertBase(p, v, seed));

// ───── 砂丘の かたち（2D と 2.5D で つかう）─────
// mask: 1=北 2=東 4=南 8=西 も 砂丘 / 16=北東 32=南東 64=南西 128=北西 の すみが ぜんぶ 砂丘
// x, y … タイルの 中の いち（0〜16）。となりも 砂丘なら さかいで おなじ 高さに なる（つなぎめが 見えない）
export const DUNE_N = 1, DUNE_E = 2, DUNE_S = 4, DUNE_W = 8, DUNE_NE = 16, DUNE_SE = 32, DUNE_SW = 64, DUNE_NW = 128;
export function duneDist(m, x, y) {
  const dx = x - 8, dy = y - 8, ax = Math.abs(dx), ay = Math.abs(dy);
  let d = Math.sqrt(dx * dx + dy * dy);
  // まんなかから となりの 砂丘へ のびる 背すじ
  if (m & DUNE_N && dy <= 0 && ax < d) d = ax;
  if (m & DUNE_S && dy >= 0 && ax < d) d = ax;
  if (m & DUNE_E && dx >= 0 && ay < d) d = ay;
  if (m & DUNE_W && dx <= 0 && ay < d) d = ay;
  if (m < 16) return d;
  // すみが ぜんぶ 砂丘なら その 4分の1は いちばん 高い
  const q = (qx, qy) => { const a = Math.max(0, qx), b = Math.max(0, qy); return Math.sqrt(a * a + b * b); };
  if (m & DUNE_NE) d = Math.min(d, q(-dx, dy));
  if (m & DUNE_SE) d = Math.min(d, q(-dx, -dy));
  if (m & DUNE_SW) d = Math.min(d, q(dx, -dy));
  if (m & DUNE_NW) d = Math.min(d, q(dx, dy));
  return d;
}
// 0（地面）〜 1（てっぺん）。ふもとは なだらか、上は まるく
export function duneShape(m, x, y) {
  const t = Math.max(0, Math.min(1, 1 - duneDist(m, x, y) / 8));
  return t * t * (3 - 2 * t);
}

// 砂嵐の もよう（64×64 ドットで くりかえす。wx, wy … 世界の ドット / f … コマ 0〜15。16コマで 64ドット すすむ）
// 風は 西から 東へ。ゆっくり うねる 砂の かたまり と、よこの しま（0〜1）
export function stormLevel(wx, wy, f) {
  const sh = f * 4;
  const a = Math.sin(TAU * ((wx - sh) / 64 + wy / 32 + 0.2 * Math.sin(TAU * (wy / 64 + f / 16))));
  const b = Math.sin(TAU * (wy / 8 + 0.2 * Math.sin(TAU * (wx - sh * 2) / 64)));
  return Math.max(0, Math.min(1, 0.42 + a * 0.13 + b * 0.13));
}
// 砂けむりの かたまり: [x, y, 大きさ]（64×64 の 中。はしを こえても つながる）
const BILLOWS = [[6, 8, 7], [22, 4, 6], [38, 10, 8], [54, 5, 6], [14, 22, 8], [30, 24, 6.5], [48, 21, 7.5], [62, 28, 5], [5, 37, 6.5], [22, 40, 8], [40, 38, 6], [56, 44, 7.5], [12, 54, 7], [30, 57, 6.5], [46, 60, 6], [62, 58, 5]];
// 風に とばされる 砂の すじ: [x, y, ながさ, はやさ（1 か 2）, こさ（0 くらい・1 明るい・2 まぶしい）]
const STREAKS = (() => {
  const r = prand(4242);
  const out = [];
  for (let i = 0; i < 56; i++) {
    const tone = i % 7 === 0 ? 2 : i % 3 === 0 ? 0 : 1;
    out.push([Math.floor(r() * 64), Math.floor(r() * 64), 3 + Math.floor(r() * 8), r() < 0.45 ? 2 : 1, tone]);
  }
  return out;
})();

// 砂嵐の もようを かく（64×64 の もようの (ox, oy) から w×h だけ。2D の タイル も 2.5D の かべの え も これ）
export function paintStorm(p, ox, oy, f, w, h) {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = stormLevel(ox + x, oy + y, f);
      const t = Math.max(0, Math.min(ST.length - 1.001, s * (ST.length - 1)));
      let k = Math.floor(t);
      if (t - k > dither(x, y)) k++;
      p.set(x, y, ST[k]);
    }
  }
  // もこもこ ころがる 砂けむり（東へ。左上が 明るい）
  for (const [bx, by, br] of BILLOWS) {
    const cx = bx + f * 4;
    for (let yy = Math.floor(by - br); yy <= Math.ceil(by + br); yy++) {
      const y = (((yy - oy) % 64) + 64) % 64;
      if (y >= h) continue;
      for (let xx = Math.floor(cx - br * 1.3); xx <= Math.ceil(cx + br * 1.3); xx++) {
        const x = (((xx - ox) % 64) + 64) % 64;
        if (x >= w) continue;
        const nx = (xx + 0.5 - cx) / (br * 1.3), ny = (yy + 0.5 - by) / br;
        const d2 = nx * nx + ny * ny;
        if (d2 > 1 || (d2 > 0.8 && dither(x, y) > (1 - d2) * 5)) continue;
        const lum = (-nx * 0.5 - ny * 0.65 + Math.sqrt(1 - Math.min(1, d2)) * 0.5) * 0.5 + 0.4;
        const t = Math.max(1, Math.min(ST.length - 1.001, lum * (ST.length - 1.5) + 0.5));
        let k = Math.floor(t);
        if (t - k > dither(x + 2, y + 1)) k++;
        p.set(x, y, ST[Math.min(ST.length - 2, k)]);
      }
    }
  }
  // 風に とばされる 砂の すじ（東へ。すこし 右下がり。頭が こく、しっぽは うすい）
  for (const [sx, sy, len, sp, tone] of STREAKS) {
    const hx = sx + f * 4 * sp;
    for (let i = 0; i < len; i++) {
      const x = (((hx - i - ox) % 64) + 64) % 64, y = (((sy - Math.floor((len - i) / 5) - oy) % 64) + 64) % 64;
      if (x >= w || y >= h) continue;
      const k = tone === 0 ? (i < len / 2 ? 0 : 1) : tone === 2 ? (i < 2 ? 7 : 6) : (i < 2 ? 6 : i < len * 0.7 ? 5 : 4);
      p.set(x, y, ST[k]);
    }
  }
}

export const CH4_PAINTERS = {
  [T.DESERT]: (p, v) => desertBase(p, v),
  [T.DUNE]: (p, v, f, m) => {
    desertBase(p, v, 3);
    const H = (x, y) => duneShape(m, x, y);
    const K = 9; // 高さ（ドット）
    const L = [-0.5, -0.6, 0.62]; // 左上から の ひかり
    const flat = L[2] / Math.hypot(...L);
    // 中の たいらな ところの 小さな 砂丘の すじ（三日月の 形。タイルの はしには かからない）
    const [ax, ay, aw] = [[2, 8, 11], [4, 11, 9], [1, 6, 12], [3, 10, 10]][v & 3];
    const crestY = (x) => (x < ax || x > ax + aw ? null : ay - 2.6 * Math.sin(Math.PI * (x - ax) / aw));
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const cx = x + 0.5, cy = y + 0.5;
        const h = H(cx, cy);
        // ふもとは 地面と まぜる
        if (h <= 0.05) continue;
        const gx = (H(cx + 0.5, cy) - H(cx - 0.5, cy)) * K, gy = (H(cx, cy + 0.5) - H(cx, cy - 0.5)) * K;
        const lum = (-gx * L[0] - gy * L[1] + L[2]) / Math.hypot(gx, gy, 1) / Math.hypot(...L);
        let lv = 3 + (lum - flat) * 9;
        // たいらな ところは 風紋
        const wgt = Math.max(0, Math.min(1, (h - 0.9) / 0.08));
        const yc = wgt > 0 ? crestY(cx) : null;
        if (yc !== null) {
          const d = cy - yc, edge = Math.min(cx - ax, ax + aw - cx) < 1.5 ? 0.5 : 1;
          let c = 0;
          if (d > -3.5 && d < -0.5) c = d > -1.5 ? 1 : 0.5; // 上がわ（ひかりが あたる）
          else if (d >= -0.5 && d < 0.5) c = 1.8; // いただき
          else if (d >= 0.5 && d < 3.5) c = d < 1.5 ? -1.8 : d < 2.5 ? -1.1 : -0.5; // かげ
          lv += c * wgt * edge;
        }
        lv = Math.max(0, Math.min(DN.length - 1, lv));
        let k = Math.floor(lv);
        if (lv - k > dither(x + 1, y + 2)) k++;
        p.set(x, y, DN[Math.min(DN.length - 1, k)]);
      }
    }
  },
  [T.SANDSTONE]: (p, v, f, m) => {
    // 赤茶色の 砂岩の 岩山（上が たいらな ビュート。よこの しま）
    // mask: 1=南 2=北 4=東 8=西 が 砂岩で ない（その がわは 砂ばくに なじませる）
    p.rect(0, 0, 16, 16, SS.rock);
    const r = prand(v * 59 + 13);
    for (let i = 0; i < 14; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 3 === 0 ? SS.rockL : SS.rockD);
    if (m & 15) {
      // 砂ばくに せっする がわ
      const q = new Painter(16, 16);
      desertBase(q, v, 5);
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const e = Math.min(m & 1 ? 15 - y : 99, m & 2 ? y : 99, m & 4 ? 15 - x : 99, m & 8 ? x : 99);
        if (e < 3 || (e < 5 && dither(x, y) > (e - 2) / 3)) p.set(x, y, q.get(x, y));
      }
    }
    // 岩の かたち（v で かわる）: [左, 右, てっぺん] の 柱。上が たいらで、よこに しま。左が 明るく 右が かげ
    const shapes = [
      [[2, 13, 4]], // ひくくて ひろい メサ
      [[4, 11, 1]], // 高い ビュート
      [[2, 6, 3], [9, 13, 2]], // ふたごの 岩
      [[2, 13, 7], [5, 10, 2]], // 2だんの 岩
    ];
    const bands = [0, 1, 1, 2, 3, 3, 4, 5, 5, 6, 7, 7, 5];
    for (const [l, rr, top] of shapes[v & 3]) {
      for (let y = top; y < 15; y++) {
        const sp = y > 11 ? y - 11 : 0; // ふもとの がれき
        const x0 = l - sp, x1 = rr + sp;
        for (let x = x0; x <= x1; x++) {
          let c;
          if (y === top) c = x < x0 + 3 ? SS.capL : SS.cap;
          else if (y === top + 1) c = SS.capD;
          else {
            c = SS.band[bands[Math.min(bands.length - 1, y - top - 2)]];
            if (x <= x0) c = shade(c, 0.18);
            else if (x === x1) c = shade(c, -0.36);
            else if (x >= x1 - 2) c = shade(c, -0.18);
          }
          p.set(x, y, c);
        }
      }
      // かげ（右下の 地面）
      p.set(rr + 1, 14, SS.rockD); p.hline(l - 1, rr + 3, 15, SS.foot);
    }
    // われめ
    const cx = 5 + Math.floor(r() * 5);
    if (p.get(cx, 9) && p.get(cx, 9) !== SS.rock) { p.set(cx, 8, SS.crack); p.set(cx, 9, SS.crack); p.set(cx + 1, 10, SS.crack); }
  },
  [T.PALM]: (p, v, f, m) => {
    groundBase(p, v, m, 7);
    // みき（ふしの ある、すこし まがった みき）
    const trunk = '#8e6a3a', trunkD = '#6a4a26', trunkL = '#b08a52';
    for (let y = 15; y >= 5; y--) {
      const t = (15 - y) / 10;
      const x = 6 + Math.round(t * t * 2.4);
      p.set(x, y, trunkL); p.set(x + 1, y, trunk); p.set(x + 2, y, trunkD);
      if (y % 2 === 0) { p.set(x + 1, y, trunkD); p.set(x, y, trunk); }
    }
    // 葉（7まい。たれさがる）
    const cx = 9, cy = 4;
    const leaf = '#3f8a46', leafD = '#2a6434', leafL = '#6cba5a', leafH = '#9ad47a';
    const fronds = [[-7, 3], [-6, -2], [-2, -4], [3, -4], [7, -2], [7, 3], [-3, 4]];
    for (const [dx, dy] of fronds) {
      const n = Math.max(Math.abs(dx), Math.abs(dy)) + 1;
      for (let i = 1; i <= n; i++) {
        const t = i / n;
        const x = cx + dx * t, y = cy + dy * t + t * t * 2.2; // さきが たれる
        p.set(x, y, t < 0.5 ? leafL : leaf);
        p.set(x, y + 1, leafD);
        if (i % 2 === 0 && t < 0.9) p.set(x, y - 1, leafH);
      }
    }
    p.set(cx, cy, leafH); p.set(cx - 1, cy, leafL); p.set(cx + 1, cy, leafL);
    // ヤシの み
    p.set(cx - 1, cy + 2, '#6a4422'); p.set(cx + 1, cy + 2, '#5a3a1c'); p.set(cx, cy + 3, '#7a5228');
  },
  [T.CACTUS]: (p, v, f, m) => {
    groundBase(p, v, m, 11);
    const g = '#5a9a4e', gD = '#3a7034', gL = '#86c46c', gH = '#b4e08c';
    // かげ（右下）
    const sh = m & 1 ? GR.blade : shade(DS.base, -0.16);
    p.set(9, 15, sh); p.set(10, 15, sh); p.set(11, 15, sh);
    const col = (x0, y0, y1) => {
      p.rect(x0, y0 + 1, 3, y1 - y0, g);
      p.hline(x0 + 1, x0 + 1, y0, g);
      p.vline(x0, y0 + 1, y1, gL); p.vline(x0 + 2, y0 + 1, y1, gD);
      p.set(x0 + 1, y0, gH);
    };
    // まんなかの はしら
    col(6, 2, 14);
    p.vline(7, 4, 13, shade(g, 0.1));
    // 左の うで（ひくい）と 右の うで（たかい）
    p.rect(3, 9, 3, 2, g); p.hline(3, 5, 9, gL); p.hline(3, 5, 10, gD);
    col(3, 5, 9);
    p.rect(9, 7, 3, 2, g); p.hline(9, 11, 7, gL); p.hline(9, 11, 8, gD);
    col(10, 3, 7);
    // とげ
    for (const [x, y] of [[5, 6], [9, 11], [6, 12], [2, 7], [13, 5], [9, 4]]) p.set(x, y, '#f4f0d8');
    // 花（ときどき）
    if (v % 4 === 1) { p.set(7, 1, '#f27a9a'); p.set(6, 2, '#f8b4c8'); p.set(8, 2, '#f8b4c8'); }
  },
  [T.ADOBE]: (p, v, f, m) => {
    if (m & 1) {
      // かべの まえの かお（しっくい ぬりの 日干しれんが。ところどころ はがれて れんがが 見える）
      p.rect(0, 0, 16, 16, AD.face);
      const r = prand(v * 37 + 9);
      for (let i = 0; i < 8; i++) p.set(Math.floor(r() * 16), 3 + Math.floor(r() * 9), i % 2 ? AD.faceD : AD.faceL);
      // 上の ふち（すこし 出ている）
      p.hline(0, 15, 0, AD.faceL); p.hline(0, 15, 1, AD.faceL);
      p.hline(0, 15, 2, AD.faceD);
      // はがれた ところ（2まいに 1まい。れんがの 目地）
      if (v % 2 === 0) {
        const bx = 2 + Math.floor(r() * 7), by = 5 + Math.floor(r() * 4);
        const rows = [[1, 4], [0, 5], [2, 3]];
        rows.forEach(([o, n], j) => {
          for (let i = 0; i < n; i++) p.set(bx + o + i, by + j, (bx + o + i + j * 2) % 4 === 0 ? AD.mortar : j % 2 ? AD.brick : AD.brickL);
        });
        p.hline(bx + 1, bx + 4, by - 1, AD.faceL);
        p.hline(bx, bx + 4, by + 3, AD.faceD);
      } else {
        // ほそい ひび
        const cx = 3 + Math.floor(r() * 10);
        p.set(cx, 4, AD.faceD); p.set(cx, 5, AD.faceD); p.set(cx + 1, 6, AD.faceD);
      }
      // 下は 砂ぼこりで よごれて くらい
      for (let x = (v & 1); x < 16; x += 2) p.set(x, 11, AD.stain);
      p.hline(0, 15, 12, AD.stain);
      p.hline(0, 15, 13, AD.foot); p.hline(0, 15, 14, AD.foot);
      p.hline(0, 15, 15, shade(AD.foot, -0.3));
    } else {
      // かべの うえ
      p.rect(0, 0, 16, 16, AD.top);
      p.rect(1, 1, 14, 14, AD.topIn);
      p.hline(1, 14, 1, AD.topL); p.vline(1, 1, 14, AD.topL);
      p.set(5, 6, AD.topL); p.set(10, 11, AD.top);
    }
  },
  // ばしょ（v = x の 下2けた + y の 下2けた × 4）で 64×64 の もようの どこかが きまる → となりと つながる
  [T.SANDSTORM]: (p, v, f) => paintStorm(p, (v & 3) * 16, ((v >> 2) & 3) * 16, f, 16, 16),
  [T.WELL_HOLE]: (p, v) => {
    desertBase(p, v, 9);
    // わく（日干しれんがの まるい ふち）
    p.ellipse(8, 8.6, 7.6, 7.2, AD.mortar);
    p.ellipse(8, 8.2, 7, 6.6, AD.faceD);
    p.ellipse(7.8, 7.9, 6.6, 6.1, AD.face);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      p.set(Math.round(8 + Math.cos(a) * 6.2), Math.round(8.2 + Math.sin(a) * 5.7), AD.faceL);
    }
    // あな（下へ いくほど まっくら）
    p.ellipse(8, 8.6, 5, 4.6, '#3a2616');
    p.ellipse(8, 9.2, 4.6, 4, '#1c120a');
    p.ellipse(8, 9.8, 3.8, 3.2, '#0a0604');
    // なわばしご（北の ふちから 下へ）
    const rope = ['#d8b070', '#b08850', '#7a5a34', '#3a2a18'];
    for (let y = 3; y <= 12; y++) {
      const k = y < 6 ? 0 : y < 8 ? 1 : y < 10 ? 2 : 3;
      p.set(6, y, rope[k]); p.set(10, y, rope[k]);
      if (y % 2 === 1 && y > 3) p.hline(7, 9, y, rope[Math.min(3, k + 1)]);
    }
    // ふちの くい
    p.rect(5, 2, 2, 2, AD.beam); p.set(5, 2, AD.beamL);
    p.rect(10, 2, 2, 2, AD.beam); p.set(10, 2, AD.beamL);
  },
};

// かれた地下水路（Step 2。render/tiles-canal.js）
Object.assign(CH4_PAINTERS, CANAL_PAINTERS);

// アニメーションする タイルの コマ数（砂嵐は 16コマで 64ドット すすんで もとに もどる。水路の 水は 16コマで 32ドット ながれる）
export const CH4_FRAMES = { [T.SANDSTORM]: 16, ...CANAL_FRAMES };
export const CH4_SPEED = { [T.SANDSTORM]: 75, ...CANAL_SPEED };
// まえの かおが ある かべ（render/tiles.js の WALLS）
export const CH4_WALLS = [T.ADOBE, ...CANAL_WALLS];

// となりの ようす（render/tiles.js の prepareMap から）。t … その マスの タイル（とびらが ひらいた あとの もの）
// at(x, y) … となりの タイル（とびらは ひらいた あとの もの。マップの そとは -1）。あてはまらない ときは -1
const GRASSY = new Set([T.GRASS, T.TALLGRASS, T.FLOWERS, T.FOREST_FLOOR]);
export function ch4Mask(t, at, x, y) {
  if (t === T.DUNE) {
    const d = (dx, dy) => { const n = at(x + dx, y + dy); return n === T.DUNE || n === -1; };
    let m = 0;
    if (d(0, -1)) m |= DUNE_N;
    if (d(1, 0)) m |= DUNE_E;
    if (d(0, 1)) m |= DUNE_S;
    if (d(-1, 0)) m |= DUNE_W;
    if ((m & DUNE_N) && (m & DUNE_E) && d(1, -1)) m |= DUNE_NE;
    if ((m & DUNE_S) && (m & DUNE_E) && d(1, 1)) m |= DUNE_SE;
    if ((m & DUNE_S) && (m & DUNE_W) && d(-1, 1)) m |= DUNE_SW;
    if ((m & DUNE_N) && (m & DUNE_W) && d(-1, -1)) m |= DUNE_NW;
    return m;
  }
  if (t === T.SANDSTONE) {
    const s = (dx, dy) => { const n = at(x + dx, y + dy); return n === T.SANDSTONE || n === -1; };
    return (s(0, 1) ? 0 : 1) | (s(0, -1) ? 0 : 2) | (s(1, 0) ? 0 : 4) | (s(-1, 0) ? 0 : 8);
  }
  if (t === T.PALM || t === T.CACTUS) {
    let g = 0;
    for (const [dx, dy] of NEIGHBORS8) if (GRASSY.has(at(x + dx, y + dy))) g++;
    return g >= 3 ? 1 : 0;
  }
  // 井戸・かんばん（草の 上に かく タイル）は、まわりが 砂ばくなら 砂の 上に（2）
  if (t === T.WELL || t === T.SIGN) return onDesert(at, x, y) ? 2 : -1;
  // かれた地下水路（水路の 岸・通路の ふちの 石・水路の まわりの たいまつ や レバー）
  return canalMask(t, at, x, y);
}
const NEIGHBORS8 = [[0, -1], [1, 0], [0, 1], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]];
// まわり 8マスに 砂ばくが 3マス いじょう（第4章の 砂ばくの 中。ほかの 章の マップは かわらない）
export function onDesert(at, x, y) {
  let n = 0;
  for (const [dx, dy] of NEIGHBORS8) if (at(x + dx, y + dy) === T.DESERT) n++;
  return n >= 3;
}

