// 第6章 Step 3・4 の 人の え と とくべつな え（render/ch6-art.js が まぜる）
// 人（ROAD_NPC_LOOKS）: 星読みのオリハ（ミナモの おばあさん。こい 青の ころもに 星の ふち・白い かみ・つえ）・社の見習いコトハ
// とくべつな え（paintRoadSpecial）: 星くいのよる鳥（大きな 黒い 鳥。おなかに 食べた 星の 光）・ふりこの魔女ペンデュラ（大きな ふりこを もつ 魔女）・
//   タイムカプセルを うめる 所（千年前）・ほる 所（今。土の 下から 光）・きらきらの石
import { Painter } from './pixel.js?v=f7adbedf412d';

export const ROAD_NPC_LOOKS = {
  oriha: { hair: 5, hairStyle: 'bun', skin: 0, outfit: 'robe', robeMain: '#2a3a7a', robeTrim: '#f0d870', female: true, cane: true, hunch: true, hat: 'circlet', hatGem: '#a8d8ff' },
  kotoha: { hair: '#3a2a5a', hairStyle: 'twin', skin: 0, outfit: 'robe', robeMain: '#e8eeff', robeTrim: '#7a8ad8', female: true, small: true },
};

// 星くいのよる鳥（44×40。2コマで はばたく。おなかの 中で 星が 光る）
function paintStarEater(f) {
  const W = 44, H = 40, p = new Painter(W, H);
  const K = { d: '#0e0c1c', b: '#24203e', l: '#3e3864', hl: '#5e5890' };
  p.ellipse(22, 38.5, 13, 1.6, '#08060e');
  // 羽（コマで 上下）
  const up = f % 2 === 0;
  for (const s of [-1, 1]) {
    for (let k = 0; k < 14; k++) {
      const x = 22 + s * (8 + k);
      const y0 = up ? 14 - Math.floor(k * 0.7) : 18 + Math.floor(k * 0.3);
      p.vline(x, y0, y0 + 9 - Math.floor(k / 3), K.b);
      p.set(x, y0, K.hl);
    }
  }
  // 体
  p.ellipse(22, 22, 10, 11, K.b); p.ellipse(21, 20, 7, 8, K.l);
  // おなかの 星（食べた 星の 光）
  for (const [x, y, c] of [[19, 24, '#ffe680'], [24, 27, '#ffffff'], [22, 21, '#a8c8ff'], [26, 23, '#ffe680'], [18, 28, '#a8c8ff']]) p.set(x, y, (x + f) % 2 ? c : '#fff6c0');
  // 頭・くちばし・目
  p.ellipse(22, 9, 6, 5.5, K.b); p.ellipse(21, 8, 4, 3.5, K.l);
  p.rect(20, 12, 4, 3, '#c8a040'); p.set(22, 15, '#a07820');
  p.set(19, 8, '#ff5a8a'); p.set(25, 8, '#ff5a8a');
  // とさか
  for (let i = 0; i < 4; i++) p.set(21 + i, 2 + (i % 2), K.hl);
  // 足
  p.vline(18, 32, 37, '#c8a040'); p.vline(26, 32, 37, '#c8a040');
  return { p, oc: '#04030a' };
}
// ふりこの魔女ペンデュラ（34×46。むらさきの ドレスと とんがりぼうし。左手に 大きな ふりこ。コマで ふりこが ゆれる）
function paintPendula(f) {
  const W = 34, H = 46, p = new Painter(W, H);
  const D = { d: '#2a1238', b: '#4a2068', l: '#7a3aa0', hl: '#a868d0' };
  p.ellipse(17, 44.5, 10, 1.5, '#0a0410');
  // ドレス
  for (let y = 18; y < 44; y++) { const half = Math.round(4 + (y - 18) * 0.4); p.hline(17 - half, 16 + half, y, D.b); p.set(17 - half, y, D.l); p.set(16 + half, y, D.d); }
  for (let y = 22; y < 44; y += 6) p.hline(17 - Math.round(4 + (y - 18) * 0.4) + 1, 16 + Math.round(4 + (y - 18) * 0.4) - 1, y, D.hl);
  // 顔・かみ
  p.ellipse(17, 14, 4, 4.2, '#e8d0e8'); p.set(15, 14, '#3a0a3a'); p.set(19, 14, '#3a0a3a');
  p.rect(12, 12, 2, 8, '#c8c8e0'); p.rect(20, 12, 2, 8, '#c8c8e0');
  // とんがりぼうし
  for (let y = 0; y < 11; y++) { const half = Math.round(y * 0.6); p.hline(17 - half, 17 + half, y, D.d); }
  p.hline(10, 24, 10, D.l); p.set(17, 0, '#ffe680');
  // ふりこ（左手から。コマで 左右に）
  const sw = f % 2 ? 3 : -3;
  p.vline(5, 18, 20, '#c8a040');
  for (let k = 0; k < 12; k++) p.set(Math.round(5 + (sw * k) / 12), 20 + k, '#c8a040');
  p.ellipse(5 + sw, 34, 3.2, 3.2, '#e0b840'); p.ellipse(4 + sw, 33, 1.4, 1.4, '#fff0a0');
  return { p, oc: '#08020c' };
}
function paintCapsuleHole() {
  const p = new Painter(14, 8);
  p.ellipse(7, 5, 6, 2.5, '#6a4a28'); p.ellipse(7, 4.5, 5, 1.8, '#8a6438');
  p.set(4, 4, '#a8804a'); p.set(10, 5, '#a8804a');
  p.set(7, 2, '#fff6b0');
  return { p, oc: '#3a2410' };
}
function paintCapsuleSpot(f) {
  const p = new Painter(14, 10);
  p.ellipse(7, 7, 6, 2.5, '#6a4a28'); p.ellipse(7, 6.5, 5, 1.8, '#8a6438');
  const c = f % 2 ? '#fff6b0' : '#ffe080';
  for (const [x, y] of [[7, 5], [4, 6], [10, 6], [7, 2], [3, 3], [11, 2]]) p.set(x, y, (x + y + f) % 3 ? c : '#ffffff');
  return { p, oc: '#3a2410' };
}
function paintKira(f) {
  const p = new Painter(10, 10);
  p.ellipse(5, 7, 3, 2.2, '#8a8ab0'); p.ellipse(4.5, 6.5, 2, 1.4, '#c8c8f0');
  const c = f % 2 ? '#ffffff' : '#fff0a0';
  p.set(5, 2, c); p.set(5, 3, c); p.set(4, 3, c); p.set(6, 3, c); p.set(5, 4, c);
  p.set(1, 5, '#a8c8ff'); p.set(8, 4, '#a8c8ff');
  return { p, oc: '#2a2a48' };
}

export function paintRoadSpecial(kind, dir, f) {
  switch (kind) {
    case 'star_eater_npc': return paintStarEater(f);
    case 'pendula_npc': return paintPendula(f);
    case 'capsule_hole': return paintCapsuleHole();
    case 'capsule_spot': return paintCapsuleSpot(f);
    case 'kira_stone': return paintKira(f);
    default: return null;
  }
}
export const ROAD_SPECIALS = ['star_eater_npc', 'pendula_npc', 'capsule_hole', 'capsule_spot', 'kira_stone'];
