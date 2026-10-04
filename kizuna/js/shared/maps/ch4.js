// 第4章「砂の海にしずむ星」の マップ
// コガネ地方（フィールド）・北の古井戸・かれた地下水路（Step 2）。王都・ピラミッドなどは Step 3 から
// 村や ダンジョンの 形は south-rows.js（1文字 = 1マス）
import { T, parseRows } from '../tiles.js?v=af8614e78ff4';
import { makeRng } from '../rng.js?v=af8614e78ff4';
import { npc } from './npc.js?v=af8614e78ff4';
import { SEA_PLACES } from './ch2.js?v=af8614e78ff4';
import {
  buildSouth, southZoneAt, southAreaName, southWeatherAt, southBgmAt, SOUTH_PLACES, SOUTH_POS, SOUTH_LANDING, LANDING_BEACH, OASIS2, OASIS_CAMP,
  STORM_Y, STORM_FLAG,
} from './south.js?v=af8614e78ff4';
import { HAMIL_ROWS, WELL_ROWS, CANAL1_ROWS, CANAL2_ROWS, CANAL3_ROWS } from './south-rows.js?v=af8614e78ff4';

const HAM = SOUTH_PLACES.hamil;
const H = (x, y) => [HAM.x + x, HAM.y + y];

// 第4章の マップの ID（セーブに のこるので かえない）
export const CH4_MAPS = ['south', 'north_well', 'canal1', 'canal2', 'canal3'];

// ───── かれた地下水路（Step 2）─────
// 入り口（フィールド。村の 南東）: 鉄の こうしは 村長ナディムに たのまれると（c4_canal）開く
export const CANAL_DOOR = { x: SOUTH_POS.canal.x, y: SOUTH_POS.canal.y - 1 };
export const CANAL_FLAG = 'c4_canal';
// 水門の レバー（フラグは しかけの もの。ものがたりの すすみぐあいでは ない）
export const CANAL_LEVERS = { c1: 'c4_cn1', c2a: 'c4_cn2a', c2b: 'c4_cn2b' };
// よろい大サソリを たおすと せきが くずれて、水路と 村の オアシスに 水が もどる
export const SCORPION_FLAG = STORM_FLAG;

// ルーラ・帰り道の羽で 行ける 第4章の 町と 村（村の 東の 門の 外に おりる）
export const SOUTH_TOWNS = {
  hamil: { name: HAM.name, map: 'south', x: HAM.x + HAM.w + 1, y: HAM.y + 9, rect: [HAM.x, HAM.y, HAM.w, HAM.h] },
};
Object.assign(SEA_PLACES, SOUTH_TOWNS);

// つぼ・たるを 調べた ときの 素材
export function ch4SearchMats(mapId) {
  if (mapId === 'south') return ['beast_fang', 'magic_powder', 'wind_feather'];
  if (mapId === 'north_well') return ['magic_powder', 'iron_shard'];
  if (mapId.startsWith('canal')) return ['magic_powder', 'iron_shard', 'pretty_shell'];
  return null;
}

// きらきら（コガネ地方）の 中み
export const SOUTH_SPARKLE_LOOT = {
  s_coast: [['herb', 3], ['moonherb', 2], ['star_shard', 3], ['pretty_shell', 2], ['seed_agi', 0.4]],
  s_dune: [['herb', 3], ['moonherb', 2], ['star_shard', 3], ['magic_powder', 2], ['seed_str', 0.4]],
  s_oasis: [['moonherb', 3], ['star_shard', 3], ['magic_water', 0.6], ['seed_mag', 0.4]],
};

