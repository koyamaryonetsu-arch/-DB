// 第8章 第1幕「月の王宮のうらぎり」の 人の え と とくべつな え（render/c7i-npc-art.js が まぜる）
// ※ ネタバレ注意（docs/plan-ch8.md の 5）
// 人（C8A_NPC_LOOKS）: 大臣ジャハール（人の すがた。黒と 赤の 長い ローブ・赤い 玉の ターバン・とがった あごひげ・へびの つえ）・
//   まじないに かかった 緑の王（むらさきの ローブ・くもった 金の かんむり）・月の王宮の 番兵（こい 青の よろいと 銀の 三日月）・
//   お城の めし使い・王家の森の 番人
// とくべつな え（paintC8aSpecial）: オウムのイアゴン（4階の 大きな すがた 40×40。赤い 羽・黄色い くちばし）・
//   ねがいの ランプ（8階の 台の 上の 金の ランプ 36×28。コマで あやしく 光る）
import { Painter } from './pixel.js?v=b671a0f110f0';
// 第8章 第2幕: よみの王ハデロス・ナギの村の 人・ペイニックと パニクル・青い 火の 玉座（render/c8b-npc-art.js。ここで まぜる）
import { C8B_NPC_LOOKS, paintC8bSpecial, C8B_SPECIALS } from './c8b-npc-art.js?v=b671a0f110f0';

const person = (o) => o;
export const C8A_NPC_LOOKS = {
  c8a_jahar: person({
    hair: '#141018', hairStyle: 'short', skin: 2, outfit: 'robe', robeMain: '#1a1020', robeTrim: '#b8282e', beard: true,
    hat: 'turban', hatColor: '#2a1630', hatGem: '#e8303a', cape: '#7a1420',
    weapon: { cat: 'staff', blade: '#3a6a2a', guard: '#2a1a10', orb: '#e8303a' },
  }),
  c8a_king: person({ hair: 5, hairStyle: 'short', skin: 2, outfit: 'robe', robeMain: '#4a2e6a', robeTrim: '#9a8a5a', beard: true, hat: 'crown' }),
  c8a_guard: person({ hair: 0, hairStyle: 'short', skin: 2, outfit: 'armor', cloth: '#22306a', hat: 'helmet', hatColor: '#c8d0e4', weapon: { cat: 'spear', blade: '#e0e4ec', guard: '#8a6a1a' } }),
  c8a_maid: person({ hair: 1, hairStyle: 'bun', skin: 2, outfit: 'apron', cloth: '#3a6a8a', female: true, hat: 'bandana', hatColor: '#f4f0e8' }),
  c8a_ranger: person({ hair: 5, hairStyle: 'short', skin: 2, outfit: 'traveler', cloth: '#3a6a2a', beard: true, cane: true, hat: 'bandana', hatColor: '#6a8a3a' }),
  ...C8B_NPC_LOOKS,
};

