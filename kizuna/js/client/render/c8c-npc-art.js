// 第8章 第3幕「くろがねの空中ようさい」の 人の え と とくべつな え（render/c8b-npc-art.js が まぜる）
// ※ ネタバレ注意（docs/plan-ch8.md の 7-2・8）
// 人（C8C_NPC_LOOKS）: 初代大魔王クッパード（泉の里の 場面の 人の すがた。赤い とげとげの かみ・黄色い はだ・みどりの こうらの ような ローブと マント・金の かんむり）・
//   マジカメック（青い とんがりぼうしと ローブ・まるい めがね・まほうの つえ）・泉の里の 子ポコ・湖の 絵かきの 女の子・森の きこり
// とくべつな え（paintC8cSpecial）: 初代大魔王クッパード（8階の 大きな すがた 40×48。とげの ついた みどりの こうら・赤い かみ・つの・
//   大きな 口と きば。コマで いばって むねを はる）・マジカメック（4階の 大きな すがた 40×40。ほうきに のって ふわふわ。つえの 先が ぴかぴか）
// まほうの おりの ミナモは 第6章の ミナモの え（minamo）を そのまま 使う
import { Painter } from './pixel.js?v=8f3c13478779';

const person = (o) => o;
export const C8C_NPC_LOOKS = {
  c8c_bowser: person({
    hair: '#e8501a', hairStyle: 'spiky', skin: '#e8c060', outfit: 'robe', robeMain: '#2a7a3a', robeTrim: '#f0e0a0', cape: '#1e5a2a', beard: true,
    hat: 'crown', hatColor: '#e8c040', hatGem: '#e83a2a',
  }),
  c8c_kamek: person({
    hair: '#f4f4f4', hairStyle: 'short', skin: '#e8c870', outfit: 'robe', robeMain: '#3a4ab8', robeTrim: '#f4f4f4', glasses: true,
    hat: 'wizard', hatColor: '#3a4ab8', weapon: { cat: 'staff', blade: '#c8a040', guard: '#6a4a1a', orb: '#e83a6a' },
  }),
  c8c_poco: person({ hair: 3, hairStyle: 'spiky', skin: 1, outfit: 'tunic', cloth: '#c88a3a', small: true }),
  c8c_painter: person({ hair: 2, hairStyle: 'twin', skin: 0, outfit: 'apron', cloth: '#5a8ad8', female: true, small: true, hat: 'ribbon', hatColor: '#f08ab0' }),
  c8c_woodcutter: person({ hair: 4, hairStyle: 'short', skin: 2, outfit: 'traveler', cloth: '#7a4a2a', beard: true, hat: 'bandana', hatColor: '#3a6a2a', weapon: { cat: 'axe', blade: '#c8ccd4', guard: '#6a4a22' } }),
};

