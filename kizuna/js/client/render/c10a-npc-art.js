// 第3部 第2章 第1幕「赤と緑」の とくべつな え（render/c9a-npc-art.js が まぜる）
// ※ ネタバレ注意（docs/plan-part3-c10a.md の 13-5）
// ・c10r_tamagon … たまごの 形の 科学者（大きな ゴーグル・ばねの ひげ）と ドリルの メカ（フィールドの 絵。戦いの 絵は B班）
// ・c10g_mold … カビの だんしゃく（きのこの かさの ぼうし・しめった マント）と 小さな まるい 飛ぶ メカ
// ・c10a_ped0_on・c10a_ped3_on … 星の音を 置いた 赤・緑の 台（光る）
// もとの 作品の 絵は 使わない（形・色を かえて ある）
import { Painter } from './pixel.js?v=31ca07498b9b';

function paintTamagon(dir, f) {
  const p = new Painter(24, 24);
  const k = f % 2;
  // ドリルの メカ（下）
  p.ellipse(12, 21, 10, 2, '#1a0e08');
  p.rect(3, 14, 18, 7, '#6a6a78'); p.rect(4, 15, 16, 5, '#9a9aa8'); p.hline(4, 19, 15, '#c8c8d8');
  p.set(6, 20, '#2a2a30'); p.set(17, 20, '#2a2a30');
  // ドリル（前）
  const dx = dir === 'left' ? -1 : 1;
  const tipX = dx > 0 ? 21 : 2;
  for (let i = 0; i < 4; i++) p.vline(tipX + dx * i, 15 + i, 19 - i, i % 2 === k ? '#e8c860' : '#b89030');
  // たまごの 体
  p.ellipse(12, 9, 6, 7, '#f4ecd8'); p.ellipse(11, 8, 4.5, 5.5, '#fffaf0');
  // 白衣の えり と ボタン
  p.hline(8, 16, 13, '#e0e0e8'); p.set(12, 11, '#5a8ad8');
  // 大きな ゴーグル
  if (dir !== 'up') {
    p.hline(7, 17, 6, '#5a3a20');
    p.ellipse(10, 6, 2.2, 2, '#7ad0f0'); p.ellipse(14, 6, 2.2, 2, '#7ad0f0'); p.set(9, 5, '#ffffff'); p.set(13, 5, '#ffffff');
    // ばねの ひげ
    for (let i = 0; i < 4; i++) { p.set(9 - i, 9 + (i % 2), '#a05a2a'); p.set(15 + i, 9 + (i % 2), '#a05a2a'); }
  } else p.hline(7, 17, 6, '#5a3a20');
  // あたまの アンテナ
  p.vline(12, 0, 2, '#8a8a98'); p.set(12, 0, k ? '#ff5a3a' : '#ffd040');
  return { p, oc: '#1a1210' };
}
function paintMold(dir, f) {
  const p = new Painter(20, 24);
  const k = f % 2;
  // 小さな まるい 飛ぶ メカ（下で ふわふわ）
  const my = 18 + k;
  p.ellipse(10, 23, 6, 1, '#1a2a14');
  p.ellipse(10, my, 6, 3.5, '#6a7a5a'); p.ellipse(10, my - 1, 5, 2.5, '#8a9a70');
  p.hline(3, 17, my - 4, '#c8c8b8'); p.set(10, my - 3, '#c8c8b8');
  p.set(7, my, '#d8f080'); p.set(13, my, '#d8f080');
  // しめった マント
  for (let y = 9; y < 16; y++) { const w = 3 + Math.floor((y - 9) / 2); p.hline(10 - w, 10 + w, y, '#4a5a4a'); }
  p.vline(10, 10, 15, '#3a4a3a');
  // 顔
  p.ellipse(10, 8, 3, 3, '#c8d8b0');
  if (dir !== 'up') { p.set(9, 8, '#2a1a2a'); p.set(11, 8, '#2a1a2a'); p.hline(9, 11, 10, '#6a5a6a'); }
  // きのこの かさの ぼうし（むらさきに 白い 点）
  p.ellipse(10, 4, 7, 3.5, '#7a4a8a'); p.ellipse(10, 3, 6, 2.5, '#9a6aaa');
  for (const [x, y] of [[6, 3], [10, 2], [14, 3], [8, 5], [12, 5]]) p.set(x, y, '#f0e8f0');
  return { p, oc: '#141a10' };
}
// 光る 台（赤・緑）
const PED_COLOR = { 0: ['#e04a3a', '#ff9a7a', '#ffe0d0'], 3: ['#3ab04a', '#8ae07a', '#e0ffd0'] };
function paintPedOn(i, f) {
  const [c, l, w] = PED_COLOR[i];
  const p = new Painter(16, 16);
  const k = f % 2;
  p.ellipse(8, 14, 6, 1.5, '#1a1a24');
  p.rect(4, 8, 8, 6, '#8a8a9a'); p.hline(3, 12, 8, '#c8c8d8'); p.hline(3, 12, 13, '#5a5a6a');
  p.rect(3, 7, 10, 2, '#a8a8b8');
  p.ellipse(8, 7, 3, 1.4, c);
  p.ellipse(8, 4 - k, 3, 3, l); p.ellipse(8, 4 - k, 1.6, 1.6, w);
  p.set(8, 0, w); p.set(3, 3, l); p.set(13, 4, l);
  return { p, oc: '#1a1a24' };
}

export function paintC10aSpecial(kind, dir, f) {
  switch (kind) {
    case 'c10r_tamagon': return paintTamagon(dir, f);
    case 'c10g_mold': return paintMold(dir, f);
    case 'c10a_ped0_on': return paintPedOn(0, f);
    case 'c10a_ped3_on': return paintPedOn(3, f);
    default: return null;
  }
}
export const C10A_SPECIALS = ['c10r_tamagon', 'c10g_mold', 'c10a_ped0_on', 'c10a_ped3_on'];
