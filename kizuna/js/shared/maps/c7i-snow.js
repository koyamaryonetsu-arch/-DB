// 第7章 Step 5・6（A: 世界と物語）「千年前の シロガネ地方」（c7i_snow）と、今の シロガネ地方（north）に たす もの（maps/c7.js の attachCh7 で まぜる）
// ※ ネタバレ注意（docs/plan-ch7.md の 8）
// ・c7i_snow … 今の シロガネ地方（north。第3章）と おなじ 大きさ・おなじ 座標。今の 地図から 作る（手で ぜんぶ かかない）:
//   雪と 氷の 山は おなじ。鉱山の町カナトコ・温泉の里ユノハは まだ なく、雪原と 湯けむりの 谷。鉱山・氷の洞窟・炎の山の 入口も まだ ない
//   今の 竜守りの村の まん中に「白雪の里」（竜守りの村の はじまり。maps/c7i-village-rows.js）
//   今の 竜の試練の神殿の 場所に「氷の竜の城」（中は maps/c7i-castle.js）。城の 前は 黒い いばら（いばらの魔女マレフィナの のろい。中ボス）
//   竜の門は まだ なく、星竜山への 道は 雪の 岩で ふさがっている。なだれ・くずれた トンネルは まだ ない（通れる）
// ・時の砂時計（world/time-glass.js）: north ⇔ c7i_snow（timePair）。カイが 仲間に なった あと、トキネの 話を 聞くと 使える（c7_snow。map.timeSpot）
// ・時をこえる手紙（data/sidequests-c7i.js）: 千年前で うめる 所と、今の おなじ 座標で 見つける 所（白雪の里・白銀の湖の 岸・湯けむりの谷）
// だいほんは data/story-c7i.js
import { T, TILE_INFO } from '../tiles.js?v=5520dc01c4ec';
import { hash2 } from '../rng.js?v=5520dc01c4ec';
import { npc } from './npc.js?v=5520dc01c4ec';
import { parseRows16, wideTiles } from './past.js?v=5520dc01c4ec';
import { NORTH_PLACES, NORTH_POS, NORTH_ARRIVE, LAKE3, northWeatherAt } from './north.js?v=5520dc01c4ec';
import { VILLAGE7I_ROWS, VILLAGE7I_SPOTS, VILLAGE7I_ROOFS } from './c7i-village-rows.js?v=5520dc01c4ec';
import {
  C7I, ARRIVE7I, C7I_SNOW, PRESENT_SNOW, VILLAGE7I, CASTLE_WALL, CASTLE_DOOR, THORNS, WITCH_ZONE, WITCH_POS, LETTER7I, LETTER7I_SIDE,
} from './c7i-flags.js?v=5520dc01c4ec';
import { c7icArrive } from './c7i-castle.js?v=5520dc01c4ec';

export const C7I_SNOW_NAME = '千年前のシロガネ地方';
const VIL = NORTH_PLACES.dragon_village, KAN = NORTH_PLACES.kanatoko, YUN = NORTH_PLACES.yunoha;
const V = (x, y) => ({ x: VILLAGE7I.x + x, y: VILLAGE7I.y + y });
const inRect = (x, y, r, pad = 0) => x >= r.x - pad && y >= r.y - pad && x < r.x + r.w + pad && y < r.y + r.h + pad;
// 千年前の 名前（湯けむりの谷 … 今の 温泉の里ユノハ・雪のひろ野 … 今の 鉱山の町カナトコ）
export const VALLEY7I = { ...YUN, name: '湯けむりの谷' };
export const FIELD7I = { ...KAN, name: '雪のひろ野' };

