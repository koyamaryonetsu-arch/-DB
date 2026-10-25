// 第6章 Step 3・4（A: 世界と物語）「星読みの社」と「星めぐりの古道」の マップ（maps/ch6.js の attachCh6 で まぜる）
// ※ ネタバレ注意（docs/plan-ch6.md の 11-2・12）
// ・星読みの社 … 千年前の ミドリナ地方（overworld_past）の 北東の 森（今の 森のひろば FOREST_CLEARING の 所）。
//   今の 森のひろばには、こけむした 石の 台だけ（星読みの社が あった 所）。社の うらに 星めぐりの古道の 入口（c6_orih で 開く。今も 千年前も）
// ・星めぐりの古道 … 今 hoshimichi_1f〜8f・千年前 hoshimichi_1f_past〜8f_past（どの 階も おなじ 形・おなじ 座標。timePair）
//   3階と 7階の さいごに 休み所（星の いずみ。4階と 8階の 前）。4階に 星くいのよる鳥（star_eater）・8階（千年前）に ふりこの魔女ペンデュラ（pendula）
// ・しかけ（maps/hoshimichi-rows.js の 文字）:
//   星の道しるべ … 星の もやの 中の 本当の 道は、夜空が 見える 間だけ 星が 光る（'@night' の とびらと、ミナモの 星読み c6_starsight）。
//     もやの 道を まちがえると、もやの 入口に もどされる（world/star-sight.js）
//   今は 川・千年前は かれた 谷（2・7階）… 千年前で 谷を わたって、向こうの 石を おす（今も その 場所に）→ 今で くずれた とびらを ぬける
//   今は 大木・千年前は なえ（3階）… 千年前で なえの 向きを 谷へ かえると、今は 大木の 根が 谷の 橋に なる
//   今は 落ちた星・千年前は まだ 空（5階）… 千年前の 星受けの台で、夜空が 見える 間に 星を 受けとめると、今は 星が 消えて 光る 道しるべに
//   2つの 時代の 星の石（6階）… 家族 2人なら 1人ずつ 別の 時代で 同時に ふむと 近道が 開く。ひとりなら ミナモに 千年前の 石で 待ってもらう
// ・魔物: 1〜4階 t6_road_up・5〜8階 t6_road_low（B）。もや・休み所・ボスの 広間は 出ない
import { T, TILE_INFO } from '../tiles.js?v=df2b5cb0d2d6';
import { hash2 } from '../rng.js?v=df2b5cb0d2d6';
import { npc } from './npc.js?v=df2b5cb0d2d6';
import { FOREST_CLEARING } from './overworld.js?v=df2b5cb0d2d6';
import { HM_ROWS, HM_W, HM_H, MIST_ROUTES } from './hoshimichi-rows.js?v=df2b5cb0d2d6';
import { parseRows16, PAST_ID } from './past.js?v=df2b5cb0d2d6';
import { ROAD_TREASURE_FLOORS, ROAD_FIELD_TREASURE } from '../data/items-road.js?v=df2b5cb0d2d6';

export const HM_FLOORS = 8;
export const HM_RESTS = [3, 7]; // 休み所の ある 階（4階と 8階の 前）
export const HM_BIRD_FLOOR = 4;
export const HM_BOSS_FLOOR = 8;
export const hmMapId = (n, past = false) => `hoshimichi_${n}f${past ? '_past' : ''}`;
export const HM_MAPS = [...Array.from({ length: HM_FLOORS }, (_, i) => hmMapId(i + 1)), ...Array.from({ length: HM_FLOORS }, (_, i) => hmMapId(i + 1, true))];
export const hmName = (n, past) => `星めぐりの古道　${n}階${past ? '（千年前）' : ''}`;
export const HM_SIGHTS = ['', '星の道しるべ（星のもや）', '今は川、千年前はかれた谷', '星の木のなえと大木の根・休み所', '星くいのよる鳥', '落ちた星と星受けの台', '2つの時代の星の石・長い星のもや', '川と谷・休み所', 'ペンデュラの広間'];

