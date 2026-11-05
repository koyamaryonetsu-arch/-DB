// 第7章 Step 3・4（第2幕）の 人の え と とくべつな え（render/c7-npc-art.js が まぜる）
// 人（C7S_NPC_LOOKS）: カイ（千年前の 海の 島の 少年。日やけ・茶色の とがった かみ・赤い はちまき・ブーメラン）・ナギの村の 人たち（c7s_*）・
//   灯台守の ゲンじい（カイの じいちゃん）・ホック船長（場面の すがた）
// とくべつな え（paintC7sSpecial）: ホック船長（灯台の てっぺんの 大きな すがた）・海賊船（しずむ前の島の 北の 海）
import { Painter } from './pixel.js?v=0e6cd5b18d1a';

const person = (o) => o;
export const C7S_NPC_LOOKS = {
  kai: person({
    hair: '#7a4a22', hairStyle: 'spiky', skin: 2, outfit: 'tunic', cloth: '#f0a030', hat: 'headband', hatColor: '#d83a3a', small: true,
    weapon: { cat: 'dagger', blade: '#e0e4ec', guard: '#8a5a32' },
  }),
  c7s_keeper: person({ hair: 5, hairStyle: 'bald', skin: 2, outfit: 'vest', cloth: '#2a4a7a', beard: true, cane: true, hat: 'bandana', hatColor: '#f0f0f0' }),
  c7s_oldwoman: person({ hair: 5, hairStyle: 'bun', skin: 2, outfit: 'robe', robeMain: '#3a7a8a', robeTrim: '#f0e0b0', female: true, cane: true, hunch: true }),
  c7s_woman: person({ hair: 1, hairStyle: 'pony', skin: 2, outfit: 'apron', cloth: '#3a9ab8', female: true, hat: 'bandana', hatColor: '#f0c040' }),
  c7s_man: person({ hair: 0, hairStyle: 'short', skin: 2, outfit: 'vest', cloth: '#2a7a9a', hat: 'headband', hatColor: '#f0f0f0' }),
  c7s_girl: person({ hair: 0, hairStyle: 'twin', skin: 2, outfit: 'dress', cloth: '#f07a8a', female: true, small: true }),
  c7s_kid: person({ hair: 0, hairStyle: 'spiky', skin: 2, outfit: 'tunic', cloth: '#5ac8a8', small: true }),
  c7s_oldman: person({ hair: 5, hairStyle: 'short', skin: 2, outfit: 'robe', robeMain: '#2a2a5a', robeTrim: '#f0d870', beard: true, cane: true, hat: 'wizard', hatColor: '#2a2a5a' }),
  c7s_sailor: person({ hair: 1, hairStyle: 'short', skin: 2, outfit: 'tunic', cloth: '#f4f4f4', hat: 'bandana', hatColor: '#2a5aa8' }),
  c7s_miko: person({ hair: '#1a2a4a', hairStyle: 'long', skin: 2, outfit: 'robe', robeMain: '#f4fbff', robeTrim: '#3a8ad8', female: true, hat: 'veil', cape: '#8ac8f0' }),
  c7s_captain: person({
    hair: '#1a1420', hairStyle: 'long', skin: 1, outfit: 'suit', cloth: '#b82a2a', beard: true, hat: 'feather', hatColor: '#1a1420', cape: '#7a1a1a',
    weapon: { cat: 'sword', blade: '#e0e4ec', guard: '#d8a030' },
  }),
};

