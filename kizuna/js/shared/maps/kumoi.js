// 第5章 Step 3「クモイ地方」と「雲の上の町ハネノ」の マップ（maps/index.js の attachKumoi で まぜる）
// ・kumoi（フィールド）… 雲の 海に うかぶ 大小の 島。島は 少しずつ しずんでいる（ふちが 雲に とける・かたむいた 木と 柱）
//   星の竜アステルは、天のとばりの 向こうの「雲の上」へ 飛べる（data/sky.js の SKY_MAPS.kumoi・world/travel.js の flyVeil）。
//   島の まわりの 風が あれていて、竜が 飛べるのは ハネノの島の 上だけ（守り星の かけらで しずみが 少し 止まると どこでも）
// ・風の道 … 雲の 上を わたる 風（のると 決まった 方へ 流される。第4章の 流れる 砂と おなじ しくみ）。
//   風見の小島の「風見の石」を 回すと、とちゅうの 曲がり角の 風の 向きが かわる
//     ハネノの島 →（西へ）→ 風見の小島 →（北へ）→ 小さなうき島 … 風見の石1を 回すと（西へ）→ 西の風見の小島
//     西の風見の小島 →（南へ・東へ）→ 風見の小島 … 風見の石2を 回すと（南へ）→ しずみゆく島
//     しずみゆく島 →（東へ・北へ）→ ハネノの島 / 小さなうき島 →（南へ）→ 風見の小島 / 風見の小島 →（東へ）→ ハネノの島
// ・hanono（フィールド。町）… ハネビトの 町。長ソラネの 家・宿屋・教会・武器と防具の店・道具屋・見晴らし台
// ・しずみゆく島の 古い 神殿（sink_ruin_1f〜7f）は maps/sink-ruin.js
// 魔物は 島の 上が t5_kumoi（B が 作る。plan-ch5.md の 13）
// 第5章 Step 5: 西の 小島「星読みの里」（中の 町は maps/hoshiyomi.js の 'hoshiyomi'）。守り星の かけら（c5_shard）の あと、
//   しずみゆく島の 北西の 風見の石3を 回すと、北へ 風の道（w7）が 開いて 里の 島へ。里の 島から 東へ 風の道（w8）で 帰れる。
//   竜で 里の 島の 上を 飛べるのは、里に 着いて から（c5_village。data/sky.js の box）。里の 島の まわりの 魔物は t5_village（B）
// 第5章 Step 6・7: ハネノの島の 南の「根の島」（大地の 神殿の 入口。中は maps/earth.js の earth_1f〜8f）。ハネノの島の 南の 風見の石4を 回すと
//   南へ 風の道（w9）が 開く。根の島から 北へ 風の道（w10）で 帰れる（竜でも 行ける）。神殿の 入口は 根が からみついていて、長ソラネの 話（c5_root）で ほどける。
//   影の城が うかぶと（c5_castle）: 雲の 海の まん中に 影の城（まだ 入れない）・西の 船着き場の 風の道（w1）が とぎれる・しずんでいた 小島が 1つ 出てくる・
//   空が 夕ぐれの 色に（map.dusk）・曲が kumoi_dusk に。根の島の 魔物は t5_root（B）
import { T } from '../tiles.js?v=12f512bf8713';
import { hash2, fbm } from '../rng.js?v=12f512bf8713';
import { npc } from './npc.js?v=12f512bf8713';
import { SEA_PLACES } from './ch2.js?v=12f512bf8713';
import { buildRuinMaps, RUIN_OUT } from './sink-ruin.js?v=12f512bf8713';
import { EARTH_OUT, HANONO_GATHER_NPCS, K7 } from './earth.js?v=12f512bf8713';

// ───────────── フラグ（セーブに のこるので かえない）─────────────
// 物語の すすみぐあい（data/story-ch5.js の CH5_STEPS の c5_sky の うしろ。plan-ch5.md の 13 の 名前の 約束）
export const K5 = { kumoi: 'c5_kumoi', hanono: 'c5_hanono', pipi: 'c5_pipi', ruin: 'c5_ruin', gaia: 'c5_gaia', shard: 'c5_shard' };
// 物語の すすみぐあいでは ない フラグ
export const HANONO_SEEN = 'c5_k_town'; // ハネノの 町に 入った（門番の あいさつ）
export const KUMOI_VANES = { v1: 'c5_k_vane1', v2: 'c5_k_vane2', v3: 'c5_k_vane3', v4: 'c5_kroad_w9' }; // 風見の石を 回した（もう 1回 回すと もどる。v3 は 星読みの里への 風の道・v4 は 根の島への 風の道）

// ───────────── クモイ地方（フィールド 'kumoi'）─────────────
export const KUMOI_W = 80;
export const KUMOI_H = 60;
// 島（まん中と 大きさ。だ円）
export const KUMOI_ISLES = {
  hanono: { cx: 58, cy: 30, rx: 13, ry: 11, name: 'ハネノの島' },
  vane1: { cx: 34, cy: 30, rx: 4, ry: 4, name: '風見の小島' },
  treasure: { cx: 34, cy: 12, rx: 3, ry: 3, name: '小さなうき島' },
  vane2: { cx: 18, cy: 16, rx: 4, ry: 4, name: '西の風見の小島' },
  sink: { cx: 16, cy: 44, rx: 9, ry: 7, name: 'しずみゆく島' },
  // 雲から 出てきた 島（守り星の かけらで しずみが 少し 止まると〈c5_shard〉雲の 中から 出てくる）
  rise: { cx: 40, cy: 51, rx: 3, ry: 2.6, name: '雲から出てきた島', show: K5.shard },
  // 北東の はなれ小島（竜で しか 行けない。c5_shard の あと）
  far: { cx: 70, cy: 9, rx: 3.5, ry: 3, name: '北東のはなれ小島' },
  // 第5章 Step 5: 西の 小島「星読みの里」（中の 町は maps/hoshiyomi.js）
  star: { cx: 6.5, cy: 27, rx: 6, ry: 5, name: '星読みの里' },
  // 第5章 Step 6・7: ハネノの島の 南の「根の島」（大地の 神殿の 入口）と、影の城が うかぶと（c5_castle）雲から 出てくる 小島
  root: { cx: 60, cy: 52, rx: 6.5, ry: 4.5, name: '根の島' },
  shade: { cx: 44.5, cy: 38.5, rx: 2.6, ry: 2, name: '影の城の前の小島', show: K7.castle },
};
const IS = KUMOI_ISLES;
const inIsle = (I, x, y, k = 1) => ((x + 0.5 - I.cx) / I.rx) ** 2 + ((y + 0.5 - I.cy) / I.ry) ** 2 < k;
const isleAt = (x, y) => Object.entries(IS).find(([, I]) => inIsle(I, x, y))?.[0] || null;