// ───────────── だいじな 場所 ─────────────
export const C7I_POS = {
  villageIn: V(VILLAGE7I_SPOTS.plaza.x, VILLAGE7I_SPOTS.plaza.y), // 里の 大通りの まん中
  elder: V(VILLAGE7I_SPOTS.elder.x, VILLAGE7I_SPOTS.elder.y),
  keeper: V(VILLAGE7I_SPOTS.keeper.x, VILLAGE7I_SPOTS.keeper.y),
  shrine: V(VILLAGE7I_SPOTS.shrine.x, VILLAGE7I_SPOTS.shrine.y),
  altar: V(VILLAGE7I_SPOTS.altar.x, VILLAGE7I_SPOTS.altar.y),
  kai: V(VILLAGE7I_SPOTS.kai.x, VILLAGE7I_SPOTS.kai.y),
  glass: { x: 64, y: 71 }, // 目標の しるし（今の 竜守りの村の 南の 門の 外の 道。どちらの 時代も 立てる）
  gate: { x: 46, y: 33 }, // 城の 前の 広場（中ボスの 場面で 立つ 所）
};
// 時をこえる手紙の 場所（千年前で うめる 所と 今で 見つける 所は おなじ 座標）
//   1 … 白雪の里の 広場（今の 竜守りの村の 広場）/ 2 … 白銀の湖の 東の 岸（今も おなじ）/ 3 … 湯けむりの谷（今の 温泉の里ユノハ）
export const LETTER7I_SPOTS = { 1: { x: 60, y: 55 }, 2: { x: 43, y: 56 }, 3: { x: 101, y: 85 } };
// たのむ 人（千年前）
export const LETTER7I_ASKERS = { 1: 'c7i_kid', 2: 'c7i_fisher', 3: 'c7i_traveler' };
export const LETTER7I_PLACES = { 1: '白雪の里', 2: '白銀の湖の岸', 3: '湯けむりの谷' };
export const LETTER7I_NOW_PLACES = { 1: '竜守りの村の広場', 2: '白銀の湖の岸', 3: '温泉の里ユノハ' };

// ───────────── 千年前の シロガネ地方を 今の 地図から 作る ─────────────
const ROAD = new Set([T.PLAZA, T.STONE_PATH, T.DIRT, T.RAIL, T.RAIL_BRIDGE, T.RUBBLE_WALL, T.SNOW_PATH]);
const BUILT = new Set([T.WALL_STONE, T.WALL_WOOD, T.FLOOR_WOOD, T.FLOOR_STONE, T.DOOR, T.COUNTER, T.TABLE, T.CHAIR, T.BED, T.SHELF, T.POT, T.BARREL,
  T.WELL, T.SIGN, T.STATUE, T.ALTAR, T.STAR_ALTAR, T.CARPET, T.FIREPLACE, T.BOOKSHELF, T.CRATE, T.STAIRS_UP, T.STAIRS_DOWN, T.PILLAR, T.FENCE,
  T.SHRINE_FLOOR, T.MINE_BEAM, T.BRAZIER, T.BRAZIER_LIT, T.RAIL_STOP, T.SNOW_WALL, T.FLAME_WALL, T.LOCKED_DOOR, T.LAMP, T.FOUNTAIN, T.HEDGE]);
