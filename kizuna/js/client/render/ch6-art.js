// 第2部 第6章 Step 1・2 の 人の え と とくべつな え（render/chars.js が まぜる）
// 人（CH6_NPC_LOOKS）: トキネ（光の 砂の 精。小さな 女の子・すきとおった 羽）・リオン（最初の 紋章の 勇者。木の 剣と 赤い マント）・
//   ミナモ（星読みの むすめ。水色の ころもと 青い かみ）・ホシヨ（ホシフルの里の むすめ。ホシミばあちゃんと おなじ むらさき）・
//   千年前の 人たち（past_*）・泉の里の 人たち（spring_*）と、時が 止まった 灰色の すがた（frozen_*）
// とくべつな え（paintCh6Special）: はじまりの勇者の像（ふつう・うすく 消えかけた）・星の木（大きな 木）・星の木の なえ・やわらかい 土・
//   星のしずく・テント・いのりの 石・ちびアステル・影の時計師ゼンマイ・ゼンマイの番兵ギアドン（番人の 間の 人の すがた）
import { Painter } from './pixel.js?v=2173b59e8cbd';
// 第6章 Step 3・4: オリハ・コトハ・星くいのよる鳥・ペンデュラ・タイムカプセル・きらきらの石（render/ch6-road-npc-art.js。ここで まぜる）
import { ROAD_NPC_LOOKS, paintRoadSpecial, ROAD_SPECIALS } from './ch6-road-npc-art.js?v=2173b59e8cbd';

const GRAY = { hair: '#9a9aa2', skin: '#c4c6cc', cloth: '#8a8c94', trim: '#b4b6bc' };
const person = (o) => o;
const frozen = (o) => ({ ...o, hair: GRAY.hair, skin: GRAY.skin, cloth: GRAY.cloth, robeMain: o.robeMain ? GRAY.cloth : undefined, robeTrim: o.robeTrim ? GRAY.trim : undefined, hatColor: o.hat ? GRAY.trim : undefined, cape: o.cape ? GRAY.cloth : undefined });
const SPRING = {
  man: { hair: 0, hairStyle: 'short', skin: 1, outfit: 'tunic', cloth: '#3a7a9a', hat: 'headband', hatColor: '#d8c8a0' },
  woman: { hair: 1, hairStyle: 'bun', skin: 0, outfit: 'dress', cloth: '#4a9ab0', female: true },
  kid: { hair: 1, hairStyle: 'short', skin: 1, outfit: 'tunic', cloth: '#5ab0c8', small: true },
  elder: { hair: 5, hairStyle: 'bun', skin: 0, outfit: 'robe', robeMain: '#5a7a8a', robeTrim: '#d8e8f0', female: true, cane: true, hunch: true },
  girl: { hair: 3, hairStyle: 'twin', skin: 0, outfit: 'dress', cloth: '#7ac8d8', female: true, small: true },
};
export const CH6_NPC_LOOKS = {
  tokine: person({ hair: '#f0d070', hairStyle: 'long', skin: '#fbecc8', outfit: 'dress', cloth: '#f8dc90', female: true, small: true, hat: 'circlet', hatGem: '#ffffff', wings: '#fff4c8', wingSize: 'small' }),
  rion: person({ hair: '#5a3a1e', hairStyle: 'spiky', skin: 1, outfit: 'tunic', cloth: '#3a6ac8', cape: '#c83a3a', weapon: { cat: 'sword', blade: '#c8a068', guard: '#6a4a22' } }),
  minamo: person({ hair: '#2a5aa8', hairStyle: 'long', skin: 0, outfit: 'robe', robeMain: '#eef6ff', robeTrim: '#4a8ad8', female: true, hat: 'circlet', hatGem: '#7ad8ff', cape: '#7ab8e8' }),
  hoshiyo: person({ hair: '#5a3a6a', hairStyle: 'bun', skin: 0, outfit: 'dress', cloth: '#7a6aa8', female: true }),
  past_elder: person({ hair: 5, hairStyle: 'long', skin: 1, outfit: 'robe', robeMain: '#8a6a3a', robeTrim: '#e8c050', beard: true, cane: true }),
  past_woman: person({ hair: 1, hairStyle: 'bun', skin: 0, outfit: 'dress', cloth: '#8a5a3a', female: true }),
  past_woman2: person({ hair: 0, hairStyle: 'pony', skin: 1, outfit: 'apron', cloth: '#6a7a3a', female: true }),
  past_man: person({ hair: 0, hairStyle: 'short', skin: 1, outfit: 'tunic', cloth: '#7a5a2a', hat: 'headband', hatColor: '#c8a060', beard: true }),
  past_man2: person({ hair: 1, hairStyle: 'short', skin: 2, outfit: 'vest', cloth: '#5a6a3a' }),
  past_kid: person({ hair: 1, hairStyle: 'spiky', skin: 1, outfit: 'tunic', cloth: '#a86a3a', small: true }),
  past_girl: person({ hair: 3, hairStyle: 'twin', skin: 0, outfit: 'dress', cloth: '#c87a4a', female: true, small: true }),
  past_granny: person({ hair: 5, hairStyle: 'bun', skin: 0, outfit: 'robe', robeMain: '#6a5a4a', robeTrim: '#d8c8a0', female: true, cane: true, hunch: true }),
  ...Object.fromEntries(Object.entries(SPRING).flatMap(([k, o]) => [[`spring_${k}`, o], [`frozen_${k}`, frozen(o)]])),
  ...ROAD_NPC_LOOKS,
};

