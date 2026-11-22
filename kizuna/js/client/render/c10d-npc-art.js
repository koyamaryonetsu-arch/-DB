// 第3部 第2章 第4幕「金の音と、星の橋」の とくべつな え（render/c9a-npc-art.js が まぜる）
// ※ ネタバレ注意（docs/plan-part3-c10d.md の 16）
// ・c10d_guard・c10d_guard_s … 門の 番人（鏡の かけらで できた 兵。フィールドの 絵。戦いの 絵は B班）
// ・c10d_mirror_f … 空から 下りて くる 大きな 鏡（金の ふち・ねむそうで いばった 顔・まわりに 小さな 手鏡。場面の 絵。戦いの 絵は B班）
//   もとの 作品の 絵の しるし（緑の 顔だけが うかぶ 鏡・仮面の 顔）は 使わない
// ・c10d_ped1_on … 星の音を 置いた 金の 台（光る）/ c10d_ped8 … 8つめの、何も ない 台
// ・c10d_bridge … 星見の丘から 空へ のびて、とちゅうで 止まった 光の 橋 / c10d_glow … 像が しずかに 光る（光だけ。像の 前に かさねる）
import { Painter } from './pixel.js?v=9619c3d748be';

function paintGuard(dir, f, small) {
  const W = small ? 14 : 18, H = small ? 18 : 24;
  const p = new Painter(W, H);
  const k = f % 2;
  const cx = W / 2;
  p.ellipse(cx, H - 1, W / 2 - 2, 1.2, '#1a1a30');
  // かけらの 体（とがった 三角を 組んだ 形・色の まくが ほんのり）
  const body = ['#c8d8f0', '#a8b8e0', '#e8f0ff'];
  const top = small ? 3 : 4;
  for (let y = top; y < H - 3; y++) {
    const w = Math.round((W / 2 - 2) * (0.45 + 0.55 * ((y - top) / (H - 3 - top))));
    p.hline(Math.round(cx - w), Math.round(cx + w - 1), y, body[(y + k) % 3]);
  }
  // 頭（ひし形の かけら）と 目
  p.ellipse(cx, top, small ? 2.5 : 3.5, small ? 2.5 : 3.5, '#d8e4ff');
  if (dir !== 'up') { p.set(Math.round(cx - 1), top, '#5a3ab8'); p.set(Math.round(cx + 1), top, '#5a3ab8'); }
  // かけらの やり
  const sx = dir === 'left' ? 1 : W - 2;
  p.vline(sx, top - 2, H - 4, '#e8f0ff'); p.set(sx, top - 3, '#ffffff');
  // 色の まく（虹色の ふち）
  const ring = ['#ff7a7a', '#ffe070', '#7ae08a', '#7ab8ff', '#ffffff', '#c890ff'];
  p.set(1, Math.round(H / 2), ring[(f) % 6]); p.set(W - 2, Math.round(H / 2) - 2, ring[(f + 3) % 6]);
  return { p, oc: '#2a2a50' };
}

function paintMirror(f, cracked = false) {
  const W = 32, H = 40, p = new Painter(W, H);
  const k = f % 2;
  const G = '#e8c040', GL = '#fff0a0', GD = '#a8801e';
  // 金の ふち（たまご形）
  p.ellipse(16, 19, 13, 17, GD);
  p.ellipse(16, 19, 12, 16, G);
  p.ellipse(15, 17, 11, 15, GL);
  p.ellipse(16, 19, 10, 14, G);
  // かがみ（うすい 銀と 空の 色）
  p.ellipse(16, 19, 9, 13, '#c8d4ec');
  p.ellipse(14, 15, 5, 7, '#e8f0ff');
  // ねむそうで いばった 顔（半分 とじた 目・上を むいた 鼻・すました 口）
  p.hline(10, 13, 17, '#5a5a80'); p.hline(19, 22, 17, '#5a5a80');
  p.hline(10, 13, 16, '#8a8ab0'); p.hline(19, 22, 16, '#8a8ab0');
  p.set(11, 18, '#3a3a60'); p.set(20, 18, '#3a3a60');
  p.hline(9, 13, 14, '#7a7aa0'); p.hline(19, 23, 13, '#7a7aa0'); // まゆ（かたほう 上がる）
  p.set(16, 20, '#8a8ab0'); p.set(16, 21, '#8a8ab0'); p.set(17, 21, '#6a6a90');
  p.hline(13, 18, 25, '#7a5a8a'); p.set(19, 24, '#7a5a8a'); // すました 口
  // てっぺんの かざりと 下の 足
  p.ellipse(16, 2, 3, 2, G); p.set(16, 1, GL);
  p.rect(13, 35, 6, 3, GD); p.hline(11, 20, 38, G);
  // まわりの 小さな 手鏡
  for (const [x, y] of [[2, 8], [29, 10], [1, 28], [30, 30]]) {
    p.ellipse(x, y + (k ? 1 : 0), 1.6, 2, G); p.set(x, y + (k ? 1 : 0), '#e8f0ff');
  }
  // ひび（勝った あと。たおれない）
  if (cracked) {
    for (const [x, y] of [[21, 7], [20, 8], [20, 9], [19, 10], [18, 11], [18, 12], [17, 13], [19, 12], [20, 13], [21, 14], [15, 14], [14, 15], [13, 16], [12, 17], [17, 26], [18, 27], [16, 27], [15, 28]]) p.set(x, y, '#2a2a40');
    p.set(22, 6, '#ffffff'); p.set(12, 18, '#ffffff');
  }
  return { p, oc: '#3a2a10' };
}