// ───────────── フラグ（セーブに のこるので かえない）─────────────
// 物語の すすみぐあい（plan-ch6.md の 12-1 の 名前の 約束）
export const C6B = { omen: 'c6_omen', orih: 'c6_orih', road: 'c6_road', bird: 'c6_bird', pendula: 'c6_pendula', kanata: 'c6_kanata' };
// 物語の すすみぐあいでは ない フラグ
export const HF = (n) => `c6_hf${n}`; // 古道の その 階に 来た（目標が かわる。1階は c6_road と 同時）
export const STARSIGHT = 'c6_starsight'; // ミナモの 星読みで 夜空が 見えている（歩くと 消える。world/star-sight.js）
export const STONE_AT = (n, i) => `c6_h${n}_s${i}`; // 大きな 石が 道の i ばんめに いる（0 … はじめの 場所。フラグ なし）
export const SAP_DIRS = ['n', 'e', 's', 'w'];
export const SAP_FLAG = (d) => `c6_h3_sap_${d}`; // 千年前の 星の木の なえの 向き（今の 大木の 根の 向き）
export const SAP_GOOD = 's'; // 谷の 向き（3階は 南）
export const CATCH5 = 'c6_h5_star'; // 5階: 千年前で 落ちてくる 前の 星を 受けとめた（今は 光る 道しるべ）
export const OPEN6 = 'c6_h6_open'; // 6階: 2つの 時代の 星の石で 近道が 開いた（開いたら そのまま）
export const WAIT6 = 'c6_h6_wait'; // 6階: ミナモが 千年前の 星の石の 上で 待っている（ひとりの とき）
export const HBOSS = 'c6_hboss'; // 8階の ペンデュラの 広間に 来た
export const END_P6 = 'c6_end_p'; // ペンデュラの あと、社で オリハの 星読みの 場面まで 見た（とちゅうで 切れた ときの 続き）

// ───────────── 文字 → タイル（時代で ちがう）─────────────
const BOTH = {
  '#': T.CAVE_WALL, '.': T.CAVE_FLOOR, O: T.PILLAR, i: T.TORCH, '<': T.STAIRS_UP, '>': T.STAIRS_DOWN, X: T.RUIN_GATE, C: T.CHASM,
  F: T.STAR_FONT, M: T.RUIN_MURAL, $: T.CAVE_FLOOR, m: T.HM_MIST, r: T.HM_MIST, E: T.CAVE_FLOOR, S: T.CAVE_FLOOR, b: T.CHASM,
  P: T.CAVE_WALL, Z: T.ANC_DOOR, G: T.ANC_DOOR, T: T.STAR_ALTAR,
};
const PAST_ONLY = { w: T.DRY_VALLEY, d: T.ANC_DOOR, t: T.YOUNG_TREE, q: T.STAR_CATCH, Q: T.CAVE_FLOOR, 1: T.CAVE_FLOOR, 2: T.STAR_STONE };
const NOW_ONLY = { w: T.CAVE_WATER, d: T.RUBBLE, t: T.CAVE_FLOOR, q: T.CAVE_FLOOR, Q: T.METEOR, 1: T.STAR_STONE, 2: T.CAVE_FLOOR };
export const hmLegend = (past) => ({ ...BOTH, ...(past ? PAST_ONLY : NOW_ONLY) });
// どちらの 時代でも 石が 止まる 文字
const STOP = new Set(['#', 'O', 'i', 'C', '<', '>', 'X', 'F', 'M', 'm', 'r', 'w', 'd', 't', 'b', 'q', 'Q', 'P', 'Z', 'G', 'T', '1', '2', '$']);

function cellsOf(rows, chars) {
  const out = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (chars.includes(ch)) out.push({ x, y }); }));
  return out;
}
const one = (rows, ch) => cellsOf(rows, [ch])[0] || null;

// ───────────── 大きな 石（千年前で おす。位置は フラグ。今も その 場所に ある）─────────────
const DV = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const STONE_DIR = { 2: 'W', 7: 'E' };
export const HM_STONES = {};
for (const [k, dir] of Object.entries(STONE_DIR)) {
  const n = Number(k);
  const rows = HM_ROWS[n];
  const start = one(rows, 'S');
  const [dx, dy] = DV[dir];
  const track = [{ ...start, ch: '.' }];
  for (let x = start.x + dx, y = start.y + dy; rows[y]?.[x] && !STOP.has(rows[y][x]); x += dx, y += dy) track.push({ x, y, ch: rows[y][x] });
  HM_STONES[n] = { n, dir, track, flags: track.map((_, i) => (i ? STONE_AT(n, i) : null)) };
}
// 石の いまの 道の ばんめ
export function stoneIndex(o, has) {
  let i = 0;
  o.flags.forEach((f, k) => { if (f && has(f)) i = k; });
  return i;
}