// ───────────── とくべつな え ─────────────
// オウムのイアゴン（40×40）: まじないで 大きく なった 赤い オウム。つばさを 広げ、黄色い くちばしを 大きく 開けて さけぶ（コマで つばさが 上下）
function paintParrot(f) {
  const W = 40, H = 40, p = new Painter(W, H);
  const RD = { d: '#8a1418', b: '#d8282c', l: '#f85a4a' }, YE = { d: '#b88a10', b: '#f0c830', l: '#fff08a' }, BL = { d: '#1a3a8a', b: '#2a6ad8' }, GR = { d: '#1a6a2a', b: '#3aa84a' };
  p.ellipse(20, 38, 12, 2, '#2a1a10');
  // 足と とまり木
  p.hline(10, 30, 35, '#6a4a2a'); p.hline(10, 30, 36, '#4a3018');
  for (const x of [16, 23]) { p.vline(x, 31, 35, '#c8a050'); p.set(x - 1, 35, '#c8a050'); p.set(x + 1, 35, '#c8a050'); }
  // しっぽ（青と 赤の 長い 羽）
  for (let i = 0; i < 6; i++) { p.vline(19 + (i % 3) - 1, 30, 34 + (i >> 1), i % 2 ? BL.b : RD.d); }
  // つばさ（コマで 上下）
  const up = f % 2 ? -3 : 0;
  for (let i = 0; i < 12; i++) {
    const y = 12 + up + Math.floor(i * 0.6);
    p.hline(1 + i, 10, y, i % 3 ? RD.b : RD.d);
    p.hline(29, 38 - i, y, i % 3 ? RD.b : RD.d);
    if (i > 6) { p.set(1 + i, y, BL.b); p.set(38 - i, y, BL.b); p.set(2 + i, y, GR.b); p.set(37 - i, y, GR.b); }
  }
  // 体
  p.ellipse(20, 22, 9, 11, RD.d);
  p.ellipse(20, 21, 8, 10, RD.b);
  p.ellipse(19, 18, 4, 5, RD.l);
  // 頭と 目（いじわるそうな 目）
  p.ellipse(20, 10, 7, 6, RD.b);
  p.ellipse(16, 9, 2, 2, '#ffffff'); p.set(16, 9, '#141014'); p.hline(14, 18, 7, RD.d);
  p.ellipse(24, 9, 2, 2, '#ffffff'); p.set(24, 9, '#141014'); p.hline(22, 26, 7, RD.d);
  // くちばし（大きく 開けて さけぶ）
  p.ellipse(20, 14, 3, 2, YE.b); p.hline(18, 22, 13, YE.l); p.hline(18, 22, 16, YE.d);
  p.set(20, 15, '#3a0a0a');
  // かんむりの ような 頭の 羽
  for (let k = 0; k < 3; k++) p.vline(18 + k * 2, 2 + (k % 2), 5, k === 1 ? YE.b : RD.l);
  return { p, oc: '#1a0608' };
}
// ねがいの ランプ（36×28）: 台の 上の 金の ランプ。口から あやしい むらさきの けむり（コマで ゆれる）
function paintLamp(f) {
  const W = 36, H = 28, p = new Painter(W, H);
  const GO = { d: '#7a5a10', b: '#d8a830', l: '#f8e080', w: '#fffbe0' };
  p.ellipse(18, 26, 14, 2, '#1a1424');
  // 台
  p.rect(8, 20, 20, 6, '#3a3a5a'); p.hline(8, 27, 20, '#6a6a8a'); p.hline(8, 27, 25, '#22223a');
  // ランプ（体・とって・口）
  p.ellipse(17, 15, 9, 5, GO.d);
  p.ellipse(17, 14, 8, 4, GO.b);
  p.ellipse(15, 12.5, 4, 1.5, GO.l);
  p.rect(14, 18, 7, 2, GO.d); p.hline(13, 21, 19, GO.b);
  for (let i = 0; i < 4; i++) { p.set(6 - (i >> 1), 12 + i, GO.b); p.set(7, 11 + i, GO.d); }
  for (let i = 0; i < 7; i++) p.set(25 + i, 13 - (i >> 1), i % 2 ? GO.b : GO.l);
  p.ellipse(17, 9, 3, 2, GO.b); p.set(17, 7, GO.w);
  // けむり（コマで ゆれる）
  const k = f % 2;
  for (let i = 0; i < 6; i++) p.ellipse(32 - k + (i % 2), 9 - i * 1.4, 1.6 + i * 0.2, 1.2, i % 2 ? '#6a3a9a' : '#9a6ac8');
  p.set(16, 14, GO.w);
  return { p, oc: '#140c08' };
}

export function paintC8aSpecial(kind, dir, f) {
  switch (kind) {
    case 'c8a_parrot_npc': return paintParrot(f);
    case 'c8a_lamp_npc': return paintLamp(f);
    default: return paintC8bSpecial(kind, dir, f);
  }
}
export const C8A_SPECIALS = ['c8a_parrot_npc', 'c8a_lamp_npc', ...C8B_SPECIALS];
