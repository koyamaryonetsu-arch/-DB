// 第8章 第3幕「くろがねの空中ようさい」の タイル（16×16 ドット）と 色（テーマ）。render/tiles-c8b.js が まぜる
// ・千年前の 空（367。3コマで 雲が 流れる）/ 今の つぶれた 鉄（368）/ かたむいた 鉄の 板（369）/ ゆかの あなの 森の 土（370）
// ・今の かたむいた ゆか（371〜374 北・東・南・西。3コマで 矢じるしが すべる）
// ・ようさいの しかけ: まわる プロペラ（375。3コマ）・止まった プロペラ（376）・西／東を 向いた たいほう（377・378）・開いた／しまった まどの シャッター（379・380）
// ・今の かべの すきまを 通る 木の 根（381）/ 千年前の ゆるんだ 鉄の 板（382）/ かべの すきま（383）/ 鉄の ポスト（384）
// ・今の まほうの じょうの とびら（385。3コマ）/ まほうの かべ（386。3コマ）/ ゆげの あな（387）/ ふき出した ゆげ（388。3コマ）
// ・千年前の 森の いかり（389）/ ようさいへ のぼる くさり（390）/ 今の 森の 残がいの 鉄の 板（391）/ しまった 出入り口（392）/ 開いた 出入り口（393）
// ・8階の まほうの おり（394。3コマ）
// (p, v, f, m) … Painter / ちがい / アニメの コマ / となりの ようす
import { T } from '../../shared/tiles.js?v=76aae2682384';
import { prand } from './pixel.js?v=76aae2682384';

const IR = { d: '#1e2028', b: '#3a3e4a', l: '#5a6070', hl: '#8a92a4', ln: '#14161c' }; // くろがね
const RU = { d: '#4a2a1a', b: '#7a4a2a', l: '#a8683a', hl: '#c88a50' }; // さび
const MO = { d: '#2a4a1e', b: '#4a7a32', l: '#7aa850', hl: '#a8d070' }; // こけ
const SK = { d: '#7ab0e0', b: '#a8d0f0', l: '#e0f0ff', w: '#ffffff' }; // 空
const BR = { d: '#6a4a10', b: '#b8862a', l: '#e8c060' }; // しんちゅう
const MG = { d: '#4a1a7a', b: '#9a4ad8', l: '#d8a8ff', w: '#f8eaff' }; // まほう
const SM = { d: '#a8a8b0', b: '#d8d8e0', l: '#f4f4f8' }; // ゆげ
const EA = { d: '#4a3220', b: '#6a4a2a', l: '#8a6a40' }; // 森の 土
const RD = { d: '#7a1a1a', b: '#c83a2a', l: '#f07050' }; // ポストの 赤

