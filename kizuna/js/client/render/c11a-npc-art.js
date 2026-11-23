// 第3部 第3章 第1幕「星の船と、星座の島」の とくべつな え（render/c9a-npc-art.js が まぜる）
// ※ ネタバレ注意（docs/plan-part3-c11a.md の 17）
// ・c11a_starship … 星の船（場面の 絵。7色の 光の ほ）/ paintStarShip … 星の海で 乗って いる 時の 船（client/field.js の shipSprite）
// ・c11a_pirateship … 海ぞく船（黒い ほ）/ c11a_captain … いかり船長（フィールドの 絵。片手が いかり。戦いの 絵は B班）/
//   c11a_shark … 時計の 音が する サメの せびれ / c11a_mooncity … 門の むこうの 月の 形の 都（とおくの かげ）
// ・c11a_dock_sign … 星見の丘の 星の船の 乗り場（光の 柱と 小さな 船）
// ・人（C11A_NPC_LOOKS）: とまり木の島の 光の 弱い 星の 人たち（うすい 色）・おばあさん星の ヨイ
//   もとの お話の 絵の しるし（海ぞくの かぎの 手・ワニ）は 使わない（手は いかり・ワニでは なく サメ）
import { Painter } from './pixel.js?v=b63ba00e848c';

export const C11A_NPC_LOOKS = {
  c11a_yoi: { hair: '#d8d8f0', hairStyle: 'bun', skin: 0, outfit: 'robe', robeMain: '#6a6a9a', robeTrim: '#c8c0f0', female: true, hat: 'cowl', hatColor: '#8a88b8' },
  c11a_folk1: { hair: '#c8c8e8', hairStyle: 'long', skin: 0, outfit: 'apron', cloth: '#9a98c8', female: true },
  c11a_folk2: { hair: '#b8c0e0', hairStyle: 'short', skin: 0, outfit: 'vest', cloth: '#7a88b8', hat: 'cap' },
  c11a_folk3: { hair: '#d8d0f0', hairStyle: 'short', skin: 0, outfit: 'tunic', cloth: '#a8b0d8', small: true },
};