// ───────────── コガネ地方 ─────────────
const SOUTH_NPCS = [
  // オアシスの村ハミル
  npc('nadim', '村長ナディム', H(6, 4), 'desert_elder', 'c4_nadim'),
  npc('c4_h_priest', '神父さま', H(23, 4), 'desert_priest', 'church'),
  npc('c4_h_inn', '宿屋のおかみ', H(3, 11), 'desert_f', 'c4_inn_hamil'),
  npc('c4_h_shop', 'よろず屋のおじさん', H(24, 11), 'desert_merchant', 'c4_shop_hamil'),
  // アミの お母さん（アミが 帰るまでは 北の 門で 待っている）
  npc('ami_mom_gate', 'アミのお母さん', H(16, 2), 'desert_f2', 'c4_ami_mom', { show: { not: ['c4_ami'] }, dir: 'up' }),
  npc('ami_mom', 'アミのお母さん', H(5, 19), 'desert_f2', 'c4_ami_mom', { show: { all: ['c4_ami'] } }),
  npc('ami', 'アミ', H(6, 22), 'ami', 'c4_ami', { show: { all: ['c4_ami'] }, wander: 1 }),
  npc('c4_h_guard', '村の見張り', H(28, 8), 'desert_m', 'c4_h_guard', { dir: 'left' }),
  npc('c4_h_oldman', '物知りのおじいさん', H(12, 8), 'desert_m2', 'c4_h_oldman', { wander: 1 }),
  npc('c4_h_woman', '水くみのおくさん', H(20, 15), 'desert_f', 'c4_h_woman', { dir: 'left' }),
  npc('c4_h_kid', 'アミの友だちのカリム', H(10, 20), 'desert_kid', 'c4_h_kid', { wander: 1, show: { not: ['@night'] } }),
  npc('c4_h_man', '井戸ほりのおじさん', H(17, 21), 'desert_m', 'c4_h_man', { dir: 'up' }),
  // 夜だけ: 広場で 月を 見る 旅人（夜の 砂ばくの 魔物の 話）
  npc('c4_n_watcher', '月を見る旅人', H(15, 16), 'caravan', 'c4_n_watcher', { show: { all: ['@night'] }, dir: 'up' }),

  // フィールド
  npc('c4_beach_trader', '旅の商人', [64, 9], 'caravan', 'c4_beach_trader', { wander: 1 }),
  npc('c4_camp_leader', 'キャラバンのかしら', [OASIS_CAMP.x + 3, OASIS_CAMP.y + 3], 'desert_merchant', 'c4_camp_leader', { dir: 'down' }),
  npc('c4_camp_kid', 'キャラバンの子ども', [OASIS_CAMP.x + 9, OASIS_CAMP.y + 9], 'desert_kid', 'c4_camp_kid', { wander: 1 }),
  // キャラバンの ラクダ
  npc('c4_camel1', 'ラクダ', [OASIS_CAMP.x + 2, OASIS_CAMP.y + 8], 'camel', 'c4_camel', { dir: 'right' }),
  npc('c4_camel2', 'ラクダ', [OASIS_CAMP.x + 8, OASIS_CAMP.y + 4], 'camel', 'c4_camel', { dir: 'left' }),
  npc('c4_camel3', 'ラクダ', [62, 9], 'camel', 'c4_camel', { dir: 'right' }),
];

// 宝箱（フィールドの 宝箱は 開けると きえる）
const SOUTH_CHESTS = [
  { id: 's_beach', x: 92, y: 8, item: 'moonherb', n: 2 },
  { id: 's_west', x: 6, y: 40, item: 'sand_cloak' },
  { id: 's_oasis2', x: OASIS2.x + 5, y: OASIS2.y + 2, item: 'seed_agi' },
  { id: 's_dune', x: 126, y: 20, gold: 600 },
  { id: 's_wellside', x: 6, y: 16, item: 'magic_water' },
  { id: 's_storm', x: 7, y: 55, item: 'revive_flower' },
];

// かんばん
const SOUTH_SIGNS = [
  { x: 69, y: 12, text: 'ここはコガネ地方の北の海辺。\n↙ オアシスの村ハミル\n↘ 小さなオアシス' },
  { x: HAM.x + HAM.w + 2, y: HAM.y + 7, text: 'オアシスの村ハミル' },
  { x: SOUTH_POS.well.x + 3, y: SOUTH_POS.well.y + 3, text: '北の古井戸\n（水がかれて、今はだれも使っていない）' },
  { x: 34, y: 56, text: 'この先、砂嵐のかべ。\n風がおさまるまで、通りぬけることはできない。' },
  { x: CANAL_DOOR.x - 3, y: CANAL_DOOR.y + 1, text: '王国の地下水路\n（王都サファラから、ハミルの村へ水を運ぶ水路）' },
];

// お店の かんばん（入り口の よこの かべ）
const NB = ([x, y], kind, name) => ({ x, y, kind, name });
const SOUTH_BOARDS = [
  NB(H(4, 15), 'inn', '宿屋'), NB(H(25, 14), 'general', 'よろず屋'), NB(H(22, 7), 'church', '教会'),
];

