// 第7章 Step 5・6（第3幕）の 人の え と とくべつな え（render/c7s-npc-art.js が まぜる）
// ※ ネタバレ注意（docs/plan-ch7.md の 8）
// 人（C7I_NPC_LOOKS）: カイの影（カイと おなじ 形の 黒い すがた・むらさきの はちまき）・雪の精（白い ずきんの 小さな 雪の 子）
//   白雪の里の 人は 第3章の 竜守りの村の 人の え（snow_*・dragon_elder・yukina・shrine_priest）を つかう
// とくべつな え（paintC7iSpecial）: いばらの魔女マレフィナ（城の 前の 大きな すがた 44×52）・ねむる 氷の竜シラネ（玉座の 間 52×40）
import { Painter } from './pixel.js?v=b671a0f110f0';
// 第8章 第1幕: 大臣ジャハール・まじないの 王さま・月の王宮の 人・オウムのイアゴン・ねがいのランプ（render/c8a-npc-art.js。ここで まぜる）
import { C8A_NPC_LOOKS, paintC8aSpecial, C8A_SPECIALS } from './c8a-npc-art.js?v=b671a0f110f0';

const person = (o) => o;
export const C7I_NPC_LOOKS = {
  kai_shadow: person({
    hair: '#141020', hairStyle: 'spiky', skin: '#4a4060', outfit: 'tunic', cloth: '#2a2040', hat: 'headband', hatColor: '#6a2a9a', small: true,
    weapon: { cat: 'dagger', blade: '#5a4a7a', guard: '#2a1a3a' },
  }),
  c7i_spirit: person({ hair: '#f4fbff', hairStyle: 'long', skin: '#f0f8ff', outfit: 'robe', robeMain: '#f4fbff', robeTrim: '#9ad8ff', female: true, small: true, hat: 'hood', hatColor: '#e4f4ff' }),
  ...C8A_NPC_LOOKS,
};