// ハネノの島の 町（門の 先は ハネノの 町 'hanono'）・竜の 降り場・西の 船着き場
export const KUMOI_TOWN = { x: 52, y: 21, w: 14, h: 9 };
export const KUMOI_POS = {
  gate: [{ x: 58, y: 29 }, { x: 59, y: 29 }], // 町の 門（ふむと ハネノの 町へ）
  gateOut: { x: 59, y: 31.5 }, // 町から 出て 着く ところ
  plaza: { x: 55, y: 34, w: 8, h: 4 }, // 竜の 降り場
  arrive: { x: 59, y: 35.5 }, // 竜で「雲の上へ」来た ときの 空の 上
  sign: { x: 54, y: 33 }, // 降り場の かんばん
  pier: { x: 46, y: 30 }, // 西の 船着き場（風の道の のりば）
  vane1: { x: 35, y: 28 }, // 風見の石1（風見の小島。北の 曲がり角の 風）
  vane2: { x: 19, y: 14 }, // 風見の石2（西の風見の小島。南の 曲がり角の 風）
  guard: { x: 61, y: 31 }, // ハネビトの 見張り（門の 前）
  sinkSign: { x: 20, y: 38 }, // しずみゆく島の かんばん
  // 第5章 Step 5: 星読みの里
  vane3: { x: 10, y: 41 }, // 風見の石3（しずみゆく島の 北西。かけらの あと 回すと 里への 風の道 w7 が 開く）
  starGate: [{ x: 6, y: 27 }, { x: 7, y: 27 }], // 里の 島の 生けがきの 門（ふむと 星読みの里 'hoshiyomi' へ）
  starGateOut: { x: 7, y: 28.5 }, // 里から 出て 着く ところ
  starSign: { x: 9, y: 28 }, // 里の 島の かんばん
  roadSign: { x: 11, y: 39 }, // しずみゆく島の 北西の かんばん（風の道 w7 の のりば）
  // 第5章 Step 6・7: 根の島
  vane4: { x: 59, y: 40 }, // 風見の石4（ハネノの島の 南。c5_root の あと 回すと 根の島への 風の道 w9 が 開く）
  rootRoadSign: { x: 62, y: 39 }, // ハネノの島の 南の かんばん（風の道 w9 の のりば）
  rootSign: { x: 57, y: 54 }, // 根の島の かんばん
  castle: { x: 40, y: 37 }, // 影の城（c5_castle の あと。雲の 海の まん中。まだ 入れない）
};
// 星読みの里の 島の 町（生けがきの 中に 家の やね。中へは 門から）
export const STAR_TOWN = { x: 4, y: 23, w: 6, h: 5 };
// 竜が 飛べる 所（data/sky.js の box。c5_shard まで）と 来た ときの 場所
export const KUMOI_SKY = { x: 44, y: 18, w: 29, h: 25 };
// c5_shard の あと 星読みの里に 着くまで（c5_village）: 里の 島（西の はし）の 上の ほかは どこでも（里へは 風の道で 行く）
export const KUMOI_SKY2 = { x: 14, y: 0, w: KUMOI_W - 14, h: KUMOI_H };
export const KUMOI_ARRIVE = { x: KUMOI_POS.arrive.x, y: KUMOI_POS.arrive.y };

// 風の道（[x, y, 向き]。向き N E S W）。曲がり角（junction）は 風見の石で 向きが かわる
const DIR_TILE = { N: T.SKYWIND_N, E: T.SKYWIND_E, S: T.SKYWIND_S, W: T.SKYWIND_W };
const seg = (x, y, dir, n) => Array.from({ length: n }, (_, i) => {
  const [dx, dy] = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] }[dir];
  return [x + dx * i, y + dy * i, dir];
});
export const KUMOI_WINDS = {
  // ハネノの島 → 風見の小島（西へ）
  w1: seg(44, 29, 'W', 7),
  // 風見の小島 → ハネノの島（東へ）
  w2: seg(38, 31, 'E', 7),
  // 風見の小島 → 北へ（曲がり角 j1 … 北なら 小さなうき島・西なら 西の風見の小島）
  w3: [...seg(34, 25, 'N', 9), [34, 15, 'N']],
  w3west: seg(33, 16, 'W', 12),
  // 小さなうき島 → 風見の小島（南へ）
  w4: seg(36, 14, 'S', 13),
  // 西の風見の小島 → 南へ（曲がり角 j2 … 東なら 風見の小島・南なら しずみゆく島）
  w5: seg(18, 20, 'S', 10),
  w5east: seg(19, 30, 'E', 11),
  w5south: seg(18, 31, 'S', 6),
  // しずみゆく島 → ハネノの島（東へ、それから 北へ）
  w6: [...seg(25, 44, 'E', 25), ...seg(50, 44, 'N', 6)],
  // 第5章 Step 5: 星読みの里の 島 → 東へ（西の風見の小島から 南へ ふく 風 w5 に 合流。風見の小島か しずみゆく島へ）
  w8: seg(12, 26, 'E', 6),
  // 第5章 Step 6・7: 根の島 → 北へ（ハネノの島の 南へ 帰る）
  w10: seg(56, 47, 'N', 7),
};
// 開け しめ できる 風の道（ふだんは 雲の 海。flag が たつと 風の道）
// w7 … しずみゆく島の 北西 → 北へ → 星読みの里の 島（風見の石3。守り星の かけら〈c5_shard〉の あとで ないと 回らない）
export const KUMOI_ROADS = {
  w7: { cells: seg(9, 38, 'N', 8), flag: KUMOI_VANES.v3, vane: 'vane3' },
  // 第5章 Step 6・7: ハネノの島の 南 → 南へ → 根の島（風見の石4。長ソラネの 話〈c5_root〉の あとで ないと 回らない）
  w9: { cells: seg(61, 41, 'S', 7), flag: KUMOI_VANES.v4, vane: 'vane4' },
};
// 影の城が うかぶと（c5_castle）とぎれる 風の道（ハネノの島の 西の 船着き場 → 風見の小島。帰りの w2 は のこる）
export const CASTLE_CUT = 'w1';
// 曲がり角（風見の石で 向きが かわる）: off … 回す 前 / on … 回した あと
export const KUMOI_JUNCTIONS = {
  j1: { x: 34, y: 16, off: 'N', on: 'W', flag: KUMOI_VANES.v1, vane: 'vane1' },
  j2: { x: 18, y: 30, off: 'E', on: 'S', flag: KUMOI_VANES.v2, vane: 'vane2' },
};

