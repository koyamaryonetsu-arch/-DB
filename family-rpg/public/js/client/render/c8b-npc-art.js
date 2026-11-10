// 第8章 第2幕「よみの青い火」の 人の え と とくべつな え（render/c8a-npc-art.js が まぜる）
// ※ ネタバレ注意（docs/plan-ch8.md の 6）
// 人（C8B_NPC_LOOKS）: よみの王ハデロス（場面の 人の すがた。青い 火の かみ・青白い はだ・黒い 長い ローブに 青い ふち）・
//   おこった ハデロス（かみが まっ赤な 火・赤い ふち）・かもめの好きな女の子・もぐり漁師（大木の島）
// とくべつな え（paintC8bSpecial）: よみの王ハデロス（8階の 大きな すがた 40×48。かみの 青い 火が コマで ゆらめく。おこると まっ赤 … c8b_hades_red_npc）・
//   ペイニックと パニクル（4階の 2ひき 40×32。ピンクの ふとっちょと みどりの やせっぽち。コマで ぴょこぴょこ）・青い 火の 玉座（36×28）
import { Painter } from './pixel.js';

const person = (o) => o;
export const C8B_NPC_LOOKS = {
  c8b_hades: person({
    hair: '#4ac8ff', hairStyle: 'spiky', skin: '#9aa8c0', outfit: 'robe', robeMain: '#1a1a2e', robeTrim: '#3a8ad8', cape: '#10101e',
  }),
  c8b_hades_red: person({
    hair: '#ff5a2a', hairStyle: 'spiky', skin: '#b8a0a0', outfit: 'robe', robeMain: '#2a1414', robeTrim: '#d83a2a', cape: '#1a0a0a',
  }),
  c8b_gullgirl: person({ hair: 1, hairStyle: 'pony', skin: 2, outfit: 'apron', cloth: '#e88a8a', female: true, small: true, hat: 'bandana', hatColor: '#f4f8ff' }),
  c8b_diver: person({ hair: 0, hairStyle: 'short', skin: '#c08a5a', outfit: 'traveler', cloth: '#2a5a8a', hat: 'bandana', hatColor: '#e8e0c8' }),
};