// ───────────── とくべつな え ─────────────
const ST = { d: '#5a5a66', b: '#8a8a98', l: '#b4b4c2', hl: '#dcdce6' };
// はじまりの勇者の像（剣を かかげた 少年。台座つき）。faded … うすく 消えかけている（ドットを まばらに）
function paintStatue(faded) {
  const W = 16, H = 32, p = new Painter(W, H);
  const keep = (x, y) => !faded || (x + y) % 2 === 0 || (y > 25 && (x + y) % 3 !== 0);
  const set = (x, y, c) => { if (keep(x, y)) p.set(x, y, c); };
  const rect = (x0, y0, w, h, c) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(x, y, c); };
  // 台座
  rect(1, 25, 14, 7, ST.d); rect(2, 25, 12, 6, ST.b); for (let x = 2; x < 14; x++) set(x, 25, ST.hl);
  for (let x = 4; x < 12; x++) set(x, 28, ST.d);
  // 足・体・マント
  rect(5, 19, 2, 6, ST.b); rect(9, 19, 2, 6, ST.b);
  rect(4, 11, 8, 9, ST.l); rect(3, 12, 2, 9, ST.b); rect(11, 12, 2, 9, ST.d);
  // 頭
  rect(5, 6, 6, 5, ST.l); set(6, 8, ST.d); set(9, 8, ST.d); for (let x = 5; x < 11; x++) set(x, 5, ST.b);
  // かかげた 剣（右手で 上へ）
  rect(12, 4, 2, 8, ST.b); for (let y = 0; y < 5; y++) set(12, y, ST.hl); set(13, 1, ST.hl); set(11, 4, ST.d); set(14, 4, ST.d);
  // 手の こうの 紋章
  set(12, 11, faded ? ST.l : '#f2d870');
  return { p, oc: faded ? null : '#2a2a34' };
}
// 星の木（大きな 木。葉の 中に 星の 光・みきに つた）48×56
function paintStarTree(f) {
  const W = 48, H = 56, p = new Painter(W, H);
  const TR = { d: '#4a2e16', b: '#6e4626', l: '#946036' }, LF = { d: '#1e5a32', b: '#2e7a42', l: '#4aa05a', hl: '#7ac87a' };
  p.ellipse(24, 54, 14, 2, '#2a3a1a');
  for (let y = 26; y < 55; y++) { const w2 = 3 + Math.round((y - 26) * 0.12); p.hline(24 - w2, 23 + w2, y, TR.b); p.set(24 - w2, y, TR.l); p.set(23 + w2, y, TR.d); }
  for (const [x0, x1, y] of [[17, 12, 50], [31, 36, 50]]) for (let k = 0; k <= 5; k++) p.set(Math.round(x0 + ((x1 - x0) * k) / 5), y + Math.floor(k / 2), TR.d);
  // つた（みきに まきつく）
  for (let y = 28; y < 54; y += 1) { const x = 24 + Math.round(Math.sin(y * 0.5) * 3); p.set(x, y, '#5aa04a'); if (y % 5 === 0) p.set(x + 1, y, '#8ad06a'); }
  // 葉の かたまり
  for (const [cx, cy, rx, ry] of [[24, 16, 20, 14], [12, 22, 10, 8], [36, 22, 10, 8], [24, 6, 12, 7]]) {
    p.ellipse(cx, cy, rx, ry, LF.d); p.ellipse(cx - 1, cy - 1, rx - 2, ry - 2, LF.b); p.ellipse(cx - 3, cy - 3, rx * 0.5, ry * 0.45, LF.l);
  }
  // 星の 光（2コマで またたく）
  const stars = [[14, 12], [30, 8], [20, 22], [36, 18], [26, 14], [10, 24], [40, 24], [22, 4], [32, 26]];
  stars.forEach(([x, y], i) => {
    const on = (i + f) % 2 === 0;
    const c = on ? '#fff6b0' : '#d8f0a0';
    p.set(x, y, '#ffffff'); p.set(x - 1, y, c); p.set(x + 1, y, c); p.set(x, y - 1, c); p.set(x, y + 1, c);
  });
  return { p, oc: '#142a14' };
}
function paintSapling(f) {
  const p = new Painter(12, 16);
  p.ellipse(6, 14.5, 5, 1.5, '#5a3e22'); p.hline(2, 9, 14, '#7a5a32');
  p.vline(6, 6, 14, '#5a8a3a');
  for (const [x, y] of [[4, 6], [8, 5], [3, 9], [9, 9], [6, 3]]) { p.ellipse(x, y, 2, 1.4, '#4aa05a'); p.set(x, y, f % 2 ? '#d8ffb0' : '#b8f090'); }
  p.set(6, 2, '#fff6b0');
  return { p, oc: '#1e3a14' };
}
function paintSeedSpot() {
  const p = new Painter(14, 8);
  p.ellipse(7, 5, 6, 2.5, '#6a4a28'); p.ellipse(7, 4.5, 5, 1.8, '#8a6438');
  for (const [x, y] of [[4, 4], [9, 5], [7, 3]]) p.set(x, y, '#a8804a');
  return { p, oc: '#3a2410' };
}
function paintDew(f) {
  const p = new Painter(10, 14);
  const k = f % 2;
  p.ellipse(5, 9, 3, 3.5, '#8ad8ff'); p.ellipse(5, 8.5, 2, 2.5, '#d8f6ff');
  p.set(5, 4, '#8ad8ff'); p.set(5, 5, '#8ad8ff'); p.set(4, 6, '#8ad8ff'); p.set(6, 6, '#8ad8ff');
  p.set(4, 8, '#ffffff');
  for (const [x, y] of k ? [[1, 3], [8, 6], [2, 12]] : [[8, 2], [1, 8], [8, 12]]) p.set(x, y, '#fff6b0');
  p.ellipse(5, 13, 3, 0.8, '#4a7a5a');
  return { p, oc: '#1a4a6a' };
}
function paintTent() {
  const W = 40, H = 28, p = new Painter(W, H);
  const C = { d: '#6a4a2a', b: '#a87a4a', l: '#c89a64', hl: '#e0b880' };
  for (let y = 2; y < 27; y++) { const half = Math.round(2 + (y - 2) * 0.72); p.hline(20 - half, 19 + half, y, C.b); p.set(20 - half, y, C.hl); p.set(19 + half, y, C.d); }
  for (let y = 4; y < 27; y += 5) p.hline(20 - Math.round(2 + (y - 2) * 0.72) + 1, 19 + Math.round(2 + (y - 2) * 0.72) - 1, y, C.l);
  // 入口
  for (let y = 14; y < 27; y++) { const half = Math.round((y - 14) * 0.45); p.hline(20 - half, 19 + half, y, '#2a1a0e'); }
  // 柱の 先
  p.vline(20, 0, 2, '#4a3018'); p.set(19, 0, '#4a3018');
  p.hline(0, 39, 27, '#5a3e22');
  return { p, oc: '#2a1a0e' };
}
function paintPrayerStone(f) {
  const p = new Painter(14, 22);
  p.ellipse(7, 20.5, 6, 1.5, '#3a3a3a');
  for (let y = 2; y < 21; y++) { const half = y < 5 ? 3 + y - 2 : 5; p.hline(7 - half, 6 + half, y, '#8a8a90'); p.set(7 - half, y, '#b0b0b8'); p.set(6 + half, y, '#5e5e66'); }
  const c = f % 2 ? '#fff0a0' : '#e8d070';
  for (let i = -2; i <= 2; i++) { p.set(7 + i, 10, c); p.set(7, 10 + i, c); }
  p.set(6, 9, c); p.set(8, 11, c); p.set(6, 11, c); p.set(8, 9, c);
  return { p, oc: '#2a2a30' };
}
// ちびアステル（千年前の 星の竜。まだ 子ども。小さな 羽を ぱたぱた）
function paintChibiAstel(dir, f) {
  const p = new Painter(20, 18);
  const B = { d: '#2a4a8a', b: '#4a7ad0', l: '#7aa8f0', belly: '#dce8ff' };
  p.ellipse(10, 15.5, 6, 1.4, '#1a2a3a');
  p.ellipse(10, 11, 6, 5, B.b); p.ellipse(10, 12, 4, 3, B.belly);
  p.ellipse(10, 5, 5, 4.2, B.b); p.ellipse(9, 4, 3, 2.4, B.l);
  // 目
  if (dir !== 'up') { p.set(8, 5, '#ffffff'); p.set(12, 5, '#ffffff'); p.set(8, 6, '#1a1a2a'); p.set(12, 6, '#1a1a2a'); }
  // つの
  p.set(7, 0, '#f2d870'); p.set(7, 1, '#f2d870'); p.set(13, 0, '#f2d870'); p.set(13, 1, '#f2d870');
  // 羽（2コマ）
  const up = f % 2 === 0;
  for (const s of [-1, 1]) {
    const x0 = 10 + s * 6;
    for (let k = 0; k < 4; k++) p.set(x0 + s * k, (up ? 7 : 10) - k + (up ? 0 : 2), B.d);
    p.set(x0 + s, up ? 6 : 10, B.l);
  }
  // しっぽ
  p.set(15, 14, B.d); p.set(16, 13, B.d); p.set(17, 12, '#f2d870');
  return { p, oc: '#101a34' };
}
// 影の時計師ゼンマイ（歯車と ぜんまいの 体の 影。目が 光る。2コマで 歯車が 回る）
function gear(p, cx, cy, r, c, cl, f) {
  p.ellipse(cx, cy, r, r, c);
  p.ellipse(cx, cy, r * 0.45, r * 0.45, '#100c18');
  const n = 8;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (f % 2) * (Math.PI / n);
    p.set(Math.round(cx + Math.cos(a) * (r + 1)), Math.round(cy + Math.sin(a) * (r + 1)), cl);
  }
}
function paintZenmai(f) {
  const p = new Painter(22, 30);
  const K = { d: '#14101e', b: '#2a2238', l: '#4a3e62', g: '#a8843a', gl: '#e0c070' };
  p.ellipse(11, 28.5, 7, 1.4, '#08060c');
  // ローブの 影
  for (let y = 9; y < 28; y++) { const half = Math.round(3 + (y - 9) * 0.32); p.hline(11 - half, 10 + half, y, K.b); p.set(11 - half, y, K.l); }
  // あたま（ぼうしの ような ぜんまい）
  p.ellipse(11, 6, 5, 4.5, K.b); p.ellipse(10, 5, 3, 2.4, K.l);
  for (let i = 0; i < 4; i++) p.set(11 + i, 1 - Math.floor(i / 2), K.g);
  p.set(15, 0, K.gl);
  // 光る 目
  p.set(9, 6, '#ff5a3a'); p.set(13, 6, '#ff5a3a');
  // むねの 歯車
  gear(p, 11, 15, 3, K.g, K.gl, f);
  // 手の 時計の はり
  p.vline(4, 14, 20, K.gl); p.set(3, 14, K.gl); p.vline(18, 13, 19, K.g);
  return { p, oc: '#05040a' };
}
// ゼンマイの番兵ギアドン（番人の 間の すがた。歯車の よろいの 大きな 番兵）44×44
function paintGeardon(f) {
  const W = 44, H = 44, p = new Painter(W, H);
  const M = { d: '#3a2e22', b: '#6a5a44', l: '#9a8a6a', hl: '#c8b48a', g: '#b8902e', gl: '#ffd860' };
  p.ellipse(22, 42.5, 16, 2, '#1a140e');
  // 足・体
  p.rect(12, 30, 7, 12, M.b); p.rect(25, 30, 7, 12, M.b); p.vline(12, 30, 41, M.l); p.vline(31, 30, 41, M.d);
  p.rect(9, 12, 26, 20, M.b); p.hline(9, 34, 12, M.hl); p.vline(9, 12, 31, M.l); p.vline(34, 12, 31, M.d);
  // うで（歯車の こぶし）
  p.rect(2, 14, 7, 14, M.b); p.rect(35, 14, 7, 14, M.b);
  gear(p, 5, 30, 4, M.g, M.gl, f); gear(p, 38, 30, 4, M.g, M.gl, f + 1);
  // あたま
  p.rect(15, 3, 14, 10, M.b); p.hline(15, 28, 3, M.hl);
  p.hline(17, 26, 7, '#1a1010'); p.set(19, 7, '#ff6a3a'); p.set(24, 7, '#ff6a3a');
  // むねの 大きな 歯車
  gear(p, 22, 21, 6, M.g, M.gl, f);
  p.set(22, 21, M.gl);
  return { p, oc: '#120c08' };
}

export function paintCh6Special(kind, dir, f) {
  switch (kind) {
    case 'hero_statue': return paintStatue(false);
    case 'hero_statue_faded': return paintStatue(true);
    case 'star_tree': return paintStarTree(f);
    case 'star_sapling': return paintSapling(f);
    case 'seed_spot': return paintSeedSpot();
    case 'star_dew': return paintDew(f);
    case 'past_tent': return paintTent();
    case 'prayer_stone': return paintPrayerStone(f);
    case 'chibi_astel': return paintChibiAstel(dir, f);
    case 'zenmai': return paintZenmai(f);
    case 'geardon_npc': return paintGeardon(f);
    default: return paintRoadSpecial(kind, dir, f);
  }
}
export const CH6_SPECIALS = ['hero_statue', 'hero_statue_faded', 'star_tree', 'star_sapling', 'seed_spot', 'star_dew', 'past_tent', 'prayer_stone', 'chibi_astel', 'zenmai', 'geardon_npc', ...ROAD_SPECIALS];
