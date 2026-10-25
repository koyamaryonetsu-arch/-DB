// 第5章 Step 8 の とくべつな え（render/ch5-earth-art.js の paintEarthSpecial から paintCastleSpecial）
// ・ice_statue … 影の城 6階・7階の 氷の像（すきとおった 青い 竜の 像。向いている 方へ つめたい 息。2コマで 息が ゆれる）
import { Painter } from './pixel.js?v=f7adbedf412d';

const IC = { d: '#2a5a8a', b: '#5a9ad0', m: '#8ac4f0', l: '#c8ecff', w: '#ffffff', base: '#4a4a5e', baseL: '#6a6a80', baseD: '#2e2e3e' };
const BREATH = ['#e8f8ff', '#b8e4ff'];

// 氷の像（24×30）。dir … 向き（息を はく 方）/ f … 2コマ
function paintIceStatue(dir, f) {
  const W = 24, H = 30, p = new Painter(W, H);
  // 台
  p.rect(4, 24, 16, 6, IC.base); p.hline(4, 19, 24, IC.baseL); p.hline(4, 19, 29, IC.baseD);
  p.rect(6, 22, 12, 2, IC.baseL);
  // 体（すわった 竜）
  p.ellipse(12, 17, 6, 5, IC.b);
  p.ellipse(11, 16, 4, 3.5, IC.m);
  // つばさ
  for (let i = 0; i < 6; i++) { p.hline(3 + i, 6, 10 + i, IC.d); p.hline(18, 21 - i, 10 + i, IC.d); }
  // 首と 頭（向きで かわる）
  const head = { down: [12, 9], up: [12, 6], left: [7, 8], right: [17, 8] }[dir] || [12, 9];
  p.rect(10, 10, 4, 5, IC.b);
  p.ellipse(head[0], head[1], 3.5, 3, IC.m);
  p.set(head[0] - 1, head[1] - 1, IC.l); p.set(head[0], head[1] - 2, IC.w);
  // 目（青く 光る）
  if (dir === 'down') { p.set(11, 9, IC.d); p.set(13, 9, IC.d); }
  else if (dir === 'left') p.set(6, 8, IC.d);
  else if (dir === 'right') p.set(18, 8, IC.d);
  // つの
  p.set(head[0] - 2, head[1] - 3, IC.l); p.set(head[0] + 2, head[1] - 3, IC.l);
  // つめたい 息（向いている 方へ）
  const b = BREATH[f % 2], b2 = BREATH[(f + 1) % 2];
  if (dir === 'down') { p.rect(10, 12, 4, 2, b); p.set(9, 14, b2); p.set(14, 14, b2); }
  else if (dir === 'up') { p.rect(10, 1, 4, 2, b); p.set(9, 0, b2); p.set(14, 0, b2); }
  else if (dir === 'left') { p.rect(0, 7, 3, 3, b); p.set(1, 5 + f, b2); }
  else { p.rect(21, 7, 3, 3, b); p.set(22, 5 + f, b2); }
  // きらめき
  p.set(8 + f * 6, 18, IC.w); p.set(15 - f * 4, 14, IC.l);
  return { p, oc: '#0a1a2e' };
}

// render/ch5-earth-art.js の paintEarthSpecial から（ない ときは null）
export function paintCastleSpecial(kind, dir, f) {
  if (kind === 'ice_statue') return paintIceStatue(dir, f);
  return null;
}