function ironFloor(p, v) {
  p.rect(0, 0, 16, 16, IR.b);
  p.hline(0, 15, 0, IR.ln); p.vline(0, 0, 15, IR.ln);
  p.hline(1, 15, 1, IR.l);
  for (const [x, y] of [[3, 3], [12, 3], [3, 12], [12, 12]]) { p.set(x, y, IR.hl); p.set(x + 1, y + 1, IR.d); }
  const r = prand(v * 31 + 7);
  for (let i = 0; i < 3; i++) p.set(1 + Math.floor(r() * 14), 1 + Math.floor(r() * 14), IR.d);
}
function grass(p, v) {
  p.rect(0, 0, 16, 16, '#5a8a3a');
  const r = prand(v * 13 + 5);
  for (let i = 0; i < 7; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? '#4a7a2a' : '#7aa850');
}
// 千年前の 空（ようさいの 外・ゆかの すきま）
export const SKY_FRAMES = 3;
function paintSky(p, v, f) {
  p.rect(0, 0, 16, 16, SK.b);
  p.rect(0, 10, 16, 6, SK.d);
  const k = f % SKY_FRAMES;
  const r = prand(v * 17 + 3);
  for (let i = 0; i < 3; i++) {
    const x = (Math.floor(r() * 16) + k * 2) % 16, y = 2 + Math.floor(r() * 10);
    p.ellipse(x, y, 3, 1.3, SK.l); p.set(x, y - 1, SK.w);
  }
  p.set((5 + k * 4) % 16, 13, SK.l);
}
// 今の つぶれた 鉄（さびた 板が おりかさなった 山）
function paintCrush(p, v) {
  p.rect(0, 0, 16, 16, RU.d);
  const r = prand(v * 23 + 9);
  for (let i = 0; i < 5; i++) {
    const x = Math.floor(r() * 12), y = Math.floor(r() * 12), w = 4 + Math.floor(r() * 5);
    for (let j = 0; j < w; j++) { p.set(Math.min(15, x + j), Math.min(15, y + Math.floor(j / 2)), i % 2 ? RU.b : RU.l); p.set(Math.min(15, x + j), Math.min(15, y + 1 + Math.floor(j / 2)), RU.d); }
  }
  for (let i = 0; i < 3; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), MO.b);
  p.set(Math.floor(r() * 16), Math.floor(r() * 16), RU.hl);
}
// 今の かたむいた 鉄の 板（歩ける）
function paintTilt(p, v) {
  p.rect(0, 0, 16, 16, RU.b);
  for (let y = 0; y < 16; y += 4) p.hline(0, 15, y, RU.d);
  for (let i = 0; i < 16; i++) p.set(i, (i + 8) % 16, RU.l);
  for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) p.set(x, y, RU.hl);
  const r = prand(v * 11 + 1);
  for (let i = 0; i < 2; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), MO.b);
}
// ゆかの あなの 森の 土（こけと 草）
function paintMoss(p, v) {
  p.rect(0, 0, 16, 16, EA.b);
  const r = prand(v * 7 + 19);
  for (let i = 0; i < 10; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 3 ? MO.b : MO.l);
  for (let i = 0; i < 3; i++) { const x = Math.floor(r() * 14), y = 3 + Math.floor(r() * 12); p.vline(x, y - 2, y, MO.l); p.set(x + 1, y - 1, MO.hl); }
  p.hline(0, 15, 0, RU.d); p.hline(0, 15, 15, RU.d); p.vline(0, 0, 15, RU.d); p.vline(15, 0, 15, RU.d);
}
// 今の かたむいた ゆか（すべる。矢じるしの むき）
export const SLIDE_FRAMES = 3;
function paintSlide(p, v, f, dir) {
  p.rect(0, 0, 16, 16, RU.l);
  for (let i = 0; i < 16; i += 2) p.set(i, i, RU.b);
  const k = (f % SLIDE_FRAMES) * 3;
  // ∨ の 形の 矢じるし 2つ（むきに あわせて まわす）
  const put = (a, b, c) => {
    const [x, y] = dir === 'n' ? [a, 15 - b] : dir === 's' ? [a, b] : dir === 'e' ? [b, a] : [15 - b, a];
    p.set(x, y, c);
  };
  for (const base of [1, 9]) {
    for (let j = 0; j < 5; j++) {
      const b = (base + k + j) % 16;
      put(3 + j, b, RU.d); put(12 - j, b, RU.d);
      put(3 + j, (b + 1) % 16, RU.hl); put(12 - j, (b + 1) % 16, RU.hl);
    }
  }
}
// まわる プロペラ・止まった プロペラ
export const PROP_FRAMES = 3;
function paintProp(p, v, f, on) {
  ironFloor(p, v);
  p.ellipse(8, 8, 7, 7, IR.d);
  p.ellipse(8, 8, 6, 6, IR.ln);
  const k = on ? f % PROP_FRAMES : 0;
  for (let b = 0; b < 3; b++) {
    const a = (b * 2 * Math.PI) / 3 + k * 0.7 + (on ? 0 : 0.3);
    for (let r = 1; r <= 5; r++) {
      const x = Math.round(8 + Math.cos(a) * r), y = Math.round(8 + Math.sin(a) * r);
      p.set(x, y, on ? IR.hl : RU.l);
      p.set(Math.round(8 + Math.cos(a + 0.25) * r), Math.round(8 + Math.sin(a + 0.25) * r), on ? IR.l : RU.b);
    }
  }
  p.ellipse(8, 8, 1.5, 1.5, BR.b); p.set(8, 8, BR.l);
  if (on) { p.set((2 + k * 5) % 16, 2, SK.l); p.set((13 - k * 4 + 16) % 16, 13, SK.l); }
}
// たいほう（西 … right=false / 東 … right=true）
function paintCannon(p, v, right) {
  ironFloor(p, v);
  p.ellipse(8, 12, 6, 2.5, IR.ln);
  p.rect(4, 8, 8, 5, BR.d); p.hline(4, 11, 8, BR.b);
  p.ellipse(5, 13, 2, 2, IR.d); p.ellipse(11, 13, 2, 2, IR.d); p.set(5, 13, BR.l); p.set(11, 13, BR.l);
  const x0 = right ? 6 : 1, x1 = right ? 15 : 10;
  p.rect(x0, 4, x1 - x0 + 1, 5, IR.d);
  p.hline(x0, x1, 4, IR.l); p.hline(x0, x1, 5, IR.hl);
  const mx = right ? 15 : 0;
  p.vline(mx, 3, 9, IR.ln); p.set(mx, 6, '#000000');
  p.vline(right ? 7 : 9, 4, 8, BR.b);
}
// まどの シャッター（開いた … 空が 見える / しまった … 鉄の 板）
function paintShutter(p, v, shut) {
  p.rect(0, 0, 16, 16, IR.d);
  p.rect(2, 2, 12, 11, IR.ln);
  if (!shut) {
    p.rect(3, 3, 10, 9, SK.b);
    p.ellipse(7, 6, 3, 1.2, SK.l); p.set(11, 9, SK.w);
    p.rect(3, 3, 10, 2, IR.l); p.hline(3, 12, 4, IR.hl);
  } else {
    for (let y = 3; y < 12; y++) p.hline(3, 12, y, y % 2 ? IR.b : IR.l);
  }
  p.vline(8, 2, 12, IR.ln);
  p.rect(1, 13, 14, 3, IR.b); p.hline(1, 14, 13, IR.hl);
  p.set(4, 14, BR.b); p.set(11, 14, BR.b);
}
// 今の かべの すきまを 通る 木の 根
function paintRoots(p, v) {
  p.rect(0, 0, 16, 16, RU.d);
  p.rect(1, 1, 14, 14, RU.b);
  p.vline(8, 0, 15, '#1a120a'); p.vline(7, 2, 13, '#1a120a');
  const R = ['#6a4a2a', '#8a6a3a', '#a8844a'];
  for (let i = 0; i < 3; i++) {
    let x = 4 + i * 4, y = 0;
    for (let s = 0; s < 16; s++) { p.set(x, y, R[(i + s) % 3]); p.set(x + 1, y, R[(i + s + 1) % 3]); y++; x += (s + i) % 4 === 0 ? (i === 1 ? 0 : i === 0 ? 1 : -1) : 0; x = Math.max(0, Math.min(14, x)); }
  }
  p.set(3, 4, MO.l); p.set(12, 10, MO.l); p.set(6, 12, MO.hl);
}
// 千年前の ゆるんだ 鉄の 板（ふつうの かべに 見えるが、びょうが 1つ ない）
function paintPlate(p, v) {
  p.rect(0, 0, 16, 16, IR.d);
  p.rect(1, 1, 14, 14, IR.b);
  p.hline(1, 14, 1, IR.l);
  for (const [x, y] of [[3, 3], [12, 3], [3, 12]]) { p.set(x, y, IR.hl); p.set(x + 1, y + 1, IR.ln); }
  p.set(12, 12, IR.ln); p.set(13, 13, IR.ln);
  p.vline(14, 2, 14, IR.ln); p.hline(2, 14, 14, IR.ln);
  p.set(13, 6, IR.l);
}
// 千年前の かべの すきま（歩ける）
function paintGap(p, v) {
  ironFloor(p, v);
  p.rect(0, 0, 3, 16, IR.d); p.rect(13, 0, 3, 16, IR.d);
  p.vline(3, 0, 15, IR.ln); p.vline(12, 0, 15, IR.ln);
  p.rect(14, 2, 2, 10, IR.l);
}
// 鉄の ポスト（赤い）
function paintMailbox(p, v) {
  ironFloor(p, v);
  p.ellipse(8, 14, 5, 1.5, IR.ln);
  p.rect(7, 9, 2, 5, IR.d);
  p.rect(4, 2, 8, 8, RD.b);
  p.hline(4, 11, 2, RD.l); p.vline(4, 2, 9, RD.l); p.vline(11, 2, 9, RD.d); p.hline(4, 11, 9, RD.d);
  p.hline(5, 10, 4, '#2a0a0a');
  p.set(9, 6, BR.l); p.set(10, 6, BR.b);
}
// 今の まほうの じょうの とびら
export const LOCK_FRAMES = 3;
function paintLockDoor(p, v, f) {
  p.rect(0, 0, 16, 16, RU.d);
  p.rect(1, 1, 14, 15, RU.b);
  p.vline(8, 1, 15, RU.d);
  for (const [x, y] of [[3, 3], [12, 3], [3, 13], [12, 13]]) p.set(x, y, RU.hl);
  const k = f % LOCK_FRAMES;
  p.ellipse(8, 8, 4, 4, k === 1 ? MG.b : MG.d);
  p.ellipse(8, 8, 2.5, 2.5, MG.l);
  p.set(8, 8, MG.w);
  p.set(8, 3 - (k === 2 ? 1 : 0), MG.l); p.set(4 + k, 8, MG.l); p.set(12 - k, 8, MG.l);
}
// まほうの かべ
export const BARRIER_FRAMES = 3;
function paintBarrier(p, v, f) {
  p.rect(0, 0, 16, 16, MG.d);
  const k = f % BARRIER_FRAMES;
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if ((x + y * 2 + k * 3 + v) % 7 === 0) p.set(x, y, MG.b);
  for (let i = 0; i < 4; i++) p.set((i * 5 + k * 2) % 16, (i * 3 + k) % 16, MG.w);
  p.hline(0, 15, (k * 5) % 16, MG.l);
}
// ゆげの あな（鉄の あみ）
function paintSteamFloor(p, v) {
  ironFloor(p, v);
  p.ellipse(8, 8, 5, 3, IR.ln);
  for (let x = 4; x <= 12; x += 2) p.vline(x, 6, 10, IR.l);
  p.ellipse(8, 8, 5, 3, IR.d); p.ellipse(8, 8, 4, 2, IR.ln);
  for (let x = 5; x <= 11; x += 2) p.vline(x, 7, 9, IR.hl);
}
// ふき出した ゆげ
export const STEAM_FRAMES = 3;
function paintSteam(p, v, f) {
  ironFloor(p, v);
  const k = f % STEAM_FRAMES;
  p.ellipse(8, 12, 6, 3, SM.d);
  for (let i = 0; i < 6; i++) {
    const y = 12 - i * 2 - (k % 2), x = 8 + Math.round(Math.sin(i + k) * 2);
    p.ellipse(x, y, 4 - i * 0.3, 2, i % 2 ? SM.b : SM.l);
  }
  p.set(3 + k, 2, SM.l); p.set(12 - k, 1, SM.b);
}
// 千年前の 森の いかり（くさりが 空へ）
function paintAnchor(p, v) {
  grass(p, v);
  p.ellipse(8, 14, 6, 1.5, '#3a5a2a');
  // いかり（下が 地面に ささった かぎ）
  p.vline(8, 5, 13, IR.d); p.vline(7, 5, 13, IR.l);
  p.hline(3, 12, 12, IR.d); p.set(3, 11, IR.d); p.set(12, 11, IR.d); p.set(2, 10, IR.l); p.set(13, 10, IR.l);
  p.hline(5, 10, 7, IR.b);
  p.ellipse(8, 4, 2, 2, IR.d); p.set(8, 4, '#5a8a3a');
  // くさり
  for (let y = 0; y < 3; y++) { p.set(8, y, y % 2 ? IR.hl : IR.d); p.set(7, y, IR.d); }
}
// ようさいへ のぼる くさり（歩ける。のぼると ようさいの 1階）
function paintChain(p, v) {
  grass(p, v);
  p.ellipse(8, 14, 5, 1.5, '#3a5a2a');
  for (let y = 0; y < 15; y += 3) {
    p.ellipse(8, y + 1, 2, 1.5, IR.d);
    p.set(8, y + 1, '#5a8a3a');
    p.set(7, y, IR.hl);
  }
  p.set(4, 12, SK.l); p.set(12, 11, SK.l);
}
// 今の 森の 残がいの 鉄の 板（こけむした）
function paintWreck(p, v) {
  grass(p, v);
  p.rect(1, 2, 14, 13, RU.d);
  p.rect(2, 3, 12, 11, RU.b);
  p.hline(2, 13, 3, RU.l);
  for (const [x, y] of [[4, 5], [11, 5], [4, 11], [11, 11]]) p.set(x, y, RU.hl);
  const r = prand(v * 5 + 2);
  for (let i = 0; i < 8; i++) p.set(2 + Math.floor(r() * 12), 2 + Math.floor(r() * 5), i % 2 ? MO.b : MO.l);
  p.vline(1 + Math.floor(r() * 13), 6, 13, MO.d);
}
// 今の 残がいの しまった 出入り口（丸い ハッチ）
function paintWreckDoor(p, v) {
  paintWreck(p, v);
  p.ellipse(8, 9, 5, 4.5, RU.d);
  p.ellipse(8, 9, 4, 3.5, IR.b);
  p.hline(4, 12, 9, IR.d); p.vline(8, 6, 12, IR.d);
  p.ellipse(8, 9, 1.5, 1.5, BR.b);
  p.set(5, 6, MO.l); p.set(11, 12, MO.l);
}
// 今の 残がいの 開いた 出入り口（中への はしご）
function paintHatch(p, v) {
  paintWreck(p, v);
  p.ellipse(8, 9, 5, 4.5, RU.d);
  p.ellipse(8, 9, 4, 3.5, '#0e0a06');
  p.vline(6, 7, 12, BR.b); p.vline(10, 7, 12, BR.b);
  for (let y = 8; y <= 12; y += 2) p.hline(6, 10, y, BR.d);
}
// 8階の まほうの おり
export const CAGE_FRAMES = 3;
function paintCageBar(p, v, f) {
  ironFloor(p, v);
  const k = f % CAGE_FRAMES;
  for (let x = 1; x < 16; x += 4) {
    p.vline(x, 0, 15, MG.d); p.vline(x + 1, 0, 15, MG.b);
    p.set(x + 1, (k * 5 + x) % 16, MG.w);
  }
  p.hline(0, 15, 1, MG.l); p.hline(0, 15, 14, MG.l);
  p.set((k * 6 + 3) % 16, 8, MG.l);
}