const SAILS = ['#ff7a7a', '#ffb060', '#ffe070', '#7ae08a', '#7ab8ff', '#f4f4ff', '#c890ff'];
// 星の船（乗って いる 時。30×26。shipSprite と 同じ 大きさ）
export function paintStarShip(dir, f) {
  const p = new Painter(30, 26);
  const b = f ? 1 : 0;
  const hull = '#c8b070', hullD = '#8a7040', hullL = '#fff0b0', star = '#fff8c8';
  if (dir === 'left' || dir === 'right') {
    for (let x = 3; x <= 26; x++) {
      const top = 16 + b, bot = (x < 6 || x > 23 ? 19 : 21) + b;
      for (let y = top; y <= bot; y++) p.set(x, y, y === top ? hullL : y === bot ? hullD : hull);
    }
    for (const x of [8, 14, 20]) p.set(x, 18 + b, star);
    p.vline(15, 2 + b, 15 + b, '#8a7040');
    SAILS.forEach((c, i) => p.hline(9 + Math.round(Math.sin((i / 6) * Math.PI) * -1), 21, 4 + i + b, c));
    p.set(15, 1 + b, '#ffffff');
  } else {
    for (let y = 15; y <= 21; y++) {
      const half = dir === 'up' ? 7 : y <= 18 ? 7 : y <= 20 ? 5 : 3;
      for (let x = 15 - half; x <= 14 + half; x++) p.set(x, y + b, y === 15 ? hullL : y === 21 ? hullD : hull);
    }
    p.vline(14, 2 + b, 15 + b, '#8a7040');
    SAILS.forEach((c, i) => p.hline(7, 22, 4 + i + b, c));
    p.set(14, 1 + b, '#ffffff');
  }
  p.set(4 + f, 23, '#c8d8ff'); p.set(25 - f, 23, '#c8d8ff');
  return p;
}
function paintBigShip(f, pirate) {
  const W = 40, H = 34, p = new Painter(W, H);
  const k = f % 2;
  const hull = pirate ? '#3a2a2a' : '#c8b070', hullD = pirate ? '#1a1010' : '#8a7040', hullL = pirate ? '#5a4040' : '#fff0b0';
  for (let x = 4; x <= 35; x++) {
    const top = 22 + k, bot = (x < 8 || x > 31 ? 27 : 30) + k;
    for (let y = top; y <= bot; y++) p.set(x, y, y === top ? hullL : y === bot ? hullD : hull);
  }
  p.vline(20, 2 + k, 22 + k, pirate ? '#2a1a1a' : '#8a7040');
  for (let i = 0; i < 7; i++) {
    const c = pirate ? (i % 2 ? '#2a2a3a' : '#3a3a4a') : SAILS[i];
    p.hline(10, 30, 5 + i * 2 + k, c); p.hline(10, 30, 6 + i * 2 + k, c);
  }
  if (pirate) {
    // 黒い ほの しるし（いかりの もよう）
    p.vline(20, 8 + k, 15 + k, '#d8d8d8'); p.hline(17, 23, 15 + k, '#d8d8d8'); p.set(16, 14 + k, '#d8d8d8'); p.set(24, 14 + k, '#d8d8d8'); p.hline(18, 22, 9 + k, '#d8d8d8');
  } else {
    for (const x of [10, 30]) p.set(x, 4 + k, '#ffffff');
    p.set(20, 1 + k, '#ffffff');
  }
  return { p, oc: pirate ? '#0a0a10' : '#3a2a10' };
}
// いかり船長（フィールドの 絵。えらそうで こわがり。大きな ぼうし・コート・片手が いかり）
function paintCaptain(dir, f) {
  const p = new Painter(18, 24);
  const k = f % 2;
  p.ellipse(9, 23, 5, 1, '#1a1a30');
  // コート
  for (let y = 11; y < 21; y++) { const w = 3 + Math.floor((y - 11) / 3); p.hline(9 - w, 8 + w, y, '#8a2a3a'); }
  p.vline(9, 12, 20, '#f2c14e');
  p.set(6, 21, '#2a1a1a'); p.set(11, 21, '#2a1a1a'); p.set(6, 22, '#2a1a1a'); p.set(11, 22, '#2a1a1a');
  // 顔と ひげ
  p.ellipse(9, 8, 3.5, 3.5, '#f0c8a0');
  if (dir !== 'up') { p.set(8, 8, '#2a1a1a'); p.set(10, 8, '#2a1a1a'); p.hline(7, 11, 10, '#3a2a2a'); p.set(6, 11, '#3a2a2a'); p.set(12, 11, '#3a2a2a'); }
  // 大きな ぼうし（つばの 広い 三角）
  p.hline(3, 15, 5, '#1a1a2a'); p.hline(5, 13, 4, '#1a1a2a'); p.hline(7, 11, 3, '#1a1a2a'); p.set(9, 2, '#1a1a2a');
  p.set(9, 4, '#f2c14e');
  // 片手は いかり
  const ax = dir === 'left' ? 2 : 15;
  p.vline(ax, 12 + k, 18 + k, '#a8a8b8');
  p.hline(ax - 2, ax + 2, 18 + k, '#a8a8b8'); p.set(ax - 2, 17 + k, '#a8a8b8'); p.set(ax + 2, 17 + k, '#a8a8b8');
  p.set(ax, 11 + k, '#c8c8d8');
  return { p, oc: '#1a1020' };
}
// サメの せびれ（体の 中で 時計が 鳴る。時計の しるし）
function paintShark(f) {
  const p = new Painter(28, 16);
  const k = f % 2;
  for (let y = 2; y < 12; y++) { const w = Math.floor((y - 2) * 0.9); p.hline(12 - w + k, 13 + k, y, '#5a6a8a'); }
  p.hline(2, 26, 12, '#8ab8e8'); p.hline(0, 27, 13, '#c8e0ff');
  p.ellipse(9 + k, 9, 2.5, 2.5, '#f4f4f4'); p.set(9 + k, 8, '#2a2a2a'); p.set(10 + k, 9, '#2a2a2a');
  return { p, oc: '#1a2030' };
}
// 月の 形の 都（とおくの かげ。三日月の 上に 小さな 塔）
function paintMoonCity(f) {
  // 三日月（左に ふくらむ 形）の 内がわの 下の ふちに、白い 塔の 町
  const p = new Painter(48, 40);
  const inO = (x, y) => ((x - 22) / 17) ** 2 + ((y - 20) / 17) ** 2 <= 1;
  const inI = (x, y) => ((x - 30) / 15) ** 2 + ((y - 16) / 15) ** 2 <= 1;
  for (let y = 0; y < 40; y++) for (let x = 0; x < 48; x++) {
    if (!inO(x, y) || inI(x, y)) continue;
    const edge = !inO(x - 1, y) || !inO(x, y + 1);
    p.set(x, y, edge ? '#c8b870' : inI(x - 2, y + 1) ? '#fff8d0' : '#f0e0a0');
  }
  // 塔（三日月の 下の ふちに 立つ）
  for (const [x, h, c] of [[19, 6, '#d8d4f0'], [22, 9, '#e8e4ff'], [25, 13, '#ffffff'], [28, 8, '#e8e4ff'], [31, 5, '#d8d4f0']]) {
    let base = 39;
    while (base > 0 && !(inO(x, base) && !inI(x, base))) base--;
    for (; base > 0 && inO(x, base - 1) && !inI(x, base - 1); base--);
    p.rect(x, base - h, 2, h, c);
    p.set(x, base - h - 1, '#ffe070'); p.set(x + 1, base - h - 1, '#ffe070');
    if (h > 6) p.set(x, base - Math.floor(h / 2), '#a8a0d0');
  }
  p.set(40 + (f % 2), 5, '#ffffff'); p.set(6, 30 - (f % 2), '#fff8c8');
  return { p, oc: null };
}
// 星の船の 乗り場（光の 柱と 小さな 船）
function paintDockSign(f) {
  const p = new Painter(16, 24);
  const k = f % 2;
  for (let y = 0; y < 20; y++) { const c = (y + k) % 3 ? '#fff0a0' : '#ffffff'; p.set(7, y, c); p.set(8, y, c); }
  p.hline(3, 12, 20, '#c8b070'); p.hline(4, 11, 21, '#8a7040');
  SAILS.forEach((c, i) => p.set(4 + i, 18, c));
  return { p, oc: null };
}

export function paintC11aSpecial(kind, dir, f) {
  switch (kind) {
    case 'c11a_starship': return paintBigShip(f, false);
    case 'c11a_pirateship': return paintBigShip(f, true);
    case 'c11a_captain': return paintCaptain(dir, f);
    case 'c11a_shark': return paintShark(f);
    case 'c11a_mooncity': return paintMoonCity(f);
    case 'c11a_dock_sign': return paintDockSign(f);
    default: return null;
  }
}
export const C11A_SPECIALS = ['c11a_starship', 'c11a_pirateship', 'c11a_captain', 'c11a_shark', 'c11a_mooncity', 'c11a_dock_sign'];
