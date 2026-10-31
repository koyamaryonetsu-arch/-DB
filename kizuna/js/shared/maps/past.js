// 第6章 Step 1・2（A: 世界と物語）「千年前のミドリナ地方」と、今の ミドリナ地方に たす もの（maps/index.js の attachPast で まぜる）
// ※ ネタバレ注意: 第2部 第6章の 場所（docs/plan-ch6.md の 4・5・6）
// ・overworld_past … 今の 地図（overworld）と おなじ 大きさ・おなじ 座標。今の 地図から 作る（手で ぜんぶ かかない）:
//   道は 草原・村と 町の 場所は 森と 草原・川に 橋は ない・木が 多い・今は ある 洞窟や 塔の 入口は ない
//   ホシフルの里（今の ホシフル村の 場所）と 泉の里（今の ルミナの町の 場所。c6_flow まで 時が 止まって 灰色）
// ・時の砂時計（world/time-glass.js）: マップの timePair で 今 ⇔ 千年前。おなじ 座標に 出る
// ・過去で したことが 今に のこる: 千年前の ほしみの丘の ふもとに 星の木の なえを 植える（c6_planted）→ 今の その 場所に 大きな 星の木
//   （つたを のぼって、丘の 上の がけの 先へ → c6_tree）
// ・今の ミドリナ地方: ほしみの丘の 星の花の あった 所に 時のほこらの 入口（c6_start で 開く）・ルミナの町の 広場の はじまりの勇者の像
//   （c6_start 〜 c6_flow の あいだ うすく 消えかける）・ルミナの町の 北の 時のいせき（今は 木の根と がれきに うもれている。c6_rion で 入れる）
// だいほんは data/story-ch6.js
import { T, parseRows, TILE_INFO, LEGEND } from '../tiles.js?v=31a32b16dd7b';
import { fbm, hash2 } from '../rng.js?v=31a32b16dd7b';
import { npc } from './npc.js?v=31a32b16dd7b';
import { PLACES, BRIDGE_Y, LAKE, riverXAt } from './overworld.js?v=31a32b16dd7b';
import { PAST_TREASURE } from '../data/items-past.js?v=31a32b16dd7b';

// ───────────── フラグ（セーブに のこるので かえない）─────────────
// 物語の すすみぐあい（data/story-ch6.js の CH6_STEPS。plan-ch6.md の 9 の 名前の 約束）
export const C6 = {
  start: 'c6_start', shrine: 'c6_shrine', glass: 'c6_glass', past: 'c6_past', tree: 'c6_tree',
  rion: 'c6_rion', ruin: 'c6_ruin', gear: 'c6_gear', flow: 'c6_flow',
};
// 物語の すすみぐあいでは ない フラグ
export const HOSHIYO_FLAG = 'c6_hoshiyo'; // ホシヨの 話を 聞いた（星の木の なえを もらった）
export const DEW_FLAG = 'c6_dew'; // 千年前の 鏡の湖の ほとりで 星のしずくを 手に 入れた
export const PLANT_FLAG = 'c6_planted'; // 千年前の ほしみの丘の ふもとに 星の木の なえを 植えた（今に 大きな 星の木）
export const END_A6 = 'c6_end_a'; // ギアドンの あと、泉の里の 時が 動き出す 場面まで 見た（とちゅうで 切れた ときの 続き）
export const CHIEF_FLAG = 'c6_chief'; // ホシフルの里の 長に 話を 聞いた（目標が かわる）

// ───────────── マップの ID・名前 ─────────────
export const PAST_ID = 'overworld_past';
export const PAST_NAME = '千年前のミドリナ地方';
// ホシフルの里（今の ホシフル村の 中。左上の マス）・泉の里（今の ルミナの町の 中）
export const HAMLET = { x: 15, y: 95, w: 26, h: 16, name: 'ホシフルの里' };
export const SPRING = { x: 42, y: 29, w: 28, h: 20, name: '泉の里' };
const H = (x, y) => ({ x: HAMLET.x + x, y: HAMLET.y + y });
const SP = (x, y) => ({ x: SPRING.x + x, y: SPRING.y + y });
const SH = PLACES.shrine;
const TW = PLACES.town;

