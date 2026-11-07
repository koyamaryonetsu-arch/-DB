// 第67回 A班: モンスター闘技場（自分が 育てた 魔物だけで 戦う 闘技場。docs/plan-r67-monster-arena.md）
//
// ・入口 … ルミナの町の 東門を 出て すぐ 北（町の かべと 森の あいだの 石の たてもの・赤い やね）
// ・中 … 砂の 戦いの 場（さく で かこむ）と 観客せき。受付は 3つ（ランク戦・家族対戦・チームの 登録）
//   受付の 画面は client/ui/monarena.js（サーバーの 窓口 svc kind:'monarena' は B班）
// ・attachMonArena(maps) で 今の マップに たす（ほかの マップの ファイルは かえない）
import { T, parseRows } from '../tiles.js?v=015fea4b1393';
import { npc } from './npc.js?v=015fea4b1393';
import { PLACES } from './overworld.js?v=015fea4b1393';

export const MONARENA_MAP = 'monarena';
export const MONARENA_NAME = 'モンスター闘技場';

// ───────────── 闘技場の 中 ─────────────
// c=観客せき（いす） s=砂の 戦いの 場  F=さく  Y=魔物の 像  i=たいまつ  p=柱  C=受付の カウンター
// r=じゅうたん  !=かんばん  l=ランプ  *=花  D=出口
export const MONARENA_ROWS = [
  '##########################',
  '#i+cccccccccccccccccccc+i#',
  '#++cccccccccccccccccccc++#',
  '#p++++++++++++++++++++++p#',
  '#++FFFFFFFFFFFFFFFFFFFF++#',
  '#++FssssssssssssssssssF++#',
  '#++FssssYssssssssYssssF++#',
  '#++FssssssssssssssssssF++#',
  '#++FssssssssssssssssssF++#',
  '#++FFFFFFFFssssFFFFFFFF++#',
  '#p+++++++++rrrr+++++++++p#',
  '#+C++++++++rrrr++++++++C+#',
  '#+C++++++++rrrr++++++++C+#',
  '#+C++++++++rrrr++++++++C+#',
  '#l*+++++++!rrrr++++++++*l#',
  '############DD############',
];
export const MONARENA_SIGN = { x: 10, y: 14 };
// 外から 入った 時に 立つ ところ（出口の すぐ 上）
export const MONARENA_START = { x: 13, y: 14.2 };

// ───────────── 入口（ルミナの町の 東門の 外）─────────────
// 町の かべ（町の x=47）の 東。石の たてもの 7×6 マス。とびらは 下の まん中で、東門の 道（町の y=19）へ 石の 道で つながる
const TX = PLACES.town.x, TY = PLACES.town.y;
export const MONARENA_HUT = { x: TX + 49, y: TY + 8, w: 7, h: 6 };
export const MONARENA_DOOR = { x: MONARENA_HUT.x + 3, y: MONARENA_HUT.y + MONARENA_HUT.h - 1 };
// 魔物が 出ない ところ（たてものの まわりと 道）。名前は「ルミナの町」の まま
const SAFE = { x: TX + 48, y: TY + 5, w: 9, h: 14 };
const inSafe = (x, y) => x >= SAFE.x && y >= SAFE.y && x < SAFE.x + SAFE.w && y < SAFE.y + SAFE.h;

