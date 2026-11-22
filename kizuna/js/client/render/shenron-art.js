// 第88回 G9班: 神龍の さいだんと 神龍（render/gacha-art.js の paintGachaSpecial から よぶ。{ p, oc } を かえす）
//   r88_shenron_altar … 小さな 石の さいだん（7つの くぼみ。竜の もよう）
//   r88_shenron       … ねがいの 時だけ 出る 大きな 緑の 竜（だいほんの 役者。からだを うねらせて 空へ のびる）
import { Painter } from './pixel.js?v=9619c3d748be';

function paintAltar(f) {
  const p = new Painter(16, 21);
  const g = f ? '#ffd860' : '#ffb830';
  p.stamp(0, 0, [
    '................',
    '................',
    '................',
    '.....GGGGGG.....',
    '....GgggggGG....',
    '...GG....GgG....',
    '..........GgG...',
    '...GGGG....GG...',
    '..GgggggGGGgG...',
    '..SSSSSSSSSSSS..',
    '..SLLLLLLLLLLS..',
    '..SsOsOsOsOssS..',
    '..SssOsOsOsssS..',
    '..SssssssssssS..',
    '..SSSSSSSSSSSS..',
    '...SssssssssS...',
    '...SssssssssS...',
    '..SSSSSSSSSSSS..',
    '.LLLLLLLLLLLLLL.',
    '.DDDDDDDDDDDDDD.',
    '................',
  ], { S: '#7a7a8a', L: '#a8a8b8', D: '#4a4a5a', s: '#9a9aaa', G: '#3a8a4a', g: '#6ad07a', O: g });
  return { p, oc: '#20202c' };
}

// 神龍（48×56。下で とぐろを まいて、上に 頭）
function paintShenron(f) {
  const W = 48, H = 56;
  const p = new Painter(W, H);
  const body = '#3aa04a', dark = '#1e6a2e', belly = '#e8d070', hi = '#7ae08a';
  // からだ（下から 上へ うねる 太い 線。ふしごとに まるを かさねる）
  const pts = [];
  for (let k = 0; k <= 120; k++) {
    const t = k / 120;
    const y = H - 6 - t * (H - 20);
    const x = W / 2 + Math.sin(t * Math.PI * 3 + (f ? 0.25 : 0)) * (14 - t * 8);
    pts.push([x, y, 5.2 - t * 1.6]);
  }
  for (const [x, y, r] of pts) p.ellipse(Math.round(x), Math.round(y), Math.round(r + 1), Math.round(r + 1), dark);
  for (const [x, y, r] of pts) p.ellipse(Math.round(x), Math.round(y), Math.round(r), Math.round(r), body);
  pts.forEach(([x, y, r], i) => {
    if (i % 6 === 0) p.set(Math.round(x - r / 2), Math.round(y), hi);
    if (i % 3 === 0) p.set(Math.round(x + r / 3), Math.round(y + 1), belly);
  });
  // 手（とちゅうに 2本）
  for (const i of [40, 70]) {
    const [x, y] = pts[i];
    p.rect(Math.round(x) - 9, Math.round(y), 4, 2, body);
    p.rect(Math.round(x) + 6, Math.round(y), 4, 2, body);
    p.set(Math.round(x) - 10, Math.round(y) + 2, '#ffffff');
    p.set(Math.round(x) + 9, Math.round(y) + 2, '#ffffff');
  }
  // 頭（いちばん 上）
  const [hx, hy] = pts[pts.length - 1];
  const cx = Math.round(hx), cy = Math.round(hy) - 3;
  p.ellipse(cx, cy, 7, 5, dark);
  p.ellipse(cx, cy, 6, 4, body);
  p.rect(cx - 4, cy + 3, 9, 3, body); // 口もと
  p.hline(cx - 4, cx + 4, cy + 5, belly);
  // 目（赤く 光る）
  p.set(cx - 3, cy - 1, '#ff3a2a');
  p.set(cx + 3, cy - 1, '#ff3a2a');
  p.set(cx - 3, cy - 2, f ? '#ffd0c0' : '#ff6a5a');
  p.set(cx + 3, cy - 2, f ? '#ffd0c0' : '#ff6a5a');
  // つの
  for (let k = 0; k < 5; k++) {
    p.set(cx - 4 - Math.floor(k / 2), cy - 4 - k, '#f0e0b0');
    p.set(cx + 4 + Math.floor(k / 2), cy - 4 - k, '#f0e0b0');
  }
  // ひげ（長く たれる）
  for (let k = 0; k < 9; k++) {
    p.set(cx - 6 - k, cy + 3 + Math.round(Math.sin(k / 2 + (f ? 1 : 0)) * 1.5), '#e8e0c0');
    p.set(cx + 6 + k, cy + 3 + Math.round(Math.sin(k / 2 + (f ? 1 : 0)) * 1.5), '#e8e0c0');
  }
  return { p, oc: '#0e2a14' };
}

export function paintShenronSpecial(kind, dir, f) {
  switch (kind) {
    case 'r88_shenron_altar': return paintAltar(f);
    case 'r88_shenron': return paintShenron(f);
    default: return null;
  }
}