export const PAST_POS = {
  // ほしみの丘（今と おなじ 場所）: 星の花の あった 所に 時のほこらの 入口（今だけ）
  shrineDoor: { x: SH.x + 5, y: SH.y + 4 },
  shrineOut: { x: SH.x + 5.5, y: SH.y + 5.5 }, // ほこらから 出て 着く ところ
  // 丘の ふもと（星の木の なえを 植える 所。今は 大きな 星の木）と、丘の 上の がけの 先（木を のぼって 行く 所）
  seed: { x: SH.x + 5, y: SH.y - 2 },
  plateau: { x0: SH.x + 1, y0: SH.y - 8, x1: SH.x + 9, y1: SH.y - 4 }, // がけの わく（中は x0+1〜x1-1・y0+1〜y1-1）
  plateauIn: { x: SH.x + 5.5, y: SH.y - 5.5 }, // 木を のぼって 着く ところ
  treeFoot: { x: SH.x + 5.5, y: SH.y - 0.5 }, // 木から おりて 着く ところ
  vine: { x: SH.x + 5, y: SH.y - 4 }, // がけの 南の ふち（しらべると つたで おりる）
  // 千年前の 鏡の湖の 南の ほとり（星のしずく）
  dew: { x: LAKE.x, y: LAKE.y + LAKE.ry },
  // 時のいせきの 入口（今の ルミナの町の 北。千年前は 森の 中の 新しい 神殿）
  ruin: { x0: 48, y0: 10, x1: 52, y1: 12, door: { x: 50, y: 12 } },
  ruinOut: { x: 50.5, y: 13.6 }, // 遺跡から 出て 着く ところ（今も 千年前も）
  // はじまりの勇者の像（ルミナの町の 広場。ふん水の 南）
  statue: { x: TW.x + 23.5, y: TW.y + 20 },
  // 泉の里: 泉・リオンに 会う 里の 外れ（トリガー）・リオンたち
  spring: SP(14, 9),
  rionMeet: { x: SPRING.x + 8, y: SPRING.y + SPRING.h, w: 12, h: 2 },
  rion: SP(13, 14), chibi: SP(14, 15), minamo: SP(16, 14),
  // ホシフルの里: 里の 長・ホシヨ・たき火
  chief: H(5, 3), hoshiyo: H(20, 6), fire: H(12, 7), hamletIn: { x: HAMLET.x + 12.5, y: HAMLET.y + 9.5 },
};

// ───────────── タイルの ならび（256 いじょうの タイルが 入るので Uint16Array）─────────────
export function wideTiles(tiles) {
  const t = new Uint16Array(tiles.length);
  t.set(tiles);
  return t;
}
// parseRows の 16bit 版（第6章の マップ。extra の 文字を 先に 見る）
export function parseRows16(rows, extra = null) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const tiles = new Uint16Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x] ?? ' ';
      tiles[y * w + x] = extra?.[ch] ?? LEGEND[ch] ?? T.VOID;
    }
  }
  return { w, h, tiles };
}

// ───────────── ホシフルの里（26×16。わらの 家 4けん・たき火・店）─────────────
// S … わらの 家の かべ / _ … 木の ゆか / b … たき火 / = … ふみかためた 土の 道 / C … カウンター
export const HAMLET_ROWS = [
  'T..,.........,........,..T',
  '.SSSSSSS..........SSSSSSS.',
  '.S_B_t_S....,.....S_k__BS.',
  '.S_____S..........S_____S.',
  '.SSSDSSS..........SSSDSSS.',
  '....=......====.....=.....',
  '..,.=....==....==...=..,..',
  '....=====..,b,..=====.....',
  '........==.....==.........',
  '..........=====...........',
  '.SSSSSSSS.....=...SSSSSSS.',
  '.S______S.....=...S_____S.',
  '.S_C__C_S.....=...S__C__S.',
  '.S______S.....=...S_____S.',
  '.SSSSDSSS.....=...SSSDSSS.',
  'T.....=========.....=...T,',
];
const HAMLET_LEGEND = { S: T.STRAW_WALL, b: T.REST_FIRE };
// わらの 家の やね（中に 入ると 見えなく なる）
const HAMLET_ROOFS = [[1, 1, 7, 4], [18, 1, 7, 4], [1, 10, 8, 5], [18, 10, 7, 5]];