// 島の 地面（まん中は 草、ふちは 雲に とけかけた 草）。しずみゆく島は ふちが ひろい
function isleGround(name, I, x, y) {
  const d = ((x + 0.5 - I.cx) / I.rx) ** 2 + ((y + 0.5 - I.cy) / I.ry) ** 2;
  const rim = name === 'sink' ? 0.66 : 0.78;
  if (d > rim + (fbm(x * 0.4, y * 0.4, 1501) - 0.5) * 0.12) return T.CLOUD_RIM;
  const r = hash2(x, y, 1503);
  if (r < 0.08) return T.FLOWERS;
  if (r < 0.16) return T.TALLGRASS;
  return T.GRASS;
}

export function buildKumoiTiles() {
  const W = KUMOI_W, H = KUMOI_H;
  const t = new Uint8Array(W * H).fill(T.CLOUD_SEA);
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < W && y < H) t[y * W + x] = v; };
  const get = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? t[y * W + x] : T.CLOUD_SEA);
  const gates = [];
  // 1) 島
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const k = isleAt(x, y);
      if (!k) continue;
      const g = isleGround(k, IS[k], x, y);
      if (IS[k].show) {
        // 雲から 出てくる 島（それまでは 雲の 海）
        gates.push({ x, y, closed: T.CLOUD_SEA, open: g, flag: IS[k].show });
        continue;
      }
      set(x, y, g);
    }
  }
  // 2) 島の 木（ハネノの島・風見の小島）と、しずみゆく島の かたむいた 木と 柱
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (get(x, y) !== T.GRASS) continue;
      const k = isleAt(x, y);
      if (k === 'sink' && hash2(x, y, 1507) < 0.1) set(x, y, hash2(x, y, 1509) < 0.6 ? T.TILT_TREE : T.TILT_PILLAR);
      else if ((k === 'hanono' || k === 'far') && hash2(x, y, 1511) < 0.05) set(x, y, T.TREE);
      else if (k !== 'sink' && hash2(x, y, 1513) < 0.02) set(x, y, T.TILT_TREE);
    }
  }
  // 3) ハネノの島: 町（生けがきの 中に 家の やね）・門・降り場・道
  const TW = KUMOI_TOWN;
  for (let y = TW.y; y < TW.y + TW.h; y++) for (let x = TW.x; x < TW.x + TW.w; x++) {
    const edge = x === TW.x || y === TW.y || x === TW.x + TW.w - 1 || y === TW.y + TW.h - 1;
    set(x, y, edge ? T.HEDGE : T.GRASS);
  }
  for (const [x, y, w, h] of KUMOI_HOUSES) for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(i, j, T.WALL_WOOD);
  for (let y = TW.y + 1; y < TW.y + TW.h - 1; y++) for (const x of [58, 59]) if (get(x, y) === T.GRASS) set(x, y, T.STONE_PATH);
  for (const g of KUMOI_POS.gate) set(g.x, g.y, T.STONE_PATH);
  const P = KUMOI_POS.plaza;
  for (let y = TW.y + TW.h; y < P.y; y++) for (const x of [58, 59]) set(x, y, T.STONE_PATH);
  for (let y = P.y; y < P.y + P.h; y++) for (let x = P.x; x < P.x + P.w; x++) set(x, y, T.PLAZA);
  // 降り場 → 西の 船着き場（風の道の のりば）・南の 風の道の 着く ところ
  for (let x = KUMOI_POS.pier.x; x < P.x; x++) for (const y of [30, 31]) set(x, y, T.DIRT);
  for (let y = 29; y <= 31; y++) set(45, y, T.DIRT);
  for (let x = 50; x < P.x; x++) set(x, 37, T.DIRT);
  for (let y = 37; y <= 38; y++) set(50, y, T.DIRT);
  set(KUMOI_POS.sign.x, KUMOI_POS.sign.y, T.SIGN);
  // 4) しずみゆく島: 古い 神殿（入口は 北）
  const R = RUIN_OUT;
  for (let y = R.y; y < R.y + R.h; y++) for (let x = R.x; x < R.x + R.w; x++) set(x, y, T.RUIN_WALL);
  for (const [x, y] of R.pillars) set(x, y, T.TILT_PILLAR);
  set(R.door.x, R.door.y, T.RUIN_DOOR);
  for (let x = R.door.x - 1; x <= R.door.x + 1; x++) set(x, R.door.y + 1, T.GRASS);
  // 北の 風の道の 着く 所から、神殿の 東がわを まわって 南の 入口へ（木や 柱を どける）
  for (let y = R.y - 2; y <= R.door.y + 2; y++) for (let x = R.x + R.w + 1; x <= R.x + R.w + 2; x++) if ([T.TREE, T.TILT_TREE, T.TILT_PILLAR].includes(get(x, y))) set(x, y, T.GRASS);
  for (let x = R.door.x - 1; x <= R.x + R.w + 2; x++) if ([T.TREE, T.TILT_TREE, T.TILT_PILLAR].includes(get(x, R.door.y + 1))) set(x, R.door.y + 1, T.GRASS);
  set(KUMOI_POS.sinkSign.x, KUMOI_POS.sinkSign.y, T.SIGN);
  // 4b) 星読みの里の 島: 生けがきの 中に 家の やね・門（第5章 Step 5）
  const ST = STAR_TOWN;
  for (let y = ST.y; y < ST.y + ST.h; y++) for (let x = ST.x; x < ST.x + ST.w; x++) {
    const edge = x === ST.x || y === ST.y || x === ST.x + ST.w - 1 || y === ST.y + ST.h - 1;
    set(x, y, edge ? T.HEDGE : T.GRASS);
  }
  for (const [x, y, w, h] of STAR_HOUSES) for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(i, j, T.WALL_WOOD);
  for (const g of KUMOI_POS.starGate) { set(g.x, g.y, T.STONE_PATH); set(g.x, g.y + 1, T.STONE_PATH); }
  for (const p of [KUMOI_POS.starSign, KUMOI_POS.roadSign]) set(p.x, p.y, T.SIGN);
  // 4c) 根の島: 大地の 神殿の 古い 石がこい（入口は 南。根が からみついていて、c5_root で ほどける）・大きな 根（第5章 Step 6・7）
  const EO = EARTH_OUT;
  for (let y = EO.y - 1; y <= EO.y + EO.h; y++) for (let x = EO.x - 1; x <= EO.x + EO.w; x++) if (isleAt(x, y) === 'root') set(x, y, T.GRASS);
  for (let y = EO.y; y < EO.y + EO.h; y++) for (let x = EO.x; x < EO.x + EO.w; x++) set(x, y, T.RUIN_WALL);
  set(EO.door.x, EO.door.y, T.GAIA_ROOT);
  gates.push({ x: EO.door.x, y: EO.door.y, closed: T.GAIA_ROOT, open: T.ROOT_GATE, flag: K7.root });
  for (const [x, y] of ROOT_DECO) set(x, y, T.GAIA_ROOT);
  set(KUMOI_POS.rootSign.x, KUMOI_POS.rootSign.y, T.SIGN);
  // 5) 風の道（雲の 上）。のる 所と 着く 所は 島の 地面
  for (const cells of Object.values(KUMOI_WINDS)) for (const [x, y, d] of cells) set(x, y, DIR_TILE[d]);
  // 開け しめ できる 風の道（ふだんは 雲の 海）
  for (const R of Object.values(KUMOI_ROADS)) for (const [x, y, d] of R.cells) gates.push({ x, y, closed: T.CLOUD_SEA, open: DIR_TILE[d], flag: R.flag });
  for (const J of Object.values(KUMOI_JUNCTIONS)) {
    set(J.x, J.y, DIR_TILE[J.off]);
    gates.push({ x: J.x, y: J.y, closed: DIR_TILE[J.off], open: DIR_TILE[J.on], flag: J.flag });
  }
  // 風の 着く 所・のる 所に 木や 柱が あれば 草に（流されて 着いた 先が ふさがらない ように）
  const SOLIDS = [T.TREE, T.TILT_TREE, T.TILT_PILLAR];
  const DV = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
  const allWind = [...Object.values(KUMOI_WINDS).flat(), ...Object.values(KUMOI_ROADS).flatMap((R) => R.cells), ...Object.values(KUMOI_JUNCTIONS).flatMap((J) => [[J.x, J.y, J.off], [J.x, J.y, J.on]])];
  for (const [x, y, d] of allWind) {
    for (const [dx, dy] of [DV[d], ...Object.values(DV)]) if (SOLIDS.includes(get(x + dx, y + dy))) set(x + dx, y + dy, T.GRASS);
  }
  // 宝箱の まわりも 草に
  for (const c of KUMOI_CHESTS) for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) if (SOLIDS.includes(get(c.x + dx, c.y + dy))) set(c.x + dx, c.y + dy, T.GRASS);
  // 風見の石3の まわりと、そこから 風の道 w7 の のりばまでも 草に（第5章 Step 5）
  const V3 = KUMOI_POS.vane3;
  for (let y = 38; y <= V3.y + 1; y++) for (let x = 8; x <= V3.x; x++) if (SOLIDS.includes(get(x, y))) set(x, y, T.GRASS);
  // 風見の石4の まわりも 草に（第5章 Step 6・7）
  const V4 = KUMOI_POS.vane4;
  for (let y = V4.y - 2; y <= V4.y; y++) for (let x = V4.x - 3; x <= KUMOI_POS.rootRoadSign.x; x++) if (SOLIDS.includes(get(x, y))) set(x, y, T.GRASS);
  set(KUMOI_POS.rootRoadSign.x, KUMOI_POS.rootRoadSign.y, T.SIGN);
  // 影の城が うかぶと とぎれる 風の道（c5_castle。雲の 海に なる）
  for (const [x, y] of KUMOI_WINDS[CASTLE_CUT]) gates.push({ x, y, closed: get(x, y), open: T.CLOUD_SEA, flag: K7.castle });
  // 6) 風見の石
  for (const k of ['vane1', 'vane2', 'vane3', 'vane4']) set(KUMOI_POS[k].x, KUMOI_POS[k].y, T.VANE);
  for (const R of Object.values(KUMOI_ROADS)) gates.push({ x: KUMOI_POS[R.vane].x, y: KUMOI_POS[R.vane].y, closed: T.VANE, open: T.VANE_ON, flag: R.flag });
  for (const J of Object.values(KUMOI_JUNCTIONS)) {
    const V = KUMOI_POS[J.vane];
    gates.push({ x: V.x, y: V.y, closed: T.VANE, open: T.VANE_ON, flag: J.flag });
  }
  return { w: W, h: H, tiles: t, gates };
}
// ハネノの島の 町の 家（やねだけ 見える。中へは 門から）
export const KUMOI_HOUSES = [[53, 22, 4, 3], [61, 22, 4, 3], [53, 26, 4, 2], [61, 26, 4, 2]];
// 星読みの里の 島の 家（やねだけ。第5章 Step 5）
export const STAR_HOUSES = [[5, 24, 4, 2]];
// 根の島の 大きな 根（かざり。第5章 Step 6・7）
const ROOT_DECO = [[55, 50], [55, 52], [64, 50], [64, 52], [58, 55], [62, 55]];
const ROOF_COLORS = ['white', 'teal', 'blue', 'pink'];