// ───────────── とくべつな え ─────────────
const BF = { d: '#1a5aa8', b: '#3aa8f0', l: '#8ae0ff', w: '#e8fcff' }; // 青い 火
const RF = { d: '#a8201a', b: '#f0502a', l: '#ffb06a', w: '#fff4d8' }; // おこった 赤い 火
const BLUE = BF;
// よみの王ハデロス（40×48）: 青白い 顔・ニヤリと 笑う 口・黄色い 目・頭の 青い 火（コマで ゆらめく）・黒い ローブと けむりの すそ
function paintHades(f, angry = false) {
  const W = 40, H = 48, p = new Painter(W, H);
  const SK = angry ? { d: '#7a5a64', b: '#b8a0a8', l: '#dcc8cc' } : { d: '#5a6a84', b: '#9aa8c0', l: '#c8d4e4' }, RB = { d: '#0a0a16', b: '#1a1a2e', l: '#2e2e4a' };
  const BF = angry ? RF : BLUE;
  const k = f % 2;
  p.ellipse(20, 46, 13, 2, '#060a14');
  // ローブ（すそは けむりの ように ゆれる）
  for (let y = 18; y < 45; y++) {
    const w = 6 + Math.floor((y - 18) * 0.42);
    p.hline(20 - w, 19 + w, y, y % 5 ? RB.b : RB.l);
  }
  for (let x = 6; x < 34; x += 3) p.vline(x + ((x + k) % 2), 42, 45, RB.d);
  // 青い ふちと むねの かざり
  for (let y = 18; y < 44; y++) { const w = 6 + Math.floor((y - 18) * 0.42); p.set(20 - w, y, BF.d); p.set(19 + w, y, BF.d); }
  p.vline(20, 20, 43, BF.d);
  p.ellipse(20, 22, 2, 2, BF.b); p.set(20, 22, BF.w);
  // かた・うで（左手を 広げて 話す）
  p.rect(10, 18, 20, 4, RB.l);
  for (let i = 0; i < 6; i++) p.hline(5 - (k ? 1 : 0), 10, 20 + i, RB.b);
  p.ellipse(4 - (k ? 1 : 0), 26, 2, 2, SK.b);
  p.rect(29, 20, 4, 10, RB.b); p.ellipse(31, 31, 2, 2, SK.b);
  // 顔（とがった あご）
  p.ellipse(20, 12, 6, 7, SK.b);
  for (let i = 0; i < 4; i++) p.hline(17 + i, 22 - i, 18 + i, SK.b);
  p.ellipse(18, 9, 2, 2, SK.l);
  // 黄色い 目・まゆ・ニヤリ
  p.hline(15, 18, 9, SK.d); p.hline(22, 25, 9, SK.d);
  p.set(16, 11, '#f8e050'); p.set(17, 11, '#f8e050'); p.set(23, 11, '#f8e050'); p.set(24, 11, '#f8e050');
  p.hline(16, 24, 15, '#2a1a2a'); p.hline(17, 23, 16, '#f4f4f4'); p.set(16, 14, '#2a1a2a'); p.set(24, 14, '#2a1a2a');
  // 頭の 青い 火（コマで ゆらめく）
  for (let x = 12; x <= 28; x++) {
    const h = 4 + ((x * 5 + k * 3) % 7) + (Math.abs(x - 20) < 4 ? 3 : 0);
    for (let y = 0; y < h; y++) p.set(x + (y > h - 3 ? (k ? 1 : -1) : 0), 6 - y + 2, y < 2 ? BF.l : y < h - 2 ? BF.b : BF.d);
  }
  for (let x = 13; x <= 27; x += 3) p.set(x, 7, BF.w);
  return { p, oc: '#04060e' };
}
// ペイニックと パニクル（40×32）: 左の ピンクの ふとっちょ・右の みどりの やせっぽち。どちらも 小さな つのと こうもりの はね
function paintImps(f) {
  const W = 40, H = 32, p = new Painter(W, H);
  const PK = { d: '#a83a7a', b: '#e86ab0', l: '#ffb0d8' }, GN = { d: '#2a6a5a', b: '#4ab89a', l: '#9ae8d0' }, WG = '#3a2a4a';
  const k = f % 2;
  p.ellipse(11, 30, 8, 1.5, '#140a18'); p.ellipse(29, 30, 6, 1.5, '#140a18');
  // ペイニック（ふとっちょ）
  const py = k ? -1 : 0;
  p.ellipse(4, 16 + py, 3, 4, WG); p.ellipse(18, 16 + py, 3, 4, WG);
  p.ellipse(11, 20 + py, 8, 8, PK.d); p.ellipse(11, 19 + py, 7, 7, PK.b); p.ellipse(9, 16 + py, 3, 3, PK.l);
  p.set(7, 9 + py, PK.d); p.set(6, 8 + py, '#f4e8d8'); p.set(15, 9 + py, PK.d); p.set(16, 8 + py, '#f4e8d8');
  p.ellipse(8, 17 + py, 1.5, 1.5, '#ffffff'); p.set(8, 17 + py, '#1a0a1a'); p.ellipse(14, 17 + py, 1.5, 1.5, '#ffffff'); p.set(14, 17 + py, '#1a0a1a');
  p.hline(9, 13, 21 + py, '#5a1a3a');
  p.rect(7, 27 + py, 2, 2, PK.d); p.rect(13, 27 + py, 2, 2, PK.d);
  // パニクル（やせっぽち。あわてて 手を 上げる）
  const qy = k ? 0 : -1;
  p.ellipse(23, 13 + qy, 2, 3, WG); p.ellipse(35, 13 + qy, 2, 3, WG);
  p.rect(26, 12 + qy, 6, 14, GN.d); p.rect(27, 12 + qy, 4, 13, GN.b);
  p.ellipse(29, 9 + qy, 4, 4, GN.b); p.ellipse(28, 8 + qy, 2, 2, GN.l);
  p.set(26, 4 + qy, GN.d); p.set(25, 3 + qy, '#f4e8d8'); p.set(32, 4 + qy, GN.d); p.set(33, 3 + qy, '#f4e8d8');
  p.ellipse(27, 9 + qy, 1.5, 2, '#ffffff'); p.set(27, 9 + qy, '#0a1a14'); p.ellipse(31, 9 + qy, 1.5, 2, '#ffffff'); p.set(31, 9 + qy, '#0a1a14');
  p.ellipse(29, 12 + qy, 1.5, 1, '#1a3a2a');
  p.vline(25, 6 + qy - k, 14 + qy, GN.b); p.vline(33, 6 + qy - k, 14 + qy, GN.b);
  p.vline(27, 26 + qy, 29, GN.d); p.vline(31, 26 + qy, 29, GN.d);
  return { p, oc: '#0e0614' };
}
// 青い 火の 玉座（36×28）: 黒い 石の 大きな いす・左右に 青い 火（コマで ゆれる）
function paintThrone(f) {
  const W = 36, H = 28, p = new Painter(W, H);
  const ST = { d: '#0a1220', b: '#1e2e48', l: '#3a5478' };
  const k = f % 2;
  p.ellipse(18, 26, 15, 2, '#04060e');
  p.rect(9, 2, 18, 22, ST.d); p.rect(10, 3, 16, 20, ST.b);
  p.hline(10, 25, 3, ST.l);
  for (let i = 0; i < 4; i++) p.set(12 + i * 4, 1, ST.l);
  p.rect(7, 14, 22, 4, ST.l); p.rect(7, 18, 22, 6, ST.d);
  p.ellipse(18, 9, 3, 3, BF.b); p.set(18, 9, BF.w);
  for (const cx of [4, 32]) {
    p.rect(cx - 2, 16, 4, 9, ST.b);
    for (let y = 0; y < 10; y++) { const w = Math.max(0, Math.round((10 - y) / 3)); p.hline(cx - w + (y > 6 ? (k ? 1 : -1) : 0), cx + w - 1 + (y > 6 ? (k ? 1 : -1) : 0), 15 - y, y < 3 ? BF.l : y < 7 ? BF.b : BF.d); }
  }
  return { p, oc: '#02040a' };
}

export function paintC8bSpecial(kind, dir, f) {
  switch (kind) {
    case 'c8b_hades_npc': return paintHades(f);
    case 'c8b_hades_red_npc': return paintHades(f, true);
    case 'c8b_imps_npc': return paintImps(f);
    case 'c8b_throne_npc': return paintThrone(f);
    default: return null;
  }
}
export const C8B_SPECIALS = ['c8b_hades_npc', 'c8b_hades_red_npc', 'c8b_imps_npc', 'c8b_throne_npc'];