// ───────────── 泉の里（28×20。泉の まわりに テント。c6_flow まで 時が 止まっている）─────────────
function springRows() {
  const W = SPRING.w, Hh = SPRING.h;
  const g = Array.from({ length: Hh }, () => Array(W).fill('.'));
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
    const edge = x === 0 || y === 0 || x === W - 1 || y === Hh - 1;
    if (edge) g[y][x] = 'T';
    else if (hash2(x, y, 611) < 0.12) g[y][x] = ',';
  }
  // 北と 南の 出入り口・里の 中の 道
  for (let x = 12; x <= 16; x++) { g[0][x] = '='; g[Hh - 1][x] = '='; }
  for (let y = 1; y < Hh - 1; y++) g[y][14] = '=';
  for (let x = 3; x <= 24; x++) g[9][x] = '=';
  // 泉（だ円。c6_flow まで 灰色に 止まった 水）とまわりの 石だたみ
  for (let y = 5; y <= 13; y++) for (let x = 8; x <= 20; x++) {
    const d = Math.hypot((x - 14) / 4.6, (y - 9) / 3.1);
    if (d < 1) g[y][x] = '~';
    else if (d < 1.4) g[y][x] = ':';
  }
  return g.map((r) => r.join(''));
}
export const SPRING_ROWS = springRows();
// テント（大きな 人の え。3マス × 2マスを ふさぐ）・止まった 人たち
const TENTS = [[5, 4], [22, 4], [5, 15], [22, 15], [9, 17]];

// ───────────── 千年前の ミドリナ地方を 今の 地図から 作る ─────────────
const inRect = (x, y, r, pad = 0) => x >= r.x - pad && y >= r.y - pad && x < r.x + r.w + pad && y < r.y + r.h + pad;
const GROUNDISH = new Set([T.GRASS, T.FLOWERS, T.TALLGRASS, T.HILL, T.FOREST_FLOOR, T.SAND]);
// 今の 町・村の タイル（千年前には ない）
const TOWNISH = new Set([T.STONE_PATH, T.PLAZA, T.WALL_STONE, T.WALL_WOOD, T.FLOOR_WOOD, T.FLOOR_STONE, T.DOOR, T.COUNTER, T.TABLE, T.CHAIR, T.BED,
  T.SHELF, T.POT, T.BARREL, T.WELL, T.FOUNTAIN, T.FENCE, T.SIGN, T.STATUE, T.ALTAR, T.STAR_ALTAR, T.CARPET, T.LAMP, T.HEDGE, T.FIREPLACE, T.BOOKSHELF,
  T.CRATE, T.TOWN_FLOWERS]);