// どの ちいきか: 島の 上は t5_kumoi。雲・風の道・町と 降り場・神殿の 入口の まわりは 出ない
export function makeKumoiZone(tiles) {
  const P = KUMOI_POS.plaza, TW = KUMOI_TOWN, D = RUIN_OUT.door;
  return (x, y) => {
    const v = x >= 0 && y >= 0 && x < KUMOI_W && y < KUMOI_H ? tiles[y * KUMOI_W + x] : T.CLOUD_SEA;
    if (v === T.CLOUD_SEA || (v >= T.SKYWIND_N && v <= T.SKYWIND_W)) return 'safe:cloud';
    if (x >= TW.x - 2 && x < TW.x + TW.w + 2 && y >= TW.y - 1 && y <= P.y + P.h + 1) return 'safe:hanono';
    if (Math.hypot(x - D.x, y - D.y) < 4) return 'safe:ruin';
    // 星読みの里の 島（第5章 Step 5）: 生けがきと 門・風の道の のりばの まわりは 出ない。ほかは 里の まわりの 魔物（B の t5_village）
    if (isleAt(x, y) === 'star') {
      const ST = STAR_TOWN;
      if (x >= ST.x - 1 && x <= ST.x + ST.w && y >= ST.y - 1 && y <= ST.y + ST.h + 1) return 'safe:star';
      if (Math.hypot(x - 9, y - 30) < 2.5 || Math.hypot(x - 11, y - 26) < 2) return 'safe:pier';
      return 't5_village';
    }
    // 根の島（第5章 Step 6・7）: 神殿の 入口・風の道の 着く 所の まわりは 出ない。ほかは 根の島の 魔物（B の t5_root）
    if (isleAt(x, y) === 'root') {
      const EO = EARTH_OUT;
      if (x >= EO.door.x - 2 && x <= EO.door.x + 2 && y >= EO.door.y && y <= EO.door.y + 2) return 'safe:earth';
      if (Math.hypot(x - 61, y - 48) < 2 || Math.hypot(x - 56, y - 48) < 2) return 'safe:pier';
      return 't5_root';
    }
    if (Math.hypot(x - KUMOI_POS.vane4.x, y - KUMOI_POS.vane4.y) < 3 || Math.hypot(x - 61, y - 40) < 2 || Math.hypot(x - 56, y - 40) < 2) return 'safe:pier';
    if (Math.hypot(x - KUMOI_POS.vane3.x, y - KUMOI_POS.vane3.y) < 2.5 || Math.hypot(x - 9, y - 39) < 1.5) return 'safe:pier';
    // 風の道の のりば（船着き場）
    if (Math.hypot(x - 45, y - 30) < 3 || Math.hypot(x - 50, y - 38) < 2.5) return 'safe:pier';
    return 't5_kumoi';
  };
}
export function kumoiAreaName(x, y) {
  const k = isleAt(x, y);
  if (k === 'hanono' && x >= KUMOI_TOWN.x && x < KUMOI_TOWN.x + KUMOI_TOWN.w && y >= KUMOI_TOWN.y && y < KUMOI_TOWN.y + KUMOI_TOWN.h) return 'ハネノの町';
  if (k === 'star') return '星読みの里の島';
  return k ? IS[k].name : 'クモイ地方';
}