// やね
const SOUTH_ROOFS = [
  ...[[2, 2, 9, 7, 'sand'], [19, 2, 9, 6, 'clay'], [2, 10, 8, 6, 'clay'], [21, 10, 7, 5, 'canvas'], [2, 18, 6, 4, 'sand'], [22, 18, 6, 4, 'sand']]
    .map(([x, y, w, h, color]) => ({ x: HAM.x + x, y: HAM.y + y, w, h, color })),
];

// 地図に 出す なまえ
const SOUTH_LABELS = [
  ...Object.values(SOUTH_PLACES).map((p) => ({ name: p.name, x: p.x, y: p.y, w: p.w, h: p.h })),
  { name: LANDING_BEACH.name, x: LANDING_BEACH.x, y: LANDING_BEACH.y, w: LANDING_BEACH.w, h: LANDING_BEACH.h },
  { name: '北の古井戸', x: SOUTH_POS.well.x - 6, y: SOUTH_POS.well.y - 4, w: 12, h: 6 },
  { name: '小さなオアシス', x: OASIS_CAMP.x, y: OASIS_CAMP.y, w: OASIS_CAMP.w, h: OASIS_CAMP.h },
  { name: 'かれた地下水路', x: CANAL_DOOR.x - 5, y: CANAL_DOOR.y - 4, w: 11, h: 5 },
  { name: 'コガネ砂丘', x: 60, y: 30, w: 70, h: 24 },
  { name: '砂嵐のかべ', x: 8, y: STORM_Y[0] - 1, w: 128, h: STORM_Y[1] - STORM_Y[0] + 3 },
];

// きらきら（ひろえる 物）。砂ばく・海辺・オアシスの まわり（砂嵐のかべより 北）
const SPARKLE_GROUND = new Set([T.DESERT, T.SAND, T.GRASS, T.TALLGRASS, T.DIRT]);
function southSparkles(m) {
  const rng = makeRng(4404);
  const list = [];
  let tries = 0;
  while (list.length < 18 && tries++ < 8000) {
    const x = rng.int(4, m.w - 5), y = rng.int(4, STORM_Y[0] - 3);
    if (!SPARKLE_GROUND.has(m.tiles[y * m.w + x]) || m.gateAt?.has(y * m.w + x)) continue;
    const z = southZoneAt(x, y);
    if (z.startsWith('safe')) continue;
    if (list.some((s) => Math.abs(s.x - x) + Math.abs(s.y - y) < 12)) continue;
    list.push({ id: 'ssp' + list.length, x, y, zone: z });
  }
  return list;
}

// 地下水路の 入り口（砂岩の 岩の 中に 石の 門。こうしの 下が 階段）と、村の オアシスの 水
function canalEntrance(sb) {
  const set = (x, y, v) => { sb.tiles[y * sb.w + x] = v; };
  const { x: dx, y: dy } = CANAL_DOOR;
  for (let y = dy - 3; y <= dy; y++) {
    for (let x = dx - 2; x <= dx + 2; x++) set(x, y, Math.abs(x - dx) === 2 || y === dy - 3 ? T.SANDSTONE : T.CANAL_WALL);
  }
  set(dx, dy, T.GRATE);
  sb.gates.push({ x: dx, y: dy, closed: T.GRATE, open: T.STAIRS_DOWN, flag: CANAL_FLAG });
  // 門の 前は 歩ける 砂（岩・サボテンを どける）
  for (let y = dy + 1; y <= dy + 2; y++) for (let x = dx - 1; x <= dx + 1; x++) set(x, y, T.DESERT);
}
// よろい大サソリを たおすと、オアシスの かわいた どろ（水ぎわ）に 水が もどる
function oasisRefill(sb) {
  const out = [];
  HAMIL_ROWS.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== '=' || x < 11 || x > 18 || y < 10 || y > 16) return;
    const [gx, gy] = H(x, y);
    sb.gates.push({ x: gx, y: gy, closed: T.DIRT, open: T.WATER, flag: SCORPION_FLAG });
    out.push([gx, gy]);
  }));
  return out;
}