function snowTiles(present) {
  const W = present.w, H = present.h;
  const t = wideTiles(present.tiles);
  const get = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? t[y * W + x] : T.SNOW_ROCK);
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < W && y < H) t[y * W + x] = v; };
  const lava = (x, y) => x >= 86 && y >= 62;
  // 1) 町・村・鉱山・神殿の たてものは まだ ない（雪原）・道は 雪の 道・洞窟の 入口は まだ ない・竜の門は まだ ない（雪の 岩）
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = present.tiles[y * W + x];
      if (v === T.CAVE_ENTRANCE) set(x, y, lava(x, y) ? T.ASH_ROCK : T.SNOW_ROCK);
      else if (v === T.DRAGON_GATE) set(x, y, T.SNOW_ROCK);
      else if (ROAD.has(v)) set(x, y, T.SNOW_PATH);
      else if (BUILT.has(v)) set(x, y, lava(x, y) && !inRect(x, y, YUN) ? T.ASH : T.SNOW);
    }
  }
  // 雪のひろ野（今の カナトコ）には もみの木が 少し
  for (let y = KAN.y; y < KAN.y + KAN.h; y++) for (let x = KAN.x; x < KAN.x + KAN.w; x++) {
    if (get(x, y) !== T.SNOW) continue;
    let road = false;
    for (let dy = -1; dy <= 1 && !road; dy++) for (let dx = -1; dx <= 1; dx++) if (get(x + dx, y + dy) === T.SNOW_PATH) { road = true; break; }
    if (!road && hash2(x, y, 7301) < 0.07) set(x, y, T.SNOW_PINE);
  }
  // 2) 白雪の里（今の 竜守りの村の まん中）。村の まわりは 雪原・道で 今の 4つの 門と つなぐ
  for (let y = VIL.y; y < VIL.y + VIL.h; y++) for (let x = VIL.x; x < VIL.x + VIL.w; x++) {
    const edge = x === VIL.x || y === VIL.y || x === VIL.x + VIL.w - 1 || y === VIL.y + VIL.h - 1;
    set(x, y, edge && hash2(x, y, 7303) < 0.35 ? T.SNOW_PINE : hash2(x, y, 7305) < 0.1 ? T.DEEP_SNOW : T.SNOW);
  }
  const p = parseRows16(VILLAGE7I_ROWS);
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) set(VILLAGE7I.x + x, VILLAGE7I.y + y, p.tiles[y * p.w + x]);
  const path = (x0, y0, x1, y1) => {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) set(x, y, T.SNOW_PATH);
  };
  const VS = VILLAGE7I_SPOTS;
  const N0 = V(VS.north.x, VS.north.y), S0 = V(VS.south.x, VS.south.y), W0 = V(VS.west.x, VS.west.y), E0 = V(VS.east.x, VS.east.y);
  path(N0.x, VIL.y, N0.x + 1, N0.y - 1); // 北の 門（城・星竜山の ほう）
  path(S0.x, S0.y + 1, S0.x + 1, VIL.y + VIL.h - 1); // 南の 門（雪原の広場の ほう）
  path(VIL.x, W0.y, W0.x - 1, W0.y); path(VIL.x, W0.y, VIL.x, 58); // 西の 門（白銀の湖の ほう）
  path(E0.x + 1, E0.y, VIL.x + VIL.w - 1, E0.y); path(VIL.x + VIL.w - 1, E0.y, VIL.x + VIL.w - 1, 58); // 東の 門（雪のひろ野の ほう）
  // 3) 氷の竜の城（今の 竜の試練の神殿の 場所。白く 光る 氷の かべ・かどの 塔・とびらは 南）
  const C = CASTLE_WALL;
  for (let y = C.y; y < C.y + C.h; y++) for (let x = C.x; x < C.x + C.w; x++) {
    const tower = (x <= C.x + 1 || x >= C.x + C.w - 2) && y >= C.y + 2;
    if (get(x, y) === T.SNOW_ROCK && y < C.y + 3) continue;
    set(x, y, tower ? T.ICE_BLOCK : T.ICE_WALL);
  }
  set(CASTLE_DOOR.x, CASTLE_DOOR.y, T.RUIN_DOOR);
  // 城の 前: 氷の 柱（今の かがり火の 所）・黒い いばら（魔女の のろい。gate で 消える）・城の 前の 広場
  for (let y = THORNS.y; y <= WITCH_ZONE.y + WITCH_ZONE.h; y++) for (let x = WITCH_ZONE.x; x < WITCH_ZONE.x + WITCH_ZONE.w; x++) {
    const v = get(x, y);
    if (v !== T.SNOW_ROCK && v !== T.ICE_WALL && v !== T.ICE_BLOCK) set(x, y, hash2(x, y, 7307) < 0.25 ? T.DEEP_SNOW : T.SNOW);
  }
  path(CASTLE_DOOR.x, THORNS.y, CASTLE_DOOR.x + 1, WITCH_ZONE.y + WITCH_ZONE.h);
  for (const x of [41, 52]) set(x, THORNS.y, T.ICE_BLOCK);
  for (let x = THORNS.x[0]; x <= THORNS.x[1]; x++) set(x, THORNS.y, T.C7I_THORN);
  return t;
}