// ───────────── マップを つくる ─────────────
export function buildMonArenaMap() {
  const a = parseRows(MONARENA_ROWS);
  const bond = { all: ['monster_bond'] };
  return {
    id: MONARENA_MAP, name: MONARENA_NAME, kind: 'dungeon', bgm: 'casino', dark: false, indoor: true,
    w: a.w, h: a.h, tiles: a.tiles, gates: [],
    npcs: [
      // 受付（左: ランク戦 / 右: 家族対戦・チームの 登録）。どれも 同じ 画面の、はじめの えらびしが ちがう
      npc('mona_desk', 'ランク戦の受付', [1, 12], 'arena_clerk', 'monarena_desk', { dir: 'right' }),
      npc('mona_family', '家族対戦の係', [24, 11], 'woman', 'monarena_family', { dir: 'left' }),
      npc('mona_reg', 'チーム登録の係', [24, 13], 'merchant', 'monarena_reg', { dir: 'left' }),
      // 戦いの 場で けいこを している 魔物と、その 育て親（monster_bond の あと）
      npc('mona_trainer', '魔物使いのタクト', [12, 6], 'boy', 'monarena_trainer', { dir: 'down', show: bond }),
      npc('mona_mon_a', 'ぷるりん', [10, 7], 'mon:pururin', 'monarena_mon_a', { dir: 'right', show: bond }),
      npc('mona_mon_b', 'ツノうさぎ', [15, 7], 'mon:tsunousagi', 'monarena_mon_b', { dir: 'left', show: bond }),
      // 観客せき
      npc('mona_fan1', '観客のおじいさん', [6, 2], 'oldman', 'monarena_fan1', { dir: 'down' }),
      npc('mona_fan2', '観客の女の子', [19, 2], 'girl', 'monarena_fan2', { dir: 'down' }),
      npc('mona_fan3', '観客のおじさん', [14, 1], 'farmer', 'monarena_fan3', { dir: 'down', show: bond }),
    ],
    chests: [],
    signs: [{ x: MONARENA_SIGN.x, y: MONARENA_SIGN.y, text: 'モンスター闘技場\n自分が育てた魔物4ひきで戦う闘技場。\n左の受付…ランク戦（3連戦）\n右の受付…家族の登録チームと対戦・チームの登録' }],
    warps: [12, 13].map((x) => ({ x, y: a.h - 1, to: { map: 'overworld', x: MONARENA_DOOR.x + 0.5, y: MONARENA_DOOR.y + 1.6, dir: 'down' } })),
    triggers: [], sparkles: [],
    roofs: [{ x: 0, y: 0, w: a.w, h: a.h, color: 'red' }],
    zoneAt: () => 'safe:monarena',
    areaName: () => MONARENA_NAME,
    bgmAt: () => 'casino',
    spawnCounts: {},
  };
}

// 今の マップに たす（maps/index.js の buildMaps から よぶ。千年前の マップ〈attachCh6〉の あと・npcById などを つくる まえ）
export function attachMonArena(maps) {
  maps[MONARENA_MAP] = buildMonArenaMap();
  const ow = maps.overworld;
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < ow.w && y < ow.h) ow.tiles[y * ow.w + x] = v; };
  const H = MONARENA_HUT, D = MONARENA_DOOR;
  // まわりの 草を ととのえる（木を どける）
  for (let y = H.y - 1; y <= D.y + 4; y++) for (let x = H.x - 1; x <= H.x + H.w; x++) {
    if (inSafe(x, y) && ow.tiles[y * ow.w + x] !== T.STONE_PATH && ow.tiles[y * ow.w + x] !== T.DIRT) set(x, y, T.GRASS);
  }
  // 石の たてもの・とびら・赤い やね
  for (let y = H.y; y < H.y + H.h; y++) for (let x = H.x; x < H.x + H.w; x++) set(x, y, T.WALL_STONE);
  set(D.x, D.y, T.DOOR);
  // とびらの 前から 東門の 道（町の y=19）まで 石の 道。とびらの 左右に たいまつ と 花
  for (let y = D.y + 1; y <= TY + 19 && ow.tiles[y * ow.w + D.x] !== T.DIRT; y++) set(D.x, y, T.STONE_PATH);
  set(D.x - 1, D.y + 1, T.TOWN_FLOWERS);
  set(D.x + 1, D.y + 1, T.TOWN_FLOWERS);
  ow.roofs.push({ x: H.x, y: H.y, w: H.w, h: H.h, color: 'red' });
  ow.boards.push({ x: D.x - 1, y: D.y, kind: 'arena', name: MONARENA_NAME });
  ow.warps.push({ x: D.x, y: D.y, noMark: true /* 町の そばの 建物（宝の地図の 目じるしに しない） */, to: { map: MONARENA_MAP, x: MONARENA_START.x, y: MONARENA_START.y, dir: 'up' } });
  // 魔物が 出ない（町の すぐ そば）。名前は ルミナの町
  const zone = ow.zoneAt;
  ow.zoneAt = (x, y) => (inSafe(x, y) ? 'safe:monarena' : zone(x, y));
  const area = ow.areaName;
  ow.areaName = (x, y) => (inSafe(x, y) ? PLACES.town.name : area(x, y));
  return maps;
}
