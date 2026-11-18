// 第88回 G3班: まぼろしの回ろう（docs/plan-r88-anime-gear.md の 7-1）
//
// ・入口 … ルミナの町の 星の神殿の「試練の番人」の となりの 下り階段（町の x=28・y=7）
// ・回廊 … 長い ろうか。北の かべに 作品ごとの とびらが ならぶ（data/rivals-r88.js の RIVAL_DOORS の じゅん。作品が ふえると 回廊も 長く なる）
//   とびらの よこに 作品の しるし（かんばん）。とびらの 前の 光る わは、その 作品の 品を 3つ 持つと 光る（キャラの flags。shared/rivals-r88.js）
//   とびらを 調べると だいほん 'rival_door_<作品>'（data/story-rivals-r88.js）
// ・とびらの 中 … 1つの 部屋の 形を 使い回して、作品ごとに ゆかと かべを かえる（ROOM_STYLES）。戦いの 前に 家族で 入る（world/rivals-r88.js）
// ・attachRivalHall(maps) で 今の マップに 足す（ほかの マップの ファイルは かえない）
import { T } from '../tiles.js?v=f9111f3bfd76';
import { PLACES } from './overworld.js?v=f9111f3bfd76';
import { RIVAL_DOORS, doorFlag } from '../data/rivals-r88.js?v=f9111f3bfd76';
import { workName } from '../data/works.js?v=f9111f3bfd76';

export const HALL_ID = 'rival_hall';
export const HALL_NAME = 'まぼろしの回ろう';
export const roomId = (work) => `rival_room_${work}`;
// 町の 星の神殿の 下り階段（番人 TW(27, 7) の となり）
const TX = PLACES.town.x, TY = PLACES.town.y;
export const HALL_STAIRS = { x: TX + 28, y: TY + 7 };

// ───────────── 回廊 ─────────────
const HALL_H = 10;
const DOOR_GAP = 4;
// 回廊の はばと とびらの 場所（RIVAL_DOORS の じゅん）
export function hallLayout(n = RIVAL_DOORS.length) {
  const w = Math.max(15, DOOR_GAP * n + 7);
  const span = DOOR_GAP * (n - 1);
  const x0 = Math.floor((w - span) / 2);
  const doors = RIVAL_DOORS.slice(0, n).map((d, i) => ({ work: d.work, mark: d.mark, x: x0 + DOOR_GAP * i, y: 2 }));
  return { w, h: HALL_H, doors, stairs: { x: Math.floor(w / 2), y: HALL_H - 2 }, sign: { x: Math.floor(w / 2) + 2, y: HALL_H - 2 } };
}
// とびらの 前（家族が 立つ ところ。戦いの あとに もどる ところ）
export function doorFront(work) {
  const d = hallLayout().doors.find((x) => x.work === work);
  return d ? { x: d.x + 0.5, y: d.y + 1.6 } : null;
}

export function buildHall() {
  const L = hallLayout();
  const { w, h } = L;
  const tiles = new Uint8Array(w * h);
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < w && y < h) tiles[y * w + x] = v; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const edge = y <= 2 || y === h - 1 || x === 0 || x === w - 1;
    set(x, y, edge ? T.WALL_STONE : T.FLOOR_STONE);
  }
  // まん中の じゅうたん（入口から おくへ）と、とびらの 前を むすぶ じゅうたん
  for (let x = 2; x < w - 2; x++) set(x, 5, T.CARPET);
  for (let y = 5; y < h - 1; y++) set(L.stairs.x, y, T.CARPET);
  // かべの たいまつ（とびらと とびらの あいだ）
  for (let x = 2; x < w - 2; x += 2) if (!L.doors.some((d) => Math.abs(d.x - x) <= 1)) set(x, 2, T.TORCH);
  const gates = [];
  for (const d of L.doors) {
    // とびら: 開かない 間は 星の とびら（しまって いる）。その 作品の 品を 3つ 持つと 開いた とびら（入ると まど）
    set(d.x, d.y, T.DOOR);
    //   （もとの マスは とびら〈お店の かんばんと おなじ きまり〉。invert: しるしが ない 間は open の 星の とびら・ある 時は closed の とびら）
    gates.push({ x: d.x, y: d.y, invert: true, open: T.STAR_DOOR, closed: T.DOOR, flag: doorFlag(d.work) });
    // とびらの 前の わ: その 作品の 品を 3つ 持つと 光る
    set(d.x, d.y + 1, T.WARP_RING_OFF);
    gates.push({ x: d.x, y: d.y + 1, closed: T.WARP_RING_OFF, open: T.WARP_RING, flag: doorFlag(d.work) });
  }
  set(L.stairs.x, L.stairs.y, T.STAIRS_UP);
  set(L.sign.x, L.sign.y, T.SIGN);
  // 両わきの 柱
  for (const x of [2, w - 3]) for (const y of [4, 7]) set(x, y, T.PILLAR);
  return {
    id: HALL_ID, name: HALL_NAME, kind: 'dungeon', bgm: 'memory', dark: false, indoor: true,
    w, h, tiles, gates,
    npcs: [], chests: [],
    signs: [{ x: L.sign.x, y: L.sign.y, text: `${HALL_NAME}\n作品の品を3つ持っていると、その作品のとびらが光って開く。\nとびらの中で、ライバルのまぼろしが待っている。` }],
    warps: [{ x: L.stairs.x, y: L.stairs.y, to: { map: 'overworld', x: HALL_STAIRS.x + 0.5, y: HALL_STAIRS.y + 1.6, dir: 'down' } }],
    // 開いた とびらに 入ると まど（とびらを 調べた 時と おなじ）
    triggers: L.doors.map((d) => ({ id: `rival_door_${d.work}`, x: d.x, y: d.y, w: 1, h: 1, script: `rival_door_${d.work}`, show: { all: [doorFlag(d.work)] } })),
    sparkles: [],
    // とびらを 調べる（とびらの マス。前の わの 上から）
    actions: L.doors.map((d) => ({ x: d.x, y: d.y, script: `rival_door_${d.work}` })),
    // とびらの よこの 作品の しるし（client/render/boards.js の かんばんの 絵。お店の かんばんと おなじ く 入口の よこの かべ）
    boards: L.doors.map((d) => ({ x: d.x + 1, y: d.y, kind: d.mark, name: `${RIVAL_DOORS.find((x) => x.work === d.work)?.name || workName(d.work)}のとびら` })),
    roofs: [],
    zoneAt: () => 'safe:rival_hall',
    areaName: () => HALL_NAME,
    spawnCounts: {},
  };
}