// ───────────── 場所（レイアウトから きめる）─────────────
export const HM_POS = {};
for (let n = 1; n <= HM_FLOORS; n++) {
  const rows = HM_ROWS[n];
  if (rows.length !== HM_H || rows.some((r) => r.length !== HM_W)) throw new Error(`hoshimichi_${n}fの大きさ`);
  HM_POS[n] = {
    up: one(rows, '<'), down: one(rows, '>'), exit: cellsOf(rows, ['X']), font: one(rows, 'F'), murals: cellsOf(rows, ['M']),
    chests: cellsOf(rows, ['$']), mistBack: one(rows, 'E'), mist: cellsOf(rows, ['m']), route: cellsOf(rows, ['r']),
    tree: one(rows, 't'), bridge: cellsOf(rows, ['b']), catcher: one(rows, 'q'), meteor: cellsOf(rows, ['Q']), post: one(rows, 'P'),
    doors: cellsOf(rows, ['d']), plate1: one(rows, '1'), plate2: one(rows, '2'), z: one(rows, 'Z'), g: one(rows, 'G'), altar: one(rows, 'T'),
  };
}
// 4階の 鳥・8階の ペンデュラ（大きな 人の え）と、広間に 入ると はじまる 所
HM_POS[HM_BIRD_FLOOR].bird = { x: 20, y: 8 };
HM_POS[HM_BIRD_FLOOR].trigger = { x: 8, y: 14, w: 24, h: 1 };
HM_POS[HM_BOSS_FLOOR].boss = { x: 20, y: 8 };
HM_POS[HM_BOSS_FLOOR].trigger = { x: 8, y: 14, w: 24, h: 1 };
HM_POS[HM_BOSS_FLOOR].hall = { x: 4, y: 15, w: 32, h: 4 };

// 古道の 入口（星読みの社の うら。今も 千年前も おなじ 場所）と、1階に 着く 所
const FC = FOREST_CLEARING;
export const SHA = {
  // 社の たてもの（千年前だけ。今は こけむした 石の 台）
  hall: { x0: FC.x - 2, y0: FC.y - 5, x1: FC.x + 2, y1: FC.y - 3 },
  platform: { x: FC.x, y: FC.y - 4 },
  oriha: { x: FC.x, y: FC.y - 1 },
  kotoha: { x: FC.x + 3, y: FC.y + 1 },
  // 社の 西の 小道 → 北の 古道の 入口
  path: [[FC.x - 3, FC.y - 2], [FC.x - 3, FC.y - 6], [FC.x, FC.y - 6]],
  door: { x: FC.x, y: FC.y - 7 },
  out: { x: FC.x + 0.5, y: FC.y - 5.5 }, // 古道から 出て 着く ところ
  trigger: { x: FC.x - 4, y: FC.y - 2, w: 9, h: 6 }, // 社に 着いた（オリハに 会う）
  chests: [[FC.x + 3, FC.y - 6], [FC.x - 4, FC.y - 1], [FC.x + 6, FC.y + 2]],
};
export const HM_ARRIVE = { x: 20.5, y: 27.5 };

// かいだんの となりの 歩ける マス（下 → 左 → 右 → 上）
const WALKABLE = new Set(['.', '$', 'S', 'E', '1', '2', 'w']);
function besideOf(rows, id, p, dir = 'down') {
  for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) if (WALKABLE.has(rows[p.y + dy]?.[p.x + dx])) return { map: id, x: p.x + dx + 0.5, y: p.y + dy + 0.5, dir };
  return { map: id, x: p.x + 0.5, y: p.y + 0.5, dir };
}
// その 階に 入った ところ（上から 下りてきた ところ。1階は 外から 入った ところ）
export function hmArrive(n, past) {
  if (n === 1) return { map: hmMapId(1, past), ...HM_ARRIVE, dir: 'up' };
  return besideOf(HM_ROWS[n], hmMapId(n, past), HM_POS[n].up, 'down');
}
const hmFromBelow = (n, past) => besideOf(HM_ROWS[n], hmMapId(n, past), HM_POS[n].down, 'down');