function pastTiles(present) {
  const W = present.w, Hh = present.h;
  const t = wideTiles(present.tiles);
  const get = (x, y) => (x >= 0 && y >= 0 && x < W && y < Hh ? t[y * W + x] : T.DEEP);
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < W && y < Hh) t[y * W + x] = v; };
  const village = PLACES.village, town = PLACES.town;
  const shrine = PLACES.shrine;
  const P = PAST_POS.plateau;
  // 今の 道の まわり（千年前も 人が 通った 草の 道。木で ふさがない）
  const road = new Uint8Array(W * Hh);
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
    if (present.tiles[y * W + x] !== T.DIRT) continue;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (x + dx >= 0 && y + dy >= 0 && x + dx < W && y + dy < Hh) road[(y + dy) * W + x + dx] = 1;
  }
  for (let y = 0; y < Hh; y++) {
    for (let x = 0; x < W; x++) {
      const cur = get(x, y);
      // 村と 町の 場所: 森と 草原（あとで 里を はめこむ）
      if (inRect(x, y, village, 1) || inRect(x, y, town, 1)) {
        const n = fbm(x * 0.15, y * 0.15, 607);
        set(x, y, n > 0.56 ? (hash2(x, y, 608) < 0.25 ? T.PINE : T.TREE) : hash2(x, y, 609) < 0.18 ? T.FLOWERS : hash2(x, y, 610) < 0.2 ? T.TALLGRASS : T.GRASS);
        continue;
      }
      // 道は 草原・橋と さんばしは 水・洞窟や 塔の 入口は 山
      if (cur === T.DIRT) set(x, y, hash2(x, y, 612) < 0.3 ? T.TALLGRASS : T.GRASS);
      else if (cur === T.BRIDGE_H || cur === T.BRIDGE_V || cur === T.BROKEN_BRIDGE || cur === T.PIER) set(x, y, T.WATER);
      else if ([T.CAVE_ENTRANCE, T.TOWER_BASE, T.TOWER_DOOR, T.TOWER_GATE].includes(cur)) set(x, y, T.MOUNTAIN);
      else if (TOWNISH.has(cur) && !inRect(x, y, shrine)) set(x, y, T.GRASS);
      else if (!TILE_INFO[cur]) set(x, y, T.GRASS);
      // 木が 多い（今より 森が 広い）。丘・湖の ほとり・川べりは ひらけた まま
      const now = get(x, y);
      if (now === T.GRASS || now === T.FLOWERS || now === T.TALLGRASS) {
        if (inRect(x, y, shrine, 4) || inRect(x, y, { x: P.x0, y: P.y0, w: P.x1 - P.x0 + 1, h: P.y1 - P.y0 + 3 }, 1)) continue;
        if (Math.hypot((x - LAKE.x) / (LAKE.rx + 3), (y - LAKE.y) / (LAKE.ry + 3)) < 1.25) continue;
        if (Math.abs(x + 0.5 - riverXAt(y)) < 6 || road[y * W + x]) continue;
        const n = fbm(x * 0.12, y * 0.12, 601);
        if (n > 0.6 && hash2(x, y, 602) < 0.8) set(x, y, hash2(x, y, 603) < 0.3 ? T.PINE : T.TREE);
      }
    }
  }
  // 川の 橋（BRIDGE_Y）の まわりも 水（橋は 千年前には ない）
  for (let x = 120; x < 146; x++) for (const y of [BRIDGE_Y - 1, BRIDGE_Y, BRIDGE_Y + 1]) if (get(x, y) === T.BRIDGE_H || get(x, y) === T.BROKEN_BRIDGE) set(x, y, T.WATER);
  // 丘の 上の がけの 中は 木（千年前は まだ のぼれない）
  for (let y = P.y0 + 1; y < P.y1; y++) for (let x = P.x0 + 1; x < P.x1; x++) set(x, y, T.TREE);
  // 時のいせき（千年前は 森の 中の 新しい 神殿）の まわりは 森・里からの 小道
  const R = PAST_POS.ruin;
  for (let y = R.y0 - 4; y <= R.y1 + 4; y++) for (let x = R.x0 - 6; x <= R.x1 + 6; x++) {
    if (y >= R.y0 && y <= R.y1 && x >= R.x0 && x <= R.x1) continue;
    if (GROUNDISH.has(get(x, y)) && hash2(x, y, 615) < 0.55) set(x, y, hash2(x, y, 616) < 0.3 ? T.PINE : T.TREE);
  }
  const path = [[50, 14], [51, 18], [53, 22], [55, 26], [SPRING.x + 14, SPRING.y]];
  for (let i = 0; i < path.length - 1; i++) {
    const [ax, ay] = path[i], [bx, by] = path[i + 1];
    const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay)) * 2;
    for (let k = 0; k <= n; k++) {
      const x = Math.round(ax + ((bx - ax) * k) / n), y = Math.round(ay + ((by - ay) * k) / n);
      for (const [dx, dy] of [[0, 0], [1, 0]]) if (get(x + dx, y + dy) !== T.WATER) set(x + dx, y + dy, T.FOREST_FLOOR);
    }
  }
  // 里を はめこむ
  const stamp = (r, rows, extra) => {
    const p = parseRows16(rows, extra);
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) set(r.x + x, r.y + y, p.tiles[y * p.w + x]);
  };
  for (const r of [HAMLET, SPRING]) for (let y = r.y - 2; y < r.y + r.h + 2; y++) for (let x = r.x - 2; x < r.x + r.w + 2; x++) {
    if ([T.TREE, T.PINE].includes(get(x, y))) set(x, y, T.GRASS);
  }
  stamp(HAMLET, HAMLET_ROWS, HAMLET_LEGEND);
  stamp(SPRING, SPRING_ROWS, { '~': T.FROZEN_WATER, '=': T.DIRT, ':': T.STONE_PATH });
  // 里から 外への 道（ホシフルの里 → 丘・泉の里の 南 → 野原）
  for (const [x0, y0, x1, y1] of [[HAMLET.x + 6, HAMLET.y + HAMLET.h, HAMLET.x + 20, HAMLET.y + HAMLET.h], [HAMLET.x + HAMLET.w, HAMLET.y + 7, HAMLET.x + HAMLET.w + 4, HAMLET.y + 7]]) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if ([T.TREE, T.PINE].includes(get(x, y))) set(x, y, T.GRASS);
  }
  return { t, get, set };
}