const at = (p) => [p.x, p.y];
const KUMOI_NPCS = [
  // ハネビトの 見張り（町の 門の 前）
  npc('c5_k_guard', 'ハネビトの見張り', at(KUMOI_POS.guard), 'hanebito_guard', 'c5_k_guard', { dir: 'left' }),
  // 第5章 Step 7: 影の城（雲の 海の まん中に うかぶ。まだ 入れない。影の城の 前の 小島から 話しかけられる）
  npc('shadow_castle', '影の城', at(KUMOI_POS.castle), 'shadow_castle', 'c5_castle_view', { solid: false, show: { all: [K7.castle] } }),
];
const KUMOI_CHESTS = [
  { id: 'k5_treasure', x: 34, y: 11, item: 'seed_agi' },
  { id: 'k5_vane2', x: 16, y: 17, item: 'magic_water', n: 2 },
  { id: 'k5_sink', x: 10, y: 46, gold: 4800 },
  // c5_shard の あと（雲から 出てきた 島・竜で 行く はなれ小島）
  { id: 'k5_rise', x: 40, y: 51, item: 'seed_hp', show: { all: [K5.shard] } },
  { id: 'k5_far', x: 70, y: 9, item: 'seed_mag' },
  // 第5章 Step 6・7: 根の島・影の城の 前の 小島（c5_castle の あと）
  { id: 'k5_root', x: 65, y: 53, item: 'seed_str' },
  { id: 'k5_shade', x: 45, y: 38, item: 'seed_hp', show: { all: [K7.castle] } },
];
// 影の城が うかんだ あとの 空の 色（クモイ地方・ハネノの 町。昼でも 夕方くらいの 色）
export const KUMOI_DUSK = { flag: K7.castle, color: 'rgba(120, 44, 70, 0.24)' };
const KUMOI_SIGNS = [
  { ...KUMOI_POS.sign, text: 'ここはハネノの島。\n↑ ハネノの町\n← 西の船着き場から、風の道で風見の小島へ' },
  { ...KUMOI_POS.sinkSign, text: 'しずみゆく島。\n古い神殿の入口は、神殿の南がわ。\n（島がかたむいて、とびらがゆがんでいる…）' },
  // 第5章 Step 5
  { ...KUMOI_POS.starSign, text: 'ここは星読みの里。\n↑ 里の門\n→ 東の風の道で、西の風見の小島の南へ' },
  { ...KUMOI_POS.roadSign, text: '↑ 北の雲の向こうに、星読みの里があるという。\n（風見の石を回すと、北へ風の道が開くらしい）' },
  // 第5章 Step 6・7
  { ...KUMOI_POS.rootRoadSign, text: '↓ 南の雲の下に、島々をささえる「根の島」がある。\n（風見の石を回すと、南へ風の道が開くらしい）' },
  { ...KUMOI_POS.rootSign, text: 'ここは根の島。\n島々をささえる大きな根が、雲の海の下までのびている。\n↑ 大地の神殿（入口は、古い石がこいの南がわ）\n↑ 北の風の道で、ハネノの島へ' },
];