function buildField() {
  const sb = buildSouth();
  canalEntrance(sb);
  const refill = oasisRefill(sb);
  for (const s of SOUTH_SIGNS) sb.tiles[s.y * sb.w + s.x] = T.SIGN;
  // 砂嵐のかべを しらべると だいほん（道の ところ）
  const actions = [];
  for (const g of sb.gates) if (g.flag === STORM_FLAG && g.y === STORM_Y[0]) actions.push({ x: g.x, y: g.y, script: 'c4_sandstorm_wall', show: { not: [STORM_FLAG] } });
  // 村の かれかけた 井戸・オアシス
  actions.push({ x: H(17, 19)[0], y: H(17, 19)[1], script: 'c4_dry_well' });
  // オアシスの 水（ふちの かわいた どろに 立って しらべる）
  const dry = (x, y) => HAMIL_ROWS[y]?.[x] === '=';
  for (let y = 11; y <= 15; y++) for (let x = 11; x <= 18; x++) {
    if (HAMIL_ROWS[y][x] !== '~' || ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => dry(x + dx, y + dy))) continue;
    const [ax, ay] = H(x, y);
    actions.push({ x: ax, y: ay, script: 'c4_oasis_water' });
  }
  // 水が もどった あとの 水ぎわ（もとの かわいた どろ）
  for (const [ax, ay] of refill) actions.push({ x: ax, y: ay, script: 'c4_oasis_water', show: { all: [SCORPION_FLAG] } });
  // 地下水路の 入り口の 鉄の こうし（開く まで）
  actions.push({ x: CANAL_DOOR.x, y: CANAL_DOOR.y, script: 'c4_canal_grate', show: { not: [CANAL_FLAG] } });
  const wl = SOUTH_POS.well;
  const m = {
    id: 'south', name: 'コガネ地方', kind: 'field', bgm: 'desert', dark: false,
    w: sb.w, h: sb.h, tiles: sb.tiles, gates: sb.gates,
    npcs: SOUTH_NPCS, chests: SOUTH_CHESTS, signs: SOUTH_SIGNS, boards: SOUTH_BOARDS, actions,
    warps: [
      { x: wl.x, y: wl.y, to: { map: 'north_well', x: 4.5, y: 2.6, dir: 'down' } },
      { x: CANAL_DOOR.x, y: CANAL_DOOR.y, to: { map: 'canal1', x: 14.5, y: 20.4, dir: 'up' } },
    ],
    triggers: [
      // 竜を おりた ところ（空を とべる 場所の 中なら どこでも）
      { id: 'c4_arrive', x: SOUTH_LANDING.x, y: SOUTH_LANDING.y, w: SOUTH_LANDING.w, h: SOUTH_LANDING.h, script: 'c4_arrive', show: { all: ['c4_start'], not: ['c4_arrive'] } },
      { id: 'c4_hamil', x: HAM.x, y: HAM.y, w: HAM.w, h: HAM.h, script: 'c4_hamil_arrive', show: { all: ['c4_start'], not: ['c4_hamil'] } },
    ],
    roofs: SOUTH_ROOFS,
    zoneAt: southZoneAt, areaName: southAreaName, bgmAt: southBgmAt, weatherAt: southWeatherAt,
    labels: SOUTH_LABELS,
    spawnCounts: { s_coast: 6, s_dune: 16, s_oasis: 6 },
    // フィールドの 宝箱が 出る ところ（ここから 歩いて 行ける ところだけ）
    fcStart: [72, 11],
  };
  m.gateAt = new Map(m.gates.map((g) => [g.y * m.w + g.x, g]));
  m.sparkles = southSparkles(m);
  return m;
}