// 歩いて 行ける ところだけ のこす（行けない 草地は 木に する。千年前の 東の 平原は 川の むこうで 行けないので 深い 森）
function closeOff(map, start) {
  const { w, h, tiles } = map;
  const seen = new Uint8Array(w * h);
  const q = [start];
  seen[start[1] * w + start[0]] = 1;
  const open = (x, y) => !(TILE_INFO[tiles[y * w + x]]?.solid ?? true);
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const k = ny * w + nx;
      if (seen[k] || !open(nx, ny)) continue;
      seen[k] = 1;
      q.push([nx, ny]);
    }
  }
  for (let k = 0; k < w * h; k++) {
    if (seen[k] || !open(k % w, Math.floor(k / w))) continue;
    const id = tiles[k];
    if (GROUNDISH.has(id) || id === T.SWAMP || id === T.STEPPING) tiles[k] = hash2(k % w, Math.floor(k / w), 617) < 0.3 ? T.PINE : T.TREE;
  }
}

// ───────────── 千年前の 人（NPC）─────────────
// 止まった 人の え は 灰色（render/ch6-art.js の frozen_*）。c6_flow の あと 動き出す（色の ある え・うろうろ）
const FROZEN = [
  ['f_m1', '泉の里の男の人', [10, 6], 'man'], ['f_w1', '泉の里のおくさん', [19, 7], 'woman'], ['f_k1', '泉の里の子ども', [12, 12], 'kid'],
  ['f_e1', '泉の里のおばあさん', [17, 12], 'elder'], ['f_m2', '水くみの男の人', [8, 9], 'man'], ['f_g1', '泉の里の女の子', [20, 10], 'girl'],
];
function pastNpcs() {
  const C = PAST_POS;
  const out = [
    // ホシフルの里
    npc('p_chief', '里の長ホシマル', [C.chief.x, C.chief.y], 'past_elder', 'c6_p_chief'),
    npc('p_wife', '長のおくさん', [H(2, 3).x, H(2, 3).y], 'past_woman', 'c6_p_inn'),
    npc('hoshiyo', 'ホシヨ', [C.hoshiyo.x, C.hoshiyo.y], 'hoshiyo', 'c6_hoshiyo', { wander: 1 }),
    npc('p_weapon', '武器屋のおじさん', [H(3, 11).x, H(3, 11).y], 'past_man', 'c6_p_weapon'),
    npc('p_armor', '防具屋のおばさん', [H(6, 11).x, H(6, 11).y], 'past_woman2', 'c6_p_armor'),
    npc('p_item', '道具屋のむすめ', [H(21, 11).x, H(21, 11).y], 'past_girl', 'c6_p_item'),
    npc('p_prayer', 'いのりの石', [H(14, 7).x, H(14, 7).y], 'prayer_stone', 'c6_p_prayer'),
    npc('p_vil1', '里の男の人', [H(9, 8).x, H(9, 8).y], 'past_man2', 'c6_p_vil1', { wander: 2 }),
    npc('p_vil2', '里の子ども', [H(15, 9).x, H(15, 9).y], 'past_kid', 'c6_p_vil2', { wander: 2 }),
    npc('p_vil3', '里のおばあさん', [H(10, 6).x, H(10, 6).y], 'past_granny', 'c6_p_vil3'),
    npc('p_vil4', '星を見る男の人', [H(23, 7).x, H(23, 7).y], 'past_man', 'c6_p_vil4', { wander: 1 }),
    // ほしみの丘の ふもと（星の木の なえを 植える 所）・鏡の湖の ほとり（星のしずく）
    npc('seed_spot', 'やわらかい土', [C.seed.x, C.seed.y], 'seed_spot', 'c6_seed', { show: { not: [PLANT_FLAG] }, solid: false }),
    npc('star_sapling', '星の木のなえ', [C.seed.x, C.seed.y], 'star_sapling', 'c6_sapling', { show: { all: [PLANT_FLAG] } }),
    npc('star_dew_spot', '星のしずく', [C.dew.x, C.dew.y], 'star_dew', 'c6_dew', { show: { all: [HOSHIYO_FLAG], not: [DEW_FLAG] }, solid: false }),
    // 泉の里: テント・止まった 人たち（c6_flow まで）・動き出した 人たち・リオンたち
    ...TENTS.map(([x, y], i) => npc(`tent${i + 1}`, 'テント', [SPRING.x + x, SPRING.y + y], 'past_tent', 'c6_tent', { big: true })),
    ...FROZEN.map(([id, name, [x, y], k]) => npc(id, name, [SPRING.x + x, SPRING.y + y], `frozen_${k}`, 'c6_frozen', { show: { not: [C6.flow] } })),
    ...FROZEN.map(([id, name, [x, y], k]) => npc(`s${id.slice(1)}`, name, [SPRING.x + x, SPRING.y + y], `spring_${k}`, `c6_s${id.slice(1)}`, { show: { all: [C6.flow] }, wander: 1 })),
    npc('rion', 'リオン', [C.rion.x, C.rion.y], 'rion', 'c6_rion_talk', { show: { all: [C6.rion] } }),
    npc('chibi_astel', 'ちびアステル', [C.chibi.x, C.chibi.y], 'chibi_astel', 'c6_chibi', { show: { all: [C6.rion] } }),
    // ミナモ（c6_flow の あと 家に。Step 3・4 では c6_omen から c6_kanata まで ゲストで いっしょなので いない）
    npc('minamo_home', 'ミナモ', [C.minamo.x, C.minamo.y], 'minamo', 'c6_minamo_home', { show: { all: [C6.flow], not: ['c6_omen'] } }),
    npc('minamo_back', 'ミナモ', [C.minamo.x, C.minamo.y], 'minamo', 'c6_minamo_home', { show: { all: ['c6_kanata'] } }),
  ];
  return out;
}

