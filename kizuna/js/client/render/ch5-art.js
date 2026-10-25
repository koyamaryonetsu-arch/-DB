// 第5章 Step 1・2 の とくべつな え（render/chars.js の paintSpecial から paintCh5Special。星の羽の 竜は render/ch5-dragon.js）
// ・star_tower … ホシフル村の 北の 山の 星の塔（雲を つきぬけて、空の 上まで のびる。上の ほうは 星空に とける）
// ・fest_lantern … 星祭りの 星の ちょうちん（2コマで ゆれる）・fest_star … 星祭りの 星の かざりの 柱（リボン）
import { Painter } from './pixel.js?v=b4e31baa770b';
// 第5章 Step 7: 影の城（render/ch5-earth-art.js）
import { paintEarthSpecial } from './ch5-earth-art.js?v=b4e31baa770b';

const STONE = '#8a8ea8', STONE_L = '#b0b4c8', STONE_D = '#5e6280', STONE_DD = '#3e4260', LINE = '#4a4e6a';
const SKY_D = '#1a2050', STAR = '#ffffff', STAR_Y = '#fff4b0', GOLD = '#e8c050', CLOUD = '#e8ecf8', CLOUD_D = '#b8c0d8';

// 星の塔（48×150。下は 灰色の 石、上へ 行くほど あい色に なり、てっぺんは 星空と 光の まくに とける）
function paintStarTower(f) {
  const W = 48, H = 150, p = new Painter(W, H);
  const mixC = (a, b, t) => {
    const h = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
    const [r1, g1, b1] = h(a), [r2, g2, b2] = h(b);
    return `#${[r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
  };
  // 塔の 体（下が ふとく、上が ほそい）
  for (let y = 8; y < H; y++) {
    const t = (y - 8) / (H - 8); // 0 … てっぺん、1 … 下
    const half = Math.round(9 + t * 9);
    const x0 = 24 - half, x1 = 23 + half;
    const up = 1 - t; // 上ほど 星空の 色
    const base = mixC(STONE, '#4a4e9a', Math.min(1, up * 1.3));
    p.hline(x0, x1, y, base);
    p.set(x0, y, mixC(STONE_L, '#8a8ee8', up)); p.set(x0 + 1, y, mixC(STONE_L, '#7a7ed8', up));
    p.set(x1, y, STONE_DD); p.set(x1 - 1, y, mixC(STONE_D, '#2a2e6a', up));
    // 石の めじ
    if (y % 6 === 0) p.hline(x0 + 1, x1 - 1, y, mixC(LINE, '#2a2e6a', up));
    else if (y % 3 === 0) for (let x = x0 + ((y / 3) % 2 ? 3 : 6); x < x1; x += 7) p.set(x, y, mixC(LINE, '#2a2e6a', up));
  }
  // 窓（8階ぶん。上の 窓ほど 星の 光）
  for (let i = 0; i < 8; i++) {
    const y = H - 22 - i * 15;
    const lit = i >= 4;
    p.rect(22, y, 4, 5, '#1a1a2a'); p.rect(23, y + 1, 2, 3, lit ? '#a8c8ff' : '#e8b860');
    if (lit && (f + i) % 2) p.set(23, y + 1, STAR);
  }
  // 入口の とびらは フィールドの タイル（塔の 土台の 下）
  // 雲の おび（まん中より 上）
  const cy = 52;
  for (const [x, w, d] of [[-2, 20, 0], [12, 26, 2], [30, 20, 1], [4, 16, 4], [26, 22, 5]]) {
    p.ellipse(x + w / 2, cy + d, w / 2, 4, CLOUD_D);
    p.ellipse(x + w / 2, cy + d - 1, w / 2 - 1, 3, CLOUD);
  }
  // てっぺん（星空・光の まく・紋章の 星）
  p.ellipse(24, 6, 22, 7, SKY_D);
  p.hline(4, 43, 3, '#8ab0f0'); p.hline(8, 39, 2, '#c8e0ff');
  for (const [x, y] of [[6, 7], [40, 5], [14, 1], [33, 9], [44, 9], [2, 4]]) p.set(x, y, (x + f) % 2 ? STAR : STAR_Y);
  p.rect(20, 8, 8, 4, '#3a3e8a'); p.hline(19, 28, 8, '#8a8ee8');
  for (let i = -3; i <= 3; i++) { p.set(24 + i, 4, GOLD); p.set(24, 4 + i, GOLD); }
  p.set(24, 4, STAR);
  return { p, oc: '#141830' };
}

// 星祭りの 星の ちょうちん（ほそい 柱の 上に、星の 形の ちょうちん。中で 火が ゆれる）
function paintFestLantern(f) {
  const p = new Painter(16, 26);
  p.rect(7, 10, 2, 16, '#6a4a2a'); p.vline(7, 10, 25, '#8a6a3a');
  p.rect(4, 24, 8, 2, '#5a3e22');
  p.hline(3, 12, 9, '#c83a3a');
  // 星の ちょうちん
  const c = f % 2 ? '#ffd84a' : '#ffc83a', cL = '#fff4b0';
  for (let i = -4; i <= 4; i++) { p.set(8 + i, 4, c); p.set(8, 4 + i, c); }
  p.rect(6, 2, 5, 5, c);
  p.rect(7, 3, 3, 3, cL);
  p.set(8, 4, '#ffffff');
  p.set(3 + (f % 2), 1, '#fff4b0'); p.set(13 - (f % 2), 2, '#fff4b0');
  return { p, oc: '#3a2410' };
}
// 星祭りの 星の かざりの 柱（大きな 星と 3色の リボン: 風の 緑・炎の 赤・水の 青）
function paintFestStar(f) {
  const p = new Painter(16, 28);
  p.rect(7, 8, 2, 20, '#7a5a3a'); p.vline(7, 8, 27, '#9a7a4a');
  p.rect(4, 26, 8, 2, '#5a3e22');
  const sway = f % 2;
  for (const [i, c] of [[0, '#4ac86a'], [1, '#e85a4a'], [2, '#4a8ae8']]) {
    p.vline(5 + i * 3 + (i === 1 ? 0 : sway), 10 + i, 18 + i * 2, c);
  }
  const g = '#ffd84a';
  for (let i = -5; i <= 5; i++) { p.set(8 + i, 4, g); p.set(8, 4 + i, g); }
  p.rect(6, 2, 5, 5, g); p.rect(7, 3, 3, 3, '#fff4b0'); p.set(8, 4, '#ffffff');
  return { p, oc: '#3a2410' };
}

// render/chars.js の paintSpecial から（ない ときは null）。{ p: Painter, oc: ふちどりの 色 }
export function paintCh5Special(kind, dir, f) {
  switch (kind) {
    case 'star_tower': return paintStarTower(f);
    case 'fest_lantern': return paintFestLantern(f);
    case 'fest_star': return paintFestStar(f);
    default: return paintEarthSpecial(kind, dir, f);
  }
}