// ───────────── 北の古井戸 ─────────────
// アミの いる へや（右下）・入り口の へやは 魔物が 出ない
const WELL_AMI = { x: 20, y: 18, w: 12, h: 8 };
function northWell() {
  const t = parseRows(WELL_ROWS);
  const wl = SOUTH_POS.well;
  return {
    id: 'north_well', name: '北の古井戸', kind: 'dungeon', bgm: 'cave', dark: true, theme: 'sand',
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [
      // アミと、アミを かこむ 魔物たち（たおすと いなくなる）
      npc('ami_well', 'アミ', [24, 24], 'ami', 'c4_ami_event', { show: { not: ['c4_ami'] }, dir: 'up' }),
      npc('well_scorp1', 'サソリ兵', [23, 22], 'mon:scorpion_soldier', 'c4_ami_event', { show: { not: ['c4_ami'] }, dir: 'down' }),
      npc('well_scorp2', 'サソリ兵', [26, 23], 'mon:scorpion_soldier', 'c4_ami_event', { show: { not: ['c4_ami'] }, dir: 'left' }),
      npc('well_slime', '砂ぷるりん', [25, 21], 'mon:sand_slime', 'c4_ami_event', { show: { not: ['c4_ami'] }, dir: 'down' }),
    ],
    chests: [
      { id: 'nw_a', x: 2, y: 13, item: 'magic_water' },
      { id: 'nw_b', x: 22, y: 1, item: 'seed_def' },
      { id: 'nw_c', x: 22, y: 15, item: 'magic_powder', n: 2 },
      { id: 'nw_d', x: 5, y: 24, gold: 500 },
    ],
    signs: [],
    warps: [{ x: 4, y: 1, to: { map: 'south', x: wl.x + 0.5, y: wl.y + 1.6, dir: 'down' } }],
    triggers: [
      { id: 'c4_well_enter', x: 2, y: 2, w: 6, h: 4, script: 'c4_well_enter', show: { all: ['c4_nadim'], not: ['c4_well'] } },
      { id: 'c4_ami_room', x: WELL_AMI.x + 4, y: WELL_AMI.y, w: 8, h: 3, script: 'c4_ami_event', show: { not: ['c4_ami'] } },
    ],
    actions: [],
    sparkles: [],
    roofs: [],
    zoneAt: (x, y) => {
      if (x >= 2 && y >= 1 && x <= 7 && y <= 5) return 'safe:entry';
      if (x >= WELL_AMI.x && y >= WELL_AMI.y && x < WELL_AMI.x + WELL_AMI.w && y < WELL_AMI.y + WELL_AMI.h) return 'safe:ami';
      return 's_well';
    },
    areaName: () => '北の古井戸',
    spawnCounts: { s_well: 6 },
  };
}
// ───────────── かれた地下水路（Step 2）─────────────
// この マップだけの 文字（tiles.js の LEGEND より 先に 見る）
const CANAL_LEGEND = {
  '#': T.CANAL_WALL, '.': T.CANAL_FLOOR, '_': T.CANAL_BED, '~': T.CANAL_WATER, 'H': T.SLUICE, 'h': T.SLUICE_OPEN, 'D': T.DAM,
};
// マスの まとまりを しかけに する（closed → open。invert: フラグが たつと しまる）。もとの マスは はじめの すがた
function gateRect(m, x0, y0, x1, y1, closed, open, flag, invert = false) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      m.tiles[y * m.w + x] = invert ? open : closed;
      m.gates.push(invert ? { x, y, closed, open, flag, invert: true } : { x, y, closed, open, flag });
    }
  }
}
// たまり水: フラグで 水 ⇄ かわいた 底（invert: はじめは かわいていて、フラグで 水が 入る）
const pool = (m, x0, y0, x1, y1, flag, invert = false) => gateRect(m, x0, y0, x1, y1, T.CANAL_WATER, T.CANAL_BED, flag, invert);
function lever(m, x, y, flag, script) {
  m.gates.push({ x, y, closed: T.LEVER, open: T.LEVER_ON, flag });
  m.actions.push({ x, y, script });
}
const zoneRect = (rects, fallback) => (x, y) => {
  for (const [x0, y0, x1, y1, z] of rects) if (x >= x0 && y >= y0 && x <= x1 && y <= y1) return z;
  return fallback;
};
function canalMap(id, name, rows, opts) {
  const t = parseRows(rows, CANAL_LEGEND);
  return {
    id, name, kind: 'dungeon', bgm: 'canal', dark: true, theme: 'canal',
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: [], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [],
    areaName: () => name,
    spawnCounts: {},
    ...opts,
  };
}