// ───────────── とびらの 中の 部屋（1つの 形を 使い回す）─────────────
// ゆかと かべ（作品ごとに かえる。RIVAL_DOORS の room）
export const ROOM_STYLES = {
  cloud: { floor: T.CLOUD_FLOOR, wall: T.CLOUD_SEA, deco: T.CLOUD_RIM },
  wood: { floor: T.FLOOR_WOOD, wall: T.WALL_WOOD, deco: T.LAMP },
  stone: { floor: T.FLOOR_STONE, wall: T.WALL_STONE, deco: T.PILLAR },
  // G5班: 烈火の炎（火山の 黒い 岩の ゆか・灰の 岩の かべ・火の ともった 火の台）
  volcano: { floor: T.OBSIDIAN, wall: T.ASH_ROCK, deco: T.BRAZIER_LIT },  // G7班: 犬夜しゃ（森の 土の ゆか・木の かべ・はりの木の かざり）
  forest: { floor: T.FOREST_FLOOR, wall: T.TREE, deco: T.PINE },
};
const ROOM_W = 13, ROOM_H = 10;
// 戦いの 前に 家族が 立つ ところ（部屋の まん中より 少し 下）
export const ROOM_START = { x: Math.floor(ROOM_W / 2) + 0.5, y: 6.6 };
export function buildRoom(door) {
  const st = ROOM_STYLES[door.room] || ROOM_STYLES.stone;
  const w = ROOM_W, h = ROOM_H;
  const tiles = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const edge = y <= 1 || y === h - 1 || x === 0 || x === w - 1;
    tiles[y * w + x] = edge ? st.wall : st.floor;
  }
  // 四すみの かざり（雲の ふち・ランプ・柱）
  for (const [x, y] of [[2, 3], [w - 3, 3], [2, h - 3], [w - 3, h - 3]]) tiles[y * w + x] = st.deco;
  // まん中に まぼろしが 立つ 光の わ
  tiles[3 * w + Math.floor(w / 2)] = T.WARP_RING;
  const ex = Math.floor(w / 2);
  tiles[(h - 1) * w + ex] = T.STAIRS_UP;
  const back = doorFront(door.work) || { x: 7.5, y: 3.6 };
  return {
    id: roomId(door.work), name: HALL_NAME, kind: 'dungeon', bgm: 'memory', dark: false, indoor: true,
    w, h, tiles, gates: [],
    npcs: [], chests: [], signs: [],
    warps: [{ x: ex, y: h - 1, to: { map: HALL_ID, x: back.x, y: back.y, dir: 'down' } }],
    triggers: [], sparkles: [], actions: [], boards: [], roofs: [],
    zoneAt: () => 'safe:rival_room',
    areaName: () => HALL_NAME,
    spawnCounts: {},
  };
}

// 今の マップに 足す（maps/index.js の buildMaps から よぶ。npcById などを つくる まえ）
export function attachRivalHall(maps) {
  maps[HALL_ID] = buildHall();
  for (const d of RIVAL_DOORS) maps[roomId(d.work)] = buildRoom(d);
  const ow = maps.overworld;
  const S = HALL_STAIRS;
  ow.tiles[S.y * ow.w + S.x] = T.STAIRS_DOWN;
  const L = hallLayout();
  ow.warps.push({ x: S.x, y: S.y, noMark: true /* 町の 中の 階段（宝の地図の 目じるしに しない） */, to: { map: HALL_ID, x: L.stairs.x + 0.5, y: L.stairs.y - 0.4, dir: 'up' } });
  return maps;
}

// G8班: らんま1/2（木の ゆか・木の かべ・すみに 湯けむりの お湯）・じごく先生ぬ〜べ〜（教室: 木の ゆか・石の かべ・つくえ）。今 ある マスだけ
Object.assign(ROOM_STYLES, {
  onsen: { floor: T.FLOOR_WOOD, wall: T.WALL_WOOD, deco: T.HOT_SPRING },
  school: { floor: T.FLOOR_WOOD, wall: T.WALL_STONE, deco: T.TABLE },
});

// G9班: ワンピース（船の 甲板: 木の ゆか・まわりは 海・たる）。ドラゴンボールは 石の 広間（stone）
Object.assign(ROOM_STYLES, {
  ship: { floor: T.FLOOR_WOOD, wall: T.WATER, deco: T.BARREL },
});

// G14班: アナと雪の女王（雪の 部屋: 雪の ゆか・氷の かたまりの かべ・雪の 木）。鋼のれん金術師は 石の 広間（stone）
Object.assign(ROOM_STYLES, {
  snow: { floor: T.SNOW, wall: T.ICE_BLOCK, deco: T.SNOW_PINE },
});
