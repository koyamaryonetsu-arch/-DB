// 第3部 第1章 第4幕「星のはかば」の とくべつな え（render/c9a-npc-art.js が まぜる）
// ※ ネタバレ注意（docs/plan-part3-c9d.md の 12）
// ・c9d_mu … あそびたい魔人（丸くて うす紫・ねむそうな 目・星の ついた ナイトキャップ。フィールドの 絵。戦いの 絵は B班）
// ・c9d_mu_sit・c9d_mumu_sit … 勝った あと すわりこむ 2人（ムウムウは 少し 小さく、戦いの 絵〈render/c9d-art.js の MM〉と 同じ ミント色・
//   こい みどり青の ぼうしに 三日月。第94回 D班で うす紫から なおした）
// ・c9d_candy … おかしに された 星（場面の 役者）
// もとの 作品の 絵は 使わない
import { Painter } from './pixel.js?v=27b736e61284';

const MU = { d: '#6a4a9a', b: '#a888d8', l: '#c8b0f0', hl: '#eee0ff', cap: '#4a5ac8', capD: '#3a4aa8' };
// ムウムウ: 戦いの 絵（render/c9d-art.js の MM）の 体 #b4ecd8・#78c8ac・#e4fff4・#4a9a80 と ぼうし #2a9a8a・#1a6a60 に 合わせる
const MUMU = { d: '#4a9a80', b: '#78c8ac', l: '#b4ecd8', hl: '#e4fff4', cap: '#2a9a8a', capD: '#1a6a60', moon: true };

function paintMu(dir, f, sit, C, small) {
  const p = new Painter(16, 18);
  const k = f % 2;
  const oy = sit ? 2 : k; // ふわふわ
  const rx = small ? 5.2 : 6.2, ry = small ? 4.8 : 5.6;
  // 丸い 体
  p.ellipse(8, 11 + oy, rx, ry, C.b);
  p.ellipse(7, 9 + oy, rx - 2, ry - 2.4, C.l);
  p.set(5, 8 + oy, C.hl);
  // ナイトキャップ（青い ぼうし・先に 星）
  p.ellipse(8, 6 + oy, 4.5, 1.6, C.capD);
  for (let y = 0; y < 5; y++) p.hline(6 + Math.floor(y / 2), 10, 1 + y + oy, C.cap);
  // さきの しるし（ムウ … 星・ムウムウ … 三日月。戦いの 絵と 同じ）
  if (C.moon) { p.set(12, 0 + oy, '#fff4a0'); p.set(11, 1 + oy, '#fff4a0'); p.set(11, 2 + oy, '#e0c050'); p.set(12, 3 + oy, '#e0c050'); }
  else { p.set(12, 1 + oy, '#fff4a0'); p.set(13, 1 + oy, '#ffe060'); p.set(12, 0 + oy, '#ffe060'); p.set(12, 2 + oy, '#ffe060'); p.set(11, 1 + oy, '#ffe060'); }
  // ねむそうな 目
  if (dir !== 'up') {
    const ex = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
    p.hline(5 + ex, 6 + ex, 10 + oy, '#2a1a4a'); p.hline(9 + ex, 10 + ex, 10 + oy, '#2a1a4a');
    p.set(7 + ex, 13 + oy, '#8a3a6a'); p.set(8 + ex, 13 + oy, '#8a3a6a');
    p.set(4 + ex, 12 + oy, '#f0a0c8'); p.set(11 + ex, 12 + oy, '#f0a0c8');
  }
  // 手と 足
  if (sit) { p.ellipse(4, 16, 2, 1, C.d); p.ellipse(12, 16, 2, 1, C.d); }
  else { p.set(2, 11 + oy + k, C.d); p.set(14, 11 + oy - k, C.d); p.ellipse(6, 16, 1.6, 0.8, C.d); p.ellipse(10, 16, 1.6, 0.8, C.d); }
  return { p, oc: '#1a0e2a' };
}
function paintCandy(f) {
  const p = new Painter(10, 10);
  const k = f % 2;
  // つつみ紙の おかし（まん中に 星）
  p.ellipse(5, 5, 3, 2.4, '#f0a0c8'); p.set(1, 4, '#f8c8e0'); p.set(1, 6, '#f8c8e0'); p.set(9, 4, '#f8c8e0'); p.set(9, 6, '#f8c8e0');
  p.set(0, 5, '#f0a0c8'); p.set(9, 5, '#f0a0c8');
  p.set(5, 5, '#fff4a0'); p.set(4, 5, '#ffe060'); p.set(6, 5, '#ffe060'); p.set(5, 4, '#ffe060');
  if (k) p.set(7, 2, '#ffffff');
  return { p, oc: '#3a1a2a' };
}

export function paintC9dSpecial(kind, dir, f) {
  switch (kind) {
    case 'c9d_mu': return paintMu(dir, f, false, MU, false);
    case 'c9d_mu_sit': return paintMu(dir, f, true, MU, false);
    case 'c9d_mumu_sit': return paintMu(dir, f, true, MUMU, true);
    case 'c9d_candy': return paintCandy(f);
    default: return null;
  }
}
export const C9D_SPECIALS = ['c9d_mu', 'c9d_mu_sit', 'c9d_mumu_sit', 'c9d_candy'];