function kumoiField() {
  const b = buildKumoiTiles();
  return {
    id: 'kumoi', name: 'クモイ地方', kind: 'field', bgm: 'kumoi', dark: false, ground: T.GRASS,
    outside: 'cloud', // 2.5D の マップの そとは 雲の 海（render/field3d.js）
    sky3d: { bg: '#7ab4e8', fog: 0xd8e8f8 },
    bg2d: '#e4ecf8',
    w: b.w, h: b.h, tiles: b.tiles, gates: b.gates,
    npcs: KUMOI_NPCS, chests: KUMOI_CHESTS, signs: KUMOI_SIGNS, boards: [],
    roofs: [...KUMOI_HOUSES.map(([x, y, w, h], i) => ({ x, y, w, h, color: ROOF_COLORS[i % ROOF_COLORS.length] })), ...STAR_HOUSES.map(([x, y, w, h]) => ({ x, y, w, h, color: 'purple' }))],
    labels: Object.values(IS).filter((I) => !I.show).map((I) => ({ name: I.name, x: Math.round(I.cx - I.rx), y: Math.round(I.cy - I.ry), w: Math.round(I.rx * 2), h: Math.round(I.ry * 2) })),
    // 風見の石（しらべる）
    actions: [
      ...Object.keys(KUMOI_JUNCTIONS).map((k) => ({ ...KUMOI_POS[KUMOI_JUNCTIONS[k].vane], script: `c5_kvane_${k}` })),
      // 第5章 Step 5: 星読みの里への 風の道を 開ける 風見の石3
      ...Object.keys(KUMOI_ROADS).map((k) => ({ ...KUMOI_POS[KUMOI_ROADS[k].vane], script: `c5_kroad_${k}` })),
    ],
    warps: [
      // 町の 門 → ハネノの 町
      ...KUMOI_POS.gate.map((g) => ({ x: g.x, y: g.y, to: { map: 'hanono', ...HANONO_POS.arrive, dir: 'up' } })),
      // しずみゆく島の 古い 神殿
      { x: RUIN_OUT.door.x, y: RUIN_OUT.door.y, to: { map: 'sink_ruin_1f', ...RUIN_OUT.inside, dir: 'up' } },
      // 第5章 Step 5: 星読みの里の 門 → 星読みの里（maps/hoshiyomi.js の HOSHIYOMI_ARRIVE と おなじ 場所）
      ...KUMOI_POS.starGate.map((g) => ({ x: g.x, y: g.y, to: { map: 'hoshiyomi', x: 20.5, y: 26.5, dir: 'up' } })),
      // 第5章 Step 6・7: 根の島の 大地の 神殿（入口の 根は c5_root で ほどける）
      { x: EARTH_OUT.door.x, y: EARTH_OUT.door.y, to: { map: 'earth_1f', ...EARTH_OUT.inside, dir: 'up' } },
    ],
    triggers: [],
    links: [],
    zoneAt: makeKumoiZone(b.tiles), areaName: kumoiAreaName,
    // 第5章 Step 7: 影の城が うかぶと（c5_castle）曲が かわり、空が 夕ぐれの 色に（client/field.js の dusk）
    bgmAt: (x, y, night, has) => (has?.(K7.castle) ? 'kumoi_dusk' : 'kumoi'),
    dusk: KUMOI_DUSK,
    spawnCounts: { t5_kumoi: 9, t5_village: 3, t5_root: 3 },
    sparkles: [{ id: 'ksp0', x: 31, y: 30, zone: 't5_kumoi' }, { id: 'ksp1', x: 20, y: 18, zone: 't5_kumoi' }, { id: 'ksp2', x: 12, y: 49, zone: 't5_kumoi' }],
  };
}

// ───────────── ハネノの 町（フィールド 'hanono'）─────────────
// 雲の 海に うかぶ いちばん 大きな 島の 町。北に 長ソラネの 家、西に 宿屋と 武器と防具の店、東に 教会と 道具屋、北東に 見晴らし台。
// 南の 門（3マス）を ふむと クモイ地方の ハネノの島へ もどる
export const HANONO_W = 46;
export const HANONO_H = 38;
const HN = { cx: 23, cy: 18.5, rx: 21.5, ry: 17.5 };
// たてもの（x, y, はば, 高さ, とびらの x。とびらは 下の かべ）
export const HANONO_HOUSES = {
  sorane: { x: 16, y: 3, w: 14, h: 7, door: 23, roof: 'white', name: '長の家' },
  inn: { x: 4, y: 12, w: 10, h: 6, door: 9, roof: 'teal', kind: 'inn' },
  church: { x: 32, y: 12, w: 10, h: 6, door: 36, roof: 'blue', kind: 'church' },
  arms: { x: 4, y: 21, w: 10, h: 6, door: 9, roof: 'purple', kind: 'arms' },
  item: { x: 32, y: 21, w: 10, h: 6, door: 36, roof: 'pink', kind: 'item' },
};
const HH = HANONO_HOUSES;
export const HANONO_POS = {
  arrive: { x: 23.5, y: 34.5 }, // クモイ地方から 来て 着く ところ
  exit: [{ x: 22, y: 36 }, { x: 23, y: 36 }, { x: 24, y: 36 }], // 南の 門（ふむと クモイ地方へ）
  statue: { x: 23, y: 17 }, // 広場の 羽の 像
  sorane: { x: 23, y: 5 },
  pipi: { x: 40, y: 9 }, // 見晴らし台（北東）
  lookout: { x: 37, y: 6, w: 7, h: 5 },
  sign: { x: 26, y: 30 },
};