// ───────────── 千年前の 人（NPC）─────────────
function snowNpcs() {
  const at = (q) => [q.x, q.y];
  const VS = VILLAGE7I_SPOTS;
  return [
    // 白雪の里
    npc('c7i_elder', '里長ハクロウ', at(C7I_POS.elder), 'dragon_elder', 'c7i_elder', { dir: 'right' }),
    npc('c7i_inn', '宿屋のおかみ', at(V(VS.inn.x, VS.inn.y)), 'snow_f', 'c7i_inn'),
    npc('c7i_priest', '竜のほこらの神官', at(C7I_POS.shrine), 'shrine_priest', 'c7i_priest', { dir: 'right' }),
    npc('c7i_weapon', '武器屋', at(V(VS.weapon.x, VS.weapon.y)), 'snow_m', 'c7i_weapon'),
    npc('c7i_armor', '防具屋', at(V(VS.armor.x, VS.armor.y)), 'snow_f', 'c7i_armor'),
    npc('c7i_item', '道具屋', at(V(VS.item.x, VS.item.y)), 'snow_girl', 'c7i_item'),
    npc('c7i_keeper', '竜の世話係ユキノ', at(C7I_POS.keeper), 'yukina', 'c7i_keeper', { dir: 'left' }),
    npc('c7i_kid', '白雪の里の子ども', at(V(6, 8)), 'snow_kid', 'c7i_kid', { wander: 2 }),
    npc('c7i_town1', 'かりゅうど', at(V(16, 6)), 'snow_hunter', 'c7i_town1', { wander: 1 }),
    npc('c7i_town2', '毛糸をあむおばあさん', at(V(8, 11)), 'snow_f', 'c7i_town2'),
    npc('c7i_town3', '里のむすめ', at(V(19, 8)), 'snow_girl', 'c7i_town3', { wander: 1 }),
    // 里で 待っている カイ（c7_frost 〜 c7_witch。城の 前の 場面から いっしょ）
    npc('c7i_kai', 'カイ', at(C7I_POS.kai), 'kai', 'c7i_kai', { dir: 'up', show: { all: [C7I.frost], not: [C7I.witch] } }),
    // 白銀の湖の 漁師（時をこえる手紙 2）・湯けむりの谷の 旅人（時をこえる手紙 3）
    npc('c7i_fisher', '湖の若い漁師', [41, 57], 'snow_m', 'c7i_fisher', { dir: 'left' }),
    npc('c7i_traveler', '湯けむりの旅人', [99, 85], 'onsen_m', 'c7i_traveler', { dir: 'right' }),
    // 城の 前の いばらの魔女（中ボス。B の きまった 戦い c7_witch。大きな 人の え）
    npc('c7i_witch_npc', 'いばらの魔女', [WITCH_POS.x, WITCH_POS.y], 'c7i_witch_npc', 'c7i_witch_event', { big: true, show: { not: [C7I.witch] } }),
  ];
}

// 町や 家の 中（時の砂時計が 使えない）
export const C7I_TOWNS = [VILLAGE7I];
export const NOW_TOWNS7I = [VIL, KAN, YUN];

function snowZone(x, y) {
  if (inRect(x, y, VILLAGE7I, 1)) return 'safe:village';
  if (inRect(x, y, CASTLE_WALL, 2) || inRect(x, y, WITCH_ZONE, 2)) return 'safe:castle';
  if (y >= 86 && x >= 46 && x <= 82) return 'safe:field'; // 南の 雪原の広場（着いた 所）
  return 't7_snow';
}
function snowArea(x, y) {
  if (inRect(x, y, VILLAGE7I)) return VILLAGE7I.name;
  if (inRect(x, y, CASTLE_WALL, 2) || inRect(x, y, WITCH_ZONE)) return '氷の竜の城';
  if (inRect(x, y, YUN)) return VALLEY7I.name;
  if (inRect(x, y, KAN)) return FIELD7I.name;
  return C7I_SNOW_NAME;
}

