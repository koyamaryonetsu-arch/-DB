// 第6章 Step 5（A: 世界と物語）の より道「トキネの砂時計のかざり」の 人と 場所（maps/ch6.js の attachCh6 で まぜる。plan-ch6.md の 13-5）
// ・トキネ（時の 砂時計の 精）が 今の ほしみの丘に 出てくる（c6_kanata の あと）→ 話すと はじまる
// ・砂時計の まわりの 12の かざりが、今と 千年前の フィールド・ダンジョンに 1つずつ ちらばっている（地図の しるしは つぎの 1つ）
// ・6こで ★5の アクセサリー・12こで 時の砂時計が きれいに なる（時を こえる ときの 砂の うずに かざりが 光る）＋ つよい 種
// だいほんは data/sidequests-ch6c.js
import { npc } from './npc.js?v=0e454fdbf852';
import { PLACES } from './overworld.js?v=0e454fdbf852';

// ───────────── フラグ（セーブに のこるので かえない）─────────────
export const ORN = {
  start: 'c6_orn_start', // トキネに たのまれた
  got: (i) => `c6_orn${i}`, // i ばんめの かざりを 拾った
  half: 'c6_orn_half', // 6こ そろって ごほうびを もらった
  done: 'c6_orn_done', // 12こ そろって 砂時計が きれいに なった
};
export const ORN_NEED = 6;
// かざりの 場所（この じゅんに 地図の しるしが 出る）。どれも その マップの 入口から 歩いて 行ける 所
export const ORN_SPOTS = [
  { map: 'overworld', x: 64, y: 90 }, // 今の ほしみの丘の 南
  { map: 'overworld_past', x: 30, y: 86 }, // 千年前の ホシフルの里の 北
  { map: 'toki_shrine_2f', x: 5, y: 14 }, // 時のほこら 地下2階
  { map: 'overworld_past', x: 56, y: 52 }, // 千年前の 泉の里の 南
  { map: 'toki_ruin_3f', x: 5, y: 22 }, // 今の 時のいせき 3階
  { map: 'toki_ruin_4f_past', x: 28, y: 6 }, // 千年前の 時の神殿 4階
  { map: 'hoshimichi_2f_past', x: 36, y: 22 }, // 千年前の 星めぐりの古道 2階
  { map: 'hoshimichi_5f', x: 36, y: 7 }, // 今の 星めぐりの古道 5階
  { map: 'star_tower_2f', x: 38, y: 16 }, // 今の 星の塔 2階
  { map: 'tokei_1f', x: 31, y: 22 }, // 止まった時計塔 1階
  { map: 'tokei_2f', x: 27, y: 11 }, // 止まった時計塔 2階
  { map: 'tokei_4f', x: 18, y: 14 }, // 止まった時計塔 4階
];
// トキネ（今の ほしみの丘。時のほこらの 入口の 西）
export const TOKINE_SPOT = { x: PLACES.shrine.x + 1, y: PLACES.shrine.y + 6 };

export function attachCh6cSide(maps) {
  maps.overworld.npcs.push(npc('tokine_c6', 'トキネ', [TOKINE_SPOT.x, TOKINE_SPOT.y], 'tokine', 'c6_tokine', { show: { all: ['c6_kanata'] } }));
  ORN_SPOTS.forEach((p, i) => {
    maps[p.map].npcs.push(npc(`orn_${i + 1}`, '砂時計のかざり', [p.x, p.y], 'toki_orn', `c6_orn_${i + 1}`, { solid: false, show: { all: [ORN.start], not: [ORN.got(i + 1)] } }));
  });
}
