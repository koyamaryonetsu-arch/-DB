// 第3部 第3章 第3幕「はかりの回ろうと、ふたつの光」の とくべつな え（render/c9a-npc-art.js が まぜる）
// ※ ネタバレ注意（docs/plan-part3-c11c.md の 19）
// ・c11c_mecha … 3人組の メカ 3号（場面の 絵。頭・うで・足の ある、ずんぐりした メカ。戦いの 絵は B班）
// ・c11c_ace … 近衛の 隊長（場面の 絵。カードの よろいの、きちんと した 隊長。マークは 月・星・ほうき星・太陽）
// ・c11c_soldier … トランプの 兵隊（場面の 絵。カードの 体に 手足）
// ・c11c_cards … ちらばった カード（隊長が カードに もどった あと）
//   もとの お話の しるし（ハートなど）は 使わない
import { Painter } from './pixel.js';

const STEEL = { d: '#4a5068', b: '#7a84a8', l: '#b0b8d8', hl: '#e8ecff' };
// カードの マーク（月・星・ほうき星・太陽）
function mark(p, x, y, kind, c) {
  if (kind === 'moon') { p.set(x, y - 1, c); p.set(x - 1, y, c); p.set(x - 1, y + 1, c); p.set(x, y + 2, c); }
  else if (kind === 'star') { p.set(x, y - 1, c); p.hline(x - 1, x + 1, y, c); p.set(x - 1, y + 1, c); p.set(x + 1, y + 1, c); }
  else if (kind === 'comet') { p.set(x + 1, y - 1, c); p.set(x, y, c); p.set(x - 1, y + 1, c); p.set(x + 1, y, '#ffffff'); }
  else { p.set(x, y, c); p.set(x - 1, y, c); p.set(x + 1, y, c); p.set(x, y - 1, c); p.set(x, y + 1, c); }
}
// メカ 3号（30×30。まるい 頭・大きな うで・2本の 足。3人組の しるしの ほし）
function paintMecha(dir, f) {
  const p = new Painter(30, 30);
  const k = f % 2;
  p.ellipse(15, 29, 11, 1, '#1a1a2a');
  // 足
  for (const x of [9, 19]) { p.rect(x, 21 + (x === 9 ? k : 1 - k), 3, 7, STEEL.d); p.rect(x - 1, 27, 5, 2, '#2a2a3a'); }
  // 体
  p.rect(7, 11, 16, 11, STEEL.b); p.rect(8, 12, 14, 9, STEEL.l); p.hline(7, 22, 21, STEEL.d);
  p.rect(13, 14, 4, 4, '#e83a8a'); p.set(15, 15, '#ffffff'); // 3人組の しるし
  // うで
  p.rect(2, 12 + k, 5, 9, STEEL.b); p.rect(1, 20 + k, 7, 3, STEEL.d);
  p.rect(23, 13 - k, 5, 9, STEEL.b); p.rect(22, 21 - k, 7, 3, STEEL.d);
  // 頭（まるい まど と アンテナ）
  p.ellipse(15, 7, 6, 4, STEEL.l); p.ellipse(15, 7, 4, 2.5, '#5ac8ff'); p.set(14, 6, '#ffffff');
  p.vline(15, 1, 3, STEEL.d); p.set(15, 0, k ? '#ff5a5a' : '#ffe070');
  return { p, oc: '#1a1a2a' };
}
// 近衛の 隊長（20×28。カードの よろい・ぼうし・つえ）
function paintAce(dir, f) {
  const p = new Painter(20, 28);
  const k = f % 2;
  p.ellipse(10, 27, 6, 1, '#1a1a2a');
  // 足
  p.rect(7, 22, 2, 5, '#2a2a4a'); p.rect(11, 22, 2, 5, '#2a2a4a');
  // カードの よろい（白い 札が 2まい かさなる。ふちは 金）
  p.rect(4, 9, 12, 14, '#fffaf0'); p.rect(4, 9, 12, 1, '#e8c040'); p.rect(4, 22, 12, 1, '#e8c040'); p.vline(4, 9, 22, '#e8c040'); p.vline(15, 9, 22, '#e8c040');
  mark(p, 7, 12, 'moon', '#3a4aa8'); mark(p, 12, 12, 'star', '#d83a3a'); mark(p, 7, 18, 'comet', '#3a4aa8'); mark(p, 12, 18, 'sun', '#d83a3a');
  // 顔・ぼうし（はかりの かざり）
  p.ellipse(10, 6, 3, 3, '#f0d8c0');
  if (dir !== 'up') { p.set(9, 6, '#2a2a2a'); p.set(11, 6, '#2a2a2a'); p.hline(9, 11, 8, '#a86a5a'); }
  p.rect(6, 1, 9, 3, '#2a2a6a'); p.hline(5, 15, 3, '#e8c040'); p.set(10, 0, '#e8c040');
  // つえ（左手）
  p.vline(2, 6 + k, 24, '#a8801e'); p.ellipse(2, 5 + k, 1.5, 1.5, '#ffe070');
  return { p, oc: '#2a2040' };
}
// トランプの 兵隊（14×22。カードの 体）
function paintSoldier(dir, f) {
  const p = new Painter(14, 22);
  const k = f % 2;
  p.ellipse(7, 21, 5, 1, '#1a1a2a');
  p.rect(4, 17, 2, 4, '#2a2a4a'); p.rect(8, 17, 2, 4, '#2a2a4a');
  p.rect(2, 6, 10, 12, '#fffaf0'); p.rect(2, 6, 10, 1, '#3a4aa8'); p.rect(2, 17, 10, 1, '#3a4aa8'); p.vline(2, 6, 17, '#3a4aa8'); p.vline(11, 6, 17, '#3a4aa8');
  mark(p, 7, 11, k ? 'star' : 'moon', '#3a4aa8');
  p.ellipse(7, 3, 2.5, 2.5, '#f0d8c0');
  if (dir !== 'up') { p.set(6, 3, '#2a2a2a'); p.set(8, 3, '#2a2a2a'); }
  p.vline(13, 2, 16, '#8a8aa8'); p.set(13, 1, '#d8d8f0');
  return { p, oc: '#2a2040' };
}
// ちらばった カード（24×16）
function paintCards(dir, f) {
  const p = new Painter(24, 16);
  const k = f % 2;
  const C = [[2, 8, 'moon'], [8, 3 + k, 'star'], [14, 9, 'comet'], [19, 4 - k, 'sun'], [10, 11, 'star']];
  for (const [x, y, m] of C) {
    p.rect(x, y, 5, 5, '#fffaf0'); p.hline(x, x + 4, y, '#e8c040'); p.hline(x, x + 4, y + 4, '#e8c040');
    mark(p, x + 2, y + 2, m, m === 'star' || m === 'sun' ? '#d83a3a' : '#3a4aa8');
  }
  return { p, oc: null };
}

export function paintC11cSpecial(kind, dir, f) {
  switch (kind) {
    case 'c11c_mecha': return paintMecha(dir, f);
    case 'c11c_ace': return paintAce(dir, f);
    case 'c11c_soldier': return paintSoldier(dir, f);
    case 'c11c_cards': return paintCards(dir, f);
    default: return null;
  }
}
export const C11C_SPECIALS = ['c11c_mecha', 'c11c_ace', 'c11c_soldier', 'c11c_cards'];