function buildSnow(maps) {
  const present = maps[PRESENT_SNOW];
  const t = snowTiles(present);
  const m = {
    id: C7I_SNOW, name: C7I_SNOW_NAME, kind: 'field', bgm: 'c7i_snow', dark: false,
    // 千年前: 少し セピアがかった 色（第6章の 千年前・第1幕・第2幕と おなじ）
    past: true, theme: 'past', dusk: { color: 'rgba(150, 110, 60, 0.10)' },
    sky3d: { bg: '#bcd4ec', fog: 0xdce8f4 },
    timePair: PRESENT_SNOW,
    w: present.w, h: present.h, tiles: t, gates: [],
    npcs: snowNpcs(), chests: [], signs: [], warps: [], boards: [], triggers: [], actions: [], sparkles: [], links: [],
    roofs: VILLAGE7I_ROOFS.map(([x, y, w, h, color]) => ({ x: VILLAGE7I.x + x, y: VILLAGE7I.y + y, w, h, color })),
    labels: [
      { name: VILLAGE7I.name, x: VILLAGE7I.x, y: VILLAGE7I.y, w: VILLAGE7I.w, h: VILLAGE7I.h },
      { name: '氷の竜の城', x: CASTLE_WALL.x, y: CASTLE_WALL.y, w: CASTLE_WALL.w, h: CASTLE_WALL.h },
      { name: '白銀の湖', x: LAKE3.x - LAKE3.rx, y: LAKE3.y - LAKE3.ry, w: LAKE3.rx * 2, h: LAKE3.ry * 2 },
      { name: VALLEY7I.name, x: YUN.x, y: YUN.y, w: YUN.w, h: YUN.h },
      { name: FIELD7I.name, x: KAN.x, y: KAN.y, w: KAN.w, h: KAN.h },
      { name: '炎の山', x: 114, y: 92, w: 16, h: 12 },
    ],
    zoneAt: snowZone, areaName: snowArea, weatherAt: northWeatherAt,
    spawnCounts: { t7_snow: 14 },
    // 里の 中は 雪の 村の 曲。城の 前は 城の 曲
    bgmAt: (x, y) => (inRect(x, y, VILLAGE7I) ? 'snowtown' : inRect(x, y, CASTLE_WALL, 3) || inRect(x, y, WITCH_ZONE) ? 'c7i_castle' : 'c7i_snow'),
    noFlyText: '風の笛をふいた！\nしかし、何も起こらなかった…\n（千年前の空には、アステルは来られないようだ。今へは、時の砂時計でもどろう）',
    timeNoUse: (x, y) => (C7I_TOWNS.some((r) => inRect(x, y, r)) ? 'town' : null),
    fcStart: [C7I_POS.villageIn.x, C7I_POS.villageIn.y],
    timeHome: [C7I_POS.villageIn.x, C7I_POS.villageIn.y],
  };
  // 城の とびら（いばらの 先。中ボスを たおすと いばらが 消える）
  const D = CASTLE_DOOR;
  m.warps.push({ x: D.x, y: D.y, to: c7icArrive(1) });
  m.links.push({ x: D.x, y: D.y, to: 'c7i_castle_1f' });
  for (let x = THORNS.x[0]; x <= THORNS.x[1]; x++) {
    m.gates.push({ x, y: THORNS.y, closed: T.C7I_THORN, open: T.SNOW_PATH, flag: C7I.witch });
    m.actions.push({ x, y: THORNS.y, script: 'c7i_thorns', show: { not: [C7I.witch] } });
  }
  // はじめて 千年前の シロガネ地方に 来た（どこに 着いても）・里に 着いた（c7_frost）・城の 前の 魔女（c7_witch）
  m.triggers.push({ id: 'c7i_arrive', x: 0, y: 0, w: m.w, h: m.h, script: 'c7i_arrive', show: { all: [C7I.snow], not: [ARRIVE7I] } });
  m.triggers.push({ id: 'c7i_frost_arrive', x: VILLAGE7I.x, y: VILLAGE7I.y, w: VILLAGE7I.w, h: VILLAGE7I.h, script: 'c7i_frost_arrive', show: { all: [C7I.snow], not: [C7I.frost] } });
  m.triggers.push({ id: 'c7i_witch_event', ...WITCH_ZONE, script: 'c7i_witch_event', show: { all: [C7I.frost], not: [C7I.witch] } });
  // 竜のほこらの 祭だん（記録）・井戸・竜の 石像
  m.actions.push({ ...C7I_POS.altar, script: 'c7i_altar' }, { ...V(VILLAGE7I_SPOTS.well.x, VILLAGE7I_SPOTS.well.y), script: 'c7i_well' });
  for (const s of VILLAGE7I_SPOTS.statues) m.actions.push({ ...V(s.x, s.y), script: 'c7i_statue' });
  // かんばん
  m.signs.push({ x: VILLAGE7I.x + 12, y: VILLAGE7I.y - 1, text: '木の札だ。\n「白雪の里　竜とともに、雪とともに」' });
  m.signs.push({ x: 50, y: 36, text: '古い石の札だ。\n「↑ 氷の竜の城　竜の休む城。さわがしくするべからず」' });
  m.signs.push({ x: 62, y: 72, text: '木の札だ。\n「↑ 白雪の里」' });
  for (const s of m.signs) m.tiles[s.y * m.w + s.x] = T.SIGN;
  const NB = ([x, y], kind, name) => ({ x: VILLAGE7I.x + x, y: VILLAGE7I.y + y, kind, name });
  m.boards.push(NB([5, 5], 'inn', '宿屋'), NB([18, 5], 'general', '里の店'), NB([12, 4], 'temple', '竜のほこら'));
  // フィールドの 小さな 宝箱（道具）
  m.chests.push({ id: 'c7i_ow0', x: 30, y: 70, item: 'magic_water', n: 2 }, { id: 'c7i_ow1', x: 104, y: 46, item: 'seed_def', n: 1 }, { id: 'c7i_ow2', x: 96, y: 80, item: 'revive_flower', n: 2 });
  // 時をこえる手紙: うめる 所（千年前。たのまれた あと・うめる まで）
  for (const k of LETTER7I_SIDE) {
    const q = LETTER7I_SPOTS[k];
    m.npcs.push(npc(`c7i_bury_${k}`, '手紙をうめる場所', [q.x, q.y], 'capsule_hole', `c7i_letter_bury_${k}`, { solid: false, show: { all: [LETTER7I.start(k)], not: [LETTER7I.bury(k)] } }));
  }
  // 宝箱・手紙の 場所・人の 立つ マスは 歩ける ままに
  for (const c of [...m.chests, ...Object.values(LETTER7I_SPOTS), ...m.npcs.filter((n) => !n.big)]) {
    const k = c.y * m.w + c.x;
    if (TILE_INFO[m.tiles[k]]?.solid) m.tiles[k] = T.SNOW;
  }
  return m;
}