export const C8C_PAINTERS = {
  [T.C8C_SKY]: (p, v, f) => paintSky(p, v, f),
  [T.C8C_CRUSH]: (p, v) => paintCrush(p, v),
  [T.C8C_TILT]: (p, v) => paintTilt(p, v),
  [T.C8C_MOSS]: (p, v) => paintMoss(p, v),
  [T.C8C_SLIDE_N]: (p, v, f) => paintSlide(p, v, f, 'n'),
  [T.C8C_SLIDE_E]: (p, v, f) => paintSlide(p, v, f, 'e'),
  [T.C8C_SLIDE_S]: (p, v, f) => paintSlide(p, v, f, 's'),
  [T.C8C_SLIDE_W]: (p, v, f) => paintSlide(p, v, f, 'w'),
  [T.C8C_PROP_ON]: (p, v, f) => paintProp(p, v, f, true),
  [T.C8C_PROP_OFF]: (p, v) => paintProp(p, v, 0, false),
  [T.C8C_CANNON_L]: (p, v) => paintCannon(p, v, false),
  [T.C8C_CANNON_R]: (p, v) => paintCannon(p, v, true),
  [T.C8C_SHUTTER_OPEN]: (p, v) => paintShutter(p, v, false),
  [T.C8C_SHUTTER_SHUT]: (p, v) => paintShutter(p, v, true),
  [T.C8C_ROOTS]: (p, v) => paintRoots(p, v),
  [T.C8C_PLATE]: (p, v) => paintPlate(p, v),
  [T.C8C_GAP]: (p, v) => paintGap(p, v),
  [T.C8C_MAILBOX]: (p, v) => paintMailbox(p, v),
  [T.C8C_LOCKDOOR]: (p, v, f) => paintLockDoor(p, v, f),
  [T.C8C_BARRIER]: (p, v, f) => paintBarrier(p, v, f),
  [T.C8C_STEAM_FLOOR]: (p, v) => paintSteamFloor(p, v),
  [T.C8C_STEAM]: (p, v, f) => paintSteam(p, v, f),
  [T.C8C_ANCHOR]: (p, v) => paintAnchor(p, v),
  [T.C8C_CHAIN]: (p, v) => paintChain(p, v),
  [T.C8C_WRECK]: (p, v) => paintWreck(p, v),
  [T.C8C_WRECKDOOR]: (p, v) => paintWreckDoor(p, v),
  [T.C8C_HATCH]: (p, v) => paintHatch(p, v),
  [T.C8C_CAGEBAR]: (p, v, f) => paintCageBar(p, v, f),
};
export const C8C_FRAMES = {
  [T.C8C_SKY]: SKY_FRAMES, [T.C8C_SLIDE_N]: SLIDE_FRAMES, [T.C8C_SLIDE_E]: SLIDE_FRAMES, [T.C8C_SLIDE_S]: SLIDE_FRAMES, [T.C8C_SLIDE_W]: SLIDE_FRAMES,
  [T.C8C_PROP_ON]: PROP_FRAMES, [T.C8C_LOCKDOOR]: LOCK_FRAMES, [T.C8C_BARRIER]: BARRIER_FRAMES, [T.C8C_STEAM]: STEAM_FRAMES, [T.C8C_CAGEBAR]: CAGE_FRAMES,
};
export const C8C_SPEED = {
  [T.C8C_SKY]: 500, [T.C8C_SLIDE_N]: 160, [T.C8C_SLIDE_E]: 160, [T.C8C_SLIDE_S]: 160, [T.C8C_SLIDE_W]: 160,
  [T.C8C_PROP_ON]: 90, [T.C8C_LOCKDOOR]: 260, [T.C8C_BARRIER]: 160, [T.C8C_STEAM]: 140, [T.C8C_CAGEBAR]: 200,
};

