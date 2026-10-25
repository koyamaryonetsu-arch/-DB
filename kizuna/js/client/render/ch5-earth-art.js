// 第5章 Step 7 の とくべつな え（render/ch5-art.js の paintCh5Special から paintEarthSpecial）
// ・shadow_castle … 雲の 海の まん中に うかぶ 影の城（黒い 石の 城。とがった 塔・むらさきに 光る 窓・下は 雲と 黒い 風に とける）
import { Painter } from './pixel.js?v=855c00e900d9';
// 第5章 Step 8: 氷の像（render/ch5-castle-art.js）
import { paintCastleSpecial } from './ch5-castle-art.js?v=855c00e900d9';

const K = { dd: '#0e0a16', d: '#1a1426', b: '#2a2238', m: '#3a3050', l: '#544a70' };
const WIN = ['#b07ae8', '#e0b0ff'];
const CLOUD = '#d8c8d8', CLOUD_D = '#9a8aa8', WIND = '#4a2a5a';

// 影の城（64×92）。f … 2コマ（窓の 光と 黒い 風が ゆれる）
function paintShadowCastle(f) {
  const W = 64, H = 92, p = new Painter(W, H);
  // 塔（左・右・まん中の 大きな 塔）
  const tower = (x, y, w, h, tip) => {
    p.rect(x, y, w, h, K.b);
    p.vline(x, y, y + h - 1, K.l); p.vline(x + 1, y, y + h - 1, K.m); p.vline(x + w - 1, y, y + h - 1, K.dd);
    // とがった やね
    for (let i = 0; i < tip; i++) {
      const half = Math.max(0, Math.round((w / 2) * (1 - i / tip)));
      p.hline(x + Math.floor(w / 2) - half, x + Math.ceil(w / 2) - 1 + half, y - 1 - i, i % 4 === 3 ? K.m : K.d);
    }
    p.set(x + Math.floor(w / 2), y - tip - 1, K.l);
  };
  tower(6, 34, 10, 40, 12);
  tower(48, 34, 10, 40, 12);
  tower(24, 16, 16, 58, 16);
  tower(16, 42, 8, 30, 8);
  tower(40, 42, 8, 30, 8);
  // かべ（下の 大きな 土台）
  p.rect(4, 60, 56, 18, K.d);
  p.hline(4, 59, 60, K.m);
  for (let x = 4; x < 60; x += 4) p.rect(x, 57, 2, 3, K.d);
  for (let y = 63; y < 78; y += 4) p.hline(5, 58, y, K.dd);
  // 窓（むらさきに 光る）
  const w = WIN[f % 2], w2 = WIN[(f + 1) % 2];
  for (const [x, y] of [[10, 44], [10, 54], [52, 44], [52, 54], [30, 26], [32, 26], [31, 38], [19, 50], [43, 50]]) { p.rect(x, y, 2, 3, K.dd); p.set(x, y + 1, w); p.set(x + 1, y + 1, w2); }
  // 大きな もんの 形（まだ とざされている）
  p.rect(28, 64, 8, 14, K.dd); p.hline(29, 34, 63, K.b);
  p.set(31, 70, '#6a3a8a'); p.set(32, 70, '#6a3a8a');
  // 下は 雲と 黒い 風に とける
  for (const [x, wdt, d] of [[-4, 24, 0], [14, 30, 2], [36, 30, 1], [50, 18, 3]]) {
    p.ellipse(x + wdt / 2, 80 + d, wdt / 2, 5, CLOUD_D);
    p.ellipse(x + wdt / 2, 79 + d, wdt / 2 - 1, 4, CLOUD);
  }
  for (let i = 0; i < 6; i++) {
    const y = 74 + i * 3 + (f % 2);
    p.hline(2 + ((i * 7) % 11), 20 + ((i * 7) % 11), y, WIND);
    p.hline(40 - ((i * 5) % 9), 60 - ((i * 5) % 9), y + 1, WIND);
  }
  // 黒い 風（塔の まわりを 回る）
  for (let i = 0; i < 5; i++) p.set(4 + i * 13 + (f % 2) * 2, 20 + ((i * 11) % 30), '#7a4a9a');
  return { p, oc: '#08060c' };
}

// render/ch5-art.js の paintCh5Special から（ない ときは null）
export function paintEarthSpecial(kind, dir, f) {
  if (kind === 'shadow_castle') return paintShadowCastle(f);
  return paintCastleSpecial(kind, dir, f);
}