// ───────────── 宝箱（★は B の ROAD_TREASURE_FLOORS（1階ごとに 2つ））─────────────
// 階ごとの $ の じゅんばんに、どちらの 時代に 置くか（past … 千年前）。足りない ときは 星のかけら
const CHEST_ERA = { 1: [false, true], 2: [false, true], 3: [false, true], 4: [true, false], 5: [false, true], 6: [true, false], 7: [false, true], 8: [false, true] };
export function hmChests(n, past) {
  const star = ROAD_TREASURE_FLOORS?.[n] || [];
  const out = [];
  HM_POS[n].chests.forEach((c, k) => {
    if ((CHEST_ERA[n]?.[k] ?? false) !== past) return;
    const id = `h6_${n}c${k}`;
    out.push(star[k] ? { id, x: c.x, y: c.y, item: star[k] } : { id, x: c.x, y: c.y, item: 'star_shard', n: 3 });
  });
  return out;
}

// ───────────── 魔物の 出ない ところ ─────────────
function zoneOf(n) {
  const rows = HM_ROWS[n];
  const P = HM_POS[n];
  const table = n <= 4 ? 't6_road_up' : 't6_road_low';
  const safe = [];
  for (const p of [P.up, P.down, P.mistBack, P.tree, P.catcher, P.post, P.plate1, P.plate2, P.z, P.g, P.altar, ...P.doors, ...P.meteor, ...P.exit]) if (p) safe.push([p.x - 2, p.y - 2, p.x + 2, p.y + 2]);
  for (const o of [HM_STONES[n]].filter(Boolean)) for (const c of o.track) safe.push([c.x - 1, c.y - 1, c.x + 1, c.y + 1]);
  if (n === 1) safe.push([15, 23, 25, 28]);
  // 休み所（3階・7階の さいごの へや）・ボスの 階
  const restY = { 3: 22, 7: 23 }[n];
  return (x, y) => {
    if (n === HM_BOSS_FLOOR) return 'safe:boss';
    if (restY && y >= restY) return 'safe:rest';
    if (n === HM_BIRD_FLOOR && y < 22) return 'safe:boss';
    for (const [x0, y0, x1, y1] of safe) if (x >= x0 && y >= y0 && x <= x1 && y <= y1) return 'safe:device';
    const ch = rows[y]?.[x];
    if (!ch || 'mrCbwQ'.includes(ch)) return 'safe:mist';
    return table;
  };
}
const SPAWNS = { 1: 4, 2: 5, 3: 4, 4: 2, 5: 5, 6: 5, 7: 5, 8: 0 };