function paintPedOn(f) {
  const p = new Painter(16, 16);
  const k = f % 2;
  p.ellipse(8, 14, 6, 1.5, '#1a1a24');
  p.rect(4, 8, 8, 6, '#8a8a9a'); p.hline(3, 12, 8, '#c8c8d8'); p.hline(3, 12, 13, '#5a5a6a');
  p.rect(3, 7, 10, 2, '#a8a8b8');
  p.ellipse(8, 7, 3, 1.4, '#c89a20');
  p.ellipse(8, 4 - k, 3, 3, '#e8c040'); p.ellipse(8, 4 - k, 1.6, 1.6, '#fff8c8');
  p.set(8, 0, '#fff8c8'); p.set(3, 3, '#ffe070'); p.set(13, 4, '#ffe070');
  return { p, oc: '#1a1a24' };
}
function paintPed8() {
  // 8つめの 台（ほかの 台と 同じ 形・何も のって いない。少しだけ 白っぽい 新しい 石）
  const p = new Painter(16, 16);
  p.ellipse(8, 14, 6, 1.5, '#1a1a24');
  p.rect(4, 8, 8, 6, '#9a9aaa'); p.hline(3, 12, 8, '#d8d8e8'); p.hline(3, 12, 13, '#6a6a7a');
  p.rect(3, 7, 10, 2, '#b8b8c8');
  p.ellipse(8, 7, 3, 1.4, '#7a7a8a');
  return { p, oc: '#1a1a24' };
}

// 星の橋（80×96。左下の 丘から 右上の 空へ。とちゅうで 光の つぶに なって 止まる）
// part … のびて いる とちゅう（1/3・2/3。先は 光の つぶ）/ 1 … とちゅうで 止まった 橋
function paintBridge(f, part = 1) {
  const W = 80, H = 96, p = new Painter(W, H);
  const k = f % 2;
  const C = ['#ff7a7a', '#ffb060', '#ffe070', '#7ae08a', '#7ab8ff', '#f4f8ff', '#c890ff'];
  // 弓なりの 光の 道（x 0→62 で y 95→18）
  const yOf = (x) => Math.round(95 - (x / 62) * 70 - Math.sin((x / 62) * Math.PI) * 10);
  const end = Math.round(62 * part);
  for (let x = 0; x <= end; x++) {
    const y = yOf(x);
    const fade = part === 1 && x > 50 ? (62 - x) / 12 : 1;
    for (let i = 0; i < 7; i++) {
      if (fade < 1 && (x + i + k) % 2 === 0) continue;
      p.set(x, y - 3 + i, C[i]);
    }
    if (x % 6 === k * 3) p.set(x, y - 4, '#ffffff');
  }
  // のびて いる 先（まだ とちゅう）: 光の つぶ
  if (part < 1) {
    const ex = end, ey = yOf(end);
    for (let i = 0; i < 5; i++) p.set(ex + 1 + i, ey - 1 - ((i + k) % 3), i % 2 ? '#ffffff' : '#fff0a0');
    return { p, oc: null };
  }
  // とぎれた 先: 光の つぶが 空へ（「まだ 先が ある」）
  const ex = 62, ey = yOf(62);
  for (let i = 0; i < 9; i++) {
    const x = ex + 2 + i * 1.8, y = ey - 2 - i * 2.2 + ((i + k) % 2);
    p.set(Math.round(x), Math.round(y), i % 3 === 0 ? '#ffffff' : '#fff0a0');
  }
  p.set(ex + 16, ey - 21, '#ffffff'); p.set(ex + 17, ey - 22, '#fff8c8');
  return { p, oc: null };
}
function paintGlow(f) {
  // 像の まわりの しずかな 光（まん中は すける。左右に 光の 帯・足もとに 光の 輪・上に きらめき）
  const p = new Painter(24, 34);
  const k = f % 2;
  for (let y = 4; y < 31; y++) {
    const c = (y + k) % 3 === 0 ? '#ffffff' : '#ffe878';
    p.set(1, y, c); p.set(22, y, c);
    if (y % 2 === k) { p.set(2, y, '#fff4b0'); p.set(21, y, '#fff4b0'); }
  }
  p.hline(3, 20, 31, '#ffe070'); p.hline(5, 18, 32, '#fff8c8'); p.hline(2, 21, 30, '#fff0a0');
  for (const [x, y] of [[6, 1], [12, 0], [18, 2], [4, 6], [20, 8]]) { p.set(x, y + k, '#ffffff'); p.set(x, y + k + 1, '#ffe070'); }
  return { p, oc: null };
}

export function paintC10dSpecial(kind, dir, f) {
  switch (kind) {
    case 'c10d_guard': return paintGuard(dir, f, false);
    case 'c10d_guard_s': return paintGuard(dir, f, true);
    case 'c10d_mirror_f': return paintMirror(f);
    case 'c10d_mirror_c': return paintMirror(f, true);
    case 'c10d_ped1_on': return paintPedOn(f);
    case 'c10d_ped8': return paintPed8();
    case 'c10d_bridge': return paintBridge(f);
    case 'c10d_bridge1': return paintBridge(f, 1 / 3);
    case 'c10d_bridge2': return paintBridge(f, 2 / 3);
    case 'c10d_glow': return paintGlow(f);
    default: return null;
  }
}
export const C10D_SPECIALS = ['c10d_guard', 'c10d_guard_s', 'c10d_mirror_f', 'c10d_mirror_c', 'c10d_ped1_on', 'c10d_ped8', 'c10d_bridge', 'c10d_bridge1', 'c10d_bridge2', 'c10d_glow'];
