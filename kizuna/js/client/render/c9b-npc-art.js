// 第3部 第1章 第2幕「鉱山の底の先」の 人の え と とくべつな え（render/c9a-npc-art.js が まぜる）
// ※ ネタバレ注意（docs/plan-part3.md の 10）
// 人（C9B_NPC_LOOKS）: くぼ地の 武具屋 ガンツ
// とくべつな え（paintC9bSpecial）: 地下の 民（小さな 体・大きな 目・頭に 光る こけの ランタン。村長・村の 人 4色・子ども）・
//   もぐら兵（大王の 手下。かぶとと やり。にくめない）・デデドン大王（大きな もぐらの 王さま。赤い マント・王かん・木の 大づち。32×32）
// もとの 作品の 絵は 使わない（大王は もぐら）
import { Painter } from './pixel.js?v=6a7817ffa6c0';

export const C9B_NPC_LOOKS = {
  c9b_armorer: { hair: 2, hairStyle: 'short', skin: 2, outfit: 'vest', cloth: '#7a4a2a', beard: true },
};

// 地下の 民（16×18）
const FOLK = {
  c9b_folk1: { body: '#8a7aa8', dark: '#5a4a78', cap: '#e8d0b8' },
  c9b_folk2: { body: '#c86a7a', dark: '#984a5a', cap: '#f0d0b8' },
  c9b_folk3: { body: '#5a9a6a', dark: '#3a6a4a', cap: '#e0d4b0' },
  c9b_folk4: { body: '#c8904a', dark: '#986a2a', cap: '#f0dcc0' },
  c9b_chief: { body: '#5a5a9a', dark: '#3a3a6a', cap: '#d8c8b0', beard: true },
  c9b_kid: { body: '#5a8ad8', dark: '#3a5aa8', cap: '#f0d8c0', small: true },
};
function paintFolk(kind, dir, f) {
  const C = FOLK[kind];
  const p = new Painter(16, 18);
  const k = f % 2;
  const oy = C.small ? 2 : 0;
  p.ellipse(8, 16.5, 4.5, 1.1, '#0a0810');
  // 体（まるい）
  p.ellipse(8, 12 + oy / 2, C.small ? 3.5 : 4.5, C.small ? 3.5 : 4.2, C.body);
  p.hline(5, 11, 15, C.dark);
  // 足
  p.set(6, 16 - k, C.dark); p.set(10, 15 + k, C.dark);
  // 頭（大きな 目）
  p.ellipse(8, 7 + oy, 4.2, 3.8, C.cap);
  if (dir !== 'up') {
    const ex = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
    // 大きな 黒目（光の つぶ）・ほっぺ
    p.ellipse(6 + ex, 7.5 + oy, 1.3, 1.7, '#2a1a30'); p.ellipse(10 + ex, 7.5 + oy, 1.3, 1.7, '#2a1a30');
    p.set(6 + ex, 7 + oy, '#ffffff'); p.set(10 + ex, 7 + oy, '#ffffff');
    p.set(4 + ex, 9 + oy, '#f0a0a0'); p.set(12 + ex, 9 + oy, '#f0a0a0');
    if (C.beard) { p.hline(6, 10, 10 + oy, '#f4f4f8'); p.set(8, 11 + oy, '#f4f4f8'); }
  }
  // 頭の ランタン（光る こけ）
  p.vline(8, 1 + oy, 3 + oy, '#5a3a20');
  p.ellipse(8, 1.5 + oy, 1.8, 1.5, k ? '#9af08a' : '#7ad86a'); p.set(8, 1 + oy, '#f0ffe0');
  return { p, oc: '#1a1424' };
}

