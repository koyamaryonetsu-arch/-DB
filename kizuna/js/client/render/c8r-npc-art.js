// 第8章 第4幕「時のはざま」の 人の え と とくべつな え（render/c8c-npc-art.js が まぜる）
// ※ ネタバレ注意（docs/plan-ch8.md の 9）
// 人（C8R_NPC_LOOKS）: 時の門番フリーゾン（場面の 人の すがた。白い はだ・むらさきの わ・白い ローブ）
// とくべつな え（paintC8rSpecial）: 時の門番フリーゾン（時の広間の 大とびらの 前で 待つ 大きな すがた 40×40。
//   白く つやつやした 体・頭と かたの むらさきの まるい よろい・長い しっぽ。コマで しっぽが ゆれて、うでを くむ）
// 戦いの え（第2・第3・最終形態）は B の もの
import { Painter } from './pixel.js?v=298589449c4c';

export const C8R_NPC_LOOKS = {
  c8r_gate: {
    hair: '#5a2a8a', hairStyle: 'short', skin: '#f4f0f8', outfit: 'robe', robeMain: '#f4f0fa', robeTrim: '#8a3ad8', cape: '#5a2a8a',
    hat: 'circlet', hatColor: '#8a3ad8', hatGem: '#e83ab8',
  },
};

const W8 = { d: '#b8b0c8', b: '#ece8f4', l: '#ffffff' }; // 白い 体
const PU = { d: '#3a1a5a', b: '#7a3ab8', l: '#b88ae8' }; // むらさきの よろい
function paintGate(f) {
  const W = 40, H = 40, p = new Painter(W, H);
  const k = f % 2;
  p.ellipse(20, 38, 12, 2, '#0a0614');
  // しっぽ（右うしろで ゆれる）
  for (let i = 0; i < 12; i++) p.ellipse(28 + i, 32 - Math.round(Math.sin((i + k * 2) * 0.6) * 2) - Math.floor(i / 3), 2, 2, i % 3 ? W8.b : W8.d);
  // あし
  p.rect(15, 28, 4, 9, W8.d); p.rect(21, 28, 4, 9, W8.d);
  p.rect(15, 28, 3, 8, W8.b); p.rect(21, 28, 3, 8, W8.b);
  p.ellipse(16, 37, 3, 1.5, PU.d); p.ellipse(23, 37, 3, 1.5, PU.d);
  // 体
  p.ellipse(20, 22, 8, 8, W8.d);
  p.ellipse(20, 21, 7, 7, W8.b);
  p.ellipse(18, 18, 2, 2, W8.l);
  // むねの むらさきの まる
  p.ellipse(20, 21, 3, 2.5, PU.b); p.set(19, 20, PU.l);
  // かたの よろい
  p.ellipse(11, 16, 4, 3, PU.d); p.ellipse(11, 15, 3, 2, PU.b); p.set(10, 14, PU.l);
  p.ellipse(29, 16, 4, 3, PU.d); p.ellipse(29, 15, 3, 2, PU.b); p.set(28, 14, PU.l);
  // うで（コマで うでを くむ）
  if (k) { p.rect(13, 19, 14, 3, W8.d); p.hline(13, 26, 19, W8.b); }
  else { p.rect(9, 17, 3, 8, W8.d); p.rect(28, 17, 3, 8, W8.d); p.set(9, 25, W8.b); p.set(30, 25, W8.b); }
  // 頭
  p.ellipse(20, 9, 6, 6, W8.d);
  p.ellipse(20, 9, 5, 5, W8.b);
  p.ellipse(20, 5, 4, 2.5, PU.b); p.set(19, 4, PU.l);
  // つの
  p.vline(13, 3, 7, '#2a1a3a'); p.vline(27, 3, 7, '#2a1a3a'); p.set(13, 2, '#5a4a6a'); p.set(27, 2, '#5a4a6a');
  // 目（見くだす 目）
  p.hline(17, 18, 9, '#c81a3a'); p.hline(22, 23, 9, '#c81a3a');
  p.hline(16, 18, 8, '#3a1a4a'); p.hline(22, 24, 8, '#3a1a4a');
  p.hline(19, 21, 12, '#7a2a4a');
  return { p, oc: '#0a0614' };
}

export function paintC8rSpecial(kind, dir, f) {
  switch (kind) {
    case 'c8r_gate_npc': return paintGate(f);
    default: return null;
  }
}
export const C8R_SPECIALS = ['c8r_gate_npc'];
