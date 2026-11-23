// 第3部 第2章 第3幕「紫と、うばわれた音」の とくべつな え（render/c9a-npc-art.js が まぜる）
// ※ ネタバレ注意（docs/plan-part3-c10c.md の 15-3）
// ・c10c_colonel … むらさきの 軍服・丸い ゴーグル・花の しるしの ぼうし・雷の 石ばんを もった たいさ（フィールドの 絵。戦いの 絵は B班）
// ・c10c_ped6_on … 星の音を 置いた 紫の 台（光る）
// もとの 作品の 絵の しるし（サングラス・茶色の スーツ・小さな 銃・光る 石の ペンダント など）は 使わない
import { Painter } from './pixel.js?v=cb02a9b15ddb';

function paintColonel(dir, f) {
  const p = new Painter(20, 24);
  const k = f % 2;
  p.ellipse(10, 23, 7, 1.2, '#1a1428');
  // むらさきの 軍服（金の ボタン・肩の かざり）
  p.rect(5, 9, 10, 10, '#6a3a9a'); p.vline(10, 10, 18, '#4a2a70');
  for (const y of [11, 14, 17]) p.set(10, y, '#f0d050');
  p.hline(4, 6, 9, '#f0d050'); p.hline(14, 16, 9, '#f0d050');
  p.rect(6, 19, 3, 3, '#3a2a50'); p.rect(11, 19, 3, 3, '#3a2a50');
  p.hline(5, 8, 22, '#1a1020'); p.hline(11, 14, 22, '#1a1020');
  // 顔
  p.ellipse(10, 6, 3.6, 3.4, '#f0c8a0');
  // 丸い ゴーグル（うす みどりの ガラス）
  if (dir !== 'up') {
    p.ellipse(8, 6, 1.6, 1.4, '#3a3a3a'); p.ellipse(12, 6, 1.6, 1.4, '#3a3a3a');
    p.set(8, 6, '#a8e0c0'); p.set(12, 6, '#a8e0c0'); p.hline(9, 11, 6, '#3a3a3a');
    p.hline(9, 11, 8, '#a06a5a');
  }
  // 花の しるしの ぼうし（つば つき）
  p.hline(5, 15, 3, '#2a1a40'); p.rect(6, 0, 9, 3, '#5a2a8a');
  p.set(10, 1, '#ffb0e0'); p.set(9, 1, '#ff80c8'); p.set(11, 1, '#ff80c8'); p.set(10, 0, '#ff80c8'); p.set(10, 2, '#ff80c8');
  // 雷の 石ばん（光る）
  const sx = dir === 'left' ? 1 : 14;
  p.rect(sx, 11, 5, 6, '#7a7a90'); p.hline(sx, sx + 4, 11, '#b0b0c8');
  p.set(sx + 2, 12, '#fff060'); p.set(sx + 1, 13, '#fff060'); p.set(sx + 2, 14, '#fff060'); p.set(sx + 3, 15, k ? '#ffffff' : '#fff060');
  return { p, oc: '#1a1024' };
}
function paintPedOn(f) {
  const p = new Painter(16, 16);
  const k = f % 2;
  p.ellipse(8, 14, 6, 1.5, '#1a1a24');
  p.rect(4, 8, 8, 6, '#8a8a9a'); p.hline(3, 12, 8, '#c8c8d8'); p.hline(3, 12, 13, '#5a5a6a');
  p.rect(3, 7, 10, 2, '#a8a8b8');
  p.ellipse(8, 7, 3, 1.4, '#7a3ac8');
  p.ellipse(8, 4 - k, 3, 3, '#a86ae0'); p.ellipse(8, 4 - k, 1.6, 1.6, '#f0e0ff');
  p.set(8, 0, '#f0e0ff'); p.set(3, 3, '#a86ae0'); p.set(13, 4, '#a86ae0');
  return { p, oc: '#1a1a24' };
}

export function paintC10cSpecial(kind, dir, f) {
  switch (kind) {
    case 'c10c_colonel': return paintColonel(dir, f);
    case 'c10c_ped6_on': return paintPedOn(f);
    default: return null;
  }
}
export const C10C_SPECIALS = ['c10c_colonel', 'c10c_ped6_on'];
