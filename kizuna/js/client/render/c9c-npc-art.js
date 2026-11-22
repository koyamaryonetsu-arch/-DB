// 第3部 第1章 第3幕「さかさのピラミッド」の とくべつな え（render/c9a-npc-art.js が まぜる）
// ※ ネタバレ注意（docs/plan-part3.md の 11）
// ・algol … 少年 アルゴル（銀の かみ・こい 紺の マント・暗い 三日月に 乗る。16×20）
// ・c9c_nazokake … なぞの番人 ナゾカケ（天じょうから さかさに すわる 石の けもの。ライオンの 体・人の 顔。上下 さかさに かく）
// ・c9c_orb … 黄色い 光の 玉（星の音・ミ）
// ・c9c_post … いかだ乗り場の 立てふだ（いかだの 絵）
// ・c9c_ped0〜6 … くぼ地の 7つの 音の 台（赤・だいだい・黄・緑・青・あい・むらさき）/ c9c_ped_on … 星の音を おいた 黄の 台（光る）
// もとの 作品の 絵は 使わない
import { Painter } from './pixel.js?v=98a59fb17475';

// 少年（暗い 三日月に 乗って うかぶ）
function paintAlgol(dir, f) {
  const p = new Painter(16, 22);
  const k = f % 2;
  const oy = k; // ふわふわ
  // 三日月（暗い 紫。ふちが 銀）
  for (let x = 1; x <= 14; x++) {
    const t = (x - 7.5) / 6.5;
    const y = Math.round(18 + t * t * 2.4) + oy;
    p.set(x, y, '#2a1a4a'); p.set(x, y + 1, '#1a0e30');
    if (x % 3 === 0) p.set(x, y - 1, '#b8b8d8');
  }
  p.set(0, 16 + oy, '#b8b8d8'); p.set(15, 16 + oy, '#b8b8d8');
  // マント
  for (let y = 9; y < 18; y++) { const w = 3 + Math.floor((y - 9) / 3); p.hline(8 - w, 8 + w, y + oy, '#1a1a3a'); }
  p.vline(8, 10 + oy, 17 + oy, '#2a2a5a');
  p.hline(5, 11, 9 + oy, '#4a3a7a');
  // 顔と かみ（銀）
  p.ellipse(8, 6 + oy, 3.4, 3.4, '#f0d8c8');
  if (dir === 'up') p.ellipse(8, 5 + oy, 3.8, 3.6, '#d8d8ec');
  else {
    p.hline(4, 12, 3 + oy, '#d8d8ec'); p.hline(5, 11, 2 + oy, '#e8e8f8'); p.set(4, 4 + oy, '#d8d8ec'); p.set(12, 5 + oy, '#d8d8ec'); p.set(11, 4 + oy, '#d8d8ec');
    const ex = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
    p.set(7 + ex, 6 + oy, '#6a3aa8'); p.set(9 + ex, 6 + oy, '#6a3aa8');
  }
  // 手の 先の かすかな 光
  if (k) p.set(13, 12, '#c8a8ff');
  return { p, oc: '#08040e' };
}

// ナゾカケ（天じょうに さかさに すわる 石の けもの。足が 上・頭が 下）
function paintNazokake(dir, f) {
  const p = new Painter(16, 20);
  const k = f % 2;
  const S = { d: '#6a5a3a', b: '#a08a5a', l: '#c8b07a', hl: '#e8d4a0' };
  // 天じょうに ついた 足（上）
  p.hline(2, 13, 0, S.d); p.rect(3, 1, 3, 2, S.b); p.rect(10, 1, 3, 2, S.b);
  // 体（さかさ）
  p.ellipse(8, 6, 6, 3.5, S.b); p.hline(3, 12, 4, S.l);
  // しっぽ（上へ）
  p.vline(14, 1, 5, S.d); p.set(15, 1, S.d);
  // たてがみと 顔（下）
  p.ellipse(8, 12, 5, 4.5, S.d);
  p.ellipse(8, 12.5, 3.4, 3.4, S.l);
  // さかさの 顔（目が 下・口が 上）
  p.hline(7, 9, 11, '#4a3a20');
  p.set(6, 14, '#1a1008'); p.set(10, 14, '#1a1008');
  if (k) { p.set(6, 15, '#ffe080'); p.set(10, 15, '#ffe080'); }
  // 石の すじ
  p.set(5, 6, S.hl); p.set(11, 7, S.d); p.set(8, 17, S.d);
  return { p, oc: '#2a1e0e' };
}