export function buildHanonoTiles() {
  const W = HANONO_W, H = HANONO_H;
  const t = new Uint8Array(W * H).fill(T.CLOUD_SEA);
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < W && y < H) t[y * W + x] = v; };
  const get = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? t[y * W + x] : T.CLOUD_SEA);
  // 1) 島（ふちは 雲に とけかけた 草）
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = ((x + 0.5 - HN.cx) / HN.rx) ** 2 + ((y + 0.5 - HN.cy) / HN.ry) ** 2;
    if (d >= 1) continue;
    if (d > 0.84 + (fbm(x * 0.4, y * 0.4, 1521) - 0.5) * 0.1) set(x, y, T.CLOUD_RIM);
    else set(x, y, hash2(x, y, 1523) < 0.07 ? T.FLOWERS : T.GRASS);
  }
  // 2) 広場と 道（南の 門 → 広場 → 長の家）
  for (let y = 11; y <= 27; y++) for (let x = 16; x <= 30; x++) set(x, y, T.PLAZA);
  for (let y = 28; y <= HANONO_POS.exit[0].y; y++) for (let x = 22; x <= 24; x++) set(x, y, T.STONE_PATH);
  for (let y = HH.sorane.y + HH.sorane.h; y <= 10; y++) set(HH.sorane.door, y, T.STONE_PATH);
  // 宿屋・教会・店への 道
  for (const k of ['inn', 'church', 'arms', 'item']) {
    const B = HH[k];
    const y0 = B.y + B.h;
    set(B.door, y0, T.STONE_PATH);
    const [xa, xb] = B.door < 16 ? [B.door, 15] : [31, B.door];
    for (let x = xa; x <= xb; x++) set(x, y0, T.STONE_PATH);
  }
  // 3) たてもの（木の かべ・ゆか・とびら）
  for (const B of Object.values(HH)) {
    for (let y = B.y; y < B.y + B.h; y++) for (let x = B.x; x < B.x + B.w; x++) {
      const edge = x === B.x || y === B.y || x === B.x + B.w - 1 || y === B.y + B.h - 1;
      set(x, y, edge ? T.WALL_WOOD : T.FLOOR_WOOD);
    }
    set(B.door, B.y + B.h - 1, T.DOOR);
  }
  // 中の かぐ
  const S = HH.sorane;
  for (let x = S.x + 4; x <= S.x + 9; x++) set(x, S.y + 3, T.CARPET);
  for (let y = S.y + 3; y <= S.y + 5; y++) set(S.door, y, T.CARPET);
  set(S.x + 1, S.y + 1, T.BOOKSHELF); set(S.x + 2, S.y + 1, T.BOOKSHELF); set(S.x + S.w - 2, S.y + 1, T.SHELF);
  set(S.x + 2, S.y + 4, T.TABLE); set(S.x + 3, S.y + 4, T.CHAIR); set(S.x + S.w - 3, S.y + 4, T.BED);
  set(S.x + S.w - 2, S.y + 5, T.POT);
  const I = HH.inn;
  for (let x = I.x + 2; x <= I.x + 6; x++) set(x, I.y + 2, T.COUNTER);
  set(I.x + 8, I.y + 1, T.BED); set(I.x + 8, I.y + 3, T.BED); set(I.x + 1, I.y + 4, T.POT);
  const C = HH.church;
  set(C.door, C.y + 1, T.ALTAR);
  for (const x of [C.x + 2, C.x + 3, C.x + 6, C.x + 7]) set(x, C.y + 3, T.CHAIR);
  set(C.x + 1, C.y + 1, T.LAMP); set(C.x + C.w - 2, C.y + 1, T.LAMP);
  const A = HH.arms;
  for (let x = A.x + 1; x <= A.x + 8; x++) set(x, A.y + 2, T.COUNTER);
  set(A.x + 1, A.y + 1, T.SHELF); set(A.x + 8, A.y + 1, T.SHELF); set(A.x + 1, A.y + 4, T.BARREL);
  const M = HH.item;
  for (let x = M.x + 2; x <= M.x + 7; x++) set(x, M.y + 2, T.COUNTER);
  set(M.x + 1, M.y + 1, T.SHELF); set(M.x + 8, M.y + 1, T.SHELF); set(M.x + 8, M.y + 4, T.POT); set(M.x + 1, M.y + 4, T.CRATE);
  // 4) 広場の 羽の 像・花だん・ランプ・木
  set(HANONO_POS.statue.x, HANONO_POS.statue.y, T.STATUE);
  for (const [x, y] of [[20, 14], [26, 14], [20, 21], [26, 21]]) set(x, y, T.TOWN_FLOWERS);
  for (const [x, y] of [[16, 11], [30, 11], [16, 27], [30, 27], [21, 33], [25, 33]]) set(x, y, T.LAMP);
  // 5) 見晴らし台（北東。さくの 内がわは 石だたみ）
  const L = HANONO_POS.lookout;
  for (let y = L.y; y < L.y + L.h; y++) for (let x = L.x; x < L.x + L.w; x++) {
    const edge = x === L.x + L.w - 1 || y === L.y;
    set(x, y, edge ? T.FENCE : T.STONE_PATH);
  }
  for (let x = 31; x < L.x; x++) set(x, 10, T.STONE_PATH);
  // 6) 木（道や たてものから はなれた 草の 上）
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    if (get(x, y) !== T.GRASS) continue;
    const near = [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => ![T.GRASS, T.FLOWERS, T.CLOUD_RIM].includes(get(x + dx, y + dy)));
    if (!near && hash2(x, y, 1527) < 0.07) set(x, y, hash2(x, y, 1529) < 0.3 ? T.TILT_TREE : T.TREE);
  }
  // 南の 門（雲の 海の きわまで 石の 道）
  for (const p of HANONO_POS.exit) set(p.x, p.y, T.STONE_PATH);
  set(HANONO_POS.sign.x, HANONO_POS.sign.y, T.SIGN);
  return { w: W, h: H, tiles: t };
}

