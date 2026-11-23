// 第3部 第2章 第2幕「青と白」の とくべつな え（render/c9a-npc-art.js が まぜる）
// ※ ネタバレ注意（docs/plan-part3-c10b.md の 14-3）
// ・c10b_gecko … 砂色の 長い コートの トカゲの しんし（砂時計の かたちの ステッキ・体から 砂が こぼれる。フィールドの 絵。戦いの 絵は B班）
// ・c10b_thief … 白い 羽の マント・フクロウの 仮面・羽かざりの ぼうしの かいとう
// ・c10b_worb … 白い 光の 玉（月の 間）/ c10b_beast … ねむる けもの（氷の 下）/ c10b_sign … 光る 立てふだ（白銀の湖の 小島）
// ・c10b_ped4_on・c10b_ped5_on … 星の音を 置いた 青・白の 台（光る）
// もとの 作品の 絵の しるし（かぎ手・葉巻・顔の きず・片めがね・白い スーツと 赤い ネクタイ など）は 使わない
import { Painter } from './pixel.js?v=6a7817ffa6c0';

function paintGecko(dir, f) {
  const p = new Painter(20, 24);
  const k = f % 2;
  p.ellipse(10, 23, 7, 1.2, '#2a2010');
  // 長い コート（砂色）
  for (let y = 9; y < 22; y++) { const w = 4 + Math.floor((y - 9) / 3); p.hline(10 - w, 10 + w, y, '#c8a060'); }
  p.vline(10, 10, 21, '#a07a40'); p.hline(5, 15, 21, '#a07a40');
  // しっぽ（うしろで ゆれる）
  p.hline(14, 18, 20 - k, '#6a8a4a'); p.set(19, 19 - k, '#6a8a4a');
  // トカゲの 顔（みどり）
  p.ellipse(10, 6, 4, 3.5, '#7aa05a'); p.ellipse(10, 7, 3, 2, '#8ab86a');
  if (dir !== 'up') { p.set(8, 5, '#ffd040'); p.set(12, 5, '#ffd040'); p.set(8, 5, '#1a1a10'); p.hline(8, 12, 8, '#4a6a3a'); }
  // ぼうし（つば の ある 黒い ぼうし）
  p.hline(5, 15, 3, '#2a2018'); p.rect(7, 0, 7, 3, '#3a2a20'); p.hline(7, 13, 2, '#8a6a40');
  // 砂時計の かたちの ステッキ
  const sx = dir === 'left' ? 3 : 16;
  p.vline(sx, 10, 21, '#5a4020'); p.hline(sx - 1, sx + 1, 10, '#e0c070'); p.set(sx, 11, '#e0c070'); p.hline(sx - 1, sx + 1, 12, '#e0c070');
  // こぼれる 砂
  p.set(6, 22 - k, '#e0c890'); p.set(13, 21 + k, '#e0c890');
  return { p, oc: '#1a140a' };
}
function paintThief(dir, f) {
  const p = new Painter(20, 24);
  const k = f % 2;
  p.ellipse(10, 23, 7, 1.2, '#1a2030');
  // 白い 羽の マント（すそが 羽の 形）
  for (let y = 8; y < 22; y++) { const w = 3 + Math.floor((y - 8) / 2); p.hline(10 - w, 10 + w, y, '#f4f6fa'); }
  for (let x = 3; x <= 17; x += 2) p.set(x, 21 + ((x >> 1) % 2), '#d0d8e4');
  p.vline(10, 9, 20, '#c8d0dc');
  // 中の 服（こい あい色）
  p.rect(8, 9, 5, 9, '#2a3460');
  // 顔と フクロウの 仮面
  p.ellipse(10, 5, 3.5, 3.5, '#f0e0d0');
  if (dir !== 'up') { p.rect(6, 3, 9, 3, '#e8ecf4'); p.set(8, 4, '#3a6ad8'); p.set(12, 4, '#3a6ad8'); p.set(10, 6, '#e0a040'); }
  // 羽かざりの ぼうし（シルクハットでは ない。まるい ぼうしに 長い 羽）
  p.ellipse(10, 1.5, 5, 1.6, '#e8ecf4'); p.hline(4, 16, 2, '#c8d0dc');
  for (let i = 0; i < 6; i++) p.set(14 + Math.floor(i / 2), 1 - (i % 2) - k * (i > 3 ? 1 : 0) + 1, '#9ad0ff');
  return { p, oc: '#141a2a' };
}
function paintWorb(f) {
  const p = new Painter(16, 18);
  const k = f % 2;
  p.ellipse(8, 16, 6, 1.5, '#4a5a7a');
  p.ellipse(8, 9 - k, 6, 6, '#c8d8f0'); p.ellipse(8, 9 - k, 4, 4, '#f4f8ff'); p.ellipse(7, 7 - k, 2, 2, '#ffffff');
  p.set(1, 3, '#ffffff'); p.set(14, 5 + k, '#ffffff');
  return { p, oc: '#3a4a6a' };
}
function paintBeast(f) {
  const p = new Painter(30, 22);
  const k = f % 2;
  p.ellipse(15, 20, 13, 2, '#3a4a5a');
  // まるまって ねむる 白い けもの
  p.ellipse(15, 13, 13, 7.5 + k * 0.4, '#e0e8f0'); p.ellipse(14, 12, 11, 6, '#f4f8fc');
  p.ellipse(5, 14, 4.5, 4, '#e8eef4');
  // 耳と とじた 目
  p.set(3, 10, '#c0c8d4'); p.set(7, 10, '#c0c8d4');
  p.hline(3, 5, 14, '#5a6070'); p.set(6, 16, '#8a7080');
  // しっぽ
  p.ellipse(24, 16, 4, 2, '#e8eef4');
  // Z
  if (k) { p.hline(20, 23, 2, '#9ad0ff'); p.set(22, 3, '#9ad0ff'); p.set(21, 4, '#9ad0ff'); p.hline(20, 23, 5, '#9ad0ff'); }
  return { p, oc: '#2a3444' };
}
function paintSign(f) {
  const p = new Painter(16, 18);
  const k = f % 2;
  p.ellipse(8, 17, 5, 1, '#3a4a5a');
  p.vline(7, 8, 16, '#6a4a2a'); p.vline(8, 8, 16, '#8a6a3a');
  p.rect(1, 1, 14, 8, '#c8a878'); p.rect(2, 2, 12, 6, '#e0c898');
  p.hline(3, 12, 4, '#6a5030'); p.hline(3, 10, 6, '#6a5030');
  // かすかに 光る
  p.set(0, 0, k ? '#e8f8ff' : '#9ad0ff'); p.set(15, 2, k ? '#9ad0ff' : '#e8f8ff'); p.set(14, 9, '#c8ecff');
  return { p, oc: '#2a2018' };
}
const PED_COLOR = { 4: ['#2a7ad8', '#7ab8ff', '#e0f0ff'], 5: ['#c8d0dc', '#f0f4fa', '#ffffff'] };
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

export function paintC10bSpecial(kind, dir, f) {
  switch (kind) {
    case 'c10b_gecko': return paintGecko(dir, f);
    case 'c10b_thief': return paintThief(dir, f);
    case 'c10b_worb': return paintWorb(f);
    case 'c10b_beast': return paintBeast(f);
    case 'c10b_sign': return paintSign(f);
    case 'c10b_ped4_on': return paintPedOn(4, f);
    case 'c10b_ped5_on': return paintPedOn(5, f);
    default: return null;
  }
}
export const C10B_SPECIALS = ['c10b_gecko', 'c10b_thief', 'c10b_worb', 'c10b_beast', 'c10b_sign', 'c10b_ped4_on', 'c10b_ped5_on'];