// ───────────── とくべつな え ─────────────
// いばらの魔女マレフィナ（44×52）: 黒い 2本の つのの ずきん・青白い みどりの かお・黒い 長い ローブ（うらは むらさき）・
//   みどりの 玉の つえ・足もとの 黒い いばら（コマで 玉が 光る）
function paintMalefina(f) {
  const W = 44, H = 52, p = new Painter(W, H);
  const BK = { d: '#0e0a14', b: '#1e1828', l: '#3a3048' }, PU = { d: '#3a1050', b: '#6a2a8a', l: '#9a5ac0' };
  const SK = { d: '#7a9a80', b: '#b8d4b8', l: '#dcecd8' }, GR = { d: '#1a6a2a', b: '#4ac85a', l: '#b8ffb0' };
  p.ellipse(22, 50, 16, 2, '#0a0610');
  // 足もとの いばら
  for (const [x, y, d] of [[6, 46, 1], [36, 47, -1], [10, 49, 1], [32, 49, -1]]) {
    for (let i = 0; i < 8; i++) p.set(x + i * d, y - Math.round(Math.sin(i * 0.9) * 2), '#2a1a2a');
    p.set(x + 3 * d, y - 3, '#4a2a4a'); p.set(x + 6 * d, y + 1, '#4a2a4a');
  }
  // ローブ（すそが 広がる。うらの むらさきが 見える）
  for (let y = 20; y < 48; y++) {
    const w = 6 + Math.round((y - 20) * 0.45);
    p.hline(22 - w, 21 + w, y, BK.b); p.set(22 - w, y, PU.b); p.set(21 + w, y, PU.b); p.set(23 - w, y, PU.d); p.set(20 + w, y, PU.d);
  }
  p.vline(22, 22, 47, BK.d);
  // えりの 大きな かざり
  for (let i = 0; i < 6; i++) { p.set(14 + i, 18 - (i >> 1), BK.l); p.set(29 - i, 18 - (i >> 1), BK.l); }
  // うで（右手で つえ・左手を ひろげる）
  p.rect(7, 22, 7, 4, BK.b); p.rect(4, 20, 4, 4, SK.b);
  p.rect(30, 22, 6, 4, BK.b); p.rect(35, 21, 3, 3, SK.b);
  p.vline(37, 6, 47, '#3a2a1a'); p.vline(38, 6, 47, '#5a4a2a');
  const g = f % 2;
  p.ellipse(37.5, 5, 3.5, 3.5, GR.d); p.ellipse(37.5, 5, 2.5, 2.5, g ? GR.l : GR.b); p.set(37, 4, '#ffffff');
  // かお
  p.ellipse(22, 13, 5, 6, SK.b); p.ellipse(21, 12, 2, 2, SK.l);
  p.set(20, 13, '#e8c040'); p.set(24, 13, '#e8c040'); p.hline(20, 21, 11, BK.d); p.hline(23, 24, 11, BK.d);
  p.hline(21, 23, 16, '#8a1a3a');
  // 黒い ずきんと 2本の つの
  p.rect(15, 6, 3, 14, BK.b); p.rect(26, 6, 3, 14, BK.b); p.rect(16, 4, 12, 4, BK.b);
  for (let i = 0; i < 9; i++) { p.set(15 - (i >> 1), 5 - i, BK.l); p.set(16 - (i >> 1), 5 - i, BK.b); p.set(28 + (i >> 1), 5 - i, BK.l); p.set(27 + (i >> 1), 5 - i, BK.b); }
  return { p, oc: '#06030a' };
}
// ねむる 氷の竜シラネ（52×40）: 白と 水色の 竜が まるく なって ねむっている。とじた 目・せなかの 氷の とげ・つばさを たたんでいる（コマで いきの 白い もや）
function paintIceDragon(f) {
  const W = 52, H = 40, p = new Painter(W, H);
  const IC = { d: '#5a8ab8', b: '#b8dcf4', l: '#eaf6ff', w: '#ffffff' }, BL = { d: '#2a5a8a', b: '#6aa8e0' };
  p.ellipse(26, 37, 23, 3, '#3a5a7a');
  // しっぽ（前を まわる）
  for (let x = 6; x < 30; x++) { const y = 33 - Math.round(Math.sin((x - 6) * 0.18) * 2); p.vline(x, y, y + 2, IC.b); p.set(x, y, IC.l); }
  // 体（まるい）
  p.ellipse(28, 24, 16, 11, IC.d);
  p.ellipse(28, 23, 15, 10, IC.b);
  p.ellipse(26, 20, 9, 5, IC.l);
  // たたんだ つばさ
  for (let i = 0; i < 10; i++) { p.hline(42 - i, 42, 12 + i, BL.b); p.set(42 - i, 12 + i, BL.d); }
  for (let i = 0; i < 6; i++) p.set(42 - i, 15 + i, BL.d);
  // せなかの 氷の とげ
  for (const [x, h] of [[18, 4], [23, 5], [28, 5], [33, 4]]) { for (let k = 0; k < h; k++) p.hline(x - (h - k) / 2, x + (h - k) / 2, 13 - k, k % 2 ? IC.w : IC.l); }
  // 頭（左。とじた 目）
  p.ellipse(12, 24, 8, 6, IC.b); p.ellipse(11, 22, 5, 3, IC.l);
  p.ellipse(5, 27, 4, 3, IC.b); p.set(3, 27, BL.d); p.set(4, 26, BL.d);
  p.hline(10, 13, 23, BL.d); p.set(14, 22, BL.d);
  // つの
  for (let k = 0; k < 5; k++) { p.set(15 + k, 18 - k, IC.w); p.set(12 + (k >> 1), 18 - k, IC.l); }
  // いきの もや（コマで 大きさが かわる）
  const r = 2 + (f % 2);
  p.ellipse(1 + r, 31, r, r * 0.7, '#f4fbff');
  return { p, oc: '#1a2a3a' };
}

export function paintC7iSpecial(kind, dir, f) {
  switch (kind) {
    case 'c7i_witch_npc': return paintMalefina(f);
    case 'c7i_dragon_npc': return paintIceDragon(f);
    default: return paintC8aSpecial(kind, dir, f);
  }
}
export const C7I_SPECIALS = ['c7i_witch_npc', 'c7i_dragon_npc', ...C8A_SPECIALS];