// ───────────── とくべつな え ─────────────
// ホック船長（44×52）: 大きな 羽の ついた 黒い ぼうし・黒い まき毛・赤い 長い コート・金の ボタン・右手の 金の かぎ
function paintCaptain(f) {
  const W = 44, H = 52, p = new Painter(W, H);
  const RD = { d: '#6a1414', b: '#b82a2a', l: '#e05a4a' }, SK = { d: '#c88a6a', b: '#f0c0a0', l: '#fbe0c8' }, GO = { d: '#8a5a14', b: '#d8a030', l: '#f8d870' };
  const HA = '#1a1420';
  p.ellipse(22, 50, 15, 2, '#140a0a');
  // 足（黒い ブーツ）
  p.rect(15, 42, 5, 8, '#1a1418'); p.rect(24, 42, 5, 8, '#1a1418'); p.hline(14, 20, 49, '#2a2428'); p.hline(23, 29, 49, '#2a2428');
  // コート（すそが 広がる）
  for (let y = 20; y < 44; y++) { const w = 7 + Math.round((y - 20) * 0.3); p.hline(22 - w, 21 + w, y, RD.b); p.set(22 - w, y, RD.l); p.set(21 + w, y, RD.d); }
  p.vline(22, 22, 43, RD.d);
  for (const y of [24, 28, 32, 36]) { p.set(20, y, GO.l); p.set(24, y, GO.l); }
  // 白い えりかざり
  p.ellipse(22, 21, 4, 2.5, '#f4f4f4'); p.set(22, 23, '#d8d8d8');
  // うで（左手は こし・右手を ふり上げて 金の かぎ。コマで かぎが ゆれる）
  p.rect(8, 22, 6, 4, RD.b); p.rect(9, 26, 4, 4, SK.b);
  const hy = 10 + (f % 2);
  p.rect(30, 16, 5, 8, RD.b); p.rect(33, hy + 4, 4, 4, RD.l);
  p.vline(35, hy, hy + 4, GO.b); p.hline(35, 38, hy, GO.b); p.vline(38, hy, hy + 3, GO.b); p.set(37, hy + 3, GO.l); p.set(36, hy, GO.l);
  // かお・まき毛・ひげ
  p.ellipse(22, 14, 5, 5.5, SK.b); p.ellipse(21, 13, 2, 2, SK.l);
  p.set(20, 13, '#1a1420'); p.set(24, 13, '#1a1420'); p.hline(19, 25, 16, HA); p.set(18, 17, HA); p.set(26, 17, HA);
  for (const [x, y] of [[15, 12], [15, 16], [16, 20], [29, 12], [29, 16], [28, 20]]) p.ellipse(x, y, 2, 2.5, HA);
  // ぼうし（大きな つば・白い 羽）
  p.ellipse(22, 8, 11, 2.5, HA); p.rect(16, 2, 12, 6, HA); p.hline(16, 27, 2, '#3a3040');
  p.ellipse(30, 3, 5, 2, '#f8f8f8'); p.ellipse(33, 2, 3, 1.5, '#ffffff'); p.set(27, 4, '#d8d8d8');
  return { p, oc: '#0a0408' };
}
// 海賊船（48×40）: 茶色の 船・帆ばしら・白い 帆に かぎの しるし・ゆれる 波
function paintShip(f) {
  const W = 48, H = 40, p = new Painter(W, H);
  const WD = { d: '#4a2a14', b: '#7a4a22', l: '#a86a3a' };
  const bob = f % 2;
  // 波
  p.ellipse(24, 37, 22, 3, '#1e5a9a'); p.hline(2, 45, 36 - bob, '#8ac8f0');
  // 船の 体
  for (let y = 26; y < 36; y++) { const w = 20 - Math.round((y - 26) * 0.9); p.hline(24 - w, 23 + w, y - bob, WD.b); p.set(24 - w, y - bob, WD.l); p.set(23 + w, y - bob, WD.d); }
  p.hline(4, 43, 26 - bob, WD.l); p.hline(6, 41, 30 - bob, WD.d);
  for (const x of [12, 20, 28, 36]) p.ellipse(x, 28 - bob, 1.2, 1.2, '#1a1418');
  // 帆ばしら・帆
  p.vline(24, 2 - bob, 26 - bob, WD.d);
  p.rect(13, 5 - bob, 22, 16, '#f0ead8'); p.vline(13, 5 - bob, 20 - bob, '#c8c0a8'); p.hline(13, 34, 20 - bob, '#c8c0a8');
  // 帆の かぎの しるし
  const sy = 9 - bob;
  p.vline(24, sy, sy + 6, '#2a2a2a'); p.hline(24, 28, sy + 6, '#2a2a2a'); p.vline(28, sy + 3, sy + 6, '#2a2a2a'); p.set(27, sy + 3, '#2a2a2a');
  // 旗
  p.rect(24, 0, 6, 3, '#1a1418'); p.set(26, 1, '#f8f8f8');
  return { p, oc: '#120a06' };
}

export function paintC7sSpecial(kind, dir, f) {
  switch (kind) {
    case 'c7s_captain_npc': return paintCaptain(f);
    case 'c7s_ship_npc': return paintShip(f);
    default: return null;
  }
}
export const C7S_SPECIALS = ['c7s_captain_npc', 'c7s_ship_npc'];