// ───────────── 1つの 階（時代ごと）─────────────
const THEME_NOW = 'hoshimichi', THEME_PAST = 'hoshimichi_past';
// 星の 道しるべ（もやの 中の 本当の 道）が 光る とき: ミナモの 星読み・夜
export const ROUTE_LEVELS = [[STARSIGHT, T.HM_ROUTE], ['@night', T.HM_ROUTE]];
function hmMap(n, past) {
  const rows = HM_ROWS[n];
  const t = parseRows16(rows, hmLegend(past));
  const id = hmMapId(n, past);
  const P = HM_POS[n];
  const table = n <= 4 ? 't6_road_up' : 't6_road_low';
  const m = {
    id, name: hmName(n, past), kind: 'dungeon', bgm: n === HM_BOSS_FLOOR ? 'zenmai' : 'hoshimichi', dark: false, theme: past ? THEME_PAST : THEME_NOW,
    sky3d: past ? { bg: '#14122a', fog: 0x14122a } : { bg: '#0a0c1e', fog: 0x0a0c1e },
    // ミナモの 星読みの 間は、夜空の 青い 色を うすく かける（client/field.js の drawDusk。2D も 2.5D も）
    dusk: { color: 'rgba(30, 40, 120, 0.26)', flag: STARSIGHT },
    past, timePair: hmMapId(n, !past),
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: hmChests(n, past), signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
    areaName: () => hmName(n, past),
    hmFloor: n,
    zoneAt: zoneOf(n),
    spawnCounts: SPAWNS[n] ? { [table]: SPAWNS[n] } : {},
  };
  // 星の もや: 本当の 道は 夜空が 見える 間 光る。まちがえた もやを ふむと 入口へ（world/star-sight.js）
  for (const c of P.route) m.gates.push({ x: c.x, y: c.y, closed: T.HM_MIST, levels: ROUTE_LEVELS });
  if (P.mist.length) m.mist = { lost: new Set(P.mist.map((c) => c.y * t.w + c.x)), back: { x: P.mistBack.x + 0.5, y: P.mistBack.y + 0.5 } };
  // かいだん（おなじ 時代の 上と 下の 階へ）
  if (P.up && n > 1) m.warps.push({ x: P.up.x, y: P.up.y, to: hmFromBelow(n - 1, past) });
  if (P.down && n < HM_FLOORS) m.warps.push({ x: P.down.x, y: P.down.y, to: hmArrive(n + 1, past) });
  // 千年前の とびら d（今は くずれて 通れる）
  for (const c of P.doors) if (past) m.actions.push({ x: c.x, y: c.y, script: 'c6_hdoor_old' });
  // 大きな 石（道の マスの 絵。今も 千年前も おなじ 場所）
  const st = HM_STONES[n];
  if (st) {
    st.track.forEach((c, i) => {
      const base = hmLegend(past)[c.ch] ?? T.CAVE_FLOOR;
      if (i === 0) {
        m.gates.push({ x: c.x, y: c.y, closed: T.BOULDER, levels: st.flags.slice(1).map((f) => [f, T.CAVE_FLOOR]) });
        m.tiles[c.y * m.w + c.x] = T.BOULDER;
      } else m.gates.push({ x: c.x, y: c.y, closed: base, levels: [[st.flags[i], T.BOULDER]] });
    });
    for (const c of st.track) m.actions.push({ x: c.x, y: c.y, script: `c6_hstone_${n}` });
  }
  // 3階: 星の木（今は 大木・千年前は なえ）と 根の 橋（今だけ。なえが 谷の 向きの とき）
  if (P.tree) {
    if (past) m.actions.push({ x: P.tree.x, y: P.tree.y, script: 'c6_hsapling' });
    else m.npcs.push(npc('hm_big_tree', '星の大木', [P.tree.x, P.tree.y], 'star_tree', 'c6_hbigtree', { big: true }));
    if (!past) for (const c of P.bridge) m.gates.push({ x: c.x, y: c.y, closed: T.CHASM, levels: [[SAP_FLAG(SAP_GOOD), T.ROOT_BRIDGE]] });
  }
  // 5階: 千年前の 星受けの台・今の 落ちた星と 光る 道しるべ
  if (P.catcher && past) m.actions.push({ x: P.catcher.x, y: P.catcher.y, script: 'c6_hcatch' });
  if (!past) {
    for (const c of P.meteor) {
      m.gates.push({ x: c.x, y: c.y, closed: T.METEOR, open: T.CAVE_FLOOR, flag: CATCH5 });
      m.actions.push({ x: c.x, y: c.y, script: 'c6_hmeteor', show: { not: [CATCH5] } });
    }
    if (P.post) {
      m.gates.push({ x: P.post.x, y: P.post.y, closed: T.CAVE_WALL, open: T.STAR_POST, flag: CATCH5 });
      m.actions.push({ x: P.post.x, y: P.post.y, script: 'c6_hpost', show: { all: [CATCH5] } });
    }
  }
  // 6階: 2つの 時代の 星の石（1 … 今・2 … 千年前）と 近道の とびら Z
  if (P.z) {
    m.gates.push({ x: P.z.x, y: P.z.y, closed: T.ANC_DOOR, open: past ? T.CAVE_FLOOR : T.RUBBLE, flag: OPEN6 });
    m.actions.push({ x: P.z.x, y: P.z.y, script: 'c6_hz_door', show: { not: [OPEN6] } });
    const plate = past ? P.plate2 : P.plate1;
    m.gates.push({ x: plate.x, y: plate.y, closed: T.STAR_STONE, open: T.STAR_STONE_ON, flag: OPEN6 });
    const side = past ? 'b' : 'a';
    m.triggers.push({ id: `c6_hplate_${side}`, x: plate.x, y: plate.y, w: 1, h: 1, script: `c6_hplate_${side}`, show: { not: [OPEN6] } });
  }
  // 4階: 星くいのよる鳥（どちらの 時代にも いる）・たおすと 開く とびら G
  if (n === HM_BIRD_FLOOR) {
    const B = P.bird;
    m.npcs.push(npc('star_eater_npc', '星くいのよる鳥', [B.x, B.y], 'star_eater_npc', 'c6_bird_event', { big: true, show: { not: [C6B.bird] } }));
    m.triggers.push({ id: 'c6_bird_event', ...P.trigger, script: 'c6_bird_event', show: { not: [C6B.bird] } });
    m.gates.push({ x: P.g.x, y: P.g.y, closed: T.ANC_DOOR, open: past ? T.CAVE_FLOOR : T.RUBBLE, flag: C6B.bird });
    m.actions.push({ x: P.g.x, y: P.g.y, script: 'c6_hg_door', show: { not: [C6B.bird] } });
  }
  // 8階: ペンデュラ（千年前だけ）・星の 台座（どちらの 時代も）
  if (n === HM_BOSS_FLOOR) {
    if (past) {
      const B = P.boss;
      m.npcs.push(npc('pendula_npc', 'ふりこの魔女ペンデュラ', [B.x, B.y], 'pendula_npc', 'c6_pendula_event', { big: true, show: { not: [C6B.pendula] } }));
      m.triggers.push({ id: 'c6_pendula_event', ...P.trigger, script: 'c6_pendula_event', show: { not: [C6B.pendula] } });
      m.triggers.push({ id: 'c6_hboss', ...P.hall, script: 'c6_hboss', show: { not: [HBOSS] } });
    } else m.triggers.push({ id: 'c6_hboss_now', ...P.hall, script: 'c6_hboss_now', show: { not: [C6B.pendula] } });
    m.actions.push({ x: P.altar.x, y: P.altar.y, script: 'c6_haltar' });
  }
  // 休み所の 星の いずみ・かべ画
  if (P.font) m.actions.push({ ...P.font, script: 'c6_hfont' });
  for (const p of P.murals) m.actions.push({ x: p.x, y: p.y, script: `c6_hmural_${n}` });
  // その 階に 来た ときの ことば（1回だけ。どちらの 時代から 来ても）
  const a = hmArrive(n, past);
  m.triggers.push({ id: `c6_hf${n}`, x: Math.floor(a.x) - 2, y: Math.floor(a.y) - 1, w: 5, h: 3, script: `c6_hf${n}`, show: { not: [n === 1 ? C6B.road : HF(n)] } });
  return m;
}