// 黄色い 光の 玉
function paintOrb(f) {
  const p = new Painter(16, 18);
  const k = f % 2;
  const y = 7 - k;
  p.ellipse(8, 16, 4, 1, '#3a2a08');
  p.ellipse(8, y, 5, 5, '#f0c020'); p.ellipse(8, y, 3.6, 3.6, '#ffe060'); p.ellipse(7, y - 1, 1.8, 1.8, '#fff8d0');
  p.set(8, y - 7, '#fff4a0'); p.set(1, y, '#fff4a0'); p.set(14, y + 1, '#fff4a0'); p.set(8, y + 7, '#ffe060');
  if (k) { p.set(2, y - 4, '#ffffff'); p.set(13, y - 3, '#ffffff'); }
  return { p, oc: '#5a4208' };
}

// いかだ乗り場の 立てふだ
function paintPost() {
  const p = new Painter(16, 18);
  p.ellipse(8, 17, 3, 0.8, '#0a0810');
  p.vline(8, 7, 17, '#5a3a20'); p.vline(9, 7, 17, '#3a2410');
  p.rect(2, 1, 12, 7, '#8a6a3a'); p.rect(3, 2, 10, 5, '#c8a868');
  // いかだの 絵
  p.hline(4, 11, 5, '#6a4426'); p.hline(4, 11, 6, '#3a2414');
  p.vline(7, 2, 4, '#3a2414'); p.hline(8, 10, 3, '#f4f4f8');
  return { p, oc: '#1a1008' };
}

// 音の 台（7色）
const PED = ['#e84a4a', '#f08a3a', '#f0d040', '#5ac85a', '#4a8ae8', '#4a4ab8', '#a85ad8'];
function paintPed(i, on, f) {
  const p = new Painter(16, 18);
  const c = PED[i];
  p.ellipse(8, 16.5, 5, 1.2, '#0a0810');
  p.rect(4, 9, 8, 7, '#8a8a9a'); p.hline(4, 11, 9, '#b8b8c8'); p.vline(11, 10, 15, '#5a5a6a');
  p.rect(3, 7, 10, 2, '#a8a8b8');
  // 色の 石
  p.ellipse(8, 7, 3, 1.4, c);
  if (on) {
    const k = f % 2;
    p.ellipse(8, 4 - k, 3, 3, '#ffe060'); p.ellipse(8, 4 - k, 1.6, 1.6, '#fff8d0');
    p.set(8, 0, '#fff4a0'); p.set(3, 3, '#fff4a0'); p.set(13, 4, '#fff4a0');
  }
  return { p, oc: '#1a1a24' };
}

export function paintC9cSpecial(kind, dir, f) {
  if (/^c9c_ped\d$/.test(kind)) return paintPed(Number(kind.slice(7)), false, f);
  switch (kind) {
    case 'algol': return paintAlgol(dir, f);
    case 'c9c_nazokake': return paintNazokake(dir, f);
    case 'c9c_orb': return paintOrb(f);
    case 'c9c_post': return paintPost();
    case 'c9c_ped_on': return paintPed(2, true, f);
    default: return null;
  }
}
export const C9C_SPECIALS = ['algol', 'c9c_nazokake', 'c9c_orb', 'c9c_post', 'c9c_ped_on', ...PED.map((_, i) => `c9c_ped${i}`)];

// いかだ（地下の川で 主人公が 乗る。client/c9c-view.js）
export function paintRaft(f = 0) {
  const p = new Painter(26, 12);
  const k = f % 2;
  // 水の わ
  p.hline(0, 25, 10 + k, '#4a8ac8'); p.hline(2, 23, 11 - k, '#2a5a8a');
  // 丸太 4本
  for (let i = 0; i < 4; i++) {
    const y = 3 + i * 2;
    p.hline(1, 24, y, '#8a5a2a'); p.hline(1, 24, y + 1, '#5a3a1a');
    p.set(1, y, '#c89a5a'); p.set(24, y, '#c89a5a');
  }
  // なわ
  p.vline(5, 3, 10, '#d8c08a'); p.vline(20, 3, 10, '#d8c08a');
  return p;
}