// 宝箱（★は B の PAST_TREASURE.overworld_past。のこりは 道具）
const PAST_CHEST_SPOTS = [[44, 15], [LAKE.x, LAKE.y], [SH.x - 6, SH.y + 2], [24, 72], [100, 60], [33, 21]];
function pastChests() {
  const list = (PAST_TREASURE.overworld_past || []).slice(0, PAST_CHEST_SPOTS.length).map((item, i) => ({ id: `p6_ow${i}`, x: PAST_CHEST_SPOTS[i][0], y: PAST_CHEST_SPOTS[i][1], item }));
  return [...list, { id: 'p6_owx0', x: HAMLET.x + 24, y: HAMLET.y + 2, item: 'magic_water', n: 2 }];
}

// どの ちいきか（魔物の 出現表 t6_past_field は B）
function pastZone(x, y) {
  if (inRect(x, y, HAMLET, 1)) return 'safe:hamlet';
  if (inRect(x, y, SPRING, 1)) return 'safe:spring';
  if (inRect(x, y, PLACES.shrine, 1)) return 'safe:shrine';
  const R = PAST_POS.ruin;
  if (x >= R.x0 - 2 && x <= R.x1 + 2 && y >= R.y0 - 2 && y <= R.y1 + 3) return 'safe:ruin';
  if (x > riverXAt(y) + 2) return 'safe:east';
  return 't6_past_field';
}
function pastArea(x, y) {
  if (inRect(x, y, HAMLET)) return HAMLET.name;
  if (inRect(x, y, SPRING)) return SPRING.name;
  if (inRect(x, y, PLACES.shrine)) return '千年前のほしみの丘';
  if (Math.hypot((x - LAKE.x) / (LAKE.rx + 4), (y - LAKE.y) / (LAKE.ry + 4)) < 1) return '千年前の鏡の湖';
  const R = PAST_POS.ruin;
  if (x >= R.x0 - 6 && x <= R.x1 + 6 && y >= R.y0 - 4 && y <= R.y1 + 4) return '時の神殿の森';
  return PAST_NAME;
}

// 町や 家の 中（時の砂時計が 使えない）: 里の 中
export const PAST_TOWNS = [HAMLET, SPRING];
export const PRESENT_TOWNS = [PLACES.village, PLACES.town];