// ハネノの 町の 人（だいほんは data/story-kumoi.js）
const DAY = { not: ['@night'] };
const HN_NPCS = [
  npc('sorane', '長ソラネ', at(HANONO_POS.sorane), 'sorane', 'c5_sorane', { dir: 'down' }),
  // ピピ（第5章 Step 6: 長ソラネの 話〈c5_root〉の あと、こっそり 大地の 神殿へ。助けた あとは maps/earth.js の pipi_home）
  npc('pipi', 'ピピ', at(HANONO_POS.pipi), 'pipi', 'c5_pipi', { dir: 'right', show: { not: [K7.root] } }),
  // 宿屋・教会・武器と防具の店・道具屋（カウンターの 向こう）
  npc('c5_h_inn', '宿屋のおかみ', [HH.inn.x + 4, HH.inn.y + 1], 'hanebito_f', 'c5_inn_hanono', { dir: 'down' }),
  npc('c5_h_priest', '神父さま', [HH.church.door, HH.church.y + 2], 'hanebito_priest', 'church', { dir: 'down' }),
  npc('c5_h_weapon', '武器屋のハネビト', [HH.arms.x + 3, HH.arms.y + 1], 'hanebito_m', 'c5_shop_hw', { dir: 'down' }),
  npc('c5_h_armor', '防具屋のハネビト', [HH.arms.x + 6, HH.arms.y + 1], 'hanebito_f2', 'c5_shop_ha', { dir: 'down' }),
  npc('c5_h_item', '道具屋のおじいさん', [HH.item.x + 4, HH.item.y + 1], 'hanebito_old', 'c5_shop_hi', { dir: 'down' }),
  // 町の 人
  npc('c5_h_gate', 'ハネビトの門番', [21, 32], 'hanebito_guard', 'c5_h_gate', { dir: 'down' }),
  npc('c5_h_old', '羽の弱ったおじいさん', [18, 24], 'hanebito_old', 'c5_h_old', { wander: 1 }),
  npc('c5_h_woman', 'ハネビトのおくさん', [28, 15], 'hanebito_f', 'c5_h_woman', { wander: 2 }),
  npc('c5_h_kid', 'ハネビトの女の子', [27, 25], 'hanebito_kid', 'c5_h_kid', { wander: 2, show: DAY }),
  npc('c5_h_wind', '風読みのハネビト', [34, 29], 'hanebito_m', 'c5_h_wind', { dir: 'left' }),
  npc('c5_h_scholar', 'ソラネの書記', [HH.sorane.x + 3, HH.sorane.y + 2], 'hanebito_f2', 'c5_h_scholar', { dir: 'down' }),
  // 第5章 Step 7: 影の城が うかんだ あと、広場に 集まる 人たち（maps/earth.js）
  ...HANONO_GATHER_NPCS,
];
const HN_CHESTS = [
  { id: 'hn_sorane', x: HH.sorane.x + HH.sorane.w - 3, y: HH.sorane.y + 1, item: 'magic_water', n: 2 },
  { id: 'hn_lookout', x: 42, y: 9, item: 'seed_def' },
];
const HN_SIGNS = [{ ...HANONO_POS.sign, text: 'ここは雲の上の町ハネノ。\nハネビトの町。\n「風とともに生き、風に感謝せよ」' }];
const HB = (B, kind, name) => ({ x: B.door + 1, y: B.y + B.h - 1, kind, name });
const HN_BOARDS = [
  HB(HH.inn, 'inn', '宿屋'), HB(HH.church, 'church', '教会'), HB(HH.arms, 'arms', '武器と防具の店'), HB(HH.item, 'item', '道具屋'), HB(HH.sorane, 'palace', '長の家'),
];

function hanonoField() {
  const b = buildHanonoTiles();
  const P = HANONO_POS;
  const inTown = (x, y) => y < P.exit[0].y;
  return {
    id: 'hanono', name: 'ハネノの町', kind: 'field', bgm: 'hanono', dark: false, ground: T.GRASS,
    outside: 'cloud',
    sky3d: { bg: '#7ab4e8', fog: 0xd8e8f8 },
    bg2d: '#e4ecf8',
    // 竜の 笛を ふいた とき（町の 中には おりられない。world/travel.js の canCall）
    noFlyText: '風の笛をふいた！\nしかし星の竜アステルは、町の中にはおりられない。\n（南の門から外に出てふこう）',
    dusk: KUMOI_DUSK,
    w: b.w, h: b.h, tiles: b.tiles, gates: [],
    npcs: HN_NPCS, chests: HN_CHESTS, signs: HN_SIGNS, boards: HN_BOARDS,
    roofs: Object.values(HH).map((B) => ({ x: B.x, y: B.y, w: B.w, h: B.h, color: B.roof })),
    labels: [{ name: 'ハネノの町', x: 2, y: 1, w: 42, h: 34 }, { name: '見晴らし台', ...P.lookout }],
    actions: [{ x: P.statue.x, y: P.statue.y, script: 'c5_h_statue' }],
    warps: P.exit.map((e) => ({ x: e.x, y: e.y, to: { map: 'kumoi', ...KUMOI_POS.gateOut, dir: 'down' } })),
    triggers: [
      // はじめて 町に 入った（門番の あいさつ。c5_kumoi の あと）
      { id: 'c5_h_arrive', x: 20, y: 29, w: 7, h: 5, script: 'c5_h_arrive', show: { all: [K5.kumoi], not: [HANONO_SEEN] } },
    ],
    links: [],
    zoneAt: () => 'safe:hanono',
    areaName: (x, y) => (inTown(x, y) ? 'ハネノの町' : 'ハネノの島'),
    bgmAt: () => 'hanono',
    spawnCounts: {},
    sparkles: [],
  };
}

// ルーラ・帰り道の羽で 行ける（南の 門の 内がわに おりる）
export const KUMOI_TOWNS = {
  hanono: { name: 'ハネノの町', map: 'hanono', x: Math.floor(HANONO_POS.arrive.x), y: Math.floor(HANONO_POS.arrive.y) - 1, rect: [1, 1, HANONO_W - 2, HANONO_POS.exit[0].y - 1] },
};
Object.assign(SEA_PLACES, KUMOI_TOWNS);

// 第5章 Step 3・4 の マップの ID（セーブに のこるので かえない）
export const KUMOI_MAPS = ['kumoi', 'hanono'];

// maps/index.js の buildMaps から（ほかの マップが そろった あと・夜の 人の 前・finishMap の 前）
export function attachKumoi(maps) {
  maps.kumoi = kumoiField();
  maps.hanono = hanonoField();
  Object.assign(maps, buildRuinMaps());
}