export function buildHoshimichiMaps() {
  const maps = {};
  for (let n = 1; n <= HM_FLOORS; n++) for (const past of [false, true]) maps[hmMapId(n, past)] = hmMap(n, past);
  // 1階の 出口（今 → 今の 森のひろば・千年前 → 千年前の 社の うら）
  for (const past of [false, true]) {
    const f1 = maps[hmMapId(1, past)];
    const out = past ? PAST_ID : 'overworld';
    for (const p of HM_POS[1].exit) f1.warps.push({ x: p.x, y: p.y, to: { map: out, ...SHA.out, dir: 'down' } });
    f1.links.push({ x: HM_POS[1].exit[0].x, y: HM_POS[1].exit[0].y, to: out });
  }
  return maps;
}

// ───────────── 千年前の 星読みの社（overworld_past）と、今の 森のひろば（overworld）─────────────
const carve = (m, cells, tile) => {
  for (const [x, y] of cells) {
    const cur = m.tiles[y * m.w + x];
    if (TILE_INFO[cur]?.solid || cur === T.TALLGRASS) m.tiles[y * m.w + x] = tile;
  }
};
function pathCells() {
  const out = [];
  const pts = [...SHA.path, [SHA.door.x, SHA.door.y + 1]];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) out.push([x, y]);
  }
  return out;
}
function addDoor(m, to, past) {
  const D = SHA.door;
  m.tiles[D.y * m.w + D.x] = past ? T.STAR_DOOR : T.GAIA_ROOT;
  m.gates.push({ x: D.x, y: D.y, closed: past ? T.STAR_DOOR : T.GAIA_ROOT, open: past ? T.RUIN_DOOR : T.CAVE_ENTRANCE, flag: C6B.orih });
  m.warps.push({ x: D.x, y: D.y, to: { map: to, ...HM_ARRIVE, dir: 'up' } });
  m.actions.push({ x: D.x, y: D.y, script: 'c6_road_door', show: { not: [C6B.orih] } });
  // 入口の まわりは 木で かこむ（小道 いがいから 入らない）
  for (const [dx, dy] of [[-1, 0], [1, 0], [-1, -1], [0, -1], [1, -1]]) {
    const x = D.x + dx, y = D.y + dy;
    if (!TILE_INFO[m.tiles[y * m.w + x]]?.solid) m.tiles[y * m.w + x] = T.TREE;
  }
}
// 千年前: 社の たてもの・オリハ・見習いの コトハ・古道の 入口・社の まわりの 宝箱（★は B の ROAD_FIELD_TREASURE）
export function attachShaPast(m) {
  const H = SHA.hall;
  carve(m, pathCells(), T.FOREST_FLOOR);
  for (let y = H.y0 - 1; y <= H.y1 + 1; y++) for (let x = H.x0 - 1; x <= H.x1 + 1; x++) if (TILE_INFO[m.tiles[y * m.w + x]]?.solid) m.tiles[y * m.w + x] = T.FOREST_FLOOR;
  for (let y = H.y0; y <= H.y1; y++) for (let x = H.x0; x <= H.x1; x++) m.tiles[y * m.w + x] = T.WALL_WOOD;
  m.roofs.push({ x: H.x0, y: H.y0, w: H.x1 - H.x0 + 1, h: H.y1 - H.y0 + 1, color: 'purple' });
  addDoor(m, hmMapId(1, true), true);
  m.npcs.push(npc('oriha', '星読みのオリハ', [SHA.oriha.x, SHA.oriha.y], 'oriha', 'c6_oriha'));
  m.npcs.push(npc('kotoha', '社の見習いコトハ', [SHA.kotoha.x, SHA.kotoha.y], 'kotoha', 'c6_kotoha', { wander: 1 }));
  m.triggers.push({ id: 'c6_orih_meet', ...SHA.trigger, script: 'c6_orih_meet', show: { all: [C6B.omen], not: [C6B.orih] } });
  m.chests.push(...ROAD_FIELD_TREASURE.slice(0, SHA.chests.length).map((item, i) => ({ id: `h6_ow${i}`, x: SHA.chests[i][0], y: SHA.chests[i][1], item })));
  m.signs.push({ x: SHA.hall.x1 + 1, y: SHA.hall.y1 + 1, text: '木の札に、星の形がきざまれている。\n「星読みの社」' });
  for (const s of m.signs) if (m.tiles[s.y * m.w + s.x] !== T.SIGN) m.tiles[s.y * m.w + s.x] = T.SIGN;
}
// 今: 森のひろばの こけむした 石の 台（社が あった 所）・古道の 入口（c6_orih で 開く。木の根の 下の 古い かいだん）
export function attachShaNow(ow) {
  carve(ow, pathCells(), T.FOREST_FLOOR);
  const P = SHA.platform;
  ow.tiles[P.y * ow.w + P.x] = T.STAR_ALTAR;
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1]]) {
    const x = P.x + dx, y = P.y + dy;
    if (TILE_INFO[ow.tiles[y * ow.w + x]]?.solid) ow.tiles[y * ow.w + x] = hash2(x, y, 631) < 0.5 ? T.FOREST_FLOOR : T.FLOWERS;
  }
  ow.actions = ow.actions || [];
  ow.actions.push({ x: P.x, y: P.y, script: 'c6_platform' });
  addDoor(ow, hmMapId(1, false), false);
}