// ───── 2.5D ─────
// 空は ひくい（下に 雲）。つぶれた 鉄・残がいの 板は ひくい ブロック・木の 根と ゆるんだ 鉄の 板は かべ。しかけ・ポスト・とびら・まほうの かべ・ゆげ・いかり・おりは たてた もの
export const C8C_FLOOR_H = { [T.C8C_SKY]: -0.6, [T.C8C_MOSS]: -0.06, [T.C8C_TILT]: -0.03, [T.C8C_STEAM_FLOOR]: -0.02 };
export function c8cBlockSpec(id, v) {
  switch (id) {
    case T.C8C_CRUSH: return { h: 0.6, top: ['t', T.C8C_CRUSH, v, 0], side: ['t', T.C8C_CRUSH, v, 0] };
    case T.C8C_WRECK: return { h: 0.7, top: ['t', T.C8C_WRECK, v, 0], side: ['t', T.C8C_CRUSH, v, 0] };
    case T.C8C_ROOTS: return { h: 1.6, top: ['t', T.C8C_CRUSH, v, 0], side: ['t', T.C8C_ROOTS, v, 0], south: ['t', T.C8C_ROOTS, v, 0] };
    case T.C8C_PLATE: return { h: 1.6, top: ['x', 'cave_top', v], side: ['x', 'cave_side', v], south: ['t', T.C8C_PLATE, v, 0] };
    default: return null;
  }
}
const propProp = (on) => [16, 20, (p) => {
  p.rect(6, 10, 4, 10, IR.d); p.vline(6, 10, 19, IR.l); p.hline(4, 11, 19, IR.ln);
  p.ellipse(8, 7, 7, 5, IR.ln);
  if (on) { p.ellipse(8, 7, 7, 1.6, IR.hl); p.ellipse(8, 7, 1.6, 5, IR.l); } else { p.hline(1, 15, 7, RU.l); p.vline(8, 2, 12, RU.b); }
  p.ellipse(8, 7, 1.5, 1.5, BR.l);
}];
const cannonProp = (right) => [16, 12, (p) => {
  p.rect(3, 6, 10, 5, BR.d); p.hline(3, 12, 6, BR.b);
  p.ellipse(4, 11, 2, 1, IR.d); p.ellipse(12, 11, 2, 1, IR.d);
  const x0 = right ? 6 : 0, x1 = right ? 15 : 9;
  p.rect(x0, 1, x1 - x0 + 1, 5, IR.d); p.hline(x0, x1, 1, IR.hl); p.hline(x0, x1, 2, IR.l);
  p.vline(right ? 15 : 0, 0, 6, IR.ln);
}];
const shutterProp = (shut) => [16, 22, (p) => {
  p.rect(0, 0, 16, 22, IR.d); p.rect(2, 3, 12, 14, IR.ln);
  if (shut) for (let y = 3; y < 17; y++) p.hline(2, 13, y, y % 2 ? IR.b : IR.l);
  else { p.rect(2, 5, 12, 12, SK.b); p.ellipse(7, 10, 3, 1.2, SK.l); p.rect(2, 3, 12, 2, IR.l); }
  p.vline(8, 3, 16, IR.ln); p.rect(0, 18, 16, 4, IR.b);
}];
export const C8C_PROPS = {
  [T.C8C_PROP_ON]: propProp(true),
  [T.C8C_PROP_OFF]: propProp(false),
  [T.C8C_CANNON_L]: cannonProp(false),
  [T.C8C_CANNON_R]: cannonProp(true),
  [T.C8C_SHUTTER_OPEN]: shutterProp(false),
  [T.C8C_SHUTTER_SHUT]: shutterProp(true),
  [T.C8C_MAILBOX]: [10, 16, (p) => {
    p.rect(4, 9, 2, 7, IR.d);
    p.rect(1, 0, 8, 10, RD.b); p.hline(1, 8, 0, RD.l); p.vline(8, 0, 9, RD.d); p.hline(2, 7, 3, '#2a0a0a'); p.set(6, 6, BR.l);
  }],
  [T.C8C_LOCKDOOR]: [16, 26, (p) => {
    p.rect(1, 2, 14, 24, RU.d); p.rect(2, 3, 12, 22, RU.b); p.vline(8, 3, 25, RU.d);
    p.ellipse(8, 12, 4, 4, MG.b); p.ellipse(8, 12, 2.5, 2.5, MG.l); p.set(8, 12, MG.w);
    p.rect(1, 0, 14, 3, RU.l);
  }],
  [T.C8C_BARRIER]: [16, 22, (p) => {
    for (let y = 0; y < 22; y++) p.hline(1, 14, y, y % 3 ? MG.b : MG.l);
    for (let i = 0; i < 6; i++) p.set(2 + (i * 5) % 12, (i * 7) % 22, MG.w);
    p.vline(1, 0, 21, MG.d); p.vline(14, 0, 21, MG.d);
  }],
  [T.C8C_STEAM]: [12, 24, (p) => {
    for (let y = 0; y < 24; y++) { const w = 3 + Math.round(Math.sin(y * 0.6) * 1.5); p.hline(6 - w, 5 + w, y, y % 3 ? SM.b : SM.l); }
    p.ellipse(6, 22, 5, 2, SM.d);
  }],
  [T.C8C_ANCHOR]: [16, 30, (p) => {
    for (let y = 0; y < 16; y++) { p.set(8, y, y % 3 ? IR.d : IR.hl); p.set(7, y, IR.d); }
    p.ellipse(8, 17, 2, 2, IR.d);
    p.vline(8, 18, 27, IR.d); p.vline(7, 18, 27, IR.l);
    p.hline(2, 13, 27, IR.d); p.set(2, 26, IR.d); p.set(13, 26, IR.d); p.set(1, 25, IR.l); p.set(14, 25, IR.l);
    p.hline(4, 11, 21, IR.b);
  }],
  // ようさいへ のぼる くさり（空から まっすぐ たれている）
  [T.C8C_CHAIN]: [10, 40, (p) => {
    for (let y = 0; y < 38; y += 3) { p.ellipse(5, y + 1, 2, 1.5, IR.d); p.set(5, y + 1, IR.ln); p.set(4, y, IR.hl); }
    p.ellipse(5, 38, 4, 1.5, '#3a5a2a');
  }],
  [T.C8C_WRECKDOOR]: [16, 22, (p) => {
    p.rect(0, 2, 16, 20, RU.d); p.rect(1, 3, 14, 18, RU.b);
    p.ellipse(8, 12, 5, 5, RU.d); p.ellipse(8, 12, 4, 4, IR.b); p.hline(4, 12, 12, IR.d); p.vline(8, 8, 16, IR.d);
    for (let x = 0; x < 16; x += 3) p.set(x, 3, MO.l);
  }],
  [T.C8C_CAGEBAR]: [16, 24, (p) => {
    for (let x = 1; x < 16; x += 4) { p.vline(x, 0, 23, MG.d); p.vline(x + 1, 0, 23, MG.b); }
    p.hline(0, 15, 0, MG.l); p.hline(0, 15, 23, MG.l); p.set(6, 10, MG.w); p.set(10, 16, MG.w);
  }],
};
// たてた ものでも 色を かえない（しんちゅう・赤い ポスト・まほうの 光・ゆげ・空）
export const C8C_PROPS_KEEP = new Set([T.C8C_CHAIN, T.C8C_MAILBOX, T.C8C_LOCKDOOR, T.C8C_BARRIER, T.C8C_STEAM, T.C8C_CAGEBAR, T.C8C_SHUTTER_OPEN, T.C8C_ANCHOR, T.C8C_WRECKDOOR]);

