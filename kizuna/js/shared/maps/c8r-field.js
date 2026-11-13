// 第8章 第4幕（A: 世界と物語）今の ミドリナ地方（overworld）の ほしみの丘に たす もの（maps/c8r.js が まぜる）
// ※ ネタバレ注意（docs/plan-ch8.md の 7-3・9）
// ・時の さけめ（トキネの 話 c8_rift の あと。入ると 時の広間）
// ・エンディングの あと（c8_solitus）: ほしみの丘に もどった 4人の 勇者の 像
import { T, TILE_INFO } from '../tiles.js?v=b671a0f110f0';
import { npc } from './npc.js?v=b671a0f110f0';
import { C8R, HALL_ID, NOW_FIELD_ID } from './c8r-flags.js?v=b671a0f110f0';
import { HALL_POS } from './c8r-hall.js?v=b671a0f110f0';

// 今の ほしみの丘（トキネの そば 57,84）。広間に 着く 所は HALL_ENTER8R
export const HALL_ENTER8R = { map: HALL_ID, x: HALL_POS.enter.x + 0.5, y: HALL_POS.enter.y + 0.5, dir: 'up' };
export const RIFT8R = { x: 61, y: 84 };
export const RIFT8R_OUT = { x: RIFT8R.x + 0.5, y: RIFT8R.y + 1.5 };
export const STATUES8R = [{ x: 54, y: 79, who: 'karim' }, { x: 56, y: 79, who: 'kai' }, { x: 58, y: 79, who: 'minamo' }, { x: 60, y: 79, who: 'rion' }];
export const STATUE8R_NAME = { karim: 'カリムの像', kai: 'カイの像', minamo: 'ミナモの像', rion: 'リオンの像' };

export function attachC8rField(maps) {
  const s = maps[NOW_FIELD_ID];
  const R = RIFT8R;
  // 時の さけめ（c8_rift から。その 前は ふつうの 草地。ワープでは なく 入ると だいほんで 広間へ〈c8_rift の 前は 何も おきない〉）
  if (TILE_INFO[s.tiles[R.y * s.w + R.x]]?.solid) s.tiles[R.y * s.w + R.x] = T.GRASS;
  s.gates = s.gates.filter((g) => !(g.x === R.x && g.y === R.y));
  s.gates.push({ x: R.x, y: R.y, closed: s.tiles[R.y * s.w + R.x], open: T.C8R_RIFT, flag: C8R.rift });
  s.triggers.push({ id: 'c8r_rift_enter', x: R.x, y: R.y, w: 1, h: 1, script: 'c8r_rift_enter', show: { all: [C8R.rift] } });
  (s.links = s.links || []).push({ x: R.x, y: R.y, to: HALL_ID });
  // さけめの 南と 像の 所は いつも 歩ける・立てる
  const O = { x: R.x, y: R.y + 1 };
  if (TILE_INFO[s.tiles[O.y * s.w + O.x]]?.solid) s.tiles[O.y * s.w + O.x] = T.GRASS;
  // トキネは エンディングで 時の砂時計の 中へ（ほしみの丘から いなくなる。また 会える）
  const tok = s.npcs.find((n) => n.id === 'tokine_c6');
  if (tok) tok.show = { ...(tok.show || {}), not: [...(tok.show?.not || []), C8R.solitus] };
  // 4人の 勇者の 像（エンディングの あと）
  for (const p of STATUES8R) {
    if (TILE_INFO[s.tiles[p.y * s.w + p.x]]?.solid) s.tiles[p.y * s.w + p.x] = T.GRASS;
    s.npcs.push(npc(`c8r_statue_${p.who}`, STATUE8R_NAME[p.who], [p.x, p.y], 'hero_statue', 'c8r_statue', { show: { all: [C8R.solitus] } }));
  }
  s.gateAt = new Map((s.gates || []).map((g) => [g.y * s.w + g.x, g]));
}