// もぐら兵（16×18。かぶと・やりか なべの ふた）
function paintMole(dir, f) {
  const p = new Painter(16, 18);
  const k = f % 2;
  p.ellipse(8, 16.5, 4.5, 1.1, '#0a0810');
  p.ellipse(8, 11, 5, 4.5, '#7a5a42'); p.ellipse(8, 12, 3, 2.5, '#a8886a');
  p.set(5, 16, '#4a3020'); p.set(11, 16, '#4a3020');
  p.ellipse(8, 6, 4, 3.5, '#7a5a42');
  if (dir !== 'up') {
    p.ellipse(8, 8, 1.6, 1.1, '#f0a0a8'); // はな
    p.set(6, 6, '#1a1010'); p.set(10, 6, '#1a1010');
  }
  // かぶと
  p.hline(4, 12, 3, '#a8a8b8'); p.ellipse(8, 3, 4, 1.8, '#c8c8d8'); p.set(8, 1, '#e8c040');
  // やり
  const sx = dir === 'left' ? 2 : 13;
  p.vline(sx, 2 - k, 15, '#8a6a3a'); p.set(sx, 1 - k, '#d8d8e8'); p.set(sx, 0, '#f4f4ff');
  return { p, oc: '#1a1008' };
}

// デデドン大王（32×32。大きな もぐらの 王さま・赤い マント・金の 王かん・木の 大づち）
function paintKing(dir, f) {
  const p = new Painter(32, 32);
  const k = f % 2;
  p.ellipse(16, 30, 11, 2, '#0a0810');
  // マント
  for (let y = 12; y < 29; y++) { const w = 8 + Math.floor((y - 12) / 3); p.hline(16 - w, 16 + w, y, '#c8302a'); }
  p.hline(7, 25, 28, '#8a1a18'); p.vline(16, 14, 28, '#a8241e');
  // 体（大きな まるい おなか）
  p.ellipse(16, 20, 9, 8, '#8a6a4e'); p.ellipse(16, 21, 6, 5.5, '#c8a888');
  // 足
  p.ellipse(11, 29, 3, 1.5, '#5a3e2a'); p.ellipse(21, 29, 3, 1.5, '#5a3e2a');
  // 頭
  p.ellipse(16, 10, 7, 6, '#8a6a4e');
  if (dir !== 'up') {
    p.ellipse(16, 13, 3, 2, '#c8a888');
    p.ellipse(16, 12, 1.8, 1.3, '#f08090'); // はな
    p.hline(12, 14, 9, '#1a1010'); p.hline(18, 20, 9, '#1a1010'); // ほそい 目（いばって いる）
    p.set(13, 8, '#1a1010'); p.set(19, 8, '#1a1010');
    p.hline(14, 18, 15, '#5a2a20');
  }
  // 王かん
  p.rect(11, 3, 11, 3, '#f0c040'); p.set(11, 2, '#f0c040'); p.set(16, 1, '#f0c040'); p.set(21, 2, '#f0c040');
  p.set(16, 4, '#e83a3a'); p.set(13, 4, '#3a8ae8'); p.set(19, 4, '#3a8ae8');
  // 手と 木の 大づち（コマで 少し ゆれる）
  p.ellipse(7, 19, 2.2, 2, '#8a6a4e'); p.ellipse(25, 19, 2.2, 2, '#8a6a4e');
  const hx = 27, hy = 6 + k;
  p.vline(hx, hy + 3, 22, '#8a5a2a');
  p.rect(hx - 4, hy, 8, 5, '#b8884a'); p.hline(hx - 4, hx + 3, hy, '#d8a868'); p.hline(hx - 4, hx + 3, hy + 4, '#7a5a2a');
  return { p, oc: '#1a0c08' };
}

export function paintC9bSpecial(kind, dir, f) {
  if (FOLK[kind]) return paintFolk(kind, dir, f);
  switch (kind) {
    case 'c9b_mole': return paintMole(dir, f);
    case 'c9b_king_npc': return paintKing(dir, f);
    default: return null;
  }
}
export const C9B_SPECIALS = [...Object.keys(FOLK), 'c9b_mole', 'c9b_king_npc'];