// ───────────── 今の シロガネ地方（north）に たす もの ─────────────
function addPresent(maps) {
  const s = maps[PRESENT_SNOW];
  s.timePair = C7I_SNOW;
  s.timeNoUse = (x, y) => (NOW_TOWNS7I.some((r) => inRect(x, y, r)) ? 'town' : null);
  s.timeHome = [Math.floor(NORTH_ARRIVE.x), Math.floor(NORTH_ARRIVE.y)];
  // カイが 仲間に なった あと、トキネの 話を 聞くまでは、砂時計の 砂が 鳴る だけ（world/time-glass.js の GLASS_TEXT.c7iwait。story-c7i.js が たす）
  s.timeSpot = (x, y, has) => (has(C7I.snow) ? '' : 'c7iwait');
  // 時をこえる手紙: 見つける 所（今。千年前で うめた あと・見つける まで）
  for (const k of LETTER7I_SIDE) {
    const q = LETTER7I_SPOTS[k];
    s.npcs.push(npc(`c7i_dig_${k}`, '時をこえる手紙', [q.x, q.y], 'capsule_spot', `c7i_letter_dig_${k}`, { solid: false, show: { all: [LETTER7I.bury(k)], not: [LETTER7I.found(k)] } }));
  }
}

export const C7I_SNOW_MAPS = [C7I_SNOW];
export function attachC7iSnow(maps) {
  addPresent(maps);
  maps[C7I_SNOW] = buildSnow(maps);
}
export { inRect, NORTH_POS };