function buildPastMap(maps) {
  const present = maps.overworld;
  const { t } = pastTiles(present);
  const m = {
    id: PAST_ID, name: PAST_NAME, kind: 'field', bgm: 'past_field', dark: false,
    // 千年前: 少し セピアがかった 色（render/themes.js の past。2D も 2.5D も）と うすい 色の まく（client/field.js の drawDusk）
    past: true, theme: 'past', dusk: { color: 'rgba(150, 110, 60, 0.10)' },
    timePair: 'overworld',
    w: present.w, h: present.h, tiles: t, gates: [],
    npcs: pastNpcs(), chests: pastChests(), signs: [], warps: [], boards: [], triggers: [], actions: [], sparkles: [], links: [],
    roofs: HAMLET_ROOFS.map(([x, y, w, h]) => ({ x: HAMLET.x + x, y: HAMLET.y + y, w, h, color: 'sand' })),
    zoneAt: pastZone, areaName: pastArea,
    spawnCounts: { t6_past_field: 26 },
    // 里の 中は 里の 曲。泉の里は 時が 止まって いる あいだ ふしぎな 曲
    bgmAt: (x, y, night, has) => (inRect(x, y, HAMLET) ? 'past_village' : inRect(x, y, SPRING) ? (has?.(C6.flow) ? 'past_village' : 'toki_shrine') : 'past_field'),
    noFlyText: '風の笛をふいた！\nしかし、何も起こらなかった…\n（千年前の空には、アステルは来られないようだ。今へは、時の砂時計でもどろう）',
    timeNoUse: (x, y) => (PAST_TOWNS.some((r) => inRect(x, y, r)) ? 'town' : null),
    fcStart: [Math.floor(PAST_POS.hamletIn.x), Math.floor(PAST_POS.hamletIn.y)],
    // 時の砂時計で 出られる ところ（ここから 歩いて 行ける 所だけ。world/time-glass.js の timeArea）
    timeHome: [Math.floor(PAST_POS.hamletIn.x), Math.floor(PAST_POS.hamletIn.y)],
  };
  // 泉: c6_flow で 水が 動き出す
  for (let y = 0; y < SPRING.h; y++) for (let x = 0; x < SPRING.w; x++) {
    if (SPRING_ROWS[y][x] === '~') m.gates.push({ x: SPRING.x + x, y: SPRING.y + y, closed: T.FROZEN_WATER, open: T.WATER, flag: C6.flow });
  }
  // 時のいせき（千年前の 時の神殿）の 入口: リオンに 会うと 入れる
  addRuinOutside(m, 'toki_ruin_1f_past');
  // 千年前の ほしみの丘の ほこら（まだ 新しい）
  m.actions.push({ x: SH.x + 5, y: SH.y + 3, script: 'c6_past_altar' });
  // リオンに 会う（里の 外れ）
  const R = PAST_POS.rionMeet;
  m.triggers.push({ id: 'c6_rion_meet', x: R.x, y: R.y, w: R.w, h: R.h, script: 'c6_rion_meet', show: { all: [C6.tree], not: [C6.rion] } });
  // 泉の里に はじめて 入った（時が 止まっている）
  m.triggers.push({ id: 'c6_spring_arrive', x: SPRING.x + 1, y: SPRING.y + 1, w: SPRING.w - 2, h: SPRING.h - 2, script: 'c6_spring_arrive', show: { all: [C6.past], not: ['c6_spring_seen'] } });
  // 石の かんばん
  m.signs.push({ x: HAMLET.x + HAMLET.w + 1, y: HAMLET.y + 6, text: '石に、星の形がきざまれている。\n「ホシフルの里」' });
  for (const s of m.signs) m.tiles[s.y * m.w + s.x] = T.SIGN;
  // 歩いて 行けない 草地は 森に（里から 歩いて 行ける ところ だけ）
  closeOff(m, [Math.floor(PAST_POS.hamletIn.x), Math.floor(PAST_POS.hamletIn.y)]);
  return m;
}

// 時のいせきの 入口（今も 千年前も おなじ 場所。今は がれきと 木の根・千年前は 新しい 神殿の 門）。c6_rion で 入れる
function addRuinOutside(m, to) {
  const R = PAST_POS.ruin;
  for (let y = R.y0; y <= R.y1; y++) for (let x = R.x0; x <= R.x1; x++) m.tiles[y * m.w + x] = T.RUIN_WALL;
  // 遺跡の まわりの ふみかためた 地面
  for (let x = R.x0 - 1; x <= R.x1 + 1; x++) m.tiles[(R.y1 + 1) * m.w + x] = T.GRASS;
  const D = R.door;
  m.tiles[D.y * m.w + D.x] = T.GAIA_ROOT;
  m.gates.push({ x: D.x, y: D.y, closed: T.GAIA_ROOT, open: T.RUIN_DOOR, flag: C6.rion });
  m.warps.push({ x: D.x, y: D.y, to: { map: to, ...RUIN_ARRIVE, dir: 'up' } });
  m.actions.push({ x: D.x, y: D.y, script: 'c6_ruin_door', show: { not: [C6.rion] } });
}
// 遺跡の 1階に 入って 着く ところ（maps/toki-ruin.js が 使う。1階の 入口の 北）
export const RUIN_ARRIVE = { x: 17.5, y: 24.5 };