function canal() {
  const c1 = canalMap('canal1', 'かれた地下水路　1階', CANAL1_ROWS, {
    chests: [
      { id: 'cn1_ne', x: 26, y: 2, item: 'seed_def' },
      { id: 'cn1_hall', x: 27, y: 18, item: 'magic_water' },
      { id: 'cn1_nw', x: 8, y: 2, gold: 900 },
    ],
    warps: [
      { x: 14, y: 21, to: { map: 'south', x: CANAL_DOOR.x + 0.5, y: CANAL_DOOR.y + 1.6, dir: 'down' } },
      { x: 5, y: 3, to: { map: 'canal2', x: 21.5, y: 35.4, dir: 'up' } },
    ],
    triggers: [{ id: 'c4_canal_enter', x: 11, y: 16, w: 7, h: 4, script: 'c4_canal_enter', show: { not: ['c4_canal_seen'] } }],
    zoneAt: zoneRect([[11, 17, 17, 21, 'safe:entry'], [2, 1, 9, 5, 'safe:stairs']], 's_canal'),
    spawnCounts: { s_canal: 6 },
  });
  // 北の 2つの 通路の たまり水: レバーで 左が かわき、右に 水が 入る
  pool(c1, 4, 6, 6, 8, CANAL_LEVERS.c1);
  pool(c1, 21, 6, 23, 8, CANAL_LEVERS.c1, true);
  lever(c1, 14, 11, CANAL_LEVERS.c1, 'c4_cn1_lever');

  const c2 = canalMap('canal2', 'かれた地下水路　2階', CANAL2_ROWS, {
    chests: [
      { id: 'cn2_ne', x: 36, y: 8, item: 'sand_cloak' },
      { id: 'cn2_w', x: 5, y: 22, item: 'seed_str' },
      { id: 'cn2_e', x: 26, y: 23, item: 'moonherb', n: 3 },
      { id: 'cn2_nw', x: 17, y: 9, item: 'revive_flower' },
      { id: 'cn2_hall', x: 13, y: 33, gold: 1200 },
    ],
    warps: [
      { x: 21, y: 36, to: { map: 'canal1', x: 5.5, y: 4.5, dir: 'down' } },
      { x: 12, y: 3, to: { map: 'canal3', x: 11.5, y: 18.4, dir: 'up' } },
    ],
    triggers: [{ id: 'c4_canal2_enter', x: 18, y: 31, w: 9, h: 5, script: 'c4_canal2_enter', show: { not: ['c4_canal2_seen'] } }],
    zoneAt: zoneRect([[18, 32, 25, 36, 'safe:stairs'], [6, 2, 18, 5, 'safe:stairs']], 's_canal2'),
    spawnCounts: { s_canal2: 9 },
  });
  // 下の 水路: 左（P1）は レバー1で かわき、右（Q1）は レバー1で 水が 入る。上の 水路の P2・Q2 は レバー2
  pool(c2, 9, 25, 11, 27, CANAL_LEVERS.c2a);
  pool(c2, 32, 25, 34, 27, CANAL_LEVERS.c2a, true);
  pool(c2, 9, 12, 11, 14, CANAL_LEVERS.c2b);
  pool(c2, 32, 12, 34, 14, CANAL_LEVERS.c2b, true);
  lever(c2, 26, 31, CANAL_LEVERS.c2a, 'c4_cn2a_lever');
  lever(c2, 36, 22, CANAL_LEVERS.c2b, 'c4_cn2b_lever');

  const c3 = canalMap('canal3', 'かれた地下水路　おく', CANAL3_ROWS, {
    npcs: [npc('armor_scorpion', 'よろい大サソリ', [12, 6], 'mon:armor_scorpion', 'c4_scorpion_event', { big: true, show: { not: [SCORPION_FLAG] } })],
    warps: [{ x: 11, y: 19, to: { map: 'canal2', x: 12.5, y: 4.5, dir: 'down' } }],
    triggers: [{ id: 'c4_scorpion_room', x: 3, y: 9, w: 18, h: 4, script: 'c4_scorpion_event', show: { not: [SCORPION_FLAG] } }],
    zoneAt: () => 'safe:boss',
  });
  // サソリを たおすと せきが くずれて、水路に 水が もどる
  gateRect(c3, 4, 3, 19, 3, T.DAM, T.CANAL_WATER, SCORPION_FLAG);
  gateRect(c3, 4, 4, 19, 12, T.CANAL_BED, T.CANAL_WATER, SCORPION_FLAG);
  return { canal1: c1, canal2: c2, canal3: c3 };
}

export function buildCh4Maps() {
  return { south: buildField(), north_well: northWell(), ...canal() };
}

export { SOUTH_POS };