// ───── 色（render/themes.js の THEMES に まぜる。明るさを たもって 色だけ かえる）─────
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const G = (...stops) => stops.map(([q, h]) => [q, hex(h)]);
export const C8C_THEMES = {
  // 千年前の くろがねの空中ようさい: 黒い 鉄と しんちゅうの かざり
  c8c_iron: {
    floor: G([0, '#0e1016'], [0.3, '#2e3240'], [0.6, '#6a7082'], [1, '#eef2fa']),
    wall: G([0, '#08090e'], [0.3, '#22252e'], [0.6, '#545a6a'], [1, '#d8dce8']),
    water: G([0, '#3a6a9a'], [0.5, '#a8d0f0'], [1, '#ffffff']),
    gem: G([0, '#3a2a08'], [0.5, '#d8a840'], [1, '#fff8e0']),
    flame: G([0, '#5a2a0a'], [0.5, '#f0a040'], [1, '#fff4d8']),
  },
  // 今の 空中ようさいの残がい: さびた 鉄と 森の こけ
  c8c_wreck: {
    floor: G([0, '#1a120a'], [0.3, '#4a3420'], [0.6, '#8a7048'], [1, '#e8e0c0']),
    wall: G([0, '#140e08'], [0.3, '#3a2a1a'], [0.6, '#6a7040'], [1, '#d8e0b8']),
    water: G([0, '#1a3a2a'], [0.5, '#4a8a5a'], [1, '#c8f0d0']),
    gem: G([0, '#1a3a10'], [0.5, '#7ac050'], [1, '#f0ffe0']),
    flame: G([0, '#4a2a0a'], [0.5, '#e09040'], [1, '#fff0d0']),
  },
};