// ───────────── 今の ミドリナ地方に たす もの ─────────────
function addPresent(maps) {
  const ow = maps.overworld;
  const C = PAST_POS;
  ow.timePair = PAST_ID;
  ow.timeNoUse = (x, y) => (PRESENT_TOWNS.some((r) => inRect(x, y, r)) ? 'town' : null);
  ow.timeHome = [PLACES.village.x + 16, PLACES.village.y + 13];
  ow.links = ow.links || [];
  // ほしみの丘: 星の花の あった 所の 地面が われて、時のほこらの 入口（c6_start）
  const D = C.shrineDoor;
  ow.gates.push({ x: D.x, y: D.y, closed: T.SHRINE_FLOOR, open: T.CAVE_ENTRANCE, flag: C6.start });
  ow.triggers.push({ id: 'c6_shrine_go', x: D.x, y: D.y, w: 1, h: 1, script: 'c6_shrine_go', show: { all: [C6.start] } });
  ow.links.push({ x: D.x, y: D.y, to: 'toki_shrine_1f' });
  // ほこらを 出た 丘で、はじめて 時の砂時計を 使う（c6_glass の あと c6_past まで）
  ow.triggers.push({ id: 'c6_first_shift', x: SH.x + 2, y: SH.y + 5, w: 7, h: 4, script: 'c6_first_shift', show: { all: [C6.glass], not: [C6.past] } });
  // 丘の 上の がけ（第1章から ある 小さな がけ。上は 星の木を のぼると 行ける）
  const P = C.plateau;
  for (let y = P.y0; y <= P.y1; y++) for (let x = P.x0; x <= P.x1; x++) {
    const edge = x === P.x0 || x === P.x1 || y === P.y0 || y === P.y1;
    ow.tiles[y * ow.w + x] = edge ? T.ROCK : hash2(x, y, 621) < 0.35 ? T.FLOWERS : T.GRASS;
  }
  // がけの ふもと（星の木の 立つ 所）は ひらけた 草地
  for (let y = P.y1 + 1; y <= P.y1 + 3; y++) for (let x = P.x0; x <= P.x1; x++) {
    const id = ow.tiles[y * ow.w + x];
    if (id === T.TREE || id === T.PINE || id === T.TALLGRASS) ow.tiles[y * ow.w + x] = T.GRASS;
  }
  ow.sparkles = (ow.sparkles || []).filter((sp) => !(sp.x >= P.x0 && sp.x <= P.x1 && sp.y >= P.y0 && sp.y <= P.y1 + 3));
  ow.npcs.push(npc('star_tree', '星の木', [C.seed.x, C.seed.y], 'star_tree', 'c6_star_tree', { big: true, show: { all: [PLANT_FLAG] } }));
  ow.actions.push({ x: C.vine.x, y: C.vine.y, script: 'c6_vine' });
  // はじまりの勇者の像（ルミナの町の 広場。c6_start から c6_flow まで うすく 消えかける）
  const S = C.statue;
  ow.npcs.push(npc('hero_statue', 'はじまりの勇者の像', [S.x, S.y], 'hero_statue', 'c6_statue', { show: { not: [C6.start] } }));
  ow.npcs.push(npc('hero_statue_back', 'はじまりの勇者の像', [S.x, S.y], 'hero_statue', 'c6_statue', { show: { all: [C6.flow] } }));
  ow.npcs.push(npc('hero_statue_faded', 'はじまりの勇者の像', [S.x, S.y], 'hero_statue_faded', 'c6_statue', { show: { all: [C6.start], not: [C6.flow] } }));
  // 時のいせき（今は 木の根と がれきに うもれた 遺跡）
  addRuinOutside(ow, 'toki_ruin_1f');
}

// 第6章 Step 1・2 の マップの ID（セーブに のこるので かえない）
export const PAST_MAPS = [PAST_ID];

// maps/index.js の buildMaps から（第5章の あと・finishMap の 前。今の フィールドを ぜんぶ 作った あと）
export function attachPast(maps) {
  addPresent(maps);
  maps[PAST_ID] = buildPastMap(maps);
}

export { inRect };
void parseRows;