// ───────────── とくべつな え ─────────────
const SH = { d: '#1a4a22', b: '#2e7a3a', l: '#5aa860' }; // こうら
const SKN = { d: '#b88a2a', b: '#e8c060', l: '#f8e090' }; // はだ
const HR = { d: '#a8280a', b: '#e8501a', l: '#ff8a4a' }; // かみ
const SP = { d: '#a8a8a0', b: '#f0f0e8' }; // とげ・つの
// 初代大魔王クッパード（40×48）
function paintBowser(f) {
  const W = 40, H = 48, p = new Painter(W, H);
  const k = f % 2;
  const up = k ? -1 : 0;
  p.ellipse(20, 46, 14, 2, '#0a0a06');
  // こうら（せなかの とげとげ）
  p.ellipse(20, 30 + up, 14, 13, SH.d);
  p.ellipse(20, 30 + up, 12, 11, SH.b);
  p.ellipse(16, 25 + up, 4, 3, SH.l);
  for (const [x, y] of [[9, 22], [31, 22], [6, 31], [34, 31], [12, 39], [28, 39]]) {
    p.ellipse(x, y + up, 2, 2, SP.b); p.set(x, y - 2 + up, SP.b); p.set(x, y + up, SP.d);
  }
  // おなか（黄色い だんだん）
  p.ellipse(20, 32 + up, 7, 9, SKN.b);
  for (let y = 26; y < 41; y += 3) p.hline(15, 25, y + up, SKN.d);
  // 足
  p.ellipse(13, 43, 4, 3, SKN.b); p.ellipse(27, 43, 4, 3, SKN.b);
  for (const x of [10, 13, 16, 24, 27, 30]) p.set(x, 45, SP.b);
  // うで（こしに 手を あてて いばる。コマで ぐっと はる）
  p.ellipse(7 - k, 30 + up, 3, 5, SKN.b); p.ellipse(33 + k, 30 + up, 3, 5, SKN.b);
  for (const x of [6 - k, 34 + k]) { p.ellipse(x, 27 + up, 3, 1.4, '#1a1a1a'); p.set(x - 1, 26 + up, SP.b); p.set(x + 1, 26 + up, SP.b); }
  // 頭
  p.ellipse(20, 13 + up, 9, 8, SKN.b);
  p.ellipse(20, 17 + up, 7, 4, SKN.l);
  // 赤い かみ（とげとげ）
  for (let x = 11; x <= 29; x++) {
    const h = 3 + ((x * 7) % 5);
    p.vline(x, 4 - Math.floor(h / 2) + up, 7 + up, x % 3 ? HR.b : HR.l);
  }
  p.vline(10, 6 + up, 14 + up, HR.d); p.vline(30, 6 + up, 14 + up, HR.d);
  // つの
  p.vline(12, 1 + up, 5 + up, SP.b); p.set(11, 2 + up, SP.b); p.vline(28, 1 + up, 5 + up, SP.b); p.set(29, 2 + up, SP.b);
  // 目（太い まゆ）・はな・大きな 口と きば
  p.hline(14, 18, 10 + up, HR.d); p.hline(22, 26, 10 + up, HR.d);
  p.ellipse(16, 12 + up, 1.5, 1.5, '#ffffff'); p.set(16, 12 + up, '#2a1a0a');
  p.ellipse(24, 12 + up, 1.5, 1.5, '#ffffff'); p.set(24, 12 + up, '#2a1a0a');
  p.ellipse(20, 15 + up, 3, 1.5, SKN.d); p.set(19, 15 + up, '#2a1a0a'); p.set(21, 15 + up, '#2a1a0a');
  p.hline(15, 25, 18 + up, '#5a1a0a'); p.hline(16, 24, 19 + up, '#a83a2a');
  p.set(16, 18 + up, SP.b); p.set(24, 18 + up, SP.b); p.set(17, 17 + up, SP.b); p.set(23, 17 + up, SP.b);
  // くびわ
  for (let x = 12; x <= 28; x += 4) { p.ellipse(x, 21 + up, 1.6, 1.2, '#2a2a2a'); p.set(x, 20 + up, SP.b); }
  return { p, oc: '#0a0a06' };
}
// マジカメック（40×40）: ほうきに のって ふわふわ
const KB = { d: '#1e2a7a', b: '#3a4ab8', l: '#6a7ae8' }; // 青い ローブ
function paintKamek(f) {
  const W = 40, H = 40, p = new Painter(W, H);
  const k = f % 2;
  const fy = k ? -2 : 0;
  p.ellipse(20, 38, 10, 1.5, '#06081a');
  // ほうき
  p.hline(4, 34, 28 + fy, '#8a5a2a'); p.hline(4, 34, 29 + fy, '#6a3a1a');
  for (let i = 0; i < 6; i++) p.vline(32 + i, 25 + fy + (i % 2), 32 + fy - (i % 3), i % 2 ? '#d8b860' : '#b8902a');
  // ローブ
  for (let y = 14; y < 29; y++) { const w = 4 + Math.floor((y - 14) * 0.45); p.hline(19 - w, 19 + w, y + fy, y % 4 ? KB.b : KB.l); }
  p.vline(19, 16 + fy, 28 + fy, '#f4f4f4');
  // 顔（黄色い くちばしの ような 口・まるい めがね）
  p.ellipse(19, 11 + fy, 5, 4, '#e8c870');
  p.ellipse(16, 11 + fy, 2, 2, '#f4f4f4'); p.ellipse(22, 11 + fy, 2, 2, '#f4f4f4');
  p.set(16, 11 + fy, '#1a1a2a'); p.set(22, 11 + fy, '#1a1a2a'); p.hline(18, 20, 11 + fy, '#8a8a8a');
  p.ellipse(19, 14 + fy, 3, 1.2, '#d8a840');
  // とんがりぼうし
  for (let y = 0; y < 8; y++) p.hline(19 - Math.floor(y * 0.9), 19 + Math.floor(y * 0.9), y + fy, KB.d);
  p.hline(11, 27, 7 + fy, KB.l); p.hline(12, 26, 8 + fy, '#f4f4f4');
  p.set(19, 0 + fy, KB.l);
  // つえ（先が ぴかぴか）
  p.vline(7, 8 + fy, 27 + fy, '#b8902a');
  p.ellipse(7, 7 + fy, 2, 2, k ? '#ff6a9a' : '#e83a6a');
  p.set(7, 6 + fy, '#ffffff');
  if (k) { p.set(4, 4, '#ffd8e8'); p.set(10, 3, '#ffd8e8'); } else { p.set(5, 9, '#ffd8e8'); p.set(9, 5, '#ffd8e8'); }
  // 手
  p.ellipse(9, 18 + fy, 2, 2, '#e8c870'); p.ellipse(28, 20 + fy, 2, 2, '#e8c870');
  return { p, oc: '#06081a' };
}

export function paintC8cSpecial(kind, dir, f) {
  switch (kind) {
    case 'c8c_bowser_npc': return paintBowser(f);
    case 'c8c_kamek_npc': return paintKamek(f);
    default: return null;
  }
}
export const C8C_SPECIALS = ['c8c_bowser_npc', 'c8c_kamek_npc'];
