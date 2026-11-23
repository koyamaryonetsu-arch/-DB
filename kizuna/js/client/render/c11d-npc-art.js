// 第3部 第3章 第4幕「かがやきの女王と、八つめの音」の とくべつな え（render/c9a-npc-art.js が まぜる）
// ※ ネタバレ注意（docs/plan-part3-c11d.md の 20）
// ・c11d_queen … かがやきの 女王（まっすぐ 立つ、まぶしい 女王。白と 金の 長い 衣・北の 星の かんむり・ねむって いない 目）
// ・c11d_light … 星の海を のぼって 来る、小さな 光（八つめの 音。だれの 光かは かかない … あたたかい 白と 金の 光の つぶ）
// ・c11d_ped8_on … 光る 8つめの 台（くぼ地。前の 幕の c10d_ped8 と 同じ 形）
// ・c11d_lamp … 名前の ランプ（火が ともった）
// ・c11d_bridge … さいごまで かかった 星の橋（星見の丘から 空へ。8つの 色）
import { Painter } from './pixel.js?v=28060a38724e';

// 女王（20×30）
function paintQueen(dir, f) {
  const p = new Painter(20, 30);
  const k = f % 2;
  const W = '#fffaf0', G = '#e8c040', GL = '#fff0a0';
  p.ellipse(10, 29, 7, 1.2, '#1a1a30');
  // 長い 衣（すそが 広い）
  for (let y = 12; y < 29; y++) {
    const w = Math.round(3 + (y - 12) * 0.38);
    p.hline(10 - w, 9 + w, y, y % 4 === k ? '#f0ecff' : W);
  }
  p.vline(10, 13, 28, G); p.hline(4, 15, 28, G);
  // うで（まっすぐ 下に）
  p.vline(5, 13, 20, W); p.vline(14, 13, 20, W);
  // 顔・かみ（銀）
  p.ellipse(10, 8, 3.5, 3.6, '#f4e0d0');
  p.rect(6, 5, 2, 9, '#d8dcf0'); p.rect(12, 5, 2, 9, '#d8dcf0'); p.hline(7, 12, 4, '#d8dcf0');
  if (dir !== 'up') { p.set(9, 8, '#3a4aa8'); p.set(11, 8, '#3a4aa8'); p.hline(9, 11, 10, '#c88a7a'); }
  // かんむり（北の 星）
  p.hline(7, 12, 3, G); p.set(7, 2, G); p.set(10, 1, G); p.set(12, 2, G); p.set(10, 0, k ? '#ffffff' : GL);
  // 光の つぶ
  p.set(2, 6 + k, GL); p.set(17, 9 - k, GL);
  return { p, oc: '#5a4a70' };
}
// 小さな 光（12×14。ゆっくり のぼって 来る。まわりに 小さな つぶ）
function paintLight(dir, f) {
  const p = new Painter(12, 14);
  const k = f % 2;
  p.ellipse(6, 7 - k, 4, 4, '#fff0c0');
  p.ellipse(6, 7 - k, 2.6, 2.6, '#fff8e0');
  p.set(6, 7 - k, '#ffffff');
  p.set(1, 4 + k, '#fff0a0'); p.set(11, 3 + k, '#ffe8f8'); p.set(3, 12 - k, '#e8f0ff'); p.set(10, 11, '#fff0a0');
  return { p, oc: null };
}
// 光る 8つめの 台（16×18。前の 幕の 8つめの 台に 光）
function paintPed8On(dir, f) {
  const p = new Painter(16, 18);
  const k = f % 2;
  p.ellipse(8, 16, 6, 1.5, '#1a1a24');
  p.rect(4, 10, 8, 6, '#b8b8c8'); p.hline(3, 12, 10, '#e8e8f8'); p.hline(3, 12, 15, '#7a7a8a');
  p.rect(3, 9, 10, 2, '#d8d8e8');
  p.ellipse(8, 9, 3, 1.4, '#fff8e0');
  // 上に うかぶ 小さな 光
  p.ellipse(8, 4 - k, 2.5, 2.5, '#fff0c0'); p.set(8, 4 - k, '#ffffff');
  p.set(3, 3 + k, '#fff0a0'); p.set(13, 5 - k, '#fff0a0');
  return { p, oc: '#1a1a24' };
}
// 名前の ランプ（10×14）
function paintLamp(dir, f) {
  const p = new Painter(10, 14);
  const k = f % 2;
  p.vline(5, 0, 2, '#6a6080');
  p.rect(2, 3, 6, 8, '#5a4a3a'); p.rect(3, 4, 4, 6, k ? '#ffe890' : '#ffd060'); p.set(5, 6, '#ffffff');
  p.hline(2, 7, 11, '#5a4a3a');
  return { p, oc: null };
}
// さいごまで かかった 星の橋（80×96。左下の 丘から 右上の 空の むこうへ。8つの 色）
function paintBridgeFull(f) {
  const W = 80, H = 96, p = new Painter(W, H);
  const k = f % 2;
  const C = ['#ff7a7a', '#ffb060', '#ffe070', '#7ae08a', '#7ab8ff', '#f4f8ff', '#c890ff', '#fff4d0'];
  const yOf = (x) => Math.round(95 - (x / 78) * 86 - Math.sin((x / 78) * Math.PI) * 6);
  for (let x = 0; x <= 78; x++) {
    const y = yOf(x);
    for (let i = 0; i < 8; i++) p.set(x, y - 4 + i, C[i]);
    if (x % 6 === k * 3) p.set(x, y - 5, '#ffffff');
  }
  return { p, oc: null };
}

export function paintC11dSpecial(kind, dir, f) {
  switch (kind) {
    case 'c11d_queen': return paintQueen(dir, f);
    case 'c11d_light': return paintLight(dir, f);
    case 'c11d_ped8_on': return paintPed8On(dir, f);
    case 'c11d_lamp': return paintLamp(dir, f);
    case 'c11d_bridge': return paintBridgeFull(f);
    default: return null;
  }
}
export const C11D_SPECIALS = ['c11d_queen', 'c11d_light', 'c11d_ped8_on', 'c11d_lamp', 'c11d_bridge'];
