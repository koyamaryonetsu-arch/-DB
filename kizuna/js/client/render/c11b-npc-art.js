// 第3部 第3章 第2幕「月の都と、名前のランプ」の とくべつな え（render/c9a-npc-art.js が まぜる）
// ※ ネタバレ注意（docs/plan-part3-c11b.md の 18）
// ・人（C11B_NPC_LOOKS）: おもての 都の 人（白と 銀。すました 服）・門番・うらの 町の 人（あたたかい 色）・ランプ守の トモシビ（ひげと つえ・ランプ）
// ・c11b_hotaru … 星の子 ホタル（小さく、おしりの あたりが ぽうっと 光る）
// ・c11b_keeper … ランプの 番人（場面の 絵。大きな ランプを かかえる。戦いの 絵は B班）
// ・c11b_oboro … 月の むかえ（場面の 絵。雲の 車に 乗った、白い 衣の 使い）
// ・c11b_shadow … 屋根の 上の 小さな かげ（すがたは 見せない。黒い かげと 三日月だけ）
//   もとの 昔話の 絵の しるし（竹・おじいさん おばあさん）は 使わない
import { Painter } from './pixel.js?v=cb02a9b15ddb';

export const C11B_NPC_LOOKS = {
  c11b_folkF1: { hair: '#f0f0ff', hairStyle: 'long', skin: 0, outfit: 'robe', robeMain: '#e8e8ff', robeTrim: '#b8c0f0', female: true },
  c11b_folkF2: { hair: '#d8e0ff', hairStyle: 'short', skin: 0, outfit: 'vest', cloth: '#c8d0f0', hat: 'cap', hatColor: '#ffffff' },
  c11b_folkF3: { hair: '#e8e8f8', hairStyle: 'short', skin: 0, outfit: 'tunic', cloth: '#d8dcff', small: true },
  c11b_guard: { hair: '#c8c8e8', hairStyle: 'short', skin: 0, outfit: 'armor', cloth: '#c8ccf0', hat: 'helmet', cape: '#6a7ad0' },
  c11b_folkB1: { hair: '#c89060', hairStyle: 'bun', skin: 1, outfit: 'apron', cloth: '#c87a40', female: true },
  c11b_folkB2: { hair: '#8a6040', hairStyle: 'short', skin: 1, outfit: 'vest', cloth: '#a85a3a', hat: 'bandana', hatColor: '#ffb060' },
  c11b_folkB3: { hair: '#d8a070', hairStyle: 'short', skin: 1, outfit: 'tunic', cloth: '#e09050', small: true },
  c11b_tomoshibi: { hair: 5, hairStyle: 'bald', skin: 1, outfit: 'robe', robeMain: '#7a4a30', robeTrim: '#ffb060', beard: true, cane: true, hat: 'cowl', hatColor: '#5a3424' },
};

// 星の子 ホタル（14×18。うすい 黄色の 服・おしりの あたりの 光）
function paintHotaru(dir, f) {
  const p = new Painter(14, 18);
  const k = f % 2;
  // 光（体の うしろで ぽうっと）
  p.ellipse(7, 13, 5, 3, k ? '#fff8a0' : '#ffe870');
  p.ellipse(7, 13, 3, 2, '#ffffff');
  // 体
  for (let y = 9; y < 15; y++) { const w = 2 + Math.floor((y - 9) / 2); p.hline(7 - w, 6 + w, y, '#f0e070'); }
  p.set(5, 15, '#8a7a40'); p.set(8, 15, '#8a7a40');
  // 顔と かみ
  p.ellipse(7, 6, 3.5, 3.5, '#ffe8c8');
  p.hline(4, 10, 3, '#c8a040'); p.hline(3, 11, 4, '#c8a040'); p.set(3, 5, '#c8a040'); p.set(11, 5, '#c8a040');
  if (dir !== 'up') { p.set(6, 6, '#2a2a2a'); p.set(8, 6, '#2a2a2a'); p.set(7, 8, '#e07a7a'); }
  // 頭の 小さな 星
  p.set(7, 1 - k + 1, '#ffffff'); p.set(6, 2, '#fff8a0'); p.set(8, 2, '#fff8a0');
  // 手まねき
  if (dir === 'left' || dir === 'down') { p.set(2, 9 - k, '#ffe8c8'); p.set(1, 8 - k, '#ffe8c8'); }
  return { p, oc: '#3a3020' };
}
// ランプの 番人（28×30。白い ころもの 大きな 体・大きな ランプ）
function paintKeeper(dir, f) {
  const p = new Painter(28, 30);
  const k = f % 2;
  p.ellipse(14, 29, 9, 1, '#1a1a30');
  for (let y = 10; y < 28; y++) { const w = 6 + Math.floor((y - 10) / 3); p.hline(14 - w, 13 + w, y, '#d8d4f0'); }
  p.vline(14, 11, 27, '#a8a4d0');
  p.ellipse(14, 7, 5, 5, '#c8c4e8'); p.rect(10, 5, 9, 3, '#4a4870'); p.set(12, 6, '#fff0a0'); p.set(16, 6, '#fff0a0');
  // 大きな ランプ（むねの 前）
  p.rect(9, 14, 10, 10, '#a8801e'); p.rect(10, 15, 8, 8, k ? '#fff8c8' : '#ffe070'); p.set(14, 18, '#ffffff');
  p.hline(9, 18, 13, '#6a5010'); p.hline(9, 18, 24, '#6a5010');
  return { p, oc: '#1a1830' };
}
// 月の むかえ（30×30。雲の 車と 白い 衣。顔は 見えにくい ほど 白く）
function paintOboro(dir, f) {
  const p = new Painter(30, 30);
  const k = f % 2;
  // 雲の 車
  for (const [x, y, r] of [[8, 24, 6], [15, 25, 7], [22, 24, 6], [11, 21, 5], [19, 21, 5]]) p.ellipse(x + (k && x > 15 ? 1 : 0), y, r, r * 0.6, '#f4f4ff');
  p.ellipse(15, 26, 10, 2, '#c8c8e8');
  // 使い（白い 衣・長い そで・うすい 光の わ）
  p.ellipse(15, 6, 7, 2, k ? '#fff8d0' : '#f0e8c0');
  for (let y = 10; y < 22; y++) { const w = 3 + Math.floor((y - 10) / 2); p.hline(15 - w, 14 + w, y, '#ffffff'); }
  p.hline(8, 22, 14, '#e0e0f8'); p.set(8, 15, '#e0e0f8'); p.set(22, 15, '#e0e0f8');
  p.ellipse(15, 8, 3, 3, '#f8f0f0');
  p.hline(12, 18, 5, '#2a2a4a'); p.hline(11, 19, 6, '#2a2a4a'); p.vline(11, 7, 12, '#2a2a4a'); p.vline(19, 7, 12, '#2a2a4a');
  if (dir !== 'up') { p.set(14, 8, '#6a6a8a'); p.set(16, 8, '#6a6a8a'); }
  return { p, oc: '#8a8ab0' };
}
// 屋根の 上の 小さな かげ（すがたは 見せない）
function paintShadow(dir, f) {
  const p = new Painter(16, 22);
  p.ellipse(8, 20, 5, 1, '#000000');
  for (let y = 8; y < 20; y++) { const w = 2 + Math.floor((y - 8) / 3); p.hline(8 - w, 7 + w, y, '#0a0a14'); }
  p.ellipse(8, 6, 3, 3, '#0a0a14');
  // 暗い 三日月（足もと）
  for (let x = 2; x < 14; x++) p.set(x, 19 + (Math.abs(x - 8) > 4 ? -1 : 0), f % 2 ? '#3a3a6a' : '#2a2a5a');
  return { p, oc: null };
}

export function paintC11bSpecial(kind, dir, f) {
  switch (kind) {
    case 'c11b_hotaru': return paintHotaru(dir, f);
    case 'c11b_keeper': return paintKeeper(dir, f);
    case 'c11b_oboro': return paintOboro(dir, f);
    case 'c11b_shadow': return paintShadow(dir, f);
    default: return null;
  }
}
export const C11B_SPECIALS = ['c11b_hotaru', 'c11b_keeper', 'c11b_oboro', 'c11b_shadow'];
